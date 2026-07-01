"use client";

import dynamic from "next/dynamic";
import TopBar from "@/components/layout/TopBar";
import { useState } from "react";

const ThreatGlobe = dynamic(() => import("@/components/map/ThreatGlobe"), {
  ssr: false,
  loading: () => <MapLoader label="INITIALIZING 3D GLOBE…" />,
});

const ThreatMap = dynamic(() => import("@/components/map/ThreatMap"), {
  ssr: false,
  loading: () => <MapLoader label="INITIALIZING 2D MAP…" />,
});

function MapLoader({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 50%, #020810 0%, #000408 100%)",
      flexDirection: "column", gap: 16, height: "100%",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "2px solid rgba(0,194,255,0.2)",
        borderTopColor: "#00C2FF",
        animation: "crosshair-rotate 0.8s linear infinite",
      }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(0,194,255,0.6)", letterSpacing: "0.1em" }}>
        {label}
      </span>
    </div>
  );
}

function ViewSlider({ mode, onChange }: { mode: "3d" | "2d"; onChange: (m: "3d" | "2d") => void }) {
  const is3d = mode === "3d";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* 2D label */}
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.06em",
        color: !is3d ? "var(--accent-cyan)" : "var(--text-tertiary)",
        transition: "color 250ms ease",
      }}>2D</span>

      {/* Slider track */}
      <div
        onClick={() => onChange(is3d ? "2d" : "3d")}
        style={{
          position: "relative",
          width: 44,
          height: 24,
          borderRadius: 12,
          background: is3d ? "var(--accent-cyan-dim)" : "var(--bg-elevated)",
          border: `1px solid ${is3d ? "var(--accent-cyan)" : "var(--border-strong)"}`,
          cursor: "pointer",
          transition: "background 250ms ease, border-color 250ms ease",
          flexShrink: 0,
        }}
      >
        {/* Thumb */}
        <div style={{
          position: "absolute",
          top: 3,
          left: is3d ? 23 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: is3d ? "var(--accent-cyan)" : "var(--text-tertiary)",
          boxShadow: is3d ? "0 0 8px var(--accent-cyan)" : "none",
          transition: "left 250ms cubic-bezier(0.4,0,0.2,1), background 250ms ease, box-shadow 250ms ease",
        }} />
      </div>

      {/* 3D label */}
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.06em",
        color: is3d ? "var(--accent-cyan)" : "var(--text-tertiary)",
        transition: "color 250ms ease",
      }}>3D</span>
    </div>
  );
}

export default function MapPage() {
  const [mode, setMode] = useState<"3d" | "2d">("3d");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar
        title={mode === "3d" ? "LIVE THREAT MAP — 3D GLOBE" : "LIVE THREAT MAP — 2D"}
        actions={<ViewSlider mode={mode} onChange={setMode} />}
      />
      <div style={{ flex: 1, marginTop: 56, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          opacity: mode === "3d" ? 1 : 0,
          pointerEvents: mode === "3d" ? "auto" : "none",
          transition: "opacity 400ms ease",
          zIndex: mode === "3d" ? 1 : 0,
        }}>
          <ThreatGlobe />
        </div>
        <div style={{
          position: "absolute", inset: 0,
          opacity: mode === "2d" ? 1 : 0,
          pointerEvents: mode === "2d" ? "auto" : "none",
          transition: "opacity 400ms ease",
          zIndex: mode === "2d" ? 1 : 0,
        }}>
          <ThreatMap />
        </div>
      </div>
    </div>
  );
}
