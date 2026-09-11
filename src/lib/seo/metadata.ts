import type { Metadata } from "next";
import { OG_IMAGE_PATH } from "@/lib/config/site";

export interface ConnectorMetadataInput {
  type: string;
  title: string;
  description: string;
}

export const generateConnectorMetadata = ({
  type,
  title,
  description,
}: ConnectorMetadataInput): Metadata => {
  const url = `/connectors/${type}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
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
  };
};

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
