# crush-failure-domain: Failure domain in a placement rule

| | |
|---|---|
| Task | `crush-failure-domain` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-crush-failure-domain` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/crush-failure-domain/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `storage` / `storage-cluster` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ceph-min-size` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **same data, rule by host vs by rack; then lose a rack**.

The student: switch the rule, kill a rack.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/ceph-min-size/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/cephsim/js/engine/` (pure CRUSH/PG engine) and `/home/rjasmin/projects/cephsim/js/samples.js`
- Catalogue seed: cephsim brokenRule
- cephsim specifics: `js/samples.js` `threeRacks` and `replicasInOneRack` (`brokenRule`: same hardware,
  `failureDomain: 'host'`, pool `rbd` 2048 PGs size 3/2); `js/engine/crush.js` (chooseleaf firstn),
  `js/engine/pgmap.js` (`pgState`); numbers above from running the engine (`evaluatePool` with rack 1's 36
  OSDs down)
- DR estate (student side): `student/configs/hq/hqc/crushmap.txt` (`replicated_rule`: `step chooseleaf
  firstn 0 type host`, no device class)
- Ceph documentation "CRUSH Maps" (failure domains, `chooseleaf`) *(check)*

## Model and presets

- **Scene:** the cephsim `threeRacks` hardware: 3 racks × 3 hosts (ceph-r1-1 … ceph-r3-3), shown as a tree
  root → rack → host. Next to it the rule text, one word highlighted: `step chooseleaf firstn 0 type host`
  vs `type rack`. A strip of sample PGs (12 shown, totals for all 2048) with their three replica locations
  as `rack/host` badges, and the state counts after a rack is lost. Reuses `ceph-min-size`'s PG states and
  colours.
- **State:** reuses `ceph-min-size`'s `{raw, down, counts}`; new: `{ rule: 'host'|'rack', lostRack:
  null|1..3, sample: pgId[] }`. CRUSH output for both rules is a fixture generated with the cephsim engine
  (COMMON §6: copy, do not link).
- **One step:** (1) show placement under the current rule, (2) highlight replicas sharing a rack, (3) lose
  rack 1, recompute states, (4) switch the rule and repeat 1–3, (5) side-by-side totals.
- **Rules** (cephsim `js/engine/crush.js`, `pgmap.js`; Ceph docs "CRUSH Maps") (check):
  1. `chooseleaf … type X` places each replica under a **different** bucket of type X; with `type host`
     two replicas may share a rack, with `type rack` never.
  2. A rule cannot place more replicas than there are buckets of its type (3 racks → size ≤ 3 with
     `type rack`); missing positions are holes (`NONE`) and the PG is undersized from birth.
  3. PG states after a loss follow `ceph-min-size` rules 1–4 (size 3, min_size 2): ≥ 2 replicas in the lost
     rack → inactive; exactly 1 → degraded but active; 0 → clean.
  4. All three replicas in the lost rack → `stale+inactive`; if the rack is destroyed rather than
     powered off, that data is gone.
  5. Everything reports `HEALTH_OK` before the loss under both rules: the rule's weakness is invisible
     until the failure (cephsim sample comment).
  6. Tie-break for the sample strip: PGs are shown by id order 0–11; totals always count all 2048.
- **Params:** `rule` choice host / rack (host); `lostRack` choice none / 1 / 2 / 3 (none); `showAll` toggle
  (totals only vs sample strip).
- **Presets** (counts from a cephsim engine run on `brokenRule`, pool `rbd`, 2048 PGs, size 3 / min_size 2):
  1. `by-host-lose-rack` — rule `type host`, rack 1 lost: **453 inactive** (420 `incomplete+inactive`, 33
     `stale+inactive`), 1096 degraded, 499 clean. (Uniform-random estimate: 19/84 = 22.6 % ≈ 463 inactive;
     the sample's comment "a third of the PGs go inactive" overstates it.)
  2. `by-rack-lose-rack` — rule `type rack`, rack 1 lost: **0 inactive, 2048 degraded**.
  3. `before-the-loss` — both rules with nothing lost: all 2048 `active+clean`; same health, different risk.
  4. `ec-by-host` — cephsim `threeRacks` `cephfs_data` 4+2 with failure domain host, rack 1 lost: 271 of 1024
     inactive with min_size 4 (783 with min_size 5): an EC pool spread by host is not rack-tolerant either.
- **Steps:** presets 1 and 2: 3 each; `before-the-loss` 2; `ec-by-host` 3; the full comparison (switch rule
  in between) 7.
- **Legend:** rack (large frame), host (box), replica badge (circle with rack number), two replicas in one
  rack (badge pair outlined, "!"), lost rack (crossed frame). PG states as in `ceph-min-size`. "Changed"
  marks PGs whose state changed in this step.
- **Captions:**
  - hr: „Pravilo kaže *type host*: tri kopije na tri različita poslužitelja — ali dva od njih mogu biti u
    istom ormaru. Gubitak ormara 1 zaustavlja 453 od 2048 grupa smještaja."
  - en: "One word changed, `host` → `rack`: the same rack loss leaves every PG degraded and none stopped."
- **Terms:** failure domain — domena kvara (check); placement rule — pravilo smještaja; rack — ormar
  (DR/UL usage „ormar", check); bucket — spremnik (CRUSH) (check); placement group — grupa smještaja;
  replica — kopija.
- **Misconceptions:** "three replicas on three hosts survive anything short of three failures"; "HEALTH_OK
  means the layout is safe"; "more racks fix it without changing the rule".
- **Out of scope:** device classes (scoping §5 item 1, a different lesson), weights and capacity
  (`smallest-disk-caps`), CRUSH algorithm internals (straw2), EC maths (`ec-vs-replication`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `crush-failure-domain` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh crush-failure-domain sims/crush-failure-domain` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/crush-failure-domain/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
