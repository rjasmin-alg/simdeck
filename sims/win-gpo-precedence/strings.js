/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-gpo-precedence, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. *term* in a caption is an English term, drawn in italics (the Croatian term rule: English in
   italics, Croatian in parentheses at the first mention). GPO, container and computer names are data, not words.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Put računala do GPO-ova i redoslijed obrade',
      pathTitle: 'Put do računala {target}',
      localName: 'Lokalna pravila računala',
      localGpo: 'lokalni GPO',
      siteName: 'Lokacija {name}',
      domainName: 'Domena {name}',
      noLinks: 'nema povezanih GPO-ova',
      cnComputers: 'spremnik, ne OU: na njega se GPO ne može povezati',
      computer: 'računalo',
      blockTag: 'blokira nasljeđivanje',
      enforcedTag: 'prisilno',
      linkOffTag: 'veza isključena',
      min: '{n} min',
      valOn: 'uključeno',
      nc: 'nije konfigurirano',
      setLock: 'Zaključavanje nakon neaktivnosti',
      setUsb: 'Prijenosna pohrana: zabrana pristupa',
      tableTitle: 'Redoslijed obrade · {setting}',
      colGpo: 'GPO',
      colWhere: 'Povezan na',
      colLink: 'Redoslijed',
      colValue: 'Vrijednost',
      colMark: 'Ishod',
      markStands: 'vrijedi',
      markOver: 'prepisano',
      markWin: 'pobjeđuje',
      markSkip: 'preskočen',
      whyBlocked: 'blokada na {ou}',
      whyLinkOff: 'veza isključena',
      whyHalfOff: 'postavke računala isključene',
      whyNc: 'nije konfiguriran',
      whyBlockedShort: 'blokiran',
      implicit: 'nije konfigurirano: vrijedi zadano ponašanje sustava',
      resultNow: 'Sada vrijedi',
      resultWinner: 'Pobjednik',
      resultFrom: 'izvor: {gpo}',
      resultNone: 'nije konfigurirano',
      setting: 'Postavka',
      cn: 'PC19 u CN=Computers',
      blockWs: 'Workstations: blokada',
      enforceDomain: 'Domain Lockdown: prisilno',
      enforceOu: 'WS Kiosk: prisilno',
      swapOrder: 'Zamijeni redoslijed u WS',
      presetLsdou: 'Lokalno, lokacija, domena, OU',
      presetLsdouHint: 'Bliži spremnik pobjeđuje, a u spremniku redoslijed 1.',
      presetLinkOrder: 'Redoslijed povezivanja',
      presetLinkOrderHint: 'WS Standard dobiva redoslijed 1.',
      presetBlock: 'Blokiranje nasljeđivanja',
      presetBlockHint: 'Zatim prebaci postavku na prijenosnu pohranu.',
      presetEnfBlock: 'Prisilno protiv blokade',
      presetEnfBlockHint: 'Domain Lockdown prisilan, blokada uključena.',
      presetTwoEnf: 'Dva prisilna GPO-a',
      presetTwoEnfHint: 'Domain Lockdown i WS Kiosk prisilni.',
      presetCn: 'Računalo u CN=Computers',
      presetCnHint: 'Spremnik nije OU.',
      legBox: 'spremnik',
      legOrder: 'redoslijed',
      legLock: 'prisilno',
      legWall: 'blokada',
      legOver: 'prepisano',
      legSkip: 'preskočen',
      legWin: 'pobjednik',
      legChanged: 'ovaj korak',
      list2: '{a} i {b}',
      listMore: '{a}, {b}',
      capStart: 'Računalo {target} je u {where}. Obrada ide od lokalnog GPO-a preko lokacije i domene do OU-ova, roditelj prije djeteta (LSDOU); u svakom koraku jedan GPO.',
      capStartCn: 'Računalo {target} je u CN=Computers. To je spremnik, a ne OU, pa do njega stižu samo lokalni GPO te GPO-ovi lokacije i domene.',
      capStartEnf: 'Prisilne (*Enforced*) veze izlaze iz redoslijeda i obrađuju se na kraju.',
      capStartBlock: '{ou} ima uključeno *Block Inheritance* (blokiranje nasljeđivanja); GPO-ovi koje blokada odbaci dijele jedan korak.',
      capApplyFirst: 'Korak {n}: {gpo} postavlja {v}.',
      capApply: 'Korak {n}: {gpo} postavlja {v} i prepisuje prethodnu vrijednost {old} ({prev}).',
      capOrderHigh: 'U spremniku se ranije obrađuje veza s većim brojem u *link order* (redoslijed povezivanja); ova ima {k}.',
      capOrderOne: 'Ima *link order* (redoslijed povezivanja) 1, pa se u svom spremniku obrađuje zadnji.',
      capOrderOneNe: 'Ima *link order* (redoslijed povezivanja) 1, pa se obrađuje zadnji od neprisilnih veza u svom spremniku.',
      capEnf: '{gpo} je prisilan (*Enforced*): izvađen je iz redoslijeda i obrađuje se nakon svih neprisilnih.',
      capEnfHigh: 'Od prisilnih se zadnji obrađuje onaj s najvišeg spremnika.',
      capEnfBlock: 'Prolazi kroz blokadu nasljeđivanja.',
      capNc: 'Korak {n}: {gpo} se obrađuje, ali ne konfigurira ovu postavku. „Nije konfigurirano” nije vrijednost, pa ostaje {v}.',
      capNcNone: 'Korak {n}: {gpo} se obrađuje, ali ne konfigurira ovu postavku, pa ona i dalje nije konfigurirana.',
      capBlocked: 'Korak {n}: *Block Inheritance* (blokiranje nasljeđivanja) na {ou} odbacuje {list}: povezani su iznad njega.',
      capBlockedOne: 'Korak {n}: *Block Inheritance* (blokiranje nasljeđivanja) na {ou} odbacuje {list}: povezan je iznad njega.',
      capBlockedEnf: 'Prisilne veze prolaze i čekaju kraj.',
      capBlockedLocal: 'Lokalni GPO se ne nasljeđuje iz AD-a, pa ostaje.',
      capLinkOff: 'Korak {n}: veza na {gpo} je isključena, pa se GPO preskače.',
      capHalfOff: 'Korak {n}: {gpo} ima isključene postavke računala, pa se preskače.',
      capWin: 'Pobjeđuje zadnji GPO koji je postavio vrijednost: {gpo}, {v}.',
      capWinOrder: '{gpo} ima *link order* (redoslijed povezivanja) 1, pa se obrađuje zadnji i pobjeđuje: {v}.',
      capWinEnfBlock: 'Prisilni (*Enforced*) GPO domene obrađuje se nakon svih ostalih i prolazi kroz blokadu nasljeđivanja: {v}.',
      capWinEnf: 'Prisilni (*Enforced*) GPO {gpo} obrađuje se nakon svih neprisilnih, a od prisilnih zadnji, pa pobjeđuje: {v}.',
      capWinNone: 'Nijedan obrađeni GPO ne postavlja ovu postavku: nije konfigurirana i vrijedi zadano ponašanje sustava.',
      capWinNoneBlocked: 'Postavlja je samo {gpo}, a njega je odbacila blokada.',
      explain: '<p>Za računalo se GPO-ovi obrađuju redom <b>L → S → D → OU</b>: lokalni GPO, lokacija (<em lang="en">site</em>), ' +
        'domena, pa OU-ovi od roditelja prema djetetu. Kad više GPO-ova postavlja istu postavku, <b>pobjeđuje zadnji obrađeni</b>: ' +
        'bliži spremnik pobjeđuje.</p>' +
        '<p>Unutar spremnika prvi se obrađuje GPO s najvećim brojem u <em lang="en">link order</em> (redoslijed povezivanja), a ' +
        'redoslijed 1 zadnji, pa on pobjeđuje. Česta zabluda: „redoslijed 1 obrađuje se prvi i gubi”.</p>' +
        '<p><em lang="en">Block Inheritance</em> (blokiranje nasljeđivanja) na OU-u odbacuje GPO-ove povezane iznad njega: lokaciju, ' +
        'domenu i roditeljske OU-ove. Ne zaustavlja sve: lokalni GPO ostaje, a prisilne veze prolaze.</p>' +
        '<p><em lang="en">Enforced</em> (prisilno) vadi vezu iz redoslijeda i obrađuje je nakon svih ostalih, a od prisilnih zadnji ' +
        'onaj s najvišeg spremnika. Zato prisilni GPO domene pobjeđuje i prisilni GPO OU-a. Bez prisile domena ne pobjeđuje ' +
        'samo zato što je „viša”.</p>' +
        '<p>„Nije konfigurirano” nije vrijednost: takav GPO ništa ne mijenja. Isključena veza preskače se. CN=Computers je ' +
        'spremnik, a ne OU, pa se na njega ne može povezati nijedan GPO.</p>' +
        '<p>Postavka ovdje je računalna (<em lang="en">Interactive logon: Machine inactivity limit</em>). <em lang="en">Screen ' +
        'saver timeout</em> je korisnička postavka: dolazi iz OU-a korisnika, ne računala.</p>'
    },
    en: {
      stage: 'The computer\'s path to its GPOs and the processing order',
      pathTitle: 'Path to computer {target}',
      localName: 'Local computer policy',
      localGpo: 'local GPO',
      siteName: 'Site {name}',
      domainName: 'Domain {name}',
      noLinks: 'no GPOs linked',
      cnComputers: 'a container, not an OU: no GPO can be linked to it',
      computer: 'computer',
      blockTag: 'blocks inheritance',
      enforcedTag: 'Enforced',
      linkOffTag: 'link disabled',
      min: '{n} min',
      valOn: 'on',
      nc: 'not configured',
      setLock: 'Lock after inactivity',
      setUsb: 'Removable storage: deny access',
      tableTitle: 'Processing order · {setting}',
      colGpo: 'GPO',
      colWhere: 'Linked to',
      colLink: 'Link order',
      colValue: 'Value',
      colMark: 'Result',
      markStands: 'stands',
      markOver: 'overwritten',
      markWin: 'wins',
      markSkip: 'skipped',
      whyBlocked: 'blocked at {ou}',
      whyLinkOff: 'link disabled',
      whyHalfOff: 'computer settings disabled',
      whyNc: 'not configured',
      whyBlockedShort: 'blocked',
      implicit: 'not configured: the system default applies',
      resultNow: 'Value now',
      resultWinner: 'Winner',
      resultFrom: 'source: {gpo}',
      resultNone: 'not configured',
      setting: 'Setting',
      cn: 'PC19 in CN=Computers',
      blockWs: 'Workstations: block',
      enforceDomain: 'Domain Lockdown: Enforced',
      enforceOu: 'WS Kiosk: Enforced',
      swapOrder: 'Swap the WS link order',
      presetLsdou: 'Local, site, domain, OU',
      presetLsdouHint: 'The closer container wins, and link order 1 within it.',
      presetLinkOrder: 'Link order',
      presetLinkOrderHint: 'WS Standard gets link order 1.',
      presetBlock: 'Block Inheritance',
      presetBlockHint: 'Switch the setting to removable storage.',
      presetEnfBlock: 'Enforced vs block',
      presetEnfBlockHint: 'Domain Lockdown enforced, block on.',
      presetTwoEnf: 'Two enforced GPOs',
      presetTwoEnfHint: 'Domain Lockdown and WS Kiosk enforced.',
      presetCn: 'Computer in CN=Computers',
      presetCnHint: 'A container is not an OU.',
      legBox: 'container',
      legOrder: 'link order',
      legLock: 'Enforced',
      legWall: 'block',
      legOver: 'overwritten',
      legSkip: 'skipped',
      legWin: 'winner',
      legChanged: 'this step',
      list2: '{a} and {b}',
      listMore: '{a}, {b}',
      capStart: 'Computer {target} is in {where}. Processing goes from the local GPO through site and domain to the OUs, parent before child (LSDOU); one GPO per step.',
      capStartCn: 'Computer {target} is in CN=Computers. That is a container, not an OU, so only the local GPO and the site and domain GPOs reach it.',
      capStartEnf: 'Enforced links leave the order and are processed at the end.',
      capStartBlock: '{ou} has Block Inheritance on; the GPOs it drops share one step.',
      capApplyFirst: 'Step {n}: {gpo} sets {v}.',
      capApply: 'Step {n}: {gpo} sets {v} and overwrites the previous value {old} ({prev}).',
      capOrderHigh: 'Within a container, the link with the higher link order number is processed earlier; this one has {k}.',
      capOrderOne: 'It has link order 1, so it is processed last in its container.',
      capOrderOneNe: 'It has link order 1, so it is processed last among the non-enforced links in its container.',
      capEnf: '{gpo} is enforced: taken out of the order and processed after every non-enforced GPO.',
      capEnfHigh: 'Among enforced links, the one from the highest container comes last.',
      capEnfBlock: 'It passes through the inheritance block.',
      capNc: 'Step {n}: {gpo} is processed but does not configure this setting. "Not configured" is not a value, so {v} stays.',
      capNcNone: 'Step {n}: {gpo} is processed but does not configure this setting, so it is still not configured.',
      capBlocked: 'Step {n}: Block Inheritance on {ou} drops {list}: they are linked above it.',
      capBlockedOne: 'Step {n}: Block Inheritance on {ou} drops {list}: it is linked above it.',
      capBlockedEnf: 'Enforced links pass and wait for the end.',
      capBlockedLocal: 'The local GPO is not inherited from AD, so it stays.',
      capLinkOff: 'Step {n}: the link to {gpo} is disabled, so the GPO is skipped.',
      capHalfOff: 'Step {n}: {gpo} has its computer settings disabled, so it is skipped.',
      capWin: 'The last GPO that set a value wins: {gpo}, {v}.',
      capWinOrder: '{gpo} has link order 1, so it is processed last and wins: {v}.',
      capWinEnfBlock: 'The enforced domain GPO is processed after all others and passes through the inheritance block: {v}.',
      capWinEnf: 'The enforced GPO {gpo} is processed after every non-enforced GPO, and last of the enforced ones, so it wins: {v}.',
      capWinNone: 'No processed GPO sets this setting: it stays not configured and the system default applies.',
      capWinNoneBlocked: 'Only {gpo} sets it, and the block dropped it.',
      explain: '<p>For a computer, GPOs are processed in the order <b>L → S → D → OU</b>: the local GPO, the site, the domain, then ' +
        'the OUs from parent to child. When several GPOs set the same setting, <b>the last one processed wins</b>: the closer ' +
        'container wins.</p>' +
        '<p>Within a container the GPO with the highest link order number is processed first and link order 1 last, so link ' +
        'order 1 wins. A common mistake: "link order 1 is processed first and loses".</p>' +
        '<p>Block Inheritance on an OU drops the GPOs linked above it: the site, the domain and the parent OUs. It does not stop ' +
        'everything: the local GPO stays, and enforced links pass.</p>' +
        '<p>Enforced takes a link out of the order and processes it after all others, and among enforced links the one from ' +
        'the highest container last. So an enforced domain GPO beats an enforced OU GPO too. Without Enforced, the domain does ' +
        'not win just because it is "higher".</p>' +
        '<p>"Not configured" is not a value: such a GPO changes nothing. A disabled link is skipped. CN=Computers is a ' +
        'container, not an OU, so no GPO can be linked to it.</p>' +
        '<p>The setting here is a computer setting (Interactive logon: Machine inactivity limit). Screen saver timeout is a ' +
        'user setting: it comes from the user\'s OU, not the computer\'s.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
