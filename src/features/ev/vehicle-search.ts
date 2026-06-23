import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
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
export const TOP_BRANDS_LIMIT = 8;
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
  brand?: string;
  page?: string;
};

export type VehicleSearchFilters = {
  q?: string;
  brand?: string;
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
  brand: cleanText(params.brand),
  page: parsePage(params.page),
});

export const buildVehicleWhere = (
  filters: VehicleSearchFilters,
): Prisma.EvModelWhereInput => {
  const conditions: Prisma.EvModelWhereInput[] = [];

  if (filters.q) {
    conditions.push({
      OR: [
        { modelName: { contains: filters.q, mode: "insensitive" } },
        { brand: { name: { contains: filters.q, mode: "insensitive" } } },
      ],
    });
  }

  if (filters.brand) {
    conditions.push({ brand: { slug: filters.brand } });
  }

  if (conditions.length === 0) {
    return {};
  }

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
};

export const buildVehicleSearchHref = (
  filters: VehicleSearchFilters,
  page: number,
) => {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.brand) {
    params.set("brand", filters.brand);
  }

  params.set("page", String(Math.min(Math.max(page, 1), MAX_PAGE)));

  return `/vehicles?${params.toString()}`;
};

export type TopVehicleBrand = {
  id: string;
  slug: string;
  name: string;
  vehicleCount: number;
};

const normalizeBrandName = (brandName: string) =>
  brandName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replaceAll("&", "and");

// Hand-curated by real Poland EV-market relevance, ordered by priority — no sales-volume
// data exists in this schema. "kia" has no catalog coverage yet, so it's a no-op for now.
const POLAND_RELEVANT_BRAND_NAMES = [
  "skoda",
  "volkswagen",
  "tesla",
  "kia",
  "hyundai",
  "bmw",
  "audi",
  "volvo",
  "byd",
  "toyota",
  "ford",
  "mercedes-benz",
];

export const prioritizeTopVehicleBrands = (
  brands: TopVehicleBrand[],
  limit: number = TOP_BRANDS_LIMIT,
): TopVehicleBrand[] => {
  const curated = POLAND_RELEVANT_BRAND_NAMES.flatMap((name) => {
    const brand = brands.find((b) => normalizeBrandName(b.name) === name);
    return brand ? [brand] : [];
  });
  const curatedIds = new Set(curated.map((brand) => brand.id));

  const rest = brands
    .filter((brand) => !curatedIds.has(brand.id))
    .sort((a, b) => b.vehicleCount - a.vehicleCount);

  return [...curated, ...rest].slice(0, limit);
};

export const getTopVehicleBrands = async (
  limit: number = TOP_BRANDS_LIMIT,
): Promise<TopVehicleBrand[]> => {
  const grouped = await prisma.evModel.groupBy({
    by: ["brandId"],
    _count: true,
  });

  const brands = await prisma.evBrand.findMany({
    where: { id: { in: grouped.map((group) => group.brandId) } },
  });

  const brandById = new Map(brands.map((brand) => [brand.id, brand]));

  const allBrands = grouped.flatMap((group) => {
    const brand = brandById.get(group.brandId);

    if (!brand) {
      return [];
    }

    return [
      {
        id: brand.id,
        slug: brand.slug,
        name: brand.name,
        vehicleCount: group._count,
      },
    ];
  });

  return prioritizeTopVehicleBrands(allBrands, limit);
};

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

const DRIVETRAIN_ACRONYMS = new Set(["rwd", "awd", "fwd", "4wd", "2wd", "4x4"]);

export const formatDrivetrainLabel = (drivetrain: string | null | undefined) => {
  const trimmed = drivetrain?.trim();

  if (!trimmed) {
    return "N/A";
  }

  return DRIVETRAIN_ACRONYMS.has(trimmed.toLowerCase())
    ? trimmed.toUpperCase()
    : trimmed;
};
