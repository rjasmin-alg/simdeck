// The lecturer's index. Data is inlined by the build (#simdeck-data), so the page works from file://.
// Filter state lives in the URL hash (bookmarkable; a sim's back link returns here with #sim=<id>);
// the handout selection lives in localStorage, as a per-viewer convenience only.
/* global search, group, entryHref, escapeHtml, normalise, STR -- inlined from core.js */

const DATA = JSON.parse(document.getElementById('simdeck-data').textContent);
const { site, vocab, entries, courses } = DATA;
const byId = new Map(entries.map((e) => [e.id, e]));
const topicIds = Object.keys(vocab.topics);
const $ = (id) => document.getElementById(id);
const SEL_KEY = 'simdeck.selection';

const TAG_ROW = 14; // chips shown before "više"; the rest stay one click away
const state = { q: '', tags: [], group: 'topic', view: 'cards', course: '', level: '', cls: '', lang: '', sim: '' };
let selection = loadSelection();
let visible = []; // flat list of entries in display order, for keyboard navigation
let active = -1;
let allTags = false;
let tagIds = [];

function loadSelection() {
  try {
    const v = JSON.parse(localStorage.getItem(SEL_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((id) => byId.has(id)) : [];
  } catch {
    return [];
  }
}
function saveSelection() {
  try {
    localStorage.setItem(SEL_KEY, JSON.stringify(selection));
  } catch {
    /* storage unavailable: the selection just won't survive a reload */
  }
}

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.q = p.get('q') ?? '';
  state.tags = (p.get('tags') ?? '').split(',').filter((t) => t in vocab.tags);
  state.group = ['topic', 'course', 'none'].includes(p.get('group')) ? p.get('group') : 'topic';
  state.view = p.get('view') === 'list' ? 'list' : 'cards';
  state.course = courses.some((c) => c.id === p.get('course')) ? p.get('course') : '';
  state.level = p.get('level') ?? '';
  state.cls = p.get('cls') ?? '';
  state.lang = p.get('lang') ?? '';
  state.sim = p.get('sim') ?? '';
}
function writeHash() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.tags.length) p.set('tags', state.tags.join(','));
  if (state.group !== 'topic') p.set('group', state.group);
  if (state.view !== 'cards') p.set('view', state.view);
  for (const k of ['course', 'level', 'cls', 'lang']) if (state[k]) p.set(k, state[k]);
  const h = p.toString();
  history.replaceState(null, '', h ? `#${h}` : location.pathname + location.search);
}

function initControls() {
  const opt = (sel, value, label) => sel.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`);
  for (const c of courses) opt($('f-course'), c.id, c.title);
  for (const [k, v] of Object.entries(STR.levels)) opt($('f-level'), k, v);
  for (const [k, v] of Object.entries(STR.classes)) opt($('f-cls'), k, v);

  // Only tags that are actually used, most used first, so the chip row stays short.
  const use = new Map();
  for (const e of entries) for (const t of e.tags) use.set(t, (use.get(t) ?? 0) + 1);
  tagIds = [...use.keys()].sort((a, b) => use.get(b) - use.get(a) || (a < b ? -1 : 1));

  $('courses-list').innerHTML = courses.length
    ? `Kolegiji: ${courses.map((c) => `<a href="courses/${encodeURIComponent(c.id)}/index.html">${escapeHtml(c.title)}</a>`).join(' · ')}`
    : '';

  $('q').addEventListener('input', () => {
    state.q = $('q').value;
    update(true);
  });
  for (const k of ['course', 'level', 'cls', 'lang']) {
    $(`f-${k}`).addEventListener('change', () => {
      state[k] = $(`f-${k}`).value;
      update(true);
    });
  }
  document.querySelectorAll('[data-group]').forEach((b) =>
    b.addEventListener('click', () => {
      state.group = b.dataset.group;
      update(false);
    }),
  );
  document.querySelectorAll('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      state.view = b.dataset.view;
      update(false);
    }),
  );
  $('tags').addEventListener('click', (ev) => {
    if (ev.target.closest('#more-tags')) {
      allTags = !allTags;
      syncControls();
      return;
    }
    const t = ev.target.closest('[data-tag]')?.dataset.tag;
    if (!t) return;
    state.tags = state.tags.includes(t) ? state.tags.filter((x) => x !== t) : [...state.tags, t];
    update(true);
  });
  $('reset').addEventListener('click', () => {
    Object.assign(state, { q: '', tags: [], course: '', level: '', cls: '', lang: '' });
    update(true);
    $('q').focus();
  });
  $('results').addEventListener('click', (ev) => {
    const id = ev.target.closest('[data-pick]')?.dataset.pick;
    if (id) togglePick(id);
  });
  $('tray-clear').addEventListener('click', () => {
    selection = [];
    saveSelection();
    render();
  });
  $('tray-open').addEventListener('click', () => {
    location.href = handoutHref();
  });
  $('tray-json').addEventListener('click', copyCourseJson);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => {
    readHash();
    syncControls();
    render();
  });
}

function handoutHref() {
  const p = new URLSearchParams();
  const title = $('tray-title').value.trim();
  if (title) p.set('title', title);
  p.set('ids', selection.join(','));
  return `handout.html#${p.toString()}`;
}

async function copyCourseJson() {
  const title = $('tray-title').value.trim() || 'Novi kolegij';
  const id = normalise(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'novi-kolegij';
  const json = JSON.stringify({ id, title, sections: [{ title: '', sims: selection }] }, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    $('tray-json').textContent = `Kopirano (spremi kao courses/${id}.json)`;
  } catch {
    prompt(`Spremi kao courses/${id}.json`, json);
  }
}

function togglePick(id) {
  selection = selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id];
  saveSelection();
  render();
}

function syncControls() {
  if ($('q').value !== state.q) $('q').value = state.q;
  for (const k of ['course', 'level', 'cls', 'lang']) $(`f-${k}`).value = state[k];
  document.querySelectorAll('[data-group]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.group === state.group)));
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.view === state.view)));
  renderTags();
  document.body.classList.toggle('compact', state.view === 'list');
}

// Most-used tags first; with hundreds of entries only the top TAG_ROW (plus any active ones) show.
function renderTags() {
  const shown = allTags ? tagIds : tagIds.filter((t, i) => i < TAG_ROW || state.tags.includes(t));
  const more = tagIds.length > TAG_ROW ? `<button type="button" id="more-tags" class="link">${allTags ? 'manje' : `više (${tagIds.length - shown.length})`}</button>` : '';
  $('tags').innerHTML = shown.map((t) => `<button type="button" data-tag="${escapeHtml(t)}" aria-pressed="${state.tags.includes(t)}">${escapeHtml(vocab.tags[t].label)}</button>`).join('') + more;
}

function update(resetActive) {
  state.sim = '';
  writeHash();
  syncControls();
  if (resetActive) active = -1;
  render();
}

function card(e) {
  const hue = Math.round((topicIds.indexOf(e.topic) * 360) / Math.max(topicIds.length, 1));
  const initials = e.title.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const thumb = e.thumb ? `<img src="${escapeHtml(e.thumb)}" alt="" loading="lazy">` : escapeHtml(initials);
  const badges = [
    `<span class="badge">${escapeHtml(STR.classes[e.class])}</span>`,
    e.steps ? `<span class="badge">${escapeHtml(STR.steps(e.steps))}</span>` : '',
    `<span class="badge">${escapeHtml(STR.levels[e.level])}</span>`,
    `<span class="badge">${escapeHtml(e.lang.toUpperCase())}</span>`,
    e.kind === 'linked' ? `<span class="badge">↗ ${escapeHtml(STR.linked)}</span>` : '',
    e.status !== 'ready' ? `<span class="badge wip">${escapeHtml(STR.wip)}</span>` : '',
  ].join('');
  const picked = selection.includes(e.id);
  const cls = ['card', picked ? 'picked' : '', e.status !== 'ready' ? 'wip' : ''].filter(Boolean).join(' ');
  return `<li class="${cls}" data-id="${escapeHtml(e.id)}">
<div class="thumb" style="--hue:${hue}">${thumb}</div>
<div class="body"><a class="title" href="${escapeHtml(entryHref(e, site, 0))}">${escapeHtml(e.title)}</a>
<p class="concept">${escapeHtml(e.concept)}</p><p class="summary">${escapeHtml(e.summary)}</p><div class="badges">${badges}</div></div>
<button type="button" class="pick" data-pick="${escapeHtml(e.id)}" aria-pressed="${picked}" title="${picked ? 'Makni iz izročka' : 'Dodaj u izroček'}">${picked ? '✓' : '+'}</button>
</li>`;
}

function render() {
  const list = search(entries, vocab, state.q, { tags: state.tags, course: state.course, level: state.level, cls: state.cls, lang: state.lang });
  const groups = group(list, state.group, vocab, courses);
  visible = groups.flatMap((g) => g.items);
  if (state.sim) active = visible.findIndex((e) => e.id === state.sim);
  if (active >= visible.length) active = visible.length - 1;

  $('count').textContent = `${list.length} / ${entries.length}`;
  $('results').innerHTML = list.length
    ? groups.map((g) => `<section class="group">${g.label ? `<h2>${escapeHtml(g.label)} <span>(${g.items.length})</span></h2>` : ''}<ul class="grid">${g.items.map(card).join('')}</ul></section>`).join('')
    : `<p class="empty">Ništa ne odgovara. <button type="button" class="link" onclick="document.getElementById('reset').click()">Poništi filtre</button></p>`;
  markActive(Boolean(state.sim));

  $('tray').hidden = selection.length === 0;
  $('tray-count').textContent = `Izroček: ${selection.length}`;
  $('tray-json').textContent = 'Kopiraj kao kolegij (JSON)';
}

function markActive(scroll) {
  const cards = [...document.querySelectorAll('.card')];
  // A sim on several courses appears in several groups; highlight its first occurrence.
  cards.forEach((c) => c.classList.remove('active'));
  const id = visible[active]?.id;
  const el = id ? cards.find((c) => c.dataset.id === id && cards.indexOf(c) >= indexOfNth(cards, active)) : null;
  if (el) {
    el.classList.add('active');
    if (scroll) el.scrollIntoView({ block: 'nearest' });
  }
}
function indexOfNth(cards, n) {
  return Math.max(0, Math.min(n, cards.length - 1));
}

function onKey(ev) {
  const inSearch = ev.target === $('q');
  const typing = !inSearch && /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName);
  if (typing) return;
  if (ev.key === '/' && !inSearch) {
    ev.preventDefault();
    $('q').focus();
    $('q').select();
  } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    if (!visible.length) return;
    ev.preventDefault();
    active = ev.key === 'ArrowDown' ? Math.min(active + 1, visible.length - 1) : Math.max(active - 1, 0);
    markActive(true);
  } else if (ev.key === 'Enter' && (inSearch || ev.target === document.body)) {
    const e = visible[active >= 0 ? active : 0];
    if (!e) return;
    ev.preventDefault();
    const href = entryHref(e, site, 0);
    if (ev.ctrlKey || ev.metaKey || e.kind === 'linked') window.open(href, '_blank', 'noopener');
    else location.href = href;
  } else if (ev.key === '+' && !inSearch && visible[active]) {
    togglePick(visible[active].id);
  } else if (ev.key === 'Escape') {
    if (state.q || state.tags.length) {
      state.q = '';
      state.tags = [];
      update(true);
    }
    $('q').focus();
  }
}

readHash();
initControls();
syncControls();
render();
