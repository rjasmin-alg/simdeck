/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for email-path: one message from the sender's mail user agent to the recipient's devices. One step is one
   hand-over along the path: submission (587), the MX lookup, the relay hop (25), delivery into the mailbox, then a
   fetch (IMAP 143 / POP3 110) or a read on one of the recipient's devices. The message is an envelope (MAIL FROM,
   RCPT TO, carried as SMTP commands) around the letter (header and body); every hop that receives it puts a
   Received: line on top, and final delivery adds Return-Path from the envelope. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. Addresses, host
   names, ports and the letter's text are data, not language. */
(function (root) {
  'use strict';

  var PORT = { submission: 587, relay: 25, imap: 143, pop3: 110 };

  /** Two scenes. lab: UL ch20's lab.example sends across to an invented second domain. grafo: URM ch14 Primjer 4,
      one server (192.168.1.99) for the whole firm, so the message never leaves it. Lanes: A sender's MUA, P the
      sending server (MSA and MTA), D DNS, M the receiving MTA, S the delivery agent and the mailbox, I the
      recipient's MUA (two devices). */
  var SCENES = {
    lab: {
      lanes: ['A', 'P', 'D', 'M', 'S', 'I'],
      client: 'democli1.lab.example',
      from: 'ana@lab.example', fakeFrom: 'direktor@lab.example', to: 'ivan@drugdje.example',
      subject: 'Raspored laboratorija', body: 'Ivane, u prilogu je raspored za petak.',
      host: { P: 'posluzitelj.lab.example', M: 'mx.drugdje.example', S: 'mx.drugdje.example' },
      local: ['lab.example'],
      // the zone order is not the preference order: the client sorts (rule 3)
      dns: {
        'lab.example': [{ pref: 10, host: 'posluzitelj.lab.example' }],
        'drugdje.example': [{ pref: 20, host: 'mx2.drugdje.example' }, { pref: 10, host: 'mx.drugdje.example' }]
      }
    },
    grafo: {
      lanes: ['A', 'P', 'S', 'I'],
      client: '[192.168.1.23]',
      from: 'marko@grafo.hr', fakeFrom: 'direktor@grafo.hr', to: 'petar@grafo.hr',
      subject: 'Narudžba 118', body: 'Petre, narudžba 118 ide u proizvodnju u ponedjeljak.',
      host: { P: '[192.168.1.99]', S: '[192.168.1.99]' },
      local: ['grafo.hr'],
      dns: { 'grafo.hr': [{ pref: 10, host: '[192.168.1.99]' }] }
    }
  };

  var DEVICES = ['phone', 'computer'];

  /** The presets' scripts: the scene and what the recipient's devices do after delivery ([kind, device]). */
  var SCRIPTS = {
    'two-domains': { scene: 'lab', after: [['fetch', 'phone'], ['fetch', 'computer']] },
    'urm-two-devices': { scene: 'grafo', after: [['fetch', 'phone'], ['read', 'phone'], ['fetch', 'computer']] },
    'envelope-vs-header': { scene: 'lab', after: [['fetch', 'computer']] },
    'no-auth-submission': { scene: 'lab', after: [['fetch', 'phone'], ['fetch', 'computer']] }
  };

  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function sceneOf(p) { return SCRIPTS[p.script].scene; }
  function domainOf(addr) { return String(addr).split('@')[1].toLowerCase(); }

  // ── rules ──

  /** Rule 3: the MX record with the lowest preference wins. Tie-break: equal preference → the first listed (RFC 5321
      §5.1 says pick at random; a deterministic model takes the first). */
  function pickMx(records) {
    var best = null;
    records.forEach(function (r) { if (!best || r.pref < best.pref) best = r; });
    return best;
  }

  /** Rules 3 and 5: the next hop is decided by the envelope's RCPT TO domain, never the header's To:. A domain this
      server hosts is delivered here (no MX lookup, no relay); otherwise the MX lookup names the next MTA. */
  function route(scene, msg) {
    var sc = SCENES[scene], domain = domainOf(msg.envelope.rcptTo[0]);
    if (sc.local.indexOf(domain) >= 0) return { local: true, domain: domain };
    var records = sc.dns[domain] || [];
    var pick = pickMx(records);
    return { local: false, domain: domain, records: records, host: pick ? pick.host : null, pref: pick ? pick.pref : null };
  }

  /** Rule 4 (and RFC 5321 §4.4): a hop that receives the message puts one Received: line on top and changes nothing
      else. Returns a new message. */
  function trace(msg, from, by, via) {
    var m = copy(msg);
    m.received.unshift({ from: from, by: by, with: via });
    return m;
  }

  /** Rule 6 (RFC 5321 §4.4): final delivery writes the envelope's MAIL FROM into Return-Path, on top. */
  function finalDelivery(msg, by) {
    var m = trace(msg, by, by, 'LMTP');
    m.returnPath = m.envelope.mailFrom;
    return m;
  }

  /** Rule 1: the MSA refuses MAIL from a session that has not authenticated. */
  function submissionReply(authenticated) {
    return authenticated ? { ok: true, code: 250 } : { ok: false, code: 530, enh: '5.7.0' };
  }

  /** The message as the sender's MUA hands it over. With headerFromDiffers the header says someone else (rule 5). */
  function compose(scene, p) {
    var sc = SCENES[scene];
    return {
      envelope: { mailFrom: sc.from, rcptTo: [sc.to] },
      header: { from: p.headerFromDiffers ? sc.fakeFrom : sc.from, to: sc.to, subject: sc.subject },
      body: sc.body, received: [], returnPath: null
    };
  }

  /** Every hand-over of a run, in order. Without a login the run is the refused attempt and nothing else. */
  function plan(p) {
    var scene = sceneOf(p);
    if (!p.authenticated) return [{ kind: 'try' }, { kind: 'refuse' }];
    var out = [{ kind: 'submit' }];
    var r = route(scene, compose(scene, p));
    if (r.local) out.push({ kind: 'local' });
    else out.push({ kind: 'mx' }, { kind: 'relay' });
    out.push({ kind: 'deliver' });
    SCRIPTS[p.script].after.forEach(function (a) { out.push({ kind: a[0], device: a[1] }); });
    return out;
  }

  /** The rows of the chart, as data: one per step (two for the MX lookup: the query and the answer). */
  function row(n, from, to, kind, extra) {
    var r = { n: n, from: from, to: to, kind: kind };
    Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; });
    return r;
  }

  var logic = {
    PORT: PORT, SCENES: SCENES, SCRIPTS: SCRIPTS, DEVICES: DEVICES,
    sceneOf: sceneOf, domainOf: domainOf, pickMx: pickMx, route: route, trace: trace, finalDelivery: finalDelivery,
    submissionReply: submissionReply, compose: compose, plan: plan,

    defaults: { script: 'two-domains', fetch: 'imap', headerFromDiffers: false, authenticated: true },

    steps: function (p) { return plan(p).length; },

    initial: function (p) {
      var scene = sceneOf(p);
      return {
        n: 0, scene: scene, hop: 'start', ev: { kind: 'start' }, done: false,
        at: 'A',
        msg: compose(scene, p),
        mx: null,
        store: { messages: [] },
        devices: DEVICES.map(function (d) { return { id: d, proto: p.fetch, sees: [], synced: false }; }),
        log: [],
        rows: [],
        refused: null
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev), all = plan(p), x = all[n - 1];
      var scene = s.scene, sc = SCENES[scene];
      s.n = n;
      s.done = n >= all.length;
      if (!x) { s.ev = { kind: 'idle' }; return s; }
      s.hop = x.kind;
      switch (x.kind) {
        case 'try': {
          // the MUA opens a submission session without logging in and gives MAIL FROM
          s.rows.push(row(n, 'A', 'P', 'smtp', { port: PORT.submission, auth: false, mailFrom: s.msg.envelope.mailFrom }));
          s.ev = { kind: 'try', port: PORT.submission };
          break;
        }
        case 'refuse': {
          var rep = submissionReply(false);
          s.refused = { code: rep.code, enh: rep.enh };
          s.rows.push(row(n, 'P', 'A', 'reply', { code: rep.code, enh: rep.enh }));
          s.log.push({ n: n, host: sc.host.P, role: 'receive', port: PORT.submission, from: s.msg.envelope.mailFrom, status: 'reject', code: rep.code + ' ' + rep.enh });
          s.ev = { kind: 'refuse', code: rep.code, enh: rep.enh };
          break;
        }
        case 'submit': {
          s.msg = trace(s.msg, sc.client, sc.host.P, 'ESMTPSA');
          s.at = 'P';
          s.rows.push(row(n, 'A', 'P', 'smtp', { port: PORT.submission, auth: true, mailFrom: s.msg.envelope.mailFrom, rcptTo: s.msg.envelope.rcptTo.slice() }));
          s.log.push({ n: n, host: sc.host.P, role: 'receive', port: PORT.submission, from: s.msg.envelope.mailFrom, to: s.msg.envelope.rcptTo[0], status: 'accepted', auth: sc.from.split('@')[0] });
          s.ev = { kind: 'submit', port: PORT.submission };
          break;
        }
        case 'local': {
          var rl = route(scene, s.msg);
          s.rows.push(row(n, 'P', 'P', 'note-local', { domain: rl.domain }));
          s.ev = { kind: 'local', domain: rl.domain };
          break;
        }
        case 'mx': {
          var r = route(scene, s.msg);
          s.mx = { domain: r.domain, records: r.records, host: r.host, pref: r.pref };
          s.rows.push(row(n, 'P', 'D', 'dns-q', { domain: r.domain }));
          s.rows.push(row(n, 'D', 'P', 'dns-a', { host: r.host, pref: r.pref }));
          s.ev = { kind: 'mx', domain: r.domain, host: r.host, pref: r.pref, count: r.records.length };
          break;
        }
        case 'relay': {
          var to = s.mx.host;
          s.msg = trace(s.msg, sc.host.P, to, 'ESMTP');
          s.at = 'M';
          s.rows.push(row(n, 'P', 'M', 'smtp', { port: PORT.relay, auth: null, mailFrom: s.msg.envelope.mailFrom, rcptTo: s.msg.envelope.rcptTo.slice() }));
          s.log.push({ n: n, host: sc.host.P, role: 'send', port: PORT.relay, relay: to, to: s.msg.envelope.rcptTo[0], status: 'sent' });
          s.log.push({ n: n, host: to, role: 'receive', port: PORT.relay, from: s.msg.envelope.mailFrom, to: s.msg.envelope.rcptTo[0], status: 'accepted', client: sc.host.P });
          s.ev = { kind: 'relay', port: PORT.relay, to: to };
          break;
        }
        case 'deliver': {
          var mta = s.at;
          s.msg = finalDelivery(s.msg, sc.host.S);
          s.at = 'S';
          s.store.messages.push({ id: 1, seen: false, deleted: false });
          s.rows.push(row(n, mta, 'S', 'deliver', { mailbox: s.msg.envelope.rcptTo[0] }));
          s.log.push({ n: n, host: sc.host.S, role: 'deliver', to: s.msg.envelope.rcptTo[0], status: 'delivered' });
          s.ev = { kind: 'deliver', from: mta };
          break;
        }
        case 'fetch': {
          // rule 7: a fetch is IMAP or POP3, never SMTP
          var dev = s.devices.filter(function (d) { return d.id === x.device; })[0];
          var live = s.store.messages.filter(function (m) { return !m.deleted; });
          var proto = p.fetch, got = 0;
          if (proto === 'imap') {
            // IMAP lists the mailbox as it stands on the server, flags included; nothing leaves the server
            dev.sees = live.map(function (m) { return { id: m.id, seen: m.seen }; });
            got = live.length;
          } else {
            // POP3 with delete: download (RETR), mark (DELE); the server removes them when the session ends (QUIT)
            live.forEach(function (m) {
              if (!dev.sees.some(function (k) { return k.id === m.id; })) dev.sees.push({ id: m.id, seen: false });
              m.deleted = true;
            });
            got = live.length;
          }
          dev.synced = true;
          dev.proto = proto;
          // POP3 took the only copy: from now on the device holds the message, not the mailbox
          if (proto === 'pop3' && got > 0) s.at = 'I';
          s.rows.push(row(n, 'I', 'S', proto, { port: PORT[proto], device: x.device, count: got, removed: proto === 'pop3' && got > 0 }));
          s.ev = { kind: 'fetch', device: x.device, proto: proto, port: PORT[proto], count: got,
            seen: live.length ? live[0].seen : null, removed: proto === 'pop3' ? got : 0 };
          break;
        }
        case 'read': {
          var d = s.devices.filter(function (k) { return k.id === x.device; })[0];
          var mine = d.sees[0];
          var onServer = false;
          if (mine) {
            mine.seen = true;
            if (p.fetch === 'imap') {
              // IMAP keeps the state on the server: opening the message sets its \Seen flag there
              var m = s.store.messages.filter(function (k) { return k.id === mine.id && !k.deleted; })[0];
              if (m) { m.seen = true; onServer = true; }
            }
          }
          if (onServer) s.rows.push(row(n, 'I', 'S', 'imap-seen', { port: PORT.imap, device: x.device }));
          else s.rows.push(row(n, 'I', 'I', 'note-read', { device: x.device }));
          s.ev = { kind: 'read', device: x.device, proto: p.fetch, onServer: onServer, had: !!mine };
          break;
        }
      }
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
