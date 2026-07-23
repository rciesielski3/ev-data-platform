export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://evsource.pl";

export const SITE_EMAIL = "kontakt@evsource.pl";

export const SITE_DOMAIN = new URL(SITE_URL).hostname;
