# Homepage Feature Branch Status Matrix — 2026-07-08

## Executive Summary

Three experimental homepage feature branches exist in the repository at various stages of completion. This matrix evaluates their current state, content, and recommends next actions for each.

**Current repository state (as of 2026-07-08):**
- Primary development branch: `main` (latest: f5b9e87, 2026-07-08)
- Active development branch: `pr-79-fix` (current session branch)
- Homepage implementations: 3 feature branches + 1 finalized branch in worktree

---

## Decision Matrix

### 1. feat/homepage-refinements

| Attribute | Value |
|-----------|-------|
| **Branch** | `feat/homepage-refinements` |
| **Commits Beyond Main** | 17 |
| **Last Activity** | 2026-07-04 (4 days ago) |
| **Latest Commit** | `a154c16` — "fix: address code review findings - translation, media queries, transitions, and layout consistency" |
| **Diff Scope** | 13 files changed, 50 insertions(+), 98 deletions(-) |
| **Files Changed** | `messages/{en,pl}.json`, `package-lock.json`, `src/app/` (corridors, operators, reports, state-of-charging, vehicles), `src/components/ui/` (DetailsSkeleton, TrendsHero), `src/features/charging/metric-card.tsx` |

**Content Overview:**
- Focused refinements to existing homepage and subpage components
- i18n improvements (Polish translation fixes)
- CSS cleanup (removed overengineered media queries from globals.css)
- Component styling refinements (DetailsSkeleton, TrendsHero, MetricCard)
- Layout/padding alignment fixes across pages
- Recent code review addressing translation and media query issues
- Small, manageable scope — code review ready

**State Assessment:**
- ✅ Recently reviewed (code review findings addressed)
- ✅ Relatively small scope (minimal risk)
- ✅ Focused on polish/refinement, not restructuring
- ⚠️ 17 commits — some complexity in iteration history
- ⚠️ 4 days stale — modest activity drift

**Decision Options:**

| Option | Rationale | Risk |
|--------|-----------|------|
| **MERGE** | Small, focused refinements that improve polish without architectural change. Recent review passes. Can be merged to `main` as-is or into the finalized polish branch first. | Low — isolated changes, code-reviewed. |
| **DEFER** | If waiting for final homepage redesign/polish to stabilize first, hold this branch and rebase onto the stable final version later to avoid merge-conflict busywork. | Low — content is stable, not losing freshness |
| **ABANDON** | Only if the refinements conflict with an approved final design; current content poses no architectural risk. | Very Low — isolated changes, easily re-created if needed |

**Recommendation:** **MERGE**
- These are tested, reviewed refinements that improve the current state.
- Scope is well-bounded: i18n consistency, layout polish, CSS cleanup.
- No blocking dependency on other branches.
- **Action:** Rebase onto `main`, run full validation, open PR for final review, merge.

---

### 2. feat/homepage-visual-polish

| Attribute | Value |
|-----------|-------|
| **Branch** | `feat/homepage-visual-polish` |
| **Commits Beyond Main** | 9 |
| **Last Activity** | 2026-06-24 (14 days ago) |
| **Latest Commit** | `9bfe4aa` — "fix: final visual polish on homepage" |
| **Diff Scope** | 139 files changed, 2090 insertions(+), 9653 deletions(-) |
| **Files Changed** | Massive: deletions of entire feature areas (corridors, trends, snapshots, monitoring, payment-auth), schema removals, workflow changes, component removals |

**Content Overview:**
- **Large-scale architectural simplification** — removes ~10K lines of code
- Deletions: entire `/corridors` page + routes, `/trends` page + routes, `/api/snapshots/*` routes, payment-auth validators, monitoring/regression-detection infrastructure, snapshot archive code
- Schema changes: removes `DailySnapshot` and other tables, migration deletions
- Workflow changes: removes `neon-backup.yml` workflow
- Documentation removals: `README_PROJECT_SOURCE_OF_TRUTH.md`, `MILESTONE_3_DATA_USABILITY.md`
- i18n cleanup (402 line changes in each locale file)
- UI component removals: several detail/hero components

**State Assessment:**
- ⚠️ **Stale:** 14 days old, likely conflict risk with recent work (especially M3 snapshot archive, N1 payment-auth metadata)
- ⚠️ **High-risk scope:** removes entire feature areas and schema components
- ⚠️ **Outdated relative to current state:** M3 (snapshot archive) and N1 (payment-auth) work have landed on `main` *after* this branch was created; this branch deletes them
- ❌ **Architectural conflict:** attempts to unwind features that were deliberately implemented and merged in the meantime
- ⚠️ **No clear use case:** if the intent was to ship a simpler homepage, that work has been superseded by `feat/homepage-redesign` and finalization work

**Decision Options:**

| Option | Rationale | Risk |
|--------|-----------|------|
| **MERGE** | Only if the intention is to remove these features entirely from the product. Conflicts with M3/N1 work that has already landed. Would require significant rebase/conflict resolution. | **High** — architectural regression, undoes intentional work. |
| **DEFER** | Not recommended — 14 days stale means conflict resolution would be substantial. Deferring compounds this problem. | High — staleness increases daily. |
| **ABANDON** | ✅ **Recommended.** This branch represents an older architectural direction that conflicts with the current product roadmap (M3 snapshots, N1 payment/auth metadata are now live on `main`). The homepage redesign goals have been met by `feat/homepage-redesign` + finalization. | Low — content is superseded; no loss. |

**Recommendation:** **ABANDON**
- This branch deletes features (`DailySnapshot`, payment-auth validators, monitoring infrastructure) that have already been merged to `main`.
- The 14-day staleness means rebasing would require significant conflict resolution.
- The design intent (simplified homepage) has been achieved via `feat/homepage-redesign` instead.
- **Action:** Document as abandoned; remove worktree to clear workspace clutter.

---

### 3. feat/homepage-redesign

| Attribute | Value |
|-----------|-------|
| **Branch** | `feat/homepage-redesign` |
| **Commits Beyond Main** | 1 (actually: complex merge history with 1 new commit on top) |
| **Last Activity** | 2026-06-30 (8 days ago) |
| **Latest Commit** | `fd97773` — "refactor: restructure homepage to surface analysis features, fix mobile StatStrip" |
| **Diff Scope** | 44 files changed, 973 insertions(+), 2537 deletions(-) |
| **Files Changed** | `src/app/{page.tsx, coverage, insights, layout, provinces, trends, ...}`, `messages/{en,pl}.json`, component removals (CoverageHero, InsightsHero, ProvincesHero, NavDropdown, TrendsHero, CoverageDetails, InsightsDetails, ProvincesDetails), `src/features/charging/` (coverage-analysis, station-details, station-seo), `src/features/{corridors/,exports/,trends/}` |

**Content Overview:**
- **Single comprehensive refactor commit** restructuring the homepage
- Removes: `/state-of-charging` page stub, several UI detail/hero components, NavDropdown navigation component
- Simplifies: StatStrip component (mobile fix), MetricCard, CoverageDetails/ProvincesDetails/InsightsDetails removed in favor of inline patterns
- Adds: enhanced `/coverage`, `/insights`, `/provinces` pages with expanded content
- Removes/simplifies: `src/features/{corridors,trends,exports}` directories (gap detection, corridor definitions, corridor export)
- i18n changes (88 line changes in each locale file)
- Removes: payment-auth validation module (contradicts N1 payment-auth-metadata work)

**State Assessment:**
- ⚠️ **Moderate staleness:** 8 days old, some conflict risk with recent work
- ⚠️ **Architectural conflict:** removes payment-auth validators that N1 work added (N1 was merged after this branch was created)
- ✅ **Clear intent:** single comprehensive restructure, easier to reason about than broad deletions
- ✅ **Workable scope:** 44 files, majority are deletions, which generally merge cleanly
- ⚠️ **Uncertain status:** unclear if this was approved or if finalization work supersedes it

**State Assessment (continued):**
- 1 explicit new commit on top of a complex merge history
- Mobile StatStrip fix is useful
- Removal of NavDropdown and several detail components suggests a deliberate simplification strategy

**Decision Options:**

| Option | Rationale | Risk |
|--------|-----------|------|
| **MERGE** | If this represents the approved final homepage architecture, merge it (after resolving N1 payment-auth conflicts). The single-commit design is clean and reviewable. | Medium — staleness and payment-auth conflict require careful rebase. |
| **DEFER** | If waiting for additional polish or finalization, hold and rebase onto `main` once final direction is confirmed. | Medium — 8 days stale, staleness increases daily. |
| **ABANDON** | If this work has been superseded by finalization/polish work already on `main` or in other branches, abandon to reduce namespace clutter. | Low-Medium — depends on whether finalization is already complete. |

**Recommendation:** **DEFER (with planned reconciliation)**
- This branch contains valuable restructuring work, but conflicts with N1 payment-auth work merged after it was created.
- **Immediate action:** Rebase onto current `main` and resolve conflicts (mainly payment-auth module deletion vs. N1 additions).
- **Assessment after rebase:** Run `npm run validate` and review diff again to decide MERGE vs. ABANDON based on conflict complexity.
- **Note:** Check if `feat/homepage-final-polish` in the worktree (commit 32bd0dc) has already superseded this work. If so, favor that finalized version.

---

### 4. feat/homepage-final-polish (Reference)

| Attribute | Value |
|-----------|-------|
| **Branch** | `feat/homepage-final-polish` |
| **Status** | In worktree, 1 commit beyond main (32bd0dc) |
| **Latest Commit** | "feat: add per-capita coverage ranking to coverage analysis" |
| **Note** | This branch appears to be a finalized version incorporating approved polish. Consider this the reference point for homepage completion. |

---

## Summary Table

| Branch | Commits | Age | Status | Decision | Priority |
|--------|---------|-----|--------|----------|----------|
| `feat/homepage-refinements` | 17 | 4d | Reviewed, small scope | **MERGE** | High |
| `feat/homepage-visual-polish` | 9 | 14d | Stale, architectural conflict | **ABANDON** | Remove |
| `feat/homepage-redesign` | 1 | 8d | Architectural conflict, valuable work | **DEFER (rebase)** | Medium |
| `feat/homepage-final-polish` | 1 | Ref | Finalized version | Awaiting approval | High |

---

## Recommended Next Steps

1. **Immediate (high-priority):**
   - **feat/homepage-refinements:** Rebase onto `main`, validate, open PR for merge.
   - **feat/homepage-visual-polish:** Remove worktree and mark as abandoned. Document the reason (architectural conflict with M3/N1 work).

2. **Medium-term (medium-priority):**
   - **feat/homepage-redesign:** Rebase onto current `main`, run `npm run validate`, reconcile payment-auth conflicts.
   - Evaluate against `feat/homepage-final-polish` to determine if redesign is superseded.
   - If conflicts are resolvable and validation passes, open PR. Otherwise, abandon.

3. **Follow-up decision:**
   - Confirm which of `feat/homepage-redesign` or `feat/homepage-final-polish` represents the approved final state.
   - Merge the approved version to `main`.
   - Archive/remove obsolete branches and worktrees to reduce namespace clutter.
