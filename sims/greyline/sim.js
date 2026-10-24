/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the grey line: where on the Earth the Sun is rising or setting at one moment. Written for simdeck from
   textbook formulas; no code from any other greyline applet (NOTES.md says why).
     the Sun's position:  the NOAA solar calculator's equations, which are Meeus, "Astronomical Algorithms" (2nd ed.,
                          1998), ch. 7 (Julian Day), ch. 25 "low accuracy" (declination) and ch. 28 (equation of time,
                          eq. 28.3); ΔT is left out (UT is used for TT: about a minute, 0.0007° of the Sun's longitude)
     the subsolar point:  latitude = declination δ; longitude = −15° · (UTC hours − 12 + equation of time / 60)
     the Sun's elevation: sin e = sin φ · sin δ + cos φ · cos δ · cos(λ − λ☉), geometric (no refraction, no disc)
     a contour:           the points where e = e0 lie on a small circle of angular radius 90° − e0 around the subsolar
                          point; the terminator is e0 = 0°, the twilight band's outer edge e0 = −6° (civil) or −12°
                          (nautical)
   Zones: day (e > 0), the grey line (−depth ≤ e ≤ 0), night (e < −depth). The calendar is the year 2026 (365 days);
   a date in another year differs by at most a quarter of a day's motion of the Sun.
   An explorer: no steps; the page draws initial(params). advance() is the play button's clock, still pure.
   Units: degrees outside (lat north +, lon east +), radians inside; day of year 1 … 365, time in minutes UTC.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var YEAR = 2026;                     // the calendar the date slider runs through (not a leap year)
  var DAYS = 365;
  var TIME_STEP = 5;                   // the time slider's step, minutes
  var R = 6371;                        // mean Earth radius, km (distances only)
  var DEPTH = { civil: 6, nautical: 12 };   // how far below the horizon the band reaches, degrees
  var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var PATH_N = 100;                    // a path is sampled at PATH_N + 1 evenly spaced points, both ends included

  var D2R = Math.PI / 180;
  function sind(x) { return Math.sin(x * D2R); }
  function cosd(x) { return Math.cos(x * D2R); }
  function mod(x, m) { return ((x % m) + m) % m; }
  /** A longitude in −180 ≤ λ < 180. */
  function wrapLon(x) { return mod(x + 180, 360) - 180; }

  // ── time ──

  /** Julian Day of a Gregorian calendar date, `day` with its fraction (Meeus ch. 7, valid for any Gregorian date). */
  function julianDay(year, month, day) {
    if (month <= 2) { year -= 1; month += 12; }
    var a = Math.floor(year / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  }

  /** Day of the year (1 … 365) as { month 1 … 12, date 1 … 31 }, in YEAR's calendar. */
  function dateOf(day) {
    var m = 0;
    while (m < 11 && day > MONTH_DAYS[m]) { day -= MONTH_DAYS[m]; m++; }
    return { month: m + 1, date: day };
  }

  /** Day of the year of a month and date, in YEAR's calendar (29 February counts as 28 February). */
  function dayOf(month, date) {
    var d = 0;
    for (var m = 1; m < month; m++) d += MONTH_DAYS[m - 1];
    return d + Math.min(date, MONTH_DAYS[month - 1]);
  }

  /** Julian Day of day `day` of YEAR at `minutes` UTC. */
  function jdOf(day, minutes) {
    var d = dateOf(day);
    return julianDay(YEAR, d.month, d.date + minutes / 1440);
  }

  // ── the Sun (NOAA = Meeus ch. 25 low accuracy, ch. 28) ──

  /** The Sun at Julian Day jd: declination δ (deg), equation of time (minutes, apparent minus mean solar time), and
      the intermediate values the tests compare with Meeus's worked example 25.a. */
  function sunAt(jd) {
    var T = (jd - 2451545.0) / 36525;                                     // Julian centuries from J2000.0 (25.1)
    var L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);    // geometric mean longitude (25.2)
    var M = 357.52911 + T * (35999.05029 - T * 0.0001537);               // mean anomaly (25.3)
    var e = 0.016708634 - T * (0.000042037 + T * 0.0000001267);          // eccentricity of Earth's orbit (25.4)
    var C = sind(M) * (1.914602 - T * (0.004817 + T * 0.000014)) +       // equation of the centre
            sind(2 * M) * (0.019993 - T * 0.000101) + sind(3 * M) * 0.000289;
    var trueLon = L0 + C;
    var omega = 125.04 - 1934.136 * T;
    var lambda = trueLon - 0.00569 - 0.00478 * sind(omega);              // apparent longitude
    var eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;   // (22.2)
    var eps = eps0 + 0.00256 * cosd(omega);                               // corrected for the apparent position (25.8)
    var decl = Math.asin(sind(eps) * sind(lambda)) / D2R;                 // (25.7)
    var y = Math.pow(Math.tan(eps / 2 * D2R), 2);
    var E = y * sind(2 * L0) - 2 * e * sind(M) + 4 * e * y * sind(M) * cosd(2 * L0) -
            0.5 * y * y * sind(4 * L0) - 1.25 * e * e * sind(2 * M);      // (28.3), radians
    return { T: T, L0: L0, M: mod(M, 360), e: e, C: C, lambda: mod(lambda, 360), eps: eps, decl: decl, eot: 4 * E / D2R };
  }

  /** The point where the Sun stands straight overhead at day `day`, `minutes` UTC: { lat, lon, decl, eot }. */
  function subsolar(day, minutes) {
    var s = sunAt(jdOf(day, minutes));
    return { lat: s.decl, lon: wrapLon(-15 * ((minutes + s.eot) / 60 - 12)), decl: s.decl, eot: s.eot };
  }

  /** The Sun's elevation above the horizon at (lat, lon), in degrees, for the subsolar point `sub`. */
  function elevation(lat, lon, sub) {
    var x = sind(lat) * sind(sub.lat) + cosd(lat) * cosd(sub.lat) * cosd(lon - sub.lon);
    return Math.asin(Math.max(-1, Math.min(1, x))) / D2R;
  }

  /** Zone of an elevation for a band `depth` degrees deep. Tie-breaks: exactly 0° (the terminator itself) and exactly
      −depth (the band's outer edge) are both in the band. */
  function zoneOf(elev, depth) {
    if (elev > 0) return 'day';
    if (elev >= -depth) return 'band';
    return 'night';
  }

  // ── on the sphere ──

  /** The point `distDeg` degrees of arc from (lat, lon) along the initial bearing `brgDeg` (from north, clockwise). */
  function destination(lat, lon, brgDeg, distDeg) {
    var s = sind(lat) * cosd(distDeg) + cosd(lat) * sind(distDeg) * cosd(brgDeg);
    var lat2 = Math.asin(Math.max(-1, Math.min(1, s)));
    var lon2 = lon * D2R + Math.atan2(sind(brgDeg) * sind(distDeg) * cosd(lat), cosd(distDeg) - sind(lat) * Math.sin(lat2));
    return { lat: lat2 / D2R, lon: wrapLon(lon2 / D2R) };
  }

  /** The contour where the Sun's elevation is e0 (deg): n + 1 points around the subsolar point, first = last. */
  function contour(sub, e0, n) {
    var out = [];
    for (var i = 0; i <= n; i++) out.push(destination(sub.lat, sub.lon, (i % n) * 360 / n, 90 - e0));
    return out;
  }

  /** Central angle between two points, degrees (haversine, stable for short and long arcs). */
  function arcDeg(a, b) {
    var h = Math.pow(sind((b.lat - a.lat) / 2), 2) + cosd(a.lat) * cosd(b.lat) * Math.pow(sind((b.lon - a.lon) / 2), 2);
    return 2 * Math.asin(Math.min(1, Math.sqrt(h))) / D2R;
  }

  /** The short great-circle path from a to b: n + 1 points, both ends included (a and b themselves). */
  function greatCircle(a, b, n) {
    var d = arcDeg(a, b) * D2R, out = [];
    function v(p) { return [cosd(p.lat) * cosd(p.lon), cosd(p.lat) * sind(p.lon), sind(p.lat)]; }
    var va = v(a), vb = v(b);
    for (var i = 0; i <= n; i++) {
      if (i === 0) { out.push({ lat: a.lat, lon: a.lon }); continue; }
      if (i === n) { out.push({ lat: b.lat, lon: b.lon }); continue; }
      var f = i / n, wa, wb;
      if (d < 1e-9) { wa = 1 - f; wb = f; } else { wa = Math.sin((1 - f) * d) / Math.sin(d); wb = Math.sin(f * d) / Math.sin(d); }
      var x = wa * va[0] + wb * vb[0], y = wa * va[1] + wb * vb[1], z = wa * va[2] + wb * vb[2];
      out.push({ lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / D2R, lon: Math.atan2(y, x) / D2R });
    }
    return out;
  }

  // ── places ──

  /** Stations to choose from (lat, lon in degrees, rounded to 0.1°). The page names them. No place near Zagreb's
      antipode (Australia, New Zealand): their grey-line path runs along the terminator, not along the short great
      circle this model draws (NOTES.md). */
  var PLACES = [
    { id: 'zagreb', lat: 45.8, lon: 16.0 },
    { id: 'london', lat: 51.5, lon: -0.1 },
    { id: 'newyork', lat: 40.7, lon: -74.0 },
    { id: 'rio', lat: -22.9, lon: -43.2 },
    { id: 'capetown', lat: -33.9, lon: 18.4 },
    { id: 'tokyo', lat: 35.7, lon: 139.7 },
    { id: 'honolulu', lat: 21.3, lon: -157.9 },
    { id: 'anchorage', lat: 61.2, lon: -149.9 }
  ];
  function place(id) {
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === id) return PLACES[i];
    return null;
  }

  /** Which side of the day a place is on: 'dusk' east of the subsolar meridian (afternoon and evening, the Sun going
      down), 'dawn' west of it (night's end and morning). The hour angle runs −180° ≤ H < 180°. Tie-breaks: H = 0
      (local noon) is 'dusk', H = −180° (local midnight) is 'dawn'. */
  function sideOf(lon, sub) {
    return wrapLon(lon - sub.lon) >= 0 ? 'dusk' : 'dawn';
  }

  /** A station's view of the Sun: its elevation, zone and side of the day. */
  function station(id, sub, depth) {
    var p = place(id);
    if (!p) return null;
    var el = elevation(p.lat, p.lon, sub);
    return { id: p.id, lat: p.lat, lon: p.lon, elev: el, zone: zoneOf(el, depth), side: sideOf(p.lon, sub) };
  }

  /** The path between two stations: its length and how much of it lies in day, the band and night, sampled at
      PATH_N + 1 points (both ends included). Percentages are whole numbers that add up to 100: the band's and
      night's are rounded half up, the day takes the rest. */
  function pathOf(a, b, sub, depth) {
    var pts = greatCircle(a, b, PATH_N), n = { day: 0, band: 0, night: 0 };
    for (var i = 0; i < pts.length; i++) n[zoneOf(elevation(pts[i].lat, pts[i].lon, sub), depth)]++;
    var band = Math.round(100 * n.band / pts.length), night = Math.round(100 * n.night / pts.length);
    return { km: Math.round(arcDeg(a, b) * D2R * R / 10) * 10, band: band, night: night, day: 100 - band - night };
  }

  // ── params, state, presets ──

  var defaults = { day: 79, time: 1040, nautical: false, a: 'zagreb', b: 'off' };

  function clampInt(x, lo, hi) {
    var n = Math.round(Number(x));
    if (!isFinite(n)) n = lo;
    return Math.min(hi, Math.max(lo, n));
  }

  /** What the caption says. Without a second station: the first station's zone, the band split by the side of the
      day ('aDay', 'aDusk', 'aDawn', 'aNight'). With one: how many of the two ends are in the band ('both', 'one',
      'none'). The same station twice counts as no path. */
  function kindOf(a, b) {
    if (!b || b.id === a.id) return a.zone === 'day' ? 'aDay' : a.zone === 'night' ? 'aNight' : a.side === 'dusk' ? 'aDusk' : 'aDawn';
    var k = (a.zone === 'band' ? 1 : 0) + (b.zone === 'band' ? 1 : 0);
    return k === 2 ? 'both' : k === 1 ? 'one' : 'none';
  }

  /** The state the page draws. */
  function initial(p) {
    var day = clampInt(p.day, 1, DAYS);
    var time = Math.round(clampInt(p.time, 0, 1440 - TIME_STEP) / TIME_STEP) * TIME_STEP;   // 1435 is a whole step
    var band = p.nautical === true ? 'nautical' : 'civil';
    var depth = DEPTH[band];
    var sub = subsolar(day, time);
    var a = station(p.a, sub, depth) || station(defaults.a, sub, depth);
    var b = p.b === a.id ? null : station(p.b, sub, depth);
    return {
      day: day, time: time, date: dateOf(day), band: band, depth: depth,
      sub: { lat: sub.lat, lon: sub.lon }, decl: sub.decl, eot: sub.eot,
      a: a, b: b, path: b ? pathOf(a, b, sub, depth) : null,
      kind: kindOf(a, b)
    };
  }

  /** The play button's clock: `minutes` later, the day rolling over at midnight and the year from 31 Dec to 1 Jan. */
  function advance(day, time, minutes) {
    var t = time + minutes, d = day + Math.floor(t / 1440);
    return { day: mod(d - 1, DAYS) + 1, time: mod(t, 1440) };
  }

  /** Presets (keys 1–3 and 5–6; the page puts "now", from the clock, as key 4). Dates in 2026: the March equinox
      (20 Mar 14:46 UTC), the June solstice (21 Jun 08:24 UTC), the December solstice (21 Dec 20:50 UTC). The times
      are when the Sun has just set in Zagreb (the HAM course's home station; about 3° below the horizon), so its
      grey line is on the map. The last two: 3 June 19:05 UTC, dusk in Zagreb and dawn in Tokyo, the whole path in
      the band; the same moment to New York, where it is mid-afternoon. */
  var presets = [
    { id: 'equinox', params: { day: 79, time: 1040, nautical: false, a: 'zagreb', b: 'off' } },
    { id: 'juneSolstice', params: { day: 172, time: 1145, nautical: false, a: 'zagreb', b: 'off' } },
    { id: 'decSolstice', params: { day: 355, time: 925, nautical: false, a: 'zagreb', b: 'off' } },
    { id: 'pathGrey', params: { day: 154, time: 1145, nautical: false, a: 'zagreb', b: 'tokyo' } },
    { id: 'pathDay', params: { day: 154, time: 1145, nautical: false, a: 'zagreb', b: 'newyork' } }
  ];

  var logic = {
    YEAR: YEAR, DAYS: DAYS, TIME_STEP: TIME_STEP, R: R, DEPTH: DEPTH, PATH_N: PATH_N, PLACES: PLACES,
    defaults: defaults,
    presets: presets,
    initial: initial,
    advance: advance,
    julianDay: julianDay,
    jdOf: jdOf,
    dateOf: dateOf,
    dayOf: dayOf,
    sunAt: sunAt,
    subsolar: subsolar,
    elevation: elevation,
    zoneOf: zoneOf,
    destination: destination,
    contour: contour,
    arcDeg: arcDeg,
    greatCircle: greatCircle,
    place: place,
    sideOf: sideOf,
    station: station,
    pathOf: pathOf,
    kindOf: kindOf,
    wrapLon: wrapLon
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
