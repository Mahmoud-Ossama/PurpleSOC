import * as fs from "fs";
import * as path from "path";
import { getDb } from "./mongodb";
import type { GeoLocation } from "@/types/api";

const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^::1$/,
  /^fc00:/,
  /^fd/,
  /^169\.254\./,
];

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some((r) => r.test(ip));
}

// ── Reader singleton ──────────────────────────────────────────────────────────
// Using require() to avoid TypeScript generic issues with the Reader class
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _reader: any = null;
let _readerLoaded = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getReader(): any {
  if (_readerLoaded) return _reader;
  _readerLoaded = true;

  const candidates = [
    path.join(process.cwd(), "GeoLite2-City.mmdb"),
    "/app/GeoLite2-City.mmdb",
    "/usr/share/GeoIP/GeoLite2-City.mmdb",
  ];

  for (const dbPath of candidates) {
    if (fs.existsSync(dbPath)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Reader } = require("@maxmind/geoip2-node");
        const dbBuffer = fs.readFileSync(dbPath);
        _reader = Reader.openBuffer(dbBuffer);
        console.log(`[geo] GeoLite2-City loaded from ${dbPath}`);
        return _reader;
      } catch (err) {
        console.error(`[geo] Failed to load ${dbPath}:`, err);
      }
    }
  }

  console.warn("[geo] GeoLite2-City.mmdb not found — geo lookups disabled");
  return null;
}

interface GeoResult {
  lat: number;
  lng: number;
  country?: string;
  city?: string;
}

function lookupSync(ip: string): GeoResult | null {
  try {
    const reader = getReader();
    if (!reader) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = reader.city(ip);
    if (result?.location?.latitude != null) {
      return {
        lat:     result.location.latitude  as number,
        lng:     result.location.longitude as number ?? 0,
        country: result.country?.names?.en as string | undefined,
        city:    result.city?.names?.en    as string | undefined,
      };
    }
  } catch {
    // IP not found in DB or invalid format
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function resolveIp(ip: string): Promise<GeoLocation> {
  if (isPrivateIp(ip)) {
    return { ip, lat: 0, lng: 0, country: "Internal Network", isPrivate: true };
  }

  const db    = await getDb();
  const cache = db.collection("geo_cache");

  // Check cache
  try {
    const cached = await cache.findOne({ ip });
    if (cached) {
      return {
        ip,
        lat:     cached.lat     as number,
        lng:     cached.lng     as number,
        country: cached.country as string | undefined,
        city:    cached.city    as string | undefined,
      };
    }
  } catch { /* miss */ }

  // Live lookup
  const geo    = lookupSync(ip);
  const result: GeoLocation = geo
    ? { ip, lat: geo.lat, lng: geo.lng, country: geo.country, city: geo.city }
    : { ip, lat: 0, lng: 0, country: "Unknown Location" };

  // Cache (fire & forget)
  cache.updateOne(
    { ip },
    { $set: { ip, lat: result.lat, lng: result.lng, country: result.country, city: result.city, cached_at: new Date() } },
    { upsert: true }
  ).catch(() => { /* ignore */ });

  return result;
}

export async function resolveIpsBatch(ips: string[]): Promise<GeoLocation[]> {
  return Promise.all([...new Set(ips)].map(resolveIp));
}
