"use client";

import { useState } from "react";
import { formatTimestamp, getProtocolName, truncate } from "@/lib/utils";
import { getLabelDisplay } from "@/types/traffic";
import type { TrafficRecord } from "@/types/traffic";
import EmptyState from "@/components/shared/EmptyState";
import { Eye, ChevronUp, ChevronDown, X } from "lucide-react";

interface TrafficTableProps {
  data: TrafficRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}

function SortIcon({ active, order }: { active: boolean; order: string }) {
  if (!active) return <ChevronUp size={10} style={{ opacity: 0.2 }} />;
  return order === "asc" ? (
    <ChevronUp size={10} style={{ color: "var(--accent-cyan)" }} />
  ) : (
    <ChevronDown size={10} style={{ color: "var(--accent-cyan)" }} />
  );
}

function TrafficDetail({ record, onClose }: { record: TrafficRecord; onClose: () => void }) {
  const label = getLabelDisplay(record.label);
  return (
    <div
      className="panel-slide-in"
      style={{
        position: "fixed",
        top: "56px",
        right: 0,
        bottom: 0,
        width: "400px",
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-subtle)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Traffic Detail
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
            {record._id}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: "5px", borderRadius: "4px", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <X size={13} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Label */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Classification
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "4px",
                background: label === "ATTACK" ? "var(--risk-critical-dim)" : "var(--risk-low-dim)",
                color: label === "ATTACK" ? "var(--risk-critical)" : "var(--risk-low)",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
          </div>

          {[
            { label: "Timestamp", value: formatTimestamp(record.timestamp), mono: true },
            { label: "Source IP", value: record.src_ip, mono: true, highlight: true },
            { label: "Destination IP", value: record.dst_ip, mono: true },
            { label: "Source Port", value: String(record.src_port), mono: true },
            { label: "Destination Port", value: String(record.dst_port), mono: true },
            { label: "Protocol", value: `${getProtocolName(record.protocol)} (${record.protocol})`, mono: true },
          ].map((f) => (
            <div key={f.label}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                {f.label}
              </div>
              <div
                style={{
                  fontFamily: f.mono ? "var(--font-mono)" : "var(--font-body)",
                  fontSize: "13px",
                  color: f.highlight ? "var(--accent-cyan)" : "var(--text-primary)",
                }}
              >
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TH: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
  background: "var(--bg-elevated)",
  borderBottom: "1px solid var(--border-subtle)",
  cursor: "pointer",
  userSelect: "none",
};

const TD: React.CSSProperties = {
  padding: "9px 12px",
  fontSize: "12px",
  color: "var(--text-primary)",
  borderBottom: "1px solid var(--border-subtle)",
  verticalAlign: "middle",
};

export default function TrafficTable({
  data,
  total,
  page,
  pageSize,
  totalPages,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
}: TrafficTableProps) {
  const [selected, setSelected] = useState<TrafficRecord | null>(null);

  const columns = [
    { key: "timestamp", label: "Timestamp" },
    { key: "src_ip", label: "Src IP" },
    { key: "src_port", label: "Src Port" },
    { key: "dst_ip", label: "Dst IP" },
    { key: "dst_port", label: "Dst Port" },
    { key: "protocol", label: "Protocol" },
    { key: "label", label: "Label" },
  ];

  if (data.length === 0) {
    return <EmptyState subtitle="No traffic records match the current filters" />;
  }

  return (
    <div style={{ position: "relative" }}>
      {selected && <TrafficDetail record={selected} onClose={() => setSelected(null)} />}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={TH} onClick={() => onSort(col.key)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {col.label}
                    <SortIcon active={sortField === col.key} order={sortOrder} />
                  </span>
                </th>
              ))}
              <th style={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const label = getLabelDisplay(row.label);
              return (
                <tr
                  key={row._id}
                  style={{ transition: "background 150ms ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-elevated)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td style={TD}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
                      {formatTimestamp(row.timestamp)}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-cyan)" }}>
                      {row.src_ip}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {row.src_port}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {row.dst_ip}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {row.dst_port}
                    </span>
                  </td>
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {getProtocolName(row.protocol)}
                    </span>
                  </td>
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "3px",
                        background: label === "ATTACK" ? "var(--risk-critical-dim)" : "var(--risk-low-dim)",
                        color: label === "ATTACK" ? "var(--risk-critical)" : "var(--risk-low)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {label}
                    </span>
                  </td>
                  <td style={TD}>
                    <button
                      onClick={() => setSelected(row)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        borderRadius: "3px",
                        border: "1px solid var(--border-subtle)",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-cyan)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-cyan)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)";
                      }}
                    >
                      <Eye size={11} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
      >
        <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          {total.toLocaleString()} records · Page {page} of {totalPages}
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { label: "←", value: page - 1, disabled: page <= 1 },
            { label: "→", value: page + 1, disabled: page >= totalPages },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => !btn.disabled && onPageChange(btn.value)}
              disabled={btn.disabled}
              style={{
                padding: "4px 10px",
                borderRadius: "3px",
                border: "1px solid var(--border-subtle)",
                background: btn.disabled ? "transparent" : "var(--bg-elevated)",
                color: btn.disabled ? "var(--text-tertiary)" : "var(--text-secondary)",
                fontSize: "12px",
                cursor: btn.disabled ? "not-allowed" : "pointer",
                fontFamily: "var(--font-mono)",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
