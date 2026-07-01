"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getProtocolName } from "@/lib/utils";

interface ProtocolDistChartProps {
  data: { protocol: number; count: number }[];
}

const COLORS = [
  "var(--accent-cyan)",
  "var(--risk-high)",
  "var(--risk-medium)",
  "var(--risk-low)",
  "#9B59B6",
  "#3498DB",
  "#1ABC9C",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ color: "var(--text-primary)" }}>{payload[0].name}</div>
        <div style={{ color: "var(--text-secondary)" }}>
          {payload[0].value.toLocaleString()} packets
        </div>
      </div>
    );
  }
  return null;
};

export default function ProtocolDistChart({ data }: ProtocolDistChartProps) {
  const chartData = data.map((d) => ({
    name: getProtocolName(d.protocol),
    value: d.count,
    protocol: d.protocol,
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
        Protocol Distribution
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
