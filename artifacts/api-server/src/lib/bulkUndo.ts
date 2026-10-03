export interface UndoStamp {
  characterId: string;
  /** ISO timestamp the bulk change wrote to the character's curated entry. */
  bulkUpdatedAt: string;
}

/**
 * Ids of characters whose curated entry is gone or was written again after the
 * bulk change, i.e. where restoring the snapshot would overwrite a newer edit.
 */
export function findChangedSinceBulk(
  stamps: UndoStamp[],
  current: Map<string, { updatedAt: Date }>,
): string[] {
  return stamps
    .filter((s) => {
      const row = current.get(s.characterId);
      const expected = Date.parse(s.bulkUpdatedAt);
      return !row || Number.isNaN(expected) || row.updatedAt.getTime() !== expected;
    })
    .map((s) => s.characterId);
}
