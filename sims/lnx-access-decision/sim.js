/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-access-decision: one process asks for r, w or x on one file, and the kernel's access check decides.
   The classes are tried in a fixed order (owner, named users, groups, other); the first class that matches the process
   decides, and no later class is looked at. With an ACL, the mask limits the named users and every group entry, never
   the owner or other. A privileged process (EUID 0) is decided before the classes. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The reusable part (lsString, modeOf,
   classesOf, check) works on plain data and is promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var LETTERS = ['r', 'w', 'x'];
  var BIT = { r: 4, w: 2, x: 1 };

  // ── nine bits ↔ ls -l string (from sims/lnx-permissions-rwx/sim.js @ eb0ae27: octal, lsString; extended with the
  //    setgid letter and the ACL's '+') ──

  /** 'rw-' → 6; any letter out of place is an error. */
  function permBits(perms) {
    var s = String(perms);
    if (!/^[r-][w-][x-]$/.test(s)) throw new Error('not a permission triplet: ' + perms);
    return (s[0] === 'r' ? 4 : 0) | (s[1] === 'w' ? 2 : 0) | (s[2] === 'x' ? 1 : 0);
  }
  /** 6 → 'rw-'. */
  function permString(bits) {
    var s = '';
    for (var k = 0; k < 3; k++) s += bits & (4 >> k) ? LETTERS[k] : '-';
    return s;
  }
  /** Three octal digits, owner first: 0o640 → '640'. */
  function octal(mode) { var s = (mode & 0x1ff).toString(8); while (s.length < 3) s = '0' + s; return s; }

  /** The ls -l string: type, nine letters, 's' for setgid over the group's x ('S' without x), '+' with an extended ACL. */
  function lsString(kind, mode, opts) {
    opts = opts || {};
    var s = kind === 'dir' ? 'd' : '-';
    for (var i = 0; i < 9; i++) {
      var on = mode & (1 << (8 - i));
      if (i === 5 && opts.setgid) s += on ? 's' : 'S';
      else s += on ? LETTERS[i % 3] : '-';
    }
    return s + (opts.acl ? '+' : '');
  }

  // ── people and files (UL ch07; marko derived) ──

  /** Groups by name: gid. */
  var GROUPS = { root: 0, student: 1000, ana: 1001, marko: 1002, projekt: 2000, nobody: 65534 };
  /** Users: uid and the groups the process carries (primary first). nobody is in no group of the files (UL ch07). */
  var USERS = {
    student: { uid: 1000, groups: ['student'] },
    ana: { uid: 1001, groups: ['ana', 'projekt'] },
    marko: { uid: 1002, groups: ['marko', 'projekt'] },
    nobody: { uid: 65534, groups: ['nobody'] },
    root: { uid: 0, groups: ['root'] }
  };
  var USER_IDS = ['student', 'ana', 'marko', 'nobody', 'root'];
  var WANTS = ['r', 'w', 'x'];
  var MASKS = ['rwx', 'rw-', 'r--', '---'];

  function e(tag, qual, perms) { return { tag: tag, qual: qual, perms: perms }; }

  /**
   * The five scenes. acl lists the entries in getfacl's order; a file without an ACL has the minimal three
   * (user::, group::, other::). On a file with a mask, the page's `mask` param replaces the mask's perms.
   */
  var SCENES = {
    // UL ch07: sudo chmod 2770 /srv/projekt; ls -ld → drwxrws--- root projekt; student: Permission denied
    projekt: { path: '/srv/projekt', kind: 'dir', owner: 'root', group: 'projekt', setgid: true,
      acl: [e('user_obj', null, 'rwx'), e('group_obj', null, 'rwx'), e('other', null, '---')] },
    // derived from acl(5)'s order: the owner has nothing, everyone else may read and write
    plan: { path: 'plan.txt', kind: 'file', owner: 'student', group: 'projekt',
      acl: [e('user_obj', null, '---'), e('group_obj', null, 'rw-'), e('other', null, 'rw-')] },
    // UL ch07: setfacl -m u:nobody:rw proba; getfacl proba
    proba: { path: 'proba', kind: 'file', owner: 'student', group: 'student',
      acl: [e('user_obj', null, 'rwx'), e('user', 'nobody', 'rw-'), e('group_obj', null, '---'), e('mask', null, 'rw-'), e('other', null, '---')] },
    // UL ch07: getfacl /srv/projekt/druga.txt (group::rwx and group:projekt:rwx, both #effective:rw-)
    druga: { path: '/srv/projekt/druga.txt', kind: 'file', owner: 'ana', group: 'projekt',
      acl: [e('user_obj', null, 'rw-'), e('group_obj', null, 'rwx'), e('group', 'projekt', 'rwx'), e('mask', null, 'rw-'), e('other', null, '---')] },
    // derived (capabilities(7) CAP_DAC_OVERRIDE): mode 000
    tajna: { path: 'tajna', kind: 'file', owner: 'student', group: 'student',
      acl: [e('user_obj', null, '---'), e('group_obj', null, '---'), e('other', null, '---')] }
  };
  var SCENE_IDS = ['projekt', 'plan', 'proba', 'druga', 'tajna'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function maskIndex(acl) { for (var i = 0; i < acl.length; i++) if (acl[i].tag === 'mask') return i; return -1; }
  function entryOf(acl, tag) { for (var i = 0; i < acl.length; i++) if (acl[i].tag === tag) return acl[i]; return null; }

  /** An ACL is extended when it has more than the three base entries; then it has a mask (acl(5)). */
  function hasMask(acl) { return maskIndex(acl) >= 0; }

  /** The nine mode bits: owner from user::, other from other::, the group triplet from mask:: if there is one, else
      from group:: (rule 6; UL ch07: ls -l shows rw where getfacl says group::---). */
  function modeOf(acl) {
    var g = hasMask(acl) ? entryOf(acl, 'mask') : entryOf(acl, 'group_obj');
    return (permBits(entryOf(acl, 'user_obj').perms) << 6) | (permBits(g.perms) << 3) | permBits(entryOf(acl, 'other').perms);
  }

  /** The classes in the fixed order of the check, each with its entry rows (rule 7: empty classes are left out). */
  var CLASS_ORDER = ['owner', 'users', 'groups', 'other'];
  var CLASS_OF = { user_obj: 'owner', user: 'users', group_obj: 'groups', group: 'groups', other: 'other' };
  function classesOf(acl) {
    var out = [];
    CLASS_ORDER.forEach(function (c) {
      var rows = [];
      acl.forEach(function (en, i) { if (CLASS_OF[en.tag] === c) rows.push(i); });
      if (rows.length) out.push({ cls: c, rows: rows });
    });
    return out;
  }
  /** The mask applies to named users and every group entry, never to the owner or other (rule 6). */
  function masked(cls) { return cls === 'users' || cls === 'groups'; }

  /** Does entry row i describe this process? proc: { uid, gids: [...] }; file: { uid, gid, acl }. */
  function rowMatches(file, proc, i) {
    var en = file.acl[i];
    switch (en.tag) {
      case 'user_obj': return proc.uid === file.uid;
      case 'user': return proc.uid === en.uid;
      case 'group_obj': return proc.gids.indexOf(file.gid) >= 0;
      case 'group': return proc.gids.indexOf(en.gid) >= 0;
      case 'other': return true;
    }
    return false;
  }

  /**
   * The access check (acl(5) ACCESS CHECK ALGORITHM; capabilities(7) CAP_DAC_OVERRIDE). Plain data in and out:
   *   file: { kind: 'file'|'dir', uid, gid, acl: [{ tag, uid?, gid?, perms }] }, proc: { uid, gids }, want: 'r'|'w'|'x'.
   * Returns { privileged, compared: [{ cls, rows, hits }], matched: cls|null, rows: [matching row indices],
   *   effective: { row: perms } (after the mask, for the matching rows), granting: [rows that grant], granted }.
   */
  function check(file, proc, want) {
    var bit = BIT[want];
    if (!bit) throw new Error('want is r, w or x: ' + want);
    var mode = modeOf(file.acl);
    if (proc.uid === 0) {
      // Rule 1: read and write are always overridden; on a directory search too; execute on anything else only when
      // the mode has at least one x bit (the group triplet is the mask when there is one).
      var anyX = (mode & 0o111) !== 0;
      var ok = want !== 'x' || file.kind === 'dir' || anyX;
      return { privileged: true, anyX: anyX, compared: [], matched: null, rows: [], effective: {}, granting: [], granted: ok };
    }
    var mi = maskIndex(file.acl);
    var maskBits = mi >= 0 ? permBits(file.acl[mi].perms) : 7;
    var compared = [];
    var classes = classesOf(file.acl);
    for (var c = 0; c < classes.length; c++) {
      var k = classes[c];
      var hits = k.rows.filter(function (i) { return rowMatches(file, proc, i); });
      compared.push({ cls: k.cls, rows: k.rows, hits: hits });
      if (!hits.length) continue;
      // Rules 2–5: the first class that matches decides; within the groups class any matching entry may grant (OR).
      var effective = {};
      var granting = hits.filter(function (i) {
        var b = permBits(file.acl[i].perms) & (masked(k.cls) ? maskBits : 7);
        effective[i] = permString(b);
        return (b & bit) !== 0;
      });
      return { privileged: false, compared: compared, matched: k.cls, rows: hits, effective: effective, granting: granting,
        granted: granting.length > 0, maskApplies: masked(k.cls) && mi >= 0 };
    }
    // Unreachable: other:: matches every process (acl(5) step 5 is a guard).
    return { privileged: false, compared: compared, matched: null, rows: [], effective: {}, granting: [], granted: false };
  }

  // ── the scene for the page's params ──

  function sceneOf(p) { return SCENES[p.scene] ? p.scene : 'projekt'; }

  /** The scene's file with the param's mask, as plain data with names and ids. */
  function fileOf(p) {
    var sc = SCENES[sceneOf(p)];
    var acl = clone(sc.acl);
    var mi = maskIndex(acl);
    if (mi >= 0 && MASKS.indexOf(p.mask) >= 0) acl[mi].perms = p.mask;
    acl.forEach(function (en) {
      if (en.tag === 'user') en.uid = USERS[en.qual].uid;
      if (en.tag === 'group') en.gid = GROUPS[en.qual];
    });
    var mode = modeOf(acl);
    return { path: sc.path, kind: sc.kind, owner: sc.owner, uid: USERS[sc.owner].uid, group: sc.group, gid: GROUPS[sc.group],
      setgid: !!sc.setgid, mode: mode, octal: octal(mode), acl: acl, extended: mi >= 0,
      ls: lsString(sc.kind, mode, { setgid: sc.setgid, acl: mi >= 0 }) };
  }

  function procOf(p) {
    var name = USERS[p.who] ? p.who : 'student';
    var u = USERS[name];
    return { user: name, uid: u.uid, groups: u.groups.slice(), gids: u.groups.map(function (g) { return GROUPS[g]; }) };
  }

  /**
   * Every state from step 0 to the end. Step 1 identifies the process; then one step per class compared, in the fixed
   * order, until one matches; then the mask, if that class is masked and the file has one; then the verdict.
   * A privileged process: identify, the override, the verdict.
   */
  function framesOf(p) {
    var file = fileOf(p), proc = procOf(p);
    var want = WANTS.indexOf(p.want) >= 0 ? p.want : 'r';
    var r = check(file, proc, want);
    var s = {
      scene: sceneOf(p), proc: proc, file: file, want: want,
      phase: 'start',
      privileged: null,
      cursor: null,          // the class being compared (or 'mask'), null when none
      cursorRows: [],
      rows: file.acl.map(function () { return null; }),  // per entry: null (not read), 'no', 'hit'
      matched: null, matchedRows: [],
      effective: null,       // { row: perms } once the mask (or the unmasked class) has been applied
      maskUsed: null,        // true: the mask limited the matched class; false: it does not apply to it
      granting: [],
      verdict: null, reason: null,
      changed: []
    };
    var frames = [clone(s)];
    function push(fields) { Object.assign(s, fields); frames.push(clone(s)); }

    push({ phase: 'identify', privileged: r.privileged, changed: ['proc'] });
    if (r.privileged) {
      push({ phase: 'override', changed: ['override'] });
      push({ phase: 'verdict', verdict: r.granted ? 'granted' : 'denied',
        reason: want !== 'x' ? 'privilege' : file.kind === 'dir' ? 'privilege-dir' : r.anyX ? 'privilege-x' : 'privilege-no-x', changed: ['verdict'] });
      return frames;
    }
    r.compared.forEach(function (k) {
      var rows = s.rows.slice();
      k.rows.forEach(function (i) { rows[i] = k.hits.indexOf(i) >= 0 ? 'hit' : 'no'; });
      var hit = k.hits.length > 0;
      push({ phase: 'compare', cursor: k.cls, cursorRows: k.rows.slice(), rows: rows,
        matched: hit ? k.cls : null, matchedRows: hit ? k.hits.slice() : [], changed: ['rows'] });
    });
    if (r.maskApplies) push({ phase: 'mask', cursor: 'mask', cursorRows: [maskIndex(file.acl)], effective: r.effective, maskUsed: true, changed: ['mask'] });
    push({ phase: 'verdict', cursor: null, cursorRows: [], effective: r.effective, maskUsed: r.maskApplies ? true : file.extended ? false : null,
      granting: r.granting.slice(), verdict: r.granted ? 'granted' : 'denied', reason: r.matched, changed: ['verdict'] });
    return frames;
  }

  // ── captions: which sentence, and its data (pure, so each branch is tested; the page fills the strings) ──

  /** An entry as getfacl prints it: user::rwx, user:nobody:rw-, group:projekt:rwx, mask::rw-, other::---. */
  function entryText(en, perms) {
    var tag = { user_obj: 'user', user: 'user', group_obj: 'group', group: 'group', mask: 'mask', other: 'other' }[en.tag];
    return tag + ':' + (en.qual || '') + ':' + (perms == null ? en.perms : perms);
  }
  var CLASS_KEY = { owner: 'oOwner', users: 'oUsers', groups: 'oGroups', other: 'oOther' };

  /**
   * The caption of a state: { key, vars }. A string in vars is data (a name, an entry, bits: shown as code), { t: key }
   * a word from the tables. The verdict picks the misconception it answers before the plain sentence: the mask took
   * the bit, other would have allowed it (no fall-through), group or other would have allowed it (the owner's no).
   */
  function captionOf(s) {
    var f = s.file, acl = f.acl, want = s.want, bit = BIT[want];
    var matched = s.matchedRows.map(function (i) { return acl[i]; });
    var groupNames = function () {
      var out = [];
      matched.forEach(function (en) { var g = en.tag === 'group_obj' ? f.group : en.qual; if (out.indexOf(g) < 0) out.push(g); });
      return out.join(', ');
    };
    switch (s.phase) {
      case 'start': return { key: 'cStart', vars: { user: s.proc.user, want: want, path: f.path } };
      case 'identify':
        return s.privileged ? { key: 'cIdRoot', vars: {} } : { key: 'cIdNo', vars: { uid: String(s.proc.uid), groups: s.proc.groups.join(', ') } };
      case 'compare': {
        var hit = s.matched === s.cursor;
        switch (s.cursor) {
          case 'owner': return hit ? { key: 'cOwnerYes', vars: { user: s.proc.user, entry: entryText(matched[0]) } }
            : { key: 'cOwnerNo', vars: { owner: f.owner, user: s.proc.user } };
          case 'users': return hit ? { key: 'cUsersYes', vars: { entry: entryText(matched[0]), user: s.proc.user } }
            : { key: 'cUsersNo', vars: { tag: 'user:', user: s.proc.user } };
          case 'groups':
            if (!hit) return { key: 'cGroupsNo', vars: { groups: s.proc.groups.join(', ') } };
            if (matched.length > 1) return { key: 'cGroupsYesMany', vars: { group: groupNames(), entries: matched.map(function (en) { return entryText(en); }).join(', ') } };
            return { key: 'cGroupsYes', vars: { group: groupNames(), entry: entryText(matched[0]) } };
          default:
            if (!f.extended && matched[0].perms === '---') return { key: 'cOtherEmpty', vars: { user: s.proc.user, group: f.group } };
            return { key: 'cOther', vars: { user: s.proc.user, entry: entryText(matched[0]) } };
        }
      }
      case 'mask': {
        var mask = entryOf(acl, 'mask').perms;
        var clipped = s.matchedRows.filter(function (i) { return s.effective[i] !== acl[i].perms; });
        if (clipped.length) return { key: 'cMaskClips', vars: { entry: acl[clipped[0]].perms, mask: mask } };
        var i0 = s.matchedRows[0];
        return { key: 'cMaskSame', vars: { mask: mask, entry: acl[i0].perms, eff: s.effective[i0] } };
      }
      case 'override': return f.kind === 'dir' ? { key: 'cOverrideDir', vars: {} } : { key: 'cOverride', vars: { ls: f.ls } };
      default: {
        if (s.privileged) {
          if (want !== 'x') return { key: 'cRootRW', vars: {} };
          if (f.kind === 'dir') return { key: 'cRootDir', vars: {} };
          return { key: s.verdict === 'granted' ? 'cRootX' : 'cRootNoX', vars: { ls: f.ls } };
        }
        var cls = { t: CLASS_KEY[s.matched] };
        if (s.verdict === 'granted') return { key: 'cGranted', vars: { cls: cls, want: want } };
        var has = function (en) { return en && (permBits(en.perms) & bit) !== 0; };
        // what an entry gives after the mask (the owner and other are never masked)
        var maskEn = entryOf(acl, 'mask');
        var gives = function (en) {
          var b = permBits(en.perms) & (maskEn && masked(CLASS_OF[en.tag]) ? permBits(maskEn.perms) : 7);
          return (b & bit) !== 0;
        };
        if (matched.some(has)) return { key: 'cMaskDenied', vars: { want: want } };
        if (s.matched === 'groups' && has(entryOf(acl, 'other'))) return { key: 'cNoFallThrough', vars: { want: want } };
        if (s.matched === 'owner' && acl.some(function (en) { return en.tag !== 'user_obj' && en.tag !== 'mask' && gives(en); })) {
          return { key: 'cOwnerLocked', vars: { user: s.proc.user, perms: matched[0].perms } };
        }
        if (s.matched === 'other') return { key: 'cDeniedOther', vars: { want: want } };
        return { key: 'cDenied', vars: { cls: cls, want: want } };
      }
    }
  }

  /** Frames for the page's params (memoised on the params that shape them). */
  var memo = {};
  function frames(p) {
    var key = [sceneOf(p), p.who, p.want, p.mask].join('|');
    if (!memo[key]) memo[key] = framesOf(p);
    return memo[key];
  }
  function stateAt(p, n) { var fr = frames(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }

  var logic = {
    /** Parameter defaults (task: who first of the list, want r; the scene of preset 1; the books' mask rw-). */
    defaults: { scene: 'projekt', who: 'student', want: 'r', mask: 'rw-' },

    /** identify + one per class compared + [mask] + verdict; a privileged process: identify, override, verdict. */
    steps: function (p) { return frames(p).length - 1; },
    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    SCENES: SCENES, SCENE_IDS: SCENE_IDS, USERS: USERS, USER_IDS: USER_IDS, GROUPS: GROUPS, WANTS: WANTS, MASKS: MASKS,
    CLASS_ORDER: CLASS_ORDER,
    permBits: permBits, permString: permString, octal: octal, lsString: lsString,
    hasMask: hasMask, modeOf: modeOf, classesOf: classesOf, masked: masked, rowMatches: rowMatches, check: check,
    fileOf: fileOf, procOf: procOf, framesOf: framesOf, frames: frames, entryText: entryText, captionOf: captionOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
