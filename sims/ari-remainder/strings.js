/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-remainder, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Numbers and number sentences
   are data: the page fills them in with translate="no". The title and subtitle come from sim.json.
   Caption keys end in T (teacher), A (adult) or C (child): the three audiences of the ari- pages. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Bomboni u zdjeli i djeca koja ih dobivaju, krug po krug',

      // the audience switch (shared by the ari- pages)
      audLabel: 'Za koga',
      audGroup: 'Prikaz za',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju: bilo koji zadatak, tipična pogreška, korak po korak.',
      audAdultHint: 'Uz svaki korak piše zašto vrijedi.',
      audChildHint: 'Velike znamenke, malo riječi.',

      // panel
      nLabel: 'Bombona (djeljenik)',
      nHint: 'Do 100. Za 2 do 5 djece najviše 18 krugova.',
      dLabel: 'Djece (djelitelj)',
      mistake: 'Tipična pogreška: prevelik ostatak',
      mistakeHint: 'Učenik stane krug prerano.',
      mistakeNone: 'Ovdje nijedan krug ne ide, pa se ne može stati prerano.',

      pSweets: '23 bombona, četvero djece',
      pSweetsHint: '23 : 4 = 5, ostatak 3',
      pExact: 'Bez ostatka',
      pExactHint: '24 : 4 = 6, ostatak 0: točno 4 su dovoljna za još jedan krug',
      pFewer: 'Manje bombona nego djece',
      pFewerHint: '3 : 5 = 0, ostatak 3',
      pLargest: 'Najveći mogući ostatak',
      pLargestHint: '47 : 6 = 7, ostatak 5: za šestero djece ostatak je najviše 5',
      pTooBig: 'Prevelik ostatak',
      pTooBigHint: '31 : 4 = 6, ostatak 7? Provjera to otkrije.',
      pHundred: '100 bombona, sedmero djece',
      pHundredHint: '100 : 7 = 14, ostatak 2',

      // legend
      legSweet: 'bombon',
      legTaken: 'uzet iz zdjele',
      legNew: 'dobiven u ovom krugu',
      legRest: 'ostatak',

      // the stage
      bowl: 'Zdjela',
      inBowl: 'u zdjeli: {v}',
      bowlLabel: 'Zdjela: {v} od {n} bombona',
      kidLabel: 'Dijete {i} ima {s}',
      slotYes: 'za ovo dijete ima još jedan',
      slotNo: 'za ovo dijete nema više',
      restLabel: 'ostatak {r}',
      nameN: 'djeljenik',
      nameD: 'djelitelj',
      nameQ: 'količnik',
      nameR: 'ostatak',
      rest: 'ostatak',
      roundsTitle: 'Krug po krug: svaki krug uzme {d}',
      roundsGiven: 'podijeljeno: {e}',
      roundsStop: 'stop',
      checkTitle: 'Provjera',
      checkEq: 'količnik · djelitelj + ostatak = djeljenik',
      checkLess: 'ostatak je manji od djelitelja',
      checkLater: 'na kraju',
      mtHead: 'Tipična pogreška',
      mtWrote: 'Učenik je napisao:',
      mtAsk: 'Je li točno? Provjera na kraju.',
      mtEqOk: 'jednakost vrijedi',
      mtLessNo: 'ostatak nije manji od djelitelja',
      mtWhy: '{r} bombona dovoljno je za još jedan krug: {r} − {d} = {o}.',
      yes: 'da',
      no: 'ne',
      sweets: ['{n} bombon', '{n} bombona', '{n} bombona'],
      rounds: ['{n} krug', '{n} kruga', '{n} krugova'],
      kids2: 'dvoje djece', kids3: 'troje djece', kids4: 'četvero djece', kids5: 'petero djece', kids6: 'šestero djece',
      kids7: 'sedmero djece', kids8: 'osmero djece', kids9: 'devetero djece', kids10: 'desetero djece',

      // captions: start
      cStartT: '{n} dijelimo među {kids}: u svakom krugu svako dijete dobije po jedan. Koliko će dobiti svako, a koliko će ostati?',
      cStartA: '{n} dijelimo među {kids}. Jedan krug uzme iz zdjele {d}, po jedan za svako dijete: dijeljenje je uzastopno oduzimanje istoga broja.',
      cStartC: '{n}, {kids}. Svatko dobiva jednako!',
      // a round
      cRoundT: '{k}. krug: svako dijete dobije jedan bombon. U zdjeli: {prev} − {d} = {pile}.',
      cRoundA: '{k}. krug uzme {d}: {prev} − {d} = {pile}. Dosad je podijeljeno {k} · {d} = {g}, svako dijete ima {each}.',
      cRoundC: 'Svatko dobije jedan. U zdjeli: {pile}.',
      cHereT: 'Ovdje netko stane i napiše {q}, ostatak {r}. Ali {r} nije manji od {d}: ima dovoljno za još jedan krug.',
      // the round that fails
      cShortT: 'U zdjeli je {r}, a djece {d}: {r} < {d}, pa novi krug ne ide jer ne bi svako dijete dobilo bombon. {r} je ostatak.',
      cShort0T: 'Zdjela je prazna: ostatak je 0. Bomboni su podijeljeni bez ostatka.',
      cShortNoneT: 'Bombona je {r}, a djece {d}: ni prvi krug ne ide. Nitko ne dobije nijedan: količnik je 0, ostatak {r}.',
      cShortA: 'Ostalo je {r}, manje od {d}. Krug daje svakomu ili nikomu, pa tu stajemo. Zato je ostatak uvijek manji od djelitelja: dok ih je {d} ili više, ide još jedan krug.',
      cShort0A: 'Ostalo je 0: točno {d} bilo je dosta za zadnji krug. Dijeljenje je bez ostatka, a ostatak 0 i dalje je manji od djelitelja.',
      cShortNoneA: 'U zdjeli: {r}, manje od {d}: nijedan krug ne ide. Količnik je 0, a cijela zdjela je ostatak, i opet manji od djelitelja.',
      cShortC: 'Ostalo je {r}. Za sve nema. To je ostatak.',
      cShort0C: 'Ništa nije ostalo!',
      cShortNoneC: 'Premalo za sve! Nitko ne dobije. Ostatak je {r}.',
      // the check
      cCheckT: '{expr}. Provjera: {eq} i {less}.',
      cCheckA: 'Provjera vraća bombone u zdjelu: {rounds} po {d} je {g}, i još ostatak: {g} + {r} = {n}. A ostatak mora biti manji od djelitelja, inače je dijeljenje stalo prerano.',
      cCheckC: '{expr}. Svatko ima {q}.',
      cMistakeT: 'Odgovor {w} prolazi jednakost ({eq}), ali {wr} nije manji od {d}: učenik je stao krug prerano.',

      explain: '<p><b>Dijeljenje s ostatkom</b> je dijeljenje na jednake dijelove kad ne ide do kraja. Bombone dijelimo ' +
        'krug po krug: u svakom krugu svako dijete dobije po jedan, pa iz zdjele nestane onoliko bombona koliko je djece. ' +
        'To je dijeljenje kao uzastopno oduzimanje, kako se uči u 2. razredu.</p>' +
        '<p>Krug ide samo kad ima za svakoga. Kad u zdjeli ostane manje bombona nego djece, staje se: broj krugova je ' +
        '<b>količnik</b>, a ono što je ostalo <b>ostatak</b>. Zato je ostatak uvijek manji od djelitelja.</p>' +
        '<p><b>Provjera</b> ima dva dijela: količnik · djelitelj + ostatak = djeljenik (svi bomboni su tu), i ostatak je ' +
        'manji od djelitelja (nijedan krug nije propušten). Tipična pogreška je stati krug prerano: 23 : 4 = 4, ostatak 7. ' +
        'Jednakost 4 · 4 + 7 = 23 vrijedi, ali 7 bombona dovoljno je za još jedan krug, pa je točno 5, ostatak 3.</p>'
    },
    en: {
      stage: 'Sweets in a bowl and the children who get them, round by round',

      audLabel: 'For',
      audGroup: 'View for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector: any task, the typical mistake, step by step.',
      audAdultHint: 'Every step says why it works.',
      audChildHint: 'Big digits, few words.',

      nLabel: 'Sweets (dividend)',
      nHint: 'Up to 100. With 2 to 5 children at most 18 rounds.',
      dLabel: 'Children (divisor)',
      mistake: 'Typical mistake: a remainder too big',
      mistakeHint: 'A pupil stops one round too early.',
      mistakeNone: 'Here no round goes at all, so nobody can stop too early.',

      pSweets: '23 sweets, four children',
      pSweetsHint: '23 : 4 = 5, remainder 3',
      pExact: 'No remainder',
      pExactHint: '24 : 4 = 6, remainder 0: exactly 4 are enough for one more round',
      pFewer: 'Fewer sweets than children',
      pFewerHint: '3 : 5 = 0, remainder 3',
      pLargest: 'The largest remainder',
      pLargestHint: '47 : 6 = 7, remainder 5: for six children the remainder is at most 5',
      pTooBig: 'A remainder too big',
      pTooBigHint: '31 : 4 = 6, remainder 7? The check finds out.',
      pHundred: '100 sweets, seven children',
      pHundredHint: '100 : 7 = 14, remainder 2',

      legSweet: 'sweet',
      legTaken: 'taken from the bowl',
      legNew: 'received this round',
      legRest: 'remainder',

      bowl: 'Bowl',
      inBowl: 'in the bowl: {v}',
      bowlLabel: 'Bowl: {v} of {n} sweets',
      kidLabel: 'Child {i} has {s}',
      slotYes: 'there is one more for this child',
      slotNo: 'none left for this child',
      restLabel: 'remainder {r}',
      nameN: 'dividend',
      nameD: 'divisor',
      nameQ: 'quotient',
      nameR: 'remainder',
      rest: 'remainder',
      roundsTitle: 'Round by round: each round takes {d}',
      roundsGiven: 'given out: {e}',
      roundsStop: 'stop',
      checkTitle: 'Check',
      checkEq: 'quotient · divisor + remainder = dividend',
      checkLess: 'the remainder is less than the divisor',
      checkLater: 'at the end',
      mtHead: 'Typical mistake',
      mtWrote: 'A pupil wrote:',
      mtAsk: 'Is it right? The check at the end.',
      mtEqOk: 'the equality holds',
      mtLessNo: 'the remainder is not less than the divisor',
      mtWhy: '{r} sweets are enough for one more round: {r} − {d} = {o}.',
      yes: 'yes',
      no: 'no',
      sweets: ['{n} sweet', '{n} sweets'],
      rounds: ['{n} round', '{n} rounds'],
      kids2: 'two children', kids3: 'three children', kids4: 'four children', kids5: 'five children', kids6: 'six children',
      kids7: 'seven children', kids8: 'eight children', kids9: 'nine children', kids10: 'ten children',

      cStartT: 'We share {n} among {kids}: each round every child gets one. How many will each get, and how many are left?',
      cStartA: 'We share {n} among {kids}. One round takes {d} from the bowl, one for each child: division is subtracting the same number again and again.',
      cStartC: '{n}, {kids}. Everyone gets the same!',
      cRoundT: 'Round {k}: every child gets one sweet. In the bowl: {prev} − {d} = {pile}.',
      cRoundA: 'Round {k} takes {d}: {prev} − {d} = {pile}. So far {k} · {d} = {g} are given out; each child has {each}.',
      cRoundC: 'Everyone gets one. In the bowl: {pile}.',
      cHereT: 'Here someone stops and writes {q}, remainder {r}. But {r} is not less than {d}: there is enough for one more round.',
      cShortT: '{r} in the bowl and {d} children: {r} < {d}, so no new round, because not every child would get a sweet. {r} is the remainder.',
      cShort0T: 'The bowl is empty: the remainder is 0. The sweets are shared with no remainder.',
      cShortNoneT: 'Sweets: {r}, children: {d}: not even the first round goes. Nobody gets one: the quotient is 0, the remainder {r}.',
      cShortA: 'Left in the bowl: {r}, fewer than {d}. A round gives to everyone or to no one, so we stop here. That is why the remainder is always less than the divisor: while there are {d} or more, another round goes.',
      cShort0A: 'None are left: exactly {d} were enough for the last round. The division has no remainder, and a remainder of 0 is still less than the divisor.',
      cShortNoneA: 'In the bowl: {r}, fewer than {d}: no round goes. The quotient is 0 and the whole bowl is the remainder, again less than the divisor.',
      cShortC: 'Left: {r}. Not enough for all. That is the remainder.',
      cShort0C: 'Nothing is left!',
      cShortNoneC: 'Too few for all! Nobody gets one. The remainder is {r}.',
      cCheckT: '{expr}. Check: {eq} and {less}.',
      cCheckA: 'The check puts the sweets back in the bowl: {rounds} of {d} is {g}, plus the remainder: {g} + {r} = {n}. And the remainder must be less than the divisor, or the dealing stopped too early.',
      cCheckC: '{expr}. Everyone has {q}.',
      cMistakeT: 'The answer {w} passes the equality ({eq}), but {wr} is not less than {d}: the pupil stopped one round too early.',

      explain: '<p><b>Division with a remainder</b> is sharing into equal parts when it does not come out even. We deal ' +
        'the sweets round by round: each round every child gets one, so as many sweets leave the bowl as there are ' +
        'children. That is division as repeated subtraction, as taught in grade 2.</p>' +
        '<p>A round goes only when there is one for everyone. When fewer sweets than children are left, we stop: the ' +
        'number of rounds is the <b>quotient</b>, what is left the <b>remainder</b>. That is why the remainder is always ' +
        'less than the divisor.</p>' +
        '<p>The <b>check</b> has two parts: quotient · divisor + remainder = dividend (all the sweets are there), and the ' +
        'remainder is less than the divisor (no round was missed). The typical mistake is stopping one round too early: ' +
        '23 : 4 = 4, remainder 7. The equality 4 · 4 + 7 = 23 holds, but 7 sweets are enough for one more round, so the ' +
        'answer is 5, remainder 3.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
