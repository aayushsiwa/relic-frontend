import { useCallback, useEffect, useState } from 'react';

import { getCollectionsAPI } from '@/lib/api/collections';
import type { Collection } from '@/lib/api/collections';
import { getRelicsAPI } from '@/lib/api/relics';
import type { RelicWithRelations } from '@/lib/api/relics';
import { getTagsAPI } from '@/lib/api/tags';
import type { Tag } from '@/lib/api/tags';

type LibraryData = {
  relics: RelicWithRelations[];
  total: number;
  page: number;
  totalPages: number;
  collections: Collection[];
  tags: Tag[];
};

export function useLibrary(
  search: string,
  collectionId: string,
  tagId: string,
  page: number
) {
  const [data, setData] = useState<LibraryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getRelicsAPI({
        limit: 20,
        page,
        q: search || undefined,
        collectionId: collectionId || undefined,
        tagId: tagId || undefined,
      }),
      getCollectionsAPI({ limit: 100 }),
      getTagsAPI({ limit: 100 }),
    ])
      .then(([relicsRes, allCollectionsRes, allTagsRes]) => {
        if (ignore) return;
        setError(null);
        setData({
          relics: relicsRes.data,
          total: relicsRes.total,
          page: relicsRes.page,
          totalPages: relicsRes.totalPages,
          collections: allCollectionsRes.data,
          tags: allTagsRes.data,
        });
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [search, collectionId, tagId, page, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Poll while any relic is still being enriched so cards update in place.
  const hasProcessing = (data?.relics ?? []).some((r) => r.isProcessing);

  useEffect(() => {
    if (!hasProcessing) return;
    const id = setInterval(refetch, 3000);
    return () => clearInterval(id);
  }, [hasProcessing, refetch]);

  return { data, isLoading, error, refetch };
}
