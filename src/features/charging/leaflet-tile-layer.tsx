"use client";

import { useState } from "react";
import type { DivIcon } from "leaflet";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import Card from "@/components/ui/Card";
import { StationMapGroup } from "./station-map";
import Badge from "@/components/ui/Badge";

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
    ...(count !== undefined
      ? { popupAnchor: [0, -14] as [number, number] }
      : {}),
  });
};

export const StationGroupCard = ({ group }: { group: StationMapGroup }) => {
  const t = useTranslations("map");
  const [expanded, setExpanded] = useState(false);

  const primaryStation = group.stations[0];
  const isGrouped = group.stationCount > 1;

  const formatPower = (powerKw: number | null) =>
    powerKw === null
      ? t("client.powerUnknown")
      : t("client.upToPower", { power: powerKw });

  return (
    <Card className="group transition-shadow hover:shadow-md bg-slate-50">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
        {isGrouped
          ? t("client.stationsNearbyPopup", {
              count: group.stationCount,
            })
          : primaryStation?.operatorName}
      </p>

      <h3 className="mt-1 text-lg font-semibold text-slate-950">
        {isGrouped
          ? group.operatorNames.slice(0, 2).join(", ") ||
            t("client.chargingStationGroup")
          : primaryStation?.name}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="rounded-full bg-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700">
          {formatPower(group.maxPowerKw)}
        </Badge>

        {group.connectorLabels.slice(0, 2).map((connector) => (
          <Badge
            key={connector}
            className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700"
          >
            {connector}
          </Badge>
        ))}
      </div>

      {!isGrouped && primaryStation && (
        <div className="mt-4 flex items-center justify-end border-t border-slate-200 pt-3">
          <Link
            href={primaryStation.detailsHref}
            aria-label={t("viewDetailsLink")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition-all hover:translate-x-1 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      )}

      {isGrouped && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-4 flex w-full items-center justify-between border-t border-slate-200 pt-3 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-900"
          >
            <span>
              {expanded ? t("client.hideStations") : t("client.chooseStation")}
            </span>

            {expanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>

          {expanded && (
            <ul className="mt-3 space-y-2">
              {group.stations.slice(0, 5).map((station) => (
                <li
                  key={station.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2"
                >
                  <span
                    className="truncate text-sm text-slate-700"
                    title={station.name}
                  >
                    {station.name}
                  </span>

                  <Link
                    href={station.detailsHref}
                    aria-label={station.name}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 transition-all hover:translate-x-1 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
};
