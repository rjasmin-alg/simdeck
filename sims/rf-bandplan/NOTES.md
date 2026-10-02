<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rf-bandplan: notes

Adopted from `single-page-labs/rf-spektar-eu-hr-bandplan.html` (task `docs/tasks/w1/rf-bandplan.md`, catalogue
`spl-rf-bandplan`). The simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`** (catalogue: "import as `expl`"). The original was a free canvas: wheel zoom, drag pan, a
  minimap, hover tooltips, category toggles. In the kit the view is a pair of params, `zoom` (tenths of a doubling,
  0 … 56, so zoom 10 = ×2, max ×48.5 = the original's narrowest 0.15 decades) and `center` (log10 MHz in
  centi-decades), so every view is a URL and a preset. Wheel, drag and double click still work on the stage; they
  set those params (`zoomAt` keeps the frequency under the pointer in place, `panBy` moves by a share of the width).
- **Model kept** from the original: the two data tables (`CATEGORIES`, `EU_BANDPLAN`, ranges unchanged), the range
  9 kHz – 300 GHz, the ITU decade bands, the closed-range overlap rule (the tooltip's "Bandplan:" list), the first
  two tick levels (2, 3, 5 under 3 decades; 1.5, 4, 6, 8 under 1.5) and the frequency units (kHz / MHz / GHz).
- **Drawn as HTML, not canvas**, so every label is a kit-sized string from `strings.js` (≥ 16 px, both languages),
  and the word check sees it. The original drew one row per technology (88 rows, more than a 1080 screen); here the
  bars of a category stack in **lanes** (greedy interval packing over the whole range, so lanes don't jump while
  zooming; tie-breaks: earlier start, then wider, then id), and lanes with nothing in view are dropped. The plan row
  stacks the same way (3 lanes: the original drew overlapping blocks over each other).
- **Labels**: inside the bar if it fits, else to its right if the lane is free up to the next bar, else none
  (`labelModes`). The caption carries every name: the original's hover tooltip became **click to select**, and
  the caption gives the name, range, category or service, note, and the plan blocks of a technology or the
  technologies in a block (narrowest first, six and "and N more"). Related bars get a dashed outline.
- **Presets** (8): the whole spectrum and seven views where bands crowd or collide (HF ham/broadcast, VHF, UHF and
  the digital dividend, L band GNSS, ISM 2.4 GHz, 5G C band vs 9 cm, millimetre waves), each with a selection so
  the caption narrates it. No `sim.json` `entries` yet.
- **Keys**: the original's `F` (fit), `B` (bandplan) and `1`–`9` (categories) are kit keys (full screen, blank,
  presets). Now: preset 1 or `R` for the whole spectrum, `P` for the plan, the panel's switches for the categories,
  `+`/`-` to zoom, `[`/`]` to pan. Arrows were not taken: they are the kit's step keys.
- **Colour**: nine categories on eight series colours; fixed links share `--c1` with WLAN and are hatched. Plan
  services take their category's colour; government/military blocks are hollow and dashed (legend). Categories are
  also told apart by position (their own row, labelled); plan services are not by shape, but by label and caption.
- **Category switches** in two columns hide their written state ("uključeno"): it does not fit; the knob position
  shows it and the kit's state text is `aria-hidden` anyway (`role="switch"` keeps `aria-checked`).

## Deviations from the original (and why)

- **Concepts, not tools** (COMMON.md §1): product and vendor names removed. Starlink Ku/Ka → *LEO Ku* / *LEO Ka*
  (broadband from low orbit); Iridium → *LEO MSS (TDMA)*; Globalstar → *LEO MSS (CDMA)*; Inmarsat L → *GEO MSS L*;
  Sigfox → *UNB 868*; Mioty → *TS-UNB* (the ETSI name of telegram splitting); Meshtastic → *LoRa mesh*; the DMR
  note "Motorola/Hytera" and the NXDN note "Kenwood/Icom" dropped; plan notes "Starlink/HTS" → "LEO and HTS
  satellites", "Inmarsat DL" → "MSS (GEO) downlink", "Iridium/MSS" → "MSS (LEO)". Standards (GSM, LTE, DVB,
  TETRA, DMR, LoRaWAN, Wi-Fi) and public systems (GPS, Galileo, GLONASS, Cospas-Sarsat) stay.
- **FSO dropped** (fixed links, 190–300 GHz in the original): free-space optics is light at ~200 THz, not RF, and
  outside a 300 GHz chart. Listing it at 190–300 GHz would teach a wrong number.
- **Notes corrected** where they were wrong: Starlink Ka 17.8–20.2 GHz said "uplink" (it is the downlink band;
  now "Ka-band downlink"); Globalstar 1610–1618.7 MHz said "LEO S-band" (that range is the L-band uplink; now
  "L-band uplink"). *(check)* both against the operators' filings if a lecturer wants more.
- **Dropped claims I could not stand behind**: DAB+ "HR nema" (Croatia has had DAB+ multiplexes on air for some
  years; now "VHF Band III, digital radio") *(check)*; Sigfox "mreža ugašena" (the network changed owner but
  runs; now "ultra-narrowband, 100 bit/s") *(check)*.
- "Wi-Fi 2.4G"/"Wi-Fi 5G" renamed *Wi-Fi 2,4 GHz* / *Wi-Fi 5 GHz* so "5G" is not read as the mobile generation.
- The third tick level (the original's 1.1, 1.6, 2.1 … every 0.5, giving 460 or 710 MHz) became every half under
  0.7 decades and every tenth under 0.3, so labels stay round; ticks whose labels would touch are thinned, decades
  first.
- Minimap, hover tooltip, two-finger pinch and the zoom readout in the toolbar dropped: the sliders show the
  position and zoom, the caption the view; wheel, drag and double click remain.
- Some original Croatian notes were short English (e.g. "Reduced capability IoT", "Instrument landing"); they are
  now Croatian, with the English kept only where it is the name.
- Fonts: the original loaded JetBrains Mono and Outfit from Google Fonts; now the kit's fonts, no network load.

## Sources

- The original page (data tables, ranges, notes, view limits, tick levels).
- Allocation data: simplified from HAKOM's national frequency allocation table and the CEPT European Common
  Allocation table (ERC Report 25), as the original was. Facts of public regulation (catalogue §6), cited in the
  explanation. *(check)* the 9 cm amateur range (3400–3475 MHz) and the 13 cm range against the current HAKOM plan.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| bandplan / frequency allocation plan | plan namjene |
| allocation (of a band to a service) | namjena |
| service (radio) | služba |
| primary / secondary service | primarna / sekundarna služba |
| refarming | preraspodjela |
| digital dividend | digitalna dividenda |
| short-range device (SRD) | uređaj kratkog dometa |
| uplink / downlink | uzlazna / silazna veza |
| spectrum | spektar |
| decade (log axis) | dekada |

## Shared requests

- **kit.css: `.sd-ctl[hidden]` is still shown** (as in amdahl, lvm-topology, stratis-lab, zfs-btrfs-lab): worked
  around in page CSS for the hidden `sel` param.
- **kit.js: `def.keys` cannot bind named keys** (`ArrowLeft` etc.): the handler lower-cases only one-character
  keys and compares the spec lower-cased, so `'ArrowLeft'` never matches. Explorers could use the arrows to pan,
  since they have no steps. Smallest change: compare `x.key.toLowerCase() === k.toLowerCase()`. Not needed here
  (`[`/`]` pan).
- **Glossary:** the term pairs above with `"src": "simdeck"`.
- **Tags:** `spectrum` (the task's tag) under topic `radio`; both exist in `tags.json`.

## Checks not done here

- Real projector and a lecturer with a clicker (an explorer: `R`, `1`–`8`, `+`/`-`, `[`/`]`, `P`).
- Touch: one-finger drag pans (pointer events, `touch-action: pan-y`); not tried on a real phone or tablet.
- The bars are clickable `div`s, not focusable buttons: keyboard users reach the views through the presets and
  sliders, but cannot select a single bar. *(check)* whether that matters for the course.
- Freezing the original in `single-page-labs` is outside simdeck (coordinator).

## Time

Start 2026-10-02 09:19, done 09:37 (one session, 18 minutes).
