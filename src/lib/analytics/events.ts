/**
 * GA4 Event Tracking Functions
 * These functions should be called from client components to track user interactions
 */

export interface EventPayload {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track when a blog post is viewed
 */
export const trackBlogPostView = (slug: string, title: string) => {
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtagWindow = window as Window & {
      gtag: (command: string, event: string, data: Record<string, string>) => void;
    };
    gtagWindow.gtag("event", "blog_post_view", {
      blog_slug: slug,
      blog_title: title,
    });
  }
};

/**
 * Track when a CTA (call-to-action) button is clicked on a blog post
 */
export const trackBlogCTAClick = (
  slug: string,
  ctaType: "link" | "button",
  ctaLabel: string,
) => {
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtagWindow = window as Window & {
      gtag: (command: string, event: string, data: Record<string, string>) => void;
    };
    gtagWindow.gtag("event", "blog_cta_click", {
      blog_slug: slug,
      cta_type: ctaType,
      cta_label: ctaLabel,
    });
  }
};

/**
 * Track when an internal link is clicked on a blog post
 */
export const trackInternalLinkClick = (
  slug: string,
  targetPath: string,
  linkText: string,
) => {
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtagWindow = window as Window & {
      gtag: (command: string, event: string, data: Record<string, string>) => void;
    };
    gtagWindow.gtag("event", "internal_link_click", {
      blog_slug: slug,
      target_path: targetPath,
      link_text: linkText,
    });
  }
};

/**
 * Track page view with custom parameters
 */
export const trackPageView = (
  pagePath: string,
  pageTitle: string,
  additionalParams?: EventPayload,
) => {
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtagWindow = window as Window & {
      gtag: (command: string, data: Record<string, unknown>) => void;
    };
    gtagWindow.gtag("config", {
      page_path: pagePath,
      page_title: pageTitle,
      ...additionalParams,
    });
  }
};

/**
 * Track custom events
 */
export const trackCustomEvent = (eventName: string, params?: EventPayload) => {
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtagWindow = window as Window & {
      gtag: (command: string, event: string, data?: Record<string, unknown>) => void;
    };
    gtagWindow.gtag("event", eventName, params || {});
  }
};
