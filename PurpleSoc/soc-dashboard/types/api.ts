export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface KpiData {
  totalThreats: number;
  activeSourceIps: number;
  avgRiskScore: number;
  criticalAlerts: number;
  delta: {
    totalThreats: number;
    activeSourceIps: number;
    avgRiskScore: number;
    criticalAlerts: number;
  };
}

export interface TopAttacker {
  ip: string;
  count: number;
}

export interface ProtocolDist {
  protocol: number;
  count: number;
}

export interface TrafficTimelinePoint {
  date: string;
  attack: number;
  benign: number;
}

export interface StatsResponse {
  kpi: KpiData;
  topAttackers: TopAttacker[];
  protocolDist: ProtocolDist[];
  trafficTimeline: TrafficTimelinePoint[];
  recentThreats: import("./report").ThreatReport[];
}

export interface GeoLocation {
  ip: string;
  lat: number;
  lng: number;
  country?: string;
  country_code?: string;   // ISO-3166-1 alpha-2, e.g. "US"
  city?: string;
  isPrivate?: boolean;
}

export interface AttackArcData {
  id: string;
  src_ip: string;
  dst_ip: string;
  src_lat: number;
  src_lng: number;
  dst_lat: number;
  dst_lng: number;
  risk_score: number;
  threat_category: string;
  timestamp: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  latency: number;
  db: string;
}

// ── Geo Analytics ─────────────────────────────────────────────────────────────
export interface GeoCountryStat {
  country: string;
  country_code?: string;  // ISO alpha-2
  count: number;
  avgRisk: number;
}

export interface GeoCityStat {
  city: string;
  country: string;
  count: number;
}

export interface AttackHourStat {
  hour: string;   // "HH:00"
  count: number;
}

export interface GeoStatsResponse {
  topCountries:   GeoCountryStat[];
  topCities:      GeoCityStat[];
  internal:       number;
  external:       number;
  unknown:        number;
  attacksPerHour: AttackHourStat[];
}
