import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest, after } from 'next/server';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { enrichRelic } from '@/lib/enrich';
import { resolveTagIds } from '@/lib/metadata';

type ImportItem = {
  url: string;
  title?: string;
  note?: string;
  tags?: string[];
};

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return (
      parsed.protocol === 'http:' || parsed.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const items: ImportItem[] = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return Response.json({ error: 'No items to import.' }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    const url = typeof item?.url === 'string' ? item.url.trim() : '';
    if (!isValidHttpUrl(url)) {
      skipped++;
      errors.push(`Skipped invalid URL: ${url || '(empty)'}`);
      continue;
    }

    try {
      const [relic] = await db
        .insert(schema.relics)
        .values({
          userId: session.user.id,
          url,
          title: item.title?.trim() || null,
          note: item.note?.trim() || null,
          domain: new URL(url).hostname,
          contentType: 'url',
          isProcessing: true,
        })
        .returning();

      const tagNames = Array.isArray(item.tags)
        ? item.tags.map((t) => String(t).trim()).filter(Boolean)
        : [];
      if (tagNames.length) {
        const tagIds = await resolveTagIds(session.user.id, tagNames);
        await db.insert(schema.relicTags).values(
          tagIds.map((tagId: string) => ({
            relicId: relic.id,
            tagId,
          }))
        );
      }

      after(() => enrichRelic(relic.id, url, session.user.id));
      imported++;
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        skipped++;
        errors.push(`Skipped duplicate URL: ${url}`);
        continue;
      }
      skipped++;
      errors.push(`Failed to import: ${url}`);
    }
  }

  return Response.json({ imported, skipped, errors });
}
