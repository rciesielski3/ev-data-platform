// Sourced from EIPA's official `dictionary` export, `connector_interface`
// resource (fetchEipaDictionary()) -- not guessed. IDs without an entry here
// (e.g. CCS1, China GB/T, Better Place) fall through to "unknown" below
// since this app has no dedicated knowledge-base content for them.
const EIPA_INTERFACE_MAP: Record<number, string> = {
  10: "type2", // IEC-62196-T2-F-NOCABLE
  17: "type2", // IEC-62196-T2-F-CABLE
  11: "chademo", // CHAdeMO
  29: "ccs2", // IEC-62196-T2-COMBO
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
