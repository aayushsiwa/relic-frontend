import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [relic] = await db
    .select()
    .from(schema.relics)
    .where(
      and(eq(schema.relics.id, id), eq(schema.relics.userId, session.user.id))
    )
    .limit(1);

  if (!relic) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const [collections, tags] = await Promise.all([
    db
      .select({ id: schema.collections.id, name: schema.collections.name })
      .from(schema.relicCollections)
      .innerJoin(
        schema.collections,
        eq(schema.relicCollections.collectionId, schema.collections.id)
      )
      .where(eq(schema.relicCollections.relicId, id)),
    db
      .select({ id: schema.tags.id, name: schema.tags.name })
      .from(schema.relicTags)
      .innerJoin(schema.tags, eq(schema.relicTags.tagId, schema.tags.id))
      .where(eq(schema.relicTags.relicId, id)),
  ]);

  return Response.json({ ...relic, collections, tags });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    url,
    title,
    description,
    note,
    domain,
    previewImage,
    favicon,
    contentType,
    collectionIds,
    tagIds,
  } = body;

  const [existing] = await db
    .select({ id: schema.relics.id })
    .from(schema.relics)
    .where(
      and(eq(schema.relics.id, id), eq(schema.relics.userId, session.user.id))
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  let relic;

  try {
    [relic] = await db
      .update(schema.relics)
      .set({
        url,
        title,
        description,
        note,
        domain,
        previewImage,
        favicon,
        contentType,
        updatedAt: new Date(),
      })
      .where(eq(schema.relics.id, id))
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

  if (collectionIds !== undefined) {
    await db
      .delete(schema.relicCollections)
      .where(eq(schema.relicCollections.relicId, id));
    if (collectionIds.length) {
      await db.insert(schema.relicCollections).values(
        collectionIds.map((collectionId: string) => ({
          relicId: id,
          collectionId,
        }))
      );
    }
  }

  if (tagIds !== undefined) {
    await db.delete(schema.relicTags).where(eq(schema.relicTags.relicId, id));
    if (tagIds.length) {
      await db
        .insert(schema.relicTags)
        .values(tagIds.map((tagId: string) => ({ relicId: id, tagId })));
    }
  }

  return Response.json(relic);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: schema.relics.id })
    .from(schema.relics)
    .where(
      and(eq(schema.relics.id, id), eq(schema.relics.userId, session.user.id))
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(schema.relics).where(eq(schema.relics.id, id));

  return new Response(null, { status: 204 });
}
