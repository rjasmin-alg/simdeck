/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dns-forwarders, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is
   a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *word* is an
   English term in italics on the Croatian page (the page's rich() turns it into <em lang="en">).
   Names, addresses, record types, flags, rcodes and times are data, not strings: the page writes them with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kamo DC1 šalje imena: poruke, odluka i predmemorija',

      // lanes
      lanePC: 'PC-07',
      laneDC: 'DC1',
      lanePartner: 'Partner',
      laneFwd: 'Prosljeđivač',
      laneRoot: 'Korijen',
      laneTld: '.org',
      laneAuth: 'example.org',
      rolePC: 'klijent',
      roleDC: 'DNS za corp.example',
      rolePartner: 'DNS za partner.example',
      roleFwd: 'rezolver pružatelja usluge',
      roleRoot: 'korijenski poslužitelj',
      roleTld: 'vršna domena',
      roleAuth: 'autoritativni',
      badgeZone: 'zona',
      badgeCond: 'uvjetni',
      badgeFwd: 'prosljeđivač',
      badgeHints: '*root hints*',
      badgeCache: 'predmemorija',
      badgeFail: 'neuspjeh',
      down: 'ne radi',

      // chips and notes
      kQuery: 'upit',
      kReferral: 'uputa',
      kAnswer: 'odgovor',
      noteLater: '{adv} kasnije',
      timer: '⏱ {s}',

      // decision table
      tableTitle: 'Redoslijed odluke na DC1',
      colMatch: 'provjera',
      colAction: 'šalje na',
      colMark: 'ovaj upit',
      rCache: 'predmemorija',
      rZone: 'zona',
      rCond: 'uvjetni prosljeđivač',
      rFwd: 'prosljeđivač {i}',
      rHints: '*root hints*',
      mCacheName: 'zapamćeni odgovori',
      mAny: 'sva ostala imena',
      mAfterFwd: 'rezerva',
      aCache: 'odgovara',
      aZone: 'odgovara (aa)',
      aHints: 'korijen',
      implicit: 'ništa drugo',
      tagOff: 'isključeno',
      tagNorec: 'bez rekurzije',
      noteShorter: 'duža domena ima prednost',
      noteSame: 'ista domena upisana ranije ima prednost',
      capCondNx: '{n}. Partnerov poslužitelj odgovara autoritativno (aa): NXDOMAIN. DC1 to pamti {ttl}.',
      noteTimeout: '⏱ {s} bez odgovora',
      wSkip: 'ne čita se',
      wBeaten: 'šuti',
      waiting: 'čeka odgovor…',

      // cache
      cacheTitle: 'Predmemorija DC1',
      cacheAt: 'u t = {t}',
      cacheHint: 'popis korijenskih poslužitelja, ne istječe',
      cacheNx: 'ime ne postoji',
      cacheGlue: '+ adrese poslužitelja',
      cacheEmpty: 'Ništa naučeno.',

      // params
      pName: 'Ime',
      pCond: 'Uvjetni prosljeđivač',
      pFwdUp: '198.51.100.53 radi',
      pHints: 'Root hints kao rezerva',
      pRec: 'Rekurzija',
      pRepeat: 'Ponovi +60 s',

      // presets
      prInternal: 'Interno ime',
      prInternalHint: 'fs1.corp.example: DC1 odgovara iz svoje zone, 2 poruke',
      prPartner: 'Partner',
      prPartnerHint: 'crm.partner.example ide uvjetnom prosljeđivaču, 4 poruke',
      prInternet: 'Internet',
      prInternetHint: 'www.example.org preko prosljeđivača, pa ponovno iz predmemorije',
      prFwdDown: 'Prosljeđivač ne radi',
      prFwdDownHint: '3 s čekanja, pa od korijena: 9 poruka',
      prNoCond: 'Bez uvjetnog',
      prNoCondHint: 'Partnerovo ime ide prosljeđivaču: NXDOMAIN, i tu staje',
      prNoFallback: 'Bez rezerve',
      prNoFallbackHint: 'Prosljeđivač ne radi, root hints isključeni: SERVFAIL',
      prNoRec: 'Bez rekurzije',
      prNoRecHint: 'Rekurzija isključena: i partnerovo ime dobiva SERVFAIL',

      // legend
      legendQuery: 'upit',
      legendReferral: 'uputa',
      legendAnswer: 'odgovor',
      legendTimeout: 'bez odgovora',
      legendWin: 'redak koji odlučuje',
      legendChanged: 'ovaj korak',

      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} ranija poruka', '↑ {n} ranije poruke', '↑ {n} ranijih poruka'],
      sec: '{v} s',

      // captions
      capStart: 'PC-07 će pitati DC1 za {name}. DC1 sam drži samo zonu corp.example; za svako drugo ime mora znati kamo ga poslati.',
      capQuery: '{n}. PC-07 pita DC1 za {name}, sa zastavicom rd: neka DC1 sam nađe odgovor.',
      capQueryAgain: '{n}. {adv} kasnije PC-07 opet pita za {name}.',
      decCache: 'DC1 ima odgovor u predmemoriji (preostalo {left}): prvi redak odlučuje i nitko se ne pita.',
      decZone: 'Ime je u zoni corp.example koju DC1 drži: odgovara sam, ništa ne prosljeđuje.',
      decCond: 'Nije u predmemoriji ni u zoni DC1, ali pripada domeni partner.example za koju postoji uvjetni prosljeđivač.',
      decFwd: 'Nije u predmemoriji ni u zoni DC1, a uvjetni prosljeđivač za njega ne postoji: ide prosljeđivaču.',
      decFwdCondOff: 'Uvjetni prosljeđivač za partner.example je isključen, pa ime ide običnom prosljeđivaču kao i svako drugo.',
      decHints: 'Nije u predmemoriji ni u zoni DC1, a prosljeđivača nema: DC1 kreće od korijena.',
      decNorec: 'Na DC1 je isključena rekurzija: odgovara samo iz svojih zona, nikamo ne prosljeđuje.',
      decFail: 'Nijedan redak ne odgovara.',
      capCondSend: '{n}. Ime {name} pripada partneru: DC1 ga šalje *conditional forwarder*-u (uvjetnom prosljeđivaču) {ip}.',
      capFwdSend: '{n}. DC1 prosljeđuje upit na {ip}, sa zastavicom rd: cijelu potragu obavlja prosljeđivač.',
      capLost: 'Prosljeđivač ne radi: odgovora nema. DC1 čeka {s}.',
      capHintsStart: '{n}. Prošlo je {s} bez odgovora. Rezerva preko *root hints* je uključena, pa DC1 ime razrješava sam, od korijena, iterativnim upitima (bez rd).',
      capAsk: '{n}. DC1 pita {server}, iterativno.',
      capReferral: '{n}. {server} ne zna ime, ali upućuje na poslužitelje zone {zone}. DC1 pamti uputu {ttl}.',
      capAuthAnswer: '{n}. {server} odgovara autoritativno (aa): {ip}, TTL {ttl}. DC1 ga sprema u predmemoriju.',
      capRootNx: '{n}. U korijenu nema vršne domene .example: NXDOMAIN (aa). DC1 to pamti {ttl}.',
      capCondAnswer: '{n}. Partnerov poslužitelj odgovara autoritativno (aa): {ip}. DC1 ga sprema na {ttl}.',
      capFwdAnswer: '{n}. Prosljeđivač odgovara {ip} (ra, bez aa: odgovor je dobio od drugih). DC1 ga sprema na {ttl}.',
      capFwdNx: '{n}. Prosljeđivač je odgovorio NXDOMAIN — to je odgovor, ne kvar, pa DC1 ne pokušava preko korijenskih poslužitelja.',
      capFwdNxWhy: 'Imena iz partner.example postoje samo na partnerovu poslužitelju; javni internet ih ne zna.',
      capNegCached: 'DC1 pamti „ne postoji” {ttl}: SOA kaže {soa}, a DC1 negativne odgovore drži najviše 900 s.',
      capReplyZone: '{n}. DC1 odgovara iz svoje zone: {ip}, sa zastavicom aa. Ni jedna poruka nije izašla iz DC1.',
      capReplyCache: '{n}. DC1 odgovara iz predmemorije: {ip}, preostalo {left}. Ni jedna poruka nije izašla iz DC1.',
      capReplyCacheNx: '{n}. DC1 odgovara iz predmemorije: NXDOMAIN, preostalo {left}. Ni jedna poruka nije izašla iz DC1.',
      capReply: '{n}. DC1 javlja PC-07: {ip} (ra, bez aa: DC1 nije autoritativan za to ime).',
      capReplyNx: '{n}. DC1 javlja PC-07 da ime ne postoji (NXDOMAIN).',
      capReplyNorec: '{n}. SERVFAIL: bez rekurzije DC1 ne smije ni prosljeđivati. DC na koji se klijenti oslanjaju treba uključenu rekurziju.',
      capReplyNoHints: '{n}. Prosljeđivač nije odgovorio, a rezerva preko *root hints* je isključena: SERVFAIL nakon {s}.',
      capReplyCondDown: '{n}. Uvjetni prosljeđivač nije odgovorio: SERVFAIL nakon {s}.',
      capReplyFail: '{n}. SERVFAIL: DC1 nema kamo poslati ime.',
      capSlower: 'Trajalo je {s}: toliko je DC1 čekao odgovor prosljeđivača.',
      capCompare: ['Prvi put {n} poruka, sada {b}.', 'Prvi put {n} poruke, sada {b}.', 'Prvi put {n} poruka, sada {b}.'],

      explain: '<p>Klijent pita svoj DNS poslužitelj, DC1, i očekuje gotov odgovor. DC1 za svaki upit jednom prolazi isti ' +
        'popis, odozgo prema dolje, i prvi redak koji vrijedi odlučuje:</p>' +
        '<ol><li><b>predmemorija</b>: zapamćeni odgovor dok mu TTL traje (i „ne postoji”, najviše 900 s);</li>' +
        '<li><b>zona koju drži</b> (<code>corp.example</code>): odgovor sa zastavicom <code>aa</code>; NXDOMAIN iz vlastite zone je konačan;</li>' +
        '<li><em lang="en">conditional forwarder</em> (uvjetni prosljeđivač): za imena jedne domene, ovdje <code>partner.example</code> → ' +
        '<code>10.20.0.53</code>; ako se poklapa više domena, vrijedi najduža;</li>' +
        '<li>[[forwarder]] na razini poslužitelja (<code>198.51.100.53</code>): svako drugo ime, redom s popisa, svaki čeka 3 s;</li>' +
        '<li><em lang="en">root hints</em> (popis korijenskih poslužitelja): ako nijedan prosljeđivač nije odgovorio, a rezerva je ' +
        'uključena, DC1 sam ide od korijena, kao rekurzivni rezolver;</li>' +
        '<li>inače SERVFAIL.</li></ol>' +
        '<p><b>Odgovor zaustavlja potragu.</b> NXDOMAIN od prosljeđivača je odgovor, ne kvar: DC1 ne pita sljedeći prosljeđivač ni ' +
        'korijen. Na <em lang="en">root hints</em> prelazi samo kad odgovora nema (istek vremena čekanja). Zato partnerova imena, ' +
        'bez uvjetnog prosljeđivača, završe kao NXDOMAIN: javni rezolver ih ne zna.</p>' +
        '<p><b>Prosljeđivač nije nužan za internet.</b> S praznim popisom DC1 odmah ide od korijena; prosljeđivač samo prebacuje ' +
        'posao (i predmemoriju) na drugi poslužitelj.</p>' +
        '<p><b>Rekurzija</b>: kad je isključena, isključeni su i prosljeđivači; DC1 tada odgovara samo iz ' +
        'svojih zona, sve ostalo dobiva SERVFAIL. To je postavka za poslužitelj koji samo objavljuje zone, ne za DC.</p>' +
        '<p><b>Uvjetni prosljeđivač nije <em lang="en">stub zone</em>.</b> Uvjetni prosljeđivač je ručno upisana adresa; ' +
        '<em lang="en">stub zone</em> (zona-zametak) sama povlači i osvježava NS zapise te domene od njezinih poslužitelja, ' +
        'pa prati promjene adresa.</p>' +
        '<p>Vremena su zadana na Windows Serveru: 3 s po prosljeđivaču, 5 s po cilju uvjetnog prosljeđivača. Poruke u ' +
        'simulaciji ne traju ništa, a ponovne pokušaje klijenta dok čeka ne prikazujemo.</p>'
    },
    en: {
      stage: 'Where DC1 sends names: messages, the decision and the cache',

      lanePC: 'PC-07',
      laneDC: 'DC1',
      lanePartner: 'Partner',
      laneFwd: 'Forwarder',
      laneRoot: 'Root',
      laneTld: '.org',
      laneAuth: 'example.org',
      rolePC: 'client',
      roleDC: 'DNS for corp.example',
      rolePartner: 'DNS for partner.example',
      roleFwd: 'the ISP\'s resolver',
      roleRoot: 'root server',
      roleTld: 'top-level domain',
      roleAuth: 'authoritative',
      badgeZone: 'zone',
      badgeCond: 'conditional',
      badgeFwd: 'forwarder',
      badgeHints: 'root hints',
      badgeCache: 'cache',
      badgeFail: 'fail',
      down: 'down',

      kQuery: 'query',
      kReferral: 'referral',
      kAnswer: 'answer',
      noteLater: '{adv} later',
      timer: '⏱ {s}',

      tableTitle: 'DC1\'s decision order',
      colMatch: 'check',
      colAction: 'sends to',
      colMark: 'this query',
      rCache: 'cache',
      rZone: 'zone',
      rCond: 'conditional forwarder',
      rFwd: 'forwarder {i}',
      rHints: 'root hints',
      mCacheName: 'cached answers',
      mAny: 'all other names',
      mAfterFwd: 'fallback',
      aCache: 'answers',
      aZone: 'answers (aa)',
      aHints: 'the root',
      implicit: 'nothing else',
      tagOff: 'off',
      tagNorec: 'no recursion',
      noteShorter: 'a longer domain wins',
      noteSame: 'the same domain listed earlier wins',
      capCondNx: '{n}. The partner\'s server answers authoritatively (aa): NXDOMAIN. DC1 remembers that for {ttl}.',
      noteTimeout: '⏱ {s}, no answer',
      wSkip: 'not read',
      wBeaten: 'silent',
      waiting: 'waiting…',

      cacheTitle: 'DC1\'s cache',
      cacheAt: 'at t = {t}',
      cacheHint: 'the root server list, never expires',
      cacheNx: 'no such name',
      cacheGlue: '+ server addresses',
      cacheEmpty: 'Nothing learned.',

      pName: 'Name',
      pCond: 'Conditional forwarder',
      pFwdUp: '198.51.100.53 up',
      pHints: 'Root hints as fallback',
      pRec: 'Recursion',
      pRepeat: 'Repeat +60 s',

      prInternal: 'Internal name',
      prInternalHint: 'fs1.corp.example: DC1 answers from its zone, 2 messages',
      prPartner: 'Partner',
      prPartnerHint: 'crm.partner.example goes to the conditional forwarder, 4 messages',
      prInternet: 'Internet',
      prInternetHint: 'www.example.org through the forwarder, then again from the cache',
      prFwdDown: 'Forwarder down',
      prFwdDownHint: '3 s wait, then from the root: 9 messages',
      prNoCond: 'No conditional',
      prNoCondHint: 'The partner\'s name goes to the forwarder: NXDOMAIN, and that\'s it',
      prNoFallback: 'No fallback',
      prNoFallbackHint: 'Forwarder down, root hints off: SERVFAIL',
      prNoRec: 'No recursion',
      prNoRecHint: 'Recursion off: even the partner\'s name gets SERVFAIL',

      legendQuery: 'query',
      legendReferral: 'referral',
      legendAnswer: 'answer',
      legendTimeout: 'no answer',
      legendWin: 'the deciding row',
      legendChanged: 'this step',

      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier message', '↑ {n} earlier messages'],
      sec: '{v} s',

      capStart: 'PC-07 will ask DC1 for {name}. DC1 itself holds only the corp.example zone; for any other name it has to know where to send it.',
      capQuery: '{n}. PC-07 asks DC1 for {name}, with the rd flag: DC1 should find the answer itself.',
      capQueryAgain: '{n}. {adv} later PC-07 asks for {name} again.',
      decCache: 'DC1 has the answer in its cache ({left} left): the first row decides and nobody is asked.',
      decZone: 'The name is in corp.example, a zone DC1 hosts: it answers itself and forwards nothing.',
      decCond: 'Not cached, not in DC1\'s zone, but it belongs to partner.example, which has a conditional forwarder.',
      decFwd: 'Not cached, not in DC1\'s zone, and no conditional forwarder covers it: it goes to the forwarder.',
      decFwdCondOff: 'The conditional forwarder for partner.example is off, so the name goes to the ordinary forwarder like any other.',
      decHints: 'Not cached, not in DC1\'s zone, and there are no forwarders: DC1 starts at the root.',
      decNorec: 'Recursion is off on DC1: it answers only from its own zones and forwards nothing.',
      decFail: 'No row applies.',
      capCondSend: '{n}. {name} belongs to the partner: DC1 sends it to the conditional forwarder {ip}.',
      capFwdSend: '{n}. DC1 forwards the query to {ip}, with rd: the forwarder does the whole search.',
      capLost: 'The forwarder is down: no answer. DC1 waits {s}.',
      capHintsStart: '{n}. {s} passed without an answer. The root hints fallback is on, so DC1 resolves the name itself, from the root, with iterative queries (no rd).',
      capAsk: '{n}. DC1 asks {server}, iteratively.',
      capReferral: '{n}. {server} doesn\'t know the name but refers DC1 to the servers of {zone}. DC1 keeps the referral for {ttl}.',
      capAuthAnswer: '{n}. {server} answers authoritatively (aa): {ip}, TTL {ttl}. DC1 caches it.',
      capRootNx: '{n}. The root has no .example top-level domain: NXDOMAIN (aa). DC1 remembers that for {ttl}.',
      capCondAnswer: '{n}. The partner\'s server answers authoritatively (aa): {ip}. DC1 caches it for {ttl}.',
      capFwdAnswer: '{n}. The forwarder answers {ip} (ra, no aa: it got the answer from others). DC1 caches it for {ttl}.',
      capFwdNx: '{n}. The forwarder answered NXDOMAIN. That\'s an answer, not a failure, so DC1 doesn\'t try the root hints.',
      capFwdNxWhy: 'The names in partner.example exist only on the partner\'s server; the public internet doesn\'t know them.',
      capNegCached: 'DC1 remembers "no such name" for {ttl}: the SOA says {soa}, and DC1 keeps negative answers 900 s at most.',
      capReplyZone: '{n}. DC1 answers from its zone: {ip}, with the aa flag. Not one message left DC1.',
      capReplyCache: '{n}. DC1 answers from its cache: {ip}, {left} left. Not one message left DC1.',
      capReplyCacheNx: '{n}. DC1 answers from its cache: NXDOMAIN, {left} left. Not one message left DC1.',
      capReply: '{n}. DC1 tells PC-07: {ip} (ra, no aa: DC1 isn\'t authoritative for the name).',
      capReplyNx: '{n}. DC1 tells PC-07 the name doesn\'t exist (NXDOMAIN).',
      capReplyNorec: '{n}. SERVFAIL: without recursion DC1 may not forward either. A DC that clients rely on needs recursion on.',
      capReplyNoHints: '{n}. The forwarder didn\'t answer and the root hints fallback is off: SERVFAIL after {s}.',
      capReplyCondDown: '{n}. The conditional forwarder didn\'t answer: SERVFAIL after {s}.',
      capReplyFail: '{n}. SERVFAIL: DC1 has nowhere to send the name.',
      capSlower: 'It took {s}: the time DC1 waited for the forwarder.',
      capCompare: ['First time {n} message, now {b}.', 'First time {n} messages, now {b}.'],

      explain: '<p>The client asks its DNS server, DC1, and expects a complete answer. For every query DC1 goes through the same ' +
        'list once, top down, and the first row that applies decides:</p>' +
        '<ol><li><b>the cache</b>: a remembered answer while its TTL lasts ("no such name" too, 900 s at most);</li>' +
        '<li><b>a zone it hosts</b> (<code>corp.example</code>): an answer with the <code>aa</code> flag; NXDOMAIN from its own zone is final;</li>' +
        '<li>a <b>conditional forwarder</b>: for the names of one domain, here <code>partner.example</code> → <code>10.20.0.53</code>; ' +
        'when several domains match, the longest wins;</li>' +
        '<li>the server-level [[forwarder]] (<code>198.51.100.53</code>): any other name, in list order, 3 s each;</li>' +
        '<li><b>root hints</b> (the list of root servers): if no forwarder answered and the fallback is on, DC1 walks from the root ' +
        'itself, as a recursive resolver;</li>' +
        '<li>otherwise SERVFAIL.</li></ol>' +
        '<p><b>An answer ends the search.</b> NXDOMAIN from a forwarder is an answer, not a failure: DC1 asks neither the next ' +
        'forwarder nor the root. It moves on to the root hints only when there is no answer (a timeout). That is why the partner\'s ' +
        'names, without the conditional forwarder, end as NXDOMAIN: the public resolver doesn\'t know them.</p>' +
        '<p><b>A forwarder isn\'t needed to reach the internet.</b> With an empty list DC1 starts at the root at once; a forwarder ' +
        'only hands the work (and the cache) to another server.</p>' +
        '<p><b>Recursion</b>: when it is off, so are the forwarders; DC1 answers only from its own zones and everything else gets ' +
        'SERVFAIL. That setting is for a server that only publishes zones, not for a DC.</p>' +
        '<p><b>A conditional forwarder isn\'t a stub zone.</b> A conditional forwarder is an address typed in by hand; a <b>stub ' +
        'zone</b> fetches and refreshes the domain\'s NS records from its servers itself, so it follows address changes.</p>' +
        '<p>Times are the Windows Server defaults: 3 s per forwarder, 5 s per conditional forwarder target. Messages in the ' +
        'simulation take no time, and the client\'s own retries while it waits are not shown.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
