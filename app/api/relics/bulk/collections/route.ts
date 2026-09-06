import { and, eq, inArray } from 'drizzle-orm';
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
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  const collectionIds: string[] = Array.isArray(body?.collectionIds)
    ? body.collectionIds
    : [];

  if (!ids.length || !collectionIds.length) {
    return Response.json(
      { error: 'Relic ids and collection ids are required.' },
      { status: 400 }
    );
  }

  // Only operate on relics the user owns.
  const owned = await db
    .select({ id: schema.relics.id })
    .from(schema.relics)
    .where(
      and(
        eq(schema.relics.userId, session.user.id),
        inArray(schema.relics.id, ids)
      )
    );

  if (!owned.length) {
    return Response.json({ error: 'No matching relics.' }, { status: 404 });
  }

  const ownedIds = owned.map((r) => r.id);
  const values = ownedIds.flatMap((relicId) =>
    collectionIds.map((collectionId) => ({ relicId, collectionId }))
  );

  await db.insert(schema.relicCollections).values(values).onConflictDoNothing();

  return Response.json({ updated: ownedIds.length });
}
