/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-gpo-targeting, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. *term* in a caption is an English term, drawn in italics (the Croatian term rule: English in
   italics, Croatian in parentheses at the first mention). Drive letters, share paths, groups, addresses, user and
   computer names are data, not words. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'GPO Drive Maps s četiri stavke i njihovim uvjetima ciljanja, korisnik i prijenosno računalo, mrežni pogoni',

      gpoKind: 'GPO',
      gpoLinked: 'povezan na korijen domene',
      gpoApplies: 'Authenticated Users: vrijedi za {user}',
      gpoPrefs: 'Preference › Mapiranja pogona',
      evTime: 't = {t} min',
      evNextDay: 'sutradan',
      evLogon: 'prijava',
      evLogonItem: 'prijava · stavka {i} od {n}',
      evMove: 'prijenosno računalo → {site}, osvježavanje',
      evGroup: '{user} → {group}, osvježavanje',
      evRelogon: 'odjava i prijava',

      clientOn: '{user} na {pc}',
      rowGroups: 'grupe (u imeniku)',
      rowToken: 'token (od prijave)',
      tokenNone: 'još nije prijavljen',
      rowIp: 'IP adresa',
      siteHq: 'sjedište',
      siteBranch: 'podružnica',
      toHq: 'u sjedište',
      toBranch: 'u podružnicu',
      rowOs: 'OS',
      osNotServer: 'nije poslužitelj',
      osWorkstation: 'radna stanica',
      tokenUntil: 'vrijedi do sljedeće prijave',
      exTitle: 'Ovo računalo: mrežni pogoni',
      exEmpty: 'nema mrežnih pogona',
      tileNew: 'novo',
      tileStale: 'zaostao: tetovaža',
      tileRemoved: 'uklonjen',

      tableTitle: 'Stavke GPO-a: svaka sa svojim ciljanjem',
      colNo: 'stavka',
      colPath: '→ mapira',
      colGroup: 'grupa',
      colIp: 'raspon IP adresa',
      colOs: 'OS',
      colAct: 'radnja',
      cellNotServer: 'I nije poslužitelj',
      cellNone: 'svima',
      markStart: 'Rezultat',
      markFor: '{user} · {event}',
      outMap: 'mapiran',
      outSame: 'ostaje mapiran',
      outSameReplace: 'mapiran ponovno',
      outSkip: 'preskočen',
      outStale: 'ostaje: tetovaža',
      outRemove: 'uklonjen',
      outNoGpo: 'GPO ne vrijedi',

      capStart: 'GPO {gpo} mapira četiri pogona, a svaka stavka ima svoje *item-level targeting* (ciljanje na razini stavke). ' +
        '→ pokreće prijavu korisnika {user} na {pc}.',
      capStartOff: 'GPO {gpo} kakav je u Quillmooru: četiri mapiranja pogona bez ciljanja. → pokreće prijavu korisnika {user} na {pc}.',
      capToken: 't = {t}, prijava: {user} dobiva token s grupom {group}; GPO vrijedi, pa se stavke čitaju redom.',
      capGroupYes: '*Item-level targeting* (ciljanje na razini stavke): {letter} se mapira samo članovima grupe {group}. {user} je u njoj → {letter} je mapiran.',
      capGroupNo: '*Item-level targeting* (ciljanje na razini stavke): {letter} se mapira samo članovima grupe {group}. {user} nije u njoj → {letter} se preskače.',
      capNone: '{letter} nema uvjeta ciljanja: mapira se svima, ovdje {path}.',
      capIpYes: '{letter} traži raspon podružnice: {ip} je u njemu i {pc} nije poslužitelj; oba uvjeta vrijede (I) → {letter} je mapiran.',
      capIpNo: '{letter} traži raspon podružnice 10.20.0.0 – 10.20.255.255: {ip} nije u njemu, pa izraz s I ne vrijedi → {letter} se preskače.',
      capWalkEnd: '{user} ima {drives}.',
      capOff: 't = {t}, prijava: bez ciljanja svatko dobiva sva četiri pogona, i oni koji ih ne trebaju: {drives}.',
      capMove: 't = {t}: prijenosno računalo {pc} premješteno je {site} i dobiva {ip}. Ciljanje po rasponu IP adresa čita trenutačnu adresu pri svakom ' +
        'osvježavanju:',
      capMoveX: 'Sada je {letter} mapiran.',
      capMoveStale: '{letter} više ne odgovara, ali ostaje mapiran (tetovaža).',
      capMoveRemoved: '{letter} više ne odgovara i uklonjen je („Ukloni kad se više ne primjenjuje”).',
      capNoTargeting: 'Nijedna stavka nema ciljanje, pa se ništa ne mijenja.',
      markRefresh: 'osvježavanje',
      markRelogon: 'nova prijava',
      capGroup: 't = 30: administrator premješta {user} iz grupe {old} u {new}.',
      capGroupToken: 'Pri osvježavanju (t = {t}) ništa se ne mijenja: ciljanje čita token, a token i dalje kaže {old}.',
      capRelogon: 'Nova prijava: token sada kaže {new} → {letter} je mapiran.',
      capRelogonOff: 'Nova prijava: token sada kaže {new}.',
      capStale: '{user} više nije u grupi {old}, ali {letter} ostaje jer stavka nema „Ukloni kad se više ne primjenjuje”.',
      capRemoved: 'Stavka {letter} ima „Ukloni kad se više ne primjenjuje”, pa je {letter} uklonjen.',
      capReplace: 'Radnja je *Replace* (zamijeni): pogoni koji vrijede brišu se i mapiraju ponovno.',

      presetAsIs: 'Quillmoor kakav jest',
      presetAsIsHint: 'bez ciljanja: svima P:, K:, H:, X:',
      presetTargeted: 'S ciljanjem',
      presetTargetedHint: 'ana: P:, H:; eyardley: K:, H:',
      presetBranch: 'Prijenosno računalo u podružnici',
      presetBranchHint: 'X: pri sljedećem osvježavanju',
      presetGroup: 'Promjena grupe',
      presetGroupHint: 'K: tek nakon prijave, P: ostaje',
      presetRemove: 'Uz „Ukloni…”',
      presetRemoveHint: 'P: se uklanja nakon prijave',

      user: 'Korisnik',
      location: 'Prijenosno računalo pri prijavi',
      locHq: 'sjedište',
      locBranch: 'podružnica',
      script: 'Nakon prijave',
      scrNone: 'ništa',
      scrMove: 'prijenosno računalo na drugo mjesto',
      scrGroup: 'korisnik u drugu grupu',
      targeting: 'Ciljanje na razini stavke',
      removeFlag: 'Ukloni kad se više ne primjenjuje',

      legItem: 'preferenca (mapiranje pogona)',
      legFunnel: 'uvjet ciljanja',
      legMatch: 'odgovara',
      legNoMatch: 'ne odgovara',
      legDrive: 'mapiran pogon',
      legStale: 'zaostao pogon',
      legChanged: 'promijenjeno',

      explain: '<p><em lang="en">Item-level targeting</em> (ciljanje na razini stavke) filtrira pojedine stavke ' +
        '<em lang="en">preference</em> (preferenca) unutar jednog GPO-a. Umjesto četiri GPO-a za četiri mapiranja pogona, jedan GPO nosi sve, ' +
        'a svaka stavka ima svoj izraz: članstvo u sigurnosnoj grupi, raspon IP adresa, operacijski sustav i drugo, spojeno s I/ILI i „nije”. ' +
        'Izraz se čita slijeva nadesno; za grupiranje služe kolekcije.</p>' +
        '<p>Ciljanje ne zamjenjuje sigurnosno filtriranje: GPO mora najprije vrijediti (veza, sigurnosno filtriranje, WMI filtar), a tek onda ' +
        'klijent pri svakoj obradi za svaku stavku računa njezin izraz.</p>' +
        '<p>Grupe se čitaju iz tokena napravljenog pri prijavi: premještanje korisnika u drugu grupu vrijedi tek od sljedeće prijave. ' +
        'Raspon IP adresa čita trenutačnu adresu: prijenosno računalo premješteno u podružnicu dobiva X: već pri sljedećem osvježavanju.</p>' +
        '<p>Stavka koja više ne odgovara jednostavno se ne primjenjuje; pogon koji je ranije mapirala ostaje (<em lang="en">tattooing</em>, ' +
        'tetoviranje) osim ako je uključeno „Ukloni ovu stavku kad se više ne primjenjuje”. Ako dvije stavke mapiraju isto slovo, ' +
        'pobjeđuje kasnija, jer se obrađuje posljednja.</p>'
    },

    en: {
      stage: 'The GPO Drive Maps with four items and their targeting, the user and the laptop, the network drives',

      gpoKind: 'GPO',
      gpoLinked: 'linked at the domain root',
      gpoApplies: 'Authenticated Users: applies to {user}',
      gpoPrefs: 'Preferences › Drive Maps',
      evTime: 't = {t} min',
      evNextDay: 'next day',
      evLogon: 'logon',
      evLogonItem: 'logon · item {i} of {n}',
      evMove: 'laptop → {site}, refresh',
      evGroup: '{user} → {group}, refresh',
      evRelogon: 'log off and on',

      clientOn: '{user} on {pc}',
      rowGroups: 'groups (directory)',
      rowToken: 'token (from logon)',
      tokenNone: 'not logged on yet',
      rowIp: 'IP address',
      siteHq: 'HQ',
      siteBranch: 'Branch',
      toHq: 'to HQ',
      toBranch: 'to Branch',
      rowOs: 'OS',
      osNotServer: 'not a server',
      osWorkstation: 'workstation',
      tokenUntil: 'valid until the next logon',
      exTitle: 'This PC: network drives',
      exEmpty: 'no network drives',
      tileNew: 'new',
      tileStale: 'stale: a tattoo',
      tileRemoved: 'removed',

      tableTitle: 'The GPO\'s items, each with its targeting',
      colNo: 'item',
      colPath: '→ maps',
      colGroup: 'group',
      colIp: 'IP range',
      colOs: 'OS',
      colAct: 'action',
      cellNotServer: 'AND is not a server',
      cellNone: 'everyone',
      markStart: 'Result',
      markFor: '{user} · {event}',
      outMap: 'mapped',
      outSame: 'stays mapped',
      outSameReplace: 'mapped again',
      outSkip: 'skipped',
      outStale: 'stays: a tattoo',
      outRemove: 'removed',
      outNoGpo: 'the GPO does not apply',

      capStart: 'The GPO {gpo} maps four drives, and each item has its own *item-level targeting*. → starts {user}\'s logon on {pc}.',
      capStartOff: 'The GPO {gpo} as it is at Quillmoor: four drive maps, no targeting. → starts {user}\'s logon on {pc}.',
      capToken: 't = {t}, logon: {user} gets a token with the group {group}; the GPO applies, so its items are read in order.',
      capGroupYes: 'Item-level targeting: {letter} is mapped only for members of {group}. {user} is one → {letter} is mapped.',
      capGroupNo: 'Item-level targeting: {letter} is mapped only for members of {group}. {user} is not → {letter} is skipped.',
      capNone: '{letter} has no targeting: it is mapped for everyone, here {path}.',
      capIpYes: '{letter} needs the Branch range: {ip} is in it and {pc} is not a server; both terms hold (AND) → {letter} is mapped.',
      capIpNo: '{letter} needs the Branch range 10.20.0.0 – 10.20.255.255: {ip} is not in it, so the AND expression fails → {letter} is skipped.',
      capWalkEnd: '{user} has {drives}.',
      capOff: 't = {t}, logon: without targeting everyone gets all four drives, needed or not: {drives}.',
      capMove: 't = {t}: the laptop {pc} has moved {site} and has {ip}. IP range targeting reads the current address at every refresh:',
      capMoveX: '{letter} is mapped now.',
      capMoveStale: '{letter} no longer matches but stays mapped (a tattoo).',
      capMoveRemoved: '{letter} no longer matches and is removed ("Remove when no longer applied").',
      capNoTargeting: 'No item has targeting, so nothing changes.',
      markRefresh: 'refresh',
      markRelogon: 'new logon',
      capGroup: 't = 30: the admin moves {user} from {old} to {new}.',
      capGroupToken: 'At the refresh (t = {t}) nothing changes: targeting reads the token, and the token still says {old}.',
      capRelogon: 'A new logon: the token now says {new} → {letter} is mapped.',
      capRelogonOff: 'A new logon: the token now says {new}.',
      capStale: '{user} is no longer in {old}, but {letter} stays because the item lacks "Remove when no longer applied".',
      capRemoved: 'The {letter} item has "Remove when no longer applied", so {letter} is removed.',
      capReplace: 'The action is *Replace*: the drives that apply are deleted and mapped again.',

      presetAsIs: 'Quillmoor as it is',
      presetAsIsHint: 'no targeting: P:, K:, H:, X: for all',
      presetTargeted: 'Targeted',
      presetTargetedHint: 'ana: P:, H:; eyardley: K:, H:',
      presetBranch: 'Laptop at Branch',
      presetBranchHint: 'X: at the next refresh',
      presetGroup: 'Group change',
      presetGroupHint: 'K: only after a logon, P: stays',
      presetRemove: 'With "Remove…"',
      presetRemoveHint: 'P: removed after the logon',

      user: 'User',
      location: 'Laptop at the logon',
      locHq: 'HQ',
      locBranch: 'Branch',
      script: 'After the logon',
      scrNone: 'nothing',
      scrMove: 'laptop to the other site',
      scrGroup: 'user to the other group',
      targeting: 'Item-level targeting',
      removeFlag: 'Remove when no longer applied',

      legItem: 'preference (drive map)',
      legFunnel: 'targeting',
      legMatch: 'match',
      legNoMatch: 'no match',
      legDrive: 'mapped drive',
      legStale: 'stale drive',
      legChanged: 'changed',

      explain: '<p><em>Item-level targeting</em> filters single <em>preference</em> items inside one GPO. Instead of four GPOs for four ' +
        'drive maps, one GPO holds them all, and each item has its own expression: security group membership, an IP address range, the ' +
        'operating system and more, joined with AND/OR and "is not". The expression is read left to right; collections group terms.</p>' +
        '<p>Targeting does not replace security filtering: the GPO must apply first (link, security filtering, WMI filter), and only then ' +
        'does the client evaluate each item\'s expression, at every processing pass.</p>' +
        '<p>Groups come from the token made at the logon: moving a user to another group counts from the next logon. An IP range reads ' +
        'the current address: a laptop moved to Branch gets X: at the next refresh.</p>' +
        '<p>An item that no longer matches is simply not applied; a drive it mapped earlier stays (<em>tattooing</em>) unless "Remove this ' +
        'item when it is no longer applied" is set. When two items map the same letter, the later one wins: it is processed last.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
