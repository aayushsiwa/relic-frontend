import { api } from './index';

export type ImportItem = {
  url: string;
  title?: string;
  note?: string;
  tags?: string[];
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export async function importRelicsAPI(items: ImportItem[]) {
  const res = await api.post<ImportResult>('/api/import', { items });
  return res.data;
}
