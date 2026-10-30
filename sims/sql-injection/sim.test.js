// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for sql-injection. Run: node --test sims/sql-injection/
// Rules and expected rows: SPEC.md. Tie-breaks first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => logic.presets.find((p) => p.id === id).params;
const OR_TRUE = "' OR '1'='1";
/** Non-space tokens as "origin:role:text", for compact comparisons. */
const toks = (s) => s.tokens.filter((t) => t.role !== 'space').map((t) => `${t.origin}:${t.role}:${t.text}`);
const dataCode = (s) => s.tokens.filter((t) => t.origin === 'data' && logic.CODE_ROLES.includes(t.role)).map((t) => t.text);

// ── tie-breaks ──

test('tie-break: several rows come back in primary-key order and the app takes the first', () => {
  const s = S(preset('or-true'));
  assert.deepEqual(s.returned, [1, 2, 3]);
  assert.equal(s.authenticated, 'admin');
  assert.deepEqual(s.rows.map((r) => [r.returned, r.first]), [[true, true], [true, false], [true, false]]);
  // the order is by id, not by the order the WHERE clause names them
  const t = S({ user: "marko' OR name='ana", pass: "x' OR '1'='1" });
  assert.deepEqual(t.returned, [1, 2, 3]);
  const u = S({ user: "marko' OR name='ana' --", pass: 'x' });
  assert.deepEqual(u.returned, [2, 3]);
  assert.equal(u.authenticated, 'ana');
});

test('tie-break: a payload fills the username; none leaves the typed text', () => {
  assert.equal(S({ payload: 'admin-comment', user: 'ana' }).inputs.user, "admin'--");
  assert.equal(S({ payload: 'none', user: 'marko' }).inputs.user, 'marko');
  assert.equal(S({ payload: 'bogus', user: 'marko' }).inputs.user, 'marko', 'an unknown payload is none');
  assert.deepEqual(Object.values(logic.PAYLOADS), [OR_TRUE, "admin'--", "'; DROP TABLE users;--"]);
});

test('tie-break: a syntax error anywhere runs nothing, even a DROP before it', () => {
  const s = S({ role: 'owner', user: "'; DROP TABLE users; SELEC", pass: 'x' });
  assert.equal(s.error, 'syntax');
  assert.equal(s.dropped, false);
  assert.deepEqual(s.statements, []);
  assert.equal(s.outcome, 'error');
  assert.equal(s.note, 'error');
});

test('tie-break: the app reads the first SELECT; the first error stops the rest', () => {
  const s = S({ user: "ana' AND pass='tajna'; SELECT * FROM users --", pass: 'x' });
  assert.deepEqual(s.statements.map((x) => [x.kind, x.status, x.rows]), [['select', 'ran', 1], ['select', 'ran', 3]]);
  assert.deepEqual(s.returned, [2]);
  const t = S({ role: 'owner', user: "'; DROP TABLE users; SELECT * FROM users --", pass: 'x' });
  assert.deepEqual(t.statements.map((x) => x.status), ['ran', 'ran', 'error']);
  assert.equal(t.error, 'table');
  const u = S({ user: "'; DROP TABLE users; SELECT * FROM users --", pass: 'x' });
  assert.deepEqual(u.statements.map((x) => x.status), ['ran', 'denied', 'skipped']);
});

test('tie-break: caption case, first that holds', () => {
  assert.equal(S({ user: "'", pass: 'x' }).note, 'error');
  assert.equal(S({ mode: 'param', user: "'", pass: 'x' }).note, 'paramFixed', 'param never errors on input');
  assert.equal(S({ user: "ana' AND nope='1", pass: 'x' }).note, 'error', 'unknown column');
  assert.equal(S(preset('stacked')).note, 'stacked');
  assert.equal(S(preset('admin-comment')).note, 'comment');
  assert.equal(S(preset('or-true')).note, 'injected');
  assert.equal(S(preset('normal')).note, 'normal');
  assert.equal(S({ pass: 'x' }).note, 'wrong');
  assert.equal(S(preset('fixed')).note, 'paramFixed');
  assert.equal(S({ mode: 'param' }).note, 'paramMatch');
  assert.equal(S({ mode: 'param', pass: 'x' }).note, 'paramNoMatch');
});

// ── rules ──

test('rule 1: concatenation: plain input stays a value; a quote in it closes the string and the rest is code', () => {
  const s = S(preset('normal'));
  assert.equal(s.built, "SELECT * FROM users WHERE name='ana' AND pass='tajna'");
  assert.equal(s.injected, false);
  assert.deepEqual(dataCode(s), []);
  assert.deepEqual(s.tokens.filter((t) => t.origin === 'data').map((t) => t.role), ['string', 'string']);
  const i = S({ user: OR_TRUE });
  assert.equal(i.built, "SELECT * FROM users WHERE name='' OR '1'='1' AND pass='tajna'");
  assert.equal(i.injected, true);
  assert.deepEqual(dataCode(i), ["'", 'OR', "'", "'", '=', "'"]);
  // the quote that closes the name string is the input's; the template's own quote now closes '1
  assert.deepEqual(toks(i).slice(7, 14), ["code:quote:'", "data:quote:'", 'data:keyword:OR', "data:quote:'", 'data:string:1', "data:quote:'", 'data:op:=']);
  // a doubled quote is SQL's way to write one quote character: it stays inside the string
  const e = S({ user: "it''s", pass: 'x' });
  assert.equal(e.injected, false);
  assert.equal(e.outcome, 'nomatch');
  // the same text with a lone quote breaks the query
  assert.equal(S({ user: "it's", pass: 'x' }).error, 'syntax');
});

test('rule 2: OR \'1\'=\'1 makes WHERE true for every row; AND binds before OR', () => {
  const s = S(preset('or-true'));
  assert.equal(s.built, "SELECT * FROM users WHERE name='' OR '1'='1' AND pass='' OR '1'='1'");
  assert.deepEqual(s.returned, [1, 2, 3]);
  assert.equal(s.outcome, 'login');
  assert.equal(s.authenticated, 'admin');
  // in the username alone it is not enough: name='' OR ('1'='1' AND pass='tajna') finds only ana
  assert.deepEqual(S({ user: OR_TRUE, pass: 'tajna' }).returned, [2]);
  assert.deepEqual(S({ user: OR_TRUE, pass: 'x' }).returned, []);
  // in the password field alone it is: (name='ana' AND pass='') OR '1'='1'
  assert.deepEqual(S({ user: 'ana', pass: OR_TRUE }).returned, [1, 2, 3]);
  // a number comparison needs no quote at all once the string is closed
  assert.deepEqual(S({ user: "' OR 1=1 --", pass: 'x' }).returned, [1, 2, 3]);
  assert.equal(S({ user: "' OR NOT 1=1 --", pass: 'x' }).outcome, 'nomatch');
  assert.deepEqual(S({ user: "' OR (1=1) --", pass: 'x' }).returned, [1, 2, 3]);
});

test('rule 3: admin\'-- comments out the password check', () => {
  const s = S(preset('admin-comment'));
  assert.equal(s.built, "SELECT * FROM users WHERE name='admin'--' AND pass='12345'");
  assert.deepEqual(toks(s).slice(-4), ['data:comment:--', "code:comment:' AND pass='", 'data:comment:12345', "code:comment:'"]);
  assert.deepEqual(s.returned, [1]);
  assert.equal(s.authenticated, 'admin');
  assert.equal(S(P({ payload: 'admin-comment', pass: 'anything' })).authenticated, 'admin', 'any password');
  // without the comment the password check holds
  assert.equal(S({ user: 'admin', pass: '12345' }).outcome, 'nomatch');
  assert.equal(S({ user: 'admin', pass: 'Vr4ta!9' }).authenticated, 'admin');
});

test('rule 4: a parameterized query has the same tokens for every input and binds each field as one value', () => {
  const shape = toks(S({ mode: 'param' }));
  assert.ok(shape.every((x) => x.startsWith('code:')));
  assert.deepEqual(shape.filter((x) => x.endsWith(':?')), ['code:param:?', 'code:param:?']);
  for (const [user, pass] of [[OR_TRUE, OR_TRUE], ["admin'--", 'x'], ["'; DROP TABLE users;--", 'x'], ["'", "'"], ['ana', 'tajna']]) {
    const s = S({ mode: 'param', user, pass, role: 'owner' });
    assert.deepEqual(toks(s), shape, user);
    assert.deepEqual(s.values, [user, pass]);
    assert.equal(s.injected, false);
    assert.equal(s.dropped, false);
    assert.equal(s.error, null);
  }
  const f = S(preset('fixed'));
  assert.deepEqual(f.returned, []);
  assert.equal(f.outcome, 'nomatch');
  assert.equal(f.authenticated, null);
  // the value is compared as a whole: a real name and password still log in
  assert.equal(S({ mode: 'param', user: 'ana', pass: 'tajna' }).authenticated, 'ana');
  // the same inputs inject under concatenation
  assert.equal(S(Object.assign({}, preset('fixed'), { mode: 'concat' })).authenticated, 'admin');
});

test('rule 5: escaping quotes is not the fix: a number glued in without quotes needs no quote', () => {
  const input = '0 OR 1=1';
  assert.equal(logic.escapeQuotes(input), input, 'nothing to escape');
  const r = logic.runText(logic.numericQuery(logic.escapeQuotes(input)));
  assert.deepEqual(r.returned, [1, 2, 3]);
  assert.deepEqual(logic.runText(logic.numericQuery('2')).returned, [2]);
  // in a quoted string, escaping does keep the quote inside: that is why it looks like a fix
  const q = S({ user: logic.escapeQuotes(OR_TRUE), pass: 'x' });
  assert.equal(q.injected, false);
  assert.equal(q.outcome, 'nomatch');
});

test('rule 6: least privilege: the login role may not DROP; an owner role loses the table', () => {
  const s = S(preset('stacked'));
  assert.equal(s.built, "SELECT * FROM users WHERE name=''; DROP TABLE users;--' AND pass='tajna'");
  assert.deepEqual(s.statements, [{ kind: 'select', status: 'ran', rows: 0 }, { kind: 'drop', status: 'denied', rows: 0 }]);
  assert.equal(s.error, 'denied');
  assert.equal(s.dropped, false);
  assert.equal(s.outcome, 'error');
  const o = S(Object.assign({}, preset('stacked'), { role: 'owner' }));
  assert.deepEqual(o.statements.map((x) => x.status), ['ran', 'ran']);
  assert.equal(o.dropped, true);
  assert.equal(o.error, null);
  assert.equal(o.outcome, 'nomatch');
  // DELETE is a write too
  const d = S({ role: 'owner', user: "'; DELETE FROM users WHERE name='marko' --", pass: 'x' });
  assert.deepEqual(d.rows.map((r) => r.deleted), [false, false, true]);
  assert.equal(S({ user: "'; DELETE FROM users --", pass: 'x' }).error, 'denied');
  assert.equal(S({ role: 'owner', user: "'; DELETE FROM users --", pass: 'x' }).rows.every((r) => r.deleted), true);
  // a plain login works the same under either role
  assert.equal(S({ role: 'owner' }).authenticated, 'ana');
});

test('tokenizer: origin runs, comments, operators and unknown characters', () => {
  const b = logic.build('concat', { user: 'a', pass: 'b' });
  assert.equal(b.origin.length, b.text.length);
  assert.equal(b.text.length, logic.build('concat', { user: '', pass: '' }).text.length + 2);
  // the tokens put back together are the built text, in every preset
  for (const p of logic.presets) {
    const s = S(p.params);
    assert.equal(s.tokens.map((t) => t.text).join(''), s.built, p.id);
  }
  const lx = logic.lex("a<>b != 'x''y' -- c\nd ? % 12");
  assert.deepEqual(lx.filter((l) => l.role !== 'space').map((l) => l.role),
    ['ident', 'op', 'ident', 'op', 'quote', 'string', 'quote', 'comment', 'ident', 'param', 'other', 'number']);
  assert.equal(lx.find((l) => l.role === 'string').value, "x'y");
  assert.equal(S({ user: "ana' AND pass<>'zz' --", pass: 'x' }).authenticated, 'ana');
  assert.equal(S({ user: '%', pass: 'x' }).injected, false, 'inside the string % is a value');
  assert.equal(S({ user: "' % --", pass: 'x' }).error, 'syntax');
});

test('parser and evaluator edges (fresh review)', () => {
  // a ? typed into concatenated text is no placeholder: syntax error, no crash
  assert.equal(S({ user: "' OR name=? --", pass: 'x' }).error, 'syntax');
  assert.equal(logic.runText('SELECT * FROM users WHERE id=?').error, 'syntax');
  // number against text: a whole-number text converts, anything else is unequal
  assert.deepEqual(S({ user: "' OR '1'=1 --", pass: 'x' }).returned, [1, 2, 3]);
  assert.deepEqual(S({ user: "' OR id='01' --", pass: 'x' }).returned, [1]);
  assert.deepEqual(S({ user: "' OR id='1x' --", pass: 'x' }).returned, []);
  // NOT binds tighter than OR: NOT a OR b is (NOT a) OR b
  assert.deepEqual(S({ user: "' OR NOT 1=1 OR 1=1 --", pass: 'x' }).returned, [1, 2, 3]);
  assert.deepEqual(S({ user: "' OR NOT (1=1 OR 1=1) --", pass: 'x' }).returned, []);
  // keywords in any case
  assert.deepEqual(S({ user: "' or 1=1 --", pass: 'x' }).returned, [1, 2, 3]);
  // leftover tokens after a statement, an unterminated string, an unknown table
  assert.equal(S({ user: "ana' x --", pass: 'x' }).error, 'syntax');
  assert.equal(S({ user: "' SELECT * FROM users --", pass: 'x' }).error, 'syntax', 'a second statement needs a ;');
  assert.equal(S({ user: 'ana', pass: "x' OR name=" }).error, 'syntax');
  assert.equal(logic.runText("SELECT * FROM users WHERE name='ana").error, 'syntax');
  const nope = S({ user: "'; SELECT * FROM nope --", pass: 'x' });
  assert.equal(nope.error, 'table');
  assert.deepEqual(nope.statements.map((x) => x.status), ['ran', 'error']);
  assert.equal(S({ user: "x' OR 1=1; SELECT * FROM nope --", pass: 'x' }).note, 'stacked');
  // empty statements are skipped
  assert.deepEqual(S({ user: "ana' AND pass='tajna';; --", pass: 'x' }).returned, [2]);
  // the first SELECT is read even when it is empty
  const empty = S({ user: "'; SELECT * FROM users --", pass: 'x' });
  assert.deepEqual(empty.statements.map((x) => x.rows), [0, 3]);
  assert.deepEqual(empty.returned, []);
  assert.equal(empty.outcome, 'nomatch');
  // a SELECT after a DELETE sees the rows gone
  const del = S({ role: 'owner', user: "'; DELETE FROM users WHERE id=1; SELECT * FROM users --", pass: 'x' });
  assert.deepEqual(del.statements.map((x) => x.rows), [0, 1, 2]);
  // an error later in the text returns no rows, even when the first SELECT found one
  const err = S({ user: "ana' AND pass='tajna'; DROP TABLE users --", pass: 'x' });
  assert.deepEqual(err.statements.map((x) => [x.rows, x.status]), [[1, 'ran'], [0, 'denied']]);
  assert.deepEqual(err.returned, []);
  assert.equal(err.rows.some((r) => r.returned), false);
  assert.equal(err.outcome, 'error');
  // owner: DROP ran, then the SELECT finds no table; the caption is the stacked case, not a broken query
  const gone = S({ role: 'owner', user: "'; DROP TABLE users; SELECT * FROM users --", pass: 'x' });
  assert.equal(gone.dropped, true);
  assert.equal(gone.error, 'table');
  assert.equal(gone.note, 'stacked');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = S(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, p.id);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P(preset('stacked'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
  // the table constant is not touched by a DELETE or DROP
  S({ role: 'owner', user: "'; DELETE FROM users --", pass: 'x' });
  assert.deepEqual(logic.USERS.map((u) => u.id), [1, 2, 3]);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, and the page has no steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(logic.steps, undefined);
  for (const p of logic.presets) for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
  assert.deepEqual(logic.presets.map((p) => p.id), ['normal', 'or-true', 'admin-comment', 'stacked', 'fixed']);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  for (const e of json.entries || []) assert.ok(logic.presets.some((p) => p.id === e.preset), e.preset);
});
