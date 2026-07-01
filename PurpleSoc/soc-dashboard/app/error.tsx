"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: "16px",
        color: "var(--text-tertiary)",
      }}
    >
      <AlertTriangle size={40} strokeWidth={1} color="var(--risk-high)" />
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: "6px",
          }}
        >
          Something went wrong
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-tertiary)", maxWidth: "300px" }}>
          {error.message ?? "An unexpected error occurred"}
        </p>
      </div>
      <button
        onClick={reset}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 18px",
          borderRadius: "4px",
          border: "1px solid var(--border-strong)",
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
          fontSize: "12px",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
        }}
      >
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}
