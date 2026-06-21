# EV Data Platform

Open-source platform for collecting, normalizing and exploring electric vehicle and charging infrastructure data.

Built with Next.js, TypeScript, Prisma, PostgreSQL and PostGIS.

---

## Features

### EV Models

- Import EV models from OpenEV Data
- Normalize vehicle specifications
- Store battery, range and charging information
- Preserve source attribution

### Charging Infrastructure

- Import charging stations from EIPA (UDT Poland)
- Normalize station, operator and connector data
- Store geospatial coordinates
- Search stations by text, location, connector, power and operator
- Explore grouped charging stations on an OpenStreetMap-powered map with province, connector and minimum-power filters
- Open station detail pages with source, freshness, coordinate and connector metadata
- Hide technical EIPA operator identifiers from user-facing operator suggestions
- Support future enrichment from additional sources

### Data Usability

- Connector knowledge pages for CCS2, Type 2, CHAdeMO and unknown connector records
- Connector images stored in `public/connectors` with an unknown fallback image
- AC/DC badges, normalized connector labels and lightweight connector tooltips
- Charging insights dashboard for top operators, connector distribution, strongest stations and province coverage

### Searchable MVP

- Public status homepage with import counts and latest ingestion runs
- Searchable EV catalog with paginated vehicle cards
- Vehicle detail pages with battery, range, charging and source metadata
- Charging station search with connector, power, operator and freshness details
- Visible station data freshness copy, for example `Stacje: EIPA / UDT Poland, ostatni import Jun 18, 2026`
- Source links are rendered only when they use safe `http` or `https` URLs

### Data Pipeline

- Automated imports
- Idempotent upserts
- Validation layer
- Import tracking and ingestion history

---

## Tech Stack

- Next.js 15
- TypeScript
- Prisma
- PostgreSQL
- PostGIS
- Tailwind CSS
- Leaflet with OpenStreetMap tiles

---

## Data Sources

### EV Models

- OpenEV Data

### Charging Infrastructure

- EIPA (UDT Poland)

Additional data providers may be integrated in the future.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Required:

```env
DATABASE_URL=
```

Optional:

```env
CRON_SECRET=
EIPA_EXPORT_KEY=
EIPA_IMPORT_LIMIT=
OPENEV_DATA_URL=
```

---

### 3. Synchronize database schema

```bash
npm run db:push
```

---

### 4. Import EV models

```bash
npm run import:openev
```

---

### 5. Import charging stations

```bash
npm run import:eipa
```

---

### 6. Start development server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:3000
```

---

## Available Commands

### Development

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run validate
```

### Database

```bash
npm run db:push
```

### Data Imports

```bash
npm run import:openev
npm run import:eipa
npm run import:eipa:test
npm run import:all
```

---

## Public Routes

```text
/                         Status homepage with dataset counts and ingestion freshness
/vehicles                 Searchable EV catalog
/vehicles/[id]            EV battery, range, charging and source details
/stations                 Searchable Polish charging infrastructure
/stations/[id]            Charging station source, freshness and connector details
/map                      OpenStreetMap-powered charging station map with grouped markers
/connectors               Connector knowledge base
/connectors/[type]        Connector details for CCS2, Type 2, CHAdeMO and Unknown
/insights                 Charging infrastructure insights dashboard
/api/status               JSON status endpoint for deployment smoke checks
/api/cron/import-eipa     Protected EIPA import endpoint
/api/cron/import-openev   Protected OpenEV import endpoint
```

---

## Deployment Readiness

Recommended validation before deployment:

```bash
npm run validate
```

For Vercel deployment:

- Set `DATABASE_URL` to a PostGIS-enabled PostgreSQL database.
- Set `CRON_SECRET` in production before enabling cron-triggered imports.
- Add optional import variables only when needed: `EIPA_EXPORT_KEY`, `EIPA_IMPORT_LIMIT`, `OPENEV_DATA_URL`.
- Basic station geocoding uses OpenStreetMap Nominatim for user-provided location searches, does not require an API key, and uses a small in-memory cache to avoid repeated lookups for the same location.
- The `/map` experience uses Leaflet with public OpenStreetMap tiles; it does not add live availability, routing or turn-by-turn navigation.
- Run `npm run db:push`, then seed data with `npm run import:all` or the protected cron endpoints.
- Smoke check `/`, `/vehicles`, `/stations`, `/map`, `/connectors`, `/insights`, `/api/status`, and one `/vehicles/[id]` plus one `/stations/[id]` page after deployment.
- Trigger `/api/cron/import-eipa` and `/api/cron/import-openev` with `Authorization: Bearer <CRON_SECRET>` and confirm `/api/status` shows successful ingestion runs.
- Scheduled EIPA/OpenEV imports now run via GitHub Actions (`.github/workflows/import-eipa.yml`, `import-openev.yml`) rather than Vercel cron, since a full EIPA import (60-75 min) exceeds Vercel's function-duration limit. The `/api/cron/*` routes above remain available for manual/on-demand triggering.

---

## Project Structure

```text
src/
├── app/
├── lib/
│   ├── db/
│   ├── normalizers/
│   ├── sources/
│   │   ├── eipa/
│   │   └── openev/
│   └── validators/
└── server/
    └── jobs/

prisma/
└── migrations/
```

---

## Database

Core entities:

```text
EvBrand
EvModel
EvSpec
EvManualOverride

ChargingStation
ChargingOperator
ChargingConnector

DataSource
IngestionRun
```

PostGIS is used for geospatial support and future location-based queries.

---

## Import Process

```text
Source
  ↓
Fetch
  ↓
Normalize
  ↓
Validate
  ↓
Upsert
  ↓
Store
```

All imports are designed to be idempotent and can be executed repeatedly without creating duplicate records.

---

## Contributing

Issues, discussions and pull requests are welcome.

Before contributing:

- keep implementations simple
- avoid unnecessary abstractions
- preserve source attribution
- prefer maintainable solutions over complex architectures

---

## Disclaimer

This project depends on third-party data providers.

Data accuracy, completeness and update frequency depend on the underlying sources.

Always verify licensing and usage requirements before using imported datasets in commercial products.
