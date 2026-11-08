<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# nominal-vs-actual: spec

Explorer (task `docs/tasks/w3/nominal-vs-actual.md`, catalogue `net-nominal-vs-actual`, §4.1). One concept:
**overhead, half duplex and retries eat the link rate**. The nominal bandwidth (nazivna propusnost) is the width of
the road; the achieved throughput (ostvarena brzina prijenosa) is what reaches the finish, and nothing has to be
broken for the two to differ.

## Scene

Top to bottom:

1. **The road** (URM ch06, figure `ch06-nazivna-propusnost-ostvarena-brzina.svg`): a road whose width is the nominal
   bandwidth, 20 cars on it; the cars that carry useful data and reach the finish are solid, the others hollow. Beside
   it the **result box**: achieved throughput in Mb/s or MB/s (the unit param), the other unit under it, and the
   frames per second on the link.
2. **The bar**: one horizontal bar the width of the nominal bandwidth, cut to scale into six segments, left to right:

   | # | Segment | `kind` | Drawn |
   |---|---|---|---|
   | 1 | useful data (goodput) | `data` | c1, solid |
   | 2 | TCP/IP headers | `l34` | c2, solid |
   | 3 | Ethernet header + FCS (and padding) | `l2` | c3, dotted |
   | 4 | preamble + SFD + interframe gap | `l1` | c4, hatched |
   | 5 | shared with others | `share` | c5, hollow (dashed outline) |
   | 6 | retries | `retry` | danger, cross-hatched |

   A bracket over the whole bar names the nominal bandwidth, one under segment 1 the achieved throughput.
   Under the bar six cells, one per segment, with its rate and its share of the bar.
3. **One frame to scale**: preamble+SFD 8, destination 6, source 6, type 2, IP header 20, TCP header 20, data,
   (padding), FCS 4, gap 12, as a strip proportional to bytes, with each field's byte count under it.

## State

`initial(params)` → `{ wireBytes, dataBytes, padBytes, efficiency, share, loss (0–1), goodputBps, perStationBps, achievedBps,
fps, frameTime, segments, fields }`; a pure function of the params. Rates in bit/s, `frameTime` in s.
`segments` is `[{ kind, bits }]` in the order above, `bits` per second of the nominal bandwidth; they always sum to
the nominal rate. `fields` is `[{ kind, field, bytes }]`, the frame left to right, zero-byte fields left out.

## Rules

1. **Wire bytes per frame** = max(P, 46) + 18 (Ethernet header 14 + FCS 4) + 20 (preamble 7 + SFD 1 + interframe
   gap 12), P the IP packet in bytes (URM `07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adrese": 64 and 1518
   octet frames, the 8 octets of preamble and SFD not counted in the frame's length; IFG 96 bit times = 12 octets,
   IEEE 802.3 §4.4.2 *(check)*). **Tie-break:** a packet under 46 B is padded to 46; the padding is Ethernet
   overhead (`l2`), not data. The page's packet range starts at 46, so padding shows only in the model's tests.
   - `l1` off drops the 20 B, `l2` off drops the 18 B **and the padding** (no Ethernet frame, nothing to pad). Both
     are counterfactuals: every real Ethernet frame carries them; the page says so.
2. **Useful data per frame** = P − 40 with TCP/IPv4 headers on (IPv4 20 B, RFC 791; TCP 20 B, RFC 9293; no options),
   P with them off. **Tie-break:** never below 0 (only P < 40 with headers on, unreachable from the page).
3. **Efficiency** = data / wire bytes. **Goodput** = nominal × efficiency. **Frames per second** on the link =
   nominal / (8 × wire bytes) = 1 / frame time, the frame time being the transmission delay of one frame, size / rate
   (the rule of `delay-components`, rule 2).
4. **Shared medium** (URM ch06, third reason; ch07 "Koncentrator"): on a half-duplex medium with n stations sending
   at once, each gets goodput / n. Collisions and backoff are ignored (the caption and the explanation say so).
5. **Duplex** (URM ch06 "Dupleks"): on full duplex each direction has the full rate and nobody shares (every
   station has its own link through the switch), so `stations` does not apply (the page disables it with the reason).
   On half duplex with traffic in both directions, each direction gets half.
   **Rules 4 and 5 together:** the medium carries one frame at a time and everyone sending takes turns, so the share
   is **k = max(2, n)** on `half-both` and 1 on `full`. Two ends talking both ways are two senders (÷2, rule 5);
   three stations on a hub are three senders (÷3, the `shared-hub` preset). The page's `stations` slider starts at 2
   on half duplex. *Deviation:* applying rules 4 and 5 one after the other would give ÷2n and 15.8 Mb/s for
   `shared-hub`, not the task's 31.6.
6. **Retries**: with frame loss p (in %), each lost frame is sent again until it arrives; of the station's share,
   the fraction p carries frames that are lost: achieved = goodput / k × (1 − p) (derived, unchecked).
7. **Units**: MB/s = Mb/s ÷ 8, decimal prefixes (URM ch06 Primjer 4, "bajt ima osam bitova").
8. **Line coding is not a segment**: the advertised Ethernet rate (10 / 100 / 1000 Mb/s) is already the data rate
   after coding (Manchester at 20 Mbaud for 10 Mb/s, 4B/5B at 125 Mbaud for 100 Mb/s; IEEE 802.3 clauses 14, 24
   *(check)*). The explanation says so and points to the `line-coding` simulator.

### The bar's segments (from rules 1–6)

With R the nominal rate, k the share and p the loss: the station's own time is R / k; of it, the fraction p is lost
frames (`retry` = R / k × p), and the rest, R / k × (1 − p), is split between the frame's parts in proportion to their
bytes: `data` = … × data / wire, `l34` = … × (40 or 0) / wire, `l2` = … × (18 + padding or 0) / wire,
`l1` = … × (20 or 0) / wire. `share` = R × (1 − 1 / k). The six sum to R. `data` equals `achievedBps`.

### Changed

`changed(before, now)` lists the kinds whose bits differ by more than 10⁻⁶ bit/s, in bar order: the segments the last
param change added, removed or resized. Nothing without a "before" (first render, a preset load).

### Caption

`captionKey(params, state)` picks one sentence by priority: `capShared` (k > 2: k stations take turns), `capDuplex` (k = 2: the
two directions take turns), `capLoss` (p > 0), `capOff` (an overhead toggle off), `capTotal`. The page
adds `capBytes` when the unit is MB/s, and `capLossToo` when sharing and loss are both on.

### Display

Rates with 4 significant digits in the cells and the result (94.93, 949.3, 71.43, 11.04), one decimal in captions
from 10 up, 3 significant digits below (94.9, 31.6, 4.40); frames per second as whole numbers, grouped by no-break spaces from five digits; Croatian with a decimal
comma.

## Presets and expected numbers

| Preset | Params | Expected |
|---|---|---|
| `book-ex1` | 100 Mb/s, 1500 B, all overheads, no loss (the defaults) | 1460 / 1538 = 94.93 % → **94.93 Mb/s**, 8127 frames/s. URM ch06 Primjer 1 measured 82 Mb/s: headers explain about 5 Mb/s; loss 14 % gives 81.64 Mb/s |
| `book-ex4` | 100 Mb/s, loss 7 %, unit MB/s | 94.93 × 0.93 = 88.28 Mb/s = **11.04 MB/s** (the browser's "about 11 MB/s", URM ch06 Primjer 4); the same on 1 Gb/s 110.35 MB/s |
| `tiny-frames` | 1 Gb/s, packet 46 B | 6 / 84 = 7.14 % → **71.43 Mb/s** at **1 488 095 frames/s** *(check: the standard 1.488 Mpps line rate)* |
| `gigabit-full` | 1 Gb/s, 1500 B | 949.3 Mb/s = 118.7 MB/s; with `l1` off 961.8 Mb/s (1518 B on the wire): gap and preamble cost 1.3 % of the nominal |
| `shared-hub` | 100 Mb/s, half-both, 3 stations | 94.93 / 3 = **31.64 Mb/s** each; segment `share` 66.67 Mb/s |

Also asserted: half-both with 1 (or 2) stations → 47.46 Mb/s; 10 Mb/s, 1500 B → 9.493 Mb/s, 812.7 frames/s;
`l2` off at 1500 B → 1520 B on the wire; P = 20 → 46 + 18 + 20 = 84 wire bytes with 26 B of padding.

Numbers checked with `node` on 2026-11-08 (the formulas above), all asserted in `sim.test.js`.

## Params

`rate` choice 10 | 100 | 1000 Mb/s (100); `packet` range 46–1500 B step 2 (1500); `l1`, `l2`, `l34` toggles (on);
`duplex` choice `full` | `half-both` (`full`); `stations` range 1–8, min 2 on `half-both`, disabled on `full` (1);
`loss` range 0–30 % step 1 (0); `unit` choice `Mb/s` | `MB/s` (`Mb/s`).

## Out of scope

Queueing and latency (`delay-components`); TCP windows and congestion control; Wi-Fi MAC timing; VLAN and PPPoE
tags; collision and backoff dynamics (`net-csma-cd`); line coding (rule 8).
