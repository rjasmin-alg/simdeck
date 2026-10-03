/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the "trap antenna" page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   The Croatian texts of the original (50ohm-contents-hr/contents/html/applet_traps.html, CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.) are kept where they fit, and its terms are used throughout (trap,
   trap-dipol, blokirni krug, paralelni titrajni krug, zračitelj, produljna zavojnica, djelotvorna duljina); the
   English is translated from the German original (50ohm-contents-dl). Captions and explanation follow the
   50ohm-contents-hr section "traps". Terms missing from kit/glossary.js are written out here: NOTES.md "Term pairs".
   f, f_res, X, Z₀, λ, L, C and MHz are names, not words; {fres} is f with the subscript res, put in by the page. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Trap-dipol s napojnom točkom u sredini i po jednim trapom u svakoj polovici; ispod reaktancija trapa i što se promijenilo',
      dec: ',',
      // presets
      presetF80: '3,5 MHz',
      presetF80Hint: 'Ispod rezonancije trapa: cijeli dipol, trapovi produljuju',
      presetF40: '7,05 MHz',
      presetF40Hint: 'Na rezonanciji trapa: trapovi blokiraju, samo unutarnji dio',
      presetF20: '14 MHz',
      presetF20Hint: 'Iznad rezonancije trapa: cijeli dipol, trapovi skraćuju',
      // legend
      legendActive: 'aktivni dio žice: njime teče struja',
      legendX: 'reaktancija trapa X / Z₀',
      // stage
      feed: 'napojna točka',
      meters: '{m} m',
      activeLen: 'aktivna žica: {m} m',
      activeNone: 'bez pobude: nijedan dio antene nije aktivan',
      trapLabel: 'trap',
      chartTitle: 'Reaktancija trapa ovisno o frekvenciji',
      axisX: 'f / f_res',
      zoneInd: 'induktivno',
      zoneCap: 'kapacitivno',
      zoneBlock: 'blokira',
      readTitle: 'Što se promijenilo',
      rowF: 'Frekvencija',
      rowTrap: 'Trap',
      rowActive: 'Aktivni dio',
      rowEffect: 'Zračitelj',
      rowHalf: 'λ/2',
      fNone: 'bez pobude',
      fValue: '{f} MHz',
      fLess: '{f} MHz < {fres} = 7,05 MHz',
      fEq: '{f} MHz = {fres}',
      fMore: '{f} MHz > {fres} = 7,05 MHz',
      trapNone: 'nema struje',
      trapInductive: 'prevladava induktivno djelovanje, kao produljna zavojnica',
      trapBlocks: 'visokoomski: blokirni krug',
      trapCapacitive: 'prevladava kapacitivno djelovanje',
      activeNoneRow: 'nijedan',
      activeInner: 'samo unutarnji dio: 2 × 10,07 m = 20,14 m',
      activeWhole: 'cijela žica: 2 × (10,07 + 6,71) m = 33,56 m',
      effectNone: '—',
      effectLonger: 'električki produljen',
      effectEnds: 'završava otprilike na trapovima',
      effectShorter: 'električki skraćen',
      halfNone: '—',
      halfValue: '{m} m u slobodnom prostoru',
      // captions
      caption0: 'Trap-dipol bez pobude: nijedan dio antene nije aktivan. U svakoj polovici, 10,07 m od napojne točke, nalazi se trap: paralelni titrajni krug ugođen na {fres} = 7,05 MHz.',
      caption1: '3,5 MHz < 7,05 MHz: prevladava induktivno djelovanje, trapovi električki produljuju zračitelj. Aktivan je cijeli dipol, pa je upotrebljiv na nižem pojasu.',
      caption2: '7,05 MHz = {fres}: trapovi blokiraju. Vanjski dijelovi gotovo su odvojeni, djelotvorna duljina je 2 × 10,07 m = 20,14 m, otprilike pola valne duljine.',
      caption3: '14 MHz > 7,05 MHz: prevladava kapacitivno djelovanje trapova, zračitelj se električki skraćuje. Struja prolazi kroz trapove i aktivna je cijela žica.',
      // attribution
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (slike: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Poluvalni dipol napajan u sredini rezonantan je na svojoj osnovnoj frekvenciji i na njezinim neparnim višekratnicima. Na parnim višekratnicima u napojnoj je točki strujni minimum i visoka impedancija. Trap-dipol (blokirni dipol) daje istoj žici više električnih duljina.</p>' +
        '<p>U svakoj polovici nalazi se trap: paralelni titrajni krug od zavojnice i kondenzatora. Na svojoj rezonantnoj frekvenciji f<sub>res</sub> visokoomski je i djeluje kao blokirni krug: struja gotovo ne teče u vanjski dio, pa se dipol ponaša kao da završava na trapovima. Razmak između trapova tada određuje djelotvornu duljinu.</p>' +
        '<p>Ispod f<sub>res</sub> prevladava zavojnica: trap djeluje kao produljna zavojnica i cijeli dipol, s vanjskim dijelovima, radi na nižem pojasu. Iznad f<sub>res</sub> prevladava kondenzator i zračitelj se električki skraćuje; i to treba uzeti u obzir pri dimenzioniranju.</p>' +
        '<p>Krivulja X / Z₀ = x / (1 − x²), s x = f / f<sub>res</sub> i Z₀ = √(L/C), pokazuje reaktanciju trapa: pozitivna (induktivna) ispod rezonancije, negativna (kapacitivna) iznad nje, a na samoj rezonanciji neograničeno raste. S više parova trapova dobiva se još više pojaseva; trapovi za najvišu frekvenciju stoje najbliže sredini.</p>'
    },
    en: {
      stage: 'A trap dipole fed in the middle, with one trap in each half; below, the trap\'s reactance and what changed',
      dec: '.',
      // presets
      presetF80: '3.5 MHz',
      presetF80Hint: 'Below the trap\'s resonance: the whole dipole, the traps lengthen it',
      presetF40: '7.05 MHz',
      presetF40Hint: 'At the trap\'s resonance: the traps block, only the inner part',
      presetF20: '14 MHz',
      presetF20Hint: 'Above the trap\'s resonance: the whole dipole, the traps shorten it',
      // legend
      legendActive: 'active wire: current flows in it',
      legendX: 'trap reactance X / Z₀',
      // stage
      feed: 'feed point',
      meters: '{m} m',
      activeLen: 'active wire: {m} m',
      activeNone: 'no excitation: no part of the antenna is active',
      trapLabel: 'trap',
      chartTitle: 'The trap\'s reactance against frequency',
      axisX: 'f / f_res',
      zoneInd: 'inductive',
      zoneCap: 'capacitive',
      zoneBlock: 'blocks',
      readTitle: 'What changed',
      rowF: 'Frequency',
      rowTrap: 'Trap',
      rowActive: 'Active part',
      rowEffect: 'Radiator',
      rowHalf: 'λ/2',
      fNone: 'no excitation',
      fValue: '{f} MHz',
      fLess: '{f} MHz < {fres} = 7.05 MHz',
      fEq: '{f} MHz = {fres}',
      fMore: '{f} MHz > {fres} = 7.05 MHz',
      trapNone: 'no current',
      trapInductive: 'its inductive effect wins, like a loading coil',
      trapBlocks: 'high impedance: a blocking circuit',
      trapCapacitive: 'its capacitive effect wins',
      activeNoneRow: 'none',
      activeInner: 'only the inner part: 2 × 10.07 m = 20.14 m',
      activeWhole: 'the whole wire: 2 × (10.07 + 6.71) m = 33.56 m',
      effectNone: '—',
      effectLonger: 'electrically lengthened',
      effectEnds: 'ends at about the traps',
      effectShorter: 'electrically shortened',
      halfNone: '—',
      halfValue: '{m} m in free space',
      // captions
      caption0: 'A trap dipole without excitation: no part of the antenna is active. In each half, 10.07 m from the feed point, sits a trap: a parallel resonant circuit tuned to {fres} = 7.05 MHz.',
      caption1: '3.5 MHz < 7.05 MHz: the inductive effect wins, and the traps lengthen the radiator electrically. The whole dipole is active, so it works on the lower band.',
      caption2: '7.05 MHz = {fres}: the traps block. The outer parts are all but cut off; the effective length is 2 × 10.07 m = 20.14 m, about half a wavelength.',
      caption3: '14 MHz > 7.05 MHz: the traps\' capacitive effect wins, and the radiator is shortened electrically. Current passes through the traps and the whole wire is active.',
      // attribution
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (figures: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>A half-wave dipole fed in the middle is resonant at its fundamental frequency and at its odd multiples. At the even multiples the feed point sees a current minimum and a high impedance. A trap dipole gives the same wire several electrical lengths.</p>' +
        '<p>Each half holds a trap: a parallel resonant circuit of a coil and a capacitor. At its resonant frequency f<sub>res</sub> it has a high impedance and acts as a blocking circuit: hardly any current flows into the outer part, so the dipole behaves as if it ended at the traps. The distance between the traps then sets the effective length.</p>' +
        '<p>Below f<sub>res</sub> the coil wins: the trap acts like a loading coil, and the whole dipole, outer parts included, works on the lower band. Above f<sub>res</sub> the capacitor wins and the radiator is shortened electrically; a design has to allow for that too.</p>' +
        '<p>The curve X / Z₀ = x / (1 − x²), with x = f / f<sub>res</sub> and Z₀ = √(L/C), shows the trap\'s reactance: positive (inductive) below resonance, negative (capacitive) above it, and growing without bound at resonance itself. More pairs of traps give more bands; the traps for the highest frequency sit closest to the middle.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
