"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

import {
  OSM_TILE_LAYER_ATTRIBUTION,
  OSM_TILE_LAYER_URL,
  StationGroupCard,
  buildStationMarkerIcon,
} from "@/features/charging/leaflet-tile-layer";
import type { StationMapGroup } from "@/features/charging/station-map";

type StationMapClientProps = {
  groups: StationMapGroup[];
};

const DEFAULT_CENTER: [number, number] = [51.7, 18.6];
const DEFAULT_ZOOM = 6.3;

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

    <div class="station-map-popup-chips">
      <span class="station-map-popup-chip station-map-popup-chip-power">
        ${escapeHtml(formatPower(primaryStation.maxPowerKw))}
      </span>

      ${group.connectorLabels
        .slice(0, 3)
        .map(
          (connector) => `
            <span class="station-map-popup-chip">
              ${escapeHtml(connector)}
            </span>
          `,
        )
        .join("")}
    </div>

    <a
      class="station-map-popup-link"
      href="${escapeHtml(primaryStation.detailsHref)}"
    >
      ${escapeHtml(t("client.viewStationDetailsLink"))}
    </a>
  </article>
`;
    }

    const stationLinks = group.stations
      .slice(0, 3)
      .map(
        (station) =>
          `<li><a href="${escapeHtml(station.detailsHref)}">${escapeHtml(
            station.name,
          )}</a></li>`,
      )
      .join("");
    const extraCount =
      group.stations.length > 3 ? group.stations.length - 3 : 0;

    return `
  <article class="station-map-popup">
    <p>${escapeHtml(group.operatorNames.slice(0, 3).join(", "))}</p>

    <h3>${escapeHtml(
      t("client.stationsNearbyPopup", {
        count: group.stationCount,
      }),
    )}</h3>

    <div class="station-map-popup-chips">
      <span class="station-map-popup-chip station-map-popup-chip-power">
        ${escapeHtml(formatPower(group.maxPowerKw))}
      </span>

      ${group.connectorLabels
        .slice(0, 3)
        .map(
          (connector) => `
            <span class="station-map-popup-chip">
              ${escapeHtml(connector)}
            </span>
          `,
        )
        .join("")}
    </div>

    <ul class="station-map-popup-list">
      ${stationLinks}
    </ul>

    ${
      extraCount > 0
        ? `<p class="station-map-popup-more">
             ${escapeHtml(
               t("client.moreStationsInArea", {
                 count: extraCount,
               }),
             )}
           </p>`
        : ""
    }
  </article>
`;
  };

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
        .tileLayer(OSM_TILE_LAYER_URL, {
          attribution: OSM_TILE_LAYER_ATTRIBUTION,
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
          icon: buildStationMarkerIcon(leaflet, { count: group.stationCount }),
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
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [groups, mapSetupRevision, t]);

  return (
    <section className="grid gap-6 lg:grid-cols-[3fr_1fr]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div
          ref={mapElementRef}
          className="relative z-0 h-[32rem] min-h-[24rem] w-full lg:h-[42rem]"
          aria-label="Charging station map"
        />
      </div>

      <aside className="h-[42rem] overflow-y-auto pr-1 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {t("client.mapResultsTitle")}
          </h2>
        </div>

        {featuredGroups.length === 0 ? (
          <div className="card text-sm text-slate-600">
            {t("client.noStationsMatch")}
          </div>
        ) : (
          featuredGroups.map((group) => (
            <StationGroupCard key={group.id} group={group} />
          ))
        )}
      </aside>
    </section>
  );
};

export default StationMapClient;
