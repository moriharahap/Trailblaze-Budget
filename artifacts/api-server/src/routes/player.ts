import { Router, type IRouter } from "express";
import {
  db,
  lineupsTable,
  substitutesTable,
  userOwnershipTable,
  type OwnershipStatusValue,
  type SlotRoleValue,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import {
  GetLineupsParams,
  GetLineupsQueryParams,
  GetSubstitutesParams,
  GetSubstitutesQueryParams,
  GetOwnershipParams,
  UpdateOwnershipParams,
  UpdateOwnershipBody,
  ExplainLineupBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { loadRoster, toSummary, nameCompare } from "../lib/characters";
import { resolveLineups, type EngineSlotRole } from "../lib/lineupEngine";

const router: IRouter = Router();

const ANON_ID = /^[A-Za-z0-9_-]{8,100}$/;

async function loadOwnership(
  anonId: string | undefined,
): Promise<Record<string, OwnershipStatusValue>> {
  if (!anonId) return {};
  const rows = await db
    .select()
    .from(userOwnershipTable)
    .where(eq(userOwnershipTable.anonId, anonId));
  return Object.fromEntries(rows.map((r) => [r.characterId, r.status]));
}

router.get("/dps", async (_req, res): Promise<void> => {
  const roster = await loadRoster();
  const counts = await db
    .select({
      dpsId: lineupsTable.dpsId,
      count: sql<number>`count(*)::int`,
      anySample: sql<boolean>`bool_or(${lineupsTable.isSample})`,
    })
    .from(lineupsTable)
    .groupBy(lineupsTable.dpsId);

  const byDps = new Map(counts.map((c) => [c.dpsId, c]));

  // Every visible character with the dps role, with or without lineups.
  const result = [...roster.visible.values()]
    .filter((row) => roster.meta.get(row.id)!.roles.includes("dps"))
    .sort(nameCompare)
    .map((row) => ({
      character: toSummary(row),
      lineupCount: byDps.get(row.id)?.count ?? 0,
      isSample: byDps.get(row.id)?.anySample ?? false,
    }));
  res.json(result);
});

router.get("/lineups/:dpsId", async (req, res): Promise<void> => {
  const params = GetLineupsParams.safeParse(req.params);
  const query = GetLineupsQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(400).json({ error: "dpsId and anonId are required" });
    return;
  }
  const { dpsId } = params.data;
  const { anonId } = query.data;
  if (!ANON_ID.test(anonId)) {
    res.status(400).json({ error: "Invalid anonId" });
    return;
  }

  const roster = await loadRoster();
  const dpsRow = roster.visible.get(dpsId);
  if (!dpsRow || !roster.meta.get(dpsId)!.roles.includes("dps")) {
    res.status(404).json({ error: "DPS not found" });
    return;
  }

  const [lineups, pools, ownership] = await Promise.all([
    db.select().from(lineupsTable).where(eq(lineupsTable.dpsId, dpsId)),
    db.select().from(substitutesTable).where(eq(substitutesTable.dpsId, dpsId)),
    loadOwnership(anonId),
  ]);

  // Hidden characters (unreleased / no roles) never reach players, so skip
  // lineups whose meta picks include one.
  const usable = lineups.filter((l) => {
    const ok = l.slots.every((s) => roster.visible.has(s.characterId));
    if (!ok) {
      req.log.warn({ lineupId: l.id }, "Lineup skipped: hidden meta pick");
    }
    return ok;
  });

  const substitutes: Partial<Record<EngineSlotRole, typeof pools[number]["options"]>> = {};
  for (const p of pools) substitutes[p.role] = p.options;

  const resolved = resolveLineups({
    dpsId,
    lineups: usable.map((l) => ({
      id: l.id,
      rank: l.rank,
      title: l.title,
      isSample: l.isSample,
      slots: l.slots,
    })),
    substitutes,
    ownership,
    characters: roster.engineCharacters,
  });

  const summary = (id: string) => toSummary(roster.characters.get(id)!);
  const dps = toSummary(dpsRow);
  res.json({
    dps,
    lineups: resolved.map((l) => ({
      lineupId: l.lineupId,
      originalRank: l.originalRank,
      title: l.title,
      isSample: l.isSample,
      completeness: l.completeness,
      dps,
      slots: l.slots.map((s) => ({
        role: s.role,
        metaPick: summary(s.metaPickId),
        metaOwnership: s.metaOwnership,
        finalPick: s.finalPickId ? summary(s.finalPickId) : null,
        status: s.status,
        score: s.score,
        lossNote: s.lossNote,
        fixNote: s.fixNote,
      })),
    })),
  });
});

router.get("/substitutes/:dpsId/:role", async (req, res): Promise<void> => {
  const params = GetSubstitutesParams.safeParse(req.params);
  const query = GetSubstitutesQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(400).json({ error: "Invalid dpsId or role" });
    return;
  }
  const { dpsId, role } = params.data;
  const anonId = query.data.anonId;
  if (anonId !== undefined && !ANON_ID.test(anonId)) {
    res.status(400).json({ error: "Invalid anonId" });
    return;
  }

  const [roster, [pool], ownership] = await Promise.all([
    loadRoster(),
    db
      .select()
      .from(substitutesTable)
      .where(
        and(
          eq(substitutesTable.dpsId, dpsId),
          eq(substitutesTable.role, role as SlotRoleValue),
        ),
      ),
    loadOwnership(anonId),
  ]);

  const own = (id: string) => ownership[id] ?? "unknown";
  const options = [...(pool?.options ?? [])]
    .filter((o) => roster.visible.has(o.characterId) && o.characterId !== dpsId)
    .sort((a, b) => b.score - a.score);
  const inPool = new Set(options.map((o) => o.characterId));

  const poolOut = options.map((o) => ({
    character: toSummary(roster.visible.get(o.characterId)!),
    score: o.score,
    genericScore: roster.meta.get(o.characterId)?.genericScore ?? null,
    lossNote: o.lossNote ?? null,
    fixNote: o.fixNote ?? null,
    ownership: own(o.characterId),
  }));

  const others = [...roster.visible.values()]
    .filter(
      (c) =>
        c.id !== dpsId &&
        !inPool.has(c.id) &&
        roster.meta.get(c.id)!.roles.includes(role),
    )
    .sort(
      (a, b) =>
        (roster.meta.get(b.id)!.genericScore ?? -1) -
          (roster.meta.get(a.id)!.genericScore ?? -1) || nameCompare(a, b),
    )
    .map((c) => ({
      character: toSummary(c),
      score: null,
      genericScore: roster.meta.get(c.id)!.genericScore,
      lossNote: null,
      fixNote: null,
      ownership: own(c.id),
    }));

  res.json({ role, pool: poolOut, others });
});

router.get("/ownership/:anonId", async (req, res): Promise<void> => {
  const params = GetOwnershipParams.safeParse(req.params);
  if (!params.success || !ANON_ID.test(params.data.anonId)) {
    res.status(400).json({ error: "Invalid anonId" });
    return;
  }
  res.json(await loadOwnership(params.data.anonId));
});

router.put("/ownership/:anonId", async (req, res): Promise<void> => {
  const params = UpdateOwnershipParams.safeParse(req.params);
  const body = UpdateOwnershipBody.safeParse(req.body);
  if (!params.success || !ANON_ID.test(params.data.anonId)) {
    res.status(400).json({ error: "Invalid anonId" });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const anonId = params.data.anonId;
  const entries = Object.entries(body.data).filter(
    ([id, status]) =>
      id.length > 0 &&
      id.length <= 20 &&
      (status === "owned" || status === "not_owned"),
  ) as [string, OwnershipStatusValue][];
  if (entries.length > 500) {
    res.status(400).json({ error: "Too many entries" });
    return;
  }

  if (entries.length > 0) {
    await db
      .insert(userOwnershipTable)
      .values(
        entries.map(([characterId, status]) => ({
          anonId,
          characterId,
          status,
        })),
      )
      .onConflictDoUpdate({
        target: [userOwnershipTable.anonId, userOwnershipTable.characterId],
        set: { status: sql`excluded.status`, updatedAt: new Date() },
      });
  }
  res.json(await loadOwnership(anonId));
});

const EXPLAIN_SYSTEM_PROMPT = `You explain Honkai: Star Rail team lineups for free-to-play players.
Use ONLY the JSON provided by the user. Never add characters, abilities, mechanics, numbers, relics, light cones, or facts that are not in the input JSON. If the JSON does not contain enough information for a point, say so briefly instead of guessing.
Write a short explanation (at most ~150 words, plain text, no markdown headings) covering:
1. Why this team works, based only on the roles and notes in the JSON.
2. What is lost versus the meta version (meta pick vs final pick per slot, using lossNote).
3. How to play around it (using fixNote).
Slot statuses: owned/unconfirmed = meta pick kept; substituted = curated replacement; weak = best owned character of that role with no curated note; needs_input = empty slot.`;

router.post("/explain", async (req, res): Promise<void> => {
  const body = ExplainLineupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const l = body.data.lineup;
  const compact = {
    title: l.title,
    completeness: l.completeness,
    dps: { name: l.dps.name, path: l.dps.path, element: l.dps.element },
    slots: l.slots.map((s) => ({
      role: s.role,
      metaPick: s.metaPick.name,
      finalPick: s.finalPick?.name ?? null,
      status: s.status,
      score: s.score,
      lossNote: s.lossNote ?? null,
      fixNote: s.fixNote ?? null,
    })),
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.6-terra",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(compact) },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response");
    res.json({ explanation: text });
  } catch (err) {
    req.log.error({ err }, "Explain call failed");
    res.status(502).json({ error: "Explanation unavailable right now" });
  }
});

export default router;
