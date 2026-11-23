import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllBlogSlugsLocalized } from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/types";
import { SITE_URL } from "@/lib/config/site";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  serializeJsonLd,
} from "@/lib/seo/article-schema";
import { PostIllustration } from "@/components/blog/post-illustration";
import BlogPostContent from "./blog-post-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = async () => {
  const slugs = getAllBlogSlugsLocalized("en");
  return slugs.map((slug) => ({
    slug,
  }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  await getLocale();
  const t = await getTranslations("blog");
  const postData = (t.raw("posts") as Record<string, Omit<BlogPost, "slug">>)[
    slug
  ];

  if (!postData) {
    return {
      title: "Not Found",
    };
  }

  const post: BlogPost = { ...postData, slug };
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${post.title} | EVSource Blog`,
    description: post.excerpt,
    keywords: post.keywords,
    authors: post.author ? [{ name: post.author }] : [],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : [],
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
  };
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const tNav = await getTranslations("nav");
  const tNotFound = await getTranslations("notFound");
  const postData = (t.raw("posts") as Record<string, Omit<BlogPost, "slug">>)[
    slug
  ];

  if (!postData) {
    notFound();
  }

  const post: BlogPost = { ...postData, slug };
  const url = `${SITE_URL}/blog/${post.slug}`;
  const articleJsonLd = buildArticleSchema({
    title: post.title,
    description: post.excerpt,
    url,
    datePublished: post.date,
    inLanguage: locale,
  });
  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: tNotFound("home"), url: SITE_URL },
    { name: tNav("guides"), url: `${SITE_URL}/blog` },
    { name: post.title, url },
  ]);

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="page-shell pb-20 pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-forest/70 transition-colors hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("ui.backToBlog")}
            </Link>

            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-forest sm:text-5xl">
              {post.title}
            </h1>

            <p className="mt-5 text-xl leading-8 text-forest/80 sm:text-2xl sm:leading-9">
              {post.excerpt}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-forest/70">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.author && (
                <span>{t("ui.authorByline", { author: post.author })}</span>
              )}
              <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-medium">
                {t("ui.minRead", {
                  minutes: Math.ceil(post.content.split(/\s+/).length / 200),
                })}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {post.keywords.map((keyword: string) => (
                <span key={keyword} className="badge">
                  {keyword}
                </span>
              ))}
            </div>
          </header>

          <div className="mb-12 overflow-hidden rounded-3xl shadow-[var(--shadow-lift)]">
            <PostIllustration
              slug={post.slug}
              className="sm:aspect-[600/240]"
            />
          </div>

          <div>
            <BlogPostContent post={post} />
          </div>
        </div>

        <aside className="mx-auto mt-16 max-w-3xl border-t border-forest/10 pt-10">
          <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-forest">
            {t("ui.exploreMore")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/stations"
              className="card block p-5 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <h3 className="mb-2 font-display text-lg font-semibold text-forest">
                {t("ui.exploreSectionHeadings.stationsDirectory")}
              </h3>
              <p className="muted text-sm">
                {t("ui.exploreSectionDescriptions.stationsDirectory")}
              </p>
            </Link>
            <Link
              href="/insights"
              className="card block p-5 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <h3 className="mb-2 font-display text-lg font-semibold text-forest">
                {t("ui.exploreSectionHeadings.keyInsights")}
              </h3>
              <p className="muted text-sm">
                {t("ui.exploreSectionDescriptions.keyInsights")}
              </p>
            </Link>
            <Link
              href="/coverage"
              className="card block p-5 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <h3 className="mb-2 font-display text-lg font-semibold text-forest">
                {t("ui.exploreSectionHeadings.coverageAnalysis")}
              </h3>
              <p className="muted text-sm">
                {t("ui.exploreSectionDescriptions.coverageAnalysis")}
              </p>
            </Link>
            <Link
              href="/operators"
              className="card block p-5 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <h3 className="mb-2 font-display text-lg font-semibold text-forest">
                {t("ui.exploreSectionHeadings.operators")}
              </h3>
              <p className="muted text-sm">
                {t("ui.exploreSectionDescriptions.operators")}
              </p>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
