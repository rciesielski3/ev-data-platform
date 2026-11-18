import { Suspense, cache } from "react";

import { getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import MetricCardSkeleton from "@/components/ui/MetricCardSkeleton";
import { CORRIDOR_DEFINITIONS } from "@/features/corridors/corridor-definitions";
import {
  buildAllCorridorAnalyses,
  type CorridorAnalysis,
  type SegmentGap,
} from "@/features/corridors/gap-detection";
import { formatPercent } from "@/features/charging/insights";
import { MetricCard } from "@/features/charging/metric-card";
import { getCorridorStations } from "@/lib/db/cached-queries";

export const revalidate = 300;

const getCorridorAnalyses = cache(
  async (): Promise<CorridorAnalysis[]> => {
    const stations = await getCorridorStations();

    return buildAllCorridorAnalyses(CORRIDOR_DEFINITIONS, stations);
  }
);

const formatKm = (value: number) => `${value.toFixed(0)} km`;

const SegmentRow = ({ segment, t }: { segment: SegmentGap; t: Awaited<ReturnType<typeof getTranslations<"corridors">>> }) => (
  <tr className="align-top transition-colors hover:bg-forest/5">
    <th scope="row" className="px-4 py-4 text-left font-medium text-forest">
      {segment.fromLabel} → {segment.toLabel}
    </th>
    <td className="px-4 py-4 text-forest/80">{formatKm(segment.segmentLengthKm)}</td>
    <td className="px-4 py-4 text-forest/80">
      {segment.nearestHpcDistanceKm === null
        ? "-"
        : formatKm(segment.nearestHpcDistanceKm)}
    </td>
    <td className="px-4 py-4">
      {segment.hasGap ? (
        <span className="badge bg-sun text-forest">{t("statusGap")}</span>
      ) : (
        <span className="badge bg-forest/10 text-forest">{t("statusCovered")}</span>
      )}
    </td>
  </tr>
);

const CorridorCard = ({
  corridor,
  headers,
  t,
}: {
  corridor: CorridorAnalysis;
  headers: {
    segment: string;
    length: string;
    nearestHpc: string;
    status: string;
  };
  t: Awaited<ReturnType<typeof getTranslations<"corridors">>>;
}) => (
  <Card as="article" className="mb-6">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-forest">{corridor.name}</h2>
        <p className="muted mt-1 text-sm">
          {t("summary", {
            coveredPercent: formatPercent(
              corridor.segments.length - corridor.gapCount,
              corridor.segments.length,
            ),
            gapCount: corridor.gapCount,
          })}
        </p>
      </div>
    </div>
    <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-paper">
      <table className="min-w-full divide-y divide-forest/10 text-sm">
        <thead className="bg-forest/5 text-left text-xs uppercase tracking-wider text-forest/70">
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
        <tbody className="divide-y divide-forest/10">
          {corridor.segments.map((segment) => (
            <SegmentRow key={`${segment.fromLabel}-${segment.toLabel}`} segment={segment} t={t} />
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const CorridorCardsSkeleton = () => (
  <div className="space-y-6" aria-hidden="true">
    {[0, 1, 2].map((index) => (
      <Card key={index} as="article" className="mb-6 animate-pulse">
        <div className="mb-4 h-6 w-48 rounded-xl bg-forest/10" />
        <div className="mb-4 h-4 w-64 rounded-xl bg-forest/5" />
        <div className="space-y-2">
          <div className="h-10 rounded-xl bg-forest/5" />
          <div className="h-10 rounded-xl bg-forest/5" />
          <div className="h-10 rounded-xl bg-forest/5" />
        </div>
      </Card>
    ))}
  </div>
);

const GapsMetric = async ({
  label,
  helper,
}: {
  label: string;
  helper: string;
}) => {
  const analyses = await getCorridorAnalyses();
  const totalGaps = analyses.reduce((sum, corridor) => sum + corridor.gapCount, 0);

  return <MetricCard index={2} label={label} value={totalGaps} helper={helper} />;
};

const CorridorCardsSection = async ({
  headers,
  t,
}: {
  headers: {
    segment: string;
    length: string;
    nearestHpc: string;
    status: string;
  };
  t: Awaited<ReturnType<typeof getTranslations<"corridors">>>;
}) => {
  const analyses = await getCorridorAnalyses();

  return (
    <>
      {analyses.map((corridor) => (
        <CorridorCard key={corridor.id} corridor={corridor} headers={headers} t={t} />
      ))}
    </>
  );
};

export default async function CorridorsPage() {
  try {
    const t = await getTranslations("corridors");

    const totalCorridors = CORRIDOR_DEFINITIONS.length;
    const totalSegments = CORRIDOR_DEFINITIONS.reduce(
      (sum, corridor) => sum + corridor.segments.length,
      0,
    );

    return (
      <main className="page-shell pb-20 pt-12 sm:pt-16">
        <PageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <>
              <a
                href="/api/exports/corridors?format=csv"
                className="text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                {t("exportCsvLink")}
              </a>
              <a
                href="/api/exports/corridors?format=json"
                className="text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                {t("exportJsonLink")}
              </a>
            </>
          }
        />

        <Card as="section" className="mb-8 border-forest/10 bg-forest/5 text-forest">
          <h2 className="mb-2 font-display text-lg font-semibold tracking-tight">{t("explainerTitle")}</h2>
          <p>{t("explainerBody")}</p>
        </Card>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <MetricCard
            index={0}
            label={t("corridorsMetricLabel")}
            value={totalCorridors}
            helper={t("corridorsMetricHelper")}
          />
          <MetricCard
            index={1}
            label={t("segmentsMetricLabel")}
            value={totalSegments}
            helper={t("segmentsMetricHelper")}
          />
          <Suspense fallback={<MetricCardSkeleton />}>
            <GapsMetric label={t("gapsMetricLabel")} helper={t("gapsMetricHelper")} />
          </Suspense>
        </section>

        <Suspense fallback={<CorridorCardsSkeleton />}>
          <CorridorCardsSection
            headers={{
              segment: t("segmentHeader"),
              length: t("lengthHeader"),
              nearestHpc: t("nearestHpcHeader"),
              status: t("statusHeader"),
            }}
            t={t}
          />
        </Suspense>
      </main>
    );
  } catch (error) {
    console.error("Corridors page error:", error);
    return (
      <main className="page-shell pb-20 pt-12 sm:pt-16">
        <Notice
          title="Unavailable"
          description="Corridor analysis is not yet available. Please check back later."
          tone="neutral"
        />
      </main>
    );
  }
}
