# lnx-rsync-delete: rsync, trailing slashes and --delete

| | |
|---|---|
| Task | `lnx-rsync-delete` (wave 3, Linux) |
| Catalogue entry | `lnx-rsync-delete` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-rsync-delete/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL, DR |
| Topic / tags / level | `linux-admin` / `backup` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **src vs src/, and how --delete mirrors a mistake**.

The student: sync, delete at source, sync again.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-15/`
- Catalogue seed: UL ch15
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md`, section "Prijenos i sinkronizacija datoteka" (`sftp` listing of the server home, `rsync -avn`/`-av` with and without the trailing slash, `ls` of `vjezba-rsync` and `vjezba-rsync2`), its "Šire o temi" (`-a` = `-rlptgoD`, `--delete` warning) and Primjer 3 ("prenijeti direktorij na poslužitelj i ne obrisati previše")
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`, "`rsync`: kopija kao stanje, i alat koji unaprijed kaže što će učiniti" (dry run with `--delete`, quick check vs `-c`) and "Više kopija u vremenu: `--link-dest` i točka oporavka"
- rsync(1): DESCRIPTION (trailing slash), `--delete`, `--dry-run`, as cited in ch15
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S3.md` and `/home/rjasmin/projects/dr-lecture-estate/student/configs/hq/hq-fs01/schtasks-mirror.txt` (nightly mirror with delete semantics carries the encryption)

## Model and presets

- **Scene:** left, the source tree on `democli1` (`~/vjezba/`: `a.txt`, `pod/b.txt`); right, the destination tree on 192.168.122.57 (`~/vjezba-rsync/`, `~/vjezba-rsync2/`, and the rest of the home directory from the book's `sftp` listing: `a.txt`, `nohup.out`, `paketi`, `pokvaren.rpm`, `proba`, `tajna`, `vjezba-scp`); top, the command line assembled from the params, with the source's trailing slash drawn large; bottom, the transfer list exactly as `rsync -v` prints it (`created directory …`, `./`, `a.txt`, `deleting …`, `(DRY RUN)`).
- **State:** `{ src: tree, dst: tree, cmd: { slash, delete, dryRun, dest }, list: [lines], changed: [paths], deleted: [paths], lastRunDry }`. Trees are `{ path: { kind, size, mtime } }`.
- **One step:** one action from the script: run the command, or an event at the source (a file deleted, a file overwritten with bad content, a time passes). A run computes the file list (rule 1), compares (rule 2), copies, deletes (rule 3) unless dry-run (rule 4), and prints the list.
- **Rules:**
  1. A trailing slash on the source means "copy the contents of this directory"; without it, "copy the directory by name", which adds one level at the destination (`vjezba/a.txt`). (ch15 "Prijenos i sinkronizacija datoteka"; rsync(1) DESCRIPTION)
  2. Only files that differ are sent; by default "differ" means size or modification time (quick check), with `-c` a checksum. (ch23 "`rsync`: kopija kao stanje…"; rsync(1))
  3. `--delete` removes from the receiving side the files that are not on the sending side, but only inside the directories being synchronised. (ch15 "Šire o temi"; rsync(1) `--delete`)
  4. `-n` (dry run) changes nothing but prints nearly the same list, including `created directory`; the only difference is `(DRY RUN)` at the end. (ch15; rsync(1) `--dry-run`)
  5. A mirror reflects the source's current state, mistakes included: a file deleted (or ruined) at the source is deleted (or ruined) at the destination on the next run with `--delete`; one copy is one recovery point. (ch23 *točka oporavka*, `--link-dest`; ch15 Primjer 3)
  6. Without the slash the top-level destination directory is not "being synchronised", so `--delete` acts only inside `dest/vjezba/`; with the slash and the wrong destination (a home directory), everything there that is not in the source is in the delete list. (rsync(1) `--delete` scope, check)
  7. Tie-break for the printed list: directories before their contents, then alphabetical, as in the book's listings; `deleting` lines first. (check against rsync output order)
- **Params:** `slash` toggle, default on; `delete` toggle, default off; `dryRun` toggle, default off; `dest` choice `~/vjezba-rsync/` | `~/vjezba-rsync2/` | `~/` (wrong destination), default `~/vjezba-rsync/`. Each run uses the params at that moment; changing a param re-runs from step 0 (`resets`).
- **Presets:**
  - `book-slash` — `rsync -av ~/vjezba/ …:~/vjezba-rsync/` gives `a.txt`, `pod`; `rsync -av ~/vjezba …:~/vjezba-rsync2/` gives `vjezba` inside it. From ch15 (listings and `ls` of both).
  - `delete-propagates` — sync; `rm a.txt` at the source; sync without `--delete` (destination keeps `a.txt`); sync with `--delete` (`deleting a.txt`; gone). From ch15 Primjer 3 ("Brisanje"), example derived.
  - `dry-run-first` — `-avn --delete` prints `deleting a.txt` and `(DRY RUN)`, the destination unchanged; then the real run. From ch15 Primjer 3 and ch23 (`rsync -a -n -v --delete`).
  - `wrong-destination` — `rsync -avn --delete ~/vjezba/ …:~/`: the dry run lists `deleting nohup.out`, `paketi`, `pokvaren.rpm`, `proba`, `tajna`, `vjezba-rsync/…`, `vjezba-rsync2/…`, `vjezba-scp`; the page stops there and shows what the real run would remove. Derived from ch15's `sftp` listing, unchecked.
  - `nightly-mirror` — a source file is encrypted by malware at 21:00; the nightly mirror job with delete semantics at 22:00 replaces the good copy. Ties to DR scenario S3 (the file server's nightly mirror to the NAS). Derived from dr-lecture-estate S3, unchecked.
- **Steps:** `book-slash` 2, `delete-propagates` 4, `dry-run-first` 3, `wrong-destination` 1 (plus a "what would happen" view), `nightly-mirror` 3.
- **Legend:** file present on both (solid), copied this run (arrow + outline), to be deleted (red strike), deleted (ghost), dry-run result (dashed, "DRY RUN" stamp), extra directory level (highlighted bracket). "Changed" marks destination entries created, updated or deleted by this step.
- **Captions:**
  - HR: „Na izvoru je `a.txt` obrisan, a `--delete` je to vjerno ponovio na odredištu. Zrcalo nije povijest: ono pokazuje samo kako izvor izgleda sada.“
  - EN: "`a.txt` was deleted at the source, and `--delete` faithfully repeated that at the destination. A mirror is not history: it shows only what the source looks like now."
- **Terms:** synchronisation — sinkronizacija; dry run — probni prolaz; trailing slash — kosa crta na kraju; source / destination — izvorište / odredište; recovery point — točka oporavka; delta transfer — prijenos razlika; mirror — zrcalo.
- **Misconceptions:** the slash is cosmetic; `--delete` makes the copy "more exact" and therefore safer; a nightly mirror is a backup.
- **Out of scope:** `--link-dest` snapshots (named as the fix), `--backup`/`--backup-dir`, filters and `--exclude`, daemon mode, the delta algorithm itself.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-rsync-delete sims/lnx-rsync-delete` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-rsync-delete/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
