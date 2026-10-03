import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Raw copies of the StarRailRes index files (characters.json, paths.json,
 * elements.json). Used as the fallback when a remote fetch fails.
 */
export const gameDataCacheTable = pgTable("game_data_cache", {
  fileKey: text("file_key").primaryKey(),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Processed character list derived from the cached game data. Rebuilt on
 * every sync; never holds curated data (see character_meta).
 */
export const charactersTable = pgTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rarity: integer("rarity").notNull(),
  pathName: text("path_name").notNull(),
  elementName: text("element_name").notNull(),
  elementColor: text("element_color"),
  iconPath: text("icon_path").notNull(),
  isTrailblazer: boolean("is_trailblazer").notNull().default(false),
  variantIds: text("variant_ids").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const syncLogTable = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ok: boolean("ok").notNull(),
  source: text("source"),
  error: text("error"),
  characterCount: integer("character_count").notNull().default(0),
});

export type CharacterRow = typeof charactersTable.$inferSelect;
