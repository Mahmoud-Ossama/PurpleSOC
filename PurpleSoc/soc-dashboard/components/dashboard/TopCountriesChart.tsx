"use client";

import { useEffect, useState } from "react";
import CountryFlag from "@/lib/countryFlag";
import type { GeoCountryStat } from "@/types/api";

interface Props { data: GeoCountryStat[] }

function getRiskColor(risk: number) {
  if (risk >= 8) return "var(--risk-critical)";
  if (risk >= 6) return "var(--risk-high)";
  if (risk >= 4) return "var(--risk-medium)";
  return "var(--risk-low)";
}

export default function TopCountriesChart({ data }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
      borderRadius: 6, padding: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
        Top Attacking Countries
      </div>

      {data.length === 0 ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>
          No geo data — IPs resolving…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.slice(0, 8).map((item, idx) => (
            <div key={item.country}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                {/* Flag + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <CountryFlag country={item.country} size={18} />
                  <span style={{
                    fontSize: 12, color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: 105,
                  }}>
                    {item.country}
                  </span>
                </div>

                {/* Risk badge + count */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                    color: getRiskColor(item.avgRisk),
                    background: getRiskColor(item.avgRisk) + "20",
                    padding: "1px 5px", borderRadius: 3,
                  }}>
                    {item.avgRisk.toFixed(1)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
                    {item.count.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: `linear-gradient(90deg, ${getRiskColor(item.avgRisk)}, ${getRiskColor(item.avgRisk)}66)`,
                  width: animated ? `${(item.count / max) * 100}%` : "0%",
                  transition: `width 600ms cubic-bezier(0.34,1.56,0.64,1) ${idx * 50}ms`,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
