/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-gpo-processing, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). The terms are not in kit/glossary.js
   yet, so they are written out (NOTES.md, "Term pairs").
   Host names, user names, the GPO name, paths, versions, times and commands are data: the page writes them with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Obrada pravila grupe: GPO, vremenska os i proširenja na klijentu',

      // GPO card
      gpoTitle: 'GPO',
      gpoVersion: 'verzija',
      colSetting: 'postavka',
      colInGpo: 'u GPO-u',
      colOnHost: 'na {h}',
      setScreensaver: 'vrijeme do čuvara zaslona',
      setLock: 'zaključavanje nakon neaktivnosti',
      setFolders: 'preusmjeravanje Dokumenata',
      setMsi: 'dodijeljeni paket',
      valLocal: 'lokalno',
      valNone: 'nema',
      stSame: 'isto',
      stEdited: 'čeka',
      stWaitsLogon: 'čeka sinkronu prijavu',
      stWaitsStartup: 'čeka sinkrono pokretanje',
      stApplied: 'primijenjeno',
      partUser: 'korisnik',
      partComputer: 'računalo',

      // host card
      hostClient: 'klijent',
      hostDc: 'kontroler domene',
      loggedOn: 'korisnik: {u}',
      now: 'sada',
      nextRefresh: 'sljedeće osvježavanje',
      everyFive: 'svakih 5 min',
      fastOn: 'brza prijava: uključena',
      fastOff: 'uvijek čekaj mrežu: uključeno',
      fastDc: 'poslužitelj: uvijek sinkrono',
      nextLogon: 'sljedeća prijava',
      nextStartup: 'sljedeće pokretanje',
      sync: 'sinkrono',
      async: 'asinkrono',

      // time axis
      axisUnit: 'min',
      evStart: 'pokretanje',
      evRestart: 'ponovno pokretanje',
      evLogon: 'prijava',
      evRefresh: 'osvježavanje',
      evEdit: 'izmjena GPO-a',
      evNext: 'sljedeće',
      evPlanned: 'plan',

      // K4 table
      tableTitle: 'Proširenja na klijentu u ovom prolazu',
      colCse: 'proširenje',
      colPart: 'dio',
      colBg: 'u pozadini',
      colHolds: 'postavka u GPO-u',
      markNone: 'još nema prolaza',
      markEdit: 't = 0: na {h} se ništa ne izvodi',
      markRefresh: 'osvježavanje u pozadini',
      markGpupdate: 'pozadinski prolaz',
      markLogon: 'prijava, {m}',
      markRestart: 'pokretanje {c}, prijava {u}',
      cseRegistry: 'Registar (Administrativni predlošci)',
      cseSecurity: 'Sigurnosne postavke',
      cseFolders: 'Preusmjeravanje mapa',
      cseSoftware: 'Instalacija softvera',
      bgApplies: 'da',
      bgSignals: 'ne: traži sinkroni prolaz',
      wordWin: 'primijenjeno',
      wordHit: 'čeka',
      wordSkip: 'ne izvodi se',
      noteNothingNew: 'ništa novo: preskočeno',
      noteReapplied: 'nepromijenjeno, /force',
      noteSyncLogon: 'sljedeća prijava sinkrono',
      noteSyncStartup: 'sljedeće pokretanje sinkrono',
      tagEdited: 'izmijenjeno',

      // panel
      pDc: 'Kontroler domene DC01',
      pChange: 'Izmjena u GPO-u',
      optScreensaver: 'čuvar zaslona',
      optFolders: 'mape',
      optMsi: 'paket',
      pAction: 'Zatim',
      optWait: 'čekaj',
      optGpupdate: 'gpupdate',
      optForce: '/force',
      optRelog: 'odjava / restart',
      pFast: 'Optimizacija brze prijave',
      pSeed: 'Sjeme slučajnog pomaka',
      offDcFast: 'Kontroler domene: uvijek sinkrono.',
      offDcSeed: 'Kontroler domene: bez slučajnog pomaka.',

      presetBackground: 'Osvježavanje',
      presetBackgroundHint: 'Čuvar zaslona, čekanje: primijenjeno pri osvježavanju (90 min + pomak).',
      presetGpupdate: 'gpupdate',
      presetGpupdateHint: 'Čuvar zaslona, gpupdate u t = 5: primijenjeno odmah.',
      presetFolders: 'Dvije prijave',
      presetFoldersHint: 'Dvije prijave uz brzu prijavu: prva traži sinkronu, druga primjenjuje.',
      presetMsi: 'Paket',
      presetMsiHint: 'Dodijeljeni paket uz brzu prijavu: instaliran tek pri drugom pokretanju.',
      presetDc: 'DC01',
      presetDcHint: 'Isti GPO na DC01: osvježavanje najviše 5 minuta kasnije.',
      presetForce: '/force i mape',
      presetForceHint: 'Preusmjeravanje mapa i /force: sve se ponovno primijeni, a preusmjeravanje mapa ipak čeka prijavu.',

      legFg: 'prolaz u prvom planu',
      legBg: 'prolaz u pozadini',
      legOffset: 'slučajni pomak',
      legApplied: 'primijenjeno',
      legWaits: 'čeka sinkroni prolaz',
      legChanged: 'promijenjeno',

      // captions
      capStartPc: '{h} je pokrenut u t = −10 min i {u} se prijavila: sve postavke GPO-a {g} (verzija {v}) su primijenjene. Sljedeće *background refresh* (osvježavanje u pozadini) bit će u t = {next} min: 90 min + {off} min slučajnog pomaka.',
      capStartDc: '{h} je kontroler domene: pravila osvježava svakih 5 min, zadnji put u t = −2 min. Sve postavke GPO-a {g} (verzija {v}) su primijenjene.',
      capStartNoFast: ' Uključeno je „uvijek čekaj mrežu”: svaki prolaz pri pokretanju i prijavi je sinkron.',
      capEdit: 't = 0: administrator mijenja postavku „{s}” u GPO-u {g} (verzija {v}). Na {h} se još ništa ne mijenja: klijent sam dohvaća pravila u svojim prolazima, GPO mu se ne šalje.',
      capPlanWait: ' Nitko ništa ne radi: čekamo.',
      capPlanGpupdate: ' Zatim {u} u t = 5 pokreće {cmd}.',
      capPlanLogon: ' Zatim se {u} u t = 30 odjavljuje i ponovno prijavljuje.',
      capPlanRestart: ' Zatim se {h} u t = 30 ponovno pokreće.',
      capRefreshApplied: 't = {t}: *background refresh* (osvježavanje u pozadini) svakih 90 min + {off} min slučajnog pomaka: postavka je primijenjena u t = {t} min, bez prijave.',
      capRefreshAppliedDc: 't = {t}: kontroler domene osvježava pravila svakih 5 min: postavka je primijenjena {d} min nakon izmjene.',
      capRefreshSignalUser: 't = {t}: osvježavanje u pozadini. *Folder Redirection* (preusmjeravanje mapa) se nikad ne primjenjuje u pozadini: samo traži da sljedeća prijava bude sinkrona.',
      capRefreshSignalComputer: 't = {t}: osvježavanje u pozadini. *Software Installation* (instalacija softvera) nikad ne instalira u pozadini: samo traži da sljedeće pokretanje bude sinkrono.',
      capRefreshQuietUser: 't = {t}: ni ovo osvježavanje ne donosi ništa novo: čekanjem se preusmjeravanje mapa neće primijeniti. Treba prijava, a ona će biti sinkrona.',
      capRefreshQuietComputer: 't = {t}: ni ovo osvježavanje ne donosi ništa novo: čekanjem se paket neće instalirati. Treba ponovno pokretanje, a ono će biti sinkrono.',
      capCollapsed: [' Osvježavanje u t = {list} nije donijelo ništa novo.', ' Osvježavanja u t = {list} nisu donijela ništa novo.', ' Osvježavanja u t = {list} nisu donijela ništa novo.'],
      capGpupdateApplied: 't = {t}: {u} pokreće {cmd}: prolaz u pozadini odmah i primjenjuje se samo ono što se promijenilo. Postavka je primijenjena u t = {t}.',
      capGpupdateSignalUser: 't = {t}: {cmd} pokreće prolaz u pozadini odmah. Preusmjeravanje mapa se u njemu ne može primijeniti, pa {cmd} traži odjavu; sljedeća prijava bit će sinkrona.',
      capGpupdateSignalComputer: 't = {t}: {cmd} pokreće prolaz u pozadini odmah. Instalacija softvera u njemu ne može instalirati, pa {cmd} traži ponovno pokretanje; sljedeće pokretanje bit će sinkrono.',
      capForceApplied: 't = {t}: {cmd} primjenjuje promijenjenu postavku i ponovno primjenjuje i nepromijenjene. Preusmjeravanje mapa i instalacija softvera i dalje samo traže sinkronu sljedeću prijavu i sinkrono pokretanje.',
      capPlanMoot: ' Planirani korak više nije potreban.',
      capForceSignalUser: 't = {t}: {cmd} ponovno primjenjuje sve postavke, ali preusmjeravanje mapa ni tako ne radi u pozadini: /force ne zamjenjuje prijavu. {cmd} traži odjavu.',
      capForceSignalComputer: 't = {t}: {cmd} ponovno primjenjuje sve postavke, ali instalacija softvera ni tako ne radi u pozadini: /force ne zamjenjuje pokretanje. {cmd} traži ponovno pokretanje.',
      capFgRegistry: 't = {t}: {u} se odjavljuje i ponovno prijavljuje. Prolaz pri prijavi primjenjuje postavku; administrativnim predlošcima ne treba sinkroni prolaz.',
      capFgSignalUser: 't = {t}: {u} se odjavljuje i ponovno prijavljuje. Uz *fast logon optimization* (optimizacija brze prijave) prijava ne čeka mrežu i prolaz je asinkron, pa preusmjeravanje mapa samo traži sinkronu sljedeću prijavu. Još nije primijenjeno.',
      capFgSignalComputer: 't = {t}: {h} se ponovno pokreće. Uz *fast logon optimization* (optimizacija brze prijave) pokretanje ne čeka mrežu i prolaz je asinkron, pa instalacija softvera samo traži sinkrono sljedeće pokretanje. Još nije instalirano.',
      capFgSecondUser: 't = {t}: druga prijava, sinkrona: preusmjeravanje mapa radi samo pri prijavi, a uz brzu prijavu tek pri drugoj.',
      capFgSecondComputer: 't = {t}: drugo pokretanje, sinkrono: paket se instalira prije zaslona za prijavu; uz brzu prijavu to traje dva pokretanja.',
      capFgFlaggedUser: 't = {t}: {u} se odjavljuje i ponovno prijavljuje. Ova prijava je sinkrona jer ju je zatražio prolaz u pozadini u t = {f}: primijenjeno već pri prvoj prijavi.',
      capFgFlaggedComputer: 't = {t}: {h} se ponovno pokreće. Ovo pokretanje je sinkrono jer ga je zatražio prolaz u pozadini u t = {f}: instalirano jednim pokretanjem.',
      capFgNoFastUser: 't = {t}: {u} se odjavljuje i ponovno prijavljuje. Uključeno je „uvijek čekaj mrežu”, pa je prolaz pri prijavi sinkron: primijenjeno pri prvoj prijavi.',
      capFgNoFastComputer: 't = {t}: {h} se ponovno pokreće. Uključeno je „uvijek čekaj mrežu”, pa je prolaz pri pokretanju sinkron: instalirano pri prvom pokretanju.',
      capFgDcUser: 't = {t}: {u} se odjavljuje i ponovno prijavljuje. Kontroler domene pri prijavi uvijek obrađuje pravila sinkrono: primijenjeno.',
      capFgDcComputer: 't = {t}: {h} se ponovno pokreće. Kontroler domene pri pokretanju uvijek obrađuje pravila sinkrono: instalirano.',

      explain:
        '<p>GPO se klijentu ne šalje. Klijent sam dohvaća pravila u svojim prolazima: dio za računalo pri pokretanju, ' +
        'dio za korisnika pri prijavi (<em lang="en">foreground processing</em>, obrada u prvom planu), a oba dijela i u ' +
        '<em lang="en">background refresh</em> (osvježavanje u pozadini) svakih 90 minuta uz slučajni pomak od 0 do 30 minuta, ' +
        'da tisuće klijenata ne pitaju kontroler domene u istoj minuti. Kontroler domene osvježava svakih 5 minuta. ' +
        '<code>gpupdate</code> pokreće prolaz u pozadini odmah.</p>' +
        '<p>Svaku vrstu postavki primjenjuje svoje <em lang="en">client-side extension</em> (proširenje na klijentu). ' +
        'Većina ih preskače GPO u kojem se ništa nije promijenilo; sigurnosne se postavke ionako ponovno primjenjuju svakih 16 sati. ' +
        'Preusmjeravanje mapa i instalacija softvera mijenjaju ono s čim korisnik upravo radi, pa se primjenjuju samo u ' +
        '<b>sinkronom</b> prolazu u prvom planu: prijava odnosno pokretanje čeka da završe. U pozadini samo zatraže da ' +
        'sljedeća prijava (pokretanje) bude sinkrona.</p>' +
        '<p>Uz <em lang="en">fast logon optimization</em> (optimizacija brze prijave, zadano na klijentima) prijava i ' +
        'pokretanje ne čekaju mrežu, pa su asinkroni. Zato izmjena preusmjeravanja mapa traži <b>dvije</b> prijave, a ' +
        'dodijeljeni paket dva pokretanja, ako prije toga nije bilo prolaza u pozadini. Postavka „uvijek čekaj mrežu pri ' +
        'pokretanju i prijavi” čini ih sinkronima: dovoljna je jedna.</p>' +
        '<p>Česte zablude: izmjena GPO-a ne vrijedi odmah; <code>gpupdate /force</code> ponovno primjenjuje sve postavke, ' +
        'ali odjavu ili ponovno pokretanje ne zamjenjuje; ne primjenjuje svako osvježavanje sve postavke iznova.</p>'
    },

    en: {
      stage: 'Group Policy processing: the GPO, the time axis and the client-side extensions',

      gpoTitle: 'GPO',
      gpoVersion: 'version',
      colSetting: 'setting',
      colInGpo: 'in the GPO',
      colOnHost: 'on {h}',
      setScreensaver: 'screen saver timeout',
      setLock: 'lock after inactivity',
      setFolders: 'Documents redirection',
      setMsi: 'assigned package',
      valLocal: 'local',
      valNone: 'none',
      stSame: 'same',
      stEdited: 'waiting',
      stWaitsLogon: 'waits for a synchronous logon',
      stWaitsStartup: 'waits for a synchronous startup',
      stApplied: 'applied',
      partUser: 'user',
      partComputer: 'computer',

      hostClient: 'client',
      hostDc: 'domain controller',
      loggedOn: 'user: {u}',
      now: 'now',
      nextRefresh: 'next refresh',
      everyFive: 'every 5 min',
      fastOn: 'fast logon: on',
      fastOff: 'always wait for the network: on',
      fastDc: 'server: always synchronous',
      nextLogon: 'next logon',
      nextStartup: 'next startup',
      sync: 'synchronous',
      async: 'asynchronous',

      axisUnit: 'min',
      evStart: 'startup',
      evRestart: 'restart',
      evLogon: 'logon',
      evRefresh: 'refresh',
      evEdit: 'GPO edited',
      evNext: 'next',
      evPlanned: 'planned',

      tableTitle: 'Client-side extensions in this pass',
      colCse: 'extension',
      colPart: 'part',
      colBg: 'in the background',
      colHolds: 'setting in the GPO',
      markNone: 'no pass yet',
      markEdit: 't = 0: nothing runs on {h}',
      markRefresh: 'background refresh',
      markGpupdate: 'background pass',
      markLogon: 'logon, {m}',
      markRestart: 'startup {c}, logon {u}',
      cseRegistry: 'Registry (Administrative Templates)',
      cseSecurity: 'Security Settings',
      cseFolders: 'Folder Redirection',
      cseSoftware: 'Software Installation',
      bgApplies: 'yes',
      bgSignals: 'no: asks for sync',
      wordWin: 'applied',
      wordHit: 'waits',
      wordSkip: 'not run',
      noteNothingNew: 'nothing new: skipped',
      noteReapplied: 'unchanged, /force',
      noteSyncLogon: 'next logon synchronous',
      noteSyncStartup: 'next startup synchronous',
      tagEdited: 'edited',

      pDc: 'Domain controller DC01',
      pChange: 'Edit in the GPO',
      optScreensaver: 'screen saver',
      optFolders: 'folders',
      optMsi: 'package',
      pAction: 'Then',
      optWait: 'wait',
      optGpupdate: 'gpupdate',
      optForce: '/force',
      optRelog: 'log off / restart',
      pFast: 'Fast logon optimization',
      pSeed: 'Random offset seed',
      offDcFast: 'Domain controller: always synchronous.',
      offDcSeed: 'Domain controller: no random offset.',

      presetBackground: 'Refresh',
      presetBackgroundHint: 'Screen saver, wait: applied at the refresh (90 min + the offset).',
      presetGpupdate: 'gpupdate',
      presetGpupdateHint: 'Screen saver, gpupdate at t = 5: applied at once.',
      presetFolders: 'Two logons',
      presetFoldersHint: 'Two logons with fast logon: the first asks for a synchronous one, the second applies.',
      presetMsi: 'Package',
      presetMsiHint: 'Assigned package with fast logon: installed only at the second restart.',
      presetDc: 'DC01',
      presetDcHint: 'The same GPO on DC01: refreshed at most 5 minutes later.',
      presetForce: '/force, folders',
      presetForceHint: 'Folder Redirection and /force: everything is reapplied, and Folder Redirection still waits for a logon.',

      legFg: 'foreground pass',
      legBg: 'background pass',
      legOffset: 'random offset',
      legApplied: 'applied',
      legWaits: 'waits for a sync pass',
      legChanged: 'changed',

      capStartPc: '{h} started at t = −10 min and {u} logged on: every setting of the GPO {g} (version {v}) is applied. The next *background refresh* is due at t = {next} min: 90 min + a {off} min random offset.',
      capStartDc: '{h} is a domain controller: it refreshes policy every 5 min, last at t = −2 min. Every setting of the GPO {g} (version {v}) is applied.',
      capStartNoFast: ' “Always wait for the network” is on: every startup and logon pass is synchronous.',
      capEdit: 't = 0: an administrator edits “{s}” in the GPO {g} (version {v}). Nothing changes on {h} yet: the client fetches policy in its own passes; the GPO is not pushed to it.',
      capPlanWait: ' Nobody does anything: we wait.',
      capPlanGpupdate: ' Next, {u} runs {cmd} at t = 5.',
      capPlanLogon: ' Next, {u} logs off and on at t = 30.',
      capPlanRestart: ' Next, {h} is restarted at t = 30.',
      capRefreshApplied: 't = {t}: *background refresh* every 90 min + a {off} min random offset: the setting is applied at t = {t} min, with no logon.',
      capRefreshAppliedDc: 't = {t}: a domain controller refreshes policy every 5 min: the setting is applied {d} min after the edit.',
      capRefreshSignalUser: 't = {t}: background refresh. *Folder Redirection* never applies in the background: it only asks for the next logon to be synchronous.',
      capRefreshSignalComputer: 't = {t}: background refresh. *Software Installation* never installs in the background: it only asks for the next startup to be synchronous.',
      capRefreshQuietUser: 't = {t}: this refresh, too, brings nothing new, and waiting will not apply Folder Redirection. It needs a logon, and that logon will be synchronous.',
      capRefreshQuietComputer: 't = {t}: this refresh, too, brings nothing new, and waiting will not install the package. It needs a restart, and that startup will be synchronous.',
      capCollapsed: [' The refresh at t = {list} brought nothing new.', ' The refreshes at t = {list} brought nothing new.'],
      capGpupdateApplied: 't = {t}: {u} runs {cmd}: a background pass now, and only what changed is applied. The setting is applied at t = {t}.',
      capGpupdateSignalUser: 't = {t}: {cmd} runs a background pass now. Folder Redirection cannot apply in it, so {cmd} asks to log off; the next logon will be synchronous.',
      capGpupdateSignalComputer: 't = {t}: {cmd} runs a background pass now. Software Installation cannot install in it, so {cmd} asks to restart; the next startup will be synchronous.',
      capForceApplied: 't = {t}: {cmd} applies the changed setting and reapplies the unchanged ones too. Folder Redirection and Software Installation still only ask for a synchronous next logon and startup.',
      capPlanMoot: ' The planned step is no longer needed.',
      capForceSignalUser: 't = {t}: {cmd} reapplies every setting, but Folder Redirection still does not run in the background: /force does not replace the logon. {cmd} asks to log off.',
      capForceSignalComputer: 't = {t}: {cmd} reapplies every setting, but Software Installation still does not run in the background: /force does not replace the startup. {cmd} asks to restart.',
      capFgRegistry: 't = {t}: {u} logs off and on. The logon pass applies the setting; Administrative Templates need no synchronous pass.',
      capFgSignalUser: 't = {t}: {u} logs off and on. With *fast logon optimization* the logon does not wait for the network and the pass is asynchronous, so Folder Redirection only asks for the next logon to be synchronous. Not applied yet.',
      capFgSignalComputer: 't = {t}: {h} restarts. With *fast logon optimization* the startup does not wait for the network and the pass is asynchronous, so Software Installation only asks for the next startup to be synchronous. Not installed yet.',
      capFgSecondUser: 't = {t}: the second logon, synchronous: Folder Redirection runs only at logon, and with fast logon only at the second one.',
      capFgSecondComputer: 't = {t}: the second restart, synchronous: the package is installed before the logon screen; with fast logon it takes two restarts.',
      capFgFlaggedUser: 't = {t}: {u} logs off and on. This logon is synchronous because a background pass at t = {f} asked for it: applied at the first logon.',
      capFgFlaggedComputer: 't = {t}: {h} restarts. This startup is synchronous because a background pass at t = {f} asked for it: installed with one restart.',
      capFgNoFastUser: 't = {t}: {u} logs off and on. “Always wait for the network” is on, so the logon pass is synchronous: applied at the first logon.',
      capFgNoFastComputer: 't = {t}: {h} restarts. “Always wait for the network” is on, so the startup pass is synchronous: installed at the first restart.',
      capFgDcUser: 't = {t}: {u} logs off and on. A domain controller always processes policy synchronously at logon: applied.',
      capFgDcComputer: 't = {t}: {h} restarts. A domain controller always processes policy synchronously at startup: installed.',

      explain:
        '<p>A GPO is not pushed to the client. The computer fetches policy in its own passes: the computer part at startup, ' +
        'the user part at logon (<em>foreground processing</em>), and both parts in the <em>background refresh</em> every ' +
        '90 minutes plus a random offset of 0 to 30 minutes, so that thousands of clients do not ask a domain controller in ' +
        'the same minute. A domain controller refreshes every 5 minutes. <code>gpupdate</code> runs a background pass now.</p>' +
        '<p>Each kind of setting is applied by its own <em>client-side extension</em>. Most of them skip a GPO in which nothing ' +
        'changed; security settings are reapplied every 16 hours anyway. Folder Redirection and Software Installation change ' +
        'what the user is working with, so they apply only in a <b>synchronous</b> foreground pass: the logon or startup waits ' +
        'for them. In the background they only ask for the next logon (startup) to be synchronous.</p>' +
        '<p>With <em>fast logon optimization</em> (the default on clients) logon and startup do not wait for the network, so ' +
        'they are asynchronous. That is why a Folder Redirection change takes <b>two</b> logons, and an assigned package two ' +
        'restarts, when no background pass came first. The setting “Always wait for the network at computer startup and ' +
        'logon” makes them synchronous: one is enough.</p>' +
        '<p>Common misconceptions: a GPO change does not apply at once; <code>gpupdate /force</code> reapplies every setting ' +
        'but does not replace a logoff or a restart; not every refresh reapplies every setting.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
