/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-uac, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks them
   up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a
   kit/glossary.js term, *word* an English term in italics on the Croatian page (the page's rich() turns it into
   <em lang="en">). Names of accounts, groups, SIDs, privileges, processes, paths, integrity levels (Medium, High) and
   the Windows permission names (Full control, Read …) are data, shown as they are in both languages. The title and
   subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tokeni korisnika, procesi i provjera pristupa',

      // params
      pAccount: 'Tko se prijavljuje',
      optAdmin: 'ana, administratorica',
      optStandard: 'marko, standardni',
      optBuiltin: 'ugrađeni Administrator',
      pUac: 'UAC',
      pUacHint: 'Isključen: administrator dobiva jedan puni token, kao prije Viste.',
      pTask: 'Zadatak',
      task_progfiles: 'Pisanje u Program Files',
      task_hklm: 'Pisanje u HKLM\\SOFTWARE',
      task_timezone: 'Promjena vremenske zone',
      task_service: 'Zaustavljanje usluge',
      pChildren: 'Na kraju Notepad iz oba procesa',
      pChildrenHint: 'Povišena konzola i Explorer pokreću po jedan Notepad.',

      // presets
      presetFiltered: 'Administratorica bez podizanja',
      presetFilteredHint: 'Explorer ne smije pisati u Program Files; konzola nakon potvrde smije.',
      presetTimeZone: 'Vremenska zona',
      presetTimeZoneHint: 'Ovlast za vremensku zonu ostaje i u filtriranom tokenu.',
      presetStandard: 'Standardni korisnik',
      presetStandardHint: 'marko upisuje admin-it; proces radi kao admin-it.',
      presetChildren: 'Dijete nasljeđuje token',
      presetChildrenHint: 'Notepad iz povišene konzole je High, iz Explorera Medium.',
      presetOff: 'UAC isključen',
      presetOffHint: 'Jedan puni token: sve uspijeva bez upita, i ono što ana nije htjela.',

      // legend
      legSidOn: 'SID omogućen',
      legSidDeny: 'SID samo za zabranu',
      legPriv: 'ovlaštenje',
      legIl: 'razina integriteta M / H',
      legThin: 'filtrirani token',
      legThick: 'puni token',
      legVerdict: 'dopušteno ✓ / odbijeno ✕',
      legChanged: 'promijenjeno ili korišteno u ovom koraku',

      // logon header
      logonTitle: 'Prijava na {pc}',
      kindAdmin: 'član grupe Administrators',
      kindStandard: 'standardni korisnik',
      kindBuiltin: 'ugrađeni račun, RID 500',
      uacOn: 'UAC uključen',
      uacOff: 'UAC isključen',

      // token cards
      tokFiltered: 'Filtrirani token',
      tokFull: 'Puni token',
      tokStandard: 'Token standardnog korisnika',
      tokOfUser: 'korisnik {user}',
      ilLabel: 'integritet',
      sidsLabel: 'SID-ovi',
      privsLabel: 'Ovlaštenja',
      privsMore: ['+ još {n}', '+ još {n}', '+ još {n}'],
      denyOnlyTag: 'samo za zabranu',
      linked: 'povezani',
      notYet: 'Još nema tokena: {user} je na zaslonu za prijavu.',
      noFilteredOff: 'Nema filtriranog tokena: UAC je isključen.',
      noFilteredBuiltin: 'Nema filtriranog tokena: ugrađeni Administrator nije u načinu odobrenja administratora.',
      noFullStandard: 'Nema punog tokena: {user} nije administrator.',
      noFullYet: 'Puni token nastaje tek s upitom: korisničko ime i lozinka administratora.',

      // processes
      procsTitle: 'Procesi',
      procsNone: 'Još nema procesa.',
      procAs: 'kao {user}',
      procTokFiltered: 'filtrirani',
      procTokFull: 'puni',
      procTokStandard: 'standardni',
      elevatedTag: 'pokrenut kao administrator',
      attemptOk: 'dopušteno',
      attemptDenied: 'odbijeno',

      // the prompt
      promptTitle: 'Kontrola korisničkog računa',
      promptConsent: 'Dopustiti da cmd.exe mijenja ovo računalo?',
      promptCred: 'Za nastavak upiši korisničko ime i lozinku administratora.',
      promptYes: 'Da',
      promptNo: 'Ne',
      promptUser: 'korisnik',
      promptPass: 'lozinka',

      // the access check
      chkTitle: 'Provjera pristupa',
      chkNone: 'Još nema provjere. Zadatak: {task}.',
      chkWho: 'korak {n}: {proc} s tokenom {tok}',
      chkTarget: 'traži {need}',
      need_w: 'pisanje',
      need_s: 'zaustavljanje',
      kind_file: 'mapa',
      kind_key: 'ključ registra',
      kind_service: 'usluga',
      micLine: 'Integritet: proces {p}, objekt {o}',
      micPass: 'prolazi (pisanje nije prema gore)',
      micFail: 'odbijeno: pisanje prema višoj razini',
      colWho: 'Kome',
      colRights: 'Prava',
      colAction: 'Vrsta',
      colMark: 'Korak {n}',
      allow: 'dopusti',
      svcAll: 'sve (i zaustavljanje)',
      svcQuery: 'samo upit stanja',
      implicitDeny: 'nijedna stavka ne dopušta',
      deny: 'odbij',
      markWin: 'odlučuje',
      markSkip: 'nije čitano',
      noteDenyOnly: 'samo za zabranu: ne vrijedi',
      noteNoRight: 'ne pokriva {need}',
      noteAbsent: 'nije u tokenu',
      outOk: 'dopušteno',
      outDenied: 'odbijeno',
      privNeed: 'Zadatak traži ovlaštenje',
      privHeld: 'u tokenu: da',
      privMissing: 'u tokenu: ne',
      privNoAcl: 'Ovdje odlučuje ovlaštenje u tokenu, ne popis dozvola.',

      // task phrases in captions
      do_progfiles: 'pisanje u Program Files',
      do_hklm: 'pisanje u HKLM\\SOFTWARE',
      do_timezone: 'promjena vremenske zone',
      do_service: 'zaustavljanje usluge Spooler',

      // captions
      capStart_admin: 'ana je u grupi Administrators i prijavljuje se na {pc}. Zadatak: {task}. Pritisni → za prijavu.',
      capStart_standard: 'marko je standardni korisnik i prijavljuje se na {pc}. Zadatak: {task}. Pritisni → za prijavu.',
      capStart_builtin: 'Prijavljuje se ugrađeni račun Administrator (RID 500). Zadatak: {task}. Pritisni → za prijavu.',
      capStartOff: 'UAC je isključen.',
      capLogonSplit: 'Korak {n}: LSA gradi dva povezana tokena. Puni: Administrators omogućen, {all} ovlaštenja, High. Filtrirani: Administrators samo za zabranu, {few} ovlaštenja, Medium.',
      capLogonStandard: 'Korak {n}: marko nije administrator: jedan token, {few} ovlaštenja, Medium.',
      capLogonBuiltin: 'Korak {n}: ugrađeni Administrator nije u načinu odobrenja administratora: jedan puni token, ništa se ne filtrira.',
      capLogonOff: 'Korak {n}: UAC je isključen: {user} dobiva jedan puni token, High, kao prije Viste.',
      capExplorerFiltered: 'Korak {n}: radna površina (explorer.exe) kreće s filtriranim tokenom. Sve što ana odavde pokrene, nasljeđuje ga.',
      capExplorerFull: 'Korak {n}: radna površina (explorer.exe) kreće s punim tokenom. Sve što se odavde pokrene, nasljeđuje ga.',
      capExplorerStandard: 'Korak {n}: radna površina (explorer.exe) kreće s markovim jedinim tokenom.',
      capDeniedFiltered: 'Korak {n}: ana je administratorica, ali Explorer nosi filtrirani token: SID Administrators samo za zabranu. {task}: odbijeno.',
      capDeniedStandard: 'Korak {n}: marko nema SID Administrators, a nijedna stavka za njegove grupe ne pokriva {need}. {task}: odbijeno.',
      capDeniedOff: 'Korak {n}: {task}: odbijeno. Bez UAC-a nema upita: marko bi program morao pokrenuti kao drugi korisnik, s računom administratora.',
      capPrivOk: 'Korak {n}: {task} traži ovlaštenje {priv}, a njega zadržava i filtrirani token. Dopušteno, bez podizanja ovlasti.',
      capPrivOkStandard: 'Korak {n}: {task} traži ovlaštenje {priv}; ima ga i standardni korisnik. Dopušteno.',
      capPrivOkFull: 'Korak {n}: {task} traži ovlaštenje {priv}; puni token ga ima. Dopušteno.',
      capAllowedSilent: 'Korak {n}: Explorer već nosi puni token: Administrators omogućen, stavka {row} dopušta. {task}: dopušteno, bez ikakvog upita.',
      capPromptConsent: 'Korak {n}: ana bira „Pokreni kao administrator” za konzolu. Administratorica je, pa UAC traži samo potvrdu: Da ili Ne.',
      capPromptCred: 'Korak {n}: marko bira „Pokreni kao administrator”. Nije administrator, pa UAC traži ime i lozinku administratora; upisuje {admin}.',
      capApproveConsent: 'Korak {n}: nakon potvrde novi proces dobiva puni token razine High; stari procesi ostaju kakvi su bili.',
      capApproveCred: 'Korak {n}: cmd.exe radi kao {admin}, ne kao marko, s punim tokenom tog računa. Explorer i dalje radi kao marko.',
      capAllowedElevated: 'Korak {n}: isti zadatak iz cmd.exe: Administrators je u punom tokenu omogućen i stavka {row} dopušta. {task}: dopušteno.',
      capAllowedElevatedCred: 'Korak {n}: isti zadatak iz cmd.exe: provjera gleda token računa {admin}; stavka {row} dopušta. {task}: dopušteno.',
      capSpawnCmd: 'Korak {n}: povišena konzola pokreće notepad.exe: dijete nasljeđuje puni token, High.',
      capSpawnExplorer: 'Korak {n}: Explorer pokreće notepad.exe: dijete nasljeđuje filtrirani token, Medium. Podizanje ovlasti konzole Explorer nije promijenilo.',
      capSpawnExplorerFull: 'Korak {n}: Explorer pokreće notepad.exe: dijete nasljeđuje puni token. Isto bi dobio i zlonamjeran program koji {user} pokrene, bez ikakvog upita.',
      capSpawnExplorerStandard: 'Korak {n}: Explorer pokreće notepad.exe: dijete radi kao marko, s njegovim tokenom.',
      capEnd: 'Kraj.',

      explain: '<p>Administrator s uključenim UAC-om pri prijavi dobiva dva povezana tokena (<em lang="en">access token</em>, ' +
        'pristupni token). Puni token ima omogućen SID grupe Administrators, razinu integriteta ' +
        '(<em lang="en">integrity level</em>) High i sva ovlaštenja; svako [[privilege]] pravo je na jednu radnju sustava. Filtrirani token (<em lang="en">filtered token</em>) nastaje iz punog: ' +
        'Administrators postaje SID samo za zabranu (<em lang="en">deny-only</em>), ostaje pet ovlaštenja, razina je Medium. ' +
        'Radna površina i sve što se s nje pokrene nose filtrirani token.</p>' +
        '<p>Provjera pristupa čita [[access control list]] odozgo: stavka koja dopušta vrijedi samo za omogućen SID; SID samo ' +
        'za zabranu pogađa samo stavke koje zabranjuju. Zato administratorica bez podizanja ovlasti smije ono što smije svaki ' +
        'korisnik. Ovlaštenja koja filtrirani token zadržava (vremenska zona, gašenje) rade i bez podizanja.</p>' +
        '<p>„Pokreni kao administrator” pokreće <em>novi</em> proces: administratoru nakon upita za potvrdu s punim tokenom, ' +
        'standardnom korisniku nakon upisa imena i lozinke kao drugi korisnik. Proces koji već radi nikad ne mijenja token; ' +
        'dijete nasljeđuje token roditelja. Ugrađeni Administrator (RID 500) prema zadanim postavkama nije u načinu ' +
        'odobrenja administratora, a lokalni administrator (osim ugrađenog) koji se prijavljuje preko mreže dobiva filtrirani token. „UAC isključen” ovdje znači ' +
        'isključenu politiku načina odobrenja administratora, ne klizač „nikad ne obavijesti”: uz njega tokeni ostaju podijeljeni, ' +
        'samo se podizanje događa bez upita.</p>' +
        '<p>To je načelo najmanje ovlasti (<em lang="en">least privilege</em>): ovlasti se uzimaju za jedan zadatak. ' +
        'Microsoft UAC ne smatra sigurnosnom granicom: program koji već radi kao ana smije sve što smije njezin ' +
        'filtrirani token i može čekati da ona potvrdi neki upit. Na Linuxu istu ulogu ima <code>sudo</code>: [[elevated privileges]] za jednu naredbu.</p>'
    },

    en: {
      stage: 'The user\'s tokens, processes and the access check',

      pAccount: 'Who logs on',
      optAdmin: 'ana, administrator',
      optStandard: 'marko, standard',
      optBuiltin: 'built-in Administrator',
      pUac: 'UAC',
      pUacHint: 'Off: an administrator gets one full token, as before Vista.',
      pTask: 'Task',
      task_progfiles: 'Write to Program Files',
      task_hklm: 'Write to HKLM\\SOFTWARE',
      task_timezone: 'Change the time zone',
      task_service: 'Stop a service',
      pChildren: 'Then start Notepad from both',
      pChildrenHint: 'The elevated console and Explorer each start a Notepad.',

      presetFiltered: 'Administrator, not elevated',
      presetFilteredHint: 'Explorer cannot write to Program Files; the console can after consent.',
      presetTimeZone: 'Time zone',
      presetTimeZoneHint: 'The time-zone privilege stays in the filtered token.',
      presetStandard: 'Standard user',
      presetStandardHint: 'marko types admin-it; the process runs as admin-it.',
      presetChildren: 'A child inherits the token',
      presetChildrenHint: 'Notepad from the elevated console is High, from Explorer Medium.',
      presetOff: 'UAC off',
      presetOffHint: 'One full token: everything succeeds silently, also what ana did not mean to run.',

      legSidOn: 'SID enabled',
      legSidDeny: 'SID deny-only',
      legPriv: 'privilege',
      legIl: 'integrity level M / H',
      legThin: 'filtered token',
      legThick: 'full token',
      legVerdict: 'allowed ✓ / denied ✕',
      legChanged: 'changed or used in this step',

      logonTitle: 'Logon to {pc}',
      kindAdmin: 'member of Administrators',
      kindStandard: 'standard user',
      kindBuiltin: 'built-in account, RID 500',
      uacOn: 'UAC on',
      uacOff: 'UAC off',

      tokFiltered: 'Filtered token',
      tokFull: 'Full token',
      tokStandard: 'Standard user\'s token',
      tokOfUser: 'user {user}',
      ilLabel: 'integrity',
      sidsLabel: 'SIDs',
      privsLabel: 'Privileges',
      privsMore: ['+ {n} more', '+ {n} more'],
      denyOnlyTag: 'deny-only',
      linked: 'linked',
      notYet: 'No token yet: {user} is at the logon screen.',
      noFilteredOff: 'No filtered token: UAC is off.',
      noFilteredBuiltin: 'No filtered token: the built-in Administrator is not in Admin Approval Mode.',
      noFullStandard: 'No full token: {user} is not an administrator.',
      noFullYet: 'A full token comes only with the prompt: an administrator\'s name and password.',

      procsTitle: 'Processes',
      procsNone: 'No processes yet.',
      procAs: 'as {user}',
      procTokFiltered: 'filtered',
      procTokFull: 'full',
      procTokStandard: 'standard',
      elevatedTag: 'run as administrator',
      attemptOk: 'allowed',
      attemptDenied: 'denied',

      promptTitle: 'User Account Control',
      promptConsent: 'Allow cmd.exe to make changes to this computer?',
      promptCred: 'To continue, type an administrator\'s user name and password.',
      promptYes: 'Yes',
      promptNo: 'No',
      promptUser: 'user',
      promptPass: 'password',

      chkTitle: 'Access check',
      chkNone: 'No check yet. Task: {task}.',
      chkWho: 'step {n}: {proc} with the {tok} token',
      chkTarget: 'asks to {need}',
      need_w: 'write',
      need_s: 'stop',
      kind_file: 'folder',
      kind_key: 'registry key',
      kind_service: 'service',
      micLine: 'Integrity: process {p}, object {o}',
      micPass: 'passes (no write up)',
      micFail: 'denied: a write up to a higher level',
      colWho: 'Who',
      colRights: 'Rights',
      colAction: 'Type',
      colMark: 'Step {n}',
      allow: 'allow',
      svcAll: 'all (incl. stop)',
      svcQuery: 'query status only',
      implicitDeny: 'no entry allows',
      deny: 'deny',
      markWin: 'decides',
      markSkip: 'not read',
      noteDenyOnly: 'deny-only: does not count',
      noteNoRight: 'does not cover {need}',
      noteAbsent: 'not in the token',
      outOk: 'allowed',
      outDenied: 'denied',
      privNeed: 'The task needs the privilege',
      privHeld: 'in the token: yes',
      privMissing: 'in the token: no',
      privNoAcl: 'A privilege in the token decides here, not a permission list.',

      do_progfiles: 'the write to Program Files',
      do_hklm: 'the write to HKLM\\SOFTWARE',
      do_timezone: 'the time-zone change',
      do_service: 'stopping the service Spooler',

      capStart_admin: 'ana is in Administrators and logs on to {pc}. Task: {task}. Press → to log on.',
      capStart_standard: 'marko is a standard user and logs on to {pc}. Task: {task}. Press → to log on.',
      capStart_builtin: 'The built-in Administrator account (RID 500) logs on. Task: {task}. Press → to log on.',
      capStartOff: 'UAC is off.',
      capLogonSplit: 'Step {n}: LSA builds two linked tokens. Full: Administrators enabled, {all} privileges, High. Filtered: Administrators deny-only, {few} privileges, Medium.',
      capLogonStandard: 'Step {n}: marko is not an administrator: one token, {few} privileges, Medium.',
      capLogonBuiltin: 'Step {n}: the built-in Administrator is not in Admin Approval Mode: one full token, nothing filtered.',
      capLogonOff: 'Step {n}: UAC is off: {user} gets one full token, High, as before Vista.',
      capExplorerFiltered: 'Step {n}: the desktop (explorer.exe) starts with the filtered token. Everything ana starts from here inherits it.',
      capExplorerFull: 'Step {n}: the desktop (explorer.exe) starts with the full token. Everything started from here inherits it.',
      capExplorerStandard: 'Step {n}: the desktop (explorer.exe) starts with marko\'s only token.',
      capDeniedFiltered: 'Step {n}: ana is an administrator, but Explorer carries the filtered token: the Administrators SID is deny-only. {task}: denied.',
      capDeniedStandard: 'Step {n}: marko has no Administrators SID, and no entry for his groups covers {need}. {task}: denied.',
      capDeniedOff: 'Step {n}: {task}: denied. Without UAC there is no prompt: marko would have to start the program as another user, an administrator\'s account.',
      capPrivOk: 'Step {n}: {task} needs the privilege {priv}, and the filtered token keeps it. Allowed, no elevation.',
      capPrivOkStandard: 'Step {n}: {task} needs the privilege {priv}; a standard user has it too. Allowed.',
      capPrivOkFull: 'Step {n}: {task} needs the privilege {priv}; the full token has it. Allowed.',
      capAllowedSilent: 'Step {n}: Explorer already carries the full token: Administrators enabled, entry {row} allows. {task}: allowed, no prompt at all.',
      capPromptConsent: 'Step {n}: ana chooses "Run as administrator" for the console. She is an administrator, so UAC only asks for consent: Yes or No.',
      capPromptCred: 'Step {n}: marko chooses "Run as administrator". He is not an administrator, so UAC asks for an administrator\'s name and password; he types {admin}.',
      capApproveConsent: 'Step {n}: after consent the new process gets the full High token; existing processes stay as they were.',
      capApproveCred: 'Step {n}: cmd.exe runs as {admin}, not as marko, with that account\'s full token. Explorer still runs as marko.',
      capAllowedElevated: 'Step {n}: the same task from cmd.exe: in the full token Administrators is enabled and entry {row} allows. {task}: allowed.',
      capAllowedElevatedCred: 'Step {n}: the same task from cmd.exe: the check reads the token of {admin}; entry {row} allows. {task}: allowed.',
      capSpawnCmd: 'Step {n}: the elevated console starts notepad.exe: the child inherits the full token, High.',
      capSpawnExplorer: 'Step {n}: Explorer starts notepad.exe: the child inherits the filtered token, Medium. Elevating the console did not change Explorer.',
      capSpawnExplorerFull: 'Step {n}: Explorer starts notepad.exe: the child inherits the full token. So would a malicious program {user} starts, with no prompt at all.',
      capSpawnExplorerStandard: 'Step {n}: Explorer starts notepad.exe: the child runs as marko, with his token.',
      capEnd: 'The end.',

      explain: '<p>With UAC on, an administrator\'s logon makes two linked access tokens. The full token has the ' +
        'Administrators SID enabled, every [[privilege]] and the integrity level High. The filtered token is made from it: ' +
        'Administrators becomes deny-only, five privileges stay, the level is Medium. The desktop, and everything started ' +
        'from it, carries the filtered token.</p>' +
        '<p>The access check reads the [[access control list]] from the top: an allow entry counts only for an enabled SID; ' +
        'a deny-only SID matches deny entries only. So an administrator who has not elevated may do what any user may. ' +
        'Privileges the filtered token keeps (the time zone, shutting down) work without elevation.</p>' +
        '<p>"Run as administrator" starts a <em>new</em> process: for an administrator, after a consent prompt, with the ' +
        'full token; for a standard user, after typing a name and password, as that other user. A running process never ' +
        'changes its token; a child inherits its parent\'s. The built-in Administrator (RID 500) is not in Admin Approval ' +
        'Mode by default, and a local administrator (other than the built-in one) logging on over the network gets the filtered token. ' +
        '"UAC off" here means the Admin Approval Mode policy turned off, not the "never notify" slider: with that, the ' +
        'tokens are still split and elevation just happens without a prompt.</p>' +
        '<p>This is least privilege: rights are taken up for one task. Microsoft does not treat UAC as a security ' +
        'boundary: a program already running as ana may do all her filtered token allows, and can wait for her to ' +
        'approve a prompt. On Linux ' +
        '<code>sudo</code> plays the same part: [[elevated privileges]] for one command.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
