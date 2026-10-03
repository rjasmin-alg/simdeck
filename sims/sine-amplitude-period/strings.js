/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the sine amplitude and period page, in both languages (docs/sim-ui.md §9). Same keys in hr
   and en. {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_sinus_amplitude_und_periode.html and sections/amplitude_periode.md
   (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck
   from it and the German original. Terms missing from kit/glossary.js (amplitude, period, frequency, half-wave,
   oscilloscope, oscillogram) are written out here: NOTES.md "Term pairs". Values in captions are nodes (bold). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Oscilogram sinusnog titraja s označenom amplitudom i periodom',
      // controls
      a: 'Amplituda a',
      aHint: 'Od 0 do 100 % punog otklona zaslona.',
      T: 'Perioda T',
      THint: 'Od 1 do 10 s, u koracima od 1 s.',
      // units
      s: '{v} s',
      pct: '{v} %',
      hz: '{v} Hz',
      // presets
      presetStart: 'T = 1 s: jedan titraj u sekundi',
      presetStartHint: 'Početne vrijednosti apleta: a = 50 %, f = 1 Hz',
      presetT2: 'T = 2 s',
      presetT2Hint: 'Dvostruka perioda: upola niža frekvencija',
      presetT4: 'T = 4 s',
      presetT4Hint: 'Opet dvostruko dulje: f = 0,25 Hz',
      presetT8: 'T = 8 s',
      presetT8Hint: 'Tri periode u 24 s',
      presetFull: 'a = 100 %',
      presetFullHint: 'Puni otklon; perioda ostaje 4 s',
      presetQuarter: 'a = 25 %',
      presetQuarterHint: 'Četvrtina otklona; perioda ostaje 4 s',
      presetZero: 'a = 0 %',
      presetZeroHint: 'Bez amplitude nema titraja',
      // legend
      legendWave: 'napon u(t)',
      legendA: 'amplituda a',
      legendT: 'perioda T',
      legendHalves: 'poluvali (+ i −)',
      // stage
      scope: 'Oscilogram',
      scopeNote: 'vodoravno vrijeme t, okomito napon u (u % punog otklona)',
      markerA: 'a = {v}',
      markerT: 'T = {v}',
      halfPos: '+',
      halfNeg: '−',
      // captions
      captionOne: 'a = {a}, T = {T}: jedna perioda traje jednu sekundu, dakle jedan titraj u sekundi, točno {f}. Broj perioda u 24 s: {p}.',
      captionMany: 'a = {a}, T = {T}: f = 1/T = {f}. Broj perioda u 24 s: {p}. Dulja perioda znači nižu frekvenciju; amplituda na nju ne utječe.',
      captionZero: 'a = {a}: nema titraja, napon ostaje na nultoj liniji. Perioda je postavljena na {T}, ali se ne vidi.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a> (skripta: DL9MJ), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Najveću udaljenost od nulte linije do najviše ili najniže točke izmjeničnog napona nazivamo <b>amplituda</b> (a).</p>' +
        '<p>Sinusni titraj sastoji se od <b>pozitivnog</b> i <b>negativnog poluvala</b>. Vrijeme od početka pozitivnog poluvala do kraja sljedećeg negativnog poluvala naziva se <b>perioda</b> ili vrijeme periode (T). Nakon jedne periode postupak počinje iznova.</p>' +
        '<p>Jedna perioda odgovara točno jednom titraju, a jedan titraj u sekundi je 1 Hz. Zato je <b>frekvencija</b> f = 1/T: perioda od 4 s daje 0,25 Hz.</p>' +
        '<p>Vremenski tijek titraja dobro se vidi na <b>osciloskopu</b>: vodoravno se prikazuje vrijeme, okomito napon. Taj slikovni prikaz naziva se <b>oscilogram</b>.</p>'
    },
    en: {
      stage: 'Oscillogram of a sine wave with its amplitude and period marked',
      a: 'Amplitude a',
      aHint: 'From 0 to 100 % of the screen\'s full scale.',
      T: 'Period T',
      THint: 'From 1 to 10 s, in steps of 1 s.',
      s: '{v} s',
      pct: '{v} %',
      hz: '{v} Hz',
      presetStart: 'T = 1 s: one oscillation per second',
      presetStartHint: 'The applet\'s starting values: a = 50 %, f = 1 Hz',
      presetT2: 'T = 2 s',
      presetT2Hint: 'Twice the period: half the frequency',
      presetT4: 'T = 4 s',
      presetT4Hint: 'Twice as long again: f = 0.25 Hz',
      presetT8: 'T = 8 s',
      presetT8Hint: 'Three periods in 24 s',
      presetFull: 'a = 100 %',
      presetFullHint: 'Full scale; the period stays 4 s',
      presetQuarter: 'a = 25 %',
      presetQuarterHint: 'A quarter of full scale; the period stays 4 s',
      presetZero: 'a = 0 %',
      presetZeroHint: 'No amplitude, no oscillation',
      legendWave: 'voltage u(t)',
      legendA: 'amplitude a',
      legendT: 'period T',
      legendHalves: 'half-waves (+ and −)',
      scope: 'Oscillogram',
      scopeNote: 'time t across, voltage u up (in % of full scale)',
      markerA: 'a = {v}',
      markerT: 'T = {v}',
      halfPos: '+',
      halfNeg: '−',
      captionOne: 'a = {a}, T = {T}: one period lasts one second, so one oscillation per second, exactly {f}. Periods in 24 s: {p}.',
      captionMany: 'a = {a}, T = {T}: f = 1/T = {f}. Periods in 24 s: {p}. A longer period means a lower frequency; the amplitude does not change it.',
      captionZero: 'a = {a}: no oscillation, the voltage stays on the zero line. The period is set to {T}, but it cannot be seen.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a> (script: DL9MJ), © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>The greatest distance from the zero line to the highest or lowest point of an alternating voltage is called the <b>amplitude</b> (a).</p>' +
        '<p>A sine wave consists of a <b>positive</b> and a <b>negative half-wave</b>. The time from the start of a positive half-wave to the end of the following negative half-wave is called the <b>period</b> (T). After one period the process starts again.</p>' +
        '<p>One period is exactly one oscillation, and one oscillation per second is 1 Hz. So the <b>frequency</b> is f = 1/T: a period of 4 s gives 0.25 Hz.</p>' +
        '<p>An <b>oscilloscope</b> shows how an oscillation runs in time: time across the screen, voltage up and down. This picture is called an <b>oscillogram</b>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
