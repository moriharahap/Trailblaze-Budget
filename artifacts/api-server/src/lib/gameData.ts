import { db, gameDataCacheTable, charactersTable, syncLogTable } from "@workspace/db";
import { desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { logger } from "./logger";

const INDEX_BASE =
  "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/en/";
export const ASSET_BASE =
  "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/";
const FILES = ["characters", "paths", "elements"] as const;
type FileKey = (typeof FILES)[number];

const PEARL_ID = "1503";
const NICKNAME = "{NICKNAME}";

interface RawCharacter {
  id: string;
  name: string;
  rarity: number;
  path: string;
  element: string;
  icon: string;
}
interface RawPath {
  name?: string;
  text?: string;
}
interface RawElement {
  name?: string;
  color?: string;
}
type RawFiles = {
  characters: Record<string, RawCharacter>;
  paths: Record<string, RawPath>;
  elements: Record<string, RawElement>;
};

export type CharacterInsert = typeof charactersTable.$inferInsert;

/**
 * Turn the raw StarRailRes files into display-ready character rows.
 * Internal keys (e.g. Knight, Thunder) are translated via paths/elements.
 * "{NICKNAME}" entries become "Trailblazer (<path>)", one row per path,
 * merging the male/female pair under the smallest id.
 */
export function processCharacters(raw: RawFiles): CharacterInsert[] {
  const pathName = (key: string) =>
    raw.paths[key]?.name ?? raw.paths[key]?.text ?? "Unknown path";
  const element = (key: string) => raw.elements[key];

  const rows: CharacterInsert[] = [];
  const trailblazers = new Map<string, RawCharacter[]>();

  for (const c of Object.values(raw.characters)) {
    if (c.name === NICKNAME) {
      const group = trailblazers.get(c.path) ?? [];
      group.push(c);
      trailblazers.set(c.path, group);
      continue;
    }
    rows.push({
      id: c.id,
      name: c.name,
      rarity: c.rarity,
      pathName: pathName(c.path),
      elementName: element(c.element)?.name ?? "Unknown element",
      elementColor: element(c.element)?.color ?? null,
      iconPath: c.icon,
      isTrailblazer: false,
      variantIds: [],
    });
  }

  for (const [pathKey, group] of trailblazers) {
    group.sort((a, b) => Number(a.id) - Number(b.id));
    const canonical = group[0];
    rows.push({
      id: canonical.id,
      name: `Trailblazer (${pathName(pathKey)})`,
      rarity: canonical.rarity,
      pathName: pathName(pathKey),
      elementName: element(canonical.element)?.name ?? "Unknown element",
      elementColor: element(canonical.element)?.color ?? null,
      iconPath: canonical.icon,
      isTrailblazer: true,
      variantIds: group.map((g) => g.id),
    });
  }

  return rows;
}

async function fetchRemote(): Promise<RawFiles> {
  const entries = await Promise.all(
    FILES.map(async (key) => {
      const res = await fetch(`${INDEX_BASE}${key}.json`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`${key}.json: HTTP ${res.status}`);
      const json = (await res.json()) as unknown;
      if (!json || typeof json !== "object") {
        throw new Error(`${key}.json: unexpected payload`);
      }
      return [key, json] as const;
    }),
  );
  return Object.fromEntries(entries) as RawFiles;
}

async function loadCache(): Promise<RawFiles | null> {
  const rows = await db.select().from(gameDataCacheTable);
  const byKey = new Map(rows.map((r) => [r.fileKey, r.payload]));
  if (!FILES.every((k) => byKey.has(k))) return null;
  return Object.fromEntries(FILES.map((k) => [k, byKey.get(k)])) as RawFiles;
}

async function saveCache(raw: RawFiles): Promise<void> {
  const now = new Date();
  for (const key of FILES as readonly FileKey[]) {
    await db
      .insert(gameDataCacheTable)
      .values({ fileKey: key, payload: raw[key], fetchedAt: now })
      .onConflictDoUpdate({
        target: gameDataCacheTable.fileKey,
        set: { payload: raw[key], fetchedAt: now },
      });
  }
}

/** Rebuild the processed characters table. Curated tables are never touched. */
async function rebuildCharacters(rows: CharacterInsert[]): Promise<void> {
  const ids = rows.map((r) => r.id);
  await db.transaction(async (tx) => {
    for (const row of rows) {
      await tx
        .insert(charactersTable)
        .values({ ...row, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: charactersTable.id,
          set: { ...row, updatedAt: new Date() },
        });
    }
    if (ids.length > 0) {
      await tx.delete(charactersTable).where(notInArray(charactersTable.id, ids));
    }
  });
}

let running: Promise<void> | null = null;

/** Fetch game data; on failure fall back to the cached copy. Never throws. */
export function syncGameData(): Promise<void> {
  if (running) return running;
  running = (async () => {
    let raw: RawFiles | null = null;
    let source: "remote" | "cache" | null = null;
    let error: string | null = null;

    try {
      raw = await fetchRemote();
      source = "remote";
      await saveCache(raw);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      logger.warn({ err: error }, "Game data fetch failed, using cached copy");
      raw = await loadCache();
      source = raw ? "cache" : null;
      if (!raw) error = `${error} (no cached copy available)`;
    }

    let count = 0;
    if (raw) {
      try {
        const rows = processCharacters(raw);
        await rebuildCharacters(rows);
        count = rows.length;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        source = null;
        logger.error({ err }, "Processing game data failed");
      }
    }

    await db.insert(syncLogTable).values({
      ok: source === "remote" && !error,
      source,
      error,
      characterCount: count,
    });

    const [pearl] = await db
      .select({ id: charactersTable.id })
      .from(charactersTable)
      .where(eq(charactersTable.id, PEARL_ID));
    if (!pearl) {
      logger.warn(
        "Self-check: character id 1503 (Pearl) is missing from game data",
      );
    }
    logger.info({ source, count, error }, "Game data sync finished");
  })().finally(() => {
    running = null;
  });
  return running;
}

export async function getSyncStatus() {
  const [latest] = await db
    .select()
    .from(syncLogTable)
    .orderBy(desc(syncLogTable.id))
    .limit(1);
  const [lastOk] = await db
    .select()
    .from(syncLogTable)
    .where(eq(syncLogTable.ok, true))
    .orderBy(desc(syncLogTable.id))
    .limit(1);
  const [{ cacheCount }] = await db
    .select({ cacheCount: sql<number>`count(*)::int` })
    .from(gameDataCacheTable)
    .where(inArray(gameDataCacheTable.fileKey, [...FILES]));
  const [{ characterCount }] = await db
    .select({ characterCount: sql<number>`count(*)::int` })
    .from(charactersTable);
  const [pearl] = await db
    .select({ id: charactersTable.id })
    .from(charactersTable)
    .where(eq(charactersTable.id, PEARL_ID));
  // Highest numeric ids, excluding Trailblazer variants (8xxx) so newly
  // released characters are visible.
  const highest = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.isTrailblazer, false))
    .orderBy(sql`(${charactersTable.id})::int desc`)
    .limit(10);

  return {
    lastSyncAt: lastOk?.attemptedAt ?? null,
    lastAttemptAt: latest?.attemptedAt ?? null,
    lastAttemptOk: latest?.ok ?? null,
    lastError: latest?.error ?? null,
    source: (latest?.source ?? null) as "remote" | "cache" | null,
    hasCache: cacheCount === FILES.length,
    characterCount,
    pearlPresent: !!pearl,
    highest,
  };
}
