type ChargePointConnector = {
  sourcePointId: string | null;
  chargingMode: string | null;
  connectorType: string;
};

type ChargePointTotals = {
  total: number;
  ac: number;
  dc: number;
};

const EIPA_DC_CHARGING_MODE = "7";
const DC_CONNECTOR_TYPES = new Set(["ccs2", "chademo"]);

const isDcConnector = (connector: ChargePointConnector) =>
  connector.chargingMode === EIPA_DC_CHARGING_MODE ||
  DC_CONNECTOR_TYPES.has(connector.connectorType);

export const buildChargePointTotals = (
  connectors: ChargePointConnector[],
): ChargePointTotals => {
  const isDcByPoint = new Map<string, boolean>();

  for (const connector of connectors) {
    if (!connector.sourcePointId) continue;
    const isDc =
      (isDcByPoint.get(connector.sourcePointId) ?? false) ||
      isDcConnector(connector);
    isDcByPoint.set(connector.sourcePointId, isDc);
  }

  const dc = [...isDcByPoint.values()].filter(Boolean).length;

  return { total: isDcByPoint.size, ac: isDcByPoint.size - dc, dc };
};

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

export const readChargePointTotals = (
  precomputedStats: unknown,
): ChargePointTotals | null => {
  if (typeof precomputedStats !== "object" || precomputedStats === null) {
    return null;
  }

  const candidate = (precomputedStats as { chargePoints?: unknown }).chargePoints;
  if (typeof candidate !== "object" || candidate === null) return null;

  const { total, ac, dc } = candidate as Record<string, unknown>;
  if (!isCount(total) || !isCount(ac) || !isCount(dc) || total === 0) {
    return null;
  }

  return { total, ac, dc };
};
