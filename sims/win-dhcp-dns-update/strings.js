/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dhcp-dns-update, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). [[term]] is a kit/glossary.js term.
   Terms missing from the glossary are written out (NOTES.md, "Term pairs").
   Host names, addresses, record data, accounts, message names, flags, return codes and times are data: the page
   writes them with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'DHCP upisuje zapise u DNS: zone, poslužitelj i poruke',

      // zones
      zonesTitle: 'Zone na DC1',
      zoneSecure: 'integrirane u AD, samo sigurna ažuriranja',
      fwdTitle: 'pretraživanje unaprijed',
      revTitle: 'obrnuto pretraživanje',
      colName: 'ime',
      colType: 'vrsta',
      colData: 'podatak',
      colOwner: 'vlasnik (u ACL-u)',
      colMark: 'korak',
      dhcidOf: 'sažetak {mac}',
      ownerNone: 'nitko',
      markAdded: 'novi',
      markUpdated: 'promijenjen',
      markRemoved: 'obrisan',
      markRefused: 'odbijeno',
      markTarget: 'u poruci',

      // DHCP settings
      dnsTab: 'DNS postavke',
      sameBoth: 'iste na oba',
      setMode: 'Dinamička ažuriranja',
      setDiscard: 'briši A i PTR sa zakupom',
      setLegacy: 'i za klijente koji ne traže',
      setNp: 'zaštita imena',
      setCreds: 'piše kao',
      credsComputer: 'račun računala',
      inProxy: 'u DnsUpdateProxy',
      leasesTitle: 'Zakupi',
      leaseTo: 'do {when}',
      leaseNone: 'nema zakupa',
      dayAt: 'dan {d}, {t}',

      // lanes
      osWindows: 'Windows, u domeni',
      osWorkgroup: 'Windows, izvan domene',
      osOther: 'nije Windows',
      osPrinter: 'mrežni pisač',
      noAddress: 'još nema adresu',
      opt81Yes: 'šalje opciju 81',
      opt81No: 'bez opcije 81',
      account: 'račun',
      noAccount: 'nema računa',
      roleDhcp: 'DHCP',
      roleDns: 'DNS',
      down: 'ne radi',

      // chart
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      noteDown: 'DHCP1 pada',
      noteExpire: 'zakup {ip} istekao',
      noteGaveUp: 'nema računa: odustaje',
      reDown: 'ne radi',

      // message card
      msgNone: 'Još nema poruka',
      msgTitle: 'Korak {n}',
      kDhcp: 'DHCP',
      kUpdate: 'DNS UPDATE',
      kAnswer: 'provjera na DC1',
      kEvent: 'događaj',
      offers: 'nudi',
      request: 'zahtjev',
      reply: 'odgovor',
      noOpt81: 'bez opcije 81',
      flagS0: 'S = 0: A upisuje klijent, PTR poslužitelj',
      flagS1: 'S = 1, O = 1: A i PTR upisuje poslužitelj',
      willServer: '{srv} upisuje: {list}',
      willClient: '{c} upisuje: {list}',
      willNobody: 'nitko ne upisuje ništa',
      zone: 'zona',
      condition: 'uvjet',
      condFree: 'ime {name} još ne postoji',
      condDhcid: 'DHCID imena {name} je ovog klijenta',
      condNone: 'nema',
      opAdd: 'dodaj',
      opDel: 'obriši',
      signature: 'potpis',
      sigNone: 'nema (nema računa)',
      chkZoneOk: 'postavka zone: potpisano, prima',
      chkZoneNo: 'postavka zone: samo potpisana ažuriranja',
      chkFreeNo: 'uvjet: ime {name} već postoji',
      chkFreeOk: 'uvjet: ime {name} ne postoji',
      chkDhcidOk: 'uvjet: DHCID je ovog klijenta',
      chkDhcidOther: 'uvjet: DHCID pripada drugom klijentu',
      chkDhcidNone: 'uvjet: ime nema DHCID',
      chkNew: '{name}: novo ime, vlasnik {owner}',
      chkOpen: '{name}: nema vlasnika, otvoreno',
      chkOwn: '{name}: vlasnik {owner} = pošiljatelj',
      chkNotOwn: '{name}: vlasnik {owner} ≠ pošiljatelj {sender}',
      chkSkipped: 'vlasnik se ne provjerava',
      evDown: 'DHCP1 ne radi; DHCP2 ima svoj dio opsega',
      evExpire: 'zakup {ip} istekao i obrisan',
      evDiscard: 'briše: {list}',
      evKeep: 'ostaju: {list}',
      evNothing: 'DHCP1 nije ništa upisao',

      // params
      pClient: 'Klijent',
      cWindows: 'WIN10-07 (Windows)',
      cOther: 'HOST-12 (nije Windows)',
      cPrinter: 'pisač PRN-3',
      cClash: 'prijenosnik nazvan FS1',
      pEvent: 'Što se događa',
      evLease: 'klijent dobiva zakup',
      evFailover: 'DHCP1 pada, odgovara DHCP2',
      evExpiry: 'zakup istječe',
      pMode: 'DHCP ažurira DNS',
      pLegacy: 'I za klijente koji ne traže',
      pLegacyOff: 'Samo kad su ažuriranja uključena',
      pDiscard: 'Briši zapise sa zakupom',
      pCreds: 'Vjerodajnice za registraciju',
      optOff: 'isključeno',
      optOnRequest: 'na zahtjev',
      optAlways: 'uvijek',
      credsProxy: 'račun računala u DnsUpdateProxy',
      credsDedicated: 'zajednički korisnik svc-dhcpdns',
      pNp: 'Zaštita imena',
      pNpOff: 'Samo kad su ažuriranja uključena',

      // presets
      presetWindows: 'Windows',
      presetWindowsHint: 'Opcija 81: DHCP1 upisuje PTR, klijent sam A',
      presetPrinter: 'Pisač',
      presetPrinterHint: 'Bez opcije 81 nema zapisa; uključi „I za klijente koji ne traže”',
      presetFailover: 'Drugi DHCP',
      presetFailoverHint: 'DHCP2 ne smije promijeniti zapis koji je stvorio DHCP1',
      presetExpiry: 'Istek zakupa',
      presetExpiryHint: 'DHCP1 briše A i PTR koje je upisao',
      presetNp: 'Isto ime',
      presetNpHint: 'Prijenosnik nazvan FS1: DHCID pripada drugome, odbijeno',

      // legend
      legDhcp: 'DHCP poruka',
      legSigned: 'potpisano ažuriranje',
      legServer: 'vlasnik: DHCP',
      legClient: 'vlasnik: računalo',
      legOpen: 'bez vlasnika',
      legOk: 'prihvaćeno',
      legNo: 'odbijeno',
      legChanged: 'ovaj korak',

      // captions: the start
      capStart_lease_windows: '{c} je računalo s Windowsima u domeni. Traži adresu i u zahtjevu šalje opciju 81 sa svojim imenom {fqdn}.',
      capStart_lease_other: '{c} nije računalo s Windowsima: traži adresu, ali ne šalje opciju 81, pa nikoga ne moli da upiše njegovo ime.',
      capStart_lease_printer: '{c} je mrežni pisač: ne šalje opciju 81 i nema račun računala.',
      capStart_lease_clash: 'Prijenosnik izvan domene zove se {c}, kao datotečni poslužitelj. Traži adresu i šalje opciju 81 s imenom {fqdn}, a {name} već vodi na {old}.',
      capStart_failover: '{c} je 1. dana od DHCP1 dobio {old}, a zapisi u zonama su onakvi kakvima su ih ostavile ove postavke. Sad DHCP1 pada, a {c} se ponovno pokreće.',
      capStart_expiry: '{c} je 1. dana od DHCP1 dobio {old} na 8 dana. 3. dana zauvijek napušta mrežu, a zakup ne otpušta.',
      capOffTail: ' Na DHCP poslužitelju dinamička ažuriranja DNS-a su isključena.',

      // captions: events and DHCP
      capDown: '{n}. DHCP1 pada. {c} se ponovno pokreće i adresu traži iznova.',
      capExpireDel: '{n}. {time}: zakup adrese {ip} od 8 dana istječe i DHCP1 ga briše. Uključeno je „Briši zapise sa zakupom”, pa uklanja ono što je upisao: {list}.',
      capExpireKeep: '{n}. {time}: zakup adrese {ip} istječe i DHCP1 ga briše. „Briši zapise sa zakupom” je isključeno: {list} ostaju i vode na adresu koja je opet slobodna, dok ih ne ukloni čišćenje zastarjelih zapisa.',
      capExpireNone: '{n}. {time}: zakup adrese {ip} istječe i DHCP1 ga briše. Za {c} nije upisao ništa, pa nema što brisati.',
      capDo: '{n}. {c} odašilje DISCOVER; {srv} nudi {ip}.',
      capDoFailover: '{n}. {c} odašilje DISCOVER. DHCP1 ne odgovara, ne radi; DHCP2 nudi {ip} iz svojeg dijela opsega.',
      capRaS0: '{n}. Windows klijent u opciji 81 traži da DHCP poslužitelj upiše samo PTR zapis; A zapis registrira sam. {srv} pristaje (S = 0).',
      capRaS1: '{n}. {c} šalje opciju 81 sa S = 0, ali {srv} odgovara S = 1, O = 1: postavka je „uvijek”, pa A i PTR upisuje sam, a klijent ne šalje ništa.',
      capRaNp: '{n}. {c} šalje opciju 81, a {srv} odgovara S = 1, O = 1: uz zaštitu imena (*Name Protection*) poslužitelj upisuje A i PTR za klijenta, uz zapis DHCID.',
      capRaOff: '{n}. {c} šalje opciju 81, ali ACK je bez nje: {srv} ne ažurira DNS, pa {c} sam upisuje A i PTR.',
      capRaLegacy: '{n}. {c} u zahtjevu nema opciju 81. Uključeno je „I za klijente koji ne traže”, pa {srv} za njega upisuje A i PTR.',
      capRaNone: '{n}. {c} dobiva {ip}, ali bez opcije 81 nitko ne upisuje njegovo ime: nema ga u DNS-u.',
      capRaNoneHint: ' Uključi „I za klijente koji ne traže”.',
      capRaNoneOff: '{n}. {c} dobiva {ip}. Dinamička ažuriranja na DHCP poslužitelju su isključena, a sam klijent ne upisuje ništa: imena nema u DNS-u.',

      // captions: updates
      capUpdA: '{n}. {srv} traži od DC1: {name} A {ip}. Potpisuje računom {acc}.',
      capUpdNp1: '{n}. Zaštita imena: {srv} traži da se doda {name} A {ip} i zapis DHCID (sažetak identiteta klijenta), uz uvjet da ime {name} još ne postoji.',
      capUpdNp2: '{n}. Drugi pokušaj: zamijeni {name} A s {ip}, uz uvjet da je DHCID imena {name} upravo ovog klijenta.',
      capUpdPtr: '{n}. {srv} u obrnutoj zoni traži {ptr} PTR {fqdn}. Potpisuje računom {acc}.',
      capUpdDel: '{n}. {srv} traži da se obriše {list}.',
      capUpdClient: '{n}. {c} sam upisuje svoj zapis: {rr}, potpisano računom {acc}.',
      capUpdClientUnsigned: '{n}. {c} sam upisuje {rr}, nepotpisano: nema račun računala kojim bi potpisao.',

      // captions: answers
      capOkNew: '{n}. NOERROR: {name} je novo ime, a njegov vlasnik (u ACL-u) postaje {owner}.',
      capOkNewOpen: '{n}. NOERROR: {name} je novo ime, ali bez vlasnika: {acc} je u grupi DnsUpdateProxy, pa zapis smije mijenjati bilo tko.',
      capOkOwn: '{n}. NOERROR: {name} pripada pošiljatelju {owner}, pa sad vodi na {data}.',
      capOkOpen: '{n}. NOERROR: {name} nema vlasnika (DnsUpdateProxy), pa ga smije pisati svatko; sad vodi na {data}.',
      capOkTake: ' Vlasnik postaje {owner}.',
      capHijack: '{n}. NOERROR: {name} pripada {owner}, a to je i pošiljatelj. Sad {name} vodi na prijenosnik ({data}): poslužitelj je vlasnik svih imena koja upisuje, pa ih prepisuje za svakoga tko ih zatraži.',
      capOkDel: '{n}. NOERROR: obrisano {list}. Vlasnik je {owner}, a to je i pošiljatelj, pa smije brisati.',
      capOkDelOpen: '{n}. NOERROR: obrisano {list}. Zapisi nemaju vlasnika (DnsUpdateProxy), pa ih smije brisati svatko.',
      npAsAlways: 'zaštita imena: kao „uvijek”',
      capFailoverRefused: '{n}. REFUSED. DHCP2 ne smije promijeniti {name}: zapis je stvorio DHCP1 svojim računom računala. Zato oba poslužitelja trebaju iste vjerodajnice. {name} i dalje vodi na {old}.',
      capRefusedOwner: '{n}. REFUSED: {name} pripada {owner}, a {sender} ga ne smije mijenjati. {name} i dalje vodi na {old}.',
      capGaveUp: '{n}. REFUSED: zona prima samo potpisana ažuriranja, a {c} nema račun računala. Odustaje.',
      capGaveUpKeeps: ' {name} i dalje vodi na {old}.',
      capYx: '{n}. YXDOMAIN: ime {name} već postoji. Poslužitelj pokušava ponovno, sad s uvjetom na DHCID.',
      capNxOther: '{n}. NXRRSET: DHCID imena {name} pripada drugom klijentu. Zaštita imena čuva ime: {name} i dalje vodi na {old}, a {srv} ne upisuje ni PTR za {ip}.',
      capNxNone: '{n}. NXRRSET: {name} nema DHCID, nije ga upisao DHCP poslužitelj sa zaštitom imena, pa ga poslužitelj ne dira. Ne upisuje ni PTR za {ip}.',
      capStaleTail: ' Stari PTR {ptr} ostaje: DHCP1 ne radi, pa ga nema tko obrisati.',

      explain:
        '<p><b>Tko upisuje ime.</b> Kad klijent dobije adresu, netko mora u zonu upisati njegov zapis A (ime → adresa) i ' +
        'zapis PTR (adresa → ime, u obrnutoj zoni). Računalo s Windowsima u zahtjevu šalje <i lang="en">option 81</i> ' +
        '(opcija 81, puno ime klijenta) sa zastavicom S = 0: „A upisujem sam, ti upiši PTR”. Na zadanoj postavci ' +
        '(<i lang="en">only if requested</i>) DHCP poslužitelj upisuje samo PTR; uz <i lang="en">always</i> upisuje i A. ' +
        'Pisač ili računalo bez opcije 81 ne dobiva ništa dok se ne uključi „i za klijente koji to ne traže”.</p>' +
        '<p><b>Vlasnik zapisa.</b> U zoni koja prima samo sigurna ažuriranja zapis ima [[access control list]]; vlasnik je ' +
        'račun koji ga je stvorio. Zapis koji je upisao DHCP1 pripada računu <span translate="no">DHCP1$</span>, pa drugi ' +
        'poslužitelj (<span translate="no">DHCP2$</span>) ne smije promijeniti ime kad klijent dobije novu adresu: ime ' +
        'vodi na staru. Popravak: na oba poslužitelja iste vjerodajnice za registraciju, jedan korisnik ' +
        '(<span translate="no">svc-dhcpdns</span>).</p>' +
        '<p><b>DnsUpdateProxy.</b> Zapisi koje stvori član te grupe nemaju vlasnika: smije ih mijenjati svatko, a prvi ' +
        'sljedeći koji ga upiše, a nije član grupe, postaje vlasnik. To ne štiti, to uklanja zaštitu. Ako je DHCP na kontroleru domene u toj grupi, ' +
        'nezaštićeni ostaju i zapisi samog kontrolera.</p>' +
        '<p><b>Zaštita imena</b> (<i lang="en">Name Protection</i>). Poslužitelj uz A upisuje zapis DHCID, sažetak ' +
        'identiteta klijenta. Ime koje već postoji mijenja samo ako je DHCID tog klijenta, pa prijenosnik koji se nazove ' +
        'kao poslužitelj ne preuzima njegovo ime.</p>' +
        '<p><b>Istek zakupa.</b> Uz „obriši A i PTR” poslužitelj kod brisanja zakupa uklanja zapise koje je upisao. Zapis ' +
        'A koji je klijent upisao sam ostaje do čišćenja zastarjelih zapisa.</p>' +
        '<p><b>Izvan ove stranice:</b> sigurno ažuriranje klijenta u detalje, starenje i čišćenje zapisa, mehanika ' +
        'DHCP-a s <i lang="en">failoverom</i>, DHCPv6.</p>'
    },

    en: {
      stage: 'DHCP registering DNS records: zones, server and messages',

      zonesTitle: 'Zones on DC1',
      zoneSecure: 'AD-integrated, Secure only',
      fwdTitle: 'forward',
      revTitle: 'reverse',
      colName: 'name',
      colType: 'type',
      colData: 'data',
      colOwner: 'owner (ACL)',
      colMark: 'step',
      dhcidOf: 'digest of {mac}',
      ownerNone: 'nobody',
      markAdded: 'new',
      markUpdated: 'changed',
      markRemoved: 'deleted',
      markRefused: 'refused',
      markTarget: 'in the message',

      dnsTab: 'DNS settings',
      sameBoth: 'the same on both',
      setMode: 'Dynamic updates',
      setDiscard: 'discard A and PTR with the lease',
      setLegacy: 'also clients that do not ask',
      setNp: 'Name Protection',
      setCreds: 'writes as',
      credsComputer: 'computer account',
      inProxy: 'in DnsUpdateProxy',
      leasesTitle: 'Leases',
      leaseTo: 'until {when}',
      leaseNone: 'no leases',
      dayAt: 'day {d}, {t}',

      osWindows: 'Windows, domain member',
      osWorkgroup: 'Windows, outside the domain',
      osOther: 'not Windows',
      osPrinter: 'network printer',
      noAddress: 'no address yet',
      opt81Yes: 'sends option 81',
      opt81No: 'no option 81',
      account: 'account',
      noAccount: 'no account',
      roleDhcp: 'DHCP',
      roleDns: 'DNS',
      down: 'down',

      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteDown: 'DHCP1 goes down',
      noteExpire: 'lease {ip} expired',
      noteGaveUp: 'no account: gives up',
      reDown: 'down',

      msgNone: 'No messages yet',
      msgTitle: 'Step {n}',
      kDhcp: 'DHCP',
      kUpdate: 'DNS UPDATE',
      kAnswer: 'check at DC1',
      kEvent: 'event',
      offers: 'offers',
      request: 'request',
      reply: 'reply',
      noOpt81: 'no option 81',
      flagS0: 'S = 0: the client writes A, the server PTR',
      flagS1: 'S = 1, O = 1: the server writes A and PTR',
      willServer: '{srv} writes: {list}',
      willClient: '{c} writes: {list}',
      willNobody: 'nobody writes anything',
      zone: 'zone',
      condition: 'condition',
      condFree: 'the name {name} does not exist yet',
      condDhcid: 'the DHCID of {name} is this client\'s',
      condNone: 'none',
      opAdd: 'add',
      opDel: 'delete',
      signature: 'signature',
      sigNone: 'none (no account)',
      chkZoneOk: 'zone setting: signed, takes it',
      chkZoneNo: 'zone setting: signed updates only',
      chkFreeNo: 'condition: the name {name} exists',
      chkFreeOk: 'condition: the name {name} does not exist',
      chkDhcidOk: 'condition: the DHCID is this client\'s',
      chkDhcidOther: 'condition: the DHCID is another client\'s',
      chkDhcidNone: 'condition: the name has no DHCID',
      chkNew: '{name}: new name, owner {owner}',
      chkOpen: '{name}: no owner, open',
      chkOwn: '{name}: owner {owner} = the sender',
      chkNotOwn: '{name}: owner {owner} ≠ sender {sender}',
      chkSkipped: 'owner not checked',
      evDown: 'DHCP1 is down; DHCP2 has its own part of the scope',
      evExpire: 'lease {ip} expired and deleted',
      evDiscard: 'deletes: {list}',
      evKeep: 'stay: {list}',
      evNothing: 'DHCP1 registered nothing',

      pClient: 'Client',
      cWindows: 'WIN10-07 (Windows)',
      cOther: 'HOST-12 (not Windows)',
      cPrinter: 'printer PRN-3',
      cClash: 'a laptop named FS1',
      pEvent: 'What happens',
      evLease: 'the client gets a lease',
      evFailover: 'DHCP1 down, DHCP2 answers',
      evExpiry: 'the lease expires',
      pMode: 'DHCP updates DNS',
      pLegacy: 'Also clients that do not ask',
      pLegacyOff: 'Only with updates on',
      pDiscard: 'Discard records with the lease',
      pCreds: 'Registration credentials',
      optOff: 'off',
      optOnRequest: 'on request',
      optAlways: 'always',
      credsProxy: 'computer account in DnsUpdateProxy',
      credsDedicated: 'shared user svc-dhcpdns',
      pNp: 'Name Protection',
      pNpOff: 'Only with updates on',

      presetWindows: 'Windows',
      presetWindowsHint: 'Option 81: DHCP1 writes the PTR, the client its A',
      presetPrinter: 'Printer',
      presetPrinterHint: 'No option 81, no records; switch on "Also clients that do not ask"',
      presetFailover: 'Second DHCP',
      presetFailoverHint: 'DHCP2 may not change a record DHCP1 created',
      presetExpiry: 'Lease expiry',
      presetExpiryHint: 'DHCP1 deletes the A and PTR it registered',
      presetNp: 'Name clash',
      presetNpHint: 'A laptop named FS1: the DHCID is another\'s, refused',

      legDhcp: 'DHCP message',
      legSigned: 'signed update',
      legServer: 'owner: DHCP',
      legClient: 'owner: computer',
      legOpen: 'no owner',
      legOk: 'accepted',
      legNo: 'refused',
      legChanged: 'this step',

      capStart_lease_windows: '{c} is a Windows computer in the domain. It asks for an address and sends option 81 with its name {fqdn} in the request.',
      capStart_lease_other: '{c} is not a Windows computer: it asks for an address but sends no option 81, so it asks nobody to register its name.',
      capStart_lease_printer: '{c} is a network printer: it sends no option 81 and has no computer account.',
      capStart_lease_clash: 'A laptop outside the domain is called {c}, like the file server. It asks for an address and sends option 81 with {fqdn}, while {name} already leads to {old}.',
      capStart_failover: 'On day 1 {c} got {old} from DHCP1, and the zones hold what these settings registered then. Now DHCP1 goes down and {c} restarts.',
      capStart_expiry: 'On day 1 {c} got {old} from DHCP1 for 8 days. On day 3 it leaves the network for good without releasing the lease.',
      capOffTail: ' Dynamic DNS updates are off on the DHCP server.',

      capDown: '{n}. DHCP1 goes down. {c} restarts and asks for an address from scratch.',
      capExpireDel: '{n}. {time}: the 8-day lease of {ip} expires and DHCP1 deletes it. "Discard records with the lease" is on, so it now removes what it registered: {list}.',
      capExpireKeep: '{n}. {time}: the lease of {ip} expires and DHCP1 deletes it. "Discard records with the lease" is off: {list} stay, leading to an address that is free again, until scavenging removes them.',
      capExpireNone: '{n}. {time}: the lease of {ip} expires and DHCP1 deletes it. It registered nothing for {c}, so there is nothing to remove.',
      capDo: '{n}. {c} broadcasts DISCOVER; {srv} offers {ip}.',
      capDoFailover: '{n}. {c} broadcasts DISCOVER. DHCP1 does not answer, it is down; DHCP2 offers {ip} from its own part of the scope.',
      capRaS0: '{n}. The Windows client uses option 81 to ask the DHCP server to register only the PTR record; it registers the A record itself. {srv} agrees (S = 0).',
      capRaS1: '{n}. {c} sends option 81 with S = 0, but {srv} answers S = 1, O = 1: the setting is "always", so it writes A and PTR itself and the client sends nothing.',
      capRaNp: '{n}. {c} sends option 81 and {srv} answers S = 1, O = 1: with Name Protection the server registers A and PTR for the client, with a DHCID record.',
      capRaOff: '{n}. {c} sends option 81, but the ACK has none: {srv} does not update DNS, so {c} registers A and PTR itself.',
      capRaLegacy: '{n}. {c} has no option 81 in its request. "Also clients that do not ask" is on, so {srv} registers A and PTR for it.',
      capRaNone: '{n}. {c} gets {ip}, but without option 81 nobody registers its name: it is not in DNS.',
      capRaNoneHint: ' Switch on "Also clients that do not ask".',
      capRaNoneOff: '{n}. {c} gets {ip}. Dynamic updates are off on the DHCP server, and the client itself registers nothing: the name is not in DNS.',

      capUpdA: '{n}. {srv} asks DC1 for {name} A {ip}, signed with its account {acc}.',
      capUpdNp1: '{n}. Name Protection: {srv} asks to add {name} A {ip} and a DHCID record (a digest of the client\'s identity), on condition that the name {name} does not exist yet.',
      capUpdNp2: '{n}. Second try: replace {name} A with {ip}, on condition that the DHCID of {name} is this very client\'s.',
      capUpdPtr: '{n}. {srv} asks for {ptr} PTR {fqdn} in the reverse zone, signed with {acc}.',
      capUpdDel: '{n}. {srv} asks to delete {list}.',
      capUpdClient: '{n}. {c} registers its own record: {rr}, signed with {acc}.',
      capUpdClientUnsigned: '{n}. {c} registers {rr} itself, unsigned: it has no computer account to sign with.',

      capOkNew: '{n}. NOERROR: {name} is a new name, and its owner (on the ACL) becomes {owner}.',
      capOkNewOpen: '{n}. NOERROR: {name} is a new name, but it has no owner: {acc} is in DnsUpdateProxy, so anyone may change the record.',
      capOkOwn: '{n}. NOERROR: {name} belongs to the sender {owner}, so it now leads to {data}.',
      capOkOpen: '{n}. NOERROR: {name} has no owner (DnsUpdateProxy), so anyone may write it; it now leads to {data}.',
      capOkTake: ' Its owner becomes {owner}.',
      capHijack: '{n}. NOERROR: {name} belongs to {owner}, which is also the sender. Now {name} leads to the laptop ({data}): the server owns every name it registers, so it rewrites any of them for whoever asks.',
      capOkDel: '{n}. NOERROR: {list} deleted. The owner is {owner}, which is also the sender, so it may delete.',
      capOkDelOpen: '{n}. NOERROR: {list} deleted. The records have no owner (DnsUpdateProxy), so anyone may delete them.',
      npAsAlways: 'Name Protection: as "always"',
      capFailoverRefused: '{n}. REFUSED. DHCP2 may not change {name}: DHCP1 created it with its computer account. That\'s why both servers need the same credentials. {name} still leads to {old}.',
      capRefusedOwner: '{n}. REFUSED: {name} belongs to {owner}, and {sender} may not change it. {name} still leads to {old}.',
      capGaveUp: '{n}. REFUSED: the zone takes signed updates only, and {c} has no computer account. It gives up.',
      capGaveUpKeeps: ' {name} still leads to {old}.',
      capYx: '{n}. YXDOMAIN: the name {name} already exists. The server tries again, now on condition of the DHCID.',
      capNxOther: '{n}. NXRRSET: the DHCID of {name} belongs to another client. Name Protection keeps the name: {name} still leads to {old}, and {srv} writes no PTR for {ip} either.',
      capNxNone: '{n}. NXRRSET: {name} has no DHCID, so no DHCP server with Name Protection registered it, and the server leaves it alone. It writes no PTR for {ip} either.',
      capStaleTail: ' The old PTR {ptr} stays: DHCP1 is down, so nobody deletes it.',

      explain:
        '<p><b>Who registers the name.</b> When a client gets an address, someone has to write its A record (name → ' +
        'address) and its PTR record (address → name, in the reverse zone). A Windows computer sends option 81 (Client ' +
        'FQDN) with the S flag 0: "I write the A myself, you write the PTR". Under the default (only if requested) the ' +
        'DHCP server writes the PTR only; under always it writes the A too. A printer or a host without option 81 gets ' +
        'nothing until "also for clients that do not request updates" is on.</p>' +
        '<p><b>The record\'s owner.</b> In a Secure only zone a record has an [[access control list]]; its owner is the ' +
        'account that created it. A record DHCP1 wrote belongs to <span translate="no">DHCP1$</span>, so a second server ' +
        '(<span translate="no">DHCP2$</span>) may not change the name when the client gets a new address: the name ' +
        'leads to the old one. The fix: the same registration credentials on both servers, one user ' +
        '(<span translate="no">svc-dhcpdns</span>).</p>' +
        '<p><b>DnsUpdateProxy.</b> Records created by a member of this group have no owner: anyone may change them, and ' +
        'the next other writer becomes the owner. It does not secure anything; it removes the protection. If DHCP runs on ' +
        'a domain controller in this group, even the controller\'s own records are left unsecured.</p>' +
        '<p><b>Name Protection.</b> Next to the A the server writes a DHCID record, a digest of the client\'s identity. It ' +
        'changes a name that exists only if the DHCID is that client\'s, so a laptop that calls itself after a server does ' +
        'not take the server\'s name.</p>' +
        '<p><b>Lease expiry.</b> With "discard A and PTR" the server removes the records it wrote when the lease is ' +
        'deleted. An A record the client wrote itself stays until stale records are scavenged.</p>' +
        '<p><b>Not on this page:</b> the client\'s own secure update in detail, aging and scavenging, DHCP failover ' +
        'mechanics, DHCPv6.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
