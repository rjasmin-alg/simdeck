/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dns-records: a small zone (lab.example, from UL ch19) built by four toggles, checked as a zone loader
   would check it, and one query answered by its authoritative server. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The functions over zones (zoneCheck, resolve,
   abs) take any zone, so the tests can feed zones the toggles cannot build (loops, bad data, other TTLs).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var ORIGIN = 'lab.example.';
  var TTL = 3600;              // $TTL 3600 (UL ch19 zone file)
  var MAX_CNAMES = 8;          // longest CNAME chain the server follows (SPEC rule 2)
  var TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA'];
  /** The names the query box offers: every owner the toggles can create, a name under the delegation, and a name
      that never exists (UL ch19 asks for nepostojece.lab.example). Without the trailing dot, as the URL shows them. */
  var QNAMES = ['lab.example', 'ns1.lab.example', 'posluzitelj.lab.example', 'klijent.lab.example', 'www.lab.example',
    'mail.lab.example', 'mail2.lab.example', 'sub.lab.example', 'ns.sub.lab.example', 'www.sub.lab.example',
    'nepostojece.lab.example'];

  function row(id, owner, type, data, src) { return { id: id, owner: owner, ttl: TTL, type: type, data: data, src: src }; }

  /** The zone as written in the zone file (owners and names relative unless they end with a dot), in file order.
      Each row has a stable id, so the page can mark rows of the shown zone from an answer of the last valid zone. */
  function zoneOf(p) {
    var z = [
      row('soa', '@', 'SOA', { mname: 'ns1.lab.example.', rname: 'admin.lab.example.', serial: 2026090301, refresh: 3600, retry: 900, expire: 604800, minimum: 900 }, 'base'),
      row('ns', '@', 'NS', 'ns1.lab.example.', 'base'),
      row('txt', '@', 'TXT', ['v=spf1 mx -all'], 'base')
    ];
    if (p.mx) {
      z.push(row('mx10', '@', 'MX', { pref: 10, host: 'mail' }, 'mx'));
      z.push(row('mx20', '@', 'MX', { pref: 20, host: 'mail2' }, 'mx'));
    }
    if (p.apexCname) z.push(row('apexCname', '@', 'CNAME', 'posluzitelj', 'apexCname'));
    z.push(row('ns1', 'ns1', 'A', '192.168.180.1', 'base'));
    z.push(row('posluzitelj', 'posluzitelj', 'A', '192.168.180.1', 'base'));
    z.push(row('klijent', 'klijent', 'A', '192.168.180.100', 'base'));
    z.push(row('klijent6', 'klijent', 'AAAA', '2001:db8:180::100', 'base'));
    if (p.addWww) z.push(row('www', 'www', 'CNAME', 'posluzitelj', 'addWww'));
    if (p.mx) {
      z.push(row('mail', 'mail', 'A', '192.168.180.25', 'mx'));
      z.push(row('mail2', 'mail2', 'A', '192.168.180.26', 'mx'));
    }
    if (p.delegate) {
      z.push(row('subNs', 'sub', 'NS', 'ns.sub', 'delegate'));
      z.push(row('glue', 'ns.sub', 'A', '192.168.180.53', 'delegate'));
    }
    return z;
  }

  // ── names (rule 8) ──

  /** An owner or a name in data, made absolute: '@' is the origin, a name ending with a dot is absolute, any other is
      relative to the origin (so 'posluzitelj.lab.example' without the dot becomes 'posluzitelj.lab.example.lab.example.'). */
  function abs(name, origin) {
    origin = origin || ORIGIN;
    var n = String(name).toLowerCase();
    if (n === '@') return origin;
    if (n.charAt(n.length - 1) === '.') return n;
    return n + '.' + origin;
  }
  /** A query name is always absolute: the trailing dot is added, never the origin. */
  function fqdn(name) { var n = String(name).toLowerCase(); return n.charAt(n.length - 1) === '.' ? n : n + '.'; }
  function under(name, top) { return name === top || name.slice(-(top.length + 1)) === '.' + top; }

  /** A row with every name absolute: owner, and the names inside NS, CNAME, MX and SOA data. */
  function absRow(r, origin) {
    var d = r.data;
    if (r.type === 'NS' || r.type === 'CNAME') d = abs(d, origin);
    else if (r.type === 'MX') d = { pref: d.pref, host: abs(d.host, origin) };
    else if (r.type === 'SOA') d = Object.assign({}, d, { mname: abs(d.mname, origin), rname: abs(d.rname, origin) });
    return { id: r.id, owner: abs(r.owner, origin), ttl: r.ttl, type: r.type, data: d };
  }

  // ── data formats (rule 7) ──

  function isIPv4(s) {
    if (typeof s !== 'string') return false;
    var parts = s.split('.');
    return parts.length === 4 && parts.every(function (x) { return /^(0|[1-9]\d{0,2})$/.test(x) && Number(x) <= 255; });
  }
  function isIPv6(s) {
    if (typeof s !== 'string') return false;
    var v4 = /:(\d+\.\d+\.\d+\.\d+)$/.exec(s);        // x:x:x:x:x:x:d.d.d.d counts the address as two groups
    if (v4) {
      if (!isIPv4(v4[1])) return false;
      s = s.slice(0, v4.index + 1) + '0:0';
    }
    if (!/^[0-9a-f:]+$/i.test(s)) return false;
    var halves = s.split('::');
    if (halves.length > 2) return false;
    var groups = function (h) { return h === '' ? [] : h.split(':'); };
    var head = groups(halves[0]), tail = halves.length === 2 ? groups(halves[1]) : [];
    var all = head.concat(tail);
    if (!all.every(function (g) { return /^[0-9a-f]{1,4}$/i.test(g); })) return false;
    return halves.length === 2 ? all.length <= 7 : all.length === 8;
  }
  /** Octets of a string in UTF-8: a character-string is at most 255 octets, not 255 characters. */
  function octets(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c < 0xdc00) { n += 4; i++; }   // a surrogate pair is one 4-octet character
      else n += 3;
    }
    return n;
  }
  function isTxt(d) {
    return Array.isArray(d) && d.length > 0 && d.every(function (s) { return typeof s === 'string' && octets(s) <= 255; });
  }
  function dataOk(r) {
    if (r.type === 'A') return isIPv4(r.data);
    if (r.type === 'AAAA') return isIPv6(r.data);
    if (r.type === 'TXT') return isTxt(r.data);
    if (r.type === 'MX') return r.data && Number.isInteger(r.data.pref) && r.data.pref >= 0 && r.data.pref <= 65535 && typeof r.data.host === 'string';
    return true;
  }

  // ── zone check (rules 1, 3, 4, 7) ──

  /** What a zone loader says about the zone, in a fixed order (by rule, then by first row). Errors stop the zone from
      loading; warnings do not. [{ level: 'ok' | 'warn' | 'error', code, owner, types, rows }]; one ok item when clean. */
  function zoneCheck(zone, origin) {
    origin = origin || ORIGIN;
    var rs = zone.map(function (r) { return absRow(r, origin); });
    var out = [];
    // rule 7: one IPv4 address in A, one IPv6 address in AAAA, one or more strings in TXT
    zone.forEach(function (r) {
      if (!dataOk(r)) out.push({ level: 'error', code: 'bad-data', owner: abs(r.owner, origin), types: [r.type], rows: [r.id] });
    });
    // rule 3: the apex holds SOA and NS
    ['SOA', 'NS'].forEach(function (type) {
      if (!rs.some(function (r) { return r.owner === origin && r.type === type; })) out.push({ level: 'error', code: 'apex-no-' + type.toLowerCase(), owner: origin, types: [type], rows: [] });
    });
    // rule 3: a name with a CNAME holds nothing else, and one CNAME only
    var owners = [];
    rs.forEach(function (r) { if (owners.indexOf(r.owner) < 0) owners.push(r.owner); });
    owners.forEach(function (o) {
      var at = rs.filter(function (r) { return r.owner === o; });
      var cn = at.filter(function (r) { return r.type === 'CNAME'; });
      if (!cn.length) return;
      var other = at.filter(function (r) { return r.type !== 'CNAME'; });
      var types = [];
      other.forEach(function (r) { if (types.indexOf(r.type) < 0) types.push(r.type); });
      if (other.length) out.push({ level: 'error', code: 'cname-and-other', owner: o, types: types, apex: o === origin, rows: at.map(function (r) { return r.id; }) });
      else if (cn.length > 1) out.push({ level: 'error', code: 'cname-multiple', owner: o, types: ['CNAME'], rows: cn.map(function (r) { return r.id; }) });
    });
    // rule 1: every RR of an RRset has the same TTL (a warning; the answer then uses the lowest, RFC 2181 §5.2)
    var sets = {};
    rs.forEach(function (r) { var k = r.owner + ' ' + r.type; (sets[k] = sets[k] || []).push(r); });
    Object.keys(sets).forEach(function (k) {
      var s = sets[k];
      if (s.some(function (r) { return r.ttl !== s[0].ttl; })) out.push({ level: 'warn', code: 'ttl-differs', owner: s[0].owner, types: [s[0].type], rows: s.map(function (r) { return r.id; }) });
    });
    // rule 4: an MX exchange must not be an alias
    rs.forEach(function (r) {
      if (r.type !== 'MX') return;
      var alias = rs.filter(function (x) { return x.owner === r.data.host && x.type === 'CNAME'; });
      if (alias.length) out.push({ level: 'warn', code: 'mx-cname', owner: r.owner, host: r.data.host, types: ['MX'], rows: [r.id].concat(alias.map(function (x) { return x.id; })) });
    });
    return out.length ? out : [{ level: 'ok', code: 'ok', owner: origin, types: [], rows: [] }];
  }
  function hasError(check) { return check.some(function (c) { return c.level === 'error'; }); }

  // ── one query (rules 1, 2, 4, 5, 6) ──

  /** An RRset as the answer carries it: every RR, the lowest TTL of the set on each (RFC 2181 §5.2). */
  function rrset(rs, owner, type) {
    var set = rs.filter(function (r) { return r.owner === owner && r.type === type; });
    var ttl = Math.min.apply(null, set.map(function (r) { return r.ttl; }));
    return set.map(function (r) { return { id: r.id, owner: r.owner, ttl: ttl, type: r.type, data: r.data }; });
  }
  /** The closest delegation at or above name: an owner below the apex with an NS RRset. */
  function cutFor(rs, name, origin) {
    var best = null;
    rs.forEach(function (r) {
      if (r.type !== 'NS' || r.owner === origin || !under(name, r.owner)) return;
      if (!best || r.owner.length > best.length) best = r.owner;
    });
    return best;
  }
  /** A and AAAA records of a host in this zone (glue and the follow-up for MX, NS). */
  function addressesOf(rs, host) {
    return rrset(rs, host, 'A').concat(rrset(rs, host, 'AAAA'));
  }

  /**
   * The authoritative server's answer for (qname, qtype) from zone. Returns
   *   { rcode: 'NOERROR' | 'NXDOMAIN' | 'SERVFAIL', kind, aa, answer: [rr], authority: [rr], additional: [rr], chain: [...] }
   * kind: 'answer' | 'nodata' | 'nxdomain' | 'referral' | 'loop' | 'too-long' | 'outside'.
   * chain lists the follow-ups in order: { kind: 'cname', from, to }, { kind: 'mx', pref, host, addrs: [data], alias },
   * { kind: 'referral', cut, ns: [{ host, addrs }] }, { kind: 'outside', name }.
   */
  function resolve(zone, qname, qtype, origin) {
    origin = origin || ORIGIN;
    var rs = zone.map(function (r) { return absRow(r, origin); });
    var res = { rcode: 'NOERROR', kind: 'answer', aa: true, answer: [], authority: [], additional: [], chain: [] };
    // a negative answer carries the SOA with TTL min(SOA TTL, MINIMUM): how long the "no" may be cached (RFC 2308 §3)
    var soa = function () {
      return rrset(rs, origin, 'SOA').map(function (r) { return Object.assign({}, r, { ttl: Math.min(r.ttl, r.data.minimum) }); });
    };
    var name = fqdn(qname), seen = [name];
    for (;;) {
      if (!under(name, origin)) { res.kind = 'outside'; res.chain.push({ kind: 'outside', name: name }); return res; }
      var cut = cutFor(rs, name, origin);
      if (cut) {
        // rule 6: below a delegation the zone is not authoritative; it refers the resolver to the child's servers
        var ns = rrset(rs, cut, 'NS');
        res.kind = 'referral';
        res.aa = res.answer.length > 0;   // aa belongs to the query name: kept only when an alias here led to the cut
        res.authority = ns;
        var step = { kind: 'referral', cut: cut, ns: [] };
        ns.forEach(function (r) {
          var glue = addressesOf(rs, r.data);
          res.additional = res.additional.concat(glue);
          step.ns.push({ host: r.data, addrs: glue.map(function (g) { return g.data; }) });
        });
        res.chain.push(step);
        return res;
      }
      var exists = rs.some(function (r) { return under(r.owner, name); });
      if (!exists) { res.rcode = 'NXDOMAIN'; res.kind = 'nxdomain'; res.authority = soa(); return res; }   // rule 5
      var hit = rrset(rs, name, qtype);
      if (hit.length) {                                                                                     // rule 1
        res.answer = res.answer.concat(hit);
        if (qtype === 'MX') {                                                                               // rule 4
          hit.map(function (r, i) { return { r: r, i: i }; })
            .sort(function (a, b) { return a.r.data.pref - b.r.data.pref || a.i - b.i; })
            .forEach(function (x) {
              var host = x.r.data.host;
              var addrs = addressesOf(rs, host);
              res.additional = res.additional.concat(addrs);
              res.chain.push({ kind: 'mx', pref: x.r.data.pref, host: host, addrs: addrs.map(function (a) { return a.data; }),
                alias: rs.some(function (r) { return r.owner === host && r.type === 'CNAME'; }) });
            });
        } else if (qtype === 'NS') {
          hit.forEach(function (r) { res.additional = res.additional.concat(addressesOf(rs, r.data)); });
        }
        return res;
      }
      var cn = rrset(rs, name, 'CNAME');
      if (cn.length && qtype !== 'CNAME') {                                                                 // rule 2
        var to = cn[0].data;
        if (res.chain.filter(function (c) { return c.kind === 'cname'; }).length >= MAX_CNAMES) {
          res.rcode = 'SERVFAIL'; res.kind = 'too-long'; return res;
        }
        res.answer.push(cn[0]);
        res.chain.push({ kind: 'cname', from: name, to: to });
        if (seen.indexOf(to) >= 0) { res.rcode = 'SERVFAIL'; res.kind = 'loop'; return res; }
        seen.push(to);
        name = to;
        continue;
      }
      res.kind = 'nodata'; res.authority = soa(); return res;                                               // rule 5
    }
  }

  // ── the explorer ──

  var logic = {
    ORIGIN: ORIGIN,
    TTL: TTL,
    MAX_CNAMES: MAX_CNAMES,
    TYPES: TYPES,
    QNAMES: QNAMES,

    defaults: { qname: 'posluzitelj.lab.example', qtype: 'A', addWww: true, apexCname: false, mx: true, delegate: false },

    /** The six presets of the task and a seventh for the delegation toggle (SPEC §3). */
    presets: [
      { id: 'ul-zone', params: { qname: 'posluzitelj.lab.example', qtype: 'A', addWww: false, mx: false } },
      { id: 'nxdomain', params: { qname: 'nepostojece.lab.example', qtype: 'A', addWww: false, mx: false } },
      { id: 'cname', params: { qname: 'www.lab.example', qtype: 'A' } },
      { id: 'mx', params: { qname: 'lab.example', qtype: 'MX' } },
      { id: 'nodata', params: { qname: 'posluzitelj.lab.example', qtype: 'AAAA' } },
      { id: 'apex-cname', params: { qname: 'lab.example', qtype: 'A', apexCname: true } },
      { id: 'delegation', params: { qname: 'www.sub.lab.example', qtype: 'A', delegate: true } }
    ],

    /** The explorer's whole state from its params: the zone, its check, which zone answers, the query and the answer.
        A zone with an error does not load; the server keeps answering from the last valid zone, which is the same
        zone without the apex CNAME (the only toggle that can break it). */
    initial: function (p) {
      var zone = zoneOf(p);
      var check = zoneCheck(zone);
      var loaded = 'zone', served = zone;
      if (hasError(check)) { loaded = 'last-valid'; served = zoneOf(Object.assign({}, p, { apexCname: false })); }
      var query = { name: fqdn(p.qname), type: p.qtype };
      return { zone: zone, check: check, loaded: loaded, served: served.map(function (r) { return r.id; }), query: query,
        answer: resolve(served, query.name, query.type) };
    },

    zoneOf: zoneOf,
    zoneCheck: zoneCheck,
    hasError: hasError,
    resolve: resolve,
    abs: abs,
    fqdn: fqdn,
    absRow: absRow,
    isIPv4: isIPv4,
    isIPv6: isIPv6,
    octets: octets,

    /** The status the page shows: NODATA is NOERROR with an empty answer and no referral (RFC 2308 §2.2). */
    statusOf: function (a) { return a.kind === 'nodata' ? 'NODATA' : a.rcode; },

    /** Data as the zone file writes it (zone table) or with every name absolute (answer section). */
    dataText: function (r) {
      var d = r.data;
      if (r.type === 'MX') return d.pref + ' ' + d.host;
      if (r.type === 'TXT') return d.map(function (s) { return '"' + s + '"'; }).join(' ');
      if (r.type === 'SOA') return [d.mname, d.rname, d.serial, d.refresh, d.retry, d.expire, d.minimum].join(' ');
      return String(d);
    },

    /** Ids of the rows each answer section uses, for marking the zone table. */
    rowsOf: function (a) {
      var ids = function (list) { return list.map(function (r) { return r.id; }); };
      return { answer: ids(a.answer), authority: ids(a.authority), additional: ids(a.additional) };
    },

    /** RRs of b's section that a's same section did not have (same owner, TTL, type and data), for the page's
        "changed" mark. section: 'answer' (default), 'authority' or 'additional'. */
    newRRs: function (a, b, section) {
      section = section || 'answer';
      var key = function (r) { return r.owner + ' ' + r.ttl + ' ' + r.type + ' ' + JSON.stringify(r.data); };
      var had = (a ? a[section] : []).map(key);
      return b[section].map(key).map(function (k, i) { return had.indexOf(k) < 0 ? i : -1; }).filter(function (i) { return i >= 0; });
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
