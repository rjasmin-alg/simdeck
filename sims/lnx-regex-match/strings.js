/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-regex-match, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder (in captions a
   pattern token, a character or a span is filled in as code), an array is plural forms (hr: 1 / 2–4 / 5+,
   en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms missing from the glossary (NOTES.md, "Term pairs") are written out: on the Croatian page the English term in
   italics with the Croatian in parentheses at its first mention in the explanation.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Uzorak, redak i matcher',
      patternLabel: 'Uzorak',
      textLabel: 'Redak',
      inputHint: 'Upiši uzorak i redak: hod kreće ispočetka.',
      tokensTitle: 'Uzorak, token po token',
      textTitle: 'Redak, znak po znak',
      noTokens: 'prazan uzorak',
      k_char: 'znak',
      k_lit: 'ovdje običan',
      k_any: 'bilo koji',
      k_set: 'skup',
      k_bol: 'početak',
      k_eol: 'kraj',
      k_open: 'grupa',
      k_close: 'grupa',
      k_alt: 'ili',
      startMark: 'početak',
      posMark: 'položaj',
      endCell: 'kraj',
      stackTitle: 'Točke izbora (najnovija gore)',
      stackEmpty: 'nijedna',
      stackOlder: ['još {n} starija', 'još {n} starije', 'još {n} starijih'],
      cpMore: 'može stati na {n}',
      cpAlt: 'sljedeće: {next}',
      cpFrom: 'od {pos}',
      cpTaken: 'uzeta',
      startLabel: 'Početak',
      posLabel: 'Položaj',
      triesLabel: 'Pokušaji',
      formLabel: 'Oblik',
      resultTitle: 'Rezultat',
      rowBt: 'S vraćanjem unatrag (grep -P)',
      rowPosix: 'POSIX, najlijeviji najdulji (grep, grep -E)',
      thisForm: 'ovaj oblik',
      resWait: 'još traje',
      resNone: 'nema pogotka',
      resLimit: 'odustao',
      resError: 'pogreška u uzorku',
      resNotCovered: 'ovdje nije obuhvaćen',
      notCoveredTitle: 'Uzorak ovdje nije obuhvaćen',
      exitLimit: 'pogreška (2), osim ako prečac ne odgovori prije',
      resSpan: '{span} na {from}–{to}',
      emptySpan: 'prazan niz',
      exitLabel: 'Izlazni status ({tool})',
      errTitle: 'Uzorak nije valjan',
      model: 'Hod je model matchera s vraćanjem unatrag (grep -P). grep i grep -E dolaze do POSIX rezultata bez vraćanja.',

      mode: 'Oblik',
      modeHint: 'grep čita osnovni oblik, grep -E prošireni, grep -P Perl-kompatibilni.',
      optBRE: 'BRE',
      optERE: 'ERE',
      optPCRE: 'PCRE',
      form_BRE: 'osnovni oblik (BRE)',
      form_ERE: 'prošireni oblik (ERE)',
      form_PCRE: 'Perl-kompatibilni oblik (PCRE)',
      tool_BRE: 'grep',
      tool_ERE: 'grep -E',
      tool_PCRE: 'grep -P',

      pRoT: 'ro+t iz knjige',
      pRoTHint: 'Prebaci na BRE: + postaje obično slovo.',
      pRootBin: '^(root|bin)',
      pRootBinHint: 'Sidro, alternacija, jedan povratak',
      pGreedy: 'Pohlepni .*',
      pGreedyHint: '.* uzme sve, pa vraća znak po znak',
      pLongest: 'a|ab: prvi ili najdulji',
      pLongestHint: 'Vraćanje unatrag kaže a, POSIX kaže ab',
      pAnchor: 'Sidro t$',
      pAnchorHint: 'Svaki početak se isproba',
      pExplosion: '(a+)+b: eksplozija',
      pExplosionHint: 'Stotine pokušaja za šest znakova',

      legTry: 'token koji se isprobava',
      legEaten: 'pojeden znak',
      legCp: 'točka izbora',
      legBack: 'vraćanje unatrag',
      legAnchor: 'provjera sidra',
      legMatch: 'pogodak',
      legNone: 'nema pogotka',
      legChanged: 'promijenjeno u ovom koraku',

      cError: 'Ovaj uzorak nije valjan u ovom obliku: {why} (znak {at}). {tool} staje s pogreškom, izlazni status 2.',
      cNotCovered: 'Ovu stranicu ovaj uzorak ne obuhvaća: {why} (znak {at}). {tool} bi ga prihvatio.',
      err_unsupported_class: '[. .] i [= =] ovdje nisu obuhvaćeni',
      err_too_long: 'uzorak je dulji od 24 znaka',
      err_unclosed_set: 'uglata zagrada [ nije zatvorena',
      err_unknown_class: 'nepoznat razred znakova u [: :]',
      err_bad_range: 'raspon u [ ] ide unatrag',
      err_trailing_backslash: '\\ na kraju nema što zaštititi',
      err_bre_operator: 'operatori \\( \\) \\{ \\} \\| \\+ \\? osnovnog oblika ovdje nisu obuhvaćeni',
      err_unsupported_escape: 'ovdje se \\ piše samo ispred posebnog znaka',
      err_double_quantifier: 'dva kvantifikatora zaredom',
      err_nothing_to_repeat: 'kvantifikator nema što ponavljati',
      err_empty_alt: 'jedna strana od | je prazna',
      err_empty_group: 'prazna grupa ()',
      err_unsupported_brace: '{ } (broj ponavljanja) ovdje nije obuhvaćen',
      err_unclosed_group: 'zagrada ( nije zatvorena',
      err_unmatched_close: 'zagrada ) nema svoju (',

      cStart: 'Početak na položaju 0. Uzorak se čita kao {mode}; matcher stavlja prvi token uz znak na položaju 0. Pritisni → za prvi korak.',
      cStartEmpty: 'Uzorak je prazan: pogađa prazan niz već na položaju 0.',
      cTestOk: '{tok} pogađa {ch} na položaju {pos}: matcher ide dalje.',
      cRepOk: '{tok} pogađa {ch} na položaju {pos}: to je jedno ponavljanje bez kojega + ne može.',
      cTestNo: '{tok} ne pogađa {ch} na položaju {pos}: neuspjeh.',
      cTestEnd: '{tok} treba još jedan znak, a redak završava na položaju {pos}: neuspjeh.',
      c_bol_ok: 'Sidro ^ vrijedi: položaj 0 je početak retka.',
      c_bol_no: 'Sidro ^ ne vrijedi: položaj {pos} nije početak retka.',
      c_eol_ok: 'Sidro $ vrijedi: položaj {pos} je kraj retka.',
      c_eol_no: 'Sidro $ ne vrijedi: položaj {pos} nije kraj retka.',
      cMoreOk: '{q} je pohlepan i uzima još jedan: {ch} na položaju {pos} (sada {n}). Točka izbora pamti da je mogao stati na {keep}.',
      cMoreNo: '{q} pokušava još jedan, ali {ch} na položaju {pos} ne odgovara: staje na {n} i matcher ide dalje.',
      cMoreEnd: '{q} pokušava još jedan, ali redak je završio: staje na {n} i matcher ide dalje.',
      cMoreEnter: '{q} pokušava još jedno ponavljanje grupe (sada {n}) od položaja {pos}. Točka izbora pamti da je mogao stati na {keep}.',
      cAlt: 'Alternacija: matcher prvo pokušava {alt}, od položaja {pos}. Točka izbora čuva {next} za poslije.',
      cBackAlt: 'Natrag na najnoviju točku izbora: lijeva mogućnost nije uspjela, pa matcher pokušava {alt} od položaja {pos}.',
      cBackAltNext: 'Natrag na najnoviju točku izbora: ni prethodna mogućnost nije uspjela, pa matcher pokušava {alt} od položaja {pos}.',
      cBackMore: 'Natrag na najnoviju točku izbora: {q} vraća jedan znak (sada {n}) i matcher nastavlja od položaja {pos}.',
      cBackGroup: 'Natrag na najnoviju točku izbora: {q} staje nakon {n}. ponavljanja i matcher nastavlja od položaja {pos}.',
      cBackGroupNone: 'Natrag na najnoviju točku izbora: {q} ne uzima nijedno ponavljanje i matcher nastavlja od položaja {pos}.',
      cBackMoreEnd: '{q} je uzeo sve do kraja retka, pa za {next} nema više znakova. Matcher se vraća na posljednju točku izbora i {q} vraća jedan znak.',
      cRestart: 'Nijedna točka izbora nije ostala, pa od položaja {from} nema pogotka. Matcher pomiče početak na {to} i kreće s uzorkom ispočetka.',
      cMatch: 'Kraj uzorka je dosegnut: pogodak je {span}, od položaja {from} do {to}.',
      cNoMatch: 'Nema više ni točke izbora ni početnog položaja: nema pogotka.',
      cLimit: 'Matcher odustaje nakon {tries} pokušaja: previše je načina da se redak razdijeli. grep -P tako staje s pogreškom (izlazni status 2), osim ako mu prečac ne uštedi hod.',
      xJumped: ['Preskočen je {n} korak; ukupno {tries} pokušaja.', 'Preskočena su {n} koraka; ukupno {tries} pokušaja.', 'Preskočeno je {n} koraka; ukupno {tries} pokušaja.'],
      xLeftover: ['Matcher staje na prvom pogotku: {n} točka izbora ostaje neisprobana.', 'Matcher staje na prvom pogotku: {n} točke izbora ostaju neisprobane.', 'Matcher staje na prvom pogotku: {n} točaka izbora ostaje neisprobano.'],
      xPosixLonger: 'POSIX (grep, grep -E) umjesto toga javlja najdulji pogodak od istog početka: {span}.',
      xLimitPosixNone: 'POSIX matcher, koji se ne vraća unatrag, odmah kaže: nema pogotka.',
      xLimitPosixSpan: 'POSIX matcher, koji se ne vraća unatrag, nalazi {span}.',
      xExit: 'Izlazni status za {tool}: {exit}.',

      explain:
        '<p>[[regular expression]] je uzorak: obično slovo pogađa samo sebe, a mali broj posebnih znakova opisuje pravilo. ' +
        'Koji su znakovi posebni, ovisi o obliku. [[basic regular expression]] (<code translate="no">grep</code>) ' +
        '<code translate="no">+ ? | ( )</code> čita kao obične znakove, [[extended regular expression]] ' +
        '(<code translate="no">grep -E</code>) kao operatore. Zato <code translate="no">ro+t</code> bez <code translate="no">-E</code> ' +
        'ne pogađa ništa: uzorak bez oblika nije potpun.</p>' +
        '<p>Matcher s <em>backtracking</em> (vraćanje unatrag) isprobava početke 0, 1, 2… i od svakog ide token po token. ' +
        '<em>Greedy quantifier</em> (pohlepni kvantifikator) <code translate="no">* + ?</code> uzme što više može, a svako „koliko” ' +
        'ostavlja točku izbora; <em>alternation</em> (alternacija) prvo pokušava lijevu stranu. Kad nešto ne uspije, matcher se ' +
        'vraća na najnoviju točku izbora; kad ih više nema, pomiče početak. <em>Anchor</em> (sidro) <code translate="no">^</code> ' +
        'vrijedi samo na početku retka, <code translate="no">$</code> samo na kraju.</p>' +
        '<p>Najlijeviji početak pobjeđuje u oba modela. Ali od tog početka matcher s vraćanjem (<code translate="no">grep -P</code>) ' +
        'javlja prvi pogodak koji nađe, a POSIX (<code translate="no">grep</code>, <code translate="no">grep -E</code>) najdulji: ' +
        '<code translate="no">a|ab</code> na <code translate="no">ab</code> daje <code translate="no">a</code>, odnosno ' +
        '<code translate="no">ab</code>. [[exit status]] je isti: 0 kad pogodak postoji, 1 kad ne postoji.</p>' +
        '<p>Ova stranica prikazuje hod s vraćanjem unatrag. <code translate="no">grep</code> i <code translate="no">grep -E</code> ' +
        'ne hodaju ovako: izvode automat i ne vraćaju se, pa im <code translate="no">(a+)+b</code> na šest slova ' +
        '<code translate="no">a</code> ne treba stotine pokušaja.</p>'
    },

    en: {
      stage: 'Pattern, line and matcher',
      patternLabel: 'Pattern',
      textLabel: 'Line',
      inputHint: 'Type a pattern and a line: the walk starts again.',
      tokensTitle: 'The pattern, token by token',
      textTitle: 'The line, character by character',
      noTokens: 'empty pattern',
      k_char: 'char',
      k_lit: 'ordinary here',
      k_any: 'any',
      k_set: 'set',
      k_bol: 'start',
      k_eol: 'end',
      k_open: 'group',
      k_close: 'group',
      k_alt: 'or',
      startMark: 'start',
      posMark: 'position',
      endCell: 'end',
      stackTitle: 'Choice points (newest on top)',
      stackEmpty: 'none',
      stackOlder: ['{n} older one', '{n} older ones'],
      cpMore: 'could stop at {n}',
      cpAlt: 'next: {next}',
      cpFrom: 'from {pos}',
      cpTaken: 'taken',
      startLabel: 'Start',
      posLabel: 'Position',
      triesLabel: 'Tries',
      formLabel: 'Form',
      resultTitle: 'Result',
      rowBt: 'Backtracking (grep -P)',
      rowPosix: 'POSIX, leftmost-longest (grep, grep -E)',
      thisForm: 'this form',
      resWait: 'still running',
      resNone: 'no match',
      resLimit: 'gave up',
      resError: 'pattern error',
      resNotCovered: 'not covered here',
      notCoveredTitle: 'Pattern not covered here',
      exitLimit: 'an error (2), unless a shortcut answers first',
      resSpan: '{span} at {from}–{to}',
      emptySpan: 'empty string',
      exitLabel: 'Exit status ({tool})',
      errTitle: 'The pattern is not valid',
      model: 'The walk is the model of a backtracking matcher (grep -P). grep and grep -E reach the POSIX result without going back.',

      mode: 'Form',
      modeHint: 'grep reads the basic form, grep -E the extended one, grep -P the Perl-compatible one.',
      optBRE: 'BRE',
      optERE: 'ERE',
      optPCRE: 'PCRE',
      form_BRE: 'a basic expression (BRE)',
      form_ERE: 'an extended expression (ERE)',
      form_PCRE: 'a Perl-compatible expression (PCRE)',
      tool_BRE: 'grep',
      tool_ERE: 'grep -E',
      tool_PCRE: 'grep -P',

      pRoT: 'ro+t from the book',
      pRoTHint: 'Switch to BRE: + becomes an ordinary character.',
      pRootBin: '^(root|bin)',
      pRootBinHint: 'An anchor, an alternation, one step back',
      pGreedy: 'Greedy .*',
      pGreedyHint: '.* takes everything, then gives back one at a time',
      pLongest: 'a|ab: first or longest',
      pLongestHint: 'Backtracking says a, POSIX says ab',
      pAnchor: 'Anchor t$',
      pAnchorHint: 'Every start is tried',
      pExplosion: '(a+)+b: explosion',
      pExplosionHint: 'Hundreds of tries for six characters',

      legTry: 'token being tried',
      legEaten: 'character consumed',
      legCp: 'choice point',
      legBack: 'backtrack',
      legAnchor: 'anchor test',
      legMatch: 'match',
      legNone: 'no match',
      legChanged: 'changed in this step',

      cError: 'This pattern is not valid in this form: {why} (character {at}). {tool} stops with an error, exit status 2.',
      cNotCovered: 'This page does not cover this pattern: {why} (character {at}). {tool} would accept it.',
      err_unsupported_class: '[. .] and [= =] are not covered here',
      err_too_long: 'the pattern is longer than 24 characters',
      err_unclosed_set: 'the bracket [ is not closed',
      err_unknown_class: 'unknown character class in [: :]',
      err_bad_range: 'a range in [ ] runs backwards',
      err_trailing_backslash: 'a \\ at the end has nothing to protect',
      err_bre_operator: 'the basic form\'s operators \\( \\) \\{ \\} \\| \\+ \\? are not covered here',
      err_unsupported_escape: 'here \\ goes only before a special character',
      err_double_quantifier: 'two quantifiers in a row',
      err_nothing_to_repeat: 'the quantifier has nothing to repeat',
      err_empty_alt: 'one side of | is empty',
      err_empty_group: 'an empty group ()',
      err_unsupported_brace: '{ } (a repetition count) is not covered here',
      err_unclosed_group: 'the bracket ( is not closed',
      err_unmatched_close: 'the bracket ) has no (',

      cStart: 'Start at position 0. The pattern is read as {mode}; the matcher puts its first token against the character at 0. Press → for the first step.',
      cStartEmpty: 'The pattern is empty: it matches the empty string right at position 0.',
      cTestOk: '{tok} matches {ch} at position {pos}: the matcher moves on.',
      cRepOk: '{tok} matches {ch} at position {pos}: the one repetition that + cannot do without.',
      cTestNo: '{tok} does not match {ch} at position {pos}: a failure.',
      cTestEnd: '{tok} needs one more character, but the line ends at position {pos}: a failure.',
      c_bol_ok: 'Anchor ^ holds: position 0 is the start of the line.',
      c_bol_no: 'Anchor ^ fails: position {pos} is not the start of the line.',
      c_eol_ok: 'Anchor $ holds: position {pos} is the end of the line.',
      c_eol_no: 'Anchor $ fails: position {pos} is not the end of the line.',
      cMoreOk: '{q} is greedy and takes one more: {ch} at position {pos} ({n} now). A choice point remembers that it could stop at {keep}.',
      cMoreNo: '{q} tries one more, but {ch} at position {pos} does not fit: it stops at {n} and the matcher moves on.',
      cMoreEnd: '{q} tries one more, but the line has ended: it stops at {n} and the matcher moves on.',
      cMoreEnter: '{q} tries one more repetition of the group ({n} now) from position {pos}. A choice point remembers that it could stop at {keep}.',
      cAlt: 'Alternation: the matcher tries {alt} first, from position {pos}. A choice point keeps {next} for later.',
      cBackAlt: 'Back to the newest choice point: the left side failed, so the matcher tries {alt} from position {pos}.',
      cBackAltNext: 'Back to the newest choice point: the previous side failed too, so the matcher tries {alt} from position {pos}.',
      cBackMore: 'Back to the newest choice point: {q} gives back one character ({n} now) and the matcher goes on from position {pos}.',
      cBackGroup: 'Back to the newest choice point: {q} stops after repetition {n} and the matcher goes on from position {pos}.',
      cBackGroupNone: 'Back to the newest choice point: {q} takes no repetition at all and the matcher goes on from position {pos}.',
      cBackMoreEnd: '{q} took everything to the end of the line, so nothing is left for {next}. The matcher goes back to the last choice point and {q} gives back one character.',
      cRestart: 'No choice point is left, so no match starts at {from}. The matcher moves the start to {to} and begins the pattern again.',
      cMatch: 'The end of the pattern is reached: the match is {span}, from position {from} to {to}.',
      cNoMatch: 'No choice point and no start position is left: no match.',
      cLimit: 'The matcher gives up after {tries} tries: there are too many ways to split the line. grep -P stops like this with an error (exit status 2), unless a shortcut spares it the walk.',
      xJumped: ['{n} step was skipped; {tries} tries in all.', '{n} steps were skipped; {tries} tries in all.'],
      xLeftover: ['The matcher stops at the first match: {n} choice point is never tried.', 'The matcher stops at the first match: {n} choice points are never tried.'],
      xPosixLonger: 'POSIX (grep, grep -E) reports the longest match from the same start instead: {span}.',
      xLimitPosixNone: 'The POSIX matcher, which does not go back, says at once: no match.',
      xLimitPosixSpan: 'The POSIX matcher, which does not go back, finds {span}.',
      xExit: 'Exit status of {tool}: {exit}.',

      explain:
        '<p>A [[regular expression]] is a pattern: an ordinary character matches only itself, and a few special characters ' +
        'describe a rule. Which characters are special depends on the form. A [[basic regular expression]] ' +
        '(<code translate="no">grep</code>) reads <code translate="no">+ ? | ( )</code> as ordinary characters, an ' +
        '[[extended regular expression]] (<code translate="no">grep -E</code>) as operators. So <code translate="no">ro+t</code> ' +
        'without <code translate="no">-E</code> finds nothing: a pattern without its form is not complete.</p>' +
        '<p>A <em>backtracking</em> matcher tries the starts 0, 1, 2… and from each one walks token by token. A ' +
        '<em>greedy quantifier</em> <code translate="no">* + ?</code> takes as many as it can, and every “how many” leaves a ' +
        'choice point; an <em>alternation</em> tries its left side first. When something fails, the matcher goes back to the ' +
        'newest choice point; when none is left, it moves the start. An <em>anchor</em> <code translate="no">^</code> holds only ' +
        'at the start of the line, <code translate="no">$</code> only at its end.</p>' +
        '<p>The leftmost start wins in both models. But from that start the backtracking matcher (<code translate="no">grep -P</code>) ' +
        'reports the first match it finds, and POSIX (<code translate="no">grep</code>, <code translate="no">grep -E</code>) the ' +
        'longest: <code translate="no">a|ab</code> on <code translate="no">ab</code> gives <code translate="no">a</code> and ' +
        '<code translate="no">ab</code>. The [[exit status]] is the same: 0 when there is a match, 1 when there is none.</p>' +
        '<p>This page shows the backtracking walk. <code translate="no">grep</code> and <code translate="no">grep -E</code> do not ' +
        'walk like this: they run an automaton and never go back, so <code translate="no">(a+)+b</code> on six ' +
        '<code translate="no">a</code>s does not cost them hundreds of tries.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
