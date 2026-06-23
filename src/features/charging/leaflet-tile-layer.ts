import type { DivIcon } from "leaflet";

export const OSM_TILE_LAYER_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const buildStationMarkerIcon = (
  leaflet: typeof import("leaflet"),
  options?: { count?: number },
): DivIcon => {
  const count = options?.count;
  const isCluster = typeof count === "number" && count > 1;

  return leaflet.divIcon({
    className: "station-map-marker-wrapper",
    html: `<span class="station-map-marker${
      isCluster ? " station-map-marker-cluster" : ""
    }">${isCluster ? count : ""}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    ...(count !== undefined ? { popupAnchor: [0, -14] as [number, number] } : {}),
  });
};
