# Trailblaze Budget

Honkai: Star Rail lineup builder for F2P players: pick a DPS, see curated meta lineups, and get them rebuilt around the characters you actually own.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run test` — lineup engine unit tests (vitest)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- API contract: `lib/api-spec/openapi.yaml`; DB schema: `lib/db/src/schema/` (gameData = synced, curated = admin-owned, ownership = per anonId)
- Game data sync: `artifacts/api-server/src/lib/gameData.ts`; SAMPLE seed: `lib/seed.ts`
- Lineup engine (pure): `artifacts/api-server/src/lib/lineupEngine.ts` + `.test.ts`
- Frontend: `artifacts/trailblaze-budget/src/pages/` (pick, lineups, admin) and `components/substitute-sheet.tsx`

## Architecture decisions

- Sync never writes curated tables (character_meta, lineups, substitutes). A character without a character_meta row has no roles and is unreleased, so it is hidden from players.
- Trailblazer {NICKNAME} pairs are merged into one row per path, keyed by the smallest id of the pair.
- Lineups whose meta picks include a hidden character are skipped for players.
- The SAMPLE seed runs once, tracked by the `sample_seed_v1` key in app_state. Rows deleted in /admin stay deleted. Editing a sample row in /admin clears its is_sample flag.
- The explainer uses Replit AI Integrations (OpenAI), not an LLM_API_KEY secret.

## Product

- Pick DPS → ranked lineup cards → Have / Don't have → substitute sheet → re-ranked lineups with loss/fix notes → optional AI explanation.
- /admin (no auth): sync status, needs-review characters (with multi-select bulk role / released tagging; generic score is never bulk-edited), coverage, lineup + substitute editors.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Orval emits both a Zod `GetLineupsParams` (path) and a TS `GetLineupsParams` (query); `lib/api-zod/src/index.ts` re-exports the Zod one explicitly to resolve the clash. Do the same for any new op with both path and query params.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
