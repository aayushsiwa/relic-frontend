import { api } from './index';
import type { PaginatedResponse } from './relics';

export type Collection = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  relicCount?: number;
};

export type CollectionQueryParams = {
  page?: number;
  limit?: number;
};

export async function getCollectionsAPI(params?: CollectionQueryParams) {
  const res = await api.get<PaginatedResponse<Collection>>('/api/collections', {
    params,
  });
  return res.data;
}

export async function getCollectionAPI(id: string) {
  const res = await api.get<Collection>(`/api/collections/${id}`);
  return res.data;
}

export async function createCollectionAPI(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  const res = await api.post<Collection>('/api/collections', data);
  return res.data;
}

export async function updateCollectionAPI(
  id: string,
  data: { name?: string; description?: string; color?: string }
) {
  const res = await api.put<Collection>(`/api/collections/${id}`, data);
  return res.data;
}

export async function deleteCollectionAPI(id: string) {
  await api.delete(`/api/collections/${id}`);
}
