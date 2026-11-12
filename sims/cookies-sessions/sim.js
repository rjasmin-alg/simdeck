/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cookies-sessions: a browser with a cookie jar, a shop (trgovina.example) with a server-side session table,
   and an unrelated site (drugi.example) with a link and a form that point at the shop. One step is one user action
   (the param `acts`, one letter each): (0) the browser drops expired cookies, (1) builds the request and decides which
   cookies to attach (rules 2–5), (2) the server looks the session up (rule 6) and answers, possibly with Set-Cookie,
   (3) the jar takes the Set-Cookie. Rules and numbers: SPEC.md. The message line format (`Name: value`) follows
   sims/http-exchange; the jar and the session table are new here.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: the page words everything from codes. Host names, paths,
   cookie names and values are data, not language. */
(function (root) {
  'use strict';

  var SHOP = 'trgovina.example';
  var OTHER = 'drugi.example';
  var USER = 'ana';
  var SIDS = ['a1b2', 'c3d4', 'e5f6', 'g7h8'];   // handed out in order, then s5, s6, …
  var STEP_S = 60;          // an action that sends requests: the clock moves one minute first
  var CLOSED_S = 300;       // closing the browser: opened again five minutes later
  var MAX_AGE = 3600;       // `persistent` on
  var MAX_STEPS = 20;
  var SAMESITE = ['Strict', 'Lax', 'None'];
  var SAFE = ['GET', 'HEAD'];

  /** The actions, by key letter. `shop`: the request to the shop; `via`: drugi.example's page is loaded first and
      is the initiator. */
  var ACTIONS = {
    P: { id: 'login', method: 'POST', path: '/prijava', kind: 'form' },
    G: { id: 'browse', method: 'GET', path: '/katalog', kind: 'navigation' },
    K: { id: 'cart', method: 'POST', path: '/kosarica', kind: 'form' },
    D: { id: 'link', method: 'GET', path: '/katalog', kind: 'navigation', via: OTHER },
    O: { id: 'form', method: 'POST', path: '/kosarica', kind: 'form', via: OTHER },
    X: { id: 'close' },
    Q: { id: 'logout', method: 'POST', path: '/odjava', kind: 'form' }
  };
  var KEYS = Object.keys(ACTIONS);

  var PRESETS = {
    'login-browse': { acts: 'GPKKG' },
    'lax-link-vs-form': { acts: 'PDOG' },
    strict: { acts: 'PGDG', sameSite: 'Strict' },
    'browser-closed': { acts: 'PGXG' },
    logout: { acts: 'PGQG' }
  };

  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function sidAt(i) { return i < SIDS.length ? SIDS[i] : 's' + (i + 1); }

  /** The run: the known action letters of `acts`, at most MAX_STEPS. */
  function actsOf(p) {
    return String(p.acts || '').toUpperCase().split('').filter(function (k) { return ACTIONS[k]; }).slice(0, MAX_STEPS);
  }
  /** `acts` after pressing `key` at step n: the action becomes step n + 1 and the rest of the run is dropped.
      null when the run would pass MAX_STEPS. */
  function press(acts, n, key) {
    var k = String(key).toUpperCase();
    if (!ACTIONS[k] || n >= MAX_STEPS) return null;
    return String(acts || '').toUpperCase().slice(0, n) + k;
  }

  // ── sites and matching (rules 2, 5) ──

  /** The site of a host: its last two labels (enough for *.example; a real browser uses the public suffix list). */
  function siteOf(host) { return host ? String(host).toLowerCase().split('.').slice(-2).join('.') : null; }
  /** Cross-site: the initiator's site differs from the target's. No initiator (typed, reopened): same-site. */
  function isCrossSite(req) { return !!req.initiator && siteOf(req.initiator) !== siteOf(req.host); }

  /** Rule 2, host-only cookies: the request host is the cookie's domain (case-insensitive). */
  function domainMatch(host, domain) { return String(host).toLowerCase() === String(domain).toLowerCase(); }
  /** Rule 2, RFC 6265 §5.1.4. */
  function pathMatch(reqPath, cookiePath) {
    if (reqPath === cookiePath) return true;
    if (reqPath.indexOf(cookiePath) !== 0) return false;
    return cookiePath.charAt(cookiePath.length - 1) === '/' || reqPath.charAt(cookiePath.length) === '/';
  }
  /** Rule 5: no SameSite attribute is treated as Lax. */
  function effectiveSameSite(c) { return c.sameSite || 'Lax'; }
  /** Rule 5 alone: may a cookie with this SameSite value go with this request? */
  function sameSiteAllows(sameSite, req) {
    if (!isCrossSite(req)) return true;
    if (sameSite === 'None') return true;
    if (sameSite === 'Strict') return false;
    // Lax: a top-level navigation (a link, or a form that navigates the tab) with a safe method; never a subresource
    return req.kind !== 'subresource' && SAFE.indexOf(req.method) >= 0;
  }

  /** Rules 2–5: why the cookie is not attached to the request (the first reason that applies), or null. */
  function whyNot(c, req, now) {
    if (c.expires !== null && c.expires <= now) return 'expired';
    if (!domainMatch(req.host, c.domain)) return 'domain';
    if (!pathMatch(req.path, c.path)) return 'path';
    if (c.secure && req.scheme !== 'https') return 'secure';
    if (!sameSiteAllows(effectiveSameSite(c), req)) return 'samesite';
    return null;
  }

  /** RFC 6265 §5.4 step 2: longer path first, then earlier creation, then name. */
  function headerOrder(a, b) {
    return b.path.length - a.path.length || a.created - b.created || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  }

  /** The cookies attached to a request and the decision for every cookie in the jar (jar order). */
  function attach(jar, req, now) {
    var decisions = jar.map(function (c) {
      var why = whyNot(c, req, now);
      return { name: c.name, domain: c.domain, path: c.path, sent: !why, why: why };
    });
    var sent = jar.filter(function (c, i) { return decisions[i].sent; }).slice().sort(headerOrder);
    return { sent: sent, decisions: decisions, header: sent.map(function (c) { return c.name + '=' + c.value; }).join('; ') };
  }

  /** Rule 3: the cookies scripts on a page of `host` can read (not HttpOnly). */
  function scriptVisible(jar, host, scheme) {
    return jar.filter(function (c) {
      return domainMatch(host, c.domain) && !c.httpOnly && !(c.secure && scheme !== 'https');
    }).map(function (c) { return c.name + '=' + c.value; });
  }

  // ── the jar (rules 4, 5; RFC 6265 §5.3) ──

  /** A Set-Cookie line as the shop writes it. */
  function setCookieLine(c) {
    var out = c.name + '=' + c.value;
    if (c.path) out += '; Path=' + c.path;
    if (c.secure) out += '; Secure';
    if (c.httpOnly) out += '; HttpOnly';
    if (c.sameSite) out += '; SameSite=' + c.sameSite;
    if (c.maxAge !== undefined && c.maxAge !== null) out += '; Max-Age=' + c.maxAge;
    return out;
  }

  /** Store one Set-Cookie (as an object { name, value, path, secure, httpOnly, sameSite, maxAge }) from `host`.
      Returns { jar, stored: bool, why }. Host-only: the domain is the request host. A None cookie without Secure is
      refused (rule 5). Max-Age ≤ 0 deletes. Same name, domain and path replaces and keeps the creation time. */
  function store(jar, sc, host, now) {
    if (sc.sameSite === 'None' && !sc.secure) return { jar: jar, stored: false, why: 'none-needs-secure' };
    var c = {
      name: sc.name, value: sc.value, domain: String(host).toLowerCase(), path: sc.path || '/',
      secure: !!sc.secure, httpOnly: !!sc.httpOnly, sameSite: sc.sameSite || null,
      expires: sc.maxAge === undefined || sc.maxAge === null ? null : now + sc.maxAge, created: now
    };
    var out = [], replaced = false;
    jar.forEach(function (o) {
      if (o.name === c.name && o.domain === c.domain && o.path === c.path) {
        replaced = true;
        c.created = o.created;
        if (c.expires === null || c.expires > now) out.push(c);
      } else out.push(o);
    });
    if (!replaced && (c.expires === null || c.expires > now)) out.push(c);
    var kept = c.expires === null || c.expires > now;
    return { jar: out, stored: kept, why: kept ? null : 'deleted' };
  }

  /** Rule 4: drop expired cookies (every step) and, when the browser closes, the session cookies. */
  function evict(jar, now, closing) {
    var kept = [], gone = [];
    jar.forEach(function (c) {
      if (c.expires !== null && c.expires <= now) gone.push({ name: c.name, domain: c.domain, path: c.path, why: 'expired' });
      else if (closing && c.expires === null) gone.push({ name: c.name, domain: c.domain, path: c.path, why: 'closed' });
      else kept.push(c);
    });
    return { jar: kept, gone: gone };
  }

  // ── the servers (rules 1, 6) ──

  /** Rule 1: the shop knows only what the request carries. The first sid sent, and its row if it has one. */
  function lookup(sessions, sent) {
    var sid = sent.filter(function (c) { return c.name === 'sid'; }).map(function (c) { return c.value; })[0] || null;
    var row = sid && Object.prototype.hasOwnProperty.call(sessions, sid) ? sessions[sid] : null;
    return { sid: sid, user: row ? row.user : null, stale: !!sid && !row };
  }

  /** The shop's answer to `req` (whose cookies are `sent`). Mutates the copy `s` (sessions, nextSid). */
  function shopServes(s, act, req, sent, p) {
    var who = lookup(s.sessions, sent);
    var res = { status: 200, setCookie: [], view: null, why: null, sid: who.sid, user: who.user, known: who.user, stale: who.stale, touched: null, deleted: null };
    if (act.id === 'login') {
      if (who.user) { res.view = 'already'; res.why = 'already'; }
      else {
        var sid = sidAt(s.nextSid++);
        s.sessions[sid] = { user: USER, cart: [] };
        res.setCookie.push({ name: 'sid', value: sid, path: '/', secure: true, httpOnly: true, sameSite: p.sameSite,
          maxAge: p.persistent ? MAX_AGE : null });
        res.view = 'welcome'; res.why = 'created'; res.user = USER; res.sid = sid; res.touched = sid;
      }
    } else if (act.id === 'browse' || act.id === 'link') {
      res.view = 'catalog'; res.why = who.user ? 'known' : who.stale ? 'stale' : 'anonymous';
    } else if (act.id === 'cart' || act.id === 'form') {
      if (who.user) {
        var cart = s.sessions[who.sid].cart;
        cart.push(act.id === 'form' ? 'x-' + (cart.filter(function (x) { return x.charAt(0) === 'x'; }).length + 1)
          : 'k-' + (cart.filter(function (x) { return x.charAt(0) === 'k'; }).length + 1));
        res.view = 'cart'; res.why = 'added'; res.touched = who.sid;
      } else { res.view = 'login-needed'; res.why = who.stale ? 'stale' : 'anonymous'; }
    } else if (act.id === 'logout') {
      if (who.user) {
        delete s.sessions[who.sid];
        res.view = 'bye'; res.why = 'deleted'; res.deleted = who.sid; res.user = null;
      } else { res.view = 'not-in'; res.why = who.stale ? 'stale' : 'anonymous'; }
    }
    return res;
  }

  /** drugi.example's answer: its page with the link and the form; on the first visit (no tema sent) its own cookie. */
  function otherServes(sent) {
    var has = sent.some(function (c) { return c.name === 'tema'; });
    return { status: 200, setCookie: has ? [] : [{ name: 'tema', value: 'tamna' }], view: 'other', why: null };
  }

  function request(act, host, path, method, kind, initiator) {
    return { scheme: 'https', host: host, path: path, method: method, kind: kind, initiator: initiator || null };
  }

  /** Rule 5 per SameSite value, for the shop's sid on this request (the comparison line on the page). */
  function verdicts(req) {
    var out = {};
    SAMESITE.forEach(function (v) { out[v] = sameSiteAllows(v, req); });
    return out;
  }

  /** One exchange: attach, serve, store. Mutates the copy `s`; returns the log rows and the request summary. */
  function exchange(s, act, req, p) {
    var a = attach(s.jar, req, s.now);
    // cookies of this host the browser holds back (SameSite, path, Secure): the chart draws them hollow
    var held = s.jar.filter(function (c, i) { return !a.decisions[i].sent && a.decisions[i].why !== 'domain'; })
      .map(function (c) { return c.name + '=' + c.value; });
    var isShop = req.host === SHOP;
    var res = isShop ? shopServes(s, act, req, a.sent, p) : otherServes(a.sent);
    var stored = [];
    res.setCookie.forEach(function (sc) {
      var r = store(s.jar, sc, req.host, s.now);
      s.jar = r.jar;
      if (r.stored) stored.push(sc.name);
    });
    var lane = isShop ? 'S' : 'D';
    var reqRow = { k: 'req', n: s.n, t: s.now, to: lane, method: req.method, path: req.path, cookie: a.header, held: held,
      cross: isCrossSite(req), user: isShop ? res.known : null };
    var resRow = { k: 'res', n: s.n, t: s.now, from: lane, status: res.status, setCookie: res.setCookie.map(setCookieLine) };
    return {
      rows: [reqRow, resRow],
      summary: {
        to: req.host, method: req.method, path: req.path, kind: req.kind, initiator: req.initiator,
        crossSite: isCrossSite(req), cookieSent: a.sent.map(function (c) { return c.name + '=' + c.value; }), header: a.header,
        decisions: a.decisions
      },
      res: res, stored: stored
    };
  }

  function sameRow(a, b) { return a.name === b.name && a.domain === b.domain && a.path === b.path; }

  var logic = {
    SHOP: SHOP, OTHER: OTHER, USER: USER, ACTIONS: ACTIONS, KEYS: KEYS, PRESETS: PRESETS, SAMESITE: SAMESITE,
    MAX_STEPS: MAX_STEPS, MAX_AGE: MAX_AGE, STEP_S: STEP_S, CLOSED_S: CLOSED_S,
    actsOf: actsOf, press: press, siteOf: siteOf, isCrossSite: isCrossSite, domainMatch: domainMatch, pathMatch: pathMatch,
    effectiveSameSite: effectiveSameSite, sameSiteAllows: sameSiteAllows, whyNot: whyNot, headerOrder: headerOrder,
    attach: attach, scriptVisible: scriptVisible, setCookieLine: setCookieLine, store: store, evict: evict, lookup: lookup,
    verdicts: verdicts, request: request, sidAt: sidAt,

    defaults: { acts: 'GPKKG', sameSite: 'Lax', persistent: false },

    steps: function (p) { return actsOf(p).length; },

    initial: function () {
      return {
        n: 0, now: 0, open: true, jar: [], sessions: {}, nextSid: 0, page: null, lastRequest: null, verdicts: null,
        log: [], ev: { kind: 'start' }, changed: { jar: [], sessions: [] }, gone: { jar: [], sessions: [] }
      };
    },

    step: function (prev, n, p) {
      var s = copy(prev);
      var key = actsOf(p)[n - 1];
      s.n = n;
      s.changed = { jar: [], sessions: [] };
      s.gone = { jar: [], sessions: [] };
      if (!key) { s.ev = { kind: 'idle' }; return s; }
      var act = ACTIONS[key];
      var before = copy(prev.jar);

      if (act.id === 'close') {
        s.now += CLOSED_S;
        var e = evict(s.jar, s.now, true);
        s.jar = e.jar;
        s.gone.jar = e.gone;
        s.page = null;
        s.lastRequest = null;
        s.verdicts = null;
        s.log.push({ k: 'note', n: n, t: s.now, what: 'close' });
        s.ev = { kind: 'close', dropped: e.gone.filter(function (g) { return g.why === 'closed'; }).map(function (g) { return g.name; }),
          expired: e.gone.filter(function (g) { return g.why === 'expired'; }).map(function (g) { return g.name; }),
          kept: s.jar.map(function (c) { return c.name; }), live: Object.keys(s.sessions) };
        return s;
      }

      s.now += STEP_S;
      var ex = evict(s.jar, s.now, false);
      s.jar = ex.jar;
      s.gone.jar = ex.gone;
      var sessionsBefore = copy(s.sessions);

      var other = null;
      if (act.via) {
        other = exchange(s, act, request(act, OTHER, '/', 'GET', 'navigation', null), p);
        other.rows.forEach(function (r) { s.log.push(r); });
      }
      // a browse with no page open (step 0, after closing) is typed into the address bar: no initiator. A form (log in,
      // add to cart, log out) is always on one of the shop's pages.
      var req = request(act, SHOP, act.path, act.method, act.kind, act.via || (s.page || act.kind === 'form' ? SHOP : null));
      var x = exchange(s, act, req, p);
      x.rows.forEach(function (r) { s.log.push(r); });

      s.lastRequest = x.summary;
      s.verdicts = verdicts(req);
      var sess = x.res.user ? s.sessions[x.res.sid] : null;
      s.page = { site: SHOP, path: act.path, view: x.res.view, user: x.res.user, cart: sess ? sess.cart.length : null };

      // changed marks: jar rows added or rewritten, session rows created, touched or deleted
      s.jar.forEach(function (c) {
        var o = before.filter(function (b) { return sameRow(b, c); })[0];
        if (!o || JSON.stringify(o) !== JSON.stringify(c)) s.changed.jar.push(c.name);
      });
      if (x.res.touched) s.changed.sessions.push(x.res.touched);
      if (x.res.deleted) s.gone.sessions.push({ sid: x.res.deleted, row: sessionsBefore[x.res.deleted] });

      var sid = ex.jar.filter(function (c) { return c.name === 'sid' && c.domain === SHOP; })[0];
      var sidDecision = x.summary.decisions.filter(function (d) { return d.name === 'sid' && d.domain === SHOP; })[0];
      s.ev = {
        kind: act.id, why: x.res.why, user: x.res.user, sid: x.res.sid, stale: x.res.stale,
        cross: x.summary.crossSite, sidSent: !!(sidDecision && sidDecision.sent), sidWhy: sidDecision ? sidDecision.why : null,
        sameSite: sid ? effectiveSameSite(sid) : null,
        jarSid: sid ? sid.value : null, cart: s.page.cart, deleted: x.res.deleted,
        otherSet: other ? other.stored : [], setCookie: x.stored,
        expired: ex.gone.map(function (g) { return g.name; })
      };
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
