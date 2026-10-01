// Browser check for one native sim page, opened from file:// with every network request blocked.
// Usage: node kit/tools/check-page.mjs <page.html> [--shots <dir>]
// Needs the repo's dev dependency (npm install; npx playwright install chromium if the browser is missing).
// This is a seed for the contract check, not the check itself.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const page = args.find((a) => !a.startsWith('--'));
const shotsIdx = args.indexOf('--shots');
const shots = shotsIdx >= 0 ? args[shotsIdx + 1] : null;
if (!page) { console.error('usage: check-page.mjs <page.html> [--shots <dir>]'); process.exit(2); }

const url = pathToFileURL(path.resolve(page)).href;
const name = path.basename(path.dirname(path.resolve(page)));
if (shots) mkdirSync(shots, { recursive: true });

const results = [];
const check = (label, ok, detail = '') => { results.push({ label, ok, detail }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`); };

const browser = await chromium.launch();

async function open(viewport, query = '', opts = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: opts.reducedMotion || 'no-preference', colorScheme: opts.colorScheme || 'light' });
  await ctx.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await p.goto(url + query);
  await p.waitForFunction(() => window.simdeck && document.fonts.status === 'loaded');
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

const fits = (p) => p.evaluate(() => ({
  h: document.documentElement.scrollHeight, ih: innerHeight, w: document.documentElement.scrollWidth, iw: innerWidth,
}));

// ── projector size (the contract target): fit one screen, text floors ──
for (const [w, hgt] of [[1920, 1080]]) {
  for (const theme of ['light', 'dark']) {
    const { ctx, p, errors } = await open({ width: w, height: hgt }, `?theme=${theme}`);
    const f = await fits(p);
    check(`${w}×${hgt} ${theme}: no scroll`, f.h <= f.ih && f.w <= f.iw, `${f.w}×${f.h}`);
    const panel = await p.evaluate(() => { const e = document.querySelector('.sd-panel'); return e ? { sh: e.scrollHeight, ch: e.clientHeight } : { sh: 0, ch: 0 }; });
    check(`${w}×${hgt} ${theme}: panel fits without its own scroll`, panel.sh <= panel.ch + 1, `${panel.sh} > ${panel.ch}`);
    const root = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    check(`${w}×${hgt}: body text >= 20 px`, root >= 20, `${root}px`);
    const t = await p.evaluate(textProbe, 16);
    check(`${w}×${hgt} ${theme}: no text under 16 px`, t.below.length === 0, `min ${t.min}px ${t.below.slice(0, 3).join('; ')}`);
    check(`${w}×${hgt} ${theme}: no console errors or warnings`, errors.length === 0, errors.join(' | '));
    if (theme === 'light') check(`${w}×${hgt}: kit marker`, (await p.evaluate(() => document.documentElement.dataset.kit)) === '0.1.0');
    if (shots) {
      await p.keyboard.press('2'); // second preset, then two steps: a mid-demo state with changes highlighted
      await p.keyboard.press('ArrowRight');
      await p.keyboard.press('ArrowRight');
      await p.waitForTimeout(450);
      await p.screenshot({ path: path.join(shots, `${name}-${w}x${hgt}-${theme}.png`) });
      if (theme === 'light') {
        await p.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)'; });
        await p.screenshot({ path: path.join(shots, `${name}-${w}x${hgt}-grayscale.png`) });
        await p.evaluate(() => { document.documentElement.style.filter = ''; });
        await p.keyboard.press('c');
        await p.screenshot({ path: path.join(shots, `${name}-${w}x${hgt}-panel-hidden.png`) });
        await p.keyboard.press('c');
        await p.keyboard.press('?');
        await p.screenshot({ path: path.join(shots, `${name}-${w}x${hgt}-help.png`) });
      }
    }
    await ctx.close();
  }
}

// ── phone: no horizontal scroll, nothing cut off ──
{
  const { ctx, p, errors } = await open({ width: 375, height: 812 });
  const f = await fits(p);
  check('375×812: no horizontal scroll', f.w <= f.iw, `${f.w}px`);
  const t = await p.evaluate(textProbe, 14);
  check('375×812: no text under 14 px', t.below.length === 0, `min ${t.min}px`);
  check('375×812: no console errors', errors.length === 0, errors.join(' | '));
  if (shots) await p.screenshot({ path: path.join(shots, `${name}-375x812-light.png`), fullPage: true });
  await ctx.close();
}

// ── keys (stepper) ──
{
  const { ctx, p } = await open({ width: 1920, height: 1080 });
  const n = () => p.evaluate(() => window.simdeck.n);
  const steps = await p.evaluate(() => window.simdeck.steps);
  const seq = [['ArrowRight', 1], ['PageDown', 2], ['ArrowLeft', 1], ['PageUp', 0], ['End', steps], ['Home', 0]];
  for (const [k, want] of seq) { await p.keyboard.press(k); check(`key ${k} -> step ${want}`, (await n()) === want, `got ${await n()}`); }
  await p.keyboard.press('Space');
  check('Space starts play', await p.evaluate(() => window.simdeck.playing));
  await p.keyboard.press('Space');
  check('Space pauses', !(await p.evaluate(() => window.simdeck.playing)));
  await p.keyboard.press('2');
  const preset = await p.evaluate(() => window.simdeck.preset);
  check('digit 2 loads the second preset', preset !== null, String(preset));
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('r');
  check('R goes back to step 0 and keeps the preset', (await n()) === 0 && (await p.evaluate(() => window.simdeck.preset)) === preset);

  // The trap a lecturer hits: drag a slider with the mouse, then press the clicker. The page must still step.
  const slider = p.locator('[data-sd-controls] input[type="range"]').first();
  const box = await slider.boundingBox();
  await p.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
  const before = await n();
  await p.keyboard.press('ArrowRight');
  check('after a mouse drag on a slider, → still steps', (await n()) === before + 1, `focus on ${await p.evaluate(() => document.activeElement.tagName)}`);
  await p.locator('[data-sd-presets] button').first().click();
  await p.keyboard.press('Space');
  check('after clicking a preset button, Space plays (button did not keep focus)', await p.evaluate(() => window.simdeck.playing));
  await p.keyboard.press('Space');

  await p.keyboard.press('b');
  check('B blanks the screen', await p.evaluate(() => !document.querySelector('.sd-blank').hidden));
  await p.keyboard.press('ArrowRight');
  const blankedN = await n();
  await p.keyboard.press('b');
  check('keys do nothing while blank; B unblanks', await p.evaluate(() => document.querySelector('.sd-blank').hidden) && blankedN === (await n()) );

  // Deep link: preset + step from the URL, paused.
  await p.goto(url + '?preset=overflow&step=3');
  await p.waitForFunction(() => window.simdeck);
  check('?preset=overflow&step=3 opens there, paused', (await n()) === 3 && !(await p.evaluate(() => window.simdeck.playing)));
  await ctx.close();
}

// ── theme follows the OS ──
for (const scheme of ['light', 'dark']) {
  const { ctx, p } = await open({ width: 1920, height: 1080 }, '', { colorScheme: scheme });
  check(`OS ${scheme} -> data-theme ${scheme}`, (await p.evaluate(() => document.documentElement.dataset.theme)) === scheme);
  await p.keyboard.press('t');
  check(`T does not override the OS (${scheme})`, (await p.evaluate(() => document.documentElement.dataset.theme)) === scheme);
  await ctx.close();
}

// ── reduced motion ──
{
  const { ctx, p } = await open({ width: 1920, height: 1080 }, '?motion=reduce');
  await p.keyboard.press('ArrowRight');
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.sd-changed') || document.body).animationName);
  check('?motion=reduce disables animation', anim === 'none', anim);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} check(s) failed` : `\nall ${results.length} checks pass`);
process.exit(failed ? 1 : 0);
