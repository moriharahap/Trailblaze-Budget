---
name: Curated data rules
description: User's rules for game data vs curated HSR data in Trailblaze Budget (roles, lineups, sources)
---
- Never derive roles from path. Never invent kits/roles/lineups/rankings from model knowledge.
- Allowed sources of curated data: (1) the user via /admin, (2) the one SAMPLE DPS seed (Seele), (3) teams/roles researched from public guides (Prydwen) with a cited source log (docs/guide-lineups-sources.md) — user approved this on 2026-10-03 for their 19 listed DPS.
**Why:** the user owns the meta data; they explicitly approved guide-sourced teams shown as normal (non-draft) curated teams.
**How to apply:** new guide data must cite URLs + access date and never pad missing teams. Ship it as a new one-time import key (never re-run an old key), which only adds roles and skips any DPS that already has lineups, so admin edits are never overwritten.
- Prydwen pages are Cloudflare-protected for direct fetch; the web fetch tool works. Teammate roles come from the tier-list role columns (Amplifier→support, Sustain→sustain, Support DPS/DPS→sub-DPS).
