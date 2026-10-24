/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-domain-logon, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). Terms missing from kit/glossary.js
   are written out (NOTES.md, "Term pairs").
   Host names, users, addresses, record names and message names are data: the page writes them with translate="no".
   Croatian captions avoid gendered past participles for the user ({u} is ana or marko). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dvije lokacije, PC07 i poruke prijave u domenu',

      // topology
      siteWord: 'lokacija',
      noSubnet: 'nema objekta podmreže',
      tunnel: 'IPsec tunel (WAN)',
      tunnelUp: 'radi',
      tunnelDown: 'ne radi',
      tunnelCross: 'poruka ide kroz tunel',
      tunnelLost: 'poruka se gubi',
      offWord: 'izvan mreže',
      offNote: 'nema veze s mrežom domene',
      writable: 'DC s upisom',
      readOnly: 'samo za čitanje',
      dnsToo: 'i DNS',
      chosen: 'izabran',
      pcNow: 'ovdje je PC07',

      // cache
      cacheTitle: 'Spremljene vjerodajnice na PC07',
      cacheCount: '{k} / {max}',
      cacheEmpty: 'još nijedna',
      cacheNew: 'nova',
      cacheUsed: 'upotrijebljena',
      cacheMissing: '{u}: nema je',

      // result
      resTitle: 'Ishod',
      resWait: 'prijava za {u}…',
      resOk: 'prijava uspjela: {u}',
      resCached: 'prijava spremljenim vjerodajnicama: {u}',
      resFail: 'prijava nije uspjela',
      resVia: 'preko {dc}',
      resTgt: 'Kerberos, TGT',
      resFwd: 'proslijeđeno na DC01 kroz tunel',
      resWan: 'kroz tunel, sporo',
      resNoTicket: 'bez karte',
      resNoGpo: 'bez novih GPO-ova',
      msg: 'Ne možemo vas prijaviti s ovim vjerodajnicama jer vaša domena nije dostupna.',
      msgOld: 'Trenutačno nema poslužitelja za prijavu koji bi obradili zahtjev za prijavu.',

      // lanes
      laneClient: 'klijent',
      dnsWord: 'DNS',
      dnsOn: 'na {dc}',
      dnsNone: 'nedostupan',
      siteNone: 'nijedna',
      offline: 'izvan mreže',
      pwdYes: 'ima lozinke: {u}, PC07',
      pwdNo: 'nema lozinke: {u}, PC07',
      dnsZone: 'zona domene',

      // chart
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      pongLabel: 'odgovor',
      closestYes: 'najbliži',
      closestNo: 'nije najbliži',
      noSite: 'bez lokacije',
      reTunnel: 'tunel ne radi',
      noteStored: 'spremljeno: {u} {k}/{max}',
      noteRefreshed: 'osvježeno: {u} {k}/{max}',
      noteCached: 'spremljene vjerodajnice: {u}',
      noteNoLogon: '✕ prijava odbijena',

      // params
      pLocation: 'Gdje je PC07',
      optHq: 'u HQ-u',
      optBranch: 'u Branchu',
      optOffline: 'izvan mreže',
      pLastSite: 'Lokacija koju PC07 pamti',
      optSiteHq: 'HQ',
      optSiteBranch: 'Branch',
      optSiteNone: 'nijedna',
      pUser: 'Korisnik',
      pSubnets: 'Definirane podmreže',
      pWan: 'Tunel radi',
      pCachedOnPc: 'ana se već prijavljivala na PC07',
      pRodcHasPwd: 'RODC01 ima lozinke korisnika i PC07',

      // presets
      presetHq: 'HQ',
      presetHqHint: 'zapis lokacije HQ → DC01, Kerberos, spremljeno 1/10',
      presetBranchFirst: 'Branch, prvi put',
      presetBranchFirstHint: 'pamti HQ → DC01 kaže „Branch” → RODC01 prosljeđuje na DC01',
      presetWanDown: 'Branch, tunel ne radi',
      presetWanDownHint: 'RODC01 nema lozinke, DC01 je nedostupan: spremljene vjerodajnice',
      presetOffline: 'Izvan mreže, novi korisnik',
      presetOfflineHint: 'marko se ovdje nikad nije prijavio: nema poslužitelja za prijavu',
      presetNoSubnets: 'Bez podmreža',
      presetNoSubnetsHint: 'nijedna podmreža: DC01 preko WAN-a iako je RODC01 u istoj zgradi',

      // legend
      legDns: 'DNS upit',
      legPing: 'LDAP ping',
      legKerb: 'Kerberos',
      legSite: 'lokacija',
      legChosen: 'izabrani DC',
      legKey: 'spremljena vjerodajnica',
      legChanged: 'ovaj korak',

      // captions: start
      capStart_hq: '{u} se prijavljuje na {c}, prijenosnik iz HQ-a, sada u HQ-u ({ip}).',
      capStart_branch: '{u} se prijavljuje na {c}, prijenosnik iz HQ-a, sada u Branchu ({ip}).',
      capStart_offline: '{u} se prijavljuje na {c}, prijenosnik iz HQ-a, sada izvan mreže: nema veze s mrežom domene.',
      startSite: ' Od zadnje prijave pamti lokaciju (*site*) {site}.',
      startNoSite: ' Ne pamti nijednu lokaciju (*site*).',
      startNoSubnets: ' Nema objekata podmreže (*subnet*), pa nijedan DC klijentu ne može reći u kojoj je lokaciji.',
      startWanDown: ' Tunel između lokacija ne radi.',
      startCache: ' Na {c} su *cached credentials* (spremljene vjerodajnice) za: {list}.',
      startCacheEmpty: ' Na {c} još nema *cached credentials* (spremljenih vjerodajnica).',
      startRodc: ' RODC01 ima lozinke za {u} i za PC07.',

      // captions: locator
      capQuerySite: 'Korak {n}: *DC locator* (lociranje kontrolera domene) počinje u DNS-u. {c} pamti lokaciju {site}, pa svoj DNS poslužitelj ({dns}) pita za {q}: DC u toj lokaciji.',
      capQueryNone: 'Korak {n}: *DC locator* (lociranje kontrolera domene) počinje u DNS-u. {c} ne pamti lokaciju, pa svoj DNS poslužitelj ({dns}) pita za {q}: bilo koji DC domene.',
      capQueryLearnt: 'Korak {n}: {dc} javlja da je klijent s {ip} u lokaciji {site}: klijent ponovo pita DNS za {q}.',
      capQueryFallback: 'Korak {n}: nijedan DC lokacije {site} nije odgovorio, pa {c} pita za {q}: bilo koji DC domene.',
      capQueryLost: 'Korak {n}: *DC locator* (lociranje kontrolera domene) počinje u DNS-u: {c} pita za {q}, ali je izvan mreže i nijedan DNS poslužitelj ne odgovara.',
      capQueryLostAgain: 'Korak {n}: {c} pokušava i {q}: opet bez odgovora.',
      capAnswer: 'Korak {n}: DNS poslužitelj na {dns} odgovara: {t} ({ip}).',
      capAnswerLearnt: 'Korak {n}: DNS poslužitelj odgovara: {t} ({ip}), DC u lokaciji {site}.',
      capAnswerTried: 'Korak {n}: DNS poslužitelj odgovara: {t} — a taj se upravo nije javio. Drugog DC-a za pokušaj nema.',
      noRodc: ' RODC01 nije u odgovoru: *read-only domain controller* (kontroler domene samo za čitanje) upisuje samo zapise svoje lokacije.',
      capPing: 'Korak {n}: {c} šalje {dc} *LDAP ping* (CLDAP, UDP 389): radiš li i u kojoj sam lokaciji?',
      wanPing: ' Ping ide kroz tunel.',
      capPingLost: 'Korak {n}: {c} šalje {dc} *LDAP ping*, kroz tunel — ali tunel ne radi: nema odgovora.',
      capPongClosest: 'Korak {n}: {dc} odgovara: {c} ({ip}) je u lokaciji {site}, a {dc} također. To je njegov DC; lokaciju pamti za sljedeći put.',
      capPongFar: 'Korak {n}: {dc} odgovara: {c} ({ip}) je u lokaciji {site}, a {dc} je u {dcsite}. Nije najbliži DC.',
      capPongNoSite: 'Korak {n}: {dc} odgovara, ali nijedna podmreža ne obuhvaća {ip}: lokacije nema. {c} ostaje kod {dc}, DC-a koji se prvi javio.',
      pongNextDoor: ' To je DC preko WAN-a, iako je {near} u istoj zgradi.',

      // captions: Kerberos
      capAsReq: 'Korak {n}: prijava je Kerberos. {c} šalje {dc} AS-REQ za {u}.',
      capFwd: 'Korak {n}: RODC01 nema lozinke za {u} i PC07, pa zahtjev prosljeđuje DC-u s upisom, DC01, kroz tunel.',
      capFwdLost: 'Korak {n}: RODC01 nema lozinke za {u} i PC07, pa zahtjev prosljeđuje DC01 — ali tunel ne radi.',
      capFwdRep: 'Korak {n}: DC01 provjerava lozinku i odgovara RODC01.',
      capAsRep: 'Korak {n}: {dc} vraća TGT: prijava za {u} uspijeva. S njim {c} dobiva još i *ticket* (kartu) za samog sebe; detalji su u simulatoru Kerberosa.',
      rodcOwn: ' RODC01 ima lozinke za {u} i za PC07, pa odgovara sam, bez DC01.',
      capKrbError: 'Korak {n}: RODC01 ne može provjeriti lozinku i odgovara pogreškom. Nijedan DC ne može prijaviti {u}.',

      // captions: end
      capStore: 'Korak {n}: prijava je gotova. {c} sprema vjerodajnicu za {u}: {k} od {max}.',
      capRefresh: 'Korak {n}: prijava je gotova. {c} osvježava spremljenu vjerodajnicu za {u}: i dalje {k} od {max}.',
      tailWan: ' Preko {dc}, kroz tunel: sporo.',
      tailFwd: ' RODC01 je morao pitati DC01 kroz tunel: sporije.',
      why_noDc: 'Nijedan DC koji je lokator pronašao ne odgovara',
      why_offline: 'Nijedan DC ne odgovara',
      why_rodc: 'Nijedan DC ne može provjeriti lozinku',
      capCached: 'Korak {n}: {why}, ali {c} pamti raniju prijavu za {u}: prijava *cached credentials* (spremljenim vjerodajnicama). Nema karte ni novih GPO-ova, a dijeljene mape koje traže kartu čekaju da se DC opet javi.',
      capNoLogon: 'Korak {n}: {why}, a {c} nema spremljenu vjerodajnicu za {u} — taj se korisnik ovdje nikad nije prijavio. Prijava ne uspijeva: „{msg}” (starije inačice: „{old}”)',

      explain: '<p><em lang="en">DC locator</em> (lociranje kontrolera domene): računalo pita svoj DNS poslužitelj za SRV ' +
        'zapis, <code translate="no">_ldap._tcp.&lt;lokacija&gt;._sites.dc._msdcs</code> ako pamti lokaciju (<em lang="en">site</em>), ' +
        'inače <code translate="no">_ldap._tcp.dc._msdcs</code>. Pronađenom DC-u šalje LDAP ping; DC iz klijentove adrese i ' +
        'objekata podmreže (<em lang="en">subnet</em>) izračuna njegovu lokaciju. Ako DC nije u njoj, klijent traži DC svoje ' +
        'lokacije. Bez podmreža lokacije nema i klijent ostaje kod DC-a koji se prvi javio, makar preko WAN-a.</p>' +
        '<p>Zatim Kerberos: AS-REQ, AS-REP s TGT-om. Kontroler domene samo za čitanje (RODC) u podružnici odgovara sam samo ' +
        'kad ima lozinke korisnika i računala; za ostale pita DC s upisom kroz WAN.</p>' +
        '<p>Nakon uspješne prijave računalo sprema vjerodajnicu (zadano do 10 korisnika). Kad se nijedan DC ne javi, ' +
        'korisnik koji se ovdje već prijavljivao ulazi s <em lang="en">cached credentials</em> (spremljenim vjerodajnicama), ' +
        'bez karte i novih GPO-ova; tko se nikad nije prijavio, ne ulazi.</p>'
    },
    en: {
      stage: 'Two sites, PC07 and the messages of a domain logon',

      // topology
      siteWord: 'site',
      noSubnet: 'no subnet object',
      tunnel: 'IPsec tunnel (WAN)',
      tunnelUp: 'up',
      tunnelDown: 'down',
      tunnelCross: 'a message crosses it',
      tunnelLost: 'the message is lost',
      offWord: 'offline',
      offNote: 'no connection to the domain network',
      writable: 'writable DC',
      readOnly: 'read-only',
      dnsToo: 'and DNS',
      chosen: 'chosen',
      pcNow: 'PC07 is here',

      // cache
      cacheTitle: 'Cached credentials on PC07',
      cacheCount: '{k} / {max}',
      cacheEmpty: 'none yet',
      cacheNew: 'new',
      cacheUsed: 'used',
      cacheMissing: '{u}: not there',

      // result
      resTitle: 'Result',
      resWait: 'logon for {u}…',
      resOk: 'logged on: {u}',
      resCached: 'logged on with cached credentials: {u}',
      resFail: 'the logon failed',
      resVia: 'through {dc}',
      resTgt: 'Kerberos, TGT',
      resFwd: 'forwarded to DC01 across the tunnel',
      resWan: 'across the tunnel, slow',
      resNoTicket: 'no ticket',
      resNoGpo: 'no new GPOs',
      msg: 'We can\'t sign you in with this credential because your domain isn\'t available.',
      msgOld: 'There are currently no logon servers available to service the logon request.',

      // lanes
      laneClient: 'client',
      dnsWord: 'DNS',
      dnsOn: 'on {dc}',
      dnsNone: 'unreachable',
      siteNone: 'none',
      offline: 'offline',
      pwdYes: 'holds passwords: {u}, PC07',
      pwdNo: 'lacks passwords: {u}, PC07',
      dnsZone: 'the domain\'s zone',

      // chart
      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      pongLabel: 'reply',
      closestYes: 'closest',
      closestNo: 'not closest',
      noSite: 'no site',
      reTunnel: 'tunnel down',
      noteStored: 'cached: {u} {k}/{max}',
      noteRefreshed: 'refreshed: {u} {k}/{max}',
      noteCached: 'cached credentials: {u}',
      noteNoLogon: '✕ logon refused',

      // params
      pLocation: 'Where PC07 is',
      optHq: 'in HQ',
      optBranch: 'at the branch',
      optOffline: 'offline',
      pLastSite: 'Site PC07 remembers',
      optSiteHq: 'HQ',
      optSiteBranch: 'Branch',
      optSiteNone: 'none',
      pUser: 'User',
      pSubnets: 'Subnets defined',
      pWan: 'Tunnel up',
      pCachedOnPc: 'ana has logged on at PC07 before',
      pRodcHasPwd: 'RODC01 holds the user\'s and PC07\'s passwords',

      // presets
      presetHq: 'HQ',
      presetHqHint: 'HQ site record → DC01, Kerberos, cached 1/10',
      presetBranchFirst: 'Branch, first time',
      presetBranchFirstHint: 'remembers HQ → DC01 says "Branch" → RODC01 forwards to DC01',
      presetWanDown: 'Branch, tunnel down',
      presetWanDownHint: 'RODC01 lacks the passwords, DC01 unreachable: cached credentials',
      presetOffline: 'Offline, new user',
      presetOfflineHint: 'marko never logged on here: no logon servers',
      presetNoSubnets: 'No subnets',
      presetNoSubnetsHint: 'no subnet objects: DC01 over the WAN although RODC01 is next door',

      // legend
      legDns: 'DNS query',
      legPing: 'LDAP ping',
      legKerb: 'Kerberos',
      legSite: 'site',
      legChosen: 'chosen DC',
      legKey: 'cached credential',
      legChanged: 'this step',

      // captions: start
      capStart_hq: '{u} logs on at {c}, an HQ laptop, now in HQ ({ip}).',
      capStart_branch: '{u} logs on at {c}, an HQ laptop, now at the branch ({ip}).',
      capStart_offline: '{u} logs on at {c}, an HQ laptop, now offline: no connection to the domain network.',
      startSite: ' It remembers site {site} from its last logon.',
      startNoSite: ' It remembers no site.',
      startNoSubnets: ' No subnet objects are defined, so no DC can tell a client which site it is in.',
      startWanDown: ' The tunnel between the sites is down.',
      startCache: ' Cached credentials on {c}: {list}.',
      startCacheEmpty: ' No cached credentials on {c} yet.',
      startRodc: ' RODC01 holds the passwords of {u} and of PC07.',

      // captions: locator
      capQuerySite: 'Step {n}: the DC locator starts in DNS. {c} remembers site {site}, so it asks its DNS server ({dns}) for {q}: a DC in that site.',
      capQueryNone: 'Step {n}: the DC locator starts in DNS. {c} remembers no site, so it asks its DNS server ({dns}) for {q}: any DC of the domain.',
      capQueryLearnt: 'Step {n}: {dc} reports that the client at {ip} is in site {site}: the client asks again, for {q}.',
      capQueryFallback: 'Step {n}: no DC of site {site} answered, so {c} asks for {q}: any DC of the domain.',
      capQueryLost: 'Step {n}: the DC locator starts in DNS: {c} asks for {q}, but it is offline and no DNS server answers.',
      capQueryLostAgain: 'Step {n}: {c} tries {q} too: no answer again.',
      capAnswer: 'Step {n}: the DNS server on {dns} answers: {t} ({ip}).',
      capAnswerLearnt: 'Step {n}: the DNS server answers: {t} ({ip}), the DC in site {site}.',
      capAnswerTried: 'Step {n}: the DNS server answers: {t}, which has just not answered. There is no other DC to try.',
      noRodc: ' RODC01 is not in it: a read-only domain controller registers only its own site\'s records.',
      capPing: 'Step {n}: {c} sends {dc} an LDAP ping (CLDAP, UDP 389): are you up, and which site am I in?',
      wanPing: ' The ping crosses the tunnel.',
      capPingLost: 'Step {n}: {c} sends {dc} an LDAP ping, across the tunnel, but the tunnel is down: no answer.',
      capPongClosest: 'Step {n}: {dc} answers: {c} ({ip}) is in site {site}, and so is {dc}. That is its DC; it stores the site for next time.',
      capPongFar: 'Step {n}: {dc} answers: {c} ({ip}) is in site {site}, {dc} is in {dcsite}. Not the closest DC.',
      capPongNoSite: 'Step {n}: {dc} answers, but no subnet contains {ip}: no site. {c} keeps {dc}, the DC that answered first.',
      pongNextDoor: ' That is a DC across the WAN, although {near} is next door.',

      // captions: Kerberos
      capAsReq: 'Step {n}: logon is Kerberos. {c} sends {dc} an AS-REQ for {u}.',
      capFwd: 'Step {n}: RODC01 does not hold the passwords of {u} and PC07, so it forwards the request to the writable DC01, across the tunnel.',
      capFwdLost: 'Step {n}: RODC01 does not hold the passwords of {u} and PC07 and forwards the request to DC01, but the tunnel is down.',
      capFwdRep: 'Step {n}: DC01 checks the password and answers RODC01.',
      capAsRep: 'Step {n}: {dc} returns a TGT: {u} is logged on. With it, {c} also gets a ticket for itself; the details are in the Kerberos simulator.',
      rodcOwn: ' RODC01 holds the passwords of {u} and PC07, so it answers on its own, without DC01.',
      capKrbError: 'Step {n}: RODC01 cannot check the password and answers with an error. No DC can log {u} on.',

      // captions: end
      capStore: 'Step {n}: the logon is done. {c} stores a cached verifier for {u}: {k} of {max}.',
      capRefresh: 'Step {n}: the logon is done. {c} refreshes {u}\'s cached verifier: still {k} of {max}.',
      tailWan: ' Through {dc}, across the tunnel: slow.',
      tailFwd: ' RODC01 had to ask DC01 across the tunnel: slower.',
      why_noDc: 'No DC the locator found answers',
      why_offline: 'No DC answers',
      why_rodc: 'No DC can check the password',
      capCached: 'Step {n}: {why}, but {u} has logged on at {c} before: {u} logs on with cached credentials. No ticket and no new GPOs; file shares that need a ticket wait until a DC answers again.',
      capNoLogon: 'Step {n}: {why}, and {c} has no cached verifier for {u}, who has never logged on here. The logon fails: “{msg}” (older versions: “{old}”)',

      explain: '<p>The DC locator: the computer asks its DNS server for an SRV record, ' +
        '<code translate="no">_ldap._tcp.&lt;site&gt;._sites.dc._msdcs</code> if it remembers a site, ' +
        'otherwise <code translate="no">_ldap._tcp.dc._msdcs</code>. It sends the DC it finds an LDAP ping; the DC works out ' +
        'the client\'s site from its address and the subnet objects. If the DC is not in that site, the client looks for a DC ' +
        'that is. Without subnets there is no site, and the client keeps whichever DC answered first, even across the WAN.</p>' +
        '<p>Then Kerberos: AS-REQ, AS-REP with a TGT. A read-only domain controller (RODC) at a branch answers on its own ' +
        'only when it holds the passwords of both the user and the computer; otherwise it asks a writable DC across the WAN.</p>' +
        '<p>After a successful logon the computer stores a cached verifier (up to 10 users by default). When no DC answers, ' +
        'a user who has logged on here before gets in with cached credentials, without a ticket or new GPOs; a user who ' +
        'never has does not get in.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
