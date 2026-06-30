import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_SNAPSHOT_RETENTION_DAYS,
  getRetentionCutoffDate,
  getSnapshotRetentionDays,
} from "@/lib/snapshots/retention";

describe("getSnapshotRetentionDays", () => {
  afterEach(() => {
    delete process.env.SNAPSHOT_RETENTION_DAYS;
  });

  it("defaults to 90 days when unset", () => {
    expect(getSnapshotRetentionDays()).toBe(DEFAULT_SNAPSHOT_RETENTION_DAYS);
  });

  it("uses a configured positive integer", () => {
    process.env.SNAPSHOT_RETENTION_DAYS = "30";
    expect(getSnapshotRetentionDays()).toBe(30);
  });

  it("falls back to the default for invalid values", () => {
    process.env.SNAPSHOT_RETENTION_DAYS = "not-a-number";
    expect(getSnapshotRetentionDays()).toBe(DEFAULT_SNAPSHOT_RETENTION_DAYS);
  });

  it("falls back to the default for zero or negative values", () => {
    process.env.SNAPSHOT_RETENTION_DAYS = "0";
    expect(getSnapshotRetentionDays()).toBe(DEFAULT_SNAPSHOT_RETENTION_DAYS);

    process.env.SNAPSHOT_RETENTION_DAYS = "-5";
    expect(getSnapshotRetentionDays()).toBe(DEFAULT_SNAPSHOT_RETENTION_DAYS);
  });
});

describe("getRetentionCutoffDate", () => {
  it("subtracts the retention window from `now`", () => {
    const now = new Date("2026-06-29T00:00:00.000Z");
    const cutoff = getRetentionCutoffDate(90, now);

    expect(cutoff.toISOString()).toBe("2026-03-31T00:00:00.000Z");
  });

  it("supports a custom retention window", () => {
    const now = new Date("2026-06-29T00:00:00.000Z");
    const cutoff = getRetentionCutoffDate(30, now);

    expect(cutoff.toISOString()).toBe("2026-05-30T00:00:00.000Z");
  });
});
