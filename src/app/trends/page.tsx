import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { TrendsHero } from "@/components/ui/TrendsHero";
import { buildTrendPoints } from "@/features/trends/trend-series";
import { prisma } from "@/lib/db/prisma";
import { getSnapshotsInRange } from "@/lib/snapshots/get-snapshots";
import { toUtcMidnight } from "@/lib/snapshots/snapshot-date";
import { toDailySnapshotDto } from "@/lib/snapshots/snapshot-dto";

import TrendsChartClient from "@/app/trends/trends-chart-client";

export const revalidate = 300;

const RANGE_DAYS = { "30": 30, "90": 90 } as const;
type RangeKey = keyof typeof RANGE_DAYS;

const isRangeKey = (value: string | undefined): value is RangeKey =>
  value === "30" || value === "90";

const getTrendPointsForRange = async (rangeDays: number) => {
  const now = new Date();
  const from = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

  const snapshots = await getSnapshotsInRange({
    from: toUtcMidnight(from),
    to: toUtcMidnight(now),
  });

  return buildTrendPoints(snapshots.map(toDailySnapshotDto));
};

const getTrendMetrics = async () => {
  const [totalStations, totalHpcStations, totalConnectors] = await Promise.all([
    prisma.chargingStation.count(),
    prisma.chargingStation.count({
      where: {
        connectors: {
          some: {
            powerKw: { gte: 150 },
          },
        },
      },
    }),
    prisma.chargingConnector.count(),
  ]);

  return { totalStations, totalHpcStations, totalConnectors };
};

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const activeRange: RangeKey = isRangeKey(range) ? range : "90";

  const t = await getTranslations("trends");
  const tCommon = await getTranslations("common");

  let points: Awaited<ReturnType<typeof getTrendPointsForRange>> | null = null;
  let errorMessage: string | null = null;

  try {
    points = await getTrendPointsForRange(RANGE_DAYS[activeRange]);
  } catch (error) {
    console.error("Failed to load snapshots:", error);
    errorMessage = t("setupRequiredMessage");
  }

  const isEmpty = points !== null && points.length === 0;
  const metrics = await getTrendMetrics();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href="/insights"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            {t("viewInsightsLink")}
          </Link>
        }
      />

      {errorMessage !== null ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{errorMessage}</p>
        </Notice>
      ) : isEmpty || points === null ? (
        <Notice title={t("emptyTitle")}>
          <p className="muted mx-auto mt-2 max-w-2xl">{t("emptyBody")}</p>
        </Notice>
      ) : (
        <>
          <Card as="section" className="mb-8 border-emerald-200 bg-emerald-50 text-emerald-900">
            <h2 className="mb-2 text-lg font-medium">{t("infrastructureTitle")}</h2>
            <p>{t("infrastructureDescription")}</p>
          </Card>

          <TrendsHero
            totalStations={metrics.totalStations}
            totalHpcStations={metrics.totalHpcStations}
            totalConnectors={metrics.totalConnectors}
          />

          <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t("chartTitle")}</h2>
                <p className="muted mt-1 text-sm">{t("chartSubtitle")}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/trends?range=30"
                  className={`badge ${activeRange === "30" ? "bg-emerald-600 text-white" : ""}`}
                >
                  {t("range30d")}
                </Link>
                <Link
                  href="/trends?range=90"
                  className={`badge ${activeRange === "90" ? "bg-emerald-600 text-white" : ""}`}
                >
                  {t("range90d")}
                </Link>
              </div>
            </div>
            <div className="card">
              <TrendsChartClient
                points={points}
                labels={{
                  totalStationCount: t("totalStationCountLabel"),
                  totalHpcStationCount: t("totalHpcStationCountLabel"),
                  totalConnectorCount: t("totalConnectorCountLabel"),
                }}
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
