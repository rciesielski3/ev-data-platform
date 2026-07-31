/**
 * Simple markdown parser for blog content
 * Handles headings, paragraphs, lists, blockquotes, and inline links
 */

export interface MarkdownSection {
  type: "heading" | "paragraph" | "list" | "blockquote";
  level?: number;
  content?: string;
  ordered?: boolean;
  items?: string[];
}

/**
 * Parse markdown content into structured sections
 */
export const parseMarkdown = (content: string): MarkdownSection[] => {
  const lines = content.split("\n").filter((line) => line.trim());
  const sections: MarkdownSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Handle headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      sections.push({
        type: "heading",
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      i++;
      continue;
    }

    // Handle blockquotes
    if (line.startsWith(">")) {
      sections.push({
        type: "blockquote",
        content: line.substring(1).trim(),
      });
      i++;
      continue;
    }

    // Handle unordered lists
    if (line.match(/^\s*[-*+]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*[-*+]\s+/)) {
        const item = lines[i].replace(/^\s*[-*+]\s+/, "");
        listItems.push(convertMarkdownFormatting(item));
        i++;
      }
      sections.push({
        type: "list",
        ordered: false,
        items: listItems,
      });
      continue;
    }

    // Handle ordered lists
    if (line.match(/^\s*\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        const item = lines[i].replace(/^\s*\d+\.\s+/, "");
        listItems.push(convertMarkdownFormatting(item));
        i++;
      }
      sections.push({
        type: "list",
        ordered: true,
        items: listItems,
      });
      continue;
    }

    // Handle paragraphs
    if (line.trim()) {
      sections.push({
        type: "paragraph",
        content: convertMarkdownFormatting(line),
      });
    }

    i++;
  }

  return sections;
};

/**
 * Convert markdown formatting to HTML with security validation
 * Handles: [text](/url), **bold**, *italic*, __bold__, _italic_
 * Validates URLs to prevent XSS (javascript:, data:, etc.)
 */
const convertMarkdownFormatting = (text: string): string => {
  let result = text;

  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, linkText, href) => {
      if (!href.match(/^(https?:\/\/|\/)/)) {
        return linkText;
      }
      return `<a href="${href}" class="text-emerald-600 hover:text-emerald-700 underline">${linkText}</a>`;
    },
  );

  result = result.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  result = result.replace(/\*([^\*]+)\*/g, "<em>$1</em>");
  result = result.replace(/_([^_]+)_/g, "<em>$1</em>");

  return result;
};

