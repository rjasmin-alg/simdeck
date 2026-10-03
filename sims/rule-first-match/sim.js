/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for rule-first-match: a rule list is read top down and the first row that matches the request decides; rows
   below it are never read, and a request that matches no row meets the implicit rule at the end (deny / reject).
   Scenes: a pg_hba.conf file (the row's method is then checked, with no fall-through), a router ACL, a stateless
   filter and its reply, a "permit any" on top. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The evaluator (matchRule,
   covers, shadowed, applyFix, run) takes plain data and holds no strings, so it can move to models/ unchanged for
   K4 rule-table pages. */
(function (root) {
  'use strict';

  // ── addresses ──

  function ipToInt(ip) {
    return ip.split('.').reduce(function (acc, o) { return acc * 256 + Number(o); }, 0);
  }
  function isV6(a) { return String(a).indexOf(':') >= 0; }
  /** 'a.b.c.d/len' or 'a.b.c.d' (= /32) → { v6, net, len }; IPv6 is kept as text (only exact /128 rows are used). */
  function prefix(p) {
    var parts = String(p).split('/');
    if (isV6(parts[0])) return { v6: true, addr: parts[0], len: parts.length > 1 ? Number(parts[1]) : 128 };
    var len = parts.length > 1 ? Number(parts[1]) : 32;
    var mask = len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0;
    return { v6: false, net: (ipToInt(parts[0]) & mask) >>> 0, mask: mask, len: len };
  }
  /** Rule 2: an address matches a row's address if it lies inside the row's prefix. Families never mix; an IPv6
      row matches only its own address (the scenes use ::1/128 only). */
  function inPrefix(addr, p) {
    var q = prefix(p);
    if (isV6(addr) || q.v6) return isV6(addr) && q.v6 && q.len === 128 && addr === q.addr;
    return ((ipToInt(addr) & q.mask) >>> 0) === q.net;
  }
  /** Prefix a contains prefix b (every address of b is in a). */
  function prefixCovers(a, b) {
    var pa = prefix(a), pb = prefix(b);
    if (pa.v6 || pb.v6) return pa.v6 && pb.v6 && pa.len === 128 && pb.len === 128 && pa.addr === pb.addr;
    return pa.len <= pb.len && ((pb.net & pa.mask) >>> 0) === pa.net;
  }

  // ── fields ──

  /** The match columns of each kind of list, in table order. */
  var FIELDS = {
    pg: ['type', 'db', 'user', 'addr'],
    acl: ['proto', 'src', 'srcPort', 'dst', 'dstPort']
  };

  /** Does one row field accept one request field? (rule 2: every field must; all / any match everything) */
  function fieldMatch(kind, key, want, got) {
    if (kind === 'pg') {
      if (key === 'type') return want === got;
      if (key === 'db') return want === 'all' ? got !== 'replication' : want === got; // `all` never matches replication
      if (key === 'user') return want === 'all' || want === got;
      if (key === 'addr') return want === null ? true : got !== null && inPrefix(got, want);
    } else {
      if (key === 'proto') return want === 'ip' || want === got;
      if (key === 'src' || key === 'dst') return want === 'any' || inPrefix(got, want);
      if (key === 'srcPort' || key === 'dstPort') return want === 'any' || want === got;
    }
    throw new Error('unknown field ' + kind + '.' + key);
  }

  /** Does row field a accept everything row field b accepts? (rule 7, shadowing) */
  function fieldCovers(kind, key, a, b) {
    if (kind === 'pg') {
      if (key === 'type') return a === b;
      if (key === 'db') return a === b || (a === 'all' && b !== 'replication');
      if (key === 'user') return a === b || a === 'all';
      if (key === 'addr') return a === null || b === null ? a === b : prefixCovers(a, b);
    } else {
      if (key === 'proto') return a === 'ip' || a === b;
      if (key === 'src' || key === 'dst') return a === 'any' || (b !== 'any' && prefixCovers(a, b));
      if (key === 'srcPort' || key === 'dstPort') return a === 'any' || a === b;
    }
    throw new Error('unknown field ' + kind + '.' + key);
  }

  /** Field by field: { fields: { key: bool }, match } (rule 2). Every field is compared, so the page can mark each. */
  function matchRule(kind, rule, req) {
    var fields = {}, all = true;
    FIELDS[kind].forEach(function (k) {
      var ok = fieldMatch(kind, k, rule.match[k], req.fields[k]);
      fields[k] = ok;
      if (!ok) all = false;
    });
    return { fields: fields, match: all };
  }

  /** Row a covers row b: every request b matches, a matches too. */
  function covers(kind, a, b) {
    return FIELDS[kind].every(function (k) { return fieldCovers(kind, k, a.match[k], b.match[k]); });
  }

  /** Rule 7: for each row, the index of the first earlier row that covers it (the row is dead), or -1. */
  function shadowed(kind, rules) {
    return rules.map(function (r, i) {
      for (var j = 0; j < i; j++) if (covers(kind, rules[j], r)) return j;
      return -1;
    });
  }

  /** pg_hba methods (rule 4). peer and ident compare the client's OS user name with the database user name;
      scram-sha-256 asks for the password; reject always refuses; trust always accepts. */
  function checkMethod(method, req) {
    var f = req.fields;
    if (method === 'peer' || method === 'ident') return { ok: f.osUser === f.user, why: 'name' };
    if (method === 'scram-sha-256') return { ok: !!f.password, why: 'password' };
    if (method === 'trust') return { ok: true, why: 'trust' };
    return { ok: false, why: 'reject' };
  }

  // ── scenes ──

  function pgRow(type, db, user, addr, method) {
    return { match: { type: type, db: db, user: user, addr: addr }, action: method };
  }
  function aclRow(seq, action, proto, src, srcPort, dst, dstPort) {
    return { label: String(seq), match: { proto: proto, src: src, srcPort: srcPort, dst: dst, dstPort: dstPort }, action: action };
  }

  /** The six lines of pg_hba.conf from UL ch22 "Postavljanje jedne baze". */
  var PG6 = [
    pgRow('local', 'all', 'all', null, 'peer'),
    pgRow('host', 'all', 'all', '127.0.0.1/32', 'ident'),
    pgRow('host', 'all', 'all', '::1/128', 'ident'),
    pgRow('local', 'replication', 'all', null, 'peer'),
    pgRow('host', 'replication', 'all', '127.0.0.1/32', 'ident'),
    pgRow('host', 'replication', 'all', '::1/128', 'ident')
  ];
  function pgReq(type, db, user, addr, osUser) {
    return { fields: { type: type, db: db, user: user, addr: addr, osUser: osUser, password: true } };
  }
  function aclReq(proto, src, srcPort, dst, dstPort, dir) {
    return { fields: { proto: proto, src: src, srcPort: srcPort, dst: dst, dstPort: dstPort }, dir: dir || null };
  }
  /** The book's request: TCP to 127.0.0.1 as studentdb, from the OS user student (UL ch22, Primjer 3). */
  var Q_TCP = pgReq('host', 'vjezba', 'studentdb', '127.0.0.1', 'student');
  /** The administrator over the socket: OS user postgres as database user postgres. */
  var Q_LOCAL = pgReq('local', 'postgres', 'postgres', null, 'postgres');

  var SCENES = {
    'pg-hba': {
      kind: 'pg', implicit: 'reject',
      rules: PG6,
      fix: { op: 'edit', at: 1, action: 'scram-sha-256' },
      requests: [Q_TCP, Q_LOCAL, pgReq('host', 'vjezba', 'studentdb', '192.168.1.20', 'student')]
    },
    'pg-hba-append': {
      kind: 'pg', implicit: 'reject',
      rules: PG6.concat([pgRow('host', 'all', 'all', '127.0.0.1/32', 'scram-sha-256')]),
      fix: { op: 'edit', at: 1, action: 'scram-sha-256' },
      requests: [Q_TCP, Q_LOCAL, pgReq('host', 'vjezba', 'studentdb', '::1', 'student')]
    },
    'router-acl': {
      kind: 'acl', implicit: 'deny',
      rules: [
        aclRow(10, 'deny', 'tcp', 'any', 'any', '192.168.10.5/32', 22),
        aclRow(20, 'permit', 'tcp', 'any', 'any', '192.168.10.5/32', 443),
        aclRow(30, 'permit', 'tcp', '203.0.113.0/24', 'any', '192.168.10.5/32', 22)
      ],
      fix: { op: 'move', from: 2, to: 0, label: '5' },
      requests: [
        aclReq('tcp', '198.51.100.7', 51000, '192.168.10.5', 443),
        aclReq('tcp', '203.0.113.9', 51001, '192.168.10.5', 22),
        aclReq('tcp', '198.51.100.7', 51002, '192.168.10.5', 80)
      ]
    },
    'stateless-reply': {
      kind: 'acl', implicit: 'deny',
      rules: [aclRow(10, 'permit', 'tcp', '192.168.1.0/24', 'any', 'any', 443)],
      fix: { op: 'add', at: 1, rule: aclRow(20, 'permit', 'tcp', 'any', 443, '192.168.1.0/24', 'any') },
      requests: [
        aclReq('tcp', '192.168.1.50', 51000, '203.0.113.10', 443, 'out'),
        aclReq('tcp', '203.0.113.10', 443, '192.168.1.50', 51000, 'reply'),
        aclReq('tcp', '203.0.113.66', 443, '192.168.1.50', 22, 'unsolicited')
      ]
    },
    'permit-any-top': {
      kind: 'acl', implicit: 'deny',
      rules: [
        aclRow(10, 'permit', 'ip', 'any', 'any', 'any', 'any'),
        aclRow(20, 'deny', 'tcp', 'any', 'any', 'any', 23),
        aclRow(30, 'deny', 'udp', 'any', 'any', 'any', 'any'),
        aclRow(40, 'deny', 'ip', '10.0.0.0/8', 'any', 'any', 'any')
      ],
      fix: { op: 'move', from: 0, to: 3, label: '50' },
      requests: [
        aclReq('tcp', '198.51.100.7', 51000, '192.168.10.5', 23),
        aclReq('tcp', '10.1.2.3', 51001, '192.168.10.5', 443),
        aclReq('tcp', '198.51.100.7', 51002, '192.168.10.5', 443)
      ]
    }
  };
  var SCENE_IDS = Object.keys(SCENES);

  /** Copy the scene's rows with ids and labels (file line or sequence number), then apply the fix if asked:
      edit one row's action, move a row (it takes a new sequence number), or add a row. The changed row has fixed: true;
      a moved row keeps its old number in `was`. */
  function applyFix(scene, fix) {
    var rules = scene.rules.map(function (r, i) {
      return { id: 'r' + i, label: r.label || String(i + 1), match: Object.assign({}, r.match), action: r.action, fixed: false, was: null };
    });
    if (!fix) return rules;
    var f = scene.fix;
    if (f.op === 'edit') {
      rules[f.at].action = f.action;
      rules[f.at].fixed = true;
    } else if (f.op === 'move') {
      var moved = rules.splice(f.from, 1)[0];
      moved.was = moved.label;
      moved.label = f.label;
      moved.fixed = true;
      rules.splice(f.to, 0, moved);
    } else if (f.op === 'add') {
      rules.splice(f.at, 0, { id: 'r' + scene.rules.length, label: f.rule.label, match: Object.assign({}, f.rule.match), action: f.rule.action, fixed: true, was: null });
    }
    if (scene.kind === 'pg') rules.forEach(function (r, i) { r.label = String(i + 1); }); // a file's lines renumber
    return rules;
  }

  function sceneOf(p) { return SCENES[p.scene] || SCENES['pg-hba']; }
  /** The requests of this run: all, or the one chosen (1-based); a number past the scene's list means all. */
  function requestsOf(p) {
    var all = sceneOf(p).requests.map(function (q, i) { return { id: 'q' + (i + 1), n: i + 1, fields: Object.assign({}, q.fields), dir: q.dir || null }; });
    var k = Number(p.request);
    return p.request === 'all' || !(k >= 1 && k <= all.length) ? all : [all[k - 1]];
  }

  // ── one row at a time ──

  function blankMarks(rules) { return rules.map(function () { return null; }); }

  /** One row-mode step from state s (SPEC.md "One step"). Returns a new state. */
  function rowStep(s) {
    var out = JSON.parse(JSON.stringify(s));
    out.test = null;
    out.method = null;
    var kind = s.kind;
    if (s.phase === 'start' || s.phase === 'decided') {      // next request, from the top
      out.cur = s.cur + 1;
      out.marks = blankMarks(s.rules);
      out.row = -1;
      out.outcome = null;
    }
    var req = out.requests[out.cur];
    if (out.phase === 'match') {                             // pg_hba: the chosen row's method decides (rule 4)
      var rule = out.rules[out.row];
      var m = checkMethod(rule.action, req);
      out.method = { method: rule.action, ok: m.ok, why: m.why };
      return decide(out, out.row, m.ok ? 'accept' : 'reject', m.ok ? 'method-ok' : 'method-fail');
    }
    var r = out.row + 1;
    if (r >= out.rules.length) {                             // rule 5: past the last row, the implicit rule
      out.row = out.rules.length;
      return decide(out, -1, s.implicit, 'implicit');
    }
    out.row = r;
    var t = matchRule(kind, out.rules[r], req);
    out.test = { row: r, fields: t.fields, match: t.match };
    out.marks[r] = t.match ? 'match' : 'no';
    if (!t.match) { out.phase = 'nomatch'; return out; }
    if (kind === 'pg') { out.phase = 'match'; return out; }  // the method is checked in the next step
    return decide(out, r, out.rules[r].action, 'action');   // rule 3: the first match decides
  }

  function decide(out, row, outcome, reason) {
    out.phase = 'decided';
    out.outcome = { req: out.requests[out.cur].id, row: row, label: row >= 0 ? out.rules[row].label : null, outcome: outcome, reason: reason, method: out.method ? out.method.method : null };
    out.results.push(out.outcome);
    out.done = out.cur >= out.requests.length - 1;
    return out;
  }

  /** The first row below `from` that also matches the request, and what it would have decided had it been first
      (ACL: its action; pg_hba: its method's result), or null. For the page's "never reached" caption (rule 3, 4). */
  function laterMatch(kind, rules, req, from) {
    for (var i = from + 1; i < rules.length; i++) {
      if (!matchRule(kind, rules[i], req).match) continue;
      var outcome = kind === 'pg' ? (checkMethod(rules[i].action, req).ok ? 'accept' : 'reject') : rules[i].action;
      return { row: i, label: rules[i].label, outcome: outcome };
    }
    return null;
  }

  var logic = {
    SCENES: SCENES,
    SCENE_IDS: SCENE_IDS,
    FIELDS: FIELDS,

    /** Parameter defaults. The page's controls describe how each one is shown. */
    defaults: { scene: 'pg-hba', request: 'all', fix: false, mode: 'row' },

    /** Steps for these params: replay to done. */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (!s.done && n < 200) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: the table and the queue, nothing tested. */
    initial: function (p) {
      var sc = sceneOf(p), rules = applyFix(sc, !!p.fix);
      return {
        scene: SCENES[p.scene] ? p.scene : 'pg-hba', kind: sc.kind, implicit: sc.implicit, mode: p.mode === 'request' ? 'request' : 'row',
        rules: rules, shadow: shadowed(sc.kind, rules), requests: requestsOf(p),
        cur: -1, row: -1, marks: blankMarks(rules), test: null, method: null, phase: 'start', outcome: null, results: [], done: false
      };
    },

    /** State after step n, from the state after step n - 1. Mode `request` runs rows until the request is decided. */
    step: function (s, n, p) {
      if (s.done) throw new Error('no step after done');
      var out = rowStep(s);
      if (s.mode === 'request') while (out.phase !== 'decided') out = rowStep(out);
      return out;
    },

    ipToInt: ipToInt,
    inPrefix: inPrefix,
    prefixCovers: prefixCovers,
    fieldMatch: fieldMatch,
    matchRule: matchRule,
    covers: covers,
    shadowed: shadowed,
    checkMethod: checkMethod,
    laterMatch: laterMatch,
    applyFix: applyFix,
    sceneOf: sceneOf,
    requestsOf: requestsOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
