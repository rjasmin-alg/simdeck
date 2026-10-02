/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of nat, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM book's
   fragment nat.html and chapter 11); English is written for simdeck. Croatian terms follow the book: usmjernik,
   tablica prijevoda, zapis, unutarnja i vanjska adresa, odredište, izvorišni port, prosljeđivanje portova. None of
   them is in kit/glossary.js (its "host" is the UL book's "domaćin", which the URM book does not use), so the pairs
   are written out in both tables and listed in NOTES.md. Addresses, ports and host names (A, B, R) are data, not
   words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Unutarnja mreža s računalima A i B, usmjernik R i internet, paket prije i nakon usmjernika i tablica prijevoda',
      mode: 'Način prevođenja',
      modePat: 'PAT: adresa i port',
      modeBasic: 'Basic NAT, jedna vanjska adresa',
      modeBasic2: 'Basic NAT, dvije vanjske adrese',
      second: 'Drugi odlazni paket šalje',
      secondB: 'B',
      secondA: 'A još jednom',
      probe: 'Paket izvana stiže na port',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 11, Primjer 4. Koje vanjske portove R dodijeli A-u i B-u, iako oba koriste isti ' +
        'izvorišni port 51000? I što bude s paketom izvana na port 61050?',
      presetOpen: 'Paket izvana na 61000',
      presetOpenHint: 'Paket izvana stiže na port 61000. Prolazi li, i po čemu se to razlikuje od porta 61050?',
      presetTwice: 'A dvaput',
      presetTwiceHint: 'A dvaput šalje paket na isti spoj. Dodaje li R drugi zapis?',
      presetBasic: 'Basic NAT, jedna adresa',
      presetBasicHint: 'Basic NAT prevodi samo adresu, a R ima samo jednu vanjsku. Što bude s paketom računala B?',
      presetBasic2: 'Basic NAT, dvije adrese',
      presetBasic2Hint: 'R sad ima dvije vanjske adrese. Što prepisuje, a što ostavlja kako jest?',
      legendChanged: 'R je prepisao',
      legendNew: 'novi zapis',
      legendDrop: 'paket odbačen',
      insideNet: 'unutarnja mreža',
      router: 'usmjernik',
      outsideAddr: 'vanjska adresa',
      outsideAddrs: 'vanjske adrese',
      internet: 'internet',
      server: 'poslužitelj',
      someone: 'netko izvana',
      pktInside: 'paket u unutarnjoj mreži',
      pktOutside: 'paket na internetu',
      src: 'izvor',
      dst: 'odredište',
      anyOutside: 'neka adresa izvana',
      dropped: 'R ga odbacuje',
      notSent: 'paket nije poslan',
      noPacket: 'još nema paketa',
      tableTitle: 'Tablica prijevoda usmjernika R',
      colInside: 'Unutarnja adresa',
      colOutside: 'Vanjska adresa',
      colDest: 'Odredište',
      tableEmpty: 'Tablica prijevoda je prazna: nijedno računalo još nije poslalo odlazni paket.',
      tagNew: 'novi zapis',
      tagUsed: 'R koristi ovaj zapis',
      listAnd: ' i ',
      captionStart: 'A ({a}) i B ({b}) spajaju se na poslužitelj {srv}, oba s izvorišnog porta {port}. Usmjernik R ' +
        'na internetu ima {out}, a tablica prijevoda mu je prazna. Pritisni →.',
      captionStartOne: 'samo adresu {addr}',
      captionStartTwo: 'adrese {addrs}',
      captionOutPat: '{who} šalje paket. R izvorište {from} prepisuje u {to}: upisuje novi zapis i spoju daje ' +
        'slobodan vanjski port.',
      captionOutPatSecond: 'Iako oba računala koriste isti izvorišni port {port}, izvana su razlučiva po vanjskom portu.',
      captionOutBasic: '{who} šalje paket. Basic NAT prepisuje samo adresu: {from} postaje {to}, a port ostaje isti. ' +
        'Vanjska adresa {addr} sad je vezana uz {who}.',
      captionReusePat: '{who} već ima otvorenu sesiju prema {srv}: R ne otvara drugu za isti spoj, nego paket šalje ' +
        'pod postojećim zapisom, kao {to}.',
      captionReuseBasic: '{who} je već vezan uz vanjsku adresu {addr}: R koristi isti zapis, i paket izlazi kao {to}.',
      captionNoFree: '{who} šalje paket, ali jedina vanjska adresa {addr} već je vezana uz A. Da je R i B-u dao istu, ' +
        'oba bi spoja izvana izgledala jednako ({same}) i odgovori se ne bi mogli razlučiti. R paket odbacuje.',
      captionReply: 'Poslužitelj odgovara na {dst}. R u tablici pronalazi zapis koji je upisao za {who} i odredište ' +
        'prepisuje u {to}.',
      captionNoReply: 'Paket računala {who} nije ni izašao, pa mu nema odgovora. Basic NAT treba po jednu vanjsku ' +
        'adresu za svako računalo koje istovremeno izlazi.',
      captionProbeDrop: 'Paket izvana stiže na {dst}, a nijedno unutarnje računalo nije poslalo odlazni paket koji bi ' +
        'taj zapis stvorio. R ne zna kome paket pripada, pa ga odbacuje.',
      captionProbePat: 'Paket izvana stiže na {dst}. Taj zapis postoji jer ga je R upisao kad je {who} poslao odlazni ' +
        'paket, pa paket prepisuje i šalje na {to}.',
      captionProbeBasic: 'Paket izvana stiže na {dst}. Basic NAT gleda samo adresu: {addr} je vezana uz {who}, pa paket ' +
        'ide na {to}, kojem god portu bio namijenjen.',
      explain: '<p><em lang="en">NAT</em> (prevođenje mrežnih adresa) mijenja adresu u zaglavlju paketa dok paket ' +
        'prolazi kroz usmjernik na granici mreže, pa mnogo računala s privatnim adresama izlazi na internet pod malo ' +
        'javnih, često samo jednom. <em lang="en">Basic NAT</em> prevodi samo adresu, pa mu treba po jedna vanjska ' +
        'adresa za svako računalo koje istovremeno izlazi. <em lang="en">PAT</em> (<em lang="en">Port Address ' +
        'Translation</em>, formalno NAPT) prevodi i broj <em lang="en">porta</em>: svakom odlaznom spoju daje ' +
        'vlastiti, slobodan <em lang="en">port</em> na jednoj vanjskoj adresi.</p>' +
        '<p><strong>Zašto odlazno radi samo, a dolazno ne.</strong> R zapis u tablicu prijevoda dodaje isključivo u ' +
        'trenutku kad odlazni paket krene; dolazni paket sam po sebi ne stvara zapis. Sesije su jednosmjerne i uvijek ' +
        'kreću iz privatne mreže prema van. Paket koji stigne izvana na <em lang="en">port</em> za koji nijedno ' +
        'unutarnje računalo nikad nije otvorilo spoj nema u tablici kome pripasti, pa ga R odbacuje, čak i kad bi ' +
        'neko unutarnje računalo taj paket rado primilo.</p>' +
        '<p>Da bi takav paket ipak stigao do određenog računala, administrator unaprijed upisuje stalan zapis ' +
        '(<em lang="en">port forwarding</em>, prosljeđivanje <em lang="en">portova</em>) koji svaki paket na tom ' +
        '<em lang="en">portu</em> šalje točno određenom unutarnjem računalu i <em lang="en">portu</em>.</p>'
    },
    en: {
      stage: 'The inside network with hosts A and B, router R and the internet, the packet before and after the router, and the translation table',
      mode: 'Translation mode',
      modePat: 'PAT: address and port',
      modeBasic: 'Basic NAT, one outside address',
      modeBasic2: 'Basic NAT, two outside addresses',
      second: 'The second outbound packet is sent by',
      secondB: 'B',
      secondA: 'A again',
      probe: 'A packet from outside arrives at port',
      presetBook: 'Example from the book',
      presetBookHint: 'Chapter 11, Example 4. Which outside ports does R give A and B, although both use the same ' +
        'source port 51000? And what happens to a packet from outside to port 61050?',
      presetOpen: 'Packet from outside to 61000',
      presetOpenHint: 'A packet from outside arrives at port 61000. Does it get through, and how does that differ ' +
        'from port 61050?',
      presetTwice: 'A twice',
      presetTwiceHint: 'A sends a packet on the same connection twice. Does R add a second entry?',
      presetBasic: 'Basic NAT, one address',
      presetBasicHint: 'Basic NAT translates only the address, and R has a single outside one. What happens to B\'s ' +
        'packet?',
      presetBasic2: 'Basic NAT, two addresses',
      presetBasic2Hint: 'R now has two outside addresses. What does it rewrite, and what does it leave as it is?',
      legendChanged: 'rewritten by R',
      legendNew: 'new entry',
      legendDrop: 'packet dropped',
      insideNet: 'inside network',
      router: 'router',
      outsideAddr: 'outside address',
      outsideAddrs: 'outside addresses',
      internet: 'internet',
      server: 'server',
      someone: 'someone outside',
      pktInside: 'packet in the inside network',
      pktOutside: 'packet on the internet',
      src: 'source',
      dst: 'destination',
      anyOutside: 'some outside address',
      dropped: 'R drops it',
      notSent: 'packet not sent',
      noPacket: 'no packet yet',
      tableTitle: 'Router R\'s translation table',
      colInside: 'Inside address',
      colOutside: 'Outside address',
      colDest: 'Destination',
      tableEmpty: 'The translation table is empty: no host has sent an outbound packet yet.',
      tagNew: 'new entry',
      tagUsed: 'R uses this entry',
      listAnd: ' and ',
      captionStart: 'A ({a}) and B ({b}) connect to the server {srv}, both from source port {port}. Router R has ' +
        '{out} on the internet, and its translation table is empty. Press →.',
      captionStartOne: 'the single address {addr}',
      captionStartTwo: 'the addresses {addrs}',
      captionOutPat: '{who} sends a packet. R rewrites its source {from} to {to}: it writes a new entry and gives the ' +
        'connection a free outside port.',
      captionOutPatSecond: 'Although both hosts use the same source port {port}, from outside they are told apart by ' +
        'the outside port.',
      captionOutBasic: '{who} sends a packet. Basic NAT rewrites only the address: {from} becomes {to}, and the port ' +
        'stays the same. The outside address {addr} is now bound to {who}.',
      captionReusePat: '{who} already has an open session to {srv}: R does not open a second one for the same ' +
        'connection, it sends the packet under the existing entry, as {to}.',
      captionReuseBasic: '{who} is already bound to the outside address {addr}: R uses the same entry, and the packet ' +
        'leaves as {to}.',
      captionNoFree: '{who} sends a packet, but the only outside address {addr} is already bound to A. Had R given B ' +
        'the same one, both connections would look identical from outside ({same}) and the replies could not be told ' +
        'apart. R drops the packet.',
      captionReply: 'The server replies to {dst}. R finds the entry it wrote for {who} in the table and rewrites the ' +
        'destination to {to}.',
      captionNoReply: 'Host {who}\'s packet never left, so no reply comes. Basic NAT needs one outside address for ' +
        'every host that is out at the same time.',
      captionProbeDrop: 'A packet from outside arrives at {dst}, and no inside host has sent an outbound packet that ' +
        'would have created that entry. R does not know whom it belongs to, so it drops it.',
      captionProbePat: 'A packet from outside arrives at {dst}. That entry exists because R wrote it when {who} sent ' +
        'an outbound packet, so R rewrites the packet and sends it to {to}.',
      captionProbeBasic: 'A packet from outside arrives at {dst}. Basic NAT looks at the address only: {addr} is bound ' +
        'to {who}, so the packet goes to {to}, whatever port it was meant for.',
      explain: '<p><em>NAT</em> (network address translation) changes the address in a packet\'s header while the ' +
        'packet passes through the router at the edge of a network, so many hosts with private addresses go out to ' +
        'the internet under few public ones, often just one. <em>Basic NAT</em> translates only the address, so it ' +
        'needs one outside address for every host that is out at the same time. <em>PAT</em> (port address ' +
        'translation, formally NAPT) translates the <em>port</em> number too: it gives every outbound connection ' +
        'its own free port on a single outside address.</p>' +
        '<p><strong>Why outbound works by itself and inbound does not.</strong> R adds an entry to the translation ' +
        'table only at the moment an outbound packet leaves; an inbound packet creates no entry by itself. Sessions ' +
        'are one-way and always start from the private network outwards. A packet that arrives from outside at a ' +
        'port for which no inside host ever opened a connection has nobody to belong to in the table, so R drops it, ' +
        'even if some inside host would gladly have received it.</p>' +
        '<p>For such a packet to reach a particular host after all, an administrator writes a permanent entry in ' +
        'advance (<em>port forwarding</em>) that sends every packet on that port to one particular inside host and ' +
        'port.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
