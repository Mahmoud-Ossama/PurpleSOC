import TopBar from "@/components/layout/TopBar";
import KpiCard from "@/components/dashboard/KpiCard";
import TopAttackersChart from "@/components/dashboard/TopAttackersChart";
import ProtocolDistChart from "@/components/dashboard/ProtocolDistChart";
import TrafficTimelineChart from "@/components/dashboard/TrafficTimelineChart";
import RecentThreatsWidget from "@/components/dashboard/RecentThreatsWidget";
import TopCountriesChart from "@/components/dashboard/TopCountriesChart";
import TopCitiesChart from "@/components/dashboard/TopCitiesChart";
import GeoOriginBreakdown from "@/components/dashboard/GeoOriginBreakdown";
import AttackVelocityChart from "@/components/dashboard/AttackVelocityChart";
import ExportButton from "@/components/shared/ExportButton";
import MapPreviewCard from "@/components/dashboard/MapPreviewCard";
import { ShieldAlert, Wifi, BarChart2, Zap } from "lucide-react";
import type { StatsResponse } from "@/types/api";
import type { GeoStatsResponse } from "@/types/api";

async function getStats(): Promise<StatsResponse | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/stats`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getGeoStats(): Promise<GeoStatsResponse | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/geo/analytics`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "10px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const DIVIDER: React.CSSProperties = {
  flex: 1,
  height: "1px",
  background: "var(--border-subtle)",
};

export default async function OverviewPage() {
  const [stats, geoStats] = await Promise.all([getStats(), getGeoStats()]);

  const kpi = stats?.kpi ?? {
    totalThreats: 0, activeSourceIps: 0, avgRiskScore: 0, criticalAlerts: 0,
    delta: { totalThreats: 0, activeSourceIps: 0, avgRiskScore: 0, criticalAlerts: 0 },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar title="OVERVIEW" actions={<ExportButton collection="reports" />} />

      <div style={{
        flex: 1, overflow: "auto", padding: "20px",
        marginTop: "56px", display: "flex", flexDirection: "column", gap: "24px",
      }}>

        {/* ── KPIs ── */}
        <div style={{ display: "flex", gap: "16px" }}>
          <KpiCard title="Total Threats Today"  value={kpi.totalThreats}    delta={kpi.delta.totalThreats}    icon={<ShieldAlert size={16}/>} accentColor="var(--risk-critical)" delay={0}   />
          <KpiCard title="Active Source IPs"    value={kpi.activeSourceIps} delta={kpi.delta.activeSourceIps} icon={<Wifi size={16}/>}        accentColor="var(--accent-cyan)"  delay={40}  />
          <KpiCard title="Avg Risk Score"       value={kpi.avgRiskScore}    delta={kpi.delta.avgRiskScore}    icon={<BarChart2 size={16}/>}   accentColor="var(--risk-high)"    delay={80}  format="score" />
          <KpiCard title="Critical Alerts"      value={kpi.criticalAlerts}  delta={kpi.delta.criticalAlerts}  icon={<Zap size={16}/>}         accentColor="var(--risk-critical)" delay={120} />
        </div>

        {/* ── Map + Recent Threats ── */}
        <div>
          <div style={SECTION_LABEL}>
            <span>Threat Overview</span><div style={DIVIDER}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px", minHeight: "260px" }}>
            <MapPreviewCard attackTotal={stats?.topAttackers?.reduce((s,a) => s+a.count, 0) ?? 0} />
            <RecentThreatsWidget threats={stats?.recentThreats ?? []} />
          </div>
        </div>

        {/* ── Traffic Analysis ── */}
        <div>
          <div style={SECTION_LABEL}>
            <span>Traffic Analysis</span><div style={DIVIDER}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <TopAttackersChart data={stats?.topAttackers ?? []} />
            <ProtocolDistChart data={stats?.protocolDist ?? []} />
            <TrafficTimelineChart data={stats?.trafficTimeline ?? []} />
          </div>
        </div>

        {/* ── Geo Intelligence ── */}
        <div>
          <div style={SECTION_LABEL}>
            <span>Geo Intelligence</span><div style={DIVIDER}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
            <TopCountriesChart data={geoStats?.topCountries ?? []} />
            <TopCitiesChart    data={geoStats?.topCities ?? []} />
            <GeoOriginBreakdown internal={geoStats?.internal ?? 0} external={geoStats?.external ?? 0} unknown={geoStats?.unknown ?? 0} />
            <AttackVelocityChart data={geoStats?.attacksPerHour ?? []} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ paddingBottom: "8px", fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
          SOC Intelligence Platform · Live data from ids_db
        </div>
      </div>
    </div>
  );
}
