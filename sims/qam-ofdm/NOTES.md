<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# qam-ofdm: notes

New sim (task `docs/tasks/w3/qam-ofdm.md`, catalogue `ham-qam-ofdm`, §4.10). Class explorer, two modes on one page:
**QAM** (constellation diagram, 400 received points, decision grid, card, table of the four orders) and **OFDM**
(subcarrier comb of sinc spectra, an interferer, wrong symbols per carrier, card). Rules and numbers: `SPEC.md`.

## Sources

- 50ohm-contents-hr @ `caa25d9`: `contents/sections/qam.md` (amplitude and phase per symbol, 16-QAM I/Q mapping,
  8-QAM figure), `ofdm.md` (spacing, lower symbol rate per carrier with the same total, narrow-band interference hits
  few carriers, FEC, multipath and ISI), `psk.md` (constellation, decision regions, Gray code) and
  `contents/html/applet_qpsk.html` via `sims/qpsk` (Gaussian noise on I and Q, nearest-symbol decision, mapping
  11/01/00/10). CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.: attributed in the footer bar in both
  languages (`credit`) and in `sim.json` `credits`. The explanation summarises the sections; nothing is copied
  verbatim.
- J. G. Proakis, M. Salehi, *Digital Communications*, 5th ed., §4.3: not available offline. Rule 4 is the task file's
  statement of the square M-QAM SER formula *(check against the book)*. Checked instead by Monte Carlo: 400 000
  symbols each at (4, 10 dB), (16, 15 dB), (64, 20 dB), (256, 25 dB), (64, 25 dB) land within sampling noise of the
  formula (e.g. 64 @ 20 dB: 5.09 % vs 5.03 %); `sim.test.js` keeps a 60 000-symbol version within 10 %.
- erfc: the Chebyshev fit `erfcc` (Numerical Recipes), fractional error < 1.2·10⁻⁷; tested against Q(1), Q(3), Q(5),
  Q(10) reference values.

## Reuse (shared request)

`sims/qpsk` has no model in `models/`. Copied from `sims/qpsk/sim.js @ 2136a30` into `sim.js`, marked in comments:
`rng` (mulberry32), `gaussian` (Box–Muller with the zero guard), `round4`; the mapping and the axis tie-break are
re-derived (Gray code per axis gives qpsk's 11/01/00/10 for M = 4, tested). **For the coordinator:** if a shared
`models/` file is wanted (e.g. `models/qam.js`: `grid`, `bitsOf`, `pointOf`, `decide`, `sigma`, `serTheory`), this
`sim.js` is pure and promotable unchanged; qpsk's stepper would keep its own `plan`.

## Decisions

- **One page, two modes** (the task's note for the coordinator: this entry holds two concepts). Built as the task
  says; the OFDM mode is its own 3–5 minute demo. Splitting it into its own sim stays open (`docs/tasks/OPEN.md` is
  outside my scope, so it is in the report).
- **Mode switch in the stage**, not in the panel: with both OFDM params the panel did not fit 1920×1080. `mode`
  stays a param (URL, presets) with `visible: false`, as `sims/lora-css` does with its view.
- **Seed 21** (default and every preset): the first seeds that give the task's counts exactly: 64-QAM @ 20 dB 20 of
  400 wrong (expected 20.1), 0 for the other QAM presets, OFDM 18 of 24 on carrier 5 and 0 elsewhere. Seeds 11, 15,
  18, 23, 25, 40 … also qualify (a scan of seeds 1–99).
- **Symbol choice**: per symbol one uniform u, symbol ⌊u·M⌋ (not shuffled groups as qpsk: 400 is not a multiple of
  256). Draws do not depend on M or SNR, so changing either moves the same symbols' noise.
- **OFDM sends 384 symbols** (the largest multiple of 32 up to 400) so every carrier gets the same count (48/24/12),
  using the QAM cloud's first 384 draws; symbol k on carrier (k mod N) + 1. The order M and SNR are the QAM params.
- **Total rate 16 kBd** *(illustrative)*: T = 0.5 / 1 / 2 ms and Δf = 2 / 1 / 0.5 kHz for N = 8 / 16 / 32 — round
  numbers. The echo of 0.1 ms *(illustrative)* gives 20 / 10 / 5 % of a symbol, 160 % for one carrier at 16 kBd.
- **Interferer** = extra noise of the signal's power (0 dB, *illustrative*) on its carrier only: effective SNR
  1/(1/SNR + 1) ≈ −0.04 dB at 20 dB, 16-QAM SER 74 %. Modelled as noise, not as a tone (the task asks only for "a
  narrow-band interferer that hits the carrier under it"). It sits exactly on a carrier, so it falls on every other
  carrier's null (rule 5); an off-centre interferer leaking into neighbours is out of scope.
- **Theory values below 10⁻¹²** are shown as "< 10⁻¹²" (QPSK at 20 dB is 1.5·10⁻²³, which reads as noise on a
  slide); the model keeps the exact value.
- **Bit labels**: all points for M ≤ 16, the upper-right quadrant for 64, none for 256 (hover: an SVG `<title>` on
  every cross), and none whenever a decision cell is narrower than the label (phone). The note above the plot says
  which. Labels sit in the cell's top-left corner, clear of the cloud.
- **Changed mark**: the "wrong symbols" count gets the kit's `.sd-changed` when its class (0, < 1 %, ≥ 1 %) differs
  from the previous params' state in the same mode (exactly 1 % is ≥ 1 %, tested).
- **Caption variants**: QPSK vs higher orders; 0 errors vs some (Croatian plurals 1 / 2–4 / 5+); the Gray sentence
  only when wrong bits < 1.5 × wrong symbols; OFDM without interferer, with an interferer and clean other carriers,
  with a few noise errors elsewhere (< 1 %), or with heavy noise everywhere (then no FEC claim).
- The table of the four orders at the current SNR is clickable (sets M), as `lora-css`'s SF table.
- Level `intro` (task). Related: `qpsk`, `fsk-psk-ask`, `lora-css`.

## Deviations from the task

- State: as named, plus `sent`, `errors`, `bitErrors`, `levels`, `sigma`, `errorClass`, `table` and, in `ofdm`,
  `carriers`, `perCarrier`, `rateKBd`, `totalKBd`, `echoShare`, `errors`, `sent`, `errorClass`, `serTheoryHit`.
- `interferer` is a range 0 … N (0 = off, carriers numbered from 1), clamped to N when N shrinks.
- The generator is started at `seed·7919 + 13` (qpsk's `plan`), not `Simdeck.rng(seed)`; same generator.
- "SNR" is Es/N0 in the label ("Omjer signal-šum Es/N0").
- Preset 5 keeps the QAM params M = 16, 20 dB (the task names only 16 carriers and carrier 5).

## Term pairs

None of these is in `kit/glossary.js`; written out in both tables (Croatian from 50ohm-contents-hr `qam.md`,
`ofdm.md`, `psk.md`). For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| quadrature amplitude modulation (QAM) | kvadraturna amplitudna modulacija (QAM) |
| constellation diagram | konstelacijski dijagram |
| symbol | simbol |
| decision region | područje odluke |
| Gray code | Grayev kod |
| orthogonal frequency-division multiplexing (OFDM) | ortogonalno frekvencijsko multipleksiranje (OFDM) |
| subcarrier | nositelj (podnositelj) |
| inter-symbol interference | intersimbolna interferencija |
| signal-to-noise ratio | omjer signal-šum |

## Shared requests

- **Kit**: `.sd-legend li { display: inline-flex }` overrides `hidden` on a legend item, as `.sd-ctl` does for
  controls (qpsk's note). Worked around in the page (`.sd-legend li[hidden] { display: none; }`); the page hides the
  other mode's legend items. Smallest fix: `.sd-legend li[hidden], .sd-ctl[hidden] { display: none; }` in `kit.css`.
- **Kit**: a mode-dependent legend (`legend` as a function of params) would replace the page's hiding by index.
- **models/**: promote the QAM part of this `sim.js` if another sim needs it (above).

Tag `modulation` and topic `radio` exist in `tags.json`.

## Checks

- `node --test sims/qam-ofdm/sim.test.js`: 30 tests. My twenty mutations, each caught by at least one test: the
  threshold tie-break (`>` for `>=`), energy scale, d_min, no Gray code, I/Q bit order, threshold offset, noise
  variance without /2, Q noise from the I draw, the u guard, each term of the SER formula, 2p − p² → p, the 1 % class
  tie, Δf ≠ 1/T, rate per carrier, carrier assignment, interferer on every carrier, interferer clamp, echo share,
  Box–Muller angle.
- **Fresh review** (a separate agent, read the diff against `SPEC.md`, re-derived every number in Python and in an
  independent Node implementation, and ran ~40 more mutations): no defect in the model or the numbers. Fixed after it:
  11 mutations no test caught (rounding before the decision, bit errors counted per bit, the table rows, N0 + JAM at
  0 dB, the state fields the page shows, defaults and JAM pinned): 5 tests added, all 11 now caught; Croatian plurals
  (`cardLevelsVal`, the OFDM captions, "32 nositelja daju"), a missing noun in the "few errors" caption, a branch for a
  hit carrier with 0 errors, Croatian case after "Kod", and the 64qam-25 hint (it is the theoretical SER that drops);
  SPEC: ×0.497, and the seeding `seed·7919 + 13` (from qpsk) stated as a deviation from the task's `Simdeck.rng(seed)`.
- `npm run gate -- qam-ofdm`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus every preset,
  256-QAM at 30 dB, OFDM with 32 carriers at 12 dB (hr, en, dark, phone). A browser script checked the changed mark
  (16 → 64 marks; high → high does not; mode switch does not), the mode buttons, the table, key 5, and no console
  errors.
- Not checked: Proakis itself (above); a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 1 h 15 min by the machine clock (2026-11-09 19:54 – ~21:10 CET), one session.
