/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-selinux-decision: a second, label-based check after permissions. A process tries one access; the
   permission check (DAC) runs first, then the SELinux policy is looked up by the type pair, then the mode decides
   whether a "no" from the policy is enforced. Actions between attempts change a label or the mode, and the access is
   tried again. Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Security contexts as UL ch15 prints them (`ps -eZ`, `id -Z`, `ls -Z`, the AVC record). */
  var CTX_SSHD = 'system_u:system_r:sshd_t:s0-s0:c0.c1023';
  var CTX_USER = 'unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023';

  /** A small excerpt of the allow rules: `allow source_t target_t:class perm` (row 1 and 2 from UL ch15; 3, 4 derived). */
  var POLICY = [
    { src: 'sshd_t', tgt: 'ssh_port_t', tclass: 'tcp_socket', perm: 'name_bind' },
    { src: 'sshd_t', tgt: 'ssh_home_t', tclass: 'file', perm: 'read' },
    { src: 'sshd_t', tgt: 'etc_t', tclass: 'file', perm: 'read' },
    { src: 'unconfined_t', tgt: 'user_tmp_t', tclass: 'file', perm: 'read' }
  ];

  /** Port labels on the book machine (UL ch15, `semanage port -l`, the AVC's tcontext): only 22 is ssh_port_t. */
  var PORT_LABELS = { 22: 'ssh_port_t', 8991: 'unreserved_port_t' };

  /** User names by UID (data). */
  var USERS = { 0: 'root', 1000: 'student', 1001: 'ana' };

  /** The type a new file gets in a place, and what restorecon resets it to (rule 7; UL ch15 "Šire o temi"). */
  function defaultType(path) {
    if (/^~\/\.ssh\//.test(path)) return 'ssh_home_t';
    if (/^\/tmp\//.test(path)) return 'user_tmp_t';
    if (/^~\//.test(path)) return 'user_home_t';
    return 'etc_t';
  }

  /** The type field of user:role:type[:range] (rule 3): the only field the decision uses. */
  function typeOf(context) { return String(context).split(':')[2]; }
  function withType(context, type) { var f = String(context).split(':'); f[2] = type; return f.join(':'); }

  var KEYS = '~/.ssh/authorized_keys';
  var SECRET = '/tmp/plan.txt';

  /** The three scenes: who tries what on which object (UL ch15; `secret` derived). */
  var SCENES = {
    port: { proc: { comm: 'sshd', uid: 0, scontext: CTX_SSHD }, perm: 'name_bind', tclass: 'tcp_socket', port: 8991, pre: [] },
    keys: { proc: { comm: 'sshd', uid: 1000, scontext: CTX_SSHD }, perm: 'read', tclass: 'file', path: KEYS, pre: ['cp', 'mv'] },
    secret: { proc: { comm: 'cat', uid: 1000, scontext: CTX_USER }, perm: 'read', tclass: 'file', path: SECRET, pre: [] }
  };
  var SCENE_IDS = Object.keys(SCENES);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── the two checks ──

  /** Which permission class applies to uid, and whether it has bit `need` ('r', 'w' or 'x') in mode ('rw-------'). */
  function dacCheck(file, uid, need) {
    var cls = uid === file.owner ? 'owner' : uid === file.group ? 'group' : 'other';
    var off = { owner: 0, group: 3, other: 6 }[cls];
    var bits = file.mode.slice(off, off + 3);
    return { cls: cls, bits: bits, need: need, ok: bits.indexOf(need) >= 0 };
  }

  /** The permission check for a port: a port has no mode bits; one at 1024 or above needs no privilege (derived). */
  function dacPort(port) { return { cls: 'port', port: port, ok: port >= 1024 }; }

  /**
   * Look a request up in the allow table by its type pair, class and permission (rule 3). Every row is read top
   * down; the first row that matches all four fields allows. No row: the implicit "no rule", which denies.
   * Returns { at: winning row index (rows.length for the implicit row), rows: [{ hit, miss: [field, …] }] }.
   */
  function lookup(policy, req) {
    var at = policy.length;
    var rows = policy.map(function (r) {
      var miss = ['src', 'tgt', 'tclass', 'perm'].filter(function (k) { return r[k] !== req[k]; });
      return { hit: miss.length === 0, miss: miss };
    });
    for (var i = 0; i < rows.length; i++) if (rows[i].hit) { at = i; break; }
    return { at: at, rows: rows };
  }

  /**
   * The outcome of one attempt (rules 1, 5): both checks must say yes; a "no" from the policy counts only when the
   * mode enforces it. MAC can only take away: a "yes" from the policy never grants what DAC refused.
   * dac, mac: true | false | null (not asked); enforced: true | false | null (not asked).
   */
  function decide(dac, mac, enforced) {
    if (dac !== true) return 'denied';
    return mac === true || enforced === false ? 'allowed' : 'denied';
  }

  // ── state ──

  /** The object the scene's process acts on, as one plain snapshot (task: obj). */
  function objectOf(s) {
    var sc = SCENES[s.scene];
    if (sc.port) {
      var type = s.portLabels[sc.port];
      return { kind: 'port', name: String(sc.port), proto: 'tcp', tcontext: 'system_u:object_r:' + type + ':s0' };
    }
    var f = fileAt(s, sc.path);
    return { kind: 'file', name: f.path, inode: f.inode, mode: f.mode, owner: f.owner, group: f.group, tcontext: f.tcontext };
  }
  function fileAt(s, path) { return s.files.filter(function (f) { return f.path === path; })[0] || null; }

  function initialOf(p) {
    var sc = SCENES[p.scene] || SCENES.port;
    var s = {
      scene: SCENES[p.scene] ? p.scene : 'port',
      proc: clone(sc.proc),
      obj: null,
      perm: sc.perm,
      tclass: sc.tclass,
      policy: clone(POLICY),
      portLabels: clone(PORT_LABELS),
      files: [],
      mode: p.mode === 'permissive' ? 'permissive' : 'enforcing',
      configMode: 'enforcing',
      phase: 'start',
      attempt: 0,
      dac: null, dacWhy: null,
      mac: null, macAt: null,
      enforced: null,
      outcome: null,
      audit: [],
      actions: [],
      action: null,
      cmd: null,
      changed: [],
      listening: sc.port ? [22] : null,
      seen: null
    };
    if (s.scene === 'keys') {
      s.files.push({ inode: 1, path: KEYS, owner: 1000, group: 1000, mode: 'rw-------', tcontext: 'unconfined_u:object_r:ssh_home_t:s0' });
    } else if (s.scene === 'secret') {
      s.files.push({ inode: 1, path: SECRET, owner: 1001, group: 1001, mode: p.dacOk === false ? 'rw-------' : 'rw-r--r--',
        tcontext: 'unconfined_u:object_r:user_tmp_t:s0' });
    }
    s.obj = objectOf(s);
    return s;
  }

  /** The sequence of steps for the params: the scene's own actions, an attempt, then the fix and its retries. */
  function planOf(p) {
    var sc = SCENES[p.scene] || SCENES.port;
    var plan = sc.pre.slice();
    plan.push('try');
    if (p.fix === 'relabel') plan.push(sc.port ? 'semanage' : 'restorecon', 'try');
    else if (p.fix === 'setenforce') plan.push('setenforce0', 'try', p.undo === 'reboot' ? 'reboot' : 'setenforce1', 'try');
    return plan;
  }

  /** The command a step types (data, not language); null where nothing is typed (sshd reads on a key login, a boot). */
  function commandOf(s, what) {
    var sc = SCENES[s.scene];
    switch (what) {
      case 'cp': return 'cp ' + KEYS + ' /tmp/ak';
      case 'mv': return 'mv /tmp/ak ' + KEYS;
      case 'semanage': return 'sudo semanage port -a -t ssh_port_t -p tcp ' + sc.port;
      case 'restorecon': return (s.scene === 'secret' ? 'sudo ' : '') + 'restorecon -v ' + sc.path;
      case 'setenforce0': return 'sudo setenforce 0';
      case 'setenforce1': return 'sudo setenforce 1';
      case 'reboot': return 'sudo reboot';
      case 'try':
        if (s.scene === 'port') return s.actions[s.actions.length - 1] === 'reboot' ? null : 'sudo systemctl restart sshd';
        if (s.scene === 'secret') return 'cat ' + SECRET;
        return null;
    }
    return null;
  }

  /** Apply one action; returns the list of things it changed (for the "changed" marks; empty when nothing changed). */
  function applyAction(s, what) {
    var sc = SCENES[s.scene];
    var changed = [];
    if (what === 'cp') { // a new file, labelled for its new place (rule 7)
      var src = fileAt(s, KEYS);
      var inode = s.files.reduce(function (m, f) { return Math.max(m, f.inode); }, 0) + 1;
      s.files.push({ inode: inode, path: '/tmp/ak', owner: 1000, group: 1000, mode: src.mode,
        tcontext: withType(src.tcontext, defaultType('/tmp/ak')) });
      changed.push('file:' + inode);
    } else if (what === 'mv') { // the same inode under a new name: its label goes with it (rule 7)
      var moved = fileAt(s, '/tmp/ak');
      s.files = s.files.filter(function (f) { return f.path !== KEYS; });
      moved.path = KEYS;
      changed.push('file:' + moved.inode);
    } else if (what === 'restorecon') { // the type back to the default for the path; user, role, range stay (rule 7)
      var f = fileAt(s, sc.path);
      var want = withType(f.tcontext, defaultType(f.path));
      if (want !== f.tcontext) { f.tcontext = want; changed.push('file:' + f.inode + ':type'); }
    } else if (what === 'semanage') { // the port gets the label sshd_t may bind to (rule 4)
      if (s.portLabels[sc.port] !== 'ssh_port_t') { s.portLabels[sc.port] = 'ssh_port_t'; changed.push('port:' + sc.port); }
    } else if (what === 'setenforce0' || what === 'setenforce1') { // the current mode only (rule 8)
      var m = what === 'setenforce0' ? 'permissive' : 'enforcing';
      if (s.mode !== m) { s.mode = m; changed.push('mode'); }
    } else if (what === 'reboot') { // the boot mode comes from the config file (rule 8)
      if (s.mode !== s.configMode) { s.mode = s.configMode; changed.push('mode'); }
    }
    return changed;
  }

  /** An AVC record (rule 6): the fields UL ch15 reads out of `ausearch -m AVC`. */
  function avcOf(s) {
    var sc = SCENES[s.scene];
    var rec = { perm: s.perm, comm: s.proc.comm, scontext: s.proc.scontext, tcontext: s.obj.tcontext, tclass: s.tclass,
      permissive: s.mode === 'permissive' ? 1 : 0 };
    if (sc.port) rec.src = sc.port;
    else rec.name = s.obj.name.split('/').pop();
    return rec;
  }

  /** Every state from step 0 to the end, for the params. */
  function framesOf(p) {
    var s = initialOf(p);
    var frames = [clone(s)];
    function push(fields) {
      Object.assign(s, fields);
      s.obj = objectOf(s);
      frames.push(clone(s));
    }
    function clearCheck() { return { dac: null, dacWhy: null, mac: null, macAt: null, enforced: null, outcome: null }; }

    planOf(p).forEach(function (what) {
      if (what !== 'try') {
        var cmd = commandOf(s, what);
        var changed = applyAction(s, what);
        s.actions.push(what);
        push(Object.assign(clearCheck(), { phase: 'action', action: what, cmd: cmd, changed: changed }));
        return;
      }
      // (1) the process attempts the access
      s.attempt += 1;
      push(Object.assign(clearCheck(), { phase: 'attempt', action: null, cmd: commandOf(s, 'try'), changed: [] }));
      // (2) the permission check (DAC), first (rules 1, 2)
      var why = s.obj.kind === 'port' ? dacPort(SCENES[s.scene].port) : dacCheck(fileAt(s, s.obj.name), s.proc.uid, 'r');
      push({ phase: 'dac', dac: why.ok, dacWhy: why, changed: ['dac'] });
      if (why.ok) {
        // (3) the policy, by the type pair (rule 3)
        var req = { src: typeOf(s.proc.scontext), tgt: typeOf(s.obj.tcontext), tclass: s.tclass, perm: s.perm };
        var lk = lookup(s.policy, req);
        var mac = lk.at < s.policy.length;
        push({ phase: 'mac', mac: mac, macAt: lk.at, changed: ['mac'] });
        if (!mac) {
          // (4) the mode: enforced or not, logged either way (rule 5)
          s.audit.push(avcOf(s));
          push({ phase: 'mode', enforced: s.mode === 'enforcing', changed: ['mode-gate', 'audit'] });
        }
      }
      // (5) the outcome (rules 1, 5)
      var ok = decide(s.dac, s.mac, s.enforced) === 'allowed';
      var fields = { phase: 'outcome', outcome: ok ? 'allowed' : 'denied', changed: ['outcome'] };
      if (s.scene === 'port') {
        var next = ok ? [SCENES.port.port, 22] : [22];
        if (JSON.stringify(next) !== JSON.stringify(s.listening)) fields.changed = ['outcome', 'listening'];
        fields.listening = next;
      } else fields.seen = ok ? 'ok' : 'denied';
      push(fields);
    });
    return frames;
  }

  /** Frames for the page's params (memoised on the params that shape them). */
  var memo = {};
  function frames(p) {
    var key = [p.scene, p.mode, p.fix, p.undo, p.dacOk === false ? 0 : 1].join('|');
    if (!memo[key]) memo[key] = framesOf(p);
    return memo[key];
  }
  function stateAt(p, n) { var fr = frames(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }

  var logic = {
    /** Parameter defaults (task: mode enforcing, fix none, dacOk on; scene the book's sshd on 8991). */
    defaults: { scene: 'port', mode: 'enforcing', fix: 'none', undo: 'setenforce1', dacOk: true },

    /** The scene's own actions + per attempt: attempt, DAC, [MAC], [mode], outcome + each fix action. */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    POLICY: POLICY, PORT_LABELS: PORT_LABELS, USERS: USERS, SCENES: SCENES, SCENE_IDS: SCENE_IDS,
    CTX_SSHD: CTX_SSHD, CTX_USER: CTX_USER,
    typeOf: typeOf, withType: withType, defaultType: defaultType, dacCheck: dacCheck, dacPort: dacPort,
    lookup: lookup, decide: decide, planOf: planOf, framesOf: framesOf, frames: frames
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
