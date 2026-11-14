import type { StationSummaryParts } from "@/features/charging/station-summary";

type Translate = (key: string, params?: Record<string, string | number>) => string;

export const pickReadableStationName = (
  candidates: Array<string | null | undefined>,
): string | null =>
  candidates
    .map((value) => value?.trim() ?? "")
    .find((value) => /\p{L}/u.test(value)) ?? null;

export const buildStationMetaTitle = (
  parts: StationSummaryParts,
  readableName: string | null,
  t: Translate,
): string => {
  const subject =
    readableName ??
    (parts.hasOperator
      ? t("metaTitleOperator", { operator: parts.operatorLabel })
      : t("metaTitleGeneric"));

  if (parts.city && parts.powerLabel) {
    return t("metaTitleWithPower", {
      name: subject,
      city: parts.city,
      power: parts.powerLabel,
    });
  }

  if (parts.city) {
    return t("metaTitle", { name: subject, city: parts.city });
  }

  if (parts.powerLabel) {
    return t("metaTitleFallbackWithPower", {
      name: subject,
      power: parts.powerLabel,
    });
  }

  return t("metaTitleFallback", { name: subject });
};
