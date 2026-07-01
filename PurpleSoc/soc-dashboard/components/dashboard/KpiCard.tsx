"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  delta: number;
  icon: React.ReactNode;
  format?: "number" | "score" | "count";
  accentColor?: string;
  delay?: number;
}

function useCountUp(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = 0;
    startRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(startValueRef.current + (target - startValueRef.current) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return current;
}

export default function KpiCard({
  title,
  value,
  delta,
  icon,
  format = "count",
  accentColor = "var(--accent-cyan)",
  delay = 0,
}: KpiCardProps) {
  const animated = useCountUp(value);

  const formatValue = (v: number) => {
    if (format === "score") return v.toFixed(1);
    return Math.round(v).toLocaleString();
  };

  const DeltaIcon =
    delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor =
    delta > 0
      ? "var(--risk-critical)"
      : delta < 0
      ? "var(--risk-low)"
      : "var(--text-tertiary)";

  return (
    <div
      className="animate-card-enter"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "6px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
        position: "relative",
        overflow: "hidden",
        flex: 1,
      }}
    >
      {/* Accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: accentColor,
          opacity: 0.5,
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </span>
        <span style={{ color: accentColor, opacity: 0.8 }}>{icon}</span>
      </div>

      {/* Value */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "32px",
          fontWeight: 500,
          color: "var(--text-primary)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {formatValue(animated)}
      </div>

      {/* Delta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          color: deltaColor,
        }}
      >
        <DeltaIcon size={11} />
        <span style={{ fontFamily: "var(--font-mono)" }}>
          {delta > 0 ? "+" : ""}
          {format === "score" ? delta.toFixed(1) : Math.abs(delta)}
        </span>
        <span style={{ color: "var(--text-tertiary)" }}>vs prev 24h</span>
      </div>
    </div>
  );
}
