// SPDX-License-Identifier: AGPL-3.0-or-later
// The home page's tree (site/learn.html). Navigation needs no script: each node is a <section> whose id is its path,
// and CSS :target shows the one in the address (#networks/addresses). This script only makes it pleasant:
//   - a new node starts at the top of the page, its heading focused, and the tab's title names it;
//   - Backspace or Esc goes up one level, / focuses the search, L switches the language;
//   - the search form (a plain GET to the finder, ?q=) carries the page's language along.
(function () {
  'use strict';
  var html = document.documentElement;
  var base = document.title;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var typing = function () { return /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName); };

  function current() {
    var id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { id = ''; }
    var el = id ? document.getElementById(id) : null;
    return el && el.classList.contains('node') ? el : null;
  }
  function show(focus) {
    var node = current();
    var h = node ? $('h2', node) : null;
    // The title in the page's language: the heading's visible span (both are in the page; CSS shows one).
    var vis = h ? $('[data-l="' + html.lang + '"]', h) || h.firstChild : null;
    document.title = vis ? vis.textContent.trim() + ' · ' + base : base;
    if (!focus) return;
    window.scrollTo(0, 0);
    if (h) h.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', function () { show(true); });
  new MutationObserver(function () { show(false); $('#learn-lang').value = html.lang; }).observe(html, { attributes: true, attributeFilter: ['lang'] });
  $('#learn-lang').value = html.lang;
  show(false);

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/' && !typing()) { e.preventDefault(); $('#learn-q').focus(); return; }
    if ((e.key === 'l' || e.key === 'L') && !typing()) { var b = $('[data-lang-switch]'); if (b) b.click(); return; }
    if (e.key === 'Escape' && typing()) { document.activeElement.blur(); return; }
    if ((e.key === 'Backspace' || e.key === 'Escape') && !typing()) {
      var node = current();
      if (!node) return;
      e.preventDefault();
      location.hash = node.dataset.up ? '#' + node.dataset.up : '#';
    }
  });
})();
