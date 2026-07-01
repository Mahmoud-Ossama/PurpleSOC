"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import type { ThreatReport } from "@/types/report";
import { getRiskColor } from "@/types/report";
import RiskBadge from "@/components/shared/RiskBadge";
import { ChevronRight, Copy, Check, X, ExternalLink } from "lucide-react";

interface ReportCardProps {
  report: ThreatReport;
  delay?: number;
}

function ReportDetailModal({
  report,
  onClose,
}: {
  report: ThreatReport;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(report.ai_insights);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,12,15,0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          animation: "card-enter 200ms ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <RiskBadge score={report.risk_score} showScore />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {report.threat_category}
              </span>
              {report.is_true_positive && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: "3px",
                    background: "var(--risk-critical-dim)",
                    color: "var(--risk-critical)",
                    letterSpacing: "0.04em",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  TRUE POSITIVE
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}
              >
                {report.source_ip}
              </span>
              <span>{formatRelativeTime(report.created_at)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "6px",
              borderRadius: "4px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {/* AI Insights */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              AI Insights
              <button
                onClick={copy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "14px",
                fontSize: "13px",
                color: "var(--text-primary)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {report.ai_insights || "No AI insights available."}
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "10px",
                }}
              >
                Recommendations
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {report.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "8px 0",
                      borderBottom:
                        i < report.recommendations.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "var(--accent-cyan-dim)",
                        color: "var(--accent-cyan)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        marginTop: "1px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}
                    >
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meta */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              { label: "Report ID", value: report.report_id, mono: true },
              { label: "Risk Score", value: report.risk_score.toFixed(1), mono: true },
              { label: "Logs Analyzed", value: String(report.log_ids?.length ?? 0), mono: true },
              { label: "Verified", value: report.is_true_positive ? "True Positive" : "Under Review" },
            ].map((f) => (
              <div
                key={f.label}
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "4px",
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                  {f.label}
                </div>
                <div
                  style={{
                    fontFamily: f.mono ? "var(--font-mono)" : "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportCard({ report, delay = 0 }: ReportCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [hovered, setHovered] = useState(false);
  const riskColor = getRiskColor(report.risk_score);

  return (
    <>
      {showDetail && (
        <ReportDetailModal
          report={report}
          onClose={() => setShowDetail(false)}
        />
      )}
      <div
        className="animate-card-enter"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          animationDelay: `${delay}ms`,
          animationFillMode: "both",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          transition: "border-color 150ms ease, transform 150ms ease",
          borderColor: hovered ? "var(--border-strong)" : "var(--border-subtle)",
          transform: hovered ? "translateY(-1px)" : "none",
          boxShadow: hovered
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        {/* Risk stripe */}
        <div
          style={{
            width: "4px",
            background: riskColor,
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Top */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <RiskBadge score={report.risk_score} showScore />
                {report.is_true_positive && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 5px",
                      borderRadius: "3px",
                      background: "var(--risk-critical-dim)",
                      color: "var(--risk-critical)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    TP
                  </span>
                )}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                {report.threat_category}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-cyan)" }}>
                {report.source_ip}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                {formatRelativeTime(report.created_at)}
              </span>
            </div>
          </div>

          {/* AI Insights snippet */}
          {report.ai_insights && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {report.ai_insights}
            </p>
          )}

          {/* Recommendations preview */}
          {report.recommendations?.length > 0 && (
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              {report.recommendations.slice(0, 2).map((rec, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "var(--accent-cyan)", flexShrink: 0 }}>›</span>
                  {rec}
                </li>
              ))}
              {report.recommendations.length > 2 && (
                <li style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  +{report.recommendations.length - 2} more…
                </li>
              )}
            </ul>
          )}

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
            <button
              onClick={() => setShowDetail(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 12px",
                borderRadius: "4px",
                border: `1px solid ${riskColor}40`,
                background: `${riskColor}10`,
                color: riskColor,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${riskColor}20`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${riskColor}10`;
              }}
            >
              View Full Report <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
