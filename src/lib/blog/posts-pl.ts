import type { BlogPost } from "./types";

/**
 * @deprecated This file exists only to support the deprecated getBlogPostBySlugLocalized functions.
 * All blog content is now stored in messages/pl.json.
 * This array is not kept in sync and should not be used directly.
 * Use getTranslations("blog") instead.
 */
export const blogPostsPL: BlogPost[] = [
  // These are stubs only - see messages/pl.json for actual content
  { slug: "charging-network-comparison", title: "...", excerpt: "...", keywords: [], date: "", author: "", content: "" },
  { slug: "ev-adoption-by-region", title: "...", excerpt: "...", keywords: [], date: "", author: "", content: "" },
  { slug: "fleet-operator-guide", title: "...", excerpt: "...", keywords: [], date: "", author: "", content: "" },
];

/**
 * @deprecated Use getTranslations("blog") instead
 */
export const getBlogPostBySlugPL = (slug: string): undefined => {
  // Deprecated - always returns undefined
  // All blog content is now in messages/pl.json
  return undefined;
};

/**
 * @deprecated Use getTranslations("blog") instead
 */
export const getAllBlogSlugsPL = (): string[] => {
  // Deprecated - returns empty array
  // Use getAllBlogSlugs() for English instead
  return [];
};

/**
 * @deprecated Use getTranslations("blog") instead
 */
export const getBlogPostsSortedPL = (): BlogPost[] => {
  // Deprecated - returns empty array
  return [];
};
