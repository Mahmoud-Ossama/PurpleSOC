"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface ExportButtonProps {
  collection: "logs" | "traffic" | "reports";
  params?: Record<string, string>;
}

export default function ExportButton({ collection, params = {} }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const download = async (format: "csv" | "json") => {
    setLoading(true);
    setOpen(false);
    try {
      const qp = new URLSearchParams({ collection, format, ...params });
      const res = await fetch(`/api/export?${qp.toString()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${collection}_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "4px",
          border: "1px solid var(--border-strong)",
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
          fontSize: "12px",
          cursor: loading ? "wait" : "pointer",
          fontFamily: "var(--font-body)",
          transition: "all 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-overlay)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
        }}
      >
        <Download size={13} />
        {loading ? "Exporting…" : "Export"}
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "4px",
              zIndex: 50,
              minWidth: "120px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            {(["csv", "json"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => download(fmt)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "7px 12px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                Export as {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
