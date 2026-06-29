import {
  buildProvinceIntelligenceRows,
  type ProvinceIntelligenceRow,
  type ProvinceIntelligenceStationInput,
} from "@/features/charging/province-intelligence";

export const DEFAULT_COVERAGE_LIST_SIZE = 5;

export type CoverageRankingRow = {
  province: string;
  stationCount: number;
  hpcStationCount: number;
  hpcShare: number;
  connectorCount: number;
  knownPowerConnectorCount: number;
  powerAvailabilityRatio: number;
  stationsPer100k: number | null;
};

export type CoverageAnalysis = {
  /** Provinces with the fewest stations, ascending by station count. */
  lowestStationCountProvinces: CoverageRankingRow[];
  /** Provinces with the lowest share of HPC (>=150 kW) stations, ascending. */
  lowestHpcCoverageProvinces: CoverageRankingRow[];
  /** Provinces with the most stations, descending by station count. */
  highestStationCountProvinces: CoverageRankingRow[];
  /** Provinces with the lowest per-capita station coverage (stations per 100k), ascending. */
  lowestPerCapitaCoverageProvinces: CoverageRankingRow[];
  /** All province rows ordered for table display (descending station count). */
  provinceRows: CoverageRankingRow[];
  totals: {
    provinceCount: number;
    stationCount: number;
    connectorCount: number;
    knownPowerConnectorCount: number;
    hpcStationCount: number;
    /** known-power connectors / total connectors, network-wide. 0 when there are no connectors. */
    connectorPowerAvailabilityRatio: number;
  };
  isEmpty: boolean;
};

const safeRatio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0;

const toCoverageRankingRow = (row: ProvinceIntelligenceRow): CoverageRankingRow => ({
  province: row.province,
  stationCount: row.stationCount,
  hpcStationCount: row.hpcStationCount,
  hpcShare: safeRatio(row.hpcStationCount, row.stationCount),
  connectorCount: row.connectorCount,
  knownPowerConnectorCount: row.knownPowerConnectorCount,
  powerAvailabilityRatio: safeRatio(
    row.knownPowerConnectorCount,
    row.connectorCount,
  ),
  stationsPer100k: row.stationsPer100k,
});

const compareByLabel = (left: string, right: string) =>
  left.localeCompare(right, "en", { sensitivity: "base" });

const ascendingByStationCount = (
  left: CoverageRankingRow,
  right: CoverageRankingRow,
) => left.stationCount - right.stationCount || compareByLabel(left.province, right.province);

const descendingByStationCount = (
  left: CoverageRankingRow,
  right: CoverageRankingRow,
) => right.stationCount - left.stationCount || compareByLabel(left.province, right.province);

const ascendingByHpcShare = (
  left: CoverageRankingRow,
  right: CoverageRankingRow,
) =>
  left.hpcShare - right.hpcShare ||
  left.stationCount - right.stationCount ||
  compareByLabel(left.province, right.province);

const ascendingByPerCapitaCoverage = (
  left: CoverageRankingRow,
  right: CoverageRankingRow,
) => {
  if (left.stationsPer100k === null || right.stationsPer100k === null) {
    return 0;
  }

  return (
    left.stationsPer100k - right.stationsPer100k ||
    compareByLabel(left.province, right.province)
  );
};

/**
 * Builds infrastructure coverage rankings (underserved vs. saturated provinces)
 * directly from pre-aggregated province intelligence rows.
 *
 * This is descriptive infrastructure analysis only: it reports where stations,
 * HPC stations and known-power connectors are concentrated today. It is not a
 * demand forecast, does not perform route planning.
 * It includes per-capita view normalized against static, GUS-derived population/area figures (see `province-population.ts`).
 */
export const buildCoverageAnalysisFromRows = (
  rows: ProvinceIntelligenceRow[],
  listSize: number = DEFAULT_COVERAGE_LIST_SIZE,
): CoverageAnalysis => {
  const rankingRows = rows.map(toCoverageRankingRow);

  const provinceRows = [...rankingRows].sort(descendingByStationCount);
  const lowestStationCountProvinces = [...rankingRows]
    .sort(ascendingByStationCount)
    .slice(0, listSize);
  const highestStationCountProvinces = [...rankingRows]
    .sort(descendingByStationCount)
    .slice(0, listSize);
  const lowestHpcCoverageProvinces = [...rankingRows]
    .sort(ascendingByHpcShare)
    .slice(0, listSize);
  const lowestPerCapitaCoverageProvinces = [...rankingRows]
    .filter((row) => row.stationsPer100k !== null)
    .sort(ascendingByPerCapitaCoverage)
    .slice(0, listSize);

  const totals = rows.reduce(
    (accumulator, row) => ({
      provinceCount: accumulator.provinceCount + 1,
      stationCount: accumulator.stationCount + row.stationCount,
      connectorCount: accumulator.connectorCount + row.connectorCount,
      knownPowerConnectorCount:
        accumulator.knownPowerConnectorCount + row.knownPowerConnectorCount,
      hpcStationCount: accumulator.hpcStationCount + row.hpcStationCount,
    }),
    {
      provinceCount: 0,
      stationCount: 0,
      connectorCount: 0,
      knownPowerConnectorCount: 0,
      hpcStationCount: 0,
    },
  );

  return {
    lowestStationCountProvinces,
    lowestHpcCoverageProvinces,
    highestStationCountProvinces,
    lowestPerCapitaCoverageProvinces,
    provinceRows,
    totals: {
      ...totals,
      connectorPowerAvailabilityRatio: safeRatio(
        totals.knownPowerConnectorCount,
        totals.connectorCount,
      ),
    },
    isEmpty: totals.stationCount === 0,
  };
};

/**
 * Convenience wrapper that builds province intelligence rows from raw
 * station input and derives the coverage analysis from them. Prefer
 * `buildCoverageAnalysisFromRows` when province rows are already available
 * (e.g. shared with another page) to avoid re-aggregating station data.
 */
export const buildCoverageAnalysis = (
  stations: ProvinceIntelligenceStationInput[],
  listSize: number = DEFAULT_COVERAGE_LIST_SIZE,
): CoverageAnalysis =>
  buildCoverageAnalysisFromRows(buildProvinceIntelligenceRows(stations), listSize);
