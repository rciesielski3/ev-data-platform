import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { DetailsSkeleton } from "@/components/ui/DetailsSkeleton";
import { ProvincesDetails } from "@/components/ui/ProvincesDetails";
import { ProvincesHero } from "@/components/ui/ProvincesHero";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { type ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import { getProvinceIntelligenceRows } from "@/lib/db/cached-queries";

export const revalidate = 3600;

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
        actions={
          <>
            <Link
              href="/insights"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("viewInsightsLink")}
            </Link>
            <Link
              href="/stations"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("browseStationsLink")}
            </Link>
            <a
              href="/api/exports/provinces?format=csv"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("exportCsvLink")}
            </a>
            <a
              href="/api/exports/provinces?format=json"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("exportJsonLink")}
            </a>
          </>
        }
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
        </>
      )}
    </main>
  );
}
