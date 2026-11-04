/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-ipam-audit, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   *word* is an English term in italics (the Croatian term rule, COMMON.md §4). Addresses, MACs, host names, user
   names, times and event IDs are data and are passed in as placeholders.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Revizijski trag: dodjele, prijave i DNS',
      hidden: 'Skup dokaza',
      pAt: 'Vrijeme u pitanju',
      pDays: 'Pitanje postavljeno nakon (dana)',
      pIpam: 'IPAM prikuplja događaje',
      pIpamHint: 'IPAM kopira događaje s DHCP poslužitelja i DC-ova prije nego što ih oni prebrišu.',
      prOne: 'Jedan korisnik',
      prOneHint: 'PC-LAB07, prijavljena ana: cijeli lanac nađen.',
      prReused: 'Adresa ponovno dodijeljena',
      prReusedHint: 'Dva pitanja: 14:32 pa 09:10, ista adresa, dva uređaja.',
      prTwo: 'Dva korisnika',
      prTwoHint: 'Trag daje stroj, ne osobu.',
      prOld: 'Prestaro pitanje',
      prOldHint: '9 dana kasnije, bez IPAM-a: zapisnici su prebrisani.',
      prDns: 'Zamka DNS-a',
      prDnsHint: 'DNS sada pokazuje drugo računalo.',
      legendT: 'vrijeme u pitanju',
      legendUsed: 'dokaz koji lanac koristi',
      legendLinks: '✓ nađeno · ✕ nema · ≈ dvosmisleno',
      legendChanged: 'promijenjeno u ovom koraku',

      wd0: 'pon',
      wd1: 'uto',
      wd2: 'sri',
      wd3: 'čet',
      wd4: 'pet',
      wd5: 'sub',
      wd6: 'ned',
      mon9: '9',
      mon10: '10',
      date: '{wd} {d}. {m}.',
      qTitle: 'Tko je imao {ip} u ponedjeljak 28. 9. u {at}?',
      qNo: 'Pitanje {i} od {of}',
      qAsked: 'Pitamo: {date}',
      qSameDay: 'isti dan, nakon 18:00',
      qLater: ['{n} dan kasnije', '{n} dana kasnije', '{n} dana kasnije'],
      qPrior: 'Prvo pitanje, {at}: {answer}',
      srcDhcp: 'Zapisnik DHCP1',
      srcDc: 'Sigurnosni zapisnici DC1, DC2',
      srcIpam: 'IPAM',
      keepDays: ['čuva {n} dan', 'čuva {n} dana', 'čuva {n} dana'],
      keepDc: 'čuva oko {n} dana (puni se)',
      keepIpam: 'čuva do brisanja',
      srcOk: 'ima',
      srcGone: 'prebrisano',
      srcOff: 'isključen',
      dnsTitle: 'DNS sada',
      dnsNote: 'tko ima ime sada; nije dokaz za {at}',

      tlLeases: 'Dodjele',
      tlLogons: 'Prijave',
      tlGone: 'prebrisano',
      tlFree: 'slobodno',

      leaseTitle: 'Događaji dodjele za {ip}, čitani unatrag od {at}',
      logonTitle: 'Prijave s adrese {ip}',
      viaDhcp: 'iz revizijskog zapisnika DHCP1',
      viaIpam: 'iz IPAM-a (prikupljeno s DHCP1)',
      viaDc: 'iz sigurnosnih zapisnika DC-ova',
      viaIpamDc: 'iz IPAM-a (prikupljeno s DC1 i DC2)',
      colTime: 'Vrijeme',
      colEvent: 'Događaj',
      colMac: 'MAC (oznaka klijenta)',
      colHost: 'Ime (od klijenta)',
      colUser: 'Korisnik',
      colAddr: 'Adresa klijenta',
      colDc: 'DC',
      colMark: 'Za {at}',
      evNew: 'nova',
      evRenew: 'obnova',
      evRelease: 'otpuštanje',
      evExpire: 'istek',
      evTgt: 'TGT',
      evLogoff: 'odjava',
      noHost: '(bez imena)',
      wSkip: 'ne čita se',
      wHit: 'u dodjeli',
      wWin: 'kandidat',
      wBeaten: 'odjavljen',
      tagAfter: 'poslije {at}',
      tagBefore: 'prije dodjele ({t})',
      tagStart: 'početak dodjele',
      tagLogoff: 'odjava',
      impLease: 'nema događaja u {at} ili prije',
      impLeaseGone: 'DhcpSrvLog-Mon.log prebrisan {date}',
      impLogon: 'nema prijave unutar dodjele',
      impLogonGone: 'događaji prebrisani (zapisnik pun)',
      impLogonNoLease: 'bez dodjele nema vremenskog okvira',
      outLease: 'dodjela',
      outFree: 'slobodna',
      outNone: 'nema dodjele',
      outGone: 'nema zapisa',
      outCand: 'kandidat',
      outNoUser: 'nema korisnika',

      chainTitle: 'Lanac',
      lnLease: 'Dodjela u {at}',
      lnDevice: 'Uređaj',
      lnLogons: 'Prijave u dodjeli',
      lnLogoffs: 'Još prijavljeni',
      lnAnswer: 'Odgovor',
      lnPending: '?',
      evLease: '{t} {ev}',
      evFree: '{t} {ev}: slobodna',
      evNone: 'ništa prije {at}',
      evGone: 'prebrisano',
      evNoLease: 'nema dodjele',
      evSince: 'od {t}',
      evUsers: ['{n} prijava', '{n} prijave', '{n} prijava'],
      evNoLogon: 'nijedna',
      evCands: ['{n} kandidat', '{n} kandidata', '{n} kandidata'],
      ansNobody: 'nitko',
      ansUnknown: 'ne zna se',
      ansUserUnknown: 'korisnik nepoznat',

      capStart: 'Pitanje: tko je imao {ip} u {at}? Odgovor se slaže iz traga, jedna karika lanca po koraku: adresa → dodjela → uređaj → prijave → korisnik.',
      capNextQ: 'Ista adresa, drugo vrijeme: tko ju je imao u {at}?',
      capLeaseNew: 'Korak {n}: u {at} adresu {ip} drži *lease* (dodjela) iz {t} — {host}.',
      capLeaseRenew: 'Korak {n}: u {at} adresu {ip} drži *lease* (dodjela) uređaja {host}, posljednji put obnovljena u {t}.',
      capEarlierMorning: 'Jutarnja dodjela za {host} oslobođena je u {t}.',
      capEarlier: 'Ranija dodjela za {host} završila je u {t}.',
      capLater: ['Događaj poslije {at} ne vrijedi za pitanje.', 'Događaji poslije {at} ne vrijede za pitanje.', 'Događaji poslije {at} ne vrijede za pitanje.'],
      capFree: 'Korak {n}: čitamo unatrag od {at}. Prvi događaj je u {t} ({ev}): u {at} adresu nije imao nitko.',
      capNone: 'Korak {n}: zapisnik nema nijedan događaj za {ip} u {at} ili prije, pa ne znamo tko ju je imao.',
      capGone: 'Korak {n}: DHCP1 piše jednu datoteku po danu u tjednu i istu prepisuje tjedan kasnije. Ponedjeljkova je prebrisana {date}, a IPAM ništa nije prikupio.',
      capIpamHas: 'Datoteka na DHCP1 je prebrisana, ali IPAM je događaje prikupio na vrijeme.',
      capDevice: 'Korak {n}: uređaj prepoznajemo po MAC adresi {mac} (oznaka klijenta). Ime {host} poslao je klijent sam, pa može biti krivo. Dodjela traje od {start}.',
      capDeviceNoHost: 'Korak {n}: uređaj prepoznajemo po MAC adresi {mac} (oznaka klijenta). Klijent nije poslao ime. Dodjela traje od {start}.',
      capNoDevice: 'Korak {n}: bez dodjele nema ni MAC adrese ni imena uređaja.',
      capLogons: 'Korak {n}: prijava (zahtjev za TGT, događaj 4768) bilježi korisnika i adresu klijenta. Od {start} do {at} s {ip}: {list}.',
      capLogonBefore: 'Prijava korisnika {user} u {t} je prije te dodjele: pripada ranijoj dodjeli.',
      capLogonAfter: 'Prijava korisnika {user} u {t} je poslije {at}.',
      capLogonsNone: 'Korak {n}: od {start} do {at} nema nijedne prijave s {ip}. Uređaj znamo, korisnika ne.',
      capLogonsGone: 'Korak {n}: sigurnosni zapisnici DC-ova čuvaju ovdje oko {d} dana i ti su događaji prebrisani. Uređaj znamo, korisnika ne.',
      capLogonsNoLease: 'Korak {n}: bez dodjele nema vremenskog okvira, pa prijave s te adrese ne vežemo ni uz koga.',
      capOffOne: 'Korak {n}: u tragu nema odjave prije {at}, pa {user} ostaje. DC bilježi zahtjev za kartom, ne i odjavu.',
      capOffMany: ['Korak {s}: u tragu nema odjave prije {at}: ostaje {n} kandidat. DC bilježi zahtjev za kartom, ne i odjavu.', 'Korak {s}: u tragu nema odjave prije {at}: ostaju {n} kandidata. DC bilježi zahtjev za kartom, ne i odjavu.', 'Korak {s}: u tragu nema odjave prije {at}: ostaje {n} kandidata. DC bilježi zahtjev za kartom, ne i odjavu.'],
      capOffDropped: 'Korak {n}: odjava prije {at} uklanja: {gone}. Ostaje: {left}.',
      capOffMissing: 'Korak {n}: nema prijava, pa nema ni odjava za provjeru.',
      capOffGone: 'Korak {n}: prijave su prebrisane, pa nema što provjeriti.',
      capOffNoLease: 'Korak {n}: nema dodjele, pa nema ni prijava za provjeru.',
      capAnswerOne: 'Korak {n}: odgovor. U {at} adresu {ip} imao je {host} ({mac}), a na njemu je bio prijavljen korisnik {user}.',
      capAnswerMany: ['Korak {s}: {n} korisnik prijavio se s istog računala prije {at}. Trag dodjela daje stroj, ne osobu.', 'Korak {s}: {n} korisnika prijavila su se s istog računala prije {at}. Trag dodjela daje stroj, ne osobu.', 'Korak {s}: {n} korisnika prijavilo se s istog računala prije {at}. Trag dodjela daje stroj, ne osobu.'],
      capAnswerManyWhy: 'Za osobu trebaju zapisnici prijava samog računala.',
      capAnswerDevice: 'Korak {n}: odgovor je samo uređaj: {host} ({mac}). Korisnik se iz traga ne vidi.',
      capAnswerFree: 'Korak {n}: odgovor: nitko. U {at} adresa {ip} nije bila dodijeljena.',
      capAnswerNone: 'Korak {n}: nema odgovora: zapisnik nema događaja za {ip} u {at} ili prije.',
      capAnswerGone: 'Korak {n}: nema odgovora. Pitanje je starije od *retention* (razdoblja čuvanja) svakog izvora: DHCP1 čuva tjedan dana, DC-ovi oko {d} dana, a IPAM nije prikupljao.',
      capDnsTrap: 'DNS sada kaže {dns}: to je tko ima ime sada, a ne tko je imao adresu u {at}.',
      capCompare: 'Ista adresa, drugi uređaj: u {at} bio je to {host}.',
      capSame: 'U {at} adresu je imao isti uređaj, {host}.',

      explain:
        '<p><b>Pitanje iz incidenta:</b> tko je imao <span translate="no">10.0.40.57</span> u ponedjeljak u 14:32? IP adresa nije osoba ' +
        'ni računalo: u jednom danu istu adresu mogu imati različiti uređaji. Odgovor se slaže iz <em lang="en">audit log</em> ' +
        '(revizijski zapisnik) zapisa, korak po korak.</p>' +
        '<ol><li><b><em lang="en">Lease</em> (dodjela) u to vrijeme.</b> Zapisnik DHCP poslužitelja čita se unatrag od traženog ' +
        'vremena. Prvi događaj u to vrijeme ili prije odlučuje: nova dodjela (ID 10) ili obnova (11) znači da adresu drži taj uređaj; ' +
        'otpuštanje (12) ili istek znači da je adresa bila slobodna. Događaj točno u traženoj minuti računa se kao prije nje.</li>' +
        '<li><b>Uređaj.</b> MAC adresa (oznaka klijenta) prepoznaje uređaj. Ime uređaja u dodjeli poslao je sam klijent, pa može ' +
        'biti krivo ili prazno.</li>' +
        '<li><b>Prijave.</b> Kad se korisnik prijavi u domenu, DC zabilježi zahtjev za kartom (TGT, sigurnosni događaj 4768) s ' +
        'korisnikom i adresom klijenta. Prijava veže korisnika uz adresu samo dok traje dodjela tog uređaja: jutarnja prijava ' +
        'prethodnog vlasnika adrese ne vrijedi.</li>' +
        '<li><b>Još prijavljeni.</b> Odjava prije traženog vremena uklanja korisnika. DC odjavu s radne stanice ne bilježi, pa ' +
        'dvije prijave s istog računala daju dva kandidata. Trag daje stroj, ne osobu; za osobu trebaju zapisi samog računala.</li>' +
        '<li><b>Odgovor</b> ili razlog zašto ga nema.</li></ol>' +
        '<p><b>Zapisi ne traju zauvijek.</b> DHCP poslužitelj piše jednu datoteku po danu u tjednu i tjedan kasnije je prepisuje. ' +
        'Sigurnosni zapisnik DC-a ima ograničenu veličinu i prepisuje najstarije događaje (ovdje oko 3 dana). IPAM prikuplja ' +
        'događaje dodjele s DHCP poslužitelja i događaje prijave s DC-ova i NPS poslužitelja i čuva ih dok ih administrator ne ' +
        'obriše. Pitanje starije od razdoblja čuvanja svakog izvora nema odgovora.</p>' +
        '<p><b>DNS nije dokaz.</b> Zapis u DNS-u pokazuje tko ima ime <i>sada</i>, a ne tko je imao adresu tada.</p>' +
        '<p><b>Izvan opsega:</b> NAT i posrednici, VPN adrese, razlike satova među poslužiteljima, detalji bežičnih prijava preko ' +
        'NPS-a i pravno postupanje s dokazima.</p>'
    },
    en: {
      stage: 'Audit trail: leases, logons and DNS',
      hidden: 'Evidence set',
      pAt: 'Time asked about',
      pDays: 'Question asked after (days)',
      pIpam: 'IPAM collects events',
      pIpamHint: 'IPAM copies events from the DHCP server and the DCs before they overwrite them.',
      prOne: 'One user',
      prOneHint: 'PC-LAB07, ana logged on: the whole chain is found.',
      prReused: 'Address reused',
      prReusedHint: 'Two questions: 14:32, then 09:10; one address, two devices.',
      prTwo: 'Two users',
      prTwoHint: 'The trail gives the machine, not the person.',
      prOld: 'Question too old',
      prOldHint: '9 days later, no IPAM: the logs were overwritten.',
      prDns: 'DNS trap',
      prDnsHint: 'DNS now shows another computer.',
      legendT: 'time asked about',
      legendUsed: 'evidence the chain uses',
      legendLinks: '✓ found · ✕ missing · ≈ ambiguous',
      legendChanged: 'changed in this step',

      wd0: 'Mon',
      wd1: 'Tue',
      wd2: 'Wed',
      wd3: 'Thu',
      wd4: 'Fri',
      wd5: 'Sat',
      wd6: 'Sun',
      mon9: 'Sep',
      mon10: 'Oct',
      date: '{wd} {d} {m}',
      qTitle: 'Who had {ip} on Monday 28 Sep at {at}?',
      qNo: 'Question {i} of {of}',
      qAsked: 'Asked: {date}',
      qSameDay: 'the same day, after 18:00',
      qLater: ['{n} day later', '{n} days later'],
      qPrior: 'First question, {at}: {answer}',
      srcDhcp: 'DHCP1 audit log',
      srcDc: 'DC1, DC2 Security logs',
      srcIpam: 'IPAM',
      keepDays: ['keeps {n} day', 'keeps {n} days'],
      keepDc: 'keeps about {n} days (fills up)',
      keepIpam: 'keeps until purged',
      srcOk: 'has it',
      srcGone: 'overwritten',
      srcOff: 'off',
      dnsTitle: 'DNS now',
      dnsNote: 'who has the name now; not evidence for {at}',

      tlLeases: 'Leases',
      tlLogons: 'Logons',
      tlGone: 'overwritten',
      tlFree: 'free',

      leaseTitle: 'Lease events for {ip}, read back from {at}',
      logonTitle: 'Logons from {ip}',
      viaDhcp: 'from DHCP1\'s audit log',
      viaIpam: 'from IPAM (collected from DHCP1)',
      viaDc: 'from the DCs\' Security logs',
      viaIpamDc: 'from IPAM (collected from DC1 and DC2)',
      colTime: 'Time',
      colEvent: 'Event',
      colMac: 'MAC (client ID)',
      colHost: 'Name (from client)',
      colUser: 'User',
      colAddr: 'Client address',
      colDc: 'DC',
      colMark: 'For {at}',
      evNew: 'new',
      evRenew: 'renew',
      evRelease: 'release',
      evExpire: 'expiry',
      evTgt: 'TGT',
      evLogoff: 'logoff',
      noHost: '(no name)',
      wSkip: 'not read',
      wHit: 'in the lease',
      wWin: 'candidate',
      wBeaten: 'logged off',
      tagAfter: 'after {at}',
      tagBefore: 'before the lease ({t})',
      tagStart: 'lease start',
      tagLogoff: 'logoff',
      impLease: 'no event at or before {at}',
      impLeaseGone: 'DhcpSrvLog-Mon.log overwritten {date}',
      impLogon: 'no logon inside the lease',
      impLogonGone: 'events overwritten (log full)',
      impLogonNoLease: 'no lease, so no time window',
      outLease: 'lease',
      outFree: 'free',
      outNone: 'no lease',
      outGone: 'no record',
      outCand: 'candidate',
      outNoUser: 'no user',

      chainTitle: 'Chain',
      lnLease: 'Lease at {at}',
      lnDevice: 'Device',
      lnLogons: 'Logons in the lease',
      lnLogoffs: 'Still logged on',
      lnAnswer: 'Answer',
      lnPending: '?',
      evLease: '{t} {ev}',
      evFree: '{t} {ev}: free',
      evNone: 'nothing before {at}',
      evGone: 'overwritten',
      evNoLease: 'no lease',
      evSince: 'since {t}',
      evUsers: ['{n} logon', '{n} logons'],
      evNoLogon: 'none',
      evCands: ['{n} candidate', '{n} candidates'],
      ansNobody: 'nobody',
      ansUnknown: 'unknown',
      ansUserUnknown: 'user unknown',

      capStart: 'The question: who had {ip} at {at}? The answer is built from the trail, one link of the chain per step: address → lease → device → logons → user.',
      capNextQ: 'The same address at another time: who had it at {at}?',
      capLeaseNew: 'Step {n}: at {at} the address {ip} is held by the {t} lease, {host}.',
      capLeaseRenew: 'Step {n}: at {at} the address {ip} is held by {host}\'s lease, last renewed at {t}.',
      capEarlierMorning: 'The morning lease for {host} was released at {t}.',
      capEarlier: 'The earlier lease for {host} ended at {t}.',
      capLater: ['The event after {at} does not count for the question.', 'The events after {at} do not count for the question.'],
      capFree: 'Step {n}: reading back from {at}, the first event is at {t} ({ev}): at {at} nobody had the address.',
      capNone: 'Step {n}: the log has no event for {ip} at or before {at}, so we cannot tell who had it.',
      capGone: 'Step {n}: DHCP1 writes one file per weekday and starts the same file again a week later. Monday\'s file was overwritten {date}, and IPAM collected nothing.',
      capIpamHas: 'The file on DHCP1 was overwritten, but IPAM collected the events in time.',
      capDevice: 'Step {n}: the device is known by its MAC address {mac} (the client ID). The name {host} is what the client sent, so it may be wrong. The lease runs from {start}.',
      capDeviceNoHost: 'Step {n}: the device is known by its MAC address {mac} (the client ID). The client sent no name. The lease runs from {start}.',
      capNoDevice: 'Step {n}: no lease, so no MAC address and no device name.',
      capLogons: 'Step {n}: a logon (a TGT request, event 4768) records the user and the client address. From {start} to {at}, logons from {ip}: {list}.',
      capLogonBefore: '{user}\'s logon at {t} is before this lease: it belongs to an earlier lease.',
      capLogonAfter: '{user}\'s logon at {t} is after {at}.',
      capLogonsNone: 'Step {n}: from {start} to {at} there is no logon from {ip}. We know the device, not the user.',
      capLogonsGone: 'Step {n}: the DCs\' Security logs keep about {d} days here, and these events were overwritten. We know the device, not the user.',
      capLogonsNoLease: 'Step {n}: without a lease there is no time window, so logons from the address are tied to nobody.',
      capOffOne: 'Step {n}: the trail has no logoff before {at}, so {user} stays. A DC records the ticket request, not the logoff.',
      capOffMany: ['Step {s}: the trail has no logoff before {at}: {n} candidate stays. A DC records the ticket request, not the logoff.', 'Step {s}: the trail has no logoff before {at}: {n} candidates stay. A DC records the ticket request, not the logoff.'],
      capOffDropped: 'Step {n}: a logoff before {at} removes: {gone}. Left: {left}.',
      capOffMissing: 'Step {n}: no logons, so no logoffs to check.',
      capOffGone: 'Step {n}: the logons were overwritten, so there is nothing to check.',
      capOffNoLease: 'Step {n}: no lease, so no logons to check.',
      capAnswerOne: 'Step {n}: the answer. At {at} the address {ip} was held by {host} ({mac}), with {user} logged on.',
      capAnswerMany: ['Step {s}: {n} user logged on from the same computer before {at}. The lease trail gives the machine, not the person.', 'Step {s}: {n} users logged on from the same computer before {at}. The lease trail gives the machine, not the person.'],
      capAnswerManyWhy: 'To tell which person, you need the computer\'s own logon records.',
      capAnswerDevice: 'Step {n}: the answer is the device only: {host} ({mac}). The user does not show in the trail.',
      capAnswerFree: 'Step {n}: the answer: nobody. At {at} the address {ip} was not leased.',
      capAnswerNone: 'Step {n}: no answer: the log has no event for {ip} at or before {at}.',
      capAnswerGone: 'Step {n}: no answer. The question is older than every source\'s retention: DHCP1 keeps a week, the DCs about {d} days, and IPAM was not collecting.',
      capDnsTrap: 'DNS now says {dns}: that is who has the name now, not who had the address at {at}.',
      capCompare: 'The same address, another device: at {at} it was {host}.',
      capSame: 'At {at} the same device, {host}, had the address.',

      explain:
        '<p><b>An incident question:</b> who had <span translate="no">10.0.40.57</span> on Monday at 14:32? An IP address is not a ' +
        'person or a computer: in one day several devices can hold the same address. The answer is put together from the ' +
        '<em lang="en">audit log</em> records, one step at a time.</p>' +
        '<ol><li><b>The lease at that time.</b> The DHCP server\'s log is read back from the time asked about. The first event at ' +
        'or before it decides: a new lease (ID 10) or a renewal (11) means that device holds the address; a release (12) or an ' +
        'expiry means the address was free. An event in exactly that minute counts as before it.</li>' +
        '<li><b>The device.</b> The MAC address (client ID) identifies the device. The host name in the lease is what the client ' +
        'sent, so it may be wrong or empty.</li>' +
        '<li><b>Logons.</b> When a user logs on to the domain, the DC records a ticket request (TGT, Security event 4768) with the ' +
        'user and the client address. A logon ties a user to the address only during that device\'s lease: the morning logon of ' +
        'the address\'s previous holder does not count.</li>' +
        '<li><b>Still logged on.</b> A logoff before the time removes a user. A DC does not record a workstation\'s logoff, so two ' +
        'logons from one computer give two candidates. The trail gives the machine, not the person; the person needs the ' +
        'computer\'s own records.</li>' +
        '<li><b>The answer</b>, or why there is none.</li></ol>' +
        '<p><b>Logs do not last.</b> The DHCP server writes one file per weekday and starts it again a week later. A DC\'s Security ' +
        'log has a size limit and overwrites the oldest events (about 3 days here). IPAM collects lease events from the DHCP ' +
        'servers and logon events from the DCs and NPS servers, and keeps them until an administrator purges them. A question ' +
        'older than every source\'s retention has no answer.</p>' +
        '<p><b>DNS is not evidence.</b> A DNS record shows who has the name <i>now</i>, not who had the address then.</p>' +
        '<p><b>Out of scope:</b> NAT and proxies, VPN address pools, clock differences between servers, wireless logons through ' +
        'NPS in detail, and the legal handling of evidence.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
