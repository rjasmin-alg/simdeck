# win-fsmo-roles: FSMO roles

| | |
|---|---|
| Task | `win-fsmo-roles` (wave 3, Active Directory) |
| Catalogue entry | `win-fsmo-roles` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-fsmo-roles/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-structure` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the single-master jobs and what breaks when a holder is gone; transfer vs seize**.

The student: turn off role holders, try operations.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-structure/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "FSMO roles in Active Directory" (check title); "Transfer or seize Operation Master roles in Active Directory Domain Services"; "Managing RID issuance" (pool size, request threshold) (check title)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (estate: all five roles on qm-dc01; a retired DC "bobbin" without metadata cleanup)
- `~/projects/dr-lecture-estate/instructor/caveats.md` CV-23 ("all FSMO on a VM on size=2 Ceph")

## Model and presets

- **Scene:** three DCs (estate `qm-dc01`, `qm-dc02`, `brk-dc03`) with power switches, five role badges (Schema master and Domain naming master: forest-wide; RID master, PDC emulator, Infrastructure master: per domain), each DC's RID pool gauge (e.g. 500 RIDs). On the right, an operations panel: create users, change a password, extend the schema, add a domain, sync time; each shows ✓, ✕ or "degraded" with the role it needs.
- **State:** `{ dcs: { id: { on, roles: [], ridPool: { left } } }, ops: [], log: [], seized: { role: fromDc } }`.
- **One step:** one action (turn a DC off/on, transfer, seize, or run an operation); the caption names the role involved.
- **Rules (Microsoft: "FSMO roles in Active Directory"; "Transfer or seize FSMO roles in AD DS"):**
  1. Schema master (one per forest): schema changes only; holder off → schema extension (e.g. an application installer that adds classes) fails, nothing else noticeable.
  2. Domain naming master (one per forest): add/remove domains and application partitions; holder off → those fail.
  3. RID master (one per domain): hands out RID pools of 500 to DCs; a DC asks for a new pool when its pool is half used (check); holder off → DCs keep creating objects from their remaining pool, then creation of users/groups/computers fails on that DC.
  4. PDC emulator (one per domain): receives password changes first, final say on bad passwords and lockout, time source of the domain (forest root PDC: of the forest), default DC for GPO editing; holder off → recent password changes fail at far DCs until replicated, lockout less consistent, time drifts (`win-time-hierarchy`).
  5. Infrastructure master (one per domain): updates references to objects in other domains; no work in a single-domain forest, or when every DC is a GC (check: also irrelevant with the Recycle Bin on).
  6. Transfer: holder online, graceful hand-over; no risk.
  7. Seize: holder gone for good (forced takeover); the old holder must not come back online — for RID, schema and naming master a returning old holder means two role holders (e.g. duplicate RID pools → duplicate SIDs); rebuild or metadata cleanup instead (check: Microsoft allows PDC/infrastructure seizure with less risk).
  8. Tie-break: operations after a DC turns off are evaluated against the role map at that step, in panel order.
- **Params:** `ridLeft` range 0–500 default 250 (RIDs left on qm-dc02); `usersToCreate` range 0–600 default 300.
- **Presets (5):**
  - `quillmoor` — estate: all five roles on `qm-dc01` (`forest.txt`). Turn it off; then: password change → degraded, create 300 users on qm-dc02 with 250 RIDs left → 250 created, 50 fail; schema extension fails; time drifts. 6 steps. From the DR estate, counts derived.
  - `rid-only` — RID master off, everything else fine until a pool runs out: creates succeed until the pool is empty. 4 steps.
  - `transfer` — move PDC to qm-dc02 while qm-dc01 is on: clean; time config caveat (`win-time-hierarchy` rule 4). 3 steps.
  - `seize-and-return` — qm-dc01 dies, RID role seized to qm-dc02, then qm-dc01 is restored from an old image and powered on → two RID masters, duplicate pool warning. 5 steps.
  - `infra-single-domain` — Infrastructure master off in a one-domain forest → nothing breaks. 2 steps.
- **Steps:** max 6.
- **Legend:** role badge (5 distinct shapes with letters S, N, R, P, I), DC on/off, operation ✓/✕/degraded (triangle), seized (badge with a clamp); "changed" highlight marks the badge moved or the operation just evaluated.
- **Captions:** hr: "qm-dc01 drži svih pet *FSMO* uloga (uloga operacijskog nositelja); kad padne, korisnici se i dalje prijavljuju, ali shema se ne može proširiti." en: "qm-dc01 holds all five FSMO roles; when it is down users still log on, but the schema cannot be extended."
  hr: "qm-dc02 ima još 250 RID-ova: kreirano je 250 korisnika, a 50 nije." en: "qm-dc02 has 250 RIDs left: 250 users were created, 50 were not."
- **Terms (check):** operations master role — uloga nositelja operacija; schema master — nositelj sheme; RID master — nositelj RID-ova; PDC emulator — emulator PDC-a; transfer — prijenos; seize — preuzimanje (silom); RID pool — skup RID-ova.
- **Misconceptions:** without the FSMO holder nobody can log on; seizing is just a faster transfer; every role matters equally day to day.
- **Out of scope:** metadata cleanup steps, placement guidance for multi-domain forests, the GC itself.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-fsmo-roles` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-fsmo-roles sims/win-fsmo-roles` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-fsmo-roles/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
