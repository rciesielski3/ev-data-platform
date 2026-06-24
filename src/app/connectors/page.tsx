import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { getConnectorPageEntries } from "@/features/charging/connector-pages";

export default async function ConnectorsPage() {
  const t = await getTranslations("connectors");
  const tKnowledge = await getTranslations("connectorKnowledge");
  const connectors = getConnectorPageEntries();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <section className="grid gap-5 sm:grid-cols-2">
        {connectors.map((connector) => (
          <Card
            key={connector.key}
            as={Link}
            href={connector.href}
            interactive
            className="group relative"
          >
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
            <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <Image
                src={connector.imagePath}
                alt={tKnowledge(`${connector.key}.imageLabel`)}
                width={640}
                height={520}
                className="aspect-[4/3] w-full object-contain p-4"
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 group-hover:text-emerald-700">
                  {connector.label}
                </h2>
                <p className="muted mt-2 text-sm">
                  {tKnowledge(`${connector.key}.description`)}
                </p>
              </div>
              <Badge>{connector.currentType}</Badge>
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}
