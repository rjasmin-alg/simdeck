// Static wiring checks. Node-only: these read the source files, so they cannot
// run in the browser page like the other check modules.
//
// They catch the class of bug that importing a module does not: a $('#typo')
// that resolves to null at boot, an import path that no file answers, a
// data-act the inspector emits but never handles, and — the one that would
// break the deployment — an absolute path in a site served from a subdirectory.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
/** Every page in the repo, so adding one cannot slip past the deploy guard. */
function htmlFiles() {
  const out = [];
  for (const dir of ['.', 'tests']) {
    for (const f of readdirSync(join(ROOT, dir))) {
      if (f.endsWith('.html')) out.push(dir === '.' ? f : join(dir, f));
    }
  }
  return out;
}

function jsFiles(dir = 'js', acc = []) {
  for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (e.isDirectory()) jsFiles(join(dir, e.name), acc);
    else if (e.name.endsWith('.js')) acc.push(join(dir, e.name));
  }
  return acc;
}

check('every import resolves to a file that exists', () => {
  const files = [...jsFiles(), ...readdirSync(join(ROOT, 'tests'))
    .filter((f) => f.endsWith('.js') || f.endsWith('.mjs')).map((f) => join('tests', f))];
  let n = 0;
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/(?:^|\s)(?:import|export)[^;]*?from\s+'(\.[^']+)'/g)) {
      const target = resolve(ROOT, dirname(f), m[1]);
      assert(existsSync(target), `${f} imports ${m[1]}, which does not exist`);
      n++;
    }
    for (const m of src.matchAll(/import\('(\.[^']+)'\)/g)) {
      assert(existsSync(resolve(ROOT, dirname(f), m[1])), `${f} dynamically imports missing ${m[1]}`);
      n++;
    }
  }
  return `${n} imports across ${files.length} files`;
});

check('every element the app reaches for exists in index.html', () => {
  const html = read('index.html');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const missing = [];
  let n = 0;
  for (const f of jsFiles()) {
    // Only document-scoped lookups. `svg.querySelector('#cs-world')` searches
    // markup the renderer built itself and has nothing to do with index.html.
    const src = read(f);
    const lookups = [
      ...src.matchAll(/(?<![.\w])\$\(\s*'#([\w-]+)'\s*\)/g),
      ...src.matchAll(/document\.querySelector\(\s*'#([\w-]+)'\s*\)/g),
      // bind() swallows a missing element on purpose, so a typo there is silent
      // — which makes it the most important case to check statically.
      ...src.matchAll(/\bbind\(\s*'#([\w-]+)'/g),
    ];
    for (const m of lookups) {
      n++;
      if (!ids.has(m[1])) missing.push(`${f}: #${m[1]}`);
    }
  }
  assert(!missing.length, `not in index.html — ${missing.join(', ')}`);
  assert(n > 25, `only found ${n} lookups — the matcher has probably stopped working`);
  return `${n} lookups, all resolved`;
});

check('index.html loads only files that exist', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
    .filter((u) => !/^(https?:|data:|#|mailto:)/.test(u));
  for (const u of refs) assert(existsSync(join(ROOT, u)), `index.html references missing ${u}`);
  return refs.join(', ');
});

check('no absolute paths anywhere — the site is served from a subdirectory', () => {
  // The same guard scripts/deploy.sh carries. A single absolute src of /js/...
  // is a 404 on every page under materijali.online/ceph/.
  //
  // Note the wording: this comment must not itself contain the pattern the
  // deploy script greps for, or deploying would refuse on its own test file.
  const bad = [];
  for (const f of [...htmlFiles(), ...jsFiles()]) {
    const src = read(f);
    for (const m of src.matchAll(/(?:src|href)="(\/[^/][^"]*)"/g)) bad.push(`${f}: ${m[1]}`);
    for (const m of src.matchAll(/from\s+'(\/[^']+)'/g)) bad.push(`${f}: import ${m[1]}`);
  }
  assert(!bad.length, bad.join(', '));
  return `${htmlFiles().join(', ')} and all modules are relative`;
});

check('every data-act the inspector emits is handled', () => {
  const src = read('js/inspector.js');
  const emitted = new Set([
    ...[...src.matchAll(/data-act="([\w-]+)"/g)].map((m) => m[1]),
    // toggle() builds its own data-act from the second argument.
    ...[...src.matchAll(/toggle\('[^']*',\s*'([\w-]+)'/g)].map((m) => m[1]),
  ]);
  const handled = new Set([...src.matchAll(/case '([\w-]+)':/g)].map((m) => m[1]));
  const orphans = [...emitted].filter((a) => !handled.has(a));
  assert(!orphans.length, `emitted but never handled: ${orphans.join(', ')}`);
  const unused = [...handled].filter((a) => !emitted.has(a));
  assert(!unused.length, `handled but never emitted: ${unused.join(', ')}`);
  return `${emitted.size} actions, all round-trip`;
});

check('every toolbar tool button maps to a real tool', () => {
  const html = read('index.html');
  const tools = [...html.matchAll(/data-tool="(\w+)"/g)].map((m) => m[1]);
  const known = ['select', 'link', 'pan'];
  for (const t of tools) assert(known.includes(t), `index.html offers an unknown tool "${t}"`);
  assert(tools.length === known.length, `${tools.length} buttons for ${known.length} tools`);
  const interact = read('js/interact.js');
  for (const t of known) assert(interact.includes(`'${t}'`), `interact.js never checks for "${t}"`);
  return tools.join(', ');
});

check('every sample offered in the picker exists', () => {
  const main = read('js/main.js');
  assert(main.includes("makeSample('threeRacks')"), 'the boot sample is not one of the samples');
  const samples = read('js/samples.js');
  const keys = [...samples.matchAll(/^  (\w+): \{ label:/gm)].map((m) => m[1]);
  assert(keys.length >= 3, `only ${keys.length} samples defined`);
  for (const k of keys) assert(samples.includes(`make: `), `sample ${k} has no maker`);
  return keys.join(', ');
});

check('no debugging leftovers', () => {
  const bad = [];
  for (const f of jsFiles()) {
    const src = read(f);
    for (const pat of [/console\.log\(/, /\bdebugger\b/, /TODO:/, /XXX/]) {
      if (pat.test(src)) bad.push(`${f}: ${pat.source}`);
    }
  }
  assert(!bad.length, bad.join(', '));
  return `${jsFiles().length} modules clean`;
});

check('every tab maps to a pane that exists', () => {
  const html = read('index.html');
  const main = read('js/main.js');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const tabs = [...html.matchAll(/data-tab="(\w+)"/g)].map((m) => m[1]);
  // PANES uses computed selectors, so the "$('#id')" matcher cannot see them.
  const panes = Object.fromEntries(
    [...main.matchAll(/^\s*(\w+): '#([\w-]+)',$/gm)].map((m) => [m[1], m[2]]));
  assert(Object.keys(panes).length >= 4, `found ${Object.keys(panes).length} panes in PANES`);
  for (const t of tabs) {
    assert(panes[t], `tab "${t}" has no entry in PANES`);
    assert(ids.has(panes[t]), `pane #${panes[t]} for tab "${t}" is not in index.html`);
  }
  for (const key of Object.keys(panes)) {
    assert(tabs.includes(key), `PANES has "${key}" but no tab offers it`);
  }
  const paneEls = [...html.matchAll(/class="pane"[^>]*id="([\w-]+)"|id="([\w-]+)"[^>]*class="pane"/g)]
    .map((m) => m[1] || m[2]);
  for (const id of Object.values(panes)) {
    assert(paneEls.includes(id), `#${id} is a pane target but is not marked class="pane"`);
  }
  return `${tabs.join(', ')}`;
});

check('every pane action the toolbar emits is handled', () => {
  const main = read('js/main.js');
  const emitted = new Set([...main.matchAll(/data-pane-act="([\w-]+)"/g)].map((m) => m[1]));
  // The switch is on btn.dataset.paneAct; collect its cases from that block.
  const block = main.slice(main.indexOf('btn.dataset.paneAct'));
  const handled = new Set([...block.matchAll(/case '([\w-]+)':/g)].map((m) => m[1]));
  const orphans = [...emitted].filter((a) => !handled.has(a));
  assert(!orphans.length, `emitted but never handled: ${orphans.join(', ')}`);
  assert(emitted.size >= 5, `only ${emitted.size} pane actions found`);
  return `${emitted.size} actions: ${[...emitted].join(', ')}`;
});

check('the CRUSH map sheet is fully wired', () => {
  const html = read('index.html');
  const main = read('js/main.js');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  for (const id of ['sheet', 'sheet-title', 'sheet-hint', 'sheet-text', 'sheet-err',
                    'sheet-copy', 'sheet-cancel', 'sheet-apply']) {
    assert(ids.has(id), `index.html has no #${id}`);
    assert(main.includes(`#${id}`), `main.js never touches #${id}`);
  }
  return '8 sheet elements, all present and used';
});

check('every timeline control is handled', () => {
  const tl = read('js/timeline.js');
  const emitted = new Set([...tl.matchAll(/data-sim="([\w-]+)"/g)].map((m) => m[1]));
  const handled = new Set([...tl.matchAll(/case '([\w-]+)':/g)].map((m) => m[1]));
  handled.add('speed');                       // handled in the change listener
  const orphans = [...emitted].filter((a) => !handled.has(a));
  assert(!orphans.length, `emitted but never handled: ${orphans.join(', ')}`);
  assert(emitted.has('play') && emitted.has('skip'), 'play or skip is missing');
  return [...emitted].join(', ');
});

check('the tick loop never runs CRUSH', () => {
  // The one architectural rule. A remap is ~200 ms at 600 OSDs; the animation
  // loop must only ever drain a queue.
  const sim = read('js/sim.js');
  const rec = read('js/engine/recovery.js');
  for (const [file, src] of [['sim.js', sim], ['recovery.js', rec]]) {
    for (const banned of ['doRule', 'evaluatePool', 'mapPool', 'compileMap', 'getMap']) {
      assert(!src.includes(banned), `${file} calls ${banned} — that belongs to the remap, not the tick`);
    }
  }
  assert(sim.includes('requestAnimationFrame'), 'sim.js has no frame loop');
  return 'sim.js and recovery.js touch no placement code';
});

check('the engine stays free of the DOM and of the app layer', () => {
  // js/engine/ is pure: plain data in, plain data out. That is what makes the
  // property checks possible, and it is easy to break by accident.
  for (const f of jsFiles('js/engine')) {
    const src = read(f);
    for (const banned of ['document.', 'window.', 'localStorage', 'requestAnimationFrame']) {
      assert(!src.includes(banned), `${f} touches ${banned}`);
    }
    for (const m of src.matchAll(/from\s+'(\.[^']+)'/g)) {
      assert(!m[1].startsWith('../'), `${f} imports ${m[1]} from outside the engine`);
    }
  }
  return `${jsFiles('js/engine').length} engine modules are pure`;
});
