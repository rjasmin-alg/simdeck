// The Console tab: the commands you would actually type, with their real output.
//
// Read-only on purpose. This is not a shell — there is nothing to configure and
// nothing to break. It exists so that what a student sees here is what they will
// see on a cluster, rather than a prettier abstraction they then have to unlearn.

import { state, on } from './model.js';
import { COMMANDS, runCommand } from './console-cmds.js';
import { sim } from './sim.js';

let root = null;
let current = 'status';

export function initConsole(el) {
  root = el;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cmd]');
    if (btn) { current = btn.dataset.cmd; renderConsole(); return; }
    if (e.target.closest('[data-copy]')) copyOut();
  });
  on('change', () => { if (state.tab === 'console') renderConsole(); });
  on('sim', () => { if (state.tab === 'console') renderConsole(); });
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderConsole() {
  if (!root) return;
  const cmd = COMMANDS.find((c) => c.id === current) || COMMANDS[0];
  // The live recovery figures belong in `ceph -s`, so hand them over.
  const derived = state.derived
    ? { ...state.derived,
        recovery: sim.recovery,
        live: sim.recovery && !sim.recovery.done
          ? sim.recovery.liveCounts(state.derived.evals) : null }
    : null;
  const body = runCommand(cmd.id, state.doc, derived);
  root.innerHTML = `
    <div class="cmd-bar">${COMMANDS.map((c) =>
      `<button class="cmd${c.id === current ? ' on' : ''}" data-cmd="${c.id}"
        >${esc(c.cmd)}</button>`).join('')}
      <span class="spacer"></span>
      <button data-copy="1" title="Copy this output">Copy</button></div>
    <pre class="cmd-out" id="cmd-out">$ ${esc(cmd.cmd)}\n${esc(body)}</pre>`;
}

async function copyOut() {
  const text = root.querySelector('#cmd-out')?.textContent ?? '';
  try { await navigator.clipboard.writeText(text); } catch { /* no clipboard */ }
}
