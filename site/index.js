// SPDX-License-Identifier: AGPL-3.0-or-later
// The published home page's one script. The build inlines it after STR (the page's own words in both languages)
// and parseSet, setParam and plural from site/core.mjs, so set links are read by the same code the tests cover.
//   home:              search as you type (/ focuses, Enter opens the first hit, Esc clears), topic chips, and the
//                      selection: + on a tile or a preset chip, kept in this browser (localStorage)
//   ?set=a,b,host:p    the lecture view: a numbered agenda and a big preview; ←/→, PgUp/PgDn, 1–9 move, Enter opens
//   ?set=…&print=1     the handout: the same set as a one-page A4 list (also what printing the lecture view gives)
// Everything is built from the tiles the build wrote into the page: no data blob.
/* global STR, parseSet, setParam, plural */
(function () {
  'use strict';
  var html = document.documentElement;
  var TRAY_KEY = 'simdeck.tray';
  var SET_KEY = 'simdeck.set'; // read by the kit's back link (kit/kit.js setReturn): back to the lecture, not home
  var params = new URLSearchParams(location.search);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var lang = function () { return html.lang === 'en' ? 'en' : 'hr'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var two = function (hr, en) { return hr === en ? esc(hr) : '<span data-l="hr" lang="hr">' + esc(hr) + '</span><span data-l="en" lang="en">' + esc(en) + '</span>'; };
  var t = function (k) { return two(STR.hr[k], STR.en[k]); };
  var count = function (k, n) { return two(n + ' ' + plural('hr', n, STR.hr[k]), n + ' ' + plural('en', n, STR.en[k])); };
  var fold = function (s) { return s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function storage(area, op, k, v) {
    try {
      var s = window[area];
      if (op === 'get') return s.getItem(k);
      if (op === 'set') s.setItem(k, v); else s.removeItem(k);
    } catch (e) { /* storage off (private window, file:// policy): the page works without it */ }
    return null;
  }
  /** A page-relative link with ?lang= set to the page's language (site/lang.js does the same for static links). */
  function withLang(href) {
    var i = href.indexOf('?');
    var q = new URLSearchParams(i < 0 ? '' : href.slice(i + 1));
    q.set('lang', lang());
    return (i < 0 ? href : href.slice(0, i)) + '?' + q.toString().replace(/%2C/gi, ',').replace(/%3A/gi, ':');
  }
  function toast(k) {
    var el = $('#toast');
    el.innerHTML = t(k);
    el.classList.add('on');
    setTimeout(function () { el.classList.remove('on'); }, 1800);
  }

  // ── items: each tile and preset chip the build wrote, by id ──
  var byId = new Map($$('.tile[data-id], .preset[data-id]').map(function (el) { return [el.dataset.id, el]; }));
  function info(id) {
    var el = byId.get(id);
    var tile = el.closest('.tile');
    var preset = el !== tile;
    var inner = function (sel, root) { var x = $(sel, root); return x ? x.innerHTML : ''; };
    var img = $('.pic img', tile);
    return {
      id: id, cls: el.dataset.class, topic: el.dataset.topic, url: el.dataset.url, accent: tile.style.getPropertyValue('--tc'),
      href: $('a', el).getAttribute('href').replace(/([?&])lang=\w+(&|$)/, '$1').replace(/[?&]$/, ''),
      title: (preset ? inner('h3.t-title', tile) + ' › ' : '') + inner('.t-title', el),
      concept: inner('.t-concept', el),
      summary: inner('.t-summary', el) || inner('.t-summary', tile),
      img: img ? img.getAttribute('src') : '',
      ph: inner('.ph', tile),
      topicLabel: inner('#t-' + el.dataset.topic + ' .t-topic'),
    };
  }
  var pic = function (x) { return x.img ? '<img src="' + esc(x.img) + '" alt="">' : '<span class="ph" aria-hidden="true">' + x.ph + '</span>'; };
  var siteUrl = (document.body.dataset.siteUrl || '').replace(/\/?$/, '/');
  /** The set's address to share: on the published site, else (file://, a USB stick) this page's own. */
  function shareUrl(ids) {
    var base = /^https?:/.test(siteUrl) ? siteUrl : location.href.split(/[?#]/)[0];
    return base + '?set=' + setParam(ids);
  }
  function copyLink(ids) {
    var url = shareUrl(ids);
    var done = function () { toast('copied'); };
    var fallback = function () { window.prompt('', url); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback);
    else fallback();
  }
  var setHref = function (ids, extra) { return withLang('index.html?set=' + setParam(ids)) + (extra || ''); };
  var toggleLang = function () { var b = $('[data-lang-switch]'); if (b) b.click(); };
  var typing = function () { return /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName); };

  if (params.has('set')) lectureView(); else home();

  // ── home ──
  function home() {
    storage('sessionStorage', 'del', SET_KEY);
    var q = $('#q');
    var tiles = $$('.tile');
    var words = [];
    var match = function (s) { return words.every(function (w) { return s.indexOf(w) >= 0; }); };
    /** A tile shows when its own words match, or a preset chip's do (with the tile's words, so "stp storm" works). */
    function filter() {
      words = fold(q.value).split(/\s+/).filter(Boolean);
      var shown = 0;
      tiles.forEach(function (tile) {
        var own = match(tile.dataset.s);
        var hits = 0;
        $$('.preset', tile).forEach(function (p) {
          var hit = words.length > 0 && match(p.dataset.s + ' ' + tile.dataset.s) && !own;
          p.classList.toggle('hit', hit);
          hits += hit;
        });
        var ul = $('.presets', tile);
        if (ul) ul.classList.toggle('open', hits > 0 && !!$('.more.hit', ul));
        tile.hidden = !(own || hits);
        shown += !tile.hidden;
      });
      $$('.topic').forEach(function (s) { s.hidden = !$('.tile:not([hidden])', s); });
      $$('[data-chip]').forEach(function (c) { var s = $('#t-' + c.dataset.chip); c.classList.toggle('dim', !s || s.hidden); });
      $('#none').hidden = shown > 0 || !tiles.length;
      $('#shown').textContent = words.length ? shown + ' / ' + tiles.length : '';
    }
    q.addEventListener('input', filter);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        // The first hit whose title has every word (both languages), else the first hit on the page.
        var shown = tiles.filter(function (x) { return !x.hidden; });
        var tile = shown.filter(function (x) { return match(fold($('h3', x).textContent)); })[0] || shown[0];
        var a = tile && ($('.preset.hit a', tile) || $('.tile-link', tile));
        if (a) a.click();
      }
      if (e.key === 'Escape') { q.value = ''; filter(); }
    });

    // The selection: ids in order, per browser. The shareable form is the ?set= link.
    var tray = [];
    try { tray = JSON.parse(storage('localStorage', 'get', TRAY_KEY) || '[]'); } catch (e) { tray = []; }
    tray = Array.isArray(tray) ? tray.filter(function (id) { return byId.has(id); }) : [];
    function save() { storage('localStorage', 'set', TRAY_KEY, JSON.stringify(tray)); sync(); }
    function sync() {
      var l = lang();
      $$('[data-pick]').forEach(function (b) {
        var on = tray.indexOf(b.dataset.pick) >= 0;
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', STR[l][on ? 'remove' : 'add']);
        b.title = STR[l][on ? 'remove' : 'add'];
        if (!b.classList.contains('pick-sm')) b.closest('.tile').classList.toggle('picked', on);
      });
      $('#tray-n').textContent = tray.length;
      $('#tray-empty').hidden = tray.length > 0;
      $('#tray-list').innerHTML = tray.map(function (id, i) {
        var x = info(id);
        var btn = function (k, attr, label) { return '<button type="button" ' + attr + ' aria-label="' + esc(STR[l][k]) + '" title="' + esc(STR[l][k]) + '">' + label + '</button>'; };
        return '<li data-id="' + esc(id) + '" style="--tc:' + x.accent + '"><span class="n">' + (i + 1) + '</span><span class="pic">' + pic(x) + '</span><span class="ti">' + x.title + '</span>'
          + btn('up', 'data-move="-1"', '↑') + btn('down', 'data-move="1"', '↓') + btn('remove', 'data-unpick="' + esc(id) + '"', '✕') + '</li>';
      }).join('');
      $$('[data-tray-act]').forEach(function (b) { b.setAttribute('aria-disabled', String(!tray.length)); });
      document.body.classList.toggle('has-tray', tray.length > 0);
      if (!tray.length) open(false);
    }
    function pick(id) {
      var i = tray.indexOf(id);
      if (i >= 0) tray.splice(i, 1); else tray.push(id);
      save();
    }
    function open(on) {
      document.body.classList.toggle('tray-open', on);
      $$('[data-tray-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', String(on)); });
    }
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-pick], [data-unpick], [data-move], [data-tray-toggle], [data-tray-act], [data-more]');
      if (!el) return;
      if (el.dataset.pick) { e.preventDefault(); pick(el.dataset.pick); }
      else if (el.dataset.unpick) pick(el.dataset.unpick);
      else if (el.dataset.move) {
        var id = el.closest('li').dataset.id, i = tray.indexOf(id), j = i + Number(el.dataset.move);
        if (j >= 0 && j < tray.length) { tray.splice(i, 1); tray.splice(j, 0, id); save(); $('[data-move="' + el.dataset.move + '"]', $('#tray-list li[data-id="' + id + '"]')).focus(); }
      } else if (el.hasAttribute('data-tray-toggle')) open(!document.body.classList.contains('tray-open'));
      else if (el.hasAttribute('data-more')) el.closest('.presets').classList.add('open');
      else if (tray.length) {
        var act = el.dataset.trayAct;
        if (act === 'lecture') location.href = setHref(tray);
        if (act === 'handout') location.href = setHref(tray, '&print=1');
        if (act === 'copy') copyLink(tray);
        if (act === 'clear') { tray = []; save(); }
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/' && !typing()) { e.preventDefault(); q.focus(); q.select(); }
      else if ((e.key === 'l' || e.key === 'L') && !typing()) toggleLang();
      else if (e.key === 'Escape' && document.body.classList.contains('tray-open')) open(false);
    });
    // Labels follow the language switch (site/lang.js sets html[lang]).
    new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['lang'] });

    // Chips jump to their shelf, which lands just under the sticky bar (one or two rows of chips); the one in view
    // is marked.
    var pad = function () { html.style.scrollPaddingTop = ($('.bar').offsetHeight + 16) + 'px'; };
    addEventListener('resize', pad);
    pad();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) $$('[data-chip]').forEach(function (c) { c.classList.toggle('here', c.dataset.chip === en.target.dataset.topic); });
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      $$('.topic').forEach(function (s) { io.observe(s); });
    }
    sync();
    filter();
  }

  // ── the lecture view and the handout ──
  function lectureView() {
    var set = parseSet(params.get('set'), byId);
    var ids = set.items;
    var xs = ids.map(info);
    var title = params.get('title');
    var printing = params.get('print') === '1';
    var sw = $('[data-lang-switch]');
    var footer = $('#home footer').innerHTML;
    document.body.classList.add(printing ? 'mode-handout' : 'mode-lecture');
    $('#home').remove();
    var root = $('#set');
    root.hidden = false;
    var heading = title ? esc(title) : t(printing ? 'handout' : 'lecture');
    var head = '<header class="set-head"><a class="back" data-lang-link href="index.html">' + t('allSimsBack') + '</a>'
      + '<h1>' + heading + ' <small>' + count('sims', xs.length) + '</small></h1><span class="set-tools">'
      + (printing ? '<a class="btn" href="' + esc(setHref(ids, title ? '&title=' + encodeURIComponent(title) : '')) + '">▶ ' + t('lecture') + '</a><button type="button" class="btn" data-set-act="print">' + t('print') + '</button>'
        : '<button type="button" class="btn" data-set-act="handout">' + t('handout') + '</button>')
      + '<button type="button" class="btn" data-set-act="copy">' + t('copyLink') + '</button>' + (sw ? sw.outerHTML : '') + '</span></header>';
    var skipped = set.skipped.length ? '<p class="skipped">' + t('unknown') + ': ' + esc(set.skipped.join(', ')) + '</p>' : '';
    var lecture = printing ? '' : '<main class="lecture"><nav class="lt-list" aria-label="' + esc(STR[lang()].lecture) + '">' + xs.map(function (x, i) {
      return '<a class="lt" data-lang-link href="' + esc(x.href) + '" data-i="' + i + '" style="--tc:' + x.accent + '"><span class="lt-n">' + (i + 1) + '</span>'
        + '<span class="lt-text"><span class="lt-topic">' + x.topicLabel + '</span><strong>' + x.title + '</strong></span></a>';
    }).join('') + '</nav><section id="lt-stage" aria-live="polite"></section></main><p class="hint">' + t('lectureHint') + '</p>';
    // The handout: always in the page, so printing the lecture view prints it too. Tools stay off it, as on course pages.
    var onPaper = xs.filter(function (x) { return x.cls !== 'tool'; });
    var tools = xs.filter(function (x) { return x.cls === 'tool'; });
    var date = new Date().toLocaleDateString(lang() === 'en' ? 'en-GB' : 'hr-HR', { day: 'numeric', month: 'numeric', year: 'numeric' });
    var handout = '<article class="handout"><header><h1>' + heading + '</h1><p class="h-sub">' + esc($('title').textContent) + ' · ' + esc(date) + '</p>'
      + '<p class="h-url">' + t('openAt') + ' <b>' + esc(shareUrl(ids).replace(/^https?:\/\//, '')) + '</b></p></header><ol>'
      + onPaper.map(function (x) {
        return '<li style="--tc:' + x.accent + '">' + pic(x) + '<div><strong>' + x.title + '</strong><span class="h-concept">' + x.concept + '</span>'
          + '<span class="h-summary">' + x.summary + '</span><span class="h-link">' + esc(x.url.replace(/^https?:\/\//, '')) + '</span></div></li>';
      }).join('') + '</ol>'
      + (tools.length ? '<p class="h-left noprint">' + t('toolLeftOut') + ': ' + tools.map(function (x) { return x.title; }).join(', ') + '</p>' : '')
      + '<footer>' + footer + '</footer></article>';
    root.innerHTML = head + skipped + lecture + handout;

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set-act]');
      if (!b) return;
      if (b.dataset.setAct === 'copy') copyLink(ids);
      if (b.dataset.setAct === 'handout') location.href = setHref(ids, (title ? '&title=' + encodeURIComponent(title) : '') + '&print=1');
      if (b.dataset.setAct === 'print') window.print();
    });
    document.addEventListener('keydown', function (e) {
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'l' || e.key === 'L')) toggleLang();
    });
    if (printing || !xs.length) return;

    // The current sim is kept in the hash (?set=…#3), so the browser's Back from a sim lands on it, and in
    // sessionStorage, so the kit's "← Popis" in the sim comes back here too (also from file://, which has no referrer).
    var tiles = $$('.lt');
    var cur = Math.min(Math.max((parseInt(location.hash.slice(1), 10) || 1) - 1, 0), tiles.length - 1);
    function go(i) {
      cur = Math.min(Math.max(i, 0), tiles.length - 1);
      tiles.forEach(function (a, k) { a.classList.toggle('cur', k === cur); a.setAttribute('aria-current', String(k === cur)); });
      var list = $('.lt-list');
      if (list.scrollHeight > list.clientHeight) list.scrollTop = Math.min(Math.max(list.scrollTop, tiles[cur].offsetTop + tiles[cur].offsetHeight - list.clientHeight + 8), tiles[cur].offsetTop - 8);
      var x = xs[cur];
      $('#lt-stage').innerHTML = '<a class="ls" href="' + esc(withLang(x.href)) + '" style="--tc:' + x.accent + '"><span class="pic">' + pic(x) + '</span>'
        + '<span class="ls-text"><span class="lt-topic">' + (cur + 1) + ' / ' + xs.length + ' · ' + x.topicLabel + '</span>'
        + '<strong>' + x.title + '</strong><span class="ls-concept">' + x.concept + '</span><span class="ls-summary">' + x.summary + '</span>'
        + '<span class="ls-go">' + t('enterOpens') + '</span></span></a>';
      try { history.replaceState(null, '', location.pathname + location.search + '#' + (cur + 1)); } catch (e) { /* some file:// browsers */ }
      storage('sessionStorage', 'set', SET_KEY, location.href);
    }
    go(cur);
    // The language switch rewrites ?lang= in the address: remember the new one for the way back.
    new MutationObserver(function () { go(cur); }).observe(html, { attributes: true, attributeFilter: ['lang'] });
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || typing()) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === 'ArrowDown') { e.preventDefault(); go(cur + 1); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') { e.preventDefault(); go(cur - 1); }
      else if (k === 'Home') { e.preventDefault(); go(0); }
      else if (k === 'End') { e.preventDefault(); go(tiles.length - 1); }
      else if (/^[1-9]$/.test(k)) go(Number(k) - 1);
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); location.href = $('#lt-stage a').getAttribute('href'); }
      else if (k === 'p' || k === 'P') location.href = setHref(ids, (title ? '&title=' + encodeURIComponent(title) : '') + '&print=1');
    });
    tiles.forEach(function (a, k) {
      a.addEventListener('mouseenter', function () { go(k); });
      a.addEventListener('focus', function () { if (k !== cur) go(k); });
    });
  }
})();
