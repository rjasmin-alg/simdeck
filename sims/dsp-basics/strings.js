/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the dsp-basics page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_dsp.html and sections/modulatoren.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), terms from its TRANSLATION_GLOSSARY.md;
   English written for simdeck from it and the German original. Terms missing from kit/glossary.js (balanced
   modulator, carrier, sideband, carrier suppression, carrier balance, diode ring, DSB) are written out here:
   NOTES.md "Term pairs". Caption values ({fc}, {lsb}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Sklop balansnog modulatora s prstenom dioda, izlazni napon u vremenu i njegov spektar',
      // controls
      bal: 'Podešavanje nositelja',
      balHint: 'Položaj klizača potenciometra. Na 50 % su obje polovice jednake i nositelj se poništava.',
      fm: 'Frekvencija NF signala',
      fmHint: 'Bočni pojasevi su toliko udaljeni od frekvencije oscilatora.',
      am: 'Amplituda NF signala',
      amHint: 'Bez NF signala balansirani modulator na izlazu ne daje ništa.',
      pct: '{v} %',
      hz: '{v} Hz',
      khz: '{v} kHz',
      volt: '{v} V',
      mv: '{v} mV',
      ohm: '{v} Ω',
      // presets
      presetBalanced: 'Izbalansiran',
      presetBalancedHint: 'Klizač na sredini: nositelj je potisnut',
      presetSlightly: 'Malo pomaknut',
      presetSlightlyHint: 'Klizač na 48 %: ostatak nositelja se već vidi',
      presetFar: 'Jako pomaknut',
      presetFarHint: 'Klizač na 30 %: nositelj je jači od bočnih pojaseva',
      presetNoAfBalanced: 'Bez NF, izbalansiran',
      presetNoAfBalancedHint: 'Bez NF signala izlaz ostaje gotovo prazan',
      presetNoAfOff: 'Bez NF, pomaknut',
      presetNoAfOffHint: 'Na izlazu je samo nositelj',
      // legend
      legendOut: 'izlazni signal',
      legendAf: 'NF signal (ulaz)',
      legendCarrier: 'nositelj (ostatak)',
      legendSide: 'bočni pojasevi',
      // stage: the circuit
      blockAf: 'NF',
      blockOsc: 'oscilator',
      blockOscV: '{f} · ±{v} V, pravokutni',
      blockRing: 'prsten dioda',
      blockTrafo: 'transformator',
      blockOut: 'izlaz (DSB)',
      blockPot: 'potenciometar 1 kΩ',
      potTop: 'gore {v}',
      potBottom: 'dolje {v}',
      // stage: the plots
      plotTime: 'Izlazni napon u vremenu',
      plotSpec: 'Spektar izlaznog napona (amplituda)',
      ms: '{v} ms',
      // captions
      caption: 'Bočni pojasevi na {lsb} i {usb} imaju {al} i {au}. ',
      captionGone: 'Nositelj na {fc} je potisnut: ostatak je ispod {floor}, više od {db} dB ispod bočnih pojaseva.',
      captionBelow: 'Ostatak nositelja na {fc} ima {ac}, {db} dB ispod bočnih pojaseva.',
      captionAbove: 'Ostatak nositelja na {fc} ima {ac}, {db} dB iznad bočnih pojaseva: modulator nije izbalansiran.',
      captionNoAfGone: 'Bez NF signala i s izbalansiranim sklopom na izlazu nema ni nositelja ni bočnih pojaseva: nositelj na {fc} je ispod {floor}.',
      captionNoAf: 'Bez NF signala nema bočnih pojaseva, ali neizbalansiran sklop propušta nositelj na {fc} s {ac}.',
      // attribution (CC BY 4.0)
      credit: 'Prema simulaciji s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; sklop izračunan na stranici, preveden i prilagođen za simdeck.',
      explain:
        '<p>S četiri diode raspoređene u prsten može se izgraditi modulator koji na izlazu potiskuje <em lang="en">carrier</em> (nositelj): <em lang="en">balanced modulator</em> (balansni modulator). Prsten dioda upravlja se signalom oscilatora (ovdje pravokutni, 10 kHz). Ovisno o polaritetu oscilatora, vodi uvijek jedan od dva nasuprotna para dioda, pa se NF signal naizmjenično prenosi na izlaz s jednakim ili obrnutim polaritetom. Pojednostavljeno, NF signal se množi sa signalom oscilatora.</p>' +
        '<p>Udjeli oscilatora na izlazu se u idealnom slučaju međusobno poništavaju: to je <em lang="en">carrier suppression</em> (potiskivanje nositelja). Bez NF signala zato nema izlaznog signala; s NF signalom nastaju gornji i donji <em lang="en">sidebands</em> (bočni pojasevi) na f<sub>OSC</sub> ± f<sub>NF</sub>. Izlaz je <em lang="en">DSB</em> (dvobočnopojasni signal s potisnutim nositeljem).</p>' +
        '<p>Matematički: (U<sub>G</sub> + Û<sub>m</sub> cos ωt) cos Ωt − (U<sub>G</sub> − Û<sub>m</sub> cos ωt) cos Ωt = 2Û<sub>m</sub> cos ωt cos Ωt = Û<sub>m</sub> (cos (Ω + ω)t + cos (Ω − ω)t). Nositelj U<sub>G</sub> cos Ωt se poništava.</p>' +
        '<p>Da bi se oscilator poništio, sklop mora biti simetričan, dakle izbalansiran. Već mala razlika između dviju grana ostavlja ostatak nositelja. Ovdje oscilator ulazi preko potenciometra: <em lang="en">carrier balance</em> (podešavanje nositelja) pomiče njegov klizač, a cilj je što veće potiskivanje nositelja uz zadržavanje oba bočna pojasa. Pravokutni oscilator daje i neparne harmonike, pa se isti par bočnih pojaseva ponavlja oko 30 kHz.</p>'
    },
    en: {
      stage: 'A balanced modulator circuit with a diode ring, its output voltage over time and its spectrum',
      bal: 'Carrier balance',
      balHint: 'The potentiometer\'s wiper position. At 50 % both halves are equal and the carrier cancels.',
      fm: 'AF signal frequency',
      fmHint: 'The sidebands sit this far from the oscillator frequency.',
      am: 'AF signal amplitude',
      amHint: 'Without an AF signal a balanced modulator puts out nothing.',
      pct: '{v} %',
      hz: '{v} Hz',
      khz: '{v} kHz',
      volt: '{v} V',
      mv: '{v} mV',
      ohm: '{v} Ω',
      presetBalanced: 'Balanced',
      presetBalancedHint: 'Wiper in the middle: the carrier is suppressed',
      presetSlightly: 'Slightly off',
      presetSlightlyHint: 'Wiper at 48 %: some carrier already shows',
      presetFar: 'Far off',
      presetFarHint: 'Wiper at 30 %: the carrier is stronger than the sidebands',
      presetNoAfBalanced: 'No AF, balanced',
      presetNoAfBalancedHint: 'Without an AF signal the output stays almost empty',
      presetNoAfOff: 'No AF, off balance',
      presetNoAfOffHint: 'Only the carrier is in the output',
      legendOut: 'output signal',
      legendAf: 'AF signal (input)',
      legendCarrier: 'carrier (residual)',
      legendSide: 'sidebands',
      blockAf: 'AF',
      blockOsc: 'oscillator',
      blockOscV: '{f} · ±{v} V, square',
      blockRing: 'diode ring',
      blockTrafo: 'transformer',
      blockOut: 'output (DSB)',
      blockPot: 'potentiometer 1 kΩ',
      potTop: 'top {v}',
      potBottom: 'bottom {v}',
      plotTime: 'Output voltage over time',
      plotSpec: 'Spectrum of the output voltage (amplitude)',
      ms: '{v} ms',
      caption: 'The sidebands at {lsb} and {usb} have {al} and {au}. ',
      captionGone: 'The carrier at {fc} is suppressed: what is left is below {floor}, more than {db} dB under the sidebands.',
      captionBelow: 'The residual carrier at {fc} has {ac}, {db} dB under the sidebands.',
      captionAbove: 'The residual carrier at {fc} has {ac}, {db} dB above the sidebands: the modulator is off balance.',
      captionNoAfGone: 'Without an AF signal and with the circuit balanced, the output holds neither carrier nor sidebands: the carrier at {fc} is below {floor}.',
      captionNoAf: 'Without an AF signal there are no sidebands, but the unbalanced circuit lets the carrier at {fc} through with {ac}.',
      credit: 'After a simulation from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; circuit calculated on the page, translated and adapted for simdeck.',
      explain:
        '<p>Four diodes arranged in a ring make a modulator that suppresses the <em lang="en">carrier</em> at its output: a <em lang="en">balanced modulator</em>. The diode ring is driven by the oscillator (here a 10 kHz square wave). Depending on the oscillator\'s polarity, one of the two opposite pairs of diodes conducts, so the AF signal reaches the output alternately with the same and with reversed polarity. Put simply, the AF signal is multiplied by the oscillator signal.</p>' +
        '<p>Ideally the oscillator\'s shares at the output cancel each other: that is <em lang="en">carrier suppression</em>. Without an AF signal there is therefore no output; with one, an upper and a lower <em lang="en">sideband</em> appear at f<sub>OSC</sub> ± f<sub>AF</sub>. The output is a <em lang="en">DSB</em> signal (double sideband, suppressed carrier).</p>' +
        '<p>In formulas: (U<sub>G</sub> + Û<sub>m</sub> cos ωt) cos Ωt − (U<sub>G</sub> − Û<sub>m</sub> cos ωt) cos Ωt = 2Û<sub>m</sub> cos ωt cos Ωt = Û<sub>m</sub> (cos (Ω + ω)t + cos (Ω − ω)t). The carrier U<sub>G</sub> cos Ωt cancels.</p>' +
        '<p>For the oscillator to cancel, the circuit has to be symmetrical, that is balanced. Even a small difference between the two branches leaves some carrier. Here the oscillator comes in through a potentiometer: <em lang="en">carrier balance</em> moves its wiper, and the aim is as much carrier suppression as possible while keeping both sidebands. A square-wave oscillator also has odd harmonics, so the same pair of sidebands repeats around 30 kHz.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
