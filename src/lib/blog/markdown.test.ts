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
});

describe("Security: XSS Prevention in Markdown Links", () => {
  it("allows valid http URLs", () => {
    const content = "[link](http://example.com)";
    const sections = parseMarkdown(content);
    const paragraph = sections.find((s) => s.type === "paragraph");

    expect(paragraph?.content).toContain('<a href="http://example.com"');
    expect(paragraph?.content).toContain("link</a>");
  });

  it("allows valid https URLs", () => {
    const content = "[link](https://example.com)";
    const sections = parseMarkdown(content);
    const paragraph = sections.find((s) => s.type === "paragraph");

    expect(paragraph?.content).toContain('<a href="https://example.com"');
    expect(paragraph?.content).toContain("link</a>");
  });

  it("allows relative paths", () => {
    const content = "[link](/coverage)";
    const sections = parseMarkdown(content);
    const paragraph = sections.find((s) => s.type === "paragraph");

    expect(paragraph?.content).toContain('<a href="/coverage"');
    expect(paragraph?.content).toContain("link</a>");
  });

  it("prevents javascript: protocol (XSS attack)", () => {
    const content = "[click](javascript:alert('xss'))";
    const sections = parseMarkdown(content);
    const paragraph = sections.find((s) => s.type === "paragraph");

    // Should NOT contain a link tag with href
    expect(paragraph?.content).not.toContain("<a href");
    // Should preserve the link text as plain text
    expect(paragraph?.content).toContain("click");
  });

  it("prevents data: protocol (XSS attack)", () => {
    const content = "[click](data:text/html,<img src=x onerror=alert(1)>)";
    const sections = parseMarkdown(content);
    const paragraph = sections.find((s) => s.type === "paragraph");

    // Should NOT contain a link tag with href
    expect(paragraph?.content).not.toContain("<a href");
    // Should preserve the link text as plain text
    expect(paragraph?.content).toContain("click");
  });

  it("prevents vbscript: protocol (legacy XSS)", () => {
    const content = "[click](vbscript:msgbox('xss'))";
    const sections = parseMarkdown(content);
    const paragraph = sections.find((s) => s.type === "paragraph");

    // Should NOT contain a link tag with href
    expect(paragraph?.content).not.toContain("<a href");
    // Should preserve the link text as plain text
    expect(paragraph?.content).toContain("click");
  });

  it("prevents protocol-less URLs with colons (edge case)", () => {
    const content = "[click](java script:alert(1))";
    const sections = parseMarkdown(content);
    const paragraph = sections.find((s) => s.type === "paragraph");

    // Should NOT contain a link tag with href
    expect(paragraph?.content).not.toContain("<a href");
    // Should preserve the link text as plain text
    expect(paragraph?.content).toContain("click");
  });

  it("sanitizes links in list items", () => {
    const content = `- Valid: [link](https://safe.com)
- Invalid: [xss](javascript:void(0))
- Relative: [path](/home)`;

    const sections = parseMarkdown(content);
    const listSection = sections.find((s) => s.type === "list");

    expect(listSection).toBeDefined();
    expect(listSection?.items).toHaveLength(3);

    // Valid HTTPS link should contain href
    expect(listSection?.items?.[0]).toContain('<a href="https://safe.com"');
    expect(listSection?.items?.[0]).toContain("link</a>");

    // Invalid javascript link should NOT contain href, but should have text
    expect(listSection?.items?.[1]).not.toContain("<a href");
    expect(listSection?.items?.[1]).toContain("xss");

    // Relative path should contain href
    expect(listSection?.items?.[2]).toContain('<a href="/home"');
    expect(listSection?.items?.[2]).toContain("path</a>");
  });
});
