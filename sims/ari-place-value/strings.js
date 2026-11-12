/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-place-value, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Captions come in three registers, one per audience: T (teacher), A (adult, why it works), C (child, the school
   words). Numbers and digits are filled in by the page as nodes (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Mjesna vrijednost',

      // audience switch (header), the same words as the other ari- pages
      audLabel: 'Prikaz',
      audGroup: 'Za koga je prikaz',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju u razredu: bilo koji broj, bilo koja baza, tipična pogreška.',
      audAdultHint: 'Za roditelja ili ponavljanje: svaki potez kaže zašto broj ostaje isti.',
      audChildHint: 'Za 2. do 4. razred: velike znamenke, školske riječi, baza 10.',

      // number field (panel)
      numsTitle: 'Broj',
      numsLabel: 'Upiši broj u bazi {b}',
      numsHint: 'Do 9999 (dekadski).',
      errDigit: '„{at}” nije znamenka baze {b}.',
      errMax: 'Najviše 9999 (dekadski).',
      errEmpty: 'Upiši broj.',

      // params
      base: 'Baza',
      baseHint: 'Ista količina, druge skupine i druge znamenke.',
      baseQuick: 'Česte baze',
      baseName2: 'binarno',
      baseName8: 'oktalno',
      baseName10: 'dekadski',
      baseName16: 'heksadekadski',
      mistake: 'Tipična pogreška',
      mNone: 'nema',
      mSquash: 'puno mjesto napisano kako jest',
      mZero: 'izostavljena nula',
      mDecimal: 'čitanje kao dekadski',
      regroupAll: 'Pregrupiraj sve',
      regroupAllHint: 'Pregrupiraj sve: svako mjesto ispod baze',

      // presets
      pBuild: 'Broj 347',
      pBuildHint: '3 stotice, 4 desetice, 7 jedinica',
      pThirteen: '13 jedinica',
      pThirteenHint: '2 desetice i 13 jedinica: zamijeni 10 jedinica za 1 deseticu',
      pZero: 'Nula čuva mjesto',
      pZeroHint: '307: nijedne desetice',
      pBin: 'Baza 2',
      pBinHint: '1101 u bazi 2 je 13',
      pOct: 'Osam jedinica u bazi 8',
      pOctHint: 'Pune skupine od 8: zapisano 10',
      pHex: 'Baza 16',
      pHexHint: 'FF u bazi 16 je 255',

      // legend
      legOver: 'puno mjesto',
      legChanged: 'zadnji potez',

      // mat
      mat: 'Tablica mjesnih vrijednosti s kockicama',
      place0: 'J',
      place1: 'D',
      place2: 'S',
      place3: 'T',
      placeName0: 'jedinice',
      placeName1: 'desetice',
      placeName2: 'stotice',
      placeName3: 'tisućice',
      placeName: 'mjesto vrijednosti {v}',
      colBlocks: '{col}: {u}',
      btnAdd: 'Dodaj: {u}',
      btnRemove: 'Oduzmi: {u}',
      btnRegroup: 'Zamijeni {from} za {to}',
      btnBreak: 'Rastavi {from} na {to}',

      // units with counts (plural forms)
      u0: ['{n} jedinica', '{n} jedinice', '{n} jedinica'],
      u1: ['{n} desetica', '{n} desetice', '{n} desetica'],
      u2: ['{n} stotica', '{n} stotice', '{n} stotica'],
      u3: ['{n} tisućica', '{n} tisućice', '{n} tisućica'],
      uGen: ['{n} blok od {v}', '{n} bloka od {v}', '{n} blokova od {v}'],
      one0: '1 jedinicu',
      one1: '1 deseticu',
      one2: '1 stoticu',
      one3: '1 tisućicu',
      oneGen: '1 blok od {v}',
      blocks: ['{n} kockica', '{n} kockice', '{n} kockica'],
      col0: 'Jedinice',
      col1: 'Desetice',
      col2: 'Stotice',
      col3: 'Tisućice',
      colGen: 'Blokovi od {v}',
      colOf0: 'jedinica',
      colOf1: 'desetica',
      colOf2: 'stotica',
      colOf3: 'tisućica',
      colOfGen: 'blokova od {v}',

      // refusals (said once in the caption, and in the button's tooltip)
      rPlace: 'baza {b} nema mjesta lijevo od ovoga do 9999',
      rFull: 'stupac {col} je pun: najviše {cap}',
      rFullRight: 'stupac {col} imao bi {after}, a najviše je {cap}',
      rMax: 'broj bi prešao 9999',
      rEmpty: 'u stupcu {col} nema kockica',
      rFew: 'za zamjenu treba {need}, a ovdje: {have}',
      rOnes: 'jedinica se ne rastavlja: to je najmanji dio',
      cRefused: 'Ne može: {why}.',

      // paper (kit view K5)
      paper: 'Broj zapisan znamenkama',
      paperHead: 'Zapis',
      decimal: 'dekadski',
      overCell: 'ne stane u jedno mjesto: {c}',
      overNote: 'Puno mjesto nije znamenka: najprije pregrupiraj.',

      // other bases
      bTitle: 'Isti broj, druge baze',
      bBase: 'baza {b}',
      bHere: 'ovdje',
      bSame: 'Uvijek {nU}: mijenja se samo veličina skupina.',

      // mistake card
      mtHead: 'Tipična pogreška',
      mtSquash: 'puno mjesto napisano kako jest',
      mtZero: 'izostavljena nula',
      mtDecimal: 'čitanje kao dekadski',
      mtInstead: 'umjesto {res}',
      whySquash: 'U jedno mjesto ide jedna znamenka. Broj kockica stupca {col} napisan kao „{ct}” gura sve lijevo za jedno mjesto; najprije zamijeni {b} za 1 lijevo.',
      whySquashSame: 'Puno je samo najviše mjesto, pa zapis slučajno izlazi točan. Čim se napuni niže mjesto, sve lijevo pomakne se za jedno mjesto.',
      whyZero: 'Bez nule znamenke se pomaknu udesno i vrijede manje: nula čuva prazno mjesto.',
      whyDecimal: 'Iste znamenke, ali mjesta baze {b} vrijede {pv}, a ne {tens}.',
      whyDecimalSame: 'Jednoznamenkast broj isti je u svakoj bazi u kojoj postoji ta znamenka; razlika se vidi tek s dva mjesta.',
      naNofull: 'Ovdje nijedno mjesto nije puno. Dodaj kockice dok ih u jednom stupcu ne bude {b} ili više, ili probaj „13 jedinica”.',
      naNozero: 'Ovaj broj nema nulu. Probaj „Nula čuva mjesto”.',
      naBase10: 'U bazi 10 nema razlike. Prebaci na bazu 2 ili 8, ili probaj „Baza 2”.',
      naLetters: 'Ovaj zapis ima slova (A–F), pa se ne može ni pročitati kao dekadski.',
      wrongCell: 'pogrešno: {w}',

      // captions: what the last move did
      cAddT: '+ {u}: broj je veći za {v}.',
      cAddC: 'Još {u}.',
      cRemoveT: '− {u}: broj je manji za {v}.',
      cRemoveC: '{u} manje.',
      cRegroupT: '{from} = {to}: zamijenjeno, broj je i dalje {n}.',
      cRegroupA: 'Mjesto lijevo vrijedi {b} puta više, zato je zamjena točna: {from} = {to}. Ništa nije dodano ni oduzeto, samo pregrupirano.',
      cRegroupC: '{from} = {to}.',
      cBreakT: '{from} = {to}: rastavljeno, broj je i dalje {n}.',
      cBreakA: 'Isto kao zamjena, unatrag: {from} vrijedi koliko {to}. To trebaš kad oduzimaš, a na mjestu nema dovoljno.',
      cBaseT: 'Baza {b}: ista količina, {nU}, sada u skupinama po {b}.',
      cBaseA: 'Količina se ne mijenja; mijenja se koliko kockica čini jedan blok sljedećeg mjesta, pa se mijenjaju i znamenke.',
      cAllT: 'Sve pregrupirano: nijedno mjesto nema {b} ili više kockica.',
      cStartT: 'Svaka kockica vrijedi koliko kaže njezin stupac. Gradi broj tipkama + i −, a puni stupac zamijeni (⇐).',
      cStartA: 'Znamenka vrijedi znamenka puta vrijednost mjesta, a svako mjesto vrijedi {b} puta više od mjesta desno.',
      cStartC: 'Složi broj od kockica.',

      // captions: the number
      cOverT: '{col}: {c}, a u jednu znamenku stane najviše {max}. Zamijeni {b} za 1 lijevo (⇐).',
      cOverC: '{u}: previše za jedno mjesto. Zamijeni {b} za 1 lijevo.',
      cExpand: '{num} = {terms} = {worths}',
      cExpandDec: '{num} = {terms} = {worths} = {n} (dekadski)',
      cExpand1: '{num} = {terms}',
      cExpandDec1: '{num} = {terms} = {n} (dekadski)',
      cBlocks1: 'Kockice: {terms} = {n}.',
      cBlocks: 'Kockice: {terms} = {worths} = {n}.',
      cChild: '{num}: {parts}.',
      cAnd: ' i ',

      explain: '<p>Znamenka vrijedi onoliko koliko kaže njezino mjesto: u broju 347 trojka vrijedi 3 stotice, ' +
        'to jest 300, četvorka 40, a sedmica 7. Broj je zbroj tih vrijednosti: 347 = 3 · 100 + 4 · 10 + 7 · 1.</p>' +
        '<p>Svako mjesto vrijedi deset puta više od mjesta desno od njega. Zato deset jedinica možemo zamijeniti za ' +
        'jednu deseticu, a deset desetica za jednu stoticu: to je pregrupiranje, količina se ne mijenja. U jedno ' +
        'mjesto stane jedna znamenka, 0 do 9; kad se skupi deset ili više, pregrupiramo. Nula čuva prazno mjesto: ' +
        'u 307 nema desetica, ali trojka je i dalje na mjestu stotica.</p>' +
        '<p>Baza je samo način zapisa. U bazi <i>b</i> mjesta vrijede 1, <i>b</i>, <i>b</i>², <i>b</i>³ …, a ' +
        'znamenke su 0 do <i>b</i> − 1 (u bazi 16 A = 10, …, F = 15). Ista hrpa kockica u bazi 2, 8 ili 16 složi se u ' +
        'druge skupine i zapiše drugim znamenkama, ali je to isti broj. „10” je u svakoj bazi baza sama: jedna skupina, ' +
        'nula jedinica.</p>'
    },
    en: {
      stage: 'Place value',

      audLabel: 'View',
      audGroup: 'Who the view is for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For projecting in class: any number, any base, a typical mistake.',
      audAdultHint: 'For a parent or a refresher: every move says why the number stays the same.',
      audChildHint: 'For grades 2 to 4: big digits, school words, base 10.',

      numsTitle: 'Number',
      numsLabel: 'Type a number in base {b}',
      numsHint: 'Up to 9999 (decimal).',
      errDigit: '“{at}” is not a digit of base {b}.',
      errMax: 'At most 9999 (decimal).',
      errEmpty: 'Type a number.',

      base: 'Base',
      baseHint: 'The same quantity, other groups and other digits.',
      baseQuick: 'Common bases',
      baseName2: 'binary',
      baseName8: 'octal',
      baseName10: 'decimal',
      baseName16: 'hexadecimal',
      mistake: 'Typical mistake',
      mNone: 'none',
      mSquash: 'a full place written as it is',
      mZero: 'a zero left out',
      mDecimal: 'read as decimal',
      regroupAll: 'Regroup all',
      regroupAllHint: 'Regroup all: every place below the base',

      pBuild: 'The number 347',
      pBuildHint: '3 hundreds, 4 tens, 7 ones',
      pThirteen: '13 ones',
      pThirteenHint: '2 tens and 13 ones: trade 10 ones for 1 ten',
      pZero: 'A zero holds the place',
      pZeroHint: '307: no tens',
      pBin: 'Base 2',
      pBinHint: '1101 in base 2 is 13',
      pOct: 'Eight ones in base 8',
      pOctHint: 'Full groups of 8: written 10',
      pHex: 'Base 16',
      pHexHint: 'FF in base 16 is 255',

      legOver: 'a full place',
      legChanged: 'the last move',

      mat: 'Place-value chart with blocks',
      place0: 'O',
      place1: 'T',
      place2: 'H',
      place3: 'Th',
      placeName0: 'ones',
      placeName1: 'tens',
      placeName2: 'hundreds',
      placeName3: 'thousands',
      placeName: 'place worth {v}',
      colBlocks: '{col}: {u}',
      btnAdd: 'Add: {u}',
      btnRemove: 'Take away: {u}',
      btnRegroup: 'Trade {from} for {to}',
      btnBreak: 'Break {from} into {to}',

      u0: ['{n} one', '{n} ones'],
      u1: ['{n} ten', '{n} tens'],
      u2: ['{n} hundred', '{n} hundreds'],
      u3: ['{n} thousand', '{n} thousands'],
      uGen: ['{n} block of {v}', '{n} blocks of {v}'],
      one0: '1 one',
      one1: '1 ten',
      one2: '1 hundred',
      one3: '1 thousand',
      oneGen: '1 block of {v}',
      blocks: ['{n} block', '{n} blocks'],
      col0: 'Ones',
      col1: 'Tens',
      col2: 'Hundreds',
      col3: 'Thousands',
      colGen: 'Blocks of {v}',
      colOf0: 'ones',
      colOf1: 'tens',
      colOf2: 'hundreds',
      colOf3: 'thousands',
      colOfGen: 'blocks of {v}',

      rPlace: 'base {b} has no place left of this one up to 9999',
      rFull: 'the {col} column is full: at most {cap}',
      rFullRight: 'the {col} column would hold {after}, and at most {cap} fit',
      rMax: 'the number would go past 9999',
      rEmpty: 'the {col} column has no blocks',
      rFew: 'a trade needs {need}, and this column has {have}',
      rOnes: 'a one does not break up: it is the smallest part',
      cRefused: 'Not possible: {why}.',

      paper: 'The number written in digits',
      paperHead: 'Written',
      decimal: 'decimal',
      overCell: 'does not fit one place: {c}',
      overNote: 'A full place is not a digit: regroup first.',

      bTitle: 'The same number, other bases',
      bBase: 'base {b}',
      bHere: 'here',
      bSame: 'Always {nU}: only the size of the groups changes.',

      mtHead: 'Typical mistake',
      mtSquash: 'a full place written as it is',
      mtZero: 'a zero left out',
      mtDecimal: 'read as decimal',
      mtInstead: 'instead of {res}',
      whySquash: 'One place takes one digit. The count of the {col} column written as “{ct}” pushes everything on the left one place over; trade {b} for 1 on the left first.',
      whySquashSame: 'Only the highest place is full, so the numeral happens to come out right. As soon as a lower place is full, everything on its left moves one place over.',
      whyZero: 'Without the zero the digits move right and are worth less: the zero holds the empty place.',
      whyDecimal: 'The same digits, but the places of base {b} are worth {pv}, not {tens}.',
      whyDecimalSame: 'A one-digit number is the same in every base that has that digit; the difference shows from two places on.',
      naNofull: 'No place is full here. Add blocks until one column holds {b} or more, or try “13 ones”.',
      naNozero: 'This number has no zero. Try “A zero holds the place”.',
      naBase10: 'In base 10 there is no difference. Switch to base 2 or 8, or try “Base 2”.',
      naLetters: 'This numeral has letters (A–F), so it cannot even be read as decimal.',
      wrongCell: 'wrong: {w}',

      cAddT: '+ {u}: the number grows by {v}.',
      cAddC: 'One more: {u}.',
      cRemoveT: '− {u}: the number shrinks by {v}.',
      cRemoveC: 'One less: {u}.',
      cRegroupT: '{from} = {to}: traded, the number is still {n}.',
      cRegroupA: 'The place on the left is worth {b} times as much, so the trade is exact: {from} = {to}. Nothing added or taken away, only regrouped.',
      cRegroupC: '{from} = {to}.',
      cBreakT: '{from} = {to}: broken up, the number is still {n}.',
      cBreakA: 'The same trade backwards: {from} is worth as much as {to}. You need it when subtracting and a place has too few.',
      cBaseT: 'Base {b}: the same quantity, {nU}, now in groups of {b}.',
      cBaseA: 'The quantity does not change; what changes is how many blocks make one block of the next place, so the digits change too.',
      cAllT: 'All regrouped: no place holds {b} or more blocks.',
      cStartT: 'Each block is worth what its column says. Build a number with + and −, and trade a full column (⇐).',
      cStartA: 'A digit is worth the digit times the value of its place, and each place is worth {b} times the place on its right.',
      cStartC: 'Build a number from blocks.',

      cOverT: '{col}: {c}, and one digit holds at most {max}. Trade {b} for 1 on the left (⇐).',
      cOverC: '{u}: too many for one place. Trade {b} for 1 on the left.',
      cExpand: '{num} = {terms} = {worths}',
      cExpandDec: '{num} = {terms} = {worths} = {n} (decimal)',
      cExpand1: '{num} = {terms}',
      cExpandDec1: '{num} = {terms} = {n} (decimal)',
      cBlocks1: 'Blocks: {terms} = {n}.',
      cBlocks: 'Blocks: {terms} = {worths} = {n}.',
      cChild: '{num}: {parts}.',
      cAnd: ' and ',

      explain: '<p>A digit is worth what its place says: in 347 the 3 is worth 3 hundreds, that is 300, the 4 is worth 40 ' +
        'and the 7 is worth 7. The number is the sum of those values: 347 = 3 · 100 + 4 · 10 + 7 · 1.</p>' +
        '<p>Each place is worth ten times the place on its right. That is why ten ones can be traded for one ten, and ' +
        'ten tens for one hundred: this is regrouping, and the quantity does not change. One place holds one digit, 0 ' +
        'to 9; when ten or more gather, we regroup. A zero holds an empty place: 307 has no tens, but the 3 is still in ' +
        'the hundreds place.</p>' +
        '<p>A base is only a way of writing. In base <i>b</i> the places are worth 1, <i>b</i>, <i>b</i>², ' +
        '<i>b</i>³ …, and the digits are 0 to <i>b</i> − 1 (in base 16 A = 10, …, F = 15). The same pile of blocks in ' +
        'base 2, 8 or 16 falls into other groups and is written with other digits, but it is the same number. “10” in ' +
        'any base is the base itself: one group, no ones.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
