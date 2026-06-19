const displayDateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export const formatDisplayDate = (value: Date | null | undefined) => {
  if (!value) {
    return "unknown";
  }

  return displayDateFormatter.format(value);
};

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
