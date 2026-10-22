/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ssh-key-auth: SSH connections from democli1 (user student) to demosrv1 (192.168.122.57), and the two
   questions every connection answers. Question 1, "is this the right server?": the server presents its host key and
   the client compares it with ~/.ssh/known_hosts (known, unknown → ask, changed → refuse). Question 2, "who is the
   user?": publickey first (the key's public half must be in the server's authorized_keys), then password if the
   server allows it, else "Permission denied". A run is a preset's script of actions, then the actions the user queued
   with the buttons (param `queue`); one step is one phase of one action. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No words: the page words everything from codes. Host names, fingerprints
   and what the client prints in the terminal are data, not language. */
(function (root) {
  'use strict';

  var HOST = '192.168.122.57';
  var USER = 'student';
  var CLIENT = 'democli1';
  var SERVER = 'demosrv1';
  var SERVER_FQDN = 'demosrv1.lab.local';
  var KEY_TYPE = 'ED25519';
  var KNOWN_HOSTS = '/home/student/.ssh/known_hosts';
  var MAX_STEPS = 20;          // the contract's stepper limit: the buttons refuse what would pass it
  var MAX_QUEUE = 12;          // actions the user may queue on top of the script

  /** Host keys the server can have. The first is UL ch15's; the others are made up for the demo. A reinstall gets
      the next one; a reinstall never brings an old key back, so the buttons refuse N after the last. */
  var HOST_KEYS = [
    'SHA256:a8FjBS05WGhECCl2x0lY5eQjjVRGMGSZ5fx73CdxIBA',
    'SHA256:Vq7mK2pXc9dLr4TnZ0sWb8yHf3EuJ6gAo1iQ5RtYzMk',
    'SHA256:h3TzR8nLq0WcY5vKe2PmX7aDj9sFu4GbN1oIt6QyBpE',
    'SHA256:Zt4pWn7cQe2hKs9Lb0vXr5mFy8uGd3oAj6iTq1NwE0c'
  ];
  /** The user's key pair (UL ch15, id_ed25519 made on democli1). */
  var USER_FP = 'SHA256:ACblrDNUk04LEEIo5iREeR+wTCukWUMPd4zUB5lJCd0';
  /** Methods the server lists besides password (UL ch15 Primjer 2 transcript). Only publickey and password are tried
      here; the two GSSAPI methods are listed by the server and never used by this client. */
  var OTHER_METHODS = ['publickey', 'gssapi-keyex', 'gssapi-with-mic'];

  /** The presets' scripts: the state before step 1 and the actions. Setup `known` is the index into HOST_KEYS of
      the key the client has stored for HOST (null: none); `hostKey` the server's. Actions: connect (offer 'any' =
      key, then password; 'password' = the client refuses to use its key), reinstall (new host key), key (make the
      key pair if missing, then install its public half), pwset (toggle PasswordAuthentication), forget (remove
      the stored entries for HOST, after the new fingerprint was confirmed out of band). */
  var SCRIPTS = {
    'first-connection': { setup: { known: null, hostKey: 0, keyPair: false, installed: false, password: true },
      run: [{ a: 'connect' }] },
    'second-connection': { setup: { known: 0, hostKey: 0, keyPair: false, installed: false, password: true },
      run: [{ a: 'connect' }] },
    'host-key-changed': { setup: { known: 0, hostKey: 1, keyPair: true, installed: true, password: true },
      run: [{ a: 'connect' }, { a: 'forget' }, { a: 'connect' }] },
    'key-login': { setup: { known: 0, hostKey: 0, keyPair: false, installed: false, password: true },
      run: [{ a: 'key' }, { a: 'connect' }] },
    'password-off': { setup: { known: 0, hostKey: 0, keyPair: true, installed: true, password: false },
      run: [{ a: 'connect', offer: 'any' }, { a: 'connect', offer: 'password' }] }
  };

  /** Queue letters: one per button press (the page's keys). */
  var QUEUE = {
    S: { a: 'connect', offer: 'any' }, W: { a: 'connect', offer: 'password' },
    N: { a: 'reinstall' }, K: { a: 'key' }, P: { a: 'pwset' }, D: { a: 'forget' }
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function scriptOf(p) { return SCRIPTS[p.script] || SCRIPTS['first-connection']; }

  /** The whole run: the script's actions, then the queued ones. Connections without their own offer take 'any'. */
  function actions(p) {
    var out = scriptOf(p).run.map(function (x) { return { a: x.a, offer: x.offer || 'any' }; });
    String(p.queue || '').split('').forEach(function (ch) {
      var q = QUEUE[ch];
      if (q) out.push({ a: q.a, offer: q.offer || 'any' });
    });
    return out;
  }

  /** Methods the server lists after a failed attempt (RFC 4252 §5.1): password only while it is allowed. */
  function methods(server) { return OTHER_METHODS.concat(server.passwordAuth ? ['password'] : []); }

  /** Rule 2–4: what the client's known_hosts says about the key the server presented. Only lines for this host and
      this key type count. Tie-break: a line with the same key wins (known, the first such line), even when another
      line holds a different key; a different key and no same one → mismatch (the last differing line is the
      offending one: OpenSSH's check keeps the last it saw); no line → unknown. */
  function hostCheck(knownHosts, host, key) {
    var same = -1, other = -1;
    knownHosts.forEach(function (e, i) {
      if (e.host !== host || e.type !== key.type) return;
      if (e.fp === key.fp) { if (same < 0) same = i; } else other = i;
    });
    if (same >= 0) return { res: 'known', line: same + 1 };
    if (other >= 0) return { res: 'mismatch', line: other + 1 };
    return { res: 'unknown', line: null };
  }

  /** Rule 5–7: user authentication, in order. Returns the attempts (the messages) and the outcome: 'publickey'
      (accepted), 'password-prompt' (the server still offers password: the client asks the user), 'denied'. */
  function userAuth(client, server, offer) {
    var tries = [];
    var useKey = !!client.keyPair && offer !== 'password';
    if (useKey) {
      // the client sends its public key and a signature made with the private key; the private key stays (rule 6)
      var ok = server.authorizedKeys.indexOf(client.keyPair.fp) >= 0;
      tries.push({ m: 'publickey', fp: client.keyPair.fp, ok: ok });
      if (ok) return { tries: tries, out: 'publickey' };
    } else {
      // no key to offer: the "none" request asks which methods the server accepts (RFC 4252 §5.2)
      tries.push({ m: 'none', ok: false });
    }
    var list = methods(server);
    tries[tries.length - 1].list = list;
    return { tries: tries, out: list.indexOf('password') >= 0 ? 'password-prompt' : 'denied' };
  }

  function cmdLine(offer) {
    return '[' + USER + '@' + CLIENT + ' ~]$ ssh ' + (offer === 'password' ? '-o PubkeyAuthentication=no ' : '') +
      USER + '@' + HOST + " 'hostname'";
  }
  function deniedLine(list) { return USER + '@' + HOST + ': Permission denied (' + list.join(',') + ').'; }
  var AT = '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@';

  /** The first state of a run: the setup of its script. */
  function initial(p) {
    var su = scriptOf(p).setup;
    return {
      client: {
        knownHosts: su.known === null ? [] : [{ host: HOST, type: KEY_TYPE, fp: HOST_KEYS[su.known] }],
        keyPair: su.keyPair ? { fp: USER_FP } : null
      },
      server: {
        hostKey: { type: KEY_TYPE, fp: HOST_KEYS[su.hostKey] },
        authorizedKeys: su.installed ? [USER_FP] : [],
        passwordAuth: su.password
      },
      conn: null,          // the connection in progress or last made: { n, phase, offer, hostCheck, line, userAuth, outcome }
      prompt: null,        // { kind: 'host', fp } or { kind: 'password' } while the client waits for the user
      transcript: [],      // [{ text, n, prompt }]: what the client printed, n = the step that printed it
      rows: [],            // the chart: [{ k, n, conn, ... }] (the page draws them)
      at: 0,               // next action to start
      act: null,           // the action in progress: { a, offer, phase, done }
      conns: 0,            // connections started
      forgot: false,       // the host's known_hosts lines were removed and nothing stored since
      ev: { kind: 'start', script: p.script },
      marks: {}            // what changed this step: kh (known_hosts lines, 1-based), ak, removed, hostKey, pw, keyPair
    };
  }

  /** Phases of each action, in order; the next one depends on the state. */
  function nextPhase(s) {
    var x = s.act;
    if (!x || x.done) return null;
    switch (x.a) {
      case 'connect':
        if (!x.phase) return 'kex';
        if (x.phase === 'kex') return 'check';
        if (x.phase === 'check') return s.conn.hostCheck === 'unknown' ? 'answer' : 'auth';
        if (x.phase === 'answer') return 'auth';
        if (x.phase === 'auth') return 'password';
        return null;
      case 'key':
        if (!x.phase) return s.client.keyPair ? 'install' : 'keygen';
        if (x.phase === 'keygen') return 'install';
        return null;
      default:
        return x.phase ? null : x.a;
    }
  }

  function print(s, n, text, prompt) { s.transcript.push({ text: text, n: n, prompt: !!prompt }); }
  /** Typing at a prompt: the answer goes on the prompt's own line; nothing is echoed for a password. */
  function answerPrompt(s, n, text) {
    var last = s.transcript[s.transcript.length - 1];
    last.text += text;
    last.prompt = false;
    last.n = n;
  }

  /** State after step n, from the state after step n − 1. */
  function step(prev, n, p) {
    var s = clone(prev);
    s.marks = {};
    s.ev = { kind: 'idle' };
    if (!s.act || s.act.done) {
      var list = actions(p);
      if (s.at >= list.length) return s;               // past the end: nothing happens (steps() stops before)
      s.act = { a: list[s.at].a, offer: list[s.at].offer, phase: null, done: false };
      s.at++;
    }
    var ph = nextPhase(s);
    s.act.phase = ph;
    var c = s.conn, srv = s.server, cli = s.client;
    switch (ph) {
      // ── connect ──
      case 'kex':
        s.conns++;
        s.conn = c = { n: s.conns, phase: 'kex', offer: s.act.offer, hostCheck: null, line: null, userAuth: null, outcome: null };
        s.prompt = null;
        print(s, n, cmdLine(c.offer));
        s.rows.push({ k: 'kex', n: n, conn: c.n });
        s.rows.push({ k: 'hostkey', n: n, conn: c.n, fp: srv.hostKey.fp, type: srv.hostKey.type });
        s.ev = { kind: 'kex', conn: c.n, fp: srv.hostKey.fp, offer: c.offer, keyPair: !!cli.keyPair };
        break;
      case 'check': {
        var hc = hostCheck(cli.knownHosts, HOST, srv.hostKey);
        c.phase = 'check';
        c.hostCheck = hc.res;
        c.line = hc.line;
        s.rows.push({ k: 'check', n: n, conn: c.n, res: hc.res, line: hc.line });
        if (hc.res === 'unknown') {
          s.prompt = { kind: 'host', fp: srv.hostKey.fp };
          print(s, n, "The authenticity of host '" + HOST + ' (' + HOST + ")' can't be established.");
          print(s, n, KEY_TYPE + ' key fingerprint is ' + srv.hostKey.fp + '.');
          print(s, n, 'This key is not known by any other names.');
          print(s, n, 'Are you sure you want to continue connecting (yes/no/[fingerprint])? ', true);
        } else if (hc.res === 'mismatch') {
          [AT, '@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @', AT,
            'IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!',
            'Someone could be eavesdropping on you right now (man-in-the-middle attack)!',
            'It is also possible that a host key has just been changed.',
            'The fingerprint for the ' + KEY_TYPE + ' key sent by the remote host is',
            srv.hostKey.fp + '.',
            'Please contact your system administrator.',
            'Add correct host key in ' + KNOWN_HOSTS + ' to get rid of this message.',
            'Offending ' + KEY_TYPE + ' key in ' + KNOWN_HOSTS + ':' + hc.line,
            'Host key for ' + HOST + ' has changed and you have requested strict checking.',
            'Host key verification failed.'].forEach(function (t) { print(s, n, t); });
          c.outcome = 'refused';
          s.act.done = true;
        }
        // again: unknown because the user removed the host's line (not a first connection)
        s.ev = { kind: 'check', res: hc.res, line: hc.line, fp: srv.hostKey.fp, again: hc.res === 'unknown' && s.forgot,
          stored: hc.res === 'mismatch' ? cli.knownHosts[hc.line - 1].fp : null };
        break;
      }
      case 'answer': {
        var yes = p.answer !== 'no';
        c.phase = 'answer';
        s.prompt = null;
        answerPrompt(s, n, yes ? 'yes' : 'no');
        s.rows.push({ k: 'answer', n: n, conn: c.n, yes: yes });
        if (yes) {
          cli.knownHosts.push({ host: HOST, type: srv.hostKey.type, fp: srv.hostKey.fp });
          s.forgot = false;
          s.marks.kh = [cli.knownHosts.length];
          print(s, n, "Warning: Permanently added '" + HOST + "' (" + KEY_TYPE + ') to the list of known hosts.');
        } else {
          print(s, n, 'Host key verification failed.');
          c.outcome = 'declined';
          s.act.done = true;
        }
        s.ev = { kind: 'answer', yes: yes, line: yes ? cli.knownHosts.length : null, fp: srv.hostKey.fp };
        break;
      }
      case 'auth': {
        var ua = userAuth(cli, srv, c.offer);
        c.phase = 'auth';
        ua.tries.forEach(function (t) {
          s.rows.push({ k: t.m, n: n, conn: c.n, fp: t.fp || null });
          s.rows.push({ k: t.ok ? 'success' : 'failure', n: n, conn: c.n, list: t.list || null });
        });
        var tried = ua.tries[0];
        if (ua.out === 'publickey') {
          c.userAuth = 'publickey';
          c.outcome = 'session';
          s.rows.push({ k: 'session', n: n, conn: c.n });
          print(s, n, SERVER_FQDN);
          s.act.done = true;
        } else if (ua.out === 'password-prompt') {
          s.prompt = { kind: 'password' };
          print(s, n, USER + '@' + HOST + "'s password: ", true);
        } else {
          c.userAuth = 'denied';
          c.outcome = 'denied';
          s.rows.push({ k: 'denied', n: n, conn: c.n });
          print(s, n, deniedLine(tried.list));
          s.act.done = true;
        }
        s.ev = { kind: 'auth', out: ua.out, tried: tried.m, keyPair: !!cli.keyPair, offer: c.offer,
          fp: tried.fp || null, list: tried.list || null };
        break;
      }
      case 'password':
        c.phase = 'password';
        c.userAuth = 'password';
        c.outcome = 'session';
        s.prompt = null;
        answerPrompt(s, n, '');
        s.rows.push({ k: 'password', n: n, conn: c.n });
        s.rows.push({ k: 'success', n: n, conn: c.n, list: null });
        s.rows.push({ k: 'session', n: n, conn: c.n });
        print(s, n, SERVER_FQDN);
        s.act.done = true;
        s.ev = { kind: 'password' };
        break;
      // ── the admins' actions ──
      case 'reinstall': {
        var i = HOST_KEYS.indexOf(srv.hostKey.fp) + 1;
        var old = srv.hostKey.fp;
        s.act.done = true;
        if (i >= HOST_KEYS.length) { s.ev = { kind: 'reinstall', fp: null, old: old }; break; }   // canQueue never lets it come here
        srv.hostKey = { type: KEY_TYPE, fp: HOST_KEYS[i] };
        s.marks.hostKey = true;
        s.rows.push({ k: 'reinstall', n: n, fp: HOST_KEYS[i] });
        s.ev = { kind: 'reinstall', fp: HOST_KEYS[i], old: old };
        break;
      }
      case 'keygen':
        cli.keyPair = { fp: USER_FP };
        s.marks.keyPair = true;
        s.rows.push({ k: 'keygen', n: n, fp: USER_FP });
        s.ev = { kind: 'keygen', fp: USER_FP, hostFp: srv.hostKey.fp };
        break;
      case 'install': {
        // copying the public half needs a login: with no key in authorized_keys yet that is a password login, so
        // with PasswordAuthentication no the install is refused (the lockout UL ch15 Primjer 2 warns about)
        var dup = srv.authorizedKeys.indexOf(cli.keyPair.fp) >= 0;
        var refused = !dup && !srv.passwordAuth && !srv.authorizedKeys.length;
        if (!dup && !refused) { srv.authorizedKeys.push(cli.keyPair.fp); s.marks.ak = [srv.authorizedKeys.length]; }
        s.rows.push({ k: 'install', n: n, fp: cli.keyPair.fp, dup: dup, refused: refused });
        s.act.done = true;
        s.ev = { kind: 'install', fp: cli.keyPair.fp, dup: dup, refused: refused };
        break;
      }
      case 'pwset':
        srv.passwordAuth = !srv.passwordAuth;
        s.marks.pw = true;
        s.rows.push({ k: 'pwset', n: n, on: srv.passwordAuth });
        s.act.done = true;
        s.ev = { kind: 'pwset', on: srv.passwordAuth };
        break;
      case 'forget': {
        var removed = cli.knownHosts.filter(function (e) { return e.host === HOST; });
        cli.knownHosts = cli.knownHosts.filter(function (e) { return e.host !== HOST; });
        s.marks.removed = removed;
        if (removed.length) s.forgot = true;
        s.rows.push({ k: 'forget', n: n, count: removed.length });
        s.act.done = true;
        // changed: the removed lines held another key than the server has now (the case the warning was about)
        s.ev = { kind: 'forget', count: removed.length, fp: srv.hostKey.fp,
          changed: removed.some(function (e) { return e.fp !== srv.hostKey.fp; }) };
        break;
      }
    }
    return s;
  }

  /** Replay a run until the last action is done (bounded, so a bad queue cannot loop): its steps, and whether a
      reinstall ran out of new keys. */
  function runOf(p) {
    var s = initial(p), n = 0, noKey = false;
    var total = actions(p).length;
    while (n < 200 && (s.at < total || (s.act && !s.act.done))) {
      n++;
      s = step(s, n, p);
      if (s.ev.kind === 'reinstall' && !s.ev.fp) noKey = true;
    }
    return { steps: n, noKey: noKey };
  }
  function countSteps(p) { return runOf(p).steps; }

  /** May the user queue this letter? Only while the run stays within MAX_QUEUE actions and MAX_STEPS steps. */
  function canQueue(p, ch) {
    if (!QUEUE[ch]) return false;
    var q = String(p.queue || '');
    if (q.length >= MAX_QUEUE) return false;
    var run = runOf(Object.assign({}, p, { queue: q + ch }));
    return run.steps <= MAX_STEPS && !run.noKey;
  }

  var logic = {
    HOST: HOST, USER: USER, CLIENT: CLIENT, SERVER: SERVER, SERVER_FQDN: SERVER_FQDN, KEY_TYPE: KEY_TYPE,
    HOST_KEYS: HOST_KEYS, USER_FP: USER_FP, OTHER_METHODS: OTHER_METHODS, SCRIPTS: SCRIPTS, QUEUE: QUEUE,
    MAX_STEPS: MAX_STEPS, MAX_QUEUE: MAX_QUEUE,
    actions: actions, methods: methods, hostCheck: hostCheck, userAuth: userAuth, countSteps: countSteps, canQueue: canQueue,

    defaults: { script: 'first-connection', queue: '', answer: 'yes', offer: 'any' },

    steps: function (p) { return countSteps(p); },

    initial: initial,

    step: function (s, n, p) { return step(s, n, p); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
