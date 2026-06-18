import { RangeStandard } from "@prisma/client";

export type OpenEvVehicle = {
  unique_code: string;
  make: { slug: string; name: string };
  model: { slug: string; name: string };
  trim?: { slug: string; name: string };
  variant?: { slug: string; name: string; kind?: string };
  year?: number;
  vehicle_type?: string;
  battery?: {
    pack_capacity_kwh_net?: number;
    pack_capacity_kwh_gross?: number;
  };
  charge_ports?: Array<{ connector?: string; kind?: string }>;
  charging?: {
    ac?: { max_power_kw?: number };
    dc?: { max_power_kw?: number };
  };
  range?: {
    rated?: Array<{ cycle?: string; range_km?: number }>;
  };
  powertrain?: {
    drivetrain?: string;
    system_power_kw?: number;
  };
  sources?: Array<{ url?: string; title?: string }>;
};

export type OpenEvDataset = {
  version?: string;
  generated_at?: string;
  vehicles: OpenEvVehicle[];
};

export type NormalizedEvModel = {
  sourceRecordId: string;
  brandSlug: string;
  brandName: string;
  modelName: string;
  trimName: string | null;
  variantName: string | null;
  year: number | null;
  vehicleType: string | null;
  sourceUrl: string | null;
  specs: {
    batteryCapacityKwhNet: number | null;
    batteryCapacityKwhGross: number | null;
    rangeWltpKm: number | null;
    rangeEpaKm: number | null;
    rangeStandard: RangeStandard;
    acMaxPowerKw: number | null;
    dcMaxPowerKw: number | null;
    primaryConnector: string | null;
    drivetrain: string | null;
    systemPowerKw: number | null;
  };
  rawPayload: Record<string, unknown>;
};
