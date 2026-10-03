<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ham-modes: notes

Adopted from `single-page-labs/ham-radio-modes-reference-v2.html` (task `docs/tasks/w1/ham-modes.md`, catalogue
`spl-ham-modes`). The simdeck copy is canonical from here on.

## Decisions

- **Class `reference`** (catalogue: "import as `ref`"). The kit mounts it with `steps: 0`, no params and no presets.
  The filter and the selected mode are page state (not in the URL), as in `comms-poster`.
- **One screen instead of a long page.** The original was a scrolling page of 27 cards whose details opened under
  each card on click. Here the 27 cards (name, emission class, bands, bandwidth) fill the left side in the original's
  six groups; the two groups of three share a row. The selected mode's details sit in a panel on the right. SSB
  is selected on load, so the panel is never empty.
- **Filters kept** (the original's six buttons). A filter **dims** the other cards (dashed border, faded) instead of
  hiding them, so the layout stays put and the caption counts the kept modes ("Hitne službe: 6 načina rada od 27").
- **ITU emission classes, decoded.** Each class is split into its three symbols and each symbol is named (carrier
  modulation, modulating signal, type of information), after ITU RR Appendix 1. Where the necessary bandwidth is
  known, the full designation is shown too: 2K70J3E, 6K00A3E, 100HA1A, 16K0F3E. `designator()` follows App. 1 §1
  and is tested on App. 1's own examples (400H, 2K40, 12K5, 180K/181K, 1M25, 202M, 5G65, H002).
  The designation is shown **only** where `nb` is set (four modes): for the rest the original's figure is a channel,
  a filter or a range, not the necessary bandwidth, so `2K70`-style codes would be wrong.
- **Bandwidth on one log axis** (1 Hz to 100 MHz) instead of the original's bars, which were "relative within the
  category" (each card's bar had its own scale). Every mode with a known bandwidth is a grey mark; the selected one
  is drawn above it. 19 of 27 modes have a bandwidth; the rest show "not given as one number".
- **Doppler** on the satellites card is computed (f·v/c, v = 7.5 km/s): about ±3.7 kHz at 2 m, ±11 kHz at 70 cm.
- Group colours are kit series colours on the card edge; the group is also carried by position and its label.

## Deviations from the original (and why)

- **Concepts, not tools** (COMMON.md §1): WSJT-X dropped (FT8, JT65 subtitles); JS8Call → *JS8* (the mode);
  Winlink / VARA → *Radio e-pošta / Radio email*, with "PACTOR or an OFDM modem" and "a network of gateway stations";
  AREDN / HAMNET → *HAMNET / mesh* ("amateur IP networks"), the hardware row (Ubiquiti, MikroTik) dropped,
  Reticulum dropped (NPR kept, as in comms-poster); Meshtastic and POTRES-MESH dropped from LoRa and APRS
  ("APRS over LoRa for telemetry"); LoRa / Meshtastic → *LoRa*; C4FM / Fusion "Yaesu System Fusion", "Wires-X"
  → *C4FM*, "repeaters linked over the internet"; D-STAR "ICOM proprietary", reflector names (DCS/XRF) dropped;
  DMR "BrandMeister" → "linked repeater networks"; WSPRnet → "a public database"; DATV "PlutoSDR" → "a low-cost
  SDR". Standards and public satellites (QO-100, FO-29) stay.
- **Corrections** (each *(check)* where I am not sure of the source):
  - CW was filtered under "voice"; it is in "weak signal" only now.
  - DSB/ISB: subtitle "A9W" and "Retrofrekvencijska scena" were wrong / meaningless; ISB is class B (B8E, B9W);
    H3E and R3E kept as related SSB classes. *(check)*
  - SSTV J2F → **J3F** (analog picture through SSB is "3"). ATV A5C / F5C → **C3F / F3F** (C = vestigial
    sideband, F in third place = television; C in third place is facsimile). *(check)*
  - FM repeater offset 70 cm ±5 MHz → **−7.6 MHz (Region 1)**; 2 m −600 kHz. FM bandwidth 11–16 kHz by
    Carson's rule (±2.5 / ±5 kHz deviation, 3 kHz audio), 16K0F3E is the App. 1 example.
  - FT8 "12-bit CRC" → **14-bit**. *(check)*
  - Olivia "HDPC FEC" → **Walsh–Hadamard**; "4/8/16/32 tones × 125–1000 Hz" → 125–2000 Hz (as its own table). *(check)*
  - THOR "Doppler compensation" and "11/22/44 tones" → IFK (the data is the step between tones, so drift is
    tolerated), variants THOR11, THOR22. "~22 WPM" kept *(check)*.
  - D-STAR "AMBE+2" → **AMBE** (2.4 kbit/s voice + 1.2 FEC); "DD channel 5 MHz" → **~150 kHz**; "80-bit
    slow-speed data" → 1200 bit/s slow data; "ICOM proprietary" → JARL standard. *(check)*
  - DMR "π/4-DQPSK" → **4FSK**.
  - C4FM "VW mode: FDMA video stream" → full-rate voice using the whole channel. *(check)*
  - AREDN/HAMNET "900 MHz" is Region 2 only; Region 1 2.4 / 5.7 GHz. *(check)*
  - ATV "33 cm" marked Region 2.
  - DATV "QO-100 WB 10489.5–10490 MHz" (that is the narrowband beacon area) → **10491–10499 MHz down,
    2401.5–2409.5 MHz up**. *(check)*
  - QO-100 narrowband transponder 500 kHz → **250 kHz**. *(check)*
  - LEO Doppler "±10 kHz (2 m), ±40 kHz (70 cm)" → computed ±3.7 / ±11 kHz (3× too high in the original).
  - DATV is also in the "image" filter (its own tag said image); satellites also in "voice" (their tag said voice).
- Emission classes **added** where the original had none, for the typical way each is sent: WEFAX F3C, FT8 /
  JT65 / WSPR J2D, RTTY F1B / J2B, PSK31 J2B, APRS F2D. *(check)* The other digital modes show "no class given".
- English-only fragments in the Croatian ("Weak-signal", "store-and-forward", "Hardware") are Croatian now.
- Dropped: the "← Svi materijali" link (the kit's back link replaces it), the per-category relative bars, the
  footer (its "ITU RR 2020" reference is in the caption). Fonts: the kit's; the original had no network loads.

## Sources

- The original page (modes, groups, filters, bands, rows, notes).
- ITU Radio Regulations, Appendix 1 (emission classes and the necessary-bandwidth designator, with its examples).
- IARU Region 1 band plan conventions (repeater offsets, HAMNET bands) for the corrections marked above.

## Term pairs

None new: no `[[terms]]` used. Mode names are their standards' names.

## Shared requests

None. `formatHz` mirrors comms-poster's `formatFreq` in another unit; not worth a shared model yet.

## Not checked

- The *(check)* items above against a primary source (written from knowledge, no network used).
- Projector readability on a real projector (screenshots only).

## Time

Start 09:29, done 09:44 (2026-10-03): about 15 minutes of wall-clock time.
