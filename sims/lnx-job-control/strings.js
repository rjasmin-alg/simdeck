/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-job-control, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, [[term]] a glossary term, *term* an English term the glossary
   lacks (the page sets it in italics, lang="en").
   PIDs, signal names, commands and what bash prints are data, not language: the page puts them in translate="no".
   Captions are keyed by scenario (p1 primjer1, cz ctrl-z, zp zatvori-prozor, ez exit-ili-zatvori, cj cjevovod) and step.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Terminal, ljuska, grupe procesa i signali među njima',

      script: 'Scenarij',
      nohup: 'Drugi posao pod nohup',
      huponexit: 'shopt huponexit',
      login: 'Ljuska za prijavu (login)',
      notUsedNohup: 'Samo scenarij „Zatvori prozor” ima drugi posao.',
      notUsedExit: 'Samo scenarij „exit ili zatvori” izlazi naredbom exit.',

      presetP1: 'Primjer 1 iz knjige',
      presetP1Hint: 'sleep 300 &, jobs, ps, kill %1',
      presetCz: 'Ctrl-Z, bg, fg',
      presetCzHint: 'obustavi, u pozadinu, naprijed, Ctrl-C',
      presetZp: 'Zatvori prozor',
      presetZpHint: '& i nohup &, pa zatvori prozor',
      presetEz: 'exit ili zatvori',
      presetEzHint: 'exit s obustavljenim poslom; login i huponexit',
      presetCj: 'Cjevovod',
      presetCjHint: 'cat | grep x: dva procesa, jedna grupa',

      legChanged: 'promijenjeno u ovom koraku',
      legGroup: 'grupa procesa (jedan posao)',
      legFg: 'prednja grupa terminala',
      legSleep: 'S: čeka',
      legStopped: 'T: obustavljen',
      legGone: 'završio',
      legSignal: 'signal i kome ide',

      termTitle: 'Terminal',
      termClosed: 'prozor je zatvoren',
      termExited: 'ljuska je izašla, prozor se zatvara',
      newTerm: 'novi prozor',
      keyClose: 'zatvori prozor',
      keysLabel: 'Tipke i prozor',

      sigTitle: 'Signali u ovom koraku',
      sigNone: 'U ovom koraku nijedan signal ne putuje.',
      fromTerminal: 'terminal',
      fromShell: 'ljuska',
      toGroup: 'grupi {pgid}',
      toPid: 'procesu {pid}',
      actTerminated: 'završava',
      actStopped: 'obustavljen',
      actContinued: 'nastavlja',
      actIgnored: 'zanemaruje',
      actNothing: 'ništa',
      actCaught: 'hvata',
      actPending: 'čeka dok stoji',
      actReleased: 'nastavlja i završava na {sig}',
      pendingTag: 'na čekanju:',
      reachedNone: 'nikoga nema',

      treeTitle: 'Procesi po grupama',
      groupOf: 'grupa {pgid}',
      jobTag: 'posao',
      shellTag: 'ljuska',
      fgBadge: 'prednja',
      initTitle: 'roditelj PID 1',
      shellGone: 'ljuska {pid} je završila',

      jobsTitle: 'Popis poslova ljuske',
      jobsEmpty: 'Nema poslova.',
      jobsNoShell: 'Nema ljuske, nema ni popisa poslova.',
      fgTag: 'naprijed',
      psTitle: 'Tablica procesa (ps)',

      capP1_0: 'Ljuska 38423 čeka naredbu. Što pokrene, bit će njezin [[job]]: s brojem posla u ljusci i, kao svaki proces, ' +
        's PID-om u jezgri.',
      capP1_1: '& znači: ne čekaj. Ljuska ispisuje [1] 38450 i odmah novi upit. 1 je broj posla, 38450 PID; posao je i ' +
        'svoja grupa procesa 38450.',
      capP1_2: 'jobs je popis ljuske: [1]+ Running. Znak + označava tekući posao, onaj koji fg i bg uzmu kad im se ne navede broj.',
      capP1_3: 'ps gleda isti proces iz jezgre: PID 38450, roditelj 38423, stanje S. Bez + u STAT: nije u prednjoj grupi ' +
        'terminala, pa ga tipke ne diraju.',
      capP1_4: 'kill %1 naslovljuje posao, a ljuska šalje SIGTERM cijeloj njegovoj grupi. Zadana radnja je prekid; nakon ' +
        'sleep 1 ljuska javlja Terminated i briše posao s popisa.',

      capCz_0: 'Ovaj put sleep 300 ide bez &, pa će ljuska čekati. Prati značku prednje grupe: kome terminal šalje tipke.',
      capCz_1: 'Prednji posao: ljuska čeka i ne ispisuje upit. Prednja grupa terminala sada je 38450 (STAT S+), a ne ljuska.',
      capCz_2: 'Ctrl-Z: terminal šalje SIGTSTP prednjoj grupi. sleep je obustavljen (T); ljuska to vidi, ispiše Stopped i ' +
        'vrati si terminal.',
      capCz_3: 'bg šalje SIGCONT grupi 38450: posao nastavlja, ali u pozadini. Upit je odmah tu, a tipke idu ljusci.',
      capCz_4: 'fg vraća posao naprijed: grupa 38450 opet je prednja i ljuska čeka. Signal ne treba jer posao već radi.',
      capCz_5: 'Ctrl-C: SIGINT prednjoj grupi, zadana radnja je prekid. Za prednji posao prekinut tipkom Ctrl-C ljuska ne ' +
        'ispisuje obavijest; upit je opet njezin.',

      capZp_0: 'Dva jednaka posla: jedan samo s &, drugi pod nohup (preklopnik desno). Onda se prozor zatvara. Što preživi?',
      capZp_1: '[1] 38450 radi u pozadini, u svojoj grupi. & ne mijenja ništa u signalima, samo ljuska ne čeka.',
      capZp_2: 'nohup je drugom sleep-u prije pokretanja postavio SIGHUP na zanemarivanje, a ispis preusmjerio u nohup.out. ' +
        'Za ljusku je to posao [2] kao i svaki drugi.',
      capZp_2off: 'Drugi sleep 300 & pokrenut je bez nohup: dva posla s jednakim postupanjem, oba sa zadanom radnjom za SIGHUP.',
      capZp_3: 'Zatvoren je prozor: ljuska prosljeđuje SIGHUP svim poslovima. sleep pod nohup-om ga zanemaruje i radi dalje, ' +
        'sad s roditeljem PID 1.',
      capZp_3off: 'Zatvoren je prozor: ljuska prosljeđuje SIGHUP svim poslovima. Bez nohup oba sleep-a imaju zadanu radnju i ' +
        'završavaju; & ih nije zaštitio.',
      capZp_4: 'U novom prozoru ps nalazi samo 38485, s roditeljem 1; 38450 ga nema. Ljuske koja je vodila poslove više nema, ' +
        'a s njom ni brojeva poslova.',
      capZp_4off: 'U novom prozoru ps ispisuje samo zaglavlje: nijedan posao nije preživio zatvaranje prozora.',

      capEz_0: 'Isti sleep 300 &, ali ljuska se napušta naredbom exit, a ne zatvaranjem prozora. Uz njega i jedan obustavljen posao.',
      capEz_1: '[1] 38450 radi u pozadini.',
      capEz_2: 'sleep 600 je prednji posao [2], grupa 38452; ljuska čeka.',
      capEz_3: 'Ctrl-Z obustavlja [2] (T); [1] u pozadini tipku nije ni vidio. Tekući posao (+) sada je obustavljeni [2].',
      capEz_4: 'exit nije prekid veze. Ljuska ima obustavljen posao, pa upozori „There are stopped jobs.” i ostane. Nijedan ' +
        'signal nije poslan.',
      capEz_5: 'Drugi exit: ljuska obustavljenom poslu šalje SIGTERM, ali zaustavljen proces ga prima tek kad nastavi, pa ' +
        'šalje i SIGCONT. [1] dobiva samo novog roditelja, PID 1: exit ne šalje SIGHUP.',
      capEz_5hup: 'Ljuska za prijavu s huponexit: pri izlasku šalje SIGHUP svim poslovima, a obustavljenom i SIGCONT da ga ' +
        'primi. Oba sleep-a završavaju.',
      capEz_6: 'U novom prozoru 38450 i dalje radi, roditelj mu je 1. Posao sa & preživio je exit; zatvaranje prozora ne bi.',
      capEz_6hup: 'U novom prozoru ps ispisuje samo zaglavlje. Isključi login ili huponexit i vrati se na korak 5: posao ostaje.',

      capCj_0: 'Cjevovod cat | grep x: dva procesa, jedan posao. cat čita s terminala, grep iz cijevi.',
      capCj_1: 'Oba procesa su u grupi 38450 (PGID je PID prvoga, cat-a), a ta je grupa prednja: oba imaju + u STAT.',
      capCj_2: 'Ctrl-Z ne šalje signal „programu” nego cijeloj prednjoj grupi procesa: i cat i grep su obustavljeni (stanje T).',
      capCj_3: 'bg: SIGCONT grupi, posao nastavlja u pozadini. No cat odmah čita s terminala, a nije u prednjoj grupi: ' +
        'terminal cijeloj grupi šalje SIGTTIN i oba opet stoje.',
      capCj_4: 'Ovom poslu treba terminal, dakle fg: grupa 38450 postaje prednja, a SIGCONT je budi. Sada cat smije čitati.',
      capCj_5: 'Ctrl-C: SIGINT ide cijeloj prednjoj grupi, pa završavaju i cat i grep, a ne samo zadnja naredba cjevovoda.',

      capOther: 'Ništa se ne mijenja.',

      explain: '<p><b>Posao je grupa procesa.</b> Ljuska vodi popis onoga što je pokrenula: [[job]], s brojem uz znak ' +
        '<code translate="no">%</code>. Jezgra za isto zna drugo: PID svakog procesa i <i lang="en">process group</i> ' +
        '(grupa procesa) kojoj pripada. Svaki posao ljuska pokreće kao jednu grupu; svi procesi cjevovoda dijele je, a ' +
        'njezin broj (PGID) je PID prvoga. Broj posla nije PID.</p>' +
        '<p><b>Prednja grupa i tipke.</b> Terminal zna jednu prednju grupu. Ctrl-C šalje SIGINT, a Ctrl-Z SIGTSTP svakom ' +
        'procesu te grupe, i nikome drugom; pozadinski poslovi tipke ne vide. U ispisu ps-a prednja grupa ima ' +
        '<code translate="no">+</code> u stupcu STAT. <i lang="en">Foreground job</i> (prednji posao) je onaj koji ljuska ' +
        'čeka, <i lang="en">background job</i> (pozadinski posao) onaj koji ne čeka (<code translate="no">&</code>).</p>' +
        '<p><b>Obustavljen, bg, fg.</b> <i lang="en">Stopped job</i> (obustavljen posao) ima stanje T. ' +
        '<code translate="no">bg</code> mu šalje SIGCONT i ostavlja ga u pozadini; <code translate="no">fg</code> njegovu ' +
        'grupu čini prednjom (uz SIGCONT ako je stajao) i ljuska ga čeka. Zaustavljen proces signal ne prima dok ne nastavi: ' +
        'SIGTERM ili SIGHUP čeka na SIGCONT (samo SIGKILL djeluje odmah). Pozadinski posao koji pokuša čitati s terminala ' +
        'dobije SIGTTIN, cijela njegova grupa, i stane.</p>' +
        '<p><b>%+ i %-.</b> Tekući posao (<code translate="no">+</code>) je posljednji obustavljeni, a ako nijedan ne stoji, ' +
        'posljednji pokrenuti; <code translate="no">-</code> je sljedeći po istom pravilu. fg i bg bez broja uzimaju ' +
        '<code translate="no">%+</code>.</p>' +
        '<p><b>Što umire kad se odjaviš.</b> Zatvoren prozor je prekid veze: terminal ljusci šalje SIGHUP, a ' +
        'interaktivna ljuska ga prosljeđuje svim svojim poslovima (obustavljenima i SIGCONT, da ga prime) i izađe. ' +
        'Obustavljenim poslovima na izlasku šalje i SIGTERM, pa obustavljen posao ne spašava ni nohup. ' +
        'Preživi proces koji SIGHUP zanemaruje (<code translate="no">nohup</code>) i posao koji je ljuska zaboravila ' +
        '(<code translate="no">disown</code>); [[parent process]] mu postaje PID 1. <code translate="no">exit</code> nije ' +
        'prekid veze: uz obustavljene poslove ljuska prvo upozori, drugi exit njima pošalje SIGTERM, a pozadinski poslovi ' +
        'ostaju, osim ako je ljuska za prijavu s uključenim <code translate="no">huponexit</code>.</p>' +
        '<p><b>Zablude.</b> „Broj posla je PID”: nije, to su dva brojača. „& čuva posao nakon odjave”: ne čuva, to ' +
        'rade nohup i disown. „Ctrl-C prekida samo zadnju naredbu cjevovoda”: ide cijeloj prednjoj grupi.</p>' +
        '<p><b>Izvan ovog simulatora:</b> funkcije za hvatanje signala i <code translate="no">trap</code> (simulatori ' +
        'lnx-signals i lnx-subshell-trap), [[session]] i setsid, wait, programi koji drže sjednice nakon odjave.</p>'
    },
    en: {
      stage: 'Terminal, shell, process groups and the signals between them',

      script: 'Scenario',
      nohup: 'Second job under nohup',
      huponexit: 'shopt huponexit',
      login: 'Login shell',
      notUsedNohup: 'Only the "Close the window" scenario has a second job.',
      notUsedExit: 'Only the "exit or close" scenario leaves with exit.',

      presetP1: 'Example 1 from the book',
      presetP1Hint: 'sleep 300 &, jobs, ps, kill %1',
      presetCz: 'Ctrl-Z, bg, fg',
      presetCzHint: 'stop, to the background, to the front, Ctrl-C',
      presetZp: 'Close the window',
      presetZpHint: '& and nohup &, then close the window',
      presetEz: 'exit or close',
      presetEzHint: 'exit with a stopped job; login and huponexit',
      presetCj: 'Pipeline',
      presetCjHint: 'cat | grep x: two processes, one group',

      legChanged: 'changed in this step',
      legGroup: 'process group (one job)',
      legFg: 'the terminal\'s foreground group',
      legSleep: 'S: waiting',
      legStopped: 'T: stopped',
      legGone: 'ended',
      legSignal: 'a signal and where it goes',

      termTitle: 'Terminal',
      termClosed: 'the window is closed',
      termExited: 'the shell has exited, the window closes',
      newTerm: 'a new window',
      keyClose: 'close the window',
      keysLabel: 'Keys and window',

      sigTitle: 'Signals in this step',
      sigNone: 'No signal travels in this step.',
      fromTerminal: 'terminal',
      fromShell: 'shell',
      toGroup: 'to group {pgid}',
      toPid: 'to process {pid}',
      actTerminated: 'ends',
      actStopped: 'stopped',
      actContinued: 'continues',
      actIgnored: 'ignores',
      actNothing: 'nothing',
      actCaught: 'catches',
      actPending: 'pending while stopped',
      actReleased: 'continues and ends of {sig}',
      pendingTag: 'pending:',
      reachedNone: 'no one is left',

      treeTitle: 'Processes by group',
      groupOf: 'group {pgid}',
      jobTag: 'job',
      shellTag: 'shell',
      fgBadge: 'foreground',
      initTitle: 'parent PID 1',
      shellGone: 'shell {pid} has ended',

      jobsTitle: 'The shell\'s job table',
      jobsEmpty: 'No jobs.',
      jobsNoShell: 'No shell, so no job table either.',
      fgTag: 'in front',
      psTitle: 'Process table (ps)',

      capP1_0: 'Shell 38423 waits for a command. What it starts becomes its [[job]]: a job number in the shell and, like ' +
        'any process, a PID in the kernel.',
      capP1_1: '& means: do not wait. The shell prints [1] 38450 and the prompt at once. 1 is the job number, 38450 the PID; ' +
        'the job is also its own process group 38450.',
      capP1_2: 'jobs is the shell\'s list: [1]+ Running. The + marks the current job, the one fg and bg take when given no number.',
      capP1_3: 'ps sees the same process from the kernel: PID 38450, parent 38423, state S. No + in STAT: it is not in the ' +
        'terminal\'s foreground group, so the keys do not reach it.',
      capP1_4: 'kill %1 names the job, and the shell sends SIGTERM to its whole group. The default action terminates; ' +
        'after sleep 1 the shell reports Terminated and drops the job from its list.',

      capCz_0: 'This time sleep 300 runs without &, so the shell will wait. Watch the foreground badge: whom the terminal ' +
        'sends its keys to.',
      capCz_1: 'A foreground job: the shell waits and prints no prompt. The terminal\'s foreground group is now 38450 ' +
        '(STAT S+), not the shell.',
      capCz_2: 'Ctrl-Z: the terminal sends SIGTSTP to the foreground group. sleep is stopped (T); the shell sees it, prints ' +
        'Stopped and takes the terminal back.',
      capCz_3: 'bg sends SIGCONT to group 38450: the job continues, but in the background. The prompt is back at once and ' +
        'the keys go to the shell.',
      capCz_4: 'fg brings the job to the front: group 38450 is the foreground group again and the shell waits. No signal ' +
        'is needed, the job is already running.',
      capCz_5: 'Ctrl-C: SIGINT to the foreground group; the default action terminates. For a foreground job ended by ' +
        'Ctrl-C the shell prints no notice; the prompt is its own again.',

      capZp_0: 'Two identical jobs: one with & only, one under nohup (the switch on the right). Then the window closes. ' +
        'What survives?',
      capZp_1: '[1] 38450 runs in the background, in its own group. & changes nothing about signals; the shell just does ' +
        'not wait.',
      capZp_2: 'Before starting the second sleep, nohup set its SIGHUP to ignore and sent its output to nohup.out. To the ' +
        'shell it is job [2] like any other.',
      capZp_2off: 'The second sleep 300 & starts without nohup: two jobs with the same dispositions, both with the default ' +
        'action for SIGHUP.',
      capZp_3: 'The window is closed: the shell passes SIGHUP on to every job. The sleep under nohup ignores it and keeps ' +
        'running, now with parent PID 1.',
      capZp_3off: 'The window is closed: the shell passes SIGHUP on to every job. Without nohup both sleeps take the ' +
        'default action and end; & did not protect them.',
      capZp_4: 'In a new window ps finds only 38485, with parent 1; 38450 is gone. The shell that kept the jobs is gone ' +
        'too, and its job numbers with it.',
      capZp_4off: 'In a new window ps prints only the header: no job survived the closing of the window.',

      capEz_0: 'The same sleep 300 &, but the shell is left with exit, not by closing the window. Next to it, one stopped job.',
      capEz_1: '[1] 38450 runs in the background.',
      capEz_2: 'sleep 600 is foreground job [2], group 38452; the shell waits.',
      capEz_3: 'Ctrl-Z stops [2] (T); [1] in the background never saw the key. The current job (+) is now the stopped [2].',
      capEz_4: 'exit is not a hang-up. The shell has a stopped job, so it warns "There are stopped jobs." and stays. No ' +
        'signal is sent.',
      capEz_5: 'The second exit: the shell sends the stopped job SIGTERM, but a stopped process only receives it once it ' +
        'continues, so SIGCONT follows. [1] only gets a new parent, PID 1: exit sends no SIGHUP.',
      capEz_5hup: 'A login shell with huponexit: on its way out it sends SIGHUP to every job, and SIGCONT to the stopped ' +
        'one so it receives it. Both sleeps end.',
      capEz_6: 'In a new window 38450 is still running, its parent is 1. The & job survived exit; closing the window ' +
        'would have ended it.',
      capEz_6hup: 'In a new window ps prints only the header. Turn login or huponexit off and go back to step 5: the job stays.',

      capCj_0: 'The pipeline cat | grep x: two processes, one job. cat reads the terminal, grep the pipe.',
      capCj_1: 'Both processes are in group 38450 (the PGID is the first one\'s PID, cat\'s), and that group is in the ' +
        'foreground: both show + in STAT.',
      capCj_2: 'Ctrl-Z does not signal \'the program\' but the whole foreground process group: both cat and grep are ' +
        'stopped (state T).',
      capCj_3: 'bg: SIGCONT to the group, the job continues in the background. But cat reads the terminal at once while ' +
        'not in the foreground group: the terminal sends SIGTTIN to the whole group and both stop again.',
      capCj_4: 'This job needs the terminal, so fg: group 38450 becomes the foreground group, and SIGCONT wakes it. Now cat ' +
        'may read.',
      capCj_5: 'Ctrl-C: SIGINT goes to the whole foreground group, so both cat and grep end, not just the last command of ' +
        'the pipeline.',

      capOther: 'Nothing changes.',

      explain: '<p><b>A job is a process group.</b> The shell keeps a list of what it started: its [[job]]s, numbered ' +
        'after a <code translate="no">%</code>. The kernel knows something else about the same thing: each process\'s PID ' +
        'and the <i>process group</i> it belongs to. The shell starts every job as one group; all processes of a pipeline ' +
        'share it, and its number (PGID) is the PID of the first one. The job number is not a PID.</p>' +
        '<p><b>The foreground group and the keys.</b> A terminal knows one foreground group. Ctrl-C sends SIGINT and ' +
        'Ctrl-Z sends SIGTSTP to every process of that group, and to no one else; background jobs never see the keys. In ' +
        'ps the foreground group has a <code translate="no">+</code> in STAT. A <i>foreground job</i> is one the shell ' +
        'waits for, a <i>background job</i> one it does not (<code translate="no">&</code>).</p>' +
        '<p><b>Stopped, bg, fg.</b> A <i>stopped job</i> has state T. <code translate="no">bg</code> sends it SIGCONT ' +
        'and leaves it in the background; <code translate="no">fg</code> makes its group the foreground group (with ' +
        'SIGCONT if it was stopped) and the shell waits for it. A stopped process receives no signal until it continues: ' +
        'SIGTERM or SIGHUP waits for SIGCONT (only SIGKILL acts at once). A background job that tries to read the terminal gets ' +
        'SIGTTIN, its whole group does, and stops.</p>' +
        '<p><b>%+ and %-.</b> The current job (<code translate="no">+</code>) is the most recently stopped one, or if ' +
        'none is stopped, the most recently started one; <code translate="no">-</code> is the next by the same rule. fg ' +
        'and bg with no number take <code translate="no">%+</code>.</p>' +
        '<p><b>What dies when you log out.</b> A closed window is a hang-up: the terminal sends SIGHUP to the shell, and ' +
        'an interactive shell passes it on to all its jobs (stopped ones also get SIGCONT, so they receive it) and exits. ' +
        'To stopped jobs it also sends SIGTERM on its way out, so not even nohup saves a stopped job. ' +
        'A process that ignores SIGHUP (<code translate="no">nohup</code>) survives, and so does a job the shell has ' +
        'forgotten (<code translate="no">disown</code>); its [[parent process]] becomes PID 1. ' +
        '<code translate="no">exit</code> is not a hang-up: with stopped jobs the shell warns first, a second exit sends ' +
        'them SIGTERM, and background jobs stay, unless it is a login shell with <code translate="no">huponexit</code> ' +
        'set.</p>' +
        '<p><b>Misconceptions.</b> "The job number is the PID": no, they are two different counters. "& keeps a job ' +
        'alive after logout": it does not, nohup and disown do. "Ctrl-C kills only the last command of a pipeline": it ' +
        'goes to the whole foreground group.</p>' +
        '<p><b>Beyond this simulator:</b> signal handlers and <code translate="no">trap</code> (the simulators ' +
        'lnx-signals and lnx-subshell-trap), the [[session]] and setsid, wait, programs that keep sessions alive after ' +
        'logout.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
