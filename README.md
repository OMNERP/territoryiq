# 🗺 TerritoryIQ

**Premium Enterprise Territory Intelligence & Medical Sales Force Platform**

> Built for healthcare and nutraceutical companies to manage field operations, doctor relationships, territory coverage, and sales analytics — all in one modern web application.

---

## ✨ Feature Highlights

| Module | Features |
|--------|----------|
| **Territory Map** | OpenStreetMap + Leaflet, live MR pins, coverage heatmaps, boundary overlays |
| **MR Management** | Live GPS tracking, target monitoring, route replay, geo attendance |
| **Doctor CRM** | Full profiles, prescription potential scoring, visit history, AI-ready segmentation |
| **Customer Coverage** | Pharmacies, clinics, hospitals, retailers — geo-tagged and visit-tracked |
| **Visit Tracking** | GPS check-in/out, geo validation (300m radius), fake check-in detection |
| **Route Planner** | OSRM routing, nearest-neighbour optimization, efficiency scoring |
| **Coverage Intel** | Gap detection, heatmaps, territory comparison, density analysis |
| **DAR** | Mobile daily activity reports with offline support |
| **Analytics** | Recharts dashboards, compliance reports, product promotion tracking |
| **Alerts** | Real-time via Socket.io — geo anomalies, low coverage, inactive MRs |
| **RBAC** | 5 roles: Admin, Sales Manager, Regional Manager, MR, Marketing Manager |
| **PWA** | Mobile-first, installable, offline-capable |

---

## 🚀 Quick Start

```bash
git clone https://github.com/yourorg/territoryiq.git
cd territoryiq
cp .env.example .env          # fill in your secrets
docker-compose up -d          # starts DB, Redis, API, Frontend
docker-compose exec backend npm run seed   # load sample data
```

Open **http://localhost:3000** → login with `admin@territoryiq.com / Admin@123`

For full instructions see [docs/INSTALLATION.md](docs/INSTALLATION.md).

---

## 🏗 Tech Stack

```
Frontend:   Next.js 14 · TypeScript · Tailwind CSS · Zustand · Recharts
Maps:       Leaflet.js · OpenStreetMap · Nominatim · OSRM
Backend:    Node.js · Express · TypeScript · Socket.io
Database:   PostgreSQL 16 + PostGIS · Redis 7
Auth:       JWT (access + refresh) · RBAC
Deploy:     Docker · Docker Compose
```

---

## 📁 Docs

- [Installation Guide](docs/INSTALLATION.md)
- [API Reference](docs/API.md)

---

## 📸 Module Overview

- **`/dashboard`** — KPI cards, coverage trend, live MR feed, activity stream
- **`/territory`** — Interactive OSM map + territory performance table
- **`/coverage`** — Heatmap, gap detection, entity-type breakdown
- **`/mrs`** — Live field rep status, productivity chart, CRUD
- **`/visits`** — GPS-validated visit log with geo compliance
- **`/routes`** — Route plan with Leaflet waypoints + OSRM distance
- **`/doctors`** — CRM table with specialty filters and potential scoring
- **`/customers`** — Multi-type customer management
- **`/products`** — Promotion tracking and sample distribution
- **`/analytics`** — Charts: visit trends, MR productivity, territory comparison
- **`/alerts`** — Severity-grouped alerts with resolve workflow
- **`/dar`** — Daily Activity Reports submitted by MRs

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@territoryiq.com | Admin@123 |
| Sales Manager | manager.north@territoryiq.com | Manager@123 |
| Medical Rep | mr.rajesh@territoryiq.com | MR@12345 |

---

*TerritoryIQ v1.0 — Built with ❤️ for healthcare field teams*
