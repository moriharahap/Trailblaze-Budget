import { describe, expect, it } from "vitest";
import {
  resolveLineups,
  type EngineCharacter,
  type EngineInput,
} from "./lineupEngine";

const chars: EngineCharacter[] = [
  { id: "dps", roles: ["dps"], genericScore: 80 },
  { id: "sub1", roles: ["sub_dps"], genericScore: 85 },
  { id: "sub2", roles: ["sub_dps"], genericScore: 60 },
  { id: "sub3", roles: ["sub_dps"], genericScore: 40 },
  { id: "sup1", roles: ["support"], genericScore: 90 },
  { id: "sup2", roles: ["support", "sub_dps"], genericScore: 70 },
  { id: "sus1", roles: ["sustain"], genericScore: 90 },
  { id: "sus2", roles: ["sustain"], genericScore: 60 },
  { id: "sus3", roles: ["sustain"], genericScore: 50 },
];

function base(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    dpsId: "dps",
    characters: chars,
    ownership: {},
    lineups: [
      {
        id: 1,
        rank: 1,
        title: "Meta",
        isSample: false,
        slots: [
          { role: "sub_dps", characterId: "sub1" },
          { role: "support", characterId: "sup1" },
          { role: "sustain", characterId: "sus1" },
        ],
      },
    ],
    substitutes: {
      sub_dps: [
        { characterId: "sub2", score: 70, lossNote: "less dmg", fixNote: "build atk" },
        { characterId: "sup2", score: 50 },
      ],
      support: [{ characterId: "sup2", score: 75, lossNote: "l", fixNote: "f" }],
      sustain: [{ characterId: "sus2", score: 65, lossNote: "l2", fixNote: "f2" }],
    },
    ...overrides,
  };
}

describe("resolveLineups", () => {
  it("keeps owned and unknown picks, marking unknown as unconfirmed", () => {
    const [l] = resolveLineups(base({ ownership: { sub1: "owned" } }));
    expect(l.slots.map((s) => s.status)).toEqual([
      "owned",
      "unconfirmed",
      "unconfirmed",
    ]);
    expect(l.slots.every((s) => s.score === 100)).toBe(true);
    expect(l.completeness).toBe(100);
  });

  it("substitutes a not-owned pick with the highest-score owned pool option", () => {
    const [l] = resolveLineups(
      base({ ownership: { sub1: "not_owned", sub2: "owned", sup2: "owned" } }),
    );
    const s = l.slots[0];
    expect(s.status).toBe("substituted");
    expect(s.finalPickId).toBe("sub2");
    expect(s.metaPickId).toBe("sub1");
    expect(s.score).toBe(70);
    expect(s.lossNote).toBe("less dmg");
    expect(s.fixNote).toBe("build atk");
    expect(l.completeness).toBe(90);
  });

  it("ignores unknown pool options (only owned ones are used)", () => {
    const [l] = resolveLineups(
      base({ ownership: { sus1: "not_owned", sus3: "owned" } }),
    );
    // sus2 is in the pool but unknown -> not used; falls back to sus3 as weak
    expect(l.slots[2].status).toBe("weak");
    expect(l.slots[2].finalPickId).toBe("sus3");
  });

  it("never picks a substitute already in the team", () => {
    // sup2 is the kept support meta pick; sub_dps pool must skip it
    const input = base({
      ownership: { sub1: "not_owned", sup2: "owned", sub2: "not_owned" },
    });
    input.lineups[0].slots[1] = { role: "support", characterId: "sup2" };
    const [l] = resolveLineups(input);
    expect(l.slots[0].finalPickId).not.toBe("sup2");
    expect(l.slots[0].status).toBe("needs_input");
  });

  it("falls back to best owned role character by generic score, flagged weak", () => {
    const [l] = resolveLineups(
      base({
        ownership: { sub1: "not_owned", sub2: "not_owned", sup2: "not_owned", sub3: "owned" },
      }),
    );
    const s = l.slots[0];
    expect(s.status).toBe("weak");
    expect(s.finalPickId).toBe("sub3");
    expect(s.score).toBe(20); // generic 40 / 2
    expect(s.lossNote).toBeNull();
  });

  it("leaves the slot as needs_input when nothing of that role is owned", () => {
    const [l] = resolveLineups(base({ ownership: { sus1: "not_owned" } }));
    const s = l.slots[2];
    expect(s.status).toBe("needs_input");
    expect(s.finalPickId).toBeNull();
    expect(s.score).toBe(0);
    expect(l.completeness).toBeCloseTo(66.7, 1);
  });

  it("only uses visible characters (unreleased / no roles never appear)", () => {
    const [l] = resolveLineups(
      base({
        characters: chars.filter((c) => c.id !== "sub2"),
        ownership: { sub1: "not_owned", sub2: "owned" },
      }),
    );
    expect(l.slots[0].finalPickId).not.toBe("sub2");
  });

  it("treats the DPS as owned and never uses it as a substitute", () => {
    const input = base({ ownership: { sub1: "not_owned" } });
    input.substitutes.sub_dps = [{ characterId: "dps", score: 99 }];
    const [l] = resolveLineups(input);
    expect(l.slots[0].finalPickId).not.toBe("dps");
  });

  it("removes lineups that became identical and sorts by completeness", () => {
    const input = base({
      ownership: {
        sub1: "not_owned",
        sub2: "owned",
        sup1: "owned",
        sus1: "owned",
      },
    });
    input.lineups.push(
      {
        id: 2,
        rank: 2,
        title: "Alt with sub2",
        isSample: false,
        slots: [
          { role: "sub_dps", characterId: "sub2" },
          { role: "support", characterId: "sup1" },
          { role: "sustain", characterId: "sus1" },
        ],
      },
      {
        id: 3,
        rank: 3,
        title: "Different",
        isSample: false,
        slots: [
          { role: "sub_dps", characterId: "sub3" },
          { role: "support", characterId: "sup1" },
          { role: "sustain", characterId: "sus2" },
        ],
      },
    );
    const result = resolveLineups(input);
    // Lineup 1 resolves to sub2/sup1/sus1 (90) == lineup 2 (100) -> keep lineup 2
    expect(result.map((l) => l.lineupId)).toEqual([2, 3]);
    expect(result[0].completeness).toBe(100);
  });

  it("returns nothing for a DPS without lineups (never pads)", () => {
    expect(resolveLineups(base({ lineups: [] }))).toEqual([]);
  });
});
