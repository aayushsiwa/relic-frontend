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
