import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return <Dashboard user={session.user} />;
  }

  return <Landing />;
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

function Dashboard({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
        <span className="text-lg font-semibold tracking-tight">Relic</span>
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </header>

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">Your Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your saved knowledge.
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="py-6">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">
                  Saved Items
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">
                  Collections
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Tags</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recently Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 text-4xl opacity-20">&#128451;</div>
                <h3 className="text-lg font-medium">No saved items yet</h3>
                <p className="mt-1 mb-6 max-w-sm text-sm text-muted-foreground">
                  Save your first link, note, or file to start building your
                  personal archive.
                </p>
                <div className="flex gap-4">
                  <Button disabled>Save a Link</Button>
                  <Button variant="outline" disabled>
                    Write a Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
