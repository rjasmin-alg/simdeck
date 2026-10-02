/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the lambda-f page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_lambda_und_f.html and sections/wellenlaenge.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from it and
   the German original. Terms missing from kit/glossary.js (wavelength, frequency, crest, band) are written out
   here: NOTES.md "Term pairs". Caption values ({lambda}, {f}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Trenutni prikaz vala na udaljenosti od 10 m, s označenom jednom valnom duljinom',
      // controls
      lambda: 'Valna duljina λ',
      lambdaHint: 'Razmak između dvaju susjednih bregova vala. Frekvencija se izračunava sama.',
      m: '{v} m',
      mhz: '{v} MHz',
      // presets
      presetM8: '8 m',
      presetM8Hint: 'Oko 37,5 MHz',
      presetM4: '4 m (pola od 8 m)',
      presetM4Hint: 'Upola kraća valna duljina, dvostruko veća frekvencija',
      presetM2: '2 m (pola od 4 m)',
      presetM2Hint: 'Opet upola kraća, opet dvostruko veća frekvencija',
      presetM1: '1 m (pola od 2 m)',
      presetM1Hint: 'Oko 300 MHz',
      presetCm50: '50 cm (pola od 1 m)',
      presetCm50Hint: 'Najkraća valna duljina na klizaču',
      presetM3: '3 m',
      presetM3Hint: 'Okrugla frekvencija od oko 100 MHz',
      presetM10: '10 m',
      presetM10Hint: 'Na prikazu stane samo jedna valna duljina',
      // legend
      legendWave: 'val',
      legendCrests: 'bregovi vala',
      legendLambda: 'jedna valna duljina λ',
      // stage
      axisDistance: 'udaljenost',
      marker: 'λ = {v}',
      // captions
      caption: 'Valna duljina {lambda}, pa je frekvencija f\u00a0=\u00a0c\u00a0/\u00a0λ = 299,79 MHz·m / {lambdaAgain} = {f}. Pravilo 300\u00a0/\u00a0λ daje {rule}. Na prikazanih 10 m stane {periods} λ.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a> (skripta: DL9MJ), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Razmak između dvaju bregova vala, odnosno dviju dolina vala, naziva se <em lang="en">wavelength</em> (valna duljina). Označava se grčkim slovom λ (lambda) i obično se izražava u metrima. Prikaz je snimka vala u jednom trenutku: vodoravna os je udaljenost, a ne vrijeme.</p>' +
        '<p>Valna duljina ovisi o <em lang="en">frequency</em> (frekvenciji): što je frekvencija veća, to je valna duljina manja. Val se u slobodnom prostoru širi brzinom svjetlosti, c ≈ 300 000 km/s. Val od 1 Hz prijeđe 300 000 km prije nego što stigne sljedeći brijeg, val od 1000 Hz samo 300 km, a val od 1 MHz samo 300 m. Zato je f · λ = c.</p>' +
        '<p>S frekvencijom u MHz i valnom duljinom u metrima to daje dvije jednostavne formule: f = 300 / λ i λ = 300 / f. Primjer: frekvenciji od 145,3 MHz odgovara λ = 300 / 145,3 ≈ 2,06 m. Točna brzina svjetlosti, 299 792 458 m/s, daje nešto manju frekvenciju od pravila; razlika je oko 0,07 %.</p>' +
        '<p>Upola kraća valna duljina znači dvostruko veću frekvenciju. Zaokružena valna duljina daje i imena radioamaterskim pojasevima: 2-metarski pojas je 144–146 MHz.</p>'
    },
    en: {
      stage: 'A snapshot of a wave over 10 m of distance, with one wavelength marked',
      lambda: 'Wavelength λ',
      lambdaHint: 'The distance between two neighbouring crests of the wave. The frequency is calculated from it.',
      m: '{v} m',
      mhz: '{v} MHz',
      presetM8: '8 m',
      presetM8Hint: 'About 37.5 MHz',
      presetM4: '4 m (half of 8 m)',
      presetM4Hint: 'Half the wavelength, twice the frequency',
      presetM2: '2 m (half of 4 m)',
      presetM2Hint: 'Half again, twice the frequency again',
      presetM1: '1 m (half of 2 m)',
      presetM1Hint: 'About 300 MHz',
      presetCm50: '50 cm (half of 1 m)',
      presetCm50Hint: 'The shortest wavelength on the slider',
      presetM3: '3 m',
      presetM3Hint: 'A round frequency of about 100 MHz',
      presetM10: '10 m',
      presetM10Hint: 'Only one wavelength fits in the view',
      legendWave: 'wave',
      legendCrests: 'crests of the wave',
      legendLambda: 'one wavelength λ',
      axisDistance: 'distance',
      marker: 'λ = {v}',
      caption: 'The wavelength is {lambda}, so the frequency is f\u00a0=\u00a0c\u00a0/\u00a0λ = 299.79 MHz·m / {lambdaAgain} = {f}. The rule 300\u00a0/\u00a0λ gives {rule}. The 10 m shown hold {periods} λ.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a> (script: DL9MJ), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>The distance between two crests of a wave, or between two troughs, is its <em lang="en">wavelength</em>. It is written with the Greek letter λ (lambda) and usually given in metres. The view is a snapshot of the wave at one instant: the horizontal axis is distance, not time.</p>' +
        '<p>The wavelength depends on the <em lang="en">frequency</em>: the higher the frequency, the shorter the wavelength. In free space a wave travels at the speed of light, c ≈ 300,000 km/s. A 1 Hz wave travels 300,000 km before the next crest follows, a 1000 Hz wave only 300 km, and a 1 MHz wave only 300 m. So f · λ = c.</p>' +
        '<p>With the frequency in MHz and the wavelength in metres this gives two simple formulas: f = 300 / λ and λ = 300 / f. For example, 145.3 MHz has λ = 300 / 145.3 ≈ 2.06 m. The exact speed of light, 299,792,458 m/s, gives a slightly lower frequency than the rule; the difference is about 0.07 %.</p>' +
        '<p>Half the wavelength means twice the frequency. Rounded wavelengths also name the amateur radio bands: the 2 m band is 144–146 MHz.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
