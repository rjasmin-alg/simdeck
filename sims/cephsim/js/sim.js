// SPDX-License-Identifier: AGPL-3.0-or-later
// The clock.
//
// Everything else in this app answers instantly, because CRUSH is a function.
// This is the one part that models the passage of time: you mark an OSD out and
// then you wait, which on a real cluster is most of the experience.
//
// The rule that makes this affordable: **the tick loop never runs CRUSH.** A
// structural change triggers one remap, which produces a target placement; this
// file diffs that against what the disks currently hold and drains the
// difference. Ticking is bookkeeping over a queue and costs microseconds.

import { state, on, emit } from './model.js';
import { Recovery, placementFrom } from './engine/recovery.js';
import { fmtBytes } from './engine/capacity.js';
import { t } from './i18n.js';

export const sim = {
  playing: false,
  speed: 60,            // simulated seconds per real second
  time: 0,              // simulated seconds since the document loaded
  recovery: null,
  placement: null,      // what the disks currently hold
  log: [],
};

const SPEEDS = [1, 10, 60, 600, 3600];
export { SPEEDS };

let raf = null;
let lastFrame = 0;

export function logEvent(text, kind = 'info') {
  sim.log.unshift({ t: sim.time, text, kind });
  if (sim.log.length > 200) sim.log.length = 200;
  emit('sim');
}

/**
 * Point the simulation at a new target layout.
 *
 * Called after every evaluate(). When nothing moved, planRecovery finds no work
 * and this is close to free — which is why editing a pool's stored bytes or
 * renaming a host does not start a phantom backfill.
 */
export function retarget(derived) {
  if (!derived) { sim.recovery = null; return; }
  const wasBusy = sim.recovery && !sim.recovery.done;
  const rec = new Recovery(state.doc, derived.evals, sim.placement, {
    ...state.doc.settings, down: derived.down,
  });
  sim.placement = rec.current;

  if (rec.items.length) {
    if (!wasBusy) {
      logEvent(t('ev.started', { bytes: fmtBytes(rec.totalBytes),
        n: t('ev.copies', { n: rec.items.length }) }), 'start');
    }
    sim.recovery = rec;
  } else {
    if (wasBusy) logEvent(t('ev.complete'), 'done');
    sim.recovery = rec;                    // keeps `current` in sync when idle
  }
  emit('sim');
}

export function play() {
  if (sim.playing) return;
  if (!sim.recovery || sim.recovery.done) return;
  sim.playing = true;
  lastFrame = performance.now();
  loop();
  emit('sim');
}

export function pause() {
  sim.playing = false;
  if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  emit('sim');
}

export function togglePlay() { sim.playing ? pause() : play(); }

/** Advance by a fixed slice of simulated time, paused. */
export function step(seconds = 60) {
  if (!sim.recovery || sim.recovery.done) return;
  advance(seconds);
  emit('sim');
  emit('change');
}

/** Skip the wait entirely — go straight to the settled layout. */
export function skip() {
  if (!sim.recovery || sim.recovery.done) return;
  const bytes = sim.recovery.remainingBytes;
  sim.time += sim.recovery.eta() ?? 0;
  sim.recovery.finish();
  pause();
  logEvent(t('ev.skipped', { bytes: fmtBytes(bytes) }), 'done');
  emit('change');
}

export function setSpeed(v) { sim.speed = v; emit('sim'); }

function advance(seconds) {
  const rec = sim.recovery;
  if (!rec || rec.done) return;
  rec.tick(seconds);
  sim.time += seconds;
  if (rec.done) {
    pause();
    logEvent(t('ev.completeAfter', { d: formatDuration(rec.elapsed) }), 'done');
  }
}

function loop() {
  raf = requestAnimationFrame((now) => {
    raf = null;
    if (!sim.playing) return;
    // Cap the step so a backgrounded tab does not fast-forward an hour at once.
    const real = Math.min(0.25, (now - lastFrame) / 1000);
    lastFrame = now;
    advance(real * sim.speed);
    emit('sim');
    emit('change');
    if (sim.playing) loop();
  });
}

export function formatDuration(s) {
  if (!isFinite(s) || s < 0) return '—';
  if (s < 90) return `${s.toFixed(0)}s`;
  if (s < 5400) return `${(s / 60).toFixed(1)} min`;
  if (s < 172800) return `${(s / 3600).toFixed(1)} h`;
  return `${(s / 86400).toFixed(1)} d`;
}

/** Reset when a different document is loaded. */
export function resetSim() {
  pause();
  sim.time = 0;
  sim.recovery = null;
  sim.placement = null;
  sim.log = [];
}
on('doc-loaded', resetSim);
