import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { sourceId, targetId } = body;

  if (!sourceId || !targetId || sourceId === targetId) {
    return Response.json(
      { error: 'A valid source and different target are required.' },
      { status: 400 }
    );
  }

  const [source, target] = await Promise.all([
    db
      .select({ id: schema.tags.id })
      .from(schema.tags)
      .where(
        and(
          eq(schema.tags.id, sourceId),
          eq(schema.tags.userId, session.user.id)
        )
      )
      .limit(1),
    db
      .select({ id: schema.tags.id })
      .from(schema.tags)
      .where(
        and(
          eq(schema.tags.id, targetId),
          eq(schema.tags.userId, session.user.id)
        )
      )
      .limit(1),
  ]);

  if (!source.length || !target.length) {
    return Response.json(
      { error: 'Source or target tag not found.' },
      { status: 404 }
    );
  }

  // Reassign relic links from source to target, skipping any that already have
  // the target tag, then remove the now-empty source tag.
  const sourceLinks = await db
    .select({ relicId: schema.relicTags.relicId })
    .from(schema.relicTags)
    .where(eq(schema.relicTags.tagId, sourceId));

  const targetLinks = await db
    .select({ relicId: schema.relicTags.relicId })
    .from(schema.relicTags)
    .where(eq(schema.relicTags.tagId, targetId));

  const alreadyLinked = new Set(targetLinks.map((l) => l.relicId));
  const toMove = sourceLinks.filter((l) => !alreadyLinked.has(l.relicId));

  if (toMove.length) {
    await db.insert(schema.relicTags).values(
      toMove.map((l) => ({
        relicId: l.relicId,
        tagId: targetId,
      }))
    );
  }

  await db.delete(schema.relicTags).where(eq(schema.relicTags.tagId, sourceId));
  await db.delete(schema.tags).where(eq(schema.tags.id, sourceId));

  return Response.json({ merged: toMove.length });
}
