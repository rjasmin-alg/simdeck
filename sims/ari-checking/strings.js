/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-checking, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Captions and card lines come in three registers where they differ, one per audience: T (teacher, the school check),
   A (adult, why it works), C (child, short spoken lines). Keys ending in _add, _sub, _mul, _div are per operation.
   Numbers and digits are filled in by the page as nodes (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Provjera rezultata',

      // audience switch (header)
      audLabel: 'Prikaz',
      audGroup: 'Za koga je prikaz',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju u razredu: bilo koji zadatak, tipični pogrešni rezultati i kako nastaju.',
      audAdultHint: 'Za roditelja ili ponavljanje: zašto provjera i procjena rade.',
      audChildHint: 'Za 2. do 4. razred: velike znamenke, kratke rečenice, baza 10.',

      // task field (panel)
      taskTitle: 'Zadatak',
      taskLabel: 'Zadatak u bazi {b}',
      taskHint: 'Npr. 846 − 378 = 478 ili 846 : 3 = 281, 3 (ostatak iza zareza). Bez = rezultat je točan.',
      errEmpty: 'Nedostaje broj.',
      errGap: 'Broj ne smije imati razmak: {at}.',
      errOp: 'Upiši točno jedan znak: + − · ili :.',
      errDigit: '„{at}” nije znamenka baze {b}.',
      errLong: 'Previše znamenaka: {at}. Zbrajanje i oduzimanje do 6, faktori do 4 i 3, djeljenik 6 i djelitelj 3.',
      errNeg: 'Umanjitelj ne smije biti veći od umanjenika.',
      errZero: 'S nulom ovdje nema provjere: nulom se ne dijeli.',
      errRest: 'Ostatak ima samo dijeljenje.',
      errCount: 'Iza = upiši rezultat, a kod dijeljenja još i ostatak.',

      // the given result (panel, teacher)
      given: 'Zadani rezultat',
      givenHint: 'Točan ili jedna od tipičnih pogrešaka na ovim brojevima.',
      gRight: 'točan',
      g_add_carry: 'prijenos nije dodan',
      g_add_lastCarry: 'zadnji prijenos nije napisan',
      g_sub_borrow: 'posuđeno nije vraćeno',
      g_sub_align: 'stupci nisu poravnani',
      g_mul_carry: 'prijenos zaboravljen',
      g_mul_shift: 'redovi nisu pomaknuti',
      g_div_rest: 'jednom premalo',
      g_div_zero: 'zaboravljena 0',
      gNa: 'Na ovim brojevima ta pogreška ne nastaje.',

      // params
      est: 'Procjena',
      chk: 'Provjera',
      hide: 'Sakrij',
      estKey: 'Pokaži ili sakrij procjenu',
      chkKey: 'Pokaži ili sakrij provjeru',
      base: 'Baza',
      baseHint: 'Ista količina, druge znamenke.',
      baseQuick: 'Česte baze',
      baseName2: 'binarno',
      baseName8: 'oktalno',
      baseName10: 'dekadski',
      baseName16: 'heksadekadski',
      baseTooLong: 'U bazi {b} broj {num} imao bi previše znamenaka.',
      op_add: 'zbrajanje',
      op_sub: 'oduzimanje',
      op_mul: 'množenje',
      op_div: 'dijeljenje',

      // presets: the task itself, so the class can find the wrong one
      pBorrow: '846 − 378 = 478',
      pSum: '457 + 368 = 825',
      pShift: '457 · 36 = 4113',
      pZero: '618 : 3 = 26',
      pRem: '846 : 3 = 281, ostatak 3',
      pBin: '1101 · 101 = 11010 (baza 2)',
      pHint_add: 'zbrajanje: je li točno?',
      pHint_sub: 'oduzimanje: je li točno?',
      pHint_mul: 'množenje: je li točno?',
      pHint_div: 'dijeljenje: je li točno?',

      // legend
      legBand: 'mjesta koja se razlikuju',
      legWrong: 'pogrešna znamenka',

      // the task
      taskHead: 'Zadatak',
      taskQ: 'Je li točno?',
      paperTask: 'Zadatak s rezultatom',
      remainder: 'ostatak {r}',
      vRight: 'točno',
      vWrong: 'netočno',
      rightIs: 'točno je {res}',
      withRest: '{q}, ostatak {r}',
      wrongCell: 'pogrešno: {w}',

      // the estimate card
      estHead: 'Procjena',
      estSub: 'prije računanja',
      estPrompt: 'Zaokruži brojeve i izračunaj napamet. Je li rezultat otprilike tolik?',
      estPromptC: 'Koliko otprilike?',
      estOpen: 'Procijeni',
      estAgain: 'Zaokruženi na vodeće mjesto bili bi jednaki, pa oba zaokružujem na stupac {col}.',
      estEasy: '{a} je blizu, a lako se dijeli s {d}.',
      estRows: '≈ procjena · ? zadani rezultat, poravnani po mjestima',
      paperEst: 'Procjena i zadani rezultat, poravnani po mjestima',
      estNear: '{g} je blizu {e}: veličina odgovara. Procjena ne vidi pogrešnu znamenku; to može samo provjera.',
      estNearC: '{g} je blizu {e}. Možda je točno.',
      estFarMore: '{g} ima {places} više od {e}: promašeno je mjesto. Rezultat sigurno nije točan.',
      estFarLess: '{g} ima {places} manje od {e}: promašeno je mjesto. Rezultat sigurno nije točan.',
      estFarSize: '{g} je predaleko od {e}, više od pola mjesta. Rezultat sigurno nije točan.',
      places: ['{n} mjesto', '{n} mjesta', '{n} mjesta'],
      placesOne: 'jedno mjesto',
      dirMore: 'više',
      dirLess: 'manje',
      estFarZero: '{g} nije ni blizu {e}. Rezultat sigurno nije točan.',
      estFarC: '{g} je predaleko od {e}. Nije točno!',
      estRough: 'Ovdje je procjena pregruba: zaokruživanje je previše promijenilo brojeve. Odlučuje provjera.',
      estRoughC: 'Ovdje procjena ne pomaže. Provjeri!',
      estQuot: 'Kod dijeljenja procjenjujem količnik; ostatak ne.',
      estWhyA: 'Zaokruženi broj razlikuje se od pravoga najviše za pola vodećeg mjesta, pa je i procjena blizu pravog ' +
        'rezultata. Rezultat s mjestom viška ili manjka ima znamenku više ili manje od procjene i višestruko je veći ili ' +
        'manji (u bazi {b} jedno mjesto vrijedi {b} puta više): to se vidi odmah.',

      // the check card
      chkHead: 'Provjera',
      chkPrompt_add: 'Zbrajanje provjeravam oduzimanjem.',
      chkPrompt_sub: 'Oduzimanje provjeravam zbrajanjem.',
      chkPrompt_mul: 'Množenje provjeravam dijeljenjem.',
      chkPrompt_div: 'Dijeljenje provjeravam množenjem.',
      chkPromptC: 'Provjeri!',
      chkOpen: 'Provjeri',
      chkSub_add: 'obrnutom operacijom: oduzimanjem',
      chkSub_sub: 'obrnutom operacijom: zbrajanjem',
      chkSub_mul: 'obrnutom operacijom: dijeljenjem',
      chkSub_div: 'obrnutom operacijom: množenjem',
      chkRule_add: 'zbroj − pribrojnik = drugi pribrojnik',
      chkRule_sub: 'razlika + umanjitelj = umanjenik',
      chkRule_mul: 'umnožak : faktor = drugi faktor, bez ostatka',
      chkRule_div: 'količnik · djelitelj + ostatak = djeljenik, a ostatak je manji od djelitelja',
      paperChk: 'Provjera obrnutom operacijom',
      chkOk: 'Dobije se {v}, točno {a}: rezultat je točan.',
      chkBad: 'Dobije se {v}, a treba {a}: rezultat nije točan.',
      chkLess: '{g} je manji od {b}: zbroj nikad nije manji od pribrojnika. Rezultat nije točan.',
      chkMulRem: '{g} : {b} = {q}, ostatak {r}. Treba {a} bez ostatka: rezultat nije točan.',
      chkMulOk: '{g} : {b} = {q} bez ostatka, točno {a}: rezultat je točan.',
      chkDivRem: 'Jednakost vrijedi, ali ostatak {r} nije manji od djelitelja {b}: {b} bi stao još jednom. Rezultat nije točan.',
      chkWork: 'Postupak dijeljenja: stranica Pisano dijeljenje.',
      chkOkC: 'Dobiješ {a}. Točno!',
      chkBadC: 'Dobiješ {v}, a ne {a}. Nije točno!',
      chkLessC: '{g} je manje od {b}. Nije točno!',
      chkRemC: 'Ostatak {r} je prevelik. Nije točno!',
      chkMulRemC: 'Ostaje {r}, a ne smije ostati ništa. Nije točno!',
      chkWhy_add: 'Oduzimanje poništava zbrajanje: što sam dodao, oduzmem, i mora ostati broj od kojeg sam krenuo.',
      chkWhy_sub: 'Zbrajanje poništava oduzimanje: što sam oduzeo, vratim, i moram dobiti broj od kojeg sam krenuo.',
      chkWhy_mul: 'Dijeljenje poništava množenje: umnožak podijeljen jednim faktorom daje drugi, bez ostatka.',
      chkWhy_div: 'Množenje poništava dijeljenje: količnik puta djelitelj je ono što je podijeljeno, a ostatak je ono ' +
        'što nije stalo. Zajedno daju djeljenik.',

      // how a typical wrong result arises (teacher, with the check)
      causeHead: 'Kako nastaje',
      cause_add_carry: 'U stupcu {col} zbroj je {s}: napisano je {d}, ali prijenos {c} nije dodan sljedećem stupcu.',
      cause_add_lastCarry: 'U zadnjem stupcu ({col}) zbroj je {b} ili više, a prijenos 1 nije napisan ispred.',
      cause_sub_borrow: 'U stupcu {col} posuđeno je 1 od sljedećeg stupca, ali ondje to nije oduzeto: posuđeno nije vraćeno.',
      cause_sub_align: '{n} je napisan ispod lijevih znamenaka, kao da je {m}: stupci nisu poravnani po mjestima.',
      cause_mul_carry: '{x} · {y} = {p}: napisano je {d}, ali prijenos {c} nije dodan sljedećem umnošku.',
      cause_mul_shift: 'Djelomični umnošci zbrojeni su jedan ispod drugoga, bez pomaka za mjesto ulijevo.',
      cause_div_rest: 'U zadnjem koraku uzeto je jednom premalo ({w} umjesto {q}), pa je ostatak ostao velik.',
      cause_div_zero: 'Kad djelitelj nije stao, u količnik nije napisana 0, pa su se znamenke pomaknule za mjesto.',

      // column names (genitive, "u stupcu …")
      col0: 'jedinica',
      col1: 'desetica',
      col2: 'stotica',
      col3: 'tisućica',
      col4: 'desetica tisuća',
      col5: 'stotica tisuća',
      col6: 'milijuna',
      colGen: 'mjesta {v}',
      // place labels
      place0: 'J',
      place1: 'D',
      place2: 'S',
      place3: 'T',
      place4: 'DT',
      place5: 'ST',
      place6: 'M',
      place7: 'DM',
      placeName0: 'jedinice',
      placeName1: 'desetice',
      placeName2: 'stotice',
      placeName3: 'tisućice',
      placeName4: 'desetice tisuća',
      placeName5: 'stotice tisuća',
      placeName6: 'milijuni',
      placeName7: 'desetice milijuna',
      placeName: 'mjesto vrijednosti {v}',

      // captions
      cIdleT: 'Je li {task} točno? Prvo procijeni (E), zatim provjeri obrnutom operacijom (V).',
      cIdleA: 'Dvije provjere: procjena iz zaokruženih brojeva brzo uhvati rezultat s mjestom viška ili manjka, a ' +
        'obrnuta operacija uhvati svaku pogrešku.',
      cIdleC: 'Je li točno? Procijeni, pa provjeri!',
      cEstNearT: 'Procjena: oko {e}. {g} je blizu, pa po veličini može biti točno.',
      cEstFarT: 'Procjena: oko {e}. {g} je predaleko od nje: netočno.',
      cEstPlaceT: 'Procjena: oko {e}. {g} ima {places} {dir}: promašeno mjesto, netočno.',
      cEstRoughT: 'Procjena {e} ovdje je pregruba za odluku.',
      cEstNearC: 'Otprilike {e}. {g} je blizu.',
      cEstFarC: 'Otprilike {e}. {g} je predaleko!',
      cEstRoughC: 'Procjena ovdje ne pomaže.',
      cChkOkT: 'Provjera: {line}. Točno.',
      cChkBadT: 'Provjera: {line}, a treba {a}. Netočno.',
      cChkLessT: 'Provjera: {g} − {b} ne ide, {g} je manji od {b}. Netočno.',
      cChkMulT: 'Provjera: {line}, ostatak {r}; treba {a} bez ostatka. Netočno.',
      cChkRemT: 'Provjera: {line}, ali ostatak {r} nije manji od {b}. Netočno.',
      cChkOkC: 'Točno!',
      cChkBadC: 'Nije točno!',
      cMissed: 'Procjena ovu pogrešku nije vidjela; provjera jest.',
      cCaught: 'Procjena je pogrešku vidjela odmah; provjera je potvrđuje.',
      cRightIs: 'Točan rezultat: {res}.',
      cDecimal: 'Dekadski: {line}.',
      cBinary: 'U bazi 2 množenje je pomak i zbrajanje: bez pomaka rezultat izgubi mjesta.',

      cRefused: '{why}',

      explain: '<p><b>Provjera obrnutom operacijom.</b> Svaka računska operacija ima obrnutu, koja je poništava. ' +
        'Oduzimanje provjeravam zbrajanjem: 846 − 378 = 468, a 468 + 378 = 846, broj od kojeg sam krenuo. Zbrajanje ' +
        'provjeravam oduzimanjem, množenje dijeljenjem, dijeljenje množenjem: količnik · djelitelj + ostatak = ' +
        'djeljenik, a ostatak mora biti manji od djelitelja. Provjera je drugi račun, pa ne ponavlja istu pogrešku.</p>' +
        '<p><b>Procjena.</b> Svaki broj zaokružim na vodeće mjesto (846 ≈ 800, 378 ≈ 400; 5 i više zaokružuje se ' +
        'naviše) i izračunam napamet: 800 − 400 = 400. Rezultat mora biti otprilike tolik. Ako ima mjesto viška ili ' +
        'manjka, ima znamenku više ili manje od procjene i višestruko je veći ili manji; to se vidi odmah (457 · 36 = ' +
        '4113? Procjena 500 · 40 = 20000 ima pet znamenaka, 4113 četiri: ne može biti). Kod dijeljenja biram broj blizu djeljenika koji se lako dijeli: 846 : 3 ≈ 900 : 3 = 300.</p>' +
        '<p><b>Što koja hvata.</b> Procjena hvata promašeno mjesto, ali ne i pogrešnu znamenku: 478 je blizu 400 kao i ' +
        'točnih 468. Provjera hvata obje. Zato: procijeni prije računanja, provjeri poslije.</p>' +
        '<p>U bilo kojoj bazi vrijedi isto: zaokružuje se na vodeće mjesto, a pola baze i više naviše.</p>'
    },
    en: {
      stage: 'Checking a result',

      // audience switch (header)
      audLabel: 'View',
      audGroup: 'Who the view is for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector in class: any task, typical wrong results and how they arise.',
      audAdultHint: 'For a parent or a refresher: why checking and estimating work.',
      audChildHint: 'For grades 2 to 4: big digits, short lines, base 10.',

      // task field (panel)
      taskTitle: 'Task',
      taskLabel: 'Task in base {b}',
      taskHint: 'E.g. 846 − 378 = 478 or 846 : 3 = 281, 3 (remainder after a comma). Without = the result is the right one.',
      errEmpty: 'A number is missing.',
      errGap: 'A number must not contain a space: {at}.',
      errOp: 'Type exactly one sign: + − · or :.',
      errDigit: '"{at}" is not a digit of base {b}.',
      errLong: 'Too many digits: {at}. Adding and subtracting up to 6, factors up to 4 and 3, dividend 6 and divisor 3.',
      errNeg: 'The number taken away must not be bigger than the top number.',
      errZero: 'No check with zero here: there is no dividing by zero.',
      errRest: 'Only a division has a remainder.',
      errCount: 'After = type the result, and for a division its remainder.',

      // the given result (panel, teacher)
      given: 'Given result',
      givenHint: 'The right one or a typical wrong one on these numbers.',
      gRight: 'right',
      g_add_carry: 'carry not added',
      g_add_lastCarry: 'last carry not written',
      g_sub_borrow: 'borrow not paid back',
      g_sub_align: 'columns not lined up',
      g_mul_carry: 'carry forgotten',
      g_mul_shift: 'rows not shifted',
      g_div_rest: 'once too few',
      g_div_zero: 'a 0 forgotten',
      gNa: 'This mistake does not arise with these numbers.',

      // params
      est: 'Estimate',
      chk: 'Check',
      hide: 'Hide',
      estKey: 'Show or hide the estimate',
      chkKey: 'Show or hide the check',
      base: 'Base',
      baseHint: 'The same quantity, other digits.',
      baseQuick: 'Common bases',
      baseName2: 'binary',
      baseName8: 'octal',
      baseName10: 'decimal',
      baseName16: 'hexadecimal',
      baseTooLong: 'In base {b} the number {num} would have too many digits.',
      op_add: 'addition',
      op_sub: 'subtraction',
      op_mul: 'multiplication',
      op_div: 'division',

      // presets: the task itself, so the class can find the wrong one
      pBorrow: '846 − 378 = 478',
      pSum: '457 + 368 = 825',
      pShift: '457 · 36 = 4113',
      pZero: '618 : 3 = 26',
      pRem: '846 : 3 = 281, remainder 3',
      pBin: '1101 · 101 = 11010 (base 2)',
      pHint_add: 'addition: is it right?',
      pHint_sub: 'subtraction: is it right?',
      pHint_mul: 'multiplication: is it right?',
      pHint_div: 'division: is it right?',

      // legend
      legBand: 'places that differ',
      legWrong: 'a wrong digit',

      // the task
      taskHead: 'Task',
      taskQ: 'Is it right?',
      paperTask: 'The task with its result',
      remainder: 'remainder {r}',
      vRight: 'right',
      vWrong: 'wrong',
      rightIs: 'the right result is {res}',
      withRest: '{q}, remainder {r}',
      wrongCell: 'wrong: {w}',

      // the estimate card
      estHead: 'Estimate',
      estSub: 'before computing',
      estPrompt: 'Round the numbers and work it out in your head. Is the result about that size?',
      estPromptC: 'About how much?',
      estOpen: 'Estimate',
      estAgain: 'Rounded to their leading places they would be equal, so both are rounded to the {col} place.',
      estEasy: '{a} is close, and easy to divide by {d}.',
      estRows: '≈ estimate · ? given result, lined up by place',
      paperEst: 'The estimate and the given result, lined up by place',
      estNear: '{g} is close to {e}: the size fits. The estimate cannot see a wrong digit; only the check can.',
      estNearC: '{g} is close to {e}. It may be right.',
      estFarMore: '{g} has {places} more than {e}: a place missed. The result cannot be right.',
      estFarLess: '{g} has {places} fewer than {e}: a place missed. The result cannot be right.',
      estFarSize: '{g} is too far from {e}, more than half a place. The result cannot be right.',
      places: ['{n} place', '{n} places'],
      placesOne: 'one place',
      dirMore: 'more',
      dirLess: 'fewer',
      estFarZero: '{g} is nowhere near {e}. The result cannot be right.',
      estFarC: '{g} is too far from {e}. Not right!',
      estRough: 'Here the estimate is too rough: rounding changed the numbers too much. The check decides.',
      estRoughC: 'The estimate does not help here. Check!',
      estQuot: 'For a division I estimate the quotient, not the remainder.',
      estWhyA: 'A rounded number is at most half its leading place away from the real one, so the estimate is close to ' +
        'the right result. A result with a place too many or too few has a digit more or fewer than the estimate and is ' +
        'several times bigger or smaller (in base {b} one place is worth {b} times as much): that shows at once.',

      // the check card
      chkHead: 'Check',
      chkPrompt_add: 'Check an addition by subtracting.',
      chkPrompt_sub: 'Check a subtraction by adding.',
      chkPrompt_mul: 'Check a multiplication by dividing.',
      chkPrompt_div: 'Check a division by multiplying.',
      chkPromptC: 'Check it!',
      chkOpen: 'Check',
      chkSub_add: 'by the inverse operation: subtraction',
      chkSub_sub: 'by the inverse operation: addition',
      chkSub_mul: 'by the inverse operation: division',
      chkSub_div: 'by the inverse operation: multiplication',
      chkRule_add: 'sum − addend = the other addend',
      chkRule_sub: 'difference + number taken away = top number',
      chkRule_mul: 'product : factor = the other factor, no remainder',
      chkRule_div: 'quotient · divisor + remainder = dividend, and the remainder is less than the divisor',
      paperChk: 'The check by the inverse operation',
      chkOk: 'That gives {v}, exactly {a}: the result is right.',
      chkBad: 'That gives {v}, but it must be {a}: the result is wrong.',
      chkLess: '{g} is less than {b}: a sum is never less than an addend. The result is wrong.',
      chkMulRem: '{g} : {b} = {q}, remainder {r}. It must be {a} with no remainder: the result is wrong.',
      chkMulOk: '{g} : {b} = {q} with no remainder, exactly {a}: the result is right.',
      chkDivRem: 'The equation holds, but the remainder {r} is not less than the divisor {b}: {b} would go in once more. The result is wrong.',
      chkWork: 'How to divide: the Long division page.',
      chkOkC: 'You get {a}. Right!',
      chkBadC: 'You get {v}, not {a}. Not right!',
      chkLessC: '{g} is less than {b}. Not right!',
      chkRemC: 'The remainder {r} is too big. Not right!',
      chkMulRemC: '{r} is left over, and nothing may be left. Not right!',
      chkWhy_add: 'Subtracting undoes adding: take away what was added and the number you started from must be left.',
      chkWhy_sub: 'Adding undoes subtracting: put back what was taken away and you must get the number you started from.',
      chkWhy_mul: 'Dividing undoes multiplying: the product divided by one factor gives the other, with no remainder.',
      chkWhy_div: 'Multiplying undoes dividing: quotient times divisor is what was shared out, and the remainder is what ' +
        'did not fit. Together they make the dividend.',

      // how a typical wrong result arises (teacher, with the check)
      causeHead: 'How it arises',
      cause_add_carry: 'In the {col} column the sum is {s}: {d} is written, but the carry {c} is not added to the next column.',
      cause_add_lastCarry: 'In the last column ({col}) the sum is {b} or more, and the carry 1 is not written in front.',
      cause_sub_borrow: 'In the {col} column 1 is borrowed from the next column, but not taken away there: the borrow is not paid back.',
      cause_sub_align: '{n} is written under the left digits, as if it were {m}: the columns are not lined up by place.',
      cause_mul_carry: '{x} · {y} = {p}: {d} is written, but the carry {c} is not added to the next product.',
      cause_mul_shift: 'The partial products are added one under the other, without shifting each one place left.',
      cause_div_rest: 'In the last step the divisor was taken once too few ({w} instead of {q}), so the remainder stayed big.',
      cause_div_zero: 'When the divisor did not go in, no 0 was written in the quotient, so the digits slid one place.',

      // column names ("the … column")
      col0: 'ones',
      col1: 'tens',
      col2: 'hundreds',
      col3: 'thousands',
      col4: 'ten thousands',
      col5: 'hundred thousands',
      col6: 'millions',
      colGen: '{v}s',
      // place labels
      place0: 'O',
      place1: 'T',
      place2: 'H',
      place3: 'Th',
      place4: 'TTh',
      place5: 'HTh',
      place6: 'M',
      place7: 'TM',
      placeName0: 'ones',
      placeName1: 'tens',
      placeName2: 'hundreds',
      placeName3: 'thousands',
      placeName4: 'ten thousands',
      placeName5: 'hundred thousands',
      placeName6: 'millions',
      placeName7: 'ten millions',
      placeName: 'the place worth {v}',

      // captions
      cIdleT: 'Is {task} right? Estimate first (E), then check by the inverse operation (V).',
      cIdleA: 'Two checks: an estimate from rounded numbers quickly catches a result with a place too many or too few, ' +
        'and the inverse operation catches every mistake.',
      cIdleC: 'Is it right? Estimate, then check!',
      cEstNearT: 'Estimate: about {e}. {g} is close, so by its size it may be right.',
      cEstFarT: 'Estimate: about {e}. {g} is too far from it: wrong.',
      cEstPlaceT: 'Estimate: about {e}. {g} has {places} {dir}: a place missed, wrong.',
      cEstRoughT: 'The estimate {e} is too rough to decide here.',
      cEstNearC: 'About {e}. {g} is close.',
      cEstFarC: 'About {e}. {g} is too far off!',
      cEstRoughC: 'The estimate does not help here.',
      cChkOkT: 'Check: {line}. Right.',
      cChkBadT: 'Check: {line}, but it must be {a}. Wrong.',
      cChkLessT: 'Check: {g} − {b} cannot be done, {g} is less than {b}. Wrong.',
      cChkMulT: 'Check: {line}, remainder {r}; it must be {a} with no remainder. Wrong.',
      cChkRemT: 'Check: {line}, but the remainder {r} is not less than {b}. Wrong.',
      cChkOkC: 'Right!',
      cChkBadC: 'Not right!',
      cMissed: 'The estimate did not see this mistake; the check did.',
      cCaught: 'The estimate saw the mistake at once; the check confirms it.',
      cRightIs: 'The right result: {res}.',
      cDecimal: 'In decimal: {line}.',
      cBinary: 'In base 2 multiplying is shifting and adding: without the shifts the result loses places.',

      cRefused: '{why}',

      explain: '<p><b>Checking by the inverse operation.</b> Every operation has an inverse that undoes it. Check a ' +
        'subtraction by adding: 846 − 378 = 468, and 468 + 378 = 846, the number you started from. Check an addition ' +
        'by subtracting, a multiplication by dividing, a division by multiplying: quotient · divisor + remainder = ' +
        'dividend, and the remainder must be less than the divisor. The check is a different computation, so it does ' +
        'not repeat the same slip.</p>' +
        '<p><b>Estimating.</b> Round each number to its leading place (846 ≈ 800, 378 ≈ 400; 5 and more rounds up) and ' +
        'work it out in your head: 800 − 400 = 400. The result must be about that size. With a place too many or too ' +
        'few it has a digit more or fewer than the estimate and is several times bigger or smaller; that shows at once ' +
        '(457 · 36 = 4113? The estimate 500 · 40 = 20000 has five digits, 4113 four: it cannot be). For a division pick a number near the dividend that divides easily: 846 : 3 ≈ 900 : 3 = 300.</p>' +
        '<p><b>What each one catches.</b> The estimate catches a missed place, not a wrong digit: 478 is as close to 400 as ' +
        'the right 468. The check catches both. So: estimate before computing, check after.</p>' +
        '<p>The same holds in any base: round to the leading place, half the base and more rounds up. The page uses the ' +
        'Croatian layout (846 : 3 = 282 on one line, the multiplication sign a centred dot).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
