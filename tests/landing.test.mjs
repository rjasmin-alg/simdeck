// SPDX-License-Identifier: AGPL-3.0-or-later
// The published home page in a browser, built from this repo: the first screen at 1920×1080 (light and dark) and on a
// phone, search, the topic chips, a selection of five, the lecture view and its keys, the handout as one A4 page, and
// the way back from a sim to the lecture set (from file://, which has no referrer, and over http, which has one).
// Thumbnails come from the repo's cache when npm run thumbs has filled it; without them tiles show placeholders.
// SIMDECK_SHOTS=<dir> also saves a screenshot of each view there (and the handout's PDF).
// Skipped without Playwright's Chromium (npx playwright install chromium).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { build } from '../scripts/build.mjs';
import { cacheDir } from '../lib/thumbs.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const skip = existsSync(chromium.executablePath()) ? false : 'Chromium for Playwright is not installed (npx playwright install chromium)';
const SHOTS = process.env.SIMDECK_SHOTS ? resolve(process.env.SIMDECK_SHOTS) : null;
// Five ready sims for the selection: four kit sims and the lecturer's tool (which stays off the handout).
const FIVE = ['vlan', 'nat', 'routing-table', 'amdahl', 'student-picker'];

let out, browser, server, http;
before(async () => {
  if (skip) return;
  out = join(mkdtempSync(join(tmpdir(), 'simdeck-landing-')), 'site');
  assert.ok(build({ root: ROOT, out, log: () => {}, thumbs: cacheDir(ROOT) }).ok);
  browser = await chromium.launch();
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  const types = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' };
  server = createServer((req, res) => {
    const p = join(out, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(out) || !existsSync(p)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(readFileSync(p));
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  http = `http://127.0.0.1:${server.address().port}/`;
});
after(async () => {
  await browser?.close();
  server?.close();
  if (out) rmSync(dirname(out), { recursive: true, force: true });
});

const home = () => pathToFileURL(join(out, 'index.html')).href;
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce', ...opts });
  await ctx.route(/^(https?|wss?):\/\/(?!127\.0\.0\.1)/, (r) => r.abort()); // offline, but for the test's own server
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return { ctx, page, errors };
}
const shot = (page, name, o = {}) => (SHOTS ? page.screenshot({ path: join(SHOTS, `${name}.png`), ...o }) : null);
const visibleIds = (page) => page.$$eval('.tile:not([hidden])', (ts) => ts.map((t) => t.dataset.id));

test('home at 1920×1080: search, the chips and the first shelf on the first screen, light and dark', { skip }, async () => {
  for (const colorScheme of ['light', 'dark']) {
    const { ctx, page, errors } = await open({ colorScheme });
    await page.goto(home());
    await page.waitForLoadState('load');
    const box = (sel) => page.locator(sel).first().boundingBox();
    assert.ok((await box('#q')).y + (await box('#q')).height < 1080);
    assert.ok((await box('#chips')).y + (await box('#chips')).height < 1080);
    const shelf = page.locator('.topic').first();
    const tiles = await shelf.locator('.tile').evaluateAll((ts) => ts.map((t) => t.getBoundingClientRect().bottom));
    assert.ok(tiles.every((b) => b <= 1080), `first shelf's tiles end at ${tiles.join(', ')}`);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'q', 'search focused on load');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, colorScheme === 'dark' ? 'rgb(13, 22, 38)' : 'rgb(251, 250, 246)', 'the kit\'s --bg, following the OS');
    assert.equal(await page.locator('.tray').isVisible(), false, 'no selection bar while nothing is picked');
    assert.doesNotMatch(await page.content(), /courses\//, 'no course names or links on the home page');
    await shot(page, `home-1920-${colorScheme}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test('home on a phone (390 wide): one column, chips scroll sideways, no sideways page scroll', { skip }, async () => {
  const { ctx, page, errors } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(home());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  const cols = await page.$eval('.grid', (g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
  assert.equal(cols, 1);
  assert.ok(await page.$eval('#chips', (c) => c.scrollWidth > c.clientWidth && getComputedStyle(c).overflowX === 'auto'));
  await shot(page, 'home-390-light');
  // The selection bar collapses to its title and main button until opened.
  await page.locator('.tile[data-id="vlan"] > .pick').click();
  await page.locator('.tile[data-id="nat"] > .pick').click();
  assert.ok(await page.locator('[data-tray-act="lecture"]').isVisible());
  assert.equal(await page.locator('[data-tray-act="copy"]').isVisible(), false);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await shot(page, 'home-390-selection');
  await page.locator('.tray-title').click();
  assert.ok(await page.locator('[data-tray-act="copy"]').isVisible());
  assert.equal(await page.locator('#tray-list li').count(), 2);
  await shot(page, 'home-390-selection-open');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('search: live, in both languages, folded; Enter opens the first hit; a preset chip is found by its own name', { skip }, async () => {
  const { ctx, page, errors } = await open();
  await page.goto(home());
  const all = (await visibleIds(page)).length;
  await page.keyboard.type('prijevod');
  assert.deepEqual(await visibleIds(page), ['nat']);
  assert.match(await page.textContent('#shown'), new RegExp(`^1 / ${all}$`));
  assert.equal(await page.locator('.topic:not([hidden])').count(), 1, 'empty shelves are hidden');
  await page.fill('#q', 'ORMARA');
  assert.ok((await visibleIds(page)).includes('cephsim'), 'a preset\'s title finds its sim');
  assert.deepEqual(await page.$$eval('.tile[data-id="cephsim"] .preset.hit', (p) => p.map((x) => x.dataset.id)), ['cephsim#three-racks'], 'and marks the preset');
  await page.fill('#q', 'neuravnotezeni');
  assert.ok(await page.locator('.preset.hit[data-id="cephsim#unbalanced"]').isVisible(), 'a preset behind "+N" is shown when it matches');
  await page.fill('#q', 'zzzz');
  assert.ok(await page.locator('#none').isVisible());
  await page.keyboard.press('Escape');
  assert.equal((await visibleIds(page)).length, all);
  // English, and "/" focuses the box again from anywhere.
  await page.locator('[data-lang-switch]').click();
  await page.locator('h1').click();
  await page.keyboard.press('/');
  await page.keyboard.type('translation table');
  assert.ok((await visibleIds(page)).includes('nat'));
  await shot(page, 'home-1920-en-search');
  await page.keyboard.press('Enter');
  await page.waitForURL(/sims\/nat\/index\.html\?lang=en$/, { timeout: 5000 }); // the title hit, not the first on the page
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('topic chips: one per shelf with its count, a jump to the shelf, the shelf in view marked', { skip }, async () => {
  const { ctx, page, errors } = await open();
  await page.goto(home());
  const shelves = await page.$$eval('.topic', (s) => s.map((x) => [x.dataset.topic, x.querySelectorAll('.tile').length]));
  const chips = await page.$$eval('[data-chip]', (c) => c.map((x) => [x.dataset.chip, Number(x.querySelector('small').textContent)]));
  assert.deepEqual(chips, shelves);
  await page.locator('[data-chip="radio"]').click();
  await page.waitForFunction(() => document.querySelector('[data-chip="radio"]').classList.contains('here'));
  const top = await page.$eval('#t-radio', (s) => s.getBoundingClientRect().top);
  const bar = await page.$eval('.bar', (b) => b.getBoundingClientRect().bottom);
  assert.ok(top >= bar - 2 && top < 500, `the radio shelf starts under the sticky bar (${top}, bar ${bar})`);
  await shot(page, 'home-1920-chip-radio');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('a selection of five → lecture view: agenda, preview, keys; Enter opens the sim, and its back link returns to the set', { skip }, async () => {
  const { ctx, page, errors } = await open();
  let copied = null;
  await ctx.exposeFunction('copied', (t) => { copied = t; });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t) => { window.copied(t); return Promise.resolve(); } } }); });
  await page.goto(home());
  for (const id of FIVE) await page.locator(`.tile[data-id="${id}"] > .pick`).click();
  assert.equal(await page.textContent('#tray-n'), '5');
  assert.equal(await page.locator('.tile.picked').count(), 5);
  assert.equal(await page.locator(`.tile[data-id="vlan"] > .pick`).getAttribute('aria-pressed'), 'true');
  // Reorder: nat up to the front; the selection survives a reload (localStorage).
  await page.locator('.tray-title').click();
  await page.locator('#tray-list li[data-id="nat"] [data-move="-1"]').click();
  await page.reload();
  assert.equal(await page.textContent('#tray-n'), '5');
  await page.locator('.tray-title').click();
  assert.deepEqual(await page.$$eval('#tray-list li', (l) => l.map((x) => x.dataset.id)), ['nat', 'vlan', 'routing-table', 'amdahl', 'student-picker']);
  await shot(page, 'home-1920-selection-open');
  await page.locator('[data-tray-act="copy"]').click();
  await page.waitForFunction(() => document.getElementById('toast').classList.contains('on'));
  assert.equal(copied, 'https://materijali.online/simdeck/?set=nat,vlan,routing-table,amdahl,student-picker');
  await page.locator('[data-tray-act="lecture"]').click();
  await page.waitForURL(/index\.html\?set=nat,vlan,routing-table,amdahl,student-picker/);

  // The lecture view: numbered agenda, the current one big.
  assert.equal(await page.locator('.lt').count(), 5);
  assert.equal(await page.locator('#home').count(), 0);
  const cur = () => page.$eval('.lt.cur', (a) => Number(a.dataset.i) + 1);
  const stage = () => page.locator('#lt-stage strong').innerText();
  assert.equal(await cur(), 1);
  assert.equal(await stage(), 'NAT: tablica prijevoda');
  await page.keyboard.press('ArrowRight');
  assert.equal(await cur(), 2);
  assert.equal(await stage(), 'VLAN');
  await page.keyboard.press('PageDown');
  assert.equal(await cur(), 3);
  await page.keyboard.press('PageUp');
  assert.equal(await cur(), 2);
  await page.keyboard.press('5');
  assert.equal(await cur(), 5);
  await page.keyboard.press('ArrowRight');
  assert.equal(await cur(), 5, 'stops at the end');
  await page.keyboard.press('1');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await cur(), 1, 'stops at the start');
  await page.keyboard.press('3');
  assert.match(page.url(), /#3$/, 'the current one is in the hash');
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight), true, 'one screen');
  await shot(page, 'lecture-1920-light');

  // Enter opens the sim; the kit's "← Popis" comes back to the set at the same sim (file:// has no referrer).
  await page.keyboard.press('Enter');
  await page.waitForURL(/sims\/routing-table\/index\.html\?lang=hr$/);
  await page.locator('[data-sd-back]').click();
  await page.waitForURL(/index\.html\?set=.*#3$/);
  await page.waitForSelector('.lt.cur');
  assert.equal(await cur(), 3);
  // "← Svi simulatori" leaves the set: home again, and a sim's back link goes home from now on.
  await page.locator('.set-head .back').click();
  await page.waitForSelector('#list');
  await page.locator('.tile[data-id="vlan"] .tile-link').click();
  await page.waitForURL(/sims\/vlan\//);
  assert.match(await page.getAttribute('[data-sd-back]', 'href'), /^\.\.\/\.\.\/index\.html\?lang=hr$/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('lecture view in dark, in English, and on a phone', { skip }, async () => {
  const set = `${home()}?set=nat,vlan,routing-table,amdahl,student-picker,nope#2`;
  const { ctx, page, errors } = await open({ colorScheme: 'dark' });
  await page.goto(set);
  assert.match(await page.textContent('.skipped'), /nope/, 'an unknown id is named, not hidden');
  await shot(page, 'lecture-1920-dark');
  await page.keyboard.press('l');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.equal(await page.locator('#lt-stage strong').innerText(), 'VLAN');
  assert.match(page.url(), /lang=en/);
  await shot(page, 'lecture-1920-dark-en');
  await ctx.close();
  const phone = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await phone.page.goto(set);
  assert.equal(await phone.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await shot(phone.page, 'lecture-390-light');
  await phone.ctx.close();
  assert.deepEqual([...errors, ...phone.errors], []);
});

test('handout: the set as one A4 page, tools left off it', { skip }, async () => {
  const { ctx, page, errors } = await open();
  await page.goto(`${home()}?set=nat,vlan,routing-table,amdahl,student-picker`);
  await page.keyboard.press('p');
  await page.waitForURL(/print=1/);
  assert.equal(await page.locator('.handout li').count(), 4, 'four sims; the student picker is a tool');
  assert.match(await page.textContent('.h-left'), /Slučajni odabir studenta|student/i);
  assert.match(await page.textContent('.h-url'), /materijali\.online\/simdeck\/\?set=nat,vlan,routing-table,amdahl,student-picker/);
  assert.match(await page.textContent('.handout li:first-child .h-link'), /materijali\.online\/simdeck\/sims\/nat\//);
  await shot(page, 'handout-screen', { fullPage: true });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  assert.equal(pages, 1, `the handout prints on ${pages} pages`);
  if (SHOTS) writeFileSync(join(SHOTS, 'handout.pdf'), pdf);
  // Printing the lecture view prints the handout too.
  await page.setViewportSize({ width: 794, height: 1123 }); // A4 at 96 dpi
  await page.goto(`${home()}?set=nat,vlan,routing-table,amdahl,student-picker`);
  await page.emulateMedia({ media: 'print' });
  assert.ok(await page.locator('.handout').isVisible());
  assert.equal(await page.locator('.lecture').isVisible(), false);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, 'handout-print-a4.png') });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('over http, the back link goes back in history to the set (the referrer is the index with ?set=)', { skip }, async () => {
  const { ctx, page, errors } = await open();
  await page.goto(`${http}index.html?set=vlan,nat,amdahl`);
  await page.keyboard.press('2');
  await page.keyboard.press('Enter');
  await page.waitForURL(/sims\/nat\//);
  assert.match(await page.evaluate(() => document.referrer), /index\.html\?set=vlan,nat,amdahl/);
  await page.locator('[data-sd-back]').click();
  await page.waitForURL(/index\.html\?set=vlan,nat,amdahl(&lang=hr)?#2$/);
  await page.waitForSelector('.lt.cur');
  assert.equal(await page.$eval('.lt.cur', (a) => a.dataset.i), '1');
  assert.deepEqual(errors, []);
  await ctx.close();
});
