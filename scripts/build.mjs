#!/usr/bin/env node
// Builds dist/ from the manifest sources. No dependencies: Node's standard library only.
//
//   dist/index.html                      lecturer's index (data inlined, works from file://)
//   dist/handout.html                    ad-hoc handout from a selection (#title=..&ids=a,b)
//   dist/courses/<id>/index.html         one page per course file, for students
//   dist/sims/<id>/index.html            each native sim as one self-contained file
//   dist/manifest.json                   the merged, validated manifest, for other tools
//
// Usage: node scripts/build.mjs [--root <dir>] [--out <dir>]
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepo, validate } from '../lib/manifest.mjs';
import { renderHandout, escapeHtml } from '../site/core.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', 'site');
export const KIT_MARKER = '<!-- simdeck:kit -->';
export const META_ID = 'simdeck-meta';

const read = (p) => readFileSync(p, 'utf8');

/** core.js is an ES module for Node; in the browser it is inlined, so its `export`s are dropped. */
export function inlineCore() {
  return read(join(SITE, 'core.js')).replace(/^export /gm, '');
}

/** JSON safe inside <script>: no "</script>" or "<!--" can end the element early. */
export function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`template variable {{${k}}} not provided`);
    return vars[k];
  });
}

function isLocal(ref) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(ref) && !ref.startsWith('//') && !ref.startsWith('/');
}

/**
 * Turns a native sim's source page into one self-contained file:
 *  - local <link rel="stylesheet" href="x.css"> and <script src="x.js"> are inlined;
 *  - the kit marker is replaced by the kit (kit/kit.css + kit/kit.js), when the kit exists;
 *  - a #simdeck-meta JSON block with the manifest fields the page may use is added to <head>.
 * Returns { html, errors }.
 */
export function buildNative(html, entry, { simDir, kit }) {
  const errors = [];
  const where = `sims/${entry.id}/index.html`;
  const readLocal = (ref) => {
    const p = resolve(simDir, ref);
    const rel = relative(simDir, p);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      errors.push(`${where}: "${ref}" is outside the sim's folder`);
      return null;
    }
    if (!existsSync(p)) {
      errors.push(`${where}: "${ref}" not found`);
      return null;
    }
    return read(p);
  };

  let out = html.replace(/<link\b([^>]*?)\bhref\s*=\s*["']([^"']+)["']([^>]*)>/gi, (m, a, href, b) => {
    if (!/\brel\s*=\s*["']?stylesheet/i.test(a + b) || !isLocal(href)) return m;
    const css = readLocal(href);
    return css === null ? m : `<style>/* ${href} */\n${css}</style>`;
  });
  out = out.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, src, b) => {
    if (!isLocal(src)) return m;
    const js = readLocal(src);
    if (js === null) return m;
    const attrs = `${a}${b}`.replace(/\s+/g, ' ').trim();
    return `<script${attrs ? ` ${attrs}` : ''}>/* ${src} */\n${js.replace(/<\/script/gi, '<\\/script')}</script>`;
  });

  const markers = out.split(KIT_MARKER).length - 1;
  if (markers > 1) errors.push(`${where}: kit marker appears ${markers} times`);
  if (markers === 1) out = out.replace(KIT_MARKER, kit ?? '');

  const meta = {
    id: entry.id,
    title: entry.title,
    concept: entry.concept,
    class: entry.class,
    lang: entry.lang,
    ...(entry.steps ? { steps: entry.steps } : {}),
    index: `../../index.html#sim=${entry.id}`,
  };
  if (out.includes(`id="${META_ID}"`)) errors.push(`${where}: must not define #${META_ID} itself; the build adds it`);
  if (!/<\/head>/i.test(out)) errors.push(`${where}: no </head>`);
  out = out.replace(/<\/head>/i, `<script type="application/json" id="${META_ID}">${scriptJson(meta)}</script>\n</head>`);

  // Offline: nothing the page loads may come from the network (plain <a href> links are fine).
  const net = /<(script|link|img|iframe|audio|video|source)\b[^>]*\b(src|href)\s*=\s*["']?(https?:)?\/\//gi;
  for (const m of out.matchAll(net)) errors.push(`${where}: loads from the network (${m[0].slice(0, 60)}…)`);
  if (/@import\s+url\(\s*["']?https?:/i.test(out) || /url\(\s*["']?https?:/i.test(out)) errors.push(`${where}: CSS loads from the network`);
  return { html: out, errors };
}

/** The kit, inlined at the marker. Owned by the kit thread; absent until it lands. */
export function loadKit(root) {
  const css = join(root, 'kit', 'kit.css');
  const js = join(root, 'kit', 'kit.js');
  if (!existsSync(css) && !existsSync(js)) return null;
  return [
    existsSync(css) ? `<style data-simdeck-kit>${read(css)}</style>` : '',
    existsSync(js) ? `<script data-simdeck-kit>${read(js).replace(/<\/script/gi, '<\\/script')}</script>` : '',
  ].join('\n');
}

export function build({ root, out, log = console.log }) {
  const repo = loadRepo(root);
  const { entries, courses, errors, warnings } = validate(repo);
  const site = { title: 'simdeck', lang: 'hr', ...repo.site };
  const kit = loadKit(root);
  if (!kit) warnings.push('kit/ not found: the kit marker is removed and sims build without the kit');

  const pages = [];
  for (const e of entries.filter((x) => x.kind === 'native')) {
    const simDir = join(root, 'sims', e.id);
    const src = repo.natives.find((n) => n.dir === e.id)?.html;
    if (src == null) continue;
    const r = buildNative(src, e, { simDir, kit });
    errors.push(...r.errors);
    pages.push({ e, html: r.html });
  }
  if (errors.length) return { ok: false, errors, warnings };

  rmSync(out, { recursive: true, force: true });
  const write = (rel, content) => {
    const p = join(out, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  };
  const copy = (rel) => {
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    copyFileSync(join(root, rel), join(out, rel));
  };

  for (const { e, html } of pages) {
    write(`sims/${e.id}/index.html`, html);
    if (e.thumb) copy(e.thumb);
  }
  for (const e of entries) if (e.kind === 'linked' && e.thumb) copy(e.thumb);

  const data = { site, vocab: repo.vocab, entries, courses };
  const core = inlineCore();
  write('manifest.json', `${JSON.stringify(data, null, 2)}\n`);

  write('index.html', fill(read(join(SITE, 'index.html')), {
    TITLE: escapeHtml(site.title),
    CSS: read(join(SITE, 'index.css')),
    DATA: scriptJson(data),
    SCRIPT: `${core}\n${read(join(SITE, 'index.js'))}`,
  }));

  const handoutCss = read(join(SITE, 'handout.css'));
  const toolbar = (back) => `<nav class="toolbar"><a href="${back}">← indeks</a><button type="button" onclick="print()">Ispiši</button></nav>`;
  write('handout.html', fill(read(join(SITE, 'handout.html')), {
    LANG: site.lang,
    TITLE: 'Izroček',
    CSS: handoutCss,
    TOOLBAR: toolbar('index.html'),
    BODY: '',
    EXTRA: `<p id="skipped" class="skipped" hidden></p>
<script type="application/json" id="simdeck-data">${scriptJson(data)}</script>
<script type="module">${core}\n${read(join(SITE, 'handout.js'))}</script>`,
  }));

  // Course pages are static HTML (only a print button): students' browsers just follow links.
  for (const c of courses) {
    const { html, skipped } = renderHandout(c, data, 2);
    for (const s of skipped) warnings.push(`courses/${c.id}.json: "${s.id}" left off the page (${s.why})`);
    write(`courses/${c.id}/index.html`, fill(read(join(SITE, 'handout.html')), {
      LANG: c.lang ?? site.lang,
      TITLE: escapeHtml(c.title),
      CSS: handoutCss,
      TOOLBAR: '<nav class="toolbar"><button type="button" onclick="print()">Ispiši</button></nav>',
      BODY: html,
      EXTRA: '',
    }));
  }

  log(`built ${pages.length} native sims, ${entries.length} entries, ${courses.length} course pages → ${relative(process.cwd(), out) || out}`);
  return { ok: true, errors, warnings, entries, courses };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name, dflt) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? resolve(process.argv[i + 1]) : dflt;
  };
  const root = arg('--root', resolve(HERE, '..'));
  const out = arg('--out', join(root, 'dist'));
  const r = build({ root, out });
  for (const w of [...new Set(r.warnings)]) console.warn(`warning: ${w}`);
  for (const e of r.errors) console.error(`error: ${e}`);
  process.exit(r.ok ? 0 : 1);
}
