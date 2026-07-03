import { getTranslations } from "next-intl/server";

import { MetricCard } from "@/features/charging/metric-card";
import type { ChargingInsights } from "@/features/charging/insights";

type InsightsHeroProps = {
  summary: ChargingInsights["summary"];
};

export const InsightsHero = async ({ summary }: InsightsHeroProps) => {
  const t = await getTranslations("insights");

  return (
    <section className="mb-8 grid gap-4 md:grid-cols-3">
      <MetricCard
        index={0}
        label={t("stationsMetricLabel")}
        value={summary.totalStations}
        helper={t("stationsMetricHelper")}
      />
      <MetricCard
        index={1}
        label={t("connectorsMetricLabel")}
        value={summary.totalConnectors}
        helper={t("connectorsMetricHelper")}
      />
      <MetricCard
        index={2}
        label={t("knownPowerMetricLabel")}
        value={summary.knownPowerConnectors}
        helper={t("knownPowerMetricHelper")}
      />
    </section>
  );
};
