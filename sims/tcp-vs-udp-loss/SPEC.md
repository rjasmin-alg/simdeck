<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-vs-udp-loss: specification

One concept: **the same stream: TCP retransmits and stalls, UDP drops and continues**. The student sets the loss
and plays both side by side. Task: `docs/tasks/w3/tcp-vs-udp-loss.md`; catalogue `net-tcp-vs-udp-loss` (§4.1).
Model: `sim.js`; tests: `sim.test.js`.

## Scene

Two panels side by side, each with the same sender → receiver pair and the same loss pattern: left **TCP** (kit view
K1: segments, ACKs, resends), right **UDP** (datagrams only, nothing goes back). Under each chart a **delivery strip**,
one cell per unit in the order the application receives it (both protocols hand units over in sequence order here:
UDP because a constant delay never reorders, TCP by rule 5), and a summary row: units and bytes the application got,
the finish slot and the longest wait in TCP's buffer.

## Model (explorer)

`simulate(params) → { tcp: { sends, acks, delivered, finish, maxStall, retx, capped }, udp: { sends, delivered,
missing, finish }, end }`. `initial(params)` returns the same (the kit's explorer state). Every send is
`{ unit, seq, slot, arrive, lost, tx }` (`tx` 0 = the first send, 1 = the first resend …), every ACK
`{ n, next, slot, arrive, dup, of }`, every delivery `{ unit, slot, arrived }`. `end` is the later finish. The params
never change with `t`: the page draws the result up to slot `t`.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | Units 1 … N of `size` bytes. Unit k is first sent in slot k by both protocols (same stream, same pace). Unit k carries octets 1000 + (k − 1) · size … | task; URM ch13 Primjer 4 (500 B at 1000, 1500, 2000) |
| 2 | One-way delay is one slot: a unit sent in slot s arrives in slot s + 1 unless lost. An ACK sent on arrival (slot s + 1) reaches the sender in slot s + 2. | task (derived simplification) |
| 3 | Loss is decided per transmission. `pattern`: the first send of every unit in `lose` and, for units also in `lose2`, their first resend. `random`: every send, data and resend alike, is lost with probability `loss` %, from `Simdeck.rng`: first sends draw from `rng(seed)`, one draw per unit in unit order (so TCP and UDP lose the same first sends), resends from `rng(seed + 1000)` in the order they are sent. ACKs are never lost. | task (stated simplification) |
| 4 | UDP: a lost datagram is gone; nothing goes back; the receiver hands every arriving datagram to the application at once, in arrival order. UDP finishes in slot N + 1 (when the last datagram arrives or would have arrived). | URM ch13 "UDP: transport bez obećanja"; RFC 768 |
| 5 | TCP: the receiver answers every arriving segment with one ACK carrying the next octet it expects (cumulative). After a gap the ACK repeats (1500, then 1500 again). TCP hands data to the application only in order: units after a gap wait in the receive buffer and go up together when the gap is filled. | URM ch13 Primjer 4; RFC 9293 §3.4, §3.10.7.4 |
| 6 | TCP resends the **oldest unacknowledged unit** when its RTO has run out: `rto` slots after its last send, doubled for every resend (RFC 6298 §5.5), at most 32 slots (`RTO_MAX`, RFC 6298 §2.5 allows a maximum). Only that unit is resent (RFC 6298 §5.4); a later unit's timer waits until it is the oldest, and if its time has passed by then it is resent in that slot. No fast retransmit (that is `tcp-retransmit`). | task; RFC 6298 §5.4–5.5; URM ch13 Primjer 4 uses only the RTO |
| 7 | The window holds all N units (no flow or congestion control): new units keep going out while a resend is pending. | task |
| 8 | A unit is "late" when the application gets it after slot k + 1; its **stall** is delivery slot − arrival slot (the time it waited in the buffer). `maxStall` is the largest stall. TCP finishes in the slot it delivers its last unit. | task |

### Order within one slot (tie-breaks, tested first)

1. ACKs sent in the slot before reach the sender (the oldest unacknowledged unit moves on).
2. Data sent in the slot before reaches the receiver, **in sequence order**. A unit that arrives in the same slot as
   the missing unit it waited for is delivered in that slot, after it, in sequence order. Each arrival gets its own ACK,
   in the same order. Duplicate arrivals would be ignored (none happen: tested over every `random` combination; in `pattern` mode a resend is always the oldest missing unit, so it cannot be a duplicate either).
3. The sender checks the RTO of the oldest unacknowledged unit: an ACK that arrives in the slot the RTO runs out wins
   (step 1 comes first), so with `rto` 2 nothing is resent needlessly.
4. The sender sends the next new unit. A resend and a new unit can leave in the same slot (resend first).

## Params

| Key | Control | Values | Default |
|---|---|---|---|
| `mode` | choice | `pattern` / `random` | `pattern` |
| `n` | range | 3 – 30 units | 3 |
| `size` | choice | 100 / 500 / 1000 B | 500 |
| `loss` | range (`random` only) | 0 – 40 % | 10 |
| `seed` | range (`random` only) | 1 – 9 | 1 |
| `rto` | range | 2 – 8 slots | 4 |
| `t` | range, the time cursor | 0 – `end` | the end |
| `lose`, `lose2` | none (clicking a unit cycles it: arrives → lost → lost with its first resend → arrives) | bit masks, bit k − 1 = unit k | 2 (unit 2), 0 |

Clicking a unit in `random` mode switches to `pattern` with the drawn losses of first sends and first resends carried
over (`masks`), then cycles that unit.

## Presets (numbers checked with a script before the page, and in `sim.test.js`)

| Id | Params | TCP | UDP | Source |
|---|---|---|---|---|
| `book-example` | N 3, 500 B, unit 2 lost | sends 1@1, 2@2 ✕, 3@3, 2@6 (resend); ACK 1500 reaches A in slot 3, 1500 again in 5, 2500 in 8; app: unit 1 in 2, units 2 and 3 in 7; 3/3, 1500 B, finish 7, longest stall 3 (unit 3) | units 1 in 2 and 3 in 4, unit 2 never; 2/3, 1000 B, finish 4 | URM ch13 Primjer 4 and `ch13-tcp-naspram-udp-gubitak.svg` (numbers); timing derived |
| `call-vs-file` | N 20, units 5 and 13 lost | unit 5 resent in 9, delivered in 10 with 6–9 (unit 6 stalls 3); unit 13 resent in 17, delivered in 18 with 14–17; 20/20, finish 21, stall 3, 2 resends | 18/20 by slot 21, gaps at 5 and 13 | URM ch13 Primjer 6 framing; derived |
| `retransmit-lost` | N 10, unit 4 and its first resend lost | resent in 8 (lost), again in 16 (RTO doubled to 8), arrives 17; units 5–10 wait (unit 5 stalls 11); 10/10, finish 17 | 9/10, finish 11 | derived |
| `no-loss` | N 10, nothing lost | 10/10 in slot 11, every unit on time | 10/10 in slot 11 | derived: without loss TCP is not slower here (handshake out of scope) |
| `random-20` | random, loss 20 %, seed 3, N 20 | first sends lost: 2, 4, 8, 11, 12; resends: 2@6, 4@8, 8@12, 11@15, 12@17, none lost; 20/20, finish 21, longest stall 4, 5 resends | 15/20 (missing 2, 4, 8, 11, 12), 7500 B, finish 21 | the fixed generator (test fixture) |

Over every `random` combination (seed 1–9 × loss 0–40 × N 3–30 × rto 2–8, 72 324 runs) no unit reaches `MAX_TX`
(12 sends) and no duplicate arrives; the longest run ends in slot 341 (seed 2, 40 %, N 30, rto 8). As a safety stop
the run ends at slot 2000 whatever happens (`MAX_SLOT`; `capped` is then true).

## View

- **Chart (K1)** per protocol, lanes sender and receiver. Rows in time order: per slot, the ACKs sent in it, then the
  resend, then the new unit. A row appears when its message is sent (slot ≤ t): grey with "on its way" while in
  flight, ✕ half way once it would have arrived and is lost, a dashed line for a resend (the word "resend" boxed in the time column, as `tcp-retransmit`; the task's ↻ glyph is not used), a thin
  line for an ACK ("again" in the time column when it repeats). `fit()` drops the oldest rows.
- **Strip:** cell k is unit k. At slot t: waiting (dashed, empty), lost and still owed by TCP (dashed ✕), held in TCP's
  buffer (hatched), delivered (solid; late cells carry +d, the slots after k + 1; the summary's longest wait counts units still held at t), never (UDP: dashed ✕, struck).
  Clicking a cell cycles its loss.
- **Changed:** when a param other than `t` moves, the cells whose fate changed (delivered or not, and in which slot) get
  the kit's changed mark.
- **Caption:** at the end, the book's two sentences for the first loss (TCP: the ACK stays at …, the segment is sent
  again, the one after it already arrived but goes up with it in slot …; UDP: the datagram vanishes and nobody finds
  out, the application gets x of y bytes with no stall), or, without loss, that both finish together. Before the end,
  what happens in slot t on each side.
- **Play:** a button (key P) moves `t` from 0 (or from where it is) to the end, one slot per tick; the tick is shorter
  for long runs so a run plays in about 20 s.

## Out of scope

Fast retransmit and SACK (`tcp-retransmit`), windows and congestion control (`tcp-window`, `tcp-congestion`), the
handshake's cost, RTT estimation, application-level FEC or concealment, QUIC.
