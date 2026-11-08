// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-exceptions. Run: node --test sims/cmp-exceptions/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order (the lifecycle and scoring in
// exceptions.js, then the page's model in sim.js), the presets, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const X = require('./exceptions.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
/** A request with defaults: granted at 0, fix 4 months, owner and control, l 3, i 3, never replaced. */
const R = (over) => Object.assign({ g: 0, sys: 0, why: 0, f: 4, owner: true, ctl: true, l: 3, i: 3, rep: null }, over);

// ── tie-breaks first ──

test('rule 2: a score equal to the appetite is within it (the owner signs); one above goes to the board', () => {
  // l 3 with a control → 2; 2 × 4 = 8 = appetite
  assert.equal(X.granted(R({ l: 3, i: 4 }), true).score, 8);
  assert.equal(X.granted(R({ l: 3, i: 4 }), true).signer, 'owner');
  assert.equal(X.granted(R({ l: 3, i: 3, ctl: false }), false).score, 9);
  assert.equal(X.granted(R({ l: 3, i: 3, ctl: false }), false).signer, 'board');
  assert.equal(X.above(8, 8), false);
  assert.equal(X.above(9, 8), true);
  assert.equal(X.signer('avoid', 25, 8), 'avoided');
});

test('rule 3: a replacement in the same month as the fix counts as fixed; one month earlier as replaced', () => {
  // review, E 3, f 4: fix at 0 + ⌈4/3⌉·3 = 6
  assert.deepEqual(X.closes(R({ rep: 6 }), 3, 'review', true), { at: 6, why: 'fixed' });
  assert.deepEqual(X.closes(R({ rep: 5 }), 3, 'review', true), { at: 5, why: 'replaced' });
  assert.deepEqual(X.closes(R({ rep: 7 }), 3, 'review', true), { at: 6, why: 'fixed' });
});

test('rule 3: a fix exactly as long as the period is done at the first review', () => {
  assert.deepEqual(X.closes(R({ f: 6 }), 6, 'review', true), { at: 6, why: 'fixed' });
  assert.deepEqual(X.closes(R({ f: 7 }), 6, 'review', true), { at: 12, why: 'fixed' });
  assert.deepEqual(X.closes(R({ f: 1, g: 5 }), 12, 'review', true), { at: 17, why: 'fixed' });
});

test('rule 4: closed at m means meets the standard at m; granted at m means open at m', () => {
  const r = R({ g: 2 });
  const c = X.closes(r, 3, 'review', true); // 2 + 6 = 8
  assert.equal(c.at, 8);
  assert.equal(X.isOpen(r, c, 1), false);
  assert.equal(X.isOpen(r, c, 2), true);
  assert.equal(X.isOpen(r, c, 7), true);
  assert.equal(X.isOpen(r, c, 8), false);
});

test('rule 5: at exactly g + E the first period is over', () => {
  const r = R({ g: 1, f: 20 });
  assert.equal(X.status(r, 6, 'nothing', true, 6), 'valid');
  assert.equal(X.status(r, 6, 'nothing', true, 7), 'expired');
  assert.equal(X.status(r, 6, 'renew', true, 7), 'renewed');
  assert.equal(X.status(r, 6, 'review', true, 12), 'renewed');
  assert.equal(X.status(r, 6, 'review', true, 13), 'escalated');
});

test('rule 7: the oldest on a tie is the first in the list; exactly 12 months counts as older than a year', () => {
  const list = [R({ g: 3, sys: 0 }), R({ g: 0, sys: 1 }), R({ g: 0, sys: 2 })];
  const e = X.estate(list, 5, 0, 'nothing', true, 12);
  assert.deepEqual(e.oldest, { idx: 1, age: 12 });
  assert.equal(e.year, 2);
  assert.equal(X.estate(list, 5, 0, 'nothing', true, 11).year, 0);
});

test('rule 6: a review only happens while the exception is open (replaced at the review month: none)', () => {
  // E 3, f 10 → fix at 12; replaced at 3 = first review month: no renewal
  const r = R({ f: 10, rep: 3 });
  assert.deepEqual(X.reviews([r], 3, 'review', true, 24), { fixed: 0, renewed: 0, escalated: 0, noOwner: 0 });
  const r2 = R({ f: 10, rep: 4 });
  assert.deepEqual(X.reviews([r2], 3, 'review', true, 24), { fixed: 0, renewed: 1, escalated: 0, noOwner: 0 });
  const r3 = R({ f: 10, rep: 7 });
  assert.deepEqual(X.reviews([r3], 3, 'review', true, 24), { fixed: 0, renewed: 1, escalated: 1, noOwner: 0 });
});

// ── rules ──

test('rule 1: expiry 0 is "none" whatever happens at expiry; otherwise the mode, unknown modes are nothing', () => {
  assert.equal(X.regime(0, 'review'), 'none');
  assert.equal(X.regime(0, 'renew'), 'none');
  assert.equal(X.regime(6, 'review'), 'review');
  assert.equal(X.regime(6, 'renew'), 'renew');
  assert.equal(X.regime(6, 'nothing'), 'nothing');
  assert.equal(X.regime(6, 'bogus'), 'nothing');
});

test('rule 2: complete gives an owner and a control; otherwise what the request named; a control lowers l by 1, not below 1', () => {
  const r = R({ owner: false, ctl: false, l: 4, i: 5 });
  assert.deepEqual(X.granted(r, true), { owner: true, ctl: true, l: 3, i: 5, score: 15, signer: 'board' });
  assert.deepEqual(X.granted(r, false), { owner: false, ctl: false, l: 4, i: 5, score: 20, signer: 'board' });
  assert.equal(X.granted(R({ l: 1, i: 5 }), true).l, 1);
  assert.equal(X.granted(R({ l: 2, i: 2 }), false).l, 1);
});

test('rule 3: only review fixes; without an owner the work starts at the first review', () => {
  for (const [E, mode] of [[0, 'review'], [6, 'nothing'], [6, 'renew']]) {
    assert.deepEqual(X.closes(R({ f: 1 }), E, mode, true), { at: null, why: null }, `${E} ${mode}`);
    assert.deepEqual(X.closes(R({ f: 1, rep: 9 }), E, mode, true), { at: 9, why: 'replaced' }, `${E} ${mode}`);
  }
  // owner: 2 + ⌈5/3⌉·3 = 8; no owner: 2 + 3 + 6 = 11
  assert.deepEqual(X.closes(R({ g: 2, f: 5 }), 3, 'review', true), { at: 8, why: 'fixed' });
  assert.deepEqual(X.closes(R({ g: 2, f: 5, owner: false }), 3, 'review', false), { at: 11, why: 'fixed' });
  // complete on: the missing owner is supplied
  assert.deepEqual(X.closes(R({ g: 2, f: 5, owner: false }), 3, 'review', true), { at: 8, why: 'fixed' });
});

test('rule 5: the status under each regime; with no owner escalated from the first review; null when closed', () => {
  const r = R({ f: 30 });
  assert.equal(X.status(r, 0, 'review', true, 20), 'open');
  assert.equal(X.status(r, 6, 'review', true, 5), 'valid');
  assert.equal(X.status(r, 6, 'review', true, 11), 'renewed');
  assert.equal(X.status(r, 6, 'review', true, 12), 'escalated');
  assert.equal(X.status(r, 6, 'renew', true, 20), 'renewed');
  assert.equal(X.status(r, 6, 'nothing', true, 20), 'expired');
  const n = R({ f: 30, owner: false });
  assert.equal(X.status(n, 6, 'review', false, 6), 'escalated');
  assert.equal(X.status(n, 6, 'review', true, 6), 'renewed');
  assert.equal(X.status(R({ f: 2 }), 6, 'review', true, 6), null);
  assert.equal(X.status(R({ g: 5 }), 6, 'review', true, 4), null);
});

test('rule 6: reviews count each exception once in each; no owner is escalated at the first review', () => {
  const list = [
    R({ f: 2 }),                    // fixed at 6
    R({ f: 9 }),                    // renewed at 6, fixed at 12
    R({ f: 15 }),                   // renewed 6, escalated 12, fixed 18
    R({ f: 2, owner: false })       // escalated at 6, fixed at 12
  ];
  assert.deepEqual(X.reviews(list, 6, 'review', false, 24), { fixed: 4, renewed: 2, escalated: 2, noOwner: 1 });
  assert.deepEqual(X.reviews(list, 6, 'review', false, 11), { fixed: 1, renewed: 2, escalated: 1, noOwner: 1 });
  assert.deepEqual(X.reviews(list, 6, 'review', false, 5), { fixed: 0, renewed: 0, escalated: 0, noOwner: 0 });
  assert.deepEqual(X.reviews(list, 6, 'renew', false, 24), { fixed: 0, renewed: 0, escalated: 0, noOwner: 0 });
  assert.deepEqual(X.reviews(list, 0, 'review', false, 24), { fixed: 0, renewed: 0, escalated: 0, noOwner: 0 });
});

test('rule 7: the estate counts: meets, by status, no control, no owner, board, replaced', () => {
  const list = [
    R({ sys: 0, ctl: false, l: 4, i: 4 }),        // 16, board
    R({ sys: 1, owner: false, l: 2, i: 2 }),      // 4, owner
    R({ sys: 2, g: 3, rep: 5 }),                  // replaced at 5
    R({ sys: 3, g: 9 })                           // not granted yet at 8
  ];
  const e = X.estate(list, 10, 0, 'nothing', false, 8);
  assert.equal(e.open, 2);
  assert.equal(e.meets, 8);
  assert.equal(e.share, 0.8);
  assert.equal(e.by.open, 2);
  assert.equal(e.noCtl, 1);
  assert.equal(e.noOwner, 1);
  assert.equal(e.board, 1);
  assert.equal(e.replaced, 1);
  assert.equal(e.items[2].st, null);
  assert.equal(e.items[3].st, null);
  assert.equal(e.items[0].age, 8);
});

test('rule 8: 36 requests at ⌊24k/36⌋ on 36 different systems of 48; 24 owners, 15 controls, 4 replacements', () => {
  const Q = logic.REQUESTS;
  assert.equal(logic.SYSTEMS, 48);
  assert.equal(Q.length, 36);
  Q.forEach((r, k) => assert.equal(r.g, Math.floor(24 * k / 36)));
  assert.equal(new Set(Q.map((r) => r.sys)).size, 36);
  assert.ok(Q.every((r) => r.sys >= 0 && r.sys < 48));
  assert.equal(Q.filter((r) => r.owner).length, 24);
  assert.equal(Q.filter((r) => r.ctl).length, 15);
  assert.deepEqual(Q.filter((r) => r.rep !== null).map((r) => r.rep).sort((a, b) => a - b), [11, 13, 20, 24]);
});

test('rule 9: the comparison uses the chosen end date or 6, the chosen completeness, the chosen month', () => {
  const s = S({ expiry: 12, atExpiry: 'review', month: 24 });
  assert.equal(s.cmpExpiry, 12);
  assert.deepEqual(s.compare.map((c) => c.rg), ['none', 'nothing', 'renew', 'review']);
  assert.equal(s.compare[3].meets, s.meets);
  assert.equal(S({}).cmpExpiry, 6);
  assert.deepEqual(S({}).compare.map((c) => c.meets), [16, 16, 16, 37]);
  assert.deepEqual(S({ complete: false }).compare.map((c) => c.meets), [16, 16, 16, 34]);
  assert.deepEqual(S({ month: 12 }).compare.map((c) => c.meets), [29, 29, 29, 35]);
  // the history runs 0…24 and matches the estate at the chosen month
  assert.equal(s.history.length, 25);
  assert.equal(s.history[24].open, s.open);
  assert.equal(S({ month: 6 }).history[6].open, S({ month: 6 }).open);
});

test('rule 10: params are normalised', () => {
  assert.deepEqual(logic.normalise({ expiry: '6', atExpiry: 'review', complete: '0', month: '7.6' }),
    { expiry: 6, atExpiry: 'review', complete: false, month: 8 });
  assert.deepEqual(logic.normalise({ expiry: 5, atExpiry: 'later', complete: 'maybe', month: 99 }),
    { expiry: 0, atExpiry: 'nothing', complete: true, month: 24 });
  assert.equal(logic.normalise({ month: -3 }).month, 0);
  assert.equal(logic.normalise({ month: '' }).month, 24);
  assert.equal(logic.normalise({ month: Infinity }).month, 24);
});

test('rule 11: caption notes in order: grace, no owner, no control, pile', () => {
  assert.deepEqual(logic.captionKey(S({ expiry: 12, atExpiry: 'review', complete: false })).notes, ['nSlack']);
  assert.deepEqual(logic.captionKey(S({ expiry: 6, atExpiry: 'review', complete: false })).notes, ['nOwner']);
  assert.deepEqual(logic.captionKey(S({ complete: false })).notes, ['nCtl']);
  assert.deepEqual(logic.captionKey(S({})).notes, ['nPile']);
  assert.deepEqual(logic.captionKey(S({ expiry: 6, atExpiry: 'review' })).notes, []);
  // the pile needs 12 open: 11 at month 24 under review is not a pile; month 4 with no end date has 8 open
  assert.equal(S({ expiry: 6, atExpiry: 'review' }).open, 11);
  assert.deepEqual(logic.captionKey(S({ month: 4 })).notes, []);
  assert.deepEqual(['capNone', 'capNothing', 'capRenew', 'capReview'],
    [S({}), S({ expiry: 3 }), S({ expiry: 3, atExpiry: 'renew' }), S({ expiry: 3, atExpiry: 'review' })].map((s) => logic.captionKey(s).key));
});

// ── presets ──

test('presets: the table in SPEC.md', () => {
  const row = (id) => {
    const s = logic.compute(preset(id));
    const by = Object.fromEntries(Object.entries(s.by).filter(([, v]) => v));
    return [s.meets, Math.round(s.share * 1000) / 10, s.oldest.age, s.oldest.idx, s.year, by,
      [s.reviews.fixed, s.reviews.renewed, s.reviews.escalated, s.reviews.noOwner], s.noCtl, s.noOwner, s.board,
      s.replaced, logic.captionKey(s).notes];
  };
  assert.deepEqual(row('open-ended'), [16, 33.3, 24, 0, 16, { open: 32 }, [0, 0, 0, 0], 0, 0, 15, 4, ['nPile']]);
  assert.deepEqual(row('date-only'), [16, 33.3, 24, 0, 16, { valid: 7, expired: 25 }, [0, 0, 0, 0], 0, 0, 15, 4, ['nPile']]);
  assert.deepEqual(row('auto-renew'), [16, 33.3, 24, 0, 16, { valid: 7, renewed: 25 }, [0, 0, 0, 0], 0, 0, 15, 4, ['nPile']]);
  assert.deepEqual(row('review'), [37, 77.1, 10, 21, 0, { valid: 7, renewed: 4 }, [23, 10, 1, 0], 0, 0, 6, 2, []]);
  assert.deepEqual(row('incomplete'), [34, 70.8, 14, 15, 1, { valid: 7, renewed: 2, escalated: 5 }, [20, 6, 10, 9], 8, 7, 11, 2, ['nOwner']]);
  assert.deepEqual(row('yearly'), [31, 64.6, 19, 8, 1, { valid: 16, renewed: 1 }, [16, 1, 0, 0], 0, 0, 9, 3, ['nSlack']]);
});

test('month by month: no end date against review at 6 months (SPEC)', () => {
  assert.deepEqual([6, 12, 18].map((m) => S({ month: m }).meets), [37, 29, 21]);
  assert.deepEqual([6, 12, 18].map((m) => S({ month: m, expiry: 6, atExpiry: 'review' }).meets), [39, 35, 36]);
});

test('tiles: one per system; an open exception sits on its system, the rest are null', () => {
  const s = S({});
  assert.equal(s.tiles.length, 48);
  assert.equal(s.tiles.filter(Boolean).length, s.open);
  for (const x of s.tiles.filter(Boolean)) assert.equal(logic.REQUESTS[x.idx].sys, s.tiles.indexOf(x));
  assert.equal(s.oldest.sys, logic.REQUESTS[0].sys);
});

test('the defaults are preset 1; every preset is already normal', () => {
  assert.deepEqual(logic.defaults, preset('open-ended'));
  for (const x of logic.presets) assert.deepEqual(logic.normalise(x.params), x.params, x.id);
});

// ── added after the fresh review (mutants that survived) ──
test('rule 7: replaced counts only replacements at or before m', () => {
  assert.equal(S({ month: 12 }).replaced, 1);
});
test('rule 11: no-owner note needs an escalation, not just an open exception without an owner', () => {
  assert.deepEqual(logic.captionKey(S({ expiry: 6, atExpiry: 'review', complete: false, month: 2 })).notes, ['nCtl']);
});
test('rule 11: pile at exactly 12 open', () => {
  assert.equal(S({ month: 7 }).open, 12);
  assert.deepEqual(logic.captionKey(S({ month: 7 })).notes, ['nPile']);
});
test('rule 10: normalise edge cases', () => {
  assert.equal(logic.normalise({ month: '  ' }).month, 24);
  assert.equal(logic.normalise({ month: null }).month, 24);
  assert.equal(logic.normalise({ month: -Infinity }).month, 24);
  assert.equal(logic.normalise({ complete: 0 }).complete, false);
  assert.equal(logic.normalise({ complete: null }).complete, true);
  assert.equal(logic.normalise({ expiry: '06' }).expiry, 0);
  assert.equal(logic.normalise({ expiry: 9 }).expiry, 0);
});
test('rules 7, 9: oldest carries its own reason; history by-status per month', () => {
  assert.equal(S({ expiry: 6, atExpiry: 'review' }).oldest.why, logic.REQUESTS[21].why);
  const s = S({ expiry: 6 });
  for (const h of s.history) assert.deepEqual(h.by, X.estate(logic.REQUESTS, 48, 6, 'nothing', true, h.m).by);
});
test('rule 11: captionKey grace note needs something open (synthetic)', () => {
  assert.deepEqual(logic.captionKey({ regime: 'review', p: { expiry: 12 }, open: 0, reviews: { noOwner: 0 }, noCtl: 0 }).notes, []);
  assert.deepEqual(logic.captionKey({ regime: 'none', p: { expiry: 0 }, open: 1, reviews: { noOwner: 0 }, noCtl: 1 }).notes, ['nCtl']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('incomplete'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, caption and reason has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="exceptions\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['capNone', 'capNothing', 'capRenew', 'capReview', 'nSlack', 'nOwner', 'nCtl', 'nPile'];
  for (const lang of ['hr', 'en']) {
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const r of logic.REQUESTS) assert.ok(strings[lang]['why' + r.why], `${lang} why${r.why}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: open-ended → pOpenEnded. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
