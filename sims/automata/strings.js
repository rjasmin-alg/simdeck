/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of automata, in both languages (docs/sim-ui.md §9). Croatian is the original
   (single-page-labs/automati-dijagrami-demo.html: its headings, machine descriptions and step messages); English is
   written for simdeck. Only "stack" is in kit/glossary.js; the other term pairs are written out (English in italics
   with the Croatian in parentheses at first mention) and listed in NOTES.md. State names (q0, qA, dead, ACCEPT),
   symbols, words and the transition labels on the diagram are data: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dijagram stanja odabranog automata, ulazna riječ ili traka s glavom, stog ili aktivna stanja, i rezultat',
      machine: 'Automat',
      word: 'Ulazna riječ',
      wordHint: 'ε je prazna riječ.',
      nameDfa: 'DFA',
      nameNfa: 'NFA',
      namePda: 'PDA',
      nameTm: 'TM',
      fullDfa: 'deterministički konačni automat',
      fullNfa: 'nedeterministički konačni automat',
      fullPda: 'potisni automat',
      fullTm: 'Turingov stroj',
      langDfa: 'prihvaća samo riječ banana',
      langNfa: 'prihvaća svaku riječ koja završava s ana',
      langPda: 'prihvaća b aⁿ n aⁿ: jednako mnogo a prije i poslije srednjeg n',
      langTm: 'prihvaća svaku riječ koja negdje sadrži ana',
      noteDfa: '≠ b: svaki znak osim b; Σ: svaki znak. Iz mrtvog stanja (dead) nema izlaza.',
      noteNfa: 'Σ: svaki znak. Iz q0 automat na svaki a ide i u q0 i u q1: obje putanje žive dalje.',
      notePda: 'Uz prijelaz piše pročitani znak i što se radi sa stogom. ε: prijelaz bez čitanja znaka.',
      noteTm: 'Znak / R: pročitani znak i pomak glave desno. □: prazno polje iza riječi. Ovaj stroj samo čita.',
      presetDfaYes: 'DFA: banana',
      presetDfaYesHint: 'Šest ispravnih znakova, kraj ulaza u q6: prihvaća.',
      presetDfaNo: 'DFA: bandana',
      presetDfaNoHint: 'Na četvrtom znaku d umjesto a: mrtvo stanje do kraja.',
      presetNfaYes: 'NFA: banana',
      presetNfaYesHint: 'Više aktivnih stanja odjednom; na kraju je jedno u q3.',
      presetNfaNo: 'NFA: ananas',
      presetNfaNoHint: 'Putanja stigne do q3, ali s završnim s nestaje.',
      presetPdaYes: 'PDA: baanaa',
      presetPdaYesHint: 'Dva A na stog prije n, dva skinuta poslije: prihvaća.',
      presetPdaNo: 'PDA: banana',
      presetPdaNoHint: 'Nakon b a n a dolazi drugi n: banana nije oblika b aⁿ n aⁿ.',
      presetPdaBana: 'PDA: bana',
      presetPdaBanaHint: 'Najkraća riječ s jednim a sa svake strane.',
      presetTmYes: 'TM: bandana',
      presetTmYesHint: 'an, pa d: povratak u q0; drugi ana se nađe i stroj staje.',
      presetTmNo: 'TM: baba',
      presetTmNoHint: 'Glava dođe do praznog polja bez ana: REJECT.',
      legendNow: 'trenutno stanje',
      legendAccept: 'prihvatljivo stanje (dvostruki krug)',
      legendEdge: 'upravo korišten prijelaz',
      input: 'Ulaz',
      tape: 'Traka',
      stack: 'Stog (vrh desno)',
      stackEmpty: 'stog je prazan',
      active: 'Aktivna stanja',
      noActive: 'nema aktivnih putanja',
      path: 'Putanja',
      state: 'Stanje',
      states: 'Aktivna stanja',
      position: 'Pozicija',
      head: 'Glava',
      result: 'Rezultat',
      running: 'u tijeku',
      accepts: 'PRIHVAĆA',
      rejects: 'ODBIJA',
      emptyWord: 'prazna riječ',
      captionStart: '{m} je u početnom stanju {state} i čeka prvi znak riječi {word}. Pritisni → za korak.',
      captionStartEmpty: '{m} je u početnom stanju {state}, a riječ je prazna (ε). Pritisni → za korak.',
      dfaMove: '{from} čita {sym} i prelazi u {to}.',
      dfaToDead: 'Očekivao se {expected}, a došao je {sym}: prijelaz iz {from} u mrtvo stanje.',
      dfaToDeadEnd: 'Riječ je trebala završiti u {from}, a došao je {sym}: prijelaz u mrtvo stanje.',
      dfaDeadStay: 'Već smo u mrtvom stanju; znak {sym} ništa ne popravlja.',
      endAccept: 'Kraj ulaza, a automat je u prihvatljivom stanju {state}: riječ je prihvaćena.',
      endReject: 'Kraj ulaza, ali {state} nije prihvatljivo stanje: riječ je odbijena.',
      nfaRead: 'Znak {sym}: {moves}.',
      nfaStay: '{q} ostaje u {q}',
      nfaDropped: 'Putanje iz {states} nemaju prijelaz za {sym} i nestaju.',
      nfaEndAccept: 'Kraj ulaza: među aktivnim stanjima ({active}) je q3, pa je riječ prihvaćena.',
      nfaEndReject: 'Kraj ulaza: aktivna su stanja {active}, nijedna putanja nije u q3, pa je riječ odbijena.',
      pdaStart: 'Pročitan b: na stog ide oznaka dna $ i automat prelazi u q1.',
      pdaPush: 'Prije srednjeg n: pročitan a, push A. Na stogu je A: {k}.',
      pdaMiddle: 'Srednji n: prijelaz u q2. Od sada se za svaki a skida po jedan A.',
      pdaPop: 'Nakon n: pročitan a, pop A. Na stogu je ostalo A: {k}.',
      pdaAccept: 'Ulaz je gotov i na vrhu je samo $: ε-prijelaz skida $ i ide u q3. Riječ je prihvaćena.',
      pdaNoB: 'PDA očekuje početni b, a došao je {sym}: riječ je odbijena.',
      pdaNoBEnd: 'Riječ je prazna, a PDA očekuje početni b: riječ je odbijena.',
      pdaBadQ1: 'U q1 dopušteni su samo a ili srednji n, a došao je {sym}: riječ je odbijena.',
      pdaBadQ1End: 'Ulaz je gotov prije srednjeg n: riječ je odbijena.',
      pdaBadQ2: 'Nakon srednjeg n smije doći samo a, a došao je {sym}: riječ je odbijena.',
      pdaNoA: 'Pročitan a, ali na stogu više nema A (vrh je $): poslije n ima više a nego prije. Riječ je odbijena.',
      pdaLeft: 'Ulaz je gotov, ali na stogu je ostalo A: {k}. Prije n bilo je više a nego poslije: riječ je odbijena.',
      tmSkip: 'Znak {sym} nije početak ana: q0 ostaje, glava ide desno.',
      tmA: 'Nađen a: možda počinje ana. Prijelaz u qA, glava desno.',
      tmAgain: 'Opet a: to može biti novi početak ana. qA ostaje, glava desno.',
      tmAN: 'Nakon a došao je n: imamo an, traži se završni a. Prijelaz u qAN, glava desno.',
      tmBack: 'U {from} došao je {sym} i prekinuo uzorak: povratak u q0, glava desno.',
      tmAccept: 'Nakon an došao je a: podniz ana je nađen i stroj staje u ACCEPT.',
      tmReject: 'Glava je na praznom polju □ u stanju {from}: kraj riječi bez ana, stroj staje u REJECT.',
      halted: 'Automat je stao.',
      explain:
        '<p>Četiri automata čitaju istu vrstu ulaza, riječ od slova, znak po znak. Riječ <code translate="no">banana</code> ' +
        'je namjerno banalna, da se studenti ne mogu sakriti u apstrakciju.</p>' +
        '<p><b>DFA</b>, <i lang="en">deterministic finite automaton</i> (deterministički konačni automat): za svako stanje i ' +
        'svaki ulazni znak postoji točno jedan sljedeći korak. Ovaj prihvaća samo riječ banana; svaki pogrešan znak vodi u ' +
        '<i lang="en">dead state</i> (mrtvo stanje), iz kojeg nema izlaza. Riječ je prihvaćena ako je na kraju ulaza automat ' +
        'u <i lang="en">accepting state</i> (prihvatljivo stanje), ovdje q6.</p>' +
        '<p><b>NFA</b>, <i lang="en">nondeterministic finite automaton</i> (nedeterministički konačni automat): iz istog ' +
        'stanja na isti znak može otići u više stanja. Ovaj prihvaća riječi koje završavaju s ana: na svaki a može ' +
        'ostati u q0 i ujedno pokušati prepoznati završni ana. Simulacija prati skup svih aktivnih stanja; riječ je ' +
        'prihvaćena ako je na kraju barem jedna putanja u q3.</p>' +
        '<p><b>PDA</b>, <i lang="en">pushdown automaton</i> (potisni automat): konačni automat koji ima i [[stack]]. Ovaj ' +
        'prihvaća b aⁿ n aⁿ: prije srednjeg n za svaki a stavlja A na stog (<i lang="en">push</i>), poslije n za svaki a ' +
        'skida jedan A (<i lang="en">pop</i>). Ako na kraju ostane samo oznaka dna $, riječ je prihvaćena. Konačni automat ' +
        'to ne može: morao bi brojati bez granice. Riječ banana nije tog oblika (b a n a n a ima dva n), pa je ovaj PDA ' +
        'odbija; prihvaća bana i baanaa.</p>' +
        '<p><b>TM</b>, <i lang="en">Turing machine</i> (Turingov stroj): ima <i lang="en">tape</i> (traka) i ' +
        '<i lang="en">head</i> (glava) za čitanje i pisanje, koja se može micati lijevo i desno. Ovaj traži podniz ana. ' +
        'Ne piše po traci i ide samo desno, jer je cilj pokazati model (traku, glavu, stanja zaustavljanja ACCEPT i REJECT), ' +
        'a ne zakomplicirati stvar bez potrebe.</p>'
    },
    en: {
      stage: 'State diagram of the chosen machine, the input word or the tape with its head, the stack or the active states, and the result',
      machine: 'Machine',
      word: 'Input word',
      wordHint: 'ε is the empty word.',
      nameDfa: 'DFA',
      nameNfa: 'NFA',
      namePda: 'PDA',
      nameTm: 'TM',
      fullDfa: 'deterministic finite automaton',
      fullNfa: 'nondeterministic finite automaton',
      fullPda: 'pushdown automaton',
      fullTm: 'Turing machine',
      langDfa: 'accepts only the word banana',
      langNfa: 'accepts every word that ends in ana',
      langPda: 'accepts b aⁿ n aⁿ: as many a before the middle n as after it',
      langTm: 'accepts every word that contains ana somewhere',
      noteDfa: '≠ b: any symbol but b; Σ: any symbol. There is no way out of the dead state.',
      noteNfa: 'Σ: any symbol. On an a, q0 goes both to q0 and to q1: both paths live on.',
      notePda: 'Each transition shows the symbol read and what happens to the stack. ε: a move that reads no symbol.',
      noteTm: 'Symbol / R: the symbol read and the head moving right. □: the blank after the word. This machine only reads.',
      presetDfaYes: 'DFA: banana',
      presetDfaYesHint: 'Six right symbols, the input ends in q6: accepts.',
      presetDfaNo: 'DFA: bandana',
      presetDfaNoHint: 'The fourth symbol is d instead of a: the dead state until the end.',
      presetNfaYes: 'NFA: banana',
      presetNfaYesHint: 'Several active states at once; at the end one of them is q3.',
      presetNfaNo: 'NFA: ananas',
      presetNfaNoHint: 'A path reaches q3, but the final s kills it.',
      presetPdaYes: 'PDA: baanaa',
      presetPdaYesHint: 'Two A pushed before the n, two popped after it: accepts.',
      presetPdaNo: 'PDA: banana',
      presetPdaNoHint: 'After b a n a comes a second n: banana is not of the form b aⁿ n aⁿ.',
      presetPdaBana: 'PDA: bana',
      presetPdaBanaHint: 'The shortest word with one a on each side.',
      presetTmYes: 'TM: bandana',
      presetTmYesHint: 'an, then d: back to q0; the second ana is found and the machine halts.',
      presetTmNo: 'TM: baba',
      presetTmNoHint: 'The head reaches the blank without finding ana: REJECT.',
      legendNow: 'current state',
      legendAccept: 'accepting state (double circle)',
      legendEdge: 'transition just taken',
      input: 'Input',
      tape: 'Tape',
      stack: 'Stack (top on the right)',
      stackEmpty: 'the stack is empty',
      active: 'Active states',
      noActive: 'no active paths',
      path: 'Path',
      state: 'State',
      states: 'Active states',
      position: 'Position',
      head: 'Head',
      result: 'Result',
      running: 'running',
      accepts: 'ACCEPTS',
      rejects: 'REJECTS',
      emptyWord: 'empty word',
      captionStart: 'The {m} is in its start state {state}, waiting for the first symbol of {word}. Press → to step.',
      captionStartEmpty: 'The {m} is in its start state {state}, and the word is empty (ε). Press → to step.',
      dfaMove: '{from} reads {sym} and moves to {to}.',
      dfaToDead: '{expected} was expected, {sym} came: from {from} to the dead state.',
      dfaToDeadEnd: 'The word should have ended in {from}, but {sym} came: to the dead state.',
      dfaDeadStay: 'Already in the dead state; the symbol {sym} does not fix anything.',
      endAccept: 'End of input, and the machine is in the accepting state {state}: the word is accepted.',
      endReject: 'End of input, but {state} is not an accepting state: the word is rejected.',
      nfaRead: 'Symbol {sym}: {moves}.',
      nfaStay: '{q} stays in {q}',
      nfaDropped: 'The paths from {states} have no transition on {sym} and die.',
      nfaEndAccept: 'End of input: q3 is among the active states ({active}), so the word is accepted.',
      nfaEndReject: 'End of input: the active states are {active}, no path is in q3, so the word is rejected.',
      pdaStart: 'Read b: the bottom marker $ goes on the stack and the machine moves to q1.',
      pdaPush: 'Before the middle n: read a, push A. A on the stack: {k}.',
      pdaMiddle: 'The middle n: move to q2. From now on each a pops one A.',
      pdaPop: 'After the n: read a, pop A. A left on the stack: {k}.',
      pdaAccept: 'The input is used up and only $ is on top: the ε-move pops $ and goes to q3. The word is accepted.',
      pdaNoB: 'The PDA expects a b first, but {sym} came: the word is rejected.',
      pdaNoBEnd: 'The word is empty, and the PDA expects a b first: the word is rejected.',
      pdaBadQ1: 'In q1 only a or the middle n may come, but {sym} came: the word is rejected.',
      pdaBadQ1End: 'The input ended before the middle n: the word is rejected.',
      pdaBadQ2: 'After the middle n only a may come, but {sym} came: the word is rejected.',
      pdaNoA: 'Read a, but no A is left on the stack (the top is $): more a after the n than before it. The word is rejected.',
      pdaLeft: 'The input is used up, but A is still on the stack: {k}. There were more a before the n than after it: the word is rejected.',
      tmSkip: 'The symbol {sym} does not start ana: q0 stays, the head moves right.',
      tmA: 'Found an a: ana may start here. To qA, the head moves right.',
      tmAgain: 'Another a: it may be a new start of ana. qA stays, the head moves right.',
      tmAN: 'An n after the a: we have an, a final a is needed. To qAN, the head moves right.',
      tmBack: 'In {from}, {sym} came and broke the pattern: back to q0, the head moves right.',
      tmAccept: 'An a after an: the substring ana is found and the machine halts in ACCEPT.',
      tmReject: 'The head is on the blank □ in {from}: the word ended without ana, the machine halts in REJECT.',
      halted: 'The machine has halted.',
      explain:
        '<p>Four machines read the same kind of input, a word of letters, one symbol at a time. The word ' +
        '<code translate="no">banana</code> is deliberately banal, so that students cannot hide in abstraction.</p>' +
        '<p><b>DFA</b>, <i>deterministic finite automaton</i>: for every state and every input symbol there is exactly one ' +
        'next step. This one accepts only the word banana; any wrong symbol leads to the <i>dead state</i>, which has no ' +
        'way out. A word is accepted if the machine is in an <i>accepting state</i>, here q6, when the input ends.</p>' +
        '<p><b>NFA</b>, <i>nondeterministic finite automaton</i>: from one state, on one symbol, it may go to several ' +
        'states. This one accepts the words that end in ana: on every a it may stay in q0 and at the same time try to ' +
        'recognise the final ana. The simulation follows the set of all active states; the word is accepted if at least ' +
        'one path is in q3 at the end.</p>' +
        '<p><b>PDA</b>, <i>pushdown automaton</i>: a finite automaton with a [[stack]]. This one accepts b aⁿ n aⁿ: before ' +
        'the middle n it pushes an A for each a, after the n it pops one A for each a. If only the bottom marker $ is ' +
        'left at the end, the word is accepted. A finite automaton cannot do this: it would have to count without a ' +
        'bound. The word banana is not of this form (b a n a n a has two n), so this PDA rejects it; it accepts bana ' +
        'and baanaa.</p>' +
        '<p><b>TM</b>, <i>Turing machine</i>: it has a <i>tape</i> and a read/write <i>head</i> that can move left and ' +
        'right. This one looks for the substring ana. It does not write on the tape and only moves right, because the ' +
        'point is to show the model (tape, head, the halting states ACCEPT and REJECT), not to make it complicated for ' +
        'no reason.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
