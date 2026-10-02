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
import { initInspector } from './inspector.js';
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

const $ = (sel) => document.querySelector(sel);
const canvas = $('#canvas');

// Surface anything unexpected rather than dying silently mid-lecture.
window.addEventListener('error', (e) => toast(e.message || 'Something went wrong', true));
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
      toast(`Could not evaluate the cluster: ${err.message}`, true);
    }
    refreshStatus();
    renderActiveTab();
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
  for (const [key, sel] of Object.entries(PANES)) $(sel).hidden = key !== name;
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
    crush: `<button data-pane-act="collapse">Collapse hosts</button>
            <button data-pane-act="expand">Expand all</button>
            <span class="sep"></span>
            <button data-pane-act="export-crush">Export CRUSH map</button>
            <button data-pane-act="import-crush">Import CRUSH map</button>
            <span class="spacer"></span>
            <span class="hint" style="margin:0">Drag a host onto a bucket to change its failure domain.</span>`,
    osdmap: `<span class="hint" style="margin:0">Every cell is one OSD, coloured by how full it is.
             Click one to select it.</span>`,
    pools: `<button data-pane-act="add-pool">Add replicated pool</button>
            <button data-pane-act="add-ec-pool">Add EC pool</button>
            <button data-pane-act="add-rule">Add CRUSH rule</button>
            <span class="sep"></span>
            <button data-pane-act="add-fs">Add CephFS</button>
            <button data-pane-act="add-rbd">Add RBD image</button>
            <button data-pane-act="add-rgw">Add RGW</button>`,
    console: `<span class="hint" style="margin:0">Read-only. This is what the same cluster
              looks like from a shell.</span>`,
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
    $('#sheet-title').textContent = 'CRUSH map — decompiled';
    $('#sheet-hint').textContent =
      'The same text crushtool -d produces. Shadow trees are included, so this can go '
      + 'straight into crushtool -c and ceph osd setcrushmap.';
    try {
      $('#sheet-text').value = decompile(compileMap(state.doc));
    } catch (err) {
      $('#sheet-text').value = '';
      $('#sheet-err').textContent = err.message;
    }
  } else {
    $('#sheet-title').textContent = 'Import a CRUSH map';
    $('#sheet-hint').textContent =
      'Paste the output of `ceph osd getcrushmap -o m && crushtool -d m`. Hosts, buckets, '
      + 'device classes, weights and rules all come across; positions and cabling are invented, '
      + 'and there is no pool information in a crushmap.';
    $('#sheet-text').value = '';
  }
  sheet.hidden = false;
  $('#sheet-text').focus();
}
bind('#sheet-cancel', 'click', () => { $('#sheet').hidden = true; });
bind('#sheet-copy', 'click', async () => {
  try {
    await navigator.clipboard.writeText($('#sheet-text').value);
    toast('Copied');
  } catch { $('#sheet-text').select(); toast('Select and copy manually', true); }
});
bind('#sheet-apply', 'click', () => {
  try {
    const doc = docFromCrushText($('#sheet-text').value);
    loadDoc(doc);
    invalidate();
    $('#sheet').hidden = true;
    setTab('crush');
    toast(`Imported ${doc.hosts.length} hosts and ${doc.rules.length} rules`);
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
    health.textContent = d.hosts.length ? '—' : 'EMPTY';
    health.className = 'health';
    pgline.textContent = '';
    capline.textContent = '';
    return;
  }
  const status = der.health.status;
  health.textContent = status;
  health.className = `health ${status === 'HEALTH_ERR' ? 'err' : status === 'HEALTH_WARN' ? 'warn' : 'ok'}`;
  health.title = der.health.checks.map((c) => `${c.name}: ${c.summary}`).join('\n') || 'no checks failing';

  if (!d.pools.length) {
    pgline.textContent = d.hosts.length ? 'no pools — the cluster stores nothing' : '';
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
    pgline.textContent = `${c.total} pgs: ${c.clean} active+clean`
      + (c.degraded ? `, ${c.degraded} degraded` : '')
      + (c.inactive ? `, ${c.inactive} inactive` : '')
      + (c.misplaced ? `, ${c.misplaced} backfilling` : '');
  }
  const q = der.net.quorum;
  capline.textContent = `${fmtBytes(der.df.used)} / ${fmtBytes(der.df.total)}`
    + ` (${(der.df.ratio * 100).toFixed(1)}%)`
    + ` · spread ${(der.df.spread * 100).toFixed(1)} pts`
    + (q.configured ? ` · mon ${q.largestGroup}/${q.configured}${q.hasQuorum ? '' : ' NO QUORUM'}` : '');
}

// ---------------------------------------------------------------- toolbar --
function bind(sel, evt, fn) { const el = $(sel); if (el) el.addEventListener(evt, fn); }

bind('#doc-title', 'input', (e) => { state.doc.title = e.target.value; document.title = `${e.target.value} — CephSim`; });
bind('#btn-new', 'click', () => {
  if (state.dirty && !confirm('Discard the current cluster?')) return;
  loadDoc(newDoc());
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
    toast(`Opened ${file.name}`);
  } catch (err) { toast(`Could not read that file: ${err.message}`, true); }
  e.target.value = '';
});
bind('#btn-save', 'click', () => exportJson());
bind('#export-picker', 'change', async (e) => {
  const what = e.target.value;
  e.target.value = '';
  try {
    switch (what) {
      case 'svg': exportSvg(); toast('SVG exported'); break;
      case 'png': await exportPng(); toast('PNG exported'); break;
      case 'copy': await copyPng(); toast('PNG copied to the clipboard'); break;
      case 'crush': exportCrushmap(); toast('CRUSH map exported'); break;
      case 'script': exportCephScript(); toast('ceph command script exported'); break;
      case 'json': exportJson(); toast('Cluster JSON saved'); break;
      default: break;
    }
  } catch (err) {
    toast(`Export failed: ${err.message}`, true);
  }
});
bind('#sample-picker', 'change', (e) => {
  const key = e.target.value;
  e.target.value = '';
  if (!key) return;
  if (state.dirty && !confirm('Discard the current cluster?')) return;
  const doc = makeSample(key);
  if (!doc) return;
  loadDoc(doc);
  invalidate();
  requestFit();
  toast(SAMPLES[key].label);
});

for (const el of document.querySelectorAll('.tool')) {
  el.addEventListener('click', () => { state.tool = el.dataset.tool; changed({ remap: false }); });
}
bind('#link-net', 'change', (e) => { state.linkNet = e.target.value; });
bind('#btn-undo', 'click', () => { if (!undo()) toast('Nothing to undo'); });
bind('#btn-redo', 'click', () => { if (!redo()) toast('Nothing to redo'); });
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
  document.body.classList.toggle('light', state.theme === 'light');
  applyTheme(state.theme);
  savePrefs();
  scheduleRender();
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
  } else if (e.key >= '1' && e.key <= '6' && !meta) {
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
  if (state.placing) hint.textContent = 'Click the canvas to place — Esc to cancel';
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
loadPrefs();
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
if (saved && (saved.hosts?.length || saved.switches?.length)) {
  loadDoc(saved);
  toast('Restored your last cluster');
} else {
  loadDoc(makeSample('threeRacks'));
}
invalidate();
resetCrushScroll();
resetOsdMapScroll();
setTab(state.tab || 'physical');
derive();
refreshChrome();
requestFit();
