import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

export const START_URL = 'https://docs.developer.singpass.gov.sg/docs/';
export const BASE_URL = 'https://docs.developer.singpass.gov.sg';
export const DOCS_PREFIX = '/docs';

// Note: Ensure the process is run from within scripts/crawler or handle absolute paths
const OUTPUT_DIR = join(process.cwd(), '..', '..', 'docs', 'singpass');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

export function extractContent(html: string): string {
  const $doc = cheerio.load(html);
  let contentHtml = $doc('main').html();
  if (!contentHtml) {
      contentHtml = $doc('body').html();
  }
  return contentHtml || '';
}

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

export function getLocalPath(urlPathname: string): string {
  let localPath = urlPathname.replace(/^\/docs\/?/, '');
  if (!localPath) localPath = 'index';
  if (localPath.endsWith('/')) localPath += 'index';
  return localPath;
}

export async function crawl() {
  const visited = new Set<string>();
  const queue = [START_URL];

  await mkdir(OUTPUT_DIR, { recursive: true });

  while (queue.length > 0) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`Crawling: ${url}`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed to fetch ${url}: ${res.statusText}`);
        continue;
      }
      const html = await res.text();
      
      const contentHtml = extractContent(html);
      const markdown = htmlToMarkdown(contentHtml);

      // Determine file path
      const urlObj = new URL(url);
      const localPath = getLocalPath(urlObj.pathname);
      
      const filePath = join(OUTPUT_DIR, `${localPath}.md`);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, markdown);
      console.log(`Saved: ${filePath}`);

      // Find links
      const $doc = cheerio.load(html);
      $doc('a').each((_, el) => {
        const href = $doc(el).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url);
            // Only crawl within /docs/ and same origin
            if (absoluteUrl.origin === BASE_URL && absoluteUrl.pathname.startsWith(DOCS_PREFIX) && !absoluteUrl.hash) {
              // Ignore query parameters and hashes for deduplication
              const cleanUrl = absoluteUrl.origin + absoluteUrl.pathname;
              if (!visited.has(cleanUrl) && !queue.includes(cleanUrl)) {
                queue.push(cleanUrl);
              }
            }
          } catch (e) {
            // Invalid URL
          }
        }
      });
      
      // Sleep to avoid rate limiting
      await Bun.sleep(100);
    } catch (e) {
      console.error(`Error crawling ${url}:`, e);
    }
  }
}

if (import.meta.main) {
  crawl().then(() => console.log('Crawling complete.')).catch(console.error);
}
