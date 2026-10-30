<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-versions: notes

New explorer (task `docs/tasks/w3/http-versions.md`, catalogue `inet-http-versions`, §4.2, wave 3). Rules, tie-breaks
and expected numbers: `SPEC.md`. No kit view fits a timeline (the task's "side-by-side compare" is a catalogue
pattern, not a kit view yet), so the page draws the three waterfalls in HTML and CSS.

## Decisions

- **Layout.** Three blocks on one time axis (ticks at whole round trips, thinned to fit; the end tick pushes out one
  that would collide with it). HTTP/1.1 has one lane per connection, each starting with its own TCP and TLS bars, so
  "every connection pays its own handshake" is visible; HTTP/2 and HTTP/3 have one lane per stream and one tall set-up
  bar spanning all lanes ("one handshake for every stream"). The done time is at the right of each block, with a
  heavy vertical line at that time in the block.
- **Lane height** comes from the stage height (between 0.9 and 2.6 rem), so 12 objects (30 lanes) still fit one screen
  at 1920×1080. A block is at least 4.6 rem tall (its done box). Object numbers hide when a lane is under 1.05 rem or
  a round trip under 1.6 rem wide; the TCP / TLS / QUIC and "waits" tags hide under 3 rem (the phone): the patterns
  and the legend still say what the bars are.
- **Patterns, not only colour:** set-up hatched (one direction) with its tag, objects solid with their number, waiting
  cross-hatched with "čeka" / "waits", the loss a ✕ in a circle at the moment the data would have arrived. Versions
  are told apart by position and label; their colours (c1–c3) only repeat that.
- **"Changed"** marks a small yellow tab with an ink border at the end of every bar whose end moved (or that is new)
  with the last param change, and outlines the done box with "prije … ms" / "was … ms". Nothing is marked on first
  load or after a language switch (the page reloads).
- **HTTP/1.1 dispatch is dynamic** (deviation): the next object goes to the connection that is free first, the lowest
  number on a tie. The task's preset 4 assumed static round robin (objects 1 and 7 on connection 1); with dynamic
  dispatch connection 1 carries 1 and 12. The page-done times are the task's in every preset (1250 / 1000 / 750 ms).
  Dynamic dispatch is how a browser's request queue behaves, and it gives the model a real tie-break.
- **`lostObject` is a range with `max` = `objects`** instead of the task's select: a select's options are fixed in the
  kit, and the range clamps itself when objects drop. It is disabled (with the reason "Uključi gubitak.") while loss
  is off.
- **Captions** (one per param set): no loss, HTTP/1.1 serial (some connection carries more than one request), loss
  (the task's text with the stream count as a plural form, plus one sentence on HTTP/3), loss with one object. The
  "instead of" time is the same params with loss off.
- **"HTTP/2 is always faster"**: in this model HTTP/2's page time is never later than HTTP/1.1's (that needs congestion
  control, out of scope). The explanation answers it per object: in preset 3 five of six objects arrive 100 ms later
  on HTTP/2 than on six HTTP/1.1 connections.
- **Sim.json entries:** `one-connection` (multiplexing) and `loss` (head-of-line blocking), the two lessons.
- **Related:** `http-exchange`, `tcp-vs-udp-loss`, `tls-handshake`, `tcp-handshake` (existing sims only).
- **Reuse from `http-exchange`:** nothing to reuse as code (its model is one exchange's messages; this one is timing).
  The explanation says methods, status codes and request and response are unchanged across versions.

## Deviations from the task

- Dynamic HTTP/1.1 dispatch (above); preset 4's per-object numbers differ, its page-done times do not.
- `lostObject` is a range, not a select (above).
- Terms: RTT is "kružno vrijeme" (URM ch06 "kružno (round-trip) vrijeme", and `tcp-retransmit`), not the task's
  "vrijeme obilaska (check)"; head-of-line blocking is "zastoj na čelu reda" as in `tcp-vs-udp-loss`, not the task's
  "blokiranje na čelu reda (check)". One term for one thing across the deck.
- Out of scope as the task says, plus the HTML document itself (all objects are wanted at once when the first
  connection is ready).

## Sources

- URM `book/chapters/14-aplikacijski-sloj.md` "HTTP i HTTPS" → "Šire o temi": HTTP/1.1 one request after another
  ("umjesto da svaki zahtjev čeka prethodni"), HTTP/2 same semantics and several concurrent exchanges on one
  connection (RFC 9113 quote in footnote rfc9113-http2), HTTP/3 same semantics over QUIC, QUIC on UDP builds its own
  reliability ("UDP je nepouzdan" is about UDP itself).
- URM `13-transportni-sloj.md` "TCP: uspostava veze i trostruko rukovanje" (handshake before data).
- URM `06-fizicki-sloj.md` (kružno (round-trip) vrijeme).
- RFC 9113 §1, §5; RFC 9114 §1; RFC 9000 §2.2, §7; RFC 9001 §4; RFC 8446 §2; RFC 9293 §3.5: from memory, no network
  in this session.
- Numbers: every preset computed with the model before the page was written, then pinned in `sim.test.js`.

## Unchecked *(check)*

- "A browser opens about 6 connections per host" (the hint says "up to 6"): common browser practice, not a standard.
- RFC 9113 §1's wording on TCP head-of-line blocking; all RFC section numbers above are from memory.
- TLS 1.3 over TCP as exactly 1 RTT after the TCP handshake (no TCP Fast Open, no 0-RTT): the model's assumption.
- The Croatian terms "zastoj na čelu reda" (simdeck, not in the books) and "tok" for stream (URM ch14 does not name
  streams; "tok" is the usual Croatian).

## Term pairs (missing from `kit/glossary.js`; written out in the explanation)

| English | Croatian | Source |
|---|---|---|
| multiplexing | multipleksiranje | `port-multiplexing` strings; task Terms |
| head-of-line blocking | zastoj na čelu reda | `tcp-vs-udp-loss` NOTES *(check)* |
| stream | tok | task Terms |
| round-trip time (RTT) | kružno vrijeme | URM ch06; `tcp-retransmit` NOTES |
| retransmission | ponovni prijenos | URM ch13; `tcp-retransmit` |
| connection | veza | URM ch13 |

`handshake` (rukovanje) and `request and response` (zahtjev i odgovor) are in the glossary and used as `[[terms]]`.

## Shared requests

- **Kit view: timeline / waterfall.** Lanes of bars on a shared time axis with patterns (set-up, solid, waiting), a
  marker on a bar, a done line and an end-moved mark. `delay-components` draws a similar bar by hand; a third
  consumer would justify a K-view.
- **Kit: legend wraps** onto two lines in Croatian at 1920×1080 (five entries); a legend that could move into the
  panel when long would keep the header to one line.

## Checks

- Tests: 22 (six tie-breaks first, rules 1–6, done time and RTT scaling, the presets' numbers, caption keys, axis ticks,
  the params' ranges and defaults, preset values the controls can show, then the template's generic block).
- Gate: pass (48 browser checks, tokens, scope). Screenshots reviewed: gate's light, dark, grayscale, help, panel
  hidden, 375×812 in both languages, plus my own of `loss` and `high-rtt` (hr), `one-connection` (en), 12 objects on
  one HTTP/1.1 connection with loss at RTT 300 (en), `loss` dark (en) and `high-rtt` on the phone. Fixed on the way: a
  one-lane block too short for its done box, "400 ms" breaking across caption lines, phone labels taking a block's full
  height, colliding end ticks, a clipped QUIC tag in narrow bars, the phone axis landing in the wrong grid column, the
  English title wrapping (shorter legend).

- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and the task (rules 1–6, tie-breaks 1–6
  and every preset number confirmed, preset 4 recomputed by hand), ran 51 mutants on a copy (43 killed; of the 8
  survivors, 4 equivalent or unreachable, 4 real: the tick collision threshold, the tick thinning off-by-one, the
  connection choices and the object limit, now pinned by two tick cases and a params test; all three re-run and
  failing), rendered every caption for objects 1–12 × 1/6 connections × loss on/off × first/last lost object in both
  languages (none false), and drove 10 param sets × hr/en × desktop/phone headless (no console errors, no scroll,
  out-of-range `lostObject` clamped). Fixed from it: RFC citation for TCP head-of-line blocking (RFC 9114 §1.1, not
  9113 §1), HTTP/1.1 pipelining named (allowed, browsers do not use it), "QUIC packet" instead of "segment" for QUIC,
  "both streams" for two objects, the legend's "end moved or new", Croatian "bilo … ms" (not "prije", which reads as
  "ago"), "Broj HTTP/1.1 veza", "Broj objekata", "gotova u" throughout, the clitic in the loss hint, "Kao primjer 1",
  the test file's run command. Kept: `capLoss` says nothing about HTTP/1.1 when it also runs serially (SPEC: one
  caption per param set); `<i>` for the written-out terms until the glossary has them.

## Time

Start 11:23, done (gate, fresh review and its fixes) 11:40: one session.
