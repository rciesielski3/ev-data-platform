import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config/site";

export const SCRAPER_USER_AGENTS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "PetalBot",
  "Bytespider",
  "Amazonbot",
  "ClaudeBot",
  "CCBot",
  "DataForSeoBot",
  "BLEXBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: SCRAPER_USER_AGENTS, disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/*?"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
