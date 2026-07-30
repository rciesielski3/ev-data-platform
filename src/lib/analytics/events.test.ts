import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  trackBlogPostView,
  trackBlogCTAClick,
  trackInternalLinkClick,
  trackPageView,
  trackCustomEvent,
} from "./events";

describe("analytics/events", () => {
  let mockGtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGtag = vi.fn();
    const mockWindow = {
      gtag: mockGtag,
    } as unknown as Window;
    (global as unknown).window = mockWindow;
  });

  it("should track blog post view", () => {
    trackBlogPostView("test-slug", "Test Title");

    expect(mockGtag).toHaveBeenCalledWith("event", "blog_post_view", {
      blog_slug: "test-slug",
      blog_title: "Test Title",
    });
  });

  it("should track blog CTA click", () => {
    trackBlogCTAClick("test-slug", "button", "Read More");

    expect(mockGtag).toHaveBeenCalledWith("event", "blog_cta_click", {
      blog_slug: "test-slug",
      cta_type: "button",
      cta_label: "Read More",
    });
  });

  it("should track internal link click", () => {
    trackInternalLinkClick("test-slug", "/stations", "Stations Directory");

    expect(mockGtag).toHaveBeenCalledWith("event", "internal_link_click", {
      blog_slug: "test-slug",
      target_path: "/stations",
      link_text: "Stations Directory",
    });
  });

  it("should track page view", () => {
    trackPageView("/blog/test", "Test Page", { custom_param: "value" });

    expect(mockGtag).toHaveBeenCalledWith("config", {
      page_path: "/blog/test",
      page_title: "Test Page",
      custom_param: "value",
    });
  });

  it("should track custom events", () => {
    trackCustomEvent("custom_event", {
      param1: "value1",
      param2: 123,
    });

    expect(mockGtag).toHaveBeenCalledWith("event", "custom_event", {
      param1: "value1",
      param2: 123,
    });
  });

  it("should handle missing gtag gracefully", () => {
    (global as unknown).window = {};

    expect(() => {
      trackBlogPostView("test", "Test");
    }).not.toThrow();
  });

  it("should not throw if window is undefined", () => {
    (global as unknown).window = undefined;

    expect(() => {
      trackBlogPostView("test", "Test");
    }).not.toThrow();
  });
});
