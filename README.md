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
- Resolve EIPA operator names via a live operator registry lookup, falling back to the pool operator name
- Show operating hours and accessibility details on station detail pages when present in the imported EIPA payload
- Support future enrichment from additional sources

### Data Usability

- Connector knowledge pages for CCS2, Type 2, CHAdeMO and unknown connector records
- Connector images stored in `public/connectors` with an unknown fallback image
- AC/DC badges, normalized connector labels and lightweight connector tooltips
- Charging insights dashboard for top operators, connector distribution, strongest stations and province coverage
- Per-station data quality: a completeness score (present/missing fields) and a freshness indicator (fresh/stale/unknown), shown as a compact badge on the station list and a full breakdown on station detail pages
- Province comparison page with station/connector counts, HPC coverage, power stats and top operators per province
- Operator comparison page with station count, province coverage and average/max power, using normalized operator names
- Infrastructure coverage page highlighting lowest/highest station-count provinces, lowest HPC-coverage provinces and the network-wide connector power availability ratio
- CSV/JSON export endpoints for province and operator comparison tables

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

## Local Development

```bash
# Install dependencies
npm install

# Set up environment (copy .env.example and configure DATABASE_URL at minimum)
cp .env.example .env

# Set up database and seed with data
npm run db:push
npm run import:all

# Start development server
npm run dev
```

Application will be available at `http://localhost:3000`.

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run test` | Run Vitest suite |
| `npm run validate` | Full validation: lint + typecheck + test + build |
| `npm run db:push` | Sync database schema |
| `npm run db:studio` | Open Prisma Studio |
| `npm run import:all` | Import all data sources |
| `npm run import:eipa` | Import EIPA charging stations |
| `npm run import:eipa:test` | Import EIPA with limit (for testing) |
| `npm run import:openev` | Import OpenEV models |

---

## API Endpoints

### Data & Status

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|--------------|
| `/api/status` | GET | Platform status: EV model count, charging station count, latest 5 ingestion runs | None |
| `/api/exports/provinces` | GET | Province comparison table (station/connector counts, HPC coverage, power stats, top operators) | `format` = `csv` (default) or `json` |
| `/api/exports/operators` | GET | Operator comparison table (station count, province coverage, average/max power) | `format` = `csv` (default) or `json` |

### Protected (Cron/Manual Imports)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/cron/import-eipa` | GET | Trigger EIPA charging station import | `Authorization: Bearer <CRON_SECRET>` (production) or unauthenticated (development) |
| `/api/cron/import-openev` | GET | Trigger OpenEV model import | `Authorization: Bearer <CRON_SECRET>` (production) or unauthenticated (development) |

**Note:** Imports run via GitHub Actions on a schedule. These endpoints support manual/on-demand triggering (EIPA imports may take 60–75 minutes and exceed typical serverless function limits).

### Web Pages

| Route | Purpose |
|-------|---------|
| `/` | Status homepage with dataset counts and ingestion freshness |
| `/vehicles` | Searchable EV catalog with paginated cards |
| `/vehicles/[id]` | EV battery, range, charging and source details |
| `/stations` | Searchable Polish charging infrastructure |
| `/stations/[id]` | Charging station source, freshness and connector details |
| `/map` | OpenStreetMap charging station map with grouped markers |
| `/connectors` | Connector knowledge base |
| `/connectors/[type]` | Connector details (CCS2, Type 2, CHAdeMO, Unknown) |
| `/insights` | Charging infrastructure insights dashboard |
| `/provinces` | Province comparison: station/connector counts, HPC coverage, power stats, top operators |
| `/operators` | Operator comparison: station count, province coverage, average/max power |
| `/coverage` | Infrastructure coverage rankings (lowest/highest station counts, HPC coverage, power availability) |

---

## Deployment & Configuration

Set environment variables before deployment:

- `DATABASE_URL` (required): PostGIS-enabled PostgreSQL connection (e.g., Neon)
- `CRON_SECRET` (production): Bearer token for import endpoints when `NODE_ENV=production`
- `EIPA_EXPORT_KEY` (optional): EIPA API export key
- `EIPA_IMPORT_LIMIT` (optional): Limit EIPA records fetched (useful for testing)
- `OPENEV_DATA_URL` (optional): Custom OpenEV Data source URL

**Pre-deployment checks:**

```bash
npm run validate
npm run db:push
npm run import:all
```

Then verify: `/`, `/vehicles`, `/stations`, `/map`, `/connectors`, `/insights`, `/provinces`, `/operators`, `/coverage`, `/api/status`, plus sample `/vehicles/[id]` and `/stations/[id]` pages. Confirm `/api/exports/provinces?format=csv`, `/api/exports/operators?format=json`, and import endpoints with `Authorization: Bearer <CRON_SECRET>`.

---

## Known Limitations

- Growth trend charts are deferred: there is no historical snapshot data yet, and a single import would only support a misleading single-point trend line.
- EIPA `payment_methods` and `authentication_methods` fields exist in the upstream source but use undocumented numeric codes and are not surfaced anywhere in the app. This is a known limitation, not a bug.
- EIPA operator name resolution was fixed to use a live `operator` registry lookup (falling back to `pool.operator_name`), which resolves most "Unknown operator" cases going forward. Stations imported before this fix still show the old placeholder names until `npm run import:eipa` is re-run to backfill them; this backfill has not been run yet.
- `/coverage` reports infrastructure coverage only. It does not predict demand, plan routes, or normalize by population.

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
