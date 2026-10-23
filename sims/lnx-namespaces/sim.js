/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-namespaces: PID, network and mount namespaces isolate one process tree. One step is one command from
   the preset's script, run by the host's first or second terminal or by the container's shell: show the command, apply
   it (create namespaces, fork, mount, kill, exit), recompute what the host and the container see, mark the rows that
   appeared, disappeared or got a new PID. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var HOST = 'host';
  /** The host's first free PID at the start (illustrative; every preset starts from it). */
  var HOST_NEXT = 4320;
  var MAC_ETH0 = '52:54:00:4a:1c:07';
  var MAC_LO = '00:00:00:00:00:00';
  /** Who runs a command: the host's terminal 1 (it starts the container), terminal 2, or the container's shell. */
  var ROLES = { h1: 'p3', h2: 'p2' };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function padR(x, n) { x = String(x); while (x.length < n) x += ' '; return x; }
  function padL(x, n) { x = String(x); while (x.length < n) x = ' ' + x; return x; }

  // ── looking things up ──

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function proc(s, id) { return byId(s.procs, id); }
  function pidNs(s, id) { return byId(s.ns.pid, id); }
  function netNs(s, id) { return byId(s.ns.net, id); }
  function mntNs(s, id) { return byId(s.ns.mnt, id); }
  /** A PID namespace and its ancestors up to the host's, innermost first. */
  function chain(s, id) { var out = []; for (var n = pidNs(s, id); n; n = n.parent ? pidNs(s, n.parent) : null) out.push(n.id); return out; }
  /** Rule 1: is namespace id the same as anc or below it? */
  function within(s, id, anc) { return chain(s, id).indexOf(anc) >= 0; }
  /** The process that is PID 1 of its own namespace, or null. */
  function isInit(s, p) { var n = pidNs(s, p.nsPid); return !!n && n.init === p.id; }
  function live(s) { return s.procs.filter(function (p) { return p.alive; }); }
  /** The process a role names: a host terminal, or the container's shell ('c'). */
  function who(s, role) { return proc(s, role === 'c' ? s.container : ROLES[role]); }

  // ── what a view sees ──

  /** Rule 1 and 9: processes a PID namespace sees, with its own PID numbers, sorted by that PID, then by id. Processes
      that ran during this step and have exited are listed too (ran: true). */
  function visible(s, ns) {
    return s.procs.filter(function (p) { return p.pidByNs[ns] != null && (p.alive || p.ran); })
      .map(function (p) {
        return { id: p.id, name: p.name, pid: p.pidByNs[ns], inner: p.nsPid !== ns ? p.pidByNs[p.nsPid] : null,
          nsPid: p.nsPid, nsNet: p.nsNet, nsMnt: p.nsMnt, forChildren: p.forChildren, parent: p.parent, ran: p.ran };
      })
      .sort(function (a, b) { return a.pid - b.pid || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
  }
  /** The namespaces a side looks through: the host's, or those of the container's shell. null: no container. */
  function viewer(s, side) {
    if (side === HOST) return { pid: HOST, net: HOST, mnt: HOST, self: null };
    var c = proc(s, s.container);
    if (!c) return null;
    return { pid: c.nsPid, net: c.nsNet, mnt: c.nsMnt, self: c.id };
  }
  /** Rule 6: ps reads /proc, and /proc shows the PID namespace of the procfs mounted in the viewer's mount namespace. */
  function view(s, side) {
    var v = viewer(s, side);
    if (!v) return null;
    var from = s.procMountedFrom[v.mnt];
    var me = v.self ? proc(s, v.self) : null;
    return {
      ns: { pid: v.pid, net: v.net, mnt: v.mnt }, procFrom: from,
      self: me ? { id: me.id, name: me.name, pid: me.pidByNs[me.nsPid] } : null,
      procs: visible(s, from),
      ifaces: clone(netNs(s, v.net).ifaces),
      mounts: mntNs(s, v.mnt).mounts.map(function (m) { var r = clone(m); if (m.fstype === 'proc') r.pidns = from; return r; })
    };
  }
  /** Row keys of a view, for marking: proc:<id> (with its PID), iface:<name> (with up), mnt:<target> (with what it shows). */
  function rowsOf(v) {
    var out = {};
    if (!v) return out;
    v.procs.forEach(function (r) { out['proc:' + r.id] = { sig: r.pid + '/' + r.inner, row: r }; });
    v.ifaces.forEach(function (r) { out['iface:' + r.name] = { sig: String(r.up), row: r }; });
    v.mounts.forEach(function (r) { out['mnt:' + r.target] = { sig: r.src + '/' + r.fstype + '/' + (r.pidns || ''), row: r }; });
    return out;
  }

  // ── building the state ──

  function initialOf(scene) {
    return {
      scene: scene,
      ns: {
        pid: [{ id: HOST, parent: null, init: 'p1', next: HOST_NEXT, dead: false }],
        net: [{ id: HOST, ifaces: [{ name: 'lo', up: true, mac: MAC_LO, loopback: true }, { name: 'eth0', up: true, mac: MAC_ETH0 }] }],
        mnt: [{ id: HOST, propagation: 'shared', mounts: [
          { target: '/', fstype: 'xfs', src: '/dev/vda4' }, { target: '/proc', fstype: 'proc', src: 'proc' }, { target: '/run', fstype: 'tmpfs', src: 'tmpfs' }] }]
      },
      procs: [
        { id: 'p1', name: 'systemd', pidByNs: { host: 1 }, nsPid: HOST, nsNet: HOST, nsMnt: HOST, forChildren: null, parent: null, handles: [], alive: true, ran: false, waitsFor: null },
        { id: 'p2', name: 'bash', pidByNs: { host: 4200 }, nsPid: HOST, nsNet: HOST, nsMnt: HOST, forChildren: null, parent: 'p1', handles: [], ignores: ['TERM'], alive: true, ran: false, waitsFor: null },
        { id: 'p3', name: 'bash', pidByNs: { host: 4300 }, nsPid: HOST, nsNet: HOST, nsMnt: HOST, forChildren: null, parent: 'p1', handles: [], ignores: ['TERM'], alive: true, ran: false, waitsFor: null }
      ],
      procMountedFrom: { host: HOST },
      container: null,
      nextProc: 4, nextNs: 1,
      cmd: null, out: [], lastError: null, changed: [], gone: { host: [], container: [] }, event: { op: null }
    };
  }

  /** Before each step: the processes that ran in the previous one are gone, and the step's own fields are cleared. */
  function blank(s) {
    s.procs = s.procs.filter(function (p) { return p.alive; });
    s.cmd = null; s.out = []; s.lastError = null; s.changed = []; s.gone = { host: [], container: [] }; s.event = { op: null };
  }

  // ── the kernel's part ──

  /** fork(): the child enters the parent's namespace for children (rules 2, 3) and gets a PID in it and in every
      ancestor; the first process in a namespace is its init. A namespace whose init has exited takes no new process:
      null, ENOMEM (rule 4). Net and mount namespaces are inherited. */
  function spawn(s, parent, name) {
    var target = parent.forChildren || parent.nsPid;
    var ns = pidNs(s, target);
    var pids = {};
    // every level's counter moves before the kernel checks that the namespace still takes processes
    chain(s, target).forEach(function (nid) { var n = pidNs(s, nid); pids[nid] = n.next++; });
    if (ns.dead) return null;
    var id = 'p' + s.nextProc++;
    if (!ns.init) ns.init = id;
    var p = { id: id, name: name, pidByNs: pids, nsPid: target, nsNet: parent.nsNet, nsMnt: parent.nsMnt, forChildren: null,
      parent: parent.id, handles: [], ignores: name === 'bash' ? ['TERM'] : [], alive: true, ran: false, waitsFor: null };
    s.procs.push(p);
    return p;
  }

  /** A process ends (exit or a fatal signal). A command's own process stays listed for this step as ran. */
  function end(s, p, how) {
    if (!p.alive) return;
    p.alive = false;
    (s.event.ended = s.event.ended || []).push({ id: p.id, how: how });
    var ns = pidNs(s, p.nsPid);
    if (how !== 'exit') ns.killed = (ns.killed || 0) + 1;      // a member ended by a signal (the page's captions)
    // rule 4: PID 1 has gone, so the kernel kills every other process in its namespace (and below) and closes it
    if (ns.init === p.id && ns.id !== HOST) {
      ns.dead = true;
      live(s).forEach(function (q) { if (within(s, q.nsPid, ns.id)) { (s.event.zapped = s.event.zapped || []).push(q.id); end(s, q, 'zap'); } });
    }
    // rule 2: orphans go to the init of the dying process's namespace
    live(s).forEach(function (q) { if (q.parent === p.id) q.parent = pidNs(s, p.nsPid).init; });
    // a waiting parent (unshare --fork) exits when its child does
    live(s).forEach(function (q) { if (q.waitsFor === p.id) end(s, q, 'exit'); });
    if (s.container === p.id) s.container = null;
  }

  /** A namespace lives while something holds it: a member process, a parent that will fork into it, a child namespace,
      or (PID) a procfs mounted in a live mount namespace. Unheld ones are gone; the host's never go. */
  function collect(s) {
    var gone = [];
    for (var again = true; again;) {
      again = false;
      var procs = live(s);
      s.ns.mnt = s.ns.mnt.filter(function (n) {
        var keep = n.id === HOST || procs.some(function (p) { return p.nsMnt === n.id; });
        if (!keep) { gone.push('mnt:' + n.id); delete s.procMountedFrom[n.id]; again = true; }
        return keep;
      });
      s.ns.net = s.ns.net.filter(function (n) {
        var keep = n.id === HOST || procs.some(function (p) { return p.nsNet === n.id; });
        if (!keep) { gone.push('net:' + n.id); again = true; }
        return keep;
      });
      var held = {};
      procs.forEach(function (p) { held[p.nsPid] = true; if (p.forChildren) held[p.forChildren] = true; });
      Object.keys(s.procMountedFrom).forEach(function (m) { held[s.procMountedFrom[m]] = true; });
      s.ns.pid.forEach(function (n) { if (n.parent && held[n.id]) held[n.parent] = true; });
      s.ns.pid = s.ns.pid.filter(function (n) {
        var keep = n.id === HOST || held[n.id];
        if (!keep) { gone.push('pid:' + n.id); again = true; }
        return keep;
      });
    }
    return gone;
  }

  /** Rules 1, 5: deliver a signal from a process to a PID as the sender's namespace numbers it. */
  function signal(s, from, pid, sig) {
    var target = live(s).filter(function (p) { return p.pidByNs[from.nsPid] === pid; })[0];
    if (!target) return { result: 'ESRCH' };
    var handled = target.handles.indexOf(sig) >= 0;
    // an ignored signal is dropped first, init or not (an interactive bash ignores SIGTERM)
    if (!handled && (target.ignores || []).indexOf(sig) >= 0 && sig !== 'KILL' && sig !== 'STOP') return { result: 'ignored', target: target.id };
    if (isInit(s, target) && !handled) {
      var inside = within(s, from.nsPid, target.nsPid);
      // inside the namespace (the init itself included): only a handled signal; from an ancestor: also KILL and STOP
      if (inside || (sig !== 'KILL' && sig !== 'STOP')) return { result: 'dropped', target: target.id, inside: inside };
    }
    if (handled) return { result: 'handled', target: target.id };
    end(s, target, sig);
    return { result: 'killed', target: target.id };
  }

  // ── command output, as the tools print it ──

  function psLines(rows) { return ['    PID COMMAND'].concat(rows.map(function (r) { return padL(r.pid, 7) + ' ' + r.name; })); }
  function ipLines(ifaces) {
    return ifaces.map(function (i) {
      var state = !i.up ? 'DOWN' : i.loopback ? 'UNKNOWN' : 'UP';
      var flags = i.loopback ? (i.up ? '<LOOPBACK,UP,LOWER_UP>' : '<LOOPBACK>') : (i.up ? '<BROADCAST,MULTICAST,UP,LOWER_UP>' : '<BROADCAST,MULTICAST>');
      return padR(i.name, 16) + ' ' + padR(state, 14) + ' ' + i.mac + ' ' + flags;
    });
  }
  function findmntLines(m) {
    var cols = [['TARGET', m.target], ['SOURCE', m.src], ['FSTYPE', m.fstype], ['OPTIONS', m.fstype === 'tmpfs' ? 'rw,relatime,inode64' : 'rw,relatime']];
    var w = cols.map(function (c) { return Math.max(c[0].length, c[1].length); });
    return [0, 1].map(function (row) { return cols.map(function (c, i) { return i < cols.length - 1 ? padR(c[row], w[i]) : c[row]; }).join(' '); });
  }
  var FORK_FAIL = 'bash: fork: Cannot allocate memory';

  // ── one command ──

  /** Run an external command: fork from the shell (or fail with ENOMEM), let it work, and it exits. */
  function external(s, by, name, work) {
    var p = spawn(s, by, name);
    if (!p) { s.lastError = 'ENOMEM'; s.out = [FORK_FAIL]; return null; }
    s.event.ran = p.id;
    if (work) work(p);
    if (p.alive) { end(s, p, 'exit'); p.ran = true; }
    return p;
  }

  function apply(s, cmd) {
    var by = who(s, cmd.on);
    var ev = s.event;
    ev.by = by.id;
    switch (cmd.op) {
      case 'unshare': {
        var f = cmd.flags;
        var u = spawn(s, by, 'unshare');
        var tag = 'c' + s.nextNs++;
        ev.made = [];
        if (f.mount || f.mountProc) {                    // rule 8: a copy of the caller's table; private propagation
          s.ns.mnt.push({ id: tag, propagation: 'private', mounts: clone(mntNs(s, u.nsMnt).mounts) });
          s.procMountedFrom[tag] = s.procMountedFrom[u.nsMnt];
          u.nsMnt = tag; ev.made.push('mnt');
        }
        if (f.net) {                                     // rule 7: only lo, and down
          s.ns.net.push({ id: tag, ifaces: [{ name: 'lo', up: false, mac: MAC_LO, loopback: true }] });
          u.nsNet = tag; ev.made.push('net');
        }
        if (f.pid) {                                     // rule 3: the caller stays; its next child goes in
          s.ns.pid.push({ id: tag, parent: u.nsPid, init: null, next: 1, dead: false });
          u.forChildren = tag; ev.made.push('pid');
        }
        ev.unshare = u.id;
        if (f.fork) {
          var child = spawn(s, u, 'bash');
          u.waitsFor = child.id;
          if (f.mountProc) s.procMountedFrom[child.nsMnt] = child.nsPid;   // rule 6: a fresh /proc for the new namespace
          s.container = child.id;
        } else {
          u.name = 'bash'; u.ignores = ['TERM'];        // exec: the same process, the same PID
          s.container = u.id;
        }
        return;
      }
      case 'echo':
        s.out = [String(by.pidByNs[by.nsPid])];
        ev.pid = by.pidByNs[by.nsPid];
        return;
      case 'ps':
        external(s, by, 'ps', function () { s.out = psLines(visible(s, s.procMountedFrom[by.nsMnt])); ev.procFrom = s.procMountedFrom[by.nsMnt]; });
        return;
      case 'ip':
        external(s, by, 'ip', function () { s.out = ipLines(netNs(s, by.nsNet).ifaces); });
        return;
      case 'mount':
        external(s, by, 'mount', function () {
          var tab = mntNs(s, by.nsMnt).mounts;
          tab.push({ target: cmd.target, fstype: cmd.fstype, src: cmd.src });
          ev.mnt = by.nsMnt;
        });
        return;
      case 'findmnt':
        external(s, by, 'findmnt', function () {
          var m = mntNs(s, by.nsMnt).mounts.filter(function (x) { return x.target === cmd.target; }).pop();
          s.out = m ? findmntLines(m) : [];
          ev.found = !!m;
        });
        return;
      case 'ls':
        external(s, by, 'ls', function (p) { s.out = ['notes.txt']; ev.pid = p.pidByNs[p.nsPid]; ev.init = isInit(s, p); });
        return;
      case 'bg': {
        var bg = spawn(s, by, cmd.name);
        if (!bg) { s.lastError = 'ENOMEM'; s.out = [FORK_FAIL]; return; }
        s.out = ['[1] ' + bg.pidByNs[by.nsPid]];
        ev.started = bg.id;
        return;
      }
      case 'kill': {
        var r = signal(s, by, cmd.pid, cmd.sig);
        ev.kill = r;
        if (r.result === 'ESRCH') { s.lastError = 'ESRCH'; s.out = ['bash: kill: (' + cmd.pid + ') - No such process']; }
        return;
      }
      case 'exit':
        s.out = ['exit'];
        end(s, by, 'exit');
        return;
    }
  }

  /** Phases 3 and 4: what each side sees now against before; rows that appeared, went or got a new PID. */
  function mark(before, s, gone) {
    var changed = [], lost = { host: [], container: [] };
    [HOST, 'container'].forEach(function (side) {
      var a = rowsOf(view(before, side)), b = rowsOf(view(s, side));
      Object.keys(b).forEach(function (k) { if (!a[k] || a[k].sig !== b[k].sig) changed.push(side + ':' + k); });
      Object.keys(a).forEach(function (k) { if (!b[k]) lost[side].push(a[k].row); });
    });
    gone.forEach(function (g) { changed.push('ns:' + g); });
    ['pid', 'net', 'mnt'].forEach(function (kind) {
      s.ns[kind].forEach(function (n) {
        var old = byId(before.ns[kind], n.id);
        if (!old || (kind === 'pid' && (old.dead !== n.dead || old.init !== n.init))) changed.push('ns:' + kind + ':' + n.id);
      });
    });
    s.changed = changed;
    s.gone = lost;
  }

  /** The scripts (SPEC.md "Presets"): 9, 5, 6, 7, 5 commands. on: h1 / h2 host terminals, c the container's shell. */
  var FULL = { pid: true, fork: true, mountProc: true, net: true, mount: true };
  var SCENES = {
    full: [
      { on: 'h1', op: 'unshare', flags: FULL }, { on: 'c', op: 'echo' }, { on: 'c', op: 'ps' }, { on: 'c', op: 'ip' },
      { on: 'h2', op: 'ip' }, { on: 'c', op: 'mount', fstype: 'tmpfs', src: 'tmp', target: '/mnt' },
      { on: 'c', op: 'findmnt', target: '/mnt' }, { on: 'h2', op: 'findmnt', target: '/mnt' }, { on: 'c', op: 'exit' }],
    'no-mount-proc': [
      { on: 'h1', op: 'unshare', flags: { pid: true, fork: true } }, { on: 'c', op: 'echo' }, { on: 'c', op: 'ps' },
      { on: 'c', op: 'exit' }, { on: 'h1', op: 'unshare', flags: { pid: true, fork: true, mountProc: true } }],
    'no-fork': [
      { on: 'h1', op: 'unshare', flags: { pid: true }, norc: true }, { on: 'c', op: 'echo' }, { on: 'c', op: 'ls' }, { on: 'c', op: 'ls' },
      { on: 'c', op: 'exit' }, { on: 'h1', op: 'unshare', flags: { pid: true, fork: true } }],
    'kill-init': [
      { on: 'h1', op: 'unshare', flags: FULL }, { on: 'c', op: 'bg', name: 'sleep' }, { on: 'c', op: 'ps' },
      { on: 'c', op: 'kill', pid: 1, sig: 'USR1', flag: '-USR1' }, { on: 'c', op: 'kill', pid: 1, sig: 'KILL', flag: '-KILL' },
      { on: 'h2', op: 'kill', pid: 4321, sig: 'KILL', flag: '-9' }, { on: 'h2', op: 'kill', pid: 4322, sig: 'TERM' }],
    'one-way': [
      { on: 'h1', op: 'unshare', flags: FULL }, { on: 'c', op: 'bg', name: 'sleep' }, { on: 'c', op: 'kill', pid: 4300, sig: 'TERM' },
      { on: 'h2', op: 'kill', pid: 4322, sig: 'TERM' }, { on: 'c', op: 'ps' }]
  };
  var SCENE_IDS = Object.keys(SCENES);
  function sceneOf(p) { return SCENES[p.scene] ? p.scene : 'full'; }

  function stepOf(s, n, p) {
    var t = clone(s);
    blank(t);
    var cmd = clone(SCENES[sceneOf(p)][n - 1]);
    t.cmd = cmd;
    t.event.op = cmd.op;
    var before = clone(t);
    apply(t, cmd);
    mark(before, t, collect(t));
    return t;
  }

  var logic = {
    /** Parameter defaults (task: preset full, view both). */
    defaults: { scene: 'full', view: 'both' },

    /** One step per scripted command (SPEC.md: 9, 5, 6, 7, 5). */
    steps: function (p) { return SCENES[sceneOf(p || {})].length; },

    initial: function (p) { return initialOf(sceneOf(p)); },
    step: function (s, n, p) { return stepOf(s, n, p); },

    // pure helpers, for the page and the tests
    SCENES: SCENES, SCENE_IDS: SCENE_IDS, HOST: HOST, ROLES: ROLES,
    proc: proc, pidNs: pidNs, netNs: netNs, mntNs: mntNs, chain: chain, within: within, isInit: isInit, who: who,
    visible: visible, view: view, rowsOf: rowsOf, spawn: spawn, end: end, collect: collect, signal: signal,
    apply: apply, mark: mark, blank: blank, psLines: psLines, ipLines: ipLines, findmntLines: findmntLines, initialOf: initialOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
