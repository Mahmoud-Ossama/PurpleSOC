"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Globe, ScrollText, Network, FileWarning,
  LayoutDashboard, Menu, X, Shield
} from "lucide-react";

const PAGES = [
  { href: "/",        icon: LayoutDashboard, label: "Overview" },
  { href: "/map",     icon: Globe,           label: "Threat Map" },
  { href: "/logs",    icon: ScrollText,      label: "HTTP Logs" },
  { href: "/traffic", icon: Network,         label: "Traffic" },
  { href: "/reports", icon: FileWarning,     label: "Reports" },
];

export default function KasperskyNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isMap = pathname === "/map";

  return (
    <>
      {/* ── Top bar ── */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: "48px",
          background: isMap ? "rgba(7,10,13,0.75)" : "var(--bg-surface)",
          backdropFilter: isMap ? "blur(20px)" : "none",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "16px",
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div style={{ position: "relative", width: "20px", height: "20px" }}>
            <Shield size={20} style={{ color: "var(--accent-cyan)", position: "relative", zIndex: 1 }} />
          </div>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-primary)",
            letterSpacing: "0.12em",
          }}>
            SOC<span style={{ color: "var(--accent-cyan)" }}>·</span>INTEL
          </span>
        </div>

        {/* Nav tabs — center */}
        <nav style={{
          display: "flex",
          gap: "2px",
          margin: "0 auto",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          padding: "3px",
        }}>
          {PAGES.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontSize: "11px",
                  fontWeight: active ? 600 : 400,
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.02em",
                  color: active ? "var(--accent-cyan)" : "var(--text-tertiary)",
                  background: active ? "var(--accent-cyan-dim)" : "transparent",
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-tertiary)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div style={{ position: "relative", width: "8px", height: "8px" }}>
            <span style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              background: "var(--risk-low)",
              animation: "pulse-ring 2s ease-out infinite",
              opacity: 0.5,
            }} />
            <span style={{
              position: "absolute", inset: "1px",
              borderRadius: "50%",
              background: "var(--risk-low)",
            }} />
          </div>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--risk-low)",
            letterSpacing: "0.08em",
          }}>
            LIVE
          </span>
        </div>
      </div>
    </>
  );
}
