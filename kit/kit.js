/* simdeck kit 0.2.0: step controller, controls, transport, header tools and shortcuts for native simulators.
   A classic script (not a module) so a page opens straight from file:// with no build. Load it in <head>: it sets the
   theme before first paint, then the page calls Simdeck.mount(def) at the end of <body>.
   The pure part (rng, stateAt, defaultsOf, stepsOf) touches no DOM, so node tests can require() this file.
   Rules and API: docs/sim-ui.md. */
(function (root) {
  'use strict';

  var VERSION = '0.2.0';
  var hasDom = typeof document !== 'undefined';

  // ── pure core ──

  /** Seeded generator (mulberry32). rng(seed)() -> [0, 1); .int(n) -> 0..n-1. All randomness in a sim goes through it. */
  function rng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = function (n) { return Math.floor(next() * n); };
    return next;
  }

  /** Default parameter values: each param spec's `value`, then def.defaults on top. */
  function defaultsOf(def) {
    var p = {};
    (def.params || []).forEach(function (s) { if (s.key && s.type !== 'button') p[s.key] = s.value; });
    return Object.assign(p, def.defaults || {});
  }

  /** Number of steps for these params (0 = explorer, no stepping). */
  function stepsOf(def, params) {
    var s = typeof def.steps === 'function' ? def.steps(params) : def.steps;
    return Math.max(0, Math.floor(s || 0));
  }

  /** State after n steps, by replay from initial(params). Step back is therefore exact by construction. */
  function stateAt(def, params, n) {
    var s = def.initial(params);
    for (var i = 1; i <= n; i++) s = def.step(s, i, params);
    return s;
  }

  /**
   * True when the back link should go back in history: the visitor came from this site's index (the back link's
   * target, also as its folder URL) or from one of its course pages (<site root>/courses/<id>/), on the same origin.
   */
  function cameFromSite(referrer, backHref) {
    try {
      if (!referrer) return false;
      var ref = new URL(referrer);
      var back = new URL(backHref);
      if (ref.origin !== back.origin) return false;
      var rootPath = back.pathname.replace(/[^/]*$/, ''); // the index's folder: the site root
      var p = ref.pathname;
      if (p === back.pathname || p === rootPath) return true;
      if (p.slice(0, rootPath.length) !== rootPath) return false;
      return /^courses\/[a-z0-9]+(-[a-z0-9]+)*\/(index\.html)?$/.test(p.slice(rootPath.length));
    } catch (e) {
      return false;
    }
  }

  // ── languages (pure) ──

  /** Every simdeck page exists in these languages (docs/sim-ui.md §9). */
  var LANGS = ['hr', 'en'];
  /** Plural forms per language: hr 1 / 2–4 / 5+ (11–14 take the third), en 1 / other. */
  var PLURALS = { hr: 3, en: 2 };
  function pluralIndex(lang, n) {
    var a = Math.abs(Math.trunc(Number(n)) || 0);
    if (lang !== 'hr') return a === 1 ? 0 : 1;
    if (a % 10 === 1 && a % 100 !== 11) return 0;
    if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 12 || a % 100 > 14)) return 1;
    return 2;
  }
  /** '{n} of {all}' with { n: 3, all: 16 } -> '3 of 16'. Unknown names stay as written. */
  function format(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? String(vars[k]) : m; });
  }
  function placeholders(str) {
    return (String(str).match(/\{\w+\}/g) || []).slice().sort().filter(function (x, i, a) { return a.indexOf(x) === i; });
  }
  var TERM_RE = /\[\[(=?)([^\]]+)\]\]/g;
  /** Glossary list (kit/glossary.js) -> lookup by lower-case English term. */
  function glossaryIndex(terms) {
    var m = {};
    (terms || []).forEach(function (t) { if (t && t.en && t.hr) m[t.en.toLowerCase()] = t; });
    return m;
  }
  /**
   * Expand glossary markers. [[page fault]] is a first mention: Croatian pages get "page fault (promašaj stranice)",
   * the English term in italics in html mode; English pages get "page fault". [[=page fault]] is a later mention:
   * the English term only. Unknown terms are reported through onMissing and left as written.
   */
  function expandTerms(str, lang, index, mode, onMissing) {
    return String(str).replace(TERM_RE, function (m, later, key) {
      var t = index && index[key.trim().toLowerCase()];
      if (!t) { if (onMissing) onMissing(key); return key; }
      var en = mode === 'html' && lang === 'hr' ? '<em lang="en">' + escapeText(t.en) + '</em>' : t.en;
      return lang === 'hr' && !later ? en + ' (' + (mode === 'html' ? escapeText(t.hr) : t.hr) + ')' : en;
    });
  }
  function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /**
   * Problems with a page's string table { hr: {...}, en: {...} } (empty = fine). A key must exist in every language;
   * values are strings, or arrays of plural forms (hr 3, en 2); both languages use the same {placeholders};
   * [[terms]] must be in the glossary when one is given. `languages` narrows the required languages (an adopted page
   * declared single-language in sim.json).
   */
  function checkStrings(table, opts) {
    var o = opts || {};
    var langs = o.languages || LANGS;
    var out = [];
    if (!table || typeof table !== 'object') return ['no string table'];
    Object.keys(table).forEach(function (l) { if (LANGS.indexOf(l) < 0) out.push('unknown language "' + l + '"'); });
    langs.forEach(function (l) { if (!table[l] || typeof table[l] !== 'object') out.push('missing language "' + l + '"'); });
    var present = langs.filter(function (l) { return table[l] && typeof table[l] === 'object'; });
    var keys = [];
    present.forEach(function (l) { Object.keys(table[l]).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    keys.sort().forEach(function (k) {
      var shape = null;
      present.forEach(function (l) {
        var v = table[l][k];
        if (v === undefined) { out.push('"' + k + '" is missing in ' + l); return; }
        var forms = Array.isArray(v) ? v : [v];
        if (Array.isArray(v) && v.length !== PLURALS[l]) out.push('"' + k + '" in ' + l + ' needs ' + PLURALS[l] + ' plural forms, has ' + v.length);
        if (forms.some(function (x) { return typeof x !== 'string' || !x.trim(); })) { out.push('"' + k + '" in ' + l + ' must be a non-empty string (or plural forms)'); return; }
        var ph = placeholders(forms.join(' ')).join(',');
        var s = (Array.isArray(v) ? 'plural' : 'string') + ':' + ph;
        if (shape === null) shape = s;
        else if (shape !== s) out.push('"' + k + '" differs between languages (' + s + ' vs ' + shape + ')');
        if (o.glossary) forms.forEach(function (x) { expandTerms(x, l, o.glossary, 'text', function (t) { out.push('"' + k + '" in ' + l + ': [[' + t + ']] is not in the glossary'); }); });
      });
    });
    return out;
  }

  /** The lower-case words in a list of texts: what a visible text node may be made of (check-page.mjs). */
  function textWords(texts) {
    var set = {};
    (texts || []).forEach(function (t) { (String(t).replace(/\{\w+\}/g, ' ').toLowerCase().match(/\p{L}+/gu) || []).forEach(function (w) { set[w] = true; }); });
    return set;
  }

  var core = {
    version: VERSION, rng: rng, defaultsOf: defaultsOf, stepsOf: stepsOf, stateAt: stateAt, cameFromSite: cameFromSite,
    LANGS: LANGS, pluralIndex: pluralIndex, format: format, checkStrings: checkStrings, expandTerms: expandTerms,
    glossaryIndex: glossaryIndex, textWords: textWords
  };

  if (!hasDom) {
    if (typeof module === 'object' && module.exports) module.exports = core;
    else root.Simdeck = core;
    return;
  }

  // ── strings (picked by <html lang>) ──
  var STRINGS = {
    hr: {
      back: 'Popis', backTitle: 'Natrag na popis simulatora', play: 'Pokreni', pause: 'Pauza', next: 'Naprijed',
      prev: 'Natrag', first: 'Na početak', last: 'Na kraj', reset: 'Vrati postavke', step: 'Korak', speed: 'Brzina',
      params: 'Postavke', presets: 'Primjeri', fullscreen: 'Cijeli zaslon',
      help: 'Prečaci', panel: 'Sakrij / prikaži ploču', blank: 'Zatamni zaslon', on: 'uključeno', off: 'isključeno',
      close: 'Zatvori', atEnd: 'Kraj.', keys: 'Tipke', page: 'Ova stranica', preset: 'Primjer',
      legend: 'Legenda', panelLabel: 'Postavke i primjeri', steps: 'Koraci', idea: 'Ideja',
      langName: 'Hrvatski', langSwitch: 'Prebaci na engleski'
    },
    en: {
      back: 'Index', backTitle: 'Back to the simulator index', play: 'Play', pause: 'Pause', next: 'Next',
      prev: 'Back', first: 'To start', last: 'To end', reset: 'Reset settings', step: 'Step', speed: 'Speed',
      params: 'Settings', presets: 'Examples', fullscreen: 'Full screen',
      help: 'Shortcuts', panel: 'Hide / show panel', blank: 'Blank screen', on: 'on', off: 'off',
      close: 'Close', atEnd: 'End.', keys: 'Keys', page: 'This page', preset: 'Example',
      legend: 'Legend', panelLabel: 'Settings and examples', steps: 'Steps', idea: 'Idea',
      langName: 'English', langSwitch: 'Switch to Croatian'
    }
  };
  var docEl = document.documentElement;
  function T() { return /^hr\b/i.test(docEl.lang || '') ? STRINGS.hr : STRINGS.en; }

  // ── url, theme (runs at load, before first paint) ──
  var query = new URLSearchParams(window.location.search);
  var darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  /** The theme always follows the OS. ?theme=light|dark overrides it for checks and screenshots only. */
  function resolveTheme() {
    var q = query.get('theme');
    if (q === 'light' || q === 'dark') return q;
    return darkMq && darkMq.matches ? 'dark' : 'light';
  }
  var themeListeners = [];
  function applyTheme(t) {
    docEl.dataset.theme = t;
    themeListeners.forEach(function (fn) { fn(t); });
  }
  function onTheme(fn) { themeListeners.push(fn); return function () { themeListeners.splice(themeListeners.indexOf(fn), 1); }; }
  applyTheme(resolveTheme());
  if (darkMq && darkMq.addEventListener) darkMq.addEventListener('change', function () { applyTheme(resolveTheme()); });
  if (query.get('motion') === 'reduce') docEl.dataset.motion = 'reduce';
  if (query.get('panel') === 'hidden') docEl.dataset.panel = 'hidden';
  docEl.dataset.kit = VERSION;

  function reducedMotion() {
    return docEl.dataset.motion === 'reduce' || (!!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  /** Current value of a token, e.g. cssVar('--c1'), for canvas drawing. Re-read it in an onTheme listener. */
  function cssVar(name) { return getComputedStyle(docEl).getPropertyValue(name).trim(); }

  // ── language (docs/sim-ui.md §9) ──
  // One page carries every language. The language is ?lang=hr|en, else the visitor's last choice on any simdeck
  // page (localStorage), else the page's own <html lang>. Switching stores the choice and reloads the same file with
  // ?lang=, so the page script runs once per language and the kit's URL state brings back the preset and the step.
  var LANG_KEY = 'simdeck.lang';
  var pageLang = (docEl.lang || 'hr').slice(0, 2).toLowerCase();
  function storedLang() { try { return window.localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
  function storeLang(l) { try { window.localStorage.setItem(LANG_KEY, l); } catch (e) { /* storage off: ?lang= still works */ } }
  var wantedLang = [query.get('lang'), storedLang(), pageLang].filter(function (l) { return LANGS.indexOf(l) >= 0; })[0] || 'hr';
  var i18n = { table: null, langs: [pageLang], lang: pageLang, glossary: null };

  /** Called by kit/glossary.js. */
  function defineGlossary(terms) { i18n.glossary = glossaryIndex(terms); }

  /** A glossary term as a node: first mention "<em>page fault</em> (promašaj stranice)" on Croatian pages. */
  function term(key, opts) {
    var span = document.createElement('span');
    span.innerHTML = expandTerms('[[' + (opts && opts.later ? '=' : '') + key + ']]', i18n.lang, i18n.glossary, 'html', missingTerm);
    return span.childNodes.length === 1 ? span.firstChild : span;
  }
  function missingTerm(k) { console.error('[simdeck] [[' + k + ']] is not in the glossary (load kit/glossary.js, or add the term)'); }

  function lookup(key) {
    var v = i18n.table && i18n.table[i18n.lang] ? i18n.table[i18n.lang][key] : undefined;
    if (v === undefined) { console.error('[simdeck] missing string "' + key + '" (' + i18n.lang + ')'); return key; }
    return v;
  }
  function pick(v, n) { return Array.isArray(v) ? v[Math.min(v.length - 1, pluralIndex(i18n.lang, n))] : v; }
  /** t(key, vars): the string in the page's language, {placeholders} filled and [[terms]] expanded as text. */
  function t(key, vars) { return expandTerms(format(pick(lookup(key), vars && vars.n), vars), i18n.lang, i18n.glossary, 'text', missingTerm); }
  /** t.n(key, n, vars): plural forms ['{n} bit', '{n} bita', '{n} bitova'] picked by n. */
  t.n = function (key, n, vars) { return t(key, Object.assign({ n: n }, vars || {})); };
  /** t.html(key, vars): for trusted markup in the table (explanations); [[terms]] in italics. */
  t.html = function (key, vars) { return expandTerms(format(pick(lookup(key), vars && vars.n), vars), i18n.lang, i18n.glossary, 'html', missingTerm); };
  /** t.parts(key, vars): like t, but vars may be nodes; returns [strings and nodes] for h() and captions. */
  t.parts = function (key, vars) {
    var src = pick(lookup(key), vars && vars.n);
    var out = [];
    String(src).split(/(\{\w+\})/).forEach(function (bit) {
      var m = /^\{(\w+)\}$/.exec(bit);
      if (m && vars && vars[m[1]] != null) out.push(vars[m[1]] instanceof Node ? vars[m[1]] : String(vars[m[1]]));
      else if (bit) {
        var hold = document.createElement('span');
        hold.innerHTML = expandTerms(escapeText(bit), i18n.lang, i18n.glossary, 'html', missingTerm);
        Array.prototype.slice.call(hold.childNodes).forEach(function (c) { out.push(c); });
      }
    });
    return out;
  };

  /**
   * Register the page's string table { hr: {...}, en: {...} } (sims/<id>/strings.js) and fix the page language.
   * Fills the static page: [data-t] text, [data-t-html] markup, [data-t-label] aria-label. Returns t.
   */
  function useStrings(table) {
    i18n.table = table || {};
    i18n.langs = LANGS.filter(function (l) { return i18n.table[l]; });
    if (!i18n.langs.length) i18n.langs = [pageLang];
    i18n.lang = i18n.langs.indexOf(wantedLang) >= 0 ? wantedLang : i18n.langs.indexOf(pageLang) >= 0 ? pageLang : i18n.langs[0];
    docEl.lang = i18n.lang;
    var problems = checkStrings(i18n.table, { languages: i18n.langs, glossary: i18n.glossary });
    problems.forEach(function (p) { console.error('[simdeck] strings: ' + p); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (e) { e.textContent = t(e.dataset.t); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t-html]'), function (e) { e.innerHTML = t.html(e.dataset.tHtml); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t-label]'), function (e) { e.setAttribute('aria-label', t(e.dataset.tLabel)); });
    return t;
  }

  /** Every word a visible text node may use in the current language: page table, kit strings, metadata. */
  function allowedWords() {
    var texts = [];
    var add = function (v) { (Array.isArray(v) ? v : [v]).forEach(function (x) { texts.push(expandTerms(x, i18n.lang, i18n.glossary, 'text')); }); };
    var tb = i18n.table && i18n.table[i18n.lang];
    if (tb) Object.keys(tb).forEach(function (k) { add(tb[k]); });
    var ks = STRINGS[i18n.lang] || {};
    Object.keys(ks).forEach(function (k) { add(ks[k]); });
    Object.keys(STRINGS).forEach(function (l) { texts.push(STRINGS[l].langName); });
    var meta = readJson('simdeck-meta') || {};
    ['title', 'concept', 'summary'].forEach(function (k) { if (meta[k] && typeof meta[k] === 'object') add(meta[k][i18n.lang] || ''); });
    return Object.keys(textWords(texts));
  }

  /** Reload this page in another language, keeping the URL state (preset, step, params, panel). */
  function switchLang(to, beforeLeave) {
    if (LANGS.indexOf(to) < 0 || to === i18n.lang) return;
    storeLang(to);
    if (beforeLeave) beforeLeave();
    var u = new URLSearchParams(window.location.search);
    u.set('lang', to);
    if (docEl.dataset.panel === 'hidden') u.set('panel', 'hidden'); else u.delete('panel');
    window.location.replace(window.location.pathname + '?' + u.toString() + window.location.hash);
  }

  // ── DOM helpers ──

  /** h('div', {class: 'x', onclick: fn, dataset: {k: 'v'}}, child, 'text', [more]) */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (n) { el.style.setProperty(n.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }), v[n]); });
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { append(el, x); });
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  var svgNs = 'http://www.w3.org/2000/svg';
  var ICONS = {
    play: 'M7 4v16l13-8z',
    pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
    next: 'M5 4v16l10-8zM16 4h3v16h-3z',
    prev: 'M19 4v16L9 12zM5 4h3v16H5z',
    first: 'M20 5v14l-7-7zM13 5v14l-7-7zM4 5h2v14H4z',
    last: 'M4 5v14l7-7zM11 5v14l7-7zM18 5h2v14h-2z',
    back: 'M11 5l-7 7 7 7v-4.5h9v-5h-9z',
    fullscreen: 'M4 4h6v2.2H6.2V10H4zM14 4h6v6h-2.2V6.2H14zM4 14h2.2v3.8H10V20H4zM17.8 14H20v6h-6v-2.2h3.8z',
    panel: 'M3 4h18v16H3zm2 2v12h10V6zm12 0v12h2V6z',
    reset: 'M12 4a8 8 0 1 1-7.75 6h2.1A6 6 0 1 0 12 6v3L7.5 5 12 1z'
  };
  function icon(name) {
    var s = document.createElementNS(svgNs, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'sd-icon');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(svgNs, 'path');
    p.setAttribute('d', ICONS[name]);
    p.setAttribute('fill-rule', 'evenodd');
    s.append(p);
    return s;
  }
  /** Buttons never take focus on click, so a clicker's keys keep reaching the page (and Space never re-clicks them). */
  function noFocusSteal(el) { el.addEventListener('mousedown', function (e) { e.preventDefault(); }); return el; }
  /** Sliders and selects give focus back after a pointer drag/pick, for the same reason. Keyboard users keep focus. */
  function releaseAfterPointer(el) {
    var byPointer = false;
    el.addEventListener('pointerdown', function () { byPointer = true; });
    el.addEventListener('change', function () { if (byPointer) { byPointer = false; el.blur(); } });
    return el;
  }
  function q(sel) { return document.querySelector(sel); }
  function readJson(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { console.error('[simdeck] #' + id + ' is not valid JSON', e); return null; }
  }
  function keyLabel(k) {
    return { ArrowRight: '→', ArrowLeft: '←', PageDown: 'PgDn', PageUp: 'PgUp', ' ': 'Space', Home: 'Home', End: 'End', Escape: 'Esc' }[k] || k;
  }

  // ── mount ──

  /**
   * Mount a simulator. Returns the controller. See docs/sim-ui.md §4 for the full def.
   * def: { steps, initial(params), step(state, n, params), params[], presets[], legend[], keys[],
   *        render(ctx), caption(ctx) -> string | Node, url: true }
   */
  function mount(def) {
    var S = T();
    var meta = readJson('simdeck-meta') || {};
    var simId = docEl.dataset.sim || meta.id || 'sim';
    var specs = (def.params || []).filter(function (s) { return s.type !== 'button'; });
    var buttons = (def.params || []).filter(function (s) { return s.type === 'button'; });
    var presets = def.presets || [];
    var defaults = defaultsOf(def);

    var el = {
      stage: q('[data-sd-stage]'), caption: q('[data-sd-caption]'), controls: q('[data-sd-controls]'),
      presets: q('[data-sd-presets]'), legend: q('[data-sd-legend]'), tools: q('[data-sd-tools]'),
      transport: q('[data-sd-transport]'), back: q('[data-sd-back]')
    };

    var st = {
      params: Object.assign({}, defaults), n: 0, playing: false, speed: 1, preset: null,
      cache: [], dir: 'jump', timer: 0
    };
    var listeners = [];

    // ---- params ----
    function bound(v, p) { return typeof v === 'function' ? v(p) : v; }
    function coerce(spec, raw) {
      if (spec.type === 'toggle') return raw === true || raw === 'true' || raw === '1' || raw === 1;
      if (spec.type === 'range') return Number(raw);
      if (spec.type === 'choice' || spec.type === 'select') {
        var hit = spec.options.filter(function (o) { return String(o[0]) === String(raw); })[0];
        return hit ? hit[0] : spec.value;
      }
      return raw;
    }
    /** Clamp every range to its (possibly param-dependent) bounds and snap it to its step. */
    function normalise(p) {
      specs.forEach(function (s) {
        if (s.type !== 'range') return;
        var lo = bound(s.min, p), hi = bound(s.max, p), stp = s.step || 1;
        var v = Math.min(hi, Math.max(lo, Number(p[s.key])));
        if (!Number.isFinite(v)) v = s.value;
        p[s.key] = Math.round((v - lo) / stp) * stp + lo;
      });
      return p;
    }
    function steps() { return stepsOf(def, st.params); }
    function isStepper() { return !!def.step && steps() > 0; }

    function stateAtN(n) {
      var c = st.cache;
      if (!c.length) c.push(def.initial(st.params));
      for (var i = c.length; i <= n; i++) c.push(def.step(c[i - 1], i, st.params));
      return c[n];
    }

    // ---- view ----
    function ctx() {
      var n = st.n;
      return {
        state: stateAtN(n), prev: n > 0 ? stateAtN(n - 1) : null, n: n, steps: steps(), params: st.params,
        stage: el.stage, dir: st.dir, preset: st.preset, first: n === 0, last: n === steps(), t: S
      };
    }
    var ui = { sync: [] };
    function render() {
      var c = ctx();
      if (def.render) def.render(c);
      if (el.caption && def.caption) {
        var out = def.caption(c);
        el.caption.replaceChildren();
        append(el.caption, out);
      }
      ui.sync.forEach(function (fn) { fn(c); });
      writeUrl();
      listeners.forEach(function (fn) { fn(c); });
    }

    // ---- navigation ----
    function go(n, dir) {
      var max = steps();
      var target = Math.max(0, Math.min(max, Math.round(n)));
      st.dir = dir || (target === st.n + 1 ? 'forward' : target === st.n - 1 ? 'back' : 'jump');
      st.n = target;
      if (st.n === max) stop();
      render();
    }
    function next() { if (st.n < steps()) go(st.n + 1, 'forward'); }
    function prev() { stop(); if (st.n > 0) go(st.n - 1, 'back'); }
    function first() { stop(); go(0, 'jump'); }
    function last() { stop(); go(steps(), 'jump'); }

    function tick() {
      st.timer = 0;
      if (!st.playing) return;
      if (st.n >= steps()) { stop(); render(); return; }
      go(st.n + 1, 'forward');
      if (st.playing) st.timer = window.setTimeout(tick, 1000 / st.speed);
    }
    function play() {
      if (!isStepper() || st.playing) return;
      if (st.n >= steps()) go(0, 'jump');
      st.playing = true;
      st.timer = window.setTimeout(tick, Math.min(400, 1000 / st.speed));
      render();
    }
    function stop() {
      st.playing = false;
      if (st.timer) { window.clearTimeout(st.timer); st.timer = 0; }
    }
    function pause() { if (st.playing) { stop(); render(); } }
    function toggle() { if (st.playing) pause(); else play(); }
    function setSpeed(v) { st.speed = v; render(); }

    /** Change params. Keeps the current step (clamped) unless a changed param has resets: true. */
    function set(patch, opts) {
      var o = opts || {};
      var nextP = normalise(Object.assign({}, st.params, patch));
      var changed = Object.keys(nextP).filter(function (k) { return !Object.is(nextP[k], st.params[k]); });
      if (!changed.length) { render(); return; }
      var resets = changed.some(function (k) { var s = specs.filter(function (x) { return x.key === k; })[0]; return s && s.resets; });
      st.params = nextP;
      st.cache = [];
      st.preset = o.preset || null;
      if (resets) { stop(); st.n = 0; }
      st.n = Math.min(st.n, steps());
      st.dir = 'jump';
      render();
    }
    function loadPreset(id) {
      var p = presets.filter(function (x) { return x.id === id; })[0];
      if (!p) return false;
      stop();
      st.params = normalise(Object.assign({}, defaults, p.params || {}));
      st.cache = [];
      st.preset = p.id;
      st.n = Math.min(p.step || 0, steps());
      st.dir = 'jump';
      render();
      return true;
    }
    /** Back to step 0 with the active preset's params, or the defaults. */
    function reset() {
      stop();
      if (st.preset && loadPreset(st.preset)) { go(0, 'jump'); return; }
      st.params = normalise(Object.assign({}, defaults));
      st.cache = [];
      st.n = 0;
      st.dir = 'jump';
      render();
    }

    // ---- url: ?preset=&step=&<param>= (only values that differ from the preset/defaults) ----
    function readUrl() {
      var pid = query.get('preset');
      if (pid) loadPreset(pid);
      var patch = {};
      specs.forEach(function (s) { if (query.has(s.key)) patch[s.key] = coerce(s, query.get(s.key)); });
      if (Object.keys(patch).length) {
        st.params = normalise(Object.assign({}, st.params, patch));
        st.cache = [];
        if (!pid) st.preset = null;
      }
      if (query.has('step')) st.n = Math.max(0, Math.min(steps(), parseInt(query.get('step'), 10) || 0));
    }
    var urlTimer = 0;
    function writeUrl() {
      if (def.url === false) return;
      window.clearTimeout(urlTimer);
      urlTimer = window.setTimeout(flushUrl, 150);
    }
    function flushUrl() {
      window.clearTimeout(urlTimer);
      if (def.url === false) return;
      (function () {
        var u = new URLSearchParams(window.location.search);
        ['preset', 'step'].concat(specs.map(function (s) { return s.key; })).forEach(function (k) { u.delete(k); });
        var base = st.preset ? normalise(Object.assign({}, defaults, presets.filter(function (x) { return x.id === st.preset; })[0].params || {})) : defaults;
        if (st.preset) u.set('preset', st.preset);
        specs.forEach(function (s) { if (!Object.is(st.params[s.key], base[s.key])) u.set(s.key, String(st.params[s.key])); });
        if (st.n) u.set('step', String(st.n));
        // The language is state too: a copied link opens in the language it was copied in.
        if (i18n.langs.length > 1 && i18n.lang !== pageLang) u.set('lang', i18n.lang); else u.delete('lang');
        var qs = u.toString();
        try { window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash); } catch (e) { /* file:// in some browsers */ }
      })();
    }

    // ---- build: titles and the kit's own labels, in the page language ----
    var loc = function (v) { return v && typeof v === 'object' ? v[i18n.lang] || v[i18n.langs[0]] || '' : v; };
    var titleEl = q('.sd-title'), subEl = q('.sd-subtitle');
    if (meta.title && titleEl) titleEl.textContent = loc(meta.title);
    if (meta.title) document.title = loc(meta.title) + ' · simdeck';
    if (meta.concept && subEl) subEl.textContent = loc(meta.concept);
    if (el.legend) el.legend.setAttribute('aria-label', S.legend);
    if (q('.sd-panel')) q('.sd-panel').setAttribute('aria-label', S.panelLabel);
    if (el.transport) el.transport.setAttribute('aria-label', S.steps);
    var explain = q('.sd-explain > summary');
    if (explain && !explain.textContent.trim()) explain.textContent = S.idea;
    var bilingual = i18n.langs.length > 1;
    var otherLang = bilingual ? i18n.langs.filter(function (l) { return l !== i18n.lang; })[0] : null;
    function toggleLang() { if (otherLang) { stop(); switchLang(otherLang, flushUrl); } }

    // ---- build: legend ----
    if (el.legend && def.legend && !el.legend.children.length) {
      def.legend.forEach(function (it) {
        el.legend.append(h('li', null, h('span', { class: 'sd-swatch', dataset: { c: it.c == null ? '' : String(it.c), shape: it.shape || '' } }), it.label));
      });
    }

    // ---- build: back link ----
    if (el.back) {
      Array.prototype.slice.call(el.back.childNodes).forEach(function (c) { if (c.nodeType === 3) c.remove(); });
      el.back.append(S.back);
      if (!el.back.querySelector('.sd-icon')) el.back.prepend(icon('back'));
      el.back.title = S.backTitle;
      if (bilingual) {
        // The index and course pages read ?lang= too, so the way back stays in this language.
        var bu = el.back.getAttribute('href').split('?')[0];
        el.back.setAttribute('href', bu + '?lang=' + i18n.lang);
      }
      el.back.addEventListener('click', function (e) {
        // Opened from the index or a course page: go back in history, so the visitor returns to where they came
        // from (a student to their course page) and the index keeps its search. Otherwise follow the link home.
        if (cameFromSite(document.referrer, el.back.href) && window.history.length > 1) {
          e.preventDefault();
          window.history.back();
        }
      });
    }

    // ---- build: header tools ----
    var help = null;
    function toolBtn(name, label, key, run) {
      var b = noFocusSteal(h('button', { type: 'button', class: 'sd-iconbtn', title: label + ' (' + key + ')', 'aria-label': label, 'aria-keyshortcuts': key, onclick: run }));
      b.append(name === 'help' ? h('span', { 'aria-hidden': 'true' }, '?') : icon(name));
      return b;
    }
    function toggleFull() {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else docEl.requestFullscreen().catch(function () { /* refused */ });
      } catch (e) { /* unsupported */ }
    }
    function togglePanel() {
      if (docEl.dataset.panel === 'hidden') delete docEl.dataset.panel; else docEl.dataset.panel = 'hidden';
    }
    var blank = h('div', { class: 'sd-blank', hidden: true, onclick: function () { blank.hidden = true; } });
    document.body.append(blank);
    function toggleBlank() { blank.hidden = !blank.hidden; }
    if (el.tools && bilingual) {
      // Shows the language it switches to, in that language ("English" on a Croatian page).
      var lb = noFocusSteal(h('button', { type: 'button', class: 'sd-iconbtn sd-langbtn', lang: otherLang, title: STRINGS[otherLang].langName + ' (L)',
        'aria-label': S.langSwitch, 'aria-keyshortcuts': 'L', onclick: toggleLang }, h('span', { 'aria-hidden': 'true', translate: 'no' }, otherLang.toUpperCase())));
      el.tools.append(lb);
    }
    if (el.tools) {
      el.tools.append(
        toolBtn('panel', S.panel, 'C', togglePanel),
        toolBtn('fullscreen', S.fullscreen, 'F', toggleFull),
        toolBtn('help', S.help, '?', function () { openHelp(); })
      );
    }

    // ---- build: controls ----
    var uid = 0;
    function ctlWrap(s) {
      return h('div', { class: 'sd-ctl sd-ctl-' + s.type, dataset: { key: s.key || '' } });
    }
    function addHint(wrap, s, id) {
      var hint = h('small', { class: 'sd-hint', id: id + '-hint' }, s.hint || '');
      hint.hidden = !s.hint;
      wrap.append(hint);
      return hint;
    }
    function syncState(wrap, hint, s, inputs) {
      ui.sync.push(function (c) {
        wrap.hidden = s.visible ? !s.visible(c.params) : false;
        var why = s.disabled ? s.disabled(c.params) : false;
        wrap.setAttribute('aria-disabled', why ? 'true' : 'false');
        inputs().forEach(function (i) { i.disabled = !!why; });
        hint.textContent = why || s.hint || '';
        hint.hidden = !hint.textContent;
      });
    }
    function buildControl(s) {
      var id = 'sd-' + simId + '-' + (++uid);
      var wrap = ctlWrap(s);
      var hint;
      if (s.type === 'range') {
        var fmt = s.format || function (v) { return String(v) + (s.unit ? ' ' + s.unit : ''); };
        var out = h('output', { for: id });
        var input = releaseAfterPointer(h('input', { type: 'range', class: 'sd-range', id: id, step: s.step || 1, 'aria-describedby': id + '-hint' }));
        var show = function (v) { out.textContent = fmt(v); input.setAttribute('aria-valuetext', fmt(v)); };
        input.addEventListener('input', function () { show(Number(input.value)); if (s.live !== false) set(kv(s.key, Number(input.value))); });
        input.addEventListener('change', function () { set(kv(s.key, Number(input.value))); });
        wrap.append(h('label', { class: 'sd-ctl-label', for: id }, h('span', null, s.label), out), input);
        hint = addHint(wrap, s, id);
        ui.sync.push(function (c) {
          input.min = String(bound(s.min, c.params));
          input.max = String(bound(s.max, c.params));
          input.value = String(c.params[s.key]);
          show(c.params[s.key]);
        });
        syncState(wrap, hint, s, function () { return [input]; });
      } else if (s.type === 'toggle') {
        var cb = h('input', { type: 'checkbox', role: 'switch', id: id, 'aria-describedby': id + '-hint' });
        var state = h('span', { class: 'sd-switch-state', 'aria-hidden': 'true' });
        noFocusSteal(cb);
        cb.addEventListener('change', function () { set(kv(s.key, cb.checked)); });
        wrap.append(noFocusSteal(h('label', { class: 'sd-switch', for: id }, cb, h('span', null, s.label), state)));
        hint = addHint(wrap, s, id);
        ui.sync.push(function (c) { cb.checked = !!c.params[s.key]; state.textContent = cb.checked ? S.on : S.off; });
        syncState(wrap, hint, s, function () { return [cb]; });
      } else if (s.type === 'choice') {
        var group = h('div', { class: 'sd-seg', role: 'group', 'aria-labelledby': id + '-lbl', 'aria-describedby': id + '-hint' });
        var bs = s.options.map(function (o) {
          var b = noFocusSteal(h('button', { type: 'button', 'aria-pressed': 'false', onclick: function () { set(kv(s.key, o[0])); } }, o[1]));
          group.append(b);
          return b;
        });
        wrap.append(h('span', { class: 'sd-ctl-label', id: id + '-lbl' }, s.label), group);
        hint = addHint(wrap, s, id);
        ui.sync.push(function (c) { bs.forEach(function (b, i) { b.setAttribute('aria-pressed', String(Object.is(s.options[i][0], c.params[s.key]))); }); });
        syncState(wrap, hint, s, function () { return bs; });
      } else if (s.type === 'select') {
        var sel = releaseAfterPointer(h('select', { class: 'sd-select', id: id, 'aria-describedby': id + '-hint' },
          s.options.map(function (o, i) { return h('option', { value: String(i) }, o[1]); })));
        sel.addEventListener('change', function () { set(kv(s.key, s.options[Number(sel.value)][0])); });
        wrap.append(h('label', { class: 'sd-ctl-label', for: id }, s.label), sel);
        hint = addHint(wrap, s, id);
        ui.sync.push(function (c) {
          s.options.forEach(function (o, i) { if (Object.is(o[0], c.params[s.key])) sel.value = String(i); });
        });
        syncState(wrap, hint, s, function () { return [sel]; });
      } else {
        throw new Error('[simdeck] unknown param type: ' + s.type);
      }
      return wrap;
    }
    function kv(k, v) { var o = {}; o[k] = v; return o; }
    function actionButton(label, key, run) {
      return noFocusSteal(h('button', { type: 'button', class: 'sd-btn', 'aria-keyshortcuts': key || null, onclick: run },
        h('span', null, label), key ? h('kbd', null, keyLabel(key)) : null));
    }

    if (el.controls && (specs.length || buttons.length)) {
      var grp = h('div', { class: 'sd-group', role: 'group', 'aria-labelledby': 'sd-params-title' },
        h('h2', { class: 'sd-group-title', id: 'sd-params-title' }, S.params));
      specs.forEach(function (s) { grp.append(buildControl(s)); });
      buttons.forEach(function (b) { grp.append(actionButton(b.label, b.key, function () { b.run(api); })); });
      grp.append(actionButton(S.reset, 'R', reset));
      el.controls.append(grp);
    }

    // ---- build: presets ----
    if (el.presets && presets.length) {
      var list = h('div', { class: 'sd-presets' });
      var pbs = presets.map(function (p, i) {
        var key = i < 9 ? String(i + 1) : null;
        var b = noFocusSteal(h('button', { type: 'button', class: 'sd-preset', 'aria-pressed': 'false', 'aria-keyshortcuts': key, onclick: function () { loadPreset(p.id); } },
          h('span', null, p.label), key ? h('kbd', null, key) : null));
        if (p.hint) b.title = p.hint;
        list.append(b);
        return b;
      });
      el.presets.append(h('div', { class: 'sd-group', role: 'group', 'aria-labelledby': 'sd-presets-title' },
        h('h2', { class: 'sd-group-title', id: 'sd-presets-title' }, S.presets), list));
      ui.sync.push(function (c) { pbs.forEach(function (b, i) { b.setAttribute('aria-pressed', String(presets[i].id === c.preset)); }); });
    }

    // ---- build: transport ----
    var status = h('span', { class: 'sd-status', role: 'status' });
    if (el.transport) {
      if (def.step && stepsOf(def, st.params) > 0) {
        var tb = function (name, label, key, run, cls) {
          return noFocusSteal(h('button', { type: 'button', class: 'sd-btn ' + (cls || ''), title: label + ' (' + keyLabel(key) + ')', 'aria-label': label, 'aria-keyshortcuts': key, onclick: run },
            icon(name), h('span', { class: 'sd-btn-label' }, label), h('kbd', null, keyLabel(key))));
        };
        var bFirst = tb('first', S.first, 'Home', first, 'sd-btn--edge');
        var bPrev = tb('prev', S.prev, 'ArrowLeft', prev);
        var bPlay = tb('play', S.play, ' ', toggle, 'sd-btn--primary');
        var bNext = tb('next', S.next, 'ArrowRight', function () { stop(); next(); });
        var bLast = tb('last', S.last, 'End', last, 'sd-btn--edge');
        var scrubId = 'sd-' + simId + '-scrub';
        var scrub = releaseAfterPointer(h('input', { type: 'range', class: 'sd-range', id: scrubId, min: 0, step: 1, 'aria-label': S.step }));
        scrub.addEventListener('input', function () { stop(); go(Number(scrub.value), 'jump'); });
        var count = h('span', { class: 'sd-count', 'aria-hidden': 'true' });
        var speeds = [[0.5, '½×'], [1, '1×'], [2, '2×'], [4, '4×']];
        var sg = h('div', { class: 'sd-seg', role: 'group', 'aria-label': S.speed });
        var sbs = speeds.map(function (o) {
          var b = noFocusSteal(h('button', { type: 'button', 'aria-pressed': 'false', onclick: function () { setSpeed(o[0]); } }, o[1]));
          sg.append(b);
          return b;
        });
        el.transport.append(
          h('div', { class: 'sd-tgroup' }, bFirst, bPrev, bPlay, bNext, bLast),
          h('div', { class: 'sd-scrub' }, count, scrub),
          h('div', { class: 'sd-speed' }, h('span', { class: 'sd-vlabel sd-status' }, S.speed), sg),
          status
        );
        ui.sync.push(function (c) {
          bPrev.setAttribute('aria-disabled', String(c.first));
          bFirst.setAttribute('aria-disabled', String(c.first));
          bNext.setAttribute('aria-disabled', String(c.last));
          bLast.setAttribute('aria-disabled', String(c.last));
          var lbl = st.playing ? S.pause : S.play;
          bPlay.querySelector('.sd-btn-label').textContent = lbl;
          bPlay.setAttribute('aria-label', lbl);
          bPlay.setAttribute('aria-pressed', String(st.playing));
          bPlay.querySelector('.sd-icon').replaceWith(icon(st.playing ? 'pause' : 'play'));
          scrub.max = String(c.steps);
          scrub.value = String(c.n);
          scrub.setAttribute('aria-valuetext', S.step + ' ' + c.n + ' / ' + c.steps);
          count.textContent = S.step + ' ' + c.n + '/' + c.steps;
          sbs.forEach(function (b, i) { b.setAttribute('aria-pressed', String(speeds[i][0] === st.speed)); });
          status.textContent = c.last && c.n > 0 ? S.atEnd : '';
        });
      } else {
        el.transport.append(h('div', { class: 'sd-tgroup' }, actionButton(S.reset, 'R', reset)), status);
      }
    }

    // ---- help dialog ----
    function keyRows() {
      var rows = [];
      if (isStepper()) {
        rows.push([['→', 'PgDn'], S.next], [['←', 'PgUp'], S.prev], [['Space'], S.play + ' / ' + S.pause],
          [['Home'], S.first], [['End'], S.last]);
      }
      rows.push([['R'], S.reset]);
      if (presets.length) rows.push([['1', '…', String(Math.min(9, presets.length))], S.presets]);
      buttons.forEach(function (b) { if (b.key) rows.push([[keyLabel(b.key)], b.label]); });
      (def.keys || []).forEach(function (k) { rows.push([[keyLabel(k.key)], k.label]); });
      rows.push([['F'], S.fullscreen], [['C'], S.panel], [['B', '.'], S.blank], [['?'], S.help]);
      if (bilingual) rows.push([['L'], S.langSwitch]);
      return rows;
    }
    function openHelp() {
      if (!help) {
        help = h('dialog', { class: 'sd-help', 'aria-labelledby': 'sd-help-title' });
        document.body.append(help);
      }
      var tbody = h('tbody');
      keyRows().forEach(function (r) {
        tbody.append(h('tr', null, h('td', null, r[0].map(function (k, i) { return k === '…' ? ' … ' : [i && r[0][i - 1] !== '…' ? ' ' : '', h('kbd', null, k)]; })), h('td', null, r[1])));
      });
      help.replaceChildren(h('h2', { id: 'sd-help-title' }, S.keys), h('table', null, tbody),
        h('button', { type: 'button', class: 'sd-btn', onclick: function () { help.close(); } }, S.close));
      if (typeof help.showModal === 'function') help.showModal(); else help.setAttribute('open', '');
    }

    // ---- keyboard ----
    function typing(t) {
      if (!(t instanceof HTMLElement)) return false;
      if (t.isContentEditable || t.tagName === 'TEXTAREA') return true;
      return t.tagName === 'INPUT' && ['checkbox', 'radio', 'button', 'range'].indexOf(t.type) < 0;
    }
    function ownsArrows(t) {
      return t instanceof HTMLElement && !!t.closest('input[type="range"], select, [role="slider"], [role="tablist"]');
    }
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (document.querySelector('dialog[open]')) return;
      if (!blank.hidden) {
        if (['b', 'B', '.', 'Escape'].indexOf(e.key) >= 0) { e.preventDefault(); blank.hidden = true; }
        return;
      }
      var t = e.target;
      if (typing(t)) return;
      var k = e.key;
      var stepper = isStepper();
      var hit = function (fn) { e.preventDefault(); fn(); };
      // PageUp/PageDown always step (that is what a clicker sends); arrows stay with a focused slider.
      if (stepper && k === 'PageDown') return hit(function () { stop(); next(); });
      if (stepper && k === 'PageUp') return hit(prev);
      if (stepper && k === 'ArrowRight' && !ownsArrows(t)) return hit(function () { stop(); next(); });
      if (stepper && k === 'ArrowLeft' && !ownsArrows(t)) return hit(prev);
      if (stepper && k === ' ' && !(t instanceof HTMLElement && t.closest('button, a[href], summary, select, input:not([type="range"])'))) return hit(toggle);
      if (stepper && k === 'Home' && !ownsArrows(t)) return hit(first);
      if (stepper && k === 'End' && !ownsArrows(t)) return hit(last);
      var lower = k.length === 1 ? k.toLowerCase() : k;
      if (lower === 'r') return hit(reset);
      if (/^[1-9]$/.test(k) && presets[Number(k) - 1]) return hit(function () { loadPreset(presets[Number(k) - 1].id); });
      if (lower === 'f') return hit(toggleFull);
      if (lower === 'c') return hit(togglePanel);
      if (lower === 'b' || k === '.') return hit(toggleBlank);
      if (k === '?' || lower === 'h') return hit(openHelp);
      if (lower === 'l' && bilingual) return hit(toggleLang);
      var b = buttons.filter(function (x) { return x.key && x.key.toLowerCase() === lower; })[0];
      if (b) return hit(function () { b.run(api); });
      var pk = (def.keys || []).filter(function (x) { return x.key.toLowerCase() === lower; })[0];
      if (pk) return hit(function () { pk.run(api); });
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });

    // ---- checks against the page's metadata (warnings only; the contract check enforces them) ----
    if (meta.id && docEl.dataset.sim && meta.id !== docEl.dataset.sim) console.warn('[simdeck] data-sim "' + docEl.dataset.sim + '" differs from meta id "' + meta.id + '"');
    if (meta.class === 'stepper' && meta.steps != null && meta.steps !== stepsOf(def, defaults)) console.warn('[simdeck] meta steps ' + meta.steps + ' differs from steps(defaults) ' + stepsOf(def, defaults));

    var api = {
      get n() { return st.n; },
      get steps() { return steps(); },
      get params() { return Object.assign({}, st.params); },
      get state() { return stateAtN(st.n); },
      get playing() { return st.playing; },
      get preset() { return st.preset; },
      go: function (n) { stop(); go(n, 'jump'); }, next: function () { stop(); next(); }, prev: prev, first: first, last: last,
      play: play, pause: pause, toggle: toggle, reset: reset, set: set, loadPreset: loadPreset, setSpeed: setSpeed,
      render: render, help: openHelp,
      /** fn(ctx) after every render; returns an unsubscribe function. */
      on: function (fn) { listeners.push(fn); return function () { listeners.splice(listeners.indexOf(fn), 1); }; }
    };

    readUrl();
    onTheme(function () { render(); });
    render();
    root.simdeck = api; // for the console and e2e checks
    return api;
  }

  var Simdeck = Object.assign({}, core, {
    mount: mount, h: h, icon: icon, cssVar: cssVar, reducedMotion: reducedMotion, onTheme: onTheme,
    strings: STRINGS, useStrings: useStrings, t: t, term: term, defineGlossary: defineGlossary, switchLang: switchLang,
    /** For check-page.mjs: the problems in the registered table and the words visible text may use. */
    i18n: { problems: function () { return i18n.table ? checkStrings(i18n.table, { languages: i18n.langs, glossary: i18n.glossary }) : ['no string table (Simdeck.useStrings)']; }, words: allowedWords }
  });
  // Live values (Object.assign above would copy a getter's value once).
  Object.defineProperty(Simdeck, 'lang', { get: function () { return i18n.lang; } });
  Object.defineProperty(Simdeck, 'languages', { get: function () { return i18n.langs.slice(); } });
  root.Simdeck = Simdeck;
  if (typeof module === 'object' && module.exports) module.exports = Simdeck;
})(typeof globalThis !== 'undefined' ? globalThis : this);
