import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import StationMapClient from "@/app/map/station-map-client";
import {
  HPC_POWER_KW,
  type ProvinceIntelligenceRow,
} from "@/features/charging/province-intelligence";
import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import {
  formatConnectorPower,
  formatInteger,
  formatPercent,
} from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import {
  formatStationMapDto,
  groupStationMapDtos,
} from "@/features/charging/station-map";
import { formatDisplayDate } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import {
  getOperatorIntelligenceRows,
  getProvinceIntelligenceRows,
} from "@/lib/db/cached-queries";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 3600;

const TOP_OPERATOR_LIMIT = 10;
const SAMPLE_MAP_STATION_LIMIT = 150;

const getSampleMapGroups = unstable_cache(
  async () => {
    const stations = await prisma.chargingStation.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        province: true,
        operator: {
          select: {
            name: true,
            normalizedName: true,
          },
        },
        connectors: {
          select: {
            connectorType: true,
            powerKw: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: SAMPLE_MAP_STATION_LIMIT,
    });

    return groupStationMapDtos(stations.map(formatStationMapDto));
  },
  ["reports-sample-map-groups-v2"],
  { revalidate: 3600 },
);

const getReportData = async () => {
  const [provinceRows, operatorRows, mapGroups] = await Promise.all([
    getProvinceIntelligenceRows(),
    getOperatorIntelligenceRows(),
    getSampleMapGroups(),
  ]);

  return { provinceRows, operatorRows, mapGroups };
};

type OperatorTableHeaders = {
  operator: string;
  stations: string;
  marketShare: string;
  provinces: string;
  maxPower: string;
};

const OperatorBenchmarkTable = ({
  rows,
  totalStations,
  headers,
  unknownLabel,
  localizeOperatorLabel,
}: {
  rows: OperatorIntelligenceRow[];
  totalStations: number;
  headers: OperatorTableHeaders;
  unknownLabel: string;
  localizeOperatorLabel: (value: string) => string;
}) => (
  <div className="overflow-x-auto rounded-[1.5rem] border border-forest/10 bg-paper">
    <table className="min-w-full divide-y divide-forest/10 text-sm">
      <thead className="bg-forest/5 text-left text-xs uppercase tracking-wider text-forest/70">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.operator}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.stations}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.marketShare}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.provinces}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.maxPower}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-forest/10">
        {rows.map((row) => (
          <tr key={row.operatorName} className="align-top transition-colors hover:bg-forest/5">
            <th
              scope="row"
              className="px-4 py-4 text-left font-medium text-forest"
            >
              {localizeOperatorLabel(row.operatorName)}
            </th>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatPercent(row.stationCount, totalStations)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.provinceCount)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {row.maxPowerKw === null
                ? unknownLabel
                : formatConnectorPower(row.maxPowerKw)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

type ProvinceTableHeaders = {
  province: string;
  stations: string;
  hpcStations: string;
  maxPower: string;
  avgPower: string;
};

const ProvinceCoverageTable = ({
  rows,
  headers,
  unknownLabel,
  localizeProvinceLabel,
}: {
  rows: ProvinceIntelligenceRow[];
  headers: ProvinceTableHeaders;
  unknownLabel: string;
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
            {headers.maxPower}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {headers.avgPower}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-forest/10">
        {rows.map((row) => (
          <tr key={row.province} className="align-top transition-colors hover:bg-forest/5">
            <th
              scope="row"
              className="px-4 py-4 text-left font-medium text-forest"
            >
              {localizeProvinceLabel(row.province)}
            </th>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {formatInteger(row.hpcStationCount)}
              <span className="ml-1 text-forest/70">
                ({formatPercent(row.hpcStationCount, row.stationCount)})
              </span>
            </td>
            <td className="px-4 py-4 text-forest/80">
              {row.maxPowerKw === null
                ? unknownLabel
                : formatConnectorPower(row.maxPowerKw)}
            </td>
            <td className="px-4 py-4 text-forest/80">
              {row.averagePowerKw === null
                ? unknownLabel
                : formatConnectorPower(row.averagePowerKw)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default async function SampleReportPage() {
  const locale = await getLocale();
  const t = await getTranslations("reportsSample");
  const tOperators = await getTranslations("operators");
  const tProvinces = await getTranslations("provinces");
  const tCommon = await getTranslations("common");

  const localizeLabel = (value: string) => localizeFallback(value, tCommon);

  let data: Awaited<ReturnType<typeof getReportData>> | { error: string };

  try {
    data = await getReportData();
  } catch {
    data = { error: t("setupRequiredMessage") };
  }

  if ("error" in data) {
    return (
      <main className="page-shell pb-20 pt-12 sm:pt-16">
        <PageHeader title={t("title")} description={t("description")} />
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{data.error}</p>
        </Notice>
      </main>
    );
  }

  const { provinceRows, operatorRows, mapGroups } = data;

  const totalStations = provinceRows.reduce(
    (total, row) => total + row.stationCount,
    0,
  );
  const totalConnectors = provinceRows.reduce(
    (total, row) => total + row.connectorCount,
    0,
  );
  const totalOperators = operatorRows.length;
  const totalProvinces = provinceRows.length;

  const topOperators = operatorRows.slice(0, TOP_OPERATOR_LIMIT);

  const leadingOperator = operatorRows.reduce<OperatorIntelligenceRow | null>(
    (leader, row) =>
      leader === null || row.stationCount > leader.stationCount ? row : leader,
    null,
  );

  const totalHpcStations = provinceRows.reduce(
    (total, row) => total + row.hpcStationCount,
    0,
  );
  const totalKnownPowerConnectors = provinceRows.reduce(
    (total, row) => total + row.knownPowerConnectorCount,
    0,
  );
  const networkMaxPowerKw = provinceRows.reduce<number | null>(
    (max, row) =>
      row.maxPowerKw === null
        ? max
        : max === null
          ? row.maxPowerKw
          : Math.max(max, row.maxPowerKw),
    null,
  );
  const networkAveragePowerKw =
    totalKnownPowerConnectors > 0
      ? Math.round(
          (provinceRows.reduce(
            (total, row) =>
              total + (row.averagePowerKw ?? 0) * row.knownPowerConnectorCount,
            0,
          ) /
            totalKnownPowerConnectors) *
            10,
        ) / 10
      : null;

  return (
    <main className="report-print page-shell pb-20 pt-12 sm:pt-16 print:max-w-none print:px-0">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button as={Link} href="/contact" size="sm">
            {t("ctaButtonLabel")}
          </Button>
        }
      />

      <div className="sample-banner mb-8 print:break-inside-avoid">
        <Notice title={t("sampleBannerTitle")} tone="warning">
          <p>{t("sampleBannerBody")}</p>
          <span className="mt-3 inline-flex rounded-full bg-sun px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest">
            {t("badge")}
          </span>
        </Notice>
      </div>

      <section className="mb-8 grid gap-4 md:grid-cols-4 print:break-inside-avoid">
        <MetricCard
          label={t("headlineStationsLabel")}
          value={totalStations}
          helper={t("headlineStationsHelper")}
        />
        <MetricCard
          label={t("headlineConnectorsLabel")}
          value={totalConnectors}
          helper={t("headlineConnectorsHelper")}
        />
        <MetricCard
          label={t("headlineOperatorsLabel")}
          value={totalOperators}
          helper={t("headlineOperatorsHelper")}
        />
        <MetricCard
          label={t("headlineProvincesLabel")}
          value={totalProvinces}
          helper={t("headlineProvincesHelper")}
        />
      </section>

      <section className="mb-8 print:break-inside-avoid">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">{t("marketShareTitle")}</h2>
          <p className="muted mt-1 text-sm">{t("marketShareSubtitle")}</p>
          {leadingOperator && (
            <p className="mt-2 text-sm text-forest/70">
              {t("marketShareLeaderLine", {
                operator: localizeLabel(leadingOperator.operatorName),
                stations: leadingOperator.stationCount,
                connectors: leadingOperator.connectorCount,
                share: formatPercent(
                  leadingOperator.stationCount,
                  totalStations,
                ),
              })}
            </p>
          )}
        </div>
        <OperatorBenchmarkTable
          rows={topOperators}
          totalStations={totalStations}
          headers={{
            operator: tOperators("operatorHeader"),
            stations: tOperators("stationsHeader"),
            marketShare: t("marketShareHeader"),
            provinces: tOperators("provincesHeader"),
            maxPower: tOperators("maxPowerHeader"),
          }}
          unknownLabel={tCommon("unknown")}
          localizeOperatorLabel={localizeLabel}
        />
      </section>

      <section className="mb-8 print:break-inside-avoid">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">
            {t("provinceCoverageTitle")}
          </h2>
          <p className="muted mt-1 text-sm">{t("provinceCoverageSubtitle")}</p>
        </div>
        <ProvinceCoverageTable
          rows={provinceRows}
          headers={{
            province: tProvinces("provinceHeader"),
            stations: tProvinces("stationsHeader"),
            hpcStations: tProvinces("hpcStationsHeader"),
            maxPower: tProvinces("maxPowerHeader"),
            avgPower: tProvinces("avgPowerHeader"),
          }}
          unknownLabel={tCommon("unknown")}
          localizeProvinceLabel={localizeLabel}
        />
      </section>

      <section className="mb-8 print:break-inside-avoid">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">{t("powerStructureTitle")}</h2>
          <p className="muted mt-1 text-sm">{t("powerStructureSubtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label={t("hpcShareLabel")}
            value={
              totalStations > 0
                ? Math.round((totalHpcStations / totalStations) * 100)
                : 0
            }
            unit="percent"
            helper={t("hpcShareHelper", { threshold: HPC_POWER_KW })}
          />
          <MetricCard
            label={t("averagePowerLabel")}
            value={networkAveragePowerKw ?? 0}
            unit="kW"
            helper={t("averagePowerHelper")}
          />
          <MetricCard
            label={t("maxPowerLabel")}
            value={networkMaxPowerKw ?? 0}
            unit="kW"
            helper={t("maxPowerHelper")}
          />
        </div>
      </section>

      <section className="map-section mb-8 print:hidden">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">{t("mapSectionTitle")}</h2>
          <p className="muted mt-1 text-sm">
            {t("mapSectionSubtitle", { count: SAMPLE_MAP_STATION_LIMIT })}
          </p>
        </div>
        <StationMapClient groups={mapGroups} />
      </section>

      <Card as="section" className="mb-8 print:break-inside-avoid">
        <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
          {t("methodologyTitle")}
        </h2>
        <p className="muted mt-2 text-sm">{t("methodologyBody")}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-forest/70">{t("dataSourceLabel")}</dt>
            <dd className="mt-1 font-medium text-forest">
              {t("dataSourceLine")}
            </dd>
          </div>
          <div>
            <dt className="text-forest/70">{t("snapshotDateLabel")}</dt>
            <dd className="mt-1 font-medium text-forest">
              {formatDisplayDate(new Date(), locale)}
            </dd>
          </div>
          <div>
            <dt className="text-forest/70">{t("hpcDefinitionLabel")}</dt>
            <dd className="mt-1 font-medium text-forest">
              {t("hpcDefinitionLine", { threshold: HPC_POWER_KW })}
            </dd>
          </div>
        </dl>
      </Card>

      <Card
        as="section"
        className="cta-section !border-0 !bg-forest p-8 text-cream sm:p-10 print:hidden"
      >
        <h2 className="font-display text-2xl font-semibold tracking-tight">{t("ctaTitle")}</h2>
        <p className="mt-2 max-w-2xl text-cream/80">{t("ctaBody")}</p>
        <Button as={Link} href="/contact" variant="cta" className="mt-6">
          {t("ctaButtonLabel")}
        </Button>
      </Card>

      <p className="muted mt-6 text-center text-xs print:hidden">
        {t("badge")}
      </p>
    </main>
  );
}
