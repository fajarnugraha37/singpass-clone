import { describe, expect, test } from "bun:test";
import { getLocalPath, extractContent, htmlToMarkdown } from "./crawl";

describe("Crawler Utilities", () => {
  describe("getLocalPath", () => {
    test("should handle root /docs/ path", () => {
      expect(getLocalPath("/docs/")).toBe("index");
    });

    test("should handle /docs path without trailing slash", () => {
      expect(getLocalPath("/docs")).toBe("index");
    });

    test("should handle nested paths", () => {
      expect(getLocalPath("/docs/technical-specifications")).toBe("technical-specifications");
    });

    test("should append index to paths ending with a slash", () => {
      expect(getLocalPath("/docs/technical-specifications/")).toBe("technical-specifications/index");
    });

    test("should handle deep nested paths", () => {
      expect(getLocalPath("/docs/getting-started/quick-start")).toBe("getting-started/quick-start");
    });
  });

  describe("extractContent", () => {
    test("should extract content from <main> tag if present", () => {
      const html = `
        <html>
          <head><title>Test</title></head>
          <body>
            <header>Header</header>
            <main><h1>Main Content</h1><p>Some text</p></main>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      const content = extractContent(html);
      expect(content).toContain("<h1>Main Content</h1>");
      expect(content).not.toContain("<header>Header</header>");
    });

    test("should fallback to <body> tag if <main> is missing", () => {
      const html = `
        <html>
          <head><title>Test</title></head>
          <body>
            <h1>Body Content</h1><p>Some text</p>
          </body>
        </html>
      `;
      const content = extractContent(html);
      expect(content).toContain("<h1>Body Content</h1>");
    });
  });

  describe("htmlToMarkdown", () => {
    test("should convert HTML to Markdown", () => {
      const html = "<h1>Heading 1</h1><p>Paragraph text</p>";
      const markdown = htmlToMarkdown(html);
      expect(markdown).toBe("# Heading 1\n\nParagraph text");
    });
  });
});
