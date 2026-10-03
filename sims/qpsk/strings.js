/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the qpsk page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_qpsk.html and sections/psk.md (CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; translated and changed), terms from its TRANSLATION_GLOSSARY.md; English written for
   simdeck from it and the German original. Terms missing from kit/glossary.js (constellation diagram, symbol,
   decision region, Gray code, phase-shift keying) are written out here: NOTES.md "Term pairs".
   Caption values ({bits}, {got}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Konstelacijski dijagram QPSK prijenosa sa šumom i niz bitova koji se prenosi',
      // controls
      noise: 'Šum',
      noiseHint: 'Standardna devijacija šuma na I i Q, u postocima udaljenosti idealne točke od osi.',
      pct: '{v} %',
      newBits: 'Novi niz bitova',
      // presets
      presetClean: 'Bez šuma',
      presetCleanHint: 'Svaka primljena točka leži točno na idealnom simbolu',
      presetOriginal: 'Šum 18 %',
      presetOriginalHint: 'Početna vrijednost izvornog appleta: točke se rasprše, ali ostaju u svom području',
      presetStrong: 'Jak šum (45 %)',
      presetStrongHint: 'Dvije točke prelaze granicu u susjedno područje',
      presetMax: 'Vrlo jak šum (60 %)',
      presetMaxHint: 'Pet pogrešnih simbola, svaki samo s jednim pogrešnim bitom',
      presetTwoBits: 'Dva pogrešna bita',
      presetTwoBitsHint: 'Točka završi u suprotnom kvadrantu, pa su pogrešna oba bita',
      // legend
      legendIdeal: 'idealni simbol (×)',
      legendPoint: 'primljena točka',
      legendWrong: 'pogrešna odluka',
      // stage
      axisI: 'I',
      axisQ: 'Q',
      streamSent: 'Odaslano',
      streamGot: 'Primljeno',
      tallySymbols: 'Pogrešni simboli',
      tallyBits: 'Pogrešni bitovi',
      of: '{a} od {b}',
      chipWrong: 'pogrešno',
      deg: '{v}°',
      // captions
      captionStart: 'Spremno je {n} simbola, po dva bita u svakom. Šum σ = {noise}. Svaki korak šalje jedan simbol.',
      captionStep: 'Simbol {k} od {total}: poslano {bits} (fazni položaj {angle}), primljena točka ima fazni položaj {phase} i leži u području simbola {got}: ',
      captionOk: 'ispravno.',
      captionWrong: ['pogrešan simbol, {n} pogrešan bit.', 'pogrešan simbol, {n} pogrešna bita.', 'pogrešan simbol, {n} pogrešnih bitova.'],
      captionEnd: ' Ukupno pogrešnih simbola: {se} od {total}, pogrešnih bitova: {be} od {nb}.',
      // attribution (CC BY 4.0)
      credit: 'Prema appletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Kod kvadraturne fazne manipulacije (<em lang="en">quadrature phase-shift keying</em>, QPSK) nositelj ima četiri fazna položaja, pa svaki <em lang="en">symbol</em> (simbol) prenosi dva bita. U <em lang="en">constellation diagram</em> (konstelacijski dijagram) četiri idealna simbola (križići) leže na kružnici: 11 na 45°, 01 na 135°, 00 na 225° i 10 na 315°.</p>' +
        '<p>U stvarnom sustavu signal je pod utjecajem šuma i drugih smetnji, pa primljena točka ne leži točno na idealnom položaju, nego odstupa i amplitudom i fazom. Prijamnik je pridružuje najbližem simbolu: četiri kvadranta su njegova <em lang="en">decision regions</em> (područja odluke). Dok god točka leži u području odaslanog simbola, on se ispravno prepoznaje; prijeđe li zbog jakog šuma granicu, prijamnik se odlučuje za pogrešan simbol.</p>' +
        '<p>Mapiranje je odabrano tako da se susjedni simboli razlikuju samo u jednom bitu (<em lang="en">Gray code</em>, Grayev kod). Zato pogrešan susjedni simbol daje samo jedan pogrešan bit; tek točka u suprotnom kvadrantu daje dva. Kanalnim se kodiranjem takve pogreške mogu ispraviti.</p>'
    },
    en: {
      stage: 'Constellation diagram of a QPSK transmission with noise, and the bit string being sent',
      noise: 'Noise',
      noiseHint: 'Standard deviation of the noise on I and Q, as a percentage of an ideal point\'s distance from the axes.',
      pct: '{v} %',
      newBits: 'New bit string',
      presetClean: 'No noise',
      presetCleanHint: 'Every received point lies exactly on its ideal symbol',
      presetOriginal: 'Noise 18 %',
      presetOriginalHint: 'The original applet\'s starting value: the points scatter but stay in their region',
      presetStrong: 'Strong noise (45 %)',
      presetStrongHint: 'Two points cross the border into the next region',
      presetMax: 'Very strong noise (60 %)',
      presetMaxHint: 'Five wrong symbols, each with only one wrong bit',
      presetTwoBits: 'Two wrong bits',
      presetTwoBitsHint: 'A point ends up in the opposite quadrant, so both bits are wrong',
      legendIdeal: 'ideal symbol (×)',
      legendPoint: 'received point',
      legendWrong: 'wrong decision',
      axisI: 'I',
      axisQ: 'Q',
      streamSent: 'Sent',
      streamGot: 'Received',
      tallySymbols: 'Wrong symbols',
      tallyBits: 'Wrong bits',
      of: '{a} of {b}',
      chipWrong: 'wrong',
      deg: '{v}°',
      captionStart: '{n} symbols are ready, two bits each. Noise σ = {noise}. Each step sends one symbol.',
      captionStep: 'Symbol {k} of {total}: sent {bits} (phase {angle}); the received point has phase {phase} and lies in the region of {got}: ',
      captionOk: 'correct.',
      captionWrong: ['wrong symbol, {n} bit wrong.', 'wrong symbol, {n} bits wrong.'],
      captionEnd: ' In total, wrong symbols: {se} of {total}, wrong bits: {be} of {nb}.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>In quadrature phase-shift keying (QPSK) the carrier has four phases, so each <em lang="en">symbol</em> carries two bits. In the <em lang="en">constellation diagram</em> the four ideal symbols (crosses) lie on a circle: 11 at 45°, 01 at 135°, 00 at 225° and 10 at 315°.</p>' +
        '<p>In a real system the signal is disturbed by noise and other interference, so a received point does not lie exactly on its ideal position but is off in both amplitude and phase. The receiver assigns it to the nearest symbol: the four quadrants are its <em lang="en">decision regions</em>. As long as the point lies in the region of the symbol that was sent, it is recognised correctly; if strong noise pushes it across a border, the receiver decides for a wrong symbol.</p>' +
        '<p>The mapping is chosen so that neighbouring symbols differ in only one bit (a <em lang="en">Gray code</em>). A wrong neighbouring symbol therefore costs only one bit; only a point in the opposite quadrant costs two. Channel coding can correct such errors.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
