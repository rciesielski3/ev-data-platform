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
import BackLink from "@/components/ui/BackLink";

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

const InfoCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
    <h3 className="mb-3 text-sm font-medium text-slate-500">{title}</h3>

    <div className="space-y-2 text-slate-900">{children}</div>
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
  const normalizedAddress = details.address?.trim() ?? "";

  const normalizedCity = details.city?.trim() ?? "";

  const addressContainsCity =
    normalizedAddress &&
    normalizedCity &&
    normalizedAddress.toLowerCase().includes(normalizedCity.toLowerCase());

  const locationLine =
    [
      normalizedAddress,
      addressContainsCity ? null : normalizedCity,
      details.province !== "Unknown" ? details.province : null,
    ]
      .filter(Boolean)
      .join(", ") || tCommon("locationUnavailable");

  const freshnessSourceKey =
    FRESHNESS_SOURCE_KEYS[details.quality.freshnessSourceLabel];

  const missingFieldLabels = details.quality.completeness.missingFields.map(
    (field) => t(`completenessFields.${field}` as Parameters<typeof t>[0]),
  );

  const paymentMethods = [...new Set(details.paymentMethods)];
  const authMethods = [...new Set(details.authMethods)];
  const closingPeriods = details.closingPeriods ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <BackLink href="/stations" label={t("backLink")} />

      <header className="mb-10">
        <p className="text-lg font-medium text-slate-500">
          {localizeFallback(details.operatorName, tCommon)}
        </p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
          {details.title === "Charging station"
            ? tCommon("chargingStationFallback")
            : details.title}
        </h1>
        <p className="muted mt-3 max-w-3xl">{locationLine}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {details.connectors.length > 0 && (
            <Badge className="rounded-full bg-blue-200 px-3 py-1 text-sm font-medium text-blue-700">
              {t("connectorsCount", { count: details.connectors.length })}
            </Badge>
          )}

          {station.connectors[0]?.powerKw && (
            <Badge className="rounded-full bg-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700">
              {t("upToPower", {
                power: station.connectors[0].powerKw,
              })}
            </Badge>
          )}

          <Badge className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
            {details.quality.completeness.scorePercent}%{" "}
            {t("completenessLabel")}
          </Badge>
        </div>
      </header>

      <Card as="section" className="my-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {t("dataQualityTitle")}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{t("completenessLabel")}</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {details.quality.completeness.scorePercent}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {t("fieldsPresent", {
                present: details.quality.completeness.presentFieldCount,
                total: details.quality.completeness.totalFieldCount,
              })}
            </p>

            {details.quality.completeness.missingFields.length > 0 && (
              <p className="mt-2 text-sm text-slate-500">
                {t("missingFields", {
                  list: missingFieldLabels.join(", "),
                })}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{t("freshnessLabel")}</p>

            <div className="mt-2">
              <StationFreshnessIndicator
                freshness={details.quality.freshness}
              />
            </div>

            <p className="mt-3 text-xs text-slate-600">
              {details.quality.freshness.bucket === "unknown"
                ? t("freshnessNoTimestamp")
                : t("freshnessBasedOn", {
                    source: t(freshnessSourceKey),
                    date: details.quality.freshnessReferenceDate ?? "",
                  })}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card as="section">
          <h2 className="mb-5 text-xl font-medium text-slate-900">
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
              label={t("addressLabel")}
              value={localizeFallback(details.address, tCommon)}
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
                        {t("mapLinkLabel")}
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
          </dl>
        </Card>

        <Card as="section">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium text-slate-900">
              {t("connectorsTitle")}
            </h2>
          </div>

          {details.connectors.length === 0 ? (
            <p className="muted text-sm">{t("noConnectorsImported")}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("connectorTypeHeader")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("powerHeader")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("currentTypeHeader")}
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
        <h2 className="mb-5 text-xl font-medium text-slate-900">
          {t("hoursAccessibilityTitle")}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title={t("openingHoursLabel")}>
            {details.hasOperatingHoursInfo ? (
              details.operatingHours.map((line) => (
                <p key={line} className="font-medium">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-slate-500">{t("notProvidedBySource")}</p>
            )}

            {closingPeriods.length > 0 && (
              <p className="text-sm text-slate-500">
                {t("scheduledClosures", {
                  periods: closingPeriods.join("; "),
                })}
              </p>
            )}
          </InfoCard>

          {details.hasAccessibilityInfo && (
            <InfoCard title={t("accessibilityLabel")}>
              <p className="font-medium">{details.accessibility}</p>
            </InfoCard>
          )}

          {details.hasPaymentMethodsInfo && (
            <InfoCard title={t("paymentMethodsLabel")}>
              <ul className="space-y-2">
                {paymentMethods.map((method) => (
                  <li key={method}>{method}</li>
                ))}
              </ul>
            </InfoCard>
          )}

          {details.hasAuthMethodsInfo && (
            <InfoCard title={t("authMethodsLabel")}>
              <ul className="space-y-2">
                {authMethods.map((method) => (
                  <li key={method}>{method}</li>
                ))}
              </ul>
            </InfoCard>
          )}
        </div>
      </Card>
      <div className="mt-8 rounded-xl bg-slate-100 p-6 text-sm text-slate-500">
        <p>
          {t("dataSourceLabel", {
            source: details.sourceName?.toUpperCase() ?? tCommon("unknown"),
          })}

          {details.safeSourceUrl && (
            <>
              {" · "}
              <a
                href={details.safeSourceUrl}
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
            date: details.importedAt,
          })}
        </p>
      </div>
    </main>
  );
}
