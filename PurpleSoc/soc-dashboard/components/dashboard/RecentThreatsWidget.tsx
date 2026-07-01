import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import RiskBadge from "@/components/shared/RiskBadge";
import type { ThreatReport } from "@/types/report";
import { ArrowRight } from "lucide-react";

interface RecentThreatsWidgetProps {
  threats: ThreatReport[];
}

export default function RecentThreatsWidget({ threats }: RecentThreatsWidgetProps) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Recent High-Risk Threats
        </span>
        <Link
          href="/reports"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            color: "var(--accent-cyan)",
            textDecoration: "none",
          }}
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {threats.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "12px",
            }}
          >
            No recent threats
          </div>
        ) : (
          threats.map((t, idx) => (
            <div
              key={t._id}
              className={`animate-card-enter stagger-${idx + 1}`}
              style={{
                padding: "12px 20px",
                borderBottom:
                  idx < threats.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                animationFillMode: "both",
              }}
            >
              {/* Risk stripe */}
              <div
                style={{
                  width: "3px",
                  height: "36px",
                  borderRadius: "2px",
                  background:
                    t.risk_score >= 8
                      ? "var(--risk-critical)"
                      : t.risk_score >= 6
                      ? "var(--risk-high)"
                      : t.risk_score >= 4
                      ? "var(--risk-medium)"
                      : "var(--risk-low)",
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "3px",
                  }}
                >
                  <RiskBadge score={t.risk_score} />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {t.threat_category}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    {t.source_ip}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {formatRelativeTime(t.created_at)}
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  fontWeight: 500,
                  color:
                    t.risk_score >= 8
                      ? "var(--risk-critical)"
                      : t.risk_score >= 6
                      ? "var(--risk-high)"
                      : t.risk_score >= 4
                      ? "var(--risk-medium)"
                      : "var(--risk-low)",
                }}
              >
                {t.risk_score.toFixed(1)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
