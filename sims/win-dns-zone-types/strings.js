/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dns-zone-types, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name}
   is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term; terms the
   glossary lacks are written out (NOTES.md "Term pairs").
   Server names, zone names, partitions, addresses and serials are data: the page puts them in translate="no" elements;
   the option labels of the zone and server selects are here so the drop-downs read from the table too.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Poslužitelji i zone koje drže',

      // params
      zone: 'Zona',
      type: 'Vrsta zone',
      typePrimary: 'primarna, u datoteci',
      typeSecondary: 'sekundarna (prijenosom zone)',
      typeStub: 'stub, u datoteci',
      typeAdPrimary: 'primarna, integrirana u AD',
      typeAdStub: 'stub, integrirana u AD',
      scope: 'Opseg replikacije (samo zone u AD-u)',
      scopeForest: 'šuma',
      scopeDomain: 'domena',
      scopeAll: 'svi DC-ovi domene',
      scopeCustom: 'vlastita particija',
      host: 'Stvori na poslužitelju',
      dc3Dns: 'DC3 dobiva ulogu DNS',
      ms1Secondary: 'MS1 drži sekundarnu kopiju',
      allowXfr: 'Glavni poslužitelj dopušta prijenos zone',

      // option labels (data, the same in both languages)
      zCorp: 'corp.example',
      zBranch: 'branch.corp.example',
      zPartner: 'partner.example',
      sDC1: 'DC1',
      sDC3: 'DC3',
      sRODC1: 'RODC1',
      sDC4: 'DC4',
      sMS1: 'MS1',

      // presets
      presetDomain: 'Opseg: domena',
      presetDomainHint: 'Samo DC-ovi s ulogom DNS u domeni corp.example',
      presetForest: 'Opseg: šuma',
      presetForestHint: 'I DC4 iz druge domene',
      presetAll: 'Svi DC-ovi domene',
      presetAllHint: 'DC3 zonu sprema, a ne poslužuje',
      presetMs1: 'Sekundarna na MS1',
      presetMs1Hint: 'Prijenos je odbijen; uključi ga',
      presetStub: 'Stub za partnera',
      presetStubHint: 'Samo SOA, NS i adrese poslužitelja',
      presetMember: 'AD na članu',
      presetMemberHint: 'MS1 nije DC: odbijeno',

      // legend (K4 marks)
      legServes: 'drži i odgovara',
      legStores: 'samo sprema',
      legOut: 'nije u opsegu',
      legRejected: 'odbijeno ili bez prijenosa',
      legChanged: 'promijenjeno',

      // the table
      tableTitle: 'Tko drži koju zonu',
      colServer: 'Poslužitelj',
      colDomain: 'Domena',
      colRole: 'Uloga',
      colDns: 'DNS',
      colThis: 'ova zona',
      colMark: 'Dobiva li ovu zonu?',
      roleDC: 'DC',
      roleRODC: 'RODC',
      roleMember: 'član',
      dnsYes: 'da',
      dnsNo: 'ne',
      wordWin: 'drži',
      wordHit: 'sprema',

      // cells: glyph, word, title
      holdWrite: 'upisiva',
      holdRead: 'za čitanje',
      holdStub: 'stub',
      holdStored: 'spremljena',
      holdRefused: 'bez prijenosa',
      holdNone: 'ništa',
      holdRejected: 'odbijeno',
      keyTitle: 'Ćelije',
      cellTitle: '{server}, {zone}: {what}',
      cellSerial: 'serijski broj {serial}',

      // notes in the mark column
      noteRodc: 'promjene upućuje dalje',
      noteFile: 'jedina kopija',
      noteXfr: 'od {from}',
      noteStored: 'nema ulogu DNS',
      noteRefused: '{from} odbija',
      noteNotEnlisted: 'nije upisan',
      noteMs1: 'sekundarna od {from}',

      // rejections
      errNotDc: '{server} nije DC: zona u AD-u postoji samo na DC-ovima',
      errNoDns: '{server} nema ulogu DNS: na njemu se zona ne stvara',
      errRodc: '{server} je RODC: zonu u AD-u stvara DC s upisom',
      errNotEnlisted: '{server} nije upisan u particiju {part}',
      errExists: ['{server} već drži zonu {zone}', '{server} već drže zonu {zone}', '{server} već drže zonu {zone}'],
      errExistsAd: 'zona {zone} već je u AD-u, u particiji {part}: opseg joj mijenja DC koji je drži',
      errScopeFile: 'zona u datoteci nema opseg replikacije',
      errNoScope: 'zona u AD-u treba opseg replikacije',
      errNoHost: 'nema poslužitelja {server}',
      rejNotDc: 'nije DC',
      rejNoDns: 'nema ulogu DNS',
      rejRodc: 'RODC ne može',
      rejNotEnlisted: 'nije upisan',
      rejExists: 'već je drži',
      rejExistsAd: 'već je u AD-u',
      rejScopeFile: 'datoteka nema opseg',
      rejNoScope: 'nema opsega',
      rejNoHost: 'nema poslužitelja',

      // the detail box
      detTitle: 'Zona {zone} na {server}',
      detNobody: 'Zonu {zone} nitko ne drži.',
      detStoreAd: 'U AD-u, particija {part}',
      detStoreFile: 'U datoteci {file}, samo ovdje',
      detCopyRefused: '{from} odbija prijenos: zona je prazna',
      detFull: ['Cijela zona: {n} zapis, serijski broj {serial}', 'Cijela zona: {n} zapisa, serijski broj {serial}', 'Cijela zona: {n} zapisa, serijski broj {serial}'],
      detFullFrom: ['Cijela zona od {from}: {n} zapis, serijski broj {serial}', 'Cijela zona od {from}: {n} zapisa, serijski broj {serial}', 'Cijela zona od {from}: {n} zapisa, serijski broj {serial}'],
      detStub: ['Stub od {from}: {n} zapis, serijski broj {serial}', 'Stub od {from}: {n} zapisa, serijski broj {serial}', 'Stub od {from}: {n} zapisa, serijski broj {serial}'],
      detStored: 'Spremljena, ali bez uloge DNS ne odgovara',
      recsTitle: 'Zapisi u stub zoni',
      detQuery: 'Upit za {name}:',
      detAnswer: '{addr}, mjerodavan odgovor',
      detRefer: 'stub nema taj zapis: pita {ns}',
      detElsewhere: 'ne drži zonu: ime traži kao svako drugo',
      detServfail: 'zona nije učitana: odgovor SERVFAIL',
      detUpdates: 'Dinamička ažuriranja:',
      updSecure: 'i „samo sigurna”',
      updNonsecure: 'samo nesigurna (sigurna traže AD)',
      updMaster: 'idu glavnom poslužitelju',

      // the check box
      checkTitle: 'Provjera',
      chkOk: 'Zona {zone} je stvorena na {server}.',
      chkRejected: 'Zona {zone} nije stvorena; ostaje prijašnje stanje.',
      chkMs1Ok: 'MS1: sekundarna kopija od {from}, serijski broj {serial}.',
      chkMs1Refused: 'MS1: {from} odbija prijenos zone.',
      chkMs1Rejected: 'MS1: sekundarna kopija odbijena.',
      chkXfrOn: 'Prijenosi zone su dopušteni.',
      chkXfrOff: 'Prijenosi zone su isključeni.',

      // captions
      capDomain: 'Opseg replikacije „domena”: zonu dobivaju samo DC-ovi s ulogom DNS u domeni {domain}: {list}.',
      capOutDomain: ['{list} je u drugoj domeni.', '{list} su u drugoj domeni.', '{list} su u drugoj domeni.'],
      capOutDns: ['{list} nema ulogu DNS.', '{list} nemaju ulogu DNS.', '{list} nemaju ulogu DNS.'],
      capForest: 'Opseg replikacije „šuma”: zonu dobiva svaki DC s ulogom DNS u šumi, i iz druge domene: {list}.',
      capAll: 'Opseg replikacije „svi DC-ovi domene”: zona je u particiji domene {domain}, pa je dobiva svaki DC te domene, i bez uloge DNS.',
      capStored: ['{list} je samo sprema i ne odgovara.', '{list} je samo spremaju i ne odgovaraju.', '{list} je samo spremaju i ne odgovaraju.'],
      capCustom: 'Opseg replikacije „vlastita particija”: zonu dobivaju samo DC-ovi upisani u particiju {part}: {list}, preko granice domene.',
      capRodc: 'RODC1 ima kopiju samo za čitanje; promjene upućuje DC-u s upisom.',
      capPrimary: 'Primarna zona u datoteci živi samo na {server} i samo se ondje mijenja; AD je ne replicira.',
      capPrimaryBeside: 'Zona u AD-u na {list} ostaje: to su dvije zasebne primarne zone istog imena, a promjena u jednoj nikad ne stiže u drugu.',
      capSecondary: 'Sekundarna zona na {server} je kopija samo za čitanje, povučena prijenosom zone od {from}.',
      capSecondaryRefused: '{server} traži prijenos zone od {from}, a on ga odbija: zona ostaje prazna.',
      capStub: 'Stub zona drži samo SOA, NS i adrese poslužitelja partnera; ne odgovara na upite o njegovim imenima, nego ih šalje na {ns}.',
      capStubOwn: 'Stub zona drži samo SOA, NS i adrese poslužitelja zone {zone}; upite o njezinim imenima šalje na {ns}.',
      capAdStub: 'Stub zona u AD-u: {list} drže samo SOA, NS i adrese poslužitelja, a dobivaju ih replikacijom AD-a.',
      capStubRefused: '{from} odbija prijenos: stub zona ostaje prazna.',
      capMs1Ok: 'MS1 drži sekundarnu kopiju od {from}, serijski broj {serial}.',
      capMs1Refused: 'MS1 traži prijenos zone od {from}, a on ga odbija; uključi prijenos zone.',
      capRejected: 'Odbijeno: {why}. Ostaje prijašnje stanje.',

      explain:
        '<p>Zona može biti spremljena na dva načina. <b>U datoteci</b>: [[primary server]] drži <i>primary zone</i> ' +
        '(primarnu zonu), jedinu upisivu kopiju; drugi poslužitelji drže <i>secondary zone</i> (sekundarnu zonu), ' +
        'kopiju samo za čitanje koju dobivaju kroz [[zone transfer]], i to samo ako im glavni poslužitelj ' +
        'prijenos dopusti. <b>Integrirana u AD</b>: zona je objekt u bazi AD-a i putuje replikacijom AD-a, pa je drže ' +
        'samo kontroleri domene (<i>domain controller</i>, DC); svaki DC s upisom prima promjene, a RODC drži kopiju ' +
        'samo za čitanje. Samo zona u AD-u nudi dinamička ažuriranja „samo sigurna".</p>' +
        '<p><i>Replication scope</i> (opseg replikacije) kaže koji DC-ovi dobivaju podatke zone: <b>šuma</b> (svaki DC ' +
        's ulogom DNS u šumi), <b>domena</b> (svaki DC s ulogom DNS u domeni DC-a na kojem je zona stvorena; ' +
        'zadano), <b>svi DC-ovi domene</b> (particija same domene: i DC bez uloge DNS je sprema, ali ne odgovara) i ' +
        '<b>vlastita particija</b> (samo upisani DC-ovi).</p>' +
        '<p><i>Stub zone</i> (stub zona) nije mala kopija zone: drži samo SOA, NS i adrese poslužitelja imena, da ' +
        'poslužitelj zna koga pitati. Česte zablude: „zona u AD-u je na svakom DC-u" (samo u opsegu i s ulogom DNS); ' +
        '„sekundarna zona na DC-u isto je što i zona u AD-u" (nije: jedna kopija, prijenosom zone).</p>'
    },
    en: {
      stage: 'Servers and the zones they hold',

      zone: 'Zone',
      type: 'Zone type',
      typePrimary: 'primary, in a file',
      typeSecondary: 'secondary (by zone transfer)',
      typeStub: 'stub, in a file',
      typeAdPrimary: 'primary, AD-integrated',
      typeAdStub: 'stub, AD-integrated',
      scope: 'Replication scope (AD zones only)',
      scopeForest: 'forest',
      scopeDomain: 'domain',
      scopeAll: 'all DCs in the domain',
      scopeCustom: 'custom partition',
      host: 'Create on server',
      dc3Dns: 'DC3 gets the DNS role',
      ms1Secondary: 'MS1 holds a secondary copy',
      allowXfr: 'The master allows zone transfers',

      zCorp: 'corp.example',
      zBranch: 'branch.corp.example',
      zPartner: 'partner.example',
      sDC1: 'DC1',
      sDC3: 'DC3',
      sRODC1: 'RODC1',
      sDC4: 'DC4',
      sMS1: 'MS1',

      presetDomain: 'Scope: domain',
      presetDomainHint: 'Only DCs running DNS in corp.example',
      presetForest: 'Scope: forest',
      presetForestHint: 'DC4 in the other domain too',
      presetAll: 'All DCs in the domain',
      presetAllHint: 'DC3 stores the zone but does not serve it',
      presetMs1: 'Secondary on MS1',
      presetMs1Hint: 'The transfer is refused; allow it',
      presetStub: 'Stub for a partner',
      presetStubHint: 'Only SOA, NS and server addresses',
      presetMember: 'AD on a member',
      presetMemberHint: 'MS1 is not a DC: rejected',

      legServes: 'holds and answers',
      legStores: 'stores only',
      legOut: 'not in scope',
      legRejected: 'rejected or no transfer',
      legChanged: 'changed',

      tableTitle: 'Who holds which zone',
      colServer: 'Server',
      colDomain: 'Domain',
      colRole: 'Role',
      colDns: 'DNS',
      colThis: 'this zone',
      colMark: 'Does it get this zone?',
      roleDC: 'DC',
      roleRODC: 'RODC',
      roleMember: 'member',
      dnsYes: 'yes',
      dnsNo: 'no',
      wordWin: 'holds',
      wordHit: 'stores',

      holdWrite: 'writable',
      holdRead: 'read-only',
      holdStub: 'stub',
      holdStored: 'stored',
      holdRefused: 'no transfer',
      holdNone: 'nothing',
      holdRejected: 'rejected',
      keyTitle: 'Cells',
      cellTitle: '{server}, {zone}: {what}',
      cellSerial: 'serial {serial}',

      noteRodc: 'refers updates',
      noteFile: 'the only copy',
      noteXfr: 'from {from}',
      noteStored: 'no DNS role',
      noteRefused: '{from} refuses',
      noteNotEnlisted: 'not enlisted',
      noteMs1: 'secondary from {from}',

      errNotDc: '{server} is not a DC: an AD zone exists only on DCs',
      errNoDns: '{server} has no DNS role: no zone is created on it',
      errRodc: '{server} is an RODC: a writable DC creates AD zones',
      errNotEnlisted: '{server} is not enlisted in the partition {part}',
      errExists: ['{server} already holds the zone {zone}', '{server} already hold the zone {zone}'],
      errExistsAd: 'the zone {zone} is already in AD, in the partition {part}: a DC that holds it changes its scope',
      errScopeFile: 'a zone in a file has no replication scope',
      errNoScope: 'an AD zone needs a replication scope',
      errNoHost: 'there is no server {server}',
      rejNotDc: 'not a DC',
      rejNoDns: 'no DNS role',
      rejRodc: 'RODC can\'t',
      rejNotEnlisted: 'not enlisted',
      rejExists: 'already holds it',
      rejExistsAd: 'already in AD',
      rejScopeFile: 'a file has no scope',
      rejNoScope: 'no scope',
      rejNoHost: 'no such server',

      detTitle: 'Zone {zone} on {server}',
      detNobody: 'Nobody holds the zone {zone}.',
      detStoreAd: 'In AD, partition {part}',
      detStoreFile: 'In the file {file}, here only',
      detCopyRefused: '{from} refuses the transfer: the zone is empty',
      detFull: ['Whole zone: {n} record, serial {serial}', 'Whole zone: {n} records, serial {serial}'],
      detFullFrom: ['Whole zone from {from}: {n} record, serial {serial}', 'Whole zone from {from}: {n} records, serial {serial}'],
      detStub: ['Stub from {from}: {n} record, serial {serial}', 'Stub from {from}: {n} records, serial {serial}'],
      detStored: 'Stored, but without the DNS role it answers nothing',
      recsTitle: 'Records in the stub zone',
      detQuery: 'Query for {name}:',
      detAnswer: '{addr}, an authoritative answer',
      detRefer: 'not in the stub: asks {ns}',
      detElsewhere: 'does not hold the zone: looks the name up like any other',
      detServfail: 'the zone is not loaded: SERVFAIL',
      detUpdates: 'Dynamic updates:',
      updSecure: '"secure only" too',
      updNonsecure: 'nonsecure only (secure needs AD)',
      updMaster: 'go to the master',

      checkTitle: 'Check',
      chkOk: 'The zone {zone} is created on {server}.',
      chkRejected: 'The zone {zone} is not created; what was there stays.',
      chkMs1Ok: 'MS1: a secondary copy from {from}, serial {serial}.',
      chkMs1Refused: 'MS1: {from} refuses the zone transfer.',
      chkMs1Rejected: 'MS1: the secondary copy is rejected.',
      chkXfrOn: 'Zone transfers are allowed.',
      chkXfrOff: 'Zone transfers are off.',

      capDomain: 'Replication scope "domain": only DCs running DNS in {domain} get the zone: {list}.',
      capOutDomain: ['{list} is in another domain.', '{list} are in another domain.'],
      capOutDns: ['{list} has no DNS role.', '{list} have no DNS role.'],
      capForest: 'Replication scope "forest": every DC running DNS in the forest gets the zone, in the other domain too: {list}.',
      capAll: 'Replication scope "all DCs in the domain": the zone is in the domain partition of {domain}, so every DC of that domain gets it, even without the DNS role.',
      capStored: ['{list} only stores it and answers nothing.', '{list} only store it and answer nothing.'],
      capCustom: 'Replication scope "custom partition": only DCs enlisted in the partition {part} get the zone: {list}, across the domain boundary.',
      capRodc: 'RODC1 has a read-only copy; it refers updates to a writable DC.',
      capPrimary: 'A primary zone in a file lives on {server} only and changes there only; AD does not replicate it.',
      capPrimaryBeside: 'The AD zone on {list} stays: these are two separate primary zones with one name, and a change in one never reaches the other.',
      capSecondary: 'The secondary zone on {server} is a read-only copy, pulled by zone transfer from {from}.',
      capSecondaryRefused: '{server} asks {from} for a zone transfer and is refused: the zone stays empty.',
      capStub: 'A stub zone holds only the partner\'s SOA, NS and server addresses; it doesn\'t answer for the partner\'s names but sends those queries to {ns}.',
      capStubOwn: 'A stub zone holds only the SOA, NS and server addresses of {zone}; it sends queries for its names to {ns}.',
      capAdStub: 'An AD-integrated stub zone: {list} hold only the SOA, NS and server addresses, and get them by AD replication.',
      capStubRefused: '{from} refuses the transfer: the stub zone stays empty.',
      capMs1Ok: 'MS1 holds a secondary copy from {from}, serial {serial}.',
      capMs1Refused: 'MS1 asks {from} for a zone transfer and is refused; allow zone transfers.',
      capRejected: 'Rejected: {why}. What was there stays.',

      explain:
        '<p>A zone is stored in one of two ways. <b>In a file</b>: the [[primary server]] holds the primary zone, the ' +
        'only writable copy; other servers hold a secondary zone, a read-only copy they pull by [[zone transfer]], ' +
        'and only if the master allows the transfer. <b>AD-integrated</b>: the zone is an object in the AD database ' +
        'and travels by AD replication, so only domain controllers (DCs) hold it; every writable DC accepts changes, ' +
        'and an RODC holds a read-only copy. Only an AD zone offers "secure only" dynamic updates.</p>' +
        '<p>The replication scope says which DCs get the zone\'s data: <b>forest</b> (every DC running DNS in the ' +
        'forest), <b>domain</b> (every DC running DNS in the domain of the DC the zone was created on; the default), ' +
        '<b>all DCs in the domain</b> (the domain partition itself: a DC without the DNS role stores it but does not ' +
        'answer) and <b>custom partition</b> (only the DCs enlisted in it).</p>' +
        '<p>A stub zone is not a small copy of the zone: it holds only the SOA, the NS records and the name servers\' ' +
        'addresses, so the server knows whom to ask. Common mistakes: "an AD zone is on every DC" (only in scope and ' +
        'running DNS); "a secondary zone on a DC is the same as an AD zone" (it is not: one copy, by zone transfer).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
