'use client';

import { CircleNotch, UploadSimple } from '@phosphor-icons/react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { importRelicsAPI } from '@/lib/api/import';
import type { ImportItem } from '@/lib/api/import';
import { Navbar } from '@/lib/components/Navbar';

import { parseImportInput } from './parseImport';

export function Import({
  user,
}: {
  user: { name: string; email: string; image: string | null };
}) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      setText(content);
      runParse(content);
    };
    reader.readAsText(file);
  }

  function runParse(value: string) {
    setResult(null);
    try {
      const parsed = parseImportInput(value);
      setItems(parsed);
      setParseError(
        parsed.length ? null : 'No valid links found in the input.'
      );
    } catch {
      setItems([]);
      setParseError('Could not parse the provided file.');
    }
  }

  async function handleImport() {
    if (!items.length || isImporting) return;
    setIsImporting(true);
    setResult(null);
    try {
      const res = await importRelicsAPI(items);
      setResult(res);
      if (res.imported > 0) {
        setItems([]);
        setText('');
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar user={user} />

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-2xl font-semibold">Import</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Bring your saved links from a browser export, Pocket, Raindrop, or
            any CSV with a <code>url</code> column. One link per line also
            works.
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload a file</CardTitle>
              <CardDescription>
                HTML bookmarks or CSV (supported columns: url, title, tags,
                note).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple />
                Choose file
              </Button>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Or paste links / file contents
                </label>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    runParse(e.target.value);
                  }}
                  placeholder={
                    'https://example.com/article-1\nhttps://example.com/article-2'
                  }
                  className="h-48 w-full resize-y rounded-none border border-input bg-transparent p-3 text-sm focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                />
              </div>
            </CardContent>
          </Card>

          {parseError && (
            <div className="mb-4 rounded border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {parseError}
            </div>
          )}

          {items.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{items.length} links ready</CardTitle>
                <CardDescription>
                  Preview of the first few items to be imported.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {items.slice(0, 8).map((item, i) => (
                    <li key={i} className="py-2">
                      <p className="truncate font-medium">
                        {item.title || item.url}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.url}
                        {item.tags?.length
                          ? ` · tags: ${item.tags.join(', ')}`
                          : ''}
                      </p>
                    </li>
                  ))}
                  {items.length > 8 && (
                    <li className="py-2 text-xs text-muted-foreground">
                      + {items.length - 8} more
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              disabled={!items.length || isImporting}
            >
              {isImporting ? (
                <>
                  <CircleNotch className="animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${items.length || ''}`.trim()
              )}
            </Button>
          </div>

          {result && (
            <div className="mt-6 rounded border border-border bg-muted/30 px-4 py-3 text-sm">
              <p>
                Imported <strong>{result.imported}</strong> links, skipped{' '}
                <strong>{result.skipped}</strong>.
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
