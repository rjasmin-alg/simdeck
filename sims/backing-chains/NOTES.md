<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backing-chains: notes

New stepper (task `docs/tasks/w2/backing-chains.md`, catalogue `sto-backing-chains`, overlap §5.2; covers
`win-hyperv-checkpoints` as the `vhdx-checkpoints` preset), drawn on kit view **K3: block grid** (`kit/blockgrid.js`,
kit 0.6.0). Rules and expected numbers: `SPEC.md`.

## Decisions

- **A script from params, not free-form ops.** The task's `op` "button group" (write b, read b, snapshot, merge, delete)
  would make the step count depend on clicks, which the kit's replay model and the `steps` check do not cover. The
  student instead picks what happens to the middle layer (`ending`: nothing / merge / stream / delete), the `format`,
  and whether the chain is built step by step or in one step (`compact`); the script (`script(p)`) follows. Writes,
  snapshots and reads are steps of the script.
- **The middle layer is always `s1`** (the overlay of the first snapshot), named in the `ending` label.
- **Reads after each ending:** none 0, 1, 4, 5 (the task's four); commit and stream 4 (now from base / from s2) and 1
  (B2 still wins); delete 4 (the failing read). One step per layer the probe visits.
- **Format keeps the step** (no `resets`): switching it mid-demo renames files and verbs at the same step (rule 9:
  the same mechanism under three names).
- **K3 use:** one grid. Rows top to bottom: "VM sees" (`soft` cells in the colour of the layer that served each block,
  the file's short name as `sub`; zeros dim `0`), then s2, s1, base, each labelled with its file name; the aside says
  the role (active / read-only / removed / file missing / broken) and `→ backing file`. Backing arrows start at the
  row label (a `now` arrow at the re-point step, `broken` after the delete). The read probe is a chain of links down
  block b's column, the newest `now`, the visited cell `now`. A removed layer keeps its band (struck label, holes) so
  the stack does not jump. A missing file's row is all `bad` cells with its lost blocks' labels; the broken layer
  above it shows its blocks `dead` (crossed: there but unreachable); the view row is all `bad` "?" with "does not
  open". The header counter counts allocated blocks over all layers: 8 after the build, 9 while a commit or a
  stream has copied but not yet removed s1, 7 after.
- **Labels over arrows:** the page gives the row labels a panel background so arrows that start at a label or pass
  it (the re-pointed s2 → base skips s1's row) run behind the file name.
- **Rule 8 view:** the model's `view()` stays per block (a read of block 1 from s2 would still hit `B2`); the page
  shows the whole view as unreadable once `opens()` is false, because the image does not open at all. The failing
  read of block 4 is still stepped through, as the task asks.
- **Rule 9 mapping:** deleting snapshot / checkpoint k merges file k (the overlay made by snapshot k, whose base
  state is what snapshot k kept) into its parent; so "delete the first checkpoint" = merge `s1` down, the same as
  `commit-middle`. Hyper-V is named (WIN2 teaches Hyper-V checkpoints); VMware and QEMU are not named on the page
  (the VMDK preset says "delta files" and "consolidate").
- **VHDX GUIDs shortened** to four hex digits (`disk_9c1e.avhdx`) so the label column stays narrow.
- **Rule 7 (refused commit into a branch) has no preset**: the chain never branches in this sim; the model has
  `commitRefused` with tests, and the explanation says it. A branching preset would be a second concept on this page.
- **Panel fit:** the two param hints were dropped and the `ending` labels shortened to one word so the panel fits at
  1920×1080; the title was shortened to one line for the same reason ("Lanci slika diska" / "Backing chains").
- **`entries`:** `vhdx-checkpoints` is listed as its own entry ("Hyper-V checkpoints") so a WIN2 course file can name
  `backing-chains#vhdx-checkpoints` (catalogue `win-hyperv-checkpoints`).
- **`related`:** `backup-diff-incr`, `dedup-chunking`. `lnx-mirror-not-backup` (task, misconceptions),
  `lnx-lvm-snapshot`, `lnx-cow-filesystem` do not exist yet.
- **Model is promotable:** `readPath`, `view`, `opens`, `write`, `snapshot`, `commitRefused`, `commitCopy`, `repoint`,
  `remove`, `commit`, `streamCopy`, `stream`, `deleteFile`, `children` are pure functions over a plain layer array,
  with no words.

## Deviations from the task

- `op` button group → `ending` choice + `compact` toggle (above).
- Step counts: the task's counts for presets 2–6 do not add up; SPEC.md gives the counts used (15, 7, 6, 4, 12, 12)
  and why. `vhdx-checkpoints` and `vmdk-delta` build step by step (12 steps, not 7) so every op carries the format's
  words.
- `log` is a list of op names (for tests); it is not drawn.
- The legend's "read-only (hatched border)" and "active (thick border)" are words in the row's aside: K3 has no
  per-row border style. Not filed as a shared request: the words read better than a border at projector distance.

## Sources

- QEMU documentation "QCOW2 Image Format" (backing file, unallocated clusters read from the backing file or as
  zeros), "Disk Images", `qemu-img(1)` (`create -b`, `commit`, `rebase`), "Live Block Operations" (block-commit,
  block-stream): from memory, not re-read online *(check)*.
- Microsoft Learn "Using checkpoints to revert virtual machines to a previous state" and "Choose between standard or
  production checkpoints in Hyper-V" (deleting a checkpoint merges its AVHDX): not re-read *(check)*.
- VMware vSphere "Delete a Snapshot" / "Consolidate Snapshots" (deleting a snapshot writes its delta into the parent):
  not re-read; titles unchecked *(check)*.
- NLA `meta/toc.md` T20, T22 for „snimke"; UL ch23 „lanac prirasnih kopija" for „lanac".

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| snapshot | snimka (NLA T20, T22) |
| backing file | pozadinska datoteka *(check)* |
| overlay | prekrivni sloj *(check)* |
| copy-on-write | kopiranje pri pisanju *(check)* |
| commit / merge | spajanje |
| stream (pull up) | povlačenje *(check)* |

Used from the glossary: checkpoint (kontrolna točka; the ossimulator entry, same words).

## Shared requests

None. `kit/` and `models/` unchanged. (Nice to have, not needed: a per-row border style in K3 for "read-only" /
"active" layers.)

## Checks

- `node --test sims/backing-chains/sim.test.js`: 18 tests pass. `npm test` (1766) and `npm run check` pass.
- `npm run gate -- backing-chains`: pass (62/62 browser checks). Screenshots looked at: the gate's 1920×1080 light,
  dark, grayscale, panel hidden, help and 375×812, both languages; extra states scripted: read-through steps 1, 2, 9,
  15; commit-middle 3, 4; stream-middle 2; broken-link 2, 4 (light and dark); vhdx-checkpoints 9; vmdk-delta 1; view
  off; phone mid-commit.
- Phone: the grid scrolls sideways inside its box (K3 phone behaviour); the page does not.

## Status left at wip

Everything in COMMON.md §8 holds, but `status: "ready"` makes `npm test` fail in `tests/landing.test.mjs` ("first
shelf's tiles end at … 1277"): it would be the sixth ready `storage` sim, and the home page's first shelf wraps to a
second row below 1080 px. Same cause as `backup-diff-incr` (t-0105). Setting `ready` is one line once the site handles
a shelf of six or more.

## Review

A fresh reviewer read the sim against `SPEC.md` and the task. They wrote their own reference model from the rules,
and it matched the sim at every step of all 24 format × ending × compact combinations (layers, probe, file names) and
on every preset number. They ran 44 mutants of `sim.js`, and every flipped tie-break and every broken rule was
caught. Of the survivors, three were equivalent (one is now removed: the unused `removed` field). Two were real
gaps, now tested: the VHDX `s1` file name, and a deleted file's blocks being cleared (the page counter depends on
it). The step bound in the tests was also tightened from 20 to 15.

Fixed from the review:
- Captions began with a lowercase term ("snapshot (snimka): …"); they now read "Uzima se *snapshot* (snimka): …" /
  "Take a snapshot: …". The hr term rule is now kept on later mentions too (*checkpoint*, *snapshot*).
- Nested parentheses around *copy-on-write* (kopiranje pri pisanju); hr „a {old} je njegova *backing file*" → „a
  {old} mu je *backing file*".
- "Lower layers hold older contents" with one lower layer: now a plural form on the count.
- The broken chain: the steps after "the image does not open" no longer say "Read block 4"; they now say "follow
  block 4 down the chain" and "would fall through".
- Stream on VHDX/VMDK claimed an operation those managers do not offer: the caption now says it is the qcow2
  operation, shown on these files.
- Facts:
  - "A commit is refused into a branch" → "must not be done" (a backing file does not know who backs on it).
  - "Deleting the checkpoint lost no data" → "the VM lost nothing; the writes after it were merged; only the way
    back to it (block 1 = B) is gone". The explanation's misconception line is fixed the same way.
  - VMDK "consolidate" → "merge" (consolidate is the separate repair of leftover deltas).
  - "s1 is removed" → "leaves the chain" (commit does not delete the file).
- "Middle layer s1" → "Middle layer" (with VHDX/VMDK there is no s1 on the stage).

## Time

Start 2026-10-04 10:22 CEST, done 10:45 CEST (about 23 minutes, including the review and its fixes).
