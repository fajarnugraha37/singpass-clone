import { describe, expect, test, spyOn } from "bun:test";
import { getLocalPath, extractContent, htmlToMarkdown, crawl } from "./crawl";
import * as fs from "fs/promises";

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

describe("Crawler Main", () => {
  test("should crawl and save pages", async () => {
    // Mock fetch
    const fetchMock = spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr === 'https://docs.developer.singpass.gov.sg/docs/') {
        return new Response('<html><body><main><a href="/docs/page1">Link 1</a></main></body></html>');
      }
      if (urlStr === 'https://docs.developer.singpass.gov.sg/docs/page1') {
        return new Response('<html><body><main><h1>Page 1</h1></main></body></html>');
      }
      return new Response('', { status: 404 });
    });

    // Mock fs/promises
    const mkdirMock = spyOn(fs, 'mkdir').mockImplementation(async () => undefined);
    const writeFileMock = spyOn(fs, 'writeFile').mockImplementation(async () => undefined);

    // Run crawl (it will handle queue and sleep)
    await crawl();

    // Verify calls
    expect(fetchMock).toHaveBeenCalled();
    expect(mkdirMock).toHaveBeenCalled();
    expect(writeFileMock).toHaveBeenCalled();

    // Check that it tried to save 'index.md' and 'page1.md'
    const writtenFiles = writeFileMock.mock.calls.map(call => call[0] as string);
    expect(writtenFiles.some(f => f.endsWith('index.md'))).toBe(true);
    expect(writtenFiles.some(f => f.endsWith('page1.md'))).toBe(true);

    fetchMock.mockRestore();
    mkdirMock.mockRestore();
    writeFileMock.mockRestore();
  });
});
