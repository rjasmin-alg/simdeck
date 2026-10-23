// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-namespaces: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers, then the
// template's generic block. Run: node --test sims/lnx-namespaces/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (scene, n) => kit.stateAt(logic, P({ scene }), n);
const FULL = { pid: true, fork: true, mountProc: true, net: true, mount: true };

/** Run one command on a copy of s, the way a step does. */
function run(s, cmd) {
  const t = structuredClone(s);
  logic.blank(t);
  t.cmd = cmd;
  t.event.op = cmd.op;
  const before = structuredClone(t);
  logic.apply(t, cmd);
  logic.mark(before, t, logic.collect(t));
  return t;
}
const fresh = () => logic.initialOf('full');
const started = (flags) => run(fresh(), { on: 'h1', op: 'unshare', flags: flags || FULL });
const pids = (v) => v.procs.map((r) => r.pid);
const names = (v) => v.procs.map((r) => r.name + ' ' + r.pid);
const byName = (s, name) => s.procs.filter((p) => p.alive && p.name === name).pop();

// ── tie-breaks ──

test('tie-break: processes are listed by PID as a number in the viewing namespace', () => {
  const s = fresh();
  s.procs.push({ id: 'p9', name: 'late', pidByNs: { host: 900 }, nsPid: 'host', nsNet: 'host', nsMnt: 'host', parent: 'p1', handles: [], alive: true, ran: false });
  s.procs.push({ id: 'p8', name: 'early', pidByNs: { host: 10 }, nsPid: 'host', nsNet: 'host', nsMnt: 'host', parent: 'p1', handles: [], alive: true, ran: false });
  assert.deepEqual(pids(logic.view(s, 'host')), [1, 10, 900, 4200, 4300], 'numbers, not strings: 900 before 4200');
});

test('tie-break: an equal PID is ordered by internal id', () => {
  const s = fresh();
  s.procs.push({ id: 'p0', name: 'twin', pidByNs: { host: 4300 }, nsPid: 'host', nsNet: 'host', nsMnt: 'host', parent: 'p1', handles: [], alive: true, ran: false });
  assert.deepEqual(logic.visible(s, 'host').map((r) => r.id), ['p1', 'p2', 'p0', 'p3']);
});

test('tie-break: the container lists by its own numbers, not the host\'s', () => {
  let s = run(started(), { on: 'c', op: 'bg', name: 'sleep' });
  const sleep = byName(s, 'sleep');
  sleep.pidByNs.c1 = 7;                       // reorder inside only: host 4322 stays after 4321
  byName(s, 'bash').pidByNs.c1 = 9;
  s = structuredClone(s);
  assert.deepEqual(names(logic.view(s, 'container')), ['sleep 7', 'bash 9']);
  assert.deepEqual(logic.view(s, 'host').procs.slice(-2).map((r) => r.pid), [4321, 4322]);
});

// ── rules ──

test('rule 1: the host sees the container\'s processes under its own numbers; the container sees only its own', () => {
  const s = run(started(), { on: 'c', op: 'bg', name: 'sleep' });
  const host = logic.view(s, 'host'), c = logic.view(s, 'container');
  assert.deepEqual(names(c), ['bash 1', 'sleep 2']);
  assert.deepEqual(host.procs.filter((r) => r.inner != null).map((r) => [r.pid, r.inner]), [[4321, 1], [4322, 2]]);
  assert.deepEqual(byName(s, 'sleep').pidByNs, { host: 4322, c1: 2 }, 'a PID in every namespace up to the root');
  const fromC = run(s, { on: 'c', op: 'kill', pid: 4300, sig: 'TERM' });
  assert.equal(fromC.lastError, 'ESRCH');
  assert.deepEqual(fromC.out, ['bash: kill: (4300) - No such process']);
  const fromHost = run(s, { on: 'h2', op: 'kill', pid: 4322, sig: 'TERM' });
  assert.equal(fromHost.lastError, null);
  assert.equal(byName(fromHost, 'sleep'), undefined, 'the host reaches it');
});

test('rule 1: nested namespaces: a PID in every namespace up to the root, each sees everything below it', () => {
  const s = run(started(), { on: 'c', op: 'unshare', flags: { pid: true, fork: true } });   // a container in the container
  const inner = logic.proc(s, s.container);
  assert.deepEqual(logic.chain(s, inner.nsPid), ['c2', 'c1', 'host']);
  assert.deepEqual(inner.pidByNs, { c2: 1, c1: 3, host: 4323 });
  assert.ok(logic.visible(s, 'c1').some((r) => r.id === inner.id && r.pid === 3), 'the outer container sees it as 3');
  assert.deepEqual(logic.visible(s, 'c2').map((r) => r.pid), [1], 'the inner one sees only itself');
});

test('rule 2: the first process in a new namespace is PID 1 and its init; orphans go to the init', () => {
  const s = started();
  const bash = byName(s, 'bash');
  assert.equal(bash.pidByNs.c1, 1);
  assert.equal(logic.pidNs(s, 'c1').init, bash.id);
  let t = run(s, { on: 'c', op: 'bg', name: 'sleep' });
  assert.equal(byName(t, 'sleep').pidByNs.c1, 2);
  // a child of sleep, then sleep ends: the child goes to bash (PID 1 of c1), not to systemd
  const sleep = byName(t, 'sleep');
  const kid = logic.spawn(t, sleep, 'worker');
  logic.end(t, sleep, 'exit');
  assert.equal(kid.parent, bash.id);
  // a host process that dies leaves its children to systemd
  const u = byName(t, 'unshare');
  logic.end(t, u, 'exit');
  assert.equal(byName(t, 'bash').parent, 'p1');
});

test('rule 3: unshare --pid without --fork does not move the caller; its next child is PID 1', () => {
  let s = run(fresh(), { on: 'h1', op: 'unshare', flags: { pid: true } });
  const sh = logic.proc(s, s.container);
  assert.equal(sh.nsPid, 'host');
  assert.equal(sh.forChildren, 'c1');
  assert.equal(sh.pidByNs.host, 4320);
  assert.deepEqual(run(s, { on: 'c', op: 'echo' }).out, ['4320']);
  s = run(s, { on: 'c', op: 'ls' });
  assert.equal(s.event.pid, 1);
  assert.equal(s.event.init, true);
  // with --fork, unshare stays in the host's PID namespace but moves into the new net and mount namespaces
  const f = started();
  const u = byName(f, 'unshare');
  assert.deepEqual([u.nsPid, u.nsNet, u.nsMnt], ['host', 'c1', 'c1']);
  assert.equal(byName(f, 'bash').nsPid, 'c1');
});

test('rule 4: when PID 1 exits, the kernel kills the rest and the namespace takes no new process', () => {
  let s = run(started(), { on: 'c', op: 'bg', name: 'sleep' });
  s = run(s, { on: 'h2', op: 'kill', pid: 4321, sig: 'KILL' });
  assert.deepEqual(s.event.zapped, [byName(at('kill-init', 2), 'sleep').id]);
  assert.equal(s.procs.filter((p) => p.alive && p.nsPid === 'c1').length, 0);
  assert.equal(s.container, null);
  assert.ok(s.changed.includes('ns:pid:c1'));
  // no-fork: init (ls) exits, then fork fails with ENOMEM
  let n = run(fresh(), { on: 'h1', op: 'unshare', flags: { pid: true } });
  n = run(n, { on: 'c', op: 'ls' });
  assert.equal(logic.pidNs(n, 'c1').dead, true);
  n = run(n, { on: 'c', op: 'ls' });
  assert.equal(n.lastError, 'ENOMEM');
  assert.deepEqual(n.out, ['bash: fork: Cannot allocate memory']);
  // a new namespace with no init yet is not closed: its first process is init
  const ok = run(run(fresh(), { on: 'h1', op: 'unshare', flags: { pid: true } }), { on: 'c', op: 'ls' });
  assert.equal(ok.lastError, null);
});

test('rule 5: init gets only handled signals from inside; from the host SIGKILL and SIGSTOP are always delivered', () => {
  const s = run(started(), { on: 'c', op: 'bg', name: 'sleep' });
  for (const sig of ['USR1', 'KILL']) {
    const t = run(s, { on: 'c', op: 'kill', pid: 1, sig });
    assert.equal(t.event.kill.result, 'dropped', 'from inside: ' + sig);
    assert.equal(t.event.kill.inside, true);
    assert.ok(byName(t, 'bash'), 'bash still runs');
  }
  const usr = run(s, { on: 'h2', op: 'kill', pid: 4321, sig: 'USR1' });
  assert.equal(usr.event.kill.result, 'dropped', 'from the host too, unless KILL or STOP');
  assert.equal(usr.event.kill.inside, false);
  for (const sig of ['KILL', 'STOP']) assert.equal(run(s, { on: 'h2', op: 'kill', pid: 4321, sig }).event.kill.result, 'killed', sig);
  // a handler changes it: the signal is delivered and handled
  const h = structuredClone(s);
  byName(h, 'bash').handles.push('USR1');
  assert.equal(run(h, { on: 'c', op: 'kill', pid: 1, sig: 'USR1' }).event.kill.result, 'handled');
  // a process that is not init dies of the same signal from inside
  assert.equal(run(s, { on: 'c', op: 'kill', pid: 2, sig: 'USR1' }).event.kill.result, 'killed');
  // an interactive bash ignores SIGTERM, init or not: that is not rule 5
  assert.equal(run(s, { on: 'c', op: 'kill', pid: 1, sig: 'TERM' }).event.kill.result, 'ignored');
  assert.equal(run(s, { on: 'h2', op: 'kill', pid: 4300, sig: 'TERM' }).event.kill.result, 'ignored');
});

test('rule 6: ps lists the PID namespace of the procfs mounted in the reader\'s mount namespace', () => {
  const plain = run(started({ pid: true, fork: true }), { on: 'c', op: 'ps' });
  assert.equal(plain.out[1], '      1 systemd');
  assert.ok(plain.out.includes('   4321 bash'), 'the shell itself, under its host PID');
  assert.deepEqual(run(started({ pid: true, fork: true }), { on: 'c', op: 'echo' }).out, ['1']);
  assert.equal(logic.view(plain, 'container').procFrom, 'host');
  const fixed = run(started({ pid: true, fork: true, mountProc: true }), { on: 'c', op: 'ps' });
  assert.deepEqual(fixed.out, ['    PID COMMAND', '      1 bash', '      2 ps']);
  assert.equal(logic.view(fixed, 'container').procFrom, 'c1');
  assert.ok(logic.mntNs(fixed, 'c1'), '--mount-proc implies --mount');
  assert.equal(logic.view(fixed, 'host').procFrom, 'host', 'the host\'s /proc is untouched');
});

test('rule 7: a new network namespace holds only lo, down; the host keeps lo and eth0', () => {
  const s = run(started(), { on: 'c', op: 'ip' });
  assert.deepEqual(s.out, ['lo               DOWN           00:00:00:00:00:00 <LOOPBACK>']);
  assert.deepEqual(logic.view(s, 'container').ifaces.map((i) => [i.name, i.up]), [['lo', false]]);
  assert.deepEqual(logic.view(s, 'host').ifaces.map((i) => [i.name, i.up]), [['lo', true], ['eth0', true]]);
  const noNet = started({ pid: true, fork: true });
  assert.equal(logic.view(noNet, 'container').ns.net, 'host', 'without --net the container shares the host\'s');
});

test('rule 8: a new mount namespace is a copy; later mounts stay on their side', () => {
  let s = started();
  assert.deepEqual(logic.mntNs(s, 'c1').mounts.map((m) => m.target), logic.mntNs(s, 'host').mounts.map((m) => m.target));
  assert.equal(logic.mntNs(s, 'c1').propagation, 'private');
  s = run(s, { on: 'c', op: 'mount', fstype: 'tmpfs', src: 'tmp', target: '/mnt' });
  assert.deepEqual(run(s, { on: 'c', op: 'findmnt', target: '/mnt' }).out, ['TARGET SOURCE FSTYPE OPTIONS', '/mnt   tmp    tmpfs  rw,relatime,inode64']);
  assert.deepEqual(run(s, { on: 'h2', op: 'findmnt', target: '/mnt' }).out, []);
  // and the other way: a host mount after the copy is not seen inside
  const h = run(s, { on: 'h2', op: 'mount', fstype: 'tmpfs', src: 'hosttmp', target: '/srv' });
  assert.deepEqual(run(h, { on: 'c', op: 'findmnt', target: '/srv' }).out, []);
});

test('namespaces go when nothing holds them; the waiting unshare exits with its child', () => {
  const s = run(started(), { on: 'c', op: 'exit' });
  assert.deepEqual([s.ns.pid, s.ns.net, s.ns.mnt].map((l) => l.map((n) => n.id)), [['host'], ['host'], ['host']]);
  assert.equal(byName(s, 'unshare'), undefined);
  // no-fork: the closed namespace lives while the shell would fork into it
  let n = run(run(fresh(), { on: 'h1', op: 'unshare', flags: { pid: true } }), { on: 'c', op: 'ls' });
  assert.ok(logic.pidNs(n, 'c1'));
  n = run(n, { on: 'c', op: 'exit' });
  assert.equal(logic.pidNs(n, 'c1'), null);
  // a procfs mounted in a live mount namespace holds its PID namespace
  const m = started();
  m.procs.push({ id: 'p99', name: 'holder', pidByNs: { host: 5000 }, nsPid: 'host', nsNet: 'host', nsMnt: 'c1', parent: 'p1', handles: [], alive: true, ran: false });
  const k = run(m, { on: 'c', op: 'exit' });
  assert.ok(logic.pidNs(k, 'c1'), 'held by /proc in c1');
  assert.ok(logic.mntNs(k, 'c1'));
});

test('marks: rows that appear, go or get a new PID; a command\'s own process is not "gone" the step after', () => {
  const s3 = at('full', 3);
  const ps = byName(at('full', 3), 'ps') || s3.procs.find((p) => p.name === 'ps');
  assert.ok(s3.changed.includes('container:proc:' + ps.id) && s3.changed.includes('host:proc:' + ps.id));
  assert.deepEqual(at('full', 4).gone, { host: [], container: [] });
  const k = at('kill-init', 6);
  assert.deepEqual(k.gone.host.map((r) => r.name + ' ' + r.pid), ['unshare 4320', 'bash 4321', 'sleep 4322']);
  assert.ok(k.changed.includes('ns:pid:c1') && k.changed.includes('ns:net:c1') && k.changed.includes('ns:mnt:c1'));
  assert.ok(at('no-mount-proc', 5).changed.includes('container:mnt:/proc'), 'a fresh /proc marks the row');
  assert.deepEqual(at('full', 2).changed, [], 'a builtin changes nothing');
});

test('marks: a row whose PID changed in a view is marked, though it did not appear', () => {
  const a = started();
  const b = structuredClone(a);
  byName(b, 'bash').pidByNs.c1 = 5;
  logic.mark(a, b, []);
  assert.ok(b.changed.includes('container:proc:' + byName(b, 'bash').id));
  assert.ok(b.changed.includes('host:proc:' + byName(b, 'bash').id), 'the host shows the pair, so its row changed too');
  assert.ok(!b.changed.includes('host:proc:p1'));
});

test('rule 4: init exit kills the processes of nested namespaces too; a child namespace holds its parent', () => {
  let s = run(started(), { on: 'c', op: 'unshare', flags: { pid: true, fork: true } });
  const inner = logic.proc(s, s.container);
  s = run(s, { on: 'h2', op: 'kill', pid: 4321, sig: 'KILL' });
  assert.equal(logic.proc(s, inner.id).alive, false, 'the inner container\'s shell died with the outer init');
  // a child PID namespace keeps its parent alive while it has a member
  const keep = run(started(), { on: 'c', op: 'unshare', flags: { pid: true, fork: true } });
  keep.procs.forEach((p) => { if (p.nsPid === 'c1') p.alive = false; if (p.forChildren === 'c1') p.forChildren = null; });
  keep.procMountedFrom.c1 = 'host';                                          // and no procfs of c1 either
  logic.collect(keep);
  assert.ok(logic.pidNs(keep, 'c1'), 'c1 is held by c2');
});

test('rule 3: without --fork unshare execs bash: one process, renamed, same PID', () => {
  const s = run(fresh(), { on: 'h1', op: 'unshare', flags: { pid: true }, norc: true });
  const sh = logic.proc(s, s.container);
  assert.equal(sh.name, 'bash');
  assert.equal(s.procs.filter((p) => p.name === 'unshare').length, 0);
  assert.deepEqual(sh.ignores, ['TERM']);
});

test('rule 6: a new mount namespace without --mount-proc still shows the host\'s /proc', () => {
  const s = run(started({ pid: true, fork: true, mount: true }), { on: 'c', op: 'ps' });
  assert.equal(logic.view(s, 'container').ns.mnt, 'c1');
  assert.equal(logic.view(s, 'container').procFrom, 'host');
  assert.equal(s.out[1], '      1 systemd');
});

test('rule 4: a failed fork still moves every level\'s PID counter', () => {
  let n = run(run(fresh(), { on: 'h1', op: 'unshare', flags: { pid: true } }), { on: 'c', op: 'ls' });
  const next = logic.pidNs(n, 'host').next;
  n = run(n, { on: 'c', op: 'bg', name: 'sleep' });
  assert.equal(n.lastError, 'ENOMEM');
  assert.deepEqual(n.out, ['bash: fork: Cannot allocate memory']);
  assert.equal(logic.pidNs(n, 'host').next, next + 1);
});

test('outputs: ip, findmnt, exit, ls as the tools print them', () => {
  assert.deepEqual(at('full', 5).out, [
    'lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>',
    'eth0             UP             52:54:00:4a:1c:07 <BROADCAST,MULTICAST,UP,LOWER_UP>']);
  assert.deepEqual(logic.findmntLines({ target: '/very/long/target', src: 'x', fstype: 'proc' }),
    ['TARGET            SOURCE FSTYPE OPTIONS', '/very/long/target x      proc   rw,relatime']);
  assert.deepEqual(at('full', 7).out, ['TARGET SOURCE FSTYPE OPTIONS', '/mnt   tmp    tmpfs  rw,relatime,inode64']);
  assert.deepEqual(at('full', 9).out, ['exit']);
  assert.deepEqual(at('no-fork', 3).out, ['notes.txt']);
  // findmnt reports the top of two mounts on one target
  let s = run(started(), { on: 'c', op: 'mount', fstype: 'tmpfs', src: 'a', target: '/mnt' });
  s = run(s, { on: 'c', op: 'mount', fstype: 'tmpfs', src: 'b', target: '/mnt' });
  assert.equal(run(s, { on: 'c', op: 'findmnt', target: '/mnt' }).out[1].split(/ +/)[1], 'b');
});

test('roles: terminal 1 is bash 4300, terminal 2 bash 4200, c the container\'s shell', () => {
  const s = started();
  assert.equal(logic.who(s, 'h1').pidByNs.host, 4300);
  assert.equal(logic.who(s, 'h2').pidByNs.host, 4200);
  assert.equal(logic.who(s, 'c').pidByNs.c1, 1);
  assert.equal(at('one-way', 4).event.by, 'p2', 'the host kills sleep from terminal 2');
  assert.deepEqual(logic.SCENES['kill-init'].slice(3, 5).map((c) => [c.on, c.sig]), [['c', 'USR1'], ['c', 'KILL']]);
});

test('marks: up/down, a different /proc and a closed namespace are marked', () => {
  const a = started();
  const b = structuredClone(a);
  logic.netNs(b, 'c1').ifaces[0].up = true;
  logic.mark(a, b, []);
  assert.ok(b.changed.includes('container:iface:lo'));
  const c = structuredClone(a);
  c.procMountedFrom.c1 = 'host';
  logic.mark(a, c, []);
  assert.ok(c.changed.includes('container:mnt:/proc'));
  const d = structuredClone(a);
  logic.pidNs(d, 'c1').dead = true;
  logic.mark(a, d, []);
  assert.ok(d.changed.includes('ns:pid:c1'), 'closed when its init exits');
  assert.equal(logic.pidNs(at('one-way', 4), 'c1').killed, 1, 'a member killed (the page\'s caption)');
});

// ── presets ──

test('presets have 9, 5, 6, 7, 5 steps; full is the default', () => {
  assert.deepEqual(logic.SCENE_IDS, ['full', 'no-mount-proc', 'no-fork', 'kill-init', 'one-way']);
  assert.deepEqual(logic.SCENE_IDS.map((id) => logic.steps(P({ scene: id }))), [9, 5, 6, 7, 5]);
  assert.equal(logic.steps(logic.defaults), 9);
});

test('preset full: the task\'s numbers', () => {
  const s1 = at('full', 1);
  assert.deepEqual(names(logic.view(s1, 'host')).slice(-2), ['unshare 4320', 'bash 4321']);
  assert.deepEqual(names(logic.view(s1, 'container')), ['bash 1']);
  assert.deepEqual(at('full', 2).out, ['1']);
  assert.deepEqual(at('full', 3).out, ['    PID COMMAND', '      1 bash', '      2 ps']);
  assert.equal(at('full', 4).out.length, 1);
  assert.deepEqual(at('full', 5).out.map((l) => l.split(/ +/)[0]), ['lo', 'eth0']);
  assert.deepEqual(at('full', 8).out, []);
  const end = at('full', 9);
  assert.deepEqual(names(logic.view(end, 'host')), names(logic.view(at('full', 0), 'host')), 'the host lists nothing new');
  assert.equal(logic.view(end, 'container'), null);
});

test('preset no-mount-proc: $$ is 1 but ps lists the host; with --mount-proc only bash 1', () => {
  assert.deepEqual(at('no-mount-proc', 3).out, ['    PID COMMAND', '      1 systemd', '   4200 bash', '   4300 bash', '   4320 unshare', '   4321 bash', '   4322 ps']);
  const last = at('no-mount-proc', 5);
  assert.deepEqual(names(logic.view(last, 'container')), ['bash 1']);
  assert.equal(logic.view(last, 'container').ns.net, 'host');
});

test('preset no-fork: bash stays in the host, ls is PID 1, then fork fails', () => {
  assert.deepEqual(at('no-fork', 2).out, ['4320']);
  const ls = at('no-fork', 3);
  assert.deepEqual(logic.view(ls, 'host').procs.filter((r) => r.ran).map((r) => [r.name, r.pid, r.inner]), [['ls', 4321, 1]]);
  assert.equal(at('no-fork', 4).lastError, 'ENOMEM');
  assert.deepEqual(names(logic.view(at('no-fork', 6), 'container')).filter((x) => x.startsWith('bash')).pop(), 'bash 4324');
  assert.equal(logic.view(at('no-fork', 6), 'host').procs.find((r) => r.name === 'bash' && r.inner === 1).pid, 4324);
});

test('preset kill-init and one-way: the task\'s numbers', () => {
  assert.deepEqual(at('kill-init', 2).out, ['[1] 2']);
  assert.deepEqual(at('kill-init', 3).out, ['    PID COMMAND', '      1 bash', '      2 sleep', '      3 ps']);
  assert.deepEqual([4, 5].map((n) => at('kill-init', n).event.kill.result), ['dropped', 'dropped']);
  assert.deepEqual([4, 5].map((n) => at('kill-init', n).cmd.sig), ['USR1', 'KILL']);
  assert.deepEqual(at('kill-init', 7).out, ['bash: kill: (4322) - No such process']);
  assert.deepEqual(at('one-way', 3).out, ['bash: kill: (4300) - No such process']);
  assert.equal(at('one-way', 4).event.kill.result, 'killed');
  assert.deepEqual(at('one-way', 5).out, ['    PID COMMAND', '      1 bash', '      3 ps'], 'PIDs are not reused at once');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.SCENE_IDS) {
    const p = P({ scene: id });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of logic.SCENE_IDS) {
    const p = P({ scene: id, view: 'host' });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'kill-init' });
  const s0 = kit.stateAt(logic, p, 5);
  const copy = structuredClone(s0);
  logic.step(s0, 6, p);
  assert.deepEqual(s0, copy);
});

test('the view param does not change the model', () => {
  for (const view of ['host', 'container']) assert.deepEqual(kit.stateAt(logic, P({ view }), 6), kit.stateAt(logic, P({}), 6));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of logic.SCENE_IDS) assert.ok(html.includes(`'${id}'`), `preset ${id} on the page`);
});
