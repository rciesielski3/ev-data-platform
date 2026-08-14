import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { DetailsSkeleton } from "@/components/ui/DetailsSkeleton";
import { ProvincesDetails } from "@/components/ui/ProvincesDetails";
import { ProvincesHero } from "@/components/ui/ProvincesHero";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { ActionSection } from "@/components/ui/ActionSection";
import { type ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import { getProvincePopulationAndArea } from "@/features/charging/province-population";
import { prisma } from "@/lib/db/prisma";
import type { ProvincePrecomputedStats } from "@/lib/snapshots/types";

export const revalidate = 86400;

async function getProvinceStatsFromSnapshot(): Promise<
  Record<string, ProvincePrecomputedStats> | null
> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { snapshotDate: today },
      select: { precomputedStats: true, snapshotDate: true },
    });

    if (!snapshot?.precomputedStats) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const precomputedStats = snapshot.precomputedStats as Record<string, any>;
    const provinces = precomputedStats.provinces as Record<string, ProvincePrecomputedStats> | undefined;
    return provinces || null;
  } catch (error) {
    console.error("Failed to fetch province stats snapshot:", error);
    return null;
  }
}

export default async function ProvincesPage() {
  const t = await getTranslations("provinces");
  const tCommon = await getTranslations("common");

  let rows: ProvinceIntelligenceRow[] | { error: string };
  let snapshotDate: Date | null = null;

  try {
    const provinceStats = await getProvinceStatsFromSnapshot();

    if (provinceStats) {
      // Transform snapshot data to ProvinceIntelligenceRow format
      rows = Object.entries(provinceStats)
        .map(([province, stats]) => {
          const populationAndArea = getProvincePopulationAndArea(province);
          const stationsPer1000Km2 =
            populationAndArea !== null
              ? (stats.stationCount / populationAndArea.areaKm2) * 1000
              : null;

          return {
            province,
            stationCount: stats.stationCount,
            connectorCount: stats.connectorCount,
            knownPowerConnectorCount: 0, // Not available in snapshot
            hpcStationCount: 0, // Not available in snapshot
            maxPowerKw: null, // Not available in snapshot
            averagePowerKw: null, // Not available in snapshot
            operatorCount: stats.operatorCount,
            stationsPer100k: stats.perCapitaStations,
            stationsPer1000Km2,
          };
        })
        .sort(
          (a, b) =>
            b.stationCount - a.stationCount ||
            b.connectorCount - a.connectorCount ||
            a.province.localeCompare(b.province, "en", { sensitivity: "base" })
        );

      snapshotDate = new Date();
      snapshotDate.setHours(0, 0, 0, 0);
    } else {
      // Fallback: show warning, don't crash
      rows = { error: t("setupRequiredMessage") };
    }
  } catch {
    rows = { error: t("setupRequiredMessage") };
  }

  const provinceRows = Array.isArray(rows) ? rows : [];
  const totalStations = provinceRows.reduce(
    (total, row) => total + row.stationCount,
    0,
  );
  const totalConnectors = provinceRows.reduce(
    (total, row) => total + row.connectorCount,
    0,
  );
  const totalHpcStations = provinceRows.reduce(
    (total, row) => total + row.hpcStationCount,
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {snapshotDate && (
        <p className="text-sm text-gray-500">
          Data as of {snapshotDate.toLocaleDateString()}
        </p>
      )}

      {"error" in rows ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{rows.error}</p>
        </Notice>
      ) : rows.length === 0 ? (
        <Notice title={t("emptyTitle")}>
          <p className="muted mx-auto mt-2 max-w-2xl">{t("emptyBody")}</p>
        </Notice>
      ) : (
        <>
          <ProvincesHero
            provinceCount={rows.length}
            totalStations={totalStations}
            totalConnectors={totalConnectors}
            totalHpcStations={totalHpcStations}
          />
          <Suspense fallback={<DetailsSkeleton />}>
            <ProvincesDetails rows={rows} />
          </Suspense>

          <ActionSection
            heading={t("actionBarHeading")}
            description={t("actionBarDescription")}
            analysisGroupLabel={t("actionBarAnalysisGroupLabel")}
            exportGroupLabel={t("actionBarExportGroupLabel")}
            primaryActionLabel={t("viewInsightsLink")}
            primaryActionHref="/insights"
            secondaryActionLabel={t("browseStationsLink")}
            secondaryActionHref="/stations"
            exportCsvLabel={t("exportCsvLink")}
            exportCsvHref="/api/exports/provinces?format=csv"
            exportJsonLabel={t("exportJsonLink")}
            exportJsonHref="/api/exports/provinces?format=json"
          />
        </>
      )}
    </main>
  );
}
