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
- Support future enrichment from additional sources

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
EIPA_EXPORT_KEY=
CRON_SECRET=
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
```

### Database

```bash
npm run db:push
```

### Data Imports

```bash
npm run import:openev
npm run import:eipa
npm run import:all
```

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
