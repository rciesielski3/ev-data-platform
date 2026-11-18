"use client";

import { useEffect } from "react";
import type { BlogPost } from "@/lib/blog/types";
import { trackBlogPostView } from "@/lib/analytics/events";
import { parseMarkdown } from "@/lib/blog/markdown";

const INLINE_CONTENT =
  "[&_a]:font-medium [&_a]:text-forest [&_a]:underline [&_a]:decoration-amber-700 [&_a]:decoration-2 [&_a]:underline-offset-4 hover:[&_a]:bg-sun/40 [&_strong]:font-semibold [&_strong]:text-forest [&_code]:rounded [&_code]:bg-forest/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-base";

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
    <article className="max-w-3xl text-lg leading-8 text-forest/90">
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
              className={`font-display font-semibold tracking-tight text-forest ${
                section.level === 1
                  ? "mb-5 mt-12 text-3xl"
                  : section.level === 2
                    ? "mb-4 mt-12 border-t border-forest/10 pt-10 text-2xl first:mt-0 first:border-t-0 first:pt-0 sm:text-3xl"
                    : section.level === 3
                      ? "mb-3 mt-8 text-xl sm:text-2xl"
                      : "mb-3 mt-6 text-lg"
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
              className={`mb-6 ${INLINE_CONTENT}`}
              dangerouslySetInnerHTML={{
                __html: section.content || "",
              }}
            />
          );
        }

        if (section.type === "list") {
          return section.ordered ? (
            <ol
              key={index}
              className={`mb-6 ml-6 list-decimal space-y-3 marker:font-semibold marker:text-forest/70 ${INLINE_CONTENT}`}
            >
              {section.items?.map((item, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: item,
                  }}
                />
              ))}
            </ol>
          ) : (
            <ul
              key={index}
              className={`mb-6 ml-6 list-disc space-y-3 marker:text-sun ${INLINE_CONTENT}`}
            >
              {section.items?.map((item, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: item,
                  }}
                />
              ))}
            </ul>
          );
        }

        if (section.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className={`mb-6 rounded-r-2xl border-l-4 border-sun bg-forest/5 py-4 pl-6 pr-5 font-display text-xl italic text-forest ${INLINE_CONTENT}`}
              dangerouslySetInnerHTML={{
                __html: section.content || "",
              }}
            />
          );
        }

        return null;
      })}
    </article>
  );
}
