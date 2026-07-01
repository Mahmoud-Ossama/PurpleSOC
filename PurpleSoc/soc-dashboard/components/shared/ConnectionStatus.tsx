"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status: "ok" | "error";
  latency: number;
}

export default function ConnectionStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json();
        setHealth(data);
        setBlink(true);
        setTimeout(() => setBlink(false), 300);
      } catch {
        setHealth({ status: "error", latency: 0 });
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const isOk = health?.status === "ok";
  const color = isOk ? "var(--risk-low)" : "var(--risk-critical)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "6px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
      }}
      title={
        health
          ? `MongoDB ${health.status} · ${health.latency}ms`
          : "Checking..."
      }
    >
      <div style={{ position: "relative", width: "8px", height: "8px" }}>
        {/* Pulse ring */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: color,
            opacity: blink ? 0.9 : 0.5,
            animation: isOk ? "pulse-ring 2s ease-out infinite" : "none",
          }}
        />
        {/* Core dot */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: color,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--text-secondary)",
        }}
      >
        {health
          ? isOk
            ? `DB · ${health.latency}ms`
            : "DB · ERR"
          : "DB · …"}
      </span>
    </div>
  );
}
