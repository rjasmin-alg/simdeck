/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the Amdahl page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). English text adapted from
   single-page-labs/amdahl-simulator.html; Croatian written for simdeck. Terms missing from kit/glossary.js
   (speedup, bottleneck, Amdahl's law, Gustafson's law, serial fraction) are written out here: NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Amdahlov zakon: dijelovi programa, ubrzanje i graf',
      // parts of each workload profile
      desktop1: 'Procesor', desktop2: 'Memorija', desktop3: 'Disk', desktop4: 'Mreža', desktop5: 'Iscrtavanje',
      web1: 'Mrežni U/I', web2: 'Baza podataka', web3: 'Logika na procesoru', web4: 'Disk', web5: 'Priručna memorija',
      hpc1: 'Računanje', hpc2: 'Propusnost memorije', hpc3: 'Komunikacija čvorova', hpc4: 'Disk', hpc5: 'Režija',
      mobile1: 'Procesor', mobile2: 'Grafički procesor', mobile3: 'Mreža', mobile4: 'Pohrana', mobile5: 'Senzori',
      db1: 'Disk', db2: 'Memorija', db3: 'Upit na procesoru', db4: 'Mreža', db5: 'Zaključavanje',
      custom1: 'Dio A', custom2: 'Dio B', custom3: 'Dio C', custom4: 'Dio D', custom5: 'Dio E',
      // presets
      presetDesktop: 'Stolno računalo',
      presetDesktopHint: 'Tipična raspodjela vremena na kućnom računalu, ništa još nije ubrzano',
      presetCpu4: 'Procesor 4× brži',
      presetCpu4Hint: 'Ubrzaj najveći dio (40 %)',
      presetMem4: 'Memorija 4× brža',
      presetMem4Hint: 'Isto ubrzanje na manjem dijelu (25 %)',
      presetWeb: 'Web poslužitelj',
      presetWebHint: 'Poslužitelj ograničen mrežnim ulazom i izlazom',
      presetHpc: 'Računalni klaster',
      presetHpcHint: 'Znanstveno računanje, prevladava procesor',
      presetHpc16: 'Računanje 16×',
      presetHpc16Hint: 'Računanje na 16 čvorova: blizu granice od 30 % serijskog dijela',
      presetMobile: 'Mobilna aplikacija',
      presetMobileHint: 'Mješovito opterećenje ograničeno baterijom',
      presetDb: 'Baza podataka',
      presetDbHint: 'Ograničena diskom i memorijom',
      presetCustom: 'Vlastiti',
      presetCustomHint: 'Pet jednakih dijelova: postavi udjele i ubrzanja sam',
      // controls
      sel: 'Dio programa',
      selHint: 'Ili klikni redak na pozornici.',
      frac: 'Udio vremena: {name}',
      speed: 'Ubrzanje: {name}',
      gustafson: 'Gustafsonov zakon na grafu',
      gustafsonHint: 'Isti serijski udio, ali problem raste s brojem procesora.',
      // legend
      legendBefore: 'vrijeme prije',
      legendAfter: 'vrijeme poslije, ubrzani dio',
      legendSerial: 'nepromijenjeni (serijski) dio',
      // stage
      meterSpeedup: 'Ukupno ubrzanje',
      meterSerial: 'Serijski udio',
      meterSerialSub: 'dijelovi koji nisu ubrzani',
      meterCeiling: 'Granica (n → ∞)',
      meterCeilingSub: 'ubrzanje ne može prijeći 1/s',
      timeTitle: 'Vrijeme po dijelovima (prije = 100 %)',
      total: 'Ukupno',
      bottleneck: 'usko grlo',
      partLabel: 'Dio {i}: {name}, udio {share}, ubrzanje {speed}',
      sumOk: 'Zbroj udjela: 100 %',
      sumScaled: 'Zbroj udjela: {sum}, preračunato na 100 %',
      chartTitle: 'Ubrzanje prema broju procesora',
      axisN: 'broj procesora n',
      axisS: 'ubrzanje S(n)',
      lineAmdahl: 'Amdahl, s = {s}',
      lineIdeal: 'idealno, S = n',
      lineGustafson: 'Gustafson, s = {s}',
      lineCeiling: 'granica {v}',
      point: 'sada: {v}',
      pct: '{v} %',
      infinity: '∞',
      // captions
      captionNone: 'Ništa nije ubrzano: {s}. Odaberi dio programa i povećaj mu ubrzanje.',
      captionSome: 'Ukupno {s}. Ubrzani dijelovi uzimali su {improved} vremena, ostalih {serial} ostaje isto, pa ubrzanje ne može prijeći {ceiling}.',
      captionAll: 'Ukupno {s}. Ubrzani su svi dijelovi, nema serijskog dijela, pa nema ni granice.',
      captionBottleneck: 'Usko grlo sada je {name}: {share} novog vremena.',
      explain:
        '<h3>Zakon</h3>' +
        '<p><em lang="en">Amdahl\'s law</em> (Amdahlov zakon; Gene Amdahl, 1967): <em lang="en">speedup</em> (ubrzanje) programa ograničeno je dijelom koji se ne može ubrzati.</p>' +
        '<p><code>S(n) = 1 / ( s + (1 − s) / n )</code>, gdje je <i>s</i> <em lang="en">serial fraction</em> (serijski udio), a <i>n</i> broj procesora (ili faktor poboljšanja).</p>' +
        '<p>Ovdje svaki dio ima svoj udio vremena <i>fᵢ</i> i svoje ubrzanje <i>sᵢ</i>: <code>S = 1 / Σ ( fᵢ / sᵢ )</code>, uz Σ<i>fᵢ</i> = 1. ' +
        'Serijski dio čine svi dijelovi s ubrzanjem 1×.</p>' +
        '<h3>Usko grlo</h3>' +
        '<p>Ubrzati veliki dio isplati se više nego ubrzati brzi, mali dio. Stolno računalo, isto ubrzanje 4×: procesor (40 %) daje ' +
        '<code>1 / (0,40/4 + 0,60) = 1,43×</code>, memorija (25 %) samo <code>1 / (0,25/4 + 0,75) = 1,23×</code>. ' +
        'Zato vrijedi pravilo: ubrzaj najčešći slučaj. Dio koji uzima najviše novog vremena je <em lang="en">bottleneck</em> (usko grlo); on je sljedeći kandidat.</p>' +
        '<h3>Granice</h3>' +
        '<p>Ni beskonačno mnogo procesora ne daje više od <i>1/s</i>: uz 50 % serijskog dijela granica je 2×, uz 25 % 4×, uz 10 % 10×, ' +
        'uz 5 % 20×, uz 1 % 100×. Program koji je 95 % paralelan nikad nije više od 20× brži. Krivulja se zato izravnava.</p>' +
        '<p>U praksi je ubrzanje često manje od predviđenog: komunikacija, sinkronizacija, usklađivanje priručnih memorija, ' +
        'propusnost memorije i neravnomjerna raspodjela posla.</p>' +
        '<h3>Gustafsonov zakon</h3>' +
        '<p>John Gustafson (1988): s više procesora obično rješavamo veći problem, a ne isti brže. ' +
        '<em lang="en">Gustafson\'s law</em> (Gustafsonov zakon): <code>S(n) = s + n · (1 − s)</code>, gdje je <i>s</i> serijski udio povećanog problema. ' +
        'Uz <i>s</i> = 0,05 i <i>n</i> = 100: Amdahl daje 16,8×, Gustafson 95,1×.</p>' +
        '<p>Amdahl vrijedi kad je problem fiksan i važno je vrijeme odziva; Gustafson kad problem raste s brojem procesora i važna je propusnost.</p>' +
        '<h3>Primjeri iz prakse</h3>' +
        '<p>Procesor: predviđanje grananja uzima oko 1 % ciklusa, priručna memorija oko 15 %. Dvostruko bolje predviđanje skraćuje vrijeme ' +
        'za 0,5 %, dvostruko bolja priručna memorija za 7,5 %.</p>' +
        '<p>Zid memorije: procesori su desetljećima ubrzavali puno brže od memorije, pa je čekanje na memoriju postalo usko grlo i ' +
        'dodatne jezgre pomažu manje.</p>' +
        '<p>Posao raspodijeljen na čvorove: ako je 20 % posla (spajanje rezultata) serijsko, granica je 5×; 10 čvorova daje 3,6×, 20 čvorova 4,2×.</p>' +
        '<p>Učitavanje igre: disk 30 %, procesor 40 %, grafika 30 %. I 100× brža pohrana daje najviše <code>1 / (0,70 + 0,003) = 1,42×</code>.</p>'
    },
    en: {
      stage: 'Amdahl\'s law: program parts, speedup and chart',
      desktop1: 'CPU', desktop2: 'Memory', desktop3: 'Disk I/O', desktop4: 'Network', desktop5: 'Rendering',
      web1: 'Network I/O', web2: 'Database', web3: 'CPU logic', web4: 'Disk I/O', web5: 'Cache',
      hpc1: 'Computation', hpc2: 'Memory bandwidth', hpc3: 'Node communication', hpc4: 'Disk I/O', hpc5: 'Overhead',
      mobile1: 'CPU', mobile2: 'GPU rendering', mobile3: 'Network', mobile4: 'Storage', mobile5: 'Sensors',
      db1: 'Disk I/O', db2: 'Memory', db3: 'CPU query', db4: 'Network', db5: 'Locking',
      custom1: 'Part A', custom2: 'Part B', custom3: 'Part C', custom4: 'Part D', custom5: 'Part E',
      presetDesktop: 'Desktop PC',
      presetDesktopHint: 'Typical home computer workload distribution, nothing sped up yet',
      presetCpu4: 'CPU 4× faster',
      presetCpu4Hint: 'Speed up the largest part (40%)',
      presetMem4: 'Memory 4× faster',
      presetMem4Hint: 'The same speedup on a smaller part (25%)',
      presetWeb: 'Web server',
      presetWebHint: 'Network-heavy, I/O-bound server',
      presetHpc: 'HPC cluster',
      presetHpcHint: 'Scientific computing, CPU dominated',
      presetHpc16: 'Computation 16×',
      presetHpc16Hint: 'Computation on 16 nodes: close to the ceiling set by 30% serial',
      presetMobile: 'Mobile app',
      presetMobileHint: 'Battery-limited mixed workload',
      presetDb: 'Database',
      presetDbHint: 'Disk and memory bound operations',
      presetCustom: 'Custom',
      presetCustomHint: 'Five equal parts: set fractions and speedups yourself',
      sel: 'Program part',
      selHint: 'Or click a row on the stage.',
      frac: 'Time fraction: {name}',
      speed: 'Speedup: {name}',
      gustafson: 'Gustafson\'s law on the chart',
      gustafsonHint: 'The same serial fraction, but the problem grows with the number of processors.',
      legendBefore: 'time before',
      legendAfter: 'time after, sped-up part',
      legendSerial: 'unchanged (serial) part',
      meterSpeedup: 'Overall speedup',
      meterSerial: 'Serial fraction',
      meterSerialSub: 'parts not sped up',
      meterCeiling: 'Ceiling (n → ∞)',
      meterCeilingSub: 'the speedup cannot pass 1/s',
      timeTitle: 'Time per part (before = 100%)',
      total: 'Total',
      bottleneck: 'bottleneck',
      partLabel: 'Part {i}: {name}, fraction {share}, speedup {speed}',
      sumOk: 'Sum of fractions: 100%',
      sumScaled: 'Sum of fractions: {sum}, scaled to 100%',
      chartTitle: 'Speedup vs. number of processors',
      axisN: 'number of processors n',
      axisS: 'speedup S(n)',
      lineAmdahl: 'Amdahl, s = {s}',
      lineIdeal: 'ideal, S = n',
      lineGustafson: 'Gustafson, s = {s}',
      lineCeiling: 'ceiling {v}',
      point: 'now: {v}',
      pct: '{v}%',
      infinity: '∞',
      captionNone: 'Nothing is sped up: {s}. Pick a program part and raise its speedup.',
      captionSome: 'Overall {s}. The sped-up parts took {improved} of the time; the other {serial} stays the same, so the speedup cannot pass {ceiling}.',
      captionAll: 'Overall {s}. Every part is sped up, nothing is serial, so there is no ceiling.',
      captionBottleneck: 'The bottleneck is now {name}: {share} of the new time.',
      explain:
        '<h3>The law</h3>' +
        '<p>Amdahl\'s law (Gene Amdahl, 1967): the maximum speedup of a program is limited by the part that cannot be sped up.</p>' +
        '<p><code>S(n) = 1 / ( s + (1 − s) / n )</code>, where <i>s</i> is the serial fraction and <i>n</i> the number of processors (or improvement factor).</p>' +
        '<p>Here each part has its own time fraction <i>fᵢ</i> and its own speedup <i>sᵢ</i>: <code>S = 1 / Σ ( fᵢ / sᵢ )</code>, with Σ<i>fᵢ</i> = 1. ' +
        'The serial fraction is every part with speedup 1×.</p>' +
        '<h3>The bottleneck</h3>' +
        '<p>Speeding up a large part pays more than speeding up a small, fast one. Desktop PC, the same 4× speedup: the CPU (40%) gives ' +
        '<code>1 / (0.40/4 + 0.60) = 1.43×</code>, memory (25%) only <code>1 / (0.25/4 + 0.75) = 1.23×</code>. ' +
        'Hence the rule: make the common case fast. The bottleneck is the part that takes most of the new time; it is the next one to improve.</p>' +
        '<h3>Limits</h3>' +
        '<p>Even infinitely many processors give no more than <i>1/s</i>: with 50% serial the ceiling is 2×, with 25% 4×, with 10% 10×, ' +
        'with 5% 20×, with 1% 100×. A program that is 95% parallel can never be more than 20× faster. That is why the curve flattens.</p>' +
        '<p>In practice the speedup is often lower than predicted: communication, synchronisation, cache coherence, ' +
        'memory bandwidth and load imbalance.</p>' +
        '<h3>Gustafson\'s law</h3>' +
        '<p>John Gustafson (1988): with more processors we usually solve a bigger problem, not the same one faster. ' +
        'Gustafson\'s law: <code>S(n) = s + n · (1 − s)</code>, where <i>s</i> is the serial fraction of the scaled problem. ' +
        'With <i>s</i> = 0.05 and <i>n</i> = 100: Amdahl gives 16.8×, Gustafson 95.1×.</p>' +
        '<p>Amdahl holds when the problem size is fixed and response time matters; Gustafson when the problem grows with the processors and throughput matters.</p>' +
        '<h3>Real-world examples</h3>' +
        '<p>A processor: branch prediction takes about 1% of cycles, the cache about 15%. Twice better prediction cuts the time ' +
        'by 0.5%, a twice better cache by 7.5%.</p>' +
        '<p>The memory wall: for decades processors got faster much quicker than memory, so waiting for memory became the bottleneck ' +
        'and extra cores help less.</p>' +
        '<p>A job spread over nodes: if 20% of it (combining the results) is serial, the ceiling is 5×; 10 nodes give 3.6×, 20 nodes 4.2×.</p>' +
        '<p>Loading a game: disk 30%, CPU 40%, graphics 30%. Even 100× faster storage gives at most <code>1 / (0.70 + 0.003) = 1.42×</code>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
