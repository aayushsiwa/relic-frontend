import { useCallback, useEffect, useState } from 'react';

import { getCollectionsAPI } from '@/lib/api/collections';
import type { Collection } from '@/lib/api/collections';
import { getRelicsAPI } from '@/lib/api/relics';
import { getTagsAPI } from '@/lib/api/tags';
import type { Tag } from '@/lib/api/tags';

type RecentRelic = {
  id: string;
  url: string | null;
  title: string | null;
  domain: string | null;
  createdAt: string;
};

type HomeData = {
  relicCount: number;
  collectionCount: number;
  tagCount: number;
  recentRelics: RecentRelic[];
  collections: Collection[];
  tags: Tag[];
};

export function useHomeData(
  search: string,
  collectionId: string,
  tagId: string
) {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getRelicsAPI({
        limit: 10,
        q: search || undefined,
        collectionId: collectionId || undefined,
        tagId: tagId || undefined,
      }),
      getCollectionsAPI({ limit: 1 }),
      getTagsAPI({ limit: 1 }),
      getCollectionsAPI({ limit: 100 }),
      getTagsAPI({ limit: 100 }),
    ])
      .then(
        ([
          relicsRes,
          collectionsRes,
          tagsRes,
          allCollectionsRes,
          allTagsRes,
        ]) => {
          if (ignore) return;
          setError(null);
          setData({
            relicCount: relicsRes.total,
            collectionCount: collectionsRes.total,
            tagCount: tagsRes.total,
            recentRelics: relicsRes.data,
            collections: allCollectionsRes.data,
            tags: allTagsRes.data,
          });
        }
      )
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
  }, [search, collectionId, tagId, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { data, isLoading, error, refetch };
}
