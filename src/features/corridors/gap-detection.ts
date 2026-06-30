import { HPC_POWER_KW } from "@/features/charging/province-intelligence";
import type {
  CorridorDefinition,
  CorridorSegment,
  CorridorWaypoint,
} from "@/features/corridors/corridor-definitions";

/** Rough km-per-degree conversion for Poland's latitude band; not geodesically precise. */
const KM_PER_DEGREE = 111;

/** Segments longer than this are flagged as a charging gap. */
export const GAP_THRESHOLD_KM = 60;

/** Stations farther than this from a waypoint are not considered nearby. */
export const NEAREST_HPC_SEARCH_RADIUS_KM = 100;

export type CorridorStationInput = {
  latitude: number;
  longitude: number;
  connectors: { powerKw?: number | null }[];
};

export type NearestHpcResult = {
  distanceKm: number;
  station: CorridorStationInput;
} | null;

export type SegmentGap = {
  fromLabel: string;
  toLabel: string;
  segmentLengthKm: number;
  nearestHpcDistanceKm: number | null;
  hasGap: boolean;
};

export type CorridorAnalysis = {
  id: string;
  name: string;
  segments: SegmentGap[];
  gapCount: number;
  /** Share of segments without a charging gap, 0 when the corridor has no segments. */
  complianceScore: number;
};

const haversineApproxKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const dLat = (a.latitude - b.latitude) * KM_PER_DEGREE;
  const dLng =
    (a.longitude - b.longitude) *
    KM_PER_DEGREE *
    Math.cos(((a.latitude + b.latitude) / 2) * (Math.PI / 180));

  return Math.sqrt(dLat * dLat + dLng * dLng);
};

const stationHasHpcConnector = (station: CorridorStationInput): boolean =>
  station.connectors.some(
    (connector) =>
      connector.powerKw !== null &&
      connector.powerKw !== undefined &&
      connector.powerKw >= HPC_POWER_KW,
  );

/**
 * Finds the closest HPC (150 kW+) station to a waypoint within
 * `NEAREST_HPC_SEARCH_RADIUS_KM`, using straight-line distance.
 */
export const findNearestHpc = (
  waypoint: CorridorWaypoint,
  stations: CorridorStationInput[],
): NearestHpcResult => {
  let best: NearestHpcResult = null;

  for (const station of stations) {
    if (!stationHasHpcConnector(station)) {
      continue;
    }

    const distanceKm = haversineApproxKm(waypoint, station);

    if (distanceKm > NEAREST_HPC_SEARCH_RADIUS_KM) {
      continue;
    }

    if (best === null || distanceKm < best.distanceKm) {
      best = { distanceKm, station };
    }
  }

  return best;
};

/**
 * A segment has a charging gap when it is longer than the gap threshold and
 * the nearest HPC station to its endpoint is missing, or itself farther away
 * than the threshold.
 */
export const detectGap = (
  segment: CorridorSegment,
  nearestHpc: NearestHpcResult,
): boolean => {
  const segmentLengthKm = haversineApproxKm(segment.from, segment.to);

  if (segmentLengthKm <= GAP_THRESHOLD_KM) {
    return false;
  }

  if (nearestHpc === null) {
    return true;
  }

  return nearestHpc.distanceKm > GAP_THRESHOLD_KM;
};

const buildSegmentGap = (
  segment: CorridorSegment,
  stations: CorridorStationInput[],
): SegmentGap => {
  const nearestHpc = findNearestHpc(segment.to, stations);
  const segmentLengthKm = haversineApproxKm(segment.from, segment.to);

  return {
    fromLabel: segment.from.label,
    toLabel: segment.to.label,
    segmentLengthKm,
    nearestHpcDistanceKm: nearestHpc === null ? null : nearestHpc.distanceKm,
    hasGap: detectGap(segment, nearestHpc),
  };
};

/**
 * Builds the full gap analysis for a corridor: per-segment gap flags plus a
 * compliance score (share of segments without a gap).
 */
export const buildCorridorAnalysis = (
  corridor: CorridorDefinition,
  stations: CorridorStationInput[],
): CorridorAnalysis => {
  const segments = corridor.segments.map((segment) =>
    buildSegmentGap(segment, stations),
  );
  const gapCount = segments.filter((segment) => segment.hasGap).length;

  return {
    id: corridor.id,
    name: corridor.name,
    segments,
    gapCount,
    complianceScore:
      segments.length === 0 ? 0 : (segments.length - gapCount) / segments.length,
  };
};

export const buildAllCorridorAnalyses = (
  corridors: CorridorDefinition[],
  stations: CorridorStationInput[],
): CorridorAnalysis[] =>
  corridors.map((corridor) => buildCorridorAnalysis(corridor, stations));
