import { getTranslations } from "next-intl/server";

import type {
  StationCompletenessScore,
  StationFreshness,
} from "@/features/charging/data-quality";

const FRESHNESS_DOT_CLASS: Record<StationFreshness["bucket"], string> = {
  fresh: "bg-emerald-500",
  stale: "bg-amber-500",
  unknown: "bg-slate-400",
};

const FRESHNESS_TEXT_CLASS: Record<StationFreshness["bucket"], string> = {
  fresh: "text-emerald-700",
  stale: "text-amber-700",
  unknown: "text-slate-500",
};

export const formatFreshnessAge = (
  freshness: StationFreshness,
  t: Awaited<ReturnType<typeof getTranslations<"stationQuality">>>,
) => {
  if (freshness.bucket === "unknown" || freshness.ageDays === null) {
    return t("ageUnknown");
  }

  return freshness.ageDays === 0
    ? t("updatedToday")
    : t("daysOld", { count: freshness.ageDays });
};

export const StationFreshnessIndicator = async ({
  freshness,
  className,
}: {
  freshness: StationFreshness;
  className?: string;
}) => {
  const t = await getTranslations("stationQuality");
  const freshnessLabel = {
    fresh: t("freshLabel"),
    stale: t("staleLabel"),
    unknown: t("unknownLabel"),
  }[freshness.bucket];
  const freshnessExplanation = {
    fresh: t("freshExplanation", { days: freshness.staleAfterDays }),
    stale: t("staleExplanation", { days: freshness.staleAfterDays }),
    unknown: t("unknownExplanation"),
  }[freshness.bucket];

  return (
    <span
      title={freshnessExplanation}
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${FRESHNESS_TEXT_CLASS[freshness.bucket]} ${className ?? ""}`}
    >
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${FRESHNESS_DOT_CLASS[freshness.bucket]}`}
      />
      {freshnessLabel}
      {" / "}
      {formatFreshnessAge(freshness, t)}
    </span>
  );
};

export const StationCompletenessBadge = async ({
  completeness,
  className,
}: {
  completeness: StationCompletenessScore;
  className?: string;
}) => {
  const t = await getTranslations("stationQuality");

  return (
    <span className={`badge ${className ?? ""}`}>
      {t("completePercent", { percent: completeness.scorePercent })}
    </span>
  );
};
