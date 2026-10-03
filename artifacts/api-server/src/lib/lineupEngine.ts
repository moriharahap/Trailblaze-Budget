/**
 * Lineup engine: resolves curated meta lineups against a player's ownership.
 * Pure function — no I/O, no LLM. See lineupEngine.test.ts.
 */

export type EngineRole = "dps" | "sub_dps" | "support" | "sustain";
export type EngineSlotRole = "sub_dps" | "support" | "sustain";
export type EngineOwnership = "owned" | "not_owned";
export type EngineOwnershipState = EngineOwnership | "unknown";
export type EngineSlotStatus =
  | "owned"
  | "unconfirmed"
  | "substituted"
  | "weak"
  | "needs_input";

export interface EngineCharacter {
  id: string;
  roles: EngineRole[];
  genericScore: number | null;
}

export interface EngineLineup {
  id: number;
  rank: number;
  title: string;
  isSample: boolean;
  slots: { role: EngineSlotRole; characterId: string }[];
}

export interface EngineSubstituteOption {
  characterId: string;
  score: number;
  lossNote?: string | null;
  fixNote?: string | null;
}

export interface EngineInput {
  dpsId: string;
  lineups: EngineLineup[];
  substitutes: Partial<Record<EngineSlotRole, EngineSubstituteOption[]>>;
  ownership: Record<string, EngineOwnership>;
  /**
   * Characters visible to players (released and with at least one role).
   * Substitutes and fallbacks are only chosen from this list.
   */
  characters: EngineCharacter[];
}

export interface ResolvedEngineSlot {
  role: EngineSlotRole;
  metaPickId: string;
  metaOwnership: EngineOwnershipState;
  finalPickId: string | null;
  status: EngineSlotStatus;
  score: number;
  lossNote: string | null;
  fixNote: string | null;
}

export interface ResolvedEngineLineup {
  lineupId: number;
  originalRank: number;
  title: string;
  isSample: boolean;
  completeness: number;
  slots: ResolvedEngineSlot[];
}

function ownershipOf(
  id: string,
  input: EngineInput,
): EngineOwnershipState {
  if (id === input.dpsId) return "owned";
  return input.ownership[id] ?? "unknown";
}

function resolveLineup(
  lineup: EngineLineup,
  input: EngineInput,
  visible: Map<string, EngineCharacter>,
): ResolvedEngineLineup {
  // Pass 1: every meta pick that stays (owned or unknown) is locked into the
  // team first, so a substitute can never duplicate a later kept slot.
  const team = new Set<string>([input.dpsId]);
  for (const slot of lineup.slots) {
    if (ownershipOf(slot.characterId, input) !== "not_owned") {
      team.add(slot.characterId);
    }
  }

  const isOwned = (id: string) => ownershipOf(id, input) === "owned";

  // Pass 2: resolve each slot in order.
  const slots: ResolvedEngineSlot[] = lineup.slots.map((slot) => {
    const metaOwnership = ownershipOf(slot.characterId, input);
    const base = {
      role: slot.role,
      metaPickId: slot.characterId,
      metaOwnership,
    };

    if (metaOwnership !== "not_owned") {
      return {
        ...base,
        finalPickId: slot.characterId,
        status: metaOwnership === "owned" ? "owned" : "unconfirmed",
        score: 100,
        lossNote: null,
        fixNote: null,
      };
    }

    // Curated substitute pool, best score first.
    const pool = [...(input.substitutes[slot.role] ?? [])].sort(
      (a, b) => b.score - a.score,
    );
    const option = pool.find(
      (o) =>
        visible.has(o.characterId) &&
        isOwned(o.characterId) &&
        !team.has(o.characterId),
    );
    if (option) {
      team.add(option.characterId);
      return {
        ...base,
        finalPickId: option.characterId,
        status: "substituted",
        score: option.score,
        lossNote: option.lossNote ?? null,
        fixNote: option.fixNote ?? null,
      };
    }

    // Weak fallback: best owned character with this role by generic score.
    let fallback: EngineCharacter | null = null;
    for (const c of visible.values()) {
      if (!c.roles.includes(slot.role)) continue;
      if (!isOwned(c.id) || team.has(c.id)) continue;
      const score = c.genericScore ?? 0;
      const best = fallback?.genericScore ?? 0;
      if (
        !fallback ||
        score > best ||
        (score === best && c.id < fallback.id)
      ) {
        fallback = c;
      }
    }
    if (fallback) {
      team.add(fallback.id);
      return {
        ...base,
        finalPickId: fallback.id,
        status: "weak",
        score: (fallback.genericScore ?? 0) / 2,
        lossNote: null,
        fixNote: null,
      };
    }

    return {
      ...base,
      finalPickId: null,
      status: "needs_input",
      score: 0,
      lossNote: null,
      fixNote: null,
    };
  });

  const completeness =
    slots.length === 0
      ? 0
      : Math.round(
          (slots.reduce((sum, s) => sum + s.score, 0) / slots.length) * 10,
        ) / 10;

  return {
    lineupId: lineup.id,
    originalRank: lineup.rank,
    title: lineup.title,
    isSample: lineup.isSample,
    completeness,
    slots,
  };
}

function teamKey(lineup: ResolvedEngineLineup): string {
  return lineup.slots
    .map((s) => s.finalPickId ?? `needs_input:${s.role}`)
    .sort()
    .join("|");
}

function compare(a: ResolvedEngineLineup, b: ResolvedEngineLineup): number {
  return b.completeness - a.completeness || a.originalRank - b.originalRank;
}

export function resolveLineups(input: EngineInput): ResolvedEngineLineup[] {
  const visible = new Map(input.characters.map((c) => [c.id, c]));
  const resolved = [...input.lineups]
    .sort((a, b) => a.rank - b.rank)
    .map((l) => resolveLineup(l, input, visible))
    .sort(compare);

  // Drop lineups that resolved to the same final team, keeping the best one
  // (already first after sorting).
  const seen = new Set<string>();
  return resolved.filter((l) => {
    const key = teamKey(l);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
