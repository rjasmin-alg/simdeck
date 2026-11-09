<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dipole-field: notes

Task `docs/tasks/w3/dipole-field.md`, catalogue `ant-dipole-field` (§4.15, shared model 2 of §5.26). A new native
explorer; nothing copied from outside simdeck, so `sim.json` has no `credits`. The rules and numbers are in `SPEC.md`.

## Decisions

- **Exact Hertzian solution, drawn as contours.** The field lines are contours of the stream function
  Ψ = sin²θ·[cos(ωt − kr)/(kr) − sin(ωt − kr)], traced with marching squares on a grid of about 4.5 px cells and chained
  into polylines (drawn on a canvas; everything with text is SVG on top, at 1:1 pixels). Equal steps of Ψ are equal
  flux, so the lines appear out of the dipole and vanish into it as p(t) changes, instead of a fixed number of lines
  seeded at the dipole (which could not show closed loops at all). About 36 ms a frame at 1920×1080.
- **The physics is its own module**, `hertzian-dipole.js`: pure, registers as `SimdeckModels['hertzian-dipole']` in
  the page and is `module.exports` under node, so the coordinator can move it to `models/` unchanged (catalogue §5.26
  model 2; `ant-near-field-coupling` builds on it). It knows nothing of units, strings or the page. `sim.js` adds the
  situation (10 MHz, λ/50, 1 A), the params, zones, presets and SI units.
- **One concrete dipole**: 10 MHz (λ = 29.98 m, shown as 30 m), a short dipole λ/50 = 0.60 m long, 1 A. The numbers in
  V/m and mA/m are then real, and the power through a sphere (0.158 W, R_rad = 0.32 Ω) is Balanis' to 4 digits. E/H,
  the phase and the slopes do not depend on this choice.
- **Distances in wavelengths**, probe 0.04 … 1.5 λ. The lower end is 2·l: closer in, a real wire's field is not the
  point dipole's. The upper end and the picture's width (−0.13 … 1.62 λ) keep the pinch-off (0.15 … 0.23 λ) large
  enough to see at 1920×1080; at first the probe went to 2 λ, which made the near field too small on the stage.
- **Time is the phase ωt in degrees** (0 … 355, 5° steps), wrapping round: play runs 5° every 70 ms (a period in 5 s)
  until paused; reduced motion jumps 45° once a second. → / PgDn and ← / PgUp step 15° (24 per period, so 0°, 45°, 90°
  … are reachable); Home 0°, End 355°. P plays (Space stays the kit's). The scrubber is in the transport bar, as in
  `accelerated-charge`. The time is a param, so a link opens at that moment.
- **Zones**: reactive near field r < λ/2π, radiating near field λ/2π … λ, far field from λ (boundary belongs to the
  outer zone). The 50ohm text (after the German regulator) puts the far field of wire antennas at about 4 λ; for a
  point dipole E/H is within 2.5 % of 377 Ω at λ and the phase within 0.25°, so the page marks λ and the explanation
  names the 4 λ rule and says the boundary is not sharp. With c infinite there are no zones ("all of it is near field").
- **c infinite** keeps the same λ as a ruler and keeps only the instantaneous terms (E ∝ p/r³, H ∝ I/r²). The lines
  then are the static dipole's, r = C·sin²θ, scaled by cos ωt: they grow, shrink, vanish at 90° and come back reversed.
  E/H = η0/kr and H is exactly 90° ahead at every distance; the mean power is zero.
- **The pinch-off.** Worked out exactly (SPEC §4): the X point is born at kr = √2 (0.225 λ, the catalogue's "about a
  quarter wavelength") at ωt = 45.76° and runs into the dipole by 90°. The page draws the separatrix (only its pieces
  through the X point; the same level runs elsewhere too) thick in ink, a × and its mirror image, and the label.
- **Probe readout**: E_θ as an arrow (scaled by its amplitude, positive down), H_φ as a ring with a cross (into the page)
  or a dot, sized by its amplitude; a table with |E|, |H|, E/H, H's lead and the power through the sphere of radius r
  (the same at every r: the clearest sign that the large near-field E and H carry nothing extra away). Plot 1: E_θ and
  H_φ over one period, each over its amplitude (in the far field the two curves lie on each other; in the near field
  H's peak is a quarter period earlier). Plot 2: |E| and 377 Ω·|H| against r, log–log, with slope labels.
- **"H ahead of E"** is reported rather than a signed "phase of E − H": it is 0 … 90° for this dipole and reads directly.
- **Tags**: `em-waves`, `antennas` (the task's; both in `tags.json`). Topic `radio`, level `core`. `related`:
  `accelerated-charge` (the page before), `lc-antenna` (the antenna notes ask for it; not changed), `lambda-f`.
- **Idea credit** (owner, 2026-11-09): the exact wording from the task, in the transport bar, both languages; not in
  `sim.json` `credits`, no person named.
- **No glossary terms** (`[[…]]`): none of the terms are in `kit/glossary.js`; pairs below.

## Deviations from the task

- **The catalogue's formula has a sign error.** It writes sin²θ·[cos(kr−ωt)/(kr) − sin(kr−ωt)]. For a dipole
  p(t_r) = g(u), u = kr − ωt, the outgoing solution's stream function is ∝ g(u)/(kr) − g′(u); with g = cos that is
  cos u/(kr) **+** sin u, so the catalogue's version (cos u/(kr) − sin u) satisfies no choice of g and is not a
  solution of Maxwell's equations. The page uses the textbook form sin²θ·[cos(ωt−kr)/(kr) − sin(ωt−kr)] (the same as
  cos u/(kr) + sin u), and a test checks that its derivatives give the field (a mutation to the catalogue's order
  fails it). The catalogue line itself is the coordinator's to fix (docs/ is outside this task).
- "Pinch off from about a quarter wavelength": exactly kr = √2, 0.225 λ; the page says "about 0.23 λ" and the
  explanation "kr = √2 (0.225 λ, about a quarter wavelength)".
- The far-field boundary is marked at λ (see Decisions), not at 4 λ.

## Sources

- D. J. Griffiths, *Introduction to Electrodynamics*, 4th ed., §11.1.2 (the oscillating electric dipole; the far zone
  only) and problem 11.4 / the full near-to-far fields *(check problem number)*.
- C. A. Balanis, *Antenna Theory*, 3rd ed., §4.2: eqs. 4-8a … 4-10c (E_r, E_θ, H_φ of the infinitesimal dipole), 4-16
  (radiated power η·π/3·(I0·l/λ)²), 4-19 (R_r = 80π²(l/λ)²), 4-26a (far-field E_θ) *(check eq. numbers; the book was
  not at hand, numbers recomputed from the formulas)*. §4.2.2–4.2.4: near (kr ≪ 1), intermediate (kr > 1), far (kr ≫ 1).
- E. M. Purcell, D. J. Morin, *Electricity and Magnetism*, 3rd ed., appendix H (radiation by an accelerated charge;
  the kink picture this page continues from `accelerated-charge`).
- H. Hertz, 1889, for the contour picture (the catalogue's seed). Kraus, *Antennas*: not used for a number.
- 50ohm-contents-hr: `sections/nahfeld.md`, `sections/fernfeld.md`, `solutions/AK103.md`, `sections/naeherungsformel_*.md`
  (reaktivno blisko polje d < λ/2π, zračeće blisko polje to 4 λ, daleko polje, valni otpor polja 377 Ω, "the energy in
  the reactive near field is not used but returned to the antenna phase-shifted", "valni otpor polja is below 377 Ω in
  the radiating near field of a dipole" — which the page shows: 257 … 377 Ω).
- `sims/accelerated-charge/sim.js` @ 94f3096: its retarded field, copied unchanged into `retarded.js` for the
  cross-check (COMMON.md §6; the model is not in `models/` yet).

## Checks

- **Numbers**: a separate script (scratch, not committed) compared the module with the book formulas: the stream
  function's derivatives against the field (1e-6), phasors against the time domain, E/H at kr = 1 (η0/√2) and its
  minimum (256.65 Ω at kr = 1.169, also derived analytically: |N/D|² = (1 − y + y²)/(1 + y), y = 1/(kr)², minimum at
  y = √3 − 1), the radiated power and R_rad against Balanis, 1/r³, 1/r², 1/r, the X point's birth (numerically
  0.2251 λ at 45.76°, analytically kr = √2 from ∂Ψ/∂x = ∂²Ψ/∂x² = 0). All in SPEC.md with the tests that hold them.
- **Cross-check with the retarded field** (`ant-accelerated-charge`'s model, β = 0.001, a charge oscillating against a
  fixed opposite charge): E_θ and H_φ agree with this module to 1 % of their amplitude at r = λ/10, λ/4 and λ.
- **Mutation pass**: 45 deliberate breaks of `hertzian-dipole.js` and `sim.js`, one at a time (each term and sign of
  E_θ, E_r and H_φ, the catalogue's phase order, the stream function's sign, the phasors, the flow's conjugate, the
  saddle classification and c infinite, the clip, the levels, both contour tie-breaks, the saddle-cell decision, NaN
  cells, closing loops, crossing directions, edge interpolation, λ/50, η0, the zone boundaries and their tie-breaks,
  time wrapping, the zones and c parsing, the current's sign, the ⅔, the profile and period plots, presets, level count,
  ns, the pinch phase, R_MAX, degrees vs radians). 44 failed a test; the 45th was a normalisation line that could not
  be reached (H's lead is always 0 … 90°): the `lead === −180` line is removed, the wrap into [−180°, 180°) kept, and
  a test added that the lead stays in 0 … 90° and falls with r.
- **Fresh review** (a separate agent with no part in the build re-derived the physics and broke rules in a copy, about
  25 mutations). It confirmed the fields, the sign of "H ahead of E", the pinch-off at kr = √2 and 45.76° (the only
  other root of ∂Ψ/∂x = ∂²Ψ/∂x² = 0 is x = 0), the E/H minimum, the power (Re(E·H*) = 1/x² exactly) and every preset
  number. It found: the c-infinite plumbing of the probe's instant values, the period and distance plots and the
  broadside arrows untested (five mutations survived; a test added, all five now fail); the summary's "from 600 Ω close
  in to 377 Ω" implying a steady fall (now "over 1000 Ω close in, 257 Ω at least, then 377 Ω"); "E/H is large" in the
  reactive near field, false between kr 0.71 and 1 (reworded); "loops travel at c" close in, where their centres move
  at 1.1 … 1.3 c (now "travel out, far out at c"); "izohipse" (now "razinske krivulje"); a misattached clause in the
  explanation's first sentence; "cos φ" in the units note (φ is also the azimuth; now "cos(lead of H)"); two wrong
  comments. Left as is: the c-infinite "no X point" test passes partly by construction (`saddles` returns early with c
  infinite, since E_θ = cos φ/x³ is zero everywhere at 90° and a sign search would be meaningless); the closed-loop
  test, which sees Ψ_inf itself, is the real check.
- `npm run gate -- dipole-field`: all rules pass; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus every preset at 1920×1080.

## For the owner

Terms not settled (used as below, each *(check)*):

- **valni otpor polja** (wave impedance of the field, E/H): 50ohm-contents-hr uses it 24 times for Z0 = 377 Ω and
  keeps **valna impedancija** for lines; the catalogue lists "valna impedancija (377 Ω)" as settled. The page follows
  50ohm ("valni otpor polja slobodnog prostora"); both are in `aliases`.
- *(check)* **petlja se odvaja / odvajanje petlje** (a loop pinches off, breaks away), and **silnice se stežu** (the
  lines pinch).
- *(check)* **H je … ispred E** (H is … ahead of E) for the phase lead.
- *(check)* **snaga kroz sferu** (power through the sphere), **suprotni smjer** (opposite sense of a field line).
- *(check)* **kratki dipol** (short dipole; 1 hit in 50ohm) and **Hertzov dipol** (1 hit).
- The far-field mark at λ instead of 50ohm's 4 λ (see Decisions): the owner may prefer 4 λ, which would need the
  picture to reach 4 λ.

## Term pairs (for the coordinator's glossary)

| English | Croatian | Status |
|---|---|---|
| reactive near field | reaktivno blisko polje | 50ohm-contents-hr |
| radiating near field | zračeće blisko polje | 50ohm-contents-hr |
| far field | daleko polje | 50ohm-contents-hr |
| field line | silnica (električnog polja) | 50ohm-contents-hr |
| wave impedance (of the field) | valni otpor polja | 50ohm-contents-hr (catalogue: valna impedancija) |
| reactive (power, energy) | jalov | 50ohm-contents-hr |
| short dipole | kratki dipol | *(check)*, 1 hit |
| Hertzian dipole | Hertzov dipol | *(check)*, 1 hit |
| a loop breaks away / pinches off | petlja se odvaja | *(check)* |

## Shared requests

- **models/**: `hertzian-dipole.js` is model 2 of catalogue §5.26, ready to promote as `models/hertzian-dipole.js`
  (its registration line already uses `SimdeckModels['hertzian-dipole']`). Its rule tests are the "stream function",
  "field", "phasors", "probe", "limits", "lead", "pinch-off", "field lines", "grid" and "crossings" tests in
  `sim.test.js`, and the contour tie-breaks.
- **models/**: model 1 (`retarded.js`, from `accelerated-charge` @ 94f3096) is copied here only for a test. When it is
  promoted, this sim's cross-check test should require it from `models/` and `retarded.js` can go.
- **kit (`kit.css`)**: the same `.sd-ctl[hidden] { display: none; }` request as `accelerated-charge` (the hidden time
  control); worked around in this page's CSS.
- **kit (`kit.js`)**: the same request as `accelerated-charge` for an explorer time axis (play, scrubber, step keys);
  this page builds them as that page does, here with a wrapping period.
- **docs/catalogue.md**: the `ant-dipole-field` formula's sign (Deviations).

## Learn tree

Suggested leaves (catalogue §4.15): new subject `radio › antennas` "Antene i zračenje" / "Antennas and radiation":
leaf `why` "Zašto antena zrači" / "Why an antenna radiates" (`accelerated-charge`, then this sim, `lc-antenna`), and
leaf `near-far` "Blisko i daleko polje" / "Near field and far field" (this sim, later `ant-near-field-coupling`).

## Time

Start 09:44, done 10:20 on 2026-11-09 (model, tests, page, gate green, mutation pass, fresh review and its fixes): one
session, about 36 minutes.
