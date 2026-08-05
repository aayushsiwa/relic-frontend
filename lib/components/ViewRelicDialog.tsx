'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getRelicAPI } from '@/lib/api/relics';
import type { RelicWithRelations } from '@/lib/api/relics';

export function ViewRelicDialog({
  relicId,
  open,
  onOpenChange,
}: {
  relicId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [relic, setRelic] = useState<RelicWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevRelicId, setPrevRelicId] = useState(relicId);
  const [prevOpen, setPrevOpen] = useState(open);

  if (relicId !== prevRelicId || open !== prevOpen) {
    setPrevRelicId(relicId);
    setPrevOpen(open);
    if (open && relicId) {
      setRelic(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (!open || !relicId) return;

    getRelicAPI(relicId)
      .then(setRelic)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [open, relicId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{relic?.title || 'Relic'}</DialogTitle>
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
            {relic.previewImage && (
              <Image
                src={relic.previewImage}
                alt={relic.title ?? 'Relic preview'}
                width={800}
                height={256}
                className="w-full rounded border object-cover max-h-64"
                unoptimized
                priority
              />
            )}

            {relic.url && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">URL</p>
                <a
                  href={relic.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {relic.url}
                </a>
              </div>
            )}

            {relic.description && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-sm">{relic.description}</p>
              </div>
            )}

            {relic.note && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Note
                </p>
                <p className="text-sm whitespace-pre-wrap">{relic.note}</p>
              </div>
            )}

            {relic.tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {relic.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {relic.collections.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Collections
                </p>
                <div className="flex flex-wrap gap-1">
                  {relic.collections.map((col) => (
                    <Badge key={col.id} variant="outline">
                      {col.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
