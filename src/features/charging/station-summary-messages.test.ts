import { describe, expect, it } from "vitest";

import enMessages from "../../../messages/en.json";
import plMessages from "../../../messages/pl.json";

const SUMMARY_KEYS = [
  "summarySubjectWithOperator",
  "summarySubjectGeneric",
  "summaryInCity",
  "summaryWithConnectorsUpTo",
  "summaryWithConnectors",
  "summaryWithPowerOnly",
];

describe("station summary sentence messages", () => {
  it.each([
    ["en", enMessages],
    ["pl", plMessages],
  ])("%s defines every summary key in the stations namespace", (_locale, messages) => {
    const namespace = messages.stations as Record<string, string>;

    SUMMARY_KEYS.forEach((key) => {
      expect(namespace[key]).toEqual(expect.any(String));
    });
  });
});
