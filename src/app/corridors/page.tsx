import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { CORRIDOR_DEFINITIONS } from "@/features/corridors/corridor-definitions";
import {
  buildAllCorridorAnalyses,
  type CorridorAnalysis,
  type SegmentGap,
} from "@/features/corridors/gap-detection";
import { formatInteger, formatPercent } from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import { getCorridorStations } from "@/lib/db/cached-queries";

export const revalidate = 3600;

const getCorridorAnalyses = async (): Promise<CorridorAnalysis[]> => {
  const stations = await getCorridorStations();

  return buildAllCorridorAnalyses(CORRIDOR_DEFINITIONS, stations);
};

const formatKm = (value: number) => `${value.toFixed(0)} km`;

const SegmentRow = ({ segment }: { segment: SegmentGap }) => (
  <tr className="align-top">
    <th scope="row" className="px-4 py-4 text-left font-medium text-slate-950">
      {segment.fromLabel} → {segment.toLabel}
    </th>
    <td className="px-4 py-4 text-slate-700">{formatKm(segment.segmentLengthKm)}</td>
    <td className="px-4 py-4 text-slate-700">
      {segment.nearestHpcDistanceKm === null
        ? "—"
        : formatKm(segment.nearestHpcDistanceKm)}
    </td>
    <td className="px-4 py-4">
      {segment.hasGap ? (
        <span className="badge bg-amber-100 text-amber-900">Gap</span>
      ) : (
        <span className="badge bg-emerald-100 text-emerald-900">Covered</span>
      )}
    </td>
  </tr>
);

const CorridorCard = ({
  corridor,
  headers,
}: {
  corridor: CorridorAnalysis;
  headers: {
    segment: string;
    length: string;
    nearestHpc: string;
    status: string;
  };
}) => (
  <Card as="article" className="mb-6">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{corridor.name}</h2>
        <p className="muted mt-1 text-sm">
          {formatPercent(
            corridor.segments.length - corridor.gapCount,
            corridor.segments.length,
          )}{" "}
          covered · {formatInteger(corridor.gapCount)} gap
          {corridor.gapCount === 1 ? "" : "s"}
        </p>
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              {headers.segment}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {headers.length}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {headers.nearestHpc}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {headers.status}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {corridor.segments.map((segment) => (
            <SegmentRow key={`${segment.fromLabel}-${segment.toLabel}`} segment={segment} />
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

export default async function CorridorsPage() {
  const t = await getTranslations("corridors");
  const tCommon = await getTranslations("common");

  let corridors: CorridorAnalysis[] | { error: string };

  try {
    corridors = await getCorridorAnalyses();
  } catch {
    corridors = { error: t("setupRequiredMessage") };
  }

  const errorMessage = "error" in corridors ? corridors.error : null;
  const analyses = "error" in corridors ? null : corridors;

  const totalSegments = analyses?.reduce((sum, c) => sum + c.segments.length, 0) ?? 0;
  const totalGaps = analyses?.reduce((sum, c) => sum + c.gapCount, 0) ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <a
              href="/api/exports/corridors?format=csv"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("exportCsvLink")}
            </a>
            <a
              href="/api/exports/corridors?format=json"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {t("exportJsonLink")}
            </a>
          </>
        }
      />

      <Card as="section" className="mb-8 border-emerald-200 bg-emerald-50 text-emerald-900">
        <h2 className="mb-2 text-lg font-medium">{t("explainerTitle")}</h2>
        <p>{t("explainerBody")}</p>
      </Card>

      {errorMessage !== null ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{errorMessage}</p>
        </Notice>
      ) : analyses === null ? null : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <MetricCard
              label={t("corridorsMetricLabel")}
              value={formatInteger(analyses.length)}
              helper={t("corridorsMetricHelper")}
            />
            <MetricCard
              label={t("segmentsMetricLabel")}
              value={formatInteger(totalSegments)}
              helper={t("segmentsMetricHelper")}
            />
            <MetricCard
              label={t("gapsMetricLabel")}
              value={formatInteger(totalGaps)}
              helper={t("gapsMetricHelper")}
            />
          </section>

          {analyses.map((corridor) => (
            <CorridorCard
              key={corridor.id}
              corridor={corridor}
              headers={{
                segment: t("segmentHeader"),
                length: t("lengthHeader"),
                nearestHpc: t("nearestHpcHeader"),
                status: t("statusHeader"),
              }}
            />
          ))}
        </>
      )}
    </main>
  );
}
