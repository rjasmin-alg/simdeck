/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the LC resonant circuit page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from the text around the applet in
   50ohm-contents-hr/contents/sections/schwingkreis_1.md and oszillatoren.md (CC BY 4.0, 50ohm.de-Autorenteam,
   AJW-Referat des DARC e.V.; Croatian by the 50ohm-contents-hr team; changed), English written for simdeck from them
   and the German original. Terms missing from kit/glossary.js (resonant circuit, coil, capacitor, electric and magnetic
   field, resonant frequency, Thomson's formula) are written out here: NOTES.md "Term pairs".
   Values in captions are nodes (bold). L, C, I, U, E, H, f₀ and T are names, not words. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Titrajni krug: zavojnica lijevo, kondenzator desno, s njihovim poljima; desno struja i napon kroz jednu periodu i raspodjela energije',
      // controls
      l: 'Induktivitet L',
      lHint: 'Veći induktivitet: sporije titranje, niža f₀.',
      c: 'Kapacitet C',
      cHint: 'Veći kapacitet: sporije titranje, niža f₀.',
      // units and numbers
      dec: ',',
      uh: '{v} µH',
      pf: '{v} pF',
      mhz: '{v} MHz',
      ns: '{v} ns',
      // presets
      presetStart: 'Početak: krug miruje',
      presetStartHint: 'L = 10 µH, C = 100 pF, kondenzator još nije nabijen',
      presetMagnetic: 'Četvrt periode: sve u zavojnici',
      presetMagneticHint: 'Kondenzator prazan, struja najveća',
      presetMoreC: 'Veći C: 470 pF',
      presetMoreCHint: 'Niža rezonantna frekvencija, dulja perioda',
      presetLessL: 'Manji L: 2,2 µH',
      presetLessLHint: 'Viša rezonantna frekvencija, kraća perioda',
      // legend
      legendE: 'napon U i električno polje E (kondenzator)',
      legendH: 'struja I i magnetsko polje H (zavojnica)',
      // stage
      nameL: 'L',
      nameC: 'C',
      nameE: 'E',
      nameH: 'H',
      nameI: 'I',
      nameU: 'U',
      iZero: 'I = 0',
      axisT: 't',
      tickQuarter: 'T/4',
      tickHalf: 'T/2',
      tickThree: '3T/4',
      tickFull: 'T',
      plotTitle: 'Struja I i napon U kroz jednu periodu T',
      energyTitle: 'Energija',
      energyE: 'u električnom polju',
      energyM: 'u magnetskom polju',
      pct: '{v} %',
      formula: 'f₀ = 1 / (2π √(L·C)) = {f}',
      period: 'T = 1 / f₀ = {T}',
      timeRest: 't: kondenzator još nije nabijen',
      timeNow: 't = {k}/8 · T = {t}',
      // captions
      caption0: 'Titrajni krug miruje: kondenzator je prazan, nema polja ni struje. Sljedeći korak nabija kondenzator, primjerice pravokutnim impulsom.',
      caption1: 'Kondenzator je nabijen (gornja ploča +). Sva je energija u električnom polju između ploča; struja još ne teče.',
      caption2: 'Kondenzator se prazni kroz zavojnicu. Struja raste i gradi magnetsko polje, koje joj se isprva opire. Energija je pola u jednom, pola u drugom polju.',
      caption3: 'Kondenzator je prazan, a struja najveća: sva je energija u magnetskom polju zavojnice.',
      caption4: 'Magnetsko polje slabi i inducira napon koji struju tjera dalje u istom smjeru. Ona puni kondenzator obrnuto (donja ploča +).',
      caption5: 'Kondenzator je nabijen obrnuto (donja ploča +), struja je opet nula. Prošla je pola periode.',
      caption6: 'Sada se kondenzator prazni u suprotnom smjeru: struja teče obrnuto i opet gradi magnetsko polje, suprotnog smjera.',
      caption7: 'Kondenzator je opet prazan, struja najveća u suprotnom smjeru: sva je energija u magnetskom polju.',
      caption8: 'Magnetsko polje se raspada i puni kondenzator kao na početku (gornja ploča +).',
      caption9: 'Prošla je cijela perioda T: stanje je isto kao na početku i postupak kreće ispočetka. Bez gubitaka titranje ne bi prestalo; u stvarnom krugu otpor ga s vremenom priguši.',
      captionTime: ' Vrijeme {t} od nabijanja, f₀ = {f}.',
      // attribution
      credit: 'Prema apletu i slikama s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (slike: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>U titrajnom krugu zavojnica i kondenzator spojeni su u petlju. Nabijeni kondenzator ima energiju pohranjenu u električnom polju i prazni se preko zavojnice. Struja kroz zavojnicu izgrađuje magnetsko polje, koje protoku struje isprva pruža otpor.</p>' +
        '<p>Kad je kondenzator potpuno prazan, sva je energija u magnetskom polju zavojnice. To se polje tada raspada i inducira napon koji struju tjera dalje, pa se kondenzator puni u suprotnom smjeru. Zatim sve kreće obrnuto, i tako dalje: energija titra između dvaju polja, a struja i napon su sinusni i pomaknuti za četvrtinu periode.</p>' +
        '<p>Frekvencija kojom krug titra je rezonantna frekvencija, prema Thomsonovoj formuli f₀ = 1 / (2π √(L·C)). Veći induktivitet ili kapacitet daje nižu frekvenciju. Pri rezonantnoj frekvenciji otpori (reaktancije) zavojnice i kondenzatora jednaki su.</p>' +
        '<p>Ovdje krug nema gubitaka, pa titranje traje zauvijek. U stvarnom krugu otpor žice svaki put pretvori dio energije u toplinu i titranje zamire; oscilator mu tu energiju nadoknađuje.</p>'
    },
    en: {
      stage: 'Resonant circuit: the coil on the left, the capacitor on the right, with their fields; on the right the current and voltage over one period and how the energy is shared',
      // controls
      l: 'Inductance L',
      lHint: 'More inductance: slower oscillation, lower f₀.',
      c: 'Capacitance C',
      cHint: 'More capacitance: slower oscillation, lower f₀.',
      // units and numbers
      dec: '.',
      uh: '{v} µH',
      pf: '{v} pF',
      mhz: '{v} MHz',
      ns: '{v} ns',
      // presets
      presetStart: 'Start: circuit at rest',
      presetStartHint: 'L = 10 µH, C = 100 pF, capacitor not charged yet',
      presetMagnetic: 'Quarter period: all in the coil',
      presetMagneticHint: 'Capacitor empty, current at its peak',
      presetMoreC: 'Larger C: 470 pF',
      presetMoreCHint: 'Lower resonant frequency, longer period',
      presetLessL: 'Smaller L: 2.2 µH',
      presetLessLHint: 'Higher resonant frequency, shorter period',
      // legend
      legendE: 'voltage U and electric field E (capacitor)',
      legendH: 'current I and magnetic field H (coil)',
      // stage
      nameL: 'L',
      nameC: 'C',
      nameE: 'E',
      nameH: 'H',
      nameI: 'I',
      nameU: 'U',
      iZero: 'I = 0',
      axisT: 't',
      tickQuarter: 'T/4',
      tickHalf: 'T/2',
      tickThree: '3T/4',
      tickFull: 'T',
      plotTitle: 'Current I and voltage U over one period T',
      energyTitle: 'Energy',
      energyE: 'in the electric field',
      energyM: 'in the magnetic field',
      pct: '{v} %',
      formula: 'f₀ = 1 / (2π √(L·C)) = {f}',
      period: 'T = 1 / f₀ = {T}',
      timeRest: 't: capacitor not charged yet',
      timeNow: 't = {k}/8 · T = {t}',
      // captions
      caption0: 'The resonant circuit at rest: the capacitor is empty, no field, no current. The next step charges the capacitor, for example with a square pulse.',
      caption1: 'The capacitor is charged (upper plate +). All the energy is in the electric field between the plates; no current flows yet.',
      caption2: 'The capacitor discharges through the coil. The current grows and builds a magnetic field, which at first opposes it. Half the energy is in each field.',
      caption3: 'The capacitor is empty and the current at its peak: all the energy is in the coil\'s magnetic field.',
      caption4: 'The magnetic field weakens and induces a voltage that keeps the current flowing the same way. It charges the capacitor the other way round (lower plate +).',
      caption5: 'The capacitor is charged the other way round (lower plate +), and the current is zero again. Half a period has passed.',
      caption6: 'Now the capacitor discharges the other way: the current flows in reverse and again builds a magnetic field, pointing the other way.',
      caption7: 'The capacitor is empty again, the current at its peak in reverse: all the energy is in the magnetic field.',
      caption8: 'The magnetic field collapses and charges the capacitor as at the start (upper plate +).',
      caption9: 'One full period T has passed: the state is the same as at the start, and it all begins again. Without losses the oscillation would never stop; in a real circuit resistance damps it over time.',
      captionTime: ' Time {t} since charging, f₀ = {f}.',
      // attribution
      credit: 'After an applet and figures from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (figures: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>In a resonant circuit a coil and a capacitor are connected in a loop. A charged capacitor holds its energy in an electric field and discharges through the coil. The current through the coil builds a magnetic field, which at first opposes the current.</p>' +
        '<p>When the capacitor is fully empty, all the energy is in the coil\'s magnetic field. That field then collapses and induces a voltage that keeps the current flowing, so the capacitor charges the other way round. Then it all runs in reverse, and so on: the energy swings between the two fields, and current and voltage are sine waves a quarter period apart.</p>' +
        '<p>The frequency the circuit oscillates at is its resonant frequency, from Thomson\'s formula f₀ = 1 / (2π √(L·C)). More inductance or capacitance gives a lower frequency. At the resonant frequency the reactances of coil and capacitor are equal.</p>' +
        '<p>This circuit has no losses, so it oscillates for ever. In a real circuit the wire\'s resistance turns some of the energy into heat on every swing and the oscillation dies down; an oscillator makes up that energy.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
