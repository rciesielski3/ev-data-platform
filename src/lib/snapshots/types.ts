export interface RegionalCityPrecomputedStats {
  stationCount: number;
  connectorsByType: Record<string, number>; // "Type 2" -> 45, "CCS2" -> 12, etc.
  powerDistribution: {
    under22kw: number;
    between22and150kw: number;
    over150kw: number;
  };
  operatorCount: number;
}

export interface OperatorPrecomputedStats {
  stationCount: number;
  connectorCount: number;
  knownPowerConnectorCount: number;
  maxPowerKw: number | null;
  provinceCount: number;
  averagePowerKw: number | null;
}

export interface ProvincePrecomputedStats {
  stationCount: number;
  operatorCount: number;
  connectorCount: number;
  perCapitaStations: number; // Stations per 100k residents
}

export interface PrecomputedStats {
  computedAt: string; // ISO 8601 timestamp
  regionalCities: Record<string, RegionalCityPrecomputedStats>; // city slug -> stats
  operators: Record<string, OperatorPrecomputedStats>; // normalized operator name -> stats
  provinces: Record<string, ProvincePrecomputedStats>; // province name -> stats
  [key: string]: any; // Index signature for Prisma Json compatibility
}
