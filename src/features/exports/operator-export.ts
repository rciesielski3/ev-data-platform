import type { OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import type { ExportColumn } from "@/features/exports/table-export";

const formatNullableNumber = (value: number | null) =>
  value === null ? "" : String(value);

const formatNullableText = (value: string | null) => value ?? "";

/**
 * Stable column definitions for exporting operator comparison rows. Field
 * names are explicit and decoupled from `OperatorIntelligenceRow`'s internal
 * property names so the exported schema stays stable even if the DTO
 * changes shape.
 */
export const operatorExportColumns: ExportColumn<OperatorIntelligenceRow>[] = [
  { key: "operatorName", header: "Operator", field: "operator_name" },
  { key: "stationCount", header: "Stations", field: "station_count" },
  { key: "provinceCount", header: "Provinces", field: "province_count" },
  { key: "connectorCount", header: "Connectors", field: "connector_count" },
  {
    key: "knownPowerConnectorCount",
    header: "Known power connectors",
    field: "known_power_connector_count",
  },
  {
    key: "averagePowerKw",
    header: "Average power (kW)",
    field: "average_power_kw",
    format: formatNullableNumber,
  },
  {
    key: "maxPowerKw",
    header: "Max power (kW)",
    field: "max_power_kw",
    format: formatNullableNumber,
  },
  {
    key: "strongestStationName",
    header: "Strongest station",
    field: "strongest_station_name",
    format: formatNullableText,
  },
];
