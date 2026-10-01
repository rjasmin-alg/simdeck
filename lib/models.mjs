// SPDX-License-Identifier: AGPL-3.0-or-later
// Shared models (models/README.md, docs/tasks/COMMON.md §6): pure model code that several sims use. Each one is
// models/<name>.js, a classic script that registers on globalThis.SimdeckModels[<name>] in a page and is
// module.exports under node, with its tests in models/<name>.test.js. A page includes it as
// <script src="../../models/<name>.js"></script>, so it runs unbuilt from file://; the build inlines it like the kit.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';

export const MODELS_DIR = 'models';
export const GLOBAL = 'SimdeckModels';
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// A model is pure: no DOM, no browser storage, no clock, no unseeded randomness, no timers (the template's rule).
const IMPURE = /\b(document|window|localStorage|sessionStorage|navigator|Date|setTimeout|setInterval|requestAnimationFrame)\b|Math\.random/;

/** Names of the shared models a page includes (<script src="../../models/<name>.js">), in page order. */
export function pageModels(html) {
  const re = /<script\b[^>]*\bsrc\s*=\s*["']\.\.\/\.\.\/models\/([^"'/?#]+)\.js["'][^>]*>/gi;
  return [...new Set([...(html ?? '').matchAll(re)].map((m) => m[1]))];
}

/** The model files in models/ (not their tests), by name. */
export function listModels(root) {
  const dir = join(root, MODELS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.js') && !f.endsWith('.test.js')).map((f) => f.slice(0, -3)).sort();
}

/** Code without comments, for the purity scan (string contents stay; a model has no reason to name the DOM there). */
function code(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

/**
 * Problems with one model: its name, licence header, tests, purity, changelog line, and that it loads both ways
 * (a page's global and node's require) to the same shape. Returns a list of messages, empty when it is fine.
 */
export function modelProblems(root, name, changelog = null) {
  const out = [];
  const rel = `${MODELS_DIR}/${name}.js`;
  const file = join(root, MODELS_DIR, `${name}.js`);
  if (!NAME_RE.test(name)) out.push(`${rel}: the name must be lowercase words joined by "-"`);
  if (!existsSync(file)) return [...out, `${rel}: not found`];
  const src = readFileSync(file, 'utf8');
  if (!/SPDX-License-Identifier:\s*AGPL-3\.0-or-later/.test(src.slice(0, 400))) out.push(`${rel}: no SPDX-License-Identifier: AGPL-3.0-or-later header`);
  if (!existsSync(join(root, MODELS_DIR, `${name}.test.js`))) out.push(`${rel}: no tests (${MODELS_DIR}/${name}.test.js)`);
  const impure = code(src).match(IMPURE);
  if (impure) out.push(`${rel}: not pure, uses "${impure[0]}" (no DOM, clock, timers or Math.random in a model)`);
  const log = changelog ?? (existsSync(join(root, MODELS_DIR, 'CHANGELOG.md')) ? readFileSync(join(root, MODELS_DIR, 'CHANGELOG.md'), 'utf8') : '');
  if (!log.includes(`\`${rel}\``) && !log.includes(`\`${name}\``)) out.push(`${rel}: no line in ${MODELS_DIR}/CHANGELOG.md`);

  // As a page loads it: a classic script in a context with no module, no DOM.
  let paged;
  try {
    const ctx = vm.createContext({});
    vm.runInContext(src, ctx, { filename: rel, timeout: 2000 });
    paged = ctx[GLOBAL]?.[name];
    if (paged == null || typeof paged !== 'object') out.push(`${rel}: as a page script it must set globalThis.${GLOBAL}["${name}"]`);
  } catch (e) {
    out.push(`${rel}: fails to load as a page script: ${e.message}`);
  }
  // As node tests load it.
  try {
    const required = createRequire(file)(file);
    if (required == null || typeof required !== 'object' || !Object.keys(required).length) out.push(`${rel}: under node it must set module.exports to the model`);
    else if (paged && Object.keys(required).sort().join() !== Object.keys(paged).sort().join()) {
      out.push(`${rel}: the page global and module.exports differ`);
    }
  } catch (e) {
    out.push(`${rel}: fails to load under node: ${e.message}`);
  }
  return out;
}

/**
 * Every model in models/, checked, and every model a sim page includes exists. `natives` is loadRepo(root).natives.
 * Returns error messages.
 */
export function checkModels(root, natives = []) {
  const log = existsSync(join(root, MODELS_DIR, 'CHANGELOG.md')) ? readFileSync(join(root, MODELS_DIR, 'CHANGELOG.md'), 'utf8') : '';
  const have = listModels(root);
  const out = have.flatMap((name) => modelProblems(root, name, log));
  for (const n of natives) {
    for (const m of pageModels(n.html)) if (!have.includes(m)) out.push(`sims/${n.dir}/index.html: includes ${MODELS_DIR}/${m}.js, which does not exist`);
  }
  return out;
}
