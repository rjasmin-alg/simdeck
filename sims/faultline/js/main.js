// Spike wiring. No editor yet: pick a scenario, break things, read the answer.
//
// Module-scope order matters — boot runs top to bottom and calls render()
// immediately, so all `let` state must be declared above the boot section or
// you get a temporal-dead-zone ReferenceError that silently kills the rest of
// boot. topologydrafter learned this the hard way; see its CLAUDE.md.

import { SAMPLES, makeSample } from './samples.js';
import { analyse, invalidate } from './compile.js';
import { applyTheme, initRenderer, paint } from './render.js';
import { evaluator } from './engine/graph.js';
import { authorityById } from './engine/authorities.js';
import { applyStatic, has, lang, switchLang, t } from './i18n.js';
import { clampStep, feedHits, stepOf, stepState, tripId, voteCount, walkFor, withFeed } from './walk.js';

const $ = (sel) => document.querySelector(sel);

let doc = null;
let failedEvents = new Set();   // event ids the user has broken
let litComponents = new Set();  // components highlighted by a hovered/clicked cut
let current = null;             // last analyse() result
// simdeck (preset correlated-failure): the sample's guided walk (js/walk.js), and whether its hidden feed is drawn.
let walk = null;
let feedDrawn = true;

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// simdeck copy: an event's name in the page's language. The engine names a lost domain "<name> lost" and an
// authority by its English name; the view rebuilds both from the event id (ev:dom:<id>, ev:comp:auth:<kind>).
// Component and correlated events already carry the sample's name, which samples.js wrote in this language.
function evName(e) {
  const [, kind, ...rest] = e.id.split(':');
  const target = rest.join(':');
  if (kind === 'dom') {
    const d = current?.doc.domains.find((x) => x.id === target);
    return t('ev.domainLost', { name: d ? d.name : target });
  }
  if (kind === 'comp' && target.startsWith('auth:')) return t(`auth.${target.slice(5)}`);
  return e.name;
}

// --- derivation -----------------------------------------------------------

function failedComponents() {
  const out = new Set();
  if (!current) return out;
  for (const e of current.universe) {
    if (failedEvents.has(e.id)) for (const h of e.hits) out.add(h);
  }
  return out;
}

// simdeck: the document the engine sees. With a walk, the feed event is in it only once the feed is drawn.
const shownDoc = () => (walk ? withFeed(doc, walk, feedDrawn) : doc);

// simdeck: the feed outline on the canvas (dashed, "not drawn"), while a walk has it drawn.
function paintOpts(down) {
  const hits = walk && feedHits(doc, walk, feedDrawn);
  return { down, lit: litComponents, feeds: hits ? [{ hits, label: t(`${walk.strings}.feed`) }] : [] };
}

function render() {
  invalidate();
  current = analyse(shownDoc());
  // Hiding the feed again repairs it: drawn once more, it is whole.
  if (walk && !feedDrawn) failedEvents.delete(tripId(walk));

  const down = failedComponents();
  paint(current.doc, paintOpts(down));
  renderEvents();
  renderCutsets(down);
  renderStatus(down);
  renderWalk(down);
}

// --- simdeck: the guided walk (preset correlated-failure) -----------------

// The step on show follows the state (stepOf), so drawing the feed by hand or breaking PDU A from the rail or the cut
// list moves the walk too; ← and → put the step's own state back.
function renderWalk(down) {
  const bar = $('#walk');
  bar.hidden = !walk;
  if (!walk) return;
  const i = stepOf(walk, { feed: feedDrawn, failed: failedEvents });
  const n = walk.steps.length;
  $('#walk-step').textContent = t('walk.step', { i: i + 1, n });
  $('#walk-caption').textContent = t(`${walk.strings}.cap${i + 1}`);
  $('#walk-prev').setAttribute('aria-disabled', String(i === 0));
  $('#walk-next').setAttribute('aria-disabled', String(i === n - 1));
  $('#walk-feed').checked = feedDrawn;
  const c = voteCount(current.graph, down, walk.service);
  const el = $('#walk-count');
  el.textContent = c ? t('walk.count', { live: c.live, of: c.of, need: c.need }) : '';
  el.className = c && c.live < c.need ? 'down' : 'up';
}

function goStep(i) {
  if (!walk) return;
  const s = stepState(walk, clampStep(walk, i));
  feedDrawn = s.feed;
  failedEvents = s.failed;
  litComponents = new Set();
  render();
}

const walkStep = () => (walk ? stepOf(walk, { feed: feedDrawn, failed: failedEvents }) : 0);

// --- left rail: the things that can break ---------------------------------

function renderEvents() {
  const groups = { correlated: [], domain: [], component: [] };
  for (const e of current.universe) {
    if (e.implicit) continue; // authorities are broken from the right-hand panel
    (groups[e.kind] || groups.component).push(e);
  }

  const labels = {
    correlated: t('ev.groupCorrelated'),
    domain: t('ev.groupDomain'),
    component: t('ev.groupComponent'),
  };

  const html = [];
  for (const [kind, list] of Object.entries(groups)) {
    if (!list.length) continue;
    html.push(`<div class="ev-group">${labels[kind]}</div>`);
    for (const e of list) {
      const on = failedEvents.has(e.id);
      html.push(
        `<button class="ev${on ? ' on' : ''}" type="button" data-ev="${esc(e.id)}"` +
        (e.note ? ` title="${esc(e.note)}"` : '') + '>' +
        `<span class="ev-kind">${e.hits.size}</span>` +
        `<span>${esc(evName(e))}</span></button>`,
      );
    }
  }
  $('#event-list').innerHTML = html.join('');
}

// --- right rail: the answer -----------------------------------------------

function cutHtml(cut, i) {
  const names = cut.events.map((e) => esc(evName(e))).join(' <b>+</b> ');
  const q = cut.events.length === 1 ? authorityById(cut.events[0].id.replace('ev:comp:', '')) : null;
  return (
    `<div class="cut sz${Math.min(cut.size, 3)}" data-cut="${i}">` +
    `<div class="cut-head">` +
    `<span class="cut-size">${cut.size}</span>` +
    `<span class="cut-names">${names}</span>` +
    `<span class="cut-radius">${esc(t('cut.hit', { n: cut.blastRadius }))}</span>` +
    `</div>` +
    (q ? `<p class="cut-q">${esc(t(`authq.${q.kind}`))}</p>` : '') +
    `</div>`
  );
}

function renderCutsets(down) {
  const s = current.services[0];
  if (!s) { $('#cutset-panel').innerHTML = `<p class="empty">${esc(t('cut.noService'))}</p>`; return; }

  const html = [];
  html.push(`<div class="section-label">${esc(t('cut.drawn'))}</div>`);
  if (s.drawnCuts.length) {
    s.drawnCuts.forEach((c, i) => html.push(cutHtml(c, s.cuts.indexOf(c))));
  } else {
    html.push(`<p class="empty">${esc(t('cut.noneDrawn'))}</p>`);
  }

  if (s.implicitCuts.length) {
    const n = s.drawnCuts.filter((c) => c.size === 1).length;
    html.push(
      '<div class="reveal">' +
      `<h3>${esc(t(n ? 'cut.revealMore' : 'cut.revealZero'))}</h3>` +
      `<p>${esc(t('cut.revealText'))}</p>` +
      '</div>',
    );
    s.implicitCuts.forEach((c) => html.push(cutHtml(c, s.cuts.indexOf(c))));
  }

  $('#cutset-panel').innerHTML = html.join('');
}

// The engine hands back a scope token ("region", "rack", "component"); saying it
// out loud is the view's job. This lives in the footer rather than the panel
// because the footer cannot be scrolled away from, and because the number on its
// own is the part that misleads — "1" is both `threeZone`, which is redundant to
// the region boundary, and a design where one server ends it.
//
// simdeck copy: the scope words are in strings.js, scope1.<scope> ("one region") and scopeN.<scope> (the unit in
// "2 things at region scale"); a scope the table lacks (a domain kind someone made up) is said as it is written.
const scopeWord = (prefix, scope) => (has(`${prefix}.${scope}`) ? t(`${prefix}.${scope}`) : scope);

function headline(h) {
  if (!h) return t('hl.none');
  return h.size === 1
    ? t('hl.one', { unit: scopeWord('scope1', h.scope), hit: h.blastRadius })
    : t('hl.many', { n: h.size, unit: scopeWord('scopeN', h.scope), hit: h.blastRadius });
}

function renderStatus(down) {
  const s = current.services[0];
  if (!s) return;
  const ev = evaluator(current.graph, down);
  const up = ev.isUp(s.service.id);
  const el = $('#verdict');
  el.className = up ? 'up' : 'down';
  el.textContent = t(up ? 'st.up' : 'st.down', { name: s.service.name });
  $('#searched').textContent =
    `${headline(s.smallestDrawn)} · ` +
    `${t('st.cuts', { n: s.cuts.length })} ` +
    `${t('st.split', { drawn: s.drawnCuts.length, hidden: s.implicitCuts.length })} · ` +
    t('st.searched', { n: s.searched, num: s.searched.toLocaleString(lang() === 'hr' ? 'hr-HR' : 'en-GB'), size: s.maxSize }) +
    (s.truncated ? ` · ${t('st.truncated')}` : '');
}

// --- events ---------------------------------------------------------------

// simdeck copy: the sample on the canvas, kept for ?sample= when the language switches.
let sampleKey = null;

function load(key, step = 0) {
  sampleKey = key;
  $('#sample-picker').value = key;
  doc = makeSample(key);
  doc.settings = { ...doc.settings, maxCutSize: Number($('#max-size').value) };
  // simdeck: the box follows the sample (onePdu runs with the authorities off; the rest with them on).
  $('#toggle-auth').checked = doc.settings.authorities !== false;
  failedEvents = new Set();
  litComponents = new Set();
  walk = walkFor(key);
  feedDrawn = true;
  if (walk) goStep(step); else render();
}

function applySettings() {
  doc.settings = {
    ...doc.settings,
    maxCutSize: Number($('#max-size').value),
    authorities: $('#toggle-auth').checked,
  };
  render();
}

// --- boot -----------------------------------------------------------------

// simdeck copy: the page's language (js/i18n.js) and the URL settings: ?sample=<key> (threeZone, onePdu, sizeTwo,
// usEast1, frontDoor), ?theme=light|dark (else the OS setting, followed live), ?motion=reduce. The original had no
// URL settings and always painted light.
const params = new URLSearchParams(location.search);
applyStatic();
document.title = t('ui.pageTitle');
const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
function applyPageTheme() {
  const asked = params.get('theme');
  const dark = asked === 'dark' || (asked !== 'light' && !!darkQuery?.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  applyTheme(dark ? 'dark' : 'light');
}
document.documentElement.classList.toggle('reduce-motion', params.get('motion') === 'reduce');

initRenderer($('#canvas'));
applyPageTheme();
darkQuery?.addEventListener?.('change', applyPageTheme);
$('#btn-lang').addEventListener('click', () => {
  const next = new URLSearchParams(location.search);
  if (sampleKey) next.set('sample', sampleKey);
  if (walk) next.set('step', String(walkStep() + 1)); else next.delete('step');
  switchLang(next);
});

$('#sample-picker').innerHTML = Object.entries(SAMPLES)
  .map(([k, v]) => `<option value="${esc(k)}">${esc(v.label)}</option>`)
  .join('');

$('#sample-picker').addEventListener('change', (e) => load(e.target.value));
$('#max-size').addEventListener('change', applySettings);
$('#toggle-auth').addEventListener('change', applySettings);
$('#reset').addEventListener('click', () => { failedEvents = new Set(); render(); });

// simdeck: the walk's controls. ← → and PgUp/PgDn (a clicker), Home and End, unless a select has the focus (its
// arrows change the option). A step past either end does nothing; the button says so with aria-disabled.
$('#walk-prev').addEventListener('click', () => goStep(walkStep() - 1));
$('#walk-next').addEventListener('click', () => goStep(walkStep() + 1));
$('#walk-feed').addEventListener('change', (e) => { feedDrawn = e.target.checked; render(); });
document.addEventListener('keydown', (e) => {
  if (!walk || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('select, textarea, input[type="text"]')) return;
  const to = {
    ArrowRight: walkStep() + 1, PageDown: walkStep() + 1,
    ArrowLeft: walkStep() - 1, PageUp: walkStep() - 1,
    Home: 0, End: walk.steps.length - 1,
  }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  goStep(to);
});

$('#event-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ev]');
  if (!btn) return;
  const id = btn.dataset.ev;
  if (failedEvents.has(id)) failedEvents.delete(id); else failedEvents.add(id);
  render();
});

// Hovering a cut lights up exactly what it reaches, which is the fastest way to
// see why "three racks" was never three of anything.
$('#cutset-panel').addEventListener('mouseover', (e) => {
  const el = e.target.closest('[data-cut]');
  if (!el) return;
  const cut = current.services[0].cuts[Number(el.dataset.cut)];
  const byId = new Map(current.universe.map((x) => [x.id, x]));
  litComponents = new Set();
  for (const ev of cut.events) for (const h of byId.get(ev.id)?.hits || []) litComponents.add(h);
  paint(current.doc, paintOpts(failedComponents()));
});
$('#cutset-panel').addEventListener('mouseleave', () => {
  litComponents = new Set();
  paint(current.doc, paintOpts(failedComponents()));
});

// Clicking a cut breaks it, so you can walk from "here is a single point of
// failure" to "here is the service down" in one gesture.
$('#cutset-panel').addEventListener('click', (e) => {
  const el = e.target.closest('[data-cut]');
  if (!el) return;
  const cut = current.services[0].cuts[Number(el.dataset.cut)];
  failedEvents = new Set(cut.events.map((x) => x.id));
  render();
});

// simdeck: ?step=1..n opens a walk at that step (onePdu); out-of-range values are clamped, others ignored.
load(SAMPLES[params.get('sample')] ? params.get('sample') : Object.keys(SAMPLES)[0], Number(params.get('step') || 1) - 1);

window.FL = { get doc() { return doc; }, get current() { return current; }, load, render, get step() { return walkStep(); } };
