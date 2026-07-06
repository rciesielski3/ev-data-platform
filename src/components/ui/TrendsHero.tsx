import { getTranslations } from "next-intl/server";

import { MetricCard } from "@/features/charging/metric-card";

type TrendsHeroProps = {
  totalStations: number;
  totalHpcStations: number;
  totalConnectors: number;
};

export const TrendsHero = async ({
  totalStations,
  totalHpcStations,
  totalConnectors,
}: TrendsHeroProps) => {
  const t = await getTranslations("trends");

  return (
    <section className="mb-8 grid gap-4 md:grid-cols-3">
      <MetricCard
        index={0}
        label={t("stationsMetricLabel")}
        value={totalStations}
        helper={t("stationsMetricHelper")}
      />
      <MetricCard
        index={1}
        label={t("hpcStationsMetricLabel")}
        value={totalHpcStations}
        helper={t("hpcStationsMetricHelper")}
      />
      <MetricCard
        index={2}
        label={t("connectorsMetricLabel")}
        value={totalConnectors}
        helper={t("connectorsMetricHelper")}
      />
    </section>
  );
};
