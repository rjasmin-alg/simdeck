<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# csma-ca-rts-cts: spec

One concept: **Wi-Fi avoids collisions it can't detect; RTS/CTS fixes the hidden node.** Task
`docs/tasks/w3/csma-ca-rts-cts.md`, catalogue `net-csma-ca-rts-cts` (extends `urm-hidden-node`).

## Scene

URM ch. 17, Primjer 1: station A on the left, access point B in the middle, station C on the right. A–B and B–C are in
range; A–C only with `hidden` off. A and C each have one unicast data frame for B from slot 1. Under the scene, a slot
timeline with rows A, B, C (what each sends; for A and C the DIFS slot, the backoff counter, frozen slots and NAV) and a
row "at B" (whom B hears, ✕ for garbage).

## Units (simplifications, all *derived*)

| Thing | Here | Real 802.11 |
|---|---|---|
| slot | one timeline cell | 9 µs (OFDM) *(check)* |
| RTS, CTS, ACK | 1 slot each | short control frames |
| DATA | `dataA` / `dataC` slots, 2–6 (default 4) | depends on size and rate |
| SIFS | the boundary between two slots: a reply starts in the next slot without listening | shorter than a slot |
| DIFS | 1 idle slot | SIFS + 2 slots |
| ACK/CTS timeout | the slot right after the frame | about SIFS + slot + reply |
| NAV | from an RTS or CTS only | also from DATA's Duration (covers the ACK); not needed here because the ACK is heard anyway |

## Rules (with sources)

1. **No collision detection while sending.** A sender hears nothing in its own slots; 802.11 avoids collisions instead
   of detecting them (URM ch. 17 "Što treba znati", first paragraph). In the model: `heard[x] = []` while x sends.
2. **DIFS, then backoff; the counter freezes while busy.** A station waits for one idle slot (DIFS), then counts its
   counter down by 1 per idle slot and sends in the slot after it reaches 0 (a counter of 0 sends right after DIFS).
   A busy slot freezes the counter and sends the station back to DIFS with the counter kept; after DIFS it resumes
   where it stopped (IEEE 802.11-2020 §10.3 *(check: no local copy)*; random backoff: URM ch. 17 [^ack]).
3. **Carrier sense is local.** A station counts a slot busy only if **it** hears a frame in that slot or its NAV covers
   the slot (virtual carrier sense) (URM ch. 17, NAV paragraph). NAV set at the end of slot n counts from n + 1.
4. **ACK for every unicast frame; no ACK means lost.** B answers an intact DATA with ACK in the next slot (SIFS) and an
   intact RTS with CTS. A sender that has not received its CTS/ACK intact by the end of the slot after its frame times
   out: CW doubles (15 → 31 → 63 … up to 1023), a new counter is drawn from 0 … CW, and it starts again at DIFS (URM
   ch. 17 ACK paragraph and [^ack]; CWmin 15 and CWmax 1023 for OFDM PHYs from Kurose & Ross §7.3.2 *(check)*).
5. **Hidden node.** A frame is intact at a listener only if that listener heard it alone in every slot of the frame
   and was not sending. A and C overlapping at B means garbage at B, no ACK; neither A nor C noticed anything (URM ch.
   17 Primjer 1). The hidden station keeps counting down while the other one sends (it does not hear it).
6. **RTS/CTS and NAV.** With RTS/CTS the sender sends a 1-slot RTS; B answers CTS in the next slot; DATA follows in
   the next; then ACK. Duration field, in slots after the frame: RTS = CTS + DATA + ACK = size + 2, CTS = DATA + ACK =
   size + 1. Every station that decodes an RTS or CTS not addressed to it and not its own sets
   NAV = end slot + Duration (never lowers it) and counts the medium busy until then. C hears B's CTS though it never
   hears A (URM ch. 17, Primjer 1 solution; book's footnote quoting IEEE P802.11-96/49C slides 8–9).
7. **RTS_Threshold.** A frame uses RTS/CTS only when `rtscts` is on and its size in slots is above `threshold`
   (0 = every frame) (URM ch. 17, the RTS_Threshold sentence).
8. **Tie-break: same slot, both send.** Two stations whose counters reach 0 at the end of the same slot both start in
   the next one; neither sees the other's start, since a station decides from the previous slot only. With RTS/CTS
   the collision is between two 1-slot RTS frames (1 slot of garbage at B, no CTS, both time out and double CW);
   without it, between two DATA frames (size slots of garbage) (derived from rules 4 and 6 *(check wording against
   802.11)*).
9. **Edge case, explanation only:** a station in range of neither sender nor receiver hears neither RTS nor CTS and
   does not defer. Not in this line-up.

Order within a slot: (1) starts, (2) reception, (3) frame ends: replies scheduled, CTS → DATA, ACK → delivered, NAV
set, (4) carrier sense and countdown, (5) timeouts.

Caption event "unheard": the other station starts a frame in a slot in which this one counts down or passes DIFS (not
held by NAV) without hearing it.

## Draws

The first counter of A and C is a param (`backoffA`, `backoffC`, 0–15 = 0 … CWmin). A retry's counter is drawn from
`seed` (mulberry32, the kit's generator, `draw(seed, station, attempt, cw)` in `sim.js`) so every run replays.
Deviation from the task: the task has only `seed`; the first draws are params so a preset can set them exactly and a
student can make them equal by hand (rule 8).

## Steps

One step = one key slot: slot 1 (both DIFS), a frame start, a reply, a timeout, or the DIFS after which a frozen
counter resumes. Slots between fold into the next key slot (the caption lists their events). The run ends when both
frames are delivered or after 48 slots; at most 20 steps.

## Presets (all with `seed` 5, `dataA` = `dataC` = 4 unless named)

Numbers from `node` on the model, checked by `sim.test.js`.

| # | id | params | what happens | slots | steps |
|---|---|---|---|---|---|
| 1 | `hidden-no-rts` | defaults: hidden, RTS/CTS off, draws A 2, C 2 | both DATA in slots 4–7, garbage at B (4 slots), both time out in 8, CW 31; retry draws A 2, C 7; A sends DATA 12–15 while C, not hearing it, counts 7 → 1; ACK in 16 (C hears it, freezes at 1); A delivered in 16, C sends 19–22, delivered in 23 | 23 | 8 |
| 2 | `hidden-rts` | hidden, RTS/CTS on, A 2, C 5 | A RTS in 4 (C counts on, unheard), CTS in 5: C freezes at 2 and sets NAV 5 + 5 = 10; A DATA 6–9, ACK 10; C DIFS 11, counts 2, RTS 14, CTS 15 (A sets NAV to 20), DATA 16–19, ACK 20 | 20 | 10 |
| 3 | `not-hidden` | A and C hear each other, RTS/CTS off, A 3, C 5 | A counts 3 and sends DATA 5–8; C hears it in 5 and freezes at 2; ACK 9; C DIFS 10, resumes 2 → 0 in 11–12, DATA 13–16, ACK 17 | 17 | 6 |
| 4 | `rts-collision` | hidden, RTS/CTS on, A 2, C 2 | both RTS in 4: garbage at B for 1 slot, no CTS, both time out in 5, CW 31, retry draws A 2, C 7; A RTS 9, CTS 10 (C freezes at 4, NAV 15), DATA 11–14, ACK 15; C DIFS 16, counts 4, RTS 21, CTS 22, DATA 23–26, ACK 27 | 27 | 12 |
| 5 | `threshold` | hidden, RTS/CTS on, threshold 3, A 2-slot frame, C 5-slot frame, A 2, C 5 | A's 2-slot frame goes without RTS (DATA 4–5, C counts on unheard), ACK 6, C freezes at 1; C's 5-slot frame uses RTS (9), CTS 10 (A sets NAV 10 + 6 = 16), DATA 11–15, ACK 16 | 16 | 8 |

Comparison 1 vs 4 (same draws): garbage at B 4 slots vs 1 slot (rule 8). In all 23 vs 27 slots: RTS/CTS adds 2 slots
per delivered frame (+4), the failed attempt is 3 slots shorter (RTS + timeout = 2 slots instead of DATA + timeout = 5),
and C's countdown waits 3 slots longer, because under NAV it is frozen while without RTS/CTS the hidden C counted down
during A's DATA (+3). Without RTS/CTS that counting nearly caused a second collision (C was at 1 when A's ACK froze it).

Task estimates were 7, 12, 9, 14, 10 steps; the model gives 8, 10, 6, 12, 8 (task: "fix after the model exists").
The task's `rts-collision` retry draws A 4, C 9 were "derived, unchecked"; here seed 5 gives A 2, C 7 (the same story:
A first, C waits on NAV) and matches preset 1, so 1 vs 4 compares like with like.

## Params

`rtscts` toggle; `hidden` toggle (default on); `threshold` 0–6 (shown only with RTS/CTS on); `dataA`, `dataC` 2–6
(task: one `dataSlots`; split so the threshold preset can give A and C different sizes); `backoffA`, `backoffC` 0–15;
`seed` 1–99.

## Out of scope

Exact µs timings per PHY, EIFS after a garbled frame, EDCA/QoS, CTS-to-self, fragmentation, rate adaptation, retry
limits, the exposed-node problem.

[^ack]: URM ch. 17, footnote quoting IEEE P802.11-96/49C slides 4 and 6: "When no ACK received then retransmit frame
after a random backoff (up to maximum limit)."
