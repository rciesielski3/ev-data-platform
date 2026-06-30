import { describe, expect, it } from "vitest";

import { validateChargingStations } from "@/lib/validators/charging";
import { validateEvModels } from "@/lib/validators/ev";
import { RangeStandard } from "@prisma/client";

describe("validateChargingStations", () => {
  it("given valid Poland coordinates when validated then station is accepted", () => {
    const result = validateChargingStations([
      {
        sourceRecordId: "1",
        externalCode: "PL-1",
        name: "Test station",
        latitude: 52.2297,
        longitude: 21.0122,
        city: "Warsaw",
        province: "mazowieckie",
        district: "Warsaw",
        community: "Warsaw",
        address: "Test street 1",
        postalCode: "00-001",
        poolSourceId: "10",
        stationType: "E",
        sourceUpdatedAt: null,
        operator: null,
        connectors: [],
        acceptedPaymentMethods: [],
        authenticationTypes: [],
        rawPayload: {},
      },
    ]);

    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(0);
  });

  it("given coordinates outside Poland when validated then station is rejected", () => {
    const result = validateChargingStations([
      {
        sourceRecordId: "2",
        externalCode: "DE-1",
        name: "Berlin",
        latitude: 52.52,
        longitude: 13.405,
        city: "Berlin",
        province: null,
        district: null,
        community: null,
        address: null,
        postalCode: null,
        poolSourceId: null,
        stationType: "E",
        sourceUpdatedAt: null,
        operator: null,
        connectors: [],
        acceptedPaymentMethods: [],
        authenticationTypes: [],
        rawPayload: {},
      },
    ]);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid[0]?.message).toContain("Poland");
  });
});

describe("validateEvModels", () => {
  it("given missing brand when validated then model is rejected", () => {
    const result = validateEvModels([
      {
        sourceRecordId: "audi:test",
        brandSlug: "audi",
        brandName: "",
        modelName: "A6",
        trimName: null,
        variantName: null,
        year: 2024,
        vehicleType: "passenger_car",
        sourceUrl: null,
        specs: {
          batteryCapacityKwhNet: 100,
          batteryCapacityKwhGross: 105,
          rangeWltpKm: 600,
          rangeEpaKm: null,
          rangeStandard: RangeStandard.WLTP,
          acMaxPowerKw: 11,
          dcMaxPowerKw: 270,
          primaryConnector: "ccs2",
          drivetrain: "rwd",
          systemPowerKw: 350,
        },
        rawPayload: {},
      },
    ]);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
  });
});
