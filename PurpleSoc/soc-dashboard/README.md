# SOC Security Intelligence Dashboard

A MongoDB-powered real-time security operations center dashboard with live threat mapping, animated attack arcs, full HTTP log analysis, network traffic monitoring, and AI-generated threat reports.

---

## Stack

- **Frontend**: Next.js 15 (App Router) · TypeScript 5 · TailwindCSS v4
- **Charts**: Recharts (area, donut, bar) · Leaflet + Canvas (threat map)
- **Backend**: Next.js Route Handlers · MongoDB Node.js Driver v6
- **State**: nuqs (URL-synced filters) · SWR v2 (client fetching)
- **Geo**: MaxMind GeoLite2-City · MongoDB TTL geo cache

---

## Prerequisites

- Node.js 22+
- MongoDB 7 (with `ids_db` database)
- Collections: `decodeddata`, `traffic_logs`, `reports`

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url> soc-dashboard
cd soc-dashboard
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb://admin:adminpassword@localhost:27017
MONGODB_DB=ids_db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. (Optional) Add GeoIP database

Download `GeoLite2-City.mmdb` from MaxMind and place in project root:

```bash
# Sign up at https://www.maxmind.com/en/geolite2/signup
# Download GeoLite2-City.mmdb → place at ./GeoLite2-City.mmdb
```

Without GeoLite2, private IPs are placed at (0,0) and public IPs show "Unknown Location".

### 4. Run development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Docker Deployment

```bash
# Start everything (app + MongoDB)
docker compose up -d

# View logs
docker compose logs -f soc-dashboard

# Stop
docker compose down
```

The app connects to MongoDB in the same Docker network automatically.

---

## MongoDB Schema

### `decodeddata` (HTTP logs from HAProxy Lua)

```json
{
  "decoded_data": "{ ...raw JSON string... }",
  "received_at": "2026-03-16T11:52:59Z",
  "analyzed": false,
  "source_ip": "192.168.1.38",
  "method": "GET",
  "url": "http://target.com/path HTTP/1.1",
  "user_agent": "Mozilla/5.0...",
  "host": "target.com",
  "headers": { ... }
}
```

### `traffic_logs` (network flow data)

```json
{
  "src_ip": "192.168.1.38",
  "dst_ip": "172.18.0.6",
  "src_port": 61939,
  "dst_port": 443,
  "protocol": 6,
  "timestamp": "2026-03-16 11:52:59",
  "label": 1
}
```

> **Note**: `label` can be `0`/`1` (numbers), `"0"`/`"1"` (strings), or `"BENIGN"`/`"ATTACK"` — the API handles all variants.

### `reports` (AI-generated threat reports)

```json
{
  "risk_score": 8.5,
  "threat_category": "Attacker",
  "ai_insights": "...",
  "recommendations": ["Block IP", "..."],
  "is_true_positive": true,
  "created_at": "2026-03-16T11:52:59Z",
  "source_ip": "192.168.1.38"
}
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview dashboard with KPIs, charts, recent threats |
| `/logs` | HTTP log viewer with full decoded_data inspection |
| `/traffic` | Network traffic table with ATTACK/BENIGN classification |
| `/reports` | AI threat report cards with modal detail view |
| `/map` | Live animated world threat map with canvas arcs |

---

## API Routes

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Aggregated KPIs, charts, recent threats |
| `GET /api/logs` | Paginated HTTP logs with filtering |
| `GET /api/traffic` | Paginated traffic records with filtering |
| `GET /api/reports` | Paginated threat reports with filtering |
| `GET /api/geo` | Geo-resolved attack arcs, nodes, ticker |
| `GET /api/export` | CSV/JSON export of any collection |
| `GET /api/health` | MongoDB connection health check |

All routes use `Cache-Control: no-store` for real-time data.

---

## MongoDB Indexes (auto-created on first run)

```js
// decodeddata
{ received_at: -1, source_ip: 1 }

// traffic_logs
{ timestamp: -1, src_ip: 1, protocol: 1, label: 1 }

// reports
{ created_at: -1, risk_score: -1, threat_category: 1 }

// geo_cache
{ ip: 1 }  // unique
{ cached_at: 1 }  // TTL: 7 days
```

---

## Threat Map Features

- **Canvas arc animation**: Up to 50 simultaneous animated Bézier attack arcs using `requestAnimationFrame` — no DOM SVG
- **Pulsing origin nodes**: CSS keyframe pulse rings on Leaflet custom markers
- **Live ticker**: Auto-scrolling bottom bar with latest attack records (refreshes every 5s)
- **Stats overlay**: Live attacks/sec, top country, arc count
- **Side panel**: Ranked attacker list with animated bars, collapsible
- **GeoIP caching**: MongoDB TTL collection — IPs resolved once, cached 7 days
- **Private IP handling**: RFC1918 addresses labeled "Internal Network", placed at center

---

## Performance Notes

- All DB queries use compound indexes and projection (only required fields)
- Server-side filtering, sorting, and pagination — never sends full dataset to client
- Canvas arc renderer uses a fixed pool of 50 Arc objects (recycled on completion)
- `Path2D` control points computed once per arc spawn, not per frame
- SWR client-side caching with configurable `refreshInterval`
- `next/dynamic` with `ssr: false` for Leaflet (prevents SSR hydration errors)
