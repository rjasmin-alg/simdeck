/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-quotas: soft vs hard limit and the grace period. A user writes, creates and deletes files on a
   filesystem with a disk quota, and days pass. One step = one command of the preset's script (setquota, repquota,
   quotaon, dd, touch, rm) or "time passes N days". Rules and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The reusable part (allocBlocks, allocInode,
   freeSpace, flags, graceText, repquotaRow) works on plain data and is promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** ext4 allocates 4-KiB blocks; quota counts 1-KiB "blocks" (SPEC.md, Units). */
  var ALLOC_KB = 4;
  var MIB = 1024;

  // ── the reusable rules: one user's quota record { usedKB, files, soft, hard, isoft, ihard, graceUntil, igraceUntil } ──

  function expired(until, day) { return until != null && day >= until; }

  /** Rules 4–6 for blocks: how many KiB of `wantKB` may be allocated today. Mutates q (usage, clock).
      enforce = false (quotas off, rule 3) allocates everything and starts no clock. */
  function allocBlocks(q, wantKB, day, graceDays, enforce) {
    var cap = wantKB, why = null;
    if (enforce) {
      // the write goes block by block; the first refused block ends it (rule 4: stop exactly at the wall).
      // The kernel tests hard before the expired soft limit, so at the same block the reason is 'hard'.
      var capHard = q.hard && q.usedKB + wantKB > q.hard ? Math.max(0, floorAlloc(q.hard - q.usedKB)) : Infinity;
      var capSoft = q.soft && expired(q.graceUntil, day) && q.usedKB + wantKB > q.soft ? Math.max(0, floorAlloc(q.soft - q.usedKB)) : Infinity;
      if (capHard !== Infinity || capSoft !== Infinity) {
        why = capHard <= capSoft ? 'hard' : 'expired';
        cap = Math.min(capHard, capSoft);
      }
    }
    cap = Math.max(0, cap);
    q.usedKB += cap;
    // rule 5: crossing soft starts the clock; equal to soft is not over
    if (enforce && q.soft && q.usedKB > q.soft && q.graceUntil == null) q.graceUntil = day + graceDays;
    return { writtenKB: cap, refused: cap < wantKB ? why : null };
  }
  function floorAlloc(kb) { return Math.floor(kb / ALLOC_KB) * ALLOC_KB; }

  /** Rule 8: one more inode, same tests as blocks. Returns null when allowed (and counts it), or why it is refused. */
  function allocInode(q, day, graceDays, enforce) {
    var n = q.files + 1;
    if (enforce) {
      if (q.ihard && n > q.ihard) return 'hard';
      if (q.isoft && n > q.isoft && expired(q.igraceUntil, day)) return 'expired';
    }
    q.files = n;
    if (enforce && q.isoft && n > q.isoft && q.igraceUntil == null) q.igraceUntil = day + graceDays;
    return null;
  }

  /** Rule 7: freeing blocks and one inode; at or below soft clears that clock. */
  function freeSpace(q, kb, inodes) {
    q.usedKB -= kb;
    q.files -= inodes;
    if (q.usedKB <= q.soft) q.graceUntil = null;
    if (q.files <= q.isoft) q.igraceUntil = null;
  }

  /** Rule 2: new limits re-evaluate the clocks (kernel dquot_set_dqblk; SPEC.md marks it check). A clock starts only
      while limits are enforced (rule 3); clearing needs no enforcement. */
  function setLimits(q, lim, day, graceDays, enforce) {
    q.soft = lim.soft; q.hard = lim.hard; q.isoft = lim.isoft; q.ihard = lim.ihard;
    if (!q.soft || q.usedKB <= q.soft) q.graceUntil = null;
    else if (enforce && q.graceUntil == null) q.graceUntil = day + graceDays;
    if (!q.isoft || q.files <= q.isoft) q.igraceUntil = null;
    else if (enforce && q.igraceUntil == null) q.igraceUntil = day + graceDays;
  }

  /** repquota's overlim(): '+' above soft or above hard (a limit of 0 is none), else '-'. */
  function overlim(usage, soft, hard) { return (soft && usage > soft) || (hard && usage > hard) ? '+' : '-'; }
  function flags(q) { return overlim(q.usedKB, q.soft, q.hard) + overlim(q.files, q.isoft, q.ihard); }

  /** quotasys.c time2str(TF_ROUND) on whole days: 'Ndays' for N ≥ 2, else hh:mm. */
  function daysText(d) { return d >= 2 ? d + 'days' : (d * 24 < 10 ? '0' : '') + d * 24 + ':00'; }
  /** The grace cell: '' while no clock runs, 'none' when expired, else the time left (difftime2str). */
  function graceText(until, day) {
    if (until == null) return '';
    if (until <= day) return 'none';
    return daysText(until - day);
  }

  /** One repquota row's cells. */
  function repquotaCells(u, day) {
    return {
      name: u.name, flags: flags(u),
      bused: String(u.usedKB), bsoft: String(u.soft), bhard: String(u.hard), bgrace: graceText(u.graceUntil, day),
      iused: String(u.files), isoft: String(u.isoft), ihard: String(u.ihard), igrace: graceText(u.igraceUntil, day)
    };
  }
  function pad(s, w, left) { s = String(s); while (s.length < w) s = left ? s + ' ' : ' ' + s; return s; }
  /** Column layout of a row: `%-9s %c%c %7s %7s %7s %6s %7s %5s %5s %6s` (repquota.c). */
  var COLS = [['name', 9, true, ''], ['flags', 2, true, ' '], ['bused', 7, false, ' '], ['bsoft', 7, false, ' '],
    ['bhard', 7, false, ' '], ['bgrace', 6, false, ' '], ['iused', 7, false, ' '], ['isoft', 5, false, ' '],
    ['ihard', 5, false, ' '], ['igrace', 6, false, ' ']];
  function repquotaRow(c) { return COLS.map(function (k) { return k[3] + pad(c[k[0]], k[1], k[2]); }).join(''); }
  function repquotaHead(dev, graceDays) {
    return [
      '*** Report for user quotas on device ' + dev,
      'Block grace time: ' + daysText(graceDays) + '; Inode grace time: ' + daysText(graceDays),
      '                        Block limits                File limits',
      pad('User', 9, true) + '       used    soft    hard  grace    used  soft  hard  grace',
      new Array(71).join('-')
    ];
  }

  // ── the scene: filesystems, users, scripts ──

  var PROMPT = '[student@demosrv1 ~]$ ';
  var LIMITS = { blocks: ['40M', '50M'], filesOff: [0, 0], filesOn: [3, 5] };

  function user(name, usedKB, files, list) {
    return { name: name, usedKB: usedKB, files: files, soft: 0, hard: 0, isoft: 0, ihard: 0,
      graceUntil: null, igraceUntil: null, graceFrom: null, igraceFrom: null, list: list };
  }
  function filesystems(homeShown) {
    var out = [{ id: 'polje', mount: '/mnt/polje', dev: '/dev/md0', fstype: 'ext4', quotas: true,
      users: [user('root', 28, 3, []), user('ana', 4, 1, [{ name: 'ana/', kb: 4 }])] }];
    // /home: another filesystem of the same machine, no quotas (rule 1). Numbers are illustrative (SPEC.md).
    if (homeShown) out.push({ id: 'home', mount: '/home', dev: null, fstype: null, quotas: false,
      users: [user('ana', 36, 8, [{ name: 'ana/', kb: 36 }])] });
    return out;
  }

  function c(op, x) { x = x || {}; x.op = op; return x; }
  var SET = c('setquota', { user: 'ana', fs: 'polje' });
  var REP = c('repquota', { fs: 'polje' });
  var ON = c('quotaon', { fs: 'polje' });
  function dd(file, mib, fs) { return c('dd', { user: 'ana', fs: fs || 'polje', file: file, mib: mib }); }
  function touch(file) { return c('touch', { user: 'ana', fs: 'polje', file: file }); }
  function rm(file) { return c('rm', { user: 'ana', fs: 'polje', file: file }); }
  function days(n) { return c('days', { n: n }); }

  var SCRIPTS = {
    'book-ana': { cmds: [SET, REP, ON, dd('velika', 45), dd('prevelika', 20)] },
    'grace-expires': { cmds: [SET, ON, dd('velika', 45), days(8), dd('mala', 1), rm('velika')] },
    'delete-resets': { cmds: [SET, ON, dd('velika', 45), days(3), rm('velika'), dd('velika', 45), days(5)] },
    'file-limit': { cmds: [SET, ON, touch('dat1'), touch('dat2'), touch('dat3'), touch('dat4'), touch('dat5')] },
    'other-fs': { home: true, cmds: [SET, ON, dd('velika', 60), dd('velika', 60, 'home')] }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);

  /** The page's presets, in key order (1–5). */
  var PRESETS = [
    { id: 'book-ana', params: { script: 'book-ana', graceDays: 7, fileLimits: false } },
    { id: 'grace-expires', params: { script: 'grace-expires', graceDays: 7, fileLimits: false } },
    { id: 'delete-resets', params: { script: 'delete-resets', graceDays: 7, fileLimits: false } },
    { id: 'file-limit', params: { script: 'file-limit', graceDays: 7, fileLimits: true } },
    { id: 'other-fs', params: { script: 'other-fs', graceDays: 7, fileLimits: false } }
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Params made safe: the page and the URL may hand in anything. */
  function norm(p) {
    p = p || {};
    var d = logic.defaults;
    var g = Math.round(Number(p.graceDays));
    return {
      script: SCRIPTS[p.script] ? p.script : d.script,
      graceDays: isFinite(g) && p.graceDays !== null && p.graceDays !== '' ? Math.min(14, Math.max(1, g)) : d.graceDays,
      fileLimits: p.fileLimits === undefined ? d.fileLimits : !!p.fileLimits
    };
  }

  function fsOf(s, id) {
    for (var i = 0; i < s.fs.length; i++) if (s.fs[i].id === id) return s.fs[i];
    throw new Error('no such filesystem: ' + id);
  }
  function userOf(fs, name) {
    for (var i = 0; i < fs.users.length; i++) if (fs.users[i].name === name) return fs.users[i];
    throw new Error('no such user on ' + fs.mount + ': ' + name);
  }
  function fileIndex(u, name) {
    for (var i = 0; i < u.list.length; i++) if (u.list[i].name === name) return i;
    return -1;
  }

  /** The command line as the book writes it. */
  function cmdLine(cmd, s, p) {
    var fs = cmd.fs ? fsOf(s, cmd.fs) : null;
    var path = fs ? fs.mount + '/' + (cmd.user || '') + (cmd.file ? '/' + cmd.file : '') : '';
    switch (cmd.op) {
      case 'setquota': {
        var f = p.fileLimits ? LIMITS.filesOn : LIMITS.filesOff;
        return 'sudo setquota -u ' + cmd.user + ' ' + LIMITS.blocks.join(' ') + ' ' + f.join(' ') + ' ' + fs.mount;
      }
      case 'repquota': return 'sudo repquota ' + fs.mount;
      case 'quotaon': return 'sudo quotaon -v ' + fs.mount;
      case 'dd': return 'sudo -u ' + cmd.user + ' dd if=/dev/zero of=' + path + ' bs=1M count=' + cmd.mib +
        ' status=none; echo "status=$?"';
      case 'touch': return 'sudo -u ' + cmd.user + ' touch ' + path + '; echo "status=$?"';
      case 'rm': return 'sudo -u ' + cmd.user + ' rm ' + path + '; echo "status=$?"';
      default: return null;
    }
  }
  function toKB(m) { return parseInt(m, 10) * MIB; }

  /** Clocks for the calendar: remember the day a clock started. */
  function trackClocks(u, before) {
    if (u.graceUntil == null) u.graceFrom = null;
    else if (before.graceUntil !== u.graceUntil) u.graceFrom = before.day;
    if (u.igraceUntil == null) u.igraceFrom = null;
    else if (before.igraceUntil !== u.igraceUntil) u.igraceFrom = before.day;
  }

  /** One command. Mutates s (a clone). */
  function run(s, cmd, p) {
    var last = { op: cmd.op, cmd: cmdLine(cmd, s, p), fs: cmd.fs || null, user: cmd.user || null, file: cmd.file || null,
      status: 0, wantKB: 0, writtenKB: 0, why: null, freedKB: 0, n: cmd.n || 0, out: [] };
    s.changed = [];
    var fs = cmd.fs ? fsOf(s, cmd.fs) : null;
    var u = fs && cmd.user ? userOf(fs, cmd.user) : null;
    var before = u ? { day: s.day, usedKB: u.usedKB, files: u.files, graceUntil: u.graceUntil, igraceUntil: u.igraceUntil } : null;
    var enforce = !!(fs && fs.quotas && s.quotaOn);

    if (cmd.op === 'days') {
      s.day += cmd.n;
      s.changed.push('day');
    } else if (cmd.op === 'setquota') {
      var f = p.fileLimits ? LIMITS.filesOn : LIMITS.filesOff;
      setLimits(u, { soft: toKB(LIMITS.blocks[0]), hard: toKB(LIMITS.blocks[1]), isoft: f[0], ihard: f[1] }, s.day, p.graceDays, enforce);
      s.changed.push('limits:' + fs.id + ':' + u.name);
    } else if (cmd.op === 'repquota') {
      s.changed.push('report');
    } else if (cmd.op === 'quotaon') {
      s.quotaOn = true;
      s.changed.push('quotaon');
      last.out = [fs.dev + ' [' + fs.mount + ']: group quotas turned on', fs.dev + ' [' + fs.mount + ']: user quotas turned on'];
    } else if (cmd.op === 'dd' || cmd.op === 'touch') {
      var path = fs.mount + '/' + u.name + '/' + cmd.file;
      if (fileIndex(u, cmd.file) >= 0) throw new Error('script writes an existing file: ' + cmd.file);
      var ino = allocInode(u, s.day, p.graceDays, enforce);
      if (ino) {
        last.status = 1; last.why = 'inode-' + ino;
        last.out = [cmd.op === 'dd' ? 'dd: failed to open \'' + path + '\': Disk quota exceeded'
          : 'touch: cannot touch \'' + path + '\': Disk quota exceeded'];
        s.changed.push('refused:' + fs.id + ':' + u.name + ':files');
      } else {
        var entry = { name: cmd.file, kb: 0 };
        u.list.push(entry);
        s.changed.push('file:' + fs.id + ':' + u.name + ':' + cmd.file);
        if (cmd.op === 'dd') {
          last.wantKB = cmd.mib * MIB;
          var r = allocBlocks(u, last.wantKB, s.day, p.graceDays, enforce);
          entry.kb = r.writtenKB;
          last.writtenKB = r.writtenKB;
          if (r.refused) {
            last.status = 1; last.why = 'block-' + r.refused;
            last.out = ['dd: error writing \'' + path + '\': Disk quota exceeded'];
            s.changed.push('refused:' + fs.id + ':' + u.name + ':blocks');
          }
        }
      }
    } else if (cmd.op === 'rm') {
      var i = fileIndex(u, cmd.file);
      if (i < 0) throw new Error('script removes a missing file: ' + cmd.file);
      last.freedKB = u.list[i].kb;
      u.list.splice(i, 1);
      freeSpace(u, last.freedKB, 1);
      s.changed.push('freed:' + fs.id + ':' + u.name);
    }

    if (cmd.op === 'dd' || cmd.op === 'touch' || cmd.op === 'rm') last.out.push('status=' + last.status);
    if (u) trackClocks(u, before);
    s.last = last;
    s.log.push({ n: s.log.length + 1, op: cmd.op, status: last.status });
    return s;
  }

  var logic = {
    defaults: { script: 'book-ana', graceDays: 7, fileLimits: false },

    /** One step per command of the script. */
    steps: function (p) { return SCRIPTS[norm(p).script].cmds.length; },

    initial: function (params) {
      var p = norm(params);
      return { day: 0, graceDays: p.graceDays, quotaOn: false, homeShown: !!SCRIPTS[p.script].home,
        fs: filesystems(!!SCRIPTS[p.script].home), last: null, changed: [], log: [] };
    },

    step: function (prev, n, params) {
      var p = norm(params);
      return run(clone(prev), SCRIPTS[p.script].cmds[n - 1], p);
    },

    // helpers for the page and the tests
    norm: norm,
    allocBlocks: allocBlocks,
    allocInode: allocInode,
    freeSpace: freeSpace,
    setLimits: setLimits,
    overlim: overlim,
    flags: flags,
    graceText: graceText,
    daysText: daysText,
    expired: expired,
    repquotaCells: repquotaCells,
    repquotaRow: repquotaRow,
    repquotaHead: repquotaHead,
    COLS: COLS.map(function (k) { return { key: k[0], width: k[1], left: k[2], sep: k[3] }; }),
    fsOf: fsOf,
    userOf: userOf,
    cmdLine: cmdLine,
    PROMPT: PROMPT,
    ALLOC_KB: ALLOC_KB,
    SCRIPTS: SCRIPTS,
    SCRIPT_IDS: SCRIPT_IDS,
    PRESETS: PRESETS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
