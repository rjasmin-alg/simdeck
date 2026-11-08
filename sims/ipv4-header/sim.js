/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ipv4-header: the twelve fixed fields of the IPv4 header (and options when IHL > 5), the IHL and length
   arithmetic, the header checksum, and what one router does to the header in three situations: a plain hop (TTL − 1,
   checksum), fragmenting into a smaller MTU (each fragment its own header) and NAT (source address).
   Rules and numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   An explorer: no steps; the state is derived from the params. The page loads this as a classic script
   (window.SimLogic); node tests require() it. The packet helpers take plain data and hold no strings. */
(function (root) {
  'use strict';

  /** Rule 1: the fixed fields in order with their width in bits and their group (legend colour). */
  var FIELDS = [
    { key: 'version', bits: 4, group: 'format' },
    { key: 'ihl', bits: 4, group: 'format' },
    { key: 'tos', bits: 8, group: 'format' },
    { key: 'totalLength', bits: 16, group: 'format' },
    { key: 'id', bits: 16, group: 'frag' },
    { key: 'flags', bits: 3, group: 'frag' },
    { key: 'fragOffset', bits: 13, group: 'frag' },
    { key: 'ttl', bits: 8, group: 'life' },
    { key: 'protocol', bits: 8, group: 'format' },
    { key: 'checksum', bits: 16, group: 'life' },
    { key: 'src', bits: 32, group: 'addr' },
    { key: 'dst', bits: 32, group: 'addr' }
  ];
  var FIELD_KEYS = FIELDS.map(function (f) { return f.key; }).concat(['options']);
  var MIN_IHL = 5, MAX_IHL = 15;              // rule 2: 4 bits, at least the 20-octet fixed part
  var MAX_TOTAL = 0xffff;                     // rule 3: 16 bits
  var PROTOCOLS = { 1: 'ICMP', 6: 'TCP', 17: 'UDP' };   // rule 4
  var NOP = 1;                                // option type 1, No Operation (RFC 791 §3.1): the options filler
  var MTU = { seg1: 1500, seg2: 500 };        // rule 7: segment 2 of the fragment view
  var NAT_PUBLIC = '203.0.113.5';             // rule 8: RFC 5737 documentation address
  var VIEWS = ['role', 'hop', 'fragment', 'nat'];
  var SITUATIONS = ['hop', 'fragment', 'nat']; // rule 10: the order on the info card

  /** Which state field each packet key belongs to (rule 10: DSCP + ECN one field, DF + MF one field). */
  var KEY_FIELD = { version: 'version', ihl: 'ihl', dscp: 'tos', ecn: 'tos', totalLength: 'totalLength', id: 'id',
    df: 'flags', mf: 'flags', fragOffset: 'fragOffset', ttl: 'ttl', protocol: 'protocol', checksum: 'checksum',
    src: 'src', dst: 'dst' };

  /** Rows of the strip: fields grouped into 32-bit rows (rule 1). */
  function rows() {
    var out = [], cur = [], bits = 0;
    FIELDS.forEach(function (f) {
      cur.push(f.key); bits += f.bits;
      if (bits === 32) { out.push(cur); cur = []; bits = 0; }
    });
    return out;
  }

  // ── bytes and the checksum ──

  function ipBytes(ip) { return ip.split('.').map(Number); }
  function hex4(n) { return '0x' + ('0000' + n.toString(16)).slice(-4); }

  /** One's complement sum of 16-bit words, folded (RFC 1071). // from sims/hop-rewrite/sim.js @ 266f5d7 */
  function sum16(bytes) {
    var s = 0;
    for (var i = 0; i < bytes.length; i += 2) s += (bytes[i] << 8) + (bytes[i + 1] || 0);
    while (s > 0xffff) s = (s & 0xffff) + Math.floor(s / 0x10000);
    return s;
  }
  /** // from sims/hop-rewrite/sim.js @ 266f5d7 */
  function checksumOf(bytes) { return (~sum16(bytes)) & 0xffff; }

  /** The header's octets (IHL × 4), options as NOP; the checksum field from pk.checksum, or 0 when zero is set. */
  function headerBytes(pk, zero) {
    var c = zero ? 0 : pk.checksum;
    var flags = (pk.df ? 0x4000 : 0) | (pk.mf ? 0x2000 : 0) | pk.fragOffset;
    var b = [(pk.version << 4) | pk.ihl, (pk.dscp << 2) | pk.ecn, pk.totalLength >> 8, pk.totalLength & 0xff,
      pk.id >> 8, pk.id & 0xff, flags >> 8, flags & 0xff, pk.ttl, pk.protocol, c >> 8, c & 0xff]
      .concat(ipBytes(pk.src), ipBytes(pk.dst));
    for (var i = 20; i < pk.ihl * 4; i++) b.push(NOP);
    return b;
  }
  /** Rule 9: the checksum over the header with the checksum field at 0. */
  function headerChecksum(pk) { return checksumOf(headerBytes(pk, true)); }
  /** A copy of pk with its checksum computed. */
  function seal(pk) { var o = copy(pk); o.checksum = headerChecksum(o); return o; }
  /** A received header is intact when the sum over all of it, checksum included, folds to 0xffff. */
  function verifies(pk) { return sum16(headerBytes(pk, false)) === 0xffff; }

  function copy(o) { return JSON.parse(JSON.stringify(o)); }

  /** Rule 2: what IHL and total length say. */
  function headerInfo(ihl, total) {
    return { valid: ihl >= MIN_IHL && ihl <= MAX_IHL, headerBytes: ihl * 4, optionBytes: Math.max(0, ihl - MIN_IHL) * 4,
      dataBytes: total - ihl * 4 };
  }

  // ── the packets (SPEC.md "The packets") ──

  function packet(over) {
    return seal(Object.assign({ version: 4, ihl: 5, dscp: 0, ecn: 0, totalLength: 0, id: 0, df: true, mf: false,
      fragOffset: 0, ttl: 64, protocol: 6, checksum: 0, src: '192.168.1.10', dst: '192.168.2.50' }, over));
  }
  function packetFor(view, p) {
    if (view === 'hop') return packet({ totalLength: 84, id: 0x1c46, protocol: 1, dst: '192.168.2.20' });
    if (view === 'fragment') return packet({ totalLength: 1400, id: 0x2a11, protocol: 17, df: !!p.df });
    if (view === 'nat') return packet({ totalLength: 84, id: 0x1c47, protocol: 1, dst: '8.8.8.8' });
    return packet({ totalLength: 1240, id: 0x2a10, protocol: 6, ihl: p.ihl == null ? MIN_IHL : p.ihl });
  }

  // ── what R1 does ──

  /** Rule 6: one hop. TTL − 1, checksum recomputed, nothing else. */
  function hop(pk) {
    var o = copy(pk);
    o.ttl = pk.ttl - 1;
    return seal(o);
  }

  /** Rule 7: fragments of pk for an MTU, or { dropped } when DF forbids it. A packet that fits is one hop. */
  function fragment(pk, mtu) {
    if (pk.totalLength <= mtu) return { dropped: false, fragments: [hop(pk)] };
    if (pk.df) return { dropped: true, fragments: [] };
    var hlen = pk.ihl * 4, data = pk.totalLength - hlen;
    var per = Math.floor((mtu - hlen) / 8) * 8;
    var out = [];
    for (var at = 0; at < data; at += per) {
      var n = Math.min(per, data - at), last = at + n >= data;
      var f = copy(pk);
      f.totalLength = hlen + n;
      f.mf = last ? pk.mf : true;
      f.fragOffset = pk.fragOffset + at / 8;
      f.ttl = pk.ttl - 1;
      out.push(seal(f));
    }
    return { dropped: false, fragments: out };
  }

  /** Rule 8: outbound through NAT, the source becomes the public address; plus the hop. */
  function nat(pk, pub) {
    var o = hop(pk);
    o.src = pub;
    return seal(o);
  }

  /** What R1 sends for a view: { after: [packets], dropped }. */
  function transit(view, pk) {
    if (view === 'hop') return { after: [hop(pk)], dropped: false };
    if (view === 'nat') return { after: [nat(pk, NAT_PUBLIC)], dropped: false };
    if (view === 'fragment') { var r = fragment(pk, MTU.seg2); return { after: r.fragments, dropped: r.dropped }; }
    return { after: [], dropped: false };
  }

  /** Rule 10: the fields (in strip order) whose value differs between before and any packet in after. */
  function changedFields(before, after) {
    var hit = {};
    after.forEach(function (a) {
      Object.keys(KEY_FIELD).forEach(function (k) { if (a[k] !== before[k]) hit[KEY_FIELD[k]] = true; });
    });
    return FIELD_KEYS.filter(function (k) { return hit[k]; });
  }

  /** Rule 10: every situation (hop, fragment, nat) in which a field changes, each from its own packet with DF off. */
  function situationsOf(field) {
    return SITUATIONS.filter(function (v) {
      var pk = packetFor(v, { df: false });
      return changedFields(pk, transit(v, pk).after).indexOf(field) >= 0;
    });
  }

  var defaults = { field: 'ttl', view: 'role', df: false, ihl: 5 };

  var presets = [
    { id: 'read', params: { field: 'ihl', view: 'role', df: false, ihl: 5 } },
    { id: 'hop', params: { field: 'ttl', view: 'hop', df: false, ihl: 5 } },
    { id: 'fragment', params: { field: 'fragOffset', view: 'fragment', df: false, ihl: 5 } },
    { id: 'nat', params: { field: 'src', view: 'nat', df: false, ihl: 5 } },
    { id: 'df', params: { field: 'flags', view: 'fragment', df: true, ihl: 5 } }
  ];

  /** The derived state for one set of params (SPEC.md). */
  function derive(p) {
    var view = VIEWS.indexOf(p.view) >= 0 ? p.view : 'role';
    var selected = FIELD_KEYS.indexOf(p.field) >= 0 ? p.field : defaults.field;
    var pk = packetFor(view, p);
    var t = transit(view, pk);
    return {
      packet: pk,
      view: view,
      selected: selected,
      changed: changedFields(pk, t.after),
      after: t.after,
      dropped: t.dropped,
      header: headerInfo(pk.ihl, pk.totalLength),
      situations: situationsOf(selected),
      protocolName: PROTOCOLS[pk.protocol] || null
    };
  }

  var logic = {
    defaults: defaults,
    presets: presets,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, rows: rows, headerBytes: headerBytes, headerChecksum: headerChecksum, seal: seal,
    verifies: verifies, headerInfo: headerInfo, packetFor: packetFor, hop: hop, fragment: fragment, nat: nat,
    transit: transit, changedFields: changedFields, situationsOf: situationsOf, sum16: sum16, hex4: hex4,
    FIELDS: FIELDS, FIELD_KEYS: FIELD_KEYS, MIN_IHL: MIN_IHL, MAX_IHL: MAX_IHL, MAX_TOTAL: MAX_TOTAL,
    PROTOCOLS: PROTOCOLS, MTU: MTU, NAT_PUBLIC: NAT_PUBLIC, VIEWS: VIEWS, SITUATIONS: SITUATIONS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
