import Link from "next/link";
import { notFound } from "next/navigation";

import { buildStationDetails } from "@/features/charging/station-details";
import { StationFreshnessIndicator } from "@/features/charging/station-quality-badge";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="border-b border-slate-100 pb-3">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="mt-1 font-medium text-slate-900">{value}</dd>
  </div>
);

export default async function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const station = await prisma.chargingStation.findUnique({
    where: { id },
    include: {
      operator: {
        select: {
          name: true,
          normalizedName: true,
        },
      },
      connectors: {
        orderBy: [{ powerKw: "desc" }, { connectorType: "asc" }],
      },
    },
  });

  if (!station) {
    notFound();
  }

  const details = buildStationDetails(station);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/stations"
          className="text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          &larr; Back to stations
        </Link>
      </div>

      <header className="mb-10">
        <p className="text-lg font-medium text-slate-500">
          {details.operatorName}
        </p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
          {details.title}
        </h1>
        <p className="muted mt-3 max-w-3xl">
          {[details.address, details.city, details.province]
            .filter((value) => value !== "Unknown")
            .join(", ") || "Location details unavailable"}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <section className="card">
          <h2 className="mb-5 text-xl font-medium text-slate-900">
            Station Details
          </h2>
          <dl className="space-y-3">
            <DetailRow label="Station Name" value={details.title} />
            <DetailRow label="Operator" value={details.operatorName} />
            <DetailRow label="Address" value={details.address} />
            <DetailRow label="City" value={details.city} />
            <DetailRow label="Province" value={details.province} />
            <DetailRow
              label="Coordinates"
              value={
                <>
                  {details.coordinates}
                  {details.mapHref && (
                    <>
                      {" / "}
                      <a
                        href={details.mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 underline hover:text-sky-900"
                      >
                        OpenStreetMap
                      </a>
                    </>
                  )}
                </>
              }
            />
            <DetailRow
              label="Source"
              value={
                <>
                  {details.sourceName}
                  {details.safeSourceUrl && (
                    <>
                      {" / "}
                      <a
                        href={details.safeSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 underline hover:text-sky-900"
                      >
                        original
                      </a>
                    </>
                  )}
                </>
              }
            />
            <DetailRow label="Last Updated" value={details.lastUpdated} />
          </dl>
        </section>

        <section className="card">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium text-slate-900">Connectors</h2>
            <span className="badge">{details.connectorCount} connectors</span>
          </div>

          {details.connectors.length === 0 ? (
            <p className="muted text-sm">No connector details imported.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Connector Type</th>
                    <th className="px-4 py-3 font-medium">Power</th>
                    <th className="px-4 py-3 font-medium">AC/DC</th>
                    <th className="px-4 py-3 font-medium">Import Date</th>
                    <th className="px-4 py-3 font-medium">
                      Source Updated Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {details.connectors.map((connector) => (
                    <tr key={connector.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {connector.type}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {connector.power}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {connector.currentType}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {connector.importedAt}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {connector.sourceUpdatedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="card mt-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-medium text-slate-900">Data Quality</h2>
          <span className="badge">
            {details.quality.completeness.scorePercent}% complete
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Completeness</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {details.quality.completeness.presentFieldCount} of{" "}
              {details.quality.completeness.totalFieldCount} fields present
            </dd>
            <dd className="muted mt-2 text-sm">
              {details.quality.completeness.missingFields.length === 0
                ? "No missing fields."
                : `Missing: ${details.quality.completeness.missingFields.join(", ")}`}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Freshness</dt>
            <dd className="mt-1">
              <StationFreshnessIndicator freshness={details.quality.freshness} />
            </dd>
            <dd className="muted mt-2 text-sm">
              {details.quality.freshness.bucket === "unknown"
                ? "No source timestamp or import date is available for this station."
                : `Based on ${details.quality.freshnessSourceLabel} (${details.quality.freshnessReferenceDate}).`}
            </dd>
          </div>
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="mb-5 text-xl font-medium text-slate-900">
          Operating Hours &amp; Accessibility
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Opening hours</dt>
            <dd className="mt-1 space-y-1 font-medium text-slate-900">
              {details.operatingHours.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </dd>
            {details.closingPeriods && details.closingPeriods.length > 0 && (
              <dd className="muted mt-2 text-sm">
                Scheduled closures:{" "}
                {details.closingPeriods.join("; ")}
              </dd>
            )}
          </div>

          <div>
            <dt className="text-sm text-slate-500">Accessibility</dt>
            <dd
              className={
                details.hasAccessibilityInfo
                  ? "mt-1 font-medium text-slate-900"
                  : "muted mt-1"
              }
            >
              {details.accessibility}
            </dd>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-slate-100 p-6 text-sm text-slate-600">
        <p>Connector Count: {details.connectorCount}</p>
        <p className="mt-1">Import Date: {details.importedAt}</p>
        <p className="mt-1">Source Updated Date: {details.sourceUpdatedAt}</p>
      </section>
    </main>
  );
}
