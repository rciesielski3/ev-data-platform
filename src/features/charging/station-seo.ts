export type StationPlaceJsonLdConnector = {
  connectorType: string;
  powerKw: number | null;
};

export type StationPlaceJsonLdInput = {
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  connectors: StationPlaceJsonLdConnector[];
};

export const buildStationPlaceJsonLd = ({
  name,
  address,
  city,
  province,
  latitude,
  longitude,
  connectors,
}: StationPlaceJsonLdInput): Record<string, unknown> => {
  const postalAddress: Record<string, unknown> = { "@type": "PostalAddress", addressCountry: "PL" };
  if (address) postalAddress.streetAddress = address;
  if (city) postalAddress.addressLocality = city;
  if (province) postalAddress.addressRegion = province;

  const knownPowerConnectors = connectors.filter(
    (connector): connector is { connectorType: string; powerKw: number } =>
      typeof connector.powerKw === "number",
  );

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Place"],
    additionalType: "https://schema.org/EVChargingStation",
    name,
    address: postalAddress,
    geo: {
      "@type": "GeoCoordinates",
      latitude,
      longitude,
    },
  };

  if (knownPowerConnectors.length > 0) {
    jsonLd.additionalProperty = knownPowerConnectors.map((connector) => ({
      "@type": "PropertyValue",
      name: connector.connectorType,
      value: `${connector.powerKw} kW`,
    }));
  }

  return jsonLd;
};
