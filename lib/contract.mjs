// SPDX-License-Identifier: AGPL-3.0-or-later
// The contract (docs/tasks/COMMON.md §3) as named rules, and the pure parts of its checks. The gate
// (scripts/gate.mjs) and the browser checks (kit/tools/check-page.mjs; scripts/check-adopted.mjs for adopted pages
// without the kit) report every check under one of these rule ids, and a page waives a check by declaring its rule
// in #simdeck-exceptions ([{ "rule", "why" }]).
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Rule id → what it checks. `waivable: false` rules cannot be declared as exceptions; `waivable: 'adopted'` ones
 * only on an adopted page (sim.json `origin` set), such as an ossimulator build that has its own runtime.
 */
export const RULES = {
  manifest: { waivable: false, what: 'sim.json is valid (lib/manifest.mjs)' },
  tests: { waivable: false, what: 'the model tests pass (sims/<id>/sim.test.js)' },
  offline: { waivable: false, what: 'the built single file loads nothing from the network' },
  scope: { waivable: false, what: 'the branch changes only the sim\'s folder' },
  kit: { waivable: 'adopted', what: 'the page mounts the kit (window.simdeck, kit marker); waivable only on adopted pages' },
  entries: { waivable: false, what: 'every sim.json preset entry opens the page paused at its preset' },
  'one-screen': { waivable: true, what: 'one screen at 1920×1080, no page or panel scroll' },
  'text-size': { waivable: true, what: 'body text ≥ 20 px and nothing under 16 px at 1920×1080 (14 px on a phone)' },
  phone: { waivable: true, what: 'no horizontal scroll at 375×812' },
  keys: { waivable: true, what: 'clicker keys move the step counter (steppers)' },
  steps: { waivable: true, what: 'the controller\'s step count equals sim.json steps' },
  'max-steps': { waivable: true, what: 'a stepper has at most MAX_STEPS (20) steps' },
  motion: { waivable: true, what: 'reduced motion (?motion=reduce and the OS setting) stops every animation' },
  console: { waivable: true, what: 'no console errors or warnings' },
  languages: { waivable: true, what: 'both languages: tables complete, every visible word from the tables, L switches' },
  theme: { waivable: true, what: 'the theme follows the OS' },
  tokens: { waivable: true, what: 'every var(--x) is defined; no colour literals in the page\'s CSS' },
};
export const MAX_STEPS = 20;

/** An adopted page that declares `kit`: the gate checks it with scripts/check-adopted.mjs, not the kit's check. */
export function kitWaived(entry, exceptions) {
  return !!entry?.origin && (exceptions ?? []).some((x) => x.rule === 'kit');
}

/** Whether a page may waive `rule`: `adopted` is true when its sim.json has `origin`. */
export function canWaive(rule, { adopted = false } = {}) {
  const w = RULES[rule]?.waivable;
  return w === true || (w === 'adopted' && adopted);
}

/** Problems with a page's declared exceptions: unknown rules, rules that cannot be waived (here), duplicates. */
export function exceptionProblems(exceptions, { adopted = false } = {}) {
  const out = [];
  const seen = new Set();
  for (const x of exceptions ?? []) {
    if (!(x.rule in RULES)) out.push(`unknown rule "${x.rule}" (rules: ${Object.keys(RULES).join(', ')})`);
    else if (RULES[x.rule].waivable === 'adopted' && !adopted) out.push(`rule "${x.rule}" can be waived only on an adopted page (sim.json "origin")`);
    else if (!RULES[x.rule].waivable) out.push(`rule "${x.rule}" cannot be waived`);
    if (seen.has(x.rule)) out.push(`rule "${x.rule}" declared twice`);
    seen.add(x.rule);
  }
  return out;
}

/**
 * Applies declared exceptions to check results ({ rule, ok, ... }): a failing check whose rule is declared becomes
 * waived. Returns { results, failed, waived: { rule: count }, unused: [rule] } — unused are declared rules that
 * waived nothing (the page follows the rule after all; drop the exception). `adopted` as for canWaive.
 */
export function applyExceptions(results, exceptions, { adopted = false } = {}) {
  const declared = new Set((exceptions ?? []).filter((x) => canWaive(x.rule, { adopted })).map((x) => x.rule));
  const waived = {};
  const out = results.map((r) => {
    if (r.ok || !declared.has(r.rule)) return r;
    waived[r.rule] = (waived[r.rule] ?? 0) + 1;
    return { ...r, waived: true };
  });
  return {
    results: out,
    failed: out.filter((r) => !r.ok && !r.waived),
    waived,
    unused: [...declared].filter((r) => !(r in waived)),
  };
}

/** Custom properties used with var(--x) but never defined (in CSS, or set from script as '--x': …). */
export function undefinedVars(sources) {
  const all = sources.join('\n');
  const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const m of all.matchAll(/['"](--[\w-]+)['"]\s*[:,]/g)) defined.add(m[1]); // style: { '--x': … }, setProperty('--x', …)
  return [...new Set([...all.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((v) => !defined.has(v));
}

/** The CSS of a page's own <style> blocks (the kit's stylesheet is linked, not inline, in the source page). */
export function pageCss(html) {
  return [...(html ?? '').matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
}

/**
 * Colour literals in CSS declarations (hex, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color()): colour
 * comes only from kit tokens. Selectors and url(#…) references are ignored.
 */
export function colourLiterals(css) {
  const out = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)) {
    const value = m[2].replace(/url\([^)]*\)/g, '');
    const hit = value.match(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i);
    if (hit) out.push(`${m[1]}: ${m[2].trim()}`);
  }
  return out;
}

/** Changed paths outside the allowed folder (prefix ends with "/"). */
export function outsideScope(changed, allowed) {
  return [...new Set(changed.filter(Boolean))].filter((f) => !f.startsWith(allowed)).sort();
}

/**
 * The gate's working folder for one sim, derived from the checkout's path: two worktrees gating the same sim at the
 * same time never share a folder.
 */
export function gateDir(root, id) {
  const h = createHash('sha256').update(root).digest('hex').slice(0, 10);
  return join(tmpdir(), `simdeck-gate-${h}`, id);
}
