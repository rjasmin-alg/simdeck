/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the fourier page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/fourier.html and sections/fourier_transformation.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed), terms from its TRANSLATION_GLOSSARY.md;
   English written for simdeck from it and the German original. Terms missing from kit/glossary.js (time domain,
   frequency domain, spectrum, harmonic, fundamental, amplitude, phase) are written out here: NOTES.md "Term pairs".
   Caption values ({list}, {peak}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Sinusni titraji jedan do drugoga, njihov zbroj (vremensko područje) i njihove amplitude (frekvencijski spektar)',
      // controls
      count: 'Broj frekvencija',
      countHint: 'Koliko se harmonika (1 Hz, 2 Hz, 3 Hz …) zbraja.',
      sel: 'Odabrani harmonik',
      amp: 'Amplituda',
      phase: 'Faza',
      phaseHint: 'Pomak u stupnjevima periode ovog titraja.',
      view: 'Pogled', view3d: '3D',
      viewTime: 'Vrijeme',
      viewFreq: 'Frekvencija',
      hz: '{v} Hz',
      deg: '{v}°',
      harmonics: ['{n} harmonik', '{n} harmonika', '{n} harmonika'],
      // presets
      presetSine: 'Sinus',
      presetSineHint: 'Samo osnovni harmonik od 1 Hz: jedna crta u spektru',
      presetSquare: 'Pravokutni',
      presetSquareHint: 'Neparni višekratnici, amplituda 1/n',
      presetSquare30: '30 frekvencija',
      presetSquare30Hint: 'Pravokutni s 30 frekvencija: više harmonika daje strmije bridove; prebačaj na bridovima ostaje',
      presetSquarePhase: 'Druge faze',
      presetSquarePhaseHint: 'Isti spektar: amplitude pravokutnog signala, faze pomaknute za 90°',
      presetSawtooth: 'Pilasti',
      presetSawtoothHint: 'Svi višekratnici, amplituda 1/n',
      presetTriangle: 'Trokutasti',
      presetTriangleHint: 'Neparni višekratnici, amplituda 1/n²',
      presetAll: 'Sve jednake',
      presetAllHint: 'Svaki harmonik amplitude 1',
      presetNone: 'Prazno',
      presetNoneHint: 'Sve amplitude 0: složi signal sam',
      // legend
      legendLanes: 'sinusni titraji (harmonici)',
      legendSel: 'odabrani harmonik (deblje)',
      legendSum: 'zbroj (debela crta)',
      legendSpectrum: 'spektar: amplitude (točke)',
      // stage
      planeTime: 'zbroj · vremensko područje',
      planeFreq: 'spektar · frekvencijsko područje',
      axisTime: 'vrijeme →',
      sec: '{v}\u00a0s',
      scaleLabel: '±{v}',
      dragHint: 'Povuci za okretanje',
      // captions
      captionNone: 'Sve amplitude su 0: nema signala, a spektar je prazan.',
      captionSingle: 'Samo jedan sinusni titraj, {list}: u spektru jedna crta, a zbroj je čisti sinus.',
      captionOdd: '{count}: zbrajaju se samo neparni višekratnici, {list}. Zbroj doseže vrh {peak}.',
      captionMixed: '{count}: zbrajaju se {list}. Zbroj doseže vrh {peak}.',
      captionSel: ' Odabrani harmonik {f}: amplituda {a}, faza {p}.',
      listAnd: '{a} i {b}',
      listLong: '{first} … {last}',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Isti se signal može prikazati na dva načina. U <em lang="en">time domain</em> (vremensko područje) na osi X je vrijeme, a na osi Y napon. U <em lang="en">frequency domain</em> (frekvencijsko područje) na osi X je frekvencija, a na osi Y koliko je ta frekvencija jaka: to je <em lang="en">spectrum</em> (frekvencijski spektar). Čisti sinus u spektru je jedna crta.</p>' +
        '<p>Svaki se periodični signal može složiti od sinusnih titraja na višekratnicima osnovne frekvencije, svaki sa svojom <em lang="en">amplitude</em> (amplituda) i <em lang="en">phase</em> (faza). Najniži je <em lang="en">fundamental</em> (osnovni harmonik), ostali su viši <em lang="en">harmonics</em> (harmonici). Fourierova transformacija ide obrnutim putem: iz signala u vremenu računa amplitude i faze; brza Fourierova transformacija (FFT) to radi učinkovito.</p>' +
        '<p>Primjeri: <b>pravokutni</b> signal ima neparne višekratnike (f, 3f, 5f …) s amplitudama 1/n, <b>pilasti</b> sve višekratnike s 1/n, a <b>trokutasti</b> opet samo neparne, ali s 1/n², pa viši harmonici brže slabe. Oštri bridovi traže visoke frekvencije: s više harmonika brid je strmiji, ali uz njega ostaje prebačaj od oko 9 % skoka.</p>' +
        '<p>Faza mijenja oblik, ali ne i spektar amplituda: „Druge faze” ima iste crte kao pravokutni signal, a izgleda sasvim drukčije.</p>' +
        '<p>Zato se pravokutni signal ne smije dovesti izravno na antenu: odašiljao bi i na svim neparnim višekratnicima i ometao druge službe. Niskopropusni filtar propušta osnovni harmonik, a više harmonike potiskuje.</p>'
    },
    en: {
      stage: 'Sine waves side by side, their sum (the time domain) and their amplitudes (the frequency spectrum)',
      count: 'Number of frequencies',
      countHint: 'How many harmonics (1 Hz, 2 Hz, 3 Hz …) are added.',
      sel: 'Selected harmonic',
      amp: 'Amplitude',
      phase: 'Phase',
      phaseHint: 'The shift, in degrees of this wave’s period.',
      view: 'View', view3d: '3D',
      viewTime: 'Time',
      viewFreq: 'Frequency',
      hz: '{v} Hz',
      deg: '{v}°',
      harmonics: ['{n} harmonic', '{n} harmonics'],
      presetSine: 'Sine',
      presetSineHint: 'The 1 Hz fundamental alone: one line in the spectrum',
      presetSquare: 'Square',
      presetSquareHint: 'Odd multiples, amplitude 1/n',
      presetSquare30: '30 frequencies',
      presetSquare30Hint: 'Square with 30 frequencies: more harmonics make steeper edges; the overshoot at the edges stays',
      presetSquarePhase: 'Other phases',
      presetSquarePhaseHint: 'Same spectrum: the square wave’s amplitudes, phases moved by 90°',
      presetSawtooth: 'Sawtooth',
      presetSawtoothHint: 'All multiples, amplitude 1/n',
      presetTriangle: 'Triangle',
      presetTriangleHint: 'Odd multiples, amplitude 1/n²',
      presetAll: 'All equal',
      presetAllHint: 'Every harmonic at amplitude 1',
      presetNone: 'Empty',
      presetNoneHint: 'Every amplitude 0: build a signal yourself',
      legendLanes: 'sine waves (harmonics)',
      legendSel: 'selected harmonic (thicker)',
      legendSum: 'sum (thick line)',
      legendSpectrum: 'spectrum: amplitudes (dots)',
      planeTime: 'sum · time domain',
      planeFreq: 'spectrum · frequency domain',
      axisTime: 'time →',
      sec: '{v}\u00a0s',
      scaleLabel: '±{v}',
      dragHint: 'Drag to turn',
      captionNone: 'Every amplitude is 0: there is no signal, and the spectrum is empty.',
      captionSingle: 'A single sine wave, {list}: one line in the spectrum, and the sum is a pure sine.',
      captionOdd: '{count}: only odd multiples are added, {list}. The sum peaks at {peak}.',
      captionMixed: '{count}: {list} are added. The sum peaks at {peak}.',
      captionSel: ' Selected harmonic {f}: amplitude {a}, phase {p}.',
      listAnd: '{a} and {b}',
      listLong: '{first} … {last}',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>The same signal can be shown in two ways. In the <em lang="en">time domain</em> the x axis is time and the y axis voltage. In the <em lang="en">frequency domain</em> the x axis is frequency and the y axis how strong that frequency is: the <em lang="en">spectrum</em>. A pure sine is a single line in the spectrum.</p>' +
        '<p>Any periodic signal can be built from sine waves at multiples of a base frequency, each with its own <em lang="en">amplitude</em> and <em lang="en">phase</em>. The lowest is the <em lang="en">fundamental</em>, the others are the higher <em lang="en">harmonics</em>. The Fourier transform goes the other way: from the signal over time it computes the amplitudes and phases; the fast Fourier transform (FFT) does it efficiently.</p>' +
        '<p>Examples: a <b>square</b> wave has the odd multiples (f, 3f, 5f …) at 1/n, a <b>sawtooth</b> every multiple at 1/n, and a <b>triangle</b> again only the odd ones, but at 1/n², so its higher harmonics fade faster. Sharp edges need high frequencies: with more harmonics the edge gets steeper, but an overshoot of about 9 % of the jump stays beside it.</p>' +
        '<p>Phase changes the shape, not the amplitude spectrum: “Other phases” has the same lines as the square wave and looks quite different.</p>' +
        '<p>This is why a square wave must never go straight to an antenna: it would also transmit on every odd multiple and disturb other services. A low-pass filter passes the fundamental and suppresses the higher harmonics.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
