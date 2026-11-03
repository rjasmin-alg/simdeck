/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-live-migration, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms not in kit/glossary.js yet (live migration, pre-copy, dirty page, downtime, stop-and-copy, shared storage,
   bandwidth) are written out: NOTES.md "Term pairs".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Seoba uživo: izvor, veza, odredište i krugovi pretkopiranja',
      uMiB: 'MiB',
      uGiB: 'GiB',
      uMiBs: 'MiB/s',
      uMs: 'ms',
      uS: 's',
      vm: 'VM',

      // params
      memGiB: 'Memorija gosta',
      bwMiBs: 'Propusnost veze',
      dirtyMiBs: 'Brzina prljanja',
      wssMiB: 'Radni skup',
      downtimeMs: 'Granica prekida',
      maxRounds: 'Najviše krugova',
      autoConverge: 'Prigušivanje gosta',
      round: 'Prikazani krug',
      roundN: 'krug {k}',
      roundPause: 'pauza',

      // presets
      p10gbe: '10 GbE',
      p10gbeHint: 'Konvergira: prljanje 100 MiB/s, veza 1000 MiB/s; dva kruga i 41 ms prekida',
      p1gbeBusy: '1 GbE, zauzet',
      p1gbeBusyHint: 'Prljanje 100 MiB/s, veza 110 MiB/s: krugovi se smanjuju samo ×0,91',
      pDirtyFaster: 'Brže od veze',
      pDirtyFasterHint: 'Prljanje 150 MiB/s, veza 110 MiB/s: svaki krug šalje cijeli radni skup',
      pAutoConverge: 'Prigušivanje',
      pAutoConvergeHint: 'Isto, ali gost se prigušuje dok prljanje ne padne ispod propusnosti',
      p1gbeQuiet: '1 GbE, miran',
      p1gbeQuietHint: 'Prljanje 50 MiB/s, veza 110 MiB/s: šest krugova',

      // legend
      legTodo: 'nije kopirano',
      legClean: 'kopirano, čisto',
      legDirty: 'zaprljano',
      legPaused: 'u pauzi',
      legRound: 'krug',
      legLimit: 'granica prekida',
      legChanged: 'promijenjeno',

      // stage: hosts and the link
      src: 'Izvor',
      dst: 'Odredište',
      srcMeta: 'gost {m}, radni skup {w}',
      cellSize: '1 ćelija = {c}',
      wsBracket: 'radni skup',
      gridAll: 'krug 0 šalje svu memoriju: {mib}',
      gridDirty: 'prljavo: {mib}, krug {k} to ponovno šalje',
      gridPaused: 'u pauzi: {mib}',
      link: 'veza',
      runsOnSrc: 'Gost radi na izvoru.',
      pausedFor: 'Gost stoji {dt}.',
      runsOnDst: 'Zatim radi ovdje.',
      received: 'primljeno {mib}',
      roundLine: 'Krug {k}: šalje {sent} za {sec}; gost za to vrijeme zaprlja {dirty}.',
      roundThrottle: 'Gost je prigušen {thr}\u00a0%.',
      pauseLine: 'Pauza: gost stoji, a ostatak od {rem} prelazi za {dt}.',

      // stage: chart and result
      chart: 'Krugovi pretkopiranja: poslano po krugu',
      axisRound: 'krug',
      pauseMark: 'pauza',
      limitLine: 'granica: {mib} = {ms} × {b}',
      cut: 'odrezano',
      result: 'Ishod',
      outConverged: 'konvergira',
      outForced: 'prisilna pauza',
      rRounds: 'Krugova',
      rTotal: 'Ukupno',
      rDowntime: 'Prekid',
      rLimit: 'granica {lim}',
      rRatio: 'Prljanje / propusnost',
      rRatioShrinks: 'krugovi se smanjuju',
      rRatioGrows: 'krugovi se ne smanjuju',
      rRatioUnthrottled: 'bez prigušivanja se ne smanjuju',
      rThrottle: 'Prigušenje',

      // captions
      nRounds: ['{n} kruga', '{n} kruga', '{n} krugova'],
      cIdle: 'Gost ništa ne prlja: nakon kruga 0 nema što ponovno slati, pa pauza prenosi samo {rem}. Stvarna seoba ipak ' +
        'kratko zaustavlja gosta da preda stanje procesora i uređaja.',
      cConverged: 'Gost prlja {d} MiB/s, a veza prenosi {b} MiB/s (omjer {ratio} < 1): svaki krug je manji od prethodnoga. ' +
        'Nakon {rounds} ostatak od {rem} stane u granicu od {lim} i gost stoji {dt}.',
      cSmallWss: 'Gost prlja brže nego što veza prenosi ({d} ≥ {b} MiB/s), ali cijeli radni skup od {w} stane u granicu ' +
        'od {lim}: nakon {rounds} gost stoji {dt}.',
      cThrottled: 'Gost prlja {d} MiB/s, a veza prenosi {b} MiB/s; prigušivanje mu oduzima do {thr}\u00a0% procesora, pa ' +
        'prlja sporije i krugovi se smanjuju. Nakon {rounds} gost stoji {dt}, ali je dotad radio sporije.',
      cForcedWss: 'Gost prlja {d} MiB/s, a veza prenosi {b} MiB/s: svaki krug ponovno šalje cijeli radni skup od {w}. ' +
        'Pretkopiranje ne konvergira; nakon {rounds} gost se zaustavlja na {dt}.',
      cForcedSlow: 'Gost prlja {d} MiB/s, a veza prenosi {b} MiB/s: krugovi se smanjuju, ali presporo. Nakon {rounds} ' +
        'ostaje {rem}, više nego što stane u granicu od {lim}, pa se gost zaustavlja na {dt}.',
      cThrottleNote: 'Prigušivanje je stiglo do {thr}\u00a0%.',

      explain: '<p><em lang="en">Live migration</em> (seoba uživo) premješta [[virtual machine]] na drugi domaćin dok ' +
        'radi. Disk je na <em lang="en">shared storage</em> (zajedničko spremište), pa se seli samo memorija.</p>' +
        '<p><em lang="en">Pre-copy</em> (pretkopiranje): krug 0 kopira svu memoriju dok [[guest]] radi. Gost za to ' +
        'vrijeme piše, pa već poslane stranice postaju <em lang="en">dirty pages</em> (prljave stranice); svaki sljedeći ' +
        'krug ponovno šalje ono što je prethodni ostavio prljavim. Više od svojeg radnog skupa (<em lang="en">working ' +
        'set</em>) gost ne može zaprljati.</p>' +
        '<p>Krug traje poslano / propusnost (1 GbE prenosi oko 110 MiB/s, 10 GbE oko 1000 MiB/s), a za to vrijeme gost zaprlja brzina prljanja × trajanje. Zato je svaki krug ' +
        'omjer D/B prethodnoga: krugovi se smanjuju samo ako gost prlja sporije nego što veza kopira. Kad ostatak stane u ' +
        'granicu za <em lang="en">downtime</em> (vrijeme prekida), gost se zaustavi i ostatak se kopira ' +
        '(<em lang="en">stop-and-copy</em>, zaustavi i kopiraj).</p>' +
        '<p>Ako se krugovi ne smanjuju, seoba se nakon zadanog broja krugova završi prisilno, s dugom pauzom, ili se gost ' +
        'priguši (<em lang="en">auto-converge</em>): od kruga 2 dobiva 20 % manje procesora, pa svaki krug još 10 % ' +
        'manje, dok prljanje ne padne ispod propusnosti. ' +
        'Brža veza pomaže samo ako prestigne prljanje; prekid je nula samo ako gost ništa ne prlja; trajanje ne ovisi samo o veličini ' +
        'memorije.</p>'
    },
    en: {
      stage: 'Live migration: source, link, destination and the pre-copy rounds',
      uMiB: 'MiB',
      uGiB: 'GiB',
      uMiBs: 'MiB/s',
      uMs: 'ms',
      uS: 's',
      vm: 'VM',

      memGiB: 'Guest memory',
      bwMiBs: 'Link bandwidth',
      dirtyMiBs: 'Dirty rate',
      wssMiB: 'Working set',
      downtimeMs: 'Downtime limit',
      maxRounds: 'Max rounds',
      autoConverge: 'Throttle the guest',
      round: 'Round shown',
      roundN: 'round {k}',
      roundPause: 'pause',

      p10gbe: '10 GbE',
      p10gbeHint: 'Converges: dirtying 100 MiB/s, link 1000 MiB/s; two rounds and 41 ms downtime',
      p1gbeBusy: '1 GbE, busy',
      p1gbeBusyHint: 'Dirtying 100 MiB/s, link 110 MiB/s: rounds shrink by only ×0.91',
      pDirtyFaster: 'Beats the link',
      pDirtyFasterHint: 'Dirtying 150 MiB/s, link 110 MiB/s: every round sends the whole working set',
      pAutoConverge: 'Throttled',
      pAutoConvergeHint: 'The same, but the guest is throttled until dirtying drops below the bandwidth',
      p1gbeQuiet: '1 GbE, quiet',
      p1gbeQuietHint: 'Dirtying 50 MiB/s, link 110 MiB/s: six rounds',

      legTodo: 'not copied',
      legClean: 'copied, clean',
      legDirty: 'dirtied',
      legPaused: 'in the pause',
      legRound: 'round',
      legLimit: 'downtime limit',
      legChanged: 'changed',

      src: 'Source',
      dst: 'Destination',
      srcMeta: 'guest {m}, working set {w}',
      cellSize: '1 cell = {c}',
      wsBracket: 'working set',
      gridAll: 'round 0 sends all memory: {mib}',
      gridDirty: 'dirty: {mib}, round {k} resends it',
      gridPaused: 'during the pause: {mib}',
      link: 'link',
      runsOnSrc: 'The guest runs on the source.',
      pausedFor: 'The guest is paused for {dt}.',
      runsOnDst: 'Then it runs here.',
      received: 'received {mib}',
      roundLine: 'Round {k}: sends {sent} in {sec}; meanwhile the guest dirties {dirty}.',
      roundThrottle: 'The guest is throttled {thr}\u00a0%.',
      pauseLine: 'Pause: the guest stands still while the remaining {rem} crosses in {dt}.',

      chart: 'Pre-copy rounds: data sent per round',
      axisRound: 'round',
      pauseMark: 'pause',
      limitLine: 'limit: {mib} = {ms} × {b}',
      cut: 'cut off',
      result: 'Result',
      outConverged: 'converged',
      outForced: 'forced pause',
      rRounds: 'Rounds',
      rTotal: 'Total',
      rDowntime: 'Downtime',
      rLimit: 'limit {lim}',
      rRatio: 'Dirty rate / bandwidth',
      rRatioShrinks: 'rounds shrink',
      rRatioGrows: 'rounds do not shrink',
      rRatioUnthrottled: 'unthrottled, they would not shrink',
      rThrottle: 'Throttle',

      nRounds: ['{n} round', '{n} rounds'],
      cIdle: 'The guest dirties nothing: after round 0 there is nothing to resend, so the pause carries only {rem}. A real ' +
        'migration still pauses the guest briefly to hand over its CPU and device state.',
      cConverged: 'The guest dirties {d} MiB/s and the link carries {b} MiB/s (ratio {ratio} < 1): every round is smaller ' +
        'than the one before. After {rounds} the remaining {rem} fits the {lim} limit and the guest is paused for {dt}.',
      cSmallWss: 'The guest dirties faster than the link carries ({d} ≥ {b} MiB/s), but its whole working set of {w} fits ' +
        'the {lim} limit: after {rounds} the guest is paused for {dt}.',
      cThrottled: 'The guest dirties {d} MiB/s and the link carries {b} MiB/s; throttling takes up to {thr}\u00a0% of its CPU, so ' +
        'it dirties less and the rounds shrink. After {rounds} the guest is paused for {dt}, but it ran slower until then.',
      cForcedWss: 'The guest dirties {d} MiB/s and the link carries {b} MiB/s: every round resends the whole {w} working ' +
        'set. Pre-copy does not converge; after {rounds} the guest is paused for {dt}.',
      cForcedSlow: 'The guest dirties {d} MiB/s and the link carries {b} MiB/s: the rounds shrink, but too slowly. After ' +
        '{rounds}, {rem} is left, more than fits the {lim} limit, so the guest is paused for {dt}.',
      cThrottleNote: 'Throttling reached {thr}\u00a0%.',

      explain: '<p><em>Live migration</em> moves a running [[virtual machine]] to another host. Its disk is on ' +
        '<em>shared storage</em>, so only the memory moves.</p>' +
        '<p><em>Pre-copy</em>: round 0 copies all memory while the [[guest]] runs. The guest keeps writing, so pages ' +
        'already sent become <em>dirty pages</em>; every later round resends what the round before left dirty. The guest ' +
        'cannot dirty more than its <em>working set</em>.</p>' +
        '<p>A round lasts data sent / bandwidth (1 GbE carries about 110 MiB/s, 10 GbE about 1000 MiB/s), and meanwhile the guest dirties dirty rate × duration. So every round is ' +
        'D/B of the one before: the rounds shrink only if the guest dirties more slowly than the link copies. Once the ' +
        'remainder fits the <em>downtime</em> limit, the guest is paused and the rest is copied (<em>stop-and-copy</em>).</p>' +
        '<p>If the rounds do not shrink, the migration is forced after the set number of rounds, with a long pause, or the ' +
        'guest is throttled (<em>auto-converge</em>): from round 2 it gets 20 % less CPU, then 10 % less every round, ' +
        'until dirtying drops below the bandwidth. A faster ' +
        'link helps only if it outruns the dirtying; the downtime is zero only if the guest dirties nothing; and the time depends on more than the ' +
        'memory size.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
