<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ntp-sync: spec

One concept: **four timestamps give offset and delay; stratum.** Task `docs/tasks/w2/ntp-sync.md`, catalogue
`inet-ntp-sync` (§4.2). The model is `sim.js`; each rule below has a test in `sim.test.js` (named by its rule
number). Times are integer microseconds in the model, so every number is exact; the page shows seconds.

## Scene

- **Exchange mode** (presets 1–4). Two parties, the client `demosrv1` and the server `161.53.78.71`, as kit view K1
  (`kit/sequence.js`) lanes. Each lane card has a clock face with that clock's reading at the instant of the current
  event; the server card says stratum 1 (its own reference clock, a GPS receiver), the client card its stratum (16
  before its first update, 2 after). Beside the chart, a page-drawn panel shows the same exchange **to scale**: two
  time axes, true time running down, and the request and the reply as slanted arrows whose drop is the one-way delay
  (K1 has no slanted rows: NOTES.md, Shared requests). The calculation panel fills in θ, δ, the error and its bound;
  the correction panel shows the rule, the decision and the clock as a jump (step) or a ramp (slew).
- **Chain mode** (preset 5). The client and the four sources of UL ch18's source list as K1 lanes; the source table
  (name, stratum, ± error bound, `*` for the selected one) and the stratum chain from the reference clock to the
  client.

The server's clock is taken as right. The client's clock reads `trueOffset` behind the server's
(`trueOffset = server − client`), and the client's reading at T1 is 0. Only the simulation knows `trueOffset`: the
page shows it as "true offset", next to the estimate.

## Rules

1. **Offset and delay** (RFC 5905 §8): θ = ((T2 − T1) + (T3 − T4)) / 2; δ = (T4 − T1) − (T3 − T2). T1 and T4 are
   read on the client's clock, T2 and T3 on the server's. With the true instants 0, dOut, dOut + proc and
   dOut + proc + dBack: T2 = T1 + trueOffset + dOut, T3 = T2 + proc, T4 = T1 + dOut + proc + dBack.
2. **Asymmetry** (RFC 5905 §8, wording *(check)*): the formula assumes the same delay both ways. Then
   θ = trueOffset + (dOut − dBack) / 2, so the estimate is wrong by (dOut − dBack) / 2, and since
   δ = dOut + dBack, the error is never more than δ / 2 in either direction. Equal delays give θ = trueOffset exactly.
3. **Processing time** (RFC 5905 §8): T3 − T2 is subtracted from δ, so δ = dOut + dBack whatever `proc` is, and θ
   does not depend on `proc` (it cancels in (T2 − T1) + (T3 − T4)).
4. **Stratum** (RFC 5905 §3, §7.3; UL ch18 "Vrijeme na sustavu", definition *stratum*): a server with its own
   reference clock is stratum 1; a machine synchronised to a stratum-n source becomes n + 1; 16 means unsynchronised.
   A client of a stratum-15 source would be 16, i.e. unsynchronised *(check: RFC 5905 MAXSTRAT = 16)*; a client with no
   usable source is 16. In exchange mode the client is 16 before its first update (`updateNo` = 1) and 2 after the
   correction; at a later update it is 2 throughout.
5. **Source selection** (UL ch18 source list; the full selection algorithm is out of scope): a stratum-16 source is
   not usable. Among the usable ones the client selects (`*`) the lowest stratum, then the smallest error bound (the
   list's `±` column), then the name (a total order, so the selection is deterministic). This reproduces the book:
   `161.53.78.71` (stratum 1, ±2581 µs) over `161.53.78.72` (stratum 1, ±4699 µs); `232.184.183.46…` (stratum 2) and
   `gu.irb.hr` (stratum 3) are not selected. The tie-break by error bound stands in for the real algorithm's
   distance and is a simplification *(check)*.
6. **Correction** (UL ch18 "Kako se sat ispravlja", definitions *postupno usklađivanje*, *usklađivanje skokom*;
   `makestep 1.0 3`, chrony.conf(5) as cited there): step when |θ| is larger than 1 s **and** this is one of the first
   3 updates (update 1, 2 or 3); otherwise slew. A step sets the clock at once and may move it backwards (θ < 0); a
   slew runs the clock faster or slower until the difference is gone, so its reading never goes backwards. The slew
   rate is 500 ppm, i.e. 0.5 ms per second *(check: RFC 5905's frequency limit, used here as the slew limit; the
   daemon's own limit differs)*. A slew of θ takes |θ| / 0.0005: 5 s takes 10 000 s (2 h 46 min 40 s).
7. **Tie-breaks.** |θ| = 1.000 s exactly is not "larger than" the threshold: slewed (chrony.conf(5) says "larger
   than" *(check)*). Update 3 is still one of the first three: it steps; update 4 slews. θ = 0 is a slew of nothing.

The next exchange (step 7) starts 64 s after the correction (a typical poll interval; polling is out of scope), on the
clock as the correction left it: after a step the remaining true offset is −error; after a slew it is
trueOffset − 0.032 s (64 s × 0.5 ms/s), with the same sign as θ.

## Params

| Param | Range | Default | Note |
|---|---|---|---|
| `trueOffset` | −6000…+6000 ms, step 10 | +100 | task: −2000…+2000; widened so the 5 s presets are on the slider (NOTES.md) |
| `dOut`, `dBack` | 1–100 ms | 10, 10 | one-way delays |
| `proc` | 0–10 ms | 1 | server processing |
| `updateNo` | 1–10 | 1 | which update this exchange is (rule 6) |
| `next` | toggle | off | step 7: the next exchange |
| `down` | none / one / both / all | none | chain mode: which sources report stratum 16 (made up; the book's list has none) |
| `mode` | exchange / chain | exchange | set by the presets, no control |

## Steps

Exchange mode, one timestamp or calculation per step: (1) client sends, T1 on its clock; (2) server receives, T2;
(3) server sends, T3; (4) client receives, T4; (5) θ and δ; (6) the correction (step or slew) and the client's
stratum; (7, with `next`) the whole next exchange and its θ. Chain mode: (1) the sources answer with their strata and
error bounds; (2) stratum-16 sources are dropped; (3) the selection (`*`); (4) the client's stratum and its offset
from the selected source.

## Presets and expected numbers

Checked with a scratch script (exact fractions) and in `sim.test.js`.

| Preset | Params | Steps | Expected |
|---|---|---|---|
| 1 `symmetric` | offset +100, out 10, back 10, proc 1 | 6 | T1 0.000, T2 0.110, T3 0.111, T4 0.021 s; θ = 0.100 s exactly, δ = 0.020 s; error 0, bound 0.010 s; slew (0.1 s ≤ 1 s), 200 s; client 16 → 2 |
| 2 `asymmetric` | out 30, back 10 | 6 | T2 0.130, T3 0.131, T4 0.041 s; θ = 0.110 s (error +0.010 s = (30 − 10)/2), δ = 0.040 s, bound 0.020 s holds; slew |
| 3 `boot-step` | offset +5000, update 1, next | 7 | T2 5.010, T3 5.011, T4 0.021; θ = 5.000 s > 1 s at update 1 → step, the clock jumps 0.021 → 5.021 s; next exchange (update 2) 64 s later: T1 69.021, T2 69.031, T3 69.032, T4 69.042 s, θ = 0.000 s → slew |
| 4 `late-slew` | offset +5000, update 10, next | 7 | θ = 5.000 s, update 10 > 3 → slew, 10 000 s; next exchange (update 11): T1 64.053, T2 69.031, T3 69.032, T4 64.074 s, θ = 4.968 s (0.032 s done) → slew |
| 5 `stratum-chain` | chain, down none | 4 | `*` 161.53.78.71 (stratum 1, ±2581 µs); client stratum 2; offset 0.000037158 s slow → slew; `gu.irb.hr` stratum 3 not selected |

Chain mode with `down`: `one` → `*` 161.53.78.72, client 2; `both` → `*` 232.184.183.46…, client 3; `all` → no `*`,
client 16 (UL ch18 Primjer 4: a list without a `*` means the service runs and achieves nothing).

The book does not derive offset and delay; the formulas and the preset numbers 1–4 are computed from RFC 5905 §8.
Preset 5 is UL ch18's `chronyc tracking` and `chronyc sources` output (shown without the tool's name or layout).

## Out of scope

Clock filter and selection algorithms in full, poll intervals, frequency drift, leap seconds, NTS authentication,
PTP, the Windows domain hierarchy (`win-time-hierarchy` links here).
