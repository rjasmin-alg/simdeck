// Layout and cable routing. Pure maths, no DOM — node can test it.
//
// Unlike topologydrafter's fixed icon tiles, a host here is as tall as its disk
// count, so everything works from a real bounding box rather than a centre point.

export const SLOT = 24;          // one OSD slot
export const SLOT_GAP = 5;
export const PAD = 10;
export const HEADER = 32;        // host name + daemon badges
export const HOST_MIN_W = 156;
export const SWITCH_W = 178;
export const SWITCH_H = 46;
export const LINK_PAD = 4;

const round = (n) => Math.round(n * 100) / 100;

/** Columns of disk slots. Wide enough to read, never so wide it stops being a box. */
export function slotColumns(n) {
  if (n <= 4) return Math.max(1, n);
  return Math.min(6, Math.ceil(Math.sqrt(n)));
}

/**
 * A host's box and the position of every disk slot inside it.
 * `host.x`/`host.y` are the top-left corner.
 */
export function hostBox(host) {
  const n = host.osds.length;
  const cols = slotColumns(n);
  const rows = Math.max(n ? Math.ceil(n / cols) : 0, 0);
  const gridW = cols * SLOT + Math.max(0, cols - 1) * SLOT_GAP;
  const w = Math.max(HOST_MIN_W, PAD * 2 + gridW);
  const gridH = rows ? rows * SLOT + (rows - 1) * SLOT_GAP : 0;
  const h = HEADER + (rows ? gridH + PAD : 0) + PAD;
  const originX = host.x + (w - gridW) / 2;
  const slots = host.osds.map((osd, i) => ({
    osd,
    x: round(originX + (i % cols) * (SLOT + SLOT_GAP)),
    y: round(host.y + HEADER + Math.floor(i / cols) * (SLOT + SLOT_GAP)),
    w: SLOT, h: SLOT,
  }));
  return { x: host.x, y: host.y, w, h, cols, rows, slots };
}

export function switchBox(sw) {
  return { x: sw.x, y: sw.y, w: SWITCH_W, h: SWITCH_H };
}

export const boxCentre = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** A point on one side of a box, nudged `along` the side for parallel cables. */
function sidePoint(b, side, along = 0) {
  const c = boxCentre(b);
  switch (side) {
    case 'l': return { x: b.x - LINK_PAD, y: clampAlong(c.y, b.y, b.y + b.h, along) };
    case 'r': return { x: b.x + b.w + LINK_PAD, y: clampAlong(c.y, b.y, b.y + b.h, along) };
    case 't': return { x: clampAlong(c.x, b.x, b.x + b.w, along), y: b.y - LINK_PAD };
    default:  return { x: clampAlong(c.x, b.x, b.x + b.w, along), y: b.y + b.h + LINK_PAD };
  }
}
function clampAlong(centre, lo, hi, along) {
  const v = centre + along;
  const margin = 12;
  return round(Math.min(Math.max(v, lo + margin), hi - margin));
}

/** Rounded elbows, so a cable does not look like a circuit trace. */
function roundedPolyline(pts, r = 9) {
  if (pts.length < 3) return `M${pts.map((p) => `${round(p.x)} ${round(p.y)}`).join('L')}`;
  let d = `M${round(pts[0].x)} ${round(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], prev = pts[i - 1], next = pts[i + 1];
    const r1 = Math.min(r, dist(prev, p) / 2), r2 = Math.min(r, dist(p, next) / 2);
    const a = lerpTowards(p, prev, r1), b = lerpTowards(p, next, r2);
    d += `L${round(a.x)} ${round(a.y)}Q${round(p.x)} ${round(p.y)} ${round(b.x)} ${round(b.y)}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${round(last.x)} ${round(last.y)}`;
}
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
function lerpTowards(from, to, d) {
  const len = dist(from, to) || 1;
  return { x: from.x + ((to.x - from.x) / len) * d, y: from.y + ((to.y - from.y) / len) * d };
}

/**
 * Route a cable between two boxes.
 *
 * Biased towards vertical elbows exactly as topologydrafter is, and for the same
 * reason: these diagrams are drawn in tiers (switches above, hosts below), and on
 * a near-diagonal a horizontal elbow wraps the cable around to the far side of
 * the target and reads as a bug.
 */
export function routeLink(a, b, { offset = 0 } = {}) {
  const ca = boxCentre(a), cb = boxCentre(b);
  const dx = cb.x - ca.x, dy = cb.y - ca.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy) * 1.2;

  let p1, p2, pts;
  if (horizontal) {
    p1 = sidePoint(a, dx > 0 ? 'r' : 'l', offset);
    p2 = sidePoint(b, dx > 0 ? 'l' : 'r', offset);
    const mx = round((p1.x + p2.x) / 2);
    pts = Math.abs(p1.y - p2.y) < 1 ? [p1, p2]
      : [p1, { x: mx, y: p1.y }, { x: mx, y: p2.y }, p2];
  } else {
    p1 = sidePoint(a, dy > 0 ? 'b' : 't', offset);
    p2 = sidePoint(b, dy > 0 ? 't' : 'b', offset);
    const my = round((p1.y + p2.y) / 2);
    pts = Math.abs(p1.x - p2.x) < 1 ? [p1, p2]
      : [p1, { x: p1.x, y: my }, { x: p2.x, y: my }, p2];
  }
  return { d: roundedPolyline(pts), start: p1, end: p2, mid: polylineMid(pts), points: pts };
}

export function polylineMid(pts) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i]);
  let want = total / 2;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (want <= seg) return lerpTowards(pts[i - 1], pts[i], want);
    want -= seg;
  }
  return pts[pts.length - 1];
}

/** Shortest distance from a point to a polyline — cable hit testing. */
export function distanceToPolyline(pts, p) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) best = Math.min(best, segDist(pts[i - 1], pts[i], p));
  return best;
}
function segDist(a, b, p) {
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

export const boxesOverlap = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function contentBounds(boxes) {
  if (!boxes.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of boxes) {
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
