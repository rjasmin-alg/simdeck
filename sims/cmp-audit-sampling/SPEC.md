<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-audit-sampling: specification

Task `docs/tasks/w3/cmp-audit-sampling.md`, catalogue `cmp-audit-sampling` (§4.13; builds on the evidence trail of
`cmp-policy-to-record`, §5.24). Class **explorer**: the state is a pure function of the params (`sim.js`
`compute`); sampling, the exact chances and the seeded draws are `sampling.js` (pure, promotable to `models/`).

**One concept:** an auditor tests a sample of a control's occurrences; the chance of finding at least one failure is
1 − (1 − rate)ⁿ, so a sample of 25 misses a 2 % failure rate more often than not (about 60 % of the time); how often
a control runs sets the usual sample size; one exception means a larger sample or a finding; "no exceptions found"
is not "no failures".

**The contrast on the stage:** what the auditor concludes from the sample beside what is true of the population.
The grid shows every occurrence with the failed ones marked (the truth) and the last sample outlined;
the side shows the last sample's conclusion against the truth, then the tally of every sample drawn against the
exact chance and the formula.

## Stage

- **Population grid** (left): one cell per occurrence of the control in the audit year (250 change tickets by
  default), laid out in a square, ⌈√N⌉ columns (4 → 2, 12 → 4, 52 → 8, 250 → 16, 1000 → 32). Cell marks: not sampled (hollow);
  failed (hatched, ✗); in the last sample and fine (filled, ✓); in the last sample and failed: an **exception**
  (highlight, thick outline, ✗). The heading counts them: "250 change tickets · 5 failed (2 %)".
- **The last sample** (side, top): "checked 25 of 250 · 0 exceptions", the auditor's conclusion (rule 4) and the
  truth beside it, and the verdict: *missed* (no exceptions but some failed), *right* (no exceptions, none failed),
  *caught* (one or more exceptions).
- **All samples** (side, middle): three bars, *no exception* / *one* / *two or more*, each with its count, its share
  and a tick at the exact expected share; above them "found at least one: 41 % of 1000 · expected 41 %".
- **The numbers** (side): the formula with the values, 1 − (1 − 2 %)²⁵ ≈ 40 %; the exact chance for this population;
  the sample that finds at least one exception with 95 % chance; and what "no exceptions" in n supports (only that
  the rate is below about 11 % for n = 25).
- **Usual sample by frequency** (side, bottom): the five rows of rule 6, the current one outlined, with a mark
  whether n is below, inside or above the usual range. Clicking a row picks that frequency.
- **Foot:** once, that the page simplifies, is not legal advice, and uses a made-up firm and made-up numbers.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `freq` | choice (also the stage's table rows) | `quarterly` 4, `monthly` 12, `weekly` 52, `daily` 250, `multi` 1000 (`daily`) | how often the control runs; sets the population N |
| `rate` | range 0–20 % | (2) | the true failure rate; k = round(rate × N), rule 1 |
| `n` | range 1…min(N, 250) | (25) | the sample size |
| `draws` | range 0–1000, buttons +1 (`D`) and +100 (`M`) | (1) | how many samples have been drawn |
| `seed` | hidden; "new population" (`N`) adds 1 | (6) | which occurrences failed and which were drawn |

## Rules

### Sampling (`sampling.js`, promotable)

1. **Failures.** k = round(rate × N ÷ 100), **halves up** (integer arithmetic: ⌊(2·rate·N + 100) ÷ 200⌋). Tie-break:
   1 % of 250 = 2.5 → 3; 10 % of 12 = 1.2 → 1; 2 % of 12 = 0.24 → 0. The true rate shown is k ÷ N (in tenths of a
   percent, halves up: 3 of 250 = 1.2 %, 1 of 12 = 8.3 %).
2. **Who failed and who is drawn.** Each run has streams from mulberry32 (the kit's `Simdeck.rng`), stream *i*
   seeded with (seed × 0x9E3779B1 + (*i* + 1) × 0x85EBCA6B) mod 2³². The failed occurrences are the first k picks
   of stream 0; sample *d* (from 0) is the first n picks of stream *d* + 1. A pick is a partial Fisher–Yates
   (draw without replacement: the auditor never tests a ticket twice). **Tie-break / monotonicity:** the first m picks
   do not depend on how many are taken, so a higher rate adds failures and keeps the old ones, and a larger n extends
   every sample: a sample that found an exception still finds it.
3. **Chances.** Exact (hypergeometric): P(0) = C(N−k, n) ÷ C(N, n), P(1) = k·C(N−k, n−1) ÷ C(N, n),
   P(2+) = 1 − P(0) − P(1), never below 0; "found at least one" = 1 − P(0). The **formula** 1 − (1 − k/N)ⁿ is the
   large-population approximation (sampling with replacement); it is a little lower than the exact chance, and
   reaches 100 % only as n grows without end while the exact chance is 100 % once n > N − k (P(0) is then +0, and
   n above N counts as N). The **size for 95 %**
   is the smallest n with exact 1 − P(0) ≥ 0.95 (none when k = 0). The **bound**: no exception in n rules out, at 95 %
   confidence, only rates above 1 − 0.05^(1/n) (25 → 11 %). Shares are whole percent, halves up.
4. **Conclusion** of a sample with x exceptions: 0 → *no exceptions*: the control is taken to operate (no finding);
   1 → *one exception*: extend the sample or report a finding; 2 or more → *finding*: the control did not operate.
   The verdict against the truth: *caught* when x ≥ 1, else *missed* when k > 0, else *right*.
5. **Tally.** Over the `draws` samples: how many had 0, 1 and 2+ exceptions, and their shares of `draws` (whole
   percent, halves up, in integers); "found at least one" = 1 + 2+.

### The sim (`sim.js`)

6. **Frequencies** (common practice in tests of controls, illustrative; *(check)*): quarterly 4 occurrences, usual
   sample 2; monthly 12, 2–5; weekly 52, 5–15; daily 250, 20–40; several times a day 1000, 25–60. The band is
   *below*, *in* or *above* the usual range.
   **Params (normalise):** an unknown `freq` (also `constructor` and other prototype keys) → default; `rate`,
   `draws`, `seed`, `n`: numeric strings (from the URL) are read as numbers; non-numbers (`null`, `''`, `true`,
   `NaN`, `Infinity`, objects) → default; numbers rounded halves up (negatives clamp to the minimum) and clamped (`rate` 0–20,
   `draws` 0–1000, `seed` 1–999999, `n` 1…min(N, 250)); unknown keys are dropped.
7. **Caption:** no sample yet → `capStart` (or `capStartClean` when k = 0); one sample → `capOne` (1 exception),
   `capFinding` (2+), `capMiss` (0 and k > 0), `capClean` (0 and k = 0); one exception when n = N → `capOneAll`
   (nothing left to extend: a finding; the card says so too); more → `capMany` (or `capManyClean` when k = 0).
   Notes, in order: `nOthers` with `capMany` when some samples found nothing (how many said "no exceptions"); `nAll`
   when n ≥ N (every occurrence tested), otherwise `nBelow` when n is below the usual range (n = N is never below it).
   The bound line (rule 3) is the large-population one and says so; it is hidden when n = N.

## Presets and expected outcomes

All at seed 6. Checked by the tests and by an independent Python script (exact chances by `math.comb`, the draws
through a port of mulberry32 and the pick; below).

| # | id | freq / rate / n / draws | k (failed ids) | exact found / P0 / P1 / P2+ | formula | size for 95 % | bound | tally 0 / 1 / 2+ (found) | last sample |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `one-sample` (= defaults) | daily / 2 / 25 / 1 | 5 (7, 114, 162, 185, 228) | 41 / 59 / 33 / 8 | 40 | 112 | 11 | 1 / 0 / 0 (0 %) | 0 exceptions: **missed** |
| 2 | `many` | daily / 2 / 25 / 1000 | 5 | 41 / 59 / 33 / 8 | 40 | 112 | 11 | 591 / 328 / 81 (41 %) | 1: extend |
| 3 | `clean` | daily / 0 / 25 / 1000 | 0 | 0 / 100 / 0 / 0 | 0 | none | 11 | 1000 / 0 / 0 (0 %) | 0: right |
| 4 | `bad-control` | daily / 10 / 25 / 1000 | 25 | 94 / 6 / 19 / 74 | 93 | 27 | 11 | 65 / 169 / 766 (94 %) | 1: extend |
| 5 | `sure` | daily / 2 / 112 / 1000 | 5 | 95 / 5 / 21 / 74 | 90 | 112 | 3 | 54 / 190 / 756 (95 %) | 3: finding |
| 6 | `monthly` | monthly / 10 / 2 / 1000 | 1 (10) | 17 / 83 / 17 / 0 | 16 | 12 | 78 | 826 / 174 / 0 (17 %) | 0: missed |

Contrasts the presets carry: 1 the auditor's "no exceptions" beside five failed tickets; 2 the same sample size
many times: about 6 in 10 samples miss a 2 % failure rate; 3 a clean control looks exactly the same to the auditor
as preset 1; 4 a badly failing control is caught almost always, mostly with two or more exceptions; 5 what it takes
to be 95 % sure of catching 2 % (112 of 250, against the usual 20–40); 6 a monthly control with one bad month and the
usual sample of 2 finds it 1 time in 6.

Independent check (run 2026-11-07; `python3`, prints each row's numbers, which match the table):

```python
from math import comb
M32 = 0xffffffff
def rng(seed):
    a = [seed & M32]
    def imul(x, y): return (x * y) & M32
    def r():
        a[0] = (a[0] + 0x6d2b79f5) & M32
        t = a[0]
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return r
def stream(seed, i): return ((seed * 0x9e3779b1) + (i + 1) * 0x85ebca6b) & M32
def pick(N, n, r):
    sw, out = {}, []
    for i in range(min(n, N)):
        j = i + int(r() * (N - i)); vi = sw.get(i, i); vj = sw.get(j, j); out.append(vj); sw[j] = vi
    return out
POP = {'quarterly': 4, 'monthly': 12, 'weekly': 52, 'daily': 250, 'multi': 1000}
def pc(x): return int(x * 100 + 0.5 + 1e-9)
def row(freq, rate, n, draws, seed):
    N = POP[freq]; k = (2 * rate * N + 100) // 200
    failed = set(pick(N, k, rng(stream(seed, 0))))
    p0 = comb(N - k, n) / comb(N, n); p1 = k * comb(N - k, n - 1) / comb(N, n)
    need = next((m for m in range(1, N + 1) if 1 - comb(N - k, m) / comb(N, m) >= 0.95), None) if k else None
    hist = [0, 0, 0]; last = None
    for d in range(draws):
        x = len([i for i in pick(N, n, rng(stream(seed, d + 1))) if i in failed]); hist[min(x, 2)] += 1; last = x
    return dict(k=k, failed=sorted(failed), exact=(pc(1 - p0), pc(p0), pc(p1), pc(max(0, 1 - p0 - p1))),
                formula=pc(1 - (1 - k / N) ** n), need=need, bound=pc(1 - 0.05 ** (1 / n)), hist=hist, last=last)
for name, args in [('one-sample', ('daily', 2, 25, 1, 6)), ('many', ('daily', 2, 25, 1000, 6)), ('clean', ('daily', 0, 25, 1000, 6)),
                   ('bad-control', ('daily', 10, 25, 1000, 6)), ('sure', ('daily', 2, 112, 1000, 6)), ('monthly', ('monthly', 10, 2, 1000, 6))]:
    print(name, row(*args))
```

The headline numbers by hand: 0.98²⁵ = 0.6035, so the formula finds a 2 % rate with 39.65 % ≈ 40 % and misses it
60 % of the time (the catalogue's "about 60 %"); exactly, for 5 failed of 250, C(245, 25) ÷ C(250, 25) = 0.5878, a
miss 59 % of the time. 1 − 0.05^(1/25) = 0.1129 ≈ 11 %.

## Legend

not sampled (hollow) · failed (hatched ✗) · sampled, fine (filled ✓) · exception: sampled and failed (highlight,
outline ✗) · expected share (tick on the bars).

## Terms (hr / en)

revizijsko uzorkovanje / audit sampling · populacija / population · uzorak / sample · veličina uzorka / sample
size · odstupanje / exception (deviation) · stopa odstupanja / deviation rate · proširenje uzorka / extending the
sample · nalaz / finding · test kontrole / test of a control · zahtjev za promjenu / change ticket.

## Misconceptions targeted

- "The sample found nothing, so the control works": presets 1 and 3 look the same to the auditor.
- "25 is a big enough sample for anything": preset 2, about 6 in 10 samples miss 2 %; preset 5, 112 needed for 95 %.
- "One exception is just bad luck": rule 4, the auditor extends the sample or reports it; preset 4 shows that a
  failing control mostly gives two or more.
- "A bigger population needs a proportionally bigger sample": the formula has no N; 25 of 1000 finds 2 % about as
  often as 25 of 250 (40 % vs 41 %); the usual sizes grow slowly with the frequency.

## Out of scope

The second stage after one exception (how much to extend), choosing a tolerable deviation rate and confidence level
formally, statistical vs judgmental sampling, stratification and spreading the sample over the period, sampling of
amounts (monetary-unit sampling), what makes one occurrence a failure (`cmp-policy-to-record`, the record and its
trail), and the severity of a finding.

## Sources

- ISA 530 *Audit Sampling* (IAASB): the sample, the population, deviations and projecting them, and that the
  sampling risk is the risk that the auditor's conclusion differs from the one testing the whole population would
  give. *(check: paragraph numbers not checked)*
- ISA 330 (tests of operating effectiveness of controls over the period). *(check)*
- PCAOB AS 2315 *Audit Sampling* (public text; sample sizes for tests of controls depend on the tolerable rate and
  the allowable risk). *(check)*
- ISO 19011:2018, Annex A.6 (sampling in management-system audits), and ISO/IEC 27001:2022 clause 9.2 (internal
  audit), by number only, never quoted. *(check: the annex number from the edition's contents, not checked against a
  copy)*
- The frequency table (rule 6) is common practice in tests of IT general controls, as published by several audit
  firms; values differ by firm and by the control's risk. *(check: no single primary source)*
- The formula and the hypergeometric chance: standard probability, checked by the script above.
- All numbers on the page are illustrative (the page says so once): the firm, the 250 change tickets, the failure
  rates, the 1000 access requests.
