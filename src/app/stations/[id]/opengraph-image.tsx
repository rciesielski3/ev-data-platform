import { getTranslations } from "next-intl/server";

import { loadRegionalOperatorStats } from "@/app/stations/[id]/regional-city-view";
import { formatInteger } from "@/features/charging/insights";
import {
  findRegionalCity,
  summarizeRegionalOperatorStats,
} from "@/features/charging/regional-stations";
import { OG_SIZE, renderOgCard } from "@/lib/og/og-card";

export const revalidate = 86400;
export const size = OG_SIZE;
export const contentType = "image/png";

const loadStationCount = async (slug: string) => {
  try {
    const snapshot = await loadRegionalOperatorStats(slug);
    const count = snapshot
      ? summarizeRegionalOperatorStats(snapshot.operatorStats).stationCount
      : 0;
    return count > 0 ? count : null;
  } catch {
    return null;
  }
};

const StationsOgImage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const city = findRegionalCity(id);
  const t = await getTranslations({ locale: "pl", namespace: "share" });

  if (!city) {
    return renderOgCard({ badge: t("ogDefaultBadge"), title: t("ogDefaultTitle") });
  }

  const tRegion = await getTranslations({
    locale: "pl",
    namespace: "regionalStations",
  });
  const stationCount = await loadStationCount(city.slug);

  return renderOgCard({
    badge: t("ogRegionBadge"),
    title: city.name,
    stat:
      stationCount === null
        ? undefined
        : {
            value: formatInteger(stationCount),
            label: tRegion("statsStationsLabel"),
          },
  });
};

export default StationsOgImage;
