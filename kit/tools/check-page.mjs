// SPDX-License-Identifier: AGPL-3.0-or-later
// Browser check for one native sim page, opened from file:// with every network request blocked.
// Usage: node kit/tools/check-page.mjs <page.html> [--shots <dir>] [--json <file>]
// Needs the repo's dev dependency (npm install; npx playwright install chromium if the browser is missing).
// The gate (npm run gate -- <id>) runs it on the built single file; run alone, it checks a page unbuilt.
// Every check reports under a contract rule (lib/contract.mjs RULES). A failing check whose rule the page declares in
// #simdeck-exceptions is waived, not failed, and counted. Layout, text and words are checked once per language the
// page has (Simdeck.languages): Croatian labels run longer, and every visible word must come from the tables.
// Key checks run for steppers (class from #simdeck-meta); every page gets the rest.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pageExceptions, pageMeta } from '../../lib/manifest.mjs';
import { RULES, applyExceptions, exceptionProblems } from '../../lib/contract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const shots = opt('--shots');
const jsonOut = opt('--json');
const page = args.find((a, i) => !a.startsWith('--') && !['--shots', '--json'].includes(args[i - 1]));
if (!page) { console.error('usage: check-page.mjs <page.html> [--shots <dir>] [--json <file>]'); process.exit(2); }

const url = pathToFileURL(path.resolve(page)).href;
const name = path.basename(path.dirname(path.resolve(page)));
if (shots) mkdirSync(shots, { recursive: true });
const source = readFileSync(page, 'utf8');
const exceptions = pageExceptions(source) ?? [];
const meta = pageMeta(source) ?? {};
const KIT_VERSION = /var VERSION = '([^']+)'/.exec(readFileSync(path.join(HERE, '..', 'kit.js'), 'utf8'))?.[1];

const results = [];
const check = (rule, label, ok, detail = '') => {
  ok = !!ok;
  results.push({ rule, label, ok, detail });
  const waived = !ok && RULES[rule]?.waivable && exceptions.some((x) => x.rule === rule);
  console.log(`${ok ? 'ok  ' : waived ? 'WAIV' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}${waived ? `  (waived: ${rule})` : ''}`);
};

const browser = await chromium.launch();

async function finish() {
  await browser.close();
  const probs = exceptionProblems(exceptions);
  for (const p of probs) check('manifest', `#simdeck-exceptions: ${p}`, false);
  const r = applyExceptions(results, exceptions);
  const nWaived = Object.values(r.waived).reduce((a, b) => a + b, 0);
  if (exceptions.length) {
    console.log(`\nexceptions declared: ${exceptions.map((x) => x.rule).join(', ')}`);
    if (nWaived) console.log(`waived checks: ${Object.entries(r.waived).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    if (r.unused.length) console.log(`unused exceptions (the page follows the rule; drop them): ${r.unused.join(', ')}`);
  }
  console.log(r.failed.length ? `\n${r.failed.length} check(s) failed` : `\nall ${results.length} checks pass${nWaived ? ` (${nWaived} waived)` : ''}`);
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ page, results: r.results, exceptions, waived: r.waived, unused: r.unused }, null, 2));
  process.exit(r.failed.length ? 1 : 0);
}

async function open(viewport, query = '', opts = {}) {
  const ctx = opts.ctx || await browser.newContext({ viewport, reducedMotion: opts.reducedMotion || 'no-preference', colorScheme: opts.colorScheme || 'light' });
  if (!opts.ctx) await ctx.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await p.goto(url + query);
  try {
    await p.waitForFunction(() => window.simdeck && document.fonts.status === 'loaded', null, { timeout: 10000 });
  } catch {
    check('kit', `the page mounts the kit (window.simdeck)${query ? ' with ' + query : ''}`, false, errors.join(' | ').slice(0, 300) || 'timed out');
    await finish();
  }
  return { ctx, p, errors };
}

// Smallest rendered font size over visible text, and the elements below a floor.
const textProbe = (floor) => {
  const out = { min: Infinity, below: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[hidden], .sd-vh, dialog:not([open])')) continue;
    const fs = parseFloat(cs.fontSize);
    out.min = Math.min(out.min, fs);
    if (fs < floor) out.below.push(`${el.tagName.toLowerCase()}.${el.className}: ${fs}px "${n.textContent.trim().slice(0, 30)}"`);
  }
  return out;
};

// Every word of visible text must be a word of the page's tables in this language (Simdeck.i18n.words: the page's
// strings, the kit's, the title and concept). Key caps, code and [translate="no"] (data such as host names) are
// exempt. Catches a label typed into the page instead of the table, and text left in the other language.
const wordsProbe = () => {
  if (!window.Simdeck || !Simdeck.i18n) return { bad: ['the kit has no i18n (kit < 0.2.0)'] };
  const allowed = new Set(Simdeck.i18n.words());
  const bad = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || el.closest('kbd, code, samp, var, [translate="no"], script, style')) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[hidden], .sd-vh, dialog:not([open])')) continue;
    for (const w of n.textContent.toLowerCase().match(/\p{L}+/gu) || []) {
      if (!allowed.has(w)) bad.push(`"${w}" in ${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}: "${n.textContent.trim().slice(0, 40)}"`);
    }
  }
  return { bad: [...new Set(bad)] };
};

const fits = (p) => p.evaluate(() => ({
  h: document.documentElement.scrollHeight, ih: innerHeight, w: document.documentElement.scrollWidth, iw: innerWidth,
}));

// ── what the page is: languages, class, steps ──
const info = await (async () => {
  const { ctx, p } = await open({ width: 1920, height: 1080 });
  const i = await p.evaluate(() => ({
    langs: (window.Simdeck && Simdeck.languages) || [document.documentElement.lang],
    steps: window.simdeck.steps,
  }));
  // Preset ids by their keys: the second preset (key 2) is the demo's mid-state in screenshots and the deep link.
  i.presets = [];
  for (const k of ['1', '2']) { await p.keyboard.press(k); i.presets.push(await p.evaluate(() => window.simdeck.preset)); }
  await ctx.close();
  return i;
})();
const langs = info.langs;
const stepper = (meta.class ?? 'stepper') === 'stepper';
console.log(`languages: ${langs.join(', ')} · class: ${meta.class ?? '?'} · steps: ${info.steps}`);

// ── the step count the page runs is the one sim.json declares (the built page's meta is generated from it) ──
if (stepper) check('steps', `the controller has ${meta.steps} steps, as sim.json says`, info.steps === meta.steps, `controller: ${info.steps}`);

// ── projector size (the contract target), in every language: fit one screen, text floors, words from the tables ──
for (const lang of langs) {
  for (const [w, hgt] of [[1920, 1080]]) {
    for (const theme of ['light', 'dark']) {
      const { ctx, p, errors } = await open({ width: w, height: hgt }, `?theme=${theme}&lang=${lang}`);
      const at = `${w}×${hgt} ${lang} ${theme}`;
      check('languages', `${at}: page is in ${lang}`, (await p.evaluate(() => document.documentElement.lang)) === lang);
      const f = await fits(p);
      check('one-screen', `${at}: no scroll`, f.h <= f.ih && f.w <= f.iw, `${f.w}×${f.h}`);
      const panel = await p.evaluate(() => { const e = document.querySelector('.sd-panel'); return e ? { sh: e.scrollHeight, ch: e.clientHeight } : { sh: 0, ch: 0 }; });
      check('one-screen', `${at}: panel fits without its own scroll`, panel.sh <= panel.ch + 1, `${panel.sh} > ${panel.ch}`);
      const root = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      check('text-size', `${at}: body text >= 20 px`, root >= 20, `${root}px`);
      const t = await p.evaluate(textProbe, 16);
      check('text-size', `${at}: no text under 16 px`, t.below.length === 0, `min ${t.min}px ${t.below.slice(0, 3).join('; ')}`);
      if (theme === 'light') {
        const probs = await p.evaluate(() => (window.Simdeck && Simdeck.i18n ? Simdeck.i18n.problems() : ['no kit']));
        check('languages', `${lang}: string tables complete (same keys in every language)`, probs.length === 0, probs.slice(0, 4).join('; '));
        const marker = await p.evaluate(() => document.documentElement.dataset.kit);
        check('kit', `${w}×${hgt}: kit marker`, marker === KIT_VERSION, `data-kit ${marker}, kit ${KIT_VERSION}`);
        // Words at the start, mid-demo (second preset, two steps) and at the end: captions change with the state.
        const bad = (await p.evaluate(wordsProbe)).bad;
        // The collapsed explanation too (it is visible once opened).
        if (await p.evaluate(() => { const d = document.querySelector('.sd-explain'); if (d) d.open = true; return !!d; })) {
          bad.push(...(await p.evaluate(wordsProbe)).bad);
          await p.evaluate(() => { document.querySelector('.sd-explain').open = false; });
        }
        if (await p.evaluate(() => window.simdeck.steps > 0)) {
          await p.keyboard.press('2'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
          bad.push(...(await p.evaluate(wordsProbe)).bad);
          await p.keyboard.press('End');
          bad.push(...(await p.evaluate(wordsProbe)).bad);
          await p.keyboard.press('Home');
        }
        const uniq = [...new Set(bad)];
        check('languages', `${at}: every visible word is from the ${lang} tables`, uniq.length === 0, uniq.slice(0, 5).join('; '));
      }
      check('console', `${at}: no console errors or warnings`, errors.length === 0, errors.join(' | '));
      if (shots) {
        const base = path.join(shots, `${name}-${lang}-${w}x${hgt}`);
        await p.keyboard.press('2'); // second preset, then two steps: a mid-demo state with changes highlighted
        await p.keyboard.press('ArrowRight');
        await p.keyboard.press('ArrowRight');
        await p.waitForTimeout(450);
        await p.screenshot({ path: `${base}-${theme}.png` });
        if (theme === 'light') {
          await p.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)'; });
          await p.screenshot({ path: `${base}-grayscale.png` });
          await p.evaluate(() => { document.documentElement.style.filter = ''; });
          await p.keyboard.press('c');
          await p.screenshot({ path: `${base}-panel-hidden.png` });
          await p.keyboard.press('c');
          await p.keyboard.press('?');
          await p.screenshot({ path: `${base}-help.png` });
        }
      }
      await ctx.close();
    }
  }

  // ── phone: no horizontal scroll, nothing cut off ──
  {
    const { ctx, p, errors } = await open({ width: 375, height: 812 }, `?lang=${lang}`);
    const f = await fits(p);
    check('phone', `375×812 ${lang}: no horizontal scroll`, f.w <= f.iw, `${f.w}px`);
    const t = await p.evaluate(textProbe, 14);
    check('text-size', `375×812 ${lang}: no text under 14 px`, t.below.length === 0, `min ${t.min}px`);
    check('console', `375×812 ${lang}: no console errors`, errors.length === 0, errors.join(' | '));
    if (shots) await p.screenshot({ path: path.join(shots, `${name}-${lang}-375x812-light.png`), fullPage: true });
    await ctx.close();
  }
}

// ── language switch: L (and the header button) reload the same file in the other language, at the same step; the
//    choice is remembered by the next simdeck page opened without ?lang= ──
if (langs.length > 1) {
  const { ctx, p } = await open({ width: 1920, height: 1080 }, `?lang=${langs[0]}`);
  await p.keyboard.press('3');
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowRight');
  const before = await p.evaluate(() => ({ n: window.simdeck.n, preset: window.simdeck.preset }));
  await Promise.all([p.waitForEvent('load'), p.keyboard.press('l')]);
  await p.waitForFunction(() => window.simdeck);
  const after = await p.evaluate(() => ({ lang: document.documentElement.lang, n: window.simdeck.n, preset: window.simdeck.preset }));
  check('languages', `L switches ${langs[0]} -> ${langs[1]} and keeps preset and step`, after.lang === langs[1] && after.n === before.n && after.preset === before.preset, JSON.stringify({ before, after }));
  const btn = await p.locator('[data-sd-tools] .sd-langbtn').count();
  check('languages', 'the header has the language button', btn === 1);
  const q2 = await open({ width: 1920, height: 1080 }, '', { ctx });
  check('languages', `the choice is remembered without ?lang= (${langs[1]})`, (await q2.p.evaluate(() => document.documentElement.lang)) === langs[1]);
  const back = await q2.p.evaluate(() => document.querySelector('[data-sd-back]')?.getAttribute('href') || '');
  check('languages', 'the back link keeps the language', back.endsWith(`?lang=${langs[1]}`), back);
  await ctx.close();
}

// ── clicker keys (steppers) ──
if (stepper) {
  const { ctx, p } = await open({ width: 1920, height: 1080 });
  const n = () => p.evaluate(() => window.simdeck.n);
  const steps = info.steps;
  const s = (k) => Math.min(k, steps);
  const seq = [['ArrowRight', s(1)], ['PageDown', s(2)], ['ArrowLeft', s(2) - 1], ['PageUp', Math.max(0, s(2) - 2)], ['End', steps], ['Home', 0]];
  for (const [k, want] of seq) { await p.keyboard.press(k); check('keys', `key ${k} -> step ${want}`, (await n()) === want, `got ${await n()}`); }
  await p.keyboard.press('Space');
  check('keys', 'Space starts play', await p.evaluate(() => window.simdeck.playing));
  await p.keyboard.press('Space');
  check('keys', 'Space pauses', !(await p.evaluate(() => window.simdeck.playing)));
  const preset = info.presets[1] ?? info.presets[0];
  if (info.presets[1] != null) {
    await p.keyboard.press('2');
    check('keys', 'digit 2 loads the second preset', (await p.evaluate(() => window.simdeck.preset)) === info.presets[1], String(info.presets[1]));
  }
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('r');
  check('keys', 'R goes back to step 0 and keeps the preset', (await n()) === 0 && (await p.evaluate(() => window.simdeck.preset)) === preset);

  // The trap a lecturer hits: drag a slider with the mouse, then press the clicker. The page must still step.
  const slider = p.locator('[data-sd-controls] input[type="range"]').first();
  if (await slider.count()) {
    const box = await slider.boundingBox();
    await p.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    const before = await n();
    await p.keyboard.press('ArrowRight');
    check('keys', 'after a mouse drag on a slider, → still steps', (await n()) === s(before + 1), `focus on ${await p.evaluate(() => document.activeElement.tagName)}`);
  }
  const presetBtn = p.locator('[data-sd-presets] button').first();
  if (await presetBtn.count()) {
    await presetBtn.click();
    await p.keyboard.press('Space');
    check('keys', 'after clicking a preset button, Space plays (button did not keep focus)', await p.evaluate(() => window.simdeck.playing));
    await p.keyboard.press('Space');
  }

  await p.keyboard.press('Home');
  await p.keyboard.press('b');
  check('keys', 'B blanks the screen', await p.evaluate(() => !document.querySelector('.sd-blank')?.hidden));
  await p.keyboard.press('ArrowRight');
  const blankedN = await n();
  await p.keyboard.press('b');
  check('keys', 'keys do nothing while blank; B unblanks', await p.evaluate(() => document.querySelector('.sd-blank')?.hidden) && blankedN === 0);

  // Deep link: preset + step from the URL, paused.
  const deep = s(3);
  const q = `?${preset != null ? `preset=${encodeURIComponent(preset)}&` : ''}step=${deep}`;
  await p.goto(url + q);
  await p.waitForFunction(() => window.simdeck);
  check('keys', `${q} opens there, paused`, (await n()) === deep && !(await p.evaluate(() => window.simdeck.playing)) && (await p.evaluate(() => window.simdeck.preset)) === (preset ?? null));
  await ctx.close();
}

// ── theme follows the OS ──
for (const scheme of ['light', 'dark']) {
  const { ctx, p } = await open({ width: 1920, height: 1080 }, '', { colorScheme: scheme });
  check('theme', `OS ${scheme} -> data-theme ${scheme}`, (await p.evaluate(() => document.documentElement.dataset.theme)) === scheme);
  await p.keyboard.press('t');
  check('theme', `T does not override the OS (${scheme})`, (await p.evaluate(() => document.documentElement.dataset.theme)) === scheme);
  await ctx.close();
}

// ── reduced motion: the URL switch and the OS setting; no animation runs after a step (CSS or script-made) ──
for (const [how, query, reducedMotion] of [['?motion=reduce', '?motion=reduce', 'no-preference'], ['the OS setting', '', 'reduce']]) {
  const { ctx, p } = await open({ width: 1920, height: 1080 }, query, { reducedMotion });
  if (stepper) { await p.keyboard.press('2'); await p.keyboard.press('ArrowRight'); }
  await p.waitForTimeout(50);
  const running = await p.evaluate(() => document.getAnimations().map((a) => a.animationName || a.transitionProperty || a.id || 'script animation'));
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.sd-changed') || document.body).animationName);
  check('motion', `${how} disables animation`, running.length === 0 && anim === 'none', running.length ? running.join(', ') : anim);
  await ctx.close();
}

await finish();
