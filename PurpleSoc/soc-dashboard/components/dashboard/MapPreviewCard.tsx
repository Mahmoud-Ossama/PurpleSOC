"use client";

import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import { useState } from "react";

interface MapPreviewCardProps {
  attackTotal: number;
}

export default function MapPreviewCard({ attackTotal }: MapPreviewCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/map"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        background: "var(--bg-surface)",
        border: `1px solid ${hovered ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
        borderRadius: "6px",
        overflow: "hidden",
        textDecoration: "none",
        position: "relative",
        transition: "border-color 150ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "radial-gradient(ellipse at 40% 50%, #0D1A2E 0%, #0A0C0F 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
          minHeight: "240px",
        }}
      >
        {/* Decorative grid */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }}
          viewBox="0 0 600 280"
          preserveAspectRatio="xMidYMid slice"
        >
          {[60, 100, 140, 180, 220].map((y) => (
            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--accent-cyan)" strokeWidth="0.5" />
          ))}
          {[60, 120, 180, 240, 300, 360, 420, 480, 540].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="280" stroke="var(--accent-cyan)" strokeWidth="0.5" />
          ))}
          <path d="M100,140 Q200,60 350,130" fill="none" stroke="var(--risk-critical)" strokeWidth="1.5" opacity="0.6" />
          <path d="M480,90 Q380,50 200,140" fill="none" stroke="var(--risk-high)" strokeWidth="1.5" opacity="0.5" />
          <path d="M50,110 Q250,30 500,150" fill="none" stroke="var(--risk-critical)" strokeWidth="1" opacity="0.4" />
          <path d="M400,170 Q300,80 150,130" fill="none" stroke="var(--risk-medium)" strokeWidth="1" opacity="0.4" />
          <circle cx="100" cy="140" r="4" fill="var(--risk-critical)" opacity="0.9" />
          <circle cx="100" cy="140" r="8" fill="var(--risk-critical)" opacity="0.2" />
          <circle cx="480" cy="90" r="3" fill="var(--risk-high)" opacity="0.9" />
          <circle cx="350" cy="130" r="5" fill="var(--accent-cyan)" opacity="0.6" />
          <circle cx="200" cy="140" r="4" fill="var(--risk-critical)" opacity="0.8" />
          <circle cx="50" cy="110" r="3" fill="var(--risk-high)" opacity="0.7" />
        </svg>

        <Globe size={32} style={{ color: "var(--accent-cyan)", opacity: 0.7, position: "relative" }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
            THREAT MAP
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            Click to open live view <ExternalLink size={10} />
          </div>
        </div>

        {attackTotal > 0 && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "var(--risk-critical-dim)",
              border: "1px solid #ff3b3b40",
              borderRadius: "4px",
              padding: "4px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--risk-critical)",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {attackTotal.toLocaleString()} ATTACKS
          </div>
        )}
      </div>
    </Link>
  );
}
