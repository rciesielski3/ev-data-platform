import { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SITE_URL } from "@/lib/config/site";

interface BlogPost {
  title: string;
  excerpt: string;
  keywords: string[];
  date: string;
  author: string;
}

export const metadata: Metadata = {
  title: "Blog | EVSource",
  description:
    "Stay updated with the latest insights on EV charging infrastructure, adoption trends, and fleet electrification in Poland.",
  openGraph: {
    title: "Blog | EVSource",
    description:
      "Stay updated with the latest insights on EV charging infrastructure, adoption trends, and fleet electrification in Poland.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default function BlogPage() {
  const t = useTranslations("blog");
  const postsData = t.raw("posts") as Record<string, BlogPost>;
  const posts = Object.entries(postsData).map(([slug, data]) => ({
    slug,
    title: data.title,
    excerpt: data.excerpt,
    keywords: data.keywords,
    date: data.date,
    author: data.author,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">{t("ui.pageHeading")}</h1>
          <p className="text-lg text-slate-600">
            {t("ui.pageDescription")}
          </p>
        </div>

        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="card border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="mb-2 text-2xl font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {post.title}
                </h2>
              </Link>

              <p className="mb-4 text-slate-600">{post.excerpt}</p>

              <div className="mb-4 flex flex-wrap gap-2">
                {post.keywords.slice(0, 3).map((keyword: string) => (
                  <span
                    key={keyword}
                    className="badge inline-block bg-slate-100 text-slate-700 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <time dateTime={post.date} className="text-slate-500">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {post.author && (
                  <span className="text-slate-500">{t("ui.authorByline", { author: post.author })}</span>
                )}
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-block text-emerald-600 font-medium hover:text-emerald-700"
              >
                {t("ui.readMore")}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
