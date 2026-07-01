"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  Network,
  FileWarning,
  Globe,
} from "lucide-react";
import ConnectionStatus from "@/components/shared/ConnectionStatus";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/logs", icon: ScrollText, label: "Logs" },
  { href: "/traffic", icon: Network, label: "Traffic" },
  { href: "/reports", icon: FileWarning, label: "Reports" },
  { href: "/map", icon: Globe, label: "Threat Map" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "240px",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--accent-cyan)",
              position: "relative",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "50%",
              background: "var(--accent-cyan)",
              opacity: 0.2,
              animation: "pulse-ring 2s ease-out infinite",
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text-primary)",
              letterSpacing: "0.1em",
            }}
          >
            SOC INTEL
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-tertiary)",
              letterSpacing: "0.06em",
              marginTop: "1px",
            }}
          >
            SECURITY DASHBOARD
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px" }}>
        <div
          style={{
            padding: "8px 8px 4px",
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-tertiary)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "4px",
                marginBottom: "2px",
                textDecoration: "none",
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                background: isActive ? "var(--accent-cyan-dim)" : "transparent",
                borderLeft: isActive
                  ? "2px solid var(--accent-cyan)"
                  : "2px solid transparent",
                fontSize: "13px",
                fontWeight: isActive ? 500 : 400,
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "var(--bg-elevated)";
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--text-secondary)";
                }
              }}
            >
              <Icon
                size={15}
                color={
                  isActive ? "var(--accent-cyan)" : "currentColor"
                }
                strokeWidth={isActive ? 2 : 1.5}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <ConnectionStatus />
      </div>
    </aside>
  );
}
