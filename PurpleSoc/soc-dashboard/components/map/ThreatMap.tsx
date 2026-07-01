"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AttackArcData } from "@/types/api";
import { formatRelativeTime } from "@/lib/utils";

// ---- Types ----
interface ArcState {
  data: AttackArcData;
  progress: number; // 0..1
  duration: number; // ms
  startTime: number;
  phase: "draw" | "travel" | "fade";
  drawProgress: number; // 0..1 for arc draw-in
}

interface NodeInfo {
  ip: string;
  lat: number;
  lng: number;
  count: number;
  maxRisk: number;
  country?: string;
  city?: string;
  isPrivate?: boolean;
}

interface TickerItem {
  src_ip: string;
  dst_ip: string;
  risk_score: number;
  timestamp: string;
}

function getRiskColor(score: number): string {
  if (score >= 8) return "#FF3B3B";
  if (score >= 6) return "#FF8C00";
  if (score >= 4) return "#FFD60A";
  return "#34C759";
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Quadratic bezier point
function bezierPoint(
  t: number,
  p0x: number, p0y: number,
  p1x: number, p1y: number,
  p2x: number, p2y: number
) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x,
    y: mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y,
  };
}

// Stats panel
function StatsPanel({
  arcCount,
  nodes,
  ticker,
}: {
  arcCount: number;
  nodes: NodeInfo[];
  ticker: TickerItem[];
}) {
  const topCountry = nodes.reduce(
    (acc, n) => {
      if (!n.country || n.isPrivate) return acc;
      acc[n.country] = (acc[n.country] ?? 0) + n.count;
      return acc;
    },
    {} as Record<string, number>
  );
  const topCountryEntry = Object.entries(topCountry).sort(([, a], [, b]) => b - a)[0];
  const aps = ticker.length > 0 ? (ticker.length / 5).toFixed(1) : "0.0";

  return (
    <div
      className="glass"
      style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        width: "240px",
        borderRadius: "8px",
        padding: "16px",
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Live Intelligence
      </div>

      {[
        {
          label: "Attacks / Sec",
          value: aps,
          color: "var(--risk-critical)",
        },
        {
          label: "Active Arcs",
          value: String(arcCount),
          color: "var(--accent-cyan)",
        },
        {
          label: "Top Origin",
          value: topCountryEntry ? `${topCountryEntry[0]}` : "—",
          color: "var(--risk-high)",
        },
        {
          label: "Unique Attackers",
          value: String(nodes.length),
          color: "var(--risk-medium)",
        },
      ].map((stat) => (
        <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {stat.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 600,
              color: stat.color,
            }}
          >
            {stat.value}
          </span>
        </div>
      ))}

      {/* Legend */}
      <div
        style={{
          paddingTop: "8px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {[
          { color: "#FF3B3B", label: "Critical (8-10)" },
          { color: "#FF8C00", label: "High (6-7.9)" },
          { color: "#FFD60A", label: "Medium (4-5.9)" },
          { color: "#34C759", label: "Low (0-3.9)" },
        ].map((l) => (
          <div
            key={l.label}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: l.color,
                display: "inline-block",
                flexShrink: 0,
                boxShadow: `0 0 6px ${l.color}`,
              }}
            />
            <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ticker
function AttackTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;
  const content = items
    .map(
      (t) =>
        `${t.risk_score >= 8 ? "🔴" : t.risk_score >= 6 ? "🟠" : "🟡"} ${t.src_ip} → ${t.dst_ip} | ${t.risk_score >= 8 ? "CRITICAL" : t.risk_score >= 6 ? "HIGH" : "MEDIUM"} | ${formatRelativeTime(t.timestamp)}`
    )
    .join("     ·     ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "36px",
        background: "rgba(10,12,15,0.92)",
        borderTop: "1px solid var(--border-subtle)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "0 12px",
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--risk-critical)",
          letterSpacing: "0.1em",
          borderRight: "1px solid var(--border-subtle)",
          marginRight: "8px",
          whiteSpace: "nowrap",
        }}
      >
        LIVE
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            display: "inline-flex",
            gap: "0",
            animation: "ticker-scroll 40s linear infinite",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-secondary)",
              paddingRight: "40px",
            }}
          >
            {content}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-secondary)",
              paddingRight: "40px",
            }}
          >
            {content}
          </span>
        </div>
      </div>
    </div>
  );
}

// Side panel
function SidePanel({
  open,
  nodes,
  onClose,
  timeRange,
  onTimeRangeChange,
}: {
  open: boolean;
  nodes: NodeInfo[];
  onClose: () => void;
  timeRange: string;
  onTimeRangeChange: (r: string) => void;
}) {
  const sorted = [...nodes].sort((a, b) => b.count - a.count).slice(0, 20);
  const maxCount = sorted[0]?.count ?? 1;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: "36px",
        width: "300px",
        background: "rgba(17,20,24,0.95)",
        backdropFilter: "blur(12px)",
        borderLeft: "1px solid var(--border-subtle)",
        zIndex: 400,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Top Attackers
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Time range */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        {["1h", "6h", "24h", "7d"].map((r) => (
          <button
            key={r}
            onClick={() => onTimeRangeChange(r)}
            style={{
              padding: "3px 9px",
              borderRadius: "3px",
              border: "none",
              background: timeRange === r ? "var(--accent-cyan-dim)" : "var(--bg-elevated)",
              color: timeRange === r ? "var(--accent-cyan)" : "var(--text-secondary)",
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Attacker list */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {sorted.map((node, i) => (
          <div
            key={node.ip}
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: node.isPrivate ? "var(--accent-cyan)" : "var(--text-primary)",
                }}
              >
                {node.ip}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: getRiskColor(node.maxRisk),
                  fontWeight: 600,
                }}
              >
                {node.count}
              </span>
            </div>
            <div
              style={{
                height: "3px",
                background: "var(--bg-elevated)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(node.count / maxCount) * 100}%`,
                  background: getRiskColor(node.maxRisk),
                  borderRadius: "2px",
                  transition: `width 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 30}ms`,
                }}
              />
            </div>
            {node.country && (
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                {node.isPrivate ? "Internal Network" : node.country}
                {node.city ? ` · ${node.city}` : ""}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Main ThreatMap ----
export default function ThreatMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const arcPoolRef = useRef<ArcState[]>([]);
  const arcDataRef = useRef<AttackArcData[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [sideOpen, setSideOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("24h");
  const [arcCount, setArcCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lat/lng to canvas pixel
  const latLngToCanvas = useCallback((lat: number, lng: number): { x: number; y: number } | null => {
    const map = leafletMapRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return null;
    try {
      const point = map.latLngToContainerPoint([lat, lng]);
      return { x: point.x, y: point.y };
    } catch {
      return null;
    }
  }, []);

  // Init leaflet
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      leafletMapRef.current = map;

      // Resize canvas on map move/zoom
      const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      };

      map.on("move", resizeCanvas);
      map.on("zoom", resizeCanvas);
      map.on("resize", resizeCanvas);

      resizeCanvas();
      setMapReady(true);
    };

    initMap();
  }, []);

  // Fetch arc data
  const fetchArcs = useCallback(async () => {
    try {
      const res = await fetch(`/api/geo?mode=arcs&limit=200`, {
        cache: "no-store",
      });
      const data = await res.json();
      arcDataRef.current = data.arcs ?? [];
    } catch (err) {
      console.error("Failed to fetch arcs", err);
    }
  }, []);

  // Fetch nodes
  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch(`/api/geo?mode=nodes&range=${timeRange}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setNodes(data.nodes ?? []);
    } catch (err) {
      console.error("Failed to fetch nodes", err);
    }
  }, [timeRange]);

  // Fetch ticker
  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch(`/api/geo?mode=ticker`, { cache: "no-store" });
      const data = await res.json();
      setTicker(data.ticker ?? []);
    } catch (err) {
      console.error("Failed to fetch ticker", err);
    }
  }, []);

  // Initial load + intervals
  useEffect(() => {
    if (!mapReady) return;

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchArcs(), fetchNodes(), fetchTicker()]);
      setLoading(false);
    };

    loadAll();

    const arcInterval = setInterval(fetchArcs, 30_000);
    const tickerInterval = setInterval(fetchTicker, 5_000);
    const nodesInterval = setInterval(fetchNodes, 60_000);

    return () => {
      clearInterval(arcInterval);
      clearInterval(tickerInterval);
      clearInterval(nodesInterval);
    };
  }, [mapReady, fetchArcs, fetchNodes, fetchTicker]);

  // Add node markers to leaflet
  useEffect(() => {
    if (!mapReady || nodes.length === 0) return;

    const initNodes = async () => {
      const L = (await import("leaflet")).default;
      const map = leafletMapRef.current;
      if (!map) return;

      // Remove old markers (simple approach: re-add)
      nodes.forEach((node) => {
        if (node.lat === 0 && node.lng === 0 && !node.isPrivate) return;

        const color = getRiskColor(node.maxRisk);
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:16px;height:16px;">
              <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.2;animation:pulse-ring 2s ease-out infinite;"></div>
              <div style="position:absolute;inset:2px;border-radius:50%;background:${color};opacity:0.4;animation:pulse-ring 2s ease-out 0.5s infinite;"></div>
              <div style="position:absolute;inset:4px;border-radius:50%;background:${color};"></div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker(
          [node.isPrivate ? 20 : node.lat, node.isPrivate ? 0 : node.lng],
          { icon }
        );

        marker.bindTooltip(
          `<div style="font-family:var(--font-mono);font-size:11px;padding:4px 0;">
            <div style="color:${color};font-weight:700;">${node.ip}</div>
            <div style="color:var(--text-secondary);">${node.country ?? "Unknown"}</div>
            <div style="color:var(--text-secondary);">Attacks: ${node.count}</div>
            <div style="color:var(--text-secondary);">Max Risk: ${node.maxRisk.toFixed(1)}</div>
          </div>`,
          { className: "leaflet-tooltip-dark", direction: "top" }
        );

        marker.addTo(map);
      });
    };

    initNodes();
  }, [nodes, mapReady]);

  // Arc pool management + canvas animation
  useEffect(() => {
    if (!mapReady || arcDataRef.current.length === 0) return;

    const POOL_SIZE = 50;
    const SPAWN_INTERVAL = 150; // ms between spawns
    let dataIndex = 0;
    let lastSpawn = 0;

    const spawnArc = (now: number): ArcState | null => {
      const pool = arcDataRef.current;
      if (pool.length === 0) return null;
      const d = pool[dataIndex % pool.length];
      dataIndex++;
      return {
        data: d,
        progress: 0,
        duration: 1500 + Math.random() * 2500,
        startTime: now,
        phase: "draw",
        drawProgress: 0,
      };
    };

    const draw = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Spawn new arcs if pool not full
      if (
        arcPoolRef.current.length < POOL_SIZE &&
        now - lastSpawn > SPAWN_INTERVAL &&
        arcDataRef.current.length > 0
      ) {
        const arc = spawnArc(now);
        if (arc) arcPoolRef.current.push(arc);
        lastSpawn = now;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const alive: ArcState[] = [];

      for (const arc of arcPoolRef.current) {
        const elapsed = now - arc.startTime;
        const color = getRiskColor(arc.data.risk_score);

        // Get pixel coords
        const src = latLngToCanvas(arc.data.src_lat, arc.data.src_lng);
        const dst = latLngToCanvas(arc.data.dst_lat, arc.data.dst_lng);

        if (!src || !dst) {
          alive.push(arc);
          continue;
        }

        // Bezier control point (perpendicular midpoint elevated)
        const midX = (src.x + dst.x) / 2;
        const midY = (src.y + dst.y) / 2;
        const dx = dst.x - src.x;
        const dy = dst.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const altitude = Math.min(dist * 0.3, canvas.height * 0.25);
        const cpX = midX - (dy / dist) * altitude;
        const cpY = midY + (dx / dist) * altitude;

        // Phases
        if (arc.phase === "draw") {
          arc.drawProgress = Math.min(elapsed / 400, 1);

          // Draw arc line partially
          ctx.beginPath();
          ctx.strokeStyle = color + "4D"; // 30% opacity
          ctx.lineWidth = 1.5;
          const steps = 40;
          for (let i = 0; i <= Math.round(steps * arc.drawProgress); i++) {
            const t = i / steps;
            const p = bezierPoint(t, src.x, src.y, cpX, cpY, dst.x, dst.y);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          if (arc.drawProgress >= 1) {
            arc.phase = "travel";
            arc.startTime = now;
          }
        } else if (arc.phase === "travel") {
          const travelElapsed = now - arc.startTime;
          arc.progress = Math.min(travelElapsed / arc.duration, 1);

          // Full arc line
          ctx.beginPath();
          ctx.strokeStyle = color + "33";
          ctx.lineWidth = 1.5;
          const steps = 40;
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const p = bezierPoint(t, src.x, src.y, cpX, cpY, dst.x, dst.y);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          // Traveling dot
          const dotPos = bezierPoint(
            arc.progress,
            src.x, src.y,
            cpX, cpY,
            dst.x, dst.y
          );

          // Glow
          const grd = ctx.createRadialGradient(dotPos.x, dotPos.y, 0, dotPos.x, dotPos.y, 12);
          grd.addColorStop(0, color + "CC");
          grd.addColorStop(1, color + "00");
          ctx.beginPath();
          ctx.fillStyle = grd;
          ctx.arc(dotPos.x, dotPos.y, 12, 0, Math.PI * 2);
          ctx.fill();

          // Dot core
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(dotPos.x, dotPos.y, 3, 0, Math.PI * 2);
          ctx.fill();

          if (arc.progress >= 1) {
            arc.phase = "fade";
            arc.startTime = now;
          }
        } else {
          // fade
          const fadeElapsed = now - arc.startTime;
          const alpha = Math.max(0, 1 - fadeElapsed / 600);

          if (alpha <= 0) {
            // Recycle — respawn
            const fresh = spawnArc(now);
            if (fresh) alive.push(fresh);
            continue;
          }

          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.strokeStyle = color + "33";
          ctx.lineWidth = 1.5;
          const steps = 40;
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const p = bezierPoint(t, src.x, src.y, cpX, cpY, dst.x, dst.y);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        alive.push(arc);
      }

      arcPoolRef.current = alive;
      setArcCount(alive.filter((a) => a.phase === "travel").length);
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mapReady, latLngToCanvas]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      {/* Leaflet map container */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Canvas arc overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 400,
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(10,12,15,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 600,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "2px solid var(--border-subtle)",
                borderTopColor: "var(--accent-cyan)",
                animation: "crosshair-rotate 0.8s linear infinite",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              Loading threat intelligence…
            </span>
          </div>
        </div>
      )}

      {/* Stats panel */}
      <StatsPanel arcCount={arcCount} nodes={nodes} ticker={ticker} />

      {/* Side panel toggle */}
      <button
        onClick={() => setSideOpen((o) => !o)}
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          padding: "8px 14px",
          borderRadius: "4px",
          border: "1px solid var(--border-subtle)",
          background: "rgba(17,20,24,0.9)",
          color: "var(--text-secondary)",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          cursor: "pointer",
          zIndex: 500,
          letterSpacing: "0.06em",
          transition: "all 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-cyan)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        }}
      >
        {sideOpen ? "HIDE PANEL" : "ATTACKERS"}
      </button>

      {/* Side panel */}
      <SidePanel
        open={sideOpen}
        nodes={nodes}
        onClose={() => setSideOpen(false)}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Ticker */}
      <AttackTicker items={ticker} />
    </div>
  );
}
