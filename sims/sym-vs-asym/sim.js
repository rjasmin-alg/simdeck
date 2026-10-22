/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for sym-vs-asym: the key distribution problem and how public keys solve it. Rules and numbers: SPEC.md.
   A group of n people where everyone talks to everyone has a key bill: one shared key per pair (each must be carried
   over a secure channel first) or one key pair per person (nothing secret travels). One message Alice → Bob per
   scheme shows why; then a newcomer joins and the bill grows; then the hybrid (TLS order) uses both.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Words live in strings.js. */
(function (root) {
  'use strict';

  var ALICE = 0, BOB = 1;
  var HYBRID_DATA = 3; // data messages in the hybrid step: one public-key operation, then all data symmetric

  var PHASES = {
    both: ['want', 'carry', 'symEnc', 'symEve', 'symDec', 'publish', 'asymEnc', 'asymEve', 'asymDec', 'join', 'hybrid'],
    symmetric: ['want', 'carry', 'symEnc', 'symEve', 'symDec', 'symReply'],
    asymmetric: ['want', 'publish', 'asymEnc', 'asymEve', 'asymDec', 'asymReply']
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function has(list, x) { return list.indexOf(x) >= 0; }
  function sharedId(i, j) { return i < j ? 's-' + i + '-' + j : 's-' + j + '-' + i; }
  function schemesOf(scheme) { return scheme === 'both' ? ['sym', 'asym'] : [scheme === 'symmetric' ? 'sym' : 'asym']; }

  /** Every key the group needs so that everyone can talk to everyone, none made yet. Pairs i < j ascending. */
  function groupKeys(n) {
    var keys = [];
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) keys.push(sharedKey(i, j));
    for (var k = 0; k < n; k++) keys.push.apply(keys, keyPair(k));
    return keys;
  }
  function sharedKey(i, j) { return { id: sharedId(i, j), kind: 'shared', pair: [Math.min(i, j), Math.max(i, j)], made: false, travelled: 'none' }; }
  function keyPair(o) {
    return [{ id: 'pub-' + o, kind: 'public', owner: o, made: false, travelled: 'none' },
            { id: 'priv-' + o, kind: 'private', owner: o, made: false, travelled: 'none' }];
  }

  /** Keys in each scheme and how many of them must be carried over a secure channel (rules 1-3). */
  function countsOf(keys) {
    var c = { sym: { total: 0, secretTransfers: 0 }, asym: { total: 0, pairs: 0, secretTransfers: 0 } };
    keys.forEach(function (k) {
      if (k.kind === 'shared') { c.sym.total++; c.sym.secretTransfers++; } // the same key on both sides: it has to get there
      else { c.asym.total++; if (k.kind === 'public') c.asym.pairs++; }   // public keys travel openly, private keys never
    });
    return c;
  }

  /** Closed forms (rule 3), for the page's text and the tests. */
  function symKeys(n) { return n * (n - 1) / 2; }
  function asymKeys(n) { return 2 * n; }

  /** Which scheme needs more keys for n people: 'asym' (n < 5), 'equal' (n = 5), 'sym' (n > 5). */
  function moreKeys(n) {
    var s = symKeys(n), a = asymKeys(n);
    return s === a ? 'equal' : s > a ? 'sym' : 'asym';
  }

  /** The key that decrypts what keyId encrypted: the same shared key, or the owner's private key (rules 1, 2). */
  function decryptingKey(keys, keyId) {
    var k = find(keys, keyId);
    if (!k) return keyId; // the hybrid's session key is not a group key: it decrypts itself
    return k.kind === 'public' ? 'priv-' + k.owner : k.id;
  }
  function find(keys, id) { for (var i = 0; i < keys.length; i++) if (keys[i].id === id) return keys[i]; return null; }

  /** Can a holder of these key ids read a message encrypted with keyId? (rules 2, 6) */
  function canRead(keys, holding, keyId) { return has(holding, decryptingKey(keys, keyId)); }

  function make(s, id, travelled) {
    var k = find(s.keys, id);
    k.made = true;
    k.travelled = travelled;
    s.changed.push(id);
  }
  function eveTakes(s, id) {
    if (!has(s.eve.keys, id)) s.eve.keys.push(id);
    s.changed.push('eve-' + id);
  }
  function msg(id, from, to) { return { id: id, from: from, to: to, stage: 'plain', keyUsed: null, decryptedWith: null, whole: false, eveCopy: false, eveCanRead: false }; }
  function setStage(s, lane, stage) {
    var m = s.lanes[lane].msgs[0];
    m.stage = stage;
    s.changed.push('m-' + m.id);
    return m;
  }
  /** Eve copies the ciphertext off the wire and tries the keys she holds (rule 6). */
  function eveCopies(s, m) {
    m.eveCopy = true;
    m.eveCanRead = canRead(s.keys, s.eve.keys, m.keyUsed);
    s.changed.push('eve-' + m.id);
  }
  /** A whole message at once: encrypted with keyId, copied by Eve on the wire, decrypted by the recipient. */
  function sendWhole(s, m, keyId) {
    m.keyUsed = keyId;
    m.whole = true; // the page draws its ciphertext on the wire as well as the result
    m.stage = 'read';
    m.decryptedWith = decryptingKey(s.keys, keyId);
    eveCopies(s, m);
    s.changed.push('m-' + m.id);
    return m;
  }

  var logic = {
    ALICE: ALICE,
    BOB: BOB,
    HYBRID_DATA: HYBRID_DATA,
    PHASES: PHASES,

    /** Parameter defaults. n is the group at the start (the newcomer makes it n + 1). */
    defaults: { n: 4, scheme: 'both', eveHasSharedKey: false },
    nMin: 2,
    nMax: 30,

    /** 11 steps with both schemes, 6 with one (SPEC.md "Steps"). */
    steps: function (p) { return logic.phasesOf(p).length; },
    phasesOf: function (p) { return PHASES[p.scheme] || PHASES.both; },

    initial: function (p) {
      var n = Math.max(logic.nMin, Math.min(logic.nMax, Math.round(p.n)));
      var lanes = {};
      schemesOf(p.scheme).forEach(function (sc) { lanes[sc] = { msgs: [] }; });
      var keys = groupKeys(n);
      return {
        n: n,
        joined: null,           // { who, sym, asym }: the newcomer and the keys they added
        phase: 'start',
        schemes: schemesOf(p.scheme),
        keys: keys,
        counts: countsOf(keys),
        more: moreKeys(n),
        lanes: lanes,           // sym, asym (and hybrid at its step): the Alice → Bob messages
        eve: { keys: [] },          // the keys Eve holds; her copies are msg.eveCopy
        hybrid: null,
        changed: []
      };
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var phase = logic.phasesOf(p)[n - 1];
      s.phase = phase;
      s.changed = [];
      var m;
      switch (phase) {
        case 'want':          // 1. Alice wants to write to Bob: the plaintext is at Alice in every lane
          s.schemes.forEach(function (sc) { s.lanes[sc].msgs = [msg(sc + '1', ALICE, BOB)]; s.changed.push('m-' + sc + '1'); });
          break;
        case 'carry':         // 2. the shared key must reach Bob first, over a secure channel (rule 1)
          make(s, sharedId(ALICE, BOB), 'secret');
          if (p.eveHasSharedKey) eveTakes(s, sharedId(ALICE, BOB)); // stolen in transit (rule 6)
          break;
        case 'symEnc':        // 3. Alice encrypts with the shared key
          m = setStage(s, 'sym', 'enc');
          m.keyUsed = sharedId(ALICE, BOB);
          break;
        case 'symEve':        // 4. on the wire: Eve copies the ciphertext and tries her keys
          eveCopies(s, setStage(s, 'sym', 'wire'));
          break;
        case 'symDec':        // 5. Bob decrypts with the same key
          m = setStage(s, 'sym', 'read');
          m.decryptedWith = decryptingKey(s.keys, m.keyUsed);
          break;
        case 'symReply':      // 6. Bob answers with the same key: one key, both directions; Eve tries again
          m = msg('sym2', BOB, ALICE);
          s.lanes.sym.msgs.push(sendWhole(s, m, sharedId(ALICE, BOB)));
          break;
        case 'publish':       // 6. Bob makes his pair and publishes the public half; nothing secret travels (rule 2)
          make(s, 'pub-' + BOB, 'open');
          make(s, 'priv-' + BOB, 'none');
          eveTakes(s, 'pub-' + BOB); // public means everyone, Eve too
          break;
        case 'asymEnc':       // 7. Alice encrypts with Bob's public key
          m = setStage(s, 'asym', 'enc');
          m.keyUsed = 'pub-' + BOB;
          break;
        case 'asymEve':       // 8. Eve copies the ciphertext and holds the public key too: still cannot read
          eveCopies(s, setStage(s, 'asym', 'wire'));
          break;
        case 'asymDec':       // 9. Bob decrypts with his private key
          m = setStage(s, 'asym', 'read');
          m.decryptedWith = decryptingKey(s.keys, m.keyUsed);
          break;
        case 'asymReply':     // 6. Bob answers: he needs Alice's public key, so Alice publishes hers
          make(s, 'pub-' + ALICE, 'open');
          make(s, 'priv-' + ALICE, 'none');
          eveTakes(s, 'pub-' + ALICE);
          m = msg('asym2', BOB, ALICE);
          s.lanes.asym.msgs.push(sendWhole(s, m, 'pub-' + ALICE));
          break;
        case 'join':          // 10. a newcomer: n new shared keys, one new pair (rule 4)
          var who = s.n;
          var added = [];
          for (var i = 0; i < who; i++) added.push(sharedKey(i, who));
          var pair = keyPair(who);
          // keep the order of groupKeys(n + 1): shared keys first (by pair), then the pairs
          var shared = s.keys.filter(function (k) { return k.kind === 'shared'; }).concat(added);
          shared.sort(function (a, b) { return a.pair[0] - b.pair[0] || a.pair[1] - b.pair[1]; });
          s.keys = shared.concat(s.keys.filter(function (k) { return k.kind !== 'shared'; }), pair);
          s.n = who + 1;
          s.joined = { who: who, sym: added.length, asym: 1 };
          s.changed = ['p-' + who].concat(added.map(function (k) { return k.id; }), pair.map(function (k) { return k.id; }), ['count-sym', 'count-asym']);
          break;
        case 'hybrid':        // 11. TLS order: a fresh session key wrapped with Bob's public key, then all data symmetric
          var wrap = msg('hk', ALICE, BOB);
          wrap.carries = 'session';
          var msgs = [sendWhole(s, wrap, 'pub-' + BOB)];
          for (var d = 1; d <= HYBRID_DATA; d++) msgs.push(sendWhole(s, msg('hd' + d, ALICE, BOB), 'session'));
          s.lanes.hybrid = { msgs: msgs };
          s.hybrid = { publicOps: 1, symmetricMsgs: HYBRID_DATA, secretTransfers: 0 };
          break;
      }
      s.counts = countsOf(s.keys);
      s.more = moreKeys(s.n);
      return s;
    },

    sharedId: sharedId,
    groupKeys: groupKeys,
    countsOf: countsOf,
    symKeys: symKeys,
    asymKeys: asymKeys,
    moreKeys: moreKeys,
    decryptingKey: decryptingKey,
    canRead: canRead,
    find: find
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
