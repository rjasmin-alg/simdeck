<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# shannon-hartley: notes

New sim (task `docs/tasks/w3/shannon-hartley.md`, catalogue `ham-shannon`, §4.10). Class explorer: a rectangle of
width B and height log₂(1 + S/N) whose area is C, the formula with the current numbers, the curve C/B against S/N with
the current point, the target's required S/N and four example systems, and a table of the examples (a click loads
their B and S/N). Rules and numbers: `SPEC.md`.

## Sources

- 50ohm-contents-hr @ `caa25d9`: `contents/sections/shannon_hartley_gesetzt.md` (C = B·log₂(1 + P_S/P_N); 0 dB gives
  C = B; FT8/WSPR at very poor S/N with a few bit/s; HAMNET in upper UHF/SHF for wide bandwidth; the S/N needed rises
  steeply when R is far above B; noise only inside the used band and the 2.4 kHz reference caveat; an upper bound,
  approached only with good error correction). CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.: attributed
  in the footer bar in both languages (`credit`) and in `sim.json` `credits`. The explanation summarises the section;
  nothing is copied verbatim.
- uvod-u-racunalne-mreze @ `55cc96d`, `book/chapters/06-fizicki-sloj.md`, "Kako signal nosi bitove": nominal
  throughput (širina pojasa in part of the literature) as the theoretical ceiling, achieved rate always below it;
  RFC 5136. Used for the "bandwidth in Hz is not a rate in bit/s" misconception and the upper-bound wording.
- C. E. Shannon, "Communication in the Presence of Noise", *Proc. IRE* 37(1), 1949: the formula. Not opened; the
  formula is standard and matches 50ohm.
- FT8: 77-bit payload, 79 symbols of 0.16 s = 12.64 s per transmission in a 15 s cycle, about 50 Hz wide, S/N
  reported in a 2500 Hz reference bandwidth: K. Taylor et al., "The FT4 and FT8 Communication Protocols", *QEX*,
  2020 *(check)*: not available offline, numbers from memory of the paper. The page says "77 bits in 12.6 s, about
  6 bit/s" and "50 Hz".

Numbers checked with a script before coding (all match the task file):
C(2.4 kHz, 0 dB) = 2400; C(2.4 kHz, 10 dB) = 8302.6; C(2.4 kHz, 30 dB) = 23 921; C(4.8 kHz, 10 dB) = 16 605;
C(2.4 kHz, 13 dB) = 10 534; C(2.5 kHz, −20 dB) = 35.89; C(10 MHz, 20 dB) = 66 582 115; C(20 MHz, 30 dB) =
199 344 525; required S/N for 2× B = 4.771 dB, 4× B = 11.761 dB, 20× B = 60.21 dB; 77/12.64 = 6.09 bit/s.

## Decisions

- **B and R on one log grid** (13 values per decade: 1, 1.2, 1.5, 2, 2.4, 2.5, 3, 4, 4.8, 5, 6, 8, 9.6), stored in
  tenths so values are exact. The kit's `range` is linear, so the params `b` and `rate` are grid indices and the
  slider shows the value. 2.4 and 2.5 are both on the grid because the task file uses both reference bandwidths;
  4.8 and 9.6 make the caption's "twice / four times" rates reachable.
- **Target rate** is a toggle plus a slider (the kit has no free number field): the slider appears with the toggle.
  The verdict has three values; R = C is "exactly at the bound" (tie-break, SPEC.md), reached on the grid at 0 dB
  with R = B.
- **The rectangle's width axis** rescales to the smallest 1, 2 or 5 · 10^k that holds B (B fills 48–100 % of it). A
  6-decade B cannot be drawn on one linear axis, and a log axis would break "area = C". 2.4 → 4.8 kHz stays on the
  5 kHz axis, so doubling B visibly doubles the width. The height axis is fixed (0–14 bit/s per Hz) so S/N changes
  compare directly.
- **"Changed"** marks C (in the rectangle and the formula) when its power of ten differs from the state drawn before
  (the task file's legend). Kept in the page, not the model: an explorer has no previous state.
- **The 0 dB caption** is the task file's caption with B and C filled in; other S/N values get a caption with the
  numbers. The target adds the required S/N, the verdict, and, above R = 4·B, the "about 3 dB per extra bit per
  hertz" sentence (rule 3).
- **Example systems** (FT8/WSPR at −20 dB in 2.5 kHz, a 2.4 kHz voice channel at 10 dB, HAMNET 10 MHz at 20 dB,
  WLAN 20 MHz at 30 dB) are the task file's preset numbers. FT8 carries an asterisk and the footnote of rule 5.
  Names: FT8, WSPR, HAMNET are what the ham course and 50ohm teach; WLAN is a technology, not a product (concepts,
  not tools).
- **Required S/N for huge R/B** is computed on the asymptote above R/B = 60, so 1 Gbit/s in 10 Hz shows 3.01·10⁸ dB
  instead of Infinity; the formula shows S/N = ∞ there.
- The C label sits inside the rectangle when it is tall enough, otherwise above it. On a phone the plots get fixed
  heights, the width axis labels only its ends, and the target line is labelled "target rate R" only (the numbers
  are in the formula box under it).

## Deviations from the task

- **A sixth preset, `rate-above-b`** (2.4 kHz, 10 dB, target 48 kbit/s = 20·B → 60.2 dB, above the bound): rule 3 is
  the one rule the five listed presets did not show.
- `ssb-10`'s "at 30 dB → 23.9 kbit/s" and `double-b`'s "13 dB → 10.5 kbit/s", and the WLAN number of `hamnet`, are
  in the preset hints (and WLAN is an example row), not separate presets.
- Param names are `b`, `snr`, `target`, `rate` (`b` and `rate` grid indices), not `B`/`snr`/`target` in hertz.

## Term pairs

None of these is in `kit/glossary.js`; written out in both tables (Croatian from 50ohm `shannon_hartley_gesetzt.md`
and URM ch. 6). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| channel capacity | kapacitet kanala |
| bandwidth | širina pojasa |
| signal-to-noise ratio | omjer signal-šum |
| data rate | brzina prijenosa podataka |
| upper bound | gornja granica |
| noise | šum |

(`decibel` is the same word in both and needs no pair.)

## Shared requests

- **Kit: `.sd-ctl[hidden]`.** `kit.css` gives `.sd-ctl` `display: flex`, which beats the `hidden` attribute that a
  param's `visible()` sets, so a hidden control stays visible. Smallest change: `.sd-ctl[hidden] { display: none; }`
  in `kit.css`. Worked around in the page with the same rule (as `sims/amdahl` does); drop it once the kit has it.
- **Kit: a log-scale `range`** (`scale: 'log'` with min/max in real units, or `values: [...]`) would let B and R be
  params in hertz and bit/s instead of grid indices (readable URLs, presets). Not needed; the index works.

## Checks

- `node --test sims/shannon-hartley/sim.test.js`: 19 tests. Each rule and tie-break broken once (R = C tie, decade
  tolerance, axis `>=`, 2·C, dB/20, `exp` for `expm1`, verdict reversed, FT8 flag removed): each fails its test.
- `npm run gate -- shannon-hartley`: all pass, no exceptions declared.
- Beyond the gate (which opens the page with the target off), a Playwright probe at 1920×1080 in both languages set
  the target on, every preset, both slider ends (10 Hz, −30 dB, 1 Gbit/s; 20 MHz, 40 dB, 1 bit/s) and the R = C
  limit: no page or panel scroll, no console errors. The same at 375×812. Screenshots reviewed: light, dark,
  grayscale, phone, both languages.
- Fresh review (a separate agent read the code against `SPEC.md`, recomputed every number and mutated `sim.js`): no
  model defects. It found four page defects, all fixed: the required linear S/N printed as a raw JS float above
  10²¹ and as "∞" above 300 dB (now 10^x with a superscript, built from the dB value), tiny ratios as `6.93e−7`
  (same fix), the "changed" mark kept after a change that left C alone (now keyed on the params), and "2 400 bit/s"
  in the 0 dB caption (grouping from five digits). Seven surviving mutations (grid decade dropped, `axis` from C,
  `Y_MAX` 13, defaults, lower rate clamp, `ceil` for `round`, `target` undefined) now each fail a test (19 tests).
  It also noted that the task file's `ssb-10` says "30 dB more" where 10 → 30 dB is 20 dB more; the page says 20.
- Not checked: the FT8 numbers against the QEX paper *(check)*; Shannon 1949 not opened.

## Time

Start to done: about 25 min by the machine clock (2026-11-09 20:23 – 20:45 CET), one session.
