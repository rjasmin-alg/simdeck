/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-signals, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a
   glossary term, *term* an English term the glossary lacks (the page sets it in italics, lang="en").
   Signal names, PIDs, commands and what bash prints are data, not language: the page puts them in translate="no".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Terminal, procesi i signal koji putuje',

      script: 'Scenarij',
      handler: 'Funkcija za hvatanje u ./zapis',
      handlerFinish: 'pospremi i izađi',
      handlerHang: 'zaglavi',
      sender: 'Tko šalje kill',
      senderStudent: 'student',
      senderRoot: 'root',
      notUsedHandler: 'U ovom scenariju nema programa s vlastitom funkcijom za hvatanje.',
      notUsedSender: 'Ovdje kill ide na %1, a posao pripada samo ljusci koja ga je pokrenula.',

      presetBook: 'Primjer 1 iz knjige',
      presetBookHint: 'sleep 300 &, kill %1, ps',
      presetCleans: 'Program pospremi',
      presetCleansHint: 'SIGTERM, funkcija za hvatanje miče bravu',
      presetStubborn: 'Tvrdoglavi program',
      presetStubbornHint: 'SIGTERM ne pomaže, SIGKILL da',
      presetNohup: 'nohup i zatvoren terminal',
      presetNohupHint: '& i nohup &, pa zatvori terminal',
      presetNotYours: 'Tuđi proces',
      presetNotYoursHint: 'student pa root šalju SIGTERM procesu korisnice ana',

      legChanged: 'promijenjeno u ovom koraku',
      legAlive: 'proces radi',
      legEnded: 'proces je završio',
      legDefault: 'zadana radnja',
      legIgnore: 'zanemaruje',
      legCatch: 'hvata',
      legSignal: 'signal na putu',
      legRefused: 'odbijeno',
      legLeft: 'ostalo iza procesa',

      termTitle: 'Terminal',
      termClosed: 'terminal je zatvoren',
      newTerm: 'novi terminal',
      procsTitle: 'Procesi',
      filesTitle: 'Datoteke',
      shellTag: 'ljuska',

      dispDefault: 'zadano',
      dispIgnore: 'zanemaruje',
      dispCatch: 'hvata',

      stateRun: 'radi',
      stateHandler: 'izvodi funkciju za hvatanje',
      stateHanging: 'funkcija za hvatanje je zaglavila',
      stateSig: 'završio, signal {sig}',
      stateExit: 'završio sam, exit({code})',
      status: 'izlazni status {n}',
      reportBy: 'javlja ljuska {pid}',
      reportNone: 'nijedna ljuska ga ne čeka',

      lockHeld: 'brava postoji',
      lockGone: 'brava maknuta',
      lockLeft: 'brava je ostala',
      dataOpen: 'zapis u tijeku',
      dataClosed: 'zatvorena, cijela',
      dataHalf: 'napola zapisana',
      nohupHas: 'ovamo ide ispis posla',

      sigNone: 'U ovom koraku nijedan signal ne putuje.',
      fromTerminal: 'terminal',
      fromShell: 'ljuska {pid}',
      phA: 'dopuštenje',
      phB: 'postupanje',
      phC: 'radnja',
      phD: 'ishod',
      permOk: 'da',
      permNo: 'ne',
      actTerminated: 'prekid',
      actIgnored: 'ništa',
      actHandler: 'pokreće funkciju',
      actHandlerAgain: 'već je u njoj',
      actResend: 'SIGHUP poslovima, izlaz',
      actShellCatch: 'ljuska ga obradi',
      actRefused: 'odbijeno',
      actNosuch: 'nema tog procesa',
      actNojob: 'nema tog posla',
      resGone: 'završio, status {n}',
      resAlive: 'i dalje radi',
      resNothing: 'ništa se ne mijenja',

      capStartBook: 'Ljuska 38423 čeka naredbu. Sve što pokrene bit će njezino dijete, a [[job]] dobit će i broj uz znak %. ' +
        'Pritisni → za prvi redak iz knjige.',
      capStartCleans: 'Program ./zapis radi u pozadini: drži bravu i piše datoteku. Za SIGTERM ima vlastitu ' +
        '*signal handler* (funkciju za hvatanje signala): zatvori datoteku, makni bravu, izađi.',
      capStartStubborn: 'Isti ./zapis, ali njegova funkcija za hvatanje ovaj put zaglavi i nikad ne završi. Pogledaj što ' +
        'tada može SIGTERM, a što SIGKILL.',
      capStartNohup: 'Ljuska 38458 iz trećeg primjera. Pokrenut će dva jednaka posla, jedan samo s &, drugi s nohup, a onda ' +
        'će se terminal zatvoriti.',
      capStartNotYours: 'Proces 38470 pripada korisnici ana. student mu želi poslati SIGTERM. Odluku donosi jezgra, po ' +
        'korisničkim identifikatorima.',

      capJob: '{cmd} radi u pozadini kao posao {job}, s PID-om {pid}; [[parent process]] mu je ljuska. Za sva četiri signala ' +
        'vrijedi *default action* (zadana radnja).',
      capJobPlain: '{cmd} radi kao posao {job}, PID {pid}. Znak & samo odmah vraća upit; postupanje sa signalima ostaje zadano.',
      capJobNohup: 'nohup je pokrenuo isti sleep, ali mu je prije toga SIGHUP postavio na zanemarivanje, a ispis preusmjerio u ' +
        'nohup.out. SIGTERM i SIGKILL ostali su kakvi su bili.',
      capTerm: 'kill nije naveo signal, pa je poslan SIGTERM (15). {cmd} nema vlastitu funkciju za njega: zadana radnja, ' +
        'prekid. Ljuska još ništa ne ispisuje.',
      capTermRoot: 'Ista naredba kao root prolazi: root ima povišene ovlasti. Zadana radnja, prekid; izlazni status {n} ' +
        'dobit će ljuska 38466 korisnice ana.',
      capGone: 'Nakon sleep 1 ljuska javlja da je posao završio, a ps ispisuje samo zaglavlje: procesa nema. [[exit status]] ' +
        'je {n} = 128 + {num}.',
      capHandler: 'SIGTERM je stigao, a {cmd} ga hvata: pokrenula se njegova funkcija za hvatanje. Proces još radi; što ' +
        'dalje, odlučuje sam program.',
      capCleaned: 'Funkcija za hvatanje je završila: datoteka je zatvorena, brava maknuta, exit(0). Ljuska javlja Done, ' +
        'status 0, a ne 143: program je izašao sam.',
      capHanging: 'Vrijeme prolazi, a funkcija za hvatanje je zaglavila: ps i dalje pokazuje {pid}. SIGTERM nije ništa ' +
        'promijenio, a ni drugi SIGTERM ne bi.',
      capKillLeft: 'SIGTERM je stigao, ali program za njega ima vlastiti postupak i odlučio je ne završiti. Tek SIGKILL, ' +
        'koji se ne može uhvatiti, prekida ga — i za sobom ostavlja bravu. Status {n}.',
      capKillPlain: 'nohup je promijenio samo SIGHUP. SIGKILL se ne može ni uhvatiti ni zanemariti, pa prekida i {pid}. ' +
        'Nijedna ljuska ga ne čeka: roditelj mu je PID 1.',
      capNoSuch: 'Odgovor je „No such process“: {pid} je već završio. Signal treba živ proces.',
      capRefused: '„Operation not permitted“: student (UID 1000) nije ana (UID 1001), a nije ni root. Provjera ide prva; ' +
        'proces signal nije ni vidio i ništa se ne mijenja.',
      capClose: 'Terminal je zatvoren: SIGHUP ljusci 38458. Ljuska ga hvata, šalje SIGHUP svakom svom poslu i izlazi. ' +
        'Posao sa samim & završava (status 129); posao s nohup taj signal zanemaruje i radi dalje, sada kao dijete PID-a 1.',
      capCloseNoNohup: 'Terminal je zatvoren: SIGHUP ljusci 38458, a ona ga šalje svojim poslovima. Bez nohup svi završavaju ' +
        '(status 129).',
      capOther: 'Ništa od ovoga ne mijenja proces koji nije dobio signal.',

      explain: '<p><b>Signal i postupanje.</b> [[signal]] je obavijest koju sustav isporučuje procesu. Za svaki signal proces ' +
        'ima postupanje: <i lang="en">default action</i> (zadana radnja; za SIGHUP, SIGINT, SIGTERM i SIGKILL to je prekid), ' +
        'zanemarivanje, ili vlastita <i lang="en">signal handler</i> (funkcija za hvatanje signala). Kartica svakog procesa ' +
        'pokazuje to za četiri signala.</p>' +
        '<p><b>kill ne znači „ubij“.</b> <code translate="no">kill 4321</code> šalje SIGTERM (15); ' +
        '<code translate="no">kill -KILL 4321</code> ili <code translate="no">kill -9 4321</code> šalje SIGKILL (9). ' +
        'Program za SIGTERM može pospremiti i izaći, ili ne izaći uopće. SIGKILL se ne može ni uhvatiti ni zanemariti, pa ' +
        'program ne stigne ništa: brava ostaje, zapis ostaje napola. Zato je redoslijed SIGTERM, pričekaj, tek onda SIGKILL.</p>' +
        '<p><b>Tko smije.</b> Jezgra prije svega provjeri identitet: stvarni ili efektivni UID pošiljatelja mora biti jednak ' +
        'stvarnom ili spremljenom UID-u primatelja, osim ako pošiljatelj ima povišene ovlasti (root). Inače ' +
        '<code translate="no">Operation not permitted</code>, i proces signal ne vidi.</p>' +
        '<p><b>SIGHUP, & i nohup.</b> Kad se terminal zatvori, ljuska dobije SIGHUP, pošalje ga svakom svom [[=job]] i izađe. ' +
        '<code translate="no">&</code> samo odmah vraća upit; takav posao umire sa SIGHUP-om. ' +
        '<code translate="no">nohup</code> poslu unaprijed postavi SIGHUP na zanemarivanje i ispis preusmjeri u ' +
        '<code translate="no">nohup.out</code>; SIGTERM i SIGKILL ostaju isti.</p>' +
        '<p><b>Izlazni status.</b> Proces koji je završio na signalu N ljuska javlja sa statusom 128 + N: 143 za SIGTERM, 137 za ' +
        'SIGKILL, 129 za SIGHUP. Program koji je izašao sam vraća svoj broj, ovdje 0.</p>' +
        '<p><b>Zablude.</b> „kill ubija“: šalje SIGTERM. „kill -9 je normalan način“: preskače pospremanje. „& štiti posao kad ' +
        'zatvorim terminal“: ne štiti, to radi nohup.</p>' +
        '<p><b>Izvan ovog simulatora:</b> SIGSTOP i SIGCONT, fg i bg, maske signala i <code translate="no">trap</code> ljuske ' +
        '(simulator lnx-subshell-trap).</p>'
    },
    en: {
      stage: 'Terminal, processes and a signal on its way',

      script: 'Scenario',
      handler: 'Handler in ./zapis',
      handlerFinish: 'clean up and exit',
      handlerHang: 'hang',
      sender: 'Who sends kill',
      senderStudent: 'student',
      senderRoot: 'root',
      notUsedHandler: 'This scenario has no program with a handler of its own.',
      notUsedSender: 'Here kill targets %1, and a job belongs only to the shell that started it.',

      presetBook: 'Book example 1',
      presetBookHint: 'sleep 300 &, kill %1, ps',
      presetCleans: 'The program cleans up',
      presetCleansHint: 'SIGTERM, the handler removes the lock',
      presetStubborn: 'A stubborn program',
      presetStubbornHint: 'SIGTERM does not help, SIGKILL does',
      presetNohup: 'nohup and a closed terminal',
      presetNohupHint: '& and nohup &, then close the terminal',
      presetNotYours: 'Someone else\'s process',
      presetNotYoursHint: 'student, then root, sends SIGTERM to a process of ana',

      legChanged: 'changed in this step',
      legAlive: 'process running',
      legEnded: 'process ended',
      legDefault: 'default action',
      legIgnore: 'ignores',
      legCatch: 'catches',
      legSignal: 'signal on its way',
      legRefused: 'refused',
      legLeft: 'left behind',

      termTitle: 'Terminal',
      termClosed: 'the terminal is closed',
      newTerm: 'a new terminal',
      procsTitle: 'Processes',
      filesTitle: 'Files',
      shellTag: 'shell',

      dispDefault: 'default',
      dispIgnore: 'ignores',
      dispCatch: 'catches',

      stateRun: 'running',
      stateHandler: 'running its handler',
      stateHanging: 'its handler hangs',
      stateSig: 'ended, signal {sig}',
      stateExit: 'ended by itself, exit({code})',
      status: 'exit status {n}',
      reportBy: 'reported by shell {pid}',
      reportNone: 'no shell waits for it',

      lockHeld: 'lock held',
      lockGone: 'lock removed',
      lockLeft: 'lock left behind',
      dataOpen: 'being written',
      dataClosed: 'closed, complete',
      dataHalf: 'half-written',
      nohupHas: 'the job\'s output goes here',

      sigNone: 'No signal travels in this step.',
      fromTerminal: 'terminal',
      fromShell: 'shell {pid}',
      phA: 'permission',
      phB: 'disposition',
      phC: 'action',
      phD: 'result',
      permOk: 'yes',
      permNo: 'no',
      actTerminated: 'terminate',
      actIgnored: 'nothing',
      actHandler: 'runs the handler',
      actHandlerAgain: 'already in it',
      actResend: 'SIGHUP to its jobs, exit',
      actShellCatch: 'the shell handles it',
      actRefused: 'refused',
      actNosuch: 'no such process',
      actNojob: 'no such job',
      resGone: 'ended, status {n}',
      resAlive: 'still running',
      resNothing: 'nothing changes',

      capStartBook: 'Shell 38423 waits for a command. Whatever it starts is its child, and a [[job]] also gets a number ' +
        'after a % sign. Press → for the book\'s first line.',
      capStartCleans: 'The program ./zapis runs in the background: it holds a lock and writes a file. For SIGTERM it has ' +
        'its own *signal handler*: close the file, remove the lock, exit.',
      capStartStubborn: 'The same ./zapis, but this time its handler hangs and never finishes. Watch what SIGTERM can do ' +
        'then, and what SIGKILL can.',
      capStartNohup: 'Shell 38458 from the book\'s third example. It will start two identical jobs, one with & alone and one ' +
        'with nohup, and then the terminal is closed.',
      capStartNotYours: 'Process 38470 belongs to the user ana. student wants to send it SIGTERM. The kernel decides, by ' +
        'user IDs.',

      capJob: '{cmd} runs in the background as job {job}, PID {pid}; its [[parent process]] is the shell. All four signals ' +
        'have their *default action*.',
      capJobPlain: '{cmd} runs as job {job}, PID {pid}. The & only gives the prompt back at once; the dispositions stay default.',
      capJobNohup: 'nohup started the same sleep, but first set SIGHUP to ignore and sent the output to nohup.out. SIGTERM ' +
        'and SIGKILL are as they were.',
      capTerm: 'kill named no signal, so SIGTERM (15) was sent. {cmd} has no handler of its own for it: default action, ' +
        'terminate. The shell prints nothing yet.',
      capTermRoot: 'The same command as root goes through: root is privileged. Default action, terminate; the exit status ' +
        '{n} goes to ana\'s shell 38466.',
      capGone: 'After sleep 1 the shell reports that the job ended, and ps prints only the header: the process is gone. ' +
        'The [[exit status]] is {n} = 128 + {num}.',
      capHandler: 'SIGTERM arrived, and {cmd} catches it: its handler has started. The process is still running; what ' +
        'happens next is up to the program.',
      capCleaned: 'The handler finished: the file is closed, the lock removed, exit(0). The shell reports Done, status 0, ' +
        'not 143: the program exited by itself.',
      capHanging: 'Time passes, but the handler hangs: ps still shows {pid}. SIGTERM changed nothing, and a second SIGTERM ' +
        'would not either.',
      capKillLeft: 'SIGTERM arrived, but the program has its own handler for it and chose not to exit. Only SIGKILL, which ' +
        'cannot be caught, ends it — and leaves the lock file behind. Status {n}.',
      capKillPlain: 'nohup changed only SIGHUP. SIGKILL can be neither caught nor ignored, so it ends {pid} too. No shell ' +
        'waits for it: its parent is PID 1.',
      capNoSuch: 'The answer is "No such process": {pid} has already ended. A signal needs a living process.',
      capRefused: '"Operation not permitted": student (UID 1000) is not ana (UID 1001), and not root. The check comes first; ' +
        'the process never sees the signal and nothing changes.',
      capClose: 'The terminal closed: SIGHUP to shell 38458. The shell catches it, sends SIGHUP to each of its jobs and exits. ' +
        'The job with & alone ends (status 129); the nohup job ignores that signal and keeps running, now a child of PID 1.',
      capCloseNoNohup: 'The terminal closed: SIGHUP to shell 38458, which sends it to its jobs. Without nohup they all end ' +
        '(status 129).',
      capOther: 'None of this changes a process that got no signal.',

      explain: '<p><b>Signal and disposition.</b> A [[signal]] is a notice the system delivers to a process. For each signal ' +
        'a process has a disposition: the <i>default action</i> (for SIGHUP, SIGINT, SIGTERM and SIGKILL: terminate), ' +
        'ignore, or a <i>signal handler</i> of its own. Each process card shows this for four signals.</p>' +
        '<p><b>kill does not mean "kill".</b> <code translate="no">kill 4321</code> sends SIGTERM (15); ' +
        '<code translate="no">kill -KILL 4321</code> or <code translate="no">kill -9 4321</code> sends SIGKILL (9). A program ' +
        'may clean up and exit on SIGTERM, or not exit at all. SIGKILL can be neither caught nor ignored, so the program gets ' +
        'to do nothing: the lock stays, the record stays half-written. Hence the order: SIGTERM, wait, only then SIGKILL.</p>' +
        '<p><b>Who may.</b> The kernel checks identity first: the sender\'s real or effective UID must equal the target\'s ' +
        'real or saved UID, unless the sender is privileged (root). Otherwise <code translate="no">Operation not permitted</code>, ' +
        'and the process never sees the signal.</p>' +
        '<p><b>SIGHUP, & and nohup.</b> When the terminal closes, the shell gets SIGHUP, sends it to each of its [[=job]]s and ' +
        'exits. <code translate="no">&</code> only gives the prompt back at once; such a job dies of SIGHUP. ' +
        '<code translate="no">nohup</code> sets SIGHUP to ignore before the job starts and sends its output to ' +
        '<code translate="no">nohup.out</code>; SIGTERM and SIGKILL stay the same.</p>' +
        '<p><b>Exit status.</b> A process that died of signal N is reported by the shell with status 128 + N: 143 for SIGTERM, ' +
        '137 for SIGKILL, 129 for SIGHUP. A program that exits by itself returns its own number, here 0.</p>' +
        '<p><b>Misconceptions.</b> "kill kills": it sends SIGTERM. "kill -9 is the normal way": it skips the cleanup. "& protects ' +
        'a job when I close the terminal": it does not; nohup does.</p>' +
        '<p><b>Not in this simulator:</b> SIGSTOP and SIGCONT, fg and bg, signal masks, and the shell\'s ' +
        '<code translate="no">trap</code> (simulator lnx-subshell-trap).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
