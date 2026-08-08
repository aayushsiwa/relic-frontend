import { extractFromHtml } from '@extractus/article-extractor';
import * as cheerio from 'cheerio';
import { inArray } from 'drizzle-orm';
import metascraper from 'metascraper';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLang from 'metascraper-lang';
import metascraperLogo from 'metascraper-logo';
import metascraperLogoFavicon from 'metascraper-logo-favicon';
import metascraperPublisher from 'metascraper-publisher';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';

import { db, schema } from '@/lib/db';

const getMetadata = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperLogoFavicon(),
  metascraperPublisher(),
  metascraperLang(),
  metascraperUrl(),
]);

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0 RelicBot/1.0';

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 40;

// Block obvious private/internal targets to avoid SSRF when scraping user URLs.
function assertSafeUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Invalid URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Unsupported URL protocol.');
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '::1' ||
    host.startsWith('127.') ||
    /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host)
  ) {
    throw new Error('Blocked local address.');
  }

  return parsed.toString();
}

async function fetchPageHtml(
  url: string
): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`Page responded with status ${res.status}.`);
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new Error('Page is too large to parse.');
    }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    return { html, finalUrl: res.url };
  } finally {
    clearTimeout(timeout);
  }
}

function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

// Fall back to the first real <img> on the page (skips logos/icons/trackers).
const JUNK_IMAGE =
  /logo|icon|avatar|badge|pixel|spacer|blank|placeholder|loading|transparent|sprite|favicon|1x1|\.svg$|^data:/i;

function extractContentImage(
  html: string,
  baseUrl: string
): string | undefined {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const raw of imgs) {
    const srcMatch = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch || JUNK_IMAGE.test(srcMatch[1])) continue;

    // Skip images that are explicitly tiny.
    const widthMatch = raw.match(/\bwidth\s*=\s*["']?(\d+)/i);
    const heightMatch = raw.match(/\bheight\s*=\s*["']?(\d+)/i);
    const width = widthMatch ? Number(widthMatch[1]) : undefined;
    const height = heightMatch ? Number(heightMatch[1]) : undefined;
    if (
      width !== undefined &&
      height !== undefined &&
      (width < 200 || height < 200)
    ) {
      continue;
    }

    const resolved = resolveUrl(srcMatch[1], baseUrl);
    if (resolved) return resolved;
  }
  return undefined;
}

// Strip markup so we can derive keywords from the visible text.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pull the visible text of the main content region (article/main or common
// content containers) so navigation chrome doesn't pollute derived keywords.
const MAIN_CONTENT_SELECTORS = [
  '#mw-content-text',
  '.entry-content',
  '.post-content',
  'article',
  '[role="main"]',
  'main',
  '#content',
];

function extractMainText(html: string): string | null {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, template').remove();
  for (const selector of MAIN_CONTENT_SELECTORS) {
    const text = $(selector).first().text().replace(/\s+/g, ' ').trim();
    if (text.length > 200) return text;
  }
  return null;
}

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself just let's like me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves
  about comments com dont else get got into log login minutes now page pages points read reply share sign signup submit times today vote votes weblog web what who what why when where which while
  hours ago hide points show
  called let using used also one many way make time even still want know look get`.split(
    /\s+/
  )
);

// Score keywords from title, description, and body text by weighted frequency.
// Title/description words are treated as highly relevant; body words must
// repeat to count, so one-off navigation terms don't become tags.
function deriveKeywords(title?: string, description?: string, body = '') {
  const freq = new Map<string, number>();
  const bump = (
    text: string,
    weight: number,
    maxPerWord: number,
    minCount = 1
  ) => {
    const counts = new Map<string, number>();
    const words = text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [];
    for (const word of words) {
      if (STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    for (const [word, count] of counts) {
      if (count < minCount) continue;
      freq.set(
        word,
        (freq.get(word) ?? 0) + Math.min(count, maxPerWord) * weight
      );
    }
  };
  bump(title ?? '', 5, 2);
  bump(description ?? '', 3, 2);
  bump(body, 1, 3, 2);

  return [...freq.entries()]
    .filter(([, score]) => score >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

// Combine explicit meta tags (keywords, og:tag, article:tag) with keywords
// derived from the article body so every relic ends up with some tags.
function extractTags(
  html: string,
  title?: string,
  description?: string,
  body = ''
): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  const push = (tag: string) => {
    const cleaned = tag.trim().replace(/\s+/g, ' ');
    if (
      cleaned &&
      cleaned.length <= MAX_TAG_LENGTH &&
      !seen.has(cleaned.toLowerCase())
    ) {
      seen.add(cleaned.toLowerCase());
      tags.push(cleaned);
    }
  };

  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const raw of metaTags) {
    const keyMatch = raw.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i);
    const contentMatch = raw.match(/content\s*=\s*["']([^"']*)["']/i);
    if (!keyMatch || !contentMatch) continue;

    const key = keyMatch[1].toLowerCase();
    if (key !== 'keywords' && key !== 'og:tag' && key !== 'article:tag') {
      continue;
    }
    for (const part of contentMatch[1].split(',')) push(part);
  }

  // Trim to the intro so repetitive article prose doesn't drown out topics.
  const intro = body.slice(0, 1500);

  const derived = deriveKeywords(title, description, intro).filter(
    (word) => word.length >= 3
  );
  for (const word of derived) {
    if (tags.length >= MAX_TAGS) break;
    push(word);
  }

  return tags.slice(0, MAX_TAGS);
}

export type ExtractedMetadata = {
  title?: string;
  description?: string;
  previewImage?: string;
  favicon?: string;
  domain?: string;
  tags: string[];
};

// Use Mozilla Readability (via article-extractor) to pull the clean article
// body for keyword derivation. Prefer prose over tables (Wikipedia infoboxes
// leak spec-sheet words), but keep unstripped text for table-only pages like
// Hacker News. Falls back to selector heuristics, then raw page text.
async function extractArticle(
  html: string,
  url: string
): Promise<{
  text: string;
  article: Awaited<ReturnType<typeof extractFromHtml>>;
}> {
  let article: Awaited<ReturnType<typeof extractFromHtml>> = null;
  try {
    article = await extractFromHtml(html, url, { contentLengthThreshold: 200 });
  } catch {
    article = null;
  }

  if (article?.content) {
    const $ = cheerio.load(article.content);
    $('table').remove();
    const prose = htmlToText($.html());
    if (prose.length >= 200) return { text: prose, article };
  }

  const selectorText = extractMainText(html);
  if (selectorText) return { text: selectorText, article };

  if (article?.content) {
    const text = htmlToText(article.content);
    if (text.length >= 200) return { text, article };
  }

  return { text: htmlToText(html), article };
}

// Fetch a page and enrich it with title, description, preview image, favicon,
// domain, and basic tags. Fails gracefully per-field on missing data.
export async function extractMetadata(url: string): Promise<ExtractedMetadata> {
  const safeUrl = assertSafeUrl(url);
  const { html, finalUrl } = await fetchPageHtml(safeUrl);

  // Resolve relative URLs against the post-redirect page URL.
  const meta = await getMetadata({ url: finalUrl, html });
  const domain = new URL(safeUrl).hostname;

  const { text: body, article } = await extractArticle(html, finalUrl);

  // metascraper's last-resort fallback can return tiny logos (e.g. y18.svg);
  // discard junk and use our own content-image scan instead.
  const metaImage = meta.image ?? '';
  const previewImage =
    metaImage && !JUNK_IMAGE.test(metaImage)
      ? metaImage
      : extractContentImage(html, finalUrl);
  const favicon = meta.logo ?? `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  return {
    title: meta.title || article?.title || undefined,
    description: meta.description || article?.description || undefined,
    previewImage,
    favicon,
    domain,
    tags: extractTags(html, meta.title, meta.description, body),
  };
}

// Find-or-create tags for a user, returning their ids (does not link).
export async function resolveTagIds(
  userId: string,
  names: string[]
): Promise<string[]> {
  const uniqueNames = [
    ...new Set(names.map((name) => name.trim()).filter(Boolean)),
  ];
  if (!uniqueNames.length) return [];

  const existing = await db
    .select({ id: schema.tags.id, name: schema.tags.name })
    .from(schema.tags)
    .where(inArray(schema.tags.name, uniqueNames));

  const existingByName = new Map(existing.map((tag) => [tag.name, tag.id]));

  const tagIds = existing.map((tag) => tag.id);
  for (const name of uniqueNames) {
    if (existingByName.has(name)) continue;
    const [tag] = await db
      .insert(schema.tags)
      .values({ userId, name })
      .returning();
    tagIds.push(tag.id);
  }

  return tagIds;
}
