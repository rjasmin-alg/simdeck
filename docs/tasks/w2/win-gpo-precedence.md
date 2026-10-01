# win-gpo-precedence: GPO precedence

| | |
|---|---|
| Task | `win-gpo-precedence` (wave 2b, Group Policy) |
| Catalogue entry | `win-gpo-precedence` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-precedence/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `group-policy` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **local → site → domain → OU, link order, enforced, block inheritance; the winning setting**.

The student: link GPOs, toggle flags, see the winning setting.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Group Policy processing and precedence" (check title); "Group Policy inheritance" / "Block inheritance" and "Enforce a GPO link" (GPMC help) (check titles)
- [MS-GPOL] Group Policy: Core Protocol §3.2.5.1 (GPO list order: local, site, domain, OU; enforced last) (check section)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/gpos.txt` (estate links: domain-root GPOs incl. one Enforced; OU-linked "Chirp Autostart", "Firewall Off")

## Model and presets

- **Scene:** left, the containers on the path of computer `PC07` (or user `ana`): Local → Site `HQ` → Domain `quillmoor.example` → `OU=Quillmoor` → `OU=Workstations`, each with its linked GPOs (link order, Enforced flag, Block Inheritance on OUs). Right, a K4 rule table: one row per GPO in processing order with its value for the shown setting; the winning row highlighted. One setting at a time (default: "Screen saver timeout").
- **State:** `{ target, links: { container: [{ gpo, order, enforced, enabled }] }, blocks: { ou: bool }, gpos: { id: { setting: value } }, list: [], cursor, winner }`.
- **One step:** add the next GPO to the processing list (or skip it with a reason: blocked, link disabled, no value), then apply it; the last step names the winner.
- **Rules (Microsoft: "Group Policy processing and precedence"; "Group Policy inheritance"; [MS-GPOL] §3.2.5.1):**
  1. Processing order: local GPO, then site, domain, then OUs from parent to child (LSDOU). Within a container, the GPO with the highest link order number is processed first and link order 1 last.
  2. For a setting set by several GPOs, the one processed last wins: closer to the object wins, and link order 1 wins within a container.
  3. Block Inheritance on an OU drops GPOs linked above it (site, domain, parent OUs) — except enforced links.
  4. Enforced links are taken out of the normal order and processed after all non-enforced GPOs, the highest container's enforced GPO last: an enforced domain GPO beats an enforced OU GPO and every non-enforced GPO.
  5. A disabled link, or a GPO with that half (user/computer) disabled, is skipped.
  6. A GPO that doesn't configure the setting is processed but doesn't change it ("not configured" is not a value).
  7. Objects in `CN=Computers`/`CN=Users` get only local, site and domain GPOs.
  8. Tie-break: the same GPO linked at two levels is processed at each link; its last processing wins (check).
- **Params:** `target` choice {PC07 in OU=Workstations, PC in CN=Computers} default PC07; `blockWs` toggle (Block Inheritance on `OU=Workstations`) default off; `enforceDomain` toggle (Enforced on `Domain Lockdown`) default off; `swapOrder` toggle (swap link order of the two OU GPOs) default off; `enforceOu` toggle default off.
- **GPOs (derived, unchecked):** local "screen saver 20 min"; site HQ none; domain "Domain Lockdown" 15 min; `OU=Quillmoor` "Quillmoor Base" not configured; `OU=Workstations` "WS Standard" 10 min (link 2) and "WS Kiosk" 5 min (link 1).
- **Presets (6):**
  - `lsdou` — no flags: order local 20 → domain 15 → Quillmoor Base (n/c) → WS Standard 10 → WS Kiosk 5 → winner 5 (WS Kiosk, link 1). 6 steps.
  - `link-order` — swapped: WS Standard link 1 → winner 10. 6 steps.
  - `block` — Block Inheritance on Workstations: domain GPO dropped; winner 5; for a setting only in Domain Lockdown, it's gone. 5 steps.
  - `enforced-vs-block` — block on + Domain Lockdown enforced → domain still applies and, processed last, wins with 15. 6 steps.
  - `two-enforced` — Domain Lockdown and WS Kiosk both enforced → domain's 15 wins (rule 4). 6 steps.
  - `computers-container` — PC in `CN=Computers`: local 20 → domain 15 → winner 15. 3 steps.
- **Steps:** max 6.
- **Legend:** container box (L, S, D, OU letters), GPO link with order number, Enforced (padlock), Block Inheritance (wall), table row applied / skipped (struck through, reason) / winner (✓); "changed" highlight marks the row just processed.
- **Captions:** hr: "WS Kiosk ima *link order* (redoslijed povezivanja) 1, pa se obrađuje zadnji i pobjeđuje: 5 minuta." en: "WS Kiosk has link order 1, so it is processed last and wins: 5 minutes."
  hr: "Prisilni (*Enforced*) GPO domene obrađuje se nakon svih ostalih i prolazi kroz blokadu nasljeđivanja: 15 minuta." en: "The enforced domain GPO is processed after all others and passes through the inheritance block: 15 minutes."
- **Terms (check):** Group Policy object — objekt pravila grupe (GPO); precedence — prednost; link order — redoslijed povezivanja; enforced — prisilno; block inheritance — blokiranje nasljeđivanja; inheritance — nasljeđivanje (UL ch07); organizational unit — organizacijska jedinica.
- **Misconceptions:** link order 1 is processed first and so loses; the domain GPO always wins because it is "higher"; Block Inheritance stops everything.
- **Out of scope:** security and WMI filtering (`win-gpo-security-filtering`), loopback (`win-gpo-loopback`), timing (`win-gpo-processing`), preferences.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-gpo-precedence` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-gpo-precedence sims/win-gpo-precedence` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-precedence/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
