/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dns-client-order, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms that are
   in kit/glossary.js use [[term]] (the explanation). Others are written out, English term then the Croatian in
   parentheses at the first mention (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title,
   concept). Names, addresses, durations and NXDOMAIN are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Razrješavanje imena na klijentu PC-07: upisano ime, zatim redom datoteka hosts, predmemorija DNS klijenta, DNS poslužitelji, LLMNR i NetBIOS, svaki sa svojim ishodom; desno imena za koja se pita DNS i sadržaj predmemorije',

      // client card
      lookup: 'upit {n}',
      typedHead: 'upisano:',
      flushedNote: 'predmemorija ispražnjena',
      backUp: 'preferirani opet radi',
      prev: 'upit 1: {res}',

      // the pipeline
      stHosts: 'Datoteka hosts',
      stCache: 'Predmemorija DNS klijenta',
      stDns: 'DNS poslužitelji',
      stLlmnr: 'LLMNR',
      stNetbios: 'NetBIOS',
      subLlmnr: 'višeodredišno slanje na segmentu',
      subNetbios: 'razašiljanje na segmentu',
      hostsEmpty: 'datoteka je prazna',
      rolePref: 'preferirani',
      roleAlt: 'zamjenski',
      srvUp: 'radi',
      srvDown: 'ne radi',
      kindPublic: 'javni',
      rNotTried: 'nije pokušano',
      rNext: 'sljedeće',
      rSkipOff: 'isključeno',
      rSkipDot: 'ne za ime s točkom',
      rSkipNeg: 'ne pita se: negativni zapis',
      rHostsNo: 'nema retka za {name}',
      rCacheNo: 'nema zapisa',
      rNeg: '{name}: ne postoji, još {left}',
      rTimeout: 'bez odgovora, {w}',
      rLinkNo: 'nitko se nije javio',
      rLinkOk: '{ip}, {who}: „to sam ja”',
      whoLaptop: 'prijenosno računalo',

      // right column
      candHead: 'Imena za koja se pita DNS',
      srcTyped: 'kako je upisano',
      srcPrimary: 'primarni sufiks',
      srcDevolution: 'devolucija',
      srcConnection: 'sufiks veze',
      srcList: 'popis sufiksa',
      candSkipped: '{name}: ne pita se, popis zamjenjuje primarni sufiks',
      cacheEmpty: 'prazna',
      cName: 'ime',
      cAnswer: 'odgovor',
      cLeft: 'još',
      cFrom: 'izvor',
      cNeg: 'ne postoji',
      cForever: 'ne istječe',

      // result
      resOk: 'Rezultat: {name} → {ip}, {via}',
      resNo: 'Rezultat: ime {name} nije razriješeno',
      resOkShort: '{ip}, {via}',
      resNoShort: 'nije razriješeno',
      viaHosts: 'iz datoteke hosts',
      viaCache: 'iz predmemorije',
      viaDns: 'iz DNS-a',
      viaLlmnr: 'preko LLMNR-a',
      viaNetbios: 'preko NetBIOS-a',

      // params
      pTyped: 'Upisano ime',
      oFs1: 'fs1',
      oFsFq: 'fs1.corp.example',
      oFsDot: 'fs1.corp.example.',
      oPrinter: 'printer',
      oShortDot: 'fs1.',
      pSearch: 'Popis sufiksa (GPO)',
      oNone: 'nema',
      oExample: 'example.com',
      pAlt: 'Zamjenski DNS',
      oAlt11: '10.0.0.11',
      oAltPub: '203.0.113.53',
      pPrefUp: '10.0.0.10 radi',
      pHosts: 'Redak u hosts',
      pLlmnr: 'LLMNR',
      pRepeat: 'Ponovi +60 s',
      pFlush: 'Isprazni prije',
      flushNeedsRepeat: 'Samo uz ponavljanje.',

      // presets
      prShort: 'Kratko ime',
      prStale: 'Stari hosts',
      prLlmnr: 'LLMNR odgovara',
      prPublic: 'Javni DNS',
      prList: 'Popis sufiksa',
      prDot: 'Točka na kraju',

      // legend
      lgOk: 'odgovor',
      lgNo: 'nema odgovora',
      lgNeg: 'negativni zapis',
      lgTimeout: 'isteklo vrijeme',
      lgNext: 'sljedeće',
      lgChanged: 'u ovom koraku',

      // captions
      capStart: 'Da nađe adresu za {name}, PC-07 ide ovim redom: datoteka hosts, predmemorija DNS klijenta, DNS poslužitelji, a tek onda upit svima na lokalnom segmentu (LLMNR, NetBIOS). Pritisni →.',
      startHosts: 'U datoteci hosts stoji stari redak {line}.',
      startDown: 'Preferirani poslužitelj {srv} ne radi.',
      startList: 'GPO je postavio *suffix search list* (popis sufiksa za pretraživanje): {list}.',
      capRepeat: '{t} kasnije klijent ponovno traži isto ime.',
      capRepeatBack: 'Preferirani poslužitelj opet radi.',
      capFlushed: 'Prije toga predmemorija je ispražnjena, a reci iz datoteke hosts odmah su ponovno učitani.',
      capHostsOk: 'Datoteka hosts ima {name} → {ip}. Ona se gleda prva i pobjeđuje: nijedan DNS poslužitelj nije ni pitan.',
      capHostsStale: 'A DNS bi rekao {real}: poslužitelj je odavno preseljen, a redak je ostao.',
      capHostsNo: 'U datoteci hosts nema retka za {name}.',
      capCacheNo: 'U predmemoriji nema zapisa za {name}.',
      capCacheOk: 'Predmemorija ima {name} → {ip} (još {left}): odgovor stiže, a da se DNS ni ne pita.',
      capCacheNeg: 'Predmemorija ima negativni zapis za {name}: „ne postoji”, još {left}. Dok ne istekne, za to ime ne pita se nijedan DNS poslužitelj.',
      capNegBack: 'Ni preferirani, iako opet radi.',
      capSuffix: 'Kratko ime {short} dobiva sufiks: klijent pita DNS za {fqdn} — *primary DNS suffix* (primarni DNS sufiks) dodaje se sam.',
      capList: 'Kratko ime {short} dobiva sufiks s popisa: klijent pita DNS samo za {fqdn}. Popis zamjenjuje primarni sufiks, pa se za {skipped} uopće ne pita.',
      capDot: 'Ime završava točkom: to je potpuno ime i pita se točno kako je upisano, bez sufiksa.',
      capMulti: 'Ime ima točku, pa se pita kako je upisano, bez sufiksa.',
      capNextName: 'Sljedeće ime: {fqdn}.',
      capDnsOk: '{srv} odgovara: {fqdn} → {ip}. Odgovor ide u predmemoriju na {ttl}.',
      capDnsNx: '{srv} odgovara NXDOMAIN: {fqdn} ne postoji. I to se pamti, kao negativni zapis na {neg}.',
      capNxPreferred: 'Preferirani poslužitelj odgovorio je NXDOMAIN. To je odgovor, pa zamjenski poslužitelj nije ni pitan.',
      capNxPublic: 'Javni poslužitelj ne poznaje internu zonu {zone}.',
      capTimeoutMore: '{srv} ne odgovara ni nakon {w}. Tek sada klijent pita zamjenski poslužitelj {alt}.',
      capTimeoutGiveUp: 'Nijedan poslužitelj ne odgovara; {total} nakon prvog upita klijent odustaje od {fqdn}. Isteklo vrijeme nije odgovor, pa se ništa ne pamti.',
      capLlmnrOk: 'DNS nije dao adresu, pa klijent pita sve na segmentu: LLMNR, *multicast* (višeodredišno slanje) na {addr}. Javlja se {ip}: „{name} sam ja”. Nitko to ne provjerava — mogao se javiti bilo tko na segmentu.',
      capLlmnrNo: 'DNS nije dao adresu, pa klijent pita sve na segmentu: LLMNR na {addr}. Za {name} nitko se ne javlja.',
      capLlmnrOff: 'LLMNR je isključen.',
      capNbOk: 'Zadnji pokušaj, NetBIOS: *broadcast* (razašiljanje) na segmentu. Javlja se {ip}: „{name} sam ja”. Ni ovdje nitko ne provjerava tko je odgovorio.',
      capNbNo: 'Zadnji pokušaj, NetBIOS razašiljanje na segmentu: nitko se ne javlja.',
      capFail: 'Ime {name} nije razriješeno.',
      capFailList: 'Ime {name} nije razriješeno, iako {real} postoji: s popisom sufiksa pita se samo ono što je na popisu.',
      capFailNeg: 'Ime {name} i dalje nije razriješeno: negativni zapis vrijedi još {left} ili dok se predmemorija ne isprazni.',
      capNoFallback: 'Ime ima točku, pa LLMNR i NetBIOS ne dolaze na red.',

      explain: '<p>Windows klijent ime razrješava ovim redom: <b>datoteka hosts</b>, zatim [[cache]] DNS klijenta, ' +
        'zatim DNS poslužitelji, a tek kad DNS ne da adresu, upit svima na lokalnom segmentu: LLMNR pa NetBIOS. Prvi pozitivan odgovor ' +
        'završava potragu. Reci iz datoteke hosts učitavaju se u predmemoriju i pobjeđuju DNS.</p>' +
        '<p>Kratko ime (<em lang="en">single-label name</em>, ime od jedne oznake) nikad ne ide DNS-u takvo kakvo jest: klijent mu dodaje ' +
        'sufikse. Bez popisa sufiksa to su primarni DNS sufiks, njegove nadređene domene do dvije oznake (devolucija) i ' +
        'sufiks veze. Popis sufiksa, postavljen npr. GPO-om, sve to zamjenjuje: pita se samo ono što je na popisu. Ime s ' +
        'točkom na kraju pita se točno kako je upisano.</p>' +
        '<p>Svako ime ide najprije preferiranom poslužitelju (<em lang="en">preferred</em>). Zamjenski poslužitelj (<em lang="en">alternate</em>) pita se samo ' +
        'ako preferirani ne odgovori u 1 s; ako ne odgovori nitko, klijent odustaje nakon 10 s. NXDOMAIN („ne postoji”) je ' +
        'odgovor: zamjenski se tada ne pita, a odgovor se pamti do 900 s — [[negative caching]]. Pozitivan odgovor pamti se ' +
        'onoliko koliko kaže njegov TTL, najviše dan. Pražnjenje predmemorije briše oba, ali reci iz datoteke hosts odmah ' +
        'se vraćaju.</p>' +
        '<p>LLMNR (višeodredišno slanje, 224.0.0.252 i FF02::1:3, UDP 5355) i NetBIOS (razašiljanje) pitaju sve na segmentu, i to ' +
        'samo za ime bez točke. Odgovoriti može bilo tko, a klijent uzima prvi odgovor i ništa ne provjerava; zato ih ' +
        'mnoge mreže isključuju: LLMNR GPO-om, NetBIOS u postavkama mrežne kartice ili DHCP-om.</p>' +
        '<p>Česte zablude: zamjenski poslužitelj ne pita se kad preferirani kaže „ne postoji”, nego samo kad ne odgovori; ' +
        'redak u datoteci hosts nije zadnja nada nego prvo što se gleda; kratko ime ne pita se takvo kakvo jest, a popis ' +
        'sufiksa zamjenjuje primarni sufiks.</p>'
    },
    en: {
      stage: 'Name resolution on the client PC-07: the typed name, then in order the hosts file, the DNS client cache, the DNS servers, LLMNR and NetBIOS, each with its outcome; on the right the names DNS is asked for and the cache contents',

      lookup: 'lookup {n}',
      typedHead: 'typed:',
      flushedNote: 'cache flushed',
      backUp: 'preferred back up',
      prev: 'lookup 1: {res}',

      stHosts: 'Hosts file',
      stCache: 'DNS client cache',
      stDns: 'DNS servers',
      stLlmnr: 'LLMNR',
      stNetbios: 'NetBIOS',
      subLlmnr: 'multicast on the segment',
      subNetbios: 'broadcast on the segment',
      hostsEmpty: 'the file is empty',
      rolePref: 'preferred',
      roleAlt: 'alternate',
      srvUp: 'up',
      srvDown: 'down',
      kindPublic: 'public',
      rNotTried: 'not tried',
      rNext: 'next',
      rSkipOff: 'turned off',
      rSkipDot: 'not for a name with a dot',
      rSkipNeg: 'not asked: negative entry',
      rHostsNo: 'no line for {name}',
      rCacheNo: 'no entry',
      rNeg: '{name}: does not exist, {left} left',
      rTimeout: 'no answer, {w}',
      rLinkNo: 'nobody answered',
      rLinkOk: '{ip}, {who}: "that\'s me"',
      whoLaptop: 'a laptop',

      candHead: 'Names DNS is asked for',
      srcTyped: 'as typed',
      srcPrimary: 'primary suffix',
      srcDevolution: 'devolution',
      srcConnection: 'connection suffix',
      srcList: 'search list',
      candSkipped: '{name}: not asked, the list replaces the primary suffix',
      cacheEmpty: 'empty',
      cName: 'name',
      cAnswer: 'answer',
      cLeft: 'left',
      cFrom: 'source',
      cNeg: 'does not exist',
      cForever: 'no expiry',

      resOk: 'Result: {name} → {ip}, {via}',
      resNo: 'Result: the name {name} is not resolved',
      resOkShort: '{ip}, {via}',
      resNoShort: 'not resolved',
      viaHosts: 'from the hosts file',
      viaCache: 'from the cache',
      viaDns: 'from DNS',
      viaLlmnr: 'by LLMNR',
      viaNetbios: 'by NetBIOS',

      pTyped: 'Typed name',
      oFs1: 'fs1',
      oFsFq: 'fs1.corp.example',
      oFsDot: 'fs1.corp.example.',
      oPrinter: 'printer',
      oShortDot: 'fs1.',
      pSearch: 'Suffix search list (GPO)',
      oNone: 'none',
      oExample: 'example.com',
      pAlt: 'Alternate DNS',
      oAlt11: '10.0.0.11',
      oAltPub: '203.0.113.53',
      pPrefUp: '10.0.0.10 up',
      pHosts: 'Hosts line',
      pLlmnr: 'LLMNR',
      pRepeat: 'Repeat +60 s',
      pFlush: 'Flush first',
      flushNeedsRepeat: 'Only with the repeat.',

      prShort: 'Short name',
      prStale: 'Stale hosts',
      prLlmnr: 'LLMNR answers',
      prPublic: 'Public DNS',
      prList: 'Search list',
      prDot: 'Final dot',

      lgOk: 'answer',
      lgNo: 'no answer',
      lgNeg: 'negative entry',
      lgTimeout: 'timeout',
      lgNext: 'next',
      lgChanged: 'this step',

      capStart: 'To find the address of {name}, PC-07 goes in this order: hosts file, DNS client cache, DNS servers, and only then a question to everyone on the local segment (LLMNR, NetBIOS). Press →.',
      startHosts: 'The hosts file has an old line {line}.',
      startDown: 'The preferred server {srv} is down.',
      startList: 'A GPO set the suffix search list {list}.',
      capRepeat: '{t} later the client looks up the same name again.',
      capRepeatBack: 'The preferred server is back.',
      capFlushed: 'Before that the cache was flushed, and the hosts file lines were loaded straight back in.',
      capHostsOk: 'The hosts file has {name} → {ip}. It is checked first and wins: no DNS server is asked at all.',
      capHostsStale: 'DNS would have said {real}: the server moved long ago, and the line stayed.',
      capHostsNo: 'The hosts file has no line for {name}.',
      capCacheNo: 'The cache has no entry for {name}.',
      capCacheOk: 'The cache has {name} → {ip} ({left} left): the answer comes without asking DNS.',
      capCacheNeg: 'The cache holds a negative entry for {name}: "does not exist", {left} left. Until it expires, no DNS server is asked for that name.',
      capNegBack: 'Not even the preferred one, although it is back.',
      capSuffix: 'The short name {short} gets a suffix: the client asks DNS for {fqdn}; the primary DNS suffix is appended automatically.',
      capList: 'The short name {short} gets the suffix from the list: the client asks only for {fqdn}. The list replaces the primary suffix, so {skipped} is never asked.',
      capDot: 'The name ends with a dot: it is fully qualified and asked exactly as typed, with no suffix.',
      capMulti: 'The name has a dot, so it is asked as typed, with no suffix.',
      capNextName: 'Next name: {fqdn}.',
      capDnsOk: '{srv} answers: {fqdn} → {ip}. The answer goes into the cache for {ttl}.',
      capDnsNx: '{srv} answers NXDOMAIN: {fqdn} does not exist. That is remembered too, as a negative entry for {neg}.',
      capNxPreferred: 'The preferred server answered NXDOMAIN. That\'s an answer, so the alternate server isn\'t asked at all.',
      capNxPublic: 'The public resolver does not know the internal zone {zone}.',
      capTimeoutMore: '{srv} does not answer within {w}. Only now does the client ask the alternate {alt}.',
      capTimeoutGiveUp: 'No server answers; {total} after the first query the client gives up on {fqdn}. A timeout is not an answer, so nothing is cached.',
      capLlmnrOk: 'DNS gave no address, so the client asks everyone on the segment: LLMNR multicast to {addr}. {ip} answers: "I am {name}". Nobody checks it: anyone on the segment could have answered.',
      capLlmnrNo: 'DNS gave no address, so the client asks everyone on the segment: LLMNR to {addr}. Nobody answers for {name}.',
      capLlmnrOff: 'LLMNR is turned off.',
      capNbOk: 'The last try, NetBIOS: a broadcast on the segment. {ip} answers: "I am {name}". Nobody checks who answered here either.',
      capNbNo: 'The last try, a NetBIOS broadcast on the segment: nobody answers.',
      capFail: 'The name {name} is not resolved.',
      capFailList: 'The name {name} is not resolved, although {real} exists: with a search list only the listed suffixes are tried.',
      capFailNeg: 'The name {name} is still not resolved: the negative entry is kept another {left} or until the cache is flushed.',
      capNoFallback: 'The name has a dot, so LLMNR and NetBIOS do not come into it.',

      explain: '<p>A Windows client resolves a name in this order: the <b>hosts file</b>, then the DNS client ' +
        '[[cache]], then the DNS servers, and only when DNS gives no address, a question to everyone on the local segment: LLMNR, then ' +
        'NetBIOS. The first positive answer ends the search. Lines of the hosts file are loaded into the cache and win ' +
        'over DNS.</p>' +
        '<p>A short (single-label) name never goes to DNS as it is: the client appends suffixes. Without a search list ' +
        'these are the primary DNS suffix, its parent domains down to two labels (devolution) and the connection-specific ' +
        'suffix. A suffix search list, set by a GPO for example, replaces all of them: only what is on the list is asked. ' +
        'A name with a final dot is asked exactly as typed.</p>' +
        '<p>Every name goes to the preferred server first. The alternate server is asked only if the preferred does not ' +
        'answer within 1 s; if nobody answers, the client gives up after 10 s. NXDOMAIN ("does not exist") is an answer: ' +
        'the alternate is not asked, and the answer is kept for up to 900 s ([[negative caching]]). A positive answer is kept ' +
        'as long as its TTL says, a day at most. Flushing the cache clears both, but the hosts file lines come straight ' +
        'back.</p>' +
        '<p>LLMNR (multicast, 224.0.0.252 and FF02::1:3, UDP 5355) and NetBIOS (broadcast) ask everyone on the segment, ' +
        'and only for a name without a dot. Anyone can answer; the client takes the first answer and checks nothing, ' +
        'which is why many networks turn them off: LLMNR by GPO, NetBIOS in the network adapter settings or by DHCP.</p>' +
        '<p>Common mistakes: the alternate server is not asked when the preferred says "does not exist", only when it ' +
        'does not answer; a hosts line is not a last resort but the first thing checked; a short name is not asked as it ' +
        'is, and a search list replaces the primary suffix.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
