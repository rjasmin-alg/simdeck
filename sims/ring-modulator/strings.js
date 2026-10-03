/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the ring modulator page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_ringmodulator.html and the ring mixer's text in sections/mischer_2.md of the
   German original (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; Croatian applet by the
   50ohm-contents-hr team; changed), English written for simdeck from them. Terms missing from kit/glossary.js (ring
   modulator, mixer, centre tap, local oscillator, mixing product) are written out here: NOTES.md "Term pairs".
   Values in captions are nodes (bold). U₁, U₂, U₃ and D1…D4 are names, not words. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Prstenasti modulator: dva transformatora i četiri diode u prstenu, desno naponi U₂, U₁ i U₃ kroz vrijeme',
      // controls
      u1: 'Vršni napon Û₁',
      u1Hint: 'Amplituda ulaznog napona U₁. Mora ostati osjetno manja od U₂ = 1 V, da diode sklapa samo U₂.',
      r: 'Omjer f₂ / f₁',
      rHint: 'Koliko perioda napona U₂ stane u jednu periodu napona U₁.',
      // units and numbers
      volt: '{v} V',
      dec: ',',
      ratio: '{v} : 1',
      // presets
      presetStart: 'Û₁ = 0,6 V, f₂ = 6 · f₁',
      presetStartHint: 'Jedna perioda napona U₁ u 12 poluperioda napona U₂',
      presetCoarse: 'f₂ = 2 · f₁',
      presetCoarseHint: 'Malo preklapanja po periodi napona U₁',
      presetNone: 'Û₁ = 0',
      presetNoneHint: 'Samo U₂: na izlaz ne dolazi ništa',
      presetLarge: 'Û₁ = 1 V',
      presetLargeHint: 'U₁ jednako velik kao U₂',
      // legend
      legendUpper: 'put od gornjeg kraja T1',
      legendLower: 'put od donjeg kraja T1',
      legendBlocked: 'dioda zapire',
      legendNow: 'trenutna poluperioda',
      // stage
      t1: 'T1',
      t2: 'T2',
      d1: 'D1', d2: 'D2', d3: 'D3', d4: 'D4',
      tTime: 't',
      nameU1: 'U₁',
      nameU2: 'U₂',
      nameU3: 'U₃',
      plusHalf: '{s}1 V + U₁/2',
      minusHalf: '{s}1 V − U₁/2',
      tap1: '{s}1 V',
      tap2: '0 V',
      restTitle: 'Bez sklopnog stanja',
      restText: 'Svaki korak je jedna poluperioda napona U₂. Pritisnite → za prvu.',
      case1Title: 'Slučaj 1: U₂ > 0',
      case2Title: 'Slučaj 2: U₂ < 0',
      formula1: 'U₃ = (+1 V + U₁/2) − (+1 V − U₁/2) = U₁',
      formula2: 'U₃ = (−1 V − U₁/2) − (−1 V + U₁/2) = −U₁',
      readNow: 'U₁ = {u}  →  U₃ = {u3}',
      // captions
      captionRest: 'Prstenasti modulator u mirovanju. U₁ dolazi na T1, oscilator U₂ je između srednjih izvoda T1 i T2, a izlaz U₃ je na T2. Diode su idealne, transformatori prenose 1 : 1, a U₂ je pravokutni napon od ±1 V.',
      caption1: 'Poluperioda {n}, U₂ = +1 V: vode D1 i D3, D2 i D4 zapiru. Gornji kraj T1 dolazi na donji kraj T2, pa je U₃ = U₁ = {u3}.',
      caption2: 'Poluperioda {n}, U₂ = −1 V: vode D2 i D4, D1 i D3 zapiru. Gornji kraj T1 sada dolazi na gornji kraj T2, pa je U₃ = −U₁ = {u3}.',
      captionNone: ' Bez ulaznog napona izlaz ostaje nula, iako diode i dalje preklapaju: napon U₂ ne dolazi na izlaz.',
      captionLast: ' U₃ je U₁ pomnožen s U₂ / 1 V: prsten je preklopka polariteta, i množenje U₁ i U₂ funkcionira.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu i slikama s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (slike: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Prstenasti modulator (prstenasti ili balansni mješač) ima četiri diode spojene u prsten: katoda svake diode spojena je s anodom sljedeće. Po tome se razlikuje od mosnog ispravljača, kod kojega su spojene po dvije katode i dvije anode.</p>' +
        '<p>Oscilator (U₂) uvijek otvara dvije nasuprotne diode za vrijeme jedne poluperiode, dok druge dvije zapiru. U sljedećoj poluperiodi je obrnuto. Zato diodni prsten radi kao preklopka polariteta za ulazni signal U₁: U₃ = U₁ · U₂ / 1 V.</p>' +
        '<p>Ovdje se zanemaruju pragovi napona dioda, transformatori prenose u omjeru 1 : 1, a U₂ je pravokutni napon. To dovodi do naglog (tvrdog) preklapanja. Izlazni filtar mora naknadno ukloniti visoke frekvencije koje pritom nastaju.</p>' +
        '<p>Množenje stvara nove frekvencije, produkte miješanja f₂ + f₁ i f₂ − f₁, a zbog simetrije sklopa ni U₁ ni U₂ sami ne dolaze na izlaz. Za dobar rezultat amplituda napona U₁ mora biti znatno manja od amplitude oscilatora.</p>'
    },
    en: {
      stage: 'Ring modulator: two transformers and four diodes in a ring, to the right the voltages U₂, U₁ and U₃ over time',
      u1: 'Peak voltage Û₁',
      u1Hint: 'Amplitude of the input voltage U₁. It must stay well below U₂ = 1 V, so that only U₂ switches the diodes.',
      r: 'Ratio f₂ / f₁',
      rHint: 'How many periods of U₂ fit into one period of U₁.',
      volt: '{v} V',
      dec: '.',
      ratio: '{v} : 1',
      presetStart: 'Û₁ = 0.6 V, f₂ = 6 · f₁',
      presetStartHint: 'One period of U₁ in 12 half periods of U₂',
      presetCoarse: 'f₂ = 2 · f₁',
      presetCoarseHint: 'Few switchings per period of U₁',
      presetNone: 'Û₁ = 0',
      presetNoneHint: 'Only U₂: nothing reaches the output',
      presetLarge: 'Û₁ = 1 V',
      presetLargeHint: 'U₁ as large as U₂',
      legendUpper: 'path from T1\'s upper end',
      legendLower: 'path from T1\'s lower end',
      legendBlocked: 'diode blocks',
      legendNow: 'current half period',
      t1: 'T1',
      t2: 'T2',
      d1: 'D1', d2: 'D2', d3: 'D3', d4: 'D4',
      tTime: 't',
      nameU1: 'U₁',
      nameU2: 'U₂',
      nameU3: 'U₃',
      plusHalf: '{s}1 V + U₁/2',
      minusHalf: '{s}1 V − U₁/2',
      tap1: '{s}1 V',
      tap2: '0 V',
      restTitle: 'No switching state',
      restText: 'Each step is one half period of U₂. Press → for the first.',
      case1Title: 'Case 1: U₂ > 0',
      case2Title: 'Case 2: U₂ < 0',
      formula1: 'U₃ = (+1 V + U₁/2) − (+1 V − U₁/2) = U₁',
      formula2: 'U₃ = (−1 V − U₁/2) − (−1 V + U₁/2) = −U₁',
      readNow: 'U₁ = {u}  →  U₃ = {u3}',
      captionRest: 'The ring modulator at rest. U₁ comes in on T1, the oscillator U₂ sits between the centre taps of T1 and T2, and the output U₃ is on T2. The diodes are ideal, the transformers 1 : 1, and U₂ is a square wave of ±1 V.',
      caption1: 'Half period {n}, U₂ = +1 V: D1 and D3 conduct, D2 and D4 block. T1\'s upper end reaches T2\'s lower end, so U₃ = U₁ = {u3}.',
      caption2: 'Half period {n}, U₂ = −1 V: D2 and D4 conduct, D1 and D3 block. T1\'s upper end now reaches T2\'s upper end, so U₃ = −U₁ = {u3}.',
      captionNone: ' With no input the output stays at zero, although the diodes keep switching: U₂ does not reach the output.',
      captionLast: ' U₃ is U₁ multiplied by U₂ / 1 V: the ring is a polarity switch, and multiplying U₁ by U₂ works.',
      credit: 'After an applet and figures from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam (figures: DL9MJ), AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>A ring modulator (ring mixer, balanced mixer) has four diodes connected in a ring: each diode\'s cathode goes to the next one\'s anode. That tells it apart from a bridge rectifier, where two cathodes and two anodes are joined.</p>' +
        '<p>The oscillator (U₂) turns on two opposite diodes for one half period while the other two block. In the next half period it is the other way round. So the diode ring works as a polarity switch for the input signal U₁: U₃ = U₁ · U₂ / 1 V.</p>' +
        '<p>Here the diodes\' threshold voltages are ignored, the transformers are 1 : 1, and U₂ is a square wave. That makes the switching abrupt (hard). An output filter has to remove the high frequencies this creates.</p>' +
        '<p>The multiplication creates new frequencies, the mixing products f₂ + f₁ and f₂ − f₁, and because the circuit is symmetric neither U₁ nor U₂ alone reaches the output. For a good result the amplitude of U₁ must be much smaller than the oscillator\'s.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
