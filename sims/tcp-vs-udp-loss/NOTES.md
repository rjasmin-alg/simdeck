<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-vs-udp-loss: notes

New explorer (task `docs/tasks/w3/tcp-vs-udp-loss.md`, catalogue `net-tcp-vs-udp-loss`, §4.1, wave 3). Rules,
tie-breaks and expected numbers: `SPEC.md`. Each side's exchange is drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`); the delivery strips, summaries and the time bar are page parts under and above the charts.

## Decisions

- **Side by side, not top and bottom.** The task sketches TCP on top and UDP below. K1 runs time downwards, so two
  charts stacked would get about seven rows each at 1920×1080; side by side each gets the full height (the layout the
  K1 consumer sketch of t-0101 checked for `tls-handshake`). "Play both side by side" is the task's own wording.
- **Rows are not aligned across the two charts.** TCP has ACK and resend rows that UDP lacks; every row carries its
  slot in the time column, the strips are the lockstep comparison, and the rows of slot t are highlighted on both
  sides. `fit()` drops the oldest rows, so a long run shows the latest messages at the cursor.
- **The model is its own, not `tcp-retransmit`'s.** `models/` has no TCP model yet, and `tcp-retransmit` is an
  event-driven stepper in milliseconds with one RFC 6298 timer restarted on every ACK and fast retransmit. This task
  asks for slots, an RTO counted from each unit's own send (call-vs-file: unit 5 resent in slot 9 = 5 + 4, which a
  timer restarted by the ACK in slot 6 would put at 10) and no fast retransmit, so nothing could be shared without
  changing that model. Copied ideas, not code: cumulative ACK, hold after a gap, resend the oldest unacknowledged unit
  with back-off. See "Shared requests".
- **RTO rule (SPEC rule 6).** Only the oldest unacknowledged unit is resent (RFC 6298 §5.4), RTO slots after its last
  send; a unit whose time ran out while an earlier gap was open is resent in the slot it becomes the oldest. This
  reproduces every preset number in the task and never resends a unit that is only held behind a gap.
- **RTO cap of 32 slots** (RFC 6298 §2.5 allows a maximum). Without one, seed 2 at 40 % with N 30 and RTO 8 runs to
  slot 2165 (one unit lost eight times); with 32 the longest of all 72 324 random combinations ends in slot 341.
  Not in the task: *(check)* with the owner if a different cap reads better.
- **Loss pattern is clicked, not typed.** `pattern` mode keeps the lost units in two bit masks, `lose` (first send) and
  `lose2` (first resend too), as hidden range params so the URL keeps them. Clicking a cell on either strip cycles that
  unit: arrives → lost → lost with its first resend → arrives. In `random` mode a click carries the drawn first-send
  and first-resend losses over to `pattern` mode, then cycles. Hint on the strip: "click a unit to lose it".
- **Random draws:** first sends from `Simdeck.rng(seed)`, one draw per unit (so TCP and UDP lose exactly the same
  first sends), resends from `Simdeck.rng(seed + 1000)` in send order.
- **Time cursor and play on the stage.** The kit does not animate a range (checked: `play` exists only for steppers),
  so the stage has its own bar: Play / Pause (key P, a page key in `def.keys`), a slider and "slot t of end". The kit's
  `t` control is hidden (it still holds the value and the URL). The page slider is built once, so a drag is not cut
  short by the re-render. One slot per tick, 700 ms for short runs, faster for long ones (a run plays in about 20 s).
  Moving the cursor keeps the active preset (it is a view, not a setting). This also kept the panel within 1080 px.
- **t defaults to the end** (`L.END` = 999, clamped by the range's max = `simulate(p).end`). When another param moves
  while t is at the end, the page puts it at the new end, so the outcome stays on screen. The kit does not clamp the
  default before the first change, so the page draws min(t, end).
- **Captions:** at the end the task's two sentences, generalised (first lost unit; "the same happens n more times";
  UDP's count and bytes), on two lines; without loss "both finish in slot N + 1: TCP is not slower here"; at t = 0 the
  setup; in between what happens in slot t on each side, one event per side by priority (resend, gap filled, loss,
  held, repeated ACK, in order, done, waiting).
- **Strip states:** waiting (dashed grey), lost and owed by TCP (dashed ✕), held (hatched, receiver's colour border),
  delivered on time (c3 fill), delivered late (c4 fill and "+k", slots after k + 1), never (UDP: dashed ✕, struck).
  Summary at t: got x of N (bytes), done in slot (once reached), resends and longest wait (TCP), lost for good (UDP).
  c7 was the first choice for "late" but reads as the yellow "changed" mark in the dark theme.
- **UDP rows say "datagram k", not octet numbers:** a UDP datagram carries no sequence number (explanation says so).
- **Changed:** when a param other than t moves by hand, the cells whose delivery slot (or loss) changed get the kit's
  changed mark; moving t clears it. Presets do not mark.
- **Related:** `tcp-retransmit`, `tcp-handshake`, `tcp-window`.

## Deviations from the task

- Layout side by side (see Decisions), and the time cursor and play button are on the stage, not in the panel.
- `loss` and `seed` share one row in the panel (page CSS) so `random` mode fits 1080 px.
- RTO capped at 32 slots (not in the task).
- `random-20` numbers recorded from the generator: first sends lost 2, 4, 8, 11, 12; TCP 20/20, finish 21, 5 resends,
  longest wait 4; UDP 15/20, 7500 B, finish 21.

## Sources

- URM `book/chapters/13-transportni-sloj.md`: "UDP: transport bez obećanja", "TCP: pouzdanost, kontrola toka i
  kontrola zagušenja", "TCP naspram UDP-a: kako birati" ("„Brže je” nije dovoljno obrazloženje"), Primjer 4 (1000,
  1500, 2000; ACK 1500 twice; RTO) and figure `ch13-tcp-naspram-udp-gubitak.svg`, Primjer 6 (file vs live call).
  Terms from the same chapter.
- URM `meta/plan-interaktivne-stranice.md` §6, page "5 · TCP i UDP", card "TCP naspram UDP pri gubitku".
- RFC 768; RFC 9293 §3.4, §3.8, §3.10.7.4; RFC 6298 §2.5, §5.4, §5.5; RFC 8085 (cited by the book).
- Numbers checked with a scratch script over the five presets before the page was written; all matched the task.

## Unchecked *(check)*

- RFC section numbers are from the task and memory (no network in this session).
- The RTO cap of 32 slots and the "resend at once when it becomes the oldest" rule are this sim's choices.
- Croatian terms marked *(check)* below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| retransmission | ponovni prijenos | URM ch13 |
| retransmission timeout (RTO) | rok za ponovni prijenos (RTO) | URM ch13 |
| acknowledgment number | broj potvrde | URM ch13 |
| segment | segment | URM ch13 |
| datagram | datagram | URM ch13 |
| loss | gubitak | URM ch13 |
| in order | pravim redoslijedom | URM ch13 |
| head-of-line blocking | zastoj na čelu reda | simdeck *(check)* |
| receive buffer | međuspremnik (primatelja) | `tcp-retransmit` |
| slot (time step) | korak | task captions |

## Shared requests

- **kit: `.sd-ctl[hidden]`.** `.sd-ctl { display: flex }` beats the `hidden` attribute, so a param's `visible()` never
  hides it. Worked around in page CSS (`.sd-ctl[hidden] { display: none }`), as `amdahl`, `ipv6-slaac` and others do;
  one rule in `kit.css` would fix every page.
- **kit: animate a range param.** An explorer with a time cursor needs play / pause on a range (this page and any
  "time cursor" explorer); the kit's play is stepper-only. Here the page draws its own bar.
- **kit: clamp defaults on mount.** A range default above a param-dependent max (here `t` = 999) is shown as 999 until
  the first change.
- **Glossary:** the term pairs above, `"src": "simdeck"`, once the owner confirms the *(check)* one.
- **models/:** catalogue §5.8 plans one TCP model. `simulate` here is pure and string-free; a shared slot-based TCP
  model (cumulative ACK, hold after a gap, RTO with back-off and cap) could be promoted from it if a later sim wants
  the same slots. It does not fit `tcp-retransmit`'s millisecond event model without changing that one.

## Checks

- Tests: 31 (four tie-breaks first, rules 1–8 with the held flag, the defaults, the five presets' numbers, every random combination ends with all TCP
  units delivered and no duplicate, longest run 341, the click cycle, the random→pattern carry-over, the strip states,
  the generic block).
- Mutation pass (scripted, on `sim.js`, restored after): 25 mutations — arrival order, ACK before the timer,
  `deadline <= s`, no new sends, delays of data and ACKs, octet numbering (start and step), `lose2` for every resend,
  one random stream, random draws not per unit, UDP finish and delivery slot, TCP delivering out of order, no
  cumulative jump, no doubling, no cap, resending every expired unit, the repeated-ACK flag, stall from the send, finish
  from the last ACK, the click cycle, the strip's held and never states. 24 fail a test; the survivor (`lose2` without
  the `lose` check) is equivalent: a unit whose first send arrives is never resent. The first run found a mutant (no
  new sends) that looped forever: the model now stops at slot 2000 whatever happens (`MAX_SLOT`).
- Gate screenshots reviewed: light, dark, grayscale, phone, both languages; plus my own at slots 0, 3, 4, 6 of
  `book-example`, `retransmit-lost` at 12, `random-20` at 13, a 40 % run at slot 150, a click, play and pause. Fixed on
  the way: controls hidden by `visible()` still shown (kit), delivered cells not filled (my `background` shorthand beat
  `.sd-fill` / `.sd-hatch`), the panel 1323 then 958 px tall, the Croatian subtitle wrapping under a wide legend,
  "999 of 7" before the first change, late cells looking like "changed" in dark, the phone stage collapsing to zero
  height, the "changed" marks lost by the follow-up render that keeps t at the end.

- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md (rules 1–8, the tie-breaks, every
  preset number, the RTO rule, termination: correct), ran its own mutations on a copy, drove the page headlessly. Fixed
  from it: the "held" caption said the ACK stays when a resend had just moved it (a resend that arrives is now named
  first; the held caption takes its own ACK); the TCP summary said "no stall" while units sat in the buffer (the
  longest wait now counts held units at t); "changed" marks showed on the UDP strip when only TCP changed (marks per
  protocol); "the timeout doubles to 32" when the cap cut it (now "is now 32 (the maximum)", and the first resend
  names its doubling too); Croatian forms at 21 ("Gube se jedinice … 21", "Segmenti … već su stigli", "dobiva 21
  jedinicu"; the no-loss caption no longer counts); the held legend swatch is hatched like the cells; the explanation
  now says the timer is per segment here and that the ACK just stops moving. Tests added for the `held` flag and the
  defaults (incl. `t` at the end). Left as they are: the cursor stops at the later finish, so TCP's last ACK is drawn
  "on its way"; `lose` bits above N stay and come back when N grows (a lecturer going 20 → 10 → 20 gets the same
  pattern back); equivalent mutants (removing the arrival sort: sends are already in order; swapping the RTO check
  with data arrival: the receiver cannot move the sender's oldest unit in the same slot); the page logic has no unit
  tests (it is checked by the gate's browser run and the scripted states above).

## Time

Start 13:23 (after reading the task and the kit), done 14:10 (gate, mutation pass, fresh review and its fixes): about 50 minutes, one session.
