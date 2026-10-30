/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-cgroups: CPU weights and cpu.max, memory.high and memory.max, OOM inside one cgroup.
   An explorer: the state is a pure function of the params (SPEC.md); nothing accumulates over time.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. splitCpu, memoryOutcome, oomOrder,
   sharesToWeight and cpuMax hold no strings and no page code: promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var GROUPS = ['A', 'B', 'C'];
  var HOST_RAM = 16384;      // MB, the host's RAM
  var HOST_OWN = 512;        // MB the host's own processes and kernel use, outside the three groups
  var PERIOD = 100000;       // µs, the default cpu.max period
  var EPS = 1e-9;
  var MEM_OPTS = { '256M': 256, '384M': 384, '512M': 512, '1G': 1024, '2G': 2048 };

  /** Process names and PIDs per group (data, not language). A and B: a small and a large process (1/3 and 2/3 of
      the group's demand); C: two equal workers, so the tie-break (rule 6) can be reached from the page. */
  var PROCS = {
    A: [{ pid: 1201, name: 'api', part: 1 }, { pid: 1202, name: 'cache', part: 2 }],
    B: [{ pid: 1301, name: 'batch', part: 1 }, { pid: 1302, name: 'index', part: 2 }],
    C: [{ pid: 1401, name: 'worker', part: 1 }, { pid: 1402, name: 'worker', part: 1 }]
  };

  function round6(x) { return Math.round(x * 1e6) / 1e6; }
  function byId(a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }

  /** Rules 1–3. groups: [{ id, weight, demand, quota }] (cores; quota 0 = no cpu.max). Water-filling: every group that
      wants CPU gets min(want, its weighted share of what is left); a group that wants less than its share takes only
      what it wants, and the rest is split again among the others by weight, until nothing is left or every group is
      satisfied. want = min(demand, quota). Returns { id: cores } and the idle cores. Groups in id order. */
  function splitCpu(cores, groups) {
    var alloc = {};
    var active = groups.slice().sort(byId).filter(function (g) {
      alloc[g.id] = 0;
      return Math.min(g.demand, g.quota > 0 ? g.quota : Infinity) > EPS;
    }).map(function (g) { return { id: g.id, weight: g.weight, want: Math.min(g.demand, g.quota > 0 ? g.quota : Infinity) }; });
    var left = cores;
    while (active.length && left > EPS) {
      var W = active.reduce(function (s, g) { return s + g.weight; }, 0);
      var done = active.filter(function (g) { return g.want <= left * g.weight / W + EPS; });
      if (!done.length) {
        active.forEach(function (g) { alloc[g.id] = left * g.weight / W; });
        left = 0;
        break;
      }
      done.forEach(function (g) { alloc[g.id] = g.want; left -= g.want; });
      active = active.filter(function (g) { return done.indexOf(g) < 0; });
    }
    Object.keys(alloc).forEach(function (k) { alloc[k] = round6(alloc[k]); });
    return { alloc: alloc, idle: round6(Math.max(0, left)) };
  }

  /** Rule 5's badness, in MB: resident memory (swap and page tables are out of scope, SPEC.md), adjusted by
      oom_score_adj in thousandths of the group's memory.max. */
  function badness(p, limit) { return p.rss + (p.adj || 0) * limit / 1000; }

  /** Rules 5–6: the group's processes in the order the OOM killer would pick them: highest badness first, equal
      badness → the lower PID first (the model's total order). oom_score_adj −1000 is never picked. */
  function oomOrder(procs, limit) {
    return procs.filter(function (p) { return p.adj !== -1000; }).sort(function (a, b) { return badness(b, limit) - badness(a, limit) || a.pid - b.pid; });
  }

  /** Rules 4–5 for one group. procs: [{ pid, rss, adj }]; high, max in MB or null (no limit). The demand is
      anonymous memory and there is no swap, so reclaim cannot free it: over memory.max the OOM killer runs inside the
      group, the worst process first, until the rest fits (or, with oomGroup, every process at once). Above
      memory.high the group is reclaimed and slowed, never killed for it. */
  function memoryOutcome(procs, high, max, oomGroup) {
    var demand = procs.reduce(function (s, p) { return s + p.rss; }, 0);
    var killed = [];
    var oom = max != null && demand > max;
    if (oom) {
      if (oomGroup) killed = procs.filter(function (p) { return p.adj !== -1000; }).map(function (p) { return p.pid; }).sort(function (a, b) { return a - b; });
      else {
        var used = demand;
        oomOrder(procs, max).some(function (p) {
          if (used <= max) return true;
          killed.push(p.pid);
          used -= p.rss;
          return false;
        });
      }
    }
    var memUsed = procs.reduce(function (s, p) { return s + (killed.indexOf(p.pid) >= 0 ? 0 : p.rss); }, 0);
    return { demand: demand, memUsed: memUsed, oom: oom, oomKilled: killed, overHigh: high != null && memUsed > high };
  }

  /** Rule 7: cpu.max for a CPU limit in cores (0 = no limit): "quota period", in µs. */
  function cpuMax(cores) {
    return (cores > 0 ? String(Math.round(cores * PERIOD)) : 'max') + ' ' + PERIOD;
  }

  /** Rule 7: the old cgroup v1 CPU shares (2–262144, default 1024) as cpu.weight (1–10000): the conversion the
      container runtimes use since 2025, a quadratic in log2(shares) that maps 2 → 1, 1024 → 100, 262144 → 10000.
      (The earlier linear one, 1 + (shares − 2) · 9999 / 262142, gave 1024 → 39.) *(check, SPEC.md rule 7)* */
  function sharesToWeight(shares) {
    if (!shares) return 100;
    var s = Math.min(262144, Math.max(2, shares));   // the v1 range
    var l = Math.log2(s);
    return Math.ceil(Math.pow(10, (l * l + 125 * l) / 612 - 7 / 34) - 1e-9);   // 1…10000 over the v1 range
  }

  /** Rule 7: what the container engine writes for its limits (cpus in cores, memory in MB, cpuShares v1 style). */
  function engineFiles(lim) {
    var out = {};
    if (lim.cpus != null) out['cpu.max'] = cpuMax(lim.cpus);
    if (lim.memory != null) out['memory.max'] = lim.memory > 0 ? String(lim.memory * 1024 * 1024) : 'max';
    if (lim.cpuShares != null) out['cpu.weight'] = String(sharesToWeight(lim.cpuShares));
    return out;
  }

  /** A memory file as the kernel reads it back: bytes, or max. */
  function bytes(mb) { return mb == null ? 'max' : String(mb * 1024 * 1024); }

  function memValue(v) { return MEM_OPTS[v] != null ? MEM_OPTS[v] : null; }

  /** A group's processes for a memory demand in MB: the parts of PROCS, the last one takes the rounding. */
  function procsFor(id, demand) {
    var parts = PROCS[id], total = parts.reduce(function (s, x) { return s + x.part; }, 0), given = 0;
    return parts.map(function (x, i) {
      var rss = i === parts.length - 1 ? demand - given : Math.floor(demand * x.part / total);
      given += rss;
      return { pid: x.pid, name: x.name, rss: rss, adj: 0 };
    });
  }

  /** The whole state from the params (SPEC.md, State). */
  function compute(p) {
    // memory first: a group whose processes were all killed wants no CPU any more
    var mem = {};
    GROUPS.forEach(function (id) {
      var procs = procsFor(id, p['mem' + id]);
      var m = memoryOutcome(procs, memValue(p['memHigh' + id]), memValue(p['memMax' + id]), p.oomGroup);
      mem[id] = { procs: procs, m: m, dead: m.oomKilled.length === procs.length };
    });
    var cpu = splitCpu(p.cores, GROUPS.map(function (id) {
      return { id: id, weight: p['weight' + id], demand: mem[id].dead ? 0 : p['cpu' + id], quota: p['quota' + id] };
    }));
    var memTotal = 0;
    var groups = GROUPS.map(function (id) {
      var weight = p['weight' + id], quota = p['quota' + id], demandCpu = mem[id].dead ? 0 : p['cpu' + id];
      var memHigh = memValue(p['memHigh' + id]), memMax = memValue(p['memMax' + id]);
      var procs = mem[id].procs, m = mem[id].m;
      var alloc = cpu.alloc[id];
      memTotal += m.memUsed;
      return {
        id: id, weight: weight, quota: quota, demandCpu: demandCpu, alloc: alloc,
        // rule 3: throttled when cpu.max, not the weights, is what stops the group
        throttled: quota > 0 && demandCpu > quota + EPS && alloc >= quota - EPS,
        memHigh: memHigh, memMax: memMax, demandMem: m.demand, memUsed: m.memUsed,
        procs: procs.map(function (x) { return { pid: x.pid, name: x.name, rss: x.rss, killed: m.oomKilled.indexOf(x.pid) >= 0 }; }),
        oom: m.oom, oomKilled: m.oomKilled, overHigh: m.overHigh, allKilled: mem[id].dead,
        files: {
          'cpu.weight': String(weight),
          'cpu.max': cpuMax(quota),
          'memory.high': bytes(memHigh),
          'memory.max': bytes(memMax),
          'memory.oom.group': p.oomGroup ? '1' : '0'
        }
      };
    });
    return {
      cores: p.cores, idle: cpu.idle, groups: groups,
      hostRam: HOST_RAM, hostOwn: HOST_OWN, memTotal: memTotal, hostFree: HOST_RAM - HOST_OWN - memTotal
    };
  }

  function group(s, id) { return s.groups.filter(function (g) { return g.id === id; })[0]; }

  /** What changed between two states, per group: 'cpu' (allocation or throttling), 'mem' (use, high, kills). */
  function changed(prev, s) {
    var out = [];
    if (!prev) return out;
    s.groups.forEach(function (g) {
      var q = group(prev, g.id);
      if (!q) return;
      if (q.alloc !== g.alloc || q.throttled !== g.throttled || q.demandCpu !== g.demandCpu || q.quota !== g.quota) out.push(g.id + ':cpu');
      if (q.memUsed !== g.memUsed || q.overHigh !== g.overHigh || q.demandMem !== g.demandMem || q.memHigh !== g.memHigh ||
          q.memMax !== g.memMax || q.oomKilled.join() !== g.oomKilled.join()) out.push(g.id + ':mem');
    });
    return out;
  }

  var CPU_KEYS = /^(weight|quota|cpu)([ABC])$/;
  var MEM_KEYS = /^(memMax|memHigh|mem)([ABC])$/;

  /** Which group and which half (cpu or mem) the caption speaks about: the param changed last; a preset speaks for
      its own focus; picking the group to edit moves the focus to it; with no history, the default preset's. */
  function nextFocus(focus, prevParams, params, preset, prevPreset) {
    var f = focus || { g: 'B', aspect: 'cpu' };
    if (preset && preset !== prevPreset) {
      var pr = logic.presets.filter(function (x) { return x.id === preset; })[0];
      if (pr) return { g: pr.focus.g, aspect: pr.focus.aspect };
    }
    if (!prevParams) return f;
    var keys = Object.keys(params).filter(function (k) { return prevParams[k] !== params[k]; });
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], m;
      if ((m = CPU_KEYS.exec(k))) return { g: m[2], aspect: 'cpu' };
      if ((m = MEM_KEYS.exec(k))) return { g: m[2], aspect: 'mem' };
    }
    if (keys.indexOf('cores') >= 0) return { g: f.g, aspect: 'cpu' };
    if (keys.indexOf('oomGroup') >= 0) return { g: f.g, aspect: 'mem' };
    if (keys.indexOf('group') >= 0) return { g: params.group, aspect: f.aspect };
    return f;
  }

  /** The caption for a state and a focus (SPEC.md, Captions): a key and its numbers. Pure; the page fills the words. */
  function captionKey(s, focus) {
    var g = group(s, focus.g);
    if (focus.aspect === 'mem') {
      if (g.oom && g.files['memory.oom.group'] === '1') return { key: 'cOomGroup', g: g.id, max: g.memMax, n: g.oomKilled.length, free: s.hostFree };
      if (g.oom) {
        var victim = g.procs.filter(function (x) { return x.pid === g.oomKilled[0]; })[0];
        var tie = g.procs.filter(function (x) { return x.rss === victim.rss; }).length > 1;
        return { key: tie && g.oomKilled.length === 1 ? 'cOomTie' : 'cOom', g: g.id, max: g.memMax, pid: victim.pid, name: victim.name, rss: victim.rss,
          n: g.oomKilled.length, free: s.hostFree };
      }
      if (g.overHigh) return { key: g.memMax != null ? 'cHigh' : 'cHighNoMax', g: g.id, used: g.memUsed, high: g.memHigh, max: g.memMax };
      if (!g.demandMem) return { key: 'cMemNone', g: g.id };
      return { key: g.memMax != null ? 'cMemFits' : 'cMemNoMax', g: g.id, used: g.memUsed, max: g.memMax, free: s.hostFree };
    }
    if (g.throttled) return { key: s.idle > EPS ? 'cThrottledIdle' : 'cThrottled', g: g.id, want: g.demandCpu, quota: g.quota, idle: s.idle };
    if (!g.demandCpu) return { key: s.idle > EPS ? 'cCpuNoneIdle' : 'cCpuNone', g: g.id, idle: s.idle };
    var wanting = s.groups.filter(function (x) { return x.demandCpu > EPS && !(x.quota > 0 && x.demandCpu > x.quota + EPS && x.alloc >= x.quota - EPS); });
    var short = wanting.filter(function (x) { return x.alloc < x.demandCpu - EPS; });
    if (short.length === 2 && wanting.length === 2) {
      var hi = short[0].weight >= short[1].weight ? short[0] : short[1], lo = hi === short[0] ? short[1] : short[0];
      if (hi.weight === lo.weight) return { key: 'cEqual', a: lo.id, b: hi.id, w: hi.weight, ca: lo.alloc, cb: hi.alloc };
      return { key: 'cContention', hi: hi.id, lo: lo.id, wh: hi.weight, wl: lo.weight, ch: hi.alloc, cl: lo.alloc,
        ratio: Math.round(hi.weight / lo.weight * 100) / 100 };
    }
    if (short.length === 1 && wanting.length === 1) return { key: 'cAlone', g: short[0].id, got: short[0].alloc, want: short[0].demandCpu };
    if (short.length >= 1) {
      return { key: 'cSplit', a: group(s, 'A').alloc, b: group(s, 'B').alloc, c: group(s, 'C').alloc, wa: group(s, 'A').weight,
        wb: group(s, 'B').weight, wc: group(s, 'C').weight };
    }
    var W = s.groups.reduce(function (sum, x) { return sum + x.weight; }, 0);
    var nominal = round6(s.cores * g.weight / W);
    if (g.alloc > nominal + 1e-6) return { key: 'cWorkConserving', g: g.id, got: g.alloc, share: nominal, idle: s.idle };
    return { key: 'cNoContention', g: g.id, got: g.alloc, idle: s.idle };
  }

  var logic = {
    /** Parameter defaults (SPEC.md, Params): the first preset, weights-contention. group is the view: which group's
        sliders the panel shows. */
    defaults: {
      cores: 2, group: 'A',
      weightA: 100, weightB: 300, weightC: 100,
      quotaA: 0, quotaB: 0, quotaC: 0,
      cpuA: 2, cpuB: 2, cpuC: 0,
      memMaxA: '512M', memMaxB: '512M', memMaxC: '512M',
      memHighA: 'off', memHighB: 'off', memHighC: 'off',
      memA: 300, memB: 300, memC: 0,
      oomGroup: false
    },

    /** The page's presets (SPEC.md, Presets): params over the defaults, and what the caption speaks about. */
    presets: [
      { id: 'weights-contention', params: { group: 'B' }, focus: { g: 'B', aspect: 'cpu' } },
      { id: 'weights-idle', params: { group: 'B', cpuB: 0 }, focus: { g: 'A', aspect: 'cpu' } },
      { id: 'quota-cap', params: { cores: 4, cpuA: 4, quotaA: 0.5, cpuB: 0 }, focus: { g: 'A', aspect: 'cpu' } },
      { id: 'oom-inside', params: { memA: 600 }, focus: { g: 'A', aspect: 'mem' } },
      { id: 'high-throttle', params: { memA: 450, memHighA: '384M' }, focus: { g: 'A', aspect: 'mem' } },
      { id: 'oom-group', params: { memA: 600, oomGroup: true }, focus: { g: 'A', aspect: 'mem' } }
    ],

    /** Explorer: the state is computed from the params. */
    initial: function (p) { return compute(p); },

    GROUPS: GROUPS, HOST_RAM: HOST_RAM, HOST_OWN: HOST_OWN, PERIOD: PERIOD, MEM_OPTS: MEM_OPTS, PROCS: PROCS,
    splitCpu: splitCpu, badness: badness, oomOrder: oomOrder, memoryOutcome: memoryOutcome, cpuMax: cpuMax,
    sharesToWeight: sharesToWeight, engineFiles: engineFiles, procsFor: procsFor, compute: compute, group: group,
    changed: changed, nextFocus: nextFocus, captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
