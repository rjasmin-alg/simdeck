# win-functional-levels: Functional levels

| | |
|---|---|
| Task | `win-functional-levels` (wave 3, Active Directory) |
| Catalogue entry | `win-functional-levels` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-functional-levels/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-structure` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **what raising the domain and forest level unlocks, and what it rules out**.

The student: raise levels with old DCs present.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-structure/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Active Directory Domain Services functional levels in Windows Server" (per-level features, minimum DC OS, lowering rules)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (estate levels: Windows2012R2Forest / Windows2012R2Domain); `~/projects/dr-lecture-estate/student/configs/ad/pellucid/summary.txt` (pfx-dc1 on 2012 R2, out of support)

## Model and presets

- **Scene:** two ladders side by side, domain functional level and forest functional level, rungs 2003, 2008, 2008 R2, 2012, 2012 R2, 2016, 2025; the current level marked. A strip of the DCs with their OS (estate: `qm-dc01`, `qm-dc02`, `brk-dc03`; levels Windows2012R2 from `forest.txt`), and a second domain for the forest rule. Clicking a rung shows a card: what it unlocks, what it rules out, and whether raising to it is allowed now.
- **State:** `{ domainLevel, forestLevel, dcs: [{ id, os, domain }], selected: rung|null }`.
- **Interaction (reference):** click a rung → card; "raise" on a rung succeeds or lists the DCs that block it.
- **Rules (Microsoft: "Active Directory Domain Services functional levels in Windows Server"):**
  1. Every DC in a domain must run an OS at or above the domain level; raising is refused while any DC is below, and the card lists them.
  2. The forest level can be at most the lowest domain level in the forest; raising the forest level requires every domain to be at or above it.
  3. Raising is one-way except for limited lowering (check: from 2012 R2 down to 2008 R2 is possible if the Recycle Bin is not enabled; never below 2008 R2 once Recycle Bin is on).
  4. Unlocks (domain unless marked): 2003 — `lastLogonTimestamp` replication, constrained delegation, domain rename; 2008 — DFSR for SYSVOL, fine-grained password policies, AES for Kerberos; 2008 R2 — authentication mechanism assurance; forest 2008 R2 — AD Recycle Bin (optional feature, enabled separately); 2012 — KDC support for claims, compound authentication and Kerberos armoring; 2012 R2 — DC-side Protected Users protections, authentication policies and silos; 2016 — PAM (forest), NTLM restrictions for "smart card required" accounts (check); 2025 — 32k database page optional feature (check). Windows Server 2019 and 2022 added no new level.
  5. Rules out: older DCs cannot join a domain at a higher level (e.g. a 2012 R2 DC cannot be promoted into a 2016-level domain); FRS-replicated SYSVOL must be migrated before DCs newer than 2016 can be added (check).
  6. Tie-break: if both rule 1 and rule 2 block a raise, the card lists the DC blockers first.
- **Params:** `extraDc` choice {none, Windows Server 2012 R2 DC, Windows Server 2016 DC} default none — the "old DC present" switch. A reference page normally has no params (see note).
- **Presets (lenses, 4):**
  - `quillmoor` — estate: forest and domain at 2012 R2, all DCs 2012 R2 (check: estate gives levels only, not DC OS) → raise to 2016 refused, lists all three DCs. From the DR estate `forest.txt` (levels).
  - `upgraded-dcs` — DCs replaced by 2022 → raise domain to 2016 allowed, then forest to 2016; card: 2019/2022 have no own level. Derived, unchecked.
  - `old-dc-present` — one 2012 R2 DC left behind → domain raise refused (rule 1).
  - `recycle-bin` — what forest 2008 R2 unlocks and why turning on the Recycle Bin is separate and irreversible (links `win-ad-recycle-bin`).
- **Steps:** 0 (reference).
- **Legend:** current level (filled rung), allowed raise (outlined), blocked (✕ with DC names), unlock item (plus), ruled-out item (minus); "changed" highlight marks the rung just raised.
- **Captions:** hr: "Domena ne može na razinu 2016 dok `brk-dc03` radi na Windows Serveru 2012 R2." en: "The domain can't go to the 2016 level while `brk-dc03` runs Windows Server 2012 R2."
  hr: "*Forest functional level* (funkcionalna razina šume) ne može biti viša od najniže razine domene." en: "The forest functional level can't be higher than the lowest domain level."
- **Terms (check):** functional level — funkcionalna razina; raise — podizanje; forest — šuma; domain — domena; optional feature — neobavezna značajka; Recycle Bin — koš za smeće AD-a.
- **Misconceptions:** functional level = Windows version of the DCs; raising the level upgrades the DCs; 2022 needs a 2022 level.
- **Out of scope:** schema versions and adprep, the features themselves (each has its own page).
- **Note for the coordinator:** like `win-ad-structure`, a reference with one choice param; reclassify as explorer (steps 0) if reference pages must have no params. The list of unlocks per level is the part most in need of checking against the Microsoft page.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-functional-levels` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-functional-levels sims/win-functional-levels` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-functional-levels/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
