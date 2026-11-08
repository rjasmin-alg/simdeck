<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-states: specification

One concept: **the states a socket passes through, live**. Two ends, A (client) and B (server), each with its own
RFC 9293 state; the student steps a scenario (or drives both ends by hand) and watches each end's state change on a
sequence chart and on the state diagram of RFC 9293 Figure 5.

Task `docs/tasks/w3/tcp-states.md`, catalogue `net-tcp-states` (§4.1), overlaps §5.8 (one TCP model; the handshake and
teardown numbers must match `tcp-handshake`).

## State

```
{ t,                                   // step number (abstract ticks)
  ends: { A: End, B: End },
  inFlight: [segment id, …],           // FIFO: the oldest is delivered (or lost) first
  chart: [Row, …],                     // what the K1 chart draws, in the order things happened
  log: [event code, …],                // the events applied so far
  last: Last | null }                  // what the last step did (for the caption and the "changed" marks)
End  = { state, iss, sndNxt, rcvNxt, finSent, finAcked, finRcvd, passive, ackOwed, edge, edgeAt, twAt }
Row  = { kind: 'seg', id, from, to, flags, seq, ack, len, sent, done, lost, outcome } | { kind: 'note', lane, code, at }
```

`iss` is fixed: A 4000, B 9500 (URM ch. 13, Primjer 3: X = 4000, Y = 9500). `sndNxt` is the next sequence number the
end sends, `rcvNxt` the next it expects (`null` until it has seen the peer's SYN). `edge` is the transition taken last
(an id below) and `edgeAt` the step it was taken in, so the diagram can draw the transition of this step thick.

## Events (one per step)

Script codes: `A:listen`, `A:open`, `A:send`, `A:close` (and the same for B), `both:close`, `deliver`, `lose`,
`timeout`. A step applies exactly one event, in this order of phases (task "One step"):

1. **User call** (`listen` = passive OPEN, `open` = active OPEN, `send` = SEND 100 B, `close` = CLOSE): applied to that
   end; the segment it produces is appended to `inFlight`.
2. **Delivery**: the oldest in-flight segment reaches its receiver, which applies the receiving rules below and appends
   its reply (if any) to `inFlight`. **Lose**: the oldest in-flight segment is dropped; nothing changes at either end.
3. **Timeout**: 2×MSL has passed; every end in TIME-WAIT closes.

At most one end changes state per step, except `both:close` (preset 4) and a `timeout` with both ends in TIME-WAIT.

## Rules

Sources: RFC 9293 §3.3.2 Figure 5 (states and transitions) and §3.10 "Event Processing", unless marked.

| # | Rule | Edge id |
|---|---|---|
| 1 | CLOSED + passive OPEN → LISTEN, no segment. | `open-passive` |
| 2 | CLOSED + active OPEN → send SYN seq=ISS → SYN-SENT. `sndNxt` = ISS+1. | `open-active` |
| 3 | LISTEN + rcv SYN → send SYN+ACK seq=ISS', ack=SEG.SEQ+1 → SYN-RECEIVED (`passive` = true). | `listen-syn` |
| 4 | SYN-SENT + rcv SYN+ACK with ack = ISS+1 → send ACK seq=ISS+1 ack=SEG.SEQ+1 → ESTABLISHED. | `synsent-synack` |
| 5 | SYN-SENT + rcv SYN without ACK (simultaneous open, §3.5 Figure 8) → send SYN+ACK seq=ISS ack=SEG.SEQ+1 → SYN-RECEIVED. | `synsent-syn` |
| 6 | SYN-RECEIVED + rcv ACK of our SYN (ack = ISS+1) → ESTABLISHED, no reply. A SYN+ACK in SYN-RECEIVED (the crossed SYN+ACK of a simultaneous open) does the same, no reply (Figure 8, lines 6–7). | `synrcvd-ack` |
| 7 | ESTABLISHED + CLOSE → send FIN → FIN-WAIT-1. ESTABLISHED + rcv FIN → send ACK → CLOSE-WAIT. | `estab-close`, `estab-fin` |
| 8 | FIN-WAIT-1 + rcv ACK of our FIN → FIN-WAIT-2. FIN-WAIT-1 + rcv FIN that does not ack our FIN → send ACK → CLOSING. **Tie-break:** FIN-WAIT-1 + rcv FIN that also acks our FIN (FIN+ACK in one segment) → send ACK → TIME-WAIT directly (§3.10.7.4: the ACK field is processed before the FIN bit, so the end is in FIN-WAIT-2 when the FIN is processed; "FIN-WAIT-1 STATE: If our FIN has been ACKed …, then enter TIME-WAIT"). | `fw1-ack`, `fw1-fin`, `fw1-finack` |
| 9 | FIN-WAIT-2 + rcv FIN → send ACK → TIME-WAIT. CLOSING + rcv ACK of our FIN → TIME-WAIT. | `fw2-fin`, `closing-ack` |
| 10 | CLOSE-WAIT + CLOSE → send FIN → LAST-ACK. LAST-ACK + rcv ACK of our FIN → CLOSED. | `cw-close`, `lastack-ack` |
| 11 | TIME-WAIT → CLOSED after 2×MSL. MSL is 2 minutes (§3.4.2), so 4 min; many systems wait 60 s (Linux `TCP_TIMEWAIT_LEN` = 60 s, checked in the 6.8 kernel headers; not named on the page). One `timeout` step; the caption gives both numbers. | `tw-timeout` |
| 12 | SYN and FIN each take one sequence number; data takes `len`; a pure ACK takes none. ack = the next expected octet (URM ch. 13 "TCP: uspostava veze", Primjer 3). | |
| 13 | A segment to a CLOSED end (no socket) is answered with RST, never an RST to an RST: with an ACK field, `<SEQ=SEG.ACK><CTL=RST>`; without, `<SEQ=0><ACK=SEG.SEQ+SEG.LEN><CTL=RST,ACK>`, where a SYN counts 1 (§3.5.2 group 1; URM ch. 15 "Tri ishoda jednog TCP SYN paketa"). SYN-SENT + rcv RST that acks our SYN → CLOSED (connection refused). SYN-RECEIVED + valid RST → LISTEN if opened passively (Figure 5, note 1), else CLOSED. Any synchronized state + valid RST (seq = `rcvNxt`) → CLOSED. A lost segment changes nothing at the receiver; the sender's state stays. | `synsent-rst`, `synrcvd-rst`, `rst` |
| 14 | A user call illegal in the current state is rejected: no state change, no segment, the caption says why (§3.10.1–3.10.4): OPEN in any state but CLOSED → "connection already exists" (*simplification:* the RFC lets an active OPEN in LISTEN switch to active and send a SYN; out of scope here, like the LISTEN → SYN-SENT `SEND` path); SEND or CLOSE in CLOSED → "connection does not exist"; SEND in LISTEN → rejected (the LISTEN → SYN-SENT `SEND` path is out of scope); SEND in SYN-SENT or SYN-RECEIVED → rejected, "not yet established" (the RFC queues the data; this model has no queue); SEND or CLOSE after the end's own CLOSE (FIN-WAIT-1/2, CLOSING, LAST-ACK, TIME-WAIT) → "connection closing". | |

**OPEN starts a fresh connection** (a new TCB): `sndNxt` = ISS, `rcvNxt` and the FIN flags are cleared, so an end can
open and close again after CLOSED.

Further RFC 9293 §3.10.4 CLOSE rules the free mode can reach: LISTEN + CLOSE → CLOSED and SYN-SENT + CLOSE → CLOSED,
no segment (`listen-close`, `synsent-close`); SYN-RECEIVED + CLOSE → send FIN → FIN-WAIT-1 (`synrcvd-close`).

**Receiving in a synchronized state** (ESTABLISHED and every closing state), in the order of §3.10.7.4:

1. RST: valid when seq = `rcvNxt` → CLOSED (rule 13).
2. Acceptability: a segment whose seq ≠ `rcvNxt` (a gap after a lost segment) is dropped without a reply.
   *Simplification:* the RFC answers it with an ACK; retransmission is `tcp-retransmit`'s concept.
3. ACK field: ack = `sndNxt` after our FIN (`finSent`, not yet `finAcked`) acks the FIN: FIN-WAIT-1 → FIN-WAIT-2,
   CLOSING → TIME-WAIT, LAST-ACK → CLOSED (rules 8–10).
4. Text: data in order while the end may still receive (ESTABLISHED, FIN-WAIT-1, FIN-WAIT-2): `rcvNxt` += len, an ACK
   is due.
5. FIN bit: `rcvNxt` += 1, `finRcvd`, an ACK is due; ESTABLISHED → CLOSE-WAIT, FIN-WAIT-1 → CLOSING, FIN-WAIT-2 →
   TIME-WAIT. If step 3 moved FIN-WAIT-1 to FIN-WAIT-2 in the same segment, the transition is reported as one edge,
   `fw1-finack` (the tie-break). If the end was SYN-RECEIVED (the handshake's ACK was lost and the FIN's ACK field acks
   our SYN), it passes through ESTABLISHED: the change is reported as `estab-fin` with `via: 'synrcvd-ack'`, and both
   arrows are drawn thick.
6. Reply: a pure ACK `seq=sndNxt ack=rcvNxt`, unless `combineFinAck` holds it back (below).

Every segment after the SYN carries the ACK field (`ack = rcvNxt` of the sender at the time it is sent).

**Labels** (as `tcp-handshake`): the page writes `FIN+ACK` only when the FIN's ACK field is the *first* to acknowledge
the peer's FIN (the ACK was held back, `combineFinAck`); otherwise `FIN`, with `ack=` among the fields (a FIN sent after
a separate ACK repeats that ack, as B's FIN in preset 1 does). Data is a "data" chip with `len`.

**combineFinAck** (script mode only): the end that receives the first FIN while ESTABLISHED does not reply at once;
its ACK is owed (`ackOwed`) and rides on its next segment (its data, or its FIN). Its FIN then acks the peer's FIN,
so the peer goes FIN-WAIT-1 → TIME-WAIT by the tie-break (rule 8). One segment, and one step, fewer.

## Params

| Param | Values | Default | Effect |
|---|---|---|---|
| `mode` | `script` / `drive` | `script` | a scenario built from the params below, or the student's own events |
| `listen` | toggle | on | B calls passive OPEN first; off = no socket on B (preset 5) |
| `closer` | `A` / `B` / `both` | `A` | who calls CLOSE first; `both` = both in one step (preset 4) |
| `combineFinAck` | toggle | off | the other end's ACK and FIN in one segment (not with `both`) |
| `halfCloseData` | 0–3 | 0 | 100 B segments the other end sends after the closer's FIN (not with `both`) |
| `script` | event codes, comma-separated | `''` | the events of `drive` mode (not a control: the page's buttons append to it) |

The ISNs are fixed at 4000 / 9500 (the host model's numbers; not params).

**Script** (`mode: 'script'`), with c the closer and o the other end:

- `listen` off: `A:open`, `deliver`, `deliver` (3 steps).
- open: `B:listen`, `A:open`, `deliver`, `deliver`, `deliver` (5 steps).
- `closer` c: `c:close`, `deliver` (o acks, or with `combineFinAck` holds the ACK); without `combineFinAck`
  `deliver` (the ACK); then `halfCloseData` × (`o:send`, `deliver`, `deliver`); then `o:close`, `deliver`, `deliver`,
  `timeout`.
- `closer` both: `both:close`, `deliver` × 4, `timeout`.

Steps: 5 + 3 + 3k + 4 = **12 + 3k** (k = `halfCloseData`), **11 + 3k** with `combineFinAck`, **11** with both, **3**
without `listen`. k = 3 gives 21 steps (about 20, COMMON.md §3; the default and every preset stay at 18 or fewer).

**Drive** (`mode: 'drive'`): the steps are the events in `script`, at most 30. The page's buttons append an event after
the current step (dropping any later ones) and step to it.

## Presets (expected numbers, checked by `sim.test.js` and by an independent arithmetic script, NOTES.md)

1. **`book-open-close`** (12 steps): 1 B LISTEN; 2 A SYN seq=4000 (SYN-SENT); 3 B gets it, SYN+ACK seq=9500 ack=4001
   (SYN-RECEIVED); 4 A gets it, ACK seq=4001 ack=9501 (ESTABLISHED); 5 B gets it (ESTABLISHED); 6 A CLOSE: FIN seq=4001
   ack=9501 (FIN-WAIT-1); 7 B gets it, ACK seq=9501 ack=4002 (CLOSE-WAIT); 8 A gets it (FIN-WAIT-2); 9 B CLOSE: FIN
   seq=9501 ack=4002 (LAST-ACK); 10 A gets it, ACK seq=4002 ack=9502 (TIME-WAIT); 11 B gets it (CLOSED); 12 timeout, A
   CLOSED. Handshake numbers from URM ch. 13 Primjer 3; close numbers derived (they match `tcp-handshake`'s
   `close-client`).
2. **`server-closes`** (12): the same with B closing: 6 B FIN seq=9501 ack=4001 (FIN-WAIT-1); 7 A ACK seq=4001 ack=9502
   (CLOSE-WAIT); 8 B FIN-WAIT-2; 9 A FIN seq=4001 ack=9502 (LAST-ACK); 10 B ACK seq=9502 ack=4002 (TIME-WAIT); 11 A
   CLOSED; 12 B CLOSED. Derived; TIME-WAIT is on B, the server.
3. **`half-close`** (18, `halfCloseData` 2): as preset 1 to step 8, then 9 B sends 100 B seq=9501; 10 A acks 9601; 11 B
   gets the ACK; 12 B sends 100 B seq=9601; 13 A acks 9701; 14 B gets it; 15 B FIN seq=9701 ack=4002 (LAST-ACK); 16 A
   ACK seq=4002 ack=9702 (TIME-WAIT); 17 B CLOSED; 18 timeout. URM ch. 13 "TCP: zatvaranje veze" (half close); numbers
   derived.
4. **`simultaneous-close`** (11, `closer` both): 6 both CLOSE: A FIN seq=4001 ack=9501, B FIN seq=9501 ack=4001 (both
   FIN-WAIT-1); 7 B gets A's FIN, ACK seq=9502 ack=4002 (B CLOSING); 8 A gets B's FIN, ACK seq=4002 ack=9502 (A
   CLOSING); 9 A gets B's ACK (A TIME-WAIT); 10 B gets A's ACK (B TIME-WAIT); 11 timeout, both CLOSED. RFC 9293 §3.6,
   Figure 13.
5. **`closed-port`** (3, `listen` off): 1 A SYN seq=4000 (SYN-SENT); 2 B (CLOSED, no socket) answers RST+ACK seq=0
   ack=4001; 3 A gets it → CLOSED. RFC 9293 §3.5.2; URM ch. 15; links to `syn-outcomes`.
6. **`drive`** (simdeck): `mode` drive, an empty script: the student drives both ends.

`combineFinAck` on preset 1 (11 steps): 6 A FIN seq=4001; 7 B gets it, CLOSE-WAIT, no reply; 8 B CLOSE: FIN+ACK
seq=9501 ack=4002 (LAST-ACK); 9 A gets it: FIN-WAIT-1 → TIME-WAIT (tie-break), ACK seq=4002 ack=9502; 10 B CLOSED;
11 timeout.

## Out of scope

Retransmission timers and RTO (`tcp-retransmit`), data flow and windows, keepalive, RST attacks, SYN cookies, the
LISTEN → SYN-SENT `SEND` path, queued data before ESTABLISHED, a user ABORT call.
