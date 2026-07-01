"use client";

import { useQueryState } from "nuqs";
import useSWR from "swr";
import TopBar from "@/components/layout/TopBar";
import ReportsFilters from "@/components/reports/ReportsFilters";
import ReportCard from "@/components/reports/ReportCard";
import ExportButton from "@/components/shared/ExportButton";
import EmptyState from "@/components/shared/EmptyState";
import type { PaginatedResponse } from "@/types/api";
import type { ThreatReport } from "@/types/report";
import { FileWarning } from "lucide-react";

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

export default function ReportsPage() {
  const [riskLevel] = useQueryState("riskLevel", { defaultValue: "" });
  const [category] = useQueryState("category", { defaultValue: "" });
  const [truePositive] = useQueryState("truePositive", { defaultValue: "false" });
  const [range] = useQueryState("range", { defaultValue: "24h" });
  const [sort] = useQueryState("sort", { defaultValue: "risk_score" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });

  const params = new URLSearchParams();

  // Multi risk levels
  if (riskLevel) {
    riskLevel.split(",").filter(Boolean).forEach((l) => params.append("riskLevel", l));
  }
  if (category) params.set("category", category);
  if (truePositive === "true") params.set("truePositive", "true");
  params.set("range", range ?? "24h");
  params.set("sort", sort ?? "risk_score");
  params.set("order", sort === "threat_category" ? "asc" : "desc");
  params.set("page", page ?? "1");
  params.set("pageSize", "12");

  const { data, isLoading, mutate } = useSWR<PaginatedResponse<ThreatReport>>(
    `/api/reports?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  );

  const exportParams: Record<string, string> = { range: range ?? "24h" };
  if (truePositive === "true") exportParams.truePositive = "true";

  const clearFilters = () => {
    window.location.search = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar
        title="THREAT REPORTS"
        actions={<ExportButton collection="reports" params={exportParams} />}
      />

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          marginTop: "56px",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-base)",
        }}
      >
        <ReportsFilters />

        {/* Stats bar */}
        {data && (
          <div
            style={{
              padding: "8px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
              }}
            >
              {data.total.toLocaleString()} reports · Page {data.page} of {data.totalPages}
            </span>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {isLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: "16px",
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: "200px", borderRadius: "6px" }}
                />
              ))}
            </div>
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              icon={<FileWarning size={40} strokeWidth={1} />}
              title="No threat reports found"
              subtitle="Try adjusting your risk level filters or expanding the time range"
              onClear={clearFilters}
            />
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {data.data.map((report, idx) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    delay={idx * 40}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    padding: "16px 0",
                  }}
                >
                  <button
                    onClick={() => setPage(String(Math.max(1, (data.page ?? 1) - 1)))}
                    disabled={(data.page ?? 1) <= 1}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-elevated)",
                      color: (data.page ?? 1) <= 1 ? "var(--text-tertiary)" : "var(--text-secondary)",
                      fontSize: "12px",
                      cursor: (data.page ?? 1) <= 1 ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ←
                  </button>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      padding: "0 8px",
                    }}
                  >
                    {data.page} / {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(String(Math.min(data.totalPages, (data.page ?? 1) + 1)))}
                    disabled={(data.page ?? 1) >= data.totalPages}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-elevated)",
                      color: (data.page ?? 1) >= data.totalPages ? "var(--text-tertiary)" : "var(--text-secondary)",
                      fontSize: "12px",
                      cursor: (data.page ?? 1) >= data.totalPages ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
