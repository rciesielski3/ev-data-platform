import { describe, expect, it } from "vitest";

import {
  buildStationRecords,
  buildVehicleRecords,
  checkSnapshotSizes,
  serializeSnapshot,
  type StationDbRow,
  type VehicleDbRow,
} from "@/lib/fallback/build-snapshots-from-db";

const stationRow = (id: string, sourceRecordId: string): StationDbRow => ({
  id,
  sourceRecordId,
  name: "Stacja",
  city: "Kraków",
  province: "małopolskie",
  latitude: 50.1,
  longitude: 19.9,
  address: null,
  externalCode: null,
  sourceUpdatedAt: new Date("2026-05-25T12:55:16.000Z"),
  acceptedPaymentMethods: ["PAYMENT_CARD"],
  authenticationTypes: [],
  operator: { name: "Op", normalizedName: "eipa-operator-6" },
  connectors: [{ connectorType: "ccs2", powerKw: 50, cableAttached: true }],
});

const specs = {
  batteryCapacityKwhNet: 60,
  batteryCapacityKwhGross: null,
  rangeWltpKm: 400,
  rangeEpaKm: null,
  rangeStandard: "WLTP",
  acMaxPowerKw: 11,
  dcMaxPowerKw: 150,
  primaryConnector: "ccs2",
  drivetrain: "rwd",
  systemPowerKw: null,
} as VehicleDbRow["specs"];

const vehicleRow = (id: string, sourceRecordId: string, withSpecs = true): VehicleDbRow => ({
  id,
  sourceRecordId,
  modelName: "Model 3",
  variantName: null,
  year: 2024,
  sourceUrl: null,
  brand: { slug: "tesla", name: "Tesla" },
  specs: withSpecs ? specs : null,
});

describe("buildStationRecords", () => {
  it("maps source id to id, db id to dbId, and sorts numerically", () => {
    const records = buildStationRecords([stationRow("c2", "10"), stationRow("c1", "9")]);

    expect(records.map((record) => record.id)).toEqual(["9", "10"]);
    expect(records[0]).toMatchObject({
      id: "9",
      dbId: "c1",
      sourceUpdatedAt: "2026-05-25T12:55:16.000Z",
      operator: { name: "Op", normalizedName: "eipa-operator-6" },
      connectors: [{ connectorType: "ccs2", powerKw: 50, cableAttached: true }],
    });
  });

  it("keeps null operator and date", () => {
    const [record] = buildStationRecords([{ ...stationRow("c1", "1"), operator: null, sourceUpdatedAt: null }]);
    expect(record?.operator).toBeNull();
    expect(record?.sourceUpdatedAt).toBeNull();
  });
});

describe("buildVehicleRecords", () => {
  it("flattens brand, picks spec fields and skips rows without specs", () => {
    const records = buildVehicleRecords([vehicleRow("c2", "tesla:b"), vehicleRow("c1", "tesla:a"), vehicleRow("c3", "x", false)]);

    expect(records.map((record) => record.id)).toEqual(["tesla:a", "tesla:b"]);
    expect(records[0]).toMatchObject({ dbId: "c1", brandSlug: "tesla", brandName: "Tesla" });
    expect(Object.keys(records[0]?.specs ?? {})).toHaveLength(10);
  });
});

describe("serializeSnapshot", () => {
  it("is compact with a trailing newline", () => {
    expect(serializeSnapshot("stations", [{ id: "1" }], "2026-01-01T00:00:00.000Z")).toBe(
      '{"generatedAt":"2026-01-01T00:00:00.000Z","stations":[{"id":"1"}]}\n',
    );
  });
});

describe("checkSnapshotSizes", () => {
  const committed = { stations: 100, vehicles: 50 };

  it("accepts a healthy export", () => {
    expect(checkSnapshotSizes({ stations: 90, vehicles: 50 }, committed)).toEqual([]);
  });

  it("rejects zero rows", () => {
    expect(checkSnapshotSizes({ stations: 0, vehicles: 0 }, committed)).toHaveLength(3);
  });

  it("rejects a station count below 50% of committed", () => {
    expect(checkSnapshotSizes({ stations: 49, vehicles: 50 }, committed)).toHaveLength(1);
    expect(checkSnapshotSizes({ stations: 50, vehicles: 50 }, committed)).toEqual([]);
  });

  it("ignores the ratio when no committed file exists", () => {
    expect(checkSnapshotSizes({ stations: 5, vehicles: 5 }, { stations: 0, vehicles: 0 })).toEqual([]);
  });
});
