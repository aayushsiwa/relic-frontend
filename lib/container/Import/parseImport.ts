import type { ImportItem } from '@/lib/api/import';

// Parse exported bookmarks from browsers (Netscape HTML format) and common
// read-it-later services (Pocket, Raindrop, CSV exports). Also accepts plain
// text with one URL per line.

export function parseImportInput(raw: string): ImportItem[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const looksLikeHtml =
    /<a\s/i.test(trimmed) || /<!doctype html/i.test(trimmed);
  if (looksLikeHtml) return parseBookmarksHtml(trimmed);

  if (trimmed.includes(',') || trimmed.includes('\t')) {
    return parseDelimited(trimmed);
  }

  return parsePlainUrls(trimmed);
}

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[\w.-]+\.[a-z]{2}/i.test(url)) return `https://${url}`;
  return '';
}

function parsePlainUrls(text: string): ImportItem[] {
  const items: ImportItem[] = [];
  for (const line of text.split(/\r?\n/)) {
    const url = normalizeUrl(line);
    if (url) items.push({ url });
  }
  return items;
}

function parseBookmarksHtml(html: string): ImportItem[] {
  if (typeof window === 'undefined' || !window.DOMParser) {
    return parseBookmarksHtmlFallback(html);
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const links = Array.from(doc.querySelectorAll('a[href]'));
  const items: ImportItem[] = [];

  for (const link of links) {
    const url = normalizeUrl(link.getAttribute('href') ?? '');
    if (!url) continue;
    const title = link.textContent?.trim() || undefined;
    const tagsAttr =
      link.getAttribute('tags') ?? link.getAttribute('TAGS') ?? '';
    const tags = tagsAttr
      ? tagsAttr
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
    items.push({ url, title, tags });
  }

  return items;
}

// Minimal regex fallback when DOMParser is unavailable (e.g. SSR).
function parseBookmarksHtmlFallback(html: string): ImportItem[] {
  const items: ImportItem[] = [];
  const anchorRegex =
    /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const tagRegex = /\btags\s*=\s*["']([^"']+)["']/i;

  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const url = normalizeUrl(match[1]);
    if (!url) continue;
    const title = match[2].replace(/<[^>]+>/g, '').trim() || undefined;
    const tagMatch = match[0].match(tagRegex);
    const tags = tagMatch
      ? tagMatch[1]
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
    items.push({ url, title, tags });
  }
  return items;
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function parseDelimited(text: string): ImportItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const firstFields = splitCsvLine(lines[0]);
  const isHeader =
    firstFields.length > 1 &&
    firstFields.some((f) => /url|link|title|tags|note|name/i.test(f));

  const rows = isHeader ? lines.slice(1) : lines;

  const colMap: Record<string, number> = {};
  if (isHeader) {
    firstFields.forEach((field, i) => {
      const key = field.toLowerCase();
      if (/url|link/i.test(key)) colMap.url = i;
      else if (/title|name/i.test(key)) colMap.title = i;
      else if (/tag/i.test(key)) colMap.tags = i;
      else if (/note|description/i.test(key)) colMap.note = i;
    });
  }

  if (colMap.url === undefined) colMap.url = 0;
  if (colMap.title === undefined && firstFields.length > 1) colMap.title = 1;

  const items: ImportItem[] = [];
  for (const line of rows) {
    const fields = splitCsvLine(line);
    const url = normalizeUrl(fields[colMap.url] ?? '');
    if (!url) continue;

    const title = colMap.title !== undefined ? fields[colMap.title] : undefined;
    const tagsRaw = colMap.tags !== undefined ? fields[colMap.tags] : undefined;
    const note = colMap.note !== undefined ? fields[colMap.note] : undefined;

    const tags = tagsRaw
      ? tagsRaw
          .split(/[;|]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    items.push({
      url,
      title: title || undefined,
      note: note || undefined,
      tags,
    });
  }
  return items;
}
