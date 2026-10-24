/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dns-srv-records, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). Terms missing from kit/glossary.js
   are written out (NOTES.md, "Term pairs").
   Host names, addresses, record names, message names and return codes are data: the page writes them with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zapisi kontrolera domene u DNS-u i klijentovi upiti',

      // records
      recsTitle: 'Što kontroleri domene upisuju u DNS',
      recsNote: 'Imena bez .quillmoor.example; svaki SRV zapis ima prioritet 0 i težinu 100.',
      use_locator: 'lociranje kontrolera domene',
      use_kerberos: 'Kerberos (KDC)',
      use_gc: 'globalni katalog (GC)',
      use_replication: 'replikacija među DC-ovima',
      recPresent: 'postoji',
      recDeleted: 'obrisan',
      recRestored: 'vraćen',
      recPicked: 'izabran',

      // result
      resTitle: 'Ishod',
      resWait_join: 'PC07 se učlanjuje u domenu…',
      resWait_logon: 'ana se prijavljuje…',
      resOk_join: 'PC07 je učlanjen u domenu',
      resOk_logon: 'ana je prijavljena',
      resVia: 'preko {dc}',
      resKdc: 'KDC {kdc}',
      resWan: 'preko WAN-a, sporo',
      resNtlm: 'NTLM, bez Kerberosove karte',
      resFail_join: 'učlanjenje nije uspjelo',
      resFail_logon: 'prijava nije uspjela',
      msg_join: 'Nije moguće kontaktirati kontroler domene (AD DC) za domenu {d}.',
      msg_logon: 'Ne možemo vas prijaviti s ovim vjerodajnicama jer vaša domena nije dostupna.',

      // lanes
      laneClient: 'klijent',
      dnsOnDc: 'na DC01',
      pubName: 'javni DNS',
      pubTag: 'nema zone domene',
      siteWord: 'lokacija',
      siteUnknown: 'još nepoznata',
      dnsWord: 'DNS',
      dnsZones: 'drži obje zone',

      // chart
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      noteRestart: 'Netlogon ponovno pokrenut',
      noteNoDc: '✕ nema DC-a',
      nRecords: ['{n} zapis', '{n} zapisa', '{n} zapisa'],
      pongLabel: 'odgovor',
      closestYes: 'najbliži',
      closestNo: 'nije najbliži',

      // params
      pAction: 'Što klijent radi',
      optJoin: 'učlanjenje',
      optLogon: 'prijava',
      pSite: 'Lokacija klijenta',
      optHq: 'HQ',
      optBranch: 'Branch',
      optUnknown: 'Branch, još ne zna',
      pDns: 'DNS poslužitelj klijenta',
      optDc01: 'DC01',
      optPublic: 'javni',
      pLocator: 'Obriši zapise za lociranje',
      pSiteRecord: 'Obriši zapise lokacija',
      pKerberos: 'Obriši zapise za Kerberos',
      pGc: 'Obriši zapise za GC',
      pRestart: 'Ponovno pokreni Netlogon',

      // presets
      presetHealthy: 'Sve ispravno',
      presetHealthyHint: 'zapis lokacije → DC01, LDAP ping, KDC, Kerberos',
      presetNoLocator: 'Bez lociranja',
      presetNoLocatorHint: 'NXDOMAIN, NXDOMAIN: nema DC-a',
      presetNoSite: 'Bez lokacije',
      presetNoSiteHint: 'Branch bez zapisa lokacije: zapis za cijelu domenu → DC01 u HQ-u, preko WAN-a',
      presetPublic: 'Javni DNS',
      presetPublicHint: 'svi zapisi postoje, a ipak NXDOMAIN',
      presetFix: 'Netlogon',
      presetFixHint: 'ponovno pokretanje na DC01, pa učlanjenje',
      presetNoKerberos: 'Bez Kerberosa',
      presetNoKerberosHint: 'nema KDC-a: prijava preko NTLM-a',

      // legend
      legDns: 'DNS',
      legCldap: 'LDAP ping (CLDAP)',
      legKerb: 'Kerberos, NTLM',
      legPresent: 'zapis postoji',
      legDeleted: 'zapis obrisan',
      legChanged: 'ovaj korak',

      // captions
      capStart_join: '{c} ({ip}) se želi učlaniti u domenu {d}. Njegov DNS poslužitelj je {dns}.',
      capStart_logon: 'Korisnica {u} prijavljuje se na {c} ({ip}), člana domene {d}. Njegov DNS poslužitelj je {dns}.',
      startSite: ' Klijent zna svoju lokaciju (*site*): {site}.',
      startUnknown: ' Klijent je u lokaciji (*site*) Branch, ali to još ne zna.',
      startJoin: ' Još nije član domene, pa ne zna svoju lokaciju (*site*); nalazi se u {site}.',
      startPublic: ' To je javni DNS poslužitelj, a ne kontroler domene.',
      startDeleted: ' Obrisano: {list}.',
      startRestart: ' Najprije se na DC01 ponovno pokreće Netlogon.',
      capRestart: 'Korak {n}: Netlogon na {dc} ponovno se pokreće. Pri svakom pokretanju, a zatim povremeno, ponovno upisuje zapise svojeg DC-a u DNS.',
      capUpdate: 'Korak {n}: {dc} svojem DNS poslužitelju šalje dinamičko ažuriranje (UPDATE) sa svih {k} svojih zapisa.',
      capUpdateOk: 'Korak {n}: DNS poslužitelj prihvaća ažuriranje.',
      backN: [' Vraćen je {n} zapis DC01.', ' Vraćena su {n} zapisa DC01.', ' Vraćeno je {n} zapisa DC01.'],
      backNone: ' Ništa nije nedostajalo: svi zapisi DC01 već su bili tu.',
      dc02Stays: ' Obrisani zapisi DC02 ostaju obrisani: njegov Netlogon ih još nije ponovno upisao.',
      capQuerySite: 'Korak {n}: klijent traži *SRV record* (SRV zapis) {q} — tako pronalazi kontroler domene u svojoj lokaciji.',
      capQueryFallback: 'Korak {n}: zapisa za lokaciju nema, pa {c} traži {q}: bilo koji DC domene, u bilo kojoj lokaciji.',
      capQueryUnknown: 'Korak {n}: {c} još ne zna svoju lokaciju, pa traži *SRV record* (SRV zapis) {q}: bilo koji DC domene.',
      capQueryJoin: 'Korak {n}: računalo koje se učlanjuje ne zna lokaciju, pa traži *SRV record* (SRV zapis) {q}: bilo koji DC domene.',
      capQueryLearnt: 'Korak {n}: {dc} nije u lokaciji {site}. {c} sada traži zapis svoje lokacije {q}.',
      capQueryKdcSite: 'Korak {n}: za Kerberos {c} treba KDC. Traži {q}, KDC-ove u svojoj lokaciji.',
      capQueryKdcDomain: 'Korak {n}: zapisa KDC-a za lokaciju nema, pa {c} traži {q}, bilo koji KDC domene.',
      capAnswer1: 'Korak {n}: DNS poslužitelj odgovara jednim ciljem: {t} ({ip}), vrata {port}.',
      capAnswer2: 'Korak {n}: dva cilja, {list}, oba s prioritetom 0 i težinom 100. Pravi klijent bira nasumce; model uzima prvi navedeni: {t}.',
      capNxDeleted: 'Korak {n}: NXDOMAIN — to ime ne postoji, njegovi su zapisi obrisani.',
      capNxStay: 'Korak {n}: NXDOMAIN — zapisa za {site} nema, pa {c} ostaje kod {dc}, preko WAN-a.',
      nxOnce: 'NXDOMAIN.',
      nxAgain: 'Opet NXDOMAIN.',
      capNxPublic: 'Korak {n}: NXDOMAIN — javni DNS poslužitelj {dns} nema zonu {d}.',
      capFail_join: 'Korak {n}: {nx} Nijedan DC nije pronađen, pa učlanjenje ne uspijeva: „{msg}”',
      capFail_logon: 'Korak {n}: {nx} Nijedan DC nije pronađen, pa prijava ne uspijeva: „{msg}”',
      capFailPublic_join: 'Korak {n}: svi zapisi postoje, ali klijent pita javni DNS {dns} — taj za {z} ne zna ništa, pa učlanjenje u domenu ne uspijeva.',
      capFailPublic_logon: 'Korak {n}: svi zapisi postoje, ali klijent pita javni DNS {dns} — taj za {z} ne zna ništa, pa prijava ne uspijeva.',
      capFailPublicAny_join: 'Korak {n}: klijent pita javni DNS {dns} — taj za {z} ne zna ništa, pa do zapisa (postojali ili ne) uopće ne dolazi i učlanjenje ne uspijeva.',
      capFailPublicAny_logon: 'Korak {n}: klijent pita javni DNS {dns} — taj za {z} ne zna ništa, pa do zapisa (postojali ili ne) uopće ne dolazi i prijava ne uspijeva.',
      capPing: 'Korak {n}: {c} šalje {dc} *LDAP ping* (CLDAP, UDP 389): radiš li i u kojoj sam lokaciji?',
      capPongClosest: 'Korak {n}: {dc} odgovara: {c} je u lokaciji {site}, a {dc} također — to je najbliži DC.',
      capPongLearnt: 'Korak {n}: {dc} odgovara: {c} je u lokaciji {site}, a {dc} nije. {c} pamti svoju lokaciju.',
      capPongFar: 'Korak {n}: {dc} odgovara: {c} je u lokaciji {site}, a {dc} nije. Zapisa za {site} nema, pa {c} ostaje kod {dc}, preko WAN-a.',
      capAsReq: 'Korak {n}: {c} šalje Kerberosov AS-REQ za {u} KDC-u na {dc} (TCP 88).',
      capAsRep_join: 'Korak {n}: {dc} vraća TGT. Kerberos radi i {c} se učlanjuje u {d} preko {dc}.',
      capAsRep_logon: 'Korak {n}: {dc} vraća TGT. {u} je prijavljena preko {dc}.',
      tailWan: ' Ali sporo: {dcs} je u drugoj lokaciji, preko WAN-a.',
      tailGc: ' Zapisa _gc nema, ali ništa ovdje nije trebalo globalni katalog.',
      capNtlm: 'Korak {n}: nema nijednog zapisa KDC-a, pa Kerberos ne može početi. {c} se vraća na NTLM s {dc}.',
      capNtlmOk_join: 'Korak {n}: {dc} provjerava lozinku za {u}: učlanjenje radi, ali preko NTLM-a, bez Kerberosove karte.',
      capNtlmOk_logon: 'Korak {n}: {dc} provjerava lozinku za {u}: prijava radi, ali preko NTLM-a, bez Kerberosove karte.',

      explain: '<p>Klijent ne pronalazi kontroler domene po imenu ni slanjem upita svima u mreži: pita svoj DNS poslužitelj ' +
        'za <em lang="en">SRV record</em> (SRV zapis). Svaki DC preko servisa Netlogon upisuje svoje zapise u zonu ' +
        '<code translate="no">quillmoor.example</code> i njezinu poddomenu <code translate="no">_msdcs</code>: ' +
        '<code translate="no">_ldap._tcp.dc._msdcs</code> za bilo koji DC, ' +
        '<code translate="no">_ldap._tcp.&lt;lokacija&gt;._sites.dc._msdcs</code> za DC u lokaciji (<em lang="en">site</em>), ' +
        '<code translate="no">_kerberos._tcp…</code> za KDC, <code translate="no">_gc._tcp</code> za globalni katalog.</p>' +
        '<p><em lang="en">DC locator</em> (lociranje kontrolera domene): klijent koji zna svoju lokaciju traži njezin zapis, inače ' +
        'zapis za cijelu domenu; od ciljeva bira najniži prioritet, pa najveću težinu; zatim DC-u šalje LDAP ping, a DC mu ' +
        'kaže u kojoj je lokaciji. Bez zapisa lokacije klijent dobiva bilo koji DC, možda preko WAN-a.</p>' +
        '<p>Ne radi svaki DNS poslužitelj: javni DNS ne zna ništa o <code translate="no">_msdcs.quillmoor.example</code>, pa ' +
        'klijent člana domene mora pitati DNS koji drži zonu domene. A obrisani zapisi ne ostaju obrisani: Netlogon ih ' +
        'ponovno upisuje pri pokretanju i povremeno, svaki DC samo svoje.</p>'
    },
    en: {
      stage: 'The domain controllers\' records in DNS and the client\'s lookups',

      // records
      recsTitle: 'What the domain controllers put in DNS',
      recsNote: 'Names without .quillmoor.example; every SRV record has priority 0 and weight 100.',
      use_locator: 'DC locator',
      use_kerberos: 'Kerberos (KDC)',
      use_gc: 'global catalog (GC)',
      use_replication: 'replication between DCs',
      recPresent: 'present',
      recDeleted: 'deleted',
      recRestored: 'restored',
      recPicked: 'picked',

      // result
      resTitle: 'Result',
      resWait_join: 'PC07 is joining the domain…',
      resWait_logon: 'ana is logging on…',
      resOk_join: 'PC07 has joined the domain',
      resOk_logon: 'ana is logged on',
      resVia: 'through {dc}',
      resKdc: 'KDC {kdc}',
      resWan: 'over the WAN, slow',
      resNtlm: 'NTLM, no Kerberos ticket',
      resFail_join: 'the join failed',
      resFail_logon: 'the logon failed',
      msg_join: 'An Active Directory Domain Controller (AD DC) for the domain {d} could not be contacted.',
      msg_logon: 'We can\'t sign you in with this credential because your domain isn\'t available.',

      // lanes
      laneClient: 'client',
      dnsOnDc: 'on DC01',
      pubName: 'public DNS',
      pubTag: 'no domain zone',
      siteWord: 'site',
      siteUnknown: 'not known yet',
      dnsWord: 'DNS',
      dnsZones: 'holds both zones',

      // chart
      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteRestart: 'Netlogon restarted',
      noteNoDc: '✕ no DC',
      nRecords: ['{n} record', '{n} records'],
      pongLabel: 'reply',
      closestYes: 'closest',
      closestNo: 'not closest',

      // params
      pAction: 'What the client does',
      optJoin: 'join',
      optLogon: 'logon',
      pSite: 'Client site',
      optHq: 'HQ',
      optBranch: 'Branch',
      optUnknown: 'Branch, not known',
      pDns: 'Client DNS server',
      optDc01: 'DC01',
      optPublic: 'public',
      pLocator: 'Delete the locator records',
      pSiteRecord: 'Delete the site records',
      pKerberos: 'Delete the Kerberos records',
      pGc: 'Delete the GC records',
      pRestart: 'Restart Netlogon',

      // presets
      presetHealthy: 'Healthy join',
      presetHealthyHint: 'site record → DC01, LDAP ping, KDC, Kerberos',
      presetNoLocator: 'No locator',
      presetNoLocatorHint: 'NXDOMAIN, NXDOMAIN: no DC',
      presetNoSite: 'No site record',
      presetNoSiteHint: 'Branch without its site record: the domain-wide record → DC01 in HQ, over the WAN',
      presetPublic: 'Public DNS',
      presetPublicHint: 'every record present, NXDOMAIN all the same',
      presetFix: 'Netlogon',
      presetFixHint: 'restart on DC01, then the join',
      presetNoKerberos: 'No Kerberos',
      presetNoKerberosHint: 'no KDC: logon over NTLM',

      // legend
      legDns: 'DNS',
      legCldap: 'LDAP ping (CLDAP)',
      legKerb: 'Kerberos, NTLM',
      legPresent: 'record present',
      legDeleted: 'record deleted',
      legChanged: 'this step',

      // captions
      capStart_join: '{c} ({ip}) wants to join the domain {d}. Its DNS server is {dns}.',
      capStart_logon: '{u} logs on at {c} ({ip}), a member of {d}. Its DNS server is {dns}.',
      startSite: ' The client knows its site: {site}.',
      startUnknown: ' The client is in site Branch but does not know it yet.',
      startJoin: ' Not a member yet, it does not know its site; it is in {site}.',
      startPublic: ' That is a public DNS server, not a domain controller.',
      startDeleted: ' Deleted: {list}.',
      startRestart: ' First, Netlogon restarts on DC01.',
      capRestart: 'Step {n}: Netlogon on {dc} restarts. Every time it starts, and periodically after that, it registers its DC\'s records in DNS again.',
      capUpdate: 'Step {n}: {dc} sends its DNS server a dynamic UPDATE with all {k} of its records.',
      capUpdateOk: 'Step {n}: the DNS server accepts the update.',
      backN: [' {n} record of DC01 is back.', ' {n} records of DC01 are back.'],
      backNone: ' Nothing was missing: all of DC01\'s records were already there.',
      dc02Stays: ' DC02\'s deleted records stay deleted: its own Netlogon has not registered them again.',
      capQuerySite: 'Step {n}: the client asks for the SRV record {q}: that\'s how it finds a domain controller in its own site.',
      capQueryFallback: 'Step {n}: there is no record for the site, so {c} asks for {q}: any DC of the domain, in any site.',
      capQueryUnknown: 'Step {n}: {c} does not know its site yet, so it asks for the SRV record {q}: any DC of the domain.',
      capQueryJoin: 'Step {n}: a computer that is joining knows no site, so it asks for the SRV record {q}: any DC of the domain.',
      capQueryLearnt: 'Step {n}: {dc} is not in site {site}. {c} now asks for its own site\'s record {q}.',
      capQueryKdcSite: 'Step {n}: for Kerberos, {c} needs a KDC. It asks for {q}, the KDCs in its site.',
      capQueryKdcDomain: 'Step {n}: there is no KDC record for the site, so {c} asks for {q}, any KDC of the domain.',
      capAnswer1: 'Step {n}: the DNS server answers with one target: {t} ({ip}), port {port}.',
      capAnswer2: 'Step {n}: two targets, {list}, both with priority 0 and weight 100. A real client picks one at random; the model takes the first listed: {t}.',
      capNxDeleted: 'Step {n}: NXDOMAIN: that name does not exist, its records have been deleted.',
      capNxStay: 'Step {n}: NXDOMAIN: there is no record for {site}, so {c} stays with {dc}, across the WAN.',
      nxOnce: 'NXDOMAIN.',
      nxAgain: 'NXDOMAIN again.',
      capNxPublic: 'Step {n}: NXDOMAIN: the public DNS server {dns} has no zone {d}.',
      capFail_join: 'Step {n}: {nx} No DC found, so the join fails: “{msg}”',
      capFail_logon: 'Step {n}: {nx} No DC found, so the logon fails: “{msg}”',
      capFailPublic_join: 'Step {n}: every record exists, but the client asks the public resolver {dns}, which knows nothing about {z}, so the join fails.',
      capFailPublic_logon: 'Step {n}: every record exists, but the client asks the public resolver {dns}, which knows nothing about {z}, so the logon fails.',
      capFailPublicAny_join: 'Step {n}: the client asks the public resolver {dns}, which knows nothing about {z}, so it never reaches the records, deleted or not, and the join fails.',
      capFailPublicAny_logon: 'Step {n}: the client asks the public resolver {dns}, which knows nothing about {z}, so it never reaches the records, deleted or not, and the logon fails.',
      capPing: 'Step {n}: {c} sends {dc} an LDAP ping (CLDAP, UDP 389): are you up, and which site am I in?',
      capPongClosest: 'Step {n}: {dc} answers: {c} is in site {site}, and so is {dc}: the closest DC.',
      capPongLearnt: 'Step {n}: {dc} answers: {c} is in site {site}, {dc} is not. {c} stores its site.',
      capPongFar: 'Step {n}: {dc} answers: {c} is in site {site} and {dc} is not. There is no record for {site}, so {c} stays with {dc}, across the WAN.',
      capAsReq: 'Step {n}: {c} sends a Kerberos AS-REQ for {u} to the KDC on {dc} (TCP 88).',
      capAsRep_join: 'Step {n}: {dc} returns a TGT. Kerberos works and {c} joins {d} through {dc}.',
      capAsRep_logon: 'Step {n}: {dc} returns a TGT. {u} is logged on, through {dc}.',
      tailWan: ' Slow, though: {dcs} is in another site, across the WAN.',
      tailGc: ' The _gc records are gone too, but nothing here needed a global catalog.',
      capNtlm: 'Step {n}: there is no KDC record at all, so Kerberos cannot start. {c} falls back to NTLM with {dc}.',
      capNtlmOk_join: 'Step {n}: {dc} checks {u}\'s password: the join works, but over NTLM, without a Kerberos ticket.',
      capNtlmOk_logon: 'Step {n}: {dc} checks {u}\'s password: the logon works, but over NTLM, without a Kerberos ticket.',

      explain: '<p>A client does not find a domain controller by its name or by asking everyone on the network: it asks its ' +
        'DNS server for an SRV record. Every DC\'s Netlogon service registers its records in the zone ' +
        '<code translate="no">quillmoor.example</code> and its subdomain <code translate="no">_msdcs</code>: ' +
        '<code translate="no">_ldap._tcp.dc._msdcs</code> for any DC, ' +
        '<code translate="no">_ldap._tcp.&lt;site&gt;._sites.dc._msdcs</code> for a DC in a site, ' +
        '<code translate="no">_kerberos._tcp…</code> for a KDC, <code translate="no">_gc._tcp</code> for the global catalog.</p>' +
        '<p>The DC locator: a client that knows its site asks for that site\'s record, otherwise for the domain-wide one; it ' +
        'takes the lowest priority, then the highest weight; then it sends the DC an LDAP ping, and the DC tells it which ' +
        'site it is in. Without the site record the client gets any DC, perhaps across the WAN.</p>' +
        '<p>Not any DNS server will do: a public one knows nothing about <code translate="no">_msdcs.quillmoor.example</code>, ' +
        'so a domain member must ask a DNS server that holds the domain\'s zone. And deleted records do not stay deleted: ' +
        'Netlogon registers them again when it starts and periodically, each DC its own.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
