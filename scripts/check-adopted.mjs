#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Browser check for an adopted page that does not use the kit (sim.json `origin` set and `kit` declared in
// #simdeck-exceptions, lib/contract.mjs kitWaived), such as an ossimulator single-file build. The gate runs it in
// place of kit/tools/check-page.mjs, on the built file from file:// with every network request blocked.
//   node scripts/check-adopted.mjs <page.html> [--shots <dir>] [--json <file>]
//
// It runs the checks that need no window.simdeck, per language the page has (#simdeck-meta `languages`, else both),
// opening it with ?lang=<lang> as ossimulator pages read it:
//   offline     no network request is attempted (each open)          console    no console errors or warnings
//   one-screen  no scroll at 1920×1080, light and dark                text-size  body ≥ 20 px, nothing under 16 px
//   phone       no horizontal scroll at 375×812 (and 14 px floor)    languages  <html lang> is the requested one
//   theme       the page's background follows the OS light / dark     motion     no animation runs with reduced motion
//   entries     each sim.json preset entry's link opens without errors
// The checks that need the kit (mounting, kit marker, string tables and words, the L switch, clicker keys, the step
// count, an entry opening paused at its preset) are reported under rule `kit` as not run, and the declared `kit`
// exception waives them. A page that does mount the kit fails (rule manifest): it must drop the exception, so the
// kit's full check runs. Output and --json have check-page.mjs's shape.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { pageExceptions, pageMeta } from '../lib/manifest.mjs';
import { applyExceptions, canWaive, exceptionProblems } from '../lib/contract.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const shots = opt('--shots');
const jsonOut = opt('--json');
const page = args.find((a, i) => !a.startsWith('--') && !['--shots', '--json'].includes(args[i - 1]));
if (!page) { console.error('usage: check-adopted.mjs <page.html> [--shots <dir>] [--json <file>]'); process.exit(2); }

const url = pathToFileURL(path.resolve(page)).href;
const name = path.basename(path.dirname(path.resolve(page)));
if (shots) mkdirSync(shots, { recursive: true });
const source = readFileSync(page, 'utf8');
const exceptions = pageExceptions(source) ?? [];
const meta = pageMeta(source) ?? {};
const ADOPTED = { adopted: true }; // the gate runs this only for pages whose sim.json has origin

const results = [];
const check = (rule, label, ok, detail = '') => {
  ok = !!ok;
  results.push({ rule, label, ok, detail });
  const waived = !ok && canWaive(rule, ADOPTED) && exceptions.some((x) => x.rule === rule);
  console.log(`${ok ? 'ok  ' : waived ? 'WAIV' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}${waived ? `  (waived: ${rule})` : ''}`);
};

const browser = await chromium.launch();

async function open(viewport, query = '', { colorScheme = 'light', reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport, colorScheme, reducedMotion });
  const blocked = [];
  await ctx.route('**/*', (r) => {
    const u = r.request().url();
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    blocked.push(u);
    return r.abort();
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  // A blocked request logs "net::ERR_FAILED" too; it is reported once, as an offline failure, not as console noise.
  p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/net::ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  await p.goto(url + query, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150); // the page's own boot (theme, scenario) after load
  const done = async (at) => {
    check('offline', `${at}: no network requests`, blocked.length === 0, [...new Set(blocked)].slice(0, 3).join(', '));
    check('console', `${at}: no console errors or warnings`, errors.length === 0, errors.join(' | ').slice(0, 300));
    await ctx.close();
  };
  return { p, done };
}

// Smallest rendered font size over visible text, and the elements below a floor (as check-page.mjs, no kit classes).
const textProbe = (floor) => {
  const out = { min: Infinity, below: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (el.closest('script, style, [hidden], dialog:not([open])')) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden') continue;
    const fs = parseFloat(cs.fontSize);
    out.min = Math.min(out.min, fs);
    if (fs < floor) out.below.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}: ${fs}px "${n.textContent.trim().slice(0, 30)}"`);
  }
  return out;
};
const fits = (p) => p.evaluate(() => ({
  h: document.documentElement.scrollHeight, ih: innerHeight, w: document.documentElement.scrollWidth, iw: innerWidth,
}));
// The page's background as luminance 0–1: the first opaque background from body up to the root, else white.
const background = (p) => p.evaluate(() => {
  for (const el of [document.body, document.documentElement]) {
    const c = getComputedStyle(el).backgroundColor;
    const m = c.match(/[\d.]+/g)?.map(Number);
    if (m && (m.length < 4 || m[3] > 0.5)) {
      const [r, g, b] = m.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return { lum: 0.2126 * r + 0.7152 * g + 0.0722 * b, css: c };
    }
  }
  return { lum: 1, css: 'none (white)' };
});

// ── what the page is: does it mount the kit after all ──
const hasKit = await (async () => {
  const { p, done } = await open({ width: 1920, height: 1080 });
  const k = await p.evaluate(() => !!window.simdeck);
  await done('1920×1080 first load');
  return k;
})();
const langs = meta.languages ?? ['hr', 'en'];
const stepper = meta.class === 'stepper';
console.log(`adopted page without the kit · languages: ${langs.join(', ')} · class: ${meta.class ?? '?'}`);

if (hasKit) {
  // Not a waiver to keep: it would skip the kit's checks on a page that has the kit.
  check('kit', 'the page mounts the kit (window.simdeck)', true);
  check('manifest', 'a page that mounts the kit declares no kit exception', false, 'drop it, so the kit\'s full check (kit/tools/check-page.mjs) runs');
} else {
  const notRun = 'not run: needs the kit (window.simdeck)';
  check('kit', 'the page mounts the kit (window.simdeck, kit marker)', false, 'an adopted page with its own runtime');
  check('kit', 'languages: string tables complete, every visible word from the tables, L switches', false, notRun);
  if (stepper) {
    check('kit', 'keys: clicker keys move the step counter', false, notRun);
    check('kit', 'steps: the controller\'s step count equals sim.json steps', false, notRun);
  }
  if (meta.entries?.length) check('kit', 'entries: each preset entry opens paused at its preset', false, notRun);
}

// ── projector size, in every language: one screen, text floors, <html lang> ──
for (const lang of langs) {
  for (const theme of ['light', 'dark']) {
    const { p, done } = await open({ width: 1920, height: 1080 }, `?lang=${lang}`, { colorScheme: theme });
    const at = `1920×1080 ${lang} ${theme}`;
    check('languages', `${at}: page is in ${lang}`, (await p.evaluate(() => document.documentElement.lang)) === lang);
    const f = await fits(p);
    check('one-screen', `${at}: no scroll`, f.h <= f.ih && f.w <= f.iw, `${f.w}×${f.h}`);
    const body = await p.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
    check('text-size', `${at}: body text >= 20 px`, body >= 20, `${body}px`);
    const t = await p.evaluate(textProbe, 16);
    check('text-size', `${at}: no text under 16 px`, t.below.length === 0, `min ${t.min}px ${t.below.slice(0, 3).join('; ')}`);
    if (shots) {
      const base = path.join(shots, `${name}-${lang}-1920x1080`);
      await p.screenshot({ path: `${base}-${theme}.png` });
      if (theme === 'light') {
        await p.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)'; });
        await p.screenshot({ path: `${base}-grayscale.png` });
        await p.evaluate(() => { document.documentElement.style.filter = ''; });
      }
    }
    await done(at);
  }

  // ── phone: no horizontal scroll ──
  {
    const { p, done } = await open({ width: 375, height: 812 }, `?lang=${lang}`);
    const f = await fits(p);
    check('phone', `375×812 ${lang}: no horizontal scroll`, f.w <= f.iw, `${f.w}px`);
    const t = await p.evaluate(textProbe, 14);
    check('text-size', `375×812 ${lang}: no text under 14 px`, t.below.length === 0, `min ${t.min}px ${t.below.slice(0, 3).join('; ')}`);
    if (shots) await p.screenshot({ path: path.join(shots, `${name}-${lang}-375x812-light.png`), fullPage: true });
    await done(`375×812 ${lang}`);
  }
}

// ── theme follows the OS: the page's background is darker under the OS dark setting than under light ──
{
  const bg = {};
  for (const scheme of ['light', 'dark']) {
    const { p, done } = await open({ width: 1920, height: 1080 }, '', { colorScheme: scheme });
    bg[scheme] = await background(p);
    await done(`OS ${scheme}`);
  }
  check('theme', 'the background follows the OS (dark darker than light)', bg.dark.lum < bg.light.lum - 0.2, `light ${bg.light.css}, dark ${bg.dark.css}`);
}

// ── reduced motion: the URL switch and the OS setting; no animation is running ──
for (const [how, query, reducedMotion] of [['?motion=reduce', '?motion=reduce', 'no-preference'], ['the OS setting', '', 'reduce']]) {
  const { p, done } = await open({ width: 1920, height: 1080 }, query, { reducedMotion });
  const running = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName || a.transitionProperty || a.id || 'script animation'));
  check('motion', `${how} disables animation`, running.length === 0, running.slice(0, 5).join(', '));
  await done(`reduced motion (${how})`);
}

// ── preset entries: each link opens the page without errors (opening paused at the preset needs the kit) ──
for (const x of meta.entries ?? []) {
  const q = `?${x.query ?? `preset=${encodeURIComponent(x.preset)}`}`;
  const { p, done } = await open({ width: 1920, height: 1080 }, q);
  check('entries', `entry ${x.preset}: ${q} opens`, (await p.evaluate(() => document.body?.children.length ?? 0)) > 0);
  await done(`entry ${x.preset}`);
}

await browser.close();
for (const pr of exceptionProblems(exceptions, ADOPTED)) check('manifest', `#simdeck-exceptions: ${pr}`, false);
const r = applyExceptions(results, exceptions, ADOPTED);
const nWaived = Object.values(r.waived).reduce((a, b) => a + b, 0);
if (exceptions.length) {
  console.log(`\nexceptions declared: ${exceptions.map((x) => x.rule).join(', ')}`);
  if (nWaived) console.log(`waived checks: ${Object.entries(r.waived).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  if (r.unused.length) console.log(`unused exceptions (the page follows the rule; drop them): ${r.unused.join(', ')}`);
}
console.log(r.failed.length ? `\n${r.failed.length} check(s) failed` : `\nall ${results.length} checks pass${nWaived ? ` (${nWaived} waived)` : ''}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ page, results: r.results, exceptions, waived: r.waived, unused: r.unused }, null, 2));
process.exit(r.failed.length ? 1 : 0);
