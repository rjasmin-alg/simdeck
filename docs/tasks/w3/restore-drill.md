# restore-drill: The backup that lies

| | |
|---|---|
| Task | `restore-drill` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-restore-drill` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/restore-drill/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | DR, UL |
| Topic / tags / level | `storage` / `backup` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `backup-diff-incr` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **backups report OK; only a test restore shows they're empty**.

The student: run the job for weeks, then restore.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/backup-diff-incr/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-23/`
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S8.md` (DR estate scenario)
- Catalogue seed: DR S8, UL ch23 (provjera-arhive-i-proba-oporavka.svg) → §5.3
- UL ch23 sections "Sigurnosne kopije i oporavak → Što treba znati" (the `named` archive, definitions
  „sigurnosna kopija", „proba oporavka"), "Tri načina da kopija izgleda dobro" (kvar 1–3), figure
  `provjera-arhive-i-proba-oporavka.svg`, Primjer 1 („kopija se radi svaku noć, sve je uredno") and Primjer 2
  („vratili smo iz kopije, i program se ne pokreće")
- DR estate (student side only): `student/logs/p4-commit/p4-nightly.log` (2026-10-11 "Disk quota exceeded"
  then "nightly OK"), `student/configs/colo/p4-commit/checkpoints-ls.txt` (1,214,000 B checkpoint) and
  `crontab-root.txt` (verify script that no longer exists); `student/logs/hqc/vzdump-history.txt`
- S8 itself is a capacity/cost brief; the "backup that lies" evidence is in the logs above, not in S8's text

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Scene:** left, the **source** (the list of what should be copied, with sizes); middle, a row of nightly
  or weekly **archives** (size bar, date); right, a **checks table**: one row per check the operator could
  rely on (file exists · size vs last time · `tar -t` · `tar -d` · `gzip -t` · exit status of the job ·
  restore + compare with the source), one column per archive, each cell ✓ / ✗ with its literal output
  (`izlazni status: 0`, `Only in …`). The check the operator *actually* relies on (param) is outlined; at
  the end the restore result is shown under it.
- **State:** `{ source: [{path, bytes}], jobs: [{date, members: path[], bytes, exitStatus, log: string}],
  fault: {kind, fromJob}, reliedOn: checkId, cursor, restored: path[]|null }`. Reuses `backup-diff-incr`'s
  set/archive vocabulary; nothing else is needed from its model.
- **One step:** one job run (archive appears, the relied-on check is evaluated and shown as the "dashboard"
  status); after the last job: (1) restore into an empty directory, (2) compare with the source list,
  (3) reveal every check's verdict for every archive.
- **Rules** (each from UL ch23 "Sigurnosne kopije i oporavak" and "Tri načina da kopija izgleda dobro"):
  1. `tar -t` and `tar -d` ask the archive about itself; a file that never entered the archive cannot be
     reported by either („ono što u arhivu nikad nije ušlo ne može prijaviti").
  2. The job's exit status is the only trace of a scope fault when tar saw the problem, and it exists once:
     if the job does not capture it, it is lost (status 2 in the book's cases).
  3. A scope fault that tar never sees (shell glob `*` skips dot-files) gives status 0 everywhere; only
     restore + `diff -r` against the source finds it (`Only in …: .postavke`, status 1).
  4. A content fault (truncated archive) is caught by `gzip -t` (status 1) and `tar -t` (prints members,
     **then** fails with status 2): a partial listing is not proof.
  5. An empty archive (no read permission) lists nothing with status 0, the same output as a clean
     `tar -d`: zero lines and status 0 have two opposite meanings.
  6. Only a restore to another place compared with **what should have been copied** answers the question
     (definicija „proba oporavka").
  7. Tie-break for the dashboard: when several checks are relied on, the dashboard is green if all relied-on
     checks pass (derived).
- **Params:** `reliedOn` choice exists / size / `tar -t` / `tar -d` / exit status / restore (default exists);
  `fault` select per preset; `weeks` range 4–8 (DR preset only, default 8).
- **Presets:**
  1. `ul-named` — from UL ch23 "Što treba znati": three files to copy, `lab.local.zone` absent; job status
     **2**, archive 1671 B; `tar -tvzf` lists 2 members, status 0; `tar -dzf` status 0; restore + compare
     with the 3-name list: one missing. Dashboard on `tar -d`: green.
  2. `ul-dotfile` — UL ch23 kvar 1: `tar -czf kvar1.tar.gz *` in a directory with 16 entries incl.
     `.postavke`; tar gets 15 names, archive lists 19 members; create, list, extract all status 0;
     `diff -r` prints `Only in /var/tmp/vjezba23/izvor/vjezba17: .postavke`, status 1.
  3. `ul-truncated` — UL ch23 kvar 2: 1671 B archive cut by 200 B to 1471 B; `gzip -t` status 1
     ("unexpected end of file"); `tar -tzf` prints both members, then "Unexpected EOF", status 2; here the
     archive checks work (content, not scope).
  4. `ul-empty` — UL ch23 kvar 3: no `sudo`; job status 2 with two "Permission denied" lines; archive 45 B;
     `tar -tvzf` prints nothing, status 0.
  5. `dr-checkpoint` — the version-control server's weekly checkpoint, from DR `logs/p4-commit/p4-nightly.log` and
     `configs/colo/p4-commit/checkpoints-ls.txt`: weekly checkpoints 2026-09-13 … 11-01 of 131.1–133.0 GB,
     but `checkpoint.20261011.gz` is **1,214,000 B**; the log shows "Disk quota exceeded" at 02:16:40 and
     "nightly OK" at 02:58:12 the same night. Dashboard on the log line: green all 8 weeks; size
     check: ✗ on 10-11 only; restore of 10-11: unusable.
- **Steps:** jobs + 3 (restore, compare, reveal): `ul-named` 4, `ul-dotfile` 4, `ul-truncated` 4, `ul-empty`
  4, `dr-checkpoint` 11 (8 weeks). The UL presets run as one job each; a "same job for 4 nights" variant
  of `ul-dotfile` (7 steps) shows the green dashboard repeating.
- **Legend:** archive (box with size bar), check passed (✓, filled), failed (✗, hatched), the relied-on check
  (thick outline, "nadzor"), missing file in the restore (dashed outline with "nema" label). "Changed" marks
  the archive created and the check evaluated in this step.
- **Captions:**
  - hr: „Tri naredbe, tri nule: arhiva je napravljena, popisana i raspakirana. Tek usporedba s izvornikom
    kaže da `.postavke` nikad nije ušla u kopiju."
  - en: "Week of 11 October: the log says 'nightly OK', but the checkpoint is 1.2 MB instead of
    132 GB. Only the size check and the restore notice."
- **Terms:** backup — sigurnosna kopija (UL ch23); restore test — proba oporavka (UL ch23); exit status —
  izlazni status (UL ch17/ch23); archive — arhiva; scope vs content (of a backup) — opseg i sadržaj (UL
  ch23); recovery point — točka oporavka.
- **Misconceptions:** "the job reported OK, so the backup is good"; "`tar -t` worked, so the archive is
  complete"; "a partial listing proves the archive is readable".
- **Out of scope:** the pipeline/`pipefail` mechanics (that is `lnx-exit-status`; link its pipefail preset
  here, catalogue §5.3), dedicated backup tools' repository checks (UL ch23 mentions them; not needed here), alert delivery
  (`alert-to-nobody`), retention (`retention-gfs`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `restore-drill` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh restore-drill sims/restore-drill` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/restore-drill/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
