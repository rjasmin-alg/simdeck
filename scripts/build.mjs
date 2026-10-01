#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Builds the published site from the manifest sources. No dependencies: Node's standard library only.
// The output is plain static files with relative links, so the folder works on any web server, at
// any path, or straight from a USB stick (file://).
//
//   index.html                  home: course links, then every finished simulator by topic, one search box
//   courses/<id>/index.html     one page per course file (the "playlist" students get)
//   licences/index.html         simdeck's licence and source, and every third-party part (kit, sims' "credits")
//   licences/*.txt              the licence texts (LICENSE, the kit fonts' OFL)
//   (both in Croatian and English: every text is written in both, site/lang.js shows one)
//   sims/<id>/index.html        each native sim as one self-contained file
//
// Unfinished (status "wip") entries are not published. Editing happens in the admin app
// (scripts/admin.mjs), never on the published site.
//
// Usage: node scripts/build.mjs [--root <dir>] [--out <dir>] [--drafts]
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepo, validate, metaFor } from '../lib/manifest.mjs';
import {
  renderCourse, renderIndexList, renderLicences, licenceLine, sourceHref, isPublic, escapeHtml, bi, biStr, loc, STR, LANGS,
  LICENCE_TEXT, LICENCES_PAGE,
} from '../site/core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', 'site');
export const META_ID = 'simdeck-meta';
/** The kit's help dialog reads the licence and source links from this block (AGPL §13). */
export const SITE_ID = 'simdeck-site';

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

const MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
const META_RE = new RegExp(`<script\\b[^>]*\\bid=["']${META_ID}["'][^>]*>[\\s\\S]*?<\\/script>`, 'i');
/**
 * Turns a sim's source page into one self-contained file:
 *  - local <link rel="stylesheet"> and <script src> are inlined: files in the sim's folder, and the kit
 *    (the template links ../../kit/kit.css and kit.js, so a page also runs unbuilt from file://);
 *  - relative url(...) in inlined CSS (the kit's fonts) become data: URIs;
 *  - the page's #simdeck-meta placeholder is replaced by one generated from sim.json (added if absent);
 *  - a #simdeck-site block gives the kit the licence, source and licences links, as seen from sims/<id>/.
 * Returns { html, errors }.
 */
export function buildNative(html, entry, { simDir, kitDir, site = {} }) {
  const errors = [];
  const where = `sims/${entry.id}/index.html`;
  const inside = (p, dir) => {
    const rel = relative(dir, p);
    return !rel.startsWith('..') && !isAbsolute(rel);
  };
  const locate = (ref, base) => {
    const p = resolve(base, ref.split(/[?#]/)[0]);
    if (!inside(p, simDir) && !(kitDir && inside(p, kitDir))) {
      errors.push(`${where}: "${ref}" is outside the sim's folder and the kit`);
      return null;
    }
    if (!existsSync(p)) {
      errors.push(`${where}: "${ref}" not found`);
      return null;
    }
    return p;
  };
  const inlineUrls = (css, cssDir) => css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    if (!isLocal(ref) || ref.startsWith('#')) return m;
    const p = locate(ref, cssDir);
    if (!p) return m;
    const type = MIME[extname(p).toLowerCase()] ?? 'application/octet-stream';
    return `url("data:${type};base64,${readFileSync(p).toString('base64')}")`;
  });

  let out = html.replace(/<link\b([^>]*?)\bhref\s*=\s*["']([^"']+)["']([^>]*)>/gi, (m, a, href, b) => {
    if (!/\brel\s*=\s*["']?stylesheet/i.test(a + b) || !isLocal(href)) return m;
    const p = locate(href, simDir);
    return p ? `<style>/* ${href} */\n${inlineUrls(read(p), dirname(p))}</style>` : m;
  });
  out = out.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, src, b) => {
    if (!isLocal(src)) return m;
    const p = locate(src, simDir);
    if (!p) return m;
    const attrs = `${a}${b}`.replace(/\s+/g, ' ').trim();
    return `<script${attrs ? ` ${attrs}` : ''}>/* ${src} */\n${read(p).replace(/<\/script/gi, '<\\/script')}</script>`;
  });
  out = out.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (m, a, css) => `<style${a}>${inlineUrls(css, simDir)}</style>`);

  const links = { licence: `../../${LICENCE_TEXT}`, source: sourceHref(site, 2), licences: `../../${LICENCES_PAGE}` };
  const block = `<script type="application/json" id="${META_ID}">${scriptJson(metaFor(entry))}</script>\n`
    + `<script type="application/json" id="${SITE_ID}">${scriptJson(links)}</script>`;
  if (META_RE.test(out)) out = out.replace(META_RE, () => block);
  else if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, () => `${block}\n</head>`);
  else errors.push(`${where}: no </head>`);

  // Offline: nothing the page loads may come from the network (plain <a href> links are fine).
  const net = /<(script|link|img|iframe|audio|video|source)\b[^>]*\b(src|href)\s*=\s*["']?(https?:)?\/\//gi;
  for (const m of out.matchAll(net)) errors.push(`${where}: loads from the network (${m[0].slice(0, 60)}…)`);
  if (/url\(\s*["']?(https?:)?\/\//i.test(out)) errors.push(`${where}: CSS loads from the network`);
  return { html: out, errors };
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
  const kitDir = join(root, 'kit');

  const pages = [];
  for (const e of entries) {
    const simDir = join(root, 'sims', e.id);
    const src = repo.natives.find((n) => n.dir === e.id)?.html;
    if (src == null) continue;
    const r = buildNative(src, e, { simDir, kitDir, site });
    errors.push(...r.errors);
    pages.push({ e, html: r.html });
  }
  // The published site carries simdeck's licence text (AGPL-3.0-or-later) and the kit fonts' OFL.
  for (const f of [join(root, 'LICENSE'), join(kitDir, 'fonts', 'OFL.txt')]) if (!existsSync(f)) errors.push(`${f} is missing`);
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
  const langJs = read(join(SITE, 'lang.js'));
  // The switch names the language it switches to, in that language; site/lang.js shows the right one.
  const langSwitch = `<button type="button" class="lang-switch" data-lang-switch>${LANGS.map((l) => {
    const to = LANGS.find((x) => x !== l);
    return `<span data-l="${l}" lang="${to}">${escapeHtml(STR[to].langName)}</span>`;
  }).join('')}</button>`;
  const list = courses.length
    ? `<p class="courses">${biStr('courses')}: ${courses.map((c) => `<a data-lang-link href="courses/${encodeURIComponent(c.id)}/index.html">${bi(c.title)}</a>`).join(' · ')}</p>`
    : '';
  write('index.html', fill(read(join(SITE, 'index.html')), {
    LANG: site.lang,
    TITLE: escapeHtml(site.title),
    LANGJS: langJs,
    SWITCH: langSwitch,
    COURSES: list,
    SEARCH: escapeHtml(STR[site.lang]?.search ?? STR.hr.search),
    SEARCH_HR: escapeHtml(STR.hr.search),
    SEARCH_EN: escapeHtml(STR.en.search),
    NONE: biStr('noMatch'),
    CSS: read(join(SITE, 'index.css')),
    LIST: renderIndexList(ctx, drafts),
    SCRIPT: read(join(SITE, 'index.js')),
    FOOTER: licenceLine(site, 0),
  }));

  // Course pages are static HTML (only a print button): students' browsers just follow links.
  const courseCss = read(join(SITE, 'course.css'));
  for (const c of courses) {
    // Skipped items (unfinished sims) were already reported by validate().
    const { html } = renderCourse(c, { ...ctx, entries: all }, 2, drafts);
    write(`courses/${c.id}/index.html`, fill(read(join(SITE, 'course.html')), {
      LANG: c.lang ?? site.lang,
      TITLE: escapeHtml(loc(c.title, c.lang ?? site.lang)),
      LANGJS: langJs,
      SWITCH: langSwitch,
      ALL: biStr('allSims'),
      PRINT: biStr('print'),
      CSS: courseCss,
      BODY: html,
    }));
  }

  // AGPL §13 and the third-party notices: the licence texts and one page that lists every licence.
  mkdirSync(join(out, 'licences'), { recursive: true });
  copyFileSync(join(root, 'LICENSE'), join(out, LICENCE_TEXT));
  copyFileSync(join(kitDir, 'fonts', 'OFL.txt'), join(out, 'licences', 'OFL-1.1.txt'));
  write(LICENCES_PAGE, fill(read(join(SITE, 'licences.html')), {
    LANG: site.lang,
    TITLE: escapeHtml(`${STR[site.lang]?.licences ?? STR.hr.licences} · ${site.title}`),
    LANGJS: langJs,
    SWITCH: langSwitch,
    ALL: biStr('allSims'),
    CSS: courseCss,
    BODY: renderLicences(ctx, 1),
  }));

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
