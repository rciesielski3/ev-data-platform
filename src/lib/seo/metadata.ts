import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config/site";

export interface StationMetadataInput {
  id: string;
  name: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  connectorCount: number;
  hpcStationCount: number;
}

export const generateStationMetadata = (
  station: StationMetadataInput,
): Metadata => {
  const title = `${station.name} - Stacja Ładowania EV w ${station.city} | evsource.pl`;
  const description = `Znajdź ${station.name} w ${station.city}, ${station.province}. ${station.connectorCount} złączy ładowania, ${station.hpcStationCount} stanowisk HPC. Lokalizacja, godziny, opłaty, recenzje.`;
  const url = `${SITE_URL}/stations/${station.id}`;
  const imageUrl = `${SITE_URL}/og-image-default.png`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: station.name,
    url,
    geo: {
      "@type": "GeoCoordinates",
      latitude: station.latitude,
      longitude: station.longitude,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: station.city,
      addressRegion: station.province,
      addressCountry: "PL",
    },
    areaServed: station.province,
  };

  const metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "evsource.pl",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      // non-standard alias kept alongside `images` for consumers that read
      // a single-image shape; Next.js itself only reads `images`.
      image: { url: imageUrl, width: 1200, height: 630, alt: title },
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [imageUrl],
    },
    other: {
      // Stored as a live object (not a JSON string) so callers can read
      // `metadata.other["structured-data"]` directly; the consuming page is
      // responsible for serializing it into a `<script type="application/ld+json">`
      // tag — Next.js's `other` field only renders plain `<meta>` tags, so this
      // key is never itself emitted as valid JSON-LD.
      "structured-data": structuredData as unknown as string,
    },
  };

  return metadata as unknown as Metadata;
};

export interface ConnectorMetadataInput {
  type: string;
  description?: string;
}

export const generateConnectorMetadata = (
  connector: ConnectorMetadataInput,
): Metadata => {
  const title = `${connector.type} Złącze Ładowania - Poradnik | evsource.pl`;
  const description =
    connector.description ||
    `Informacje o złączu ${connector.type}. Kompatybilne samochody, stacje, wersje normy.`;
  const url = `${SITE_URL}/connectors/${connector.type}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [
        {
          url: `${SITE_URL}/og-image-default.png`,
          width: 1200,
          height: 630,
        },
      ],
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
