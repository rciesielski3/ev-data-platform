import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import StationLocationMapClient from "@/app/stations/[id]/station-location-map-client";
import { buildStationDetails } from "@/features/charging/station-details";
import { StationFreshnessIndicator } from "@/features/charging/station-quality-badge";
import { prisma } from "@/lib/db/prisma";
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
  <div className="border-b border-slate-100 pb-3">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="mt-1 font-medium text-slate-900">{value}</dd>
  </div>
);

const FRESHNESS_SOURCE_KEYS: Record<string, string> = {
  "source timestamp": "freshnessSourceTimestamp",
  "import date": "freshnessImportDate",
  unknown: "freshnessUnknownSource",
};

export default async function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("stationDetail");
  const tCommon = await getTranslations("common");

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

  const details = buildStationDetails(station, locale);
  const locationLine =
    [details.address, details.city, details.province]
      .filter((value) => value !== "Unknown")
      .join(", ") || tCommon("locationUnavailable");

  const freshnessSourceKey =
    FRESHNESS_SOURCE_KEYS[details.quality.freshnessSourceLabel];

  const missingFieldLabels = details.quality.completeness.missingFields.map(
    (field) => t(`completenessFields.${field}` as Parameters<typeof t>[0]),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/stations"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          {t("backLink")}
        </Link>
      </div>

      <header className="mb-10">
        <p className="text-lg font-medium text-emerald-700">
          {localizeFallback(details.operatorName, tCommon)}
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold tracking-tight text-slate-950">
          {details.title === "Charging station"
            ? tCommon("chargingStationFallback")
            : details.title}
        </h1>
        <p className="muted mt-3 max-w-3xl">{locationLine}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <Card as="section">
          <h2 className="font-display mb-5 text-xl font-semibold text-slate-900">
            {t("stationDetailsTitle")}
          </h2>
          <dl className="space-y-3">
            <DetailRow
              label={t("stationNameLabel")}
              value={
                details.title === "Charging station"
                  ? tCommon("chargingStationFallback")
                  : details.title
              }
            />
            <DetailRow
              label={t("operatorLabel")}
              value={localizeFallback(details.operatorName, tCommon)}
            />
            <DetailRow
              label={t("addressLabel")}
              value={localizeFallback(details.address, tCommon)}
            />
            <DetailRow
              label={t("cityLabel")}
              value={localizeFallback(details.city, tCommon)}
            />
            <DetailRow
              label={t("provinceLabel")}
              value={localizeFallback(details.province, tCommon)}
            />
            <DetailRow
              label={t("coordinatesLabel")}
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
                        className="text-emerald-700 underline hover:text-emerald-900"
                      >
                        {t("openStreetMapLink")}
                      </a>
                    </>
                  )}
                </>
              }
            />
            <DetailRow
              label={t("sourceLabel")}
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
                        className="text-emerald-700 underline hover:text-emerald-900"
                      >
                        {t("originalLink")}
                      </a>
                    </>
                  )}
                </>
              }
            />
            <DetailRow
              label={t("lastUpdatedLabel")}
              value={localizeFallback(details.lastUpdated, tCommon)}
            />
          </dl>
        </Card>

        <Card as="section">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium text-slate-900">
              {t("connectorsTitle")}
            </h2>
            <Badge>{t("connectorsCount", { count: details.connectors.length })}</Badge>
          </div>

          {details.connectors.length === 0 ? (
            <p className="muted text-sm">{t("noConnectorsImported")}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("connectorTypeHeader")}
                    </th>
                    <th className="px-4 py-3 font-medium">{t("powerHeader")}</th>
                    <th className="px-4 py-3 font-medium">
                      {t("currentTypeHeader")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("importDateHeader")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("sourceUpdatedHeader")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {details.connectors.map((connector) => (
                    <tr key={connector.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {localizeFallback(connector.type, tCommon)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {localizeFallback(connector.power, tCommon)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {localizeFallback(connector.currentType, tCommon)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {localizeFallback(connector.importedAt, tCommon)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {localizeFallback(connector.sourceUpdatedAt, tCommon)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {details.mapHref && (
        <Card as="section" className="mt-6">
          <h2 className="mb-5 text-xl font-medium text-slate-900">
            {t("locationMapTitle")}
          </h2>
          <StationLocationMapClient
            latitude={station.latitude}
            longitude={station.longitude}
            title={
              details.title === "Charging station"
                ? tCommon("chargingStationFallback")
                : details.title
            }
          />
        </Card>
      )}

      <Card as="section" className="mt-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-medium text-slate-900">
            {t("dataQualityTitle")}
          </h2>
          <Badge>
            {`${details.quality.completeness.scorePercent}%`}
          </Badge>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">
              {t("completenessLabel")}
            </dt>
            <dd className="mt-1 font-medium text-slate-900">
              {t("fieldsPresent", {
                present: details.quality.completeness.presentFieldCount,
                total: details.quality.completeness.totalFieldCount,
              })}
            </dd>
            <dd className="muted mt-2 text-sm">
              {details.quality.completeness.missingFields.length === 0
                ? t("noMissingFields")
                : t("missingFields", { list: missingFieldLabels.join(", ") })}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">{t("freshnessLabel")}</dt>
            <dd className="mt-1">
              <StationFreshnessIndicator freshness={details.quality.freshness} />
            </dd>
            <dd className="muted mt-2 text-sm">
              {details.quality.freshness.bucket === "unknown"
                ? t("freshnessNoTimestamp")
                : t("freshnessBasedOn", {
                    source: t(freshnessSourceKey),
                    date: details.quality.freshnessReferenceDate ?? "",
                  })}
            </dd>
          </div>
        </div>
      </Card>

      <Card as="section" className="mt-6">
        <h2 className="mb-5 text-xl font-medium text-slate-900">
          {t("hoursAccessibilityTitle")}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">{t("openingHoursLabel")}</dt>
            <dd className="mt-1 space-y-1 font-medium text-slate-900">
              {details.hasOperatingHoursInfo
                ? details.operatingHours.map((line) => <p key={line}>{line}</p>)
                : <p className="muted">{t("notProvidedBySource")}</p>}
            </dd>
            {details.closingPeriods && details.closingPeriods.length > 0 && (
              <dd className="muted mt-2 text-sm">
                {t("scheduledClosures", {
                  periods: details.closingPeriods.join("; "),
                })}
              </dd>
            )}
          </div>

          <div>
            <dt className="text-sm text-slate-500">{t("accessibilityLabel")}</dt>
            <dd
              className={
                details.hasAccessibilityInfo
                  ? "mt-1 font-medium text-slate-900"
                  : "muted mt-1"
              }
            >
              {details.hasAccessibilityInfo
                ? details.accessibility
                : t("notProvidedBySource")}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">
              {t("paymentMethodsLabel")}
            </dt>
            <dd
              className={
                details.hasPaymentMethodsInfo
                  ? "mt-1 space-y-1 font-medium text-slate-900"
                  : "muted mt-1"
              }
            >
              {details.hasPaymentMethodsInfo
                ? details.paymentMethods.map((line) => <p key={line}>{line}</p>)
                : t("notProvidedBySource")}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">{t("authMethodsLabel")}</dt>
            <dd
              className={
                details.hasAuthMethodsInfo
                  ? "mt-1 space-y-1 font-medium text-slate-900"
                  : "muted mt-1"
              }
            >
              {details.hasAuthMethodsInfo
                ? details.authMethods.map((line) => <p key={line}>{line}</p>)
                : t("notProvidedBySource")}
            </dd>
          </div>
        </div>
      </Card>

      <section className="mt-6 rounded-xl bg-slate-100 p-6 text-sm text-slate-600">
        <p>{t("connectorCountSummary", { count: details.connectorCount })}</p>
        <p className="mt-1">
          {t("importDateSummary", {
            date: localizeFallback(details.importedAt, tCommon),
          })}
        </p>
        <p className="mt-1">
          {t("sourceUpdatedSummary", {
            date: localizeFallback(details.sourceUpdatedAt, tCommon),
          })}
        </p>
      </section>
    </main>
  );
}
