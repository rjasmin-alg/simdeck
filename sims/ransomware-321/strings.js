/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ransomware-321, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). [[term]] is a glossary term
   (kit/glossary.js). Drive letters and paths are data, written by the page with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Datotečni poslužitelj i svaka kopija njegovih podataka, s napadačem i popisom 3-2-1',

      zoneServer: 'Na poslužitelju',
      zoneLan: 'U mreži, na lokaciji',
      zoneOffsite: 'Izvan lokacije',
      zoneEmpty: 'ništa izvan lokacije',

      nameSrc: 'Izvorni podaci',
      nameVss: 'Kopije u sjeni (VSS)',
      nameMirror: 'Zrcalo na NAS-u',
      nameUsb: 'USB disk',
      nameRepo: 'Spremište kopija (NAS)',
      nameCloud: 'Kopija u oblaku',
      nameTape: 'Tjedna vrpca',

      mediumDisk: 'disk',
      mediumCloud: 'objektna pohrana',
      mediumTape: 'vrpca',
      siteOn: 'na lokaciji',
      siteOff: 'izvan lokacije',
      kindLive: 'živi podaci',
      kindSnapshot: 'snimke na istom volumenu',
      kindMirror: 'zrcalo, svake večeri u 22:00',
      kindUsb: 'tjedna kopija, stalno priključen',
      kindRepo: 'kopija s verzijama, svake večeri u 22:00',
      kindCloud: 'kopija verzija iz spremišta',
      kindTape: 'tjedna kopija, odnesena s lokacije',

      reachLabel: 'dohvaća je:',
      reachLocal: 'lokalni administrator poslužitelja',
      reachDaSaved: 'domenski administrator, lozinka spremljena na poslužitelju',
      reachOther: 'račun kojeg nema na poslužitelju',
      reachNone: 'ništa u mreži',
      tagSame: 'ista vjerodajnica',
      tagOther: 'druga vjerodajnica',
      tagOffline: 'izvan mreže',
      lockLine: 'zaključano {days} dana (WORM)',
      vssOff: 'isključene: nema snimaka',
      versionsLabel: 'verzije:',
      versionsNone: 'nema',
      liveChip: 'živi',
      newestLabel: 'najnovija čista:',
      newestNone: 'nijedna',
      stClean: 'čista',
      stEncrypted: 'šifrirana',
      stDeleted: 'obrisana',
      stOff: 'isključena',
      badgeAttacker: 'napadač',

      sideClock: 'Vrijeme',
      clockBefore: 'pon 9. 11., prije 02:10',
      sideAttacker: 'Napadač ima',
      credUser: 'korisnik',
      credLocal: 'lokalni administrator',
      credDa: 'domenski administrator',
      credNone: 'još ništa',
      credBlocked: 'prijava odbijena (MFA)',
      chkTitle: 'Pravilo 3-2-1',
      chkRule: 'pravilo',
      chkPaper: 'na papiru',
      chkReal: 'jedna vjerodajnica',
      chkCopies: '3 kopije',
      chkMedia: '2 medija',
      chkOffsite: '1 izvan lokacije',
      chkOffline: '+1 izvan mreže ili nepromjenjiva',
      chkYes: 'da',
      chkNo: 'ne',
      outSurvivors: ['preživjela je {n} kopija', 'preživjele su {n} kopije', 'preživjelo je {n} kopija'],
      outRestore: 'oporavak iz: {copy}',
      outNewest: 'najnovija čista verzija: {time}',
      outLost: 'izgubljeno: {dur}',
      outTotal: 'izgubljeno: sve što je bilo samo ovdje',
      outIntact: 'izvor je netaknut: ništa nije izgubljeno',

      durD: ['{n} dan', '{n} dana', '{n} dana'],
      durH: '{n} h',
      durM: '{n} min',
      wd0: 'pon', wd1: 'uto', wd2: 'sri', wd3: 'čet', wd4: 'pet', wd5: 'sub', wd6: 'ned',
      timeShort: '{wd} {hm}',
      timeDate: '{d}. {mon} {hm}',
      timeFull: '{wd} {d}. {mon} {hm}',
      dateOnly: '{d}. {mon}',
      mon10: '10.', mon11: '11.', mon12: '12.',

      design: 'Plan kopija',
      designEstate: 'zrcalo + USB',
      design321: '3-2-1 u mreži',
      designImm: 'nepromjenjiva',
      designTape: 'vrpca',
      designHint: 'Zrcalo i USB disk ostaju u svakom planu; ostali planovi dodaju spremište i treću kopiju.',
      mfaOnVpn: 'MFA na VPN-u',
      mfaHint: 'Prijava preko VPN-a traži i drugi faktor, ne samo lozinku.',
      credOnServer: 'Lozinka računa za kopije na poslužitelju',
      credHint: 'Lozinka računa za kopije (domenski administrator) spremljena je na poslužitelju za Z: i poslove.',

      presetEstate: 'Zrcalo i USB',
      presetEstateHint: 'Poslužitelj kakav jest: zrcalo Z:, USB disk E:, kopije u sjeni isključene.',
      preset321: '3-2-1 u mreži',
      preset321Hint: 'Spremište s verzijama i kopija u oblaku; obje se mogu pisati kao domenski administrator.',
      presetImm: 'Nepromjenjiva kopija',
      presetImmHint: 'Isto, ali kopija u oblaku zaključana je 30 dana.',
      presetTape: 'Vrpca izvan mreže',
      presetTapeHint: 'Spremište i tjedna vrpca, odnesena s lokacije u petak.',
      presetMfa: 'MFA',
      presetMfaHint: 'Prijava preko VPN-a traži drugi faktor.',

      legendClean: 'čista kopija',
      legendEnc: 'šifrirana',
      legendDel: 'obrisana',
      legendImm: 'nepromjenjiva',
      legendOff: 'izvan mreže',
      legendAtt: 'napadač',
      legendChanged: 'promjena',

      capStart: 'Ponedjeljak, rano ujutro: datotečni poslužitelj i svaka kopija njegovih podataka, svaka sa svojom najnovijom čistom verzijom. Pritisni → za napad.',
      capStep: 'Korak {n}, {time}:',
      capLogon: 'netko se preko VPN-a prijavljuje valjanim računom. Lozinka je dovoljna, drugog faktora nema.',
      capBlocked: 'prijava preko VPN-a traži drugi faktor koji napadač nema: odbijena. Ništa se dalje ne događa.',
      capLocalAdmin: 'grupna politika čini svakog interaktivnog korisnika lokalnim administratorom: napadač je sada administrator poslužitelja.',
      capFound: 'na poslužitelju je spremljena lozinka računa za kopije, a taj je račun domenski administrator. Napadač sada ima tu lozinku.',
      capNotFound: 'na poslužitelju nema spremljene lozinke: napadač ostaje lokalni administrator.',
      capSource: 'napadač šifrira izvorne podatke {path}.',
      capMirror: 'Z: je mapiran s istom vjerodajnicom domenskog administratora — napadač ga šifrira izravno.',
      capMirrorOut: 'za Z: treba račun kojeg nema na poslužitelju: napadač zrcalo sada ne može pisati.',
      capUsb: 'E: je priključen, dakle u mreži, ma kako se zvao: napadač šifrira USB disk zajedno s kopijama na njemu.',
      capVss: 'lokalni administrator poslužitelja briše kopije u sjeni na D:.',
      capVssOff: 'kopije u sjeni na D: isključene su: nema se što brisati.',
      capBackups: 'napadač traži druge kopije.',
      capRepoDeleted: 'Kao domenski administrator briše spremište kopija.',
      capCloudDeleted: 'Briše i kopiju u oblaku.',
      capCloudLocked: 'Kopija u oblaku odbija brisanje: verzije su zaključane, najranija do {date}.',
      capTapeOff: 'Vrpca je izvan mreže: ne dohvaća je.',
      capBackupsOut: 'Spremište i kopiju u oblaku piše samo račun kojeg nema na poslužitelju: ne dohvaća ih.',
      capBackupsOutRepo: 'Spremište piše samo račun kojeg nema na poslužitelju: ne dohvaća ga.',
      capBackupsNone: 'U ovom planu drugih kopija nema.',
      capJobs: 'nitko još nije primijetio, pa se pokreću zakazani poslovi.',
      capJobMirror: 'Zrcalo kopira šifrirane datoteke preko svoje kopije.',
      capJobMirrorAgain: 'Zrcalo ponovno kopira šifrirane datoteke.',
      capJobAdded: 'Spremište dodaje šifriranu verziju, a stare čuva.',
      capJobCloud: 'Kopija u oblaku također dobiva šifriranu verziju; starije ostaju.',
      capJobFailed: 'Spremišta više nema: posao kopiranja ne uspijeva.',
      capDiscovery: 'korisnici nalaze šifrirane datoteke.',
      capCount: 'brojimo što je preživjelo.',
      capCountNone: 'Nijedna kopija nema čistu verziju: izgubljeno je sve što je bilo samo ovdje.',
      capCountSome: 'Oporavak iz: {copy}, najnovija čista verzija {time}. Izgubljene su promjene iz zadnjih {dur} prije napada.',
      capCountIntact: 'Ništa nije šifrirano: izvor je netaknut i ništa nije izgubljeno.',
      noteOnPaper: '3-2-1 je zadovoljeno na papiru, ali sve kopije dohvaća ista vjerodajnica: preživjelih 0.',
      noteTie: '{a} i {b} imaju istu najnoviju čistu verziju: oporavak iz one na lokaciji, brže je.',

      explain:
        '<p><b>Što preživi.</b> Napadač koji je preuzeo poslužitelj šifrira i briše sve što može dohvatiti. Preživi samo kopija ' +
        'koju ne dohvaća: zato što je za nju potrebna druga vjerodajnica, zato što je izvan mreže, ili zato što se ne može ' +
        'promijeniti prije isteka zaključavanja.</p>' +
        '<p><b>Ista vjerodajnica, jedna kopija.</b> Kopija koju napadač dohvaća istom vjerodajnicom kao izvor nije ' +
        '[[backup]], nego još jedna kopija iste sudbine. Ovdje je to lozinka računa za kopije spremljena na poslužitelju: ' +
        'domenski administrator otvara zrcalo, spremište i oblak odjednom.</p>' +
        '<p><b>Zrcalo nije sigurnosna kopija.</b> [[mirroring]] prenosi i brisanje i šifriranje pri sljedećem pokretanju, kao što ' +
        'RAID 1 zapisuje istu grešku na oba diska. Kopija s verzijama dodaje novu verziju i čuva stare.</p>' +
        '<p><b>Priključen disk je u mreži.</b> USB disk koji stalno visi na poslužitelju napadač vidi kao svaki drugi disk.</p>' +
        '<p><b>Kopije u sjeni.</b> Snimke na istom volumenu (Windows VSS, „prethodne verzije") administrator tog računala ' +
        'može obrisati, pa ne prežive preuzimanje poslužitelja.</p>' +
        '<p><b>Nepromjenjivo i izvan mreže.</b> Nepromjenjivu kopiju (zaključavanje objekta, WORM) do isteka zaključavanja ne ' +
        'može obrisati ni prebrisati nitko, ni administrator sustava kopija. Kopija izvan mreže nedohvatljiva je dok se ne ' +
        'priključi.</p>' +
        '<p><b>3-2-1.</b> Barem 3 kopije, na 2 različita medija, 1 izvan lokacije. Popis se kvači brojanjem kartica, ali ' +
        'kopije koje dohvaća ista vjerodajnica broje se kao jedna. Mnogi dodaju i četvrti uvjet: jedna kopija izvan mreže ' +
        'ili nepromjenjiva.</p>' +
        '<p><b>Koliko se gubi.</b> [[recovery point]] je najnovija čista verzija koja je preživjela; izgubljeno je sve ' +
        'zapisano od nje do napada u 02:10. Kad dvije kopije imaju istu verziju, oporavak ide iz one na lokaciji.</p>' +
        '<p><b>Zablude.</b> „3-2-1 samo po sebi zaustavlja ucjenjivački program": ne, ako sve kopije dohvaća jedna ' +
        'vjerodajnica. „Zrcalo ili RAID su sigurnosna kopija": ne, prenose štetu. „USB disk je izvan mreže jer je zaseban disk": ne, ' +
        'dok je priključen.</p>' +
        '<p><b>Pojednostavljenja.</b> Brzina oporavka, oporavak identiteta i put ulaska u mrežu nisu tema. Vremena koraka ' +
        'između 02:10 i 02:40 su ilustrativna.</p>'
    },

    en: {
      stage: 'The file server and every copy of its data, with the attacker and the 3-2-1 checklist',

      zoneServer: 'On the server',
      zoneLan: 'On the network, on site',
      zoneOffsite: 'Off site',
      zoneEmpty: 'nothing off site',

      nameSrc: 'Source data',
      nameVss: 'Shadow copies (VSS)',
      nameMirror: 'NAS mirror',
      nameUsb: 'USB disk',
      nameRepo: 'Backup repository (NAS)',
      nameCloud: 'Cloud copy',
      nameTape: 'Weekly tape',

      mediumDisk: 'disk',
      mediumCloud: 'object storage',
      mediumTape: 'tape',
      siteOn: 'on site',
      siteOff: 'off site',
      kindLive: 'live data',
      kindSnapshot: 'snapshots on the same volume',
      kindMirror: 'a mirror, every night at 22:00',
      kindUsb: 'a weekly backup, always attached',
      kindRepo: 'a versioned backup, every night at 22:00',
      kindCloud: "a copy of the repository's versions",
      kindTape: 'a weekly backup, taken off site',

      reachLabel: 'reached by:',
      reachLocal: "the server's local admin",
      reachDaSaved: 'Domain Admin, its password saved on the server',
      reachOther: 'an account that is not on the server',
      reachNone: 'nothing online',
      tagSame: 'same credential',
      tagOther: 'other credential',
      tagOffline: 'offline',
      lockLine: 'locked for {days} days (WORM)',
      vssOff: 'turned off: no snapshots',
      versionsLabel: 'versions:',
      versionsNone: 'none',
      liveChip: 'live',
      newestLabel: 'newest clean:',
      newestNone: 'none',
      stClean: 'clean',
      stEncrypted: 'encrypted',
      stDeleted: 'deleted',
      stOff: 'off',
      badgeAttacker: 'attacker',

      sideClock: 'Time',
      clockBefore: 'Mon 9 Nov, before 02:10',
      sideAttacker: 'The attacker holds',
      credUser: 'user',
      credLocal: 'local admin',
      credDa: 'Domain Admin',
      credNone: 'nothing yet',
      credBlocked: 'logon refused (MFA)',
      chkTitle: 'The 3-2-1 rule',
      chkRule: 'rule',
      chkPaper: 'on paper',
      chkReal: 'one credential',
      chkCopies: '3 copies',
      chkMedia: '2 media',
      chkOffsite: '1 off site',
      chkOffline: '+1 offline or immutable',
      chkYes: 'yes',
      chkNo: 'no',
      outSurvivors: ['{n} copy survives', '{n} copies survive'],
      outRestore: 'restore from: {copy}',
      outNewest: 'newest clean version: {time}',
      outLost: 'lost: {dur}',
      outTotal: 'lost: everything that was only here',
      outIntact: 'source intact: nothing lost',

      durD: ['{n} day', '{n} days'],
      durH: '{n} h',
      durM: '{n} min',
      wd0: 'Mon', wd1: 'Tue', wd2: 'Wed', wd3: 'Thu', wd4: 'Fri', wd5: 'Sat', wd6: 'Sun',
      timeShort: '{wd} {hm}',
      timeDate: '{d} {mon} {hm}',
      timeFull: '{wd} {d} {mon} {hm}',
      dateOnly: '{d} {mon}',
      mon10: 'Oct', mon11: 'Nov', mon12: 'Dec',

      design: 'Backup design',
      designEstate: 'mirror + USB',
      design321: '3-2-1 online',
      designImm: 'immutable',
      designTape: 'tape',
      designHint: 'The mirror and the USB disk stay in every design; the others add a repository and a third copy.',
      mfaOnVpn: 'MFA on the VPN',
      mfaHint: 'A VPN logon needs a second factor, not just the password.',
      credOnServer: 'Backup password on the server',
      credHint: "The backup account's password (a Domain Admin) is saved on the server for Z: and the jobs.",

      presetEstate: 'Mirror and USB',
      presetEstateHint: 'The server as it is: mirror Z:, USB disk E:, shadow copies off.',
      preset321: '3-2-1 online',
      preset321Hint: 'A versioned repository and a cloud copy, both writable as Domain Admin.',
      presetImm: 'Immutable copy',
      presetImmHint: 'The same, but the cloud copy is locked for 30 days.',
      presetTape: 'Offline tape',
      presetTapeHint: 'The repository and a weekly tape, taken off site on Friday.',
      presetMfa: 'MFA',
      presetMfaHint: 'A VPN logon needs a second factor.',

      legendClean: 'clean copy',
      legendEnc: 'encrypted',
      legendDel: 'deleted',
      legendImm: 'immutable',
      legendOff: 'offline',
      legendAtt: 'attacker',
      legendChanged: 'changed',

      capStart: 'Monday, early morning: the file server and every copy of its data, each with its newest clean version. Press → to start the attack.',
      capStep: 'Step {n}, {time}:',
      capLogon: 'someone logs on over the VPN with a valid account. The password is enough; there is no second factor.',
      capBlocked: 'the VPN logon asks for a second factor the attacker does not have: refused. Nothing else happens.',
      capLocalAdmin: 'a group policy makes every interactive user a local admin: the attacker is now an admin of the server.',
      capFound: "the backup account's password is saved on the server, and that account is a Domain Admin. The attacker now holds it.",
      capNotFound: 'no password is saved on the server: the attacker stays a local admin.',
      capSource: 'the attacker encrypts the source data {path}.',
      capMirror: 'Z: is mapped with the same Domain Admin credential — the attacker encrypts it directly.',
      capMirrorOut: 'Z: needs an account that is not on the server: the attacker cannot write to the mirror now.',
      capUsb: 'E: is attached, so it is online, whatever its label: the attacker encrypts the USB disk and the backups on it.',
      capVss: "the server's local admin deletes the shadow copies on D:.",
      capVssOff: 'shadow copies on D: are off: there is nothing to delete.',
      capBackups: 'the attacker looks for other copies.',
      capRepoDeleted: 'As Domain Admin it deletes the backup repository.',
      capCloudDeleted: 'It deletes the cloud copy too.',
      capCloudLocked: 'The cloud copy refuses the delete: its versions are locked, the earliest until {date}.',
      capTapeOff: 'The tape is offline: out of reach.',
      capBackupsOut: 'Only an account that is not on the server writes the repository and the cloud copy: out of reach.',
      capBackupsOutRepo: 'Only an account that is not on the server writes the repository: out of reach.',
      capBackupsNone: 'There are no other copies in this design.',
      capJobs: 'nobody has noticed yet, so the scheduled jobs run.',
      capJobMirror: 'The mirror copies the encrypted files over its copy.',
      capJobMirrorAgain: 'The mirror copies the encrypted files again.',
      capJobAdded: 'The repository adds an encrypted version and keeps the old ones.',
      capJobCloud: 'The cloud copy gets the encrypted version too; the older ones stay.',
      capJobFailed: 'The repository is gone: the copy job fails.',
      capDiscovery: 'users find their files encrypted.',
      capCount: 'we count what survived.',
      capCountNone: 'No copy holds a clean version: everything that was only here is lost.',
      capCountSome: 'Restore from: {copy}, newest clean version {time}. The last {dur} of changes before the attack are lost.',
      capCountIntact: 'Nothing was encrypted: the source is intact and nothing is lost.',
      noteOnPaper: '3-2-1 is met on paper, but one credential reaches every copy: 0 survive.',
      noteTie: '{a} and {b} hold the same newest clean version: restore from the one on site, it is faster.',

      explain:
        '<p><b>What survives.</b> An attacker who owns the server encrypts and deletes everything it can reach. Only a copy it ' +
        'cannot reach survives: because it needs another credential, because it is offline, or because it cannot be changed ' +
        'before its lock ends.</p>' +
        '<p><b>Same credential, one copy.</b> A copy the attacker reaches with the same credential as the source is not a ' +
        '[[backup]], just another copy with the same fate. Here that is the backup account\'s password saved on the server: ' +
        'the Domain Admin opens the mirror, the repository and the cloud at once.</p>' +
        '<p><b>A mirror is not a backup.</b> [[mirroring]] carries deletion and encryption over on its next run, as RAID 1 ' +
        'writes the same mistake to both disks. A versioned backup adds a new version and keeps the old ones.</p>' +
        '<p><b>An attached disk is online.</b> A USB disk that stays plugged into the server is just another disk to the ' +
        'attacker.</p>' +
        '<p><b>Shadow copies.</b> Snapshots on the same volume (Windows VSS, "Previous Versions") can be deleted by an ' +
        'administrator of that machine, so they do not survive a takeover of the server.</p>' +
        '<p><b>Immutable and offline.</b> Nobody can delete or overwrite an immutable copy (object lock, WORM) before its lock ' +
        'ends, not even an admin of the backup system. An offline copy is out of reach until it is connected again.</p>' +
        '<p><b>3-2-1.</b> At least 3 copies, on 2 different media, 1 off site. The checklist is ticked by counting cards, but ' +
        'copies one credential reaches count as one. Many add a fourth condition: one copy offline or immutable.</p>' +
        '<p><b>What is lost.</b> The [[recovery point]] is the newest clean version that survived; everything written from ' +
        'then until the attack at 02:10 is lost. When two copies hold the same version, restore from the one on site.</p>' +
        '<p><b>Misconceptions.</b> "3-2-1 alone stops ransomware": not if one credential reaches every copy. "A mirror or RAID ' +
        'is a backup": no, they carry the damage over. "A USB disk is offline because it is a separate disk": not while it is ' +
        'attached.</p>' +
        '<p><b>Simplifications.</b> Restore speed, identity recovery and the way into the network are not the topic. The step ' +
        'times between 02:10 and 02:40 are illustrative.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
