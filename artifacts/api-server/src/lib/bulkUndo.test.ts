import { describe, expect, it } from "vitest";
import { findChangedSinceBulk } from "./bulkUndo";

const t = new Date("2026-10-03T05:00:00.123Z");

describe("findChangedSinceBulk", () => {
  it("accepts entries untouched since the bulk change", () => {
    const current = new Map([["1", { updatedAt: new Date(t) }]]);
    expect(findChangedSinceBulk([{ characterId: "1", bulkUpdatedAt: t.toISOString() }], current)).toEqual([]);
  });

  it("flags entries edited after the bulk change", () => {
    const current = new Map([["1", { updatedAt: new Date(t.getTime() + 1) }]]);
    expect(findChangedSinceBulk([{ characterId: "1", bulkUpdatedAt: t.toISOString() }], current)).toEqual(["1"]);
  });

  it("flags entries that no longer exist", () => {
    expect(findChangedSinceBulk([{ characterId: "1", bulkUpdatedAt: t.toISOString() }], new Map())).toEqual(["1"]);
  });

  it("flags unparseable stamps instead of trusting them", () => {
    const current = new Map([["1", { updatedAt: new Date(t) }]]);
    expect(findChangedSinceBulk([{ characterId: "1", bulkUpdatedAt: "nope" }], current)).toEqual(["1"]);
  });
});
