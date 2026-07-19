# Google Search Console Keyword Tracking Setup

**Purpose:** Track Phase 2 target keywords in Google Search Console to measure on-page optimization impact.

**Target Keywords:** 15 keywords identified in Task 5 keyword research (7 Polish + 8 English)

**Baseline Date:** 2026-07-17

**Tracking Period:** Through end of Phase 2 (2026-08-31, ~44 days)

---

## Quick Setup (5 minutes)

This guide walks through setting up a custom GSC filter and optional report to track all 15 target keywords from Phase 2 SEO optimization.

### Step 1: Go to Google Search Console Performance Report

1. **URL:** https://search.google.com/search-console/
2. **Select property:** EV Data Platform (evdataplatform.com)
3. **Navigate to:** Performance → Queries

### Step 2: Add Filter for Target Keywords

1. Click the **"+ New"** button (top-left of the table, next to filters)
2. Choose filter type: **"Contains query"**
3. Paste or type the 15 target keywords (see list below)
4. Click **"Apply"**

**Note:** GSC allows filtering by multiple keywords. You can either:
- Create a single filter with all 15 keywords (see complete list below)
- Create separate filters for Polish vs. English keywords for analysis by language

### Step 3: Target Keywords for Copy/Paste

Copy these keywords into the GSC filter. Each keyword should be on its own line or separated by commas (depending on GSC UI):

#### Polish Keywords (7)
```
mapa ładowarek
ładowarka EV
jak ładować auto elektryczne
rodzaje ładowarek
stacje ładowania
ładowarki Warszawa
stacje ładowania Kraków
```

#### English Keywords (8)
```
EV charging guide
how to charge an EV
electric vehicle charging map
charging station finder
charging connectors
EV charging stations Poland
charging speeds EV
fastest EV charging
```

### Step 4: View Filtered Performance Data

Once the filter is applied, GSC will show:
- **Clicks:** Number of clicks from these keywords
- **Impressions:** Number of times site appeared for these keywords
- **CTR (Click-Through Rate):** Percentage of impressions that resulted in clicks
- **Position:** Average ranking position for these keywords

**Important:** It may take 24–48 hours for GSC to populate data if the site is new to tracking. Check back after filtering is applied.

---

## Create Custom Report (Optional but Recommended)

A custom report makes it easier to track progress over time without re-applying filters each visit.

### Report Setup Steps

1. **In GSC:** Performance → (top-right) **Create report** or **Schedule report**
2. **Report Name:** `Phase 2 Target Keywords`
3. **Dimensions to include:**
   - Date (to track over time)
   - Query (to see which keywords are performing)
4. **Filters:**
   - Add filter: Type = "Query"
   - Condition = "Contains"
   - Value = [paste all 15 keywords]
5. **Date range:** Last 90 days (or since optimization launch)
6. **Metrics to display:**
   - Clicks
   - Impressions
   - CTR (%)
   - Position (avg)
7. Click **"Save"** or **"Schedule"** (if sending weekly/monthly emails)

**Report URL:** Once created, GSC will generate a shareable report URL for easy weekly/monthly monitoring.

---

## Record Baseline Metrics (2026-07-17)

Before optimization work begins, document the current state. Fill in the values from GSC:

### Baseline (Pre-Optimization)

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Impressions** | — | All 15 keywords combined, last 28 days |
| **Total Clicks** | — | All 15 keywords combined, last 28 days |
| **Avg CTR** | —% | Clicks ÷ Impressions × 100 |
| **Avg Position** | — | Average ranking position (lower is better) |
| **Recording Date** | 2026-07-17 | Baseline snapshot before Task 7 optimization |

**How to find these in GSC:**
1. Apply the "Contains query" filter for all 15 keywords (see Step 2 above)
2. Set date range to **Last 28 days** (or **Last 90 days** for more data)
3. Read values from the summary cards at the top of the Performance table
4. Fill in the table above

**If no data is visible:** The site may have limited GSC history for these keywords. In that case, record "Not tracked" or "< 10 impressions" and set the baseline timestamp as the first day optimization work starts (Task 7).

---

## Target Metrics (End of Phase 2: 2026-08-31)

Success for Phase 2 SEO is measured by these targets across the 15 keywords:

| Metric | Baseline | Target (Aug 31) | Growth |
|--------|----------|-----------------|--------|
| **Total Impressions** | — | 400–600/mo | 4–6x |
| **Total Clicks** | — | 20–50/mo | 5–10x |
| **Avg CTR** | —% | 15%+ | 3–5x |
| **Avg Position** | — | 15–20 | Improvement by 5–10 positions |
| **# Keywords Ranking** | — | 10+ in top 30 | Expansion |

**What these targets mean:**
- **Impressions 4–6x:** On-page optimization driving more visibility for target keywords
- **CTR 15%+:** Better title/meta descriptions getting more clicks
- **Position 15–20:** Achieving mid-page presence (goal: top 20 by end of Phase 2)
- **10+ keywords top 30:** Broad coverage across primary target keywords

---

## Week-by-Week Monitoring Plan

### Week 1 (Today)
- [ ] Set up GSC filter and record baseline metrics
- [ ] Create optional custom report in GSC
- [ ] Pin report URL for weekly checks

### Weeks 2–3 (During Task 7–8: On-Page Optimization)
- [ ] Monitor weekly progress (Thu/Fri check-in)
- [ ] Note which keywords start getting impressions
- [ ] Identify quick-win pages with early ranking movement

### Weeks 4–8 (Monitoring & Refinement)
- [ ] Track cumulative progress toward end-of-phase targets
- [ ] Identify underperforming keywords for secondary optimization
- [ ] Document any significant ranking changes (positive or negative)

### End of Phase 2 (Aug 31)
- [ ] Export final GSC data
- [ ] Compare baseline vs. end-of-phase metrics
- [ ] Document findings in Task 11 completion report

---

## Troubleshooting

### No Data Showing in GSC Filter
- **Possible cause:** GSC has limited history for these keywords
- **Solution:** 
  1. Check that property is correctly verified in GSC
  2. Ensure "Last 28 days" or wider date range is selected
  3. Wait 24–48 hours for GSC to populate initial data
  4. Try broader keywords (e.g., "ładów" to catch variations)

### Filter Only Shows 1–2 Keywords
- **Possible cause:** GSC filter may be case-sensitive or require exact match
- **Solution:** 
  1. Try "Equals" instead of "Contains" if supported
  2. Check for accent marks or special characters
  3. Use "Starts with" for partial matches

### CTR Seems Wrong
- **Possible cause:** GSC counts all impressions, including when rankings improve mid-month
- **Solution:** Use "Last 90 days" for more stable averages; don't rely on daily CTR swings

### Missing a Keyword
- **Possible cause:** Keyword variant (e.g., plural vs. singular) showing separately
- **Solution:** In the custom report, check the "Query" dimension to see exact search terms; adjust filter if needed

---

## Key References

- **Keyword List:** docs/seo/keyword-research.md (15 keywords researched with volume & difficulty)
- **Page-by-Page Strategy:** docs/seo/keyword-targeting-map.md (which keywords target which pages)
- **SEO Strategy Plan:** docs/superpowers/plans/2026-07-17-seo-strategy-implementation.md (full Phase 2 timeline)
- **Next Step:** Task 7 (On-Page Optimization Implementation)

---

## Notes

1. **GSC Data Lag:** GSC updates metrics daily, but large position changes may take 3–5 days to fully stabilize.

2. **URL Parameter Tracking:** GSC automatically groups URL variations (with/without trailing slash, query parameters, etc.). No additional setup needed.

3. **Mobile vs. Desktop:** GSC shows combined data by default. To split mobile/desktop:
   - In Performance, click the "Device" filter (top menu)
   - Select "Mobile" or "Desktop" to see device-specific metrics

4. **Export for Analysis:** GSC allows exporting performance data as CSV for analysis in spreadsheets or tracking docs.

5. **Hreflang Considerations:** If Phase 2 includes hreflang tags (Polish/English variants), GSC will attribute impressions to the correct language version automatically.

---

**Last Updated:** 2026-07-17  
**Status:** Ready for manual setup  
**Next Review:** After Task 7 on-page optimization (Week 2)
