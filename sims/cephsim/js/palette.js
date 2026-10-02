// The left rail: things you can drop on the canvas.
//
// Click to arm, then click the canvas to place; or drag the row onto the canvas.
// Both routes end up in placeArmed(), so there is one placement path.

import {
  state, commit, changed, addHost, addOsd, addSwitchNode, addBucketNode, select,
} from './model.js';
import { CHASSIS, SWITCHES, BUCKET_TYPES, DEVICE_CLASSES } from './catalog.js';

let root = null;

export function initPalette(el) {
  root = el;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.pal-item');
    if (!btn) return;
    const key = btn.dataset.key;
    state.placing = state.placing?.key === key ? null : { kind: btn.dataset.kind, key };
    refreshPalette();
    changed({ structural: false, remap: false });
  });
  root.addEventListener('dragstart', (e) => {
    const btn = e.target.closest('.pal-item');
    if (!btn) return;
    state.placing = { kind: btn.dataset.kind, key: btn.dataset.key };
    e.dataTransfer.setData('text/plain', btn.dataset.key);
    e.dataTransfer.effectAllowed = 'copy';
    refreshPalette();
  });
  refreshPalette();
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function item(kind, key, label, sub, colour) {
  const armed = state.placing?.key === key ? ' armed' : '';
  return `<button class="pal-item${armed}" draggable="true" data-kind="${kind}" data-key="${key}">
    <span class="pal-swatch" style="background:${colour}"></span>
    <span><span>${esc(label)}</span><br><span class="sub">${esc(sub)}</span></span>
  </button>`;
}

export function refreshPalette() {
  if (!root) return;
  const hosts = Object.values(CHASSIS).map((c) => {
    const n = c.osds.reduce((a, g) => a + g.n, 0);
    const tib = c.osds.reduce((a, g) => a + g.n * g.size, 0);
    const cls = c.osds[0] ? DEVICE_CLASSES[c.osds[0].cls].colour : 'var(--ink-soft)';
    const sub = n ? `${n} OSD · ${tib} TiB` : (c.daemons.join(', ') || 'no disks');
    return item('host', c.id, c.label, sub, cls);
  }).join('');
  const switches = Object.values(SWITCHES)
    .map((s) => item('switch', s.id, s.label, `${s.speed}G · ${s.ports} ports`, '#4a9ee0')).join('');
  const buckets = BUCKET_TYPES.filter((b) => b.id !== 'root')
    .map((b) => item('bucket', `bucket:${b.id}`, b.label, 'CRUSH failure domain', '#8b9ab2')).join('');

  root.innerHTML = `
    <div class="pal-group"><p class="pal-head">Hosts</p>${hosts}</div>
    <div class="pal-group"><p class="pal-head">Network</p>${switches}</div>
    <div class="pal-group"><p class="pal-head">CRUSH buckets</p>${buckets}
      <p class="hint">Buckets are containers in the CRUSH tree. Put hosts in racks,
      then set a rule's failure domain to <code>rack</code>.</p></div>`;
}

/**
 * Place whatever the palette has armed at a world point. Returns the new item,
 * or null if nothing was armed.
 */
export function placeArmed(p) {
  const armed = state.placing;
  if (!armed) return null;
  commit('add');
  let made = null;

  if (armed.kind === 'host') {
    const preset = CHASSIS[armed.key] || CHASSIS.empty;
    const n = state.doc.hosts.length + 1;
    made = addHost(`ceph-${String(n).padStart(2, '0')}`, snap(p.x), snap(p.y), {
      daemons: [...preset.daemons],
    });
    for (const g of preset.osds) {
      for (let i = 0; i < g.n; i++) addOsd(made, { size: g.size, cls: g.cls });
    }
  } else if (armed.kind === 'switch') {
    const preset = SWITCHES[armed.key] || SWITCHES['tor-25'];
    made = addSwitchNode(`sw${state.doc.switches.length + 1}`, snap(p.x), snap(p.y), {
      speed: preset.speed, ports: preset.ports,
    });
  } else if (armed.kind === 'bucket') {
    const type = armed.key.split(':')[1];
    const root_ = state.doc.buckets.find((b) => b.type === 'root');
    const n = state.doc.buckets.filter((b) => b.type === type).length;
    made = addBucketNode(`${type}${n}`, type, root_ ? root_.id : null);
  }

  // Buckets have no canvas position, so keep them armed only for one drop.
  state.placing = null;
  refreshPalette();
  if (made) select(made.id);
  changed();
  return made;
}

const snap = (v) => (state.snapOn ? Math.round(v / state.snap) * state.snap : v);
