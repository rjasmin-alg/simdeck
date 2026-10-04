/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-dhcp-scope-options: one DHCP server, one scope, one reservation; which address a client gets
   (exclusions, reservations, the lowest free address) and, per option, which level's value it gets (server, server
   class, scope, scope class, reservation: the most specific level that sets it wins). An explorer: initial(params)
   is the whole model, no steps. Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var NET = '10.0.10.';
  var SUBNET = '10.0.10.0/24';
  var RANGE = [10, 250];                 // last octets, inclusive
  var EXCLUSION = [10, 30];
  var DAY = 86400;
  var LEASE = 8 * DAY;                   // Windows Server default (SPEC §1, check)
  var CODES = ['003', '006', '015', '042', '051'];

  /** Levels from least to most specific (SPEC rule 3); a class level beats the plain level below it (rule 4). */
  var LEVELS = [
    { id: 'server', rank: 1 },
    { id: 'serverClass', rank: 2 },
    { id: 'scope', rank: 3 },
    { id: 'scopeClass', rank: 4 },
    { id: 'reservation', rank: 5 }
  ];

  var CLIENTS = {
    laptop: { name: 'laptop', mac: '02-AB-CD-01-02-03', vendorClass: null, userClass: null },
    phone: { name: 'phone', mac: '02-AB-CD-04-05-06', vendorClass: 'VoIP-Phone', userClass: null },
    printer: { name: 'printer', mac: '02-AB-CD-0A-0B-0C', vendorClass: null, userClass: null }
  };
  /** Dynamic clients lease in this order (SPEC rule 1). */
  var DYNAMIC = ['laptop', 'phone'];

  /** The toggles and their bits in the hidden `held` mask (SPEC rule 6). */
  var BITS = { scope006: 1, resOption003: 2, exclusion: 4, classNtp: 8 };

  function ip(octet) { return NET + octet; }
  function octetOf(addr) {
    var m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(addr);
    return m ? Number(m[4]) : NaN;
  }
  function toInt(addr) {
    return addr.split('.').reduce(function (acc, x) { return acc * 256 + Number(x); }, 0);
  }
  /** Is addr inside subnet "a.b.c.d/len"? (SPEC rule 2) */
  function inSubnet(addr, subnet) {
    var parts = subnet.split('/');
    var len = Number(parts[1]);
    var size = Math.pow(2, 32 - len);
    return Math.floor(toInt(addr) / size) === Math.floor(toInt(parts[0]) / size);
  }

  function maskOf(p) {
    var m = 0;
    Object.keys(BITS).forEach(function (k) { if (p[k]) m |= BITS[k]; });
    return m;
  }
  /** The params with the toggles taken from a mask (the configuration at the clients' last renewal). */
  function withMask(p, mask) {
    var q = Object.assign({}, p);
    Object.keys(BITS).forEach(function (k) { q[k] = (mask & BITS[k]) !== 0; });
    return q;
  }

  /** The server's configuration for a set of toggles. */
  function config(p) {
    var scopeOptions = { '003': ip(1), '051': LEASE };
    if (p.scope006) scopeOptions['006'] = ip(53);
    return {
      server: { options: { '006': '10.0.0.10', '015': 'corp.example' }, classOptions: [] },
      scope: {
        subnet: SUBNET,
        range: [ip(RANGE[0]), ip(RANGE[1])],
        exclusions: p.exclusion ? [[ip(EXCLUSION[0]), ip(EXCLUSION[1])]] : [],
        lease: LEASE,
        options: scopeOptions,
        classOptions: p.classNtp ? [{ class: 'VoIP-Phone', code: '042', value: '10.0.0.123' }] : [],
        reservations: [{ name: 'printer', mac: CLIENTS.printer.mac, ip: ip(40), options: p.resOption003 ? { '003': ip(254) } : {} }]
      }
    };
  }

  function reservationOf(cfg, mac) {
    return cfg.scope.reservations.filter(function (r) { return r.mac === mac; })[0] || null;
  }
  function excluded(cfg, addr) {
    var o = octetOf(addr);
    return cfg.scope.exclusions.some(function (x) { return o >= octetOf(x[0]) && o <= octetOf(x[1]); });
  }
  /** May this dynamic client (mac) hold addr? In the range, not excluded, not reserved, not taken by another. */
  function validFor(cfg, addr, mac, taken) {
    var o = octetOf(addr);
    if (!(o >= octetOf(cfg.scope.range[0]) && o <= octetOf(cfg.scope.range[1]))) return false;
    if (excluded(cfg, addr)) return false;
    if (cfg.scope.reservations.some(function (r) { return r.ip === addr && r.mac !== mac; })) return false;
    return taken.indexOf(addr) < 0;
  }
  /** The lowest free address of the pool, or null when the pool is exhausted (SPEC rule 1). */
  function lowestFree(cfg, taken) {
    for (var o = octetOf(cfg.scope.range[0]); o <= octetOf(cfg.scope.range[1]); o++) {
      if (validFor(cfg, ip(o), null, taken)) return ip(o);
    }
    return null;
  }

  /** Leases of the dynamic clients, in order. With `before` (their leases so far), a client keeps its address if it is
      still valid, else gets the lowest free one (renewal, SPEC rule 6). Without it, every lease is fresh. */
  function leasesOf(cfg, before) {
    var taken = [];
    // Kept addresses are claimed first, so a fresh lease never takes an address a renewing client keeps.
    var keep = {};
    DYNAMIC.forEach(function (name) {
      var old = before && before.filter(function (l) { return l.name === name; })[0];
      if (old && validFor(cfg, old.ip, CLIENTS[name].mac, taken)) { keep[name] = old.ip; taken.push(old.ip); }
    });
    return DYNAMIC.map(function (name) {
      var addr = keep[name] || lowestFree(cfg, taken);
      if (!keep[name] && addr) taken.push(addr);
      return { name: name, mac: CLIENTS[name].mac, ip: addr };
    });
  }

  function presents(client, cls) {
    return cls === client.vendorClass || cls === client.userClass;
  }
  /** The class option for this code at a level: the one for a class the client presents, else the first set. */
  function classEntry(list, code, client) {
    var forCode = list.filter(function (x) { return x.code === code; });
    return forCode.filter(function (x) { return presents(client, x.class); })[0] || forCode[0] || null;
  }

  /** One row per level for one option code: its value there, whether it applies to the client and sets it. */
  function ladder(cfg, client, code) {
    var res = reservationOf(cfg, client.mac);
    var shown = res || cfg.scope.reservations[0] || null;   // the row shows a reservation's value even when not ours
    return LEVELS.map(function (l) {
      var value = null, cls = null, applies = true, miss = [];
      if (l.id === 'server') value = has(cfg.server.options, code);
      else if (l.id === 'scope') value = has(cfg.scope.options, code);
      else if (l.id === 'serverClass' || l.id === 'scopeClass') {
        var e = classEntry(l.id === 'serverClass' ? cfg.server.classOptions : cfg.scope.classOptions, code, client);
        if (e) { value = e.value; cls = e.class; applies = presents(client, e.class); if (!applies) miss = ['cls']; }
      } else if (l.id === 'reservation') {
        value = shown ? has(shown.options, code) : null;
        applies = !!res;
        if (!applies && value !== null) miss = ['level'];
      }
      return { level: l.id, rank: l.rank, value: value, cls: cls, applies: applies, hit: value !== null && applies, miss: miss };
    });
  }
  function has(obj, code) { return Object.prototype.hasOwnProperty.call(obj, code) ? obj[code] : null; }

  /** Per option, the most specific level that sets it wins; the others that set it are overridden (rules 3–5). */
  function effectiveOf(cfg, client) {
    return CODES.map(function (code) {
      var hits = ladder(cfg, client, code).filter(function (r) { return r.hit; });
      if (!hits.length) return { code: code, value: null, level: null, overridden: [] };
      var win = hits.reduce(function (a, b) { return b.rank > a.rank ? b : a; });
      return {
        code: code, value: win.value, level: win.level,
        overridden: hits.filter(function (r) { return r !== win; }).sort(function (a, b) { return b.rank - a.rank; })
          .map(function (r) { return { level: r.level, value: r.value }; })
      };
    });
  }
  function valueMap(eff) {
    var m = {};
    eff.forEach(function (e) { m[e.code] = e.value; });
    return m;
  }

  function addressOf(cfg, client, leases) {
    var res = reservationOf(cfg, client.mac);
    if (res) return res.ip;
    var l = leases.filter(function (x) { return x.name === client.name; })[0];
    return l ? l.ip : null;
  }

  /** The `held` mask after a renewal now (SPEC rule 6): option bits from now; the exclusion bit stays on if the
      clients' addresses survive the renewal, which keeps them, else follows now. */
  function renewMask(p) {
    var cur = maskOf(p);
    var before = leasesOf(config(withMask(p, p.held)));
    var after = leasesOf(config(p), before);
    var kept = after.every(function (l, i) { return l.ip === before[i].ip; });
    var excl = kept ? (p.held & BITS.exclusion) : (cur & BITS.exclusion);
    return (cur & ~BITS.exclusion) | excl;
  }

  var logic = {
    defaults: { client: 'laptop', scope006: false, resOption003: false, exclusion: true, classNtp: false, focus: '006', held: BITS.exclusion },

    CODES: CODES,
    LEVELS: LEVELS,
    CLIENTS: CLIENTS,
    BITS: BITS,
    LEASE: LEASE,

    presets: [
      { id: 'server-and-scope', params: { client: 'laptop', scope006: false, resOption003: false, exclusion: true, classNtp: false, held: 4, focus: '003' } },
      { id: 'scope-overrides', params: { client: 'laptop', scope006: true, resOption003: false, exclusion: true, classNtp: false, held: 5, focus: '006' } },
      { id: 'reservation', params: { client: 'printer', scope006: false, resOption003: true, exclusion: true, classNtp: false, held: 6, focus: '003' } },
      { id: 'class-option', params: { client: 'phone', scope006: false, resOption003: false, exclusion: true, classNtp: true, held: 12, focus: '042' } },
      { id: 'change-needs-renew', params: { client: 'laptop', scope006: true, resOption003: false, exclusion: true, classNtp: false, held: 4, focus: '006' } }
    ],

    initial: function (p) {
      var cfg = config(p);
      var heldCfg = config(withMask(p, p.held));
      var base = CLIENTS[p.client] || CLIENTS.laptop;
      var client = Object.assign({}, base, { reserved: !!reservationOf(cfg, base.mac) });
      var heldLeases = leasesOf(heldCfg);
      var leases = leasesOf(cfg, heldLeases);
      var ladders = {};
      CODES.forEach(function (code) { ladders[code] = ladder(cfg, client, code); });
      var effective = effectiveOf(cfg, client);
      var has = { ip: addressOf(heldCfg, client, heldLeases), options: valueMap(effectiveOf(heldCfg, client)) };
      var offer = addressOf(cfg, client, leases);
      var now = valueMap(effective);
      var stale = (has.ip !== offer ? ['ip'] : []).concat(CODES.filter(function (c) { return has.options[c] !== now[c]; }));
      return {
        server: cfg.server,
        scope: cfg.scope,
        leases: heldLeases,
        client: client,
        offer: offer,
        nextFree: lowestFree(cfg, heldLeases.map(function (l) { return l.ip; })),
        ladders: ladders,
        effective: effective,
        has: has,
        stale: stale,
        t1: cfg.scope.lease / 2
      };
    },

    maskOf: maskOf,
    withMask: withMask,
    renewMask: renewMask,
    config: config,
    inSubnet: inSubnet,
    leasesOf: leasesOf,
    lowestFree: lowestFree,
    ladder: ladder,
    effectiveOf: effectiveOf,
    /** Codes whose effective value differs between two states (the page's "changed" mark). */
    changedCodes: function (a, b) {
      if (!a || !b) return [];
      var va = valueMap(a.effective), vb = valueMap(b.effective);
      return CODES.filter(function (c) { return va[c] !== vb[c] || levelOf(a, c) !== levelOf(b, c); });
    },
    DAY: DAY
  };
  function levelOf(s, code) { return s.effective.filter(function (e) { return e.code === code; })[0].level; }

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
