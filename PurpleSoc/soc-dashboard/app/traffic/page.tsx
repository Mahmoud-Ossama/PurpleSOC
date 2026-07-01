"use client";

import { useQueryState } from "nuqs";
import useSWR from "swr";
import TopBar from "@/components/layout/TopBar";
import TrafficFilters from "@/components/traffic/TrafficFilters";
import TrafficTable from "@/components/traffic/TrafficTable";
import ExportButton from "@/components/shared/ExportButton";
import type { PaginatedResponse } from "@/types/api";
import type { TrafficRecord } from "@/types/traffic";

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

export default function TrafficPage() {
  const [srcIp] = useQueryState("srcIp", { defaultValue: "" });
  const [dstIp] = useQueryState("dstIp", { defaultValue: "" });
  const [port] = useQueryState("port", { defaultValue: "" });
  const [protocol] = useQueryState("protocol", { defaultValue: "ALL" });
  const [label] = useQueryState("label", { defaultValue: "ALL" });
  const [range]   = useQueryState("range",   { defaultValue: "24h" });
  const [country] = useQueryState("country", { defaultValue: "" });
  const [city]    = useQueryState("city",    { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [sort, setSort] = useQueryState("sort", { defaultValue: "timestamp" });
  const [order, setOrder] = useQueryState("order", { defaultValue: "desc" });

  const params = new URLSearchParams();
  if (srcIp) params.set("srcIp", srcIp);
  if (dstIp) params.set("dstIp", dstIp);
  if (port) params.set("port", port);
  if (protocol && protocol !== "ALL") params.set("protocol", protocol);
  if (label && label !== "ALL") params.set("label", label);
  params.set("range", range ?? "24h");
  if (country) params.set("country", country);
  if (city)    params.set("city", city);
  params.set("page", page ?? "1");
  params.set("pageSize", "100");
  params.set("sort", sort ?? "timestamp");
  params.set("order", order ?? "desc");

  const { data, isLoading } = useSWR<PaginatedResponse<TrafficRecord>>(
    `/api/traffic?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  );

  const handleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage("1");
  };

  const attackCount = data?.data.filter(
    (r) => r.label === "1" || r.label === "ATTACK"
  ).length ?? 0;

  const exportParams: Record<string, string> = { range: range ?? "24h" };
  if (label && label !== "ALL") exportParams.label = label;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar
        title="TRAFFIC MONITOR"
        actions={<ExportButton collection="traffic" params={exportParams} />}
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
        <TrafficFilters />

        {/* Stats bar */}
        {data && (
          <div
            style={{
              padding: "8px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
              }}
            >
              {data.total.toLocaleString()} records
            </span>
            {attackCount > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--risk-critical)",
                  background: "var(--risk-critical-dim)",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  fontWeight: 600,
                }}
              >
                {attackCount} ATTACKS on this page
              </span>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: "36px", borderRadius: "3px" }}
                />
              ))}
            </div>
          ) : (
            <TrafficTable
              data={data?.data ?? []}
              total={data?.total ?? 0}
              page={data?.page ?? 1}
              pageSize={data?.pageSize ?? 100}
              totalPages={data?.totalPages ?? 1}
              sortField={sort ?? "timestamp"}
              sortOrder={(order as "asc" | "desc") ?? "desc"}
              onSort={handleSort}
              onPageChange={(p) => setPage(String(p))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
