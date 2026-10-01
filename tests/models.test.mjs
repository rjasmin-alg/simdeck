// SPDX-License-Identifier: AGPL-3.0-or-later
// Shared models (lib/models.mjs, models/README.md): a valid model passes, every rule fails on a sample broken for it,
// and the build inlines a model a page includes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkModels, listModels, modelProblems, pageModels } from '../lib/models.mjs';
import { loadRepo } from '../lib/manifest.mjs';
import { buildNative } from '../scripts/build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** The shape models/README.md prescribes. */
const MODEL = (name = 'lease', body = 'half: function (n) { return n / 2; }') => `/* SPDX-License-Identifier: AGPL-3.0-or-later
   from sims/x/sim.js @ abc1234 */
(function (root) {
  'use strict';
  var model = { ${body} };
  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['${name}'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
`;

/** A scratch repo with models/<name>.js, its test and a changelog line; `over` replaces or drops (null) files. */
function repo(over = {}) {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-models-'));
  const files = {
    'models/lease.js': MODEL(),
    'models/lease.test.js': '// SPDX-License-Identifier: AGPL-3.0-or-later\n',
    'models/CHANGELOG.md': '- 2026-10-02 `models/lease.js`: promoted from sims/x\n',
    ...over,
  };
  for (const [k, v] of Object.entries(files)) {
    if (v == null) continue;
    mkdirSync(join(d, k, '..'), { recursive: true });
    writeFileSync(join(d, k), v);
  }
  return d;
}

function problems(over, name = 'lease') {
  const d = repo(over);
  try {
    return modelProblems(d, name).join('\n');
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
}

test('a model in the prescribed shape has no problems, and loads both ways', () => {
  assert.equal(problems({}), '');
});

test('every model needs the licence header, its tests and a changelog line', () => {
  assert.match(problems({ 'models/lease.js': MODEL().replace('SPDX-License-Identifier: AGPL-3.0-or-later', '') }), /SPDX/);
  assert.match(problems({ 'models/lease.test.js': null }), /no tests \(models\/lease.test.js\)/);
  assert.match(problems({ 'models/CHANGELOG.md': '- nothing\n' }), /no line in models\/CHANGELOG.md/);
  assert.match(problems({ 'models/CHANGELOG.md': null }), /no line in models\/CHANGELOG.md/);
});

test('a model is pure: no DOM, clock, timers or Math.random (comments may name them)', () => {
  for (const bad of ['now: function () { return Date.now(); }', 'r: function () { return Math.random(); }',
    'el: function () { return document.body; }', 'later: function (f) { setTimeout(f, 1); }']) {
    assert.match(problems({ 'models/lease.js': MODEL('lease', bad) }), /not pure/, bad);
  }
  assert.equal(problems({ 'models/lease.js': MODEL().replace('*/', 'no document, no Date.now() */') }), '');
});

test('a model registers on SimdeckModels under its own name, and exports the same thing to node', () => {
  assert.match(problems({ 'models/lease.js': MODEL('other') }), /must set globalThis.SimdeckModels\["lease"\]/);
  assert.match(problems({ 'models/lease.js': MODEL().replace("if (typeof module === 'object' && module.exports) module.exports = model;\n  else ", '') }),
    /under node it must set module.exports/);
  const differs = MODEL().replace('module.exports = model;', 'module.exports = { other: 1 };');
  assert.match(problems({ 'models/lease.js': differs }), /page global and module.exports differ/);
  assert.match(problems({ 'models/lease.js': 'throw new Error("boom");' }), /fails to load as a page script: boom/);
});

test('model names are lowercase words joined by "-"', () => {
  assert.match(problems({ 'models/Lease_A.js': MODEL('Lease_A') }, 'Lease_A'), /lowercase words/);
});

test('pageModels finds the models a page includes, once each, and nothing else', () => {
  const html = '<script src="../../kit/kit.js"></script><script src="../../models/dhcp-lease.js"></script>'
    + '<script src="sim.js"></script><script src=\'../../models/tcp.js\'></script><script src="../../models/tcp.js"></script>'
    + '<script src="models/local.js"></script>';
  assert.deepEqual(pageModels(html), ['dhcp-lease', 'tcp']);
  assert.deepEqual(pageModels(null), []);
});

test('checkModels: every model checked, and a page that includes a missing model is an error', () => {
  const d = repo({ 'models/bad.js': '/* no header */' });
  try {
    assert.deepEqual(listModels(d), ['bad', 'lease']);
    const natives = [{ dir: 'a', html: '<script src="../../models/lease.js"></script><script src="../../models/gone.js"></script>' }];
    const errs = checkModels(d, natives).join('\n');
    assert.match(errs, /models\/bad.js: no SPDX/);
    assert.doesNotMatch(errs, /models\/lease.js/);
    assert.match(errs, /sims\/a\/index.html: includes models\/gone.js, which does not exist/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('the build inlines a model the page includes, and nothing else outside the sim, kit and models', () => {
  const d = repo();
  try {
    const simDir = join(d, 'sims', 'x');
    mkdirSync(simDir, { recursive: true });
    writeFileSync(join(d, 'secret.js'), 'window.NO = 1;');
    const entry = { id: 'x', title: 'X', concept: 'c', class: 'stepper', steps: 1 };
    const page = (body) => `<!doctype html><html><head></head><body>${body}</body></html>`;
    const r = buildNative(page('<script src="../../models/lease.js"></script>'), entry, { simDir, modelsDir: join(d, 'models') });
    assert.deepEqual(r.errors, []);
    assert.match(r.html, /<script>\/\* \.\.\/\.\.\/models\/lease.js \*\/\n\/\* SPDX/);
    assert.doesNotMatch(r.html, /src="..\/..\/models/);
    const out = buildNative(page('<script src="../../models/../secret.js"></script>'), entry, { simDir, modelsDir: join(d, 'models') });
    assert.match(out.errors.join(), /outside the sim's folder, the kit and models\//);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('the real repository: every model in models/ is valid and every included model exists', () => {
  assert.deepEqual(checkModels(ROOT, loadRepo(ROOT).natives), []);
});
