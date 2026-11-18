import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { BookOpenIcon, PlugIcon, ZapIcon } from "lucide-react";

import {
  getConnectorPageEntries,
  getConnectorPageKnowledge,
} from "@/features/charging/connector-pages";
import BackLink from "@/components/ui/BackLink";
import { connectorFAQs } from "@/lib/seo/faq-data";
import { generateConnectorMetadata, generateFAQSchema } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const revalidate = 86400;

export const generateStaticParams = () =>
  getConnectorPageEntries().map((connector) => ({ type: connector.key }));

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> => {
  const { type } = await params;
  const connector = getConnectorPageKnowledge(type);

  const t = await getTranslations("connectorDetail");
  const tKnowledge = await getTranslations("connectorKnowledge");

  const metadata = generateConnectorMetadata({
    type: connector.key,
    title: t("og_title", { label: connector.label }),
    description: tKnowledge(`${connector.key}.description`),
  });

  if (connector.key === "unknown") {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="border-b border-forest/10 pb-4 last:border-none last:pb-0">
    <dt className="text-xs font-semibold uppercase tracking-wider text-forest/70">
      {label}
    </dt>
    <dd className="mt-1 text-forest">{value}</dd>
  </div>
);

export default async function ConnectorDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const connector = getConnectorPageKnowledge(type);
  const isUnknownConnector = connector.key === "unknown";
  const faqContent = connectorFAQs[connector.key];
  const isDc = connector.currentType === "DC";
  const Icon = isDc ? ZapIcon : PlugIcon;

  const t = await getTranslations("connectorDetail");
  const tKnowledge = await getTranslations("connectorKnowledge");
  const description = tKnowledge(`${connector.key}.description`);
  const imageLabel = tKnowledge(`${connector.key}.imageLabel`);
  const supportedRegionsText = tKnowledge(
    `${connector.key}.supportedRegionsText`,
  );

  return (
    <main className="page-shell max-w-4xl pb-20 pt-12 sm:pt-16">
      <BackLink href="/connectors" label={t("backLink")} />

      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] ${
            isDc ? "bg-sun text-forest" : "bg-forest text-sun"
          }`}
        >
          <Icon size={30} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <span className="badge">{connector.currentType}</span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-5xl">
            {connector.label}
          </h1>
          <p className="muted mt-4 max-w-2xl text-lg">{description}</p>
        </div>
      </header>

      {isUnknownConnector && (
        <section className="mb-8 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">{t("incompleteDataTitle")}</h2>
          <p className="mt-2 text-sm">{t("incompleteDataBody")}</p>
        </section>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">
            {t("currentTypeLabel")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-forest">
            {connector.currentType}
          </p>
        </div>
        <div className="card !bg-forest text-cream">
          <p className="text-xs font-semibold uppercase tracking-wider text-cream/70">
            {t("typicalPowerLabel")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-sun">
            {connector.typicalPowerRange}
          </p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <section className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">
            {t("imageLabelCaption")}
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl bg-cream">
            <Image
              src={connector.imagePath}
              alt={imageLabel}
              width={720}
              height={560}
              className="aspect-[4/3] w-full object-contain p-4"
              priority
            />
          </div>
          <p className="muted mt-4 text-sm">{t("imageCaption")}</p>
        </section>

        <section className="card">
          <h2 className="mb-6 font-display text-xl font-semibold tracking-tight text-forest">
            {t("detailsTitle")}
          </h2>
          <dl className="space-y-4">
            <DetailRow label={t("nameLabel")} value={connector.label} />
            <DetailRow label={t("descriptionLabel")} value={description} />
            <DetailRow
              label={t("supportedRegionsLabel")}
              value={supportedRegionsText}
            />
            <DetailRow
              label={t("supportedBrandsLabel")}
              value={
                <span className="flex flex-wrap gap-2">
                  {connector.supportedVehicleBrands.map((brand) => (
                    <span
                      key={brand}
                      className="rounded-full bg-forest/10 px-3 py-1 text-sm font-medium text-forest"
                    >
                      {brand}
                    </span>
                  ))}
                </span>
              }
            />
          </dl>
        </section>
      </div>

      {faqContent && (
        <>
          <section className="card mt-10">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-sun">
                <BookOpenIcon size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
                {t("faq_title")}
              </h2>
            </div>
            <div className="space-y-6">
              {faqContent.map((item) => (
                <div
                  key={item.question}
                  className="border-b border-forest/10 pb-5 last:border-b-0 last:pb-0"
                >
                  <h3 className="mb-2 font-semibold text-forest">
                    {item.question}
                  </h3>
                  <p className="max-w-3xl text-sm leading-relaxed text-forest/70">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateFAQSchema(faqContent)).replace(
                /</g,
                "\\u003c",
              ),
            }}
          />
        </>
      )}
    </main>
  );
}
