import { describe, it, expect } from "vitest";
import { generateStationMetadata } from "./metadata";

describe("generateStationMetadata", () => {
  it("generates metadata with station name, location, and OG tags", () => {
    const stationData = {
      id: "station-123",
      name: "MyCo Stacja Ładowania",
      city: "Warszawa",
      province: "Mazowieckie",
      latitude: 52.2297,
      longitude: 21.0122,
      connectorCount: 4,
      hpcStationCount: 1,
    };

    const metadata = generateStationMetadata(stationData);

    const openGraph = metadata.openGraph as Record<string, unknown>;
    const twitter = metadata.twitter as Record<string, unknown>;

    expect(metadata.title).toContain("MyCo Stacja Ładowania");
    expect(metadata.description).toContain("Warszawa");
    expect(openGraph?.title).toBe(metadata.title);
    expect(openGraph?.image).toBeDefined();
    expect(twitter?.card).toBe("summary_large_image");
  });

  it("includes structured data (JSON-LD) for LocalBusiness", () => {
    const stationData = {
      id: "station-456",
      name: "EV Hub",
      city: "Kraków",
      province: "Małopolskie",
      latitude: 50.0647,
      longitude: 19.945,
      connectorCount: 2,
      hpcStationCount: 0,
    };

    const metadata = generateStationMetadata(stationData);

    const schema = metadata.other?.["structured-data"] as
      | Record<string, unknown>
      | undefined;
    expect(schema).toBeDefined();
    expect(schema?.["@type"]).toBe("LocalBusiness");
    expect(schema?.name).toBe("EV Hub");
  });
});
