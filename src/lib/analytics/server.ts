import { GaReport } from "./types";

export async function getGaMetrics(
  userTier: "professional" | "enterprise" = "professional"
): Promise<GaReport | null> {
  try {
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
      userId: "",
      propertyId: process.env.GA4_PROPERTY_ID || "",
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
  userTier: "professional" | "enterprise"
): Promise<GaReport | null> {
  // Enhanced version with actual tier-based access control
  return getGaMetrics(userTier);
}
