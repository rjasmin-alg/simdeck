/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ari-mental-strategies, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Numbers and number sentences
   are data: the page fills them in with translate="no". The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tri načina računanja kao skokovi po praznoj brojevnoj crti, s istim rezultatom',

      // the audience switch (shared by the ari- pages)
      audLabel: 'Za koga',
      audGroup: 'Prikaz za',
      audTeacher: 'Učitelj',
      audAdult: 'Odrasli',
      audChild: 'Dijete',
      audTeacherHint: 'Za projekciju: bilo koji zadatak, tipična pogreška, crta u mjerilu.',
      audAdultHint: 'Uz svaki put piše zašto vrijedi.',
      audChildHint: 'Velike znamenke, malo riječi, skok po skok.',

      // panel
      taskLabel: 'Zadatak',
      taskTitle: 'Zadatak',
      taskHint: 'Upiši zbroj ili razliku do 1000, npr. 347 + 285 ili 632 − 285.',
      err_empty: 'Upiši zadatak, npr. 347 + 285.',
      err_op: 'Treba točno jedan znak: + ili −.',
      err_num: 'Treba dva broja (prirodna ili 0) i jedan znak.',
      err_big: 'Brojevi do 1000.',
      err_neg: 'Umanjitelj ne smije biti veći od umanjenika.',
      err_sum: 'Zbroj ne smije biti veći od 1000.',
      j: 'Skokovi',
      mistake: 'Tipična pogreška',
      mistakeHint: 'Kod stalnosti zbroja ili razlike prvi se broj pomakne na krivu stranu.',
      scale: 'Crta u mjerilu',
      nextKey: 'Sljedeći skok na svim trima crtama',
      next: 'Skok',
      again: 'Ispočetka',

      // presets
      p_cat: '347 + 285',
      p_back: '632 − 285',
      p_place: '432 + 256: bez prijelaza',
      p_near: '398 + 245: pribrojnik blizu stotice',
      p_comp: '523 − 198: umanjitelj blizu stotice',
      p_wrong: '523 − 198 = 521 − 200?',
      ph_cat: 'Primjer iz kurikuluma: 347 + 200 + 80 + 5.',
      ph_back: 'Isti brojevi unatrag: razlika.',
      ph_place: 'Nijedan skok ne prelazi deseticu ni stoticu: rastavljanje je dovoljno.',
      ph_near: 'Prvi je pribrojnik blizu stotice: najprije do 400.',
      ph_comp: 'Umanjitelj je blizu stotice: 525 − 200.',
      ph_wrong: 'Tipična pogreška: umanjenik pomaknut na krivu stranu.',

      // legend
      legPart: 'djelomični rezultat',
      legResult: 'rezultat',
      legCross: 'skok preko desetice ili stotice',

      // stage
      w_split: 'Rastavljanje',
      w_round: 'Do okruglog broja',
      w_comp: 'Kompenzacija',
      ws_split: 'po mjesnim vrijednostima',
      ws_round: 'pa ostatak rastavljen',
      ws_comp_add: 'stalnost zbroja',
      ws_comp_sub: 'stalnost razlike',
      count: ['{n} skok', '{n} skoka', '{n} skokova'],
      noCross: 'nijedan preko desetice ili stotice',
      cross: ['{n} preko desetice ili stotice', '{n} preko desetice ili stotice', '{n} preko desetice ili stotice'],
      best: 'najlakše',
      want: 'treba {v}',
      out: 'Ovdje ne ide: put bi izašao iz raspona od 0 do 1000.',
      lineLabel: '{way}: {path}',
      taskQ: 'Zadatak',

      // captions
      c0: 'Od {a} do rezultata na tri načina, svaki na svojoj crti. Tipka S: sljedeći skok na sve tri crte; djelomične rezultate zapisujemo.',
      c0C: 'Pritisni S za skok!',
      cStep: 'Skok {i}: {list}.',
      cStepC: 'Skok {i}!',
      cItem: '{way} {jump} = {to}',
      cItemWait: '{way} je već na {to}',
      k_cross: '(preko desetice ili stotice)',
      cEnd: 'Sva tri načina daju {r}.',
      cEnd2: 'Oba načina daju {r}.',
      cEndC: 'Svi daju {r}!',
      cBest: 'Ovdje je najlakše: {ways}.',
      cBestWhy: 'Najlakši je način s najmanje skokova preko desetice ili stotice; ako ih je jednako, onaj s manje skokova.',
      and: ' i ',
      cMis: '{comp} stiže do {e}, a ne do {r}.',
      cMisC: '{e}, a ne {r}!',
      mis_add_up: 'Pribrojnik {b} povećamo za {k} (na {R}), pa pribrojnik {a} moramo smanjiti za {k}: {right}, a ne {wrong}.',
      mis_add_down: 'Pribrojnik {b} smanjimo za {k} (na {R}), pa pribrojnik {a} moramo povećati za {k}: {right}, a ne {wrong}.',
      mis_sub_up: 'Umanjitelj {b} povećamo za {k} (na {R}), pa i umanjenik {a} moramo povećati za {k}: {right}, a ne {wrong}.',
      mis_sub_down: 'Umanjitelj {b} smanjimo za {k} (na {R}), pa i umanjenik {a} moramo smanjiti za {k}: {right}, a ne {wrong}.',
      cOut: 'Kompenzacija ovdje ne ide: put bi izašao iz raspona od 0 do 1000 ({v}).',
      cFix: 'Kompenzacija: {how} ovdje bi izašla iz raspona od 0 do 1000 ({v}), pa najprije skočimo za {R}, a zatim ispravimo za {k}.',
      why_split: 'Rastavljanje: drugi broj rastavimo na stotice, desetice i jedinice i dodajemo ih (ili oduzimamo) jednu po jednu.',
      why_round: 'Do okruglog broja: najprije skočimo do sljedeće stotice ili desetice; od okruglog broja dalje se lako računa.',
      why_comp_add: 'Stalnost zbroja: jedan pribrojnik povećamo, a drugi smanjimo za isti broj, pa zbroj ostaje isti.',
      why_comp_sub: 'Stalnost razlike: umanjenik i umanjitelj povećamo (ili smanjimo) za isti broj, pa razlika ostaje ista.',

      explain: '<p><b>Računanje u glavi.</b> Zbroj ili razliku do 1000 možemo izračunati na više načina; svaki je put ' +
        'skokova po praznoj brojevnoj crti od prvog broja, a svi stižu do istog broja. Djelomične rezultate smijemo ' +
        'zapisati.</p>' +
        '<p><b>Rastavljanje:</b> 347 + 285 = 347 + 200 + 80 + 5. <b>Do okruglog broja:</b> 347 + 53 = 400, pa još 232. ' +
        '<b>Kompenzacija</b> (stalnost zbroja): 347 + 285 = 342 + 290 = 632.</p>' +
        '<p>Koji je način najlakši, ovisi o brojevima: rastavljanje kad nema prijelaza (432 + 256), do okruglog broja kad je ' +
        'prvi broj blizu stotice (398 + 245), kompenzacija kad je drugi broj blizu okruglog (523 − 198 = 525 − 200).</p>' +
        '<p>Prazna brojevna crta ne mora biti u mjerilu: mali su skokovi razvučeni da se vide. Crta u mjerilu pokazuje ' +
        'prave razmake.</p>'
    },
    en: {
      stage: 'Three ways of working it out as jumps on an empty number line, with the same result',

      audLabel: 'For',
      audGroup: 'View for',
      audTeacher: 'Teacher',
      audAdult: 'Adult',
      audChild: 'Child',
      audTeacherHint: 'For the projector: any task, the typical mistake, the line to scale.',
      audAdultHint: 'Each path says why it works.',
      audChildHint: 'Big digits, few words, one jump at a time.',

      taskLabel: 'Task',
      taskTitle: 'Task',
      taskHint: 'Type a sum or a difference up to 1000, e.g. 347 + 285 or 632 − 285.',
      err_empty: 'Type a task, e.g. 347 + 285.',
      err_op: 'Exactly one sign is needed: + or −.',
      err_num: 'Two whole numbers and one sign are needed.',
      err_big: 'Numbers up to 1000.',
      err_neg: 'The subtrahend must not be larger than the minuend.',
      err_sum: 'The sum must not be over 1000.',
      j: 'Jumps',
      mistake: 'Typical mistake',
      mistakeHint: 'In the constant sum or difference the first number moves the wrong way.',
      scale: 'Line to scale',
      nextKey: 'Next jump on all three lines',
      next: 'Jump',
      again: 'Start again',

      p_cat: '347 + 285',
      p_back: '632 − 285',
      p_place: '432 + 256: no crossing',
      p_near: '398 + 245: an addend near a hundred',
      p_comp: '523 − 198: subtrahend near a hundred',
      p_wrong: '523 − 198 = 521 − 200?',
      ph_cat: 'The curriculum\'s example: 347 + 200 + 80 + 5.',
      ph_back: 'The same numbers backwards: a difference.',
      ph_place: 'No jump goes over a ten or a hundred: splitting is enough.',
      ph_near: 'The first addend is near a hundred: to 400 first.',
      ph_comp: 'The subtrahend is near a hundred: 525 − 200.',
      ph_wrong: 'The typical mistake: the minuend moved the wrong way.',

      legPart: 'partial result',
      legResult: 'result',
      legCross: 'a jump over a ten or a hundred',

      w_split: 'Splitting',
      w_round: 'To a round number',
      w_comp: 'Compensating',
      ws_split: 'by place value',
      ws_round: 'then the rest split',
      ws_comp_add: 'constant sum',
      ws_comp_sub: 'constant difference',
      count: ['{n} jump', '{n} jumps'],
      noCross: 'none over a ten or a hundred',
      cross: ['{n} over a ten or a hundred', '{n} over a ten or a hundred'],
      best: 'easiest',
      want: 'should be {v}',
      out: 'Not here: the path would leave 0 to 1000.',
      lineLabel: '{way}: {path}',
      taskQ: 'Task',

      c0: 'From {a} to the result three ways, each on its own line. S: the next jump on all three lines; we write the partial results down.',
      c0C: 'Press S to jump!',
      cStep: 'Jump {i}: {list}.',
      cStepC: 'Jump {i}!',
      cItem: '{way} {jump} = {to}',
      cItemWait: '{way} is already at {to}',
      k_cross: '(over a ten or a hundred)',
      cEnd: 'All three ways give {r}.',
      cEnd2: 'Both ways give {r}.',
      cEndC: 'All give {r}!',
      cBest: 'Easiest here: {ways}.',
      cBestWhy: 'The easiest way has the fewest jumps over a ten or a hundred; if that ties, the fewest jumps.',
      and: ' and ',
      cMis: '{comp} lands on {e}, not {r}.',
      cMisC: '{e}, not {r}!',
      mis_add_up: 'We add {k} to the addend {b} (making {R}), so we must take {k} from the addend {a}: {right}, not {wrong}.',
      mis_add_down: 'We take {k} from the addend {b} (making {R}), so we must add {k} to the addend {a}: {right}, not {wrong}.',
      mis_sub_up: 'We add {k} to the subtrahend {b} (making {R}), so we must add {k} to the minuend {a} too: {right}, not {wrong}.',
      mis_sub_down: 'We take {k} from the subtrahend {b} (making {R}), so we must take {k} from the minuend {a} too: {right}, not {wrong}.',
      cOut: 'Compensating does not work here: the path would leave 0 to 1000 ({v}).',
      cFix: 'Compensating: the {how} would leave 0 to 1000 here ({v}), so we jump by {R} first and then correct by {k}.',
      why_split: 'Splitting: split the second number into hundreds, tens and ones and add (or take away) one part at a time.',
      why_round: 'To a round number: first jump to the next hundred or ten; from a round number on it is easy.',
      why_comp_add: 'Constant sum: add a number to one addend and take the same from the other, and the sum stays the same.',
      why_comp_sub: 'Constant difference: add the same number to the minuend and the subtrahend (or take it from both), and the difference stays the same.',

      explain: '<p><b>Mental arithmetic.</b> A sum or a difference up to 1000 can be worked out in more than one way; ' +
        'each is a path of jumps on an empty number line from the first number, and they all land on the same number. ' +
        'Writing the partial results down is allowed.</p>' +
        '<p><b>Splitting:</b> 347 + 285 = 347 + 200 + 80 + 5. <b>To a round number:</b> 347 + 53 = 400, then 232 more. ' +
        '<b>Compensating</b> (constant sum): 347 + 285 = 342 + 290 = 632.</p>' +
        '<p>Which way is easiest depends on the numbers: splitting when nothing crosses (432 + 256), a round number first ' +
        'when the first number is near a hundred (398 + 245), compensating when the second number is near a round one ' +
        '(523 − 198 = 525 − 200).</p>' +
        '<p>An empty number line need not be to scale: small jumps are stretched so they show. The line to scale shows ' +
        'the true distances.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
