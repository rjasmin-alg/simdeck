/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the RF spectrum explorer: a logarithmic frequency axis from 9 kHz to 300 GHz, the ITU decade bands, a
   simplified EU/HR allocation plan (who may use a band, by service) and the technologies that use the spectrum,
   grouped by category. An explorer: no steps; the page draws initial(params), and the view (centre and zoom) is a
   param, so every view is a URL and a preset.
   Adopted from single-page-labs/rf-spektar-eu-hr-bandplan.html (CATEGORIES, EU_BANDPLAN, the view range, the zoom
   limit, the overlap rule, the tick levels and the frequency format); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── data (frequencies in MHz, as in the original; names and notes are in strings.js) ──

  /** Categories in the original's order. `c` is the kit series colour; `hatch` tells two that share one apart. */
  var CATEGORIES = [
    { id: 'mobile', c: 2, techs: [
      ['gsm900', 880, 960], ['gsm1800', 1710, 1880], ['umts2100', 1920, 2170], ['lte700', 694, 790],
      ['lte800', 791, 862], ['lte1800', 1710, 1880], ['lte2600', 2500, 2690], ['nr-n1', 1920, 2170],
      ['nr-n78', 3300, 3800], ['nr-n258', 24250, 27500], ['redcap', 700, 3800]] },
    { id: 'wlan', c: 1, techs: [
      ['wifi24', 2400, 2483.5], ['wifi5', 5150, 5725], ['wifi6e', 5925, 6425], ['wifi7', 5925, 7125],
      ['bluetooth', 2402, 2480], ['zigbee', 2405, 2480], ['zwave', 868.42, 868.42], ['uwb', 6240, 8240],
      ['nfc', 13.56, 13.56], ['dect', 1880, 1900], ['wigig', 57000, 66000]] },
    { id: 'iot', c: 3, techs: [
      ['lora868', 863, 870], ['unb868', 868, 868.2], ['nbiot', 700, 2100], ['ltem', 700, 2100],
      ['tsunb', 868, 870], ['dash7', 433.05, 434.79], ['loramesh', 869.4, 869.65], ['srd433', 433.05, 434.79],
      ['srd169', 169.4, 169.8125]] },
    { id: 'sat', c: 4, techs: [
      ['gps-l1', 1575.42, 1575.42], ['gps-l2', 1227.6, 1227.6], ['gps-l5', 1176.45, 1176.45],
      ['galileo', 1164, 1591], ['glonass', 1246, 1616], ['leo-mss-tdma', 1616, 1626.5], ['leo-ku', 10700, 12700],
      ['leo-ka', 17800, 20200], ['geo-mss', 1525, 1559], ['cospas', 406, 406.1], ['leo-mss-cdma', 1610, 1618.7]] },
    { id: 'broadcast', c: 7, techs: [
      ['am', 0.1485, 1.606], ['sw', 2.3, 26.1], ['fm', 87.5, 108], ['dab', 174, 240], ['dvbt2', 470, 694],
      ['dvbs2', 10700, 12750], ['dvbc2', 47, 862]] },
    { id: 'ham', c: 6, techs: [
      ['ham160', 1.81, 2.0], ['ham80', 3.5, 3.8], ['ham60', 5.3515, 5.3665], ['ham40', 7.0, 7.2],
      ['ham30', 10.1, 10.15], ['ham20', 14.0, 14.35], ['ham17', 18.068, 18.168], ['ham15', 21.0, 21.45],
      ['ham12', 24.89, 24.99], ['ham10', 28.0, 29.7], ['ham6', 50, 52], ['ham2', 144, 146], ['ham70', 430, 440],
      ['ham23', 1240, 1300], ['ham13', 2320, 2450], ['ham9', 3400, 3475], ['ham5', 5650, 5850],
      ['ham3', 10000, 10500]] },
    { id: 'pmr', c: 5, techs: [
      ['tetra', 380, 400], ['dmr', 400, 470], ['p25', 138, 870], ['nxdn', 400, 520], ['dpmr', 400, 470],
      ['pmr446', 446, 446.2], ['mcptt', 700, 3800], ['cb', 26.965, 27.405], ['marine', 156, 162.025]] },
    { id: 'fixed', c: 1, hatch: true, techs: [
      ['ptp', 6000, 42000], ['ptp-v', 57000, 71000], ['ptp-e', 71000, 86000]] },
    { id: 'radar', c: 8, techs: [
      ['adsb', 1090, 1090], ['ssr', 1030, 1090], ['vor', 108, 117.95], ['ils', 108.1, 111.95],
      ['dme', 962, 1213], ['ais', 161.975, 162.025], ['acars', 129.125, 136.9], ['autoradar', 76000, 81000]] }
  ].map(function (cat) {
    return { id: cat.id, c: cat.c, hatch: !!cat.hatch, techs: cat.techs.map(function (x) {
      return { id: x[0], fMin: x[1], fMax: x[2], cat: cat.id };
    }) };
  });

  /** Services of the allocation plan, with the category whose colour each takes (none: hollow, dashed). */
  var SERVICES = {
    ham: { c: 6 }, mobile: { c: 2 }, broadcast: { c: 7 }, pmr: { c: 5 }, nav: { c: 8 }, radar: { c: 8, hatch: true },
    sat: { c: 4 }, iot: { c: 3 }, gov: { c: 0 }
  };

  /** EU/HR allocation blocks (simplified major blocks per CEPT/HAKOM), the original's EU_BANDPLAN. */
  var BANDPLAN = [
    ['nav-lf', 0.009, 0.1485, 'nav'], ['lw', 0.1485, 0.2835, 'broadcast'], ['mf-nav', 0.2835, 0.472, 'nav'],
    ['ham630', 0.472, 0.479, 'ham'], ['mw', 0.5265, 1.6065, 'broadcast'],
    ['bp-ham160', 1.81, 2.0, 'ham'], ['bc120', 2.3, 2.498, 'broadcast'], ['bp-ham80', 3.5, 3.8, 'ham'],
    ['bc75', 3.9, 4.0, 'broadcast'], ['bp-ham60', 5.3515, 5.3665, 'ham'], ['bc49', 5.9, 6.2, 'broadcast'],
    ['bp-ham40', 7.0, 7.2, 'ham'], ['bc41', 7.2, 7.45, 'broadcast'], ['bc31', 9.4, 9.9, 'broadcast'],
    ['bp-ham30', 10.1, 10.15, 'ham'], ['bp-ham20', 14.0, 14.35, 'ham'], ['bc19', 15.1, 15.6, 'broadcast'],
    ['bp-ham17', 18.068, 18.168, 'ham'], ['bp-ham15', 21.0, 21.45, 'ham'], ['bp-ham12', 24.89, 24.99, 'ham'],
    ['bc11', 25.67, 26.1, 'broadcast'], ['bp-cb', 26.965, 27.405, 'pmr'], ['bp-ham10', 28.0, 29.7, 'ham'],
    ['gov-vhf', 30, 68, 'gov'], ['bp-ham6', 50, 52, 'ham'], ['pmr-vhf', 68, 74.8, 'pmr'],
    ['bp-fm', 87.5, 108, 'broadcast'], ['aero-nav', 108, 117.975, 'nav'], ['aero-mob', 118, 137, 'nav'],
    ['bp-ham2', 144, 146, 'ham'], ['pmr-mil', 146, 156, 'pmr'], ['bp-marine', 156, 162.05, 'nav'],
    ['gov-util', 162.05, 174, 'gov'], ['band3', 174, 230, 'broadcast'], ['mil-uhf', 230, 328.6, 'gov'],
    ['bp-tetra', 380, 400, 'pmr'], ['met', 400, 410, 'gov'], ['pmr-uhf1', 410, 430, 'pmr'],
    ['bp-ham70', 430, 440, 'ham'], ['pmr-uhf2', 440, 446, 'pmr'], ['bp-pmr446', 446, 446.2, 'pmr'],
    ['pmr-uhf3', 446.2, 470, 'pmr'], ['bp-dvbt', 470, 694, 'broadcast'], ['dd2', 694, 790, 'mobile'],
    ['dd1', 790, 862, 'mobile'], ['srd', 862, 876, 'iot'], ['gsmr', 876, 880, 'mobile'],
    ['bp-gsm900', 880, 960, 'mobile'], ['aero-l', 960, 1215, 'nav'], ['bp-ham23', 1215, 1300, 'ham'],
    ['sdl', 1452, 1492, 'mobile'], ['mss-geo', 1525, 1559, 'sat'], ['gnss', 1559, 1610, 'nav'],
    ['mss-leo', 1610, 1626.5, 'sat'], ['bp-gsm1800', 1710, 1880, 'mobile'], ['bp-dect', 1880, 1900, 'gov'],
    ['bp-umts', 1920, 2170, 'mobile'], ['bp-ham13', 2300, 2450, 'ham'], ['ism24', 2400, 2483.5, 'iot'],
    ['bp-lte2600', 2500, 2690, 'mobile'], ['cband', 3300, 3800, 'mobile'], ['rlan5', 5150, 5725, 'iot'],
    ['ism58', 5725, 5875, 'iot'], ['bp-wifi6e', 5925, 6425, 'iot'], ['fss-ku-dl', 10700, 12750, 'sat'],
    ['fss-ku-ul', 13750, 14500, 'sat'], ['fss-ka-dl', 17700, 19700, 'sat'], ['mmwave26', 24250, 27500, 'mobile'],
    ['ism60', 57000, 66000, 'iot'], ['bp-autoradar', 76000, 81000, 'radar']
  ].map(function (x) { return { id: x[0], fMin: x[1], fMax: x[2], service: x[3] }; });

  /** The ITU decade bands (the original drew VLF to EHF). */
  var ITU = [
    ['VLF', 0.003, 0.03], ['LF', 0.03, 0.3], ['MF', 0.3, 3], ['HF', 3, 30], ['VHF', 30, 300], ['UHF', 300, 3000],
    ['SHF', 3000, 30000], ['EHF', 30000, 300000]
  ].map(function (x) { return { id: x[0], fMin: x[1], fMax: x[2] }; });

  var TECHS = [];
  CATEGORIES.forEach(function (c) { TECHS = TECHS.concat(c.techs); });
  var BY_ID = {};
  TECHS.forEach(function (x) { BY_ID[x.id] = x; });
  BANDPLAN.forEach(function (x) { BY_ID[x.id] = x; });

  // ── the view: a window on log10(f / MHz) ──

  var LOG_MIN = Math.log10(0.009);   // 9 kHz
  var LOG_MAX = Math.log10(300000);  // 300 GHz
  var FULL = LOG_MAX - LOG_MIN;      // 7.52 decades
  /** The original's narrowest view, 0.15 decades. Zoom is a param in tenths of a doubling: zoom 10 = 2×, 20 = 4×. */
  var MIN_SPAN = 0.15;
  var ZOOM_MAX = Math.floor(10 * Math.log2(FULL / MIN_SPAN)); // 56: ×48.5, span 0.155 decades
  /** One wheel notch or key press: the original's 0.85 / 1.18 per notch is about a quarter of a doubling. */
  var ZOOM_STEP = 2;

  function lg(f) { return Math.log10(Math.max(f, 0.001)); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function spanOf(zoom) { return FULL / Math.pow(2, clamp(zoom, 0, ZOOM_MAX) / 10); }

  /** The centre's slider bounds (centi-decades) at a zoom, so that the view stays inside 9 kHz – 300 GHz. */
  function centerBounds(zoom) {
    var half = spanOf(zoom) / 2;
    var lo = Math.ceil((LOG_MIN + half) * 100), hi = Math.floor((LOG_MAX - half) * 100);
    // At zoom 0 the only centre is the middle, which falls between two whole centi-decades.
    if (lo > hi) lo = hi = Math.round((LOG_MIN + LOG_MAX) / 2 * 100);
    return [lo, hi];
  }

  /** The view a param set shows: {lo, hi} in log10 MHz, the centre clamped as the original clamped its pan. */
  function viewOf(p) {
    var span = spanOf(p.zoom);
    var half = span / 2;
    var c = clamp(p.center / 100, LOG_MIN + half, LOG_MAX - half);
    return { lo: c - half, hi: c + half, span: span, factor: FULL / span };
  }

  /** Position of a frequency in the view, 0 at the left edge, 1 at the right (may lie outside). */
  function fracOf(f, view) { return (lg(f) - view.lo) / view.span; }

  /** Params whose view shows [fLo, fHi] whole: the largest zoom that fits it, centred on it. */
  function paramsFor(fLo, fHi) {
    var a = lg(fLo), b = lg(fHi);
    var zoom = clamp(Math.floor(10 * Math.log2(FULL / Math.max(b - a, MIN_SPAN))), 0, ZOOM_MAX);
    var bounds = centerBounds(zoom);
    return { zoom: zoom, center: clamp(Math.round((a + b) / 2 * 100), bounds[0], bounds[1]) };
  }

  /** Zoom by dz steps keeping the frequency under `frac` (0…1 of the width) where it is: wheel, double click. */
  function zoomAt(p, dz, frac) {
    var view = viewOf(p);
    var at = view.lo + clamp(frac, 0, 1) * view.span;
    var zoom = clamp(Math.round(p.zoom + dz), 0, ZOOM_MAX);
    var span = spanOf(zoom);
    var bounds = centerBounds(zoom);
    return { zoom: zoom, center: clamp(Math.round((at - (frac - 0.5) * span) * 100), bounds[0], bounds[1]) };
  }

  /** Pan by a share of the width (drag, keys); positive moves the view to higher frequencies. */
  function panBy(p, dfrac) {
    var view = viewOf(p);
    var bounds = centerBounds(p.zoom);
    return { center: clamp(Math.round(((view.lo + view.hi) / 2 + dfrac * view.span) * 100), bounds[0], bounds[1]) };
  }

  // ── lanes: overlapping bars of one row stack ──

  /** A single frequency (fMin = fMax) is drawn as a marker; for packing it takes this width in decades. */
  var POINT_W = 0.0003;
  /** Two bars in one lane keep this gap in decades. */
  var LANE_GAP = 0.0005;

  /** Greedy interval packing over the whole range (so lanes do not jump while zooming): bars sorted by start, then
      the wider first, then by id; each goes into the first lane whose last bar ends at least LANE_GAP before it.
      Returns { lane: { id: index }, count }. */
  function packLanes(items) {
    var sorted = items.slice().sort(function (a, b) {
      return lg(a.fMin) - lg(b.fMin) || lg(b.fMax) - lg(a.fMax) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
    var ends = [], lane = {};
    sorted.forEach(function (x) {
      var s = lg(x.fMin), e = Math.max(lg(x.fMax), s + POINT_W);
      var i = 0;
      while (i < ends.length && ends[i] + LANE_GAP > s) i++;
      ends[i] = e;
      lane[x.id] = i;
    });
    return { lane: lane, count: ends.length };
  }

  /** Do two frequency ranges share any frequency? The original's test (closed ranges). */
  function overlaps(a, b) { return a.fMin <= b.fMax && a.fMax >= b.fMin; }

  /** The allocation blocks a technology falls into, in plan order. */
  function bandsOf(id) {
    var x = BY_ID[id];
    return BANDPLAN.filter(function (b) { return overlaps(x, b); }).map(function (b) { return b.id; });
  }
  /** The technologies inside an allocation block: narrowest first (the ones made for it), then by start and id. */
  function techsIn(id) {
    var b = BY_ID[id];
    return TECHS.filter(function (x) { return overlaps(x, b); }).sort(function (x, y) {
      return (lg(x.fMax) - lg(x.fMin)) - (lg(y.fMax) - lg(y.fMin)) || x.fMin - y.fMin || (x.id < y.id ? -1 : 1);
    }).map(function (x) { return x.id; });
  }

  // ── what the page draws ──

  /** Bars of one row in the view, as shares of the width: x, w (a point gets w 0), lane. Off-view bars are left out. */
  function rowBars(items, lanes, view) {
    var out = [];
    items.forEach(function (x) {
      var a = fracOf(x.fMin, view), b = fracOf(x.fMax, view);
      if (b < 0 || a > 1) return;
      out.push({ id: x.id, x: a, w: b - a, lane: lanes.lane[x.id], point: x.fMin === x.fMax });
    });
    return out;
  }

  /** Drop the lanes that have no bar in the view, keeping the others in their order, so a zoomed row does not
      keep empty lanes. Returns { lanes (at least 1), bars } with the lanes renumbered from 0. */
  function compactLanes(bars) {
    var used = [];
    bars.forEach(function (b) { if (used.indexOf(b.lane) < 0) used.push(b.lane); });
    used.sort(function (a, b) { return a - b; });
    return { lanes: Math.max(1, used.length), bars: bars.map(function (b) {
      return { id: b.id, x: b.x, w: b.w, lane: used.indexOf(b.lane), point: b.point };
    }) };
  }

  /** Where each bar's label goes at a pixel width: 'in' the bar if it fits, else to the 'right' if the lane is
      free up to the next bar (or the edge), else 'none'. `widths` are the label widths in px; bars narrower than
      minPx are drawn minPx wide, centred, as the original did. Returns { id: mode }. */
  function labelModes(bars, widthPx, widths, opts) {
    var pad = (opts && opts.pad) || 8, minPx = (opts && opts.minPx) || 4;
    var byLane = {};
    bars.forEach(function (b) { (byLane[b.lane] = byLane[b.lane] || []).push(b); });
    var out = {};
    Object.keys(byLane).forEach(function (k) {
      var lane = byLane[k].map(function (b) {
        var w = b.w * widthPx, x = b.x * widthPx;
        if (w < minPx) { x += w / 2 - minPx / 2; w = minPx; }
        return { id: b.id, x: x, w: w };
      }).sort(function (a, b) { return a.x - b.x || (a.id < b.id ? -1 : 1); });
      var taken = -Infinity;
      lane.forEach(function (b, i) {
        var tw = widths[b.id] + pad;
        var left = Math.max(b.x, 0), right = Math.min(b.x + b.w, widthPx);
        var next = i + 1 < lane.length ? lane[i + 1].x : widthPx;
        if (right - left >= tw) out[b.id] = 'in';
        else if (right >= taken && right + tw <= next && right + tw <= widthPx) { out[b.id] = 'right'; taken = right + tw; return; }
        else out[b.id] = 'none';
        taken = Math.max(taken, right);
      });
    });
    return out;
  }

  /** Tick frequencies for a view: every decade, and more mantissas as the view narrows (the original's levels:
      2, 3, 5 under 3 decades; 1.5, 4, 6, 8 under 1.5; then, instead of the original's 1.1, 1.6, 2.1 …, every half
      under 0.7 and every tenth under 0.3, so labels stay round). Rounded, sorted, unique. */
  function ticks(view) {
    var span = view.span, m = [1], k;
    if (span < 3) m = m.concat([2, 3, 5]);
    if (span < 1.5) m = m.concat([1.5, 4, 6, 8]);
    if (span < 0.7) for (k = 2; k < 20; k++) m.push(k / 2);
    if (span < 0.3) for (k = 11; k < 100; k++) m.push(k / 10);
    var out = [];
    for (var d = Math.floor(view.lo); d <= Math.ceil(view.hi); d++) {
      m.forEach(function (x) {
        var f = Number((x * Math.pow(10, d)).toPrecision(6));
        var l = lg(f);
        if (l >= view.lo && l <= view.hi && out.indexOf(f) < 0) out.push(f);
      });
    }
    return out.sort(function (a, b) { return a - b; });
  }

  /** Drop ticks whose labels would touch: keep one, skip the next ones closer than minGap (shares of the width).
      Decades win over the others, so the scale keeps its powers of ten. */
  function thinTicks(fs, view, minGap) {
    var decade = function (f) { return Math.abs(lg(f) - Math.round(lg(f))) < 1e-9; };
    var order = fs.slice().sort(function (a, b) { return (decade(b) - decade(a)) || a - b; });
    var kept = [];
    order.forEach(function (f) {
      var x = fracOf(f, view);
      if (kept.every(function (k) { return Math.abs(fracOf(k, view) - x) >= minGap; })) kept.push(f);
    });
    return kept.sort(function (a, b) { return a - b; });
  }

  /** A frequency in MHz as { num, unit }: kHz under 1 MHz, GHz from 1000 MHz, else MHz; at most `digits` decimals
      (default 5, enough for every frequency in the data), trailing zeros dropped. `num` uses a point. */
  function formatFreq(f, digits) {
    var d = digits == null ? 5 : digits;
    var unit = 'MHz', v = f;
    if (f < 1) { unit = 'kHz'; v = f * 1000; } else if (f >= 1000) { unit = 'GHz'; v = f / 1000; }
    var s = v.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return { num: s, unit: unit };
  }

  // ── params, presets, state ──

  var CAT_KEYS = CATEGORIES.map(function (c) { return 'cat-' + c.id; });

  var defaults = { center: Math.round((LOG_MIN + LOG_MAX) / 2 * 100), zoom: 0, plan: true, sel: '' };
  CAT_KEYS.forEach(function (k) { defaults[k] = true; });

  function view(id, fLo, fHi, sel) {
    var p = paramsFor(fLo, fHi);
    if (sel) p.sel = sel;
    return { id: id, params: p };
  }
  /** Views a lecturer shows: where the bands crowd or collide. */
  var presets = [
    { id: 'all', params: { zoom: 0, center: defaults.center } },
    view('hf', 1.7, 30, 'bp-ham40'),
    view('vhf', 30, 300, 'aero-nav'),
    view('uhf', 370, 1000, 'dd2'),
    view('lband', 1100, 1700, 'gnss'),
    view('ism24', 2250, 2750, 'ism24'),
    view('cband', 3200, 3900, 'ham9'),
    view('mmwave', 20000, 90000, 'ism60')
  ];

  function catOn(p, id) { return p['cat-' + id] !== false; }

  /** Lanes are packed once per row, over the whole range. */
  var PLAN_LANES = packLanes(BANDPLAN);
  var CAT_LANES = {};
  CATEGORIES.forEach(function (c) { CAT_LANES[c.id] = packLanes(c.techs); });

  function initial(p) {
    var v = viewOf(p);
    var rows = CATEGORIES.filter(function (c) { return catOn(p, c.id); }).map(function (c) {
      var r = compactLanes(rowBars(c.techs, CAT_LANES[c.id], v));
      return { id: c.id, lanes: r.lanes, bars: r.bars };
    });
    var sel = BY_ID[p.sel] && (p.plan || !BY_ID[p.sel].service) && (BY_ID[p.sel].service || catOn(p, BY_ID[p.sel].cat))
      ? p.sel : '';
    return {
      view: v,
      itu: rowBars(ITU, { lane: {}, count: 1 }, v).map(function (b) { b.lane = 0; return b; }),
      plan: p.plan ? compactLanes(rowBars(BANDPLAN, PLAN_LANES, v)) : null,
      rows: rows,
      ticks: ticks(v),
      sel: sel,
      selKind: sel ? (BY_ID[sel].service ? 'band' : 'tech') : null,
      related: sel ? (BY_ID[sel].service ? techsIn(sel) : bandsOf(sel)) : []
    };
  }

  var logic = {
    CATEGORIES: CATEGORIES, SERVICES: SERVICES, BANDPLAN: BANDPLAN, ITU: ITU, TECHS: TECHS, BY_ID: BY_ID,
    LOG_MIN: LOG_MIN, LOG_MAX: LOG_MAX, FULL: FULL, ZOOM_MAX: ZOOM_MAX, ZOOM_STEP: ZOOM_STEP, MIN_SPAN: MIN_SPAN,
    CAT_KEYS: CAT_KEYS, PLAN_LANES: PLAN_LANES, CAT_LANES: CAT_LANES,
    defaults: defaults, presets: presets, steps: 0,
    spanOf: spanOf, centerBounds: centerBounds, viewOf: viewOf, fracOf: fracOf, paramsFor: paramsFor, zoomAt: zoomAt,
    panBy: panBy, packLanes: packLanes, compactLanes: compactLanes, overlaps: overlaps, bandsOf: bandsOf, techsIn: techsIn, rowBars: rowBars,
    labelModes: labelModes, ticks: ticks, thinTicks: thinTicks, formatFreq: formatFreq, catOn: catOn,
    initial: initial
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
