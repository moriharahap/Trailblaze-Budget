import app from "./app";
import { logger } from "./lib/logger";
import { syncGameData } from "./lib/gameData";
import { seedSampleData } from "./lib/seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Game data sync on startup (falls back to the cached copy), then the
  // one-time SAMPLE seed, which needs the synced character list.
  syncGameData()
    .then(() => seedSampleData())
    .catch((err) => logger.error({ err }, "Startup sync/seed failed"));
});
