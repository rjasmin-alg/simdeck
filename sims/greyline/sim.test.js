// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the greyline model. Run: node --test sims/greyline/
// Expected values: Meeus, "Astronomical Algorithms" (2nd ed., 1998), examples 7.a, 7.b, 25.a and 28.b; the 2026
// equinoxes and solstices as published (USNO); the equation of time's yearly extremes; SPEC.md lists each with its source.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');
const land = require('./land.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));
const near = (a, b, eps) => Math.abs(a - b) <= eps;
const hm = (h, m) => h * 60 + m;
const sub = (lat, lon) => ({ lat, lon });

// ── tie-breaks first ──

test('tie-break: elevation exactly 0° (the terminator) and exactly −depth (the outer edge) are both in the band', () => {
  for (const depth of [6, 12]) {
    assert.equal(logic.zoneOf(0, depth), 'band');
    assert.equal(logic.zoneOf(-depth, depth), 'band');
    assert.equal(logic.zoneOf(1e-9, depth), 'day');
    assert.equal(logic.zoneOf(-depth - 1e-9, depth), 'night');
    assert.equal(logic.zoneOf(-depth / 2, depth), 'band');
  }
  assert.equal(logic.zoneOf(-7, 6), 'night');
  assert.equal(logic.zoneOf(-7, 12), 'band');
});

test('tie-break: hour angle 0 (local noon) is dusk, −180° (local midnight) is dawn; east of the Sun is dusk', () => {
  const s = sub(10, 20);
  assert.equal(logic.sideOf(20, s), 'dusk');
  assert.equal(logic.sideOf(-160, s), 'dawn');            // 180° away wraps to −180°
  assert.equal(logic.sideOf(200, s), 'dawn');
  assert.equal(logic.sideOf(20.001, s), 'dusk');
  assert.equal(logic.sideOf(19.999, s), 'dawn');
  assert.equal(logic.sideOf(110, s), 'dusk');
  assert.equal(logic.sideOf(-70, s), 'dawn');
});

test('tie-break: the same station as A and B is no path; the caption falls back to A alone', () => {
  const st = at({ b: 'zagreb' });
  assert.equal(st.b, null);
  assert.equal(st.path, null);
  assert.ok(['aDay', 'aDusk', 'aDawn', 'aNight'].includes(st.kind));
  const a = { id: 'x', zone: 'band', side: 'dawn' };
  assert.equal(logic.kindOf(a, { id: 'x', zone: 'band' }), 'aDawn');
  assert.equal(logic.kindOf(a, null), 'aDawn');
  assert.equal(logic.kindOf({ id: 'x', zone: 'band', side: 'dusk' }, null), 'aDusk');
  assert.equal(logic.kindOf({ id: 'x', zone: 'day', side: 'dusk' }, null), 'aDay');
  assert.equal(logic.kindOf({ id: 'x', zone: 'night', side: 'dawn' }, null), 'aNight');
  assert.equal(logic.kindOf(a, { id: 'y', zone: 'band' }), 'both');
  assert.equal(logic.kindOf(a, { id: 'y', zone: 'day' }), 'one');
  assert.equal(logic.kindOf({ id: 'x', zone: 'night' }, { id: 'y', zone: 'band' }), 'one');
  assert.equal(logic.kindOf({ id: 'x', zone: 'night' }, { id: 'y', zone: 'day' }), 'none');
});

test('tie-break: the clock rolls over at midnight and from 31 December to 1 January', () => {
  assert.deepEqual(logic.advance(10, hm(23, 55), 5), { day: 11, time: 0 });
  assert.deepEqual(logic.advance(365, hm(23, 55), 5), { day: 1, time: 0 });
  assert.deepEqual(logic.advance(365, hm(23, 50), 30), { day: 1, time: 20 });
  assert.deepEqual(logic.advance(1, 0, 1440), { day: 2, time: 0 });
  assert.deepEqual(logic.advance(364, hm(23, 55), 5), { day: 365, time: 0 });   // lands on the last day, not day 0
  assert.deepEqual(logic.advance(100, hm(12, 0), 5), { day: 100, time: hm(12, 5) });
});

test('tie-break: path percentages are whole, never negative, and add up to 100', () => {
  const ids = logic.PLACES.map((p) => p.id);
  for (let day = 1; day <= 365; day += 23) {
    for (let time = 0; time < 1440; time += 95) {
      for (const nautical of [false, true]) {
        const st = at({ day, time, nautical, a: ids[day % ids.length], b: ids[(day + time) % ids.length] });
        if (!st.path) continue;
        const { band, day: d, night } = st.path;
        for (const v of [band, d, night]) assert.ok(Number.isInteger(v) && v >= 0 && v <= 100);
        assert.equal(band + d + night, 100);
      }
    }
  }
});

// ── time: Julian Day and the calendar ──

test('Julian Day as Meeus ch. 7: J2000.0, Sputnik (7.a), 1987 Jan 27.0 and 1988 Jun 19.5', () => {
  assert.equal(logic.julianDay(2000, 1, 1.5), 2451545.0);
  assert.ok(near(logic.julianDay(1957, 10, 4.81), 2436116.31, 1e-6));
  assert.equal(logic.julianDay(1987, 1, 27), 2446822.5);
  assert.equal(logic.julianDay(1988, 6, 19.5), 2447332.0);
  assert.equal(logic.jdOf(1, 0), 2461041.5);               // 2026 January 1, 0h UT
  assert.equal(logic.jdOf(1, 720), 2461042.0);
});

test('the calendar is 2026: day 1 is 1 Jan, 59 is 28 Feb, 60 is 1 Mar, 365 is 31 Dec; 29 Feb counts as 28 Feb', () => {
  assert.equal(logic.YEAR, 2026);
  assert.deepEqual(logic.dateOf(1), { month: 1, date: 1 });
  assert.deepEqual(logic.dateOf(59), { month: 2, date: 28 });
  assert.deepEqual(logic.dateOf(60), { month: 3, date: 1 });
  assert.deepEqual(logic.dateOf(79), { month: 3, date: 20 });
  assert.deepEqual(logic.dateOf(172), { month: 6, date: 21 });
  assert.deepEqual(logic.dateOf(355), { month: 12, date: 21 });
  assert.deepEqual(logic.dateOf(365), { month: 12, date: 31 });
  for (let d = 1; d <= 365; d++) { const x = logic.dateOf(d); assert.equal(logic.dayOf(x.month, x.date), d); }
  assert.equal(logic.dayOf(2, 29), 59);
});

// ── the Sun ──

test('the Sun as Meeus example 25.a (1992 Oct 13.0): L0, M, e, C, λ, ε and δ = −7.78507°', () => {
  const s = logic.sunAt(2448908.5);
  assert.ok(near(s.T, -0.072183436, 1e-9));
  assert.ok(near(s.L0, 201.80720, 1e-5));
  assert.ok(near(s.M, 278.99397, 1e-5));
  assert.ok(near(s.e, 0.016711668, 1e-9));
  assert.ok(near(s.C, -1.89732, 1e-5));
  assert.ok(near(s.lambda, 199.90895, 2e-5));
  assert.ok(near(s.eps, 23.43999, 1e-5));
  assert.ok(near(s.decl, -7.78507, 1e-5));
});

test('the equation of time as Meeus example 28.b (1992 Oct 13.0): 13 min 42.6 s', () => {
  assert.ok(near(logic.sunAt(2448908.5).eot, 13 + 42.6 / 60, 0.01));
});

test('the equation of time\'s extremes: about −14.2 min near 11 Feb and +16.4 min near 3 Nov', () => {
  const eot = (d) => logic.subsolar(d, 720).eot;
  const feb = logic.dayOf(2, 11), nov = logic.dayOf(11, 3);
  assert.ok(near(eot(feb), -14.2, 0.15), String(eot(feb)));
  assert.ok(near(eot(nov), 16.4, 0.15), String(eot(nov)));
  // they are the extremes: three days either side is less extreme
  assert.ok(eot(feb - 3) > eot(feb) && eot(feb + 3) > eot(feb));
  assert.ok(eot(nov - 3) < eot(nov) && eot(nov + 3) < eot(nov));
  // the smaller pair: +3.7 min near 14 May, −6.5 min near 26 Jul
  assert.ok(near(eot(logic.dayOf(5, 14)), 3.7, 0.15));
  assert.ok(near(eot(logic.dayOf(7, 26)), -6.5, 0.15));
});

test('2026 equinoxes: the subsolar point crosses the equator within half an hour of the published moment', () => {
  // March equinox 2026-03-20 14:46 UTC, September equinox 2026-09-23 00:05 UTC (USNO)
  assert.ok(logic.subsolar(79, hm(14, 16)).lat < 0 && logic.subsolar(79, hm(15, 16)).lat > 0);
  assert.ok(near(logic.subsolar(79, hm(14, 46)).lat, 0, 0.01));
  assert.ok(logic.subsolar(265, hm(23, 35)).lat > 0 && logic.subsolar(266, hm(0, 35)).lat < 0);
  assert.ok(near(logic.subsolar(266, hm(0, 5)).lat, 0, 0.01));
});

test('2026 solstices: the subsolar point is on a tropic (±23.44°), farther than a day before or after', () => {
  // June solstice 2026-06-21 08:24 UTC, December solstice 2026-12-21 20:50 UTC (USNO)
  const jun = logic.subsolar(172, hm(8, 24)).lat, dec = logic.subsolar(355, hm(20, 50)).lat;
  assert.ok(near(jun, 23.44, 0.01), String(jun));
  assert.ok(near(dec, -23.44, 0.01), String(dec));
  assert.ok(logic.subsolar(171, hm(8, 24)).lat < jun && logic.subsolar(173, hm(8, 24)).lat < jun);
  assert.ok(logic.subsolar(354, hm(20, 50)).lat > dec && logic.subsolar(356, hm(20, 50)).lat > dec);
  // and the declination never goes past the tropics during the year
  for (let d = 1; d <= 365; d++) assert.ok(Math.abs(logic.subsolar(d, 0).lat) < 23.45);
});

test('subsolar longitude: at 12:00 UTC it is −E/4 (the Sun over Greenwich only when E = 0); it moves 15° west an hour', () => {
  for (const d of [42, 79, 134, 172, 207, 307, 355]) {
    const s = logic.subsolar(d, 720);
    assert.ok(near(s.lon, -s.eot / 4, 1e-9));
    assert.ok(Math.abs(s.lon) < 4.2);
    for (const t of [0, 300, 720, 1200]) {
      const a = logic.subsolar(d, t).lon, b = logic.subsolar(d, t + 60).lon;
      assert.ok(near(logic.wrapLon(a - b), 15, 0.01), `${d} ${t}`);
    }
  }
  // published points: 3 Nov 12:00 UTC about (15.1° S, 4.1° W); 11 Feb 12:00 UTC about (14.0° S, 3.55° E)
  const n = logic.subsolar(logic.dayOf(11, 3), 720), f = logic.subsolar(logic.dayOf(2, 11), 720);
  assert.ok(near(n.lat, -15.1, 0.1) && near(n.lon, -4.1, 0.05), JSON.stringify(n));
  assert.ok(near(f.lat, -14.0, 0.1) && near(f.lon, 3.55, 0.05), JSON.stringify(f));
});

// ── elevation and contours ──

test('elevation: 90° at the subsolar point, −90° at its antipode, 0° a quarter circle away', () => {
  for (const s of [sub(0, 0), sub(23.44, 54.5), sub(-17, -170)]) {
    assert.ok(near(logic.elevation(s.lat, s.lon, s), 90, 1e-6));
    assert.ok(near(logic.elevation(-s.lat, s.lon + 180, s), -90, 1e-6));
    // a quarter circle north (or south) of the Sun along its meridian
    assert.ok(near(logic.elevation(s.lat - 90 * Math.sign(s.lat || 1), s.lon, s), 0, 1e-9));
  }
  // on real dates the cosine sum can round to 1 + 2e-16: still exactly 90°, never NaN, and day
  for (let d = 1; d <= 365; d += 2) {
    const s = logic.subsolar(d, 720);
    assert.ok(near(logic.elevation(s.lat, s.lon, s), 90, 1e-6), String(d));
    assert.equal(logic.zoneOf(logic.elevation(s.lat, s.lon, s), 6), 'day');
  }
  // at an equinox the terminator is two meridians, 90° either side of the Sun, and the poles are on it
  assert.ok(near(logic.elevation(45, 90, sub(0, 0)), 0, 1e-9));
  assert.ok(near(logic.elevation(90, 0, sub(0, 0)), 0, 1e-9));
  // in June the North Pole sees the Sun at the declination all day; the South Pole is below the horizon
  for (let t = 0; t < 1440; t += 60) {
    const s = logic.subsolar(172, t);
    assert.ok(near(logic.elevation(90, 0, s), s.lat, 1e-9));
    assert.ok(logic.elevation(-90, 0, s) < -23);
  }
});

test('contours: every point of the e0 contour sees the Sun at e0 (0°, −6°, −12°)', () => {
  for (const s of [sub(0.3, -78), sub(23.44, 54.5), sub(-23.44, -133)]) {
    for (const e0 of [0, -6, -12]) {
      const c = logic.contour(s, e0, 360);
      assert.equal(c.length, 361);
      assert.deepEqual(c[0], c[360]);
      for (const p of c) {
        assert.ok(near(logic.elevation(p.lat, p.lon, s), e0, 1e-6), `${e0} at ${JSON.stringify(p)}`);
        assert.ok(p.lon >= -180 && p.lon < 180, `longitude in range: ${p.lon}`);   // the page breaks lines on jumps
      }
    }
  }
});

test('on the equator at an equinox the band spans 6° of longitude at dusk and at dawn, 12° when nautical', () => {
  const s = logic.subsolar(79, hm(12, 0));
  const across = (depth) => { let n = 0; for (let lon = -180; lon < 180; lon += 0.1) if (logic.zoneOf(logic.elevation(0, lon, s), depth) === 'band') n++; return n / 10; };
  // on the equator at an equinox, civil twilight is 6° of longitude on each side (dawn and dusk)
  assert.ok(near(across(6), 12, 0.3), String(across(6)));
  assert.ok(near(across(12), 24, 0.3), String(across(12)));
});

// ── paths and stations ──

test('great circle: ends exact, every point equally spaced, London – New York 5570 km', () => {
  const a = logic.place('london'), b = logic.place('newyork');
  const g = logic.greatCircle(a, b, 10);
  assert.equal(g.length, 11);
  assert.deepEqual(g[0], { lat: a.lat, lon: a.lon });
  assert.deepEqual(g[10], { lat: b.lat, lon: b.lon });
  const step = logic.arcDeg(a, b) / 10;
  for (let i = 1; i <= 10; i++) assert.ok(near(logic.arcDeg(g[i - 1], g[i]), step, 1e-6));
  assert.equal(logic.pathOf(a, b, sub(0, 0), 6).km, 5570);
  assert.equal(logic.pathOf(logic.place('zagreb'), logic.place('tokyo'), sub(0, 0), 6).km, 9340);
  assert.equal(logic.pathOf(logic.place('zagreb'), logic.place('newyork'), sub(0, 0), 6).km, 6910);   // 6908.3 rounds up
});

test('a path counts its sample points, both ends included: all in the band, all in daylight, half and half', () => {
  const a = { lat: 0, lon: 89 }, b = { lat: 0, lon: 91 };
  // the Sun over (0, 0): along the equator from 89° to 91° E it stands 1° up to 1° down, so the 50 points west of
  // 90° E are in daylight and the 51 from 90° E on (or 50 and 51 the other way, by rounding) in the band: 50 % each
  const p = logic.pathOf(a, b, sub(0, 0), 6);
  assert.equal(p.day, 50);
  assert.equal(p.band, 50);
  assert.equal(p.night, 0);
  assert.deepEqual(logic.pathOf({ lat: 0, lon: 91 }, { lat: 0, lon: 95 }, sub(0, 0), 6), { km: 440, band: 100, night: 0, day: 0 });
  assert.deepEqual(logic.pathOf({ lat: 0, lon: 10 }, { lat: 0, lon: 20 }, sub(0, 0), 6), { km: 1110, band: 0, night: 0, day: 100 });
  // the day takes the rounding's remainder: 33 points in daylight, 34 in the band, 34 in night → 32, 34, 34
  assert.deepEqual(logic.pathOf({ lat: 0, lon: 84.264706 }, { lat: 0, lon: 101.911765 }, sub(0, 0), 6),
    { km: 1960, band: 34, night: 34, day: 32 });
  assert.equal(logic.PATH_N, 100);
  // 60 points in the band (90.05° … 95.95° E) and 41 in night (96.05° … 100.05° E): 59.4 % rounds to 59, 40.6 % to 41
  assert.deepEqual(logic.pathOf({ lat: 0, lon: 90.05 }, { lat: 0, lon: 100.05 }, sub(0, 0), 6), { km: 1110, band: 59, night: 41, day: 0 });
});

test('the stations are where SPEC.md §5 puts them', () => {
  const where = Object.fromEntries(logic.PLACES.map((p) => [p.id, [p.lat, p.lon]]));
  assert.deepEqual(where, {
    zagreb: [45.8, 16.0], london: [51.5, -0.1], newyork: [40.7, -74.0], rio: [-22.9, -43.2], capetown: [-33.9, 18.4],
    tokyo: [35.7, 139.7], honolulu: [21.3, -157.9], anchorage: [61.2, -149.9]
  });
});

test('a station sees the Sun at its own elevation; an unknown station is null and A falls back to Zagreb', () => {
  const s = logic.subsolar(79, 1040);
  const z = logic.station('zagreb', s, 6);
  assert.ok(near(z.elev, logic.elevation(45.8, 16.0, s), 1e-12));
  assert.equal(logic.station('nowhere', s, 6), null);
  assert.equal(at({ a: 'nowhere' }).a.id, 'zagreb');
  assert.equal(at({ b: 'nowhere' }).b, null);
  assert.equal(at({ b: 'off' }).b, null);
});

// ── params, presets ──

test('params: day 1 … 365, time 0 … 23:55 in 5-minute steps, nautical only when true', () => {
  assert.equal(at({ day: 0 }).day, 1);
  assert.equal(at({ day: 400 }).day, 365);
  assert.equal(at({ day: 'x' }).day, 1);
  assert.equal(at({ day: 79.4 }).day, 79);
  assert.equal(at({ time: -5 }).time, 0);
  assert.equal(at({ time: 7 }).time, 5);
  assert.equal(at({ time: 8 }).time, 10);
  assert.equal(at({ time: 1438 }).time, 1435);
  assert.equal(at({ time: 9999 }).time, 1435);
  assert.equal(at({ nautical: true }).depth, 12);
  assert.equal(at({ nautical: true }).band, 'nautical');
  assert.equal(at({ nautical: 'yes' }).depth, 6);
  assert.equal(at({ nautical: false }).band, 'civil');
});

test('presets: the Sun has just set in Zagreb at the equinox and both solstices; Tokyo shares the band, New York not', () => {
  const by = Object.fromEntries(logic.presets.map((p) => [p.id, logic.initial(p.params)]));
  for (const id of ['equinox', 'juneSolstice', 'decSolstice']) assert.equal(by[id].kind, 'aDusk', id);
  // the elevations SPEC.md §6 states, to the tenth of a degree the page shows
  assert.ok(near(by.equinox.a.elev, -2.9, 0.05), String(by.equinox.a.elev));
  assert.ok(near(by.juneSolstice.a.elev, -3.0, 0.05), String(by.juneSolstice.a.elev));
  assert.ok(near(by.decSolstice.a.elev, -2.4, 0.05), String(by.decSolstice.a.elev));
  assert.ok(near(by.pathGrey.a.elev, -4.3, 0.05) && near(by.pathGrey.b.elev, -4.5, 0.05));
  assert.ok(near(by.pathDay.b.elev, 57.0, 0.05), String(by.pathDay.b.elev));
  assert.deepEqual(by.pathDay.path, { km: 6910, band: 8, night: 0, day: 92 });
  assert.deepEqual(by.pathGrey.path, { km: 9340, band: 100, night: 0, day: 0 });
  assert.deepEqual(by.pathGrey.date, { month: 6, date: 3 });
  assert.equal(by.pathGrey.time, by.pathDay.time);
  assert.deepEqual(by.equinox.date, { month: 3, date: 20 });
  assert.deepEqual(by.juneSolstice.date, { month: 6, date: 21 });
  assert.deepEqual(by.decSolstice.date, { month: 12, date: 21 });
  assert.equal(by.pathGrey.kind, 'both');
  assert.equal(by.pathGrey.b.side, 'dawn');
  assert.equal(by.pathGrey.a.side, 'dusk');
  assert.equal(by.pathGrey.path.band, 100);
  assert.equal(by.pathDay.kind, 'one');
  assert.equal(by.pathDay.b.zone, 'day');
  assert.ok(by.pathDay.path.day > 80);
  assert.deepEqual(logic.defaults, logic.presets[0].params);
});

// ── the map data ──

test('land.js: rings of whole tenths of a degree, inside the map', () => {
  assert.ok(Array.isArray(land) && land.length > 100);
  for (const r of land) {
    assert.ok(r.length >= 6 && r.length % 2 === 0);
    for (let i = 0; i < r.length; i += 2) {
      assert.ok(Number.isInteger(r[i]) && r[i] >= -1800 && r[i] <= 1800);
      assert.ok(Number.isInteger(r[i + 1]) && r[i + 1] >= -900 && r[i + 1] <= 900);
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and at the edges', () => {
  const list = logic.presets.map((p) => p.params).concat([{ day: 1, time: 0 }, { day: 365, time: 1435, nautical: true, b: 'anchorage' }]);
  for (const params of list) {
    const st = at(params);
    assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ day: 200, time: 600, b: 'rio' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders; every caption kind and place has its words', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const lang of ['hr', 'en']) {
    for (const k of ['aDay', 'aDusk', 'aDawn', 'aNight', 'both', 'one', 'none']) assert.ok(strings[lang]['cap_' + k], `${lang} cap_${k}`);
    for (const p of logic.PLACES) assert.ok(strings[lang]['pl_' + p.id], `${lang} pl_${p.id}`);
    for (let m = 1; m <= 12; m++) assert.ok(strings[lang]['m' + m], `${lang} m${m}`);
  }
});

test('every preset is valid for the model, and the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(new Set(logic.presets.map((p) => p.id)).size, logic.presets.length);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    const st = logic.initial(p.params);
    assert.equal(st.day, p.params.day, `preset ${p.id} in range`);
    assert.equal(st.time, p.params.time, `preset ${p.id} in range`);
  }
});
