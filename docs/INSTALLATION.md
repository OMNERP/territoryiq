# TerritoryIQ — Installation & Setup Guide

## Overview

TerritoryIQ is a full-stack medical sales force territory intelligence platform. This guide covers local development, Docker deployment, and production setup.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Frontend & Backend runtime |
| PostgreSQL | 14+ with PostGIS | Primary database |
| Redis | 7+ | Caching & sessions |
| Docker + Compose | Latest | Container deployment |
| Git | Latest | Source control |

---

## Option A: Docker Compose (Recommended)

The fastest way to get everything running.

### 1. Clone and configure

```bash
git clone https://github.com/yourorg/territoryiq.git
cd territoryiq

# Copy environment file
cp .env.example .env

# Edit .env with your secrets
nano .env
```

### 2. Start all services

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port 5432 (with schema auto-applied)
- **Redis** on port 6379
- **Backend API** on port 4000
- **Frontend** on port 3000

### 3. Seed sample data

```bash
docker-compose exec backend npm run seed
```

### 4. Open the app

Visit **http://localhost:3000**

Login with:
- **Admin:** admin@territoryiq.com / Admin@123
- **Manager:** manager.north@territoryiq.com / Manager@123
- **MR:** mr.rajesh@territoryiq.com / MR@12345

---

## Option B: Local Development

### 1. Install dependencies

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Set up PostgreSQL

```bash
# Create database
createdb territoryiq_db

# Enable PostGIS
psql -d territoryiq_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d territoryiq_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -d territoryiq_db -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# Apply schema
psql -d territoryiq_db -f backend/src/database/init.sql
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/territoryiq_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_min_32_char_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
FRONTEND_URL=http://localhost:3000
```

### 4. Seed sample data

```bash
cd backend
npm run seed
```

### 5. Start development servers

```bash
# From root — starts both backend and frontend concurrently
npm run dev
```

Or separately:
```bash
# Terminal 1 — Backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

---

## Project Structure

```
territoryiq/
├── docker-compose.yml          # Full stack orchestration
├── .env.example                # Environment template
│
├── backend/
│   ├── src/
│   │   ├── index.ts            # Express + Socket.io server entry
│   │   ├── config/
│   │   │   ├── database.ts     # PostgreSQL pool
│   │   │   └── redis.ts        # Redis client + cache helpers
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── visit.controller.ts
│   │   │   └── analytics.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT + RBAC
│   │   │   ├── errorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── routes/              # All REST route files
│   │   ├── services/
│   │   │   ├── geo/             # Nominatim, OSRM, Haversine
│   │   │   ├── alerts/          # Alert creation and checks
│   │   │   ├── socket.service.ts # WebSocket handlers
│   │   │   └── cron.service.ts   # Scheduled jobs
│   │   ├── database/
│   │   │   ├── init.sql         # Full PostgreSQL schema
│   │   │   └── seed.ts          # Sample data seeder
│   │   └── utils/
│   │       ├── AppError.ts
│   │       └── logger.ts
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (app)/           # Authenticated route group
    │   │   │   ├── layout.tsx   # Sidebar + header shell
    │   │   │   ├── dashboard/
    │   │   │   ├── territory/
    │   │   │   ├── coverage/
    │   │   │   ├── mrs/
    │   │   │   ├── visits/
    │   │   │   ├── routes/
    │   │   │   ├── dar/
    │   │   │   ├── doctors/
    │   │   │   ├── customers/
    │   │   │   ├── products/
    │   │   │   ├── analytics/
    │   │   │   └── alerts/
    │   │   ├── login/
    │   │   ├── layout.tsx       # Root layout with fonts
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── ui/              # DataTable, Badge, Spinner, etc.
    │   │   ├── dashboard/       # KpiCard, LiveMrList, ActivityFeed
    │   │   ├── charts/          # Recharts wrappers
    │   │   ├── map/             # Leaflet components (SSR-safe)
    │   │   ├── territory/       # TerritoryTable
    │   │   └── layout/          # PageHeader
    │   ├── hooks/
    │   │   ├── useSocket.ts     # Real-time WebSocket hook
    │   │   └── useGps.ts        # GPS tracking for MRs
    │   ├── services/
    │   │   └── api.ts           # All Axios API calls
    │   ├── store/
    │   │   ├── auth.store.ts    # Zustand auth state
    │   │   └── index.ts         # Dashboard, UI, Map stores
    │   ├── types/
    │   │   └── index.ts         # All TypeScript interfaces
    │   └── lib/
    │       └── utils.ts         # cn(), fmt(), fmtCurrency(), etc.
    └── Dockerfile
```

---

## Environment Variables Reference

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `JWT_SECRET` | — | **Required.** Min 32 chars |
| `JWT_REFRESH_SECRET` | — | **Required.** Min 32 chars |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `PORT` | `4000` | API server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | Geocoding API |
| `OSRM_BASE_URL` | `https://router.project-osrm.org` | Routing API |
| `RATE_LIMIT_MAX` | `100` | Requests per window |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:4000` | WebSocket URL |

---

## User Roles & Permissions

| Role | Dashboard | All Territories | Own Territory | MR Management |
|------|-----------|----------------|---------------|---------------|
| Admin | ✅ Full | ✅ | ✅ | ✅ Create/Edit |
| Sales Manager | ✅ Full | ✅ | ✅ | ✅ Edit |
| Regional Manager | ✅ Full | ✅ | ✅ | ⚠️ View only |
| Medical Rep | ✅ Limited | ❌ | ✅ Own only | ❌ |
| Marketing Manager | ✅ Full | ✅ | ✅ | ⚠️ View only |

---

## Key Features

### Geo Validation
Every MR check-in is validated against the registered location of the doctor or customer:
- ≤ 300m → **Valid** ✅
- 300–1000m → **Suspicious** ⚠️
- > 1000m → **Invalid** ❌ + Alert fired

### Real-time Tracking
WebSocket events keep the dashboard live:
- `mr:location:update` — MR GPS ping every 60s
- `visit:checkin` — Instant check-in notification
- `alert:new` — Critical alert pushed to managers

### Route Optimization
Uses nearest-neighbour heuristic + OSRM for:
- Optimal stop order
- Estimated travel time and distance
- Route efficiency scoring (0–100)

### Cron Jobs
| Schedule | Job |
|----------|-----|
| Daily 6 PM (Mon–Sat) | Check missed doctor visits |
| Daily 9 AM (Mon–Sat) | Check low coverage territories |
| Every 2 hrs (business hours) | Detect inactive MRs |
| Midnight daily | Snapshot territory coverage |
| Sunday 2 AM | Prune GPS logs > 90 days |

---

## Production Deployment

### 1. Set strong secrets
```bash
# Generate 64-char secrets
openssl rand -hex 32   # for JWT_SECRET
openssl rand -hex 32   # for JWT_REFRESH_SECRET
```

### 2. SSL / Reverse Proxy (Nginx example)
```nginx
server {
    listen 443 ssl;
    server_name app.territoryiq.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. Build for production
```bash
docker-compose -f docker-compose.yml up -d --build
```

### 4. Database backups
```bash
# Automated daily backup
pg_dump -Fc territoryiq_db > backup_$(date +%Y%m%d).dump
```

---

## Troubleshooting

**PostGIS not found:**
```bash
sudo apt install postgresql-15-postgis-3
# or on macOS:
brew install postgis
```

**Leaflet map not rendering:**
Leaflet requires client-side rendering. All map components use `dynamic(() => import(...), { ssr: false })`. If you see blank maps, check that Leaflet CSS is loaded in `layout.tsx`.

**GPS not working on mobile:**
The app must be served over HTTPS for the Geolocation API to work in production.

**Redis connection refused:**
```bash
# Start Redis
redis-server
# or with Docker:
docker run -p 6379:6379 redis:7-alpine
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14 (App Router) |
| UI Styling | Tailwind CSS |
| State Management | Zustand |
| Charts | Recharts |
| Maps | Leaflet.js + OpenStreetMap |
| Geocoding | Nominatim API |
| Routing | OSRM API |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 + PostGIS |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.io |
| Containerization | Docker + Docker Compose |
