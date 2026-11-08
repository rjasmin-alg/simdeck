/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of line-coding, in both languages (docs/sim-ui.md §9). Same keys in hr and en; {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *word* is an
   English term in italics (the page turns it into <em lang="en">; term pairs not in the glossary yet, NOTES.md).
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Bitovi kao NRZ i Manchester signal, s bitovima koje primatelj pročita',

      pattern: 'Niz bitova',
      opt_own: 'vlastiti (klikni ćelije)',
      drift: 'Odstupanje takta primatelja',
      driftHint: '+ znači da je takt primatelja sporiji, − da je brži.',
      showClock: 'Takt pošiljatelja',
      lanes: 'Prikaz',
      opt_both: 'oba',
      opt_nrz: 'NRZ',
      opt_manchester: 'Manchester',

      preset_book_1001: 'Knjiga: 1 0 0 1',
      preset_book_1101: 'Knjiga: 1 1 0 1',
      preset_long_run: 'Dugi niz, +10 %',
      preset_alternating: 'Izmjena, +10 %',
      preset_all_ones: 'Samo jedinice',
      hint_book_1001: 'Primjer iz poglavlja 6: dvije nule zaredom, skok na granici između njih.',
      hint_book_1101: 'Pitanje 4 iz poglavlja 6: skok na granici između dviju jedinica.',
      hint_long_run: 'Osam nula pa osam jedinica uz 10 % sporiji takt: NRZ pročita 14 bitova umjesto 16.',
      hint_alternating: 'Bitovi se izmjenjuju: NRZ ima prijelaz na svakoj granici ćelija i ne griješi ni uz odstupanje.',
      hint_all_ones: '16 jedinica: NRZ je ravna crta, Manchester ima 31 prijelaz.',

      legNrz: 'NRZ',
      legMan: 'Manchester',
      legJump: 'skok na granici',
      legMid: 'usred ćelije',
      legSample: 'primatelj čita',
      legMiss: 'krivo pročitano',
      legClock: 'takt',
      legChanged: 'promijenjeno',

      rowBits: 'Bitovi',
      rowRead: 'Primatelj čita',
      rowClock: 'Takt',
      laneNrz: 'NRZ',
      laneMan: 'Manchester',
      transitions: ['{n} prijelaz', '{n} prijelaza', '{n} prijelaza'],
      manSplit: '{mid} usred · {b} na granici',
      readOk: '✓ {got} od {n}',
      readBad: '✕ {got} umjesto {n}',
      noTrans: 'nema prijelaza',
      lost: 'izgubljen',
      wrong: 'krivo',
      extra: 'višak',
      cellLabel: 'Ćelija {i}: bit {b}. Klikni za promjenu.',
      add: 'Dodaj bit',
      remove: 'Ukloni zadnji bit',
      whyNoAdd: 'Niz ima najviše 16 bitova.',
      whyNoRemove: 'Niz ima barem jedan bit.',

      bitsN: ['{n} bit', '{n} bita', '{n} bitova'],
      zeros: ['nule', 'nule', 'nula'],
      ones: ['jedinice', 'jedinice', 'jedinica'],
      zeroPair: 'dvije nule',
      onePair: 'dvije jedinice',
      downDir: 'iz visokog u niski',
      upDir: 'iz niskog u visoki',

      capNrzFlat: 'NRZ je jedna ravna crta: nema nijednog prijelaza, pa primatelj nema na čemu uskladiti svoj *clock* (takt). Bez preambule ne bi našao ni granicu prve ćelije.',
      capNrzDrift: 'S odstupanjem takta od {d}, NRZ čita niz od {k} {what} kao {r}: unutar niza nema prijelaza na kojem bi se uskladio. Primatelj dobiva {got} umjesto {n}.',
      capNrzExact: 'NRZ: {m}. Uz točan takt primatelj prebroji i niz od {k} jednakih ćelija; pomakni odstupanje takta.',
      capNrzOk: 'NRZ: {m}; primatelj se usklađuje na svakom i ispravno čita {n}.',
      capManJump: 'Ćelije {a} i {b} nose {pair}: Manchester svakoj daje vlastiti prijelaz {dir} usred ćelije, a skok na granici između njih nije bit.',
      capManNoJump: 'Manchester: {m}, svi usred ćelija; susjedni bitovi su različiti, pa nema skokova na granici.',
      capManAll: 'Manchester ispravno čita {n}.',
      capManOne: 'Manchester: jedan prijelaz, usred jedine ćelije; primatelj čita njegov smjer.',
      capNrzGot: 'S odstupanjem takta od {d} primatelj dobiva {got} umjesto {n}.',
      capManCost: 'Manchester ima {m} za {n}.',

      explain: '<p><em lang="en">Line coding</em> (linijsko kodiranje) preslika niz bitova u oblik signala. ' +
        'Svaki bit dobiva jednu <em lang="en">bit cell</em> (bitna ćelija): vremenski prozor uvijek iste duljine. ' +
        'Primatelj mora znati gdje ćelija počinje i završava, a takt se ne šalje zasebnom žicom: mora se moći izvući iz samog signala.</p>' +
        '<p><strong>NRZ</strong> drži razinu cijelu ćeliju: 1 visoko, 0 nisko (u nekim je udžbenicima obrnuto). ' +
        'Dva jednaka bita zaredom nemaju prijelaz između sebe, pa primatelj u dugom nizu broji ćelije vlastitim taktom. ' +
        'Ako mu je takt 10 % sporiji, u nizu od šest ili više jednakih bitova izgubi jedan bit; ako je brži, dobije višak.</p>' +
        '<p><strong>Manchester</strong> (10BASE-T Ethernet) ima prijelaz usred svake ćelije: iz niskog u visoki je 1, iz visokog u niski 0. ' +
        'Primatelj ne čita razinu nego smjer tog prijelaza, i na svakom se iznova uskladi. ' +
        'Dva jednaka bita zaredom traže skok na granici između ćelija, koji nije bit.</p>' +
        '<p>Cijena: razina se može promijeniti dvaput u svakoj ćeliji, pa najkraći dio signala traje pola ćelije. 10 Mb/s Manchester zato radi na 20 Mbaud: 20 milijuna signalnih elemenata u sekundi, dvaput više nego NRZ. ' +
        'Brži Ethernet zato koristi štedljivije kodove (4B/5B, 8B/10B, 64B/66B, MLT-3, PAM), koji ovdje nisu prikazani.</p>' +
        '<p>Model odstupanja izveden je za ovu stranicu: primatelj zna gdje niz počinje (to inače daje preambula) i čita u sredini svoje ćelije.</p>' +
        '<p>Izvor: <em>Uvod u računalne mreže</em>, poglavlje 6, „Kako signal nosi bitove”; IEEE 802.3, poglavlja 7 i 14.</p>'
    },

    en: {
      stage: 'Bits as an NRZ and a Manchester signal, with the bits the receiver reads',

      pattern: 'Bit string',
      opt_own: 'own (click the cells)',
      drift: 'Receiver clock drift',
      driftHint: '+ means the receiver\'s clock is slower, − that it is faster.',
      showClock: 'Sender\'s clock',
      lanes: 'Show',
      opt_both: 'both',
      opt_nrz: 'NRZ',
      opt_manchester: 'Manchester',

      preset_book_1001: 'Book: 1 0 0 1',
      preset_book_1101: 'Book: 1 1 0 1',
      preset_long_run: 'Long run, +10 %',
      preset_alternating: 'Alternating, +10 %',
      preset_all_ones: 'All ones',
      hint_book_1001: 'The example from chapter 6: two zeros in a row, a jump at the boundary between them.',
      hint_book_1101: 'Question 4 from chapter 6: a jump at the boundary between the two ones.',
      hint_long_run: 'Eight zeros then eight ones with a 10 % slower clock: NRZ reads 14 bits instead of 16.',
      hint_alternating: 'The bits alternate: NRZ has a transition at every cell boundary and stays right even with drift.',
      hint_all_ones: '16 ones: NRZ is a flat line, Manchester has 31 transitions.',

      legNrz: 'NRZ',
      legMan: 'Manchester',
      legJump: 'boundary jump',
      legMid: 'mid-cell',
      legSample: 'receiver reads',
      legMiss: 'misread',
      legClock: 'clock',
      legChanged: 'changed',

      rowBits: 'Bits',
      rowRead: 'Receiver reads',
      rowClock: 'Clock',
      laneNrz: 'NRZ',
      laneMan: 'Manchester',
      transitions: ['{n} transition', '{n} transitions'],
      manSplit: '{mid} mid-cell · {b} at a boundary',
      readOk: '✓ {got} of {n}',
      readBad: '✕ {got} instead of {n}',
      noTrans: 'no transitions',
      lost: 'lost',
      wrong: 'wrong',
      extra: 'extra',
      cellLabel: 'Cell {i}: bit {b}. Click to change it.',
      add: 'Add a bit',
      remove: 'Remove the last bit',
      whyNoAdd: 'The string has at most 16 bits.',
      whyNoRemove: 'The string has at least one bit.',

      bitsN: ['{n} bit', '{n} bits'],
      zeros: ['zero', 'zeros'],
      ones: ['one', 'ones'],
      zeroPair: 'two zeros',
      onePair: 'two ones',
      downDir: 'from high to low',
      upDir: 'from low to high',

      capNrzFlat: 'NRZ is one flat line: there is no transition at all, so the receiver has nothing to align its clock on. Without a preamble it would not even find the first cell boundary.',
      capNrzDrift: 'With {d} clock drift, NRZ reads the run of {k} {what} as {r}: there is no transition to resynchronise on. The receiver gets {got} instead of {n}.',
      capNrzExact: 'NRZ: {m}. With an exact clock the receiver counts even a run of {k} equal cells; try some clock drift.',
      capNrzOk: 'NRZ: {m}; the receiver re-aligns on each one and reads all {n}.',
      capManJump: 'Cells {a} and {b} carry {pair}: Manchester gives each its own transition {dir} in the middle of the cell, and the jump at the boundary between them is not a bit.',
      capManNoJump: 'Manchester: {m}, all in the middle of a cell; neighbouring bits differ, so there are no boundary jumps.',
      capManAll: 'Manchester reads all {n}.',
      capManOne: 'Manchester: one transition, in the middle of the only cell; the receiver reads its direction.',
      capNrzGot: 'With {d} clock drift the receiver gets {got} instead of {n}.',
      capManCost: 'Manchester has {m} for {n}.',

      explain: '<p><strong>Line coding</strong> maps a string of bits onto the shape of a signal. ' +
        'Each bit gets one <em>bit cell</em>: a time window of always the same length. ' +
        'The receiver must know where each cell starts and ends, and the clock is not sent on a wire of its own: it has to be recoverable from the signal itself.</p>' +
        '<p><strong>NRZ</strong> holds the level for the whole cell: 1 high, 0 low (some textbooks swap them). ' +
        'Two equal bits in a row have no transition between them, so in a long run the receiver counts cells with its own clock. ' +
        'If its clock is 10 % slower, a run of six or more equal bits loses a bit; if it is faster, it gains one.</p>' +
        '<p><strong>Manchester</strong> (10BASE-T Ethernet) has a transition in the middle of every cell: low to high is 1, high to low is 0. ' +
        'The receiver reads the direction of that transition, not the level, and re-aligns on every one. ' +
        'Two equal bits in a row need a jump at the boundary between the cells, which is not a bit.</p>' +
        '<p>The cost: the level may change twice in every cell, so the shortest piece of signal lasts half a cell. 10 Mb/s Manchester therefore runs at 20 Mbaud: 20 million signal elements a second, twice as many as NRZ. ' +
        'Faster Ethernet therefore uses thriftier codes (4B/5B, 8B/10B, 64B/66B, MLT-3, PAM), not shown here.</p>' +
        '<p>The drift model is derived for this page: the receiver knows where the string starts (normally the preamble\'s job) and reads in the middle of its own cell.</p>' +
        '<p>Source: <em>Uvod u računalne mreže</em> (Introduction to computer networks), chapter 6, "How a signal carries bits"; IEEE 802.3, clauses 7 and 14.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
