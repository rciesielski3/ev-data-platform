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
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">
            SEO Analytics Dashboard
          </h1>
          <p className="text-lg text-slate-600">
            Monitor SEO performance, traffic metrics, and user engagement
          </p>
        </div>

        {/* Measurement Schema Documentation */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Measurement Schema
          </h2>

          <div className="space-y-6">
            {/* Event Definitions */}
            <div className="card border border-slate-200 p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                GA4 Events Tracked
              </h3>

              <div className="space-y-4">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h4 className="font-semibold text-slate-900">
                    blog_post_view
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Fired when a blog post page loads
                  </p>
                  <div className="mt-2 rounded bg-slate-50 p-2 font-mono text-xs">
                    <code>
                      Parameters: blog_slug, blog_title
                    </code>
                  </div>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4">
                  <h4 className="font-semibold text-slate-900">
                    blog_cta_click
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Fired when a call-to-action is clicked
                  </p>
                  <div className="mt-2 rounded bg-slate-50 p-2 font-mono text-xs">
                    <code>
                      Parameters: blog_slug, cta_type, cta_label
                    </code>
                  </div>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4">
                  <h4 className="font-semibold text-slate-900">
                    internal_link_click
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Fired when an internal link is clicked
                  </p>
                  <div className="mt-2 rounded bg-slate-50 p-2 font-mono text-xs">
                    <code>
                      Parameters: blog_slug, target_path, link_text
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Implementation */}
            <div className="card border border-slate-200 p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Tracking Implementation
              </h3>

              <div className="space-y-4 text-sm text-slate-700">
                <p>
                  <strong>Location:</strong>{" "}
                  <code className="rounded bg-slate-100 px-2 py-1">
                    src/lib/analytics/events.ts
                  </code>
                </p>

                <p>
                  <strong>Blog Post Component:</strong>{" "}
                  <code className="rounded bg-slate-100 px-2 py-1">
                    src/app/blog/[slug]/blog-post-content.tsx
                  </code>
                  <span className="ml-2 text-slate-600">
                    (Client component with automatic tracking)
                  </span>
                </p>

                <div className="rounded bg-blue-50 border border-blue-200 p-4">
                  <p className="font-semibold text-blue-900">
                    GA4 Setup Requirements:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-blue-800">
                    <li>Add gtag to site header (Vercel script injection)</li>
                    <li>Configure custom events in GA4 property</li>
                    <li>Test with GA4 DebugView in development</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="card border border-slate-200 p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Key Metrics to Monitor
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">
                    Blog Traffic
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Total sessions and users visiting blog posts
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">
                    Engagement Rate
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Percentage of users interacting with CTAs or links
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">
                    Click-Through Rate
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Internal link clicks as percentage of page views
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">
                    Bounce Rate
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Percentage of single-page sessions
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">
                    Avg. Time on Page
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Average engagement duration per blog post
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">
                    Conversion Value
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Traffic to key pages (/stations, /operators, etc)
                  </p>
                </div>
              </div>
            </div>

            {/* SEO Keywords */}
            <div className="card border border-slate-200 p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Target Keywords
              </h3>

              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      charging network comparison
                    </p>
                    <p className="text-sm text-slate-600">
                      High intent: 800-1200 monthly searches
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    High Priority
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      EV adoption Poland
                    </p>
                    <p className="text-sm text-slate-600">
                      Medium intent: 500-800 monthly searches
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    High Priority
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      fleet operator charging
                    </p>
                    <p className="text-sm text-slate-600">
                      Medium intent: 300-500 monthly searches
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Medium Priority
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Goals */}
            <div className="card border border-slate-200 p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Performance Targets
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">
                    Blog monthly organic traffic
                  </span>
                  <span className="font-semibold text-emerald-600">
                    500-1000 sessions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Internal link CTR</span>
                  <span className="font-semibold text-emerald-600">
                    20-30%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700">
                    Average engagement time
                  </span>
                  <span className="font-semibold text-emerald-600">
                    3-5 minutes
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700">
                    Target keyword rankings
                  </span>
                  <span className="font-semibold text-emerald-600">
                    Top 3 positions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Blog bounce rate</span>
                  <span className="font-semibold text-emerald-600">
                    &lt; 40%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Next Steps
          </h2>

          <div className="card border border-slate-200 p-6">
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-emerald-100 w-8 h-8 flex items-center justify-center font-semibold text-emerald-700">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Deploy blog infrastructure
                  </p>
                  <p className="text-sm text-slate-600">
                    Verify blog pages render correctly with proper metadata
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-emerald-100 w-8 h-8 flex items-center justify-center font-semibold text-emerald-700">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Configure GA4 events
                  </p>
                  <p className="text-sm text-slate-600">
                    Set up custom events and event parameters in GA4 property
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-emerald-100 w-8 h-8 flex items-center justify-center font-semibold text-emerald-700">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Test event tracking
                  </p>
                  <p className="text-sm text-slate-600">
                    Verify events fire correctly using GA4 DebugView
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-emerald-100 w-8 h-8 flex items-center justify-center font-semibold text-emerald-700">
                  4
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Monitor keyword rankings
                  </p>
                  <p className="text-sm text-slate-600">
                    Track target keywords in search console and tools
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 rounded-full bg-emerald-100 w-8 h-8 flex items-center justify-center font-semibold text-emerald-700">
                  5
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    Implement phase 2F
                  </p>
                  <p className="text-sm text-slate-600">
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
