"use client";

import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/logs?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header
      style={{
        position: "fixed",
        left: "240px",
        right: 0,
        top: 0,
        height: "56px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "16px",
        zIndex: 90,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-primary)",
          letterSpacing: "0.04em",
          minWidth: "160px",
        }}
      >
        {title}
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        style={{ flex: 1, maxWidth: "440px", position: "relative" }}
      >
        <Search
          size={13}
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-tertiary)",
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search IPs, URLs, user agents…"
          style={{
            width: "100%",
            padding: "6px 12px 6px 30px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            outline: "none",
            transition: "border-color 150ms ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-cyan)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
          }}
        />
      </form>

      {/* Right actions */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {actions}
        <button
          onClick={handleRefresh}
          title="Refresh data"
          style={{
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--accent-cyan)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--accent-cyan)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-subtle)";
          }}
        >
          <RefreshCw
            size={13}
            style={{
              transition: "transform 600ms ease",
              transform: refreshing ? "rotate(360deg)" : "none",
            }}
          />
        </button>
      </div>
    </header>
  );
}
