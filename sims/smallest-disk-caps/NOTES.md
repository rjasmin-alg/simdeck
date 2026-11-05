<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# smallest-disk-caps: notes

New explorer (task `docs/tasks/w3/smallest-disk-caps.md`, catalogue `sto-smallest-disk-caps`, wave 3). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Live CRUSH, not a fixture.** `ceph-min-size` stores a placement fixture for two fixed clusters; this page has
  12 × 15 × 2 disk-count and size combinations, so a fixture would be hundreds of KB. `crush.js` is the cephsim
  engine's CRUSH (hash, straw2, `chooseFirstn`, `pgToPps`, `pgBytes`) copied as a classic script, about 200 lines;
  the page runs it on every change (256 PGs, instant). `tools/check-engine.mjs` compares it with the engine in
  `sims/cephsim/js/engine` over all 1,080 lab clusters the params can build: every set and every OSD's bytes equal.
  Nothing from `ceph-min-size` is reused: its model is failures and PG states, and it is not in `models/`.
- **One disk size for the whole cluster.** The task's `diskTiB` could mean every disk or only the small hosts'.
  With the small hosts' disks alone at 447 GiB and the big host at 8 TiB, CRUSH weights differ ~200×, and
  `chooseleaf firstn` gives up finding a third host for most PGs (in the engine and in Ceph: 156 of 256 PGs end with
  one copy). That is a second concept (CRUSH retries), so `diskGiB` sets every disk, and the mismatch the student
  makes is in disk counts. The misconception "different disk sizes unbalance the cluster" is answered in the
  explanation and tested on `crush.js` directly (three 16 TiB hosts of 2 × 8, 8 × 2 and 4 × 4 TiB fill alike).
- **PGs CRUSH could not fully place** (`short`) are counted in the state, not drawn: 1 in preset 1, 2 in preset 2,
  up to 27 with one small disk against 16. A host then holds slightly less than a full copy, and its header says
  "holds 7.9 TiB" instead of "= a full copy" (`fullCopy`: a copy of every PG). The explanation mentions it in one
  sentence, and the captions say every host *has to* carry a full copy.
- **OSD ids per host slot** (SPEC): adding disks to the big host gives osd.16–19, as Ceph would number new disks,
  so the small hosts keep osd.12–15 and preset 2 compares like with like.
- **"Fits before full" next to MAX AVAIL.** Rule 3 (Ceph's projection) assumes new data spreads by CRUSH weight;
  with a full copy per host it over-promises (preset 1: 18.2 TiB promised, 6.5 TiB fits) and it *rises* when disks
  are added to the big host (preset 2: 23.7 TiB) although the real cap moves 3 %. The task's preset-2 caption ("the
  cap has not moved") is true only of the real cap, so the box shows both, the real one outlined, and the caption
  reports the cap from placement ("the pool stops at 14.5 → 15.0 TiB").
- **Data beyond the cap is refused** (rule 7): the stored slider can go past the point where the fullest OSD hits
  95 %; the state then holds exactly that much, the rest is "refused", the bar stands at 95 % cross-hatched and the
  health line says HEALTH_ERR, pool full, while raw used reads 34 %.
- **The HQ cluster** is a snapshot from `ceph osd df` (student side): no placement, no stored slider, the lab controls
  hidden. MAX AVAIL is computed from the per-OSD SIZE, %USE and tree weights and comes out at the file's 3.4 TiB.
  The page does not say why osd.13 is fuller than the other SSDs: that is for the students working S8.
- **Changed marks** (rule 9) follow any change of params on the same cluster; a preset switch counts, so 1 → 3
  marks the bars that crossed a threshold. The page tracks the last state itself (an explorer has no `prev`).
- **"Four more disks" note**: shown only right after the big host's disk count went up with everything else equal
  (the page's last state); it replaces the over-promise note so the caption stays three lines.
- **Panel in two columns** (presets and the two disk-count sliders), as `ec-vs-replication` does, to fit 1920×1080.
- **Concepts, not tools**: Ceph is named (NLA T26 teaches it); `ceph df`, MAX AVAIL, nearfull/backfillfull/full and
  `HEALTH_WARN` are the subject. Commands appear only in the explanation's source of the HQ numbers.

## Deviations from the task

- **PG sizes scaled to the stored data.** cephsim's `pgBytes` is mean-preserving only on average: its 256 PG sizes
  add up to 1.0139 × stored, so "8 TiB stored" put 8.11 TiB on each host. The model scales them to add up exactly.
  So preset 1 reads 47.8–52.2 %, 18.7 % raw, MAX AVAIL 18.2 TiB, osd.15 52.2 % (task, engine as is: 48–53 %, 19 %,
  17.9 TiB, 53 %), and preset 3's crossings are 13.0 / 14.55 TiB (task 12.8 / 14.3). A note for cephsim's owner;
  cephsim is not changed.
- **`bigHostDisks` 2–16**, not 2–12: preset 2 is 12 + 4 disks.
- **`diskGiB`** (447 / 2048 / 8192) instead of `diskTiB` 0.447 / 2 / 8: the scoping note's "447 GB" disk is a
  480 GB SSD, 447 GiB; 0.447 TiB would be 458 GiB. Every disk takes the size (Decisions).
- **`storedTiB`** range 0 to 2.5 disks' worth (0–20 TiB for 8 TiB disks, 0–5 for 2 TiB, 0–1.05 for 447 GiB), step
  0.05, so the 447 GiB cluster can be filled in useful steps.
- **Preset 3** stores 14 TiB (past nearfull and backfillfull) rather than leaving the raise to the lecturer.
- **Preset 4**: both small hosts have one 447 GiB disk and the big host four (the task: "one host's only disk");
  the cap 0.95 × 447 GiB = 424.65 GiB is the task's number and holds for any big host.
- **No `minSize`**: it plays no part in capacity.
- **Caption wording**: the task's hr caption names "svaki manji poslužitelj"; the page's caption names the host and
  its disk count (it also covers settings where the big host has fewer disks). The en caption for preset 2 is the
  "disks added" note with the numbers.
- **Out OSDs** are left out of MAX AVAIL's weight sum (SPEC rule 3): that reproduces the HQ file's 3.4 TiB; with
  osd.22's weight in the sum it is 3.57 TiB. cephsim's `ruleWeightMap` keeps it.

## Sources

- cephsim `js/engine/capacity.js` (`RATIOS`, `osdUsage`, `ruleWeightMap`, `ruleAvail`, `poolDf`, `clusterDf`),
  `crush.js`, `hash.js`, `crushmap.js`, `pgmap.js` and `js/samples.js` `unbalanced` with its comment, in
  `sims/cephsim/` (copied from `~/projects/cephsim`) @ 9fae442. Read and run.
- DR estate, student side: `configs/hq/hqc/ceph-df.txt`, `ceph-osd-df.txt`, `ceph-osd-tree.txt`, `ceph-health.txt`,
  `ceph-osd-pool-ls-detail.txt`, `crushmap.txt`; `scenarios/S8.md`. Read. The instructor side was not opened.
- `~/projects/cluster-design-sim-scoping.md` §5 item 2 and `~/projects/faultline/PEDAGOGY.md` §7 item 2 (one small
  disk caps a tier). Read.
- Ceph documentation "Monitoring a Cluster" (`ceph df`, MAX AVAIL) and "Storage Capacity" (`mon_osd_full_ratio`
  0.95, `mon_osd_backfillfull_ratio` 0.90, `mon_osd_nearfull_ratio` 0.85) *(check: from memory, no network)*.
- Ceph source `PGMap::get_rule_avail` and `CrushWrapper::get_rule_weight_osd_map` *(check: from memory)*: the
  projection divides each OSD's headroom by its share of the rule's flat CRUSH-weight sum, so real Ceph
  over-promises with unbalanced hosts as cephsim does (the task's preset 3 question). As far as I recall, an out OSD
  keeps its weight in the sum there and is only skipped in the minimum, which would give 3.57 TiB at HQ, not the
  file's 3.4 *(check)*.

## Checks

- Numbers printed by `tools/check-engine.mjs` and asserted in `sim.test.js` (28 tests). The engine and `crush.js`
  agree on all 1,080 lab clusters.
- **Mutations** (21, one at a time on `sim.js`): tie-breaks reversed (fullest, MAX AVAIL OSD), nearfull 0.80, strict
  thresholds, MAX AVAIL without ÷ size, with ratio 1 instead of 0.95, with the out OSD in the weight sum or raw
  total, no scaling of PG sizes, no skew, the pool never full, slot ids renumbered, the HQ fullest by bytes, changed
  marks across clusters, headroom = MAX AVAIL, the cap at ratio 1, osd.13's size = its weight, raw free not ÷ size,
  two caption notes, the slider's top: all fail a test. One equivalent mutant (a redundant `Math.min`) led to
  simplifying the code.
- **Fresh review** (a separate agent: re-derived the HQ numbers from the student files, preset 1 on the engine directly,
  preset 4 by hand; all matched; 40+ mutations). Fixed from it: stale SPEC numbers (written before the PG-size
  scaling), the "= a full copy" header decided by a 0.5 % byte tolerance (now: the host has a copy of every PG,
  `fullCopy`), captions claiming every host *carries* a full copy when CRUSH left a PG short (now "has to carry"),
  the size-2 caption saying no host carries a full copy (false with one small disk against 13+), the OSD count without
  Croatian plurals, `HEALTH_*` words not from the tables, the hr summary's "stane" (stops/fits) for "fills", the
  missing 90 % tick label, 211 TiB instead of the file's 210.6 TiB, hr wording and closing quotes. Ten surviving
  mutations now fail tests: both tie-breaks with a higher id seen first, the full boundary, the `cCopyOther` caption
  and its condition, the over-promise note's condition, notes on a full pool, the out OSD in the HQ host rows, the
  big-host range, `fullCopy`. Left: `crush.js` tunables are pinned by `tools/check-engine.mjs`, not by `sim.test.js`
  (it would need another sim's folder).
- **Host names** `hq-pve-0N` are the estate's data (student files); the reviewer flagged "pve" as a product
  abbreviation. Kept: renaming them would break the match with the files the students work from.
- `npm run gate -- smallest-disk-caps`, screenshots reviewed (1920×1080 light, dark, grayscale, 375×812, both
  languages), plus every preset, preset 1 → 2, a full pool and size 2 with a local Playwright script.

## Term pairs

Not in `kit/glossary.js`; written out by hand in the explanation (`<em lang="en">`). For the coordinator to add with
`"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| raw capacity | sirovi kapacitet | task |
| usable capacity | upotrebljivi kapacitet | task |
| nearfull | gotovo pun | task *(check)* |
| full (ratio) | pun | task *(check)* |
| CRUSH weight | težina | task |
| failure domain | domena kvara | task |
| replica | kopija | task |
| OSD | OSD (spremišni disk s demonom) | this page *(check)*; `ceph-min-size` asked for "OSD (spremišni demon)" |
| pool | bazen | cephsim's Croatian strings; the glossary's `pool` is "skup adresa" (DHCP) |

## Shared requests

- **Kit controls** (`kit.css`): `.sd-ctl[hidden] { display: none }` (same request as `ceph-min-size`); the page
  adds it.
- **Kit range**: a `step` that can depend on the params, like `min`/`max`, so a slider over 0–1 TiB and one over
  0–20 TiB both get sensible steps. Worked around with a fixed 0.05 TiB step.

## Time

Started 06:37, done 07:10 (about 35 minutes in one session, including the fresh review and its fixes).
