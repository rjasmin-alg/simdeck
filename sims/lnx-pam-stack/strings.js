/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-pam-stack, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node in captions: modules, flags and line numbers are shown as code), [[term]] a glossary
   term (first mention; [[=term]] later ones). The title and subtitle come from sim.json. Module names (pam_unix),
   control flags (required) and paths (/etc/nologin) are configuration, the subject being taught; they are the same in
   both tables. Words between backticks are shown as code. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stog auth: pokušaj prijave, retci s kontrolnim oznakama, presuda dosad i ishod',
      // panel
      user: 'Prijavljuje se',
      uAna: 'ana (lokalni račun)',
      uIvan: 'ivan (imenička usluga, SSSD)',
      uRoot: 'root',
      password: 'Lozinka ispravna',
      nologin: 'Postoji /etc/nologin',
      hintEdit: 'Klikni oznaku da je promijeniš, a ishod modula da ga prisiliš. Povuci redak gore ili dolje (ili Alt + ↑/↓) da ga premjestiš.',
      flagBtn: '{n}. redak, oznaka {f}: klikni za sljedeću',
      resBtn: '{n}. redak, ishod: {v}; klikni da ga prisiliš',
      module: 'Modul',
      flag: 'Kontrolna oznaka',
      force: 'Ishod modula',
      forceAuto: 'kako modul odluči',
      forceOk: '✓ uspjeh',
      forceFail: '✕ neuspjeh',
      fl_required: 'required',
      fl_requisite: 'requisite',
      fl_sufficient: 'sufficient',
      fl_optional: 'optional',
      pUnixSss: 'Lokalno, pa imenička usluga',
      pRunsOn: 'required ide dalje',
      pRequisite: 'requisite staje',
      pDenyEarly: 'pam_deny previsoko',
      pPermitFirst: 'pam_permit na vrhu',
      pReqSuff: 'required, pa sufficient',
      // legend
      legOk: 'uspjeh',
      legFail: 'neuspjeh',
      legIgnored: 'zanemareno',
      legCounts: 'broji se',
      legDecides: 'odlučuje',
      legBeaten: 'uspjeh poništen',
      legStop: 'stog se ovdje vraća',
      legSkip: 'nije pokrenut',
      legChanged: 'promijenjeno u ovom koraku',
      // stage: the attempt
      attemptTitle: 'Pokušaj prijave',
      kindLocal: 'lokalni račun',
      kindSss: 'račun u imeničkoj usluzi (SSSD)',
      kindRoot: 'administrator, lokalni račun',
      pwOk: 'lozinka ispravna',
      pwBad: 'lozinka pogrešna',
      nologinOn: 'postoji /etc/nologin',
      nologinOff: 'nema /etc/nologin',
      // stage: the table
      tableTitle: 'Odjeljak auth u /etc/pam.d/system-auth',
      colNo: 'redak',
      colFlag: 'oznaka',
      colModule: 'modul',
      colResult: 'ishod modula',
      colSoFar: 'presuda dosad',
      colMark: 'učinak',
      res_success: 'uspjeh',
      res_fail: 'neuspjeh',
      res_ignore: 'ignore',
      soFarNone: 'još ništa',
      soFarOk: 'uspjeh, r. {n}',
      soFarFail: 'odbijeno, r. {n}',
      forcedTag: 'prisiljeno',
      stopNote: '■ stog se vraća',
      markHit: 'broji se',
      markWin: 'odlučuje',
      markBeaten: 'poništen',
      markSkip: 'nije pokrenut',
      implicitText: 'kraj stoga: nijedan modul nije uspio',
      implicitAction: 'odbijeno',
      // stage: the outcome
      outTitle: 'Ishod prijave',
      outWait: 'čeka',
      outOk: 'prijava uspjela',
      outFail: 'prijava odbijena',
      outBy: 'odlučio je {n}. redak:',
      outByNone: 'nijedan modul nije uspio',
      outReturned: 'stog se vratio na {n}. retku',
      outEnd: 'stog je došao do kraja',
      outRan: ['izveden je {n} redak od {m}', 'izvedena su {n} retka od {m}', 'izvedeno je {n} redaka od {m}'],
      outNotFirst: 'Pravilo prvog pogotka stalo bi na prvom retku koji nešto kaže; ovdje se oznake slažu.',
      // captions
      cStart: ['{user} se prijavljuje. Stog auth ima {n} redak; izvodi se, a kontrolna oznaka slaže ishod modula s presudom dosad.',
        '{user} se prijavljuje. Stog auth ima {n} retka; izvode se odozgo prema dolje, a kontrolna oznaka svakog retka slaže ishod modula s presudom dosad.',
        '{user} se prijavljuje. Stog auth ima {n} redaka; izvode se odozgo prema dolje, a kontrolna oznaka svakog retka slaže ishod modula s presudom dosad.'],
      cLine: '{line}. redak, `{flag} {module}`: {res} ({why}).',
      why_pwOk: 'lozinka je ispravna',
      why_pwBad: 'lozinka je pogrešna',
      why_notLocal: 'račun nije lokalni',
      why_notSss: 'račun nije u imeničkoj usluzi',
      why_deny: 'uvijek odbija',
      why_permit: 'uvijek propušta',
      why_noFile: 'nema /etc/nologin',
      why_rootPasses: 'root smije i uz /etc/nologin',
      why_nologin: 'postoji /etc/nologin, a korisnik nije root',
      why_env: 'u provjeri identiteta ništa ne radi; okolinu postavlja tek poslije',
      why_echo: 'ispisuje poruku',
      why_forced: 'ishod je prisiljen',
      e_ignored: 'Rezultat ignore ne mijenja presudu, kakva god bila oznaka.',
      e_fail_ignored_suff: 'Neuspjeh `sufficient` modula zanemaruje se; stog ide dalje.',
      e_fail_ignored_opt: 'Neuspjeh `optional` modula zanemaruje se; stog ide dalje.',
      e_sets_fail: '`required`: prijava će biti odbijena, ali stog se izvodi dalje, pa korisnik ne saznaje koji je modul pao.',
      e_sets_fail_requisite: '`requisite`: neuspjeh odmah vraća odbijanje; retci ispod se ne izvode.',
      e_keeps_fail: 'Stog je već odbijen; razlog ostaje prvi pad, {first}. redak (`{fflag} {fmodule}`).',
      e_keeps_fail_requisite: '`requisite` sad vraća stog, a razlog ostaje prvi pad, {first}. redak (`{fflag} {fmodule}`).',
      e_sets_ok: 'Presuda dosad: uspjeh. `{flag}` ne vraća stog, pa se nastavlja.',
      e_sets_ok_opt: 'Presudu još nitko nije postavio, pa uspjeh `optional` modula postaje presuda dosad. Stog ide dalje.',
      e_adds_ok: 'Presuda ostaje uspjeh; stog ide dalje.',
      e_ok_ignored: 'Ali iznad je {first}. redak (`{fflag} {fmodule}`) već pao, pa ovaj uspjeh ništa ne mijenja.',
      e_ok_ignored_suff: '{line}. redak: `{module}` je uspio, ali iznad njega je `{fflag} {fmodule}` već pao. `sufficient` tada ne prekida stog: uspjeh se zanemaruje, a prijava će biti odbijena.',
      e_returns_ok: '`sufficient` je uspio, a iznad nije pao nijedan required ni requisite: stog odmah vraća uspjeh.',
      notRun: ['{n} redak ispod se ne izvodi.', '{n} retka ispod se ne izvode.', '{n} redaka ispod se ne izvodi.'],
      vReturnOk: 'Prijava uspjela. Odlučio je {line}. redak, `{flag} {module}`, koji je vratio stog.',
      vReturnFail: 'Prijava odbijena odmah na {line}. retku (`{flag} {module}`).',
      vReturnFailEarlier: 'Prijava odbijena: `requisite {rmodule}` vratio je stog na {rline}. retku, a razlog je prvi pad, {line}. redak (`{flag} {module}`).',
      vEndFail: 'Kraj stoga. Prijava odbijena: prvi je pao {line}. redak, `{flag} {module}`, i taj se razlog javlja.',
      vEndOk: 'Kraj stoga. Nijedan required nije pao, a {line}. redak (`{flag} {module}`) je uspio: prijava uspjela.',
      vEndNone: 'Kraj stoga, a nijedan modul nije uspio: prijava je odbijena.',
      xWrongPwIn: 'Lozinka je bila pogrešna, a prijava je ipak uspjela.',
      xRightPwOut: 'Lozinka je bila ispravna, a prijava je ipak odbijena.',
      xNoPwCheck: 'Lozinku nije provjerio nijedan modul.',
      // explanation
      explain:
        '<p>Prijavu na Linux sustav sastavlja <abbr lang="en" title="Pluggable Authentication Modules">PAM</abbr>: ' +
        'datoteka u <code>/etc/pam.d/</code> za svaku vrstu posla ima [[stack]] redaka, a u svakom retku jedan [[module]] ' +
        'i njegova <em lang="en">control flag</em> (kontrolna oznaka). Ovdje je samo odjeljak <code>auth</code>, ' +
        '<em lang="en">authentication</em> (provjera identiteta); <code>account</code>, <code>password</code> i ' +
        '<code>session</code> rade na isti način, svaki svojim stogom.</p>' +
        '<p>Retci se izvode odozgo prema dolje. Svaki modul vrati uspjeh, neuspjeh ili <code>ignore</code>, a oznaka kaže ' +
        'što to znači za presudu dosad:</p>' +
        '<ul>' +
        '<li><code>required</code>: neuspjeh ruši prijavu, ali se stog izvodi do kraja, pa korisnik ne zna koji je modul pao.</li>' +
        '<li><code>requisite</code>: neuspjeh odmah vraća odbijanje; retci ispod se ne izvode.</li>' +
        '<li><code>sufficient</code>: uspjeh odmah vraća uspjeh, ali samo ako iznad nije pao nijedan <code>required</code> ni <code>requisite</code>; njegov se neuspjeh zanemaruje.</li>' +
        '<li><code>optional</code>: neuspjeh se zanemaruje, a uspjeh broji samo ako presudu nitko drugi nije postavio.</li>' +
        '</ul>' +
        '<p>Na kraju stoga odlučuje prvi pad; ako ga nema, prijava uspijeva samo ako je barem jedan modul uspio. ' +
        'To nije [[first matching entry]] kao u popisu pravila vatrozida: redak koji nešto kaže ne završava ' +
        'stog, osim kad mu oznaka to kaže.</p>' +
        '<p>Zato je redoslijed važan. <code>pam_deny</code> iznad <code>sufficient pam_unix</code> odbija sve; ' +
        '<code>sufficient pam_permit</code> na vrhu pušta svakoga, s bilo kojom lozinkom.</p>' +
        '<p>Izvan ove simulacije: zapis u uglatim zagradama (<code>[success=1 default=ignore]</code>), ' +
        '<code>include</code> i <code>substack</code>, brojanje neuspjelih pokušaja i predmemorija imeničke usluge.</p>'
    },
    en: {
      stage: 'The auth stack: the login attempt, the lines with their control flags, the verdict so far and the outcome',
      // panel
      user: 'Logging in',
      uAna: 'ana (local account)',
      uIvan: 'ivan (directory service, SSSD)',
      uRoot: 'root',
      password: 'Right password',
      nologin: '/etc/nologin exists',
      hintEdit: 'Click a flag to change it and a module result to force it. Drag a line up or down (or Alt + ↑/↓) to move it.',
      flagBtn: 'Line {n}, flag {f}: click for the next one',
      resBtn: 'Line {n}, result: {v}; click to force it',
      module: 'Module',
      flag: 'Control flag',
      force: 'Module result',
      forceAuto: 'as the module decides',
      forceOk: '✓ success',
      forceFail: '✕ failure',
      fl_required: 'required',
      fl_requisite: 'requisite',
      fl_sufficient: 'sufficient',
      fl_optional: 'optional',
      pUnixSss: 'Local, then the directory',
      pRunsOn: 'required runs on',
      pRequisite: 'requisite stops',
      pDenyEarly: 'pam_deny too early',
      pPermitFirst: 'pam_permit on top',
      pReqSuff: 'required, then sufficient',
      // legend
      legOk: 'success',
      legFail: 'failure',
      legIgnored: 'ignored',
      legCounts: 'counts',
      legDecides: 'decides',
      legBeaten: 'success overruled',
      legStop: 'the stack returns here',
      legSkip: 'not run',
      legChanged: 'changed in this step',
      // stage: the attempt
      attemptTitle: 'Login attempt',
      kindLocal: 'local account',
      kindSss: 'account in the directory service (SSSD)',
      kindRoot: 'administrator, local account',
      pwOk: 'right password',
      pwBad: 'wrong password',
      nologinOn: '/etc/nologin exists',
      nologinOff: 'no /etc/nologin',
      // stage: the table
      tableTitle: 'The auth section of /etc/pam.d/system-auth',
      colNo: 'line',
      colFlag: 'flag',
      colModule: 'module',
      colResult: 'module result',
      colSoFar: 'verdict so far',
      colMark: 'effect',
      res_success: 'success',
      res_fail: 'failure',
      res_ignore: 'ignore',
      soFarNone: 'nothing yet',
      soFarOk: 'success, l. {n}',
      soFarFail: 'refused, l. {n}',
      forcedTag: 'forced',
      stopNote: '■ the stack returns',
      markHit: 'counts',
      markWin: 'decides',
      markBeaten: 'overruled',
      markSkip: 'not run',
      implicitText: 'end of the stack: no module succeeded',
      implicitAction: 'refused',
      // stage: the outcome
      outTitle: 'Login outcome',
      outWait: 'waiting',
      outOk: 'login succeeded',
      outFail: 'login refused',
      outBy: 'decided by line {n}:',
      outByNone: 'no module succeeded',
      outReturned: 'the stack returned at line {n}',
      outEnd: 'the stack ran to its end',
      outRan: ['{n} line of {m} ran', '{n} lines of {m} ran'],
      outNotFirst: 'First match would stop at the first line that says something; here the flags add up.',
      // captions
      cStart: ['{user} logs in. The auth stack has {n} line; its control flag combines the module\'s result with the verdict so far.',
        '{user} logs in. The auth stack has {n} lines; they run top to bottom, and each line\'s control flag combines its module\'s result with the verdict so far.'],
      cLine: 'Line {line}, `{flag} {module}`: {res} ({why}).',
      why_pwOk: 'the password is right',
      why_pwBad: 'the password is wrong',
      why_notLocal: 'not a local account',
      why_notSss: 'not in the directory service',
      why_deny: 'always refuses',
      why_permit: 'always lets in',
      why_noFile: 'no /etc/nologin',
      why_rootPasses: 'root may log in despite /etc/nologin',
      why_nologin: '/etc/nologin exists and the user is not root',
      why_env: 'it does nothing in authentication; it sets the environment later',
      why_echo: 'prints a message',
      why_forced: 'the result is forced',
      e_ignored: 'An ignore result does not change the verdict, whatever the flag.',
      e_fail_ignored_suff: 'A `sufficient` module\'s failure is ignored; the stack goes on.',
      e_fail_ignored_opt: 'An `optional` module\'s failure is ignored; the stack goes on.',
      e_sets_fail: '`required`: the login will be refused, but the stack runs on, so the user does not learn which module failed.',
      e_sets_fail_requisite: '`requisite`: a failure returns the refusal at once; the lines below do not run.',
      e_keeps_fail: 'The stack is already refused; the reason stays the first failure, line {first} (`{fflag} {fmodule}`).',
      e_keeps_fail_requisite: '`requisite` now returns the stack, and the reason stays the first failure, line {first} (`{fflag} {fmodule}`).',
      e_sets_ok: 'Verdict so far: success. `{flag}` does not return the stack, so it goes on.',
      e_sets_ok_opt: 'Nobody has set the verdict yet, so the `optional` module\'s success becomes the verdict so far. The stack goes on.',
      e_adds_ok: 'The verdict stays success; the stack goes on.',
      e_ok_ignored: 'But line {first} above (`{fflag} {fmodule}`) has already failed, so this success changes nothing.',
      e_ok_ignored_suff: 'Line {line}: `{module}` succeeded, but `{fflag} {fmodule}` above it had already failed. `sufficient` then doesn\'t end the stack: the success is ignored and the login will be refused.',
      e_returns_ok: '`sufficient` succeeded and no required or requisite line above failed: the stack returns success at once.',
      notRun: ['{n} line below does not run.', '{n} lines below do not run.'],
      vReturnOk: 'Login succeeded. Line {line}, `{flag} {module}`, decided it by returning the stack.',
      vReturnFail: 'Login refused at once at line {line} (`{flag} {module}`).',
      vReturnFailEarlier: 'Login refused: `requisite {rmodule}` returned the stack at line {rline}, and the reason is the first failure, line {line} (`{flag} {module}`).',
      vEndFail: 'End of the stack. Login refused: line {line}, `{flag} {module}`, failed first, and that is the reason reported.',
      vEndOk: 'End of the stack. No required line failed and line {line} (`{flag} {module}`) succeeded: login succeeded.',
      vEndNone: 'End of the stack, and no module succeeded: the login is refused.',
      xWrongPwIn: 'The password was wrong, and the login still succeeded.',
      xRightPwOut: 'The password was right, and the login was still refused.',
      xNoPwCheck: 'No module checked the password.',
      // explanation
      explain:
        '<p>A login on a Linux system is put together by <abbr title="Pluggable Authentication Modules">PAM</abbr>: ' +
        'a file in <code>/etc/pam.d/</code> has, for each kind of work, a [[stack]] of lines, each with one [[module]] ' +
        'and its control flag. Here it is only the <code>auth</code> section (authentication); <code>account</code>, ' +
        '<code>password</code> and <code>session</code> work the same way, each with its own stack.</p>' +
        '<p>The lines run top to bottom. Each module returns success, failure or <code>ignore</code>, and the flag says ' +
        'what that means for the verdict so far:</p>' +
        '<ul>' +
        '<li><code>required</code>: a failure sinks the login, but the stack runs to its end, so the user cannot tell which module failed.</li>' +
        '<li><code>requisite</code>: a failure returns the refusal at once; the lines below do not run.</li>' +
        '<li><code>sufficient</code>: a success returns success at once, but only if no <code>required</code> or <code>requisite</code> line above failed; its failure is ignored.</li>' +
        '<li><code>optional</code>: a failure is ignored, and a success counts only if nobody else has set the verdict.</li>' +
        '</ul>' +
        '<p>At the end of the stack the first failure decides; with none, the login succeeds only if at least one module ' +
        'succeeded. This is not the [[first matching entry]] of a firewall rule list: a line that says something does ' +
        'not end the stack unless its flag says so.</p>' +
        '<p>That is why the order matters. <code>pam_deny</code> above <code>sufficient pam_unix</code> refuses everyone; ' +
        '<code>sufficient pam_permit</code> on top lets everyone in, with any password.</p>' +
        '<p>Outside this simulator: the bracket syntax (<code>[success=1 default=ignore]</code>), <code>include</code> and ' +
        '<code>substack</code>, counting failed attempts, and the directory service\'s cache.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
