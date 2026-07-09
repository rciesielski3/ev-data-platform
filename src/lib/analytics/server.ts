import { createGaClient } from "./ga-client";
import { GaReport } from "./types";
import { getCache, setCache, getCacheKey } from "./cache";

export async function getGaMetrics(
  userTier: string
): Promise<GaReport | null> {
  return getGaMetricsWithTier(userTier);
}

export async function getGaMetricsWithTier(
  userTier: string,
  userId: string = "default-user"
): Promise<GaReport | null> {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
      console.warn("GA4_PROPERTY_ID not set");
      return null;
    }

    const cacheKey = getCacheKey(userId, propertyId);

    // Check cache first
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const client = createGaClient();
    const accessLevel = userTier === "enterprise" ? "advanced" : "basic";

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const report = await client.getMetrics(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
      accessLevel
    );

    const result = {
      ...report,
      userId,
    };

    // Cache the result
    const ttlHours = parseInt(process.env.GA_DATA_CACHE_TTL_HOURS || "24");
    setCache(cacheKey, result, ttlHours);

    return result;
  } catch (error) {
    console.error("Failed to fetch GA metrics:", error);
    return null;
  }
}

export async function isGaLinked(userId: string): Promise<boolean> {
  try {
    // This will be implemented when auth system is added
    // For now, always return false
    return false;
  } catch {
    return false;
  }
}
