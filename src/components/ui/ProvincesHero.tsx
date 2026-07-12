import { getTranslations } from "next-intl/server";

import { MetricCard } from "@/features/charging/metric-card";

type ProvincesHeroProps = {
  provinceCount: number;
  totalStations: number;
  totalConnectors: number;
  totalHpcStations: number;
};

export const ProvincesHero = async ({
  provinceCount,
  totalStations,
  totalConnectors,
  totalHpcStations,
}: ProvincesHeroProps) => {
  const t = await getTranslations("provinces");

  return (
    <section className="mb-8 grid gap-4 md:grid-cols-4">
      <MetricCard
        index={0}
        label={t("provincesMetricLabel")}
        value={provinceCount}
        helper={t("provincesMetricHelper")}
      />
      <MetricCard
        index={1}
        label={t("stationsMetricLabel")}
        value={totalStations}
        helper={t("stationsMetricHelper")}
      />
      <MetricCard
        index={2}
        label={t("connectorsMetricLabel")}
        value={totalConnectors}
        helper={t("connectorsMetricHelper")}
      />
      <MetricCard
        index={3}
        label={t("hpcStationsMetricLabel")}
        value={totalHpcStations}
        helper={t("hpcStationsMetricHelper")}
      />
    </section>
  );
};
