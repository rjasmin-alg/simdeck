# antenna-array: Two antennas together: spacing, phase and steering the beam

| | |
|---|---|
| Task | `antenna-array` (wave 3, Antennas and radiation) |
| Catalogue entry | `ant-array-phasing` in `docs/catalogue.md` §4.15 |
| Kind | build a new simulator |
| Folder | `sims/antenna-array/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | HAM |
| Topic / tags / level | `radio` / `antennas` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dipole-length` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **two identical dipoles fed together add their fields with a path difference and a feed phase; the array factor 2·cos((k·d·cos φ + δ)/2) multiplies the single pattern: λ/2 apart in phase gives a broadside beam, λ/2 apart in antiphase an end-fire one, λ/4 apart fed 90° apart a cardioid with a null at the back; changing the feed phase steers the beam; spacing beyond λ makes extra full-size lobes (grating lobes); more elements make a narrower beam**.

The student: change the spacing and the feed phase, add elements up to eight, watch the pattern and the steering angle; compare the presets.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.15.
5. `sims/dipole-length/` (the model this one builds on) and its `NOTES.md`.

## Sources

- The textbooks under "Antenna notes" below (Purcell & Morin, Griffiths, Balanis, Kraus) and the 50ohm-contents-hr chapters on antennas and propagation for the Croatian terms; mark every number and term you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: Balanis ch. 6, Kraus; builds on ant-dipole-length (the pattern of a set of currents) → §5.26

## Antenna notes (all `ant-` tasks)

- **Who it is for:** the ham radio licence course (classes A and P) and anyone who has seen the 50ohm pictures of an antenna but not why it radiates. These pages go further than the 50ohm ports: a real model computed live, presets, and one contrast that is the stage (c finite against c infinite, parallel against crossed, one element against two, free space against ground). Not a quiz and not a slideshow.
- **Why this list exists** (owner, 2026-11-08): a reviewer's remark on `lc-antenna` said its last step misses time. Field lines kink because a disturbance travels at a finite speed c; without travel time everything shown also holds in the near (reactive, evanescent) field, where nothing radiates. The owner wants new, richer pages rather than a change to `lc-antenna`, which stays as it is. Link it under `related`, never edit it.
- **Standard physics, checked.** Every formula is textbook (Purcell & Morin, *Electricity and Magnetism*; Griffiths, *Introduction to Electrodynamics*; Balanis, *Antenna Theory*; Kraus, *Antennas*) and is checked in SPEC.md with a small script against the book's numbers. Cite chapter and equation in SPEC.md; do not copy figures.
- **Tests check the limits:** with c → ∞ nothing radiates; the far field falls as 1/r and the near field as 1/r² or 1/r³; pattern nulls sit where the theory puts them (along a dipole's axis, sin θ); the received voltage follows the cos law (the polarization loss factor |ê_tx·ê_rx*|²); a half-wave dipole has about 73 Ω radiation resistance and 2.15 dBi; free-space path loss rises 6 dB per doubling of distance. Tie-breaks first, as COMMON.md asks.
- **Concepts, not tools** (COMMON.md §1): no brand of antenna, cable, analyser or modelling program; say "a half-wave dipole", "a three-element Yagi", "a field-strength meter".
- **Time on the stage.** Fields that change in time animate with the kit's play and a time control the lecturer can stop and step; `prefers-reduced-motion` gives a static frame with the time control still usable. Field lines and patterns stay readable on a projector at 1280 and 1920 and in both themes.
- **Croatian terms** from the 50ohm-contents-hr text first (blisko polje, daleko polje, dijagram zračenja, izotropni zračitelj, dobitak, polarizacija, reflektor, direktor, EIRP, ERP), then `kit/glossary.js`. The terms marked *(check)* in catalogue §4.15 are not settled: use them as listed there and copy each into `NOTES.md` under "For the owner". New pairs go into the Term pairs table for the coordinator.
- **Shared models (catalogue §5.26):** keep the retarded field and field-line tracer, the dipole's field, the pattern of a set of currents, the polarization vector or the link budget in its own module file inside your sim folder, pure and tested, so the coordinator can promote it to `models/` later. When the entry builds on another sim, copy its module (COMMON.md §6).
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; suggest a leaf in your report (catalogue §4.15 has the proposed `radio › antennas` subject).

## Overlaps (catalogue §5)

- **§5.26 Antennas: five shared models, and links to existing sims:** Five models, each kept as a pure module inside the first sim that needs it and copied by the ones that build on it (COMMON.md §6), for the coordinator to promote to models/: (1) retarded field of a slowly moving charge and a field-line tracer that follows it (ant-accelerated-charge, reused by ant-dipole-field for its probe); (2) Hertzian dipole field, the exact near-to-far E and H and the stream-function contours (ant-dipole-field, ant-near-field-coupling); (3) pattern of a set of currents: elements with length, position, orientation, amplitude and phase, the sinusoidal current on each, the far-field sum and a numerical directivity integral (ant-dipole-length first; ant-gain-directivity, ant-array-phasing, ant-ground-image as an element plus its image, ant-yagi with induced currents from mutual impedances, ant-small-antenna); (4) polarization vector: a complex unit vector for each antenna and direction, the projection |ê_tx·ê_rx*|² and the ellipse (ant-polarization, ant-tx-rx-polarization, and the mismatch term in ant-link-budget); (5) link budget in dB (ant-link-budget, the ERP/EIRP readout in ant-gain-directivity). The new pages link the existing ones under related (lc-antenna from the two "why it radiates" pages, trap-antenna and swr from ant-small-antenna, skip-distance from ant-ground-image, fading from ant-link-budget); the existing pages are not changed.

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh antenna-array sims/antenna-array` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/antenna-array/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
