import { describe, it, expect } from "vitest";
import { generateConnectorMetadata, generateFAQSchema } from "./metadata";

describe("generateConnectorMetadata", () => {
  it("uses the supplied title and description across canonical, OG and Twitter tags", () => {
    const metadata = generateConnectorMetadata({
      type: "type2",
      title: "Type 2 Złącze Ładowania - Poradnik | evsource.pl",
      description: "Informacje o złączu Type 2.",
    });

    const openGraph = metadata.openGraph as Record<string, unknown>;
    const twitter = metadata.twitter as Record<string, unknown>;

    expect(metadata.title).toBe("Type 2 Złącze Ładowania - Poradnik | evsource.pl");
    expect(metadata.alternates?.canonical).toBe("/connectors/type2");
    expect(openGraph?.url).toBe("/connectors/type2");
    expect(openGraph?.title).toBe(metadata.title);
    expect(openGraph?.images).toBeDefined();
    expect(twitter?.card).toBe("summary_large_image");
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
