/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ou-vs-group: the OU tree of quillmoor.example, five groups and user ana, and a deck of task cards.
   Each card states a need (a policy, a permission, a delegation, a membership, a mailing list); classify() derives
   from the rules whether it goes to an OU, a group, both or neither, and which mechanism decides it (a GPO link, an
   ACE naming a group SID, a delegation ACE on an OU). One step turns one card. Rules and expected results: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DOMAIN = { id: 'q', kind: 'domain', name: 'quillmoor.example', parent: null, users: null, computers: null };

  /** OUs and CN= containers of quillmoor.example, parents before children (the drawing order).
      From sims/win-ad-structure/sim.js @ 697a662 (CONTAINERS, domain q), cut to the boxes the cards use, plus the
      invented OU=Kiosks. users / computers: estate ou-tree.txt counts (null = not known). */
  var BOXES = [
    DOMAIN,
    { id: 'q-users', kind: 'container', name: 'CN=Users', parent: 'q', users: 155, computers: 0 },
    { id: 'q-computers', kind: 'container', name: 'CN=Computers', parent: 'q', users: 0, computers: 159 },
    { id: 'q-quillmoor', kind: 'ou', name: 'OU=Quillmoor', parent: 'q', users: 0, computers: 0 },
    { id: 'q-staff', kind: 'ou', name: 'OU=Staff', parent: 'q-quillmoor', users: 0, computers: 0 },
    { id: 'q-hq', kind: 'ou', name: 'OU=HQ', parent: 'q-staff', users: 21, computers: 0 },
    { id: 'q-brack', kind: 'ou', name: 'OU=Brackenridge', parent: 'q-staff', users: 44, computers: 0 },
    { id: 'q-ws', kind: 'ou', name: 'OU=Workstations', parent: 'q-quillmoor', users: 0, computers: 35 },
    { id: 'q-kiosks', kind: 'ou', name: 'OU=Kiosks', parent: 'q-ws', users: null, computers: null, invented: true },
    { id: 'q-servers', kind: 'ou', name: 'OU=Servers', parent: 'q-quillmoor', users: 0, computers: 5 }
  ];

  /** Groups (in CN=Users, the default container for new groups). rid: invented relative IDs. Every group has a SID; a
      distribution group is not security-enabled, so it never stands in an ACE. */
  var GROUPS = [
    { id: 'g-accounting', kind: 'group', name: 'G-Accounting', type: 'security', rid: 1104 },
    { id: 'g-projects', kind: 'group', name: 'G-Projects', type: 'security', rid: 1105 },
    { id: 'helpdesk', kind: 'group', name: 'Helpdesk', type: 'security', rid: 1106 },
    { id: 'all-staff', kind: 'group', name: 'All Staff', type: 'security', rid: 1107 },
    { id: 'board', kind: 'group', name: 'Board', type: 'distribution', rid: 1108 }
  ];
  var DOMAIN_SID = 'S-1-5-21-…';

  var USERS = [{ id: 'ana', kind: 'user', name: 'ana', home: 'q-hq', memberOf: ['g-accounting', 'g-projects', 'all-staff'] }];

  /** The decks: each card has an id (its strings) and a need. */
  var DECKS = {
    basic: [
      { id: 'screen-lock', need: { kind: 'policy', boxes: ['q-ws'], gpo: 'Screen Lock' } },
      { id: 'finance-share', need: { kind: 'permission', resource: '\\\\hq-fs01\\finance', right: 'read', trustee: 'g-accounting' } },
      { id: 'helpdesk-reset', need: { kind: 'delegation', on: 'q-brack', right: 'reset-password', trustee: 'helpdesk' } },
      { id: 'ana-groups', need: { kind: 'membership', obj: 'ana' } },
      { id: 'board-list', need: { kind: 'mail', group: 'board' } },
      { id: 'kiosk', need: { kind: 'policy', boxes: ['q-kiosks'], gpo: 'Kiosk Lockdown' } },
      { id: 'drive-p', need: { kind: 'policy', boxes: ['q-hq', 'q-brack'], filter: 'g-projects', gpo: 'Drive P' } },
      { id: 'cn-users', need: { kind: 'policy', boxes: ['q-users'], exact: true, gpo: 'Staff Settings' } }
    ],
    quillmoor: [
      { id: 'chirp', need: { kind: 'policy', boxes: ['q-ws'], gpo: 'Chirp Autostart' } },
      { id: 'chirp-cn', need: { kind: 'policy', boxes: ['q-computers'], exact: true, gpo: 'Chirp Autostart', moveTo: 'q-ws' } },
      { id: 'drive-maps', need: { kind: 'policy', boxes: ['q-users', 'q-quillmoor'], gpo: 'Drive Maps' } },
      { id: 'projects-share', need: { kind: 'permission', resource: '\\\\hq-fs01\\projects', right: 'read', trustee: 'g-projects', gpo: 'Drive Maps' } }
    ]
  };

  var ANSWERS = ['ou', 'group', 'both', 'neither'];
  var MAX_CARDS = 8;

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function node(id) { return byId(BOXES, id) || byId(GROUPS, id) || byId(USERS, id); }
  function kindOf(id) { var n = node(id); return n ? n.kind : null; }

  // ── rule 1: where a GPO can be linked ──

  function canLinkGpo(id) { var k = kindOf(id); return k === 'site' || k === 'domain' || k === 'ou'; }
  /** The boxes a GPO linked at a box reaches: that box and every box below it (a domain link reaches all). */
  function reachOf(id) {
    if (!canLinkGpo(id)) return [];
    var out = [];
    BOXES.forEach(function (b) { if (pathTo(b.id).indexOf(id) >= 0) out.push(b.id); });
    return out;
  }
  /** From the domain down to the box: [domainId, ..., id]. */
  function pathTo(id) {
    var out = [];
    var x = byId(BOXES, id);
    while (x) { out.unshift(x.id); x = byId(BOXES, x.parent); }
    return out;
  }
  /** The lowest box that holds all the given boxes (itself for one box). */
  function lcaOf(ids) {
    if (!ids.length) return null;
    var common = pathTo(ids[0]);
    ids.slice(1).forEach(function (id) {
      var p = pathTo(id), k = 0;
      while (k < common.length && k < p.length && common[k] === p[k]) k++;
      common = common.slice(0, k);
    });
    return common.length ? common[common.length - 1] : null;
  }
  /** The first box from id upwards that can take a GPO link. */
  function linkableFrom(id) {
    var p = pathTo(id);
    for (var i = p.length - 1; i >= 0; i--) if (canLinkGpo(p[i])) return p[i];
    return null;
  }

  // ── rule 2: permissions name SIDs ──

  function sidOf(id) {
    var n = node(id);
    if (!n) return null;
    if (n.kind === 'group') return DOMAIN_SID + '-' + n.rid;
    if (n.kind === 'user') return DOMAIN_SID + '-1201';
    return null;   // an OU, a container or the domain head is not a security principal here
  }
  /** Can be the trustee of an ACE: a security principal with a SID (user, computer, security group). */
  function canBeTrustee(id) {
    var n = node(id);
    if (!n) return { ok: false, reason: 'unknown' };
    if (n.kind === 'ou' || n.kind === 'container' || n.kind === 'domain') return { ok: false, reason: 'no-sid' };
    if (n.kind === 'group' && n.type !== 'security') return { ok: false, reason: 'not-security' };
    return { ok: true, reason: null };
  }

  // ── rule 4: one OU, many groups ──

  /** Move an object: its one parent is replaced. Returns a new placement map. */
  function move(placed, obj, box) {
    var out = Object.assign({}, placed);
    if (byId(USERS, obj) && byId(BOXES, box) && kindOf(box) !== 'domain') out[obj] = box;
    return out;
  }
  /** Join a group: added to the member list once. Returns a new membership map { obj: [groups] }. */
  function join(memberOf, obj, group) {
    var out = {};
    Object.keys(memberOf).forEach(function (k) { out[k] = memberOf[k].slice(); });
    if (!byId(GROUPS, group)) return out;
    out[obj] = out[obj] || [];
    if (out[obj].indexOf(group) < 0) out[obj].push(group);
    return out;
  }
  function placement() { var p = {}; USERS.forEach(function (u) { p[u.id] = u.home; }); return p; }
  function membership() { var m = {}; USERS.forEach(function (u) { m[u.id] = u.memberOf.slice(); }); return m; }
  function membersOf(group) {
    return USERS.filter(function (u) { return u.memberOf.indexOf(group) >= 0; }).map(function (u) { return u.id; });
  }

  // ── classify: a card's answer from the rules (SPEC §2, table) ──

  /** { answer, rule, mech }. mech is what the page lights: a GPO link (or a refused one), an ACE, a delegation, a
      membership or a mailing list. answer is null for a need the rules refuse outright (an OU as trustee). */
  function classify(need) {
    var k = need && need.kind;
    if (k === 'policy') {
      var lca = lcaOf(need.boxes || []);
      if (!lca) return { answer: null, rule: 1, mech: null };
      var at = linkableFrom(lca);
      // rule 1 / 5: for "exactly these boxes" the link must sit on one of them; a link on a box above them reaches
      // others too (a common OU, or the domain above a CN= container): no answer until the objects are moved.
      if (need.exact && need.boxes.indexOf(at) < 0) {
        return { answer: 'neither', rule: 1, mech: { type: 'link-refused', at: lca, gpo: need.gpo, wouldReach: at, moveTo: need.moveTo || null } };
      }
      var mech = { type: 'gpo-link', at: at, gpo: need.gpo, reach: reachOf(at), boxes: need.boxes.slice(), filter: need.filter || null };
      return need.filter ? { answer: 'both', rule: 5, mech: mech } : { answer: 'ou', rule: 1, mech: mech };
    }
    if (k === 'permission') {
      var tr = canBeTrustee(need.trustee);
      if (!tr.ok) return { answer: null, rule: 2, mech: { type: 'ace-refused', on: need.resource, trustee: need.trustee, reason: tr.reason } };
      return { answer: kindOf(need.trustee) === 'group' ? 'group' : null, rule: 2,
        mech: { type: 'ace', on: need.resource, trustee: need.trustee, sid: sidOf(need.trustee), right: need.right } };
    }
    if (k === 'delegation') {
      var td = canBeTrustee(need.trustee);
      var onOu = kindOf(need.on) === 'ou' || kindOf(need.on) === 'domain' || kindOf(need.on) === 'container';
      if (!td.ok || !onOu) return { answer: null, rule: 3, mech: null };
      return { answer: 'both', rule: 3, mech: { type: 'delegation', on: need.on, trustee: need.trustee, sid: sidOf(need.trustee), right: need.right } };
    }
    if (k === 'membership') {
      var u = byId(USERS, need.obj);
      if (!u) return { answer: null, rule: 4, mech: null };
      return { answer: 'group', rule: 4, mech: { type: 'membership', obj: u.id, parent: u.home, groups: u.memberOf.slice() } };
    }
    if (k === 'mail') {
      var g = byId(GROUPS, need.group);
      if (!g) return { answer: null, rule: 2, mech: null };
      return { answer: 'group', rule: 2, mech: { type: 'mail', group: g.id, security: g.type === 'security' } };
    }
    return { answer: null, rule: null, mech: null };
  }

  /** The student's guess against the answer (SPEC §4). */
  function verdict(guess, answer) {
    if (ANSWERS.indexOf(guess) < 0) return 'skipped';
    if (guess === answer) return 'right';
    if (answer === 'both' && (guess === 'ou' || guess === 'group')) return 'half';
    return 'wrong';
  }

  function deckOf(p) { return DECKS[p && p.deck] ? p.deck : 'basic'; }
  function cardsOf(p) { return DECKS[deckOf(p)]; }
  function guessOf(p, i) { var g = p['g' + (i + 1)]; return ANSWERS.indexOf(g) >= 0 ? g : null; }

  function scoreOf(cards) {
    var s = { right: 0, half: 0, wrong: 0, skipped: 0 };
    cards.forEach(function (c) { if (c.revealed && c.verdict) s[c.verdict]++; });
    return s;
  }

  var defaults = { deck: 'basic', mode: 'show' };
  for (var gi = 1; gi <= MAX_CARDS; gi++) defaults['g' + gi] = '';

  var logic = {
    defaults: defaults,

    presets: [
      { id: 'basic', params: { deck: 'basic', mode: 'show' } },
      { id: 'quiz', params: { deck: 'basic', mode: 'quiz' } },
      { id: 'quillmoor', params: { deck: 'quillmoor', mode: 'show' } }
    ],

    /** One step per card: 8 (basic), 4 (quillmoor). */
    steps: function (p) { return cardsOf(p).length; },

    initial: function (p) {
      var quiz = p.mode === 'quiz';
      var cards = cardsOf(p).map(function (c, i) {
        var r = classify(c.need);
        return { id: c.id, answer: r.answer, rule: r.rule, revealed: false, guess: quiz ? guessOf(p, i) : null, verdict: null };
      });
      return { deck: deckOf(p), mode: quiz ? 'quiz' : 'show', cards: cards, cursor: 0, last: -1, score: scoreOf(cards), lit: [] };
    },

    /** Step n turns card n (1-based): its guess is judged, it goes to its bin, its mechanism is lit. */
    step: function (s, n, p) {
      var i = n - 1;
      var deck = cardsOf(p);
      var cards = s.cards.map(function (c, k) {
        if (k !== i) return Object.assign({}, c);
        return Object.assign({}, c, { revealed: true, verdict: s.mode === 'quiz' ? verdict(c.guess, c.answer) : null });
      });
      var lit = s.lit.map(function (m) { return Object.assign({}, m, { now: false }); });
      var mech = classify(deck[i].need).mech;
      if (mech) lit.push(Object.assign({ card: deck[i].id, now: true }, mech));
      return { deck: s.deck, mode: s.mode, cards: cards, cursor: Math.min(n, cards.length), last: i, score: scoreOf(cards), lit: lit };
    },

    /** The cards of a bin, in deck order (revealed only). */
    binOf: function (s, answer) {
      var out = [];
      s.cards.forEach(function (c, k) { if (c.revealed && c.answer === answer) out.push(k); });
      return out;
    },

    DOMAIN: DOMAIN, BOXES: BOXES, GROUPS: GROUPS, USERS: USERS, DECKS: DECKS, ANSWERS: ANSWERS, MAX_CARDS: MAX_CARDS,
    node: node, kindOf: kindOf, cardsOf: cardsOf, needOf: function (p, i) { return cardsOf(p)[i].need; },
    canLinkGpo: canLinkGpo, reachOf: reachOf, pathTo: pathTo, lcaOf: lcaOf, linkableFrom: linkableFrom,
    sidOf: sidOf, canBeTrustee: canBeTrustee,
    move: move, join: join, placement: placement, membership: membership, membersOf: membersOf,
    classify: classify, verdict: verdict
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
