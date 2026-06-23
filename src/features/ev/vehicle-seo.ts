import type { ChargingCostEstimate } from "@/features/ev/charging-cost";

export type VehicleSeoHighlight =
  | { kind: "range"; rangeKm: number }
  | { kind: "cost"; costFromPln: number };

export const buildVehicleSeoHighlights = ({
  rangeWltpKm,
  chargingCost,
}: {
  rangeWltpKm: number | null;
  chargingCost: ChargingCostEstimate | null;
}): VehicleSeoHighlight[] => {
  const highlights: VehicleSeoHighlight[] = [];

  if (
    rangeWltpKm !== null &&
    Number.isFinite(rangeWltpKm) &&
    rangeWltpKm > 0
  ) {
    highlights.push({ kind: "range", rangeKm: rangeWltpKm });
  }

  if (chargingCost?.dcCostRangePln) {
    highlights.push({
      kind: "cost",
      costFromPln: chargingCost.dcCostRangePln[0],
    });
  }

  return highlights;
};

export type VehicleJsonLdProperty = {
  label: string;
  value: string | null;
};

export type VehicleJsonLdInput = {
  name: string;
  brandName: string;
  properties: VehicleJsonLdProperty[];
};

export const buildVehicleProductJsonLd = ({
  name,
  brandName,
  properties,
}: VehicleJsonLdInput): Record<string, unknown> => {
  const knownProperties = properties.filter(
    (property): property is { label: string; value: string } =>
      property.value !== null,
  );

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Product", "Vehicle"],
    name,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
  };

  if (knownProperties.length > 0) {
    jsonLd.additionalProperty = knownProperties.map(({ label, value }) => ({
      "@type": "PropertyValue",
      name: label,
      value,
    }));
  }

  return jsonLd;
};
