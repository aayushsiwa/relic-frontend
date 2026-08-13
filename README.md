# Relic

Your personal knowledge archive. Save articles, notes, and links — organize them
with collections and tags, and rediscover anything instantly.

## Features

- **Save anything** — URLs (with automatic metadata enrichment: title,
  description, preview image, favicon, and tags) or plain notes
- **Organize** — collections with colors, and tags (auto-derived from page
  content + site name when you save a link)
- **Find** — full-text search plus collection/tag filters, paginated masonry grid
- **View & edit** — read-only relic viewer with image lightbox, edit dialog,
  and delete
- **Auth** — email/password + GitHub OAuth, email verification, forgot/reset
  password, change email, profile picture
- **API access** — token auth (bearer plugin) for the browser extension

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, pnpm
- shadcn/ui (`base-lyra` style, `@base-ui/react` primitives)
- Drizzle ORM over `pg` for resource tables
- better-auth for authentication
- `@extractus/article-extractor`, `metascraper`, `cheerio` for link enrichment

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env` requirements from the checklist below into your own `.env` file:

| Variable                | Required | Purpose                                       |
| ----------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`          | yes      | Postgres connection string                    |
| `BETTER_AUTH_SECRET`    | yes      | better-auth signing secret                    |
| `BETTER_AUTH_URL`       | yes      | Public app URL (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID`      | no       | GitHub OAuth app client ID                    |
| `GITHUB_CLIENT_SECRET`  | no       | GitHub OAuth app client secret                |
| `EMAIL_SERVICE_URL`     | yes*     | Outbound email service URL                    |
| `EMAIL_SERVICE_API_KEY` | yes*     | Outbound email service API key                |

\* Required for signup email verification, forgot/reset password, and change
email. Without it, those flows will fail.

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
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
2. Copy the Client ID and Client Secret into `GITHUB_CLIENT_ID` and
   `GITHUB_CLIENT_SECRET`.
3. Restart the dev server. Login/signup pages then show a GitHub button.

## Email setup

The app sends verification, password-reset, and change-email emails through a
personal [email-service](https://github.com/aayushsiwa/email-service). It posts
`{ to, subject, text, html }` to `EMAIL_SERVICE_URL?key=EMAIL_SERVICE_API_KEY`.
Point these env vars at your email-service instance (or swap
`lib/email.ts` for any provider).

## API

See [API.md](./API.md) for the full REST reference, including token auth for
API clients.

## Available scripts

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build/serve
- `pnpm lint` / `pnpm type-check` / `pnpm format` / `pnpm format:check` — code quality
- `pnpm run-checks` — lint + type-check + format:check
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` — Drizzle DB tooling
