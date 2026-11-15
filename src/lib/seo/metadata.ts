import type { Metadata } from "next";
import { OG_IMAGE_PATH, SITE_URL } from "@/lib/config/site";

export interface ConnectorMetadataInput {
  type: string;
  title: string;
  description: string;
}

export interface PageMetadataInput {
  path: string;
  title: string;
  description: string;
}

export const generatePageMetadata = ({
  path,
  title,
  description,
}: PageMetadataInput): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    url: path,
    title,
    description,
    siteName: "evsource.pl",
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [OG_IMAGE_PATH],
  },
});

export const generateConnectorMetadata = ({
  type,
  title,
  description,
}: ConnectorMetadataInput): Metadata =>
  generatePageMetadata({ path: `/connectors/${type}`, title, description });

export const buildBreadcrumbJsonLd = (
  items: Array<{ name: string; path: string }>,
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>,
) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};
