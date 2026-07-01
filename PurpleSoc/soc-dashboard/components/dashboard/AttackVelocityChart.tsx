"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { AttackHourStat } from "@/types/api";

interface Props { data: AttackHourStat[] }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
        borderRadius: 6, padding: "8px 12px", fontSize: 12,
      }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: 3, fontSize: 11 }}>{label}</div>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--risk-critical)", fontWeight: 700 }}>
          {payload[0].value.toLocaleString()} attacks
        </div>
      </div>
    );
  }
  return null;
};

export default function AttackVelocityChart({ data }: Props) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
      borderRadius: 6, padding: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        Attack Velocity
      </div>
      <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 12 }}>
        Attacks per hour · last 24h
      </div>

      {data.length === 0 ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "40px 0" }}>No data</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} barSize={6}>
              <XAxis dataKey="hour" tick={{ fill: "var(--text-tertiary)", fontSize: 9 }} axisLine={false} tickLine={false}
                interval={3} />
              <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} animationDuration={700}>
                {data.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.count / max > 0.7 ? "var(--risk-critical)" : entry.count / max > 0.4 ? "var(--risk-high)" : "var(--risk-medium)"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Peak hour callout */}
          {data.length > 0 && (() => {
            const peak = data.reduce((a, b) => b.count > a.count ? b : a, data[0]);
            return (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "8px 10px", background: "var(--bg-elevated)", borderRadius: 4 }}>
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Peak hour</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--risk-critical)", fontWeight: 700 }}>
                  {peak.hour} · {peak.count.toLocaleString()}
                </span>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
