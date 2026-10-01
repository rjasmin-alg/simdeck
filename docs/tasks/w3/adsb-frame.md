# adsb-frame: Decoding an ADS-B frame

| | |
|---|---|
| Task | `adsb-frame` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-adsb-frame` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/adsb-frame/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `radio-networks` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **Mode S frame fields, CPR position**.

The student: step through one frame.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- No local course material. Use J. Sun, *The 1090 Megahertz Riddle: A Guide to Decoding Mode S and ADS-B Signals*, 2nd ed. (TU Delft OPEN, CC BY 4.0 *(check)*), chapters on ADS-B basics, aircraft identification and airborne position (the example frames used in the presets); ICAO Annex 10 Vol. IV and RTCA DO-260B (formats) *(check)*. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`, "Građa Ethernet okvira i MAC adresa" (frame, address and FCS fields, for the analogy with a frame layout and a check sequence).
- Catalogue seed: intercept (ideas only; nothing copied).

## Model and presets

- **Scene:** a 112-bit strip for one Mode S extended squitter, grouped and labelled DF (5) | CA (3) | ICAO
  address (24) | ME message (56) | PI parity (24), with hex above and bits below; a decode panel that fills in
  field by field; for position messages, a second strip for the paired odd/even frame and a small map panel
  showing the CPR latitude zones (60 even / 59 odd) and the decoded point.
- **State:** `{ frames: [{hex, bits, rxOrder}], cursor: {frame, field}, decoded: {df, ca, icao, tc, callsign,
  altitudeFt, cprFormat, latCpr, lonCpr, j, latEven, latOdd, nl, m, lat, lon}, crcRemainder }`.
- **One step:** reveal and decode one field (or one CPR sub-step), in frame order, then the CPR algorithm.
- **Rules** (ICAO Annex 10 Vol. IV and RTCA DO-260B for the formats *(check)*; worked through in J. Sun, *The
  1090 Megahertz Riddle*, 2nd ed., chapters "ADS-B basics", "Aircraft identification", "Airborne position"):
  1. Frame layout as in the scene; DF 17 = ADS-B extended squitter; ICAO = 24-bit aircraft address in hex.
  2. Type code TC = first 5 bits of ME: 1–4 identification, 9–18 airborne position (barometric altitude).
  3. Identification: 8 characters of 6 bits each from ME bits 9–56 using the table `#ABCDEFGHIJKLMNOPQRSTUVWXYZ#####
     ###############0123456789######` (index 32 = space).
  4. Altitude (TC 9–18): 12 bits, Q-bit (8th bit) = 1 → remove it, value × 25 − 1000 ft.
  5. CPR: F bit (0 even / 1 odd); 17-bit lat and lon, divided by 2¹⁷. Global decoding needs one even and one odd
     frame (received within 10 s *(check)*): j = ⌊59·lat_e − 60·lat_o + ½⌋, lat_e = (360/60)·((j mod 60) +
     lat_cpr_e), lat_o = (360/59)·((j mod 59) + lat_cpr_o), subtract 360 if ≥ 270; both must give the same NL
     (number of longitude zones), else wait for another pair.
  6. Use the latitude of the newer frame; m = ⌊lon_e·(NL − 1) − lon_o·NL + ½⌋, n = max(NL − i, 1) with i = 0 for
     even, 1 for odd, lon = (360/n)·((m mod n) + lon_cpr_of_newer), subtract 360 if ≥ 180.
  7. PI: CRC-24 with generator 0x1FFF409 over the whole frame; remainder 0 = no error detected (DF 17 has no
     address overlaid).
- **Params:** `frame` select of the presets; `newer` choice even / odd (which frame arrived last, preset 2).
- **Presets** (all decoded with a script):
  1. `identification` (from *The 1090 Megahertz Riddle*): 8D4840D6202CC371C32CE0576098 → DF 17, CA 5, ICAO
     4840D6, TC 4, callsign "KLM1023", CRC remainder 0.
  2. `position` (from the same book): even 8D40621D58C382D690C8AC2863A7, odd 8D40621D58C386435CC412692AD6 → TC 11,
     altitude 38 000 ft, j = 8, lat_e = 52.2572°, lat_o = 52.2658°, NL = 36, even newer → lat 52.25720°, lon
     3.91937°.
  3. `bit-error` (derived): preset 1 with one bit flipped → CRC remainder ≠ 0, frame rejected.
- **Steps:** preset 1: 7 (DF, CA, ICAO, TC, callsign, PI, verdict); preset 2: 14 (both frames' fields, then j,
  two latitudes, NL check, longitude, result); preset 3: 7.
- **Legend:** field groups by band and label, decoded field (filled), bit currently read (outlined), flipped bit
  (× ), CPR zone lines (even solid, odd dashed). "Changed" marks the field decoded in this step.
- **Captions:**
  - hr: „Bitovi 33–37 su kod vrste (*type code*) 4: identifikacija. Šest po šest bitova daje znakove K, L, M, 1, 0,
    2, 3: let KLM1023.“
  - en: "Bits 33–37 are type code 4: identification. Six bits at a time give K, L, M, 1, 0, 2, 3: flight
    KLM1023."
- **Terms:** frame — okvir (URM); field — polje; aircraft address — adresa zrakoplova (check); parity / CRC —
  paritet / CRC (URM ch07); type code — kod vrste (check); position encoding (CPR) — kompaktno kodiranje
  položaja (check); latitude / longitude — geografska širina / dužina.
- **Misconceptions:** one message holds the full position (CPR needs a pair, or a reference position); ADS-B is
  encrypted or authenticated (it is neither: anyone can read it, one line, no how-to); the callsign is the
  aircraft address (they are different fields).
- **Out of scope:** the 1090 MHz PPM physical layer, velocity messages, local CPR decoding, Mode A/C, receiving
  hardware and software.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `adsb-frame` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh adsb-frame sims/adsb-frame` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/adsb-frame/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
