import { getConnectorCurrentType } from "@/features/charging/connectors";
import type { StationMapDto } from "@/features/charging/station-map";

export type StationPowerClass = "hpc" | "dc" | "ac" | "unknown";

export const STATION_POWER_CLASSES: StationPowerClass[] = [
  "hpc",
  "dc",
  "ac",
  "unknown",
];

const HPC_MIN_POWER_KW = 150;
const AC_MAX_POWER_KW = 22;

type PowerFields = Pick<StationMapDto, "maxPowerKw" | "connectorLabels">;

export const classifyStationPower = ({
  maxPowerKw,
  connectorLabels,
}: PowerFields): StationPowerClass => {
  if (maxPowerKw !== null && maxPowerKw >= HPC_MIN_POWER_KW) {
    return "hpc";
  }

  const currentTypes = connectorLabels.map(getConnectorCurrentType);

  if (currentTypes.includes("DC")) {
    return "dc";
  }

  if (currentTypes.includes("AC")) {
    return "ac";
  }

  if (maxPowerKw === null) {
    return "unknown";
  }

  return maxPowerKw > AC_MAX_POWER_KW ? "dc" : "ac";
};

export const classifyGroupPower = (
  group: { stations: PowerFields[] },
): StationPowerClass =>
  STATION_POWER_CLASSES.find((powerClass) =>
    group.stations.some(
      (station) => classifyStationPower(station) === powerClass,
    ),
  ) ?? "unknown";
