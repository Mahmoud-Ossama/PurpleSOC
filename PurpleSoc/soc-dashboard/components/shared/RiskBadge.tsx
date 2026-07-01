"use client";

import { getRiskLevel } from "@/types/report";

interface RiskBadgeProps {
  score: number;
  showScore?: boolean;
  size?: "sm" | "md";
}

const RISK_STYLES = {
  CRITICAL: {
    bg: "var(--risk-critical-dim)",
    color: "var(--risk-critical)",
    label: "CRITICAL",
  },
  HIGH: {
    bg: "var(--risk-high-dim)",
    color: "var(--risk-high)",
    label: "HIGH",
  },
  MEDIUM: {
    bg: "var(--risk-medium-dim)",
    color: "var(--risk-medium)",
    label: "MEDIUM",
  },
  LOW: {
    bg: "var(--risk-low-dim)",
    color: "var(--risk-low)",
    label: "LOW",
  },
};

export default function RiskBadge({
  score,
  showScore = false,
  size = "sm",
}: RiskBadgeProps) {
  const level = getRiskLevel(score);
  const style = RISK_STYLES[level];

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        fontFamily: "var(--font-mono)",
        fontSize: size === "sm" ? "11px" : "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        padding: size === "sm" ? "2px 6px" : "3px 8px",
        borderRadius: "3px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
      {showScore && (
        <span style={{ opacity: 0.7 }}>· {score.toFixed(1)}</span>
      )}
    </span>
  );
}
