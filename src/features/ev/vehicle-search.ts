import type { Prisma } from "@prisma/client";

const MAX_PAGE = 500;

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
