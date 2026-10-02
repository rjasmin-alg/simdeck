// Terminal runner for the checks. `node tests/run.mjs`
//
// Same checks as tests/crush.html, printed instead of painted. Exits non-zero on
// failure so it can gate a commit. The page is the one to open when you want to
// look at something; this is the one to run when you want an answer.

import { results as engine } from './engine-checks.js';
import { results as model } from './model-checks.js';
import { results as view } from './view-checks.js';
import { results as text } from './crushtext-checks.js';
import { results as net } from './net-checks.js';
import { results as recovery } from './recovery-checks.js';
import { results as clients } from './client-checks.js';
// Node-only: reads source files, so it has no browser-page equivalent.
import { results as wiring } from './wiring-checks.mjs';

const groups = [
  ['engine', engine],
  ['model + compiler', model],
  ['geometry + samples', view],
  ['crushtool text format', text],
  ['network + health', net],
  ['recovery', recovery],
  ['clients + console', clients],
  ['wiring (node only)', wiring],
];
let total = 0, failed = 0;
for (const [title, results] of groups) {
  console.log(`\n--- ${title} ---`);
  for (const r of results) {
    console.log(`${r.pass ? '  ok  ' : ' FAIL '} ${r.name}${r.detail ? `\n         ${r.detail}` : ''}`);
    total++;
    if (!r.pass) failed++;
  }
}
console.log(failed ? `\n${failed} of ${total} checks FAILED` : `\nall ${total} checks passed`);
process.exit(failed ? 1 : 0);
