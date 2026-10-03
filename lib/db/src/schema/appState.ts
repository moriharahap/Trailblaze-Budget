import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Small key/value table for one-time server bookkeeping (e.g. sample seeding). */
export const appStateTable = pgTable("app_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
