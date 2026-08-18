import { api } from './index';
import type { PaginatedResponse } from './relics';

export type Tag = {
  id: string;
  name: string;
  createdAt: string;
  relicCount?: number;
};

export async function createTagAPI(data: { name: string }) {
  const res = await api.post<Tag>('/api/tags', data);
  return res.data;
}

export type TagQueryParams = {
  page?: number;
  limit?: number;
};

export async function getTagsAPI(params?: TagQueryParams) {
  const res = await api.get<PaginatedResponse<Tag>>('/api/tags', { params });
  return res.data;
}

export async function updateTagAPI(id: string, data: { name: string }) {
  const res = await api.put<Tag>(`/api/tags/${id}`, data);
  return res.data;
}

export async function deleteTagAPI(id: string) {
  await api.delete(`/api/tags/${id}`);
}

export async function mergeTagsAPI(sourceId: string, targetId: string) {
  const res = await api.post<{ merged: number }>('/api/tags/merge', {
    sourceId,
    targetId,
  });
  return res.data;
}
