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

## Not in this sim

Retention (`retention-gfs`), dedup (`dedup-chunking`), synthetic fulls, `rsync --link-dest` trees, snapshot
send/receive (`lnx-send-receive`, a later preset of this sim).
