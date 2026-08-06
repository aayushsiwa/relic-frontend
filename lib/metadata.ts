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

async function fetchPageHtml(url: string): Promise<string> {
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

    return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  } finally {
    clearTimeout(timeout);
  }
}

// Pull basic tags from <meta name="keywords">, og:tag, and article:tag.
function extractTags(html: string): string[] {
  const found = new Set<string>();
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const raw of metaTags) {
    const keyMatch = raw.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i);
    const contentMatch = raw.match(/content\s*=\s*["']([^"']*)["']/i);
    if (!keyMatch || !contentMatch) continue;

    const key = keyMatch[1].toLowerCase();
    if (key !== 'keywords' && key !== 'og:tag' && key !== 'article:tag') {
      continue;
    }

    for (const part of contentMatch[1].split(',')) {
      const tag = part.trim().replace(/\s+/g, ' ');
      if (tag) found.add(tag);
    }
  }

  return [...found]
    .filter((tag) => tag.length <= MAX_TAG_LENGTH)
    .slice(0, MAX_TAGS);
}

export type ExtractedMetadata = {
  title?: string;
  description?: string;
  previewImage?: string;
  favicon?: string;
  domain?: string;
  tags: string[];
};

// Fetch a page and enrich it with title, description, preview image, favicon,
// domain, and basic tags. Fails gracefully per-field on missing data.
export async function extractMetadata(url: string): Promise<ExtractedMetadata> {
  const safeUrl = assertSafeUrl(url);
  const html = await fetchPageHtml(safeUrl);

  const meta = await getMetadata({ url: safeUrl, html });

  return {
    title: meta.title || undefined,
    description: meta.description || undefined,
    previewImage: meta.image || undefined,
    favicon: meta.logo || undefined,
    domain: new URL(safeUrl).hostname,
    tags: extractTags(html),
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
