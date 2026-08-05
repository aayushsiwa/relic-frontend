'use client';

import { PlusIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCollectionsAPI } from '@/lib/api/collections';
import type { Collection } from '@/lib/api/collections';
import { deleteRelicAPI, getRelicAPI, updateRelicAPI } from '@/lib/api/relics';
import type { RelicWithRelations } from '@/lib/api/relics';
import { createTagAPI, getTagsAPI } from '@/lib/api/tags';
import type { Tag } from '@/lib/api/tags';

export function EditRelicDialog({
  relicId,
  open,
  onOpenChange,
  onSaved,
}: {
  relicId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [relic, setRelic] = useState<RelicWithRelations | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<
    Set<string>
  >(new Set());
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prevRelicId, setPrevRelicId] = useState(relicId);
  const [prevOpen, setPrevOpen] = useState(open);

  if (relicId !== prevRelicId || open !== prevOpen) {
    setPrevRelicId(relicId);
    setPrevOpen(open);
    if (open && relicId) {
      setError(null);
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!open || !relicId) return;

    Promise.all([
      getRelicAPI(relicId),
      getCollectionsAPI({ limit: 100 }),
      getTagsAPI({ limit: 100 }),
    ])
      .then(([relicData, collectionsRes, tagsRes]) => {
        setRelic(relicData);
        setTitle(relicData.title ?? '');
        setUrl(relicData.url ?? '');
        setDescription(relicData.description ?? '');
        setNote(relicData.note ?? '');
        setCollections(collectionsRes.data);
        setTags(tagsRes.data);
        setSelectedCollectionIds(
          new Set(relicData.collections.map((c) => c.id))
        );
        setSelectedTagIds(new Set(relicData.tags.map((t) => t.id)));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [open, relicId]);

  function toggleCollection(id: string) {
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name || isCreatingTag) return;
    setIsCreatingTag(true);
    try {
      const tag = await createTagAPI({ name });
      setTags((prev) => [...prev, tag]);
      setSelectedTagIds((prev) => new Set(prev).add(tag.id));
      setNewTagName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  }

  async function handleDelete() {
    if (!relicId || isDeleting) return;
    if (!window.confirm('Delete this relic? This cannot be undone.')) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteRelicAPI(relicId);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSave() {
    if (!relicId) return;
    setIsSaving(true);
    setError(null);

    try {
      await updateRelicAPI(relicId, {
        title: title || undefined,
        url: url || undefined,
        description: description || undefined,
        note: note || undefined,
        collectionIds: Array.from(selectedCollectionIds),
        tagIds: Array.from(selectedTagIds),
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Relic</DialogTitle>
          <DialogDescription>
            Update the details for this saved item.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs text-destructive">
            {error}
          </div>
        )}

        {!relic ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Personal note"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Collections</Label>
              {collections.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No collections yet
                </p>
              ) : (
                <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded border p-2">
                  {collections.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs has-checked:bg-primary/10 has-checked:text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollectionIds.has(c.id)}
                        onChange={() => toggleCollection(c.id)}
                        className="size-3 accent-primary"
                      />
                      {c.color && (
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                      )}
                      {c.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              {tags.length > 0 && (
                <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded border p-2">
                  {tags.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded bg-muted/50 px-2 py-1 text-xs has-checked:bg-primary/10 has-checked:text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.has(t.id)}
                        onChange={() => toggleTag(t.id)}
                        className="size-3 accent-primary"
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag();
                  }}
                  placeholder="New tag name..."
                  className="flex-1"
                />
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={handleCreateTag}
                  disabled={isCreatingTag || !newTagName.trim()}
                >
                  <PlusIcon />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <Button
              variant="destructive"
              size="xs"
              onClick={handleDelete}
              disabled={isDeleting || !relic}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !relic}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
