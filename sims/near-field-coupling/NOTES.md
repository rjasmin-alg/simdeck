<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# near-field-coupling: notes

Task `docs/tasks/w3/near-field-coupling.md`, catalogue `ant-near-field-coupling` (§4.15; builds on shared model 2 of
§5.26). A new native explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and
numbers are in `SPEC.md`.

## Decisions

- **Two small loops, not two dipoles.** The catalogue names "two small loops" and 1/r³; a small loop is a magnetic
  dipole, whose H has the electric dipole's E form (duality). So `dipole-field`'s module gives the coupling directly:
  beside the loop (coplanar loops) the broadside E_θ phasor, 1/x³ + j/x² − 1/x; on the axis (coaxial loops) E_r,
  2(1/x³ + j/x²). The receiving loop's open-circuit voltage is V = −jω·μ0·A·H_z.
- **The model is copied, not linked** (COMMON.md §6: `models/` has no `hertzian-dipole.js` yet):
  `hertzian-dipole.js` is `sims/dipole-field/hertzian-dipole.js` @ f87e209, unchanged except for two header lines that
  say so. This sim uses only `fieldsAt` and `phasors`; their two tests are kept in `sim.test.js` ("model: …").
- **One concrete pair of loops**: radius 5 mm (1 cm across), 1 A, axes parallel. Point dipoles are within 3 % of the
  exact mutual inductance (Neumann's integral) from r = 10·a = 5 cm, so r starts there; at 450 MHz the loop is 0.047 λ
  round. The volts are then real (434 µV at 5 cm and 14 MHz, 54 aV at 1 km with c infinite).
- **Log sliders on R20 tables.** The kit's range control is linear and snaps to its step, so `f` and `r` are indices
  into ISO 3 R20 preferred numbers (20 a decade): 100 kHz … 450 MHz and 5 cm … 1 km. The presets then land on exact
  values (140 kHz, 14.0 MHz, 450 MHz; 5 cm, 10 cm, 1 m, 3.55 m, 1 km). A URL reads `?f=43&r=26` (indices).
- **14.0 MHz for the card**, not 13.56 MHz: R20 has 14.0 (3 % away, and the 20 m amateur band). The hint and the
  explanation say "13.56 MHz" where they talk about cards; the λ/2π there (3.52 m vs 3.41 m) does not change the point.
- **The y axis is auto-ranged** to the two curves at the chosen frequency (the full range is 30 decades), labelled every
  factor of 1000 with SI prefixes (V … aV) and gridded every decade. Asymptotes for the chosen geometry only.
- **The contrast that is the stage**: beside against on the axis (both curves always drawn, the chosen one thick),
  plus c finite against infinite. On the axis the near coupling is twice the side's (2.9 times at 450 MHz, 10 cm) while
  the far field there is zero (the pattern's null): "a meter held close misreads the far-field pattern". The two are
  equal at kr = 2.354 (0.375 λ).
- **"It barely depends on polarization in the far-field sense"** (catalogue) is shown this way: close in, the coupling
  follows the near field's closed lines (strongest on the axis, where the far field and its polarization vanish), not
  the far-field pattern. No orientation other than parallel axes is modelled (one concept; tilting is
  `polarization-mismatch`'s).
- **"No energy away when nothing is there to take it"** is shown as two powers through a sphere of radius r round the
  transmitting loop: the radiated power P (the same at every r, 0 with c infinite) and the reactive power Q =
  P/(kr)³ that swings out and back (the same with c infinite). No load is modelled; the explanation says a load draws
  from the stored energy (the charger).
- **Time** (antenna notes: "time on the stage"): the phase ωt with play (P), → ← PgDn PgUp (15°), Home, End and a
  scrubber, as in `dipole-field`. It drives the period plot (I and V, each over its amplitude) and the schematic's
  current arrow, field-line arrows and voltage bar. The field-line *shape* in the schematic is the quasi-static one
  (r = C·sin²θ) and is labelled "not to scale"; the distance is on the plot, not in the picture.
- **Phase of V against I** is reported in (−180°, 180°]: +90° beside and −90° on the axis close in (V ∝ dI/dt, opposite
  senses of the flux), turning −360° per λ far out. The +/− is a sign convention (the receiving loop's sense is the
  transmitting loop's); the page states only what changes.
- **No idea credit**: the antenna notes give the FER credit line to four other pages, not to this one.
- **Tags** `em-waves`, `antennas` (the task's; both in `tags.json`). Topic `radio`, level `core`. `related`:
  `dipole-field` (the model and the zones), `lc-antenna` (the antenna notes ask for it; not changed), `lambda-f`.
- **No glossary terms** (`[[…]]`): none of the terms are in `kit/glossary.js`; pairs below.
- Removed one unreachable line copied from `dipole-field`'s `norm` (`if (t >= 360) t = 0;`: the outer `% 360` already
  folds 360 − ε, which rounds to 360, to 0). The mutation pass found it; a test now pins t = −1e-15 → 0.

## Deviations from the task

- "Wireless charger … at a few centimetres": the page has no charger model (no load, resonance or many turns). The
  `charger` preset is 140 kHz with the same 1 cm loops: it shows that the near field reaches 341 m there while the
  voltage still falls 1000 times per decade, which is why the reach is short.
- The catalogue's "λ/2π" crossover is exact here: the three terms are equal at kr = 1, and the local slope beside is
  exactly 2 there.

## Sources

- C. A. Balanis, *Antenna Theory*, 3rd ed., §5.2 (small circular loop): eqs. 5-18a … 5-18c (H_r, H_θ, E_φ), 5-24
  (R_r = 20π²(C/λ)⁴), 5-27 (radiated power) *(check eq. numbers; the book was not at hand, the formulas were checked by
  integrating the Poynting vector numerically)*; §4.2 for the electric dipole the duality maps from.
- D. J. Griffiths, *Introduction to Electrodynamics*, 4th ed., §7.2.3 (mutual inductance, Neumann formula), §5.4 (the
  magnetic dipole field) and §11.1 (radiation) *(check section numbers)*.
- E. M. Purcell, D. J. Morin, *Electricity and Magnetism*, 3rd ed., ch. 7 (induction) — background, no number used.
  Kraus, *Antennas*: not used for a number.
- ISO 3 / IEC 60063, R20 preferred numbers (the slider tables).
- 50ohm-contents-hr: `sections/nahfeld.md`, `sections/fernfeld.md` (reaktivno blisko polje d ≤ λ/2π, zračeće blisko
  polje, daleko polje), "magnetska antena" (3 hits; "magnetska antena u bliskom polju stvara veće jakosti polja"),
  "spregnute zavojnice", "Magnetic-Loop antena", "jalov".
- `sims/dipole-field/hertzian-dipole.js` @ f87e209 (copied; COMMON.md §6).

## Checks

- **Numbers** (scratch script, not committed): Balanis' small-loop fields against the duality form at three distances
  and two frequencies (1e-9); the radiated and reactive power through a sphere by integrating ½·E×H* over θ (4001
  points) at 14 and 450 MHz and 5 cm, 1 m, 30 m: P = η0·π/12·(ka)⁴·I0² and Q = P/(kr)³ to 1e-9; Neumann's double
  integral for coplanar and coaxial loops of radius 1 cm against the point-dipole M at 3, 5, 10 and 20 cm (exact over point,
  beside / on the axis: +10 % / −11 % at 5 a, +2.3 % / −2.9 % at 10 a, +0.6 % / −0.7 % at 20 a); the equal-coupling root x = 2.3540 and the slopes 2 and 2.5 at
  kr = 1. The preset numbers in SPEC.md §6 came from the model and agree with the script's (scaled to a = 5 mm).
- **Mutation pass**: 39 deliberate breaks of `sim.js`, one at a time (index rounding and clamping, geometry and c
  parsing, both coupling signs and the axis phasor's quadrature, the asymptotes, both slope formulas and c infinite,
  both zone boundaries and c infinite, the phase tie-break and the −j, the k³, π/12, 12π, c-infinite radiation, the
  ratio, i and v, the profile's spacing, the period's phase and end point, three presets, the equal-coupling root, the
  radius, both tables' ends, η0, the partner geometry, the c-infinite plumbing into the phasor, the zone and the power).
  38 failed a test; the 39th was the unreachable line above (removed).
- **Fresh review** (a separate agent with no part in the build re-derived the physics from Balanis 5-18 without the
  dipole module and ran 61 mutations on a copy). It confirmed every formula, sign and SPEC number, and the page's keys,
  c-infinite plumbing, receiver marker and schematic field directions. It found, all fixed:
  - the caption's "twice as far, k times less" showed 2ⁿ of the local slope (3.6 at 3.55 m where the real ratio is
    2.12): now the real V(r)/V(2r), state `div`, tested;
  - on the axis in the radiating near field the caption said "the radiated part, falling as 1/r, takes over", false
    on the axis: new sentence `p_midAxis`;
  - with c infinite the table still showed λ and r/λ: now only f and r;
  - the 1/r³ label could sit on the receiver's diamond (phone, default): now the farthest of three places;
  - `norm` gave index 0 for null, '' and true instead of the default: fixed, tested;
  - SPEC's model-limit percentages and the near-row tolerance were misstated; the slope overshoots 3 and 1 (3.155 at
    kr 0.518, 0.845 at 1.932), which the default's n = 3.08 shows: SPEC says why, a test pins both extremes;
  - five surviving mutations (a preset's t, the c-infinite axis profile, KEY_STEP, the defaults, t below −360): tests
    added for each.
  - Suggestions taken: "no delay" only for kr < 0.5, within 5° of ±90° (new `p_nearEdge` from there to the boundary, where
    the phase moves to 122° beside); "±90°" in the explanation; Croatian "pogrešno pokazuje", "titra tamo-amo", "od {Q} jalove snage koja
    titra"; phone x axis labels every other decade. Left as is: the "radiating near field" name does not fit on the
    plot at 14 MHz on a desktop (λ/2π … λ is about 130 px); the table names the zone.
- `npm run gate -- near-field-coupling`: all rules pass; screenshots at 1920×1080 light, dark, grayscale and 375×812 in
  both languages reviewed, plus every preset at 1920×1080.

## For the owner

Terms not settled (used as below, each *(check)*):

- *(check)* **sprega u bliskom polju** (near-field coupling) — the catalogue's own title, marked *(check "sprega")*.
  50ohm uses "sprega" only for feedback and mechanical coupling, but has "spregnute zavojnice" (coupled coils); the page
  says "petlje su spregnute kao namoti labavog transformatora". Alternatives: "induktivna veza", "vezanje".
- *(check)* **međuinduktivitet** (mutual inductance): only in `aliases`, not on the page.
- *(check)* **prijamna / odašiljačka petlja** (receiving / transmitting loop); **magnetska antena** is 50ohm's.
- *(check)* **labavi transformator** (loose transformer, i.e. weakly coupled).
- *(check)* **titra tamo-amo** (swings out and back) for the reactive power; 50ohm says the energy "is returned to the
  antenna phase-shifted" and uses "jalov".
- 14.0 MHz instead of 13.56 MHz for the card preset (see Decisions); the owner may prefer a table entry at 13.56.

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| reactive near field | reaktivno blisko polje | 50ohm-contents-hr |
| radiating near field | zračeće blisko polje | 50ohm-contents-hr |
| far field | daleko polje | 50ohm-contents-hr |
| magnetic antenna (small loop) | magnetska antena | 50ohm-contents-hr |
| coupled coils | spregnute zavojnice | 50ohm-contents-hr |
| near-field coupling | sprega u bliskom polju | *(check)*, catalogue |
| mutual inductance | međuinduktivitet | *(check)* |
| receiving / transmitting loop | prijamna / odašiljačka petlja | *(check)* |
| reactive power | jalova snaga | 50ohm-contents-hr ("jalov") |

## Shared requests

- **models/**: this sim uses `hertzian-dipole.js` (catalogue §5.26 model 2) copied from `dipole-field` @ f87e209. When
  it is promoted to `models/hertzian-dipole.js`, point this page and `sim.js` at it (the `require` and the
  `SimdeckModels['hertzian-dipole']` lookup are already the promoted names), drop the local copy and the two
  "model: …" tests here.
- **models/ (optional)**: the duality helper `coupling(x, geom, inf)` (a small loop's H_z beside or on the axis from the
  dipole module) could join the module as `loopField` if `ant-small-antenna` needs it.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `accelerated-charge` and `dipole-field`
  (the hidden time control); worked around in this page's CSS.
- **kit (`kit.js`)**: the same request for an explorer time axis (play, scrubber, step keys), and a log range control
  (`scale: 'log'` or a value table) so a page need not keep indices in the URL.

## Learn tree

Suggested leaf (catalogue §4.15): `radio › antennas › near-far` "Blisko i daleko polje" / "Near field and far field",
after `dipole-field`.

## Time

Start 12:09, done 12:37 on 2026-11-09 (spec and number script, model, tests, page, gate green, mutation pass, fresh review and its fixes): one session, about 28 minutes.
