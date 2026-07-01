import { Search } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  onClear?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = "No results found",
  subtitle = "Try adjusting your filters or expanding the time range",
  onClear,
  icon,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 32px",
        gap: "12px",
        color: "var(--text-tertiary)",
      }}
    >
      <div style={{ marginBottom: "4px" }}>
        {icon ?? <Search size={40} strokeWidth={1} />}
      </div>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-tertiary)",
          margin: 0,
          textAlign: "center",
          maxWidth: "280px",
        }}
      >
        {subtitle}
      </p>
      {onClear && (
        <button
          onClick={onClear}
          style={{
            marginTop: "8px",
            padding: "6px 16px",
            borderRadius: "4px",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
