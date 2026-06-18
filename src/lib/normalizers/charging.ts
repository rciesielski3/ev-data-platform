// EIPA connector interface IDs mapped to normalized connector names.
const EIPA_INTERFACE_MAP: Record<number, string> = {
  11: "type2",
  29: "ccs2",
  30: "chademo",
  31: "type1",
  32: "ccs1",
  33: "tesla",
};

export const mapEipaInterfaceIds = (interfaceIds: number[]) => {
  const mapped = interfaceIds
    .map((id) => EIPA_INTERFACE_MAP[id])
    .filter((value): value is string => Boolean(value));

  if (mapped.length === 0) {
    return ["unknown"];
  }

  return [...new Set(mapped)];
};

export const normalizeOperatorName = (operatorId: number) =>
  `eipa-operator-${operatorId}`;

export const buildAddress = (input: {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
}) => {
  const streetPart = [input.street, input.houseNumber].filter(Boolean).join(" ");
  const cityPart = [input.postalCode, input.city].filter(Boolean).join(" ");

  return [streetPart, cityPart].filter(Boolean).join(", ") || null;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
