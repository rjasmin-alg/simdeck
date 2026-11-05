<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ec-vs-replication: specification

Task `docs/tasks/w3/ec-vs-replication.md`, catalogue `sto-ec-vs-replication` (§4.6). Class **explorer**: the state is a
pure function of the params (`sim.js` `compute`), no steps.

**One concept:** overhead vs failures tolerated vs rebuild cost, for `n` replicas and for erasure coding `k + m`.

## Scene

One object of `S` = 4 MiB, a row of hosts with one disk each (h1 … h12). The **current** scheme and the
**alternative** (the other kind, from the same params: EC k+m when replication is chosen, n× replication when EC is)
are two K3 block grids over the same host columns, so one failed host shows in both. Each grid has a rebuild row under
the pieces: the replacement piece (dashed outline) on the first free host, with one arrow per piece it reads. Below,
the comparison table (rule 6). Clicking a host (its column head, or any cell in its column) fails or restores it.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `scheme` | choice | `rep` / `ec` (`ec`) | the current scheme |
| `n` | range | 2–4 (3) | replicas |
| `k` | range | 2–8 (4) | data shards |
| `m` | range | 1–3 (2) | coding shards |
| `minSize` | choice | `default` / `custom` (`default`) | for the current scheme only; the alternative and the twins keep their default |
| `minCustom` | range | rep 1–n, EC k–k+m (4), clamped | shown with `custom` |
| `hosts` | range | 3–12 (9) | hosts, one disk each |
| `failed` | hidden range | 0–4095 (0) | bit i set = host h(i+1) down; bits at or above `hosts` are ignored. Set by clicks |

**Legend vs the task:** the task draws a replica as a full-height square and a shard as a short bar; K3 cells have one
height, so the piece size is written in each grid's header ("6 pieces of 1 MiB = 6 MiB …"). Both grids have
clickable host buttons as column heads.

Constants: `S` = 4 MiB (2²² B, an object of an RBD image or a RADOS object default size *(check)*), a pool of
**60 TiB** of data (cephsim `threeRacks` `cephfs_data` `stored` = 65 970 697 666 560 B = 60 TiB, read from the engine),
a disk of **8 TB** (10¹² B, the task's presets).

## Rules

Sources: cephsim `js/engine/pgmap.js` (`poolWidth`, `poolMinSize`, `poolEfficiency`, `pgState`), read and run;
Ceph documentation "Erasure code" and "Pools" (`size`, `min_size`) *(check: from memory, no network)*.

1. **Overhead.** Replication stores `n` full copies: raw = n × S, efficiency 1/n. EC stores k + m shards of S/k:
   raw = (k + m)/k × S, efficiency k/(k + m) (`poolEfficiency`). For the pool: raw = 60 TiB / efficiency.
   Efficiencies are compared as fractions (cross-multiplied), never as floats.
2. **Data intact** while live pieces ≥ `need`: 1 for replication, k for EC. Failures tolerated = width − need
   (n − 1, or m). Width = n or k + m (`poolWidth`).
3. **I/O continues** while live pieces ≥ `min_size` (`pgState`: active iff up ≥ min_size); below it the object is
   still there (rule 2) but reads and writes wait. Defaults: replication size − ⌊size/2⌋ (2 → 1, 3 → 2, 4 → 2), EC
   k + min(1, m − 1), i.e. k + 1, but k when m = 1 (Ceph's monitor, `prepare_pool_size` *(check: from memory)*;
   cephsim's `poolMinSize` uses k, see NOTES.md). Custom: replication 1–n, EC k–k+m (Ceph refuses an
   EC min_size below k *(check)*). Failures with I/O continuing = width − min_size.
   Status of a scheme: `ok` (every piece live), `degraded` (some missing, I/O continues), `stopped` (data intact,
   below min_size), `lost` (fewer than `need`).
4. **Rebuild.** One lost piece: replication reads one surviving copy (S) to write S; EC reads k shards of S/k (S in
   total) to write S/k: per rebuilt byte EC reads k ×. A whole lost disk of D bytes: replication reads D, EC k × D
   (derived; standard result *(check)*). 8 TB disk: 3× reads 8 TB, 4+2 reads 32 TB, 8+3 reads 64 TB.
   **Rebuild plan** drawn on the page: the lowest-numbered lost piece (piece order: R1…Rn, or d1…dk then c1…cm) is
   rebuilt on the lowest-numbered host that is up and holds no piece of that scheme; the sources are the first live
   copy (replication) or the first k live shards in piece order (EC). No plan when nothing is lost, when the data is
   lost (rule 2), or when no free host is up (`target: null`).
5. **Placement.** Pieces go to distinct hosts (one failure domain per host): piece i on host h(i+1), in order. With
   fewer hosts than the width, the pieces past the last host have no place (`host: null`, cephsim `NONE` holes):
   they count as missing from the start, so the object starts degraded, stopped or lost by rules 2–3.
6. **Comparison table** (tie-break): the columns are the current scheme, the alternative, and every *twin*: another
   scheme within the param ranges (replication 2–4, EC k 2–8, m 1–3) with exactly the current efficiency. Order:
   efficiency descending; equal efficiency → more failures tolerated first; then the current one first; then the
   narrower one. So 4+2 lists 6+3 (tolerates 3), 4+2, 2+1, then 3×. Twins and the alternative are placed on the
   same hosts and show the same failures (row "Now"). The caption's twin note names the first twin that fits.
7. **Changed** (legend): after a click, the cells of the host that changed (up ↔ down) and the rebuild cells and
   arrows whose plan (piece, target or sources) changed are marked, per scheme; presets, sliders and reset mark
   nothing, even when they change `failed`.
8. **Captions** count the down hosts that held a piece of the chosen scheme (`lost`), not every down host. When pieces
   are missing only because there are too few hosts (holes, nothing lost), the caption is the holes sentence plus a
   status sentence (degraded / stopped / lost). Notes: the rebuild (degraded with a plan), no margin (degraded with
   live = need), no free host, the twin (nothing down).

### Tie-breaks (each has its test)

- Rule 6: 4+2 and 2+1 both 2/3 → 4+2 (tolerates 2) before 2+1 (tolerates 1); 6+3 before both. 2+2 current with
  2× alternative (all 1/2): 3+3, 2+2, 2× (tolerated 3, 2, 1).
- Rule 6: equal efficiency and tolerance cannot happen between two different schemes in range (k/(k+m) and m fix
  k), so "current first" only orders a scheme against itself; the alternative is the other kind and never equal.
- Rule 4: two spare hosts → the lower one. Two lost pieces → the lower piece. EC sources skip lost shards (4+2 with d1
  down reads d2 d3 d4 c1).
- Rule 3: live = min_size exactly → I/O continues (3× with one down: 2 = 2).
- Rule 2: live = need exactly → data intact (4+2 with two down: 4 = 4).

## Presets (expected numbers)

Rules 1–4 by hand; failure counts on the pool from the cephsim engine (`sims/cephsim/js`), `threeRacks` `cephfs_data`
4+2, rule `ec-host` (chooseleaf indep type host), 1024 PGs, run with `evaluatePool` (script in NOTES.md).

| id | params | expected |
|---|---|---|
| `three-copies` | rep, n 3, h1 down | 300 % raw (12 MiB), 33.3 % usable; survives 2, I/O through 1 (min_size 2); 2 of 3 live → degraded, I/O continues; rebuild reads R2 (4 MiB) onto h4; 8 TB disk → 8 TB read |
| `ec-4-2` | ec, 4+2, h1 h2 down | 150 % (6 MiB), 66.7 %; survives 2, I/O through 1 (min_size 5); 4 of 6 live → stopped (en caption); rebuild of d1 reads d3 d4 c1 c2 onto h7; 8 TB → 32 TB. cephsim: osd.0 down → 59 of 1024 PGs degraded, 0 inactive; osd.0 + osd.12 (two hosts) with min_size 5 → 121 degraded, **6 inactive** |
| `ec-8-3` | ec, 8+3, 12 hosts, h1 down | 137.5 % (5.5 MiB), 72.7 %; survives 3, I/O through 2 (min_size 9); needs 11 hosts; rebuild of d1 reads 8 shards (4 MiB) onto h12 to write 0.5 MiB; 8 TB → 64 TB |
| `same-hardware` | rep, n 3, ec 4+2, no failures | 60 TiB: 3× needs **180 TiB** raw, 4+2 needs **90 TiB** (caption `cOkRep`; the task's hr caption, "150 % instead of 300 %, rebuild reads 4×", is `cOkEc` and shows with the defaults: 4+2, nothing down) |
| `min-size-k` | ec, 4+2, min_size custom 4, h1 h2 down | 4 of 6 live = min_size 4 → I/O continues, with no spare piece (note). cephsim, one rack (3 hosts) down: min_size 4 → **271** of 1024 PGs inactive; min_size 5 → **783** |

Other checked numbers: 2+1 = 150 %, 66.7 %, survives 1, min_size 2 (m = 1), I/O through 1; 6+3 = 150 %, survives 3, needs 9 hosts; 2× = 200 %, 50 %,
min_size 1; 4× = 400 %, 25 %, min_size 2; 4+2 on 5 hosts: one hole, starts degraded (5 live = min_size 5, I/O
continues); 8+3 on 9 hosts: two holes, 9 live = min_size 9.

## Out of scope

CRUSH placement details (`crush-failure-domain`), down vs out and recovery timing (`ceph-down-out`), EC plugins and
Reed–Solomon maths, the partial-stripe write penalty in depth, RAID 5/6 (`lnx-raid-rebuild`).
