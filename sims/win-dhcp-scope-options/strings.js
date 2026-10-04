/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dhcp-scope-options, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   *text* in a caption or label is an English term, set in italics by the page (the Croatian term rule, COMMON.md §4).
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Poslužitelj DHCP i klijent',

      // params
      client: 'Klijent',
      nameLaptop: 'prijenosnik',
      namePrinter: 'pisač',
      namePhone: 'telefon VoIP',
      scope006: 'Opcija 006 na opsegu',
      resOption003: 'Opcija 003 na rezervaciji',
      exclusion: 'Raspon isključenja',
      classNtp: 'Klasna opcija 042',
      focus: 'Opcija u tablici',
      renew: 'Obnovi zakup',
      renewHint: 'Klijenti odmah obnavljaju zakup, kao da je nastupio T1.',
      held: 'Stanje zadnje obnove',

      // presets
      presetServerScope: 'Poslužitelj i opseg',
      presetServerScopeHint: 'Prijenosnik: 003 s opsega, 006 i 015 s poslužitelja.',
      presetScopeOverrides: 'Opseg nadjačava',
      presetScopeOverridesHint: 'DNS na opsegu pobjeđuje DNS na poslužitelju.',
      presetReservation: 'Rezervacija',
      presetReservationHint: 'Pisač: uvijek 10.0.10.40, a 003 s rezervacije pobjeđuje.',
      presetClassOption: 'Klasna opcija',
      presetClassOptionHint: 'Telefon šalje klasu VoIP-Phone i dobiva 042.',
      presetChangeNeedsRenew: 'Promjena čeka obnovu',
      presetChangeNeedsRenewHint: 'Novi DNS je postavljen, ali ga klijent dobiva tek kad obnovi zakup.',

      // legend
      legWin: 'pobjeđuje',
      legBeaten: 'nadjačana',
      legNo: 'ne vrijedi za klijenta',
      legStale: 'klijent još ima staro',
      legChanged: 'promijenjeno zadnjom postavkom',

      // levels
      lvl_server: 'poslužitelj',
      lvl_serverClass: 'klasa na poslužitelju',
      lvl_scope: '*scope*',
      lvl_scopeClass: 'klasa na *scope*-u',
      lvl_reservation: 'rezervacija',
      at_server: 'na poslužitelju',
      at_serverClass: 'kao klasna opcija poslužitelja',
      at_scope: 'na *scope*-u',
      at_scopeClass: 'kao klasna opcija *scope*-a',
      at_reservation: 'na rezervaciji',
      win_server: 'razina poslužitelja',
      win_serverClass: 'klasna opcija poslužitelja',
      win_scope: 'razina *scope*',
      win_scopeClass: 'klasna opcija *scope*-a',
      win_reservation: 'rezervacija',

      // options
      opt003: 'Usmjernik',
      opt006: 'Poslužitelji imena',
      opt015: 'Ime domene DNS',
      opt042: 'Poslužitelji NTP',
      opt051: 'Trajanje zakupa',
      days: ['{n} dan', '{n} dana', '{n} dana'],

      // server boxes
      boxServer: 'Opcije poslužitelja',
      boxScope: '*Scope* (opseg adresa) {subnet}',
      boxReservations: 'Rezervacije',
      boxReservation: '{name} · {mac} → {ip}',
      range: 'Raspon',
      exclusionRow: 'Isključeno',
      noExclusion: 'nema isključenja',
      leaseRow: 'Zakup',
      leasedRow: 'Zauzeto',
      nextFree: 'Sljedeća slobodna',
      poolEmpty: 'nema slobodnih',
      classTag: 'klasa {cls}',
      noOptions: 'nema opcija',

      // client card
      clientTitle: 'Klijent: {name}',
      mac: 'MAC',
      vendorClass: 'Klasa proizvođača (60)',
      noClass: 'ne šalje',
      address: 'Adresa',
      reservedTag: 'rezervirana',
      dynamicTag: 'iz raspona',

      // effective table
      effTitle: 'Što {name} dobiva',
      colOption: 'Opcija',
      colValue: 'Šalje se sada',
      colHas: 'Klijent ima',
      notSent: 'ne šalje se',
      staleTag: 'staro',
      showInTable: 'Prikaži opciju {opt} u tablici',

      // rule table
      rtTitle: '{opt}: koja razina pobjeđuje',
      colLevel: 'Razina',
      colClass: 'Klasa',
      colVal: 'Vrijednost',
      implicit: 'nije postavljena ni na jednoj razini koja vrijedi',
      outSent: 'šalje se',
      outNotSent: 'ne šalje se',
      wordHit: 'postavlja',
      wordWin: 'pobjeđuje',
      wordBeaten: 'nadjačana',
      noteClass: 'samo za klasu {cls}',
      noteRes: 'samo za {name}',

      // captions
      capOnly: 'Opcija {opt} postavljena je samo {at}: {name} dobiva {v}.',
      capBeat: 'Opcija {opt} postavljena je {lo} i {at}: pobjeđuje {win} jer je specifičnija — {name} dobiva {v}.',
      capNone: 'Opcija {opt} nije postavljena ni na jednoj razini koja vrijedi za klijenta ({name}): ne šalje se.',
      capClassYes: 'Klijent ({name}) šalje klasu proizvođača {cls} (opcija 60), pa klasna opcija vrijedi za njega.',
      capClassBeats: 'Klasna opcija nadjačava običnu opciju iste razine.',
      capClassNo: 'Opcija {opt} postavljena je samo za klasu {cls}, a klijent ({name}) tu klasu ne šalje.',
      capResHas: 'Pisač ima rezervaciju: uvijek {ip}.',
      capResOther: 'Opcija {opt} na rezervaciji vrijedi samo za pisač.',
      capStale1: 'Klijent ({name}) još ima staru vrijednost — {list} — sve do obnove zakupa: na T1 = {t1} (pola zakupa od {lease}) ili ručno, gumbom Obnovi zakup.',
      capStale: 'Klijent ({name}) još ima stare vrijednosti — {list} — sve do obnove zakupa: na T1 = {t1} (pola zakupa od {lease}) ili ručno, gumbom Obnovi zakup.',
      staleItem: '{what}: {old} → {now}',
      staleAddr: 'adresa',
      capKeep: 'Obnovom zakupa klijent ({name}) zadržava {ip}, koja je i dalje valjana; novi bi klijent sada dobio {free}.',
      list2: '{a} i {b}',
      listMore: '{a}, {b}',
      none: '—',

      explain: '<p>Poslužitelj DHCP opcije (usmjernik, poslužitelje imena, domenu, NTP) može postaviti na više razina: za cijeli ' +
        'poslužitelj, za jedan <em lang="en">scope</em> (opseg adresa) i za jednu rezervaciju. U ovom simulatoru na ' +
        'poslužitelju i <em lang="en">scope</em>-u postoje još i opcije za klasu proizvođača (opcija 60) ili korisničku ' +
        'klasu (opcija 77) koju klijent šalje. Trajanje zakupa (opcija 51) svojstvo je <em lang="en">scope</em>-a.</p>' +
        '<p><b>Za svaku opciju posebno pobjeđuje najspecifičnija razina koja je postavlja:</b> rezervacija nadjačava ' +
        '<em lang="en">scope</em>, <em lang="en">scope</em> nadjačava poslužitelj, a klasna opcija nadjačava običnu opciju ' +
        'svoje razine. Opcija koju ne postavlja nijedna razina ne šalje se. To nije pravilo prvog pogotka (prvi redak koji ' +
        'odgovara odlučuje) ni „zadnja postavljena pobjeđuje”: redoslijed upisivanja ne znači ništa.</p>' +
        '<p>Adresa: klijent s rezervacijom uvijek dobiva rezerviranu adresu, a ostali slobodnu adresu iz raspona koja nije ' +
        'isključena, rezervirana ni zauzeta. Simulator uzima najnižu takvu.</p>' +
        '<p>Promjena na poslužitelju ne stiže do klijenta odmah. Klijent drži ono što je dobio do obnove zakupa, na T1, ' +
        'pola trajanja zakupa: uz 8 dana to su 4 dana. Obnovom zadržava adresu dok je ona i dalje valjana.</p>' +
        '<p><b>Česte zablude:</b> „vrijedi opcija koju sam zadnju postavio”; „opcije poslužitelja su zadane i ' +
        '<em lang="en">scope</em> ih ne može promijeniti”; „promjena opcije odmah mijenja klijente”.</p>'
    },
    en: {
      stage: 'DHCP server and client',

      client: 'Client',
      nameLaptop: 'laptop',
      namePrinter: 'printer',
      namePhone: 'VoIP phone',
      scope006: 'Option 006 on the scope',
      resOption003: 'Option 003 on the reservation',
      exclusion: 'Exclusion range',
      classNtp: 'Class option 042',
      focus: 'Option in the table',
      renew: 'Renew the lease',
      renewHint: 'The clients renew their leases now, as if T1 had come.',
      held: 'State at the last renewal',

      presetServerScope: 'Server and scope',
      presetServerScopeHint: 'Laptop: 003 from the scope, 006 and 015 from the server.',
      presetScopeOverrides: 'The scope overrides',
      presetScopeOverridesHint: 'DNS on the scope beats DNS on the server.',
      presetReservation: 'Reservation',
      presetReservationHint: 'Printer: always 10.0.10.40, and 003 from the reservation wins.',
      presetClassOption: 'Class option',
      presetClassOptionHint: 'The phone sends class VoIP-Phone and gets 042.',
      presetChangeNeedsRenew: 'A change waits for renewal',
      presetChangeNeedsRenewHint: 'The new DNS is set, but the client gets it only when it renews its lease.',

      legWin: 'wins',
      legBeaten: 'overridden',
      legNo: 'not for this client',
      legStale: 'client still has the old value',
      legChanged: 'changed by the last setting',

      lvl_server: 'server',
      lvl_serverClass: 'server class',
      lvl_scope: 'scope',
      lvl_scopeClass: 'scope class',
      lvl_reservation: 'reservation',
      at_server: 'on the server',
      at_serverClass: 'as a server class option',
      at_scope: 'on the scope',
      at_scopeClass: 'as a scope class option',
      at_reservation: 'on the reservation',
      win_server: 'the server',
      win_serverClass: 'the server\'s class option',
      win_scope: 'the scope',
      win_scopeClass: 'the scope\'s class option',
      win_reservation: 'the reservation',

      opt003: 'Router',
      opt006: 'DNS Servers',
      opt015: 'DNS Domain Name',
      opt042: 'NTP Servers',
      opt051: 'Lease',
      days: ['{n} day', '{n} days'],

      boxServer: 'Server options',
      boxScope: 'Scope {subnet}',
      boxReservations: 'Reservations',
      boxReservation: '{name} · {mac} → {ip}',
      range: 'Range',
      exclusionRow: 'Excluded',
      noExclusion: 'no exclusion',
      leaseRow: 'Lease',
      leasedRow: 'Leased',
      nextFree: 'Next free',
      poolEmpty: 'none free',
      classTag: 'class {cls}',
      noOptions: 'no options',

      clientTitle: 'Client: {name}',
      mac: 'MAC',
      vendorClass: 'Vendor class (60)',
      noClass: 'none sent',
      address: 'Address',
      reservedTag: 'reserved',
      dynamicTag: 'from the range',

      effTitle: 'What the {name} gets',
      colOption: 'Option',
      colValue: 'Sent now',
      colHas: 'Client has',
      notSent: 'not sent',
      staleTag: 'old',
      showInTable: 'Show option {opt} in the table',

      rtTitle: '{opt}: which level wins',
      colLevel: 'Level',
      colClass: 'Class',
      colVal: 'Value',
      implicit: 'set at no level that applies',
      outSent: 'sent',
      outNotSent: 'not sent',
      wordHit: 'sets it',
      wordWin: 'wins',
      wordBeaten: 'overridden',
      noteClass: 'only for class {cls}',
      noteRes: 'only for the {name}',

      capOnly: 'Option {opt} is set only {at}: the {name} gets {v}.',
      capBeat: 'Option {opt} is set {lo} and {at}: {win} wins because it is more specific, and the {name} gets {v}.',
      capNone: 'Option {opt} is set at no level that applies to the {name}: it is not sent.',
      capClassYes: 'The {name} sends vendor class {cls} (option 60), so the class option applies to it.',
      capClassBeats: 'The class option overrides the plain option of the same level.',
      capClassNo: 'Option {opt} is set only for class {cls}, and the {name} does not send that class.',
      capResHas: 'The printer has a reservation: always {ip}.',
      capResOther: 'Option {opt} on the reservation is only for the printer.',
      capStale1: 'The {name} still has the old value — {list} — until it renews its lease: at T1 = {t1} (half the {lease} lease) or by hand, with Renew the lease.',
      capStale: 'The {name} still has the old values — {list} — until it renews its lease: at T1 = {t1} (half the {lease} lease) or by hand, with Renew the lease.',
      staleItem: '{what}: {old} → {now}',
      staleAddr: 'address',
      capKeep: 'When it renews, the {name} keeps {ip}, which is still valid; a new client would now get {free}.',
      list2: '{a} and {b}',
      listMore: '{a}, {b}',
      none: '—',

      explain: '<p>A DHCP server can set options (router, DNS servers, domain, NTP) at several levels: for the whole server, for ' +
        'one scope and for one reservation. In this simulator the server and the scope also have options for a vendor ' +
        'class (option 60) or a user class (option 77) that the client sends. The lease time (option 51) is a property ' +
        'of the scope.</p>' +
        '<p><b>For each option separately, the most specific level that sets it wins:</b> the reservation overrides the ' +
        'scope, the scope overrides the server, and a class option overrides the plain option of its level. An option set ' +
        'at no level is not sent. This is not first match (the first row that matches decides) and not “the last one set ' +
        'wins”: the order in which options were entered means nothing.</p>' +
        '<p>Address: a client with a reservation always gets the reserved address; any other gets a free address from the ' +
        'range that is not excluded, not reserved and not leased. The simulator takes the lowest.</p>' +
        '<p>A change on the server does not reach the client at once. The client keeps what it got until it renews its ' +
        'lease at T1, half the lease time: with 8 days that is 4 days. On renewal it keeps its address while that is still ' +
        'valid.</p>' +
        '<p><b>Common mistakes:</b> “the option I set last wins”; “server options are defaults that the scope cannot ' +
        'change”; “changing an option changes the clients now”.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
