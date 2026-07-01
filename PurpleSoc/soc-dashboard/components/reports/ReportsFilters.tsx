"use client";

import { useQueryState } from "nuqs";
import TimeRangeSelect from "@/components/shared/TimeRangeSelect";

const RISK_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SORT_OPTIONS = [
  { value: "risk_score", label: "Risk Score ↓" },
  { value: "created_at", label: "Newest First" },
  { value: "threat_category", label: "Category A-Z" },
];

export default function ReportsFilters() {
  const [riskLevel, setRiskLevel] = useQueryState("riskLevel", { defaultValue: "" });
  const [category, setCategory] = useQueryState("category", { defaultValue: "" });
  const [truePositive, setTruePositive] = useQueryState("truePositive", { defaultValue: "false" });
  const [range, setRange] = useQueryState("range", { defaultValue: "24h" });
  const [sort, setSort] = useQueryState("sort", { defaultValue: "risk_score" });

  const selectedLevels = riskLevel ? riskLevel.split(",") : [];

  const toggleLevel = (level: string) => {
    const current = riskLevel ? riskLevel.split(",").filter(Boolean) : [];
    const next = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    setRiskLevel(next.join(",") || "");
  };

  const clear = () => {
    setRiskLevel("");
    setCategory("");
    setTruePositive("false");
    setRange("24h");
    setSort("risk_score");
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "4px",
    color: "var(--text-primary)",
    fontSize: "12px",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 150ms ease",
  };

  const levelColors: Record<string, string> = {
    CRITICAL: "var(--risk-critical)",
    HIGH: "var(--risk-high)",
    MEDIUM: "var(--risk-medium)",
    LOW: "var(--risk-low)",
  };
  const levelDimColors: Record<string, string> = {
    CRITICAL: "var(--risk-critical-dim)",
    HIGH: "var(--risk-high-dim)",
    MEDIUM: "var(--risk-medium-dim)",
    LOW: "var(--risk-low-dim)",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
        padding: "12px 20px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Risk level multi-select buttons */}
      <div style={{ display: "flex", gap: "4px" }}>
        {RISK_LEVELS.map((level) => {
          const active = selectedLevels.includes(level);
          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              style={{
                padding: "4px 10px",
                borderRadius: "3px",
                border: `1px solid ${active ? levelColors[level] + "60" : "var(--border-subtle)"}`,
                background: active ? levelDimColors[level] : "var(--bg-elevated)",
                color: active ? levelColors[level] : "var(--text-tertiary)",
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                letterSpacing: "0.04em",
                transition: "all 150ms ease",
              }}
            >
              {level}
            </button>
          );
        })}
      </div>

      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category…"
        style={{ ...inputStyle, minWidth: "140px" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-cyan)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      />

      {/* True positive toggle */}
      <button
        onClick={() => setTruePositive(truePositive === "true" ? "false" : "true")}
        style={{
          padding: "6px 12px",
          borderRadius: "4px",
          border: `1px solid ${truePositive === "true" ? "var(--risk-critical)40" : "var(--border-subtle)"}`,
          background: truePositive === "true" ? "var(--risk-critical-dim)" : "var(--bg-elevated)",
          color: truePositive === "true" ? "var(--risk-critical)" : "var(--text-secondary)",
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          cursor: "pointer",
          letterSpacing: "0.04em",
          transition: "all 150ms ease",
        }}
      >
        TRUE POSITIVE
      </button>

      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-cyan)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "var(--bg-overlay)" }}>
            {o.label}
          </option>
        ))}
      </select>

      <TimeRangeSelect value={range} onChange={setRange} />

      <button
        onClick={clear}
        style={{
          padding: "6px 12px",
          borderRadius: "4px",
          border: "1px solid var(--border-subtle)",
          background: "transparent",
          color: "var(--text-tertiary)",
          fontSize: "11px",
          cursor: "pointer",
          transition: "all 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)";
        }}
      >
        Clear
      </button>
    </div>
  );
}
