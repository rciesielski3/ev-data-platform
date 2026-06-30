export const DEFAULT_SNAPSHOT_RETENTION_DAYS = 90;

export const getSnapshotRetentionDays = (): number => {
  const value = Number(process.env.SNAPSHOT_RETENTION_DAYS ?? "");
  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_SNAPSHOT_RETENTION_DAYS;
};

export const getRetentionCutoffDate = (
  retentionDays: number,
  now: Date = new Date(),
): Date => new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
