import { describe, it, expect } from "vitest";
import { SITE_URL } from "@/lib/config/site";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  serializeJsonLd,
} from "./article-schema";

const input = {
  title: "Guide",
  description: "About charging",
  url: `${SITE_URL}/blog/guide`,
  datePublished: "2026-07-30",
  inLanguage: "pl",
};

describe("buildArticleSchema", () => {
  it("maps post fields and uses EVSource as author and publisher", () => {
    const schema = buildArticleSchema(input);
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("Guide");
    expect(schema.description).toBe("About charging");
    expect(schema.inLanguage).toBe("pl");
    expect(schema.mainEntityOfPage["@id"]).toBe(`${SITE_URL}/blog/guide`);
    expect(schema.author.name).toBe("EVSource");
    expect(schema.publisher.url).toBe(SITE_URL);
  });

  it("falls back to datePublished when dateModified is missing", () => {
    expect(buildArticleSchema(input).dateModified).toBe("2026-07-30");
    expect(
      buildArticleSchema({ ...input, dateModified: "2026-08-01" }).dateModified,
    ).toBe("2026-08-01");
  });
});

describe("buildBreadcrumbSchema", () => {
  it("numbers items from 1 in order", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Blog", url: `${SITE_URL}/blog` },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < to prevent script breakout", () => {
    expect(serializeJsonLd({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });
});
