# backup-diff-incr: Differential vs incremental

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w2/backup-diff-incr.md` (catalogue `sto-backup-diff-incr`, §4.6; overlap §5.3). Class: stepper.
Drawn on kit view **K3: block grid** (`kit/blockgrid.js`).

**One concept:** what each backup stores, and what a restore needs. Incremental is cheap to make and expensive to
restore (the whole chain, in order); differential is the reverse (the full plus one set); a lost set in an incremental
chain loses every later point, in a differential one only its own day.

## Scene (K3)

- **Disk** (top grid, one row): 8 blocks `0..7` with content labels `A`…`H`; a rewritten block gets a version suffix
  (`B1`, `B2`). Blocks written in this step are highlighted. During the restore the row shows the target day's disk
  (what the restore must give back).
- **Backup sets** (one grid per lane, below; two side by side when `compare` is on, incremental left, differential
  right): one row per night, Sun … Thu, label = the day, aside = the set's tag (`razina 0` / `prirasna` /
  `diferencijalna` / `potpuna`). A stored block is a solid cell with its content; a block the set does not store is
  an empty slot. The set made in this step is highlighted. A lost set is drawn with every cell crossed (`bad`) and
  the tag "izgubljena" / "lost".
- **Restored disk** (last row of each lane): empty slots that fill as sets are applied, each block with the day of the
  set it came from as a small second line. A block written in this step is highlighted; at the end a block that is
  not the target day's content is struck (`dead`). An arrow joins the set applied in this step to the row.
- **Counters** (foot of each lane): stored blocks so far; during the restore, sets applied of sets needed, and blocks
  read.

## State

```
{ phase: 'start'|'write'|'backup'|'target'|'restore', day: -1..4,
  disk: string[8], ver: number[8], written: [idx], twice: [idx],
  changed: { sinceLast: [idx], sinceFull: [idx] }, history: [disk at the end of each day],
  lanes: [{ mode: 'incr'|'diff'|'full', stored, sets: [{ day, kind: 'full'|'incr'|'diff', blocks: { idx: label } }],
            restore: null | { target, plan: [day], applied, read, result: (label|null)[8], from: (day|null)[8],
                              now: [idx], step: 'apply'|'gap'|'compare'|null, done, ok, end: 'compare'|'gap'|null,
                              reached: day|null, wrong: [idx], newest: day } }],
  lost: day|null, target }
```

Sets are serialised as sorted arrays of indices. **Deviation from the task's state:** `sets`, `restore` and `mode`
live per **lane**, because `compare` runs two modes at once over one disk; `lost` and the disk are shared.

## One step

0. Empty disk, no sets.
1. – 10. Per day (Sun, Mon, Tue, Wed, Thu) two steps: **(a)** the day's writes go to the disk (highlighted);
   **(b)** the night's backup: each lane adds its set row.
11. **(c)** Choose the restore target (`restoreDay`): each lane's plan (the sets it needs) is named; a lost set
    (`lose`) is crossed now, when the restore needs it.
12. – **(d)** one set per lane per step, oldest first, onto the restored disk; **(e)** then one step to compare the
    restored disk with the target day's disk, or, where the next set in the plan is missing, one step that stops
    the restore and says what was really restored. With `compare` both lanes advance together; a lane that has
    finished keeps its result and waits.

Steps = 10 + 1 + max over lanes of (sets applied + 1).

## The week

Writes per day, in order (Sunday writes the data the full backup finds):

| Day | Writes | As a set | Disk at the end of the day |
|---|---|---|---|
| Sun | 0–7 | all | `A B C D E F G H` |
| Mon | 1 | {1} | `A B1 C D E F G H` |
| Tue | 3, 4 | {3, 4} | `A B1 C D1 E1 F G H` |
| Wed | 1, 6 | {1, 6} | `A B2 C D1 E1 F G1 H` |
| Thu | 0, 0 | {0} | `A2 B2 C D1 E1 F G1 H` |

Thursday writes block 0 twice (`A1`, then `A2`): the task's changes are sets, and the double write makes the rule 7
tie-break visible in every preset without changing any number (*decision*, NOTES.md).

## Rules

1. **Full (level 0)** stores every block, changed or not. Sunday's set is always full: with `tar -g` it is what you
   get when the snapshot file does not exist yet. *(UL ch23 „Potpuna i prirasna kopija, i datoteka koja pamti
   razliku", definicija „potpuna kopija" and „datoteka snimka"; GNU tar manual §5.2.)* In mode `full` every night is
   full.
2. **Incremental** stores the blocks changed since the **previous backup of any kind** (level 1 with the same
   snapshot file). *(UL ch23, definicija „prirasna kopija".)*
3. **Differential** stores the blocks changed since the **last full** backup: a level-1 dump made each night from a
   fresh copy of the level-0 snapshot file. *(GNU tar manual §5.2, "it is necessary to create a working copy of the
   snapshot file before running"; UL ch23 footnote ch23-tar-snapshot-copy. The book does not define "differential":
   the definition is the standard one, wording (check).)*
4. **Restore to day d:** incremental needs the full plus **every** incremental after it up to d, in order;
   differential needs the full plus the differential of day d only; full needs the full of day d. *(UL ch23, slika
   lanac-prirasnih-kopija: „treba cijeli niz, redom".)*
5. **Newest wins:** applying sets in order, a later set's block overwrites the earlier one.
6. **A gap stops the restore:** a missing set in the plan stops the restore at the last set before it, and the page
   says which day's state was really restored and which blocks differ from the target; it never returns old blocks
   as if they were current. Incremental: every point from the lost day on is unrestorable (the newest restorable point
   is the day before). Differential and full: only the lost day itself (the day before is restorable from its own
   sets). *(UL ch23: „ako iz njega jedna arhiva otpadne, otpada i sve što za njom slijedi".)*
7. **Tie-break:** a block changed twice in one day is stored once, with its last content.

Tie-break of the view: blocks of a set are applied in index order within the step (one step per set; the order
inside a set does not change the result).

## Params

| Param | Values | Default | Effect |
|---|---|---|---|
| `mode` | incremental / differential / full every night | incremental | the lane's kind of nightly set; ignored while `compare` is on |
| `compare` | toggle | off | incremental and differential side by side |
| `restoreDay` | Mon – Thu (1–4) | Thu | the restore target |
| `lose` | none / Mon / Tue / Wed (0–3) | none | the set lost by restore time |

Every param changes the step count, so each resets to step 0.

## Presets and expected numbers (checked by script, `sim.test.js`)

| Preset | Params | Stored blocks | Restore Thursday | Steps |
|---|---|---|---|---|
| `week-incremental` | defaults | 8 + 1 + 2 + 2 + 1 = **14** | **5 sets** (Sun … Thu), **14** blocks read; block 1 arrives twice (Mon `B1`, Wed `B2` wins) | 17 |
| `week-differential` | `mode: diff` | 8 + 1 + 3 + 4 + 5 = **21** | **2 sets** (Sun, Thu), **13** blocks read | 14 |
| `full-nightly` | `mode: full` | 8 × 5 = **40** | 1 set, 8 blocks | 13 |
| `lost-tuesday` | `lose: Tue` | 14 | fails at Tue; restored = **Monday** (Sun + Mon, 9 blocks read); blocks 0, 1, 3, 4, 6 differ from Thursday. Skipping the gap would bring 3 and 4 back as Sunday's `D`, `E` | 14 |
| `compare` | `compare: on` | 14 vs 21 | 5 sets / 14 read vs 2 sets / 13 read | 17 |

Same loss in differential mode: Thursday restores from Sun + Thu (14 steps); a restore *to Tuesday* then stops after
Sunday (newest restorable point Monday).

## Send and receive (preset task `lnx-send-receive`)

Task: `docs/tasks/w3/lnx-send-receive.md` (catalogue `lnx-send-receive`, §4.4; overlap §5.3). **One concept:**
incremental replication from snapshot pairs. Opt-in: param `repl` (`off` by default = the backup week above, whose
states are unchanged); `force` (receive with rollback) only matters in `target-touched`.

**Scene (K3).** Two grids side by side. **Source** (left): its filesystem (`podaci` / `data`, 8 blocks) and one row
per read-only snapshot, `⚑ @mon`, `⚑ @tue`, `⚑ @wed` (a hole row until taken; a deleted one crossed, `dead`).
**Target** (right): the **stream** row on top (the blocks this step's send carries, the rest empty slots; a bracket
over it names the pair, `@mon → @tue`, or `@mon` for a full send; a refused receive draws the carried blocks `bad` with
"✕" and the reason as the row's aside), then the received snapshots under the same names, then the target's
filesystem, and in `send-chain` a restored row. On both sides a snapshot block that other snapshots of that side share
is hatched (`soft`) with its count (×2, ×3); a block only one snapshot holds is solid. A snapshot both sides hold is
tagged "⇄" on both (common); the parent of this step's send is tagged "roditelj" / "parent". Each grid's counter: blocks
stored on that machine.

**State** (`repl` on): `{ repl, phase: 'start'|'send'|'resend'|'del'|'touch'|'restore', day, op,
src: { live, ver, snaps: [{ day, ro, blocks[8] }], gone: [day] }, tgt: { live, snaps, modified, touched: [idx], gone }, written: [idx],
stream: null | { day, parent, kind: 'full'|'incr', carried: [idx], blocks: { idx: label }, refused }, check: null |
'no-parent' | 'modified' | …, lostWrites: [idx], deleted: null | { side, day }, restore: null | { day, from, read,
result, ok }, history: [source disk per snapshot day] }`.

**Data.** The source's writes: Monday the data (blocks 0–7, `A`…`H`, on the source from step 0), Tuesday blocks 3
and 4 (`D1`, `E1`), Wednesday block 6 (`G1`). A file written on the target lands in block 5 (`F*`).

### Rules

1. **An incremental stream carries only the blocks that differ between the parent and the child snapshot**; a full
   stream carries every block of one snapshot. From `@mon` straight to `@wed` it is the difference (3, 4, 6), not the
   sum of the days. *(zfs-send(8) `-i`; btrfs-send(8) `-p`; (check).)*
2. **Only read-only snapshots are sent**, and an incremental send needs its parent on the source too. *(btrfs-send(8):
   the subvolume must be read-only; (check).)*
3. **The receive needs the parent on the target**; otherwise it is refused and nothing changes, and only a full send
   works. **ZFS also refuses** if the target filesystem was written to after its newest snapshot, unless the receive is
   forced (`receive -F`), which first rolls the target back to that snapshot and loses the write. A full stream is
   received as a new filesystem and needs no parent. *(zfs-receive(8) `-F`; (check).) Btrfs receives into read-only
   snapshots (btrfs-receive(8)); the "target modified" case is ZFS's.*
4. **The receive applies the stream:** the new snapshot on the target is the parent's blocks there with the carried
   blocks on top, a whole filesystem. Restoring Wednesday reads `@wed` alone (8 blocks, 1 snapshot), no chain, unlike
   the incremental backup above. Received snapshots share their unchanged blocks (the target stores 8 + 2 + 1 = 11);
   deleting an older one does not break a later one, but the next incremental needs a snapshot both sides still hold.
   *(zfs-send(8); (check).)*
5. **Tie-break:** of several common snapshots the newest is the parent (what an operator would choose; the tools take
   the one named). Scripted sends use it; `missing-parent`'s Tuesday names `@mon`, as an operator would who did not
   know the target lost it.

### Presets and expected numbers (checked by script, `sim.test.js`)

| Preset | Steps | What happens |
|---|---|---|
| `send-chain` | 4 | Mon full `@mon`, **8** blocks; Tue `@mon → @tue`, **2** (3, 4); Wed `@tue → @wed` (common `@mon`, `@tue`: newest), **1** (6); restore Wednesday on the target from `@wed` alone: **8** blocks read from **1** snapshot, equal to the source's `@wed`. Target stores **11** |
| `missing-parent` | 4 | Mon full `@mon` (8); the target deletes `@mon`; Tue `@mon → @tue` (2 blocks) **refused**: no parent on the target, target unchanged; then full `@tue`, **8** blocks |
| `common-kept` | 4 | Mon full (8); Tue `@mon → @tue` (2); the source deletes `@mon` (source now stores 8, the target keeps 10); Wed `@tue → @wed`, **1** block, accepted: `@tue` is common |
| `target-touched` | 3 | Mon full (8); a file written on the target (block 5 `F*`); Tue `@mon → @tue` **refused** (target modified). With `force`: rolled back to `@mon`, the write to block 5 **lost**, then `@tue` applied |

`force` changes no step count and nothing in the other three presets (tested).

## Not in this sim

Retention (`retention-gfs`), dedup (`dedup-chunking`), synthetic fulls, `rsync --link-dest` trees. In the send and
receive presets: resumable sends, encryption and raw sends, compression in the stream, scheduling and retention.
