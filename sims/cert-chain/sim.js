/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cert-chain: how a client checks the chain a server sends against its own trust store and its own clock.
   A story is a list of machine states (scenes); in each scene the client runs one validation, one check per step:
   connect, then for each certificate from the leaf up: find its issuer (among those sent, then in the store) and verify
   the signature, check the date, and stop at a trust anchor or at the first failure. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. validate() and the day arithmetic work on plain data with no strings, so a
   later page (revocation, ACME renewal) can reuse them. */
(function (root) {
  'use strict';

  // ── days: a date is a day number (days since 1970-01-01), so the model never touches Date ──

  /** 'YYYY-MM-DD' → day number (proleptic Gregorian; H. Hinnant's days_from_civil). */
  function dayOf(iso) {
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }

  /** Day number → 'YYYY-MM-DD' (civil_from_days). */
  function isoOf(day) {
    var z = day + 719468;
    var era = Math.floor(z / 146097);
    var doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp + (mp < 10 ? 3 : -9);
    var y = yoe + era * 400 + (m <= 2 ? 1 : 0);
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }

  // ── the certificates: every one the stories use ──
  // Dates are whole days and the window is inclusive (RFC 5280 §4.1.2.5: "from notBefore through notAfter, inclusive");
  // a real certificate carries a time of day too (SPEC.md, Simplifications).

  function cert(file, subject, issuer, notBefore, notAfter) {
    return { file: file, subject: subject, issuer: issuer, notBefore: dayOf(notBefore), notAfter: dayOf(notAfter),
      selfSigned: subject === issuer, sigOk: true };
  }
  var LAB_CA = 'CN=Laboratorijsko tijelo lab.example';
  var PUB_ROOT = 'CN=Example Root CA';
  var PUB_INT = 'CN=Example Issuing CA 1';
  var CERTS = {
    // UL ch21: the certificate that came with the web server package, the lab CA, www1 and its expired twin. The
    // package's file holds a leaf and the package's own self-signed CA, which is why the book's client says "self-signed
    // certificate in certificate chain" (SPEC.md, Simplifications). localOnly: made on this machine for itself, no
    // client is meant to trust it.
    pkg: cert('localhost.crt', 'CN=localhost', 'CN=localhost CA', '2026-09-05', '2027-09-05'),
    pkgca: Object.assign(cert('localhost.crt', 'CN=localhost CA', 'CN=localhost CA', '2026-09-05', '2027-09-05'), { localOnly: true }),
    labca: cert('lab-ca.crt', LAB_CA, LAB_CA, '2026-09-05', '2036-09-02'),
    www1: cert('www1.crt', 'CN=www1.lab.example', LAB_CA, '2026-09-05', '2027-09-05'),
    www1old: cert('www1-istekao.crt', 'CN=www1.lab.example', LAB_CA, '2025-01-01', '2025-06-01'),
    // A public-CA style chain root → intermediate → leaf (invented names and dates, SPEC.md).
    pubroot: cert('example-root.crt', PUB_ROOT, PUB_ROOT, '2016-01-01', '2041-01-01'),
    pubint: cert('example-issuing-1.crt', PUB_INT, PUB_ROOT, '2024-03-01', '2029-03-01'),
    web: cert('www.example.com.crt', 'CN=www.example.com', PUB_INT, '2026-06-01', '2027-06-01'),
    // DR estate scan 2026-11-01: the wildcard (public CA, 397-day) and p4-commit's self-signed certificate.
    wild: cert('wildcard.crt', 'CN=*.quillmoor.example', PUB_INT, '2025-10-18', '2026-11-19'),
    p4: cert('p4-commit.crt', 'CN=p4-commit', 'CN=p4-commit', '2024-12-01', '2026-12-01')
  };

  /** The certificates the server sends, leaf first, for a serverCert choice. */
  function sendsOf(serverCert, sendIntermediate) {
    if (serverCert === 'self') return ['pkg', 'pkgca'];
    if (serverCert === 'expired') return ['www1old'];
    if (serverCert === 'public') return sendIntermediate ? ['web', 'pubint'] : ['web'];
    return ['www1'];
  }

  function within(c, now) { return c.notBefore <= now && now <= c.notAfter; }
  function dateFault(c, now) { return now < c.notBefore ? 'not-yet-valid' : 'expired'; }

  /** Is there a certificate with this subject among ids (not one of skip)? → its id or null. First in list order. */
  function bySubject(ids, certs, subject, skip) {
    for (var i = 0; i < ids.length; i++) if (!skip[ids[i]] && certs[ids[i]] && certs[ids[i]].subject === subject) return ids[i];
    return null;
  }

  /** Where the fix is: on the server, on the client, or null when no one side is it (SPEC.md, rule 9). */
  function fixFor(reason, kind, certId, sends, certs, now, trueDay) {
    if (reason === 'connect' || reason === 'bad-signature') return 'server';
    // A self-signed leaf, or a CA nobody is meant to trust: the server needs a certificate from a CA clients trust.
    if (reason === 'self-signed') return certId === sends[0] || certs[certId].localOnly ? 'server' : 'client';
    if (reason === 'unknown-issuer') {
      // The issuer the client could not find: a root belongs in the client's store, an intermediate on the server.
      var missing = bySubject(Object.keys(certs), certs, certs[certId].issuer, {});
      return missing && !certs[missing].selfSigned ? 'server' : 'client';
    }
    // An anchor out of date: renewing it is not enough while clients hold the old one; no single side.
    if (kind === 'anchor') return null;
    // expired / not yet valid: the client's clock alone is wrong when the certificate is valid on the true date.
    return within(certs[certId], trueDay) && !within(certs[certId], now) ? 'client' : 'server';
  }

  /**
   * One validation, as the client runs it (rules 1–8). in: { open443, sends: [id, leaf first], store: [id], certs, now,
   * trueDay }. → { checks: [{ certId, kind: 'connect'|'issuer'|'validity'|'anchor', ok, issuerId?, from?, reason? }],
   *   result: { exit, reason, alert, certId, fix } }. Checks run leaf first and stop at the first failure (rule 8).
   */
  function validate(c) {
    var certs = c.certs || CERTS;
    var trueDay = c.trueDay == null ? c.now : c.trueDay;
    var checks = [];
    function fail(kind, certId, reason, extra) {
      var ch = { certId: certId, kind: kind, ok: false, reason: reason };
      if (extra) for (var k in extra) ch[k] = extra[k];
      checks.push(ch);
      var alert = reason === 'connect' ? null
        : reason === 'expired' || reason === 'not-yet-valid' ? 'certificate_expired'
          : reason === 'bad-signature' ? 'bad_certificate' : 'unknown_ca';
      return { checks: checks, result: { exit: reason === 'connect' ? 7 : 60, reason: reason, alert: alert, certId: certId,
        fix: fixFor(reason, kind, certId, c.sends, certs, c.now, trueDay) } };
    }
    // (0) no connection: a different failure, before any certificate is seen (rule 7).
    if (!c.open443) return fail('connect', null, 'connect');
    checks.push({ certId: null, kind: 'connect', ok: true });
    var cur = c.sends[0];
    var seen = {};
    for (var guard = 0; guard < 16; guard++) {
      var x = certs[cur];
      // (4) a trust anchor: in the client's store. It must be valid at the client's clock too (rule 6).
      if (c.store.indexOf(cur) >= 0) {
        if (!within(x, c.now)) return fail('anchor', cur, dateFault(x, c.now));
        checks.push({ certId: cur, kind: 'anchor', ok: true });
        return { checks: checks, result: { exit: 0, reason: null, alert: null, certId: cur, fix: null } };
      }
      // (1) build the path. A self-signed certificate is its own issuer: it ends here, and it is not in the store.
      if (x.selfSigned) return fail('issuer', cur, 'self-signed');
      seen[cur] = true;
      var from = 'sent';
      var issuer = bySubject(c.sends, certs, x.issuer, seen);
      if (!issuer) { from = 'store'; issuer = bySubject(c.store, certs, x.issuer, seen); }
      if (!issuer) return fail('issuer', cur, 'unknown-issuer');
      // (2) the signature, with the issuer's public key.
      if (!x.sigOk) return fail('issuer', cur, 'bad-signature', { issuerId: issuer, from: from });
      checks.push({ certId: cur, kind: 'issuer', ok: true, issuerId: issuer, from: from });
      // (3) the date, at the client's clock.
      if (!within(x, c.now)) return fail('validity', cur, dateFault(x, c.now));
      checks.push({ certId: cur, kind: 'validity', ok: true });
      cur = issuer;
    }
    return fail('issuer', cur, 'unknown-issuer'); // unreachable with a finite, acyclic set
  }

  // ── stories: a list of machine states; the params set the first one, events change it ──

  var BOOK_DAY = dayOf('2026-09-05'); // UL ch21: the client's `date` and the day the certificates were made
  var SCAN_DAYS = ['2026-11-02', '2026-11-18', '2026-11-19', '2026-11-20', '2026-12-01', '2026-12-02'].map(dayOf);
  var WILD_ENDPOINTS = ['hq-fw01', 'cloud-web01', 'git-cloud', 'rq-colo01:8082', 'tracklist01:443'];

  var EVENTS = {
    book: [
      { id: 'openFirewall', set: { https443Open: true } },
      { id: 'labCert', set: { serverCert: 'lab' } },
      { id: 'addAnchor', set: { anchorInStore: true } },
      { id: 'expiredCert', set: { serverCert: 'expired' } }
    ],
    intermediate: [{ id: 'sendIntermediate', set: { sendIntermediate: true } }],
    one: []
  };

  /** The machine in one state → its connections (what the client validates) and the client's store. */
  function machine(m, trueDay, offset) {
    var now = trueDay + offset;
    if (m.estate) {
      var storeE = ['pubroot', 'p4'];
      return { trueDay: trueDay, now: now, store: storeE, connections: [
        { endpoints: WILD_ENDPOINTS.slice(), open443: true, sends: ['wild', 'pubint'] },
        { endpoints: ['p4-commit:1666'], open443: true, sends: ['p4'] }
      ] };
    }
    var store = ['pubroot'].concat(m.anchorInStore ? ['labca'] : []);
    var host = m.serverCert === 'public' ? 'www.example.com:443' : 'www1.lab.example:443';
    return { trueDay: trueDay, now: now, store: store, connections: [
      { endpoints: [host], open443: m.https443Open, sends: sendsOf(m.serverCert, m.sendIntermediate) }
    ] };
  }

  /** The scenes of a story: [{ event, changed: [param keys], machine fields, trueDay, now, store, connections }]. */
  function scenes(p) {
    var out = [];
    if (p.story === 'clocks') {
      SCAN_DAYS.forEach(function (d, i) {
        var s = machine({ estate: true }, d, p.clockOffsetDays);
        s.event = i === 0 ? null : 'time';
        s.changed = i === 0 ? [] : ['clock'];
        out.push(s);
      });
      return out;
    }
    // The book's sequence starts from its first certificate (the package's self-signed one), and the intermediate
    // sequence is about the public CA's chain, whatever serverCert says; only 'one' takes it from the params.
    var cert0 = p.story === 'book' ? 'self' : p.story === 'intermediate' ? 'public' : p.serverCert;
    var m = { https443Open: p.https443Open, serverCert: cert0, sendIntermediate: p.sendIntermediate, anchorInStore: p.anchorInStore };
    var first = machine(m, BOOK_DAY, p.clockOffsetDays);
    first.event = null;
    first.changed = [];
    first.m = Object.assign({}, m);
    out.push(first);
    (EVENTS[p.story] || []).forEach(function (ev) {
      var changed = Object.keys(ev.set).filter(function (k) { return m[k] !== ev.set[k]; });
      m = Object.assign({}, m, ev.set);
      var s = machine(m, BOOK_DAY, p.clockOffsetDays);
      s.event = ev.id;
      s.changed = changed;
      s.m = Object.assign({}, m);
      out.push(s);
    });
    return out;
  }

  /** Validate every connection of a scene. */
  function runScene(s) {
    return s.connections.map(function (cn) {
      return validate({ open443: cn.open443, sends: cn.sends, store: s.store, certs: CERTS, now: s.now, trueDay: s.trueDay });
    });
  }

  /**
   * Frames: what step n shows. Check stories reveal one check per step, and the scene changes together with its first
   * check (connect). The estate story ('clocks') moves the clock one date per step and shows every check at once.
   */
  function frames(p) {
    var sc = scenes(p);
    var out = [];
    sc.forEach(function (s, i) {
      var runs = runScene(s);
      if (p.story === 'clocks') { out.push({ scene: i, shown: runs.map(function (r) { return r.checks.length; }) }); return; }
      if (i === 0) out.push({ scene: 0, shown: [0] });
      for (var k = 1; k <= runs[0].checks.length; k++) out.push({ scene: i, shown: [k] });
    });
    return out;
  }

  function certsOf(s) {
    var ids = s.store.slice();
    s.connections.forEach(function (cn) { cn.sends.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    var out = {};
    ids.forEach(function (id) { out[id] = Object.assign({}, CERTS[id]); });
    return out;
  }

  /** The whole state at frame n, built from the params alone (deterministic; step() needs nothing from before). */
  function stateAt(p, n) {
    var sc = scenes(p);
    var fr = frames(p);
    var f = fr[Math.max(0, Math.min(n, fr.length - 1))];
    var s = sc[f.scene];
    var runs = runScene(s);
    var connections = s.connections.map(function (cn, i) {
      var all = runs[i];
      var shown = f.shown[i];
      return {
        endpoints: cn.endpoints, listening443: cn.open443, serverSends: cn.sends.slice(),
        checks: all.checks.slice(0, shown), total: all.checks.length,
        result: shown === all.checks.length ? all.result : null,
        newCheck: n > 0 && p.story !== 'clocks' && shown > 0 ? shown - 1 : -1 // the check this step revealed
      };
    });
    // Earlier scenes' outcomes (the book's 7 → 60 → 60 → 0 → 60), and how many scenes there are.
    var history = sc.map(function (x, i) {
      if (i > f.scene || (i === f.scene && connections.some(function (cn) { return !cn.result; }))) return null;
      return runScene(x).map(function (r) { return r.result.exit; });
    });
    var sceneStart = n === 0 || (fr[n - 1] && fr[n - 1].scene !== f.scene);
    return {
      story: p.story, scene: f.scene, scenes: sc.length, event: s.event,
      changed: sceneStart ? s.changed.slice() : [], sceneStart: sceneStart && n > 0,
      now: s.now, trueDay: s.trueDay, offset: p.clockOffsetDays, nowIso: isoOf(s.now), trueIso: isoOf(s.trueDay),
      store: s.store.slice(), certs: certsOf(s), connections: connections, history: history
    };
  }

  var logic = {
    /** Parameter defaults: the page opens on the book's sequence (UL ch21), whose first state is its first fault. */
    defaults: { story: 'book', https443Open: false, serverCert: 'self', sendIntermediate: false, anchorInStore: false, clockOffsetDays: 0 },

    /** Steps depend on the story and on what fails where: one per check (clocks: one per date). */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    validate: validate, scenes: scenes, frames: frames, sendsOf: sendsOf, within: within,
    dayOf: dayOf, isoOf: isoOf, CERTS: CERTS, BOOK_DAY: BOOK_DAY, SCAN_DAYS: SCAN_DAYS, OFFSET_MIN: -400, OFFSET_MAX: 800
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
