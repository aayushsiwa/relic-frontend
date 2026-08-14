import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const relics = pgTable(
  'relics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    url: text('url'),
    title: text('title'),
    description: text('description'),
    note: text('note'),
    domain: text('domain'),
    previewImage: text('preview_image'),
    favicon: text('favicon'),
    isProcessing: boolean('is_processing').notNull().default(false),
    contentType: text('content_type', { enum: ['url', 'note', 'file'] })
      .notNull()
      .default('url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqueUrlPerUser: unique().on(t.userId, t.url),
    uniqueTitlePerUser: unique().on(t.userId, t.title),
  })
);

export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const relicCollections = pgTable(
  'relic_collections',
  {
    relicId: uuid('relic_id')
      .notNull()
      .references(() => relics.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.relicId, t.collectionId] }),
  })
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqueNamePerUser: unique().on(t.userId, t.name),
  })
);

export const relicTags = pgTable(
  'relic_tags',
  {
    relicId: uuid('relic_id')
      .notNull()
      .references(() => relics.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.relicId, t.tagId] }),
  })
);
