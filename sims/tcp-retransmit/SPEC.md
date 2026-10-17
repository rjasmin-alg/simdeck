<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-retransmit: specification

One concept: **RTO, duplicate ACKs, fast retransmit**. The student drops chosen segments or ACKs and steps the
exchange. Task: `docs/tasks/w2/tcp-retransmit.md`; catalogue `net-tcp-retransmit` (§4.1). Model: `sim.js`; tests:
`sim.test.js`.

## Scene

Two hosts on a path with a fixed one-way delay of RTT / 2 (RTT 100 or 300 ms). Sender A has a few segments of data
for receiver B and may send them all at once (the window is not the subject: flow and congestion control are out of
scope). The data, by the `flow` param:

| `flow` | Segments | First byte | Last byte | Source |
|---|---|---|---|---|
| `rto` | 3 × 500 B: 1000, 1500, 2000 | 1000 | 2499 | URM `13-transportni-sloj.md` Primjer 4 |
| `fast` | 5 × 375 B: 4125, 4500, 4875, 5250, 5625 | 4125 | 5999 | URM `15-analiza-prometa.md` Primjer 5 (375 B derived: 4125 + 375 = 4500, 5625 + 375 = 6000) |
| `five` | 5 × 500 B: 1000 … 3000 | 1000 | 3499 | task preset `ack-lost` |

A sends the window at the start, one segment every 10 ms (the segments leave one after the other on the link), so with
RTT 100 ms the segments leave at 0, 10, 20 … ms and arrive at 50, 60, 70 … ms.

## State

`{ n, t, d, flow, ev, done, msgs, notes, rows, timers, segs, sndUna, sndNxt, dupCount, rto, rtoDeadline, recover,
rcvNxt, ooo, discarded, acksSent }`. Times in ms, integers. The task's `segs` and `acks` are one list, `msgs` (every
message in the order sent: `{ id, k: 'seg' | 'ack', seq, len | n, tx, why, sentAt, at, fate, re, dup, sample }`);
its `events` is `ev` (the event of this step) plus `rows`, the chart's rows (messages and timer notes) in time order.
`segs` is A's own table (`tx`: transmissions, `acked`). `timers` are the bars of the retransmission timer over chart
rows.

## One step

Step 1: A sends its window (every segment), and the first send starts the timer. Every later step advances to the
**next event in time order**: a message arrives at its receiver, or a message would have arrived and is lost (its step
comes at the time it would have arrived; the chart draws the ✕ half way), or the retransmission timer expires. What a
host sends because of the event (B's ACK, A's retransmission) is sent in the same step, at the same instant, after the
event.

**Tie-breaks at one instant** (tested first): arrivals first, in the order they were sent; then the timer; then the
sends the event caused. So an ACK that arrives exactly when the timer is due stops or restarts it, and nothing is
resent. (The task: "any fixed order works; state it and test it".)

The run ends when everything is acknowledged and nothing is on the way. `steps(params)` counts the steps to that point,
at most 20; a run that would need more stops at 20 and says so in the caption (only combinations with the receiver's
buffer off and resends lost too, none of them a preset).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **The ACK number is the next byte B expects**, not the last byte received; ACKs are cumulative. B answers every segment at once (no delayed ACKs). | URM ch13 Primjer 4; RFC 9293 §3.4; RFC 5681 §4.2 (an out-of-order segment SHOULD get an immediate ACK) |
| 2 | **A segment after a gap does not move the ACK:** B repeats the same ACK number. B never says which segment is missing. | URM ch13 Primjer 4, ch15 "ponovni prijenosi i duple potvrde" |
| 3 | **B keeps out-of-order data** (`bufferOoo`, default on; the book: implementation-specific). When the gap is filled the ACK jumps over everything held (ACK 4500 → 6000). Off: B discards whatever arrives after a gap and acks only what is in order. Data B already has is not taken twice; B repeats its ACK. | URM ch15 Primjer 5; ch13 Primjer 4 ("čuva ga ili odbacuje — pitanje je pojedine implementacije"); RFC 9293 §3.10.7.4 |
| 4 | **Duplicate ACK and fast retransmit:** an ACK equal to snd.una while data is outstanding is a duplicate; a new ACK clears the count. On the **third** duplicate A resends the segment that starts at the repeated number at once, without waiting for the timer, and only once (a fourth duplicate resends nothing). Two are not enough. | RFC 5681 §2 (definition, simplified: no window or flags in this model), §3.2; URM ch15 "brzi ponovni prijenos" |
| 4b | **Partial ACK:** after a retransmission (fast or by the timer) A remembers how far it had sent (`recover`). An ACK that moves but stops short of that point shows that the segment at the new ACK number is missing too (A cannot tell what else B holds); A resends that segment at once. Happens with `bufferOoo` off or with two losses. After a timeout, real slow start would resend two segments after the first ACK (cwnd 1 → 2); this model resends one per partial ACK. | RFC 6582 §3.2 step 5 (NewReno, fast recovery); after a timeout the same visible result follows from resending from snd.una in slow start (RFC 5681 §3.1; cwnd out of scope) *(check: modelling choice)* |
| 5 | **Retransmission timer:** started by a send when it is not running; restarted with the current RTO by every ACK that acknowledges new data; stopped when everything is acknowledged. When it expires, A resends the **oldest** unacknowledged segment. The starting RTO is 1 s; the estimator (SRTT + max(G, 4·RTTVAR)) is not modelled. | RFC 6298 §2.1, §2.4, §5.1–5.4; RFC 9293 §3.8; URM ch13 |
| 6 | **Backoff:** each expiry doubles the RTO, up to 60 s, and the timer starts again with it. The RTO stays backed off (no new RTT sample, rule 8): a new ACK restarts the timer with the backed-off value. A timeout does not clear the duplicate counter (RFC 5681 counts duplicates between new ACKs; only a new ACK clears it), but while recovering no further fast retransmit fires. | RFC 6298 §5.5, §5.6, §2.5 |
| 7 | **A lost ACK is covered by a later one**: ACK 2500 acknowledges what the lost ACK 2000 did; nothing is resent. If the last ACK is lost, the timer resends the oldest segment, B already has it and repeats the ACK. | RFC 9293 §3.4 (cumulative) |
| 8 | **Karn:** no RTT sample from an ACK that acknowledges a segment sent more than once. Shown (the panel and the caption), the estimator is out of scope. Otherwise the sample is the time from the send of the segment that ends at the ACK number to the ACK's arrival. | RFC 6298 §3; URM ch13 footnote |

**Loss.** `lose` picks the victim: the K-th segment's first transmission (`s1` … `s5`) or B's K-th ACK (`a1` …
`a5`); with `loseRetx` = r, the victim segment's first r retransmissions are lost too. A choice that names no message
(segment 4 of three) loses nothing. **Applied from the next step:** the page pins the past when `lose` or `loseRetx`
changes at step n: `keep` lists the ids of the messages lost by step n and `from` = n; the new victim is lost only in
steps after n. Steps 0 … n stay exactly as they were (tested).

## Presets and expected numbers

RTT 100 ms, RTO 1 s. Checked with a script before the page, and in `sim.test.js`.

| Preset | Params | Steps | Result |
|---|---|---|---|
| 1 `book-rto` | defaults | 9 | 1000, 1500 (lost), 2000 at 0/10/20 ms. ACK 1500 at 100 ms (timer restarted: due 1100), ACK 1500 again at 120 ms (one duplicate: no fast retransmit). At **1100 ms** the timer expires: 1500 resent, RTO 2 s; it fills the gap, B jumps to **ACK 2500** (it held 2000–2499), at 1200 ms; Karn: no sample. The task's "t ≈ 1 s" is 1.1 s because ACK 1500 restarts the timer (rule 5) |
| 2 `book-fast` | `flow: fast` | 12 | ACKs **4500, 4500, 4500, 4500, 6000** (the book's). The third duplicate arrives at 140 ms: 4500 resent at once, far before the timer (due 1100 ms); **ACK 6000** at 240 ms |
| 3 `ack-lost` | `flow: five, lose: a2` | 11 | ACK 2000 lost; ACK 2500 arrives at 120 ms and covers it. No retransmission; everything acked at 140 ms |
| 4 `backoff` | `loseRetx: 2` | 13 | Timeouts at **1100, 3100, 7100 ms** (+2 s, +4 s), RTO 2 s, 4 s, 8 s; the third resend arrives; **ACK 2500** at 7200 ms |
| 5 `no-buffer` | `flow: fast, bufferOoo: false` | 18 | B discards 4875, 5250, 5625. Fast retransmit of 4500 at 140 ms → **ACK 4875**, a partial ACK → 4875 resent → ACK 5250 → 5250 resent → ACK 5625 → 5625 resent → **ACK 6000** at 540 ms. Go-back-N behaviour; derived, *(check)* |

With RTT 300 ms the same exchanges run slower (`book-fast`: fast retransmit at 340 ms, done at 640 ms).

## Out of scope

The congestion window's reaction to loss (`tcp-congestion`), SACK, the RTT estimator, TLP/RACK, delayed ACKs, the
receive window, connection setup and teardown.
