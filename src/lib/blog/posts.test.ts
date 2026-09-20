import { describe, it, expect } from "vitest";
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  getBlogPostsSorted,
  blogPosts,
} from "./posts";

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
    expect(sorted[0].date).toBe("2026-09-20"); // Latest Phase 2D posts
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
