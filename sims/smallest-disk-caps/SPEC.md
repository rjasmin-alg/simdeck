<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# smallest-disk-caps: specification

Task `docs/tasks/w3/smallest-disk-caps.md`, catalogue `sto-smallest-disk-caps` (§4.6). Class **explorer**: the state
is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** the fullest OSD sets what a pool can still take (*MAX AVAIL*); with size 3 on three hosts every host
holds a full copy, so the host with the least disk fills first, whatever the cluster's raw free space says.

## Scene

- **`ceph df` box** (top): raw capacity, raw used (and its %, "the cluster is 19 % full"), *raw free ÷ size* (what the
  raw number suggests), **MAX AVAIL** of the pool (Ceph's projection from the OSD that reaches the full ratio first),
  and, on the lab cluster, **fits before osd.N is full**: how much more data really goes in before that OSD hits
  95 %. Then the health line: nearfull / backfillfull / full OSDs, or "pool full: writes stopped".
- **Hosts as columns** (a frame per host, its name, disk count × size and how much of the pool's data it holds),
  **OSDs as vertical bars**: outline height ∝ size, fill ∝ used, with dashed threshold lines at 85, 90 and 95 % of
  that bar, each labelled. The deciding OSD (the fullest) has a thick outline and a "▲ osd.N" marker with its %.
- **Slider "store more data"** (lab cluster): every bar fills in proportion.

## Clusters

- **`lab`** (cephsim `samples.js` `unbalanced`, built from the params): three hosts, `ceph-big` with `bigHostDisks`
  disks, `ceph-small-1` and `ceph-small-2` with `smallHostDisks` each; every disk `diskGiB` (CRUSH weight = size in
  TiB, as cephsim and Ceph by convention). One root `default`, rule `replicated_rule`: `take default, chooseleaf firstn
  0 type host, emit`. Pool 1 `rbd`, replicated, `size` from the params, 256 PGs, `storedTiB` of data.
  **OSD ids** are fixed per host slot, as Ceph would number disks added later: `ceph-big` slots 0–11 → osd.0–11,
  slots 12–15 → osd.16–19; `ceph-small-1` slots 0–1 → osd.12–13, 2–11 → osd.20–29; `ceph-small-2` slots 0–1 →
  osd.14–15, 2–11 → osd.30–39. So preset 1 is exactly cephsim's `unbalanced` (osd.0–11, 12–13, 14–15), and adding
  disks to one host never renumbers another host's OSDs.
- **`hq`** (DR estate, student side, `configs/hq/hqc/ceph-osd-df.txt`, `ceph-osd-tree.txt`, `ceph-df.txt`): the five
  `hq-pve-0N` hosts, 30 OSDs with the tree's CRUSH weights and the `ceph osd df` SIZE and %USE; osd.22 down and out
  (reweight 0). Pool `vm-rbd` (pool 2, size 2, rule 0 `replicated_rule` over every device class). A snapshot: used
  bytes are the file's, no placement is computed and the lab params do not apply. Every number on the page is
  computed from these per-OSD values; none is copied from `ceph df`.

## State

`compute(params)` → `{ cluster, pool: { name, size }, hosts: [{ name, osds: [id], disks, capTiB, usedTiB, minRatio,
maxRatio }], osds: [{ id, host, sizeTiB, weight, in, pgs, perTiB, usedTiB, ratio, level }], rawTiB, rawUsedTiB,
rawRatio, naiveTiB, maxAvailTiB, maxAvailOsd, fullest, storedTiB, askedTiB, refusedTiB, fullAtTiB, headroomTiB, full,
short, counts: { ok, nearfull, backfillfull, full } }`. The task's `{ osds: [{id, host, sizeTiB, usedTiB, ratio}],
rawRatio, maxAvailTiB, fullest, headroomTiB }` plus what the page draws. `level` is `ok` / `nearfull` /
`backfillfull` / `full`, or `out` (HQ osd.22). `perTiB` is the OSD's share of each stored TiB (lab only).
The task's `{ size, minSize }` pool from `ceph-min-size`: only `size` matters for capacity; `minSize` is left out.

## Placement (lab)

`crush.js`: the cephsim engine's CRUSH (`sims/cephsim/js/engine/hash.js`, `crush.js` `straw2Choose`, `isOut`,
`chooseFirstn`, `doRule`; `pgmap.js` `pgToPps`, `pgBytes`; `crushmap.js` bucket weights), copied as a classic script
(COMMON §6: copy, do not link). Per PG `ps` (0…255): `x = hash2(stableMod(ps, 256, 255), poolId)`, CRUSH gives an
ordered set of `size` OSDs on distinct hosts. Bytes per PG: `stored / 256 × exp(0.25 z − 0.25²/2)` with `z` from a
Box–Muller transform of `hash3(poolId, ps, 1)` and `hash3(poolId, ps, 2)` (cephsim `pgBytes`, `skew` 0.25, the
`unbalanced` sample's setting): the same cluster always fills the same way. `tools/check-engine.mjs` compares
`crush.js` with the cephsim engine over every lab param combination (sets and per-OSD bytes identical).

CRUSH can give up: with very uneven hosts (one small host, a big one with 12+ disks) `chooseleaf firstn` may not find
a third host within `choose_total_tries` = 50, and that PG gets fewer copies (cephsim and Ceph alike). The state
counts them (`short`); the page does not draw them (a second concept; NOTES.md).

## Rules

Sources: cephsim `js/engine/capacity.js` (`RATIOS`, `osdUsage`, `ruleWeightMap`, `ruleAvail` from
`PGMap::get_rule_avail`, `poolDf`, `clusterDf`), `js/samples.js` `unbalanced` and its comment; Ceph documentation
"Monitoring a Cluster" (`ceph df`, MAX AVAIL) and "Storage Capacity" (full ratios) *(check: from memory, no network)*.

1. **Usage.** Each OSD's used bytes = sum of the bytes of every PG with a copy on it (`osdUsage`). `ratio` = used /
   size. PG sizes are cephsim's `pgBytes`, scaled so the 256 add up to exactly the stored data. Raw capacity and raw used sum over the OSDs that are **in**; raw ratio = used / capacity (`clusterDf`).
2. **Thresholds.** nearfull 0.85, backfillfull 0.90, full 0.95 of an OSD's size (`RATIOS`; Ceph's defaults
   `mon_osd_nearfull_ratio`, `mon_osd_backfillfull_ratio`, `mon_osd_full_ratio`). An OSD's level is the highest it
   has reached (ratio ≥ threshold). At full, writes to PGs on that OSD stop; since every PG of the pool takes writes,
   the pool stops taking data (Ceph: `POOL_FULL`).
3. **MAX AVAIL** = min over the rule's OSDs of (size × 0.95 − used) / share, × 1/`size` (`ruleAvail`, `poolDf`).
   `share` = the OSD's CRUSH weight / the sum of the weights under the rule's root. Raw free space does not enter it.
   Out OSDs (reweight 0) are skipped and left out of the sum: `ceph df`'s HQ numbers (MAX AVAIL 3.4 TiB for `vm-rbd`)
   come out only that way (3.57 TiB with osd.22's weight in the sum); cephsim keeps an out OSD's weight in the sum
   *(check against Ceph's `get_rule_weight_osd_map`)*. The OSD that gives the minimum is `maxAvailOsd`.
4. **Every host a full copy.** With size 3 and failure domain host on 3 hosts, each PG has one copy on each host, so
   every host holds the whole pool (less the `short` PGs), whatever its disk count. A host with fewer disks fills
   faster: per OSD ≈ stored / disks on that host. Different disk sizes alone do not do this: CRUSH weights by size
   (cephsim `unbalanced` comment; tested with `crush.js` on a mixed-size host).
5. **Adding disks to the big host does not move the cap.** It changes only the big host's share of a copy; the small
   hosts still hold a full copy each (rule 4). Their OSDs' fills move by a point or two (host order in a PG's set
   changes, and so the descent inside a host), not by the added capacity.
6. **Fits before full** (`headroomTiB`): used grows linearly with stored data (rule 1, the same placement), so OSD i
   reaches the full ratio at `stored × 0.95 / ratio_i`; the pool takes data until the first one does:
   `fullAtTiB = min_i stored × 0.95 / ratio_i`, `headroomTiB = fullAtTiB − stored`. This uses the real placement;
   rule 3 assumes new data spreads by CRUSH weight, so with uneven hosts MAX AVAIL **over-promises** (preset 1:
   18.2 TiB promised, 6.5 TiB fits). Ceph's own `get_rule_avail` assumes the same *(check)*. Not on `hq` (no
   placement there): `headroomTiB` = null.
7. **Stored beyond full.** A `storedTiB` above `fullAtTiB` is refused: the pool holds `fullAtTiB` (`storedTiB` in the
   state), `refusedTiB` = the rest, `full` = true, and the deciding OSD stands at exactly 95 % (level `full`).
   `storedTiB` 0 → every OSD empty, MAX AVAIL = raw-weight projection, `fullAtTiB` from the placement of one unit
   (rule 6 is scale-free).
8. **Tie-breaks.** The fullest OSD (`fullest`, the one that "decides") = highest ratio, equal ratios → the lowest id.
   `maxAvailOsd` = lowest projection, equal → the lowest id. On an empty pool (stored 0) the fullest is the OSD that
   would reach full first (highest ratio per unit stored), so the marker never jumps to osd.0 at zero.
9. **Changed.** After any change of the params on the same cluster, an OSD whose level (rule 2) differs from the last
   state is marked; new OSDs (added disks) are not.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `cluster` | choice | `lab` / `hq` (`lab`) | `hq` hides the other params |
| `smallHostDisks` | range | 1–12 (2) | each small host |
| `bigHostDisks` | range | 2–16 (12) | the task says 2–12; preset 2 needs 16 |
| `diskGiB` | choice | 447 / 2048 / 8192 (8192) | every disk, shown as 447 GiB / 2 TiB / 8 TiB; the task's `diskTiB` 0.447 / 2 / 8 |
| `storedTiB` | range | 0 … 2.5 × `diskTiB`, step 0.05 (8) | 0–20 for 8 TiB disks; clamped |
| `size` | choice | 2 / 3 (3) | replicas |

## Presets and numbers (from `sim.js`, checked against the cephsim engine by `tools/check-engine.mjs`; asserted in `sim.test.js`)

Per-PG sizes are scaled to add up to exactly the stored data (rule 1; the engine's add up to 1.39 % more, so its own
numbers for preset 1 are the task's 48–53 %, 19 %, 17.9 TiB; NOTES.md, deviations).

| # | id | params | numbers |
|---|---|---|---|
| 1 | `unbalanced` | defaults | small-host OSDs 47.8–52.2 %, big-host 6.7–11.0 %, raw used 18.7 %, MAX AVAIL 18.2 TiB (from osd.15), fullest osd.15 52.2 %, full at 14.55 TiB so 6.5 TiB more fits; raw free ÷ 3 = 34.7 TiB; 1 PG CRUSH left with two copies |
| 2 | `add-to-big-host` | big 16 | raw capacity 128 → 160 TiB; small hosts still ≈ 50 % (49.4–50.6 %), fullest osd.15 50.6 %, full at 15.0 TiB (cap +3 %); MAX AVAIL 23.7 TiB (the projection rises with the big host's weight, rule 3) |
| 3 | `fill-it` | stored 14 | osd.15 91.4 % (backfillfull), osd.13 90.5 %, raw used 32.8 %; osd.15 crosses nearfull at 13.0 TiB and full at 14.55 TiB (0.95 / 0.522 × 8) |
| 4 | `one-small-disk` | small 1, big 4, 447 GiB, stored 0.4 TiB | each small host's only disk holds every PG: 409.6 GiB on 447 GiB = 91.6 % (backfillfull); the pool is full at 0.95 × 447 = 424.65 GiB whatever the big host has; raw used 45.8 %; raw free ÷ 3 = 484 GiB |
| 5 | `dr-38-percent` | cluster hq | raw used 37.88 % of 210.6 TiB, `vm-rbd` MAX AVAIL 3.40 TiB (from osd.13), osd.13 88.6 % nearfull and fullest; raw free ÷ 2 = 65.4 TiB |

The task derived preset 3 as 0.85 / 0.53 × 8 = 12.8 and 0.95 / 0.53 × 8 = 14.3 TiB with the engine's 53 %; scaled,
osd.15 is at 52.2 % and the crossings are 13.0 and 14.55 TiB. Preset 4 differs from the task (NOTES.md): both small
hosts have one disk, and every disk is 447 GiB. Preset 3 stores 14 TiB rather than "raise stored data" so the page
opens past two thresholds.

## Out of scope

The balancer and `reweight`, PG count tuning, device classes, EC capacity (`ec-vs-replication`), thin provisioning
overcommit (`lnx-thin-overcommit`), PGs CRUSH could not fully place (`short`, counted only), failures and recovery
(`ceph-min-size`, `ceph-down-out`).
