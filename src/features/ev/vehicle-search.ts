import type { Prisma } from "@prisma/client";
import {
  siAudi,
  siBmw,
  siCitroen,
  siDacia,
  siFiat,
  siFord,
  siHyundai,
  siKia,
  siMg,
  siMini,
  siNissan,
  siOpel,
  siPeugeot,
  siPolestar,
  siPorsche,
  siRenault,
  siSeat,
  siSkoda,
  siSmart,
  siTesla,
  siToyota,
  siVolkswagen,
  siVolvo,
  type SimpleIcon,
} from "simple-icons";

const MAX_PAGE = 500;
const BRAND_LOGO_ICONS: Record<string, SimpleIcon> = {
  audi: siAudi,
  bmw: siBmw,
  citroen: siCitroen,
  dacia: siDacia,
  fiat: siFiat,
  ford: siFord,
  hyundai: siHyundai,
  kia: siKia,
  mg: siMg,
  mini: siMini,
  nissan: siNissan,
  opel: siOpel,
  peugeot: siPeugeot,
  polestar: siPolestar,
  porsche: siPorsche,
  renault: siRenault,
  seat: siSeat,
  skoda: siSkoda,
  smart: siSmart,
  tesla: siTesla,
  toyota: siToyota,
  volkswagen: siVolkswagen,
  volvo: siVolvo,
};

export type VehicleSearchParams = {
  q?: string;
  page?: string;
};

export type VehicleSearchFilters = {
  q?: string;
  page: number;
};

const cleanText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const parsePage = (value: string | undefined) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, MAX_PAGE);
};

export const parseVehicleSearchParams = (
  params: VehicleSearchParams,
): VehicleSearchFilters => ({
  q: cleanText(params.q),
  page: parsePage(params.page),
});

export const buildVehicleWhere = (
  filters: VehicleSearchFilters,
): Prisma.EvModelWhereInput =>
  filters.q
    ? {
        OR: [
          { modelName: { contains: filters.q, mode: "insensitive" } },
          { brand: { name: { contains: filters.q, mode: "insensitive" } } },
        ],
      }
    : {};

export const buildVehicleSearchHref = (
  filters: VehicleSearchFilters,
  page: number,
) => {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  params.set("page", String(Math.min(Math.max(page, 1), MAX_PAGE)));

  return `/vehicles?${params.toString()}`;
};

const normalizeBrandName = (brandName: string) =>
  brandName.trim().toLowerCase().replaceAll("&", "and");

export const buildBrandMark = (brandName: string) => {
  const icon = BRAND_LOGO_ICONS[normalizeBrandName(brandName)];

  if (icon) {
    return {
      kind: "icon" as const,
      title: icon.title,
      path: icon.path,
      hex: icon.hex,
    };
  }

  return {
    kind: "wordmark" as const,
    title: brandName.trim() || "EV",
  };
};

export const formatDrivetrainLabel = (drivetrain: string | null | undefined) => {
  const trimmed = drivetrain?.trim();

  if (!trimmed) {
    return "N/A";
  }

  return /^[a-z]{2,4}$/i.test(trimmed) ? trimmed.toUpperCase() : trimmed;
};
