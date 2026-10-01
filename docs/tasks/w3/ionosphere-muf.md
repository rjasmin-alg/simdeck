# ionosphere-muf: Ionosphere, MUF and the dead zone

| | |
|---|---|
| Task | `ionosphere-muf` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-ionosphere-muf` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/ionosphere-muf/` |
| Class | explorer |
| Size | M |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `propagation` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `skip-distance` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **layers by day and night, skip distance, the zone nobody hears**.

The student: change time of day and frequency.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.
5. `sims/skip-distance/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/ionosphaere.md` (N: sky/ground wave, mrtva zona), `ionosphaere_2.md` (E: D 50–90 km absorbs below ≈ 10 MHz and vanishes at night; E 90–130 km, ≈ 10 MHz, > 2000 km per hop; F2 up to 450 km, up to 4000 km per hop; solar cycle), `ionosphaere_3.md` (A: day/night band behaviour, solar flux), `muf_luf_1.md` (MUF and LUF; MUF ≈ 7.5 MHz example; LUF above MUF), `muf_luf_2.md` (critical frequency, MUF ≈ f_c / sin α for α > 40°, MUF at 45° = 7.5 MHz, FOT = 0.85·MUF, D attenuation ∝ 1/f²), `tote_zone_1.md`, `tote_zone_2.md` (dead zone grows with frequency and with flatter angles), `sprungdistanz_1.md`, `sprungdistanz_2.md` (E ≤ 2000 km, F2 ≤ 4000 km, power has no effect) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- `/home/rjasmin/projects/50ohm-contents-hr/contents/html/sprungdistanz_applet.html` (the geometry reused via `skip-distance`).
- `/home/rjasmin/projects/KAKA/KK2_Napredne_Krizne_Komunikacije.pptx` slide "HF operacije u kriznim uvjetima" and `/home/rjasmin/projects/KAKA/KK_Operativni_Prirucnik.docx` §7.3 (80 m: night to 500 km, day 50–150 km NVIS) for the operational framing.
- Catalogue seed: 50ohm ionosphaere*, muf_luf_*; near 50ohm-skip-distance.

## Model and presets

- **Scene:** a side view of a curved Earth (arc) with the transmitter at the left, the D, E and F2 regions as
  bands at their heights (D 50–90 km, E 90–130 km, F2 ≈ 300 km; E and D drawn only by day), and a fan of rays
  leaving the antenna at elevations 1°…89°: rays that return are drawn to their landing point, rays that
  escape continue upwards (dashed), rays absorbed in D stop there (crossed). On the ground: the ground-wave
  range (solid band), the dead zone (hatched, "mrtva zona") from there to the skip distance, and the area
  reached by sky wave. A side card: f, foF2, MUF for 45° and for the lowest angle, LUF, skip distance.
- **State (explorer, derived from params):** `{ f, day, foF2, foE, luf, hF, hE, groundKm, rays: [{elev, fate:
  'E'|'F2'|'escape'|'absorbed', landKm}], skipKm, farKm, deadZone: [groundKm, skipKm]|null, muf45 }`.
- **Params drive live:** changing frequency, time of day or foF2 re-traces all 89 rays and moves the dead zone.
- **Reused from `skip-distance`** (50ohm `sprungdistanz_applet.html`: Earth circle, layer circle, ray at an
  elevation angle reflected back to the ground; geometry only). **New:** frequency-dependent return (MUF),
  D absorption (LUF), day/night layers, the dead zone, a ray fan instead of one ray.
- **Rules:**
  1. Geometry (spherical Earth R = 6371 km, mirror reflection at height h): incidence angle at the layer
     sin i = R·cos β/(R + h); one-hop ground distance d = 2R·(90° − β − i) in radians *(derived)*.
  2. A ray returns from a region if f ≤ f_c / cos i (secant law). For a flat Earth this is the book's
     MUF ≈ f_c / sin α (valid for α > 40°, 50ohm `muf_luf_2`); vertical incidence: MUF = f_c.
  3. By day the ray first meets E (foE, h_E = 110 km): returned there if rule 2 holds for E; otherwise it
     goes on to F2. At night E and D are gone (50ohm `ionosphaere_2`).
  4. By day, f < LUF → absorbed in D (two passes per hop; attenuation ∝ 1/f², 50ohm `muf_luf_2`); D is
     insignificant above about 10 MHz; 80 m and 160 m are empty by day (50ohm `ionosphaere_2`).
  5. Skip distance = the shortest landing distance among returned rays; dead zone = (ground-wave range, skip
     distance) if skip > ground-wave range (50ohm `tote_zone_1`). Higher f → larger dead zone; flatter rays →
     farther (50ohm `tote_zone_2`).
  6. Rays are traced at integer elevations 1°…89° (deterministic); ties do not arise.
  7. Single hop only; power has no effect on skip distance (50ohm `sprungdistanz_2`).
- **Params:** `f` select of amateur bands 3.6 / 7.1 / 10.1 / 14.2 / 21.2 / 28.5 MHz (default 7.1); `time` choice
  day / night (default night); `foF2` range 3–14 MHz step 0.1 (default 5.5: night); `foE` 3 MHz by day
  *(check)*; `luf` 5 MHz by day *(check)*; `groundKm` range 20–150 km (default 100, cf. KK2 "80 m danju
  50–100 km"); `hF2` range 200–400 km (default 300).
- **Presets** (computed with the rules; foF2 values chosen to match the books):
  1. `book-night-40m` (50ohm `muf_luf_1`/`muf_luf_2`: August night 2024, MUF ≈ 7.5 MHz at 45°): night,
     foF2 5.5 MHz (→ MUF(45°) 7.46 MHz), f = 7.1 MHz → rays up to 48° return, skip ≈ 510 km, dead zone
     100–510 km.
  2. `night-80m-nvis`: night, f = 3.6 MHz < foF2 → every ray returns, no dead zone (NVIS; KK2 "80 m noću do
     500 km", handbook §7.3).
  3. `day-80m`: day, f = 3.6 MHz < LUF → all sky-wave rays absorbed; only the 100 km ground wave (50ohm
     `ionosphaere_2`).
  4. `day-20m`: day, foF2 8 MHz *(check)*, f = 14.2 MHz → highest returned ray 30°, skip ≈ 930 km.
  5. `solar-max-10m`: day, f = 28.5 MHz: foF2 8 → all rays escape (band closed, solar minimum); foF2 12 →
     open, skip ≈ 1500 km (50ohm `ionosphaere_2`, `ionosphaere_3`: 10 m works by day only near solar maximum).
- **Steps:** explorer, none.
- **Legend:** returned ray (solid), escaping (dashed, "↑"), absorbed (stops with "×"), ground wave (thick
  band), dead zone (hatched, labelled), regions by letter. "Changed" marks the dead-zone edges when they move.
- **Captions:**
  - hr: „Noć, 7.1 MHz, kritična frekvencija 5.5 MHz: vraćaju se samo zrake do 48°. Najbliža točka prostornog
    vala je 510 km daleko, a prizemni val ne seže dalje od 100 km: između je mrtva zona.“
  - en: "Night, 7.1 MHz, critical frequency 5.5 MHz: only rays up to 48° come back. The nearest sky-wave
    landing is 510 km away and the ground wave ends at 100 km: in between is the dead zone."
- **Terms** (50ohm hr): ionosphere — ionosfera; sky wave / ground wave — prostorni / prizemni val; dead (skip)
  zone — mrtva zona; skip distance — skok-udaljenost; critical frequency — kritična frekvencija; MUF / LUF —
  najviša / najniža upotrebljiva frekvencija; radiation (elevation) angle — kut zračenja; region (layer) —
  regija (sloj).
- **Misconceptions:** more power closes the dead zone (rule 7); higher frequency always goes farther (it
  escapes above the MUF); the dead zone means the frequency is free (50ohm `tote_zone_2`: you hear only one
  side of a QSO).
- **Out of scope:** multi-hop, sporadic E, seasons and the solar cycle as a model (only through foF2), real
  propagation prediction programs, polarisation.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `ionosphere-muf` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh ionosphere-muf sims/ionosphere-muf` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ionosphere-muf/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
