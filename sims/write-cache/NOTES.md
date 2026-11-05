<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# write-cache: notes

Task `docs/tasks/w3/write-cache.md` (catalogue `sto-write-cache`, §4.6). Built by thread t-0273 on 2026-11-05.
Rules and numbers: `SPEC.md`.

## Decisions

- **One step = the next event time** (an issue, a disk write done, the cut, the restore), as the task says ("next
  event, not next millisecond"). The step count comes from replaying the model (`steps(p)`): 11, 11, 14, 7, 11 for the
  five presets (7 with flush too); the task's guesses (8, 7, 9, 6, 8) assumed grouped ticks. `sim.json` `steps` is the
  default preset's (`write-back-cut`, 11). Every combination of params stays at 14 or fewer (tested).
- **Tick order puts the disk's completion first**, before the application issues (the task listed it third). Then a
  write-through ack at 16 lets a journal issue its commit in the same ms, and a cut at the very ms a write completes
  counts that write as on disk (SPEC rule 7c). The cut stays last in the tick.
- **One elevator for both policies** (C-LOOK by LBA, head starts at 0). Write-through is safe whatever the order,
  because each ack waits for its own write; the six-write numbers are the task's (acks at 8, 16, … 48) with the
  writes acknowledged in LBA order. In write-back the lost blocks are B, D, F, not the last three written, which shows
  the point of rule 6 in the first presets too.
- **The journal pattern has a third block** (X at LBA 950, "another file") written first: it keeps the disk busy so
  data and commit are both dirty when the disk chooses, and leaves the head at 950 so the elevator wraps to the
  commit at LBA 100. Without it the disk would take the data the moment it arrives and no reordering could happen.
- **The commit waits for the data's ack** (what a journal does even without barriers). Under write-through that alone
  orders them; under write-back the ack comes from cache, so it does not.
- **`flush` is flush + FUA**, the pair a journal uses for its commit (kernel documentation, Sources): a flush that
  waits for every earlier write to be on disk, then the commit as a FUA write, acknowledged only from disk. With a plain
  flush before the commit, the commit itself would be acknowledged from cache and lost at the cut, which the task's
  "same cut leaves the old, consistent state" does not intend. The toggle is labelled "Flush + FUA". A flush waits for
  the disk even with a working battery (a controller with protected cache may complete it at once; simplification).
- **`bbu` is a choice of three** (none / working / failed) instead of a toggle plus a "failed" preset flag: the
  `battery-failed` preset needs a failed battery as a param. No battery at all keeps write-back as set (write-back
  forced on, as preset 2 needs); a failed or charging one makes the controller write through (rule 5).
- **The clock stands still while the power is off**: the restore is the step after the cut at the same t, and a
  protected cache's destages finish at cut + 8, + 16, … (33, 41, 49 in preset 3).
- **After the cut nothing more is issued** (the host is off too), and a block destaged after power returns is not
  acknowledged to anyone.
- **"Cut the power now"** (button, key X) sets `cutAt` to the next ms (0 at step 0); the kit keeps the step, so the
  cut is the next step (lessons §11: actions take effect in the next step). It does nothing once the power is off.
- **Lost** = acknowledged, not on disk, not replaced by a newer write, and no protected copy in cache. A replaced
  write (rule 7) is counted on its own line, not as lost or on disk.
- **The card** shows "dirty in cache" while the power is on: the acknowledged-but-only-in-cache count is the risk the
  sim is about. The timeline's hatched bar shows the same per write.
- The caption helper `rich()` is copied from `sims/ssd-internals/index.html`.

## Deviations from the task

- `diskMs` and `pattern` have no visible control: with six presets and both choices the Croatian panel was 270 px too
  tall for one screen. `pattern` is set by the presets; `diskMs` (4 / 8 / 12) stays in the model and the URL
  (`?diskMs=12`). A visible `diskMs` needs either fewer presets or a smaller kit panel.
- The `reorder` preset shows the flush case through the `Flush + FUA` toggle (shown only for the journal pattern), as the
  task describes; there is no sixth preset.
- `flush` means flush + FUA (above). `bbu` is a three-way choice instead of an on/off toggle (above).
- `cutAt` is in ms, 0–80, default 25 (the task's "1–12 (6)" had no unit and could not reach the presets' cuts at
  20–30 ms); 80 covers the slowest run (write-through at 12 ms per write ends at 72). The task's single big power
  switch is this slider plus the "Cut the power now" button; the power state is shown in the cache box.
- State: `ops` (writes and flushes) for the task's `queue`; `flushOnCommit` and `bbu` are params; `cache` entries carry
  `label` and `seq`; `ev` lists what the step did.
- Step counts differ from the task's estimates (above); the task's "last write waits 42 ms" is 45 ms here (SPEC.md,
  Derived); the hr caption "potvrdio sva šest pisanja za 0,6 ms" became "each acknowledged after 0.1 ms".
- The catalogue seed mismatch the task notes (scoping note §5 item 5 is an SSD cache tier, not this concept) is left
  for the coordinator: either relink the seed or add `sto-cache-tier`.

## Sources

- Linux kernel documentation, "Explicit volatile write back cache control" (`Documentation/block/writeback_cache_control.rst`):
  REQ_PREFLUSH empties the device's volatile cache before the write, REQ_FUA makes the write itself durable before
  completion; a device with non-volatile cache may ignore both *(check: from memory, no local copy)*.
- RAID controller manuals, write policy sections: write-back needs a working battery or flash module, falls back to
  write-through while it is failed or charging, and can be forced to "always write-back" *(check: no local copy; the
  model follows the task's rules 1–5)*.
- `~/projects/ossimulator/src/modules/disk-scheduling/` (elevator by LBA; the C-LOOK choice here is a simplification
  of its LOOK/C-LOOK family) and `raid-cache/` (replacement, not write policy): nothing copied.
- `/home/rjasmin/projects/cluster-design-sim-scoping.md` §5: the seed (see Deviations).
- The numbers were derived twice: by an independent Python script written before `sim.js` (below) and by `sim.js`.

```python
# reference for rules 1–7 (independent of sim.js); prints acks, durable times, lost, unacked, disk per preset
PAT={'six':[('A',120,0,None),('B',480,1,None),('C',300,2,None),('D',760,3,None),('E',210,4,None),('F',640,5,None)],
     'journal':[('X',950,0,None),('D',900,1,None),('C',100,2,'ack')]}
# per tick T: disk completion (ack if write-through/FUA) → flush check → issue (wb: ack T+0.1, merge a dirty,
# not-in-flight block of the same LBA) → idle disk picks C-LOOK (lba ≥ head, else lowest; ties by issue order)
# → cut at the end of tick cutAt: drop the in-flight write; without bbu 'on' empty the cache.
# write-through cut 30: acks A 8 E 16 C 24, lost [], unack [B D F]
# write-back cut 25: acks 0.1…5.1, durable A 8 E 16 C 24, lost [B D F]
# write-back bbu: durable B 33 F 41 D 49, lost []
# reorder: C durable 16, D lost → corrupt; with flush+FUA: D 16, C issued 16 unacked → old, consistent
# battery-failed: as write-through; rewrite cut 60: B2 replaces B, durable B2 32 F 40
```

## Term pairs

In the glossary and used: *cache* — predmemorija (the glossary's, from the UL book; ossimulator's `raid-cache` says
"priručna memorija", the task "priručna memorija"; the page follows the glossary), *elevator algorithm* — algoritam
dizala, *journaling* — dnevničko vođenje. Not in the glossary, written out in both tables with the English term in
italics on the Croatian page:

- write-back — odgođeno upisivanje *(check)*
- write-through — izravno upisivanje *(check)*
- dirty (block) — prljavi blok *(check)*
- flush — pražnjenje predmemorije *(check)*
- acknowledgement — potvrda
- commit record — zaključni zapis *(check; "potvrda" is taken by acknowledgement)*
- battery-backed cache — predmemorija s baterijom
- FUA (force unit access) — left as FUA, explained as "acknowledged only from disk"

## Shared requests

- **Kit: room for six presets and five params at 1920×1080 in Croatian.** The panel fits five presets and four
  controls here; `diskMs` had to be hidden. A denser preset list (two columns, or labels only with the number badge)
  would let task-specified params stay visible.
- **Kit: a disabled state for action buttons** (`{ type: 'button', disabled: (p) => reason }`), as `ssd-internals`
  asked: "Cut the power now" silently does nothing once the power is off.

## Tags

Topic `storage`, tag `storage-basics`, level `advanced` (as the task names; both exist in `tags.json`).

## Review

A fresh reviewer (a separate agent with no part in the build) read the code against `SPEC.md`, traced the default and
journal presets by hand, and ran 17 mutations of the model; all were caught except six, which led to the fixes below.
Found and fixed:

- untested: the card's "dirty in cache" count at the cut, the "not acknowledged" count with a protected
  write-through cache, the 14 ms mean ack over three writes, and the cache slot's label after a merge: tests added;
  the step bound is now asserted as SPEC's 14, not 20;
- after a cut, issued-but-unacknowledged writes wore the "never sent" chip: they now have their own (dotted) chip;
- with write-through and a working battery, the timeline's wait bar ran past the cut to the destage times: it now
  ends at the cut; the card gains a row "on disk, never acknowledged" for those writes;
- with a cut at 0 the last caption said "everything is on disk" although five writes were never sent: it now says
  "everything sent";
- the restore caption said blocks are written "as soon as power returns" at the step where power had returned, and
  its Croatian 5+ form disagreed in number: reworded in both languages.

Surviving mutations left as they are: the flush ignoring replaced writes and the removal of a clean copy of an LBA
are unreachable with the three patterns (no pattern combines a flush with a rewrite, and no write hits a clean LBA).

## Checks

- `node --test sims/write-cache/sim.test.js`: tie-breaks first, a test per rule, the preset numbers, the 20-step bound
  over every param combination, then the template's generic block.
- `npm run gate -- write-cache`: pass. Screenshots reviewed: 1920×1080 light, dark, grayscale in hr and en, 375×812,
  and by hand every preset's cut and last step, the journal with and without flush, write-through mid-run.

## Time

2026-11-05, 08:03 to 08:30 (about 30 min including the review), one session.
