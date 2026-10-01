# tcp-teardown: TCP connection teardown

| | |
|---|---|
| Task | `tcp-teardown` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-tcp-teardown` in `docs/catalogue.md` §4.1 |
| Kind | **add a preset to `sims/tcp-handshake/`** (no page of its own) |
| Folder | `sims/tcp-handshake/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `tcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `tcp-handshake` merged; only one preset task per host folder at a time; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **FIN/ACK in both directions, half close, TIME_WAIT**.

The student: step a close from either side.

This is a **preset on `tcp-handshake`** (TCP three-way handshake), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/tcp-handshake/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md`, section "TCP: zatvaranje
  veze" (CLOSE sends FIN, simplex close, half-closed connection) and "Primjer 3: trostruko rukovanje s pravim
  brojevima" (X=4000, Y=9500, the numbers the presets continue). The book does not name the states or TIME-WAIT:
  those come from the RFC; mark them *(check)* only where a number is OS-specific.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/trostruko-rukovanje.html` (the host's original)
- RFC 9293 (TCP), §3.3.2 Figure 5, §3.4.2 (MSL), §3.6 and §3.6.1 (closing, half-closed), Figure 13
  (simultaneous close), §3.10.7.4 (FIN processing)
- Linux `tcp(7)` man page (`tcp_fin_timeout`); TIME_WAIT = 60 s (check)
- Catalogue seed: extends urm-tcp-handshake → §5.8

## Overlaps (catalogue §5)

- **§5.8 TCP:** Separate pages, one shared sequence-chart view and one TCP model. Teardown is a second mode of the ported handshake page. The state machine is the union of the others; build it last or not at all.

## Model and presets

This task adds presets to `sims/tcp-handshake/`; it does not make a page of its own.

- **Scene (the host's):** two lanes, A (klijent) and B (poslužitelj), with segment arrows between them on the
  K1 chart (or the host's own chart until K1 exists). New: a state label above each lane (ESTABLISHED,
  FIN-WAIT-1, …), because closing is about the two ends being in different states.
- **What the host model must support** (request in the host's `NOTES.md` if the adopted page can't):
  (a) a per-preset list of segments `{from, flags, seq, ack, len}` instead of the fixed three handshake steps;
  (b) a state label per end after each step; (c) a non-message step ("2×MSL passes") for TIME-WAIT;
  (d) the initial state "both ESTABLISHED" with `sndNxt` A=4001, B=9501 (the handshake's end state with
  X=4000, Y=9500). If the host keeps `KORACI_DEF` as a fixed array of three, (a) is the smallest change:
  make the step list a function of the preset.
- **State (added fields):** `{ a: {state, sndNxt, rcvNxt}, b: {…}, chart: [...] }`.
- **One step:** one segment is sent and delivered (send and receipt in the same step, as the host does), the
  receiver applies its rule, both state labels update; or the timeout step ends TIME-WAIT.
- **Rules:**
  1. CLOSE means "I have no more data to send"; it sends a FIN (book ch13 "TCP: zatvaranje veze"; RFC 9293
     §3.6).
  2. FIN consumes one sequence number, so its ACK is FIN.seq + 1 (RFC 9293 §3.4; same reason as SYN in
     Primjer 3).
  3. Closer: ESTABLISHED → FIN-WAIT-1 on CLOSE; → FIN-WAIT-2 on the ACK of its FIN; → TIME-WAIT on the
     peer's FIN (sends ACK). Other end: ESTABLISHED → CLOSE-WAIT on the FIN (sends ACK); may keep sending data
     (half close, RFC 9293 §3.6.1); → LAST-ACK on its own CLOSE; → CLOSED on the last ACK (RFC 9293 Figure 5).
  4. TIME-WAIT lasts 2×MSL; RFC 9293 §3.4.2 sets MSL to 2 min (so 4 min); Linux holds TIME_WAIT for 60 s
     (check). Only the end that closed first passes through TIME-WAIT.
  5. Tie-break: if the peer's ACK and FIN come in one segment (FIN+ACK), the closer goes FIN-WAIT-1 →
     TIME-WAIT directly (RFC 9293 §3.10.7.4); three segments instead of four.
  6. Simultaneous close: both in FIN-WAIT-1 receive a FIN → CLOSING → TIME-WAIT on the ACK; both pass
     TIME-WAIT (RFC 9293 §3.6, Figure 13).
- **Params (new):** `closer` choice `A`/`B` (default `A`); reuse the host's X/Y inputs (default 4000/9500) so
  every seq/ack follows from them (FIN seq = X+1 when no data was sent).
- **Presets (added to the host):**
  1. `close-client` — A closes: A→B FIN seq=4001 ack=9501 (A FIN-WAIT-1); B→A ACK seq=9501 ack=4002 (A
     FIN-WAIT-2, B CLOSE-WAIT); B→A FIN seq=9501 ack=4002 (B LAST-ACK); A→B ACK seq=4002 ack=9502 (A
     TIME-WAIT, B CLOSED); 2×MSL → A CLOSED. Continues the book's Primjer 3 numbers; derived, unchecked.
  2. `close-server` — B closes first with the same numbers mirrored: B FIN seq=9501, A ACK ack=9502, A FIN
     seq=4001, B ACK ack=4002; B ends in TIME-WAIT. Derived.
  3. `half-close` — the book's file-upload story (ch13 "TCP: zatvaranje veze", Šire o temi): A has sent its
     file and closes (FIN seq=4001); B acks 4002, then still sends a 200 B reply seq=9501 (A acks 9701), then
     FIN seq=9701, A acks 9702. Story from the book, numbers derived.
  4. `fin-ack-combined` — B answers A's FIN with one FIN+ACK seq=9501 ack=4002; A goes FIN-WAIT-1 →
     TIME-WAIT; 3 segments. RFC 9293 §3.10.7.4; derived.
  5. `simultaneous` — both send FIN in the same step (A seq=4001, B seq=9501): both CLOSING, then both TIME-WAIT on the ACKs (ack=4002, 9502). RFC 9293 Figure 13.
- **Steps:** 1 → 5 (4 segments + timeout); 2 → 5; 3 → 7; 4 → 4; 5 → 3 (the two FINs cross in one step, the two
  ACKs in the next, then the timeout).
- **Legend:** FIN (arrow with "FIN" tag), ACK, data (thicker arrow with `len`), state label; "changed" marks
  the end whose state changed and the newest arrow.
- **Captions:** hr: "Korak 1: A nema više podataka i šalje FIN seq=4001. A je u FIN-WAIT-1, a B još uvijek
  smije slati." en: "Step 1: A has no more data and sends FIN seq=4001. A is in FIN-WAIT-1; B may still
  send."; hr: "Korak 4: A potvrđuje B-ov FIN brojem 9502 i ulazi u TIME-WAIT; B je zatvoren." en: "Step 4: A
  acknowledges B's FIN with 9502 and enters TIME-WAIT; B is closed."
- **Terms:** connection teardown — zatvaranje veze; half-closed connection — poluzatvorena veza; flag —
  zastavica; acknowledgment number — broj potvrde; sequence number — redni broj; simplex — simpleksno
  (jednosmjerno).
- **Misconceptions:** (1) closing is the handshake run backwards (book ch13: "Zatvaranje, drugim riječima,
  nije otvaranje unatrag"); (2) after sending FIN a side can no longer receive; (3) TIME-WAIT is on the
  server / is a fault.
- **Out of scope:** RST abort, lost FIN and its retransmission (→ `tcp-retransmit`), the full state diagram
  (→ `tcp-states`), `SO_LINGER`, TIME-WAIT reuse settings.
- **Note for the coordinator:** presets 1, 2 and 5 are also presets 1, 2 and 4 of `tcp-states`; keep the
  seq/ack values identical across the two pages. The adopted handshake page is not kit-based; if `tcp-handshake`
  stays a fixed three-step page, this preset task becomes a shared request (a)–(d) above before it can start.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/tcp-handshake/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
