import { describe, expect, it } from "vitest";

import {
  getConnectorPageEntries,
  getConnectorPageHref,
  getConnectorPageKnowledge,
} from "@/features/charging/connector-pages";

describe("getConnectorPageEntries", () => {
  it("returns connector knowledge pages in user-facing order with stable hrefs", () => {
    expect(
      getConnectorPageEntries().map((connector) => ({
        key: connector.key,
        label: connector.label,
        href: connector.href,
      })),
    ).toEqual([
      { key: "ccs2", label: "CCS2", href: "/connectors/ccs2" },
      { key: "type2", label: "Type 2", href: "/connectors/type2" },
      { key: "chademo", label: "CHAdeMO", href: "/connectors/chademo" },
      { key: "unknown", label: "Unknown", href: "/connectors/unknown" },
    ]);
  });
});

describe("getConnectorPageKnowledge", () => {
  it("finds canonical connector pages from route params", () => {
    expect(getConnectorPageKnowledge("ccs2").label).toBe("CCS2");
    expect(getConnectorPageKnowledge("type2").label).toBe("Type 2");
    expect(getConnectorPageKnowledge("chademo").label).toBe("CHAdeMO");
  });

  it("normalizes route aliases and malformed params to existing knowledge", () => {
    expect(getConnectorPageKnowledge("ccs-combo-2").key).toBe("ccs2");
    expect(getConnectorPageKnowledge("type-2").key).toBe("type2");
    expect(getConnectorPageKnowledge("cha-de-mo").key).toBe("chademo");
    expect(getConnectorPageKnowledge(undefined).key).toBe("unknown");
    expect(getConnectorPageKnowledge("nacs").key).toBe("unknown");
  });
});

describe("getConnectorPageHref", () => {
  it("builds canonical connector detail URLs", () => {
    expect(getConnectorPageHref("ccs2")).toBe("/connectors/ccs2");
    expect(getConnectorPageHref("unknown")).toBe("/connectors/unknown");
  });
});
