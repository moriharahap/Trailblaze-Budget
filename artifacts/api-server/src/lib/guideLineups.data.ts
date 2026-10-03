import type { RoleValue, SlotRoleValue } from "@workspace/db";

/**
 * Lineups researched from Prydwen (https://www.prydwen.gg/star-rail), the
 * "Teams" section of each character page (Memory of Chaos tab, ordered by
 * Prydwen's usage rank). Accessed 2026-10-03. Approved by the user as the
 * source for curated data. Do not edit by hand to add teams from memory:
 * see docs/guide-lineups-sources.md for the source log.
 *
 * Generated from the pages listed in sourceUrl. Teams with fewer than 3
 * teammates and duplicate teammate sets were skipped; nothing is padded.
 */
export const GUIDE_ACCESSED = "2026-10-03";

export interface GuideLineup {
  title: string;
  slots: { role: SlotRoleValue; characterId: string }[];
}

export interface GuideDps {
  dpsId: string;
  sourceUrl: string;
  /** In rank order (rank = index + 1). */
  lineups: GuideLineup[];
}

/** Role each teammate gets, from Prydwen's tier list role columns. */
export const GUIDE_TEAMMATE_ROLES: { id: string; role: RoleValue }[] = [
  { id: "1002", role: "sub_dps" }, // Dan Heng (Prydwen: DPS)
  { id: "1004", role: "support" }, // Welt (Prydwen: Amplifier)
  { id: "1005", role: "sub_dps" }, // Kafka (Prydwen: Support DPS)
  { id: "1208", role: "sustain" }, // Fu Xuan (Prydwen: Sustain)
  { id: "1217", role: "sustain" }, // Huohuo (Prydwen: Sustain)
  { id: "1222", role: "sustain" }, // Lingsha (Prydwen: Sustain)
  { id: "1225", role: "support" }, // Fugue (Prydwen: Amplifier)
  { id: "1301", role: "sustain" }, // Gallagher (Prydwen: Sustain)
  { id: "1303", role: "support" }, // Ruan Mei (Prydwen: Amplifier)
  { id: "1304", role: "sustain" }, // Aventurine (Prydwen: Sustain)
  { id: "1306", role: "support" }, // Sparkle (Prydwen: Amplifier)
  { id: "1307", role: "sub_dps" }, // Black Swan (Prydwen: Support DPS)
  { id: "1309", role: "support" }, // Robin (Prydwen: Amplifier)
  { id: "1313", role: "support" }, // Sunday (Prydwen: Amplifier)
  { id: "1321", role: "support" }, // The Dahlia (Prydwen: Amplifier)
  { id: "1403", role: "support" }, // Tribbie (Prydwen: Amplifier)
  { id: "1405", role: "sub_dps" }, // Anaxa (Prydwen: DPS/Support DPS)
  { id: "1409", role: "sustain" }, // Hyacine (Prydwen: Sustain)
  { id: "1410", role: "sub_dps" }, // Hysilens (Prydwen: DPS)
  { id: "1412", role: "support" }, // Cerydra (Prydwen: Amplifier)
  { id: "1413", role: "sub_dps" }, // Evernight (Prydwen: Support DPS/DPS)
  { id: "1414", role: "sustain" }, // Dan Heng • Permansor Terrae (Prydwen: Sustain)
  { id: "1415", role: "support" }, // Cyrene (Prydwen: Amplifier)
  { id: "1502", role: "support" }, // Yao Guang (Prydwen: Amplifier)
  { id: "1504", role: "sub_dps" }, // Ashveil (Prydwen: DPS/Support DPS)
  { id: "1506", role: "sub_dps" }, // Silver Wolf LV.999 (Prydwen: DPS)
  { id: "1507", role: "support" }, // Mortenax Blade (Prydwen: Amplifier)
  { id: "1508", role: "sub_dps" }, // Rin Tohsaka (Prydwen: Support DPS)
  { id: "1509", role: "sub_dps" }, // Gilgamesh (Prydwen: Support DPS)
  { id: "1512", role: "support" }, // Robin • Summeretto (Prydwen: Amplifier)
  { id: "1513", role: "sub_dps" }, // Aventurine • Waveflair (Prydwen: DPS)
  { id: "8005", role: "support" }, // Trailblazer (Harmony) (Prydwen: Amplifier)
  { id: "8007", role: "support" }, // Trailblazer (Remembrance) (Prydwen: Amplifier)
];

export const GUIDE_DPS: GuideDps[] = [
  {
    dpsId: "1510", // Himeko • Nova
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/himeko-nova",
    lineups: [
      {
        title: "Prydwen MoC #6 · 8.01% use",
        slots: [
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "support", characterId: "1313" }, // Sunday
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #21 · 2.13% use",
        slots: [
          { role: "support", characterId: "1313" }, // Sunday
          { role: "support", characterId: "1004" }, // Welt
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #30 · 1.43% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1004" }, // Welt
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #34 · 1.29% use",
        slots: [
          { role: "support", characterId: "1313" }, // Sunday
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #35 · 1.28% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1004" }, // Welt
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
    ],
  },
  {
    dpsId: "1015", // Archer
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/archer",
    lineups: [
      {
        title: "Prydwen MoC #3 · 13.57% use",
        slots: [
          { role: "sub_dps", characterId: "1508" }, // Rin Tohsaka
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #13 · 2.86% use",
        slots: [
          { role: "sub_dps", characterId: "1508" }, // Rin Tohsaka
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #15 · 2.7% use",
        slots: [
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #17 · 2.59% use",
        slots: [
          { role: "sub_dps", characterId: "1508" }, // Rin Tohsaka
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "support", characterId: "1403" }, // Tribbie
        ],
      },
      {
        title: "Prydwen MoC #19 · 2.33% use",
        slots: [
          { role: "sub_dps", characterId: "1508" }, // Rin Tohsaka
          { role: "support", characterId: "1309" }, // Robin
          { role: "support", characterId: "1306" }, // Sparkle
        ],
      },
    ],
  },
  {
    dpsId: "1501", // Sparxie
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/sparxie",
    lineups: [
      {
        title: "Prydwen MoC #1 · 31.33% use",
        slots: [
          { role: "sub_dps", characterId: "1506" }, // Silver Wolf LV.999
          { role: "support", characterId: "1502" }, // Yao Guang
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #10 · 4.92% use",
        slots: [
          { role: "sub_dps", characterId: "1506" }, // Silver Wolf LV.999
          { role: "support", characterId: "1502" }, // Yao Guang
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #20 · 2.3% use",
        slots: [
          { role: "sub_dps", characterId: "1506" }, // Silver Wolf LV.999
          { role: "support", characterId: "1502" }, // Yao Guang
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #28 · 1.48% use",
        slots: [
          { role: "sub_dps", characterId: "1506" }, // Silver Wolf LV.999
          { role: "support", characterId: "1502" }, // Yao Guang
          { role: "sustain", characterId: "1304" }, // Aventurine
        ],
      },
      {
        title: "Prydwen MoC #29 · 1.46% use",
        slots: [
          { role: "sub_dps", characterId: "1506" }, // Silver Wolf LV.999
          { role: "support", characterId: "1502" }, // Yao Guang
          { role: "sustain", characterId: "1208" }, // Fu Xuan
        ],
      },
    ],
  },
  {
    dpsId: "1308", // Acheron
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/acheron",
    lineups: [
      {
        title: "Prydwen MoC #36 · 1.07% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #113 · 0.28% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #137 · 0.23% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1301" }, // Gallagher
        ],
      },
      {
        title: "Prydwen MoC #139 · 0.22% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #153 · 0.19% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
        ],
      },
    ],
  },
  {
    dpsId: "1310", // Firefly
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/firefly",
    lineups: [
      {
        title: "Prydwen MoC #4 · 10.67% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "1321" }, // The Dahlia
          { role: "sustain", characterId: "1222" }, // Lingsha
        ],
      },
      {
        title: "Prydwen MoC #8 · 6.7% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "1303" }, // Ruan Mei
          { role: "support", characterId: "1321" }, // The Dahlia
        ],
      },
      {
        title: "Prydwen MoC #11 · 4.06% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "8005" }, // Trailblazer (Harmony)
          { role: "support", characterId: "1321" }, // The Dahlia
        ],
      },
      {
        title: "Prydwen MoC #14 · 2.78% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "1321" }, // The Dahlia
          { role: "sustain", characterId: "1301" }, // Gallagher
        ],
      },
      {
        title: "Prydwen MoC #27 · 1.54% use",
        slots: [
          { role: "support", characterId: "8005" }, // Trailblazer (Harmony)
          { role: "support", characterId: "1303" }, // Ruan Mei
          { role: "support", characterId: "1321" }, // The Dahlia
        ],
      },
    ],
  },
  {
    dpsId: "1407", // Castorice
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/castorice",
    lineups: [
      {
        title: "Prydwen MoC #2 · 30.75% use",
        slots: [
          { role: "sub_dps", characterId: "1413" }, // Evernight
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #12 · 3.68% use",
        slots: [
          { role: "sub_dps", characterId: "1413" }, // Evernight
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #33 · 1.32% use",
        slots: [
          { role: "sub_dps", characterId: "1413" }, // Evernight
          { role: "support", characterId: "1512" }, // Robin • Summeretto
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #46 · 0.87% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #51 · 0.76% use",
        slots: [
          { role: "sub_dps", characterId: "1413" }, // Evernight
          { role: "support", characterId: "8007" }, // Trailblazer (Remembrance)
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
    ],
  },
  {
    dpsId: "1413", // Evernight
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/march-7th-evernight",
    lineups: [
      {
        title: "Prydwen MoC #2 · 30.75% use",
        slots: [
          { role: "sub_dps", characterId: "1407" }, // Castorice
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #12 · 3.68% use",
        slots: [
          { role: "sub_dps", characterId: "1407" }, // Castorice
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #33 · 1.32% use",
        slots: [
          { role: "sub_dps", characterId: "1407" }, // Castorice
          { role: "support", characterId: "1512" }, // Robin • Summeretto
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #38 · 0.99% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "8007" }, // Trailblazer (Remembrance)
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #48 · 0.82% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "1512" }, // Robin • Summeretto
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
    ],
  },
  {
    dpsId: "1401", // The Herta
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/the-herta",
    lineups: [
      {
        title: "Prydwen MoC #128 · 0.26% use",
        slots: [
          { role: "sub_dps", characterId: "1405" }, // Anaxa
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #309 · 0.07% use",
        slots: [
          { role: "sub_dps", characterId: "1405" }, // Anaxa
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #414 · 0.04% use",
        slots: [
          { role: "sub_dps", characterId: "1510" }, // Himeko • Nova
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "support", characterId: "1004" }, // Welt
        ],
      },
      {
        title: "Prydwen MoC #414 · 0.04% use",
        slots: [
          { role: "sub_dps", characterId: "1510" }, // Himeko • Nova
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #499 · 0.03% use",
        slots: [
          { role: "sub_dps", characterId: "1405" }, // Anaxa
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
    ],
  },
  {
    dpsId: "1408", // Phainon
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/phainon",
    lineups: [
      {
        title: "Prydwen MoC #23 · 1.81% use",
        slots: [
          { role: "support", characterId: "1412" }, // Cerydra
          { role: "support", characterId: "1313" }, // Sunday
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #30 · 1.43% use",
        slots: [
          { role: "support", characterId: "1412" }, // Cerydra
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "support", characterId: "1313" }, // Sunday
        ],
      },
      {
        title: "Prydwen MoC #32 · 1.33% use",
        slots: [
          { role: "support", characterId: "1412" }, // Cerydra
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "8007" }, // Trailblazer (Remembrance)
        ],
      },
      {
        title: "Prydwen MoC #43 · 0.95% use",
        slots: [
          { role: "support", characterId: "1412" }, // Cerydra
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #60 · 0.68% use",
        slots: [
          { role: "support", characterId: "1412" }, // Cerydra
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "1512" }, // Robin • Summeretto
        ],
      },
    ],
  },
  {
    dpsId: "1213", // Dan Heng • Imbibitor Lunae
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/imbibitor-lunae",
    lineups: [
      {
        title: "Prydwen MoC #724 · 0.01% use",
        slots: [
          { role: "support", characterId: "1309" }, // Robin
          { role: "support", characterId: "1313" }, // Sunday
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #724 · 0.01% use",
        slots: [
          { role: "sub_dps", characterId: "1002" }, // Dan Heng
          { role: "support", characterId: "1313" }, // Sunday
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #724 · 0.01% use",
        slots: [
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "support", characterId: "1313" }, // Sunday
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #724 · 0.01% use",
        slots: [
          { role: "support", characterId: "1309" }, // Robin
          { role: "support", characterId: "1306" }, // Sparkle
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
    ],
  },
  {
    dpsId: "1317", // Rappa
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/rappa",
    lineups: [
      {
        title: "Prydwen MoC #162 · 0.17% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "1321" }, // The Dahlia
          { role: "sustain", characterId: "1222" }, // Lingsha
        ],
      },
      {
        title: "Prydwen MoC #287 · 0.08% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "1303" }, // Ruan Mei
          { role: "support", characterId: "1321" }, // The Dahlia
        ],
      },
      {
        title: "Prydwen MoC #414 · 0.04% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "8005" }, // Trailblazer (Harmony)
          { role: "support", characterId: "1321" }, // The Dahlia
        ],
      },
      {
        title: "Prydwen MoC #499 · 0.03% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "1321" }, // The Dahlia
          { role: "sustain", characterId: "1301" }, // Gallagher
        ],
      },
      {
        title: "Prydwen MoC #592 · 0.02% use",
        slots: [
          { role: "support", characterId: "1225" }, // Fugue
          { role: "support", characterId: "1321" }, // The Dahlia
          { role: "support", characterId: "1403" }, // Tribbie
        ],
      },
    ],
  },
  {
    dpsId: "1404", // Mydei
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/mydei",
    lineups: [
      {
        title: "Prydwen MoC #210 · 0.12% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "8007" }, // Trailblazer (Remembrance)
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #246 · 0.1% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #287 · 0.08% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "1512" }, // Robin • Summeretto
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #414 · 0.04% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #499 · 0.03% use",
        slots: [
          { role: "support", characterId: "1415" }, // Cyrene
          { role: "support", characterId: "8007" }, // Trailblazer (Remembrance)
          { role: "support", characterId: "1403" }, // Tribbie
        ],
      },
    ],
  },
  {
    dpsId: "1014", // Saber
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/saber",
    lineups: [
      {
        title: "Prydwen MoC #26 · 1.64% use",
        slots: [
          { role: "sub_dps", characterId: "1509" }, // Gilgamesh
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #45 · 0.91% use",
        slots: [
          { role: "sub_dps", characterId: "1509" }, // Gilgamesh
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #53 · 0.74% use",
        slots: [
          { role: "sub_dps", characterId: "1509" }, // Gilgamesh
          { role: "support", characterId: "1512" }, // Robin • Summeretto
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #74 · 0.53% use",
        slots: [
          { role: "sub_dps", characterId: "1509" }, // Gilgamesh
          { role: "support", characterId: "8007" }, // Trailblazer (Remembrance)
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #106 · 0.31% use",
        slots: [
          { role: "sub_dps", characterId: "1509" }, // Gilgamesh
          { role: "support", characterId: "1309" }, // Robin
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
    ],
  },
  {
    dpsId: "1509", // Gilgamesh
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/gilgamesh",
    lineups: [
      {
        title: "Prydwen MoC #26 · 1.64% use",
        slots: [
          { role: "sub_dps", characterId: "1014" }, // Saber
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #45 · 0.91% use",
        slots: [
          { role: "sub_dps", characterId: "1014" }, // Saber
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #53 · 0.74% use",
        slots: [
          { role: "sub_dps", characterId: "1014" }, // Saber
          { role: "support", characterId: "1512" }, // Robin • Summeretto
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #62 · 0.66% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #69 · 0.57% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
    ],
  },
  {
    dpsId: "1220", // Feixiao
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/feixiao",
    lineups: [
      {
        title: "Prydwen MoC #287 · 0.08% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
        ],
      },
      {
        title: "Prydwen MoC #323 · 0.06% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1309" }, // Robin
        ],
      },
      {
        title: "Prydwen MoC #371 · 0.05% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #371 · 0.05% use",
        slots: [
          { role: "sub_dps", characterId: "1504" }, // Ashveil
          { role: "support", characterId: "1309" }, // Robin
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #414 · 0.04% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
    ],
  },
  {
    dpsId: "1307", // Black Swan
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/black-swan",
    lineups: [
      {
        title: "Prydwen MoC #9 · 5.2% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1005" }, // Kafka
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #16 · 2.64% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1005" }, // Kafka
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #55 · 0.71% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1005" }, // Kafka
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #91 · 0.4% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1005" }, // Kafka
          { role: "sustain", characterId: "1304" }, // Aventurine
        ],
      },
      {
        title: "Prydwen MoC #107 · 0.3% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1005" }, // Kafka
          { role: "sustain", characterId: "1301" }, // Gallagher
        ],
      },
    ],
  },
  {
    dpsId: "1005", // Kafka
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/kafka",
    lineups: [
      {
        title: "Prydwen MoC #9 · 5.2% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1307" }, // Black Swan
          { role: "sustain", characterId: "1414" }, // Dan Heng • Permansor Terrae
        ],
      },
      {
        title: "Prydwen MoC #16 · 2.64% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1307" }, // Black Swan
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #55 · 0.71% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1307" }, // Black Swan
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #91 · 0.4% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1307" }, // Black Swan
          { role: "sustain", characterId: "1304" }, // Aventurine
        ],
      },
      {
        title: "Prydwen MoC #107 · 0.3% use",
        slots: [
          { role: "sub_dps", characterId: "1410" }, // Hysilens
          { role: "sub_dps", characterId: "1307" }, // Black Swan
          { role: "sustain", characterId: "1301" }, // Gallagher
        ],
      },
    ],
  },
  {
    dpsId: "1504", // Ashveil
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/ashveil",
    lineups: [
      {
        title: "Prydwen MoC #18 · 2.52% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #42 · 0.96% use",
        slots: [
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #55 · 0.71% use",
        slots: [
          { role: "sub_dps", characterId: "1513" }, // Aventurine • Waveflair
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #62 · 0.66% use",
        slots: [
          { role: "sub_dps", characterId: "1509" }, // Gilgamesh
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1217" }, // Huohuo
        ],
      },
      {
        title: "Prydwen MoC #69 · 0.57% use",
        slots: [
          { role: "sub_dps", characterId: "1509" }, // Gilgamesh
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
    ],
  },
  {
    dpsId: "1212", // Jingliu
    sourceUrl: "https://www.prydwen.gg/star-rail/characters/jingliu",
    lineups: [
      {
        title: "Prydwen MoC #724 · 0.01% use",
        slots: [
          { role: "support", characterId: "1512" }, // Robin • Summeretto
          { role: "support", characterId: "1403" }, // Tribbie
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
      {
        title: "Prydwen MoC #724 · 0.01% use",
        slots: [
          { role: "support", characterId: "8007" }, // Trailblazer (Remembrance)
          { role: "support", characterId: "1507" }, // Mortenax Blade
          { role: "sustain", characterId: "1409" }, // Hyacine
        ],
      },
    ],
  },
];
