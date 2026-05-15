# AGENTS.md

> Guidance for AI coding agents working on this repository.
> Read before generating code. Update only when conventions change.

---

**This is an early-stage scaffold.** Many architectural decisions are not yet reflected in code. When the file says "(pending)", the feature hasn't been implemented — don't assume it exists.

## Project at a glance

B2B business finder + mapped CRM. See `CONTEXT.md` for full product context.

Monorepo (pnpm workspaces) with verified structure:

```
apps/
  web/          # Next.js 15 App Router + MapLibre GL + Zustand
  api/          # NestJS 11 — REST + BullMQ queue bridge
  workers/      # Standalone BullMQ workers + Python scraper
packages/
  db/           # Drizzle schema + client (node-postgres pool)
  shared/       # Zod schemas, env validation, shared types
  ai/           # AI provider (NVIDIA NIM via Vercel AI SDK)
  ui/           # React component primitives (cva + tailwind-merge)
  eslint-config/  # Shell package (no config yet)
  typescript-config/  # base.json with strict mode
infra/          # Empty — planned for docker/deploy config
```

## Tech stack (verified)

| Concern | Choice |
|---|---|
| Package manager | **pnpm** (never npm/yarn). Locked to pnpm@9.15.0 in `package.json`. |
| Node | 22 LTS (`.nvmrc`) |
| TypeScript | Strict mode, via `packages/typescript-config/base.json` |
| Frontend | Next.js 15 (App Router), React 19, Tailwind v4, MapLibre GL JS |
| Backend | NestJS 11, decorators enabled in tsconfig |
| DB | PostgreSQL via Drizzle ORM (`drizzle-orm/node-postgres`) |
| Queue | BullMQ + Redis (ioredis) |
| Auth | Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`) |
| AI | NVIDIA NIM (OpenAI-compatible) via `@ai-sdk/openai` + Vercel AI SDK |

## Commands (run from repo root)

```bash
pnpm install          # install all workspace deps
pnpm dev              # turbo: runs all 3 apps concurrently
pnpm dev:web          # next dev
pnpm dev:api          # dotenv -e ../../.env -- nest start --watch
pnpm dev:workers      # dotenv -e ../../.env -- tsx watch src/index.ts
pnpm build            # turbo build

# DB (all run via --filter @repo/db)
pnpm db:generate      # drizzle-kit generate
pnpm db:migrate       # drizzle-kit migrate
pnpm db:studio        # drizzle-kit studio
pnpm db:seed          # tsx src/seed/seed.ts
```

**Required order before PR/commit:** `pnpm typecheck && pnpm lint && pnpm build` — these are the only quality gates that exist.

**`pnpm test` runs via turbo but has no tests yet.** Running it succeeds trivially. The command exists in turbo.json for future use.

## Env setup

Copy `.env.example` → `.env`. All keys: `DATABASE_URL`, `REDIS_URL`, Supabase pair, `NVIDIA_API_KEY`. The API and workers dev commands load `.env` from repo root via `dotenv -e ../../.env`.

Env validation lives in `packages/shared/src/env.ts` (Zod schema). Not currently wired into any app at startup — that's a TODO.

## Architecture notes

- **API is a thin queue bridge.** Controllers validate input (Zod from `@repo/shared`) and push jobs to BullMQ. No long-running work in request handlers.
- **BullMQ queues** (defined in NestJS modules): `scrape-map` and `ai-agent-queue`. Workers live in `apps/workers/` (separate process, not NestJS).
- **Scrape flow**: `POST /jobs/scrape` → BullMQ `scrape-map` queue → Python script (`apps/workers/src/python/maps_scraper.py`) spawned via child_process → results saved to DB → each lead triggers `ai-agent-queue`.
- **Python venv** at `apps/workers/.venv/`. Dockerfile sets it up. The worker spawns `.venv/bin/python` directly.
- **DB schema** in `packages/db/src/schema/`. Currently 6 tables: `workspaces`, `users`, `leads`, `jobs`, `ai_insights`, `market_reports`. All use `uuid().defaultRandom()` (UUID v4). Foreign keys exist between tables. Every tenant table has a `workspaceId`.
- **AI agents** (`packages/ai/src/agents/`): `extractor.ts` (fastModel), `finance.ts`, `marketing.ts`, `strategy.ts` (defaultModel). Prompts are inline, not in a separate prompts directory. Default: `meta/llama-3.1-70b-instruct`, Fast: `meta/llama-3.1-8b-instruct`.
- **Web routes** use App Router route groups: `(app)/dashboard/` exists. Landing at `/`. Map code in `src/features/map/` with a Zustand store (`store.ts`).

## Code conventions

- **Files**: kebab-case. **Components**: PascalCase file matches export. No default exports in packages; apps use them where frameworks require (Next.js pages, NestJS modules).
- **Imports**: node built-ins → external → workspace packages → relative. Not enforced by lint yet — write it that way.
- **Packages** are referenced as `workspace:*` — e.g. `@repo/db`, `@repo/shared`, `@repo/ai`, `@repo/ui`.
- **No lodash** unless already imported (currently none). No moment — use native `Intl`.
- **No `any`** — use `unknown` and narrow.
- **No `.env` files committed.** Use `.env.example`.
- Configs: root `turbo.json` sets `globalDependencies: ["**/.env.*local"]` so turbo reruns when env changes.
- Error classes: `packages/shared/src/errors.ts` exports `DomainError` base class.
- UI package: uses `class-variance-authority` + `clsx` + `tailwind-merge`. No Radix deps yet (planned shadcn/ui integration is pending).

## Deployment (SumoPod PaaS)

Single Docker container (`Dockerfile` at root) runs all 3 services via PM2 (`ecosystem.config.js`):
- **web**: `pnpm start --filter web` on port 3000
- **api**: `node apps/api/dist/main.js` on port 3001  
- **workers**: `node apps/workers/dist/index.js`
Dockerfile installs Python 3 + venv for the scraper. See `DEPLOY.md` for SumoPod-specific instructions.

## Not yet implemented (common pitfalls)

These are mentioned in CONTEXT.md or the existing AGENTS.md but do not exist yet. Do not assume they are present:

- Tests (Vitest, Playwright, Supertest — zero test files exist)
- GitHub Actions CI / `.github/` directory
- `nestjs-zod` for DTO validation
- `@nestjs/throttler` rate limiting
- `WorkspaceContext` decorator and `@Public()` decorator
- Auth guard (global or otherwise) — auth is not wired into NestJS yet
- `next-intl` i18n
- `react-hook-form`
- TanStack Query
- PostGIS geometry columns (lat/lng are plain `doublePrecision`)
- Soft-delete (`deletedAt`)
- Shared ESLint config (package is a shell)
- `packages/ai/src/prompts/` directory
- AI provider abstraction methods (`generateText`, `generateStructured`, etc.)
- UUID v7 (using v4 via `defaultRandom()`)
- RSC/CSR separation patterns — web app is too early to have established them
- Drizzle migrations directory (`packages/db/drizzle/`) — hasn't been generated yet
- `pnpm test:e2e` command runs nothing
- infra/ directory is empty (no docker-compose, no nginx configs)

## Unsorted pitfalls

- If you add a new BullMQ queue, register it both in the NestJS module (`@nestjs/bullmq`) and add a worker in `apps/workers/`.
- The Python scraper path is resolved at runtime — don't move `apps/workers/src/python/` without updating the worker.
- When importing from a workspace package, check its `exports` in `package.json`. E.g. `@repo/shared` exports `"."`, `"./env"`, `"./errors"` — import from the specific entrypoint, not deep paths.

---

Last updated: 2026-05-14.
