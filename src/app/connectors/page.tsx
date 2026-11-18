import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRightIcon, PlugIcon, ZapIcon } from "lucide-react";

import Card from "@/components/ui/Card";
import { getConnectorPageEntries } from "@/features/charging/connector-pages";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("connectors");
  return {
    title: t("title") || "EV Charging Connectors - evsource.pl",
    description: t("description") || "Porównaj rodzaje ładowarek EV: CCS2, Type 2, CHAdeMO. Dowiedz się, które złącze pasuje do Twojego pojazdu elektrycznego.",
  };
};

export default async function ConnectorsPage() {
  const t = await getTranslations("connectors");
  const tDetail = await getTranslations("connectorDetail");
  const tKnowledge = await getTranslations("connectorKnowledge");
  const connectors = getConnectorPageEntries();

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <header className="mb-12">
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-5xl">
          {t("title")}
        </h1>
        <p className="muted mt-4 max-w-2xl text-lg">{t("description")}</p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {connectors.map((connector) => {
          const isDc = connector.currentType === "DC";
          const Icon = isDc ? ZapIcon : PlugIcon;

          return (
            <Card
              key={connector.key}
              as={Link}
              href={connector.href}
              interactive
              className="group flex flex-col focus-visible:outline-forest"
            >
              <div className="mb-6 overflow-hidden rounded-2xl bg-cream">
                <Image
                  src={connector.imagePath}
                  alt={tKnowledge(`${connector.key}.imageLabel`)}
                  width={640}
                  height={520}
                  className="aspect-[4/3] w-full object-contain p-4 transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 motion-safe:group-hover:-rotate-6 ${
                    isDc ? "bg-sun text-forest" : "bg-forest text-sun"
                  }`}
                >
                  <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">
                    {connector.label}
                  </h2>
                  <p className="muted mt-2 text-sm">
                    {tKnowledge(`${connector.key}.description`)}
                  </p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-forest/10 pt-4 text-sm">
                <div>
                  <dt className="text-forest/70">{tDetail("currentTypeLabel")}</dt>
                  <dd className="mt-0.5 font-medium text-forest">
                    {connector.currentType}
                  </dd>
                </div>
                <div>
                  <dt className="text-forest/70">{tDetail("typicalPowerLabel")}</dt>
                  <dd className="mt-0.5 font-medium text-forest">
                    {connector.typicalPowerRange}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                <p className="text-sm font-semibold text-forest">
                  {t("viewDetailsLink")}
                </p>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition-all duration-300 group-hover:rotate-45 group-hover:bg-sun group-hover:text-forest">
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
