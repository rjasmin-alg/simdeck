/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the DFA classroom game: a presenter sets a task (a language over an alphabet), players each submit one
   move per round (add a state, a symbol or a transition, set the start state, toggle an accepting state, remove a
   state or a transition), and when every expected player has moved the round's moves are applied in submission order
   and the automaton is checked against the task on a set of test words. A tool (lecturer-only,
   docs/site-structure.md §2.1): no steps; the page keeps the game and redraws it after every message.
   Adopted from single-page-labs/dfa-classroom-game.html (emptyDfa, describeTask, oracle, runDfa, allStrings,
   generateTests, validateDfa, ensureState, applyAction, receiveAction, finishRoundIfReady, startGame, autoLayout,
   clearDfa); see NOTES.md for what changed.
   Pure: no DOM, no Math.random, no Date, no timers, no strings for people. Every operation takes a game and returns
   { game, events } with a new game; events are { key, vars } that the page words in its language and stamps with the
   time (the original wrote Croatian log lines here). Errors are { key: 'rejected', vars: { name, why } } with a code.
   State is plain JSON. The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Drawing space of the original's SVG (viewBox 0 0 900 640); positions are kept in it. */
  var W = 900, H = 640;
  /** The original's limits: players 1..80, a log of 100 lines, at most 240 test words, at most 80 shown. */
  var MAX_PLAYERS = 80, MAX_LOG = 100, MAX_TESTS = 240;
  var TASKS = ['exact', 'ends', 'contains', 'evenSymbol'];
  var ACTIONS = ['ADD_STATE', 'ADD_SYMBOL', 'ADD_TRANSITION', 'SET_START', 'TOGGLE_ACCEPT', 'REMOVE_STATE', 'REMOVE_TRANSITION'];
  /** Actions that need at least one state to exist (the original disabled the submit button for them). */
  var NEEDS_STATE = ['ADD_TRANSITION', 'SET_START', 'TOGGLE_ACCEPT', 'REMOVE_STATE', 'REMOVE_TRANSITION'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function has(list, x) { return list.indexOf(x) >= 0; }
  function ev(key, vars) { return { key: key, vars: vars || {} }; }

  function emptyDfa() { return { states: [], alphabet: [], start: null, accept: [], delta: {}, positions: {} }; }

  /** A game before anyone presses start: the original's defaults (banana over a, b, n, six players), round 0. */
  function empty() {
    return {
      presenterId: null,
      taskType: 'exact',
      target: 'banana',
      alphabet: ['a', 'b', 'n'],
      expectedPlayers: 6,
      players: [],
      actions: {},
      round: 0,
      dfa: emptyDfa(),
      validation: null,
      log: []
    };
  }

  function cleanSymbol(s) { return String(s == null ? '' : s).trim(); }

  /** "a, b,n,,a" → ['a', 'b', 'n']: split on commas, trimmed, empty dropped, first occurrence kept. */
  function parseAlphabet(s) {
    var out = [];
    String(s || '').split(',').forEach(function (x) { x = x.trim(); if (x && !has(out, x)) out.push(x); });
    return out;
  }

  /** The task as a key and its target, for the page to word: taskExact, taskEnds, taskContains, taskEvenSymbol. */
  function describe(game) {
    return { key: 'task' + game.taskType.charAt(0).toUpperCase() + game.taskType.slice(1), target: game.target };
  }

  /** Does the task's language contain this word? */
  function oracle(game, input) {
    var t = game.target;
    if (game.taskType === 'exact') return input === t;
    if (game.taskType === 'ends') return input.endsWith(t);
    if (game.taskType === 'contains') return input.includes(t);
    if (game.taskType === 'evenSymbol') return input.split('').filter(function (c) { return c === t; }).length % 2 === 0;
    return false;
  }

  /** Run the automaton. A missing start state, a symbol outside its alphabet or a missing transition rejects, with
      the reason as a code: noStart, notInAlphabet { sym }, missing { from, sym }; else accept or reject. */
  function run(dfa, input) {
    if (!dfa.start || !has(dfa.states, dfa.start)) return { ok: false, path: [], reason: { code: 'noStart' } };
    var state = dfa.start;
    var path = [state];
    var chars = Array.from(input);
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (!has(dfa.alphabet, ch)) return { ok: false, path: path, reason: { code: 'notInAlphabet', sym: ch } };
      var next = dfa.delta[state] && Object.prototype.hasOwnProperty.call(dfa.delta[state], ch) ? dfa.delta[state][ch] : null;
      if (!next) return { ok: false, path: path, reason: { code: 'missing', from: state, sym: ch } };
      state = next;
      path.push(state);
    }
    var ok = has(dfa.accept, state);
    return { ok: ok, path: path, reason: { code: ok ? 'accept' : 'reject' } };
  }

  /** Every word over the alphabet up to maxLen, shortest first after the empty word, depth-first within (the
      original's order: '', a, aa, aaa, …, ab, …). */
  function allStrings(alphabet, maxLen) {
    var out = [''];
    (function rec(prefix, depth) {
      if (depth === 0) return;
      alphabet.forEach(function (ch) { var s = prefix + ch; out.push(s); rec(s, depth - 1); });
    })('', maxLen);
    return out;
  }

  /** The test words: the target and its neighbours, a few fixed banana words, then every word up to length
      min(4, max(2, |target|)); only words over the game's alphabet, first occurrence kept, at most 240. */
  function tests(game) {
    var a = game.alphabet.length ? game.alphabet : ['a', 'b'];
    var t = game.target;
    var first = a[0] || '';
    var base = ['', t, t + t, t.slice(0, -1), t + first, first + t, 'banana', 'banan', 'bananaa', 'ana', 'bandana', 'nana'];
    base = base.concat(allStrings(a, Math.min(4, Math.max(2, t.length))));
    if (t.length <= 8) base.push(t, t.slice(1), t + (t.charAt(0) || ''));
    var seen = [];
    base.forEach(function (s) { if (!has(seen, s)) seen.push(s); });
    return seen.filter(function (s) { return Array.from(s).every(function (ch) { return has(a, ch); }); }).slice(0, MAX_TESTS);
  }

  /** Check the automaton on every test word. The counterexample is the first word, in test order, where the
      automaton and the task disagree. */
  function validate(game) {
    var rows = [];
    var counter = null;
    tests(game).forEach(function (input) {
      var expected = oracle(game, input);
      var r = run(game.dfa, input);
      var ok = expected === r.ok;
      rows.push({ input: input, expected: expected, actual: r.ok, ok: ok, reason: r.reason });
      if (!ok && !counter) counter = { input: input, expected: expected, actual: r.ok, reason: r.reason };
    });
    return { pass: counter === null, counter: counter, rows: rows };
  }

  /** Add a state if it is new, placed on the original's ellipse by its index (radius 285 × 230 around the middle,
      at least six places round). Throws emptyState for an empty name. */
  function ensureState(dfa, name) {
    if (!name) throw reject('emptyState');
    if (!has(dfa.states, name)) {
      dfa.states.push(name);
      dfa.delta[name] = dfa.delta[name] || {};
      var n = dfa.states.length;
      var angle = -Math.PI / 2 + (n - 1) * Math.PI * 2 / Math.max(6, n);
      dfa.positions[name] = { x: round2(450 + Math.cos(angle) * 285), y: round2(320 + Math.sin(angle) * 230) };
    }
  }

  function round2(x) { return Math.round(x * 100) / 100; }
  function reject(why) { var e = new Error(why); e.why = why; return e; }

  /** Add a symbol to the automaton's and the game's alphabet, once. */
  function addSymbol(game, sym) {
    if (!has(game.dfa.alphabet, sym)) game.dfa.alphabet.push(sym);
    if (!has(game.alphabet, sym)) game.alphabet.push(sym);
  }

  /** Apply one move to the game (mutates; callers pass a copy). Returns the event; throws reject(code). */
  function applyAction(game, name, action) {
    var dfa = game.dfa;
    var type = action && action.type;
    var state = action && typeof action.state === 'string' ? action.state.trim() : '';
    if (type === 'ADD_STATE') { ensureState(dfa, state); return ev('addState', { name: name, state: state }); }
    if (type === 'ADD_SYMBOL') {
      var sym = cleanSymbol(action.symbol);
      if (!sym) throw reject('emptySymbol');
      if (Array.from(sym).length !== 1) throw reject('oneChar');
      addSymbol(game, sym);
      return ev('addSymbol', { name: name, sym: sym });
    }
    if (type === 'ADD_TRANSITION') {
      var from = action.from, to = action.to, s = cleanSymbol(action.symbol);
      if (!from || !to || !s) throw reject('incomplete');
      if (Array.from(s).length !== 1) throw reject('oneChar');
      ensureState(dfa, from);
      ensureState(dfa, to);
      addSymbol(game, s);
      dfa.delta[from] = dfa.delta[from] || {};
      dfa.delta[from][s] = to;
      return ev('addTransition', { name: name, from: from, sym: s, to: to });
    }
    if (type === 'SET_START') { ensureState(dfa, state); dfa.start = state; return ev('setStart', { name: name, state: state }); }
    if (type === 'TOGGLE_ACCEPT') {
      ensureState(dfa, state);
      if (has(dfa.accept, state)) {
        dfa.accept = dfa.accept.filter(function (x) { return x !== state; });
        return ev('acceptOff', { name: name, state: state });
      }
      dfa.accept.push(state);
      return ev('acceptOn', { name: name, state: state });
    }
    if (type === 'REMOVE_STATE') {
      dfa.states = dfa.states.filter(function (x) { return x !== state; });
      dfa.accept = dfa.accept.filter(function (x) { return x !== state; });
      if (dfa.start === state) dfa.start = null;
      delete dfa.delta[state];
      delete dfa.positions[state];
      Object.keys(dfa.delta).forEach(function (f) {
        Object.keys(dfa.delta[f]).forEach(function (k) { if (dfa.delta[f][k] === state) delete dfa.delta[f][k]; });
      });
      return ev('removeState', { name: name, state: state });
    }
    if (type === 'REMOVE_TRANSITION') {
      var rs = cleanSymbol(action.symbol);
      if (dfa.delta[action.from]) delete dfa.delta[action.from][rs];
      return ev('removeTransition', { name: name, from: action.from, sym: rs });
    }
    throw reject('unknownAction');
  }

  /** Players needed to close a round: the expected count, or more if more joined. */
  function required(game) { return Math.max(game.expectedPlayers, game.players.length); }

  /** Add a player, or rename one who joins again with the same id. */
  function join(game, id, name) {
    var g = clone(game);
    var p = g.players.filter(function (x) { return x.id === id; })[0];
    if (p) p.name = name; else g.players.push({ id: id, name: name });
    return { game: g, events: [ev('joined', { name: name })] };
  }

  /** Close the round when enough moves are in: apply them in submission order (a later move wins: two transitions
      on the same state and symbol leave the second; a move that fails is logged and skipped), clear the moves, go
      to the next round and validate. */
  function finishRoundIfReady(g, events) {
    var ids = Object.keys(g.actions);
    var need = required(g);
    if (!(need > 0 && ids.length >= need)) return;
    ids.forEach(function (id) {
      var item = g.actions[id];
      try { events.push(applyAction(g, item.playerName, item.action)); }
      catch (e) { events.push(ev('rejected', { name: item.playerName, why: e.why || 'unknownAction' })); }
    });
    g.actions = {};
    g.round++;
    g.validation = validate(g);
    events.push(ev('roundDone', { done: g.round - 1, next: g.round }));
  }

  /** The presenter receives a move. One move per player per round; an unknown sender joins first. The move waits
      until the round closes. */
  function submit(game, id, name, action) {
    var g = clone(game);
    var events = [];
    if (g.round < 1) return { game: g, events: [ev('notStarted', { name: name })] };
    if (!g.players.some(function (p) { return p.id === id; }) && id !== g.presenterId) g.players.push({ id: id, name: name });
    if (Object.prototype.hasOwnProperty.call(g.actions, id)) return { game: g, events: [ev('alreadyPlayed', { name: name })] };
    g.actions[id] = { playerName: name, action: clone(action) };
    events.push(ev('submitted', { name: name, type: action.type }));
    finishRoundIfReady(g, events);
    return { game: g, events: events };
  }

  /** Start (or restart) a game from the presenter's settings. Refuses an empty target, and a target longer than
      one character for the even-count task. The target's characters join the alphabet. Players stay. */
  function start(game, presenterId, settings) {
    var g = clone(game);
    var target = String(settings.target == null ? '' : settings.target).trim();
    var taskType = has(TASKS, settings.taskType) ? settings.taskType : 'exact';
    if (!target) return { game: g, error: 'targetEmpty' };
    if (taskType === 'evenSymbol' && Array.from(target).length !== 1) return { game: g, error: 'evenNeedsOne' };
    var alphabet = parseAlphabet(settings.alphabet);
    Array.from(target).forEach(function (ch) { if (!has(alphabet, ch)) alphabet.push(ch); });
    g.presenterId = presenterId;
    g.taskType = taskType;
    g.target = target;
    g.alphabet = alphabet;
    g.expectedPlayers = Math.max(1, Math.min(MAX_PLAYERS, Math.floor(Number(settings.expectedPlayers)) || 1));
    g.actions = {};
    g.round = 1;
    g.dfa = emptyDfa();
    g.dfa.alphabet = alphabet.slice();
    g.validation = null;
    g.log = [];
    return { game: g, events: [ev('newGame', { taskType: taskType, target: target })] };
  }

  /** Put the states evenly on an ellipse (radius 305 × 235), the first at the top, in state order. */
  function layout(game) {
    var g = clone(game);
    var n = g.dfa.states.length;
    g.dfa.states.forEach(function (s, i) {
      var angle = -Math.PI / 2 + i * Math.PI * 2 / n;
      g.dfa.positions[s] = { x: round2(450 + Math.cos(angle) * 305), y: round2(320 + Math.sin(angle) * 235) };
    });
    return { game: g, events: [] };
  }

  /** Move a state while dragging, kept 45 units inside the drawing. */
  function move(game, state, x, y) {
    var g = clone(game);
    if (has(g.dfa.states, state)) g.dfa.positions[state] = { x: round2(Math.max(45, Math.min(W - 45, x))), y: round2(Math.max(45, Math.min(H - 45, y))) };
    return { game: g, events: [] };
  }

  /** Empty the automaton (the alphabet stays), drop the round's moves and the validation. */
  function clear(game) {
    var g = clone(game);
    g.dfa = emptyDfa();
    g.dfa.alphabet = g.alphabet.slice();
    g.actions = {};
    g.validation = null;
    return { game: g, events: [ev('cleared')] };
  }

  /** Validate now (the presenter's button). */
  function check(game) {
    var g = clone(game);
    g.validation = validate(g);
    return { game: g, events: [] };
  }

  /** Transitions grouped by (from, to) for drawing, symbols in their delta order: one arrow per pair. */
  function edges(dfa) {
    var out = [];
    var index = {};
    dfa.states.forEach(function (from) {
      var tr = dfa.delta[from] || {};
      Object.keys(tr).forEach(function (sym) {
        var key = from + '\u0000' + tr[sym];
        if (!(key in index)) { index[key] = out.length; out.push({ from: from, to: tr[sym], symbols: [] }); }
        out[index[key]].symbols.push(sym);
      });
    });
    return out;
  }

  // ---- stored and imported state ----

  function str(x, fallback) { return typeof x === 'string' ? x : fallback; }
  function strs(x) {
    var out = [];
    (Array.isArray(x) ? x : []).forEach(function (s) { if (typeof s === 'string' && s && !has(out, s)) out.push(s); });
    return out;
  }
  function num(x, fallback) { return typeof x === 'number' && isFinite(x) ? x : fallback; }

  /** Repair a stored or imported game: unknown fields dropped, wrong types replaced by defaults, transitions only
      between known states, accepting and start states only among them. Throws on something that is not an object. */
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw reject('notAGame');
    var g = empty();
    g.presenterId = typeof raw.presenterId === 'string' ? raw.presenterId : null;
    g.taskType = has(TASKS, raw.taskType) ? raw.taskType : g.taskType;
    g.target = str(raw.target, g.target) || g.target;
    if (Array.isArray(raw.alphabet)) g.alphabet = strs(raw.alphabet);
    g.expectedPlayers = Math.max(1, Math.min(MAX_PLAYERS, Math.floor(num(raw.expectedPlayers, g.expectedPlayers))));
    g.players = (Array.isArray(raw.players) ? raw.players : []).filter(function (p) {
      return p && typeof p.id === 'string' && typeof p.name === 'string';
    }).map(function (p) { return { id: p.id, name: p.name }; });
    g.players = g.players.filter(function (p, i) { return g.players.findIndex(function (q) { return q.id === p.id; }) === i; });
    if (raw.actions && typeof raw.actions === 'object') {
      Object.keys(raw.actions).forEach(function (id) {
        var a = raw.actions[id];
        if (a && typeof a.playerName === 'string' && a.action && has(ACTIONS, a.action.type)) g.actions[id] = { playerName: a.playerName, action: clone(a.action) };
      });
    }
    g.round = Math.max(0, Math.floor(num(raw.round, 0)));
    var d = raw.dfa && typeof raw.dfa === 'object' ? raw.dfa : {};
    var dfa = emptyDfa();
    dfa.states = strs(d.states);
    dfa.alphabet = strs(d.alphabet);
    dfa.start = has(dfa.states, d.start) ? d.start : null;
    dfa.accept = strs(d.accept).filter(function (s) { return has(dfa.states, s); });
    dfa.states.forEach(function (s) {
      var tr = d.delta && d.delta[s] && typeof d.delta[s] === 'object' ? d.delta[s] : {};
      dfa.delta[s] = {};
      Object.keys(tr).forEach(function (k) { if (has(dfa.states, tr[k])) dfa.delta[s][k] = tr[k]; });
      var p = d.positions && d.positions[s];
      dfa.positions[s] = p && isFinite(p.x) && isFinite(p.y)
        ? { x: Math.max(45, Math.min(W - 45, Number(p.x))), y: Math.max(45, Math.min(H - 45, Number(p.y))) }
        : { x: 100, y: 100 };
    });
    g.dfa = dfa;
    g.validation = raw.validation ? validate(g) : null;
    g.log = (Array.isArray(raw.log) ? raw.log : []).filter(function (l) {
      return l && typeof l.key === 'string' && (!l.vars || typeof l.vars === 'object');
    }).slice(0, MAX_LOG).map(function (l) { return { at: str(l.at, ''), key: l.key, vars: clone(l.vars || {}) }; });
    return g;
  }

  /** Prepend events to the game's log, newest first, each stamped with `at` (the page's clock), at most 100 lines. */
  function record(game, events, at) {
    var g = clone(game);
    events.forEach(function (e) { g.log.unshift({ at: at, key: e.key, vars: clone(e.vars) }); });
    g.log = g.log.slice(0, MAX_LOG);
    return g;
  }

  var api = {
    W: W, H: H, MAX_PLAYERS: MAX_PLAYERS, MAX_LOG: MAX_LOG, MAX_TESTS: MAX_TESTS,
    TASKS: TASKS, ACTIONS: ACTIONS, NEEDS_STATE: NEEDS_STATE,
    // the kit's explorer shape: no params, no steps (a tool)
    defaults: {},
    initial: function () { return {}; },
    empty: empty, emptyDfa: emptyDfa, parseAlphabet: parseAlphabet, describe: describe,
    oracle: oracle, run: run, allStrings: allStrings, tests: tests, validate: validate,
    applyAction: applyAction, required: required, join: join, submit: submit, start: start,
    layout: layout, move: move, clear: clear, check: check, edges: edges, sanitize: sanitize, record: record
  };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.SimLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
