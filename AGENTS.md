# AGENTS.md

## Commands (run in project root)

- `pnpm dev` — Dev server
- `pnpm build` — Build
- `pnpm start` — Prod server
- `pnpm lint` — ESLint (config uses `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`)

No test, e2e, CI/CD, or pre-commit hooks exist. Do not add or run tests.

## Stack

- Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, pnpm
- shadcn/ui (style `base-lyra`, icon library `phosphor`), `@base-ui/react` for primitives (Button, Input)
- Tailwind v4: use `@import "tailwindcss"` and `@theme` — no `tailwind.config.js`, PostCSS uses `@tailwindcss/postcss`
- better-auth (email/password + GitHub OAuth; Postgres via `pg` driver, not an ORM)
- Auth route handler: `app/api/auth/[...all]/route.ts` wires `better-auth/next-js`

## Project structure

- `app/` — Next.js App Router pages and API routes
- `components/` — shadcn ui components (`ui/`) and page-level forms (`login-form.tsx`, `signup-form.tsx`)
- `lib/` — `auth.ts` (better-auth server instance), `auth-client.ts` (better-auth browser client), `utils.ts` (`cn()` helper)
- `better-auth_migrations/` — SQL migration for auth tables (apply manually to Postgres)
- Path alias `@/` maps to project root (`tsconfig.json` + `components.json`)

## Quirks

- `lib/server.ts`, `lib/user.ts`, and `lib/api/*` contain example/snippet code (top-level await, undefined variables, commented blocks). Not imported anywhere — treat as scratch.
- `pnpm-workspace.yaml` exists but only sets `allowBuilds`/`ignoredBuiltDependencies` for `sharp` and `unrs-resolver`; this is **not** a monorepo.
- `.env` contains live secrets (`BETTER_AUTH_SECRET`, `DATABASE_URL`) — avoid committing.
- shadcn `base-lyra` style uses `@base-ui/react` (not Radix) for primitives, `cva` for variants, `data-slot` attributes, and `@container` queries in components.
- ESLint ignores `.next/`, `out/`, `build/`, `next-env.d.ts` via `globalIgnores` in `eslint.config.mjs`.

## Reference files

`/package.json`, `/tsconfig.json`, `/components.json`, `/eslint.config.mjs`, `/postcss.config.mjs`, `/next.config.ts`

*Update this file if CI, `opencode.json`, `.github/*`, or new test/tool configs are added.*
