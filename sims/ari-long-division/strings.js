/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-long-division, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Captions come in three registers, one per audience: T (teacher, the school step), A (adult, why it works), C (child,
   the spoken step). Each quotient digit has three steps: ask (how many times), sub (multiply and subtract), down
   (bring down the next digit).
   Numbers and digits are filled in by the page as nodes (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pisano dijeljenje',

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
      numsTitle: 'Djeljenik i djelitelj',
      numsLabel: 'Djeljenik : djelitelj u bazi {b}',
      numsHint: 'Djeljenik do 6 znamenaka, djelitelj do 3; između njih : ili /.',
      errDigit: '„{at}” nije znamenka baze {b}.',
      errLong: 'Djeljenik ima najviše 6 znamenaka, djelitelj 3: {at}.',
      errCount: 'Upiši djeljenik i djelitelj, npr. 846 : 3.',
      errEmpty: 'Uz znak : nedostaje broj.',
      errZero: 'Nulom se ne dijeli.',

      // params
      base: 'Baza',
      baseHint: 'Ista količina, druge znamenke.',
      baseQuick: 'Česte baze',
      baseName2: 'binarno',
      baseName8: 'oktalno',
      baseName10: 'dekadski',
      baseName16: 'heksadekadski',
      baseTooLong: 'U bazi {b} broj {num} imao bi previše znamenaka (djeljenik najviše 6, djelitelj 3).',
      why: 'Koliko puta?',
      mistake: 'Tipična pogreška',
      mNone: 'nema',
      mZero: 'zaboravljena 0',
      mDropped: 'ostatak izgubljen',
      layout: 'Zapis',
      layShort: 'kraći način',
      layLong: 'dulji način',

      // presets
      pThree: 'Troznamenkasti djeljenik',
      pThreeHint: '846 : 3',
      pFirst: 'Prvi broj od dvije znamenke',
      pFirstHint: '1736 : 7: 1 je premalo, uzimam 17',
      pZero: 'Nula u količniku',
      pZeroHint: '618 : 3, s tipičnom pogreškom',
      pRem: 'S ostatkom',
      pRemHint: '2023 : 4: nula i ostatak 3',
      pTwo: 'Dvoznamenkasti djelitelj',
      pTwoHint: '9876 : 12',
      pBin: 'Baza 2',
      pBinHint: '101110 : 101: stane ili ne stane',
      pLong: 'Dulji način',
      pLongHint: '846 : 3, s potpisanim umnošcima',
      pLongTwo: 'Dulji način s procjenom',
      pLongTwoHint: '5517 : 28: dvoznamenkasti djelitelj, procjena',

      // legend
      legBand: 'na čemu radim',
      legChanged: 'napisano u ovom koraku',

      // the paper
      paper: 'Pisano dijeljenje, račun na papiru',
      place0: 'J',
      place1: 'D',
      place2: 'S',
      place3: 'T',
      place4: 'DT',
      place5: 'ST',
      placeName0: 'jedinice',
      placeName1: 'desetice',
      placeName2: 'stotice',
      placeName3: 'tisućice',
      placeName4: 'desetice tisuća',
      placeName5: 'stotice tisuća',
      placeName: 'mjesto vrijednosti {v}',
      cellRest: 'ostatak {v}',
      cellDown: 'spuštena znamenka {v}',
      cellQuot: 'znamenka količnika {v}',
      cellProd: 'djelomični umnožak {v}',

      // place units, with counts (plural forms)
      u0: ['{n} jedinica', '{n} jedinice', '{n} jedinica'],
      u1: ['{n} desetica', '{n} desetice', '{n} desetica'],
      u2: ['{n} stotica', '{n} stotice', '{n} stotica'],
      u3: ['{n} tisućica', '{n} tisućice', '{n} tisućica'],
      u4: ['{n} desetica tisuća', '{n} desetice tisuća', '{n} desetica tisuća'],
      u5: ['{n} stotica tisuća', '{n} stotice tisuća', '{n} stotica tisuća'],
      uGen: ['{n} jedinica mjesta ×{v}', '{n} jedinice mjesta ×{v}', '{n} jedinica mjesta ×{v}'],
      // which digit of the quotient (adult)
      qPlace0: 'znamenku jedinica',
      qPlace1: 'znamenku desetica',
      qPlace2: 'znamenku stotica',
      qPlace3: 'znamenku tisućica',
      qPlace4: 'znamenku desetica tisuća',
      qPlace5: 'znamenku stotica tisuća',
      qPlaceGen: 'znamenku mjesta ×{v}',

      // the "how many times" box
      boxTitle: 'Koliko puta {d} stane u {n}?',
      boxNext: 'sljedeće pitanje',
      boxFits: 'stane',
      boxTooBig: 'previše',
      boxLabel: 'Višekratnici djelitelja; najveći koji stane u broj daje znamenku količnika.',
      boxRest: '{n} − {p} = {r}, manje od {d}',
      boxKey: '✓ stane · ✗ previše',
      boxInBase: 'brojevi u bazi {b}',
      invHead: 'Što je već podijeljeno',
      invNames: 'djeljenik = djelitelj · podijeljeno + još dijelim',
      // the estimate (a two-digit divisor)
      estRound: 'Zaokružujem na desetice: {n} ≈ {nr}, {d} ≈ {dr}.',
      estAsk: 'Procijeni, pa provjeri množenjem.',
      estLine: 'Procjena: {nr} : {dr} = {e}. Provjeravam množenjem:',
      estLineBig: 'Procjena: {nr} : {dr} = {e}, a to nije znamenka: probam 9.',
      boxSmall: 'premalo',
      estLabel: 'Probe procjene: kad je previše, smanjujem za 1; kad je premalo, povećavam za 1; dok ne stane.',
      estKey: '✓ stane · ✗ previše · ↑ premalo (ostatak nije manji od djelitelja)',

      // mistake card
      mtHead: 'Tipična pogreška',
      mtZero: 'zaboravljena 0 u količniku',
      mtDropped: 'ostatak se ne spušta s brojem',
      mtInstead: 'umjesto {res}',
      withRest: '{q}, ostatak {r}',
      mtCheck: 'Provjera: {q} · {d} + {r} = {c}, a ne {a}.',
      whyZero: '{n} : {d} = 0, ali količnik i ovdje treba {pw}. Svaka znamenka djeljenika od prvog broja nadalje daje jednu znamenku količnika, i kad je 0. Bez nje znamenke lijevo stoje mjesto niže nego što vrijede.',
      whyDropped: 'Ostatak {r} nije nestao: {ru} = {rdu}, pa ide zajedno s {xu}: dijelim {right} : {d}, a ne samo {wrong} : {d}.',
      sameZero: 'Ovaj količnik nema nulu iza prve znamenke, pa se ova pogreška ne vidi. Probaj primjer 3 (618 : 3).',
      sameDropped: 'Ovdje je svaki ostatak prije zadnjega 0, pa se ova pogreška ne vidi. Probaj primjer 1 (846 : 3).',
      wrongCell: 'pogrešno: {w}',

      // captions: start
      cStartT: 'Pišemo {expr} = i dijelimo slijeva. Uzimam onoliko prvih znamenki djeljenika koliko treba da {d} stane barem jednom.',
      cStartA: 'Dijelimo od najvećeg mjesta. Što na nekom mjestu ostane, vrijedi {b} puta više na mjestu desno, pa ide zajedno sa sljedećom znamenkom.',
      cStartC: 'Dijelimo {expr}.',

      // captions: how many times (ask)
      askFirstT: '{lead} je manje od {d}, pa uzimam i sljedeću znamenku: {n}.',
      askT: '{n} : {d} = {q}, pišem {q}.',
      askZeroT: '{n} : {d} = 0, jer je {n} manje od {d}: pišem 0 u količnik.',
      askAllT: 'Cijeli djeljenik {n} manji je od {d}: količnik je 0.',
      askFirstA: 'Na prvom mjestu {lead} je manje od {d}, pa ga spajam sa sljedećim mjestom: to je {nu}.',
      askA: '{nu} : {d} = {qu}: {q} · {d} = {p} stane u {n}, a {q1} · {d} = {p1} je previše.',
      askZeroA: '{nu} : {d} = 0, jer je {n} manje od {d}. Količnik ipak treba {pw}: 0 drži mjesto.',
      askAllA: 'Cijeli djeljenik {n} manji je od {d}: {d} ne stane ni jednom, količnik je 0.',
      askFirstC: '{lead} je premalo. Uzimam {n}.',
      askC: 'Koliko puta {d} stane u {n}? {q} puta. Pišem {q}.',
      askZeroC: '{d} ne stane u {n}. Pišem 0.',
      estT: 'Procjena: {nr} : {dr} = {e}; probam {tries}.',
      estA: 'Procjenjujem zaokruženim brojevima: {nr} : {dr} = {e}. Procjena je proba: provjerim je množenjem i popravim za 1 ({tries}).',

      // captions: multiply and subtract (sub)
      subT: '{q} · {d} = {p}, {n} − {p} = {r}.',
      subLastT: '{q} · {d} = {p}, {n} − {p} = {r}: ostatak je {r}.',
      subA: '{q} · {d} = {p}. Od {nu} oduzimam {pu}: ostatak je {ru}. {r} je manje od {d}, pa {d} ne stane još jednom.',
      subZeroA: '0 · {d} = 0: ništa se ne oduzima, ostatak je {ru}.',
      subC: '{q} puta {d} je {p}. Od {p} do {n} je {r}.',
      subZeroC: '0 puta {d} je 0. Ostaje {r}.',
      subLongT: '{q} · {d} = {p}, potpisujem {p} ispod {n}; {n} − {p} = {r}.',
      subLastLongT: '{q} · {d} = {p}, potpisujem {p} ispod {n}; {n} − {p} = {r}: ostatak je {r}.',
      subLongA: '{q} · {d} = {p}. Potpisujem {pu} ispod {nu} i oduzimam pismeno: ostatak je {ru}. {r} je manje od {d}, pa {d} ne stane još jednom.',
      subZeroLongA: '0 · {d} = 0: potpisujem 0, ništa se ne oduzima, ostatak je {ru}.',
      subLongC: '{q} puta {d} je {p}. Pišem {p} ispod {n}. {n} manje {p} je {r}.',
      subZeroLongC: '0 puta {d} je 0. Pišem 0. Ostaje {r}.',
      shortWhyA: 'Kraći način umnožak ne piše: oduzimanje {n} − {p} radi se u glavi, pa se piše samo ostatak.',
      longWhyA: 'Dulji način piše umnožak da se oduzimanje vidi; kraći ga radi u glavi i piše samo ostatak.',

      // captions: bring down (down)
      downT: 'Spuštam {x}: {m}.',
      downA: '{ru} = {rdu}; s {xu} to je {mu}.',
      downZeroA: 'Ništa nije ostalo; spuštam {xu}: {mu}.',
      downC: 'Spuštam {x}.',

      // captions: the end
      cResultT: '{expr} = {q}, ostatak {r}.',
      cResultT0: '{expr} = {q}.',
      cCheck: 'Provjera: {q} · {d} + {r} = {a}.',
      cDecimal: 'Dekadski: {expr} = {q}, ostatak {r}.',
      cBinary: 'U bazi 2 znamenka količnika je 0 ili 1: pitam samo stane li djelitelj. Usporedi, oduzmi, spusti.',
      cDoneC: 'Gotovo: {q}.',
      cDoneRC: 'Gotovo: {q}, ostatak {r}.',

      // captions: the typical mistake (teacher)
      cMZero: 'Ovdje se 0 lako zaboravi.',
      cMDropped: 'S pogreškom bi ostatak {r} ostao ovdje, a dijelilo bi se samo {x}.',
      cMEnd: 'Pogreška daje {wrong} umjesto {res}.',

      cRefused: '{why}',

      explain: '<p>Dijelimo od najvećeg mjesta. 846 : 3: 8 stotica : 3 = 2 stotice (2 · 3 = 6 stane u 8, 3 · 3 = 9 je ' +
        'previše). Pišem 2, a od 8 stotica ostaju 2.</p>' +
        '<p><b>Spuštam:</b> 2 stotice su 20 desetica; s 4 desetice to je 24 desetice. 24 : 3 = 8 desetica. Zato ' +
        'ostatak i spuštena znamenka stoje jedno uz drugo: to je jedan broj.</p>' +
        '<p><b>Nula u količniku:</b> 618 : 3. Nakon 6 : 3 = 2 spuštam 1: 1 desetica : 3 = 0 desetica. Količnik ima znamenku ' +
        'za svako mjesto, pa pišem 0. Bez nje bi 2 stotice postale 2 desetice: 26 umjesto 206.</p>' +
        '<p><b>Ostatak</b> je uvijek manji od djelitelja; da nije, djelitelj bi stao još jednom. Provjera: količnik · ' +
        'djelitelj + ostatak = djeljenik.</p>' +
        '<p><b>Dva zapisa.</b> Pisano dijeljenje uvodi se na dulji način, s potpisivanjem djelomičnoga umnoška: ispod ' +
        'broja koji dijelim pišem umnožak s minusom, povučem crtu i oduzmem. Kraći način umnožak ne piše: oduzimanje se ' +
        'radi u glavi i piše se samo ostatak. Koraci su isti; kraći način preporučuje se kad ga učenik svlada.</p>' +
        '<p><b>Dvoznamenkasti djelitelj:</b> djelomični količnik procjenjujem. 98 : 12: zaokružim na desetice, 100 : 10 = 10; ' +
        'to nije znamenka, pa probam 9: 9 · 12 = 108 je previše; 8 · 12 = 96 stane. Ako ostatak nije manji od djelitelja, ' +
        'procjena je premala i povećam je za 1.</p>' +
        '<p>U nekim zemljama se piše drukčije (dijeljenje „u zagradi”); postupak je isti. U bazi 2 znamenka količnika je 0 ' +
        'ili 1: djelitelj stane ili ne stane.</p>'
    },
    en: {
      stage: 'Long division',

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
      numsTitle: 'Dividend and divisor',
      numsLabel: 'Dividend : divisor in base {b}',
      numsHint: 'A dividend of up to 6 digits, a divisor of up to 3; : or / between them.',
      errDigit: '“{at}” is not a digit of base {b}.',
      errLong: 'The dividend has at most 6 digits, the divisor 3: {at}.',
      errCount: 'Type a dividend and a divisor, e.g. 846 : 3.',
      errEmpty: 'A number is missing next to the :.',
      errZero: 'You cannot divide by zero.',

      // params
      base: 'Base',
      baseHint: 'The same quantity, other digits.',
      baseQuick: 'Common bases',
      baseName2: 'binary',
      baseName8: 'octal',
      baseName10: 'decimal',
      baseName16: 'hexadecimal',
      baseTooLong: 'In base {b} the number {num} would have too many digits (the dividend at most 6, the divisor 3).',
      why: 'How many times?',
      mistake: 'Typical mistake',
      mNone: 'none',
      mZero: 'a 0 forgotten',
      mDropped: 'remainder dropped',
      layout: 'Layout',
      layShort: 'shorter way',
      layLong: 'longer way',

      // presets
      pThree: 'Three-digit dividend',
      pThreeHint: '846 : 3',
      pFirst: 'First number of two digits',
      pFirstHint: '1736 : 7: 1 is too small, take 17',
      pZero: 'A zero in the quotient',
      pZeroHint: '618 : 3, with a typical mistake',
      pRem: 'With a remainder',
      pRemHint: '2023 : 4: a zero and remainder 3',
      pTwo: 'Two-digit divisor',
      pTwoHint: '9876 : 12',
      pBin: 'Base 2',
      pBinHint: '101110 : 101: it fits or it does not',
      pLong: 'Longer way',
      pLongHint: '846 : 3, the products written',
      pLongTwo: 'Longer way, estimate',
      pLongTwoHint: '5517 : 28: a two-digit divisor, an estimate',

      // legend
      legBand: 'what this step works on',
      legChanged: 'written in this step',

      // the paper
      paper: 'Long division, worked on paper',
      place0: 'O',
      place1: 'T',
      place2: 'H',
      place3: 'Th',
      place4: 'TTh',
      place5: 'HTh',
      placeName0: 'ones',
      placeName1: 'tens',
      placeName2: 'hundreds',
      placeName3: 'thousands',
      placeName4: 'ten thousands',
      placeName5: 'hundred thousands',
      placeName: 'the place worth {v}',
      cellRest: 'remainder {v}',
      cellDown: 'digit brought down {v}',
      cellQuot: 'quotient digit {v}',
      cellProd: 'partial product {v}',

      // place units, with counts (plural forms)
      u0: ['{n} one', '{n} ones'],
      u1: ['{n} ten', '{n} tens'],
      u2: ['{n} hundred', '{n} hundreds'],
      u3: ['{n} thousand', '{n} thousands'],
      u4: ['{n} ten thousand', '{n} ten thousands'],
      u5: ['{n} hundred thousand', '{n} hundred thousands'],
      uGen: ['{n} unit of the place ×{v}', '{n} units of the place ×{v}'],
      // which digit of the quotient (adult)
      qPlace0: 'a ones digit',
      qPlace1: 'a tens digit',
      qPlace2: 'a hundreds digit',
      qPlace3: 'a thousands digit',
      qPlace4: 'a ten-thousands digit',
      qPlace5: 'a hundred-thousands digit',
      qPlaceGen: 'a digit for the place ×{v}',

      // the "how many times" box
      boxTitle: 'How many times does {d} go into {n}?',
      boxNext: 'the next question',
      boxFits: 'fits',
      boxTooBig: 'too big',
      boxLabel: 'Multiples of the divisor; the largest that fits into the number gives the quotient digit.',
      boxRest: '{n} − {p} = {r}, less than {d}',
      boxKey: '✓ fits · ✗ too big',
      boxInBase: 'numbers in base {b}',
      invHead: 'What is divided so far',
      invNames: 'dividend = divisor · divided + still to divide',
      // the estimate (a two-digit divisor)
      estRound: 'Round to the tens: {n} ≈ {nr}, {d} ≈ {dr}.',
      estAsk: 'Estimate, then check by multiplying.',
      estLine: 'Estimate: {nr} : {dr} = {e}. Check by multiplying:',
      estLineBig: 'Estimate: {nr} : {dr} = {e}, which is not a digit: try 9.',
      boxSmall: 'too small',
      estLabel: 'Tries of the estimate: too big, go down by 1; too small, go up by 1; until it fits.',
      estKey: '✓ fits · ✗ too big · ↑ too small (the remainder is not less than the divisor)',

      // mistake card
      mtHead: 'Typical mistake',
      mtZero: 'a 0 forgotten in the quotient',
      mtDropped: 'the remainder is not brought down with the digit',
      mtInstead: 'instead of {res}',
      withRest: '{q}, remainder {r}',
      mtCheck: 'Check: {q} · {d} + {r} = {c}, not {a}.',
      whyZero: '{n} : {d} = 0, but the quotient still needs {pw} here. Every digit of the dividend from the first number on gives one quotient digit, even when it is 0. Without it the digits to its left stand one place lower than they are worth.',
      whyDropped: 'The remainder {r} has not gone: {ru} = {rdu}, so it goes with the {xu}: divide {right} : {d}, not just {wrong} : {d}.',
      sameZero: 'This quotient has no zero after its first digit, so this mistake does not show. Try example 3 (618 : 3).',
      sameDropped: 'Here every remainder before the last is 0, so this mistake does not show. Try example 1 (846 : 3).',
      wrongCell: 'wrong: {w}',

      // captions: start
      cStartT: 'We write {expr} = and divide from the left. Take as many leading digits of the dividend as needed for {d} to go in at least once.',
      cStartA: 'We divide from the highest place. Whatever is left in a place is worth {b} times as much in the place to its right, so it goes with the next digit.',
      cStartC: 'We divide {expr}.',

      // captions: how many times (ask)
      askFirstT: '{lead} is less than {d}, so take the next digit too: {n}.',
      askT: '{n} : {d} = {q}, write {q}.',
      askZeroT: '{n} : {d} = 0, because {n} is less than {d}: write 0 in the quotient.',
      askAllT: 'The whole dividend {n} is less than {d}: the quotient is 0.',
      askFirstA: 'In the first place {lead} is less than {d}, so it joins the next place: that is {nu}.',
      askA: '{nu} : {d} = {qu}: {q} · {d} = {p} fits into {n}, {q1} · {d} = {p1} is too big.',
      askZeroA: '{nu} : {d} = 0, because {n} is less than {d}. The quotient still needs {pw}: the 0 keeps the place.',
      askAllA: 'The whole dividend {n} is less than {d}: {d} does not go in even once, the quotient is 0.',
      askFirstC: '{lead} is too small. Take {n}.',
      askC: 'How many times does {d} go into {n}? {q} times. Write {q}.',
      askZeroC: '{d} does not go into {n}. Write 0.',
      estT: 'Estimate: {nr} : {dr} = {e}; try {tries}.',
      estA: 'Estimate with rounded numbers: {nr} : {dr} = {e}. The estimate is a try: check it by multiplying and correct it by 1 ({tries}).',

      // captions: multiply and subtract (sub)
      subT: '{q} · {d} = {p}, {n} − {p} = {r}.',
      subLastT: '{q} · {d} = {p}, {n} − {p} = {r}: the remainder is {r}.',
      subA: '{q} · {d} = {p}. Take {pu} from {nu}: the remainder is {ru}. {r} is less than {d}, so {d} does not go in once more.',
      subZeroA: '0 · {d} = 0: nothing is taken away, the remainder is {ru}.',
      subC: '{q} times {d} is {p}. From {p} to {n} is {r}.',
      subZeroC: '0 times {d} is 0. {r} is left.',
      subLongT: '{q} · {d} = {p}, write {p} under {n}; {n} − {p} = {r}.',
      subLastLongT: '{q} · {d} = {p}, write {p} under {n}; {n} − {p} = {r}: the remainder is {r}.',
      subLongA: '{q} · {d} = {p}. Write the {pu} under the {nu} and subtract on paper: the remainder is {ru}. {r} is less than {d}, so {d} does not go in once more.',
      subZeroLongA: '0 · {d} = 0: write 0, nothing is taken away, the remainder is {ru}.',
      subLongC: '{q} times {d} is {p}. Write {p} under {n}. {n} take away {p} is {r}.',
      subZeroLongC: '0 times {d} is 0. Write 0. {r} is left.',
      shortWhyA: 'The shorter way does not write the product: the subtraction {n} − {p} is done in the head, so only the remainder is written.',
      longWhyA: 'The longer way writes the product so the subtraction can be seen; the shorter way does it in the head and writes only the remainder.',

      // captions: bring down (down)
      downT: 'Bring down {x}: {m}.',
      downA: '{ru} = {rdu}; with the {xu} that is {mu}.',
      downZeroA: 'Nothing is left; bring down the {xu}: {mu}.',
      downC: 'Bring down {x}.',

      // captions: the end
      cResultT: '{expr} = {q}, remainder {r}.',
      cResultT0: '{expr} = {q}.',
      cCheck: 'Check: {q} · {d} + {r} = {a}.',
      cDecimal: 'In decimal: {expr} = {q}, remainder {r}.',
      cBinary: 'In base 2 a quotient digit is 0 or 1: the only question is whether the divisor fits. Compare, subtract, bring down.',
      cDoneC: 'Done: {q}.',
      cDoneRC: 'Done: {q}, remainder {r}.',

      // captions: the typical mistake (teacher)
      cMZero: 'This is the 0 that is easy to forget.',
      cMDropped: 'With the mistake the remainder {r} would stay here, and only {x} would be divided.',
      cMEnd: 'The mistake gives {wrong} instead of {res}.',

      cRefused: '{why}',

      explain: '<p>We divide from the highest place. 846 : 3: 8 hundreds : 3 = 2 hundreds (2 · 3 = 6 fits into 8, 3 · 3 = 9 ' +
        'is too big). Write 2; of the 8 hundreds, 2 are left.</p>' +
        '<p><b>Bring down:</b> 2 hundreds are 20 tens; with the 4 tens that is 24 tens. 24 : 3 = 8 tens. That is why ' +
        'the remainder and the digit brought down stand side by side: they are one number.</p>' +
        '<p><b>A zero in the quotient:</b> 618 : 3. After 6 : 3 = 2, bring down the 1: 1 ten : 3 = 0 tens. The quotient has a ' +
        'digit for every place, so write 0. Without it the 2 hundreds would become 2 tens: 26 instead of 206.</p>' +
        '<p><b>The remainder</b> is always less than the divisor; otherwise the divisor would go in once more. Check: ' +
        'quotient · divisor + remainder = dividend.</p>' +
        '<p><b>Two layouts.</b> Croatian schools introduce long division the longer way, with the partial product written: ' +
        'under the number being divided goes the product with a minus sign, a rule, and the subtraction. The shorter way ' +
        'leaves the product out: the subtraction is done in the head and only the remainder is written. The steps are ' +
        'the same; the shorter way is recommended once a pupil can do it.</p>' +
        '<p><b>A two-digit divisor:</b> estimate the partial quotient. 98 : 12: round to the tens, 100 : 10 = 10; that is ' +
        'not a digit, so try 9: 9 · 12 = 108 is too big; 8 · 12 = 96 fits. If the remainder is not less than the divisor, ' +
        'the estimate was too small: go up by 1.</p>' +
        '<p>Both layouts keep 846 : 3 = 282 on one line. English-speaking schools write the bracket; the steps are the ' +
        'same. In base 2 a quotient digit is 0 or 1: the divisor fits or it does not.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
