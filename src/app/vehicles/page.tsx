import { Prisma } from "@prisma/client";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { filterInputClassName } from "@/components/ui/FilterField";
import { buildChargingCostEstimate } from "@/features/ev/charging-cost";
import {
  buildBrandMark,
  buildVehicleSearchHref,
  buildVehicleWhere,
  formatDrivetrainLabel,
  getTopVehicleBrands,
  parseVehicleSearchParams,
  type VehicleSearchParams,
} from "@/features/ev/vehicle-search";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import type { SupportedLocale } from "@/lib/i18n/constants";

export const revalidate = 3600;

const PAGE_SIZE = 24;

type VehicleListItem = Prisma.EvModelGetPayload<{
  include: {
    brand: true;
    specs: true;
  };
}>;

const getVehiclesData = unstable_cache(
  async (filters: ReturnType<typeof parseVehicleSearchParams>) => {
    const skip = (filters.page - 1) * PAGE_SIZE;
    const where = buildVehicleWhere(filters);

    const [vehicles, total, brands] = await Promise.all([
      prisma.evModel.findMany({
        where,
        include: {
          brand: true,
          specs: true,
        },
        orderBy: [{ brand: { name: "asc" } }, { modelName: "asc" }],
        take: PAGE_SIZE,
        skip,
      }),
      prisma.evModel.count({ where }),
      getTopVehicleBrands(),
    ]);

    return { vehicles, total, brands };
  },
  ["vehicles-page-data"],
  { revalidate: 3600 },
);

const BrandLogo = ({
  brandMark,
  brandName,
  size = "md",
}: {
  brandMark: ReturnType<typeof buildBrandMark>;
  brandName: string;
  size?: "sm" | "md";
}) => (
  <span
    aria-label={`${brandName} logo`}
    className={`flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[0.62rem] font-bold uppercase leading-none text-slate-700 ${
      size === "sm" ? "h-6 w-6" : "h-10 w-10"
    }`}
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
        className={size === "sm" ? "h-3.5 w-3.5 text-slate-800" : "h-5 w-5 text-slate-800"}
      >
        <path fill="currentColor" d={brandMark.path} />
      </svg>
    ) : (
      <span className={size === "sm" ? "max-w-5 truncate px-0.5" : "max-w-9 truncate px-1"}>
        {brandMark.title}
      </span>
    )}
  </span>
);

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<VehicleSearchParams>;
}) {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("vehicles");
  const tCommon = await getTranslations("common");

  const filters = parseVehicleSearchParams(await searchParams);

  let data:
    | {
        vehicles: VehicleListItem[];
        total: number;
      }
    | { error: string };
  let topBrands: Awaited<ReturnType<typeof getTopVehicleBrands>> = [];

  try {
    const { vehicles, total, brands } = await getVehiclesData(filters);
    data = { vehicles, total };
    topBrands = brands;
  } catch {
    data = { error: t("setupRequiredMessage") };
  }

  const totalPages = "error" in data ? 0 : Math.ceil(data.total / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        badge={t("badge")}
        title={t("title")}
        description={
          "error" in data
            ? t("descriptionError")
            : t("descriptionWithCount", { count: data.total })
        }
        actions={
          <form className="flex items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder={t("searchPlaceholder")}
              className={filterInputClassName}
            />
            <Button type="submit">{t("searchButton")}</Button>
          </form>
        }
      />

      {topBrands.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            as={Link}
            href={buildVehicleSearchHref({ ...filters, brand: undefined }, 1)}
            variant={filters.brand ? "secondary" : "primary"}
            className={
              filters.brand
                ? "rounded-full"
                : "rounded-full border border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
            }
          >
            {t("allBrandsLabel")}
          </Button>
          {topBrands.map((brand) => {
            const isSelected = filters.brand === brand.slug;
            const brandMark = buildBrandMark(brand.name);

            return (
              <Button
                key={brand.id}
                as={Link}
                href={buildVehicleSearchHref(
                  { ...filters, brand: brand.slug },
                  1,
                )}
                variant={isSelected ? "primary" : "secondary"}
                className={
                  isSelected
                    ? "rounded-full border border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                    : "rounded-full"
                }
              >
                <BrandLogo
                  brandMark={brandMark}
                  brandName={brand.name}
                  size="sm"
                />
                {brand.name}
              </Button>
            );
          })}
        </div>
      )}

      {"error" in data ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{data.error}</p>
        </Notice>
      ) : data.vehicles.length === 0 ? (
        <Notice title={t("noResultsTitle")}>
          <p className="muted mt-2">{t("noResultsBody")}</p>
        </Notice>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.vehicles.map((vehicle) => {
            const brandMark = buildBrandMark(vehicle.brand.name);
            const chargingCost = buildChargingCostEstimate(
              vehicle.specs?.batteryCapacityKwhNet ?? null,
            );

            return (
              <Card
                key={vehicle.id}
                as={Link}
                href={`/vehicles/${vehicle.id}`}
                interactive
                className="group block"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-500">
                      {vehicle.brand.name}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
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
                    <dt className="text-slate-500">{t("rangeWltpLabel")}</dt>
                    <dd className="font-medium text-slate-900">
                      {vehicle.specs?.rangeWltpKm
                        ? `${vehicle.specs.rangeWltpKm} km`
                        : tCommon("notAvailable")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t("batteryNetLabel")}</dt>
                    <dd className="font-medium text-slate-900">
                      {vehicle.specs?.batteryCapacityKwhNet
                        ? `${vehicle.specs.batteryCapacityKwhNet} kWh`
                        : tCommon("notAvailable")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t("dcChargeLabel")}</dt>
                    <dd className="font-medium text-slate-900">
                      {vehicle.specs?.dcMaxPowerKw
                        ? `${vehicle.specs.dcMaxPowerKw} kW`
                        : tCommon("notAvailable")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t("drivetrainLabel")}</dt>
                    <dd className="font-medium text-slate-900">
                      {localizeFallback(
                        formatDrivetrainLabel(vehicle.specs?.drivetrain),
                        tCommon,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t("chargingCostLabel")}</dt>
                    <dd className="font-medium text-slate-900">
                      {chargingCost
                        ? t("chargingCostFromLabel", {
                            price: chargingCost.dcCostRangePln![0],
                          })
                        : tCommon("notAvailable")}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {t("sourceImported", {
                    source: vehicle.sourceName,
                    date: formatDisplayDate(vehicle.importedAt, locale),
                  })}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {filters.page > 1 && (
            <Button
              as={Link}
              href={buildVehicleSearchHref(filters, filters.page - 1)}
              variant="secondary"
            >
              {tCommon("previous")}
            </Button>
          )}
          <div className="flex items-center px-4 text-sm text-slate-500">
            {tCommon("pageOf", { page: filters.page, totalPages })}
          </div>
          {filters.page < totalPages && (
            <Button
              as={Link}
              href={buildVehicleSearchHref(filters, filters.page + 1)}
              variant="secondary"
            >
              {tCommon("next")}
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
