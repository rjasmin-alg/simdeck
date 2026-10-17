/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-access-token, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). [[term]] is a kit/glossary.js term.
   Terms missing from the glossary are written out (NOTES.md, "Term pairs"). Permission names (Modify, Full Control)
   are the Windows terms, as in win-ntfs-share-effective.
   Host, user and group names, SIDs, paths and times are data: the page writes them with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pristupni token: AD, sesija prijave i provjera pristupa',

      // AD column
      adTitle: 'Active Directory',
      dcAnswers: 'odgovara Ani',
      dcOther: 'drugi DC',
      memNone: 'nitko',
      replDone: 'replicirano u {t}',
      replWait: 'čeka replikaciju',
      replArrow: 'replikacija',
      changesTitle: 'promjene članstva',
      changesNone: 'još nema',
      chOn: 'na {dc}',

      // session column
      sesTitle: 'sesija prijave',
      clockLabel: 'sat',
      tokenTitle: 'pristupni token',
      tokenBuilt: 'nastao pri prijavi u {t} ({dc})',
      loggedOff: 'Odjavljena: nema tokena ni karata.',
      rowUser: 'korisnica',
      viaNest: 'preko {g}',
      wellKnown: 'poznati SID-ovi',
      neqMissing: 'u AD-u, nije ovdje',
      neqExtra: 'više nije u AD-u',
      tgtTitle: 'TGT',
      tktTitle: 'karta za uslugu',
      issued: 'izdana {t}',
      validTo: 'vrijedi do {t}',
      nextDay: 'sutra u {t}',
      renewedTag: 'obnovljen',
      fromDc: 'od {dc}',
      noTicket: 'nema: stare karte su odbačene',

      // access column
      chkTitle: 'provjera pristupa',
      targetFs: 'mapa na FS1',
      targetLocal: 'mapa na PC-07',
      noAttempt: 'Ana još nije otvorila mapu Prodaja.',
      usedTicket: 'FS1 gradi token iz karte od {t}',
      usedSession: 'token otvorene SMB sesije od {t}',
      usedToken: 'Anin token od prijave u {t}',
      colWho: 'tko',
      colRights: 'dozvola',
      colMark: 'pokušaj u {t}',
      colMarkNone: 'pokušaj',
      rModify: 'Modify',
      rFull: 'Full Control',
      implicitDeny: 'nijedna stavka ne odgovara',
      denied: 'odbijeno',
      outOk: 'pristup',
      outDenied: 'odbijeno',
      markWin: 'odlučuje',
      markSkip: 'ne čita se',
      smbTitle: 'SMB sesija na FS1',
      smbOpen: 'otvorena od {t}',
      smbNone: 'nijedna otvorena',

      // params
      pChange: 'Grupa Prodaja u AD-u',
      optAdd: 'dodaj Anu',
      optRemove: 'ukloni Anu',
      pChangeOn: 'Promjena na',
      pAction: 'Što Ana napravi',
      optRelog: 'odjava i prijava',
      optRenew: 'samo nove karte',
      optNone: 'ništa',
      pSmb: 'SMB sesija na FS1 ostaje otvorena',

      // presets
      presetAdd: 'Dodana, odjava i prijava',
      presetAddHint: '10:00 dodana u grupu Prodaja; 10:05 odbijeno; 10:10 odjava i prijava; 10:11 pristup',
      presetNested: 'Ugniježđena grupa',
      presetNestedHint: 'ACL navodi samo DL grupu; token nakon prijave ima obje',
      presetRemove: 'Uklonjena, a i dalje radi',
      presetRemoveHint: '13:00 uklonjena iz grupe Prodaja; pristup radi i nakon 18:00: obnova TGT-a kopira grupe',
      presetRenew: 'Samo nove karte',
      presetRenewHint: 'FS1 vidi novu grupu, lokalni token na PC-07 ne',
      presetLag: 'Kašnjenje replikacije',
      presetLagHint: 'Promjena na DC2, prijava na DC1 prije replikacije',

      // legend
      legToken: 'token: SID-ovi i vrijeme',
      legTicket: 'Kerberos karta',
      legNeq: 'drukčije nego u AD-u',
      legWin: 'stavka koja odlučuje',
      legVerdict: '✓/✕ pristup',
      legRepl: 'replikacija',
      legChanged: 'promijenjeno u ovom koraku',

      // captions
      capStart_add: 'U 08:00 Ana se prijavila na PC-07: tada su nastali njezin *access token* (pristupni token) i *TGT* (karta za dobivanje karata), bez grupe Prodaja. U 08:05 otvorila je mapu {pub} i dobila *service ticket* (kartu za uslugu) za FS1.',
      capStart_remove: 'U 08:00 Ana se prijavila na PC-07: njezin *access token* (pristupni token) ima grupu Prodaja i, preko ugniježđenja, DL_FS1_Prodaja_Modify; njezin *TGT* (karta za dobivanje karata) nosi Prodaja. U 08:05 otvorila je mapu {pub} i dobila *service ticket* (kartu za uslugu) za FS1.',
      capStartSmb: ' SMB sesija s FS1 iz 08:05 i dalje je otvorena.',
      capChangeAdd: 'Ana je dodana u grupu Prodaja u 10:00, ali njezin *access token* (pristupni token) nastao je pri prijavi u 08:00 — u njemu te grupe nema.',
      capChangeAddDc2: '{n}. {t}: administrator na {dc} dodaje Anu u grupu Prodaja. DC1, koji odgovara Ani, to još ne zna.',
      capChangeRemove: '{n}. {t}: administrator na {dc} uklanja Anu iz grupe Prodaja. Njezin token i karte i dalje nose tu grupu.',
      capChangeRemoveDc2: '{n}. {t}: administrator na {dc} uklanja Anu iz grupe Prodaja. DC1, koji odgovara Ani, to još ne zna.',
      capRepl: '{n}. {t}: DC2 javlja DC1-u promjenu (replikacija unutar *site*-a, sjedišta, oko 15 s). Tek sada DC1 zna novo članstvo.',
      capProbeDenied: '{n}. {t}: Ana otvara {share}: odbijeno. FS1 gradi njezin token iz karte od {since}, a u njoj nema grupe Prodaja ni DL_FS1_Prodaja_Modify. FS1 ne pita AD.',
      capProbeDeniedSession: '{n}. {t}: Ana otvara {share}: odbijeno. SMB sesija od {since} i dalje drži token bez grupe Prodaja. FS1 ne pita AD.',
      capProbeOk: 'Ana je uklonjena iz grupe, a pristup i dalje radi: token i Kerberos karta pamte stanje od jutros.',
      capLogoff: '{n}. {t}: Ana se odjavljuje. Token, TGT i karte te sesije nestaju.',
      capLogoffSmb: ' Zatvara se i njezina SMB sesija s FS1.',
      capLogon: '{n}. {t}: Ana se ponovno prijavljuje na PC-07, odgovara {dc}. Novi token ima grupe koje AD ima sada: {groups}. Ugniježđene grupe razvijaju se pri prijavi.',
      capLogonStale: '{n}. {t}: Ana se prijavljuje na PC-07, odgovara DC1, ali DC1 još nema promjenu s DC2: novi token ima stare grupe ({groups}).',
      capTgtRenew: '{n}. {t}: Anine karte se odbacuju i od DC1 traži se novi TGT: on nosi {groups}. Njezin *access token* na PC-07 ostaje onaj iz {logon}.',
      capTgtRenewStale: '{n}. {t}: novi TGT od DC1, ali DC1 još nema promjenu s DC2: TGT nosi stare grupe ({groups}).',
      capTgtRenewal: '{n}. {t}: 15 min prije isteka klijent obnavlja TGT iz 08:00, sada do {exp}. Obnova kopira grupe iz starog TGT-a ({groups}); iz AD-a se ne čitaju ponovno.',
      capTicket: '{n}. {t}: nova karta za uslugu za FS1: grupe iz TGT-a i *domain local* grupe (domenske lokalne) koje DC1 dodaje: {groups}.',
      capTicketAfterRenewal: '{n}. {t}: karta od 08:05 istekla je u 18:00 sa starim TGT-om. Nova kopira grupe obnovljenog TGT-a, a DC1 dodaje *domain local* grupe (domenske lokalne): {groups}.',
      capAttemptStillOk: '{n}. {t}: Ana otvara {share}: i dalje pristup, pet sati nakon uklanjanja. Dok se ne odjavi ili ne dobije nove karte, obnove nose jutarnje grupe (do 7 dana).',
      capAttemptStillDenied: '{n}. {t}: Ana otvara {share}: i dalje odbijeno. Dok se ne odjavi ili ne dobije nove karte, obnove nose jutarnje grupe (do 7 dana).',
      capReauth: ' Karta SMB sesije istekla je u 18:00, pa se sesija ponovno autentificira novom kartom.',
      capAttemptOk: '{n}. {t}: Ana otvara {share}: pristup. FS1 gradi token iz nove karte; u njemu je DL_FS1_Prodaja_Modify, a ACL toj grupi daje Modify.',
      capAttemptDenied: '{n}. {t}: Ana otvara {share}: odbijeno. Nova karta više nema grupe Prodaja ni DL_FS1_Prodaja_Modify.',
      capAttemptSession: '{n}. {t}: Ana otvara {share}: i dalje odbijeno. Nove karte ne pomažu dok je SMB sesija od {since} otvorena: ona drži svoj token.',
      capAttemptSessionOk: '{n}. {t}: Ana otvara {share}: i dalje pristup. SMB sesija od {since} drži svoj stari token.',
      capLocalDenied: '{n}. {t}: na PC-07 Ana otvara {path}: odbijeno. Njezin lokalni *access token* i dalje je onaj iz {logon}, bez grupe Prodaja.',
      capLocalOk: '{n}. {t}: na PC-07 Ana otvara {path}: i dalje pristup. Njezin lokalni *access token* iz {logon} još ima grupu Prodaja.',
      capNested: 'Prodaja je član grupe DL_FS1_Prodaja_Modify, a ACL na FS1 navodi samo DL grupu. Anin token iz 08:00 nema nijednu od njih. Sljedeće: odjava i prijava.',
      capEnd: ' Kraj.',

      explain:
        '<p><b>Token.</b> Pri prijavi sustav sastavi <em lang="en">access token</em> (pristupni token): SID korisnika, SID-ove svih ' +
        'njegovih grupa (i grupa u koje su te grupe ugniježđene) i nekoliko <em lang="en">well-known</em> SID-ova (poznatih SID-ova: <span translate="no">Everyone</span>, ' +
        '<span translate="no">Authenticated Users</span>, <span translate="no">INTERACTIVE</span>). Svaki proces sesije dobiva kopiju. ' +
        'Provjera pristupa uspoređuje SID-ove iz tokena sa stavkama [[access control list]] (ACL); AD se pri tome ne pita.</p>' +
        '<p><b>Token se ne mijenja.</b> Promjena članstva u AD-u ne dira token koji već postoji. Zato se nakon promjene grupe korisnik ' +
        'odjavi i ponovno prijavi. Isto vrijedi za uklanjanje: uklonjeni korisnik zadržava pristup dok mu se token i karte ne obnove.</p>' +
        '<p><b>Preko mreže.</b> Popis grupa putuje u Kerberos <em lang="en">ticket-granting ticket</em> (TGT, karta za dobivanje karata), ' +
        'u dijelu PAC, i kopira se u <em lang="en">service ticket</em> (kartu za uslugu); <em lang="en">domain local</em> grupe ' +
        '(domenske lokalne) DC dodaje pri izdavanju karte za uslugu. Poslužitelj iz te karte gradi svoj token za korisnika. ' +
        'TGT živi 10 h, karta za uslugu 600 min, ali ne dulje od TGT-a. Klijent TGT obnavlja prije isteka (do 7 dana), a obnova ' +
        'kopira stare grupe. Tek nove karte (nakon odbacivanja starih) donose nove grupe na poslužitelj; lokalni token ostaje star. ' +
        'Otvorena SMB sesija zadržava token s kojim je otvorena.</p>' +
        '<p><b>Replikacija.</b> Prijava koristi ono što zna DC koji odgovara. Promjena na drugom DC-u stiže replikacijom, unutar ' +
        'istog <em lang="en">site</em>-a (sjedišta) za oko 15 s; prijava prije toga dobiva stare grupe.</p>' +
        '<p><b>Model.</b> Svaki korak je jedan događaj. Kad dva događaja padnu u isto vrijeme, prijava i nova karta idu prije ' +
        'pokušaja pristupa, pa pokušaj koristi novi token. Bez otvorene SMB sesije svaki pristup otvara svoju sesiju i zatvara je.</p>'
    },

    en: {
      stage: 'The access token: AD, logon session and access check',

      adTitle: 'Active Directory',
      dcAnswers: 'answers Ana',
      dcOther: 'other DC',
      memNone: 'nobody',
      replDone: 'replicated at {t}',
      replWait: 'waiting for replication',
      replArrow: 'replication',
      changesTitle: 'membership changes',
      changesNone: 'none yet',
      chOn: 'on {dc}',

      sesTitle: 'logon session',
      clockLabel: 'clock',
      tokenTitle: 'access token',
      tokenBuilt: 'built at the {t} logon ({dc})',
      loggedOff: 'Logged off: no token, no tickets.',
      rowUser: 'user',
      viaNest: 'via {g}',
      wellKnown: 'well-known SIDs',
      neqMissing: 'in AD, not here',
      neqExtra: 'no longer in AD',
      tgtTitle: 'TGT',
      tktTitle: 'service ticket',
      issued: 'issued {t}',
      validTo: 'valid until {t}',
      nextDay: '{t} tomorrow',
      renewedTag: 'renewed',
      fromDc: 'from {dc}',
      noTicket: 'none: the old tickets were discarded',

      chkTitle: 'access check',
      targetFs: 'folder on FS1',
      targetLocal: 'folder on PC-07',
      noAttempt: 'Ana has not opened the Prodaja folder yet.',
      usedTicket: 'FS1 builds a token from the ticket of {t}',
      usedSession: 'token of the SMB session open since {t}',
      usedToken: 'Ana\'s logon token of {t}',
      colWho: 'who',
      colRights: 'permission',
      colMark: 'attempt at {t}',
      colMarkNone: 'attempt',
      rModify: 'Modify',
      rFull: 'Full Control',
      implicitDeny: 'no entry matches',
      denied: 'denied',
      outOk: 'access',
      outDenied: 'denied',
      markWin: 'decides',
      markSkip: 'not read',
      smbTitle: 'SMB session on FS1',
      smbOpen: 'open since {t}',
      smbNone: 'none open',

      pChange: 'Prodaja in AD',
      optAdd: 'add Ana',
      optRemove: 'remove Ana',
      pChangeOn: 'Change made on',
      pAction: 'What Ana does',
      optRelog: 'log off and on',
      optRenew: 'new tickets only',
      optNone: 'nothing',
      pSmb: 'SMB session to FS1 stays open',

      presetAdd: 'Added, log off and on',
      presetAddHint: '10:00 added to Prodaja; 10:05 denied; 10:10 log off and on; 10:11 access',
      presetNested: 'Nested group',
      presetNestedHint: 'The ACL names only the DL group; after logon the token has both',
      presetRemove: 'Removed, still works',
      presetRemoveHint: '13:00 removed from Prodaja; access still works after 18:00: the TGT renewal copies the groups',
      presetRenew: 'New tickets only',
      presetRenewHint: 'FS1 sees the new group, the local token on PC-07 does not',
      presetLag: 'Replication lag',
      presetLagHint: 'Change on DC2, logon at DC1 before replication',

      legToken: 'token: SIDs and time',
      legTicket: 'Kerberos ticket',
      legNeq: 'differs from AD',
      legWin: 'deciding entry',
      legVerdict: '✓/✕ access',
      legRepl: 'replication',
      legChanged: 'changed in this step',

      capStart_add: 'At 08:00 Ana logged on to PC-07: her access token and her Kerberos TGT were built then, without Prodaja. At 08:05 she opened {pub} and got a service ticket for FS1.',
      capStart_remove: 'At 08:00 Ana logged on to PC-07: her access token has Prodaja and, through nesting, DL_FS1_Prodaja_Modify; her Kerberos TGT carries Prodaja. At 08:05 she opened {pub} and got a service ticket for FS1.',
      capStartSmb: ' Her SMB session with FS1 from 08:05 is still open.',
      capChangeAdd: 'Ana was added to Prodaja at 10:00, but her access token was built at her 08:00 logon, and the group isn\'t in it.',
      capChangeAddDc2: '{n}. {t}: an administrator on {dc} adds Ana to Prodaja. DC1, which answers Ana, does not know yet.',
      capChangeRemove: '{n}. {t}: an administrator on {dc} removes Ana from Prodaja. Her token and tickets still carry the group.',
      capChangeRemoveDc2: '{n}. {t}: an administrator on {dc} removes Ana from Prodaja. DC1, which answers Ana, does not know yet.',
      capRepl: '{n}. {t}: DC2 notifies DC1 of the change (replication within a site, about 15 s). Only now does DC1 have the new membership.',
      capProbeDenied: '{n}. {t}: Ana opens {share}: denied. FS1 builds her token from the ticket of {since}, which has neither Prodaja nor DL_FS1_Prodaja_Modify. FS1 does not ask AD.',
      capProbeDeniedSession: '{n}. {t}: Ana opens {share}: denied. The SMB session from {since} still holds a token without Prodaja. FS1 does not ask AD.',
      capProbeOk: 'Ana was removed from the group and access still works: her token and Kerberos ticket remember this morning\'s state.',
      capLogoff: '{n}. {t}: Ana logs off. The token, the TGT and the tickets of that session are gone.',
      capLogoffSmb: ' Her SMB session with FS1 closes too.',
      capLogon: '{n}. {t}: Ana logs on to PC-07 again, and {dc} answers. The new token has the groups AD has now: {groups}. Nested groups are expanded at logon.',
      capLogonStale: '{n}. {t}: Ana logs on to PC-07 and DC1 answers, but DC1 does not have the change from DC2 yet: the new token has the old groups ({groups}).',
      capTgtRenew: '{n}. {t}: Ana\'s tickets are discarded and a new TGT is requested from DC1: it carries {groups}. Her access token on PC-07 stays the one from {logon}.',
      capTgtRenewStale: '{n}. {t}: a new TGT from DC1, but DC1 does not have the change from DC2 yet: the TGT carries the old groups ({groups}).',
      capTgtRenewal: '{n}. {t}: 15 min before its end the client renews the TGT from 08:00, now valid until {exp}. A renewal copies the groups from the old TGT ({groups}); they are not read from AD again.',
      capTicket: '{n}. {t}: a new service ticket for FS1: the TGT\'s groups plus the domain local groups DC1 adds: {groups}.',
      capTicketAfterRenewal: '{n}. {t}: the ticket from 08:05 ended at 18:00 with the old TGT. The new one copies the renewed TGT\'s groups, and DC1 adds the domain local ones: {groups}.',
      capAttemptStillOk: '{n}. {t}: Ana opens {share}: still access, five hours after the removal. Until she logs off or gets new tickets, renewals carry the morning\'s groups (up to 7 days).',
      capAttemptStillDenied: '{n}. {t}: Ana opens {share}: still denied. Until she logs off or gets new tickets, renewals carry the morning\'s groups (up to 7 days).',
      capReauth: ' The SMB session\'s ticket ended at 18:00, so the session authenticates again with the new ticket.',
      capAttemptOk: '{n}. {t}: Ana opens {share}: access. FS1 builds her token from the new ticket; it has DL_FS1_Prodaja_Modify, to which the ACL grants Modify.',
      capAttemptDenied: '{n}. {t}: Ana opens {share}: denied. The new ticket has neither Prodaja nor DL_FS1_Prodaja_Modify.',
      capAttemptSession: '{n}. {t}: Ana opens {share}: still denied. New tickets do not help while the SMB session from {since} is open: it keeps its token.',
      capAttemptSessionOk: '{n}. {t}: Ana opens {share}: still access. The SMB session from {since} keeps its old token.',
      capLocalDenied: '{n}. {t}: on PC-07 Ana opens {path}: denied. Her local access token is still the one from {logon}, without Prodaja.',
      capLocalOk: '{n}. {t}: on PC-07 Ana opens {path}: still access. Her local access token from {logon} still has Prodaja.',
      capNested: 'Prodaja is a member of DL_FS1_Prodaja_Modify, and FS1\'s ACL names only the DL group. Ana\'s token from 08:00 has neither. Next: log off and on.',
      capEnd: ' The end.',

      explain:
        '<p><b>The token.</b> At logon the system builds an access token: the user\'s SID, the SIDs of all the user\'s groups ' +
        '(and of the groups those groups are nested in) and a few well-known SIDs (<span translate="no">Everyone</span>, ' +
        '<span translate="no">Authenticated Users</span>, <span translate="no">INTERACTIVE</span>). Every process of the session gets a ' +
        'copy. An access check compares the token\'s SIDs with the entries of an [[access control list]]; AD is not asked.</p>' +
        '<p><b>The token does not change.</b> A membership change in AD does not touch a token that already exists. That is why a ' +
        'user logs off and on after a group change. Removal works the same way: a removed user keeps access until the token and ' +
        'the tickets are renewed.</p>' +
        '<p><b>Over the network.</b> The group list travels in the Kerberos TGT (the PAC) and is copied into the service ticket. The ' +
        'DC adds the domain local groups when it issues a service ticket. The server builds its own token for the user from that ' +
        'ticket. A TGT lives 10 h, a service ticket 600 min but never longer than the TGT. The client renews its TGT before the end ' +
        '(up to 7 days), and a renewal copies the old groups. Only new tickets (after discarding the old ones) bring the new groups ' +
        'to the server, while the local token stays old. An open SMB session keeps the token it was opened with.</p>' +
        '<p><b>Replication.</b> A logon uses what the answering DC has. A change made on another DC arrives by replication, within a ' +
        'site in about 15 s; a logon before that gets the old groups.</p>' +
        '<p><b>The model.</b> Each step is one event. When two events fall at the same time, a logon and a new ticket come before an ' +
        'access attempt, so the attempt uses the new token. Without an open SMB session every access opens its own session and closes it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
