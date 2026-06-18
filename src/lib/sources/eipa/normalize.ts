import {
  buildAddress,
  mapEipaInterfaceIds,
  normalizeOperatorName,
} from "@/lib/normalizers/charging";
import type {
  EipaDynamicPoint,
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

export const normalizeEipaStations = (input: {
  pools: EipaPool[];
  stations: EipaStation[];
  points: EipaPoint[];
  dynamicPoints: EipaDynamicPoint[];
}): NormalizedChargingStation[] => {
  const poolsById = new Map(input.pools.map((pool) => [pool.id, pool]));
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
              name: normalizeOperatorName(pool.operator_id),
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
