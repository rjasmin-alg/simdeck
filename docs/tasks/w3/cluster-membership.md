# cluster-membership: Who is still in the cluster: heartbeats and the token timeout

| | |
|---|---|
| Task | `cluster-membership` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-cluster-membership` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/cluster-membership/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `distributed` / `networking` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **nodes pass a token round a ring; a node that misses it past the timeout is dropped and membership re-forms before quorum is counted; a short timeout drops slow nodes, a long one delays failover**.

The student: slow a node, cut a link, change the timeout.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T52 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T52; owner suggestion s-001 "corosync" (2026-11-12); next to quorum-split-brain

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh cluster-membership sims/cluster-membership` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cluster-membership/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
