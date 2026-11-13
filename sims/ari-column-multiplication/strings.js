/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-column-multiplication, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Captions come in three registers, one per audience: T (teacher, the school step), A (adult, why it works), C (child,
   the spoken step). A digit step's sentence is d + (In: a carry came in) + (Keep: a carry goes on | End: nothing
   carried | Last: the first factor's last digit, written whole) + register.
   Numbers and digits are filled in by the page as nodes (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pisano množenje',

      // audience switch (header)
      audLabel: 'Prikaz',
      audGroup: 'Za koga je prikaz',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju u razredu: bilo koji brojevi, korak naprijed i natrag, tipična pogreška.',
      audAdultHint: 'Za roditelja ili ponavljanje: svaki korak kaže zašto vrijedi.',
      audChildHint: 'Za 3. i 4. razred: velike znamenke, školske rečenice, baza 10.',

      // numbers field (panel)
      numsTitle: 'Faktori',
      numsLabel: 'Faktor · faktor u bazi {b}',
      numsHint: 'Dva broja do 4 znamenke; između njih ·, * ili x.',
      errDigit: '„{at}” nije znamenka baze {b}.',
      errLong: 'Najviše 4 znamenke: {at}.',
      errCount: 'Upiši dva faktora, npr. 457 · 36.',
      errEmpty: 'Uz znak · nedostaje broj.',

      // params
      base: 'Baza',
      baseHint: 'Ista količina, druge znamenke.',
      baseQuick: 'Česte baze',
      baseName2: 'binarno',
      baseName8: 'oktalno',
      baseName10: 'dekadski',
      baseName16: 'heksadekadski',
      baseTooLong: 'U bazi {b} faktor {num} imao bi više od 4 znamenke.',
      area: 'Model površine',
      mistake: 'Tipična pogreška',
      mNone: 'nema',
      mNoshift: 'bez pomaka',
      mCarry: 'zaboravljeno pamtim',
      mCarryFirst: 'pamtim prije množenja',

      // presets
      pTwo: 'Dvoznamenkasti faktor',
      pTwoHint: '457 · 36',
      pOne: 'Jednoznamenkasti faktor',
      pOneHint: '248 · 7: bez zbrajanja',
      pZero: 'Nula u faktoru',
      pZeroHint: '312 · 205: redak nula',
      pNoshift: 'Bez pomaka',
      pNoshiftHint: '457 · 36, s tipičnom pogreškom',
      pBin: 'Baza 2',
      pBinHint: '1101 · 1011: pomicanje i zbrajanje',
      pHex: 'Baza 16',
      pHexHint: '1C9 · 24: isti brojevi kao primjer 1',

      // legend
      legBand: 'znamenke koje množim',
      legTag: 'pamtim',
      legChanged: 'napisano u ovom koraku',

      // the paper
      paper: 'Pisano množenje, račun na papiru',
      place0: 'J',
      place1: 'D',
      place2: 'S',
      place3: 'T',
      place4: 'DT',
      place5: 'ST',
      place6: 'M',
      place7: 'DM',
      place8: 'SM',
      placeName0: 'jedinice',
      placeName1: 'desetice',
      placeName2: 'stotice',
      placeName3: 'tisućice',
      placeName: 'mjesto vrijednosti {v}',
      cellCarry: 'pamtim {v}',
      cellSumCarry: 'prijenos {v}',

      // place units, with counts (plural forms)
      u0: ['{n} jedinica', '{n} jedinice', '{n} jedinica'],
      u1: ['{n} desetica', '{n} desetice', '{n} desetica'],
      u2: ['{n} stotica', '{n} stotice', '{n} stotica'],
      u3: ['{n} tisućica', '{n} tisućice', '{n} tisućica'],
      uGen: ['{n} jedinica mjesta ×{v}', '{n} jedinice mjesta ×{v}', '{n} jedinica mjesta ×{v}'],
      shift: ['za {n} mjesto', 'za {n} mjesta', 'za {n} mjesta'],

      // area model
      areaTitle: 'Model površine',
      areaSub: 'nije u mjerilu',
      areaInBase: 'brojevi u bazi {b}',
      areaRow: 'redak',
      areaTotal: 'ukupno',
      areaLabel: 'Pravokutnik rastavljen po mjestima faktora; svaka ćelija je umnožak dvaju dijelova.',

      // mistake card
      mtHead: 'Tipična pogreška',
      mtNoshift: 'umnošci bez pomaka',
      mtCarry: 'zaboravljeno ono što pamtim',
      mtCarryFirst: 'zapamćeno dodano prije množenja',
      mtInstead: 'umjesto {res}',
      whyNoshift: 'Znamenka {d} vrijedi {dv}, pa je {a} · {d} zapravo {a} · {dv}: redak mora završiti ispod znamenke {d}. Bez pomaka umnožak je premalen.',
      whyCarry: '„Pamtim {cin}” znači {cinU}: {ad} · {d} + {cin} = {right}. Bez zapamćenoga je {wrong}, pa je umnožak premalen.',
      carryU: ['{n} jedinica ovog mjesta, prenesena zdesna', '{n} jedinice ovog mjesta, prenesene zdesna', '{n} jedinica ovog mjesta, prenesenih zdesna'],
      whyCarryFirst: 'Zapamćeno se dodaje umnošku, a ne znamenki: {ad} · {d} + {cin} = {right}, a ne ({ad} + {cin}) · {d} = {wrong}. Umnožak je zato prevelik.',
      sameNoshift: 'Ovdje zaboravljeni pomak ne bi promijenio umnožak, pa se ova pogreška ne vidi. Probaj primjer 1 (457 · 36 u bazi 10).',
      sameCarry: 'Ovdje se ništa ne pamti, pa se ova pogreška ne vidi. Probaj primjer 1 (457 · 36 u bazi 10).',
      wrongCell: 'pogrešno: {w}',

      // captions: start
      cStartT: 'Faktore pišemo u jedan red: {expr}. Prvi faktor množimo svakom znamenkom drugoga, slijeva; svaki djelomični umnožak završava ispod znamenke kojom množimo.',
      cStartA1: 'Drugi faktor ima jednu znamenku: prvi faktor množimo njome mjesto po mjesto, od jedinica. Svako mjesto vrijedi {b} puta više od mjesta desno, pa svakih {b} na jednom mjestu daje 1 na sljedećem: to je ono što pamtimo.',
      cStartA: 'Drugi faktor zbroj je svojih mjesta: {parts}. Zato prvi faktor množimo svakim dijelom pa dijelove zbrojimo. Svako mjesto vrijedi {b} puta više od mjesta desno, pa dio s nulama na kraju samo pomiče umnožak ulijevo.',
      cStartC: 'Množimo {expr}.',

      // captions: the start of a row (teacher, adult) and its first step (child)
      rowT: 'Množim znamenkom {d} ({du}); umnožak završava ispod nje.',
      rowA: 'Znamenka {d} vrijedi {dv} = {d} · {pv}. Računam {a} · {d}, a umnožak pomičem {shift} ulijevo: to je množenje s {pv}.',
      rowA0: 'Znamenka {d} na mjestu je jedinica: računam {a} · {d}, bez pomaka.',
      rowFirstC: 'Prvo puta {d}.',
      rowC: 'Sada puta {d}.',

      // captions: one digit of the first factor times the digit
      dKeepT: '{ad} · {d} = {p}: pišem {w}, pamtim {c}.',
      dInKeepT: '{ad} · {d} = {p}, i {cin} je {s}: pišem {w}, pamtim {c}.',
      dEndT: '{ad} · {d} = {p}: pišem {w}.',
      dInEndT: '{ad} · {d} = {p}, i {cin} je {s}: pišem {w}.',
      dLastT: '{ad} · {d} = {p}: pišem {w}.',
      dInLastT: '{ad} · {d} = {p}, i {cin} je {s}: pišem {w}.',
      dKeepA: '{ad} · {d} = {s} = {c} · {B} + {wd}: {w} ostaje na ovom mjestu, {c} ide na sljedeće (pamtim {c}).',
      dInKeepA: '{ad} · {d} + {cin} zapamćeno = {s} = {c} · {B} + {wd}: {w} ostaje na ovom mjestu, {c} ide na sljedeće.',
      dEndA: '{ad} · {d} = {s}, manje od {B}: pišem {w}, ništa ne prenosim.',
      dInEndA: '{ad} · {d} + {cin} zapamćeno = {s}, manje od {B}: pišem {w}, ništa ne prenosim.',
      dLastA: '{ad} · {d} = {s}. To je zadnja znamenka prvog faktora, pa pišem cijeli {w}.',
      dInLastA: '{ad} · {d} + {cin} zapamćeno = {s}. To je zadnja znamenka prvog faktora, pa pišem cijeli {w}.',
      dKeepC: '{ad} puta {d} je {p}. Pišem {w}, pamtim {c}.',
      dInKeepC: '{ad} puta {d} je {p}, i {cin} je {s}. Pišem {w}, pamtim {c}.',
      dEndC: '{ad} puta {d} je {p}. Pišem {w}.',
      dInEndC: '{ad} puta {d} je {p}, i {cin} je {s}. Pišem {w}.',
      dLastC: '{ad} puta {d} je {p}. Pišem {w}.',
      dInLastC: '{ad} puta {d} je {p}, i {cin} je {s}. Pišem {w}.',

      // captions: a row of a 0 or a 1, in one step
      rowZeroT: 'Množim znamenkom 0 ({du}): umnožak je 0, pišem {z}.',
      rowZeroA: 'Znamenka 0: {a} · 0 = 0. Nule ne mijenjaju zbroj, samo drže mjesta.',
      rowZeroA1: 'Znamenka 0: {a} · 0 = 0, pa je i umnožak 0.',
      rowZeroC: '{a} puta 0 je 0. Pišem {z}.',
      rowOneT: 'Množim znamenkom 1 ({du}): umnožak je sam prvi faktor, pišem {a}.',
      rowOneA: 'Znamenka 1 vrijedi {dv}: {a} · {dv} je {a} pomaknut {shift} ulijevo. Ništa se ne računa, samo se pomiče.',
      rowOneA0: 'Znamenka 1 na mjestu jedinica: {a} · 1 = {a}, bez pomaka.',
      rowOneC: '{a} puta 1 je {a}. Pišem {a}.',

      // captions: the sum
      sumT: 'Zbrajam djelomične umnoške po stupcima, od jedinica, kao u pisanom zbrajanju.',
      sumA: 'Svaki redak vrijedi onoliko koliko kaže njegov pomak: {terms} = {res}.',
      sumC: 'Zbrojim retke.',

      // captions: the end
      cResultT: 'Umnožak: {expr} = {res}.',
      cDecimal: 'Dekadski: {expr} = {res}.',
      cBinary: 'U bazi 2 svaki je redak prvi faktor ili nula, pomaknut: množenje je samo pomicanje i zbrajanje.',
      cDoneC: 'Gotovo: {res}.',

      // captions: the typical mistake (teacher)
      cMRow: 'S ovom pogreškom ovaj bi redak bio {w}.',
      cMShift: 'S ovom pogreškom ovaj bi redak završio ispod jedinica.',
      cMEnd: 'Pogreška daje {wrong} umjesto {res}.',

      cRefused: 'Baza {b} nije moguća: {why}',

      explain: '<p>Drugi faktor rastavimo po mjestima: 36 = 3 desetice + 6 jedinica. Prvi faktor množimo svakim ' +
        'dijelom pa dijelove zbrojimo: 457 · 36 = 457 · 30 + 457 · 6.</p>' +
        '<p><b>Pomak:</b> 457 · 30 je 457 · 3 desetice = 1371 desetica = 13710. Zato redak 1371 završava ispod ' +
        'znamenke 3, u stupcu desetica: pomak za jedno mjesto ulijevo isto je što i množenje s 10. Model površine ' +
        'pokazuje isto: pravokutnik 457 × 36 rastavljen na dijelove 400, 50, 7 i 30, 6.</p>' +
        '<p><b>Pišem, pamtim:</b> 7 · 3 = 21 su 2 desetice i 1 jedinica. Jedinicu pišem, a 2 desetice dodajem ' +
        'sljedećem umnošku, onom desetica: 5 · 3 + 2 = 17. Zapamćeno se dodaje umnošku, ne znamenki.</p>' +
        '<p>Na papiru retke pišemo od lijeve znamenke drugog faktora; u nekim zemljama počinju od jedinica. ' +
        'Redoslijed ne mijenja zbroj, jer svaki redak stoji na svom mjestu.</p>' +
        '<p>Baza je samo način zapisa broja. U bazi 2 znamenke su samo 0 i 1, pa je svaki redak prvi faktor ili ' +
        'nula, pomaknut: množenje je pomicanje i zbrajanje.</p>'
    },
    en: {
      stage: 'Column multiplication',

      // audience switch (header)
      audLabel: 'View',
      audGroup: 'Who the view is for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector in class: any numbers, step forward and back, a typical mistake.',
      audAdultHint: 'For a parent or a refresher: every step says why it works.',
      audChildHint: 'For grades 3 and 4: big digits, the school phrasing, base 10.',

      // numbers field (panel)
      numsTitle: 'Factors',
      numsLabel: 'Factor · factor in base {b}',
      numsHint: 'Two numbers of up to 4 digits; ·, * or x between them.',
      errDigit: '“{at}” is not a digit of base {b}.',
      errLong: 'At most 4 digits: {at}.',
      errCount: 'Type two factors, e.g. 457 · 36.',
      errEmpty: 'A number is missing next to the ·.',

      // params
      base: 'Base',
      baseHint: 'The same quantity, other digits.',
      baseQuick: 'Common bases',
      baseName2: 'binary',
      baseName8: 'octal',
      baseName10: 'decimal',
      baseName16: 'hexadecimal',
      baseTooLong: 'In base {b} the factor {num} would have more than 4 digits.',
      area: 'Area model',
      mistake: 'Typical mistake',
      mNone: 'none',
      mNoshift: 'no shift',
      mCarry: 'carry forgotten',
      mCarryFirst: 'carry before multiplying',

      // presets
      pTwo: 'Two-digit factor',
      pTwoHint: '457 · 36',
      pOne: 'One-digit factor',
      pOneHint: '248 · 7: no sum',
      pZero: 'A zero in the factor',
      pZeroHint: '312 · 205: a row of zeros',
      pNoshift: 'No shift',
      pNoshiftHint: '457 · 36, with the typical mistake',
      pBin: 'Base 2',
      pBinHint: '1101 · 1011: shift-and-add',
      pHex: 'Base 16',
      pHexHint: '1C9 · 24: the same numbers as example 1',

      // legend
      legBand: 'digits multiplied',
      legTag: 'carried',
      legChanged: 'written in this step',

      // the paper
      paper: 'Column multiplication on paper',
      place0: 'O',
      place1: 'T',
      place2: 'H',
      place3: 'Th',
      place4: 'TTh',
      place5: 'HTh',
      place6: 'M',
      place7: 'TM',
      place8: 'HM',
      placeName0: 'ones',
      placeName1: 'tens',
      placeName2: 'hundreds',
      placeName3: 'thousands',
      placeName: 'the place worth {v}',
      cellCarry: 'carry {v}',
      cellSumCarry: 'carry {v}',

      // place units, with counts (plural forms)
      u0: ['{n} one', '{n} ones'],
      u1: ['{n} ten', '{n} tens'],
      u2: ['{n} hundred', '{n} hundreds'],
      u3: ['{n} thousand', '{n} thousands'],
      uGen: ['{n} unit of the place ×{v}', '{n} units of the place ×{v}'],
      shift: ['by {n} place', 'by {n} places'],

      // area model
      areaTitle: 'Area model',
      areaSub: 'not to scale',
      areaInBase: 'numbers in base {b}',
      areaRow: 'row',
      areaTotal: 'total',
      areaLabel: 'A rectangle split by the places of the factors; each cell is the product of two parts.',

      // mistake card
      mtHead: 'Typical mistake',
      mtNoshift: 'partial products not shifted',
      mtCarry: 'the carry forgotten',
      mtCarryFirst: 'the carry added before multiplying',
      mtInstead: 'instead of {res}',
      whyNoshift: 'The digit {d} is worth {dv}, so {a} · {d} is really {a} · {dv}: its row must end under the digit {d}. Without the shift the product is too small.',
      whyCarry: '“Carry {cin}” means {cinU}: {ad} · {d} + {cin} = {right}. Without the carry it is {wrong}, so the product is too small.',
      carryU: ['{n} unit of this place, brought from the right', '{n} units of this place, brought from the right'],
      whyCarryFirst: 'The carry is added to the product, not to the digit: {ad} · {d} + {cin} = {right}, not ({ad} + {cin}) · {d} = {wrong}. So the product is too big.',
      sameNoshift: 'Here a forgotten shift would not change the product, so this mistake does not show. Try example 1 (457 · 36 in base 10).',
      sameCarry: 'Nothing is carried here, so this mistake does not show. Try example 1 (457 · 36 in base 10).',
      wrongCell: 'wrong: {w}',

      // captions: start
      cStartT: 'The factors go on one line: {expr}. We multiply the first factor by each digit of the second, from the left; each partial product ends under the digit we multiply by.',
      cStartA1: 'The second factor has one digit: we multiply the first factor by it place by place, from the ones. Each place is worth {b} times the place on its right, so every {b} in a place makes 1 in the next: that is the carry.',
      cStartA: 'The second factor is the sum of its places: {parts}. So we multiply the first factor by each part and add the parts. Each place is worth {b} times the place on its right, so a part ending in zeros only shifts the product to the left.',
      cStartC: 'We multiply {expr}.',

      // captions: the start of a row (teacher, adult) and its first step (child)
      rowT: 'Multiplying by the digit {d} ({du}); the product ends under it.',
      rowA: 'The digit {d} is worth {dv} = {d} · {pv}. I work out {a} · {d} and shift the product {shift} to the left: that is multiplying by {pv}.',
      rowA0: 'The digit {d} is in the ones place: I work out {a} · {d}, with no shift.',
      rowFirstC: 'First times {d}.',
      rowC: 'Now times {d}.',

      // captions: one digit of the first factor times the digit
      dKeepT: '{ad} · {d} = {p}: write {w}, carry {c}.',
      dInKeepT: '{ad} · {d} = {p}, and {cin} is {s}: write {w}, carry {c}.',
      dEndT: '{ad} · {d} = {p}: write {w}.',
      dInEndT: '{ad} · {d} = {p}, and {cin} is {s}: write {w}.',
      dLastT: '{ad} · {d} = {p}: write {w}.',
      dInLastT: '{ad} · {d} = {p}, and {cin} is {s}: write {w}.',
      dKeepA: '{ad} · {d} = {s} = {c} · {B} + {wd}: {w} stays in this place, {c} goes to the next (carry {c}).',
      dInKeepA: '{ad} · {d} + {cin} carried = {s} = {c} · {B} + {wd}: {w} stays in this place, {c} goes to the next.',
      dEndA: '{ad} · {d} = {s}, less than {B}: write {w}, nothing to carry.',
      dInEndA: '{ad} · {d} + {cin} carried = {s}, less than {B}: write {w}, nothing to carry.',
      dLastA: '{ad} · {d} = {s}. That is the first factor\'s last digit, so I write all of {w}.',
      dInLastA: '{ad} · {d} + {cin} carried = {s}. That is the first factor\'s last digit, so I write all of {w}.',
      dKeepC: '{ad} times {d} is {p}. Write {w}, carry {c}.',
      dInKeepC: '{ad} times {d} is {p}, and {cin} is {s}. Write {w}, carry {c}.',
      dEndC: '{ad} times {d} is {p}. Write {w}.',
      dInEndC: '{ad} times {d} is {p}, and {cin} is {s}. Write {w}.',
      dLastC: '{ad} times {d} is {p}. Write {w}.',
      dInLastC: '{ad} times {d} is {p}, and {cin} is {s}. Write {w}.',

      // captions: a row of a 0 or a 1, in one step
      rowZeroT: 'Multiplying by the digit 0 ({du}): the product is 0, write {z}.',
      rowZeroA: 'The digit 0: {a} · 0 = 0. The zeros do not change the sum, they only hold the places.',
      rowZeroA1: 'The digit 0: {a} · 0 = 0, so the product is 0.',
      rowZeroC: '{a} times 0 is 0. Write {z}.',
      rowOneT: 'Multiplying by the digit 1 ({du}): the product is the first factor itself, write {a}.',
      rowOneA: 'The digit 1 is worth {dv}: {a} · {dv} is {a} shifted {shift} to the left. Nothing is worked out, it only moves.',
      rowOneA0: 'The digit 1 in the ones place: {a} · 1 = {a}, with no shift.',
      rowOneC: '{a} times 1 is {a}. Write {a}.',

      // captions: the sum
      sumT: 'Adding the partial products column by column, from the ones, as in column addition.',
      sumA: 'Each row is worth what its shift says: {terms} = {res}.',
      sumC: 'Add the rows.',

      // captions: the end
      cResultT: 'Product: {expr} = {res}.',
      cDecimal: 'In decimal: {expr} = {res}.',
      cBinary: 'In base 2 every row is the first factor or zero, shifted: multiplying is only shifting and adding.',
      cDoneC: 'Done: {res}.',

      // captions: the typical mistake (teacher)
      cMRow: 'With this mistake the row would be {w}.',
      cMShift: 'With this mistake the row would end under the ones.',
      cMEnd: 'The mistake gives {wrong} instead of {res}.',

      cRefused: 'Base {b} is not possible: {why}',

      explain: '<p>Split the second factor by place: 36 = 3 tens + 6 ones. Multiply the first factor by each part and ' +
        'add the parts: 457 · 36 = 457 · 30 + 457 · 6.</p>' +
        '<p><b>The shift:</b> 457 · 30 is 457 · 3 tens = 1371 tens = 13710. That is why the row 1371 ends under the ' +
        'digit 3, in the tens column: shifting one place to the left is the same as multiplying by 10. The area model ' +
        'shows the same: a 457 × 36 rectangle cut into the parts 400, 50, 7 and 30, 6.</p>' +
        '<p><b>Write, carry:</b> 7 · 3 = 21 is 2 tens and 1 one. Write the one; the 2 tens are added to the next ' +
        'product, the tens one: 5 · 3 + 2 = 17. The carry is added to the product, not to the digit.</p>' +
        '<p>On a Croatian school paper the rows start from the second factor\'s left digit; English textbooks start ' +
        'from the ones. The order does not change the sum, because each row stands in its own place.</p>' +
        '<p>A base is only a way of writing a number. In base 2 the only digits are 0 and 1, so every row is the ' +
        'first factor or zero, shifted: multiplying is shifting and adding.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
