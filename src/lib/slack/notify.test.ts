import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notifyPerCapitaRegression,
  notifyStationCountRegression,
} from "./notify";

global.fetch = vi.fn();

describe("Slack Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
  });

  it("notifyPerCapitaRegression sends formatted message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    await notifyPerCapitaRegression("Mazovia", 0.07, "per100k");

    expect(fetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/test",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const body = JSON.parse(
      vi.mocked(fetch).mock.calls[0][1]?.body as string,
    );
    expect(body.attachments[0].text).toContain("Mazovia");
    expect(body.attachments[0].text).toContain("7.0%");
  });

  it("notifyPerCapitaRegression handles missing SLACK_WEBHOOK_URL gracefully", async () => {
    delete process.env.SLACK_WEBHOOK_URL;

    await expect(
      notifyPerCapitaRegression("Mazovia", 0.07, "per100k"),
    ).resolves.not.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("notifyPerCapitaRegression formats per1000km2 metric correctly", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    await notifyPerCapitaRegression("Silesia", 0.08, "per1000km2");

    const body = JSON.parse(
      vi.mocked(fetch).mock.calls[0][1]?.body as string,
    );
    expect(body.attachments[0].text).toContain("1000km²");
    expect(body.attachments[0].text).toContain("8.0%");
  });

  it("notifyStationCountRegression sends formatted message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    await notifyStationCountRegression(0.05, 10000, 9500);

    expect(fetch).toHaveBeenCalled();
    const body = JSON.parse(
      vi.mocked(fetch).mock.calls[0][1]?.body as string,
    );
    expect(body.attachments[0].text).toContain("5.0%");
    expect(body.attachments[0].text).toContain("10000");
    expect(body.attachments[0].text).toContain("9500");
  });

  it("notifyStationCountRegression handles missing SLACK_WEBHOOK_URL gracefully", async () => {
    delete process.env.SLACK_WEBHOOK_URL;

    await expect(
      notifyStationCountRegression(0.05, 10000, 9500),
    ).resolves.not.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("notifyPerCapitaRegression handles fetch errors gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    await expect(
      notifyPerCapitaRegression("Mazovia", 0.07, "per100k"),
    ).resolves.not.toThrow();
  });

  it("notifyStationCountRegression handles fetch errors gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    await expect(
      notifyStationCountRegression(0.05, 10000, 9500),
    ).resolves.not.toThrow();
  });
});
