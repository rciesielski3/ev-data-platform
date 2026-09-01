import { describe, it, expect } from "vitest";
import { parseMarkdown } from "./markdown";

describe("blog/markdown", () => {
  it("should parse headings", () => {
    const content = "# Heading 1\n## Heading 2\n### Heading 3";
    const sections = parseMarkdown(content);

    expect(sections).toContainEqual({
      type: "heading",
      level: 1,
      content: "Heading 1",
    });
    expect(sections).toContainEqual({
      type: "heading",
      level: 2,
      content: "Heading 2",
    });
    expect(sections).toContainEqual({
      type: "heading",
      level: 3,
      content: "Heading 3",
    });
  });

  it("should parse paragraphs", () => {
    const content = "This is a paragraph.\n\nThis is another paragraph.";
    const sections = parseMarkdown(content);

    expect(sections).toContainEqual(
      expect.objectContaining({
        type: "paragraph",
        content: expect.stringContaining("This is a paragraph"),
      }),
    );
  });

  it("should parse unordered lists", () => {
    const content = "- Item 1\n- Item 2\n- Item 3";
    const sections = parseMarkdown(content);

    const listSection = sections.find((s) => s.type === "list");
    expect(listSection).toBeDefined();
    expect(listSection?.items).toEqual(["Item 1", "Item 2", "Item 3"]);
    expect(listSection?.ordered).toBe(false);
  });

  it("should parse ordered lists", () => {
    const content = "1. First\n2. Second\n3. Third";
    const sections = parseMarkdown(content);

    const listSection = sections.find((s) => s.type === "list");
    expect(listSection).toBeDefined();
    expect(listSection?.items).toEqual(["First", "Second", "Third"]);
    expect(listSection?.ordered).toBe(true);
  });

  it("should convert markdown links to HTML", () => {
    const content = "This is a [link](/path).";
    const sections = parseMarkdown(content);

    const paragraph = sections.find((s) => s.type === "paragraph");
    expect(paragraph?.content).toContain('<a href="/path"');
    expect(paragraph?.content).toContain("link</a>");
  });

  it("should handle blockquotes", () => {
    const content = "> This is a quote";
    const sections = parseMarkdown(content);

    expect(sections).toContainEqual(
      expect.objectContaining({
        type: "blockquote",
        content: "This is a quote",
      }),
    );
  });

  it("should handle mixed content", () => {
    const content = `# Title

This is a paragraph with [link](/url).

- Item 1
- Item 2

> A quote

## Subheading`;

    const sections = parseMarkdown(content);

    expect(sections.some((s) => s.type === "heading" && s.level === 1)).toBe(
      true,
    );
    expect(sections.some((s) => s.type === "paragraph")).toBe(true);
    expect(sections.some((s) => s.type === "list")).toBe(true);
    expect(sections.some((s) => s.type === "blockquote")).toBe(true);
  });

  it("should filter empty lines", () => {
    const content = "Paragraph 1\n\n\n\nParagraph 2";
    const sections = parseMarkdown(content);

    expect(sections.length).toBe(2);
    expect(sections[0].type).toBe("paragraph");
    expect(sections[1].type).toBe("paragraph");
  });

  it("should convert bold markdown to HTML", () => {
    const content = "This is **bold text** in a paragraph.";
    const sections = parseMarkdown(content);

    const paragraph = sections.find((s) => s.type === "paragraph");
    expect(paragraph?.content).toContain("<strong>bold text</strong>");
  });

  it("should convert italic markdown to HTML", () => {
    const content = "This is *italic text* in a paragraph.";
    const sections = parseMarkdown(content);

    const paragraph = sections.find((s) => s.type === "paragraph");
    expect(paragraph?.content).toContain("<em>italic text</em>");
  });

  it("should handle bold and italic in list items", () => {
    const content = "- This is **bold** in a list\n- This is *italic* too";
    const sections = parseMarkdown(content);

    const listSection = sections.find((s) => s.type === "list");
    expect(listSection?.items?.[0]).toContain("<strong>bold</strong>");
    expect(listSection?.items?.[1]).toContain("<em>italic</em>");
  });

  it("should handle underscores as bold and italic", () => {
    const content = "This is __bold__ and _italic_ text.";
    const sections = parseMarkdown(content);

    const paragraph = sections.find((s) => s.type === "paragraph");
    expect(paragraph?.content).toContain("<strong>bold</strong>");
    expect(paragraph?.content).toContain("<em>italic</em>");
  });

  describe("XSS Security", () => {
    it("should escape script tags in bold formatting", () => {
      const content = "**<script>alert('xss')</script>**";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).toContain("&lt;script&gt;");
      expect(paragraph?.content).toContain("&lt;/script&gt;");
      expect(paragraph?.content).not.toContain("<script>");
    });

    it("should escape script tags in italic formatting", () => {
      const content = "*<script>alert('xss')</script>*";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).toContain("&lt;script&gt;");
      expect(paragraph?.content).not.toContain("<script>");
    });

    it("should escape img tags with event handlers", () => {
      const content = "*<img src=x onerror=\"alert('xss')\">*";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).toContain("&lt;img");
      expect(paragraph?.content).not.toContain("<img");
    });

    it("should escape HTML injection in link text", () => {
      const content = "[<img src=x onerror=\"alert('xss')\">](https://example.com)";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).toContain("&lt;img");
      expect(paragraph?.content).not.toContain("<img");
    });

    it("should escape HTML entities in regular text", () => {
      const content = "This is 5 < 10 and 10 > 5";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).toContain("&lt;");
      expect(paragraph?.content).toContain("&gt;");
      expect(paragraph?.content).not.toContain("< 10");
      expect(paragraph?.content).not.toContain("> 5");
    });

    it("should escape ampersands in text", () => {
      const content = "Tom & Jerry";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).toContain("&amp;");
    });

    it("should escape quotes in link URLs", () => {
      const content = '[link](https://example.com?q="xss")';
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).toMatch(/&(?:amp;)?quot;/);
      expect(paragraph?.content).not.toContain('q="xss');
    });

    it("should escape script tags in list items", () => {
      const content = "- Item with **<script>alert('xss')</script>**\n- Normal item";
      const sections = parseMarkdown(content);

      const listSection = sections.find((s) => s.type === "list");
      expect(listSection?.items?.[0]).toContain("&lt;script&gt;");
      expect(listSection?.items?.[0]).not.toContain("<script>");
    });

    it("should escape HTML in blockquotes", () => {
      const content = "> This has **<script>alert('xss')</script>** content";
      const sections = parseMarkdown(content);

      const blockquote = sections.find((s) => s.type === "blockquote");
      expect(blockquote?.content).toContain("&lt;script&gt;");
      expect(blockquote?.content).not.toContain("<script>");
    });

    it("should reject javascript: protocol in links", () => {
      const content = "[click me](javascript:alert('xss'))";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).not.toContain("href=");
      expect(paragraph?.content).toContain("click me");
    });

    it("should reject data: protocol in links", () => {
      const content = "[click me](data:text/html,<script>alert('xss')</script>)";
      const sections = parseMarkdown(content);

      const paragraph = sections.find((s) => s.type === "paragraph");
      expect(paragraph?.content).not.toContain("href=");
      expect(paragraph?.content).toContain("click me");
    });
  });
});
