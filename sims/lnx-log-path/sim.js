/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-log-path: the path of one log message. The sender emits it, journald stores it, rsyslog reads it from
   journald (imjournal) and runs it past every rule of /etc/rsyslog.conf in file order; every matching rule's action
   fires (a file, all terminals, or forwarding to a server). Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Severity names by number, 0 most severe (RFC 5424 §6.2.1). */
  var SEVERITIES = ['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug'];

  /** Facility numbers (RFC 5424 §6.2.1; Linux syslog.h: cron 9, authpriv 10). */
  var FACILITIES = { kern: 0, user: 1, mail: 2, daemon: 3, cron: 9, authpriv: 10 };
  /** The order the page offers them in. */
  var FACILITY_IDS = ['user', 'authpriv', 'mail', 'cron', 'kern', 'daemon'];

  var CONF = '/etc/rsyslog.conf';
  /** The rules of /etc/rsyslog.conf on the book machine, in file order (UL ch13). */
  var RULES = [
    { selector: '*.info;mail.none;authpriv.none;cron.none', action: 'action(type="omfile" file="/var/log/messages")', kind: 'file', target: '/var/log/messages', file: CONF },
    { selector: 'authpriv.*', action: 'action(type="omfile" file="/var/log/secure")', kind: 'file', target: '/var/log/secure', file: CONF },
    { selector: 'mail.*', action: 'action(type="omfile" file="/var/log/maillog" sync="on")', kind: 'file', target: '/var/log/maillog', file: CONF },
    { selector: 'cron.*', action: 'action(type="omfile" file="/var/log/cron")', kind: 'file', target: '/var/log/cron', file: CONF },
    { selector: '*.emerg', action: 'action(type="omusrmsg" users="*")', kind: 'users', target: '*', file: CONF }
  ];
  /** The client's forwarding rule, /etc/rsyslog.d/90-slanje.conf on democli1 (UL ch13). rsyslog.conf includes
      /etc/rsyslog.d/*.conf before its own rules, so this rule is read first (and the client's log calls it action-1). */
  var FORWARD = { selector: '*.*', action: 'action(type="omfwd" target="192.168.122.57" port="514" protocol="tcp")', kind: 'forward', target: '192.168.122.57:514', file: '/etc/rsyslog.d/90-slanje.conf' };

  var SERVER = { host: 'demosrv1', addr: '192.168.122.57', port: 514, proto: 'tcp', file: '/var/log/messages' };
  /** What the server's /var/log/messages holds before the demo (UL ch13: two klijent lines, 18:08:39 and 18:09:03). */
  var SERVER_BEFORE = [
    { time: '18:08:39', text: 'democli1 klijent[9366]: poruka s klijenta democli1' },
    { time: '18:09:03', text: 'democli1 klijent[9439]: prva poruka s klijenta' }
  ];
  /** The client's rsyslog about its forwarding action (UL ch13, journalctl -u rsyslog on democli1; lines cut as there). */
  var RSYSLOGD = { tag: 'rsyslogd', pid: 9360 };
  var SUSPENDED = [
    { time: '18:09:20', text: "action 'action-1-builtin:omfwd' suspended" },
    { time: '18:09:20', text: 'cannot connect to 192.168.122.57:514' }
  ];
  var RESUMED = { time: '18:09:58', text: "action 'action-1-builtin:omfwd' resumed" };
  var CHECKED = '18:10:43';

  var FILES = ['/var/log/messages', '/var/log/secure', '/var/log/maillog', '/var/log/cron'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── selectors ──

  /** 'a,b.sev;c.none' → [{ facs: ['a', 'b'], sev: 'sev' }, { facs: ['c'], sev: 'none' }]. */
  function parseSelector(sel) {
    return String(sel).split(';').map(function (term) {
      var dot = term.lastIndexOf('.');
      return { facs: term.slice(0, dot).split(','), sev: term.slice(dot + 1) };
    });
  }

  /** Whether one term's severity part takes severity number sev (rule 4: itself and every more severe one). */
  function sevTakes(part, sev) {
    if (part === 'none') return false;
    if (part === '*') return true;
    return sev <= SEVERITIES.indexOf(part);
  }

  /**
   * Whether selector sel takes a message of facility fac (a name) and severity sev (a number), and which term decided
   * (rule 3): terms are read left to right and the last one that names the facility (or '*') decides. No term names
   * it: no match, term -1.
   */
  function matchSelector(sel, fac, sev) {
    var terms = parseSelector(sel);
    var term = -1;
    terms.forEach(function (tm, i) {
      if (tm.facs.indexOf('*') >= 0 || tm.facs.indexOf(fac) >= 0) term = i;
    });
    return { match: term >= 0 && sevTakes(terms[term].sev, sev), term: term };
  }

  /** PRI = facility × 8 + severity (RFC 5424 §6.2.1). */
  function pri(fac, sev) { return FACILITIES[fac] * 8 + sev; }

  // ── the message ──

  /** The sender and the message for a facility (SPEC.md "Senders"). */
  function messageFor(p) {
    var sev = SEVERITIES.indexOf(p.severity);
    var base = { facility: p.facility, severity: sev };
    var m;
    switch (p.facility) {
      case 'authpriv':
        m = { sender: 'sshd-session', tag: 'sshd-session', pid: 57230, text: 'Accepted publickey for student from 192.168.122.1', transport: 'syslog' };
        break;
      case 'cron':
        m = { sender: 'CROND', tag: 'CROND', pid: 55240, text: '(root) CMD (run-parts /etc/cron.hourly)', transport: 'syslog' };
        break;
      case 'daemon':
        m = { sender: 'systemd', tag: 'systemd', pid: 1, text: 'Started session-701.scope - Session 701 of User student.', transport: 'journal' };
        break;
      case 'kern':
        m = { sender: 'kernel', tag: 'kernel', pid: null, text: 'virtio_net virtio0 enp1s0: renamed from eth0', transport: 'kernel' };
        break;
      default:
        if (p.remote && p.facility === 'user') {
          m = { sender: 'logger', tag: 'klijent', pid: 9512, text: p.serverUp ? 'treća poruka s klijenta' : 'poruka dok je poslužitelj ugašen', transport: 'syslog' };
        } else {
          m = { sender: 'logger', tag: 'proba', pid: 57063, text: 'poruka iz 13. poglavlja', transport: 'syslog' };
        }
    }
    return Object.assign(base, m);
  }

  /** The logger command for a logger message (null for other senders). The remote message uses logger's default. */
  function commandOf(msg, p) {
    if (msg.sender !== 'logger') return null;
    var prio = msg.tag === 'klijent' && msg.facility === 'user' && msg.severity === 5 ? '' : ' -p ' + msg.facility + '.' + SEVERITIES[msg.severity];
    return 'logger -t ' + msg.tag + prio + " '" + msg.text + "'";
  }

  /** tag[pid], or the tag alone (the kernel has no PID). */
  function ident(msg) { return msg.pid == null ? msg.tag : msg.tag + '[' + msg.pid + ']'; }
  /** The line a file gets (no time stamp: out of scope, SPEC.md). */
  function lineOf(msg, host) { return host + ' ' + ident(msg) + ': ' + msg.text; }

  function hostOf(p) { return p.remote ? 'democli1' : 'demosrv1'; }
  /** The rules in the order rsyslog reads them: the included file's rule first (rule 7), then rsyslog.conf's own. */
  function rulesOf(p) { return p.remote ? [FORWARD].concat(RULES) : RULES.slice(); }
  function journalPath(storage) { return storage === 'volatile' ? '/run/log/journal' : '/var/log/journal'; }

  /** Steps: sender, journald, rsyslog, one per rule, the server (remote only), the summary (SPEC.md "One step"). */
  function stepsOf(p) { return 3 + rulesOf(p).length + (p.remote ? 1 : 0) + 1; }

  /** What step n does: { kind, rule }. */
  function phaseOf(n, p) {
    var nRules = rulesOf(p).length;
    if (n === 1) return { kind: 'emit' };
    if (n === 2) return { kind: 'store' };
    if (n === 3) return { kind: 'read' };
    if (n <= 3 + nRules) return { kind: 'rule', rule: n - 4 };
    if (p.remote && n === 4 + nRules) return { kind: 'server' };
    return { kind: 'done' };
  }

  function addRecord(s, where, status) {
    if (!s.records.some(function (r) { return r.where === where; })) s.records.push({ where: where, status: status });
  }

  var logic = {
    SEVERITIES: SEVERITIES,
    FACILITIES: FACILITIES,
    FACILITY_IDS: FACILITY_IDS,
    RULES: RULES,
    FORWARD: FORWARD,
    SERVER: SERVER,
    CHECKED: CHECKED,
    FILES: FILES,
    parseSelector: parseSelector,
    matchSelector: matchSelector,
    pri: pri,
    messageFor: messageFor,
    commandOf: commandOf,
    ident: ident,
    lineOf: lineOf,
    journalPath: journalPath,
    rulesOf: rulesOf,
    phaseOf: phaseOf,

    /** Parameter defaults (task "Params"). */
    defaults: { facility: 'user', severity: 'notice', storage: 'persistent', remote: false, serverUp: true },

    /** 9 steps; 11 with the forwarding rule and the server. */
    steps: stepsOf,

    /** State at step 0: the message is not sent yet. */
    initial: function (p) {
      var files = {};
      FILES.forEach(function (f) { files[f] = []; });
      var rules = rulesOf(p);
      return {
        msg: messageFor(p),
        host: hostOf(p),
        at: null,
        journal: [],
        storage: p.storage,
        rules: rules,
        ruleResults: rules.map(function () { return null; }),
        ruleTerms: rules.map(function () { return null; }),
        files: files,
        terminals: [],
        remote: p.remote ? { up: !!p.serverUp, received: clone(SERVER_BEFORE), inFlight: false, suspended: false, resumed: false, checked: null } : null,
        records: [],
        event: { kind: 'start', changed: [] }
      };
    },

    /** State after step n, from the state after step n - 1. */
    step: function (prev, n, p) {
      var s = clone(prev);
      var ph = phaseOf(n, p);
      var msg = s.msg;
      var ev = { kind: ph.kind, changed: [] };
      switch (ph.kind) {
        case 'emit':
          s.at = 'sender';
          ev.changed.push('token');
          break;
        case 'store':
          // rule 1: journald takes every message, whatever rsyslog will do with it
          s.at = 'journald';
          s.journal.push({ id: 'msg', PRIORITY: msg.severity, SYSLOG_FACILITY: FACILITIES[msg.facility], SYSLOG_IDENTIFIER: msg.tag,
            _PID: msg.pid, MESSAGE: msg.text, _TRANSPORT: msg.transport });
          addRecord(s, 'journal', 'yes');
          ev.changed.push('journal');
          break;
        case 'read':
          // rule 2: rsyslog reads journald's entry (imjournal); the socket input is off
          s.at = 'rsyslog';
          ev.changed.push('rsyslog');
          break;
        case 'rule': {
          // rule 5: every rule is evaluated, every match fires
          var i = ph.rule, r = s.rules[i];
          var m = matchSelector(r.selector, msg.facility, msg.severity);
          s.at = i;
          s.ruleResults[i] = m.match;
          s.ruleTerms[i] = m.term;
          ev.rule = i;
          ev.term = m.term;
          ev.match = m.match;
          if (m.match) {
            if (r.kind === 'file') {
              s.files[r.target].push(lineOf(msg, s.host));
              addRecord(s, r.target, 'yes');
              ev.changed.push('file:' + r.target);
            } else if (r.kind === 'users') {
              s.terminals.push(ident(msg) + ': ' + msg.text);
              addRecord(s, 'terminals', 'yes');
              ev.changed.push('terminals');
            } else if (s.remote.up) {
              s.remote.inFlight = true;
              ev.changed.push('wire');
            } else {
              // rule 7: target down: the action is suspended, and the client's own journal says so
              s.remote.suspended = true;
              SUSPENDED.forEach(function (e, k) {
                s.journal.push({ id: 'rs' + k, SYSLOG_IDENTIFIER: RSYSLOGD.tag, _PID: RSYSLOGD.pid, MESSAGE: e.text, time: e.time });
              });
              ev.changed.push('suspended', 'journal-own');
            }
          }
          break;
        }
        case 'server':
          s.at = 'server';
          if (s.remote.inFlight) {
            s.remote.inFlight = false;
            s.remote.received.push({ time: null, text: lineOf(msg, s.host) });
            addRecord(s, 'remote', 'yes');
            ev.changed.push('server');
          } else if (s.remote.suspended) {
            // rule 7: resumed later; at 18:10:43 the server still has only the lines from before; where the message is,
            // no output shows (the queue decides)
            s.remote.resumed = true;
            s.remote.checked = CHECKED;
            s.journal.push({ id: 'rs-resumed', SYSLOG_IDENTIFIER: RSYSLOGD.tag, _PID: RSYSLOGD.pid, MESSAGE: RESUMED.text, time: RESUMED.time });
            addRecord(s, 'remote', 'unknown');
            ev.changed.push('resumed', 'journal-own', 'checked');
          }
          break;
        default:
          s.at = 'done';
          ev.changed.push('records');
      }
      s.event = ev;
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
