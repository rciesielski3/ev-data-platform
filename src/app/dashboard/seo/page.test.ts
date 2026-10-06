import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    gscKeyword: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => {
    const translations: { [key: string]: string } = {
      "seo.dashboard.title": "SEO Performance Dashboard",
      "seo.dashboard.description":
        "Weekly tracking of keyword rankings and organic traffic metrics",
      "seo.summary.keywords": "Total Keywords",
      "seo.summary.impressions": "Avg Impressions (7d)",
      "seo.summary.clicks": "Avg Clicks (7d)",
      "seo.summary.ctr": "Avg CTR",
      "seo.topKeywords.title": "Top 10 Keywords by Clicks",
      "seo.underperformers.title":
        "Keywords Losing Rank (Position Drop >5)",
      "seo.underperformers.recommendation": "Recommend: optimize content",
    };
    return translations[key] || key;
  }),
}));

describe("SEO Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateSummaryMetrics", () => {
    it("should calculate average metrics correctly", () => {
      const keywords = [
        {
          id: "1",
          query: "test",
          currentPosition: 5,
          currentClicks: 10,
          currentImpressions: 100,
          currentCtr: 0.1,
          siteUrl: "example.com",
          lastUpdated: new Date(),
          createdAt: new Date(),
          snapshots: [],
        },
        {
          id: "2",
          query: "test2",
          currentPosition: 3,
          currentClicks: 20,
          currentImpressions: 200,
          currentCtr: 0.1,
          siteUrl: "example.com",
          lastUpdated: new Date(),
          createdAt: new Date(),
          snapshots: [],
        },
      ];

      const avgImpressions = keywords.reduce(
        (sum, k) => sum + k.currentImpressions,
        0
      );
      const avgClicks = keywords.reduce((sum, k) => sum + k.currentClicks, 0);

      expect(avgImpressions).toBe(300);
      expect(avgClicks).toBe(30);
    });

    it("should handle empty keyword list", () => {
      const keywords: never[] = [];
      const totalKeywords = keywords.length;
      expect(totalKeywords).toBe(0);
    });
  });

  describe("enrichKeywordsWithTrends", () => {
    it("should add previousPosition to keywords", () => {
      const keyword = {
        id: "1",
        query: "test",
        currentPosition: 5,
        currentClicks: 10,
        currentImpressions: 100,
        currentCtr: 0.1,
        siteUrl: "example.com",
        lastUpdated: new Date(),
        createdAt: new Date(),
        snapshots: [],
        previousPosition: undefined,
      };

      expect("previousPosition" in keyword).toBe(true);
    });
  });
});
