// SPDX-License-Identifier: AGPL-3.0-or-later
// The published home and course pages switch language in the browser, remember the choice, and link sims in it.
// Skipped without Playwright's Chromium (npx playwright install chromium).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { build } from '../scripts/build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const skip = existsSync(chromium.executablePath()) ? false : 'Chromium for Playwright is not installed (npx playwright install chromium)';

test('home and course pages switch between Croatian and English', { skip }, async () => {
  const out = join(mkdtempSync(join(tmpdir(), 'simdeck-site-')), 'site');
  const browser = await chromium.launch();
  try {
    assert.ok(build({ root: ROOT, out, drafts: true, log: () => {} }).ok);
    const url = (p) => pathToFileURL(join(out, p)).href;
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e)));
    const visible = (text) => p.getByText(text, { exact: true }).first().isVisible();

    await p.goto(url('index.html'));
    assert.equal(await p.evaluate(() => document.documentElement.lang), 'hr');
    assert.ok(await visible('Računalne mreže'));
    assert.ok(!(await visible('Computer networks')));
    assert.equal(await p.getAttribute('#q', 'placeholder'), 'Traži simulator… ( / )');

    await p.click('[data-lang-switch]');
    assert.equal(await p.evaluate(() => document.documentElement.lang), 'en');
    assert.ok(await visible('Computer networks'));
    assert.ok(!(await visible('Računalne mreže')));
    assert.equal(await p.getAttribute('#q', 'placeholder'), 'Find a simulator… ( / )');
    assert.match(await p.getAttribute('a[href*="sims/dhcp-dora"]', 'href'), /\?lang=en$/, 'sim links follow the switch');
    await p.fill('#q', 'name resolution');
    assert.ok(await visible('DNS: name resolution'), 'search in English');

    // The choice carries over to a course page, whose own default is Croatian.
    await p.goto(url('courses/linux-essentials/index.html'));
    assert.equal(await p.evaluate(() => document.documentElement.lang), 'en');
    assert.ok(await visible('Networking'));
    assert.match(await p.getAttribute('a[href*="sims/dhcp-dora"]', 'href'), /\?lang=en$/);
    await p.click('[data-lang-switch]');
    assert.equal(await p.evaluate(() => document.documentElement.lang), 'hr');
    assert.ok(await visible('Mreža'));
    assert.match(await p.getAttribute('a[href*="sims/dhcp-dora"]', 'href'), /\?lang=hr$/);

    // A new visitor gets the course's default; ?lang= overrides it.
    const fresh = await (await browser.newContext()).newPage();
    await fresh.goto(url('courses/linux-essentials/index.html'));
    assert.equal(await fresh.evaluate(() => document.documentElement.lang), 'hr');
    await fresh.goto(`${url('courses/linux-essentials/index.html')}?lang=en`);
    assert.equal(await fresh.evaluate(() => document.documentElement.lang), 'en');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    rmSync(dirname(out), { recursive: true, force: true });
  }
});
