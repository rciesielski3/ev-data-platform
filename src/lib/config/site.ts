export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.evdatasource.com";

export const SITE_EMAIL = "kontakt@evdatasource.com";

export const SITE_DOMAIN = new URL(SITE_URL).hostname;
