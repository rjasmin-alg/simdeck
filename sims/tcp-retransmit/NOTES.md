<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-retransmit: notes

New stepper (task `docs/tasks/w2/tcp-retransmit.md`, catalogue `net-tcp-retransmit`, §4.1, wave 2b). Rules,
tie-breaks and expected numbers: `SPEC.md`. The exchange is drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`), as the task asks; the send window, timer, duplicate counter and receive buffer are page panels
beside it (the layout the K1 consumer sketch of t-0101 planned for this sim).

## Decisions

- **Layout.** Three columns: A's panel (its segments with their state and how often each was sent, the oldest
  unacknowledged byte; the timer with a draining bar and the RTO before → after a timeout; the duplicate-ACK counter
  with three boxes, the third double-bordered because it triggers; the latest RTT sample or "none (Karn)"), the K1 chart
  (lanes A and B, the timer bars on A's lifeline), B's panel (each segment's state: in order, kept after a gap, gap,
  discarded, not arrived; the ACK number it sends). Meaning is never colour alone: marks ✓ / ✕ / hatched / dashed and
  words in every row.
- **Steps.** Step 1 sends the whole window (one segment every 10 ms); every later step is one event in time order: an
  arrival, a loss (at the time it would have arrived) or the timer. What the event makes a host send is sent in the same
  step (B's ACK, A's fast or timed resend). This keeps every preset in time order and within 20 steps.
- **In flight.** A message that has not arrived yet is drawn grey (`muted`) with "on its way"; a doomed message looks the
  same until its step (nobody knows yet). Lost: ✕ half way and "lost".
- **Timer bars.** One bar per run of the timer: from the send that started it or the ACK row that restarted it, to the
  row before the next restart (double cap: stopped), to the "timer expired" note (✕), or to the ACK that acknowledged
  everything. A restart is drawn at the ACK's row (the arrow reaches A there).
- **Loss changed mid-run applies from the next step.** The kit replays from step 0 on any param change, which would
  rewrite the past. The page listens (`simdeck.on`): when `lose` or `loseRetx` changes at step n by hand, it sets two
  params without a control, `keep` (ids of the messages lost by step n, from the old settings) and `from` = n, and
  stays at step n; the model loses the new victim only after `from`. Steps 0 … n are identical (tested). Data, buffer
  and RTT changes reset to step 0 and clear both. Like `brAt` in `win-wsus-flow`, `keep` and `from` are not in the URL:
  a copied link after a mid-run change replays with the new choice from step 0.
- **Partial ACK (SPEC rule 4b).** Needed for the `no-buffer` preset: something must make A resend 4875, 5250, 5625.
  NewReno's partial-ACK rule (RFC 6582) does it one segment per round trip, which shows the cost of a receiver that
  keeps nothing. After a timeout the same rule stands in for slow start resending from snd.una (cwnd out of scope).
- **RTO restart.** The timer restarts on every ACK that acknowledges new data (RFC 6298 §5.3), so in `book-rto` it
  expires at 1100 ms, not 1000 ms (the task: "t ≈ 1 s").
- **Preset entry** in `sim.json`: `book-fast` ("TCP: fast retransmit"), so a course can list fast retransmit alone.
- **Related:** `tcp-window`, `tcp-congestion`, `tcp-handshake`, `flow-control`.

## Deviations from the task

- **Step counts:** `book-rto` 9 (task 12), `book-fast` 12 (16), `ack-lost` 11 (14 or 10), `backoff` 13 (16),
  `no-buffer` 18 (20). Sends are not steps of their own except the first window (see Decisions); the task's numbers
  count them. `sim.json` `steps` is 9 (the default run); steps depend on the params.
- **`loseRetx` is a choice 0 | 1 | 2, not a toggle:** "the retransmission is lost too" with three timeouts in `backoff`
  needs the first **two** resends lost; a toggle that lost every resend would never end. `backoff` uses 2.
- **`lose` options are generic** ("segment #2", "B's ACK #2"; hr "2. segment", "2. potvrda (ACK)": the K-th segment A sends, B's K-th ACK); the kit's select has
  fixed options, so with three segments "segment 4" and "segment 5" lose nothing (the start caption says "Nothing is
  lost"; so do ACK victims beyond the count). A third param `flow` picks the data (3 × 500, 5 × 375, 5 × 500) the presets need.
- **Arrow labels** are `seq–end` only; the length `(len)` is in the start and window captions. A `len 500` field beside
  the chip collided with the "lost" word past the ✕ on the narrow two-lane chart.
- **Combinations beyond 20 steps** (buffer off with resends lost too, none a preset) stop at step 20; the last caption
  says the exchange goes on the same way.

## Sources

- URM `book/chapters/13-transportni-sloj.md` "TCP: pouzdanost, kontrola toka i kontrola zagušenja" and Primjer 4
  (1000/1500/2000, ACK 1500 twice, RTO); `15-analiza-prometa.md` "ponovni prijenosi i duple potvrde" and Primjer 5
  (ACK 4500 ×4, then 6000). Terms from the same chapters.
- RFC 9293 §3.4, §3.8; RFC 6298 §2, §3 (Karn), §5 (timer management, backoff); RFC 5681 §2 (duplicate ACK), §3.2;
  RFC 6582 §3.2 (partial ACK).
- Numbers checked with a scratch script over every preset at RTT 100 and 300 ms before the page was written.

## Unchecked *(check)*

- RFC section numbers are from memory (no network in this session); the URM chapters quote RFC 9293 §3.8 and §3.8.1.
- `no-buffer` and rule 4b are derived (task: "derived, unchecked").
- The 375-byte segments of `book-fast` are derived so that the book's ACK numbers fit (4125 + 375 = 4500, … 6000).
- Croatian terms marked *(check)* below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| retransmission | ponovni prijenos | URM ch13 |
| retransmission timeout (RTO) | rok za ponovni prijenos (RTO) | URM ch13 |
| duplicate ACK | dupla potvrda | URM ch15 (also "duplicirana potvrda") |
| fast retransmit | brzi ponovni prijenos | URM ch15 |
| acknowledgment number | broj potvrde | URM ch13 |
| sequence number | redni broj | URM ch13 |
| segment | segment | URM ch13 |
| round-trip time (RTT) | kružno vrijeme | URM ch13, `tcp-window` |
| partial ACK | djelomična potvrda | simdeck *(check)* |
| (timer) backoff, doubling | udvostručavanje roka | simdeck *(check)* |
| byte (in a sequence) | oktet | URM ch13 |

## Checks

- Tests: 31 (three tie-breaks and time order first, rules 1–8 with 4b, the mid-run loss change, the presets' numbers,
  RTT 300, every one of the 396 param combinations within 20 steps with non-overlapping timer bars, then the template's
  generic block). Mutation pass on a copy: 23 mutations (both tie-breaks, the ACK number, the duplicate, the jump, the
  buffer switch, threshold 2, re-firing, duplicates with nothing outstanding, the partial ACK, the timer restart, the
  resent segment, doubling, the cap, cumulative ACKs, Karn, `keep`, `from`, `loseRetx`, the counter reset, the timer
  stop, the send gap), plus the reviewer's five real survivors below: all 28 fail a test.
- Mid-run change checked in the browser: `book-fast` at step 4, lose → segment 4: steps 0–4 unchanged, both losses
  then recovered (one duplicate only, so the timer, then a partial ACK).
- Gate screenshots reviewed: light, dark, grayscale, phone, both languages. Fixed on the way: the settings panel 180 px
  too tall (shorter data labels, hints dropped; "applies from the next step" moved to the explanation), the length
  field colliding with "lost", 13.6 px text on the phone, the counter's outline covering the line under it.

- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and the RFCs (timer start, restart
  on new ACKs, no restart on fast retransmit, the third duplicate, `recover`, Karn, cumulative ACKs: correct), ran 30
  mutations on a copy (seven equivalent, six real survivors), drove the page headlessly. Fixed from it: the partial-ACK
  caption and SPEC 4b overclaimed ("what came after the gap did not stay at B" is false with two losses: now "the
  segment at n is missing too; A cannot tell what else B holds"); the gap-filled caption named the held ranges, not the
  bytes jumped over; English loss labels read as ACK numbers ("ACK 2" → "B's ACK #2"); the start caption announced a
  lost ACK that never exists; "sends ACK 1000 again" when segment 1 is lost (B never sent it before); the counter read
  "4 of 3" (now "3 of 3 +1"); "only n duplicates" repeated at every timeout (now at the first only); the explanation
  now says the standard recommends keeping out-of-order data; units come from the string tables; Croatian "za
  poslati" reworded. Tests added for rule 4b after a timeout, the backed-off RTO kept across new ACKs, the `from`
  boundary step, B acking a copy with the buffer off, the 60 s cap as a literal. Decided (SPEC rule 6): a timeout does
  not clear the duplicate counter.

## Shared requests

- **Glossary:** the term pairs above, `"src": "simdeck"`, once the owner confirms the *(check)* ones.
- **kit `select` with options per params** (or a `disabled` per option): `lose` could then offer only the segments and
  ACKs that exist in the chosen data. Not blocking.
- **K1: a "stopped and restarted in this row" timer mark.** A restart is drawn as the old bar ending one row early and
  a new one starting at the ACK row; one row that shows both would be exact.
- **models/:** catalogue §5.8 plans one TCP model. This model is pure and string-free (`sim.js`), ready to promote if
  `tcp-vs-udp-loss` or `tcp-states` want loss and retransmission.

## Time

Start 11:50, done (gate, mutation pass, fresh review and its fixes) 12:20: about 30 minutes, one session.
