export type ConnectorCurrentType = "AC" | "DC" | "Unknown";

export type ConnectorKey = "ccs2" | "type2" | "chademo" | "unknown";

export type ConnectorKnowledge = {
  key: ConnectorKey;
  label: string;
  currentType: ConnectorCurrentType;
  description: string;
  typicalPowerRange: string;
  supportedRegions: string[];
  supportedVehicleBrands: string[];
  imageLabel: string;
  imagePath: string;
};

const UNKNOWN_CONNECTOR_IMAGE_PATH = "/connectors/unknown.webp";

const UNKNOWN_CONNECTOR: ConnectorKnowledge = {
  key: "unknown",
  label: "Unknown",
  currentType: "Unknown",
  description:
    "The imported station record does not identify the connector type clearly enough to classify it.",
  typicalPowerRange: "Unknown",
  supportedRegions: ["Imported source data incomplete"],
  supportedVehicleBrands: ["Unknown"],
  imageLabel: "Connector type unavailable",
  imagePath: UNKNOWN_CONNECTOR_IMAGE_PATH,
};

const CONNECTOR_KNOWLEDGE = {
  ccs2: {
    key: "ccs2",
    label: "CCS2",
    currentType: "DC",
    description:
      "CCS2 is the main European DC fast charging connector used by most modern EVs and high-power public chargers.",
    typicalPowerRange: "50-350 kW DC",
    supportedRegions: ["Europe", "Poland"],
    supportedVehicleBrands: [
      "Volkswagen",
      "Hyundai",
      "Kia",
      "BMW",
      "Mercedes-Benz",
      "Tesla",
    ],
    imageLabel: "CCS2 DC fast charging connector",
    imagePath: "/connectors/ccs2.webp",
  },
  type2: {
    key: "type2",
    label: "Type 2",
    currentType: "AC",
    description:
      "Type 2 is the common European AC charging connector for destination charging, home wallboxes, and many public posts.",
    typicalPowerRange: "3.7-22 kW AC",
    supportedRegions: ["Europe", "Poland"],
    supportedVehicleBrands: [
      "Renault",
      "Volkswagen",
      "BMW",
      "Mercedes-Benz",
      "Tesla",
      "Hyundai",
    ],
    imageLabel: "Type 2 AC charging connector",
    imagePath: "/connectors/type2.webp",
  },
  chademo: {
    key: "chademo",
    label: "CHAdeMO",
    currentType: "DC",
    description:
      "CHAdeMO is an older DC fast charging connector still found on some imported and legacy EVs.",
    typicalPowerRange: "25-100 kW DC",
    supportedRegions: ["Europe", "Japan"],
    supportedVehicleBrands: ["Nissan", "Mitsubishi", "Kia"],
    imageLabel: "CHAdeMO DC fast charging connector",
    imagePath: "/connectors/chademo.webp",
  },
  unknown: UNKNOWN_CONNECTOR,
} satisfies Record<ConnectorKey, ConnectorKnowledge>;

export const CONNECTOR_KNOWLEDGE_LIST: ConnectorKnowledge[] = [
  CONNECTOR_KNOWLEDGE.ccs2,
  CONNECTOR_KNOWLEDGE.type2,
  CONNECTOR_KNOWLEDGE.chademo,
  CONNECTOR_KNOWLEDGE.unknown,
];

const CONNECTOR_ALIASES: Record<string, ConnectorKey> = {
  ccs: "ccs2",
  ccs2: "ccs2",
  ccscombo2: "ccs2",
  comboccs2: "ccs2",
  combo2: "ccs2",
  combinedchargingsystem: "ccs2",
  combinedchargingsystem2: "ccs2",
  iec621963: "ccs2",
  type2combo: "ccs2",

  iec621962: "type2",
  mennekes: "type2",
  type2: "type2",
  type2socket: "type2",

  chademo: "chademo",
  chademoplug: "chademo",
};

const normalizeConnectorValue = (type: string | null | undefined) => {
  if (!type) {
    return null;
  }

  const normalized = type
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return normalized || null;
};

export const getConnectorKnowledge = (
  type: string | null | undefined,
): ConnectorKnowledge => {
  const normalized = normalizeConnectorValue(type);

  if (!normalized) {
    return UNKNOWN_CONNECTOR;
  }

  const key = CONNECTOR_ALIASES[normalized] ?? "unknown";

  return CONNECTOR_KNOWLEDGE[key];
};

export const formatConnectorLabel = (type: string | null | undefined) =>
  getConnectorKnowledge(type).label;

export const getConnectorCurrentType = (type: string | null | undefined) =>
  getConnectorKnowledge(type).currentType;

export const getConnectorImagePath = (type: string | null | undefined) =>
  getConnectorKnowledge(type).imagePath || UNKNOWN_CONNECTOR_IMAGE_PATH;

export const formatPowerKw = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "Unknown";
  }

  const trimmedValue = typeof value === "string" ? value.trim() : value;

  if (trimmedValue === "") {
    return "Unknown";
  }

  const power =
    typeof trimmedValue === "number" ? trimmedValue : Number(trimmedValue);

  if (!Number.isFinite(power)) {
    return "Unknown";
  }

  return `${power.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} kW`;
};
