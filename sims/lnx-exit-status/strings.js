/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-exit-status, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions often a node: commands, operators and statuses are shown as code), an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   "condition" and "AND/OR list" are written out: not in the glossary (NOTES.md, Term pairs).
   Script text, program output and file names are data, shown with translate="no". The title comes from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Skripta, redak koji se izvršava, izlazni status i terminal',
      script: 'Skripta',
      errexit: 'set -e (izlaz pri grešci)',
      errexitHint: 'Ljuska izlazi čim naredba padne, osim u tri iznimke.',
      pipefail: 'pipefail',
      pipefailHint: 'Cjevovod vraća status posljednjeg člana koji je pao, a ne posljednjeg člana.',
      sErre: 'erre.sh',
      sErrePf: 'erre-pipefail.sh',
      sNightly: 'nightly.sh',
      sAndOr: 'and-or.sh',
      pErre: 'erre.sh: set -e i iznimke',
      pErrePf: 'erre-pipefail.sh',
      pNightly: 'Noćni posao javlja OK',
      pAndOr: '&& i || nisu if-else',
      legendOk: '0 uspjeh',
      legendFail: '≠0 neuspjeh',
      legendSkip: 'nije se izvršilo',
      legendEx: 'set -e ovdje ne gleda',
      legendChanged: 'status koji je odlučio korak',
      listing: 'Skripta {file}',
      offBySwitch: 'isključeno prekidačem',
      addedBySwitch: 'dodano prekidačem',
      nextLine: 'sljedeći',
      lineNow: 'Redak {no}',
      lineCond: 'Redak {no}: uvjet',
      lineThen: 'Redak {no}: grana then',
      noLine: 'Ništa se još nije izvršilo.',
      endLine: 'Skripta je završila.',
      skipped: 'preskočeno',
      exCond: 'uvjet',
      exNotLast: 'nije posljednji',
      exMember: 'član cjevovoda',
      exBang: 'počinje s !',
      pipeStatus: 'cjevovod',
      lookedRun: 'izvršava',
      lookedSkip: 'preskače',
      eStop: 'set -e: izlaz',
      eGo: 'set -e: dalje',
      eOff: 'bez set -e: dalje',
      eIgnored: 'set -e: uvjet se ne gleda',
      exitCmd: 'exit: kraj',
      register: '$?',
      registerLabel: 'izlazni status posljednje naredbe',
      pipestatus: 'PIPESTATUS',
      bashOnly: 'samo bash',
      switches: 'Prekidači',
      on: 'uključen',
      off: 'isključen',
      terminal: 'Terminal: standardni izlaz i standardna greška',
      toTerminal: 'terminal',
      dumpData: 'podaci, prekinuti',
      fd1: 'redak sa standardnog izlaza',
      fd2: 'redak sa standardne greške',
      callerSays: 'izlazni status',
      mailbox: 'Pošta',
      mailNone: 'nema poruka',
      files: 'Datoteke',
      mb: '{n} MB',
      gb: '{n} GB',
      newFile: 'nova',
      weekBefore: 'tjedan prije',
      notYet: 'još ne postoji',
      unknownNz: 'točan broj nije poznat',
      cStart: 'Skripta {file} je učitana; ništa se još nije izvršilo. Prekidači: set -e {e}, pipefail {pf}.',
      cCmd: 'Redak {no}: {cmd} vraća {st}.',
      cPipe: 'Redak {no}: članovi cjevovoda vraćaju {sts}; cjevovod vraća status posljednjeg člana, {st}.',
      cPipePf: 'Redak {no}: članovi cjevovoda vraćaju {sts}; s pipefail cjevovod vraća status posljednjeg člana koji je pao, {st}.',
      cPipePfNone: 'Redak {no}: članovi cjevovoda vraćaju {sts}; nijedan nije pao, pa i s pipefail cjevovod vraća 0.',
      cListHead: 'Redak {no}: {cmd} vraća {st}.',
      cMembers: 'Redak {no}: članovi cjevovoda vraćaju {sts}.',
      cOpRun: '{op} vidi {st} i izvršava naredbu {cmd}, koja vraća {st2}.',
      cOpSkip: '{op} vidi {st} i preskače naredbu {cmd}.',
      cListSt: 'Popis vraća {st}, status posljednje naredbe koja se izvršila.',
      cNotIfElse: 'Ovo nije if-else: || se izvršio iako je prva naredba uspjela, jer je pala druga.',
      cPipeHides: 'Naredba {a} vratila je {st}, ali cjevovod vraća status svoje posljednje naredbe — naredba {last} je uspjela, pa set -e ne vidi ništa.',
      cPipeHidesNoE: 'Naredba {a} vratila je {st}, ali cjevovod vraća status svoje posljednje naredbe — naredba {last} je uspjela, pa je $? = 0.',
      cStderrNote: 'Poruka na standardnoj grešci ne mijenja status.',
      cExNotLast: 'set -e ne gleda {cmd}: nije posljednja naredba popisa.',
      cStop: 'set -e: redak završava statusom {st} i nijedna iznimka ne vrijedi — ljuska izlazi odmah.',
      cPfStop: 'S pipefail cjevovod vraća status naredbe koja je doista pala ({st}); set -e zaustavlja skriptu.',
      cPfStopMail: 'S pipefail cjevovod vraća status naredbe koja je doista pala ({st}); set -e zaustavlja skriptu i poruka „OK“ se ne šalje.',
      cGoesOn: 'Bez set -e skripta ide dalje.',
      cFile: 'Datoteka {file} je zapisana: {size}.',
      cMail: 'Poslana je poruka „{subj}“. Ovaj redak ne provjerava nikakav status: poruka se šalje uvijek.',
      cCond: 'Redak {no}: uvjet if-a, {cmd}, vraća {st}.',
      cSunday: 'Danas je nedjelja (7).',
      cCondThen: 'Izvršava se grana then.',
      cCondNone: 'Nijedna grana se ne izvršava, pa if vraća 0; u PIPESTATUS ostaje {st}.',
      cExCond: 'set -e ne gleda uvjet if-a.',
      cExit: 'exit završava skriptu sa statusom {st}.',
      cEnd: 'Skripta je završila. Pozivatelj čita $? {st}: status posljednje naredbe.',
      cEndStop: 'Skripta je završila na retku {line}. Pozivatelj čita $? {st}: status naredbe na kojoj je set -e stao.',
      cEndExit: 'Skripta je završila naredbom exit. Pozivatelj čita $? {st}.',
      cEndNightly: 'Pošta kaže „OK“, a {file} ima {size} (tjedan prije {prev}): status 0 ne kaže je li izlaz dobar.',
      cEndNoMail: 'Poruka „OK“ nije poslana, a krnja datoteka {file} ({size}) ostala je na disku.',
      explain: '<p>Svaka naredba ostavlja [[exit status]]: 0 je uspjeh, sve ostalo neuspjeh (127: naredba nije pronađena, ' +
        '126: pronađena, ali nije izvršna). Ljuska ga sprema u <code>$?</code>. Poruke idu na zaseban tok, [[standard error]], a ne u status: ' +
        'poruka o grešci status ne mijenja, a status sam ništa ne ispisuje.</p>' +
        '<p><code>a &amp;&amp; b</code> izvršava <code>b</code> samo ako je <code>a</code> vratio 0, <code>a || b</code> samo ' +
        'ako nije. Operatori su jednako jaki i idu slijeva nadesno, pa <code>a &amp;&amp; b || c</code> nije if-else: ' +
        '<code>c</code> se izvršava i kad <code>a</code> uspije, a <code>b</code> padne.</p>' +
        '<p>Svaki [[pipeline]] vraća status svog <b>posljednjeg</b> člana. S <code>set -o pipefail</code> (bash) vraća status ' +
        'posljednjeg člana koji je pao, ili 0. <code>PIPESTATUS</code> (samo bash) čuva status svakog člana.</p>' +
        '<p><code>set -e</code> zaustavlja skriptu kad naredba padne, <b>osim</b>: (1) kad padne član cjevovoda s više ' +
        'članova — gleda se samo status cjevovoda; (2) u naredbama koje čine <em>condition</em> (uvjet) <code>if</code>-a, ' +
        '<code>while</code>-a i <code>until</code>-a, u cjevovodu koji počinje s <code>!</code> i u svakoj naredbi <code>&amp;&amp;</code>- ili ' +
        '<code>||</code>-popisa osim posljednje; (3) kad je složena naredba pala zbog takvog mjesta. Zato skripta s ' +
        '<code>set -e</code> i bez <code>pipefail</code> prolazi kroz cjevovod čiji je prvi član pao.</p>' +
        '<p>Izlazni status skripte je status njezine posljednje naredbe, broj iz <code>exit n</code>, ili, kad je ' +
        '<code>set -e</code> stao, status naredbe na kojoj je stao. Status 0 kaže samo da posljednja naredba nije javila ' +
        'grešku. Zato [[error handling]] u poslu bez nadzora provjerava i ono što je posao napravio, a ne samo status.</p>'
    },
    en: {
      stage: 'The script, the line being run, the exit status and the terminal',
      script: 'Script',
      errexit: 'set -e (exit on error)',
      errexitHint: 'The shell exits as soon as a command fails, with three exceptions.',
      pipefail: 'pipefail',
      pipefailHint: 'A pipeline returns the status of its last failing member, not of its last member.',
      sErre: 'erre.sh',
      sErrePf: 'erre-pipefail.sh',
      sNightly: 'nightly.sh',
      sAndOr: 'and-or.sh',
      pErre: 'erre.sh: set -e and its exceptions',
      pErrePf: 'erre-pipefail.sh',
      pNightly: 'The nightly job says OK',
      pAndOr: '&& and || are not if-else',
      legendOk: '0 success',
      legendFail: '≠0 failure',
      legendSkip: 'did not run',
      legendEx: 'set -e does not look here',
      legendChanged: 'the status that decided the step',
      listing: 'Script {file}',
      offBySwitch: 'off by the switch',
      addedBySwitch: 'added by the switch',
      nextLine: 'next',
      lineNow: 'Line {no}',
      lineCond: 'Line {no}: condition',
      lineThen: 'Line {no}: then branch',
      noLine: 'Nothing has run yet.',
      endLine: 'The script has ended.',
      skipped: 'skipped',
      exCond: 'condition',
      exNotLast: 'not the last',
      exMember: 'pipeline member',
      exBang: 'starts with !',
      pipeStatus: 'pipeline',
      lookedRun: 'runs',
      lookedSkip: 'skips',
      eStop: 'set -e: exit',
      eGo: 'set -e: go on',
      eOff: 'no set -e: go on',
      eIgnored: 'set -e: condition not checked',
      exitCmd: 'exit: the end',
      register: '$?',
      registerLabel: 'exit status of the last command',
      pipestatus: 'PIPESTATUS',
      bashOnly: 'bash only',
      switches: 'Switches',
      on: 'on',
      off: 'off',
      terminal: 'Terminal: standard output and standard error',
      toTerminal: 'terminal',
      dumpData: 'data, cut off',
      fd1: 'a line from standard output',
      fd2: 'a line from standard error',
      callerSays: 'exit status',
      mailbox: 'Mail',
      mailNone: 'no messages',
      files: 'Files',
      mb: '{n} MB',
      gb: '{n} GB',
      newFile: 'new',
      weekBefore: 'a week before',
      notYet: 'does not exist yet',
      unknownNz: 'exact number unknown',
      cStart: 'The script {file} is loaded; nothing has run yet. Switches: set -e {e}, pipefail {pf}.',
      cCmd: 'Line {no}: {cmd} returns {st}.',
      cPipe: 'Line {no}: the pipeline\'s members return {sts}; the pipeline returns its last member\'s status, {st}.',
      cPipePf: 'Line {no}: the pipeline\'s members return {sts}; with pipefail the pipeline returns its last failing member\'s status, {st}.',
      cPipePfNone: 'Line {no}: the pipeline\'s members return {sts}; none failed, so even with pipefail the pipeline returns 0.',
      cListHead: 'Line {no}: {cmd} returns {st}.',
      cMembers: 'Line {no}: the pipeline\'s members return {sts}.',
      cOpRun: '{op} sees {st} and runs {cmd}, which returns {st2}.',
      cOpSkip: '{op} sees {st} and skips {cmd}.',
      cListSt: 'The list returns {st}, the status of the last command that ran.',
      cNotIfElse: 'This is not if-else: || ran although the first command succeeded, because the second one failed.',
      cPipeHides: '{a} returned {st}, but a pipeline returns its last command\'s status — {last} succeeded, so set -e sees nothing.',
      cPipeHidesNoE: '{a} returned {st}, but a pipeline returns its last command\'s status — {last} succeeded, so $? = 0.',
      cStderrNote: 'A message on standard error does not change the status.',
      cExNotLast: 'set -e does not look at {cmd}: it is not the last command of the list.',
      cStop: 'set -e: the line ends with {st}, and none of the exceptions applies — the shell exits at once.',
      cPfStop: 'With pipefail the pipeline returns the status of the command that actually failed ({st}); set -e stops the script.',
      cPfStopMail: 'With pipefail the pipeline returns the status of the command that actually failed ({st}); set -e stops the script and the \'OK\' mail is never sent.',
      cGoesOn: 'Without set -e the script goes on.',
      cFile: 'The file {file} is written: {size}.',
      cMail: 'The message \'{subj}\' is sent. This line checks no status: the mail always goes out.',
      cCond: 'Line {no}: the if condition, {cmd}, returns {st}.',
      cSunday: 'Today is Sunday (7).',
      cCondThen: 'The then branch runs.',
      cCondNone: 'No branch runs, so the if returns 0; PIPESTATUS keeps {st}.',
      cExCond: 'set -e does not look at an if condition.',
      cExit: 'exit ends the script with status {st}.',
      cEnd: 'The script has ended. The caller reads $? {st}: the last command\'s status.',
      cEndStop: 'The script ended at line {line}. The caller reads $? {st}: the status of the command set -e stopped on.',
      cEndExit: 'The script ended with exit. The caller reads $? {st}.',
      cEndNightly: 'The mail says \'OK\', and {file} is {size} (a week before: {prev}): status 0 does not say whether the output is good.',
      cEndNoMail: 'The \'OK\' mail was not sent, and the truncated file {file} ({size}) stays on disk.',
      explain: '<p>Every command leaves an [[exit status]]: 0 is success, anything else failure (127: command not found, ' +
        '126: found but not executable). The shell keeps it in <code>$?</code>. Messages go to a separate stream, [[standard error]], ' +
        'not into the status: an error message does not change it, and a status prints nothing.</p>' +
        '<p><code>a &amp;&amp; b</code> runs <code>b</code> only if <code>a</code> returned 0, <code>a || b</code> only if it ' +
        'did not. The operators have equal precedence and go left to right, so <code>a &amp;&amp; b || c</code> is not ' +
        'if-else: <code>c</code> runs also when <code>a</code> succeeds and <code>b</code> fails.</p>' +
        '<p>A [[pipeline]] returns the status of its <b>last</b> member. With <code>set -o pipefail</code> (bash) it returns ' +
        'the status of the last member that failed, or 0. <code>PIPESTATUS</code> (bash only) keeps every member\'s status.</p>' +
        '<p><code>set -e</code> stops the script when a command fails, <b>except</b>: (1) when a member of a multi-command ' +
        'pipeline fails — only the pipeline\'s status counts; (2) in the <em>condition</em> of <code>if</code>, ' +
        '<code>while</code> and <code>until</code>, in a pipeline starting with <code>!</code>, and in every command of an ' +
        '<code>&amp;&amp;</code> or <code>||</code> list except the last; (3) when a compound command failed because of such ' +
        'a place. That is why a script with <code>set -e</code> and no <code>pipefail</code> runs on past a pipeline whose ' +
        'first member failed.</p>' +
        '<p>A script\'s exit status is its last command\'s, the number of <code>exit n</code>, or, when <code>set -e</code> ' +
        'stopped it, the status of the command it stopped on. Status 0 says only that the last command reported no error. ' +
        'That is why [[error handling]] in an unattended job checks what the job made, not only the status.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
