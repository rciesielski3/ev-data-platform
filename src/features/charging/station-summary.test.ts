import { describe, expect, it } from "vitest";

import {
  buildLastVerifiedNote,
  buildStationSummaryParts,
  type StationSummaryInput,
} from "@/features/charging/station-summary";

const fullStation: StationSummaryInput = {
  operatorName: "GreenWay Polska",
  city: "Warszawa",
  connectorTypes: ["CCS2"],
  maxPowerKw: 150,
};

describe("buildStationSummaryParts", () => {
  it("describes a station with full data", () => {
    expect(buildStationSummaryParts(fullStation)).toEqual({
      hasOperator: true,
      operatorLabel: "GreenWay Polska",
      city: "Warszawa",
      connectorLabels: ["CCS2"],
      powerLabel: "150 kW",
    });
  });

  it("flags a missing operator instead of inventing one", () => {
    const parts = buildStationSummaryParts({
      ...fullStation,
      operatorName: null,
    });

    expect(parts.hasOperator).toBe(false);
    expect(parts.operatorLabel).toBe("Unknown operator");
  });

  it("returns an empty connector list when none are known", () => {
    expect(
      buildStationSummaryParts({ ...fullStation, connectorTypes: [] })
        .connectorLabels,
    ).toEqual([]);
  });

  it("returns a null power label when power is unknown", () => {
    expect(
      buildStationSummaryParts({ ...fullStation, maxPowerKw: null }).powerLabel,
    ).toBeNull();
  });

  it("returns null city when missing or blank", () => {
    expect(buildStationSummaryParts({ ...fullStation, city: null }).city).toBeNull();
    expect(buildStationSummaryParts({ ...fullStation, city: "   " }).city).toBeNull();
  });

  it("filters out Unknown connector types while keeping known ones", () => {
    expect(
      buildStationSummaryParts({
        ...fullStation,
        connectorTypes: ["CCS2", "some-unrecognized-type"],
      }).connectorLabels,
    ).toEqual(["CCS2"]);
  });

  it("de-duplicates repeated connector types and preserves formatted labels", () => {
    expect(
      buildStationSummaryParts({
        ...fullStation,
        connectorTypes: ["CCS2", "Type2", "CCS2"],
      }).connectorLabels,
    ).toEqual(["CCS2", "Type 2"]);
  });

  it("produces all-empty parts when everything is missing", () => {
    expect(
      buildStationSummaryParts({
        operatorName: null,
        city: null,
        connectorTypes: [],
        maxPowerKw: null,
      }),
    ).toEqual({
      hasOperator: false,
      operatorLabel: "Unknown operator",
      city: null,
      connectorLabels: [],
      powerLabel: null,
    });
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
