/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-logrotate: a log file rotated once a week while the system logger keeps writing into it.
   A name in /var/log is a directory entry that points at an inode; the logger writes through an open file descriptor
   that points at an inode, not at a name. A cycle is two steps: write (the logger appends lines to the inode its
   descriptor points at), then rotate (logrotate's weekly run). Rules, their order and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The log and its writer. The PID is the book's rsyslogd (from sims/lnx-log-path/sim.js @ 275f465, RSYSLOGD);
      the page calls it "the system logger" (the brief: generic label). */
  var LOG = 'messages';
  var DIR = '/var/log';
  var WRITER = { pid: 9360 };
  /** Inode numbers handed out in order, from this one. */
  var FIRST_INODE = 2101;
  /** Day 0 is Sunday 2026-08-30; the weekly runs fall on days 7, 14, ... (dateext names use their dates). */
  var BASE = { y: 2026, m: 8, d: 30 };
  var WEEK = 7;

  var METHODS = ['create-reload', 'create', 'copytruncate'];

  /** The page's presets, in key order (1–6). Numbers each one must show: SPEC.md. */
  var PRESETS = [
    { id: 'book-config', params: {} },
    { id: 'numbers-compress', params: { dateext: false, rotate: 3, compress: true, cycles: 5 } },
    { id: 'forgot-reload', params: { method: 'create', dateext: false, cycles: 3 } },
    { id: 'copytruncate-loss', params: { method: 'copytruncate', writeDuringRotation: true, dateext: false, cycles: 3 } },
    { id: 'delaycompress', params: { compress: true, delaycompress: true, rotate: 3, dateext: false, cycles: 4 } },
    { id: 'still-open', params: { method: 'create', dateext: false, rotate: 1, cycles: 3 } }
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    function int(v, lo, hi, def) { v = Math.round(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def; }
    var compress = p.compress === undefined ? d.compress : !!p.compress;
    var method = METHODS.indexOf(p.method) >= 0 ? p.method : d.method;
    return {
      method: method,
      rotate: int(p.rotate, 1, 6, d.rotate),
      dateext: p.dateext === undefined ? d.dateext : !!p.dateext,
      compress: compress,
      // delaycompress only means something with compress (rule 7)
      delaycompress: compress && (p.delaycompress === undefined ? d.delaycompress : !!p.delaycompress),
      linesPerCycle: int(p.linesPerCycle, 1, 4, d.linesPerCycle),
      // one line between the copy and the truncate: only copytruncate has such a moment (rule 6)
      writeDuringRotation: method === 'copytruncate' && !!p.writeDuringRotation,
      cycles: int(p.cycles, 2, 8, d.cycles)
    };
  }

  // ── calendar (no Date: day numbers to a civil date, proleptic Gregorian) ──

  function daysFromCivil(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400), yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function civilFromDays(z) {
    z += 719468;
    var era = Math.floor(z / 146097), doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp + (mp < 10 ? 3 : -9);
    return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m: m, d: d };
  }
  /** The civil date of a demo day. */
  function dateOf(day) { return civilFromDays(daysFromCivil(BASE.y, BASE.m, BASE.d) + day); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /** YYYYMMDD, the dateext suffix. */
  function ymd(day) { var c = dateOf(day); return c.y + pad(c.m) + pad(c.d); }

  // ── names ──

  /** A rotated version's name: messages.<i> or messages-<YYYYMMDD>, plus .gz when compressed. */
  function parseName(name) {
    var gz = /\.gz$/.test(name);
    var base = gz ? name.slice(0, -3) : name;
    var m = /^messages\.(\d+)$/.exec(base);
    if (m) return { kind: 'num', i: Number(m[1]), gz: gz };
    m = /^messages-(\d{8})$/.exec(base);
    if (m) return { kind: 'date', date: m[1], gz: gz };
    return { kind: base === LOG ? 'live' : 'other', gz: gz };
  }

  /** Display and state order: the live log, then old versions newest first (.1 before .2; later dates first). */
  function order(a, b) {
    var x = parseName(a.name), y = parseName(b.name);
    var rank = { live: 0, num: 1, date: 1, other: 2 };
    if (rank[x.kind] !== rank[y.kind]) return rank[x.kind] - rank[y.kind];
    if (x.kind === 'num' && y.kind === 'num' && x.i !== y.i) return x.i - y.i;
    if (x.kind === 'date' && y.kind === 'date' && x.date !== y.date) return x.date < y.date ? 1 : -1;
    if (x.kind !== y.kind) return x.kind === 'num' ? -1 : 1; // a numbered and a dated version together: numbered first
    return a.name < b.name ? -1 : a.name > b.name ? 1 : a.inode - b.inode;
  }

  function find(s, name) {
    for (var i = 0; i < s.files.length; i++) if (s.files[i].name === name) return s.files[i];
    return null;
  }
  function byInode(s, inode) {
    for (var i = 0; i < s.files.length; i++) if (s.files[i].inode === inode) return s.files[i];
    return null;
  }

  /** Old versions (every name but the live log), newest first. */
  function versions(s) {
    return s.files.filter(function (f) { return f.name !== LOG; }).slice().sort(order);
  }

  // ── rule 1: is the run due? ──

  /** Day of the week, 0 = Sunday (day 0 is a Sunday). */
  function weekday(day) { return ((day % WEEK) + WEEK) % WEEK; }
  /** weekly (= weekly 0 in logrotate 3.21): due on a Sunday when the date moved on since the last rotation the status
      file records, or when at least 7 days passed since it. */
  function isDue(day, lastRotation) { return (weekday(day) === 0 && day > lastRotation) || day - lastRotation >= WEEK; }

  // ── operations (each pushes an op record and marks what it changed) ──

  function touch(s, inode) { if (s.changed.indexOf(inode) < 0) s.changed.push(inode); }

  /** A name disappears. Its inode is gone too, unless the writer still holds it open (rule 8): then it stays as a
      deleted-but-open inode that keeps its lines and its space. */
  function unlinkName(s, f, why) {
    s.files = s.files.filter(function (x) { return x !== f; });
    var open = s.writer.inode === f.inode;
    s.removed.push({ name: f.name, inode: f.inode, lines: f.lines.slice(), gz: f.gz, why: why, open: open });
    if (open) s.deleted.push({ inode: f.inode, lines: f.lines, gz: f.gz, was: f.name });
  }

  /** compress: gzip writes name.gz (a new inode) from name, then removes name. */
  function compress(s, f) {
    var gzName = f.name + '.gz';
    var copy = { name: gzName, inode: s.nextInode++, lines: f.lines.slice(), gz: true };
    unlinkName(s, f, 'compressed');
    s.files.push(copy);
    touch(s, copy.inode);
    s.ops.push({ op: 'compress', from: f.name, to: gzName, inode: copy.inode, old: f.inode, open: s.writer.inode === f.inode });
  }

  function rename(s, f, to) {
    s.ops.push({ op: 'rename', from: f.name, to: to, inode: f.inode });
    f.name = to;
    touch(s, f.inode);
  }

  // ── the run ──

  function rotate(s, p) {
    var due = isDue(s.day, s.lastRotation);
    s.due = due;
    if (!due) { s.ops.push({ op: 'notDue', last: s.lastRotation }); return; }
    var live = find(s, LOG);
    var target = p.dateext ? LOG + '-' + ymd(s.day) : LOG + '.1';

    // (a) delaycompress: the newest old version, left plain by the last run, is compressed first
    if (p.compress && p.delaycompress) {
      var newest = versions(s).filter(function (f) { return !f.gz; })[0];
      if (newest) compress(s, newest);
    }

    // (b) numbering: shift from the highest number down, so no rename lands on an existing name (rule 3)
    if (!p.dateext) {
      versions(s).filter(function (f) { return parseName(f.name).kind === 'num'; })
        .sort(function (a, b) { return parseName(b.name).i - parseName(a.name).i; })
        .forEach(function (f) {
          var x = parseName(f.name);
          rename(s, f, LOG + '.' + (x.i + 1) + (x.gz ? '.gz' : ''));
        });
    }

    // (c) create (rename + a new empty file) or copytruncate (copy + truncate in place)
    var rotated;
    if (p.method === 'copytruncate') {
      rotated = { name: target, inode: s.nextInode++, lines: live.lines.slice(), gz: false };
      s.files.push(rotated);
      touch(s, rotated.inode);
      s.ops.push({ op: 'copy', from: LOG, to: target, inode: rotated.inode, n: live.lines.length });
      if (p.writeDuringRotation) {
        var id = 'd' + s.day + '-1';
        appendTo(s, [id]);
        s.ops.push({ op: 'between', line: id });
      }
      var gone = live.lines.filter(function (l) { return rotated.lines.indexOf(l) < 0; });
      live.lines = [];
      touch(s, live.inode);
      s.ops.push({ op: 'truncate', name: LOG, inode: live.inode, lost: gone.slice() });
      s.lost += gone.length;
      s.lostLines = s.lostLines.concat(gone);
    } else {
      rename(s, live, target);
      rotated = live;
      var fresh = { name: LOG, inode: s.nextInode++, lines: [], gz: false };
      s.files.push(fresh);
      touch(s, fresh.inode);
      s.ops.push({ op: 'create', name: LOG, inode: fresh.inode });
    }

    // (d) postrotate: the reload makes the logger close its file and open messages again
    if (p.method === 'create-reload') {
      var now = find(s, LOG).inode;
      s.ops.push({ op: 'reload', from: s.writer.inode, to: now });
      if (s.writer.inode !== now) { s.writer.inode = now; s.arrowMoved = true; }
      // a deleted inode the logger held is released now: its space comes back (rule 8)
      if (s.deleted.length) { s.ops.push({ op: 'freed', inodes: s.deleted.map(function (d) { return d.inode; }) }); s.deleted = []; }
    }

    // (e) compress the version just made, unless delaycompress keeps it plain for one more cycle (rule 7)
    if (p.compress && !p.delaycompress) compress(s, rotated);

    // (f) remove what is beyond rotate N (rule 2): .N+1 after the shift, or the oldest dates (rule 4)
    var old = versions(s);
    old.slice(p.rotate).forEach(function (f) {
      s.ops.push({ op: 'remove', name: f.name, inode: f.inode, open: s.writer.inode === f.inode });
      unlinkName(s, f, 'removed');
    });

    s.lastRotation = s.day;
    s.rotations += 1;
  }

  /** The logger appends lines to whatever inode its descriptor points at: a name in /var/log, or a deleted one. */
  function appendTo(s, ids) {
    var f = byInode(s, s.writer.inode);
    var target = f ? f.lines : null;
    if (!f) s.deleted.forEach(function (d) { if (d.inode === s.writer.inode) target = d.lines; });
    ids.forEach(function (id) { target.push(id); });
    s.written = s.written.concat(ids);
    s.writtenTo = f ? f.name : null;
    touch(s, s.writer.inode);
  }

  function fresh(s) {
    s.ops = [];
    s.changed = [];
    s.removed = [];
    s.written = [];
    s.writtenTo = null;
    s.arrowMoved = false;
    s.due = null;
  }

  var logic = {
    defaults: {
      method: 'create-reload', rotate: 4, dateext: true, compress: false, delaycompress: false,
      linesPerCycle: 2, writeDuringRotation: false, cycles: 6
    },

    /** Two steps per cycle: write, rotate. */
    steps: function (p) { return 2 * norm(p).cycles; },

    initial: function (p) {
      var s = {
        day: 0, cycle: 0, phase: 'start',
        files: [{ name: LOG, inode: FIRST_INODE, lines: [], gz: false }],
        deleted: [],
        writer: { pid: WRITER.pid, inode: FIRST_INODE },
        nextInode: FIRST_INODE + 1,
        lastRotation: 0,
        rotations: 0,
        lost: 0,
        lostLines: []
      };
      fresh(s);
      return s;
    },

    step: function (prev, n, params) {
      var p = norm(params);
      var s = clone(prev);
      fresh(s);
      s.cycle = Math.ceil(n / 2);
      if (n % 2 === 1) {
        // write: the day before the weekly run
        s.phase = 'write';
        s.day = WEEK * s.cycle - 1;
        var ids = [];
        for (var k = 1; k <= p.linesPerCycle; k++) ids.push('d' + s.day + '-' + k);
        appendTo(s, ids);
      } else {
        s.phase = 'rotate';
        s.day = WEEK * s.cycle;
        rotate(s, p);
      }
      s.files.sort(order);
      return s;
    },

    // helpers for the page and the tests
    norm: norm,
    isDue: isDue,
    weekday: weekday,
    ymd: ymd,
    dateOf: dateOf,
    parseName: parseName,
    find: find,
    byInode: byInode,
    versions: versions,
    /** The file (or deleted inode) a line id is in now, or null when it is lost. */
    whereIs: function (s, id) {
      for (var i = 0; i < s.files.length; i++) if (s.files[i].lines.indexOf(id) >= 0) return { name: s.files[i].name, inode: s.files[i].inode };
      for (var j = 0; j < s.deleted.length; j++) if (s.deleted[j].lines.indexOf(id) >= 0) return { name: null, inode: s.deleted[j].inode };
      return null;
    },
    LOG: LOG,
    DIR: DIR,
    WRITER: WRITER,
    WEEK: WEEK,
    METHODS: METHODS,
    PRESETS: PRESETS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
