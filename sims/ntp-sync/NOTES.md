<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ntp-sync: notes

New stepper (task `docs/tasks/w2/ntp-sync.md`, catalogue `inet-ntp-sync`, §4.2, wave 2b). Rules, tie-breaks and
expected numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart** (`kit/sequence.js`);
the slanted to-scale arrows, the calculation, the correction graph, the source table and the stratum chain are page
panels beside it.

## Decisions

- **Two drawings of one exchange.** K1 rows are horizontal, so they cannot show a one-way delay as a slope. The K1
  chart shows the protocol (who sends, which timestamps each message carries: the request T1, the reply T1 T2 T3, the
  timestamp each receiver takes, θ and the correction as notes on the client's lane, the true time in the time column);
  a page-drawn **"To scale"** panel next to it shows the same exchange on two vertical time axes, true time running down,
  with the arrows' drop equal to the delay (Shared requests). Labels there are HTML at 1:1; the SVG has no `viewBox`.
- **Clock faces** are in the K1 lane cards: a dial whose hand shows the fraction of the second, and the reading at the
  instant of the current event. At T2 the student sees the server read 0,130 while the client reads 0,030: the offset
  is visible, but only the simulation knows it, and the calculation panel says so ("true offset … only the simulation
  knows it").
- **Times in integer µs** in the model; the page shows seconds with three decimals and more only when a value needs
  them (e.g. 11 ms vs 10 ms gives an error of 0,0005 s). Croatian uses the decimal comma, as the task's caption does.
  Negative values in a formula are parenthesised: `(0,021 − 0,000) − ((−1,989) − (−1,990))`.
- **T1 = 0** on the client's clock, as the task's preset numbers have it, so a negative offset gives negative server
  readings (T2 = −1,990 s). Kept: any epoch would do, and these numbers are the task's.
- **Step 7, the next exchange,** comes 64 s after the correction (a typical poll interval; polling is out of scope), as
  one step: all four timestamps and the new θ. After a step with asymmetric delays the next θ is 0 while the clock is
  still off by the old error (the same asymmetry hides it); the caption says so (`capNextHidden`).
- **Slew rate 500 ppm** (0,5 ms/s), so 5 s takes 2 h 46 min 40 s and 64 s of slewing corrects 0,032 s. The rate is
  RFC 5905's frequency tolerance used as the slew limit; real daemons differ *(check)*.
- **Correction graph:** the client's clock minus true time over time; a step is a dotted vertical jump, a slew a ramp to
  the residual error, with the time it takes; step 7 adds a dot at +64 s. A backwards step is marked "the clock goes
  backwards!" in the correction panel and the caption explains the log consequence.
- **Stratum in exchange mode:** the server is stratum 1 with its own reference clock (GPS); the client is 16
  (unsynchronised) before its first update and becomes 1 + 1 = 2 at step 6; at a later update it is 2 throughout.
- **Chain mode** (preset 5) uses K1 with five lanes: the client and the book's four sources. Step 1 sends "a request to
  each" as one row to four receivers (it is four unicast requests; one row keeps the chart short) and draws the four
  replies, each carrying its stratum. Then the stratum-16 sources are dropped, the selection is marked `*`, and the
  client's stratum is computed. The table beside it is the book's source list without the tool's layout (mode and state
  columns, poll, reach): name, stratum, `±` error bound, `*`.
- **`down` param** (chain mode, made up): none / .71 / both stratum 1 / all report stratum 16, so a student sees the
  selection move to 161.53.78.72 (client 2), to the stratum-2 source (client 3), or to nothing (client 16, Primjer 4's
  "a list without `*`").
- **Selection order** is stratum, then the `±` bound, then the name: enough for the book's list and deterministic. The
  real algorithm uses root distance and more; out of scope (SPEC.md rule 5).
- **The book's offset** (0,000037158 s slow) is shown only in the book's case (`down` none); with other selections the
  chain step says the stratum and that a sub-second offset is slewed, without a made-up number.
- **Concepts, not tools.** No daemon or command name on the page: "a pool name in its configuration", "the client's
  sources". The 1 s / first 3 updates rule is the book's configuration, stated as a rule.
- **Panel fit:** processing and the update number share one row (page CSS on `data-key`, as `sims/fourier`), and the
  offset slider is labelled "True offset" (the calculation panel says server − client).
- **Related:** `dhcp-dora` (the same book chapter).

## Deviations from the task

- `trueOffset` range is −6000…+6000 ms (task: −2000…+2000), step 10 ms, so the `boot-step` and `late-slew` presets
  (5 s) sit on the slider.
- The `next` toggle (step 7) is a param: off in `symmetric` and `asymmetric` (6 steps), on in `boot-step` and
  `late-slew` (7 steps), as the task's step counts say. `sim.json` `steps` is 6 (the default preset).
- Param `mode` (exchange / chain) has no control; the presets set it.
- Chain-mode param `down` added (not in the task).
- K1 draws the exchange without slopes; the slopes are on the page's "To scale" panel (see Decisions, Shared requests).

## Sources

- UL `book/chapters/18-mrezne-usluge.md`, "Vrijeme na sustavu": NTP per RFC 5905, the tracking output (Reference ID
  161.53.78.71, Stratum 2, System time 0.000037158 seconds slow), definition *stratum*, the source list (two stratum-1
  sources, `161.53.78.71` selected, `gu.irb.hr` stratum 3 not selected, the `±` column), `pool`, "Kako se sat ispravlja"
  (`makestep 1.0 3`, definitions *postupno usklađivanje*, *usklađivanje skokom*), Primjer 4 (stratum below 16, at least one
  `*`). The book does not derive offset and delay.
- RFC 5905 §3 (strata), §7.3 (stratum 16), §8 (offset and delay, the error bound): from memory, no network in this
  session.
- chrony.conf(5) `makestep` ("larger than", "first … clock updates"), as quoted in the book.
- Numbers checked with a scratch script (exact fractions) over all presets before the model was written; the tests pin
  them.

## Unchecked *(check)*

- RFC 5905 §8's wording of the δ/2 bound (SPEC rule 2); the arithmetic is exact.
- `makestep`'s comparison is "larger than" (exactly 1,0 s is slewed) and its limit counts updates 1–3 as "the first 3"
  (SPEC rules 6, 7): from the book's quotation and memory of the documentation.
- 500 ppm as the slew rate (SPEC rule 6); a client of a stratum-15 source being 16 (RFC 5905 MAXSTRAT = 16).
- The selection tie-break by the `±` bound (SPEC rule 5) is a simplification of the real algorithm.
- Term *kašnjenje povratnog puta* (round-trip delay): the task marks it *(check)*.

## Term pairs (not in `kit/glossary.js`; written out in both tables until added)

| English | Croatian | Source |
|---|---|---|
| timestamp | vremenska oznaka | UL ch18 ("dobiva vremensku oznaku") |
| round-trip delay | kašnjenje povratnog puta | task *(check)* |

*offset* (pomak), *slew*, *step* and *time server* are in the glossary and used as `[[terms]]` in the explanation.
*stratum* is not translated (UL ch18 keeps the English word), so it is written in italics, not as a term.

## Shared requests

- **K1: slanted rows.** A row option that draws the arrow with a drop (e.g. `slope: 0..1`, the share of a row height
  the tip ends lower than the tail), so a page can show one-way delays to scale in the chart itself. ntp-sync draws a
  separate "To scale" panel instead; `tcp-retransmit` (RTT) and `win-time-hierarchy` would use the same.
- **Kit: hidden controls.** `visible: () => false` sets `[hidden]`, but `.sd-ctl`'s `display` wins; the page adds
  `.sd-panel [hidden] { display: none }` (as http-exchange, cert-chain and others do).
- **Model reuse:** `win-time-hierarchy` links here "for the protocol". The pure part of `sim.js` (`timestamps`,
  `offsetOf`, `delayOf`, `errorOf`, `decide`, `slewed`, `stratumAfter`, `select`) has no strings or DOM and can move to
  `models/` unchanged if that task wants it.

## Checks

- Tests: 24. Five tie-break tests first (exactly 1 s slewed, update 3 steps and 4 slews, θ = 0, the selection's name
  order, stratum 15 → 16), rules 1–6, the step order, the five presets' numbers, then the template's generic block over
  seven runs (both modes, negative offset, maximum asymmetry, all sources down).
- Fresh review (a separate agent, playbook §7.4): checked every rule and preset number by hand against SPEC.md, and
  ran 36 mutations of `sim.js`. 33 were caught. Of the 3 survivors, two are equivalent (stratum `>= 15` vs `>= 16` in
  `stratumAfter`; the `down === 'none'` guard on the book's offset) and one was an untested event flag (`ev.exact`,
  now tested). Fixed from it: `capStep` said "right at once" when unequal delays leave an error (new `capStepErr`);
  `capNextSlew` said "only … so far" for a slew that had already finished (new `capNextSlewDone`, flag `finished`,
  tested); `capReplies` said the reply carries the `±`, which is the client's own estimate (reworded).
- Gate (`npm run gate -- ntp-sync`) passes; screenshots reviewed: 1920×1080 light, dark and grayscale and 375×812 in both
  languages, plus my own of every preset at its key steps (T2, θ, correction, next exchange), a −2 s backwards step and
  chain mode with `down` both and all.

## Time

Start 12:29, done (gate, fresh review and its fixes) 12:50: about 21 minutes, one session.
