// SPDX-License-Identifier: AGPL-3.0-or-later
// The gate (npm run gate -- <id>, scripts/gate.mjs): the template passes, and every rule fails on a sample broken
// for that rule (playbook §6: the gate must be impossible to pass falsely). Each sample is a scratch git repo with a
// sim made by kit/new-sim.sh on a task branch, then broken in one way; the gate runs on it with --root.
// Needs Playwright's Chromium (npx playwright install chromium); without it these tests are skipped, and say so.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GATE = join(ROOT, 'scripts', 'gate.mjs');
const skip = existsSync(chromium.executablePath()) ? false : 'Chromium for Playwright is not installed (npx playwright install chromium)';
const ID = 'gate-x';

function gate(args) {
  return new Promise((done) => {
    const p = spawn(process.execPath, [GATE, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => done({ code, out }));
  });
}

const git = (dir, ...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=gate', '-c', 'user.email=gate@test', ...a], { stdio: 'pipe' });

/**
 * A scratch repo: kit, tags.json and site.json committed on main; a task branch with sims/gate-x from new-sim.sh
 * (untracked, as during work). `edit(files)` changes the sim's files in place: { page, json, model, test, strings }.
 */
function sample(edit = () => {}) {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-gate-test-'));
  for (const f of ['kit', 'tags.json', 'site.json']) cpSync(join(ROOT, f), join(d, f), { recursive: true });
  git(d, 'init', '-q', '-b', 'main');
  git(d, 'add', '.');
  git(d, 'commit', '-q', '-m', 'base');
  git(d, 'checkout', '-q', '-b', 'task');
  execFileSync('bash', [join(d, 'kit', 'new-sim.sh'), ID, join(d, 'sims', ID)], { stdio: 'pipe' });
  const names = { page: 'index.html', json: 'sim.json', model: 'sim.js', test: 'sim.test.js', strings: 'strings.js' };
  const f = (n) => join(d, 'sims', ID, names[n]);
  const files = Object.fromEntries(Object.keys(names).map((k) => [k, readFileSync(f(k), 'utf8')]));
  const before = { ...files };
  edit(files, d);
  for (const k of Object.keys(names)) if (files[k] !== before[k]) writeFileSync(f(k), files[k]);
  return { dir: d, done: () => rmSync(d, { recursive: true, force: true }) };
}

const css = (rule) => (x) => { x.page = x.page.replace('</style>', `${rule}\n</style>`); };
const script = (code) => (x) => { x.page = x.page.replace('</body>', `<script>${code}</script>\n</body>`); };
const json = (over) => (x) => { x.json = JSON.stringify({ ...JSON.parse(x.json), ...over }, null, 2); };
const exceptions = (list) => (x) => { x.page = x.page.replace('id="simdeck-exceptions">[]', `id="simdeck-exceptions">${JSON.stringify(list)}`); };
const all = (...fs) => (x, d) => fs.forEach((f) => f(x, d));

async function run(edit, args = []) {
  const s = sample(edit);
  try {
    return await gate([ID, '--root', s.dir, ...args]);
  } finally {
    s.done();
  }
}

/** The gate fails, with a summary FAIL line under `rule`. */
async function failsOn(rule, edit, label) {
  const r = await run(edit);
  assert.equal(r.code, 1, r.out);
  const fails = r.out.split('\n').filter((l) => l.startsWith('  FAIL ['));
  assert.ok(fails.some((l) => l.startsWith(`  FAIL [${rule}]`)), `expected a FAIL [${rule}]\n${r.out}`);
  if (label) assert.ok(fails.some((l) => label.test(l)), `expected ${label}\n${fails.join('\n')}`);
  return r;
}

describe('gate', { skip, concurrency: 6 }, () => {
  it('the template (proto) passes, with screenshots of both languages', async () => {
    const shots = mkdtempSync(join(tmpdir(), 'simdeck-gate-shots-'));
    try {
      const r = await gate(['proto', '--shots', shots]);
      assert.equal(r.code, 0, r.out);
      assert.match(r.out, /gate: pass/);
      assert.match(r.out, /skipped: proto is the kit's template/);
      const png = readdirSync(shots);
      for (const l of ['hr', 'en']) {
        for (const s of ['1920x1080-light', '1920x1080-dark', '1920x1080-grayscale', '375x812-light']) assert.ok(png.includes(`proto-${l}-${s}.png`), `${l} ${s}: ${png}`);
      }
    } finally {
      rmSync(shots, { recursive: true, force: true });
    }
  });

  it('a fresh sim from new-sim.sh passes, scope included', async () => {
    const r = await run();
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /ok {3}changes since main only under sims\/gate-x\//);
  });

  // ── one bad sample per rule ──
  it('manifest: an invalid sim.json', () => failsOn('manifest', json({ summary: undefined, tag: ['x'] }), /sim.json and the page blocks are valid/));
  it('manifest: an exception for a rule that cannot be waived', () => failsOn('manifest', exceptions([{ rule: 'scope', why: 'x' }]), /cannot be waived/));
  it('max-steps: a stepper over the limit', () => failsOn('max-steps', json({ steps: 21 })));
  it('tests: a failing model test', () => failsOn('tests', (x) => { x.test += "\ntest('broken', () => { require('node:assert').equal(1, 2); });\n"; }));
  it('offline: a script from the network', () => failsOn('offline', (x) => { x.page = x.page.replace('</head>', '<script src="https://example.org/x.js"></script>\n</head>'); }));
  it('kit: a page that never mounts', () => failsOn('kit', (x) => { x.page = x.page.replace('Simdeck.mount({', '({'); }));
  it('one-screen: content taller than the screen', () => failsOn('one-screen', css('body::after { content: ""; display: block; height: 2000px; }'), /no scroll/));
  it('text-size: a caption under 16 px', () => failsOn('text-size', css('[data-sim="gate-x"] .sd-caption { font-size: 0.6rem; }'), /no text under 16 px/));
  it('phone: a minimum width wider than a phone', () => failsOn('phone', css('body { min-width: 600px; }'), /375×812 .*horizontal scroll/));
  it('keys: a page that swallows the clicker\'s →', () => failsOn('keys', script("window.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') e.stopImmediatePropagation(); }, true);"), /key ArrowRight/));
  it('steps: sim.json and the controller disagree', () => failsOn('steps', json({ steps: 12 }), /controller has 12 steps/));
  it('motion: a script animation that ignores reduced motion', () => failsOn('motion', script("document.querySelector('.sd-stage').animate([{ opacity: 1 }, { opacity: 0.5 }], { duration: 100000 });"), /disables animation/));
  it('console: an error in the console', () => failsOn('console', script("console.error('boom');"), /no console errors/));
  it('languages: a string missing in one table', () => failsOn('languages', (x) => { x.strings = x.strings.replace("      legendChanged: 'changed in this step',\n", ''); }, /string tables complete/));
  it('languages: a label typed into the page', () => failsOn('languages', (x) => { x.page = x.page.replace("label: t('places')", "label: 'Težine mjesta'"); }, /every visible word/));
  it('theme: a page that forces its own theme', () => failsOn('theme', script("setInterval(function () { document.documentElement.dataset.theme = 'light'; }, 5);"), /OS dark/));
  it('tokens: an undefined custom property', () => failsOn('tokens', css('[data-sim="gate-x"] .bc { color: var(--nope); }'), /--nope/));
  it('tokens: a colour literal', () => failsOn('tokens', css('[data-sim="gate-x"] .bc { color: #ff0000; }'), /#ff0000/));
  it('scope: a change outside the sim\'s folder, committed or not', async () => {
    await failsOn('scope', (x, d) => { writeFileSync(join(d, 'kit', 'kit.css'), '/* edited */\n', { flag: 'a' }); }, /kit\/kit.css/);
    await failsOn('scope', (x, d) => {
      writeFileSync(join(d, 'tags.json'), readFileSync(join(d, 'tags.json'), 'utf8').replace('{', '{ '));
      git(d, 'commit', '-q', '-am', 'outside');
    }, /tags.json/);
  });

  // ── exceptions ──
  it('a declared exception waives its rule\'s failing checks and is counted; other rules still fail', async () => {
    const tall = css('body::after { content: ""; display: block; height: 2000px; }');
    const r = await run(all(tall, exceptions([{ rule: 'one-screen', why: 'a poster' }])));
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /WAIV 1920×1080 hr light: no scroll .*\(waived: one-screen\)/);
    assert.match(r.out, /gate-x \(stepper\): 1 declared \(one-screen\); \d+ check\(s\) waived \(one-screen \d+\)/);
    assert.match(r.out, /class stepper: 1 exception\(s\) on 1 of 1 sim\(s\)/);
    const r2 = await run(all(tall, css('body { min-width: 600px; }'), exceptions([{ rule: 'one-screen', why: 'a poster' }])));
    assert.equal(r2.code, 1, r2.out);
    assert.match(r2.out, /FAIL \[phone\]/);
    assert.doesNotMatch(r2.out, /FAIL \[one-screen\]/);
  });

  it('an exception that waives nothing is reported as unused', async () => {
    const r = await run(exceptions([{ rule: 'keys', why: 'no reason' }]));
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /unused \(the page follows the rule; drop the exception\): keys/);
  });
});
