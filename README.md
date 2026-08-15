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
psql "$DATABASE_URL" -f better-auth_migrations/*.sql
pnpm db:migrate
```

If you use the bundled Postgres container, run those commands from your host
with a reachable database URL, or from your own migration workflow.

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

Apply the migrations. better-auth tables are in `better-auth_migrations/`
(apply manually to Postgres), then run the Drizzle migrations:

```bash
psql "$DATABASE_URL" -f better-auth_migrations/*.sql
pnpm db:migrate
```

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

## Browser Extension

A companion Chromium extension lets you save the current tab straight into your
library. See
[relic-chromium-extension](https://github.com/aayushsiwa/relic-chromium-extension.git).
It authenticates via the bearer token shown in **Settings** (`/settings`) and
posts to `/api/relics`.

## Available Scripts

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build/serve
- `pnpm lint` / `pnpm type-check` / `pnpm format` / `pnpm format:check` — code quality
- `pnpm run-checks` — lint + type-check + format:check
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` — Drizzle DB tooling
- `docker compose up -d --build` — build and run the self-hosted stack
