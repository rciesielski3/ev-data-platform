import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Analytics Dashboard | EVSource",
  description: "Monitor SEO performance, traffic metrics, and user engagement.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AnalyticsDashboard() {
  return (
    <main className="flex-1">
      <div className="page-shell pb-20 pt-12 sm:pt-16">
        <div className="mb-12">
          <h1 className="mb-2 font-display text-4xl font-semibold tracking-tight text-forest sm:text-5xl">
            SEO Analytics Dashboard
          </h1>
          <p className="muted max-w-2xl text-lg">
            Monitor SEO performance, traffic metrics, and user engagement
          </p>
        </div>

        {/* Measurement Schema Documentation */}
        <section className="mb-12">
          <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-forest">
            Measurement Schema
          </h2>

          <div className="space-y-6">
            {/* Event Definitions */}
            <div className="card">
              <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-forest">
                GA4 Events Tracked
              </h3>

              <div className="space-y-4">
                <div className="border-l-4 border-sun pl-4">
                  <h4 className="font-semibold text-forest">
                    blog_post_view
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Fired when a blog post page loads
                  </p>
                  <div className="mt-2 rounded-lg bg-forest/5 p-2 font-mono text-xs">
                    <code>
                      Parameters: blog_slug, blog_title
                    </code>
                  </div>
                </div>

                <div className="border-l-4 border-sun pl-4">
                  <h4 className="font-semibold text-forest">
                    blog_cta_click
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Fired when a call-to-action is clicked
                  </p>
                  <div className="mt-2 rounded-lg bg-forest/5 p-2 font-mono text-xs">
                    <code>
                      Parameters: blog_slug, cta_type, cta_label
                    </code>
                  </div>
                </div>

                <div className="border-l-4 border-sun pl-4">
                  <h4 className="font-semibold text-forest">
                    internal_link_click
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Fired when an internal link is clicked
                  </p>
                  <div className="mt-2 rounded-lg bg-forest/5 p-2 font-mono text-xs">
                    <code>
                      Parameters: blog_slug, target_path, link_text
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Implementation */}
            <div className="card">
              <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-forest">
                Tracking Implementation
              </h3>

              <div className="space-y-4 text-sm text-forest/80">
                <p>
                  <strong>Location:</strong>{" "}
                  <code className="rounded bg-forest/10 px-2 py-1">
                    src/lib/analytics/events.ts
                  </code>
                </p>

                <p>
                  <strong>Blog Post Component:</strong>{" "}
                  <code className="rounded bg-forest/10 px-2 py-1">
                    src/app/blog/[slug]/blog-post-content.tsx
                  </code>
                  <span className="ml-2 text-forest/70">
                    (Client component with automatic tracking)
                  </span>
                </p>

                <div className="rounded-2xl border border-forest/10 bg-forest/5 p-4">
                  <p className="font-semibold text-forest">
                    GA4 Setup Requirements:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-forest/80">
                    <li>Add gtag to site header (Vercel script injection)</li>
                    <li>Configure custom events in GA4 property</li>
                    <li>Test with GA4 DebugView in development</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="card">
              <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-forest">
                Key Metrics to Monitor
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-forest/5 p-4">
                  <h4 className="font-semibold text-forest">
                    Blog Traffic
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Total sessions and users visiting blog posts
                  </p>
                </div>

                <div className="rounded-2xl bg-forest/5 p-4">
                  <h4 className="font-semibold text-forest">
                    Engagement Rate
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Percentage of users interacting with CTAs or links
                  </p>
                </div>

                <div className="rounded-2xl bg-forest/5 p-4">
                  <h4 className="font-semibold text-forest">
                    Click-Through Rate
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Internal link clicks as percentage of page views
                  </p>
                </div>

                <div className="rounded-2xl bg-forest/5 p-4">
                  <h4 className="font-semibold text-forest">
                    Bounce Rate
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Percentage of single-page sessions
                  </p>
                </div>

                <div className="rounded-2xl bg-forest/5 p-4">
                  <h4 className="font-semibold text-forest">
                    Avg. Time on Page
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Average engagement duration per blog post
                  </p>
                </div>

                <div className="rounded-2xl bg-forest/5 p-4">
                  <h4 className="font-semibold text-forest">
                    Conversion Value
                  </h4>
                  <p className="mt-1 text-sm text-forest/70">
                    Traffic to key pages (/stations, /operators, etc)
                  </p>
                </div>
              </div>
            </div>

            {/* SEO Keywords */}
            <div className="card">
              <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-forest">
                Target Keywords
              </h3>

              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-forest/10 pb-3">
                  <div>
                    <p className="font-semibold text-forest">
                      charging network comparison
                    </p>
                    <p className="text-sm text-forest/70">
                      High intent: 800-1200 monthly searches
                    </p>
                  </div>
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    High Priority
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-forest/10 pb-3">
                  <div>
                    <p className="font-semibold text-forest">
                      EV adoption Poland
                    </p>
                    <p className="text-sm text-forest/70">
                      Medium intent: 500-800 monthly searches
                    </p>
                  </div>
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    High Priority
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-forest">
                      fleet operator charging
                    </p>
                    <p className="text-sm text-forest/70">
                      Medium intent: 300-500 monthly searches
                    </p>
                  </div>
                  <span className="rounded-full bg-sun px-3 py-1 text-xs font-semibold text-forest">
                    Medium Priority
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Goals */}
            <div className="card">
              <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-forest">
                Performance Targets
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-forest/80">
                    Blog monthly organic traffic
                  </span>
                  <span className="font-semibold text-forest">
                    500-1000 sessions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-forest/80">Internal link CTR</span>
                  <span className="font-semibold text-forest">
                    20-30%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-forest/80">
                    Average engagement time
                  </span>
                  <span className="font-semibold text-forest">
                    3-5 minutes
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-forest/80">
                    Target keyword rankings
                  </span>
                  <span className="font-semibold text-forest">
                    Top 3 positions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-forest/80">Blog bounce rate</span>
                  <span className="font-semibold text-forest">
                    &lt; 40%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-forest">
            Next Steps
          </h2>

          <div className="card">
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-forest text-sun w-8 h-8 flex items-center justify-center font-semibold">
                  1
                </span>
                <div>
                  <p className="font-semibold text-forest">
                    Deploy blog infrastructure
                  </p>
                  <p className="text-sm text-forest/70">
                    Verify blog pages render correctly with proper metadata
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-forest text-sun w-8 h-8 flex items-center justify-center font-semibold">
                  2
                </span>
                <div>
                  <p className="font-semibold text-forest">
                    Configure GA4 events
                  </p>
                  <p className="text-sm text-forest/70">
                    Set up custom events and event parameters in GA4 property
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-forest text-sun w-8 h-8 flex items-center justify-center font-semibold">
                  3
                </span>
                <div>
                  <p className="font-semibold text-forest">
                    Test event tracking
                  </p>
                  <p className="text-sm text-forest/70">
                    Verify events fire correctly using GA4 DebugView
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-forest text-sun w-8 h-8 flex items-center justify-center font-semibold">
                  4
                </span>
                <div>
                  <p className="font-semibold text-forest">
                    Monitor keyword rankings
                  </p>
                  <p className="text-sm text-forest/70">
                    Track target keywords in search console and tools
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-forest text-sun w-8 h-8 flex items-center justify-center font-semibold">
                  5
                </span>
                <div>
                  <p className="font-semibold text-forest">
                    Implement phase 2F
                  </p>
                  <p className="text-sm text-forest/70">
                    Link building and content promotion strategy
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
