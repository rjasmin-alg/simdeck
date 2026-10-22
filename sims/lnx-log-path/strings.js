/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-log-path, in Croatian and English (docs/sim-ui.md §9). Same keys in both; {name} is a
   placeholder, [[term]] a glossary term. Commands, paths, selectors, field names and log lines are data and are written
   by the page with translate="no"; the words around them are here. */
(function (root) {
  var strings = {
    hr: {
      stage: 'Put jedne poruke: pošiljatelj, journald, rsyslog, pravila i odredišta',
      cmdLabel: 'Što se u ovom koraku događa',

      // params
      facility: 'Naprava',
      severity: 'Razina ozbiljnosti',
      storage: 'Storage= u journald.conf',
      storagePersistent: 'persistent',
      storageVolatile: 'volatile',
      remote: 'Šalji i na poslužitelj',
      serverUp: 'Poslužitelj prima',
      facUser: 'user (1)',
      facAuthpriv: 'authpriv (10)',
      facMail: 'mail (2)',
      facCron: 'cron (9)',
      facKern: 'kern (0)',
      facDaemon: 'daemon (3)',
      sev0: '0 emerg',
      sev1: '1 alert',
      sev2: '2 crit',
      sev3: '3 err',
      sev4: '4 warning',
      sev5: '5 notice',
      sev6: '6 info',
      sev7: '7 debug',

      // presets
      pNotice: 'logger, user.notice',
      pAuthpriv: 'Prijava: authpriv.info',
      pDebug: 'user.debug: samo dnevnik',
      pEmerg: 'user.emerg: i na terminale',
      pCron: 'CROND: cron.info',
      pRemote: 'Poslužitelj ne prima',

      // legend
      legendToken: 'poruka',
      legendTakes: 'pravilo je uzima',
      legendNo: 'ne uzima',
      legendTerm: 'član koji odlučuje',
      legendChanged: 'promijenjeno u ovom koraku',

      // stations
      sender: 'Pošiljatelj',
      senderKernel: 'jezgra, preko kmsg',
      kernelName: 'Jezgra',
      notSent: 'poruka još nije poslana',
      facilityW: 'naprava',
      severityW: 'razina',
      journaldSub: 'dnevnik sustava',
      journalEmpty: 'još nema zapisa',
      lostAtReboot: 'nestaje pri ponovnom podizanju',
      onDisk: 'na disku',
      rsyslogSub: 'čita iz journalda',
      inputOn: 'uključen',
      inputOff: 'isključen',

      // rule table
      tableTitle: 'Pravila u /etc/rsyslog.conf, sva redom',
      tableTitleRemote: 'Pravila redom: 90-slanje.conf, pa /etc/rsyslog.conf',
      colSel: 'selektor',
      colAction: 'akcija',
      markTakes: 'uzima',
      noteSuspended: '⚠ obustavljena',

      // outputs
      outputs: 'Odredišta',
      noNew: 'ništa novo',
      terminals: 'terminali svih korisnika',
      server: 'poslužitelj',
      srvDown: 'prijam zaustavljen',
      srvUp: 'prijam radi',
      srvBack: 'prijam vraćen',
      onWire: 'redak putuje TCP-om',
      checked: ['u {time} ima {n} redak s oznakom klijent, trećeg nema', 'u {time} ima {n} retka s oznakom klijent, trećeg nema', 'u {time} ima {n} redaka s oznakom klijent, trećeg nema'],

      // records bar
      records: 'Gdje je ovaj događaj',
      recNone: 'još nigdje',
      recJournal: 'dnevnik sustava',
      recTerminals: 'terminali',
      recRemote: 'poslužitelj',
      recUnknown: 'ne zna se',
      recCount: ['{n} zapis', '{n} zapisa', '{n} zapisa'],

      // what happens (the line above the stations)
      sayKernel: 'jezgra piše poruku u kmsg',
      saySshd: 'sshd-session bilježi prijavu ključem',
      sayCrond: 'CROND bilježi pokrenuti satni posao',
      saySystemd: 'systemd bilježi pokrenutu sjednicu',

      // captions
      cStart: '{sender} na stroju {host} poslat će jednu poruku, {fs}. Prati je: pošiljatelj, journald, rsyslog, pa svako pravilo redom.',
      cEmitLogger: '{cmd} šalje poruku: naprava {fac} ({fn}), razina {sev} ({sn}). PRI = {fn} × 8 + {sn} = {pri}.',
      cEmitOther: '{sender} šalje poruku: naprava {fac} ({fn}), razina {sev} ({sn}). PRI = {fn} × 8 + {sn} = {pri}.',
      cEmitKernel: 'Jezgra piše poruku kroz kmsg: naprava kern (0), razina {sev} ({sn}). PRI = 0 × 8 + {sn} = {pri}.',
      cStore: 'journald prima svaku poruku i sprema zapis s poljima {prio} i {facf}, pod {path}.',
      cStoreVolatile: 'Uz Storage=volatile zapis je samo u memoriji i ne preživljava ponovno podizanje.',
      cStorePersistent: 'Uz Storage=persistent zapis je na disku.',
      cRead: 'rsyslog čita isti zapis iz journalda modulom imjournal; imuxsock je isključen (SysSock.Use="off"), pa drugog izvora nema. Isti PID, {pid}.',
      cReadKernel: 'rsyslog čita isti zapis iz journalda modulom imjournal; imuxsock je isključen (SysSock.Use="off"), pa drugog izvora nema.',
      cTermTakes: 'Pravilo {n}: član {term} uzima {fs}.',
      cTermNone: 'Pravilo {n}: član {term} vadi napravu {fac} iz ovog retka.',
      cTermWeaker: 'Pravilo {n}: član {term} uzima {lvl} i teže; razina {sev} ({sn}) blaža je od {lvl} ({ln}).',
      cTermOnlyEmerg: 'Pravilo {n}: član {term} uzima samo emerg (0), a razina {sev} ({sn}) nije emerg.',
      cTermNoFac: 'Pravilo {n}: selektor {sel} ne imenuje napravu {fac}.',
      cActFile: 'Redak se dopisuje u {file}.',
      cActUsers: 'Poruka ide na terminale svih prijavljenih korisnika.',
      cActFwdUp: 'Redak putuje TCP-om prema {target}.',
      cActFwdDown: 'Poslužitelj ne prima. U journaldu klijenta stoji: u 18:09:20 rsyslog je obustavio akciju (suspended) i ne može se spojiti na {target}.',
      cNoAct: 'Ništa se ne zapisuje.',
      cGoOn: 'Čitanje ide dalje: i sljedeća pravila mogu uzeti istu poruku.',
      cServerUp: 'Poslužitelj {srv} dopisuje redak u /var/log/messages, s imenom pošiljatelja {host} u retku.',
      cServerDown: 'U 18:09:58 rsyslog na klijentu nastavlja akciju (resumed). U 18:10:43 poslužitelj ima samo retke iz 18:08:39 i 18:09:03. Gdje je treća poruka, ne pokazuje nijedan ispis: to ovisi o redu čekanja.',
      cDone1: 'Samo jedan zapis, u dnevniku sustava: nijedno pravilo ne uzima {fs}, jer je razina {sev} ({sn}) blaža od svega što pravila traže.',
      cDone2: 'Jedan događaj, dva zapisa: rsyslog nije drugi izvor nego drugi ispis onoga što je journald primio.',
      cDone3: 'Jedan događaj, tri zapisa: svako pravilo koje ga uzme dodaje još jedan, i nijedno ne zaustavlja ostala.',
      cDone4: 'Jedan događaj, četiri zapisa: svako pravilo koje ga uzme dodaje još jedan, i nijedno ne zaustavlja ostala.',
      cDoneAuthpriv: 'authpriv.none vadi poruku iz retka za /var/log/messages, a authpriv.* je šalje u /var/log/secure.',
      cDoneRemoteDown: 'Zapisi na klijentu: {list}. Na poslužitelju te poruke u 18:10:43 nije bilo. Prekid se vidi na pošiljatelju, u njegovu journaldu; na poslužitelju samo ima manje redaka.',
      cDoneVolatile: 'Zapis u dnevniku traje samo do ponovnog podizanja (Storage=volatile).',

      explain:
        '<p>Na ovom stroju poruke ne idu u dva programa nego kroz dva programa, jedan za drugim. [[system journal]] vodi journald: on prima <b>svaku</b> poruku i sprema je kao skup polja (PRIORITY, SYSLOG_FACILITY, _PID…). rsyslog zatim čita isti zapis modulom imjournal, jer je lokalni socket isključen (SysSock.Use="off"). Zato jedan događaj daje dva zapisa s istim PID-om.</p>' +
        '<p>Svako pravilo u /etc/rsyslog.conf ima [[selector]] i <i lang="en">action</i> (akciju). Selektor je <i lang="en">facility</i> (naprava) i [[severity]], odvojene točkom: user, mail, cron, authpriv… ispred, a jedna od osam razina, 0 emerg … 7 debug, iza. Razina u selektoru uzima nju i sve teže: *.info uzima info do emerg, ali ne debug. * znači bilo koja, none nijedna; ; spaja članove u jednom retku, a za neku napravu odlučuje zadnji član koji je imenuje.</p>' +
        '<p>Pravila se čitaju redom i <b>svako</b> koje odgovara izvodi svoju akciju: poruka može završiti na dva mjesta. Nema prvog podudaranja.</p>' +
        '<p>Akcija omfwd šalje poruku drugom stroju ([[central logging]]): @ je UDP, @@ ili protocol="tcp" TCP. Kad poslužitelj ne prima, rsyslog na klijentu akciju obustavi pa nastavi i to zapiše u vlastiti journald; što je u međuvremenu bilo s porukom, ovisi o redu čekanja i ne vidi se ni u jednom ispisu.</p>' +
        '<p>Pošiljatelj ide uz napravu: user i mail šalje logger, authpriv sshd-session, cron CROND, kern jezgra (kroz kmsg), daemon systemd. Uz slanje na poslužitelj stroj je klijent democli1, a pravilo *.* šalje sve na 192.168.122.57:514 preko TCP-a.</p>' +
        '<p>Storage= u journald.conf odlučuje gdje je dnevnik: persistent na disku, pod /var/log/journal; volatile samo u memoriji, pod /run/log/journal, do ponovnog podizanja.</p>'
    },
    en: {
      stage: 'The path of one message: sender, journald, rsyslog, the rules and the outputs',
      cmdLabel: 'What happens in this step',

      facility: 'Facility',
      severity: 'Severity',
      storage: 'Storage= in journald.conf',
      storagePersistent: 'persistent',
      storageVolatile: 'volatile',
      remote: 'Also send to a server',
      serverUp: 'Server receiving',
      facUser: 'user (1)',
      facAuthpriv: 'authpriv (10)',
      facMail: 'mail (2)',
      facCron: 'cron (9)',
      facKern: 'kern (0)',
      facDaemon: 'daemon (3)',
      sev0: '0 emerg',
      sev1: '1 alert',
      sev2: '2 crit',
      sev3: '3 err',
      sev4: '4 warning',
      sev5: '5 notice',
      sev6: '6 info',
      sev7: '7 debug',

      pNotice: 'logger, user.notice',
      pAuthpriv: 'A login: authpriv.info',
      pDebug: 'user.debug: journal only',
      pEmerg: 'user.emerg: terminals too',
      pCron: 'CROND: cron.info',
      pRemote: 'Server not receiving',

      legendToken: 'message',
      legendTakes: 'the rule takes it',
      legendNo: 'no match',
      legendTerm: 'the deciding term',
      legendChanged: 'changed in this step',

      sender: 'Sender',
      senderKernel: 'the kernel, through kmsg',
      kernelName: 'The kernel',
      notSent: 'message not sent yet',
      facilityW: 'facility',
      severityW: 'severity',
      journaldSub: 'the system journal',
      journalEmpty: 'no entries yet',
      lostAtReboot: 'lost at reboot',
      onDisk: 'on disk',
      rsyslogSub: 'reads from journald',
      inputOn: 'on',
      inputOff: 'off',

      tableTitle: 'Rules in /etc/rsyslog.conf, all in order',
      tableTitleRemote: 'Rules in order: 90-slanje.conf, then /etc/rsyslog.conf',
      colSel: 'selector',
      colAction: 'action',
      markTakes: 'takes it',
      noteSuspended: '⚠ suspended',

      outputs: 'Outputs',
      noNew: 'nothing new',
      terminals: 'all users\' terminals',
      server: 'server',
      srvDown: 'reception stopped',
      srvUp: 'receiving',
      srvBack: 'reception back',
      onWire: 'the line travels over TCP',
      checked: ['at {time}: {n} line tagged klijent, no third', 'at {time}: {n} lines tagged klijent, no third'],

      records: 'Where this event is',
      recNone: 'nowhere yet',
      recJournal: 'system journal',
      recTerminals: 'terminals',
      recRemote: 'server',
      recUnknown: 'unknown',
      recCount: ['{n} record', '{n} records'],

      sayKernel: 'the kernel writes a message to kmsg',
      saySshd: 'sshd-session logs a key login',
      sayCrond: 'CROND logs an hourly job it started',
      saySystemd: 'systemd logs a session it started',

      cStart: '{sender} on {host} will send one message, {fs}. Follow it: sender, journald, rsyslog, then every rule in order.',
      cEmitLogger: '{cmd} sends the message: facility {fac} ({fn}), severity {sev} ({sn}). PRI = {fn} × 8 + {sn} = {pri}.',
      cEmitOther: '{sender} sends the message: facility {fac} ({fn}), severity {sev} ({sn}). PRI = {fn} × 8 + {sn} = {pri}.',
      cEmitKernel: 'The kernel writes the message through kmsg: facility kern (0), severity {sev} ({sn}). PRI = 0 × 8 + {sn} = {pri}.',
      cStore: 'journald receives every message and stores an entry with the fields {prio} and {facf}, under {path}.',
      cStoreVolatile: 'With Storage=volatile the entry is only in memory and does not survive a reboot.',
      cStorePersistent: 'With Storage=persistent the entry is on disk.',
      cRead: 'rsyslog reads the same entry from journald through imjournal; imuxsock is off (SysSock.Use="off"), so there is no second source. Same PID, {pid}.',
      cReadKernel: 'rsyslog reads the same entry from journald through imjournal; imuxsock is off (SysSock.Use="off"), so there is no second source.',
      cTermTakes: 'Rule {n}: the term {term} takes {fs}.',
      cTermNone: 'Rule {n}: the term {term} takes facility {fac} out of this line.',
      cTermWeaker: 'Rule {n}: the term {term} takes {lvl} and more severe; {sev} ({sn}) is less severe than {lvl} ({ln}).',
      cTermOnlyEmerg: 'Rule {n}: the term {term} takes only emerg (0), and severity {sev} ({sn}) is not emerg.',
      cTermNoFac: 'Rule {n}: the selector {sel} does not name facility {fac}.',
      cActFile: 'A line is appended to {file}.',
      cActUsers: 'The message goes to every logged-in user\'s terminal.',
      cActFwdUp: 'The line travels over TCP to {target}.',
      cActFwdDown: 'The server is not receiving. The client\'s journal shows: at 18:09:20 rsyslog suspended the action and cannot connect to {target}.',
      cNoAct: 'Nothing is written.',
      cGoOn: 'Reading goes on: later rules can take the same message too.',
      cServerUp: 'The server {srv} appends the line to /var/log/messages, with the sender\'s name {host} in the line.',
      cServerDown: 'At 18:09:58 rsyslog on the client resumes the action. At 18:10:43 the server has only the lines from 18:08:39 and 18:09:03. Where the third message is, no output shows: that depends on the queue.',
      cDone1: 'Only one record, in the system journal: no rule takes {fs}, because {sev} ({sn}) is less severe than anything the rules ask for.',
      cDone2: 'One event, two records: rsyslog isn\'t a second source but a second copy of what journald received.',
      cDone3: 'One event, three records: every rule that takes it adds one more, and none stops the others.',
      cDone4: 'One event, four records: every rule that takes it adds one more, and none stops the others.',
      cDoneAuthpriv: 'authpriv.none takes the message out of the /var/log/messages line, and authpriv.* sends it to /var/log/secure.',
      cDoneRemoteDown: 'Records on the client: {list}. On the server the message was not there at 18:10:43. The break shows on the sender, in its journald; the server just has fewer lines.',
      cDoneVolatile: 'The journal entry lasts only until a reboot (Storage=volatile).',

      explain:
        '<p>On this machine messages do not go to two programs but through two programs, one after the other. journald keeps the [[system journal]]: it receives <b>every</b> message and stores it as a set of fields (PRIORITY, SYSLOG_FACILITY, _PID…). rsyslog then reads the same entry through imjournal, because the local socket is off (SysSock.Use="off"). So one event gives two records with the same PID.</p>' +
        '<p>Every rule in /etc/rsyslog.conf has a [[selector]] and an action. The selector is a facility and a [[severity]], separated by a dot: user, mail, cron, authpriv… before it, one of eight levels, 0 emerg … 7 debug, after it. A severity in a selector takes itself and every more severe one: *.info takes info to emerg, but not debug. * means any, none means no message; ; joins terms on one line, and for a facility the last term that names it decides.</p>' +
        '<p>The rules are read in order and <b>every</b> rule that matches runs its action: a message can land in two places. There is no first match.</p>' +
        '<p>The omfwd action sends the message to another machine ([[central logging]]): @ is UDP, @@ or protocol="tcp" is TCP. When the server is not receiving, rsyslog on the client suspends the action, resumes it later and writes both into its own journald; what happened to the message in between depends on the queue and shows in no output.</p>' +
        '<p>The sender goes with the facility: user and mail come from logger, authpriv from sshd-session, cron from CROND, kern from the kernel (through kmsg), daemon from systemd. When sending to a server the machine is the client democli1, and the rule *.* sends everything to 192.168.122.57:514 over TCP.</p>' +
        '<p>Storage= in journald.conf decides where the journal lives: persistent on disk, under /var/log/journal; volatile only in memory, under /run/log/journal, until a reboot.</p>'
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = strings; else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
