# tcp-retransmit: Loss and retransmission

| | |
|---|---|
| Task | `tcp-retransmit` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-tcp-retransmit` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/tcp-retransmit/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `tcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **RTO, duplicate ACKs, fast retransmit**.

The student: drop chosen segments, step the exchange.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md` (Uvod u računalne mreže): "TCP: pouzdanost, kontrola toka i kontrola zagušenja" (retransmission, dynamic RTO, Karn), Primjer 4 (izgubljeni segment u nizu: 1000/1500/2000, ACK 1500 twice, RTO)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/15-analiza-prometa.md`: "Veza je uspostavljena, ali nešto ipak nije u redu: ponovni prijenosi i duple potvrde" (three duplicate ACKs, fast retransmit), Primjer 5 (duple potvrde u snimci: ACK 4500 ×4, then 6000)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch13-tcp-naspram-udp-gubitak.svg` (lost segment under TCP and UDP)
- RFC 9293 §3.4, §3.8 (TCP), RFC 6298 (Computing TCP's Retransmission Timer: §2, §3 Karn, §5.5 backoff), RFC 5681 §3.2 (fast retransmit/fast recovery, duplicate ACK definition)
- Catalogue seed: URM ch13 → §5.8

## Overlaps (catalogue §5)

- **§5.8 TCP:** Separate pages, one shared sequence-chart view and one TCP model. Teardown is a second mode of the ported handshake page. The state machine is the union of the others; build it last or not at all.

## Model and presets

- **Scene:** K1 message sequence chart: lanes for sender A and receiver B, time running down. Data segments
  are arrows labelled `seq–end (len)`, ACKs are arrows labelled `ACK n`; a lost segment ends in ✕ halfway.
  Beside A: the send window (bytes sent, acked, outstanding), the RTO timer as a draining bar, and a
  duplicate-ACK counter (0–3). Beside B: the receive buffer with the byte ranges held and the gap.
- **State:** `{ t, segs: [{seq, len, sentAt, lost, retx}], acks: [{n, at, lost, dup}], sndUna, sndNxt,
  rcvNxt, ooo: [[from, to]], dupCount, rto, rtoDeadline, events: [] }`. Times in ms, integers.
- **One step:** advance to the next event in time order: a segment sent, a segment arrives (or is lost), an
  ACK sent, an ACK arrives, the RTO expires. Ties at the same instant: arrivals first, then timers, then
  sends (check: any fixed order works; state it in SPEC.md and test it).
- **Rules:**
  1. The ACK number is the next byte B expects, not the last byte received; it is cumulative (URM
     `13-transportni-sloj.md` Primjer 4; RFC 9293 §3.4).
  2. A segment that arrives after a gap does not move the ACK: B repeats the same ACK number (a duplicate
     ACK) (URM ch13 Primjer 4; `15-analiza-prometa.md` "ponovni prijenosi i duple potvrde").
  3. B keeps out-of-order data in its buffer (toggle; the book says this is implementation-specific); when
     the gap is filled, the ACK jumps over everything held (URM ch15 Primjer 5: ACK 4500 → 6000).
  4. **Fast retransmit:** on the **third** duplicate ACK, A resends the segment starting at the repeated
     number at once, without waiting for the RTO (RFC 5681 §3.2; URM ch15 "brzi ponovni prijenos"). Two
     duplicates are not enough (edge: preset 1).
  5. **RTO:** if the oldest outstanding segment is not acknowledged before the timer expires, A resends it
     (RFC 9293 §3.8; URM ch13). RTO is computed from measured RTT (RFC 6298 §2: SRTT + max(G, 4·RTTVAR),
     rounded up to 1 s); the page shows a fixed starting RTO of 1 s and does not model the estimator.
  6. Each timeout doubles the RTO (exponential backoff), up to a maximum (RFC 6298 §5.5).
  7. A cumulative ACK covers an earlier lost ACK: losing ACK 1500 changes nothing if ACK 2000 arrives
     (RFC 9293 §3.4).
  8. Karn: an RTT sample is not taken from a retransmitted segment (RFC 6298 §3; URM ch13 footnote) —
     shown as a note, the estimator is out of scope.
- **Params:** `lose` select of which segment (or ACK) to drop, applied from the next step (default per
  preset); `loseRetx` toggle (the retransmission is lost too); `bufferOoo` toggle (default on); `rtt` choice
  100 | 300 ms (default 100).
- **Presets** (RTT 100 ms, RTO 1 s):
  1. `book-rto` — URM ch13 Primjer 4: three 500 B segments at 1000, 1500, 2000; 1500 lost. ACKs: 1500,
     1500 (one duplicate only, so no fast retransmit). At t ≈ 1 s RTO expires, A resends 1500 → ACK 2500
     (B held 2000–2499). From URM ch13 Primjer 4 (ACK numbers); timing derived.
  2. `book-fast` — URM ch15 Primjer 5: 375 B segments 4125, 4500 (lost), 4875, 5250, 5625. ACKs 4500, then
     4500 ×3 duplicates → fast retransmit of 4500 well before the RTO → ACK 6000. From URM ch15 Primjer 5
     (ACKs 4500 ×4 then 6000; the 375 B size is derived so the numbers fit, check).
  3. `ack-lost` — five 500 B segments from 1000, ACK 2000 lost: ACK 2500 arrives next and covers it; no
     retransmission. Derived from rule 7.
  4. `backoff` — preset 1 with the retransmission lost too: timeouts at 1 s, then +2 s, then +4 s; ACK 2500
     after the third try. Derived from RFC 6298 §5.5 (ties to the repeated SYNs in URM ch15 "Tri ishoda").
  5. `no-buffer` — preset 2 with `bufferOoo` off: after the fast retransmit B acks only 4875, so 4875, 5250
     and 5625 must be resent too. Derived, unchecked (go-back-N behaviour; real TCPs buffer, cf. SACK).
- **Steps:** `book-rto` 12, `book-fast` 16, `ack-lost` 14 (or 10 with paired send/arrive), `backoff` 16,
  `no-buffer` 20. Paired "send + arrive" steps keep every preset ≤ 20.
- **Legend:** data segment (solid arrow), ACK (thin arrow), duplicate ACK (arrow with "dup n" badge), lost
  (✕), retransmission (dashed, "retx"); RTO bar; "changed" marks the newest arrow and the counter or timer
  it changed.
- **Captions:**
  - hr: "Stigla je treća *duplicate ACK* (dupla potvrda) 4500. A ne čeka istek roka (RTO): odmah ponovno
    šalje segment od 4500. To je brzi ponovni prijenos."
  - en: "The RTO for the segment at 1500 has expired with no ACK past 1500. A resends it and doubles the
    timer to 2 s."
- **Terms:** retransmission — ponovni prijenos; retransmission timeout (RTO) — rok za ponovni prijenos (RTO);
  duplicate ACK — dupla potvrda (URM ch15); fast retransmit — brzi ponovni prijenos; acknowledgment number —
  broj potvrde; sequence number — redni broj; segment — segment.
- **Misconceptions:** the receiver sends a message saying which segment was lost (it only stops the ACK,
  ch13 Primjer 4); the ACK number is the last byte received; every lost ACK causes a retransmission.
- **Out of scope:** the cwnd reaction to loss (`net-tcp-congestion`), SACK, the RTT estimator, TLP/RACK,
  connection setup and teardown.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh tcp-retransmit sims/tcp-retransmit` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/tcp-retransmit/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
