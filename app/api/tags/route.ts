import { asc, eq, sql } from 'drizzle-orm';
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
    Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10))
  );
  const offset = (page - 1) * limit;

  const where = eq(schema.tags.userId, session.user.id);

  const [total, data] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.tags)
      .where(where)
      .then((r) => Number(r[0].count)),
    db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        createdAt: schema.tags.createdAt,
        relicCount: sql<number>`count(${schema.relicTags.relicId})::int`,
      })
      .from(schema.tags)
      .leftJoin(schema.relicTags, eq(schema.tags.id, schema.relicTags.tagId))
      .where(where)
      .groupBy(schema.tags.id)
      .orderBy(asc(schema.tags.name))
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
  const { name } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'Tag name is required' }, { status: 400 });
  }

  try {
    const [tag] = await db
      .insert(schema.tags)
      .values({ userId: session.user.id, name: name.trim() })
      .returning();

    return Response.json(tag, { status: 201 });
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
