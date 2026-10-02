/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the quantisation page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/quantisierung_und_sampling.html and sections/sampling_quantisierung.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from it and
   the German original. Terms missing from kit/glossary.js (sampling, sample, quantisation, A/D and D/A converter,
   quantisation step) are written out here: NOTES.md "Term pairs". Caption values ({rate}, {ts}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Sinus od 1 Hz: vremenski kontinuirani signal i izlaz A/D i D/A pretvarača',
      // controls
      rate: 'Vremenska kvantizacija',
      rateHint: 'Brzina uzorkovanja: koliko puta u sekundi A/D pretvarač mjeri signal.',
      bits: 'Kvantizacija vrijednosti',
      bitsHint: 'Broj bitova po uzorku: n bitova daje 2ⁿ razina.',
      sps: ['{n} uzorak/s', '{n} uzorka/s', '{n} uzoraka/s'],
      bitCount: ['{n} bit', '{n} bita', '{n} bitova'],
      levelCount: ['{n} razina', '{n} razine', '{n} razina'],
      ms: '{v}\u00a0ms',
      s: '{v}\u00a0s',
      pct: '{v}\u00a0%',
      // presets
      presetFine: 'Fino (1024 uzorka/s, 16 bitova)',
      presetFineHint: 'Izlaz se gotovo ne razlikuje od izvornog signala',
      presetCoarseTime: 'Grubo u vremenu (16 uzoraka/s)',
      presetCoarseTimeHint: 'Šesnaest uzoraka u sekundi: vidljive stepenice u vremenu',
      presetCoarseValue: 'Grubo po vrijednosti (3 bita)',
      presetCoarseValueHint: 'Samo osam razina: vidljive stepenice po vrijednosti',
      presetBoth: 'Oboje grubo (16 uzoraka/s, 3 bita)',
      presetBothHint: 'Vremenski i vrijednosno diskretan signal',
      presetOneBit: 'Jedan bit',
      presetOneBitHint: 'Dvije razine: od sinusa ostaje pravokutni signal',
      presetLimit: 'Dva uzorka po periodi',
      presetLimitHint: 'Oba uzorka padaju na prolaske kroz nulu',
      // legend
      legendSignal: 'vremenski kontinuirani signal (crtkano)',
      legendSamples: 'uzorci',
      legendOutput: 'izlaz D/A pretvarača (stepenice)',
      // stage
      axisTime: 'vrijeme',
      // captions
      caption: '{rate}: jedan uzorak svakih {ts}. {bits}: {levels}, razmak {delta}, pa svaki uzorak odstupa najviše {err} od izvornog signala.',
      captionLimit: '{rate}: oba uzorka u periodi padaju na prolaske kroz nulu, pa izlaz ne pokazuje sinus nego ravnu crtu tik iznad nule. Za sinus treba više od dva uzorka po periodi.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a> (skripta: DL9MJ), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Pri digitalizaciji analognog signala važna su dva svojstva: u kojim se trenucima signal mjeri i koliko se točno izmjerene vrijednosti mogu zapisati.</p>' +
        '<p><em lang="en">Sampling</em> (uzorkovanje): A/D pretvarač mjeri signal samo u trenucima razmaknutima 1/fs. Svaki je <em lang="en">sample</em> (uzorak) trenutačno stanje signala; što se događa između dva uzorka, ostaje nezabilježeno. Signal je nakon toga <b>vremenski diskretan</b>.</p>' +
        '<p><em lang="en">Quantisation</em> (kvantizacija): s n bitova na raspolaganju je samo 2ⁿ razina, razmaknutih Δ = 200 % / 2ⁿ. Svaki se uzorak pridružuje najbližoj razini, pa je pogreška najviše Δ/2. Signal je nakon toga <b>vrijednosno diskretan</b>. Svaki bit više prepolovi pogrešku; za puni sinus omjer signala i šuma kvantizacije iznosi približno 6,02 · n + 1,76 dB.</p>' +
        '<p>D/A pretvarač drži svaku razinu do sljedećeg uzorka, pa nastaje stepenasti signal: opet vremenski kontinuiran, ali i dalje vrijednosno diskretan. Usporedba: analogni dimer podešava svjetlinu proizvoljno fino, a stupnjevita sklopka s pet stupnjeva ima samo pet vrijednosti.</p>' +
        '<p>CD uzorkuje zvuk brzinom od 44 100 uzoraka u sekundi (44,1 kS/s), sa 16 bitova po uzorku.</p>'
    },
    en: {
      stage: 'A 1 Hz sine: the continuous-time signal and the output of the A/D and D/A converters',
      rate: 'Time quantisation',
      rateHint: 'Sampling rate: how many times a second the A/D converter measures the signal.',
      bits: 'Value quantisation',
      bitsHint: 'Bits per sample: n bits give 2ⁿ levels.',
      sps: ['{n} sample/s', '{n} samples/s'],
      bitCount: ['{n} bit', '{n} bits'],
      levelCount: ['{n} level', '{n} levels'],
      ms: '{v}\u00a0ms',
      s: '{v}\u00a0s',
      pct: '{v}\u00a0%',
      presetFine: 'Fine (1024 samples/s, 16 bits)',
      presetFineHint: 'The output can hardly be told from the original signal',
      presetCoarseTime: 'Coarse in time (16 samples/s)',
      presetCoarseTimeHint: 'Sixteen samples a second: steps in time show',
      presetCoarseValue: 'Coarse in value (3 bits)',
      presetCoarseValueHint: 'Only eight levels: steps in value show',
      presetBoth: 'Both coarse (16 samples/s, 3 bits)',
      presetBothHint: 'A signal discrete in time and in value',
      presetOneBit: 'One bit',
      presetOneBitHint: 'Two levels: the sine becomes a square wave',
      presetLimit: 'Two samples per period',
      presetLimitHint: 'Both samples land on zero crossings',
      legendSignal: 'continuous-time signal (dashed)',
      legendSamples: 'samples',
      legendOutput: 'D/A converter output (steps)',
      axisTime: 'time',
      caption: '{rate}: one sample every {ts}. {bits}: {levels}, {delta} apart, so each sample is off the original signal by at most {err}.',
      captionLimit: '{rate}: both samples in a period land on zero crossings, so the output shows no sine, only a flat line just above zero. A sine needs more than two samples per period.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a> (script: DL9MJ), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>Digitising an analogue signal involves two properties: at which instants the signal is measured, and how precisely the measured values can be written down.</p>' +
        '<p><em lang="en">Sampling</em>: the A/D converter measures the signal only at instants 1/fs apart. Each <em lang="en">sample</em> is the state of the signal at that instant; whatever happens between two samples is not recorded. The signal is now <b>discrete in time</b>.</p>' +
        '<p><em lang="en">Quantisation</em>: with n bits there are only 2ⁿ levels, Δ = 200 % / 2ⁿ apart. Each sample goes to the nearest level, so the error is at most Δ/2. The signal is now <b>discrete in value</b>. Each extra bit halves the error; for a full-scale sine the signal-to-quantisation-noise ratio is about 6.02 · n + 1.76 dB.</p>' +
        '<p>The D/A converter holds each level until the next sample, which gives a staircase: continuous in time again, but still discrete in value. Compare an analogue dimmer, which sets the brightness as finely as you like, with a five-position switch, which has only five values.</p>' +
        '<p>A CD samples sound 44,100 times a second (44.1 kS/s), with 16 bits per sample.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
