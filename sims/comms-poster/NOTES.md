<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# comms-poster: notes

Adopted from `single-page-labs/komunikacijske-tehnologije-poster.html` (task `docs/tasks/w1/comms-poster.md`,
catalogue `spl-comms-poster`). The simdeck copy is canonical from here on.

## Decisions

- **Class `reference`** (catalogue: "import as `ref`"; playbook §10.4: no controls, fits the screen, kit palette
  and text sizes). First `reference` sim in the repo. The kit mounts it with `steps: 0`, no params and no presets,
  and the page has no panel and no transport (`docs/sim-ui.md` §6, "A reference page").
- **One screen instead of a long poster.** The original was a scrolling page: a grid of nine purpose cards with
  chips (frequency on hover), then a spectrum chart with one row per technology (77 rows, ~2400 px tall). Here the
  two halves are joined: each purpose card carries its own **strip** (the original's log axis, 100 kHz – 500 GHz,
  with the ITU bands behind it, same for every card so cards compare by position) and the **list** of its
  technologies with their ranges written out. The chart's per-row labels became the list; colour is never needed
  to read a name.
- **Lanes:** overlapping bars of one category stack in lanes inside the strip (greedy interval packing,
  `packLanes`, copied from `sims/rf-bandplan/sim.js @ 22e2490`; tie-breaks: earlier start, then wider, then id).
  The gap and the point width are larger than rf-bandplan's (0.03 and 0.02 decades), sized to this page's small
  strips. A single frequency (NFC, APRS, ADS-B) is a round marker (legend).
- **Hover tooltips became click to select**: clicking a name in the list, or a bar, highlights both and puts name,
  range, category and the original's note in the caption. The selection is page state, not a kit param (a reference
  page has none), so it is not in the URL.
- **Type badges** (the original's amateur / professional / mixed per category) keep their word and get a drawn mark:
  dashed ring, solid disc, half disc, so they differ in grayscale and in every font (the original's glyphs ⬡ ◆ ◈
  fell back to identical shapes).
- **Colours:** the same category → series colour mapping as `rf-bandplan` (fixed access shares `--c1` with WLAN
  and is hatched), so the two radio pages agree.
- **Frequencies** are formatted with up to three decimals and trailing zeros dropped, in kHz / MHz / GHz, with a
  decimal comma in Croatian. The original's format rounded (13.56 → 13.6 MHz, 144.8 → 145 MHz, 446.2 → 446 MHz).

## Deviations from the original (and why)

- **Concepts, not tools** (COMMON.md §1), with the same renames as `rf-bandplan`: Starlink → *LEO Ku*; Iridium →
  *LEO MSS (TDMA)*; Globalstar → *LEO MSS (CDMA)*; Inmarsat → *GEO MSS L*; Thuraya → *GEO MSS (telefon/phone)*;
  Sigfox → *UNB 868*; Mioty → *TS-UNB*; Meshtastic → *LoRa mesh*. Vendor and product names dropped from notes:
  D-STAR "ICOM", DMR (ham) "Brandmeister mreža" (now "linked repeater networks"), FT8/WSPR "WSJT-X",
  DMR Tier III "Motorola/Hytera", NXDN "Kenwood/Icom"; *C4FM / Fusion* "Yaesu, WIRES-X" became *C4FM*,
  "digital voice and data, four-level FM". Standards (GSM … 5G, Wi-Fi, DVB, TETRA, DMR, P25, LoRa) and public
  systems (GPS, Galileo, GLONASS, Cospas-Sarsat, QO-100) stay.
- **FSO dropped** (fixed access, 190–400 GHz in the original): free-space optics is light at ~200 THz; the value
  was 1000× too low and would teach a wrong number. 78 → 77 technologies; WiMAX and CBRS stay.
- **Notes corrected:** Globalstar 1610–1618 MHz said "LEO, S-band downlink" (that range is the L-band uplink;
  now "low orbit, L-band uplink", as in rf-bandplan); D-STAR "GMSK/OFDM" → "GMSK" (D-STAR has no OFDM mode)
  *(check)*; FM "stereostereo" typo → "stereo"; Sigfox "gašenje mreže" dropped (the network changed owner but runs,
  as in rf-bandplan) *(check)*; DASH7 "vojni background" → "origins in military cargo tracking".
- English-only fragments in the Croatian notes ("Distress beacon", "Weak signal", "Reduced capability…",
  "Instrument landing, localizer") are now Croatian.
- **Dropped features:** SVG/PNG export of an A0 poster (a reference page has no controls; a lecturer can still
  print the page from the browser), the category toggles in the toolbar legend (controls; every card is always
  shown), the year "2026" in the subtitle (the subtitle is `sim.json` `concept`).
- Fonts: the original loaded JetBrains Mono, Outfit and Space Grotesk from Google Fonts; now the kit's fonts,
  no network load.

## Overlap with rf-bandplan (for the owner)

`rf-bandplan` (explorer, ready) already draws most of these technologies by category on a zoomable log axis with
the allocation plan. This page differs in what it teaches: purpose first (nine cards, amateur vs professional),
all ranges readable at once, no interaction needed. Both are in the catalogue as separate entries, so both were
built; `sim.json` `related` links this page to rf-bandplan. *Owner:* keep both, or list only one on course pages.

## Sources

- The original page (data table, ranges, notes, axis range, ITU bands, category types).
- Corrections cross-checked with `sims/rf-bandplan/NOTES.md` (same author's data, corrected there earlier).

## Term pairs

None new: no `[[terms]]` used. The names are standards' own names; Croatian descriptions follow the original.

## Shared requests

- `packLanes` is now copied in two sims (rf-bandplan, comms-poster). A candidate for `models/` (it is pure, with
  tests in both sims); the only difference is the gap and point width, which could be optional parameters.

## Not checked

- Projector colour and readability on a real projector (screenshots only).
- The notes kept from the original (e.g. "UMTS switched off 2025–2027", "up to 15 km") were not re-verified *(check)*.

## Time

Start 09:17, done 09:27 (2026-10-03): about 10 minutes of wall-clock time.
