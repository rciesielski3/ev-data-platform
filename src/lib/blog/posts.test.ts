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
