import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import AnimatedCount from "@/components/ui/CountUp";
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
import { buildFallbackVehiclesData } from "@/features/ev/fallback-vehicles";
import { throwIfBudgetPaused } from "@/lib/budget/budget-level";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/database-unavailable";
import { formatDisplayDate } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { loadFallbackVehicles } from "@/lib/fallback/vehicles-snapshot";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { ArrowRightIcon, CarFrontIcon, SearchIcon, TagIcon } from "lucide-react";

export const revalidate = 3600;

const isFilteredView = (
  filters: ReturnType<typeof parseVehicleSearchParams>,
): boolean => Boolean(filters.q || filters.brand) || filters.page > 1;

const PAGE_SIZE = 24;

const loadVehiclesData = async (filters: ReturnType<typeof parseVehicleSearchParams>) => {
  await throwIfBudgetPaused("all");
  return getVehiclesData(filters);
};

const getVehiclesData = (filters: ReturnType<typeof parseVehicleSearchParams>) =>
  unstable_cache(
    async () => {
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
    [
      "vehicles-page-data",
      filters.q || "",
      filters.brand || "",
      filters.page.toString(),
    ],
    { revalidate: 3600 },
  )();

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<VehicleSearchParams>;
}): Promise<Metadata> => {
  const t = await getTranslations("vehicles");
  const filters = parseVehicleSearchParams(await searchParams);

  if (isFilteredView(filters)) {
    return {
      title: t("title") || "Electric Vehicles & EV Models - evsource.pl",
      description: t("description") || "Porównaj 2000+ modeli pojazdów elektrycznych. Zasięg, pojemność baterii, czas ładowania, ceny i specyfikacje.",
      alternates: { canonical: "/vehicles" },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: t("title") || "Electric Vehicles & EV Models - evsource.pl",
    description: t("description") || "Porównaj 2000+ modeli pojazdów elektrycznych. Zasięg, pojemność baterii, czas ładowania, ceny i specyfikacje.",
    alternates: { canonical: "/vehicles" },
  };
};

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
    className={`flex shrink-0 items-center justify-center rounded-full border border-forest/15 bg-cream text-[0.62rem] font-bold uppercase leading-none text-forest ${
      size === "sm" ? "h-6 w-6" : "h-11 w-11"
    }`}
    title={brandName}
  >
    {brandMark.kind === "icon" ? (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"}
      >
        <path fill="currentColor" d={brandMark.path} />
      </svg>
    ) : (
      <span
        className={
          size === "sm" ? "max-w-5 truncate px-0.5" : "max-w-9 truncate px-1"
        }
      >
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

  let topBrands: Awaited<ReturnType<typeof getTopVehicleBrands>> = [];

  const { vehicles, total, brands } = await loadVehiclesData(filters).catch(async (error: unknown) => {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn("vehicles: database unavailable, serving snapshot");
    const snapshot = await loadFallbackVehicles();
    return buildFallbackVehiclesData(snapshot.vehicles, filters, PAGE_SIZE, snapshot.generatedAt);
  });
  const data = { vehicles, total };
  topBrands = brands;

  const totalPages = Math.ceil(data.total / PAGE_SIZE);
  const vehicleCount = data.total;

  const getActiveBrandLabel = () => {
    if (!filters.brand) return t("allBrandsLabel");

    const brand = topBrands.find((b) => b.slug === filters.brand);
    if (brand?.name) return brand.name;

    if (data.vehicles.length === 0) return "-";
    return data.vehicles[0]?.brand.name || "-";
  };

  const activeBrandLabel = getActiveBrandLabel();

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-5xl">
            {t("title")}
          </h1>
          <p className="muted mt-4 max-w-2xl text-lg">
            {t("descriptionWithCount", { count: data.total })}
          </p>
        </div>
        <form className="flex w-full max-w-xl items-center gap-2" role="search">
          <div className="relative flex-1">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest/70"
            />
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="field-control !pl-10"
            />
          </div>
          <Button type="submit">{t("searchButton")}</Button>
        </form>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <Card className="flex items-center gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-sun">
            <CarFrontIcon size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight text-forest">
              <AnimatedCount end={vehicleCount} />
            </p>
            <p className="muted text-sm">{t("availableVehicles")}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun text-forest">
            <TagIcon size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-3xl font-semibold tracking-tight text-forest">
              {activeBrandLabel}
            </p>
            <p className="muted text-sm">{t("activeFilter")}</p>
          </div>
        </Card>
      </section>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest/70">
        {t("browseByBrand")}
      </h2>

      {topBrands.length > 0 && (
        <div className="-mx-5 mb-10 flex flex-nowrap gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
          <Button
            as={Link}
            href={buildVehicleSearchHref({ ...filters, brand: undefined }, 1)}
            variant={filters.brand ? "secondary" : "primary"}
            className="shrink-0"
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
                className="shrink-0"
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

      {data.vehicles.length === 0 ? (
        <Notice title={t("noResultsTitle")}>
          <p className="muted mt-2">{t("noResultsBody")}</p>
        </Notice>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.vehicles.map((vehicle) => {
            const brandMark = buildBrandMark(vehicle.brand.name);
            const chargingCost = buildChargingCostEstimate(
              vehicle.specs?.batteryCapacityKwhNet ?? null,
            );

            const specChips = [
              typeof vehicle.specs?.batteryCapacityKwhNet === "number"
                ? `${vehicle.specs.batteryCapacityKwhNet} kWh`
                : null,

              typeof vehicle.specs?.dcMaxPowerKw === "number"
                ? `${vehicle.specs.dcMaxPowerKw} kW`
                : null,
            ].filter(Boolean);

            return (
              <Card
                key={vehicle.id}
                as={Link}
                href={`/vehicles/${vehicle.id}`}
                interactive
                className="group flex flex-col focus-visible:outline-forest"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-forest/70">
                      {vehicle.brand.name}
                    </div>

                    <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-forest">
                      {vehicle.modelName}
                    </h2>

                    {vehicle.variantName && (
                      <p className="mt-1 text-sm text-forest/70">
                        {vehicle.variantName}
                      </p>
                    )}
                  </div>
                  <BrandLogo
                    brandMark={brandMark}
                    brandName={vehicle.brand.name}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {vehicle.specs?.rangeWltpKm && (
                    <span className="rounded-full bg-sun px-3 py-1 text-xs font-semibold text-forest">
                      {vehicle.specs.rangeWltpKm} km WLTP
                    </span>
                  )}

                  {specChips.length > 0 && (
                    <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
                      {specChips.join(" · ")}
                    </span>
                  )}
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-forest/10 pt-4 text-sm">
                  <div>
                    <dt className="text-forest/70">{t("drivetrainLabel")}</dt>
                    <dd className="mt-0.5 font-medium text-forest">
                      {localizeFallback(
                        formatDrivetrainLabel(vehicle.specs?.drivetrain),
                        tCommon,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-forest/70">{t("chargingCostLabel")}</dt>
                    <dd className="mt-0.5 font-medium text-forest">
                      {chargingCost
                        ? t("chargingCostFromLabel", {
                            price: chargingCost.dcCostRangePln![0],
                          })
                        : tCommon("notAvailable")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <p className="text-xs text-forest/70">
                    {vehicle.sourceName.toUpperCase()} •{" "}
                    {formatDisplayDate(vehicle.importedAt, locale)}
                  </p>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition-all duration-300 group-hover:rotate-45 group-hover:bg-sun group-hover:text-forest">
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label={tCommon("pagination")} className="mt-12 flex items-center justify-center gap-3">
          {filters.page > 1 && (
            <Button
              as={Link}
              href={buildVehicleSearchHref(filters, filters.page - 1)}
              variant="secondary"
            >
              {tCommon("previous")}
            </Button>
          )}
          <div className="px-2 text-sm text-forest/70">
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
        </nav>
      )}
    </main>
  );
}
