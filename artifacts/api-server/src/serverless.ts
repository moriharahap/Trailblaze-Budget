/**
 * Serverless entry point (Vercel).
 *
 * Unlike `index.ts`, this binds no port: the platform invokes the exported
 * Express app directly as the request handler. It also deliberately does NOT
 * run the startup sync/seed chain, because that would re-run on every cold
 * start. Those are one-off, idempotent operations:
 *
 *   - `syncGameData()`    -> re-runnable in production via POST /api/admin/sync
 *   - `seedSampleData()`  -> run once against the target database
 *   - `importGuideLineups()` -> run once against the target database
 *
 * Run the seed pair once per database with `pnpm run seed` from
 * artifacts/api-server before the first deploy.
 */
import app from "./app";

export default app;
