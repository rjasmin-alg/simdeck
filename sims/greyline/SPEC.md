<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# greyline: spec

One concept: **the grey line**, the ring of twilight between day and night, where HF signals on the lower bands go far
because the D region has faded (dusk) or not yet formed (dawn) while the F region still refracts. An explorer: date and
time sliders, play, presets, a twilight depth switch and two stations. The model is `sim.js`; tests are `sim.test.js`
(each rule below has a test that fails when the rule is broken, except the smallest polynomial terms of §2, which
change the result by under 1e-5°: NOTES.md "Checks").

## 1. Time

| Rule | Value | Source |
|---|---|---|
| Calendar | the year **2026** (365 days); the date slider is the day of the year 1 … 365 | decision (NOTES.md) |
| Day of year → date | 1 = 1 Jan, 59 = 28 Feb, 60 = 1 Mar, 79 = 20 Mar, 172 = 21 Jun, 355 = 21 Dec, 365 = 31 Dec | 2026 calendar |
| Date → day of year | 29 Feb counts as 28 Feb (the "now" preset in a leap year) | decision |
| Time | minutes UTC, 0 … 1435 in 5-minute steps; rounded to the nearest step after clamping | decision |
| Julian Day | Meeus ch. 7 (Gregorian): J2000.0 = 2451545.0; 1957 Oct 4.81 = 2436116.31 (ex. 7.a); 1987 Jan 27.0 = 2446822.5; 1988 Jun 19.5 = 2447332.0 (ex. 7.b); 2026 Jan 1.0 = 2461041.5 | Meeus 1998, ch. 7 |
| ΔT | ignored: UT is used for TT (about 69 s in 2026, 0.0007° of the Sun's longitude) | decision |
| Play | `advance(day, time, m)`: m minutes later; 23:55 + 5 min is 00:00 of the next day; 31 Dec 23:55 + 5 min is 1 Jan 00:00 | decision |

## 2. The Sun (NOAA Solar Calculator = Meeus, low accuracy)

With T = (JD − 2451545) / 36525:

- L0 = 280.46646 + 36000.76983 T + 0.0003032 T² (mod 360); M = 357.52911 + 35999.05029 T − 0.0001537 T²;
  e = 0.016708634 − 0.000042037 T − 0.0000001267 T² (Meeus 25.2–25.4)
- C = (1.914602 − 0.004817 T − 0.000014 T²) sin M + (0.019993 − 0.000101 T) sin 2M + 0.000289 sin 3M
- Ω = 125.04 − 1934.136 T; λ = L0 + C − 0.00569 − 0.00478 sin Ω
- ε0 = 23° 26′ 21.448″ − 46.8150″ T − 0.00059″ T² + 0.001813″ T³ (22.2); ε = ε0 + 0.00256 cos Ω (25.8)
- **δ = asin(sin ε sin λ)** (25.7)
- y = tan²(ε/2); **E = y sin 2L0 − 2e sin M + 4ey sin M cos 2L0 − ½y² sin 4L0 − 5/4 e² sin 2M** (28.3, radians;
  × 4 min/degree)

Expected (tested):

| Check | Expected | Model | Source |
|---|---|---|---|
| Example 25.a, 1992 Oct 13.0: T, L0, M, e, C | −0.072183436, 201.80720°, 278.99397°, 0.016711668, −1.89732° | equal to the digits given | Meeus ex. 25.a |
| λ, ε, δ | 199.90895°, 23.43999°, **−7.78507°** | 199.90894°, 23.43999°, −7.78507° | Meeus ex. 25.a |
| Equation of time, 1992 Oct 13.0 | 13 min 42.6 s (13.710 min) | 13.711 min | Meeus ex. 28.b |
| E extremes | about −14.2 min near 11 Feb, +16.4 min near 3 Nov, +3.7 near 14 May, −6.5 near 26 Jul (± 0.15) | −14.23, +16.49, +3.64, −6.56 | the standard curve (e.g. Meeus ch. 28; the Astronomical Almanac) |
| March equinox 2026-03-20 14:46 UTC | δ = 0 ± 0.01°; sign change between 14:16 and 15:16 | +0.002° | USNO, Earth's seasons 2026 |
| September equinox 2026-09-23 00:05 UTC | δ = 0 ± 0.01°; sign change between 22 Sep 23:35 and 23 Sep 00:35 | +0.001° | USNO |
| June solstice 2026-06-21 08:24 UTC | δ = 23.44 ± 0.01°, more than a day before or after | 23.438° | USNO |
| December solstice 2026-12-21 20:50 UTC | δ = −23.44 ± 0.01°, less than a day before or after | −23.438° | USNO |
| Whole year | \|δ\| < 23.45° | | the tropics |

## 3. The subsolar point and the Sun's elevation

- **Subsolar point**: latitude = δ; longitude = −15° · (UTC hours − 12 + E / 60), wrapped to −180° ≤ λ < 180°. At 12:00
  UTC it is −E/4; it moves **15° west an hour** (tested to 0.01°).
- Published subsolar points (from the E extremes): 3 Nov 12:00 UTC ≈ (15.1° S, 4.1° W); 11 Feb 12:00 UTC ≈
  (14.0° S, 3.55° E) (tested ± 0.1° lat, ± 0.05° lon).
- **Elevation** at (φ, λ): sin e = sin φ sin δ + cos φ cos δ cos(λ − λ☉). Geometric: the Sun is a point and there is no
  refraction (a real sunrise is at −0.83°). 90° at the subsolar point, −90° at its antipode, 0° a quarter circle away.
  In June the North Pole sees the Sun at the declination all day and the South Pole is below −23°.
- **Contour** e = e0: the small circle of angular radius 90° − e0 around the subsolar point (n + 1 points, first =
  last; every point at e0 to 1e-6°). The terminator is e0 = 0°, the band's outer edge e0 = −depth.

## 4. Zones and sides

| Zone | Rule | Tie-break |
|---|---|---|
| `day` | e > 0 | |
| `band` (the grey line) | −depth ≤ e ≤ 0 | **e = 0 and e = −depth are both in the band** |
| `night` | e < −depth | |

depth = **6°** (civil twilight, the default) or **12°** (nautical, the switch; only the boolean `true` turns it on).
On the equator at an equinox the civil band spans 6° of longitude at dusk and 6° at dawn (12° when nautical).

**Side of the day**: hour angle H = λ − λ☉ wrapped to −180° ≤ H < 180°; H ≥ 0 is `dusk` (east of the Sun: afternoon,
evening), H < 0 is `dawn`. **Tie-breaks: H = 0 (local noon) is dusk, H = −180° (local midnight) is dawn.**

## 5. Stations and the path

- Eight stations (lat, lon to 0.1°): Zagreb (45.8, 16.0), London (51.5, −0.1), New York (40.7, −74.0), Rio de Janeiro
  (−22.9, −43.2), Cape Town (−33.9, 18.4), Tokyo (35.7, 139.7), Honolulu (21.3, −157.9), Anchorage (61.2, −149.9).
  No place near Zagreb's antipode (NOTES.md).
- A station has its elevation, zone and side. An unknown A falls back to Zagreb; an unknown B, `off`, or **B equal to A
  is no path**.
- The **path** is the short great-circle arc, sampled at 101 evenly spaced points (both ends exact). Its length is
  rounded to 10 km (R = 6371 km): London – New York **5570 km**, Zagreb – Tokyo **9340 km**.
- **Percentages**: band and night each `round(100 · count / 101)`, day = 100 − band − night; whole, 0 … 100, sum 100.
  101 is odd, so no count lands on a half. Example (tested): Sun over (0°, 0°), the equator from 90.05° to 100.05° E:
  60 points in the band, 41 in night → **59 %, 41 %, 0 %**.
- **Caption kind**: without B, A's zone, the band split by side: `aDay`, `aDusk`, `aDawn`, `aNight`. With B: `both`
  (both ends in the band), `one`, `none`.

## 6. Presets

| Key | id | Date, time (UTC) | Expected |
|---|---|---|---|
| 1 | `equinox` (the defaults) | 20 Mar, 17:20 | Zagreb at −2.9°: `aDusk`; terminator from pole to pole |
| 2 | `juneSolstice` | 21 Jun, 19:05 | Zagreb at −3.0°: `aDusk`; North Pole in day, South Pole in night |
| 3 | `decSolstice` | 21 Dec, 15:25 | Zagreb at −2.4°: `aDusk`; the reverse |
| 4 | `now` (page only) | this computer's date and time, rounded down to 5 min | |
| 5 | `pathGrey` | 3 Jun, 19:05; B Tokyo | Zagreb −4.3° (dusk), Tokyo −4.5° (dawn): `both`, **100 % of the path in the band**, 9340 km |
| 6 | `pathDay` | 3 Jun, 19:05; B New York | New York +57.0° (afternoon): `one`, 8 % band, 92 % day |

The Zagreb times are its sunset plus about 15–20 min (Sun about 3° down), so its grey line is on the map. The Tokyo pair
was found by scanning every 5 minutes of 2026 for the longest share of a Zagreb path in the civil band (NOTES.md).

## 7. The map (page)

Equirectangular, −180° … 180° × 90° … −90°. Land: Natural Earth 1:110m (`land.js`). Shading per pixel from the same
elevation formula: day clear, the band hatched (`--c2` stripes) over a light shade, night a dark shade. Lines: the
terminator solid, the band's outer edge dashed, both broken at the map's edge and within 1° of a pole. The subsolar
point is a sun; A a diamond, B a circle, each named with its elevation (signed, one decimal); the path solid where it
lies in the band, dotted elsewhere.
