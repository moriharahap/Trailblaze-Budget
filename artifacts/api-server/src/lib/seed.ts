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
import { GUIDE_DPS, GUIDE_TEAMMATE_ROLES } from "./guideLineups.data";

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

/**
 * One-time import of the guide-sourced lineups (see guideLineups.data.ts and
 * docs/guide-lineups-sources.md). Runs once per database, tracked in
 * app_state. It only adds: missing roles are appended, existing roles are
 * kept, and a DPS that already has lineups in this database is skipped, so
 * curator edits are never overwritten.
 */
const GUIDE_KEY = "guide_lineups_v1";

function validateGuideData(known: Set<string>): string[] {
  const errors: string[] = [];
  for (const d of GUIDE_DPS) {
    if (!known.has(d.dpsId)) errors.push(`unknown DPS ${d.dpsId}`);
    if (d.lineups.length < 1 || d.lineups.length > 5)
      errors.push(`${d.dpsId}: ${d.lineups.length} lineups (must be 1-5)`);
    d.lineups.forEach((l, i) => {
      const ids = l.slots.map((s) => s.characterId);
      if (ids.length !== 3 || new Set(ids).size !== 3)
        errors.push(`${d.dpsId} #${i + 1}: needs 3 unique slots`);
      if (ids.includes(d.dpsId))
        errors.push(`${d.dpsId} #${i + 1}: DPS is in its own slots`);
      for (const id of ids)
        if (!known.has(id)) errors.push(`${d.dpsId} #${i + 1}: unknown ${id}`);
    });
  }
  for (const t of GUIDE_TEAMMATE_ROLES)
    if (!known.has(t.id)) errors.push(`unknown teammate ${t.id}`);
  return errors;
}

export async function importGuideLineups(): Promise<void> {
  const [done] = await db
    .select()
    .from(appStateTable)
    .where(eq(appStateTable.key, GUIDE_KEY));
  if (done) return;

  const chars = await db
    .select({ id: charactersTable.id })
    .from(charactersTable);
  const errors = validateGuideData(new Set(chars.map((c) => c.id)));
  if (errors.length > 0) {
    logger.error({ errors }, "Skipping guide lineup import: invalid data");
    return;
  }

  const summary = {
    dpsTagged: 0,
    teammatesTagged: 0,
    lineups: 0,
    skippedDps: [] as string[],
  };

  await db.transaction(async (tx) => {
    const metaIds = [
      ...GUIDE_DPS.map((d) => d.dpsId),
      ...GUIDE_TEAMMATE_ROLES.map((t) => t.id),
    ];
    const metaRows = await tx
      .select()
      .from(characterMetaTable)
      .where(inArray(characterMetaTable.characterId, metaIds));
    const meta = new Map(metaRows.map((m) => [m.characterId, m]));

    // Adds a role (and optionally releases) without removing anything.
    const addRole = async (
      id: string,
      role: RoleValue,
      release: "always" | "if_unreviewed",
    ): Promise<boolean> => {
      const row = meta.get(id);
      if (!row) {
        const fresh = { characterId: id, roles: [role], isReleased: true };
        await tx.insert(characterMetaTable).values(fresh);
        meta.set(id, {
          ...fresh,
          genericScore: null,
          isSample: false,
          updatedAt: new Date(),
        });
        return true;
      }
      const needsRole = !row.roles.includes(role);
      const needsRelease =
        !row.isReleased && (release === "always" || row.roles.length === 0);
      if (!needsRole && !needsRelease) return false;
      const roles = needsRole ? [...row.roles, role] : row.roles;
      const isReleased = row.isReleased || needsRelease;
      await tx
        .update(characterMetaTable)
        .set({ roles, isReleased, updatedAt: new Date() })
        .where(eq(characterMetaTable.characterId, id));
      meta.set(id, { ...row, roles, isReleased });
      return true;
    };

    // The user picked these 19 as DPS, so they are always tagged and released.
    for (const d of GUIDE_DPS) {
      if (await addRole(d.dpsId, "dps", "always")) summary.dpsTagged++;
    }
    for (const t of GUIDE_TEAMMATE_ROLES) {
      if (await addRole(t.id, t.role, "if_unreviewed"))
        summary.teammatesTagged++;
      const row = meta.get(t.id);
      if (row && !row.isReleased)
        logger.warn(
          { id: t.id },
          "Guide teammate left unreleased by a curator; its lineups stay hidden",
        );
    }

    for (const d of GUIDE_DPS) {
      const existing = await tx
        .select({ id: lineupsTable.id })
        .from(lineupsTable)
        .where(eq(lineupsTable.dpsId, d.dpsId))
        .limit(1);
      if (existing.length > 0) {
        summary.skippedDps.push(d.dpsId);
        continue;
      }
      await tx.insert(lineupsTable).values(
        d.lineups.map((l, i) => ({
          dpsId: d.dpsId,
          rank: i + 1,
          title: l.title,
          slots: l.slots,
          isSample: false,
        })),
      );
      summary.lineups += d.lineups.length;
    }

    await tx
      .insert(appStateTable)
      .values({ key: GUIDE_KEY, value: new Date().toISOString() });
  });
  logger.info(summary, "Imported guide-sourced lineups");
}
