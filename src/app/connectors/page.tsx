import { getConnectorPageEntries } from "@/features/charging/connector-pages";
import Image from "next/image";
import Link from "next/link";

export default function ConnectorsPage() {
  const connectors = getConnectorPageEntries();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <span className="badge">Milestone 3 - Data usability</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Connector knowledge base
        </h1>
        <p className="muted mt-2 max-w-2xl">
          Static reference notes for interpreting connector names in imported
          charging station and vehicle data. These pages do not claim live
          compatibility or charger availability.
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2">
        {connectors.map((connector) => (
          <Link
            key={connector.key}
            href={connector.href}
            className="card group transition-shadow hover:shadow-md"
          >
            <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <Image
                src={connector.imagePath}
                alt={connector.imageLabel}
                width={640}
                height={520}
                className="aspect-[4/3] w-full object-contain p-4"
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-sky-700">
                  {connector.label}
                </h2>
                <p className="muted mt-2 text-sm">{connector.description}</p>
              </div>
              <span className="badge">{connector.currentType}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-sky-700">
              View connector details
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
