import { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PostIllustration } from "@/components/blog/post-illustration";
import type { BlogPost } from "@/lib/blog/types";
import { SITE_URL } from "@/lib/config/site";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("blog.ui");
  const description = t("metaDescription");

  return {
    title: "Blog | EVSource",
    description,
    alternates: { canonical: "/blog" },
    openGraph: {
      title: "Blog | EVSource",
      description,
      url: `${SITE_URL}/blog`,
      type: "website",
    },
  };
};

export default function BlogPage() {
  const t = useTranslations("blog");
  const postsData = t.raw("posts") as Record<string, Omit<BlogPost, "slug">>;
  const posts: BlogPost[] = Object.entries(postsData)
    .map(([slug, data]) => ({
      ...data,
      slug,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-forest sm:text-5xl">
          {t("ui.pageHeading")}
        </h1>
        <p className="muted mt-4 text-lg">{t("ui.pageDescription")}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="card group relative flex flex-col overflow-hidden transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
          >
            <PostIllustration slug={post.slug} />
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {post.keywords.slice(0, 1).map((keyword: string) => (
                  <span key={keyword} className="badge">
                    {keyword}
                  </span>
                ))}
                <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-medium text-forest/70">
                  {t("ui.minRead", {
                    minutes: Math.ceil(post.content.split(/\s+/).length / 200),
                  })}
                </span>
              </div>

              <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-forest">
                <Link
                  href={`/blog/${post.slug}`}
                  className="after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="muted mt-3 line-clamp-4 flex-1 text-sm leading-relaxed">
                {post.excerpt}
              </p>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-forest/10 pt-4 text-sm">
                <div className="flex flex-col text-forest/70">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {post.author && (
                    <span className="text-xs">
                      {t("ui.authorByline", { author: post.author })}
                    </span>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition-all duration-300 group-hover:bg-sun group-hover:text-forest motion-safe:group-hover:rotate-45"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
