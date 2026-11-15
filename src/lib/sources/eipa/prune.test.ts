import { IngestionStatus } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getPruneSkipReason,
  getStaleStationIds,
  isPruneDryRun,
} from "@/lib/sources/eipa/prune";

const baseInput = {
  importLimit: null,
  status: IngestionStatus.SUCCESS,
  fetchedCount: 7435,
  previousFetchedCount: 7400,
};

describe("getPruneSkipReason", () => {
  it("allows pruning after a complete, unlimited import", () => {
    expect(getPruneSkipReason(baseInput)).toBeNull();
  });

  it("allows pruning after a partial import", () => {
    expect(
      getPruneSkipReason({ ...baseInput, status: IngestionStatus.PARTIAL }),
    ).toBeNull();
  });

  it("skips when an import limit is set", () => {
    expect(getPruneSkipReason({ ...baseInput, importLimit: 50 })).toMatch(
      /import limit/,
    );
  });

  it("skips when the import failed", () => {
    expect(
      getPruneSkipReason({ ...baseInput, status: IngestionStatus.FAILED }),
    ).toMatch(/failed/);
  });

  it("skips when fewer than the minimum stations were fetched", () => {
    expect(
      getPruneSkipReason({
        ...baseInput,
        fetchedCount: 999,
        previousFetchedCount: null,
      }),
    ).toMatch(/minimum/);
  });

  it("allows pruning at the minimum when there is no previous import", () => {
    expect(
      getPruneSkipReason({
        ...baseInput,
        fetchedCount: 1000,
        previousFetchedCount: null,
      }),
    ).toBeNull();
  });

  it("skips when the fetch dropped below 90% of the previous import", () => {
    expect(
      getPruneSkipReason({
        ...baseInput,
        fetchedCount: 8999,
        previousFetchedCount: 10000,
      }),
    ).toMatch(/90%/);
  });

  it("allows pruning exactly at 90% of the previous import", () => {
    expect(
      getPruneSkipReason({
        ...baseInput,
        fetchedCount: 9000,
        previousFetchedCount: 10000,
      }),
    ).toBeNull();
  });
});

describe("getStaleStationIds", () => {
  it("returns ids of stations whose source record was not fetched", () => {
    const existing = [
      { id: "a", sourceRecordId: "1" },
      { id: "b", sourceRecordId: "2" },
      { id: "c", sourceRecordId: "3" },
    ];

    expect(getStaleStationIds(existing, ["1", "3", "4"])).toEqual(["b"]);
  });

  it("returns nothing when every existing station was fetched", () => {
    expect(
      getStaleStationIds([{ id: "a", sourceRecordId: "1" }], new Set(["1"])),
    ).toEqual([]);
  });

  it("returns every station when nothing was fetched", () => {
    expect(
      getStaleStationIds(
        [
          { id: "a", sourceRecordId: "1" },
          { id: "b", sourceRecordId: "2" },
        ],
        [],
      ),
    ).toEqual(["a", "b"]);
  });
});

describe("isPruneDryRun", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is enabled only when EIPA_PRUNE_DRY_RUN is 1", () => {
    vi.stubEnv("EIPA_PRUNE_DRY_RUN", "1");
    expect(isPruneDryRun()).toBe(true);

    vi.stubEnv("EIPA_PRUNE_DRY_RUN", "0");
    expect(isPruneDryRun()).toBe(false);

    vi.stubEnv("EIPA_PRUNE_DRY_RUN", "");
    expect(isPruneDryRun()).toBe(false);
  });
});
