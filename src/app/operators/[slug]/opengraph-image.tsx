import { getTranslations } from "next-intl/server";

import { formatInteger } from "@/features/charging/insights";
import { findOperatorPage } from "@/features/charging/operator-pages";
import { getOperatorPages } from "@/lib/db/cached-queries";
import { OG_SIZE, renderOgCard } from "@/lib/og/og-card";

export const revalidate = 86400;
export const size = OG_SIZE;
export const contentType = "image/png";

const OperatorOgImage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const page = findOperatorPage(await getOperatorPages(), slug);

  if (!page) return new Response(null, { status: 404 });

  const t = await getTranslations({ locale: "pl", namespace: "operatorPage" });

  return renderOgCard({
    badge: t("badge"),
    title: page.shortName,
    stat: { value: formatInteger(page.stationCount), label: t("statStations") },
  });
};

export default OperatorOgImage;
