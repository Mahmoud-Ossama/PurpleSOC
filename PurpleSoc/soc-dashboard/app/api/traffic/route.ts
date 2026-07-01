import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { buildDateFilter } from "@/lib/utils";
import type { PaginatedResponse } from "@/types/api";
import type { TrafficRecord } from "@/types/traffic";

export const dynamic = "force-dynamic";

const PROTO_MAP: Record<string, number> = { ICMP:1, TCP:6, UDP:17, SSH:22, HTTP:80, HTTPS:443 };

async function getIpsByGeo(
  db: Awaited<ReturnType<typeof import("@/lib/mongodb").getDb>>,
  country?: string, city?: string
): Promise<string[] | null> {
  if (!country && !city) return null;
  const filter: Record<string, unknown> = {};
  if (country) filter["country"] = { $regex: country, $options: "i" };
  if (city)    filter["city"]    = { $regex: city,    $options: "i" };
  const geos = await db.collection("geo_cache").find(filter).project({ ip:1 }).limit(500).toArray();
  return geos.map(g => String(g.ip));
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const srcIp    = sp.get("srcIp");
    const dstIp    = sp.get("dstIp");
    const port     = sp.get("port");
    const protocol = sp.get("protocol");
    const label    = sp.get("label");
    const from     = sp.get("from");
    const to       = sp.get("to");
    const range    = sp.get("range") ?? "24h";
    const country  = sp.get("country") ?? "";
    const city     = sp.get("city")    ?? "";
    const page     = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const pageSize = Math.min(100, parseInt(sp.get("pageSize") ?? "100"));
    const sortField = sp.get("sort")  ?? "timestamp";
    const sortOrder = sp.get("order") === "asc" ? 1 : -1;

    const db  = await getDb();
    const col = db.collection("traffic_logs");
    const filter: Record<string, unknown> = {};

    // Geo filter
    const geoIps = await getIpsByGeo(db, country || undefined, city || undefined);
    if (geoIps !== null) {
      if (geoIps.length === 0) {
        return NextResponse.json({ data:[], total:0, page, pageSize, totalPages:0 }, { headers: { "Cache-Control": "no-store" } });
      }
      filter["src_ip"] = { $in: geoIps };
    }

    if (srcIp) filter["src_ip"] = { $regex: srcIp, $options: "i" };
    if (dstIp) filter["dst_ip"] = { $regex: dstIp, $options: "i" };
    if (port) {
      const n = parseInt(port);
      if (!isNaN(n)) filter["$or"] = [{ src_port: n }, { dst_port: n }];
    }
    if (protocol && protocol !== "ALL") {
      const num = PROTO_MAP[protocol.toUpperCase()] ?? parseInt(protocol);
      if (!isNaN(num)) filter["protocol"] = num;
    }
    if (label && label !== "ALL") {
      filter["label"] = label === "ATTACK" ? { $in:["1",1,"ATTACK"] } : { $in:["0",0,"BENIGN"] };
    }

    const rawDate = buildDateFilter(from, to, range, "timestamp");
    if (rawDate["timestamp"]) filter["timestamp"] = rawDate["timestamp"];

    const safe: Record<string,string> = { timestamp:"timestamp", src_ip:"src_ip", dst_ip:"dst_ip", src_port:"src_port", dst_port:"dst_port", protocol:"protocol", label:"label" };
    const safeSort = safe[sortField] ?? "timestamp";

    const [total, docs] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter)
        .sort({ [safeSort]: sortOrder })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .project({ _id:1, src_ip:1, dst_ip:1, src_port:1, dst_port:1, protocol:1, timestamp:1, label:1 })
        .toArray(),
    ]);

    const data: TrafficRecord[] = docs.map(d => ({
      _id:       d._id.toString(),
      src_ip:    d.src_ip    ?? "",
      dst_ip:    d.dst_ip    ?? "",
      src_port:  Number(d.src_port  ?? 0),
      dst_port:  Number(d.dst_port  ?? 0),
      protocol:  Number(d.protocol  ?? 0),
      timestamp: d.timestamp instanceof Date ? d.timestamp.toISOString() : String(d.timestamp ?? ""),
      label:     String(d.label ?? "0"),
    }));

    const response: PaginatedResponse<TrafficRecord> = { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[/api/traffic]", err);
    return NextResponse.json({ error: "Failed to fetch traffic" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
