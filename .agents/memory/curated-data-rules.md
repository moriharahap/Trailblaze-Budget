---
name: Curated data rules
description: User's non-negotiable rules for game data vs curated HSR data in Trailblaze Budget
---
- Never derive roles from path, never invent kits/roles/lineups/rankings. Only the user enters real curated data via /admin; the only seeded data is ONE SAMPLE DPS (Seele).
**Why:** the user said so in the spec; they own the meta data.
**How to apply:** any feature touching roles/lineups/substitutes must read character_meta/lineups/substitutes only; no fallback to path-based heuristics.
