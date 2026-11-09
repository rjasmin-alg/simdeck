/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the header poster: the Ethernet frame (an octet strip) and the IPv4, IPv6, TCP and UDP headers (32-bit
   rows), their fields with sizes and positions, example values per preset, the links between two compared headers,
   and the nesting Ethernet ⊃ IP ⊃ TCP/UDP ⊃ data with its octet counts. A reference page: no steps; the state is
   derived from the params (compare, example, sel). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. No strings: words live in strings.js.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── the headers (rules 1–5), fields in wire order ──

  /** kind 'octets': sizes in octets (the Ethernet strip); kind 'bits': sizes in bits, laid out in 32-bit rows.
      counted: false for the preamble and SFD (not part of the frame's length). variable: a part whose length
      varies (data 46…1500, options 0…40): min/max in octets. rfc: the section that defines the header. */
  var HEADERS = [
    { id: 'eth', kind: 'octets', rfc: 'IEEE 802.3 §3.1.1', fields: [
      { id: 'preamble', octets: 7, counted: false },
      { id: 'sfd', octets: 1, counted: false },
      { id: 'dst', octets: 6 },
      { id: 'src', octets: 6 },
      { id: 'type', octets: 2 },
      { id: 'data', octets: 46, variable: { min: 46, max: 1500 } },
      { id: 'fcs', octets: 4 }
    ] },
    { id: 'ipv4', kind: 'bits', rfc: 'RFC 791 §3.1', fields: [
      { id: 'version', bits: 4 }, { id: 'ihl', bits: 4 }, { id: 'tos', bits: 8 }, { id: 'totalLength', bits: 16 },
      { id: 'id', bits: 16 }, { id: 'flags', bits: 3 }, { id: 'fragOffset', bits: 13 },
      { id: 'ttl', bits: 8 }, { id: 'protocol', bits: 8 }, { id: 'checksum', bits: 16 },
      { id: 'src', bits: 32 },
      { id: 'dst', bits: 32 },
      { id: 'options', bits: 32, variable: { min: 0, max: 40 } }
    ] },
    { id: 'ipv6', kind: 'bits', rfc: 'RFC 8200 §3', fields: [
      { id: 'version', bits: 4 }, { id: 'trafficClass', bits: 8 }, { id: 'flowLabel', bits: 20 },
      { id: 'payloadLength', bits: 16 }, { id: 'nextHeader', bits: 8 }, { id: 'hopLimit', bits: 8 },
      { id: 'src', bits: 128 },
      { id: 'dst', bits: 128 }
    ] },
    { id: 'tcp', kind: 'bits', rfc: 'RFC 9293 §3.1', fields: [
      { id: 'srcPort', bits: 16 }, { id: 'dstPort', bits: 16 },
      { id: 'seq', bits: 32 },
      { id: 'ack', bits: 32 },
      { id: 'offset', bits: 4 }, { id: 'reserved', bits: 4 }, { id: 'flags', bits: 8 }, { id: 'window', bits: 16 },
      { id: 'checksum', bits: 16 }, { id: 'urgent', bits: 16 },
      { id: 'options', bits: 32, variable: { min: 0, max: 40 } }
    ] },
    { id: 'udp', kind: 'bits', rfc: 'RFC 768', fields: [
      { id: 'srcPort', bits: 16 }, { id: 'dstPort', bits: 16 },
      { id: 'length', bits: 16 }, { id: 'checksum', bits: 16 }
    ] }
  ];
  var HEADER_IDS = HEADERS.map(function (h) { return h.id; });
  var BY_ID = Object.create(null);
  HEADERS.forEach(function (h) { BY_ID[h.id] = h; });

  var ROW = 32;              // bits per row (one row = 4 octets)
  var NARROW_BITS = 4;       // a field of this many bits or fewer gets a numbered label
  var NARROW_OCTETS = 1;     // the same in the Ethernet strip
  var ETH_HEADER = 14, FCS = 4, MIN_DATA = 46, MAX_DATA = 1500;
  var MIN_FRAME = ETH_HEADER + MIN_DATA + FCS, MAX_FRAME = ETH_HEADER + MAX_DATA + FCS;   // 64, 1518

  /** An own key of a table, so 'constructor' or '__proto__' from a URL is no key. */
  function own(table, key) { return typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key); }

  function fieldOf(headerId, fieldId) {
    var h = own(BY_ID, headerId) ? BY_ID[headerId] : null;
    if (!h) return null;
    for (var i = 0; i < h.fields.length; i++) if (h.fields[i].id === fieldId) return h.fields[i];
    return null;
  }

  // ── layout: rows, offsets and numbered labels ──

  /** Positions of a header's fields. bits: row, bit (0–31), span (rows; a 128-bit address spans 4). octets: offset
      from the destination address (the preamble and SFD before it are negative). A field may not cross a row
      boundary unless it starts a row and fills whole rows (true of every header here; tested). */
  function layout(h) {
    var out = [], at = 0, num = 0;
    if (h.kind === 'octets') {
      var before = 0;
      h.fields.forEach(function (f) { if (f.counted === false) before += f.octets; });
      at = -before;
      h.fields.forEach(function (f) {
        var narrow = f.octets <= NARROW_OCTETS ? ++num : null;
        out.push({ id: f.id, octets: f.octets, bits: f.octets * 8, offset: at, narrow: narrow });
        at += f.octets;
      });
      return out;
    }
    h.fields.forEach(function (f) {
      var row = Math.floor(at / ROW), bit = at % ROW, span = 1;
      if (f.bits > ROW) {
        if (bit !== 0 || f.bits % ROW !== 0) throw new Error(h.id + '.' + f.id + ' crosses a row');
        span = f.bits / ROW;
      } else if (bit + f.bits > ROW) throw new Error(h.id + '.' + f.id + ' crosses a row');
      var narrow = f.bits <= NARROW_BITS ? ++num : null;
      out.push({ id: f.id, bits: f.bits, row: row, bit: bit, span: span, offset: at, narrow: narrow });
      at += f.bits;
    });
    return out;
  }
  var LAYOUT = Object.create(null);
  HEADERS.forEach(function (h) { LAYOUT[h.id] = layout(h); });

  /** Rows a 32-bit header draws (options included as one row). */
  function rowsOf(h) {
    var l = LAYOUT[h.id], last = l[l.length - 1];
    return last.row + last.span;
  }

  /** Fixed size and the most a header can be, in octets (SPEC.md "Sizes per header"). Ethernet: header + FCS. */
  function sizeOf(h) {
    var fixed = 0, extra = 0;
    h.fields.forEach(function (f) {
      if (h.kind === 'octets') {
        if (f.counted === false || f.variable) return;
        fixed += f.octets;
      } else if (f.variable) extra += f.variable.max;
      else fixed += f.bits / 8;
    });
    return { minOctets: fixed, maxOctets: fixed + extra };
  }

  // ── rule 1: the frame ──

  /** Ethernet data of an IP packet: padding up to 46; the frame 14 + data + padding + 4. Packets over 1500 do not
      fit one frame (null). */
  function frameOf(packet) {
    if (packet > MAX_DATA || packet < 0) return null;
    var pad = Math.max(0, MIN_DATA - packet);
    return { data: packet, padding: pad, frame: ETH_HEADER + packet + pad + FCS };
  }

  // ── rules 2 and 4: lengths counted in 32-bit words ──

  /** IHL or Data Offset (32-bit words) → header octets; null outside 5…15. */
  function wordsToOctets(words) { return words >= 5 && words <= 15 && Math.floor(words) === words ? words * 4 : null; }
  /** IPv4: the data octets of a packet with this IHL and Total Length. */
  function ipv4Data(ihl, total) { var hl = wordsToOctets(ihl); return hl === null || total < hl ? null : total - hl; }

  // ── rule 6: network byte order ──

  /** A number as n octets, most significant first. */
  function bigEndian(num, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) out.push(Math.floor(num / Math.pow(256, i)) % 256);
    return out;
  }
  function ipv4Bytes(a) { return a.split('.').map(Number); }
  function macBytes(a) { return a.split('-').map(function (x) { return parseInt(x, 16); }); }
  /** IPv6 text (with at most one ::) to 16 octets. */
  function ipv6Bytes(a) {
    var halves = a.split('::');
    var head = halves[0] ? halves[0].split(':') : [];
    var tail = halves.length > 1 && halves[1] ? halves[1].split(':') : [];
    var groups = head.slice();
    if (halves.length > 1) {
      for (var i = head.length + tail.length; i < 8; i++) groups.push('0');
      groups = groups.concat(tail);
    }
    var out = [];
    groups.forEach(function (g) { var n = parseInt(g, 16); out.push(n >> 8, n & 255); });
    return out;
  }
  function hexByte(b) { return ('0' + b.toString(16).toUpperCase()).slice(-2); }

  // ── the IPv4 header checksum (examples) ──

  /** One's complement sum of 16-bit words, folded (RFC 1071). // from sims/ipv4-header/sim.js @ 269e90b */
  function sum16(bytes) {
    var s = 0;
    for (var i = 0; i < bytes.length; i += 2) s += (bytes[i] << 8) + (bytes[i + 1] || 0);
    while (s > 0xffff) s = (s & 0xffff) + Math.floor(s / 0x10000);
    return s;
  }
  /** The IPv4 header checksum of a 20-octet header (checksum field at 0). */
  function ipv4Checksum(pk) {
    var b = [0x45, pk.tos, pk.total >> 8, pk.total & 255, pk.id >> 8, pk.id & 255, (pk.flags << 5), 0,
      pk.ttl, pk.protocol, 0, 0].concat(ipv4Bytes(pk.src), ipv4Bytes(pk.dst));
    return (~sum16(b)) & 0xffff;
  }

  function hex(n, digits) { return '0x' + ('0000000' + n.toString(16).toUpperCase()).slice(-digits); }

  /** TCP control bits, most significant first (RFC 9293 §3.1). */
  var TCP_FLAGS = ['CWR', 'ECE', 'URG', 'ACK', 'PSH', 'RST', 'SYN', 'FIN'];
  function tcpFlagNames(n) { return TCP_FLAGS.filter(function (f, i) { return n & (0x80 >> i); }); }

  // ── compare (SPEC.md "Compare") ──

  var COMPARES = {
    'ipv4-ipv6': { left: 'ipv4', right: 'ipv6', links: [
      ['version', 'version', 'same'], ['tos', 'trafficClass', 'renamed'], ['totalLength', 'payloadLength', 'renamed'],
      ['ttl', 'hopLimit', 'renamed'], ['protocol', 'nextHeader', 'renamed'], ['src', 'src', 'same'], ['dst', 'dst', 'same']
    ] },
    'tcp-udp': { left: 'tcp', right: 'udp', links: [
      ['srcPort', 'srcPort', 'same'], ['dstPort', 'dstPort', 'same'], ['checksum', 'checksum', 'same']
    ] }
  };
  var COMPARE_IDS = ['none'].concat(Object.keys(COMPARES));

  /** The compare mark of a field: { kind: 'same' | 'renamed' | 'left' | 'right', partner: 'hdr.field' | null };
      null when the field's header is not compared. left/right: on that side only. */
  function markOf(compareId, headerId, fieldId) {
    if (!own(COMPARES, compareId)) return null;
    var c = COMPARES[compareId];
    var side = headerId === c.left ? 0 : headerId === c.right ? 1 : -1;
    if (side < 0) return null;
    for (var i = 0; i < c.links.length; i++) {
      if (c.links[i][side] === fieldId) return { kind: c.links[i][2], partner: (side ? c.left : c.right) + '.' + c.links[i][1 - side] };
    }
    return { kind: side ? 'right' : 'left', partner: null };
  }

  // ── examples (SPEC.md "Examples") ──

  var ADDR = { v4src: '192.168.1.10', v4dst: '192.168.2.50', v6src: '2001:db8:1::10', v6dst: '2001:db8:2::50',
    macSrc: '00-00-5E-00-53-0A', macDst: '00-00-5E-00-53-01' };
  var TRANSPORT = { tcp: { protocol: 6 }, udp: { protocol: 17 } };
  var IP = { ipv4: { type: 0x0800, header: 20 }, ipv6: { type: 0x86dd, header: 40 } };

  /** ip: the IP in the frame; alsoIp: a second IP header with values (compare example); offset: TCP Data Offset;
      tcpFlags: control bits; app: application data octets; id: IPv4 Identification; focus: the field the preset
      selects. */
  var EXAMPLES = {
    'book-ipv4': { ip: 'ipv4', transport: 'tcp', offset: 5, tcpFlags: 0x18, app: 1200, id: 0x2a10, focus: 'ipv4.ihl' },
    'book-tcp-offset': { ip: 'ipv4', transport: 'tcp', offset: 6, tcpFlags: 0x02, app: 0, id: 0x2a11, focus: 'tcp.offset' },
    'min-frame': { ip: 'ipv4', transport: 'tcp', offset: 5, tcpFlags: 0x10, app: 0, id: 0x2a12, focus: 'eth.data' },
    'max-frame': { ip: 'ipv4', transport: 'udp', app: 1472, id: 0x2a13, focus: 'eth.data' },
    'ipv4-vs-ipv6': { ip: 'ipv4', alsoIp: 'ipv6', transport: 'tcp', offset: 5, tcpFlags: 0x18, app: 1200, id: 0x2a14,
      focus: 'ipv4.ttl', compare: 'ipv4-ipv6' },
    'overhead': { ip: 'ipv4', transport: 'tcp', offset: 5, tcpFlags: 0x18, app: 1460, id: 0x2a15, focus: null }
  };
  var EXAMPLE_IDS = ['none'].concat(Object.keys(EXAMPLES));

  function transportOctets(ex) { return ex.transport === 'tcp' ? ex.offset * 4 : 8; }

  /** A value: text (protocol data, shown as is); num (for the octets on the wire) or addr ('ipv4', 'ipv6', 'mac');
      note: a strings.js key suffix that says what the value means, or null. */
  function v(text, num, note) { return { text: String(text), num: typeof num === 'number' ? num : null, addr: null, note: note || null }; }
  function a(text, kind) { return { text: text, num: null, addr: kind, note: null }; }

  /** Example values of every field of every header in use: { 'hdr.field': value }. */
  function valuesOf(ex) {
    var out = {};
    var seg = transportOctets(ex) + ex.app;
    var ips = [ex.ip].concat(ex.alsoIp ? [ex.alsoIp] : []);
    var pk4 = ex.ip === 'ipv4' || ex.alsoIp === 'ipv4' ? { tos: 0, total: 20 + seg, id: ex.id, flags: 2, ttl: 64,
      protocol: TRANSPORT[ex.transport].protocol, src: ADDR.v4src, dst: ADDR.v4dst } : null;
    var packet = IP[ex.ip].header + seg;
    var fr = frameOf(packet);
    function put(h, f, val) { out[h + '.' + f] = val; }

    put('eth', 'preamble', v('10101010 ×7', null));
    put('eth', 'sfd', v('10101011', null));
    put('eth', 'dst', a(ADDR.macDst, 'mac'));
    put('eth', 'src', a(ADDR.macSrc, 'mac'));
    put('eth', 'type', v(hex(IP[ex.ip].type, 4), IP[ex.ip].type, ex.ip));
    put('eth', 'data', v(fr.padding ? packet + ' + ' + fr.padding : packet, null, fr.padding ? 'padded' : null));
    put('eth', 'fcs', v('…', null, 'fcs'));

    if (pk4) {
      put('ipv4', 'version', v(4, 4));
      put('ipv4', 'ihl', v(5, 5, 'words'));
      put('ipv4', 'tos', v(hex(0, 2), 0));
      put('ipv4', 'totalLength', v(pk4.total, pk4.total));
      put('ipv4', 'id', v(hex(pk4.id, 4), pk4.id));
      put('ipv4', 'flags', v('010', 2, 'df'));
      put('ipv4', 'fragOffset', v(0, 0));
      put('ipv4', 'ttl', v(64, 64));
      put('ipv4', 'protocol', v(pk4.protocol, pk4.protocol, ex.transport));
      put('ipv4', 'checksum', v(hex(ipv4Checksum(pk4), 4), ipv4Checksum(pk4)));
      put('ipv4', 'src', a(pk4.src, 'ipv4'));
      put('ipv4', 'dst', a(pk4.dst, 'ipv4'));
      put('ipv4', 'options', v(0, null, 'octets'));
    }
    if (ips.indexOf('ipv6') >= 0) {
      put('ipv6', 'version', v(6, 6));
      put('ipv6', 'trafficClass', v(hex(0, 2), 0));
      put('ipv6', 'flowLabel', v(hex(0, 5), 0));
      put('ipv6', 'payloadLength', v(seg, seg));
      put('ipv6', 'nextHeader', v(TRANSPORT[ex.transport].protocol, TRANSPORT[ex.transport].protocol, ex.transport));
      put('ipv6', 'hopLimit', v(64, 64));
      put('ipv6', 'src', a(ADDR.v6src, 'ipv6'));
      put('ipv6', 'dst', a(ADDR.v6dst, 'ipv6'));
    }
    if (ex.transport === 'tcp') {
      var syn = ex.tcpFlags & 0x02;
      put('tcp', 'srcPort', v(49152, 49152));
      put('tcp', 'dstPort', v(80, 80));
      put('tcp', 'seq', v(syn ? 1000 : 1001, syn ? 1000 : 1001));
      put('tcp', 'ack', v(syn ? 0 : 5001, syn ? 0 : 5001));
      put('tcp', 'offset', v(ex.offset, ex.offset, 'words'));
      put('tcp', 'reserved', v(0, 0));
      put('tcp', 'flags', v(tcpFlagNames(ex.tcpFlags).join(' '), ex.tcpFlags));
      put('tcp', 'window', v(64240, 64240));
      put('tcp', 'checksum', v('…', null, 'pseudo'));
      put('tcp', 'urgent', v(0, 0));
      put('tcp', 'options', v((ex.offset - 5) * 4, null, 'octets'));
    } else {
      put('udp', 'srcPort', v(49152, 49152));
      put('udp', 'dstPort', v(50000, 50000));
      put('udp', 'length', v(8 + ex.app, 8 + ex.app));
      put('udp', 'checksum', v('…', null, 'pseudo'));
    }
    return out;
  }

  /** Rule 6: a value's octets in the order they are sent, or null (the field is not whole octets, or has no
      number). */
  function wireOf(headerId, place, val) {
    if (!val) return null;
    var aligned = headerId === 'eth' || (place.bits % 8 === 0 && place.offset % 8 === 0);
    if (!aligned) return null;
    var bytes = val.addr === 'ipv4' ? ipv4Bytes(val.text) : val.addr === 'ipv6' ? ipv6Bytes(val.text) :
      val.addr === 'mac' ? macBytes(val.text) : val.num !== null ? bigEndian(val.num, place.bits / 8) : null;
    return bytes ? bytes.map(hexByte) : null;
  }

  // ── the nesting strip ──

  /** Ethernet ⊃ IP ⊃ transport ⊃ data. With an example: its numbers; without: the stack ip/transport with data as
      a range. */
  function nestingOf(ex, ip, transport) {
    var ipH = IP[ip].header;
    if (ex) {
      var tH = transportOctets(ex), seg = tH + ex.app, packet = ipH + seg, fr = frameOf(packet);
      return { ip: ip, transport: transport, ipHeader: ipH, transportHeader: tH, data: [ex.app, ex.app],
        segment: [seg, seg], packet: [packet, packet], padding: [fr.padding, fr.padding], frame: [fr.frame, fr.frame],
        minFrame: MIN_FRAME, maxFrame: MAX_FRAME };
    }
    var tMin = transport === 'tcp' ? 20 : 8;
    var maxData = MAX_DATA - ipH - tMin;
    var minPacket = ipH + tMin;
    return { ip: ip, transport: transport, ipHeader: ipH, transportHeader: tMin, data: [0, maxData],
      segment: [tMin, tMin + maxData], packet: [minPacket, MAX_DATA], padding: [frameOf(minPacket).padding, 0],
      frame: [frameOf(minPacket).frame, MAX_FRAME], minFrame: MIN_FRAME, maxFrame: MAX_FRAME };
  }

  // ── params ──

  function compareParam(p) { return own(COMPARES, p.compare) ? p.compare : null; }
  function exampleParam(p) { return own(EXAMPLES, p.example) ? p.example : null; }
  /** 'hdr.field' of a field on the poster, else null. */
  function selParam(p) {
    if (typeof p.sel !== 'string') return null;
    var parts = p.sel.split('.');
    return parts.length === 2 && fieldOf(parts[0], parts[1]) ? p.sel : null;
  }

  var logic = {
    HEADERS: HEADERS, HEADER_IDS: HEADER_IDS, LAYOUT: LAYOUT, COMPARES: COMPARES, COMPARE_IDS: COMPARE_IDS,
    EXAMPLES: EXAMPLES, EXAMPLE_IDS: EXAMPLE_IDS, TCP_FLAGS: TCP_FLAGS, ADDR: ADDR,
    MIN_FRAME: MIN_FRAME, MAX_FRAME: MAX_FRAME,

    defaults: { compare: 'none', example: 'none', sel: '' },

    /** A reference page: no steps. */
    steps: 0,

    /** The whole poster as plain data, derived from the params. */
    initial: function (p) {
      var cmpId = compareParam(p), exId = exampleParam(p), sel = selParam(p);
      var ex = exId ? EXAMPLES[exId] : null;
      var cmp = cmpId ? COMPARES[cmpId] : null;
      var values = ex ? valuesOf(ex) : {};
      var selHeader = sel ? sel.split('.')[0] : null;
      var mark = sel ? markOf(cmpId, selHeader, sel.split('.')[1]) : null;
      var partner = mark && mark.partner ? mark.partner : null;
      var inUse = function (id) {
        if (!ex) return true;
        return id === 'eth' || id === ex.ip || id === ex.alsoIp || id === ex.transport;
      };
      var ip = ex ? ex.ip : selHeader === 'ipv6' ? 'ipv6' : 'ipv4';
      var transport = ex ? ex.transport : selHeader === 'udp' ? 'udp' : 'tcp';
      return {
        compare: cmp ? [cmp.left, cmp.right] : null,
        compareId: cmpId,
        example: exId,
        focus: ex ? ex.focus : null,
        selected: sel ? { header: selHeader, field: sel.split('.')[1] } : null,
        partner: partner ? { header: partner.split('.')[0], field: partner.split('.')[1] } : null,
        changed: sel ? [sel].concat(partner ? [partner] : []) : [],
        headers: HEADERS.map(function (h) {
          var size = sizeOf(h), use = inUse(h.id);
          return {
            id: h.id, kind: h.kind, rfc: h.rfc,
            shown: h.id === 'eth' || !cmp || h.id === cmp.left || h.id === cmp.right,
            inUse: use,
            rows: h.kind === 'bits' ? rowsOf(h) : null,
            minOctets: size.minOctets, maxOctets: size.maxOctets,
            fields: LAYOUT[h.id].map(function (pl) {
              var f = fieldOf(h.id, pl.id), key = h.id + '.' + pl.id;
              var val = use && values[key] ? values[key] : null;
              return {
                id: pl.id, key: key, bits: pl.bits, octets: h.kind === 'octets' ? pl.octets : pl.bits / 8,
                row: h.kind === 'bits' ? pl.row : null, bit: h.kind === 'bits' ? pl.bit : null,
                span: h.kind === 'bits' ? pl.span : null, offset: pl.offset, narrow: pl.narrow,
                counted: f.counted !== false, variable: f.variable ? { min: f.variable.min, max: f.variable.max } : null,
                value: val ? { text: val.text, note: val.note } : null,
                wire: wireOf(h.id, pl, val),
                mark: markOf(cmpId, h.id, pl.id),
                selected: key === sel, changed: key === sel || key === partner
              };
            })
          };
        }),
        nesting: nestingOf(ex, ip, transport)
      };
    },

    step: function (s) { return s; },

    layout: layout, sizeOf: sizeOf, frameOf: frameOf, wordsToOctets: wordsToOctets, ipv4Data: ipv4Data,
    bigEndian: bigEndian, ipv6Bytes: ipv6Bytes, ipv4Checksum: ipv4Checksum, tcpFlagNames: tcpFlagNames, markOf: markOf,
    valuesOf: valuesOf, nestingOf: nestingOf, selParam: selParam, fieldOf: fieldOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
