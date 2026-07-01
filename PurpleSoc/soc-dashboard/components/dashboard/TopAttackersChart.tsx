"use client";

import { useEffect, useState } from "react";

interface TopAttacker {
  ip: string;
  count: number;
}

interface TopAttackersChartProps {
  data: TopAttacker[];
}

export default function TopAttackersChart({ data }: TopAttackersChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "6px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "16px",
        }}
      >
        Top Attacking IPs
      </div>

      {data.length === 0 ? (
        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: "12px",
            textAlign: "center",
            padding: "20px",
          }}
        >
          No attack data
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.map((item, idx) => (
            <div key={item.ip}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                >
                  {item.ip}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--risk-critical)",
                  }}
                >
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  background: "var(--bg-elevated)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: animated ? `${(item.count / max) * 100}%` : "0%",
                    background: `linear-gradient(90deg, var(--risk-critical), var(--risk-high))`,
                    borderRadius: "2px",
                    transition: `width 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 60}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
