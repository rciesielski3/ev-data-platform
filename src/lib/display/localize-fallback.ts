const FALLBACK_TRANSLATION_KEYS: Record<string, string> = {
  Unknown: "unknown",
  unknown: "unknown",
  "N/A": "notAvailable",
  "Unknown operator": "unknownOperator",
  "Unknown connector": "unknownConnector",
  "Unknown province": "unknownProvince",
  "Charging station": "chargingStationFallback",
  "Location details unavailable": "locationUnavailable",
  "Location unavailable": "locationUnavailable",
};

export const localizeFallback = (
  value: string,
  tCommon: (key: string) => string,
): string => {
  const key = FALLBACK_TRANSLATION_KEYS[value];
  return key ? tCommon(key) : value;
};
