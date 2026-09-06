# Relic

Your personal knowledge archive. Save articles, notes, and links, organize them
with collections and tags, and rediscover anything instantly.

## Features

- **Save anything** — URLs with automatic metadata enrichment (title,
  description, preview image, favicon, and tags) or plain notes
- **Organize** — collections with colors, and tags auto-derived from page
  content and site name when you save a link
- **Find** — full-text search plus collection/tag filters, paginated masonry grid
- **View & edit** — read-only relic viewer with image lightbox, edit dialog,
  and delete
- **Auth** — email/password + GitHub OAuth, email verification, forgot/reset
  password, change email, profile picture
- **API access** — token auth (bearer plugin) for the browser extension
- **Self-hosting** — Dockerfile and Compose stack for the app plus optional
  bundled Postgres

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, pnpm
- shadcn/ui (`base-lyra` style, `@base-ui/react` primitives)
- Drizzle ORM over `pg` for resource tables
- better-auth for authentication
- `@extractus/article-extractor`, `metascraper`, `cheerio` for link enrichment

## Self-Hosting With Docker

Relic includes a Docker setup for running the production app and a Postgres
database in one stack.

1. Create an env file from the example and fill in required secrets:

```bash
cp .example.env .env
```

2. Start the stack:

```bash
docker compose up -d --build
```

The compose stack uses these names:

- App container: `relic-frontend`
- Database container: `relic-db`
- Network: `relic`
- Postgres volume: `relic-postgres-data`

By default, the app connects to the bundled Postgres service using:

```text
postgresql://relic:relic@relic-db:5432/relic
```

To use an external database, set `DATABASE_URL` in `.env`.

Apply the auth and app migrations against the configured database before using
the app:

```bash
pnpm db:migrate
```

This applies both the Drizzle migrations (resource tables) and the
better-auth migrations (auth tables, applied directly from `lib/auth.ts`).

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env` requirements from the checklist below into your own `.env` file:

| Variable                    | Required | Purpose                                       |
| --------------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`              | yes      | Postgres connection string                    |
| `BETTER_AUTH_SECRET`        | yes      | better-auth signing secret                    |
| `BETTER_AUTH_URL`           | yes      | Public app URL (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID`          | no       | GitHub OAuth app client ID                    |
| `GITHUB_CLIENT_SECRET`      | no       | GitHub OAuth app client secret                |
| `EMAIL_SERVICE_URL`         | yes*     | Outbound email service URL                    |
| `EMAIL_SERVICE_API_KEY`     | yes*     | Outbound email service API key                |
| `SMTP_HOST`                 | yes*     | SMTP server hostname                          |
| `SMTP_PORT`                 | yes*     | SMTP server port, usually `587` or `465`      |
| `SMTP_USER`                 | yes*     | SMTP username                                 |
| `SMTP_PASS`                 | yes*     | SMTP password                                 |
| `SMTP_SECURE`               | no       | `true` for TLS/SSL, `false` for STARTTLS      |
| `EMAIL_REQUIRED_FOR_SIGNUP` | no       | Set `false` to allow signup without email     |

\* Configure either `EMAIL_SERVICE_URL` + `EMAIL_SERVICE_API_KEY`, or the SMTP
variables. Email is used for signup verification, forgot/reset password, and
change-email flows. Without an email provider, those flows will fail.

### 3. Set up the database

Apply the migrations (both Drizzle and better-auth):

```bash
pnpm db:migrate
```

After changing the Drizzle schema (`lib/schema.ts`), generate a migration and
apply it:

```bash
pnpm db:generate && pnpm db:migrate
```

If you change better-auth configuration in `lib/auth.ts` (plugins, user
fields, etc.), apply the auth schema changes with `pnpm db:auth`.

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub OAuth

1. Register an OAuth app at [GitHub Developer settings](https://github.com/settings/developers).
2. Set the Homepage URL to `http://localhost:3000`.
3. Set the Authorization callback URL to `http://localhost:3000/api/auth/callback/github`.
4. Copy the Client ID and Client Secret into `GITHUB_CLIENT_ID` and
   `GITHUB_CLIENT_SECRET`.
5. Restart the dev server. Login/signup pages then show a GitHub button.

## Email Setup

The app sends verification, password-reset, and change-email emails through one
of two supported providers:

- A personal [email-service](https://github.com/aayushsiwa/email-service), using
  `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_API_KEY`
- Direct SMTP, using `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and
  `SMTP_SECURE`

Email delivery is handled through the unified `sendEmail` wrapper in
`lib/email.ts`. If the email-service variables are present, Relic uses that
provider; otherwise it falls back to SMTP.

## API

See [API.md](./API.md) for the full REST reference, including token auth for
API clients.

## Browser Extensions

Companion Chromium and Firefox extensions let you save the current tab straight
into your library. See
[relic-chromium-extension](https://github.com/aayushsiwa/relic-chromium-extension.git)
and [relic-firefox-extension](https://github.com/aayushsiwa/relic-firefox-extension.git).
They authenticate via the bearer token shown in **Settings** (`/settings`) and
post to `/api/relics`.

## Roadmap

Ideas for what comes next, roughly grouped by area. None of these are
implemented yet.

### Saving & content

- **File uploads** — the `relics.content_type` enum already has a `file` value,
  but there is no upload path, storage, or viewer. Wire up S3/local storage plus
  a file-type relic card and preview.
- **Full-page archive** — store the fetched HTML (and a Readability-extracted
  text copy) so the original content survives link rot, and enable search inside
  the saved article body rather than just metadata.
- **Import from other services** — one-click import from Pocket, Instapaper,
  Raindrop, or a browser bookmarks HTML file.

### Search & organization

- **Real full-text search** — replace the current `ILIKE` query/filtering with
  Postgres `tsvector` (and `pg_trgm` for fuzzy matching) for speed and relevance
  ranking as libraries grow.
- **Smart collections** — saved searches that auto-populate from a query, tag,
  or domain rule instead of manual assignment.
- **Tag management UI** — rename, merge, and bulk-delete unused tags from
  Settings; currently tags can only be created implicitly on save.
- **Bulk actions** — multi-select relics to bulk-tag, move between collections,
  or delete.

### Sharing & access

- **Public sharing** — generate a read-only share link for a single relic or an
  entire collection (public/unlisted), with optional password protection.
- **Read-later queue & reminders** — a lightweight inbox for unsorted links plus
  optional "remind me later" nudges.
- **Webhooks** — fire events on new-relic creates for automation and
  integrations.

### Platform

- **Offline / PWA** — service worker + installable app so the library and viewer
  work offline.
- **Export & data portability** — download the whole account (relics,
  collections, tags) as JSON/HTML, and a self-serve delete-account flow.
- **Enrichment hardening** — rate-limit and cache the metadata fetch to avoid
  re-scraping the same URL and to protect against abuse.

## Available Scripts

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build/serve
- `pnpm lint` / `pnpm type-check` / `pnpm format` / `pnpm format:check` — code quality
- `pnpm run-checks` — lint + type-check + format:check
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` — Drizzle DB tooling
  (`db:migrate` also applies better-auth migrations; `pnpm db:auth` for
  auth-only)
- `docker compose up -d --build` — build and run the self-hosted stack
