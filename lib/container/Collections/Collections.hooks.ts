import { useCallback, useEffect, useState } from 'react';

import type { Collection } from '@/lib/api/collections';
import {
  createCollectionAPI,
  deleteCollectionAPI,
  getCollectionsAPI,
  updateCollectionAPI,
} from '@/lib/api/collections';

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getCollectionsAPI({ limit: 100 })
      .then((res) => {
        if (ignore) return;
        setError(null);
        setCollections(res.data);
      })
      .catch((err) => {
        if (ignore) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load collections'
        );
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const create = useCallback(
    async (data: { name: string; description?: string; color?: string }) => {
      await createCollectionAPI(data);
      refetch();
    },
    [refetch]
  );

  const update = useCallback(
    async (
      id: string,
      data: { name?: string; description?: string; color?: string }
    ) => {
      await updateCollectionAPI(id, data);
      refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteCollectionAPI(id);
      refetch();
    },
    [refetch]
  );

  return { collections, isLoading, error, create, update, remove };
}
