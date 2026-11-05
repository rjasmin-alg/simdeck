/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ec-vs-replication: overhead vs failures tolerated vs rebuild cost, n replicas against erasure coding k+m.
   An explorer: the state is a pure function of the params (no steps). One object of S = 4 MiB is stored by the
   current scheme and by the alternative on the same row of hosts; failed hosts (a bit mask) take their pieces away.
   For every scheme it derives the overhead, the failures tolerated with data intact and with I/O continuing, the
   status under the current failures, the bytes read to rebuild, and a rebuild plan (target host and sources).
   Rules: SPEC.md (from cephsim js/engine/pgmap.js poolWidth, poolMinSize, poolEfficiency, pgState, and the Ceph docs).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. No words here. */
(function (root) {
  'use strict';

  var MIB = 1048576;
  var TIB = 1099511627776;
  var TB = 1e12;
  var OBJECT = 4 * MIB;          // S: one object
  var POOL_DATA = 60 * TIB;      // cephsim threeRacks cephfs_data stored
  var DISK = 8 * TB;             // one disk, for the rebuild of a whole disk
  var MAX_HOSTS = 12;

  var RANGE = { n: [2, 4], k: [2, 8], m: [1, 3], hosts: [3, MAX_HOSTS], failed: [0, (1 << MAX_HOSTS) - 1] };

  var defaults = { scheme: 'ec', n: 3, k: 4, m: 2, minSize: 'default', minCustom: 4, hosts: 9, failed: 0 };

  var presets = [
    { id: 'three-copies', params: { scheme: 'rep', n: 3, k: 4, m: 2, hosts: 9, failed: 1 } },
    { id: 'ec-4-2', params: { scheme: 'ec', n: 3, k: 4, m: 2, hosts: 9, failed: 3 } },
    { id: 'ec-8-3', params: { scheme: 'ec', n: 3, k: 8, m: 3, hosts: 12, failed: 1 } },
    { id: 'same-hardware', params: { scheme: 'rep', n: 3, k: 4, m: 2, hosts: 9, failed: 0 } },
    { id: 'min-size-k', params: { scheme: 'ec', n: 3, k: 4, m: 2, minSize: 'custom', minCustom: 4, hosts: 9, failed: 3 } }
  ];

  function int(v, key) {
    var x = Math.round(Number(v)), r = RANGE[key];
    if (!Number.isFinite(x)) x = defaults[key];
    return Math.min(r[1], Math.max(r[0], x));
  }

  /** Rule 3: the custom min_size range of a scheme. */
  function minRange(sch) { return sch.kind === 'rep' ? [1, sch.n] : [sch.k, sch.k + sch.m]; }

  /** Params → clean values (a URL may carry anything). minCustom is clamped to the current scheme's range. */
  function norm(p) {
    p = p || {};
    var q = {
      scheme: p.scheme === 'rep' ? 'rep' : 'ec',
      n: int(p.n, 'n'), k: int(p.k, 'k'), m: int(p.m, 'm'),
      minSize: p.minSize === 'custom' ? 'custom' : 'default',
      minCustom: Math.round(Number(p.minCustom)),
      hosts: int(p.hosts, 'hosts'),
      failed: int(p.failed, 'failed')
    };
    var r = minRange(q.scheme === 'rep' ? { kind: 'rep', n: q.n } : { kind: 'ec', k: q.k, m: q.m });
    if (!Number.isFinite(q.minCustom)) q.minCustom = r[1];
    q.minCustom = Math.min(r[1], Math.max(r[0], q.minCustom));
    return q;
  }

  // ── rules 1–3: one scheme on its own ──

  function width(sch) { return sch.kind === 'rep' ? sch.n : sch.k + sch.m; }           // poolWidth
  function need(sch) { return sch.kind === 'rep' ? 1 : sch.k; }                          // rule 2
  /** Rule 3 defaults: replication size − ⌊size/2⌋, EC k + min(1, m − 1) (k + 1, but k when m = 1). */
  function defaultMinSize(sch) { return sch.kind === 'rep' ? sch.n - Math.floor(sch.n / 2) : sch.k + Math.min(1, sch.m - 1); }
  /** Rule 1 as a fraction { num, den } (poolEfficiency). */
  function efficiency(sch) { return sch.kind === 'rep' ? { num: 1, den: sch.n } : { num: sch.k, den: sch.k + sch.m }; }
  /** Compare two fractions: > 0 when a is larger. */
  function cmpFrac(a, b) { return a.num * b.den - b.num * a.den; }
  function sameEfficiency(a, b) { return cmpFrac(efficiency(a), efficiency(b)) === 0; }
  /** Bytes of one piece: a full copy, or a shard of S/k. */
  function pieceBytes(sch) { return sch.kind === 'rep' ? OBJECT : OBJECT / sch.k; }
  /** Rule 1: raw bytes for `bytes` of data. */
  function rawFor(sch, bytes) { var e = efficiency(sch); return bytes * e.den / e.num; }
  /** Rule 4: bytes read to rebuild `bytes` lost on one disk: replication reads as much, EC k times as much. */
  function rebuildRead(sch, bytes) { return sch.kind === 'rep' ? bytes : sch.k * bytes; }
  /** Piece labels, in piece order: R1…Rn, or d1…dk then c1…cm. */
  function pieceRoles(sch) {
    var out = [], i;
    if (sch.kind === 'rep') for (i = 1; i <= sch.n; i++) out.push({ role: 'rep', label: 'R' + i });
    else {
      for (i = 1; i <= sch.k; i++) out.push({ role: 'data', label: 'd' + i });
      for (i = 1; i <= sch.m; i++) out.push({ role: 'coding', label: 'c' + i });
    }
    return out;
  }
  function name(sch) { return sch.kind === 'rep' ? sch.n + '×' : sch.k + '+' + sch.m; }

  function isDown(failed, h) { return (failed >> h & 1) === 1; }

  /** One scheme on `hosts` hosts with the `failed` mask: placement (rule 5), status (rules 2–3), rebuild plan (rule 4). */
  function evaluate(sch, hosts, failed) {
    var w = width(sch), nd = need(sch);
    var min = sch.min != null ? sch.min : defaultMinSize(sch);
    var pieces = pieceRoles(sch).map(function (r, i) {
      var host = i < hosts ? i : null;
      return { i: i, role: r.role, label: r.label, host: host, up: host !== null && !isDown(failed, host) };
    });
    var live = pieces.filter(function (x) { return x.up; }).length;
    var lost = pieces.filter(function (x) { return x.host !== null && !x.up; }).length;
    var holes = pieces.filter(function (x) { return x.host === null; }).length;
    var intact = live >= nd;
    var active = live >= min;
    var status = live === w ? 'ok' : !intact ? 'lost' : active ? 'degraded' : 'stopped';
    var e = efficiency(sch);

    var plan = null;
    var gone = pieces.filter(function (x) { return x.host !== null && !x.up; })[0];
    if (gone && intact) {
      var target = null;
      for (var h = 0; h < hosts; h++) if (h >= w && !isDown(failed, h)) { target = h; break; }
      var sources = pieces.filter(function (x) { return x.up; }).slice(0, nd).map(function (x) { return x.i; });
      plan = { piece: gone.i, target: target, sources: sources, read: rebuildRead(sch, pieceBytes(sch)), write: pieceBytes(sch) };
    }

    return {
      kind: sch.kind, n: sch.n || null, k: sch.k || null, m: sch.m || null, name: name(sch),
      width: w, need: nd, min: min, minDefault: defaultMinSize(sch), custom: sch.min != null,
      eff: e, effPct: 100 * e.num / e.den,
      piece: pieceBytes(sch), rawObj: rawFor(sch, OBJECT), rawPct: 100 * e.den / e.num,
      rawPool: rawFor(sch, POOL_DATA), rebuildDisk: rebuildRead(sch, DISK),
      tolerated: w - nd, ioTolerated: w - min, hostsNeeded: w, placeable: w <= hosts,
      pieces: pieces, live: live, lost: lost, holes: holes,
      intact: intact, active: active, status: status, plan: plan
    };
  }

  // ── rule 6: the comparison ──

  function schemes(p) {
    var rep = { kind: 'rep', n: p.n }, ec = { kind: 'ec', k: p.k, m: p.m };
    var cur = p.scheme === 'rep' ? rep : ec, alt = p.scheme === 'rep' ? ec : rep;
    if (p.minSize === 'custom') cur = Object.assign({}, cur, { min: p.minCustom });
    return { cur: cur, alt: alt };
  }

  /** Every scheme in range with exactly the efficiency of `sch`, other than itself. */
  function twins(sch) {
    var out = [], x;
    for (x = RANGE.n[0]; x <= RANGE.n[1]; x++) out.push({ kind: 'rep', n: x });
    for (var k = RANGE.k[0]; k <= RANGE.k[1]; k++) for (var m = RANGE.m[0]; m <= RANGE.m[1]; m++) out.push({ kind: 'ec', k: k, m: m });
    return out.filter(function (o) { return sameEfficiency(o, sch) && name(o) !== name(sch); });
  }

  /** Rule 6 order: efficiency descending, then failures tolerated descending, then the current first, then narrower. */
  function order(a, b) {
    return cmpFrac(b.eff, a.eff) || (b.tolerated - a.tolerated) || ((b.current ? 1 : 0) - (a.current ? 1 : 0)) || (a.width - b.width);
  }

  function compare(p, cur, alt) {
    var seen = {};
    var list = [];
    function add(e, role) { if (seen[e.name]) return; seen[e.name] = true; list.push(Object.assign({}, e, { current: role === 'cur', role: role })); }
    add(cur, 'cur');
    add(alt, 'alt');
    twins(schemes(p).cur).forEach(function (s) { add(evaluate(s, p.hosts, p.failed), 'twin'); });
    return list.sort(order);
  }

  /** The whole state, from the params. */
  function compute(params) {
    var p = norm(params);
    var s = schemes(p);
    var cur = evaluate(s.cur, p.hosts, p.failed);
    var alt = evaluate(s.alt, p.hosts, p.failed);
    var hosts = [];
    for (var h = 0; h < p.hosts; h++) hosts.push({ id: h, up: !isDown(p.failed, h) });
    return {
      p: p,
      hosts: hosts,
      failed: hosts.filter(function (x) { return !x.up; }).map(function (x) { return x.id; }),
      cur: cur,
      alt: alt,
      cols: compare(p, cur, alt)
    };
  }

  /** The `failed` mask with host h flipped (the page's click). */
  function toggleHost(failed, h) { return (failed ^ (1 << h)) & RANGE.failed[1]; }

  /** Rule 7: what a click changed. Hosts whose up flag differs, and per scheme whether the rebuild plan differs. */
  function changed(a, b) {
    if (!a || !b) return { hosts: [], plan: { cur: false, alt: false } };
    var hosts = b.hosts.filter(function (x) { return a.hosts[x.id] && a.hosts[x.id].up !== x.up; }).map(function (x) { return x.id; });
    function planKey(e) { return e.plan ? [e.plan.piece, e.plan.target, e.plan.sources.join(',')].join('/') : ''; }
    return { hosts: hosts, plan: { cur: planKey(a.cur) !== planKey(b.cur), alt: planKey(a.alt) !== planKey(b.alt) } };
  }

  function twinOf(s) {
    // a twin never tolerates as many failures as the current scheme (SPEC rule 6; tested over every scheme);
    // only one that fits on the hosts there are
    return s.cols.filter(function (x) { return x.role === 'twin' && x.placeable; })[0] || null;
  }

  /** The caption's main sentence and its notes, as keys the page turns into words. */
  function captionKey(s) {
    var c = s.cur, notes = [];
    var key;
    // pieces missing only because there are too few hosts: the holes sentence, then the status (no hosts are down)
    if (c.holes && !c.lost) {
      key = 'cHoles';
      notes.push(c.status === 'lost' ? 'sLost' : c.status === 'stopped' ? 'sStopped' : 'sDegraded');
    } else if (c.status === 'lost') key = 'cLost';
    else if (c.status === 'stopped') key = 'cStopped';
    else if (c.status === 'degraded') key = 'cDegraded';
    else key = c.kind === 'ec' ? 'cOkEc' : 'cOkRep';
    if (c.holes && key !== 'cHoles') notes.push('nHoles');
    if (c.status === 'degraded' && c.plan) notes.push('nRebuild');
    // I/O continues on exactly the pieces the data needs (min_size = need): a write lands with no spare piece
    if (c.status === 'degraded' && c.live === c.need) notes.push('nNoMargin');
    if (c.plan && c.plan.target === null) notes.push('nNoSpare');
    // with nothing down: the first twin (rule 6 order): the same efficiency, another failure count
    var twin = c.status === 'ok' ? twinOf(s) : null;
    if (twin) notes.push('nTwin');
    return { key: key, notes: notes, twin: twin };
  }

  var logic = {
    defaults: defaults,
    initial: compute,
    compute: compute,
    presets: presets,
    OBJECT: OBJECT, POOL_DATA: POOL_DATA, DISK: DISK, MAX_HOSTS: MAX_HOSTS, RANGE: RANGE,
    norm: norm,
    width: width,
    need: need,
    defaultMinSize: defaultMinSize,
    minRange: minRange,
    efficiency: efficiency,
    cmpFrac: cmpFrac,
    pieceBytes: pieceBytes,
    rawFor: rawFor,
    rebuildRead: rebuildRead,
    evaluate: evaluate,
    twins: twins,
    order: order,
    toggleHost: toggleHost,
    isDown: isDown,
    changed: changed,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
