import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await prisma.evModel.findUnique({
    where: { id },
    include: {
      brand: true,
      specs: true,
    },
  });

  if (!vehicle) {
    notFound();
  }

  const safeSourceUrl = getSafeHttpUrl(vehicle.sourceUrl);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/vehicles"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          &larr; Back to vehicles
        </Link>
      </div>

      <header className="mb-10">
        <div className="text-lg font-medium text-slate-500">
          {vehicle.brand.name}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          {vehicle.modelName}
        </h1>
        {vehicle.variantName && (
          <p className="mt-2 text-xl text-slate-600">{vehicle.variantName}</p>
        )}
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-medium text-slate-900">Battery & Range</h2>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Range (WLTP)</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.rangeWltpKm ? `${vehicle.specs.rangeWltpKm} km` : "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Range (EPA)</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.rangeEpaKm ? `${vehicle.specs.rangeEpaKm} km` : "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Battery Capacity (Net)</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.batteryCapacityKwhNet
                  ? `${vehicle.specs.batteryCapacityKwhNet} kWh`
                  : "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Battery Capacity (Gross)</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.batteryCapacityKwhGross
                  ? `${vehicle.specs.batteryCapacityKwhGross} kWh`
                  : "N/A"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-medium text-slate-900">Charging & Performance</h2>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">DC Fast Charging (Max)</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.dcMaxPowerKw ? `${vehicle.specs.dcMaxPowerKw} kW` : "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">AC Charging (Max)</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.acMaxPowerKw ? `${vehicle.specs.acMaxPowerKw} kW` : "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Drivetrain</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.drivetrain || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">System Power</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.systemPowerKw ? `${vehicle.specs.systemPowerKw} kW` : "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Primary Connector</dt>
              <dd className="font-medium text-slate-900">
                {vehicle.specs?.primaryConnector || "N/A"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-8 rounded-xl bg-slate-100 p-6 text-sm text-slate-500">
        <p>
          Data source: {vehicle.sourceName}
          {safeSourceUrl && (
            <>
              {" · "}
              <a href={safeSourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900">
                Original source
              </a>
            </>
          )}
        </p>
        <p className="mt-1">
          Last imported: {formatDisplayDate(vehicle.importedAt)}
        </p>
      </div>
    </main>
  );
}
