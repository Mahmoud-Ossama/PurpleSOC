import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ts: string | Date): string {
  try {
    const d = typeof ts === "string" ? parseISO(ts) : ts;
    return format(d, "yyyy-MM-dd HH:mm:ss");
  } catch {
    return String(ts);
  }
}

export function formatRelativeTime(ts: string | Date): string {
  try {
    const d = typeof ts === "string" ? parseISO(ts) : ts;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return String(ts);
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function getProtocolName(protocol: number): string {
  const map: Record<number, string> = {
    1: "ICMP",
    6: "TCP",
    17: "UDP",
    22: "SSH",
    80: "HTTP",
    443: "HTTPS",
  };
  return map[protocol] ?? `PROTO/${protocol}`;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function formatDelta(delta: number): string {
  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta.toFixed(1)}`;
}

export function getTimeRangeFilter(range: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  switch (range) {
    case "1h":
      from.setHours(from.getHours() - 1);
      break;
    case "6h":
      from.setHours(from.getHours() - 6);
      break;
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    default: // 24h
      from.setDate(from.getDate() - 1);
  }
  return { from, to };
}

export function buildDateFilter(
  from?: string | null,
  to?: string | null,
  range?: string | null,
  field = "received_at"
): Record<string, unknown> {
  if (from || to) {
    const filter: Record<string, Date> = {};
    if (from) filter["$gte"] = new Date(from);
    if (to) filter["$lte"] = new Date(to);
    return { [field]: filter };
  }
  if (range) {
    const { from: f, to: t } = getTimeRangeFilter(range);
    return { [field]: { $gte: f, $lte: t } };
  }
  return {};
}

export function parseJsonSafe<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

export function countryToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const offset = 0x1f1e6;
  const chars = [...countryCode.toUpperCase()].map(
    (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + offset)
  );
  return chars.join("");
}
