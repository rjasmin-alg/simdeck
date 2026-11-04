/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-wsus-groups, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *term* marks an English term
   the page sets in italics; none of this sim's terms is in kit/glossary.js yet, so the Croatian pairs are written out
   here (NOTES.md, "Term pairs"). Computer, group and update names (PC-P1, Pilot, All Computers, KB-B) are data,
   filled in by the page: they are what the console shows. The title and subtitle come from sim.json. */
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
        'odabir na klijentu je ne stvara, pa tipfeler ostavlja računalo u Unassigned Computers — samo s odobrenjima koja ta grupa nasljeđuje od All Computers.</p>'
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
        'targeting does not create it, so a typo leaves the computer in Unassigned Computers, with only the approvals that group inherits from All Computers.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
