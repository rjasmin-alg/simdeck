// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for http-exchange's model (rules: SPEC.md). Run: node --test sims/http-exchange/
// Tie-breaks first, then rules 1–8, the presets' numbers and golden runs, the send queue, then the template's
// generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const SCRIPTS = Object.keys(logic.SCRIPTS);
const PRESETS = {
  redirect: { script: 'redirect' },
  'host-missing': { script: 'host-missing' },
  'wrong-vhost': { script: 'wrong-vhost', hostL: 'www2.lab.example' },
  'head-vs-get': { script: 'head-vs-get', pathG: '/proizvodi', method: 'HEAD' },
  'not-found-vs-forbidden': { script: 'not-found-vs-forbidden', pathL: '/skriveno' }
};

/** Every state of a run, 0 … steps. */
function run(over) {
  const p = P(over);
  const out = [logic.initial(p)];
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) out.push(logic.step(out[i - 1], i, p));
  return out;
}
const last = (over) => run(over).slice(-1)[0];
const req = (m, path, host) => logic.buildRequest(m, path, host);
const serve = (scene, r) => logic.serve(scene, r);
/** Every request the user could compose in a scene. */
function every(scene) {
  const out = [];
  for (const m of logic.METHODS) for (const path of logic.pathsOf(scene)) for (const host of logic.SCENES[scene].hosts) out.push([m, path, host]);
  return out;
}
/** A run's messages, one line each: the start line and the header fields, then the body. */
const fmt = (m) => logic.startLine(m) + (m.headers.length ? ' | ' + m.headers.map((f) => f.join(': ')).join(' | ') : '') + (m.body ? ' | ' + m.body : '');

// ── tie-breaks ──

test('tie-break: a Host that names no virtual host goes to the first one listed; two of the same name: the first', () => {
  const vh = logic.SCENES.lab.vhosts;
  assert.equal(logic.pickVhost(vh, 'www3.lab.example').vhost.name, 'www1.lab.example');
  assert.equal(logic.pickVhost(vh, 'www3.lab.example').byDefault, true);
  assert.equal(logic.pickVhost(vh.slice().reverse(), 'nowhere').vhost.name, 'www2.lab.example');
  const twins = [{ name: 'a', root: '/1', resources: {} }, { name: 'b', root: '/2', resources: {} }, { name: 'B', root: '/3', resources: {} }];
  assert.equal(logic.pickVhost(twins, 'b').vhost.root, '/2');
  assert.equal(logic.pickVhost(twins, 'b').byDefault, false);
});

test('tie-break: the Host check comes first; then the resource; the method last', () => {
  // no Host on a path that would be 404: 400, and no virtual host or resource looked at
  const a = serve('lab', req('GET', '/nema', ''));
  assert.equal(a.res.code, 400);
  assert.equal(a.decision.vhost, null);
  // a missing, hidden or unreadable resource answers before the method is checked
  assert.equal(serve('lab', req('POST', '/nema', 'www1.lab.example')).res.code, 404);
  assert.equal(serve('lab', req('POST', '/skriveno', 'www1.lab.example')).res.code, 404);
  assert.equal(serve('lab', req('POST', '/privatno', 'www1.lab.example')).res.code, 403);
  // a redirect answers whatever the method
  for (const m of logic.METHODS) assert.equal(serve('grafo', req(m, '/proizvodi', 'www.grafo.hr')).res.code, 301);
  // a file found but the method not allowed: 405, before the program behind it runs
  assert.equal(serve('grafo', req('POST', '/cjenik', 'www.grafo.hr')).res.code, 405);
  assert.equal(serve('grafo', req('POST', '/katalog', 'www.grafo.hr')).res.code, 405);
});

test('tie-break: after a 301 the client keeps the method, except POST, which becomes GET without the body', () => {
  for (const m of logic.METHODS) {
    const r = req(m, '/proizvodi', 'www.grafo.hr');
    const f = logic.followUp(r, serve('grafo', r).res);
    assert.equal(f.method, m === 'POST' ? 'GET' : m);
    assert.equal(f.body, '');
    assert.equal(f.target, '/katalog');
    assert.equal(f.via, 'redirect');
  }
});

// ── rules ──

test('rule 1: request-line = method SP target SP version; status-line = version SP code SP reason', () => {
  assert.equal(logic.startLine(req('GET', '/proizvodi', 'www.grafo.hr')), 'GET /proizvodi HTTP/1.1');
  assert.equal(logic.startLine(req('HEAD', '/', '')), 'HEAD / HTTP/1.1');
  assert.equal(logic.startLine(serve('grafo', req('GET', '/proizvodi', 'www.grafo.hr')).res), 'HTTP/1.1 301 Moved Permanently');
  assert.equal(logic.startLine(serve('lab', req('GET', '/', '')).res), 'HTTP/1.1 400 Bad Request');
  for (const scene of ['grafo', 'lab']) for (const r of every(scene)) {
    const a = serve(scene, req(...r));
    assert.match(logic.startLine(req(...r)), /^(GET|HEAD|POST) \/\S* HTTP\/1\.1$/);
    assert.match(logic.startLine(a.res), /^HTTP\/1\.1 [1-5]\d\d [A-Za-z ]+$/);
    assert.equal(a.res.reason, logic.REASON[a.res.code]);
  }
});

test('rule 2: start line, CRLF, header lines, an empty line, then the body; header names are case-insensitive', () => {
  const r = serve('grafo', req('GET', '/katalog', 'www.grafo.hr')).res;
  const w = logic.wire(r);
  const [head, body] = w.split('\r\n\r\n');
  assert.equal(body, '<h1>Katalog proizvoda</h1>');
  assert.deepEqual(head.split('\r\n'), ['HTTP/1.1 200 OK', 'Content-Type: text/html; charset=utf-8', 'Content-Length: 26']);
  assert.equal(logic.wire(req('GET', '/', '')), 'GET / HTTP/1.1\r\n\r\n');   // zero header lines: still the empty line
  assert.deepEqual(logic.fieldValues([['host', 'a'], ['HOST', 'b'], ['Accept', 'c']], 'Host'), ['a', 'b']);
  // a lower-case host field counts as Host: one of them, so no 400, and it picks the virtual host
  const lower = Object.assign(req('GET', '/', ''), { headers: [['host', 'www2.lab.example']] });
  assert.equal(serve('lab', lower).res.code, 200);
  assert.equal(serve('lab', lower).decision.vhost, 'www2.lab.example');
});

test('rule 2: Content-Length is the body in bytes (UTF-8), in requests and responses', () => {
  for (const scene of ['grafo', 'lab']) for (const r of every(scene)) {
    const q = req(...r);
    if (q.body) assert.equal(Number(logic.fieldValues(q.headers, 'Content-Length')[0]), Buffer.byteLength(q.body));
    const g = serve(scene, req('GET', r[1], r[2])).res;
    assert.equal(Number(logic.fieldValues(g.headers, 'Content-Length')[0]), Buffer.byteLength(g.body));
  }
  assert.equal(logic.utf8Length('<h1>Prvi poslužitelj</h1>'), 26);
  assert.equal(logic.utf8Length('€😀'), 7);
});

test('rule 3: an HTTP/1.1 request without Host, or with two, gets 400; with one it does not', () => {
  assert.equal(serve('lab', req('GET', '/', '')).res.code, 400);
  const two = req('GET', '/', 'www1.lab.example');
  two.headers.push(['Host', 'www2.lab.example']);
  assert.equal(serve('lab', two).res.code, 400);
  assert.equal(serve('lab', two).decision.hosts, 2);
  assert.equal(serve('lab', req('GET', '/', '192.168.180.1')).res.code, 200);
  // the rule is HTTP/1.1's: an older request without Host is not refused for it
  const old = Object.assign(req('GET', '/', ''), { version: 'HTTP/1.0' });
  assert.equal(serve('lab', old).res.code, 200);
  for (const scene of ['grafo', 'lab']) for (const r of every(scene)) assert.equal(serve(scene, req(...r)).res.code === 400, r[2] === '', r.join(' '));
});

test('rule 4: the virtual host is picked by Host; an unknown name gets the default one, 200 with the wrong content', () => {
  const one = serve('lab', req('GET', '/', 'www1.lab.example')), two = serve('lab', req('GET', '/', 'www2.lab.example'));
  const three = serve('lab', req('GET', '/', 'www3.lab.example')), ip = serve('lab', req('GET', '/', '192.168.180.1'));
  assert.equal(two.res.body, '<h1>Drugi poslužitelj</h1>');
  assert.equal(two.decision.byDefault, false);
  assert.equal(three.res.code, 200);
  assert.equal(three.decision.byDefault, true);
  assert.deepEqual(three.res, one.res);          // www3 gets exactly www1's page
  assert.deepEqual(ip.res, one.res);
  assert.equal(serve('lab', req('GET', '/', 'WWW2.Lab.Example')).decision.vhost, 'www2.lab.example');
  // the same path on another virtual host is another resource
  assert.equal(serve('lab', req('GET', '/privatno', 'www2.lab.example')).res.code, 404);
});

test('rule 5: the first digit is the class; an unknown code is read as x00; the reason phrase is never read', () => {
  assert.deepEqual([101, 200, 301, 404, 503].map(logic.statusClass), [1, 2, 3, 4, 5]);
  assert.equal(logic.readAs(451), 400);
  assert.equal(logic.readAs(299), 200);
  assert.equal(logic.readAs(599), 500);
  for (const c of logic.KNOWN) assert.equal(logic.readAs(c), c);
  // the client acts on the number: a 301 with any reason is followed, a 200 that says "Moved Permanently" is not
  const r = req('GET', '/proizvodi', 'www.grafo.hr');
  const moved = serve('grafo', r).res;
  assert.ok(logic.followUp(r, Object.assign({}, moved, { reason: 'Whatever' })));
  assert.ok(logic.followUp(r, Object.assign({}, moved, { reason: '' })));
  assert.equal(logic.followUp(r, Object.assign({}, moved, { code: 200 })), null);
  // an unknown 3xx with Location is read as 300, which is not followed here
  assert.equal(logic.followUp(r, Object.assign({}, moved, { code: 399 })), null);
  // every response's class is the first digit of its code
  for (const scene of ['grafo', 'lab']) for (const x of every(scene)) {
    const c = serve(scene, req(...x)).res.code;
    assert.equal(logic.statusClass(c), Number(String(c)[0]));
  }
});

test('rule 6: 301 carries the new URI in Location and the client sends a new request there', () => {
  const states = run({ script: 'redirect' });
  const resp = states[2].messages[1];
  assert.equal(resp.code, 301);
  assert.deepEqual(logic.fieldValues(resp.headers, 'Location'), ['/katalog']);
  assert.deepEqual(resp.marks, ['Location']);
  assert.equal(states[2].pending.target, '/katalog');
  assert.equal(states[2].pending.via, 'redirect');
  assert.equal(states[2].ev.follow, true);
  const f = states[3].messages[2];
  assert.equal(logic.startLine(f), 'GET /katalog HTTP/1.1');
  assert.deepEqual(f.headers, [['Host', 'www.grafo.hr']]);   // the same host
  assert.equal(states[4].messages[3].code, 200);
  assert.equal(states[4].ev.hops, 2);
  // no Location, no follow-up
  const noLoc = Object.assign({}, resp, { headers: [] });
  assert.equal(logic.followUp(req('GET', '/proizvodi', 'www.grafo.hr'), noLoc), null);
});

test('rule 7: HEAD gets the same status and header fields as GET, and no body', () => {
  for (const scene of ['grafo', 'lab']) for (const path of logic.pathsOf(scene)) for (const host of logic.SCENES[scene].hosts) {
    const g = serve(scene, req('GET', path, host)).res, hd = serve(scene, req('HEAD', path, host)).res;
    assert.equal(hd.code, g.code);
    assert.deepEqual(hd.headers, g.headers);
    assert.equal(hd.body, '');
  }
  const s = last({ script: 'head-vs-get' });
  assert.deepEqual(s.messages[3].headers, s.messages[1].headers);
  assert.equal(s.messages[1].body, '<h1>Katalog proizvoda</h1>');
  assert.equal(s.messages[3].body, '');
});

test('rule 8: a hidden resource gets the same 404 as a missing one; a file that may not be read gets 403', () => {
  const none = serve('lab', req('GET', '/nema', 'www1.lab.example')), hidden = serve('lab', req('GET', '/skriveno', 'www1.lab.example'));
  assert.deepEqual(hidden.res, none.res);
  assert.equal(none.res.code, 404);
  assert.equal(hidden.decision.why, 'hidden');
  assert.equal(none.decision.why, 'none');
  assert.equal(serve('lab', req('GET', '/privatno', 'www1.lab.example')).res.code, 403);
  // a path in no table at all is a 404 too
  assert.equal(serve('grafo', req('GET', '/nigdje', 'www.grafo.hr')).res.code, 404);
});

test('POST: the form program processes the body (200); other resources do not take POST (405 with Allow)', () => {
  const a = serve('grafo', req('POST', '/obrazac', 'www.grafo.hr'));
  assert.equal(a.res.code, 200);
  assert.equal(a.decision.why, 'processed');
  assert.equal(a.res.body, '<h1>Upit primljen</h1>');
  const r = req('POST', '/obrazac', 'www.grafo.hr');
  assert.equal(r.body, logic.FORM_BODY);
  assert.deepEqual(r.headers.map((f) => f[0]), ['Host', 'Content-Type', 'Content-Length']);
  const n = serve('grafo', req('POST', '/', 'www.grafo.hr')).res;
  assert.equal(n.code, 405);
  assert.deepEqual(logic.fieldValues(n.headers, 'Allow'), ['GET, HEAD']);
  assert.equal(serve('grafo', req('GET', '/cjenik', 'www.grafo.hr')).res.code, 500);
});

test('the page reads: decision, shown, marks, the server tables, the start event (pinned)', () => {
  const s = run({ script: 'wrong-vhost' })[2];
  assert.deepEqual(s.decision, { hosts: 1, host: 'www3.lab.example', vhost: 'www1.lab.example', byDefault: true, path: '/', why: 'file' });
  assert.deepEqual(s.shown, { code: 200, method: 'GET', body: '<h1>Prvi poslužitelj</h1>' });
  assert.deepEqual(run({ script: 'head-vs-get' })[4].shown, { code: 200, method: 'HEAD', body: '' });
  assert.deepEqual(run({ script: 'host-missing' })[2].decision, { hosts: 0, host: null, vhost: null, byDefault: false, path: '/', why: 'host' });
  assert.deepEqual(run({ script: 'not-found-vs-forbidden' })[4].decision.path, '/privatno');
  assert.equal(run({ script: 'redirect' })[0].ev.kind, 'start');
  assert.equal(run({ script: 'redirect' })[0].shown, null);
  // marks: Location on a 301, Allow on a 405, nothing else
  assert.deepEqual(serve('grafo', req('POST', '/', 'www.grafo.hr')).res.marks, ['Allow']);
  assert.deepEqual(serve('grafo', req('GET', '/', 'www.grafo.hr')).res.marks, []);
  // a 405 is an error page like the others
  assert.deepEqual(serve('grafo', req('POST', '/', 'www.grafo.hr')).res.headers.map((f) => f[0]), ['Allow', 'Content-Type', 'Content-Length']);
  // the server tables the page draws
  const srv = run({ script: 'host-missing' })[0].server;
  assert.equal(srv.name, '192.168.180.1');
  assert.deepEqual(srv.vhosts, [{ name: 'www1.lab.example', root: '/var/www/www1', default: true }, { name: 'www2.lab.example', root: '/var/www/www2', default: false }]);
  assert.deepEqual(Object.values(srv.resources).map((r) => [r.vhost, r.path, r.kind, r.status]), [
    ['www1.lab.example', '/', 'file', 200], ['www1.lab.example', '/nema', 'none', 404], ['www1.lab.example', '/privatno', 'unreadable', 403],
    ['www1.lab.example', '/skriveno', 'hidden', 404], ['www2.lab.example', '/', 'file', 200]]);
  const g = run({ script: 'redirect' })[0].server.resources;
  assert.deepEqual(g['www.grafo.hr/proizvodi'], { vhost: 'www.grafo.hr', path: '/proizvodi', kind: 'redirect', status: 301, location: '/katalog', body: null });
  assert.deepEqual(Object.values(g).map((r) => r.status), [200, 301, 200, 200, 500]);
  assert.equal(g['www.grafo.hr/katalog'].body, '<h1>Katalog proizvoda</h1>');
  // the composer's choices, in order
  assert.deepEqual(logic.pathsOf('grafo'), ['/', '/proizvodi', '/katalog', '/obrazac', '/cjenik']);
  assert.deepEqual(logic.pathsOf('lab'), ['/', '/nema', '/privatno', '/skriveno']);
  assert.deepEqual(logic.SCENES.lab.hosts, ['www1.lab.example', 'www2.lab.example', 'www3.lab.example', '192.168.180.1', '']);
  assert.deepEqual(logic.SCENES.grafo.hosts, ['www.grafo.hr', '']);
  // GET on the form program: 200 from a program, not a file
  assert.equal(serve('grafo', req('GET', '/obrazac', 'www.grafo.hr')).decision.why, 'program');
});

test('rule 1: the SP before the reason phrase stays when the reason is empty', () => {
  assert.equal(logic.startLine({ dir: 'resp', version: 'HTTP/1.1', code: 200, reason: '' }), 'HTTP/1.1 200 ');
});

test('rule 3: more than one Host gets 400 on any version', () => {
  const two = Object.assign(req('GET', '/', 'www1.lab.example'), { version: 'HTTP/1.0' });
  two.headers.push(['host', 'www2.lab.example']);
  assert.equal(serve('lab', two).res.code, 400);
});

test('redirects: the client stops after 5 follow-ups (a loop added to the table)', () => {
  const res = logic.SCENES.grafo.vhosts[0].resources;
  res['/petlja'] = { kind: 'redirect', location: '/petlja' };
  try {
    const sent = logic.pushSent('grafo', 0, ['GET', '/petlja', 'www.grafo.hr']);
    const xs = logic.exchanges(P({ script: 'redirect', sent }));
    assert.equal(xs.filter((x) => x.user === 1).length, 6);
    assert.equal(xs.at(-1).res.code, 301);
    // one hop counts on the event
    assert.equal(run({ script: 'redirect' })[4].ev.hops, 2);
    assert.equal(run({ script: 'wrong-vhost' })[2].ev.hops, 1);
    assert.equal(run({ script: 'host-missing' })[4].ev.hops, 1);   // the second request, no redirect
  } finally { delete res['/petlja']; }
});

// ── presets ──

test('presets: step counts (SPEC.md table)', () => {
  const expect = { redirect: 4, 'host-missing': 4, 'wrong-vhost': 2, 'head-vs-get': 4, 'not-found-vs-forbidden': 4 };
  for (const [id, o] of Object.entries(PRESETS)) assert.equal(logic.steps(P(o)), expect[id], id);
  assert.equal(logic.steps(P({})), 4);
  for (const id of SCRIPTS) assert.ok(logic.SCRIPTS[id], id);
});

test('golden: every message of every preset (SPEC.md)', () => {
  const golden = {
    redirect: [
      'GET /proizvodi HTTP/1.1 | Host: www.grafo.hr',
      'HTTP/1.1 301 Moved Permanently | Location: /katalog | Content-Length: 0',
      'GET /katalog HTTP/1.1 | Host: www.grafo.hr',
      'HTTP/1.1 200 OK | Content-Type: text/html; charset=utf-8 | Content-Length: 26 | <h1>Katalog proizvoda</h1>'
    ],
    'host-missing': [
      'GET / HTTP/1.1',
      'HTTP/1.1 400 Bad Request | Content-Type: text/html; charset=utf-8 | Content-Length: 24 | <h1>400 Bad Request</h1>',
      'GET / HTTP/1.1 | Host: 192.168.180.1',
      'HTTP/1.1 200 OK | Content-Type: text/html; charset=utf-8 | Content-Length: 26 | <h1>Prvi poslužitelj</h1>'
    ],
    'wrong-vhost': [
      'GET / HTTP/1.1 | Host: www3.lab.example',
      'HTTP/1.1 200 OK | Content-Type: text/html; charset=utf-8 | Content-Length: 26 | <h1>Prvi poslužitelj</h1>'
    ],
    'head-vs-get': [
      'GET /katalog HTTP/1.1 | Host: www.grafo.hr',
      'HTTP/1.1 200 OK | Content-Type: text/html; charset=utf-8 | Content-Length: 26 | <h1>Katalog proizvoda</h1>',
      'HEAD /katalog HTTP/1.1 | Host: www.grafo.hr',
      'HTTP/1.1 200 OK | Content-Type: text/html; charset=utf-8 | Content-Length: 26'
    ],
    'not-found-vs-forbidden': [
      'GET /nema HTTP/1.1 | Host: www1.lab.example',
      'HTTP/1.1 404 Not Found | Content-Type: text/html; charset=utf-8 | Content-Length: 22 | <h1>404 Not Found</h1>',
      'GET /privatno HTTP/1.1 | Host: www1.lab.example',
      'HTTP/1.1 403 Forbidden | Content-Type: text/html; charset=utf-8 | Content-Length: 22 | <h1>403 Forbidden</h1>'
    ]
  };
  for (const [id, o] of Object.entries(PRESETS)) assert.deepEqual(last(o).messages.map(fmt), golden[id], id);
  const ev = (o) => run(o).slice(1).map((s) => [s.ev.kind, s.ev.code, s.ev.why, s.ev.byDefault ? 'default' : null, s.ev.follow ? 'follow' : null].filter(Boolean).join(' '));
  assert.deepEqual(ev(PRESETS.redirect), ['request', 'response 301 redirect follow', 'request', 'response 200 file']);
  assert.deepEqual(ev(PRESETS['host-missing']), ['request', 'response 400 host', 'request', 'response 200 file default']);
  assert.deepEqual(ev(PRESETS['wrong-vhost']), ['request', 'response 200 file default']);
  assert.deepEqual(ev(PRESETS['not-found-vs-forbidden']), ['request', 'response 404 none', 'request', 'response 403 unreadable']);
});

test('one step: odd steps send the request, even steps answer; pending is the next request or null', () => {
  for (const id of SCRIPTS) {
    const states = run({ script: id }), all = logic.exchanges(P({ script: id }));
    assert.deepEqual(states[0].pending, all[0].req);
    states.slice(1).forEach((s, i) => {
      const n = i + 1, k = Math.floor((n - 1) / 2);
      assert.equal(s.phase, n % 2 ? 'request' : 'response');
      assert.equal(s.messages.length, n);
      assert.equal(s.messages.at(-1).dir, n % 2 ? 'req' : 'resp');
      if (n % 2) { assert.equal(s.pending, null); assert.equal(s.decision, null); }
      else { assert.deepEqual(s.pending, all[k + 1] ? all[k + 1].req : null); assert.deepEqual(s.decision, all[k].decision); }
    });
    assert.ok(states.at(-1).done);
  }
});

// ── the send queue ──

test('send queue: requests round-trip through the one-number param, in the order sent, after the script', () => {
  for (const scene of ['grafo', 'lab']) {
    const all = every(scene);
    for (const r of all) assert.deepEqual(logic.decodeSent(scene, logic.pushSent(scene, 0, r)), [r]);
    let sent = 0;
    const picks = [all[0], all.at(-1), all[3], all[0]];   // repeats are allowed
    for (const r of picks) sent = logic.pushSent(scene, sent, r);
    assert.deepEqual(logic.decodeSent(scene, sent), picks);
    assert.ok(sent <= logic.sentMax(scene));
    assert.ok(logic.sentMax(scene) <= Number.MAX_SAFE_INTEGER);
  }
  const sent = logic.pushSent('lab', 0, ['GET', '/skriveno', 'www1.lab.example']);
  const s = last({ script: 'not-found-vs-forbidden', sent });
  assert.equal(s.messages.length, 6);
  assert.equal(logic.startLine(s.messages[4]), 'GET /skriveno HTTP/1.1');
  assert.equal(s.messages[5].code, 404);
  // the run up to the script's end is unchanged by a queued request
  const a = run({ script: 'not-found-vs-forbidden', sent }), b = run({ script: 'not-found-vs-forbidden' });
  for (let i = 1; i < b.length - 1; i++) assert.deepEqual(a[i], b[i]);
  assert.throws(() => logic.encodeReq('grafo', ['GET', '/nema', 'www.grafo.hr']), /not in the scene/);
});

test('send queue: S is refused before the run passes 20 steps or 8 sent requests', () => {
  for (const id of SCRIPTS) for (const r of [every(logic.SCRIPTS[id].scene)[0], ['GET', logic.SCRIPTS[id].scene === 'grafo' ? '/proizvodi' : '/', logic.SCENES[logic.SCRIPTS[id].scene].hosts[0]]]) {
    const scene = logic.SCRIPTS[id].scene;
    let p = P({ script: id });
    let sends = 0;
    while (logic.canSend(p, r)) { p = Object.assign({}, p, { sent: logic.pushSent(scene, p.sent, r) }); sends++; }
    assert.ok(logic.steps(p) <= logic.MAX_STEPS, id);
    assert.ok(sends <= logic.MAX_SENT, id);
    assert.ok(logic.steps(Object.assign({}, p, { sent: logic.pushSent(scene, p.sent, r) })) > logic.MAX_STEPS || sends === logic.MAX_SENT, id);
  }
});

// ── generic checks every sim keeps ──

const ALL = Object.values(PRESETS).concat([
  { script: 'redirect', sent: logic.pushSent('grafo', logic.pushSent('grafo', 0, ['POST', '/proizvodi', 'www.grafo.hr']), ['HEAD', '/cjenik', '']) },
  { script: 'wrong-vhost', sent: logic.pushSent('lab', 0, ['POST', '/privatno', 'www2.lab.example']) }
]);

test('state is JSON-safe at every step', () => {
  for (const o of ALL) for (const s of run(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = run(o);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P(ALL.at(-2));
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const found = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*params: \{([^}]*)\}/g)];
  assert.equal(found.length, Object.keys(PRESETS).length, 'found every preset');
  for (const m of found) {
    const params = Function('return {' + m[2] + '}')();
    assert.deepEqual(params, PRESETS[m[1]], `preset ${m[1]} as the tests run it`);
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const scene = logic.SCRIPTS[params.script].scene;
    for (const [k, v] of Object.entries(params)) {
      if (k === 'pathG' || k === 'pathL') assert.ok(logic.pathsOf(k === 'pathG' ? 'grafo' : 'lab').includes(v));
      if (k === 'hostG' || k === 'hostL') assert.ok(logic.SCENES[k === 'hostG' ? 'grafo' : 'lab'].hosts.includes(v));
      if (k === 'pathG' || k === 'hostG') assert.equal(scene, 'grafo');
      if (k === 'pathL' || k === 'hostL') assert.equal(scene, 'lab');
    }
  }
  const sentDefault = logic.defaults;
  assert.ok(logic.pathsOf('grafo').includes(sentDefault.pathG) && logic.pathsOf('lab').includes(sentDefault.pathL));
  assert.equal(sentDefault.hostG, logic.SCENES.grafo.hosts[0]);
  assert.equal(sentDefault.hostL, logic.SCENES.lab.hosts[0]);
});
