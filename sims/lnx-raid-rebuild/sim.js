/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-raid-rebuild: a RAID 5 or RAID 6 array of n disks with one spare. Step 1 fails a disk and the
   rebuild onto the spare starts; each further step rebuilds one band (10 % of the disk): the band is read from every
   surviving disk, the missing data computed and written to the spare, and the clock advances by bandBytes / speed.
   Scripted later failures (by hour) and unreadable sectors (UREs, placed by the seed) happen inside the bands.
   UREs: the number of bits read until the next URE is exponential with mean `rate` (a datasheet's "1 per 10^14
   bits"), so P(at least one in B bits) = 1 − e^(−B/rate) (rule 3). The seed draws the gaps with mulberry32, the same
   generator as Simdeck.rng (sim.test.js checks they agree). Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var BANDS = 10;
  var FIRST = 2;                                   // the disk that fails in step 1 (sdc)
  /** Later failures, by hour since the first one (param `later`); they hit disks n − 1, then 0. */
  var LATER = { none: [], h15: [15], 'h18-32': [18, 32] };
  var LEVELS = [5, 6], SIZES = [4, 6, 12], SPEEDS = [200, 50], RATES = ['1e14', '1e15'], ON_URE = ['abort', 'badblock'];
  /** md's /proc/sys/dev/raid limits in KiB/s (kernel admin-guide md.rst, check). */
  var SPEED_LIMIT_MIN = 1000, SPEED_LIMIT_MAX = 200000;

  /** mulberry32, the same generator as Simdeck.rng. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pick(v, list, def) { for (var i = 0; i < list.length; i++) if (String(list[i]) === String(v)) return list[i]; return def; }
  function int(v, lo, hi, def) { v = Math.round(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def; }

  /** Parameters, cleaned, plus every derived number of the run (SPEC.md "Numbers"). */
  function norm(p) {
    p = p || {};
    var o = {
      level: pick(p.level, LEVELS, 5),
      n: int(p.n, 4, 16, 4),
      sizeTB: pick(p.sizeTB, SIZES, 4),
      speed: pick(p.speed, SPEEDS, 200),
      ureRate: pick(p.ureRate, RATES, '1e14'),
      onUre: pick(p.onUre, ON_URE, 'abort'),
      later: LATER[p.later] ? p.later : 'none',
      seed: int(p.seed, 1, 99, 18)
    };
    o.rate = Number(o.ureRate);
    o.parity = o.level - 4;                                   // RAID 5: 1, RAID 6: 2
    o.devBytes = o.sizeTB * 1e12;
    o.bandBits = o.devBytes / BANDS * 8;
    o.bandHours = o.devBytes / BANDS / (o.speed * 1e6) / 3600;
    o.totalHours = o.bandHours * BANDS;                        // rule 2: size / speed
    o.plannedBits = (o.n - 1) * o.devBytes * 8;                // rule 1: every surviving disk, read in full
    o.pUre = pAtLeastOne(o.plannedBits, o.rate);               // rule 3
    o.devKiB = o.devBytes / 1024;
    o.speedK = Math.floor(o.speed * 1e6 / 1024);
    return o;
  }

  /** Rule 3: P(≥ 1 URE in `bits`) = 1 − (1 − 1/rate)^bits ≈ 1 − e^(−bits/rate). */
  function pAtLeastOne(bits, rate) { return 1 - Math.exp(-bits / rate); }

  /** Where the UREs fall: cumulative bit counts (and a second draw that picks the disk), up to the most a rebuild
      can read. Gaps are exponential with mean `rate`: X += −ln(1 − u) · rate. */
  function ureList(o) {
    var r = rng(o.seed), x = 0, out = [], max = o.plannedBits;
    for (;;) {
      var u = r(), v = r();
      x += -Math.log(1 - u) * o.rate;
      if (x > max) return out;
      out.push({ at: x, v: v });
    }
  }

  function diskName(i) { return 'sd' + String.fromCharCode(97 + i); }

  /** Parity left: the level's parity minus the failed disks, plus one once the spare has taken a failed disk's place. */
  function parityLeft(s) {
    var f = s.disks.filter(function (d) { return d.status === 'failed'; }).length;
    return (s.level - 4) - f + (s.spare.status === 'in' ? 1 : 0);
  }
  /** Array state (ossim-raid-cache words): failed (no parity left to lose, or the rebuild aborted), rebuilding,
      degraded, optimal. */
  function arrayState(s) {
    if (s.aborted || parityLeft(s) < 0) return 'failed';
    if (s.spare.status === 'rebuilding') return 'rebuilding';
    return parityLeft(s) < s.level - 4 ? 'degraded' : 'optimal';
  }

  /** /proc/mdstat as fields: members newest first (the spare is role n), (F) failed, (S) spare; [n/active] [map] with
      U in sync, _ missing (the slot being recovered stays _ until the rebuild is done); the recovery line. */
  function mdstat(s, o) {
    var map = s.disks.map(function (d, i) {
      if (d.status !== 'failed') return 'U';
      return i === FIRST && s.spare.status === 'in' ? 'U' : '_';
    }).join('');
    var members = [{ name: s.spare.name, role: s.n, F: false, S: s.spare.status === 'spare' }];
    for (var i = s.n - 1; i >= 0; i--) members.push({ name: s.disks[i].name, role: i, F: s.disks[i].status === 'failed', S: false });
    var active = map.split('').filter(function (x) { return x === 'U'; }).length;
    var rec = null;
    if (s.spare.status === 'rebuilding') {
      var done = Math.round(s.progress * o.devKiB);
      rec = { done: done, total: o.devKiB, speedK: o.speedK };
    }
    return { level: s.level, members: members, n: s.n, active: active, map: map, blocks: (s.n - o.parity) * o.devKiB, recovery: rec };
  }
  /** The /proc/mdstat text (md's layout; the recovery bar as md's status_resync draws it). */
  function mdstatLines(m) {
    var out = ['Personalities : [raid6] [raid5] [raid4]',
      'md0 : active raid' + m.level + ' ' + m.members.map(function (x) {
        return x.name + '[' + x.role + ']' + (x.F ? '(F)' : '') + (x.S ? '(S)' : '');
      }).join(' '),
      '      ' + m.blocks + ' blocks super 1.2 level ' + m.level + ', 512k chunk, algorithm 2 [' + m.n + '/' + m.active + '] [' + m.map + ']'];
    if (m.recovery) {
      var r = m.recovery;
      var pm = Math.floor(r.done * 1000 / r.total), x = Math.floor(pm / 50);
      var bar = '[' + new Array(x + 1).join('=') + '>' + new Array(20 - x + 1).join('.') + ']';
      var rt = Math.floor((r.total - r.done) / r.speedK);
      var pct = Math.floor(pm / 10) + '.' + (pm % 10);
      out.push('      ' + bar + '  recovery = ' + (pct.length < 4 ? ' ' : '') + pct + '% (' + r.done + '/' + r.total + ')' +
        ' finish=' + Math.floor(rt / 60) + '.' + Math.floor((rt % 60) / 6) + 'min speed=' + r.speedK + 'K/sec');
    }
    out.push('unused devices: <none>');
    return out;
  }

  function finish(s, o) {
    s.array = arrayState(s);
    s.parityLeft = Math.max(0, parityLeft(s));
    s.mdstat = mdstat(s, o);
    s.pSoFar = pAtLeastOne(s.bitsRead, o.rate);
    return s;
  }

  function blank(o) {
    var s = {
      level: o.level, n: o.n,
      disks: [], spare: { name: diskName(o.n), status: 'spare', bands: new Array(BANDS).fill(null) },
      band: 0, progress: 0, hours: 0, bitsRead: 0, nextUre: 0, ures: [], lostStripes: 0, aborted: false,
      failedAt: [], i: 0, ev: null
    };
    for (var i = 0; i < o.n; i++) s.disks.push({ name: diskName(i), status: 'ok', why: null });
    return finish(s, o);
  }

  /** Step 1: disk FIRST fails; md starts recovery onto the spare at once. */
  function failFirst(s0, o) {
    var s = clone(s0);
    s.disks[FIRST].status = 'failed';
    s.disks[FIRST].why = 'fail';
    s.failedAt.push({ disk: s.disks[FIRST].name, hours: 0 });
    s.spare.status = 'rebuilding';
    s.ev = { kind: 'fail', disk: s.disks[FIRST].name, band: 0, fails: [], ures: [], done: false, failed: false, cause: null, after: [] };
    return finish(s, o);
  }

  /** Steps 2–11: rebuild band b (1..10). Order inside a band (rule 7): scripted failures first, then the read and any
      URE in it, then the write to the spare. */
  function rebuildBand(s0, b, o) {
    var s = clone(s0);
    var ev = { kind: 'band', band: b, fails: [], ures: [], done: false, failed: false, cause: null, after: [] };
    s.ev = ev;
    var t0 = (b - 1) * o.bandHours, t1 = b * o.bandHours;
    var hours = LATER[o.later], targets = [s.n - 1, 0];
    for (var k = 0; k < hours.length; k++) {
      if (!(hours[k] > t0 && hours[k] <= t1)) continue;
      var d = s.disks[targets[k]];
      if (d.status === 'failed') continue;
      d.status = 'failed';
      d.why = 'fail';
      s.hours = hours[k];
      s.failedAt.push({ disk: d.name, hours: hours[k] });
      ev.fails.push({ disk: d.name, hours: hours[k], nth: s.failedAt.length });
      if (parityLeft(s) < 0) {                                       // rule 6: one failure more than the parity
        s.spare.status = 'stopped';
        s.progress = (b - 1) / BANDS + (hours[k] - t0) / o.bandHours / BANDS;
        ev.failed = true;
        ev.cause = 'fail';
        return finish(s, o);
      }
    }
    // read the band from every surviving disk (rule 1)
    var alive = s.disks.filter(function (x) { return x.status !== 'failed'; });
    var bits = alive.length * o.bandBits, from = s.bitsRead, to = from + bits;
    var list = ureList(o), lost = false;
    while (s.nextUre < list.length && list[s.nextUre].at <= to) {
      var u = list[s.nextUre++];
      var src = alive[Math.floor(u.v * alive.length)];
      var frac = (u.at - from) / bits;
      if (parityLeft(s) >= 1) {                                      // rule 5: a parity is left, the sector is rebuilt
        s.ures.push({ disk: src.name, band: b, result: 'fixed' });
        ev.ures.push({ disk: src.name, result: 'fixed' });
      } else if (o.onUre === 'abort') {                              // rule 4: nothing to rebuild it from
        s.ures.push({ disk: src.name, band: b, result: 'abort' });
        ev.ures.push({ disk: src.name, result: 'abort' });
        src.status = 'failed';
        src.why = 'ure';
        s.aborted = true;
        s.spare.status = 'stopped';
        s.bitsRead = u.at;
        s.hours = t0 + frac * o.bandHours;
        s.progress = (b - 1 + frac) / BANDS;
        ev.failed = true;
        ev.cause = 'ure';
        return finish(s, o);
      } else {                                                       // rule 4: bad block on the new disk, go on
        s.ures.push({ disk: src.name, band: b, result: 'lost' });
        ev.ures.push({ disk: src.name, result: 'lost' });
        s.lostStripes += 1;
        lost = true;
      }
    }
    s.spare.bands[b - 1] = lost ? 'lost' : 'ok';
    s.bitsRead = to;
    s.hours = t1;
    s.band = b;
    s.progress = b / BANDS;
    if (b === BANDS) {
      s.spare.status = 'in';
      ev.done = true;
      ev.after = hours.filter(function (hh, k2) { return hh > t1 && s.disks[targets[k2]].status !== 'failed'; });
    }
    return finish(s, o);
  }

  /** Step n from step n − 1 (n ≥ 1). After a failed array there is nothing left to do (steps() stops there). */
  function next(s, n, o) {
    if (n === 1) return failFirst(s, o);
    if (s.array === 'failed' || s.spare.status !== 'rebuilding') return s;
    return rebuildBand(s, n - 1, o);
  }

  /** Steps: 1 (the failure) + one per band, fewer when the array fails. */
  function steps(p) {
    var o = norm(p), s = blank(o);
    for (var n = 1; n <= BANDS + 1; n++) {
      s = next(s, n, o);
      if (s.array === 'failed') return n;
    }
    return BANDS + 1;
  }

  var logic = {
    BANDS: BANDS, FIRST: FIRST, LATER: LATER, LEVELS: LEVELS, SIZES: SIZES, SPEEDS: SPEEDS, RATES: RATES, ON_URE: ON_URE,
    SPEED_LIMIT_MIN: SPEED_LIMIT_MIN, SPEED_LIMIT_MAX: SPEED_LIMIT_MAX,

    /** Parameter defaults (SPEC.md "Params"): the raid5-ure preset. */
    defaults: { level: 5, n: 4, sizeTB: 4, speed: 200, ureRate: '1e14', onUre: 'abort', later: 'none', seed: 18 },

    steps: steps,
    norm: norm,

    initial: function (p) { return blank(norm(p)); },

    step: function (s, n, p) {
      var r = next(s, n, norm(p));
      r = r === s ? clone(s) : r;
      r.i = n;
      return r;
    },

    rng: rng,
    ureList: ureList,
    pAtLeastOne: pAtLeastOne,
    parityLeft: parityLeft,
    arrayState: arrayState,
    mdstat: mdstat,
    mdstatLines: mdstatLines,
    diskName: diskName
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
