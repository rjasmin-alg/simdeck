// SPDX-License-Identifier: AGPL-3.0-or-later
// Preset entries end to end (docs/tasks/w0/presets-in-index.md): a sim's sim.json "entries" are listed on the
// published home page, a course file names one as "<sim>#<preset>", and its link opens the built sim paused at that
// preset. The sim is the kit's template, made with kit/new-sim.sh in a scratch repo, as every new sim starts.
// Skipped without Playwright's Chromium (npx playwright install chromium).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { build } from '../scripts/build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const skip = existsSync(chromium.executablePath()) ? false : 'Chromium for Playwright is not installed (npx playwright install chromium)';
const two = (hr, en) => ({ hr, en });

test('a course page lists a preset entry, and its link opens the sim paused at that preset', { skip }, async () => {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-presets-'));
  const root = join(d, 'repo');
  const out = join(d, 'site');
  const browser = await chromium.launch();
  try {
    mkdirSync(root);
    for (const f of ['kit', 'tags.json', 'site.json', 'LICENSE']) cpSync(join(ROOT, f), join(root, f), { recursive: true });
    execFileSync('bash', [join(root, 'kit', 'new-sim.sh'), 'demo', join(root, 'sims', 'demo')], { stdio: 'pipe' });
    // What a preset task adds to its host's sim.json, and nothing else.
    const simJson = join(root, 'sims', 'demo', 'sim.json');
    const sim = JSON.parse(readFileSync(simJson, 'utf8'));
    sim.status = 'ready';
    sim.entries = [{ preset: 'carry', title: two('Prijenos', 'Carry'), concept: two('Prijenos kroz mjesta', 'A carry ripples through the places') }];
    writeFileSync(simJson, JSON.stringify(sim, null, 2));
    mkdirSync(join(root, 'courses'));
    writeFileSync(join(root, 'courses', 'demo.json'), JSON.stringify({ id: 'demo', title: two('Kolegij', 'Course'), lang: 'en', sections: [{ sims: ['demo#carry'] }] }));
    const r = build({ root, out, log: () => {} });
    assert.ok(r.ok, r.errors.join('\n'));

    const p = await (await browser.newContext()).newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e)));
    const url = (f) => pathToFileURL(join(out, f)).href;

    // The home page lists the entry as its own line under its sim, and the search finds it.
    await p.goto(url('index.html'));
    assert.equal(await p.locator('li.h-preset a[href*="sims/demo/index.html?preset=carry"]').count(), 1);
    await p.fill('#q', 'carry');
    assert.ok(await p.locator('li.h-preset').isVisible());

    // The course page lists it; following the link opens the sim at the preset, paused, in the course's language.
    await p.goto(url('courses/demo/index.html'));
    const link = p.locator('li.h-preset a');
    assert.equal(await link.count(), 1);
    assert.equal(await link.innerText(), 'Carry', 'shown in the course language');
    await link.click();
    await p.waitForFunction(() => window.simdeck);
    assert.deepEqual(await p.evaluate(() => ({ preset: window.simdeck.preset, playing: window.simdeck.playing, n: window.simdeck.n, lang: document.documentElement.lang })),
      { preset: 'carry', playing: false, n: 0, lang: 'en' });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    rmSync(d, { recursive: true, force: true });
  }
});
