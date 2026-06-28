"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

import {
  OSM_TILE_LAYER_ATTRIBUTION,
  OSM_TILE_LAYER_URL,
  buildStationMarkerIcon,
} from "@/features/charging/leaflet-tile-layer";

type StationLocationMapClientProps = {
  latitude: number;
  longitude: number;
  title: string;
};

const ZOOM = 15;

const StationLocationMapClient = ({
  latitude,
  longitude,
  title,
}: StationLocationMapClientProps) => {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

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

      const map = leaflet
        .map(mapElementRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        })
        .setView([latitude, longitude], ZOOM);

      leaflet
        .tileLayer(OSM_TILE_LAYER_URL, {
          attribution: OSM_TILE_LAYER_ATTRIBUTION,
          maxZoom: 19,
        })
        .addTo(map);

      leaflet
        .marker([latitude, longitude], {
          icon: buildStationMarkerIcon(leaflet),
          title,
        })
        .addTo(map);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    };

    void setupMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, title]);

  return (
    <div
      ref={mapElementRef}
      className="relative z-0 h-72 w-full overflow-hidden rounded-lg border border-slate-200"
      aria-label={title}
    />
  );
};

export default StationLocationMapClient;
