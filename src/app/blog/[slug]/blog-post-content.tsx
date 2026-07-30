"use client";

import { useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import type { BlogPost } from "@/lib/blog/types";
import { trackBlogPostView } from "@/lib/analytics/events";
import { parseMarkdown } from "@/lib/blog/markdown";

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  // Track blog post view on component mount
  useEffect(() => {
    trackBlogPostView(post.slug, post.title);
  }, [post.slug, post.title]);

  // Parse markdown content
  const sections = parseMarkdown(post.content);

  return (
    <article className="prose prose-sm max-w-none">
      {sections.map((section, index) => {
        if (section.type === "heading") {
          const HeadingTag = `h${section.level}` as
            | "h1"
            | "h2"
            | "h3"
            | "h4"
            | "h5"
            | "h6";
          return (
            <HeadingTag
              key={index}
              className={`mt-8 mb-4 font-bold text-slate-900 ${
                section.level === 1
                  ? "text-3xl"
                  : section.level === 2
                    ? "text-2xl"
                    : section.level === 3
                      ? "text-xl"
                      : "text-lg"
              }`}
            >
              {section.content || ""}
            </HeadingTag>
          );
        }

        if (section.type === "paragraph") {
          return (
            <p
              key={index}
              className="mb-4 text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(section.content || ""),
              }}
            />
          );
        }

        if (section.type === "list") {
          return section.ordered ? (
            <ol
              key={index}
              className="mb-4 ml-6 list-decimal space-y-2 text-slate-700"
            >
              {section.items?.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
              ))}
            </ol>
          ) : (
            <ul
              key={index}
              className="mb-4 ml-6 list-disc space-y-2 text-slate-700"
            >
              {section.items?.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
              ))}
            </ul>
          );
        }

        if (section.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className="mb-4 border-l-4 border-emerald-500 bg-slate-50 pl-4 italic text-slate-700"
            >
              {section.content || ""}
            </blockquote>
          );
        }

        return null;
      })}
    </article>
  );
}
