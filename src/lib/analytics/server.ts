import { GaReport } from "./types";

export async function getGaMetrics(
  userTier: "professional" | "enterprise" = "professional"
): Promise<GaReport | null> {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
      return null;
    }

    // Mock implementation for now - actual GA fetch in Task 4
    // Return sample data based on tier
    const basicMetrics = [
      { name: "screenPageViews", value: "1240" },
      { name: "totalUsers", value: "340" },
      { name: "activeUsers", value: "145" },
      { name: "bounceRate", value: "32.5%" },
    ];

    const advancedMetrics = [
      ...basicMetrics,
      { name: "ecommerceRevenue", value: "$4,230" },
      { name: "ecommercePurchases", value: "28" },
      { name: "itemRevenue", value: "$151" },
    ];

    const metrics =
      userTier === "enterprise" ? advancedMetrics : basicMetrics;

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    return {
      userId: "default-user",
      propertyId,
      dateRange: {
        startDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(today),
      },
      metrics,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error("Failed to fetch GA metrics:", error);
    return null;
  }
}

export async function getGaMetricsWithTier(
  userTier: "professional" | "enterprise",
  userId: string
): Promise<GaReport | null> {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
      return null;
    }

    // Enhanced version with actual tier-based access control
    const basicMetrics = [
      { name: "screenPageViews", value: "1240" },
      { name: "totalUsers", value: "340" },
      { name: "activeUsers", value: "145" },
      { name: "bounceRate", value: "32.5%" },
    ];

    const advancedMetrics = [
      ...basicMetrics,
      { name: "ecommerceRevenue", value: "$4,230" },
      { name: "ecommercePurchases", value: "28" },
      { name: "itemRevenue", value: "$151" },
    ];

    const metrics =
      userTier === "enterprise" ? advancedMetrics : basicMetrics;

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    return {
      userId,
      propertyId,
      dateRange: {
        startDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(today),
      },
      metrics,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error("Failed to fetch GA metrics with tier:", error);
    return null;
  }
}

export async function isGaLinked(userId: string): Promise<boolean> {
  try {
    // TODO: Check database for GaUser record
    // For now, return false (not linked)
    return false;
  } catch (error) {
    console.error("Failed to check GA link status:", error);
    return false;
  }
}
