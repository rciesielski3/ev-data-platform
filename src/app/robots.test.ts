import { describe, expect, it } from "vitest";

import robots, { SCRAPER_USER_AGENTS } from "./robots";

describe("robots", () => {
  it("blocks scraper bots entirely and keeps the default rule for everyone else", () => {
    const { rules } = robots();
    const list = Array.isArray(rules) ? rules : [rules];

    expect(list[0]).toMatchObject({ userAgent: SCRAPER_USER_AGENTS, disallow: "/" });
    expect(list[1]).toMatchObject({ userAgent: "*", allow: "/" });
  });

  it("never blocks search engines", () => {
    expect(SCRAPER_USER_AGENTS).not.toContain("Googlebot");
    expect(SCRAPER_USER_AGENTS).not.toContain("bingbot");
  });
});
