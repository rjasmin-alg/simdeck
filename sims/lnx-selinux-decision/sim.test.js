// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-selinux-decision's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
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
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const end = (p) => at(p, steps(p));
const all = (p) => Array.from({ length: steps(p) + 1 }, (_, n) => at(p, n));
const phases = (p) => all(p).map((s) => s.phase);
const outcomes = (p) => all(p).filter((s) => s.phase === 'outcome').map((s) => s.outcome);
const typeOfObj = (s) => logic.typeOf(s.obj.tcontext);

// ── tie-breaks ──

test('tie-break (rule 2): DAC refuses first, so the policy is never asked and nothing is logged', () => {
  const p = P({ scene: 'secret', dacOk: false });
  assert.deepEqual(phases(p), ['start', 'attempt', 'dac', 'outcome']);
  const e = end(p);
  assert.equal(e.dac, false);
  assert.equal(e.mac, null, 'the policy was not consulted');
  assert.equal(e.macAt, null);
  assert.equal(e.enforced, null, 'the mode was not consulted');
  assert.deepEqual(e.audit, [], 'no AVC');
  assert.equal(e.outcome, 'denied');
  assert.equal(e.seen, 'denied');
  assert.deepEqual(e.dacWhy, { cls: 'other', bits: '---', need: 'r', ok: false });
});

test('tie-break (rule 2): the policy would allow this access, and permissive mode does not help either', () => {
  // the same file with the read bit for "other" is allowed by row 4, so only DAC refused above
  const ok = end(P({ scene: 'secret', dacOk: true }));
  assert.equal(ok.mac, true);
  assert.equal(ok.macAt, 3);
  assert.equal(ok.outcome, 'allowed');
  // MAC can only take away: permissive mode does not grant what DAC refused (rule 1)
  const perm = end(P({ scene: 'secret', dacOk: false, mode: 'permissive' }));
  assert.equal(perm.outcome, 'denied');
  assert.deepEqual(perm.audit, []);
  assert.deepEqual(outcomes(P({ scene: 'secret', dacOk: false, fix: 'setenforce' })), ['denied', 'denied', 'denied']);
  assert.deepEqual(end(P({ scene: 'secret', dacOk: false, fix: 'setenforce' })).audit, []);
});

test('tie-break (rule 5): the mode never changes which access the policy denies, only whether it is enforced', () => {
  for (const scene of ['port', 'keys']) {
    const enf = all(P({ scene })).find((s) => s.phase === 'mac');
    const per = all(P({ scene, mode: 'permissive' })).find((s) => s.phase === 'mac');
    assert.equal(enf.mac, false, scene);
    assert.equal(per.mac, false, scene);
    assert.equal(enf.macAt, per.macAt, scene);
  }
  // after setenforce 0 the same lookup gives the same "no"
  const fr = all(P({ fix: 'setenforce' })).filter((s) => s.phase === 'mac');
  assert.deepEqual(fr.map((s) => [s.mac, s.macAt, s.mode]), [[false, 4, 'enforcing'], [false, 4, 'permissive'], [false, 4, 'enforcing']]);
});

test('tie-break (rule 5): permissive lets the access through, and the same denial is still logged with permissive=1', () => {
  const e = end(P({ mode: 'permissive' }));
  assert.equal(e.enforced, false);
  assert.equal(e.outcome, 'allowed');
  assert.deepEqual(e.listening, [8991, 22]);
  assert.equal(e.audit.length, 1);
  assert.equal(e.audit[0].permissive, 1);
  assert.equal(e.audit[0].perm, 'name_bind');
  assert.equal(e.portLabels[8991], 'unreserved_port_t', 'the label table is unchanged');
  const enf = end(P({}));
  assert.equal(enf.enforced, true);
  assert.equal(enf.outcome, 'denied');
  assert.equal(enf.audit[0].permissive, 0);
  assert.deepEqual(Object.assign({}, enf.audit[0], { permissive: 1 }), e.audit[0], 'the same record but for permissive=');
});

test('tie-break (rule 8): setenforce changes the current mode only; a reboot returns to the config file\'s mode', () => {
  const p = P({ fix: 'setenforce', undo: 'reboot' });
  const fr = all(p);
  const off = fr.find((s) => s.action === 'setenforce0');
  assert.equal(off.mode, 'permissive');
  assert.equal(off.configMode, 'enforcing', 'the boot mode stays');
  assert.deepEqual(off.changed, ['mode']);
  const boot = fr.find((s) => s.action === 'reboot');
  assert.equal(boot.mode, 'enforcing');
  assert.deepEqual(boot.changed, ['mode']);
  assert.deepEqual(outcomes(p), ['denied', 'allowed', 'denied']);
  // the attempt after a boot types nothing: sshd starts by itself
  assert.equal(fr[fr.indexOf(boot) + 1].cmd, null);
  // setenforce 1 gives the same result as the reboot
  assert.deepEqual(outcomes(P({ fix: 'setenforce', undo: 'setenforce1' })), outcomes(p));
  assert.equal(all(P({ fix: 'setenforce' })).find((s) => s.action === 'setenforce1').cmd, 'sudo setenforce 1');
  // setenforce 0 when already permissive changes nothing
  const already = all(P({ fix: 'setenforce', mode: 'permissive' })).find((s) => s.action === 'setenforce0');
  assert.deepEqual(already.changed, []);
});

// ── rules ──

test('rule 1: DAC first, then MAC, then the mode; both checks must say yes', () => {
  assert.deepEqual(phases(P({})), ['start', 'attempt', 'dac', 'mac', 'mode', 'outcome']);
  const s = at(P({}), 2);
  assert.equal(s.dac, true);
  assert.equal(s.mac, null, 'the policy is asked only in the next step');
  assert.deepEqual(end(P({})).outcome, 'denied', 'DAC yes, MAC no → denied');
  assert.deepEqual(phases(P({ scene: 'secret' })), ['start', 'attempt', 'dac', 'mac', 'outcome'], 'MAC yes: the mode is not asked');
  assert.equal(end(P({ scene: 'secret' })).enforced, null);
});

test('rule 1: MAC can only take away: a yes from the policy never grants what DAC refused', () => {
  assert.equal(logic.decide(false, true, null), 'denied');
  assert.equal(logic.decide(false, null, false), 'denied', 'permissive does not grant it either');
  assert.equal(logic.decide(true, true, null), 'allowed');
  assert.equal(logic.decide(true, false, null), 'denied', 'a policy no with the mode not yet asked is not a yes');
  assert.equal(logic.decide(true, false, true), 'denied');
  assert.equal(logic.decide(true, false, false), 'allowed', 'permissive: the policy\'s no is not enforced');
});

test('rule 1: the permission check reads the owner, group or other triplet and needs r', () => {
  const f = { owner: 1000, group: 1000, mode: 'rw-------' };
  assert.deepEqual(logic.dacCheck(f, 1000, 'r'), { cls: 'owner', bits: 'rw-', need: 'r', ok: true });
  assert.deepEqual(logic.dacCheck({ owner: 1001, group: 1000, mode: 'rw-r-----' }, 1000, 'r'), { cls: 'group', bits: 'r--', need: 'r', ok: true });
  assert.deepEqual(logic.dacCheck({ owner: 1001, group: 1001, mode: 'rw-r--r--' }, 1000, 'r'), { cls: 'other', bits: 'r--', need: 'r', ok: true });
  assert.equal(logic.dacCheck({ owner: 1000, group: 1000, mode: '-w-r--r--' }, 1000, 'r').ok, false, 'the owner\'s triplet applies even when other has r');
  assert.deepEqual(logic.dacPort(8991), { cls: 'port', port: 8991, ok: true });
  assert.equal(logic.dacPort(80).ok, false);
  assert.equal(logic.dacCheck({ owner: 1001, group: 1001, mode: 'rw-r-----' }, 1000, 'r').ok, false, 'other\'s triplet, not the group\'s');
  assert.equal(logic.dacPort(1024).ok, true);
  assert.equal(logic.dacPort(1023).ok, false);
  assert.deepEqual(at(P({ scene: 'keys' }), 4).dacWhy, { cls: 'owner', bits: 'rw-', need: 'r', ok: true });
});

test('rule 3: the decision uses only the type field of the contexts', () => {
  assert.equal(logic.typeOf(logic.CTX_SSHD), 'sshd_t');
  assert.equal(logic.typeOf('system_u:object_r:unreserved_port_t:s0'), 'unreserved_port_t');
  assert.equal(logic.typeOf(logic.CTX_USER), 'unconfined_t');
  const req = { src: 'sshd_t', tgt: 'ssh_port_t', tclass: 'tcp_socket', perm: 'name_bind' };
  assert.equal(logic.lookup(logic.POLICY, req).at, 0);
  // keys: the file's user part is unconfined_u, not system_u, and it is still allowed once the type is right
  const e = end(P({ scene: 'keys', fix: 'relabel' }));
  assert.equal(e.obj.tcontext, 'unconfined_u:object_r:ssh_home_t:s0');
  assert.equal(e.macAt, 1);
  assert.equal(e.outcome, 'allowed');
});

test('rule 4: the port\'s type comes from the label table; semanage port -a changes the table, nothing else', () => {
  const s0 = at(P({}), 0);
  assert.deepEqual(s0.portLabels, { 22: 'ssh_port_t', 8991: 'unreserved_port_t' });
  assert.equal(s0.obj.tcontext, 'system_u:object_r:unreserved_port_t:s0');
  const p = P({ fix: 'relabel' });
  const fix = all(p).find((s) => s.action === 'semanage');
  assert.equal(fix.cmd, 'sudo semanage port -a -t ssh_port_t -p tcp 8991');
  assert.deepEqual(fix.portLabels, { 22: 'ssh_port_t', 8991: 'ssh_port_t' });
  assert.equal(fix.obj.tcontext, 'system_u:object_r:ssh_port_t:s0');
  assert.deepEqual(fix.changed, ['port:8991']);
  assert.equal(fix.mode, 'enforcing');
  assert.deepEqual(fix.policy, logic.POLICY, 'the allow rules are not changed');
  const e = end(p);
  assert.equal(e.macAt, 0);
  assert.equal(e.outcome, 'allowed');
  assert.deepEqual(e.listening, [8991, 22]);
});

test('rule 6: the AVC record has denied { perm }, comm, scontext, tcontext, tclass, src= or name=, permissive=', () => {
  assert.deepEqual(end(P({})).audit, [{
    perm: 'name_bind', comm: 'sshd', scontext: 'system_u:system_r:sshd_t:s0-s0:c0.c1023',
    tcontext: 'system_u:object_r:unreserved_port_t:s0', tclass: 'tcp_socket', permissive: 0, src: 8991
  }]);
  assert.deepEqual(end(P({ scene: 'keys' })).audit, [{
    perm: 'read', comm: 'sshd', scontext: 'system_u:system_r:sshd_t:s0-s0:c0.c1023',
    tcontext: 'unconfined_u:object_r:user_tmp_t:s0', tclass: 'file', permissive: 0, name: 'authorized_keys'
  }]);
  // the record is written at the mode step, not before
  assert.deepEqual(at(P({}), 3).audit, []);
  assert.equal(at(P({}), 4).audit.length, 1);
  assert.deepEqual(at(P({}), 4).changed, ['mode-gate', 'audit']);
});

test('rule 7: cp makes a new inode labelled for /tmp; mv keeps that label under the old name', () => {
  const p = P({ scene: 'keys' });
  const s0 = at(p, 0);
  assert.deepEqual(s0.files.map((f) => [f.inode, f.path, logic.typeOf(f.tcontext)]), [[1, '~/.ssh/authorized_keys', 'ssh_home_t']]);
  const cp = at(p, 1);
  assert.equal(cp.action, 'cp');
  assert.equal(cp.cmd, 'cp ~/.ssh/authorized_keys /tmp/ak');
  assert.deepEqual(cp.files.map((f) => [f.inode, f.path, logic.typeOf(f.tcontext)]),
    [[1, '~/.ssh/authorized_keys', 'ssh_home_t'], [2, '/tmp/ak', 'user_tmp_t']]);
  assert.deepEqual(cp.changed, ['file:2']);
  const mv = at(p, 2);
  assert.equal(mv.cmd, 'mv /tmp/ak ~/.ssh/authorized_keys');
  assert.deepEqual(mv.files.map((f) => [f.inode, f.path, logic.typeOf(f.tcontext)]), [[2, '~/.ssh/authorized_keys', 'user_tmp_t']]);
  assert.equal(typeOfObj(mv), 'user_tmp_t');
  assert.equal(mv.obj.mode, 'rw-------', 'ls -l shows nothing unusual');
  assert.equal(end(p).outcome, 'denied');
  assert.equal(end(p).macAt, logic.POLICY.length, 'no rule for sshd_t user_tmp_t:file read');
});

test('rule 7: restorecon resets the type to the default for the path, and only the type', () => {
  const p = P({ scene: 'keys', fix: 'relabel' });
  const r = all(p).find((s) => s.action === 'restorecon');
  assert.equal(r.cmd, 'restorecon -v ~/.ssh/authorized_keys');
  assert.equal(r.obj.tcontext, 'unconfined_u:object_r:ssh_home_t:s0');
  assert.equal(r.obj.inode, 2, 'the same inode, relabelled');
  assert.deepEqual(r.changed, ['file:2:type']);
  assert.deepEqual(outcomes(p), ['denied', 'allowed']);
  assert.equal(end(p).seen, 'ok');
  // a file that already has its default label: restorecon changes nothing, and a DAC denial stays
  const q = P({ scene: 'secret', dacOk: false, fix: 'relabel' });
  const rq = all(q).find((s) => s.action === 'restorecon');
  assert.deepEqual(rq.changed, []);
  assert.equal(rq.cmd, 'sudo restorecon -v /tmp/plan.txt');
  assert.deepEqual(outcomes(q), ['denied', 'denied']);
  assert.equal(logic.defaultType('~/.ssh/x'), 'ssh_home_t');
  assert.equal(logic.defaultType('/tmp/x'), 'user_tmp_t');
  assert.equal(logic.defaultType('~/x'), 'user_home_t');
});

test('rule 9: the policy is read top down; the first matching row allows, no row denies', () => {
  const lk = logic.lookup(logic.POLICY, { src: 'sshd_t', tgt: 'unreserved_port_t', tclass: 'tcp_socket', perm: 'name_bind' });
  assert.equal(lk.at, logic.POLICY.length);
  assert.deepEqual(lk.rows.map((r) => r.miss), [['tgt'], ['tgt', 'tclass', 'perm'], ['tgt', 'tclass', 'perm'], ['src', 'tgt', 'tclass', 'perm']]);
  const dup = logic.POLICY.concat([logic.POLICY[1]]);
  assert.equal(logic.lookup(dup, { src: 'sshd_t', tgt: 'ssh_home_t', tclass: 'file', perm: 'read' }).at, 1, 'the first match');
  // a rule for another permission does not match
  assert.equal(logic.lookup(logic.POLICY, { src: 'sshd_t', tgt: 'ssh_home_t', tclass: 'file', perm: 'write' }).at, logic.POLICY.length);
});

// ── the step plan ──

test('step order: the scene\'s own actions, an attempt, the fix, a retry; each attempt starts clean', () => {
  assert.deepEqual(logic.planOf(P({ scene: 'keys', fix: 'relabel' })), ['cp', 'mv', 'try', 'restorecon', 'try']);
  assert.deepEqual(logic.planOf(P({ fix: 'setenforce' })), ['try', 'setenforce0', 'try', 'setenforce1', 'try']);
  assert.deepEqual(logic.planOf(P({ fix: 'setenforce', undo: 'reboot' })), ['try', 'setenforce0', 'try', 'reboot', 'try']);
  const retry = all(P({ fix: 'relabel' })).filter((s) => s.phase === 'attempt')[1];
  assert.deepEqual([retry.dac, retry.mac, retry.enforced, retry.outcome], [null, null, null, null]);
  assert.equal(retry.attempt, 2);
  assert.equal(retry.cmd, 'sudo systemctl restart sshd');
  assert.equal(at(P({ scene: 'keys' }), 3).cmd, null, 'sshd reads the keys at a login: nothing is typed');
});

test('what the admin sees: sshd keeps 22 when 8991 is refused; the listen set changes only at an outcome', () => {
  const p = P({ fix: 'setenforce' });
  const fr = all(p);
  assert.deepEqual(fr.filter((s) => s.phase === 'outcome').map((s) => s.listening), [[22], [8991, 22], [22]]);
  assert.deepEqual(fr.filter((s) => s.phase === 'outcome').map((s) => s.changed), [['outcome'], ['outcome', 'listening'], ['outcome', 'listening']]);
  const retry2 = fr.filter((s) => s.phase === 'attempt')[2];
  assert.deepEqual(retry2.listening, [8991, 22], 'until the restart is decided, the old process still listens');
  assert.deepEqual(end(p).portLabels[8991], 'unreserved_port_t');
});

// ── the presets' numbers (SPEC.md, Presets) ──

const PRESETS = {
  'sshd-8991': { fix: 'relabel' },
  'permissive-switch': { fix: 'setenforce' },
  'mv-label': { scene: 'keys', fix: 'relabel' },
  'dac-first': { scene: 'secret', dacOk: false }
};

test('steps per preset: 10, 17, 12, 3; the defaults 5; every count within 20', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(PRESETS).map(([k, o]) => [k, steps(P(o))])),
    { 'sshd-8991': 10, 'permissive-switch': 17, 'mv-label': 12, 'dac-first': 3 });
  assert.equal(steps(P({})), 5);
  for (const scene of logic.SCENE_IDS) for (const fix of ['none', 'relabel', 'setenforce']) for (const dacOk of [true, false]) {
    assert.ok(steps(P({ scene, fix, dacOk })) <= 20);
  }
  assert.equal(steps(P({ scene: 'secret' })), 4);
  assert.equal(steps(P({ scene: 'secret', dacOk: false, fix: 'setenforce' })), 11);
});

test('outcomes and audit per preset', () => {
  assert.deepEqual(outcomes(P(PRESETS['sshd-8991'])), ['denied', 'allowed']);
  assert.deepEqual(end(P(PRESETS['sshd-8991'])).audit.map((a) => a.permissive), [0]);
  assert.deepEqual(outcomes(P(PRESETS['permissive-switch'])), ['denied', 'allowed', 'denied']);
  assert.deepEqual(end(P(PRESETS['permissive-switch'])).audit.map((a) => a.permissive), [0, 1, 0]);
  assert.deepEqual(outcomes(P(PRESETS['mv-label'])), ['denied', 'allowed']);
  assert.deepEqual(end(P(PRESETS['mv-label'])).audit.map((a) => [a.name, logic.typeOf(a.tcontext)]), [['authorized_keys', 'user_tmp_t']]);
  assert.deepEqual(outcomes(P(PRESETS['dac-first'])), ['denied']);
  assert.deepEqual(end(P(PRESETS['dac-first'])).audit, []);
});

test('sim.json steps is the defaults\' count, and its preset entries are the page\'s presets', () => {
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, steps(P({})));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const e of sim.entries || []) assert.ok(html.includes(`id: '${e.preset}'`), e.preset);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS).concat([{}, { scene: 'secret' }, { fix: 'setenforce', undo: 'reboot' }])) {
    const p = P(o);
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states handed out are copies', () => {
  const p = P({ scene: 'keys', fix: 'relabel' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s2 = at(p, 2);
  s2.files[0].tcontext = 'x:x:x:x';
  assert.equal(at(p, 2).files[0].tcontext, 'unconfined_u:object_r:user_tmp_t:s0');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
