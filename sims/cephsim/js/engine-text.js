// SPDX-License-Identifier: AGPL-3.0-or-later
// simdeck copy: the engine (js/engine/) stays English and DOM-free, and its checks pin its wording. What it
// *explains* (health check detail lines, why a client is down) is shown in the page's language by matching each
// line against the `eng.*` templates of the English table and rewriting it with the same key in the current one.
// Ceph's own words (check names, the one-line summaries, the Console tab) are never passed through here.
// A line no template matches is shown as the engine wrote it; sim.test.js keeps that from happening silently.

import { lang, t } from './i18n.js';

let patterns = null;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The eng.* English templates as anchored regexes, the most literal text first so `pool {pool}: {n} pgs
 *  degraded` wins over `pool {pool}: {why}`. */
function build() {
  const en = globalThis.SimStrings?.en || {};
  return Object.keys(en).filter((k) => k.startsWith('eng.')).map((key) => {
    const tpl = en[key];
    const names = [];
    const src = tpl.split(/(\{\w+\})/).map((part) => {
      const m = /^\{(\w+)\}$/.exec(part);
      if (!m) return escapeRe(part);
      names.push(m[1]);
      // A value (a number, a pool or host name) never holds a colon; a {why} is a whole sentence of its own. So
      // `metadata pool: 3 of 8 pgs below min_size 2` is metaPool around pgsBelowMin, not pgsBelowMin alone.
      return m[1] === 'why' ? '(.+)' : '([^:]+?)';
    }).join('');
    return { key, names, re: new RegExp(`^${src}$`), literal: tpl.replace(/\{\w+\}/g, '').length };
  }).sort((a, b) => b.literal - a.literal);
}

/** `line` in the current language: matched against the English templates, `why` translated in turn. */
export function engineText(line) {
  if (lang() === 'en' || typeof line !== 'string') return line;
  patterns ??= build();
  for (const p of patterns) {
    const m = p.re.exec(line);
    if (!m) continue;
    const vars = {};
    p.names.forEach((n, i) => { vars[n] = n === 'why' ? engineText(m[i + 1]) : m[i + 1]; });
    return t(p.key, vars);
  }
  return line;
}

/** True when `line` is one of the engine's known sentences (for tests). */
export function isKnownEngineText(line) {
  patterns ??= build();
  return patterns.some((p) => p.re.test(line));
}
