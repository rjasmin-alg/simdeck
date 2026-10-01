# ec-vs-replication: Erasure coding vs replication

| | |
|---|---|
| Task | `ec-vs-replication` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-ec-vs-replication` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/ec-vs-replication/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `storage` / `storage-cluster`, `replication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **overhead vs failures tolerated vs rebuild cost (k+m)**.

The student: choose k, m, replicas; fail disks.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `/home/rjasmin/projects/cephsim/js/engine/` (pure CRUSH/PG engine) and `/home/rjasmin/projects/cephsim/js/samples.js`
- Catalogue seed: cephsim → §5.7
- cephsim specifics: `js/engine/pgmap.js` (`poolWidth`, `poolMinSize`, `poolEfficiency`, `pgState`) and
  `js/samples.js` `threeRacks` (pools `cephfs_data` / `rgw_data` 4+2 with `min_size: 4`). Note cephsim's
  `poolMinSize` defaults EC to k, while Ceph's documented default is k + 1 *(check)*
- `~/projects/napredna-linux-administracija/meta/toc.md` T26 (Ceph — RADOS, RBD, CephFS)
- Ceph documentation "Erasure code" and "Pools" (`size`, `min_size`) *(check)*

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Scene:** K2 topology (or own drawing until it exists): one object of `S` = 4 MiB drawn on the left; a
  row of hosts each with one disk; the object's pieces placed on distinct hosts: `n` full replicas, or
  `k` data shards + `m` coding shards of S/k each. Below, a comparison table for the current scheme and
  the alternative: **raw / usable**, **efficiency**, **disks that may fail with data intact**, **disks
  that may fail with I/O continuing**, **bytes read to rebuild one lost disk**. Clicking a host fails it.
- **State:** `{ scheme: 'rep'|'ec', n, k, m, minSize, hosts: [{id, up}], placement: hostId[], failed:
  hostId[] }` → derived `{ efficiency, tolerated, writable, readable, rebuildRead }`.
- **Live:** changing n/k/m redraws the shards; failing hosts updates readable/writable at once.
- **Rules** (cephsim `js/engine/pgmap.js`: `poolWidth`, `poolEfficiency`, `pgState`; Ceph docs
  "Erasure code" and "Pools") (check):
  1. Replication stores `n` full copies: raw = n × S, efficiency 1/n; erasure coding stores k + m shards of
     S/k: raw = (k+m)/k × S, efficiency k/(k+m) (`poolEfficiency`).
  2. Data survives while at least 1 replica (replication) or at least k shards (EC) remain: tolerates n − 1
     or m failures.
  3. I/O continues only while live pieces ≥ `min_size` (`pgState`: active iff up ≥ min_size). Defaults:
     replicated min_size = size − ⌊size/2⌋ (3 → 2); EC min_size = k + 1 (Ceph docs "Pools", `min_size`)
     (check). So 4+2 keeps data after 2 failures but stops writes after the second.
  4. Rebuilding one lost piece: replication reads one surviving copy (S); EC reads k shards of S/k (also S
     in total) to rebuild a piece of only S/k — per lost byte, EC reads **k ×** as much. For a whole lost
     disk of D bytes: replication reads D, EC reads k × D (derived; standard result) (check).
  5. Pieces of one object go to distinct failure domains (one per host here; see `crush-failure-domain`);
     a scheme needs at least n or k + m hosts, otherwise it cannot be placed (cephsim `NONE` holes).
  6. Tie-break when comparing: equal efficiency (e.g. 4+2 and 2+1 both 67 %) → the one tolerating more
     failures is listed first.
- **Params:** `scheme` choice replication / EC (EC); `n` range 2–4 (3); `k` range 2–8 (4); `m` range 1–3 (2);
  `minSize` choice default / custom (default); `hosts` range 3–12 (9); click a host to fail or restore it.
- **Presets** (rules 1–4 derived and checked by hand; failure counts from the cephsim engine on its
  `threeRacks` sample, `cephfs_data` 4+2, 1024 PGs):
  1. `three-copies` — 3× replication: 300 % raw, **33 %** usable; data survives 2 failures, I/O continues
     after 1, stops after 2 (min_size 2); rebuilding an 8 TB disk reads **8 TB**.
  2. `ec-4-2` — 4+2: **150 %** raw, **67 %** usable; data survives 2 failures, I/O after 1 (min_size 5);
     rebuilding an 8 TB disk reads **32 TB**. cephsim, one OSD down: 59 of 1024 PGs degraded, 0 inactive;
     two OSDs on different hosts: 121 degraded, **6 inactive**.
  3. `ec-8-3` — 8+3: 137.5 % raw, 72.7 % usable, survives 3, needs ≥ 11 hosts; rebuild reads 8 × the lost
     data.
  4. `same-hardware` — 60 TiB of data (cephsim `threeRacks` `cephfs_data`): 3× needs **180 TiB** raw, 4+2
     needs **90 TiB**.
  5. `min-size-k` — 4+2 with min_size set to k = 4 (as cephsim's sample does): after a rack of 3 hosts is
     lost, cephsim reports 271 of 1024 PGs inactive; with the default k + 1 = 5, **783 inactive** (cephsim
     engine run). Shows min_size is a separate safety knob.
- **Steps:** explorer, no steps.
- **Legend:** full replica (square, full height), data shard (short bar, "d"), coding shard (short bar,
  hatched, "c"), failed host (crossed), "I/O stops" banner (warn colour **and** text). "Changed" marks pieces
  whose state changed after the last click.
- **Captions:**
  - hr: „Kodiranje s brisanjem (*erasure coding*) 4+2 troši 150 % prostora umjesto 300 %, ali za obnovu
    jednog izgubljenog diska čita četiri puta više podataka."
  - en: "Two hosts are down: the 4+2 object is still complete (4 of 6 shards), but writes stop, because
    min_size is 5."
- **Terms:** replication — replikacija; replica — kopija (replika); erasure coding — kodiranje s brisanjem
  (check); data / coding shard — podatkovni / zaštitni dio (check); overhead — dodatni prostor; rebuild —
  obnova (ossimulator `raid-cache` uses „obnova"); failure domain — domena kvara (faultline / NLA, check).
- **Misconceptions:** "EC is free redundancy" (rebuild cost, small-write cost); "surviving m failures means
  service continues through m failures"; "4+2 and 2+1 are equally safe because both use 67 %".
- **Out of scope:** CRUSH placement details (`crush-failure-domain`), EC plugins and Reed–Solomon maths,
  partial-stripe write penalty in depth, RAID 5/6 (ossimulator `raid-cache`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ec-vs-replication sims/ec-vs-replication` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ec-vs-replication/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
