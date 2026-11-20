// SPDX-License-Identifier: AGPL-3.0-or-later
// Language of a published page (home, course). The build writes every text in both languages, one span per
// language ([data-l]); the page's CSS shows the spans of html[lang]. This script picks the language as the kit does
// in a sim (?lang=, else the visitor's last choice on any simdeck page, else the page's own default), and keeps the
// links to sims and to the home page in that language. Without script the page reads in its default language.
(function () {
  'use strict';
  var KEY = 'simdeck.lang';
  var LANGS = ['hr', 'en'];
  var html = document.documentElement;
  var fallback = html.lang;
  var stored = null;
  try { stored = window.localStorage.getItem(KEY); } catch (e) { /* storage off: ?lang= still works */ }
  var lang = [new URLSearchParams(window.location.search).get('lang'), stored, fallback].filter(function (l) { return LANGS.indexOf(l) >= 0; })[0] || 'hr';
  html.lang = lang; // before the body paints: no flash of the other language

  // Theme, as in a sim (kit/kit.js): the OS's, unless the visitor chose one with the theme button; the choice is kept
  // for every simdeck page under simdeck.theme (and ossim.theme, which the imported ossimulator pages read).
  // ?theme=light|dark is for checks and is not stored. Without data-theme the CSS follows the OS.
  var THEME_KEY = 'simdeck.theme';
  var darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function osTheme() { return darkMq && darkMq.matches ? 'dark' : 'light'; }
  function wantedTheme() {
    var q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'light' || q === 'dark') return q;
    try { var t = window.localStorage.getItem(THEME_KEY); if (t === 'light' || t === 'dark') return t; } catch (e) { /* storage off */ }
    return null;
  }
  function setTheme(t) { if (t) html.dataset.theme = t; else delete html.dataset.theme; }
  function theme() { return html.dataset.theme || osTheme(); }
  setTheme(wantedTheme()); // before the body paints: no flash of the other theme
  function syncThemeButtons() {
    document.querySelectorAll('[data-theme-switch]').forEach(function (b) { b.setAttribute('aria-pressed', String(theme() === 'dark')); });
  }
  if (darkMq && darkMq.addEventListener) darkMq.addEventListener('change', syncThemeButtons);
  window.addEventListener('storage', function (e) { if (e.key === THEME_KEY || e.key === null) { setTheme(wantedTheme()); syncThemeButtons(); } });

  // A set link (?set=vlan,cephsim:three-racks) keeps its commas and colons readable: both are fine in a query.
  function readable(qs) { return qs.replace(/%2C/gi, ',').replace(/%3A/gi, ':'); }
  function withLang(href, l) {
    var i = href.indexOf('?');
    var base = i < 0 ? href : href.slice(0, i);
    var q = new URLSearchParams(i < 0 ? '' : href.slice(i + 1));
    q.set('lang', l);
    return base + '?' + readable(q.toString());
  }
  function apply(l) {
    html.lang = l;
    document.querySelectorAll('a[data-lang-link]').forEach(function (a) { a.setAttribute('href', withLang(a.getAttribute('href'), l)); });
    // [data-t-attr="placeholder aria-label"] takes those attributes from data-hr / data-en.
    document.querySelectorAll('[data-t-attr]').forEach(function (el) {
      el.dataset.tAttr.split(/\s+/).forEach(function (name) { el.setAttribute(name, el.dataset[l] || ''); });
    });
    var u = new URLSearchParams(window.location.search);
    if (l === fallback) u.delete('lang'); else u.set('lang', l);
    var qs = readable(u.toString());
    try { window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash); } catch (e) { /* file:// in some browsers */ }
  }
  document.addEventListener('DOMContentLoaded', function () {
    apply(lang);
    syncThemeButtons();
    document.querySelectorAll('[data-theme-switch]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = theme() === 'dark' ? 'light' : 'dark';
        try {
          if (t === osTheme()) { window.localStorage.removeItem(THEME_KEY); window.localStorage.removeItem('ossim.theme'); }
          else { window.localStorage.setItem(THEME_KEY, t); window.localStorage.setItem('ossim.theme', t); }
        } catch (e) { /* storage off: the choice lasts for this page only */ }
        setTheme(t);
        syncThemeButtons();
      });
    });
    document.querySelectorAll('[data-lang-switch]').forEach(function (b) {
      b.addEventListener('click', function () {
        lang = lang === 'hr' ? 'en' : 'hr';
        try { window.localStorage.setItem(KEY, lang); } catch (e) { /* see above */ }
        apply(lang);
      });
    });
  });
})();
