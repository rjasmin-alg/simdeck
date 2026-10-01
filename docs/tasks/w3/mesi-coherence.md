# mesi-coherence: MESI coherence on its own

| | |
|---|---|
| Task | `mesi-coherence` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `arh-mesi` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/mesi-coherence/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | ARH |
| Topic / tags / level | `architecture` / `caches` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `multicore-mesi` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the states of one cache line across cores**.

The student: issue reads and writes per core.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.
5. `sims/multicore-mesi/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material for the protocol itself. Use J. L. Hennessy, D. A. Patterson, *Computer Architecture: A Quantitative Approach*, §5.2 "Centralized shared-memory architectures" (snooping, write-invalidate, MSI with the E extension) and D. Culler, J. P. Singh, *Parallel Computer Architecture*, §5.3 (MESI / Illinois protocol). Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: split from `spl-multicore-mesi`: `/home/rjasmin/projects/single-page-labs/homogeni-multicore-simulator.html`, the MESI panel (functions `mr`, `mw`, state names `mn`, two cores). Note: it counts M→S as an invalidation.

## Model and presets

- **Scene:** one memory line X (value shown in RAM) and 2–4 core caches side by side, each holding X's
  MESI state as a large letter plus its copy of the value; a shared snooping bus between them on which the
  step's transaction (BusRd, BusRdX, BusUpgr, Flush/write-back) is drawn as an arrow; a small state diagram
  (four states) with the transition just taken highlighted.
- **State:** `{ cores: [{state: 'M'|'E'|'S'|'I', value|null}], mem, version, last: {core, op, bus,
  transitions: [{core, from, to}]}, counts: {hits, busTx, invalidations, downgrades, writebacks} }`.
- **One step:** one operation `{core, op: 'R'|'W'}` from the preset's sequence (or added by the student),
  phases in order: (1) local lookup, (2) bus transaction if needed, (3) every other core snoops and changes
  state (a holder in M writes back first), (4) the requester's new state, (5) counts.
- **Reused from `multicore-mesi`** (`spl-multicore-mesi`, `homogeni-multicore-simulator.html` functions `mr`
  and `mw`, two cores): the transition table. **New:** N cores (2–4), bus transactions drawn, value
  tracking (stale RAM), and downgrades counted apart from invalidations (the original counts M→S as an
  invalidation, which this page should not copy).
- **Rules** (Illinois MESI with a snooping bus; Hennessy & Patterson, *Computer Architecture: A Quantitative
  Approach*, §5.2 "snooping coherence protocols"; Culler & Singh, *Parallel Computer Architecture*, §5.3):
  1. Read hit (M, E or S): no bus traffic, no change.
  2. Read miss (I): BusRd. If another core holds M, it writes back (Flush) and goes M→S; requester → S.
     Else if any other core holds E or S: E→S for that core, requester → S. Else requester → E.
  3. Write in M: hit, no bus traffic. Write in E: silent upgrade E→M, no bus traffic.
  4. Write in S: BusUpgr; every other S copy → I; requester → M.
  5. Write miss (I): BusRdX; a holder in M writes back first; every other copy → I; requester → M.
  6. Each write increments the value (version 1, 2, …); RAM is updated only by a write-back, so RAM is
     stale while some core is in M.
  7. At most one core is in M or E; M/E never coexist with S (invariant, tested).
  8. Ties: operations are atomic and in sequence order; no two cores act in the same step.
- **Params:** `cores` choice 2 / 3 / 4 (default 2); buttons "C0 čita / piše" … per core (append an operation
  after the current step, `resets: false`); `sequence` select of the presets.
- **Presets** (expected values derived by hand from the rules):
  1. `classic` (the `multicore-mesi` walk-through, 2 cores): C0 R (I→E), C1 R (C0 E→S, C1 I→S), C0 W
     (BusUpgr, C1 S→I), C1 R (C0 writes back, M→S; C1 I→S). Bus 4, invalidations 1, downgrades 2,
     write-backs 1; RAM = 1 at the end.
  2. `silent-upgrade` (2 cores): C0 R (E), C0 W (E→M, no bus), C0 R (hit), C1 W (BusRdX; C0 writes back,
     M→I; C1 I→M). Bus 2, invalidations 1, write-backs 1. E exists to save the bus message in step 2.
  3. `ping-pong` (2 cores): C0 W, C1 W, C0 W, C1 W, C0 W, C1 W. Bus 6, invalidations 5, write-backs 5,
     hits 0: two cores writing one line serialise on the bus (true or false sharing).
  4. `readers-writer` (3 cores): C0 R (E), C1 R (S, S), C2 R (S, S, S), C1 W (BusUpgr, 2 invalidations),
     C0 R (C1 writes back, M→S; C0 S; C2 stays I), C2 R (S). Bus 6, invalidations 2, write-backs 1.
- **Steps:** 4, 4, 6, 6 (plus any the student appends; cap 20).
- **Legend:** states by letter and pattern (M solid, E dotted, S striped, I hollow), bus transaction arrow,
  write-back (arrow to RAM), stale value (struck through). "Changed" marks every core whose state changed in
  this step and the RAM value when written back.
- **Captions:**
  - hr: „C0 piše u stanju S: na sabirnicu ide *BusUpgr*, kopija u C1 postaje I. C0 je sada M, a RAM je
    zastario.“
  - en: "C0 writes in S: a *BusUpgr* goes on the bus and C1's copy becomes I. C0 is now M and RAM is stale."
- **Terms:** cache coherence — koherencija priručne memorije (check); snooping — njuškanje sabirnice (check);
  bus — sabirnica; invalidation — poništavanje (invalidacija, as in the original page); write-back —
  povratno upisivanje (check); Modified / Exclusive / Shared / Invalid — keep the English state names.
- **Misconceptions:** a write updates the other cores' copies (MESI invalidates, it does not update); RAM is
  always current; E is redundant (preset 2).
- **Out of scope:** MOESI/MESIF, directories, evictions and capacity, false sharing across words (the
  `multicore-mesi` page shows it), memory ordering.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `mesi-coherence` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh mesi-coherence sims/mesi-coherence` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/mesi-coherence/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
