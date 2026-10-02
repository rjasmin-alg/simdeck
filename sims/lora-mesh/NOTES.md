<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lora-mesh: notes

Adopted from `single-page-labs/lora-mesh-usporedba-v3.html` (task `docs/tasks/w1/lora-mesh.md`, catalogue
`spl-lora-mesh`). The first commit on the branch is the original copied as-is; the simdeck copy is canonical from
here on.

## Decisions

- **Class `stepper`, not `explorer`** (the catalogue says "import as `expl`"; the task says decide on import). The
  original's "Pošalji poruku" played a list of radio events on a timer. Here one step is one radio round: the
  LoRaWAN uplink, the network server over IP, the downlink (3 steps); one wave of the flood; one hop of a route. The
  kit's play button replaces the timer and the speed slider. `sim.json` `steps: 6` (the default field, flood); the
  count is a function of the params (1–8, tested ≤ 20 over many fields).
- **Seeded field instead of `Math.random` and dragging.** Node positions come from `seed` (hidden; "Nova topologija",
  key `N`, moves to the next of 99). The first n of 42 positions are used, so more nodes only add nodes. The same
  field is used in all four networks, so switching the network compares the same message on the same field (the
  original drew a new random field on every mode change). Dragging nodes was dropped: positions would need a param
  each. The flood's suppression draw (the original's `Math.random() > .42`) is seeded too.
- **Defaults**: 18 nodes (the original), range 30 % (the original had 26 %; at 26 % most seeded fields are split and
  every network fails), seed 28: LoRaWAN delivers in 3 steps, the flood in 6 rounds with 14 transmissions (16 nodes
  hear it), MANET in 6 hops with 6 transmissions, the repeater mesh finds no chain. These numbers are tested.
- **LoRaWAN gateways are extra nodes** (GW1…GW3, the original's count: one per 12 nodes, 1–3, at its positions)
  instead of turning end nodes 1…g into gateways, so node numbers mean the same in every network. The uplink is
  heard by every gateway in range; the server picks the gateway nearest the destination (ties: lower id). The IP
  step is not counted as a radio transmission (the original counted it).
- **Repeater roles**: the original's starting repeaters (about n / 8, at nodes 3, 9, 15, …) and its path rule (direct
  link, else the shortest chain through repeaters only). Clicking a node toggles its role (the original's double
  click and button); the toggles are a hidden bit-mask param `flip`, so they survive the URL and the step replay.
- **One transmission per broadcast** *(check)*. The original counted one "TX event" per neighbour that heard a
  packet, so a node with five new neighbours "transmitted" five times, and its duty-cycle check fired on that. A
  broadcast is one transmission however many nodes hear it; the counts and the airtime here follow that. Every
  frontier node of the flood transmits once per round, also when no new node hears it (it cannot know).
  Consequence: within one message every node transmits at most once, so the duty-cycle limit blocks only when one
  packet is longer than the allowance (the "Dug paket, 1 %" preset: 1000 ms > 0.6 s). The explanation says why a
  flood still eats the duty cycle: every node spends it on everybody's messages.
- **Duty cycle as one choice**: no limit / 0.1 % / 1 % / 10 % (the EU868 sub-band limits) instead of the original's
  toggle plus a 1–100 % slider; needed for the panel to fit at 1920×1080. The 60 s window and the formulas of the
  bar are the original's (busiest node / allowance with a limit, total airtime / 60 s without).
- **Source fixed at node 1** in the panel (the param `src` exists and works from the URL); the destination is a
  slider 1…n (default 18). The panel did not fit with both, and the field changes with `N` anyway.
- **Presets (2)**: "Dug paket, 1 %" (blocked by the duty cycle) and "Repetitori: dodan lanac" (three nodes on the
  path become repeaters; 6-hop route). The four networks are the mode buttons, one click each on the same field;
  presets that only set the mode were dropped for panel height, as were "dense" (42 nodes) and "split" (range 24 %),
  both one slider move away. The duty preset is first because the gate deep-links the second preset at step 3.
- **Colour**: source `--c1`, destination `--c3`, gateways and repeaters `--c7` with their names GW1/R3 written in
  the node; heard: thick ink border; transmitting now: highlighter; radio lines `--c2`, IP backhaul dashed `--c7`.
  Labels "izvor" / "odredište" under the two ends. Checked in grayscale.

## Deviations from the original (and why)

- **Product names dropped** ("Concepts, not tools", COMMON.md §1): Meshtastic → "Preplavljivanje / Flooding"
  (managed flooding), MeshCore → "Repetitori / Repeaters", and the "MeshCore interakcija" hint became a generic one.
  LoRaWAN stays (a standard, like TETRA in radio-networks), MANET stays (a class of networks). *(check)* with the owner
  whether a course teaches those products as the topic; the catalogue's concept line names them.
- **Reticulum tab dropped**: a networking-stack overview naming its applications and interfaces, a second concept
  and product-heavy. The comparison table moved into the explanation without the Reticulum column.
- The badges ("LoRa ≠ LoRaWAN", …) and the footer's simplifications moved into the explanation; the footer's
  source list ("LoRa Alliance, … Reticulum manual") is under Sources here.
- Fonts and palette: kit fonts and tokens; the original used Inter / system fonts and its own colours, no network
  loads.

## Sources

- The original page (models, wording). Its footer names as sources: LoRa Alliance (LoRaWAN), the two mesh firmware
  projects' documentation, IETF RFC 2501 (MANET) and the Reticulum manual.
- EU868 duty-cycle limits of 0.1 %, 1 % and 10 % per sub-band: ETSI EN 300 220 / ERC Rec 70-03 *(check the exact
  sub-band list if a lecturer wants it on the page)*.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| duty cycle | udio odašiljanja (*duty cycle*) |
| airtime | vrijeme u eteru |
| repeater | repetitor (also in radio-networks) |
| hop | skok (also in radio-networks) |
| uplink / downlink | uplink / downlink |
| network server | mrežni poslužitelj |
| end device | krajnji uređaj |
| broadcast | broadcast |
| hop limit | ograničenje skokova |

`mesh`, `flooding` and `gateway` are in the glossary and used as `[[mesh]]`, `[[flooding]]`, `[[gateway]]`.
`gateway` renders as "gateway (pristupnik)": the glossary's pair is the UL book's (default gateway); for a LoRaWAN
gateway *(check)* whether "pristupnik" is the wanted Croatian.

## Shared requests

- **kit.css: `.sd-ctl[hidden]` is still shown** (as in radio-networks and rf-bandplan): worked around in page CSS.
- **Glossary:** the term pairs above with `"src": "simdeck"`.
- **Tags:** topic `radio`, tag `radio-networks`; both exist in `tags.json`.

## Checks not done here

- Real projector and a clicker.
- Touch on a real phone (the field scrolls sideways inside its box under 900 px, as in radio-networks).
- Freezing the original in `single-page-labs` is outside simdeck (coordinator).

## Time

Start 2026-10-02 20:20, done 20:35 (one session, about 15 minutes of wall-clock time).
