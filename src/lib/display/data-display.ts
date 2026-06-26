export const formatDisplayDate = (
  value: Date | string | null | undefined,
  locale = "en",
) => {
  if (!value) {
    return "unknown";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export const formatDisplayNumber = (value: number, locale: string = "en") =>
  new Intl.NumberFormat(locale).format(value);

export const getSafeHttpUrl = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};
