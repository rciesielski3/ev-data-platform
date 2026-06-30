export const toUtcMidnight = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

export const formatUtcDateKey = (date: Date): string =>
  toUtcMidnight(date).toISOString().slice(0, 10);

export const parseUtcDateKey = (dateKey: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const parsed = new Date(`${dateKey}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export type SnapshotDateRange = {
  from: Date | null;
  to: Date | null;
};

export type ParseSnapshotDateRangeResult =
  | { ok: true; range: SnapshotDateRange }
  | { ok: false; error: string };

/**
 * Parses the `from`/`to` query params for the snapshots list endpoint.
 * Both are optional; an empty range means "no bound on that side". Returns
 * an error when a provided value isn't a valid YYYY-MM-DD date, or when
 * `from` is after `to`.
 */
export const parseSnapshotDateRange = (
  fromParam: string | null,
  toParam: string | null,
): ParseSnapshotDateRangeResult => {
  const from = fromParam ? parseUtcDateKey(fromParam) : null;
  if (fromParam && !from) {
    return { ok: false, error: `Invalid "from" date: ${fromParam}` };
  }

  const to = toParam ? parseUtcDateKey(toParam) : null;
  if (toParam && !to) {
    return { ok: false, error: `Invalid "to" date: ${toParam}` };
  }

  if (from && to && from.getTime() > to.getTime()) {
    return { ok: false, error: '"from" must not be after "to"' };
  }

  return { ok: true, range: { from, to } };
};
