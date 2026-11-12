/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-column-addition, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Captions come in three registers, one per audience: T (teacher), A (adult, why it works), C (child, the school
   phrasing). Numbers and digits are filled in by the page as nodes (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pisano zbrajanje',

      // audience switch (header)
      audLabel: 'Prikaz',
      audGroup: 'Za koga je prikaz',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju u razredu: bilo koji brojevi, korak naprijed i natrag, tipična pogreška.',
      audAdultHint: 'Za roditelja ili ponavljanje: svaki korak kaže zašto vrijedi.',
      audChildHint: 'Za 2. do 4. razred: velike znamenke, školske rečenice, baza 10.',

      // numbers field (panel)
      numsTitle: 'Brojevi',
      numsLabel: 'Pribrojnici u bazi {b}',
      numsHint: 'Dva do četiri broja, svaki do 9 znamenki.',
      errDigit: '„{at}” nije znamenka baze {b}.',
      errLong: 'Najviše 9 znamenki: {at}.',
      errCount: 'Upiši dva do četiri broja.',
      errEmpty: 'Između dva znaka + nedostaje broj.',

      // params
      base: 'Baza',
      baseHint: 'Ista količina, druge znamenke.',
      baseQuick: 'Česte baze',
      baseName2: 'binarno',
      baseName8: 'oktalno',
      baseName10: 'dekadski',
      baseName16: 'heksadekadski',
      baseTooLong: 'U bazi {b} broj {num} imao bi više od 9 znamenki.',
      mistake: 'Tipična pogreška',
      mNone: 'nema',
      mNocarry: 'bez prijenosa',
      mWhole: 'cijeli zbroj',
      mLeft: 'slijeva',

      // presets
      pTwo: 'Dva broja',
      pTwoHint: '457 + 368: dva prijenosa',
      pReach: 'Zbroj točno 10',
      pReachHint: '645 + 355: svaki stupac dosegne bazu',
      pFour: 'Četiri broja, prijenos 3',
      pFourHint: '2738 + 4596 + 1879 + 3967',
      pLeft: 'Različite duljine',
      pLeftHint: '1205 + 87, s pogreškom poravnanja slijeva',
      pBin: 'Baza 2',
      pBinHint: '1011 + 111 u bazi 2',
      pHex: 'Baza 16',
      pHexHint: '3A7 + 1F9 u bazi 16',

      // legend
      legCol: 'stupac koji zbrajamo',
      legCarry: 'prijenos',
      legChanged: 'napisano u ovom koraku',
      legGroup: 'puna skupina = 1 mjesto lijevo',

      // paper
      paper: 'Račun na papiru',
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
      decimal: 'dekadski',
      carryCell: 'prijenos {c}',

      // place units, with counts (plural forms) and as column names
      u0: ['{n} jedinica', '{n} jedinice', '{n} jedinica'],
      u1: ['{n} desetica', '{n} desetice', '{n} desetica'],
      u2: ['{n} stotica', '{n} stotice', '{n} stotica'],
      u3: ['{n} tisućica', '{n} tisućice', '{n} tisućica'],
      uGen: ['{n} jedinica mjesta ×{v}', '{n} jedinice mjesta ×{v}', '{n} jedinica mjesta ×{v}'],
      col0: 'jedinica',
      col1: 'desetica',
      col2: 'stotica',
      col3: 'tisućica',
      colGen: '×{v}',
      head0: 'Jedinice',
      head1: 'Desetice',
      head2: 'Stotice',
      head3: 'Tisućice',
      headGen: 'Stupac ×{v}',

      // regrouping box
      rgTitle: 'Pregrupiranje',
      rgStart: 'Ovdje se slaže zbroj stupca: jedna točkica za svaku jedinicu tog mjesta.',
      rgCol: 'Stupac {col}',
      rgFinal: 'Zadnji prijenos',
      rgFromDigits: 'iz znamenki',
      rgFromCarry: 'prenesene',
      rgLeft: 'lijevo: {q}',
      rgStays: 'ostaje: {r}',
      rgFits: 'manje od {b}: sve stane u ovo mjesto',
      rgDots: ['{n} točkica', '{n} točkice', '{n} točkica'],

      // mistake card
      mtHead: 'Tipična pogreška',
      mtNocarry: 'zaboravljen prijenos',
      mtWhole: 'cijeli zbroj u stupcu',
      mtLeft: 'poravnato slijeva',
      mtInstead: 'umjesto {res}',
      whyNocarry: 'Svaki zaboravljeni prijenos cijela je jedinica sljedećeg mjesta. Rezultat je premalen točno za njihovu vrijednost: {lost}.',
      whyWhole: 'U jedno mjesto ide jedna znamenka. Napisan cijeli, zbroj {s} gura svoju prvu znamenku na mjesto lijevo, pa se sve lijevo od nje pomakne za jedno mjesto.',
      whyLeft: 'Znamenke se potpisuju po mjestu, zdesna. Poravnat slijeva, broj {num} čita se kao {mis}.',
      sameNocarry: 'Ovdje nijedan stupac ne dosegne bazu, pa ova pogreška ne mijenja rezultat.',
      sameWhole: 'Ovdje nijedan stupac ne dosegne bazu, pa ova pogreška ne mijenja rezultat.',
      sameLeft: 'Brojevi imaju jednako znamenki, pa se ova pogreška ovdje ne vidi. Probaj 1205 + 87.',
      sameAny: 'Ovdje ova pogreška slučajno daje točan rezultat, ali postupak je i dalje pogrešan.',
      sameWholeLast: 'Bazu dosegne samo zadnji stupac, a njegov se prijenos ionako piše ispred, pa se pogreška ovdje ne vidi. Probaj 457 + 368.',
      wrongCell: 'pogrešno: {w}',

      // captions: teacher
      cStartT: 'Brojeve potpisujemo zdesna: jedinice ispod jedinica, desetice ispod desetica. Zbrajamo stupac po stupac, od jedinica.',
      cSumT: '{head}: {expr} = {sum}.',
      cSumOneT: '{head}: samo {d}, nema se što zbrojiti.',
      cSumOneA: '{head}: samo {d}; jedan pribrojnik ima ovo mjesto.',
      cSumOneC: 'Samo {d}.',
      cReachT: '{sum} ≥ {b}: bit će prijenosa.',
      cBelowT: '{sum} < {b}: nema prijenosa.',
      cWriteT: 'Pišem {d}, pamtim {c}: prijenos ide u stupac {next}.',
      cWriteNoT: 'Pišem {d}. Prijenosa nema.',
      cCarryDigits: 'U bazi {b} prijenos {c} piše se {ct}.',
      cFinalT: 'Prijenos {c} nema s čime se zbrojiti, pa ga pišemo ispred.',
      cResultT: 'Rezultat: {expr} = {res}.',
      cDecimal: 'Dekadski: {expr} = {res}.',

      // captions: adult
      cStartA: 'Svako mjesto vrijedi {b} puta više od mjesta desno od njega. Zato brojeve potpisujemo zdesna: u jednom stupcu su jedinice istog mjesta, a samo se one smiju zbrojiti.',
      cSumA: '{head}: {expr} = {sumU}.',
      cSumCarryA: 'Prijenos je dio zbroja ovog stupca, kao i svaka znamenka.',
      cWriteA: '{sumU} = {qU} i {rU}. U ovaj stupac pišem {r}, a prijenos, {qU}, ide u stupac {next}: ništa nije dodano ni izgubljeno, samo pregrupirano.',
      cWriteNoA: '{sumU}, manje od {b}: sve stane u ovo mjesto. Pišem {r}.',
      cFinalA: 'Prijenos, {cU}, nema svoj stupac među brojevima, pa ga pišemo ispred ostalih znamenki.',

      // captions: child
      cStartC: 'Zbrajamo zdesna. Prvo jedinice.',
      cSumC: '{expr} = {sum}.',
      cWriteC: 'Pišem {d}, pamtim {c}.',
      cWriteNoC: 'Pišem {d}.',
      cFinalC: 'Pišem {c}.',
      cDoneC: 'Gotovo: {res}.',

      // captions: the typical mistake (teacher)
      cMNocarry: 'Bez prijenosa ovdje bi pisalo {w}.',
      cMWhole: 'S cijelim zbrojem ovdje bi pisalo {w}: dvije znamenke u jednom mjestu.',
      cMLeft: 'Poravnato slijeva, ovdje bi pisalo {w}.',
      cMEnd: 'Pogreška daje {wrong} umjesto {res}.',

      cRefused: 'Baza {b} nije moguća: {why}',

      explain: '<p>Znamenka vrijedi onoliko koliko kaže njezino mjesto: u bazi 10 jedinice, desetice, stotice. ' +
        'Zato brojeve potpisujemo zdesna, jedinice ispod jedinica, i zbrajamo stupac po stupac, počevši od jedinica.</p>' +
        '<p>Kad zbroj stupca dosegne bazu, deset jedinica postaje jedna desetica: u stupac pišemo ono što preostane, a ' +
        'skupinu prenosimo u sljedeći stupac kao jednu jedinicu tog mjesta. To nije trik nego pregrupiranje: količina se ' +
        'ne mijenja. „Pišem 5, pamtim 1.”</p>' +
        '<p>S tri ili četiri pribrojnika prijenos može biti 2 ili 3 (s k brojeva najviše k − 1).</p>' +
        '<p>Baza je samo način zapisa broja. U bazi 2, 8 ili 16 isti je postupak, samo prijenos nastaje kad zbroj ' +
        'stupca dosegne 2, 8 ili 16. Zbroj stupca računamo kao količinu, a u stupac pišemo znamenku baze (u bazi 16 ' +
        'A = 10, …, F = 15). Promjena baze ne mijenja brojeve, samo njihove znamenke.</p>'
    },
    en: {
      stage: 'Column addition',

      audLabel: 'View',
      audGroup: 'Who the view is for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For projecting in class: any numbers, step forward and back, a typical mistake.',
      audAdultHint: 'For a parent or a refresher: every step says why it works.',
      audChildHint: 'For grades 2 to 4: big digits, the school phrasing, base 10.',

      numsTitle: 'Numbers',
      numsLabel: 'Addends in base {b}',
      numsHint: 'Two to four numbers, up to 9 digits each.',
      errDigit: '“{at}” is not a digit in base {b}.',
      errLong: 'At most 9 digits: {at}.',
      errCount: 'Type two to four numbers.',
      errEmpty: 'A number is missing between two + signs.',

      base: 'Base',
      baseHint: 'The same quantity, other digits.',
      baseQuick: 'Common bases',
      baseName2: 'binary',
      baseName8: 'octal',
      baseName10: 'decimal',
      baseName16: 'hexadecimal',
      baseTooLong: 'In base {b} the number {num} would need more than 9 digits.',
      mistake: 'Typical mistake',
      mNone: 'none',
      mNocarry: 'no carry',
      mWhole: 'whole sum',
      mLeft: 'left-aligned',

      pTwo: 'Two numbers',
      pTwoHint: '457 + 368: two carries',
      pReach: 'A sum of exactly 10',
      pReachHint: '645 + 355: every column reaches the base',
      pFour: 'Four numbers, carry 3',
      pFourHint: '2738 + 4596 + 1879 + 3967',
      pLeft: 'Different lengths',
      pLeftHint: '1205 + 87, with the left-alignment mistake',
      pBin: 'Base 2',
      pBinHint: '1011 + 111 in base 2',
      pHex: 'Base 16',
      pHexHint: '3A7 + 1F9 in base 16',

      legCol: 'column being added',
      legCarry: 'carry',
      legChanged: 'written in this step',
      legGroup: 'a full group = 1 of the next place',

      paper: 'The working on paper',
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
      decimal: 'decimal',
      carryCell: 'carry {c}',

      u0: ['{n} one', '{n} ones'],
      u1: ['{n} ten', '{n} tens'],
      u2: ['{n} hundred', '{n} hundreds'],
      u3: ['{n} thousand', '{n} thousands'],
      uGen: ['{n} unit of the ×{v} place', '{n} units of the ×{v} place'],
      col0: 'ones',
      col1: 'tens',
      col2: 'hundreds',
      col3: 'thousands',
      colGen: '×{v}',
      head0: 'Ones',
      head1: 'Tens',
      head2: 'Hundreds',
      head3: 'Thousands',
      headGen: 'Column ×{v}',

      rgTitle: 'Regrouping',
      rgStart: 'The column sum is laid out here: one dot for each unit of that place.',
      rgCol: 'The {col} column',
      rgFinal: 'The last carry',
      rgFromDigits: 'from the digits',
      rgFromCarry: 'carried in',
      rgLeft: 'goes left: {q}',
      rgStays: 'stays: {r}',
      rgFits: 'fewer than {b}: it all fits in this place',
      rgDots: ['{n} dot', '{n} dots'],

      mtHead: 'Typical mistake',
      mtNocarry: 'the carry forgotten',
      mtWhole: 'the whole sum in a column',
      mtLeft: 'aligned on the left',
      mtInstead: 'instead of {res}',
      whyNocarry: 'Each forgotten carry is a whole unit of the next place. The result is short by exactly what they are worth: {lost}.',
      whyWhole: 'A place holds one digit. Written whole, the sum {s} pushes its first digit into the place on the left, and everything left of it moves one place further.',
      whyLeft: 'Digits go under each other by place, from the right. Aligned on the left, {num} is read as {mis}.',
      sameNocarry: 'No column reaches the base here, so this mistake changes nothing.',
      sameWhole: 'No column reaches the base here, so this mistake changes nothing.',
      sameLeft: 'The numbers have equally many digits, so this mistake does not show here. Try 1205 + 87.',
      sameAny: 'Here this mistake happens to give the right result, but the method is still wrong.',
      sameWholeLast: 'Only the last column reaches the base, and its carry is written in front anyway, so the mistake does not show here. Try 457 + 368.',
      wrongCell: 'wrong: {w}',

      cStartT: 'The numbers are written aligned on the right: ones under ones, tens under tens. We add column by column, starting with the ones.',
      cSumT: '{head}: {expr} = {sum}.',
      cSumOneT: '{head}: only {d}, nothing to add.',
      cSumOneA: '{head}: only {d}; one addend has this place.',
      cSumOneC: 'Only {d}.',
      cReachT: '{sum} ≥ {b}: there will be a carry.',
      cBelowT: '{sum} < {b}: no carry.',
      cWriteT: 'Write {d}, carry {c}: the carry goes to the {next} column.',
      cWriteNoT: 'Write {d}. Nothing to carry.',
      cCarryDigits: 'In base {b} the carry {c} is written {ct}.',
      cFinalT: 'The carry {c} has nothing to be added to, so it is written in front.',
      cResultT: 'Result: {expr} = {res}.',
      cDecimal: 'In decimal: {expr} = {res}.',

      cStartA: 'Each place is worth {b} times the place on its right. That is why the numbers are aligned on the right: a column holds units of one place, and only those can be added.',
      cSumA: '{head}: {expr} = {sumU}.',
      cSumCarryA: 'The carry is part of this column’s sum, like any digit.',
      cWriteA: '{sumU} = {qU} and {rU}. I write {r} in this column, and the carry, {qU}, goes to the {next} column: nothing added or lost, only regrouped.',
      cWriteNoA: '{sumU}, fewer than {b}: it all fits in this place. Write {r}.',
      cFinalA: 'The carry, {cU}, has no column among the numbers, so it is written in front of the other digits.',

      cStartC: 'We add from the right. Ones first.',
      cSumC: '{expr} = {sum}.',
      cWriteC: 'Write {d}, carry {c}.',
      cWriteNoC: 'Write {d}.',
      cFinalC: 'Write {c}.',
      cDoneC: 'Done: {res}.',

      cMNocarry: 'Without the carry this would be {w}.',
      cMWhole: 'With the whole sum this would be {w}: two digits in one place.',
      cMLeft: 'Aligned on the left, this would be {w}.',
      cMEnd: 'The mistake gives {wrong} instead of {res}.',

      cRefused: 'Base {b} is not possible: {why}',

      explain: '<p>A digit is worth what its place says: in base 10 ones, tens, hundreds. That is why the numbers are ' +
        'aligned on the right, ones under ones, and added column by column, starting with the ones.</p>' +
        '<p>When a column’s sum reaches the base, ten ones become one ten: we write what is left over in the column and ' +
        'carry the group to the next column as one unit of that place. It is not a trick but a regrouping: the quantity ' +
        'does not change. “Write 5, carry 1.”</p>' +
        '<p>With three or four addends the carry can be 2 or 3 (with k numbers at most k − 1).</p>' +
        '<p>A base is only a way of writing a number. In base 2, 8 or 16 the method is the same; a carry happens when a ' +
        'column’s sum reaches 2, 8 or 16. The column sum is worked out as a quantity, and the column gets a digit of the ' +
        'base (in base 16, A = 10, …, F = 15). Changing the base does not change the numbers, only their digits.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
