<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# link-budget: notes

Task `docs/tasks/w3/link-budget.md`, catalogue `ant-link-budget` (§4.15; shared models 4 and 5 of §5.26). A new native
explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in `SPEC.md`;
the task's "Model and presets" section was empty and SPEC.md fills it.

## Decisions

- **The path loss split in two.** The concept's key point (higher bands lose only because a receiving antenna of fixed
  gain is smaller) is drawn, not only said: the ladder shows 20·log(4πd/λ) as two rows that add up to it, spreading
  over the sphere 10·log(4πd²) (the same at every band) and the isotropic antenna's area 10·log(λ²/4π). Change the band
  and only the second row moves.
- **Fixed gain against fixed size** is a switch, "Tanjuri stalne veličine" / "Dishes of fixed size". On, both ends are
  dishes of a set diameter, G = η·(πD/λ)² with η = 0.55: the receiving dish's area stays put and the transmitting dish's
  gain grows as f², so a higher band gives more (preset 5 and the caption). The gain sliders and the diameter sliders are
  hidden by turn (`visible`).
- **Polarization** uses model 4: `polarization.js` is an unchanged copy of `sims/polarization-mismatch/polarization.js`
  @ 208ca25; `plfOf(ψ)` projects two linear unit vectors ψ apart, |ê_tx·ê_rx*|² = cos²ψ. Only linear antennas: circular
  is `polarization-mismatch`'s concept. ψ = 90° gives null (−∞) all the way down; the caption says what happens in
  practice.
- **The dB chain** is model 5: `link-budget.js` copied from `sims/gain-directivity/link-budget.js` @ 5f85cdb with every
  function unchanged; added (additive, promotable): `C`, `wavelength`, `spreadingDb`, `isoAreaDb`, `pathLossDb`,
  `effArea`, `gainOfArea`, `dishGain`, `polLossDb`, `receive`, `distanceFor`, `volts`. The page-specific parts (the
  cable model, the distance grid, the status) stay in `sim.js`.
- **Cable lengths, not losses.** The task asks for cable lengths, so the loss follows a generic thick 50 Ω coaxial cable,
  α = 0.63·√f + 0.0071·f dB/100 m (fitted to two typical values, *(check)*), and two connectors of 0.1 dB on any cable
  (none without a cable). At 10 GHz 10 m already costs 14 dB: the lesson that the radio goes to the dish.
- **Distance** steps through the rounded R10 series (1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8 × 10ⁿ km), 0.1 km to
  400 000 km: three steps are a doubling (6 dB), ten a decade (20 dB). The slider keeps exact numbers on screen.
- **The longest distance** is computed, not searched: every other term is fixed, so d_max = d·10^((M − F)/20). The
  right-hand plot draws P_r against log distance (a line falling 6 dB per doubling, with a ×2 step triangle), the
  sensitivity, the fade reserve band and both distances. The student can still find it with the slider; the readout
  confirms it. Not an answer key in the COMMON.md §1 sense (no estate scenario is involved).
- **Units on the page**: dBm throughout (the ham unit for receivers); the transmitter row also shows W; the received
  power in W with an SI prefix and as µV across 50 Ω (receivers are specified in µV). Below 1 aW the page writes
  "< 1 aW".
- **Status**: `works` (margin ≥ reserve), `fading` (0 ≤ margin < reserve), `fail`, `crossed`; thresholds met within
  1e-9 dB count as met (`statusOf`).
- **No time axis.** Nothing here changes in time, so the antenna notes' "time on the stage" does not apply: an explorer
  with only the kit's reset in the bar. Fading stays a reserve; the `fading` page shows the mechanism.
- **Panel layout** (as `gain-directivity` and `rpo-rto`): presets and settings in two columns, the duplicate reset
  hidden. Thirteen controls did not fit at first (1128 px against 926): the band choice is one row of plain MHz
  numbers with "(MHz)" in its label, the antenna mode is a switch in a half column with the kit's written on/off state
  hidden by page CSS (the knob shows it), the transmitter slider shows dBm only (W is on the ladder), "Polarizacija"
  is short. Now 926 = 926 in every preset and edge state checked.
- **Tags**: `propagation`, `antennas` (the task's; both in `tags.json`). Topic `radio`, level `core`. `related`:
  `gain-directivity`, `polarization-mismatch`, `fading`, `wifi-channels` (the catalogue names `fading` and
  `wifi-channels`; URM only as a side note, as the owner said).
- **No idea-credit line**: the antenna notes name four other pages for it, not this one.
- **No glossary terms** (`[[…]]`): none of the terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- None in scope. "Connector losses" are fixed (0.1 dB each, two per cable) rather than a slider, to keep the panel on
  one screen; they show in the "cable and connectors" rows.

## Sources

- H. T. Friis, "A Note on a Simple Transmission Formula", *Proc. IRE* 34 (1946): P_r/P_t = A_r·A_t/(d²λ²).
- C. A. Balanis, *Antenna Theory*, 3rd ed., ch. 2: effective area (eq. 2-111), polarization loss factor (eq. 2-71),
  Friis transmission equation (eq. 2-118), far-field distance 2D²/λ (§2.2.4); ch. 15, reflector aperture efficiency
  *(check eq. numbers; the book was not at hand, the numbers were recomputed)*.
- J. D. Kraus, *Antennas*, the chapter on the Friis formula and effective aperture *(check chapter)*.
- 50ohm-contents-hr (`contents/sections`): prigušenje kabela, osjetljivost prijamnika, *fading* (slabljenje).

## Unchecked *(check)*

- The coaxial cable's α(f) coefficients (fitted to ~7 dB/100 m at 100 MHz and ~27 dB/100 m at 1 GHz, typical for a
  10 mm solid-dielectric cable; not from a datasheet).
- 0.1 dB per connector; a dish's aperture efficiency 0.55 (Balanis gives a typical range).
- "A dish under 3 λ is only roughly a dish": a rule of thumb, not a book value.
- "In practice crossed antennas still get something 20–30 dB down": typical cross-polarization figures, not sourced.
- Balanis equation numbers and the Kraus chapter (above).

## Checks

- **Numbers**: a Python script (scratch, not committed; `math` only) computed every number in SPEC.md §2 and §4 from
  the formulas; the JS model matches to the printed digits (the tests use those values).
- `node --test sims/link-budget/sim.test.js`: 26 tests pass (with the review's added assertions).
- `npm run gate -- link-budget`: all rules pass (46 browser checks). Screenshots at 1920×1080 light, dark, grayscale
  and 375×812 in both languages reviewed, plus every preset and the edge states (crossed, fail, dishes at 145 MHz,
  near field at 100 m with 3 m dishes at 10 GHz, 400 000 km at 85°) in both languages at 1920×1080: panel 926 = 926,
  no console errors. Fixes from that look: the panel (above), the ladder's sensitivity label on the first row, the
  plot's dBm label on the title, crowded km ticks on a phone (every other decade), marker labels on the line (now at
  the top of a full-height line, on the side away from the current point), "now" off the plot's left edge, the dot
  vanishing when the point is off the plot (now on its edge), "0.00 aW".

- **Fresh review and mutation pass** (a separate agent with no part in the build): it re-derived every number in SPEC.md
  §2 and §4 with its own Python script and found them right, and the copied functions of both modules unchanged. 49
  mutations of `sim.js` and `link-budget.js`, 40 killed; of the 9 survivors 3 were real test gaps, now tested and seen
  to fail: the near-field flag in fixed-gain mode (`dish &&` removed), the receive gain from the transmit dish (every
  dish test had dt = dr), the whole R10 series (3.2 → 3.15 survived). The unused `aEffTx` was dropped; the rest are
  equivalent (a redundant clamp, `>` against `>=` at −TOL, no grid value exactly on 3λ or 2D²/λ, a rotation plane that
  gives the same cos²ψ). Fixed from its reading: "So here a higher frequency gives a stronger signal" with dishes was
  false with long cables (10 m each side: 1296 → 10 368 MHz loses 3.1 dB), now "cables aside", and the explanation says
  the cable loss grows too; "near field" for the dishes is now "not yet in each other's far field" (the radiating near
  field, not the reactive one), SPEC notes the stricter 2(D_t + D_r)²/λ; "the first fade breaks the link" is now "any
  fade deeper than {margin}"; the satellite hint; SPEC's reason for 6.3; "ukrižene" → "ukrštene" *(check)*; with a fade
  reserve of 0 the caption no longer says "0 dB is kept for fading".
- `npm test` and `npm run check` (0 errors): pass.

## For the owner

- Terms not settled (used as below, each *(check)*):
  - *(check)* **proračun veze** (link budget; catalogue: against "bilanca snage").
  - *(check)* **gušenje puta**, **gušenje u slobodnom prostoru** (path loss, free-space path loss).
  - *(check)* **margina** (link margin) and **rezerva za fading** (fade reserve, fade margin): two words, so the two
    numbers are not confused.
  - *(check)* **površina antene** / **efektivna površina** (effective area, aperture).
  - *(check)* **širenje po kugli** (spreading over a sphere).
  - *(check)* **tanjur** (a dish antenna), **na predaji / na prijemu** (transmit / receive side).
  - *(check)* **ukrštene polarizacije** (crossed polarizations).
- Free space gives handhelds thousands of km; the caption says the horizon and obstacles stop them first. A page on the
  radio horizon would be the natural next step (not in the catalogue).

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| cable loss (attenuation) | prigušenje kabela | 50ohm-contents-hr |
| receiver sensitivity | osjetljivost prijamnika | 50ohm-contents-hr |
| fading | *fading* (slabljenje) | 50ohm-contents-hr |
| gain, EIRP, isotropic radiator, polarization | dobitak, EIRP, izotropni zračitelj, polarizacija | 50ohm-contents-hr |
| link budget | proračun veze | *(check)* |
| path loss / free-space path loss | gušenje puta / gušenje u slobodnom prostoru | *(check)* |
| link margin | margina | *(check)* |
| fade reserve (fade margin) | rezerva za fading | *(check)* |
| effective area (aperture) | efektivna površina antene | *(check)* |
| dish antenna | tanjur (parabolična antena) | *(check)* |

## Shared requests

- **models/**: `link-budget.js` (model 5) is ready to promote as `models/link-budget.js` (`SimdeckModels['link-budget']`).
  It is the gain-directivity file plus new functions only; promote this copy (it is a superset) and point both pages at
  it. Its rule tests here: "module link-budget" (two tests) and rules 1, 5, 6, 8, 10 in `sim.test.js`.
- **models/**: `polarization.js` (model 4) is an unchanged copy of `sims/polarization-mismatch/polarization.js` @
  208ca25; when promoted, point this page at `../../models/polarization.js` and drop the copy.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `gain-directivity`, `dipole-length` and
  others; worked around in this page's CSS. A kit option for a compact switch (no written on/off state) would replace
  the page's `.sd-switch-state { display: none }`.

## Learn tree

Suggested leaf (catalogue §4.15): `radio › antennas › link` "Proračun veze" / "The link budget"; also in
`radio › propagation › fading` and `networks › wireless › channels` as the catalogue proposes.

## Time

Start 14:13, done 14:37 on 2026-11-09 (spec and number check, model, tests, page, gate green, review and its fixes).
