import { IngestionStatus } from "@prisma/client";

export const MIN_PRUNE_FETCH_RATIO = 0.9;
export const MIN_PRUNE_FETCH_COUNT = 1000;

type PruneDecisionInput = {
  importLimit: number | null;
  status: IngestionStatus;
  fetchedCount: number;
  previousFetchedCount: number | null;
};

export const getPruneSkipReason = ({
  importLimit,
  status,
  fetchedCount,
  previousFetchedCount,
}: PruneDecisionInput): string | null => {
  if (importLimit) {
    return `import limit ${importLimit} is set`;
  }
  if (status === IngestionStatus.FAILED) {
    return "import failed";
  }
  if (fetchedCount < MIN_PRUNE_FETCH_COUNT) {
    return `fetched ${fetchedCount} stations, below the minimum of ${MIN_PRUNE_FETCH_COUNT}`;
  }
  if (
    previousFetchedCount !== null &&
    fetchedCount < previousFetchedCount * MIN_PRUNE_FETCH_RATIO
  ) {
    return `fetched ${fetchedCount} stations, below ${MIN_PRUNE_FETCH_RATIO * 100}% of the previous import's ${previousFetchedCount}`;
  }
  return null;
};

export const getStaleStationIds = (
  existing: Array<{ id: string; sourceRecordId: string }>,
  fetchedSourceRecordIds: Iterable<string>,
): string[] => {
  const fetched = new Set(fetchedSourceRecordIds);
  return existing
    .filter((station) => !fetched.has(station.sourceRecordId))
    .map((station) => station.id);
};

export const isPruneDryRun = () => process.env.EIPA_PRUNE_DRY_RUN === "1";
