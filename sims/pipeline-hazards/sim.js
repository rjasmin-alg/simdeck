/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for pipeline-hazards: a five-stage in-order pipeline (IF ID EX MEM WB) running a short RISC-V-like program,
   one clock cycle per step: data hazards (stalls without forwarding, the load-use stall with it), the forwarding
   paths EX/MEM → EX and MEM/WB → EX, and the flush of a taken branch (predicted not taken, resolved in EX).
   Rules and numbers: SPEC.md (Patterson & Hennessy, COD RISC-V ed., §4.6–4.8).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. One step = one clock cycle. */
(function (root) {
  'use strict';

  var STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];

  // The presets' programs (SPEC.md "Presets"). A branch carries `taken`; its target is a label ("L: ...").
  var PROGRAMS = {
    'independent': ['add x1,x2,x3', 'sub x4,x5,x6', 'and x7,x8,x9', 'or x10,x11,x12'],
    'raw': ['add x1,x2,x3', 'sub x4,x1,x5'],
    'load-use': ['lw x1,0(x2)', 'add x3,x1,x4'],
    'mixed': ['lw x1,0(x2)', 'add x3,x1,x4', 'sub x5,x3,x6', { text: 'beq x5,x0,L', taken: true },
      'addi x7,x0,1', 'addi x8,x0,2', 'L: sw x3,8(x2)']
  };
  var PROGRAM_IDS = ['independent', 'raw', 'load-use', 'mixed'];

  function reg(s) {
    var m = /^x(\d+)$/.exec(String(s).trim());
    if (!m) throw new Error('bad register: ' + s);
    return Number(m[1]);
  }

  /** One line of assembly → { text, label, op, kind, dst, src, target }. Sources in reading order; dst null when none. */
  function parse(line) {
    var src = typeof line === 'string' ? { text: line } : line;
    var text = src.text, label = null, body = text;
    var lm = /^\s*(\w+):\s*(.*)$/.exec(text);
    if (lm) { label = lm[1]; body = lm[2]; }
    var om = /^(\w+)\s+(.*)$/.exec(body.trim());
    if (!om) throw new Error('bad instruction: ' + text);
    var op = om[1], args = om[2].split(',').map(function (a) { return a.trim(); });
    var out = { text: text, label: label, op: op, kind: 'alu', dst: null, src: [], target: null, taken: !!src.taken };
    var mem;
    if (op === 'lw') {
      mem = /^(-?\d+)\((x\d+)\)$/.exec(args[1]);
      out.kind = 'load'; out.dst = reg(args[0]); out.src = [reg(mem[2])];
    } else if (op === 'sw') {
      mem = /^(-?\d+)\((x\d+)\)$/.exec(args[1]);
      out.kind = 'store'; out.src = [reg(mem[2]), reg(args[0])];   // base, then the data register (rule 7)
    } else if (op === 'beq' || op === 'bne') {
      out.kind = 'branch'; out.src = [reg(args[0]), reg(args[1])]; out.target = args[2];
    } else if (/i$/.test(op)) {
      out.dst = reg(args[0]); out.src = [reg(args[1])];
    } else {
      out.dst = reg(args[0]); out.src = [reg(args[1]), reg(args[2])];
    }
    return out;
  }

  function programOf(p) {
    var lines = (p && PROGRAMS[p.program]) || PROGRAMS.independent;
    var prog = lines.map(parse);
    // A taken branch must jump forward past the two instructions it flushes (SPEC "Programs"): a nearer or a backward
    // target would be fetched as a wrong-path instruction or loop; no preset needs either.
    prog.forEach(function (q, i) {
      if (q.kind !== 'branch' || !q.taken) return;
      var t = -1;
      prog.forEach(function (r, j) { if (r.label === q.target) t = j; });
      if (t < i + 3) throw new Error('taken branch ' + q.text + ': target must be at least 3 lines ahead');
    });
    return prog;
  }

  function isInstr(v) { return typeof v === 'number'; }
  function copy(s) { return JSON.parse(JSON.stringify(s)); }

  /** The newest instruction older than `id` that writes `r` and was not flushed (rule 6: the newer producer wins). */
  function producerOf(s, id, r) {
    if (r === 0) return null;                                   // rule 7: x0 is never a hazard
    for (var j = id - 1; j >= 0; j--) {
      var q = s.instrs[j];
      if (q.fetched && q.flushed == null && q.dst === r) return j;
    }
    return null;
  }

  /** Where `j` sits in the occupancy `at` ('IF' … 'WB'), or null. */
  function stageOf(at, j) {
    for (var i = 0; i < STAGES.length; i++) if (at[STAGES[i]] === j) return STAGES[i];
    return null;
  }

  /** Rules 3 and 4: must the instruction in ID (occupancy `at`) stay there this cycle? → { producer, reg, cause } or null. */
  function hazard(s, at, forwarding) {
    var c = at.ID;
    if (!isInstr(c) || s.instrs[c].flushed != null) return null;
    var me = s.instrs[c];
    for (var k = 0; k < me.src.length; k++) {
      var r = me.src[k], j = producerOf(s, c, r);
      if (j == null) continue;
      var where = stageOf(at, j);
      if (forwarding) {
        if (where === 'EX' && s.instrs[j].kind === 'load') return { producer: j, reg: r, cause: 'load-use' };
      } else if (where === 'EX' || where === 'MEM') {
        return { producer: j, reg: r, cause: 'no-forwarding' };
      }
    }
    return null;
  }

  /** Index of the instruction with this label (a taken branch's target). */
  function indexOfLabel(s, label) {
    for (var i = 0; i < s.instrs.length; i++) if (s.instrs[i].label === label) return i;
    return null;
  }

  var logic = {
    STAGES: STAGES,
    PROGRAMS: PROGRAMS,
    PROGRAM_IDS: PROGRAM_IDS,
    parse: parse,
    programOf: programOf,
    producerOf: producerOf,
    hazard: hazard,

    defaults: { program: 'independent', forwarding: true },

    /** One step per clock cycle until the last instruction leaves WB (8, 6 or 8, 7 or 8, 12 or 17). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (!s.finished && n < 200) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** Before cycle 1: the program, nothing fetched, the pipeline empty. */
    initial: function (p) {
      var instrs = programOf(p).map(function (q, i) {
        return { id: i, text: q.text, label: q.label, op: q.op, kind: q.kind, dst: q.dst, src: q.src, target: q.target,
          taken: q.taken, fetched: false, stages: { IF: null, ID: null, EX: null, MEM: null, WB: null },
          held: [], flushed: null, flushedIn: null, wrongPath: false };
      });
      return { cycle: 0, instrs: instrs, inStage: { IF: null, ID: null, EX: null, MEM: null, WB: null }, pc: 0,
        stalls: 0, flushes: 0, completed: 0, forwards: [], regPasses: [], finished: false, last: null };
    },

    /** Cycle n: (1) WB, (2) hazard check on ID, (3) advance or hold IF/ID with a bubble into EX,
        (4) a branch in EX resolves, a taken one flushes IF and ID, (5) forwards and counts. */
    step: function (prev, n, p) {
      var s = copy(prev);
      var at = prev.inStage, now = {};
      var ev = { cycle: n, stall: null, flush: null, notTaken: null, forwards: [], regPasses: [], fetched: null,
        completed: null };
      s.cycle = n;

      // a flushed instruction leaves its slot as a bubble (nop)
      function moved(v) { return isInstr(v) && s.instrs[v].flushed != null ? 'flushed' : v; }

      // (1) and (2): WB this cycle is what was in MEM; the hazard unit looks at ID against EX and MEM
      var hz = hazard(prev, at, !!p.forwarding);
      now.WB = moved(at.MEM);
      now.MEM = moved(at.EX);
      // (3) hold or advance
      if (hz) {
        now.EX = 'bubble';
        now.ID = at.ID;
        now.IF = at.IF;
        s.stalls++;
        ev.stall = { consumer: at.ID, producer: hz.producer, reg: hz.reg, cause: hz.cause };
        if (isInstr(at.ID)) s.instrs[at.ID].held.push(n);
        if (isInstr(at.IF)) s.instrs[at.IF].held.push(n);
      } else {
        now.EX = moved(at.ID);
        now.ID = moved(at.IF);
        now.IF = null;
        if (s.pc != null && s.pc < s.instrs.length) {           // rule 1: one fetch per cycle
          now.IF = s.pc;
          s.instrs[s.pc].fetched = true;
          ev.fetched = s.pc;
          s.pc = s.pc + 1;
        }
      }
      STAGES.forEach(function (st) {
        var v = now[st];
        if (isInstr(v) && s.instrs[v].stages[st] == null) s.instrs[v].stages[st] = n;
      });
      if (isInstr(now.WB)) { s.completed++; ev.completed = now.WB; }

      // (4) a branch entering EX this cycle resolves (rule 5): predicted not taken, so a taken one flushes ID and IF
      if (isInstr(now.EX) && s.instrs[now.EX].kind === 'branch') {
        var b = s.instrs[now.EX];
        if (b.taken) {
          var gone = [];
          ['ID', 'IF'].forEach(function (st) {
            var v = now[st];
            if (isInstr(v)) { s.instrs[v].flushed = n; s.instrs[v].flushedIn = st; s.instrs[v].wrongPath = true; gone.push(v); }
          });
          s.flushes += gone.length;
          var t = indexOfLabel(s, b.target);
          s.pc = t;
          ev.flush = { branch: now.EX, ids: gone, target: t };
        } else {
          ev.notTaken = now.EX;
        }
      }

      // (5) where the instruction in EX gets each source (rule 4, tie-break rule 6), and the register-file pass (rule 2)
      if (isInstr(now.EX)) {
        var c = now.EX;
        s.instrs[c].src.forEach(function (r) {
          var j = producerOf(s, c, r);
          if (j == null || !p.forwarding) return;
          var where = stageOf(now, j);
          var from = where === 'MEM' ? 'EX/MEM' : where === 'WB' ? 'MEM/WB' : null;
          if (from === 'EX/MEM' && s.instrs[j].kind === 'load') throw new Error('load value used in its own MEM cycle');
          if (from) ev.forwards.push({ from: from, to: 'EX', reg: r, cycle: n, producer: j, consumer: c });
        });
      }
      if (isInstr(now.ID) && isInstr(now.WB) && s.instrs[now.ID].flushed == null) {
        var d = now.ID;
        s.instrs[d].src.forEach(function (r) {
          var j = producerOf(s, d, r);
          if (j === now.WB) ev.regPasses.push({ reg: r, cycle: n, producer: j, consumer: d });
        });
      }
      s.forwards = s.forwards.concat(ev.forwards);
      s.regPasses = s.regPasses.concat(ev.regPasses);

      s.inStage = now;
      s.last = ev;
      // done when the last instruction is in WB: nothing left in IF … MEM and nothing left to fetch
      s.finished = !isInstr(now.IF) && !isInstr(now.ID) && !isInstr(now.EX) && !isInstr(now.MEM) &&
        (s.pc == null || s.pc >= s.instrs.length);
      return s;
    },

    /** What a cell of the diagram shows: 'IF' … 'WB', 'stall', 'flush', or null (empty). */
    cell: function (q, cycle) {
      if (q.flushed === cycle) return 'flush';
      if (q.flushed != null && cycle > q.flushed) return null;
      if (q.held.indexOf(cycle) >= 0) return 'stall';
      // held cycles happen only in IF and ID, so every other stage lasts the one cycle it was entered in
      for (var i = 0; i < STAGES.length; i++) if (q.stages[STAGES[i]] === cycle) return STAGES[i];
      return null;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
