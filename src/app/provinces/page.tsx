import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { DetailsSkeleton } from "@/components/ui/DetailsSkeleton";
import { ProvincesDetails } from "@/components/ui/ProvincesDetails";
import { ProvincesHero } from "@/components/ui/ProvincesHero";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { ActionSection } from "@/components/ui/ActionSection";
import { type ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const revalidate = 300;

export default async function ProvincesPage() {
  const t = await getTranslations("provinces");
  const tCommon = await getTranslations("common");

  let rows: ProvinceIntelligenceRow[] | { error: string };

  try {
    rows = await getProvinceIntelligenceRows();
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
