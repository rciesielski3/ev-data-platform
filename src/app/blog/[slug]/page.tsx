import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getAllBlogSlugs } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/config/site";
import BlogPostContent from "./blog-post-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = async () => {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Not Found",
    };
  }

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
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/blog"
            className="mb-4 inline-block text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back to Blog
          </Link>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
            {post.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.author && <span>by {post.author}</span>}
            <span>
              {Math.ceil(post.content.split(/\s+/).length / 200)} min read
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span
                key={keyword}
                className="badge inline-block bg-emerald-100 text-emerald-700 text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </header>

        <div className="border-t border-slate-200 pt-8">
          {/* Blog content with tracking */}
          <BlogPostContent post={post} />
        </div>

        {/* Related links */}
        <aside className="mt-12 border-t border-slate-200 pt-8">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Explore More
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/stations"
              className="card border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-emerald-600 mb-2">
                Stations Directory
              </h4>
              <p className="text-sm text-slate-600">
                Explore charging stations across Poland
              </p>
            </Link>
            <Link
              href="/insights"
              className="card border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-emerald-600 mb-2">
                Key Insights
              </h4>
              <p className="text-sm text-slate-600">
                View charging infrastructure analytics
              </p>
            </Link>
            <Link
              href="/coverage"
              className="card border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-emerald-600 mb-2">
                Coverage Analysis
              </h4>
              <p className="text-sm text-slate-600">
                Regional coverage and statistics
              </p>
            </Link>
            <Link
              href="/operators"
              className="card border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-emerald-600 mb-2">
                Operators
              </h4>
              <p className="text-sm text-slate-600">
                Charging network operators and details
              </p>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
