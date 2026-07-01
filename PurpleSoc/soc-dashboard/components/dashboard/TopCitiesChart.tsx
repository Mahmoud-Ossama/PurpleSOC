"use client";

import { useEffect, useState } from "react";
import type { GeoCityStat } from "@/types/api";

interface Props { data: GeoCityStat[] }

export default function TopCitiesChart({ data }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, []);
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
      borderRadius: 6, padding: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
        Top Attacking Cities
      </div>

      {data.length === 0 ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>No city data yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {data.slice(0, 8).map((item, idx) => (
            <div key={`${item.city}-${item.country}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {item.city}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{item.country}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-cyan)", flexShrink: 0, marginLeft: 8 }}>
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: `linear-gradient(90deg, var(--accent-cyan), #0088bb)`,
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
