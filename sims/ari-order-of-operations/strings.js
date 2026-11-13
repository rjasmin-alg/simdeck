/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-order-of-operations, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Numbers, signs and expressions
   are data: the page fills them in with translate="no". The title and subtitle come from sim.json.
   Caption keys end in T (teacher), A (adult) or C (child): the three audiences of the ari- pages. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Izraz, njegovo stablo računa i pravila redoslijeda',

      // the audience switch (shared by the ari- pages)
      audLabel: 'Za koga',
      audGroup: 'Prikaz za',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju: bilo koji izraz, tipična pogreška, korak po korak.',
      audAdultHint: 'Uz svaki korak piše zašto vrijedi.',
      audChildHint: 'Velike znamenke, malo riječi.',

      // panel
      exprLabel: 'Izraz',
      exprHint: 'Brojevi do 9999, znakovi + − · : (ili * /) i zagrade.',
      errEmpty: 'Upiši izraz, npr. 6 + 4 · 3.',
      errChar: 'Znak {ch} na {at}. mjestu nije broj, znak računske operacije ni zagrada.',
      errLong: 'Broj na {at}. mjestu ima više od {d} znamenke.',
      errNumber: 'Na {at}. mjestu nedostaje broj.',
      errNumberEnd: 'Na kraju nedostaje broj.',
      errSign: 'Na {at}. mjestu nedostaje znak računske operacije.',
      errOpen: 'Zagrada otvorena na {at}. mjestu nije zatvorena.',
      errClose: 'Zagrada zatvorena na {at}. mjestu nije otvorena.',
      errLone: 'U zagradi na {at}. mjestu je samo broj; zagrada okružuje račun.',
      errSingle: 'Treba barem jedna računska operacija.',
      errMany: 'Najviše {n} brojeva.',
      errNegative: '{a} − {b}: od manjega broja ne može se oduzeti veći.',
      errNotWhole: '{a} : {b} ne ide bez ostatka.',
      errZero: '{a} : 0: nulom se ne dijeli.',
      errBig: '{a} {op} {b} je više od {max}.',
      mistake: 'Tipična pogreška: strogo slijeva nadesno',
      mistakeHint: 'Bez obzira na vrstu računske operacije.',

      pBrackets: 'Zagrada mijenja rezultat',
      pBracketsHint: '543 − (423 + 28) = 92, primjer iz kurikula',
      pNoBrackets: 'Bez zagrade',
      pNoBracketsHint: '543 − 423 + 28 = 148: slijeva nadesno',
      pTimesFirst: 'Množenje prije zbrajanja',
      pTimesFirstHint: '6 + 4 · 3 = 18, a ne 30',
      pSameRank: 'Dijeljenje pa množenje',
      pSameRankHint: '24 : 4 · 2 = 12: ravnopravne slijeva nadesno',
      pTwoBrackets: 'Dvije zagrade',
      pTwoBracketsHint: '(36 + 14) : (12 − 7) = 10: prvo lijeva zagrada',
      pEverything: 'Sve zajedno',
      pEverythingHint: '100 − (12 + 8) · 4 + 30 : 5 = 26',

      // legend
      legWait: 'čeka',
      legNow: 'sada na redu',
      legDone: 'izračunato',
      legUsed: 'iskorišteno',

      // the stage
      writtenLabel: 'Zapis računa',
      chipsTitle: 'Zagrade:',
      chipsMany: 'Za više od {n} broja zagrade upiši u polje.',
      chipSame: 'Isti redoslijed kao bez zagrada',
      treeTitle: 'Stablo računa',
      treeHint: 'što je niže, računa se kasnije',
      nodeWait: '{s}, čeka',
      nodeDone: '{s}, izračunato: {v}',
      rulesTitle: 'Redoslijed',
      rBr: 'Zagrade',
      rBrSub: 'prvo ono u zagradi; od više njih prvo lijeva',
      rMul: 'Množenje i dijeljenje',
      rAdd: 'Zbrajanje i oduzimanje',
      rLtr: 'Ravnopravne: slijeva nadesno',

      // the typical mistake
      mtHead: 'Pogreška: strogo slijeva nadesno',
      mtAsk: 'Gdje se ovaj račun odvaja od dogovora?',
      mtAskSame: 'Ovdje strogo slijeva nadesno ide istim redom.',
      mtSame: 'Isti rezultat: ovaj izraz ne otkriva pogrešku. Probaj 6 + 4 · 3.',
      mtWrong: '{w} umjesto {r}.',
      mtStuck: 'Račun zapne: {why}',
      mtWhy: 'Množenje i dijeljenje imaju prednost: {e} je jedan broj i računa se prije zbrajanja i oduzimanja oko njega.',
      mtWhyGen: 'Množenje i dijeljenje imaju prednost pred zbrajanjem i oduzimanjem i kad stoje desno.',

      // captions
      ops: ['{n} računsku operaciju', '{n} računske operacije', '{n} računskih operacija'],
      cStartT: 'Koja računska operacija prva? {e} ima {ops}.',
      cStartA: '{e} ima {ops}. Dogovor: prvo zagrade, zatim množenje i dijeljenje, na kraju zbrajanje i oduzimanje; ravnopravne slijeva nadesno.',
      cStartC: 'Što prvo?',
      cSameOrder: 'Ove zagrade ništa ne mijenjaju: i bez njih redoslijed je isti.',
      cInBr: 'Prvo zagrada: {e}.',
      cLeftBr: 'Od zagrada koje čekaju prva je lijeva.',
      whyBrA: 'Zagrada kaže da je ono u njoj jedan broj: treba ga znati prije nego što se s njim računa dalje.',
      cSkip: 'Prvo {e}: množenje i dijeljenje dolaze prije zbrajanja i oduzimanja, iako {s} stoji lijevo.',
      cMulFirst: 'Prvo {e}: množenje i dijeljenje dolaze prije zbrajanja i oduzimanja.',
      cMulIn: 'I u zagradi množenje i dijeljenje dolaze prije zbrajanja i oduzimanja.',
      whyMulA: '{a} · {b} je jedan broj, kraći zapis za {sum}; zato se izračuna prije nego što se s njim zbraja ili oduzima.',
      whyMulShortA: '{a} · {b} je jedan broj; zato se izračuna prije nego što se s njim zbraja ili oduzima.',
      whyDivA: '{a} : {b} je jedan broj: koliko je puta broj {b} sadržan u broju {a}; zato se izračuna prije nego što se s njim zbraja ili oduzima.',
      cLtr: 'Prvo {e}: ravnopravne računske operacije idu slijeva nadesno.',
      cLtrIn: 'Ravnopravne idu slijeva nadesno.',
      cOther: 'Kad bi se prvo izračunalo {x}, to bi bio drugi zadatak: {alt} = {v}.',
      cOtherNo: 'Kad bi se prvo izračunalo {x}, to bi bio drugi zadatak, {alt}, a on ovdje ne ide: {why}',
      cOtherSame: 'Kad bi se prvo izračunalo {x}, rezultat bi ovdje bio isti, ali dogovor je slijeva nadesno.',
      whyLtrA: 'Zapis se čita redom kojim je napisan: svaka se računska operacija primjenjuje na ono što je izračunato lijevo od nje.',
      cOnly: 'Ostaje {e}.',
      cPickBrC: 'Prvo zagrada: {e}',
      cPickMulC: 'Prvo množenje ili dijeljenje: {e}',
      cPickC: 'Sada {e}',
      cDoT: '{e} = {v}.',
      cDoA: '{e} = {v}, pa izraz sada glasi {line}.',
      cDoC: '{e} = {v}',
      cDoneC: '{e} = {v}. Rezultat je {v}!',
      cDoLast: '{e} = {v}: vrijednost izraza je {v}.',
      cBrGone: 'Zagrada je izračunata i više ne treba.',
      cNoBr: 'Bez zagrada, {bare} = {v}: zagrade mijenjaju rezultat.',
      cNoBrSame: 'Bez zagrada, {bare}, redoslijed je isti: ove zagrade ništa ne mijenjaju.',
      cNoBrNo: 'Bez zagrada, {bare}, račun ne bi išao: {why}',
      cMistake: 'Strogo slijeva nadesno dalo bi {w}: to je pogrešno.',
      cMistakeStuck: 'Strogo slijeva nadesno zapelo bi: {why}',
      cMistakeSame: 'Strogo slijeva nadesno ovdje daje isto, pa ovaj izraz ne otkriva tu pogrešku.',

      explain: '<p>U izrazu s više računskih operacija vrijedi <b>dogovor o redoslijedu</b>: prvo se računa ono u ' +
        '<b>zagradi</b>, zatim <b>množenje i dijeljenje</b>, a na kraju <b>zbrajanje i oduzimanje</b>. Množenje i dijeljenje ' +
        'su ravnopravni, kao i zbrajanje i oduzimanje; ravnopravne se računaju slijeva nadesno.</p>' +
        '<p>Dogovor nije slučajan. Umnožak je jedan broj: 6 + 4 · 3 znači 6 i još četiri trojke, 6 + 3 + 3 + 3 + 3 = 18. ' +
        'Zagrada kaže da je ono u njoj jedan broj. A ravnopravne idu redom kojim su napisane: 543 − 423 + 28 znači oduzmi ' +
        '423, pa dodaj 28, i daje 148. Tko prvo zbroji 423 + 28, oduzeo bi i 28: to je drugi zadatak, 543 − (423 + 28) = 92.</p>' +
        '<p><b>Stablo računa</b> pokazuje redoslijed: svaka računska operacija stoji ispod svojega znaka i spojena je s ' +
        'dvama brojevima s kojima računa. Što je niže, računa se kasnije; na dnu je vrijednost izraza. Pomakni zagrade i ' +
        'stablo se promijeni, a s njim i rezultat.</p>' +
        '<p>Tipična pogreška je računati strogo slijeva nadesno bez obzira na vrstu računske operacije: 6 + 4 · 3 tada ' +
        'daje 30.</p>'
    },
    en: {
      stage: 'An expression, its tree and the rules of the order',

      audLabel: 'For',
      audGroup: 'View for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector: any expression, the typical mistake, step by step.',
      audAdultHint: 'Every step says why it works.',
      audChildHint: 'Big digits, few words.',

      exprLabel: 'Expression',
      exprHint: 'Numbers up to 9999, signs + − · : (or * /) and brackets.',
      errEmpty: 'Type an expression, e.g. 6 + 4 · 3.',
      errChar: 'The character {ch} at place {at} is not a number, an operation sign or a bracket.',
      errLong: 'The number at place {at} has more than {d} digits.',
      errNumber: 'A number is missing at place {at}.',
      errNumberEnd: 'A number is missing at the end.',
      errSign: 'An operation sign is missing at place {at}.',
      errOpen: 'The bracket opened at place {at} is not closed.',
      errClose: 'The bracket closed at place {at} was never opened.',
      errLone: 'The bracket at place {at} holds only a number; a bracket goes around a calculation.',
      errSingle: 'At least one operation is needed.',
      errMany: 'At most {n} numbers.',
      errNegative: '{a} − {b}: a bigger number cannot be taken from a smaller one.',
      errNotWhole: '{a} : {b} does not divide without a remainder.',
      errZero: '{a} : 0: there is no dividing by zero.',
      errBig: '{a} {op} {b} is more than {max}.',
      mistake: 'Typical mistake: strictly left to right',
      mistakeHint: 'Whatever the kind of operation.',

      pBrackets: 'A bracket changes the result',
      pBracketsHint: '543 − (423 + 28) = 92, the curriculum example',
      pNoBrackets: 'Without the bracket',
      pNoBracketsHint: '543 − 423 + 28 = 148: left to right',
      pTimesFirst: 'Multiplication before addition',
      pTimesFirstHint: '6 + 4 · 3 = 18, not 30',
      pSameRank: 'Division, then multiplication',
      pSameRankHint: '24 : 4 · 2 = 12: equal rank, left to right',
      pTwoBrackets: 'Two brackets',
      pTwoBracketsHint: '(36 + 14) : (12 − 7) = 10: the left bracket first',
      pEverything: 'All together',
      pEverythingHint: '100 − (12 + 8) · 4 + 30 : 5 = 26',

      legWait: 'waiting',
      legNow: 'next to do',
      legDone: 'worked out',
      legUsed: 'used up',

      writtenLabel: 'The written working',
      chipsTitle: 'Brackets:',
      chipsMany: 'With more than {n} numbers, type the brackets in the field.',
      chipSame: 'The same order as without brackets',
      treeTitle: 'Expression tree',
      treeHint: 'the lower, the later',
      nodeWait: '{s}, waiting',
      nodeDone: '{s}, worked out: {v}',
      rulesTitle: 'Order',
      rBr: 'Brackets',
      rBrSub: 'what is inside first; of several, the left one',
      rMul: 'Multiplication and division',
      rAdd: 'Addition and subtraction',
      rLtr: 'Equal rank: left to right',

      mtHead: 'The mistake: strictly left to right',
      mtAsk: 'Where does this working leave the agreed order?',
      mtAskSame: 'Here strictly left to right goes in the same order.',
      mtSame: 'The same result: this expression does not show the mistake. Try 6 + 4 · 3.',
      mtWrong: '{w} instead of {r}.',
      mtStuck: 'The working gets stuck: {why}',
      mtWhy: 'Multiplication and division come first: {e} is one number and is worked out before the addition and subtraction around it.',
      mtWhyGen: 'Multiplication and division come before addition and subtraction, even when they stand to the right.',

      ops: ['{n} operation', '{n} operations'],
      cStartT: 'Which operation first? {e} has {ops}.',
      cStartA: '{e} has {ops}. The agreement: brackets first, then multiplication and division, then addition and subtraction; equal rank left to right.',
      cStartC: 'What first?',
      cSameOrder: 'These brackets change nothing: without them the order is the same.',
      cInBr: 'The bracket first: {e}.',
      cLeftBr: 'Of the brackets waiting, the left one goes first.',
      whyBrA: 'A bracket says that what is inside is one number: it must be known before the working goes on with it.',
      cSkip: '{e} first: multiplication and division come before addition and subtraction, even though {s} stands to the left.',
      cMulFirst: '{e} first: multiplication and division come before addition and subtraction.',
      cMulIn: 'Inside the bracket too, multiplication and division come before addition and subtraction.',
      whyMulA: '{a} · {b} is one number, short for {sum}; so it is worked out before anything is added to it or taken from it.',
      whyMulShortA: '{a} · {b} is one number; so it is worked out before anything is added to it or taken from it.',
      whyDivA: '{a} : {b} is one number, how many times {b} goes into {a}; so it is worked out before anything is added to it or taken from it.',
      cLtr: '{e} first: operations of equal rank go from left to right.',
      cLtrIn: 'Equal rank goes left to right.',
      cOther: 'Working out {x} first would be another task: {alt} = {v}.',
      cOtherNo: 'Working out {x} first would be another task, {alt}, and that one does not work here: {why}',
      cOtherSame: 'Working out {x} first would give the same result here, but the agreement is left to right.',
      whyLtrA: 'An expression is read in the order it is written: each operation acts on what has been worked out to its left.',
      cOnly: 'What is left: {e}.',
      cPickBrC: 'The bracket first: {e}',
      cPickMulC: 'Multiplication or division first: {e}',
      cPickC: 'Now {e}',
      cDoT: '{e} = {v}.',
      cDoA: '{e} = {v}, so the expression now reads {line}.',
      cDoC: '{e} = {v}',
      cDoneC: '{e} = {v}. The result is {v}!',
      cDoLast: '{e} = {v}: the value of the expression is {v}.',
      cBrGone: 'The bracket is worked out and is no longer needed.',
      cNoBr: 'Without brackets, {bare} = {v}: the brackets change the result.',
      cNoBrSame: 'Without brackets, {bare}, the order is the same: these brackets change nothing.',
      cNoBrNo: 'Without brackets, {bare}, the working would not go: {why}',
      cMistake: 'Strictly left to right would give {w}: that is wrong.',
      cMistakeStuck: 'Strictly left to right would get stuck: {why}',
      cMistakeSame: 'Strictly left to right gives the same here, so this expression does not show that mistake.',

      explain: '<p>In an expression with several operations there is an <b>agreed order</b>: first what is in ' +
        '<b>brackets</b>, then <b>multiplication and division</b>, and last <b>addition and subtraction</b>. Multiplication ' +
        'and division have equal rank, and so do addition and subtraction; operations of equal rank go from left to right.</p>' +
        '<p>The agreement is not arbitrary. A product is one number: 6 + 4 · 3 means 6 and four threes more, ' +
        '6 + 3 + 3 + 3 + 3 = 18. A bracket says that what is inside is one number. And equal rank goes in the order it is ' +
        'written: 543 − 423 + 28 means take 423 away, then add 28, and gives 148. Adding 423 + 28 first would take the 28 ' +
        'away as well: that is another task, 543 − (423 + 28) = 92.</p>' +
        '<p>The <b>expression tree</b> shows the order: each operation stands under its sign and is joined to the two ' +
        'numbers it works on. The lower it is, the later it is done; at the bottom is the value of the expression. Move the ' +
        'brackets and the tree changes, and with it the result.</p>' +
        '<p>The typical mistake is working strictly from left to right whatever the kind of operation: 6 + 4 · 3 then ' +
        'gives 30.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
