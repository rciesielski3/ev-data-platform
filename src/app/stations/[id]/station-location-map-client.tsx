"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

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
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map);

      leaflet
        .marker([latitude, longitude], {
          icon: leaflet.divIcon({
            className: "station-map-marker-wrapper",
            html: `<span class="station-map-marker"></span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
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
      className="h-72 w-full overflow-hidden rounded-lg border border-slate-200"
      aria-label={title}
    />
  );
};

export default StationLocationMapClient;