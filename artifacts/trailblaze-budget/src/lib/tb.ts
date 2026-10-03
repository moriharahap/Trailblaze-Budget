import type { CharacterSummary, SlotRole, Role } from "@workspace/api-client-react";

export function getAnonId(): string {
  let id = localStorage.getItem("tb_anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tb_anon_id", id);
  }
  return id;
}

const ELEMENTS: Record<string, string> = {
  Physical: "#C9CDD6",
  Fire: "#F2694A",
  Ice: "#7CD3F2",
  Lightning: "#C27BF5",
  Wind: "#5FDDB0",
  Quantum: "#7B76F0",
  Imaginary: "#F5D66B",
};

export function elementColor(c: Pick<CharacterSummary, "element" | "elementColor">): string {
  if (c.elementColor) return c.elementColor.startsWith("#") ? c.elementColor : `#${c.elementColor}`;
  return ELEMENTS[c.element] ?? "#C9CDD6";
}

export const ROLE_LABEL: Record<Role | SlotRole, string> = {
  dps: "DPS",
  sub_dps: "Sub-DPS",
  support: "Support",
  sustain: "Sustain",
};

export function errMsg(e: unknown): string {
  const d = (e as { data?: { error?: string } } | null)?.data;
  if (d && typeof d.error === "string") return d.error;
  return e instanceof Error ? e.message : "Something went wrong";
}
