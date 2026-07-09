import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GaMetric, GaReport, GA_METRICS } from "./types";

export class GaClient {
  private client: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor(propertyId: string) {
    this.propertyId = propertyId;
    this.client = new BetaAnalyticsDataClient({
      keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    });
  }

  async getMetrics(
    startDate: string,
    endDate: string,
    accessLevel: "basic" | "advanced"
  ): Promise<GaReport> {
    const metricNames = GA_METRICS[accessLevel];

    const response = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: metricNames.map((name) => ({ name })),
    });

    const metrics: GaMetric[] = [];
    if (response[0].totals && response[0].totals[0]) {
      const totals = response[0].totals[0];
      metricNames.forEach((name, idx) => {
        metrics.push({
          name,
          value: totals.metricValues?.[idx]?.value || "0",
        });
      });
    }

    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() +
        (process.env.GA_DATA_CACHE_TTL_HOURS
          ? parseInt(process.env.GA_DATA_CACHE_TTL_HOURS)
          : 24)
    );

    return {
      userId: "",
      propertyId: this.propertyId,
      dateRange: { startDate, endDate },
      metrics,
      cachedAt: new Date(),
      expiresAt,
    };
  }
}

export const createGaClient = () => {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error("GA4_PROPERTY_ID env var not set");
  }
  return new GaClient(propertyId);
};
