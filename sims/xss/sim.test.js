// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for xss's model. Run: node --test sims/xss/sim.test.js
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in SPEC order, the presets, the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (over) => logic.steps(P(over));
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, steps(over));
const own = (comment, over) => Object.assign({ payload: 'own', comment }, over);
/** Elements in a tree that came from the input. */
const liveTags = (nodes) => logic.elements(nodes).filter((e) => e.input).map((e) => e.tag);
/** Text nodes in a tree, depth first. */
function texts(nodes, out = []) {
  for (const x of nodes) { if (x.t === 'text') out.push(x); else texts(x.kids, out); }
  return out;
}

// ── tie-breaks ──

test('tie-break: identical comments render in post order, by id', () => {
  let store = logic.seedStore();
  store = logic.addComment(store, logic.ATTACKER, '+1'); // the same text as comment #1
  store = logic.addComment(store, logic.ATTACKER, '+1');
  assert.deepEqual(store.map((c) => c.id), [1, 2, 3, 4]);
  const r = logic.respond({ path: logic.PAGE }, store.slice().reverse(), 'none'); // stored out of order on purpose
  const ids = logic.elements(r.nodes).filter((e) => e.tag === 'li').map((e) => e.attrs[0][1]);
  assert.deepEqual(ids, ['c1', 'c2', 'c3', 'c4']);
});

test('tie-break: only the comment with markup is marked, identical plain ones are not', () => {
  let store = logic.addComment(logic.seedStore(), logic.ATTACKER, '+1');
  store = logic.addComment(store, logic.ATTACKER, logic.PAYLOADS.script);
  store = logic.addComment(store, logic.ATTACKER, logic.PAYLOADS.script);
  assert.deepEqual(store.map((c) => c.bad), [false, false, false, true, true]);
  assert.equal(at({ payload: 'plain' }, 2).stored[2].bad, false);
  assert.equal(at({ payload: 'script' }, 2).stored[2].bad, true);
  assert.equal(at({ payload: 'img' }, 2).stored[2].bad, true);
});

test('tie-break: the step count follows the input in its place, not on its own', () => {
  assert.equal(steps({ payload: 'plain' }), 5);
  assert.equal(steps(own('<b>hi</b>')), 7);           // markup, no code: still a node
  assert.equal(steps(own('</ul>')), 5);               // an end tag alone makes no node
  assert.equal(steps(own('a < b & c > d')), 5);       // < followed by a space is text
  assert.equal(steps(own('')), 5);
});

// ── rule 1: the browser decides by structure, at parse time ──

test('rule 1: unencoded input with markup becomes an element from the input', () => {
  const s = at({}, 4);
  assert.deepEqual(liveTags(s.rendered.nodes), ['script']);
  const li = logic.elements(s.rendered.nodes).find((e) => e.tag === 'li' && e.attrs[0][1] === 'c3');
  assert.equal(li.input, false, 'the li is the page\'s own');
  assert.equal(li.kids[0].tag, 'script');
  assert.equal(li.kids[0].kids[0].text, 'steal()');
});

test('rule 1: the parser — tags, attributes, void elements, raw script text, references', () => {
  const n = logic.parse('a<b>c</b><img src=x onerror="steal()">d&lt;e', [[0, 99]]);
  assert.deepEqual(n.map((x) => x.t === 'el' ? x.tag : x.text), ['a', 'b', 'img', 'd<e']);
  assert.deepEqual(n[2].attrs, [['src', 'x'], ['onerror', 'steal()']]);
  assert.equal(n[2].kids.length, 0, 'img is void');
  const s = logic.parse('<script>if (a<b) x()</script>', []);
  assert.equal(s[0].kids[0].text, 'if (a<b) x()', 'script content is raw text');
  assert.equal(logic.parse('<b', [])[0].t, 'text', 'an unclosed tag is text');
  assert.equal(logic.parse('&#x3c;b&#62;', [])[0].text, '<b>', 'numeric references decode to text, not tags');
});

test('rule 1: every node records whether it came from the input', () => {
  const html = '<li>' + 'x<i>y</i>' + '</li>';
  const n = logic.parse(html, [[4, 13]]);
  assert.equal(n[0].input, false);
  assert.equal(n[0].kids[0].input, true);
  assert.equal(n[0].kids[1].input, true);
  const split = logic.parse('ab', [[1, 2]]);
  assert.deepEqual(split.map((x) => [x.text, x.input]), [['a', false], ['b', true]]);
});

// ── rule 2: stored vs reflected ──

test('rule 2: stored — saved once, in the page for every later visitor', () => {
  const s = at({ kind: 'stored' }, 2);
  assert.equal(s.stored.length, 3);
  assert.equal(s.stored[2].body, logic.PAYLOADS.script);
  assert.deepEqual(s.reach, { victim: true, other: true });
  // an ordinary visitor who just opens the post gets it too
  const r = logic.respond({ path: logic.PAGE }, s.stored, 'none');
  assert.deepEqual(liveTags(r.nodes), ['script']);
  // the attacker never contacts the victim
  assert.ok(end({ kind: 'stored' }).events.every((e) => !(e.from === 'A' && e.to === 'V')));
});

test('rule 2: reflected — nothing saved, only the victim who follows the link', () => {
  const s = end({ kind: 'reflected' });
  assert.equal(s.stored.length, 2, 'the store is unchanged');
  assert.deepEqual(s.reach, { victim: true, other: false });
  assert.ok(s.events.some((e) => e.from === 'A' && e.to === 'V' && e.what === 'link'));
  assert.ok(s.events.some((e) => e.from === 'V' && e.to === 'S' && e.what === 'get-q' && e.data === logic.PAYLOADS.script));
  assert.equal(at({ kind: 'reflected' }, 1).link, logic.SEARCH + logic.PAYLOADS.script);
  // a visitor without the link: a clean page; another search term: no script
  assert.deepEqual(liveTags(logic.respond({ path: logic.PAGE }, s.stored, 'none').nodes), []);
  assert.deepEqual(liveTags(logic.respond({ q: 'kava' }, s.stored, 'none').nodes), []);
  assert.equal(s.scriptRuns, true);
  assert.equal(s.cookieStolen, true);
});

// ── rule 3: context-correct output encoding ──

test('rule 3: HTML encoding replaces the five characters, & first', () => {
  assert.equal(logic.htmlEncode('<a href="x">\'&'), '&lt;a href=&quot;x&quot;&gt;&#x27;&amp;');
  assert.equal(logic.htmlEncode('&lt;'), '&amp;lt;', 'not decoded, encoded again');
  assert.equal(logic.decode(logic.htmlEncode('<script>"\'&</script>')), '<script>"\'&</script>', 'round trip');
});

test('rule 3: encoded input is one text node with the literal input; nothing runs', () => {
  for (const payload of ['script', 'img']) {
    for (const kind of ['stored', 'reflected']) {
      const o = { kind, payload, encoding: 'htmlEncode' };
      const s = end(o);
      assert.equal(steps(o), 5);
      assert.deepEqual(liveTags(s.rendered.nodes), []);
      const lit = texts(s.rendered.nodes).filter((x) => x.input);
      assert.deepEqual(lit.map((x) => x.text), [logic.PAYLOADS[payload]]);
      assert.equal(s.scriptRuns, false);
      assert.equal(s.cookieStolen, false);
      assert.equal(s.phase, 'text');
    }
  }
});

test('rule 3: HTML encoding is for the body context; a javascript: URL passes through it unchanged', () => {
  assert.equal(logic.htmlEncode('javascript:steal()'), 'javascript:steal()');
  const runs = logic.runsOf(logic.parse('<a href="' + logic.htmlEncode('javascript:steal()') + '">x</a>', []), false);
  assert.deepEqual(runs.map((r) => [r.how, r.auto]), [['url', false]]);
});

// ── rule 4: textContent ──

test('rule 4: textContent puts the input in as data, never parsed, for any input', () => {
  for (const input of [logic.PAYLOADS.script, logic.PAYLOADS.img, '<b>x</b>', '</li><script>y()</script>']) {
    for (const kind of ['stored', 'reflected']) {
      const o = own(input, { kind, encoding: 'textContent' });
      const s = end(o);
      assert.equal(steps(o), 5);
      assert.deepEqual(liveTags(s.rendered.nodes), []);
      assert.deepEqual(texts(s.rendered.nodes).filter((x) => x.input).map((x) => x.text), [input]);
      assert.ok(s.rendered.asText.lines.every((l) => l.every((sg) => !sg.input)), 'the HTML holds no input');
      assert.equal(s.rendered.asText.data.filter((d) => d.input)[0].value, input);
    }
  }
});

// ── rule 1 and the misconception "removing <script> is enough" ──

test('event handlers run without <script>; other handlers and javascript: URLs are armed', () => {
  const img = end({ payload: 'img' });
  assert.deepEqual(img.live, ['img']);
  assert.deepEqual(img.runs.map((r) => [r.how, r.event, r.auto]), [['handler', 'onerror', true]]);
  assert.equal(img.scriptRuns, true);
  assert.equal(img.cookieStolen, true);
  const svg = end(own('<svg onload=steal()>'));
  assert.equal(svg.scriptRuns, true);
  const click = end(own('<a href="javascript:steal()" onmouseover=steal()>x</a>'));
  assert.equal(click.scriptRuns, false);
  assert.deepEqual(click.runs.map((r) => [r.how, r.auto]), [['url', false], ['handler', false]], 'attribute order');
  assert.equal(at(own('<a href="javascript:steal()" onmouseover=steal()>x</a>'), 6).note, 'nothing-ran');
  const noSrc = logic.runsOf(logic.parse('<img onerror=steal()>', [[0, 99]]), false);
  assert.equal(noSrc[0].auto, false, 'onerror without a src never fires');
});

// ── step 6 and rule 5: the cookie, HttpOnly ──

test('step 6: a script that reads document.cookie sends the session to the attacker', () => {
  const s = at({}, 6);
  assert.equal(s.cookieRead, logic.SID);
  assert.equal(s.cookieStolen, true);
  assert.equal(s.attackerHas, logic.SID);
  const ex = s.events[s.events.length - 1];
  assert.deepEqual([ex.from, ex.to, ex.what, ex.data], ['V', 'A', 'exfil', logic.SID]);
  assert.equal(at({}, 5).cookieStolen, false, 'not before step 6');
});

test('step 6: code that runs but does not touch the cookie sends nothing', () => {
  const s = end(own('<script>alert(1)</script>'));
  assert.equal(s.scriptRuns, true);
  assert.equal(s.cookieRead, null);
  assert.equal(s.cookieStolen, false);
  assert.equal(at(own('<script>alert(1)</script>'), 6).note, 'ran-no-cookie');
});

test('rule 5: HttpOnly — the script runs, document.cookie is empty, nothing is stolen', () => {
  for (const payload of ['script', 'img']) {
    const s = end({ payload, httpOnly: true });
    assert.equal(s.scriptRuns, true);
    assert.equal(s.cookieRead, '');
    assert.equal(s.cookieStolen, false);
    assert.equal(s.attackerHas, null);
    assert.ok(!s.events.some((e) => e.what === 'exfil'));
  }
});

// ── rule 6: CSP ──

test('rule 6: CSP refuses injected inline code; the node is still in the tree', () => {
  for (const payload of ['script', 'img']) {
    const s = end({ payload, csp: true });
    assert.equal(steps({ payload, csp: true }), 7, 'encoding is still missing');
    assert.equal(s.live.length, 1);
    assert.equal(s.scriptRuns, false);
    assert.equal(s.blockedBy, 'csp');
    assert.equal(s.cookieStolen, false);
    assert.ok(s.runs.every((r) => r.blocked));
  }
  assert.equal(end({}).blockedBy, null);
});

// ── step 7: the fix ──

test('step 7 shows the same input HTML-encoded; earlier steps and the log stay', () => {
  const s = end({});
  assert.equal(s.phase, 'fix');
  assert.deepEqual(liveTags(s.fix.nodes), []);
  assert.deepEqual(texts(s.fix.nodes).filter((x) => x.input).map((x) => x.text), [logic.PAYLOADS.script]);
  assert.deepEqual(liveTags(s.rendered.nodes), ['script'], 'what happened is kept');
  assert.deepEqual(s.log.map((l) => l.code), ['ran', 'sent', 'fix']);
  assert.equal(at({}, 6).fix, null);
});

// ── from the fresh review: the parser's edges a student can type, and each rule's boundary ──

test('parser: comments are dropped, raw text elements hold text, an unterminated script never runs', () => {
  assert.equal(end(own('<!--<script>steal()</script>-->')).scriptRuns, false);
  assert.equal(steps(own('<!-- x -->')), 5);
  assert.equal(end(own('<!-- a > b <script>steal()</script> -->')).scriptRuns, false, 'a comment ends at -->, not at >');
  assert.deepEqual(logic.parse('<!x>y<?z>', []).map((x) => x.text), ['y'], 'bogus comments are dropped too');
  assert.deepEqual(texts(at(own('<!-- x -->'), 4).rendered.nodes).filter((x) => x.input), []);
  for (const tag of ['textarea', 'title', 'style', 'xmp']) {
    const s = end(own('<' + tag + '><script>steal()</script></' + tag + '>'));
    assert.equal(s.scriptRuns, false, tag);
    assert.deepEqual(s.live, [tag], tag + ' is the only node');
  }
  assert.equal(logic.parse('<textarea>&lt;b&gt;</textarea>', [])[0].kids[0].text, '<b>', 'escapable raw text decodes');
  assert.equal(logic.parse('<style>&lt;</style>', [])[0].kids[0].text, '&lt;', 'raw text does not');
  const open = end(own('<script>steal()'));
  assert.deepEqual(open.live, ['script']);
  assert.equal(open.scriptRuns, false);
  assert.equal(open.runs.length, 0);
});

test('parser: attributes — references decoded, single quotes, the first of a repeated name', () => {
  assert.deepEqual(logic.parse('<a title="&lt;b&gt;">', [])[0].attrs, [['title', '<b>']]);
  assert.deepEqual(logic.parse("<img src='x y' onerror='steal()'>", [])[0].attrs, [['src', 'x y'], ['onerror', 'steal()']]);
  assert.deepEqual(logic.parse('<img src=x onerror=a() onerror=b()>', [])[0].attrs, [['src', 'x'], ['onerror', 'a()']]);
});

test('parser: an end tag closes its own element, case does not matter, < before a non-letter is text', () => {
  const n = logic.parse('<b>x</i>y</b>z', []);
  assert.deepEqual(n[0].kids.map((k) => k.text), ['xy']);
  assert.equal(n[1].text, 'z');
  const up = logic.parse('<SCRIPT>a</SCRIPT>b', []);
  assert.deepEqual([up[0].tag, up[0].kids[0].text, up[1].text], ['script', 'a', 'b']);
  assert.equal(steps(own('1 <2')), 5);
  assert.equal(logic.parse('a<b>', [[0, 1]])[1].input, false, 'the range end is exclusive');
});

test('the input in its place: an element flag at its start, the store mark and the step count agree', () => {
  // '<b' is closed by the page's own '</li>': a tag named "b<", from the input (as a browser does)
  assert.equal(steps(own('<b')), 7);
  assert.equal(at(own('<b'), 2).stored[2].bad, true);
  assert.equal(steps(own('<i title="')), 5, 'an unclosed quote swallows the rest: text');
  assert.equal(at(own('<i title="'), 2).stored[2].bad, false);
  assert.equal(logic.addComment(logic.seedStore(), logic.ATTACKER, 'a < b').slice(-1)[0].bad, false);
  assert.equal(logic.addComment([{ id: 1, author: 'a', body: '', bad: false }, { id: 5, author: 'b', body: '', bad: false }], 'c', 'x').slice(-1)[0].id, 6);
});

test('events: onload only where something loads by itself, onerror only with a src', () => {
  assert.equal(logic.runsOf(logic.parse('<b onload=steal()>', [[0, 99]]))[0].auto, false);
  assert.equal(logic.runsOf(logic.parse('<img src=x onload=steal()>', [[0, 99]]))[0].auto, false, 'src=x fails: no load');
  assert.equal(end(own('<img src=x onload=steal()>')).scriptRuns, false);
  for (const tag of ['svg', 'body', 'iframe']) assert.equal(end(own('<' + tag + ' onload=steal()>')).scriptRuns, true, tag);
});

test('javascript: URLs — href, src, action, any case, tabs and leading spaces ignored; always armed', () => {
  const kinds = (html) => logic.runsOf(logic.parse(html, [[0, 99]])).map((r) => [r.how, r.auto]);
  assert.deepEqual(kinds('<form action=javascript:steal()>'), [['url', false]]);
  assert.deepEqual(kinds('<a href=" JavaScript:steal()">'), [['url', false]]);
  assert.deepEqual(kinds('<a href="java\tscript:steal()">'), [['url', false]]);
  assert.deepEqual(kinds('<a href="/javascript:x">'), []);
});

test('scripts with a src: the code is the source; CSP allows the page\'s own origin only', () => {
  const r = end(own('<script src=//evil.example/x.js></script>'));
  assert.equal(r.runs[0].code, 'src=//evil.example/x.js');
  assert.equal(end(own('<script src=//evil.example/x.js></script>', { csp: true })).runs[0].blocked, true);
  assert.equal(end(own('<script src=/x.js></script>', { csp: true })).runs[0].blocked, false);
});

test('CSP: blockedBy only when something was refused; refused beats armed in the note', () => {
  assert.equal(end({ payload: 'plain', csp: true }).blockedBy, null);
  assert.equal(end(own('<b>x</b>', { csp: true })).blockedBy, null);
  const s = at(own('<img src=x onerror=steal() onclick=x()>', { csp: true }), 5);
  assert.equal(s.note, 'csp');
  assert.deepEqual(s.log.map((l) => l.code), ['csp', 'csp']);
  const armed = at(own('<a href=javascript:steal()>x</a>', { csp: true }), 5);
  assert.equal(armed.note, 'csp', 'under CSP a click would be refused too');
  assert.equal(armed.blockedBy, 'csp');
});

test('markup without code: one log line; changed is reset every step', () => {
  assert.deepEqual(at(own('<b>hi</b>'), 5).log.map((l) => l.code), ['markup']);
  assert.equal(at(own('<b>hi</b>'), 5).note, 'markup');
  assert.ok(at({}, 1).changed.includes('input'));
  assert.ok(!at({}, 2).changed.includes('input'));
});

test('reading the cookie is not sending it: document.cookie alone stays in the browser', () => {
  const o = own('<script>alert(document.cookie)</script>');
  const s = at(o, 6);
  assert.equal(s.note, 'read');
  assert.equal(s.cookieRead, logic.SID);
  assert.equal(s.cookieStolen, false);
  assert.equal(s.attackerHas, null);
  assert.ok(!s.events.some((e) => e.what === 'exfil'));
  assert.equal(at(Object.assign({ httpOnly: true }, o), 6).cookieRead, '');
  assert.equal(logic.sendsCookie('steal()'), true);
  assert.equal(logic.sendsCookie('alert(document.cookie)'), false);
});

// ── presets (as in index.html) ──

test('presets: steps and outcomes as the task gives them', () => {
  const presets = {
    'stored-raw': [{ kind: 'stored', encoding: 'none', payload: 'script' }, 7, { scriptRuns: true, cookieStolen: true }],
    reflected: [{ kind: 'reflected', encoding: 'none', payload: 'script' }, 7, { scriptRuns: true, cookieStolen: true }],
    'img-onerror': [{ kind: 'stored', encoding: 'none', payload: 'img' }, 7, { scriptRuns: true, cookieStolen: true }],
    encoded: [{ kind: 'stored', encoding: 'htmlEncode', payload: 'script' }, 5, { scriptRuns: false, cookieStolen: false }],
    httponly: [{ kind: 'stored', encoding: 'none', payload: 'script', httpOnly: true }, 7, { scriptRuns: true, cookieStolen: false }]
  };
  for (const [id, [o, n, want]] of Object.entries(presets)) {
    assert.equal(steps(o), n, id + ' steps');
    const s = end(o);
    for (const k of Object.keys(want)) assert.equal(s[k], want[k], id + ' ' + k);
  }
  assert.equal(steps({}), 7, 'the defaults are the sim.json steps');
});

test('the phases in order', () => {
  const ph = (o) => Array.from({ length: steps(o) + 1 }, (_, n) => at(o, n).phase);
  assert.deepEqual(ph({}), ['start', 'post', 'store', 'open', 'response', 'run', 'exfil', 'fix']);
  assert.deepEqual(ph({ kind: 'reflected' }), ['start', 'link', 'click', 'reflect', 'response', 'run', 'exfil', 'fix']);
  assert.deepEqual(ph({ encoding: 'htmlEncode' }), ['start', 'post', 'store', 'open', 'response', 'text']);
});

// ── generic checks every sim keeps ──

const VARIANTS = [{}, { kind: 'reflected' }, { payload: 'img', csp: true }, { encoding: 'textContent' }, own('<b onclick=x()>"\'&</b>', { httpOnly: true })];

test('state is JSON-safe at every step', () => {
  for (const o of VARIANTS) {
    for (let n = 0; n <= steps(o); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of VARIANTS) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({});
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
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
