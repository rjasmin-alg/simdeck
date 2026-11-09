/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the quick poll: students answer A–D from phones, results on the projector (docs/tasks/w3/quick-poll.md,
   catalogue tool-quick-poll). A tool (lecturer-only, docs/site-structure.md §2.1): no steps.
   Pure: no DOM, no Math.random, no Date, no timers, no network (docs/sim-ui.md §5). The transport (whatever carries a
   phone's answer to the projector: not chosen yet, docs/tasks/OPEN.md) hands each answer in as a ballot
   { pollId, voter, option, at }; `at` is the transport's arrival number or time, stored, never read by the rules.
   Poll state is plain JSON:
     { pollId, kind, question, texts: {A: '', …}, options: ['A', …], correct: 'A'…|null,
       phase: 'open'|'closed'|'revealed', votes: { [voter]: { option, at } } }
   No language strings here: texts are what the lecturer typed (empty by default); the page supplies the labels.
   The page loads this as a classic script (window.SimLogic); node tests require() it. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var LETTERS = ['A', 'B', 'C', 'D'];
  /** Poll kinds (the presets): which letters a phone offers. */
  var KINDS = { abcd: ['A', 'B', 'C', 'D'], yesno: ['A', 'B'], confidence: ['A', 'B', 'C', 'D'] };
  /** Kinds where a correct answer makes no sense (a self-assessment). */
  var NO_CORRECT = { confidence: true };
  /** Lecturer-typed text is cut at these lengths (one projector line for an option, two for the question). */
  var MAX_QUESTION = 140;
  var MAX_TEXT = 60;
  /** A voter id: random per browser, lower-case letters and digits, 8–32 characters; never a name (rule 4). */
  var VOTER_RE = /^[a-z0-9]{8,32}$/;
  /** Join codes: four characters from an alphabet without look-alikes (no 0/O, 1/I/L). */
  var CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  var CODE_SPACE = Math.pow(CODE_ALPHABET.length, 4);

  /** Kit params: poll kind and which view the stage shows. The correct answer is not a kit param: the kit shows params
      in the panel and the URL, and the room would see it before reveal (rule 3); it lives in the poll. */
  var defaults = { kind: 'abcd', view: 'both' };

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function kindOf(k) { return own(KINDS, k) ? k : 'abcd'; }
  /** Trim, collapse whitespace and cut to n characters (code points, so an emoji is never split in half). */
  function cut(s, n) {
    return typeof s === 'string' ? Array.from(s.replace(/\s+/g, ' ').trim()).slice(0, n).join('').trim() : '';
  }
  function emptyTexts(options) {
    var o = {};
    options.forEach(function (l) { o[l] = ''; });
    return o;
  }
  function copy(s, patch) { return Object.assign({}, s, patch); }

  /** A fresh, open poll of a kind, with no votes. */
  function create(kind, pollId) {
    var k = kindOf(kind);
    var options = KINDS[k].slice();
    return { pollId: Number.isInteger(pollId) && pollId > 0 ? pollId : 1, kind: k, question: '',
      texts: emptyTexts(options), options: options, correct: null, phase: 'open', votes: {} };
  }

  function isVoterId(id) { return typeof id === 'string' && VOTER_RE.test(id); }

  /**
   * What a ballot would do to the poll, checked in this order (the first that applies wins):
   *   'invalid-voter'  the id is not a voter id (rule 4)
   *   'stale'          the ballot is for another poll (a phone still showing the last question)
   *   'closed'         the poll is closed or revealed (rule 2)
   *   'invalid-option' the letter is not one of this poll's options
   *   'same'           this voter already chose this option: nothing changes
   *   'changed'        this voter chose another option before: the new one replaces it (rule 1)
   *   'recorded'       a first vote from this voter
   */
  function check(s, b) {
    if (!b || !isVoterId(b.voter)) return 'invalid-voter';
    if (b.pollId !== s.pollId) return 'stale';
    if (s.phase !== 'open') return 'closed';
    if (s.options.indexOf(b.option) < 0) return 'invalid-option';
    var prev = own(s.votes, b.voter) ? s.votes[b.voter] : null;
    if (!prev) return 'recorded';
    return prev.option === b.option ? 'same' : 'changed';
  }

  /** Rules 1–2: one vote per voter per poll, the latest wins while open; anything rejected returns s itself. */
  function vote(s, b) {
    var code = check(s, b);
    if (code !== 'recorded' && code !== 'changed') return s;
    var votes = Object.assign({}, s.votes);
    votes[b.voter] = { option: b.option, at: typeof b.at === 'number' && isFinite(b.at) ? b.at : 0 };
    return copy(s, { votes: votes });
  }

  /** Open → closed. Anything else is unchanged. */
  function close(s) { return s.phase === 'open' ? copy(s, { phase: 'closed' }) : s; }
  /** Closed → open again (late students). Revealed polls stay revealed: a new question starts a new poll (rule 3). */
  function open(s) { return s.phase === 'closed' ? copy(s, { phase: 'open' }) : s; }
  /** Open or closed → revealed; revealing an open poll also closes it, so nobody votes after seeing the split. */
  function reveal(s) { return s.phase === 'revealed' ? s : copy(s, { phase: 'revealed' }); }
  /** A new poll for a new question: next pollId, no votes, open; kind, option texts and correct answer stay. */
  function reset(s, question) {
    return copy(s, { pollId: s.pollId + 1, question: question === undefined ? s.question : cut(question, MAX_QUESTION),
      phase: 'open', votes: {} });
  }
  /** Another kind changes the letters, so the votes cannot carry over: a new poll. */
  function setKind(s, kind) {
    var k = kindOf(kind);
    if (k === s.kind) return s;
    var n = create(k, s.pollId + 1);
    n.question = s.question;
    n.correct = correctFor(n, s.correct);
    return n;
  }
  function correctFor(s, c) {
    return !NO_CORRECT[s.kind] && s.options.indexOf(c) >= 0 ? c : null;
  }
  /** The correct answer: a letter of this poll, or null ('none', a self-assessment kind, anything else). */
  function setCorrect(s, c) {
    var v = correctFor(s, c);
    return v === s.correct ? s : copy(s, { correct: v });
  }
  /** The lecturer's text: the question and the option texts, trimmed and cut. Votes are kept. */
  function setText(s, question, texts) {
    var t = emptyTexts(s.options);
    s.options.forEach(function (l) { t[l] = cut(texts && texts[l], MAX_TEXT); });
    var q = cut(question, MAX_QUESTION);
    var same = q === s.question && s.options.every(function (l) { return t[l] === s.texts[l]; });
    return same ? s : copy(s, { question: q, texts: t });
  }

  /** Counts per option of this poll and the total. */
  function tally(s) {
    var c = { total: 0 };
    s.options.forEach(function (l) { c[l] = 0; });
    Object.keys(s.votes).forEach(function (v) {
      var o = s.votes[v].option;
      if (own(c, o) && o !== 'total') { c[o] += 1; c.total += 1; }
    });
    return c;
  }

  /**
   * Rule 5: whole percentages by the largest remainder, but equal counts always get equal percentages.
   * Floors first; options with the same count form a group; groups are served by remainder (largest first, then the
   * larger count), each taking one point per member, until the next group does not fit in the points left. So the
   * sum is 100 unless a tie cannot be split evenly (three equal thirds: 33 + 33 + 33 = 99). No votes: all 0.
   */
  function percents(counts, options) {
    var out = {};
    var total = options.reduce(function (a, l) { return a + (counts[l] || 0); }, 0);
    options.forEach(function (l) { out[l] = 0; });
    if (total === 0) return out;
    var groups = {};
    options.forEach(function (l) {
      var n = counts[l] || 0;
      out[l] = Math.floor(n * 100 / total);
      var key = String(n);
      if (!groups[key]) groups[key] = { n: n, rem: (n * 100) % total, members: [] };
      groups[key].members.push(l);
    });
    var left = 100 - options.reduce(function (a, l) { return a + out[l]; }, 0);
    var order = Object.keys(groups).map(function (k) { return groups[k]; })
      .filter(function (g) { return g.rem > 0; })
      .sort(function (a, b) { return b.rem - a.rem || b.n - a.n; });
    for (var i = 0; i < order.length; i++) {
      if (order[i].members.length > left) break;
      order[i].members.forEach(function (l) { out[l] += 1; });
      left -= order[i].members.length;
    }
    return out;
  }

  /** What the projector shows: the count always; the split and the correct answer only once revealed (rule 3). */
  function view(s) {
    var c = tally(s);
    var shown = s.phase === 'revealed';
    var pct = shown ? percents(c, s.options) : null;
    var max = 0;
    s.options.forEach(function (l) { if (c[l] > max) max = c[l]; });
    return {
      phase: s.phase,
      total: c.total,
      shown: shown,
      correct: shown ? s.correct : null,
      sum: shown ? s.options.reduce(function (a, l) { return a + pct[l]; }, 0) : null,
      rows: s.options.map(function (l) {
        return { option: l, text: s.texts[l] || '', count: shown ? c[l] : null, pct: shown ? pct[l] : null,
          top: shown && c.total > 0 && c[l] === max, correct: shown && s.correct === l };
      })
    };
  }

  /** A four-character join code for an integer (the page draws the integer once per session). */
  function joinCode(n) {
    var x = ((Math.floor(Math.abs(Number(n) || 0)) % CODE_SPACE) + CODE_SPACE) % CODE_SPACE;
    var s = '';
    for (var i = 0; i < 4; i++) { s = CODE_ALPHABET[x % CODE_ALPHABET.length] + s; x = Math.floor(x / CODE_ALPHABET.length); }
    return s;
  }

  /** A stored poll (sessionStorage), repaired, or null when it is not one. */
  function sanitize(x) {
    if (!x || typeof x !== 'object' || !own(KINDS, x.kind)) return null;
    var s = create(x.kind, x.pollId);
    s = setText(s, x.question, x.texts);
    s = setCorrect(s, x.correct);
    if (x.phase === 'closed' || x.phase === 'revealed') s.phase = x.phase;
    var votes = {};
    if (x.votes && typeof x.votes === 'object') {
      Object.keys(x.votes).forEach(function (v) {
        var b = x.votes[v];
        if (isVoterId(v) && b && s.options.indexOf(b.option) >= 0) {
          votes[v] = { option: b.option, at: typeof b.at === 'number' && isFinite(b.at) ? b.at : 0 };
        }
      });
    }
    s.votes = votes;
    return s;
  }

  var api = {
    LETTERS: LETTERS, KINDS: KINDS, NO_CORRECT: NO_CORRECT, MAX_QUESTION: MAX_QUESTION, MAX_TEXT: MAX_TEXT,
    defaults: defaults,
    create: create, isVoterId: isVoterId, check: check, vote: vote,
    close: close, open: open, reveal: reveal, reset: reset, setKind: setKind, setCorrect: setCorrect, setText: setText,
    tally: tally, percents: percents, view: view, joinCode: joinCode, sanitize: sanitize,
    /** The kit's state is the configuration the params choose; the poll itself lives in the page. */
    initial: function (p) { return { kind: kindOf(p.kind), view: p.view }; }
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
