/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for email-auth: a receiving server (mx.drugdje.example) checks one arriving message three times and decides.
   One step is one check, in order: (1) SPF on the envelope's MAIL FROM domain and the connecting IP; (2) the DKIM
   signature with the key at s._domainkey.d; (3) the author domain from From: and its DMARC record; (4) alignment of
   each passing identifier with the author domain; (5) the DMARC result and what the policy asks for.
   Every record comes from a small DNS zone, and every lookup the receiver makes is kept in order (state.lookups).
   Rules, tie-breaks and numbers: SPEC.md. The message and the hosts follow sims/email-path (lab.example sends to
   ivan@drugdje.example); no functions are shared with it.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. Addresses, host
   names, records and the subject line are data, not language. */
(function (root) {
  'use strict';

  var RECEIVER = 'mx.drugdje.example';
  var RECIPIENT = 'ivan@drugdje.example';

  /** DKIM keys as published. lab.example: the start of the book's 2048-bit RSA key (UL ch20, cut at 72 columns
      there too). zlo.example: the Ed25519 example key of RFC 8463 Appendix A. */
  var KEY_LAB = 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyrZlFz…';
  var KEY_ZLO = 'v=DKIM1; k=ed25519; p=11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=';

  /** The zones the receiver can read. lab.example as in UL ch19/ch20: no address at the apex, MX 10 posluzitelj,
      the SPF record "v=spf1 a mx -all", key sel1. The _dmarc record is written from the params (dmarcText). */
  function zoneFor(p) {
    return {
      'lab.example': { MX: [{ pref: 10, host: 'posluzitelj.lab.example' }], TXT: ['v=spf1 a mx -all'] },
      'posluzitelj.lab.example': { A: ['192.168.180.1'] },
      'sel1._domainkey.lab.example': { TXT: [KEY_LAB] },
      '_dmarc.lab.example': { TXT: [dmarcText(p)] },
      'news.lab.example': { A: ['192.168.180.25'], TXT: ['v=spf1 a -all'] },
      'lista.example': { A: ['198.51.100.7'], TXT: ['v=spf1 a -all'] },
      'zlo.example': { TXT: ['v=spf1 ip4:203.0.113.66 -all'] },
      'mail._domainkey.zlo.example': { TXT: [KEY_ZLO] }
    };
  }

  /** The lab record (UL ch20) with the policy param; strict SPF alignment adds aspf=s. */
  function dmarcText(p) {
    return 'v=DMARC1; p=' + p.policy + '; rua=mailto:postmaster@lab.example' + (p.aspf === 'strict' ? '; aspf=s' : '');
  }

  /** The four messages. ip and helo come from the connection, mailFrom and rcptTo from the envelope, from/to/subject
      from the header; sig is the DKIM-Signature's d= and s= when the message is signed. */
  var SCENARIOS = {
    legit: { ip: '192.168.180.1', helo: 'posluzitelj.lab.example', mailFrom: 'ana@lab.example', from: 'ana@lab.example',
      to: RECIPIENT, subject: 'Raspored laboratorija', sig: { d: 'lab.example', s: 'sel1', a: 'rsa-sha256' } },
    // UL ch20 Primjer 4: the list resends Ana's message from its own server, with its own bounce address in the
    // envelope (so refusals come back to the list software, which is how it learns to unsubscribe a reader)
    list: { ip: '198.51.100.7', helo: 'lista.example', mailFrom: 'radionica-bounces@lista.example', from: 'ana@lab.example',
      to: 'radionica@lista.example', subject: 'Raspored laboratorija', sig: { d: 'lab.example', s: 'sel1', a: 'rsa-sha256' },
      list: 'radionica@lista.example', tag: '[radionica] ' },
    spoof: { ip: '203.0.113.66', helo: 'mail.zlo.example', mailFrom: 'x@zlo.example', from: 'ana@lab.example',
      to: RECIPIENT, subject: 'Hitno: novi raspored', sig: { d: 'zlo.example', s: 'mail', a: 'ed25519-sha256' } },
    subdomain: { ip: '192.168.180.25', helo: 'news.lab.example', mailFrom: 'bounce@news.lab.example', from: 'bilten@lab.example',
      to: RECIPIENT, subject: 'Bilten laboratorija', sig: { d: 'lab.example', s: 'sel1', a: 'rsa-sha256' } }
  };

  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function lower(x) { return String(x).toLowerCase(); }
  function domainOf(addr) { return lower(String(addr).split('@').pop()); }
  function rr(zone, name, type) { var n = zone[lower(name)]; return (n && n[type]) || []; }

  /** The message as it arrives. The list may tag the subject after Ana's server signed it, which breaks the signature
      (rule 4); signed off leaves the DKIM-Signature out. */
  function messageFor(p) {
    var sc = SCENARIOS[p.scenario];
    var tagged = !!sc.list && p.listModifiesSubject;
    return {
      ip: sc.ip, helo: sc.helo, mailFrom: sc.mailFrom, rcptTo: RECIPIENT,
      from: sc.from, to: sc.to, subject: (tagged ? sc.tag : '') + sc.subject, tagged: tagged,
      list: sc.list || null,
      dkim: p.signed ? { d: sc.sig.d, s: sc.sig.s, a: sc.sig.a, intact: !tagged } : null
    };
  }

  // ── SPF (RFC 7208) ──

  var QUAL = { '+': 'pass', '-': 'fail', '~': 'softfail', '?': 'neutral' };
  var DNS_TERMS = ['a', 'mx', 'include', 'exists', 'ptr', 'redirect'];
  var LIMIT = 10;

  function ip4Num(ip) {
    var b = String(ip).split('.');
    if (b.length !== 4) return null;
    return ((+b[0] << 24) >>> 0) + (+b[1] << 16) + (+b[2] << 8) + (+b[3]);
  }
  function inCidr(ip, spec) {
    var parts = String(spec).split('/'), len = parts.length > 1 ? +parts[1] : 32;
    var a = ip4Num(ip), b = ip4Num(parts[0]);
    if (a === null || b === null) return false;
    if (len === 0) return true;
    var mask = (0xffffffff << (32 - len)) >>> 0;
    return ((a & mask) >>> 0) === ((b & mask) >>> 0);
  }

  /** Rule 3: the record is the one TXT string that starts with "v=spf1"; none → none, two → permerror (§4.5). */
  function spfRecords(zone, domain) {
    return rr(zone, domain, 'TXT').filter(function (t) { return /^v=spf1( |$)/i.test(t); });
  }

  /** Parse one term: [qualifier]mechanism[:argument]. redirect= counts as a DNS term (and, not modelled, ends in
      permerror); other modifiers (exp=, unknown ones) are skipped. */
  function parseTerm(text) {
    var q = '+', body = text;
    if (QUAL[body.charAt(0)]) { q = body.charAt(0); body = body.slice(1); }
    if (/^redirect=/i.test(body)) return { text: text, q: q, mech: 'redirect', arg: body.slice(9) };
    if (/^[a-z][a-z0-9_.-]*=/i.test(body)) return { text: text, modifier: true };
    var i = body.indexOf(':');
    var mech = lower(i < 0 ? body.split('/')[0] : body.slice(0, i));
    return { text: text, q: q, mech: mech, arg: i < 0 ? null : body.slice(i + 1) };
  }

  /** check_host(ip, domain) over the zone. Rules 1–3: terms left to right, the first one that matches decides with its
      qualifier (default +); all always matches; a looks up A and AAAA; mx looks up MX, then each host's addresses,
      and with no MX it matches nothing (no fallback to A, §5.4); the 11th DNS-querying term is a permerror (§4.6.4);
      nothing matched → neutral (§4.7). Returns the trace the page draws. */
  function checkHost(ip, domain, zone) {
    var out = { domain: lower(domain), ip: ip, record: null, terms: [], decided: -1, dnsTerms: 0, result: null, why: null, queries: [] };
    var recs = spfRecords(zone, domain);
    out.queries.push({ name: lower(domain), type: 'TXT', answer: rr(zone, domain, 'TXT').slice() });
    if (recs.length === 0) { out.result = 'none'; out.why = 'norecord'; return out; }
    if (recs.length > 1) { out.result = 'permerror'; out.why = 'multiple'; return out; }
    out.record = recs[0];
    var terms = recs[0].split(/\s+/).slice(1).filter(Boolean).map(parseTerm);
    out.terms = terms.map(function (t) { return { text: t.text, state: 'unread' }; });
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i], view = out.terms[i];
      if (t.modifier) { view.state = 'skip'; continue; }
      if (DNS_TERMS.indexOf(t.mech) >= 0) {
        out.dnsTerms++;
        if (out.dnsTerms > LIMIT) { view.state = 'limit'; out.decided = i; out.result = 'permerror'; out.why = 'limit'; return out; }
      }
      var m = matchTerm(t, ip, domain, zone);
      if (m === null) { view.state = 'error'; out.decided = i; out.result = 'permerror'; out.why = 'unknown'; return out; }
      view.queries = m.queries;
      m.queries.forEach(function (q) { out.queries.push(q); });
      if (m.match) { view.state = 'match'; out.decided = i; out.result = QUAL[t.q]; out.why = 'match'; return out; }
      view.state = 'nomatch';
    }
    out.result = 'neutral';
    out.why = 'nomatch';
    return out;
  }

  /** One mechanism: { match, queries } or null for a mechanism this model does not know (permerror). */
  function matchTerm(t, ip, domain, zone) {
    var target = lower(t.arg || domain), queries = [];
    function addrs(name) {
      var a = rr(zone, name, 'A').concat(rr(zone, name, 'AAAA'));
      queries.push({ name: lower(name), type: 'A/AAAA', answer: a.slice() });
      return a;
    }
    switch (t.mech) {
      case 'all': return { match: true, queries: queries };
      case 'ip4': return { match: inCidr(ip, t.arg), queries: queries };
      case 'ip6': return { match: lower(t.arg) === lower(ip), queries: queries };
      case 'a': return { match: addrs(target).indexOf(ip) >= 0, queries: queries };
      case 'mx': {
        var mx = rr(zone, target, 'MX').slice().sort(function (x, y) { return x.pref - y.pref || (x.host < y.host ? -1 : x.host > y.host ? 1 : 0); });
        queries.push({ name: target, type: 'MX', answer: mx.map(function (r) { return r.pref + ' ' + r.host; }) });
        var hit = false;
        mx.forEach(function (r) { if (!hit && addrs(r.host).indexOf(ip) >= 0) hit = true; });
        return { match: hit, queries: queries };
      }
      default: return null;
    }
  }

  // ── DKIM (RFC 6376) ──

  /** Rule 4: the key is the TXT record at s._domainkey.d. No signature → none; no key → permerror; a message changed
      after signing → fail; otherwise pass, for domain d= (which says nothing about From:). */
  function verifyDkim(sig, zone) {
    if (!sig) return { result: 'none', domain: null, keyName: null, key: null, queries: [] };
    var keyName = lower(sig.s + '._domainkey.' + sig.d);
    var txt = rr(zone, keyName, 'TXT');
    var key = txt.filter(function (x) { return /(^|;)\s*p=/.test(x); })[0] || null;
    var out = { result: null, domain: lower(sig.d), selector: sig.s, keyName: keyName, key: key, queries: [{ name: keyName, type: 'TXT', answer: txt.slice() }] };
    out.result = !key ? 'permerror' : sig.intact ? 'pass' : 'fail';
    return out;
  }

  // ── DMARC (RFC 9989, RFC 7489) ──

  /** Rule 7: a record starts with v=DMARC1; a missing p reads as p=none; aspf/adkim "s" is strict, anything else relaxed
      (the default, rule 6). Not a DMARC record → null. */
  function parseDmarc(text) {
    if (!/^v=DMARC1\s*(;|$)/.test(String(text))) return null;
    var tags = {};
    String(text).split(';').forEach(function (part) {
      var i = part.indexOf('=');
      if (i > 0) tags[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
    });
    var p = ['none', 'quarantine', 'reject'].indexOf(lower(tags.p || '')) >= 0 ? lower(tags.p) : 'none';
    return { text: text, p: p, pGiven: tags.p !== undefined, aspf: lower(tags.aspf) === 's' ? 'strict' : 'relaxed', adkim: lower(tags.adkim) === 's' ? 'strict' : 'relaxed' };
  }

  function dmarcLookup(author, zone) {
    var name = '_dmarc.' + author;
    var txt = rr(zone, name, 'TXT');
    var recs = txt.map(parseDmarc).filter(Boolean);
    return { name: name, record: recs.length === 1 ? recs[0] : null, queries: [{ name: name, type: 'TXT', answer: txt.slice() }] };
  }

  /** The organisational domain of a name. For the names here (all under a reserved TLD with no public suffix below it)
      both RFC 7489's public suffix list and RFC 9989's tree walk give the last two labels. */
  function orgDomain(name) { return lower(name).split('.').slice(-2).join('.'); }

  /** Rules 5–6: an identifier counts for DMARC only if its check passed and it aligns with the author domain;
      relaxed = same organisational domain, strict = identical names. */
  function alignment(id, passed, author, mode) {
    if (!id) return null;
    var identical = lower(id) === lower(author), sameOrg = orgDomain(id) === orgDomain(author);
    return { domain: lower(id), passed: passed, mode: mode, identical: identical, sameOrg: sameOrg,
      aligned: passed && (mode === 'strict' ? identical : sameOrg) };
  }

  /** Rule 5: DMARC passes if SPF or DKIM passed with an aligned identifier. No record → none (no DMARC applies). */
  function dmarcResult(record, al) {
    if (!record) return 'none';
    return (al.spf && al.spf.aligned) || (al.dkim && al.dkim.aligned) ? 'pass' : 'fail';
  }

  /** Rule 7: what the receiver does. A pass or no record is delivered; a fail follows p: none delivers (and the
      owner learns of it in the aggregate report), quarantine files it as suspicious, reject refuses it in the session. */
  function policyAction(verdict, p) {
    if (verdict !== 'fail' || p === 'none') return verdict === 'fail' ? 'report' : 'deliver';
    return p;
  }
  function replyFor(action, author) {
    return action === 'reject' ? { code: 550, text: '5.7.1 Email rejected per DMARC policy for ' + author } : { code: 250, text: '2.0.0 OK' };
  }

  // ── steps ──

  var PHASES = ['arrive', 'spf', 'dkim', 'dmarc', 'align', 'verdict'];

  function addLookups(s, n, check, queries) {
    queries.forEach(function (q) { s.lookups.push({ step: n, check: check, name: q.name, type: q.type, answer: q.answer }); });
  }

  var logic = {
    defaults: { scenario: 'legit', policy: 'none', aspf: 'relaxed', signed: true, listModifiesSubject: false },

    /** Five checks per message, the same for every scenario (sim.json steps). */
    steps: 5,

    initial: function (p) {
      return {
        n: 0, phase: 'arrive', scenario: p.scenario, receiver: RECEIVER,
        msg: messageFor(p), dns: zoneFor(p), lookups: [],
        spf: null, dkim: null, author: null, dmarc: null, aligned: null,
        verdict: null, action: null, reply: null, unsubscribed: null, changed: ['msg']
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      s.n = n;
      s.phase = PHASES[n];
      switch (s.phase) {
        case 'spf': {
          // Rule 1: the envelope's MAIL FROM domain, never HELO and never From:
          var r = checkHost(s.msg.ip, domainOf(s.msg.mailFrom), s.dns);
          addLookups(s, n, 'spf', r.queries);
          delete r.queries;
          s.spf = r;
          s.changed = ['spf', 'id:ip', 'id:mailFrom', 'dns'];
          break;
        }
        case 'dkim': {
          var d = verifyDkim(s.msg.dkim, s.dns);
          addLookups(s, n, 'dkim', d.queries);
          delete d.queries;
          s.dkim = d;
          s.changed = ['dkim', 'id:dkim'].concat(s.msg.dkim ? ['dns'] : []);
          break;
        }
        case 'dmarc': {
          s.author = domainOf(s.msg.from);
          var lk = dmarcLookup(s.author, s.dns);
          addLookups(s, n, 'dmarc', lk.queries);
          s.dmarc = lk.record;
          s.changed = ['dmarc', 'id:from', 'dns'];
          break;
        }
        case 'align': {
          var rec = s.dmarc || { aspf: 'relaxed', adkim: 'relaxed' };
          s.aligned = {
            spf: alignment(s.spf.domain, s.spf.result === 'pass', s.author, rec.aspf),
            dkim: alignment(s.dkim.domain, s.dkim.result === 'pass', s.author, rec.adkim)
          };
          s.changed = ['align'];
          break;
        }
        default: {
          s.verdict = dmarcResult(s.dmarc, s.aligned);
          s.action = policyAction(s.verdict, s.dmarc ? s.dmarc.p : 'none');
          s.reply = replyFor(s.action, s.author);
          // Rule 8 / UL ch20 Primjer 4: the list reads a refusal as a dead address and drops the subscriber
          s.unsubscribed = s.action === 'reject' && s.msg.list ? s.msg.rcptTo : null;
          s.changed = ['verdict'];
        }
      }
      return s;
    },

    SCENARIOS: SCENARIOS,
    RECEIVER: RECEIVER,
    LIMIT: LIMIT,
    zoneFor: zoneFor,
    dmarcText: dmarcText,
    messageFor: messageFor,
    domainOf: domainOf,
    checkHost: checkHost,
    verifyDkim: verifyDkim,
    parseDmarc: parseDmarc,
    orgDomain: orgDomain,
    alignment: alignment,
    dmarcResult: dmarcResult,
    policyAction: policyAction,
    replyFor: replyFor
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
