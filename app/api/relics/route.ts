import { and, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest, after } from 'next/server';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { enrichRelic } from '@/lib/enrich';
import { resolveTagIds } from '@/lib/metadata';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const collectionId = searchParams.get('collectionId');
  const tagId = searchParams.get('tagId');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
  );
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof and>[] = [
    eq(schema.relics.userId, session.user.id),
  ];

  if (q) {
    const collectionRelicIds = db
      .select({ relicId: schema.relicCollections.relicId })
      .from(schema.relicCollections)
      .innerJoin(
        schema.collections,
        eq(schema.relicCollections.collectionId, schema.collections.id)
      )
      .where(like(schema.collections.name, `%${q}%`));

    const tagRelicIds = db
      .select({ relicId: schema.relicTags.relicId })
      .from(schema.relicTags)
      .innerJoin(schema.tags, eq(schema.relicTags.tagId, schema.tags.id))
      .where(like(schema.tags.name, `%${q}%`));

    conditions.push(
      or(
        like(schema.relics.title, `%${q}%`),
        like(schema.relics.url, `%${q}%`),
        like(schema.relics.domain, `%${q}%`),
        like(schema.relics.description, `%${q}%`),
        like(schema.relics.note, `%${q}%`),
        inArray(schema.relics.id, collectionRelicIds),
        inArray(schema.relics.id, tagRelicIds)
      )
    );
  }

  if (collectionId) {
    const relicIds = db
      .select({ relicId: schema.relicCollections.relicId })
      .from(schema.relicCollections)
      .where(eq(schema.relicCollections.collectionId, collectionId));
    conditions.push(inArray(schema.relics.id, relicIds));
  }

  if (tagId) {
    const relicIds = db
      .select({ relicId: schema.relicTags.relicId })
      .from(schema.relicTags)
      .where(eq(schema.relicTags.tagId, tagId));
    conditions.push(inArray(schema.relics.id, relicIds));
  }

  const where = and(...conditions);

  const [total, items] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.relics)
      .where(where)
      .then((r) => Number(r[0].count)),
    db
      .select()
      .from(schema.relics)
      .where(where)
      .orderBy(desc(schema.relics.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const relicIds = items.map((r) => r.id);
  const [allRelicCollections, allRelicTags] = await Promise.all([
    relicIds.length
      ? db
          .select({
            relicId: schema.relicCollections.relicId,
            id: schema.collections.id,
            name: schema.collections.name,
          })
          .from(schema.relicCollections)
          .innerJoin(
            schema.collections,
            eq(schema.relicCollections.collectionId, schema.collections.id)
          )
          .where(inArray(schema.relicCollections.relicId, relicIds))
      : Promise.resolve([]),
    relicIds.length
      ? db
          .select({
            relicId: schema.relicTags.relicId,
            id: schema.tags.id,
            name: schema.tags.name,
          })
          .from(schema.relicTags)
          .innerJoin(schema.tags, eq(schema.relicTags.tagId, schema.tags.id))
          .where(inArray(schema.relicTags.relicId, relicIds))
      : Promise.resolve([]),
  ]);

  const collectionsByRelicId: Record<string, { id: string; name: string }[]> =
    {};
  for (const rc of allRelicCollections) {
    (collectionsByRelicId[rc.relicId] ??= []).push({
      id: rc.id,
      name: rc.name,
    });
  }
  const tagsByRelicId: Record<string, { id: string; name: string }[]> = {};
  for (const rt of allRelicTags) {
    (tagsByRelicId[rt.relicId] ??= []).push({ id: rt.id, name: rt.name });
  }

  const data = items.map((item) => ({
    ...item,
    collections: collectionsByRelicId[item.id] ?? [],
    tags: tagsByRelicId[item.id] ?? [],
  }));

  return Response.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    url,
    title,
    description,
    note,
    domain,
    previewImage,
    favicon,
    collectionIds,
    tagIds,
    contentType,
  } = body;

  const shouldEnrich = Boolean(url && (contentType ?? 'url') === 'url');

  let relic;

  try {
    [relic] = await db
      .insert(schema.relics)
      .values({
        userId: session.user.id,
        url,
        title,
        description,
        note,
        domain,
        previewImage,
        favicon,
        contentType: contentType ?? 'url',
        isProcessing: shouldEnrich,
      })
      .returning();
  } catch (err: unknown) {
    const pgErr = err as { code?: string; constraint?: string };
    if (pgErr.code === '23505') {
      const field = pgErr.constraint?.includes('url') ? 'URL' : 'Title';
      return Response.json(
        { error: `A relic with this ${field} already exists.` },
        { status: 409 }
      );
    }
    throw err;
  }

  if (collectionIds?.length) {
    await db.insert(schema.relicCollections).values(
      collectionIds.map((collectionId: string) => ({
        relicId: relic.id,
        collectionId,
      }))
    );
  }

  if (tagIds?.length) {
    await db.insert(schema.relicTags).values(
      tagIds.map((tagId: string) => ({
        relicId: relic.id,
        tagId,
      }))
    );
  }

  if (shouldEnrich) {
    // Scrape asynchronously so relic creation stays fast; only fill fields the
    // user hasn't already set.
    after(() => enrichRelic(relic.id, url, session.user.id));
  }

  return Response.json(relic, { status: 201 });
}
