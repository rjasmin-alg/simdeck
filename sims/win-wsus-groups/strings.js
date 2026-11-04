/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-wsus-groups, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *term* marks an English term
   the page sets in italics; none of this sim's terms is in kit/glossary.js yet, so the Croatian pairs are written out
   here (NOTES.md, "Term pairs"). Computer, group and update names (PC-P1, Pilot, All Computers, KB-B) are data,
   filled in by the page: they are what the console shows. The title and subtitle come from sim.json.
   Keys starting with r / tl / sched / ring and the preset keys after presetDecline belong to the rings scene (preset task
   win-update-rings). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'WSUS-ova konzola: grupe računala, odobrenja i vremenska crta za KB-B',

      // params
      targeting: 'Dodjela grupe',
      tServer: 'na poslužitelju',
      tClient: 'na klijentu (GPO)',
      gpoName: 'Grupna pravila za PC-P3 navode',
      gpoPilot: 'Pilot',
      gpoTypo: 'Pliot (tipfeler)',
      firstApproval: 'Prvo odobrenje KB-B (dan 0) za',
      faPilot: 'Pilot',
      faAll: 'All Computers',
      prodDeadline: 'Rok za Production',
      pdNone: 'bez roka',
      pd7: 'dan 7',
      prodDisabled: 'Production nema svoje odobrenje: KB-B nasljeđuje od All Computers.',
      kioskRemove: 'Kiosks: ukloniti KB-B',
      decline: 'Odbij KB-B',
      declineHint: 'Administrator odbija KB-B sljedećeg dana.',

      // presets
      presetPilot: 'Prvo Pilot',
      presetPilotHint: 'KB-B odobren samo za Pilot; Production ga dobiva tek 4. dana.',
      presetDeadline: 'Rok za Production',
      presetDeadlineHint: 'Production s rokom 7. dana: tko odgađa, instalira prisilno.',
      presetTypo: 'Tipfeler u GPO-u',
      presetTypoHint: 'Odabir grupe na klijentu: „Pliot” ne postoji, PC-P3 ostaje u Unassigned Computers.',
      presetTwo: 'Dvije grupe',
      presetTwoHint: 'PC-K1 je u grupi Pilot (instalirati) i u grupi Kiosks (ukloniti): pobjeđuje instaliranje.',
      presetAll: 'Odobri svima',
      presetAllHint: 'Odobrenje za All Computers: sve grupe, i Unassigned, dobivaju ga odmah.',
      presetDecline: 'Odbijanje',
      presetDeclineHint: '2. dana KB-B je odbijen: nitko ga više ne dobiva, a tko ga ima, zadržava ga.',

      // legend
      legendInstall: 'instalirati',
      legendRemove: 'ukloniti',
      legendNot: 'nije odobreno',
      legendDeclined: 'odbijeno',
      legendInherited: 'naslijeđeno od roditelja',
      legendChanged: 'promijenjeno danas',

      // stage
      server: 'WSUS-HQ',
      modeServer: 'dodjela grupe na poslužitelju',
      modeClient: 'dodjela grupe na klijentu (GPO)',
      dayBefore: 'prije dana 0',
      day: 'dan {d}',
      kbCount: 'KB-B instaliran: {n} od {m}',
      colGroup: 'Grupa',
      colMembers: 'Računala',
      noMembers: 'nema',
      allMembers: ['svih {n} (svako računalo)', 'svih {n} (svako računalo)', 'svih {n} (svako računalo)'],
      moveRejected: 'premještanje odbijeno',
      aInstall: 'instalirati',
      aRemove: 'ukloniti',
      aNot: 'nije odobreno',
      aDeclined: 'odbijeno',
      inherited: 'naslijeđeno',
      deadline: 'rok: dan {d}',
      tlTitle: 'KB-B po danima',
      colPc: 'Računalo',
      colGpo: 'GPO navodi',
      colGpoIgnored: 'GPO (zanemareno)',
      colDays: 'dan',
      notYet: 'još se nije javilo',
      cellNa: 'ne nudi se',
      cellDet: 'otkriveno, čeka korisnika',
      cellInst: 'instalirano',
      cellForced: 'prisilno, na roku',
      kbAOld: 'prošlomjesečno',
      kbBNew: 'novo',

      // captions
      capStart: 'KB-B je upravo stigao na WSUS-HQ i još ga nitko nije odobrio. Prošlomjesečni KB-A odobren je za Pilot, Production i Kiosks i ondje je instaliran. {mode} Pritisni → za dan 0.',
      capModeServer: 'Grupe se dodjeljuju na poslužitelju: administrator u konzoli premješta računala.',
      capModeClient: '*Client-side targeting* (dodjela grupe na klijentu): grupu svakog računala određuju njegova *Group Policy* (grupna pravila).',
      capApprovePilot: 'Ažuriranje je odobreno samo za grupu Pilot. Production ga ne vidi — za nju je „nije odobreno”.',
      capApproveAll: 'KB-B je odobren za All Computers: sve ga grupe nasljeđuju, i Unassigned Computers. Danas ga dobiva svako računalo, a nitko ga nije testirao.',
      capApproveAllBut: 'KB-B je odobren za All Computers: nasljeđuju ga sve grupe bez svojeg odobrenja, i Unassigned Computers, iako ga nitko nije testirao.',
      capKioskRemove: 'Za Kiosks: „ukloniti” (KB-B ruši aplikaciju na kiosku).',
      capTwoGroups: '{pc} je u grupi Pilot (instalirati) i u grupi Kiosks (ukloniti): instaliranje pobjeđuje.',
      capApproveProd: 'Pilot je prošao bez problema, pa administrator odobrava KB-B i za Production.',
      capApproveProdDeadline: 'Pilot je prošao bez problema, pa administrator odobrava KB-B za Production, uz *deadline* (rok): dan {d}.',
      capMove: '{pc} je bilo u Unassigned Computers; administrator ga premješta u Pilot.',
      capMoveSees: 'Na današnjem javljanju već vidi odobrenje Pilota.',
      capMoveSame: 'Pilot i dalje nasljeđuje KB-B od All Computers, pa se za {pc} ništa ne mijenja.',
      capMoveRejected: 'Administrator bi premjestio {pc} u Pilot, ali uz dodjelu grupe na klijentu konzola ne može mijenjati članstvo: odlučuju grupna pravila računala.',
      capDecline: 'Administrator odbija KB-B: više se ne nudi nijednoj grupi, bez obzira na odobrenja.',
      capKeeps: '{pcs} ga zadržava: odbijanje ništa ne deinstalira.',
      capKeepsN: '{pcs} ga zadržavaju: odbijanje ništa ne deinstalira.',
      capSkipped: 'Odobrenje za {groups} planirano za danas otpada: KB-B je odbijen.',
      capRegServer: 'Novo računalo {pc} prvi se put javlja i završava u Unassigned Computers, a njegova se grupna pravila („{gpo}”) zanemaruju jer se grupe dodjeljuju na poslužitelju.',
      capEnd: 'Kraj 10 dana: KB-B je instaliran na {n} od {m} računala.',
      capRegClient: '{pc} se prvi put javlja; grupna pravila navode „{gpo}”, pa ide ravno u tu grupu.',
      capRegTypo: '*Client-side targeting* (dodjela grupe na klijentu): pravilo kaže „{gpo}”, takve grupe nema, pa {pc} završava u Unassigned Computers.',
      capDetected: ['Otkriva ga i preuzima {pcs}.', 'Otkrivaju ga i preuzimaju {pcs}.', 'Otkrivaju ga i preuzimaju {pcs}.'],
      capInstalled: ['Korisnik pristaje i instalira: {pcs}.', 'Korisnici pristaju i instaliraju: {pcs}.', 'Korisnici pristaju i instaliraju: {pcs}.'],
      capPostponed: ['{pcs} odgađa instalaciju za 3 dana.', '{pcs} odgađaju instalaciju za 3 dana.', '{pcs} odgađaju instalaciju za 3 dana.'],
      capForced: ['Rok je stigao: {pcs} instalira prisilno i ponovno se pokreće.', 'Rok je stigao: {pcs} instaliraju prisilno i ponovno se pokreću.', 'Rok je stigao: {pcs} instaliraju prisilno i ponovno se pokreću.'],
      capWithdrawn: ['{pcs} ga više ne dobiva, iako ga je čekalo.', '{pcs} ga više ne dobivaju, iako su ga čekala.', '{pcs} ga više ne dobivaju, iako su ga čekala.'],
      capRemoved: ['{pcs} ga deinstalira.', '{pcs} ga deinstaliraju.', '{pcs} ga deinstaliraju.'],
      capWaiting: ['Danas se ništa ne mijenja: {pcs} još čeka korisnika.', 'Danas se ništa ne mijenja: {pcs} još čekaju korisnike.', 'Danas se ništa ne mijenja: {pcs} još čekaju korisnike.'],
      capQuiet: 'Danas se ništa ne mijenja.',
      capStillUnassigned: '{pc} je i dalje u Unassigned Computers i ne vidi odobrenje Pilota.',
      and: ' i ',

      // rings scene (preset task win-update-rings): params, presets, stage, captions
      rings: 'Prstenovi uvođenja',
      rollout: 'Odobrenje',
      roRings: 'po prstenovima',
      roAll: 'All Computers, dan 0',
      ring2Day: 'Ring 2 Broad dobiva odobrenje',
      r2d7: 'dan 7',
      r2d3: 'dan 3',
      r2d2: 'dan 2',
      ring2Disabled: 'Bez prstenova: svi dobivaju odobrenje dana 0.',
      patch: 'Zakrpa',
      patchBad: 'KB-X (loša)',
      patchGood: 'KB-Y (dobra)',
      presetRings: 'Zaustavljena u prstenu 1',
      presetRingsHint: 'Prstenovi: dan 0, 2 i 7. KB-X ruši poslovnu aplikaciju; prsten 1 to javlja i administrator ga odbija.',
      presetNoRings: 'Bez prstenova',
      presetNoRingsHint: 'KB-X za All Computers dana 0: svi ga instaliraju prije nego što itko išta javi.',
      presetShort: 'Prekratka odgoda',
      presetShortHint: 'Ring 2 Broad već dana 2, isti dan kad i prsten 1: javljanje stiže prekasno.',
      presetGood: 'Dobra zakrpa',
      presetGoodHint: 'KB-Y ništa ne kvari: prstenovi ga samo usporavaju.',
      rModeRings: 'prstenovi uvođenja',
      rModeAll: 'bez prstenova',
      rCount: '{kb} instaliran: {n} od {m}',
      rBrokenCount: 'aplikacija ne radi: {n}',
      rProtected: 'zaštićeno: {n}',
      colSched: 'Odobrenje zakazano',
      schedDay: 'dan {d}',
      schedSkipped: 'otpalo',
      schedNone: '—',
      rCellNa: 'nema zakrpe',
      rCellInst: 'instalirano, radi',
      rCellLob: 'koristi poslovnu aplikaciju (kvadrat)',
      rCellBroken: 'instalirano, aplikacija ne radi',
      rTlTitle: '{kb} po prstenovima i danima',
      colRing: 'Prsten',
      rowAdmin: 'Administrator',
      ringSize: '{n} računala, LOB: {k}',
      tlApprove: 'odobreno',
      tlSkipped: 'odobrenje otpalo',
      tlReport: 'javljen problem',
      tlDecline: 'odbijeno',
      tlInstalled: 'instalirano i radi',
      tlBroken: 'aplikacija ne radi',
      rStart: '{kb} je upravo izdan. 34 računala koriste *line-of-business application* (poslovnu aplikaciju, LOB): 4 u prstenu Ring 1 Pilot i 30 u prstenu Ring 2 Broad. {plan} Pritisni → za dan 0.',
      rPlanRings: 'Odobrenja su zakazana po *deployment rings* (prstenovima uvođenja): Ring 0 IT dan 0, Ring 1 Pilot dan 2, Ring 2 Broad dan {r2}. Računala u prstenovima instaliraju zakrpu čim je otkriju.',
      rPlanAll: 'Bez prstenova: administrator ga odobrava za All Computers već dana 0. Svako računalo instalira zakrpu čim je otkrije.',
      rApprove: 'Došao je zakazani dan za {ring}: odobrenje „instalirati”.',
      rApproveAll: '{kb} je odobren za All Computers: dobivaju ga sva računala odjednom.',
      rInstalled: ['{ring}: {n} računalo ga instalira.', '{ring}: {n} računala ga instaliraju.', '{ring}: {n} računala ga instalira.'],
      rBroken: ['Na {n} od njih poslovna aplikacija prestaje raditi.', 'Na {n} od njih poslovna aplikacija prestaje raditi.', 'Na {n} od njih poslovna aplikacija prestaje raditi.'],
      rNoLobRing0: 'Ring 0 IT ne javlja nikakav problem — ali nijedno njegovo računalo ne koristi poslovnu aplikaciju.',
      rReport: ['Dan {d}: {rings} javlja da {kb} ruši poslovnu aplikaciju (na {k} računala).', 'Dan {d}: {rings} javljaju da {kb} ruši poslovnu aplikaciju (na {k} računala).', 'Dan {d}: {rings} javljaju da {kb} ruši poslovnu aplikaciju (na {k} računala).'],
      rStop: 'Administrator ga odbija — {left}, {m} računala, zakrpu nikad ne dobiva.',
      rStopLate: 'Administrator ga odbija, ali zaustaviti nema što: svih {m} računala ga već ima.',
      rStopAgain: '{kb} je već odbijen.',
      rSkipped: 'Zakazano odobrenje za {ring} otpada: {kb} je odbijen.',
      rWaiting: 'Danas se ništa ne mijenja. {ring} čeka svoje odobrenje (dan {d}).',
      rQuiet: 'Danas se ništa ne mijenja.',
      rStillBroken: 'Na {n} računala aplikacija i dalje ne radi: odbijanje ništa ne deinstalira.',
      rEnd: 'Kraj 10 dana: {kb} je na {n} od {m} računala; poslovna aplikacija ne radi na {b}.',
      rEndOk: 'Kraj 10 dana: {kb} je na {n} od {m} računala, i sve radi.',
      rLessonStopped: ['Prstenovi su zaustavili lošu zakrpu: {n} računalo s poslovnom aplikacijom nikad je nije dobilo.', 'Prstenovi su zaustavili lošu zakrpu: {n} računala s poslovnom aplikacijom nikad je nisu dobila.', 'Prstenovi su zaustavili lošu zakrpu: {n} računala s poslovnom aplikacijom nikad je nije dobilo.'],
      rLessonNoRings: 'Bez prstenova zakrpu su svi instalirali već dana 0. Kad je problem prijavljen, nije bilo što zaustaviti.',
      rLessonShort: 'Ring 2 Broad odobren je dana {r2}, prije nego što je problem stigao biti javljen. *Deferral* (odgoda) mora biti barem koliko traju instalacija i javljanje (ovdje 1 dan): dan 3 bio bi dovoljan.',
      rLessonCost: 'Zakrpa je bila dobra, a prstenovi su je samo usporili: Ring 2 Broad dobio ju je tek dana {r2}, a bez prstenova bi dana 0.',
      rLessonLucky: 'Ovaj put zakrpa je bila dobra. Da nije, nije bilo prstena u kojem bi se zaustavila.',

      explain:
        '<p>WSUS ne odobrava ažuriranja računalima nego <em lang="en">computer groups</em> (grupama računala). ' +
        'Uobičajeni put je <em lang="en">staged rollout</em> (postupno uvođenje): najprije mala testna grupa (Pilot), ' +
        'nekoliko dana promatranja, pa tek onda Production. Odobrenje za All Computers preskače test: ' +
        'neprovjereno ažuriranje odmah stiže i na kioske i na proizvodnju.</p>' +
        '<p><b>Nasljeđivanje.</b> Grupa bez svojeg odobrenja ima odobrenje roditelja („isto kao roditelj”); ' +
        'svoje odobrenje grupe ga nadjačava. All Computers je roditelj svima, i grupi Unassigned Computers.</p>' +
        '<p><b>Više grupa.</b> Računalo u više grupa dobiva najjače odobrenje: instalirati pobjeđuje ukloniti, ' +
        'ukloniti pobjeđuje nije odobreno. Od više rokova vrijedi najraniji.</p>' +
        '<p><b>Rok.</b> Bez roka korisnik smije odgađati (ovdje 3 dana). Na roku se ažuriranje instalira ' +
        'prisilno i računalo se ponovno pokreće.</p>' +
        '<p><b>Odbijanje</b> vrijedi za sve grupe odjednom: ažuriranje se više nikome ne nudi. ' +
        'Ništa ne deinstalira — tko ga je već instalirao, zadržava ga.</p>' +
        '<p><b>Kako računalo dolazi u grupu.</b> Uz dodjelu na poslužitelju novo računalo završava u Unassigned ' +
        'Computers dok ga administrator ne premjesti; grupna pravila se zanemaruju. Uz dodjelu na klijentu grupu ' +
        'imenuju grupna pravila računala, a konzola ga ne može premjestiti. Grupa mora postojati na poslužitelju: ' +
        'odabir na klijentu je ne stvara, pa tipfeler ostavlja računalo u Unassigned Computers — samo s odobrenjima koja ta grupa nasljeđuje od All Computers.</p>' +
        '<p><b>Prstenovi.</b> <em lang="en">Deployment ring</em> (prsten uvođenja) je grupa računala čije se odobrenje daje ' +
        'zadani broj dana nakon izdavanja zakrpe — <em lang="en">deferral</em> (odgoda): IT odmah, pilotni korisnici nakon 2 dana, ' +
        'svi ostali nakon 7. Ako zakrpa nešto pokvari, rani prsten to javi i administrator je odbije prije nego što stigne do ' +
        'kasnijih. Windows Update for Business radi isto odgodom po prstenu (0–30 dana) ili <em lang="en">pause</em> (pauziranjem, ' +
        'do 35 dana). Odgoda mora biti barem koliko traju instalacija i javljanje. Što je već instalirano, ostaje pokvareno dok se zakrpa ' +
        'ne ukloni. Prsten IT-a ne hvata sve: IT ne koristi svaku poslovnu aplikaciju. A prstenovi nisu besplatni — i dobra ' +
        'zakrpa stiže kasnije.</p>'
    },

    en: {
      stage: 'The WSUS console: computer groups, approvals and a timeline for KB-B',

      targeting: 'Targeting',
      tServer: 'server-side',
      tClient: 'client-side (GPO)',
      gpoName: 'PC-P3\'s Group Policy names',
      gpoPilot: 'Pilot',
      gpoTypo: 'Pliot (typo)',
      firstApproval: 'First KB-B approval (day 0) for',
      faPilot: 'Pilot',
      faAll: 'All Computers',
      prodDeadline: 'Production deadline',
      pdNone: 'none',
      pd7: 'day 7',
      prodDisabled: 'Production has no approval of its own: KB-B is inherited from All Computers.',
      kioskRemove: 'Kiosks: remove KB-B',
      decline: 'Decline KB-B',
      declineHint: 'The admin declines KB-B on the next day.',

      presetPilot: 'Pilot first',
      presetPilotHint: 'KB-B approved for Pilot only; Production gets it on day 4.',
      presetDeadline: 'Production deadline',
      presetDeadlineHint: 'Production with a deadline on day 7: whoever postpones installs by force.',
      presetTypo: 'Typo in the GPO',
      presetTypoHint: 'Client-side targeting: "Pliot" does not exist, PC-P3 stays in Unassigned Computers.',
      presetTwo: 'Two groups',
      presetTwoHint: 'PC-K1 is in Pilot (Install) and Kiosks (Remove): Install wins.',
      presetAll: 'Approve for all',
      presetAllHint: 'Approval on All Computers: every group, Unassigned too, gets it at once.',
      presetDecline: 'Decline',
      presetDeclineHint: 'KB-B is declined on day 2: nobody gets it any more; whoever has it keeps it.',

      legendInstall: 'Install',
      legendRemove: 'Remove',
      legendNot: 'Not approved',
      legendDeclined: 'Declined',
      legendInherited: 'inherited from the parent',
      legendChanged: 'changed today',

      server: 'WSUS-HQ',
      modeServer: 'server-side targeting',
      modeClient: 'client-side targeting (GPO)',
      dayBefore: 'before day 0',
      day: 'day {d}',
      kbCount: 'KB-B installed: {n} of {m}',
      colGroup: 'Group',
      colMembers: 'Computers',
      noMembers: 'none',
      allMembers: ['all {n} (every computer)', 'all {n} (every computer)'],
      moveRejected: 'move rejected',
      aInstall: 'Install',
      aRemove: 'Remove',
      aNot: 'Not approved',
      aDeclined: 'Declined',
      inherited: 'inherited',
      deadline: 'deadline: day {d}',
      tlTitle: 'KB-B day by day',
      colPc: 'Computer',
      colGpo: 'GPO names',
      colGpoIgnored: 'GPO (ignored)',
      colDays: 'day',
      notYet: 'has not contacted WSUS yet',
      cellNa: 'not offered',
      cellDet: 'detected, waiting for the user',
      cellInst: 'installed',
      cellForced: 'forced at the deadline',
      kbAOld: 'last month',
      kbBNew: 'new',

      capStart: 'KB-B has just arrived on WSUS-HQ and nobody has approved it yet. Last month\'s KB-A was approved for Pilot, Production and Kiosks and is installed there. {mode} Press → for day 0.',
      capModeServer: 'Targeting is server-side: the admin moves computers into groups in the console.',
      capModeClient: 'Client-side targeting: each computer\'s Group Policy names its group.',
      capApprovePilot: 'The update is approved for the Pilot group only. Production doesn\'t see it: for them it is "not approved".',
      capApproveAll: 'KB-B is approved for All Computers: every group inherits it, Unassigned Computers too. Every computer gets an untested update today.',
      capApproveAllBut: 'KB-B is approved for All Computers: every group without an approval of its own inherits it, Unassigned Computers too, though nobody has tested it.',
      capKioskRemove: 'For Kiosks: "Remove" (KB-B breaks the kiosk app).',
      capTwoGroups: '{pc} is in Pilot (Install) and in Kiosks (Remove): Install wins.',
      capApproveProd: 'The pilot went well, so the admin approves KB-B for Production too.',
      capApproveProdDeadline: 'The pilot went well, so the admin approves KB-B for Production with a deadline: day {d}.',
      capMove: '{pc} was in Unassigned Computers; the admin moves it to Pilot.',
      capMoveSees: 'At today\'s contact it already sees Pilot\'s approval.',
      capMoveSame: 'Pilot also inherits KB-B from All Computers, so nothing changes for {pc}.',
      capMoveRejected: 'The admin wants to move {pc} to Pilot, but with client-side targeting the console cannot change membership: the computer\'s Group Policy decides.',
      capDecline: 'The admin declines KB-B: no group is offered it any more, whatever the approvals say.',
      capKeeps: '{pcs} keeps it: declining uninstalls nothing.',
      capKeepsN: '{pcs} keep it: declining uninstalls nothing.',
      capSkipped: 'The approval for {groups} planned for today is not made: KB-B is declined.',
      capRegServer: 'New computer {pc} contacts the server for the first time and lands in Unassigned Computers; its Group Policy ("{gpo}") is ignored with server-side targeting.',
      capEnd: 'End of the 10 days: KB-B is installed on {n} of {m} computers.',
      capRegClient: '{pc} contacts WSUS-HQ for the first time; its Group Policy names "{gpo}", so it goes straight into that group.',
      capRegTypo: 'Client-side targeting: the policy says "{gpo}", there is no such group, so {pc} lands in Unassigned Computers.',
      capDetected: ['Detected and downloaded by {pcs}.', 'Detected and downloaded by {pcs}.'],
      capInstalled: ['The user agrees and installs: {pcs}.', 'The users agree and install: {pcs}.'],
      capPostponed: ['{pcs} postpones the install by 3 days.', '{pcs} postpone the install by 3 days.'],
      capForced: ['The deadline has come: {pcs} installs by force and restarts.', 'The deadline has come: {pcs} install by force and restart.'],
      capWithdrawn: ['{pcs} no longer gets it, though it was waiting for it.', '{pcs} no longer get it, though they were waiting for it.'],
      capRemoved: ['{pcs} uninstalls it.', '{pcs} uninstall it.'],
      capWaiting: ['Nothing changes today: {pcs} is still waiting for its user.', 'Nothing changes today: {pcs} are still waiting for their users.'],
      capQuiet: 'Nothing changes today.',
      capStillUnassigned: '{pc} is still in Unassigned Computers and does not see Pilot\'s approval.',
      and: ' and ',

      rings: 'Deployment rings',
      rollout: 'Approval',
      roRings: 'by ring',
      roAll: 'All Computers, day 0',
      ring2Day: 'Ring 2 Broad is approved on',
      r2d7: 'day 7',
      r2d3: 'day 3',
      r2d2: 'day 2',
      ring2Disabled: 'No rings: everyone is approved on day 0.',
      patch: 'Patch',
      patchBad: 'KB-X (bad)',
      patchGood: 'KB-Y (good)',
      presetRings: 'Stopped at ring 1',
      presetRingsHint: 'Rings on days 0, 2 and 7. KB-X breaks the business app; ring 1 reports it and the admin declines it.',
      presetNoRings: 'No rings',
      presetNoRingsHint: 'KB-X for All Computers on day 0: everyone installs it before anyone reports anything.',
      presetShort: 'Deferral too short',
      presetShortHint: 'Ring 2 Broad on day 2, the same day as ring 1: the report comes too late.',
      presetGood: 'Good patch',
      presetGoodHint: 'KB-Y breaks nothing: the rings only slow it down.',
      rModeRings: 'deployment rings',
      rModeAll: 'no rings',
      rCount: '{kb} installed: {n} of {m}',
      rBrokenCount: 'app broken: {n}',
      rProtected: 'protected: {n}',
      colSched: 'Approval scheduled',
      schedDay: 'day {d}',
      schedSkipped: 'skipped',
      schedNone: '—',
      rCellNa: 'no patch',
      rCellInst: 'installed, works',
      rCellLob: 'runs the business app (square)',
      rCellBroken: 'installed, app broken',
      rTlTitle: '{kb} by ring and day',
      colRing: 'Ring',
      rowAdmin: 'Admin',
      ringSize: '{n} computers, LOB: {k}',
      tlApprove: 'approved',
      tlSkipped: 'approval skipped',
      tlReport: 'problem reported',
      tlDecline: 'declined',
      tlInstalled: 'installed and working',
      tlBroken: 'app broken',
      rStart: '{kb} has just been released. 34 computers run the line-of-business application (LOB): 4 in Ring 1 Pilot and 30 in Ring 2 Broad. {plan} Press → for day 0.',
      rPlanRings: 'The approvals are scheduled by deployment ring: Ring 0 IT on day 0, Ring 1 Pilot on day 2, Ring 2 Broad on day {r2}. Computers in the rings install the patch as soon as they detect it.',
      rPlanAll: 'No rings: the admin approves it for All Computers on day 0. Every computer installs the patch as soon as it detects it.',
      rApprove: 'The scheduled day for {ring} has come: approval "Install".',
      rApproveAll: '{kb} is approved for All Computers: every computer gets it at once.',
      rInstalled: ['{ring}: {n} computer installs it.', '{ring}: {n} computers install it.'],
      rBroken: ['On {n} of them the business app stops working.', 'On {n} of them the business app stops working.'],
      rNoLobRing0: 'Ring 0 IT reports no problem — but none of its computers runs the business app.',
      rReport: ['Day {d}: {rings} reports that {kb} breaks the business app (on {k} computers).', 'Day {d}: {rings} report that {kb} breaks the business app (on {k} computers).'],
      rStop: 'The admin declines it, and {left}, {m} computers, never gets the patch.',
      rStopLate: 'The admin declines it, but there is nothing left to stop: all {m} computers already have it.',
      rStopAgain: '{kb} is already declined.',
      rSkipped: 'The scheduled approval for {ring} is not made: {kb} is declined.',
      rWaiting: 'Nothing changes today. {ring} waits for its approval (day {d}).',
      rQuiet: 'Nothing changes today.',
      rStillBroken: 'The app is still broken on {n} computers: declining uninstalls nothing.',
      rEnd: 'End of the 10 days: {kb} is on {n} of {m} computers; the business app is broken on {b}.',
      rEndOk: 'End of the 10 days: {kb} is on {n} of {m} computers, and everything works.',
      rLessonStopped: ['The rings stopped a bad patch: {n} computer with the business app never got it.', 'The rings stopped a bad patch: {n} computers with the business app never got it.'],
      rLessonNoRings: 'Without rings everyone installed the patch on day 0. When the problem was reported, there was nothing left to stop.',
      rLessonShort: 'Ring 2 Broad was approved on day {r2}, before the problem could be reported. The deferral must be at least install plus report (here 1 day): day 3 would have been enough.',
      rLessonCost: 'The patch was good, and the rings only slowed it down: Ring 2 Broad got it on day {r2}; without rings, on day 0.',
      rLessonLucky: 'This time the patch was good. Had it not been, there was no ring to stop it in.',

      explain:
        '<p>WSUS approves updates not for computers but for computer groups. The usual path is a staged rollout: first ' +
        'a small test group (Pilot), a few days of watching, and only then Production. Approving for All Computers skips ' +
        'the test: an untested update reaches the kiosks and production at once.</p>' +
        '<p><b>Inheritance.</b> A group with no approval of its own has its parent\'s ("same as parent"); the group\'s own ' +
        'approval overrides it. All Computers is everyone\'s parent, Unassigned Computers included.</p>' +
        '<p><b>Several groups.</b> A computer in several groups gets the strongest approval: Install beats Remove, Remove ' +
        'beats Not approved. Of several deadlines, the earliest applies.</p>' +
        '<p><b>Deadline.</b> Without one, the user may postpone (here: 3 days). At the deadline the update installs by ' +
        'force and the computer restarts.</p>' +
        '<p><b>Declining</b> applies to every group at once: the update is offered to nobody any more. It uninstalls ' +
        'nothing; whoever installed it keeps it.</p>' +
        '<p><b>How a computer gets into a group.</b> With server-side targeting a new computer sits in Unassigned ' +
        'Computers until the admin moves it; Group Policy is ignored. With client-side targeting the computer\'s Group ' +
        'Policy names the group and the console cannot move it. The group must exist on the server: client-side ' +
        'targeting does not create it, so a typo leaves the computer in Unassigned Computers, with only the approvals that group inherits from All Computers.</p>' +
        '<p><b>Rings.</b> A deployment ring is a group of computers approved a fixed number of days after a patch is released ' +
        '(a deferral): IT at once, pilot users after 2 days, everyone else after 7. If the patch breaks something, an early ring ' +
        'reports it and the admin declines it before it reaches the later rings. Windows Update for Business does the same with a ' +
        'deferral per ring (0–30 days) or a pause (up to 35 days). The deferral must be at least install plus report. ' +
        'Whatever was installed stays broken until the patch is removed. The IT ring does not catch everything: IT does not run ' +
        'every business app. And rings are not free: a good patch arrives later too.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
