<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# packet-aprs: notes

Task `docs/tasks/w3/packet-aprs.md`, catalogue `ham-packet-aprs` (§4.10). Rules, numbers and presets: `SPEC.md`.
A new native stepper, one slot per step.

## Decisions

- **One step = one slot**, as the task says; packets last 2 slots. Steps come from the model: the scene's minimum (the
  task's 6, 6, 6, 4, 3) or the last slot with an event, whichever is later, at most 20. So `wide7` gives 12 with
  `WIDE7-7` and 6 with `WIDE2-2`, csma off still shows 4, and an extra beacon lengthens the run.
- **Scenes are fixed layouts** in a 100 × 44 box (`SCENES` in `sim.js`), one per preset, as the `topology` select.
  Links are symmetric: in range when the distance is at most the smaller of the two ranges. A test pins every
  scene's links, so moving a station that breaks a story fails.
- **The csma scene has no digipeater.** With D1 in it, D1 would repeat T1's beacon in slots 3–4 and collide with T2's
  deferred start, so "both delivered by slot 4" (task) needs T1, T2 and R only. The path param has no effect there.
- **Receivers half duplex.** A station that transmits in either slot of a packet cannot receive it (event `busy`).
  Not in the task's rules; real radios are half duplex and the extra-beacon button reaches the case (T1 and D1 start
  together in slot 3 of two-hops).
- **Duplicate check before the path** (rule 4): D1 hearing D2's copy in two-hops is shown as "duplicate dropped", the
  legend's crossed copy, although its path has nothing left for D1 either. In the WIDE7-7 chain the dupe check is
  what stops D(k) from answering D(k+1)'s copy. The "drop a queued copy on hearing it repeated" case cannot occur
  here (SPEC R4) and is not modelled.
- **Text form of the path** follows the task: used aliases get `*` (`WIDE1*`), inserted call signs are plain, every
  used element is bold and underlined on the card. Real TNC2-format monitors print one `*` after the last repeated
  element only *(check)*.
- **Call signs** are the station ids (fictional), destination `APRS`, info `>n` (a status with the beacon number):
  the frame quoted in HamMonitor's `aprs_logger.py` has a real call sign and a software-specific destination, so
  neither is copied (concepts, not tools).
- **Frames and path elements are data** (`translate="no"`); the path choice labels are in both string tables.
- **"T1 sends a beacon"** (button, key T) appends the next slot to a hidden param `extra` (`'4.9'`), as
  `cap-under-partition` keeps its actions; at most 4 and none after slot 18 (the caption says why when it refuses).
  Each beacon has its own number, so the dupe check lets it through. The kit restores only params with a control from
  the URL, so a link does not carry the extra beacons.
- **Layout holds still within a run:** the card area and the strip reserve as many rows as the whole run needs (the
  page runs the model once per params), and the map takes the height that is left.
- **Colour is never alone:** station kind by shape (triangle, small square, large square, diamond), transmitting by
  fill plus rings and a solid range circle, collision by a red ✕ badge and a cross-hatched ✕ cell, a lost packet by a
  dashed red outline on its bar, a dropped duplicate by a dashed struck-through badge, used elements by bold and
  underline. Checked in the grayscale screenshot.
- **Term rule:** the glossary's `path` is "putanja" (file paths) and `alias` is "nadomjesno ime" (shell aliases),
  neither meant here, so `strings.js` writes the terms out (as the task's "put / zamjensko ime") and the page does not
  load `glossary.js`. The explanation gives the English term in italics with the Croatian in parentheses at first
  mention. Captions use the Croatian words (svjetionik, sudar), and "fill-in digipeater" / "široki digipeater" in
  italics as in the task's caption.
- **Preset hints ask, never answer.**

## Deviations from the task

- The task's state lists `queue`, `heard`, `packets`, `air`, `log` as named; the model adds `timeline` (who is on the
  air per slot, and the clash mark), `delivered` and per-tracker beacon numbers. Extra events: `defer`, `queue`,
  `skip`, `busy`.
- The task's "Changed" marks "the path elements rewritten in this step": shown in the slot the digipeater's copy
  starts (the copy is built at the end of the previous slot, but appears on the air in this one).
- The `csma` scene has no digipeater (see Decisions).
- `topology` is a select, not a choice (5 long names).

## Sources

- 50ohm.de `afsk.md` (APRS on 144.800 MHz with AFSK over FM, 1200 bit/s, digipeaters forward APRS emissions) and
  `relaisfunkstellen.md` (a digipeater receives and resends data packets, may change single fields), Croatian
  translation in `~/projects/50ohm-contents-hr` (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.):
  summarised in the explanation; credited on the page and in `sim.json` `credits`. `paketvermittelte_netzwerke.md` is
  about HAMNET/IP, not APRS (the task's note for the coordinator), and is not used.
- `~/projects/HamMonitor/aprs_logger.py` header (the frame text form `SRC>DEST,WIDE1-1,WIDE2-1:info`) and
  `DESIGN.md` (APRS 144.800 MHz).
- URM book ch. 17 (`uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`), Primjer 1: the hidden node; collision
  and carrier sense terms from URM ch. 7 and 17.
- `sims/csma-ca-rts-cts/` for the page pattern (timeline grid, facts, caption assembly).
- *(check)* APRS Protocol Reference 1.0.1 and the New-n-N paradigm recommendation: fill-in answers WIDE1-1 only, wide
  answers WIDE1-1 and WIDEn-N, the call sign inserted before the alias, N decremented, `WIDEn*` at N = 0. No local copy.
- *(check)* AX.25 2.2 §3.12: up to 8 digipeater addresses; the has-been-repeated bit. No local copy. The "no insertion
  when 8 elements are full" behaviour is the common digipeater practice, not checked.
- *(check)* Duplicate suppression window of 30 s and the check against sent and heard-repeated packets.
- The KAKA slide "APRS u kriznim uvjetima" (tracking field teams; iGate or RF-only relay) was not opened (pptx); it
  only motivates the iGate station.

## Unchecked

- The items marked *(check)* above.
- Slot length, airtime and turnaround are simdeck's simplification (SPEC "Units").

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| digipeater | digipeater (50ohm) |
| path (APRS) | put *(check)*; the glossary's "putanja" is the file path |
| alias (path alias) | zamjensko ime *(check)*; the glossary's "nadomjesno ime" is the shell alias |
| beacon | svjetionik *(check)* |
| collision | sudar (kolizija) (URM ch. 7) |
| hidden node | skriveni čvor (URM ch. 17) |
| carrier sense | osluškivanje kanala *(check)* |
| fill-in digipeater | fill-in digipeater (not translated) |
| wide digipeater | široki digipeater (simdeck's) |
| iGate | iGate |
| tracker | tracker (not translated) |
| slot | odsječak (as in csma-ca-rts-cts) |

## Shared requests

- **glossary:** the term pairs above, with `"src": "simdeck"`, as separate entries for the APRS sense of path and
  alias.

## Tests and mutations

38 tests: tie-breaks first (simultaneous starts with CSMA on, the previous slot only, station order, a busy station
not starting a second packet), then R1–R5, reception, iGate, the presets, steps, extra beacons, scene links, and the
template's generic block over every scene × path × CSMA. A mutation run of 28 mutants (airtime, path limit, alias
matching, first unused, insertion, decrement, `*`, dupe check and window, CSMA on/off/locality, half duplex, overlap
span and locality, turnaround, iGate once, range rule, steps minimum, extra cap, clash listeners, beacon numbers,
busy sender) kills all but two equivalent ones: the 20-slot cap in `steps` (the run is 20 slots anyway) and
`start >= n - 1` for `ongoing` (no air entry has `start = n` before phase 1).

## Review

A fresh reviewer (a subagent with no context from the build) re-derived all five presets and the SPEC's other numbers
slot by slot (all matched), ran 61 mutants and a differential fuzz of 15 000 reachable param sets. Found and fixed:

- **False caption** in the WIDE7-7 run: "…so the next digipeater repeats it again" at D5, where nobody does. Now
  "…so the path still asks for another hop".
- **A delivered packet drawn as lost:** the strip marked a bar lost when any receiver had a collision, though another
  received it (two-hops with a beacon at 4: D2's copy collided at D1 and reached R). Now lost = a collision and no
  listener that received it; the counter counts such packets (it counted receptions: 4 instead of 2 in two-wides) and
  is labelled "packets lost in collisions".
- **Collision sentence** read like a list of three stations: now "At D1 the packets from T1 and T2 overlap".
- **Beacon numbers out of time order** after adding a beacon, stepping back and adding an earlier one: the button
  sorts `extra` and the model numbers beacons in time order; tested.
- **A beacon cut off at slot 20** was simply counted as not arrived: the end caption now says the demo stopped first.
- **Unreachable text:** the "8 elements, no call inserted" caption (and its contradiction with the sentence before)
  is gone; the "heard repeated" half of rule 4 stays in the model (task rule) and is worded as "some digipeaters
  also…" in the explanation.
- **Same-slot sentence** claimed a problem for two starts far apart: it now adds "carrier sense cannot stop this"
  only when two of the starters hear each other.
- **Wording:** T1 in the wide7 chain is a tracker; in the csma scene T1 and T2 "reach" R; "any more"; "certain
  fields"; 144.800 MHz "in Europe"; WIDE1-1 asks for a nearby digipeater, fill-in or wide.
- **Surviving mutants killed** with new tests: half duplex over only the last slot, malformed aliases (WIDE1-2,
  WIDE2-3, WIDE8-1, N = 0), `firstUnused` skipping non-aliases, beacons beyond slot 20 in `extra`, beacon order, the
  cut. 38 tests; my rerun of 35 mutants kills all but the two equivalent ones above.
- Content notes kept as *(check)*: the 8-element limit's source (APRS 1.0.1 rather than AX.25 2.2), insertion vs
  substitution by fill-in digipeaters (the task chose insertion), the TNC2 `*` convention.

## Time

Start 18:40, done 19:13 (2026-11-09), including the fresh review and its fixes.
