/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for osi-tcpip-map: the OSI (7) and TCP/IP (4, or 5) layer columns, how their rows map onto each other, and
   the answer table for cards (devices, protocols, problems, sentences) the student places on a row.
   Rules, tie-breaks and the answer table: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers, no strings. Placements are page state; this file only judges them.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Each card: the OSI layers it accepts (primary first), its kind, and for a sentence the model it belongs to. */
  var CARDS = {
    computer: { osi: [7], kind: 'device' },
    'switch': { osi: [2], kind: 'device' },
    router: { osi: [3], kind: 'device' },
    server: { osi: [7], kind: 'device' },
    hub: { osi: [1], kind: 'device' },
    ap: { osi: [2], kind: 'device' },
    l3switch: { osi: [3, 2], kind: 'device' },
    firewall: { osi: [4, 3], kind: 'device' },
    http: { osi: [7], kind: 'protocol' },
    dns: { osi: [7], kind: 'protocol' },
    tcp: { osi: [4], kind: 'protocol' },
    udp: { osi: [4], kind: 'protocol' },
    ip: { osi: [3], kind: 'protocol' },
    icmp: { osi: [3], kind: 'protocol' },
    arp: { osi: [2, 3], kind: 'protocol' },
    ethernet: { osi: [2], kind: 'protocol', phys: true },
    wifi: { osi: [2], kind: 'protocol', phys: true },
    tls: { osi: [6, 5, 7], kind: 'protocol' },
    cable: { osi: [1], kind: 'problem' },
    resume: { osi: [5], kind: 'problem' },
    chars: { osi: [6], kind: 'problem' },
    identical: { osi: [4], kind: 'problem' },
    order: { osi: [4], kind: 'problem', notCause: 3 },
    vocabA: { osi: [5], kind: 'vocab', model: 'osi' },
    vocabB: { osi: [3], kind: 'vocab', model: 'tcpip' },
    vocabC: { osi: [6, 7], kind: 'vocab', model: 'osi' }
  };

  /** The tray of each set, in tray order (SPEC "Answer table"). */
  var SETS = {
    devices: ['computer', 'switch', 'router', 'server'],
    extra: ['hub', 'ap', 'l3switch', 'firewall'],
    protocols: ['http', 'dns', 'tcp', 'udp', 'ip', 'icmp', 'arp', 'ethernet', 'wifi', 'tls'],
    problems: ['cable', 'resume', 'chars', 'identical', 'order'],
    vocab: ['vocabA', 'vocabB', 'vocabC']
  };

  /** OSI rows o1…o7 cover their own number (rule 1). */
  function osiRows() {
    var out = [];
    for (var i = 7; i >= 1; i--) out.push({ id: 'o' + i, covers: [i] });
    return out;
  }
  /** TCP/IP rows, top to bottom (rules 2, 3): 5-layer splits fizički (tp) off podatkovni (tl). */
  function tcpRows(layers5) {
    var out = [{ id: 'ta', covers: [5, 6, 7] }, { id: 'tt', covers: [4] }, { id: 'ti', covers: [3] }];
    if (layers5) out.push({ id: 'tl', covers: [2] }, { id: 'tp', covers: [1] });
    else out.push({ id: 'tl', covers: [1, 2] });
    return out;
  }
  function rowsOf(model, layers5) { return model === 'osi' ? osiRows() : tcpRows(!!layers5); }
  function modelOf(rowId) { return rowId.charAt(0) === 'o' ? 'osi' : 'tcpip'; }
  /** OSI layers a row covers; [] for a row that does not exist under this layers5. */
  function covers(rowId, layers5) {
    var r = rowsOf(modelOf(rowId), layers5).filter(function (x) { return x.id === rowId; })[0];
    return r ? r.covers.slice() : [];
  }
  function meets(a, b) { return a.some(function (x) { return b.indexOf(x) >= 0; }); }

  /** Rows of `model` that accept the card (rule 9 first: a sentence accepts nothing in the other model). */
  function acceptingRows(cardId, model, layers5) {
    var c = CARDS[cardId];
    if (!c || (c.model && c.model !== model)) return [];
    return rowsOf(model, layers5).filter(function (r) { return meets(r.covers, c.osi); }).map(function (r) { return r.id; });
  }

  /** SPEC "Verdict and tie-breaks": wrong / ok / both-ok (more than one row of that model accepts the card). */
  function check(cardId, rowId, layers5) {
    var acc = acceptingRows(cardId, modelOf(rowId), layers5);
    if (acc.indexOf(rowId) < 0) return 'wrong';
    return acc.length > 1 ? 'both-ok' : 'ok';
  }

  /** A note for this placement, or null (SPEC order: otherModel, tcpipNoName, physPart, notCause). */
  function note(cardId, rowId, layers5) {
    var c = CARDS[cardId], m = modelOf(rowId), cov = covers(rowId, layers5);
    if (!c) return null;
    if (c.model && c.model !== m) return 'otherModel';
    var v = check(cardId, rowId, layers5);
    if (v !== 'wrong' && m === 'tcpip' && c.osi.length === 1 && (c.osi[0] === 5 || c.osi[0] === 6)) return 'tcpipNoName';
    if (c.phys && cov.length === 1 && cov[0] === 1) return 'physPart';
    if (c.notCause && cov.length === 1 && cov[0] === c.notCause) return 'notCause';
    return null;
  }

  /** The row a revealed card goes to in `model`: the one covering its primary layer; null if the model has none. */
  function answer(cardId, model, layers5) {
    var c = CARDS[cardId];
    if (!c || (c.model && c.model !== model)) return null;
    var r = rowsOf(model, layers5).filter(function (x) { return x.covers.indexOf(c.osi[0]) >= 0; })[0];
    return r ? r.id : null;
  }

  /** The vocab set always shows both columns (SPEC "Params"). */
  function effectiveModel(p) { return p.set === 'vocab' ? 'both' : p.model; }
  function shows(p, model) { var m = effectiveModel(p); return m === 'both' || m === model; }
  /** Where a stored placement shows now: null when its column is hidden; tp folds into tl without layers5. */
  function visibleRow(rowId, p) {
    if (!rowId) return null;
    var r = rowId === 'tp' && !p.layers5 ? 'tl' : rowId;
    return shows(p, modelOf(r)) ? r : null;
  }
  /** The OSI layers a row spans in the shared 7-track grid: { lo, hi }. */
  function span(rowId, layers5) {
    var cv = covers(rowId, layers5);
    return { lo: Math.min.apply(null, cv), hi: Math.max.apply(null, cv) };
  }

  /** Counts over the current tray (SPEC "Summary counts"). `placed` maps card id → row id (or null). */
  function score(placed, p) {
    var out = { ok: 0, both: 0, wrong: 0, open: 0 };
    (SETS[p.set] || []).forEach(function (id) {
      var r = visibleRow(placed && placed[id], p);
      if (!r) { out.open++; return; }
      var v = check(id, r, p.layers5);
      if (v === 'ok') out.ok++; else if (v === 'both-ok') out.both++; else out.wrong++;
    });
    return out;
  }

  var logic = {
    CARDS: CARDS,
    SETS: SETS,
    defaults: { set: 'devices', model: 'both', layers5: false, reveal: false },
    /** SPEC "Params and presets": reveal stays off, so the class works each tray first. */
    presets: [
      { id: 'book-devices', params: { set: 'devices' } },
      { id: 'book-problems', params: { set: 'problems' } },
      { id: 'protocols', params: { set: 'protocols' } },
      { id: 'book-vocab', params: { set: 'vocab' } },
      { id: 'extra-devices', params: { set: 'extra' } }
    ],
    /** A new placements object with the card on the row (null puts it back in the tray). Never mutates. */
    place: function (placed, cardId, rowId) {
      var out = Object.assign({}, placed);
      out[cardId] = rowId || null;
      return out;
    },
    /** Explorer: the state is what the params decide; placements live in the page. */
    initial: function (p) {
      return { set: p.set, model: effectiveModel(p), cards: (SETS[p.set] || []).slice() };
    },
    rowsOf: rowsOf,
    modelOf: modelOf,
    covers: covers,
    acceptingRows: acceptingRows,
    check: check,
    note: note,
    answer: answer,
    effectiveModel: effectiveModel,
    shows: shows,
    visibleRow: visibleRow,
    span: span,
    score: score
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
