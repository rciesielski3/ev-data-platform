# Content Gaps Analysis: GSC Queries & Recommendations

**Date:** 2026-07-17  
**Branch:** feature/seo-strategy-2026-07-17  
**Task:** Phase 1, Task 9 — Quick Content Additions

---

## Executive Summary

Analysis of Google Search Console queries reveals intent mismatches on high-impression, zero-click queries. These gaps fall into three categories:

1. **Informational queries** with no dedicated guide (e.g., "how to charge an EV")
2. **Comparative queries** lacking content on specific topics (e.g., "charging speeds", "fastest charging")
3. **Transactional/locational queries** without filter support (e.g., "free charging stations")

This document outlines quick wins (Phase 1) and medium-effort additions (Phase 3) to close these gaps.

---

## GSC Queries: Intent Mismatch & Gaps

### Zero-Click Analysis Table

| Query | Impressions | Clicks | CTR | Avg Position | Intent | Current Gap | Recommendation |
|-------|-------------|--------|-----|--------------|--------|-------------|-----------------|
| how to charge an EV | 5 | 0 | 0% | 45 | Informational | No dedicated guide on /insights | Medium: Blog post "Complete Guide to EV Charging in Poland" |
| fastest charging | 2 | 0 | 0% | 87 | Comparative | No charging speeds comparison | **Quick: Charging Speeds section on /insights** |
| free charging stations | 1 | 0 | 0% | 42 | Transactional | No free-only filter | Medium: Filtering UI on /stations or /map |
| charging speed comparison | 1 | 0 | 0% | 67 | Comparative | No side-by-side comparison | **Quick: Charging Speeds section on /insights** |
| how much does it cost to charge EV | 3 | 0 | 0% | 52 | Informational | Limited cost info on /insights | **Quick: FAQ section on /insights** |
| electric car charging time | 2 | 0 | 0% | 71 | Informational | Partial coverage in connector data | **Quick: FAQ + Charging Speeds section** |
| where to charge electric car Poland | 1 | 0 | 0% | 55 | Transactional | Requires /map or /stations discovery | Medium: Regional content guides |
| EV charging networks Poland | 1 | 0 | 0% | 64 | Informational/Comparative | Limited network comparison | Medium: Blog post "Charging Networks Comparison" |

### Low CTR Queries (1-2 clicks, <10% CTR)

| Query | Impressions | Clicks | CTR | Position | Intent | Gap | Recommendation |
|-------|-------------|--------|-----|----------|--------|-----|-----------------|
| stations near me | 8 | 1 | 12.5% | 18 | Transactional | /map provides geolocation; needs discoverability | Update homepage meta with "geolocation-enabled map" messaging |
| EV charging in Poland | 12 | 0 | 0% | 28 | Informational | /insights exists but lacks on-page optimization | Improve /insights meta description & H1 targeting "EV charging in Poland" |
| charging operator Poland | 4 | 0 | 0% | 51 | Informational/Comparative | Limited operator comparison | Medium: Blog post or expanded /insights operator section |

---

## Phase 1: Quick Additions (Implemented in Task 9)

### 1. Charging Speeds Section (on `/insights`)

**Target Keywords:** "fastest charging", "charging speed comparison", "electric car charging time"

**Expected Impact:** Address 3 zero-click queries with inline content. Position 45→35 estimated.

**Content:** 3-card grid showing AC, DC, Ultra-fast charging times and power levels.

**Code:** Added to `src/app/insights/page.tsx` after main InsightsDetails component.

**Estimated Traffic Impact:** +2–4 clicks/month on new queries.

---

### 2. FAQ Section (on `/insights`)

**Target Keywords:** "how much does it cost to charge EV", "electric car charging time", "how to charge an EV"

**Questions Answered:**
1. "Ile kosztuje ładowanie pojazdu elektrycznego?" (Cost)
2. "Czy są darmowe stacje ładowania?" (Free charging availability)
3. "Jak szybko ładuje się pojazd elektryczny?" (Charging time)

**Code:** Added to `src/app/insights/page.tsx` after Charging Speeds section.

**Expected Impact:** Address 2 zero-click queries + FAQ schema markup (future: structured data).

**Estimated Traffic Impact:** +1–3 clicks/month on new queries.

---

## Phase 3: Medium-Effort Content (Future, if scope permits)

### Blog Posts (1,500–2,000 words each)

#### 1. "Complete Guide to EV Charging in Poland"
- **Target Keyword:** "how to charge an EV Poland"
- **Intent:** Informational
- **Outline:**
  1. Introduction: Why charging matters
  2. Types of chargers (AC, DC, Ultra-fast)
  3. Finding charging stations (map, networks)
  4. Cost & pricing overview
  5. Connector types (Type 2, CCS, CHAdeMO)
  6. Time estimates (by vehicle & charger type)
  7. Tips for road trips
  8. Free vs. paid networks
  9. Call-to-action: Link to /map, /stations, /insights
- **Estimated Traffic:** +15–25 clicks/month (high-intent organic)
- **Effort:** 3–4 hours research + writing + SEO optimization

#### 2. "Charging Networks Comparison: Poland's Major Operators"
- **Target Keyword:** "charging networks Poland comparison", "EV charging operator Poland"
- **Intent:** Comparative
- **Outline:**
  1. Top 5 operators (coverage, price, networks)
  2. Feature comparison table (availability, app, membership)
  3. Regional coverage heatmap reference
  4. Cost per kWh analysis
  5. Fast-charging availability
  6. Links to operator websites & /insights operator breakdown
- **Estimated Traffic:** +10–15 clicks/month
- **Effort:** 2–3 hours research + writing

#### 3. Regional Guides (500–800 words each, start with 3–5 regions)

**Templates (repeat for Warsaw, Krakow, Wroclaw, Gdansk, Poznan):**
- "EV Charging in [City]: Complete Guide"
- Target Keywords: "charging in [City]", "EV stations [City]"
- Sections: City statistics, top operators, cost/coverage, /map link with city preset
- Estimated Traffic: +5–8 clicks/month per guide
- Effort: 1.5–2 hours per guide

---

## Opportunity Assessment

### Quick Wins (Phase 1, Task 9)
- **Charging Speeds:** Low-hanging fruit, immediate clarity on position & speed comparison
- **FAQ:** Addresses 3 common intent gaps with minimal content
- **Implementation Time:** 1–2 hours
- **Expected ROI:** +3–7 new clicks/month

### Medium Effort (Phase 3)
- **Blog Posts:** Higher effort (3–4 hours each), but address root-cause informational gaps
- **Regional Guides:** Scalable, repetitive templates reduce per-unit effort
- **Expected ROI:** +30–50 new clicks/month (combined)
- **Recommendation:** Prioritize blog posts over regional guides if time-boxed

### Not Recommended (Phase 3)
- **Free-only filter UI:** Requires backend filtering & UI redesign; lower demand (1 query)
- **Charging cost calculator:** Out of scope for current phase; limited demand
- **Network operator profiles:** Medium effort, low demand; blog post comparison is sufficient

---

## Measurement Plan

### Track in GSC/Analytics (Next 4 weeks)
1. **Charging Speeds section:** Monitor clicks on queries "fastest charging", "charging speed comparison"
2. **FAQ section:** Monitor clicks on "how much does it cost", "charging time", "free charging"
3. **Target:** 50% improvement in CTR on named queries by week 4

### Next Review Date
**2026-08-17** — Reassess performance, prioritize Phase 3 based on query volume trends

---

## Summary

| Category | Status | Items | Effort | Expected Impact |
|----------|--------|-------|--------|-----------------|
| Phase 1: Quick Additions | ✓ DONE | Charging Speeds + FAQ | 1–2h | +3–7 clicks/month |
| Phase 3: Blog Posts | PENDING | 2 blog posts + 3–5 regional guides | 12–15h | +30–50 clicks/month |
| Phase 3: Filtering | NOT RECOMMENDED | Free-only filter | HIGH | Low demand (1 query) |

**Next Steps:**
1. Implement Phase 1 (Task 9, this document)
2. Monitor Phase 1 impact for 2–3 weeks
3. If positive ROI, prioritize blog posts for Phase 3
4. Review again 2026-08-17
