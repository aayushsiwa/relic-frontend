# AGENTS.md

## Commands (run in project root)

- `pnpm dev` — Dev server
- `pnpm build` — Build
- `pnpm start` — Prod server
- `pnpm lint` — ESLint (config uses `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`)
- `pnpm type-check` — `tsc --noEmit`
- `pnpm format` / `pnpm format:check` — Prettier (write / check)
- `pnpm run-checks` — `pnpm lint && pnpm type-check && pnpm format:check` (run after changes)
- `pnpm db:generate` — Generate Drizzle SQL migration from schema
- `pnpm db:migrate` — Apply pending migrations to Postgres
- `pnpm db:push` — Push schema directly (dev only)
- `docker compose up -d --build` — Build and run the self-hosting stack (`relic-frontend` + optional `relic-db`)
- `docker compose build app` — Build only the frontend image

No test, e2e, CI/CD, or pre-commit hooks exist. Do not add or run tests.

## Stack

- Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, pnpm
- shadcn/ui (style `base-lyra`, icon library `phosphor`), `@base-ui/react` for primitives
- Tailwind v4: use `@import "tailwindcss"` and `@theme` — no `tailwind.config.js`, PostCSS uses `@tailwindcss/postcss`
- **Drizzle ORM** (`drizzle-orm/node-postgres`) over `pg` Pool for resource tables; `lib/schema.ts` defines all app tables
- **better-auth** (email/password + GitHub OAuth; Postgres via `pg` driver, not an ORM); `bearer` plugin for API-token auth
- Auth route handler: `app/api/auth/[...all]/route.ts` wires `better-auth/next-js`
- **Metadata/enrichment:** `@extractus/article-extractor` (Mozilla Readability), `metascraper*`, `cheerio` — pull title/description/image/favicon/tags when a URL relic is saved
- **Email:** `lib/email.ts` exposes a unified `sendEmail` wrapper. It uses the personal email-service when `EMAIL_SERVICE_URL` + `EMAIL_SERVICE_API_KEY` exist, otherwise SMTP (`SMTP_*`). Used for verification, reset-password, and change-email emails.

## Project structure

- `app/` — Thin page wrappers (auth check + render container). API routes at `app/api/`.
- `app/api/relics`, `app/api/collections`, `app/api/tags` — REST routes (+ `[id]/` subroutes)
- `app/landing`, `app/verify-email`, `app/forgot-password`, `app/reset-password/[token]` — landing/auth/email pages
- `lib/container/` — Page-level components (one folder per route: `Home/`, `Landing/`, `Login/`, `Signup/`, `Settings/`, `Library/`, `Collections/`)
- `lib/components/` — Custom reusable components shared across containers (`Navbar`, `ThemeToggle`, `SearchFilters`, `RelicCard`, `ViewRelicDialog`, `AddRelicDialog`, `EditRelicDialog`)
- `lib/` — `config.ts` (central env parsing), `auth.ts` (better-auth), `auth-client.ts`, `db.ts` (Drizzle + Pool), `schema.ts`, `metadata.ts` (scrape/enrichment + tag derivation), `email.ts` (email-service/SMTP sender), `utils.ts` (`cn()`)
- `lib/api/` — `index.ts` (axios instance), `relics.ts`, `collections.ts`, `tags.ts` (typed API functions)
- `components/ui/` — shadcn ui primitives (button, card, field, etc.)
- `middleware.ts` — CORS headers for `/api/*`; OPTIONS preflight handled here. Also redirects page routes to `/landing` when `MODE=landing`.
- `Dockerfile`, `.dockerignore`, `docker-compose.yaml` — self-hosting Docker setup. Compose stack name is `relic`, containers are `relic-frontend` and `relic-db`, network is `relic`, Postgres volume is `relic-postgres-data`.
- `drizzle/` — Generated migration SQL files
- `better-auth_migrations/` — SQL migration for auth tables (apply manually to Postgres)
- `types/article-extractor.d.ts` — ambient types (package ships no types)
- Path alias `@/` maps to project root (`tsconfig.json` + `components.json`)

## Drizzle

- Schema lives in `lib/schema.ts`. After changing schema: `pnpm db:generate && pnpm db:migrate`
- The `user` table is managed by better-auth — Drizzle schema defines it for FK references only; migrations skip CREATE TABLE for `user` (already exists).
- Junction tables use `primaryKey({ columns: [...] })` for composite PKs.

## API conventions

- All resource routes check auth via `auth.api.getSession({ headers: await headers() })`
- Return `401` JSON if no session. API-token auth via `Authorization: Bearer` (bearer plugin).
- List routes support `?q=` search on title/url/domain/description/note, `?collectionId=`, `?tagId=` filtering.
- Pagination via `?page=` and `?limit=` (relics default 20; collections default 20; tags default 50).
- Creating a URL relic triggers async enrichment (metadata + auto-create tags) via `after()`.
- Unique violations (`23505`, e.g. duplicate URL/title/tag/collection name) return `409`.

## Env vars (`.env`)

- `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — auth/db
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth
- `EMAIL_SERVICE_URL`, `EMAIL_SERVICE_API_KEY` — outbound email-service provider
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` — direct SMTP provider
- `EMAIL_REQUIRED_FOR_SIGNUP` — backend flag for optional email on signup (default true)
- `MODE` — when set to `landing`, middleware redirects page routes to `/landing`
- `APP_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — Docker Compose self-hosting defaults

## Quirks

- Scratch files `lib/server.ts`, `lib/user.ts` were deleted — do not recreate (do not create `lib/api/*` scratch either; `lib/api/` is the typed client).
- `pnpm-workspace.yaml` only sets build permissions for `sharp`, `unrs-resolver`, `esbuild`, and `re2` — **not** a monorepo. Dockerfile must copy it before `pnpm install` or pnpm will reject native build scripts.
- `.env` contains live secrets — avoid committing.
- shadcn `base-lyra` style uses `@base-ui/react` (not Radix) for primitives, `cva` for variants, `data-slot` attributes, `@container` queries.
- ESLint ignores `.next/`, `out/`, `build/`, `next-env.d.ts` via `globalIgnores` in `eslint.config.mjs`.

## Reference files

`/package.json`, `/tsconfig.json`, `/components.json`, `/eslint.config.mjs`, `/postcss.config.mjs`, `/next.config.ts`, `/drizzle.config.ts`, `/Dockerfile`, `/docker-compose.yaml`, `/.dockerignore`, `/lib/config.ts`, `/lib/schema.ts`, `/lib/db.ts`, `/lib/auth.ts`, `/lib/metadata.ts`, `/lib/email.ts`

_Update this file if CI, `opencode.json`, `.github/*`, Docker setup, or new configs are added._
