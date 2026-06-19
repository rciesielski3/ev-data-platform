import { describe, expect, it } from "vitest";

import {
  CONNECTOR_KNOWLEDGE_LIST,
  formatConnectorLabel,
  formatPowerKw,
  getConnectorCurrentType,
  getConnectorKnowledge,
} from "@/features/charging/connectors";

describe("getConnectorKnowledge", () => {
  it("returns the Unknown entry for null, empty, and unknown connector values", () => {
    const expectedUnknown = {
      key: "unknown",
      label: "Unknown",
      currentType: "Unknown",
      description: expect.any(String),
      typicalPowerRange: "Unknown",
      supportedRegions: ["Imported source data incomplete"],
      supportedVehicleBrands: ["Unknown"],
      imageLabel: "Connector type unavailable",
    };

    expect(getConnectorKnowledge(null)).toEqual(expectedUnknown);
    expect(getConnectorKnowledge("")).toEqual(expectedUnknown);
    expect(getConnectorKnowledge("   ")).toEqual(expectedUnknown);
    expect(getConnectorKnowledge("NACS")).toEqual(expectedUnknown);
  });

  it("normalizes CCS variants to the CCS2 entry", () => {
    expect(getConnectorKnowledge("ccs2")).toEqual({
      key: "ccs2",
      label: "CCS2",
      currentType: "DC",
      description: expect.stringContaining("fast charging"),
      typicalPowerRange: "50-350 kW DC",
      supportedRegions: ["Europe", "Poland"],
      supportedVehicleBrands: expect.arrayContaining(["Volkswagen", "Hyundai"]),
      imageLabel: "CCS2 DC fast charging connector",
    });
    expect(formatConnectorLabel("CCS2")).toBe("CCS2");
    expect(formatConnectorLabel("CCS")).toBe("CCS2");
    expect(formatConnectorLabel("Combined Charging System 2")).toBe("CCS2");
    expect(getConnectorCurrentType("combo-2")).toBe("DC");
  });

  it("normalizes Type 2 variants to the Type 2 entry", () => {
    expect(getConnectorKnowledge("type2")).toEqual({
      key: "type2",
      label: "Type 2",
      currentType: "AC",
      description: expect.stringContaining("AC charging"),
      typicalPowerRange: "3.7-22 kW AC",
      supportedRegions: ["Europe", "Poland"],
      supportedVehicleBrands: expect.arrayContaining(["Renault", "Tesla"]),
      imageLabel: "Type 2 AC charging connector",
    });
    expect(formatConnectorLabel("Type 2")).toBe("Type 2");
    expect(formatConnectorLabel("type-2")).toBe("Type 2");
    expect(formatConnectorLabel("Mennekes")).toBe("Type 2");
    expect(getConnectorCurrentType("IEC 62196-2")).toBe("AC");
  });

  it("normalizes CHAdeMO variants to the CHAdeMO entry", () => {
    expect(getConnectorKnowledge("chademo")).toEqual({
      key: "chademo",
      label: "CHAdeMO",
      currentType: "DC",
      description: expect.stringContaining("DC fast charging"),
      typicalPowerRange: "25-100 kW DC",
      supportedRegions: ["Europe", "Japan"],
      supportedVehicleBrands: expect.arrayContaining(["Nissan", "Mitsubishi"]),
      imageLabel: "CHAdeMO DC fast charging connector",
    });
    expect(formatConnectorLabel("CHAdeMO")).toBe("CHAdeMO");
    expect(formatConnectorLabel("cha de mo")).toBe("CHAdeMO");
    expect(getConnectorCurrentType("CHAdeMO")).toBe("DC");
  });
});

describe("CONNECTOR_KNOWLEDGE_LIST", () => {
  it("exposes the supported connector entries in user-facing order", () => {
    expect(CONNECTOR_KNOWLEDGE_LIST.map((connector) => connector.label)).toEqual([
      "CCS2",
      "Type 2",
      "CHAdeMO",
      "Unknown",
    ]);
  });
});

describe("formatPowerKw", () => {
  it("formats power values with kW and keeps decimals only when needed", () => {
    expect(formatPowerKw(50)).toBe("50 kW");
    expect(formatPowerKw(50.5)).toBe("50.5 kW");
    expect(formatPowerKw(22.25)).toBe("22.25 kW");
    expect(formatPowerKw("150.0")).toBe("150 kW");
  });

  it("returns Unknown for null, empty, and non-numeric power values", () => {
    expect(formatPowerKw(null)).toBe("Unknown");
    expect(formatPowerKw("")).toBe("Unknown");
    expect(formatPowerKw("   ")).toBe("Unknown");
    expect(formatPowerKw("fast")).toBe("Unknown");
  });
});
