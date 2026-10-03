/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the am-modulation page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_am_modulator.html and sections/modulatoren.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), terms from its TRANSLATION_GLOSSARY.md;
   English written for simdeck from it and the German original. Terms missing from kit/glossary.js (carrier,
   sideband, tank circuit, high-pass filter, envelope, modulation depth, mixing product) are written out here:
   NOTES.md "Term pairs". Caption values ({fc}, {lsb}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Sklop AM modulatora s diodom, izlazni napon u vremenu i njegov spektar',
      // controls
      fm: 'Frekvencija NF signala',
      fmHint: 'Frekvencija niskofrekvencijskog (korisnog) signala. Bočni pojasevi su toliko udaljeni od nositelja.',
      am: 'Amplituda NF signala',
      amHint: 'Što je NF signal jači, to se amplituda nositelja više mijenja i bočni pojasevi su jači.',
      tank: 'Titrajni krug',
      tankHint: 'Paralelni titrajni krug ugođen na nositelj. Bez njega na izlazu ostaju i drugi produkti miješanja.',
      hz: '{v} Hz',
      khz: '{v} kHz',
      volt: '{v} V',
      // presets
      presetOriginal: 'NF 500 Hz',
      presetOriginalHint: 'Vrijednosti iz izvornog sklopa',
      presetFm1k: 'NF 1 kHz',
      presetFm1kHint: 'Bočni pojasevi se odmiču od nositelja',
      presetNoTank: 'Bez titrajnog kruga',
      presetNoTankHint: 'Na izlazu se vide i drugi produkti miješanja',
      presetNoNf: 'Bez NF signala',
      presetNoNfHint: 'Ostaje samo nositelj, bez bočnih pojaseva',
      presetStrong: 'Jak NF signal',
      presetStrongHint: 'Amplituda nositelja mijenja se gotovo do nule',
      // legend
      legendOut: 'izlazni signal (AM)',
      legendNf: 'NF signal (ulaz)',
      legendCarrier: 'nositelj',
      legendSide: 'bočni pojasevi',
      legendBand: 'propusni pojas titrajnog kruga',
      // stage: the circuit
      blockNf: 'NF',
      blockVf: 'VF nositelj',
      blockSum: '2 × 1 kΩ',
      blockDiode: 'dioda',
      blockHp: 'visokopropusni filtar',
      blockTank: 'titrajni krug',
      blockTankOff: 'uklonjen',
      blockTankF: 'f₀ ≈ {v}',
      blockOut: 'izlaz',
      // stage: the plots
      plotTime: 'Izlazni napon u vremenu',
      plotSpec: 'Spektar izlaznog napona (amplituda)',
      ms: '{v} ms',
      // captions
      caption: 'Nositelj na {fc} ima amplitudu {ac}, a bočni pojasevi na {lsb} i {usb} imaju {al} i {au}: razmak od nositelja jednak je frekvenciji NF signala, {fm}.',
      captionDepth: ' Stupanj modulacije m ≈ {m}.',
      captionNoTank: ' Bez titrajnog kruga na izlazu ostaju i produkti miješanja: harmonici nositelja na 20 i 30 kHz, svaki sa svojim bočnim pojasevima.',
      captionNoNf: 'Bez NF signala amplituda nositelja se ne mijenja: na izlazu je samo nositelj na {fc}, amplitude {ac}, bez bočnih pojaseva.',
      // attribution (CC BY 4.0)
      credit: 'Prema simulaciji s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; sklop izračunan na stranici, preveden i prilagođen za simdeck.',
      explain:
        '<p>NF signal (ovdje 500 Hz, 0,5 V) i VF signal (10 kHz, 2 V) zajedno se preko dvaju otpornika dovode na diodu. Karakteristika diode je zakrivljena, pa NF napon mijenja njezinu vodljivost: VF signal prolazi jače ili slabije, ovisno o trenutnoj vrijednosti NF signala. Amplituda VF signala tako se mijenja u ritmu NF signala; to je amplitudna modulacija (AM).</p>' +
        '<p>Na izlazu diode, uz <em lang="en">carrier</em> (nositelj) na f<sub>N</sub>, nastaju dva <em lang="en">sidebands</em> (bočna pojasa): donji na f<sub>N</sub> − f<sub>NF</sub> i gornji na f<sub>N</sub> + f<sub>NF</sub>, ali i mnogi drugi produkti miješanja. <em lang="en">High-pass filter</em> (visokopropusni filtar) od kondenzatora i zavojnice uklanja sam NF signal, a <em lang="en">tank circuit</em> (paralelni titrajni krug) ugođen na nositelj (f₀ ≈ 9,8 kHz) potiskuje ostale produkte.</p>' +
        '<p>Matematički: (U<sub>G</sub> + Û<sub>m</sub> cos ωt) · cos Ωt = U<sub>G</sub> cos Ωt + (Û<sub>m</sub>/2) cos (Ω + ω)t + (Û<sub>m</sub>/2) cos (Ω − ω)t. Prvi član je nositelj, druga dva su bočni pojasevi. Svaki bočni pojas ima najviše pola amplitude nositelja.</p>' +
        '<p>Gornji rub signala je <em lang="en">envelope</em> (omotnica) i ima oblik NF signala. <em lang="en">Modulation depth</em> (stupanj modulacije) m = (U<sub>max</sub> − U<sub>min</sub>) / (U<sub>max</sub> + U<sub>min</sub>) računa se iz najveće i najmanje amplitude nositelja; bočni pojasevi tada imaju otprilike po m/2 amplitude nositelja.</p>'
    },
    en: {
      stage: 'A diode AM modulator circuit, its output voltage over time and its spectrum',
      fm: 'AF signal frequency',
      fmHint: 'The frequency of the low-frequency (useful) signal. The sidebands are this far from the carrier.',
      am: 'AF signal amplitude',
      amHint: 'The stronger the AF signal, the more the carrier amplitude changes and the stronger the sidebands.',
      tank: 'Tank circuit',
      tankHint: 'A parallel tank circuit tuned to the carrier. Without it, other mixing products stay in the output.',
      hz: '{v} Hz',
      khz: '{v} kHz',
      volt: '{v} V',
      presetOriginal: 'AF 500 Hz',
      presetOriginalHint: 'The values of the original circuit',
      presetFm1k: 'AF 1 kHz',
      presetFm1kHint: 'The sidebands move away from the carrier',
      presetNoTank: 'No tank circuit',
      presetNoTankHint: 'Other mixing products show in the output',
      presetNoNf: 'No AF signal',
      presetNoNfHint: 'Only the carrier is left, no sidebands',
      presetStrong: 'Strong AF signal',
      presetStrongHint: 'The carrier amplitude swings almost to zero',
      legendOut: 'output signal (AM)',
      legendNf: 'AF signal (input)',
      legendCarrier: 'carrier',
      legendSide: 'sidebands',
      legendBand: 'pass band of the tank circuit',
      blockNf: 'AF',
      blockVf: 'RF carrier',
      blockSum: '2 × 1 kΩ',
      blockDiode: 'diode',
      blockHp: 'high-pass filter',
      blockTank: 'tank circuit',
      blockTankOff: 'removed',
      blockTankF: 'f₀ ≈ {v}',
      blockOut: 'output',
      plotTime: 'Output voltage over time',
      plotSpec: 'Spectrum of the output voltage (amplitude)',
      ms: '{v} ms',
      caption: 'The carrier at {fc} has an amplitude of {ac}, and the sidebands at {lsb} and {usb} have {al} and {au}: they sit as far from the carrier as the AF signal\'s frequency, {fm}.',
      captionDepth: ' Modulation depth m ≈ {m}.',
      captionNoTank: ' Without the tank circuit, mixing products stay in the output too: the carrier\'s harmonics at 20 and 30 kHz, each with its own sidebands.',
      captionNoNf: 'Without an AF signal the carrier amplitude does not change: the output is only the carrier at {fc}, amplitude {ac}, with no sidebands.',
      credit: 'After a simulation from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; circuit calculated on the page, translated and adapted for simdeck.',
      explain:
        '<p>The AF signal (here 500 Hz, 0.5 V) and the RF signal (10 kHz, 2 V) are fed together through two resistors to a diode. The diode\'s characteristic is curved, so the AF voltage changes how well it conducts: the RF signal passes more or less strongly depending on the AF signal\'s value at that moment. The RF signal\'s amplitude thus changes in step with the AF signal; that is amplitude modulation (AM).</p>' +
        '<p>After the diode there is the <em lang="en">carrier</em> at f<sub>C</sub>, two <em lang="en">sidebands</em>, the lower at f<sub>C</sub> − f<sub>AF</sub> and the upper at f<sub>C</sub> + f<sub>AF</sub>, and many other mixing products. A <em lang="en">high-pass filter</em> of a capacitor and a coil removes the AF signal itself, and a parallel <em lang="en">tank circuit</em> tuned to the carrier (f₀ ≈ 9.8 kHz) suppresses the other products.</p>' +
        '<p>In formulas: (U<sub>G</sub> + Û<sub>m</sub> cos ωt) · cos Ωt = U<sub>G</sub> cos Ωt + (Û<sub>m</sub>/2) cos (Ω + ω)t + (Û<sub>m</sub>/2) cos (Ω − ω)t. The first term is the carrier, the other two are the sidebands. Each sideband has at most half the carrier\'s amplitude.</p>' +
        '<p>The signal\'s upper edge is its <em lang="en">envelope</em>, and it has the shape of the AF signal. The <em lang="en">modulation depth</em> m = (U<sub>max</sub> − U<sub>min</sub>) / (U<sub>max</sub> + U<sub>min</sub>) comes from the carrier\'s largest and smallest amplitude; each sideband then has about m/2 of the carrier\'s amplitude.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
