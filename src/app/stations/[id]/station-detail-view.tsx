import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { ArrowLeft, Cable, Zap } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import StationLocationMapClient from "@/app/stations/[id]/station-location-map-client";
import {
  buildStationSummaryParts,
  buildSummarySentence,
} from "@/features/charging/station-summary";
import { buildStationPlaceJsonLd } from "@/features/charging/station-seo";
import {
  buildStationMetaTitle,
  pickReadableStationName,
} from "@/features/charging/station-title";
import { buildFallbackStationDetail } from "@/features/charging/fallback-stations";
import { buildStationDetails } from "@/features/charging/station-details";
import { StationFreshnessIndicator } from "@/features/charging/station-quality-badge";
import { getStationById } from "@/lib/db/cached-detail-queries";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/database-unavailable";
import { localizeFallback } from "@/lib/display/localize-fallback";
import { loadFallbackStations } from "@/lib/fallback/stations-snapshot";
import type { SupportedLocale } from "@/lib/i18n/constants";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { DATA_SOURCES } from "@/lib/sources/constants";

const findStationIdBySourceRecordId = cache((sourceRecordId: string) =>
  prisma.chargingStation.findUnique({
    where: {
      sourceName_sourceRecordId: {
        sourceName: DATA_SOURCES.EIPA.key,
        sourceRecordId,
      },
    },
    select: { id: true },
  }),
);

const loadStation = async (id: string) => {
  try {
    return { station: await getStationById(id), fromSnapshot: false };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn("station detail: database unavailable, serving snapshot");
    const snapshot = await loadFallbackStations();
    const station = buildFallbackStationDetail(snapshot.stations, id, snapshot.generatedAt);
    if (!station) throw error;
    return { station, fromSnapshot: true };
  }
};

export const generateStationDetailMetadata = async (
  id: string,
): Promise<Metadata> => {
  const { station, fromSnapshot } = await loadStation(id);

  if (!station) {
    return { robots: { index: false, follow: false } };
  }

  const t = await getTranslations("stationDetail");
  const locale = await getLocale();
  const summaryParts = buildStationSummaryParts({
    operatorName:
      station.operator?.name ?? station.operator?.normalizedName ?? null,
    city: station.city,
    connectorTypes: station.connectors.map((c) => c.connectorType),
    maxPowerKw: station.connectors[0]?.powerKw ?? null,
  });

  const { alternates, ...metadata } = generatePageMetadata({
    path: `/stations/${id}`,
    title: buildStationMetaTitle(
      summaryParts,
      pickReadableStationName([station.name]),
      t,
    ),
    description: buildSummarySentence(summaryParts, t, locale),
  });

  return {
    ...metadata,
    ...(fromSnapshot
      ? { robots: { index: false, follow: true } }
      : { alternates }),
  };
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="border-b border-forest/10 pb-3 last:border-b-0 last:pb-0">
    <dt className="text-xs font-semibold uppercase tracking-wider text-forest/70">{label}</dt>
    <dd className="mt-1 font-medium text-forest">{value}</dd>
  </div>
);

const InfoCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-forest/10 bg-cream p-5">
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest/70">{title}</h3>

    <div className="space-y-2 text-forest">{children}</div>
  </div>
);

const FRESHNESS_SOURCE_KEYS: Record<string, string> = {
  "source timestamp": "freshnessSourceTimestamp",
  "import date": "freshnessImportDate",
  unknown: "freshnessUnknownSource",
};

export const redirectLegacyStationId = async (id: string) => {
  const { station } = await loadStation(id);
  if (!/^\d+$/.test(id) || station) return;
  const aliased = await findStationIdBySourceRecordId(id).catch((error) => {
    if (!isDatabaseUnavailableError(error)) throw error;
    return null;
  });
  if (aliased) permanentRedirect(`/stations/${aliased.id}`);
};

export const StationDetailView = async ({ id }: { id: string }) => {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("stationDetail");
  const tCommon = await getTranslations("common");

  const { station } = await loadStation(id);

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
    <main className="page-shell max-w-5xl pb-20 pt-12 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildStationPlaceJsonLd({
              name:
                details.title === "Charging station"
                  ? tCommon("chargingStationFallback")
                  : details.title,
              address: station.address,
              city: station.city,
              province: station.province,
              latitude: station.latitude,
              longitude: station.longitude,
              connectors: station.connectors.map((connector) => ({
                connectorType: connector.connectorType,
                powerKw: connector.powerKw,
              })),
            }),
          ).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mb-8">
        <Link
          href="/stations"
          className="group inline-flex items-center gap-2 rounded-full border border-forest/25 px-4 py-2 text-sm font-medium text-forest transition-all duration-300 hover:border-forest hover:bg-forest hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:-translate-x-0.5" aria-hidden />
          {t("backLink")}
        </Link>
      </div>

      <header className="mb-10 max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">
          {localizeFallback(details.operatorName, tCommon)}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-forest sm:text-5xl">
          {details.title === "Charging station"
            ? tCommon("chargingStationFallback")
            : details.title}
        </h1>
        <p className="muted mt-4 max-w-3xl text-lg">{locationLine}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {details.connectors.length > 0 && (
            <Badge className="!inline-flex items-center gap-1.5 !border !border-forest/15 !bg-paper !normal-case !tracking-normal">
              <Cable className="h-4 w-4" aria-hidden />
              {t("connectorsCount", { count: details.connectors.length })}
            </Badge>
          )}

          {station.connectors[0]?.powerKw && (
            <Badge className="!inline-flex items-center gap-1.5 !normal-case !tracking-normal">
              <Zap className="h-4 w-4" aria-hidden />
              {t("upToPower", {
                power: station.connectors[0].powerKw,
              })}
            </Badge>
          )}

          <Badge className="!border !border-forest/15 !bg-paper !normal-case !tracking-normal">
            {details.quality.completeness.scorePercent}%{" "}
            {t("completenessLabel")}
          </Badge>
        </div>
      </header>

      <Card as="section" className="my-6 !p-6 sm:!p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">
            {t("dataQualityTitle")}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-forest/10 bg-cream p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">{t("completenessLabel")}</p>

            <p className="mt-2 font-display text-4xl font-bold text-forest">
              {details.quality.completeness.scorePercent}%
            </p>

            <p className="mt-2 text-sm text-forest/70">
              {t("fieldsPresent", {
                present: details.quality.completeness.presentFieldCount,
                total: details.quality.completeness.totalFieldCount,
              })}
            </p>

            {details.quality.completeness.missingFields.length > 0 && (
              <p className="mt-2 text-sm text-forest/70">
                {t("missingFields", {
                  list: missingFieldLabels.join(", "),
                })}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-forest/10 bg-cream p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">{t("freshnessLabel")}</p>

            <div className="mt-2">
              <StationFreshnessIndicator
                freshness={details.quality.freshness}
              />
            </div>

            <p className="mt-3 text-xs text-forest/70">
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
        <Card as="section" className="min-w-0">
          <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-forest">
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
                        className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30"
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
                        className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30"
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

        <Card as="section" className="min-w-0">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">
              {t("connectorsTitle")}
            </h2>
          </div>

          {details.connectors.length === 0 ? (
            <p className="muted text-sm">{t("noConnectorsImported")}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-forest/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream text-xs uppercase tracking-wider text-forest/70">
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
                <tbody className="divide-y divide-forest/10 bg-paper">
                  {details.connectors.map((connector) => (
                    <tr key={connector.id} className="transition-colors hover:bg-forest/5">
                      <td className="px-4 py-3 font-medium text-forest">
                        {localizeFallback(connector.type, tCommon)}
                      </td>
                      <td className="px-4 py-3 text-forest/80">
                        {localizeFallback(connector.power, tCommon)}
                      </td>
                      <td className="px-4 py-3 text-forest/80">
                        {localizeFallback(connector.currentType, tCommon)}
                      </td>
                      <td className="px-4 py-3 text-forest/80">
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
          <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-forest">
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
        <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-forest">
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
              <p className="text-forest/70">{t("notProvidedBySource")}</p>
            )}

            {closingPeriods.length > 0 && (
              <p className="text-sm text-forest/70">
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
      <div className="mt-8 rounded-2xl border border-forest/10 bg-paper p-6 text-sm text-forest/70">
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
                className="font-medium text-forest underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/30"
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
};
