'use client';

import { useState } from 'react';
import Masonry from 'react-masonry-css';

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
import { Navbar } from '@/lib/components/Navbar';
import { RelicCard } from '@/lib/components/RelicCard';
import { SearchFilters } from '@/lib/components/SearchFilters';
import { ViewRelicDialog } from '@/lib/components/ViewRelicDialog';

import { EditRelicDialog } from './EditRelicDialog';
import { useLibrary } from './Library.hooks';

export function Library({ email }: { email: string }) {
  const [search, setSearch] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tagId, setTagId] = useState('');
  const [page, setPage] = useState(1);
  const [appliedSearch, setAppliedSearch] = useState('');

  const [viewingRelicId, setViewingRelicId] = useState<string | null>(null);
  const [editingRelicId, setEditingRelicId] = useState<string | null>(null);

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
      <Navbar email={email} />

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-2xl font-semibold">Library</h1>

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
      />

      <EditRelicDialog
        relicId={editingRelicId}
        open={editingRelicId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRelicId(null);
        }}
        onSaved={refetch}
      />
    </div>
  );
}
