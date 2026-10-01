# tcp-states: TCP state machine

| | |
|---|---|
| Task | `tcp-states` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-tcp-states` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/tcp-states/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `tcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `tcp-retransmit` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the states a socket passes through, live**.

The student: drive both ends, watch states.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/tcp-retransmit/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch13-*.svg`
- Catalogue seed: URM ch13
- URM ch13, sections "TCP: uspostava veze i trostruko rukovanje", "TCP: zatvaranje veze" (half close), and
  "Primjer 3: trostruko rukovanje s pravim brojevima" (X=4000, Y=9500); diagram `ch13-trostruko-rukovanje.svg`
- URM ch15 "Tri ishoda jednog TCP SYN paketa" (CLOSED answers RST)
- RFC 9293 (TCP), §3.3.2 Figure 5 (state diagram), §3.4.2 (MSL = 2 min), §3.5 Figure 8 (simultaneous open),
  §3.5.2 (reset generation), §3.6 and Figure 13 (closing, simultaneous close), §3.10.7.4 (FIN processing)
- Linux `tcp(7)` man page, `tcp_fin_timeout`; TIME_WAIT length 60 s is `TCP_TIMEWAIT_LEN` in the kernel source (check)

## Overlaps (catalogue §5)

- **§5.8 TCP:** Separate pages, one shared sequence-chart view and one TCP model. Teardown is a second mode of the ported handshake page. The state machine is the union of the others; build it last or not at all.

## Model and presets

- **Scene:** two lanes, A (klijent) and B (poslužitelj), on the K1 message sequence chart. Above each lane a
  state box with the current RFC 9293 state name; beside the chart a compact state diagram (the 11 states of
  RFC 9293 Figure 5) with the current state of A and of B marked (A = circle, B = square) and the transition
  just taken drawn thick. Segments are arrows labelled with flags, `seq`, `ack` (and `len` when > 0).
- **State:** `{ a: {state, sndNxt, rcvNxt, finSent, finAcked}, b: {…}, inFlight: [{from, flags, seq, ack, len,
  lost}], chart: [{from, to, label, lost}], log: [eventCode], t }` (t in abstract ticks; TIME-WAIT counts ticks).
- **One step:** take the next event of the preset's script, in this order of phases: (1) if the event is a
  user call (`OPEN-passive`, `OPEN-active`, `SEND n`, `CLOSE`) apply it to that end and queue the segment it
  produces; (2) if the event is a delivery, deliver the oldest in-flight segment (or drop it if marked lost)
  and apply the receiver's rule, queueing any reply; (3) if the event is `timeout`, 2×MSL has passed and
  every end in TIME-WAIT closes. At most one end changes state per step, except the `both CLOSE` event of
  preset 4 and a `timeout` with both ends in TIME-WAIT; the caption names who changed.
- **Rules** (all from RFC 9293 §3.3.2 Figure 5 and §3.10 "Event Processing", unless marked):
  1. CLOSED + passive OPEN → LISTEN (no segment).
  2. CLOSED + active OPEN → send SYN seq=ISN → SYN-SENT.
  3. LISTEN + rcv SYN → send SYN+ACK seq=ISN', ack=SEG.SEQ+1 → SYN-RECEIVED.
  4. SYN-SENT + rcv SYN+ACK (acceptable ack) → send ACK → ESTABLISHED.
  5. SYN-SENT + rcv SYN (no ACK: simultaneous open) → send SYN+ACK → SYN-RECEIVED (§3.5, Figure 8).
  6. SYN-RECEIVED + rcv ACK of our SYN → ESTABLISHED.
  7. ESTABLISHED + CLOSE → send FIN → FIN-WAIT-1. ESTABLISHED + rcv FIN → send ACK → CLOSE-WAIT.
  8. FIN-WAIT-1 + rcv ACK of our FIN → FIN-WAIT-2. FIN-WAIT-1 + rcv FIN (our FIN not yet acked) → send ACK →
     CLOSING. **Tie-break:** FIN-WAIT-1 + rcv FIN that also acks our FIN (FIN+ACK in one segment) → send ACK →
     TIME-WAIT directly (§3.10.7.4, FIN bit processing, FIN-WAIT-1 case).
  9. FIN-WAIT-2 + rcv FIN → send ACK → TIME-WAIT. CLOSING + rcv ACK of FIN → TIME-WAIT.
  10. CLOSE-WAIT + CLOSE → send FIN → LAST-ACK. LAST-ACK + rcv ACK of FIN → CLOSED.
  11. TIME-WAIT → CLOSED after 2×MSL; MSL is 2 minutes in RFC 9293 §3.4.2, so 4 min; Linux uses 60 s (check).
      The model shows this as one `timeout` step and the caption gives both numbers.
  12. SYN and FIN each consume one sequence number; ack = next expected octet (book ch13 "TCP: uspostava veze",
      Primjer 3).
  13. A segment to a CLOSED end (no socket) is answered with RST; any synchronized state + rcv valid RST →
      CLOSED (RFC 9293 §3.5.2). A lost segment changes nothing at the receiver; the sender's state stays.
  14. Edge: a user call illegal in the current state (e.g. SEND in LISTEN-only, CLOSE in CLOSED) is rejected
      with a caption and no state change ("error: connection does not exist", RFC 9293 §3.10.4).
- **Params:** `closer` choice `A`/`B`/`both` (default `A`); `combineFinAck` toggle (B's ACK and FIN in one
  segment, default off; on: A goes FIN-WAIT-1 → TIME-WAIT by the rule 8 tie-break, one step fewer); `halfCloseData` range 0–3 segments of 100 B B sends after A's FIN (default 0);
  `isnA` / `isnB` fixed 4000 / 9500 (from the host model).
- **Presets:**
  1. `book-open-close` — Primjer 3 numbers (X=4000, Y=9500): B LISTEN; A SYN seq=4000; B SYN+ACK seq=9500
     ack=4001; A ACK ack=9501 (both ESTABLISHED); A CLOSE: FIN seq=4001 ack=9501 (FIN-WAIT-1); B ACK
     ack=4002 (A FIN-WAIT-2, B CLOSE-WAIT); B FIN seq=9501 (LAST-ACK); A ACK ack=9502 (A TIME-WAIT, B
     CLOSED); A CLOSED after timer. Handshake numbers from ch13 Primjer 3; close numbers derived, unchecked.
  2. `server-closes` — same, B closes first: B is the one in TIME-WAIT, A passes CLOSE-WAIT/LAST-ACK.
     Derived. Shows TIME-WAIT belongs to whoever closes first, not to the client.
  3. `half-close` — A closes, B still sends 2×100 B (seq 9501, 9601; A acks 9601, 9701) in CLOSE-WAIT, then
     FIN seq=9701, A acks 9702. Half close from ch13 "TCP: zatvaranje veze", Šire o temi; numbers derived.
  4. `simultaneous-close` — both CLOSE in the same step: both FIN-WAIT-1 → CLOSING → TIME-WAIT. RFC 9293
     §3.6, Figure 13.
  5. `closed-port` — A SYN to a B with no LISTEN: B answers RST+ACK seq=0 ack=4001; A SYN-SENT → CLOSED.
     RFC 9293 §3.5.2; links to `syn-outcomes`.
- **Steps:** 1 → 12; 2 → 12; 3 → 18; 4 → 11; 5 → 3.
- **Legend:** A (circle), B (square), segment arrow (solid), lost segment (dashed, ✕), state just entered
  (`.sd-changed` on the state box and the diagram edge). "Changed" marks the end whose state changed in this
  step and the transition taken.
- **Captions:** hr: "Korak 6: A poziva CLOSE i šalje FIN seq=4001. A prelazi u FIN-WAIT-1: više ne šalje,
  ali i dalje prima." en: "Step 6: A calls CLOSE and sends FIN seq=4001. A moves to FIN-WAIT-1: it sends no
  more, but still receives."; hr: "Korak 10: A je potvrdio B-ov FIN i čeka u TIME-WAIT (2×MSL) da zakašnjeli
  segmenti nestanu iz mreže." en: "Step 10: A acknowledged B's FIN and waits in TIME-WAIT (2×MSL) for late
  segments to die out."
- **Terms:** connection state — stanje veze; three-way handshake — trostruko rukovanje; sequence number —
  redni broj; acknowledgment number — broj potvrde; flag — zastavica; half-closed connection — poluzatvorena
  veza; socket — *socket*; listen — osluškivati.
- **Misconceptions:** (1) closing is the handshake in reverse (it is two independent one-way FINs, ch13);
  (2) TIME-WAIT is a stuck or leaked socket, and only on the server; (3) the state is a property of the
  connection, not of each end (the two ends are in different states most of the time).
- **Out of scope:** retransmission timers and RTO (→ `tcp-retransmit`), data flow and windows, keepalive,
  RST attacks, SYN cookies, the CLOSED→SYN-SENT `SEND` path from LISTEN.
- **Builds on:** reuses `tcp-retransmit`'s segment and sequence-number model (seq/ack arithmetic, in-flight
  list, loss flag) and its K1 chart rendering; new here are the per-end state machine, the user-call events
  and the state diagram. If `tcp-handshake` / `tcp-teardown` land first, their seq/ack values must match.
- **Note for the coordinator:** catalogue §5.8 says the state machine is the union of the TCP pages; preset 1
  repeats `tcp-handshake` + `tcp-teardown`. Build it last (as §5.8 says) and keep presets 2, 4 and 5, which no
  other page shows.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `tcp-states` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh tcp-states sims/tcp-states` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/tcp-states/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
