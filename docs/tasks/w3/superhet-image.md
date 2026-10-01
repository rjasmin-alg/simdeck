# superhet-image: Superheterodyne and the image frequency

| | |
|---|---|
| Task | `superhet-image` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-superhet-image` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/superhet-image/` |
| Class | explorer |
| Size | M |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `receivers` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **mixing to an IF, and the second frequency that also lands there**.

The student: tune the LO, move a signal onto the image.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/spiegelfrequenzen.md` (f_ZF = |f_e ± f_o|; worked example f_o = 3.955 MHz, f_ZF = 0.455 MHz → 3.500 and 4.410 MHz; image 2·IF away, same side as the LO; preselector) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/ueberlagerungsempfaenger_einfachsuper_1.md` (block diagram, 455 kHz IF, VFO 3.455–30.455 MHz, SSB 2.4 kHz / CW 300 Hz filters) and `ueberlagerungsempfaenger_einfachsuper_2.md` (selectivity); A-class follow-up: `doppelueberlagerungsempfaenger_doppelsuper.md`.
- Catalogue seed: 50ohm ueberlagerungsempfaenger_*, spiegelfrequenzen (these are text sections, not applets; no 50ohm applet exists for this).

## Model and presets

- **Scene:** a frequency axis (MHz) across the stage with: the received signals as labelled arrows (height =
  level in dB), the preselector (input band-pass) as a shaded curve around the tuned frequency, the LO as a
  distinct marker, and two mirror brackets of width f_IF from the LO to the wanted frequency and to the image.
  Below, a second axis at the IF with the IF filter window (e.g. 2.4 kHz) and whatever lands in it, each
  product labelled with where it came from. A block strip on top: antenna → preselector → mixer (+ LO) → IF
  filter → demodulator, as in 50ohm's superhet figure.
- **State (explorer, derived from params):** `{ fTuned, fIF, side: 'high'|'low', fLO, fImage, signals: [{f,
  level, name}], products: [{from, fIFout, levelAfterPreselector, inIFPassband}], heard: [names] }`.
- **Params drive live:** moving the LO (or the tuned frequency) slides both brackets; any signal whose
  |f − f_LO| equals f_IF (within the IF bandwidth) appears in the IF window, attenuated by the preselector.
- **Rules:**
  1. Mixing produces |f_e ± f_o|; the IF filter keeps only the difference that equals f_IF:
     f_IF = |f_e − f_o| (50ohm `spiegelfrequenzen`).
  2. Two input frequencies satisfy it: f_o + f_IF and f_o − f_IF. The one you want is the wanted frequency;
     the other is the image (zrcalna frekvencija); they are always 2·f_IF apart (50ohm `spiegelfrequenzen`).
  3. LO above the wanted frequency (high-side) → image 2·f_IF above it; LO below → image 2·f_IF below
     (50ohm `spiegelfrequenzen`).
  4. Only the preselector in front of the mixer can reject the image; the IF filter cannot tell them apart
     (50ohm `spiegelfrequenzen`, last paragraph). Model: passband ±B/2 around f_tuned passes at 0 dB, outside it
     attenuation rises by `slope` dB per MHz up to a floor of `maxAtt` dB *(simplified, check)*.
  5. A product is "heard" if it falls inside the IF passband and its level after the preselector is above the
     receiver's noise floor (−120 dBm default, illustrative).
  6. Selectivity (who is next to the wanted signal) is set by the IF filter width: SSB ≈ 2.4 kHz, CW
     ≈ 300 Hz (50ohm `ueberlagerungsempfaenger_einfachsuper_1`).
- **Params:** `fTuned` range 3.5–30 MHz step 1 kHz (default 3.500); `fIF` choice 0.455 / 9.0 / 10.7 MHz (default
  0.455); `side` choice high / low (default high); `preselB` range 0.1–5 MHz (default 0.5); `preselOn`
  toggle (default on); `ifBW` choice 0.3 / 2.4 / 9 kHz (default 2.4).
- **Presets:**
  1. `book` (from 50ohm `spiegelfrequenzen`): f_o = 3.955 MHz, f_IF = 0.455 MHz, high side → wanted 3.500 MHz,
     image 4.410 MHz; both give 0.455 MHz. A test signal on 4.410 is heard when the preselector is off.
  2. `broadcast-image` (derived): tuned 14.200 MHz, IF 455 kHz, high side → LO 14.655, image 15.110 MHz: a
     strong short-wave broadcaster in the 19 m band (15.10–15.80 MHz *(check)*) lands on the IF. With a
     0.5 MHz preselector it is 0.91 MHz outside the passband and attenuated; with it off it is heard.
  3. `high-if` (derived): same 14.200 MHz with IF 10.7 MHz → LO 24.900, image 35.600 MHz: 21.4 MHz away,
     trivially filtered. Why HF receivers use a high first IF.
  4. `low-side` (derived): tuned 7.100 MHz, IF 455 kHz, low side → LO 6.645, image 6.190 MHz (below).
  5. `book-tuning` (from 50ohm `ueberlagerungsempfaenger_einfachsuper_1`): VFO 3.455–30.455 MHz covers
     3–30 MHz with a fixed 455 kHz IF; sweep the tuned frequency and watch the LO move with it.
- **Steps:** explorer, none.
- **Legend:** wanted signal (solid arrow, "fₑ"), image (hollow arrow, "f_zrc"), LO (diamond, "f_o"), preselector
  (shaded curve), IF window (bracket). "Changed" marks any signal that newly enters or leaves the IF window.
- **Captions:**
  - hr: „Oscilator na 3.955 MHz, međufrekvencija 0.455 MHz: 3.500 MHz i 4.410 MHz daju istu međufrekvenciju.
    Ako je 3.500 MHz željena, 4.410 MHz je zrcalna frekvencija, za 2 × 0.455 MHz iznad nje.“
  - en: "LO at 3.955 MHz, IF 0.455 MHz: 3.500 MHz and 4.410 MHz both give the same IF. If 3.500 MHz is the
    wanted frequency, 4.410 MHz is its image, 2 × 0.455 MHz above it."
- **Terms** (50ohm hr): superheterodyne receiver — superheterodinski prijamnik; intermediate frequency (IF) —
  međufrekvencija (ZF); image frequency — zrcalna frekvencija; mixer — mješač; local oscillator (VFO) —
  oscilator (VFO); band-pass filter — pojasni filtar; selectivity — selektivnost (bliska selektivnost);
  TRF receiver — prijamnik s izravnim pojačanjem.
- **Misconceptions:** a narrower IF filter removes the image (rule 4); the image is a harmonic or some odd
  artefact (it is an ordinary signal on another frequency); one IF value is best for everything (high IF eases
  image rejection, low IF eases selectivity: the double superhet, out of scope).
- **Out of scope:** double conversion (`doppelueberlagerungsempfaenger_doppelsuper`), mixer spurs and
  intermodulation, direct conversion, phase-noise.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `superhet-image` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh superhet-image sims/superhet-image` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/superhet-image/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
