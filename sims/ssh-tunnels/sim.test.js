// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ssh-tunnels: tie-breaks first, then rules 1–8 (SPEC.md), the presets' numbers, then the template's
// generic block. Run: node --test sims/ssh-tunnels/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const pre = (id, over) => P(Object.assign({}, L.PRESETS[id], over));
const at = (p, n) => kit.stateAt(L, p, n);
/** params with n T presses for that params' own tunnel */
const X = (p, n) => Object.assign({}, p, { extra: L.sendKey(p, n) });
const end = (p) => at(p, L.steps(p));
const kinds = (f) => f.segs.map((g) => g.kind);
const rowsOf = (s, k) => s.rows.filter((r) => r.k === k);

// ── tie-breaks ──

test('tie-break (rule 3): a target the far end cannot reach fails the channel, no data flows', () => {
  const p = P({ kind: 'R', target: 'db1:5432' });
  const s4 = at(p, 4);
  assert.equal(s4.flows[0].fail, 'unreachable');
  assert.equal(s4.flows[0].dst.host, 'db1');
  assert.equal(rowsOf(s4, 'openFail').length, 1);
  assert.equal(rowsOf(s4, 'confirm').length, 0);
  const t = rowsOf(s4, 'tconnect')[0];
  assert.equal(t.fail, true);
  assert.deepEqual([t.from, t.to], ['C', 'A']);
  const s5 = at(p, 5);
  assert.equal(s5.flows[0].phase, 'closed');
  assert.equal(rowsOf(s5, 'data').length + rowsOf(s5, 'chdata').length, 0);
  assert.equal(rowsOf(s5, 'close').length, 1);
  // every later connection through the same forwarding fails the same way
  const e = end(X(P({ kind: 'R', target: 'db1:5432' }), 2));
  assert.deepEqual(e.flows.map((f) => f.fail), ['unreachable', 'unreachable', 'unreachable']);
  // the same target is reached from the server (local forwarding)
  assert.equal(end(P({ kind: 'L', target: 'db1:5432' })).flows[0].fail, null);
});

test('tie-break (rule 5): remoteBindAny changes only remote listeners', () => {
  for (const kind of ['L', 'D']) {
    assert.deepEqual(at(P({ kind, remoteBindAny: true }), 1).tunnels[0].bind, at(P({ kind }), 1).tunnels[0].bind);
  }
  assert.equal(at(P({ kind: 'R', target: 'localhost:22', remoteBindAny: true }), 1).tunnels[0].bind.addr, '0.0.0.0');
  assert.equal(at(P({ kind: 'R', target: 'localhost:22' }), 1).tunnels[0].bind.addr, '127.0.0.1');
});

test('tie-break (rule 7): the mix-up flag only with a local forward to localhost', () => {
  assert.equal(at(pre('localhost-mixup'), 0).mixup, true);
  assert.equal(at(P({ kind: 'L', target: 'db1:5432', mixup: true }), 0).mixup, false);
  assert.equal(at(P({ kind: 'R', target: 'localhost:80', mixup: true }), 0).mixup, false);
  assert.equal(at(P({ kind: 'D', mixup: true }), 0).mixup, false);
  assert.equal(at(P({ kind: 'L', target: 'localhost:22', mixup: true }), 0).mixup, false, 'the mix-up is about the web server');
  // and it changes nothing about where the traffic goes: the same landing as local-to-loopback
  assert.deepEqual(end(pre('localhost-mixup')).flows, end(pre('local-to-loopback')).flows);
});

test('tie-break (T presses): they belong to one tunnel; another kind or target drops them', () => {
  const p = X(P({ kind: 'L', target: 'localhost:80' }), 2);
  assert.equal(L.steps(p), 7);
  assert.equal(L.steps(Object.assign({}, p, { kind: 'R' })), 5);
  assert.equal(L.steps(Object.assign({}, p, { target: 'db1:5432' })), 5);
  const d = X(P({ kind: 'D' }), 1);
  assert.equal(L.steps(Object.assign({}, d, { target: 'db1:5432' })), 7, 'dynamic ignores the target');
  assert.equal(L.steps(P({ extra: 2 })), 5, 'a bare number is no tunnel');
  assert.equal(L.sendMore(P({})), 'L localhost:80 1');
  assert.equal(L.sendMore(p), 'L localhost:80 2', 'never past MAX_EXTRA');
});

test('tie-break (rule 4): dynamic ignores the target choice and alternates the sites', () => {
  const a = end(X(P({ kind: 'D', target: 'db1:5432' }), 2));
  const b = end(X(P({ kind: 'D', target: 'localhost:22' }), 2));
  assert.deepEqual(a.flows, b.flows);
  assert.deepEqual(a.flows.map((f) => f.req.host), ['www.example.com', 'www.example.org', 'www.example.com', 'www.example.org']);
  assert.equal(a.target, null);
});

// ── rules ──

test('rule 1: every connection is a new channel in the one SSH connection', () => {
  const s = end(X(pre('dynamic'), 1));
  assert.deepEqual(s.flows.map((f) => f.ch), [1, 2, 3]);
  assert.equal(rowsOf(s, 'session').length, 1, 'one SSH connection');
  assert.deepEqual(rowsOf(s, 'open').map((r) => r.ch), [1, 2, 3]);
  for (const f of s.flows) assert.equal(f.segs.filter((g) => g.kind === 'ssh').length, 1);
});

test('rule 2: local forwarding: the client listens, nothing is sent at setup, the server connects', () => {
  const p = pre('local-to-internal');
  const s1 = at(p, 1);
  assert.deepEqual(s1.tunnels[0].bind, { host: 'democli1', addr: '127.0.0.1', port: 5432 });
  assert.deepEqual(s1.rows.map((r) => r.k), ['session', 'listen'], 'no request for a local forward');
  assert.equal(rowsOf(s1, 'listen')[0].lane, 'C');
  const s3 = at(p, 3);
  const open = rowsOf(s3, 'open')[0];
  assert.deepEqual([open.from, open.to, open.type, open.host, open.port], ['C', 'S', 'direct-tcpip', '192.168.180.20', 5432]);
  const t = rowsOf(at(p, 4), 'tconnect')[0];
  assert.deepEqual([t.from, t.to, t.host, t.port], ['S', 'B', '192.168.180.20', 5432]);
  assert.equal(at(p, 4).flows[0].dst.host, 'db1');
});

test('rule 3: remote forwarding: tcpip-forward, the server listens, forwarded-tcpip, the client connects', () => {
  const p = pre('remote');
  const s1 = at(p, 1);
  assert.deepEqual(s1.rows.map((r) => r.k), ['session', 'fwdReq', 'fwdOk', 'listen']);
  const req = rowsOf(s1, 'fwdReq')[0];
  assert.deepEqual([req.from, req.to, req.host, req.port], ['C', 'S', 'localhost', 2222]);
  assert.deepEqual(s1.tunnels[0].bind, { host: 'demosrv1', addr: '127.0.0.1', port: 2222 });
  const c = rowsOf(at(p, 2), 'connect')[0];
  assert.deepEqual([c.from, c.to], ['B', 'S'], 'a program on demosrv1 connects');
  const open = rowsOf(at(p, 3), 'open')[0];
  assert.deepEqual([open.from, open.to, open.type], ['S', 'C', 'forwarded-tcpip']);
  const s4 = at(p, 4);
  const t = rowsOf(s4, 'tconnect')[0];
  assert.deepEqual([t.from, t.to, t.host, t.port], ['C', 'A', '127.0.0.1', 22]);
  assert.deepEqual(s4.flows[0].dst, { host: 'democli1', addr: '127.0.0.1', port: 22, role: 'ssh', seg: 'loop' });
  // arrows: the connections are opened right to left
  for (const g of s4.flows[0].segs) assert.equal(g.dir, 'l');
  for (const g of at(pre('local-to-loopback'), 4).flows[0].segs) assert.equal(g.dir, 'r');
});

test('rule 4: dynamic forwarding: a SOCKS listener, the destination comes with each connection', () => {
  const p = pre('dynamic');
  const s1 = at(p, 1);
  assert.deepEqual(s1.tunnels[0].bind, { host: 'democli1', addr: '127.0.0.1', port: 1080 });
  assert.equal(s1.tunnels[0].target, null);
  assert.equal(rowsOf(s1, 'listen')[0].socks, true);
  const socks = rowsOf(at(p, 2), 'socks')[0];
  assert.deepEqual([socks.from, socks.to, socks.host, socks.port], ['A', 'C', 'www.example.com', 80]);
  const s6 = at(p, 6);
  assert.deepEqual(rowsOf(s6, 'open').map((r) => r.host), ['www.example.com', 'www.example.org']);
  for (const f of s6.flows) assert.equal(f.dst.seg, 'net', 'each site is reached from the server');
  assert.equal(rowsOf(at(pre('local-to-loopback'), 2), 'socks').length, 0);
});

test('rule 5: bind address and who can connect', () => {
  assert.equal(L.reach('127.0.0.1'), 'local');
  assert.equal(L.reach('0.0.0.0'), 'any');
  const ev = at(pre('remote', { remoteBindAny: true }), 1).ev;
  assert.equal(ev.reach, 'any');
  assert.equal(at(pre('remote'), 1).ev.reach, 'local');
  assert.equal(at(pre('local-to-loopback'), 1).ev.reach, 'local');
});

test('rule 6: only the client–server segment is encrypted; plain on the wire only towards another host', () => {
  const want = {
    'local-to-loopback': [['loop', 'ssh', 'loop'], false],
    'local-to-internal': [['loop', 'ssh', 'net'], true],
    'remote': [['loop', 'ssh', 'loop'], false],
    'dynamic': [['loop', 'ssh', 'net'], true],
    'localhost-mixup': [['loop', 'ssh', 'loop'], false]
  };
  for (const [id, [segs, plain]] of Object.entries(want)) {
    const s = end(pre(id));
    for (const f of s.flows) {
      assert.deepEqual(kinds(f), segs, id);
      assert.deepEqual(f.segs.map((g) => g.enc), [false, true, false], id);
      assert.deepEqual(f.segs.map((g) => g.wire), [false, true, plain], id);
    }
    assert.equal(s.ev.plainOnWire, plain, id);
  }
});

test('rule 7: localhost in a target is the far end\'s own loopback', () => {
  assert.deepEqual(L.resolve('demosrv1', { host: 'localhost', port: 80 }),
    { host: 'demosrv1', addr: '127.0.0.1', port: 80, role: 'web', seg: 'loop' });
  assert.deepEqual(L.resolve('democli1', { host: 'localhost', port: 80 }),
    { host: 'democli1', addr: '127.0.0.1', port: 80, role: 'web', seg: 'loop' });
  assert.equal(end(P({ kind: 'L', target: 'localhost:80' })).flows[0].dst.host, 'demosrv1');
  assert.equal(end(P({ kind: 'R', target: 'localhost:80' })).flows[0].dst.host, 'democli1');
  assert.equal(end(pre('localhost-mixup')).ev.mixup, true);
});

test('rule 8: the server\'s loopback-only web server is reached through -L localhost:80', () => {
  const web = L.SERVICES.demosrv1.find((x) => x.role === 'web');
  assert.equal(L.reach(web.addr), 'local', 'not reachable from the network');
  const f = end(pre('local-to-loopback')).flows[0];
  assert.deepEqual([f.dst.host, f.dst.addr, f.dst.port, f.dst.role], ['demosrv1', '127.0.0.1', 80, 'web']);
  assert.equal(f.fail, null);
  assert.equal(f.phase, 'data');
});

test('the messages, in order, with who sends them (RFC 4254 §7: the far end connects, then answers)', () => {
  const seq = (s) => s.rows.map((r) => [r.k, r.from || r.lane, r.to || ''].join(' '));
  assert.deepEqual(seq(end(pre('local-to-loopback'))), [
    'session C S', 'listen C ', 'connect A C', 'open C S', 'tconnect S B', 'confirm S C', 'data A C', 'chdata C S', 'data S B']);
  assert.deepEqual(seq(end(pre('remote'))), [
    'session C S', 'fwdReq C S', 'fwdOk S C', 'listen S ', 'connect B S', 'open S C', 'tconnect C A', 'confirm C S',
    'data B S', 'chdata S C', 'data C A']);
  assert.deepEqual(seq(end(P({ kind: 'R', target: 'db1:5432' }))), [
    'session C S', 'fwdReq C S', 'fwdOk S C', 'listen S ', 'connect B S', 'open S C', 'tconnect C A', 'openFail C S', 'close S B']);
  assert.deepEqual(seq(at(pre('dynamic'), 2)).slice(-2), ['connect A C', 'socks A C']);
  // direct-tcpip carries the target as written; only the far end resolves localhost (rule 7)
  const open = rowsOf(end(pre('local-to-loopback')), 'open')[0];
  assert.deepEqual([open.host, open.port], ['localhost', 80]);
  // the application connects over loopback even to a listener bound to all addresses
  assert.equal(rowsOf(end(pre('remote', { remoteBindAny: true })), 'connect')[0].addr, '127.0.0.1');
  // the step 1 listener and the pipe
  const s1 = at(pre('local-to-loopback'), 1);
  assert.equal(s1.session, true);
  assert.equal(at(pre('local-to-loopback'), 0).session, false);
  assert.equal(s1.tunnels[0].n, 1);
  // the failed connect is drawn on the client's side
  const f = end(P({ kind: 'R', target: 'db1:5432' })).flows[0];
  assert.deepEqual(f.segs.map((g) => g.at + ':' + g.kind), ['srv:loop', 'pipe:ssh', 'cli:fail']);
  assert.equal(end(P({ kind: 'R', target: 'db1:5432' })).ev.plainOnWire, false);
  assert.deepEqual(end(pre('local-to-internal')).flows[0].segs.map((g) => g.at), ['cli', 'pipe', 'net']);
  // the services the scene draws (rule 8 and the mix-up need these binds)
  assert.equal(L.SERVICES.democli1.find((x) => x.role === 'web').addr, '0.0.0.0');
});

test('steps: one phase each for the first connection, then one step per connection', () => {
  const p = pre('local-to-loopback');
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => at(p, n).ev.kind), ['setup', 'connect', 'open', 'target', 'data']);
  assert.deepEqual(rowsOf(at(p, 5), 'data').length + rowsOf(at(p, 5), 'chdata').length, 3);
  const d = X(pre('dynamic'), 1);
  assert.deepEqual([6, 7].map((n) => at(d, n).ev.kind), ['more', 'more']);
  assert.equal(at(d, 6).ev.extra, false, 'dynamic\'s second site is part of the preset');
  assert.equal(at(d, 7).ev.extra, true);
  // every row of a step carries that step's number (the page's changed mark)
  const s = at(d, 7);
  assert.ok(s.rows.filter((r) => r.n === 7).length >= 6);
  for (const g of s.flows[2].segs) assert.equal(g.n, 7);
});

test('presets: step counts and the T limit', () => {
  const want = { 'local-to-loopback': 5, 'local-to-internal': 5, 'remote': 5, 'dynamic': 6, 'localhost-mixup': 5 };
  for (const [id, n] of Object.entries(want)) assert.equal(L.steps(pre(id)), n, id);
  assert.equal(L.steps(X(P({}), 2)), 7);
  assert.equal(L.steps(X(P({ kind: 'D' }), 2)), 8);
  assert.equal(L.steps(X(P({}), 99)), 7, 'extra is clamped');
  assert.equal(L.steps(X(P({}), -2)), 5);
  assert.equal(L.canSend(X(P({}), 1)), true);
  assert.equal(L.canSend(X(P({}), 2)), false);
  assert.ok(L.steps(X(P({ kind: 'D' }), 2)) <= 20);
  // listener ports per target (SPEC.md table)
  assert.equal(at(pre('local-to-loopback'), 1).tunnels[0].bind.port, 8080);
  assert.equal(at(P({ kind: 'L', target: 'localhost:22' }), 1).tunnels[0].bind.port, 2222);
});

test('past the last step nothing changes', () => {
  const p = pre('local-to-loopback');
  const s = L.step(at(p, 5), 6, p);
  assert.deepEqual(s.flows, at(p, 5).flows);
  assert.equal(s.ev.kind, 'idle');
});

test('unknown params fall back to the defaults', () => {
  const s = end(P({ kind: 'X', target: 'nowhere' }));
  assert.deepEqual(s.flows, end(pre('local-to-loopback')).flows);
});

// ── generic checks every sim keeps ──

const RUNS = [pre('local-to-loopback'), pre('local-to-internal'), pre('remote', { remoteBindAny: true }), X(pre('dynamic'), 2),
  pre('localhost-mixup'), X(P({ kind: 'R', target: 'db1:5432' }), 1)];

test('state is JSON-safe at every step', () => {
  for (const p of RUNS) {
    for (let n = 0; n <= L.steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of RUNS) {
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of RUNS) {
    for (let n = 1; n <= L.steps(p); n++) {
      const s0 = at(p, n - 1);
      const copy = structuredClone(s0);
      L.step(s0, n, p);
      assert.deepEqual(s0, copy);
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model and matches the model\'s table', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the model at the defaults');
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)'.*params: L\.PRESETS\['([a-z-]+)'\]/g)];
  assert.deepEqual(ids.map((m) => m[1]), Object.keys(L.PRESETS));
  for (const m of ids) assert.equal(m[1], m[2], 'each preset uses its own params');
  for (const pp of Object.values(L.PRESETS)) for (const k of Object.keys(pp)) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
});
