import { vi } from "vitest";

// Global Prisma mock for all integration tests
vi.mock("@/lib/db/prisma", () => {
  // Snapshots storage
  const snapshots = new Map();

  // Data sources storage
  const sources = new Map([
    [
      "eipa",
      {
        id: "eipa-1",
        key: "eipa",
        label: "EIPA Data Source",
        licenseStatus: "active",
      },
    ],
  ]);
  let nextSourceId = 1;

  return {
    prisma: {
      // For snapshots
      chargingStation: {
        findMany: vi.fn(async () => [
          {
            id: "station-1",
            name: "Test Station 1",
            city: "Warsaw",
            province: "Masovian",
            latitude: 52.2296,
            longitude: 21.012,
            operator: {
              normalizedName: "test-operator",
              name: "Test Operator",
            },
            connectors: [
              {
                id: "conn-1",
                connectorType: "Type 2",
                powerKw: 22,
              },
            ],
          },
          {
            id: "station-2",
            name: "Test Station 2",
            city: "Krakow",
            province: "Lesser Poland",
            latitude: 50.0647,
            longitude: 19.945,
            operator: {
              normalizedName: "test-operator",
              name: "Test Operator",
            },
            connectors: [
              {
                id: "conn-2",
                connectorType: "Type 2",
                powerKw: 150,
              },
            ],
          },
        ]),
      },
      dailySnapshot: {
        upsert: vi.fn(async (params) => {
          const dateKey = params.where.snapshotDate.toISOString();
          const data = params.create || params.update;
          snapshots.set(dateKey, {
            snapshotDate: params.where.snapshotDate,
            ...data,
          });
          return snapshots.get(dateKey);
        }),
        findUnique: vi.fn(async (params) => {
          const dateKey = params.where.snapshotDate.toISOString();
          const snapshot = snapshots.get(dateKey);

          if (params.select) {
            if (snapshot) {
              return {
                precomputedStats: snapshot.precomputedStats,
              };
            }
            return null;
          }

          return snapshot || null;
        }),
      },
      // For monitoring/regression detection
      dataSource: {
        findUnique: vi.fn(async (params) => {
          if (params.where.key) {
            return sources.get(params.where.key) || null;
          }
          if (params.where.id) {
            return Array.from(sources.values()).find((s) => s.id === params.where.id) || null;
          }
          return null;
        }),
        findFirst: vi.fn(async () => null),
        create: vi.fn(async (params) => {
          const newSource = {
            id: `source-${nextSourceId++}`,
            ...params.data,
          };
          sources.set(newSource.key, newSource);
          return newSource;
        }),
        delete: vi.fn(async (params) => {
          const source = Array.from(sources.values()).find((s) => s.id === params.where.id);
          if (source) {
            sources.delete(source.key);
          }
          return source;
        }),
      },
      // For ingestion runs
      ingestionRun: {
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
      },
    },
  };
});
