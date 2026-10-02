// node tests/run.mjs — the working path on this machine.
//
// The checks live as DOM-free data that both this file and tests/checks.html
// import, so the terminal and the browser cannot drift apart. This one is the
// primary path and the only one that runs the wiring group, which reads source
// files from disk.
//
// The RenderCompositorSWGL hang that made the browser page unrunnable was not a
// Firefox fault: headless needs a virtual display, and it needs a profile that
// has already been initialised. scripts/shot.sh supplies both.

// simdeck copy: the page's strings first (js/i18n.js reads globalThis.SimStrings); in node the language is English.
import '../strings.js';
import { results as engine } from './engine-checks.js';
import { results as view } from './view-checks.js';
import { results as wiring } from './wiring-checks.mjs';

const groups = [['engine', engine], ['view', view], ['wiring', wiring]];

let failed = 0;
let total = 0;
for (const [title, list] of groups) {
  console.log('\n' + title);
  for (const r of list) {
    total++;
    if (!r.pass) failed++;
    const tag = r.pass ? '  ok  ' : ' FAIL ';
    console.log(`${tag} ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  }
}

console.log(`\n${total - failed}/${total} passed${failed ? `, ${failed} failed` : ''}`);
process.exit(failed ? 1 : 0);
