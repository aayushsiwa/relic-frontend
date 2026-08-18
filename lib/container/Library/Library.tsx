'use client';

import { CheckSquare, Square, Trash, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  bulkAddToCollectionsAPI,
  bulkDeleteRelicsAPI,
  bulkTagRelicsAPI,
} from '@/lib/api/relics';
import { AddRelicDialog } from '@/lib/components/AddRelicDialog';
import { Navbar } from '@/lib/components/Navbar';
import { RelicCard } from '@/lib/components/RelicCard';
import { SearchFilters } from '@/lib/components/SearchFilters';
import { ViewRelicDialog } from '@/lib/components/ViewRelicDialog';

import { EditRelicDialog } from './EditRelicDialog';
import { useLibrary } from './Library.hooks';

export function Library({
  user,
}: {
  user: { name: string; email: string; image: string | null };
}) {
  const [search, setSearch] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tagId, setTagId] = useState('');
  const [page, setPage] = useState(1);
  const [appliedSearch, setAppliedSearch] = useState('');

  const [viewingRelicId, setViewingRelicId] = useState<string | null>(null);
  const [editingRelicId, setEditingRelicId] = useState<string | null>(null);
  const [addRelicOpen, setAddRelicOpen] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
    setBulkError(null);
  }

  function toggleRelic(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkAddToCollection(collectionId: string) {
    if (!collectionId || !selectedIds.size) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      await bulkAddToCollectionsAPI(Array.from(selectedIds), [collectionId]);
      refetch();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkTag(tagId: string) {
    if (!tagId || !selectedIds.size) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      await bulkTagRelicsAPI(Array.from(selectedIds), [tagId]);
      refetch();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      await bulkDeleteRelicsAPI(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectMode(false);
      refetch();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setBulkBusy(false);
    }
  }

  const { data, isLoading, error, refetch } = useLibrary(
    appliedSearch,
    collectionId,
    tagId,
    page
  );

  const hasFilters = appliedSearch || collectionId || tagId;

  function handleSearch() {
    setPage(1);
    setAppliedSearch(search);
  }

  // Debounce typing: auto-apply the search after a pause instead of waiting
  // for Enter/button, while still resetting to page 1.
  useEffect(() => {
    if (search === appliedSearch) return;
    const id = setTimeout(() => {
      setPage(1);
      setAppliedSearch(search);
    }, 350);
    return () => clearTimeout(id);
  }, [search, appliedSearch]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleCollectionChange(value: string) {
    setPage(1);
    setCollectionId(value);
  }

  function handleTagChange(value: string) {
    setPage(1);
    setTagId(value);
  }

  const totalPages = data?.totalPages ?? 1;

  function pageRange(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;
    const start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar user={user} />

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Library</h1>
            <div className="flex items-center gap-2">
              <Button
                variant={selectMode ? 'secondary' : 'outline'}
                onClick={toggleSelectMode}
              >
                {selectMode ? <CheckSquare /> : <Square />}
                {selectMode ? 'Cancel' : 'Select'}
              </Button>
              <Button onClick={() => setAddRelicOpen(true)}>Save</Button>
            </div>
          </div>

          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            onSearch={handleSearch}
            onKeyDown={handleKeyDown}
            collectionId={collectionId}
            onCollectionChange={handleCollectionChange}
            tagId={tagId}
            onTagChange={handleTagChange}
            collections={data?.collections ?? []}
            tags={data?.tags ?? []}
          />

          {error && (
            <div className="mb-4 rounded border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {selectMode && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
              <span className="font-medium">{selectedIds.size} selected</span>
              <select
                defaultValue=""
                disabled={bulkBusy || !selectedIds.size}
                onChange={(e) => {
                  handleBulkAddToCollection(e.target.value);
                  e.target.value = '';
                }}
                className="h-8 rounded-none border border-input bg-transparent px-2.5 text-xs focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="">Add to collection…</option>
                {(data?.collections ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                defaultValue=""
                disabled={bulkBusy || !selectedIds.size}
                onChange={(e) => {
                  handleBulkTag(e.target.value);
                  e.target.value = '';
                }}
                className="h-8 rounded-none border border-input bg-transparent px-2.5 text-xs focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="">Add tag…</option>
                {(data?.tags ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="destructive"
                disabled={bulkBusy || !selectedIds.size}
                onClick={handleBulkDelete}
              >
                <Trash />
                Delete
              </Button>
              {bulkBusy && (
                <span className="text-xs text-muted-foreground">Working…</span>
              )}
              <button
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedIds(new Set())}
                aria-label="Clear selection"
              >
                <X />
              </button>
            </div>
          )}

          {bulkError && (
            <div className="mb-4 rounded border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {bulkError}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="py-4">
                    <div className="mb-1.5 h-4 w-3/5 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-2/5 rounded bg-muted animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data && data.relics.length > 0 ? (
            <>
              <div className="mb-2 text-xs text-muted-foreground">
                {data.total} {data.total === 1 ? 'result' : 'results'}
              </div>
              <Masonry
                breakpointCols={{ default: 3, 1280: 3, 768: 2, 640: 1 }}
                className="masonry-grid"
                columnClassName="masonry-grid_column"
              >
                {data.relics.map((relic) => (
                  <RelicCard
                    key={relic.id}
                    relic={relic}
                    selectable={selectMode}
                    selected={selectedIds.has(relic.id)}
                    onToggleSelect={() => toggleRelic(relic.id)}
                    onView={() => setViewingRelicId(relic.id)}
                    onEdit={() => setEditingRelicId(relic.id)}
                  />
                ))}
              </Masonry>

              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        />
                      </PaginationItem>
                    )}
                    {pageRange().map((p, i) =>
                      p === '...' ? (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => setPage(p as number)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-4xl opacity-20">
                {hasFilters ? '\u{1F50D}' : '\u{1F4C3}'}
              </div>
              <h3 className="text-lg font-medium">
                {hasFilters ? 'No results found' : 'No saved items yet'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? 'Try a different search term or clear the filters.'
                  : 'Save your first link, note, or file to start building your archive.'}
              </p>
            </div>
          )}
        </div>
      </main>

      <ViewRelicDialog
        relicId={viewingRelicId}
        open={viewingRelicId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingRelicId(null);
        }}
        onEdit={() => {
          if (viewingRelicId) setEditingRelicId(viewingRelicId);
        }}
      />

      <EditRelicDialog
        relicId={editingRelicId}
        open={editingRelicId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRelicId(null);
        }}
        onSaved={refetch}
      />

      <AddRelicDialog
        open={addRelicOpen}
        onOpenChange={setAddRelicOpen}
        onSaved={refetch}
      />
    </div>
  );
}
