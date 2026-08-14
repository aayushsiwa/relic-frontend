'use client';

import { CircleNotch, PencilIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { RelicWithRelations } from '@/lib/api/relics';

dayjs.extend(relativeTime);

export function RelicCard({
  relic,
  onView,
  onEdit,
}: {
  relic: RelicWithRelations;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <Card
      className="relative flex flex-col w-full cursor-pointer hover:shadow-[0_0_0_1px_var(--border)]"
      onClick={onView}
    >
      {relic.previewImage ? (
        <div className={'relative w-full'}>
          <img
            src={relic.previewImage}
            alt={relic.title || relic.url || 'Preview'}
            className="object-cover"
          />
        </div>
      ) : relic.isProcessing ? (
        <div className="relative flex w-full aspect-square items-center justify-center bg-muted">
          <CircleNotch
            className="animate-spin text-muted-foreground"
            size={28}
          />
        </div>
      ) : null}
      <CardContent className="pb-2 px-4 flex flex-col gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {relic.favicon && (
              <Image
                src={relic.favicon}
                alt={relic.title || relic.favicon}
                width={8}
                height={8}
                unoptimized
                loading="eager"
                className="h-8 w-8 shrink-0"
              />
            )}
            {relic.title && (
              <p className="truncate text-base font-medium">{relic.title}</p>
            )}
            {relic.isProcessing && (
              <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                <CircleNotch className="animate-spin" size={10} />
                Processing
              </Badge>
            )}
          </div>
          {relic.url && (
            <a
              href={relic.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
              title={relic.url}
              onClick={(e) => e.stopPropagation()}
            >
              {relic.domain || relic.url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
        {relic.description || relic.note ? (
          <p className="line-clamp-2 text-xs text-muted-foreground mt-1">
            {relic.description || relic.note}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1 mt-3">
          {relic.tags?.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
          {relic.collections?.map((col) => (
            <Badge key={col.id} variant="outline">
              {col.name}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-end justify-between px-4 py-1">
        <span className="text-xs text-muted-foreground">
          {dayjs(relic.createdAt).fromNow()}
        </span>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label={`Edit ${relic.title || relic.url || 'relic'}`}
        >
          <PencilIcon />
        </Button>
      </CardFooter>
    </Card>
  );
}
