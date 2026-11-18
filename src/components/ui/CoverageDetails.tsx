import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import {
  type CoverageAnalysis,
  type CoverageRankingRow,
} from "@/features/charging/coverage-analysis";
import { formatInteger, formatPercent } from "@/features/charging/insights";
import { localizeFallback } from "@/lib/display/localize-fallback";

type CoverageDetailsProps = {
  coverage: CoverageAnalysis;
};

const formatRatio = (ratio: number) => formatPercent(ratio, 1);

type CoverageTableHeaders = {
  province: string;
  stations: string;
  hpcStations: string;
  hpcShare: string;
  connectors: string;
  knownPower: string;
  powerAvailability: string;
  stationsPer100k: string;
};

const RankingList = ({
  rows,
  emptyLabel,
  metric,
  localizeProvinceLabel,
}: {
  rows: CoverageRankingRow[];
  emptyLabel: string;
  metric: (row: CoverageRankingRow) => string;
  localizeProvinceLabel: (value: string) => string;
}) =>
  rows.length === 0 ? (
    <p className="muted mt-4 text-sm">{emptyLabel}</p>
  ) : (
    <ol className="mt-4 space-y-3">
      {rows.map((row, index) => (
        <li
          key={row.province}
          className="flex items-baseline justify-between gap-4"
        >
          <span className="flex items-baseline gap-3">
            <span className="text-xs font-medium text-forest/70">
              {index + 1}
            </span>
            <span className="font-medium text-forest">
              {localizeProvinceLabel(row.province)}
            </span>
          </span>
          <span className="text-sm text-forest/70">{metric(row)}</span>
        </li>
      ))}
    </ol>
  );

const CoverageTable = ({
  rows,
  headers,
  localizeProvinceLabel,
}: {
  rows: CoverageRankingRow[];
  headers: CoverageTableHeaders;
  localizeProvinceLabel: (value: string) => string;
}) => (
  <div className="overflow-x-auto rounded-[1.5rem] border border-forest/10 bg-paper">
    <table className="min-w-full divide-y divide-forest/10 text-sm">
      <thead className="bg-forest/5 text-left text-xs uppercase tracking-wider text-forest/70">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.province}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.stations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.hpcStations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.hpcShare}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.connectors}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.knownPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.powerAvailability}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.stationsPer100k}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-forest/10">
        {rows.map((row) => (
          <tr key={row.province} className="align-top transition-colors hover:bg-forest/5">
            <th scope="row" className="px-4 py-4 text-left font-medium text-forest">
              {localizeProvinceLabel(row.province)}
            </th>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.hpcStationCount)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatRatio(row.hpcShare)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatRatio(row.powerAvailabilityRatio)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {row.stationsPer100k === null ? "" : row.stationsPer100k.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const CoverageDetails = async ({ coverage }: CoverageDetailsProps) => {
  const t = await getTranslations("coverage");
  const tCommon = await getTranslations("common");

  const localizeProvinceLabel = (value: string) => localizeFallback(value, tCommon);

  return (
    <>
      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card as="article">
          <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
            {t("lowestStationCountTitle")}
          </h2>
          <p className="muted mt-1 text-sm">
            {t("lowestStationCountSubtitle")}
          </p>
          <RankingList
            rows={coverage.lowestStationCountProvinces}
            emptyLabel={t("rankingEmptyLabel")}
            metric={(row) =>
              t("stationCountMetric", {
                count: formatInteger(row.stationCount),
              })
            }
            localizeProvinceLabel={localizeProvinceLabel}
          />
        </Card>

        <Card as="article">
          <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
            {t("lowestHpcCoverageTitle")}
          </h2>
          <p className="muted mt-1 text-sm">
            {t("lowestHpcCoverageSubtitle")}
          </p>
          <RankingList
            rows={coverage.lowestHpcCoverageProvinces}
            emptyLabel={t("rankingEmptyLabel")}
            metric={(row) =>
              t("hpcShareMetric", {
                share: formatRatio(row.hpcShare),
                hpcStations: formatInteger(row.hpcStationCount),
                stations: formatInteger(row.stationCount),
              })
            }
            localizeProvinceLabel={localizeProvinceLabel}
          />
        </Card>

        <Card as="article">
          <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
            {t("highestStationCountTitle")}
          </h2>
          <p className="muted mt-1 text-sm">
            {t("highestStationCountSubtitle")}
          </p>
          <RankingList
            rows={coverage.highestStationCountProvinces}
            emptyLabel={t("rankingEmptyLabel")}
            metric={(row) =>
              t("stationCountMetric", {
                count: formatInteger(row.stationCount),
              })
            }
            localizeProvinceLabel={localizeProvinceLabel}
          />
        </Card>
      </section>

      <section className="mb-8">
        <Card as="article" className="border-forest/15 bg-forest/5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
            {t("lowestPerCapitaCoverageTitle")}
          </h2>
          <p className="muted mt-1 text-sm">
            {t("lowestPerCapitaCoverageSubtitle")}
          </p>
          <RankingList
            rows={coverage.lowestPerCapitaCoverageProvinces}
            emptyLabel={t("rankingEmptyLabel")}
            metric={(row) =>
              t("perCapitaMetric", {
                value:
                  row.stationsPer100k === null ? "" : row.stationsPer100k.toFixed(2),
              })
            }
            localizeProvinceLabel={localizeProvinceLabel}
          />
        </Card>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("comparisonTitle")}</h2>
            <p className="muted mt-1 text-sm">{t("comparisonSubtitle")}</p>
          </div>
        </div>
        <CoverageTable
          rows={coverage.provinceRows}
          headers={{
            province: t("provinceHeader"),
            stations: t("stationsHeader"),
            hpcStations: t("hpcStationsHeader"),
            hpcShare: t("hpcShareHeader"),
            connectors: t("connectorsHeader"),
            knownPower: t("knownPowerHeader"),
            powerAvailability: t("powerAvailabilityHeader"),
            stationsPer100k: t("stationsPer100kHeader"),
          }}
          localizeProvinceLabel={localizeProvinceLabel}
        />
      </section>
    </>
  );
};
