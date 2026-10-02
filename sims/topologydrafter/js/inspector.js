// SPDX-License-Identifier: AGPL-3.0-or-later
// Right rail: properties for whatever is selected.
//
// Text fields edit the model live. Each focus-to-blur session collapses into a
// single undo entry, so Ctrl+Z after renaming a box undoes the rename, not the
// last keystroke.

import {
  state, on, commit, beginGesture, endGesture, changed, selectedItems,
  selectedNodes, kindOf, maxStep,
} from './state.js';
import {
  SERVICES, SERVICE_GROUPS, DEVICES, DEVICE_CATEGORIES, LINK_KINDS, ZONE_COLORS, deviceOrDefault, isDefaultLabel,
} from './catalog.js';
import { t } from './i18n.js';
import { alignSelection, connectSelection, groupIntoZone, duplicateSelection, deleteSelection } from './interact.js';

let root;
let serviceQuery = '';
let editing = false;

export function initInspector(container) {
  root = container;
  on('change', maybeRefresh);
  on('selection', () => { serviceQuery = ''; refresh(); });
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  root.addEventListener('focusout', () => {
    if (editing) { endGesture(); editing = false; }
  });
  document.addEventListener('td:edit-name', () => {
    const field = root.querySelector('[data-field="label"], [data-field="text"]');
    if (field) { field.focus(); field.select?.(); }
  });
  refresh();
}

function maybeRefresh() {
  // Don't yank the DOM out from under a field the user is typing in.
  if (root.contains(document.activeElement) && editing) return;
  refresh();
}

function beginEdit() {
  if (!editing) { beginGesture('edit'); editing = true; }
}

// ------------------------------------------------------------------ render --
export function refresh() {
  const sel = selectedItems();
  if (!sel.length) { root.innerHTML = docPanel(); return; }
  if (sel.length > 1) { root.innerHTML = multiPanel(sel); return; }
  const { kind, item } = sel[0];
  root.innerHTML = kind === 'node' ? nodePanel(item)
    : kind === 'link' ? linkPanel(item)
      : kind === 'zone' ? zonePanel(item)
        : notePanel(item);
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function field(label, name, value, { type = 'text', placeholder = '' } = {}) {
  return `<label class="fld"><span>${label}</span>
    <input type="${type}" data-field="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
}

function stepField(item) {
  const max = maxStep();
  return `<label class="fld"><span>${t('ins.revealStep')}
      <em title="${esc(t('ins.revealHelp'))}">?</em></span>
    <input type="number" min="0" max="99" data-field="step" value="${item.step || 0}">
    ${max ? `<small>${t('ins.diagramSteps', { n: max })}</small>` : ''}</label>`;
}

// ---------------------------------------------------------------- document --
function docPanel() {
  const used = new Map();
  for (const n of state.doc.nodes) {
    for (const s of n.services) {
      if (SERVICES[s]) used.set(s, (used.get(s) || 0) + 1);
    }
  }
  const legend = [...used.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => {
    const svc = SERVICES[id];
    return `<li><span class="chip-swatch" style="background:${svc.color}">${svc.short}</span>
      <span class="legend-label">${svc.label}</span><span class="legend-count">${count}</span></li>`;
  }).join('');

  return `<div class="panel">
    <h2>${t('ins.diagram')}</h2>
    ${field(t('ins.title'), 'title', state.doc.title)}
    <div class="stat-row">
      <div><b>${state.doc.nodes.length}</b><span>${t('ins.statDevices', { n: state.doc.nodes.length })}</span></div>
      <div><b>${state.doc.links.length}</b><span>${t('ins.statLinks', { n: state.doc.links.length })}</span></div>
      <div><b>${state.doc.zones.length}</b><span>${t('ins.statZones', { n: state.doc.zones.length })}</span></div>
    </div>
    <h3>${t('ins.servicesHere')}</h3>
    ${legend ? `<ul class="legend">${legend}</ul>`
    : `<p class="hint">${t('ins.noServices')}</p>`}
    <h3>${t('ins.gettingAround')}</h3>
    <ul class="hint keys">
      ${['drag', 'cable', 'tools', 'pan', 'group', 'present'].map((k) => `<li>${t(`ins.key.${k}`)}</li>`).join('')}
    </ul>
  </div>`;
}

// -------------------------------------------------------------------- node --
function nodePanel(node) {
  const dev = deviceOrDefault(node.type);
  const options = DEVICE_CATEGORIES.map((cat) => {
    const items = Object.values(DEVICES).filter((d) => d.category === cat.id);
    return `<optgroup label="${cat.label}">${items.map((d) =>
      `<option value="${d.id}"${d.id === node.type ? ' selected' : ''}>${d.label}</option>`).join('')}</optgroup>`;
  }).join('');

  return `<div class="panel">
    <h2><span class="accent-dot" style="background:${dev.accent}"></span>${t('ins.device')}</h2>
    ${field(t('ins.name'), 'label', node.label)}
    ${field(t('ins.subtitle'), 'sublabel', node.sublabel, { placeholder: t('ins.subtitlePh') })}
    <label class="fld"><span>${t('ins.type')}</span>
      <select data-field="type">${options}</select></label>

    <h3>${t('ins.services')} <small>${t('ins.onBox', { n: node.services.length })}</small></h3>
    <input type="search" class="svc-filter" data-field="svcfilter" placeholder="${esc(t('ins.filter'))}"
           value="${esc(serviceQuery)}">
    ${servicePicker(node)}

    <label class="fld"><span>${t('ins.notes')}</span>
      <textarea data-field="notes" rows="3" placeholder="${esc(t('ins.notesPh'))}">${esc(node.notes)}</textarea></label>
    ${stepField(node)}
    <div class="btn-row">
      <button data-act="reset-services">${t('ins.resetServices')}</button>
      <button data-act="duplicate">${t('ins.duplicate')}</button>
      <button data-act="delete" class="danger">${t('ins.delete')}</button>
    </div>
  </div>`;
}

function servicePicker(node) {
  const q = serviceQuery.toLowerCase();
  const own = new Set(node.services);
  let html = '';
  for (const [gid, group] of Object.entries(SERVICE_GROUPS)) {
    const items = Object.values(SERVICES).filter((s) => s.group === gid
      && (!q || s.short.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)));
    if (!items.length) continue;
    html += `<div class="svc-group"><h4 style="color:${group.color}">${group.label}</h4>
      <div class="svc-wrap">${items.map((s) =>
      `<button class="svc${own.has(s.id) ? ' on' : ''}" data-service="${s.id}"
               style="--svc:${s.color}" title="${esc(s.label)}">${s.short}</button>`).join('')}</div></div>`;
  }
  return html || `<p class="hint">${t('ins.noServiceMatch')}</p>`;
}

// -------------------------------------------------------------------- link --
function linkPanel(link) {
  const a = state.doc.nodes.find((n) => n.id === link.from);
  const b = state.doc.nodes.find((n) => n.id === link.to);
  const kinds = Object.values(LINK_KINDS).map((k) =>
    `<option value="${k.id}"${k.id === link.kind ? ' selected' : ''}>${k.label}</option>`).join('');
  return `<div class="panel">
    <h2>${t('ins.link')}</h2>
    <p class="endpoints">${esc(a?.label)} <span>→</span> ${esc(b?.label)}</p>
    <label class="fld"><span>${t('ins.kind')}</span><select data-field="kind">${kinds}</select></label>
    ${field(t('ins.labelMid'), 'label', link.label, { placeholder: t('ins.labelMidPh') })}
    ${field(t('ins.labelNear', { name: esc(a?.label || 'A') }), 'fromLabel', link.fromLabel, { placeholder: 'Gi0/1' })}
    ${field(t('ins.labelNear', { name: esc(b?.label || 'B') }), 'toLabel', link.toLabel, { placeholder: 'eth0' })}
    <label class="fld inline"><input type="checkbox" data-field="directed"
      ${link.directed ? 'checked' : ''}><span>${t('ins.arrow')}</span></label>
    <label class="fld"><span>${t('ins.offset')} <small>${t('ins.offsetHint')}</small></span>
      <input type="range" min="-40" max="40" step="4" data-field="offset" value="${link.offset || 0}"></label>
    ${stepField(link)}
    <div class="btn-row">
      <button data-act="swap">${t('ins.reverse')}</button>
      <button data-act="delete" class="danger">${t('ins.delete')}</button>
    </div>
  </div>`;
}

// -------------------------------------------------------------------- zone --
function zonePanel(zone) {
  const swatches = ZONE_COLORS.map((c) =>
    `<button class="zone-swatch${c.id === zone.color ? ' on' : ''}" data-zonecolor="${c.id}"
             style="--zc:${c.color}" title="${c.label}"></button>`).join('');
  return `<div class="panel">
    <h2>${t('ins.zone')}</h2>
    ${field(t('ins.label'), 'label', zone.label, { placeholder: t('ins.zoneLabelPh') })}
    <label class="fld"><span>${t('ins.colour')}</span><div class="swatches">${swatches}</div></label>
    <div class="grid2">
      ${field(t('ins.width'), 'w', Math.round(zone.w), { type: 'number' })}
      ${field(t('ins.height'), 'h', Math.round(zone.h), { type: 'number' })}
    </div>
    ${stepField(zone)}
    <p class="hint">${t('ins.zoneHint')}</p>
    <div class="btn-row"><button data-act="delete" class="danger">${t('ins.delete')}</button></div>
  </div>`;
}

// -------------------------------------------------------------------- note --
function notePanel(note) {
  return `<div class="panel">
    <h2>${t('ins.text')}</h2>
    <label class="fld"><span>${t('ins.text')}</span>
      <textarea data-field="text" rows="5">${esc(note.text)}</textarea></label>
    <div class="grid2">
      ${field(t('ins.size'), 'size', note.size, { type: 'number' })}
      <label class="fld"><span>${t('ins.colour')}</span>
        <input type="color" data-field="color" value="${note.color || '#334155'}"></label>
    </div>
    ${stepField(note)}
    <div class="btn-row"><button data-act="delete" class="danger">${t('ins.delete')}</button></div>
  </div>`;
}

// ------------------------------------------------------------------- multi --
function multiPanel(sel) {
  const counts = sel.reduce((acc, s) => { acc[s.kind] = (acc[s.kind] || 0) + 1; return acc; }, {});
  const summary = Object.entries(counts).map(([k, v]) => t(`n.${k}`, { n: v })).join(', ');
  const nodes = selectedNodes();
  return `<div class="panel">
    <h2>${t('ins.selected', { n: sel.length })}</h2>
    <p class="hint">${summary}</p>
    ${nodes.length > 1 ? `
    <h3>${t('ins.align')}</h3>
    <div class="align-grid">
      <button data-act="align:left" title="${t('ins.alignLeft')}">⇤</button>
      <button data-act="align:hcenter" title="${t('ins.alignHcenter')}">⇔</button>
      <button data-act="align:right" title="${t('ins.alignRight')}">⇥</button>
      <button data-act="align:top" title="${t('ins.alignTop')}">⇡</button>
      <button data-act="align:vcenter" title="${t('ins.alignVcenter')}">⇕</button>
      <button data-act="align:bottom" title="${t('ins.alignBottom')}">⇣</button>
      <button data-act="align:hspace" title="${t('ins.spaceH')}">↔≡</button>
      <button data-act="align:vspace" title="${t('ins.spaceV')}">↕≡</button>
    </div>
    <h3>${t('ins.build')}</h3>
    <div class="btn-row">
      <button data-act="connect">${t('ins.connect')}</button>
      <button data-act="group">${t('ins.wrap')}</button>
    </div>
    <h3>${t('ins.services')}</h3>
    <p class="hint">${t('ins.appliesAll', { n: nodes.length })}</p>
    <input type="search" class="svc-filter" data-field="svcfilter" placeholder="${esc(t('ins.filter'))}"
           value="${esc(serviceQuery)}">
    ${bulkServicePicker(nodes)}` : ''}
    <label class="fld"><span>${t('ins.stepAll')}</span>
      <input type="number" min="0" max="99" data-field="bulkstep" value=""
             placeholder="${esc(t('ins.stepAllPh'))}"></label>
    <div class="btn-row">
      <button data-act="duplicate">${t('ins.duplicate')}</button>
      <button data-act="delete" class="danger">${t('ins.deleteAll')}</button>
    </div>
  </div>`;
}

function bulkServicePicker(nodes) {
  const q = serviceQuery.toLowerCase();
  const tally = new Map();
  for (const n of nodes) for (const s of n.services) tally.set(s, (tally.get(s) || 0) + 1);
  let html = '';
  for (const [gid, group] of Object.entries(SERVICE_GROUPS)) {
    const items = Object.values(SERVICES).filter((s) => s.group === gid
      && (!q || s.short.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)));
    if (!items.length) continue;
    html += `<div class="svc-group"><h4 style="color:${group.color}">${group.label}</h4>
      <div class="svc-wrap">${items.map((s) => {
      const c = tally.get(s.id) || 0;
      const cls = c === 0 ? '' : c === nodes.length ? ' on' : ' partial';
      return `<button class="svc${cls}" data-service="${s.id}" style="--svc:${s.color}"
               title="${esc(s.label)}">${s.short}</button>`;
    }).join('')}</div></div>`;
  }
  return html;
}

// ------------------------------------------------------------------ events --
function onInput(e) {
  const target = e.target;
  const name = target.dataset.field;
  if (!name) return;

  if (name === 'svcfilter') {
    serviceQuery = target.value;
    const pos = target.selectionStart;
    refresh();
    const again = root.querySelector('.svc-filter');
    if (again) { again.focus(); again.setSelectionRange(pos, pos); }
    return;
  }

  if (name === 'title') {
    beginEdit();
    state.doc.title = target.value;
    document.dispatchEvent(new CustomEvent('td:title'));
    changed();
    return;
  }

  if (name === 'bulkstep') {
    const v = parseInt(target.value, 10);
    if (Number.isNaN(v)) return;
    commit('set step');
    for (const { item } of selectedItems()) item.step = Math.max(0, v);
    changed();
    return;
  }

  const sel = selectedItems();
  if (sel.length !== 1) return;
  const { kind, item } = sel[0];

  if (name === 'type') {
    commit('change type');
    item.type = target.value;
    // Keep the name if the user typed one; otherwise follow the new type.
    if (isDefaultLabel(item.label)) item.label = deviceOrDefault(target.value).label;
    changed();
    refresh();
    return;
  }

  beginEdit();
  switch (name) {
    case 'step': item.step = Math.max(0, parseInt(target.value, 10) || 0); break;
    case 'directed': item.directed = target.checked; break;
    case 'offset': item.offset = parseInt(target.value, 10) || 0; break;
    case 'size': item.size = Math.max(6, parseInt(target.value, 10) || 14); break;
    case 'w': item.w = Math.max(60, parseInt(target.value, 10) || 60); break;
    case 'h': item.h = Math.max(60, parseInt(target.value, 10) || 60); break;
    case 'kind': item.kind = target.value; break;
    default: item[name] = target.value; break;
  }
  void kind;
  changed();
}

function onClick(e) {
  const svcBtn = e.target.closest('[data-service]');
  if (svcBtn) { toggleService(svcBtn.dataset.service); return; }

  const zc = e.target.closest('[data-zonecolor]');
  if (zc) {
    const sel = selectedItems()[0];
    if (sel?.kind === 'zone') {
      commit('zone colour');
      sel.item.color = zc.dataset.zonecolor;
      state.zoneColor = zc.dataset.zonecolor;
      changed();
      refresh();
    }
    return;
  }

  const act = e.target.closest('[data-act]')?.dataset.act;
  if (!act) return;
  if (act.startsWith('align:')) { alignSelection(act.slice(6)); return; }
  switch (act) {
    case 'delete': deleteSelection(); break;
    case 'duplicate': duplicateSelection(); break;
    case 'connect': connectSelection(); break;
    case 'group': groupIntoZone(); break;
    case 'swap': {
      const link = selectedItems()[0]?.item;
      if (link) {
        commit('reverse link');
        [link.from, link.to] = [link.to, link.from];
        [link.fromLabel, link.toLabel] = [link.toLabel, link.fromLabel];
        changed();
        refresh();
      }
      break;
    }
    case 'reset-services': {
      const node = selectedItems()[0]?.item;
      if (node) {
        commit('reset services');
        node.services = [...deviceOrDefault(node.type).services];
        changed();
        refresh();
      }
      break;
    }
    default: break;
  }
}

function toggleService(id) {
  const nodes = selectedNodes();
  if (!nodes.length) return;
  commit('toggle service');
  const everyone = nodes.every((n) => n.services.includes(id));
  for (const n of nodes) {
    if (everyone) n.services = n.services.filter((s) => s !== id);
    else if (!n.services.includes(id)) n.services.push(id);
  }
  changed();
  refresh();
}

export { kindOf };
