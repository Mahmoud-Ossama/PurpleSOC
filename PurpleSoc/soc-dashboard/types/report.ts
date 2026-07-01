export interface ThreatReport {
  _id: string;
  report_id: string;
  log_ids: string[];
  risk_score: number;
  threat_category: string;
  ai_insights: string;
  recommendations: string[];
  is_true_positive: boolean;
  created_at: string;
  source_ip: string;
}

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 8) return "CRITICAL";
  if (score >= 6) return "HIGH";
  if (score >= 4) return "MEDIUM";
  return "LOW";
}

export function getRiskColor(score: number): string {
  if (score >= 8) return "var(--risk-critical)";
  if (score >= 6) return "var(--risk-high)";
  if (score >= 4) return "var(--risk-medium)";
  return "var(--risk-low)";
}

export function getRiskDimColor(score: number): string {
  if (score >= 8) return "var(--risk-critical-dim)";
  if (score >= 6) return "var(--risk-high-dim)";
  if (score >= 4) return "var(--risk-medium-dim)";
  return "var(--risk-low-dim)";
}
