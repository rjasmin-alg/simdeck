#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// npm run thumbs: screenshots of the sims for the home page's tiles, into a gitignored cache (.cache/thumbs/).
// Kept out of npm run build, which needs no packages: this one needs Playwright's Chromium. scripts/deploy.sh runs it
// before the build; the build copies the thumbnails that match the sims it builds, and a tile without one shows a
// placeholder in its topic's colour, so a build without this step still works.
//
// Each sim is built (scripts/build.mjs), and its built file's sha256 is the cache key (lib/thumbs.mjs), so only sims
// whose built file changed are shot again. A shot: the built page from file://, every network request blocked,
// 1920×1080, light theme, Croatian, reduced motion; a stepper at step ceil(0.6·steps) (step 0 is often an empty scene);
// cropped to the kit's stage ([data-sd-stage]: the kit's header, panel and transport look the same on every sim), or
// the whole first screen for a page without the kit; then cut to 16:10 from the top left, 560×350, WebP.
//
// Usage: node scripts/thumbs.mjs [--root <repo>] [--cache <dir>] [--drafts] [--only id,id] [--force] [--prune]
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from './build.mjs';
import { thumbKey, cacheDir, THEMES, THUMB_W, THUMB_H } from '../lib/thumbs.mjs';

const META_RE = /<script type="application\/json" id="simdeck-meta">([^<]*)<\/script>/;

/** The query a sim is shot with: the kit reads ?step=, ?theme=, ?motion= and ?lang=. */
export function shotQuery(meta, theme = 'light') {
  const step = meta.class === 'stepper' && meta.steps ? `&step=${Math.ceil(meta.steps * 0.6)}` : '';
  return `?lang=hr&theme=${theme}&motion=reduce${step}`;
}

/**
 * Shoots every built sim in `site` whose thumbnail is not in `cache` yet. Returns { shot, cached, failed, keys }:
 * keys is every cache file name the current build uses.
 */
export async function shoot({ site, cache, only = null, force = false, log = console.log }) {
  const { chromium } = await import('playwright');
  mkdirSync(cache, { recursive: true });
  const ids = readdirSync(join(site, 'sims')).filter((id) => existsSync(join(site, 'sims', id, 'index.html')) && (!only || only.includes(id)));
  const todo = [];
  const keys = new Set();
  let cached = 0;
  for (const id of ids) {
    const file = join(site, 'sims', id, 'index.html');
    const html = readFileSync(file, 'utf8');
    for (const theme of THEMES) {
      const key = thumbKey(html, theme);
      keys.add(key);
      if (!force && existsSync(join(cache, key))) cached += 1;
      else todo.push({ id, theme, file, key, meta: JSON.parse(html.match(META_RE)?.[1] ?? '{}') });
    }
  }
  const failed = [];
  if (!todo.length) return { shot: 0, cached, failed, keys };
  const browser = await chromium.launch();
  try {
    // The WebP is encoded by the browser (canvas.toDataURL), so the step needs nothing but Playwright.
    const encoder = await (await browser.newContext()).newPage();
    for (const theme of THEMES) {
      const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: theme, reducedMotion: 'reduce' });
      await ctx.route(/^(https?|wss?):/, (r) => r.abort());
      for (const t of todo.filter((x) => x.theme === theme)) {
        const t0 = Date.now();
        const page = await ctx.newPage();
        try {
          await page.goto(pathToFileURL(t.file).href + shotQuery(t.meta, theme), { waitUntil: 'load' });
          await page.waitForTimeout(600); // canvases and the first layout pass
          const stage = await page.$('[data-sd-stage]');
          const box = stage && await stage.boundingBox();
          const png = await page.screenshot(box && box.width > 600 && box.height > 300 ? { clip: box } : {});
          const b64 = await encoder.evaluate(async ({ src, w, h }) => {
            const img = new Image();
            img.src = src;
            await img.decode();
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const g = c.getContext('2d');
            g.imageSmoothingQuality = 'high';
            const s = Math.max(w / img.naturalWidth, h / img.naturalHeight); // cover, from the top left
            g.drawImage(img, 0, 0, img.naturalWidth * s, img.naturalHeight * s);
            return c.toDataURL('image/webp', 0.78).split(',')[1];
          }, { src: `data:image/png;base64,${png.toString('base64')}`, w: THUMB_W, h: THUMB_H });
          writeFileSync(join(cache, t.key), Buffer.from(b64, 'base64'));
          log(`  ${t.id} (${theme}) ${Date.now() - t0} ms, ${Math.round(statSync(join(cache, t.key)).size / 1024)} KB`);
        } catch (err) {
          failed.push(`${t.id}: ${err.message.split('\n')[0]}`);
        } finally {
          await page.close();
        }
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  return { shot: todo.length - failed.length, cached, failed, keys };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name, dflt) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? process.argv[i + 1] : dflt;
  };
  const root = resolve(arg('--root', join(dirname(fileURLToPath(import.meta.url)), '..')));
  const cache = resolve(arg('--cache', cacheDir(root)));
  const only = arg('--only', null)?.split(',');
  const t0 = Date.now();
  const tmp = mkdtempSync(join(tmpdir(), 'simdeck-thumbs-'));
  let code = 0;
  try {
    const site = join(tmp, 'site');
    const r = build({ root, out: site, drafts: process.argv.includes('--drafts'), thumbs: cache, log: () => {} });
    if (!r.ok) {
      for (const e of r.errors) console.error(`error: ${e}`);
      throw new Error('the build failed; fix it first (npm run check)');
    }
    const s = await shoot({ site, cache, only, force: process.argv.includes('--force') });
    if (process.argv.includes('--prune') && !only) {
      // Files no current sim uses: earlier builds of sims that changed since.
      const old = readdirSync(cache).filter((f) => f.endsWith('.webp') && !s.keys.has(f));
      for (const f of old) rmSync(join(cache, f));
      if (old.length) console.log(`pruned ${old.length} old thumbnails`);
    }
    for (const f of s.failed) console.error(`error: ${f}`);
    console.log(`thumbnails: ${s.shot} shot, ${s.cached} already cached, ${s.failed.length} failed, ${((Date.now() - t0) / 1000).toFixed(1)} s → ${cache}`);
    code = s.failed.length ? 1 : 0;
  } catch (err) {
    console.error(`thumbs: ${err.message}`);
    if (/Executable doesn't exist|Cannot find (package|module) 'playwright'/.test(err.message)) console.error('install Playwright with npm ci, then npx playwright install chromium');
    code = 1;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  process.exit(code);
}
