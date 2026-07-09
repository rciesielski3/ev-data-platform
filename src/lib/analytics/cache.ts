import { GaReport } from "./types";

interface CacheEntry {
  data: GaReport;
  expiresAt: Date;
}

const cache = new Map<string, CacheEntry>();

export function getCacheKey(userId: string, propertyId: string): string {
  return `ga:${userId}:${propertyId}`;
}

export function setCache(
  key: string,
  data: GaReport,
  ttlHours: number = 24
): void {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);
  cache.set(key, { data, expiresAt });
}

export function getCache(key: string): GaReport | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  const now = new Date();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function invalidateCache(key: string): void {
  cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
