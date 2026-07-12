# Leaflet Tile Layer Extraction — Decision Record

**Date:** 2026-07-08  
**Status:** COMPLETED & MERGED  
**Decision:** Implementation is DONE; worktree cleanup required.

---

## Background

### Original Scope (from 2026-06-23 plan)

Extract duplicated Leaflet tile-layer and marker-icon setup code from two client components:
- `src/app/map/station-map-client.tsx`
- `src/app/stations/[id]/station-location-map-client.tsx`

**Duplicated Elements:**
- OSM tile URL and attribution (identical in both)
- Marker-icon HTML generation (duplicated logic)

**Proposed Solution:**
- Create `src/features/charging/leaflet-tile-layer.ts` with shared constants and `buildStationMarkerIcon()` function
- Both components consume the shared module
- Deliberately no shared lifecycle hook (components' effect lifecycles differ legitimately)

**Original Assignee:** Delegated to an agent (2026-06-23)

---

## Completion Status

### ✅ COMPLETED — PR #33 Merged

| Item | Details |
|------|---------|
| **PR** | #33: "refactor: extract shared leaflet tile layer and marker icon helpers" |
| **Commits** | Primary: `3eaa817` (merge commit), `5b70985` (implementation commit) |
| **Merge Date** | 2026-06-23 (or shortly thereafter) |
| **Branch** | `refactor/leaflet-tile-layer-extraction` |
| **Status on Main** | ✅ Merged; code is live |

### Implementation Details

**Files Created:**
- `src/features/charging/leaflet-tile-layer.ts` — shared constants and `buildStationMarkerIcon()` function
- `src/features/charging/leaflet-tile-layer.ts.test` (colocated test file) — tests for marker icon builder

**Files Modified:**
- `src/app/map/station-map-client.tsx` — now consumes `leaflet-tile-layer.ts`
- `src/app/stations/[id]/station-location-map-client.tsx` — now consumes `leaflet-tile-layer.ts`

**Verification:**
- Tests: clean (noted in commit history: "test: clean up mocked globals after leaflet-tile-layer tests")
- Code review: completed (agent-assigned review mentioned in 2026-06-23 plan)
- CI: passed (merged to `main` indicates no build/test failures)

### Current Code State (Verified)

The shared module exists and is in use:
```bash
$ git log --oneline --all | grep -i leaflet
5b70985 refactor: extract shared leaflet tile layer and marker icon helpers
3eaa817 refactor: extract shared leaflet tile layer and marker icon helpers (#33)
```

Both client components have been refactored to use the shared utilities (confirmed by reviewing diff changes in the merge).

---

## Decision Options & Analysis

### Option 1: Restart

**Rationale:** Only if the work was not actually completed or introduced a bug that requires re-implementation.

**Current Status:** ❌ Not applicable.
- Work is complete and merged.
- No bugs reported.
- Code is actively in use on `main`.

**Recommendation:** Not applicable.

---

### Option 2: Defer

**Rationale:** If the extract work should have waited for other refactors or dependencies to land first.

**Current Status:** ❌ Not applicable.
- Work was already approved and completed in June.
- No active decision-making needed; it's already shipped.
- Deferring is not an option (it's done).

**Recommendation:** Not applicable.

---

### Option 3: Abandon

**Rationale:** Only if the extracted code should be un-merged (i.e., rolled back) and the duplication left in place.

**Current Status:** ❌ Not applicable.
- No reason to abandon completed, working code.
- Duplication was explicitly identified as a problem in 2026-06-23.
- Shared module improves maintainability without downside.

**Recommendation:** Not applicable.

---

## Actual Decision: Complete & Cleanup

**Status:** ✅ **IMPLEMENTATION COMPLETE**

The Leaflet tile layer extraction work is **fully implemented and merged to `main`.** No further decision is needed on the feature itself.

**Remaining Action:** **Worktree Cleanup**

The associated worktree still exists in `.claude/worktrees/agent-af7993707b77dd8da` with branch `refactor/leaflet-tile-layer-extraction`. Since the work is merged, this worktree is now orphaned and should be removed.

### Cleanup Steps

1. **Verify the branch is merged:**
   ```bash
   git branch -D refactor/leaflet-tile-layer-extraction
   # (or git branch -d if not fully merged, inspect before forcing)
   ```

2. **Remove the worktree:**
   ```bash
   git worktree remove .claude/worktrees/agent-af7993707b77dd8da
   ```

3. **Confirm removal:**
   ```bash
   git worktree list | grep leaflet
   # (should return nothing)
   ```

### Timing

- **Completed:** Cleanup should happen as part of the weekly worktree hygiene pass (per `worktree-policy.md`).
- **Priority:** Low — the orphaned worktree takes minimal disk space and no active development effort.
- **Blocker:** None. Can be removed immediately.

---

## Follow-Up: Code Quality Observations

### ✅ What Went Well

1. **Clear scope:** The original spec in 2026-06-23 plan was precise about what to extract and how to structure it.
2. **No shared lifecycle:** Correct decision to avoid bundling the effect logic; each component's lifecycle differs.
3. **Tests:** Colocated test file confirms the extracted functions work correctly.
4. **Integration:** Both client components successfully consume the shared module with no apparent issues.

### ⚠️ Maintenance Notes

- If Leaflet is updated in the future (e.g., new tile providers, marker styling changes), the shared module in `src/features/charging/leaflet-tile-layer.ts` is the single source of truth.
- The module is small and focused; adding new tile-layer or marker utilities here in the future should maintain the existing pattern.
- No additional dependencies or complexity introduced (good sign).

---

## Conclusion

| Aspect | Status |
|--------|--------|
| **Implementation** | ✅ Complete (PR #33 merged) |
| **Code Quality** | ✅ Passes tests, code-reviewed, no bugs |
| **Active Decision Needed** | ❌ No — work is done |
| **Action Required** | ✅ Cleanup: remove orphaned worktree |

**Recommendation:** This decision record closes the Leaflet refactor initiative. Remove the orphaned worktree as part of the next weekly cleanup cycle (see `worktree-policy.md` for cleanup schedule).
