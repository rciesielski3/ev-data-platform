import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import StationMapClient from "@/app/map/station-map-client";
import { HPC_POWER_KW, type ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
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
  ["reports-sample-map-groups"],
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
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
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
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.operatorName} className="align-top">
            <th scope="row" className="px-4 py-4 text-left font-medium text-slate-950">
              {localizeOperatorLabel(row.operatorName)}
            </th>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatPercent(row.stationCount, totalStations)}
            </td>
            <td className="px-4 py-4 text-slate-700">
              {formatInteger(row.provinceCount)}
            </td>
            <td className="px-4 py-4 text-slate-700">
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
              {formatInteger(row.hpcStationCount)}
              <span className="ml-1 text-slate-400">
                ({formatPercent(row.hpcStationCount, row.stationCount)})
              </span>
            </td>
            <td className="px-4 py-4 text-slate-700">
              {row.maxPowerKw === null
                ? unknownLabel
                : formatConnectorPower(row.maxPowerKw)}
            </td>
            <td className="px-4 py-4 text-slate-700">
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
      <main className="mx-auto max-w-6xl px-6 py-12">
        <PageHeader title={t("title")} description={t("description")} />
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{data.error}</p>
        </Notice>
      </main>
    );
  }

  const { provinceRows, operatorRows, mapGroups } = data;

  const totalStations = provinceRows.reduce((total, row) => total + row.stationCount, 0);
  const totalConnectors = provinceRows.reduce((total, row) => total + row.connectorCount, 0);
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
      row.maxPowerKw === null ? max : max === null ? row.maxPowerKw : Math.max(max, row.maxPowerKw),
    null,
  );
  const networkAveragePowerKw =
    totalKnownPowerConnectors > 0
      ? Math.round(
          (provinceRows.reduce(
            (total, row) => total + (row.averagePowerKw ?? 0) * row.knownPowerConnectorCount,
            0,
          ) /
            totalKnownPowerConnectors) *
            10,
        ) / 10
      : null;

  return (
    <main className="report-print mx-auto max-w-6xl px-6 py-12 print:max-w-none print:px-0">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href="/contact"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            {t("ctaButtonLabel")}
          </Link>
        }
      />

      <div className="sample-banner mb-8 print:break-inside-avoid">
        <Notice title={t("sampleBannerTitle")} tone="warning">
          <p>{t("sampleBannerBody")}</p>
          <span className="badge mt-3 inline-block">{t("badge")}</span>
        </Notice>
      </div>

      <section className="mb-8 grid gap-4 md:grid-cols-4 print:break-inside-avoid">
        <MetricCard
          label={t("headlineStationsLabel")}
          value={formatInteger(totalStations)}
          helper={t("headlineStationsHelper")}
        />
        <MetricCard
          label={t("headlineConnectorsLabel")}
          value={formatInteger(totalConnectors)}
          helper={t("headlineConnectorsHelper")}
        />
        <MetricCard
          label={t("headlineOperatorsLabel")}
          value={formatInteger(totalOperators)}
          helper={t("headlineOperatorsHelper")}
        />
        <MetricCard
          label={t("headlineProvincesLabel")}
          value={`${formatInteger(totalProvinces)}/16`}
          helper={t("headlineProvincesHelper")}
        />
      </section>

      <section className="mb-8 print:break-inside-avoid">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{t("marketShareTitle")}</h2>
          <p className="muted mt-1 text-sm">{t("marketShareSubtitle")}</p>
          {leadingOperator && (
            <p className="mt-2 text-sm text-slate-600">
              {t("marketShareLeaderLine", {
                operator: localizeLabel(leadingOperator.operatorName),
                share: formatPercent(leadingOperator.stationCount, totalStations),
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
          <h2 className="text-xl font-semibold">{t("provinceCoverageTitle")}</h2>
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
          <h2 className="text-xl font-semibold">{t("powerStructureTitle")}</h2>
          <p className="muted mt-1 text-sm">{t("powerStructureSubtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label={t("hpcShareLabel")}
            value={formatPercent(totalHpcStations, totalStations)}
            helper={t("hpcShareHelper", { threshold: HPC_POWER_KW })}
          />
          <MetricCard
            label={t("averagePowerLabel")}
            value={
              networkAveragePowerKw === null
                ? tCommon("unknown")
                : formatConnectorPower(networkAveragePowerKw)
            }
            helper={t("averagePowerHelper")}
          />
          <MetricCard
            label={t("maxPowerLabel")}
            value={
              networkMaxPowerKw === null
                ? tCommon("unknown")
                : formatConnectorPower(networkMaxPowerKw)
            }
            helper={t("maxPowerHelper")}
          />
        </div>
      </section>

      <section className="map-section mb-8 print:hidden">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{t("mapSectionTitle")}</h2>
          <p className="muted mt-1 text-sm">
            {t("mapSectionSubtitle", { count: SAMPLE_MAP_STATION_LIMIT })}
          </p>
        </div>
        <StationMapClient groups={mapGroups} />
      </section>

      <Card as="section" className="mb-8 print:break-inside-avoid">
        <h2 className="text-lg font-semibold text-slate-950">{t("methodologyTitle")}</h2>
        <p className="muted mt-2 text-sm">{t("methodologyBody")}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">{t("dataSourceLabel")}</dt>
            <dd className="mt-1 font-medium text-slate-950">{t("dataSourceLine")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("snapshotDateLabel")}</dt>
            <dd className="mt-1 font-medium text-slate-950">
              {formatDisplayDate(new Date(), locale)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("hpcDefinitionLabel")}</dt>
            <dd className="mt-1 font-medium text-slate-950">
              {t("hpcDefinitionLine", { threshold: HPC_POWER_KW })}
            </dd>
          </div>
        </dl>
      </Card>

      <Card
        as="section"
        className="cta-section border-emerald-200 bg-emerald-50 text-emerald-900 print:hidden"
      >
        <h2 className="text-lg font-semibold">{t("ctaTitle")}</h2>
        <p className="mt-2">{t("ctaBody")}</p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {t("ctaButtonLabel")}
        </Link>
      </Card>

      <p className="muted mt-6 text-center text-xs print:hidden">{t("badge")}</p>
    </main>
  );
}
