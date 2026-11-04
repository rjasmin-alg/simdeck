// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-terraform-drift's model (rules: SPEC.md). Run: node --test sims/lnx-terraform-drift/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (script) => at({ script }, logic.steps(P({ script })));
const lines = (s, kind) => s.out.filter((l) => l.kind === kind);
const acts = (s) => lines(s, 'action').map((l) => [l.action, l.addr]);
const summary = (s) => { const l = lines(s, 'summary')[0]; return l ? [l.add, l.change, l.destroy] : null; };
const applied = (s) => { const l = lines(s, 'applied')[0]; return l ? [l.add, l.change, l.destroy] : null; };
const PLAN = [{ op: 'plan', phase: 'refresh' }, { op: 'plan', phase: 'diff' }];
/** Run actions after a state, in order; returns the last state. */
const run = (s, actions) => actions.reduce((x, a) => logic.run(x, a), s);
const applied1 = () => at({}, 1);                                   // every preset starts with apply

// ── tie-breaks first ──

test('rule 8a: plan lists resources in address order, whatever order the configuration declares them in', () => {
  const s = applied1();
  const reversed = Object.assign({}, s, { config: {} });
  ['vm.web', 'firewall_rule.ssh', 'dns_record.www'].forEach((a) => { reversed.config[a] = Object.assign({}, s.config[a]); });
  reversed.config['vm.web'].size = 'large';
  reversed.config['firewall_rule.ssh'].port = 2222;
  reversed.config['dns_record.www'].address = '203.0.113.99';
  const p = run(reversed, PLAN);
  assert.deepEqual(acts(p).map((a) => a[1]), ['dns_record.www', 'firewall_rule.ssh', 'vm.web']);
  assert.deepEqual(logic.diff(reversed.config, logic.refresh(reversed).refreshed).map((x) => x.addr),
    ['dns_record.www', 'firewall_rule.ssh', 'vm.web']);
});

test('rule 8a: apply carries out the plan in address order too', () => {
  const s = last('edit-config');
  assert.deepEqual(lines(s, 'done').map((l) => [l.action, l.addr]),
    [['delete', 'dns_record.www'], ['replace', 'firewall_rule.ssh'], ['update', 'vm.web']]);
});

test('rule 8b: one attribute that forces replacement makes the whole resource -/+, the in-place one rides along', () => {
  const s = applied1();
  const edited = logic.run(s, { op: 'edit', set: { 'vm.web': { size: 'large', image: 'debian-13' } } });
  const p = run(edited, PLAN);
  assert.deepEqual(acts(p), [['replace', 'vm.web']]);
  const diffs = lines(p, 'action')[0].diffs;
  assert.deepEqual(diffs.map((d) => [d.key, d.from, d.to, d.forces]),
    [['size', 'small', 'large', false], ['image', 'debian-12', 'debian-13', true]]);
  assert.deepEqual(summary(p), [1, 0, 1], 'a replacement counts once as add and once as destroy');
  // the in-place attribute alone: ~
  const sizeOnly = run(logic.run(s, { op: 'edit', set: { 'vm.web': { size: 'large' } } }), PLAN);
  assert.deepEqual(acts(sizeOnly), [['update', 'vm.web']]);
  assert.deepEqual(summary(sizeOnly), [0, 1, 0]);
});

test('rule 8b: a replacement gets a new real ID; the old object is gone', () => {
  const s = last('edit-config');
  assert.equal(s.state['firewall_rule.ssh'].id, 'fw-6b0d');
  assert.equal(s.real['fw-21c9'], undefined);
  assert.deepEqual(s.real['fw-6b0d'].attrs, { name: 'ssh', port: 2222 });
  assert.equal(s.state['vm.web'].id, 'vm-7f3a', 'an update in place keeps the ID');
});

test('rule 8c, 8d: rows are managed addresses in order, then hand-made objects by ID; attributes name first', () => {
  const s = run(applied1(), [{ op: 'hand', kind: 'create', type: 'vm', id: 'vm-0001', attrs: { name: 'tmp', size: 'small', image: 'x' } },
    logic.SCRIPTS['hand-create'][1]]);
  assert.deepEqual(logic.rows(s).map((r) => r.addr || r.id),
    ['dns_record.www', 'firewall_rule.ssh', 'vm.web', 'fw-88d4', 'vm-0001']);
  assert.deepEqual(logic.keysOf('vm'), ['name', 'size', 'image']);
  assert.deepEqual(logic.keysOf('firewall_rule'), ['name', 'port']);
  assert.deepEqual(logic.keysOf('dns_record'), ['name', 'address']);
});

// ── rule 1: plan refreshes first, only what state knows, and does not write state ──

test('rule 1: refresh reads every object in state by its ID and notes what changed outside', () => {
  const s3 = at({}, 3);
  assert.deepEqual(lines(s3, 'refreshing').map((l) => [l.addr, l.id]),
    [['dns_record.www', 'dns-5e02'], ['firewall_rule.ssh', 'fw-21c9'], ['vm.web', 'vm-7f3a']]);
  assert.deepEqual(s3.outside, [{ addr: 'vm.web', id: 'vm-7f3a', kind: 'changed',
    diffs: [{ key: 'size', from: 'small', to: 'large', forces: false }] }]);
  assert.equal(lines(s3, 'outsideHead').length, 1);
  assert.equal(lines(s3, 'action').length, 0, 'the refresh phase proposes nothing yet');
  assert.equal(s3.refreshed['vm.web'].attrs.size, 'large');
});

test('rule 1: plan does not write state; the refreshed copy is dropped by the next action', () => {
  const s2 = at({}, 2), s3 = at({}, 3), s4 = at({}, 4);
  assert.deepEqual(s3.state, s2.state);
  assert.deepEqual(s4.state, s2.state);
  assert.equal(s4.state['vm.web'].attrs.size, 'small');
  assert.ok(s4.refreshed, 'the diff phase still shows what refresh read');
  assert.equal(at({}, 5).refreshed, null);
});

test('rule 1: nothing changed outside → no note, every object still read', () => {
  const s = at({ script: 'edit-config' }, 3);
  assert.equal(lines(s, 'refreshing').length, 3);
  assert.equal(lines(s, 'outsideHead').length, 0);
  assert.deepEqual(s.outside, []);
});

// ── rule 2: the diff and its symbols ──

test('rule 2: configuration vs refreshed state gives +, ~, -, -/+ and the summary counts', () => {
  const s = at({ script: 'edit-config' }, 4);
  assert.deepEqual(acts(s), [['delete', 'dns_record.www'], ['replace', 'firewall_rule.ssh'], ['update', 'vm.web']]);
  assert.deepEqual(summary(s), [1, 1, 2]);
  const created = run(applied1(), [{ op: 'edit', add: { 'vm.db': { name: 'db', size: 'small', image: 'debian-12' } } }].concat(PLAN));
  assert.deepEqual(acts(created), [['create', 'vm.db']]);
  assert.deepEqual(lines(created, 'action')[0].diffs.map((d) => [d.key, d.from, d.to]),
    [['name', null, 'db'], ['size', null, 'small'], ['image', null, 'debian-12']]);
});

test('rule 2: configuration equal to refreshed state → No changes, no summary line', () => {
  const s = run(applied1(), PLAN);
  assert.equal(lines(s, 'nochanges').length, 1);
  assert.equal(summary(s), null);
  assert.deepEqual(s.plan, []);
});

test('rule 2: the diff is against state, not against real: a real object the state forgot counts as missing', () => {
  // vm-7f3a is exactly what vm.web declares, but without its state entry plan never reads it
  const s = run(applied1(), [{ op: 'staterm', addr: 'vm.web' }].concat(PLAN));
  assert.deepEqual(acts(s), [['create', 'vm.web']]);
});

// ── rule 3: drift is reverted ──

test('rule 3: drift-revert: plan proposes size "large" -> "small", 0/1/0; apply writes small back, same ID', () => {
  const s4 = at({}, 4), s5 = at({}, 5);
  assert.deepEqual(acts(s4), [['update', 'vm.web']]);
  assert.deepEqual(lines(s4, 'action')[0].diffs, [{ key: 'size', from: 'large', to: 'small', forces: false }]);
  assert.deepEqual(summary(s4), [0, 1, 0]);
  assert.equal(s5.real['vm-7f3a'].attrs.size, 'small');
  assert.equal(s5.state['vm.web'].attrs.size, 'small');
  assert.deepEqual(applied(s5), [0, 1, 0]);
  assert.ok(s5.changed.includes('real:vm-7f3a:size'));
});

// ── rule 4: deleted by hand ──

test('rule 4: hand-delete: refresh drops www, plan proposes + create, 1/0/0; apply creates it with a new ID', () => {
  const s3 = at({ script: 'hand-delete' }, 3), s4 = at({ script: 'hand-delete' }, 4);
  assert.equal(s3.refreshed['dns_record.www'], null);
  assert.deepEqual(s3.outside.map((o) => [o.addr, o.kind]), [['dns_record.www', 'deleted']]);
  assert.ok(s3.state['dns_record.www'], 'plan leaves the stored state alone');
  assert.deepEqual(acts(s4), [['create', 'dns_record.www']]);
  assert.deepEqual(summary(s4), [1, 0, 0]);
  const after = logic.run(s4, { op: 'apply' });
  assert.equal(after.state['dns_record.www'].id, 'dns-91ab');
  assert.deepEqual(after.real['dns-91ab'].attrs, { name: 'www', address: '203.0.113.10' });
  assert.deepEqual(applied(after), [1, 0, 0]);
});

// ── rule 5: created by hand, and import ──

test('rule 5: hand-create: the rule is never read, plan says No changes, the rule stays unmanaged', () => {
  const s3 = at({ script: 'hand-create' }, 3), s4 = last('hand-create');
  assert.ok(!lines(s3, 'refreshing').some((l) => l.id === 'fw-88d4'));
  assert.equal(lines(s4, 'nochanges').length, 1);
  assert.deepEqual(s4.real['fw-88d4'].attrs, { name: 'rdp', port: 3389 });
  assert.ok(!Object.values(s4.state).some((e) => e.id === 'fw-88d4'));
  assert.equal(logic.rows(s4).at(-1).addr, null);
});

test('rule 5: import preset: declared but not imported → + create (1 to add); after import → No changes', () => {
  const s5 = at({ script: 'import' }, 5), s6 = at({ script: 'import' }, 6), s7 = at({ script: 'import' }, 7), s8 = last('import');
  assert.deepEqual(acts(s5), [['create', 'firewall_rule.rdp']]);
  assert.deepEqual(summary(s5), [1, 0, 0]);
  assert.deepEqual(s6.state['firewall_rule.rdp'], { id: 'fw-88d4', attrs: { name: 'rdp', port: 3389 } });
  assert.deepEqual(Object.keys(s6.real).sort(), Object.keys(s5.real).sort(), 'import changes nothing real');
  assert.equal(lines(s7, 'refreshing').length, 4);
  assert.equal(lines(s8, 'nochanges').length, 1);
});

test('rule 5: applying the declared-but-not-imported rule fails on the name, as in rule 6', () => {
  const s = logic.run(at({ script: 'import' }, 5), { op: 'apply' });
  assert.deepEqual(lines(s, 'error').map((l) => [l.addr, l.clash]), [['firewall_rule.rdp', 'fw-88d4']]);
  assert.equal(s.state['firewall_rule.rdp'], undefined);
});

test('rule 5: import refuses without a configuration block, for an address already in state, and for a missing object', () => {
  const s = at({ script: 'hand-create' }, 2);
  const why = (x, a) => lines(logic.run(x, a), 'importError').map((l) => l.why);
  assert.deepEqual(why(s, { op: 'import', addr: 'firewall_rule.rdp', id: 'fw-88d4' }), ['noConfig']);
  assert.deepEqual(why(s, { op: 'import', addr: 'vm.web', id: 'vm-7f3a' }), ['managed']);
  const declared = logic.run(s, { op: 'edit', add: { 'firewall_rule.rdp': { name: 'rdp', port: 3389 } } });
  // like the tool, import does not check that another address already maps to the ID
  assert.deepEqual(why(declared, { op: 'import', addr: 'firewall_rule.rdp', id: 'fw-21c9' }), []);
  const other = logic.run(s, { op: 'hand', kind: 'create', type: 'vm', id: 'vm-0001', attrs: { name: 'x', size: 'small', image: 'debian-12' } });
  const twice = logic.run(other, { op: 'import', addr: 'vm.web', id: 'vm-0001' });
  assert.deepEqual(lines(twice, 'importError').map((l) => l.why), ['managed']);
  assert.equal(twice.state['vm.web'].id, 'vm-7f3a');
  assert.deepEqual(why(declared, { op: 'import', addr: 'firewall_rule.rdp', id: 'fw-9999' }), ['noObject']);
  assert.deepEqual(why(declared, { op: 'import', addr: 'firewall_rule.rdp', id: 'fw-88d4' }), []);
});

// ── rule 6: state is the map ──

test('rule 6: state-lost: state rm touches nothing real; plan proposes + web; apply fails on the name', () => {
  const s1 = at({ script: 'state-lost' }, 1), s2 = at({ script: 'state-lost' }, 2);
  assert.equal(s2.state['vm.web'], undefined);
  assert.deepEqual(s2.real, s1.real);
  const s3 = at({ script: 'state-lost' }, 3);
  assert.deepEqual(lines(s3, 'refreshing').map((l) => l.addr), ['dns_record.www', 'firewall_rule.ssh']);
  const s4 = at({ script: 'state-lost' }, 4);
  assert.deepEqual(acts(s4), [['create', 'vm.web']]);
  assert.deepEqual(summary(s4), [1, 0, 0]);
  const s5 = last('state-lost');
  assert.deepEqual(lines(s5, 'error'), [{ kind: 'error', addr: 'vm.web', type: 'vm', name: 'web', clash: 'vm-7f3a' }]);
  assert.equal(applied(s5), null, 'no "Apply complete" after an error');
  assert.deepEqual(s5.real, s1.real, 'nothing created, nothing duplicated');
  assert.deepEqual(Object.keys(s5.state).sort(), ['dns_record.www', 'firewall_rule.ssh']);
  assert.deepEqual(s5.changed, []);
});

test('rule 6: an error stops only its own resource; the others are still applied', () => {
  const s = run(at({ script: 'state-lost' }, 2), [{ op: 'edit', set: { 'firewall_rule.ssh': { port: 2200 } } }]);
  const a = logic.run(s, { op: 'apply' });
  assert.equal(lines(a, 'error').length, 1);
  assert.equal(a.real[a.state['firewall_rule.ssh'].id].attrs.port, 2200);
});

// ── rule 7: refresh-only ──

test('rule 7: accept-drift: apply -refresh-only writes size large to state, real untouched, 0/0/0', () => {
  const s2 = at({ script: 'accept-drift' }, 2), s3 = at({ script: 'accept-drift' }, 3), s4 = at({ script: 'accept-drift' }, 4);
  assert.equal(s3.state['vm.web'].attrs.size, 'small', 'phase 1 only reads');
  assert.equal(s4.state['vm.web'].attrs.size, 'large');
  assert.deepEqual(s4.real, s2.real);
  assert.deepEqual(applied(s4), [0, 0, 0]);
  assert.ok(s4.changed.includes('state:vm.web:size'));
});

test('rule 7: after accepting, plan sees no outside change, yet still proposes size "large" -> "small"', () => {
  const s5 = at({ script: 'accept-drift' }, 5), s6 = last('accept-drift');
  assert.deepEqual(s5.outside, []);
  assert.deepEqual(acts(s6), [['update', 'vm.web']]);
  assert.deepEqual(lines(s6, 'action')[0].diffs.map((d) => [d.from, d.to]), [['large', 'small']]);
  assert.deepEqual(summary(s6), [0, 1, 0]);
  const fixed = run(s6, [{ op: 'edit', set: { 'vm.web': { size: 'large' } } }].concat(PLAN));
  assert.equal(lines(fixed, 'nochanges').length, 1, 'only the configuration saying large quiets plan');
});

test('rule 7: plan -refresh-only shows the drift, proposes nothing and writes nothing', () => {
  const s2 = at({}, 2);
  const r = run(s2, [{ op: 'planRefreshOnly', phase: 'refresh' }, { op: 'planRefreshOnly', phase: 'diff' }]);
  assert.deepEqual(r.outside.map((o) => o.addr), ['vm.web']);
  assert.deepEqual(r.plan, []);
  assert.equal(lines(r, 'action').length, 0);
  assert.equal(lines(r, 'refreshOnly').length, 1);
  assert.deepEqual(r.state, s2.state);
});

// ── rule 9 and the presets' numbers ──

test('rule 9: the first apply creates all three in address order, with the first IDs, 3/0/0', () => {
  const s = applied1();
  assert.deepEqual(lines(s, 'done').map((l) => [l.addr, l.id]),
    [['dns_record.www', 'dns-5e02'], ['firewall_rule.ssh', 'fw-21c9'], ['vm.web', 'vm-7f3a']]);
  assert.deepEqual(applied(s), [3, 0, 0]);
  for (const [addr, e] of Object.entries(s.state)) assert.deepEqual(e.attrs, s.config[addr]);
  for (const e of Object.values(s.state)) assert.deepEqual(s.real[e.id].attrs, e.attrs);
});

test('rule 9: apply writes the refreshed state: a hand change to an attribute nobody declares differently is kept', () => {
  // the hand value equals what configuration now says, so apply only records it
  const s = run(applied1(), [{ op: 'hand', kind: 'edit', type: 'vm', name: 'web', key: 'size', value: 'large' },
    { op: 'edit', set: { 'vm.web': { size: 'large' } } }, { op: 'apply' }]);
  assert.equal(s.state['vm.web'].attrs.size, 'large');
  assert.deepEqual(applied(s), [0, 0, 0]);
});

test('steps per preset: drift-revert 5, hand-delete 4, hand-create 4, state-lost 5, accept-drift 6, edit-config 5, import 8', () => {
  const n = Object.fromEntries(logic.SCRIPT_IDS.map((id) => [id, logic.steps(P({ script: id }))]));
  assert.deepEqual(n, { 'drift-revert': 5, 'hand-delete': 4, 'hand-create': 4, 'state-lost': 5, 'accept-drift': 6, 'edit-config': 5, import: 8 });
});

test('showState only changes the view, never the model', () => {
  for (const script of logic.SCRIPT_IDS) {
    for (let n = 0; n <= logic.steps(P({ script })); n++) {
      assert.deepEqual(at({ script, showState: false }, n), at({ script }, n));
    }
  }
});

// ── what the page draws: counts, lines, marks and rows (fresh review, t-0232) ──

test('rule 5: import takes the attributes from real; a different declaration then shows as ~', () => {
  const s = run(at({ script: 'import' }, 2), [{ op: 'edit', add: { 'firewall_rule.rdp': { name: 'rdp', port: 3390 } } },
    { op: 'import', addr: 'firewall_rule.rdp', id: 'fw-88d4' }]);
  assert.equal(s.state['firewall_rule.rdp'].attrs.port, 3389);
  const p = run(s, PLAN);
  assert.deepEqual(acts(p), [['replace', 'firewall_rule.rdp']], 'port forces replacement');
  assert.deepEqual(lines(p, 'action')[0].diffs.map((d) => [d.key, d.from, d.to]), [['port', 3389, 3390]]);
});

test('rule 6: a name clash needs the same type; a dns_record named db does not block vm.db', () => {
  const s = run(applied1(), [{ op: 'hand', kind: 'create', type: 'dns_record', id: 'dns-0001', attrs: { name: 'db', address: '198.51.100.1' } },
    { op: 'edit', add: { 'vm.db': { name: 'db', size: 'small', image: 'debian-12' } } }, { op: 'apply' }]);
  assert.equal(lines(s, 'error').length, 0);
  assert.equal(s.state['vm.db'].id, 'vm-2c91');
});

test('rule 6: an error on one resource does not stop a later one (in address order)', () => {
  const s = run(applied1(), [{ op: 'staterm', addr: 'dns_record.www' }, { op: 'edit', set: { 'vm.web': { size: 'medium' } } }, { op: 'apply' }]);
  assert.deepEqual(lines(s, 'error').map((l) => l.addr), ['dns_record.www']);
  assert.equal(s.real['vm-7f3a'].attrs.size, 'medium');
  assert.equal(applied(s), null);
});

test('rule 6: state rm of an address not in state changes nothing and says so', () => {
  const s0 = applied1(), s = logic.run(s0, { op: 'staterm', addr: 'vm.nope' });
  assert.equal(lines(s, 'notInState').length, 1);
  assert.equal(lines(s, 'removed').length, 0);
  assert.deepEqual(s.state, s0.state);
});

test('rule 2: the DNS address changes in place: ~, same ID', () => {
  const s = run(applied1(), [{ op: 'edit', set: { 'dns_record.www': { address: '203.0.113.99' } } }].concat(PLAN));
  assert.deepEqual(acts(s), [['update', 'dns_record.www']]);
  const a = logic.run(s, { op: 'apply' });
  assert.equal(a.state['dns_record.www'].id, 'dns-5e02');
});

test('rule 9: edit-config apply reports 1 added, 1 changed, 2 destroyed; the replacement names its old ID', () => {
  const s = last('edit-config');
  assert.deepEqual(applied(s), [1, 1, 2]);
  assert.deepEqual(lines(s, 'done').filter((l) => l.action === 'replace').map((l) => [l.id, l.old]), [['fw-6b0d', 'fw-21c9']]);
  assert.ok(lines(at({ script: 'state-lost' }, 4), 'action')[0].diffs.every((d) => d.forces === false), 'a create forces nothing');
});

test('refresh counts the objects state knows, not the real ones', () => {
  assert.equal(at({ script: 'hand-create' }, 3).ev[0].read, 3);
  assert.equal(at({ script: 'import' }, 7).ev[0].read, 4);
});

test('the hand-change line names the old and the new value', () => {
  assert.deepEqual(lines(at({}, 2), 'hand')[0], { kind: 'hand', what: 'edit', id: 'vm-7f3a', key: 'size', from: 'small', to: 'large' });
});

test('changed marks: exactly what each step wrote', () => {
  assert.deepEqual(at({}, 2).changed, ['real:vm-7f3a:size']);
  assert.deepEqual(at({}, 3).changed, ['fresh:vm.web']);
  assert.deepEqual(at({}, 4).changed, ['plan:vm.web']);
  assert.deepEqual(at({ script: 'state-lost' }, 2).changed, ['state:vm.web']);
  assert.deepEqual(at({ script: 'hand-delete' }, 2).changed, ['gone:dns-5e02']);
  assert.deepEqual(at({ script: 'hand-delete' }, 3).changed, ['fresh:dns_record.www']);
});

test('rows: an address removed this step keeps one last row; a vanished object leaves its ID in state only', () => {
  const r5 = logic.rows(last('edit-config'));
  assert.deepEqual(r5.find((r) => r.addr === 'dns_record.www'), { addr: 'dns_record.www', type: 'dns_record', id: null, stateId: null });
  assert.deepEqual(logic.rows(at({ script: 'hand-delete' }, 2))[0], { addr: 'dns_record.www', type: 'dns_record', id: null, stateId: 'dns-5e02' });
});

// ── generic checks every sim keeps ──

const ALL = logic.SCRIPT_IDS.flatMap((script) => [true, false].map((showState) => ({ script, showState })));

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over), n0 = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= n0; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = n0; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of ALL) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and meta.steps matches the defaults', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/script: '([\w-]+)'/g)].map((m) => m[1]);
  assert.ok(ids.length >= 7);
  for (const id of ids) assert.ok(logic.SCRIPTS[id], `scenario ${id} exists`);
});
