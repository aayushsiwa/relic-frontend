'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/lib/components/Navbar';

import { useCollections } from './Collections.hooks';

export function Collections({ email }: { email: string }) {
  const { collections, isLoading, error, create, update, remove } =
    useCollections();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await create({
      name: newName.trim(),
      description: newDescription || undefined,
      color: newColor,
    });
    setNewName('');
    setNewDescription('');
  }

  function startEdit(c: (typeof collections)[0]) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? '');
    setEditColor(c.color ?? '#3b82f6');
  }

  async function handleUpdate(id: string) {
    await update(id, {
      name: editName,
      description: editDescription || undefined,
      color: editColor,
    });
    setEditingId(null);
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar email={email} />

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 text-2xl font-semibold">Collections</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreate}
                className="flex flex-wrap items-end gap-4"
              >
                <Field className="flex-1">
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Collection name"
                    required
                  />
                </Field>
                <Field className="flex-1">
                  <FieldLabel>Description</FieldLabel>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </Field>
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border bg-transparent"
                  />
                </Field>
                <Button type="submit" className="shrink-0">
                  Create
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="py-6">
                    <div className="mb-2 h-5 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-4xl opacity-20">&#128193;</div>
              <h3 className="text-lg font-medium">No collections yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first collection to organize your saved items.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <Card key={c.id}>
                  <CardContent className="py-5">
                    {editingId === c.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                        />
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                        />
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="h-8 w-12 cursor-pointer rounded border bg-transparent"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(c.id)}>
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
                      </div>
                    ) : (
                      <>
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: c.color ?? '#888' }}
                          />
                          <span className="font-medium">{c.name}</span>
                        </div>
                        {c.description && (
                          <p className="mb-2 text-xs text-muted-foreground">
                            {c.description}
                          </p>
                        )}
                        <p className="mb-3 text-xs text-muted-foreground">
                          {c.relicCount} {c.relicCount === 1 ? 'item' : 'items'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => startEdit(c)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => remove(c.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
