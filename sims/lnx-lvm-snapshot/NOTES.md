<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-lvm-snapshot: notes

New stepper (task `docs/tasks/w3/lnx-lvm-snapshot.md`, catalogue `lnx-lvm-snapshot` §4.4, overlap §5.2), drawn on kit
view **K3: block grid** (`kit/blockgrid.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Model reuse.** `models/` has no LVM model, and `lnx-lvm-extend`'s code is PE allocation over disks, which a
  snapshot does not need: the VG's free space here is one count. So nothing was copied; the sim reuses that sim's
  vocabulary and names (VG `podaci`, the lvs columns, "all or nothing" for a growth the VG cannot give, its rule 3).
  The snapshot operations (`io`, `readSnap`, `autoextend`, `dataPct`) are pure functions over
  `{ origin, cow, cap, valid, vgFree }` with no words, so they can be promoted unchanged.
- **Scripts, not free input.** Each preset is a fixed script of I/Os (hidden `scene` select), so step counts are fixed
  and replay holds (as `lnx-cow-filesystem`). Params change the outcome of the same script; every caption is worded
  from the model's event, so any cap/VG/autoextend combination reads true.
- **One grid, four rows.** `lv_data` (16 chunks, solid, `A1`…), `snap` (the CoW area: `cap` slots), "reading snap"
  (each chunk as a reader of the snapshot gets it), "VG free" (free slots the VG could give). Rows 2 and 3 are the
  task's rows 2 and 3; the VG row is added so autoextend is visible as cells moving from the VG into the area (new
  slots are marked changed). The `lvs` lines (LV, VG, Attr, Origin, Data%; shortened, said under them), a Data% meter
  with the threshold tick (autoextend on), and the next I/O of the script are the grid's foot.
- **Cell kinds.** Saved old version: `soft` (hatched) in the snapshot's colour; the snapshot's own write: `fill`
  (solid) in the snapshot's colour; chunk read through to the origin: `ghost` (dashed) with `↑`; a chunk read from the
  area carries its slot number (`#2`). Invalid: the area's slots `dead` (grey, crossed, struck), the reader row `bad`
  (danger frame, ✕), with "✕ invalid: content lost" / "✕ reads fail" as asides and the attr `swi-I-s---` in red.
- **Links (few):** only this step's: origin cell → the slot it was copied into; for a read, the slot or the origin cell
  → the reader cell; a failed read gets a `broken` link from the `snap` row's label.
- **Versions** count per volume: the origin's C goes C1 → C2 on its write; the snapshot's own write to H makes its H2
  while the origin keeps H1. Writing the same chunk on both sides (no preset does) gives two different C2s, one per
  volume, told apart by row and colour.
- **lvs Attr open flag:** `snapshot-write` and `backup-window` have the snapshot mounted, so its Attr is `swi-aos---`
  (`swi-Ios---` invalid); the other scenes `swi-a-s---`. The origin is mounted throughout (`owi-aos---`).
- **Autoextend** is checked once after each write (one monitoring poll per write). Since growth is at least one slot,
  a successful check always leaves a free slot for the next write, so the task's phase (b) "try autoextend, then
  invalidate" gives the same results and is not a separate step (SPEC.md rule 7).
- **Asides** have a fixed minimum width (page CSS), so the cells do not shift when "invalid" replaces "2 of 4".
- **Names on the page:** LVM, `lvcreate -s -L`, `lvs`, `lvm.conf` are the subject (NLA T20). dmeventd is named only in
  SPEC.md (Sources), not on the page ("LVM monitoring").

## Deviations from the task

- **Legend:** "snapshot-own write (cross-hatched)": K3 has no cross-hatch kind; it is solid (`fill`) in the snapshot's
  colour, against the hatched saved versions and the origin's solid cells in another row and colour. Grayscale keeps
  hatched vs solid apart.
- **VG free row** added (above).
- **Step 0** is the moment after `lvcreate -s`; the command itself is not a step (the task counts steps as writes).
- **backup-window script** (the task gives only "cap 3, a backup reads while the application rewrites 4 chunks, later
  reads fail", 8 steps): write C, read A, write D, read C, write E, write F, read D, read E: one read from the origin, one
  from the area, two failed reads after write F invalidates.
- **snapshot-write order:** origin C, snapshot H, origin F, snapshot K, origin M.
- **fill-up chunks:** C, F, H, K, M, A (the task: "6 different chunks").
- **Autoextend threshold** is strictly above (lvm.conf "exceeds"), where the task says ≥ (after the review). Same
  preset numbers.
- **Croatian term rule:** *snapshot* (snimka) and *copy-on-write* (kopiranje pri pisanju) are set as English terms at
  their first mention (start caption, explanation); later captions, labels and the legend use the Croatian words
  (snimka, područje snimke), as `lnx-lvm-extend` does with the book's words: "područje *snapshota*" in every caption
  would read badly. The coordinator may want it strict.
- No `entries` in `sim.json` (presets are not listed separately on the home page): the coordinator can add them.

## Sources

- Task "Model and presets" (rules 1–7, params, presets, captions, terms, misconceptions).
- `lnx-lvm-extend` (VG `podaci`, lvs columns, all-or-nothing growth) and UL ch12 (PV/VG/LV vocabulary, *extent*).
- `lnx-cow-filesystem` (page structure on K3, the term strings, the hidden-param and slider-blur workarounds).
- Man pages, from memory, not re-read here *(check)*: lvcreate(8) `-s`/`--snapshot` (writable by default),
  lvs(8) attr field (1st `s` snapshot / `o` origin, 5th `a` active / `I` invalid snapshot, 7th target type `s`), Data%
  `100.00` for an invalid snapshot, lvm.conf(5) `snapshot_autoextend_threshold` (default 100 = off, minimum 50; the
  text says "exceeds", the task and the model use ≥) and `snapshot_autoextend_percent` (of the current size), dmeventd
  monitoring needed; lvmthin(7) contrast (a full thin pool stops writes).
- Real chunk sizes 4 KiB–512 KiB (lvcreate `-c`) and 4 MiB extents: in the explanation only *(check)*.
- `single-page-labs/lvm-topology-lab-v2.html`: not used beyond the idea (it is adopted as `lvm-topology`, linked as
  related).

## Term pairs

Missing from `kit/glossary.js` (written out in `strings.js` as `termSnap`, `termCow`, as `lnx-cow-filesystem` does):

- snapshot — snimka (NLA toc T20)
- copy-on-write — kopiranje pri pisanju
- origin volume — izvorni volumen
- chunk — komad *(check)*
- invalid snapshot — nevaljana snimka *(check)*

`logical volume` comes from the glossary. *extent* is written as UL ch12 does (see `lnx-lvm-extend` NOTES).

## Shared requests

- **K3 cross-hatched kind** (task legend "snapshot-own write, cross-hatched"): a cell kind for "owned by the second
  party" distinct from `fill` by pattern, not only colour, would help any grid with two writers. Worked around with
  solid vs hatched.
- **K3 aside width:** a spec option for a fixed aside column width (`asideWidth`), so a grid whose asides change length
  does not shift its cells. Done in page CSS (`.sd-bg-aside { min-width }`).
- Carried from `lnx-cow-filesystem`: `.sd-ctl[hidden]` (kit.css `display: flex` beats `hidden`), and the slider blur
  after a click at its end (the clicker's → moves the slider). Same workarounds here.

## Checks

- Numbers before the page: a node script printed Data%, cap, VG free and read sources per step of every preset; all
  match SPEC.md (25/50/75/100 then invalid; 25/50 then 50; 25, 50, 75→cap 6, 66.67, 83.33→cap 9, 66.67; snapshot-write
  100 after 4; backup-window 33.33/66.67/100, invalid at write F, reads D and E fail).
- `node --test sims/lnx-lvm-snapshot/sim.test.js`: 27 tests. Mutations (each broken once): slot saves the new version,
  slot test per write, reads ignore the area, snapshot writes take no slot, snapshot writes change the origin, Data% off
  by one, invalidation off by one, the origin stops on invalidation, Data% < 100 when invalid, reads succeed when
  invalid, attr without `I`, `>` instead of `≥`, partial growth, floor instead of ceil, an invalid snapshot growing, VG
  free not reduced, writes to an invalid snapshot succeeding; and after the review ≥ instead of >, round instead of ceil, `<=` VG test,
  no version bump on a snapshot rewrite, `ev.final` unset, a changed backup-window script, each clamp limit, no open
  flag: all caught (28).
- Scripted screenshots (Playwright, 1920×1080): fill-up 0, 4, 5, 6 (en); autoextend 3, 5 (en), 6; snapshot-write 4;
  backup-window 2 (en), 4, 7; same-chunks 10. No overflow of the stage, grid, caption or page; no console errors.
- `npm run gate -- lnx-lvm-snapshot`: see the report for the final run.

## Review

A fresh reviewer read the diff against the task and `SPEC.md`, loaded every preset at every step in hr and en with 9
param variants in a browser (no errors, no `undefined`/`NaN`), mutated a copy of the model and checked the LVM facts.
Every preset number matched. Fixed from the review:

- Threshold ≥ → > (lvm.conf "exceeds"); the sliders reach the tie (threshold 50, even cap), where the caption would
  have claimed a growth real LVM does not do. Tie-break test turned round.
- hr grammar: "u grupi volumena ostalo 4 mjesta" → "slobodno u grupi volumena: 4 mjesta"; start caption "snimka … dobila
  je područje za *copy-on-write* … od 4 mjesta"; "a snimka i dalje čita A1" → "a čitanje snimke i dalje daje A1".
- Start caption Data% as "0 %" like every other caption (was lvs-style "0.00").
- Snapshot Attr shows open (`o`) where it is mounted.
- Unused `termSnapLater`/`termCowLater` strings dropped.
- Tests for the surviving mutants (above) and a test that the page's preset params equal SPEC.md's.
- Not changed: growth amount "at least enough to get under the threshold" in newer lvm2, and partial growth: noted in
  SPEC rule 7 *(check)*; *extent* without the glossary's "ekstent" (as `lnx-lvm-extend`).

## Time

Start 2026-11-03 18:18 CET, done 18:38 CET.
