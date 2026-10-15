/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dns-records, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term; English terms the
   glossary lacks are written out in the explanation (NOTES.md "Term pairs").
   Names, addresses, record types and status codes are data: the page puts them in translate="no" elements.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Zona i odgovor na upit',

      // params
      qname: 'Ime u upitu',
      qtype: 'Vrsta zapisa u upitu',
      addWww: 'www je nadimak (CNAME)',
      apexCname: 'CNAME na vrhu zone',
      mx: 'Pošta: dva MX zapisa',
      delegate: 'Delegiraj poddomenu sub',

      // presets
      presetUl: 'Zona iz knjige',
      presetUlHint: 'posluzitelj.lab.example, vrsta A: mjerodavan odgovor',
      presetNx: 'Nema imena',
      presetNxHint: 'nepostojece.lab.example: NXDOMAIN',
      presetCname: 'Nadimak',
      presetCnameHint: 'www.lab.example, vrsta A: dva zapisa u odgovoru',
      presetMx: 'Pošta (MX)',
      presetMxHint: 'lab.example, vrsta MX: niža prednost prva',
      presetNodata: 'Nema vrste',
      presetNodataHint: 'posluzitelj.lab.example, vrsta AAAA: NODATA, a ne NXDOMAIN',
      presetApex: 'CNAME na vrhu',
      presetApexHint: 'Zona se ne učitava',
      presetDeleg: 'Delegiranje',
      presetDelegHint: 'www.sub.lab.example: uputa bez aa',

      // legend
      legAnswer: 'u odgovoru',
      legAlong: 'uz odgovor',
      legNo: 'ne odgovara upitu',
      legWarn: 'pogreška zone',
      legChanged: 'promijenjeno',

      // zone table (kit view K4)
      zoneTitle: 'Datoteka zone',
      colOwner: 'Vlasnik',
      colTtl: 'TTL',
      colType: 'Vrsta',
      colData: 'Podatak',
      colMark: 'Za ovaj upit',
      implicit: 'nijedan zapis tog imena i vrste',
      implicitCut: 'ispod reza zone: uputa',
      wordWin: 'odgovor',
      wordHit: 'uz odgovor',
      notLoaded: 'nije učitan',
      tagNew: 'novo',
      noteCname: '⚠ uz druge podatke',
      noteMxAlias: '⚠ izmjenjivač je nadimak',

      // zone check strip
      checkTitle: 'Provjera zone',
      chkOk: ['Zona se učitava: {n} zapis, serijski broj {serial}.', 'Zona se učitava: {n} zapisa, serijski broj {serial}.', 'Zona se učitava: {n} zapisa, serijski broj {serial}.'],
      chkApex: '{owner} je vrh zone i nosi {types}: CNAME ondje nije dopušten.',
      chkCname: '{owner} ima CNAME i još {types}: ime s CNAME zapisom ne smije nositi ništa drugo.',
      chkCnameMulti: '{owner} ima više CNAME zapisa; dopušten je jedan.',
      chkBadData: '{owner}: podatak ne odgovara vrsti {type}.',
      chkNoSoa: 'Na vrhu zone nema SOA zapisa.',
      chkNoNs: 'Na vrhu zone nema NS zapisa.',
      chkTtl: '{owner} {type}: zapisi istog RRseta moraju imati isti TTL; ovdje svi u odgovoru dobivaju najmanji.',
      chkMxCname: '{owner} MX pokazuje na {host}, a to je nadimak; izmjenjivač mora biti kanonsko ime.',
      chkNotLoaded: 'Zona se ne učitava; odgovara zadnja ispravna zona.',

      // query and answer
      queryTitle: 'Upit mjerodavnom poslužitelju',
      kindAnswer: 'odgovor',
      kindNodata: 'ime postoji, ali nema zapisa te vrste',
      kindNx: 'ime ne postoji',
      kindReferral: 'uputa na delegiranu zonu',
      kindFail: 'odgovor nije moguć',
      aaYes: 'aa: mjerodavan odgovor',
      aaNo: 'bez aa: nije mjerodavan',
      secAnswer: 'Odgovor',
      secAuthority: 'Nadležnost',
      secAdditional: 'Dodatno',
      empty: 'prazno',
      followTitle: 'Što slijedi',
      followTry: '{i}. pokušaj',
      followPref: 'prednost {pref}',
      followAsk: 'rezolver dalje pita',
      followNoAddr: 'adresa nije u ovoj zoni',
      followOutside: 'kanonsko ime je izvan zone; rezolver ga traži drugdje',

      // captions
      capAnswer: ['{name} ima {n} zapis vrste {type}; odgovor ga nosi uz zastavicu aa, jer je poslužitelj mjerodavan za zonu.',
        '{name} ima {n} zapisa vrste {type}; odgovor nosi cijeli RRset uz zastavicu aa.',
        '{name} ima {n} zapisa vrste {type}; odgovor nosi cijeli RRset uz zastavicu aa.'],
      capA: 'A zapis nosi jednu IPv4 adresu.',
      capAaaa: 'AAAA zapis nosi jednu IPv6 adresu.',
      capTxt: 'TXT zapis nosi jedan ili više nizova znakova.',
      capSoa: 'SOA opisuje samu zonu; zadnje polje, 900, kaže koliko se pamti negativan odgovor.',
      capNsApex: 'NS na vrhu zone imenuje mjerodavni poslužitelj; njegova adresa ide u dodatni odjeljak.',
      capCnameQ: 'Upit za vrstu CNAME vraća sam nadimak i ne slijedi ga.',
      capCname: '{from} ima CNAME zapis: odgovor nosi nadimak i zatim {type} zapis kanonskog imena {to}.',
      capCnameNodata: '{from} ima CNAME zapis: odgovor nosi nadimak, ali kanonsko ime {to} nema zapis vrste {type}.',
      capCnameNx: '{from} ima CNAME zapis prema {to}, a to ime ne postoji: NXDOMAIN, s nadimkom u odgovoru.',
      capMx: 'MX vraća sve izmjenjivače pošte. Prvi se pokušava {host} (prednost {pref}), jer niža prednost ide prva.',
      capMxHost: 'MX nosi ime, a ne adresu: adresu izmjenjivača, {addr}, daje njegov vlastiti zapis A ili AAAA.',
      capNodata: '{name} postoji, ali nema zapis vrste {type}: NOERROR s praznim odgovorom (NODATA), a ne NXDOMAIN.',
      capNx: '{name} ne postoji u zoni: NXDOMAIN uz zastavicu aa, odgovor je prazan.',
      capReferral: 'Poddomena {cut} je delegirana: ova zona za to ime nije mjerodavna, pa vraća uputu na {ns} bez zastavice aa.',
      capApex: 'CNAME na vrhu zone nije dopušten: lab.example već nosi SOA i NS, a ime s CNAME zapisom ne smije nositi ništa drugo.',
      capLastValid: 'Zona se ne učitava; poslužitelj odgovara iz zadnje ispravne zone.',
      capFail: 'Lanac nadimaka se vrti u krug ili je predug: SERVFAIL.',
      capOutside: 'Kanonsko ime {to} je izvan zone: odgovor nosi nadimak, a dalje traži rezolver.',

      explain: '<p>Zona je skup zapisa. Svaki [[resource record]] ima vlasnika, TTL i razred, a [[record type]] kaže ' +
        'kako se podatak čita. <code>A</code> nosi jednu IPv4 adresu, <code>AAAA</code> jednu IPv6 adresu, ' +
        '<code>TXT</code> nizove znakova, <code>NS</code> ime mjerodavnog poslužitelja, a <code>MX</code> prednost i ime ' +
        'izmjenjivača pošte. Zapisi istog vlasnika i vrste čine RRset i vraćaju se zajedno.</p>' +
        '<p><code>CNAME</code> kaže da je vlasnik <em lang="en">alias</em> (nadimak) za <em lang="en">canonical name</em> ' +
        '(kanonsko ime): odgovor nosi nadimak, a traženje se nastavlja na kanonskom imenu. Ime s CNAME zapisom ne smije ' +
        'nositi ništa drugo, a [[zone apex]] uvijek nosi SOA i NS, pa CNAME ondje nije dopušten i zona se ne učitava. ' +
        'Neki pružatelji usluga nude zamjenske vrste za to (ALIAS, ANAME), ali one nisu dio DNS-a.</p>' +
        '<p>Nema zapisa te vrste nije isto što i nema imena: ime koje postoji bez tražene vrste daje NOERROR s praznim ' +
        'odgovorom (NODATA), a ime koje ne postoji daje NXDOMAIN.</p>' +
        '<p><code>MX</code> imenuje računalo, a ne adresu; niža prednost se pokušava prva. NS na vrhu zone su ' +
        'mjerodavni podaci; NS ispod vrha je [[delegation]]: za sva imena ispod njega zona vraća uputu, bez zastavice ' +
        '<code>aa</code>.</p>' +
        '<p>Imena u datoteci zone su relativna prema ishodištu (<code>@</code>), osim ako završavaju točkom.</p>'
    },
    en: {
      stage: 'The zone and the answer to a query',

      qname: 'Name in the query',
      qtype: 'Record type in the query',
      addWww: 'www is an alias (CNAME)',
      apexCname: 'CNAME at the zone apex',
      mx: 'Mail: two MX records',
      delegate: 'Delegate the subdomain sub',

      presetUl: 'The book\'s zone',
      presetUlHint: 'posluzitelj.lab.example, type A: an authoritative answer',
      presetNx: 'No such name',
      presetNxHint: 'nepostojece.lab.example: NXDOMAIN',
      presetCname: 'Alias',
      presetCnameHint: 'www.lab.example, type A: two records in the answer',
      presetMx: 'Mail (MX)',
      presetMxHint: 'lab.example, type MX: lower preference first',
      presetNodata: 'No such type',
      presetNodataHint: 'posluzitelj.lab.example, type AAAA: NODATA, not NXDOMAIN',
      presetApex: 'CNAME at apex',
      presetApexHint: 'The zone does not load',
      presetDeleg: 'Delegation',
      presetDelegHint: 'www.sub.lab.example: a referral without aa',

      legAnswer: 'in the answer',
      legAlong: 'sent along',
      legNo: 'does not match the query',
      legWarn: 'zone error',
      legChanged: 'changed',

      zoneTitle: 'Zone file',
      colOwner: 'Owner',
      colTtl: 'TTL',
      colType: 'Type',
      colData: 'Data',
      colMark: 'For this query',
      implicit: 'no record of that name and type',
      implicitCut: 'below a zone cut: referral',
      wordWin: 'answer',
      wordHit: 'sent along',
      notLoaded: 'not loaded',
      tagNew: 'new',
      noteCname: '⚠ beside other data',
      noteMxAlias: '⚠ the exchange is an alias',

      checkTitle: 'Zone check',
      chkOk: ['The zone loads: {n} record, serial {serial}.', 'The zone loads: {n} records, serial {serial}.'],
      chkApex: '{owner} is the zone apex and holds {types}: no CNAME there.',
      chkCname: '{owner} has a CNAME and also {types}: a name with a CNAME may hold nothing else.',
      chkCnameMulti: '{owner} has more than one CNAME; one is allowed.',
      chkBadData: '{owner}: the data does not fit type {type}.',
      chkNoSoa: 'The zone apex has no SOA record.',
      chkNoNs: 'The zone apex has no NS record.',
      chkTtl: '{owner} {type}: the records of one RRset must have one TTL; here the answer gives them all the lowest.',
      chkMxCname: '{owner} MX points to {host}, which is an alias; the exchange must be a canonical name.',
      chkNotLoaded: 'The zone does not load; the last valid zone answers.',

      queryTitle: 'Query to the authoritative server',
      kindAnswer: 'answer',
      kindNodata: 'the name exists, but has no record of that type',
      kindNx: 'the name does not exist',
      kindReferral: 'a referral to the delegated zone',
      kindFail: 'no answer possible',
      aaYes: 'aa: authoritative answer',
      aaNo: 'no aa: not authoritative',
      secAnswer: 'Answer',
      secAuthority: 'Authority',
      secAdditional: 'Additional',
      empty: 'empty',
      followTitle: 'What follows',
      followTry: 'try {i}',
      followPref: 'preference {pref}',
      followAsk: 'the resolver asks next',
      followNoAddr: 'its address is not in this zone',
      followOutside: 'the canonical name is outside the zone; the resolver looks it up elsewhere',

      capAnswer: ['{name} has {n} record of type {type}; the answer carries it with the aa flag, because the server is authoritative for the zone.',
        '{name} has {n} records of type {type}; the answer carries the whole RRset with the aa flag.'],
      capA: 'An A record holds one IPv4 address.',
      capAaaa: 'An AAAA record holds one IPv6 address.',
      capTxt: 'A TXT record holds one or more character strings.',
      capSoa: 'The SOA describes the zone itself; its last field, 900, says how long a negative answer is remembered.',
      capNsApex: 'NS at the zone apex names the authoritative server; its address goes in the additional section.',
      capCnameQ: 'A query for type CNAME returns the alias itself and does not follow it.',
      capCname: '{from} has a CNAME: the answer carries the alias and then the {type} record of the canonical name {to}.',
      capCnameNodata: '{from} has a CNAME: the answer carries the alias, but the canonical name {to} has no record of type {type}.',
      capCnameNx: '{from} has a CNAME to {to}, and that name does not exist: NXDOMAIN, with the alias in the answer.',
      capMx: 'MX returns every mail exchanger. {host} (preference {pref}) is tried first, because lower preference goes first.',
      capMxHost: 'MX holds a name, not an address: the exchanger\'s address, {addr}, comes from its own A or AAAA record.',
      capNodata: '{name} exists, but has no record of type {type}: NOERROR with an empty answer (NODATA), not NXDOMAIN.',
      capNx: '{name} does not exist in the zone: NXDOMAIN with the aa flag, and an empty answer.',
      capReferral: 'The subdomain {cut} is delegated: this zone is not authoritative for the name, so it returns a referral to {ns} without the aa flag.',
      capApex: 'A CNAME at the zone apex isn\'t allowed: lab.example already holds SOA and NS, and a name with a CNAME may hold nothing else.',
      capLastValid: 'The zone does not load; the server answers from the last valid zone.',
      capFail: 'The chain of aliases loops or is too long: SERVFAIL.',
      capOutside: 'The canonical name {to} is outside the zone: the answer carries the alias, and the resolver looks further.',

      explain: '<p>A zone is a set of records. Every [[resource record]] has an owner, a TTL and a class, and its ' +
        '[[record type]] says how the data is read. <code>A</code> holds one IPv4 address, <code>AAAA</code> one IPv6 address, ' +
        '<code>TXT</code> character strings, <code>NS</code> the name of an authoritative server, and <code>MX</code> a ' +
        'preference and the name of a mail exchanger. Records of the same owner and type form an RRset and are returned ' +
        'together.</p>' +
        '<p><code>CNAME</code> says the owner is an <b>alias</b> for a <b>canonical name</b>: the answer carries the alias, ' +
        'and the lookup continues at the canonical name. A name with a CNAME may hold nothing else, and the [[zone apex]] always ' +
        'holds SOA and NS, so a CNAME there is not allowed and the zone does not load. Some providers offer stand-in types ' +
        'for it (ALIAS, ANAME), but they are not part of DNS.</p>' +
        '<p>No record of that type is not the same as no name: a name that exists without the type gives NOERROR with an ' +
        'empty answer (NODATA), and a name that does not exist gives NXDOMAIN.</p>' +
        '<p><code>MX</code> names a host, not an address; lower preference is tried first. NS at the zone apex is ' +
        'authoritative data; NS below the apex is a [[delegation]]: for every name under it the zone returns a referral, ' +
        'without the <code>aa</code> flag.</p>' +
        '<p>Names in a zone file are relative to the origin (<code>@</code>) unless they end with a dot.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
