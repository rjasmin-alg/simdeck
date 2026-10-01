// Contrast report for the kit palette (WCAG 2.x relative luminance). Run: node kit/tools/contrast.mjs
// Reads the token blocks from kit.css, so the report always describes the shipped values.
// Exits 1 if any required pair is under its threshold.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../kit.css', import.meta.url), 'utf8');
const block = (marker) => {
  const i = css.indexOf(marker);
  if (i < 0) throw new Error(`marker not found: ${marker}`);
  const body = css.slice(i, css.indexOf('/* end tokens */', i));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
};
const themes = { light: block('/* tokens:light */'), dark: block('/* tokens:dark */') };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// A washed-out projector lifts black and compresses the range; model it as mixing 25 % grey into every colour.
const wash = (hex) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.75 + 0x80 * 0.25)
  .toString(16).padStart(2, '0')).join('');

const SERIES = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8'];
// [fg, bg, minimum, why]
const pairs = [
  ['--ink', '--bg', 7, 'body text'], ['--ink', '--panel', 7, 'panel text'], ['--muted', '--bg', 4.5, 'secondary text'],
  ['--muted', '--panel', 4.5, 'secondary text on panel'], ['--accent', '--bg', 4.5, 'links, primary button'],
  ['--on-accent', '--accent', 4.5, 'text on primary button'], ['--line', '--bg', 3, 'control borders (non-text)'],
  ['--on-hl', '--hl', 7, 'text on highlight'], ['--focus', '--bg', 3, 'focus ring (non-text)'],
  ...SERIES.flatMap((c) => [[c, '--bg', 4.5, 'series as text/line'], ['--on-series', c, 4.5, 'label on series fill']]),
];

let failed = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name}`);
  for (const [fg, bg, min, why] of pairs) {
    if (!t[fg] || !t[bg]) { console.log(`  MISSING ${fg} or ${bg}`); failed++; continue; }
    const r = ratio(t[fg], t[bg]);
    const w = ratio(wash(t[fg]), wash(t[bg]));
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${fg.padEnd(11)} on ${bg.padEnd(8)} ${r.toFixed(2).padStart(5)} (washed ${w.toFixed(2).padStart(5)}) >= ${min}  ${why}`);
  }
}
if (failed) { console.log(`\n${failed} pair(s) below threshold`); process.exit(1); }
console.log('\nall pairs pass');
