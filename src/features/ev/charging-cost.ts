// PLN/kWh bands as of mid-2026: AC public/home tariffs commonly span ~0.99-1.92 zl/kWh,
// DC fast/rapid tariffs span ~1.49-3.59 zl/kWh across Polish CPOs (GreenWay, EkoEn, ChargeEuropa).
// Ranges are intentionally wide rather than a single average, since per-operator pricing varies.
const AC_TARIFF_PLN_PER_KWH: [number, number] = [0.8, 1.9];
const DC_TARIFF_PLN_PER_KWH: [number, number] = [2.0, 3.5];

// Real-world cold-weather range loss is widely reported in the 10-40% band depending on
// temperature and driving conditions; 15-30% is the commonly cited "typical winter" range.
const WINTER_RANGE_DERATING = [0.15, 0.3] as const;

const roundToWholePln = (value: number) => Math.round(value);

export type ChargingCostEstimate = {
  acCostRangePln: [number, number] | null;
  dcCostRangePln: [number, number] | null;
};

export const buildChargingCostEstimate = (
  batteryCapacityKwhNet: number | null,
): ChargingCostEstimate | null => {
  if (batteryCapacityKwhNet === null || !Number.isFinite(batteryCapacityKwhNet)) {
    return null;
  }

  if (batteryCapacityKwhNet <= 0) {
    return null;
  }

  const toRange = ([low, high]: [number, number]): [number, number] => [
    roundToWholePln(batteryCapacityKwhNet * low),
    roundToWholePln(batteryCapacityKwhNet * high),
  ];

  return {
    acCostRangePln: toRange(AC_TARIFF_PLN_PER_KWH),
    dcCostRangePln: toRange(DC_TARIFF_PLN_PER_KWH),
  };
};

export type WinterRangeNote = {
  lowKm: number;
  highKm: number;
};

export const buildWinterRangeNote = (
  rangeWltpKm: number | null,
): WinterRangeNote | null => {
  if (rangeWltpKm === null || !Number.isFinite(rangeWltpKm) || rangeWltpKm <= 0) {
    return null;
  }

  const [minDerating, maxDerating] = WINTER_RANGE_DERATING;

  return {
    lowKm: Math.round(rangeWltpKm * (1 - maxDerating)),
    highKm: Math.round(rangeWltpKm * (1 - minDerating)),
  };
};
