<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# packet-aprs: spec

One concept: **CSMA on a shared channel, digipeaters, path aliases.** Task `docs/tasks/w3/packet-aprs.md`, catalogue
`ham-packet-aprs` (§4.10). The student sends beacons through digipeaters.

## Scene

A map-like box 100 × 44 with stations and their range circles: trackers T1 (T2), a fill-in digipeater, wide
digipeaters, and an iGate R. Links are drawn only between stations in range of each other. Under it the packet card
(the frame on the air in text form `SRC>DEST,PATH:info`, used path elements bold and underlined, the ones rewritten
in this step highlighted), a time strip (one column per slot, each transmission a bar over its 2 slots, a ✕ row where
some listener hears two at once; a bar with a dashed red outline is a packet that no listener received because of a
collision), and counters (slots with the channel busy, transmissions, beacons at the iGate, packets lost in collisions:
a collision somewhere and no listener that received them).

Call signs are the station ids (T1, D1, R: fictional), the destination is the generic `APRS`, the info field is a
status `>n` (beacon number n of that tracker; shown as `>1`, `>2`).

## Units (simplifications)

| Thing | Here | Real |
|---|---|---|
| slot | one step | about 0.25 s, illustrative |
| packet airtime | 2 slots (≈ 0.5 s at 1200 bit/s) | depends on length and TX delay |
| digipeater turnaround | the copy is ready in the slot after reception | a few hundred ms |
| duplicate memory | 120 slots = 30 s, longer than any demo | 30 s *(check)* |

## Rules (with sources)

Within one slot, in this order:

1. **Starts and carrier sense.** Every station whose first queued packet has `readyAt ≤ slot` and that is not already
   sending (its own packet started in the previous slot) senses the channel. With CSMA on it waits while it hears any
   transmission that started in the previous slot (i.e. is still on the air in this one); otherwise it starts.
   A start in this slot cannot be sensed by anyone in this slot. (Task rule 5; URM ch. 17 hidden node.)
2. **Reception** at the end of each packet's last slot, at every station in range of the sender: lost if the receiver
   itself transmitted in either of the packet's 2 slots (half duplex, event `busy`); lost if any other transmission
   the receiver hears occupies either of the 2 slots (event `collision`, both packets are lost); otherwise received
   (event `rx`). Trackers receive nothing that matters and log nothing. Radio has no collision detection.
3. **Digipeaters** apply the path rules to what they received and queue their copy for the next slot.
4. **The iGate** records the first copy of each packet (same source, destination, info) once (event `deliver`).

Path and digipeater rules:

- **R1 Frame.** Source, destination, then up to 8 path elements in order (APRS Protocol Reference 1.0.1: 0–8
  digipeater addresses *(check)*; the task cites AX.25 2.2 §3.12, which may allow only 2 *(check)*).
  A station acts only on the **first unused** element. With 8 elements already, a digipeater does not insert its call
  (it only decrements N) *(check)*. Unreachable on the page (the longest path here has 6 elements); unit-tested.
- **R2 Aliases** (New-n-N paradigm, APRS Protocol Reference 1.0.1 and the WIDEn-N recommendation *(check)*): a
  **fill-in** digipeater answers only `WIDE1-1`; a **wide** digipeater answers `WIDE1-1` and any `WIDEn-N` with
  1 ≤ N ≤ n ≤ 7. Nobody answers a used element or a call sign; trackers and the iGate never digipeat. (Real wide
  digipeaters often refuse large n; here they do not, which is what preset 3 shows.)
- **R3 Rewriting.** Insert the digipeater's own call (marked used) before the alias, decrement N; when N reaches 0 the
  alias is used and written `WIDEn*`. `WIDE1-1,WIDE2-1` → after D1 `D1,WIDE1*,WIDE2-1` → after D2
  `D1,WIDE1*,D2,WIDE2*`; `WIDE2-2` → after D1 `D1,WIDE2-1` → after D2 `D1,D2,WIDE2*` *(check against the spec)*. The
  text form marks used aliases with `*` and writes inserted calls plain, as the task does; real monitors in the TNC2
  format print one `*` after the last repeated element only *(check)*. "Changed" marks the inserted call and the
  rewritten alias in the slot the copy starts.
- **R4 Duplicates.** A digipeater drops a packet (same source, destination, info) it has sent, or heard repeated (a
  copy with any used element), in the last 30 s; an original heard from the tracker does not count. The check comes
  first, before the path (event `dupe` with `why: sent|heard`) *(check)*. Implementations differ (many remember only what
  they sent); the page's explanation says so. No scene reaches `why: heard` (a digipeater that heard a repeated copy
  never hears another copy later); it is unit-tested through `isDupe`. A queued copy is never overtaken here: every
  packet lasts 2 slots and a copy is ready in the next slot, so a digipeater waiting with its copy always hears the
  other copy overlap with whatever made it wait; the "drop the queued copy" case cannot occur and is not modelled.
- **R5 CSMA** as in rule 1: two stations that find the channel idle in the same slot both start and collide at every
  receiver that hears both. Hidden stations (out of each other's range) cannot defer for each other. p-persistence and
  random delays are out of scope; ties come from the presets' ready times.
- **R6 Ties.** Stations are processed in scene order only for drawing and the log; every decision in a slot uses the
  state before it, so reversing the station order gives the same events (tested for every scene, path and CSMA).

**Range.** Two stations are in range of each other when their distance is at most the smaller of their two ranges
(links are symmetric).

**Clash mark** (the strip's ✕ row): a slot in which some station that is not itself transmitting is in range of two
or more transmitters.

## Steps

One step = one slot. Steps = the scene's minimum or the last slot with any event, whichever is later, at most 20.
Minimums: two-hops 6, two-wides 6, wide7 6, csma 4, hidden 3 (the task's counts; the slot after the last event shows
that nothing more happens).

## Scenes and presets

Positions and ranges in `sim.js` `SCENES`; links checked by a test.

| # | preset / scene | params | links | trace (from `node`, checked by `sim.test.js`) | steps |
|---|---|---|---|---|---|
| 1 | `two-hops` | defaults (`WIDE1-1,WIDE2-1`, CSMA on) | T1-D1, D1-D2, D2-R | T1 1–2, D1 (fill-in) 3–4 `D1,WIDE1*,WIDE2-1`, D2 (wide) 5–6 `D1,WIDE1*,D2,WIDE2*`; at 6 R delivers, D1 drops D2's copy (sent it) | 6 |
| 2 | `two-wides` | defaults | T1-D1, D1-D2, D1-D3, D2-R, D3-R | T1 1–2, D1 3–4; D2 and D3 both answer WIDE2-1 and both send 5–6 (they cannot hear each other); collision at D1 and at R; nothing delivered | 6 |
| 3 | `wide7` | path `WIDE7-7` | T1-D1 … D4-D5 (chain), D2-R | T1 1–2, D1 3–4, D2 5–6 (R delivers at 6 with `D1,D2,WIDE7-5`), D3 7–8, D4 9–10, D5 11–12 `…,D5,WIDE7-2`; each Dk drops D(k+1)'s copy; 5 digi transmissions, channel busy 12 slots | 12 |
| 3' | `wide7` | path `WIDE2-2` | same | T1 1–2, D1 3–4 `D1,WIDE2-1`, D2 5–6 `D1,D2,WIDE2*`; R delivers at 6; D3 does not repeat; 2 digi transmissions, 6 slots | 6 |
| 4 | `csma` | defaults (no digipeater in the scene) | T1-T2, T1-R, T2-R | T1 ready 1, T2 ready 2. On: T2 hears T1 at 2 and waits, sends 3–4; R delivers at 2 and 4. Off: T2 sends 2–3, overlaps T1's slot 2; both lost at R (at 2 and 3) | 4 |
| 5 | `hidden` | defaults | T1-D1, D1-T2, D1-R | T1 and T2 ready 1, cannot hear each other, both send 1–2; collision at D1; neither repeated; same with CSMA off | 3 |

Other numbers the tests pin: two-hops with `WIDE2-2` or no path stops at D1 (skip); a second beacon at slot 8 in
two-hops arrives at 13 (steps 13), D1 drops both returning copies; at slot 3 T1 and D1 start together and D1, sending,
misses beacon 2 (`busy`); at slot 2 T1 is still sending, so beacon 2 starts at 3; in wide7 + `WIDE7-7` a beacon at
slot 7 or 8 gets through while D3 sends far away (no collision, no deferral).

## Params

`topology` (select of the 5 scenes, resets), `path` (`WIDE1-1,WIDE2-1` / `WIDE2-2` / `WIDE7-7` / none, default the
first), `csma` (toggle, default on), and the button "T1 sends a beacon" (key T): it appends the next slot to `extra`
(a hidden param, `'4.9'` = beacons queued at slots 4 and 9), at most 4 extra beacons and none after slot 18. Each
beacon has its own number (numbered per tracker in time order, whatever order `extra` lists them), so it is not a
duplicate. A beacon late in the run may not get through by slot 20: the end caption then says the demo stopped first
(`cut`).

## Out of scope

AX.25 connected mode, the APRS-IS internet side, position and telemetry formats, HAMNET/IP routing, AFSK details
(`fsk-psk-ask`), p-persistence and random delays, asymmetric links, viscous/delayed digipeating.
