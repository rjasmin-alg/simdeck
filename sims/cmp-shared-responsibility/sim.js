/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-shared-responsibility: who runs which control when a workload leaves the firm's own server room.
   Twelve controls sit in five layers (building, hardware, operating system, application, data and access). Each
   service model hands the layers below a line to the provider: own servers none, rented infrastructure (IaaS) the
   building and the hardware, a platform (PaaS) the operating system too, a finished application (SaaS) the
   application too. Data and access never move: what goes in, the accounts, who has access, the backups.
   The student marks the controls they believe the provider runs (a bit mask). A marked control the customer owns is a
   gap (nobody runs it); an unmarked one the provider owns is double work (planned, but out of the customer's reach).
   The provider's assurance report proves the provider's controls only, and not those it carves out to the data-centre
   operator; the customer's own controls are not in it.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md; words: strings.js.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  /** Rule 1: the layers, bottom up. */
  var LAYERS = ['site', 'hw', 'os', 'app', 'data'];
  /** Rule 1: the controls in register order (top of the stack first); bit k of the mask is control k. */
  var CONTROLS = [
    { id: 'data', layer: 'data' },        // which data goes in, and who it is shared with
    { id: 'ident', layer: 'data' },       // accounts and sign-in: second factor, leavers
    { id: 'access', layer: 'data' },      // who has access to what, reviewed
    { id: 'backup', layer: 'data' },      // backups of the firm's data
    { id: 'appupd', layer: 'app' },       // application updates and fixes
    { id: 'appavail', layer: 'app' },     // application availability and capacity
    { id: 'ospatch', layer: 'os' },       // operating system patches
    { id: 'osharden', layer: 'os' },      // hardening and administrator accounts on the servers
    { id: 'hwfail', layer: 'hw' },        // hardware faults and spare parts
    { id: 'disk', layer: 'hw' },          // wiping disks that leave service
    { id: 'phys', layer: 'site' },        // physical access to the server room
    { id: 'power', layer: 'site' }        // power, cooling, fire protection
  ];
  /** Rule 2: how many layers (from the bottom) each service model hands to the provider. */
  var MODELS = ['own', 'iaas', 'paas', 'saas'];
  var HANDED = { own: 0, iaas: 2, paas: 3, saas: 4 };
  var MASK_MAX = Math.pow(2, CONTROLS.length) - 1;   // 4095

  // ── rules 2–4 ──

  /** Rule 2: who owns a control under a model. */
  function owner(model, c) { return LAYERS.indexOf(c.layer) < HANDED[model] ? 'provider' : 'customer'; }

  /** Rule 3: does the mask say the provider runs control k? */
  function assumed(mask, k) { return Math.floor(mask / Math.pow(2, k)) % 2 === 1; }
  /** Rule 3: a click on row k flips its bit. */
  function toggle(mask, k) { return assumed(mask, k) ? mask - Math.pow(2, k) : mask + Math.pow(2, k); }

  /** Rule 3: the mask that matches the contract under a model: the provider's controls marked, nothing else. */
  function contractMask(model) {
    return CONTROLS.reduce(function (m, c, k) { return owner(model, c) === 'provider' ? m + Math.pow(2, k) : m; }, 0);
  }

  /** Rule 3: the outcome of a belief against the owner. */
  function outcome(own, believesProvider) {
    if (own === 'provider') return believesProvider ? 'ok' : 'extra';
    return believesProvider ? 'gap' : 'ok';
  }

  /** Rule 4: what the provider's report says about a control: null with the report closed; 'none' on own servers
      (no provider, no report); 'yours' for a customer-owned control (not in the report); 'carved' for a provider
      control in the building layer when the report carves out the data-centre operator; else 'proven'. */
  function evidence(p, c, own) {
    if (!p.report) return null;
    if (p.model === 'own') return 'none';
    if (own === 'customer') return 'yours';
    if (p.carve && c.layer === 'site') return 'carved';
    return 'proven';
  }

  // ── params, presets ──

  function P(over) { return Object.assign({ model: 'own', mask: 0, report: false, carve: false }, over); }
  /** Masks used by the presets: the lower two layers (bits 8–11), the lower three (bits 6–11), all, all but the
      first three (data, accounts, access). */
  var M_INFRA = 3840, M_OS = 4032, M_ALL = 4095, M_NOBACKUP = 4088;
  /** Rule 6: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'own', params: P({}) },
    { id: 'iaas', params: P({ model: 'iaas', mask: M_INFRA }) },
    { id: 'iaasOs', params: P({ model: 'iaas', mask: M_OS }) },
    { id: 'saasAll', params: P({ model: 'saas', mask: M_ALL }) },
    { id: 'saasReport', params: P({ model: 'saas', mask: M_NOBACKUP, report: true }) },
    { id: 'carve', params: P({ model: 'iaas', mask: M_INFRA, report: true, carve: true }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function oneOf(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function flag(v) { return v === true || v === 'true'; }
  /** Rule 5: params made safe. mask: a number (or a numeric string), rounded halves up, clamped to 0–4095; anything
      else → 0. report, carve: true or the string "true", else false. */
  function normalise(params) {
    var q = Object.assign({}, defaults, params);
    var m = typeof q.mask === 'string' ? (q.mask.trim() === '' ? NaN : Number(q.mask)) : q.mask;
    if (typeof m !== 'number' || !Number.isFinite(m)) m = 0;
    m = Math.floor(m + 0.5);
    return {
      model: oneOf(q.model, MODELS, defaults.model),
      mask: Math.min(MASK_MAX, Math.max(0, m)),
      report: flag(q.report),
      carve: flag(q.carve)
    };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var rows = CONTROLS.map(function (c, k) {
      var own = owner(p.model, c), b = assumed(p.mask, k);
      var by = {};
      MODELS.forEach(function (m) { by[m] = owner(m, c); });
      return { id: c.id, layer: c.layer, k: k, owner: by[p.model], by: by, assumed: b, outcome: outcome(own, b),
        evidence: evidence(p, c, own) };
    });
    function ids(f) { return rows.filter(f).map(function (r) { return r.id; }); }
    var count = function (f) { return rows.filter(f).length; };
    return {
      p: p,
      rows: rows,
      provider: count(function (r) { return r.owner === 'provider'; }),
      customer: count(function (r) { return r.owner === 'customer'; }),
      marked: count(function (r) { return r.assumed; }),
      gaps: ids(function (r) { return r.outcome === 'gap'; }),
      extra: ids(function (r) { return r.outcome === 'extra'; }),
      ok: count(function (r) { return r.outcome === 'ok'; }),
      report: p.report ? {
        proven: count(function (r) { return r.evidence === 'proven'; }),
        carved: count(function (r) { return r.evidence === 'carved'; }),
        yours: count(function (r) { return r.evidence === 'yours'; }),
        none: count(function (r) { return r.evidence === 'none'; })
      } : null,
      kept: ids(function (r) { return r.layer === 'data'; })
    };
  }

  // ── rule 7: the caption ──

  /** The main line by the model, then at most two notes, the first that apply in this order: gaps (nGap, naming the
      first gap in register order); the report when open (nNoReport on own servers, nCarve with carve on, else
      nReport); double work (nExtra, naming the first in register order). nKeep only when none of these applies. */
  function captionKey(s) {
    var notes = [];
    if (s.gaps.length) notes.push('nGap');
    if (s.report) notes.push(s.p.model === 'own' ? 'nNoReport' : s.p.carve ? 'nCarve' : 'nReport');
    if (s.extra.length) notes.push('nExtra');
    if (!notes.length) notes.push('nKeep');
    return { key: 'cap_' + s.p.model, notes: notes.slice(0, 2) };
  }

  var logic = {
    LAYERS: LAYERS, CONTROLS: CONTROLS, MODELS: MODELS, HANDED: HANDED, MASK_MAX: MASK_MAX,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    owner: owner,
    assumed: assumed,
    toggle: toggle,
    contractMask: contractMask,
    outcome: outcome,
    evidence: evidence,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
