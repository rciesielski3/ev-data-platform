import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import {
  formatConnectorPower,
  type ChargingInsights,
} from "@/features/charging/insights";
import { localizeFallback } from "@/lib/display/localize-fallback";

type InsightsDetailsProps = {
  insights: ChargingInsights;
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

export const InsightsDetails = async ({ insights }: InsightsDetailsProps) => {
  const t = await getTranslations("insights");
  const tCommon = await getTranslations("common");

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card as="article">
          <h2 className="text-xl font-semibold">{t("topOperatorsTitle")}</h2>
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
  );
};
