<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ec-vs-replication: notes

New explorer (task `docs/tasks/w3/ec-vs-replication.md`, catalogue `sto-ec-vs-replication`, wave 3). Kit view **K3**
(`Simdeck.blockGrid`) draws both schemes. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Both schemes drawn, on the same host columns.** The task's scene shows the current scheme and a table for "the
  current scheme and the alternative". The page draws the alternative too, as a second K3 grid over the same hosts, so
  one click fails a host in both and the comparison is seen, not only read: 4+2 and 3× both stop after two failures on
  h1–h2. The current grid is outlined and tagged "chosen", the other "compared".
- **Rebuild row.** Under each scheme's pieces, the replacement piece (K3 `ghost`, dashed) on the first free host, with
  one K3 link per piece it reads: one arrow for a replica, k arrows for a shard. This is rule 4 on the stage; the row's
  aside says "reads 4 MiB for 1 MiB". Recovery below min_size is drawn too (the plan exists whenever the data is
  intact); Ceph can recover an EC PG below min_size in recent releases *(check)*. No timing: `ceph-down-out` owns it.
- **Twins in the table** (rule 6). The task's tie-break ("4+2 and 2+1 both 67 % → the one tolerating more failures
  first") needs two schemes of equal efficiency in the table; with only current + alternative (always of different
  kinds) it could never apply. So the table adds every in-range scheme with exactly the current efficiency ("same
  share"): 4+2 shows 6+3, 4+2, 2+1, 3×. This is also the third misconception on the page ("4+2 and 2+1 are equally
  safe"). Sorted by efficiency, then tolerance, then current first, then narrower (the last two never decide between
  different schemes; a test checks every pair in range).
- **Placement in host order** (piece i on host h(i+1)); rule 5's distinct hosts, no CRUSH (out of scope). So the 3×
  copies sit on h1–h3 and the 4+2 shards on h1–h6; failing h1–h2 hits both twice.
- **Too few hosts = holes**, as cephsim does (`NONE`): missing from the start, counted by rules 2–3, so 8+3 on 9 hosts
  starts degraded (9 = min_size 9), on 8 stopped and on 7 lost. The task said "cannot be placed"; the hole model gives the same
  warning with more information (table "Hosts needed" shows ✕ 11).
- **Click state** is a hidden range param `failed` (bit mask, 0–4095), like the hidden params of `lnx-cow-filesystem`
  and `amdahl`: it lives in the URL and presets set it. Host column heads are buttons (keyboard, `aria-pressed`);
  any cell of a column also toggles it. Reset (R) restores every host.
- **Changed marks** only after a click on a host (rule 7): the host's cells and button, and the rebuild cells and
  arrows whose plan changed. A preset that differs from the defaults only in `failed` marks nothing.
- **Status badge** in each grid's header: "I/O stops" on the warn colour with a thick warn frame **and** the words
  ("I/O stops: 4 < min_size 5"); lost in danger red with ✕; degraded dashed; ok ✓. The font has no ◐ or ⏸ (noted in
  `ceph-min-size`), so no symbols there.
- **Piece size** is written in each grid's header ("6 pieces of 1 MiB = 6 MiB for an object of 4 MiB"), not drawn as
  cell height: K3 cells have one height, and at 9–12 columns a "1 MiB" sub line wrapped in every cell.
- **Constants, not params:** the 60 TiB pool (cephsim `threeRacks` `cephfs_data` stored, read from the engine) and the
  8 TB disk appear as table rows ("Disk for 60 TiB of data", "Rebuilding an 8 TB disk reads"), so the
  `same-hardware` preset needs no extra param.
- **Pool-level numbers** from the cephsim engine (59 / 121+6 / 271 vs 783) are in SPEC.md and, for the rack case, in
  the explanation; the page itself models one object, not 1024 PGs (one concept).
- **Concepts, not tools:** Ceph is named only in the explanation's cluster example (NLA T26 teaches it); `min_size`
  is the subject. No other product is named.

## Deviations from the task

- **I/O below min_size**: the task's en caption says "writes stop"; the page says reads and writes stop ("I/O
  stops"), because an inactive PG serves neither (cephsim `pgState`: active iff up ≥ min_size; Ceph "Placement Group
  States" *(check)*).
- **hr caption**: the task's „Kodiranje s brisanjem (*erasure coding*) 4+2 …" is written per the term rule
  (COMMON §4) as „*Erasure coding* (kodiranje s brisanjem) 4+2 troši 150 % prostora umjesto 300 % …"; the rebuild part
  says "4 × više".
- **Scene**: no separate object drawing on the left; the object and its pieces are in each grid's header line. K3
  instead of K2 (the task's "K2 topology (or own drawing)"; the Depends line names K3).
- **Rule 5**: holes instead of "cannot be placed" (Decisions).
- **Rule 6**: twins added to the table (Decisions).
- **State**: `{ p, hosts, failed, cur, alt, cols }`, each scheme with `pieces`, `live`, `status`, `plan`; `failed` is a
  bit mask param, `placement` is per piece (`pieces[i].host`).
- **Params**: `minSize` choice plus `minCustom` range (rep 1–n, EC k–k+m); `failed` hidden.
- **Presets** set failures so each opens on its point: `three-copies` h1 down, `ec-4-2` h1 h2, `ec-8-3` h1 on 12
  hosts, `min-size-k` h1 h2. The task's "rack of 3 hosts" for `min-size-k` is the pool figure in the explanation;
  with one object, two failures already show the knob (4 = min_size 4 keeps I/O, 5 does not).

## Sources

- cephsim `js/engine/pgmap.js` (`poolWidth`, `poolMinSize`, `poolEfficiency`, `pgState`, `evaluatePool`) and
  `js/samples.js` `threeRacks`, in `sims/cephsim/` (copied from `~/projects/cephsim`). Read and run (script below).
  cephsim's `poolMinSize` defaults EC to k; Ceph's default is k + 1, or k when m = 1 *(check)*; the page uses that. A note
  for cephsim's owner, not fixed here.
- Ceph documentation "Erasure code" and "Pools" (`size`, `min_size`, defaults size − size/2 and k + min(1, m − 1), EC min_size
  range k…k+m) *(check: from memory, no network)*.
- Rebuild read k × D for EC vs D for replication: derived, the standard result *(check)*.
- RADOS / RBD default object size 4 MiB *(check: from memory)*.
- `~/projects/napredna-linux-administracija/meta/toc.md` T26 (Ceph): via the task text, not opened.

Engine run (from the repo root; `S` = this script):

```js
const { makeSample } = await import(eng + '/samples.js');
const { compileMap, reweightsFor } = await import(eng + '/compile.js');
const { evaluatePool } = await import(eng + '/engine/pgmap.js');
const three = makeSample('threeRacks'), map = compileMap(three), rw = reweightsFor(three);
const ec = three.pools.find((p) => p.name === 'cephfs_data');          // 4+2, min_size 4, 1024 PGs, stored 60 TiB
evaluatePool(map, ec, rw, { down: new Set([0]) });                       // 965 clean, 59 degraded
evaluatePool(map, { ...ec, min_size: 5 }, rw, { down: new Set([0, 12]) }); // 897 clean, 121 degraded, 6 inactive
// rack 1 = hosts ceph-r1-1..3 (osd.0–35): min_size 4 → 271 inactive; min_size 5 → 783 inactive
```

## Checks

- Numbers printed from the model and the engine before the page was written; asserted in `sim.test.js`.
- **Mutations** (own): 27 one-at-a-time mutations of `sim.js` (efficiency of each kind, need, the ≥ thresholds of rules 2
  and 3, both default min_sizes, rebuild k ×, shard size, target host, source choice, lost piece choice, holes, every
  sort key of rule 6, custom min_size scope and clamp, the host mask, changed marks, notes, toggle). 25 failed a test.
  The two survivors were equivalent (a float tolerance on equal efficiency, a filter for equal tolerance that can never
  match); the filter was removed and a test now checks every pair of in-range schemes.
- `npm run gate -- ec-vs-replication`, screenshots reviewed (light, dark, grayscale, phone, both languages), plus a
  local Playwright run: clicks on a host button and on a cell, every preset by key, 5 hosts, a lost object, 8+2.
- **Fresh review** (a separate agent: re-derived every number and the cephsim counts, about 60 mutations on a copy,
  read the page). Fixed from it: the EC default min_size for m = 1 (k, not k + 1: Ceph uses k + min(1, m − 1)
  *(check)*); captions that counted down hosts holding no piece, and "0 hosts are down" when only holes were missing
  (new `cHoles` + status sentences, rule 8); Croatian agreement in the grid header ("3 dijela", plural forms); the
  compared grid's column heads were plain text (now host buttons, from the strings table); the twin note naming a
  twin that does not fit on the hosts; `nNoMargin` overstating ("unreadable until the disk returns, lost if it does
  not"); "use 67 % of the space" → "67 % usable"; the `same-hardware` row of SPEC naming the wrong caption. Its 14
  surviving mutations (plan marks without sources or for the wrong scheme, `w < hosts`, twins evaluated without
  failures, the no-margin condition, `nHoles` with `cHoles`, preset params, defaults and ranges, rounding, the host
  list) now fail tests; the rest it judged equivalent (efficiency as floats in range, `toggleHost` without the mask).

## Term pairs

Not in `kit/glossary.js` (only *rebuild* = obnova is); written out by hand (`<em lang="en">` in the explanation,
`*…*` in the caption). For the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| erasure coding | kodiranje s brisanjem | task *(check)* |
| replication | replikacija | task |
| replica | kopija (replika) | task |
| data shard | podatkovni dio | task *(check)* |
| coding shard | zaštitni dio | task *(check)* |
| overhead | dodatni prostor | task (the page says "prostor (sirovo)") |
| failure domain | domena kvara | task *(check)* |
| placement group | grupa smještaja | `ceph-min-size` NOTES *(check)* |

## Shared requests

- **K3 `blockGrid`**: a click hook for cells (`onCell(row, cell)`) or a `data-col` attribute on cells. The page maps a
  click to its host from the cell's inline `grid-column`, which depends on the label column; a kit attribute would
  make this robust.
- **K3**: cells of different heights (a full replica vs a shard of S/k) would let the stage draw the size instead of
  writing it.

## Time

Started 04:49, done 05:15 (about 26 minutes, one session, including the fresh review and its fixes).
