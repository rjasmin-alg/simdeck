<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-functional-levels — spec

Task `docs/tasks/w3/win-functional-levels.md`. One concept: what raising the domain and forest functional level
unlocks, and what it rules out. Explorer (steps 0). Model: `sim.js`; tests: `sim.test.js` (one per rule, tie-break
first).

**Sources.** [MS] Microsoft Learn, "Active Directory Domain Services functional levels in Windows Server"
(ms.date 2025-10-30, read 2026-11-13): levels 2012 R2, 2016, 2025, the DC support matrix, 2016/2025 features, "2019
and 2022 use 2016 as the most recent functional level", "You can't set a domain functional level lower than the
forest functional level". [MS-old] its archived predecessor "Understanding AD DS functional levels" (2008 R2 era,
updated 2021-11-12): features of 2003–2012, the raising rule ("You can raise the functional level of a domain only if
all domain controllers in the domain run the version or versions of Windows Server that the new functional level
supports"), the lowering tables. [estate] `dr-lecture-estate/student/configs/ad/quillmoor/forest.txt`: forest and
domain modes Windows2012R2Forest / Windows2012R2Domain, DCs `qm-dc01`, `qm-dc02`, `brk-dc03`, Recycle Bin disabled.
*(check)* marks what neither page states.

## Scene

- Levels, lowest first: 2003, 2008, 2008 R2, 2012, 2012 R2, 2016, 2025. No 2019 or 2022 level [MS].
- Domains: `quillmoor.example` (estate) and `thornfell.example` (invented in `win-ad-structure`, a second tree of
  the same forest), each with a domain level; one forest level. Defaults: all 2012 R2 [estate; thornfell invented].
- DCs: `qm-dc01`, `qm-dc02`, `brk-dc03` in quillmoor [estate], `thf-dc01` in thornfell (invented). Default OS
  Windows Server 2012 R2 for all four *(check: the estate gives levels, not DC OS; `pellucid/summary.txt` has a
  2012 R2 DC, so 2012 R2 is the plausible estate OS)*.
- Param `extraDc` ∈ {none, 2012 R2, 2016, 2025}: a new DC `qm-dc04` being promoted into quillmoor.
- Recycle Bin: off [estate]; can be turned on, never off.
- State: `{ levels: { q, thf }, forest, rb, dcs: [{ id, domain, os, joined, fits, extra }], extra, selected, last }`.

## Rules

1. **DCs bound the domain level.** A DC on OS *o* can run at level *L* when floor(*o*) ≤ *L* ≤ top(*o*).
   top: each OS up to 2016 is its own level; 2019 and 2022 → 2016; 2025 → 2025 [MS]. Raising a domain to *L* is
   refused while any of its DCs has top < *L*; the refusal lists them in DC order [MS-old].
   - Expected: estate, quillmoor → 2016 refused, DCs `qm-dc01, qm-dc02, brk-dc03` (all three, task).
   - Expected: `old-dc-present` (only brk-dc03 on 2012 R2) → refused, `brk-dc03` alone.
   - Expected: `upgraded-dcs` (all 2022) → quillmoor → 2016 allowed; → 2025 refused, all three DCs.
2. **The forest is at most the lowest domain.** Raising the forest to *L* is refused while any domain is below *L*
   (listed in domain order), and while any DC in the forest has top < *L* (rule 1 over the whole forest). A domain
   can't be lowered below the forest [MS]. Params that put a domain below the forest are repaired by lowering the
   forest to the lowest domain.
   - Expected: `upgraded-dcs`, quillmoor raised to 2016 → forest → 2016 refused by `thornfell.example` alone; after
     thornfell → 2016, forest → 2016 allowed.
   - Expected: estate, quillmoor → 2012 (lowering) refused: forest is at 2012 R2.
3. **One-way, with a little lowering** [MS-old tables, both checked row by row]. Lowering is possible only from 2008 R2, 2012 or 2012 R2, and
   never below 2008. A forest with the Recycle Bin on never goes below 2008 R2. Nothing is documented for 2016 and
   2025: modelled as one-way *(check)*. Below 2008 R2 nothing can be lowered at all. When both "one-way" and the
   Recycle Bin forbid a target (forest below 2008 with the Recycle Bin on), the reason given is one-way. A domain
   refused because of the forest is told to lower the forest first only when the forest itself can go there.
   - Expected forest, Recycle Bin off: 2012 R2 → 2012, 2008 R2, 2008 allowed; → 2003 refused (`one-way`).
   - Expected forest, Recycle Bin on: 2012 R2 → 2008 R2 allowed, → 2008 refused (`recycle-bin`); 2008 R2 → 2008
     refused.
   - Expected: 2016 → 2012 R2 refused (`undocumented`); 2008 → 2003 refused (`one-way`).
   - The task said "from 2012 R2 down to 2008 R2 is possible if the Recycle Bin is not enabled"; the archived table
     allows down to 2008 then, and down to 2008 R2 (not lower) with it on. The table wins.
4. **Unlocks** (domain unless marked) [MS-old for 2003–2012, MS for 2012 R2–2025]:
   2003 — `lastLogonTimestamp` replication, constrained delegation, DC rename; forest 2003 — forest trusts, domain
   rename. 2008 — DFSR for SYSVOL, fine-grained password policies, AES for Kerberos. 2008 R2 — authentication
   mechanism assurance, automatic SPN management for managed service accounts; forest 2008 R2 — AD Recycle Bin (an
   optional feature, turned on separately and irreversibly). 2012 — KDC support for claims, compound authentication
   and Kerberos armoring. 2012 R2 — DC-side Protected Users protections; authentication policies and silos. 2016 —
   automatic rolling of NTLM secrets for accounts that require smart card (PKI) logon; network NTLM for users
   restricted to specific devices; the fresh public key identity SID for PKInit Freshness; forest 2016 — privileged access management (PAM). 2025 — the 32k database page
   optional feature *(check: [MS] lists it under the domain; it may be forest-wide)*. Forest 2008, 2012, 2012 R2,
   2025: nothing of their own.
   - Deviation: the task put domain rename under domain 2003; [MS-old] has domain rename as a forest 2003 feature
     and DC rename as domain 2003. The task's "NTLM restrictions for smart card required accounts (check)" is
     reworded to [MS]'s three 2016 items (two NTLM, one PKInit Freshness).
5. **Rules out.** A level rules out every DC OS it does not support: older ones (top < *L*) and newer ones whose
   floor is above it. Floors: 2025 → 2016 [MS matrix: 2025 not supported at 2012 R2]; 2019 and 2022 → 2008 *(check:
   no FRS for SYSVOL after 2016)*; earlier ones → 2003. So at 2012 R2 a 2025 DC can't be promoted, and at 2016 a
   2012 R2 DC can't. The 2016 level also requires DFSR for SYSVOL [MS: "Domains must use DFSR as the engine to
   replicate SYSVOL"].
   - A new DC (`extraDc`) is promoted when its OS supports its domain's level and the forest level, the domain
     checked first; otherwise it is drawn refused and blocks nothing.
   - Replacing a DC (card: Windows Server 2022 or 2025) follows the same check.
   - Expected: estate + extraDc 2025 → refused at the domain level 2012 R2. Estate + extraDc 2012 R2 → promoted, and
     quillmoor → 2016 then lists four DCs. `upgraded-dcs` with quillmoor at 2016 + extraDc 2012 R2 → refused.
   - Expected: `upgraded-dcs` with quillmoor and thornfell at 2016 but forest 2012 R2: replacing `qm-dc01` with 2025
     → refused by the forest level.
6. **Tie-break.** When rule 1 and rule 2 both block a forest raise, the DCs are listed first, then the domains.
   - Expected: estate, forest → 2016: DCs `qm-dc01, qm-dc02, brk-dc03, thf-dc01`, then `quillmoor.example,
     thornfell.example`.
7. **Recycle Bin.** It can be turned on when the forest is at 2008 R2 or higher, and stays on (no action turns it
   off). Expected: estate → allowed; forest at 2008 → refused.
8. **The last action** is shown only while it still describes the state (a success whose level is still current, a
   refusal still refused). Every action returns a param patch (`act`); a refused one changes only `last` and `sel`.

## Presets (lenses)

| id | params | what it shows |
|---|---|---|
| `quillmoor` | estate, rung quillmoor 2016 | refused, three DCs listed (rule 1) |
| `upgraded-dcs` | all DCs 2022, rung quillmoor 2016 | allowed; then forest after thornfell; 2019/2022 have no own level |
| `old-dc-present` | qm-dc01/02 and thf-dc01 2022, brk-dc03 2012 R2, rung quillmoor 2016 | refused by brk-dc03 alone (caption 1) |
| `recycle-bin` | estate, rung forest 2008 R2 | what forest 2008 R2 unlocks; turning the Recycle Bin on is separate and irreversible |
