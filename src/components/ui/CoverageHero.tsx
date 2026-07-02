import { getTranslations } from "next-intl/server";

import { MetricCard } from "@/features/charging/metric-card";
import { formatInteger, formatPercent } from "@/features/charging/insights";
import type { CoverageAnalysis } from "@/features/charging/coverage-analysis";

type CoverageHeroProps = {
  totals: CoverageAnalysis["totals"];
};

const formatRatio = (ratio: number) => formatPercent(ratio, 1);

export const CoverageHero = async ({ totals }: CoverageHeroProps) => {
  const t = await getTranslations("coverage");

  return (
    <section className="mb-8 grid gap-4 md:grid-cols-4">
      <MetricCard
        index={0}
        label={t("provincesMetricLabel")}
        value={formatInteger(totals.provinceCount)}
        helper={t("provincesMetricHelper")}
      />
      <MetricCard
        index={1}
        label={t("stationsMetricLabel")}
        value={formatInteger(totals.stationCount)}
        helper={t("stationsMetricHelper")}
      />
      <MetricCard
        index={2}
        label={t("hpcStationsMetricLabel")}
        value={formatInteger(totals.hpcStationCount)}
        helper={t("hpcStationsMetricHelper")}
      />
      <MetricCard
        index={3}
        label={t("powerAvailabilityMetricLabel")}
        value={formatRatio(totals.connectorPowerAvailabilityRatio)}
        helper={t("powerAvailabilityMetricHelper", {
          known: formatInteger(totals.knownPowerConnectorCount),
          total: formatInteger(totals.connectorCount),
        })}
      />
    </section>
  );
};
