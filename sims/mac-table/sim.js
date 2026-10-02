/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for mac-table: a switch with three ports, A on 1, B on 2, C on 3 (URM book, ch. 7, Primjer 2), learns its MAC
   address table from the traffic. Three frames pass through it: the sender to the receiver, the reply, and the sender
   again. Each frame takes two steps: it arrives and the switch writes the frame's SOURCE address with the port and the
   time (self-learning); then the switch looks up the DESTINATION and either forwards the frame to that one port or,
   when the destination is not in the table, floods a copy to every port except the one it came in on.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. learn, decide and frames are pure functions
   over plain data with no strings, so they can move to models/ unchanged when net-mac-flooding (catalogue §5.9),
   which extends this sim, reuses them. */
(function (root) {
  'use strict';

  var HOSTS = ['A', 'B', 'C'];
  var PORT = { A: 1, B: 2, C: 3 };
  var PAIRS = ['A-B', 'A-C', 'B-A', 'B-C', 'C-A', 'C-B'];
  var FRAMES = 3;
  var STEPS = 2 * FRAMES;

  /** The switch writes the source of a frame: a new row at the end, or, when the address is already there, the same
      row updated in place (port and time). One row per address, never two. Returns a new table. */
  function learn(table, mac, port, time) {
    var out = table.map(function (r) { return { mac: r.mac, port: r.port, time: r.time }; });
    for (var i = 0; i < out.length; i++) {
      if (out[i].mac === mac) { out[i].port = port; out[i].time = time; return out; }
    }
    out.push({ mac: mac, port: port, time: time });
    return out;
  }

  /** The row of an address, or null. */
  function lookup(table, mac) {
    for (var i = 0; i < table.length; i++) if (table[i].mac === mac) return table[i];
    return null;
  }

  /** Where a frame that came in on `inPort` for `dst` goes: the destination's port when it is in the table
      ('forward'), else every port except the incoming one, in port order ('flood'). The decision looks only at the
      destination's row; rows of other hosts change nothing. */
  function decide(table, dst, inPort, ports) {
    var row = lookup(table, dst);
    if (row) return { action: 'forward', out: [row.port] };
    return { action: 'flood', out: ports.filter(function (p) { return p !== inPort; }) };
  }

  /** The three frames of one exchange: the sender to the receiver, the reply, and the sender once more. */
  function frames(pair) {
    var ab = pair.split('-');
    return [{ src: ab[0], dst: ab[1] }, { src: ab[1], dst: ab[0] }, { src: ab[0], dst: ab[1] }];
  }

  /** The table before the first frame: the hosts marked as known, in host order, with time 0 ("earlier"). */
  function startTable(p) {
    var t = [];
    HOSTS.forEach(function (h) { if (p['know' + h]) t.push({ mac: h, port: PORT[h], time: 0 }); });
    return t;
  }

  var PORTS = HOSTS.map(function (h) { return PORT[h]; });

  var logic = {
    /** The book's numbers: URM ch. 7, Primjer 2. The table knows only C on port 3; A sends a frame to B. */
    defaults: { pair: 'A-B', knowA: false, knowB: false, knowC: true },
    hosts: HOSTS,
    port: PORT,
    ports: PORTS,
    pairs: PAIRS,
    frameCount: FRAMES,
    steps: STEPS,

    /** Step 0: the table as it starts, nothing on the wire. */
    initial: function (p) {
      return { table: startTable(p), frame: 0, phase: 'idle', src: null, dst: null, inPort: null,
        learned: null, action: null, out: [], changed: null };
    },

    /** Odd steps: frame k = (n + 1) / 2 arrives and its source is learned. Even steps: the switch decides. */
    step: function (s, n, p) {
      var k = Math.ceil(n / 2);
      var f = frames(p.pair)[k - 1];
      var inPort = PORT[f.src];
      if (n % 2 === 1) {
        var before = lookup(s.table, f.src);
        return { table: learn(s.table, f.src, inPort, k), frame: k, phase: 'learn', src: f.src, dst: f.dst,
          inPort: inPort, learned: before ? 'refresh' : 'new', action: null, out: [], changed: f.src };
      }
      var d = decide(s.table, f.dst, inPort, PORTS);
      return { table: s.table, frame: k, phase: 'decide', src: f.src, dst: f.dst, inPort: inPort,
        learned: null, action: d.action, out: d.out, changed: null };
    },

    learn: learn,
    lookup: lookup,
    decide: decide,
    frames: frames
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
