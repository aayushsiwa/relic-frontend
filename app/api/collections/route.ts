import { desc, eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
  );
  const offset = (page - 1) * limit;

  const where = eq(schema.collections.userId, session.user.id);

  const [total, data] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.collections)
      .where(where)
      .then((r) => Number(r[0].count)),
    db
      .select({
        id: schema.collections.id,
        userId: schema.collections.userId,
        name: schema.collections.name,
        description: schema.collections.description,
        color: schema.collections.color,
        createdAt: schema.collections.createdAt,
        relicCount: sql<number>`count(${schema.relicCollections.relicId})`,
      })
      .from(schema.collections)
      .leftJoin(
        schema.relicCollections,
        eq(schema.collections.id, schema.relicCollections.collectionId)
      )
      .where(where)
      .groupBy(schema.collections.id)
      .orderBy(desc(schema.collections.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

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
  const { name, description, color } = body;

  if (!name) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  const [collection] = await db
    .insert(schema.collections)
    .values({
      userId: session.user.id,
      name,
      description,
      color,
    })
    .returning();

  return Response.json({ ...collection, relicCount: 0 }, { status: 201 });
}
