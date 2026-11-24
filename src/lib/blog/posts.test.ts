import { describe, it, expect } from "vitest";
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  getBlogPostsSorted,
  blogPosts,
} from "./posts";
import { blogPostsPL } from "./posts-pl";
import enMessages from "../../../messages/en.json";
import plMessages from "../../../messages/pl.json";

describe("blog/posts", () => {
  it("should have 13 blog posts", () => {
    expect(blogPosts).toHaveLength(13);
  });

  it("should have all required blog post fields", () => {
    blogPosts.forEach((post) => {
      expect(post).toHaveProperty("slug");
      expect(post).toHaveProperty("title");
      expect(post).toHaveProperty("excerpt");
      expect(post).toHaveProperty("keywords");
      expect(post).toHaveProperty("date");
      expect(post).toHaveProperty("content");
      expect(Array.isArray(post.keywords)).toBe(true);
      expect(post.keywords.length).toBeGreaterThan(0);
      expect(post.content.length).toBeGreaterThan(100);
    });
  });

  it("should retrieve blog post by slug", () => {
    const post = getBlogPostBySlug("charging-network-comparison");
    expect(post).toBeDefined();
    expect(post?.slug).toBe("charging-network-comparison");
    expect(post?.title).toContain("Charging Network");
  });

  it("should return undefined for non-existent slug", () => {
    const post = getBlogPostBySlug("non-existent-slug");
    expect(post).toBeUndefined();
  });

  it("should return all blog slugs", () => {
    const slugs = getAllBlogSlugs();
    expect(slugs).toHaveLength(13);
    // Original posts
    expect(slugs).toContain("charging-network-comparison");
    expect(slugs).toContain("ev-adoption-by-region");
    expect(slugs).toContain("fleet-operator-guide");
    // Phase 2D: How-to guides
    expect(slugs).toContain("how-to-charge-ev");
    expect(slugs).toContain("ev-charging-costs");
    expect(slugs).toContain("home-ev-charging");
    // Phase 2D: Comparisons
    expect(slugs).toContain("orlen-vs-energa");
    expect(slugs).toContain("tesla-supercharger-vs-others");
    expect(slugs).toContain("choosing-charging-network");
  });

  it("should sort blog posts by date descending", () => {
    const sorted = getBlogPostsSorted();
    expect(sorted[0].date).toBe("2026-11-22"); // Latest post (choosing-charging-network)
    expect(sorted[sorted.length - 1].date).toBe("2026-07-28"); // Oldest (fleet-operator-guide)
  });

  it("should have valid internal links in content", () => {
    const post = getBlogPostBySlug("charging-network-comparison");
    expect(post?.content).toContain("/corridors");
    expect(post?.content).toContain("/coverage");
    expect(post?.content).toContain("/insights");
    expect(post?.content).toContain("/stations");
    expect(post?.content).toContain("/provinces");
  });

  it("should have frontmatter keywords in all posts", () => {
    blogPosts.forEach((post) => {
      expect(Array.isArray(post.keywords)).toBe(true);
      expect(post.keywords.length).toBeGreaterThan(0);
    });
    // Spot-check a few posts have expected keywords
    const first = blogPosts.find(p => p.slug === "charging-network-comparison");
    expect(first?.keywords).toContain("charging network comparison");
  });
});

describe("fleet-operator-guide unsourced figures", () => {
  const removedEn = [
    "30-40%",
    "60-70%",
    "50% lower maintenance",
    "3-4x",
    "50-70%",
    "5-7 years",
    "30-50%",
    "18-24 months",
    "2-3 years",
    "180,000",
    "5-10 kWh",
  ];
  const tsContent = getBlogPostBySlug("fleet-operator-guide")?.content ?? "";

  it("keeps the English post and the Polish entry", () => {
    expect(tsContent.length).toBeGreaterThan(0);
    expect(blogPostsPL.map((post) => post.slug)).toContain("fleet-operator-guide");
  });

  it.each(removedEn)("English copy does not contain %s", (figure) => {
    expect(tsContent).not.toContain(figure);
  });

  const removedPl = [
    "30-40%",
    "60-70%",
    "50% niższe",
    "3-4x",
    "50-70%",
    "5-7 lat",
    "30-50%",
    "18-24 miesi",
    "2-3 latach",
    "180 000",
    "5-10 kWh",
  ];
  const localizedContent = {
    en: (enMessages.blog.posts["fleet-operator-guide"] as { content: string }).content,
    pl: (plMessages.blog.posts["fleet-operator-guide"] as { content: string }).content,
  };

  it("keeps posts.ts and messages/en.json copies identical", () => {
    expect(localizedContent.en.trim()).toBe(tsContent.trim());
  });

  it.each([
    ["posts.ts", tsContent],
    ["messages/en.json", localizedContent.en],
    ["messages/pl.json", localizedContent.pl],
  ])("%s has no percentage ranges, PLN totals or ROI figures", (_name, content) => {
    expect(content).not.toMatch(/\d+\s*[-–]\s*\d+\s*%/);
    expect(content).not.toMatch(/\d{3}[ ,]\d{3}\s*PLN/);
    expect(content).not.toMatch(/ROI[^.\n]*\d/);
  });

  it("keeps the localized guide content in both message files", () => {
    expect(localizedContent.en.length).toBeGreaterThan(0);
    expect(localizedContent.pl.length).toBeGreaterThan(0);
  });

  it.each(removedEn)("messages/en.json guide does not contain %s", (figure) => {
    expect(localizedContent.en).not.toContain(figure);
  });

  it.each(removedPl)("messages/pl.json guide does not contain %s", (figure) => {
    expect(localizedContent.pl).not.toContain(figure);
  });
});

describe("other guides unsourced figures", () => {
  type Removed = { en: string[]; pl: string[]; ts: string[] };
  const removed: Record<string, Removed> = {
    "charging-network-comparison": {
      en: ["20+ charging points", "expanded by over 35%", "exceeding 95%", "1.50 PLN to 2.50 PLN"],
      pl: ["20+ punktów", "o ponad 35%", "przekraczające 95%", "1,50 PLN do 2,50 PLN"],
      ts: ["20+ charging points", "expanded by over 35%", "exceeding 95%", "1.50 PLN to 2.50 PLN"],
    },
    "ev-adoption-by-region": {
      en: ["3-4x", "2.3x", "40% higher", "40-60%", "25-45"],
      pl: ["3-4x", "2,3x", "40% wyższe", "40-60%", "25-45"],
      ts: ["3-4x", "2.3x", "40% higher", "40-60%", "25-45"],
    },
    "ev-charging-costs": {
      en: ["7.50-12", "3.75-7", "50% cheaper", "8-15 PLN", "20-50 PLN", "42 PLN", "52 PLN", "4.80", "37-47"],
      pl: ["7.50-12", "3.75-7", "50% taniej", "8-15 PLN", "20-50 PLN", "42 PLN", "52 PLN", "4.80", "37-47"],
      ts: ["7.50-12", "3.75-7", "50% cheaper", "8-15 PLN", "20-50 PLN", "42 PLN"],
    },
    "home-ev-charging": {
      en: ["8-12 hours", "6-8 hours", "2-3 hours", "3-7.5k", "2-3 years", "1-2k PLN", "6 hours and 2"],
      pl: ["8-12 godzin", "6-8 godzin", "2-3 godziny", "3-7.5 tys", "2-3 latach", "1-2 tys"],
      ts: ["8-12 hours", "6-8h", "3-7.5k", "2-3h"],
    },
    "ev-home-vs-public": {
      en: ["2-3 times"],
      pl: ["2-3 razy"],
      ts: ["2-3x"],
    },
    "ev-winter-charging": {
      en: ["20-40%"],
      pl: ["20-40%"],
      ts: ["20-40%"],
    },
    "ev-charging-speed": {
      en: ["4-6 hours", "6-8 hours", "7-9 hours", "1-3 hours", "20-45 minutes"],
      pl: ["4-6 h", "6-8 h", "7-9 h", "1-3 godzin", "20-45 minut"],
      ts: ["4-6h", "6-8h", "7-9h"],
    },
    "orlen-vs-energa": {
      en: ["0.99", "0.85", "1.99", "1.79"],
      pl: ["0.99", "0.85", "1.99", "1.79"],
      ts: ["0.99", "0.85", "1.99", "1.79"],
    },
    "tesla-supercharger-vs-others": {
      en: ["2.49", "1.99", "1.79", "150-250 kW", "50-150 kW", "50+ stations", "1000+"],
      pl: ["2.49", "1.99", "1.79", "150-250 kW", "50-150 kW", "ponad 50 stacji", "ponad 1000"],
      ts: ["2.49", "150-250 kW", "50-150 kW", "50+ stations", "1000+"],
    },
    "choosing-charging-network": {
      en: ["50,000 km"],
      pl: ["50 tys. km"],
      ts: ["50k+"],
    },
  };
  const slugs = Object.keys(removed);
  const enContent = (slug: string) =>
    (enMessages.blog.posts as Record<string, { content: string }>)[slug].content;
  const plContent = (slug: string) =>
    (plMessages.blog.posts as Record<string, { content: string }>)[slug].content;

  it.each(slugs)("%s: messages/en.json drops the unsourced figures", (slug) => {
    removed[slug].en.forEach((figure) => expect(enContent(slug)).not.toContain(figure));
  });

  it.each(slugs)("%s: messages/pl.json drops the unsourced figures", (slug) => {
    removed[slug].pl.forEach((figure) => expect(plContent(slug)).not.toContain(figure));
  });

  it.each(slugs)("%s: posts.ts drops the unsourced figures", (slug) => {
    const content = getBlogPostBySlug(slug)?.content ?? "";
    expect(content.length).toBeGreaterThan(0);
    removed[slug].ts.forEach((figure) => expect(content).not.toContain(figure));
  });

  it.each(["charging-network-comparison", "ev-adoption-by-region"])(
    "%s: posts.ts and messages/en.json copies are identical",
    (slug) => {
      expect(enContent(slug).trim()).toBe((getBlogPostBySlug(slug)?.content ?? "").trim());
    },
  );

  it.each(slugs)("%s: no em dashes in en/pl copy", (slug) => {
    expect(enContent(slug)).not.toContain("—");
    expect(plContent(slug)).not.toContain("—");
  });
});

describe("fleet-operator-guide Polish grammar", () => {
  const plGuide = (plMessages.blog.posts["fleet-operator-guide"] as { content: string }).content;
  it.each([
    "jedno z najistotniejszych możliwości",
    "technologia wschodzące",
    "Urbane floty",
    "Większość ładowania odbywało",
    "Upewnij się integrację",
    "rozwiązane jasne procedury",
    "tankowaia",
    "Wdrażaj 2-5 pojazdy",
    "będą przechwycić",
    "Usługi specjalistyczne pionierskie",
    "ROI w tym:",
    "TCO w tym paliwo",
  ])("does not contain the ungrammatical phrase %s", (phrase) => {
    expect(plGuide).not.toContain(phrase);
  });
});
