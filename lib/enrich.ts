import { eq } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { extractMetadata, resolveTagIds } from '@/lib/metadata';

// Enrich a URL relic with scraped metadata and auto-derived tags. Best-effort:
// failures only clear the processing flag so the relic is never stuck.
export async function enrichRelic(
  relicId: string,
  url: string,
  userId: string
) {
  const [current] = await db
    .select()
    .from(schema.relics)
    .where(eq(schema.relics.id, relicId))
    .limit(1);
  if (!current) return;

  try {
    const metadata = await extractMetadata(url);
    await db
      .update(schema.relics)
      .set({
        title: current.title ?? metadata.title,
        description: current.description ?? metadata.description,
        previewImage: current.previewImage ?? metadata.previewImage,
        favicon: current.favicon ?? metadata.favicon,
        domain: current.domain ?? metadata.domain,
        isProcessing: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.relics.id, relicId));

    if (metadata.tags.length) {
      const autoTagIds = await resolveTagIds(userId, metadata.tags);
      await db
        .insert(schema.relicTags)
        .values(
          autoTagIds.map((tagId: string) => ({ relicId, tagId }))
        )
        .onConflictDoNothing();
    }
  } catch {
    await db
      .update(schema.relics)
      .set({ isProcessing: false })
      .where(eq(schema.relics.id, relicId))
      .catch(() => {});
  }
}
