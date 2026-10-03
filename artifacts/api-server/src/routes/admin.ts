import { Router, type IRouter } from "express";
import {
  db,
  charactersTable,
  characterMetaTable,
  lineupsTable,
  substitutesTable,
  type LineupRow,
  type SubstituteRow,
  type RoleValue,
} from "@workspace/db";
import { asc, eq, inArray } from "drizzle-orm";
import {
  ListAdminCharactersQueryParams,
  UpdateCharacterMetaParams,
  UpdateCharacterMetaBody,
  BulkUpdateCharacterMetaBody,
  ListAdminLineupsQueryParams,
  CreateLineupBody,
  UpdateLineupParams,
  UpdateLineupBody,
  DeleteLineupParams,
  ListAdminSubstitutesQueryParams,
  UpsertSubstitutePoolBody,
  DeleteSubstitutePoolParams,
} from "@workspace/api-zod";
import { syncGameData, getSyncStatus } from "../lib/gameData";
import { loadRoster, toSummary, isVisible, nameCompare } from "../lib/characters";

const router: IRouter = Router();

async function syncStatusDto() {
  const s = await getSyncStatus();
  const { highest, ...rest } = s;
  return { ...rest, highestIds: highest.map(toSummary) };
}

router.get("/admin/sync", async (_req, res): Promise<void> => {
  res.json(await syncStatusDto());
});

router.post("/admin/sync", async (_req, res): Promise<void> => {
  await syncGameData();
  res.json(await syncStatusDto());
});

router.get("/admin/characters", async (req, res): Promise<void> => {
  const query = ListAdminCharactersQueryParams.safeParse(req.query);
  const filter = query.success ? (query.data.filter ?? "all") : "all";
  const roster = await loadRoster();
  const rows = [...roster.characters.values()]
    .map((c) => {
      const m = roster.meta.get(c.id);
      return {
        character: toSummary(c),
        roles: m?.roles ?? [],
        genericScore: m?.genericScore ?? null,
        isReleased: m?.isReleased ?? false,
        hasMeta: !!m,
        isSample: m?.isSample ?? false,
        needsReview: !isVisible(m),
        isTrailblazer: c.isTrailblazer,
        _id: Number(c.id),
      };
    })
    .filter((r) => filter === "all" || r.needsReview)
    .sort((a, b) => b._id - a._id)
    .map(({ _id, ...r }) => r);
  res.json(rows);
});

router.post("/admin/characters/bulk-meta", async (req, res): Promise<void> => {
  const body = BulkUpdateCharacterMetaBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { roles, rolesMode, isReleased } = body.data;
  const ids = [...new Set(body.data.characterIds)];
  if (roles === undefined && isReleased === undefined) {
    res.status(400).json({ error: "Nothing to change: give roles and/or isReleased" });
    return;
  }
  if (roles !== undefined && rolesMode === undefined) {
    res.status(400).json({ error: "rolesMode (add or replace) is required with roles" });
    return;
  }

  const characters = await db
    .select()
    .from(charactersTable)
    .where(inArray(charactersTable.id, ids));
  if (characters.length !== ids.length) {
    const known = new Set(characters.map((c) => c.id));
    const unknown = ids.filter((id) => !known.has(id));
    res.status(400).json({ error: `Unknown character ids: ${unknown.join(", ")}` });
    return;
  }

  const existing = new Map(
    (
      await db
        .select()
        .from(characterMetaTable)
        .where(inArray(characterMetaTable.characterId, ids))
    ).map((m) => [m.characterId, m]),
  );
  const newRoles = [...new Set(roles ?? [])] as RoleValue[];

  // Generic score is deliberately left alone: it stays per-character.
  const saved = await db.transaction(async (tx) => {
    const out = [];
    for (const id of ids) {
      const prev = existing.get(id);
      const nextRoles =
        roles === undefined
          ? (prev?.roles ?? [])
          : rolesMode === "replace"
            ? newRoles
            : ([...new Set([...(prev?.roles ?? []), ...newRoles])] as RoleValue[]);
      const values = {
        roles: nextRoles,
        isReleased: isReleased ?? prev?.isReleased ?? false,
        isSample: false,
        updatedAt: new Date(),
      };
      const [meta] = await tx
        .insert(characterMetaTable)
        .values({ characterId: id, genericScore: null, ...values })
        .onConflictDoUpdate({ target: characterMetaTable.characterId, set: values })
        .returning();
      out.push(meta);
    }
    return out;
  });

  const byId = new Map(characters.map((c) => [c.id, c]));
  res.json(
    saved.map((meta) => {
      const character = byId.get(meta.characterId)!;
      return {
        character: toSummary(character),
        roles: meta.roles,
        genericScore: meta.genericScore,
        isReleased: meta.isReleased,
        hasMeta: true,
        isSample: meta.isSample,
        needsReview: !isVisible(meta),
        isTrailblazer: character.isTrailblazer,
      };
    }),
  );
});

router.put("/admin/characters/:characterId/meta", async (req, res): Promise<void> => {
  const params = UpdateCharacterMetaParams.safeParse(req.params);
  const body = UpdateCharacterMetaBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: "Invalid character id" });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const id = params.data.characterId;
  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, id));
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  const roles = [...new Set(body.data.roles)] as RoleValue[];
  const values = {
    roles,
    genericScore:
      body.data.genericScore === null || body.data.genericScore === undefined
        ? null
        : Math.round(body.data.genericScore),
    isReleased: body.data.isReleased,
    isSample: false,
    updatedAt: new Date(),
  };
  const [meta] = await db
    .insert(characterMetaTable)
    .values({ characterId: id, ...values })
    .onConflictDoUpdate({ target: characterMetaTable.characterId, set: values })
    .returning();
  res.json({
    character: toSummary(character),
    roles: meta.roles,
    genericScore: meta.genericScore,
    isReleased: meta.isReleased,
    hasMeta: true,
    isSample: meta.isSample,
    needsReview: !isVisible(meta),
    isTrailblazer: character.isTrailblazer,
  });
});

router.get("/admin/coverage", async (_req, res): Promise<void> => {
  const [roster, lineups, pools] = await Promise.all([
    loadRoster(),
    db.select().from(lineupsTable),
    db.select().from(substitutesTable),
  ]);
  const rows = [...roster.characters.values()]
    .filter((c) => roster.meta.get(c.id)?.roles.includes("dps"))
    .sort(nameCompare)
    .map((c) => ({
      character: toSummary(c),
      isReleased: roster.meta.get(c.id)!.isReleased,
      lineupCount: lineups.filter((l) => l.dpsId === c.id).length,
      poolRoles: pools.filter((p) => p.dpsId === c.id).map((p) => p.role),
    }));
  res.json(rows);
});

const lineupDto = (l: LineupRow) => ({
  id: l.id,
  dpsId: l.dpsId,
  rank: l.rank,
  title: l.title,
  isSample: l.isSample,
  slots: l.slots,
});

const poolDto = (p: SubstituteRow) => ({
  id: p.id,
  dpsId: p.dpsId,
  role: p.role,
  isSample: p.isSample,
  options: p.options,
});

async function knownIds(): Promise<Set<string>> {
  const rows = await db.select({ id: charactersTable.id }).from(charactersTable);
  return new Set(rows.map((r) => r.id));
}

type LineupBody = {
  dpsId: string;
  rank: number;
  title: string;
  slots: { role: "sub_dps" | "support" | "sustain"; characterId: string }[];
};

async function validateLineup(data: LineupBody): Promise<string | null> {
  const ids = await knownIds();
  if (!ids.has(data.dpsId)) return "Unknown DPS character";
  if (data.slots.length !== 3) return "A lineup needs exactly 3 slots";
  const seen = new Set<string>([data.dpsId]);
  for (const s of data.slots) {
    if (!ids.has(s.characterId)) return `Unknown character ${s.characterId}`;
    if (seen.has(s.characterId)) return "Each character can appear only once in a team";
    seen.add(s.characterId);
  }
  if (!Number.isInteger(data.rank) || data.rank < 1 || data.rank > 5) {
    return "Rank must be 1-5";
  }
  if (!data.title.trim()) return "Title is required";
  return null;
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

router.get("/admin/lineups", async (req, res): Promise<void> => {
  const query = ListAdminLineupsQueryParams.safeParse(req.query);
  const dpsId = query.success ? query.data.dpsId : undefined;
  const rows = await db
    .select()
    .from(lineupsTable)
    .where(dpsId ? eq(lineupsTable.dpsId, dpsId) : undefined)
    .orderBy(asc(lineupsTable.dpsId), asc(lineupsTable.rank));
  res.json(rows.map(lineupDto));
});

router.post("/admin/lineups", async (req, res): Promise<void> => {
  const body = CreateLineupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const error = await validateLineup(body.data);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  try {
    const [row] = await db
      .insert(lineupsTable)
      .values({ ...body.data, title: body.data.title.trim(), isSample: false })
      .returning();
    res.status(201).json(lineupDto(row));
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(400).json({ error: `Rank ${body.data.rank} is already used for this DPS` });
      return;
    }
    throw err;
  }
});

router.put("/admin/lineups/:lineupId", async (req, res): Promise<void> => {
  const params = UpdateLineupParams.safeParse(req.params);
  const body = UpdateLineupBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lineup id" });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const error = await validateLineup(body.data);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  try {
    const [row] = await db
      .update(lineupsTable)
      .set({
        ...body.data,
        title: body.data.title.trim(),
        isSample: false,
        updatedAt: new Date(),
      })
      .where(eq(lineupsTable.id, params.data.lineupId))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Lineup not found" });
      return;
    }
    res.json(lineupDto(row));
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(400).json({ error: `Rank ${body.data.rank} is already used for this DPS` });
      return;
    }
    throw err;
  }
});

router.delete("/admin/lineups/:lineupId", async (req, res): Promise<void> => {
  const params = DeleteLineupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lineup id" });
    return;
  }
  await db.delete(lineupsTable).where(eq(lineupsTable.id, params.data.lineupId));
  res.status(204).end();
});

router.get("/admin/substitutes", async (req, res): Promise<void> => {
  const query = ListAdminSubstitutesQueryParams.safeParse(req.query);
  const dpsId = query.success ? query.data.dpsId : undefined;
  const rows = await db
    .select()
    .from(substitutesTable)
    .where(dpsId ? eq(substitutesTable.dpsId, dpsId) : undefined)
    .orderBy(asc(substitutesTable.dpsId), asc(substitutesTable.role));
  res.json(rows.map(poolDto));
});

router.put("/admin/substitutes", async (req, res): Promise<void> => {
  const body = UpsertSubstitutePoolBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { dpsId, role, options } = body.data;
  const ids = await knownIds();
  if (!ids.has(dpsId)) {
    res.status(400).json({ error: "Unknown DPS character" });
    return;
  }
  const seen = new Set<string>();
  for (const o of options) {
    if (!ids.has(o.characterId)) {
      res.status(400).json({ error: `Unknown character ${o.characterId}` });
      return;
    }
    if (o.characterId === dpsId) {
      res.status(400).json({ error: "The DPS cannot be its own substitute" });
      return;
    }
    if (seen.has(o.characterId)) {
      res.status(400).json({ error: "Each character can appear only once in a pool" });
      return;
    }
    seen.add(o.characterId);
  }
  const clean = options.map((o) => ({
    characterId: o.characterId,
    score: o.score,
    lossNote: o.lossNote?.trim() || null,
    fixNote: o.fixNote?.trim() || null,
  }));
  const [row] = await db
    .insert(substitutesTable)
    .values({ dpsId, role, options: clean, isSample: false })
    .onConflictDoUpdate({
      target: [substitutesTable.dpsId, substitutesTable.role],
      set: { options: clean, isSample: false, updatedAt: new Date() },
    })
    .returning();
  res.json(poolDto(row));
});

router.delete("/admin/substitutes/:poolId", async (req, res): Promise<void> => {
  const params = DeleteSubstitutePoolParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid pool id" });
    return;
  }
  await db.delete(substitutesTable).where(eq(substitutesTable.id, params.data.poolId));
  res.status(204).end();
});

export default router;
