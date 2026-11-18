import { getLocale, getTranslations } from "next-intl/server";

import { readChargePointTotals } from "@/features/charging/charge-points";
import { buildFallbackStationTotals } from "@/features/charging/fallback-stations";
import { isDatabaseUnavailableError } from "@/lib/db/database-unavailable";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate, formatDisplayNumber } from "@/lib/display/data-display";
import { loadFallbackStations } from "@/lib/fallback/stations-snapshot";
import type { SupportedLocale } from "@/lib/i18n/constants";

import { getCachedLatestSnapshot, getCachedPrecomputedStats } from "./latest-snapshot";
import { loadHomeInsights } from "./load-home-insights";
import { formatRelativeTime } from "./relative-time";
import type { StationDotMap } from "./station-dots";
import type { StationInsights } from "./station-insights";

export type HomeLink = { href: string; label: string };

export type HomeCard = {
  key: string;
  href: string;
  eyebrow?: string;
  title: string;
  body: string;
};

export type HomeStat = { key: string; value: string; label: string; numeric?: number };

export type HomeFreshness = {
  key: "stations" | "vehicles";
  label: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "RUNNING";
  relative: string;
};

export type HomeContent = {
  locale: SupportedLocale;
  hero: { badge: string; headline: string; subhead: string; primary: HomeLink; secondary: HomeLink };
  stats: HomeStat[];
  freshness: HomeFreshness[];
  chargePoints: { label: string; total: string; split: string } | null;
  snapshotNote: string | null;
  valueProps: { title: string; subtitle: string; items: HomeCard[] };
  explore: { title: string; subtitle: string; items: HomeCard[] };
  analysis: { title: string; subtitle: string; items: HomeCard[] };
  b2b: { title: string; body: string; cta: HomeLink };
  operators: { title: string; subtitle: string; items: HomeCard[] };
  stationMap: StationDotMap;
  insights: StationInsights & {
    labels: { provinces: string; connectors: string; operators: string; stations: string };
  };
};

type RunStatus = HomeFreshness["status"];
type Run = { status: RunStatus; completedAt: Date | null };

const latestRun = (key: string, statuses: RunStatus[]): Promise<Run | null> =>
  prisma.ingestionRun.findFirst({
    select: { status: true, completedAt: true },
    where: { completedAt: { not: null }, status: { in: statuses }, source: { key } },
    orderBy: { completedAt: "desc" },
  });

const loadTotals = async () => {
  const snapshot = await getCachedLatestSnapshot().catch(() => null);

  if (snapshot && !snapshot.error) {
    return {
      stationCount: snapshot.totalStationCount,
      operatorCount: snapshot.totalOperatorCount,
      snapshotAt: null,
    };
  }

  const stationSnapshot = await loadFallbackStations();

  return {
    ...buildFallbackStationTotals(stationSnapshot.stations),
    snapshotAt: stationSnapshot.generatedAt,
  };
};

const loadRuns = async () => {
  try {
    const [stations, vehicles] = await Promise.all([
      latestRun("eipa", ["RUNNING", "SUCCESS", "PARTIAL"]),
      latestRun("openev", ["SUCCESS", "PARTIAL"]),
    ]);
    return { stations, vehicles };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    return { stations: null, vehicles: null };
  }
};

export const getHomeContent = async (): Promise<HomeContent> => {
  const [locale, t, tHero, tNav, tCommon, tChargePoints, totals, runs, home, precomputed] = await Promise.all([
    getLocale() as Promise<SupportedLocale>,
    getTranslations("home"),
    getTranslations("hero"),
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("chargePoints"),
    loadTotals(),
    loadRuns(),
    loadHomeInsights(),
    getCachedPrecomputedStats().catch(() => null),
  ]);

  const chargePoints = readChargePointTotals(precomputed?.precomputedStats);

  const freshness = (
    [
      { key: "stations", label: t("importStatus.stationData"), run: runs.stations },
      { key: "vehicles", label: t("importStatus.evCatalog"), run: runs.vehicles },
    ] as const
  ).flatMap(({ key, label, run }) =>
    run
      ? [
          {
            key,
            label,
            status: run.status,
            relative:
              run.status === "RUNNING"
                ? t("importStatus.running")
                : formatRelativeTime(run.completedAt, locale, tCommon("notAvailable")),
          },
        ]
      : [],
  );

  return {
    locale,
    hero: {
      badge: t("heroBadge"),
      headline: t("heroHeadline"),
      subhead: t("heroSubhead"),
      primary: { href: "/stations", label: tHero("discoveryTitle") },
      secondary: { href: "/map", label: tHero("discoverySubtitle") },
    },
    stats: [
      {
        key: "stations",
        value: formatDisplayNumber(totals.stationCount, locale),
        label: t("statStations"),
        numeric: totals.stationCount,
      },
      {
        key: "operators",
        value: formatDisplayNumber(totals.operatorCount, locale),
        label: t("statOperators"),
        numeric: totals.operatorCount,
      },
    ],
    freshness,
    chargePoints: chargePoints
      ? {
          label: tChargePoints("statLabel"),
          total: formatDisplayNumber(chargePoints.total, locale),
          split: tChargePoints("split", {
            ac: formatDisplayNumber(chargePoints.ac, locale),
            dc: formatDisplayNumber(chargePoints.dc, locale),
          }),
        }
      : null,
    snapshotNote: totals.snapshotAt
      ? t("snapshotAsOf", { date: formatDisplayDate(totals.snapshotAt, locale) })
      : null,
    valueProps: {
      title: t("valuePropsTitle"),
      subtitle: t("valuePropsSubtitle"),
      items: [
        { key: "quality", href: "/stations", title: t("valueQualityTitle"), body: t("valueQualityBody") },
        { key: "normalized", href: "/stations", title: t("valueNormalizedTitle"), body: t("valueNormalizedBody") },
        { key: "benchmark", href: "/reports", title: t("valueBenchmarkTitle"), body: t("valueBenchmarkBody") },
      ],
    },
    explore: {
      title: t("exploreTitle"),
      subtitle: t("exploreSubtitle"),
      items: [
        {
          key: "map",
          href: "/map",
          eyebrow: t("stationMapEyebrow"),
          title: t("stationMapTitle"),
          body: t("stationMapDescription"),
        },
        {
          key: "search",
          href: "/stations",
          eyebrow: t("stationSearchEyebrow"),
          title: t("stationSearchTitle"),
          body: t("stationSearchDescription"),
        },
        {
          key: "insights",
          href: "/insights",
          eyebrow: t("chargingInsightsEyebrow"),
          title: t("chargingInsightsTitle"),
          body: t("chargingInsightsDescription"),
        },
        {
          key: "vehicles",
          href: "/vehicles",
          eyebrow: t("evCatalogEyebrow"),
          title: t("evCatalogTitle"),
          body: t("chargingCardDescription"),
        },
      ],
    },
    analysis: {
      title: t("infrastructureIntelligenceTitle"),
      subtitle: t("infrastructureIntelligenceSubtitle"),
      items: [
        { key: "coverage", href: "/coverage", title: t("coverageAnalysisTitle"), body: t("coverageAnalysisHelper") },
        { key: "operators", href: "/operators", title: t("operatorComparisonTitle"), body: t("operatorComparisonHelper") },
        { key: "provinces", href: "/provinces", title: t("provinceBreakdownTitle"), body: t("provinceBreakdownHelper") },
        { key: "trends", href: "/trends", title: t("trendsAnalysisTitle"), body: t("trendsAnalysisHelper") },
      ],
    },
    b2b: {
      title: t("b2bCtaTitle"),
      body: t("b2bCtaBody"),
      cta: { href: "/contact", label: t("b2bCtaButton") },
    },
    operators: {
      title: t("forOperatorsTitle"),
      subtitle: t("forOperatorsSubtitle"),
      items: [
        { key: "reports", href: "/reports", title: t("reportsTitle"), body: t("reportsHelper") },
        { key: "featured", href: "/operator-featured", title: t("promoteStationTitle"), body: t("promoteStationHelper") },
        { key: "contact", href: "/contact", title: t("operatorContactTitle"), body: t("operatorContactHelper") },
      ],
    },
    stationMap: home.stationMap,
    insights: {
      ...home.insights,
      labels: {
        provinces: t("provinceBreakdownTitle"),
        connectors: tNav("connectors"),
        operators: tNav("operators"),
        stations: t("statStations"),
      },
    },
  };
};
