# tcp-vs-udp-loss: TCP vs UDP under loss

| | |
|---|---|
| Task | `tcp-vs-udp-loss` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-tcp-vs-udp-loss` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/tcp-vs-udp-loss/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `tcp`, `udp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `tcp-retransmit` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the same stream: TCP retransmits and stalls, UDP drops and continues**.

The student: slider for loss, play both side by side.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/tcp-retransmit/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch13-*.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 (the planned card: URM card ch13-tcp-naspram-udp-gubitak)
- Catalogue seed: URM card ch13-tcp-naspram-udp-gubitak
- URM ch13 "Primjer 4: izgubljeni segment u nizu" (500 B segments at 1000/1500/2000, second lost, ACK 1500
  twice, RTO retransmission) and figure `ch13-tcp-naspram-udp-gubitak.svg`; "Primjer 6: prijenos datoteke
  naspram razgovora uživo"; sections "UDP: transport bez obećanja", "TCP: pouzdanost, kontrola toka i kontrola
  zagušenja", "TCP naspram UDP-a: kako birati"
- URM plan §6, page "5 · TCP i UDP", card "TCP naspram UDP pri gubitku"
- RFC 768 (UDP); RFC 9293 §3.8 (retransmission), §3.10.7.4 (in-order delivery to the user); RFC 6298 §5.5
  (RTO back-off); RFC 8085 (UDP usage guidelines, cited by the book)

## Overlaps (catalogue §5)

- **§5.8 TCP:** Separate pages, one shared sequence-chart view and one TCP model. Teardown is a second mode of the ported handshake page. The state machine is the union of the others; build it last or not at all.

## Model and presets

- **Scene:** side-by-side compare, two panels with the same sender → receiver pair and the same loss pattern:
  top "TCP" (K1 chart: segments, ACKs, retransmissions), bottom "UDP" (datagrams only, no arrows back). Under
  each panel a delivery strip: one cell per unit in the order the **application** receives it, coloured by
  the slot it was delivered (on time / late / never). A summary row per protocol: delivered units, bytes,
  finish slot, longest stall.
- **Model (explorer: params drive a pure function, no steps):** `simulate(params) → { tcp: {sends, acks,
  delivered: [{unit, slot}], finish, maxStall}, udp: {sends, delivered, finish, missing} }`. Time is in slots;
  the timeline is drawn whole and a time cursor (range param) reveals it up to slot t, so the lecturer can
  "play" it by dragging or with the kit's play button if the kit allows a range to animate (check).
- **Rules:**
  1. Units 1…N of `size` bytes each; unit k is first sent in slot k by both protocols (same stream, same
     pace). Sequence numbers start at 1000 so unit k carries octets 1000+(k−1)·size … (book ch13 Primjer 4:
     500 B units at 1000, 1500, 2000).
  2. One-way delay is 1 slot: a unit sent in slot s arrives in slot s+1 unless lost; an ACK sent on arrival
     reaches the sender in slot s+2 (derived simplification).
  3. Loss is decided per transmission: in `pattern` mode by the preset's list (first transmission of the
     listed units, and listed retransmissions); in `random` mode by a seeded PRNG with probability `loss`
     for every transmission, data and retransmission alike. ACKs are never lost (stated simplification).
  4. UDP: a lost datagram is gone; nothing goes back; the receiver hands every arriving datagram to the
     application at once, in arrival order (book ch13 "UDP: transport bez obećanja"; RFC 768).
  5. TCP: the receiver acks the next expected octet (cumulative ACK); after a gap the ACK repeats (ch13
     Primjer 4: 1500, then 1500 again). TCP hands data to the application only in order, so units after a gap
     wait in the receive buffer (RFC 9293 §3.10.7.4 / §3.8; book: "podaci stižu potpuni … i pravim
     redoslijedom").
  6. TCP retransmits a unit when its RTO expires: RTO slots after the transmission (param, default 4).
     Each further loss of the same unit doubles the RTO (RFC 6298 §5.5, back-off). No fast retransmit in this
     page (that is `tcp-retransmit`); the book's Primjer 4 also uses only the RTO.
  7. The TCP window is large enough for all N units (no flow or congestion control: out of scope); new units
     keep going out while a retransmission is pending.
  8. Tie-break: a unit that arrives in the same slot as the missing unit it was waiting for is delivered in
     that slot, after it, in sequence order. Duplicate arrivals (none here, ACKs are not lost) are ignored.
  9. Outcomes: UDP finishes at slot N+1 with N − (lost) units; TCP finishes when the last gap is filled
     (or at N+1 if nothing was lost) with all N units. Stall of a unit = delivery slot − arrival slot.
- **Params:** `mode` choice `pattern`/`random` (default `pattern`); `n` range 3–30 (default 3); `size` select
  100/500/1000 B (default 500); `loss` range 0–40 % (default 10, `random` only); `seed` range 1–9 (default 1,
  `random` only); `rto` range 2–8 slots (default 4); `t` range 0–(finish) time cursor (default end).
- **Presets** (values derived with rules 1–9; check with a script before coding):
  1. `book-example` — ch13 Primjer 4 and diagram `ch13-tcp-naspram-udp-gubitak.svg`: N=3, 500 B, unit 2
     (octets 1500–1999) lost. TCP: ACK 1500 (slot 3), ACK 1500 again (slot 5), retransmit 1500 in slot 6,
     arrives slot 7, ACK 2500 (slot 8); app gets unit 1 at 2, units 2 and 3 together at 7; 1500 B, finish 7.
     UDP: units 1 at 2 and 3 at 4, unit 2 never; 1000 B, finish 4. From the book (numbers), timing derived.
  2. `call-vs-file` — ch13 Primjer 6 framing: N=20, units 5 and 13 lost. UDP: 18/20 by slot 21, two gaps.
     TCP: 20/20 by slot 21; unit 5 resent slot 9, delivered 10 with units 6–9 (unit 6 stalls 3 slots); unit 13
     resent 17, delivered 18 with 14–17. Derived, unchecked.
  3. `retransmit-lost` — N=10, unit 4 and its first retransmission lost: resent in slot 8 (lost), again in
     slot 16 (RTO doubled to 8), arrives 17; units 5–10 wait; TCP finishes at 17 with 10/10, UDP at 11 with
     9/10. Derived.
  4. `no-loss` — N=10, nothing lost: both deliver 10/10 at slot 11, identical timelines: without loss TCP is
     not slower here (handshake out of scope). Derived.
  5. `random-20` — `random`, loss 20 %, seed 3, N=20: counts come from the fixed PRNG; record them in SPEC.md
     from the test fixture. Derived.
- **Steps:** none (explorer); the `t` cursor runs from 0 to the later finish slot (7, 21, 17, 11, …).
- **Legend:** data unit (filled box), lost (crossed, dashed outline), retransmission (box with ↻), ACK (thin
  arrow back, TCP only), held in buffer (hatched `.sd-hatch`), delivered to the app (solid on the strip).
  "Changed" marks what changed when a param moved: the units whose fate changed.
- **Captions:** hr: "TCP: broj potvrde zastaje na 1500, pa se segment 1500–1999 šalje ponovno. Segment
  2000–2499 već je stigao, ali aplikacija ga dobiva tek s njim, u koraku 7." en: "TCP: the acknowledgment
  stays at 1500, so segment 1500–1999 is sent again. Segment 2000–2499 has already arrived, but the
  application only gets it together with that one, in slot 7."; hr: "UDP: drugi datagram nestaje i nitko to
  ne doznaje; aplikacija dobiva 1000 od 1500 bajtova, bez zastoja." en: "UDP: the second datagram vanishes
  and nobody finds out; the application gets 1000 of 1500 bytes, with no stall."
- **Terms:** retransmission — ponovni prijenos; retransmission timeout (RTO) — rok za ponovni prijenos;
  acknowledgment number — broj potvrde; segment — segment; datagram — datagram; loss — gubitak; in order —
  pravim redoslijedom.
- **Misconceptions:** (1) UDP is "faster" (book ch13: "„Brže je" nije dovoljno obrazloženje"; with no loss
  the timelines are the same); (2) TCP loses nothing and costs nothing (the stall falls on the units after the
  loss, head-of-line blocking); (3) the receiver is told what was lost (it is not; the ACK just stops moving).
- **Out of scope:** fast retransmit and SACK (→ `tcp-retransmit`), windows and congestion control
  (→ `tcp-window`, `tcp-congestion`), handshake cost, application-level FEC or concealment, QUIC.
- **Builds on:** `tcp-retransmit`'s segment/ACK model (cumulative ACK, RTO with back-off, loss flags) and its
  K1 chart drawing; new are the UDP lane, the lockstep compare and the application delivery strip.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `tcp-vs-udp-loss` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh tcp-vs-udp-loss sims/tcp-vs-udp-loss` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/tcp-vs-udp-loss/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
