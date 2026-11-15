/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of regex-to-nfa, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   [[term]] a glossary term. Regexes, tokens, state numbers and sets are data, not language: the page puts them in
   translate="no" elements. Term pairs missing from the glossary are written out (NOTES.md "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Regularni izraz, NFA i DFA',
      regexLabel: 'Regularni izraz',
      regexHint: 'slova a–z, |, *, ( i ); Enter, pa → za korake',
      tokensHead: 'Postfiksni zapis',
      stackHead: 'Stog fragmenata (vrh desno)',
      stackEmpty: 'prazan',
      treeHead: 'Stablo izraza',
      nfaHead: 'NFA: Thompsonova konstrukcija',
      nfaEmpty: 'Još nema stanja: → gradi prvi fragment.',
      mergeNote: 'Nadovezivanje spaja dva stanja u jedno (kao u knjizi Aho i sur.); mnogi udžbenici umjesto toga dodaju ε-prijelaz.',
      tableHead: 'Konstrukcija podskupova',
      colDfa: 'DFA',
      colSet: 'skup stanja NFA',
      tableEmpty: 'Tablica se puni kad je NFA gotov.',
      dfaHead: 'DFA',
      dfaEmpty: 'Još nema stanja.',
      deadHidden: 'Prazan skup (mrtvo stanje ∅) se ne crta.',
      unmarkedNote: 'Redak s praznim ćelijama još nije označen; svaki korak obrađuje prvi takav.',
      showDead: 'Prikaži mrtvo stanje ∅',
      showDeadHint: 'Prazan skup kao stanje DFA, s petljom na svakom slovu.',

      preset_abb: 'Primjer iz knjige',
      hint_abb: 'Aho i sur., primjer 3.21: 11 stanja NFA, 5 stanja DFA',
      preset_aorb: 'Unija',
      hint_aorb: 'Dva prihvatljiva stanja DFA, prazni skupovi',
      preset_astar: 'Zvjezdica',
      hint_astar: 'Prazna riječ je prihvaćena',
      preset_ana: 'Završava s ana',
      hint_ana: 'Jezik NFA sa stranice o automatima',

      legState: 'stanje',
      legAccept: 'prihvatljivo stanje',
      legStart: 'početno stanje',
      legEps: 'ε-prijelaz',
      legSym: 'prijelaz na slovo',
      legSet: 'skup koji se obrađuje',
      legChanged: 'novo u ovom koraku',

      errTitle: 'Odbijeno',
      err_empty: 'upiši regularni izraz.',
      err_length: ['najviše {n} znak.', 'najviše {n} znaka.', 'najviše {n} znakova.'],
      err_char: 'znak „{ch}” nije dopušten: samo slova a–z, |, *, ( i ).',
      err_operand: 'na mjestu {pos} nedostaje operand: |, * i zagrade trebaju izraz.',
      err_open: 'zagrada ( nije zatvorena.',
      err_close: 'zagrada ) na mjestu {pos} nema para.',
      err_symbols: '{n} različitih slova, a u tablicu stanu najviše {max}.',
      err_steps: 'to je {steps}, a jedan prikaz ima najviše {max}.',
      stepsN: ['{n} korak', '{n} koraka', '{n} koraka'],
      statesN: ['{n} stanje', '{n} stanja', '{n} stanja'],
      and: 'i',

      capStart: '[[regular expression]] {re} u postfiksnom zapisu: {post}. Svaki korak obrađuje jedan znak slijeva; na stogu su dosad izgrađeni fragmenti.',
      capSym: 'Znak {tok}: novi fragment s dva stanja, {edge}, ide na stog.',
      capStartMerge: 'Početno stanje {p} je zasad zasebno; pri nadovezivanju spojit će se sa stanjem {into}.',
      capOr: 'Znak {tok}: skidamo fragmente za {s} i {t} i dodajemo nova stanja {i} i {f} s četiri ε-prijelaza: iz {i} može se ući u bilo koju granu.',
      capStar: 'Znak {tok}: oko fragmenta za {s} dodajemo nova stanja {i} i {f} i četiri ε-prijelaza. Fragment se sada može preskočiti ili ponoviti.',
      capCat: 'Znak {tok}: nadovezujemo {s} i {t}. Prihvatljivo stanje {into} i početno stanje {gone} postaju jedno stanje, {into}: nema novog stanja ni ε-prijelaza.',
      capCatAlt: '(Mnogi udžbenici ih umjesto toga povezuju ε-prijelazom.)',
      capNfaDone: 'NFA je gotov: {n}, početno {start}, prihvatljivo {accept}.',
      capFirst: 'Početak: A = ε-zatvaranje({start}) = {set}.',
      capRow: 'Redak {name}:',
      capMove: '{move}, ε-zatvaranje = {to}',
      capMoveNew: '{move}, ε-zatvaranje = {to}, novo stanje',
      capMoveEmpty: '{move}, nema prijelaza',
      capDone: 'Gotovo: DFA ima {n}, a ne {all}: grade se samo dohvatljivi podskupovi.',
      capSame: '{names} imaju jednake retke: ekvivalentna su, pa ovaj DFA nije minimalan.',

      explain: '<p>[[regular expression]] opisuje jezik. <b>Thompsonova konstrukcija</b> gradi iz njega <i lang="en">nondeterministic ' +
        'finite automaton</i> (nedeterministički konačni automat, NFA), znak po znak u postfiksnom zapisu: slovo daje dva ' +
        'stanja i prijelaz; unija i zvjezdica dodaju po dva nova stanja i četiri ε-prijelaza; nadovezivanje spaja ' +
        'prihvatljivo stanje lijevog fragmenta s početnim stanjem desnog. Brojevi stanja su oni iz knjige.</p>' +
        '<p><b>Konstrukcija podskupova</b> (<i lang="en">subset construction</i>) gradi <i lang="en">deterministic finite automaton</i> ' +
        '(deterministički konačni automat, DFA): svako njegovo stanje je skup stanja NFA. Počinje od <i lang="en">ε-closure</i> ' +
        '(ε-zatvaranje) početnog stanja. Za prvo neoznačeno stanje i svako slovo abecednim redom računa skup move ' +
        '(kamo vode prijelazi na to slovo) i njegovo ε-zatvaranje. Novi skup postaje novo stanje; prazan skup nema ' +
        'prijelaza. <i lang="en">Accepting state</i> (prihvatljivo stanje) DFA je svako stanje koje sadrži ' +
        'prihvatljivo stanje NFA.</p>' +
        '<p><b>Česte zablude.</b> DFA nema 2ⁿ stanja: grade se samo dohvatljivi podskupovi (za (a|b)*abb 5, a ne 2048). ' +
        'Konstrukcija ne daje minimalni DFA: u primjeru iz knjige A i C imaju isti redak. Regularni izrazi u alatima za ' +
        'pretraživanje teksta nisu uvijek ovo: povratne reference (\\1) ne može prepoznati nijedan konačni automat; ' +
        'pogađanje s vraćanjem unatrag pokazuje stranica „Kako regularni izraz pogađa”.</p>'
    },
    en: {
      stage: 'Regular expression, NFA and DFA',
      regexLabel: 'Regular expression',
      regexHint: 'letters a–z, |, *, ( and ); Enter, then → to step',
      tokensHead: 'Postfix order',
      stackHead: 'Stack of fragments (top on the right)',
      stackEmpty: 'empty',
      treeHead: 'Parse tree',
      nfaHead: 'NFA: Thompson construction',
      nfaEmpty: 'No states yet: → builds the first fragment.',
      mergeNote: 'Concatenation merges two states into one (as in Aho et al.); many texts add an ε-edge instead.',
      tableHead: 'Subset construction',
      colDfa: 'DFA',
      colSet: 'set of NFA states',
      tableEmpty: 'The table fills once the NFA is complete.',
      dfaHead: 'DFA',
      dfaEmpty: 'No states yet.',
      deadHidden: 'The empty set (dead state ∅) is not drawn.',
      unmarkedNote: 'A row with blank cells is still unmarked; each step processes the first one.',
      showDead: 'Show the dead state ∅',
      showDeadHint: 'The empty set as a DFA state, with a loop on every letter.',

      preset_abb: 'The book\'s example',
      hint_abb: 'Aho et al., Example 3.21: 11 NFA states, 5 DFA states',
      preset_aorb: 'Union',
      hint_aorb: 'Two accepting DFA states, empty sets',
      preset_astar: 'Star',
      hint_astar: 'The empty word is accepted',
      preset_ana: 'Ends with ana',
      hint_ana: 'The language of the NFA on the automata page',

      legState: 'state',
      legAccept: 'accepting state',
      legStart: 'start state',
      legEps: 'ε-edge',
      legSym: 'edge on a letter',
      legSet: 'set being processed',
      legChanged: 'new in this step',

      errTitle: 'Rejected',
      err_empty: 'type a regular expression.',
      err_length: ['at most {n} character.', 'at most {n} characters.'],
      err_char: 'the character "{ch}" is not allowed: only letters a–z, |, *, ( and ).',
      err_operand: 'an operand is missing at position {pos}: |, * and parentheses need a regex.',
      err_open: 'a ( is never closed.',
      err_close: 'the ) at position {pos} has no match.',
      err_symbols: '{n} different letters, but at most {max} fit the table.',
      err_steps: 'that is {steps}, and one demo has at most {max}.',
      stepsN: ['{n} step', '{n} steps'],
      statesN: ['{n} state', '{n} states'],
      and: 'and',

      capStart: 'The [[regular expression]] {re} in postfix order: {post}. Each step processes one token from the left; the stack holds the fragments built so far.',
      capSym: 'Token {tok}: a new fragment with two states, {edge}, goes on the stack.',
      capStartMerge: 'The start state {p} stands alone for now; at the concatenation it merges with state {into}.',
      capOr: 'Token {tok}: we pop the fragments for {s} and {t} and add new states {i} and {f} with four ε-edges: from {i} either branch can be taken.',
      capStar: 'Token {tok}: around the {s} fragment we add new states {i} and {f} and four ε-edges. The fragment can now be skipped or repeated.',
      capCat: 'Token {tok}: we concatenate {s} and {t}. The accepting state {into} and the start state {gone} become one state, {into}: no new state and no ε-edge.',
      capCatAlt: '(Many texts link them with an ε-edge instead.)',
      capNfaDone: 'The NFA is complete: {n}, start {start}, accepting {accept}.',
      capFirst: 'Start: A = ε-closure({start}) = {set}.',
      capRow: 'Row {name}:',
      capMove: '{move}, ε-closure = {to}',
      capMoveNew: '{move}, ε-closure = {to}, a new state',
      capMoveEmpty: '{move}, no transition',
      capDone: 'Done: the DFA has {n}, not {all}: only reachable subsets are built.',
      capSame: '{names} have the same row: they are equivalent, so this DFA is not minimal.',

      explain: '<p>A [[regular expression]] describes a language. <b>Thompson construction</b> builds a nondeterministic ' +
        'finite automaton (NFA) from it, one token at a time in postfix order: a letter gives two states and an edge; ' +
        'union and star add two new states and four ε-edges each; concatenation merges the accepting state of the left ' +
        'fragment with the start state of the right one. The state numbers are the book\'s.</p>' +
        '<p><b>Subset construction</b> builds a deterministic finite automaton (DFA): each of its states is a set of NFA ' +
        'states. It starts from the ε-closure of the start state; for the first unmarked state and each letter in ' +
        'alphabetical order it computes move and then the ε-closure. A new set becomes a new state; an empty set gives ' +
        'no transition. A state is an accepting state if it contains the NFA\'s accepting state.</p>' +
        '<p><b>Common mistakes.</b> The DFA does not have 2ⁿ states: only reachable subsets are built (for (a|b)*abb 5, ' +
        'not 2048). The construction does not give the minimal DFA: in the book\'s example A and C have the same row. ' +
        'Regular expressions in text search tools are not always this: no finite automaton can match back-references ' +
        '(\\1); the page "How a regex matches" shows matching with backtracking.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
