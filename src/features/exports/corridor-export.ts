import type { CorridorAnalysis } from "@/features/corridors/gap-detection";
import type { ExportColumn } from "@/features/exports/table-export";

export type CorridorGapExportRow = {
  corridorId: string;
  corridorName: string;
  fromLabel: string;
  toLabel: string;
  segmentLengthKm: number;
  nearestHpcDistanceKm: number | null;
  hasGap: boolean;
};

export const toCorridorGapExportRows = (
  analyses: CorridorAnalysis[],
): CorridorGapExportRow[] =>
  analyses.flatMap((analysis) =>
    analysis.segments.map((segment) => ({
      corridorId: analysis.id,
      corridorName: analysis.name,
      fromLabel: segment.fromLabel,
      toLabel: segment.toLabel,
      segmentLengthKm: segment.segmentLengthKm,
      nearestHpcDistanceKm: segment.nearestHpcDistanceKm,
      hasGap: segment.hasGap,
    })),
  );

const formatKm = (value: number) => value.toFixed(1);
const formatNullableKm = (value: number | null) =>
  value === null ? "" : value.toFixed(1);

export const corridorGapExportColumns: ExportColumn<CorridorGapExportRow>[] = [
  { key: "corridorId", header: "Corridor ID", field: "corridor_id" },
  { key: "corridorName", header: "Corridor", field: "corridor_name" },
  { key: "fromLabel", header: "From", field: "from" },
  { key: "toLabel", header: "To", field: "to" },
  {
    key: "segmentLengthKm",
    header: "Segment length (km)",
    field: "segment_length_km",
    format: formatKm,
  },
  {
    key: "nearestHpcDistanceKm",
    header: "Nearest HPC distance (km)",
    field: "nearest_hpc_distance_km",
    format: formatNullableKm,
  },
  {
    key: "hasGap",
    header: "Has gap",
    field: "has_gap",
    format: (value) => (value ? "true" : "false"),
  },
];
