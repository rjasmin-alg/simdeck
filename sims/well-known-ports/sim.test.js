// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the well-known ports poster. Run: node --test sims/well-known-ports/
// Order: tie-breaks, then the rules of SPEC.md §3, then the expected numbers of SPEC.md §2 and §4, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const ports = () => logic.CARDS.map((c) => c.port);
const fam = (s, f) => s.cards.filter((c) => c.family === f).map((c) => c.port);

// ── tie-breaks (SPEC.md §3 rule 5 and §5) ──

test('tie-break: by port number, then TCP before UDP (both between)', () => {
  const c = (port, t) => ({ port, t });
  const list = [c(53, 'udp'), c(53, 'both'), c(22, 'udp'), c(53, 'tcp'), c(22, 'tcp')];
  assert.deepEqual(list.slice().sort(logic.compare).map((x) => x.port + x.t), ['22tcp', '22udp', '53tcp', '53both', '53udp']);
  // the port decides before the transport
  assert.ok(logic.compare(c(22, 'udp'), c(23, 'tcp')) < 0);
  assert.equal(logic.compare(c(80, 'tcp'), c(80, 'tcp')), 0);
  // the cards and every list the model returns are in that order
  assert.deepEqual(ports(), ports().slice().sort((a, b) => a - b));
  for (const over of [{}, { transport: 'udp' }, { view: 'book-five' }, { view: 'linux-services' }, { range: 'user' }]) {
    const s = S(over);
    assert.deepEqual(s.active, s.active.slice().sort((a, b) => a - b), JSON.stringify(over));
    assert.deepEqual(s.cards.map((x) => x.port), ports());
  }
});

test('tie-break: in secure-pairs each secure card follows its plain partner', () => {
  const s = S({ view: 'secure-pairs' });
  assert.deepEqual(fam(s, 'mail'), [25, 110, 995, 143, 993, 587]);
  assert.deepEqual(fam(s, 'name'), [53, 853, 67, 68, 5353]);
  assert.deepEqual(fam(s, 'remote'), [23, 22, 3389]);
  assert.deepEqual(fam(s, 'directory'), [88, 389, 636]);
  assert.deepEqual(fam(s, 'web'), [80, 443]);
  assert.deepEqual(fam(s, 'files'), [20, 21, 445]);
  assert.deepEqual(s.active, [23, 22, 53, 853, 80, 443, 110, 995, 143, 993, 389, 636]);
  // equal anchors: the plain card first, whatever the port numbers say (22 < 23)
  const a = { port: 23, t: 'tcp' }, b = { port: 22, t: 'tcp', sec: { of: 23 } };
  assert.ok(logic.comparePairs(a, b) < 0);
  assert.ok(logic.comparePairs(b, a) > 0);
  // a filter ends the view, and the order goes back to port order
  assert.deepEqual(fam(S({ view: 'secure-pairs', family: 'mail' }), 'mail'), [25, 110, 143, 587, 993, 995]);
});

test('tie-break: a filter ends a view', () => {
  assert.equal(S({ view: 'book-five' }).view, 'book-five');
  assert.deepEqual(S({ view: 'book-five' }).active, [22, 25, 53, 80, 443]);
  const s = S({ view: 'book-five', transport: 'udp' });
  assert.equal(s.view, null);
  assert.deepEqual(s.active, [53, 67, 68, 88, 123, 161, 162, 443, 514, 5353]);
  assert.equal(S({ view: 'linux-services', course: 'UL' }).view, null);
  assert.equal(S({ view: 'ranges', range: 'user' }).view, null);
  assert.equal(S({ view: 'ranges', range: 'user' }).big, false);
  assert.deepEqual(S({ view: 'ranges', range: 'user' }).examples, []);
  // udp-only is on with transport udp, and off without it or with one more filter
  assert.equal(S({ view: 'udp-only', transport: 'udp' }).view, 'udp-only');
  assert.equal(S({ view: 'udp-only' }).view, null);
  assert.equal(S({ view: 'udp-only', transport: 'udp', family: 'name' }).view, null);
  assert.equal(S({ view: 'udp-only', transport: 'tcp' }).view, null);
});

test('tie-break: a dimmed card can still be selected, with its pair and range', () => {
  const s = S({ family: 'mail', sel: '443' });
  assert.equal(s.highlight, 443);
  assert.equal(s.pair, 80);
  assert.equal(s.range, 'system');
  const c = s.cards.find((x) => x.port === 443);
  assert.equal(c.visible, false);
  assert.equal(c.selected, true);
  assert.equal(s.cards.find((x) => x.port === 80).paired, true);
  assert.equal(s.cards.filter((x) => x.paired).length, 1);
  // the range is the selected card's, not its partner's; a card with no pair has none
  assert.equal(S({ sel: '3389' }).range, 'user');
  assert.equal(S({ sel: '3389' }).pair, null);
  assert.equal(S({ sel: '25' }).pair, null);
  assert.equal(S({ sel: '25' }).cards.filter((x) => x.paired).length, 0);
  assert.equal(S({}).range, null);
  assert.equal(S({}).pair, null);
});

test('tie-break: unknown params are all, no view and no selection', () => {
  for (const k of ['constructor', '__proto__', 'toString', 'x', '', null, undefined, 'ALL', 'tcp ', 'TCP', 'both', 'dynamic ']) {
    const s = S({ transport: k, family: k, range: k, course: k, view: k, sel: k });
    assert.deepEqual(s.filter, { transport: 'all', family: 'all', range: 'all', course: 'all' }, String(k));
    assert.equal(s.view, null, String(k));
    assert.equal(s.highlight, null, String(k));
    assert.deepEqual(s.active, ports());
  }
  for (const sel of ['24', '0', '052', '053', '0443', ' 53', '53 ', 53, '0x35', '53.0', '65536', '52140']) assert.equal(S({ sel }).highlight, null, String(sel));
  assert.equal(S({ sel: '5432' }).highlight, 5432);
  assert.equal(S({ view: 'none' }).view, null);
  // an unknown filter is all, so a view stays on with it
  assert.equal(S({ view: 'book-five', family: 'constructor' }).view, 'book-five');
  assert.equal(S({ view: 'udp-only', transport: 'udp', course: '__proto__' }).view, 'udp-only');
});

test('tie-break: an empty filter dims every card', () => {
  assert.deepEqual(S({ range: 'dynamic' }).active, []);
  assert.deepEqual(S({ course: 'URM', family: 'db' }).active, []);
  assert.ok(S({ range: 'dynamic' }).cards.every((c) => !c.visible));
});

// ── rule 1: ranges and the bar ──

test('rule 1: system 0–1023, user 1024–49151, dynamic 49152–65535', () => {
  const want = [[0, 'system'], [1023, 'system'], [1024, 'user'], [49151, 'user'], [49152, 'dynamic'], [65535, 'dynamic'],
    [65536, null], [-1, null], [80.5, null], ['80', null], [NaN, null], [Infinity, null], [null, null], [undefined, null]];
  for (const [p, r] of want) assert.equal(logic.rangeOf(p), r, String(p));
  assert.deepEqual(logic.RANGES.map((r) => [r.id, r.from, r.to]), [['system', 0, 1023], ['user', 1024, 49151], ['dynamic', 49152, 65535]]);
  // every card's range follows from its number; no card is in the dynamic range (never assigned)
  for (const c of S({}).cards) assert.equal(c.range, logic.rangeOf(c.port));
  assert.equal(logic.CARDS.filter((c) => logic.rangeOf(c.port) === 'dynamic').length, 0);
});

test('rule 1: the bar is to scale on a log axis, with the linear shares', () => {
  assert.equal(logic.logPos(0), 0);
  assert.equal(logic.logPos(65535), 1);
  assert.equal(logic.logPos(1023), 0.625);
  const b = logic.bar();
  assert.deepEqual(b.map((r) => r.id), ['system', 'user', 'dynamic']);
  assert.deepEqual(b[0].log, [0, 0.625]);
  assert.equal(b[1].log[0], 0.625);
  assert.equal(b[1].log[1].toFixed(5), '0.97406');
  assert.equal(b[2].log[0], b[1].log[1]);
  assert.equal(b[2].log[1], 1);
  // linear: system 1.56 %, user 73.4 %, dynamic 25 %
  assert.equal(((b[0].lin[1] - b[0].lin[0]) * 100).toFixed(2), '1.56');
  assert.equal(((b[1].lin[1] - b[1].lin[0]) * 100).toFixed(1), '73.4');
  assert.equal(((b[2].lin[1] - b[2].lin[0]) * 100).toFixed(1), '25.0');
  // monotonic: a larger number is further right
  for (let p = 0; p < 65535; p += 97) assert.ok(logic.logPos(p + 1) > logic.logPos(p));
});

// ── rule 2: the client's port ──

test('rule 2: the client takes its port from the dynamic range; the server listens on the registered one', () => {
  assert.equal(logic.rangeOf(logic.EXAMPLE.client), 'dynamic');
  assert.equal(logic.rangeOf(logic.EXAMPLE.server), 'system');
  assert.deepEqual(logic.EXAMPLE, { client: 52140, server: 443 });
  for (const e of logic.EXAMPLES) assert.equal(logic.rangeOf(e.port), e.range, String(e.port));
  assert.deepEqual(logic.EXAMPLES.map((e) => [e.port, e.role]), [[443, 'server'], [3389, 'server'], [52140, 'client']]);
  assert.ok(!(52140 in logic.BY_PORT), 'the client port is no card');
  // the DHCP client is the one card a client listens on
  assert.deepEqual(S({}).cards.filter((c) => c.side === 'client').map((c) => c.port), [68]);
  // the ranges view marks the three examples
  assert.deepEqual(S({ view: 'ranges' }).examples.map((e) => e.port), [443, 3389, 52140]);
  assert.equal(S({ view: 'ranges' }).big, true);
  assert.deepEqual(S({}).examples, []);
});

// ── rule 4: the card set ──

test('rule 4: the card set, transports and registry service names (SPEC §2)', () => {
  const want = {
    20: ['tcp', 'ftp-data', 'files'], 21: ['tcp', 'ftp', 'files'], 22: ['tcp', 'ssh', 'remote'], 23: ['tcp', 'telnet', 'remote'],
    25: ['tcp', 'smtp', 'mail'], 53: ['both', 'domain', 'name'], 67: ['udp', 'bootps', 'name'], 68: ['udp', 'bootpc', 'name'],
    80: ['tcp', 'http', 'web'], 88: ['both', 'kerberos', 'directory'], 110: ['tcp', 'pop3', 'mail'], 123: ['udp', 'ntp', 'time'],
    143: ['tcp', 'imap', 'mail'], 161: ['udp', 'snmp', 'time'], 162: ['udp', 'snmptrap', 'time'], 389: ['tcp', 'ldap', 'directory'],
    443: ['both', 'https', 'web'], 445: ['tcp', 'microsoft-ds', 'files'], 514: ['udp', 'syslog', 'time'],
    587: ['tcp', 'submission', 'mail'], 636: ['tcp', 'ldaps', 'directory'], 853: ['tcp', 'domain-s', 'name'],
    993: ['tcp', 'imaps', 'mail'], 995: ['tcp', 'pop3s', 'mail'], 3306: ['tcp', 'mysql', 'db'], 3389: ['tcp', 'ms-wbt-server', 'remote'],
    5353: ['udp', 'mdns', 'name'], 5432: ['tcp', 'postgresql', 'db']
  };
  assert.deepEqual(ports(), Object.keys(want).map(Number));
  for (const c of S({}).cards) assert.deepEqual([c.transport, c.service, c.family], want[c.port], String(c.port));
});

test('rule 4: plain/secure pairs and their mechanism', () => {
  const pairs = [[80, 443, 'TLS'], [110, 995, 'TLS'], [143, 993, 'TLS'], [389, 636, 'TLS'], [53, 853, 'TLS'], [23, 22, 'SSH']];
  const s = S({});
  for (const [plain, sec, via] of pairs) {
    assert.equal(logic.pairOf(plain), sec);
    assert.equal(logic.pairOf(sec), plain);
    const cs = s.cards.find((c) => c.port === sec), cp = s.cards.find((c) => c.port === plain);
    assert.equal(cs.secureOf, plain);
    assert.equal(cs.via, via);
    assert.equal(cp.secure, sec);
    assert.equal(cp.secureOf, null);
  }
  assert.equal(s.cards.filter((c) => c.secureOf !== null).length, 6);
  assert.equal(s.cards.filter((c) => c.secure !== null).length, 6);
  for (const p of [25, 587, 21, 514, 3389, 52140, '443', null]) assert.equal(logic.pairOf(p), null, String(p));
});

test('rule 4: names, references and course chapters of every card (SPEC §2)', () => {
  const want = {
    20: ['FTP data', 'RFC 959 §3.2', { URM: [14] }], 21: ['FTP control', 'RFC 959 §8', { URM: [14] }],
    22: ['SSH', 'RFC 4253 §4.1', { URM: [13], UL: [15, 18] }], 23: ['Telnet', 'RFC 854', {}],
    25: ['SMTP', 'RFC 5321', { URM: [13, 14], UL: [20] }], 53: ['DNS', 'RFC 1035 §4.2, RFC 7766', { URM: [13, 14], UL: [19] }],
    67: ['DHCP server', 'RFC 2131 §4.1', { URM: [14], UL: [18] }], 68: ['DHCP client', 'RFC 2131 §4.1', { URM: [14], UL: [18] }],
    80: ['HTTP', 'RFC 9110 §4.2.1', { URM: [13, 14], UL: [21] }], 88: ['Kerberos', 'RFC 4120 §7.2', {}],
    110: ['POP3', 'RFC 1939 §3', { URM: [14], UL: [20] }], 123: ['NTP', 'RFC 5905', { UL: [18] }],
    143: ['IMAP', 'RFC 9051 §2.1', { URM: [14], UL: [20] }], 161: ['SNMP', 'RFC 3417', {}], 162: ['SNMP trap', 'RFC 3417', {}],
    389: ['LDAP', 'RFC 4511', {}], 443: ['HTTPS', 'RFC 9110 §4.2.2, RFC 9114 §3.1', { URM: [13, 14], UL: [21] }],
    445: ['SMB', 'registry', { UL: [18] }], 514: ['syslog', 'RFC 5426', { UL: [13, 15, 18] }],
    587: ['mail submission', 'RFC 6409 §3.1', { UL: [20] }], 636: ['LDAPS', 'registry', {}], 853: ['DNS over TLS', 'RFC 7858', {}],
    993: ['IMAPS', 'RFC 8314 §7.2', { UL: [20] }], 995: ['POP3S', 'RFC 8314 §7.1', {}],
    3306: ['MySQL protocol', 'registry', { UL: [22] }], 3389: ['remote desktop', 'registry', {}], 5353: ['mDNS', 'RFC 6762', {}],
    5432: ['PostgreSQL protocol', 'registry', { UL: [22] }]
  };
  const s = S({});
  assert.deepEqual(s.cards.map((c) => c.port), Object.keys(want).map(Number));
  for (const c of s.cards) {
    assert.deepEqual([c.name, c.rfc, c.ch], want[c.port], String(c.port));
    assert.deepEqual(c.course, ['URM', 'UL'].filter((k) => k in c.ch), String(c.port));
  }
});

// ── numbers (SPEC §2 and §4) ──

test('numbers: per family, transport, range and course', () => {
  const n = (o) => S(o).active;
  assert.equal(n({}).length, 28);
  const fams = { web: [80, 443], remote: [22, 23, 3389], name: [53, 67, 68, 853, 5353], mail: [25, 110, 143, 587, 993, 995],
    files: [20, 21, 445], directory: [88, 389, 636], time: [123, 161, 162, 514], db: [3306, 5432] };
  assert.deepEqual(logic.FAMILIES, Object.keys(fams));
  for (const f of logic.FAMILIES) assert.deepEqual(n({ family: f }), fams[f], f);
  assert.equal(n({ transport: 'tcp' }).length, 21);
  assert.deepEqual(n({ transport: 'udp' }), [53, 67, 68, 88, 123, 161, 162, 443, 514, 5353]);
  assert.equal(n({ range: 'system' }).length, 24);
  assert.deepEqual(n({ range: 'user' }), [3306, 3389, 5353, 5432]);
  assert.deepEqual(n({ range: 'dynamic' }), []);
  assert.deepEqual(n({ course: 'URM' }), [20, 21, 22, 25, 53, 67, 68, 80, 110, 143, 443]);
  assert.deepEqual(n({ course: 'UL' }), [22, 25, 53, 67, 68, 80, 110, 123, 143, 443, 445, 514, 587, 993, 3306, 5432]);
  assert.deepEqual(n({ transport: 'udp', family: 'name' }), [53, 67, 68, 5353]);
  assert.deepEqual(n({ range: 'user', transport: 'udp' }), [5353]);
  assert.deepEqual(n({ course: 'UL', family: 'db' }), [3306, 5432]);
  assert.deepEqual(n({ course: 'URM', family: 'remote' }), [22]);
  const both = logic.CARDS.filter((c) => c.t === 'both').map((c) => c.port);
  assert.deepEqual(both, [53, 88, 443]);
});

test('numbers: the views (SPEC §4)', () => {
  const want = {
    'book-five': [22, 25, 53, 80, 443],
    'udp-only': [53, 67, 68, 88, 123, 161, 162, 443, 514, 5353],
    'secure-pairs': [23, 22, 53, 853, 80, 443, 110, 995, 143, 993, 389, 636],
    'linux-services': [22, 67, 68, 123, 445, 514],
    'ranges': [443, 3389]
  };
  for (const v of Object.keys(want)) {
    const s = S(Object.assign({ view: v }, logic.VIEWS[v].filter));
    assert.equal(s.view, v);
    assert.deepEqual(s.active, want[v], v);
  }
  assert.deepEqual(logic.VIEW_IDS, ['none'].concat(Object.keys(want)));
});

test('numbers: changed = the cards that appeared with the last filter', () => {
  const tcpOnly = logic.CARDS.filter((c) => c.t === 'tcp').map((c) => c.port);
  assert.equal(tcpOnly.length, 18);
  assert.deepEqual(logic.appeared(S({ transport: 'udp' }), S({})), tcpOnly);
  assert.deepEqual(logic.appeared(S({}), S({ transport: 'udp' })), []);
  assert.deepEqual(logic.appeared(S({ range: 'dynamic' }), S({ range: 'user' })), [3306, 3389, 5353, 5432]);
  assert.deepEqual(logic.appeared(null, S({})), []);
  // in the order of the later state
  assert.deepEqual(logic.appeared(S({ view: 'book-five' }), S({ view: 'secure-pairs' })), [23, 853, 110, 995, 143, 993, 389, 636]);
});

// ── generic checks every sim keeps ──

test('a reference page: no steps, and step changes nothing', () => {
  assert.equal(logic.steps, 0);
  const s = S({ transport: 'udp', sel: '53' });
  assert.deepEqual(logic.step(s, 1, P({})), s);
});

test('state is JSON-safe for every param combination, and the cards agree with it', () => {
  for (const transport of logic.PARAM_IDS.transport) for (const range of logic.PARAM_IDS.range) for (const course of logic.PARAM_IDS.course) {
    for (const view of logic.VIEW_IDS) for (const sel of ['', '22', '443']) {
      const s = S({ transport, range, course, view, sel, family: 'all' });
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      const order = s.cards.map((c) => c.port);
      assert.deepEqual(s.cards.filter((c) => c.visible).map((c) => c.port), s.active);
      assert.deepEqual(s.active, order.filter((p) => s.active.includes(p)));
      assert.deepEqual(s.cards.filter((c) => c.selected).map((c) => c.port), s.highlight === null ? [] : [s.highlight]);
    }
  }
});

test('deterministic, and the model data is not mutated', () => {
  const before = structuredClone(logic.CARDS);
  const views = structuredClone(logic.VIEWS);
  const a = S({ view: 'ranges', sel: '22' });
  a.cards[2].ch.UL.push(99);
  a.active.push(1);
  a.examples.push(1);
  a.bar[0].log[0] = 9;
  S({ view: 'secure-pairs' }).active.reverse();
  assert.deepEqual(S({ view: 'ranges', sel: '22' }), logic.initial(P({ view: 'ranges', sel: '22' })));
  assert.deepEqual(logic.CARDS, before);
  assert.deepEqual(logic.VIEWS, views);
  assert.deepEqual(logic.EXAMPLES.map((e) => e.port), [443, 3389, 52140]);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every card, family, range and view has its words in both languages', () => {
  for (const lang of ['hr', 'en']) {
    const T = strings[lang];
    for (const c of logic.CARDS) for (const k of ['n', 'm', 'x']) assert.ok(T[k + c.port], lang + ' ' + k + c.port);
    for (const f of logic.FAMILIES) assert.ok(T['f_' + f], lang + ' f_' + f);
    for (const r of logic.RANGES) assert.ok(T['r_' + r.id], lang + ' r_' + r.id);
    for (const v of logic.VIEW_IDS) assert.ok(T['cap_' + v], lang + ' cap_' + v);
  }
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'reference');
  assert.equal(meta.steps, undefined);
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(presets.length, 5);
  const seen = [];
  for (const body of presets) {
    const p = {};
    for (const [, k, v] of body.matchAll(/(\w+):\s*'([^']*)'/g)) {
      assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
      p[k] = v;
    }
    assert.ok(logic.VIEW_IDS.includes(p.view), 'preset sets a view');
    assert.equal(S(p).view, p.view, JSON.stringify(p));
    seen.push(p.view);
  }
  assert.deepEqual(seen, logic.VIEW_IDS.slice(1));
});
