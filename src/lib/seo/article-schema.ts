import { SITE_URL } from "@/lib/config/site";

const PUBLISHER = {
  "@type": "Organization",
  name: "EVSource",
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
};

export interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  inLanguage: string;
}

export const buildArticleSchema = ({
  title,
  description,
  url,
  datePublished,
  dateModified,
  inLanguage,
}: ArticleSchemaInput) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  datePublished,
  dateModified: dateModified ?? datePublished,
  inLanguage,
  author: PUBLISHER,
  publisher: PUBLISHER,
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
});

export const buildBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>,
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const serializeJsonLd = (schema: object) =>
  JSON.stringify(schema).replace(/</g, "\\u003c");
