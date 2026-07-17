import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { DetailsSkeleton } from "@/components/ui/DetailsSkeleton";
import { InsightsDetails } from "@/components/ui/InsightsDetails";
import { InsightsHero } from "@/components/ui/InsightsHero";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import {
  buildChargingInsights,
  type HighestPowerStationRow,
  type OperatorInsightRow,
} from "@/features/charging/insights";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 3600;

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("insights");
  return {
    title: t("title") || "Statystyki Ładowania EV & Analiza Rynku – evsource.pl",
    description: t("description") || "Poznaj statystyki infrastruktury ładowania EV w Polsce. Analizuj gęstość stacji, operatorów i trendy rynku.",
  };
};

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
          <InsightsHero summary={insights.summary} />
          <Suspense fallback={<DetailsSkeleton />}>
            <InsightsDetails insights={insights} />
          </Suspense>

          {/* Charging Speeds Section */}
          <section className="mt-12 mb-12">
            <h2 className="text-3xl font-bold mb-6">Szybkości Ładowania EV</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="font-semibold mb-2">AC (Zmiennoprądowe)</h3>
                <p className="text-sm text-muted">
                  Ładowanie powolne (3–11 kW). Typowe dla domowych i publicznych stacji.
                </p>
                <p className="text-xs text-muted mt-2">Czas: 6–8 godzin na 0–100%</p>
              </div>
              <div className="card">
                <h3 className="font-semibold mb-2">DC (Stałoprądowe)</h3>
                <p className="text-sm text-muted">
                  Ładowanie szybkie (50–150 kW). Idealne dla podróży.
                </p>
                <p className="text-xs text-muted mt-2">Czas: 20–45 minut na 0–80%</p>
              </div>
              <div className="card">
                <h3 className="font-semibold mb-2">Ultra-szybkie</h3>
                <p className="text-sm text-muted">
                  Ładowanie najszybsze (200+ kW). Dla nowoczesnych pojazdów.
                </p>
                <p className="text-xs text-muted mt-2">Czas: 10–20 minut na 0–80%</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-12 mb-12">
            <h2 className="text-3xl font-bold mb-6">Często Zadawane Pytania</h2>
            <div className="space-y-4">
              <details className="border rounded p-4">
                <summary className="font-semibold cursor-pointer">
                  Ile kosztuje ładowanie pojazdu elektrycznego?
                </summary>
                <p className="mt-3 text-muted">
                  Koszt ładowania zależy od operatora i lokalizacji. Średnio: €0.20–0.50 za kWh.
                  Nabicie od 0–100% kosztuje €4–12 w zależności od pojemności baterii (40–100 kWh).
                </p>
              </details>
              <details className="border rounded p-4">
                <summary className="font-semibold cursor-pointer">
                  Czy są darmowe stacje ładowania?
                </summary>
                <p className="mt-3 text-muted">
                  Tak, wiele hipermarketów i parkingów oferuje darmowe ładowanie dla klientów.
                  Sprawdź naszą mapę, aby znaleźć darmowe stacje w Twojej okolicy.
                </p>
              </details>
              <details className="border rounded p-4">
                <summary className="font-semibold cursor-pointer">
                  Jak szybko ładuje się pojazd elektryczny?
                </summary>
                <p className="mt-3 text-muted">
                  Zależy od typu złącza i mocy stacji. AC: 6–8h, DC: 20–45 min, Ultra-DC: 10–20 min.
                </p>
              </details>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
