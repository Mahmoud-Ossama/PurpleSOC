"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface TrafficTimelineChartProps {
  data: { date: string; attack: number; benign: number }[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          padding: "10px 14px",
          fontSize: "12px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
            marginBottom: "6px",
            fontSize: "11px",
          }}
        >
          {label}
        </div>
        {payload.map((entry) => (
          <div
            key={entry.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "3px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: entry.color,
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              {entry.name}:
            </span>
            <span
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
            >
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrafficTimelineChart({
  data,
}: TrafficTimelineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: (() => {
      try {
        return format(parseISO(d.date), "MMM d");
      } catch {
        return d.date;
      }
    })(),
  }));

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
        Traffic Timeline · Last 7 Days
      </div>

      {data.length === 0 ? (
        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: "12px",
            textAlign: "center",
            padding: "40px",
          }}
        >
          No data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={formatted}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradAttack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--risk-critical)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--risk-critical)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBenign" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--risk-low)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--risk-low)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={6}
              formatter={(value) => (
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="benign"
              name="Benign"
              stroke="var(--risk-low)"
              strokeWidth={1.5}
              fill="url(#gradBenign)"
              dot={false}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="attack"
              name="Attack"
              stroke="var(--risk-critical)"
              strokeWidth={1.5}
              fill="url(#gradAttack)"
              dot={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
