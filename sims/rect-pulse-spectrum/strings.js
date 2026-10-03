/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the square-wave spectrum page, in both languages (docs/sim-ui.md §9). Same keys in hr and
   en. {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_rectangle.html and sections/nicht_sinus_signale.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from it and
   the German original. Terms missing from kit/glossary.js (harmonic, fundamental, square wave, spectrum, overshoot,
   Gibbs phenomenon) are written out here: NOTES.md "Term pairs". {n} in captions is a node (the number in bold). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Fourierova aproksimacija pravokutnog signala i njezin spektar',
      // controls
      n: 'Najviši harmonik N',
      nHint: 'Samo neparni: 1, 3, 5 … 499. Strelice pomiču za jedan harmonik.',
      // presets
      presetFundamental: 'Samo osnovni val (N = 1)',
      presetFundamentalHint: 'Jedan sinus, amplituda 4/π ≈ 1,27',
      presetThree: 'Osnovni i 3. harmonik',
      presetThreeHint: 'Treći harmonik izravnava vrh',
      presetFive: 'Do 5. harmonika',
      presetFiveHint: 'Tri harmonika: bridovi postaju strmiji',
      presetNine: 'Do 9. harmonika',
      presetNineHint: 'Pet harmonika: vidi se valovitost na vrhu',
      presetTwentyFive: 'Do 25. harmonika',
      presetTwentyFiveHint: 'Trinaest harmonika: gotovo pravokutno',
      presetNinetyNine: 'Do 99. harmonika',
      presetNinetyNineHint: 'Prebačaj na skoku ostaje',
      presetMax: 'Do 499. harmonika',
      presetMaxHint: 'Kraj klizača: prebačaj je i dalje oko 9 %',
      // legend
      legendIdeal: 'idealan pravokutni signal',
      legendSum: 'Fourierova aproksimacija',
      legendBars: 'amplitude harmonika',
      // stage
      panelTime: 'Vremensko područje',
      panelTimeNote: 'zbroj harmonika do N',
      panelSpectrum: 'Spektar',
      panelSpectrumNote: 'amplituda k-tog harmonika: 4/(k · π); parnih nema',
      harmonicsInSum: ['{n} harmonik u zbroju', '{n} harmonika u zbroju', '{n} harmonika u zbroju'],
      overshoot: 'prebačaj {v} % skoka',
      ghostNote: '; crtkano: neparni harmonici koji još nisu u zbroju',
      axisK: 'harmonik k',
      // captions
      captionOne: 'N = {n}: samo osnovni val, sinus amplitude 4/π ≈ 1,27. Pravokutni signal od njega preuzima periodu, ali ne i ravan vrh ni strme bridove.',
      captionThree: 'N = {n}: osnovni val i 3. harmonik s trećinom njegove amplitude. Vrh se spljošti, a brid postaje strmiji; uz skok zbroj prebacuje za {o} % skoka.',
      captionFew: 'N = {n}: zbroj neparnih harmonika 1, 3 … {k}. Najviši ima amplitudu 1/{k} osnovnog vala. Svaki novi harmonik izravnava vrh i strmi brid, ali uz skok ostaje prebačaj od {o} % skoka.',
      captionMany: 'N = {n}: {count}. Valovitost je sve uža, ali prebačaj uz skok ne nestaje: {o} % skoka, prema granici od oko 9 % (Gibbsov fenomen).',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Čisti sinus sadrži samo svoj <b>osnovni val</b> (1. harmonik, f<sub>0</sub>). Signal koji odstupa od sinusnog oblika sadrži i cjelobrojne višekratnike N · f<sub>0</sub>, <b>više harmonike</b>.</p>' +
        '<p>Simetrični pravokutni signal sadrži samo <b>neparne harmonike</b> (1, 3, 5 …), s amplitudom koja pada kao 1/k: 3. harmonik ima trećinu amplitude osnovnog, 5. petinu. Fourierov red mu je (4/π) · (sin x + sin 3x / 3 + sin 5x / 5 + …). Takav signal nastaje npr. kad prepobuđeno pojačalo odsiječe vrhove sinusa, pa u spektru odašiljača nastaju neparni harmonici.</p>' +
        '<p>Na mjestu skoka zbroj uvijek prolazi kroz sredinu (0). Neposredno uz skok on prebacuje i podbacuje: to je <b>Gibbsov fenomen</b>. S više harmonika prebačaj postaje uži, ali ne pada ispod oko 9 % skoka (ovdje skok iznosi 2, pa vrh doseže oko 1,18).</p>' +
        '<p>Spektralni analizator prikazuje upravo donji dijagram: signal u frekvencijskom području, s amplitudom svakog harmonika.</p>'
    },
    en: {
      stage: 'Fourier approximation of a square wave and its spectrum',
      n: 'Highest harmonic N',
      nHint: 'Odd only: 1, 3, 5 … 499. The arrow keys move by one harmonic.',
      presetFundamental: 'Fundamental only (N = 1)',
      presetFundamentalHint: 'One sine, amplitude 4/π ≈ 1.27',
      presetThree: 'Fundamental and 3rd harmonic',
      presetThreeHint: 'The third harmonic flattens the top',
      presetFive: 'Up to the 5th harmonic',
      presetFiveHint: 'Three harmonics: the edges get steeper',
      presetNine: 'Up to the 9th harmonic',
      presetNineHint: 'Five harmonics: a ripple shows on the top',
      presetTwentyFive: 'Up to the 25th harmonic',
      presetTwentyFiveHint: 'Thirteen harmonics: nearly square',
      presetNinetyNine: 'Up to the 99th harmonic',
      presetNinetyNineHint: 'The overshoot at the jump stays',
      presetMax: 'Up to the 499th harmonic',
      presetMaxHint: 'The end of the slider: the overshoot is still about 9 %',
      legendIdeal: 'ideal square wave',
      legendSum: 'Fourier approximation',
      legendBars: 'harmonic amplitudes',
      panelTime: 'Time domain',
      panelTimeNote: 'sum of the harmonics up to N',
      panelSpectrum: 'Spectrum',
      panelSpectrumNote: 'amplitude of harmonic k: 4/(k · π); no even ones',
      harmonicsInSum: ['{n} harmonic in the sum', '{n} harmonics in the sum'],
      overshoot: 'overshoot {v} % of the jump',
      ghostNote: '; dashed: odd harmonics not yet in the sum',
      axisK: 'harmonic k',
      captionOne: 'N = {n}: the fundamental alone, a sine of amplitude 4/π ≈ 1.27. It gives the square wave its period, but neither the flat top nor the steep edges.',
      captionThree: 'N = {n}: the fundamental and the 3rd harmonic at a third of its amplitude. The top flattens and the edge gets steeper; next to the jump the sum overshoots by {o} % of the jump.',
      captionFew: 'N = {n}: the sum of the odd harmonics 1, 3 … {k}. The highest has 1/{k} of the fundamental\'s amplitude. Each new harmonic flattens the top and steepens the edge, but next to the jump an overshoot of {o} % of the jump remains.',
      captionMany: 'N = {n}: {count}. The ripple gets narrower, but the overshoot next to the jump does not go away: {o} % of the jump, heading for a limit of about 9 % (the Gibbs phenomenon).',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>A pure sine contains only its <b>fundamental</b> (the 1st harmonic, f<sub>0</sub>). A signal that departs from the sine shape also contains whole multiples N · f<sub>0</sub>, the <b>harmonics</b>.</p>' +
        '<p>A symmetric square wave contains only the <b>odd harmonics</b> (1, 3, 5 …), with an amplitude that falls as 1/k: the 3rd harmonic has a third of the fundamental\'s amplitude, the 5th a fifth. Its Fourier series is (4/π) · (sin x + sin 3x / 3 + sin 5x / 5 + …). Such a signal arises, for example, when an overdriven amplifier clips the peaks of a sine, and odd harmonics then appear in the transmitter\'s spectrum.</p>' +
        '<p>At the jump itself the sum always passes through the middle (0). Right next to the jump it overshoots and undershoots: the <b>Gibbs phenomenon</b>. With more harmonics the overshoot gets narrower, but it never falls below about 9 % of the jump (the jump here is 2, so the peak reaches about 1.18).</p>' +
        '<p>A spectrum analyser shows exactly the lower plot: the signal in the frequency domain, with the amplitude of each harmonic.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
