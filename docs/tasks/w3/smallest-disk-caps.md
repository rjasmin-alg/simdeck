# smallest-disk-caps: One small or full disk caps the pool

| | |
|---|---|
| Task | `smallest-disk-caps` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-smallest-disk-caps` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/smallest-disk-caps/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `storage` / `storage-cluster` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ceph-min-size` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the fullest OSD sets MAX AVAIL; uneven hosts fill first**.

The student: add mismatched disks, fill the pool.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/ceph-min-size/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/cephsim/js/engine/` (pure CRUSH/PG engine) and `/home/rjasmin/projects/cephsim/js/samples.js`
- `/home/rjasmin/projects/cluster-design-sim-scoping.md` §5
- Catalogue seed: cephsim, scoping note §5
- cephsim specifics: `js/engine/capacity.js` (`RATIOS`, `osdUsage`, `ruleAvail` from `PGMap::get_rule_avail`,
  `poolDf`, `clusterDf`) and `js/samples.js` `unbalanced` (the comment explains rule 4); numbers in preset 1
  from running the engine
- `~/projects/cluster-design-sim-scoping.md` §5 item 2 (447 GB disk caps a 44 TB tier) and
  `~/projects/faultline/PEDAGOGY.md` §7 item 2
- DR estate (student side): `student/configs/hq/hqc/ceph-df.txt`, `ceph-health.txt` (osd.13 nearfull),
  `ceph-osd-tree.txt`; scenario `student/scenarios/S8.md` ("Ceph is only 38 % full")
- Ceph documentation "Monitoring a Cluster" (`ceph df`, MAX AVAIL) and the full-ratio settings
  (`mon_osd_full_ratio` etc.) *(check)*

## Model and presets

- **Scene:** hosts as columns, OSDs as vertical fill bars (height ∝ size, fill ∝ used) with the three
  threshold lines **nearfull 85 %**, **backfillfull 90 %**, **full 95 %**. Header: a `ceph df`-style box
  with **raw used %** (the "38 % full" number) next to the pool's **MAX AVAIL**, and a marker on the fullest
  OSD ("this one decides"). A slider "store more data" fills all bars in proportion.
- **State:** pure function of params → `{ osds: [{id, host, sizeTiB, usedTiB, ratio}], rawRatio,
  maxAvailTiB, fullest, headroomTiB }`; reuses `ceph-min-size`'s pool `{size, minSize}` and its
  per-OSD placement fixture from the cephsim engine.
- **Live:** changing disks or stored data recomputes per-OSD usage and MAX AVAIL.
- **Rules** (cephsim `js/engine/capacity.js`; Ceph docs "Monitoring a Cluster: `ceph df`" and "Storage
  Capacity: full ratios") (check):
  1. Each OSD's used bytes = sum of the shards/replicas placed on it (`osdUsage`).
  2. Thresholds: nearfull 0.85, backfillfull 0.90, full 0.95 of an OSD's size (`RATIOS`; Ceph defaults);
     at full, writes to PGs on that OSD stop.
  3. **MAX AVAIL** is a projection from the OSD that will reach the full ratio first, given its share of the
     rule's CRUSH weight: min over OSDs of (size × 0.95 − used) / share, times the pool's efficiency
     (`ruleAvail`, ported from `PGMap::get_rule_avail`). Raw free space does not enter it.
  4. With size 3 and failure domain host on 3 hosts, **every host holds a full copy**, whatever its disk
     count; a host with fewer or smaller disks fills faster (cephsim `unbalanced` comment). Different disk
     sizes alone do not do this (CRUSH weights by size).
  5. Adding disks to the large host does not raise the cap (rule 4).
  6. Tie-break: equal fill ratios → the fullest OSD shown is the lowest id.
- **Params:** `smallHostDisks` range 1–12 (2); `bigHostDisks` range 2–12 (12); `diskTiB` choice 0.447 / 2 / 8
  (8); `storedTiB` range 0–20 (8); `size` choice 2 / 3 (3).
- **Presets:**
  1. `unbalanced` — cephsim `unbalanced` sample (one host 12 × 8 TiB, two hosts 2 × 8 TiB, size 3, 8 TiB
     stored; engine run): small-host OSDs at **48–53 %**, big-host OSDs at **7–11 %**, raw used **19 %**;
     MAX AVAIL **17.9 TiB** (cephsim projection). Fullest is osd.15 at 53 %.
  2. `add-to-big-host` — preset 1 with 4 more disks on the big host: small hosts unchanged, still the cap
     (rule 5) (derived).
  3. `fill-it` — preset 1, raise stored data: osd.15 crosses nearfull at ≈ 12.8 TiB stored and full at
     ≈ 14.3 TiB (0.95 / 0.53 × 8), while raw used is only about a third (derived, from rule 1 scaling).
     Note: this is well below what the 17.9 TiB MAX AVAIL of preset 1 promises *(check whether real Ceph's
     projection over-promises here as cephsim's does; if not, report to cephsim)*.
  4. `one-small-disk` — scoping §5 item 2: one host's only disk in the tier is 447 GB, size 3, host failure
     domain: every PG needs a replica on it, so the whole tier can hold at most ≈ 0.95 × 447 GB ≈ 425 GB of
     data, whatever the other hosts have (derived).
  5. `dr-38-percent` — from DR `student/configs/hq/hqc/ceph-df.txt`: raw used **37.88 %**, but `vm-rbd` and
     `cephfs_data` show MAX AVAIL **3.4 TiB**, and `ceph-health.txt` reports osd.13 nearfull: the CFO's
     "Ceph is only 38 % full" (scenario S8).
- **Steps:** explorer, no steps.
- **Legend:** OSD bar (outline = size, fill = used), threshold lines (dashed, labelled 85 / 90 / 95), the
  deciding OSD (thick outline + "▲"), host group (frame). "Changed" marks bars that crossed a threshold after
  the last change.
- **Captions:**
  - hr: „Grozd je popunjen 19 %, ali osd.15 je na 53 %: svaki manji poslužitelj nosi cijelu kopiju podataka,
    pa on odlučuje koliko se još može upisati (*MAX AVAIL*)."
  - en: "Four more disks on the big host, and the cap has not moved: the small hosts still hold a full copy
    each."
- **Terms:** raw capacity — sirovi kapacitet; usable capacity — upotrebljivi kapacitet; nearfull / full —
  gotovo pun / pun (check); weight (CRUSH) — težina; failure domain — domena kvara; replica — kopija.
- **Misconceptions:** "38 % used means 62 % free"; "adding disks anywhere adds capacity"; "different disk
  sizes unbalance the cluster" (host imbalance does, rule 4).
- **Out of scope:** the balancer and `reweight`, PG count tuning, device classes, EC capacity (link
  `ec-vs-replication`), thin provisioning overcommit (`lnx-thin-overcommit`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `smallest-disk-caps` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh smallest-disk-caps sims/smallest-disk-caps` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/smallest-disk-caps/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
