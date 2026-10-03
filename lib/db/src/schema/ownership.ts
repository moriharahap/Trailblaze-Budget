import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export type OwnershipStatusValue = "owned" | "not_owned";

/** Per anonymous user: character id -> owned / not_owned. Missing = unknown. */
export const userOwnershipTable = pgTable(
  "user_ownership",
  {
    anonId: text("anon_id").notNull(),
    characterId: text("character_id").notNull(),
    status: text("status").$type<OwnershipStatusValue>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.anonId, t.characterId] })],
);
