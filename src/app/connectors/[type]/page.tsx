import {
  getConnectorPageEntries,
  getConnectorPageKnowledge,
} from "@/features/charging/connector-pages";
import Image from "next/image";
import Link from "next/link";

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

const formatList = (items: string[]) => items.join(", ");

export default async function ConnectorDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const connector = getConnectorPageKnowledge(type);
  const isUnknownConnector = connector.key === "unknown";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/connectors"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          &larr; Back to connectors
        </Link>
      </div>

      <header className="mb-8">
        <span className="badge">{connector.currentType}</span>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {connector.label}
        </h1>
        <p className="muted mt-3 max-w-2xl text-lg">{connector.description}</p>
      </header>

      {isUnknownConnector && (
        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-lg font-medium">Incomplete source data</h2>
          <p className="mt-2 text-sm">
            Some imported records do not include a connector type that can be
            classified confidently. This page keeps those records explainable
            without inventing compatibility, power, or regional support.
          </p>
        </section>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Image label
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <Image
              src={connector.imagePath}
              alt={connector.imageLabel}
              width={720}
              height={560}
              className="aspect-[4/3] w-full object-contain p-4"
              priority
            />
          </div>
          <p className="muted mt-4 text-sm">
            Preview image only: the graphic above shows what this connector type
            looks like.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-medium text-slate-900">
            Connector details
          </h2>
          <dl className="space-y-4">
            <DetailRow label="Name" value={connector.label} />
            <DetailRow label="Description" value={connector.description} />
            <DetailRow label="AC/DC" value={connector.currentType} />
            <DetailRow
              label="Typical power range"
              value={connector.typicalPowerRange}
            />
            <DetailRow
              label="Supported regions"
              value={formatList(connector.supportedRegions)}
            />
            <DetailRow
              label="Supported vehicle brands"
              value={formatList(connector.supportedVehicleBrands)}
            />
          </dl>
        </section>
      </div>
    </main>
  );
}
