'use client';

import { Trash, Warning } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  deleteTagAPI,
  getTagsAPI,
  mergeTagsAPI,
  updateTagAPI,
} from '@/lib/api/tags';
import type { Tag } from '@/lib/api/tags';
import { Navbar } from '@/lib/components/Navbar';

type MergeState = {
  sourceId: string;
  sourceName: string;
  targetId: string;
} | null;

type TagFilter = 'all' | 'unused';

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<void>;
};

export function Tags({
  user,
}: {
  user: { name: string; email: string; image: string | null };
}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [merge, setMerge] = useState<MergeState>(null);
  const [filter, setFilter] = useState<TagFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    try {
      const res = await getTagsAPI({ limit: 200 });
      setTags(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await getTagsAPI({ limit: 200 });
        if (ignore) return;
        setTags(res.data);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const visibleTags = useMemo(
    () =>
      filter === 'unused'
        ? tags.filter((t) => (t.relicCount ?? 0) === 0)
        : tags,
    [tags, filter]
  );

  const allVisibleSelected =
    visibleTags.length > 0 && visibleTags.every((t) => selected.has(t.id));

  function toggleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const t of visibleTags) {
        if (checked) {
          next.add(t.id);
        } else {
          next.delete(t.id);
        }
      }
      return next;
    });
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditName(tag.name);
  }

  async function handleRename(id: string) {
    const name = editName.trim();
    if (!name) return;
    try {
      const updated = await updateTagAPI(id, { name });
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename tag');
    }
  }

  function requestDelete(tag: Tag) {
    const count = tag.relicCount ?? 0;
    setConfirm({
      title: 'Delete tag',
      description: `"${tag.name}" will be permanently deleted and removed from ${count} ${
        count === 1 ? 'relic' : 'relics'
      }. This cannot be undone.`,
      confirmLabel: 'Delete tag',
      action: async () => {
        await deleteTagAPI(tag.id);
      },
    });
  }

  function requestDeleteSelected() {
    const count = selected.size;
    setConfirm({
      title: 'Delete selected tags',
      description: `${count} ${count === 1 ? 'tag' : 'tags'} will be permanently deleted and removed from all their relics. This cannot be undone.`,
      confirmLabel: `Delete ${count} ${count === 1 ? 'tag' : 'tags'}`,
      action: async () => {
        for (const id of selected) {
          await deleteTagAPI(id);
        }
      },
    });
  }

  async function handleConfirm() {
    if (!confirm) return;
    setIsDeleting(true);
    try {
      await confirm.action();
      setConfirm(null);
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tags');
      setConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMerge() {
    if (!merge || !merge.targetId) return;
    try {
      await mergeTagsAPI(merge.sourceId, merge.targetId);
      setMerge(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge tags');
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar user={user} />

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-1 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Tags</h1>
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                size="xs"
                variant={filter === 'unused' ? 'default' : 'outline'}
                onClick={() => setFilter('unused')}
              >
                Unused
              </Button>
            </div>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Rename, merge, or remove tags across your library.
          </p>

          {error && (
            <div className="mb-4 rounded border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full rounded border bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : visibleTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-4xl opacity-20">&#127991;</div>
              <h3 className="text-lg font-medium">
                {filter === 'unused' ? 'No unused tags' : 'No tags yet'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === 'unused'
                  ? 'Every tag is applied to at least one relic.'
                  : 'Tags are created automatically when you save links.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-3 px-1">
                <Checkbox
                  aria-label="Select all"
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                />
                <span className="text-xs text-muted-foreground">
                  Select all
                </span>
              </div>

              {selected.size > 0 && (
                <div className="mb-2 flex items-center gap-2 rounded border px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    {selected.size} selected
                  </span>
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={requestDeleteSelected}
                  >
                    <Trash />
                    Delete selected
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setSelected(new Set())}
                  >
                    Clear selection
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {visibleTags.map((tag) => (
                  <Card key={tag.id}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <Checkbox
                        aria-label={`Select ${tag.name}`}
                        checked={selected.has(tag.id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(tag.id, !!checked)
                        }
                      />
                      {editingId === tag.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleRename(tag.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : merge?.sourceId === tag.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <span className="text-sm">
                            Merge{' '}
                            <strong className="rounded bg-muted px-1.5 py-0.5">
                              {tag.name}
                            </strong>{' '}
                            into
                          </span>
                          <select
                            value={merge.targetId}
                            onChange={(e) =>
                              setMerge({
                                ...merge,
                                targetId: e.target.value,
                              })
                            }
                            className="h-8 rounded-none border border-input bg-transparent px-2.5 text-xs focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                          >
                            <option value="">Select target...</option>
                            {tags
                              .filter((t) => t.id !== tag.id)
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={handleMerge}
                            disabled={!merge.targetId}
                          >
                            Merge
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMerge(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 font-medium">{tag.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {tag.relicCount ?? 0}{' '}
                            {(tag.relicCount ?? 0) === 1 ? 'item' : 'items'}
                          </span>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => startEdit(tag)}
                          >
                            Rename
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              setMerge({
                                sourceId: tag.id,
                                sourceName: tag.name,
                                targetId: '',
                              })
                            }
                          >
                            Merge
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => requestDelete(tag)}
                            aria-label={`Delete ${tag.name}`}
                          >
                            <Trash />
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {merge && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Warning className="text-amber-500" />
              Merging moves all relics from <strong>
                {merge.sourceName}
              </strong>{' '}
              into the selected tag, then deletes the source.
            </p>
          )}
        </div>
      </main>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : confirm?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
