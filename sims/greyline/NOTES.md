<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# greyline: notes

A native kit sim, written from scratch for simdeck (task: thread t-0166, after `docs/tasks/w1/greyline.md`, catalogue
`50ohm-greyline`, §2.5). The rules, tie-breaks and expected numbers are in `SPEC.md`.

## Why a rewrite, not an import

The task file planned to adopt the 50ohm greyline applet. Thread t-0092 found that the applet contains code marked
"(C) 2011 g/christensen" with no licence, so it cannot be copied into an AGPL project. The owner decided on 2026-10-05
to rewrite it. **No code from the applet was copied, ported or paraphrased, and the applet was not opened** for this
work (neither `50ohm-contents-hr` nor `-dl` `contents/html/greyline.html`). What was read: the task file, the catalogue
entry, and the 50ohm section text `contents/sections/greyline.md` (for the Croatian terms only: *greyline*, D-regija,
E- i F-regija; no sentence of it is on the page). The explanation and captions are written for simdeck.

## Sources

- **The Sun's position**: the NOAA Global Monitoring Laboratory's Solar Calculator ("calcdetails", the equations of its
  spreadsheet), which are Jean Meeus, *Astronomical Algorithms*, 2nd ed., Willmann-Bell 1998: ch. 7 (Julian Day),
  ch. 22 (mean obliquity, 22.2), ch. 25 (solar coordinates, low accuracy: 25.1–25.8) and ch. 28 (equation of time,
  28.3). The equations are written anew in `sim.js`; no code was taken from NOAA's sheet or from any library.
- **Test values**: Meeus examples 7.a, 7.b, 25.a (δ = −7°47′ = −7.78507° on 1992 Oct 13.0) and 28.b (E = 13 min 42.6 s);
  the 2026 equinoxes and solstices as published by the U.S. Naval Observatory ("Earth's Seasons", 2026: 20 Mar 14:46,
  21 Jun 08:24, 23 Sep 00:05, 21 Dec 20:50 UTC); the equation of time's yearly extremes (about −14.2, +3.7, −6.5,
  +16.4 min near 11 Feb, 14 May, 26 Jul, 3 Nov). *(check)* the four USNO times were taken from memory of the published
  table, not looked up during the session; the model's declination agrees with each to 0.01° (the test), which it
  would not if a time were off by more than about half an hour. *(check)* the two "published" subsolar points in SPEC.md
  §3 (3 Nov and 11 Feb at 12:00 UTC) follow from the E extremes and the almanac's declination of about −15.1° and
  −14.0°; I did not compare them with a printed almanac.
- **Map**: Natural Earth 1:110m physical vectors, Land (`ne_110m_land.geojson`, tag v5.1.2 of
  `nvkelso/natural-earth-vector`), public domain. Converted by a one-off script (not kept: it only rounded each
  coordinate to 0.1° and dropped repeated points) to `land.js`: 128 rings, 5122 points, 46 KB. Credited on the page and
  in `sim.json` `credits`.

## Decisions

- **One concept**: the grey line and why HF goes far along it. Not here: MUF and frequency, absorption in numbers,
  the dead zone, long path in general (other catalogue entries).
- **Class `explorer`**: date and time sliders drive the map live; nothing to step through. **Play** is a page button in
  the transport bar (key `P`; Space stays the kit's): 5 minutes of model time every 120 ms, a day in about 35 s; under
  reduced motion 30-minute jumps once a second (as `fading` drifts). The clock is page state, not model state, so a
  link opens still; a preset stops it, a hand change carries on from there.
- **Twilight band**: civil (Sun 0–6° below the horizon) by default, nautical (to 12°) with one switch. The task allowed
  either; the switch shows that the band has no sharp edge. It is a toggle and not a two-way choice because the panel
  must fit 1920×1080 without its own scroll (a choice was 45 px too tall).
- **Elevation is geometric**: the Sun as a point, no refraction (real sunrise is at −0.83°). Said in the explanation.
- **Calendar 2026**: one fixed non-leap year, so the date slider is 1 … 365 and the presets are exact. For another year
  the Sun's position differs by at most a quarter of a day's motion (about 0.1° of declination near an equinox),
  invisible on the map. The "now" preset maps today's month and day onto 2026 (29 Feb → 28 Feb).
- **Presets**: the equinox and both solstices at the moment the Sun is about 3° below Zagreb's horizon (the HAM course's
  home station), so the grey line runs through the lecture room. "Now" from the computer's clock (key 4, built in the
  page; the model stays free of `Date`). Then a grey-line path and its contrast at the same moment: Zagreb – Tokyo on
  3 June at 19:05 UTC (dusk in Zagreb, dawn in Tokyo, 100 % of the path in the civil band; found by scanning every
  5 minutes of 2026 for each station) and Zagreb – New York (afternoon there, 92 % of the path in daylight).
- **Stations**: Zagreb, London, New York, Rio de Janeiro, Cape Town, Tokyo, Honolulu, Anchorage. Each of the others
  shares the civil band with Zagreb at some moment of 2026, except New York and Rio, which share only the nautical
  band (useful contrast). **Australia and New Zealand are left out on purpose**: the classic
  Europe – New Zealand grey-line path works because the two are nearly antipodal, so many great circles join them and the
  one along the terminator is used, not the short arc this model draws. With the short arc the model would show that
  path through night and contradict the explanation. The explanation says so in one sentence. A long-path or
  "along-the-terminator" path is a possible later task (named in the thread report, not in OPEN.md: it needs no
  owner decision).
- **Path**: the short great-circle arc, 101 sample points, percentages in band / day / night (SPEC.md §5). On the map
  it is solid where it lies in the band, dotted elsewhere, over a light halo so it reads on any shade.
- **Map**: equirectangular, the shading per pixel on a canvas (one multiply-add per pixel with the cosines per column
  precomputed; about 0.9 M pixels at 1920×1080, fast enough for play), and an SVG at 1:1 on top for lines, markers and
  every label (text never scales below 16 px). Contours are drawn as small circles around the subsolar point, broken at
  the map's edge and within 1° of a pole (otherwise a contour through a pole runs along the map's top or bottom edge).
- **Colour**: sea `--c6` at 16 %, land `--c3` at 34 % with a `--muted` outline, night the darker of `--ink` / `--bg` (so
  it is dark in both themes), the band `--c2` stripes over a lighter shade, terminator `--ink` solid, band edge `--ink`
  dashed, Sun `--c7`, A `--c1` diamond, B `--c4` circle. Grayscale checked: day light, band hatched, night dark; the
  markers differ by shape.
- **Phone**: the map takes the full width at 2:1; grid labels, the clock and station names are left out (the sliders
  and the caption carry them).
- **Captions** name the date, the time, the station and its elevation, and what the D and F regions are doing there;
  with two stations the share of the path in band, day and night.
- **Tags**: `propagation` (task file; in `tags.json`). Topic `radio`, level `core`. `related`: `skip-distance`, `fading`.
- **No answer keys**: the 50ohm section's exam question (EH213) is not on the page.

## Deviations from the task (and why)

- The import plan is cancelled (above); `origin` is not set, since nothing was adopted.
- Hints under the sliders were dropped so the panel fits one screen; the explanation carries that text.
- Station B's list leaves out Australia and New Zealand, though the 50ohm section names them (above).

## Term pairs

Not in `kit/glossary.js`; written out in both tables. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| grey line | *greyline* (siva linija) |
| terminator | terminator (granica dana i noći) |
| civil twilight | građanski sumrak |
| nautical twilight | nautički sumrak |
| D region | D-regija |
| equinox | ekvinocij |
| solstice | solsticij |

*(check)* whether the HAM course writes *greyline* (the 50ohm-hr term) or "siva linija"; the title shows both.

## Shared requests

None. No shared model used. The sun-position functions (`julianDay`, `sunAt`, `subsolar`, `elevation`, `contour`) are
pure and could be promoted to `models/` if another sim needs them (aurora, a sunrise sim).

## Checks

- `node --test sims/greyline/sim.test.js`: 27 tests. My own 26 mutants (each tie-break flipped, the clock wrap
  removed, floor for round in the percentages, the Gregorian term of the Julian Day, each nutation/aberration term,
  the equation of time in radians, both signs of the subsolar longitude, the elevation's hour-angle sign, the contour
  radius, the nautical switch accepting any truthy value, the A fallback, the calendar's month edge, the year, the
  29 Feb rule, the equation of the centre, the path's first point, the Earth radius, the same-station rule, the
  nautical depth, two preset values): **all killed**. One more (a second clamp of the time after rounding) survived
  and was removed as dead code.
- **Fresh review** (a separate agent with no part in writing it, given only the code, SPEC.md and COMMON.md; it did
  not open the 50ohm applet): no maths error and no code–spec disagreement; 84 mutants, 21 survived. Fixed by new
  tests, each re-run as a mutant and now killed: who takes the rounding remainder, the 10 km rounding (Zagreb – New
  York 6908.3 → 6910), the 101 sample points, the clock landing on day 365, the clamp in `elevation()` (without it the
  subsolar point gives NaN on some dates), longitudes kept in −180 … 180 by `destination()`, every station's
  coordinates, the presets' elevations and path numbers to the precision SPEC.md states. Still surviving, on purpose:
  the T², T³ and small C terms of Meeus 25.2–25.4 and 22.2 and computing y from ε0 instead of ε (each under 1e-5°,
  below every test tolerance and invisible on the map); a mirrored bearing in `destination()` and the month loop's
  bound (equivalent). Also from the review: `bandEdge` string removed; 160 m is MF, so the text says "160 m and the
  lower HF bands"; the play hint mentions the half-hour jumps under reduced motion; thousands use a no-break space;
  an elevation that shows as 0.0° reads "on the horizon" with no sign; the legend names the A diamond and B circle.
  Left as is: at a change of zone the path's boundary segment is drawn both solid and dotted (cosmetic, sub-pixel).
- `npm run gate -- greyline`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed (gate and unbuilt from `file://`): 1920×1080 light, dark, grayscale and 375×812, hr and en;
  presets 1, 3 (nautical), 5, 6 (dark) and play. Fixed from them: the panel was too tall (hints, the band choice),
  the night swatch was white in dark mode, station labels overlapped on a phone, the clock overlapped Zagreb on a phone.
- Not checked: Firefox and Safari; a real projector; the Croatian wording with a native ham *(check)*.

## Time

Start to done: about 35 minutes by the machine clock (2026-10-24, 11:10–11:45 CEST), one session, including a fresh-review round.
