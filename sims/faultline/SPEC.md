<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# faultline: presets added in simdeck

faultline is an adopted app (`NOTES.md`): its own rules live in its code and its 47 checks (`tests/`). This file
states the rules, tie-breaks and numbers of the presets that simdeck tasks add on top of it. Each preset section
cites the engine for every rule; none of them changes `js/engine/`.

## `one-pdu`: one power strip under three replicas

Task `docs/tasks/w3/correlated-failure.md` (catalogue `dr-correlated-failure`, §4.6). One concept: **redundancy that
shares one hidden dependency**. Entry `faultline#one-pdu`, `?sample=onePdu`, optionally `&step=1|2|3`.

### Scene (faultline's sample `onePdu`, `js/samples.js`)

- Fault-domain tree: `Server room` (kind `dc`) → `Rack 1`, `Rack 2`, `Rack 3` (kind `rack`).
- Components: `file service` (role `service`, in the room), `osd-1`, `osd-2`, `osd-3` (role `replica`, one per rack).
- Dependencies: the service needs 2 of the 3 replicas (`kofn`, `n = 2`; Ceph's size 3 / min_size 2).
- The hidden dependency: the correlated event `pdu-a`, **"PDU A trips"**, `hits: ['r1', 'r2']`, note "Racks 1 and 2
  were commissioned first and share a feed. Nobody drew the feed."
- Settings: `maxCutSize: 3`, **`authorities: false`** (new in simdeck, below).

### Rules (faultline's, cited)

1. A `kofn` gate is up while at least `n` of its dependencies are up: `GATES.kofn.need(n, k) = min(max(k, 0), n)`,
   and a node is down when `live < need` (`js/engine/graph.js`, `evaluator`). **Tie-break:** exactly `k` up is up
   (2 of 3 serves; 1 of 3 does not).
2. An event takes down every component in the domains it hits, recursively (`js/engine/events.js`, `eventUniverse`:
   `componentsIn` for each domain in `hits`). PDU A hits Rack 1 and Rack 2, so `osd-1` and `osd-2`.
3. A minimal cut set is a set of events that takes the service down such that removing any one of them lets it
   serve (`js/engine/cutset.js`, header). The search runs by increasing size and skips any set that contains a cut
   already found, which is the whole minimality test there.
4. Without the PDU event the smallest cuts *of the racks* are pairs (size 2); with it, **{PDU A}** is a size-1 cut,
   and it was invisible because nobody drew the feed (faultline `PEDAGOGY.md` §6: "the dashboard reads 3x redundant.
   The cut list reads size 1").

Engine details that decide what the page shows (not new, but they shape the numbers):

- **Dedupe** (`events.js`, `dedupeUniverse`): two events that hit the same set are one failure; the survivor is the
  more specific (component, then correlated, then domain). A rack holds one replica, so "Rack 1 lost" and "osd-1
  fails" are the same set and the component survives: the pair cuts read **osd-1 + osd-2**, not Rack 1 + Rack 2,
  and the rail has no rack events.
- **The room is a cut.** "Server room lost" hits all four components (radius 4): a drawn size-1 cut in every step.
  It is the trivially true "lose the whole building" and is not the lesson; the captions say "losing any one rack"
  rather than "no single failure" for that reason.
- **Order** (`cutset.js`, `cuts.sort`): size, then drawn before not drawn, then blast radius, then name.
  **Tie-break:** among the two size-1 cuts, PDU A (radius 2) lists before the server room (radius 4), so the new cut
  is the first row of the panel and the headline ("smallest drawn failure: one correlated event · 2 hit").
- The service's own event is out of the search pool ("the service is down if the service is down").

### The walk (`js/walk.js`, `WALKS.onePdu`)

Three states over the sample; the page shows a caption bar with ← / → (and PgUp / PgDn, Home / End), the step
number, the caption, a "Draw the feed (PDU A)" box, the live replica count and a note that the authorities are off.

| Step | Feed drawn | PDU A broken | Cuts (in order: size, events, radius) | Searched | Service | Replicas up |
|---|---|---|---|---|---|---|
| 1 the drawing | no | no | 1 Server room lost (4); 2 osd-1 + osd-2 (2); 2 osd-1 + osd-3 (2); 2 osd-2 + osd-3 (2) | 7 | up | 3 of 3, 2 needed |
| 2 the feed drawn | yes | no | **1 PDU A trips (2)**; then the four of step 1 | 8 | up | 3 of 3, 2 needed |
| 3 PDU A trips | yes | yes | as step 2 | 8 | **down** | **1 of 3, 2 needed** |

"Feed drawn: no" is the sample without the `pdu-a` event (`withFeed`); the engine then never sees it. Checked with
`atStep()` in `sim.test.js` and a probe script on the bundle before the page was written.

- **Which step is on show** follows the state (`stepOf`): only the feed and its trip count; anything else the user
  broke from the rail is theirs. **Tie-break:** a trip while the feed is hidden is no trip (the event is not in the
  model), so that state shows step 1. Hiding the feed repairs PDU A; drawing it again brings it back whole.
- ← / → put the step's own state back (`stepState`): failures the user added by hand are cleared. Past either end
  nothing happens; the button carries `aria-disabled` and keeps the focus.
- `?step=` is clamped to 1..3; anything that is not a number opens step 1. The language switch keeps the step.

### Authorities off

faultline attaches six implicit authorities to every analysis unless `settings.authorities === false`
(`js/compile.js`). Each is a drawn-nowhere size-1 cut. With them on, step 2 would list eight size-1 cuts, and the one
that matters here would be one of eight. The preset runs with them off so this stays one concept, says so in the walk
bar, and the toolbar box ("Show what was never drawn") brings them back: six more size-1 cuts, none drawn, and the
drawn ones unchanged (tested). They are `never-zero-spof`'s lesson (`threeZone`).

### Legend addition

The feed, while drawn, is one **dotted** outline (amber, `--feed`) around Rack 1 and Rack 2, labelled on its lower
edge "PDU A · not drawn" / "Razdjelnica A · nenacrtana" (`render.js`, `paintFeed`). Dotted and labelled, so it reads
apart from the dashed domain frames without colour.

### Captions

1. hr „Tri ormara, tri kopije, potrebne dvije: na crtežu kvar jednog ormara ne ruši uslugu. Ali ormari 1 i 2 vise na
   istoj razdjelnici napajanja (PDU)." · en "Three racks, three copies, two needed: in the drawing, losing any one rack
   leaves the service up. But racks 1 and 2 hang on the same power distribution unit (PDU)."
2. hr „Napajanje je nacrtano: razdjelnica A postaje jedan događaj koji pogađa ormare 1 i 2 odjednom. …" · en "The feed
   is drawn: PDU A becomes one event that hits racks 1 and 2 at once. The cut list gains a new size-1 entry: PDU A
   alone. The dashboard still reads 3× redundant."
3. hr „Ispada razdjelnica A: dva ormara gase se zajedno, ostaje jedna kopija, a potrebne su dvije. Zalihost je bila
   stvarna; neovisnost nije." · en (the task's) "PDU A trips: two racks go dark together, one replica is left, two are
   needed. The redundancy was real; the independence was not."

Misconceptions it answers: "three replicas in three racks are independent"; "redundancy in the drawing is redundancy
in the room". Out of scope: the authorities (`never-zero-spof`), size/min_size (`ceph-min-size`), placement rules
(`crush-failure-domain`).
