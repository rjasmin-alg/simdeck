/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-terraform-drift: three resources seen three ways — the configuration (desired), the state (what the
   tool recorded at its last apply: address → real ID and attributes) and the real infrastructure (what the provider's
   API returns now). Each step is one action: apply, a hand change in the real column, an edit of the configuration,
   one phase of plan (refresh, then diff), one phase of a refresh-only plan or apply, state rm, or import.
   Rules: SPEC.md (numbers in the comments below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  /** Attribute order per type (rule 8d) and the ones that force replacement (rule 8b). */
  var TYPES = {
    dns_record: { keys: ['name', 'address'], forces: ['name'], prefix: 'dns-', ids: ['5e02', '91ab', '0c7d', 'b6e8'] },
    firewall_rule: { keys: ['name', 'port'], forces: ['name', 'port'], prefix: 'fw-', ids: ['21c9', '6b0d', 'a3f2', '4d17'] },
    vm: { keys: ['name', 'size', 'image'], forces: ['name', 'image'], prefix: 'vm-', ids: ['7f3a', '2c91', 'e504', '93bd'] }
  };

  var CONFIG = {
    'dns_record.www': { name: 'www', address: '203.0.113.10' },
    'firewall_rule.ssh': { name: 'ssh', port: 22 },
    'vm.web': { name: 'web', size: 'small', image: 'debian-12' }
  };

  var RDP = { op: 'hand', kind: 'create', type: 'firewall_rule', id: 'fw-88d4', attrs: { name: 'rdp', port: 3389 } };
  var PLAN = [{ op: 'plan', phase: 'refresh' }, { op: 'plan', phase: 'diff' }];
  var APPLY = { op: 'apply' };

  /** The scenarios: one action per step (plan and the refresh-only commands take two). */
  var SCRIPTS = {
    'drift-revert': [APPLY, { op: 'hand', kind: 'edit', type: 'vm', name: 'web', key: 'size', value: 'large' }].concat(PLAN, [APPLY]),
    'hand-delete': [APPLY, { op: 'hand', kind: 'delete', type: 'dns_record', name: 'www' }].concat(PLAN),
    'hand-create': [APPLY, RDP].concat(PLAN),
    'state-lost': [APPLY, { op: 'staterm', addr: 'vm.web' }].concat(PLAN, [APPLY]),
    'accept-drift': [APPLY, { op: 'hand', kind: 'edit', type: 'vm', name: 'web', key: 'size', value: 'large' },
      { op: 'applyRefreshOnly', phase: 'refresh' }, { op: 'applyRefreshOnly', phase: 'write' }].concat(PLAN),
    'edit-config': [APPLY, { op: 'edit', set: { 'vm.web': { size: 'medium' }, 'firewall_rule.ssh': { port: 2222 } },
      remove: ['dns_record.www'] }].concat(PLAN, [APPLY]),
    'import': [APPLY, RDP, { op: 'edit', add: { 'firewall_rule.rdp': { name: 'rdp', port: 3389 } } }].concat(PLAN,
      [{ op: 'import', addr: 'firewall_rule.rdp', id: 'fw-88d4' }], PLAN)
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function typeOf(addr) { return addr.split('.')[0]; }
  function sorted(obj) { return Object.keys(obj).sort(); }                     // rule 8a: string order of type.name
  function mark(s, key) { if (s.changed.indexOf(key) < 0) s.changed.push(key); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function norm(p) {
    p = p || {};
    return { script: SCRIPTS[p.script] ? p.script : 'drift-revert', showState: p.showState !== false };
  }

  /** Attribute keys of a type, in drawing order (rule 8d). */
  function keysOf(type) { return TYPES[type].keys; }
  function forces(type, key) { return TYPES[type].forces.indexOf(key) >= 0; }

  /** The differing attributes of two attribute sets (a: from, b: to), in the type's order. */
  function diffAttrs(type, a, b) {
    return keysOf(type).filter(function (k) { return !same(a ? a[k] : null, b ? b[k] : null); })
      .map(function (k) { return { key: k, from: a && k in a ? a[k] : null, to: b && k in b ? b[k] : null, forces: forces(type, k) }; });
  }

  // ── rule 1: refresh ──

  /** Reads every object in state by its ID. Returns { refreshed, outside } and leaves s alone. */
  function refresh(s) {
    var refreshed = {}, outside = [];
    sorted(s.state).forEach(function (addr) {
      var e = s.state[addr], r = s.real[e.id];
      if (!r) {
        refreshed[addr] = null;                                               // rule 4: dropped
        outside.push({ addr: addr, id: e.id, kind: 'deleted', diffs: [] });
        return;
      }
      refreshed[addr] = { id: e.id, attrs: clone(r.attrs) };
      var d = diffAttrs(typeOf(addr), e.attrs, r.attrs);
      if (d.length) outside.push({ addr: addr, id: e.id, kind: 'changed', diffs: d });
    });
    return { refreshed: refreshed, outside: outside };
  }

  // ── rule 2: diff ──

  /** Configuration against the refreshed state (entries with null are gone). Address order (rule 8a). */
  function diff(config, refreshed) {
    var addrs = {};
    Object.keys(config).forEach(function (a) { addrs[a] = true; });
    Object.keys(refreshed).forEach(function (a) { if (refreshed[a]) addrs[a] = true; });
    var plan = [];
    sorted(addrs).forEach(function (addr) {
      var type = typeOf(addr), want = config[addr], have = refreshed[addr] || null;
      if (want && !have) plan.push({ addr: addr, action: 'create', diffs: diffAttrs(type, null, want).map(function (d) { d.forces = false; return d; }) });
      else if (!want && have) plan.push({ addr: addr, action: 'delete', id: have.id, diffs: [] });
      else {
        var d = diffAttrs(type, have.attrs, want);
        if (!d.length) return;
        var replace = d.some(function (x) { return x.forces; });             // rule 8b
        plan.push({ addr: addr, action: replace ? 'replace' : 'update', id: have.id, diffs: d });
      }
    });
    return plan;
  }

  function counts(plan) {
    var c = { add: 0, change: 0, destroy: 0 };
    plan.forEach(function (x) {
      if (x.action === 'create' || x.action === 'replace') c.add++;
      if (x.action === 'update') c.change++;
      if (x.action === 'delete' || x.action === 'replace') c.destroy++;
    });
    return c;
  }

  // ── real infrastructure ──

  function findReal(s, type, name) {
    var ids = Object.keys(s.real).sort();
    for (var i = 0; i < ids.length; i++) {
      var r = s.real[ids[i]];
      if (r.type === type && r.attrs.name === name) return ids[i];
    }
    return null;
  }

  function newId(s, type) {
    var T = TYPES[type], n = s.seq[type] || 0;
    s.seq[type] = n + 1;
    return T.prefix + (T.ids[n] || String(n));
  }

  // ── rule 9: apply ──

  function create(s, addr, attrs) {
    var type = typeOf(addr), clash = findReal(s, type, attrs.name);
    if (clash) return { ok: false, clash: clash };                            // rule 6
    var id = newId(s, type);
    s.real[id] = { type: type, attrs: clone(attrs) };
    s.state[addr] = { id: id, attrs: clone(attrs) };
    mark(s, 'real:' + id); mark(s, 'state:' + addr);
    return { ok: true, id: id };
  }

  function destroy(s, addr, id) {
    delete s.real[id];
    delete s.state[addr];
    mark(s, 'gone:' + id); mark(s, 'state:' + addr);
  }

  function carryOut(s, plan) {
    var c = { add: 0, change: 0, destroy: 0 }, error = null;
    plan.forEach(function (x) {                                                // an error stops only its own resource
      var want = s.config[x.addr];
      if (x.action === 'delete') { destroy(s, x.addr, x.id); c.destroy++; s.out.push({ kind: 'done', addr: x.addr, action: 'delete', id: x.id }); return; }
      if (x.action === 'update') {
        x.diffs.forEach(function (d) {
          s.real[x.id].attrs[d.key] = clone(want[d.key]);
          mark(s, 'real:' + x.id + ':' + d.key); mark(s, 'state:' + x.addr + ':' + d.key);
        });
        s.state[x.addr].attrs = clone(s.real[x.id].attrs);
        c.change++;
        s.out.push({ kind: 'done', addr: x.addr, action: 'update', id: x.id });
        return;
      }
      if (x.action === 'replace') { destroy(s, x.addr, x.id); c.destroy++; }
      var r = create(s, x.addr, want);
      if (!r.ok) {
        error = error || { addr: x.addr, type: typeOf(x.addr), name: want.name, clash: r.clash };
        s.out.push({ kind: 'error', addr: x.addr, type: typeOf(x.addr), name: want.name, clash: r.clash });
        return;
      }
      c.add++;
      s.out.push({ kind: 'done', addr: x.addr, action: x.action, id: r.id, old: x.action === 'replace' ? x.id : null });
    });
    if (!error) s.out.push({ kind: 'applied', add: c.add, change: c.change, destroy: c.destroy });
    return { counts: c, error: error };
  }

  /** Persist a refreshed state (apply, apply -refresh-only): changed entries are marked. */
  function writeRefreshed(s, refreshed) {
    sorted(refreshed).forEach(function (addr) {
      var e = refreshed[addr];
      if (!e) { delete s.state[addr]; mark(s, 'state:' + addr); return; }
      diffAttrs(typeOf(addr), s.state[addr].attrs, e.attrs).forEach(function (d) { mark(s, 'state:' + addr + ':' + d.key); });
      s.state[addr] = clone(e);
    });
  }

  function refreshLines(s, r) {
    sorted(s.state).forEach(function (addr) { s.out.push({ kind: 'refreshing', addr: addr, id: s.state[addr].id }); });
    if (r.outside.length) {
      s.out.push({ kind: 'outsideHead' });
      r.outside.forEach(function (o) { s.out.push({ kind: 'outside', addr: o.addr, change: o.kind, diffs: o.diffs }); });
    }
  }

  function planLines(s, plan) {
    if (!plan.length) { s.out.push({ kind: 'nochanges' }); return; }
    plan.forEach(function (x) { s.out.push({ kind: 'action', addr: x.addr, action: x.action, diffs: x.diffs }); });
    var c = counts(plan);
    s.out.push({ kind: 'summary', add: c.add, change: c.change, destroy: c.destroy });
  }

  // ── one action ──

  function act(s, a) {
    var r, plan;
    if (a.op === 'apply') {
      s.out.push({ kind: 'cmd', text: 'apply' });
      r = refresh(s);
      plan = diff(s.config, r.refreshed);
      writeRefreshed(s, r.refreshed);
      s.outside = r.outside;
      s.plan = plan;
      var res = carryOut(s, plan);
      s.ev.push({ kind: 'apply', counts: res.counts, error: res.error, outside: r.outside.length, actions: plan.map(function (x) { return x.action; }) });
      return;
    }
    if (a.op === 'plan' || a.op === 'planRefreshOnly' || a.op === 'applyRefreshOnly') {
      var cmd = a.op === 'plan' ? 'plan' : a.op === 'planRefreshOnly' ? 'plan -refresh-only' : 'apply -refresh-only';
      if (a.phase === 'refresh') {
        s.out.push({ kind: 'cmd', text: cmd, phase: 1 });
        r = refresh(s);
        s.refreshed = r.refreshed;
        s.outside = r.outside;
        s.plan = null;
        s.phase = { op: a.op, at: 'refresh' };
        Object.keys(r.refreshed).forEach(function (addr) {
          var e = r.refreshed[addr];
          if (!e || diffAttrs(typeOf(addr), s.state[addr].attrs, e.attrs).length) mark(s, 'fresh:' + addr);
        });
        refreshLines(s, r);
        s.ev.push({ kind: 'refresh', op: a.op, read: Object.keys(s.state).length, outside: r.outside });
        return;
      }
      // second phase: needs the first (the scripts always run them in a pair)
      var fresh = s.refreshed || refresh(s).refreshed;
      s.out.push({ kind: 'cmd', text: cmd, phase: 2 });
      s.phase = { op: a.op, at: a.phase };
      if (a.op === 'plan') {                                                  // rule 2
        plan = diff(s.config, fresh);
        s.plan = plan;
        plan.forEach(function (x) { mark(s, 'plan:' + x.addr); });
        planLines(s, plan);
        s.ev.push({ kind: 'diff', plan: plan, counts: counts(plan), outside: s.outside });
        return;
      }
      s.plan = [];                                                            // rule 7: no actions
      if (a.op === 'planRefreshOnly') {
        s.out.push({ kind: 'refreshOnly', outside: s.outside.length });
        s.ev.push({ kind: 'refreshOnlyPlan', outside: s.outside });
        return;
      }
      writeRefreshed(s, fresh);
      s.refreshed = null;
      s.out.push({ kind: 'applied', add: 0, change: 0, destroy: 0 });
      s.ev.push({ kind: 'refreshOnlyWrite', outside: s.outside });
      return;
    }
    if (a.op === 'hand') {
      if (a.kind === 'edit') {
        var id = findReal(s, a.type, a.name), was = s.real[id].attrs[a.key];
        s.real[id].attrs[a.key] = a.value;
        mark(s, 'real:' + id + ':' + a.key);
        s.out.push({ kind: 'hand', what: 'edit', id: id, key: a.key, from: was, to: a.value });
        s.ev.push({ kind: 'hand', what: 'edit', id: id, key: a.key, from: was, to: a.value });
        return;
      }
      if (a.kind === 'delete') {
        var did = findReal(s, a.type, a.name);
        delete s.real[did];
        mark(s, 'gone:' + did);
        s.out.push({ kind: 'hand', what: 'delete', id: did, name: a.name });
        s.ev.push({ kind: 'hand', what: 'delete', id: did, name: a.name });
        return;
      }
      s.real[a.id] = { type: a.type, attrs: clone(a.attrs) };               // create
      mark(s, 'real:' + a.id);
      s.out.push({ kind: 'hand', what: 'create', id: a.id, type: a.type, name: a.attrs.name });
      s.ev.push({ kind: 'hand', what: 'create', id: a.id, type: a.type, name: a.attrs.name });
      return;
    }
    if (a.op === 'edit') {
      var touched = [];
      Object.keys(a.set || {}).sort().forEach(function (addr) {
        Object.keys(a.set[addr]).forEach(function (k) {
          touched.push({ addr: addr, key: k, from: s.config[addr][k], to: a.set[addr][k] });
          s.config[addr][k] = a.set[addr][k];
          mark(s, 'config:' + addr + ':' + k);
        });
      });
      Object.keys(a.add || {}).sort().forEach(function (addr) {
        s.config[addr] = clone(a.add[addr]);
        mark(s, 'config:' + addr);
        touched.push({ addr: addr, add: true });
      });
      (a.remove || []).forEach(function (addr) {
        delete s.config[addr];
        mark(s, 'unconfig:' + addr);
        touched.push({ addr: addr, remove: true });
      });
      s.out.push({ kind: 'edit', changes: touched });
      s.ev.push({ kind: 'edit', changes: touched });
      return;
    }
    if (a.op === 'staterm') {                                                 // rule 6
      s.out.push({ kind: 'cmd', text: 'state rm ' + a.addr });
      var e = s.state[a.addr];
      if (!e) { s.out.push({ kind: 'notInState', addr: a.addr }); s.ev.push({ kind: 'staterm', addr: a.addr, ok: false }); return; }
      delete s.state[a.addr];
      mark(s, 'state:' + a.addr);
      s.out.push({ kind: 'removed', addr: a.addr, id: e.id });
      s.ev.push({ kind: 'staterm', addr: a.addr, id: e.id, ok: true });
      return;
    }
    if (a.op === 'import') {                                                  // rule 5
      s.out.push({ kind: 'cmd', text: 'import ' + a.addr + ' ' + a.id });
      // like the tool, import does not check whether another address already maps to this ID (SPEC.md rule 5)
      var why = !s.config[a.addr] ? 'noConfig' : s.state[a.addr] ? 'managed' : !s.real[a.id] ? 'noObject' : null;
      if (why) { s.out.push({ kind: 'importError', addr: a.addr, id: a.id, why: why }); s.ev.push({ kind: 'import', ok: false, why: why }); return; }
      s.state[a.addr] = { id: a.id, attrs: clone(s.real[a.id].attrs) };
      mark(s, 'state:' + a.addr);
      s.out.push({ kind: 'imported', addr: a.addr, id: a.id });
      s.ev.push({ kind: 'import', ok: true, addr: a.addr, id: a.id });
    }
  }

  function blankStep(s) { s.out = []; s.changed = []; s.ev = []; }

  function initial(p) {
    var o = norm(p);
    var s = { script: o.script, config: clone(CONFIG), state: {}, real: {}, refreshed: null, outside: [], plan: null,
      phase: null, seq: {}, i: 0 };
    blankStep(s);
    return s;
  }

  /** One action on a copy of s0. A two-phase command keeps plan's view between its phases; any other action drops
      it. */
  function perform(s0, a) {
    var s = clone(s0);
    blankStep(s);
    var second = s.phase && s.phase.at === 'refresh' && a.op === s.phase.op && a.phase !== 'refresh';
    if (!second) { s.refreshed = null; s.outside = []; s.plan = null; s.phase = null; }
    act(s, a);
    return s;
  }

  function step(s0, n, p) {
    var a = SCRIPTS[norm(p).script][n - 1];
    var s = a ? perform(s0, a) : clone(s0);
    if (!a) blankStep(s);
    s.i = n;
    return s;
  }

  /** What one action of a scenario is, for the page's step list. */
  function actionAt(script, n) { return SCRIPTS[norm({ script: script }).script][n - 1] || null; }

  /** Rows to draw, in order: managed and declared addresses (rule 8a), then hand-made objects by ID (rule 8c). */
  function rows(s) {
    var addrs = {};
    Object.keys(s.config).forEach(function (a) { addrs[a] = true; });
    Object.keys(s.state).forEach(function (a) { addrs[a] = true; });
    if (s.refreshed) Object.keys(s.refreshed).forEach(function (a) { addrs[a] = true; });
    s.changed.forEach(function (k) {                                          // an address this step removed: one last row
      var m = /^(state|unconfig):([^:]+)$/.exec(k);
      if (m) addrs[m[2]] = true;
    });
    var out = [], seen = {};
    sorted(addrs).forEach(function (addr) {
      var e = s.state[addr];
      var id = e ? e.id : null;
      if (id) seen[id] = true;
      out.push({ addr: addr, type: typeOf(addr), id: id && s.real[id] ? id : null, stateId: id });
    });
    Object.keys(s.real).sort().forEach(function (id) {
      if (seen[id]) return;
      out.push({ addr: null, type: s.real[id].type, id: id, stateId: null });
    });
    return out;
  }

  var logic = {
    TYPES: TYPES, CONFIG: CONFIG, SCRIPTS: SCRIPTS, SCRIPT_IDS: SCRIPT_IDS,

    /** Parameter defaults (SPEC.md "Params"). */
    defaults: { script: 'drift-revert', showState: true },

    steps: function (p) { return SCRIPTS[norm(p).script].length; },
    initial: initial,
    step: step,

    norm: norm,
    refresh: refresh,
    diff: diff,
    counts: counts,
    rows: rows,
    keysOf: keysOf,
    forces: forces,
    typeOf: typeOf,
    actionAt: actionAt,
    /** Run one arbitrary action on a state (tests, and the rules the presets do not reach). */
    run: perform
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
