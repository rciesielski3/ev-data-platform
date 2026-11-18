export const formatRelativeTime = (
  value: Date | string | null,
  locale: string,
  fallback: string,
  now: number = Date.now(),
) => {
  if (!value) return fallback;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return fallback;

  const minutes = Math.floor(Math.max(0, now - time) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (minutes < 1) return formatter.format(0, "second");
  if (minutes < 60) return formatter.format(-minutes, "minute");
  if (minutes < 60 * 24) return formatter.format(-Math.floor(minutes / 60), "hour");
  return formatter.format(-Math.floor(minutes / (60 * 24)), "day");
};
