# backup-window: Backup window and offsite seeding

| | |
|---|---|
| Task | `backup-window` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-backup-window` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/backup-window/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | DR |
| Topic / tags / level | `storage` / `backup` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `backup-diff-incr` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **data size vs bandwidth vs window; why the first offsite copy goes by truck**.

The student: sliders for size, change rate, link speed.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/backup-diff-incr/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T28 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T28
- DR estate (student side): `student/handbook/sites.md` (site internet links: HQ 1000/1000, Brackenridge
  300/50, Harrow Street 80/20 Mbit/s; WAN links table), `student/configs/hq/hq-nas02/shares-and-dumps.txt`
  (fs-mirror 21.4 TB, vzdump 10.4 TB), `student/handbook/constraints.md` (change windows, cloud storage and
  egress prices), scenario `student/scenarios/S8.md`
- UL ch23 "Potpuna i prirasna kopija…" for full vs incremental terms

## Model and presets

- **Scene:** a 24-hour clock bar with the **backup window** shaded (e.g. 19:00–07:00); below it two
  transfer bars drawn to the same time scale: **first full copy** and **nightly incremental**, each
  wrapping over as many nights as it needs (night 1, night 2, …). Beside them a **truck** lane: copy to
  disks locally, drive, copy in. Big numbers: hours for the full, hours for the nightly change, nights to
  seed, "fits / does not fit".
- **State:** pure function of params: `{ sizeTB, changePct, linkMbit, efficiency, windowH, localMBs,
  driveH }` → `{ fullH, incrH, nightsToSeed, fitsNightly, truckH }`.
- **Live:** every slider recomputes the outputs and redraws both bars; the truck lane appears when the
  full copy takes more than `seedNightsMax` nights (default 3).
- **Rules** (arithmetic; all derived, with decimal units as link speeds are quoted):
  1. Transfer time = bytes × 8 / (link bit/s × efficiency); 1 TB = 10¹² B, 1 Mbit/s = 10⁶ bit/s. Efficiency
     (protocol overhead, sharing the link) default 0.8 (derived, (check) against a measured run).
  2. Nightly incremental = `sizeTB × changePct` (link `backup-diff-incr`: the incremental stores only what
     changed).
  3. Fits when transfer time ≤ window length; otherwise the job runs into working hours (shown in the
     clock bar as overflow).
  4. Seeding over the link takes ⌈fullH / windowH⌉ nights, during which new changes pile up (each night's
     change is added to the queue; if `incrH > windowH` the queue never drains: "never catches up").
  5. Truck time = sizeTB × 10¹² / (localMBs × 10⁶) / 3600 (copy out) + `driveH` + the same copy in; the
     first full goes by truck, nightly increments over the link ("seeding").
  6. Tie-break: equal times → prefer the link (no handling of disks) (derived).
- **Params:** `sizeTB` range 0.5–100 (21.4); `changePct` range 0.1–10 % (1); `linkMbit` choice 20 / 50 /
  80 / 300 / 500 / 1000 / 10000 (1000); `efficiency` range 0.5–1.0 (0.8); `windowH` range 4–14 (12);
  `localMBs` range 100–1000 (200); `driveH` range 0–12 (2).
- **Presets** (sizes and links from the DR estate; times derived, at efficiency 1.0 unless noted):
  1. `hq-to-cloud` — HQ NAS mirror 21.4 TB (DR `configs/hq/hq-nas02/shares-and-dumps.txt`) over HQ's
     1000/1000 Mbit/s (`handbook/sites.md`): full **47.6 h** (≈ 4 twelve-hour windows); nightly 1 % =
     214 GB in **0.48 h**, fits easily.
  2. `brk-uplink` — the same 21.4 TB from Brackenridge's 50 Mbit/s upload (`sites.md`, 300/50): full
     **39.6 days**; nightly 1 % takes **9.5 h**, barely inside a 12 h window; at 2 % it no longer fits.
  3. `truck` — preset 2 by disk: copy out at 200 MB/s ≈ **29.7 h**, drive 2 h, copy in ≈ 29.7 h ≈ 2.6
     days instead of 39.6 days; then nightly increments over the link.
  4. `vm-dumps-to-nas` — 10.4 TB of VM dumps (`shares-and-dumps.txt`) over 1000 Mbit/s: **23.1 h** for a
     full set, i.e. a nightly *full* cannot fit any window; incremental or dedup is required.
  5. `never-catches-up` — 80 Mbit/s branch link (`sites.md` Harrow Street, 80/20: use the 20 Mbit/s
     upload), 5 TB, 2 % change: nightly 100 GB = **11.1 h** at 20 Mbit/s, so with an 8 h window the
     queue grows every night (rule 4).
- **Steps:** explorer, no steps.
- **Legend:** window (shaded band), transfer (solid bar), overflow into working hours (hatched, "!"),
  truck (dashed lane with a van icon). "Changed" marks outputs that crossed a threshold (fits ↔ does not
  fit) after the last change.
- **Captions:**
  - hr: „Prva potpuna kopija (*full backup*) od 21,4 TB preko 50 Mbit/s traje 39,6 dana. Kamionom s
    diskovima: manje od tri dana."
  - en: "1 % daily change is 214 GB: under half an hour at 1 Gbit/s, but 9.5 hours over the branch's
    50 Mbit/s upload."
- **Terms:** backup window — prozor za kopiranje (check); offsite copy — kopija izvan lokacije / izmještena
  kopija (NLA T28 „izmještanje"); seeding — početno punjenje (check); bandwidth — propusnost (URM);
  change rate — stopa promjene; full / incremental — potpuna / prirasna kopija (UL ch23).
- **Misconceptions:** "1 Gbit/s moves a terabyte in seconds" (it takes 2.2 h at full rate); "if the nightly
  increment fits, the first full fits too"; "the upload speed equals the download speed" (asymmetric links).
- **Out of scope:** dedup and compression ratios (link `dedup-chunking`), WAN acceleration, restore time
  (that is RTO: link `rpo-rto`), costs (S8's price list could feed a later preset).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `backup-window` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh backup-window sims/backup-window` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/backup-window/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
