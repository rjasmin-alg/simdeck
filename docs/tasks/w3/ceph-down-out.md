# ceph-down-out: down vs out

| | |
|---|---|
| Task | `ceph-down-out` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-ceph-down-out` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/ceph-down-out/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `storage` / `storage-cluster` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ceph-min-size` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **down is degraded and nothing moves; out triggers rebalancing after a timer**.

The student: stop an OSD, let time pass.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/ceph-min-size/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/cephsim/js/engine/` (pure CRUSH/PG engine) and `/home/rjasmin/projects/cephsim/js/samples.js`
- Catalogue seed: cephsim
- cephsim specifics: `js/engine/recovery.js` (`planRecovery`, `Recovery`: down queues no work; recovery
  before backfill; rates from link bandwidth × `recoveryFraction`, `maxBackfills`), `js/engine/pgmap.js`
  (`pgState`: out = reweight 0 handled by CRUSH, down subtracted afterwards), `js/sim.js` (time model; out is
  manual in cephsim, there is no down→out timer)
- DR estate (student side): `student/configs/hq/hqc/ceph-osd-tree.txt` (osd.22 shown `down`, reweight 0, i.e.
  already out), `ceph-df.txt` (37.88 % raw used), scenario `student/scenarios/S2.md`
- Ceph documentation "Configuring Monitor/OSD Interaction" (`osd_heartbeat_grace`,
  `mon_osd_down_out_interval`), "Placement Group States", and the `noout` flag in "Operating a Cluster"
  *(check titles and defaults)*

## Model and presets

- **Scene:** reuses `ceph-min-size`'s grid (OSD rows × PG cells, size 3 / min_size 2, cephsim
  `hyperconverged`). Added: a **clock** with two timers (heartbeat grace, down→out interval), each OSD's two
  flags shown separately as `up/down` and `in/out`, and a **data-movement bar** (bytes queued / moved,
  recovery vs backfill).
- **State:** reuses `ceph-min-size`'s `{raw, down, counts}`; new: `{ t, osd: {id: {up, in, downSince}},
  flags: {noout}, plan: {items, totalBytes, movedBytes, kind}, rate }`.
- **One step:** advance the clock to the next event (stop → marked down → timer expires / OSD returns →
  marked out → recovery progress at 25 / 50 / 100 %), recompute PG states and the movement plan.
- **Rules:**
  1. A stopped OSD is marked **down** after peers miss heartbeats for the grace period
     (`osd_heartbeat_grace`, default 20 s) (Ceph docs "Configuring Monitor/OSD Interaction") (check).
  2. **Down but in**: its PGs are degraded, CRUSH still maps data to it, **nothing moves** (cephsim
     `recovery.js` `planRecovery`: "marking an OSD down queues no work at all").
  3. After `mon_osd_down_out_interval` (default 600 s) a down OSD is marked **out** (weight 0); CRUSH remaps
     its PGs to other OSDs and recovery starts (same Ceph docs) (check).
  4. Work for PGs short of live copies is **recovery** (urgent, first); work for PGs with all copies but in
     the wrong place is **backfill** (cephsim `planRecovery`: recovery items sorted first).
  5. If the OSD comes back before the timer, it is marked up again and only catches up on writes it missed
     (log-based; cephsim does not model the PG log — show it as "small catch-up") (check).
  6. The `noout` flag stops rule 3 (planned maintenance): the OSD stays in, PGs stay degraded, no data moves.
  7. Marking an OSD **out while it is still up** (draining) moves data off it with no degraded PGs: backfill
     only (cephsim `pgState`: remapped, not degraded).
  8. Recovery time = bytes to move / recovery rate (cephsim: per-host bandwidth × `recoveryFraction` 0.5,
     `maxBackfills` 1); the demo uses a fixed rate parameter.
- **Params:** `downOut` choice 60 / 600 / 1800 s (600); `noout` toggle (off); `returnAt` choice never / 5 min /
  15 min (never); `rateMBs` choice 100 / 200 / 500 (200); `dataTiB` range 0.5–4 on the OSD (2.7).
- **Presets** (timers from Ceph defaults (check); bytes and times derived):
  1. `dead-disk` — osd.0 stops at 0 s: down at **20 s**, PGs degraded, 0 bytes moving; out at **620 s**;
     recovery of 2.7 TiB at 200 MB/s ≈ **4.1 h**, then clean. (2.7 TiB ≈ 37 % of the DR cluster's 7.28 TiB
     HDDs, its raw fill in `ceph-df.txt`; the grid itself stays the 12-OSD `hyperconverged` layout.)
  2. `reboot` — osd.0 returns after **5 min**: never marked out, no rebalancing; small catch-up, clean.
  3. `slow-reboot` — returns after 15 min: it was out at 620 s, so a full remap started and is now partly
     undone (data moves twice) (derived).
  4. `maintenance-noout` — `noout` set, osd.0 down for 30 min: degraded the whole time, 0 bytes moved.
  5. `drain` — osd.0 marked out while up: backfill only, **0 degraded PGs** throughout.
- **Steps:** `dead-disk` 7 (stop, down, wait, out, 25 %, 50 %, 100 %); `reboot` 4; `slow-reboot` 7;
  `maintenance-noout` 4; `drain` 5.
- **Legend (adds to `ceph-min-size`):** `up/in` (solid), `down/in` (hatched, "↓"), `down/out` (crossed,
  "↓ out"), `up/out` (outline, "out"), recovery (solid bar), backfill (striped bar), timer (clock icon).
  "Changed" marks OSD flags and PG states that changed in this step.
- **Captions:**
  - hr: „osd.0 je pao (*down*), ali je još unutra (*in*): grupe smještaja su degradirane, a podaci se ne
    miču. Za 600 s monitori će ga izbaciti (*out*)."
  - en: "osd.0 came back after 5 minutes, before the 600 s timer: no rebalancing at all, only the writes it
    missed."
- **Terms:** down / up — pao / radi (check); out / in — izbačen / uključen (check); recovery — oporavak;
  backfill — popunjavanje (check); rebalancing — preraspodjela (check); heartbeat — otkucaj (signal
  života) (check); maintenance flag — zastavica za održavanje.
- **Misconceptions:** "Ceph starts copying the moment a disk dies"; "down and out are the same"; "setting
  noout makes the cluster safe during maintenance" (it stays degraded).
- **Out of scope:** min_size and blocked I/O (`ceph-min-size`), placement rules (`crush-failure-domain`),
  flapping and `mon_osd_min_down_reporters`, recovery priorities and sleep tuning.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ceph-down-out sims/ceph-down-out` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ceph-down-out/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
