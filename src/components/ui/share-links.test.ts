import { describe, expect, it } from "vitest";

import { buildShareLinks } from "./share-links";

describe("buildShareLinks", () => {
  it("builds the three share targets with encoded urls", () => {
    const links = buildShareLinks("https://evsource.pl/blog/a", "Tytuł");

    expect(links.linkedin).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fevsource.pl%2Fblog%2Fa",
    );
    expect(links.facebook).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fevsource.pl%2Fblog%2Fa",
    );
    expect(links.x).toBe(
      "https://twitter.com/intent/tweet?url=https%3A%2F%2Fevsource.pl%2Fblog%2Fa&text=Tytu%C5%82",
    );
  });

  it("encodes Polish diacritics, ampersands and question marks in the title", () => {
    const { x } = buildShareLinks(
      "https://evsource.pl/x",
      "Łódź & Gdańsk: czy to działa?",
    );

    expect(x).toContain("text=%C5%81%C3%B3d%C5%BA%20%26%20Gda%C5%84sk%3A%20czy%20to%20dzia%C5%82a%3F");
    expect(new URL(x).searchParams.get("text")).toBe("Łódź & Gdańsk: czy to działa?");
  });

  it("keeps a url with its own query string as a single parameter", () => {
    const target = "https://evsource.pl/stations?q=Łódź&operator=A&B";
    const links = buildShareLinks(target, "t");

    for (const link of [links.linkedin, links.facebook, links.x]) {
      const params = new URL(link).searchParams;
      expect(params.get("url") ?? params.get("u")).toBe(target);
    }
    expect(new URL(links.x).searchParams.get("text")).toBe("t");
  });
});
