"use client";

interface TimeRangeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const RANGES = [
  { value: "1h", label: "1H" },
  { value: "6h", label: "6H" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

export default function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "4px",
        padding: "2px",
      }}
    >
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          style={{
            padding: "4px 10px",
            borderRadius: "3px",
            border: "none",
            background: value === r.value ? "var(--accent-cyan-dim)" : "none",
            color:
              value === r.value
                ? "var(--accent-cyan)"
                : "var(--text-secondary)",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            transition: "all 150ms ease",
            letterSpacing: "0.04em",
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
