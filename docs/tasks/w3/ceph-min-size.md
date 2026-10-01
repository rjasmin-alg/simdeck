# ceph-min-size: size and min_size

| | |
|---|---|
| Task | `ceph-min-size` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-ceph-min-size` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/ceph-min-size/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `storage` / `storage-cluster` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `quorum-split-brain` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **size=2 min_size=2 blocks I/O on one failure; 3/2 doesn't**.

The student: fail OSDs under each setting, try to write.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/quorum-split-brain/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S2.md` (DR estate scenario)
- `/home/rjasmin/projects/cephsim/js/engine/` (pure CRUSH/PG engine) and `/home/rjasmin/projects/cephsim/js/samples.js`
- `/home/rjasmin/projects/faultline/js/engine/`, `/home/rjasmin/projects/faultline/js/samples.js`, `/home/rjasmin/projects/faultline/PEDAGOGY.md`
- Catalogue seed: cephsim, faultline sizeTwo, scoping §5, DR S2/P05 → §5.7
- cephsim specifics: `js/engine/pgmap.js` (`pgState`, `poolMinSize`) and `js/samples.js` `hyperconverged`
  (3 hosts × 4 OSDs, size 3 / min_size 2); faultline `js/samples.js` `sizeTwo` (gate `all` = every copy
  needed)
- DR estate (student side): `student/scenarios/S2.md`, `student/configs/hq/hqc/ceph-osd-pool-ls-detail.txt`
  (vm-rbd and cephfs_data `size 2 min_size 2`), `ceph-osd-tree.txt` (osd.15, 7.28 TiB, on hq-pve-03)
- `~/projects/cluster-design-sim-scoping.md` §5 item 3; `~/projects/faultline/PEDAGOGY.md` §7 item 3
- Ceph documentation "Pools" (`size`, `min_size`) and "Placement Group States" *(check)*
- "DR S2/P05" in the seed: P05 is not in the student scenarios; it is probably an instructor reference and
  was not consulted

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Scene:** K3 block grid. Rows = OSDs grouped by host (3 hosts × 4 OSDs, as cephsim `hyperconverged`),
  columns = PGs of one pool (128, drawn as a compact grid; a 12-PG zoom shows acting sets). Each PG cell is
  coloured and labelled by state: `active+clean`, `active+undersized+degraded`, `incomplete+inactive`,
  `stale+inactive`. A **client write** arrow per step tries one object in a chosen PG: accepted (✓) or
  blocked (⏸ "I/O blocked"). Header: `size` / `min_size` and the state counts.
- **State:** `{ size, minSize, pgNum, raw: osd[][] (CRUSH output per PG), down: osd[], write: {pg,
  result}|null, counts }`. CRUSH output is precomputed from the cephsim engine (copied per COMMON §6) or
  stored as a fixture from it.
- **One step:** (1) mark one OSD (or host) down, recompute PG states; (2) a client write to a PG that
  contained that OSD, accepted or blocked; repeat.
- **Rules** (cephsim `js/engine/pgmap.js` `pgState`; Ceph docs "Pools" `size` / `min_size`, "Placement
  Group States") (check):
  1. A PG is **active** (serves reads and writes) iff its live acting set ≥ `min_size`.
  2. Active with fewer than `size` live copies → `undersized+degraded`; I/O continues.
  3. Live copies below `min_size` but > 0 → `incomplete+inactive`: I/O to that PG blocks (clients hang, they
     do not get an error).
  4. No live copy → `stale+inactive`.
  5. A write is acknowledged only after every live member of the acting set has it; with `min_size 1` a
     degraded PG accepts writes onto a single copy, and losing that disk before recovery loses those writes
     (Ceph docs warn against `min_size 1`) (check).
  6. Defaults: replicated `min_size` = size − ⌊size/2⌋ → 3/2 for size 3 (Ceph docs) (check). The scoping
     note says that setting size 2 in the UI the estate uses leaves min_size 2 ("the default you get by
     typing 2") (scoping §5 item 3; check).
  7. Tie-break: OSDs fail in the order clicked; recovery is not modelled here (link `ceph-down-out`).
- **Params:** `size` choice 2 / 3 (3); `minSize` choice 1 / 2 (2); `fail` select OSD or host; button "client
  write".
- **Presets** (PG counts from the cephsim engine, `hyperconverged` sample, pool of 128 PGs, osd.0 and osd.4 on
  different hosts):
  1. `size2-min2` — one OSD down: **17 of 128 PGs inactive**, writes to them block (faultline `sizeTwo`: "one
     disk loss does not degrade the pool, it stops it").
  2. `size3-min2` — the same failure: **0 inactive, 30 degraded**, every write accepted.
  3. `size3-two-down` — osd.0 and osd.4 down: **7 inactive**, 50 degraded (two failures on different hosts
     do block some PGs).
  4. `size2-min1` — one OSD down: 0 inactive, 17 degraded, writes go to one copy; then osd.4 down too:
     **2 PGs stale** (no copy left), and writes taken while degraded are gone (rule 5).
  5. `dr-s2` — from DR S2 and `student/configs/hq/hqc/ceph-osd-pool-ls-detail.txt`: pool `vm-rbd` is
     `size 2 min_size 2` (and `cephfs_data` too); osd.15 dies at 10:40 and "ten minutes later several VMs
     'hang'": the PGs that had a copy on osd.15 go inactive. Derived share ≈ 2 × (osd.15 weight / total) of
     512 PGs ≈ 33 (check with the engine on the DR tree).
  6. `host-down` — size 3/2, a whole host down: all 128 PGs degraded, 0 inactive.
- **Steps:** 2 per failure (fail, write) + 1 summary: presets 1, 2, 6: 3; preset 3: 5; preset 4: 5;
  `dr-s2`: 4 (fail, ten minutes later, write, summary).
- **Legend:** clean (solid), degraded (hatched), inactive (crossed + "⏸"), stale (dark + "∅"), down OSD
  (crossed row). "Changed" marks PGs whose state changed in this step.
- **Captions:**
  - hr: „`size=2, min_size=2`: jedan disk manje i 17 grupa smještaja (*placement group*) ostaje s jednom
    kopijom — ispod `min_size`, pa se pisanje u njih zaustavlja."
  - en: "size 3, min_size 2: the same disk loss leaves 30 PGs degraded, and every write still goes through."
- **Terms:** placement group (PG) — grupa smještaja (check); replica — kopija; degraded — degradirano
  (check); inactive — neaktivno; I/O blocked — zaustavljen U/I; OSD — OSD (spremišni demon, check).
- **Misconceptions:** "size 2 means one disk may fail"; "min_size 1 is safer because I/O never stops";
  "a degraded pool is a stopped pool".
- **Out of scope:** recovery and backfill timing (`ceph-down-out`), placement rules (`crush-failure-domain`),
  EC pools (`ec-vs-replication`), MON quorum (`quorum-split-brain`).
- **Reuse note:** the soft dependency on `quorum-split-brain` is weak: only the "at least N of M" threshold
  idea is shared; nothing of its model is needed. (Catalogue §5.7: this is the one native page for
  size/min_size; cephsim and faultline `sizeTwo` link to it.)

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ceph-min-size sims/ceph-min-size` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ceph-min-size/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
