import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, charactersTable, characterMetaTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import app from "../app";

/**
 * API round-trip for the bulk change + undo in /admin, against the real
 * database. Uses throwaway characters (ids 99xxxx) so real curated data is
 * never touched; they are removed again afterwards.
 */

const TEST_PASSWORD = "bulk-restore-test-password";
const SAMPLE_ID = "990001"; // curated SAMPLE entry with roles, released, and a score
const CURATED_ID = "990002"; // curated non-sample entry, unreleased
const BARE_ID = "990003"; // no curated entry at all
const TEST_IDS = [SAMPLE_ID, CURATED_ID, BARE_ID];

let server: Server;
let baseUrl: string;
let cookie: string;
let originalPassword: string | undefined;

async function api(path: string, init: RequestInit & { auth?: boolean } = {}) {
  const { auth = true, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (rest.body) headers.set("content-type", "application/json");
  if (auth) headers.set("cookie", cookie);
  return fetch(`${baseUrl}/api${path}`, { ...rest, headers });
}

async function adminList() {
  const res = await api("/admin/characters");
  expect(res.status).toBe(200);
  return (await res.json()) as Array<{ character: { id: string } } & Record<string, unknown>>;
}

async function cleanup() {
  await db.delete(characterMetaTable).where(inArray(characterMetaTable.characterId, TEST_IDS));
  await db.delete(charactersTable).where(inArray(charactersTable.id, TEST_IDS));
}

beforeAll(async () => {
  originalPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = TEST_PASSWORD;

  await cleanup();
  await db.insert(charactersTable).values(
    TEST_IDS.map((id) => ({
      id,
      name: `Restore Test ${id}`,
      rarity: 4,
      pathName: "Test Path",
      elementName: "Test Element",
      iconPath: `icon/character/${id}.png`,
    })),
  );
  await db.insert(characterMetaTable).values([
    { characterId: SAMPLE_ID, roles: ["dps", "support"], genericScore: 7, isReleased: true, isSample: true },
    { characterId: CURATED_ID, roles: ["sustain"], genericScore: null, isReleased: false, isSample: false },
  ]);

  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const login = await api("/admin/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ password: TEST_PASSWORD }),
  });
  expect(login.status).toBe(200);
  const setCookie = login.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  cookie = setCookie!.split(";")[0]!;
});

afterAll(async () => {
  await cleanup();
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalPassword;
});

describe("bulk change then restore", () => {
  it("puts every character back exactly as it was", async () => {
    const before = await adminList();
    const testRowsBefore = before.filter((r) => TEST_IDS.includes(r.character.id));
    expect(testRowsBefore).toHaveLength(3);

    // Clear roles and mark unreleased for all three.
    const bulk = await api("/admin/characters/bulk-meta", {
      method: "POST",
      body: JSON.stringify({ characterIds: TEST_IDS, roles: [], rolesMode: "replace", isReleased: false }),
    });
    expect(bulk.status).toBe(200);
    const { updated, previous } = (await bulk.json()) as {
      updated: Array<{ character: { id: string }; roles: string[]; isReleased: boolean; hasMeta: boolean; isSample: boolean }>;
      previous: unknown[];
    };
    expect(updated).toHaveLength(3);
    for (const row of updated) {
      expect(row.roles).toEqual([]);
      expect(row.isReleased).toBe(false);
      expect(row.hasMeta).toBe(true);
      expect(row.isSample).toBe(false);
    }
    // Sanity: the change really landed, so the restore has something to undo.
    const during = await adminList();
    expect(during).not.toEqual(before);

    const restore = await api("/admin/characters/bulk-meta/restore", {
      method: "POST",
      body: JSON.stringify({ snapshots: previous }),
    });
    expect(restore.status).toBe(200);

    const after = await adminList();
    expect(after).toEqual(before);

    // The entry the bulk change created for the bare character is gone again,
    // and the sample flag and score survived on the others.
    const metas = await db
      .select()
      .from(characterMetaTable)
      .where(inArray(characterMetaTable.characterId, TEST_IDS));
    const byId = new Map(metas.map((m) => [m.characterId, m]));
    expect(byId.has(BARE_ID)).toBe(false);
    expect(byId.get(SAMPLE_ID)).toMatchObject({
      roles: ["dps", "support"],
      genericScore: 7,
      isReleased: true,
      isSample: true,
    });
    expect(byId.get(CURATED_ID)).toMatchObject({
      roles: ["sustain"],
      genericScore: null,
      isReleased: false,
      isSample: false,
    });
  });
});

describe("restore endpoint guards", () => {
  const snapshot = (characterId: string) => ({
    characterId,
    bulkUpdatedAt: new Date().toISOString(),
    hadMeta: false,
    roles: ["dps"],
    isReleased: true,
    isSample: false,
  });

  it("rejects unknown character ids and changes nothing", async () => {
    const before = await adminList();
    const res = await api("/admin/characters/bulk-meta/restore", {
      method: "POST",
      body: JSON.stringify({ snapshots: [snapshot(BARE_ID), snapshot("does-not-exist")] }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("does-not-exist");
    expect(await adminList()).toEqual(before);
  });

  it("rejects requests without an admin session", async () => {
    const before = await adminList();
    const res = await api("/admin/characters/bulk-meta/restore", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ snapshots: [snapshot(BARE_ID)] }),
    });
    expect(res.status).toBe(401);
    expect(await adminList()).toEqual(before);
  });

  it("rejects a forged session cookie", async () => {
    const res = await api("/admin/characters/bulk-meta/restore", {
      method: "POST",
      auth: false,
      headers: { cookie: `tb_admin=${Date.now() + 60_000}.forged` },
      body: JSON.stringify({ snapshots: [snapshot(BARE_ID)] }),
    });
    expect(res.status).toBe(401);
  });
});
