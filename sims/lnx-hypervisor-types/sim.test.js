// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for "where the kernel and the hypervisor sit". Run: node --test sims/lnx-hypervisor-types/
// Order: tie-breaks (SPEC.md §5), then the rules of SPEC.md §2, then the numbers of §3, then the generic block.
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
const stack = (s, id) => s.stacks.find((x) => x.id === id);
const layer = (s, st, id) => stack(s, st).layers.find((l) => l.id === id);
const ids = (s, st) => stack(s, st).layers.map((l) => l.id);
const VM_STACKS = ['type1', 'type2', 'kernel'];

// ── tie-breaks (SPEC.md §5) ──

test('tie-break 1: an unknown or stale sel is no selection, not an error', () => {
  for (const sel of ['', 'x', 'type1', 'type1:', ':hw', 'nope:hw', 'type1:nope', 'type1:gk3', 'containers:ctr3',
    'type1:constructor', 'constructor:hw', 'type2:kvmk', 'type1:hw:x', null, 7]) {
    const s = S({ sel, guests: 2 });
    assert.equal(s.selected, null, String(sel));
    assert.equal(s.info, null, String(sel));
    assert.deepEqual(s.lit, [], String(sel));
    for (const st of s.stacks) for (const l of st.layers) assert.ok(!l.sel && !l.lit, String(sel));
  }
  // the same sel is valid once there are enough guests
  assert.deepEqual(S({ sel: 'type1:gk3', guests: 3 }).selected, { stack: 'type1', layer: 'gk3' });
});

test('tie-break 2: a rejected layer is selectable, never lit, never running', () => {
  const s = S({ win: true, guests: 2, sel: 'containers:ctr2' });
  assert.deepEqual(s.selected, { stack: 'containers', layer: 'ctr2' });
  assert.equal(s.info.rejected, true);
  assert.equal(s.info.uname, null);
  assert.equal(s.info.unameWhy, 'rejected');
  assert.deepEqual(s.lit, [], 'a rejected container has no serving kernel to light');
  assert.equal(s.info.boundary, 'rejected', 'nothing fences a container that never starts');
  assert.equal(s.info.risk, null, 'no kernel-bug reach for a container that never starts');
  assert.equal(s.info.sharedBy, 1);
  assert.equal(S({ win: true, guests: 2, sel: 'containers:ctr1' }).info.boundary, 'ns-cgroups');
  const k = S({ win: true, guests: 2, sel: 'containers:ctrk' });
  assert.deepEqual(k.lit, ['containers:ctr1'], 'the kernel lights only the running container');
  assert.equal(stack(k, 'containers').running, 1);
  assert.equal(k.info.sharedBy, 1);
});

test('tie-break 3: compare dims but keeps a selection in a dimmed stack', () => {
  const s = S({ compare: 'type1-vs-type2', sel: 'containers:ctr1' });
  assert.equal(stack(s, 'containers').dim, true);
  assert.deepEqual(s.selected, { stack: 'containers', layer: 'ctr1' });
  assert.equal(layer(s, 'containers', 'ctr1').sel, true);
});

test('tie-break 4: unknown compare is all; guests clamped to 1–3, non-numbers give 2', () => {
  for (const compare of ['', 'x', 'constructor', undefined]) {
    const s = S({ compare });
    assert.equal(s.mode, 'all');
    assert.equal(s.compare, null);
    assert.ok(s.stacks.every((x) => !x.dim));
  }
  assert.equal(S({ guests: 0 }).guests, 1);
  assert.equal(S({ guests: 9 }).guests, 3);
  assert.equal(S({ guests: 2.4 }).guests, 2);
  assert.equal(S({ guests: 2.6 }).guests, 3);
  for (const guests of ['x', null, '', true, NaN, undefined]) assert.equal(S({ guests }).guests, 2, String(guests));
});

test('tie-break 5: stacks in screen order, layers in tree order, lit in layer order', () => {
  const s = S({ guests: 2 });
  assert.deepEqual(s.stacks.map((x) => x.id), ['type1', 'type2', 'kernel', 'containers']);
  assert.deepEqual(ids(s, 'type1'), ['hw', 'hv', 'gk1', 'app1', 'gk2', 'app2']);
  assert.deepEqual(ids(s, 'type2'), ['hw', 'hostk', 'hostapp', 'dhv', 'gk1', 'app1', 'gk2', 'app2']);
  assert.deepEqual(ids(s, 'kernel'), ['hw', 'kvmk', 'emu1', 'gk1', 'app1', 'emu2', 'gk2', 'app2']);
  assert.deepEqual(ids(s, 'containers'), ['hw', 'ctrk', 'ctr1', 'ctr2']);
  assert.deepEqual(S({ guests: 3, sel: 'type2:hostk' }).lit, ['type2:hostapp', 'type2:dhv']);
  assert.deepEqual(S({ guests: 3, sel: 'kernel:kvmk' }).lit, ['kernel:emu1', 'kernel:emu2', 'kernel:emu3']);
});

// ── rules (SPEC.md §2) ──

test('rule 1: every VM stack has exactly one hypervisor, and every guest kernel stands on it or its emulator', () => {
  for (const g of [1, 2, 3]) {
    const s = S({ guests: g });
    for (const id of VM_STACKS) {
      const ls = stack(s, id).layers;
      const hvs = ls.filter((l) => logic.KINDS[l.kind].hv);
      assert.equal(hvs.length, 1, id);
      for (const gk of ls.filter((l) => l.kind === 'gk')) {
        const under = ls.find((l) => l.id === gk.on);
        assert.ok(under.id === hvs[0].id || (under.kind === 'emu' && under.on === hvs[0].id), id + ' ' + gk.id);
      }
    }
    assert.equal(stack(s, 'containers').layers.filter((l) => logic.KINDS[l.kind].hv).length, 0);
  }
});

test('rule 2: bare metal puts the hypervisor on the hardware; hosted puts it on the host kernel', () => {
  const s = S({});
  assert.equal(layer(s, 'type1', 'hv').on, 'hw');
  assert.ok(!stack(s, 'type1').layers.some((l) => l.kind === 'hostk'), 'no host OS under a bare-metal hypervisor');
  assert.equal(layer(s, 'type2', 'dhv').on, 'hostk');
  assert.equal(layer(s, 'type2', 'hostapp').on, 'hostk', 'next to the host programs');
  assert.equal(layer(s, 'type2', 'hostk').on, 'hw');
});

test('rule 3: each VM has its own guest kernel, so a Windows guest works on every VM stack', () => {
  for (const g of [1, 2, 3]) {
    const s = S({ guests: g, win: true });
    for (const id of VM_STACKS) {
      const gks = stack(s, id).layers.filter((l) => l.kind === 'gk');
      assert.equal(gks.length, g);
      assert.deepEqual(gks.map((l) => l.guest), Array.from({ length: g }, (_, i) => i + 1));
      assert.equal(gks[g - 1].os, 'windows');
      assert.ok(gks.slice(0, g - 1).every((l) => l.os === 'linux'));
      assert.ok(gks.every((l) => !l.rejected), 'a Windows guest is not rejected');
      assert.equal(layer(s, id, 'app' + g).os, 'windows');
    }
  }
});

test('rule 4: in the kernel-based stack the kernel is the hypervisor and each guest has one emulator process', () => {
  const s = S({ guests: 3, sel: 'kernel:kvmk' });
  const k = layer(s, 'kernel', 'kvmk');
  assert.ok(logic.KINDS.kvmk.kernel && logic.KINDS.kvmk.hv, 'kvmk is both');
  assert.equal(k.on, 'hw');
  for (const i of [1, 2, 3]) {
    assert.equal(layer(s, 'kernel', 'emu' + i).on, 'kvmk');
    assert.equal(layer(s, 'kernel', 'gk' + i).on, 'emu' + i);
  }
  assert.deepEqual(s.info.ps, [1, 2, 3], 'ps lists one emulator process per guest');
  assert.deepEqual(S({ guests: 2, sel: 'kernel:emu2' }).info.ps, [1, 2]);
  assert.equal(S({ guests: 2, sel: 'type2:dhv' }).info.ps, null, 'no ps list outside the kernel-based stack');
  assert.equal(S({ guests: 2, sel: 'kernel:gk1' }).info.ps, null);
  // the emulator process is a host process: host kernel, host uname
  const e = S({ sel: 'kernel:emu1' }).info;
  assert.equal(e.kernel, 'host');
  assert.equal(e.uname, logic.HOST_VERSION);
  // the desktop hypervisor is not a kernel; kvmk is
  assert.equal(logic.KINDS.dhv.kernel, false);
});

test('rule 5: containers share the host kernel; uname -r in a container prints the host version', () => {
  for (const g of [1, 2, 3]) {
    const s = S({ guests: g });
    const ls = stack(s, 'containers').layers;
    assert.deepEqual(ls.filter((l) => logic.KINDS[l.kind].kernel).map((l) => l.id), ['ctrk']);
    for (const c of ls.filter((l) => l.kind === 'ctr')) {
      assert.equal(c.on, 'ctrk', 'no kernel between a container and the host kernel');
      const info = S({ guests: g, sel: 'containers:' + c.id }).info;
      assert.equal(info.kernel, 'host');
      assert.equal(info.uname, logic.HOST_VERSION);
      assert.equal(info.uname, S({ sel: 'containers:ctrk' }).info.uname);
    }
  }
});

test('rule 5: a Windows container on a Linux host is rejected; the last guest only', () => {
  const s = S({ guests: 3, win: true });
  assert.deepEqual(stack(s, 'containers').layers.filter((l) => l.rejected).map((l) => l.id), ['ctr3']);
  assert.ok(!S({ guests: 3, win: false }).stacks.some((x) => x.layers.some((l) => l.rejected)));
  for (const id of VM_STACKS) assert.ok(!stack(s, id).layers.some((l) => l.rejected));
});

test('rule 6: VM ↔ VM is the hypervisor; container ↔ container is namespaces and cgroups; risk shared vs own', () => {
  for (const id of VM_STACKS) {
    const i = S({ sel: id + ':gk1' }).info;
    assert.equal(i.boundary, 'hypervisor');
    assert.equal(i.risk, 'own');
    assert.equal(S({ sel: id + ':app2' }).info.risk, 'own');
  }
  const c = S({ sel: 'containers:ctr2' }).info;
  assert.equal(c.boundary, 'ns-cgroups');
  assert.equal(c.risk, 'shared');
  assert.equal(c.sharedBy, 2);
  assert.equal(S({ sel: 'containers:ctrk', guests: 3 }).info.sharedBy, 3);
  assert.equal(S({ sel: 'containers:ctrk' }).info.risk, 'shared');
  for (const sel of ['type2:hostapp', 'type2:hostk', 'type2:dhv', 'type1:hv', 'type1:hw', 'kernel:kvmk', 'kernel:emu1']) {
    assert.equal(S({ sel }).info.risk, null, sel);
  }
  for (const k of Object.keys(logic.KINDS)) assert.ok(typeof logic.BOUNDARY[k] === 'string', k);
});

test('rule 7: kernel count is g, g + 1, g + 1, 1, and type 1 notes +1 for a management OS', () => {
  for (const g of [1, 2, 3]) for (const win of [false, true]) {
    const s = S({ guests: g, win });
    assert.deepEqual(s.stacks.map((x) => x.kernels), [g, g + 1, g + 1, 1], `g=${g} win=${win}`);
    assert.deepEqual(s.stacks.map((x) => x.extra), [1, 0, 0, 0]);
  }
  assert.equal(S({ sel: 'type1:hv' }).info.extra, 1);
  assert.equal(S({ sel: 'type1:gk1' }).info.extra, 0);
  assert.equal(logic.KINDS.hv.kernel, false, 'the bare-metal hypervisor is not counted as an OS kernel');
});

test('rule 8: which kernel serves each layer', () => {
  const s = S({ guests: 2 });
  const want = {
    type1: { hw: null, hv: null, gk1: 'gk1', app1: 'gk1', gk2: 'gk2', app2: 'gk2' },
    type2: { hw: null, hostk: 'hostk', hostapp: 'hostk', dhv: 'hostk', gk1: 'gk1', app1: 'gk1', gk2: 'gk2', app2: 'gk2' },
    kernel: { hw: null, kvmk: 'kvmk', emu1: 'kvmk', gk1: 'gk1', app1: 'gk1', emu2: 'kvmk', gk2: 'gk2', app2: 'gk2' },
    containers: { hw: null, ctrk: 'ctrk', ctr1: 'ctrk', ctr2: 'ctrk' }
  };
  for (const st of logic.STACK_IDS) {
    const got = {};
    for (const l of stack(s, st).layers) got[l.id] = logic.servingKernel(st, l);
    assert.deepEqual(got, want[st], st);
  }
  assert.equal(S({ sel: 'type1:hv' }).info.kernel, 'hv');
  assert.equal(S({ sel: 'type1:hw' }).info.kernel, 'none');
  assert.equal(S({ sel: 'type2:app2' }).info.kernel, 'guest');
  assert.equal(S({ sel: 'type2:app2' }).info.kernelGuest, 2);
  assert.equal(S({ sel: 'containers:ctr2', win: true }).info.kernel, 'none');
  for (const sel of ['kernel:emu1', 'type2:hostapp', 'containers:ctr1', 'type1:hv']) assert.equal(S({ sel }).info.kernelGuest, null, sel);
});

test('rule 9: uname -r is the serving kernel\'s version; guests differ from the host; null with a reason', () => {
  assert.equal(new Set([logic.HOST_VERSION, ...logic.GUEST_VERSIONS]).size, 4);
  for (const id of VM_STACKS) for (const i of [1, 2, 3]) {
    for (const k of ['gk', 'app']) {
      const info = S({ guests: 3, sel: `${id}:${k}${i}` }).info;
      assert.equal(info.uname, logic.GUEST_VERSIONS[i - 1], `${id} ${k}${i}`);
      assert.notEqual(info.uname, logic.HOST_VERSION);
    }
  }
  for (const sel of ['type2:hostk', 'type2:hostapp', 'type2:dhv', 'kernel:kvmk', 'kernel:emu1', 'containers:ctrk']) {
    assert.equal(S({ sel }).info.uname, logic.HOST_VERSION, sel);
  }
  for (const sel of ['type1:hw', 'type1:hv', 'type2:hw', 'kernel:hw', 'containers:hw']) {
    assert.deepEqual([S({ sel }).info.uname, S({ sel }).info.unameWhy], [null, 'no-app'], sel);
  }
  for (const sel of ['type1:gk2', 'type2:app2', 'kernel:gk2']) {
    assert.deepEqual([S({ sel, win: true }).info.uname, S({ sel, win: true }).info.unameWhy], [null, 'windows'], sel);
  }
  assert.equal(S({ sel: 'kernel:gk1', win: true }).info.uname, logic.GUEST_VERSIONS[0], 'only the last guest is Windows');
  // the Windows guest's emulator process is still a Linux host process
  assert.equal(S({ sel: 'kernel:emu2', win: true }).info.uname, logic.HOST_VERSION);
  assert.equal(layer(S({ win: true }), 'kernel', 'emu2').os, null);
});

test('rule 10: a kernel or hypervisor lights what stands on it; anything else lights its kernel; hardware nothing', () => {
  const lit = (sel, over) => S(Object.assign({ sel }, over)).lit;
  assert.deepEqual(lit('type1:hv'), ['type1:gk1', 'type1:gk2']);
  assert.deepEqual(lit('type2:dhv'), ['type2:gk1', 'type2:gk2']);
  assert.deepEqual(lit('type2:gk2'), ['type2:app2']);
  assert.deepEqual(lit('containers:ctrk'), ['containers:ctr1', 'containers:ctr2']);
  assert.deepEqual(lit('type2:hostapp'), ['type2:hostk']);
  assert.deepEqual(lit('kernel:emu2'), ['kernel:kvmk']);
  assert.deepEqual(lit('kernel:app1'), ['kernel:gk1']);
  assert.deepEqual(lit('containers:ctr2'), ['containers:ctrk']);
  assert.deepEqual(lit('type1:hw'), []);
  assert.deepEqual(lit('type1:app1'), ['type1:gk1']);
  // lit layers are flagged in the right stack only
  const s = S({ sel: 'kernel:kvmk' });
  assert.deepEqual(stack(s, 'kernel').layers.filter((l) => l.lit).map((l) => l.id), ['emu1', 'emu2']);
  assert.ok(!stack(s, 'type2').layers.some((l) => l.lit || l.sel));
  // a selection and its links never leak into another stack with the same layer ids
  for (const sel of logic.allSel().slice(1)) {
    const x = S({ sel, guests: 3 });
    const st = sel.split(':')[0];
    const flagged = x.stacks.flatMap((k) => k.layers.filter((l) => l.sel).map((l) => k.id + ':' + l.id));
    assert.deepEqual(flagged, [sel], sel);
    for (const k of x.stacks) if (k.id !== st) assert.ok(!k.layers.some((l) => l.lit), sel + ' lit in ' + k.id);
  }
});

test('rule 11: compare keeps two stacks bright and dims the rest', () => {
  const want = {
    'all': [false, false, false, false],
    'type1-vs-type2': [false, false, true, true],
    'vm-vs-container': [true, true, false, false],
    'kernel': [true, false, false, true]
  };
  for (const [compare, dims] of Object.entries(want)) {
    const s = S({ compare });
    assert.deepEqual(s.stacks.map((x) => x.dim), dims, compare);
    assert.equal(s.mode, compare);
  }
  assert.deepEqual(S({ compare: 'kernel' }).compare, ['type2', 'kernel']);
  assert.deepEqual(logic.COMPARE_IDS, ['all', 'vm-vs-container', 'type1-vs-type2', 'kernel']);
});

test('rule 12: the laptop: 8 GB, 2 GB per guest, the host keeps the rest; only in the book view', () => {
  assert.deepEqual([1, 2, 3].map((g) => S({ guests: g, view: 'book' }).laptop.host), [6, 4, 2]);
  assert.deepEqual(S({ guests: 1, view: 'book' }).laptop, { total: 8, perGuest: 2, host: 6 });
  assert.equal(S({ view: 'none' }).laptop, null);
  assert.equal(S({ view: 'x' }).view, 'none');
});

// ── expected numbers (SPEC.md §3, checked first by numbers.py) ──

test('numbers: layer counts, kernel counts and running guests for g = 1–3, with and without win', () => {
  const layers = { 1: [4, 6, 5, 3], 2: [6, 8, 8, 4], 3: [8, 10, 11, 5] };
  const kernels = { 1: [1, 2, 2, 1], 2: [2, 3, 3, 1], 3: [3, 4, 4, 1] };
  for (const g of [1, 2, 3]) for (const win of [false, true]) {
    const s = S({ guests: g, win });
    assert.deepEqual(s.stacks.map((x) => x.layers.length), layers[g]);
    assert.deepEqual(s.stacks.map((x) => x.kernels), kernels[g]);
    assert.equal(stack(s, 'containers').running, win ? g - 1 : g);
    for (const id of VM_STACKS) assert.equal(stack(s, id).running, g);
  }
});

test('numbers: fact 7 with 2 guests is 2 / 3 / 3 / 1', () => {
  assert.deepEqual(S({ guests: 2 }).stacks.map((x) => x.kernels), [2, 3, 3, 1]);
});

// ── generic checks every sim keeps ──

test('a reference page: no steps, and step changes nothing', () => {
  assert.equal(logic.steps, 0);
  const s = S({ sel: 'kernel:kvmk' });
  assert.deepEqual(logic.step(s, 1, P({})), s);
});

test('state is JSON-safe for every param combination', () => {
  for (const compare of logic.COMPARE_IDS) for (const g of [1, 2, 3]) for (const win of [false, true]) {
    for (const sel of logic.allSel()) for (const view of ['none', 'book']) {
      const s = S({ compare, guests: g, win, sel, view });
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('deterministic, and no shared data is mutated', () => {
  const before = structuredClone({ c: logic.COMPARE, k: logic.KINDS, g: logic.GUEST_VERSIONS });
  const a = S({ compare: 'kernel', sel: 'kernel:kvmk' });
  a.compare.push('x');
  a.stacks[0].layers.push({});
  a.lit.push('x');
  assert.deepEqual(S({ compare: 'kernel', sel: 'kernel:kvmk' }), logic.initial(P({ compare: 'kernel', sel: 'kernel:kvmk' })));
  assert.deepEqual({ c: logic.COMPARE, k: logic.KINDS, g: logic.GUEST_VERSIONS }, before);
});

test('allSel lists every layer of every stack at 3 guests, and each is a valid selection', () => {
  const all = logic.allSel();
  assert.equal(all[0], '');
  assert.equal(all.length, 1 + 8 + 10 + 11 + 5);
  for (const sel of all.slice(1)) assert.ok(S({ sel, guests: 3 }).selected, sel);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every kind, boundary and stack has its words in both languages', () => {
  for (const lang of ['hr', 'en']) {
    const t = strings[lang];
    for (const k of Object.keys(logic.KINDS)) for (const pre of ['b_', 'n_', 'w_']) assert.ok(t[pre + k], `${lang} ${pre}${k}`);
    for (const b of new Set([...Object.values(logic.BOUNDARY), 'rejected'])) assert.ok(t['bd_' + b], `${lang} bd_${b}`);
    for (const s of logic.STACK_IDS) for (const pre of ['s_', 'sh_']) assert.ok(t[pre + s], `${lang} ${pre}${s}`);
    for (const m of logic.COMPARE_IDS) assert.ok(t['cmp_' + m] && t['cap_' + m], `${lang} compare ${m}`);
  }
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'reference');
  assert.equal(meta.steps, undefined);
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(presets.length, 4);
  for (const body of presets) {
    for (const [, k, v] of body.matchAll(/(\w+):\s*('([^']*)'|\d+|true|false)/g)) {
      assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
      if (k === 'compare') assert.ok(logic.COMPARE_IDS.includes(v.slice(1, -1)), v);
      if (k === 'sel') assert.ok(S({ sel: v.slice(1, -1), guests: 3 }).selected, v);
      if (k === 'view') assert.ok(['none', 'book'].includes(v.slice(1, -1)), v);
    }
  }
  // each preset's selection is valid with the preset's own guest count
  for (const body of presets) {
    const sel = (body.match(/sel:\s*'([^']*)'/) || [])[1];
    const g = Number((body.match(/guests:\s*(\d+)/) || [])[1] || logic.defaults.guests);
    const win = /win:\s*true/.test(body);
    if (sel) assert.ok(S({ sel, guests: g, win }).selected, sel + ' at ' + g);
  }
});
