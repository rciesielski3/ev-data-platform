import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { getTranslations } from "next-intl/server";
import {
  formatMetric,
  calculateCtrPercentage,
  calculateKeywordPreviousPosition,
  findUnderperformers,
  KeywordWithPrevious,
} from "@/features/seo/metrics";
import { GscKeyword, GscSnapshot } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo.dashboard");

  return {
    title: t("title"),
    description: t("description"),
  };
}

type KeywordWithSnapshots = GscKeyword & { snapshots: GscSnapshot[] };

async function fetchKeywordsWithSnapshots(): Promise<KeywordWithSnapshots[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const keywords = await prisma.gscKeyword.findMany({
    include: {
      snapshots: {
        where: {
          date: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          date: "asc",
        },
      },
    },
    orderBy: {
      currentClicks: "desc",
    },
  });

  return keywords as KeywordWithSnapshots[];
}

async function enrichKeywordsWithTrends(
  keywords: KeywordWithSnapshots[]
): Promise<KeywordWithPrevious[]> {
  return Promise.all(
    keywords.map(async (keyword) => {
      const previousPosition = await calculateKeywordPreviousPosition(keyword.snapshots);
      return {
        ...keyword,
        previousPosition,
      } as KeywordWithPrevious;
    })
  );
}

function calculateSummaryMetrics(keywords: KeywordWithPrevious[]) {
  const totalKeywords = keywords.length;
  const totalImpressions = keywords.reduce(
    (sum, k) => sum + k.currentImpressions,
    0
  );
  const totalClicks = keywords.reduce((sum, k) => sum + k.currentClicks, 0);
  const avgImpressions =
    totalKeywords > 0 ? totalImpressions / totalKeywords : 0;
  const avgClicks = totalKeywords > 0 ? totalClicks / totalKeywords : 0;
  const avgCtr = totalKeywords > 0 ? totalClicks / totalImpressions : 0;

  return {
    totalKeywords,
    avgImpressions,
    avgClicks,
    avgCtr,
  };
}

export default async function SEODashboardPage() {
  const t = await getTranslations("seo");

  let keywords: KeywordWithPrevious[] = [];

  try {
    const rawKeywords = await fetchKeywordsWithSnapshots();
    keywords = await enrichKeywordsWithTrends(rawKeywords);
  } catch (error) {
    console.error("Failed to fetch keywords:", error);
  }

  const summary = calculateSummaryMetrics(keywords);
  const topPerformers = keywords.slice(0, 10);
  const underperformers = findUnderperformers(keywords, 5);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t("dashboard.title")}</h1>
        <p className="text-gray-600 mb-8">{t("dashboard.description")}</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label={t("summary.keywords")}
            value={summary.totalKeywords.toString()}
          />
          <SummaryCard
            label={t("summary.impressions")}
            value={formatMetric(summary.avgImpressions)}
          />
          <SummaryCard
            label={t("summary.clicks")}
            value={formatMetric(summary.avgClicks)}
          />
          <SummaryCard
            label={t("summary.ctr")}
            value={calculateCtrPercentage(summary.avgCtr)}
          />
        </div>

        {/* Top Performers */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">{t("topKeywords.title")}</h2>
          {topPerformers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-300">
                  <tr>
                    <th className="text-left py-2 px-4">Keyword</th>
                    <th className="text-right py-2 px-4">Position</th>
                    <th className="text-right py-2 px-4">Clicks</th>
                    <th className="text-right py-2 px-4">Impressions</th>
                    <th className="text-right py-2 px-4">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((keyword) => (
                    <tr key={keyword.id} className="border-b border-gray-200">
                      <td className="py-3 px-4">{keyword.query}</td>
                      <td className="text-right py-3 px-4">
                        {keyword.currentPosition.toFixed(1)}
                      </td>
                      <td className="text-right py-3 px-4">
                        {keyword.currentClicks}
                      </td>
                      <td className="text-right py-3 px-4">
                        {keyword.currentImpressions}
                      </td>
                      <td className="text-right py-3 px-4">
                        {calculateCtrPercentage(keyword.currentCtr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No keyword data available yet.</p>
          )}
        </div>

        {/* Underperformers */}
        {underperformers.length > 0 && (
          <div className="card bg-orange-50 border border-orange-200 mb-8">
            <h2 className="text-xl font-bold mb-4 text-orange-900">
              {t("underperformers.title")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-orange-300">
                  <tr>
                    <th className="text-left py-2 px-4">Keyword</th>
                    <th className="text-right py-2 px-4">Current Position</th>
                    <th className="text-right py-2 px-4">Previous Position</th>
                    <th className="text-right py-2 px-4">Position Drop</th>
                    <th className="text-right py-2 px-4">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {underperformers.map((keyword) => (
                    <tr key={keyword.id} className="border-b border-orange-100">
                      <td className="py-3 px-4 font-medium">
                        {keyword.query}
                      </td>
                      <td className="text-right py-3 px-4">
                        {keyword.currentPosition.toFixed(1)}
                      </td>
                      <td className="text-right py-3 px-4">
                        {keyword.previousPosition?.toFixed(1) || "—"}
                      </td>
                      <td className="text-right py-3 px-4 text-orange-600 font-medium">
                        +
                        {(
                          keyword.currentPosition - keyword.previousPosition!
                        ).toFixed(1)}
                      </td>
                      <td className="text-right py-3 px-4">
                        {keyword.currentClicks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted mt-4 text-orange-700">
              {t("underperformers.recommendation")}
            </p>
          </div>
        )}

        {/* Recommendations */}
        <div className="card bg-blue-50 border border-blue-200">
          <h2 className="text-xl font-bold mb-4 text-blue-900">
            Recommendations
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              ✓ Focus on improving underperforming keywords with position drops
              greater than 5 spots
            </li>
            <li>✓ Optimize top-performing keywords to reach position 1-3</li>
            <li>
              ✓ Create content for high-impression, low-click keywords (CTR
              improvement)
            </li>
            <li>
              ✓ Monitor keyword trends weekly to catch ranking changes early
            </li>
            <li>
              ✓ Build backlinks for keywords targeting position 4-10 to improve
              ranking
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="card">
      <p className="muted text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
