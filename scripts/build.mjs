#!/usr/bin/env node
// Builds the published site from the manifest sources. No dependencies: Node's standard library only.
// The output is plain static files with relative links, so the folder works on any web server, at
// any path, or straight from a USB stick (file://).
//
//   index.html                  home: course links, then every finished simulator by topic, one search box
//   courses/<id>/index.html     one page per course file (the "playlist" students get)
//   sims/<id>/index.html        each native sim as one self-contained file
//
// Unfinished (status "wip") entries are not published. Editing happens in the admin app
// (scripts/admin.mjs), never on the published site.
//
// Usage: node scripts/build.mjs [--root <dir>] [--out <dir>] [--drafts]
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepo, validate } from '../lib/manifest.mjs';
import { renderCourse, renderIndexList, isPublic, escapeHtml } from '../site/core.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', 'site');
export const KIT_MARKER = '<!-- simdeck:kit -->';
export const META_ID = 'simdeck-meta';

const read = (p) => readFileSync(p, 'utf8');

// Marks a folder as built by simdeck, so a rebuild may empty it. Any other non-empty folder is left alone.
export const STAMP = '.simdeck-site';

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
    index: '../../index.html',
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

/** Refuses to empty a folder that has files but no stamp: --out might be a USB stick's root. */
function prepareOut(out) {
  if (existsSync(out) && readdirSync(out).length && !existsSync(join(out, STAMP))) {
    return `${out} is not empty and was not built by simdeck; choose an empty or new folder`;
  }
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, STAMP), 'Built by simdeck (scripts/build.mjs). Rebuilding replaces this folder.\n');
  return null;
}

/** drafts: also publish "wip" entries (for the admin's preview). */
export function build({ root, out, log = console.log, drafts = false }) {
  const repo = loadRepo(root);
  const { entries: all, courses, errors, warnings } = validate(repo);
  const entries = drafts ? all : all.filter(isPublic);
  const site = { title: 'simdeck', lang: 'hr', ...repo.site };
  const kit = loadKit(root);
  if (!kit) warnings.push('kit/ not found: the kit marker is removed and sims build without the kit');

  const pages = [];
  for (const e of entries) {
    const simDir = join(root, 'sims', e.id);
    const src = repo.natives.find((n) => n.dir === e.id)?.html;
    if (src == null) continue;
    const r = buildNative(src, e, { simDir, kit });
    errors.push(...r.errors);
    pages.push({ e, html: r.html });
  }
  if (errors.length) return { ok: false, errors, warnings };
  const outErr = prepareOut(out);
  if (outErr) return { ok: false, errors: [outErr], warnings };

  const write = (rel, content) => {
    const p = join(out, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  };

  for (const { e, html } of pages) {
    write(`sims/${e.id}/index.html`, html);
  }

  const ctx = { site, vocab: repo.vocab, entries, courses };
  const list = courses.length
    ? `<p class="courses">Kolegiji: ${courses.map((c) => `<a href="courses/${encodeURIComponent(c.id)}/index.html">${escapeHtml(c.title)}</a>`).join(' · ')}</p>`
    : '';
  write('index.html', fill(read(join(SITE, 'index.html')), {
    LANG: site.lang,
    TITLE: escapeHtml(site.title),
    COURSES: list,
    CSS: read(join(SITE, 'index.css')),
    LIST: renderIndexList(ctx),
    SCRIPT: read(join(SITE, 'index.js')),
  }));

  // Course pages are static HTML (only a print button): students' browsers just follow links.
  const courseCss = read(join(SITE, 'course.css'));
  for (const c of courses) {
    const { html, skipped } = renderCourse(c, { ...ctx, entries: all }, 2, drafts);
    for (const s of skipped) warnings.push(`courses/${c.id}.json: "${s.id}" left off the page (${s.why})`);
    write(`courses/${c.id}/index.html`, fill(read(join(SITE, 'course.html')), {
      LANG: c.lang ?? site.lang,
      TITLE: escapeHtml(c.title),
      CSS: courseCss,
      BODY: html,
    }));
  }

  log(`built ${pages.length} sims, ${courses.length} course pages → ${relative(process.cwd(), out) || out}`);
  return { ok: true, errors, warnings, entries, courses };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name, dflt) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? resolve(process.argv[i + 1]) : dflt;
  };
  const root = arg('--root', resolve(HERE, '..'));
  const out = arg('--out', join(root, 'dist'));
  const r = build({ root, out, drafts: process.argv.includes('--drafts') });
  for (const w of [...new Set(r.warnings)]) console.warn(`warning: ${w}`);
  for (const e of r.errors) console.error(`error: ${e}`);
  process.exit(r.ok ? 0 : 1);
}
