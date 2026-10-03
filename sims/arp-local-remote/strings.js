/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of arp-local-remote, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms
   missing from kit/glossary.js are written out this way (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ethernet segment s računalima A, B, C i usmjernikom R',

      // params
      net: 'Mreža',
      netLan: 'A = 192.168.1.10',
      netLan28: 'A = 192.168.5.77/28',
      dst: 'Odredište pinga',
      dstB: 'B · {ip}',
      dstC: 'C · {ip}',
      dstNear: '{ip} · druga mreža',
      dstFar: '{ip} · Internet',
      dstGw: 'R · {ip} · pristupnik',
      mask: 'Maska računala A',
      maskHint: 'Mijenja se samo maska računala A; B, C i R ostaju na /24.',
      maskFixed: 'U ovoj mreži maska je /28.',
      cache: 'A već zna MAC sljedećeg skoka',
      cacheHint: 'ARP tablica računala A unaprijed ima zapis.',

      // presets
      presetLocal: 'Lokalno: A → B',
      presetRemote: 'Udaljeno: A → 8.8.8.8',
      presetLooksClose: 'Izgleda blizu: 192.168.2.50',
      presetLooksCloseHint: 'Prva dva broja ista, treći blizu, ali maska kaže: druga mreža.',
      presetCacheHit: 'Pogodak u ARP tablici',
      presetMask28: 'Maska /28: dva paketa',

      // legend
      legBroadcast: 'emitirani okvir',
      legUnicast: 'jednoodredišni okvir',
      legEntry: 'zapis u ARP tablici',
      legDecision: 'lokalno ✓ / udaljeno → R',
      legChanged: 'promijenjeno u ovom koraku',

      // decision box
      decTitle: 'Odluka računala A',
      rowMask: 'maska /{p}',
      rowDst: 'odredište',
      rowNetOwn: 'A AND maska',
      rowNetDst: 'odredište AND maska',
      equal: 'jednako',
      differ: 'različito',
      verdictLocal: 'lokalno ✓',
      verdictRemote: 'udaljeno → R',
      nextHop: 'sljedeći skok {ip}',
      pending: '…',

      // frame card
      frameTitle: 'Okvir na žici',
      frameNone: 'Na žici još nema ničega.',
      dstMac: 'odredišna MAC',
      srcMac: 'izvorišna MAC',
      srcIp: 'izvorišna IP',
      dstIp: 'odredišna IP',
      arpReq: 'ARP zahtjev',
      arpRep: 'ARP odgovor',
      ipPacket: 'IP paket · ping',
      whoHas: 'Tko ima {ip}? Javi {asker}.',
      isAt: '{ip} je na {mac}.',
      broadcastAll: 'svima',

      // topology
      gateway: 'zadani pristupnik',
      cloud: 'Internet',
      cloudSub: 'druge mreže',
      sends: 'šalje',
      hears: 'čuje',
      answers: 'odgovara',
      receives: 'prima',
      laneReq: 'zahtjev',
      laneRep: 'odgovor',
      lanePing: 'ping',
      arpTable: 'ARP tablica',
      empty: 'prazna',
      entryNew: 'novo',
      entryRefreshed: 'osvježeno',
      lookupHit: 'pogodak',
      lookupMiss: 'nema {ip}',

      // captions
      packetOf: 'Paket {k} od {n}: ',
      capStart: 'A ({src}) šalje ping na {dst}. Prije nego išta ode na žicu, A odlučuje: je li {dst} u njegovoj mreži? Pritisni →.',
      capAndSrc: '*Bitwise AND* (bitovno I) adrese računala A i njegove maske, *subnet mask* (podmrežna maska): {ip} AND {mask} = {net}. To je mreža računala A.',
      capAndDst: 'Ista maska na odredište: {ip} AND {mask} = {net}.',
      capLocal: '{ns} = {nd}: odredište je u mreži računala A. A šalje izravno, pa je *next hop* (sljedeći skok) samo odredište, {hop}.',
      capRemote: '{nd} ≠ {ns}: odredište je udaljeno. *Next hop* (sljedeći skok) je *default gateway* (zadani pristupnik) {hop}: A ARP-om traži njegovu MAC adresu, ne MAC adresu odredišta.',
      capMiss: 'A traži sljedeći skok {hop} u svojoj tablici, *ARP table* (ARP tablica): nema ga. A mora pitati.',
      capHit: 'A traži sljedeći skok {hop} u svojoj tablici, *ARP table* (ARP tablica): tu je, {mac}. ARP zahtjev nije potreban.',
      capReq: '*ARP request* (ARP zahtjev), emitiran (*broadcast*) na ff:ff:ff:ff:ff:ff: „Tko ima {hop}? Javi {a}.“ Primaju ga sve stanice na segmentu.',
      capHear: 'Emitirani okvir čuju {all}, ali samo {owner} ima adresu {hop}, pa samo {owner} odgovara, izravno računalu A. {owner} usput upisuje A u svoju ARP tablicu.',
      capRefreshed: ' {who} već ima zapis za A i samo ga osvježava.',
      capRep: '*ARP reply* (ARP odgovor), jednoodredišno (*unicast*) od {owner} prema A: „{hop} je na {mac}.“ A ga upisuje u svoju ARP tablicu.',
      capSendLocal: 'A šalje ping: odredišna MAC {mac} ({owner}), odredišna IP {dst}. Okvir ide ravno do {owner}.',
      capSendRemote: 'A šalje ping: odredišna MAC {mac} pripada pristupniku R, a odredišna IP ostaje {dst}. Što R radi dalje, druga je priča.',
      capNext: ' Slijedi paket {k}, prema {dst}.',
      list2: '{a} i {b}',
      listMore: '{a}, {b}',

      explain: '<p>Prije slanja <em>host</em> odlučuje kome predati okvir. Bitovnim I (<em lang="en">bitwise AND</em>) svoje adrese i ' +
        'podmrežne maske (<em lang="en">subnet mask</em>) dobiva svoju mrežu, a istom maskom na odredišnoj adresi mrežu odredišta. ' +
        'Ako su jednake, odredište je lokalno i sljedeći skok je ono samo; inače je sljedeći skok zadani pristupnik ' +
        '(<em lang="en">default gateway</em>).</p>' +
        '<p>ARP pita samo za sljedeći skok: za udaljenu adresu ne pita nikad, jer ARP ne izlazi sa segmenta. Zahtjev je ' +
        'emitiran, čuju ga svi, ali odgovara samo vlasnik tražene adrese, jednoodredišno. Vlasnik usput upisuje onoga koji pita, ' +
        'a onaj koji pita upisuje odgovor. Ako je sljedeći skok već u ARP tablici, zahtjeva nema.</p>' +
        '<p>U okviru odredišna MAC adresa pripada sljedećem skoku, a odredišna IP adresa ostaje konačno odredište. ' +
        'Kad je pristupnik samo sljedeći skok, njegova adresa ne ulazi u IP paket kao odredište.</p>'
    },
    en: {
      stage: 'Ethernet segment with hosts A, B, C and router R',

      net: 'Network',
      netLan: 'A = 192.168.1.10',
      netLan28: 'A = 192.168.5.77/28',
      dst: 'Ping destination',
      dstB: 'B · {ip}',
      dstC: 'C · {ip}',
      dstNear: '{ip} · another network',
      dstFar: '{ip} · Internet',
      dstGw: 'R · {ip} · gateway',
      mask: 'A\'s mask',
      maskHint: 'Only A\'s mask changes; B, C and R stay at /24.',
      maskFixed: 'This network\'s mask is /28.',
      cache: 'A already knows the next hop\'s MAC',
      cacheHint: 'A\'s ARP table holds the entry from the start.',

      presetLocal: 'Local: A → B',
      presetRemote: 'Remote: A → 8.8.8.8',
      presetLooksClose: 'Looks close: 192.168.2.50',
      presetLooksCloseHint: 'The first two numbers match and the third is close, but the mask says: another network.',
      presetCacheHit: 'ARP cache hit',
      presetMask28: 'Mask /28: two packets',

      legBroadcast: 'broadcast frame',
      legUnicast: 'unicast frame',
      legEntry: 'ARP table entry',
      legDecision: 'local ✓ / remote → R',
      legChanged: 'changed in this step',

      decTitle: 'A\'s decision',
      rowMask: 'mask /{p}',
      rowDst: 'destination',
      rowNetOwn: 'A AND mask',
      rowNetDst: 'destination AND mask',
      equal: 'equal',
      differ: 'different',
      verdictLocal: 'local ✓',
      verdictRemote: 'remote → R',
      nextHop: 'next hop {ip}',
      pending: '…',

      frameTitle: 'Frame on the wire',
      frameNone: 'Nothing on the wire yet.',
      dstMac: 'destination MAC',
      srcMac: 'source MAC',
      srcIp: 'source IP',
      dstIp: 'destination IP',
      arpReq: 'ARP request',
      arpRep: 'ARP reply',
      ipPacket: 'IP packet · ping',
      whoHas: 'Who has {ip}? Tell {asker}.',
      isAt: '{ip} is at {mac}.',
      broadcastAll: 'everyone',

      gateway: 'default gateway',
      cloud: 'Internet',
      cloudSub: 'other networks',
      sends: 'sends',
      hears: 'hears',
      answers: 'answers',
      receives: 'receives',
      laneReq: 'request',
      laneRep: 'reply',
      lanePing: 'ping',
      arpTable: 'ARP table',
      empty: 'empty',
      entryNew: 'new',
      entryRefreshed: 'refreshed',
      lookupHit: 'hit',
      lookupMiss: 'no {ip}',

      packetOf: 'Packet {k} of {n}: ',
      capStart: 'A ({src}) is about to ping {dst}. Before anything goes on the wire, A decides: is {dst} on its own network? Press →.',
      capAndSrc: 'Bitwise AND of A\'s own address and its subnet mask: {ip} AND {mask} = {net}. That is A\'s network.',
      capAndDst: 'The same mask on the destination: {ip} AND {mask} = {net}.',
      capLocal: '{ns} = {nd}: the destination is on A\'s own network. A sends directly, so the next hop is the destination itself, {hop}.',
      capRemote: '{nd} ≠ {ns}: the destination is remote. The next hop is the default gateway {hop}: A uses ARP to ask for its MAC address, not for the destination\'s.',
      capMiss: 'A looks up the next hop {hop} in its ARP table: not there. A has to ask.',
      capHit: 'A looks up the next hop {hop} in its ARP table: there it is, {mac}. No ARP request is needed.',
      capReq: 'ARP request, broadcast to ff:ff:ff:ff:ff:ff: “Who has {hop}? Tell {a}.” Every station on the segment receives it.',
      capHear: '{all} all hear the broadcast, but only {owner} owns {hop}, so only {owner} answers, straight to A. {owner} has also stored A\'s address on the way.',
      capRefreshed: ' {who} already had an entry for A and only refreshes it.',
      capRep: 'ARP reply, unicast from {owner} to A: “{hop} is at {mac}.” A writes it into its ARP table.',
      capSendLocal: 'A sends the ping: destination MAC {mac} ({owner}), destination IP {dst}. The frame goes straight to {owner}.',
      capSendRemote: 'A sends the ping: destination MAC {mac} is the gateway R\'s, but the destination IP stays {dst}. What R does next is another story.',
      capNext: ' Next: packet {k}, to {dst}.',
      list2: '{a} and {b}',
      listMore: '{a}, {b}',

      explain: '<p>Before sending, a host decides whom to hand the frame to. The bitwise AND of its own address and its subnet ' +
        'mask gives its network; the same mask on the destination address gives the destination\'s network. If they are ' +
        'equal, the destination is local and the next hop is the destination itself; otherwise the next hop is the default ' +
        'gateway.</p>' +
        '<p>ARP asks only for the next hop: never for a remote address, because ARP does not leave the segment. The request ' +
        'is a broadcast that everyone hears, but only the owner of the address answers, by unicast. On the way the owner ' +
        'stores the asker, and the asker stores the answer. If the next hop is already in the ARP table, there is no ' +
        'request.</p>' +
        '<p>In the frame, the destination MAC address is the next hop\'s, while the destination IP address stays the final ' +
        'destination. When the gateway is only the next hop, its address does not go into the IP packet as the destination.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
