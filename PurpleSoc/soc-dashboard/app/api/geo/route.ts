import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveIp, isPrivateIp } from "@/lib/geo";
import type { AttackArcData, GeoLocation } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const mode = searchParams.get("mode") ?? "arcs";
    const limit = Math.min(500, parseInt(searchParams.get("limit") ?? "200"));

    const db = await getDb();

    if (mode === "arcs") {
      // Fetch latest ATTACK traffic records
      const attacks = await db
        .collection("traffic_logs")
        .find({ label: { $in: ["1", 1, "ATTACK"] } })
        .sort({ timestamp: -1 })
        .limit(limit)
        .project({
          _id: 1,
          src_ip: 1,
          dst_ip: 1,
          timestamp: 1,
        })
        .toArray();

      if (attacks.length === 0) {
        return NextResponse.json({ arcs: [], geoCache: [] });
      }

      // Get unique IPs
      const allIps = [
        ...new Set([
          ...attacks.map((a) => String(a.src_ip)),
          ...attacks.map((a) => String(a.dst_ip)),
        ]),
      ];

      // Batch resolve geo
      const geoMap: Record<string, GeoLocation> = {};
      await Promise.all(
        allIps.map(async (ip) => {
          try {
            geoMap[ip] = await resolveIp(ip);
          } catch {
            geoMap[ip] = { ip, lat: 0, lng: 0, country: "Unknown" };
          }
        })
      );

      // Join with report data for risk scores
      const srcIps = attacks.map((a) => String(a.src_ip));
      const reports = await db
        .collection("reports")
        .find({ source_ip: { $in: srcIps } })
        .project({ source_ip: 1, risk_score: 1, threat_category: 1 })
        .toArray();

      const reportMap: Record<
        string,
        { risk_score: number; threat_category: string }
      > = {};
      for (const r of reports) {
        if (!reportMap[r.source_ip]) {
          reportMap[r.source_ip] = {
            risk_score: r.risk_score as number,
            threat_category: r.threat_category as string,
          };
        }
      }

      const arcs: AttackArcData[] = attacks
        .filter((a) => {
          const src = geoMap[String(a.src_ip)];
          const dst = geoMap[String(a.dst_ip)];
          return src && dst && (src.lat !== 0 || dst.lat !== 0);
        })
        .map((a) => {
          const srcStr = String(a.src_ip);
          const dstStr = String(a.dst_ip);
          const src = geoMap[srcStr];
          const dst = geoMap[dstStr] ?? { lat: 0, lng: 0 };
          const rpt = reportMap[srcStr];

          // For private IPs on destination, use a central coordinate
          const dstLat =
            isPrivateIp(dstStr) && dst.lat === 0 ? 20 : (dst.lat ?? 0);
          const dstLng =
            isPrivateIp(dstStr) && dst.lng === 0 ? 0 : (dst.lng ?? 0);

          return {
            id: a._id.toString(),
            src_ip: srcStr,
            dst_ip: dstStr,
            src_lat: src.lat,
            src_lng: src.lng,
            dst_lat: dstLat,
            dst_lng: dstLng,
            risk_score: rpt?.risk_score ?? 7,
            threat_category: rpt?.threat_category ?? "Attack",
            timestamp:
              a.timestamp instanceof Date
                ? a.timestamp.toISOString()
                : String(a.timestamp ?? ""),
          };
        });

      return NextResponse.json(
        { arcs, geoCache: Object.values(geoMap) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (mode === "nodes") {
      // Unique attacking src_ips with max risk score and count
      const nodes = await db
        .collection("traffic_logs")
        .aggregate([
          { $match: { label: { $in: ["1", 1, "ATTACK"] } } },
          {
            $group: {
              _id: "$src_ip",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 100 },
        ])
        .toArray();

      const ips = nodes.map((n) => String(n._id));

      // Resolve geo
      const geoResults = await Promise.all(
        ips.map(async (ip) => {
          try {
            return await resolveIp(ip);
          } catch {
            return { ip, lat: 0, lng: 0 };
          }
        })
      );
      const geoMap: Record<string, GeoLocation> = {};
      for (const g of geoResults) geoMap[g.ip] = g;

      // Get max risk per IP from reports
      const riskData = await db
        .collection("reports")
        .aggregate([
          { $match: { source_ip: { $in: ips } } },
          { $group: { _id: "$source_ip", maxRisk: { $max: "$risk_score" }, topCat: { $first: "$threat_category" } } },
        ])
        .toArray();
      const riskMap: Record<string, { maxRisk: number; topCat: string }> = {};
      for (const r of riskData) {
        riskMap[String(r._id)] = {
          maxRisk: r.maxRisk as number,
          topCat: r.topCat as string,
        };
      }

      const result = nodes.map((n) => {
        const ip = String(n._id);
        const geo = geoMap[ip] ?? { lat: 0, lng: 0, country: "Unknown" };
        const risk = riskMap[ip] ?? { maxRisk: 5, topCat: "Unknown" };
        return {
          ip,
          lat: geo.lat,
          lng: geo.lng,
          country: geo.country,
          city: geo.city,
          count: n.count as number,
          maxRisk: risk.maxRisk,
          topCat: risk.topCat,
          isPrivate: isPrivateIp(ip),
        };
      });

      return NextResponse.json(
        { nodes: result },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (mode === "ticker") {
      // Latest 20 attacks for ticker
      const attacks = await db
        .collection("traffic_logs")
        .find({ label: { $in: ["1", 1, "ATTACK"] } })
        .sort({ timestamp: -1 })
        .limit(20)
        .project({ src_ip: 1, dst_ip: 1, timestamp: 1, label: 1 })
        .toArray();

      // Get risk scores
      const srcIps = attacks.map((a) => String(a.src_ip));
      const riskData = await db
        .collection("reports")
        .find({ source_ip: { $in: srcIps } })
        .project({ source_ip: 1, risk_score: 1 })
        .toArray();

      const riskMap: Record<string, number> = {};
      for (const r of riskData) riskMap[r.source_ip as string] = r.risk_score as number;

      const ticker = attacks.map((a) => ({
        src_ip: String(a.src_ip),
        dst_ip: String(a.dst_ip),
        risk_score: riskMap[String(a.src_ip)] ?? 5,
        timestamp:
          a.timestamp instanceof Date
            ? a.timestamp.toISOString()
            : String(a.timestamp ?? ""),
      }));

      return NextResponse.json(
        { ticker },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (mode === "choropleth") {
      // Attack count per country
      const ipCounts = await db
        .collection("traffic_logs")
        .aggregate([
          { $match: { label: { $in: ["1", 1, "ATTACK"] } } },
          { $group: { _id: "$src_ip", count: { $sum: 1 } } },
        ])
        .toArray();

      const countryMap: Record<string, number> = {};
      for (const row of ipCounts) {
        try {
          const geo = await resolveIp(String(row._id));
          if (geo.country && geo.country !== "Unknown Location") {
            countryMap[geo.country] = (countryMap[geo.country] ?? 0) + (row.count as number);
          }
        } catch { /* skip */ }
      }

      return NextResponse.json(
        { countries: Object.entries(countryMap).map(([country, count]) => ({ country, count })) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("[/api/geo]", err);
    return NextResponse.json(
      { error: "Failed to fetch geo data" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
