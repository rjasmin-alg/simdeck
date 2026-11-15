/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-gpo-loopback, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. *term* in a caption is an English term, drawn in italics (the Croatian term rule: English in
   italics, Croatian in parentheses at the first mention). GPO, container, user, computer and file names are data.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Korisnik i računalo u dva OU-a, GPO-ovi i korisničke postavke pri prijavi',
      domainName: 'Domena {name}',
      user: 'korisnik',
      computer: 'računalo',
      logon: '{user} se prijavljuje na {pc}',
      halfUser: 'Korisnička konfiguracija',
      halfComputer: 'Konfiguracija računala',
      setWallpaper: 'Pozadina radne površine',
      setDrive: 'Mapiranje pogona',
      setHideCp: 'Sakrij upravljačku ploču',
      setLoopback: 'Način obrade povratne petlje',
      setNone: 'nema korisničkih postavki',
      valOn: 'uključeno',
      modeOff: 'nije konfigurirano',
      modeMerge: 'merge (spajanje)',
      modeReplace: 'replace (zamjena)',
      readUsers: 'korisnici: čitanje i primjena',
      readYes: 'da',
      readNo: 'ne',
      pathUser: 'put korisnika',
      pathComputer: 'put računala',
      tableTitle: 'Korisničke postavke za {user} na {pc}, redom obrade',
      colGpo: 'GPO',
      colSetting: 'Postavka',
      colValue: 'Vrijednost',
      colMark: 'Ishod',
      markStands: 'vrijedi',
      markOver: 'prepisana',
      markWin: 'pobjeđuje',
      markSkip: 'odbačena',
      whyUnused: 'bez loopbacka',
      whyReplaced: 'zamjena',
      whyFiltered: 'bez čitanja i primjene',
      whyBlocked: 'blokiran',
      whyLinkOff: 'veza isključena',
      whyHalfOff: 'korisnička polovica isključena',
      implicit: 'postavka koju nijedan GPO ne postavi: zadano',
      implicitAll: 'sve zadano',
      resultNow: 'Sada vrijedi za {user}',
      resultFinal: 'Rezultat za {user} na {pc}',
      resWallpaper: 'Pozadina',
      resDrive: 'Pogon P:',
      resCp: 'Upravljačka ploča',
      resDefault: 'zadana',
      resMapped: 'mapiran',
      resNotMapped: 'nije mapiran',
      resHidden: 'skrivena',
      resVisible: 'vidljiva',
      resFrom: 'iz {gpo}',
      resFromDefault: 'nijedan GPO',
      mode: 'Loopback u GPO-u Kiosk Lockdown',
      optOff: 'isključen',
      optMerge: 'merge',
      optReplace: 'replace',
      usersCanRead: 'Korisnici: čitanje i primjena na Kiosk Lockdown',
      presetOff: 'Bez loopbacka',
      presetOffHint: 'Kiosk ima korisničke postavke, ali ana ih ne dobiva.',
      presetMerge: 'Merge (spajanje)',
      presetMergeHint: 'Korisnikova pravila pa kioskova; kiosk pobjeđuje.',
      presetReplace: 'Replace (zamjena)',
      presetReplaceHint: 'Samo kioskova pravila: P: nestaje.',
      presetFiltered: 'Replace, korisnici bez prava',
      presetFilteredHint: 'Korisnici nemaju čitanje i primjenu na Kiosk Lockdown.',
      legUser: 'GPO s puta korisnika',
      legComputer: 'GPO s puta računala',
      legOver: 'prepisana',
      legSkip: 'odbačena',
      legWin: 'pobjednik',
      legChanged: 'ovaj korak',
      list2: '{a} i {b}',
      listMore: '{a}, {b}',
      pair: '{setting} = {value}',
      capStartOff: '{user} se prijavljuje na {pc}. *Loopback* (obrada povratne petlje) nije konfiguriran: korisničke postavke dolaze s puta korisnika, iz {ou}. Jedan GPO po koraku.',
      capStartMerge: '{user} se prijavljuje na {pc}. Pri pokretanju je računalo {pc} primijenilo konfiguraciju računala iz {gpo}: *loopback* (obrada povratne petlje) u načinu *merge* (spajanje). Nakon GPO-ova korisnika obrađuju se i korisničke postavke GPO-ova s puta računala.',
      capStartReplace: '{user} se prijavljuje na {pc}. Pri pokretanju je računalo {pc} primijenilo konfiguraciju računala iz {gpo}: *loopback* (obrada povratne petlje) u načinu *replace* (zamjena). Korisničke postavke dolaze samo s puta računala.',
      capStartNoRead: 'Korisnici nemaju čitanje i primjenu na {gpo}.',
      capApplyFirst: 'Korak {n}: {gpo} ({path}) dodaje: {list}.',
      capApplyLater: 'Korak {n}: {gpo} ({path}) obrađuje se poslije i dodaje: {list}.',
      capOver: '{v} prepisuje {old} iz {prev}: u sukobu pobjeđuje kasnije obrađeni.',
      capUnused: 'Korak {n}: {gpo} je povezan na {ou}, OU računala. Bez *loopbacka* njegove korisničke postavke ne vrijede za {user}: vrijedile bi samo za korisnike čiji je račun u {ou}.',
      capReplaced: 'Korak {n}: u načinu *replace* GPO-ovi s puta korisnika ne vrijede, pa se {gpo} odbacuje.',
      capFiltered: 'Korak {n}: {user} nema čitanje i primjenu (*Read*, *Apply Group Policy*) na {gpo}: sigurnosno filtriranje ga odbacuje i uz *loopback*.',
      capSkipped: 'Korak {n}: {gpo} se preskače ({why}).',
      capResOff: 'Bez *loopbacka* {user} dobiva samo pravila sa svog puta. Korisničke postavke iz {gpo} ne koriste se, iako je {pc} u OU-u na koji je {gpo} povezan.',
      capResMerge: '*Loopback* u načinu *merge* (spajanje): prvo pravila korisnika, zatim korisnička pravila iz OU-a računala — u sukobu pobjeđuje kiosk.',
      capResReplace: 'U načinu *replace* (zamjena) korisnik dobiva samo pravila kioska: pogon P: nestaje.',
      capResReplaceNone: 'Nijedna korisnička postavka: *replace* odbacuje GPO-ove korisnika, a sigurnosno filtriranje odbacuje {gpo}. {user} dobiva zadane postavke.',
      capResMergeNoRead: '*Loopback* je uključen, ali {user} nema čitanje i primjenu na {gpo}: ostaju samo pravila korisnika, kao bez *loopbacka*.',
      explain: '<p><b>Bez <em lang="en">loopbacka</em></b> (obrade povratne petlje) korisnik dobiva korisničke postavke s <b>vlastitog</b> puta (svoj OU), a računalo postavke ' +
        'računala sa svog puta. Korisnička konfiguracija u GPO-u povezanom na OU računala ne vrijedi za onoga tko se prijavi: ' +
        'vrijedila bi samo za korisnike čiji je račun u tom OU-u. Česta zabluda: „korisničke postavke GPO-a na OU-u računala vrijede ' +
        'za svakoga tko se prijavi”.</p>' +
        '<p><em lang="en">Loopback processing</em> (obrada povratne petlje) je <b>postavka računala</b> (Konfiguracija računala › ' +
        'Administrativni predlošci › Sustav › Pravila grupe). Vrijedi samo ako se GPO koji je postavlja primjenjuje na računalo. ' +
        'Ne mijenja postavke računala: mijenja samo odakle dolaze korisničke postavke.</p>' +
        '<p><em lang="en">Merge</em> (spajanje): prvo se obrade GPO-ovi korisnika, zatim korisnička konfiguracija GPO-ova s puta ' +
        'računala. Zadnji obrađeni pobjeđuje, pa u sukobu pobjeđuje računalo; ostale postavke korisnika ostaju.</p>' +
        '<p><em lang="en">Replace</em> (zamjena): korisničke postavke dolaze samo s puta računala; GPO-ovi korisnika se ne ' +
        'koriste. Tipično za zaključane kioske i učionice; poslužitelji udaljenih radnih površina često koriste <em lang="en">merge</em>.</p>' +
        '<p>Sigurnosno filtriranje vrijedi i dalje: GPO s puta računala filtrira se tokenom <b>korisnika</b>. Bez dozvola ' +
        '<em lang="en">Read</em> i <em lang="en">Apply Group Policy</em> za korisnika GPO se odbacuje: <em lang="en">loopback</em> ga ne zaobilazi. ' +
        'Unutar svakog popisa vrijedi uobičajena prednost (redoslijed veza, prisilne veze, blokiranje nasljeđivanja).</p>'
    },
    en: {
      stage: 'A user and a computer in two OUs, their GPOs and the user settings at logon',
      domainName: 'Domain {name}',
      user: 'user',
      computer: 'computer',
      logon: '{user} logs on to {pc}',
      halfUser: 'User Configuration',
      halfComputer: 'Computer Configuration',
      setWallpaper: 'Desktop wallpaper',
      setDrive: 'Drive map',
      setHideCp: 'Hide Control Panel',
      setLoopback: 'Loopback processing mode',
      setNone: 'no user settings',
      valOn: 'on',
      modeOff: 'not configured',
      modeMerge: 'Merge',
      modeReplace: 'Replace',
      readUsers: 'users: Read and Apply',
      readYes: 'yes',
      readNo: 'no',
      pathUser: 'user path',
      pathComputer: 'computer path',
      tableTitle: 'User settings for {user} on {pc}, in processing order',
      colGpo: 'GPO',
      colSetting: 'Setting',
      colValue: 'Value',
      colMark: 'Result',
      markStands: 'stands',
      markOver: 'overwritten',
      markWin: 'wins',
      markSkip: 'dropped',
      whyUnused: 'no loopback',
      whyReplaced: 'replace',
      whyFiltered: 'no Read and Apply',
      whyBlocked: 'blocked',
      whyLinkOff: 'link disabled',
      whyHalfOff: 'user half disabled',
      implicit: 'a setting no GPO sets: the default',
      implicitAll: 'all default',
      resultNow: 'Now in force for {user}',
      resultFinal: 'Result for {user} on {pc}',
      resWallpaper: 'Wallpaper',
      resDrive: 'Drive P:',
      resCp: 'Control Panel',
      resDefault: 'default',
      resMapped: 'mapped',
      resNotMapped: 'not mapped',
      resHidden: 'hidden',
      resVisible: 'visible',
      resFrom: 'from {gpo}',
      resFromDefault: 'no GPO',
      mode: 'Loopback in Kiosk Lockdown',
      optOff: 'off',
      optMerge: 'merge',
      optReplace: 'replace',
      usersCanRead: 'Users: Read and Apply on Kiosk Lockdown',
      presetOff: 'No loopback',
      presetOffHint: 'The kiosk has user settings, but ana does not get them.',
      presetMerge: 'Merge',
      presetMergeHint: 'The user\'s policy, then the kiosk\'s; the kiosk wins.',
      presetReplace: 'Replace',
      presetReplaceHint: 'Only the kiosk\'s policy: P: is gone.',
      presetFiltered: 'Replace, users without rights',
      presetFilteredHint: 'Users have no Read and Apply on Kiosk Lockdown.',
      legUser: 'GPO on the user\'s path',
      legComputer: 'GPO on the computer\'s path',
      legOver: 'overwritten',
      legSkip: 'dropped',
      legWin: 'winner',
      legChanged: 'this step',
      list2: '{a} and {b}',
      listMore: '{a}, {b}',
      pair: '{setting} = {value}',
      capStartOff: '{user} logs on to {pc}. Loopback processing is not configured: user settings come from the user\'s path, {ou}. One GPO per step.',
      capStartMerge: '{user} logs on to {pc}. At startup {pc} applied the computer configuration of {gpo}: loopback processing in merge mode. After the user\'s GPOs, the user settings of the GPOs on the computer\'s path are processed too.',
      capStartReplace: '{user} logs on to {pc}. At startup {pc} applied the computer configuration of {gpo}: loopback processing in replace mode. User settings come only from the computer\'s path.',
      capStartNoRead: 'Users have no Read and Apply on {gpo}.',
      capApplyFirst: 'Step {n}: {gpo} ({path}) adds: {list}.',
      capApplyLater: 'Step {n}: {gpo} ({path}) is processed later and adds: {list}.',
      capOver: '{v} overwrites {old} from {prev}: the one processed later wins a conflict.',
      capUnused: 'Step {n}: {gpo} is linked to {ou}, the computer\'s OU. Without loopback its user settings do not apply to {user}: they would apply only to users whose accounts are in {ou}.',
      capReplaced: 'Step {n}: in replace mode the GPOs on the user\'s path do not apply, so {gpo} is dropped.',
      capFiltered: 'Step {n}: {user} has no Read and Apply Group Policy on {gpo}: security filtering drops it, even with loopback.',
      capSkipped: 'Step {n}: {gpo} is skipped ({why}).',
      capResOff: 'Without loopback {user} gets only the policy from the user\'s own path. The user settings in {gpo} are not used, even though {pc} is in the OU it is linked to.',
      capResMerge: 'Loopback in merge mode: the user\'s policy first, then the user settings from the computer\'s OU — the kiosk wins conflicts.',
      capResReplace: 'In replace mode the user gets only the kiosk\'s policy: drive P: is gone.',
      capResReplaceNone: 'No user settings at all: replace drops the user\'s GPOs, and security filtering drops {gpo}. {user} gets the defaults.',
      capResMergeNoRead: 'Loopback is on, but {user} has no Read and Apply on {gpo}: only the user\'s own policy is left, as without loopback.',
      explain: '<p><b>Without loopback</b> a user gets user settings from the user\'s <b>own</b> path (the user\'s OU), and the ' +
        'computer gets computer settings from its path. The User Configuration of a GPO linked to the computer\'s OU does not ' +
        'apply to whoever logs on: it would apply only to users whose accounts are in that OU. A common mistake: "user settings in ' +
        'a GPO on the computer\'s OU apply to everyone who logs on".</p>' +
        '<p><b>Loopback processing</b> is a <b>computer setting</b> (Computer Configuration › Administrative Templates › System › ' +
        'Group Policy). It takes effect only when the GPO that sets it applies to the computer. It does not replace computer ' +
        'settings: it changes only where user settings come from.</p>' +
        '<p><b>Merge</b>: the user\'s GPOs are processed first, then the User Configuration of the GPOs on the computer\'s path. ' +
        'The last one processed wins, so the computer\'s side wins conflicts; the user\'s other settings stay.</p>' +
        '<p><b>Replace</b>: user settings come only from the computer\'s path; the user\'s own GPOs are not used. Typical for ' +
        'locked-down kiosks and classrooms; remote desktop session hosts often use merge.</p>' +
        '<p>Security filtering still holds: a GPO on the computer\'s path is filtered with the <b>user\'s</b> token. Without Read ' +
        'and Apply Group Policy for the user the GPO is dropped: loopback does not bypass it. Within each list the normal ' +
        'precedence holds (link order, Enforced, Block Inheritance).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
