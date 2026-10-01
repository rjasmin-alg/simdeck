# backup-diff-incr: Differential vs incremental

| | |
|---|---|
| Task | `backup-diff-incr` (wave 2b, Storage and backup) |
| Catalogue entry | `sto-backup-diff-incr` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/backup-diff-incr/` |
| Class | stepper |
| Size | S |
| Priority | B1 |
| Courses | DR, UL |
| Topic / tags / level | `storage` / `backup` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **what each backup stores, and what a restore needs**.

The student: change blocks over a week, restore on Thursday.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-23/`
  - section "Potpuna i prirasna kopija, i datoteka koja pamti razliku" (definitions „potpuna kopija",
    „prirasna kopija", „datoteka snimka"; `tar -g`, razina 0 / razina 1) and figure
    `lanac-prirasnih-kopija.svg`
  - Primjer 6 "koliko kopija čuvati, i kako tu odluku obraniti" (the trade-off: make cheap vs restore cheap)
- GNU tar manual, "Using tar to Perform Incremental Dumps" (`--listed-incremental`, copying the snapshot file
  for repeated level-1 dumps) *(check)*; the book does not define "differential"
- `docs/proposal-simdeck.md` (first batch) and `docs/playbook.md` §10.8
- Catalogue seed: proposal first batch; UL ch23 (lanac-prirasnih-kopija.svg) → §5.3

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Scene:** K3 block grid. Top: the live disk, 8 blocks `0..7` with content labels (`A`…`H`, a changed block
  gets a version suffix, `B1`, `B2`). Below: one row per backup set (Sun … Thu), each showing only the blocks
  it stores; a tag per set: `razina 0` / `prirasna` / `diferencijalna`. Right: two counters, **stored blocks
  so far** and, during a restore, **sets needed / blocks read**. Mode switch shows incremental and
  differential rows side by side when `compare` is on.
- **State:** `{ day: 0..4, disk: string[8], changed: {sinceLast: Set, sinceFull: Set}, sets: [{day, kind,
  blocks: {idx: label}}], lost: dayIndex|null, restore: {target, plan: dayIndex[], applied: n, result:
  string[8]|null, ok: bool}|null, mode: 'incr'|'diff'|'full' }` (Sets serialised as sorted arrays).
- **One step:** a week runs as pairs of steps per day: (a) the day's changes are written to the disk
  (blocks highlighted), (b) the night's backup is taken and its row appears. After Thursday: (c) choose
  the restore target, (d) apply one set per step, oldest first, (e) compare the restored disk with
  Thursday's disk.
- **Rules:**
  1. A full backup (level 0) stores every block, changed or not; with `tar -g` it is what you get when the
     snapshot file does not exist yet (UL ch23 "Potpuna i prirasna kopija, i datoteka koja pamti razliku",
     definicija „potpuna kopija").
  2. An incremental backup stores the blocks changed since the **previous backup of any kind** (level 1
     with the same snapshot file) (UL ch23, definicija „prirasna kopija").
  3. A differential backup stores the blocks changed since the **last full** backup; with GNU tar this is a
     level-1 dump made each night from a fresh copy of the level-0 snapshot file (GNU tar manual
     "Using tar to Perform Incremental Dumps"; UL ch23 footnote ch23-tar-snapshot-copy) (check wording).
  4. Restore to day d: incremental needs the full plus **every** incremental after it up to d, applied in
     order; differential needs the full plus the differential of day d only (UL ch23,
     slika lanac-prirasnih-kopija).
  5. Applying sets in order, a later set's block overwrites an earlier one (newest wins).
  6. A missing set in an incremental chain makes every later point unrestorable: the restore stops at the
     last day before the gap and says so; it never silently returns old blocks as if they were current
     (UL ch23: „ako iz njega jedna arhiva otpadne, otpada i sve što za njom slijedi"). In differential mode
     only the lost day itself is unrestorable.
  7. Tie-break: a block changed twice in one day is stored once, with its last content.
- **Params:** `mode` choice incremental / differential / full every night (default incremental); `compare`
  toggle (side by side, default off); `restoreDay` choice Mon–Thu (default Thu); `lose` select none / Mon /
  Tue / Wed (default none).
- **Presets** (changes: Mon {1}, Tue {3,4}, Wed {1,6}, Thu {0}; derived, numbers checked by hand):
  1. `week-incremental` — from UL ch23 slika lanac-prirasnih-kopija, with numbers: stored 8 + 1 + 2 + 2 + 1 =
     **14 blocks**; restore Thursday needs **5 sets** (Sun, Mon, Tue, Wed, Thu), 14 blocks read; block 1
     arrives twice (Mon `B1`, then Wed `B2` wins).
  2. `week-differential` — stored 8 + 1 + 3 + 4 + 5 = **21 blocks**; restore Thursday needs **2 sets** (Sun,
     Thu), 13 blocks read.
  3. `full-nightly` — stored 8 × 5 = **40 blocks**; restore needs 1 set, 8 blocks.
  4. `lost-tuesday` — incremental with Tuesday's set lost: restoring Thursday fails; the newest restorable
     point is **Monday** (blocks 3 and 4 would otherwise come back as Sunday's `D`, `E`). Same loss in
     differential mode: Thursday restores from Sun + Thu.
  5. `compare` — presets 1 and 2 side by side: "cheap to make, expensive to restore" vs the reverse (UL ch23
     „jedna je skupa da se napravi i jeftina da se vrati, druga obrnuto").
- **Steps:** 10 (five days × 2) + 1 (choose target) + sets applied + 1 (compare): `week-incremental` 17,
  `week-differential` 14, `full-nightly` 13, `lost-tuesday` 14 (stops after Mon + 1 failure step),
  `compare` 17 (both columns advance together; the shorter restore waits).
- **Legend:** unchanged block (plain), changed today (highlight), stored in this set (solid), not stored
  (empty slot), restored block (outlined with the set's day letter), missing set (crossed row). "Changed"
  marks the blocks written or stored in this step.
- **Captions:**
  - hr: „Četvrtak, prirasna kopija (*incremental backup*): sprema se samo blok 0, jer je od srijede samo on
    promijenjen. Za povratak na četvrtak trebat će svih pet kopija."
  - en: "Thursday, differential: blocks 0, 1, 3, 4 and 6, everything changed since Sunday's full backup.
    Restoring Thursday needs only Sunday and this set."
- **Terms:** full backup — potpuna kopija; incremental backup — prirasna kopija; differential backup —
  diferencijalna kopija (not in UL; check with the author); level 0 / level 1 — razina 0 / razina 1;
  snapshot file — datoteka snimka; restore — oporavak / vraćanje; recovery point — točka oporavka.
- **Misconceptions:** "incremental and differential are the same"; "an incremental backup is a complete
  backup of the day"; "losing one nightly backup loses one night".
- **Out of scope:** retention (link `retention-gfs`), dedup (link `dedup-chunking`), synthetic fulls,
  `rsync --link-dest` trees (UL ch23 covers them; possible later preset), snapshot send/receive (that is
  `lnx-send-receive`, a preset of this sim per catalogue §5.3, its own task).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `backup-diff-incr` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh backup-diff-incr sims/backup-diff-incr` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/backup-diff-incr/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
