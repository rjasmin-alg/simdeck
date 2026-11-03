<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-rsync-delete: notes

New stepper (task `docs/tasks/w3/lnx-rsync-delete.md`, catalogue `lnx-rsync-delete` §4.4). No kit view fits (two file
trees and a text list), so the page draws its own stage in HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **A real model of the run, not a script of lists.** `run(src, dst, cmd)` builds the file list, the delete scope, the
  quick check and the printed order from the trees; every list on the page comes out of it. Scenarios are scripts of
  *actions* (run, `rm`, encrypt, wait), so a student can flip the slash or the destination and see what really happens
  (e.g. `nightly-mirror` without the slash puts `vjezba/` inside the mirror and deletes nothing).
- **Directory mtimes are modelled.** That is what makes rsync print `./` after a file is removed at the source
  (`delete-propagates` step 3) and not after a run that already synced the directory time. Without it the lists would
  not match real rsync.
- **Scenario = hidden param `script`.** Presets set it (and the flags the scenario fixes, so the disabled toggles show
  the value the runs really use). The select is hidden (`visible: false`) so the panel fits at 1920×1080 with three
  disabled flags and their reasons; the five presets are the scenario chooser.
- **Fixed flags.** A run may fix flags (`delete-propagates` run 3 without, run 4 with `--delete`); the rest follow the
  params at that moment. `book-slash` run 2 is "the other one": slash flipped, the other directory. A flag fixed in
  every run of the scenario is disabled with the reason "set by the scenario".
- **Default = `delete-propagates`** (4 steps, `sim.json` `steps: 4`): the student task in the brief is "sync, delete at
  source, sync again". Presets keep the task's order (book-slash first), so key 2 is the default story.
- **Server home.** From the book's `sftp` listing; kinds from earlier chapters: `proba/` a directory (ch05),
  `tajna` an empty file (ch07), `paketi/` with the `tmux` rpm and `pokvaren.rpm` 400000 B (ch09). `nohup.out`'s size is
  not shown (unknown). `paketi/` and `vjezba-scp/` are drawn folded with a count, so the wrong-destination home fits.
- **The home's `a.txt` is the `scp` copy**: `scp` without `-p` gives it the time of the copy, so with the slash into
  `~/` the quick check sends it again (rule 2 on screen), and it is the one entry that would survive.
- **Nightly mirror encrypts into a new name** (`a.txt` → `a.txt.locked`), as DR S3 describes ("files … have a new
  extension"). So the mirror run *deletes* the good copy and sends the encrypted one: `--delete` is what carries the
  mistake. The scenario keeps the task's times (21:00, 22:00, 07:50); nothing from S3's timeline or from `instructor/`.
- **Output.** `sending incremental file list`, `created directory …`, the `deleting` lines, the transfer list, a blank
  line, `total size is N` (+ ` (DRY RUN)`). The `sent … bytes` line and `speedup` are left out (protocol bytes the model
  does not have). Steps that do not run rsync show the previous run's output dimmed, under a note.
- **Concepts, not tools:** `rsync` is the subject (UL ch15/ch23 teach it by name), so its command and output appear.
  The malware is "malware"; the DR job's tool is not named.

## Checked against rsync

rsync 3.2.7 (protocol 31) on nuc, 2026-11-03, local trees shaped like the book's (`~/vjezba` = `a.txt` 11 B,
`pod/b.txt` 6 B; the server home with the `sftp` listing's entries). Each list matched the model line for line:

- the book's three listings (slash, no slash, `-n` with `created directory`), and an empty list on a re-run;
- after `rm a.txt`: `./` alone without `--delete`; `deleting a.txt` alone when the directory time was already synced;
  `deleting a.txt`, `./` when it was not; `deleting vjezba/a.txt`, `vjezba/` without the slash;
- `-avn --delete ~/vjezba/ home/`: the 19 `deleting` lines in exactly SPEC.md's order (reverse name order, files after
  directories, contents before their directory), then `./`, `a.txt`, `pod/`, `pod/b.txt`; without the slash: no
  `deleting`, `vjezba/…`;
- deletions in two directories plus changes: the order is **not fixed** (incremental recursion). The reviewer's 40
  runs gave `deleting zz`, `./`, `a.txt`, `deleting pod/old`, `pod/`, `pod/new` 36 times (the model's order) and
  all-deletions-first 4 times; `--no-inc-recursive` gives a third order. No preset has deletions in two directories;
- the nightly run: `deleting a.txt`, `./`, `a.txt.locked`;
- quick check vs `-c`: same size and mtime, other content: not sent; with `-c`: sent.

## Deviations from the task

- No `sent … bytes` / `speedup` in the printed list (see Decisions).
- Rule 7 refined from rsync's real order: inside a directory files come before subdirectories, deletions are in
  *reverse* order, and a directory's deletions come just before its own line (the task said "alphabetical, `deleting`
  lines first"; that holds whenever the deletions sit in one directory, which is every preset).
- `nightly-mirror` encrypts into a new name instead of overwriting in place (S3), so its mechanism is `--delete`.
- The scenario select is hidden (presets choose the scenario); `script` is a param the task did not list.
- The "what would happen" view of `wrong-destination` is the dry-run drawing itself (struck rows, dashed arrows, the
  stamp), not a separate panel.

## Unchecked *(check)*

- What `~/proba` holds on the book's server at the time of ch15 (ch05 removed and the listing shows it again); drawn
  as an empty directory.
- `paketi/` may hold more than the one rpm ch09 names.
- rsync 3.4.1 (the book's server) may differ from 3.2.7 in the `deleting` order; the man page's description of
  `--delete-during` is unchanged.

## Term pairs (missing from `kit/glossary.js`)

Written out in both tables until the coordinator adds them (`"src": "simdeck"`, Croatian from UL ch15/ch23):

| English | Croatian |
|---|---|
| dry run | probni prolaz |
| trailing slash | kosa crta na kraju |
| synchronisation | sinkronizacija |
| source / destination | izvorište / odredište |
| delta transfer | prijenos razlika |
| mirror | zrcalo |

Used from the glossary: *recovery point* (točka oporavka), *backup* (sigurnosna kopija).

## Shared requests

- **kit (0.6.0): a param's `visible()` has no effect.** `syncState` sets `wrap.hidden`, but `.sd-ctl { display: flex }`
  in `kit.css` beats the UA's `[hidden] { display: none }`. Smallest fix: `.sd-ctl[hidden] { display: none; }` in
  `kit.css`. Worked around in this page's CSS with the same rule under `[data-sim="lnx-rsync-delete"]`; drop it once the
  kit has it.

## Sources

`SPEC.md` "Sources": UL ch15 "Prijenos i sinkronizacija datoteka" (+ "Šire o temi", Primjer 3), UL ch23 "`rsync`:
kopija kao stanje…" and "Više kopija u vremenu", UL ch05/ch07/ch09 for the home's entries, rsync(1) as cited in ch15,
rsync 3.2.7 on nuc, DR S3 and `hq-fs01/schtasks-mirror.txt` (student material).

## Review

A fresh reviewer (a subagent with only SPEC.md, sim.js and sim.test.js, working on a copy) read the model against the
SPEC, broke 40 rules and tie-breaks one at a time, and replayed every preset with rsync 3.2.7:

- All five presets matched real rsync line for line (wrong-destination identical over 30 runs).
- Every break of rules 1–7 failed at least one test. The gaps it found, all fixed: the two dry-run guards masked
  each other (now one guard in `run()`, caught by the direct test); no test for the clock, for a directory outside the
  list taking the clock's mtime, or for `changed` being step-local (three tests added).
- SPEC said a dry run leaves the clock unchanged; every action ticks it. SPEC corrected (it only affects the mtime of
  a touched directory outside the list).
- Test 3 asserted "all deletions first" across two directories; real rsync usually interleaves (above). Model and
  test changed to the common order, and rule 7 now says the cross-directory order is not fixed.
- Afterwards: 30 tests; the dry-run guard broken alone fails a test.

## Timing

Start 2026-11-03 22:56, done 2026-11-03 23:18: about 22 minutes of wall-clock time for one session (model, rsync checks, page, review).
