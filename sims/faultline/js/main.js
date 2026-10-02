// Spike wiring. No editor yet: pick a scenario, break things, read the answer.
//
// Module-scope order matters — boot runs top to bottom and calls render()
// immediately, so all `let` state must be declared above the boot section or
// you get a temporal-dead-zone ReferenceError that silently kills the rest of
// boot. topologydrafter learned this the hard way; see its CLAUDE.md.

import { SAMPLES, makeSample } from './samples.js';
import { analyse, invalidate } from './compile.js';
import { initRenderer, paint } from './render.js';
import { evaluator } from './engine/graph.js';
import { authorityById } from './engine/authorities.js';

const $ = (sel) => document.querySelector(sel);

let doc = null;
let failedEvents = new Set();   // event ids the user has broken
let litComponents = new Set();  // components highlighted by a hovered/clicked cut
let current = null;             // last analyse() result

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- derivation -----------------------------------------------------------

function failedComponents() {
  const out = new Set();
  if (!current) return out;
  for (const e of current.universe) {
    if (failedEvents.has(e.id)) for (const h of e.hits) out.add(h);
  }
  return out;
}

function render() {
  invalidate();
  current = analyse(doc);

  const down = failedComponents();
  paint(current.doc, { down, lit: litComponents });
  renderEvents();
  renderCutsets(down);
  renderStatus(down);
}

// --- left rail: the things that can break ---------------------------------

function renderEvents() {
  const groups = { correlated: [], domain: [], component: [] };
  for (const e of current.universe) {
    if (e.implicit) continue; // authorities are broken from the right-hand panel
    (groups[e.kind] || groups.component).push(e);
  }

  const labels = {
    correlated: 'Correlated events',
    domain: 'Lose a whole domain',
    component: 'Lose one thing',
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
        `<span>${esc(e.name)}</span></button>`,
      );
    }
  }
  $('#event-list').innerHTML = html.join('');
}

// --- right rail: the answer -----------------------------------------------

function cutHtml(cut, i) {
  const names = cut.events.map((e) => esc(e.name)).join(' <b>+</b> ');
  const q = cut.events.length === 1 ? authorityById(cut.events[0].id.replace('ev:comp:', '')) : null;
  return (
    `<div class="cut sz${Math.min(cut.size, 3)}" data-cut="${i}">` +
    `<div class="cut-head">` +
    `<span class="cut-size">${cut.size}</span>` +
    `<span class="cut-names">${names}</span>` +
    `<span class="cut-radius">${cut.blastRadius} hit</span>` +
    `</div>` +
    (q ? `<p class="cut-q">${esc(q.question)}</p>` : '') +
    `</div>`
  );
}

function renderCutsets(down) {
  const s = current.services[0];
  if (!s) { $('#cutset-panel').innerHTML = '<p class="empty">No service in this scenario.</p>'; return; }

  const html = [];
  html.push('<div class="section-label">In what you drew</div>');
  if (s.drawnCuts.length) {
    s.drawnCuts.forEach((c, i) => html.push(cutHtml(c, s.cuts.indexOf(c))));
  } else {
    html.push('<p class="empty">Nothing you drew can take it down on its own.</p>');
  }

  if (s.implicitCuts.length) {
    const n = s.drawnCuts.filter((c) => c.size === 1).length;
    html.push(
      '<div class="reveal">' +
      `<h3>${n ? 'And then there is what nobody drew' : 'It still is not zero'}</h3>` +
      '<p>You can keep adding zones. These do not go away, because ' +
      'something has to be authoritative about what the cluster looks like.</p>' +
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
const SCOPE_WORDS = {
  correlated: 'correlated event',
  component: 'component',
  implicit: 'authority nobody drew',
};

function headline(h) {
  if (!h) return 'nothing you drew can take it down';
  const unit = SCOPE_WORDS[h.scope] || h.scope;
  return h.size === 1
    ? `smallest drawn failure: one ${unit} · ${h.blastRadius} hit`
    : `smallest drawn failure: ${h.size} things at ${unit} scale · ${h.blastRadius} hit`;
}

function renderStatus(down) {
  const s = current.services[0];
  if (!s) return;
  const ev = evaluator(current.graph, down);
  const up = ev.isUp(s.service.id);
  const el = $('#verdict');
  el.className = up ? 'up' : 'down';
  el.textContent = up
    ? `${s.service.name} is serving`
    : `${s.service.name} is down`;
  $('#searched').textContent =
    `${headline(s.smallestDrawn)} · ` +
    `${s.cuts.length} cuts (${s.drawnCuts.length} drawn, ${s.implicitCuts.length} not drawn) · ` +
    `searched ${s.searched.toLocaleString()} combinations to size ${s.maxSize}` +
    (s.truncated ? ' · TRUNCATED' : '');
}

// --- events ---------------------------------------------------------------

function load(key) {
  doc = makeSample(key);
  doc.settings = { ...doc.settings, maxCutSize: Number($('#max-size').value) };
  failedEvents = new Set();
  litComponents = new Set();
  render();
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

initRenderer($('#canvas'));

$('#sample-picker').innerHTML = Object.entries(SAMPLES)
  .map(([k, v]) => `<option value="${esc(k)}">${esc(v.label)}</option>`)
  .join('');

$('#sample-picker').addEventListener('change', (e) => load(e.target.value));
$('#max-size').addEventListener('change', applySettings);
$('#toggle-auth').addEventListener('change', applySettings);
$('#reset').addEventListener('click', () => { failedEvents = new Set(); render(); });

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
  paint(current.doc, { down: failedComponents(), lit: litComponents });
});
$('#cutset-panel').addEventListener('mouseleave', () => {
  litComponents = new Set();
  paint(current.doc, { down: failedComponents(), lit: litComponents });
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

load(Object.keys(SAMPLES)[0]);

window.FL = { get doc() { return doc; }, get current() { return current; }, load, render };
