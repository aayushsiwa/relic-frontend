'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Collection } from '@/lib/api/collections';
import type { Tag } from '@/lib/api/tags';

export function SearchFilters({
  search,
  onSearchChange,
  onSearch,
  onKeyDown,
  collectionId,
  onCollectionChange,
  tagId,
  onTagChange,
  collections,
  tags,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  collectionId: string;
  onCollectionChange: (value: string) => void;
  tagId: string;
  onTagChange: (value: string) => void;
  collections: Collection[];
  tags: Tag[];
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <div className="flex-1 min-w-50">
        <Input
          placeholder="Search relics, collections, tags..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      {onSearch && (
        <Button variant="outline" onClick={onSearch}>
          Search
        </Button>
      )}
      <select
        value={collectionId}
        onChange={(e) => onCollectionChange(e.target.value)}
        className="h-8 rounded-none border border-input bg-transparent px-2.5 text-xs focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
      >
        <option value="">All collections</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={tagId}
        onChange={(e) => onTagChange(e.target.value)}
        className="h-8 rounded-none border border-input bg-transparent px-2.5 text-xs focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
      >
        <option value="">All tags</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
