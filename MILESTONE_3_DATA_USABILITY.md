# MILESTONE 3 — DATA USABILITY

## Goal
Transform the current platform from a searchable database into a useful EV infrastructure discovery tool using existing data only.

## Constraints
- No new external APIs
- No new data providers
- No maps
- No auth
- No billing
- No route planning
- No battery health
- No used EV valuation
- No public API

## Feature 1 — Station Details Page (P0)
Route: /stations/[id]

Required:
- Station Name
- Operator
- Address
- City
- Province
- Coordinates
- Source
- Last Updated
- Connector Type
- Power (kW)
- AC/DC
- Connector Count
- Import Date
- Source Updated Date

Excluded:
- Live availability
- Pricing
- Reservations
- Occupancy
- Navigation

## Feature 2 — Connector Knowledge Base (P0)
Routes:
- /connectors
- /connectors/[type]

Support:
- CCS2
- Type2
- CHAdeMO
- Unknown

Provide:
- Name
- Description
- AC/DC
- Typical power range
- Supported regions
- Supported vehicle brands
- Image

## Feature 3 — Insights Dashboard (P1)
Route: /insights

Metrics:
- Top operators
- Connector distribution
- Highest power stations
- Coverage by province

## Feature 4 — Operator Cleanup (P0)
Hide eipa-operator-* from user-facing filters.

## Feature 5 — UX Improvements (P1)
- CCS2 / Type 2 / CHAdeMO labels
- AC/DC badges
- Connector tooltips

## Definition of Done
- Build passes
- Lint passes
- Typecheck passes
- Tests pass

---

## Agent Implementation Split

Branch:
- `feature/4-milestone-3-data-usability`
- Base: `origin/main`

Global rules for every agent:
- Use TDD where practical: add or update tests before implementation for important behavior.
- Run focused tests for touched modules before handoff.
- Do not add new external APIs, data providers, maps, auth, billing, route planning, public API, or valuation features.
- Do not add files from `/docs` to the repository.
- Use Conventional Commits.
- Do not use assistant/tool names in branch names, commit messages, PR titles, or public docs.
- Keep changes scoped to the assigned files. If a shared helper is needed, coordinate through Agent 1 first.

Recommended execution order:
1. Agent 1 builds shared connector and display helpers.
2. Agents 2, 3, and 4 can work after Agent 1 lands.
3. Agent 5 can run after Agents 1 and 2 land.
4. Final integration agent runs validation, resolves conflicts, and updates README if needed.

### Agent 1 — Connector Domain Helpers and Labels

Goal:
- Create a single source of truth for user-facing connector labels, AC/DC badges, descriptions, and typical power ranges.

Owns:
- `src/features/charging/connectors.ts`
- `src/features/charging/connectors.test.ts`

Requirements:
- Support `CCS2`, `Type2`, `CHAdeMO`, and `Unknown`.
- Normalize common raw values into known connector keys.
- Provide functions for:
  - `getConnectorKnowledge(type)`
  - `formatConnectorLabel(type)`
  - `getConnectorCurrentType(type)` returning `AC`, `DC`, or `Unknown`
  - `formatPowerKw(value)`
- Do not depend on Prisma or React.

Tests:
- Unknown/null/empty connector values return the Unknown knowledge entry.
- `ccs2`, `CCS2`, `CCS`, and similar values render as `CCS2`.
- `type2`, `Type 2`, and similar values render as `Type 2`.
- `chademo` and `CHAdeMO` render as `CHAdeMO`.
- Power values render with `kW` and preserve decimals only when needed.

Commit:
- `feat: add connector knowledge helpers`

### Agent 2 — Station Details Page

Goal:
- Add `/stations/[id]` with complete station detail data from existing database records.

Owns:
- `src/app/stations/[id]/page.tsx`
- `src/app/stations/[id]/loading.tsx`
- `src/app/stations/[id]/error.tsx`
- Optional: focused query helper in `src/features/charging/station-details.ts`
- Tests for any helper created.

Requirements:
- Show Station Name, Operator, Address, City, Province, Coordinates, Source, Last Updated, Connector Type, Power, AC/DC, Connector Count, Import Date, and Source Updated Date.
- Use safe source links only for `http` and `https`.
- Use Agent 1 connector helpers for labels and AC/DC.
- Return `notFound()` when station id does not exist.
- Link from `/stations` cards to the details page.

Tests:
- Helper test covers connector aggregation and fallback labels.
- Existing station search tests remain green.

Commit:
- `feat: add station details page`

### Agent 3 — Connector Knowledge Base Routes

Goal:
- Add public connector education pages using existing/static knowledge only.

Owns:
- `src/app/connectors/page.tsx`
- `src/app/connectors/[type]/page.tsx`
- `src/app/connectors/[type]/loading.tsx`
- `src/app/connectors/[type]/error.tsx`
- Optional route helpers in `src/features/charging/connector-pages.ts`
- Tests for route helpers if created.

Requirements:
- `/connectors` lists CCS2, Type2, CHAdeMO, and Unknown.
- `/connectors/[type]` displays Name, Description, AC/DC, Typical power range, Supported regions, Supported vehicle brands, and Image.
- Images can be simple local/static visual treatments if no real image asset is available, but the page must not claim live compatibility or availability.
- Unknown connector page should explain incomplete source data, not an error.
- Add navigation links from homepage and relevant station UI.

Tests:
- Slug parsing returns the expected connector knowledge entry.
- Invalid slugs return Unknown or 404 consistently, whichever is chosen in implementation.

Commit:
- `feat: add connector knowledge pages`

### Agent 4 — Insights Dashboard

Goal:
- Add `/insights` with useful aggregate metrics from existing charging data.

Owns:
- `src/app/insights/page.tsx`
- `src/app/insights/loading.tsx`
- `src/app/insights/error.tsx`
- `src/features/charging/insights.ts`
- `src/features/charging/insights.test.ts`

Requirements:
- Metrics:
  - Top operators
  - Connector distribution
  - Highest power stations
  - Coverage by province
- Use Prisma aggregates where possible.
- Keep dashboard read-only and server-rendered.
- Handle empty database state gracefully.
- Do not add charts that require a new charting dependency unless the final reviewer approves it.

Tests:
- Pure formatter/aggregation helper tests for empty data, sorted operator totals, connector distribution, highest power ordering, and province coverage ordering.

Commit:
- `feat: add charging insights dashboard`

### Agent 5 — Operator Cleanup and Station UX Polish

Goal:
- Hide technical EIPA operator identifiers and improve station-facing labels.

Owns:
- `src/features/charging/station-search.ts`
- `src/features/charging/station-search.test.ts`
- `src/app/stations/page.tsx`

Requirements:
- Hide `eipa-operator-*` values from user-facing operator filters.
- Do not hide stations just because operator data is technical.
- Render CCS2 / Type 2 / CHAdeMO labels using Agent 1 helpers.
- Add AC/DC badges for station cards where connector data is known.
- Add lightweight connector tooltips or accessible title text.
- Preserve existing search behavior.

Tests:
- Operator option helper excludes technical `eipa-operator-*` values.
- Connector summary renders normalized labels.
- Existing station search filter tests remain green.

Commit:
- `fix: clean station operator and connector labels`

### Final Integration Agent — Coverage, Docs, and PR Readiness

Goal:
- Ensure Milestone 3 is coherent, tested, and ready for review.

Owns:
- `README.md`
- Cross-file integration fixes only where necessary.

Requirements:
- Run `npm run validate`.
- Confirm all Milestone 3 P0 items are implemented:
  - Station details page
  - Connector knowledge base
  - Operator cleanup
- Confirm P1 items are implemented or explicitly listed as deferred:
  - Insights dashboard
  - UX improvements
- Update README public routes and feature list if routes were added.
- Check no `/docs` files are staged.
- Check no assistant/tool names appear in branch, commits, or README.
- Ask before pushing final changes to remote.

Commit:
- `docs: document milestone 3 data usability`

Final validation:
- `npm run validate` must pass before PR.

---

## Implementation Coverage

Status:
- P0 Station Details Page: implemented at `/stations/[id]`
- P0 Connector Knowledge Base: implemented at `/connectors` and `/connectors/[type]`
- P0 Operator Cleanup: implemented for user-facing operator suggestions
- P1 Insights Dashboard: implemented at `/insights`
- P1 UX Improvements: implemented with normalized connector labels, AC/DC badges, tooltips and connector images
- EV Vehicle Intelligence: charging cost calculator and winter range estimates implemented on `/vehicles/[id]` detail pages

Assets:
- Connector images are stored in `public/connectors`
- `unknown.webp` is the fallback image for unknown or unsupported connector values

## Vehicle Intelligence — Charging Cost & Winter Range (Milestone 5)

**Feature**: Automated charging cost estimates and winter range derating for EV models.

**Location**: `/vehicles/[id]` detail pages, charging performance section.

**Implementation**:
- `src/features/ev/charging-cost.ts`: Core calculators for cost and winter range
  - `buildChargingCostEstimate(batteryCapacityKwhNet)` → AC/DC tariff ranges in PLN
  - `buildWinterRangeNote(rangeWltpKm)` → low/high km estimates (15–30% derating)
  - `formatPlnRange(range)` → human-readable "X–Y zł" output
- `src/features/charging/station-summary.ts`: Station summary helpers
- Translation keys in `messages/{en,pl}.json`:
  - `vehicleDetail.winterRangeLabel`
  - `vehicleDetail.chargingCostAcLabel`
  - `vehicleDetail.chargingCostDcLabel`
  - `vehicleDetail.chargingCostDisclaimer`

**Tariff Bands** (as of 2026-06-24):
- AC charging: 0.8–1.9 zł/kWh
- DC fast/rapid: 2.0–3.5 zł/kWh

**Winter Range Derating**:
- Low estimate: 30% loss (70% of WLTP)
- High estimate: 15% loss (85% of WLTP)

**Edge Cases Handled**:
- Null or missing battery capacity → no cost estimate displayed
- Null or missing WLTP range → no winter range estimate displayed
- Non-positive or non-finite values → safe null returns
- Zero battery capacity → no estimate (invalid input)

**Tests** (9 tests in `src/features/ev/charging-cost.test.ts`):
- null/missing inputs return null
- non-positive and non-finite values return null
- realistic battery capacity (58 kWh) → AC [46–110 zł], DC [116–203 zł]
- proportional scaling verified (40 vs 80 kWh)
- winter range calculation for 400 km WLTP → [280–340 km]
- PLN range formatting with en dash and currency suffix

**Wiring** in `src/app/vehicles/[id]/page.tsx`:
- Calls `buildChargingCostEstimate()` and `buildWinterRangeNote()` for vehicle specs
- Renders cost ranges in two detail rows (AC/DC) when estimate available
- Renders winter range estimate when WLTP range available
- Shows disclaimer text when cost data is present
- Includes in SEO metadata (meta title/description highlights charging cost when available)

Validation requirement:
- `npm run validate` must pass before push or PR creation
