/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-domain-join: PC07 joins quillmoor.example. It finds a DC by DNS (SRV record, then an LDAP ping), the
   joining user creates the computer object CN=PC07 (within ms-DS-MachineAccountQuota), the client sets the machine
   password p0 on it and keeps it as an LSA secret, and after the restart Netlogon builds the secure channel with it.
   The revert scenario starts from a joined PC07: a snapshot on day 0, the client's password changes every 30 days,
   the snapshot is reverted, and the secure channel works only while the client's password is the object's current or
   previous one; an administrator's reset puts the pair in step again. One step = one message or one event.
   Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var DOMAIN = 'quillmoor.example';
  var NETBIOS = 'QUILLMOOR';
  var DC = { name: 'DC01', fqdn: 'DC01.' + DOMAIN, ip: '10.10.0.10' };
  var CLIENT = { name: 'PC07', ip: '10.10.20.57' };
  var PUBLIC_DNS = '198.51.100.53';
  var DNS_IP = { dc01: DC.ip, public: PUBLIC_DNS };
  var USER = 'ana';
  var ADMIN = 'admin';
  var DN = 'CN=PC07,CN=Computers,DC=quillmoor,DC=example';
  /** ms-DS-MachineAccountQuota default (rule 2). */
  var QUOTA = 10;
  /** Domain member: Maximum machine account password age, default in days (rule 5). */
  var MAX_AGE = 30;
  var LDAP_PORT = 389;

  // ── the rules, as pure functions ──

  /** Rule 1: the SRV name a client asks for to find a DC of the domain. */
  function srvName(domain) { return '_ldap._tcp.dc._msdcs.' + domain; }

  /** Rule 1: the answer of the client's DNS server. Only DC01's DNS holds the domain's zones. */
  function locate(dnsServer) {
    if (dnsServer !== 'dc01') return { rcode: 'NXDOMAIN', target: null, port: null, ip: null };
    return { rcode: 'NOERROR', target: DC.fqdn, port: LDAP_PORT, ip: DC.ip };
  }

  /** Rule 2: an ordinary user who has created `count` computer objects may create one more while count < quota. */
  function mayCreate(count, quota) { return count < quota; }

  /** Rule 6, T3: which of the object's passwords the client's current one matches: 'cur', 'prev' or null. */
  function channelMatch(clientCur, obj) {
    if (clientCur === null || clientCur === undefined) return null;
    if (clientCur === obj.cur) return 'cur';
    if (obj.prev !== null && clientCur === obj.prev) return 'prev';
    return null;
  }

  /** Rules 5 and 8: a new password on one side; the old current becomes the previous. */
  function rotate(pwd, label) { return { cur: label, prev: pwd.cur }; }

  /** Rule 5, T2: is the client's copy due for a change on `day`? */
  function due(lastSet, day) { return lastSet !== null && day - lastSet >= MAX_AGE; }

  function label(n) { return 'p' + n; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ── the run ──

  function obj(s) { return s.dc.objects.PC07; }

  /** Rule 5, T1: the next password change before (or on) the revert day, or the revert. */
  function beforeRevert(s, p) {
    return s.client.lastSet + MAX_AGE <= p.snapshotAge ? 'change' : 'revert';
  }

  /** A change of the machine password by the client (rule 5) or by the administrator's reset (rule 8). */
  function newPassword(s) {
    var l = label(s.nextPwd++);
    s.client.pwd = rotate(s.client.pwd, l);
    s.client.lastSet = s.day;
    s.dc.objects.PC07.pwd = rotate(obj(s).pwd, l);
    return l;
  }

  /** The secure channel from the client's current password (rule 6). */
  function buildChannel(s) {
    var m = channelMatch(s.client.pwd.cur, obj(s).pwd);
    s.secureChannel = m ? 'ok' : 'broken';
    return { kind: 'channel', pwd: s.client.pwd.cur, obj: clone(obj(s).pwd), match: m, ok: !!m };
  }

  var logic = {
    /** Parameter defaults. */
    defaults: { scenario: 'join', dnsServer: 'dc01', joinsByUser: 0, snapshotAge: 65 },

    DOMAIN: DOMAIN,
    NETBIOS: NETBIOS,
    DC: DC,
    CLIENT: CLIENT,
    PUBLIC_DNS: PUBLIC_DNS,
    USER: USER,
    ADMIN: ADMIN,
    DN: DN,
    QUOTA: QUOTA,
    MAX_AGE: MAX_AGE,
    SCENARIOS: ['join', 'revert'],
    DNS_SERVERS: ['dc01', 'public'],

    /** Steps for these params: until the run ends (join 8, wrong DNS 3, quota 5, revert 4 to 10). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 30) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0. join: PC07 in a workgroup, no object. revert: PC07 joined on day 0 with p0, channel ok. */
    initial: function (p) {
      var revert = p.scenario === 'revert';
      var dns = revert ? 'dc01' : p.dnsServer;
      var s = {
        scenario: revert ? 'revert' : 'join',
        day: 0,
        client: {
          name: CLIENT.name, ip: CLIENT.ip, dns: DNS_IP[dns] || DNS_IP.dc01, joined: revert, dc: revert ? DC.name : null,
          pwd: revert ? { cur: 'p0', prev: null } : { cur: null, prev: null },
          lastSet: revert ? 0 : null,
          snapshot: null,
          restart: false,
          reverted: false
        },
        dc: {
          objects: revert ? { PC07: { dn: DN, pwd: { cur: 'p0', prev: null } } } : {},
          quota: { user: USER, count: revert ? 1 : Math.max(0, Math.min(QUOTA, Number(p.joinsByUser) || 0)), max: QUOTA }
        },
        secureChannel: revert ? 'ok' : 'none',
        logon: null,
        nextPwd: revert ? 1 : 0,
        phase: revert ? 'snapshot' : 'srvQuery',
        result: null,
        log: []
      };
      return s;
    },

    /** State after step n: one message or one event more. */
    step: function (s0, n, p) {
      var s = clone(s0);
      var c = s.client;
      var e;
      switch (s.phase) {
        // ── join (rules 1–4) ──
        case 'srvQuery':
          e = { kind: 'srvQuery', q: srvName(DOMAIN), server: c.dns };
          s.phase = 'srvAnswer';
          break;
        case 'srvAnswer': {
          var a = locate(s.client.dns === DC.ip ? 'dc01' : 'public');
          e = { kind: 'srvAnswer', rcode: a.rcode, target: a.target, port: a.port, ip: a.ip };
          s.phase = a.rcode === 'NOERROR' ? 'ping' : 'fail';
          break;
        }
        case 'fail':
          // rule 1, T5: no DC found, nothing created
          e = { kind: 'fail', reason: 'noDc' };
          s.result = 'noDc';
          s.phase = 'done';
          break;
        case 'ping':
          e = { kind: 'ping', to: DC.name, ip: DC.ip, port: LDAP_PORT };
          s.phase = 'pong';
          break;
        case 'pong':
          e = { kind: 'pong', dc: DC.name, domain: DOMAIN, netbios: NETBIOS };
          c.dc = DC.name;
          s.phase = 'create';
          break;
        case 'create': {
          // rule 2: the joining user creates the object, within the quota
          var q = s.dc.quota;
          var ok = mayCreate(q.count, q.max);
          e = { kind: 'create', user: q.user, count: q.count, max: q.max, ok: ok, dn: DN };
          if (ok) {
            q.count++;
            s.dc.objects.PC07 = { dn: DN, pwd: { cur: null, prev: null } };
            s.phase = 'setPwd';
          } else {
            s.result = 'quota';
            s.phase = 'done';
          }
          break;
        }
        case 'setPwd': {
          // rule 3: a random machine password on the object and as the client's LSA secret; restart required
          var l = label(s.nextPwd++);
          c.pwd = { cur: l, prev: null };
          c.lastSet = s.day;
          c.joined = true;
          c.restart = true;
          s.dc.objects.PC07.pwd = { cur: l, prev: null };
          e = { kind: 'setPwd', label: l };
          s.phase = 'restart';
          break;
        }
        case 'restart':
          e = { kind: 'restart' };
          c.restart = false;
          s.phase = 'channel';
          break;
        case 'channel':
          // rules 4, 6
          e = buildChannel(s);
          if (s.scenario === 'join') { s.result = e.ok ? 'joined' : 'broken'; s.phase = 'done'; }
          else s.phase = 'logon';
          break;

        // ── snapshot and revert (rules 5–8) ──
        case 'snapshot':
          c.snapshot = { day: s.day, pwd: clone(c.pwd), lastSet: c.lastSet };
          e = { kind: 'snapshot', pwd: clone(c.pwd) };
          s.phase = beforeRevert(s, p);
          break;
        case 'change': {
          // rule 5: client-initiated, over the secure channel; before the revert on its due day (T1), after it at once
          if (!c.reverted) s.day = c.lastSet + MAX_AGE;
          var from = c.pwd.cur;
          var nl = newPassword(s);
          e = { kind: 'change', from: from, label: nl, afterRevert: c.reverted, client: clone(c.pwd), obj: clone(obj(s).pwd) };
          s.phase = c.reverted ? 'done' : beforeRevert(s, p);
          if (c.reverted) s.result = 'ok';
          break;
        }
        case 'revert':
          // rule 7, T4: the client's secret and its date come back; the object and the label counter do not
          s.day = p.snapshotAge;
          e = { kind: 'revert', before: clone(c.pwd), after: clone(c.snapshot.pwd), snapshotDay: c.snapshot.day };
          c.pwd = clone(c.snapshot.pwd);
          c.lastSet = c.snapshot.lastSet;
          c.reverted = true;
          s.secureChannel = 'none';
          s.phase = 'channel';
          break;
        case 'logon': {
          // rule 4: a domain logon needs the secure channel
          var lok = s.secureChannel === 'ok';
          s.logon = lok ? 'ok' : 'refused';
          e = { kind: 'logon', user: USER, ok: lok };
          if (!lok) s.phase = 'reset';
          else if (s.result === 'repairing') { s.result = 'repaired'; s.phase = 'done'; }
          else if (due(c.lastSet, s.day)) s.phase = 'change';
          else { s.result = 'ok'; s.phase = 'done'; }
          break;
        }
        case 'reset': {
          // rule 8: the administrator resets the password on both sides, from the client
          var from2 = c.pwd.cur;
          var rl = newPassword(s);
          e = { kind: 'reset', by: ADMIN, from: from2, label: rl, client: clone(c.pwd), obj: clone(obj(s).pwd) };
          s.result = 'repairing';
          s.phase = 'channel';
          break;
        }
        default:
          return s;
      }
      e.n = n;
      e.day = s.day;
      s.log.push(e);
      return s;
    },

    // exported for the page and the tests
    srvName: srvName,
    locate: locate,
    mayCreate: mayCreate,
    channelMatch: channelMatch,
    rotate: rotate,
    due: due
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
