/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-subshell-trap, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, [[term]] a glossary
   term (first mention; [[=term]] later ones). The title and subtitle come from sim.json (title, concept).
   Script text and program output (echo lines, paths, `ls` messages) are data, not language: the page shows them with
   translate="no", as the book prints them. Croatian terms from UL ch17. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Skripta, izvršna okruženja i terminal',
      script: 'Skripta',
      showCopy: 'Prikaži kopirane vrijednosti',
      showCopyHint: 'Podljuska kreće kao kopija. Isključeno: u njezinu okviru samo ono što se u njoj promijenilo.',
      pCiscenje: 'ciscenje.sh: čišćenje na izlazu',
      pCiscenje2: 'ciscenje2.sh: exit u podljusci',
      pCd: 'cd u podljusci i u { …; }',
      pPipe: 'Varijabla izgubljena u cjevovodu',
      pTrapSub: 'Hvatanje unutar podljuske',

      listing: 'Skripta {file}',
      envs: 'Izvršna okruženja',
      terminal: 'Terminal',
      callerSays: 'izlazni status',
      lineNow: 'redak {no}, naredba u ovom koraku',
      boxMain: 'glavna skripta',
      boxParen: 'podljuska ( … )',
      boxCmdsub: 'podljuska $( … )',
      boxPipe: 'podljuska: {k}. član cjevovoda',
      copyTag: 'kopija',
      cwd: 'radni direktorij',
      vars: 'varijable',
      varsNone: 'nema',
      trapExit: 'hvatanje EXIT',
      trapNone: 'zadano: ništa',
      trapReset: 'zadano: vraćeno pri ulasku',
      lastStatus: 'posljednji status',
      restCopied: 'ostalo: kopija roditelja',
      doorEnded: 'završila, status {st}',
      doorMainEnded: 'izlazni status {st}',
      doorExiting: 'izlazi sa {st}, hvatanje čeka',
      pipeLabel: 'cijev',
      pipeEmpty: 'prazna',
      tmpdir: 'Privremeni direktorij',
      tmpExists: 'postoji',
      tmpRemoved: 'obrisan',
      tmpNotYet: 'još ne postoji',
      outMain: 'ispisala glavna skripta',
      outSub: 'ispisala podljuska',
      outTrap: 'ispisalo hvatanje',

      legendMain: 'glavno okruženje',
      legendSub: 'podljuska: kopija',
      legendChanged: 'promijenjeno u ovom koraku',
      legendTrap: 'hvatanje postavljeno',
      legendReset: 'hvatanje vraćeno na zadano',
      legendExit: 'izlaz sa statusom',

      cStart: 'Skripta {file} još nije pokrenuta. Glavna skripta ima svoje izvršno okruženje: radni direktorij {cwd}, bez varijabli, bez hvatanja, $? = 0.',
      cAssignSub: '{cmd} radi u podljusci: kopija se pojavi, ispiše {val} i završi, a njezin ispis postaje vrijednost varijable {name} u glavnoj skripti.',
      cAssign: 'Varijabla {name} dobiva vrijednost {val} u glavnoj skripti.',
      cAssignInSub: 'Varijabla {name} dobiva vrijednost {val}, ali u kopiji.',
      cCdMain: 'Naredba {cmd} mijenja radni direktorij glavne skripte.',
      cCdSub: 'Naredba {cmd} mijenja radni direktorij kopije; glavna skripta i dalje je u {parent}.',
      cCdGroup: 'Vitičaste zagrade ne stvaraju podljusku: {cmd} radi u glavnoj skripti, i ta promjena ostaje.',
      cPwd: 'Naredba pwd ispisuje radni direktorij okruženja u kojem radi: {cwd}.',
      cPwdBack: 'Podljuska je nestala, a s njom i njezin cd: glavna skripta je i dalje u {cwd}.',
      cEcho: 'Naredba echo ispisuje: {text}.',
      cEchoSub: 'Naredba echo radi u podljusci; ispisuje: {text}.',
      cEnteredReset: 'Podljuska kreće kao kopija glavne skripte, ali njezino hvatanje EXIT vraćeno je na zadano: hvatanje glavne skripte ovdje ne vrijedi.',
      cEchoStatus: 'Status kojim je podljuska završila ({st}) stigao je u glavnu skriptu kao obična vrijednost $?.',
      cEchoLost: 'U glavnoj skripti {name} je i dalje {val}: brojio je član cjevovoda, u svojoj kopiji, a ta je kopija nestala.',
      cLs: 'Naredba ls -d pokazuje da direktorij {dir} postoji.',
      cLsMissing: 'Direktorij {dir} ne postoji; ls vraća {st}.',
      cTrapSet: 'Naredba trap postavlja hvatanje EXIT u glavnoj skripti: radnja {act} izvršit će se kad glavna skripta izađe, i onda kad izađe naredbom exit prije kraja koda.',
      cTrapSetSub: 'Naredba trap postavlja hvatanje EXIT u podljusci: ono pripada njoj i izvršit će se kad ona izađe.',
      cTrapPrint: 'Naredba trap bez argumenata ispisuje postavljena hvatanja.',
      cCmd: 'Naredba {cmd} vraća {st}.',
      cExitMain: 'Naredba {cmd} završava skriptu prije kraja koda; izlazni status je {st}.',
      cExitMainTrap: 'Naredba {cmd} prekida skriptu prije kraja koda. Ljuska izlazi, ali prije toga izvršava hvatanje EXIT.',
      cExitSubTrapMain: 'Naredba {cmd} stoji u zagradama, pa završava podljusku, a ne skriptu. Status stiže kao $?, a hvatanje iz glavne skripte ovdje se nije izvršilo.',
      cExitSub: 'Naredba {cmd} stoji u zagradama, pa završava podljusku, a ne skriptu. Status {st} stiže u glavnu skriptu kao $?.',
      cExitSubOwn: 'Naredba {cmd} završava podljusku sa statusom {st}, ali prije toga podljuska izvršava svoje hvatanje EXIT.',
      cTrapRunExit: 'Glavna skripta izlazi, pa se izvršava njezino hvatanje. Izlazni status ostaje {st}, onaj iz {cmd}: hvatanje ga ne mijenja.',
      cTrapRunEnd: 'Skripta je došla do kraja, pa se hvatanje izvršava: jednom, sada, nakon posljednjeg retka. Izlazni status je {st}, status posljednje naredbe.',
      cTrapRemoved: 'Direktorij {dir} je obrisan.',
      cTrapRunSub: 'Podljuska izlazi, pa se izvršava hvatanje koje je sama postavila. Njezin status ostaje {st} i stiže u glavnu skriptu kao $?.',
      cPrintf: 'Svaki član cjevovoda radi u svojoj podljusci, kopiji glavne skripte. Prvi član upisuje retke u cijev i završava; petlja while čita iz cijevi u drugom članu. (Članovi zapravo rade istodobno; ovdje su prikazani redom.)',
      cPass: 'Naredba read uzima redak {val} iz cijevi, a n postaje {n}, ali u kopiji, u drugom članu cjevovoda.',
      cPassLast: 'Sljedeći read ne nađe redak (x ostaje prazan), pa petlja završava, a s njom i podljuska.',
      cSubEnded: 'Podljuska je završila sa statusom {st}; to je sada $? u glavnoj skripti.',
      cFinal: 'Skripta je završila s izlaznim statusom {st}.',
      cCaller: 'Ljuska koja je pokrenula skriptu i dalje je u {home}: skripta radi u svojem procesu.',

      explain: '<p>[[subshell]] je zasebno <i>execution environment</i> (izvršno okruženje) koje ljuska pokrene kao ' +
        'kopiju svojega. U podljusci rade naredbe u oblim zagradama <code>( … )</code>; [[command substitution]] ' +
        '<code>$( … )</code> također radi u podljusci, a [[pipeline]] svakog svojeg člana pokreće u zasebnoj. ' +
        'Kopija dobije radni direktorij, varijable i ' +
        '<code>$?</code>; što se u njoj promijeni (<code>cd</code>, dodjela, <code>umask</code>) ostaje u njoj i nestane ' +
        's njom. Vitičaste zagrade <code>{ …; }</code> ne stvaraju kopiju: <code>cd</code> unutar njih ostaje.</p>' +
        '<p><code>exit N</code> završava samo okruženje u kojem stoji. U zagradama to je podljuska: njezin status stiže u ' +
        'glavnu skriptu kao <code>$?</code> i skripta nastavlja.</p>' +
        '<p><code>trap \'…\' EXIT</code> postavlja <i>trap</i> (hvatanje): radnju koja se izvrši kad ljuska izađe, i onda ' +
        'kad izađe naredbom <code>exit 3</code> prije kraja koda, a [[exit status]] ostaje 3. To je mjesto za čišćenje ' +
        'privremenog direktorija iz <code>mktemp -d</code>. Pri ulasku u podljusku hvatanja se vraćaju na zadane radnje, ' +
        'pa hvatanje glavne skripte ne vrijedi u zagradama; izvrši se jednom, kad izađe glavna skripta. Hvatanje ' +
        'postavljeno u podljusci pripada njoj.</p>' +
        '<p>Varijabla postavljena u petlji <code>… | while read …</code> izgubi se nakon petlje, jer je petlja član ' +
        'cjevovoda. Ljuska bash to može promijeniti opcijom <code>lastpipe</code> (posljednji član tada radi u samoj ' +
        'ljusci); ovdje je prikazano zadano ponašanje.</p>' +
        '<p>Izvor: Uvod u Linux, pogl. 17 (<code>ciscenje.sh</code>, <code>ciscenje2.sh</code>, slika granice ' +
        'podljuske).</p>'
    },
    en: {
      stage: 'Script, execution environments and terminal',
      script: 'Script',
      showCopy: 'Show the copied values',
      showCopyHint: 'A subshell starts as a copy. Off: its box shows only what changed in it.',
      pCiscenje: 'ciscenje.sh: cleanup on exit',
      pCiscenje2: 'ciscenje2.sh: exit in a subshell',
      pCd: 'cd in a subshell and in { …; }',
      pPipe: 'A variable lost in a pipeline',
      pTrapSub: 'A trap inside the subshell',

      listing: 'Script {file}',
      envs: 'Execution environments',
      terminal: 'Terminal',
      callerSays: 'exit status',
      lineNow: 'line {no}, the command of this step',
      boxMain: 'main script',
      boxParen: 'subshell ( … )',
      boxCmdsub: 'subshell $( … )',
      boxPipe: 'subshell: pipeline member {k}',
      copyTag: 'copy',
      cwd: 'working directory',
      vars: 'variables',
      varsNone: 'none',
      trapExit: 'EXIT trap',
      trapNone: 'default: nothing',
      trapReset: 'default: reset on entry',
      lastStatus: 'last status',
      restCopied: 'the rest: a copy of the parent',
      doorEnded: 'ended, status {st}',
      doorMainEnded: 'exit status {st}',
      doorExiting: 'exiting with {st}, trap pending',
      pipeLabel: 'pipe',
      pipeEmpty: 'empty',
      tmpdir: 'Temporary directory',
      tmpExists: 'exists',
      tmpRemoved: 'removed',
      tmpNotYet: 'not there yet',
      outMain: 'printed by the main script',
      outSub: 'printed by a subshell',
      outTrap: 'printed by the trap',

      legendMain: 'main environment',
      legendSub: 'subshell: a copy',
      legendChanged: 'changed in this step',
      legendTrap: 'trap set',
      legendReset: 'trap reset to the default',
      legendExit: 'exit with its status',

      cStart: 'The script {file} has not started. The main script has its own execution environment: working directory {cwd}, no variables, no trap, $? = 0.',
      cAssignSub: '{cmd} runs in a subshell: the copy appears, prints {val} and ends, and its output becomes the value of {name} in the main script.',
      cAssign: 'The variable {name} gets the value {val} in the main script.',
      cAssignInSub: 'The variable {name} gets the value {val}, but in the copy.',
      cCdMain: '{cmd} changes the main script\'s working directory.',
      cCdSub: '{cmd} changes the copy\'s working directory; the main script is still in {parent}.',
      cCdGroup: 'Braces do not start a subshell: {cmd} runs in the main script, and the change stays.',
      cPwd: 'pwd prints the working directory of the environment it runs in: {cwd}.',
      cPwdBack: 'The subshell is gone, and its cd with it: the main script is still in {cwd}.',
      cEcho: 'echo prints: {text}.',
      cEchoSub: 'echo runs in the subshell; it prints: {text}.',
      cEnteredReset: 'The subshell starts as a copy of the main script, but its EXIT trap is reset to the default: the main script\'s trap does not hold here.',
      cEchoStatus: 'The status the subshell ended with ({st}) arrived in the main script as a plain value of $?.',
      cEchoLost: 'In the main script {name} is still {val}: the counting happened in the pipeline member, in its own copy, and that copy is gone.',
      cLs: 'ls -d shows that the directory {dir} exists.',
      cLsMissing: 'The directory {dir} does not exist; ls returns {st}.',
      cTrapSet: 'trap sets an EXIT trap in the main script: the action {act} will run when the main script exits, also when it exits with exit before the end of its code.',
      cTrapSetSub: 'trap sets an EXIT trap in the subshell: it belongs to the subshell and will run when the subshell exits.',
      cTrapPrint: 'trap with no arguments prints the traps that are set.',
      cCmd: '{cmd} returns {st}.',
      cExitMain: '{cmd} ends the script before the end of its code; the exit status is {st}.',
      cExitMainTrap: '{cmd} stops the script before the end of its code. The shell exits, but first it runs the EXIT trap.',
      cExitSubTrapMain: '{cmd} is inside the parentheses, so it ends the subshell, not the script. The status arrives as $?, and the main script\'s trap did not run here.',
      cExitSub: '{cmd} is inside the parentheses, so it ends the subshell, not the script. The status {st} arrives in the main script as $?.',
      cExitSubOwn: '{cmd} ends the subshell with status {st}, but first the subshell runs its own EXIT trap.',
      cTrapRunExit: 'The main script exits, so its trap runs. The exit status stays {st}, the one from {cmd}: the trap does not change it.',
      cTrapRunEnd: 'The script reached its end, so the trap runs: once, now, after the last line. The exit status is {st}, the last command\'s.',
      cTrapRemoved: 'The directory {dir} is removed.',
      cTrapRunSub: 'The subshell exits, so the trap it set itself runs. Its status stays {st} and arrives in the main script as $?.',
      cPrintf: 'Each pipeline member runs in its own subshell, a copy of the main script. The first member writes its lines into the pipe and ends; the while loop reads from the pipe in the second member. (The members really run at the same time; here they are shown in turn.)',
      cPass: 'read takes the line {val} from the pipe, and n becomes {n}, but in the copy, in the second pipeline member.',
      cPassLast: 'The next read finds no line (x is left empty), so the loop ends, and the subshell with it.',
      cSubEnded: 'The subshell ended with status {st}; that is now $? in the main script.',
      cFinal: 'The script ended with exit status {st}.',
      cCaller: 'The shell that started the script is still in {home}: the script runs in a process of its own.',

      explain: '<p>A [[subshell]] is a separate <i>execution environment</i>: the shell starts it as a copy of its own for ' +
        'commands in parentheses <code>( … )</code>, for [[command substitution]] <code>$( … )</code> and for each ' +
        'member of a [[pipeline]]. The copy gets the working directory, the variables and <code>$?</code>; what changes ' +
        'in it (<code>cd</code>, an assignment, <code>umask</code>) stays in it and is gone with it. Braces ' +
        '<code>{ …; }</code> make no copy: a <code>cd</code> inside them stays.</p>' +
        '<p><code>exit N</code> ends only the environment it is in. Inside parentheses that is the subshell: its status ' +
        'arrives in the main script as <code>$?</code> and the script goes on.</p>' +
        '<p><code>trap \'…\' EXIT</code> sets a <i>trap</i>: an action that runs when the shell exits, also when it exits ' +
        'with <code>exit 3</code> before the end of its code, and the [[exit status]] stays 3. That is the place to clean ' +
        'up a temporary directory from <code>mktemp -d</code>. On entering a subshell, traps are reset to their defaults, ' +
        'so the main script\'s trap does not hold inside the parentheses; it runs once, when the main script exits. A trap ' +
        'set in a subshell belongs to the subshell.</p>' +
        '<p>A variable set in a <code>… | while read …</code> loop is lost after the loop, because the loop is a pipeline ' +
        'member. bash can change that with the <code>lastpipe</code> option (the last member then runs in the shell ' +
        'itself); the default is shown here.</p>' +
        '<p>Source: Uvod u Linux (Introduction to Linux), ch. 17 (<code>ciscenje.sh</code>, <code>ciscenje2.sh</code>, ' +
        'the subshell boundary figure).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
