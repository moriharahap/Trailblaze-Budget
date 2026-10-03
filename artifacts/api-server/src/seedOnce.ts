/**
 * One-off database bootstrap, for hosts that never run `index.ts` (e.g. the
 * Vercel serverless entry). Safe to re-run: both seeds are guarded by keys in
 * the `app_state` table, and the sync upserts.
 */
import { logger } from "./lib/logger";
import { syncGameData } from "./lib/gameData";
import { importGuideLineups, seedSampleData } from "./lib/seed";
import { pool } from "@workspace/db";

async function main(): Promise<void> {
  logger.info("Syncing game data...");
  await syncGameData();
  logger.info("Seeding sample data...");
  await seedSampleData();
  logger.info("Importing guide lineups...");
  await importGuideLineups();
  logger.info("Bootstrap complete");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error({ err }, "Bootstrap failed");
    await pool.end().catch(() => {});
    process.exit(1);
  });
