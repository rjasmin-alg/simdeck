# never-zero-spof: No system has zero SPOFs

| | |
|---|---|
| Task | `never-zero-spof` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-never-zero-spof` in `docs/catalogue.md` §4.7 |
| Kind | **add a preset to `sims/faultline/`** (no page of its own) |
| Folder | `sims/faultline/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | DR |
| Topic / tags / level | `distributed` / `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `faultline` merged; only one preset task per host folder at a time |

## Goal

One concept: **the implicit authorities: identity, naming, time, change, operator**.

The student: remove each authority, see what fails.

This is a **preset on `faultline`** (faultline), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.
5. `sims/faultline/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/faultline/js/engine/`, `/home/rjasmin/projects/faultline/js/samples.js`, `/home/rjasmin/projects/faultline/PEDAGOGY.md`
- Catalogue seed: faultline authorities → link instead
- faultline specifics: `js/engine/authorities.js` (`IMPLICIT_AUTHORITIES`, `attachAuthorities`),
  `js/compile.js` (authorities on unless `settings.authorities === false`), `js/samples.js` `threeZone`,
  `js/engine/cutset.js`; `PEDAGOGY.md` §6 (the authorities table mapped to a real estate)
- DR estate (student side): `student/configs/ad/quillmoor/forest.txt` (FSMO roles, time source),
  `student/handbook/constraints.md` ("Who can do the work")
- Host task: `docs/tasks/*/faultline.md`

## Model and presets

**Preset task on `faultline`.** faultline's thesis is this concept: its engine attaches six **implicit
authorities** (membership, identity, naming, change, time, the operator) to every service unless the model
draws them (`js/engine/authorities.js`). Its sample `threeZone` ("Three zones, and still not zero") is the
demo. The preset makes it a guided, bilingual lecture entry.

- **Scene (faultline's own):** region with three zones; `payments-api` needs a majority of `etcd-1/2/3`
  (`quorum`) and any one of `app-1/2/3` (`any`); a "Not drawn" domain holding the attached authorities;
  the minimal cut-set list.
- **What the host model must support:** exists in faultline: `attachAuthorities(doc, { kinds })` and
  `settings.authorities` (`js/compile.js`). Needed from the host: (a) `?sample=threeZone`, (b) a control to
  attach the authorities one kind at a time (`kinds` filter) so each step adds one, (c) translatable
  strings including each authority's `question` and `detail`. If (b) needs engine changes, write it under
  "Shared requests".
- **One step (guided walk, 8 steps):** (1) the drawn model with authorities off: the smallest cut is size 2
  (two zones), "looks bulletproof"; (2)–(7) attach one authority per step — membership, identity, naming,
  change, time, operator — each appears as a new **size-1 cut** with its question ("What resolves the peer
  addresses?"); (8) summary: six size-1 cuts no zone redundancy can remove.
- **Rules (faultline's, cited):**
  1. Each unmodelled authority is a component every service depends on with gate `all`, so it is a size-1
     cut by construction (`authorities.js` header; "There is no special case in cutset.js").
  2. Drawing a real, redundant authority of a kind replaces the implicit one of that kind (`modelled` set in
     `attachAuthorities`); the cut then reflects what was drawn.
  3. Minimal cut sets as in `cutset.js` (searched by size, up to `maxCutSize`).
  4. The regress ends in a person and a piece of configuration: even a modelled authority has its own
     membership, naming and operator (authorities.js thesis).
- **Presets:**
  1. `three-zones` — faultline `threeZone`: authorities off → smallest cut size 2; all six on → **6 size-1
     cuts** (from faultline's sample and engine; check by running its tests).
  2. `dr-estate-authorities` — optional second preset, from the DR estate: draw the authorities where they
     really are (`student/configs/ad/quillmoor/forest.txt`: all five FSMO roles on `qm-dc01`; the PDC takes
     time from `loom`; `handbook/constraints.md`: one person holds root on `loom`, the backup password and the
     history). Time → `loom`, identity → `qm-dc01`, operator → one person: three size-1 cuts with names
     (derived; needs the host's editor or a new sample document).
- **Steps:** `three-zones` 8; `dr-estate-authorities` 5 (drawn model, time, identity, operator, summary).
- **Legend:** faultline's; the preset adds the "Not drawn" domain style (dashed frame) and a counter
  "size-1 cuts".
- **Captions:**
  - hr: „Tri zone, kvorum od tri, kopije posvuda: najmanji rez ima dva elementa. A onda pitanje: tko
    razrješava adrese čvorova? Imenovanje (*naming*) postaje rez veličine 1."
  - en: "Six authorities attached, six single points of failure. None of them is in a zone."
- **Terms:** single point of failure (SPOF) — jedinstvena točka kvara; authority — autoritet (izvor istine)
  (check); membership — članstvo; identity — identitet; naming — imenovanje; minimal cut set — minimalni
  presječni skup (check); quorum — kvorum.
- **Misconceptions:** "enough redundancy gives zero SPOFs"; "multi-master/leaderless designs have no single
  authority"; "automatic failover removes the human" (it moves the decision).
- **Out of scope:** correlated physical failures (`correlated-failure`), quorum mechanics
  (`quorum-split-brain`), the dated cloud post-mortem samples (`usEast1`, `frontDoor`; link them).
- **Note for the coordinator:** like `correlated-failure`, this already exists in faultline (`threeZone` +
  `authorities.js`); the catalogue says "link instead". The task is strings, tests, the URL entry and the
  step-by-step attach control. Class "stepper" applies only as a guided walk in faultline's own UI.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/faultline/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
