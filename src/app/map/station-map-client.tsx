"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DivIcon, LayerGroup, Map as LeafletMap } from "leaflet";

import type { StationMapGroup } from "@/features/charging/station-map";

type StationMapClientProps = {
  groups: StationMapGroup[];
};

const DEFAULT_CENTER: [number, number] = [52.1, 19.4];
const DEFAULT_ZOOM = 6;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const StationMapClient = ({ groups }: StationMapClientProps) => {
  const t = useTranslations("map");
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [mapSetupRevision, setMapSetupRevision] = useState(0);

  const featuredGroups = useMemo(() => groups.slice(0, 8), [groups]);

  const formatPower = (powerKw: number | null) =>
    powerKw === null
      ? t("client.powerUnknown")
      : t("client.upToPower", { power: powerKw });

  const buildPopupHtml = (group: StationMapGroup) => {
    const primaryStation = group.stations[0];
    const connectorText =
      group.connectorLabels.length > 0
        ? group.connectorLabels.join(", ")
        : t("client.connectorsUnavailable");

    if (group.stationCount === 1 && primaryStation) {
      return `
        <article class="station-map-popup">
          <p>${escapeHtml(primaryStation.operatorName)}</p>
          <h3>${escapeHtml(primaryStation.name)}</h3>
          <dl>
            <div><dt>${escapeHtml(t("client.powerDt"))}</dt><dd>${escapeHtml(
              formatPower(primaryStation.maxPowerKw),
            )}</dd></div>
            <div><dt>${escapeHtml(t("client.connectorsDt"))}</dt><dd>${escapeHtml(
              connectorText,
            )}</dd></div>
          </dl>
          <a href="${escapeHtml(primaryStation.detailsHref)}">${escapeHtml(
            t("client.viewStationDetailsLink"),
          )}</a>
        </article>
      `;
    }

    const stationLinks = group.stations
      .slice(0, 4)
      .map(
        (station) =>
          `<li><a href="${escapeHtml(station.detailsHref)}">${escapeHtml(
            station.name,
          )}</a></li>`,
      )
      .join("");
    const extraCount = group.stationCount > 4 ? group.stationCount - 4 : 0;

    return `
      <article class="station-map-popup">
        <p>${escapeHtml(group.operatorNames.slice(0, 3).join(", "))}</p>
        <h3>${escapeHtml(
          t("client.stationsNearbyPopup", { count: group.stationCount }),
        )}</h3>
        <dl>
          <div><dt>${escapeHtml(t("client.powerDt"))}</dt><dd>${escapeHtml(
            formatPower(group.maxPowerKw),
          )}</dd></div>
          <div><dt>${escapeHtml(t("client.connectorsDt"))}</dt><dd>${escapeHtml(
            connectorText,
          )}</dd></div>
        </dl>
        <ul>${stationLinks}</ul>
        ${
          extraCount > 0
            ? `<p>${escapeHtml(
                t("client.moreStationsInArea", { count: extraCount }),
              )}</p>`
            : ""
        }
      </article>
    `;
  };

  const createMarkerIcon = (
    leaflet: typeof import("leaflet"),
    group: StationMapGroup,
  ): DivIcon =>
    leaflet.divIcon({
      className: "station-map-marker-wrapper",
      html: `<span class="station-map-marker${
        group.stationCount > 1 ? " station-map-marker-cluster" : ""
      }">${group.stationCount > 1 ? group.stationCount : ""}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -14],
    });

  useEffect(() => {
    let cancelled = false;

    const setupMap = async () => {
      if (!mapElementRef.current || mapRef.current) {
        return;
      }

      const leaflet = await import("leaflet");

      if (cancelled || !mapElementRef.current) {
        return;
      }

      leafletRef.current = leaflet;

      const map = leaflet
        .map(mapElementRef.current, {
          scrollWheelZoom: true,
          zoomControl: true,
        })
        .setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map);

      const markerLayer = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      markerLayerRef.current = markerLayer;
      setMapSetupRevision((revision) => revision + 1);
      setTimeout(() => map.invalidateSize(), 0);
    };

    void setupMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    const leaflet = leafletRef.current;

    if (mapSetupRevision === 0 || !map || !markerLayer || !leaflet) {
      return;
    }

    markerLayer.clearLayers();

    if (groups.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = leaflet.latLngBounds([]);

    for (const group of groups) {
      const coordinates: [number, number] = [group.latitude, group.longitude];

      leaflet
        .marker(coordinates, {
          icon: createMarkerIcon(leaflet, group),
          title:
            group.stationCount === 1
              ? group.stations[0]?.name
              : t("client.markerTitleMultiple", { count: group.stationCount }),
        })
        .bindPopup(buildPopupHtml(group), { maxWidth: 320 })
        .addTo(markerLayer);
      bounds.extend(coordinates);
    }

    if (groups.length === 1) {
      map.setView([groups[0].latitude, groups[0].longitude], 12);
    } else {
      map.fitBounds(bounds, {
        padding: [28, 28],
        maxZoom: 13,
      });
    }
  }, [groups, mapSetupRevision, t]);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div
          ref={mapElementRef}
          className="h-[32rem] min-h-[24rem] w-full lg:h-[42rem]"
          aria-label="Charging station map"
        />
      </div>

      <aside className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {t("client.mapResultsTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("client.markersAfterGrouping", { count: groups.length })}
          </p>
        </div>

        {featuredGroups.length === 0 ? (
          <div className="card text-sm text-slate-600">
            {t("client.noStationsMatch")}
          </div>
        ) : (
          featuredGroups.map((group) => {
            const primaryStation = group.stations[0];

            return (
              <article key={group.id} className="card">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  {group.stationCount === 1
                    ? primaryStation?.operatorName
                    : t("client.stationsNearbyPopup", {
                        count: group.stationCount,
                      })}
                </p>
                <h3 className="mt-1 font-semibold text-slate-950">
                  {group.stationCount === 1
                    ? primaryStation?.name
                    : group.operatorNames.slice(0, 2).join(", ") ||
                      t("client.chargingStationGroup")}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatPower(group.maxPowerKw)}
                  {group.connectorLabels.length > 0
                    ? ` / ${group.connectorLabels.slice(0, 3).join(", ")}`
                    : ""}
                </p>
                {primaryStation && (
                  <Link
                    href={primaryStation.detailsHref}
                    className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    {t("client.viewDetailsLink")}
                  </Link>
                )}
              </article>
            );
          })
        )}
      </aside>
    </section>
  );
};

export default StationMapClient;
