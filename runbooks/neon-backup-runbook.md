# Neon Database Backup Runbook

**Last Updated:** 2026-07-16  
**Status:** Operational (Project ID updated in PR #110)  
**Workflow File:** `.github/workflows/neon-backup.yml`

## Overview

The EV Data Platform uses automated Neon database backups via GitHub Actions to ensure disaster recovery capability. Backups are created daily and monthly, with automated email notifications for monthly backups.

**Workflow Status:** ✅ LIVE (Fixed in PR #89, updated in PR #110)
- Project ID updated to current state: `sparkling-meadow-78717373`
- API key configured in GitHub Secrets
- All backup operations functional

## Backup Schedule

| Type | Frequency | Trigger | Retention |
|------|-----------|---------|-----------|
| **Daily** | Every day at 00:00 UTC | Cron: `0 0 * * *` | Keep 4 most recent |
| **Monthly** | 1st of each month at 00:00 UTC | Cron: `0 0 1 * *` | Keep 4 most recent |

Branch naming:
- Daily: `backup-daily-YYYY-MM-DD`
- Monthly: `backup-monthly-YYYY-MM`

## Configuration

### Environment Variables
```yaml
env:
  NEON_PROJECT_ID: sparkling-meadow-78717373  # Primary Neon project (updated 2026-07-16)
  NEON_API_KEY: ${{ secrets.NEON_API_KEY }}  # GitHub secret
```

### Required Secrets

| Secret | Purpose | Created |
|--------|---------|---------|
| `NEON_API_KEY` | API access to `sparkling-meadow-78717373` | 2026-07-15 (refreshed) |
| `RESEND_API_KEY` | Email service for notifications | Pre-existing |

**Setup:** Go to repository Settings → Secrets and variables → Actions → Verify both secrets are present

## Workflow Jobs

### Job 1: determine-type
- **Purpose:** Determine if backup is daily or monthly
- **Logic:** Check if today is 1st of month
- **Output:** `type`, `suffix`, `label`

### Job 2: create-backup
- **Purpose:** Create and manage backup branches
- **Steps:**
  1. Query Neon API for primary branch ID
  2. Create new branch: `backup-{type}-{suffix}`
  3. Cleanup: Delete oldest backup if ≥4 exist
  4. (Monthly only) Send email notification

## Manual Backup Trigger

### Option 1: GitHub Actions UI
1. Go to: https://github.com/rciesielski3/ev-data-platform/actions/workflows/neon-backup.yml
2. Click "Run workflow"
3. Branch: `main`
4. Click "Run workflow"
5. Monitor run (usually 1-2 minutes)

### Option 2: GitHub CLI
```bash
gh workflow run neon-backup.yml --ref main
gh run list --workflow=neon-backup.yml --limit=3
```

## Recent Status (2026-07-12)

**Last Issue:** Run #29178300440 (2026-07-12 03:29 UTC)
- **Problem:** Project ID `br-square-river-asmo25oj` returned "project not found"
- **Fix:** PR #89 reverted to original working ID `green-sky-067338`
- **Status:** RESOLVED — Workflow now operational

**Current:** Ready for next scheduled run (daily at 00:00 UTC)

## Troubleshooting

### Workflow Fails: "project not found"
**Symptoms:** Error in "Get primary branch ID" step
```
{"message":"project not found"}
```

**Cause:** Wrong project ID or invalid API key

**Resolution:**
1. Verify `.github/workflows/neon-backup.yml` line 10: `NEON_PROJECT_ID: sparkling-meadow-78717373`
2. Verify GitHub Secrets: `NEON_API_KEY` is set and valid
3. Test API key manually:
```bash
curl -X GET https://console.neon.tech/api/v2/projects/sparkling-meadow-78717373/branches?org_id=org-jolly-bird-48400667 \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" | jq '.branches[0:2]'
```

**Recent History:** This error occurred on 2026-07-10 when project ID was changed to `br-square-river-asmo25oj`. Fixed by PR #89 reverting to `green-sky-067338`. Project ID updated again on 2026-07-16 to `sparkling-meadow-78717373` due to Neon backend migration (PR #110).

### Workflow Fails: "Could not find primary branch"
**Symptoms:** jq parsing error after successful API response

**Cause:** API response format unexpected or null

**Resolution:**
1. Check GitHub Actions logs for "DEBUG: API Response"
2. Verify API endpoint returns valid branches array
3. Verify `jq` filter syntax is correct
4. Contact Neon support if API behavior changed

### Monthly Email Not Sent
**Symptoms:** No notification received on 1st of month

**Cause:** `RESEND_API_KEY` missing/invalid or email address misconfigured

**Resolution:**
1. Verify `RESEND_API_KEY` in GitHub Secrets
2. Check workflow line 129: recipient = `"to": "kontakt@evsource.pl"`
3. Verify sender domain (line 128): `"from": "neon@evsource.pl"` is authorized in Resend
4. Check Resend dashboard for failed deliveries

## Restoration Procedure

If backup branch needs to be restored to production:

1. **Log in to Neon Console:** https://console.neon.tech
2. **Select project:** `sparkling-meadow-78717373` (EV Data Platform)
3. **Find backup branch:** Listed as `backup-monthly-YYYY-MM` or `backup-daily-YYYY-MM-DD`
4. **Promote to primary:** Click branch → "Promote to Primary"
   - OR create new branch from backup (safer for testing)
5. **Update connection string:** If promoted, verify/update DATABASE_URL in:
   - Vercel environment variables
   - Local `.env.local` for testing
6. **Verify data integrity:** Query restored database, verify row counts and data freshness
7. **Revert if needed:** Restore original branch as primary

## Monitoring & Alerts

### Current Status Checks
- GitHub Actions workflow page shows latest 10 runs
- Check timestamp and success status regularly

### Recommended Monitoring
- [ ] Add Slack notifications for backup failures (GitHub Apps integration)
- [ ] Monitor Neon project size trends (backup growing unexpectedly?)
- [ ] Set up alert if backup age > 48 hours (indicates job failure)
- [ ] Track free tier usage (Neon free tier: 3 GB + 3 active branches)

**Current:** No active alerting system (manual checks via GitHub Actions UI)

## Future Enhancements

| Item | Effort | Priority | Note |
|------|--------|----------|------|
| Slack failure notifications | 2h | High | Better operational visibility |
| Cross-region replication | 4h | Medium | Disaster recovery redundancy |
| Incremental backups | 8h | Low | When DB > 10 GB |
| Automated retention policy | 3h | Medium | Enforce 30-day retention |
| Backup performance metrics | 2h | Low | Monitor backup creation time |

## Related Documentation

- Neon API: https://neon.tech/docs/reference/api-introduction
- Resend Email API: https://resend.com/docs/api-reference/emails/send
- GitHub Actions: https://docs.github.com/en/actions/using-workflows

## Contact & Support

**Neon Project:** sparkling-meadow-78717373 (EV Data Platform)  
**Responsible:** EV Data Platform Team  
**Last Updated:** 2026-07-16 (PR #110 merge, project ID updated due to Neon backend migration)
