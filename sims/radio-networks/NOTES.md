<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# radio-networks: notes

Adopted from `single-page-labs/radio-network-demos.html` (task `docs/tasks/w1/radio-networks.md`, catalogue
`spl-radio-networks`). The first commit on the branch is the original copied as-is; the simdeck copy is canonical
from here on.

## Decisions

- **Class `stepper`, not `explorer`** (the catalogue says "import as `expl`"; the task says decide on import). The
  original ran on clocks: a 1 s tick ended calls and drained the queue, and "Automatsko opterećenje" added a random
  call every 1.7 s with `Math.random` lengths. Under load is the concept, and load is time, so one step is one time
  slot and the kit's play button replaces the auto-load timer. The randomness is a seeded schedule (`seed`, hidden;
  "Novi uzorak poziva", key `N`, moves to the next of 20), so a demo can be replayed, stepped back and linked.
  `sim.json` `steps: 20` (conventional and trunked); the mesh takes `ttl` steps (1–7), one per flood hop.
- **One page, three networks** (the original's three tabs) as the `net` choice. Changing the network keeps the step,
  and the call schedule depends only on `seed` and `load`, so switching between conventional and trunked at the same
  step compares the same calls: the point of the page. *(check)* whether the mesh is a second concept (routing by
  flooding rather than channel sharing) and should become its own sim; it was one page in the original and the
  catalogue names all three, so it stayed.
- **Load model**: at most one call per slot, with probability `load / 5`, lasting 3–7 slots (mean 5), so `load` is the
  offered traffic in erlang (1–5 Erl). Each slot draws its three numbers whatever the load, so raising the load only
  adds calls (tested). The original's call lengths were 5–9 ticks at one call per 1.7 s; scaled to fit 20 slots.
- **Model kept** from the original: conventional team *i* uses only channel *i*, and is blocked if that channel is
  busy or does not exist (blocked calls are lost, as in the original, where they faded out); trunked calls take the
  lowest free channel or queue first come first served; several calls of the same talkgroup may hold channels at once
  (the original allowed it; real trunking would join a group call — *(check)* if a lecturer wants that). The
  conventional `mode` (simplex, repeater, fixed) changes only the drawing, as in the original. Mesh: the 8 nodes and
  positions, links within range, the breadth-first route with the original's tie-break (the first node in id order),
  node D down by default, source and destination cannot be switched off.
- **Order within a slot**: calls end first, then the queue is served, then the slot's new calls in id order.
- **Mesh steps through the flood** instead of drawing all hop rings at once; the route appears when the flood
  reaches the destination. Deviation: the original showed the route whatever the TTL; here a TTL shorter than the
  distance stops the flood, and the caption says how far the destination was ("Mesh: premali TTL" preset).
- **Drawing**: SVG for lines only; radios, nodes and every label are HTML on top from the same 760 × 340 coordinates,
  so text keeps its rem size. Mesh nodes are buttons (click or Enter toggles one off), `aria-pressed`.
- **Colour**: teams on `--c1`…`--c4`, always with their code (OPS, SEC, MED, LOG) under the radio and their name in
  the channel row; a radio in a call is filled, idle is hollow. Blocked: dashed outline and ✗; queued: dotted and ⏳;
  new this step: highlighter with outline. Route: thick green line plus the numbered route list. Checked in grayscale.
- **Presets (6)**: conventional 3 channels (7 of 12 calls lost), the same calls trunked (all served, 3 wait),
  trunked at 5 Erl (queue grows), mesh with relay D down (route around it), split mesh (D and E down), TTL 2.
  Dropped for panel height: a 5-channel conventional and a simplex preset (both one control away).

## Deviations from the original (and why)

- The lecture note "Mreže tipa Meshtastic često mijenjaju propusnost za robusnost i domet" is dropped: it names a
  product ("Concepts, not tools", COMMON.md §1); the explanation keeps "low throughput" as a mesh weakness. TETRA
  stays: it is a standard.
- Dropped: manual "Pokreni poziv" for the selected team and "Završi najstariji" (the schedule replaces them; a
  manual call would need a param per click), the team/talkgroup selector (it only highlighted), the trunking
  "Prikaži kontrolni kanal" toggle (the control channel is now always a row that shows its grants each slot) and the
  mesh "Prikaži flood propagaciju" toggle (the flood is the steps).
- The comparison table, the "Što ovo pokazuje" lists and the "Kut za predavanje" notes moved into the explanation.
- The original's intro sentence about one HTML file without npm was dropped.
- Fonts and palette: kit fonts and tokens; the original used Inter / system fonts and its own colours, no network
  loads.

## Sources

- The original page (models, positions, wording). Erlang as the unit of offered traffic: standard teletraffic
  definition (mean number of simultaneous calls).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| trunking (trunked radio) | dinamička dodjela kanala (*trunking*) |
| repeater | repetitor |
| talkgroup | govorna grupa |
| control channel | kontrolni kanal |
| traffic channel | prometni kanal |
| simplex | simplex |
| offered traffic (erlang) | ponuđeni promet (erlang) |
| hop | skok |
| time to live (TTL) | TTL (najviše skokova) |

`mesh` and `flooding` are in the glossary and used as `[[mesh]]`, `[[flooding]]`.

## Shared requests

- **kit.js: button params ignore `visible`** (`buttons` are built by `actionButton`, which has no sync). Worked
  around: the page sets `data-net` on `<html>` and hides the `N` button in the mesh with page CSS; key `N` still
  changes the hidden seed there (no visible effect). Smallest change: run the same `visible` sync for buttons.
- **kit.css: `.sd-ctl[hidden]` is still shown** (as in rf-bandplan and others): worked around in page CSS.
- **Glossary:** the term pairs above with `"src": "simdeck"`.
- **Tags:** topic `radio`, tag `radio-networks`; both exist in `tags.json`.

## Checks not done here

- Real projector and a clicker.
- Touch on a real phone (the drawing scrolls sideways inside its box under 900 px, as in automata).
- Freezing the original in `single-page-labs` is outside simdeck (coordinator).

## Time

Start 2026-10-02 19:40, done about 20:00 (one session, about 20 minutes).
