<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backup-diff-incr: notes

New stepper (task `docs/tasks/w2/backup-diff-incr.md`, catalogue `sto-backup-diff-incr`, overlap §5.3), drawn on kit
view **K3: block grid** (`kit/blockgrid.js`, kit 0.6.0). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Lanes.** The task's state has one `sets`/`restore`/`mode`; `compare` needs two modes over one disk, so `sets`,
  `stored` and `restore` live per lane (`lanes[]`), the disk, its history and `lost` are shared. `compare` always
  shows incremental (left) and differential (right) and ignores `mode` (the toggle's hint says so).
- **Sunday is two steps too.** Step 1 writes the data (blocks A–H), step 2 is the level-0 backup, so the week is a
  uniform 10 steps and the full backup's "everything is new" is visible.
- **Thursday writes block 0 twice** (`A1`, then `A2`): the task gives the changes as sets (Thu {0}), and the double
  write makes the rule 7 tie-break visible in every preset without changing a number. The disk shows `A2`.
- **A lost set shows at step 11** (choosing the target), when a restore needs it: it is crossed (`bad`) with the tag
  "izgubljena"/"lost". Before that it was made like any other set.
- **The failure step** replaces the compare step (`lost-tuesday` 14 steps, as the task says). It names the state that
  was really restored ("Monday's, not Thursday's"), strikes the blocks that differ from the target (`dead`), says
  which blocks a restore that skipped the gap would bring back stale (3 and 4 as `D`, `E`), and in single incremental
  mode points at the differential case. "Newest restorable point" is said only when it differs from what was
  restored (in incremental mode it is the same day). A differential or full restore whose target set is lost stops
  the same way (differential: after Sunday; full: nothing restored).
- **Compare:** both lanes advance together; the differential lane compares at step 14 and then shows "done,
  waiting" with its result kept; at the last step the caption gives both totals (book's „jedna je skupa da se
  napravi i jeftina da se vrati, druga obrnuto"). If a lane failed, that verdict is left out.
- **Every param resets** to step 0 (each changes the step count). `lose` offers Mon–Wed only (task); losing Sunday's
  full is out of scope.
- **K3 use:** disk = one grid (column labels 0–7, the row label is the day); each lane = one grid, a row per night
  (label the day, aside the set's tag), then the restored row (`soft` cells, the source set's day as `sub`). Not
  stored = an empty free cell; a night not reached yet = holes. The set applied in a step gets one `now` link down the
  column of its first block. Restore counters are the grid's `meta`, stored blocks its `count`.
- **Concepts, not tools:** no tool is named on the page. The snapshot file and levels 0/1 are named as concepts (the
  UL definitions); the archiver is only in Sources.
- **`related`:** `dedup-chunking`. `retention-gfs` and `lnx-send-receive` do not exist yet.
- **Model is promotable:** `write`, `kindOf`, `setBlocks`, `planFor`, `newestRestorable`, `restoreLen` are pure
  functions over arrays; `WEEK` is data; no words.

## Deviations from the task

- State shape per lane (above).
- The hr caption follows the kit's term rule (*incremental backup* (prirasna kopija) at first mention, English alone
  after), not the task's „prirasna kopija (*incremental backup*)" order.
- Thursday's block 0 is `A2`, not `A1` (double write, above).

## Sources

- UL `book/chapters/23-odrzavanje-sustava.md`, „Potpuna i prirasna kopija, i datoteka koja pamti razliku"
  (definicije „potpuna kopija", „prirasna kopija", „datoteka snimka"; razina 0 / razina 1; „treba cijeli niz, redom,
  i ako iz njega jedna arhiva otpadne, otpada i sve što za njom slijedi"; „jedna je skupa da se napravi i jeftina da
  se vrati, druga obrnuto"), figure `lanac-prirasnih-kopija.svg`; footnotes ch23-tar-snapshot and
  ch23-tar-snapshot-copy; Primjer 6.
- GNU tar manual §5.2 "Using tar to Perform Incremental Dumps" (`--listed-incremental`, the working copy of the
  snapshot file for repeated level-1 dumps), as quoted by UL ch23; not re-read online *(check)*.
- "Differential" is not defined in UL: the standard definition (since the last full) is used; the wording
  „diferencijalna kopija" *(check with the author)*.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| differential backup | diferencijalna kopija *(check)* |
| level 0 / level 1 | razina 0 / razina 1 (UL ch23) |
| restore | oporavak / vraćanje (UL ch23) |

Used from the glossary: backup, full backup, incremental backup, snapshot file, recovery point.

## Shared requests

None. `kit/` and `models/` unchanged.

## Checks

- `node --test sims/backup-diff-incr/sim.test.js`: 16 tests pass; `npm test` (1748) and `npm run check` pass. Every rule broken once (8 mutants: double write
  keeps the first content, Sunday not full, incremental from since-full, differential from since-last, differential
  plan = whole chain, oldest wins, the gap skipped, newest restorable ignores the loss): all killed.
- `npm run gate -- backup-diff-incr`: pass (61/61 browser checks). Screenshots looked at: the gate's 1920×1080 light,
  dark, grayscale, panel hidden and 375×812 in both languages; extra states scripted: every preset's end, steps 3, 8,
  10, 11, 12, 13, 15 of the incremental week, compare 10/14/15/17 (hr, en, dark), lost-tuesday 11/14 (hr, en),
  differential with the target's own set lost, full with the target's set lost, phone mid-compare.
- Phone: the lane grids scroll sideways inside their box (the kit's K3 phone behaviour), the page does not.

## Status left at wip

Everything in COMMON.md §8 holds, but `status: "ready"` makes `npm test` fail in `tests/landing.test.mjs` ("home at
1920×1080 …: first shelf's tiles end at … 1277"). This would be the sixth ready `storage` sim, the first shelf on the
home page wraps to a second row of tiles, and that row ends below 1080 px. The test (site frame) assumes the first
shelf fits one row. With `wip` the test passes. Setting `ready` is one line once the site handles a shelf of six or
more (cap or scroll the shelf, or check only its first row).

## Review

A fresh reviewer read the diff against `SPEC.md` and the task. Their own reference model, written from the rules
alone, matched the sim on every count in all 96 combinations of mode × restoreDay × lose × compare. They ran 28
mutants of `sim.js`: 24 were killed. Of the 4 survivors, two are equivalent; one only changes `sinceFull` at step 1,
which the page hides; the last changed `wrong` when nothing is restored, and a new assertion now covers it.

They found these caption defects, all fixed:
- The double-write caption lost its first value: one node was used for two placeholders.
- In compare, a lane whose restore had stopped at a gap was later shown as "done, waiting". It now reads "the restore
  stopped, state: …".
- The compare verdict claimed a difference when both lanes needed the same number of sets (restore to Monday). It
  also had a Croatian case error ("2 kopija"). It now gives the numbers without a counted noun, and has its own
  sentence when the counts are equal.
- The incremental cost caption overclaimed when the chain was only 2 sets long. It now has a "chain still short"
  variant.
- English wording fixes: "all 2 sets", and "is changed" changed to "was changed". In compare, Croatian text after the
  lane name now starts in lower case.

## Time

Start 2026-10-04 09:54 CEST, done 10:16 CEST (about 22 minutes, plus the review).

# Preset task `lnx-send-receive`: snapshot send and receive

Task `docs/tasks/w3/lnx-send-receive.md` (catalogue `lnx-send-receive`, §4.4; overlap §5.3). Rules, data and expected
numbers: `SPEC.md`, "Send and receive". Presets `send-chain`, `missing-parent`, `common-kept`, `target-touched`; entry
`send-chain` in `sim.json`.

## Decisions

- **The host model could not express it, so the change is in this folder.** The task says to file a shared request
  and stop if the host cannot express the applied receive or the both-sides precondition; it could not (one disk, no
  second machine, no named snapshots, no deletion). As the `win-vss`, `win-boot`, `win-update-rings` and
  `win-failover-cluster` preset tasks did with their hosts, and running unattended with the host merged, I added an
  opt-in flow to `sim.js`: param `repl` (`off` by default) and `force`, functions `normRepl`, `snapOf`,
  `commonParent`, `commonSnaps`, `makeStream`, `receiveCheck`, `receive`, `storedOn`, `refsOf`, data `SEND_WEEK`,
  `REPL`, `TOUCH`. The host's scenes are unchanged: `norm` is untouched, `steps`/`initial`/`step` only branch when
  `repl` names a case, and a test checks that every host state keeps exactly its old fields. Pure functions over
  plain data, no words: promotable to `models/` with the host's.
- **Scripted cases, one op per step** (`REPL`): `send` (the day's writes, its read-only snapshot, the send and the
  receive in one step: the task's "one step per day"), `resend`, `del`, `touch`, `restore`. Monday's data is on the
  source at step 0, so step 1 is the first snapshot and full send.
- **Parent choice.** Scripted sends use the newest common snapshot (rule 5). `missing-parent`'s Tuesday names `@mon`
  explicitly (what an operator who did not know the target lost it would type), so the refusal is visible; its fourth
  step falls back to the newest common one, which is none, so the send is full.
- **A full receive keeps the target's other snapshots** (a new filesystem beside them). In ZFS a full stream into an
  existing dataset needs a new name or `-F`; the generic model does not show that *(check)*. In the presets a full
  receive only lands on a target with no snapshots, so nothing depends on it.
- **Target modified** is ZFS's case (the caption says so); Btrfs receives into read-only snapshots, said in the
  explanation. One generic model for both, as the task's coordinator note asks.
- **Scene (K3):** two grids side by side, source (blue) and target (orange); the stream is the target grid's top row
  with a bracket naming the pair; refused = the carried cells `bad` and "✕ odbijeno"; common = "⇄" beside the
  snapshot on both sides (the word went: with it the asides squeezed the cells); parent and "šalje se" as tags;
  deleted = the row crossed (`dead`) with the snapshot's old content and "obrisana"; sharing within a side = `soft`
  with ×n; the file written on the target is green (`c: 3`), and after a forced receive the cell shows the lost `F*`
  as its second line and the row says "vraćeno, upis izgubljen". Each grid counts the blocks stored on that machine
  (distinct block contents over its snapshots and its data): 11 on the target after the chain.
- **Legend and explanation per scene:** `data-mode` on `<html>` (`host` / `send`) hides the other scene's legend
  items and explanation, as `lnx-cow-filesystem` does; the subtitle and the stage's label change with it. The host's
  four params hide in the send scene; `repl` is always hidden (its presets choose it); `force` shows only in
  `target-touched`.
- **Presets in two columns** (nine now), so the panel fits one screen; the host's look is otherwise unchanged.
- **Snapshot names** `@mon`, `@tue`, `@wed` are data in both languages (the task's captions use them so).
- **Concepts, not tools:** ZFS and Btrfs are named (NLA T22, T23 teach them). `send -i`, `send -p` and `receive -F`
  appear only in the explanation, as the subject; the stage uses `@mon → @tue`. Man pages only in Sources.

## Deviations from the task

- Host model extended in this folder instead of a shared request and stop (above).
- Captions: the task's caption is used at Wednesday's send („Inkrementalno slanje od `@tue` do `@wed` nosi samo
  jedan blok. Na odredištu je `@wed` time cijeli datotečni sustav: za oporavak srijede ne treba lanac."), with the
  count as a numeral („1 blok").
- The task's metadata (topic `linux-admin`, tag `snapshots`, level `advanced`) has no place in a preset entry; the
  host keeps `storage` / `backup` / `intro`. See the report.

## Sources

- NLA `meta/toc.md` T22 („Btrfs — podvolumeni, snimke, `send`/`receive`…") and T23 („ZFS na Linuxu…"); no chapters
  yet, so every rule is *(check)*.
- zfs-send(8) (`-i`, `-I`), zfs-receive(8) (`-F`: roll back to the most recent snapshot; refuses a target modified
  since it), btrfs-send(8) (`-p`, read-only subvolumes), btrfs-receive(8): from memory, not re-read online *(check)*.
- Related lab `~/projects/single-page-labs/zfs-btrfs-topology-lab.html` not used.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| snapshot | snimka (NLA toc T20/T22) |
| replication | replikacija |
| incremental send | inkrementalno slanje *(check)* |
| parent snapshot | roditeljska snimka *(check)* |
| stream | tok *(check)* |
| receive | primanje |
| forced receive | prisilno primanje *(check)* |

## Checks

- `node --test sims/backup-diff-incr/sim.test.js`: 23 tests (16 host + 7 send); every send rule broken once
  (8 mutants: oldest common parent, stream carries every block, read-only ignored, no-parent check gone, modified
  ignored, receive not applied, silent rollback, delete ignored): all killed.
- `npm run gate -- backup-diff-incr`: pass (62/62; the entry `send-chain` opens). Screenshots looked at: every step of
  the four presets in hr and en at 1920×1080, `target-touched` with `force` in both, dark (`send-chain` 4), grayscale
  (`missing-parent` 3), 375×812 (`send-chain` 3, `missing-parent` 3), and the host's own gate shots (host legend
  only, panel fits). Phone: the grids scroll inside their box, as the host's lanes do.

## Time

Start 2026-11-12 20:29 CET, done 20:44 CET (about 15 minutes).
