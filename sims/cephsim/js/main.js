// SPDX-License-Identifier: AGPL-3.0-or-later
// App wiring: toolbar, keyboard, derived state, first-run behaviour.

import {
  state, on, changed, undo, redo, canUndo, canRedo, loadDoc, newDoc,
  readAutosave, loadPrefs, savePrefs, clearSelection,
} from './model.js';
import { evaluate, invalidate } from './compile.js';
import { initRenderer, applyTheme, scheduleRender } from './render.js';
import {
  initInteractions, fitToContent, zoomBy, resetZoom, isTyping, deleteSelection,
} from './interact.js';
import { initPalette, refreshPalette } from './palette.js';
import { initInspector, refresh as refreshInspector } from './inspector.js';
import { initCrushView, renderCrush, collapseAllHosts, expandAll, resetCrushScroll } from './render-crush.js';
import { initOsdMap, renderOsdMap, resetOsdMapScroll } from './render-osdmap.js';
import { initPools, renderPools } from './panel-pools.js';
import { initConsole, renderConsole } from './panel-console.js';
import { decompile, docFromCrushText } from './crushtext.js';
import {
  addPool, addRuleDef, addFs, addRbd, addRgw,
  poolKey, ruleKey, fsKey, rbdKey, rgwKey, select,
} from './model.js';
import { compileMap } from './compile.js';
import { initTimeline } from './timeline.js';
import { sim, retarget, togglePlay, resetSim, formatDuration } from './sim.js';
import {
  exportSvg, exportPng, copyPng, exportCrushmap, exportJson, exportCephScript,
} from './exporters.js';
import { SAMPLES, makeSample } from './samples.js';
import { fmtBytes } from './engine/capacity.js';
import { t, applyStatic, switchLang } from './i18n.js';

const $ = (sel) => document.querySelector(sel);
const canvas = $('#canvas');

// Surface anything unexpected rather than dying silently mid-lecture.
window.addEventListener('error', (e) => toast(e.message || t('toast.error'), true));
window.addEventListener('unhandledrejection', (e) => toast(String(e.reason), true));

// Declared up here because boot calls both before the sections below run.
// Module scope executes top to bottom; a `let` further down is a temporal dead
// zone error that silently kills the rest of boot.
let toastTimer = null;
function toast(message, isError = false) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.classList.toggle('error', isError);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, isError ? 6000 : 2600);
}

let fitObserver = null;
/** fitToContent() fails before the canvas has a measured size; retry on resize. */
function requestFit() {
  if (fitToContent()) return;
  if (fitObserver) return;
  fitObserver = new ResizeObserver(() => {
    if (fitToContent()) { fitObserver.disconnect(); fitObserver = null; }
  });
  fitObserver.observe($('#stage'));
}

// ------------------------------------------------------------- derivation --
// One remap per structural change. compile.js caches on a structural signature,
// so a drag or a rename costs nothing here.
let derivePending = false;
function derive() {
  if (derivePending) return;
  derivePending = true;
  queueMicrotask(() => {
    derivePending = false;
    try {
      state.derived = evaluate(state.doc, { downOsds: state.down });
      // Point the clock at the new target. When nothing actually moved this
      // finds no work and costs almost nothing.
      retarget(state.derived);
    } catch (err) {
      state.derived = null;
      toast(t('toast.evalFailed', { msg: err.message }), true);
    }
    refreshStatus();
    renderActiveTab();
    // simdeck copy: the inspector repainted on 'change', before this derivation, so its health section showed
    // the cluster as it was one edit ago (HEALTH_OK beside a HEALTH_ERR status bar).
    refreshInspector();
  });
}
on('remap', derive);

// -------------------------------------------------------------- tabs -------
const PANES = {
  physical: '#canvas',
  crush: '#crush-canvas',
  osdmap: '#osdmap-canvas',
  pools: '#pools-pane',
  console: '#console-pane',
};

function renderActiveTab() {
  switch (state.tab) {
    case 'crush': renderCrush(); break;
    case 'osdmap': renderOsdMap(); break;
    case 'pools': renderPools(); break;
    case 'console': renderConsole(); break;
    default: scheduleRender();
  }
}

function setTab(name) {
  if (!PANES[name]) name = 'physical';
  state.tab = name;
  // simdeck copy: three panes are <svg>, which has no .hidden property; set the attribute.
  for (const [key, sel] of Object.entries(PANES)) $(sel).toggleAttribute('hidden', key !== name);
  for (const el of document.querySelectorAll('.tab')) {
    el.classList.toggle('active', el.dataset.tab === name);
    el.setAttribute('aria-selected', el.dataset.tab === name ? 'true' : 'false');
  }
  $('#placing-hint').hidden = name !== 'physical' || !state.placing;
  $('#rail-left').hidden = name !== 'physical';
  renderPaneActions();
  savePrefs();
  renderActiveTab();
  if (name === 'physical') requestFit();
}

/** Small per-tab action strip — the actions that only make sense in one view. */
function renderPaneActions() {
  const el = $('#pane-actions');
  const sets = {
    physical: '',
    crush: `<button data-pane-act="collapse">${t('ui.paneCollapse')}</button>
            <button data-pane-act="expand">${t('ui.paneExpand')}</button>
            <span class="sep"></span>
            <button data-pane-act="export-crush">${t('ui.paneExportCrush')}</button>
            <button data-pane-act="import-crush">${t('ui.paneImportCrush')}</button>
            <span class="spacer"></span>
            <span class="hint" style="margin:0">${t('ui.paneCrushHint')}</span>`,
    osdmap: `<span class="hint" style="margin:0">${t('ui.paneOsdHint')}</span>`,
    pools: `<button data-pane-act="add-pool">${t('ui.paneAddPool')}</button>
            <button data-pane-act="add-ec-pool">${t('ui.paneAddEcPool')}</button>
            <button data-pane-act="add-rule">${t('ui.paneAddRule')}</button>
            <span class="sep"></span>
            <button data-pane-act="add-fs">${t('ui.paneAddFs')}</button>
            <button data-pane-act="add-rbd">${t('ui.paneAddRbd')}</button>
            <button data-pane-act="add-rgw">${t('ui.paneAddRgw')}</button>`,
    console: `<span class="hint" style="margin:0">${t('ui.paneConsoleHint')}</span>`,
  };
  el.innerHTML = sets[state.tab] ?? '';
}

for (const el of document.querySelectorAll('.tab')) {
  el.addEventListener('click', () => setTab(el.dataset.tab));
}

$('#pane-actions').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pane-act]');
  if (!btn) return;
  switch (btn.dataset.paneAct) {
    case 'collapse': collapseAllHosts(); break;
    case 'expand': expandAll(); break;
    case 'export-crush': openSheet('export'); break;
    case 'import-crush': openSheet('import'); break;
    case 'add-pool': {
      commitAnd(() => select(poolKey(addPool().id)));
      break;
    }
    case 'add-ec-pool': {
      commitAnd(() => select(poolKey(addPool({ type: 'erasure', k: 4, m: 2, min_size: 4 }).id)));
      break;
    }
    case 'add-rule': {
      commitAnd(() => select(ruleKey(addRuleDef().id)));
      break;
    }
    case 'add-fs': commitAnd(() => select(fsKey(addFs().id))); break;
    case 'add-rbd': commitAnd(() => select(rbdKey(addRbd().id))); break;
    case 'add-rgw': commitAnd(() => select(rgwKey(addRgw().id))); break;
    default: break;
  }
});

function commitAnd(fn) {
  import('./model.js').then((m) => {
    m.commit('add');
    fn();
    m.changed();
  });
}

// ------------------------------------------------------ CRUSH map sheet ----
let sheetMode = 'export';
function openSheet(mode) {
  sheetMode = mode;
  const sheet = $('#sheet');
  $('#sheet-err').textContent = '';
  $('#sheet-apply').hidden = mode !== 'import';
  if (mode === 'export') {
    $('#sheet-title').textContent = t('ui.sheetExportTitle');
    $('#sheet-hint').textContent = t('ui.sheetExportHint');
    try {
      $('#sheet-text').value = decompile(compileMap(state.doc));
    } catch (err) {
      $('#sheet-text').value = '';
      $('#sheet-err').textContent = err.message;
    }
  } else {
    $('#sheet-title').textContent = t('ui.sheetImportTitle');
    $('#sheet-hint').textContent = t('ui.sheetImportHint');
    $('#sheet-text').value = '';
  }
  sheet.hidden = false;
  $('#sheet-text').focus();
}
bind('#sheet-cancel', 'click', () => { $('#sheet').hidden = true; });
bind('#sheet-copy', 'click', async () => {
  try {
    await navigator.clipboard.writeText($('#sheet-text').value);
    toast(t('toast.copied'));
  } catch { $('#sheet-text').select(); toast(t('toast.copyManually'), true); }
});
bind('#sheet-apply', 'click', () => {
  try {
    const doc = docFromCrushText($('#sheet-text').value);
    loadDoc(doc);
    invalidate();
    $('#sheet').hidden = true;
    setTab('crush');
    sampleKey = null;
    toast(t('toast.imported', { n: doc.hosts.length, rules: t('toast.importedRules', { n: doc.rules.length }) }));
  } catch (err) {
    $('#sheet-err').textContent = err.message;
  }
});
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') $('#sheet').hidden = true; });

function refreshStatus() {
  const d = state.doc;
  const der = state.derived;
  const health = $('#health');
  const pgline = $('#pgline');
  const capline = $('#capline');
  if (!der) {
    health.textContent = d.hosts.length ? '—' : t('ui.empty');
    health.className = 'health';
    pgline.textContent = '';
    capline.textContent = '';
    return;
  }
  const status = der.health.status;
  health.textContent = status;
  health.className = `health ${status === 'HEALTH_ERR' ? 'err' : status === 'HEALTH_WARN' ? 'warn' : 'ok'}`;
  health.title = der.health.checks.map((c) => `${c.name}: ${c.summary}`).join('\n') || t('ui.noChecks');

  if (!d.pools.length) {
    pgline.textContent = d.hosts.length ? t('ui.noPools') : '';
  } else {
    // Mid-recovery the honest number is what the disks hold right now, not the
    // layout CRUSH is aiming at.
    const c = sim.recovery
      ? sim.recovery.liveCounts(der.evals)
      : der.evals.reduce((a, ev) => ({
          clean: a.clean + ev.pool.pg_num - ev.degraded - ev.inactive,
          degraded: a.degraded + ev.degraded,
          misplaced: a.misplaced + ev.misplaced,
          inactive: a.inactive + ev.inactive,
          total: a.total + ev.pool.pg_num,
        }), { clean: 0, degraded: 0, misplaced: 0, inactive: 0, total: 0 });
    pgline.textContent = t('ui.pgline', { total: c.total, clean: c.clean })
      + (c.degraded ? t('ui.pgDegraded', { n: c.degraded }) : '')
      + (c.inactive ? t('ui.pgInactive', { n: c.inactive }) : '')
      + (c.misplaced ? t('ui.pgBackfilling', { n: c.misplaced }) : '');
  }
  const q = der.net.quorum;
  capline.textContent = t('ui.capline', { used: fmtBytes(der.df.used), total: fmtBytes(der.df.total),
    pct: (der.df.ratio * 100).toFixed(1), spread: (der.df.spread * 100).toFixed(1) })
    + (q.configured ? t('ui.capMon', { have: q.largestGroup, of: q.configured })
      + (q.hasQuorum ? '' : t('ui.noQuorum')) : '');
}

// ---------------------------------------------------------------- toolbar --
function bind(sel, evt, fn) { const el = $(sel); if (el) el.addEventListener(evt, fn); }

bind('#doc-title', 'input', (e) => { state.doc.title = e.target.value; document.title = `${e.target.value} — CephSim`; });
bind('#btn-new', 'click', () => {
  if (state.dirty && !confirm(t('ui.discard'))) return;
  loadDoc(newDoc(t('ui.untitled')));
  sampleKey = null;
  invalidate();
  requestFit();
});
bind('#btn-open', 'click', () => $('#file-input').click());
bind('#file-input', 'change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    loadDoc(JSON.parse(await file.text()));
    invalidate();
    requestFit();
    sampleKey = null;
    toast(t('toast.opened', { name: file.name }));
  } catch (err) { toast(t('toast.readFailed', { msg: err.message }), true); }
  e.target.value = '';
});
bind('#btn-save', 'click', () => exportJson());
bind('#export-picker', 'change', async (e) => {
  const what = e.target.value;
  e.target.value = '';
  try {
    switch (what) {
      case 'svg': exportSvg(); toast(t('toast.svg')); break;
      case 'png': await exportPng(); toast(t('toast.png')); break;
      case 'copy': await copyPng(); toast(t('toast.pngCopied')); break;
      case 'crush': exportCrushmap(); toast(t('toast.crush')); break;
      case 'script': exportCephScript(); toast(t('toast.script')); break;
      case 'json': exportJson(); toast(t('toast.json')); break;
      default: break;
    }
  } catch (err) {
    toast(t('toast.exportFailed', { msg: err.message }), true);
  }
});
bind('#sample-picker', 'change', (e) => {
  const key = e.target.value;
  e.target.value = '';
  if (!key) return;
  if (state.dirty && !confirm(t('ui.discard'))) return;
  if (!loadSample(key)) return;
  toast(SAMPLES[key].label);
});

// simdeck copy: the sample on the canvas while nobody has edited it; the language switch rebuilds it.
let sampleKey = null;
function loadSample(key) {
  const doc = makeSample(key);
  if (!doc) return false;
  loadDoc(doc);
  invalidate();
  requestFit();
  sampleKey = key;
  return true;
}

for (const el of document.querySelectorAll('.tool')) {
  el.addEventListener('click', () => { state.tool = el.dataset.tool; changed({ remap: false }); });
}
bind('#link-net', 'change', (e) => { state.linkNet = e.target.value; });
bind('#btn-undo', 'click', () => { if (!undo()) toast(t('toast.nothingUndo')); });
bind('#btn-redo', 'click', () => { if (!redo()) toast(t('toast.nothingRedo')); });
bind('#btn-fit', 'click', () => requestFit());
bind('#btn-zoom-in', 'click', () => zoomBy(1.2));
bind('#btn-zoom-out', 'click', () => zoomBy(1 / 1.2));
bind('#btn-grid', 'click', () => { state.showGrid = !state.showGrid; savePrefs(); changed({ remap: false }); });
function setPresent(on) {
  state.present = on;
  document.body.classList.toggle('present', on);
  $('#exit-present').hidden = !on;
  requestFit();
}
bind('#btn-present', 'click', () => setPresent(true));
bind('#exit-present', 'click', () => setPresent(false));

bind('#btn-theme', 'click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  state.themeChosen = true;
  document.body.classList.toggle('light', state.theme === 'light');
  applyTheme(state.theme);
  savePrefs();
  scheduleRender();
});

// simdeck copy: EN / HR. Store the choice and reload with ?lang=; an unedited sample comes back as the same sample
// in the other language, anything else from the autosave as it is.
bind('#btn-lang', 'click', () => {
  const params = new URLSearchParams(location.search);
  if (sampleKey && !state.dirty) params.set('sample', sampleKey); else params.delete('sample');
  state.dirty = false;                     // the autosave holds the drawing; do not ask to discard it
  switchLang(params);
});

window.addEventListener('keydown', (e) => {
  if (isTyping()) return;
  const meta = e.ctrlKey || e.metaKey;
  if (meta && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  } else if (meta && e.key.toLowerCase() === 's') {
    e.preventDefault();
    $('#btn-save').click();
  } else if (e.key === 'f' && !meta) {
    requestFit();
  } else if (e.key === ' ' && !meta) {
    e.preventDefault();
    togglePlay();
  } else if (e.key.toLowerCase() === 'p' && !meta) {
    setPresent(!state.present);
  } else if (e.key >= '1' && e.key <= '5' && !meta) {
    setTab(Object.keys(PANES)[Number(e.key) - 1]);
  }
});

function refreshChrome() {
  $('#btn-undo').disabled = !canUndo();
  $('#btn-redo').disabled = !canRedo();
  $('#btn-grid').classList.toggle('active', state.showGrid);
  $('#link-net').value = state.linkNet;
  for (const el of document.querySelectorAll('.tool')) {
    el.classList.toggle('active', el.dataset.tool === state.tool);
  }
  const hint = $('#placing-hint');
  hint.hidden = !state.placing || state.tab !== 'physical';
  if (state.placing) hint.textContent = t('ui.placing');
  const title = $('#doc-title');
  if (document.activeElement !== title) title.value = state.doc.title || '';
  canvas.style.cursor = state.tool === 'pan' ? 'grab'
    : state.tool === 'link' ? 'crosshair'
    : state.placing ? 'copy' : 'default';
}
on('change', refreshChrome);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#sheet').hidden) { $('#sheet').hidden = true; return; }
  if (e.key === 'Escape' && state.present) { setPresent(false); return; }
  if (e.key === 'Escape' && state.placing) {
    state.placing = null;
    refreshPalette();
    changed({ remap: false });
  }
});

window.addEventListener('beforeunload', (e) => {
  if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
});

// ------------------------------------------------------------------- boot --
// simdeck copy: the page's language (js/i18n.js), and the URL settings: ?sample=<key> loads a sample
// (hyperconverged, threeRacks, brokenRule, unbalanced), ?tab=<pane>, ?present=1, ?theme=light|dark and
// ?motion=reduce. Without ?theme= and until someone presses Theme, the theme follows the OS.
applyStatic();
document.title = t('ui.pageTitle');
// simdeck copy: the original never filled the Samples picker, so it offered nothing.
$('#sample-picker').insertAdjacentHTML('beforeend', Object.entries(SAMPLES)
  .map(([key, s]) => `<option value="${key}">${s.label}</option>`).join(''));
const params = new URLSearchParams(location.search);
loadPrefs();
if (params.get('theme') === 'light' || params.get('theme') === 'dark') state.theme = params.get('theme');
else if (!state.themeChosen) {
  state.theme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
if (params.get('tab') && PANES[params.get('tab')]) state.tab = params.get('tab');
document.documentElement.classList.toggle('reduce-motion', params.get('motion') === 'reduce');
document.body.classList.toggle('light', state.theme === 'light');
initRenderer(canvas);
initInteractions(canvas);
initCrushView($('#crush-canvas'));
initOsdMap($('#osdmap-canvas'));
initPools($('#pools-pane'));
initConsole($('#console-pane'));
initPalette($('#palette'));
initInspector($('#inspector'));
initTimeline($('#timeline'));

const saved = readAutosave();
if (SAMPLES[params.get('sample')]) {
  loadSample(params.get('sample'));
} else if (saved && (saved.hosts?.length || saved.switches?.length)) {
  loadDoc(saved);
  toast(t('toast.restored'));
} else {
  loadSample('threeRacks');
}
invalidate();
resetCrushScroll();
resetOsdMapScroll();
setTab(state.tab || 'physical');
derive();
refreshChrome();
if (params.get('present') === '1') setPresent(true);
requestFit();
