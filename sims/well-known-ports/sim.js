/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the well-known ports poster: the three IANA ranges (RFC 6335 §6) as a bar, and 28 port cards grouped by
   service family, each with its transport, its range, its plain/secure pair and the course chapters that teach it.
   A reference page: no steps; the state is derived from the params (transport, family, range and course filters,
   the preset's view and the selected card). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The three ranges (RFC 6335 §6). */
  var RANGES = [
    { id: 'system', from: 0, to: 1023 },
    { id: 'user', from: 1024, to: 49151 },
    { id: 'dynamic', from: 49152, to: 65535 }
  ];

  /** The service families in poster order. */
  var FAMILIES = ['web', 'remote', 'name', 'mail', 'files', 'directory', 'time', 'db'];
  var TRANSPORTS = ['tcp', 'both', 'udp'];       // also the tie-break order of rule 5
  var COURSES = ['URM', 'UL'];

  /** One card. t: 'tcp' | 'udp' | 'both' (what the protocol runs over); fam: family; svc: the registry's service
      name; ref: the defining document; sec: { of: plain port, via: 'TLS' | 'SSH' } on a secure card; ch: the
      chapters that teach the service, per course; side: 'client' for the one card a client listens on. */
  function card(port, t, name, svc, fam, ref, ch, extra) {
    var c = { port: port, t: t, name: name, svc: svc, fam: fam, ref: ref, ch: ch || {} };
    if (extra) for (var k in extra) c[k] = extra[k];
    return c;
  }

  var CARDS = [
    card(20, 'tcp', 'FTP data', 'ftp-data', 'files', 'RFC 959 §3.2', { URM: [14] }),
    card(21, 'tcp', 'FTP control', 'ftp', 'files', 'RFC 959 §8', { URM: [14] }),
    card(22, 'tcp', 'SSH', 'ssh', 'remote', 'RFC 4253 §4.1', { URM: [13], UL: [15, 18] }, { sec: { of: 23, via: 'SSH' } }),
    card(23, 'tcp', 'Telnet', 'telnet', 'remote', 'RFC 854', null),
    card(25, 'tcp', 'SMTP', 'smtp', 'mail', 'RFC 5321', { URM: [13, 14], UL: [20] }),
    card(53, 'both', 'DNS', 'domain', 'name', 'RFC 1035 §4.2, RFC 7766', { URM: [13, 14], UL: [19] }),
    card(67, 'udp', 'DHCP server', 'bootps', 'name', 'RFC 2131 §4.1', { URM: [14], UL: [18] }),
    card(68, 'udp', 'DHCP client', 'bootpc', 'name', 'RFC 2131 §4.1', { URM: [14], UL: [18] }, { side: 'client' }),
    card(80, 'tcp', 'HTTP', 'http', 'web', 'RFC 9110 §4.2.1', { URM: [13, 14], UL: [21] }),
    card(88, 'both', 'Kerberos', 'kerberos', 'directory', 'RFC 4120 §7.2', null),
    card(110, 'tcp', 'POP3', 'pop3', 'mail', 'RFC 1939 §3', { URM: [14], UL: [20] }),
    card(123, 'udp', 'NTP', 'ntp', 'time', 'RFC 5905', { UL: [18] }),
    card(143, 'tcp', 'IMAP', 'imap', 'mail', 'RFC 9051 §2.1', { URM: [14], UL: [20] }),
    card(161, 'udp', 'SNMP', 'snmp', 'time', 'RFC 3417', null),
    card(162, 'udp', 'SNMP trap', 'snmptrap', 'time', 'RFC 3417', null),
    card(389, 'tcp', 'LDAP', 'ldap', 'directory', 'RFC 4511', null),
    card(443, 'both', 'HTTPS', 'https', 'web', 'RFC 9110 §4.2.2, RFC 9114 §3.1', { URM: [13, 14], UL: [21] }, { sec: { of: 80, via: 'TLS' } }),
    card(445, 'tcp', 'SMB', 'microsoft-ds', 'files', 'registry', { UL: [18] }),
    card(514, 'udp', 'syslog', 'syslog', 'time', 'RFC 5426', { UL: [13, 15, 18] }),
    card(587, 'tcp', 'mail submission', 'submission', 'mail', 'RFC 6409 §3.1', { UL: [20] }),
    card(636, 'tcp', 'LDAPS', 'ldaps', 'directory', 'registry', null, { sec: { of: 389, via: 'TLS' } }),
    card(853, 'tcp', 'DNS over TLS', 'domain-s', 'name', 'RFC 7858', null, { sec: { of: 53, via: 'TLS' } }),
    card(993, 'tcp', 'IMAPS', 'imaps', 'mail', 'RFC 8314 §7.2', { UL: [20] }, { sec: { of: 143, via: 'TLS' } }),
    card(995, 'tcp', 'POP3S', 'pop3s', 'mail', 'RFC 8314 §7.1', null, { sec: { of: 110, via: 'TLS' } }),
    card(3306, 'tcp', 'MySQL protocol', 'mysql', 'db', 'registry', { UL: [22] }),
    card(3389, 'tcp', 'remote desktop', 'ms-wbt-server', 'remote', 'registry', null),
    card(5353, 'udp', 'mDNS', 'mdns', 'name', 'RFC 6762', null),
    card(5432, 'tcp', 'PostgreSQL protocol', 'postgresql', 'db', 'registry', { UL: [22] })
  ];

  var BY_PORT = Object.create(null);
  CARDS.forEach(function (c) { BY_PORT[c.port] = c; });

  /** plain port → secure port, from the secure cards. */
  var SECURE_OF = Object.create(null);
  CARDS.forEach(function (c) { if (c.sec) SECURE_OF[c.sec.of] = c.port; });

  /** An own key of a table, so 'constructor' or '__proto__' in a URL is no key. */
  function own(table, key) { return typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key); }

  // ── rule 1: ranges, and the bar ──

  /** The range of a port number, or null when it is no port number. */
  function rangeOf(p) {
    if (typeof p !== 'number' || Math.floor(p) !== p || p < 0 || p > 65535) return null;
    for (var i = 0; i < RANGES.length; i++) if (p <= RANGES[i].to) return RANGES[i].id;
    return null;
  }

  /** Position on the bar's log axis, 0…1: log2(1 + p) / 16. */
  function logPos(p) { return Math.log2(1 + p) / 16; }
  /** Position on a linear axis, 0…1. */
  function linPos(p) { return p / 65535; }

  /** Each range's span on both axes (the edge before a range sits at the last number of the one before). */
  function bar() {
    return RANGES.map(function (r, i) {
      var a = i === 0 ? 0 : RANGES[i - 1].to, b = r.to;
      return { id: r.id, from: r.from, to: r.to, log: [i === 0 ? 0 : logPos(a), logPos(b)], lin: [i === 0 ? 0 : linPos(a), linPos(b)] };
    });
  }

  // ── rule 2: the client's port ──

  /** The example connection of URM ch13: a browser (client port from the dynamic range) to HTTPS. */
  var EXAMPLE = { client: 52140, server: 443 };
  /** The three numbers the ranges view marks on the bar, one per range. */
  var EXAMPLES = [
    { port: 443, range: 'system', role: 'server' },
    { port: 3389, range: 'user', role: 'server' },
    { port: 52140, range: 'dynamic', role: 'client' }
  ];

  // ── rule 5: order ──

  /** By port number, then TCP before UDP (a card on both sorts between). */
  function compare(a, b) {
    return a.port - b.port || TRANSPORTS.indexOf(a.t) - TRANSPORTS.indexOf(b.t);
  }
  /** The secure-pairs order: each secure card right after its plain partner, then rule 5. */
  function comparePairs(a, b) {
    var ka = a.sec ? a.sec.of : a.port, kb = b.sec ? b.sec.of : b.port;
    return ka - kb || (a.sec ? 1 : 0) - (b.sec ? 1 : 0) || compare(a, b);
  }

  /** The other number of a plain/secure pair, or null. */
  function pairOf(p) {
    var c = typeof p === 'number' ? BY_PORT[p] : null;
    if (!c) return null;
    if (c.sec) return c.sec.of;
    return SECURE_OF[p] !== undefined ? SECURE_OF[p] : null;
  }

  /** Does a card carry the transport the filter asks for? */
  function hasTransport(c, f) { return f === 'all' || c.t === f || c.t === 'both'; }
  function courses(c) { return COURSES.filter(function (k) { return own(c.ch, k) && c.ch[k].length > 0; }); }

  // ── params, filter and views ──

  var PARAM_IDS = {
    transport: ['all', 'tcp', 'udp'],
    family: ['all'].concat(FAMILIES),
    range: ['all'].concat(RANGES.map(function (r) { return r.id; })),
    course: ['all'].concat(COURSES)
  };
  var FILTER_KEYS = ['transport', 'family', 'range', 'course'];

  /** Views, set by the presets. filter: what the preset sets (the view is on while the filters are that); focus:
      the ports it keeps active, or null; order: 'port' or 'pairs'; big: the bar is enlarged. */
  function view(over, focus, order, big) {
    var f = { transport: 'all', family: 'all', range: 'all', course: 'all' };
    for (var k in over) f[k] = over[k];
    return { filter: f, focus: focus, order: order || 'port', big: !!big };
  }
  var VIEWS = {
    'none': view({}, null),
    'book-five': view({}, [22, 25, 53, 80, 443]),
    'udp-only': view({ transport: 'udp' }, null),
    'secure-pairs': view({}, [22, 23, 53, 80, 110, 143, 389, 443, 636, 853, 993, 995], 'pairs'),
    'linux-services': view({}, [22, 67, 68, 123, 445, 514]),
    'ranges': view({}, [443, 3389], 'port', true)
  };
  var VIEW_IDS = Object.keys(VIEWS);

  /** The four filters, each falling back to 'all' when unknown. */
  function filterOf(p) {
    var f = {};
    FILTER_KEYS.forEach(function (k) { f[k] = PARAM_IDS[k].indexOf(p[k]) >= 0 ? p[k] : 'all'; });
    return f;
  }

  /** The view that is on: the preset's view while the filters are the ones it set, else null (a filter ends it). */
  function viewOf(p) {
    if (!own(VIEWS, p.view) || p.view === 'none') return null;
    var f = filterOf(p), v = VIEWS[p.view].filter;
    for (var i = 0; i < FILTER_KEYS.length; i++) if (f[FILTER_KEYS[i]] !== v[FILTER_KEYS[i]]) return null;
    return p.view;
  }

  function matches(c, f, focus) {
    return hasTransport(c, f.transport) && (f.family === 'all' || c.fam === f.family) &&
      (f.range === 'all' || rangeOf(c.port) === f.range) &&
      (f.course === 'all' || courses(c).indexOf(f.course) >= 0) &&
      (!focus || focus.indexOf(c.port) >= 0);
  }

  /** The cards in the order of a view. */
  function ordered(v) {
    return CARDS.slice().sort(v && VIEWS[v].order === 'pairs' ? comparePairs : compare);
  }

  /** The active ports, in the view's order. */
  function activeOf(p) {
    var f = filterOf(p), v = viewOf(p);
    var focus = v ? VIEWS[v].focus : null;
    return ordered(v).filter(function (c) { return matches(c, f, focus); }).map(function (c) { return c.port; });
  }

  /** The selected port (a card on the poster, dimmed or not), else null. */
  function selectedOf(p) {
    if (typeof p.sel !== 'string' || !/^[1-9][0-9]{0,4}$/.test(p.sel)) return null;
    return BY_PORT[Number(p.sel)] ? Number(p.sel) : null;
  }

  /** The cards that became active from one state to the next ("changed"), in the order of the later state. */
  function appeared(before, after) {
    if (!before) return [];
    return after.active.filter(function (port) { return before.active.indexOf(port) < 0; });
  }

  function copyCh(ch) { var o = {}; COURSES.forEach(function (k) { if (own(ch, k)) o[k] = ch[k].slice(); }); return o; }

  var logic = {
    RANGES: RANGES, FAMILIES: FAMILIES, TRANSPORTS: TRANSPORTS, COURSES: COURSES, CARDS: CARDS, BY_PORT: BY_PORT,
    PARAM_IDS: PARAM_IDS, VIEWS: VIEWS, VIEW_IDS: VIEW_IDS, EXAMPLE: EXAMPLE, EXAMPLES: EXAMPLES,

    defaults: { transport: 'all', family: 'all', range: 'all', course: 'all', view: 'none', sel: '' },

    /** A reference page: no steps. */
    steps: 0,

    /** The whole poster as plain data, derived from the params. */
    initial: function (p) {
      var f = filterOf(p), v = viewOf(p);
      var active = activeOf(p);
      var sel = selectedOf(p);
      var pair = sel !== null ? pairOf(sel) : null;
      return {
        filter: f,
        view: v,
        big: v ? VIEWS[v].big : false,
        highlight: sel,
        pair: pair,
        range: sel !== null ? rangeOf(sel) : null,
        active: active,
        bar: bar(),
        examples: v && VIEWS[v].big ? EXAMPLES.map(function (e) { return { port: e.port, range: e.range, role: e.role }; }) : [],
        cards: ordered(v).map(function (c) {
          return {
            port: c.port, transport: c.t, name: c.name, service: c.svc, family: c.fam, rfc: c.ref,
            range: rangeOf(c.port), secureOf: c.sec ? c.sec.of : null, via: c.sec ? c.sec.via : null,
            secure: SECURE_OF[c.port] !== undefined ? SECURE_OF[c.port] : null,
            course: courses(c), ch: copyCh(c.ch), side: c.side || 'server',
            visible: active.indexOf(c.port) >= 0,
            selected: c.port === sel,
            paired: pair !== null && c.port === pair
          };
        })
      };
    },

    step: function (s) { return s; },

    rangeOf: rangeOf, logPos: logPos, linPos: linPos, bar: bar, compare: compare, comparePairs: comparePairs,
    pairOf: pairOf, filterOf: filterOf, viewOf: viewOf, activeOf: activeOf, selectedOf: selectedOf, appeared: appeared
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
