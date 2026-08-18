import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';

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
  const { name } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'Tag name is required' }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: schema.tags.id })
    .from(schema.tags)
    .where(
      and(eq(schema.tags.id, id), eq(schema.tags.userId, session.user.id))
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const [tag] = await db
      .update(schema.tags)
      .set({ name: name.trim() })
      .where(eq(schema.tags.id, id))
      .returning();
    return Response.json(tag);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return Response.json(
        { error: 'A tag with this name already exists.' },
        { status: 409 }
      );
    }
    throw err;
  }
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
    .select({ id: schema.tags.id })
    .from(schema.tags)
    .where(
      and(eq(schema.tags.id, id), eq(schema.tags.userId, session.user.id))
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(schema.tags).where(eq(schema.tags.id, id));

  return new Response(null, { status: 204 });
}
