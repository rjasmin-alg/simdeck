/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for encapsulation: a message goes down the sender's TCP/IP stack (each layer prepends its header, the link
   layer also appends the FCS and pads a short packet), over the wire, and up the receiver's stack (each layer strips
   its own outermost blocks). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Header and trailer sizes in octets (SPEC rule 4). */
  var SIZE = { tcp: 20, udp: 8, ip: 20, oip: 20, gre: 4, eth: 14, fcs: 4 };
  var PREAMBLE = 8;      // 7 B preamble + 1 B SFD: on the wire, not in the frame length
  var MIN_PAYLOAD = 46;  // Ethernet: 46–1500 B payload, so 64–1518 B frames
  var MAX_PAYLOAD = 1500;

  /** The unit named after a block that starts it (SPEC rule 6). */
  var UNIT = { eth: 'frame', oip: 'packet', ip: 'packet', tcp: 'segment', udp: 'datagram', data: 'data' };

  function sum(pdu) { return pdu.reduce(function (a, b) { return a + b.bytes; }, 0); }
  function block(kind, layer, bytes) { return { kind: kind, layer: layer, bytes: bytes }; }

  /** Padding the link layer adds behind a payload of `bytes` octets (rule 5): exactly 46 gets none. */
  function padFor(bytes) { return Math.max(0, MIN_PAYLOAD - bytes); }

  /** The layers a unit passes, top to bottom, on one side. */
  function layersOf(p) {
    return p.tunnel ? ['application', 'transport', 'network', 'tunnel', 'link'] : ['application', 'transport', 'network', 'link'];
  }

  /** Every step after step 0, in order: down the sender, the wire, up the receiver. */
  function plan(p) {
    var down = layersOf(p), out = [];
    down.forEach(function (l) { out.push({ side: 'sender', layer: l, action: l === 'application' ? 'create' : 'add' }); });
    out.push({ side: null, layer: 'physical', action: 'wire' });
    down.slice().reverse().forEach(function (l) { out.push({ side: 'receiver', layer: l, action: l === 'application' ? 'deliver' : 'strip' }); });
    return out;
  }

  /** Going down: what `layer` puts around the PDU it got from above (rules 1–5, 8). Never touches the inside. */
  function encapsulate(pdu, layer, p) {
    var inside = pdu.slice();
    if (layer === 'transport') return [block(p.proto === 'udp' ? 'udp' : 'tcp', 'transport', p.proto === 'udp' ? SIZE.udp : SIZE.tcp)].concat(inside);
    if (layer === 'network') return [block('ip', 'network', SIZE.ip)].concat(inside);
    if (layer === 'tunnel') return [block('oip', 'tunnel', SIZE.oip), block('gre', 'tunnel', SIZE.gre)].concat(inside);
    if (layer === 'link') {
      var pad = padFor(sum(inside));
      var out = [block('eth', 'link', SIZE.eth)].concat(inside);
      if (pad > 0) out.push(block('pad', 'link', pad));
      out.push(block('fcs', 'link', SIZE.fcs));
      return out;
    }
    return inside;
  }

  /** Going up: `layer` removes only its own blocks from the outside (front and back), outermost first (rule 7). */
  function decapsulate(pdu, layer) {
    var out = pdu.slice(), removed = [];
    while (out.length && out[0].layer === layer) removed.push(out.shift().kind);
    var back = [];
    while (out.length && out[out.length - 1].layer === layer) back.unshift(out.pop().kind);
    return { pdu: out, removed: removed.concat(back) };
  }

  /** The units nested in a PDU, outermost first: { unit, kind, from, to, bytes } (block indexes, inclusive). */
  function units(pdu) {
    var d = -1;
    pdu.forEach(function (b, i) { if (b.kind === 'data') d = i; });
    var out = [];
    pdu.forEach(function (b, i) {
      if (!UNIT[b.kind]) return;
      var to = b.kind === 'eth' ? pdu.length - 1 : d;
      out.push({ unit: UNIT[b.kind], kind: b.kind, from: i, to: to, bytes: sum(pdu.slice(i, to + 1)) });
    });
    return out;
  }

  /** The PDU's name: its outermost unit, or null when nothing exists yet. */
  function unitOf(pdu) { return pdu.length ? UNIT[pdu[0].kind] : null; }

  var logic = {
    SIZE: SIZE,
    PREAMBLE: PREAMBLE,
    MIN_PAYLOAD: MIN_PAYLOAD,
    MAX_PAYLOAD: MAX_PAYLOAD,

    defaults: { proto: 'tcp', payload: 300, tunnel: false, showSizes: true },

    /** 1 create + 3 or 4 adds + 1 wire + 3 or 4 strips + 1 deliver: 9, or 11 with the tunnel. */
    steps: function (p) { return plan(p).length; },

    /** Rule 9: the outer packet stays within 1500 B with the tunnel on. */
    payloadMax: function (p) { return p.tunnel ? 1430 : 1460; },

    initial: function () {
      return { phase: 'start', layer: null, side: null, action: 'start', pdu: [], added: [], removed: [] };
    },

    step: function (s, n, p) {
      var a = plan(p)[n - 1];
      var pdu = s.pdu, added = [], removed = [], phase;
      if (a.action === 'create') {
        pdu = [block('data', 'application', p.payload)];
        added = ['data'];
        phase = 'down';
      } else if (a.action === 'add') {
        pdu = encapsulate(s.pdu, a.layer, p);
        added = pdu.filter(function (b) { return b.layer === a.layer; }).map(function (b) { return b.kind; });
        phase = 'down';
      } else if (a.action === 'wire') {
        pdu = s.pdu.slice();
        phase = 'wire';
      } else if (a.action === 'strip') {
        var r = decapsulate(s.pdu, a.layer);
        pdu = r.pdu;
        removed = r.removed;
        phase = 'up';
      } else {
        pdu = s.pdu.slice();
        phase = 'done';
      }
      return { phase: phase, layer: a.layer, side: a.side, action: a.action, pdu: pdu, added: added, removed: removed };
    },

    plan: plan,
    layersOf: layersOf,
    padFor: padFor,
    encapsulate: encapsulate,
    decapsulate: decapsulate,
    units: units,
    unitOf: unitOf,
    total: sum,
    /** Octets on the wire: the frame plus preamble and SFD (rule 10). */
    onWire: function (pdu) { return sum(pdu) + PREAMBLE; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
