/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for encapsulation on layers 2 and 3: which headers (and trailers) each frame carries, how many bytes each one
   takes, and what that leaves of the link MTU for the packet inside. An explorer: no steps; the page draws
   initial(params).
   Adopted from single-page-labs/l2l3-protocols.html: its frame dissections (field order and sizes), its "MTU values by
   tunnel type" table and its coexistence frames. The byte budget is computed here instead of written out; see NOTES.md
   for the numbers that changed.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Ethernet header without tags (destination MAC 6, source MAC 6, EtherType 2) and its FCS. */
  var ETH = 14;
  var FCS = 4;
  /** ESP (RFC 4303) pads its encrypted part (inner packet, padding, pad length, next header) to a multiple of 4. */
  var ESP_ALIGN = 4;
  /** Bounds of the page's sliders (the original's link-MTU slider ran from 576 to 9000 in steps of 4). */
  var MTU_MIN = 576;
  var MTU_MAX = 9000;
  var LABELS_MAX = 4;
  var OPTS_MAX = 252;

  /* A segment: f = field id (the page's strings), b = bytes (null: computed), z = zone, k = kind (colour), v = value
     shown in the box (data), enc = encrypted.
     Zones: 'phy' on the wire only (not counted); 'l2' the outer frame's own header and trailer, outside the link MTU;
     'over' inside the link MTU, added by the encapsulation; 'inner' what the frame is there to carry.
     A frame is a list of groups [group id, segments]; a group is one header (or the payload) and is labelled as one. */
  function s(f, b, z, k, v, enc) { return { f: f, b: b, z: z, k: k, v: v || '', enc: !!enc }; }
  var dst = s('dst', 6, 'l2', 'eth');
  var src = s('src', 6, 'l2', 'eth');
  var etype = function (v) { return s('etype', 2, 'l2', 'eth', v); };
  var fcs = ['gFcs', [s('fcs', FCS, 'l2', 'eth')]];
  var oeth = ['gOuterEth', [s('oeth', ETH, 'l2', 'eth')]];
  var oip = function (v) { return ['gOuterIp', [s('oip', 20, 'over', 'ip', v)]]; };
  var udp = function (v) { return ['gUdp', [s('udp', 8, 'over', 'tun', v)]]; };
  var ieth = ['gInnerEth', [s('ieth', ETH, 'over', 'eth')]];
  var inner = ['gInner', [s('iip', 20, 'inner', 'ip'), s('pay', null, 'inner', 'pay')]];
  var espHead = ['gEsp', [s('esphdr', 8, 'over', 'sec'), s('iv', 8, 'over', 'sec')]];
  var espTail = function (enc) { return ['gEspTrl', [s('pad', 0, 'over', 'sec', '', enc), s('esptrl', 2, 'over', 'sec', '', enc)]]; };
  var icv = ['gIcv', [s('icv', 16, 'over', 'sec')]];
  var encrypt = function (g) { return [g[0], g[1].map(function (x) { var y = Object.assign({}, x); y.enc = true; return y; })]; };

  /** The frames, in the order of the page's list. kind: what the frame shows ('l2' tags in the frame header, 'hdr' one
      header's fields, 'tunnel' headers inside the link MTU). esp: the frame has ESP's 4-byte alignment. */
  var FRAMES = {
    eth: { kind: 'l2', groups: [
      ['gPhy', [s('pre', 8, 'phy', 'phy')]],
      ['gEth', [dst, src, etype('0x0800')]],
      ['gPacket', [s('pay', null, 'inner', 'pay')]],
      fcs] },
    dot1q: { kind: 'l2', groups: [
      ['gEthTag', [dst, src, s('tpid', 2, 'l2', 'tag', '0x8100'), s('tci', 2, 'l2', 'tag', 'VID 200'), etype('0x0800')]],
      ['gPacket', [s('pay', null, 'inner', 'pay')]],
      fcs] },
    qinq: { kind: 'l2', groups: [
      ['gEthQinq', [dst, src, s('stpid', 2, 'l2', 'tag', '0x88A8'), s('stci', 2, 'l2', 'tag', 'S-VID 10'),
        s('ctpid', 2, 'l2', 'tag', '0x8100'), s('ctci', 2, 'l2', 'tag', 'C-VID 100'), etype('0x0800')]],
      ['gPacket', [s('pay', null, 'inner', 'pay')]],
      fcs] },
    macsec: { kind: 'l2', groups: [
      ['gEthMacsec', [dst, src, s('sectag', 16, 'l2', 'sec', '0x88E5')]],
      ['gSecured', [s('etype', 2, 'l2', 'eth', '0x0800', true), s('pay', null, 'inner', 'pay', '', true)]],
      ['gIcv', [s('icv', 16, 'l2', 'sec')]],
      fcs] },
    ipv4: { kind: 'hdr', groups: [
      ['gIpv4', [s('verihl', 1, 'over', 'ip', '4 | 5'), s('dscp', 1, 'over', 'ip'), s('totlen', 2, 'over', 'ip'),
        s('ident', 2, 'over', 'ip'), s('flags', 2, 'over', 'ip', 'DF | MF'), s('ttl', 1, 'over', 'ip', '64'),
        s('proto', 1, 'over', 'ip', '6'), s('csum', 2, 'over', 'ip'), s('sip', 4, 'over', 'ip'), s('dip', 4, 'over', 'ip'),
        s('opts', 0, 'over', 'ip')]],
      ['gData', [s('data', null, 'inner', 'pay')]]] },
    ipv6: { kind: 'hdr', groups: [
      ['gIpv6', [s('vtcfl', 4, 'over', 'ip', '6'), s('plen', 2, 'over', 'ip'), s('nh', 1, 'over', 'ip', '6'),
        s('hlim', 1, 'over', 'ip', '64'), s('sip6', 16, 'over', 'ip'), s('dip6', 16, 'over', 'ip'), s('ext', 0, 'over', 'ip')]],
      ['gData', [s('data', null, 'inner', 'pay')]]] },
    mpls: { kind: 'tunnel', groups: [
      ['gEth', [dst, src, etype('0x8847')]],
      ['gLabels', 'labels'],
      inner,
      fcs] },
    ipip: { kind: 'tunnel', groups: [oeth, oip('proto 4'), inner, fcs] },
    gre: { kind: 'tunnel', groups: [oeth, oip('proto 47'), ['gGre', [s('gre', 4, 'over', 'tun', '0x0800')]], inner, fcs] },
    vxlan: { kind: 'tunnel', groups: [oeth, oip('proto 17'), udp('dst 4789'),
      ['gVxlan', [s('vxlan', 8, 'over', 'tun', 'VNI 5001')]], ieth, inner, fcs] },
    geneve: { kind: 'tunnel', groups: [oeth, oip('proto 17'), udp('dst 6081'),
      ['gGeneve', [s('geneve', 8, 'over', 'tun', 'VNI 5001'), s('gopts', 'opts', 'over', 'tun')]], ieth, inner, fcs] },
    esp: { kind: 'tunnel', esp: true, groups: [oeth, oip('proto 50'), espHead, encrypt(inner), espTail(true), icv, fcs] },
    'vxlan-dot1q': { kind: 'tunnel', groups: [oeth, oip('proto 17'), udp('dst 4789'),
      ['gVxlan', [s('vxlan', 8, 'over', 'tun', 'VNI 5001')]],
      ['gInnerEthTag', [s('ieth', ETH, 'over', 'eth'), s('itag', 4, 'over', 'tag', 'VID 200')]],
      ['gInner', [s('iip', 20, 'inner', 'ip'), s('tcp', 20, 'inner', 'tun'), s('pay', null, 'inner', 'pay')]],
      fcs] },
    'gre-ipsec': { kind: 'tunnel', esp: true, groups: [oeth, oip('proto 50'), espHead,
      ['gGreIp', [s('gip', 20, 'over', 'ip', 'proto 47', true), s('gre', 4, 'over', 'tun', '0x0800', true)]],
      encrypt(inner), espTail(true), icv, fcs] }
  };
  var FRAME_IDS = Object.keys(FRAMES);

  /** The label stack: n entries, the last with S = 1 (bottom of stack). */
  function labelStack(n) {
    var out = [];
    for (var i = 1; i <= n; i++) out.push(s(i === n ? 'labelBottom' : 'label', 4, 'over', 'tag', 'S=' + (i === n ? 1 : 0)));
    return out;
  }

  function sum(segs, zone) {
    return segs.reduce(function (a, x) { return a + (x.z === zone ? x.b : 0); }, 0);
  }

  /** One frame with every size filled in for these params: groups, the byte budget and where the bytes went.
      Numbers: over = bytes the encapsulation takes inside the link MTU (incl. unusable bytes ESP's alignment leaves);
      inner = the largest inner part that fits (the packet, or the data for a header view); l2 = the outer frame's own
      header and trailer; frame = the largest frame on the wire (l2 + mtu, preamble not counted); extra = bytes the
      frame header has over a plain Ethernet II frame (tags, MACsec). */
  function build(id, p) {
    var def = FRAMES[id] || FRAMES.eth;
    var mtu = p.mtu;
    var groups = def.groups.map(function (g) {
      var segs = g[1] === 'labels' ? labelStack(p.labels) : g[1].map(function (x) {
        var y = Object.assign({}, x);
        if (y.b === 'opts') y.b = p.opts;
        return y;
      });
      return { g: g[0], segs: segs };
    });
    var all = [].concat.apply([], groups.map(function (g) { return g.segs; }));
    var fixedOver = sum(all, 'over');
    var fixedInner = all.reduce(function (a, x) { return a + (x.z === 'inner' && x.b !== null ? x.b : 0); }, 0);
    var avail = mtu - fixedOver;
    var waste = 0;
    if (def.esp) {
      // Encrypted part = everything after the IV up to the ICV: (GRE's IP and GRE) + inner + padding + 2.
      var encOver = all.reduce(function (a, x) { return a + (x.enc && x.z === 'over' ? x.b : 0); }, 0);
      var room = mtu - (fixedOver - encOver);
      var encMax = Math.floor(room / ESP_ALIGN) * ESP_ALIGN;
      waste = room - encMax;
      avail = encMax - encOver;
    }
    var innerMax = Math.max(0, avail);
    var payload = Math.max(0, innerMax - fixedInner);
    all.forEach(function (x) { if (x.b === null) x.b = payload; });
    var l2 = sum(all, 'l2');
    groups.forEach(function (g) { g.bytes = g.segs.reduce(function (a, x) { return a + (x.z === 'phy' ? 0 : x.b); }, 0); });
    return {
      id: id,
      kind: def.kind,
      groups: groups,
      over: mtu - innerMax,
      waste: waste,
      inner: innerMax,
      l2: l2,
      // A header view has no frame around it (l2 = 0): its "frame" is the packet itself.
      frame: l2 + mtu,
      extra: def.kind === 'hdr' ? 0 : l2 - ETH - FCS,
      fits: innerMax >= fixedInner
    };
  }

  /** The budget of every frame at these params, for the comparison view (header views left out: they are not frames). */
  function compare(p) {
    return FRAME_IDS.filter(function (id) { return FRAMES[id].kind !== 'hdr'; }).map(function (id) {
      var b = build(id, p);
      return { id: id, over: b.over, inner: b.inner, extra: b.extra, frame: b.frame };
    });
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  var defaults = { frame: 'eth', view: 'frame', mtu: 1500, labels: 2, opts: 8 };

  /** Presets 1–9: the frames the original page led with, and the comparison its MTU table made. */
  var presets = [
    { id: 'ethernet', params: { frame: 'eth' } },
    { id: 'qinq', params: { frame: 'qinq' } },
    { id: 'ipv4', params: { frame: 'ipv4' } },
    { id: 'ipv6', params: { frame: 'ipv6' } },
    { id: 'mpls-vpn', params: { frame: 'mpls', labels: 2 } },
    { id: 'vxlan', params: { frame: 'vxlan' } },
    { id: 'geneve', params: { frame: 'geneve', opts: 8 } },
    { id: 'ipsec', params: { frame: 'esp' } },
    { id: 'compare', params: { frame: 'vxlan', view: 'compare' } }
  ];

  var logic = {
    ETH: ETH,
    FCS: FCS,
    ESP_ALIGN: ESP_ALIGN,
    MTU_MIN: MTU_MIN,
    MTU_MAX: MTU_MAX,
    LABELS_MAX: LABELS_MAX,
    OPTS_MAX: OPTS_MAX,
    FRAME_IDS: FRAME_IDS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    build: build,
    compare: compare,
    kindOf: function (id) { return (FRAMES[id] || FRAMES.eth).kind; },

    initial: function (p) {
      var q = Object.assign({}, p, {
        mtu: clamp(p.mtu, MTU_MIN, MTU_MAX),
        labels: clamp(p.labels, 1, LABELS_MAX),
        opts: clamp(Math.floor(p.opts / 4) * 4, 0, OPTS_MAX)
      });
      return { frame: build(FRAMES[q.frame] ? q.frame : 'eth', q), rows: q.view === 'compare' ? compare(q) : [] };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
