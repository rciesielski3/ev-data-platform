import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { AnalysisSection } from "@/components/home/analysis-section";
import { ArcDivider } from "@/components/home/arc-divider";
import { B2bSection } from "@/components/home/b2b-section";
import { DataSection } from "@/components/home/data-section";
import { ExploreSection } from "@/components/home/explore-section";
import { HomeHero } from "@/components/home/home-hero";
import { OperatorsSection } from "@/components/home/operators-section";
import { ValueProps } from "@/components/home/value-props";
import { getHomeContent } from "@/features/home/home-content";
import { getCachedLatestSnapshot } from "@/features/home/latest-snapshot";
import { OG_IMAGE_PATH } from "@/lib/config/site";
import { formatDisplayNumber } from "@/lib/display/data-display";

export const revalidate = 3600;

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const snapshot = await getCachedLatestSnapshot().catch(() => null);

  const hasSnapshotTotals =
    snapshot !== null &&
    snapshot.totalStationCount > 0 &&
    snapshot.totalConnectorCount > 0;

  const ogTitle = t("og_title");
  const ogDescription = hasSnapshotTotals
    ? t("og_description", {
        stations: formatDisplayNumber(snapshot.totalStationCount, locale),
        connectors: formatDisplayNumber(snapshot.totalConnectorCount, locale),
      })
    : t("description");

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      title: ogTitle,
      description: ogDescription,
      siteName: "evsource.pl",
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE_PATH],
    },
  };
};

const HomePage = async () => {
  const content = await getHomeContent();

  return (
    <main data-motion className="flex flex-1 flex-col">
      <HomeHero content={content} />
      <ValueProps content={content} />
      <ArcDivider />
      <ExploreSection content={content} />
      <DataSection content={content} />
      <AnalysisSection content={content} />
      <B2bSection content={content} />
      <OperatorsSection content={content} />
    </main>
  );
};

export default HomePage;
