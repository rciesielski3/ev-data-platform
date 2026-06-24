import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import {
  buildChargingInsights,
  formatConnectorPower,
  type HighestPowerStationRow,
  type OperatorInsightRow,
} from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 3600;

const INSIGHT_LIMIT = 10;
const HIGHEST_POWER_CANDIDATE_LIMIT = 80;

const getOperatorRows = async (): Promise<OperatorInsightRow[]> => {
  const operatorCounts = await prisma.chargingStation.groupBy({
    by: ["operatorId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: INSIGHT_LIMIT * 2,
  });

  const operatorIds = operatorCounts
    .map((row) => row.operatorId)
    .filter((operatorId): operatorId is string => Boolean(operatorId));

  const operators =
    operatorIds.length > 0
      ? await prisma.chargingOperator.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, name: true, normalizedName: true },
        })
      : [];
  const operatorNames = new Map(
    operators.map((operator) => [
      operator.id,
      operator.name ?? operator.normalizedName,
    ]),
  );

  return operatorCounts.map((row) => ({
    operatorName: row.operatorId ? operatorNames.get(row.operatorId) ?? null : null,
    stationCount: row._count.id,
  }));
};

const getHighestPowerStationRows = async (): Promise<HighestPowerStationRow[]> => {
  const connectors = await prisma.chargingConnector.findMany({
    where: { powerKw: { not: null } },
    select: {
      connectorType: true,
      powerKw: true,
      station: {
        select: {
          id: true,
          name: true,
          city: true,
          province: true,
          operator: {
            select: {
              name: true,
              normalizedName: true,
            },
          },
        },
      },
    },
    orderBy: [{ powerKw: "desc" }, { connectorType: "asc" }],
    take: HIGHEST_POWER_CANDIDATE_LIMIT,
  });

  const seenStationIds = new Set<string>();
  const stationRows: HighestPowerStationRow[] = [];

  for (const connector of connectors) {
    if (connector.powerKw === null || seenStationIds.has(connector.station.id)) {
      continue;
    }

    seenStationIds.add(connector.station.id);
    stationRows.push({
      stationId: connector.station.id,
      stationName: connector.station.name,
      operatorName:
        connector.station.operator?.name ??
        connector.station.operator?.normalizedName ??
        null,
      city: connector.station.city,
      province: connector.station.province,
      connectorType: connector.connectorType,
      powerKw: connector.powerKw,
    });

    if (stationRows.length >= INSIGHT_LIMIT) {
      break;
    }
  }

  return stationRows;
};

const getInsightsData = async () => {
  const [
    totalStations,
    totalConnectors,
    knownPowerConnectors,
    operatorRows,
    connectorRows,
    highestPowerStations,
    provinceRows,
  ] = await Promise.all([
    prisma.chargingStation.count(),
    prisma.chargingConnector.count(),
    prisma.chargingConnector.count({ where: { powerKw: { not: null } } }),
    getOperatorRows(),
    prisma.chargingConnector.groupBy({
      by: ["connectorType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: INSIGHT_LIMIT,
    }),
    getHighestPowerStationRows(),
    prisma.chargingStation.groupBy({
      by: ["province"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: INSIGHT_LIMIT,
    }),
  ]);

  return buildChargingInsights({
    totalStations,
    totalConnectors,
    knownPowerConnectors,
    operatorRows,
    connectorRows: connectorRows.map((row) => ({
      connectorType: row.connectorType,
      connectorCount: row._count.id,
    })),
    highestPowerStations,
    provinceRows: provinceRows.map((row) => ({
      province: row.province,
      stationCount: row._count.id,
    })),
  });
};

const ShareBar = ({ percentLabel }: { percentLabel: string }) => {
  const percent = Number(percentLabel.replace("%", ""));

  return (
    <div className="mt-2 h-2 rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-emerald-500"
        style={{ width: `${Number.isFinite(percent) ? percent : 0}%` }}
      />
    </div>
  );
};

export default async function InsightsPage() {
  const t = await getTranslations("insights");
  const tCommon = await getTranslations("common");

  let insights: Awaited<ReturnType<typeof getInsightsData>> | { error: string };

  try {
    insights = await getInsightsData();
  } catch {
    insights = { error: t("setupRequiredMessage") };
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href="/stations"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            {t("browseStationsLink")}
          </Link>
        }
      />

      {"error" in insights ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{insights.error}</p>
        </Notice>
      ) : insights.isEmpty ? (
        <Notice title={t("emptyTitle")}>
          <p className="muted mx-auto mt-2 max-w-2xl">{t("emptyBody")}</p>
        </Notice>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <MetricCard
              label={t("stationsMetricLabel")}
              value={insights.summary.totalStations}
              helper={t("stationsMetricHelper")}
            />
            <MetricCard
              label={t("connectorsMetricLabel")}
              value={insights.summary.totalConnectors}
              helper={t("connectorsMetricHelper")}
            />
            <MetricCard
              label={t("knownPowerMetricLabel")}
              value={insights.summary.knownPowerConnectors}
              helper={t("knownPowerMetricHelper")}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card as="article">
              <h2 className="font-display text-xl font-semibold">{t("topOperatorsTitle")}</h2>
              <p className="muted mt-1 text-sm">{t("topOperatorsSubtitle")}</p>
              <div className="mt-5 space-y-4">
                {insights.topOperators.map((operator) => (
                  <div key={operator.label}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-slate-900">
                        {localizeFallback(operator.label, tCommon)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {operator.stationCount} {t("stationsUnit")} /{" "}
                        {operator.stationShare}
                      </span>
                    </div>
                    <ShareBar percentLabel={operator.stationShare} />
                  </div>
                ))}
              </div>
            </Card>

            <Card as="article">
              <h2 className="text-xl font-semibold">
                {t("connectorDistributionTitle")}
              </h2>
              <p className="muted mt-1 text-sm">
                {t("connectorDistributionSubtitle")}
              </p>
              <div className="mt-5 space-y-4">
                {insights.connectorDistribution.map((connector) => (
                  <div key={connector.connectorType}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-slate-900">
                        {localizeFallback(connector.connectorType, tCommon)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {connector.connectorCount} {t("connectorsUnit")} /{" "}
                        {connector.connectorShare}
                      </span>
                    </div>
                    <ShareBar percentLabel={connector.connectorShare} />
                  </div>
                ))}
              </div>
            </Card>

            <Card as="article">
              <h2 className="text-xl font-semibold">{t("highestPowerTitle")}</h2>
              <p className="muted mt-1 text-sm">{t("highestPowerSubtitle")}</p>
              <div className="mt-5 divide-y divide-slate-100">
                {insights.highestPowerStations.map((station) => (
                  <div
                    key={station.stationId}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <h3 className="font-medium text-slate-950">
                        {localizeFallback(station.stationName, tCommon)}
                      </h3>
                      <p className="muted mt-1 text-sm">
                        {localizeFallback(station.operatorName, tCommon)} /{" "}
                        {localizeFallback(station.location, tCommon)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {localizeFallback(station.connectorType, tCommon)}
                      </p>
                    </div>
                    <Badge>{station.powerLabel}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card as="article">
              <h2 className="text-xl font-semibold">{t("provinceCoverageTitle")}</h2>
              <p className="muted mt-1 text-sm">{t("provinceCoverageSubtitle")}</p>
              <div className="mt-5 space-y-4">
                {insights.provinceCoverage.map((province) => (
                  <div key={province.province}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-slate-900">
                        {localizeFallback(province.province, tCommon)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {province.stationCount} {t("stationsUnit")} /{" "}
                        {province.stationShare}
                      </span>
                    </div>
                    <ShareBar percentLabel={province.stationShare} />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <p className="muted mt-6 text-sm">
            {t("footnote", {
              power: insights.highestPowerStations[0]
                ? formatConnectorPower(insights.highestPowerStations[0].powerKw)
                : "0 kW",
            })}
          </p>
        </>
      )}
    </main>
  );
}
