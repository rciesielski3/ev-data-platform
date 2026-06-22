import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import {
  getConnectorPageEntries,
  getConnectorPageKnowledge,
} from "@/features/charging/connector-pages";

export const dynamic = "force-static";

export const generateStaticParams = () =>
  getConnectorPageEntries().map((connector) => ({ type: connector.key }));

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="border-b border-slate-100 pb-3 last:border-none last:pb-0">
    <dt className="text-sm font-medium text-slate-500">{label}</dt>
    <dd className="mt-1 text-slate-900">{value}</dd>
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

  const t = await getTranslations("connectorDetail");
  const tKnowledge = await getTranslations("connectorKnowledge");
  const description = tKnowledge(`${connector.key}.description`);
  const imageLabel = tKnowledge(`${connector.key}.imageLabel`);
  const supportedRegionsText = tKnowledge(`${connector.key}.supportedRegionsText`);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/connectors"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          {t("backLink")}
        </Link>
      </div>

      <header className="mb-8">
        <Badge>{connector.currentType}</Badge>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {connector.label}
        </h1>
        <p className="muted mt-3 max-w-2xl text-lg">{description}</p>
      </header>

      {isUnknownConnector && (
        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-lg font-medium">{t("incompleteDataTitle")}</h2>
          <p className="mt-2 text-sm">{t("incompleteDataBody")}</p>
        </section>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("imageLabelCaption")}
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-medium text-slate-900">
            {t("detailsTitle")}
          </h2>
          <dl className="space-y-4">
            <DetailRow label={t("nameLabel")} value={connector.label} />
            <DetailRow label={t("descriptionLabel")} value={description} />
            <DetailRow label={t("currentTypeLabel")} value={connector.currentType} />
            <DetailRow
              label={t("typicalPowerLabel")}
              value={connector.typicalPowerRange}
            />
            <DetailRow
              label={t("supportedRegionsLabel")}
              value={supportedRegionsText}
            />
            <DetailRow
              label={t("supportedBrandsLabel")}
              value={connector.supportedVehicleBrands.join(", ")}
            />
          </dl>
        </section>
      </div>
    </main>
  );
}
