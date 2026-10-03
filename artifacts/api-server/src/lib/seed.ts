import {
  db,
  appStateTable,
  charactersTable,
  characterMetaTable,
  lineupsTable,
  substitutesTable,
  type RoleValue,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

/**
 * One-time SAMPLE data for a single DPS so the app is usable before real
 * curated data is entered in /admin. Everything is flagged is_sample and
 * labelled "SAMPLE". Runs once (tracked in app_state); deleting the sample
 * rows in /admin will not bring them back.
 */
const SEED_KEY = "sample_seed_v1";
const NOTE = "SAMPLE — replace in /admin";
const DPS = "1102"; // Seele

const SAMPLE_META: { id: string; roles: RoleValue[] }[] = [
  { id: "1102", roles: ["dps"] }, // Seele
  { id: "1006", roles: ["sub_dps"] }, // Silver Wolf
  { id: "1101", roles: ["support"] }, // Bronya
  { id: "1208", roles: ["sustain"] }, // Fu Xuan
  { id: "1106", roles: ["sub_dps"] }, // Pela
  { id: "1202", roles: ["support"] }, // Tingyun
  { id: "1105", roles: ["sustain"] }, // Natasha
  { id: "1009", roles: ["sub_dps", "support"] }, // Asta
  { id: "1211", roles: ["sustain"] }, // Bailu
  { id: "1001", roles: ["sustain"] }, // March 7th
];

export async function seedSampleData(): Promise<void> {
  const [done] = await db
    .select()
    .from(appStateTable)
    .where(eq(appStateTable.key, SEED_KEY));
  if (done) return;

  const ids = SAMPLE_META.map((m) => m.id);
  const present = await db
    .select({ id: charactersTable.id })
    .from(charactersTable)
    .where(inArray(charactersTable.id, ids));
  if (present.length !== ids.length) {
    const have = new Set(present.map((p) => p.id));
    logger.warn(
      { missing: ids.filter((id) => !have.has(id)) },
      "Skipping SAMPLE seed: characters missing from game data",
    );
    return;
  }

  await db.transaction(async (tx) => {
    for (const m of SAMPLE_META) {
      await tx
        .insert(characterMetaTable)
        .values({
          characterId: m.id,
          roles: m.roles,
          genericScore: null,
          isReleased: true,
          isSample: true,
        })
        .onConflictDoNothing();
    }

    await tx
      .insert(lineupsTable)
      .values([
        {
          dpsId: DPS,
          rank: 1,
          title: "SAMPLE lineup A",
          isSample: true,
          slots: [
            { role: "sub_dps", characterId: "1006" },
            { role: "support", characterId: "1101" },
            { role: "sustain", characterId: "1208" },
          ],
        },
        {
          dpsId: DPS,
          rank: 2,
          title: "SAMPLE lineup B",
          isSample: true,
          slots: [
            { role: "sub_dps", characterId: "1106" },
            { role: "support", characterId: "1202" },
            { role: "sustain", characterId: "1105" },
          ],
        },
      ])
      .onConflictDoNothing();

    const opt = (characterId: string, score: number) => ({
      characterId,
      score,
      lossNote: NOTE,
      fixNote: NOTE,
    });
    await tx
      .insert(substitutesTable)
      .values([
        {
          dpsId: DPS,
          role: "sub_dps",
          isSample: true,
          options: [opt("1106", 70), opt("1009", 50)],
        },
        {
          dpsId: DPS,
          role: "support",
          isSample: true,
          options: [opt("1202", 75), opt("1009", 60)],
        },
        {
          dpsId: DPS,
          role: "sustain",
          isSample: true,
          options: [opt("1211", 80), opt("1105", 70), opt("1001", 60)],
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(appStateTable)
      .values({ key: SEED_KEY, value: new Date().toISOString() });
  });
  logger.info("Seeded SAMPLE data for one DPS");
}
