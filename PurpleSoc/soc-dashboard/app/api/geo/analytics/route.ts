import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isPrivateIp } from "@/lib/geo";
import type { GeoStatsResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db   = await getDb();
    const now  = new Date();
    const day  = new Date(now.getTime() - 24 * 3600_000);

    // ── 1. Get all ATTACK src_ips from last 24h ─────────────────────────────
    const attackIps = await db.collection("traffic_logs").aggregate([
      { $match: { label: { $in: ["1", 1, "ATTACK"] }, timestamp: { $gte: day } } },
      { $group: { _id: "$src_ip", count: { $sum: 1 } } },
    ]).toArray();

    if (attackIps.length === 0) {
      const empty: GeoStatsResponse = {
        topCountries: [], topCities: [], internal: 0, external: 0, unknown: 0, attacksPerHour: [],
      };
      return NextResponse.json(empty, { headers: { "Cache-Control": "no-store" } });
    }

    const ips = attackIps.map(r => String(r._id));

    // ── 2. Look up geo_cache for those IPs ──────────────────────────────────
    const geoRecords = await db.collection("geo_cache")
      .find({ ip: { $in: ips } })
      .project({ ip: 1, country: 1, country_code: 1, city: 1 })
      .toArray();

    const geoMap: Record<string, { country?: string; country_code?: string; city?: string }> = {};
    for (const g of geoRecords) geoMap[String(g.ip)] = { country: g.country, country_code: g.country_code as string | undefined, city: g.city };

    // ── 3. Aggregate counts per country / city ───────────────────────────────
    const countryMap: Record<string, { count: number; riskSum: number; riskCount: number; country_code?: string }> = {};
    const cityMap:    Record<string, { city: string; country: string; count: number }> = {};
    let internal = 0, external = 0, unknown = 0;

    // Get risk scores for IPs
    const reportRisks = await db.collection("reports")
      .find({ source_ip: { $in: ips } })
      .project({ source_ip: 1, risk_score: 1 })
      .toArray();
    const riskMap: Record<string, number> = {};
    for (const r of reportRisks) riskMap[String(r.source_ip)] = Number(r.risk_score ?? 0);

    for (const row of attackIps) {
      const ip    = String(row._id);
      const cnt   = Number(row.count ?? 0);
      const risk  = riskMap[ip] ?? 5;
      const geo   = geoMap[ip];

      if (isPrivateIp(ip)) {
        internal += cnt;
        continue;
      }

      if (!geo?.country || geo.country === "Unknown Location") {
        unknown += cnt;
        continue;
      }

      external += cnt;

      // Country
      const cKey = geo.country;
      if (!countryMap[cKey]) countryMap[cKey] = { count: 0, riskSum: 0, riskCount: 0, country_code: geo.country_code };
      countryMap[cKey].count     += cnt;
      countryMap[cKey].riskSum   += risk * cnt;
      countryMap[cKey].riskCount += cnt;

      // City
      if (geo.city) {
        const key = `${geo.city}||${geo.country}`;
        if (!cityMap[key]) cityMap[key] = { city: geo.city, country: geo.country, count: 0 };
        cityMap[key].count += cnt;
      }
    }

    const topCountries = Object.entries(countryMap)
      .map(([country, v]) => ({
        country,
        country_code: v.country_code,
        count:   v.count,
        avgRisk: v.riskCount > 0 ? Math.round((v.riskSum / v.riskCount) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCities = Object.values(cityMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── 4. Attacks per hour (last 24h) ───────────────────────────────────────
    const hourlyRaw = await db.collection("traffic_logs").aggregate([
      { $match: { label: { $in: ["1", 1, "ATTACK"] }, timestamp: { $gte: day } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%H",
              date: { $toDate: "$timestamp" },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const attacksPerHour = hourlyRaw.map(r => ({
      hour:  `${String(r._id).padStart(2, "0")}:00`,
      count: Number(r.count),
    }));

    const result: GeoStatsResponse = {
      topCountries,
      topCities,
      internal,
      external,
      unknown,
      attacksPerHour,
    };

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[/api/geo/analytics]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
