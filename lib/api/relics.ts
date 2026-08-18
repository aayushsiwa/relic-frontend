import { api } from './index';

export type Relic = {
  id: string;
  userId: string;
  url: string | null;
  title: string | null;
  description: string | null;
  note: string | null;
  domain: string | null;
  previewImage: string | null;
  favicon: string | null;
  isProcessing: boolean;
  contentType: 'url' | 'note' | 'file';
  createdAt: string;
  updatedAt: string;
};

export type RelicWithRelations = Relic & {
  collections: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type RelicQueryParams = {
  q?: string;
  collectionId?: string;
  tagId?: string;
  page?: number;
  limit?: number;
};

export type CreateRelicRequest = {
  url?: string;
  title?: string;
  description?: string;
  note?: string;
  domain?: string;
  previewImage?: string;
  favicon?: string;
  contentType?: 'url' | 'note' | 'file';
  collectionIds?: string[];
  tagIds?: string[];
};

export type UpdateRelicRequest = Partial<CreateRelicRequest>;

export async function getRelicsAPI(params?: RelicQueryParams) {
  const res = await api.get<PaginatedResponse<RelicWithRelations>>(
    '/api/relics',
    {
      params,
    }
  );
  return res.data;
}

export async function getRelicAPI(id: string) {
  const res = await api.get<RelicWithRelations>(`/api/relics/${id}`);
  return res.data;
}

export async function createRelicAPI(data: CreateRelicRequest) {
  const res = await api.post<Relic>('/api/relics', data);
  return res.data;
}

export async function updateRelicAPI(id: string, data: UpdateRelicRequest) {
  const res = await api.put<Relic>(`/api/relics/${id}`, data);
  return res.data;
}

export async function deleteRelicAPI(id: string) {
  await api.delete(`/api/relics/${id}`);
}

export async function bulkDeleteRelicsAPI(ids: string[]) {
  const res = await api.delete<{ deleted: number }>('/api/relics/bulk', {
    data: { ids },
  });
  return res.data;
}

export async function bulkTagRelicsAPI(ids: string[], tagIds: string[]) {
  const res = await api.post<{ updated: number }>('/api/relics/bulk/tags', {
    ids,
    tagIds,
  });
  return res.data;
}

export async function bulkAddToCollectionsAPI(
  ids: string[],
  collectionIds: string[]
) {
  const res = await api.post<{ updated: number }>(
    '/api/relics/bulk/collections',
    { ids, collectionIds }
  );
  return res.data;
}
