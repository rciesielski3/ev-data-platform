import type {
  StationCompletenessScore,
  StationFreshness,
} from "@/features/charging/data-quality";

const FRESHNESS_LABEL: Record<StationFreshness["bucket"], string> = {
  fresh: "Fresh",
  stale: "Stale",
  unknown: "Unknown",
};

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

export const formatFreshnessAge = (freshness: StationFreshness) => {
  if (freshness.bucket === "unknown" || freshness.ageDays === null) {
    return "Age unknown";
  }

  return freshness.ageDays === 0
    ? "Updated today"
    : `${freshness.ageDays} day${freshness.ageDays === 1 ? "" : "s"} old`;
};

export const StationFreshnessIndicator = ({
  freshness,
  className,
}: {
  freshness: StationFreshness;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-medium ${FRESHNESS_TEXT_CLASS[freshness.bucket]} ${className ?? ""}`}
  >
    <span
      aria-hidden
      className={`h-2 w-2 rounded-full ${FRESHNESS_DOT_CLASS[freshness.bucket]}`}
    />
    {FRESHNESS_LABEL[freshness.bucket]}
    {" / "}
    {formatFreshnessAge(freshness)}
  </span>
);

export const StationCompletenessBadge = ({
  completeness,
  className,
}: {
  completeness: StationCompletenessScore;
  className?: string;
}) => (
  <span className={`badge ${className ?? ""}`}>
    {completeness.scorePercent}% complete
  </span>
);
