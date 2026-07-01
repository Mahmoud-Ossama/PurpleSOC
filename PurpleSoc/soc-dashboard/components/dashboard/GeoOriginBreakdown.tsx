"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props { internal: number; external: number; unknown: number }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
        borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: "var(--font-mono)",
      }}>
        <div style={{ color: "var(--text-primary)" }}>{payload[0].name}</div>
        <div style={{ color: "var(--text-secondary)" }}>{payload[0].value.toLocaleString()} attacks</div>
      </div>
    );
  }
  return null;
};

export default function GeoOriginBreakdown({ internal, external, unknown }: Props) {
  const total = internal + external + unknown;

  const chartData = [
    { name: "External", value: external, color: "var(--risk-critical)" },
    { name: "Internal", value: internal, color: "var(--accent-cyan)" },
    { name: "Unknown",  value: unknown,  color: "var(--text-tertiary)" },
  ].filter(d => d.value > 0);

  const pct = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
      borderRadius: 6, padding: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        Attack Origin
      </div>

      {total === 0 ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "40px 0" }}>No data</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={700}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              { label: "External", value: external, color: "var(--risk-critical)", pct: pct(external) },
              { label: "Internal", value: internal, color: "var(--accent-cyan)",   pct: pct(internal) },
              { label: "Unknown",  value: unknown,  color: "var(--text-tertiary)", pct: pct(unknown)  },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: row.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>{row.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: row.color }}>{row.pct}%</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", minWidth: 40, textAlign: "right" }}>
                  {row.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
