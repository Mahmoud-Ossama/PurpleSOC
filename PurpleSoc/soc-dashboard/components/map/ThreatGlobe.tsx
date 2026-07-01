"use client";

import { getCountryCode } from "@/lib/countryFlag";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { formatRelativeTime } from "@/lib/utils";
import type { AttackArcData } from "@/types/api";

// ─── helpers ────────────────────────────────────────────────────────────────

function getRiskColor(score: number): THREE.Color {
  if (score >= 8) return new THREE.Color(0xff3b3b);
  if (score >= 6) return new THREE.Color(0xff8c00);
  if (score >= 4) return new THREE.Color(0xffd60a);
  return new THREE.Color(0x34c759);
}

function getRiskHex(score: number): string {
  if (score >= 8) return "#FF3B3B";
  if (score >= 6) return "#FF8C00";
  if (score >= 4) return "#FFD60A";
  return "#34C759";
}

/** lat/lng degrees → unit sphere XYZ */
function latLngToVec3(lat: number, lng: number, r = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

/** Quadratic bezier point */
function bezier3(t: number, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3): THREE.Vector3 {
  const mt = 1 - t;
  return p0.clone().multiplyScalar(mt * mt)
    .add(p1.clone().multiplyScalar(2 * mt * t))
    .add(p2.clone().multiplyScalar(t * t));
}

/** Build arc geometry over sphere surface */
function buildArcPoints(src: THREE.Vector3, dst: THREE.Vector3, segments = 60): THREE.Vector3[] {
  const mid = src.clone().add(dst).normalize();
  const dist = src.distanceTo(dst);
  const altitude = 0.3 + dist * 0.3; // higher arc for longer distances
  const ctrl = mid.clone().multiplyScalar(1 + altitude);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    pts.push(bezier3(i / segments, src, ctrl, dst));
  }
  return pts;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface ArcMesh {
  line: THREE.Line;
  particles: THREE.Points;
  progress: number;         // 0..1 travel progress
  drawProgress: number;     // 0..1 arc draw-in
  phase: "draw" | "travel" | "fade";
  phaseStart: number;       // timestamp ms
  duration: number;         // travel duration ms
  color: THREE.Color;
  points: THREE.Vector3[];
  data: AttackArcData;
  particlePositions: Float32Array;
  trailLength: number;
}

interface NodeInfo {
  ip: string;
  lat: number;
  lng: number;
  count: number;
  maxRisk: number;
  country?: string;
  isPrivate?: boolean;
}

interface TickerItem {
  src_ip: string;
  dst_ip: string;
  risk_score: number;
  timestamp: string;
}

// ─── StatsOverlay ─────────────────────────────────────────────────────────────

function StatsOverlay({ arcCount, nodes, ticker }: {
  arcCount: number;
  nodes: NodeInfo[];
  ticker: TickerItem[];
}) {
  const topCountry = nodes.reduce((acc, n) => {
    if (!n.country || n.isPrivate) return acc;
    acc[n.country] = (acc[n.country] ?? 0) + n.count;
    return acc;
  }, {} as Record<string, number>);
  const topEntry = Object.entries(topCountry).sort(([,a],[,b]) => b - a)[0];
  const aps = ticker.length > 0 ? (ticker.length / 5).toFixed(1) : "0.0";

  return (
    <div style={{
      position: "absolute", top: 16, right: 16, width: 240, zIndex: 10,
      background: "rgba(10,14,20,0.82)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(0,194,255,0.15)", borderRadius: 10,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Live Intelligence
      </div>
      {[
        { label: "Attacks / sec", value: aps,              color: "#FF3B3B" },
        { label: "Active Arcs",   value: String(arcCount), color: "#00C2FF" },
        { label: "Top Origin",    value: topEntry ? `${topEntry[0]}` : "—", color: "#FF8C00", flag: topEntry ? getCountryCode(topEntry[0]) : null },
        { label: "Unique Attackers", value: String(nodes.length), color: "#FFD60A" },
      ].map(s => (
        <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.label}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          { c: "#FF3B3B", l: "Critical  8-10" },
          { c: "#FF8C00", l: "High      6-7.9" },
          { c: "#FFD60A", l: "Medium    4-5.9" },
          { c: "#34C759", l: "Low       0-3.9" },
        ].map(r => (
          <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.c, boxShadow: `0 0 6px ${r.c}`, display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-secondary)" }}>{r.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  const text = items.map(t =>
    `${t.risk_score >= 8 ? "🔴" : t.risk_score >= 6 ? "🟠" : "🟡"} ${t.src_ip} → ${t.dst_ip}  |  ${t.risk_score >= 8 ? "CRITICAL" : t.risk_score >= 6 ? "HIGH" : "MEDIUM"}  |  ${formatRelativeTime(t.timestamp)}`
  ).join("          ·          ");

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 36, zIndex: 10,
      background: "rgba(8,10,14,0.93)", borderTop: "1px solid rgba(0,194,255,0.1)",
      display: "flex", alignItems: "center", overflow: "hidden",
    }}>
      <div style={{
        flexShrink: 0, padding: "0 14px",
        fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 800,
        color: "#FF3B3B", letterSpacing: "0.14em",
        borderRight: "1px solid rgba(255,59,59,0.3)", marginRight: 10,
      }}>LIVE</div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ display: "inline-flex", animation: "ticker-scroll 50s linear infinite", whiteSpace: "nowrap" }}>
          {[text, text].map((t, i) => (
            <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)", paddingRight: 60 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────

function SidePanel({ open, nodes, onClose, timeRange, onRangeChange }: {
  open: boolean; nodes: NodeInfo[]; onClose: () => void;
  timeRange: string; onRangeChange: (r: string) => void;
}) {
  const sorted = [...nodes].sort((a, b) => b.count - a.count).slice(0, 20);
  const max = sorted[0]?.count ?? 1;

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 36, width: 300, zIndex: 10,
      background: "rgba(10,14,20,0.94)", backdropFilter: "blur(16px)",
      borderLeft: "1px solid rgba(0,194,255,0.1)",
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform 250ms cubic-bezier(0.4,0,0.2,1)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Attackers</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 4 }}>
        {["1h","6h","24h","7d"].map(r => (
          <button key={r} onClick={() => onRangeChange(r)} style={{
            padding: "3px 9px", borderRadius: 3, border: "none",
            background: timeRange === r ? "var(--accent-cyan-dim)" : "var(--bg-elevated)",
            color: timeRange === r ? "var(--accent-cyan)" : "var(--text-secondary)",
            fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", cursor: "pointer",
          }}>{r.toUpperCase()}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {sorted.map((n, i) => (
          <div key={n.ip} style={{ padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: n.isPrivate ? "var(--accent-cyan)" : "var(--text-primary)" }}>{n.ip}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: getRiskHex(n.maxRisk) }}>{n.count}</span>
            </div>
            <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, background: getRiskHex(n.maxRisk),
                width: `${(n.count / max) * 100}%`,
                transition: `width 600ms cubic-bezier(0.34,1.56,0.64,1) ${i * 25}ms`,
              }} />
            </div>
            {n.country && <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 3 }}>{n.isPrivate ? "Internal Network" : n.country}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Globe Component ─────────────────────────────────────────────────────

export default function ThreatGlobe() {
  const mountRef    = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const globeRef    = useRef<THREE.Mesh | null>(null);
  const atmoRef     = useRef<THREE.Mesh | null>(null);
  const arcPoolRef  = useRef<ArcMesh[]>([]);
  const arcDataRef  = useRef<AttackArcData[]>([]);
  const frameRef    = useRef<number>(0);
  const isDragging  = useRef(false);
  const prevMouse   = useRef({ x: 0, y: 0 });
  const rotVel      = useRef({ x: 0, y: 0 });
  const dataIdxRef  = useRef(0);

  const [nodes,     setNodes]     = useState<NodeInfo[]>([]);
  const [ticker,    setTicker]    = useState<TickerItem[]>([]);
  const [arcCount,  setArcCount]  = useState(0);
  const [sideOpen,  setSideOpen]  = useState(false);
  const [timeRange, setTimeRange] = useState("24h");
  const [loading,   setLoading]   = useState(true);

  // ── fetch helpers ──────────────────────────────────────────────────────────
  const fetchArcs = useCallback(async () => {
    try {
      const r = await fetch("/api/geo?mode=arcs&limit=300", { cache: "no-store" });
      const d = await r.json();
      arcDataRef.current = (d.arcs ?? []).filter((a: AttackArcData) =>
        !(a.src_lat === 0 && a.src_lng === 0 && a.dst_lat === 0 && a.dst_lng === 0)
      );
    } catch { /* ignore */ }
  }, []);

  const fetchNodes = useCallback(async () => {
    try {
      const r = await fetch(`/api/geo?mode=nodes&range=${timeRange}`, { cache: "no-store" });
      const d = await r.json();
      setNodes(d.nodes ?? []);
    } catch { /* ignore */ }
  }, [timeRange]);

  const fetchTicker = useCallback(async () => {
    try {
      const r = await fetch("/api/geo?mode=ticker", { cache: "no-store" });
      const d = await r.json();
      setTicker(d.ticker ?? []);
    } catch { /* ignore */ }
  }, []);

  // ── spawn arc ──────────────────────────────────────────────────────────────
  const spawnArc = useCallback((now: number, scene: THREE.Scene): ArcMesh | null => {
    const pool = arcDataRef.current;
    if (!pool.length) return null;
    const data = pool[dataIdxRef.current % pool.length];
    dataIdxRef.current++;

    const src = latLngToVec3(data.src_lat, data.src_lng, 1.01);
    const dst = latLngToVec3(data.dst_lat, data.dst_lng, 1.01);
    if (src.distanceTo(dst) < 0.001) return null;

    const pts = buildArcPoints(src, dst);
    const color = getRiskColor(data.risk_score);

    // Arc line geometry
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { positions[i*3]=p.x; positions[i*3+1]=p.y; positions[i*3+2]=p.z; });
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(0, 3), 1)); // start with 1 pt

    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55, linewidth: 1 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);

    // Particle trail (5 particles)
    const trailLen = 6;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(trailLen * 3);
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color, size: 0.018, transparent: true, opacity: 0.9, sizeAttenuation: true });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    return {
      line, particles, progress: 0, drawProgress: 0,
      phase: "draw", phaseStart: now,
      duration: 1800 + Math.random() * 2200,
      color, points: pts, data,
      particlePositions: pPos,
      trailLength: trailLen,
    };
  }, []);

  // ── cleanup arc ────────────────────────────────────────────────────────────
  const removeArc = (arc: ArcMesh, scene: THREE.Scene) => {
    scene.remove(arc.line);
    scene.remove(arc.particles);
    arc.line.geometry.dispose();
    (arc.line.material as THREE.Material).dispose();
    arc.particles.geometry.dispose();
    (arc.particles.material as THREE.Material).dispose();
  };

  // ── init Three.js scene ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 2.8);
    cameraRef.current = camera;

    // ── starfield ──
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(6000);
    for (let i = 0; i < 6000; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 10);
      starPos[i*3]=v.x; starPos[i*3+1]=v.y; starPos[i*3+2]=v.z;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.6, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Earth globe ──
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);

    // Build procedural earth texture using canvas (no external URL needed)
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 1024; texCanvas.height = 512;
    const ctx = texCanvas.getContext("2d")!;

    // Deep ocean base
    ctx.fillStyle = "#040d1a";
    ctx.fillRect(0, 0, 1024, 512);

    // Ocean shimmer
    const oceanGrad = ctx.createRadialGradient(512, 256, 0, 512, 256, 512);
    oceanGrad.addColorStop(0, "rgba(0,50,120,0.4)");
    oceanGrad.addColorStop(1, "rgba(0,10,40,0)");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Landmass approximation using noise-based shapes
    ctx.fillStyle = "#0a1f0f";
    const landPatches = [
      // North America
      { x: 150, y: 120, rx: 80, ry: 70 },
      // South America
      { x: 230, y: 270, rx: 45, ry: 80 },
      // Europe
      { x: 480, y: 100, rx: 40, ry: 40 },
      // Africa
      { x: 490, y: 230, rx: 45, ry: 90 },
      // Asia
      { x: 640, y: 110, rx: 130, ry: 80 },
      // Australia
      { x: 740, y: 310, rx: 50, ry: 35 },
      // Greenland
      { x: 270, y: 60, rx: 30, ry: 25 },
    ];
    landPatches.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(p.rx, p.ry));
      g.addColorStop(0, "rgba(15,45,20,0.95)");
      g.addColorStop(0.6, "rgba(10,30,15,0.7)");
      g.addColorStop(1, "rgba(5,15,8,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Grid lines
    ctx.strokeStyle = "rgba(0,194,255,0.07)";
    ctx.lineWidth = 0.5;
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * 512;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
    }
    for (let lng = -180; lng <= 180; lng += 20) {
      const x = ((lng + 180) / 360) * 1024;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }

    const earthTex = new THREE.CanvasTexture(texCanvas);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      shininess: 8,
      specular: new THREE.Color(0x001133),
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);
    globeRef.current = earth;

    // ── Atmosphere (outer glow) ──
    const atmoGeo = new THREE.SphereGeometry(1.12, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0,0,1.0)), 3.0);
          gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmo);
    atmoRef.current = atmo;

    // ── Inner atmosphere (fresnel rim) ──
    const rimGeo = new THREE.SphereGeometry(1.005, 64, 64);
    const rimMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = 1.0 - dot(vNormal, vec3(0,0,1.0));
          rim = pow(rim, 4.0);
          gl_FragColor = vec4(0.0, 0.7, 1.0, rim * 0.35);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(rimGeo, rimMat));

    // ── Lights ──
    const ambient = new THREE.AmbientLight(0x111122, 1.2);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x4488ff, 0.8);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const backLight = new THREE.DirectionalLight(0x001144, 0.4);
    backLight.position.set(-5, -2, -3);
    scene.add(backLight);

    // ── Render loop ──
    let lastTime = 0;
    const POOL_SIZE = 50;
    const SPAWN_INTERVAL = 180;
    let lastSpawn = 0;

    const animate = (now: number) => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      // Auto-rotate (slow)
      if (!isDragging.current) {
        rotVel.current.y *= 0.95;
        rotVel.current.x *= 0.95;
        earth.rotation.y += 0.0008 + rotVel.current.y;
        earth.rotation.x += rotVel.current.x;
        earth.rotation.x = Math.max(-0.5, Math.min(0.5, earth.rotation.x));
      }

      // Spawn arcs
      if (arcPoolRef.current.length < POOL_SIZE && now - lastSpawn > SPAWN_INTERVAL && arcDataRef.current.length > 0) {
        const arc = spawnArc(now, scene);
        if (arc) arcPoolRef.current.push(arc);
        lastSpawn = now;
      }

      // Update arcs
      const alive: ArcMesh[] = [];
      for (const arc of arcPoolRef.current) {
        const elapsed = now - arc.phaseStart;
        const mat = arc.line.material as THREE.LineBasicMaterial;
        const pmat = arc.particles.material as THREE.PointsMaterial;

        if (arc.phase === "draw") {
          arc.drawProgress = Math.min(elapsed / 500, 1);
          const count = Math.max(2, Math.round(arc.points.length * arc.drawProgress));
          const positions = new Float32Array(count * 3);
          for (let i = 0; i < count; i++) {
            const p = arc.points[i];
            // Apply globe rotation
            const rotated = p.clone().applyEuler(earth.rotation);
            positions[i*3]=rotated.x; positions[i*3+1]=rotated.y; positions[i*3+2]=rotated.z;
          }
          arc.line.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          arc.line.geometry.setDrawRange(0, count);
          if (arc.drawProgress >= 1) { arc.phase = "travel"; arc.phaseStart = now; }

        } else if (arc.phase === "travel") {
          arc.progress = Math.min((now - arc.phaseStart) / arc.duration, 1);
          const count = arc.points.length;

          // Full arc (rotated)
          const positions = new Float32Array(count * 3);
          for (let i = 0; i < count; i++) {
            const rotated = arc.points[i].clone().applyEuler(earth.rotation);
            positions[i*3]=rotated.x; positions[i*3+1]=rotated.y; positions[i*3+2]=rotated.z;
          }
          arc.line.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          arc.line.geometry.setDrawRange(0, count);

          // Particle trail
          const headIdx = Math.floor(arc.progress * (count - 1));
          for (let t = 0; t < arc.trailLength; t++) {
            const idx = Math.max(0, headIdx - t * 2);
            const rotated = arc.points[idx].clone().applyEuler(earth.rotation);
            arc.particlePositions[t*3]   = rotated.x;
            arc.particlePositions[t*3+1] = rotated.y;
            arc.particlePositions[t*3+2] = rotated.z;
          }
          arc.particles.geometry.attributes.position.needsUpdate = true;
          pmat.opacity = 0.95 - arc.progress * 0.3;
          pmat.size = 0.022 - arc.progress * 0.005;

          if (arc.progress >= 1) { arc.phase = "fade"; arc.phaseStart = now; }

        } else {
          // fade
          const alpha = Math.max(0, 1 - (now - arc.phaseStart) / 700);
          mat.opacity = alpha * 0.55;
          pmat.opacity = alpha;
          if (alpha <= 0) {
            removeArc(arc, scene);
            const fresh = spawnArc(now, scene);
            if (fresh) alive.push(fresh);
            continue;
          }
        }
        alive.push(arc);
      }
      arcPoolRef.current = alive;
      setArcCount(alive.filter(a => a.phase === "travel").length);

      renderer.render(scene, camera);
    };

    animate(0);

    // Resize handler
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [spawnArc]);

  // ── drag to rotate ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !globeRef.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      rotVel.current.y = dx * 0.005;
      rotVel.current.x = dy * 0.005;
      globeRef.current.rotation.y += dx * 0.005;
      globeRef.current.rotation.x += dy * 0.005;
      globeRef.current.rotation.x = Math.max(-0.8, Math.min(0.8, globeRef.current.rotation.x));
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging.current = false; };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── zoom ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      if (!cam) return;
      cam.position.z = Math.max(1.5, Math.min(5, cam.position.z + e.deltaY * 0.003));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchArcs(), fetchNodes(), fetchTicker()]);
      setLoading(false);
    };
    load();
    const i1 = setInterval(fetchArcs, 30_000);
    const i2 = setInterval(fetchTicker, 5_000);
    const i3 = setInterval(fetchNodes, 60_000);
    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); };
  }, [fetchArcs, fetchNodes, fetchTicker]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "radial-gradient(ellipse at 50% 50%, #020810 0%, #000408 100%)", cursor: isDragging.current ? "grabbing" : "grab" }}>
      {/* WebGL canvas */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,4,8,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 16, zIndex: 20,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(0,194,255,0.2)", borderTopColor: "#00C2FF", animation: "crosshair-rotate 0.8s linear infinite" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(0,194,255,0.7)", letterSpacing: "0.1em" }}>
            LOADING THREAT INTELLIGENCE…
          </span>
        </div>
      )}

      {/* Stats */}
      <StatsOverlay arcCount={arcCount} nodes={nodes} ticker={ticker} />

      {/* Hint */}
      <div style={{
        position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)",
        fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.2)",
        letterSpacing: "0.08em", pointerEvents: "none", zIndex: 10,
      }}>
        DRAG TO ROTATE  ·  SCROLL TO ZOOM
      </div>

      {/* Attackers button */}
      <button onClick={() => setSideOpen(o => !o)} style={{
        position: "absolute", top: 16, left: 16, zIndex: 10,
        padding: "7px 14px", borderRadius: 4,
        border: "1px solid rgba(0,194,255,0.2)", background: "rgba(10,14,20,0.85)",
        color: "rgba(0,194,255,0.8)", fontSize: 11, fontFamily: "var(--font-mono)",
        fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em",
        backdropFilter: "blur(8px)",
      }}>
        {sideOpen ? "HIDE" : "ATTACKERS"}
      </button>

      {/* Side panel */}
      <SidePanel open={sideOpen} nodes={nodes} onClose={() => setSideOpen(false)} timeRange={timeRange} onRangeChange={setTimeRange} />

      {/* Live ticker */}
      <Ticker items={ticker} />
    </div>
  );
}
