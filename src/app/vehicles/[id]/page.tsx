import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";

import Card from "@/components/ui/Card";
import {
  buildChargingCostEstimate,
  buildWinterRangeNote,
  formatPlnRange,
} from "@/features/ev/charging-cost";
import {
  buildVehicleProductJsonLd,
  buildVehicleSeoHighlights,
} from "@/features/ev/vehicle-seo";
import { buildFallbackVehicleDetail } from "@/features/ev/fallback-vehicles";
import { formatDrivetrainLabel } from "@/features/ev/vehicle-search";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/database-unavailable";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { loadFallbackVehicles } from "@/lib/fallback/vehicles-snapshot";
import type { SupportedLocale } from "@/lib/i18n/constants";
import BackLink from "@/components/ui/BackLink";
import { BatteryChargingIcon, GaugeIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const getCachedVehicleById = cache((id: string) =>
  prisma.evModel.findUnique({
    where: { id },
    include: {
      brand: true,
      specs: true,
    },
  }),
);

const decodeRouteId = (id: string) => {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
};

const loadVehicle = async (id: string) => {
  try {
    return { vehicle: await getCachedVehicleById(id), fromSnapshot: false };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn("vehicle detail: database unavailable, serving snapshot");
    const snapshot = await loadFallbackVehicles();
    const vehicle = buildFallbackVehicleDetail(snapshot.vehicles, decodeRouteId(id), snapshot.generatedAt);
    if (!vehicle) throw error;
    return { vehicle, fromSnapshot: true };
  }
};

const buildVehicleSeoName = (vehicle: {
  brand: { name: string };
  modelName: string;
  variantName: string | null;
}) =>
  [vehicle.brand.name, vehicle.modelName, vehicle.variantName]
    .filter(Boolean)
    .join(" ");

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const { vehicle, fromSnapshot } = await loadVehicle(id);

  if (!vehicle) {
    return { robots: { index: false, follow: false } };
  }

  const indexing = fromSnapshot
    ? { robots: { index: false, follow: true } }
    : { alternates: { canonical: `/vehicles/${id}` } };

  const t = await getTranslations("vehicleDetail");
  const vehicleName = buildVehicleSeoName(vehicle);
  const chargingCost = buildChargingCostEstimate(
    vehicle.specs?.batteryCapacityKwhNet ?? null,
  );
  const highlights = buildVehicleSeoHighlights({
    rangeWltpKm: vehicle.specs?.rangeWltpKm ?? null,
    chargingCost,
  });

  if (highlights.length === 0) {
    return {
      title: t("metaTitleFallback", { vehicleName }),
      description: t("metaDescriptionFallback", { vehicleName }),
      ...indexing,
    };
  }

  const highlightText = highlights
    .map((highlight) =>
      highlight.kind === "range"
        ? t("metaHighlightRange", { rangeKm: highlight.rangeKm })
        : t("metaHighlightCost", { costFrom: highlight.costFromPln }),
    )
    .join(" · ");

  return {
    title: t("metaTitle", { vehicleName, highlights: highlightText }),
    description: t("metaDescription", {
      vehicleName,
      highlights: highlightText,
    }),
    ...indexing,
  };
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-forest/10 pb-3 last:border-none last:pb-0">
    <dt className="text-forest/70">{label}</dt>
    <dd className="text-right font-medium text-forest">{value}</dd>
  </div>
);

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("vehicleDetail");
  const tCommon = await getTranslations("common");

  const { vehicle } = await loadVehicle(id);

  if (!vehicle) {
    notFound();
  }

  const safeSourceUrl = getSafeHttpUrl(vehicle.sourceUrl);
  const notAvailable = tCommon("notAvailable");
  const winterRange = buildWinterRangeNote(vehicle.specs?.rangeWltpKm ?? null);
  const chargingCost = buildChargingCostEstimate(
    vehicle.specs?.batteryCapacityKwhNet ?? null,
  );
  const productJsonLd = buildVehicleProductJsonLd({
    name: buildVehicleSeoName(vehicle),
    brandName: vehicle.brand.name,
    properties: [
      {
        label: t("rangeWltpLabel"),
        value: vehicle.specs?.rangeWltpKm
          ? `${vehicle.specs.rangeWltpKm} km`
          : null,
      },
      {
        label: t("batteryNetLabel"),
        value: vehicle.specs?.batteryCapacityKwhNet
          ? `${vehicle.specs.batteryCapacityKwhNet} kWh`
          : null,
      },
      {
        label: t("dcFastLabel"),
        value:
          typeof vehicle.specs?.dcMaxPowerKw === "number"
            ? `${vehicle.specs.dcMaxPowerKw} kW`
            : null,
      },
      {
        label: t("acChargingLabel"),
        value:
          typeof vehicle.specs?.acMaxPowerKw === "number"
            ? `${vehicle.specs.acMaxPowerKw} kW`
            : null,
      },
    ],
  });

  return (
    <main className="page-shell max-w-4xl pb-20 pt-12 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <BackLink href="/vehicles" label={t("backLink")} />

      <header className="mb-10">
        <div className="text-xs font-semibold uppercase tracking-wider text-forest/70">
          {vehicle.brand.name}
        </div>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-5xl">
          {vehicle.modelName}
        </h1>
        {vehicle.variantName && (
          <p className="mt-2 text-xl text-forest/70">{vehicle.variantName}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {vehicle.specs?.rangeWltpKm && (
            <span className="rounded-full bg-sun px-3.5 py-1.5 text-sm font-semibold text-forest">
              {vehicle.specs.rangeWltpKm} km WLTP
            </span>
          )}
          {vehicle.specs?.batteryCapacityKwhNet && (
            <span className="rounded-full bg-forest/10 px-3.5 py-1.5 text-sm font-medium text-forest">
              {vehicle.specs.batteryCapacityKwhNet} kWh
            </span>
          )}

          {vehicle.specs?.dcMaxPowerKw && (
            <span className="rounded-full bg-forest/10 px-3.5 py-1.5 text-sm font-medium text-forest">
              {vehicle.specs.dcMaxPowerKw} kW DC
            </span>
          )}

          {vehicle.specs?.systemPowerKw && (
            <span className="rounded-full bg-forest/10 px-3.5 py-1.5 text-sm font-medium text-forest">
              {vehicle.specs.systemPowerKw} kW
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card as="section">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-sun">
              <GaugeIcon size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
              {t("batteryRangeTitle")}
            </h2>
          </div>
          <dl className="space-y-3 text-sm">
            <DetailRow
              label={t("rangeWltpLabel")}
              value={
                vehicle.specs?.rangeWltpKm
                  ? `${vehicle.specs.rangeWltpKm} km`
                  : notAvailable
              }
            />
            <DetailRow
              label={t("winterRangeLabel")}
              value={
                winterRange
                  ? `${winterRange.lowKm}-${winterRange.highKm} km`
                  : notAvailable
              }
            />
            <DetailRow
              label={t("rangeEpaLabel")}
              value={
                vehicle.specs?.rangeEpaKm
                  ? `${vehicle.specs.rangeEpaKm} km`
                  : notAvailable
              }
            />
            <DetailRow
              label={t("batteryNetLabel")}
              value={
                vehicle.specs?.batteryCapacityKwhNet
                  ? `${vehicle.specs.batteryCapacityKwhNet} kWh`
                  : notAvailable
              }
            />
            <DetailRow
              label={t("batteryGrossLabel")}
              value={
                vehicle.specs?.batteryCapacityKwhGross
                  ? `${vehicle.specs.batteryCapacityKwhGross} kWh`
                  : notAvailable
              }
            />
          </dl>
        </Card>

        <Card as="section">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun text-forest">
              <BatteryChargingIcon size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-semibold tracking-tight text-forest">
              {t("chargingPerformanceTitle")}
            </h2>
          </div>
          <dl className="space-y-3 text-sm">
            <DetailRow
              label={t("dcFastLabel")}
              value={
                vehicle.specs?.dcMaxPowerKw
                  ? `${vehicle.specs.dcMaxPowerKw} kW`
                  : notAvailable
              }
            />
            <DetailRow
              label={t("acChargingLabel")}
              value={
                vehicle.specs?.acMaxPowerKw
                  ? `${vehicle.specs.acMaxPowerKw} kW`
                  : notAvailable
              }
            />
            <DetailRow
              label={t("drivetrainLabel")}
              value={localizeFallback(
                formatDrivetrainLabel(vehicle.specs?.drivetrain),
                tCommon,
              )}
            />
            <DetailRow
              label={t("systemPowerLabel")}
              value={
                vehicle.specs?.systemPowerKw
                  ? `${vehicle.specs.systemPowerKw} kW`
                  : notAvailable
              }
            />
            <DetailRow
              label={t("primaryConnectorLabel")}
              value={vehicle.specs?.primaryConnector || notAvailable}
            />
            <DetailRow
              label={t("chargingCostAcLabel")}
              value={
                chargingCost
                  ? formatPlnRange(chargingCost.acCostRangePln!)
                  : notAvailable
              }
            />
            <DetailRow
              label={t("chargingCostDcLabel")}
              value={
                chargingCost
                  ? formatPlnRange(chargingCost.dcCostRangePln!)
                  : notAvailable
              }
            />
          </dl>
        </Card>
      </div>

      {chargingCost && (
        <p className="mt-4 text-sm text-forest/70">
          {t("chargingCostDisclaimer")}
        </p>
      )}

      <div className="mt-8 rounded-[1.5rem] bg-forest/5 p-6 text-sm text-forest/70">
        <p>
          {t("dataSourceLabel", { source: vehicle.sourceName.toUpperCase() })}
          {safeSourceUrl && (
            <>
              {" · "}
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-forest focus-visible:outline-forest"
              >
                {t("originalSourceLink")}
              </a>
            </>
          )}
        </p>
        <p className="mt-1">
          {t("lastImportedLabel", {
            date: formatDisplayDate(vehicle.importedAt, locale),
          })}
        </p>
      </div>
    </main>
  );
}
