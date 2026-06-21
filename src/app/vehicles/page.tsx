import { prisma } from "@/lib/db/prisma";
import {
  buildBrandMark,
  buildVehicleSearchHref,
  buildVehicleWhere,
  formatDrivetrainLabel,
  parseVehicleSearchParams,
  type VehicleSearchParams,
} from "@/features/ev/vehicle-search";
import Link from "next/link";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type VehicleListItem = Prisma.EvModelGetPayload<{
  include: {
    brand: true;
    specs: true;
  };
}>;

const formatDate = (value: Date | null | undefined) => {
  if (!value) {
    return "unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
};

const BrandLogo = ({
  brandMark,
  brandName,
}: {
  brandMark: ReturnType<typeof buildBrandMark>;
  brandName: string;
}) => (
  <span
    aria-label={`${brandName} logo`}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[0.62rem] font-bold uppercase leading-none text-slate-700"
    style={
      brandMark.kind === "icon"
        ? { borderColor: `#${brandMark.hex}` }
        : undefined
    }
    title={brandName}
  >
    {brandMark.kind === "icon" ? (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 text-slate-800"
      >
        <path fill="currentColor" d={brandMark.path} />
      </svg>
    ) : (
      <span className="max-w-9 truncate px-1">{brandMark.title}</span>
    )}
  </span>
);

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<VehicleSearchParams>;
}) {
  const filters = parseVehicleSearchParams(await searchParams);
  const skip = (filters.page - 1) * PAGE_SIZE;
  const where = buildVehicleWhere(filters);

  let data:
    | {
        vehicles: VehicleListItem[];
        total: number;
      }
    | { error: string };

  try {
    const [vehicles, total] = await Promise.all([
      prisma.evModel.findMany({
        where,
        include: {
          brand: true,
          specs: true,
        },
        orderBy: [
          { brand: { name: "asc" } },
          { modelName: "asc" },
        ],
        take: PAGE_SIZE,
        skip,
      }),
      prisma.evModel.count({ where }),
    ]);

    data = { vehicles, total };
  } catch {
    data = {
      error:
        "EV catalog data is not available yet. Configure the database and run the OpenEV import.",
    };
  }

  const totalPages = "error" in data ? 0 : Math.ceil(data.total / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vehicles</h1>
          <p className="muted mt-1 text-slate-500">
            {"error" in data
              ? "Browse electric vehicles after the catalog import is configured."
              : `Browse ${data.total} electric vehicles in our database.`}
          </p>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search vehicles..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Search
          </button>
        </form>
      </div>

      {"error" in data ? (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="mb-2 text-lg font-medium">Setup required</h2>
          <p>{data.error}</p>
        </section>
      ) : data.vehicles.length === 0 ? (
        <section className="card text-center">
          <h2 className="text-lg font-medium">No vehicles found</h2>
          <p className="muted mt-2">
            Try a broader brand or model search.
          </p>
        </section>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.vehicles.map((vehicle) => {
            const brandMark = buildBrandMark(vehicle.brand.name);

            return (
              <Link
                key={vehicle.id}
                href={`/vehicles/${vehicle.id}`}
                className="group block rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      {vehicle.brand.name}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                      {vehicle.modelName}
                    </h2>
                    {vehicle.variantName && (
                      <p className="text-sm text-slate-600">
                        {vehicle.variantName}
                      </p>
                    )}
                  </div>
                  <BrandLogo
                    brandMark={brandMark}
                    brandName={vehicle.brand.name}
                  />
                </div>

                <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Range (WLTP)</dt>
                  <dd className="font-medium text-slate-900">
                    {vehicle.specs?.rangeWltpKm
                      ? `${vehicle.specs.rangeWltpKm} km`
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Battery Net</dt>
                  <dd className="font-medium text-slate-900">
                    {vehicle.specs?.batteryCapacityKwhNet
                      ? `${vehicle.specs.batteryCapacityKwhNet} kWh`
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">DC Charge</dt>
                  <dd className="font-medium text-slate-900">
                    {vehicle.specs?.dcMaxPowerKw
                      ? `${vehicle.specs.dcMaxPowerKw} kW`
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Drivetrain</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDrivetrainLabel(vehicle.specs?.drivetrain)}
                  </dd>
                </div>
                </dl>

                <p className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Source {vehicle.sourceName} / imported{" "}
                  {formatDate(vehicle.importedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {filters.page > 1 && (
            <Link
              href={buildVehicleSearchHref(filters, filters.page - 1)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Previous
            </Link>
          )}
          <div className="flex items-center px-4 text-sm text-slate-500">
            Page {filters.page} of {totalPages}
          </div>
          {filters.page < totalPages && (
            <Link
              href={buildVehicleSearchHref(filters, filters.page + 1)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
