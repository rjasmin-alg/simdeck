// Pointer, keyboard and viewport handling.
//
// Every handler lives on the <svg> root and works from ids captured at
// pointerdown. The renderer replaces layer DOM wholesale each frame, so holding
// on to an element across a gesture is a use-after-free waiting to happen.

import {
  state, on, changed, commit, beginGesture, endGesture, select, clearSelection,
  hostById, switchById, addLink, removeIds, osdById, uid,
} from './model.js';
import { hostBox, switchBox, routeLink, distanceToPolyline, contentBounds } from './geom.js';
import { scheduleRender, currentBoxes, allBoxes } from './render.js';
import { placeArmed } from './palette.js';

let svg = null;
let gesture = null;          // {mode, ...} for the in-flight drag
const MIN_K = 0.15;
const MAX_K = 4;

export function initInteractions(el) {
  svg = el;
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('contextmenu', (e) => e.preventDefault());
  svg.addEventListener('dragover', (e) => { if (state.placing) e.preventDefault(); });
  svg.addEventListener('drop', (e) => {
    if (!state.placing) return;
    e.preventDefault();
    placeArmed(toWorld(e));
  });
  window.addEventListener('keydown', onKey);
}

/** Screen point -> world point, honouring the current pan and zoom. */
export function toWorld(e) {
  const r = svg.getBoundingClientRect();
  const { x, y, k } = state.view;
  return { x: (e.clientX - r.left - x) / k, y: (e.clientY - r.top - y) / k };
}

/** What is under the pointer: an OSD slot beats its host, a cable beats paper. */
function hitTest(p) {
  const boxes = currentBoxes();
  const d = state.doc;
  for (let i = d.hosts.length - 1; i >= 0; i--) {
    const h = d.hosts[i];
    const box = boxes.get(h.id);
    if (!box || !inBox(box, p)) continue;
    const slot = box.slots.find((s) =>
      p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h);
    return slot ? { kind: 'osd', id: slot.osd.id, hostId: h.id } : { kind: 'host', id: h.id };
  }
  for (let i = d.switches.length - 1; i >= 0; i--) {
    const s = d.switches[i];
    const box = boxes.get(s.id);
    if (box && inBox(box, p)) return { kind: 'switch', id: s.id };
  }
  for (const l of d.links) {
    const a = boxes.get(l.a), b = boxes.get(l.b);
    if (!a || !b) continue;
    const r = routeLink(a, b, { offset: l.offset || 0 });
    if (distanceToPolyline(r.points, p) < 8) return { kind: 'link', id: l.id };
  }
  return null;
}
const inBox = (b, p) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

const snap = (v) => (state.snapOn ? Math.round(v / state.snap) * state.snap : v);

function onDown(e) {
  if (e.button === 2) return;
  svg.setPointerCapture(e.pointerId);
  const p = toWorld(e);

  // A palette selection consumes the click before anything else looks at it.
  if (state.placing) { placeArmed(p); gesture = null; return; }

  const hit = hitTest(p);
  const panning = e.button === 1 || state.tool === 'pan' || e.shiftKey === false && e.altKey;

  if (panning) {
    gesture = { mode: 'pan', x: e.clientX, y: e.clientY, view: { ...state.view } };
    return;
  }

  if (state.tool === 'link') {
    if (hit && (hit.kind === 'host' || hit.kind === 'switch' || hit.kind === 'osd')) {
      const from = hit.kind === 'osd' ? hit.hostId : hit.id;
      gesture = { mode: 'link', from, p };
      state.overlay = '';
    } else {
      gesture = null;
    }
    return;
  }

  if (!hit) {
    if (!e.shiftKey) clearSelection();
    gesture = { mode: 'marquee', start: p, p };
    return;
  }

  const additive = e.shiftKey;
  if (!state.selection.has(hit.id)) select(hit.id, { additive });
  else if (additive) select(hit.id, { toggle: true });

  // Only whole boxes move; an OSD slot lives inside its host.
  const movable = [...state.selection]
    .map((id) => hostById(id) || switchById(id))
    .filter(Boolean);
  if (movable.length) {
    beginGesture('move');
    gesture = {
      mode: 'move', p,
      items: movable.map((it) => ({ it, x: it.x, y: it.y })),
    };
  } else {
    gesture = null;
  }
}

function onMove(e) {
  if (!gesture) return;
  const p = toWorld(e);
  switch (gesture.mode) {
    case 'pan': {
      state.view.x = gesture.view.x + (e.clientX - gesture.x);
      state.view.y = gesture.view.y + (e.clientY - gesture.y);
      scheduleRender();
      break;
    }
    case 'move': {
      const dx = p.x - gesture.p.x, dy = p.y - gesture.p.y;
      for (const m of gesture.items) {
        m.it.x = snap(m.x + dx);
        m.it.y = snap(m.y + dy);
      }
      // Position is not structural, so this must not trigger a remap.
      changed({ structural: true, remap: false });
      break;
    }
    case 'marquee': {
      gesture.p = p;
      const r = rectOf(gesture.start, p);
      state.overlay = `<rect class="marquee" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`;
      scheduleRender();
      break;
    }
    case 'link': {
      const boxes = currentBoxes();
      const from = boxes.get(gesture.from);
      if (from) {
        const target = { x: p.x - 1, y: p.y - 1, w: 2, h: 2 };
        state.overlay = `<path class="link-preview" d="${routeLink(from, target).d}"/>`;
      }
      gesture.p = p;
      scheduleRender();
      break;
    }
    default: break;
  }
}

function onUp(e) {
  if (!gesture) return;
  const g = gesture;
  gesture = null;
  state.overlay = '';
  switch (g.mode) {
    case 'move': endGesture(); changed({ remap: false }); break;
    case 'marquee': {
      const r = rectOf(g.start, g.p);
      if (r.w > 3 || r.h > 3) {
        const boxes = currentBoxes();
        const ids = [];
        for (const [id, b] of boxes) {
          if (b.x < r.x + r.w && r.x < b.x + b.w && b.y < r.y + r.h && r.y < b.y + b.h) ids.push(id);
        }
        select(ids, { additive: e.shiftKey });
      }
      scheduleRender();
      break;
    }
    case 'link': {
      const hit = hitTest(toWorld(e));
      const to = hit && (hit.kind === 'osd' ? hit.hostId : hit.id);
      if (to && to !== g.from && (hostById(to) || switchById(to))) {
        commit('add cable');
        addLink(g.from, to, state.linkNet);
        changed({ remap: false });
      } else {
        scheduleRender();
      }
      break;
    }
    default: scheduleRender();
  }
}

const rectOf = (a, b) => ({
  x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
  w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y),
});

function onWheel(e) {
  e.preventDefault();
  const r = svg.getBoundingClientRect();
  const factor = Math.exp(-e.deltaY * 0.0015);
  zoomAt(e.clientX - r.left, e.clientY - r.top, factor);
}

export function zoomAt(sx, sy, factor) {
  const v = state.view;
  const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
  const scale = k / v.k;
  v.x = sx - (sx - v.x) * scale;
  v.y = sy - (sy - v.y) * scale;
  v.k = k;
  scheduleRender();
}
export function zoomBy(factor) {
  const r = svg.getBoundingClientRect();
  zoomAt(r.width / 2, r.height / 2, factor);
}
export function resetZoom() {
  state.view = { x: 0, y: 0, k: 1 };
  scheduleRender();
}

/**
 * Frame the drawing.
 *
 * Returns false when the canvas has no measured size yet — at first paint and
 * headless it genuinely has none. Callers must go through requestFit() in
 * main.js, which retries via a ResizeObserver. requestAnimationFrame was tried
 * for this on topologydrafter and is not reliable.
 */
export function fitToContent(pad = 70) {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const b = contentBounds(allBoxes());
  if (!b) { resetZoom(); return true; }
  const k = Math.min(MAX_K, Math.max(MIN_K,
    Math.min((r.width - pad * 2) / b.w, (r.height - pad * 2) / b.h, 1.6)));
  state.view = {
    k,
    x: (r.width - b.w * k) / 2 - b.x * k,
    y: (r.height - b.h * k) / 2 - b.y * k,
  };
  scheduleRender();
  return true;
}

export const isTyping = () => {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

export function deleteSelection() {
  if (!state.selection.size) return;
  commit('delete');
  removeIds([...state.selection]);
  clearSelection();
  changed();
}

export function selectAll() {
  const d = state.doc;
  select([...d.hosts.map((h) => h.id), ...d.switches.map((s) => s.id)]);
}

function onKey(e) {
  if (isTyping()) return;
  const meta = e.ctrlKey || e.metaKey;
  if (!meta && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); deleteSelection(); }
  else if (meta && e.key.toLowerCase() === 'a') { e.preventDefault(); selectAll(); }
  else if (e.key === 'Escape') { clearSelection(); state.tool = 'select'; changed({ remap: false }); }
  else if (!meta && ['v', 'l', 'h'].includes(e.key.toLowerCase())) {
    state.tool = { v: 'select', l: 'link', h: 'pan' }[e.key.toLowerCase()];
    changed({ remap: false });
  }
}
