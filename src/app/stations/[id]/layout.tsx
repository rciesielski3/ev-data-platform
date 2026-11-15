import type { ReactNode } from "react";

import { findRegionalCity } from "@/features/charging/regional-stations";
import { SITE_URL } from "@/lib/config/site";
import { buildBreadcrumbSchema, serializeJsonLd } from "@/lib/seo/article-schema";

const buildCityBreadcrumbJsonLd = (city: { slug: string; name: string }) =>
  buildBreadcrumbSchema([
    { name: "evsource.pl", url: SITE_URL },
    { name: "Stacje ładowania", url: `${SITE_URL}/stations` },
    { name: city.name, url: `${SITE_URL}/stations/${city.slug}` },
  ]);

const StationsIdLayout = async ({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const city = findRegionalCity(id);

  if (!city) {
    return children;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildCityBreadcrumbJsonLd(city)),
        }}
      />
      {children}
    </>
  );
};

export default StationsIdLayout;
