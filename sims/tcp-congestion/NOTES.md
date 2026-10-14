<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-congestion: notes

New simulator (task `docs/tasks/w2/tcp-congestion.md`, catalogue `net-tcp-congestion`, §4.1). Rules, tie-breaks and
expected numbers with their sources: `SPEC.md`.

## Decisions

- **Explorer.** `initial(params)` computes both series for 61 rounds (0 … 60) and their summary; there are no steps.
  The task's optional "play" cursor sweep was left out.
- **Chart drawn in the page.** The task names the catalogue's "small live chart" view (§7.2), which the kit does not
  have yet. The chart is SVG drawn at 1:1 in CSS pixels (no `viewBox`, text ≥ 16 px), redrawn on resize, as `amdahl`
  does. See "Shared requests".
- **Two x scales:** rounds below the plot, seconds above it (they change with the RTT, so CUBIC's RTT independence
  shows in the seconds while Reno's teeth stay 21 rounds wide).
- **Loss model:** a round sends ⌊cwnd⌋ segments; a loss happens when that exceeds the capacity. CUBIC's window is
  real-valued, so 40.9 MSS is 40 segments and no loss, and at a loss **Wmax = ⌊cwnd⌋**, the whole segments (as
  implementations count). This makes the CUBIC sawtooth settle at 41 → 28.7 and climb back in ≈ K = 3.13 s (31 rounds
  at 100 ms, 16 at 200 ms): the task's numbers, on the chart as well as in the caption. Reno's integer window is not
  affected.
- **Too small for three duplicate ACKs:** a random loss with fewer than 4 segments in flight is a timeout (the lost
  segment needs three after it). Found in review: without it a "loss" at cwnd 1 grew the window to 2.
- **Random losses are per segment, on top of the capacity.** The task says "with probability p per round". With
  p ≤ 5 % per round a 60-round chart shows 0–3 losses, which does not give the preset's "irregular sawtooth, lower
  average cwnd". Here each segment is lost with p, so a round of w segments loses one or more with 1 − (1 − p)^w
  (bigger windows are likelier to lose, the usual model), and the bottleneck still drops at the capacity. One draw
  per round from `Simdeck.rng(seed)` (a copy of mulberry32, tested equal to the kit's); Reno and CUBIC see the same
  draw in the same round. Default seed 4, the preset's: seed 1 loses in round 1 at cwnd 2, a dull start.
- **Changed mark:** a series whose curve (cwnd, ssthresh, events per round) moved with the last param change gets a
  highlight halo under its line and a highlighted name in the summary, until the next change. It pops in once with
  motion, and is static under reduced motion. An RTT change alone does not mark Reno (its curve in rounds does not
  move), only CUBIC: the point of `long-rtt`.
- **Captions** pick the one thing the picture shows, in this order: the timeout param (both algorithms named when
  both are shown); random losses (how many were random and how many at full capacity, the average against the same
  params without them); Reno and CUBIC side by side; Reno reaching ssthresh in slow start without a loss; the last
  loss by duplicate ACKs (Reno or CUBIC wording); no loss. With the Reno-friendly region deciding CUBIC's climb, the
  CUBIC captions say so instead of quoting K.
- **Slow-start hatching** covers the rounds where any series shown is in slow start (after a timeout CUBIC's slow
  start runs one round longer than Reno's).
- **Summary under the chart:** per algorithm, losses (▼ duplicate ACKs, ✕ timeouts), the average cwnd, the last drop
  and the climb back to the window before it (Reno: rounds = seconds/RTT exactly; CUBIC: K seconds, ≈ rounds).
- **Panel:** presets and settings in two columns so the panel fits at 1920×1080 in every preset. The worst manual
  combination (both + random losses: the loss slider, the reseed button and the Reno-friendly toggle all shown) is
  ≈ 15 px taller than the panel and scrolls inside it; the gate's default state fits.
- **The "new losses" button** (`N`) is shown only with random losses. The kit draws action buttons without
  `visible()`, so the page hides it from a `sim.on()` listener; the seed itself is a hidden range param so the URL
  keeps it.
- **Terms (Croatian page):** the term rule as in `stp` (owner, 2026-10-06): English term with the Croatian in
  parentheses at the first mention in the legend and the explanation (*slow start* (spori početak), *timeout*
  (istek vremena), …), the English term alone in captions, chart labels and presets. None of these terms is in
  `kit/glossary.js` yet, so they are written out, not `[[term]]` (list below).

## Deviations from the task

- **Timeout preset numbers.** The task says "timeout at round 30 (cwnd 30): ssthresh 15, cwnd 1 → 1, 2, 4, 8, 15,
  16". By the task's own rules the sawtooth has cwnd **33** in round 30 (20 in round 17, +1 per RTT), so the page
  shows ssthresh 16 and 1, 2, 4, 8, 16, 17 … The param stays "round 30" as the task specifies. The "slow start capped
  at ssthresh" rule is still visible with initial window 10 (10, 20, 40, 64 instead of 80) and tested.
- **CUBIC after a timeout** follows RFC 9438 §4.8: ssthresh = β·cwnd (not ⌊cwnd/2⌋ as the task's rule 5 says "for
  any algorithm"), and the next congestion avoidance stage starts an epoch with K = 0 and Wmax = cwnd. Reno's timeout
  is the task's rule. With K = 0 a small CUBIC window grows very slowly at first (the convex region); that is the RFC.
- **Random losses per segment**, not per round (above).
- **Rounds per tooth:** the task says "each tooth 21 RTTs". The climb 20 → 41 is 21 RTTs (2.1 s) and the page shows
  that; the loss marks are 22 rounds apart (the loss round plus the climb). Written so in SPEC.md.
- **Reno-friendly region (rule 7), "check whether the page needs it at the default RTTs":** at 100 ms it changes only
  the top of a CUBIC tooth (W_est reaches 41 after ≈ 23 rounds = 2.3 s, before K = 3.13 s, so the tooth is ≈ 24
  rounds instead of ≈ 31); at 200 ms never; at 10–30 ms it decides the whole climb. Kept as an option, off by default,
  so presets 4 and 5 show the pure cubic the task's numbers describe.
- **Not built:** CUBIC fast convergence (§4.7) and the 1.5·cwnd per-RTT cap (§4.4); out of scope, listed in SPEC.md.
- **Legend:** all eight entries as the task lists them; in the header the legend wraps in its own box (two rows) so
  the tools stay on the first row.

## Sources

- RFC 5681 §3.1, §3.2; RFC 6582; RFC 9438 §4.2, §4.3, §4.6, §4.8, §5; RFC 6928. Every number on the page comes from
  these (the course book has no congestion window mechanics); checked in `sim.test.js`.
- `uvod-u-racunalne-mreze` book ch. 13 "TCP: pouzdanost, kontrola toka i kontrola zagušenja" (congestion control vs
  flow control, *vrijeme kruženja*, *izbjegavanje zagušenja*) and ch. 6 (congestion as delay rising near capacity).
- `napredna-linux-administracija/meta/toc.md` T44 (where the algorithm is chosen with `sysctl`); not shown on the
  page (concepts, not tools).

## Unchecked *(check)*

- Croatian terms that are not in the course books: prozor zagušenja, spori početak, prag sporog početka, aditivno
  povećanje / multiplikativno smanjenje, dupla potvrda, brzi oporavak, područje prijateljsko Renu.
- The task's "40 MSS capacity = BDP + buffer" is the page's abstraction; no queueing delay is modelled (ch. 6's
  rising delay is not drawn).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr | source |
|---|---|---|
| congestion control | kontrola zagušenja | URM ch. 13 |
| flow control | kontrola toka | URM ch. 13 (also in `flow-control`, `tcp-window`) |
| congestion window (cwnd) | prozor zagušenja | simdeck *(check)* |
| slow start | spori početak | simdeck *(check)* |
| congestion avoidance | izbjegavanje zagušenja | URM ch. 13 |
| slow-start threshold (ssthresh) | prag sporog početka | simdeck *(check)* |
| additive increase, multiplicative decrease (AIMD) | aditivno povećanje, multiplikativno smanjenje | simdeck *(check)* |
| round-trip time (RTT) | vrijeme kruženja | URM ch. 13 (ch. 6 and `tcp-window` say *kružno vrijeme*) |
| duplicate ACK | dupla potvrda | simdeck *(check)* |
| timeout (retransmission timeout) | istek vremena | ossimulator's glossary line for process states; URM ch. 13 says *rok za ponovni prijenos (RTO)* |
| fast recovery | brzi oporavak | simdeck *(check)* |
| Reno-friendly region | područje prijateljsko Renu | simdeck *(check)* |

## Shared requests

- **Kit view "small live chart"** (catalogue §7.2, ~15 consumers: TCP cwnd, queueing, tail latency, retry storm,
  error budget). This page's chart is a candidate pilot: line series with dash styles, a step series (ssthresh), a
  horizontal reference line with a label (capacity), event marks on a series (▼, ✕), shaded x-ranges with a label
  (phases), a second x scale on top, end-of-line labels pushed apart, a "changed" halo, and a narrow layout without
  the right-hand labels. All of it is in `drawChart` in `index.html`.
- **kit.js:** action buttons (`type: 'button'` params) ignore `visible()`; the page hides its reseed button itself.
  Smallest change: call `syncState` for buttons too (they have a wrapper-less button; give it the same sync).
- **kit.css:** `.sd-ctl { display: flex }` beats `[hidden]` (the same workaround as `amdahl` and nine other sims).

## Review (playbook §7.4)

A fresh reviewer read the diff against SPEC.md, recomputed presets 1–5 (all correct) and ran 25 mutations. Fixed from
the review: a float slip that put CUBIC back into slow start for a round after some losses (2850 of 10920
combinations); "three duplicate ACKs" on windows under 4 segments; CUBIC teeth on the chart shorter than the K the
caption quoted (Wmax now in whole segments); captions wrong with the Reno-friendly region on, or naming only Reno with
both shown; the random-loss caption counting capacity losses as random; "keeps CUBIC from growing slower than Reno"
(it is the Reno *estimate*, 0.53 MSS per RTT); the Reno estimate's α now switches to 1 at Wmax (§4.3); RFC numbers
removed from the page's explanation (Sources only). Tests added for the eight mutations that survived; a rerun of
33 mutations is caught by the tests, except two of the three redundant float guards removed one at a time (each of
the others still prevents the slip, which the tie test checks).

## Time

Start 2026-10-14 16:13, done 16:47 (about 35 minutes, one session): spec and model, page, gate, fresh review and its fixes.
