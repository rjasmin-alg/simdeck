/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-functional-levels: the domain and forest functional levels of one forest with two domains
   (quillmoor.example from the estate, thornfell.example invented in win-ad-structure), their DCs and the operating
   system each runs, an optional new DC being promoted into quillmoor.example, and the AD Recycle Bin switch.
   It answers, for any rung of the three ladders, what that level unlocks, what it rules out, and whether moving
   there is allowed now (and if not, who blocks it). An explorer: initial(params) is the whole model, no steps.
   Rules and expected results: SPEC.md. Source: Microsoft Learn, "Active Directory Domain Services functional
   levels in Windows Server" (2025-10-30) and its archived predecessor (2008 R2 era) for levels before 2012 R2.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Functional levels, lowest first. Windows Server 2019 and 2022 added none (rule 4). */
  var LEVELS = ['2003', '2008', '2008R2', '2012', '2012R2', '2016', '2025'];

  /** DC operating systems, oldest first. top = the highest level it can run at; floor = the lowest (rule 1, rule 5).
      2019 and 2022 run at most at 2016. Floors: 2025 needs 2016 (Microsoft's matrix); 2019 and 2022 need 2008,
      because they no longer replicate SYSVOL with FRS (check). */
  var OSES = [
    { id: '2003', top: '2003', floor: '2003' },
    { id: '2008', top: '2008', floor: '2003' },
    { id: '2008R2', top: '2008R2', floor: '2003' },
    { id: '2012', top: '2012', floor: '2003' },
    { id: '2012R2', top: '2012R2', floor: '2003' },
    { id: '2016', top: '2016', floor: '2003' },
    { id: '2019', top: '2016', floor: '2008' },
    { id: '2022', top: '2016', floor: '2008' },
    { id: '2025', top: '2025', floor: '2016' }
  ];

  /** The forest's domains, root first. */
  var DOMAINS = [
    { id: 'q', name: 'quillmoor.example', param: 'dq' },
    { id: 'thf', name: 'thornfell.example', param: 'dt' }
  ];
  /** The ladders: one per domain, then the forest. */
  var LADDERS = ['q', 'thf', 'forest'];

  /** The DCs, in drawing order; param = the hidden param that holds its OS. The estate's three are quillmoor's. */
  var DCS = [
    { id: 'qm-dc01', domain: 'q', param: 'o1' },
    { id: 'qm-dc02', domain: 'q', param: 'o2' },
    { id: 'brk-dc03', domain: 'q', param: 'o3' },
    { id: 'thf-dc01', domain: 'thf', param: 'o4' }
  ];
  /** The new DC the extraDc param promotes into quillmoor.example. */
  var EXTRA = { id: 'qm-dc04', domain: 'q' };
  var EXTRA_OPTIONS = ['none', '2012R2', '2016', '2025'];
  /** What a DC can be replaced with on its card. */
  var REPLACE_WITH = ['2022', '2025'];

  /** What each level unlocks (rule 4): feature ids, domain and forest apart. The page words them. */
  var UNLOCKS = {
    domain: {
      '2003': ['lastLogon', 'constrainedDelegation', 'dcRename'],
      '2008': ['dfsrSysvol', 'fgpp', 'aesKerberos'],
      '2008R2': ['authAssurance', 'msaSpn'],
      '2012': ['claimsArmoring'],
      '2012R2': ['protectedUsers', 'authPolicies'],
      '2016': ['ntlmRolling', 'ntlmDevices', 'pkinitFreshness'],
      '2025': ['page32k']
    },
    forest: {
      '2003': ['forestTrust', 'domainRename'],
      '2008': [],
      '2008R2': ['recycleBin'],
      '2012': [],
      '2012R2': [],
      '2016': ['pam'],
      '2025': []
    }
  };
  /** What a level rules out beyond the DC operating systems (rule 5). */
  var RULES_OUT = {
    domain: { '2016': ['frsSysvol'] },
    forest: { '2016': ['frsSysvol'] }
  };

  function idx(level) { return LEVELS.indexOf(level); }
  function os(id) { for (var i = 0; i < OSES.length; i++) if (OSES[i].id === id) return OSES[i]; return null; }
  function domain(id) { for (var i = 0; i < DOMAINS.length; i++) if (DOMAINS[i].id === id) return DOMAINS[i]; return null; }
  function isLevel(v) { return idx(v) >= 0; }
  function kindOf(ladder) { return ladder === 'forest' ? 'forest' : 'domain'; }

  /** Rule 1 and rule 5: can a DC on this OS run at this level? */
  function supports(osId, level) {
    var o = os(osId);
    return !!o && isLevel(level) && idx(o.floor) <= idx(level) && idx(level) <= idx(o.top);
  }
  /** The operating systems that can run as a DC at a level, oldest first. */
  function osesAt(level) { return OSES.filter(function (o) { return supports(o.id, level); }).map(function (o) { return o.id; }); }
  /** The operating systems a level rules out: those too old (below) and those too new for it (above), oldest first. */
  function osesRuledOut(level) {
    var below = [], above = [];
    OSES.forEach(function (o) {
      if (supports(o.id, level)) return;
      if (idx(o.top) < idx(level)) below.push(o.id); else above.push(o.id);
    });
    return { below: below, above: above };
  }

  /** Rule 3: documented lowering. Only from 2008 R2, 2012 or 2012 R2, never below 2008; a forest with the Recycle
      Bin on never below 2008 R2. When both apply (below 2008 with the Recycle Bin on), the reason is one-way. Nothing is documented for lowering from 2016 or 2025 (modelled as one-way). */
  function rollback(kind, from, to, rbOn) {
    var f = idx(from), t = idx(to);
    if (f < 0 || t < 0 || t >= f) return { ok: false, reason: 'not-lower' };
    if (f > idx('2012R2')) return { ok: false, reason: 'undocumented' };
    if (f < idx('2008R2') || t < idx('2008')) return { ok: false, reason: 'one-way' };
    if (kind === 'forest' && rbOn && t < idx('2008R2')) return { ok: false, reason: 'recycle-bin' };
    return { ok: true, reason: null };
  }
  /** The lowest level a ladder could be lowered to by the table alone (its current level when none). */
  function floorOf(kind, from, rbOn) {
    for (var i = 0; i < idx(from); i++) if (rollback(kind, from, LEVELS[i], rbOn).ok) return LEVELS[i];
    return from;
  }

  function levelOf(s, ladder) { return ladder === 'forest' ? s.forest : s.levels[ladder]; }
  function joinedDcs(s, d) { return s.dcs.filter(function (x) { return x.joined && (!d || x.domain === d); }); }

  /** Can a ladder move to a target level now? Rules 1, 2, 3 and the tie-break (rule 6).
      { ladder, target, kind: 'current' | 'raise' | 'lower', ok, dcs: [ids], domains: [ids], forest: bool,
        rollback: null | reason }. dcs (rule 1) always come before domains (rule 2). */
  function check(s, ladder, target) {
    var out = { ladder: ladder, target: target, kind: 'current', ok: false, dcs: [], domains: [], forest: false, rollback: null };
    var cur = levelOf(s, ladder);
    if (!isLevel(target) || cur === undefined) { out.kind = 'unknown'; return out; }
    if (target === cur) { out.ok = true; return out; }
    var k = kindOf(ladder);
    if (idx(target) > idx(cur)) {
      out.kind = 'raise';
      // rule 1: every DC in the domain (in the forest, for the forest ladder) must run an OS that supports it
      joinedDcs(s, k === 'forest' ? null : ladder).forEach(function (x) { if (!supports(x.os, target)) out.dcs.push(x.id); });
      // rule 2: the forest can be at most the lowest domain level
      if (k === 'forest') DOMAINS.forEach(function (d) { if (idx(s.levels[d.id]) < idx(target)) out.domains.push(d.id); });
    } else {
      out.kind = 'lower';
      var r = rollback(k, cur, target, s.rb);
      if (!r.ok) out.rollback = r.reason;
      // rule 2 seen from the domain: a domain can't go below the forest level
      if (k === 'domain' && idx(target) < idx(s.forest)) out.forest = true;
    }
    out.ok = !out.dcs.length && !out.domains.length && !out.forest && !out.rollback;
    return out;
  }

  /** Can a DC run here, given its domain's level and the forest level? Rule 5. reason: 'domain' | 'forest' | null,
      the domain's level checked first. */
  function canRun(s, osId, d) {
    if (!supports(osId, s.levels[d])) return { ok: false, reason: 'domain', level: s.levels[d] };
    if (!supports(osId, s.forest)) return { ok: false, reason: 'forest', level: s.forest };
    return { ok: true, reason: null, level: null };
  }

  /** Can the Recycle Bin be turned on? The forest must be at 2008 R2 or higher; once on, it stays on. */
  function recycleBin(s) {
    if (s.rb) return { ok: false, reason: 'already-on' };
    if (idx(s.forest) < idx('2008R2')) return { ok: false, reason: 'forest-level' };
    return { ok: true, reason: null };
  }

  /** What a rung unlocks and rules out (rules 4, 5). */
  function rung(ladder, level) {
    var k = kindOf(ladder);
    return {
      unlocks: (UNLOCKS[k][level] || []).slice(),
      rulesOut: ((RULES_OUT[k] || {})[level] || []).slice(),
      oses: osesAt(level),
      ruledOut: osesRuledOut(level)
    };
  }

  /** A ladder's rung state for drawing: 'current', 'below' (reached already), 'raise-ok' or 'raise-no'. */
  function rungState(s, ladder, level) {
    var c = idx(levelOf(s, ladder)), l = idx(level);
    if (l === c) return 'current';
    if (l < c) return 'below';
    return check(s, ladder, level).ok ? 'raise-ok' : 'raise-no';
  }

  /** The value of every hidden param an action can produce (the page's select options). */
  function lastValues() {
    var out = [''];
    LADDERS.forEach(function (l) { LEVELS.forEach(function (v) { ['up', 'down', 'no'].forEach(function (o) { out.push('set:' + l + ':' + v + ':' + o); }); }); });
    DCS.forEach(function (x) { REPLACE_WITH.forEach(function (o) { out.push('os:' + x.id + ':' + o + ':ok', 'os:' + x.id + ':' + o + ':no'); }); });
    out.push('rb:on:ok', 'rb:on:no');
    return out;
  }
  function selValues() {
    var out = [''];
    LADDERS.forEach(function (l) { LEVELS.forEach(function (v) { out.push(l + ':' + v); }); });
    DCS.concat([EXTRA]).forEach(function (x) { out.push('dc:' + x.id); });
    return out;
  }

  /** Parse a 'last' param into { action, ladder|dc, target, ok, up }, or null. A set's outcome is up, down or no. */
  function parseLast(v) {
    var r = /^rb:on:(ok|no)$/.exec(v || '');
    if (r) return { action: 'rb', ok: r[1] === 'ok' };
    var m = /^(set):([^:]+):([^:]+):(up|down|no)$/.exec(v || '') || /^(os):([^:]+):([^:]+):(ok|no)$/.exec(v || '');
    if (!m) return null;
    if (m[1] === 'set') return { action: 'set', ladder: m[2], target: m[3], ok: m[4] !== 'no', up: m[4] === 'up' };
    if (m[1] === 'os') return { action: 'os', dc: m[2], target: m[3], ok: m[4] === 'ok' };
  }

  var defaults = {
    extraDc: 'none',
    dq: '2012R2', dt: '2012R2', fl: '2012R2',
    o1: '2012R2', o2: '2012R2', o3: '2012R2', o4: '2012R2',
    rb: 'off', sel: '', last: ''
  };

  function initial(p) {
    var s = {
      levels: {},
      forest: isLevel(p.fl) ? p.fl : defaults.fl,
      rb: p.rb === 'on',
      dcs: [],
      extra: null,
      selected: null,
      last: null
    };
    DOMAINS.forEach(function (d) { s.levels[d.id] = isLevel(p[d.param]) ? p[d.param] : defaults[d.param]; });
    // A params set that breaks rule 2 (a domain below the forest) is repaired by lowering the forest to the lowest
    // domain, so the state is always one AD would accept.
    DOMAINS.forEach(function (d) { if (idx(s.levels[d.id]) < idx(s.forest)) s.forest = s.levels[d.id]; });
    if (s.rb && idx(s.forest) < idx('2008R2')) s.rb = false;
    DCS.forEach(function (x) {
      s.dcs.push({ id: x.id, domain: x.domain, os: os(p[x.param]) ? p[x.param] : defaults[x.param], joined: true, extra: false });
    });
    // A DC already in a domain whose OS does not fit its levels is impossible in AD; only a hand-made URL can say so.
    // Such a DC is still drawn and counted (it blocks raising), and fits: false lets the page flag it.
    s.dcs.forEach(function (x) { x.fits = canRun(s, x.os, x.domain).ok; });
    if (EXTRA_OPTIONS.indexOf(p.extraDc) > 0) {
      var run = canRun(s, p.extraDc, EXTRA.domain);
      s.extra = { id: EXTRA.id, domain: EXTRA.domain, os: p.extraDc, joined: run.ok, extra: true, fits: run.ok, refused: run.reason, refusedAt: run.level };
      s.dcs.push(s.extra);
    }
    var m = /^(q|thf|forest):(.+)$/.exec(p.sel || '');
    if (m && isLevel(m[2])) s.selected = { ladder: m[1], level: m[2] };
    else if (/^dc:/.test(p.sel || '') && s.dcs.some(function (x) { return 'dc:' + x.id === p.sel; })) s.selected = { dc: p.sel.slice(3) };

    // The last action's outcome is shown only while it still describes the state: a raise that succeeded is still
    // the current level, a refusal is still refused.
    var last = parseLast(p.last);
    if (last) {
      var fresh = false;
      if (last.action === 'set' && LADDERS.indexOf(last.ladder) >= 0 && isLevel(last.target)) {
        fresh = last.ok ? levelOf(s, last.ladder) === last.target : !check(s, last.ladder, last.target).ok && levelOf(s, last.ladder) !== last.target;
      } else if (last.action === 'os') {
        var dc = s.dcs.filter(function (x) { return x.id === last.dc && !x.extra; })[0];
        fresh = !!dc && REPLACE_WITH.indexOf(last.target) >= 0 && (last.ok ? dc.os === last.target : dc.os !== last.target && !canRun(s, last.target, dc.domain).ok);
      } else if (last.action === 'rb') {
        fresh = last.ok ? s.rb : !recycleBin(s).ok && !s.rb;
      }
      if (fresh) s.last = last;
    }
    return s;
  }

  /** Apply an action to params; returns the patch for the page to set. Actions: { action: 'set', ladder, target },
      { action: 'os', dc, target }, { action: 'rb' }. A refused action changes nothing but `last`. */
  function act(p, a) {
    var s = initial(p);
    var patch = {};
    if (a.action === 'set') {
      var c = check(s, a.ladder, a.target);
      if (c.kind === 'unknown' || c.kind === 'current') return { sel: a.ladder + ':' + a.target };
      if (c.ok) patch[a.ladder === 'forest' ? 'fl' : domain(a.ladder).param] = a.target;
      patch.last = 'set:' + a.ladder + ':' + a.target + ':' + (!c.ok ? 'no' : c.kind === 'raise' ? 'up' : 'down');
      patch.sel = a.ladder + ':' + a.target;
    } else if (a.action === 'os') {
      var x = DCS.filter(function (d) { return d.id === a.dc; })[0];
      if (!x || REPLACE_WITH.indexOf(a.target) < 0) return {};
      var cur = s.dcs.filter(function (d) { return d.id === a.dc; })[0];
      if (cur.os === a.target) return { sel: 'dc:' + a.dc };
      var r = canRun(s, a.target, x.domain);
      if (r.ok) patch[x.param] = a.target;
      patch.last = 'os:' + a.dc + ':' + a.target + ':' + (r.ok ? 'ok' : 'no');
      patch.sel = 'dc:' + a.dc;
    } else if (a.action === 'rb') {
      var b = recycleBin(s);
      if (b.reason === 'already-on') return {};
      if (b.ok) patch.rb = 'on';
      patch.last = 'rb:on:' + (b.ok ? 'ok' : 'no');
    }
    return patch;
  }

  var logic = {
    defaults: defaults,

    /** The four lenses (task presets). Each sets every hidden param, so they are independent of each other. */
    presets: [
      { id: 'quillmoor', params: { sel: 'q:2016' } },
      { id: 'upgraded-dcs', params: { o1: '2022', o2: '2022', o3: '2022', o4: '2022', sel: 'q:2016' } },
      { id: 'old-dc-present', params: { o1: '2022', o2: '2022', o3: '2012R2', o4: '2022', sel: 'q:2016' } },
      { id: 'recycle-bin', params: { sel: 'forest:2008R2' } }
    ],

    initial: initial,
    act: act,
    check: check,
    canRun: canRun,
    recycleBin: recycleBin,
    rollback: rollback,
    floorOf: floorOf,
    supports: supports,
    osesAt: osesAt,
    osesRuledOut: osesRuledOut,
    rung: rung,
    rungState: rungState,
    levelOf: levelOf,
    idx: idx,
    domain: domain,
    kindOf: kindOf,
    parseLast: parseLast,
    lastValues: lastValues,
    selValues: selValues,

    LEVELS: LEVELS, OSES: OSES, DOMAINS: DOMAINS, LADDERS: LADDERS, DCS: DCS, EXTRA: EXTRA,
    EXTRA_OPTIONS: EXTRA_OPTIONS, REPLACE_WITH: REPLACE_WITH, UNLOCKS: UNLOCKS, RULES_OUT: RULES_OUT
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
