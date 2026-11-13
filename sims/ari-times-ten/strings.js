/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-times-ten, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Numbers, numerals and number
   sentences are data: the page fills them in with translate="no". The title and subtitle come from sim.json.
   Caption keys end in T (teacher), A (adult) or C (child): the three audiences of the ari- pages. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tablica mjesnih vrijednosti: znamenke se pomiču pri množenju i dijeljenju s 10, 100 i 1000',

      // the audience switch (shared by the ari- pages)
      audLabel: 'Za koga',
      audGroup: 'Prikaz za',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju: bilo koji broj, bilo koja baza, tipična pogreška.',
      audAdultHint: 'Uz svaki korak piše zašto vrijedi.',
      audChildHint: 'Velike znamenke, malo riječi, baza 10.',

      // panel
      numsTitle: 'Broj',
      numLabel10: 'Broj',
      numLabel: 'Broj u bazi {b}',
      numHint: 'Od 1 do milijuna; razmaci su dopušteni.',
      errDigit: '„{at}” nije znamenka baze {b}.',
      errMax: 'Najviše milijun.',
      errEmpty: 'Upiši broj.',
      errZero: 'Upiši broj veći od 0.',
      base: 'Baza',
      baseQuick: 'Česte baze',
      baseHint: 'Ista količina, druge znamenke: 10 u bazi b vrijedi b.',
      baseName2: 'binarno',
      baseName8: 'oktalno',
      baseName10: 'dekadski',
      baseName16: 'heksadekadski',
      mistake: 'Tipična pogreška',
      mNone: 'bez',
      mFew: 'nula premalo',
      mMiddle: 'nula iz sredine',

      pTen: '34 · 10',
      pTenHint: 'Svaka znamenka jedno mjesto ulijevo, 0 na mjesto jedinica.',
      pHundred: '47 · 100 i pogreška',
      pHundredHint: '47 · 100 = 4700; tipična pogreška: 470, nula premalo.',
      pThousand: '205 · 1000',
      pThousandHint: 'I nula u sredini pomiče se kao svaka znamenka: 205 000.',
      pDivide: '3040 : 10 i pogreška',
      pDivideHint: '3040 : 10 = 304; tipična pogreška: 340, precrtana nula iz sredine.',
      pTwoZeros: '3470 : 100',
      pTwoZerosHint: 'Za : 100 trebaju dvije nule na kraju: 7 ne smije izaći iz tablice.',
      pBase2: 'Baza 2: 1011 · 100',
      pBase2Hint: '11 · 4 = 44: u bazi 2 svaki pomak ulijevo množi s 2.',

      // legend
      legBand: 'jedinice u ovom koraku',
      legNew: 'upisano u ovom koraku',
      legOut: 'izlazi iz tablice',

      // the stage
      opsLabel: 'Računska operacija',
      opIs: '= {op}',
      tipOver: 'Rezultat bi bio veći od milijuna.',
      tipStop: '{n} ne završava s dovoljno nula.',
      goOn: 'Dalje s {r}',
      goOnHint: 'Rezultat postaje novi broj (tipka D).',
      stopWord: 'ne ide do kraja',
      overWord: 'više od milijuna',
      paperLabel: 'Tablica mjesnih vrijednosti, redak po redak: {rows}',
      outLabel: 'izlazi iz tablice: {d}',
      outWrong: 'ne smije izaći: {d}',
      place0: 'J',
      place1: 'D',
      place2: 'S',
      place3: 'T',
      place4: 'DT',
      place5: 'ST',
      place6: 'M',
      placeName0: 'jedinice',
      placeName1: 'desetice',
      placeName2: 'stotice',
      placeName3: 'tisućice',
      placeName4: 'desetice tisuća',
      placeName5: 'stotice tisuća',
      placeName6: 'milijuni',

      whyTitle: 'Kamo ide svaka znamenka',
      whyLater: 'Kamo? Pogledaj prvi pomak.',
      whyZero: 'Nula na kraju drži mjesto.',
      whyZeros: 'Nule na kraju drže mjesta.',
      decTitle: 'Isti brojevi dekadski',
      decMul: '10 u bazi {b} vrijedi {b}: svaki pomak ulijevo množi s {b}.',
      decDiv: '10 u bazi {b} vrijedi {b}: svaki pomak udesno dijeli s {b}.',
      decBin: 'Zato pisano množenje u bazi 2 samo zbraja pomaknute retke.',

      mcHead: 'Tipična pogreška',
      mcWrote: 'Učenik je napisao:',
      mcAsk: 'Gdje je pogreška? Odgovor na kraju.',
      mcWhyFewMul: 'Znamenke su se pomaknule za {wrong} ulijevo, a trebaju za {right}: to je množenje brojem {byW}, a ne brojem {by}.',
      mcWhyFewDiv: 'Znamenke su se pomaknule za {wrong} udesno, a trebaju za {right}: to je dijeljenje brojem {byW}, a ne brojem {by}.',
      mcWhyFewMul1: 'Znamenke se nisu pomaknule ni za jedno mjesto, a trebaju za jedno: to je množenje brojem 1, a ne brojem {by}.',
      mcWhyFewDiv1: 'Znamenke se nisu pomaknule ni za jedno mjesto, a trebaju za jedno: to je dijeljenje brojem 1, a ne brojem {by}.',
      mcWhyMiddle1: 'Precrtana je prva nula slijeva. Znamenke se pomiču udesno, pa iz tablice izlazi samo nula s kraja: {right}.',
      mcWhyMiddle: 'Precrtane su prve nule slijeva. Znamenke se pomiču udesno, pa iz tablice izlaze samo nule s kraja: {right}.',
      mcNaMul: 'Ova se pogreška događa pri dijeljenju: pogledaj primjer „{preset}”.',
      mcNaSame: 'Ovdje su prve nule slijeva baš one s kraja, pa se pogreška ne vidi: pogledaj primjer „{preset}”.',
      mcNaStop: 'Ovdje dijeljenje ne ide do kraja, pa nema rezultata za usporedbu.',
      mcNaOver: 'Ovdje množenje ne ide: rezultat bi bio veći od milijuna.',
      mcRight: 'točno',
      mcWrongRow: 'pogrešno',
      places1: 'jedno mjesto',
      places2: 'dva mjesta',
      places3: 'tri mjesta',
      end1: 'koji završavaju nulom',
      end2: 'koji završavaju s dvije nule',
      end3: 'koji završavaju s tri nule',
      moves: ['{n} pomak', '{n} pomaka', '{n} pomaka'],
      zeros: ['{n} nula', '{n} nule', '{n} nula'],
      moveNo: '{i}. pomak od {k}:',
      moveOne: 'Jedan pomak:',
      inBase: '(10 u bazi {b} je {b})',

      // captions: step 0
      cStartMulT: '{e} = ?  Množenje brojem {by} pomiče svaku znamenku za {places} ulijevo. Pritisni →.',
      cStartDivT: '{e} = ?  Dijeljenje brojem {by} pomiče svaku znamenku za {places} udesno; ide samo za brojeve {end}.',
      cStartMulA: 'Množenje brojem {by}: svaka jedinica postaje {by} puta veća, pa svaka znamenka prelazi na mjesto koje vrijedi {by} puta više, {places} ulijevo.',
      cStartDivA: 'Dijeljenje brojem {by}: svaka jedinica postaje {by} puta manja, pa svaka znamenka prelazi na mjesto koje vrijedi {by} puta manje, {places} udesno.',
      cStartMulC: '{e} = ?',
      cStartDivC: '{e} = ?',
      // a move
      cMoveMulT: 'svaka znamenka jedno mjesto ulijevo ({op}), a na mjesto jedinica pišem 0: {v}.',
      cMoveDivT: 'svaka znamenka jedno mjesto udesno ({op}), a 0 iz jedinica izlazi iz tablice: {v}.',
      cMoveMulA: 'Svaka jedinica postaje {b} puta veća: {ex}. Na mjestu jedinica ne ostaje ništa, a 0 drži ostale znamenke na njihovim mjestima.',
      cMoveDivA: 'Svaka jedinica postaje {b} puta manja: {ex}. Nula jedinica podijeljena s {b} je nula, pa se ništa ne gubi.',
      cMoveMulC: 'Sve znamenke jedno mjesto ulijevo. Na mjesto jedinica pišem 0.',
      cMoveDivC: 'Sve znamenke jedno mjesto udesno. Nula odlazi.',
      // the result, outside the table
      cDoneMulT: 'Izvan tablice: {e}. {moves} ulijevo, {zeros} na kraju.',
      cDoneDivT: 'Izvan tablice: {e}. {moves} udesno, {zeros} manje na kraju.',
      cDoneMulA: '{e}: svaka znamenka vrijedi {by} puta više nego prije, a broj je zbroj vrijednosti svojih znamenaka: {sum}.',
      cDoneDivA: '{e}: svaka znamenka vrijedi {by} puta manje nego prije, a broj je zbroj vrijednosti svojih znamenaka: {sum}.',
      cDoneMulC: '{e}',
      cDoneDivC: '{e}',
      cDoneDec: 'Dekadski: {chk}.',
      // over a million; a digit that may not leave
      cOverT: '{e} bilo bi {r}, više od milijuna. Ova stranica računa do milijuna, kao 4. razred.',
      cOverA: '{e} bilo bi {r}, više od milijuna. Ova stranica računa do milijuna, kao 4. razred.',
      cOverC: 'To je više od milijuna.',
      cStopT: 'Iz jedinica bi morala izaći znamenka {d}, a izaći smije samo 0. Brojem {by} dijelimo samo brojeve {end}. ({n} : {by} = {q}, ostatak {r}: to je dijeljenje s ostatkom.)',
      cStopA: 'Pomak udesno svaku jedinicu čini {b} puta manjom. Znamenka jedinica {d} podijeljena s {b} ne daje cijeli broj jedinica, a desno od jedinica cijeli broj nema mjesta. Zato dijelimo samo brojeve {end}.',
      cStopC: 'Ne ide: {d} ne smije izaći iz tablice.',

      explain: '<p>U <b>tablici mjesnih vrijednosti</b> svako mjesto vrijedi deset puta više od mjesta desno od njega: ' +
        'jedinice, desetice, stotice, tisućice. <b>Množenje s 10</b> svaku jedinicu čini deset puta većom: 7 jedinica ' +
        'postaje 7 desetica, 4 desetice postaju 4 stotice. Zato svaka znamenka prelazi jedno mjesto ulijevo, a na mjestu ' +
        'jedinica ne ostaje ništa: tu pišemo 0 da ostale znamenke ostanu na svojim mjestima. Množenje sa 100 su dva ' +
        'takva pomaka (100 = 10 · 10), s 1000 tri.</p>' +
        '<p><b>Dijeljenje s 10</b> je pomak udesno: svaka jedinica postaje deset puta manja. Nula s mjesta jedinica ' +
        'izlazi iz tablice i ništa se ne gubi. Ako na mjestu jedinica nije 0, dijeljenje s 10 ne daje cijeli broj (to je ' +
        'dijeljenje s ostatkom), pa na ovoj razini s 10 dijelimo samo brojeve koji završavaju nulom, sa 100 one s dvije ' +
        'nule na kraju. Nula u sredini broja nije ta nula: 3040 : 10 = 304.</p>' +
        '<p>Najprije u tablici, zatim izvan nje, pravilnim zapisom (47 · 100 = 4700), kako preporučuje kurikul za 3. ' +
        'razred. <b>U bilo kojoj bazi</b> b isto vrijedi za množenje s b: zapisano u bazi b, b je „10”, pa pomak ' +
        'ulijevo množi s b. U bazi 2 to je množenje s 2.</p>'
    },
    en: {
      stage: 'The place-value table: the digits move when multiplying and dividing by 10, 100 and 1000',

      audLabel: 'For',
      audGroup: 'View for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For projecting: any number, any base, a typical mistake.',
      audAdultHint: 'Each step says why it works.',
      audChildHint: 'Big digits, few words, base 10.',

      numsTitle: 'Number',
      numLabel10: 'Number',
      numLabel: 'Number in base {b}',
      numHint: 'From 1 to a million; spaces are allowed.',
      errDigit: '“{at}” is not a digit of base {b}.',
      errMax: 'A million at most.',
      errEmpty: 'Type a number.',
      errZero: 'Type a number greater than 0.',
      base: 'Base',
      baseQuick: 'Common bases',
      baseHint: 'The same amount, other digits: 10 in base b is worth b.',
      baseName2: 'binary',
      baseName8: 'octal',
      baseName10: 'decimal',
      baseName16: 'hexadecimal',
      mistake: 'Typical mistake',
      mNone: 'none',
      mFew: 'a 0 too few',
      mMiddle: 'a 0 from the middle',

      pTen: '34 · 10',
      pTenHint: 'Every digit one place left, a 0 in the ones place.',
      pHundred: '47 · 100 and a mistake',
      pHundredHint: '47 · 100 = 4700; the typical mistake: 470, a 0 too few.',
      pThousand: '205 · 1000',
      pThousandHint: 'A 0 in the middle moves like any digit: 205,000.',
      pDivide: '3040 : 10 and a mistake',
      pDivideHint: '3040 : 10 = 304; the typical mistake: 340, a 0 crossed out from the middle.',
      pTwoZeros: '3470 : 100',
      pTwoZerosHint: ': 100 needs two zeros at the end: the 7 may not leave the table.',
      pBase2: 'Base 2: 1011 · 100',
      pBase2Hint: '11 · 4 = 44: in base 2 each move left multiplies by 2.',

      legBand: 'the ones in this step',
      legNew: 'written in this step',
      legOut: 'leaves the table',

      opsLabel: 'Operation',
      opIs: '= {op}',
      tipOver: 'The result would be more than a million.',
      tipStop: '{n} does not end in enough zeros.',
      goOn: 'Go on with {r}',
      goOnHint: 'The result becomes the new number (key D).',
      stopWord: 'does not go to the end',
      overWord: 'more than a million',
      paperLabel: 'Place-value table, row by row: {rows}',
      outLabel: 'leaves the table: {d}',
      outWrong: 'may not leave: {d}',
      place0: 'O',
      place1: 'T',
      place2: 'H',
      place3: 'Th',
      place4: 'TTh',
      place5: 'HTh',
      place6: 'M',
      placeName0: 'ones',
      placeName1: 'tens',
      placeName2: 'hundreds',
      placeName3: 'thousands',
      placeName4: 'ten thousands',
      placeName5: 'hundred thousands',
      placeName6: 'millions',

      whyTitle: 'Where each digit goes',
      whyLater: 'Where to? See the first move.',
      whyZero: 'The 0 at the end holds a place.',
      whyZeros: 'The zeros at the end hold the places.',
      decTitle: 'The same numbers in decimal',
      decMul: '10 in base {b} is worth {b}: each move left multiplies by {b}.',
      decDiv: '10 in base {b} is worth {b}: each move right divides by {b}.',
      decBin: 'That is why written multiplication in base 2 only adds shifted rows.',

      mcHead: 'Typical mistake',
      mcWrote: 'A pupil wrote:',
      mcAsk: 'Where is the mistake? The answer comes at the end.',
      mcWhyFewMul: 'The digits moved {wrong} left, but they must move {right}: that is multiplying by {byW}, not by {by}.',
      mcWhyFewDiv: 'The digits moved {wrong} right, but they must move {right}: that is dividing by {byW}, not by {by}.',
      mcWhyFewMul1: 'The digits did not move at all, but they must move one place: that is multiplying by 1, not by {by}.',
      mcWhyFewDiv1: 'The digits did not move at all, but they must move one place: that is dividing by 1, not by {by}.',
      mcWhyMiddle1: 'The first 0 from the left was crossed out. The digits move right, so only the 0 at the end leaves the table: {right}.',
      mcWhyMiddle: 'The first zeros from the left were crossed out. The digits move right, so only the zeros at the end leave the table: {right}.',
      mcNaMul: 'This mistake happens when dividing: see the example “{preset}”.',
      mcNaSame: 'Here the first zeros from the left are the ones at the end, so the mistake does not show: see the example “{preset}”.',
      mcNaStop: 'Here the division does not go to the end, so there is no result to compare.',
      mcNaOver: 'Here the multiplication does not go: the result would be more than a million.',
      mcRight: 'right',
      mcWrongRow: 'wrong',
      places1: 'one place',
      places2: 'two places',
      places3: 'three places',
      end1: 'that end in 0',
      end2: 'that end in two zeros',
      end3: 'that end in three zeros',
      moves: ['{n} move', '{n} moves'],
      zeros: ['{n} zero', '{n} zeros'],
      moveNo: 'Move {i} of {k}:',
      moveOne: 'One move:',
      inBase: '(10 in base {b} is {b})',

      cStartMulT: '{e} = ?  Multiplying by {by} moves every digit {places} left. Press →.',
      cStartDivT: '{e} = ?  Dividing by {by} moves every digit {places} right; it works only for numbers {end}.',
      cStartMulA: 'Multiplying by {by}: every unit becomes {by} times bigger, so every digit goes to the place worth {by} times more, {places} left.',
      cStartDivA: 'Dividing by {by}: every unit becomes {by} times smaller, so every digit goes to the place worth {by} times less, {places} right.',
      cStartMulC: '{e} = ?',
      cStartDivC: '{e} = ?',
      cMoveMulT: 'every digit one place left ({op}), and I write 0 in the ones place: {v}.',
      cMoveDivT: 'every digit one place right ({op}), and the 0 of the ones leaves the table: {v}.',
      cMoveMulA: 'Every unit becomes {b} times bigger: {ex}. Nothing is left in the ones place, and the 0 keeps the other digits in their places.',
      cMoveDivA: 'Every unit becomes {b} times smaller: {ex}. Zero ones divided by {b} is zero, so nothing is lost.',
      cMoveMulC: 'All digits one place left. I write 0 in the ones place.',
      cMoveDivC: 'All digits one place right. The 0 goes away.',
      cDoneMulT: 'Outside the table: {e}. {moves} left, {zeros} at the end.',
      cDoneDivT: 'Outside the table: {e}. {moves} right, {zeros} fewer at the end.',
      cDoneMulA: '{e}: every digit is worth {by} times more than before, and a number is the sum of what its digits are worth: {sum}.',
      cDoneDivA: '{e}: every digit is worth {by} times less than before, and a number is the sum of what its digits are worth: {sum}.',
      cDoneMulC: '{e}',
      cDoneDivC: '{e}',
      cDoneDec: 'In decimal: {chk}.',
      cOverT: '{e} would be {r}, more than a million. This page counts up to a million, as grade 4 does.',
      cOverA: '{e} would be {r}, more than a million. This page counts up to a million, as grade 4 does.',
      cOverC: 'That is more than a million.',
      cStopT: 'The digit {d} would have to leave the ones, and only a 0 may leave. We divide by {by} only numbers {end}. ({n} : {by} = {q}, remainder {r}: that is division with a remainder.)',
      cStopA: 'A move right makes every unit {b} times smaller. The ones digit {d} divided by {b} does not give a whole number of ones, and a whole number has no place right of the ones. That is why we divide only numbers {end}.',
      cStopC: 'It does not work: the {d} may not leave the table.',

      explain: '<p>In the <b>place-value table</b> every place is worth ten times the place to its right: ones, tens, ' +
        'hundreds, thousands. <b>Multiplying by 10</b> makes every unit ten times bigger: 7 ones become 7 tens, 4 tens ' +
        'become 4 hundreds. So every digit moves one place left, and nothing is left in the ones place: we write 0 there so ' +
        'the other digits keep their places. Multiplying by 100 is two such moves (100 = 10 · 10), by 1000 three.</p>' +
        '<p><b>Dividing by 10</b> is a move right: every unit becomes ten times smaller. The 0 in the ones place leaves ' +
        'the table and nothing is lost. If the ones digit is not 0, dividing by 10 does not give a whole number (that is ' +
        'division with a remainder), so at this level we divide by 10 only numbers that end in 0, by 100 those that end in ' +
        'two zeros. A 0 in the middle is not that 0: 3040 : 10 = 304.</p>' +
        '<p>First in the table, then outside it in the proper written form (47 · 100 = 4700), as the curriculum recommends ' +
        'for grade 3. <b>In any base</b> b the same holds for multiplying by b: written in base b, b is “10”, so a move ' +
        'left multiplies by b. In base 2 that is multiplying by 2.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
