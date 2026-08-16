# AGENTS.md

Compact, repo-specific guidance for working in this codebase (workhub: Next.js project-management app).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript, tRPC v11 for the API.
- Drizzle ORM over PostgreSQL (driver `pg`), MinIO (S3-compatible) for files, Redis for realtime.
- Multi-tenant: data is isolated per `organizationId` (see schema under `src/server/db/schema`).

## Local dev
- Start infra with `make dev-up` (wraps `docker compose -f docker-compose.local.yml up -d db minio minio-setup redis web`). `make dev-down` stops it.
- Services: Postgres (`workhub-postgres`), MinIO (`workhub-minio`, console http://localhost:9001, creds `local-minio`/`local-minio-secret`), Redis, and the `web` container running `npm run dev` on :3000.
- `make db-shell` / `make dev-logs` are the usual observability shortcuts.
- Docker `db` maps host port `5432` by default. If the host already runs PostgreSQL on 5432 the container fails to start ("address already in use"); change the host side of the port mapping in `docker-compose.local.yml` (e.g. `5434:5432`) and update `DATABASE_URL` in `.env.local` to match.

## Database / schema
- Schema lives in `src/server/db/schema/*.ts`; SQL is generated under `drizzle/`.
- Apply schema with `npm run db:push` (drizzle push). There are **no migrations** in this repo — do not use `db:migrate` for routine changes.
- **Gotcha:** `drizzle-kit` does not auto-load `.env.local` (Next.js loads it, but drizzle-kit only auto-loads `.env`). `npm run db:push` therefore fails with `url required` unless `DATABASE_URL` is exported or a `.env` exists. Reliable invocation:
  `DATABASE_URL=postgres://postgres:postgres@localhost:5434/workhub npx drizzle-kit push --force`
  (`--force` skips the interactive confirm prompt so it runs non-interactively.)
- Runtime env is validated by a zod schema at `src/lib/utils/env.ts`; missing required vars (`DATABASE_URL`, `NEXT_AUTH_SECRET`) crash startup.

## Tests
- Unit/integration: `npm run test` (vitest). Config in `vitest.config.ts` runs specs **serially** (`maxConcurrency: 1`) because they share the real Postgres at `DATABASE_URL` — do not raise concurrency. Tests need the DB container running.
- `tests/setup.ts` loads `.env.local`, mocks `next-auth`/`next/cache`/`next/navigation`, and deletes `REDIS_URL` so unit tests don't touch Redis.
- Single spec: `npx vitest run tests/path.test.ts` (or `npm run test:watch` for watch mode).
- E2E: `npm run test:e2e` (Playwright). Specs in `tests/e2e`; a `setup` project seeds state and `chromium`/`firefox`/`webkit` depend on it. Playwright auto-starts `npm run dev` (reuses an existing server locally). Some e2e are known-flaky/incomplete (README TODO) — don't treat all failures as regressions.

## Lint / build
- `npm run lint` runs `eslint . --max-warnings=0` — it **fails on warnings**, not just errors.
- `npm run build` requires `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` set, or the build fails during page data collection.

## Architecture (where things live)
- `src/domain/*` — business rules (projects, clients, files).
- `src/server/*` — `actions` (server actions), `application`, `queries`, `db` (repositories + schema), `trpc` (routers/context), `auth`, `realtime`, `storage`.
- `src/lib/*` — `trpc` client, `react-query`, `realtime` client hook (`useRealtimeSync`), `validation` (zod), `logging`, `utils`.
- `src/ui/components/*` — presentational components grouped by feature.
- API surface: tRPC routers under `src/server/trpc/routers` plus Next route handlers under `src/app/api`.
- Realtime sync is Redis-backed: `src/server/realtime/*` (events, rate-limit, redis-client) and `src/lib/realtime/useRealtimeSync.ts`.
