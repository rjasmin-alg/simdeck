/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the nine permission bits: one value written three ways (ls -l string, octal, symbolic), chmod in its two
   forms (octal is absolute, symbolic is relative), and the mode of a new file or directory, base AND NOT umask.
   An explorer: no steps; the page draws initial(params). Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Bit index 0 … 8 from the left: owner r w x, group r w x, other r w x. Value of index i: 1 << (8 − i). */
  var ALL = 0x1ff; // 0777
  var CLASSES = ['u', 'g', 'o'];
  var PERMS = ['r', 'w', 'x'];
  /** The bases a new file and a new directory ask for (rule 5). */
  var BASE = { file: 0x1b6, dir: 0x1ff }; // 0666, 0777
  /** The page's options (SPEC.md, Params). */
  var BEFORE = ['000', '600', '640', '644', '700', '755', '777'];
  var CMDS = ['none', '640', 'u+x,g-r', 'g-w', '755', 'o='];
  var UMASKS = ['000', '002', '022', '027', '077'];
  var KINDS = ['file', 'dir'];

  function bit(i) { return 1 << (8 - i); }
  function indices(mask) { var out = []; for (var i = 0; i < 9; i++) if (mask & bit(i)) out.push(i); return out; }
  function bitsOf(mode) { var out = []; for (var i = 0; i < 9; i++) out.push(mode & bit(i) ? 1 : 0); return out; }

  /** Three octal digits, owner first: 0o640 → '640'. */
  function octal(mode) { var s = (mode & ALL).toString(8); while (s.length < 3) s = '0' + s; return s; }

  /** Parse an octal mode of 1 to 4 digits; the special bits (above 0777) are out of scope. */
  function parseOctal(s) {
    if (!/^[0-7]{1,4}$/.test(String(s))) throw new Error('not an octal mode: ' + s);
    var v = parseInt(s, 8);
    if (v & ~ALL) throw new Error('special bits are out of scope: ' + s);
    return v;
  }

  /** Per group: which of r, w, x are set and their sum 4 + 2 + 1 (rule 2). */
  function digits(mode) {
    return CLASSES.map(function (c, g) {
      var d = (mode >> (6 - 3 * g)) & 7;
      return { r: d & 4 ? 4 : 0, w: d & 2 ? 2 : 0, x: d & 1 ? 1 : 0, sum: d };
    });
  }

  /** The ls -l string: type character, then a letter for a set bit and a dash for a clear one (rule 1). */
  function lsString(kind, mode) {
    var s = kind === 'dir' ? 'd' : '-';
    for (var i = 0; i < 9; i++) s += mode & bit(i) ? PERMS[i % 3] : '-';
    return s;
  }

  /** The symbolic notation with '=' per class: 0o640 → 'u=rw,g=r,o='. */
  function symbolic(mode) {
    return CLASSES.map(function (c, g) {
      var s = c + '=';
      for (var k = 0; k < 3; k++) if (mode & bit(3 * g + k)) s += PERMS[k];
      return s;
    }).join(',');
  }

  /** Bits of the classes in `who` (a = u, g and o), for the perms in `perms`. */
  function maskOf(who, perms) {
    var m = 0;
    for (var g = 0; g < 3; g++) {
      if (who.indexOf(CLASSES[g]) < 0 && who.indexOf('a') < 0) continue;
      for (var k = 0; k < 3; k++) if (perms.indexOf(PERMS[k]) >= 0) m |= bit(3 * g + k);
    }
    return m;
  }

  /** Apply a symbolic mode (rule 4): clauses left to right, each clause who+ (op perms*)+.
      Returns the new mode and the bits the command writes. */
  function applySymbolic(mode, expr) {
    var written = 0;
    String(expr).split(',').forEach(function (clause) {
      var m = /^([ugoa]*)((?:[-+=][rwx]*)+)$/.exec(clause);
      if (!m) throw new Error('symbolic mode not modelled: ' + clause);
      var who = m[1];
      if (!who) throw new Error('a clause without who is out of scope: ' + clause);
      var actions = m[2].match(/[-+=][rwx]*/g);
      actions.forEach(function (a) {
        var op = a[0], set = maskOf(who, a.slice(1)), cls = maskOf(who, 'rwx');
        if (op === '+') { mode |= set; written |= set; }
        else if (op === '-') { mode &= ~set; written |= set; }
        else { mode = (mode & ~cls) | set; written |= cls; }
      });
    });
    return { mode: mode & ALL, written: written };
  }

  /** chmod with its operand: octal writes all nine bits (rule 3), symbolic only the named ones (rule 4). */
  function applyCmd(mode, cmd) {
    if (cmd === 'none' || cmd == null || cmd === '') return { mode: mode, form: 'none', written: 0 };
    if (/^[0-9]+$/.test(cmd)) return { mode: parseOctal(cmd), form: 'octal', written: ALL };
    var r = applySymbolic(mode, cmd);
    return { mode: r.mode, form: 'symbolic', written: r.written };
  }

  /** The mode of a new file or directory: base AND NOT umask (rule 5), and what the mask did. */
  function create(kind, umask) {
    var base = BASE[kind], mask = umask & ALL;
    var created = base & ~mask;
    var diff = base - mask;
    return {
      base: base, created: created,
      cleared: indices(base & mask),
      noEffect: indices(mask & ~base),
      difference: diff >= 0 ? diff : null,
      differenceAgrees: diff === created
    };
  }

  function view(kind, mode) {
    return { mode: mode, bits: bitsOf(mode), ls: lsString(kind, mode), octal: octal(mode), symbolic: symbolic(mode), digits: digits(mode) };
  }

  var logic = {
    BEFORE: BEFORE, CMDS: CMDS, UMASKS: UMASKS, KINDS: KINDS, BASE: BASE,
    bit: bit, bitsOf: bitsOf, indices: indices, octal: octal, parseOctal: parseOctal, digits: digits,
    lsString: lsString, symbolic: symbolic, applySymbolic: applySymbolic, applyCmd: applyCmd, create: create,

    /** Parameter defaults (SPEC.md, Params). `toggled` is the XOR mask the bit cells write. */
    defaults: { kind: 'file', before: '644', cmd: 'none', umask: '022', toggled: 0 },

    /** An explorer: the whole state follows from the params. */
    initial: function (p) {
      var kind = p.kind === 'dir' ? 'dir' : 'file';
      var start = parseOctal(p.before);
      var toggled = (Number(p.toggled) || 0) & ALL;
      var before = start ^ toggled;
      var c = applyCmd(before, p.cmd);
      var after = c.mode;
      var umask = parseOctal(p.umask);
      var made = create(kind, umask);
      return {
        kind: kind,
        xMeaning: kind === 'dir' ? 'search' : 'execute',
        start: start, toggled: toggled, before: before,
        cmd: c.form === 'none' ? 'none' : String(p.cmd), form: c.form, written: indices(c.written),
        after: after,
        changedBits: indices(before ^ after),
        lost: indices(before & ~after),
        lostUnasked: c.form === 'octal' ? indices(before & ~after).filter(function (i) { return digits(after)[Math.floor(i / 3)].sum !== 0; }) : [],
        gained: indices(after & ~before),
        umask: umask, base: made.base, created: made.created,
        cleared: made.cleared, noEffect: made.noEffect,
        difference: made.difference, differenceAgrees: made.differenceAgrees,
        views: {
          before: view(kind, before), after: view(kind, after),
          base: view(kind, made.base), umask: view(kind, umask), created: view(kind, made.created)
        }
      };
    },

    /** What a click on cell i of a strip does (SPEC.md, Clicks): the strip's mode with bit i flipped becomes the
        start, the command none. Returns the params patch. */
    clickPatch: function (p, mode, i) {
      var target = (mode ^ bit(i)) & ALL;
      var start = parseOctal(p.before);
      var hit = BEFORE.indexOf(octal(target));
      if (hit >= 0) return { before: BEFORE[hit], toggled: 0, cmd: 'none' };
      return { toggled: target ^ start, cmd: 'none' };
    },

    /** Which panel speaks in the caption (SPEC.md, Captions): a newly loaded preset's own panel; else the panel whose
        params changed since `prev`; else the current focus; else create without a command and chmod with one. */
    nextFocus: function (focus, prev, p, preset, prevPreset) {
      if (preset && preset !== prevPreset) {
        var pr = logic.presets.filter(function (x) { return x.id === preset; })[0];
        if (pr) return pr.focus;
      }
      if (prev) {
        if (p.umask !== prev.umask || p.kind !== prev.kind) return 'create';
        if (p.before !== prev.before || p.cmd !== prev.cmd || p.toggled !== prev.toggled) return 'chmod';
      }
      return focus || (p.cmd === 'none' ? 'create' : 'chmod');
    },

    /** Picking another start in the select drops the clicked bits: true when only `before` moved and `toggled` is set. */
    clearsToggled: function (prev, p) {
      return !!prev && p.before !== prev.before && p.toggled !== 0 && p.toggled === prev.toggled;
    },

    /** The caption for a state and a focus (SPEC.md, Captions): the string key, its count or bit, and whether the
        no-effect sentence follows. */
    captionKey: function (st, focus) {
      if (focus === 'chmod') {
        if (st.form === 'none') return { key: 'cNone' };
        if (st.form === 'octal') {
          if (st.lostUnasked.length === 1) return { key: 'cOctalLost', bit: st.lostUnasked[0] };
          if (st.lostUnasked.length > 1) return { key: 'cOctalLostN', n: st.lostUnasked.length };
          if (st.lost.length) return { key: 'cOctalZero', n: st.lost.length };
          return { key: 'cOctalKeep' };
        }
        if (!st.changedBits.length) return { key: 'cSymSame' };
        return { key: 'cSymChanged', n: st.changedBits.length };
      }
      var k = !st.cleared.length ? { key: 'cZero' } : !st.differenceAgrees ? { key: 'cMask' } : { key: 'cAgree', n: st.cleared.length };
      k.noEffect = st.noEffect.length > 0;
      return k;
    },

    /** Presets (SPEC.md, Presets); params on top of the defaults; `focus` is the panel the caption speaks for. */
    presets: [
      { id: 'touch-default', focus: 'create', params: { kind: 'file', umask: '022' } },
      { id: 'chmod-640', focus: 'chmod', params: { before: '644', cmd: '640' } },
      { id: 'symbolic', focus: 'chmod', params: { before: '640', cmd: 'u+x,g-r' } },
      { id: 'octal-erases', focus: 'chmod', params: { before: '700', cmd: '640' } },
      { id: 'umask-077', focus: 'create', params: { kind: 'file', umask: '077' } },
      { id: 'dir-umask', focus: 'create', params: { kind: 'dir', umask: '022', before: '755' } }
    ]
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
