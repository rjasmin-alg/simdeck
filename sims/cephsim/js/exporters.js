// SPDX-License-Identifier: AGPL-3.0-or-later
// Getting work out: SVG and PNG for slides, JSON to keep, and a shell script
// that would build the same cluster for real.
//
// Exported SVG is self-contained — CANVAS_CSS is embedded, fonts are the system
// stack, nothing is fetched. Drop it into LaTeX or a browser three years from
// now and it still draws. Editor chrome (selection rings, the marquee) is left
// out deliberately; it lives in UI_CSS for exactly that reason.

import { state } from './model.js';
import { CANVAS_CSS, THEMES, paintAll } from './render.js';
import { TREE_CSS, crushRows, paintTree, TREE_W, ROW_H } from './render-crush.js';
import { MAP_CSS, paintOsdMap } from './render-osdmap.js';
import { hostBox, switchBox, contentBounds } from './geom.js';
import { decompile } from './crushtext.js';
import { compileMap, ruleSteps } from './compile.js';
import { poolMinSize } from './engine/pgmap.js';

const PAD = 40;

/** A complete, standalone SVG document for whichever view is showing. */
export function buildSvg(tab = state.tab) {
  const doc = state.doc;
  const vars = THEMES[state.theme] || THEMES.dark;
  const style = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

  let inner = '';
  let css = '';
  let cls = '';
  let box;

  if (tab === 'crush') {
    const rows = crushRows(doc, { usage: state.derived?.usage });
    inner = paintTree(rows, { selection: new Set() });
    css = TREE_CSS;
    cls = 'cs-tree';
    box = { x: 0, y: 0, w: TREE_W, h: Math.max(ROW_H, rows.length * ROW_H) };
  } else if (tab === 'osdmap') {
    inner = paintOsdMap(doc, state.derived, { selection: new Set() });
    css = MAP_CSS;
    cls = 'cs-osdmap';
    box = { x: 0, y: 0, w: 1000, h: 420 + doc.hosts.length * 26 };
  } else {
    const out = paintAll(doc, state.derived?.usage);
    inner = `<g>${out.cables}</g><g>${out.nodes}</g>`;
    css = CANVAS_CSS;
    cls = 'cs-canvas';
    box = contentBounds([...doc.hosts.map(hostBox), ...doc.switches.map(switchBox)])
      || { x: 0, y: 0, w: 400, h: 200 };
  }

  const x = box.x - PAD, y = box.y - PAD;
  const w = box.w + PAD * 2, h = box.h + PAD * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" style="${style}"
     width="${Math.round(w)}" height="${Math.round(h)}"
     viewBox="${x} ${y} ${w} ${h}">
  <title>${escapeXml(doc.title || 'Ceph cluster')}</title>
  <defs><style>${css}</style>
    <filter id="cs-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-opacity=".22"/></filter>
  </defs>
  <rect class="paper" x="${x}" y="${y}" width="${w}" height="${h}"/>
  ${inner}
</svg>`;
}

const escapeXml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const slug = (s) => (s || 'cluster').replace(/[^\w.-]+/g, '-').toLowerCase().replace(/^-|-$/g, '');

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function exportSvg() {
  download(new Blob([buildSvg()], { type: 'image/svg+xml' }), `${slug(state.doc.title)}.svg`);
}

/** Rasterise the same SVG, at 2x so it survives a projector. */
export async function renderPng(scale = 2) {
  const svg = buildSvg();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('the browser could not rasterise that SVG'));
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportPng() {
  download(await renderPng(), `${slug(state.doc.title)}.png`);
}

export async function copyPng() {
  const blob = await renderPng();
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export function exportCrushmap() {
  const text = decompile(compileMap(state.doc));
  download(new Blob([text], { type: 'text/plain' }), `${slug(state.doc.title)}.crush`);
}

export function exportJson() {
  const text = JSON.stringify(state.doc, null, 2);
  download(new Blob([text], { type: 'application/json' }), `${slug(state.doc.title)}.json`);
  state.dirty = false;
}

/**
 * The commands that would build this cluster for real.
 *
 * Not a deployment tool and not claiming to be one — there is no orchestration,
 * no cephadm, no keyring. It is the CRUSH and pool half, which is the half this
 * simulator actually knows about, written out so a design can leave the room.
 */
export function buildCephScript() {
  const doc = state.doc;
  const L = [];
  L.push('#!/bin/sh');
  L.push('# Generated by CephSim. Review every line before running it anywhere real.');
  L.push('#');
  L.push('# This covers the CRUSH tree, the rules and the pools — the part CephSim');
  L.push('# models. It does NOT deploy daemons, format disks or manage keys: bring the');
  L.push('# OSDs up with cephadm or ceph-volume first, then run this.');
  L.push('set -eu');
  L.push('');

  L.push('# --- CRUSH tree ---');
  const roots = doc.buckets.filter((b) => b.parent === null);
  const walk = (b) => {
    L.push(`ceph osd crush add-bucket ${b.name} ${b.type}`);
    for (const c of doc.buckets.filter((x) => x.parent === b.id)) walk(c);
  };
  for (const b of roots) walk(b);
  L.push('');
  for (const b of doc.buckets) {
    if (b.parent === null) continue;
    const parent = doc.buckets.find((x) => x.id === b.parent);
    if (parent) L.push(`ceph osd crush move ${b.name} ${parent.type}=${parent.name}`);
  }
  L.push('');

  L.push('# --- hosts and OSDs ---');
  for (const h of doc.hosts) {
    const parent = doc.buckets.find((x) => x.id === h.parent);
    L.push(`ceph osd crush add-bucket ${h.name} host`);
    if (parent) L.push(`ceph osd crush move ${h.name} ${parent.type}=${parent.name}`);
    for (const o of h.osds) {
      L.push(`ceph osd crush set osd.${o.id} ${o.size.toFixed(5)} host=${h.name}`);
      if (o.class) L.push(`ceph osd crush set-device-class ${o.class} osd.${o.id}`);
      if ((o.reweight ?? 1) !== 1) L.push(`ceph osd reweight ${o.id} ${o.reweight}`);
      if (o.in === false) L.push(`ceph osd out ${o.id}`);
    }
  }
  L.push('');

  L.push('# --- rules ---');
  for (const r of doc.rules) {
    const steps = ruleSteps(r);
    const take = steps.find((s) => s.op === 'take');
    const leaf = steps.find((s) => s.op === 'chooseleaf' || s.op === 'choose');
    const domain = leaf?.type ?? 'host';
    if (r.type === 'erasure') {
      // k and m belong to the pool, not the rule, so take them from whatever
      // uses this rule — and say so if they disagree, because one profile
      // cannot serve two geometries.
      const users = doc.pools.filter((p) => p.crush_rule === r.name && p.type === 'erasure');
      const geoms = [...new Set(users.map((p) => `${p.k}:${p.m}`))];
      const [k, m] = (geoms[0] || '4:2').split(':');
      if (geoms.length > 1) {
        L.push(`# NOTE: pools on ${r.name} use different k/m (${geoms.join(', ')}).`);
        L.push('# One profile cannot serve both — split the rule, or fix the pools.');
      }
      L.push(`ceph osd erasure-code-profile set ${r.name}-profile \\`);
      L.push(`  k=${k} m=${m} crush-failure-domain=${domain}`
        + `${r.class ? ` crush-device-class=${r.class}` : ''}`);
      L.push(`ceph osd crush rule create-erasure ${r.name} ${r.name}-profile`);
    } else {
      L.push(`ceph osd crush rule create-replicated ${r.name} ${take?.item ?? 'default'}`
        + ` ${domain}${r.class ? ` ${r.class}` : ''}`);
    }
  }
  L.push('');

  L.push('# --- pools ---');
  for (const p of doc.pools) {
    if (p.type === 'erasure') {
      L.push(`ceph osd pool create ${p.name} ${p.pg_num} ${p.pgp_num} erasure ${p.crush_rule}-profile ${p.crush_rule}`);
    } else {
      L.push(`ceph osd pool create ${p.name} ${p.pg_num} ${p.pgp_num} replicated ${p.crush_rule}`);
      L.push(`ceph osd pool set ${p.name} size ${p.size}`);
    }
    L.push(`ceph osd pool set ${p.name} min_size ${poolMinSize(p)}`);
  }

  if (doc.fs.length || doc.rgw.length) {
    L.push('');
    L.push('# --- client layers ---');
    for (const fs of doc.fs) {
      L.push(`ceph osd pool application enable ${fs.dataPool} cephfs`);
      L.push(`ceph osd pool application enable ${fs.metaPool} cephfs`);
      L.push(`ceph fs new ${fs.name} ${fs.metaPool} ${fs.dataPool}`);
      if ((fs.maxMds || 1) > 1) L.push(`ceph fs set ${fs.name} max_mds ${fs.maxMds}`);
    }
    for (const gw of doc.rgw) {
      L.push(`ceph osd pool application enable ${gw.dataPool} rgw`);
      L.push(`ceph osd pool application enable ${gw.indexPool} rgw`);
    }
  }
  if (doc.rbd.length) {
    L.push('');
    for (const img of doc.rbd) {
      L.push(`ceph osd pool application enable ${img.pool} rbd`);
      L.push(`rbd create ${img.pool}/${img.name} --size ${Math.round(img.provisioned / 1024 ** 2)}M`
        + `${img.thin === false ? ' --thick-provision' : ''}`);
    }
  }
  L.push('');
  return L.join('\n');
}

export function exportCephScript() {
  download(new Blob([buildCephScript()], { type: 'text/plain' }), `${slug(state.doc.title)}.sh`);
}
