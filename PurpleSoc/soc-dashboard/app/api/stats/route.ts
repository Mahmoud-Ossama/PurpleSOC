import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { StatsResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ----- KPIs current period -----
    const [
      totalThreatsResult,
      activeIpsResult,
      avgRiskResult,
      criticalResult,
    ] = await Promise.all([
      // True positives today
      db.collection("reports").countDocuments({
        is_true_positive: true,
        created_at: { $gte: dayAgo },
      }),
      // Distinct src_ips last 24h
      db.collection("traffic_logs").distinct("src_ip", {
        timestamp: { $gte: dayAgo },
      }),
      // Avg risk score last 24h
      db
        .collection("reports")
        .aggregate([
          { $match: { created_at: { $gte: dayAgo } } },
          { $group: { _id: null, avg: { $avg: "$risk_score" } } },
        ])
        .toArray(),
      // Critical alerts last 24h
      db.collection("reports").countDocuments({
        risk_score: { $gte: 8 },
        created_at: { $gte: dayAgo },
      }),
    ]);

    // ----- KPIs previous period -----
    const [
      prevTotalThreats,
      prevActiveIps,
      prevAvgRisk,
      prevCritical,
    ] = await Promise.all([
      db.collection("reports").countDocuments({
        is_true_positive: true,
        created_at: { $gte: twoDaysAgo, $lt: dayAgo },
      }),
      db.collection("traffic_logs").distinct("src_ip", {
        timestamp: { $gte: twoDaysAgo, $lt: dayAgo },
      }),
      db
        .collection("reports")
        .aggregate([
          { $match: { created_at: { $gte: twoDaysAgo, $lt: dayAgo } } },
          { $group: { _id: null, avg: { $avg: "$risk_score" } } },
        ])
        .toArray(),
      db.collection("reports").countDocuments({
        risk_score: { $gte: 8 },
        created_at: { $gte: twoDaysAgo, $lt: dayAgo },
      }),
    ]);

    const currentAvg = (avgRiskResult[0]?.avg as number) ?? 0;
    const prevAvg = (prevAvgRisk[0]?.avg as number) ?? 0;

    // ----- Top 10 attacking IPs -----
    const topAttackers = await db
      .collection("traffic_logs")
      .aggregate([
        { $match: { label: { $in: ["1", 1, "ATTACK"] } } },
        { $group: { _id: "$src_ip", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, ip: "$_id", count: 1 } },
      ])
      .toArray();

    // ----- Protocol distribution -----
    const protocolDist = await db
      .collection("traffic_logs")
      .aggregate([
        { $group: { _id: "$protocol", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, protocol: "$_id", count: 1 } },
      ])
      .toArray();

    // ----- Traffic timeline last 7 days -----
    const trafficTimeline = await db
      .collection("traffic_logs")
      .aggregate([
        { $match: { timestamp: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: { $toDate: "$timestamp" },
                },
              },
              label: "$label",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ])
      .toArray();

    // Transform timeline into chart-ready format
    const timelineMap: Record<string, { attack: number; benign: number }> = {};
    for (const rec of trafficTimeline) {
      const dateKey = rec._id.date as string;
      if (!timelineMap[dateKey]) timelineMap[dateKey] = { attack: 0, benign: 0 };
      const lbl = String(rec._id.label);
      if (lbl === "1" || lbl === "ATTACK") {
        timelineMap[dateKey].attack += rec.count as number;
      } else {
        timelineMap[dateKey].benign += rec.count as number;
      }
    }
    const timelineArr = Object.entries(timelineMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ----- Recent 5 high-risk reports -----
    const recentThreats = await db
      .collection("reports")
      .find({})
      .sort({ risk_score: -1, created_at: -1 })
      .limit(5)
      .project({
        _id: 1,
        report_id: 1,
        risk_score: 1,
        threat_category: 1,
        ai_insights: 1,
        recommendations: 1,
        is_true_positive: 1,
        created_at: 1,
        source_ip: 1,
      })
      .toArray();

    const statsResponse: StatsResponse = {
      kpi: {
        totalThreats: totalThreatsResult,
        activeSourceIps: activeIpsResult.length,
        avgRiskScore: Math.round(currentAvg * 10) / 10,
        criticalAlerts: criticalResult,
        delta: {
          totalThreats: totalThreatsResult - prevTotalThreats,
          activeSourceIps: activeIpsResult.length - prevActiveIps.length,
          avgRiskScore: Math.round((currentAvg - prevAvg) * 10) / 10,
          criticalAlerts: criticalResult - prevCritical,
        },
      },
      topAttackers: topAttackers as { ip: string; count: number }[],
      protocolDist: protocolDist as { protocol: number; count: number }[],
      trafficTimeline: timelineArr,
      recentThreats: recentThreats.map((r) => {
        return {
          _id: r._id.toString(),
          report_id: r.report_id?.toString() ?? String(r._id),
          log_ids: ((r.log_ids ?? []) as unknown[]).map(String),
          risk_score: Number(r.risk_score ?? 0),
          threat_category: String(r.threat_category ?? 'Unknown'),
          ai_insights: String(r.ai_insights ?? ''),
          recommendations: (r.recommendations ?? []) as string[],
          is_true_positive: Boolean(r.is_true_positive),
          source_ip: String(r.source_ip ?? ''),
          created_at:
            r.created_at instanceof Date
              ? r.created_at.toISOString()
              : String(r.created_at ?? ''),
        } as import('@/types/report').ThreatReport;
      }),
    };

    return NextResponse.json(statsResponse, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[/api/stats]", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
