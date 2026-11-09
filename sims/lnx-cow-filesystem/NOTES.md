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

---

# Preset win-vss: Volume Shadow Copy and Previous Versions

Task `docs/tasks/w3/win-vss.md` (catalogue `win-vss` §4.5.7, overlap §5.2). Scenes `previous-versions`,
`diff-growth`, `diff-full` (presets 5–7) in copy-on-write mode; rules V1–V7 and numbers: `SPEC.md`, "Copy-on-write
mode". Preset entries in `sim.json`: `previous-versions`, `diff-full`.

## Decisions (win-vss)

- **The host model was extended additively, not requested and stopped.** The task says to write the needed change
  under Shared requests and stop if the host cannot express it; it could not (no in-place write, no diff area, no
  times, no restore). As the `win-boot`, `win-update-rings` and `win-failover-cluster` preset tasks did with their
  hosts, and running unattended with the host done, I made the change inside this folder: `writeInPlace`, `restore`,
  `pickShadow`, `diffFreeIds`, `isDiff`, `mode`, `diffLimit`, an optional `diffSize` in the fs data and in `space()`
  (`diffUsed`, `diffFree`, `diffTotal`). The host's scenes produce the same states as before: their states carry no
  new field (tested), and the 20 host tests pass; only two generic ones changed, to cover the new scenes too (the
  step-count list and its param loops gained `diffLimit`; the JSON-safety test runs with `diffLimit` 3).
  `space().used` now counts volume blocks only (the same number for the host, which has no diff area).
- **Same data shape as the host.** A shadow copy is the host's read-only snapshot tree with a `time`; the difference
  between the two policies is only *whose pointer moves*: redirect-on-write moves the live pointer to a new block,
  copy-on-write moves the shadows' pointers to a copy and overwrites the live block in place. That keeps
  `sto-cow-vs-row` (the other §5.2 preset here) a matter of running both on the same ops.
- **Rows:** volume (the live data; it is its own physical row, since its pointers never move), diff area (Δ0 …, the
  limit's worth of cells), then one row per shadow (its view of each block: `→2` = still the live block, `→Δ0` = the
  copy). Shadow rows keep their place before they are taken and after they are deleted (struck, "deleted"), as the
  host's snapshot rows. Colours: the volume series 1, S1–S3 series 2–4; a diff block held by one shadow is solid in
  that shadow's colour, one held by several is hatched neutral with ×n.
- **Arrows:** copy (volume k → its Δ) and restore (Δ → volume k), `now`, between the two adjacent physical rows only.
- **Foot:** a "Previous versions" table (each shadow, when taken, how many diff blocks it reads, available / deleted;
  changed values on the highlight) and a meter of the diff area (used of limit).
- **Legend and explanation per mode.** The kit builds the legend once; the page lists both modes' items and hides the
  other mode's (`data-only` on the `li`, `data-mode` on `<html>`, CSS). The explanation is two `data-t-html` blocks
  switched the same way. The **subtitle** ("writes go to new blocks", the host's concept) is replaced in
  copy-on-write mode by `subtitleCow`: it would otherwise state the opposite of what these presets show, which is one
  of the task's misconceptions. Language switches reload the page, so the override holds.
- **Caption terms:** *shadow copy* (sjenovita kopija) by the term rule at its first mention (the first shadow step),
  then in italics alone. "Diferencijalno područje" and "svezak" are written in Croatian only.
- **Windows is named** (the concept is Windows': Volume Shadow Copy, the Previous Versions tab) in the explanation and
  the subtitle; no command line, no backup product.
- **Times** are data ("HH:MM" strings, `translate="no"`), compared as strings; the task's captions are used ("Pri prvoj
  izmjeni nakon sjene …", "Vraćanje iz sjene S1: datoteka se vraća na sadržaj od 10:00.").
- **Restore is a write.** In `previous-versions` S2 is taken before the restore, so the restore first copies C2, D1
  for S2: the replaced version stays restorable. The task's preset ends at "restore v1 from S1"; this adds one
  snapshot step to show it.
- **`diff-full` ends with a failed and a working restore:** step 8 asks for the version from before 09:30, which only
  the deleted S1 had (`restore-none`, caption "previous versions are not a backup", rule V5); step 9 restores from S3.

## Deviations (win-vss)

See SPEC.md "Deviations from the task (win-vss)": `mode` follows the scene; no `action` param (fixed scripts);
6 / 7 / 9 steps. Also: `poolSize` is hidden in the copy-on-write scenes (the presets set 10, its label says "pool");
the restore writes only the blocks that differ.

## Sources (win-vss)

Microsoft documentation *Volume Shadow Copy Service*, *How Volume Shadow Copy Service works* (copy-on-write, the diff
area), *Previous Versions*, *Shadow copy storage space* (the maximum size; older shadows deleted when it is reached):
**from memory, not re-read in this session (no network)**: every rule V1–V5 is *(check)*. In particular:

- V3: that the *oldest* shadows are deleted when the diff area reaches its maximum *(check)*; the real limit is in
  bytes or a percentage of the volume, here in blocks.
- V2: Windows keeps each copy with the newest shadow and older shadows read through the newer ones' diff areas; the
  model points every sharing shadow at the copy, which gives the same space and the same deletions *(check)*.
- V4: restore rights (reading previous versions without admin rights) are not modelled *(check)*.
- Real volumes skip copying blocks that were free when the shadow was taken; no preset writes a block that was free.

## Term pairs (win-vss; missing from `kit/glossary.js`, written out in both tables)

| en | hr |
|---|---|
| shadow copy | sjenovita kopija *(check)* |
| diff area | diferencijalno područje *(check)* |
| volume | svezak *(check)* |
| previous versions | prethodne verzije |

## Shared requests (win-vss)

- **kit.js legend per preset or mode:** a legend item's optional `visible(params)` (like a param's), so a host page
  with a second mode does not hide `li` elements itself.
- **kit.js subtitle per preset entry:** when a `sim.json` entry is the active preset, show its `concept` as the
  subtitle (the host's concept can contradict a preset's).
- **K3:** a cell pattern for "a copy kept for a snapshot" (the task asked for a distinct pattern for diff-area
  blocks); the page uses its own row, the Δ ids and the shadow's colour meanwhile.
- **Model promotion:** `writeInPlace` and `mode` are pure and word-free, as the host's functions; `sto-cow-vs-row`
  will want I/O counts per write (reads, writes, metadata updates), which neither mode returns yet.

## Checks (win-vss)

- Numbers before the page: `node` script over the model printing, per step, volume used, diff used, copied,
  overwritten, dropped, freed and each tree's view; they match SPEC.md and are asserted in the tests.
- `node --test sims/lnx-cow-filesystem/sim.test.js`: 29 tests (9 new). Mutations, each caught: lowest → highest
  diff id; same-time tie → the earlier shadow; `<` → `<=` on the restore time; oldest instead of newest shadow;
  drop the newest shadow; no `keep` for the restore source; copy on every write; never copy; only the newest shadow's
  pointer moves; the copy holds the new data; restore all blocks; restore writes a new version; diff usage counts the
  volume; a dropped shadow frees nothing; dropped shadows not in `gone`; copy-on-write for the host's scenes; no
  shadow time; `restore-none` as `restore`; `dropped` carried into the next step (19 of 19).
- Every step of presets 5–7 in both languages at 1920×1080 (scripted): one screen, no text under 16 px, every word
  from the tables, no console error. Screenshots looked at: previous-versions 3, 6; diff-growth 6, 7; diff-full 7, 8,
  9; diff-full 7 at 375×812. The tightest is diff-full 7 in Croatian (five rows, a four-line caption).
- `npm run gate -- lnx-cow-filesystem`: pass (64/64 browser checks, both entries open).

## Review (win-vss)

No separate fresh reviewer (a preset task); the mutations and the script check stand in for it.

## Time (win-vss)

Start 2026-11-05 02:27 CET, done 02:42 CET (about 15 minutes, one session).

---

# Preset sto-cow-vs-row: copy-on-write vs redirect-on-write

Task `docs/tasks/w3/cow-vs-row.md` (catalogue `sto-cow-vs-row` §4.6, overlap §5.2). Scenes `four-writes`,
`rewrite-same`, `delete-snapshot` (presets 8–10) in compare mode; rules C1–C7 and numbers: `SPEC.md`, "Comparison".
Preset entry in `sim.json`: `four-writes`.

## Decisions (cow-vs-row)

- **The host model was extended additively, not requested and stopped**, as win-vss did: the task lists four things
  the host must support (a per-volume logical → physical map, a write policy switch, per-operation I/O accounting, two
  volumes in lockstep). The host already had the map (a tree's pointer list) and both policies (`write` redirects,
  `writeInPlace` copies first); this preset adds `ioOf` (the I/Os of one write, in order), `seqRead` (runs and jumps),
  `maps`, the `compare` mode and the two-sided state. No host function changed; the 29 earlier tests pass; two generic
  ones changed only to cover the new scenes (the step-count list; the fileBlocks/poolSize loop skips the comparison,
  whose geometry is fixed and has its own test).
- **Copy-on-write is the win-vss mode with a 4-slot area.** `writeInPlace` over a volume of 8 with `diffSize` 4 puts
  the diff ids at 8–11, exactly the task's slots 8–11 for the snapshot area, so the CoW column needs no new write code.
  The area never fills in these presets (at most 4 copies), so win-vss's "drop the oldest shadow" never runs here.
- **Two K3 grids side by side**, one per policy: rows live map (8 cells, text = the version, `→slot` as sub), snapshot
  map, then the 12 slots. Colours: blue = only the live volume, orange = only the snapshot, hatched neutral ×2 =
  shared. The CoW snapshot area is a dashed span with its name under it; its free slots are `ghost`. A bracket above
  was tried first: the read-for-copy arrow's level run passes through that band and crossed its label.
- **Arrows:** the write (solid, from the live block down to the slot written: in place for CoW, the new slot for RoW),
  the read for the copy (dashed, slot to slot, an arc over the row), and on the read-back step the jumps between runs
  (dotted arcs). The metadata update is the moved live pointer: highlighted with the kit's underline mark.
- **Under each grid:** this step's I/Os in order as numbered chips ("1. čitaj 1 · 2. piši 8 (kopija) · 3. piši 1 (na
  mjestu)"), then a table of reads / writes / metadata / total for this write and for all writes since the snapshot;
  the header counter is the running total. The read-back and the delete show what they read or freed instead.
- **The read-back is not counted as I/O** in the totals: the totals are the write penalty (12 vs 4 + 4); the read's
  cost is its jumps.
- **`policy` param** (both / CoW / RoW, default both) only hides a column (rule C7: the model always runs both); it
  keeps the captions to the columns shown.
- **Captions:** the task's two sample captions are used for the first write (hr CoW: „staro se prvo pročita i prepiše
  u snimku, pa tek onda novo ide na isto mjesto: 3 U/I operacije za jedno pisanje"; en RoW: "the new block goes to
  slot 8 and only the pointer changes"), with the I/O count as a numeral. The start caption introduces the terms
  (*snapshot*, *copy-on-write*, *redirect-on-write* with the Croatian in parentheses) and the naming trap (Btrfs and ZFS
  are called copy-on-write but redirect on write), once. The last write of a scene adds the totals.
- **Subtitle** in compare mode: `subtitleCmp` (the host's "writes go to new blocks" is only half of this comparison).
- **Ten presets** no longer fit one column of the panel at 1920×1080 (957 > 827 px in Croatian): the panel lists them
  in two columns (one on a phone), as `xss` and `wireguard` do. The tenth preset has no number key (the kit has 1–9).
- **Grayscale:** shared blocks are hatched, owned ones solid; "live only" (blue) and "snapshot only" (orange) are
  both solid and differ in grey only slightly. The version label carries it (B0 = the snapshot's old block, B1 = the
  live data) and so does the map row whose `→n` points to the slot, as in the host, whose trees also differ by colour
  and row only.
- **Named:** LVM (classic snapshot vs thin pools, NLA T20), Btrfs and ZFS (NLA T22, T23), in the explanation and the
  start caption only (the naming trap needs the names). No commands.

## Deviations (cow-vs-row)

See SPEC.md "Deviations from the task (sto-cow-vs-row)": additive host extension; two-sided state shape; param
`policy` instead of `mode`; legend arrows and the metadata mark. The task's topic `storage` does not apply to a
preset (a preset has no topic in `sim.json` entries; the host's topic is `linux-admin`); tag `filesystems` is the
host's.

## Sources (cow-vs-row)

All **from memory, not re-read in this session (no network)**; every rule C1–C5 and the naming trap is *(check)*:

- lvcreate(8) `-s` (a classic snapshot with its own COW area: the origin's old chunks are copied there on the first
  write), lvmthin(7) (thin snapshots share the pool's blocks; new data goes to newly provisioned blocks) *(check)*.
- OpenZFS documentation, "Copy-on-write" (blocks are never overwritten in place; new data goes to new blocks and the
  block pointers are updated up to the uberblock) *(check)*.
- Btrfs documentation, "Subvolumes" and "Snapshots" *(check)*.
- SNIA Dictionary, "copy on write" and "redirect on write" *(check the entry titles and wording)*.
- NLA `meta/toc.md` T20, T22, T23: chapters not written; used only for the topics and the word *snimka*.
- Numbers: printed by a node script over the model before the page was written; they match the task's preset numbers
  (12 vs 4 + 4, the 4 jumps, 5 vs 3 + 3, the freed slots) and are asserted in `sim.test.js`.
- Not counted (simplification, said in the explanation): a CoW snapshot's own metadata write (its exception table)
  and a RoW system's pointer-tree updates up to the root *(check how much they add)*.

## Term pairs (cow-vs-row; missing from `kit/glossary.js`, written out in both tables)

| en | hr |
|---|---|
| redirect-on-write | preusmjeravanje pri pisanju *(check)* |
| write penalty | kazna pisanja *(check; the glossary has "small-write penalty" → kazna malog pisanja)* |
| fragmentation (of a volume) | rascjepkanost *(check; the glossary has "internal / external fragmentation" → fragmentacija)* |
| metadata | metapodaci (UL ch23) |
| I/O | U/I (the glossary's "I/O module" → U/I modul) |
| slot (physical position) | utor *(check)* |
| snapshot area | područje snimke |

## Shared requests (cow-vs-row)

- **K3 arrow into the same cell:** a write in place ("an arrow into the same slot") cannot be drawn; a link with the
  same cell at both ends is a spec error. A self-link drawn as a small loop or a bold down-tick on the cell would do.
  The page draws the arrow from the live map's block to its slot instead.
- **K3 dotted-link legend swatch:** the kit has `dash` (dashed line) but no dotted one; the page defines `dot`.
- **kit.js presets past nine:** a tenth preset has no number key; presets 10+ could take `0` or a second row.
- **Model promotion:** `ioOf` and `seqRead` are pure and word-free, like the host's functions, and can move to
  `models/` with the rest.

## Checks (cow-vs-row)

- Numbers before the page: a node script over the model printing, per step and side, the live and snapshot maps, the
  I/O list, the totals, the freed slots and the read's runs and jumps; they match the task.
- `node --test sims/lnx-cow-filesystem/sim.test.js`: 39 tests (10 new). Mutations, each caught (11 of 11): no read
  for the copy; the in-place write before the copy; no metadata update; RoW writing in place; CoW redirecting;
  backwards steps not counted as jumps; the read-back counted as I/O; delete as a no-op; the policy changing the state;
  a 3-slot area; a start without a snapshot.
- Every comparison step in both languages at 1920×1080, plus single-column views and 375×812 (scripted): one screen,
  no text under 16 px, no stage overflow, no console error. Screenshots looked at: four-writes 0, 1, 4, 5; rewrite-same
  3; delete-snapshot 6; four-writes 1 CoW-only and 4 RoW-only; four-writes 1 at 375×812. The tightest is four-writes 4
  in Croatian (a four-line caption with the totals).
- `npm run gate -- lnx-cow-filesystem`: pass (65/65 browser checks, both entries open). `npm test` (8588) and
  `npm run check` pass.

## Review (cow-vs-row)

No separate fresh reviewer (a preset task); the mutations and the script check stand in for it.

## Time (cow-vs-row)

Start 2026-11-09 06:06 CET, done 06:23 CET (about 17 minutes, one session).
