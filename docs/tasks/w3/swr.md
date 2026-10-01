# swr: SWR and standing waves

| | |
|---|---|
| Task | `swr` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-swr` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/swr/` |
| Class | explorer |
| Size | M |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `antennas` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **mismatch reflects power; standing wave on the line**.

The student: change load impedance, watch the wave.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/swr.md` (N class: prilagodba, SWR 1 and ∞, SWR 2 → 11 %, SWR 3 → 25 %, formula from P_V and P_R, long-cable effect), `swr_2.md` (E class: worked example P_V = 100 W, P_R = 25 W → s = 3; table `e_swr_werte`), `swr_3.md` (A class: s = R_a/Z or Z/R_a, U_max/U_min, λ/2 spacing, 100 Ω → 2, 10 Ω → 5, folded dipole 240–300 Ω, line loss and the 5 dB example), `swr_meter_1.md`, `swr_meter_2.md` (the meter) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- Catalogue seed: 50ohm swr* (text sections; no 50ohm SWR applet exists).

## Model and presets

- **Scene:** a transmitter on the left, a feed line (drawn λ-scaled, 2–3 wavelengths long) and a load
  (antenna or resistor) on the right. Over the line: the forward wave (arrow right), the reflected wave (arrow
  left, thinner in proportion), and the standing-wave envelope |V(x)| as a curve with U_max and U_min marked
  and the λ/2 spacing between maxima dimensioned; optionally the instantaneous voltage animated (off under
  reduced motion). An SWR-meter card: P_V (forward), P_R (reflected), SWR, % reflected, as measured at the
  transmitter end, and the same at the load end.
- **State (explorer, derived from params):** `{ Z0, R, gamma, swrLoad, reflPct, lossDb, prMeasured, swrMeter,
  envelope: [{x, v}], maxAtLoad: bool }`.
- **Params drive live:** changing R (or Z0) moves the envelope and the meter at once; line loss changes only
  what the meter at the transmitter shows.
- **Rules:**
  1. Purely resistive load R on a line of characteristic impedance Z0: Γ = (R − Z0)/(R + Z0); SWR =
     (1 + |Γ|)/(1 − |Γ|), equal to R/Z0 if R > Z0 and Z0/R if R < Z0 (50ohm `swr_3`).
  2. Reflected power fraction = |Γ|²; SWR from powers s = (√P_V + √P_R)/(√P_V − √P_R) (50ohm `swr`, `swr_2`).
  3. Envelope along a lossless line: |V(d)| ∝ |1 + Γ·e^(−j2βd)|; U_max/U_min = SWR; neighbouring maxima λ/2
     apart (50ohm `swr_3`). R > Z0: maximum at the load; R < Z0: minimum at the load; R = Z0: flat line.
  4. Open or short end: |Γ| = 1, SWR = ∞, all power reflected (50ohm `swr`).
  5. Line loss L dB (one way): the meter at the transmitter sees P_R/P_V = |Γ|²·10^(−2L/10), so it reads a
     better SWR than the load has (50ohm `swr_3`, the "deceptive" cable loss).
  6. Display: SWR above 99 is shown as "∞"; R is clamped to 1 Ω…10 kΩ, plus "open" and "short" buttons.
- **Params:** `R` range 1–1000 Ω, log steps (default 50); `Z0` choice 50 / 75 Ω (default 50); `lossDb` range 0–10 dB
  step 0.5 (default 0); buttons `open`, `short`; `animate` toggle (default on).
- **Presets** (numbers from 50ohm, the rest checked with a script):
  1. `matched` (50ohm `swr`): R = 50 Ω → SWR 1, 0 % reflected, flat envelope.
  2. `book-100` (50ohm `swr_3`): R = 100 Ω → SWR 2, Γ = 0.333, 11.1 % reflected (50ohm table `e_swr_werte`);
     voltage maximum at the load.
  3. `book-10` (50ohm `swr_3`): R = 10 Ω → SWR 5, 44.4 % reflected; minimum at the load.
  4. `swr-3` (50ohm `swr_2`): P_V 100 W, P_R 25 W → SWR 3, 25 %: R = 150 Ω (or 16.7 Ω).
  5. `folded-dipole` (50ohm `swr_3`, folded dipole 240–300 Ω): R = 300 Ω on 50 Ω → SWR 6, 51 %.
  6. `lossy-open` (50ohm `swr_3`, question AG404): open end, 5 dB cable loss → meter sees P_R = P_V/10,
     SWR ≈ 1.92 (the book's "surprisingly good" reading), while SWR at the load is ∞.
- **Steps:** explorer, none.
- **Legend:** forward wave (solid arrow), reflected wave (hollow arrow), envelope (thick curve), U_max / U_min
  markers (▲/▼ with labels), λ/2 dimension. "Changed" marks the meter values when the SWR class changes
  (1, ≤ 2, ≤ 3, worse).
- **Captions:**
  - hr: „Antena od 100 Ω na kabelu od 50 Ω: SWR = 100 / 50 = 2. Reflektira se 11 % snage; na vodu nastaje
    stojni val s maksimumima razmaknutima λ/2.“
  - en: "A 100 Ω antenna on 50 Ω cable: SWR = 100 / 50 = 2. 11 % of the power is reflected; a standing wave
    forms on the line with maxima λ/2 apart."
- **Terms** (50ohm hr): standing wave ratio (SWR) — omjer stojnog vala; standing wave — stojni val;
  characteristic impedance — valna impedancija; feed-point impedance — otpor napajanja (otpor u točki
  napajanja); match — prilagodba; forward / reflected power — upadna (naprijedna) / povratna snaga; feed line —
  napojni (prijenosni) vod; SWR meter — SWR-metar (mjerilo stojnog vala).
- **Misconceptions:** reflected power is "lost" as heat in the transmitter (it is mostly re-reflected; the
  danger is the final stage); a good SWR reading means a good antenna (preset 6); SWR 2 is a disaster (11 %).
- **Out of scope:** reactive loads and the Smith chart, matching networks / antenna tuners, line length
  transformations of impedance, velocity factor.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `swr` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh swr sims/swr` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/swr/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
