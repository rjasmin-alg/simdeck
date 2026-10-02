// SPDX-License-Identifier: AGPL-3.0-or-later
// The recovery timeline strip: play, pause, step, and what is happening.

import { state, on } from './model.js';
import {
  sim, SPEEDS, play, pause, togglePlay, step, skip, setSpeed, formatDuration,
} from './sim.js';
import { fmtBytes } from './engine/capacity.js';
import { t } from './i18n.js';

let root = null;

export function initTimeline(el) {
  root = el;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sim]');
    if (!btn) return;
    switch (btn.dataset.sim) {
      case 'play': togglePlay(); break;
      case 'step': step(60); break;
      case 'step-long': step(600); break;
      case 'skip': skip(); break;
      default: break;
    }
  });
  root.addEventListener('change', (e) => {
    if (e.target.dataset.sim === 'speed') setSpeed(Number(e.target.value));
  });
  on('sim', render);
  on('change', render);
  render();
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function render() {
  if (!root) return;
  const rec = sim.recovery;
  const busy = rec && !rec.done;
  const counts = rec && state.derived ? rec.liveCounts(state.derived.evals) : null;
  const speeds = SPEEDS.map((v) =>
    `<option value="${v}" ${v === sim.speed ? 'selected' : ''}>${
      v === 1 ? t('tl.realTime') : t('tl.perSec', { d: formatDuration(v) })}</option>`).join('');

  const pct = busy ? rec.progress * 100 : (rec ? 100 : 0);
  const eta = busy ? rec.eta() : null;

  root.innerHTML = `
    <button data-sim="play" ${busy ? '' : 'disabled'} title="${t('tl.playTitle')}"
      >${sim.playing ? t('tl.pause') : t('tl.play')}</button>
    <button data-sim="step" ${busy ? '' : 'disabled'} title="${t('tl.stepTitle')}">${t('tl.step')}</button>
    <button data-sim="step-long" ${busy ? '' : 'disabled'} title="${t('tl.stepLongTitle')}">${t('tl.stepLong')}</button>
    <button data-sim="skip" ${busy ? '' : 'disabled'} title="${t('tl.skipTitle')}">${t('tl.skip')}</button>
    <select data-sim="speed" aria-label="${t('tl.speed')}">${speeds}</select>
    <div class="tl-bar" role="progressbar" aria-valuenow="${pct.toFixed(0)}"
      ><div class="tl-fill${busy ? ' busy' : ''}" style="width:${pct.toFixed(1)}%"></div></div>
    <span class="tl-text mono">${
      busy
        ? t('tl.busy', { moved: fmtBytes(rec.movedBytes), total: fmtBytes(rec.totalBytes),
          rate: fmtBytes(rec.currentRate()), eta: formatDuration(eta ?? Infinity) })
        : rec && rec.totalBytes
          ? t('tl.settled', { total: fmtBytes(rec.totalBytes), d: formatDuration(rec.elapsed) })
          : t('tl.idle')
    }</span>
    <span class="spacer"></span>
    ${counts ? `<span class="tl-text mono">${t('tl.clean', { n: counts.clean })}`
      + (counts.degraded ? ` · <b class="warn">${t('tl.degraded', { n: counts.degraded })}</b>` : '')
      + (counts.misplaced ? ` · ${t('tl.backfilling', { n: counts.misplaced })}` : '')
      + (counts.inactive ? ` · <b class="err">${t('tl.inactive', { n: counts.inactive })}</b>` : '')
      + `</span>` : ''}
    <span class="tl-text mono">t+${formatDuration(sim.time)}</span>`;
}

/** The most recent events, for the inspector's cluster panel. */
export function recentEvents(n = 6) {
  return sim.log.slice(0, n).map((e) =>
    `<li><span class="ev-t">t+${formatDuration(e.t)}</span> ${esc(e.text)}</li>`).join('');
}
