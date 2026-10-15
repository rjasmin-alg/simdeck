/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-selinux-decision, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node in captions: commands, types and paths are shown as code), an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle come from sim.json. Commands, contexts, types, paths and mode names are data, not words. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Put odluke: proces, dozvole, politika SELinuxa, način rada, ishod',
      // panel
      scene: 'Situacija',
      sPort: 'sshd na portu 8991',
      sKeys: 'sshd čita ključeve',
      sSecret: 'tuđa datoteka',
      mode: 'Način rada na početku',
      modeEnforcing: 'enforcing',
      modePermissive: 'permissive',
      fix: 'Nakon prvog pokušaja',
      fixNone: 'ništa',
      fixRelabel: 'ispravi oznaku',
      fixSetenforce: 'setenforce 0',
      fixHint: 'Ispravak oznake: semanage port -a za port, restorecon za datoteku.',
      undo: 'Pa natrag na enforcing',
      undoSetenforce: 'setenforce 1',
      undoReboot: 'ponovno podizanje',
      dacOk: 'Ostali smiju čitati (r)',
      dacOkHint: 'Bit r za ostale u dozvolama datoteke /tmp/plan.txt.',
      dacOkOff: 'Samo za tuđu datoteku: port nema bitove dozvola, a ključeve sshd čita kao njihov vlasnik.',
      pPort: 'sshd na 8991: politika kaže ne',
      pPermissive: 'setenforce 0: prekidač, a ne popravak',
      pMvLabel: 'mv zadržava oznaku',
      pDacFirst: 'Dozvole prve kažu ne',
      // legend
      legendYes: 'provjera kaže da',
      legendNo: 'provjera kaže ne',
      legendSkip: 'nije pitano',
      legendAvc: 'novi AVC zapis',
      legendChanged: 'promijenjeno u ovom koraku',
      // stage
      cmdLabel: 'Naredba ovog koraka',
      noCmd: 'Ništa se ne upisuje.',
      readsKeys: 'Prijava ključem: sshd čita ključeve.',
      boots: 'Stroj se podiže; sshd se pokreće sam.',
      before: 'Polazno stanje.',
      proc: 'Proces',
      uid: 'UID {uid} ({user})',
      wants: 'traži',
      gate1: 'Dozvole',
      gate1Who: 'postavlja: vlasnik',
      gate2: 'Politika SELinuxa',
      gate2Who: 'postavlja: politika sustava',
      gateMode: 'Način rada',
      gateModeWho: 'pri podizanju:',
      outcome: 'Ishod',
      yes: 'da',
      no: 'ne',
      notAsked: 'nije pitano',
      waiting: 'čeka',
      clsOwner: 'vlasnik',
      clsGroup: 'grupa',
      clsOther: 'ostali',
      dacAs: '{user} je ovdje: {cls}',
      dacNeed: 'treba r',
      dacPort: 'port ≥ 1024: smije svaki proces',
      ruleN: 'pravilo #{n}',
      noRule: 'nema pravila',
      enforces: 'provodi i bilježi',
      letsThrough: 'propušta, ali bilježi',
      allowed: 'dopušteno',
      denied: 'odbijeno',
      allowedLogged: 'dopušteno, odbijanje zabilježeno',
      object: 'Objekt',
      objPort: 'TCP port {port}',
      portTable: 'Oznake portova',
      newFile: 'nova datoteka',
      inode: 'inode {n}',
      fileGone: '(zamijenjena)',
      seen: 'Što se vidi',
      keyLogin: 'Prijava ključem:',
      loginOk: 'uspjela',
      loginNo: 'ne uspijeva',
      loginNotYet: 'još nije pokušana',
      notRunYet: 'još nije pokrenuto',
      fileText: '(sadržaj datoteke)',
      policyTitle: 'Politika: pravila allow (izvadak)',
      colSrc: 'izvor',
      colTgt: 'cilj',
      colClass: 'klasa',
      colPerm: 'radnja',
      implicit: 'nijedno pravilo ne odgovara',
      markWin: 'odgovara',
      markSkip: 'nije čitano',
      notConsulted: 'Politika nije pitana: dozvole su već rekle ne.',
      auditTitle: 'Revizijski zapisnik',
      auditEmpty: 'nema zapisa',
      // captions
      cStartPort: '`sshd_config` traži `Port 22` i `Port 8991`, a sshd zasad sluša samo na 22. Sljedeći korak ga pokreće iznova.',
      cStartKeys: 'Datoteka {path} nosi oznaku {type}. Prvo je kopiramo u `/tmp`, pa premjestimo natrag.',
      cStartSecret: 'Datoteka {path} pripada korisnici ana. Korisnik student je pokušava pročitati.',
      cCp: '{cmd}: kopija je nova datoteka i dobiva oznaku za svoje novo mjesto, {type}. Izvornik i dalje nosi {old}.',
      cMv: '{cmd}: premještanje ne stvara novu datoteku, pa oznaka ide s njom. Staro mjesto, staro ime — a oznaka {type}.',
      cSemanage: '{cmd}: port {port} sada nosi oznaku {type}. Pravila politike nisu se promijenila, promijenila se oznaka objekta.',
      cRestorecon: '{cmd}: tip se vraća na zadani za tu stazu, {type}. Korisnik, uloga i razina ostaju.',
      cRestoreconSame: '{cmd}: datoteka već nosi zadanu oznaku za tu stazu, pa se ništa ne mijenja.',
      cSetenforce0: '{cmd}: trenutačni način rada je sada `permissive`. U `/etc/selinux/config` i dalje piše `enforcing`.',
      cSetenforce1: '{cmd}: trenutačni način rada je opet `enforcing`.',
      cSetenforceSame: '{cmd}: način rada je već {mode}, pa se ništa ne mijenja.',
      cReboot: '{cmd}: pri podizanju se način rada čita iz `/etc/selinux/config`, a ondje piše `enforcing`. Promjena naredbom `setenforce` nije preživjela.',
      cAttemptPort: '{comm} (tip {type}) pokušava zauzeti TCP port {port}: radnja {perm} nad klasom {tclass}.',
      cAttemptBoot: 'Nakon podizanja sshd se pokreće sam i opet pokušava zauzeti port {port}.',
      cAttemptKeys: 'Korisnik student se prijavljuje ključem: {comm} (tip {type}) čita {path} s pravima korisnika student — radnja {perm} nad klasom {tclass}.',
      cAttemptSecret: '{comm} (tip {type}, korisnik student) pokušava čitati {path}: radnja {perm} nad klasom {tclass}.',
      cDacPort: 'Dozvole: port nema bitove dozvola, a {port} je iznad 1023, pa ga smije zauzeti svaki proces. Prva provjera kaže da.',
      cDacYes: 'Dozvole: za ovu datoteku {user} je u klasi „{cls}”, a ta klasa ima {bits} — r je tu. Prva provjera kaže da.',
      cDacNo: 'Dozvole: za ovu datoteku {user} je u klasi „{cls}”, a ta klasa ima {bits} — nema r. Prva provjera kaže ne, pa se SELinux uopće ne pita.',
      cMacNoBind: 'Dozvole kažu da, politika kaže ne: {src} se ne smije vezati na {tgt}.',
      cMacNoRead: 'Dozvole kažu da, politika kaže ne: {src} ne smije čitati {tgt}.',
      cMacYes: 'Politika ima pravilo #{n} za par {src} → {tgt}. I druga provjera kaže da.',
      cModeEnf: 'Način rada `enforcing`: odbijanje se provodi i bilježi u revizijski zapisnik, s `permissive=0`.',
      cModePerm: 'U načinu `permissive` radnja prolazi, ali odbijanje je i dalje zabilježeno — pravilo se nije promijenilo.',
      cOutPortNo: 'Ishod: odbijeno. sshd i dalje radi (`is-active` kaže `active`) i sluša samo na 22. Nijedan od ovih ispisa ne kaže zašto; razlog je u AVC zapisu.',
      cOutPortYes: 'Ishod: dopušteno. `ss` pokazuje 8991 i 22 — a postavka u `sshd_config` nije se promijenila ni za znak.',
      cOutPortPerm: 'Ishod: `ss` pokazuje 8991 i 22, ali oznaku `ssh_port_t` i dalje nosi samo port 22. To je prekidač, a ne popravak.',
      cOutKeysNo: 'Ishod: sshd ne smije pročitati ključeve, pa prijava ključem ne uspijeva. `ls -l` ne pokazuje ništa neobično; razliku vidi samo `ls -Z`.',
      cOutKeysYes: 'Ishod: sshd čita ključeve i prijava ključem uspijeva.',
      cOutKeysPerm: 'Ishod: prijava uspijeva, ali odbijanje je zabilježeno: oznaka je i dalje {type}.',
      cOutSecretNo: 'Ishod: `cat` javlja `Permission denied`. U revizijskom zapisniku nema ničega: „ne” su rekle dozvole, a ne SELinux.',
      cOutSecretYes: 'Ishod: dopušteno — obje provjere kažu da.',
      nPermNoHelp: 'Ni `permissive` tu ne pomaže: SELinux nije ni pitan.',
      explain: '<p>Dvije provjere, ne jedna umjesto druge. Prva je [[file permission]]: odgovara na pitanje smije li <b>ovaj korisnik</b> ' +
        'nešto nad <b>ovom datotekom</b>, a odgovor postavlja vlasnik — zato je diskrecijska. Druga je [[mandatory access control]]: ' +
        'odgovara na pitanje smije li <b>ovaj program</b> obaviti <b>ovu radnju</b>, a odgovor postavlja [[policy]] sustava. ' +
        'Dozvole se provjeravaju prvo; kad običan korisnik čita datoteku i dozvole kažu ne, SELinux se ne pita i ništa se ne bilježi. Ako kažu da, politika i dalje ' +
        'može reći ne.</p>' +
        '<p>Politika odlučuje po oznakama. Uz proces i uz objekt stoji [[security context]], niz <code>user:role:type[:range]</code>; ' +
        'odluka gleda samo <b>tip</b>: smije li <code>sshd_t</code> obaviti radnju <code>name_bind</code> nad portom tipa ' +
        '<code>unreserved_port_t</code>? Popravak zato najčešće mijenja oznaku objekta: <code>semanage port -a</code> za ' +
        'port, <code>restorecon</code> za datoteku. Oznaka pripada samoj datoteci: <code>cp</code> stvara novu datoteku s ' +
        'oznakom novog mjesta, a <code>mv</code> nosi staru oznaku sa sobom.</p>' +
        '<p>Treći je dio [[SELinux mode]]: u načinu <code>enforcing</code> odbijanje se provodi i bilježi; u načinu <code>permissive</code> ' +
        'radnja prolazi, a odbijanje se i dalje bilježi. Način rada ne mijenja <b>koji</b> bi pristup politika odbila. ' +
        'Zapis o tome je [[AVC denial]]: <code>denied { name_bind }</code>, <code>comm</code>, <code>scontext</code>, ' +
        '<code>tcontext</code>, <code>tclass</code>. <code>setenforce</code> mijenja samo trenutačni način rada; onaj pri ' +
        'podizanju piše u <code>/etc/selinux/config</code>.</p>' +
        '<p>Česte zablude: „<code>setenforce 0</code> je to popravio” (odbijanje se samo ne provodi); „dobri ' +
        '<code>rwx</code> znače da je pristup dopušten” (politika i dalje pita); „SELinux zamjenjuje dozvole” (dodaje ' +
        'drugu provjeru).</p>' +
        '<p>Šire o temi: politika predviđa i prekidače (svaki je [[policy boolean]]) koji uključuju pravila koja već postoje. ' +
        'Pravila ovdje su mali izvadak; stvarna politika ih ima mnogo tisuća.</p>'
    },
    en: {
      stage: 'The decision path: process, permissions, SELinux policy, mode, outcome',
      scene: 'Situation',
      sPort: 'sshd on port 8991',
      sKeys: 'sshd reads the keys',
      sSecret: 'someone else\'s file',
      mode: 'Mode at the start',
      modeEnforcing: 'enforcing',
      modePermissive: 'permissive',
      fix: 'After the first attempt',
      fixNone: 'nothing',
      fixRelabel: 'fix the label',
      fixSetenforce: 'setenforce 0',
      fixHint: 'Fixing the label: semanage port -a for the port, restorecon for a file.',
      undo: 'Then back to enforcing',
      undoSetenforce: 'setenforce 1',
      undoReboot: 'reboot',
      dacOk: 'Others may read (r)',
      dacOkHint: 'The r bit for others in the permissions of /tmp/plan.txt.',
      dacOkOff: 'Only for someone else\'s file: a port has no permission bits, and sshd reads the keys as their owner.',
      pPort: 'sshd on 8991: the policy says no',
      pPermissive: 'setenforce 0: a switch, not a fix',
      pMvLabel: 'mv keeps the label',
      pDacFirst: 'Permissions say no first',
      legendYes: 'check says yes',
      legendNo: 'check says no',
      legendSkip: 'not asked',
      legendAvc: 'new AVC record',
      legendChanged: 'changed in this step',
      cmdLabel: 'This step\'s command',
      noCmd: 'Nothing is typed.',
      readsKeys: 'A key login: sshd reads the keys.',
      boots: 'The machine boots; sshd starts by itself.',
      before: 'The starting state.',
      proc: 'Process',
      uid: 'UID {uid} ({user})',
      wants: 'wants',
      gate1: 'Permissions',
      gate1Who: 'set by: the owner',
      gate2: 'SELinux policy',
      gate2Who: 'set by: the system policy',
      gateMode: 'Mode',
      gateModeWho: 'at boot:',
      outcome: 'Outcome',
      yes: 'yes',
      no: 'no',
      notAsked: 'not asked',
      waiting: 'waiting',
      clsOwner: 'owner',
      clsGroup: 'group',
      clsOther: 'others',
      dacAs: '{user} is here: {cls}',
      dacNeed: 'needs r',
      dacPort: 'port ≥ 1024: any process may',
      ruleN: 'rule #{n}',
      noRule: 'no rule',
      enforces: 'enforces and logs',
      letsThrough: 'lets it through, logs it',
      allowed: 'allowed',
      denied: 'denied',
      allowedLogged: 'allowed, denial logged',
      object: 'Object',
      objPort: 'TCP port {port}',
      portTable: 'Port labels',
      newFile: 'new file',
      inode: 'inode {n}',
      fileGone: '(replaced)',
      seen: 'What you see',
      keyLogin: 'Key login:',
      loginOk: 'works',
      loginNo: 'fails',
      loginNotYet: 'not tried yet',
      notRunYet: 'not run yet',
      fileText: '(the file\'s contents)',
      policyTitle: 'Policy: allow rules (an excerpt)',
      colSrc: 'source',
      colTgt: 'target',
      colClass: 'class',
      colPerm: 'action',
      implicit: 'no rule matches',
      markWin: 'matches',
      markSkip: 'not read',
      notConsulted: 'The policy was not asked: the permissions already said no.',
      auditTitle: 'Audit log',
      auditEmpty: 'no records',
      cStartPort: '`sshd_config` asks for `Port 22` and `Port 8991`, and sshd listens only on 22 so far. The next step restarts it.',
      cStartKeys: 'The file {path} carries the label {type}. First we copy it to `/tmp`, then move it back.',
      cStartSecret: 'The file {path} belongs to the user ana. The user student tries to read it.',
      cCp: '{cmd}: the copy is a new file and gets the label for its new place, {type}. The original still carries {old}.',
      cMv: '{cmd}: a move does not create a new file, so the label goes with it. The old place, the old name — and the label {type}.',
      cSemanage: '{cmd}: port {port} now carries the label {type}. The policy\'s rules have not changed; the object\'s label has.',
      cRestorecon: '{cmd}: the type goes back to the default for that path, {type}. User, role and range stay.',
      cRestoreconSame: '{cmd}: the file already carries the default label for that path, so nothing changes.',
      cSetenforce0: '{cmd}: the current mode is now `permissive`. `/etc/selinux/config` still says `enforcing`.',
      cSetenforce1: '{cmd}: the current mode is `enforcing` again.',
      cSetenforceSame: '{cmd}: the mode is already {mode}, so nothing changes.',
      cReboot: '{cmd}: at boot the mode is read from `/etc/selinux/config`, which says `enforcing`. The change made with `setenforce` did not survive.',
      cAttemptPort: '{comm} (type {type}) tries to bind TCP port {port}: the action {perm} on the class {tclass}.',
      cAttemptBoot: 'After the boot sshd starts by itself and tries to bind port {port} again.',
      cAttemptKeys: 'The user student logs in with a key: {comm} (type {type}) reads {path} with the user student\'s rights — the action {perm} on the class {tclass}.',
      cAttemptSecret: '{comm} (type {type}, user student) tries to read {path}: the action {perm} on the class {tclass}.',
      cDacPort: 'Permissions: a port has no permission bits, and {port} is above 1023, so any process may bind it. The first check says yes.',
      cDacYes: 'Permissions: for this file {user} falls in the “{cls}” class, which has {bits} — r is there. The first check says yes.',
      cDacNo: 'Permissions: for this file {user} falls in the “{cls}” class, which has {bits} — no r. The first check says no, so SELinux is not even asked.',
      cMacNoBind: 'Permissions say yes, the policy says no: {src} may not bind to {tgt}.',
      cMacNoRead: 'Permissions say yes, the policy says no: {src} may not read {tgt}.',
      cMacYes: 'The policy has rule #{n} for the pair {src} → {tgt}. The second check says yes too.',
      cModeEnf: '`enforcing` mode: the denial is enforced and logged in the audit log, with `permissive=0`.',
      cModePerm: 'In `permissive` mode the action goes through, but the denial is still logged — the rule hasn\'t changed.',
      cOutPortNo: 'Outcome: denied. sshd still runs (`is-active` says `active`) and listens only on 22. None of these outputs says why; the AVC record does.',
      cOutPortYes: 'Outcome: allowed. `ss` shows 8991 and 22 — and the setting in `sshd_config` did not change by a single character.',
      cOutPortPerm: 'Outcome: `ss` shows 8991 and 22, but only port 22 still carries the label `ssh_port_t`. This is a switch, not a fix.',
      cOutKeysNo: 'Outcome: sshd may not read the keys, so the key login fails. `ls -l` shows nothing unusual; only `ls -Z` shows the difference.',
      cOutKeysYes: 'Outcome: sshd reads the keys and the key login works.',
      cOutKeysPerm: 'Outcome: the login works, but the denial is logged: the label is still {type}.',
      cOutSecretNo: 'Outcome: `cat` reports `Permission denied`. The audit log has nothing: the permissions said no, not SELinux.',
      cOutSecretYes: 'Outcome: allowed — both checks say yes.',
      nPermNoHelp: '`permissive` does not help here either: SELinux was not even asked.',
      explain: '<p>Two checks, not one instead of the other. A [[file permission]] answers whether <b>this user</b> may do ' +
        'something to <b>this file</b>, and the owner sets the answer — that is why it is discretionary. ' +
        'The second, [[mandatory access control]], answers whether <b>this program</b> may perform <b>this action</b>, and the system ' +
        '[[policy]] sets the answer. Permissions are checked first; when an ordinary user reads a file and they say no, SELinux is not asked and ' +
        'nothing is logged. If they say yes, the policy can still say no.</p>' +
        '<p>The policy decides by labels. A [[security context]] is a string <code>user:role:type[:range]</code> on a ' +
        'process and on an object; the decision looks only at the <b>type</b>: may <code>sshd_t</code> do ' +
        '<code>name_bind</code> on a port of type <code>unreserved_port_t</code>? A fix therefore usually changes the ' +
        'object\'s label: <code>semanage port -a</code> for a port, <code>restorecon</code> for a file. The label belongs ' +
        'to the file itself: <code>cp</code> makes a new file with the label of its new place, <code>mv</code> carries ' +
        'the old label along.</p>' +
        '<p>The third part is the [[SELinux mode]]: in <code>enforcing</code> a denial is enforced and logged; in <code>permissive</code> the ' +
        'action goes through and the denial is still logged. The mode does not change <b>which</b> access the policy ' +
        'would deny. The record of it is an [[AVC denial]]: <code>denied { name_bind }</code>, <code>comm</code>, ' +
        '<code>scontext</code>, <code>tcontext</code>, <code>tclass</code>. <code>setenforce</code> changes only the ' +
        'current mode; the boot mode is written in <code>/etc/selinux/config</code>.</p>' +
        '<p>Common mistakes: “<code>setenforce 0</code> fixed it” (the denial is just not enforced); “correct ' +
        '<code>rwx</code> means access is allowed” (the policy still asks); “SELinux replaces permissions” (it adds a ' +
        'second check).</p>' +
        '<p>Further: the policy also provides switches (each a [[policy boolean]]) that turn on rules it already has. ' +
        'The rules here are a small excerpt; the real policy has many thousands.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
