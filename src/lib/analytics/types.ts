export type GaUser = {
  id: string;
  userId: string;
  email: string;
  gaPropertyId: string;
  oauthAccessToken: string;
  oauthRefreshToken: string;
  oauthExpiresAt: Date;
  tier: "professional" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
};

export type GaMetric = {
  name: string;
  value: string | number;
};

export type GaRow = {
  dimensionValues: Array<{ value: string }>;
  metricValues: GaMetric[];
};

export type GaReport = {
  userId: string;
  propertyId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: GaMetric[];
  rows?: GaRow[];
  cachedAt: Date;
  expiresAt: Date;
};

export type GaAccessLevel = "basic" | "advanced";

export const GA_ACCESS_LEVELS: Record<string, GaAccessLevel> = {
  professional: "basic",
  enterprise: "advanced",
};

export const GA_METRICS = {
  basic: ["screenPageViews", "totalUsers", "activeUsers", "bounceRate"],
  advanced: [
    "screenPageViews",
    "totalUsers",
    "activeUsers",
    "bounceRate",
    "ecommerceRevenue",
    "ecommercePurchases",
    "itemRevenue",
  ],
};
