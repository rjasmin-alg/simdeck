# lnx-raid-rebuild: Rebuild under load and the second failure

| | |
|---|---|
| Task | `lnx-raid-rebuild` (wave 3, Linux) |
| Catalogue entry | `lnx-raid-rebuild` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-raid-rebuild/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `linux-admin` / `raid` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **a long rebuild, an unreadable sector, a lost array**.

The student: fail a disk, rebuild, hit a URE.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T24 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T24 → §5.3
- NLA row T24 ("`mdadm` u pogonu — gradnja, degradacija, zamjena diska pod opterećenjem") (no chapter yet)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "Redundantno polje diskova" and its "Šire o temi" (levels: RAID 1/4/5/6/10 and how many failures each survives, `resync … speed=201344K/sec`), citing md(4) and mdadm(8)
- Linux kernel Documentation/admin-guide/md.rst (`speed_limit_min`, `speed_limit_max`, bad block list) (check)
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S13.md` (pfx-fs1 RAID6 loses a second and third disk during a rebuild) and `/home/rjasmin/projects/dr-lecture-estate/student/inventory/hosts.csv` (pfx-fs1: 16× 6 TB RAID6, ≈ 76 TB usable, 58 TB used)
- `/home/rjasmin/projects/ossimulator/docs/specs/12-raid-cache.md` §3.5 (rebuild row by row; status vocabulary)

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Reuses from `ossim-raid-cache`:** disk and array status words (disk ok / failed / rebuilding; array optimal / degraded / rebuilding / failed) and "rebuild one row at a time"; RAID levels and parity layout are taken as given and linked, not re-taught. New here: time, a second failure during the rebuild, and unreadable sectors (UREs).
- **Scene (K3 block grid):** columns = disks (4 to 16), rows = 10 bands of the disk (each 10% of capacity); a spare disk to the right that fills band by band during the rebuild; above, `/proc/mdstat`-style status (`[4/3] [UUU_]`, `recovery = 40.0% … finish=…min speed=…K/sec`); right, a clock (hours since the failure), the "window of vulnerability" bar, and the read-error budget: bits read so far and the probability of at least one URE.
- **State:** `{ level: 5|6, n, sizeTB, speedMBs, ureRate, disks: [{ status, bands: [...] }], spare, band, hours, bitsRead, ure: null|{ disk, band }, secondFailAt, array, lostStripes, log }`.
- **One step:** the first step fails a disk and starts the rebuild onto the spare; each further step rebuilds one band (10%): read that band from all surviving disks, compute the missing data, write it to the spare; advance the clock by `sizeTB/10 / speed`; apply any scripted event in that band (second disk failure, URE).
- **Rules:**
  1. Rebuilding one disk reads the whole of every surviving disk: bits read = (n − 1) × size × 8. (ossim-raid-cache rebuild; md(4) recovery)
  2. Rebuild time = size / rebuild speed. md's limits are `speed_limit_min` 1000 KiB/s and `speed_limit_max` 200000 KiB/s; under application load the rebuild is throttled toward the minimum. (kernel Documentation/admin-guide/md.rst `/proc/sys/dev/raid/speed_limit_*`, check; ch12 shows `speed=201344K/sec` for a resync)
  3. URE probability over a rebuild: P(≥ 1) = 1 − (1 − r)^bits ≈ 1 − e^(−r·bits), with r from the disk's datasheet (1 per 10¹⁴ bits typical desktop, 1 per 10¹⁵ enterprise). These are worst-case specifications, not measured rates; say so on the page. (vendor datasheets, check)
  4. RAID 5 degraded has no redundancy left: a URE in a band cannot be corrected. With `onUre = abort` (many hardware controllers) the rebuild stops and the array is failed; with `onUre = badblock` (md with a bad-block log) the band is marked bad on the new disk and the rebuild continues, losing only the data in that stripe. (md(4) "BAD BLOCK LIST", check; controller behaviour, check)
  5. RAID 6 with one disk failed still has one parity: a URE during the rebuild is corrected and the rebuild continues. (ch12 "Šire o temi": RAID 6 survives any two device failures; md(4))
  6. A second disk failure during a RAID 5 rebuild: array failed, data lost. During a RAID 6 rebuild: degraded to zero redundancy; a URE after that loses a stripe, a third failure loses the array. (md(4) levels, as cited in ch12)
  7. Tie-break: if a second failure and a URE fall in the same band, the failure is applied first.
- **Params:** `level` choice 5 | 6, default 5; `n` range 4–16, default 4; `sizeTB` choice 4 | 6 | 12, default 4; `speed` choice `200 MB/s (idle)` | `50 MB/s (under load)`, default 200; `ureRate` choice `1e14` | `1e15`, default `1e14`; `onUre` choice `abort` | `badblock`, default `abort`; `seed` range 1–99, default 7 (decides whether and where a URE happens, via `Simdeck.rng`). All `resets: true`.
- **Presets:**
  - `raid5-ure` — RAID 5, 4 × 4 TB, 1e14, idle: reads 9.6 × 10¹³ bits, P(URE) = 62%; rebuild 5.6 h; seed puts a URE at 60% → rebuild aborts, array failed. Derived, unchecked.
  - `raid5-enterprise` — same with 1e15: P = 9%; seed gives no URE; rebuild completes in 5.6 h. Derived, unchecked.
  - `raid6-ure` — RAID 6, same disks, URE at 60%: corrected from the second parity; rebuild completes. Derived, unchecked.
  - `under-load` — RAID 5, 4 × 4 TB at 50 MB/s: 22 h window instead of 5.6 h; second disk fails at hour 15 → array lost. Derived, unchecked.
  - `pfx-fs1` — RAID 6, 16 × 6 TB (≈ 76 TB usable, 58 TB used), 1e15: one rebuild reads 7.2 × 10¹⁴ bits (P(URE) ≈ 51%, corrected while one parity is left); a second disk fails during the rebuild, then a third → volume offline. From dr-lecture-estate S13 and `inventory/hosts.csv`; the probabilities derived.
- **Steps:** 1 (failure) + 10 bands, fewer if the array fails: `raid5-ure` 7, `raid5-enterprise` 11, `raid6-ure` 11, `under-load` 8, `pfx-fs1` 11.
- **Legend:** healthy band (solid), failed disk (cross pattern + "(F)"), rebuilt band on the spare (striped, then solid), band being read (outline), URE (lightning mark), lost stripe (hatched red), array failed (whole grid greyed). "Changed" marks the band rebuilt in this step and any disk whose status changed.
- **Captions:**
  - HR: „Obnova je na 60 %, a na jednom od preostalih diskova sektor se ne da pročitati. RAID 5 u degradiranom stanju nema čime ga nadomjestiti: obnova staje i polje je izgubljeno.“
  - EN: "The rebuild is at 60% and a sector on one of the surviving disks cannot be read. Degraded RAID 5 has nothing left to rebuild it from: the rebuild stops and the array is lost."
- **Terms:** rebuild — obnova; unrecoverable read error (URE) — nepopravljiva greška čitanja (check); degraded — degradirano (oslabljeno); spare disk — rezervni disk; parity — parnost; stripe — pruga (ossimulator glossary); window of vulnerability — razdoblje ranjivosti (check).
- **Misconceptions:** "RAID 5 survives one failed disk" (it survives the failure, not always the rebuild); the rebuild is quick; a datasheet URE rate is what you will see (it is a bound).
- **Out of scope:** RAID levels and XOR (`ossim-raid-cache`), declustered/distributed spares, scrubbing before failure (`lnx-zfs-self-heal`), SSD failure modes.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-raid-rebuild` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-raid-rebuild sims/lnx-raid-rebuild` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-raid-rebuild/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
