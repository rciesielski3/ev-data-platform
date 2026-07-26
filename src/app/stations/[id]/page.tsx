import type { Metadata } from "next";

import {
  generateRegionalCityMetadata,
  RegionalCityView,
} from "@/app/stations/[id]/regional-city-view";
import {
  generateStationDetailMetadata,
  StationDetailView,
} from "@/app/stations/[id]/station-detail-view";
import { findRegionalCity } from "@/features/charging/regional-stations";
import { REGIONAL_CITIES } from "@/lib/config/regional-cities";

// `/stations/[id]` serves two different things behind one dynamic segment:
// station detail pages (id = station cuid) and regional landing pages
// (id = one of the fixed city slugs in REGIONAL_CITIES). Next.js requires
// every dynamic route at the same level to share one param name, so both
// live here and dispatch on whether the segment matches a known city slug.
export const dynamic = "force-dynamic";

export const generateStaticParams = () =>
  REGIONAL_CITIES.map((city) => ({ id: city.slug }));

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const city = findRegionalCity(id);

  return city
    ? generateRegionalCityMetadata(city)
    : generateStationDetailMetadata(id);
};

const StationOrRegionalPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const city = findRegionalCity(id);

  return city ? <RegionalCityView city={city} /> : <StationDetailView id={id} />;
};

export default StationOrRegionalPage;
