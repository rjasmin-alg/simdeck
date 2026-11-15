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

## win-hyperv-checkpoints presets (task `docs/tasks/w3/win-hyperv-checkpoints.md`, t-0465)

Three presets on this page (keys 7–9) and one `entries` line (`hv-apply`), for WIN2 (Hyper-V checkpoints). Rules 10–13
in `SPEC.md`.

### Decisions

- **Built here, not only filed.** The task asks for an `apply` op and branches and says to file that request here. They
  are additive, so they are in this folder's model: two new pure functions (`keepState`, `apply`), two new `ending`
  values (`apply`, `keep`), a layer `s3` and a `dropped` state field. The six earlier presets give the same states
  and step counts as before (their tests are unchanged and pass). Same route as `win-firewall-profiles` on
  `lnx-firewalld-zones`.
- **`hv-delete-middle` is the existing preset 5 `vhdx-checkpoints`**, not a copy. The task writes "delete checkpoint C2,
  whose disk is the middle `_1.avhdx`, merged into its parent". But merging `_1` into `Disk.vhdx` changes C1's state
  (`Disk.vhdx` alone), so that delete is checkpoint **C1**. The task's numbers (base `A B1 C D E1`, view unchanged) are
  those of deleting C1, as in preset 5. Deleting C2 would merge `_1` with `_2` and leave `Disk.vhdx` as it is. Not
  modelled; *(check)* which way Hyper-V merges.
- **`hv-avhdx-deleted`** is `broken-link` with `format: vhdx` (4 steps). The host's `capByHand` sentence already says
  that deleting the checkpoint would have merged.
- **Apply always goes to C1** (`APPLY.target = 'base'`, new overlay `s3` = `disk_e27a.avhdx`). Apply in one step (new
  overlay and discard together), so `hv-apply` is 6 steps and `hv-take-and-apply` 7, as the task asks. The reads after
  an apply are blocks 1 (`B` from the base, 2 layers) and 4 (zeros, 2 layers). When the block also sits on the other
  branch, the caption says so (`capReadBranch`): "B1 on the other branch is not read".
- **Row order for the apply endings** is view, s3, base, s1, s2, not s3, s2, s1, base. K3 starts every layer arrow at
  its row label, so two children of one parent stacked above it share one line, and the branch looked like a straight
  chain. With the new overlay above the base and the old chain below it, the base's two arrows come from both sides.
  The host's presets keep their order. During the build of these presets the chain grows downwards.
- **Keep step:** the active layer is read-only for one step (C3 holds it) and no layer is active; its aside says
  "read-only" (render: active only when writable).
- **Panel fit:** nine presets did not fit at 1920×1080 (1017 > 837 px). The presets are now in two columns (as
  `wireguard`, `xss`, `yagi`; one column on a phone), and `ending` is a select (six options). The param label
  "Srednji sloj na kraju" / "Middle layer at the end" is now "Na kraju" / "At the end", because apply is not about the
  middle layer.
- **Captions per format:** apply also works on qcow2 and VMDK (revert to a snapshot) with their own words
  (`applyHead_*`, `none_*`, `second_*`, `third_*`, `kept_*`). The presets use VHDX.
- **Explanation:** one Hyper-V paragraph (checkpoint = the state before its AVHDX; delete = merge; apply; branches; an
  AVHDX deleted by hand; production vs standard, which changes no block). The misconception line gains "an orphaned
  AVHDX cannot simply be deleted". "Windows Server 2016" and "VSS" stay out of the page (concepts, not tools). The
  page says "asks the guest to bring its disk to a consistent state".
- **Not shown:** checkpoint names on the rows (C1, C2, C3 appear in captions only); `.vmrs` memory files, export and
  import, Replica (out of scope).

### Sources (t-0465)

- Microsoft Learn, *Using checkpoints to revert virtual machines to a previous state* (apply creates a new
  differencing disk; the current state is lost unless a checkpoint is taken first; "Take Checkpoint and Apply"),
  *Choose between standard or production checkpoints in Hyper-V* (production uses the guest's backup technology and
  no memory state; default since Windows Server 2016), *Enable or disable checkpoints in Hyper-V*. From memory, not
  re-read online; titles unchecked *(check)*.
- Do not delete `.avhdx` files directly (Microsoft Learn checkpoint guidance) *(check)*.

### Unchecked *(check)*

- Hyper-V merges into the parent or into the child when a checkpoint is deleted (the view is the same either way).
- The merge can run while the VM is running.
- "Apply" without "take" discards the running state; "Take Checkpoint and Apply" keeps it as a new checkpoint.
- What Hyper-V does when a deleted checkpoint's disk has two children (rule 12 / host rule 7).
- Production checkpoints are the default since Windows Server 2016.

### Term pairs (t-0465; written out in both tables, not in `kit/glossary.js`)

| en | hr |
|---|---|
| apply (revert) a checkpoint | vraćanje na kontrolnu točku *(check)* |
| production checkpoint | produkcijska kontrolna točka *(check)* |
| differencing disk | diferencijalni disk *(check; only in aliases, not on the page)* |
| branch (of a chain) | grana |

### Shared requests (t-0465)

- K3 (`blockgrid.js`): a lane offset for whole-layer links (e.g. `lane: 1` moves the vertical leg right of the label
  column), so two children above one parent can each have their own arrow. Worked around by the row order above.

### Checks (t-0465)

- `node --test sims/backing-chains/sim.test.js`: 23 tests pass (5 new: the apply tie-break, rules 10, 11, 12, the
  Hyper-V presets; the step test gained the new counts). Seven mutants of the new code (discard always, discard never,
  no read-only on keep, wrong backing, active not moved, one read short, reads counted from the old top) were all
  caught.
- `npm run gate -- backing-chains`: pass (63/63 browser checks). Screenshots looked at: the gate's 1920×1080 light, dark,
  grayscale and 375×812 in both languages, plus `hv-apply` steps 2 and 4, `hv-take-and-apply` steps 2, 3 and 7, and
  `hv-take-and-apply` step 3 on a phone.

### Time (t-0465)

Start 2026-11-15 16:17 CET, done 16:27 CET.
