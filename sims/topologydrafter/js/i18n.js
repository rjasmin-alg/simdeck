// SPDX-License-Identifier: AGPL-3.0-or-later
// Languages (simdeck copy): every visible string comes from strings.js ({ hr, en }, loaded before app.js as
// window.SimStrings). The language is chosen as the simdeck kit does (docs/sim-ui.md §9): ?lang=hr|en, else the
// visitor's last choice on any simdeck page, else <html lang>. Switching stores the choice and reloads with ?lang=.

const LANGS = ['hr', 'en'];
const LANG_KEY = 'simdeck.lang';

function table() { return globalThis.SimStrings || {}; }

function detect() {
  if (typeof location === 'undefined') return 'en';
  let stored = null;
  try { stored = localStorage.getItem(LANG_KEY); } catch { /* storage off: ?lang= still works */ }
  const page = (document.documentElement.lang || 'hr').slice(0, 2).toLowerCase();
  return [new URLSearchParams(location.search).get('lang'), stored, page]
    .find((l) => LANGS.includes(l)) || 'hr';
}

let current = detect();

export function lang() { return current; }

/** For tests: switch the language without a page. */
export function useLang(l) { current = l; }

// hr: 1 / 2–4 / 5+ (11–14 take the third), en: 1 / other.
function pluralIndex(n) {
  const a = Math.abs(n);
  if (current !== 'hr') return a === 1 ? 0 : 1;
  if (a % 10 === 1 && a % 100 !== 11) return 0;
  if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 12 || a % 100 > 14)) return 1;
  return 2;
}

/** The string in the current language, {placeholders} filled; an array is plural forms picked by vars.n. */
export function t(key, vars = {}) {
  let v = table()[current]?.[key];
  if (v === undefined) {
    console.error(`[topologydrafter] missing string "${key}" (${current})`);
    return key;
  }
  if (Array.isArray(v)) v = v[Math.min(v.length - 1, pluralIndex(vars.n ?? 0))];
  return v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Fill the static markup: data-t (text), data-t-title, data-t-label (aria-label), data-t-placeholder. */
export function applyStatic(root = document) {
  document.documentElement.lang = current;
  for (const el of root.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  for (const el of root.querySelectorAll('[data-t-title]')) el.title = t(el.dataset.tTitle);
  for (const el of root.querySelectorAll('[data-t-label]')) el.setAttribute('aria-label', t(el.dataset.tLabel));
  for (const el of root.querySelectorAll('[data-t-placeholder]')) el.placeholder = t(el.dataset.tPlaceholder);
}

/** Store the other language and reload with ?lang=, keeping `params` (or the current query). */
export function switchLang(params = new URLSearchParams(location.search)) {
  const next = current === 'hr' ? 'en' : 'hr';
  try { localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ }
  params.set('lang', next);
  location.search = params.toString();
}
