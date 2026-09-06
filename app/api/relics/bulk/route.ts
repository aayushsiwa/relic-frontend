import { and, eq, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  if (!ids.length) {
    return Response.json({ error: 'No relic ids provided.' }, { status: 400 });
  }

  const deleted = await db
    .delete(schema.relics)
    .where(
      and(
        eq(schema.relics.userId, session.user.id),
        inArray(schema.relics.id, ids)
      )
    )
    .returning({ id: schema.relics.id });

  return Response.json({ deleted: deleted.length });
}
