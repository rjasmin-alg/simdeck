<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# write-cache: spec

One concept: **write-back is fast until the power fails; battery-backed cache.** Task `docs/tasks/w3/write-cache.md`,
catalogue `sto-write-cache` (§4.6). Class stepper. The student writes through a controller cache with each setting
and cuts the power.

## Scene

Left to right: **application → controller cache (DRAM) → disk**, then a timeline under them and a card on the right.

- **Application:** one row per operation: the write's label (data: A–F, or X, D, C for the journal), its LBA, and its
  status: `✓ <ack time>`, waiting, not yet, lost (✕), no ack (after the cut), never sent. A flush is a row of its own
  (waits for disk / done).
- **Cache:** one slot per block it holds: dirty (hatched) or clean (solid); the block the disk is writing has a dashed
  outline and `→`. Under it the battery module (none / working / failed, with "writes through" when write-back is set
  and the battery has failed) and the power state (on / OFF / back). After a cut without a working battery the slots
  are replaced by "emptied by the power cut".
- **Disk:** one row per LBA of the pattern, ascending (the elevator's order): old content (dotted) or the label
  written there (solid), `← X` for the block being written, `◀ head` at the head.
- **Timeline** (x = ms, 0 to the end of the run rounded up to 10): per write, the issue (○), a line to its ack (solid
  once acknowledged, dashed while the application waits), the ack (✓), a **hatched bar from the ack to the moment it
  is on disk** (the window in which it is acknowledged but only in cache), on disk (■), lost (✕ on the cut line). The
  cut is a red line labelled "power cut"; before it, a dashed line marks the clock.
- **Card:** "So far" / "At the power cut" / "After power returns": acknowledged, on disk, on disk but never acknowledged (destaged after the cut), lost, not acknowledged
  (after the cut), dirty in cache, replaced by a newer write, never sent, mean time to ack. For the journal pattern,
  "Journal on disk": new / old (consistent) / commit without its data (corrupt).

Legend: dirty block (hatched), on disk (solid), acknowledged (✓), lost (✕ in a red frame), battery, changed in this step.

## State

```
{ t,                       // the clock, ms (−1 before the first step); stands still while the power is off
  eff: 'wt' | 'wb',        // the policy the controller really runs (rule 5)
  power: 'on' | 'off' | 'restored', cutAt: ms | null,
  ops: [{ id, kind: 'write', label, lba, at, dep, fua, issuedAt, ackAt, durableAt, supersededBy }
      | { id, kind: 'flush', at, dep: 'ack', issuedAt, doneAt }],   // the task's queue
  next,                    // index of the next op to issue
  cache: [{ id, lba, label, dirty, seq }], disk: { lba: label }, head: lba, busy: { id, lba, doneAt } | null,
  lost: id[], ev: [{ type, id, ... }] }   // ev: what this step did (issue, ack, supersede, flush, flushDone,
                                          // durable, start {of, wrap}, cut, restore)
```

The task's `bbu` and `flushOnCommit` are params, not state.

## Params

| Param | Values | Default | Control |
|---|---|---|---|
| `policy` | `wt` write-through, `wb` write-back | `wb` | choice |
| `bbu` | `off` no battery, `on` working, `failed` failed or charging | `off` | choice |
| `pattern` | `six`, `journal`, `rewrite` | `six` | set by the presets (hidden) |
| `flush` | flush + FUA for the commit record | off | toggle, shown with `journal` |
| `diskMs` | 4, 8, 12 | 8 | hidden (one screen); URL only |
| `cutAt` | 0–80 ms | 25 | range |
| cut now | sets `cutAt` to the next ms (to 0 at step 0) | | button, key X |

`cacheMs` is fixed at 0.1.

Patterns (label, LBA, issued at):

- `six`: A 120 @0, B 480 @1, C 300 @2, D 760 @3, E 210 @4, F 640 @5.
- `journal`: X 950 @0 (another file, keeps the disk busy), D 900 @1 (data), C 100 @2 (commit record) issued only after
  D is acknowledged. With `flush`: a flush after D's ack, and C after the flush, as a FUA write.
- `rewrite`: as `six` with B2 480 @3 in place of D (a second write to B's block).

## One step

A step is the **next moment something happens** (the task: "the kit's step is next event, not next millisecond"):
the next issue, a disk write's completion, the cut, or the restore. Inside that tick, in this order (SPEC deviates from
the task's order by putting the completion first; see NOTES.md):

1. the disk finishes the write it started `diskMs` earlier: the block is on disk (`durableAt`), the head moves to its
   LBA, and in write-through (or a FUA write) the application gets its ack now;
2. a waiting flush completes if every write issued before it is on disk or replaced;
3. the application issues what it may (its time has come and its dependency is met): write-back acknowledges at
   `t + 0.1` and marks the block dirty; write-through (and FUA) only forwards it;
4. an idle disk takes the next dirty block (elevator, rule 6);
5. the power cut, at the end of tick `cutAt`.

The step after the cut is the **restore**: power returns at the same clock. A protected cache starts destaging; later
steps finish those writes. Nothing else is issued after a cut: the host lost power too.

## Rules

1. **Write-through acknowledges only after the disk has the block**: ack = durable. Standard controller semantics
   *(check against a controller manual)*.
2. **Write-back acknowledges when the block is in cache**: ack = issue + 0.1 ms; the block is dirty until destaged.
3. **Power loss empties a volatile cache.** Every acknowledged write that is not on disk, not replaced by a later
   write, and has no protected copy is **lost**. The write the disk was doing at the cut never completes (the block
   keeps its old content; torn writes are out of scope). Writes issued but never acknowledged are "not acknowledged":
   the application knows.
4. **A working battery (or flash module) keeps the dirty blocks**; after power returns they are destaged; nothing
   acknowledged is lost. The hold-up time is assumed long enough *(check in a controller manual)*. After the cut no
   ack is sent (nobody waits for it).
5. **A failed (or charging) battery makes the controller write through** even when write-back is set *(check vendor
   behaviour)*. No battery at all keeps write-back as set (the `write-back-cut` preset: write-back forced on).
6. **Destage order is the elevator's, not the write order**: C-LOOK by LBA, from the head upwards, then back to the
   lowest dirty LBA. A journal writes its commit record after its data is acknowledged; under write-back that ack
   means nothing for order, so the commit (LBA 100) can reach the disk first. **Flush + FUA** forces the order: a flush
   waits until every earlier write is on disk, and the commit goes as a FUA write, acknowledged only from disk
   (kernel documentation, "Explicit volatile write back cache control": REQ_PREFLUSH and REQ_FUA) *(check)*.
7. **Tie-breaks.** (a) A write to an LBA that is dirty in cache and not being written replaces it (one destage); the
   older write is "replaced" (`supersededBy`), neither lost nor on disk. A block the disk is already writing is not
   replaced: the new write gets its own slot. Only write-back merges; write-through queues each write and acknowledges
   each from disk. (b) Equal LBAs in the queue go in issue order (`seq`). (c) A cut in the same ms as a completion
   comes after it: that write is on disk. (d) A write issued in the cut's ms is acknowledged (write-back, at t + 0.1)
   before the cut at the end of the tick.

## Presets and expected numbers

Derived twice: by an independent Python script written before `sim.js` (NOTES.md) and by `sim.js`; both agree.

| # | id | Params | Expected | Steps |
|---|---|---|---|---|
| 1 | `write-through` | wt, cut 30 | acks A 8, E 16, C 24 (B 32, F 40, D 48 without a cut); at 30: 3 acknowledged, 3 on disk, 0 lost, 3 not acknowledged; mean ack 14 ms over the three (25.5 ms over all six, the longest wait D 45 ms) | 11 |
| 2 | `write-back-cut` (default) | wb, cut 25 | acks 0.1, 1.1 … 5.1; on disk A 8, E 16, C 24; at 25: **B, D, F lost** (3 of 6) | 11 |
| 3 | `write-back-bbu` | wb, bbu on, cut 25 | B, F, D destaged at 33, 41, 49 after power returns; 0 lost | 14 |
| 4 | `reorder` | wb, journal, cut 20 | X 8, then C (LBA 100) at 16 (the elevator wraps from 950), D would follow at 24; at 20: **commit without its data, D lost**. With `flush`: flush 2→16, D on disk at 16, C issued at 16 as FUA, would be on disk (and acknowledged) at 24; at 20: old consistent state, 0 lost, C not acknowledged | 7 / 7 |
| 5 | `battery-failed` | wb, bbu failed, cut 30 | as preset 1 (rule 5) | 11 |

Other checked cases: `rewrite`, cut 60: B2 replaces B at 3 (one destage, at 32), F at 40; 6 acknowledged, 5 on disk,
1 replaced. `cutAt` 16 (the ms E completes): E on disk, B C D F lost. Any combination of params stays at 14 steps or
fewer (tested over all of them).

## Derived

- Write-through numbers: the six writes queue; the disk serves one per 8 ms. The task's "last write waits 42 ms"
  assumed FIFO and issue at 6; with issue at 0–5 and the elevator, the longest wait is D, 48 − 3 = 45 ms; the mean
  over six is 153 / 6 = 25.5 ms.
- The task's "acknowledged all six within 0.6 ms" caption is the sum of 6 × 0.1 ms; the page says each write is
  acknowledged after 0.1 ms.
- Elevator order for `six`: after A (120): E 210, C 300, B 480, F 640, D 760. So the lost blocks are B, D, F, not the
  last three written: write order and disk order differ.
