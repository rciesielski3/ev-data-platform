import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import { type ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import {
  formatConnectorPower,
  formatInteger,
  formatPercent,
} from "@/features/charging/insights";
import { localizeFallback } from "@/lib/display/localize-fallback";

type ProvincesDetailsProps = {
  rows: ProvinceIntelligenceRow[];
};

const formatHpcShare = (row: ProvinceIntelligenceRow) =>
  formatPercent(row.hpcStationCount, row.stationCount);

const formatPerCapita = (row: ProvinceIntelligenceRow, unknownLabel: string) =>
  row.stationsPer100k === null
    ? unknownLabel
    : row.stationsPer100k.toFixed(2);

type ProvinceTableHeaders = {
  province: string;
  stations: string;
  connectors: string;
  knownPower: string;
  hpcStations: string;
  maxPower: string;
  avgPower: string;
  operators: string;
  stationsPer100k: string;
};

const ProvinceTable = ({
  rows,
  headers,
  unknownLabel,
  formatPowerMetric,
  localizeProvinceLabel,
}: {
  rows: ProvinceIntelligenceRow[];
  headers: ProvinceTableHeaders;
  unknownLabel: string;
  formatPowerMetric: (powerKw: number | null) => string;
  localizeProvinceLabel: (value: string) => string;
}) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.province}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.stations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.connectors}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.knownPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.hpcStations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.maxPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.avgPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.operators}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.stationsPer100k}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.province} className="align-top">
            <th scope="row" className="px-4 py-4 text-left font-medium text-slate-950">
              {localizeProvinceLabel(row.province)}
            </th>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.hpcStationCount)}
              <span className="ml-1 text-slate-400">
                ({formatHpcShare(row)})
              </span>
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPowerMetric(row.maxPowerKw) || unknownLabel}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPowerMetric(row.averagePowerKw) || unknownLabel}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.operatorCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPerCapita(row, unknownLabel)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ProvincesDetails = async ({ rows }: ProvincesDetailsProps) => {
  const t = await getTranslations("provinces");
  const tCommon = await getTranslations("common");

  const formatPowerMetric = (powerKw: number | null) =>
    powerKw === null ? "" : formatConnectorPower(powerKw);

  const strongestProvince = rows.reduce<ProvinceIntelligenceRow | null>(
    (strongest, row) => {
      if (row.maxPowerKw === null) {
        return strongest;
      }

      const isStronger =
        strongest === null ||
        strongest.maxPowerKw === null ||
        row.maxPowerKw > strongest.maxPowerKw;

      return isStronger ? row : strongest;
    },
    null,
  );

  return (
    <>
      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        {rows.slice(0, 3).map((row) => (
          <Card as="article" key={row.province}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {localizeFallback(row.province, tCommon)}
                </h2>
                <p className="muted mt-1 text-sm">
                  {t("stationsConnectorsLine", {
                    stations: formatInteger(row.stationCount),
                    connectors: formatInteger(row.connectorCount),
                  })}
                </p>
              </div>
              <span className="badge">
                {t("hpcBadge", { share: formatHpcShare(row) })}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">{t("maxPowerLabel")}</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {formatPowerMetric(row.maxPowerKw) || tCommon("unknown")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("averagePowerLabel")}</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {formatPowerMetric(row.averagePowerKw) || tCommon("unknown")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("knownPowerLabel")}</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {formatInteger(row.knownPowerConnectorCount)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("operatorsLabel")}</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {formatInteger(row.operatorCount)}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("comparisonTitle")}</h2>
            <p className="muted mt-1 text-sm">{t("comparisonSubtitle")}</p>
          </div>
          <p className="text-sm text-slate-500">
            {t("strongestProvinceLine", {
              province: strongestProvince
                ? `${localizeFallback(strongestProvince.province, tCommon)} (${formatPowerMetric(strongestProvince.maxPowerKw)})`
                : tCommon("unknown"),
            })}
          </p>
        </div>
        <ProvinceTable
          rows={rows}
          headers={{
            province: t("provinceHeader"),
            stations: t("stationsHeader"),
            connectors: t("connectorsHeader"),
            knownPower: t("knownPowerHeader"),
            hpcStations: t("hpcStationsHeader"),
            maxPower: t("maxPowerHeader"),
            avgPower: t("avgPowerHeader"),
            operators: t("operatorsHeader"),
            stationsPer100k: t("stationsPer100kHeader"),
          }}
          unknownLabel={tCommon("unknown")}
          formatPowerMetric={formatPowerMetric}
          localizeProvinceLabel={(value) => localizeFallback(value, tCommon)}
        />
      </section>
    </>
  );
};
