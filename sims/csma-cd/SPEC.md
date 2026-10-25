<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# csma-cd: CSMA/CD and binary exponential backoff

One concept: **collisions on a shared bus and how backoff resolves them.** The student steps stations that transmit
at once, one slot time per step. Task: `docs/tasks/w3/csma-cd.md`; catalogue `net-csma-cd` (§4.1).

## Scene

- A shared half-duplex bus with 2–4 stations A–D (series colours c1–c4, a letter on each). Each station has a
  status badge (frame ready, no frame, sensing busy and deferring, sending i/f, collision and jam, backoff counter,
  delivered, frame dropped), its collision counter n and its last draw k with the range it came from.
- Above the bus, a **slot timeline**: one column per slot time, one row per station, plus a row for the medium.
  The kit has no time axis view, so the page draws its own grid (NOTES.md).
- The medium is drawn idle (hollow), busy (solid, the sender's colour and letter) or collision (hatched, zig-zag).
- Full duplex: the bus becomes one link between A and a switch port, one path per direction.

## State

`{ slot, duplex, medium: 'idle'|'busy'|'collision', tx: [{ id }], stations: [{ id, queued, phase, attempt,
backoffLeft, k, range, sentSlots, frame, delivered, gaveUp }], columns: [{ slot, medium, senders, marks }],
collisions, log, done }`. `attempt` is n (collisions of the current frame); `log` holds this slot's events for the
caption; `columns` is the timeline so far. JSON only.

## One step = one slot

Slots are numbered from 1, so step n of the transport is slot n (the task numbers them from 0; NOTES.md). Within a
step, in this order:

1. Stations whose frame is ready (arrived, not yet through) and whose `backoffLeft` is 0 **sense** the medium. If a
   frame from an earlier slot is still on the bus, they **defer**.
2. Every station that sensed the bus idle **starts** sending in this slot.
3. The medium resolves: no sender → idle; one → busy with its frame; two or more → collision.
4. On a collision every sender **jams**, increments n and draws k (rule 4), or gives up (rule 5).
5. Stations that were already counting down at the start of the slot count `backoffLeft` down by one.
6. The caption reads the slot's events.

A station that draws k waits k whole slots after the collision slot and senses again in slot (collision + k + 1).
A frame occupies `frameSlots` consecutive slots (default 2; abstract, not 64 octets exact). The frame on the bus
needs no new sensing in its later slots.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | Carrier sense: a station sends only when it senses the medium idle. If busy, it defers and sends in the first slot the medium is idle again (1-persistent). | URM ch07 "CSMA/CD … osluškuje je li medij zauzet prije nego pošalje"; IEEE 802.3 4.2.3.2.1 deference; 1-persistence *(check)* |
| 2 | Two or more stations that sense idle in the same slot all send: collision, and no frame in it is readable. | URM ch07 "kolizija" |
| 3 | Collision detection: a sender notices the collision while still sending (it hears something other than what it sends), stops and sends a 32-bit jam so every station sees it. Drawn as the jam mark in the collision slot. | URM ch17 "Što treba znati", opening paragraph; jamSize IEEE 802.3 4.4.2 *(check)* |
| 4 | Truncated binary exponential backoff: after the n-th collision of a frame wait k slots, k uniform in 0 … 2^min(n,10) − 1. n=1 → {0,1}, n=2 → {0…3}, n=3 → {0…7}, n ≥ 10 → {0…1023}. | IEEE 802.3 4.2.3.2.5, backoffLimit 10 *(check)*; Kurose & Ross §6.3 |
| 5 | After the 16th collision of a frame it is dropped ("excessive collisions") and reported up. | IEEE 802.3 attemptLimit 16 *(check)* |
| 6 | n resets to 0 after a delivered frame (and after a dropped one); the next frame starts fresh. | IEEE 802.3 4.2.3.2.5 *(check)* |
| 7 | **Tie-break:** two colliding stations that draw the same k sense in the same slot and collide again. A lower letter does **not** win; nothing breaks ties but the draw. Stations deferring behind the same frame all send when it ends (rule 1) and collide. | derived from rules 1, 2, 4 |
| 8 | Full duplex: each end has its own path per direction; there is no contention, CSMA/CD never acts and no collision is possible. The page joins exactly two ends (A and a switch port). | URM ch07 Primjer 4; IEEE 802.3 clause 4 *(check)* |
| 9 | Slot time = 512 bit times (51.2 µs at 10 Mb/s) = 64 octets: a sender must still be sending when the news of a collision comes back, so a frame is at least 64 octets. Explanation only, not modelled in time. | URM ch07 (64 octets); IEEE 802.3 4.4.2 *(check)* |

Draws: a preset's scene scripts `draws[station][n − 1]` for the first frame; with `seed` 1–99, or for a draw the
script lacks, k = ⌊u · 2^min(n,10)⌋ with u from a mulberry32 hash of (seed, station, frame, n). Same params,
same run.

A run ends in the slot after which every frame is delivered or dropped and the bus is free; it stops at 20 slots
(contract: at most 20 steps) and the caption names who is still waiting.

## Params

| key | type | values | default | |
|---|---|---|---|---|
| `stations` | range | 2–4 | 2 (from the preset) | disabled in full duplex (two ends) |
| `duplex` | choice | `half`, `full` | `half` | resets to step 0 |
| `frameSlots` | range | 1–4 | 2 | slots per frame |
| `seed` | range | 0–99 | 0 | 0 = the scene's scripted draws ("from the example"); 1–99 = every k from that seed. Hidden in full duplex |
| `newDraw` | button `N` | | | a new seed 1–99, different from the current one |
| `scene` | hidden choice | the five scenes | `two-collide` | set by the presets: arrivals and scripted draws; kept in the URL |

## Presets and expected numbers

Checked with the model (`node` over `sim.js`, the table in NOTES.md) and in `sim.test.js`. Notation per row: `X`
collision and jam, `s` sending, `S` last slot of a frame (delivered), a digit = backoff slot with that many left
before counting, `d` deferring, `.` no frame yet.

| # | id | params | timeline (slots 1…) | steps | collisions | delivered |
|---|---|---|---|---|---|---|
| 1 | `two-collide` | 2 stations, draws A=0, B=1 | A `XsS`, B `X1dsS`; medium c b b b b | 5 | 1 | 2 |
| 2 | `same-draw` | 2 stations, draws A=1,3 B=1,0 | A `X1X321sS`, B `X1XsS`; medium c i c b b i b b | 8 | 2 | 2 |
| 3 | `wait-then-crash` | 3 stations; C ready in slot 1, A and B in slot 2; draws A=0, B=1 | C `sS`, A `.dXsS`, B `.dX1dsS` | 7 | 1 | 3 |
| 4 | `three-stations` | 3 stations, draws A=0; B=1,2; C=1,0 | A `XsS`, B `X1dX21sS`, C `X1dXsS` | 8 | 2 | 3 |
| 5 | `full-duplex` | full duplex, A and the switch | A `sS`, switch `sS`; medium busy, busy | 2 | 0 | 2 |

- 1: A sends in slots 2–3; B waits slot 2, senses A's frame in slot 3 and defers, sends in 4–5.
- 2: both draw k = 1, wait slot 2 and collide again in slot 3 (rule 7); n = 2, the range doubles to 0…3; B draws 0
  and sends 4–5, A draws 3, waits 4, 5, 6 and sends 7–8.
- 3: A and B get their frames while C's is on the bus, defer in slot 2 and both send in slot 3 (rule 1): collision.
- 4: A draws 0 and sends 2–3; B and C draw 1, wait slot 2, find A's frame in slot 3 and defer, both send in slot 4:
  second collision (rule 7 via rule 1). n = 2: B draws 2, C draws 0 → C sends 5–6, B waits 5, 6 and sends 7–8.
- 5: both ends send in slot 1, both frames arrive in slot 2; no collision, no backoff.

`sim.json` `steps` = 5 (the defaults are preset 1). The steps are those of the task (one per slot, plus the start
at step 0: 6, 9, 8, 9, 3 positions).

Rule 5 has no preset (16 collisions in a row take at least 16 slots, and only with scripted draws); it is tested in
`sim.test.js` with both stations drawing 0 sixteen times: they collide in slots 1–16 and both drop the frame.

## Misconceptions the page addresses

- "CSMA/CD prevents collisions": carrier sense cannot stop two stations that sense idle in the same slot (presets 1,
  3, 4); it detects and recovers.
- "CSMA/CD was replaced by something better": in full duplex it simply has nothing to do (preset 5; URM ch07
  question 11).
- "The backoff range is fixed": it doubles with every collision of the same frame (preset 2).

## Out of scope

Bit-time propagation along the cable, the capture effect, the frame format (`net-ethernet-frame`), counting
collision domains (`net-domains`), Wi-Fi (`net-csma-ca-rts-cts`), the interframe gap (96 bit times; mentioned in the
explanation only).
