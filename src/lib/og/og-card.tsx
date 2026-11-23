import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const FOREST = "#0d2b22";
const CREAM = "#f6f1e7";
const SUN = "#f2a65a";
const MAX_TITLE_LENGTH = 90;

export type OgCardInput = {
  badge: string;
  title: string;
  stat?: { value: string; label: string };
};

const loadFont = () =>
  readFile(join(process.cwd(), "src/lib/og/inter-600.woff"));

const fitTitle = (title: string) =>
  title.length > MAX_TITLE_LENGTH
    ? `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
    : title;

const titleFontSize = (title: string) => {
  if (title.length > 60) return 52;
  if (title.length > 36) return 64;
  if (title.length > 20) return 80;
  return 96;
};

export const renderOgCard = async ({ badge, title, stat }: OgCardInput) => {
  const fontData = await loadFont();
  const text = fitTitle(title);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: FOREST,
          color: CREAM,
          padding: 72,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="56" height="56" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="10" fill="#059669" />
            <path
              d="M25 13 L15.5 13 C11.5 13 11.5 20 15.5 20 L24.5 20 C28.5 20 28.5 27 24.5 27 L15 27"
              fill="none"
              stroke="#F7FAF7"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", marginLeft: 20, fontSize: 40 }}>
            <span>EV</span>
            <span style={{ color: SUN }}>Source</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 28, color: SUN }}>{badge}</div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: titleFontSize(text),
              lineHeight: 1.1,
              wordBreak: "break-word",
            }}
          >
            {text}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          {stat ? (
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <div style={{ display: "flex", fontSize: 72, color: SUN }}>
                {stat.value}
              </div>
              <div style={{ display: "flex", marginLeft: 20, fontSize: 32 }}>
                {stat.label}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <div style={{ display: "flex", fontSize: 28, opacity: 0.7 }}>
            evsource.pl
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Inter", data: fontData, weight: 600, style: "normal" }],
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    },
  );
};
