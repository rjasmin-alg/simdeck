/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-column-subtraction, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Captions come in three registers, one per audience: T (teacher), A (adult, why it works), C (child, the spoken
   step). In each step the borrowing sentence (b…) comes first, then the equal additions sentence (e…).
   Numbers and digits are filled in by the page as nodes (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pisano oduzimanje',

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
      numsLabel: 'Umanjenik − umanjitelj u bazi {b}',
      numsHint: 'Dva broja do 9 znamenki; umanjitelj nije veći.',
      errDigit: '„{at}” nije znamenka baze {b}.',
      errLong: 'Najviše 9 znamenki: {at}.',
      errCount: 'Upiši dva broja: umanjenik − umanjitelj.',
      errEmpty: 'Uz znak − nedostaje broj.',
      errOrder: 'Umanjitelj {at} veći je od umanjenika; negativni brojevi nisu tema ove stranice.',

      // params
      base: 'Baza',
      baseHint: 'Ista količina, druge znamenke.',
      baseQuick: 'Česte baze',
      baseName2: 'binarno',
      baseName8: 'oktalno',
      baseName10: 'dekadski',
      baseName16: 'heksadekadski',
      baseTooLong: 'U bazi {b} umanjenik {num} imao bi više od 9 znamenki.',
      mistake: 'Tipična pogreška',
      mNone: 'nema',
      mSmaller: 'manja od veće',
      mForget: 'posuđeno, a ne vraćeno',
      mZero: 'posudba preko nule',

      // presets
      pZero: 'Nula u umanjeniku',
      pZeroHint: '503 − 178',
      pLend: 'Daje, pa uzima',
      pLendHint: '742 − 347: desetice daju, pa uzimaju',
      pMany: 'Tri nule',
      pManyHint: '1000 − 1',
      pSmaller: 'Manja od veće',
      pSmallerHint: '624 − 358, s tipičnom pogreškom',
      pBin: 'Baza 2',
      pBinHint: '10010 − 111 u bazi 2',
      pHex: 'Baza 16',
      pHexHint: '5A0 − 1F9 u bazi 16',

      // legend
      legCol: 'ovaj stupac',
      legX: 'prepisano',
      legTag: 'dodano 1 gore, +1 dolje',
      legChanged: 'napisano u ovom koraku',

      // the two papers
      methodB: 'Posuđivanje',
      methodE: 'Jednaki dodaci',
      methodBSub: 'umanjenik drukčije rastavljen',
      methodESub: 'oba broja veća za isto',
      paperB: 'Posuđivanje, račun na papiru',
      paperE: 'Jednaki dodaci, račun na papiru',
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
      cellNew: 'prepisano: {v}',
      cellTop: '{v}, gore dodana baza',
      cellBot: '{v}, dolje dodano 1',

      // place units, with counts (plural forms) and as column names
      u0: ['{n} jedinica', '{n} jedinice', '{n} jedinica'],
      u1: ['{n} desetica', '{n} desetice', '{n} desetica'],
      u2: ['{n} stotica', '{n} stotice', '{n} stotica'],
      u3: ['{n} tisućica', '{n} tisućice', '{n} tisućica'],
      u4: ['{n} desetica tisuća', '{n} desetice tisuća', '{n} desetica tisuća'],
      u5: ['{n} stotica tisuća', '{n} stotice tisuća', '{n} stotica tisuća'],
      u6: ['{n} milijun', '{n} milijuna', '{n} milijuna'],
      u7: ['{n} desetica milijuna', '{n} desetice milijuna', '{n} desetica milijuna'],
      u8: ['{n} stotica milijuna', '{n} stotice milijuna', '{n} stotica milijuna'],
      uGen: ['{n} jedinica mjesta ×{v}', '{n} jedinice mjesta ×{v}', '{n} jedinica mjesta ×{v}'],
      // one unit after "uzimam", "dodajem" (accusative)
      one1: 'jednu deseticu',
      one2: 'jednu stoticu',
      one3: 'jednu tisućicu',
      one4: 'jednu deseticu tisuća',
      one5: 'jednu stoticu tisuća',
      one6: 'jedan milijun',
      one7: 'jednu deseticu milijuna',
      one8: 'jednu stoticu milijuna',
      oneGen: 'jednu jedinicu mjesta ×{v}',
      col0: 'jedinica',
      col1: 'desetica',
      col2: 'stotica',
      col3: 'tisućica',
      col4: 'desetica tisuća',
      col5: 'stotica tisuća',
      col6: 'milijuna',
      col7: 'desetica milijuna',
      col8: 'stotica milijuna',
      colGen: '×{v}',
      head0: 'Jedinice',
      head1: 'Desetice',
      head2: 'Stotice',
      head3: 'Tisućice',
      head4: 'Desetice tisuća',
      head5: 'Stotice tisuća',
      head6: 'Milijuni',
      head7: 'Desetice milijuna',
      head8: 'Stotice milijuna',
      headGen: 'Stupac ×{v}',

      // why box
      whyTitle: 'Zašto obje daju isto',
      whyB: 'Posuđivanje: umanjenik je isti broj, samo drukčije rastavljen: {sum} = {a}.',
      whyE: 'Jednaki dodaci: oba broja veća su za {add}: {expr}. Razlika se ne mijenja.',
      whyENone: 'Jednaki dodaci: još ništa nije dodano.',
      whyDecimal: 'Količine su napisane dekadski.',
      whyBoth: 'Obje: {res}.',

      // mistake card
      mtHead: 'Tipična pogreška',
      mtSmaller: 'manja znamenka od veće',
      mtForget: 'baza dodana, lijevo ništa',
      mtZero: 'nula postala 9, posudba stala',
      mtInstead: 'umjesto {res}',
      whySmaller: 'Uvijek oduzimamo donji broj od gornjeg. Kad je gornja znamenka manja, okrenut račun ({rev}) nije isto što i posuditi ({right}).',
      whyForget: 'Gornja znamenka dobila je {b}, a lijevo ništa nije oduzeto: ni 1 gore, ni +1 dolje. Rezultat je prevelik točno za dodano: {over}.',
      whyZero: ['Posudba mora stići do prve znamenke koja nije 0 i nju smanjiti za 1. Ovdje je nula postala {top}, a {lender} u stupcu {col} nije smanjena: rezultat je prevelik za {over}. Jednaki dodaci ne posuđuju, pa ovaj korak nemaju.',
        'Posudba mora stići do prve znamenke koja nije 0 i nju smanjiti za 1. Ovdje su {n} nule postale {top}, a {lender} u stupcu {col} nije smanjena: rezultat je prevelik za {over}. Jednaki dodaci ne posuđuju, pa ovaj korak nemaju.',
        'Posudba mora stići do prve znamenke koja nije 0 i nju smanjiti za 1. Ovdje je {n} nula postalo {top}, a {lender} u stupcu {col} nije smanjena: rezultat je prevelik za {over}. Jednaki dodaci ne posuđuju, pa ovaj korak nemaju.'],
      sameSmaller: 'Ovdje nijedna gornja znamenka nije manja, pa se ova pogreška ne vidi. Probaj primjer 1 (503 − 178 u bazi 10).',
      sameForget: 'Ovdje nijedna gornja znamenka nije manja, pa se ova pogreška ne vidi. Probaj primjer 1 (503 − 178 u bazi 10).',
      sameZero: 'Ovdje se ne posuđuje preko nule, pa se ova pogreška ne vidi. Probaj primjer 1 (503 − 178 u bazi 10).',
      wrongCell: 'pogrešno: {w}',

      // captions: teacher
      cStartT: 'Umanjenik gore, umanjitelj ispod, potpisani zdesna. Lijevo posuđivanje, desno jednaki dodaci; oduzimamo stupac po stupac, od jedinica.',
      bOkT: 'Posuđivanje: {t} ≥ {d}, oduzimam odmah.',
      bNeedT: 'Posuđivanje: {t} < {d}, posuđujem iz stupca {from}: {lt} postaje {ln}, {t} postaje {nt}.',
      bZeroT: 'Posuđivanje: {t} < {d}, a lijevo je 0: posuđujem iz stupca {from} ({lt} postaje {ln}); svaka 0 između postaje {base}, pa daje 1 i ostaje {bm}; {t} postaje {nt}.',
      eOkT: 'Jednaki dodaci: {t} ≥ {d}, oduzimam odmah.',
      eNeedT: 'Jednaki dodaci: {t} < {d}, pa gore dodajem {base} ({t} postaje {nt}), a dolje 1 u stupcu {next}.',
      writeT: '{head}: posuđivanje {bx}, jednaki dodaci {ex}. Obje pišu {r}.',
      writeLeadT: '{head}: posuđivanje {bx}, jednaki dodaci {ex}. Nulu ispred broja ne pišemo.',
      cResultT: 'Razlika: {expr} = {res}.',
      cDecimal: 'Dekadski: {expr} = {res}.',

      // captions: adult
      cStartA: 'Isti zadatak, dva načina. Svako mjesto vrijedi {b} puta više od mjesta desno. Kad je gornja znamenka manja, posuđivanje drukčije rastavi umanjenik, a jednaki dodaci povećaju oba broja za isto.',
      bOkA: 'Posuđivanje: {t} ≥ {d}, ima dovoljno.',
      bNeedA: 'Posuđivanje: {t} < {d}. Uzimam {oneU} iz stupca {from}; ovdje to je {baseU}: {tU} → {ntU}. Umanjenik je isti broj, samo drukčije rastavljen.',
      bZeroA: 'Posuđivanje: {t} < {d}, a stupac lijevo ima 0, nema što dati. Posudba ide do stupca {from}; svaki stupac usput dobije {base} i dalje daje 1, pa 0 postaje {bm}. Ovdje {tU} → {ntU}.',
      eOkA: 'Jednaki dodaci: {t} ≥ {d}, ima dovoljno.',
      eNeedA: 'Jednaki dodaci: {t} < {d}. Gore dodajem {baseU} ({t} postaje {nt}), a dolje {oneU} (+1 u stupcu {next}). To je ista količina, pa razlika ostaje ista.',
      writeA: '{head}: posuđivanje {bx}, jednaki dodaci {ex}. Ista znamenka {r}: obje metode računaju istu razliku.',
      writeLeadA: '{head}: posuđivanje {bx}, jednaki dodaci {ex}. Nula ispred broja ne mijenja vrijednost, pa je ne pišemo.',

      // captions: child
      cStartC: 'Oduzimamo zdesna. Prvo jedinice.',
      bOkC: 'Lijevo: {t} nije manje od {d}.',
      bNeedC: 'Lijevo: {t} je manje od {d}. Posudim 1: {nt}.',
      bZeroC: 'Lijevo: {t} je manje od {d}. Posudim preko nule: {nt}.',
      eOkC: 'Desno: {t} nije manje od {d}.',
      eNeedC: 'Desno: {t} je manje od {d}. Gore {nt}.',
      writeBC: 'Lijevo: {bx}.',
      writeEC: 'Desno: {d} i koliko je {nt}? {r}. Pišem {r}.',
      writeECarryC: 'Desno: {d} i koliko je {nt}? {r}. Pišem {r}, pamtim 1.',
      writePlusC: '1 i {d0} je {d}.',
      writeELeadC: 'Desno: {d} i koliko je {nt}? {r}.',
      writeLeadC: 'Nulu sprijeda ne pišem.',
      cDoneC: 'Gotovo: {res}.',

      // captions: the typical mistake (teacher)
      cMNote: 'S ovom pogreškom ovdje bi pisalo {w}.',
      cMEnd: 'Pogreška daje {wrong} umjesto {res}.',

      cRefused: 'Baza {b} nije moguća: {why}',

      explain: '<p>Oduzimamo stupac po stupac, od jedinica. Kad je gornja znamenka manja od donje, postoje dva načina.</p>' +
        '<p><b>Posuđivanje:</b> iz stupca lijevo uzmemo 1. Jedna desetica vrijedi deset jedinica, pa 3 postaje 13. ' +
        'Umanjenik se ne mijenja, samo je drukčije rastavljen: 503 = 4 stotice + 9 desetica + 13 jedinica. Ako je lijevo ' +
        '0, posudba ide dalje do prve znamenke koja nije 0, a svaka nula usput postaje 9.</p>' +
        '<p><b>Jednaki dodaci:</b> gornjoj znamenki dodamo deset (3 postaje 13), a sljedećoj donjoj znamenki 1 ' +
        '(„pamtim 1”). Deset jedinica gore i jedna desetica dolje jednako vrijede, pa su oba broja veća za isto, a ' +
        'razlika ista: 503 − 178 = 613 − 288. Nula u umanjeniku tu nije posebna.</p>' +
        '<p>Obje metode u svakom stupcu pišu istu znamenku; razlikuje se samo ono što se zapisuje usput.</p>' +
        '<p>Baza je samo način zapisa broja. U bazi 2, 8 ili 16 postupak je isti: posuđena jedinica vrijedi 2, 8 ili ' +
        '16 jedinica mjesta desno.</p>'
    },
    en: {
      stage: 'Column subtraction',

      audLabel: 'View',
      audGroup: 'Who the view is for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For projecting in class: any numbers, step forward and back, a typical mistake.',
      audAdultHint: 'For a parent or a refresher: every step says why it works.',
      audChildHint: 'For grades 2 to 4: big digits, the school phrasing, base 10.',

      numsTitle: 'Numbers',
      numsLabel: 'Minuend − subtrahend in base {b}',
      numsHint: 'Two numbers, up to 9 digits; the second not larger.',
      errDigit: '“{at}” is not a digit in base {b}.',
      errLong: 'At most 9 digits: {at}.',
      errCount: 'Type two numbers: minuend − subtrahend.',
      errEmpty: 'A number is missing next to a − sign.',
      errOrder: 'The subtrahend {at} is larger than the minuend; negative numbers are not this page’s topic.',

      base: 'Base',
      baseHint: 'The same quantity, other digits.',
      baseQuick: 'Common bases',
      baseName2: 'binary',
      baseName8: 'octal',
      baseName10: 'decimal',
      baseName16: 'hexadecimal',
      baseTooLong: 'In base {b} the minuend {num} would need more than 9 digits.',
      mistake: 'Typical mistake',
      mNone: 'none',
      mSmaller: 'smaller from larger',
      mForget: 'borrowed, not paid back',
      mZero: 'borrowing across a zero',

      pZero: 'A zero on top',
      pZeroHint: '503 − 178',
      pLend: 'Lends, then borrows',
      pLendHint: '742 − 347: the tens give, then take',
      pMany: 'Three zeros',
      pManyHint: '1000 − 1',
      pSmaller: 'Smaller from larger',
      pSmallerHint: '624 − 358, with the typical mistake',
      pBin: 'Base 2',
      pBinHint: '10010 − 111 in base 2',
      pHex: 'Base 16',
      pHexHint: '5A0 − 1F9 in base 16',

      legCol: 'this column',
      legX: 'rewritten',
      legTag: 'added 1 on top, +1 below',
      legChanged: 'written in this step',

      methodB: 'Borrowing',
      methodE: 'Equal additions',
      methodBSub: 'the minuend split differently',
      methodESub: 'both numbers grow by the same',
      paperB: 'Borrowing, the working on paper',
      paperE: 'Equal additions, the working on paper',
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
      cellNew: 'rewritten: {v}',
      cellTop: '{v}, the base added on top',
      cellBot: '{v}, 1 added below',

      u0: ['{n} one', '{n} ones'],
      u1: ['{n} ten', '{n} tens'],
      u2: ['{n} hundred', '{n} hundreds'],
      u3: ['{n} thousand', '{n} thousands'],
      u4: ['{n} ten thousand', '{n} ten thousands'],
      u5: ['{n} hundred thousand', '{n} hundred thousands'],
      u6: ['{n} million', '{n} millions'],
      u7: ['{n} ten million', '{n} ten millions'],
      u8: ['{n} hundred million', '{n} hundred millions'],
      uGen: ['{n} unit of the ×{v} place', '{n} units of the ×{v} place'],
      one1: '1 ten',
      one2: '1 hundred',
      one3: '1 thousand',
      one4: '1 ten thousand',
      one5: '1 hundred thousand',
      one6: '1 million',
      one7: '1 ten million',
      one8: '1 hundred million',
      oneGen: '1 unit of the ×{v} place',
      col0: 'ones',
      col1: 'tens',
      col2: 'hundreds',
      col3: 'thousands',
      col4: 'ten thousands',
      col5: 'hundred thousands',
      col6: 'millions',
      col7: 'ten millions',
      col8: 'hundred millions',
      colGen: '×{v}',
      head0: 'Ones',
      head1: 'Tens',
      head2: 'Hundreds',
      head3: 'Thousands',
      head4: 'Ten thousands',
      head5: 'Hundred thousands',
      head6: 'Millions',
      head7: 'Ten millions',
      head8: 'Hundred millions',
      headGen: 'Column ×{v}',

      whyTitle: 'Why both give the same',
      whyB: 'Borrowing: the minuend is the same number, only split differently: {sum} = {a}.',
      whyE: 'Equal additions: both numbers grew by {add}: {expr}. The difference does not change.',
      whyENone: 'Equal additions: nothing added yet.',
      whyDecimal: 'Quantities are written in decimal.',
      whyBoth: 'Both: {res}.',

      mtHead: 'Typical mistake',
      mtSmaller: 'the smaller digit from the larger',
      mtForget: 'the base added, nothing taken on the left',
      mtZero: 'the zero became 9, the borrow stopped',
      mtInstead: 'instead of {res}',
      whySmaller: 'The bottom number is always taken from the top one. When the top digit is smaller, turning the sum round ({rev}) is not the same as borrowing ({right}).',
      whyForget: 'The top digit got {b}, but nothing was taken on the left: no 1 above, no +1 below. The result is too big by exactly what was added: {over}.',
      whyZero: ['A borrow must reach the first digit that is not 0 and lower it by 1. Here the zero became {top}, but the {lender} in the {col} column was not lowered: the result is too big by {over}. Equal additions never borrows, so it has no such step.',
        'A borrow must reach the first digit that is not 0 and lower it by 1. Here {n} zeros became {top}, but the {lender} in the {col} column was not lowered: the result is too big by {over}. Equal additions never borrows, so it has no such step.'],
      sameSmaller: 'No top digit is smaller here, so this mistake does not show. Try example 1 (503 − 178 in base 10).',
      sameForget: 'No top digit is smaller here, so this mistake does not show. Try example 1 (503 − 178 in base 10).',
      sameZero: 'No borrow crosses a zero here, so this mistake does not show. Try example 1 (503 − 178 in base 10).',
      wrongCell: 'wrong: {w}',

      cStartT: 'The minuend on top, the subtrahend below, aligned on the right. Borrowing on the left, equal additions on the right; we subtract column by column, starting with the ones.',
      bOkT: 'Borrowing: {t} ≥ {d}, subtract straight away.',
      bNeedT: 'Borrowing: {t} < {d}, borrow from the {from} column: {lt} becomes {ln}, {t} becomes {nt}.',
      bZeroT: 'Borrowing: {t} < {d}, and there is a 0 to the left: borrow from the {from} column ({lt} becomes {ln}); each 0 in between becomes {base}, then gives 1 and keeps {bm}; {t} becomes {nt}.',
      eOkT: 'Equal additions: {t} ≥ {d}, subtract straight away.',
      eNeedT: 'Equal additions: {t} < {d}, so add {base} on top ({t} becomes {nt}) and 1 below in the {next} column.',
      writeT: '{head}: borrowing {bx}, equal additions {ex}. Both write {r}.',
      writeLeadT: '{head}: borrowing {bx}, equal additions {ex}. A zero in front of a number is not written.',
      cResultT: 'Difference: {expr} = {res}.',
      cDecimal: 'In decimal: {expr} = {res}.',

      cStartA: 'One subtraction, two methods. Each place is worth {b} times the place on its right. When a top digit is smaller, borrowing splits the minuend differently, and equal additions makes both numbers bigger by the same amount.',
      bOkA: 'Borrowing: {t} ≥ {d}, there is enough.',
      bNeedA: 'Borrowing: {t} < {d}. Take {oneU} from the {from} column; here it is {baseU}: {tU} → {ntU}. The minuend is the same number, only split differently.',
      bZeroA: 'Borrowing: {t} < {d}, and the column on the left holds 0, nothing to give. The borrow goes on to the {from} column; each column on the way gets {base} and passes 1 on, so a 0 becomes {bm}. Here {tU} → {ntU}.',
      eOkA: 'Equal additions: {t} ≥ {d}, there is enough.',
      eNeedA: 'Equal additions: {t} < {d}. Add {baseU} on top ({t} becomes {nt}) and {oneU} below (+1 in the {next} column). That is the same quantity, so the difference stays the same.',
      writeA: '{head}: borrowing {bx}, equal additions {ex}. The same digit {r}: both methods work out the same difference.',
      writeLeadA: '{head}: borrowing {bx}, equal additions {ex}. A zero in front of a number does not change its value, so it is not written.',

      cStartC: 'We subtract from the right. Ones first.',
      bOkC: 'Left: {t} is not less than {d}.',
      bNeedC: 'Left: {t} is less than {d}. Borrow 1: {nt}.',
      bZeroC: 'Left: {t} is less than {d}. Borrow across the zero: {nt}.',
      eOkC: 'Right: {t} is not less than {d}.',
      eNeedC: 'Right: {t} is less than {d}. On top {nt}.',
      writeBC: 'Left: {bx}.',
      writeEC: 'Right: {d} and how many make {nt}? {r}. Write {r}.',
      writeECarryC: 'Right: {d} and how many make {nt}? {r}. Write {r}, carry 1.',
      writePlusC: '1 and {d0} is {d}.',
      writeELeadC: 'Right: {d} and how many make {nt}? {r}.',
      writeLeadC: 'A zero in front is not written.',
      cDoneC: 'Done: {res}.',

      cMNote: 'With this mistake this would be {w}.',
      cMEnd: 'The mistake gives {wrong} instead of {res}.',

      cRefused: 'Base {b} is not possible: {why}',

      explain: '<p>We subtract column by column, starting with the ones. When a top digit is smaller than the one below, ' +
        'there are two ways.</p>' +
        '<p><b>Borrowing:</b> take 1 from the column on the left. One ten is worth ten ones, so 3 becomes 13. The ' +
        'minuend does not change, it is only split differently: 503 = 4 hundreds + 9 tens + 13 ones. If the column on ' +
        'the left holds 0, the borrow goes on to the first digit that is not 0, and each zero on the way becomes 9.</p>' +
        '<p><b>Equal additions:</b> add ten to the top digit (3 becomes 13) and 1 to the next digit below (“carry 1”). ' +
        'Ten ones on top and one ten below are worth the same, so both numbers grow by the same amount and the ' +
        'difference stays: 503 − 178 = 613 − 288. A zero on top is nothing special here.</p>' +
        '<p>Both methods write the same digit in every column; only what is written on the way differs.</p>' +
        '<p>A base is only a way of writing a number. In base 2, 8 or 16 the methods are the same: a borrowed one is ' +
        'worth 2, 8 or 16 units of the place on the right.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
