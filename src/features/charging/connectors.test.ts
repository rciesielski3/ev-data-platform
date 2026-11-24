import { describe, expect, it } from "vitest";

import {
  CONNECTOR_KNOWLEDGE_LIST,
  formatConnectorLabel,
  formatPowerKw,
  getConnectorCurrentType,
  getConnectorImagePath,
  getConnectorKnowledge,
  getMaxPlausiblePowerKw,
  isPlausibleConnectorPower,
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
      imagePath: "/connectors/unknown.webp",
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
      imagePath: "/connectors/ccs2.webp",
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
      imagePath: "/connectors/type2.webp",
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
      imagePath: "/connectors/chademo.webp",
    });
    expect(formatConnectorLabel("CHAdeMO")).toBe("CHAdeMO");
    expect(formatConnectorLabel("cha de mo")).toBe("CHAdeMO");
    expect(getConnectorCurrentType("CHAdeMO")).toBe("DC");
  });
});

describe("getConnectorImagePath", () => {
  it("returns connector image paths with the Unknown image as fallback", () => {
    expect(getConnectorImagePath("CCS2")).toBe("/connectors/ccs2.webp");
    expect(getConnectorImagePath("Type 2")).toBe("/connectors/type2.webp");
    expect(getConnectorImagePath("CHAdeMO")).toBe("/connectors/chademo.webp");
    expect(getConnectorImagePath("NACS")).toBe("/connectors/unknown.webp");
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

describe("isPlausibleConnectorPower", () => {
  it("rejects CHAdeMO above its spec maximum (ORLEN MOP 1200 kW rows)", () => {
    expect(isPlausibleConnectorPower("chademo", 1200)).toBe(false);
  });

  it("rejects Type 2 above the AC maximum", () => {
    expect(isPlausibleConnectorPower("type2", 350)).toBe(false);
  });

  it("keeps genuine high-power connectors", () => {
    expect(isPlausibleConnectorPower("ccs2", 400)).toBe(true);
    expect(isPlausibleConnectorPower("ccs2", 600)).toBe(true);
    expect(isPlausibleConnectorPower("chademo", 400)).toBe(true);
    expect(isPlausibleConnectorPower("chademo", 150)).toBe(true);
    expect(isPlausibleConnectorPower("type2", 22)).toBe(true);
  });

  it("does not judge unknown connector types", () => {
    expect(isPlausibleConnectorPower("unknown", 1200)).toBe(true);
  });

  it("applies the caps at the boundary", () => {
    expect(isPlausibleConnectorPower("chademo", 400)).toBe(true);
    expect(isPlausibleConnectorPower("chademo", 401)).toBe(false);
    expect(isPlausibleConnectorPower("type2", 44)).toBe(true);
    expect(isPlausibleConnectorPower("type2", 45)).toBe(false);
  });

  it("recognizes connector type aliases and casing", () => {
    expect(isPlausibleConnectorPower("CHAdeMO", 1200)).toBe(false);
    expect(isPlausibleConnectorPower("Type 2", 350)).toBe(false);
    expect(isPlausibleConnectorPower("Type 2 Combo", 350)).toBe(true);
  });
});

describe("getMaxPlausiblePowerKw", () => {
  it("ignores the 1200 kW CHAdeMO and returns the 600 kW CCS2 of the same hub", () => {
    expect(
      getMaxPlausiblePowerKw([
        { connectorType: "chademo", powerKw: 1200 },
        { connectorType: "ccs2", powerKw: 600 },
        { connectorType: "ccs2", powerKw: 600 },
      ]),
    ).toBe(600);
  });

  it("returns null when every known power is implausible or missing", () => {
    expect(
      getMaxPlausiblePowerKw([
        { connectorType: "chademo", powerKw: 1200 },
        { connectorType: "ccs2", powerKw: null },
      ]),
    ).toBeNull();
    expect(getMaxPlausiblePowerKw([])).toBeNull();
    expect(getMaxPlausiblePowerKw(null)).toBeNull();
  });

  it("keeps a genuine 400 kW CCS2 and judges connectors without a type as unknown", () => {
    expect(getMaxPlausiblePowerKw([{ connectorType: "ccs2", powerKw: 400 }])).toBe(400);
    expect(getMaxPlausiblePowerKw([{ powerKw: 1200 }])).toBe(1200);
  });
});
