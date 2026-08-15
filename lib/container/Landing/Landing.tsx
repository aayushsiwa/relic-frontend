import { GithubLogoIcon, StarIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/lib/components/ThemeToggle';

const frontendRepoUrl = 'https://github.com/aayushsiwa/relic-frontend';
const extensionRepoUrl =
  'https://github.com/aayushsiwa/relic-chromium-extension';

const features = [
  {
    title: 'Capture from anywhere',
    description:
      'Save links, notes, metadata, favicons, preview images, tags, and collections into one archive.',
  },
  {
    title: 'Built for self-hosting',
    description:
      'Run the Next.js app with your own Postgres database, auth settings, and email provider.',
  },
  {
    title: 'Browser-first workflow',
    description:
      'Pair the web app with the Chromium extension to save pages without leaving the browser.',
  },
  {
    title: 'Rediscover later',
    description:
      'Search saved relics by title, URL, domain, description, notes, tags, and collections.',
  },
];

const stack = ['Next.js', 'Postgres', 'better-auth', 'SMTP'];

const advantages = [
  'Your data stays in your infrastructure.',
  'Open-source frontend and Chromium extension.',
  'Email can run through the API service or direct SMTP.',
  'Auth, metadata extraction, collections, and tags are included.',
];

async function getFrontendStarCount() {
  try {
    const res = await fetch(
      'https://api.github.com/repos/aayushsiwa/relic-frontend',
      {
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === 'number'
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

function formatStars(stars: number | null) {
  if (stars === null) return 'Star';
  return `Star ${new Intl.NumberFormat('en', { notation: 'compact' }).format(
    stars
  )}`;
}

export async function Landing() {
  const stars = await getFrontendStarCount();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link href="/landing" className="text-lg font-semibold tracking-tight">
          Relic
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          <a
            href={frontendRepoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
          >
            <GithubLogoIcon size={14} />
            Frontend
          </a>
          <a
            href={extensionRepoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
          >
            <GithubLogoIcon size={14} />
            Extension
          </a>
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex flex-1 flex-col px-6 py-16 md:px-10">
        <section className="mx-auto w-full max-w-5xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm text-muted-foreground">
              Open-source personal knowledge archive
            </p>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Self-host your personal internet memory.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Relic is a private archive for links, articles, notes, and
              resources you do not want buried in tabs, chats, or browser
              bookmarks.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={frontendRepoUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ size: 'lg' })}
              >
                <GithubLogoIcon />
                View web app repo
              </a>
              <a
                href={extensionRepoUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                <GithubLogoIcon />
                View extension repo
              </a>
              <a
                href={frontendRepoUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: 'secondary', size: 'lg' })}
              >
                <StarIcon weight="fill" />
                {formatStars(stars)}
              </a>
            </div>
          </div>

          <div className="mt-20 grid gap-2 md:grid-cols-4">
            {stack.map((item) => (
              <Card key={item}>
                <CardContent className="py-6">
                  <div className="text-sm font-medium">{item}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Own the stack. Keep the workflow fast.
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid gap-2 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Why self-host Relic?</CardTitle>
              <CardDescription>
                A practical archive, not another hosted inbox for your
                bookmarks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y border">
                {advantages.map((advantage) => (
                  <li key={advantage} className="px-4 py-3 text-sm">
                    {advantage}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
