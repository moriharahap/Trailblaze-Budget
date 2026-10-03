import {
  db,
  charactersTable,
  characterMetaTable,
  type CharacterRow,
  type CharacterMetaRow,
} from "@workspace/db";
import { ASSET_BASE } from "./gameData";
import type { EngineCharacter } from "./lineupEngine";

export interface CharacterSummaryDto {
  id: string;
  name: string;
  rarity: number;
  path: string;
  element: string;
  elementColor: string | null;
  iconUrl: string;
}

export function toSummary(row: CharacterRow): CharacterSummaryDto {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    path: row.pathName,
    element: row.elementName,
    elementColor: row.elementColor,
    iconUrl: `${ASSET_BASE}${row.iconPath}`,
  };
}

export function isVisible(meta: CharacterMetaRow | undefined): boolean {
  return !!meta && meta.isReleased && meta.roles.length > 0;
}

export interface Roster {
  characters: Map<string, CharacterRow>;
  meta: Map<string, CharacterMetaRow>;
  /** Characters players may see: synced, released, and with at least one role. */
  visible: Map<string, CharacterRow>;
  engineCharacters: EngineCharacter[];
}

export async function loadRoster(): Promise<Roster> {
  const [chars, metas] = await Promise.all([
    db.select().from(charactersTable),
    db.select().from(characterMetaTable),
  ]);
  const characters = new Map(chars.map((c) => [c.id, c]));
  const meta = new Map(metas.map((m) => [m.characterId, m]));
  const visible = new Map(
    chars.filter((c) => isVisible(meta.get(c.id))).map((c) => [c.id, c]),
  );
  const engineCharacters: EngineCharacter[] = [...visible.keys()].map((id) => {
    const m = meta.get(id)!;
    return { id, roles: m.roles, genericScore: m.genericScore };
  });
  return { characters, meta, visible, engineCharacters };
}

const nameCompare = (a: CharacterRow, b: CharacterRow) =>
  b.rarity - a.rarity || a.name.localeCompare(b.name);
export { nameCompare };
