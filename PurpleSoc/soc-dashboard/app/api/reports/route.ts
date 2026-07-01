import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { buildDateFilter } from "@/lib/utils";
import type { PaginatedResponse } from "@/types/api";
import type { ThreatReport } from "@/types/report";

export const dynamic = "force-dynamic";

function riskLevelToRange(level: string): { $gte?: number; $lt?: number } | null {
  switch (level.toUpperCase()) {
    case "CRITICAL":
      return { $gte: 8 };
    case "HIGH":
      return { $gte: 6, $lt: 8 };
    case "MEDIUM":
      return { $gte: 4, $lt: 6 };
    case "LOW":
      return { $lt: 4 };
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const riskLevels = searchParams.getAll("riskLevel");
    const categories = searchParams.getAll("category");
    const truePositive = searchParams.get("truePositive");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const range = searchParams.get("range") ?? "24h";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "12"));
    const sortField = searchParams.get("sort") ?? "created_at";
    const sortOrder = searchParams.get("order") === "asc" ? 1 : -1;

    const db = await getDb();
    const col = db.collection("reports");

    const filter: Record<string, unknown> = {};

    // Risk level filter (multi-select → $or over ranges)
    if (riskLevels.length > 0) {
      const ranges = riskLevels
        .map(riskLevelToRange)
        .filter((r): r is NonNullable<typeof r> => r !== null);
      if (ranges.length > 0) {
        filter["risk_score"] = { $or: ranges.map((r) => ({ risk_score: r })) };
        // Mongo doesn't support $or inside field — use top-level $or
        delete filter["risk_score"];
        filter["$or"] = ranges.map((r) => ({ risk_score: r }));
      }
    }

    // Category filter
    if (categories.length > 0) {
      filter["threat_category"] = { $in: categories };
    }

    // True positive filter
    if (truePositive === "true") filter["is_true_positive"] = true;

    // Date filter
    const dateFilter = buildDateFilter(from, to, range, "created_at");
    Object.assign(filter, dateFilter);

    const allowedSortFields: Record<string, string> = {
      created_at: "created_at",
      risk_score: "risk_score",
      threat_category: "threat_category",
      source_ip: "source_ip",
    };
    const safeSort = allowedSortFields[sortField] ?? "created_at";

    const [total, docs] = await Promise.all([
      col.countDocuments(filter),
      col
        .find(filter)
        .sort({ [safeSort]: sortOrder })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
    ]);

    const data: ThreatReport[] = docs.map((d) => ({
      _id: d._id.toString(),
      report_id: d.report_id?.toString() ?? d._id.toString(),
      log_ids: (d.log_ids ?? []).map((id: unknown) => String(id)),
      risk_score: Number(d.risk_score ?? 0),
      threat_category: d.threat_category ?? "Unknown",
      ai_insights: d.ai_insights ?? "",
      recommendations: d.recommendations ?? [],
      is_true_positive: Boolean(d.is_true_positive),
      created_at:
        d.created_at instanceof Date
          ? d.created_at.toISOString()
          : String(d.created_at ?? ""),
      source_ip: d.source_ip ?? "",
    }));

    const response: PaginatedResponse<ThreatReport> = {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[/api/reports]", err);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
