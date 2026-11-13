/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-constant-difference, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Numbers and number sentences
   are data: the page fills them in with translate="no". The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Brojevna crta s dvama brojevima i njihovom razlikom ili zbrojem',

      // the audience switch (shared by the ari- pages)
      audLabel: 'Za koga',
      audGroup: 'Prikaz za',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju: bilo koji brojevi, krivi korak i pitanje prije odgovora.',
      audAdultHint: 'Uz svaki korak piše zašto vrijedi.',
      audChildHint: 'Velike znamenke, malo riječi.',

      // panel
      taskLabel: 'Zadatak',
      taskTitle: 'Zadatak',
      taskHint: 'Upiši razliku ili zbroj do 1000, npr. 523 − 198 ili 398 + 245.',
      err_empty: 'Upiši zadatak, npr. 523 − 198.',
      err_op: 'Treba točno jedan znak: + ili −.',
      err_num: 'Treba dva broja (prirodna ili 0) i jedan znak.',
      err_big: 'Brojevi do 1000.',
      err_neg: 'Umanjitelj ne smije biti veći od umanjenika.',
      err_sum: 'Zbroj ne smije biti veći od 1000.',
      op: 'Računska operacija',
      op_sub: 'Oduzimanje',
      op_add: 'Zbrajanje',
      k: 'Pomak',
      round: 'Do okruglog broja',
      roundKey: 'Pomakni do okruglog broja',
      way: 'Korak (tipične pogreške)',
      way_right: 'točan',
      way_one: 'jedan broj',
      way_flip: 'krivi smjer',
      hide: 'Najprije pitaj',
      hideHint: 'Sakrij rezultat i najprije pitaj razred (V).',
      revealKey: 'Pokaži ili sakrij rezultat',

      // presets
      p_round: '523 − 198 = 525 − 200',
      p_take: '645 − 203 = 642 − 200',
      p_sum: '398 + 245 = 400 + 243',
      p_one: '523 − 198 = 523 − 200?',
      p_same: '398 + 245 = 400 + 247?',
      p_equal: 'Jednaki dodaci: 503 − 178',
      ph_round: 'Oba broja +2: umanjitelj postaje okrugao.',
      ph_take: 'Oba broja −3.',
      ph_sum: 'Jedan pribrojnik daje 2 drugomu.',
      ph_one: 'Je li korak točan? (V pokazuje)',
      ph_same: 'Je li korak točan? (V pokazuje)',
      ph_equal: 'Oba broja +110, kao u pisanom oduzimanju jednakim dodacima.',

      // legend
      legFirst: 'umanjenik, 1. pribrojnik',
      legSecond: 'umanjitelj, 2. pribrojnik',
      legBefore: 'prije pomaka',

      // stage
      tMinuend: 'umanjenik',
      tSubtrahend: 'umanjitelj',
      tDiff: 'razlika',
      tAddend1: '1. pribrojnik',
      tAddend2: '2. pribrojnik',
      tSum: 'zbroj',
      lineBefore: 'prije',
      lineAfter: 'poslije',
      dragHint: 'povuci',
      lens_b: 'Umanjitelj',
      lens_a: 'Umanjenik',
      lens_split: 'Kraj 1. pribrojnika',
      lens_end: 'Zbroj',
      stays: 'ostaje',
      want: 'treba {v}',
      ask: 'Je li isto?',
      reveal: 'Pokaži',
      vSame_sub: 'razlika je ista',
      vSame_add: 'zbroj je isti',
      vMore_sub: 'razlika je za {n} veća',
      vLess_sub: 'razlika je za {n} manja',
      vMore_add: 'zbroj je za {n} veći',
      vLess_add: 'zbroj je za {n} manji',
      vSameC: 'isto!',
      vNotC: 'nije isto!',
      paperEq: 'Zadatak prije i poslije pomaka',
      lineLabel: 'Brojevna crta: {line}',
      lensLabel: 'Izbliza: {what}',

      // captions
      up: 'uvećan',
      down: 'umanjen',
      upPl: 'uvećani',
      downPl: 'umanjeni',
      upOba: 'uvećana',
      downOba: 'umanjena',
      cZero: 'Pomak je 0. Pomakni klizač Pomak ili povuci točku na donjoj crti; O vodi do okruglog broja.',
      cZeroC: 'Povuci točku na donjoj crti!',
      cAsk: '{l1} = {l2}? Je li taj korak točan? Za odgovor pritisni V.',
      cAskC: 'Je li isto? Pritisni V.',
      cRight_sub: '{l1} = {l2} = {r}: i umanjenik i umanjitelj {m} su za {n}, pa razmak između njih ostaje {r}.',
      cRight_add: '{l1} = {l2} = {r}: 1. pribrojnik {m1} je za {n}, a 2. {m2} za {n}; koliko jedan uzme, drugi da, pa zbroj ostaje {r}.',
      cRound_sub: '{v} je okrugao broj: {l2} se lako računa u glavi.',
      cRound_add: '{v} je okrugao broj: {l2} se lako računa u glavi.',
      cOne_sub: '{l1} {ne} {l2}: {m} je samo umanjitelj, pa je razlika {chg} ({r2}, a ne {r}). Umanjenik se mora pomaknuti jednako.',
      cOne_add: '{l1} {ne} {l2}: {m} je samo 1. pribrojnik, pa je zbroj {chg} ({r2}, a ne {r}). 2. pribrojnik mora dati koliko 1. uzme.',
      cFlip_sub: '{l1} {ne} {l2}: umanjenik je {m1}, a umanjitelj {m2}, kao kod zbroja, pa je razlika {chg} ({r2}, a ne {r}). Kod razlike oba broja idu na istu stranu.',
      cFlip_add: '{l1} {ne} {l2}: oba su pribrojnika {m} za {n}, kao kod razlike, pa je zbroj {chg} ({r2}, a ne {r}). Kod zbroja jedan daje, drugi uzima.',
      chgF_more: 'za {n} veća',
      chgF_less: 'za {n} manja',
      chgM_more: 'za {n} veći',
      chgM_less: 'za {n} manji',
      whySub: 'Razlika je razmak između umanjitelja i umanjenika na brojevnoj crti; kad se obje točke pomaknu jednako, razmak se ne mijenja.',
      whyAdd: 'Zbroj je kraj 2. pribrojnika nadovezanog na 1.; granica među njima se pomiče, a kraj ostaje.',
      whyWrong: 'Točan korak: {fix}.',
      cEqual: 'Isto radimo u pisanom oduzimanju jednakim dodacima: kad gore dodamo 10 jedinica, dolje dodamo 1 deseticu, a kad gore dodamo 10 desetica, dolje dodamo 1 stoticu; tu je to 10 + 100 = 110 obama brojevima.',
      cRightC_sub: 'Oba broja {s}. Razlika je ista: {r}.',
      cRightC_add: 'Jedan {s1}, drugi {s2}. Zbroj je isti: {r}.',
      cWrongC: 'Nije isto! {r2}, a ne {r}.',
      nOut: '{v} se ne može postići: brojevi bi izašli iz raspona od 0 do 1000.',
      nDone: '{v} je već okrugao broj.',
      nZero: 'Taj je broj već 0: s njim se lako računa.',
      nCap: '{v} je predaleko: pomak ide najviše do {max} u svaku stranu.',
      cStuck: 'Ovdje se brojevi ne mogu pomaknuti a da zadatak ostane do 1000: promijeni zadatak.',

      explain: '<p><b>Stalnost razlike.</b> Razlika dvaju brojeva je razmak između njih na brojevnoj crti. Ako i umanjenik i ' +
        'umanjitelj uvećamo (ili umanjimo) za isti broj, obje se točke pomaknu jednako, a razmak ostane isti: ' +
        '523 − 198 = 525 − 200 = 325. Zato biramo pomak koji umanjitelja čini okruglim brojem.</p>' +
        '<p><b>Stalnost zbroja.</b> Kod zbroja jedan pribrojnik uzima koliko drugi daje: 398 + 245 = 400 + 243 = 643. Na ' +
        'crti se pomakne granica između pribrojnika, a kraj (zbroj) ostaje.</p>' +
        '<p><b>Tipične pogreške:</b> promijeniti samo jedan broj (523 − 200 = 323) ili kod zbroja oba broja pomaknuti na istu ' +
        'stranu (400 + 247 = 647).</p>' +
        '<p>Na istom se pravilu temelji pisano oduzimanje jednakim dodacima: 10 jedinica dodanih umanjeniku i 1 desetica ' +
        'dodana umanjitelju povećaju oba broja za 10.</p>'
    },
    en: {
      stage: 'A number line with two numbers and their difference or sum',

      audLabel: 'For',
      audGroup: 'View for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector: any numbers, the wrong step and a question before the answer.',
      audAdultHint: 'Every step says why it works.',
      audChildHint: 'Big digits, few words.',

      taskLabel: 'Task',
      taskTitle: 'Task',
      taskHint: 'Type a difference or a sum up to 1000, e.g. 523 − 198 or 398 + 245.',
      err_empty: 'Type a task, e.g. 523 − 198.',
      err_op: 'Exactly one sign is needed: + or −.',
      err_num: 'Two whole numbers and one sign are needed.',
      err_big: 'Numbers up to 1000.',
      err_neg: 'The subtrahend must not be larger than the minuend.',
      err_sum: 'The sum must not be over 1000.',
      op: 'Operation',
      op_sub: 'Subtraction',
      op_add: 'Addition',
      k: 'Shift',
      round: 'To a round number',
      roundKey: 'Shift to a round number',
      way: 'The step (typical mistakes)',
      way_right: 'right',
      way_one: 'one number',
      way_flip: 'wrong way',
      hide: 'Ask first',
      hideHint: 'Hide the result and ask the class first (V).',
      revealKey: 'Show or hide the result',

      p_round: '523 − 198 = 525 − 200',
      p_take: '645 − 203 = 642 − 200',
      p_sum: '398 + 245 = 400 + 243',
      p_one: '523 − 198 = 523 − 200?',
      p_same: '398 + 245 = 400 + 247?',
      p_equal: 'Equal additions: 503 − 178',
      ph_round: 'Both numbers +2: the subtrahend becomes round.',
      ph_take: 'Both numbers −3.',
      ph_sum: 'One addend gives 2 to the other.',
      ph_one: 'Is the step right? (V shows)',
      ph_same: 'Is the step right? (V shows)',
      ph_equal: 'Both numbers +110, as in column subtraction by equal additions.',

      legFirst: 'minuend, 1st addend',
      legSecond: 'subtrahend, 2nd addend',
      legBefore: 'before the shift',

      tMinuend: 'minuend',
      tSubtrahend: 'subtrahend',
      tDiff: 'difference',
      tAddend1: '1st addend',
      tAddend2: '2nd addend',
      tSum: 'sum',
      lineBefore: 'before',
      lineAfter: 'after',
      dragHint: 'drag',
      lens_b: 'Subtrahend',
      lens_a: 'Minuend',
      lens_split: 'End of the 1st addend',
      lens_end: 'Sum',
      stays: 'stays',
      want: 'should be {v}',
      ask: 'The same?',
      reveal: 'Show',
      vSame_sub: 'the difference is the same',
      vSame_add: 'the sum is the same',
      vMore_sub: 'the difference is {n} more',
      vLess_sub: 'the difference is {n} less',
      vMore_add: 'the sum is {n} more',
      vLess_add: 'the sum is {n} less',
      vSameC: 'the same!',
      vNotC: 'not the same!',
      paperEq: 'The task before and after the shift',
      lineLabel: 'Number line: {line}',
      lensLabel: 'Close up: {what}',

      up: 'went up',
      down: 'went down',
      upPl: 'went up',
      downPl: 'went down',
      upOba: 'went up',
      downOba: 'went down',
      cZero: 'The shift is 0. Move the Shift slider or drag a point on the lower line; O goes to a round number.',
      cZeroC: 'Drag a point on the lower line!',
      cAsk: '{l1} = {l2}? Is this step right? Press V for the answer.',
      cAskC: 'The same? Press V.',
      cRight_sub: '{l1} = {l2} = {r}: the minuend and the subtrahend both {m} by {n}, so the gap between them stays {r}.',
      cRight_add: '{l1} = {l2} = {r}: the 1st addend {m1} by {n} and the 2nd {m2} by {n}; what one takes the other gives, so the sum stays {r}.',
      cRound_sub: '{v} is a round number: {l2} is easy to work out in your head.',
      cRound_add: '{v} is a round number: {l2} is easy to work out in your head.',
      cOne_sub: '{l1} {ne} {l2}: only the subtrahend {m}, so the difference is {chg} ({r2}, not {r}). The minuend must move by the same.',
      cOne_add: '{l1} {ne} {l2}: only the 1st addend {m}, so the sum is {chg} ({r2}, not {r}). The 2nd addend must give what the 1st takes.',
      cFlip_sub: '{l1} {ne} {l2}: the minuend {m1} and the subtrahend {m2}, as in a sum, so the difference is {chg} ({r2}, not {r}). In a difference both numbers move the same way.',
      cFlip_add: '{l1} {ne} {l2}: both addends {m} by {n}, as in a difference, so the sum is {chg} ({r2}, not {r}). In a sum one gives, the other takes.',
      chgF_more: '{n} more',
      chgF_less: '{n} less',
      chgM_more: '{n} more',
      chgM_less: '{n} less',
      whySub: 'The difference is the gap between the subtrahend and the minuend on the number line; when both points move by the same, the gap does not change.',
      whyAdd: 'The sum is where the 2nd addend ends when it is laid after the 1st; the border between them moves, the end stays.',
      whyWrong: 'The right step: {fix}.',
      cEqual: 'Column subtraction by equal additions does the same: 10 ones added on top go with 1 ten added below, and 10 tens on top with 1 hundred below; here that is 10 + 100 = 110 added to both numbers.',
      cRightC_sub: 'Both numbers {s}. The difference is the same: {r}.',
      cRightC_add: 'One {s1}, the other {s2}. The sum is the same: {r}.',
      cWrongC: 'Not the same! {r2}, not {r}.',
      nOut: '{v} is out of reach: the numbers would leave 0 to 1000.',
      nDone: '{v} is already a round number.',
      nZero: 'That number is already 0: easy to work with.',
      nCap: '{v} is too far: the shift goes at most {max} either way.',
      cStuck: 'Here the numbers cannot move and keep the task within 1000: change the task.',

      explain: '<p><b>Constant difference.</b> The difference of two numbers is the gap between them on the number line. ' +
        'Add the same number to the minuend and the subtrahend (or take it from both) and both points move by the same, ' +
        'so the gap stays: 523 − 198 = 525 − 200 = 325. That is why we pick the shift that makes the subtrahend round.</p>' +
        '<p><b>Constant sum.</b> In a sum one addend takes what the other gives: 398 + 245 = 400 + 243 = 643. On the line ' +
        'the border between the addends moves, and the end (the sum) stays.</p>' +
        '<p><b>Typical mistakes:</b> changing only one number (523 − 200 = 323), or moving both numbers of a sum the same ' +
        'way (400 + 247 = 647).</p>' +
        '<p>Column subtraction by equal additions rests on the same rule: 10 ones added to the minuend and 1 ten added to ' +
        'the subtrahend make both numbers 10 bigger.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
