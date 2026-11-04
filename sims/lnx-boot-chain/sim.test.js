// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-boot-chain's model (SPEC.md): tie-breaks first, then one or more per rule, the presets' numbers, then
// the template's generic block. Run: node --test sims/lnx-boot-chain/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const IDS = ['firmware', 'loader', 'kernel', 'initramfs', 'init', 'target'];
const text = (s) => s.screen.filter((l) => typeof l === 'string').join('\n');

// A made-up chain for the tie-breaks: two stages need the same thing.
function withChain(chain, fn) {
  logic.CHAINS.test = chain;
  try { return fn(); } finally { delete logic.CHAINS.test; }
}
const TWIN = {
  breaks: ['x'], targets: [], vars: () => ({}),
  stages: [
    { id: 'a', needs: [], screen: ['a'] },
    { id: 'b', needs: ['x'], screen: ['b'], failText: ['b failed'], failState: 'bHalt' },
    { id: 'c', needs: ['x'], screen: ['c'], failText: ['c failed'], failState: 'cHalt' }
  ],
  end: { any: ['up'] }
};

// ── tie-breaks ──

test('T1: when two stages need the same thing, the first one fails', () => {
  withChain(TWIN, () => {
    const p = P({ chain: 'test', break: 'x' });
    assert.equal(logic.steps(p), 3);
    const s = kit.stateAt(logic, p, 3);
    assert.equal(s.failedAt, 'b');
    assert.equal(s.halt, 'bHalt');
    assert.deepEqual(s.screen, ['b failed']);
    assert.deepEqual(s.done, ['a']);
  });
});

test('T2: a break that no stage of the chain needs changes nothing', () => {
  withChain(TWIN, () => {
    const p = P({ chain: 'test', break: 'targetUnit' });
    assert.equal(logic.steps(p), 4);
    const s = kit.stateAt(logic, p, 4);
    assert.equal(s.failedAt, null);
    assert.deepEqual(s.done, ['a', 'b', 'c']);
    assert.deepEqual(s.screen, ['up']);
  });
  assert.equal(logic.failIndex(logic.CHAINS.linux, 'nonsense'), -1);
  assert.equal(logic.failIndex(logic.CHAINS.linux, 'none'), -1);
});

test('T3: no driver and a wrong UUID: same stage, same halt, same screen apart from the UUID', () => {
  const a = end({ break: 'diskDriver' }), b = end({ break: 'rootUuid' });
  assert.equal(logic.steps(P({ break: 'diskDriver' })), logic.steps(P({ break: 'rootUuid' })));
  assert.equal(a.failedAt, 'initramfs');
  assert.equal(b.failedAt, 'initramfs');
  assert.equal(a.halt, b.halt);
  assert.deepEqual(a.done, b.done);
  assert.equal(text(a).split(logic.ROOT_UUID).join('U'), text(b).split(logic.WRONG_UUID).join('U'));
  assert.ok(text(a).includes(logic.ROOT_UUID));
  assert.ok(text(b).includes(logic.WRONG_UUID));
});

test('initial and step take the stages from the chosen chain; an unknown chain falls back to linux', () => {
  withChain(TWIN, () => {
    const s = logic.initial(P({ chain: 'test' }));
    assert.equal(s.chain, 'test');
    assert.deepEqual(s.stages, ['a', 'b', 'c']);
    assert.deepEqual(kit.stateAt(logic, P({ chain: 'test' }), 1).screen, ['a']);
  });
  const u = logic.initial(P({ chain: 'nope' }));
  assert.equal(u.chain, 'linux');
  assert.deepEqual(u.stages, IDS);
});

test('T4: after a stop or the end, step returns the state unchanged', () => {
  for (const over of [{ break: 'kernelFile' }, {}]) {
    const p = P(over), n = logic.steps(p);
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(logic.step(s, n + 1, p), s);
  }
});

test('T5: the target param changes only the last stage', () => {
  const m = P(), g = P({ target: 'graphical' });
  for (let n = 0; n < logic.steps(m); n++) {
    const a = kit.stateAt(logic, m, n), b = kit.stateAt(logic, g, n);
    assert.deepEqual(a, b, `step ${n}`);
  }
  const a = end({}), b = end({ target: 'graphical' });
  assert.equal(a.target, 'multi-user.target');
  assert.equal(b.target, 'graphical.target');
  assert.equal(b.t.kernel, a.t.kernel);
  assert.equal(b.t.initrd, a.t.initrd);
  assert.equal(b.t.userspace, null, 'graphical was not measured');
  assert.equal(b.t.targetAt, null, 'nor its target time');
  assert.equal(at({ target: 'graphical' }, 6).target, null);
  assert.ok(text(a).includes('Reached target multi-user.target - Multi-User System.'));
  assert.ok(text(b).includes('Reached target graphical.target - Graphical Interface.'));
  assert.ok(!text(b).includes('login:'), 'graphical: a login screen, not a text prompt');
  assert.equal(logic.subOf(logic.CHAINS.linux.stages[5], g), 'default.target → graphical.target');
  assert.ok(b.screen.some((l) => l.t === 'scrGraphical'));
  assert.ok(text(a).includes('demosrv1 login:'));
});

test('T6: changed is the stage that just took control; null at step 0, on a stop and at the end', () => {
  assert.equal(at({}, 0).changed, null);
  for (let n = 1; n <= 6; n++) assert.equal(at({}, n).changed, IDS[n - 1], `step ${n}`);
  assert.equal(at({}, 7).changed, null);
  assert.equal(end({ break: 'kernelFile' }).changed, null);
});

// ── the book's values (SPEC.md Numbers), pinned as literals ──

test('book values: kernel version, root and /mnt/vjezba UUIDs, /boot on gpt3, the host', () => {
  assert.equal(logic.KVER, '6.12.0-211.16.1.el10_2.0.1.x86_64');
  assert.equal(logic.ROOT_UUID, '01582c00-2b49-4e9b-86ee-75f418a4b720');
  assert.equal(logic.WRONG_UUID, '01582c00-2b49-4e9b-86ee-75f418a4b702');
  assert.equal(logic.VJEZBA_UUID, '77b8714b-1cf6-4d6b-bce3-57d9763fb1e6');
  assert.ok(text(at({}, 3)).includes('BOOT_IMAGE=(hd0,gpt3)/vmlinuz-6.12.0-211.16.1.el10_2.0.1.x86_64'));
  assert.ok(text(end({})).includes('demosrv1 login:'));
});

test('the console of each moment: firmware, loader menu, kernel, initramfs, switch root, mounts', () => {
  assert.deepEqual(at({}, 0).screen, []);
  assert.deepEqual(at({}, 1).screen, [{ t: 'scrFirmware' }]);
  assert.ok(text(at({}, 2)).includes('Linux (' + logic.KVER + ')'));
  assert.ok(text(at({}, 4)).includes('Run /init as init process'));
  assert.ok(text(at({}, 5)).includes('initrd-switch-root.service'));
  assert.ok(text(at({}, 6)).includes('Mounted boot.mount - /boot.'));
  assert.deepEqual(end({ break: 'bootEntry' }).screen, [{ t: 'scrNoBoot' }]);
  const d = end({ break: 'diskDriver' });
  assert.equal(d.screen[d.screen.length - 1], 'dracut:/#', 'the initramfs emergency shell');
  assert.ok(!text(d).includes('Give root password'));
});

// ── rule 1: order is fixed, one hand-over per step ──

test('rule 1: the chain is firmware, loader, kernel, initramfs, init, target, and each step hands on to the next', () => {
  assert.deepEqual(at({}, 0).stages, IDS);
  assert.equal(logic.steps(P()), 7);
  for (let n = 2; n <= 7; n++) {
    const s = at({}, n);
    assert.deepEqual(s.done, IDS.slice(0, n - 1), `step ${n}`);
    assert.equal(s.at, n - 1);
  }
});

// ── rule 2: firmware first, in the machine ──

test('rule 2: power on gives control to the firmware, which lives in ROM and needs a boot entry', () => {
  const s0 = at({}, 0), s1 = at({}, 1);
  assert.equal(s0.power, false);
  assert.equal(s0.at, -1);
  assert.deepEqual(s0.screen, []);
  assert.equal(s1.power, true);
  assert.equal(s1.at, 0);
  const fw = logic.CHAINS.linux.stages[0];
  assert.equal(fw.lives, 'livesRom');
  assert.ok(logic.CHAINS.linux.stages.slice(1).every((s) => s.lives !== 'livesRom'), 'only the firmware is in ROM');
  const s = end({ break: 'bootEntry' });
  assert.equal(logic.steps(P({ break: 'bootEntry' })), 2);
  assert.equal(s.failedAt, 'firmware');
  assert.equal(s.halt, 'firmwareHalt');
  assert.deepEqual(s.done, []);
});

// ── rule 3: the loader finds the kernel; the command line names the root ──

test('rule 3: the loader needs the kernel file; without it the chain stops at stage 2 with the loader\'s error', () => {
  const s = end({ break: 'kernelFile' });
  assert.equal(logic.steps(P({ break: 'kernelFile' })), 3);
  assert.equal(s.failedAt, 'loader');
  assert.equal(s.halt, 'loaderPrompt');
  assert.ok(text(s).includes('vmlinuz-' + logic.KVER));
  const k = at({}, 3);
  assert.equal(k.changed, 'kernel');
  assert.ok(text(k).includes('root=UUID=' + logic.ROOT_UUID));
  assert.ok(text(k).includes('Linux version ' + logic.KVER));
});

// ── rule 4: the kernel uses initramfs as the first root ──

test('rule 4: after the kernel stage the root is the initramfs, not yet the real one', () => {
  assert.deepEqual(at({}, 3).root, { initramfs: false, real: false });
  assert.deepEqual(at({}, 4).root, { initramfs: true, real: false });
  assert.deepEqual(logic.CHAINS.linux.stages[3].needs, ['diskDriver', 'rootUuid']);
  assert.deepEqual(end({ break: 'diskDriver' }).root, { initramfs: true, real: false });
});

test('rule 4: a wrong root=UUID shows on the kernel command line and in the error', () => {
  assert.ok(text(at({ break: 'rootUuid' }, 3)).includes('root=UUID=' + logic.WRONG_UUID));
  assert.notEqual(logic.WRONG_UUID, logic.ROOT_UUID);
});

// ── rule 5: the same systemd is PID 1 before and after switch root ──

test('rule 5: PID 1 is systemd from the initramfs on and stays; the switch changes the root only', () => {
  assert.equal(at({}, 3).pid1, null);
  for (let n = 4; n <= 7; n++) assert.equal(at({}, n).pid1, 'systemd', `step ${n}`);
  assert.deepEqual(at({}, 5).root, { initramfs: false, real: true });
  assert.equal(end({ break: 'diskDriver' }).pid1, 'systemd', 'PID 1 exists in the initramfs even when it stops there');
});

// ── rule 6: default.target, or the emergency target ──

test('rule 6: PID 1 reaches default.target (multi-user on the book machine)', () => {
  const s = end({});
  assert.equal(s.target, 'multi-user.target');
  assert.ok(text(s).includes('Reached target multi-user.target'));
  assert.equal(at({}, 6).target, null);
});

test('rule 6: a failing unit the target needs leaves PID 1 up and the target not reached: emergency.target', () => {
  const p = P({ break: 'targetUnit' });
  assert.equal(logic.steps(p), 7);
  const s = end({ break: 'targetUnit' });
  assert.equal(s.failedAt, 'target');
  assert.equal(s.halt, 'emergency');
  assert.equal(s.target, 'emergency.target');
  assert.equal(s.pid1, 'systemd');
  assert.deepEqual(s.root, { initramfs: false, real: true });
  assert.ok(text(s).includes('local-fs.target'));
  assert.ok(text(s).includes(logic.VJEZBA_UUID));
  assert.ok(text(s).includes('You are in emergency mode'));
  assert.ok(!text(s).includes('dracut'), 'the emergency target of the real root, not the initramfs shell');
  assert.deepEqual(s.t, { kernel: 1.363, initrd: 3.996, userspace: null, targetAt: null }, 'no Startup finished');
});

// ── rule 7: later stages never run ──

test('rule 7: a failure stops the chain; later stages are not done, leave no screen and no time', () => {
  for (const [brk, i] of [['bootEntry', 0], ['kernelFile', 1], ['diskDriver', 3], ['rootUuid', 3], ['targetUnit', 5]]) {
    const p = P({ break: brk });
    assert.equal(logic.steps(p), i + 2, brk);
    const s = kit.stateAt(logic, p, logic.steps(p));
    assert.equal(s.failedAt, IDS[i], brk);
    assert.deepEqual(s.done, IDS.slice(0, i), brk);
    assert.equal(s.at, i, brk);
  }
  const noKernel = end({ break: 'kernelFile' });
  assert.ok(!text(noKernel).includes('Linux version'), 'no kernel log');
  assert.deepEqual(noKernel.t, { kernel: null, initrd: null, userspace: null, targetAt: null });
  assert.deepEqual(end({ break: 'diskDriver' }).t, { kernel: 1.363, initrd: null, userspace: null, targetAt: null });
});

test('rule 7: steps before the failing one are the same as in a whole boot', () => {
  for (const brk of ['kernelFile', 'diskDriver', 'targetUnit']) {
    const p = P({ break: brk });
    for (let n = 0; n < logic.steps(p); n++) {
      const a = kit.stateAt(logic, p, n), b = at({}, n);
      assert.deepEqual(a, b, `${brk} step ${n}`);
    }
  }
});

// ── the Windows chain (task w3/win-boot; SPEC.md "Windows") ──

const W = (over) => P(Object.assign({ chain: 'windows' }, over));
const wat = (over, n) => kit.stateAt(logic, W(over), n);
const wend = (over) => wat(over, logic.steps(W(over)));
const WIDS = ['uefi', 'bootmgr', 'winload', 'kernel', 'smss', 'winlogon'];

test('W-T1: the Windows chain reads its own break; a Linux break leaves it whole, and the other way round', () => {
  assert.equal(logic.breakOf(W({ winBreak: 'bcd' })), 'bcd');
  assert.equal(logic.breakOf(P({ winBreak: 'bcd' })), 'none');
  assert.equal(logic.steps(W({ break: 'diskDriver' })), 7, 'a Linux break does nothing to Windows');
  assert.equal(wend({ break: 'diskDriver' }).failedAt, null);
  assert.equal(logic.steps(P({ winBreak: 'bootDriver' })), 7, 'a Windows break does nothing to Linux');
  assert.equal(end({ winBreak: 'bootDriver' }).failedAt, null);
});

test('W-T2: the default (none) and a break no Windows stage needs change nothing', () => {
  assert.deepEqual(wend({ winBreak: 'kernelFile' }), wend({}));
  assert.equal(logic.failIndex(logic.CHAINS.windows, 'none'), -1);
});

test('W-T3: winload does not fail without the disk driver; the kernel does (the first stage that needs it)', () => {
  const p = W({ winBreak: 'bootDriver' });
  assert.equal(logic.failIndex(logic.CHAINS.windows, 'bootDriver'), 3);
  assert.deepEqual(wat({ winBreak: 'bootDriver' }, 4).done, ['uefi', 'bootmgr', 'winload']);
  assert.equal(kit.stateAt(logic, p, 4).changed, 'kernel');
});

test('W1: the chain is UEFI, Boot Manager, winload, kernel, smss, winlogon; one hand-over per step; 7 steps', () => {
  assert.deepEqual(wat({}, 0).stages, WIDS);
  assert.equal(logic.steps(W()), 7);
  for (let n = 1; n <= 6; n++) assert.equal(wat({}, n).changed, WIDS[n - 1], `step ${n}`);
  for (let n = 2; n <= 7; n++) assert.deepEqual(wat({}, n).done, WIDS.slice(0, n - 1), `step ${n}`);
  const e = wend({});
  assert.equal(e.changed, null);
  assert.equal(e.failedAt, null);
  assert.deepEqual(e.screen, [{ t: 'wScrLogon' }]);
});

test('W2: the firmware starts bootmgfw.efi from the ESP, not from C:; Boot Manager starts winload.efi from C:', () => {
  const c = logic.CHAINS.windows;
  assert.equal(c.stages[0].lives, 'livesRom');
  assert.equal(c.stages[1].lives, 'wLivesEsp');
  assert.equal(c.stages[2].lives, 'wLivesC');
  assert.equal(logic.subOf(c.stages[0], W()), 'NVRAM: Windows Boot Manager');
  assert.equal(logic.subOf(c.stages[1], W()), 'bootmgfw.efi');
  assert.equal(logic.subOf(c.stages[2], W()), 'winload.efi');
  assert.deepEqual(wat({}, 1).facts, {}, 'nothing read yet while the firmware runs');
  assert.deepEqual(wat({}, 2).facts.from, [{ t: 'wFromEsp' }]);
  assert.deepEqual(wat({}, 3).facts.from, [{ t: 'wFromC' }]);
  assert.deepEqual(wat({}, 3).facts.bcd, ['device partition=C:', 'path \\Windows\\system32\\winload.efi']);
});

test('W3: no BCD stops Boot Manager in 3 steps with the recovery screen, 0xc000000f; winload and the kernel never run', () => {
  const p = W({ winBreak: 'bcd' });
  assert.equal(logic.steps(p), 3);
  const s = wend({ winBreak: 'bcd' });
  assert.equal(s.failedAt, 'bootmgr');
  assert.equal(s.halt, 'bcdRecovery');
  assert.deepEqual(s.done, ['uefi']);
  assert.ok(text(s).includes('Your PC/Device needs to be repaired'));
  assert.ok(text(s).includes('File: \\EFI\\Microsoft\\Boot\\BCD'));
  assert.ok(text(s).includes('Error code: 0xc000000f'));
  assert.ok(!text(s).includes('Stop code'), 'not a blue screen: the kernel never started');
  assert.deepEqual(s.facts.bcd, [{ t: 'wBcdMissing' }]);
  assert.deepEqual(s.factsBad, ['bcd']);
  assert.deepEqual(s.facts.from, [{ t: 'wFromEsp' }], 'still on the ESP');
  assert.equal(s.facts.first, undefined);
});

test('W4: a disk driver that is not boot-start: winload leaves it out, the kernel stops with 0x7B in 5 steps', () => {
  assert.deepEqual(wat({}, 4).facts.driver, ['storahci.sys', { t: 'wDrvLoaded' }]);
  assert.deepEqual(wat({ winBreak: 'bootDriver' }, 4).facts.driver, ['storahci.sys', { t: 'wDrvNotLoaded' }]);
  assert.deepEqual(wat({ winBreak: 'bootDriver' }, 4).factsBad, [], 'not red before the kernel has looked');
  assert.equal(logic.steps(W({ winBreak: 'bootDriver' })), 5);
  const s = wend({ winBreak: 'bootDriver' });
  assert.equal(s.failedAt, 'kernel');
  assert.equal(s.halt, 'bugcheck7b');
  assert.ok(text(s).includes('Stop code: INACCESSIBLE_BOOT_DEVICE'));
  assert.deepEqual(s.factsBad, ['driver']);
  assert.equal(s.facts.first, undefined, 'smss never started');
});

test('W4: the Windows twin of the Linux no-driver: the same number of steps, the stage after the loader', () => {
  const lin = P({ break: 'diskDriver' }), win = W({ winBreak: 'bootDriver' });
  assert.equal(logic.steps(win), logic.steps(lin));
  assert.equal(kit.stateAt(logic, win, 5).done.length, kit.stateAt(logic, lin, 5).done.length);
});

test('W5: the kernel starts smss.exe, the first user-mode process', () => {
  assert.equal(wat({}, 4).facts.first, undefined);
  assert.deepEqual(wat({}, 5).facts.first, ['smss.exe']);
  assert.equal(logic.CHAINS.windows.stages[3].hands, 'wHandsKernel');
});

test('W6: smss fans out into two sessions: one box with two lines, session 0 and session 1', () => {
  const smss = logic.CHAINS.windows.stages[4];
  assert.deepEqual(logic.subOf(smss, W()), ['smss.exe', { t: 'wSubS0' }, { t: 'wSubS1' }]);
  assert.equal(wat({}, 5).facts.s0, undefined);
  const s = wat({}, 6);
  assert.deepEqual(s.facts.s0, ['csrss.exe, wininit.exe → services.exe, lsass.exe']);
  assert.deepEqual(s.facts.s1, ['csrss.exe, winlogon.exe']);
  assert.equal(s.changed, 'winlogon');
});

test('W7: a critical session-0 process dies: CRITICAL_PROCESS_DIED after the kernel, 6 steps, no logon screen', () => {
  assert.equal(logic.steps(W({ winBreak: 'criticalProcess' })), 6);
  const s = wend({ winBreak: 'criticalProcess' });
  assert.equal(s.failedAt, 'smss');
  assert.equal(s.halt, 'bugcheckEf');
  assert.ok(s.done.includes('kernel'), 'the kernel itself is fine');
  assert.ok(text(s).includes('Stop code: CRITICAL_PROCESS_DIED'));
  assert.deepEqual(s.facts.s0, ['csrss.exe', { t: 'wWininitDied' }]);
  assert.deepEqual(s.factsBad, ['s0']);
  assert.equal(s.facts.s1, undefined);
  assert.ok(!s.screen.some((l) => l.t === 'wScrLogon'));
});

test('W8: Windows has no time bar data, no targets, no PID 1 or root rows; Linux has no fact rows', () => {
  const c = logic.CHAINS.windows;
  assert.equal(c.timing, undefined);
  assert.deepEqual(c.targets, []);
  assert.ok(c.stages.every((s) => !s.does || (!s.does.root && !s.does.pid1 && !s.does.target && !s.does.time)));
  const e = wend({});
  assert.deepEqual(e.t, { kernel: null, initrd: null, userspace: null, targetAt: null });
  assert.equal(e.pid1, null);
  assert.equal(logic.CHAINS.linux.factRows, undefined);
  assert.deepEqual(end({}).facts, {});
  assert.equal(logic.targetName(W()), null);
});

test('W9: the Windows steps before a failure are the same as in a whole Windows boot', () => {
  for (const b of ['bcd', 'bootDriver', 'criticalProcess']) {
    const p = W({ winBreak: b });
    for (let n = 0; n < logic.steps(p); n++) {
      // Only the driver row differs: winload left a driver that is not boot-start out (W4).
      const a = kit.stateAt(logic, p, n), w = wat({}, n);
      if (b === 'bootDriver' && n === 4) { assert.deepEqual(a.facts.driver, ['storahci.sys', { t: 'wDrvNotLoaded' }]); delete a.facts.driver; delete w.facts.driver; }
      assert.deepEqual(a, w, `${b} step ${n}`);
    }
  }
});

test('W10: Windows states are JSON-safe, deterministic, and step does not mutate its input', () => {
  for (const b of ['none', 'bcd', 'bootDriver', 'criticalProcess']) {
    const p = W({ winBreak: b });
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      assert.deepEqual(JSON.parse(JSON.stringify(next)), next);
      assert.deepEqual(kit.stateAt(logic, p, n), next);
      s = next;
    }
    assert.deepEqual(logic.step(s, 99, p), s, 'T4 holds for Windows');
  }
});

// ── the presets' numbers (SPEC.md) ──

test('normal: systemd-analyze 1.363 + 3.996 + 26.504 s, target after 8.130 s; times fill as stages finish', () => {
  assert.deepEqual(at({}, 3).t, { kernel: null, initrd: null, userspace: null, targetAt: null });
  assert.equal(at({}, 4).t.kernel, 1.363);
  assert.equal(at({}, 4).t.initrd, null);
  assert.equal(at({}, 5).t.initrd, 3.996);
  assert.equal(at({}, 6).t.userspace, null);
  assert.deepEqual(at({}, 7).t, { kernel: 1.363, initrd: 3.996, userspace: 26.504, targetAt: 8.13 });
  const t = logic.CHAINS.linux.timing;
  assert.equal(Math.round((t.kernel + t.initrd + t.userspace['multi-user']) * 1000), 31863);
});

test('every preset in the page: its steps and where it ends', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const want = { normal: [7, null], 'no-kernel': [3, 'loader'], 'no-driver': [5, 'initramfs'], 'wrong-uuid': [5, 'initramfs'], rescue: [7, 'target'],
    'win-normal': [7, null], 'win-no-bcd': [3, 'bootmgr'], 'win-no-driver': [5, 'kernel'], 'win-critical-service': [6, 'smss'] };
  const found = [...html.matchAll(/\{ id: '([\w-]+)', label: t\('\w+'\), params: (\{[^}]*\})/g)];
  assert.deepEqual(found.map((m) => m[1]), Object.keys(want));
  for (const m of found) {
    const params = Function('return ' + m[2])();
    const p = P(params);
    assert.equal(logic.steps(p), want[m[1]][0], m[1]);
    assert.equal(kit.stateAt(logic, p, logic.steps(p)).failedAt, want[m[1]][1], m[1]);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { break: 'rootUuid' }, { break: 'targetUnit', target: 'graphical' }]) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{}, { break: 'diskDriver' }]) {
    const p = P(over), steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ break: 'targetUnit' });
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

test('every string key the chain names exists in both tables', () => {
  for (const c of Object.values(logic.CHAINS)) {
    const keys = [];
    for (const s of c.stages) {
      keys.push(s.label, s.lives, s.hands);
      if (s.failState) keys.push('halt_' + s.failState);
      for (const n of s.needs) keys.push('need_' + n);
      for (const l of [].concat(s.screen || [], s.failText || [], Array.isArray(s.sub) ? s.sub : [])) if (typeof l !== 'string') keys.push(l.t);
      for (const f of [(s.does || {}).facts, (s.onFail || {}).facts]) {
        for (const parts of Object.values(f || {})) for (const x of parts) if (typeof x !== 'string' && !x.t.includes('{')) keys.push(x.t);
      }
    }
    for (const r of c.factRows || []) keys.push('wFact_' + r);
    for (const v of ['wDrvLoaded', 'wDrvNotLoaded']) if (c.breakKey === 'winBreak') keys.push(v);
    const pre = c.capPrefix || '';
    for (const b of c.breaks) keys.push('break_' + b, pre + 'capFail_' + b);
    for (const s of c.stages) keys.push(pre + 'capDone_' + s.id);
    for (const lines of Object.values(c.end)) for (const l of lines) if (typeof l !== 'string') keys.push(l.t);
    for (const k of keys) for (const lang of ['hr', 'en']) assert.ok(k in strings[lang], `${lang}.${k}`);
  }
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P()), 'meta.steps matches the default preset');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
