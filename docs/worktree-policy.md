# Worktree Lifecycle Policy

## Purpose

This policy establishes a framework for managing git worktrees in this repository, ensuring consistent hygiene, reducing namespace clutter, and enabling efficient parallel development without stale/abandoned branches consuming disk space and creating cognitive overhead.

**Scope:** All worktrees created by the `.claude/worktrees/` convention and external worktrees linked to this repository.

---

## Lifecycle Stages

### Stage 1: Active (0–7 days)

**Definition:** Worktree is actively under development or under active review.

**Characteristics:**
- Branch was created or last modified within the last 7 calendar days.
- Work is in progress (code changes, active commits).
- PR is open (if applicable) and in review cycle.
- Clear owner and next action documented.

**Rules:**
- ✅ **Keep:** no action required.
- ✅ **Develop freely:** no restrictions on commits/rebases.
- ✅ **Track progress:** log next action in the branch/PR description or memory.
- ⚠️ **Communicate:** if work is blocked or paused, update the PR/branch description to reflect status.

**Action on stale transition:**
- Transition to Idle stage when no commits occur for 7+ days.

---

### Stage 2: Idle (7–30 days)

**Definition:** Worktree has not been modified for 7–30 days, but may still be valuable.

**Characteristics:**
- Last commit/modification is 7–30 days ago.
- PR may be merged, closed, or still open but not actively reviewed.
- Work is not blocked; it's simply paused or awaiting external decision.
- Branch is not currently on `main` (not yet merged).

**Rules:**
- ⚠️ **Review:** assess whether the work is still needed or has been superseded.
- ⚠️ **Plan rebase:** if keeping, rebase onto current `main` to reduce future merge-conflict risk.
- ⚠️ **Communicate:** if owner is not present, leave a note in the branch description (e.g., "Paused pending X decision" or "Awaiting approval for Y feature").
- ⚠️ **Conflict watch:** older Idle worktrees are at higher risk of conflicts when eventually rebased.

**Owners:** Session owners should document any Idle worktrees they create or inherit.

**Action on stale transition:**
- If 30+ days old with no recent commits: move to Stale stage.
- If PR is merged: archive or delete worktree (no longer needed).
- If clear decision is made (e.g., "approved for merge" or "abandon"), move to appropriate action.

---

### Stage 3: Stale (30+ days)

**Definition:** Worktree has not been modified for 30+ days; presumed abandoned or superseded.

**Characteristics:**
- Last commit/modification is 30+ days ago.
- No active PR in review.
- No clear current owner or next action.
- Likely conflict with `main` (30+ days of drift).

**Rules:**
- 🛑 **Action required:** do not leave worktrees in this stage indefinitely.
- ❓ **Investigate:** determine if the work is still needed:
  - Has the feature been implemented on `main` by another branch/session?
  - Has the feature been explicitly abandoned or deprioritized?
  - Is the work still planned but just not started?
- ✅ **If needed:** rebase onto `main`, assess conflicts, plan next action.
- 🗑️ **If not needed:** delete the worktree and branch (use `git worktree remove <path> && git branch -D <branch>`).
- 📝 **Log decision:** document in this policy or a session memory note which stale branches were kept vs. removed and why.

**Owners:** Project owner or coordinating session should periodically audit stale worktrees.

**SLA:** Stale worktrees should not exceed 60 days without a decision. At 60+ days, default action is removal (unless explicitly exempted in a session note).

---

## Lifecycle Diagram

```
┌─────────────┐         (no commits          ┌──────────┐
│   ACTIVE    │──────────for 7 days)─────────→│  IDLE   │
│  (0–7 days) │                               │(7–30d)  │
└─────────────┘                               └──────────┘
                                                    ↓
                                              (no commits
                                              for 30 days)
                                                    ↓
                                             ┌──────────┐
                                        ┌────→│  STALE   │
                                        │     │(30+ days)│
                                        │     └──────────┘
                                        │
                                   [Decision Point]
                                        │
          ┌─────────────┬───────────────┼───────────────┐
          ↓             ↓               ↓               ↓
      [MERGE]      [REBASE]       [DELETE]          [KEEP*]
   (to main &)   (onto main &)  (remove branch)   (explicitly
   [DELETE]       [move to       [& worktree]     exempted)
                  ACTIVE or                        [→ACTIVE]
                  IDLE]
```

---

## Current Status (2026-07-08)

### Active Worktrees (0–7 days)

| Worktree | Branch | Last Modified | Status |
|----------|--------|---------------|--------|
| `standardize-kpi-cards` | `main` | 2026-07-07 (1d) | Development/testing; no PR |
| `fix-brand-filter-bug` | (feature) | 2026-07-06 (2d) | Development |
| `fix-vehicles-grid-layout` | (feature) | 2026-07-05 (3d) | Development |

**Count:** 3 Active worktrees

**Action:** No immediate action. Monitor for progress; if paused past 7 days, move to Idle.

---

### Idle Worktrees (7–30 days)

| Worktree | Branch | Last Modified | Age | Status |
|----------|--------|---------------|-----|--------|
| `fix-kpi-bg-class` | (feature) | 2026-07-05 (3d ago, but marked as idle due to earlier creation) | ~7d | Completed feature |
| `update-kpi-subtitle-color` | (feature) | 2026-07-05 | ~7d | Completed feature |
| `refine-kpi-styling` | (feature) | 2026-07-05 | ~7d | Completed feature |
| `fix-kpi-two-columns` | (feature) | 2026-07-05 | ~7d | Completed feature |
| `restore-kpi-original` | (feature) | 2026-07-05 | ~7d | Completed feature |
| `fix-kpi-layout` | (feature) | 2026-07-05 | ~7d | Completed feature |
| `kpi-countdown-animation` | (feature) | 2026-07-05 | ~7d | Completed feature |
| `vehicles-filter-layout` | (feature) | 2026-07-05 | ~7d | Completed feature |
| `agent-adb819be66615d685` | (locked) | 2026-07-01 (7d) | ~7d | ⚠️ **LOCKED** — orphaned agent worktree? |
| `m1-approach-b-fallback` | `feat/m1-approach-b-fallback` | 2026-06-30 (8d) | ~8d | Exploration branch |
| `m1-approach-a-postgis` | `feat/m1-approach-a-postgis` | 2026-06-30 (8d) | ~8d | Exploration branch |
| `n1-payment-auth-metadata` | `feat/n1-payment-auth-metadata` | 2026-06-30 (8d) | ~8d | Merged to `main` (PR #65) |
| `m3-daily-snapshot-archive` | `feat/m3-daily-snapshot-archive` | 2026-06-29 (9d) | ~9d | Merged to `main` (PR #64) |

**Count:** 13 Idle worktrees

**Action Required:**
- 🗑️ **Remove completed KPI worktrees** (8 total: fix-kpi-*, restore-kpi-original, vehicles-filter-layout, kpi-countdown-animation) — PRs are merged, branches can be deleted.
- 🔓 **Investigate locked worktree** (agent-adb819be66615d685) — appears to be orphaned, likely safe to remove.
- 📋 **Review M1 exploration branches** — assess if still needed or superseded by later work.
- 🗑️ **Remove Idle worktrees for merged work** (n1-payment-auth-metadata, m3-daily-snapshot-archive) — PRs are merged to `main`, worktrees no longer needed.

---

### Stale Worktrees (30+ days)

| Worktree | Branch | Last Modified | Age | Status |
|----------|--------|---------------|-----|--------|
| `agent-af7993707b77dd8da` | `refactor/leaflet-tile-layer-extraction` | 2026-06-29 (9d ago, created) | ~9d | Merged to `main` (PR #33) — not actually 30+ but orphaned |
| `agent-a5857f193585b41ee` | (agent worktree) | 2026-06-24 (14d) | ~14d | Orphaned agent worktree |
| `agent-abffe81db6bdee062` | (agent worktree) | 2026-06-24 (14d) | ~14d | Orphaned agent worktree |
| `evsource-rebrand-logo` | `worktree-evsource-rebrand-logo` | (pre-July status unknown) | ~14d+ | Check current status |

**Count:** 4+ Stale/Orphaned worktrees (agent-* worktrees appear to be orphaned agent sessions)

**Action Required:**
- 🗑️ **Remove all orphaned agent worktrees** — these are stale agent sandbox worktrees, no longer needed.
- 🗑️ **Remove leaflet-tile-layer-extraction worktree** — work is merged, worktree is orphaned.
- ❓ **Check evsource-rebrand-logo status** — assess if still needed or can be removed.

---

## Weekly Cleanup Schedule

**Cadence:** Every Monday morning (or start of each development week).

**Responsibility:** Project owner or coordinating session.

**Checklist:**

1. **List current worktrees:** `git worktree list`
2. **Identify candidates:**
   - Idle worktrees (7–30 days old) — review for possible move to Active (if work resumes) or cleanup.
   - Stale worktrees (30+ days) — investigate and decide: keep (with rebase), or delete.
3. **Clean up:**
   - Delete merged work: `git worktree remove <path> && git branch -D <branch>`
   - Rebase Idle → Active: `cd <worktree> && git rebase main && git push -f`
   - Document decisions in this file or a session memory.
4. **Log results:** Update this policy with current status snapshot.

**Example cleanup script:**

```bash
#!/bin/bash
# List all stale worktrees (30+ days)
git worktree list | while read path branch; do
  if [ -d "$path" ]; then
    last_mod=$(stat -f%Sm "$path" 2>/dev/null || echo "unknown")
    # Manual inspection required for age calculation in bash
    echo "Inspect: $path ($branch) — last modified $last_mod"
  fi
done
```

---

## Guidelines for New Worktrees

When creating a new worktree (via `git worktree add`, Claude Code `.claude/worktrees/` hook, or `EnterWorktree` tool):

1. **Name clearly:** Use a semantic branch name (e.g., `feat/x`, `fix/y`, not `work1`).
2. **Document purpose:** Add a PR description or session memory note explaining the work.
3. **Set owner:** Note which session created it and expected completion time.
4. **Monitor age:** After 7 days of no commits, reassess if work is blocked or paused.
5. **Plan cleanup:** If merging to `main`, remove the worktree and branch immediately after.

---

## Exemptions and Special Cases

### Milestone/Research Branches

Branches created for long-term research or milestone exploration (e.g., `feat/m1-approach-a-postgis`, `feat/m1-approach-b-fallback`) may span multiple weeks. These should be:
- Marked as "milestone/exploration" in the PR description or branch name.
- Periodically rebased onto `main` to avoid excessive conflict risk.
- Re-prioritized by the project owner if status changes.

### Locked Worktrees

If a worktree is locked (e.g., `agent-adb819be66615d685 locked`), investigate the cause:
- Check if an agent session was interrupted.
- If orphaned, remove lock: `git worktree remove --force <path>`.
- Document the incident in memory for coordination.

---

## Approval & Coordination

**Policy Approval:** This policy was established 2026-07-08 as a working framework. Review and adjust based on team experience.

**Coordination:** In multi-session development:
- Check memory/docs before removing any stale worktree (another session may be using it).
- Use the status snapshot in this document as the source of truth for lifecycle stage.
- Update this document after major cleanup actions.
