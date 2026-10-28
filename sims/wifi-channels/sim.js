/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for wifi-channels: access points on a floor plan, each on a channel of the 2.4 GHz or the 5 GHz band.
   An explorer: derive(params) gives the whole state; rules and numbers in SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Band edges in MHz (ETSI EN 300 328 for 2.4 GHz; ECC/DEC/(04)08 as quoted in URM ch. 17 for 5 GHz). */
  var BANDS = {
    '2.4': { lo: 2400, hi: 2483.5 },
    '5': { lo: 5150, hi: 5725 }
  };
  /** 5 GHz sub-bands (URM ch. 17): DFS where radar shares the band; 5350–5470 is not open to Wi-Fi in Europe. */
  var SUBBANDS = [
    { lo: 5150, hi: 5250, kind: 'indoor' },
    { lo: 5250, hi: 5350, kind: 'dfs' },
    { lo: 5350, hi: 5470, kind: 'closed' },
    { lo: 5470, hi: 5725, kind: 'dfs' }
  ];
  var WIDTHS = { '2.4': [20, 22, 40], '5': [20, 40, 80, 160] };

  /** EU 5 GHz channels per width (rule 2): 20 MHz 36–64 and 100–140, bonded blocks named by their centre. */
  var FIVE = {
    20: [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140],
    40: [38, 46, 54, 62, 102, 110, 118, 126, 134],
    80: [42, 58, 106, 122],
    160: [50, 114]
  };

  /** AP positions in metres (rule 4's floor model): a row 20 m apart, or the corners of a 20 m square. */
  var LAYOUTS = {
    row3: { w: 60, h: 20, aps: [{ id: 'A', x: 10, y: 10 }, { id: 'B', x: 30, y: 10 }, { id: 'C', x: 50, y: 10 }] },
    square4: { w: 40, h: 40, aps: [{ id: 'A', x: 10, y: 10 }, { id: 'B', x: 30, y: 10 }, { id: 'C', x: 10, y: 30 }, { id: 'D', x: 30, y: 30 }] }
  };
  var CH_KEYS = { A: 'chA', B: 'chB', C: 'chC', D: 'chD' };

  /** Does [lo, hi] overlap a DFS sub-band? Touching an edge does not count (rule 3). */
  function isDfs(lo, hi) {
    return SUBBANDS.some(function (s) { return s.kind === 'dfs' && lo < s.hi && hi > s.lo; });
  }

  /**
   * The channels of a band at one width, in order: { ch, label, primary, centre, lo, hi, dfs }.
   * 2.4 GHz (rule 1): centre 2407 + 5n, n = 1–13; 20 MHz ± 10, 802.11b DSSS (22) ± 11; 40 MHz (rule 8) is
   * primary n with the secondary n + 4 above it, n = 1–9, spanning 2407 + 5n − 10 … + 30.
   * 5 GHz (rule 2): centre 5000 + 5n, ± width / 2; a bonded block's primary is taken as the block itself.
   */
  function channels(band, width) {
    var out = [];
    if (band === '2.4') {
      var n, c;
      if (width === 40) {
        for (n = 1; n <= 9; n++) {
          c = 2407 + 5 * (n + 2);
          out.push({ ch: n, label: n + '+' + (n + 4), primary: n, centre: c, lo: c - 20, hi: c + 20, dfs: false });
        }
      } else {
        var half = width === 22 ? 11 : 10;
        for (n = 1; n <= 13; n++) {
          c = 2407 + 5 * n;
          out.push({ ch: n, label: String(n), primary: n, centre: c, lo: c - half, hi: c + half, dfs: false });
        }
      }
      return out;
    }
    return (FIVE[width] || FIVE[20]).map(function (ch) {
      var c = 5000 + 5 * ch, hw = (FIVE[width] ? width : 20) / 2;
      return { ch: ch, label: String(ch), primary: ch, centre: c, lo: c - hw, hi: c + hw, dfs: isDfs(c - hw, c + hw) };
    });
  }

  function bandOf(p) { return p.band === '5' ? '5' : '2.4'; }
  function widthOf(p) {
    var band = bandOf(p), w = band === '5' ? p.width5 : p.width24;
    return WIDTHS[band].indexOf(w) >= 0 ? w : 20;
  }
  /** The channel list the page's sliders index into. */
  function listFor(p) { return channels(bandOf(p), widthOf(p)); }
  /** Index of channel ch in a band's list at a width (presets are written with channel numbers). */
  function indexOf(band, width, ch) {
    var i = channels(band, width).map(function (c) { return c.ch; }).indexOf(ch);
    if (i < 0) throw new Error('no channel ' + ch + ' at ' + band + ' GHz, ' + width + ' MHz');
    return i;
  }

  /**
   * Channel params for a new width (or band) that keep each AP where it was: the channel with the same primary if the
   * list has it, else one that contains the AP's reference frequency (its primary's centre at 2.4 GHz, its lowest
   * 20 MHz channel at 5 GHz), nearest centre first, lower channel on a tie; with none containing it, the nearest
   * centre. aps are { id, primary, centre, lo } from a state of the same band.
   */
  function remap(aps, band, width) {
    var list = channels(band, width), out = {};
    aps.forEach(function (a) {
      var ref = band === '2.4' ? 2407 + 5 * a.primary : a.lo + 10;
      var keyOf = function (c) { return [c.primary === a.primary ? 0 : 1, c.lo < ref && ref < c.hi ? 0 : 1, Math.abs(c.centre - ref), c.ch]; };
      var less = function (x, y) { for (var k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] < y[k]; return false; };
      var best = 0;
      list.forEach(function (c, i) { if (less(keyOf(c), keyOf(list[best]))) best = i; });
      out[CH_KEYS[a.id]] = best;
    });
    return out;
  }

  /** Overlap in MHz of two ranges; 0 when they only touch (rule 6). */
  function overlap(a, b) { return Math.max(0, Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo)); }

  /** Rule 5 for a pair that hears each other; 'none' when out of range. */
  function kindOf(a, b, inRange) {
    if (!inRange) return 'none';
    if (a.primary === b.primary) return 'cci';
    return overlap(a, b) > 0 ? 'overlap' : 'none';
  }

  /** Spectrum lanes: each AP in the first lane where it overlaps no block already there, in AP order. */
  function lanes(aps) {
    var rows = [], out = {};
    aps.forEach(function (ap) {
      var i = 0;
      while (rows[i] && rows[i].some(function (o) { return overlap(o, ap) > 0; })) i++;
      (rows[i] = rows[i] || []).push(ap);
      out[ap.id] = i;
    });
    return out;
  }

  var round1 = function (x) { return Math.round(x * 10) / 10; };

  /** The whole state from the params. */
  function derive(p) {
    var band = bandOf(p), width = widthOf(p), list = channels(band, width);
    var layout = LAYOUTS[p.layout] ? p.layout : 'row3';
    var range = Number(p.range);
    var aps = LAYOUTS[layout].aps.map(function (pos) {
      var i = Math.max(0, Math.min(list.length - 1, Math.round(Number(p[CH_KEYS[pos.id]]) || 0)));
      var c = list[i];
      return { id: pos.id, x: pos.x, y: pos.y, idx: i, ch: c.ch, label: c.label, primary: c.primary, centre: c.centre,
        width: width, lo: c.lo, hi: c.hi, dfs: c.dfs };
    });
    var pairs = [], sharers = {}, warned = {};
    aps.forEach(function (a) { sharers[a.id] = 0; warned[a.id] = false; });
    for (var i = 0; i < aps.length; i++) {
      for (var j = i + 1; j < aps.length; j++) {
        var a = aps[i], b = aps[j];
        var dist = Math.hypot(a.x - b.x, a.y - b.y);
        var inRange = dist <= range; // rule 4: at exactly the range they still hear each other
        var kind = kindOf(a, b, inRange);
        var ov = overlap(a, b);
        pairs.push({ a: a.id, b: b.id, dist: round1(dist), inRange: inRange, kind: kind, overlap: ov,
          from: ov > 0 ? Math.max(a.lo, b.lo) : null, to: ov > 0 ? Math.min(a.hi, b.hi) : null });
        if (kind === 'cci') { sharers[a.id]++; sharers[b.id]++; }
        if (kind === 'overlap') { warned[a.id] = true; warned[b.id] = true; }
      }
    }
    var airtime = {};
    aps.forEach(function (a) { airtime[a.id] = 1 / (1 + sharers[a.id]); }); // rule 7
    var lane = lanes(aps);
    aps.forEach(function (a) { a.lane = lane[a.id]; });
    return {
      band: band, width: width, layout: layout, range: range,
      span: BANDS[band], floor: { w: LAYOUTS[layout].w, h: LAYOUTS[layout].h },
      aps: aps, pairs: pairs, airtime: airtime, sharers: sharers, warned: warned,
      lanes: aps.reduce(function (m, a) { return Math.max(m, a.lane + 1); }, 0),
      cci: pairs.filter(function (q) { return q.kind === 'cci'; }).length,
      overlaps: pairs.filter(function (q) { return q.kind === 'overlap'; }).length
    };
  }

  /**
   * What changed since the state before the last input: the APs whose block moved (channel or width) and the pairs
   * whose kind changed. A change of band or layout marks nothing (there is no "same AP" to compare).
   */
  function changed(prev, s) {
    var none = { aps: [], pairs: [] };
    if (!prev || prev.band !== s.band || prev.layout !== s.layout) return none;
    var byId = {};
    prev.aps.forEach(function (a) { byId[a.id] = a; });
    var kinds = {};
    prev.pairs.forEach(function (q) { kinds[q.a + q.b] = q.kind; });
    return {
      aps: s.aps.filter(function (a) { var o = byId[a.id]; return o.lo !== a.lo || o.hi !== a.hi || o.primary !== a.primary; })
        .map(function (a) { return a.id; }),
      pairs: s.pairs.filter(function (q) { return kinds[q.a + q.b] !== q.kind; }).map(function (q) { return q.a + q.b; })
    };
  }

  var defaults = { band: '2.4', width24: 20, width5: 20, layout: 'row3', range: 25, chA: 5, chB: 5, chC: 5, chD: 0 };

  /** The page's presets (params only; names and hints are strings). Channels are given by number. */
  function preset(id, band, width, layout, range, chs) {
    var p = { band: band, layout: layout, range: range };
    p[band === '5' ? 'width5' : 'width24'] = width;
    ['A', 'B', 'C', 'D'].forEach(function (k, i) { if (chs[i] != null) p[CH_KEYS[k]] = indexOf(band, width, chs[i]); });
    return { id: id, params: p };
  }
  var presets = [
    preset('all-on-6', '2.4', 20, 'row3', 25, [6, 6, 6]),
    preset('one-six-eleven', '2.4', 20, 'row3', 25, [1, 6, 11]),
    preset('one-three-six', '2.4', 20, 'row3', 25, [1, 3, 6]),
    preset('four-in-a-square', '2.4', 20, 'square4', 30, [1, 6, 11, 1]),
    preset('five-ghz-80', '5', 80, 'square4', 60, [42, 58, 106, 122]),
    preset('five-ghz-160', '5', 160, 'square4', 60, [50, 50, 114, 114])
  ];

  var logic = {
    defaults: defaults,
    initial: derive,
    derive: derive,
    changed: changed,
    remap: remap,
    channels: channels,
    listFor: listFor,
    indexOf: indexOf,
    widthOf: widthOf,
    overlap: overlap,
    kindOf: kindOf,
    isDfs: isDfs,
    lanes: lanes,
    presets: presets,
    BANDS: BANDS,
    SUBBANDS: SUBBANDS,
    WIDTHS: WIDTHS,
    LAYOUTS: LAYOUTS,
    CH_KEYS: CH_KEYS,
    withDefaults: function (over) { return Object.assign({}, defaults, over || {}); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
