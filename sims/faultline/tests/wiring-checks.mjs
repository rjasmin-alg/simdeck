// Node-only: these read source files off disk, which is why tests/checks.html
// does not import this module.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

function walk(dir, out = []) {
  for (const e of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, e);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.m?js$/.test(e)) out.push(rel);
  }
  return out;
}
const jsFiles = () => [...walk('js'), ...walk('tests')];

check('every relative import resolves to a file that exists', () => {
  let n = 0;
  for (const f of jsFiles()) {
    const src = read(f);
    for (const m of src.matchAll(/from\s+'(\.[^']+)'/g)) {
      const target = resolve(ROOT, dirname(f), m[1]);
      assert(existsSync(target), `${f} imports ${m[1]}, which does not exist`);
      n++;
    }
  }
  assert(n > 10, `only ${n} imports found — the matcher is probably broken`);
  return `${n} imports across ${jsFiles().length} files`;
});

check('THE HOUSE RULE: the engine stays pure', () => {
  // js/engine/ is plain data in, plain data out. That is what makes the property
  // checks possible, and the line has to be enforced rather than remembered.
  const banned = ['document.', 'window.', 'localStorage', 'requestAnimationFrame', 'navigator.'];
  for (const f of walk('js/engine')) {
    const src = read(f);
    for (const b of banned) assert(!src.includes(b), `${f} touches ${b}`);
    assert(!/from\s+'\.\.\//.test(src), `${f} imports upward out of the engine`);
  }
  return `${walk('js/engine').length} engine files, all pure`;
});

check('no absolute paths — the site serves from a subdirectory', () => {
  // A single src="/js/..." is a 404 on every page under /faultline. This is the
  // same guard topologydrafter's deploy.sh carries, for the same reason.
  //
  // This file is excluded from its own scan: it necessarily contains the
  // patterns it hunts for, and a checker that fails on its own source teaches
  // you to ignore it.
  const scanned = ['index.html', 'tests/checks.html', ...walk('js')];
  for (const f of scanned) {
    const src = read(f);
    assert(!/(src|href)="\/[^/]/.test(src), `${f} has an absolute src/href`);
    assert(!/from\s+'\/[^/]/.test(src), `${f} imports from an absolute path`);
  }
  return `${scanned.length} shipped files, all relative`;
});

check('every element main.js reaches for exists in index.html', () => {
  const html = read('index.html');
  const src = read('js/main.js');
  const ids = new Set();
  for (const m of src.matchAll(/\$\('#([\w-]+)'\)/g)) ids.add(m[1]);
  for (const id of ids) assert(html.includes(`id="${id}"`), `main.js reaches for #${id}, which is not in index.html`);
  assert(ids.size >= 8, `only ${ids.size} ids found — the matcher is probably broken`);
  return `${ids.size} ids, all present`;
});

check('index.html loads only files that exist', () => {
  const html = read('index.html');
  let n = 0;
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|#|data:)/.test(m[1])) continue;
    if (m[1] === '../../index.html') continue; // simdeck copy: the back link to the site's index, outside this folder
    assert(existsSync(join(ROOT, m[1])), `index.html references ${m[1]}, which does not exist`);
    n++;
  }
  return `${n} local references, all resolve`;
});

check('no runtime network calls anywhere', () => {
  // Inline everything. The point is that it works five minutes before a lecture
  // on a machine nobody prepared.
  for (const f of ['index.html', ...jsFiles()]) {
    const src = read(f);
    for (const b of ['fetch(', 'XMLHttpRequest', 'https://', 'http://']) {
      if (b.startsWith('http') && /^tests\//.test(f)) continue;
      const hits = [...src.matchAll(new RegExp(b.replace(/[().]/g, '\\$&'), 'g'))]
        .filter(() => !/^\s*(\/\/|\*)/.test(src));
      if (!hits.length) continue;
      // Comments and the xmlns literal are fine; a real call is not.
      const real = src.split('\n').filter((l) =>
        l.includes(b) && !l.trim().startsWith('//') && !l.trim().startsWith('*') &&
        !l.includes('xmlns') && !l.includes('127.0.0.1'));
      assert(real.length === 0, `${f} may make a network call: ${real[0]?.trim().slice(0, 60)}`);
    }
  }
  return 'no fetch, no XHR, no remote URLs';
});

check('no debugging leftovers', () => {
  for (const f of walk('js')) {
    const src = read(f);
    for (const b of ['console.log(', 'debugger', 'TODO:', 'XXX']) {
      assert(!src.includes(b), `${f} contains ${b}`);
    }
  }
  return 'js/ is clean';
});

check('every named import actually exists as an export', () => {
  // main.js is the one module node never imports, so a typo'd import there is
  // invisible to every other check and kills boot silently. This closes that
  // hole statically, which is the best available substitute for a browser on a
  // machine where headless Firefox does not run.
  let n = 0;
  for (const f of jsFiles()) {
    const src = read(f);
    for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'(\.[^']+)'/g)) {
      const target = resolve(ROOT, dirname(f), m[2]);
      if (!existsSync(target)) continue;
      const targetSrc = readFileSync(target, 'utf8');
      const exported = new Set();
      for (const e of targetSrc.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([\w$]+)/g)) exported.add(e[1]);
      for (const e of targetSrc.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const name of e[1].split(',')) exported.add(name.trim().split(/\s+as\s+/).pop().trim());
      }
      for (const raw of m[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/)[0].trim();
        if (!name) continue;
        assert(exported.has(name), `${f} imports { ${name} } from ${m[2]}, which does not export it`);
        n++;
      }
    }
  }
  assert(n > 20, `only ${n} named imports checked — the matcher is probably broken`);
  return `${n} named imports, all resolve to real exports`;
});

check('no dependencies, no build step', () => {
  for (const f of ['package.json', 'package-lock.json', 'node_modules', 'vite.config.js']) {
    assert(!existsSync(join(ROOT, f)), `${f} exists — this project has no build step, ever`);
  }
  return 'vanilla ES modules only';
});
