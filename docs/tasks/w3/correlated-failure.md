# correlated-failure: One power strip under three replicas

| | |
|---|---|
| Task | `correlated-failure` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `dr-correlated-failure` in `docs/catalogue.md` §4.6 |
| Kind | **add a preset to `sims/faultline/`** (no page of its own) |
| Folder | `sims/faultline/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | DR |
| Topic / tags / level | `storage` / `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `faultline` merged; only one preset task per host folder at a time |

## Goal

One concept: **redundancy that shares one hidden dependency**.

The student: add dependencies, fail the PDU.

This is a **preset on `faultline`** (faultline), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/faultline/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/faultline/js/engine/`, `/home/rjasmin/projects/faultline/js/samples.js`, `/home/rjasmin/projects/faultline/PEDAGOGY.md`
- Catalogue seed: faultline onePdu → link instead
- faultline specifics: `js/samples.js` `onePdu` (domains, `kofn` n = 2, event `pdu-a` hitting `r1`, `r2`),
  `js/engine/graph.js` (`GATES`, `evaluator`), `js/engine/cutset.js` (`cutSets`), `js/engine/events.js`;
  `PEDAGOGY.md` §6 (scenario doctrine) and §7; faultline `tests/` for the expected cut lists
- Host task: `docs/tasks/*/faultline.md` (adoption, `?sample=` presets)

## Model and presets

**Preset task on `faultline`.** faultline already ships this scenario as its sample `onePdu` ("Three racks,
one power strip"); the preset makes it a lecture-ready entry: Croatian and English strings, a three-step
walk, its own tests, and a `?sample=onePdu` link.

- **Scene (faultline's own):** fault-domain tree `Server room → Rack 1, Rack 2, Rack 3`; components
  `file service` (service) and `osd-1/2/3` (replicas, one per rack); the service needs 2 of 3 (`kofn`,
  n = 2, i.e. size 3 / min_size 2); the event **"PDU A trips"** hitting Rack 1 and Rack 2 ("Racks 1 and 2
  were commissioned first and share a feed. Nobody drew the feed."). Panels: blast radius and minimal cut
  sets.
- **What the host model must support:** all of it exists in faultline's engine (`graph.js` gates `kofn`,
  `cutset.js` minimal cut search, events with `hits`). The task needs from the host only: (a) presets
  addressable by URL (`?sample=`, part of the `faultline` adoption task), (b) a way to show the event list
  before and after "drawing" the feed (a toggle that adds/removes the `pdu-a` event), (c) translatable
  strings. If (b) is not possible without changing the engine, write it under "Shared requests".
- **One step (preset walk, 3 steps):** (1) the drawn model: three racks, three replicas, "3× redundant";
  (2) the hidden feed is drawn (event `pdu-a` added): the cut list now has a size-1 entry; (3) trip PDU A:
  racks 1 and 2 down, 1 of 3 replicas live < 2 needed → service down.
- **Rules (faultline's, cited, not new):**
  1. A `kofn` gate with n = 2 is up while ≥ 2 of its dependencies are up (`graph.js` `GATES.kofn`).
  2. An event takes down every component in the domains it hits (`events.js`, `hits`).
  3. A minimal cut set is a smallest set of events that takes the service down; minimal = removing any one
     element lets the service survive (`cutset.js` header).
  4. Without the PDU event, the smallest cuts are pairs of racks (size 2); with it, **{PDU A}** is a size-1
     cut, and it was invisible because nobody drew the feed (faultline `PEDAGOGY.md` §6, "the dashboard
     reads 3x redundant. The cut list reads size 1").
- **Presets:** one, `one-pdu` (faultline `onePdu`): before step 2, cuts {Rack 1, Rack 2}, {Rack 1, Rack 3},
  {Rack 2, Rack 3}; after, {PDU A} (size 1) plus the three rack pairs; after the trip: service **down**, 1 of 3
  replicas up (from faultline's sample and engine; check by running its tests). faultline attaches the six
  implicit authorities by default (`js/compile.js`, unless `settings.authorities === false`), which adds six
  more size-1 cuts: the preset runs with authorities off so this lesson stays one concept, and says so;
  they are `never-zero-spof`'s lesson.
- **Steps:** 3.
- **Legend:** faultline's (domain frames, component chips, gate labels, cut list). The preset adds a
  "hidden dependency" style for the feed (dashed, "nije nacrtano / not drawn").
- **Captions:**
  - hr: „Tri ormara, tri kopije, potrebne dvije: na crtežu nijedan kvar ne ruši uslugu. Ali ormari 1 i 2
    vise na istoj razdjelnici napajanja (*PDU*)."
  - en: "PDU A trips: two racks go dark together, one replica is left, two are needed. The redundancy was
    real; the independence was not."
- **Terms:** correlated failure — povezani kvar (check); power distribution unit (PDU) — razdjelnik
  napajanja (check); minimal cut set — minimalni presječni skup (check); fault domain — domena kvara;
  redundancy — zalihost (UL ch12 „redundancija", check); single point of failure — jedinstvena točka kvara.
- **Misconceptions:** "three replicas in three racks are independent"; "redundancy in the drawing is
  redundancy in the room".
- **Out of scope:** the implicit authorities (`never-zero-spof`, the other faultline preset), size/min_size
  details (`ceph-min-size`), placement rules (`crush-failure-domain`).
- **Note for the coordinator:** this preset already exists in faultline (`onePdu`); the catalogue says "link
  instead". The work here is strings, tests and the URL entry, not a new model. If the `faultline` adoption
  task already exposes `onePdu` bilingually, this task can be closed into it. Also: the task's Class says
  stepper, but faultline is an analytical tool, not a kit stepper; the "3 steps" are a guided walk in its own
  UI.

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
