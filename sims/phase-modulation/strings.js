/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the phase modulation page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_pm.html and sections/pm.md (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat
   des DARC e.V.; translated and changed); English written for simdeck from it and the German original. Terms missing
   from kit/glossary.js (phase modulation, frequency modulation, carrier, modulating signal, phase, phase jump, phase
   reversal, angle modulation) are written out here: NOTES.md "Term pairs". Values in captions are nodes (bold). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Modulacijski signal, nositelj te FM i PM signal jedan ispod drugoga',
      // controls
      shape: 'Oblik signala',
      shapeHint: 'Modulacijski signal (poruka) koji upravlja nositeljem.',
      shapeSine: 'Sinus',
      shapeSquare: 'Pravokutni',
      shapeSaw: 'Pilasti',
      shapeRamp: 'Linearni porast',
      dev: 'Najveći pomak faze Δφ',
      devHint: 'Za koliko PM pomakne fazu pri vrijednosti signala ±1. Isti broj (u radijanima) određuje i FM.',
      // units
      deg: '{v}°',
      // presets
      presetSine: 'Sinus, Δφ = 90°',
      presetSineHint: 'Početak apleta: faza i frekvencija se njišu',
      presetReversal: 'Pravokutni: obrtanje faze',
      presetReversalHint: 'Svaki brid okrene fazu za 180°',
      presetSaw: 'Pilasti',
      presetSawHint: 'Faza klizi, pa skoči na padu signala',
      presetRamp: 'Linearni porast, Δφ = 180°',
      presetRampHint: 'Faza stalno raste: to je viša frekvencija',
      presetNone: 'Bez modulacije',
      presetNoneHint: 'Δφ = 0°: FM i PM jednaki su nositelju',
      presetTurn: 'Pravokutni, Δφ = 180°',
      presetTurnHint: 'Skok od 360° ne vidi se',
      // legend
      legendSignal: 'signal m(t)',
      legendCarrier: 'nositelj',
      legendFm: 'FM',
      legendPm: 'PM',
      legendZero: 'prolaz nositelja kroz nulu',
      legendEdge: 'skok faze (PM)',
      // stage rows
      rowSignal: 'Modulacijski signal (poruka)',
      rowCarrier: 'Nositeljni signal (nemoduliran)',
      rowFm: 'FM: frekvencija nositelja prati vrijednost signala',
      rowPm: 'PM: faza nositelja izravno prati vrijednost signala',
      jump: 'Δφ {v}',
      // captions
      captionNone: 'Δφ = {d}: nema modulacije. FM i PM jednaki su nositelju, koji u prozoru napravi {fc} titraja.',
      captionSmooth: '{shape}, Δφ = {d}: PM pomiče fazu koliko signal kaže, pa val ide ispred ili iza oznaka nositelja. FM mijenja frekvenciju, između {lo} i {hi} titraja u prozoru; njegova se faza mijenja tek posredno, zbrajanjem.',
      captionRamp: '{shape}, Δφ = {d}: faza PM vala raste jednoliko, pa on napravi {pm} titraja umjesto {fc}: stalni porast faze isto je što i viša frekvencija. FM val ubrzava od {lo} do {hi} titraja u prozoru.',
      captionJumps: '{shape}, Δφ = {d}: svaki brid signala odjednom skoči fazu PM vala za {j}. FM val na bridu ne skače, samo promijeni frekvenciju (od {lo} do {hi} titraja u prozoru).',
      captionReversal: '{shape}, Δφ = {d}: svaki brid signala okrene PM val naopako, skokom faze od {j} (obrtanje faze). FM val na bridu ne skače, samo promijeni frekvenciju (od {lo} do {hi} titraja u prozoru).',
      captionHidden: '{shape}, Δφ = {d}: brid pomakne fazu za 360°, puni okret, pa PM val izgleda kao nositelj. FM val i dalje mijenja frekvenciju (od {lo} do {hi} titraja u prozoru).',
      shapeNameSine: 'Sinus',
      shapeNameSquare: 'Pravokutni signal',
      shapeNameSaw: 'Pilasti signal',
      shapeNameRamp: 'Linearni porast',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Kod <b>fazne modulacije</b> (PM) faza nositeljnog vala mijenja se izravno proporcionalno trenutnoj vrijednosti modulacijskog signala. Amplituda se pritom ne mijenja. Što je signal veći, to se više pomakne faza nositelja.</p>' +
        '<p>Faznu modulaciju možemo zamisliti kao pomicanje sinusne krivulje duž vremenske osi. Okomite oznake na slici su mjesta gdje nemodulirani nositelj prolazi kroz nulu prema gore; PM val ide ispred ili iza njih.</p>' +
        '<p>Fazna i <b>frekventna modulacija</b> (FM) pripadaju <b>kutnoj modulaciji</b>: obje mijenjaju kut nositelja. FM izravno mijenja frekvenciju, PM fazu. Najjasnije se vidi kod pravokutnog signala: kod PM svaki brid odmah skoči fazu, a kod FM brid mijenja samo frekvenciju, pa se faza mijenja tek postupno.</p>' +
        '<p>Matematički: s(t) = A · cos(2π f<sub>c</sub> t + φ(t)), a kod PM je φ(t) = k · m(t). Frekvencija je brzina promjene faze, f<sub>i</sub> = f<sub>c</sub> + (1/2π) · dφ/dt. Zato faza koja stalno raste daje višu frekvenciju, a FM se može dobiti faznim modulatorom ako mu se dovede integral signala.</p>'
    },
    en: {
      stage: 'The modulating signal, the carrier, and the FM and PM signals one above the other',
      shape: 'Signal shape',
      shapeHint: 'The modulating signal (the message) that drives the carrier.',
      shapeSine: 'Sine',
      shapeSquare: 'Square',
      shapeSaw: 'Sawtooth',
      shapeRamp: 'Linear ramp',
      dev: 'Peak phase shift Δφ',
      devHint: 'How far PM shifts the phase when the signal is ±1. The same number (in radians) sets FM too.',
      deg: '{v}°',
      presetSine: 'Sine, Δφ = 90°',
      presetSineHint: 'The applet\'s start: phase and frequency swing',
      presetReversal: 'Square: phase reversal',
      presetReversalHint: 'Every edge turns the phase by 180°',
      presetSaw: 'Sawtooth',
      presetSawHint: 'The phase slides, then jumps where the signal drops',
      presetRamp: 'Linear ramp, Δφ = 180°',
      presetRampHint: 'A steadily rising phase is a higher frequency',
      presetNone: 'No modulation',
      presetNoneHint: 'Δφ = 0°: FM and PM equal the carrier',
      presetTurn: 'Square, Δφ = 180°',
      presetTurnHint: 'A 360° jump cannot be seen',
      legendSignal: 'signal m(t)',
      legendCarrier: 'carrier',
      legendFm: 'FM',
      legendPm: 'PM',
      legendZero: 'carrier zero crossing',
      legendEdge: 'phase jump (PM)',
      rowSignal: 'Modulating signal (the message)',
      rowCarrier: 'Carrier (unmodulated)',
      rowFm: 'FM: the carrier\'s frequency follows the signal\'s value',
      rowPm: 'PM: the carrier\'s phase follows the signal\'s value directly',
      jump: 'Δφ {v}',
      captionNone: 'Δφ = {d}: no modulation. FM and PM equal the carrier, which makes {fc} oscillations in the window.',
      captionSmooth: '{shape}, Δφ = {d}: PM shifts the phase as far as the signal says, so the wave runs ahead of or behind the carrier\'s marks. FM changes the frequency, between {lo} and {hi} oscillations in the window; its phase changes only indirectly, by adding up.',
      captionRamp: '{shape}, Δφ = {d}: the PM wave\'s phase rises evenly, so it makes {pm} oscillations instead of {fc}: a steadily rising phase is the same as a higher frequency. The FM wave speeds up from {lo} to {hi} oscillations in the window.',
      captionJumps: '{shape}, Δφ = {d}: every edge of the signal makes the PM wave\'s phase jump at once by {j}. The FM wave does not jump at an edge, it only changes frequency (from {lo} to {hi} oscillations in the window).',
      captionReversal: '{shape}, Δφ = {d}: every edge of the signal turns the PM wave upside down, a phase jump of {j} (phase reversal). The FM wave does not jump at an edge, it only changes frequency (from {lo} to {hi} oscillations in the window).',
      captionHidden: '{shape}, Δφ = {d}: an edge shifts the phase by 360°, a full turn, so the PM wave looks like the carrier. The FM wave still changes frequency (from {lo} to {hi} oscillations in the window).',
      shapeNameSine: 'Sine',
      shapeNameSquare: 'Square wave',
      shapeNameSaw: 'Sawtooth',
      shapeNameRamp: 'Linear ramp',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>In <b>phase modulation</b> (PM) the phase of the carrier changes in direct proportion to the modulating signal\'s value at that moment. The amplitude does not change. The larger the signal, the further the carrier\'s phase shifts.</p>' +
        '<p>Think of phase modulation as sliding the sine curve along the time axis. The vertical marks in the picture are where the unmodulated carrier crosses zero going up; the PM wave runs ahead of or behind them.</p>' +
        '<p>Phase and <b>frequency modulation</b> (FM) are both <b>angle modulation</b>: both change the carrier\'s angle. FM changes the frequency directly, PM the phase. A square signal shows it best: in PM every edge makes the phase jump at once, in FM an edge only changes the frequency, so the phase changes gradually.</p>' +
        '<p>In formulas: s(t) = A · cos(2π f<sub>c</sub> t + φ(t)), and in PM φ(t) = k · m(t). The frequency is how fast the phase changes, f<sub>i</sub> = f<sub>c</sub> + (1/2π) · dφ/dt. So a steadily rising phase gives a higher frequency, and a phase modulator fed with the integral of the signal produces FM.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
