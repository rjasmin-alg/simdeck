<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multiple-access: FDMA, TDMA and CDMA

One concept: **three ways to share one channel.** FDMA cuts the band into channels, TDMA cuts the frame into time
slots, CDMA lets every user send at once on the whole band and separates them by orthogonal codes. Class: explorer
(the state is derived from the params). Task: `docs/tasks/w3/multiple-access.md`; catalogue `ham-multiple-access`
(§4.10).

Sources: 50ohm.de, section `vielfachzugriff` (Croatian translation in `50ohm-contents-hr`; CC BY 4.0,
50ohm.de-Autorenteam, AJW-Referat des DARC e.V.), cited as *50ohm*: FDMA channels kept even when idle, TDMA slots
and precise synchronisation, CDMA at the same time on the same band with spreading codes; examples AMPS, GSM, DECT,
DMR, UMTS, GPS. Walsh–Hadamard codes: Proakis and Salehi, *Digital Communications*, 5th ed., ch. 13 (standard; not
re-read for this sim). The numbers (band, frame, guards) are illustrative (task file). Every number below is
checked by `sim.test.js`.

## Units and constants

| Name | Value | Why |
|---|---|---|
| `band` | 100 kHz (default) or 12.5 kHz | the channel to share; 12.5 kHz is one DMR channel (preset `tdma-dmr`) |
| `MIN_CHANNEL_KHZ` | 12.5 kHz | the narrowest FDMA channel (task) |
| `GUARD_KHZ` | 2.5 kHz | guard band between FDMA channels (task) |
| `FRAME_MS` | 60 ms | the TDMA frame (task; DMR's frame *(check)*) |
| `GUARD_MS` | 2.5 ms | guard time after each TDMA slot (this sim's choice: two slots then give 27.5 ms + 2.5 ms = 30 ms, a DMR burst of 27.5 ms *(check)*) |
| `MAX_SLOTS` | 4 | slots a frame holds (task: "frame 60 ms in 2–4 slots") |
| `CODES` | + + + +, + − + −, + + − −, + − − + | rows of the 4×4 Walsh–Hadamard matrix |
| `L` | 4 chips per bit | the code length |
| `MAX_USERS` | 5 | the `users` range is 1–5 |
| plane | time 0–120 ms (two frames) × frequency 0–band | the page's drawing |

## Rules

1. **FDMA** (50ohm). With N served users the band is split into N fixed channels of width w = (B − (N − 1)·g)/N,
   channel k (0-based) from k·(w + g) to k·(w + g) + w, a guard band g between neighbours (none when `guard` is off).
   Each user keeps its channel all the time, also when silent: a silent user's channel is drawn hollow and counts
   as unused. 4 users in 100 kHz: w = 23.125 kHz; guards 3 × 2.5 = 7.5 kHz (7.5 %).
2. **TDMA** (50ohm). One frequency channel (the whole band); with N served users the frame is split into N slots of
   len = (60 − N·gt)/N ms, slot k from k·(len + gt), a guard time gt right after each slot (none when `guard` is off).
   Users send only in their own slot, in every frame; the page draws the shared clock (a tick at every slot start)
   because every user must count the same time (50ohm: precise synchronisation). Each user gets the whole band for
   len/60 of the time. 4 users: slots of 12.5 ms at 0, 15, 30, 45 ms; guard 16.7 %.
3. **CDMA** (50ohm). All users send at the same time on the whole band. User i sends d_i = +1 for bit 1, −1 for bit 0,
   0 when silent (absent from the air), times its code c_i: the chips d_i·c_i. The air carries Σ d_i·c_i. Receiver j
   (one per code) computes corr_j = (Σ_k air_k · c_j,k)/L and decides by the sign: corr > 0 → 1, corr < 0 → 0.
   - **Tie-break: corr = 0 decides nothing** (no user on that code, or two users on it who cancel).
   - **Collision:** when two active users hold the same code, that receiver's result is unreadable (no bit) whatever
     its value: 0 when their bits differ, ±2 when they agree; a single receiver expects ±1.
4. **Codes** (Proakis ch. 13). The four codes are mutually orthogonal (c_i · c_j = 4 when i = j, else 0), so a
   receiver gets exactly its own user's d, and a code nobody holds reads 0, for any bits of the others.
5. **Capacity.** FDMA: N ≤ ⌊(B + g)/(12.5 + g)⌋, i.e. 6 in 100 kHz with guards (6.83), 8 without (exactly 8: the
   floor keeps an exact fit), 1 in 12.5 kHz. TDMA: N ≤ 4 (one user gets one slot of 57.5 ms, not the task's minimum of 2 slots: N follows the users). CDMA: N ≤ L = 4 with orthogonal codes. Past capacity FDMA
   and TDMA **refuse** the extra users (they get no channel or slot; the caption says why: FDMA gives the width all
   would get, e.g. 3 users in 12.5 kHz → 2.5 kHz, below 12.5; TDMA "the frame has only 4 slots"); CDMA serves
   everyone but **reuses** a code, and the two holders collide (rule 3).
6. **Order and tie-break.** Users get channels, slots and codes in the order they were added, the lowest free index
   first: user k gets channel/slot/code k. Past L the codes are reused from the lowest index: user 5 gets code 1.
   A silent user keeps its index (nobody moves down into its channel or slot).

**Counters** (per scheme): users served (`served` of `n`; in CDMA the users whose bit can be read, so `n` less the colliding users: `cdma-overflow` serves 3 of 5), capacity left (`capacity − n`, never below 0), unused share
(the silent user's channel or slot as a share of the plane: FDMA w/B, TDMA len/60; CDMA 0, a silent user takes
nothing), guard share (FDMA (N − 1)g/B, TDMA N·gt/60), per user (bandwidth × share of time). Used + unused + guard +
free = 1. In CDMA every active user has 100 % of the plane.

**Changed marks** (`changed(prev, next)`): the users whose channel bounds (FDMA), slot bounds (TDMA) or chips (CDMA)
differ from the previous hand-set params, new users included, and the air chips that changed. Adding a user moves
every FDMA strip and TDMA slot but no existing CDMA user. A scheme switch or a preset load marks nothing.

**Explorer state:** `scheme, n, idle, bits, guard, bandKHz, frameMs, users [{id, active, bit, code}]` and per scheme
`fdma | tdma | cdma: {capacity, served, refused, capacityLeft, overflow, perUser {bandwidthKHz, timeShare, share},
usedShare, idleShare, guardShare, freeShare}`, plus `fdma.channels, fdma.guards, fdma.wouldBeKHz`, `tdma.slots,
tdma.guards`, `cdma.rows [{id, code, d, chips}], cdma.sumChips, cdma.decoded [{code, holders, senders, products, corr,
sign, collision, bit}], cdma.collided, cdma.reused`. Bad params fall back to the defaults; `idle` beyond `users` is
ignored.

## Params

`scheme` FDMA / TDMA / CDMA (default FDMA); `users` 1–5 (4); `idle` none or user 1–5 (none); `guard` toggle (on);
`band` 100 / 12.5 kHz (100); `bits` 0–31 (13), a mask: user k's bit is bit k − 1 (13 → users 1–5 send 1, 0, 1, 1, 0),
flipped by clicking a user's label in the CDMA panel.

## Presets and expected numbers

| Preset | Params | Expected |
|---|---|---|
| `fdma-4` | FDMA, 4 users | channels 0–23.125, 25.625–48.75, 51.25–74.375, 76.875–100 kHz; capacity 6, 2 left; used 92.5 %, guard 7.5 % |
| `fdma-idle` | FDMA, 4 users, user 2 silent | 23.125 kHz unused: 23.1 % of the band (1 of 4 channels) |
| `tdma-dmr` | TDMA, 2 users, 12.5 kHz | slots 0–27.5 and 30–57.5 ms (30 ms each with the guard); 12.5 kHz × 45.8 % of the time |
| `cdma-2` | CDMA, 2 users, bits 1, 0 | air (0, 2, 0, 2); receiver 1: +1 → 1; receiver 2: −1 → 0; codes + + − − and + − − +: 0, nobody |
| `cdma-overflow` | CDMA, 5 users, bits 1, 0, 1, 1, 0 | user 5 reuses code 1; served 3 of 5; air (1, 1, −3, 1); receiver 1: 0, collision; receivers 2–4: 0, 1, 1. With user 5's bit flipped to 1: receiver 1 reads +2, still a collision |

## Out of scope

OFDMA (`qam-ofdm`), random access (ALOHA, CSMA: `packet-aprs`, `csma-ca-rts-cts`), near–far power control, real GSM or
UMTS parameters, codes longer than 4 chips.
