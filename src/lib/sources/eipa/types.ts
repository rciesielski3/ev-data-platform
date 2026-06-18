export type EipaExportEnvelope<T> = {
  data: T[];
  generated: string;
};

export type EipaPool = {
  id: number;
  operator_id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  charging: boolean;
  ts: string;
};

export type EipaStation = {
  id: number;
  pool_id: number;
  latitude: number;
  longitude: number;
  type: string;
  location: {
    city: string;
    community: string;
    district: string;
    province: string;
  };
  ts: string;
};

export type EipaPoint = {
  id: number;
  station_id: number;
  code: string;
  connectors: Array<{
    interfaces: number[];
    cable_attached: boolean;
    power: number;
    ts: string;
  }>;
  charging_solutions: Array<{
    mode: number;
    power: number;
  }>;
  ts: string;
};

export type EipaDynamicPoint = {
  point_id: number;
  code: string;
  status?: {
    availability: number;
    status: number;
    ts: string;
  };
  prices?: Array<{
    literal: string;
    price: string;
    unit: string;
    ts: string;
  }>;
};

export type NormalizedChargingConnector = {
  connectorType: string;
  powerKw: number | null;
  cableAttached: boolean | null;
  chargingMode: string | null;
  sourcePointId: string;
  sourceInterfaceIds: number[];
};

export type NormalizedChargingStation = {
  sourceRecordId: string;
  externalCode: string | null;
  name: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  province: string | null;
  district: string | null;
  community: string | null;
  address: string | null;
  postalCode: string | null;
  poolSourceId: string | null;
  stationType: string | null;
  sourceUpdatedAt: Date | null;
  operator: {
    sourceRecordId: string;
    name: string | null;
    normalizedName: string;
  } | null;
  connectors: NormalizedChargingConnector[];
  rawPayload: Record<string, unknown>;
};
