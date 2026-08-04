'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Navbar } from '@/lib/components/Navbar';
import { SearchFilters } from '@/lib/components/SearchFilters';

import { useHomeData } from './Home.hooks';

dayjs.extend(relativeTime);

export function Home({
  user,
}: {
  user: { name?: string | null; email?: string | null } | null;
}) {
  if (!user) {
    return <Landing />;
  }

  return <AuthenticatedHome user={user} />;
}

function Landing() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <span className="text-lg font-semibold tracking-tight">Relic</span>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Capture. Preserve. Rediscover.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Your personal knowledge archive. Save articles, notes, code, and
            anything else that matters — organized and always accessible.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Capture</CardTitle>
              <CardDescription>
                Save URLs, notes, and files with one click. Built for speed.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preserve</CardTitle>
              <CardDescription>
                Content is saved, not just links. Full-text, screenshots, and
                reader mode.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rediscover</CardTitle>
              <CardDescription>
                Powerful search, collections, and tags make finding anything
                instant.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}

function AuthenticatedHome({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const [search, setSearch] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tagId, setTagId] = useState('');

  const { data, isLoading, error } = useHomeData(search, collectionId, tagId);

  const hasFilters = search || collectionId || tagId;

  return (
    <div className="flex flex-col flex-1">
      <Navbar email={user.email ?? ''} />

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Your Library</h1>
          </div>

          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            collectionId={collectionId}
            onCollectionChange={setCollectionId}
            tagId={tagId}
            onTagChange={setTagId}
            collections={data?.collections ?? []}
            tags={data?.tags ?? []}
          />

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="py-6">
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : (data?.relicCount ?? 0)}
                </div>
                <div className="text-sm text-muted-foreground">Saved Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : (data?.collectionCount ?? 0)}
                </div>
                <div className="text-sm text-muted-foreground">Collections</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : (data?.tagCount ?? 0)}
                </div>
                <div className="text-sm text-muted-foreground">Tags</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{hasFilters ? 'Results' : 'Recently Saved'}</CardTitle>
              {!hasFilters && data && data.recentRelics.length > 0 && (
                <CardDescription>
                  <a href="/library" className="text-xs hover:underline">
                    View all &rarr;
                  </a>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="py-8 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : isLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : data && data.recentRelics.length > 0 ? (
                <ul className="divide-y">
                  {data.recentRelics.map((relic) => (
                    <li key={relic.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {/*|| relic.url ||*/}
                          {relic.title || 'Untitled'}
                        </p>
                        {relic.domain && (
                          <p className="truncate text-xs text-muted-foreground">
                            {relic.domain}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {dayjs(relic.createdAt).fromNow()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 text-4xl opacity-20">
                    {hasFilters ? '\u{1F50D}' : '\u{1F4C3}'}
                  </div>
                  <h3 className="text-lg font-medium">
                    {hasFilters ? 'No results found' : 'No saved items yet'}
                  </h3>
                  <p className="mt-1 mb-6 max-w-sm text-sm text-muted-foreground">
                    {hasFilters
                      ? 'Try a different search term or clear the filters.'
                      : 'Save your first link, note, or file to start building your personal archive.'}
                  </p>
                  {!hasFilters && (
                    <div className="flex gap-4">
                      <Button disabled>Save a Link</Button>
                      <Button variant="outline" disabled>
                        Write a Note
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
