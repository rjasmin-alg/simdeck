<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-cow-filesystem: notes

New stepper (task `docs/tasks/w2/lnx-cow-filesystem.md`, catalogue `lnx-cow-filesystem` §4.4, overlap §5.2), drawn
on kit view **K3: block grid** (`kit/blockgrid.js`, kit 0.6.0). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scripts, not free-form ops.** Each preset is a fixed script of ops (write, snapshot, write, rm, destroy), one op
  per step, so the step count is fixed and the kit's replay and `steps` check hold (as `backing-chains`). The script
  is a hidden `scene` select (`visible: false`, the `lnx-overlayfs-layers` / `lnx-links-inodes` pattern; the kit
  reserves `?preset=`), set by the presets, so it survives a param change and the language switch.
- **One grid.** Rows top to bottom: the live tree `podaci`, then a row per snapshot the scene will take (`@s1`,
  `@s2`), then the pool. A tree row's cell k is logical block k of file `a`: the block's label as text, `→id` (the
  physical block) as `sub`, hatched (`soft`) in the tree's colour when the block is shared, solid (`fill`) when only
  this tree points to it, so "shared vs owned" reads in each tree row too. Pool cells: shared blocks hatched in the
  neutral series colour 8 with `×n` as `sub`; a block one tree holds solid in that tree's colour; free blocks plain;
  a block freed this step `dead` (crossed, label struck, `×0`) for that step only.
- **Rows keep their place.** A snapshot not yet taken is an empty band with its name muted; a destroyed one keeps
  its band with its name struck and "destroyed". The stage does not jump when trees come and go.
- **Labels:** letter = logical block (A–H for 0–7), digit = the number of earlier writes of that block: `A0…H0`,
  then `C1`, `C2`. So the snapshot row showing `C0` while the live row shows `C1` is "the snapshot sees the old data".
- **Highlights** (the task's "changed"): the kit's yellow marks the new pointers (live cells written, a new
  snapshot's whole row), the newly allocated pool blocks, and the space-table values that changed. A pool block whose
  reference count changed but was not written gets the kit's `mark: 'under'` bar instead of the yellow fill, so its
  new owner colour (a block that just became exclusive to `@s1`) stays visible; the legend says "reference count
  changed". Freed blocks are crossed, not yellow, for the same reason.
- **Arrows:** only the live pointers that moved this step (an overwrite), `now`. An earlier version also drew dashed
  arrows from each snapshot's cell to the old block it keeps; with two snapshots they ran along the same columns and
  levels as the moved pointers and could not be told apart, so they were dropped; the `→id` line and the colour carry
  it. A new file's eight pointers and a snapshot's copy get no arrows (eight parallel lines would add nothing).
- **Space table** as the grid's foot: per tree referenced and exclusive (a row per tree the scene has; `–` before it
  exists and after it is destroyed), and the pool's used, free and shared. The header counter says "used n of N" and
  is on the highlight when used changed, on `rm` (where it does *not* change: the point of preset 2) and on ENOSPC.
- **ENOSPC:** the live row's aside says `✕ ENOSPC` and nothing on the stage changes (the attempted cell is not
  highlighted: the legend's yellow means "new or moved", and nothing moved); the caption names the block, gives the
  message in English (`No space left on device`, `enospc` in both tables, shown as data) and why: no free block, and the old block may
  not be overwritten while a snapshot points to it (or, for unshared data, is freed only after the new one is
  written).
- **Croatian terms:** *snapshot* (snimka) and *copy-on-write* (kopiranje pri pisanju) follow the term rule in
  captions: first mention with the Croatian in parentheses (the first snapshot step, the first overwrite), later
  steps in italics alone. Labels, legend and presets use the Croatian words (snimka, bazen, stablo). The glossary has
  neither term, so they are written out (`termSnap`, `termCow`; the page's `rich()` sets `*…*` as `<em lang="en">`).
- **Btrfs and ZFS are named** in the explanation only: NLA T22 and T23 teach them as the topic. `rfer`/`excl` and
  `referenced`/`used` appear in the explanation as the properties being taught. No command lines anywhere; `rm a` and
  "destroy" are the ops.
- **Model is promotable:** `write`, `snapshot`, `rm`, `destroy`, `recount`, `space`, `holders`, `freeIds` are pure
  functions over plain `{ blocks, trees, poolSize, writes }` with no words (catalogue §5.2 plans `sto-cow-vs-row` and
  `win-vss` as later presets here). `write` and `rm` also refuse a read-only tree (`EROFS`, rule 8) and a missing
  tree or file (`ENOENT`); no preset uses those.
- **Slider focus workaround:** both sliders start at their maximum, so the gate's "click near the end of a slider,
  then press →" check clicks without changing the value; the kit blurs a slider only on `change`, so focus stayed on
  the slider and → moved it. The page blurs a range input after a pointer click (`click` with `detail > 0`, which
  fires after `change`). See Shared requests.

## Deviations from the task

- **`poolSize` range 10–24**, not 12–24: the task's own preset 4 (`full-pool`) uses a pool of 10.
- **Legend:** "changed" is split into "new or moved" (yellow) and "reference count changed" (underline bar), see
  Highlights. The task's "striped / solid / hollow / crossed" are the kit's `soft` / `fill` / free / `dead`.
- **Overwriting two blocks in one step** (preset 1) needs two free blocks: rule 3 applied to the whole write (the
  old blocks are released after the write). The task does not say; with 14 free it makes no difference to any preset.
- **Captions:** the task's sample caption for the first snapshot is used ("Nije zauzeo nijedan blok: kopirao je samo
  pokazivače. Sad blokove 0–7 dijele 2 stabla."), with "Uzima se *snapshot* (snimka) @s1." before it and the count as
  a numeral.

## Sources

- NLA `meta/toc.md` T22 (Btrfs: podvolumeni, snimke) and T23 (ZFS: bazeni, `datasets`): read for the words; no
  chapter exists yet, so every preset number is derived from the rules, not from course text.
- Btrfs documentation "Subvolumes" (snapshots share data with the original by CoW), btrfs-subvolume(8) `snapshot`,
  "Quota groups" (`rfer`, `excl`): from memory, not re-read *(check)*.
- OpenZFS zfs-snapshot(8) (a snapshot initially takes no space; it consumes space as the active dataset changes),
  zfsprops(7) `used`, `referenced`, `usedbysnapshots`, `written`: from memory *(check)*.
- Rule 3 (unshared data is not overwritten in place either) and rule 6 (ENOSPC with no free block, although an
  overwrite does not grow the file): derived; real pools keep a reserve (ZFS slop space, Btrfs global reserve), so the
  error comes a little before the last block *(check)*.
- `single-page-labs/zfs-btrfs-topology-lab.html`: models pools, datasets and snapshots as objects, not block sharing;
  only its vocabulary was useful.
- UL ch12 `mkfs.xfs` output with `reflink=1`: the explanation's one line on file-level CoW (reflink copies).
- Numbers: printed by a node script over the model before the page was written (Checks), and asserted in
  `sim.test.js`.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| snapshot | snimka (NLA T20, T22; also `backing-chains`) |
| copy-on-write | kopiranje pri pisanju *(check against NLA T22–23 once written)* |
| subvolume | podvolumen (NLA T22) |
| dataset | skup podataka *(check; NLA T23 writes `datasets`)* |
| reference count | brojač referenci *(check)* |
| shared block | dijeljeni blok |

Not used from the glossary: *pool* (its entry is "skup adresa", the DHCP sense; a storage pool is "bazen", NLA T23).

## Shared requests

- **kit.js `releaseAfterPointer`:** a slider is blurred only on `change`, so a click that leaves the value as it was
  (a slider at its maximum, clicked near its end) keeps the focus, and the clicker's → then moves the slider instead
  of stepping. Smallest change: also blur on `click` when `detail > 0` (a pointer click; it fires after `change`).
  Worked around in the page.
- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (already filed by `lnx-overlayfs-layers`);
  worked around in the page the same way.
- **K3 arrow routing:** a `now` arrow from a top row's cell k to a pool cell elsewhere runs straight down column k
  behind the cells of the rows in between (here the snapshots' cell k), so it can read as if those cells point to the
  new block too. A route beside the column (in the gap between cells) would avoid it. The `→id` lines and the
  caption carry the truth meanwhile.

## Checks

- Numbers before the page: a node script over the model printed used, free, shared, referenced and exclusive after
  every step of every preset; they match the task (8 → 8 → 10, shared 6, `@s1` excl 2; 8 → 8 → 8 → 0; 8 → 8 → 9 → 9 →
  10 → 9 → 8; 8 → 8 → 9 → 10 → ENOSPC → 8 → 0).
- `node --test sims/lnx-cow-filesystem/sim.test.js`: 20 tests. Mutations (each rule broken once in `sim.js`): lowest
  free → highest, idx order instead of logical order, snapshots newest first, a snapshot that copies the data,
  overwrite in place, the snapshot's pointer moving too, a freed block reused in the same write, rm and destroy
  freeing every block they pointed to, no ENOSPC, writable snapshots (write, rm), labels without versions: all
  caught. Equivalent and kept: `exclusive` computed as `refs === 1` (the same while a tree points to a block at most
  once, which holds with one file per tree).
- `npm run gate -- lnx-cow-filesystem`: pass (62/62 browser checks). `npm test` and `npm run check` pass. Screenshots looked at: the gate's 1920×1080 light, dark,
  grayscale, panel hidden, help and 375×812, both languages; extra states scripted at 1920×1080 in both languages:
  basic 1, 3; delete-doesnt-free 3, 4; middle-snapshot 3, 4, 5, 6; full-pool 0, 5, 6. The tightest is
  middle-snapshot in Croatian (three trees, the title on two lines, a three-line caption): it fits with about 30 px
  to spare.

## Review

A fresh reviewer read the sim against `SPEC.md` and the task, wrote their own reference model from the rules, and
compared it with `sim.js` on all 4 scenes × `fileBlocks` 4–8 × `poolSize` 10–24 (1575 states: blocks, refs, pointers,
freed, the space table): no difference. Of 41 mutants, the survivors that mattered were the step's bookkeeping
(`changed`, `event`, `err`/`want` carried into the next step, `moved.from` on a new file, destroying the live tree,
`blocks` order): now tested (20 tests), each mutant caught. Fixed from the review:

- hr `capStart` used the nominative ("od 21 blok"): now the genitive plural (`blocksOf`).
- "Deleting files barely frees any space" was said whenever a snapshot existed; now only when less than half the
  file's blocks were freed (with `fileBlocks` 4 in a pool of 10, `rm` frees 3 of 4).
- The explanation said Btrfs and ZFS raise a per-block reference count; it now says the count is this model's view
  and that the real systems track sharing their own ways (shared metadata trees; block birth time) with the same
  space accounting.
- *reflink* had no Croatian gloss: "(kopija koja dijeli blokove)".
- The ENOSPC step highlighted the attempted cell as "new or moved": no longer.
- `No space left on device` was typed in the page: now `enospc` in `strings.js`.
- English captions read as orders ("Take snapshot …", "Destroy …") with mixed tenses: now "Taking snapshot @s1. It
  takes no blocks: it copies only the pointers." and "Destroying snapshot @s1 frees exactly …".
- "Shared with other trees" when only one tree was left: the trees are now named ("sa stablom podaci").
- A leftover screenshot script outside the folder (scope check): removed.

## Time

Start 2026-10-23 17:07 CEST, done 17:32 CEST.
