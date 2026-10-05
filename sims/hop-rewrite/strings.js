/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of hop-rewrite, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms
   missing from kit/glossary.js are written out this way (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Put paketa od A do B kroz usmjernike, polja okvira i zaglavlja na svakom segmentu',

      // params
      ttl0: 'Početni TTL (šalje A)',
      routers: 'Usmjernika na putu',
      showChecksum: 'Kontrolni zbroj zaglavlja',
      showChecksumHint: 'Polje, stupac i redak o kontrolnom zbroju.',
      coldArp: 'R1 još ne zna MAC sljedećeg skoka',
      coldArpHint: 'ARP tablica usmjernika R1 nema zapis za sljedeći skok.',

      // presets
      presetBook: 'Primjer iz knjige: A → R1 → B',
      presetTwo: 'Dva usmjernika',
      presetTtl: 'TTL istječe na R2',
      presetTtlHint: 'A šalje s TTL-om 2.',
      presetCold: 'R1 mora pitati ARP',

      // legend
      legFrame: 'polje okvira',
      legIp: 'polje IP zaglavlja',
      legSame: 'isto kao prije skoka',
      legChanged: 'promijenio ovaj skok',
      legDrop: 'paket odbačen',

      // field strip
      stripTitle: 'Paket na putu',
      stripIcmp: 'Nov paket: ICMP Time Exceeded',
      frameTitle: 'Okvir (Ethernet)',
      ipTitle: 'IP zaglavlje',
      fDstMac: 'odredišna MAC',
      fSrcMac: 'izvorišna MAC',
      fType: 'tip',
      fFcs: 'FCS',
      fTtl: 'TTL',
      fProto: 'protokol',
      fCsum: 'kontrolni zbroj',
      fSrc: 'izvorišna IP',
      fDst: 'odredišna IP',
      fOther: 'ostala polja',
      fIcmp: 'ICMP',
      otherVal: 'duljina 84, ID 0x1c46, DF',
      icmpVal: 'tip 11, kod 0',
      valNew: 'novo',
      frameNone: 'A još nije sagradio okvir.',
      frameHeld: 'Okvira nema: paket čeka u usmjerniku R1.',
      frameDropped: 'Okvira nema: paket je odbačen.',
      sameMark: '=',

      // history
      histTitle: 'Po segmentima',
      hSeg: 'segment',
      hDstMac: 'odr. MAC',
      hSrcMac: 'izv. MAC',
      hSrc: 'izvorišna IP',
      hDst: 'odredišna IP',
      hTtl: 'TTL',
      hCsum: 'kontr. zbroj',
      hFcs: 'FCS',
      histEmpty: 'Paket još nije prešao nijedan segment.',
      histDropped: '✕ {r}: TTL 0, paket odbačen',

      // work box
      workIdle: 'Što čvor radi s paketom',
      workIdleText: 'Usmjernik obrađuje paket redom: okvir, tablica, TTL, kontrolni zbroj, ARP, nov okvir.',
      workIdleTextNoCsum: 'Usmjernik obrađuje paket redom: okvir, tablica, TTL, ARP, nov okvir.',
      workRouter: '{r} obrađuje paket',
      workHost: '{b} prima paket',
      wStrip: 'skida okvir (odredišna MAC {mac} je njegova) i odbacuje ga',
      wLookup: '{dst}: mreža {net} izravno spojena, {iface}',
      wLookupVia: '{dst}: mreža {net} preko {via}, {iface}',
      wTtl: 'TTL {a} → {b}',
      wTtlOk: 'TTL nije 0, paket ide dalje',
      wTtlZero: 'TTL = 0: paket se odbacuje',
      wCsum: 'kontrolni zbroj {a} → {b}',
      wArpHit: 'ARP: {ip} je {mac}',
      wArpMiss: 'ARP: nema {ip}, paket čeka',
      wArpLearned: 'ARP: {ip} je {mac}, naučeno',
      wFrame: 'nov okvir: od {src} za {dst}',
      wSkipped: 'ne radi se',
      rMac: 'odredišna MAC {mac}: njegova',
      rIp: 'odredišna IP {ip}: njegova',
      rCsum: 'kontrolni zbroj ispravan',
      rTtl: 'TTL {ttl}: računalo ga ne smanjuje',
      rAccept: 'prihvaća paket: ping je stigao',

      // topology
      router: 'usmjernik',
      segName: 'segment {k}',
      bSends: 'šalje',
      bWorks: 'obrađuje',
      bHolds: 'čeka ARP',
      bDrops: 'odbacuje ✕',
      bAnswers: 'odgovara',
      bAccepts: 'prima',
      bIcmp: 'javlja izvoru',
      chipPkt: 'TTL {ttl}',
      chipArpReq: 'ARP zahtjev',
      chipArpRep: 'ARP odgovor',
      chipIcmp: 'ICMP 11/0',

      // captions
      capStart: 'A ({src}) šalje ping na {dst}. Odredište je u drugoj mreži, pa A paket predaje usmjerniku R1. Pritisni →.',
      capCross1: 'A gradi prvi [[frame]]: odredišna MAC {mac} je R1-ovo sučelje Gi0/0, a ne B. Odredišna IP je {dst} od početka. TTL je {ttl}.',
      capCross: 'Isti paket prelazi segment {k} ({net}) u okviru koji je {r} upravo sagradio: odredišna MAC {mac}.',
      capProcess: '{r} odbacuje stari okvir i gradi novi: izvorišna MAC je sad {smac}, njegovo sučelje {iface}, a odredišna {dmac} ({next}). IP adrese ostaju iste, TTL pada: {a} → {b}',
      capCsum: ', pa se kontrolni zbroj zaglavlja ponovno računa: {c1} → {c2}.',
      capEnd: '.',
      capHeld: '{r} smanjuje TTL ({a} → {b}) i usmjerava paket prema {hop}, ali u svojoj ARP tablici nema MAC adresu za {hop}. Paket čeka.',
      capArpReq: '{r} na segmentu {k} emitira ARP zahtjev: „Tko ima {hop}? Javi {asker}.“',
      capArpRep: '{n} odgovara samo usmjerniku {r}: „{hop} je na {mac}.“ Sad {r} može sagraditi okvir.',
      capArrive: 'B provjerava: odredišna MAC {mac} je njegova, odredišna IP {dst} je njegova. TTL {ttl} ne smanjuje, jer to rade samo usmjernici. Ping je stigao.',
      capDrop: '{r} smanjuje TTL s {a} na 0, pa paket ovdje staje: {r} ga odbacuje i ne gradi nov okvir.',
      capIcmp: '{r} šalje ICMP Time Exceeded (tip 11, kod 0) natrag na {src}, izvorišnu adresu koja se nijednom nije promijenila. To je nov paket, od {from}; R1 ga prosljeđuje kao svaki drugi.',
      capIcmpDirect: '{r} šalje ICMP Time Exceeded (tip 11, kod 0) natrag na {src}, izvorišnu adresu koja se nijednom nije promijenila. To je nov paket, od {from}.',
      capSummary: 'Usporedi prvi i zadnji segment: oba para MAC adresa i FCS su drukčiji, TTL je pao s {a} na {b}, a izvorišna i odredišna IP adresa su iste kao na početku.',
      capSummaryDrop: 'Paket nije stigao do B. Na svakom segmentu do {r} MAC adrese su bile nove, a IP adrese iste; TTL je pao na 0 i {r} je o tome javio izvoru.',

      explain: '<p>Na putu kroz mrežu paket nosi dvije vrste adresa. <b>IP adrese</b> (izvorišna i odredišna) govore čiji je paket i ' +
        'kome ide, pa ostaju iste od A do B. <b>MAC adrese</b> vrijede samo na jednom segmentu: svaki usmjernik odbacuje okvir u ' +
        'kojem je paket stigao i gradi nov, s izvorišnom MAC adresom svog izlaznog sučelja i odredišnom MAC adresom sljedećeg ' +
        'skoka (<em lang="en">next hop</em>), koju zna iz ARP tablice ili je dozna ARP-om.</p>' +
        '<p>Svaki usmjernik smanjuje <b>TTL</b> (<em lang="en">time to live</em>, vrijeme života) barem za jedan. TTL broji skokove, ' +
        'ne sekunde. Ako padne na 0, usmjernik paket odbacuje i izvoru šalje ICMP Time Exceeded. Računalo koje primi TTL 1 ' +
        'paket ipak prihvaća: smanjuju ga samo usmjernici.</p>' +
        '<p>TTL je u IP zaglavlju, pa se na svakom skoku ponovno računa <b>kontrolni zbroj zaglavlja</b> (<em lang="en">header ' +
        'checksum</em>). TTL je gornji bajt jedne 16-bitne riječi, pa TTL − 1 kontrolni zbroj poveća za 0x0100 (uz prijenos s kraja na početak kad gornji bajt prijeđe 0xff). I FCS okvira je ' +
        'svaki put nov, jer je okvir nov. Ništa drugo u zaglavlju se ne mijenja: adrese prepisuje tek NAT, a to ovdje nije ' +
        'slučaj.</p>'
    },
    en: {
      stage: 'A packet\'s path from A to B through routers, the frame and header fields on every segment',

      ttl0: 'Initial TTL (A sends)',
      routers: 'Routers on the path',
      showChecksum: 'Header checksum',
      showChecksumHint: 'The checksum field, column and line.',
      coldArp: 'R1 does not know the next hop\'s MAC yet',
      coldArpHint: 'R1\'s ARP table has no entry for the next hop.',

      presetBook: 'The book\'s example: A → R1 → B',
      presetTwo: 'Two routers',
      presetTtl: 'TTL runs out at R2',
      presetTtlHint: 'A sends with TTL 2.',
      presetCold: 'R1 has to ask ARP',

      legFrame: 'frame field',
      legIp: 'IP header field',
      legSame: 'same as before the hop',
      legChanged: 'changed by this hop',
      legDrop: 'packet dropped',

      stripTitle: 'Packet in flight',
      stripIcmp: 'New packet: ICMP Time Exceeded',
      frameTitle: 'Frame (Ethernet)',
      ipTitle: 'IP header',
      fDstMac: 'destination MAC',
      fSrcMac: 'source MAC',
      fType: 'type',
      fFcs: 'FCS',
      fTtl: 'TTL',
      fProto: 'protocol',
      fCsum: 'checksum',
      fSrc: 'source IP',
      fDst: 'destination IP',
      fOther: 'other fields',
      fIcmp: 'ICMP',
      otherVal: 'length 84, ID 0x1c46, DF',
      icmpVal: 'type 11, code 0',
      valNew: 'new',
      frameNone: 'A has not built the frame yet.',
      frameHeld: 'No frame: the packet waits in R1.',
      frameDropped: 'No frame: the packet was dropped.',
      sameMark: '=',

      histTitle: 'Segment by segment',
      hSeg: 'segment',
      hDstMac: 'dst MAC',
      hSrcMac: 'src MAC',
      hSrc: 'source IP',
      hDst: 'destination IP',
      hTtl: 'TTL',
      hCsum: 'checksum',
      hFcs: 'FCS',
      histEmpty: 'The packet has not crossed a segment yet.',
      histDropped: '✕ {r}: TTL 0, packet dropped',

      workIdle: 'What a node does with the packet',
      workIdleText: 'A router works in this order: frame, table, TTL, checksum, ARP, new frame.',
      workIdleTextNoCsum: 'A router works in this order: frame, table, TTL, ARP, new frame.',
      workRouter: '{r} processes the packet',
      workHost: '{b} receives the packet',
      wStrip: 'strips the frame (destination MAC {mac} is its own) and discards it',
      wLookup: '{dst}: network {net} directly connected, {iface}',
      wLookupVia: '{dst}: network {net} via {via}, {iface}',
      wTtl: 'TTL {a} → {b}',
      wTtlOk: 'TTL is not 0, the packet goes on',
      wTtlZero: 'TTL = 0: the packet is dropped',
      wCsum: 'checksum {a} → {b}',
      wArpHit: 'ARP: {ip} is {mac}',
      wArpMiss: 'ARP: no {ip}, the packet waits',
      wArpLearned: 'ARP: {ip} is {mac}, learned',
      wFrame: 'new frame: from {src} to {dst}',
      wSkipped: 'not done',
      rMac: 'destination MAC {mac}: its own',
      rIp: 'destination IP {ip}: its own',
      rCsum: 'checksum valid',
      rTtl: 'TTL {ttl}: a host does not decrement it',
      rAccept: 'accepts the packet: the ping has arrived',

      router: 'router',
      segName: 'segment {k}',
      bSends: 'sends',
      bWorks: 'processes',
      bHolds: 'waits for ARP',
      bDrops: 'drops ✕',
      bAnswers: 'answers',
      bAccepts: 'receives',
      bIcmp: 'tells the source',
      chipPkt: 'TTL {ttl}',
      chipArpReq: 'ARP request',
      chipArpRep: 'ARP reply',
      chipIcmp: 'ICMP 11/0',

      capStart: 'A ({src}) pings {dst}. The destination is on another network, so A hands the packet to router R1. Press →.',
      capCross1: 'A builds the first [[frame]]: the destination MAC {mac} is R1\'s interface Gi0/0, not B. The destination IP is {dst} from the start. TTL is {ttl}.',
      capCross: 'The same packet crosses segment {k} ({net}) in the frame {r} has just built: destination MAC {mac}.',
      capProcess: '{r} discards the old frame and builds a new one: the source MAC is now {smac}, its interface {iface}, and the destination {dmac} ({next}). The IP addresses stay the same, TTL drops: {a} → {b}',
      capCsum: ', so the header checksum is computed again: {c1} → {c2}.',
      capEnd: '.',
      capHeld: '{r} decrements TTL ({a} → {b}) and routes the packet towards {hop}, but its ARP table has no MAC address for {hop}. The packet waits.',
      capArpReq: '{r} broadcasts an ARP request on segment {k}: "Who has {hop}? Tell {asker}."',
      capArpRep: '{n} answers {r} alone: "{hop} is at {mac}." Now {r} can build the frame.',
      capArrive: 'B checks: the destination MAC {mac} is its own, the destination IP {dst} is its own. It does not decrement TTL {ttl}: only routers do. The ping has arrived.',
      capDrop: '{r} decrements TTL from {a} to 0, so the packet stops here: {r} discards it and builds no new frame.',
      capIcmp: '{r} sends ICMP Time Exceeded (type 11, code 0) back to {src}, the source address that never changed. It is a new packet, from {from}; R1 forwards it like any other.',
      capIcmpDirect: '{r} sends ICMP Time Exceeded (type 11, code 0) back to {src}, the source address that never changed. It is a new packet, from {from}.',
      capSummary: 'Compare the first segment with the last: both MAC addresses and the FCS differ, TTL fell from {a} to {b}, and the source and destination IP addresses are the same as at the start.',
      capSummaryDrop: 'The packet never reached B. On every segment up to {r} the MAC addresses were new and the IP addresses the same; TTL fell to 0 and {r} told the source.',

      explain: '<p>On its way through the network a packet carries two kinds of address. The <b>IP addresses</b> (source and ' +
        'destination) say whose packet it is and where it goes, so they stay the same from A to B. The <b>MAC addresses</b> are ' +
        'valid on one segment only: every router discards the frame the packet came in and builds a new one, with its outgoing ' +
        'interface as the source MAC and the next hop as the destination MAC, from its ARP table or found by ARP.</p>' +
        '<p>Every router decrements <b>TTL</b> (time to live) by at least one. TTL counts hops, not seconds. If it reaches 0 ' +
        'the router drops the packet and sends ICMP Time Exceeded to the source. A host that receives TTL 1 still accepts the ' +
        'packet: only routers decrement it.</p>' +
        '<p>TTL is in the IP header, so the <b>header checksum</b> is computed again at every hop. TTL is the high byte of a ' +
        '16-bit word, so TTL − 1 raises the checksum by 0x0100 (with an end-around carry when the high byte wraps). The frame\'s FCS is new every time too, because the frame is ' +
        'new. Nothing else in the header changes: only NAT rewrites addresses, and there is none here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
