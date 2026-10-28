<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-handshake: specification of the closing modes (task tcp-teardown)

The handshake itself is an adopted page and has no spec (see `NOTES.md`). This file covers what task
`docs/tasks/w3/tcp-teardown.md` added: five presets that close the connection the handshake opened. One concept:
**FIN/ACK in both directions, half close, TIME-WAIT**. Catalogue `net-tcp-teardown` (§4.1, overlap §5.8). Model:
`sim.js` (`closing`, `receive`, `canSend`, `canReceive`, `stepsFor`); tests: `sim.test.js`, section "teardown".

## Scene

Two lanes, A (klijent) and B (poslužitelj), drawn with the kit's K1 chart (`kit/sequence.js`). Each lane card holds
the end's state (ESTABLISHED, FIN-WAIT-1, …; dashed once CLOSED), the next number it sends, the number it expects,
and whether it may still send and receive data. One chart row per segment, the receiver's new state at the tip
(`→ CLOSE-WAIT`); a note on the lane where 2×MSL ends TIME-WAIT; a TIME-WAIT timer beside each lane that enters it.
Under the chart, each end's numbers continue the handshake's octet lines: what came before the FIN (the SYN's number,
or the data octets), the number the FIN takes, and the one after it, which the FIN's ACK carries; "B čeka ▼" marks
the number the other end expects.

## Params

| Param | Values | Default | Note |
|---|---|---|---|
| `mode` | `open` (the handshake), `close`, `half`, `finack`, `simul` | `open` | set by the presets; no control of its own (panel space, see NOTES.md) |
| `closer` | `A`, `B` | `A` | the end that closes first; shown only for `close`, `half`, `finack` |
| `isn`, `x`, `y` | the host's | `own`, 4000, 9500 | every seq/ack of a close follows from them |

## State

`{ x, y, mode, closer, sent, ends: { A, B }, chart }`. An end: `{ state, sndNxt, rcvNxt, finSent, finSeq, timeWait }`
(`timeWait`: the step it entered TIME-WAIT). `chart`: one entry per step done, `{ step, timeout, closed, segs, after }`;
a segment is `{ from, to, flags, seq, ack, len }`; `after` is both states after the step. `closer` is null for
`simul`.

## Steps

Step 0: both ends ESTABLISHED, as at the end of the handshake: A sends from X+1 and expects Y+1, B the other way
round (task (d)). Each later step is either the segments of the mode's script (sent from the state before the step,
then all delivered in the same step, so two FINs can cross) or the timeout ("2×MSL passes", task (c)). The script per
mode (c = closer, o = the other end):

| Mode | Steps | Script |
|---|---|---|
| `close` | 5 | c FIN · o ACK · o FIN · c ACK · timeout |
| `half` | 7 | c FIN · o ACK · o data 200 · c ACK · o FIN · c ACK · timeout |
| `finack` | 4 | c FIN · o FIN+ACK · c ACK · timeout |
| `simul` | 3 | A FIN and B FIN · A ACK and B ACK · timeout |
| `open` | 3 | the handshake (unchanged) |

The page mounts `stepsFor(params)`; `sim.json` `steps` stays 3, the default's count (as `static-default-route`).

## Rules

A segment carries seq = the sender's `sndNxt` and ack = its `rcvNxt`.

1. **CLOSE sends a FIN** ("I have no more data to send"): ESTABLISHED → FIN-WAIT-1, CLOSE-WAIT → LAST-ACK. URM ch. 13
   "TCP: zatvaranje veze"; RFC 9293 §3.6.
2. **A FIN takes one sequence number**, so its ACK is FIN.seq + 1; a pure ACK takes none. RFC 9293 §3.4 (as the SYN in
   Primjer 3). `finSeq` = the FIN's number (after any data the end sent).
3. **Receiving** (RFC 9293 §3.10.7.4, in its order: the ACK field, then the text, then the FIN bit):
   - the ACK of the end's own FIN (ack = `sndNxt` after its FIN): FIN-WAIT-1 → FIN-WAIT-2, CLOSING → TIME-WAIT,
     LAST-ACK → CLOSED; any other ack changes no state;
   - data in order, while the end may receive (ESTABLISHED, FIN-WAIT-1, FIN-WAIT-2): `rcvNxt` += len;
   - the peer's FIN in order: `rcvNxt` + 1; ESTABLISHED → CLOSE-WAIT, FIN-WAIT-1 → CLOSING, FIN-WAIT-2 → TIME-WAIT.

   The state changes on receipt, in the step the segment arrives (the task's "one step"), not when the ACK leaves in
   the next step. RFC 9293 Figure 5.
4. **TIME-WAIT lasts 2 × MSL**; MSL = 2 min (RFC 9293 §3.4.2), so 4 min; many systems wait 60 s *(check: OS-specific,
   the page says "many systems", names none)*. The timeout step closes every end in TIME-WAIT. Only the end that
   closed first passes through TIME-WAIT, except in a simultaneous close.
5. **Tie-break, FIN+ACK:** the ACK is processed before the FIN, so a closer in FIN-WAIT-1 that gets the peer's FIN with
   the ACK of its own FIN goes to FIN-WAIT-2 and on to TIME-WAIT within the segment: FIN-WAIT-1 → TIME-WAIT as the
   page shows it, three segments instead of four. RFC 9293 §3.10.7.4.
6. **Tie-break, simultaneous close:** both FINs leave ESTABLISHED in the same step and cross; each arrives in
   FIN-WAIT-1 without the ACK of the receiver's FIN (its ack is the receiver's old `sndNxt`), so both go to CLOSING,
   then to TIME-WAIT on the ACKs; both pass TIME-WAIT. RFC 9293 §3.6, Figure 13.
7. **Half close:** after its FIN an end may still receive and acknowledge; the other end, in CLOSE-WAIT, may still
   send. RFC 9293 §3.6, §3.6.1; the book's file-upload story (ch. 13 "Šire o temi").

## Expected numbers (X = 4000, Y = 9500; checked with an independent script, then by the tests)

| Preset | Segments (from>to flags seq/ack) | States after each step (A, B) |
|---|---|---|
| `close-client` | A>B FIN 4001/9501 · B>A ACK 9501/4002 · B>A FIN 9501/4002 · A>B ACK 4002/9502 · timeout | FW1, CW · FW2, CW · TW, LA · TW, CLOSED · CLOSED, CLOSED |
| `close-server` | B>A FIN 9501/4001 · A>B ACK 4001/9502 · A>B FIN 4001/9502 · B>A ACK 9502/4002 · timeout | the same mirrored; B ends in TIME-WAIT |
| `half-close` | A>B FIN 4001/9501 · B>A ACK 9501/4002 · B>A data 9501/4002 len 200 · A>B ACK 4002/9701 · B>A FIN 9701/4002 · A>B ACK 4002/9702 · timeout | FW1, CW · FW2, CW · FW2, CW · FW2, CW · TW, LA · TW, CLOSED · CLOSED, CLOSED |
| `fin-ack-combined` | A>B FIN 4001/9501 · B>A FIN+ACK 9501/4002 · A>B ACK 4002/9502 · timeout | FW1, CW · TW, LA · TW, CLOSED · CLOSED, CLOSED |
| `simultaneous` | A>B FIN 4001/9501 and B>A FIN 9501/4001 · A>B ACK 4002/9502 and B>A ACK 9502/4002 · timeout | CLOSING, CLOSING · TW, TW · CLOSED, CLOSED |

Every number is derived from the book's Primjer 3 (X = 4000, Y = 9500), not taken from a source that states it.

## Out of scope

RST, a lost FIN and its retransmission (`tcp-retransmit`), the full state diagram (`tcp-states`), lingering and
TIME-WAIT reuse settings.
