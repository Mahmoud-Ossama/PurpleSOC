import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { buildDateFilter } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const collection = searchParams.get("collection") as
      | "logs"
      | "traffic"
      | "reports"
      | null;
    const format = searchParams.get("format") as "csv" | "json" | null;

    if (!collection || !["logs", "traffic", "reports"].includes(collection)) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }

    if (!format || !["csv", "json"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const range = searchParams.get("range") ?? "24h";

    const db = await getDb();

    const collectionMap = {
      logs: "logs",
      traffic: "traffic_logs",
      reports: "reports",
    };
    const dateFieldMap = {
      logs: "received_at",
      traffic: "timestamp",
      reports: "created_at",
    };

    const colName = collectionMap[collection];
    const dateField = dateFieldMap[collection];

    const filter: Record<string, unknown> = {};
    const dateFilter = buildDateFilter(from, to, range, dateField);
    Object.assign(filter, dateFilter);

    // Additional filters
    if (collection === "logs") {
      const ip = searchParams.get("ip");
      const method = searchParams.get("method");
      if (ip) filter["source_ip"] = { $regex: ip, $options: "i" };
      if (method && method !== "ALL") filter["method"] = method;
    }

    if (collection === "traffic") {
      const label = searchParams.get("label");
      if (label === "ATTACK") filter["label"] = { $in: ["1", 1] };
      if (label === "BENIGN") filter["label"] = { $in: ["0", 0] };
    }

    if (collection === "reports") {
      const truePositive = searchParams.get("truePositive");
      if (truePositive === "true") filter["is_true_positive"] = true;
    }

    const docs = await db
      .collection(colName)
      .find(filter)
      .limit(10000)
      .toArray();

    const serialized = docs.map((d) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(d)) {
        if (k === "_id") {
          out[k] = v.toString();
        } else if (v instanceof Date) {
          out[k] = v.toISOString();
        } else if (typeof v === "object" && v !== null) {
          out[k] = JSON.stringify(v);
        } else {
          out[k] = v;
        }
      }
      return out;
    });

    const filename = `${collection}_export_${Date.now()}`;

    if (format === "json") {
      return new NextResponse(JSON.stringify(serialized, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // CSV
    if (serialized.length === 0) {
      return new NextResponse("", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    const headers = Object.keys(serialized[0]);
    const csvRows = [
      headers.join(","),
      ...serialized.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str}"`
              : str;
          })
          .join(",")
      ),
    ];

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/export]", err);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
