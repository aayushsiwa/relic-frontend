'use client';

import { CircleNotch, Link, NotePencil, PlusIcon } from '@phosphor-icons/react';
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
import { createRelicAPI } from '@/lib/api/relics';
import { createTagAPI, getTagsAPI } from '@/lib/api/tags';
import type { Tag } from '@/lib/api/tags';
import { cn } from '@/lib/utils';

type AddRelicType = 'url' | 'note';

export function AddRelicDialog({
  open,
  initialType = 'url',
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  initialType?: AddRelicType;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<AddRelicType>(initialType);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<
    Set<string>
  >(new Set());
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setType(initialType);
      setUrl('');
      setTitle('');
      setNote('');
      setSelectedCollectionIds(new Set());
      setSelectedTagIds(new Set());
      setNewTagName('');
      setError(null);
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    Promise.all([getCollectionsAPI({ limit: 100 }), getTagsAPI({ limit: 100 })])
      .then(([collectionsRes, tagsRes]) => {
        setCollections(collectionsRes.data);
        setTags(tagsRes.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [open]);

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

  async function handleSave() {
    if (isSaving) return;
    setError(null);

    if (type === 'url' && !url.trim()) {
      setError('Please enter a URL.');
      return;
    }
    if (type === 'note' && !title.trim() && !note.trim()) {
      setError('Please add a title or note text.');
      return;
    }

    setIsSaving(true);
    try {
      await createRelicAPI({
        url: type === 'url' ? url.trim() : undefined,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        contentType: type,
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
          <DialogTitle>Save to Library</DialogTitle>
          <DialogDescription>
            Save a link, or write a quick note to your archive.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-none p-0.5">
            {(
              [
                { value: 'url', label: 'Link', icon: Link },
                { value: 'note', label: 'Note', icon: NotePencil },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setType(value)}
                className={cn(
                  'w-full justify-center',
                  type === value && 'bg-muted text-foreground'
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </Button>
            ))}
          </div>

          {type === 'url' && (
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{type === 'url' ? 'Title (optional)' : 'Title'}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && type === 'url') handleSave();
              }}
              placeholder={type === 'url' ? 'Auto-detected if empty' : 'Title'}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Note</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && type === 'url') handleSave();
              }}
              placeholder="Personal note (optional)"
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

        <DialogFooter>
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <CircleNotch className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
