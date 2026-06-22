import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import Card from "@/components/ui/Card";
import { formatDrivetrainLabel } from "@/features/ev/vehicle-search";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate, getSafeHttpUrl } from "@/lib/display/data-display";
import { localizeFallback } from "@/lib/display/localize-fallback";
import type { SupportedLocale } from "@/lib/i18n/constants";

export const dynamic = "force-dynamic";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between border-b border-slate-100 pb-2">
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-medium text-slate-900">{value}</dd>
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
  const notAvailable = tCommon("notAvailable");

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/vehicles"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          {t("backLink")}
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
        <Card as="section">
          <h2 className="mb-4 text-xl font-medium text-slate-900">
            {t("batteryRangeTitle")}
          </h2>
          <dl className="space-y-4 text-sm">
            <DetailRow
              label={t("rangeWltpLabel")}
              value={
                vehicle.specs?.rangeWltpKm
                  ? `${vehicle.specs.rangeWltpKm} km`
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
          <h2 className="mb-4 text-xl font-medium text-slate-900">
            {t("chargingPerformanceTitle")}
          </h2>
          <dl className="space-y-4 text-sm">
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
          </dl>
        </Card>
      </div>

      <div className="mt-8 rounded-xl bg-slate-100 p-6 text-sm text-slate-500">
        <p>
          {t("dataSourceLabel", { source: vehicle.sourceName })}
          {safeSourceUrl && (
            <>
              {" · "}
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-900"
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
