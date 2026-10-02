#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// The per-task gate: every contract rule (docs/tasks/COMMON.md §3, lib/contract.mjs RULES) checked on one sim.
//   npm run gate -- <id> [--shots <dir>] [--base <ref>] [--root <dir>]
//
//  1. manifest   sim.json and the page's blocks (lib/manifest.mjs), and at most MAX_STEPS steps
//  2. tests      node --test sims/<id>/sim.test.js, and models/<name>.test.js of every shared model the page includes
//  3. build      the sim alone, as one self-contained file in a temp folder (the build refuses network loads)
//  4. browser    kit/tools/check-page.mjs on the built file, from file:// with every request blocked; for an adopted
//                page that waives `kit` (lib/contract.mjs kitWaived), scripts/check-adopted.mjs: the checks that
//                need no window.simdeck, and the kit-only ones reported as waived
//  5. tokens     every var(--x) in the built page is defined; no colour literals in the page's own CSS
//  6. scope      git diff --name-only --no-renames <base>...HEAD (and untracked files) only under sims/<id>/
//  7. exceptions declared in the page waive the matching check; counted per rule, and per class over the repo
//  8. shots      1920×1080 light, dark, grayscale and 375×812, per language, into --shots (default: the temp folder)
//
// The template's id, proto, gates kit/template: copied into a scratch repo with kit/new-sim.sh as sims/proto, as
// every new sim starts. It has no scope check (kit/ is the coordinator's, not a sim task).
// The temp folder derives from the checkout's path (lib/contract.mjs gateDir), so gates in parallel worktrees
// never collide; the browser check opens files, no ports.
import { spawnSync, execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepo, validate, pageExceptions, languagesOf } from '../lib/manifest.mjs';
import { buildNative } from './build.mjs';
import { MODELS_DIR, modelProblems, pageModels } from '../lib/models.mjs';
import { MAX_STEPS, RULES, applyExceptions, colourLiterals, exceptionProblems, gateDir, kitWaived, outsideScope, pageCss, undefinedVars } from '../lib/contract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
export const TEMPLATE_ID = 'proto';

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
const id = argv.find((a, i) => !a.startsWith('--') && !['--shots', '--base', '--root'].includes(argv[i - 1]));
if (!id) { console.error('usage: npm run gate -- <id> [--shots <dir>] [--base <ref>] [--root <dir>]'); process.exit(2); }
const checkout = realpathSync(resolve(opt('--root', REPO)));
const base = opt('--base', 'main');
const work = gateDir(checkout, id);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
const shots = resolve(opt('--shots', join(work, 'shots')));

const results = []; // { step, rule, label, ok, detail }
const record = (step, rule, label, ok, detail = '') => {
  results.push({ step, rule, label, ok: !!ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
};
const head = (s) => console.log(`\n── gate: ${s} ${'─'.repeat(Math.max(0, 50 - s.length))}`);

// ── the sim's root: the checkout, or for the template a scratch repo with sims/proto made by new-sim.sh ──
let root = checkout;
if (id === TEMPLATE_ID && !existsSync(join(checkout, 'sims', id))) {
  root = join(work, 'repo');
  mkdirSync(root, { recursive: true });
  for (const f of ['kit', 'tags.json', 'site.json']) cpSync(join(checkout, f), join(root, f), { recursive: true });
  const r = spawnSync('bash', [join(root, 'kit', 'new-sim.sh'), id, join(root, 'sims', id)], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout + r.stderr); process.exit(1); }
  console.log(`template: kit/template copied to ${join(root, 'sims', id)} with kit/new-sim.sh`);
}
const simDir = join(root, 'sims', id);
const where = `sims/${id}/`;

// ── 1. manifest ──
head('manifest');
const repo = loadRepo(root);
const v = validate(repo);
const entry = v.entries.find((e) => e.id === id);
const mine = (m) => m.includes(where) || m.startsWith(`${id}:`) || m === `duplicate id "${id}"`;
if (!existsSync(simDir)) record('manifest', 'manifest', `${where} exists`, false);
const errs = v.errors.filter(mine);
record('manifest', 'manifest', 'sim.json and the page blocks are valid', errs.length === 0 && entry, errs.join('; '));
for (const w of v.warnings.filter(mine)) console.log(`     warning: ${w}`);
const html = repo.natives.find((n) => n.dir === id)?.html ?? '';
const exceptions = pageExceptions(html) ?? [];
const adopted = { adopted: !!entry?.origin };
const probs = exceptionProblems(exceptions, adopted);
record('manifest', 'manifest', 'declared exceptions name waivable rules', probs.length === 0, probs.join('; '));
const used = pageModels(html);
for (const m of used) {
  const p = modelProblems(root, m);
  record('manifest', 'manifest', `shared model ${MODELS_DIR}/${m}.js is valid`, p.length === 0, p.join('; '));
}
if (entry?.class === 'stepper') record('manifest', 'max-steps', `at most ${MAX_STEPS} steps`, entry.steps <= MAX_STEPS, `${entry.steps} steps`);

// ── 2. tests ──
head('tests');
{
  // Without NODE_TEST_CONTEXT: a gate run under node --test would otherwise make this child report to that runner
  // and exit 0 whatever its tests do.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const runTests = (file, label) => {
    const r = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', cwd: root, env });
    const summary = (r.stdout.match(/^ℹ (tests|pass|fail) \d+$/gm) || []).map((s) => s.slice(2)).join(', ');
    if (r.status !== 0) console.log((r.stdout + r.stderr).split('\n').filter((l) => /✖|Error|assert/i.test(l)).slice(0, 15).join('\n'));
    record('tests', 'tests', label, r.status === 0, summary);
  };
  const file = join(simDir, 'sim.test.js');
  if (!existsSync(file)) record('tests', 'tests', `${where}sim.test.js exists`, false);
  else runTests(file, 'model tests pass');
  // A shared model's own tests run too: the sim depends on its rules (its absence is a manifest failure above).
  for (const m of used) {
    const t = join(root, MODELS_DIR, `${m}.test.js`);
    if (existsSync(t)) runTests(t, `shared model ${MODELS_DIR}/${m}.js: its tests pass`);
  }
}

// ── 3. build ──
head('build');
const built = join(work, 'site', 'sims', id, 'index.html');
let builtHtml = null;
if (entry && html) {
  const r = buildNative(html, entry, { simDir, kitDir: join(root, 'kit'), modelsDir: join(root, MODELS_DIR) });
  record('build', 'offline', 'one self-contained file, nothing from the network', r.errors.length === 0, r.errors.join('; '));
  if (!r.errors.length) {
    mkdirSync(dirname(built), { recursive: true });
    writeFileSync(built, r.html);
    builtHtml = r.html;
    console.log(`     ${built}`);
  }
} else record('build', 'offline', 'the sim builds', false, 'no valid sim.json or index.html');

// ── 4. browser ──
head('browser');
if (builtHtml) {
  const json = join(work, 'check-page.json');
  const tool = kitWaived(entry, exceptions) ? join(REPO, 'scripts', 'check-adopted.mjs') : join(REPO, 'kit', 'tools', 'check-page.mjs');
  if (kitWaived(entry, exceptions)) console.log(`     adopted page (origin ${entry.origin}) without the kit: scripts/check-adopted.mjs`);
  const r = spawnSync(process.execPath, [tool, built, '--shots', shots, '--json', json], { encoding: 'utf8', timeout: 300000 });
  const out = `${r.stdout}${r.stderr}`;
  const lines = out.split('\n').filter((l) => /^(FAIL|WAIV) /.test(l));
  console.log(lines.length ? lines.join('\n') : out.trim().split('\n').slice(-1)[0]);
  if (existsSync(json)) {
    for (const c of JSON.parse(readFileSync(json, 'utf8')).results) results.push({ step: 'browser', ...c, quiet: true });
  } else record('browser', 'kit', 'the browser check ran', false, out.slice(-400));
  console.log(`     screenshots: ${shots}`);
} else record('browser', 'kit', 'the browser check ran', false, 'nothing built');

// ── 5. tokens ──
head('tokens');
if (builtHtml) {
  const undef = undefinedVars([builtHtml]);
  record('tokens', 'tokens', 'every var(--x) is defined', undef.length === 0, undef.join(', '));
}
const lits = colourLiterals(pageCss(html));
record('tokens', 'tokens', 'no colour literals in the page\'s CSS (kit tokens only)', lits.length === 0, lits.slice(0, 5).join('; '));

// ── 6. scope ──
head('scope');
if (root !== checkout) console.log(`     skipped: ${id} is the kit's template, not a sim task`);
else {
  const git = (...a) => execFileSync('git', ['-C', checkout, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    const changed = [
      ...git('diff', '--name-only', '--no-renames', `${base}...HEAD`).split('\n'),
      ...git('diff', '--name-only', '--no-renames', 'HEAD').split('\n'), // uncommitted, staged or not
      ...git('ls-files', '--others', '--exclude-standard').split('\n'),
    ].filter(Boolean);
    const outside = outsideScope(changed, where);
    record('scope', 'scope', `changes since ${base} only under ${where}`, outside.length === 0, outside.slice(0, 10).join(', ') + (outside.length > 10 ? ` (+${outside.length - 10})` : ''));
  } catch (e) {
    record('scope', 'scope', `changes since ${base} only under ${where}`, false, `git: ${String(e.stderr || e.message).trim().split('\n')[0]}`);
  }
}

// ── 7. exceptions ──
head('exceptions');
const ex = applyExceptions(results, exceptions, adopted);
const single = entry && entry.languages ? 1 : 0; // the single-language exception lives in sim.json (COMMON.md §4)
const nWaived = Object.values(ex.waived).reduce((a, b) => a + b, 0);
console.log(`     ${id} (${entry?.class ?? '?'}): ${exceptions.length + single} declared${exceptions.length ? ` (${exceptions.map((x) => x.rule).join(', ')})` : ''}${single ? `${exceptions.length ? ',' : ''} single language ${languagesOf(entry).join('')}` : ''}; ${nWaived} check(s) waived${nWaived ? ` (${Object.entries(ex.waived).map(([k, n]) => `${k} ${n}`).join(', ')})` : ''}`);
if (ex.unused.length) console.log(`     unused (the page follows the rule; drop the exception): ${ex.unused.join(', ')}`);
// The rethink signal is a rising count within a class (playbook §10.4): the repo's totals per class.
const perClass = {};
for (const n of (root === checkout ? repo : loadRepo(checkout)).natives) {
  if (!n.json?.class) continue;
  const c = (perClass[n.json.class] ??= { sims: 0, withExc: 0, exc: 0 });
  const k = (pageExceptions(n.html) ?? []).length + (n.json.languages ? 1 : 0);
  c.sims += 1; c.exc += k; c.withExc += k ? 1 : 0;
}
for (const [c, s] of Object.entries(perClass)) console.log(`     class ${c}: ${s.exc} exception(s) on ${s.withExc} of ${s.sims} sim(s)`);

// ── summary ──
console.log('\n── gate summary ─────────────────────────────────────────');
const steps = ['manifest', 'tests', 'build', 'browser', 'tokens', 'scope'];
for (const s of steps) {
  const mineR = ex.results.filter((r) => r.step === s);
  if (!mineR.length) { console.log(`  skipped ${s}`); continue; }
  const failed = mineR.filter((r) => !r.ok && !r.waived).length;
  const waived = mineR.filter((r) => r.waived).length;
  console.log(`  ${failed ? 'FAILED ' : 'OK     '} ${s.padEnd(9)} ${mineR.length - failed - waived}/${mineR.length} ok${waived ? `, ${waived} waived` : ''}${failed ? `, ${failed} failed` : ''}`);
}
for (const r of ex.failed) console.log(`  FAIL [${r.rule}] ${r.label}${r.detail ? '  ' + String(r.detail).slice(0, 160) : ''}`);
console.log(`  sim: ${id} · rules: ${Object.keys(RULES).length} · screenshots: ${shots}`);
console.log(ex.failed.length ? `\ngate: ${ex.failed.length} check(s) failed` : '\ngate: pass');
process.exit(ex.failed.length ? 1 : 0);
