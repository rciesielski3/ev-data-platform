import { describe, it, expect } from "vitest";
import { generateFAQSchema, generateStationMetadata } from "./metadata";

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

describe("generateFAQSchema", () => {
  it("builds a FAQPage JSON-LD object from question/answer pairs", () => {
    const schema = generateFAQSchema([
      { question: "Co to jest złącze CCS2?", answer: "CCS2 to standard szybkiego ładowania DC." },
      { question: "Jak długo trwa ładowanie CCS2?", answer: "20-45 minut do 80% pojemności." },
    ]);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Co to jest złącze CCS2?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CCS2 to standard szybkiego ładowania DC.",
      },
    });
  });

  it("returns an empty mainEntity array when given no FAQs", () => {
    const schema = generateFAQSchema([]);

    expect(schema.mainEntity).toEqual([]);
  });
});
