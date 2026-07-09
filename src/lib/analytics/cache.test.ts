import { describe, it, expect, beforeEach } from "vitest";
import {
  getCache,
  setCache,
  invalidateCache,
  clearCache,
  getCacheKey,
  getCacheStats,
} from "./cache";
import { GaReport } from "./types";

const mockReport: GaReport = {
  userId: "user-1",
  propertyId: "123456789",
  dateRange: {
    startDate: "2026-06-01",
    endDate: "2026-07-01",
  },
  metrics: [
    { name: "screenPageViews", value: 1000 },
    { name: "totalUsers", value: 500 },
  ],
  cachedAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

describe("GA Cache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("should set and retrieve cache entry", () => {
    const key = getCacheKey("user-1", "123456789");
    setCache(key, mockReport);

    const retrieved = getCache(key);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe("user-1");
    expect(retrieved?.metrics.length).toBe(2);
  });

  it("should return null for non-existent cache entry", () => {
    const retrieved = getCache("non-existent-key");
    expect(retrieved).toBeNull();
  });

  it("should respect TTL and expire cache entries", () => {
    const key = getCacheKey("user-1", "123456789");

    // Set cache with very short TTL (1 millisecond in the past)
    setCache(key, mockReport, -1);

    // Should be expired now
    const retrieved = getCache(key);
    expect(retrieved).toBeNull();
  });

  it("should invalidate specific cache entry", () => {
    const key = getCacheKey("user-1", "123456789");
    setCache(key, mockReport);

    // Verify it's cached
    expect(getCache(key)).not.toBeNull();

    // Invalidate
    invalidateCache(key);

    // Should return null
    expect(getCache(key)).toBeNull();
  });

  it("should clear all cache entries", () => {
    const key1 = getCacheKey("user-1", "123456789");
    const key2 = getCacheKey("user-2", "987654321");

    setCache(key1, mockReport);
    setCache(key2, mockReport);

    expect(getCacheStats().size).toBe(2);

    clearCache();

    expect(getCacheStats().size).toBe(0);
    expect(getCache(key1)).toBeNull();
    expect(getCache(key2)).toBeNull();
  });

  it("should generate unique cache keys", () => {
    const key1 = getCacheKey("user-1", "123456789");
    const key2 = getCacheKey("user-2", "123456789");
    const key3 = getCacheKey("user-1", "987654321");

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key2).not.toBe(key3);

    // Keys should follow pattern
    expect(key1).toBe("ga:user-1:123456789");
    expect(key2).toBe("ga:user-2:123456789");
    expect(key3).toBe("ga:user-1:987654321");
  });

  it("should track cache statistics", () => {
    const stats = getCacheStats();
    expect(stats.size).toBe(0);
    expect(stats.keys).toEqual([]);

    const key1 = getCacheKey("user-1", "123456789");
    const key2 = getCacheKey("user-2", "987654321");

    setCache(key1, mockReport);
    setCache(key2, mockReport);

    const updatedStats = getCacheStats();
    expect(updatedStats.size).toBe(2);
    expect(updatedStats.keys).toContain(key1);
    expect(updatedStats.keys).toContain(key2);
  });
});
