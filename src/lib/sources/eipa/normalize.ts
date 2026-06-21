import {
  buildAddress,
  mapEipaInterfaceIds,
  normalizeOperatorName,
} from "@/lib/normalizers/charging";
import type {
  EipaDynamicPoint,
  EipaOperator,
  EipaPoint,
  EipaPool,
  EipaStation,
  NormalizedChargingConnector,
  NormalizedChargingStation,
} from "@/lib/sources/eipa/types";

const parseDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeConnectors = (
  points: EipaPoint[],
  dynamicByPointId: Map<number, EipaDynamicPoint>,
): NormalizedChargingConnector[] => {
  const connectors: NormalizedChargingConnector[] = [];

  for (const point of points) {
    for (const connector of point.connectors) {
      const connectorTypes = mapEipaInterfaceIds(connector.interfaces);

      for (const connectorType of connectorTypes) {
        connectors.push({
          connectorType,
          powerKw: Number.isFinite(connector.power) ? connector.power : null,
          cableAttached: connector.cable_attached ?? null,
          chargingMode: point.charging_solutions[0]
            ? String(point.charging_solutions[0].mode)
            : null,
          sourcePointId: String(point.id),
          sourceInterfaceIds: connector.interfaces,
        });
      }
    }

    // Keep dynamic metadata attached in raw payload only; no separate table yet.
    if (dynamicByPointId.has(point.id)) {
      continue;
    }
  }

  return connectors;
};

// Guards a field access against malformed API responses: the live EIPA API
// is not guaranteed to return a string for every field (e.g. a record could
// have a number where a string is expected), so we defensively type-check
// before calling .trim(). A malformed field just falls through to the next
// fallback tier instead of throwing and aborting normalization for every
// station in the batch.
const trimIfString = (value: unknown): string | undefined =>
  typeof value === "string" ? value.trim() : undefined;

/**
 * Resolves a human-readable operator name for a pool using a fallback chain:
 *   1. The operator-table record's `name` (or `short_name` if `name` is blank).
 *   2. The `pool.operator_name` field, when present and non-empty (only a
 *      subset of pool records carry this).
 *   3. The synthesized `eipa-operator-<id>` placeholder, as a genuine
 *      last-resort fallback for operator ids we can't resolve at all.
 */
export const resolveEipaOperatorName = (
  operatorId: number,
  pool: Pick<EipaPool, "operator_name"> | undefined,
  operatorsById: Map<number, EipaOperator>,
): string => {
  const operatorRecord = operatorsById.get(operatorId);
  const tableName = trimIfString(operatorRecord?.name);
  const tableShortName = trimIfString(operatorRecord?.short_name);

  if (tableName) {
    return tableName;
  }

  if (tableShortName) {
    return tableShortName;
  }

  const poolOperatorName = trimIfString(pool?.operator_name);
  if (poolOperatorName) {
    return poolOperatorName;
  }

  return normalizeOperatorName(operatorId);
};

export const normalizeEipaStations = (input: {
  pools: EipaPool[];
  stations: EipaStation[];
  points: EipaPoint[];
  dynamicPoints: EipaDynamicPoint[];
  operators: EipaOperator[];
}): NormalizedChargingStation[] => {
  const poolsById = new Map(input.pools.map((pool) => [pool.id, pool]));
  const operatorsById = new Map(
    input.operators.map((operator) => [operator.id, operator]),
  );
  const pointsByStationId = new Map<number, EipaPoint[]>();

  for (const point of input.points) {
    const existing = pointsByStationId.get(point.station_id) ?? [];
    existing.push(point);
    pointsByStationId.set(point.station_id, existing);
  }

  const dynamicByPointId = new Map(
    input.dynamicPoints.map((point) => [point.point_id, point]),
  );

  return input.stations
    .filter((station) => station.type === "E")
    .map((station) => {
      const pool = poolsById.get(station.pool_id);
      const stationPoints = pointsByStationId.get(station.id) ?? [];

      const externalCode =
        stationPoints[0]?.code ?? pool?.code ?? String(station.id);

      return {
        sourceRecordId: String(station.id),
        externalCode,
        name: pool?.name ?? null,
        latitude: station.latitude,
        longitude: station.longitude,
        city: station.location.city ?? pool?.city ?? null,
        province: station.location.province ?? null,
        district: station.location.district ?? null,
        community: station.location.community ?? null,
        address: buildAddress({
          street: pool?.street,
          houseNumber: pool?.house_number,
          postalCode: pool?.postal_code,
          city: pool?.city ?? station.location.city,
        }),
        postalCode: pool?.postal_code ?? null,
        poolSourceId: pool ? String(pool.id) : null,
        stationType: station.type,
        sourceUpdatedAt: parseDate(station.ts),
        operator: pool
          ? {
              sourceRecordId: String(pool.operator_id),
              name: resolveEipaOperatorName(
                pool.operator_id,
                pool,
                operatorsById,
              ),
              // normalizedName stays the stable, technical, ID-derived key
              // (eipa-operator-<id>) -- it must remain unique/stable per
              // operator id regardless of how the human-readable `name` (or
              // its underlying source data) changes over time. Downstream
              // consumers index/group/sort by this field
              // (@@index([normalizedName]) in prisma/schema.prisma) and
              // treat it as a fallback display value behind `name`, so it
              // must not collide across distinct operator ids the way two
              // human-readable names might.
              normalizedName: normalizeOperatorName(pool.operator_id),
            }
          : null,
        connectors: normalizeConnectors(stationPoints, dynamicByPointId),
        rawPayload: {
          station,
          pool,
          points: stationPoints,
          dynamic: stationPoints
            .map((point) => dynamicByPointId.get(point.id))
            .filter(Boolean),
        },
      };
    });
};
