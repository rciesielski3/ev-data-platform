import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db/prisma";
import { SITE_URL } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 0.8, changeFrequency: "daily" },
  { path: "/vehicles", priority: 0.8, changeFrequency: "daily" },
  { path: "/stations", priority: 0.8, changeFrequency: "daily" },
  { path: "/map", priority: 0.8, changeFrequency: "daily" },
  { path: "/insights", priority: 0.8, changeFrequency: "daily" },
  { path: "/provinces", priority: 0.8, changeFrequency: "daily" },
  { path: "/operators", priority: 0.8, changeFrequency: "daily" },
  { path: "/coverage", priority: 0.8, changeFrequency: "daily" },
  { path: "/corridors", priority: 0.8, changeFrequency: "daily" },
  { path: "/connectors", priority: 0.8, changeFrequency: "daily" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
];

const CONNECTOR_TYPES = ["ccs2", "type2", "chademo", "unknown"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        pl: `${SITE_URL}/pl${route.path}`,
        en: `${SITE_URL}/en${route.path}`,
      },
    },
  }));

  const connectorEntries: MetadataRoute.Sitemap = CONNECTOR_TYPES.map((type) => ({
    url: `${SITE_URL}/connectors/${type}`,
    changeFrequency: "weekly",
    priority: 0.7,
    alternates: {
      languages: {
        pl: `${SITE_URL}/pl/connectors/${type}`,
        en: `${SITE_URL}/en/connectors/${type}`,
      },
    },
  }));

  const [stations, vehicles] = await Promise.all([
    prisma.chargingStation.findMany({
      select: { id: true, updatedAt: true },
    }),
    prisma.evModel.findMany({
      select: { id: true, updatedAt: true },
    }),
  ]);

  const stationEntries: MetadataRoute.Sitemap = stations.map((station) => ({
    url: `${SITE_URL}/stations/${station.id}`,
    lastModified: station.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
    alternates: {
      languages: {
        pl: `${SITE_URL}/pl/stations/${station.id}`,
        en: `${SITE_URL}/en/stations/${station.id}`,
      },
    },
  }));

  const vehicleEntries: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
    url: `${SITE_URL}/vehicles/${vehicle.id}`,
    lastModified: vehicle.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
    alternates: {
      languages: {
        pl: `${SITE_URL}/pl/vehicles/${vehicle.id}`,
        en: `${SITE_URL}/en/vehicles/${vehicle.id}`,
      },
    },
  }));

  return [...staticEntries, ...connectorEntries, ...stationEntries, ...vehicleEntries];
}
