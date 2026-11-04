<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-sites: notes

New explorer (task `docs/tasks/w3/win-ad-sites.md`, catalogue `win-ad-sites`, §4.5.1, wave 3). Drawn with kit view
**K2** (topology with moving packets). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Explorer with a clock.** The task's state has `change: null | { at, site }` and a button that runs the clock. Here
  the change always exists at t = 0 and `clock` (seconds since it, step 15 s) says how far time has gone; the arrival
  table always shows the worst-case times, so a cost or interval change answers "when would it arrive" at once.
  **Change now** (`P`) sets the clock to 0 and steps it from arrival to arrival every 1.6 s; **Next arrival** (`W`)
  jumps once. Any other change stops the run. Under reduced motion the clock still steps (content, not animation); the
  K2 packets do not move.
- **The clock box holds the change's controls** (where, what, the two buttons) on the stage. With 12 settings the panel
  did not fit 1920×1080 (1773 px of 898); `origin`, `password` and `clock` stay as hidden kit controls (`visible`
  false), so the address and the language switch keep them. The stage buttons cancel `mousedown` like the kit's, so
  clicker keys keep working. Presets are in two columns and the panel's gap is 0.45rem (page CSS).
- **One link's sliders at a time**: an `edit` choice (HQ–Branch / HQ–Colo / Branch–Colo) shows that link's cost and
  interval. `edit` is a view param; the model ignores it.
- **Least-cost spanning tree, not a shortest path per pair** (SPEC rule 3). Microsoft's topology reference says the
  ISTG builds spanning trees with one connection between two sites and computes least-cost paths with bridged links as
  single routes; the model takes Kruskal over the DC sites' least-cost edges. So `costBC` 150 (< 200) still leaves
  Branch–Colo unused, and an all-equal triangle keeps Branch–Colo and Branch–HQ (alphabetical tie): a change at HQ then
  reaches Colo through Branch in 6 h. The caption says the choice is arbitrary on equal costs.
- **Bridged interval = the larger one**, not the sum (Microsoft's own AB/BC example). In `empty-middle` DC03 gets the
  change in 180 min (max of 180 and 60), where `hub-spoke` with DCs at HQ needs 240 (180 + 60).
- **Password vs other attribute.** Rule 7 (urgent copy to the PDC) changes the numbers of `hub-spoke`: a password made
  at Branch would be at HQ at once and at Colo in 60 min, not 240. So the page has a "what changes" choice (password /
  phone); `hub-spoke`, `cheap-detour` and `empty-middle` change the phone number (the task's "a change"), `two-sites`,
  `no-subnets` and `fresh-password` a password. The urgent copy then replicates onward from the PDC like any change.
- **Change origin**: a change "in" a site is made on its bridgehead (the first DC by name); in a site without DCs, on
  the DC covering it (rule 8).
- **Packets**: drawn only at the moment of an arrival (`clock` = its time): over HQ's intra-site connection, along the
  site links between the site cards (dashed for a bridged route), and the PDC copy dashed with its own chip. The chip
  stops at 0.3 of the way so it clears the cost label in the middle.
- **"Changed"**: against the render before the last change; loading a preset marks nothing (it would mark everything).
  A clock move marks the DCs that just got the change; a param marks DCs whose arrival moved, clients whose DC or
  logon changed, links that joined or left the tree.
- **Colours**: HQ c1, Branch c2, Colo c3 on zones, marks and site cards; never alone: each zone has its site card with
  the name, the tree links are solid ink and unused ones dashed, a bridgehead has a ★ badge, a DC that has the change a
  filled badge with ✓, one waiting a dashed badge.
- **Times** h:mm:ss, worst case; DC names, addresses, site names, costs and times are data (`translate="no"`).

## Deviations from the task

- **Branch has a writable DC, DC04, not RODC01.** An RODC takes no originating writes and never replicates outbound,
  so "a change at Branch reaches Colo via HQ" (`hub-spoke`, `cheap-detour`, `empty-middle`, `fresh-password`) could not
  happen from it; an RODC would also bring in `win-rodc`'s concept (out of scope). The topologydrafter sample's HQ,
  Branch and subnets are kept. *Owner may prefer to keep RODC01 and restrict changes to writable DCs.*
- **Six presets, not five**: `empty-middle` (the task's variant of `cheap-detour`) is its own preset; its scene needs
  `linkBC` off and HQ's DCs off, three toggles away from `cheap-detour`.
- **`cheap-detour` interval**: Branch–Colo gets a 15 min interval (task: only cost 300), so the preset also shows that
  the KCC routes by cost, not schedule (DC03 at 6 h though the direct link would poll every 15 min).
- **Two params added**: `origin` (HQ / Branch / Colo) and `password` (password / phone), needed by the presets; `edit`
  is view-only.
- **`no-subnets`** keeps the three sites (the estate's forest has one site and no subnets): subnets off is the same
  situation for the locator. The client's DC is shown as "any DC", not a random pick.
- **PDC without HQ's DCs**: DC03 (a simplification; the task does not say).

## Sources

- Microsoft Learn, "How Active Directory Replication Topology Works" (Windows Server 2003 Technical Reference), read
  for this task: intra-site ring and three-hop limit, the ISTG, the spanning tree ("a layering of spanning trees … one
  intersite connection between any two sites"), "a site that has no domain controllers … the KCC does not consider",
  "Bridge all site links", "with automatic site link bridging … all implicit paths as a single path with a combined
  cost", the AB 30 min / BC 60 min example (bridged route at the greater interval), default cost 100, interval 180,
  minimum 15, bridgehead selection (random since Windows Server 2003).
- Microsoft Learn, "Active Directory replication concepts" and "Designing the site topology" (task's list; not
  re-read): change notification 15 s / 3 s, urgent replication of password changes to the PDC emulator, DC locator and
  subnets, automatic site coverage.
- `~/projects/topologydrafter/js/samples.js`, sample `two-sites`: HQ (DC01 10.10.0.10) and branch (RODC01 10.20.0.10).
- DR estate, student side: `student/configs/ad/quillmoor/forest.txt` (one site, no subnets, clients pick DCs at
  random; PDC on the first DC). No instructor material used.
- Task file (rules 1–8, params, presets, captions, terms).

## Checks

- Numbers: an independent Python hand model (`win-ad-sites-check.py` in the thread's library folder: brute-force paths,
  its own Kruskal and relaxation) gave every preset's arrivals and tree, plus the tie case and the "tree, not pair"
  case, before the page was written; the model agrees (`sim.test.js`, "presets").
- Mutations: 15 deliberate breaks of `sim.js` (each rule and tie-break: hop tie, tree hop and name tie, coverage tie,
  15 s, interval vs cost, bridged max vs sum, bridging ignored, no PDC copy, subnets ignored, last-by-name bridgehead,
  logon test, no tree, `≤` clock, PDC without HQ) each fail at least one test.
- Page sweep: every combination of `linkBC` × `bridging` × `subnets` × `hqDcs` × origin × what × edit, at every
  arrival time, in both languages at 1920×1080 (944 states): no console errors, no panel or page scroll, no caption
  overflow or empty caption, nothing clipped by the stage; one badge too wide (no subnets, "logon ✓ DC01/DC02/DC03/DC04")
  fixed to "logon ✓ on any".
- `npm run gate -- win-ad-sites`: passes; screenshots 1920×1080 light, dark, grayscale and 375×812 in both languages
  reviewed, plus every preset at 1920×1080.

## Unchecked *(check)*

- 15 s first change notification and 3 s between partners (Windows Server 2003+ defaults); not visible with ≤ 2 DCs.
- The KCC's real tie-breaks (it compares GUIDs); here fewer links, then site names.
- Automatic site coverage by least path cost over all links, ties by site name.
- The PDC's urgent copy at t = 0 and its onward replication (DC02 15 s later).
- Croatian terms (task marks them *(check)*), below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| site | lokacija | task *(check)* |
| site link | veza lokacija | task *(check)* |
| cost | trošak | task |
| replication interval | interval replikacije | task |
| bridgehead server | poslužitelj mosta | task *(check)* |
| subnet | podmreža | task (URM ch09) |
| change notification | obavijest o promjeni | task *(check)* |
| PDC emulator | emulator PDC-a | this page *(check)* |
| bridge all site links | premosti sve veze lokacija | this page *(check)* |

## Shared requests

- **K2: zones** (`spec.zones: [{ col, row, span, rows, c, dashed }]`): a tinted box behind a group of cards (a site, a
  VLAN, a DMZ). The page prepends its own `.as-zone` grid items to `.sd-topo`; it depends on the cards and the links'
  SVG being positioned above non-positioned grid items, and hides the zones on the phone.
- **K2: a label in the middle of a link** (`links[].label`): the page draws `cost · interval` in its own absolutely
  placed layer from the site cards' rects, with its own ResizeObserver (after K2's).
- **K2: free cells** (as `win-ad-replication` asked): the clock box and the arrival table are grid items the page adds.
- **Kit: `.sd-ctl[hidden]`** is overridden by `.sd-ctl { display: flex }` (as in `amdahl`, `csma-cd`); the page adds the
  `display: none` rule.
- **Kit: controls on the stage.** A page whose settings outgrow the panel could use a kit helper for a segmented
  control or button on the stage that keeps focus behaviour; the page builds its own (`seg`, `stageBtn`).

## Fresh review

A separate agent read the code against `SPEC.md`, ran 35 mutations of `sim.js` over a grid of 331,776 param
combinations (22 killed; 9 survivors equivalent with three sites and at most two DCs per site: the path name tie,
"fewer links" in coverage, adjacency order, source order, a one-way ring, a dead `through` filter, coverage's no-DC
filter) and enumerated captions and table routes. Fixed from it:

- captions: "now gets it at never (was 3:00:00)" when a DC stops (or starts) being reached; the urgent copy said twice
  at clock 0; a partial tie (100/200/200) explained as a cost decision, now the tie sentence;
- the clock box named the origin site for a change made on a covering DC ("DC04 (HQ)"), now the DC's own site;
- rule 8's tie-break: more DCs, then the name (was "fewer links", which never applies), marked *(check)*;
- four test gaps, now tested and seen failing: the equal-arrival tie (two mutants), route direction, a covered origin
  with subnets off, `diff` on a logon change; plus a test of the coverage DC-count tie;
- SPEC's state now lists `none`, the tie-breaks that cannot arise here say so, the clock range is `max(60 s, last)`;
- wording: hr "Skupi prečac" (was the Serbian "prečica"), "po … (podmreži)", en "Every DC that replication reaches".

## Time

Start 2026-11-04 03:04, gate passing 03:21, review fixed and final gate 03:34: about 35 minutes.
