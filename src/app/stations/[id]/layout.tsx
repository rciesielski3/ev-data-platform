import type { ReactNode } from "react";

import { findRegionalCity } from "@/features/charging/regional-stations";
import { buildBreadcrumbJsonLd } from "@/lib/seo/metadata";

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
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "evsource.pl", path: "" },
              { name: "Stacje ładowania", path: "/stations" },
              { name: city.name, path: `/stations/${city.slug}` },
            ]),
          ).replace(
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
