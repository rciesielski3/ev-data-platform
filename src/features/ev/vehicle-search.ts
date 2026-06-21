import type { Prisma } from "@prisma/client";

const MAX_PAGE = 500;
const BRAND_MARK_COLORS = [
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
];
const BRAND_MARK_INITIALS: Record<string, string> = {
  volkswagen: "VW",
};
const BRAND_MARK_COLOR_OVERRIDES: Record<string, string> = {
  bmw: "bg-violet-100 text-violet-800",
  "mercedes-benz": "bg-emerald-100 text-emerald-800",
  volkswagen: "bg-sky-100 text-sky-800",
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

export const buildBrandMark = (brandName: string) => {
  const words = brandName
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter(Boolean);
  const normalizedBrandName = brandName.trim().toLowerCase();
  const initials =
    BRAND_MARK_INITIALS[normalizedBrandName] ??
    (words.length === 1
      ? words[0].slice(0, 3).toUpperCase()
      : words
          .slice(0, 2)
          .map((word) => word[0].toUpperCase())
          .join(""));
  const colorIndex = brandName.length % BRAND_MARK_COLORS.length;

  return {
    initials: initials || "EV",
    colorClass:
      BRAND_MARK_COLOR_OVERRIDES[normalizedBrandName] ??
      BRAND_MARK_COLORS[colorIndex],
  };
};
