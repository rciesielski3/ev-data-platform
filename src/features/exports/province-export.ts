import type { ProvinceIntelligenceRow } from "@/features/charging/province-intelligence";
import type { ExportColumn } from "@/features/exports/table-export";

const formatNullableNumber = (value: number | null) =>
  value === null ? "" : String(value);

/**
 * Stable column definitions for exporting province comparison rows. Field
 * names are explicit and decoupled from `ProvinceIntelligenceRow`'s internal
 * property names so the exported schema stays stable even if the DTO
 * changes shape.
 */
export const provinceExportColumns: ExportColumn<ProvinceIntelligenceRow>[] = [
  { key: "province", header: "Province", field: "province" },
  { key: "stationCount", header: "Stations", field: "station_count" },
  { key: "connectorCount", header: "Connectors", field: "connector_count" },
  {
    key: "knownPowerConnectorCount",
    header: "Known power connectors",
    field: "known_power_connector_count",
  },
  {
    key: "hpcStationCount",
    header: "HPC stations",
    field: "hpc_station_count",
  },
  {
    key: "maxPowerKw",
    header: "Max power (kW)",
    field: "max_power_kw",
    format: formatNullableNumber,
  },
  {
    key: "averagePowerKw",
    header: "Average power (kW)",
    field: "average_power_kw",
    format: formatNullableNumber,
  },
  { key: "operatorCount", header: "Operators", field: "operator_count" },
];
