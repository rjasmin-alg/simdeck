# retention-gfs: Retention: grandfather-father-son

| | |
|---|---|
| Task | `retention-gfs` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-retention-gfs` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/retention-gfs/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | DR, UL |
| Topic / tags / level | `storage` / `backup` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `backup-diff-incr` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **how many copies a schedule keeps and how far back you can go**.

The student: set daily/weekly/monthly counts, run a year.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/backup-diff-incr/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-23/`
- Catalogue seed: UL ch23 Example 6 → §5.3
- UL ch23: section "Potpuna i prirasna kopija, i datoteka koja pamti razliku" (definicija „retencija"),
  "Više kopija u vremenu: `--link-dest` i točka oporavka" (definicija „točka oporavka"), and Primjer 6
  "koliko kopija čuvati, i kako tu odluku obraniti" (the two questions: spacing and how far back)
- `~/projects/dr-lecture-estate/student/configs/hq/hq-nas02/shares-and-dumps.txt` (7 daily + 4 weekly
  vzdump archives, "prune runs only after a successful job") and
  `~/projects/dr-lecture-estate/student/logs/hqc/vzdump-history.txt` (jobs failing from 2026-09-14);
  scenario `student/scenarios/S8.md`
- Proxmox Backup Server documentation "Backup Pruning" (keep-last/-daily/-weekly/-monthly/-yearly, processing
  order) and the PBS prune simulator; `vzdump(1)` `--prune-backups` *(check)*

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Scene:** a calendar strip of one year (days as small cells, ISO weeks as columns, months marked), one
  backup per day at 01:40. Each kept backup is a mark on the strip tagged by the rule that keeps it
  (`D` daily, `W` weekly, `M` monthly, `Y` yearly); pruned ones fade out. Side panel: **copies kept**,
  **oldest restore point (age in days)**, **largest gap between points**, and, if `detectAfter` is set, a
  verdict "a fault found after N days has / has no clean point before it". Reuses `backup-diff-incr` only
  for the day/set vocabulary; the block grid is not needed (explorer, draw own strip and say so).
- **State:** `{ start, end, today, backups: date[], kept: [{date, rule}], failFrom: date|null, params }`;
  the explorer recomputes the whole run from params (pure function of params).
- **Live:** changing any count reruns the year from `start`, applying the prune after every successful
  nightly job, and redraws.
- **Rules** (the prune semantics of the backup server in the DR estate; vendor doc and its prune
  simulator in Sources) (check):
  1. Options are applied in the order last, daily, weekly, monthly, yearly.
  2. `keep-daily N` keeps the newest backup of each of the last N days that have a backup; weekly uses ISO
     weeks, monthly calendar months, yearly calendar years; within a period the newest backup is kept.
  3. Each option only considers backups **older** than everything already kept by the options before it;
     a period already covered by an earlier option is skipped, not counted (this is why 7 daily + 4 weekly
     gives 11 points, not overlap).
  4. Pruning runs after each **successful** job only; when the job fails, nothing new is added and nothing
     old is removed (DR `configs/hq/hq-nas02/shares-and-dumps.txt`, comment line).
  5. Tie-break: two backups on one day → the later one counts for that day (rule 2).
  6. Prune is progressive: a backup removed today is gone, even if a later monthly rule "would have" kept
     it. So the monthly point is the last *surviving* weekly of that month (derived; e.g. 2026-01-25, not
     2026-01-31) (check with the vendor's prune simulator).
- **Params:** `last` range 0–30 (0); `daily` 0–14 (7); `weekly` 0–8 (4); `monthly` 0–24 (12); `yearly` 0–5
  (0); `failFrom` choice none / 2026-09-14 (none); `detectAfter` range 0–400 days (0 = off).
- **Presets** (run 2026-01-01 → 2026-12-31 unless noted; derived with a script reproducing rules 1–6):
  1. `ul-primjer-6` — from UL ch23 Primjer 6: "how long can a fault go unnoticed?" 7 daily + 4 weekly,
     `detectAfter` 42 (six weeks): on 2026-12-31 the kept points are 2026-11-29, 12-06, 12-13, 12-20 and
     12-25 … 12-31 (11 copies), oldest **32 days**: **no clean point** for a fault introduced 42 days ago.
  2. `gfs-7-4-12` — adds 12 monthly: **21 copies** (7 + 4 + 10; only ten months are older than the weekly
     span in a one-year run), oldest 2026-01-25, **340 days** back.
  3. `last-30` — keep-last 30 only: 30 copies, oldest 29 days. More copies than preset 2, a tenth of the
     reach.
  4. `dr-vm-dumps` — from DR `shares-and-dumps.txt`: 7 daily + 4 weekly, run 2026-08-01 → 2026-09-13: kept
     2026-08-16, 08-23, 08-30, 09-06 (Sundays, weekly) and 09-07 … 09-13 (daily) = 11, matching the listing of nightly VM dumps.
  5. `dr-vm-dumps-failing` — preset 4 with `failFrom` 2026-09-14 and run to 2026-11-01: the same 11 archives
     stay (rule 4), the newest restore point is **49 days old**, and nobody is told (link
     `alert-to-nobody`, `restore-drill`).
- **Steps:** explorer, no steps.
- **Legend:** daily mark (small square), weekly (circle), monthly (diamond), yearly (star), pruned (faded
  outline), failed job day (cross). "Changed" marks the points that appear or disappear after a parameter
  change.
- **Captions:**
  - hr: „7 dnevnih i 4 tjedne kopije: 11 točaka oporavka (*recovery point*), najstarija 32 dana. Greška
    primijećena nakon šest tjedana nema se gdje vratiti."
  - en: "Jobs have failed since 14 September, so the prune never ran: the same 11 archives sit there and the
    newest is 49 days old."
- **Terms:** retention — retencija (UL ch23 definicija); recovery point — točka oporavka (UL ch23);
  grandfather-father-son — djed-otac-sin (GFS) (check); prune — orezivanje (check);
  daily/weekly/monthly copy — dnevna/tjedna/mjesečna kopija; restore — oporavak.
- **Misconceptions:** "more copies means further back"; "7 daily + 4 weekly = 11 weeks"; "if the backup
  job fails, the old backups are deleted / are still fine and recent".
- **Out of scope:** storage cost per copy (incremental vs full: `backup-diff-incr`), offsite rotation,
  tape media rotation (Tower of Hanoi), legal retention rules, immutability/object lock.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `retention-gfs` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh retention-gfs sims/retention-gfs` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/retention-gfs/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
