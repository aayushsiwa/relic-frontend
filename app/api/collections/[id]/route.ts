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

  const [collection] = await db
    .select()
    .from(schema.collections)
    .where(
      and(
        eq(schema.collections.id, id),
        eq(schema.collections.userId, session.user.id)
      )
    )
    .limit(1);

  if (!collection) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(collection);
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
  const { name, description, color } = body;

  const [existing] = await db
    .select({ id: schema.collections.id })
    .from(schema.collections)
    .where(
      and(
        eq(schema.collections.id, id),
        eq(schema.collections.userId, session.user.id)
      )
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const [collection] = await db
    .update(schema.collections)
    .set({ name, description, color })
    .where(eq(schema.collections.id, id))
    .returning();

  return Response.json(collection);
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
    .select({ id: schema.collections.id })
    .from(schema.collections)
    .where(
      and(
        eq(schema.collections.id, id),
        eq(schema.collections.userId, session.user.id)
      )
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(schema.collections).where(eq(schema.collections.id, id));

  return new Response(null, { status: 204 });
}
