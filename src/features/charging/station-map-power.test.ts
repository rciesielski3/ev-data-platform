import { describe, expect, it } from "vitest";

import { getConnectorCurrentType } from "@/features/charging/connectors";
import {
  classifyGroupPower,
  classifyStationPower,
} from "@/features/charging/station-map-power";

const station = (maxPowerKw: number | null, connectorLabels: string[]) => ({
  maxPowerKw,
  connectorLabels,
});

describe("classifyStationPower", () => {
  it("reads current type from the formatted connector labels", () => {
    expect(getConnectorCurrentType("Type 2")).toBe("AC");
    expect(getConnectorCurrentType("CCS2")).toBe("DC");
    expect(getConnectorCurrentType("CHAdeMO")).toBe("DC");
  });

  it("treats 150 kW and above as HPC", () => {
    expect(classifyStationPower(station(150, ["CCS2"]))).toBe("hpc");
    expect(classifyStationPower(station(149.9, ["CCS2"]))).toBe("dc");
  });

  it("treats 150 kW and above as HPC even when the connector type is unknown", () => {
    expect(classifyStationPower(station(200, ["Unknown"]))).toBe("hpc");
  });

  it("uses connector current type when power is missing", () => {
    expect(classifyStationPower(station(null, ["CCS2"]))).toBe("dc");
    expect(classifyStationPower(station(null, ["Type 2"]))).toBe("ac");
  });

  it("prefers DC over AC when a station has both", () => {
    expect(classifyStationPower(station(50, ["Type 2", "CCS2"]))).toBe("dc");
  });

  it("keeps fast AC classified as AC", () => {
    expect(classifyStationPower(station(43, ["Type 2"]))).toBe("ac");
  });

  it("infers current type from power when connector type is unknown", () => {
    expect(classifyStationPower(station(50, ["Unknown"]))).toBe("dc");
    expect(classifyStationPower(station(22, ["Unknown"]))).toBe("ac");
  });

  it("returns unknown when there is neither power nor a known connector type", () => {
    expect(classifyStationPower(station(null, ["Unknown"]))).toBe("unknown");
    expect(classifyStationPower(station(null, []))).toBe("unknown");
  });
});

describe("classifyGroupPower", () => {
  it("uses the best class among the grouped stations", () => {
    expect(
      classifyGroupPower({
        stations: [
          station(22, ["Type 2"]),
          station(180, ["CCS2"]),
          station(50, ["CCS2"]),
        ],
      }),
    ).toBe("hpc");

    expect(
      classifyGroupPower({
        stations: [
          station(null, ["Unknown"]),
          station(11, ["Type 2"]),
        ],
      }),
    ).toBe("ac");
  });

  it("returns unknown for an empty group", () => {
    expect(classifyGroupPower({ stations: [] })).toBe("unknown");
  });
});
