/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cgnat, in both languages (docs/sim-ui.md §9). Croatian follows the URM book (ch. 08 and 11)
   and the nat page: usmjernik, tablica prijevoda, zapis, privatna i javna adresa, prosljeđivanje portova. None of the
   NAT terms is in kit/glossary.js, so the pairs are written out here and listed in NOTES.md ("Term pairs").
   *text* in a caption is an English term, set in italics by the page (the Croatian term rule). Addresses, ports and
   the letters A, B, C are data, not words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pretplatnici s kućnim usmjernicima, operatorski NAT, internet, poslužitelj i klijent izvana, s tablicama prijevoda i paketom na žici',
      direction: 'Smjer',
      dirOut: 'Odlazno',
      dirIn: 'Dolazno',
      senders: 'Vezu otvara',
      sendersOne: 'samo A',
      sendersAll: 'svaki pretplatnik',
      portForward: 'Prosljeđivanje porta 8080 na usmjerniku A',
      portForwardHint: 'Stalan zapis na kućnom usmjerniku A: 8080 ide na 192.168.1.10:8080.',
      subscribers: 'Pretplatnika iza CGN-a',
      presetWorks: 'Odlazna veza radi',
      presetWorksHint: 'A otvara vezu prema poslužitelju. Koliko puta se izvorišna adresa prepiše i što poslužitelj vidi?',
      presetDropped: 'Dolazni paket pada',
      presetDroppedHint: 'Netko izvana šalje paket na 203.0.113.5:62050. Dokle stigne?',
      presetForward: 'Prosljeđivanje ne pomaže',
      presetForwardHint: 'A je na svom usmjerniku proslijedio port 8080. Može li klijent izvana doći do njega?',
      presetShared: 'Jedna adresa, dva doma',
      presetSharedHint: 'A i B se spajaju na isti poslužitelj. Po čemu ih poslužitelj razlikuje?',
      legPrivate: 'privatna adresa',
      legShared: 'dijeljena 100.64/10',
      legPublic: 'javna adresa',
      legNat: 'NAT i CGN',
      legDrop: 'paket odbačen',
      legChanged: 'prepisano / korišteno',
      host: 'računalo {id}',
      home: 'kućni usmjernik {id}',
      cgn: 'operatorski NAT',
      internet: 'internet',
      server: 'poslužitelj',
      client: 'klijent izvana',
      tableEmpty: 'tablica prijevoda je prazna',
      noteNew: 'novi',
      noteHit: 'pronađen',
      noteForward: 'prosljeđivanje',
      noteUnread: 'nitko ga ne čita',
      wireTitle: 'Paket na žici',
      wireNone: 'nijedan paket nije na žici',
      src: 'izvor',
      dst: 'odredište',
      before: 'prije',
      dropped: 'odbačen: {where}',
      dropCgn: 'CGN nema zapis',
      dropNet: 'internet ne prenosi 100.64/10',
      seenTitle: 'poslužitelj vidi:',
      seenEmpty: 'još ništa',
      chipOut: 'zahtjev',
      chipBack: 'odgovor',
      chipIn: 'paket izvana',
      bSends: 'šalje',
      bTranslates: 'prepisuje izvor',
      bReverses: 'prepisuje odredište',
      bReceives: 'prima',
      bReplies: 'odgovara',
      bMiss: 'nema zapisa: odbacuje',
      bNever: 'ništa ne stiže',
      bDropped: 'odbacio je paket',
      bNoAnswer: 'bez odgovora',
      capStart: 'Pretplatnik A ({a}) otvara vezu prema poslužitelju {s}. Paket prolazi kroz dva NAT-a: kućni usmjernik A ' +
        'i *carrier-grade NAT* (operatorski NAT, CGN), čija je javna adresa {pub}. Između njih je ' +
        '*shared address space* (dijeljeni adresni prostor) 100.64.0.0/10. Pritisni →.',
      capStartAll: 'Svaki pretplatnik otvara po jednu vezu prema {s}, sa svog računala {a}: svi domovi koriste isti ' +
        'privatni raspon. Svi izlaze kroz isti *carrier-grade NAT* (operatorski NAT, CGN) i dijele jednu javnu adresu {pub}. ' +
        'Pritisni →.',
      capStartIn: 'Klijent izvana ({c}) šalje paket na {pub}:{port}, javnu adresu koju A vidi kad pita „koja je moja ' +
        'adresa”. Tablice prijevoda su prazne: nitko iznutra još nije otvorio vezu. Pritisni →.',
      capStartFwd: 'A je na svom kućnom usmjerniku uključio *port forwarding* (prosljeđivanje *portova*): sve na ' +
        '{fwd} ide na {inside}. Klijent izvana ({c}) pokušava doći do toga preko {pub}:{port}. Pritisni →.',
      capSend: '{who} šalje paket iz kućne mreže: izvor je njegova privatna adresa {src}.',
      capSendSame: '{who} šalje paket s {src}, iste adrese kao A: svaki dom ima svoju kućnu mrežu, i to nikome ne smeta.',
      capNat1: 'Kućni usmjernik {who} prepisuje izvor {from} u {to}, upisuje {rec} i šalje paket operatoru. {to} nije ' +
        'javna adresa: to je adresa iz dijeljenog prostora 100.64/10, kojeg na internetu nema.',
      capNat2: 'CGN prepisuje izvor drugi put, {from} u {to}, i upisuje {rec} u svoju tablicu. Poslužitelj vidi samo ' +
        '{to}: adresu operatora i *port* koji je dodijelio CGN.',
      capNat2Shared: 'CGN prepisuje {from} u {to}. {who} izlazi s iste javne adrese kao {prev}: razlikuje ih samo ' +
        '*port* koji je dodijelio CGN. Javna adresa više ne određuje jedan dom.',
      capReply: 'Poslužitelj odgovara na {dst}, jedinu adresu koju zna. Paket stiže do CGN-a.',
      capBack2: 'CGN u svojoj tablici pronalazi zapis za {from} i odredište prepisuje u {to}: paket ide kućnom usmjerniku A.',
      capBack1: 'Kućni usmjernik A pronalazi svoj zapis i odredište prepisuje u {to}. Odgovor je stigao kući: ' +
        'dva prijevoda van, dva natrag, sva četiri iz dvaju zapisa koje je napravio odlazni paket.',
      capProbe: 'Paket izvana putuje internetom prema {dst}. Internet ga zna dostaviti: {pub} je javna adresa CGN-a.',
      capArrive: 'CGN traži zapis za {dst} i ne nalazi ga: nijedan pretplatnik nije otvorio vezu koja bi ga ' +
        'napravila. CGN paket {drop} prije nego što dođe do bilo kojeg kućnog usmjernika.',
      capArriveFwd: 'Dolazni paket na {dst}: CGN nema zapis za taj *port*, pa ga {drop} prije nego što dođe do ' +
        'kućnog usmjernika. Prosljeđivanje *portova* na kućnom usmjerniku nikad se ne pročita.',
      capAfter: 'Nijedan kućni usmjernik ne vidi paket. Dolazne veze kroz CGN ne nastaju same: zapis upisuje samo ' +
        'odlazni paket, a pretplatnik u tablicu CGN-a u pravilu ne može upisati ništa.',
      capAfterFwd: 'Prosljeđivanje na usmjerniku A je ispravno, ali paket do njega nikad ne dođe: umro je jedan NAT ' +
        'ranije, kod operatora, gdje pretplatnik u pravilu ne može upisati stalan zapis.',
      capDirect: 'Klijent pokuša izravno na {dst}, adresu usmjernika A. {dst} je u dijeljenom prostoru 100.64/10: ' +
        'taj se prostor ne prenosi preko interneta, a operatori ga filtriraju na granici. Paket se {drop} na putu.',
      dropWord: 'odbacuje',
      dropWordNet: 'odbacuje',
      recWord: 'novi zapis',
      listAnd: ' i ',
      explain: '<p><strong>Dvostruki NAT.</strong> Kad operator koristi <em lang="en">carrier-grade NAT</em> (operatorski ' +
        'NAT, CGN), kućni usmjernik više nema javnu adresu. Prvi NAT, u kući, prevodi privatnu adresu u adresu iz ' +
        '<em lang="en">shared address space</em> (dijeljeni adresni prostor) 100.64.0.0/10; drugi, kod operatora, tu ' +
        'adresu prevodi u javnu, koju dijeli s mnogo pretplatnika. Odlazni paket prepiše se dvaput, a odgovor dvaput ' +
        'unatrag, svaki put iz zapisa koji je napravio odlazni paket.</p>' +
        '<p><strong>Dijeljeni adresni prostor.</strong> 100.64.0.0 – 100.127.255.255 nije javan ni jednak trima ' +
        'klasičnim privatnim rasponima: rezerviran je za veze između operatorskog NAT-a i opreme kod pretplatnika ' +
        '(RFC 6598). Internet ga ne prenosi.</p>' +
        '<p><strong>Zašto prosljeđivanje ne pomaže.</strong> Sesije kroz NAT jednosmjerne su na svakom NAT-u posebno. ' +
        'Stalan zapis (<em lang="en">port forwarding</em>, prosljeđivanje <em lang="en">portova</em>) na kućnom ' +
        'usmjerniku ispravan je, ali dolazni paket umre već na CGN-u, gdje zapisa nema, a pretplatnik nema nadzor nad ' +
        'operatorskim NAT-om. Preporuke za CGN traže da pretplatniku ponudi protokol kojim sam zatraži zapis na CGN-u; ' +
        'gdje ga operator ne nudi (ni zasebnu javnu adresu), usluga kod kuće izvana nije dostupna. Trajni izlaz je IPv6.</p>' +
        '<p><strong>Jedna adresa, mnogo domova.</strong> Svi pretplatnici iza istog CGN-a izlaze s iste javne adrese. ' +
        'Javna adresa sama više ne određuje jedan dom: treba i <em lang="en">port</em> i trenutak.</p>'
    },
    en: {
      stage: 'Subscribers with home routers, the carrier NAT, the internet, a server and an outside client, with the translation tables and the packet on the wire',
      direction: 'Direction',
      dirOut: 'Outbound',
      dirIn: 'Inbound',
      senders: 'Connection opened by',
      sendersOne: 'A only',
      sendersAll: 'every subscriber',
      portForward: 'Forward port 8080 on router A',
      portForwardHint: 'A permanent entry on home router A: 8080 goes to 192.168.1.10:8080.',
      subscribers: 'Subscribers behind the CGN',
      presetWorks: 'Outbound works',
      presetWorksHint: 'A opens a connection to the server. How many times is the source rewritten, and what does the server see?',
      presetDropped: 'Inbound is dropped',
      presetDroppedHint: 'Someone outside sends a packet to 203.0.113.5:62050. How far does it get?',
      presetForward: 'Forwarding does not help',
      presetForwardHint: 'A has forwarded port 8080 on their router. Can a client outside reach it?',
      presetShared: 'One address, two homes',
      presetSharedHint: 'A and B connect to the same server. How does the server tell them apart?',
      legPrivate: 'private address',
      legShared: 'shared 100.64/10',
      legPublic: 'public address',
      legNat: 'NAT and CGN',
      legDrop: 'packet dropped',
      legChanged: 'rewritten / used',
      host: 'host {id}',
      home: 'home router {id}',
      cgn: 'carrier NAT',
      internet: 'internet',
      server: 'server',
      client: 'outside client',
      tableEmpty: 'translation table is empty',
      noteNew: 'new',
      noteHit: 'found',
      noteForward: 'forward',
      noteUnread: 'never read',
      wireTitle: 'Packet on the wire',
      wireNone: 'no packet on the wire',
      src: 'source',
      dst: 'destination',
      before: 'before',
      dropped: 'dropped: {where}',
      dropCgn: 'the CGN has no entry',
      dropNet: 'the internet does not carry 100.64/10',
      seenTitle: 'the server sees:',
      seenEmpty: 'nothing yet',
      chipOut: 'request',
      chipBack: 'reply',
      chipIn: 'packet from outside',
      bSends: 'sends',
      bTranslates: 'rewrites source',
      bReverses: 'rewrites destination',
      bReceives: 'receives',
      bReplies: 'replies',
      bMiss: 'no entry: drops',
      bNever: 'nothing arrives',
      bDropped: 'dropped the packet',
      bNoAnswer: 'no answer',
      capStart: 'Subscriber A ({a}) opens a connection to the server {s}. The packet crosses two NATs: home router A ' +
        'and the *carrier-grade NAT* (CGN), whose public address is {pub}. Between them is the *shared address ' +
        'space* 100.64.0.0/10. Press →.',
      capStartAll: 'Every subscriber opens one connection to {s}, each from its own host {a}: every home uses the same ' +
        'private range. Behind the *carrier-grade NAT* (CGN) they all share one public address, {pub}. Press →.',
      capStartIn: 'A client outside ({c}) sends a packet to {pub}:{port}, the public address A sees when asking "what ' +
        'is my address". The translation tables are empty: nobody inside has opened a connection yet. Press →.',
      capStartFwd: 'A has turned on *port forwarding* on their home router: everything to {fwd} goes to {inside}. A ' +
        'client outside ({c}) tries to reach it through {pub}:{port}. Press →.',
      capSend: '{who} sends a packet from the home network: the source is its private address {src}.',
      capSendSame: '{who} sends a packet from {src}, the same address as A: each home has its own network, and that ' +
        'bothers nobody.',
      capNat1: 'Home router {who} rewrites the source {from} to {to}, writes a {rec} and sends the packet to the ' +
        'carrier. {to} is not a public address: it is an address in the shared space 100.64/10, which the internet does not carry.',
      capNat2: 'The CGN rewrites the source a second time, {from} to {to}, and writes a {rec} in its table. The server ' +
        'sees only {to}: the carrier\'s address and a *port* the CGN chose.',
      capNat2Shared: 'The CGN rewrites {from} to {to}. {who} leaves from the same public address as {prev}: only the ' +
        'CGN-assigned *port* tells them apart. The public address no longer identifies one home.',
      capReply: 'The server replies to {dst}, the only address it knows. The packet reaches the CGN.',
      capBack2: 'The CGN finds the entry for {from} in its table and rewrites the destination to {to}: the packet goes ' +
        'to home router A.',
      capBack1: 'Home router A finds its entry and rewrites the destination to {to}. The reply is home: two ' +
        'translations out, two back, all four from the two entries the outbound packet made.',
      capProbe: 'The packet from outside crosses the internet towards {dst}. The internet can deliver it: {pub} is the ' +
        'CGN\'s public address.',
      capArrive: 'The CGN looks for an entry for {dst} and finds none: no subscriber opened a connection that would ' +
        'have made one. The CGN {drop} the packet before it reaches any home router.',
      capArriveFwd: 'An inbound packet to {dst}: the CGN has no entry for that *port*, so it {drop} it before it ' +
        'reaches the home router. The *port forwarding* on the home router is never read.',
      capAfter: 'No home router sees the packet. Inbound connections through a CGN do not appear by themselves: only ' +
        'an outbound packet writes an entry, and a subscriber usually cannot write anything into the CGN\'s table.',
      capAfterFwd: 'The forward on router A is correct, but the packet never gets there: it died one NAT earlier, at ' +
        'the carrier, where the subscriber usually cannot add a permanent entry.',
      capDirect: 'The client tries {dst}, router A\'s own address, directly. {dst} is in the shared space 100.64/10: ' +
        'that space is not carried across the internet, and carriers filter it at their borders. The packet is {drop} on the way.',
      dropWord: 'drops',
      dropWordNet: 'dropped',
      recWord: 'new entry',
      listAnd: ' and ',
      explain: '<p><strong>Double NAT.</strong> Behind a <em>carrier-grade NAT</em> (CGN) the home router no longer ' +
        'has a public address. The first NAT, at home, translates the private address into one from the <em>shared ' +
        'address space</em> 100.64.0.0/10; the second, at the carrier, translates that into a public address it ' +
        'shares among many subscribers. An outbound packet is rewritten twice, and its reply twice back, each time ' +
        'from an entry the outbound packet made.</p>' +
        '<p><strong>Shared address space.</strong> 100.64.0.0 – 100.127.255.255 is neither public nor one of the ' +
        'three classic private ranges: it is reserved for the links between the carrier NAT and the equipment at the ' +
        'subscriber (RFC 6598). The internet does not carry it.</p>' +
        '<p><strong>Why port forwarding does not help.</strong> Sessions through NAT are one-way, at each NAT on its ' +
        'own. A permanent entry (<em>port forwarding</em>) on the home router is correct, but the inbound packet dies ' +
        'at the CGN already, where there is no entry, and the subscriber has no control over the carrier\'s NAT. ' +
        'The requirements for CGNs ask for a protocol the subscriber can use to request an entry on the CGN; where the ' +
        'carrier offers none (nor a public address of their own), a service at home cannot be reached from outside. The ' +
        'lasting way out is IPv6.</p>' +
        '<p><strong>One address, many homes.</strong> Every subscriber behind the same CGN leaves from the same public ' +
        'address. The public address alone no longer identifies one home: the <em>port</em> and the time are needed ' +
        'too.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
