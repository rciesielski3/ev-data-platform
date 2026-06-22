# EV Data Platform - Project Instructions

## Project Context
Public, open-source platform that imports, normalizes, and serves Polish EV charging infrastructure (EIPA / UDT Poland) and EV model/spec data (OpenEV Data) via a Next.js app backed by Postgres/PostGIS on Neon.

## Tech Stack
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Database / ORM:** Prisma 6, PostgreSQL (Neon) with PostGIS
- **Styling:** Tailwind CSS 3
- **Maps:** Leaflet + OpenStreetMap tiles (client-only)
- **Validation:** manual validator functions in `src/lib/validators/` (not Zod, despite it being a dependency — check before reaching for it)
- **Testing:** Vitest, colocated `*.test.ts` files next to the module they test
- **Hosting:** Vercel, with `vercel.json` cron jobs for scheduled imports

## Architecture & Boundaries
- **Import pipeline:** each source (`src/lib/sources/eipa/`, `src/lib/sources/openev/`) follows fetch -> normalize -> validate -> upsert, orchestrated from `src/server/jobs/run-*-import.ts` and triggered via `npm run import:*` or the `/api/cron/import-*` routes.
- **Idempotency is load-bearing:** stations/operators upsert on the `[sourceName, sourceRecordId]` unique constraint. Connectors are deleted and recreated per station on every import. Never change this keying without confirming re-imports stay non-duplicating.
- **Server/client boundary is simple here:** most pages are server components in `src/app/**/page.tsx` querying Prisma directly, often with `export const dynamic = "force-dynamic"`. The only `"use client"` boundary is the Leaflet map (`src/app/map/station-map-client.tsx`) — Prisma/secrets never need to cross into it.
- **Feature logic lives in `src/features/<domain>/`** (pure functions: formatting, filtering, query-shaping) and is imported by `src/app/**/page.tsx`, which stays focused on data fetching and JSX.

## High-Risk Domains
- **Live external fetches:** `src/lib/sources/eipa/fetch.ts` hits the real `eipa.udt.gov.pl` government API. There is no sandbox/mock for this — running an import job calls the live source and writes to the shared Neon dev database.
- **Shared dev database:** `DATABASE_URL` points at a real, shared Neon instance. Treat schema changes (`prisma/schema.prisma`, `npm run db:push`) and any ad hoc data-mutating script as production-adjacent. Don't run destructive queries or large re-imports without confirming with the user first.
- **`migrate dev`/`migrate resolve` need the direct (non-pooled) connection.** `DATABASE_URL` is Neon's pooled connection string (hostname contains `-pooler`). Prisma's migration commands take a session-level Postgres advisory lock, which pooled/transaction-mode connections don't reliably support — expect `P1002` advisory-lock timeouts, or a stuck lock left behind by an interrupted command. Fix: strip `-pooler` from the hostname for migration commands only (keep the pooled URL for the app itself), e.g. `DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/-pooler//') npx prisma migrate ...` (strips `-pooler` regardless of region, rather than hardcoding `.c-4`). If a lock is already stuck, find the holder via `SELECT l.pid FROM pg_locks l WHERE l.locktype = 'advisory'` and clear it with `SELECT pg_terminate_backend(<pid>)` (safe only if that backend is `idle` in `pg_stat_activity`, not mid-transaction).
- **The dev DB was originally provisioned via `db push`, not `migrate`** — there was no `_prisma_migrations` tracking table until 2026-06-22, when it was baselined (`prisma migrate resolve --applied` for each existing migration, after verifying each migration's SQL was actually already reflected in the live schema — one wasn't: PostGIS was enabled for real at that point, not just assumed). `migrate dev` should now work normally for new schema changes, but if it ever reports unexpected drift again, verify before resolving — don't blindly mark a migration "applied" without confirming the DB actually matches it.
- **Cron-triggered imports:** `/api/cron/import-eipa` and `/api/cron/import-openev` skip auth entirely outside `NODE_ENV=production` — fine locally, but don't assume that pattern is safe to copy elsewhere.

## Development & Conventions
- **No public API/auth/billing yet.** Routes are `/api/status` and the two cron import endpoints only — no user accounts, sessions, or payments exist in this codebase.
- **Named exports only** for everything in `src/lib/` and `src/features/`; arrow-function consts, not `function` declarations. Default exports appear only where Next.js requires them (page/layout/loading/error components in `src/app/`).
- **No comments unless absolutely necessary:** default to zero. Only add one when omitting it would genuinely confuse a future reader (a hidden constraint, a subtle invariant, a workaround for a specific external-API quirk) — never to restate what the code already says through naming.
- **No premature abstraction:** small, single-purpose modules (e.g. `src/features/charging/insights.ts`, `station-search.ts`) rather than shared generic layers. Follow this; don't introduce new abstractions speculatively.
- **Styling:** Tailwind utility classes plus three shared primitives defined in `globals.css` — `.card`, `.muted`, `.badge`. Reuse those instead of redefining similar styles inline.
- **Tests:** colocate `*.test.ts` with the module under test (see `src/features/charging/insights.test.ts`); test exported pure functions directly, not through pages.
- **Source attribution:** never drop `sourceName`, `sourceRecordId`, `sourceUrl`, or `rawPayload` when touching import/normalize code — they're how every record traces back to EIPA/OpenEV.

## Git & PR Workflow
- **Review and tests before PRs:** code review must be completed (findings addressed) and the full test suite must pass before opening a PR — never open one with known-unreviewed or known-failing code.
- **KISS and DRY:** ship the simplest implementation that solves the actual problem; no speculative abstraction, and no duplicated logic when a shared helper already exists or obviously should.
- **Smallest correct increment:** ship the smallest correct increment quickly rather than gold-plating or scope-creeping a task; avoid over-engineering.
- **Conventional Commits:** commit subjects use `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`-style prefixes; branch names use matching `feat/`, `fix/`, `chore/`-style prefixes.
- **No AI-tool names:** never include "claude", "codex", or any AI-tool name in a branch name or commit subject line.

## Scripts
- **Dev/build:** `npm run dev`, `npm run build`, `npm run start`
- **Quality gate:** `npm run validate` (lint + typecheck + test + build), or `npm run validate:quick` without the build
- **Lint/typecheck/test individually:** `npm run lint`, `npm run typecheck`, `npm run test` (`npm run test:watch` for watch mode)
- **Database:** `npm run db:generate`, `npm run db:push`, `npm run db:migrate`, `npm run db:studio`
- **Imports:** `npm run import:eipa`, `npm run import:eipa:test` (limited via `EIPA_IMPORT_LIMIT`), `npm run import:openev`, `npm run import:all`
