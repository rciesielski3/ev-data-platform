import { describe, expect, it } from "vitest";

import {
  buildLastVerifiedNote,
  buildStationSummarySentence,
  type StationSummaryInput,
} from "@/features/charging/station-summary";

const fullStation: StationSummaryInput = {
  operatorName: "GreenWay Polska",
  city: "Warszawa",
  connectorTypes: ["CCS2"],
  maxPowerKw: 150,
};

describe("buildStationSummarySentence", () => {
  it("describes a station with full data", () => {
    expect(buildStationSummarySentence(fullStation)).toBe(
      "Operated by GreenWay Polska in Warszawa, with CCS2 connectors up to 150 kW.",
    );
  });

  it("omits the operator clause gracefully when missing", () => {
    expect(
      buildStationSummarySentence({ ...fullStation, operatorName: null }),
    ).toBe("This charging station in Warszawa, with CCS2 connectors up to 150 kW.");
  });

  it("omits the connector clause gracefully when missing", () => {
    expect(
      buildStationSummarySentence({ ...fullStation, connectorTypes: [] }),
    ).toBe("Operated by GreenWay Polska in Warszawa, with charging up to 150 kW.");
  });

  it("omits the power figure gracefully when missing", () => {
    expect(
      buildStationSummarySentence({ ...fullStation, maxPowerKw: null }),
    ).toBe("Operated by GreenWay Polska in Warszawa, with CCS2 connectors.");
  });

  it("produces a bare sentence when operator, connectors, and power are all missing", () => {
    expect(
      buildStationSummarySentence({
        operatorName: null,
        city: null,
        connectorTypes: [],
        maxPowerKw: null,
      }),
    ).toBe("This charging station.");
  });

  it("filters out Unknown connector types while keeping known ones", () => {
    expect(
      buildStationSummarySentence({
        ...fullStation,
        connectorTypes: ["CCS2", "some-unrecognized-type"],
      }),
    ).toBe(
      "Operated by GreenWay Polska in Warszawa, with CCS2 connectors up to 150 kW.",
    );
  });

  it("omits the connector clause when every connector type is Unknown", () => {
    expect(
      buildStationSummarySentence({
        ...fullStation,
        connectorTypes: ["some-unrecognized-type", "another-unrecognized-type"],
      }),
    ).toBe("Operated by GreenWay Polska in Warszawa, with charging up to 150 kW.");
  });

  it("lists multiple distinct connector types naturally", () => {
    expect(
      buildStationSummarySentence({
        ...fullStation,
        connectorTypes: ["CCS2", "Type2", "CCS2"],
      }),
    ).toBe(
      "Operated by GreenWay Polska in Warszawa, with CCS2 and Type 2 connectors up to 150 kW.",
    );
  });

  it("generates genuinely different sentences for different stations", () => {
    const stationOne = buildStationSummarySentence(fullStation);
    const stationTwo = buildStationSummarySentence({
      operatorName: "Orlen Charge",
      city: "Krakow",
      connectorTypes: ["Type2"],
      maxPowerKw: 22,
    });

    expect(stationOne).not.toBe(stationTwo);
  });
});

describe("buildLastVerifiedNote", () => {
  it("formats sourceUpdatedAt when present", () => {
    expect(
      buildLastVerifiedNote(new Date("2026-06-12T00:00:00.000Z"), null),
    ).toBe("Data last verified: Jun 12, 2026");
  });

  it("falls back to importedAt when sourceUpdatedAt is missing", () => {
    expect(
      buildLastVerifiedNote(null, new Date("2026-05-01T00:00:00.000Z")),
    ).toBe("Data last verified: May 1, 2026");
  });

  it("falls back to a graceful unknown note when both are missing", () => {
    expect(buildLastVerifiedNote(null, null)).toBe("Data last verified: unknown");
  });
});
