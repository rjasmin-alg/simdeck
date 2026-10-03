/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the attenuator page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_daempfungsglied.html and sections/daempfungsglieder.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from it and
   the German original. Terms missing from kit/glossary.js (attenuator pad, system impedance, resistor, standard
   series) are written out here: NOTES.md "Term pairs". Caption values ({db}, {pct}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Shema prigušnog člana između izvora od 50 Ω i tereta od 50 Ω, s otporima i njihovim vrijednostima',
      // controls
      db: 'Prigušenje',
      dbHint: 'Za koliko decibela prigušni član smanjuje snagu signala.',
      topo: 'Oblik sklopa',
      topoHint: 'Pi: dva otpornika poprečno, jedan uzdužno. T: dva uzdužno, jedan poprečno.',
      topoPi: 'Pi',
      topoT: 'T',
      series: 'Standardni niz otpora',
      seriesHint: 'Otpornici se prodaju samo u vrijednostima iz niza. Veći broj znači gušći niz.',
      // presets
      presetPi3: 'Pi, 3 dB',
      presetPi3Hint: 'Izlazna snaga je otprilike pola ulazne',
      presetPi10: 'Pi, 10 dB, E24',
      presetPi10Hint: 'Najbliže E24 vrijednosti promaše za skoro 0,4 dB',
      presetPi10e96: 'Pi, 10 dB, E96',
      presetPi10e96Hint: 'Gušći niz: prigušenje gotovo točno',
      presetT10: 'T, 10 dB',
      presetT10Hint: 'Isto prigušenje, drugi raspored otpornika',
      presetPi15e12: 'Pi, 15 dB, E12',
      presetPi15e12Hint: 'Rijedak niz: skoro 1 dB previše',
      presetPi30: 'Pi, 30 dB',
      presetPi30Hint: 'Velik uzdužni otpor, poprečni blizu 50 Ω',
      // legend
      legendSeries: 'uzdužni otpornik',
      legendAcross: 'poprečni otpornik',
      legendEnds: 'izvor i teret od 50 Ω',
      // stage
      source: 'izvor',
      subSource: 'g',
      subLoad: 'L',
      load: 'teret',
      pad: 'prigušni član',
      portIn: 'ulaz',
      portOut: 'izlaz',
      ohm: '{v} Ω',
      kohm: '{v} kΩ',
      dbv: '{v} dB',
      // readout table
      thResistor: 'otpornik',
      thIdeal: 'idealno',
      thStd: 'najbliže iz {series}',
      rowSeriesPi: 'R2 (uzdužni)',
      rowAcrossPi: 'R1 = R3 (poprečni)',
      rowSeriesT: 'R1 = R2 (uzdužni)',
      rowAcrossT: 'R3 (poprečni)',
      rowAtt: 'prigušenje',
      rowZin: 'ulazni otpor (s teretom od 50 Ω)',
      // captions
      caption: 'Prigušni član od {db}: na izlaz stiže {pct} ulazne snage (omjer {ratio} : 1), a {heat} se u otpornicima pretvara u toplinu. S vrijednostima iz niza {series} prigušenje je {ach}, a ulazni otpor {zin}.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p><em lang="en">Attenuator pad</em> (prigušni član) smanjuje razinu signala za zadani broj decibela, primjerice da snaga odašiljača ne ošteti mjerni uređaj ili da jak signal ne preoptereti prijamnik. Prigušenje u dB odnosi se na snagu: 10 dB znači desetinu snage, 3 dB otprilike polovinu.</p>' +
        '<p>Prigušni član izveden je za <em lang="en">system impedance</em> (sustavsku impedanciju), u VF tehnici najčešće 50 Ω. Kad je na izlaz spojen teret od 50 Ω, na ulazu se također vidi 50 Ω, pa izvor ne primjećuje da je između njega i tereta umetnuta mreža otpornika. Simetrični član izgleda jednako s obje strane.</p>' +
        '<p>Mreža otpornika može imati oblik slova T ili grčkog slova π. Iz traženog prigušenja i sustavske impedancije izračunaju se idealni otpori. S K = 10^(dB/20) za Pi vrijedi R1 = R3 = 50 Ω · (K + 1) / (K − 1) i R2 = 50 Ω · (K² − 1) / (2K), a za T R1 = R2 = 50 Ω · (K − 1) / (K + 1) i R3 = 2 · 50 Ω · K / (K² − 1).</p>' +
        '<p>Otpornici se proizvode u standardnim nizovima vrijednosti (E12, E24, E48, E96, s 12 do 96 vrijednosti po dekadi). Najbliže standardne vrijednosti daju nešto drugačije prigušenje i ulazni otpor koji nije točno 50 Ω; gušći niz pogađa bolje.</p>' +
        '<p>Snaga koja ne stigne na izlaz pretvara se u otpornicima u toplinu, pa se za veće snage moraju odabrati otpornici koji tu snagu podnose.</p>'
    },
    en: {
      stage: 'Circuit of an attenuator pad between a 50 Ω source and a 50 Ω load, with its resistors and their values',
      db: 'Attenuation',
      dbHint: 'By how many decibels the pad lowers the signal power.',
      topo: 'Network shape',
      topoHint: 'Pi: two resistors across the line, one in series. T: two in series, one across.',
      topoPi: 'Pi',
      topoT: 'T',
      series: 'Standard resistor series',
      seriesHint: 'Resistors are sold only in the values of a series. A larger number means a denser series.',
      presetPi3: 'Pi, 3 dB',
      presetPi3Hint: 'The output gets about half the input power',
      presetPi10: 'Pi, 10 dB, E24',
      presetPi10Hint: 'The nearest E24 values miss by almost 0.4 dB',
      presetPi10e96: 'Pi, 10 dB, E96',
      presetPi10e96Hint: 'A denser series: the attenuation is almost exact',
      presetT10: 'T, 10 dB',
      presetT10Hint: 'The same attenuation, the other arrangement',
      presetPi15e12: 'Pi, 15 dB, E12',
      presetPi15e12Hint: 'A sparse series: almost 1 dB too much',
      presetPi30: 'Pi, 30 dB',
      presetPi30Hint: 'A large series resistor, those across close to 50 Ω',
      legendSeries: 'resistor in series',
      legendAcross: 'resistor across the line',
      legendEnds: '50 Ω source and load',
      source: 'source',
      subSource: 'g',
      subLoad: 'L',
      load: 'load',
      pad: 'attenuator pad',
      portIn: 'in',
      portOut: 'out',
      ohm: '{v} Ω',
      kohm: '{v} kΩ',
      dbv: '{v} dB',
      thResistor: 'resistor',
      thIdeal: 'ideal',
      thStd: 'nearest in {series}',
      rowSeriesPi: 'R2 (in series)',
      rowAcrossPi: 'R1 = R3 (across)',
      rowSeriesT: 'R1 = R2 (in series)',
      rowAcrossT: 'R3 (across)',
      rowAtt: 'attenuation',
      rowZin: 'input resistance (with a 50 Ω load)',
      caption: 'A {db} pad: the output gets {pct} of the input power (a ratio of {ratio} : 1), and {heat} turns into heat in the resistors. With values from the {series} series the attenuation is {ach} and the input resistance {zin}.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>An <em lang="en">attenuator pad</em> lowers a signal by a set number of decibels, for example so that a transmitter does not damage a measuring instrument, or a strong signal does not overload a receiver. The attenuation in dB refers to power: 10 dB means a tenth of the power, 3 dB about half.</p>' +
        '<p>A pad is built for a <em lang="en">system impedance</em>, in RF work usually 50 Ω. With a 50 Ω load on its output its input also looks like 50 Ω, so the source does not notice that a resistor network sits between it and the load. A symmetric pad looks the same from both sides.</p>' +
        '<p>The network can have the shape of the letter T or of the Greek letter π. The ideal resistances follow from the attenuation and the system impedance. With K = 10^(dB/20), a Pi pad has R1 = R3 = 50 Ω · (K + 1) / (K − 1) and R2 = 50 Ω · (K² − 1) / (2K); a T pad has R1 = R2 = 50 Ω · (K − 1) / (K + 1) and R3 = 2 · 50 Ω · K / (K² − 1).</p>' +
        '<p>Resistors are made in standard series of values (E12, E24, E48, E96, with 12 to 96 values per decade). The nearest standard values give a slightly different attenuation and an input resistance that is not exactly 50 Ω; a denser series comes closer.</p>' +
        '<p>The power that does not reach the output turns into heat in the resistors, so for higher powers the resistors must be rated for it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
