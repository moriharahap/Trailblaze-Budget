import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  serial,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export type RoleValue = "dps" | "sub_dps" | "support" | "sustain";
export type SlotRoleValue = "sub_dps" | "support" | "sustain";

export interface LineupSlotValue {
  role: SlotRoleValue;
  characterId: string;
}

export interface SubstituteOptionValue {
  characterId: string;
  score: number;
  lossNote?: string | null;
  fixNote?: string | null;
}

/** Curated per-character data. A game data sync never touches this table. */
export const characterMetaTable = pgTable("character_meta", {
  characterId: text("character_id").primaryKey(),
  roles: text("roles").array().$type<RoleValue[]>().notNull().default([]),
  genericScore: integer("generic_score"),
  isReleased: boolean("is_released").notNull().default(false),
  isSample: boolean("is_sample").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const lineupsTable = pgTable(
  "lineups",
  {
    id: serial("id").primaryKey(),
    dpsId: text("dps_id").notNull(),
    rank: integer("rank").notNull(),
    title: text("title").notNull(),
    slots: jsonb("slots").$type<LineupSlotValue[]>().notNull(),
    isSample: boolean("is_sample").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("lineups_dps_rank_unique").on(t.dpsId, t.rank)],
);

export const substitutesTable = pgTable(
  "substitutes",
  {
    id: serial("id").primaryKey(),
    dpsId: text("dps_id").notNull(),
    role: text("role").$type<SlotRoleValue>().notNull(),
    options: jsonb("options").$type<SubstituteOptionValue[]>().notNull(),
    isSample: boolean("is_sample").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("substitutes_dps_role_unique").on(t.dpsId, t.role)],
);

export type CharacterMetaRow = typeof characterMetaTable.$inferSelect;
export type LineupRow = typeof lineupsTable.$inferSelect;
export type SubstituteRow = typeof substitutesTable.$inferSelect;
