import type { ReactNode } from "react";

import { findRegionalCity } from "@/features/charging/regional-stations";
import { SITE_URL } from "@/lib/config/site";

const buildBreadcrumbJsonLd = (city: { slug: string; name: string }) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "evsource.pl", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Stacje ładowania",
      item: `${SITE_URL}/stations`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: city.name,
      item: `${SITE_URL}/stations/${city.slug}`,
    },
  ],
});

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
          __html: JSON.stringify(buildBreadcrumbJsonLd(city)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      {children}
    </>
  );
};

export default StationsIdLayout;
