/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of traceroute, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder (data is passed in as nodes with translate="no"). In captions,
   *English term* becomes <em lang="en"> (the Croatian term rule); in the explanation the markup is written out.
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Lanac od računala A preko usmjernika do odredišta S, sonde ovog kruga na vezama i ispis traga',
      src: 'izvor',
      dest: 'odredište',

      // params
      tool: 'Sonde',
      toolEcho: 'ICMP echo (tracert)',
      toolUdp: 'UDP (traceroute)',
      routers: 'Usmjernika na putu',
      silent: 'Usmjernik koji šuti',
      silentNone: 'nijedan',
      destFilter: 'Vatrozid na odredištu odbacuje sonde',
      maxHops: 'Najveći broj skokova',

      // presets
      presetBasic: 'Put kroz 5 usmjernika',
      presetBasicHint: 'Šest krugova: R1 … R5, zatim echo odgovor odredišta.',
      presetStars: 'Zvjezdice na 9. skoku',
      presetStarsHint: 'R9 šuti; redci 10–12 ipak dolaze.',
      presetTools: 'UDP sonde',
      presetToolsHint: 'Isti put, drukčije sonde; kraj javlja „port nije dostupan”.',
      presetFiltered: 'Vatrozid na odredištu',
      presetFilteredHint: 'Najviše 8 skokova; od 6. skoka samo zvjezdice.',

      // legend
      legProbe: 'sonda, TTL na vezi',
      legExceeded: 'Time Exceeded (11/0) natrag',
      legFinal: 'odgovor odredišta',
      legSilent: 'usmjernik šuti',
      legDrop: 'sonda odbačena',
      legChanged: 'novo u ovom koraku',

      // topology
      chipTtl: 'TTL {ttl}',
      bSilent: 'šuti',
      bTe: 'šalje 11/0',
      bGot: 'redak {k}',
      bGotNone: 'ništa',
      bEcho: 'šalje 0/0',
      bPort: 'šalje 3/3',
      bFiltered: 'odbacuje',

      // the round
      roundTitle: 'Krug {k}: tri sonde s TTL = {k}',
      roundNone: 'Još ništa nije poslano. Korak 1 šalje prve sonde, s TTL = 1.',
      phOut: 'van',
      phDie: 'umire',
      phArrive: 'stiže',
      phReply: 'odgovor',
      phPrint: 'ispis',
      kEcho: 'ICMP echo zahtjev (8/0), redni brojevi {a}–{b}',
      kUdp: 'UDP, odredišni port {a}–{b}',
      dRouter: 'na {r}: TTL 1 → 0, odbačene',
      dDest: 'stižu do {s} s TTL = {ttl}; računalo ne smanjuje TTL',
      rTe: '{r} → A: ICMP 11/0 Time Exceeded, izvor {addr}',
      rSilent: '{r} šuti: ništa se ne vraća',
      rEcho: 'S → A: ICMP 0/0 echo odgovor',
      rPort: 'S → A: ICMP 3/3 port nije dostupan',
      rFiltered: 'vatrozid na S odbacuje: ništa se ne vraća',
      pLine: 'redak {k}: {addr} i tri vremena',
      pStars: 'redak {k}: * * *',

      // the output
      outTitle: 'Ispis',
      outWait: 'trag u tijeku …',
      outReply: 'Trag završen: odgovorilo je odredište.',
      outMax: 'Dosegnut najveći broj skokova ({max}) bez odgovora odredišta.',

      // captions
      capStart: 'A traži put do {dst}: šalje sonde s *TTL*-om (vrijeme života) 1, 2, 3 …, tri po krugu, dok ne odgovori odredište ili do {hops}.',
      hopsN: ['{n} skoka', '{n} skoka', '{n} skokova'],
      capSilentOff: '{r} nije na ovom putu (samo {n} usmjernika), pa se ništa ne mijenja.',
      capTe: 'Sonde s TTL-om {k} umiru na {r}: TTL pada na 0, {r} ih odbacuje i za svaku šalje *Time Exceeded* (vrijeme isteklo) s adrese {addr}. Redak {k} ispisa: {addr}.',
      capTeFirst: 'Sonde s TTL-om 1 umiru već na {r}: TTL pada na 0, {r} ih odbacuje i šalje *Time Exceeded* (vrijeme isteklo) s adrese {addr}. Redak 1 ispisa: prvi *hop* (skok).',
      capSilent: 'Sonde s TTL-om {k} umiru na {r}, ali {r} šuti: ne šalje poruku o isteku. Redak {k}: {stars}.',
      capSilentTail: 'To nije kvar: sonde s većim TTL-om proći će kroz {r}.',
      capPassed: 'Sonde s TTL-om {k} prošle su kroz {r} (TTL {a} → {b}) i stigle do {next}: redak zvjezdica nije bio prekid veze.',
      capFaster: 'Vremena su niža nego u retku {p}: {r} brže složi odgovor nego {q}. Vrijeme je put tamo i natrag plus koliko odgovorni čvor treba za odgovor, pa ne mora rasti.',
      capEcho: 'Sonde s TTL-om {k} stižu do odredišta {dst} s TTL-om {ttl}. Odredište ih ne prosljeđuje nego odgovara na ICMP echo zahtjev echo odgovorom (0/0). Redak {k}: {dst}. Trag je gotov.',
      capPort: 'UDP sonde s TTL-om {k} stižu do odredišta {dst} s TTL-om {ttl}, na portove {a}–{b}. Na njima ništa ne osluškuje, pa odredište vraća ICMP *port unreachable* (port nije dostupan, 3/3). Redak {k}: {dst}. Trag je gotov.',
      capFiltered: 'Sonde s TTL-om {k} stižu do {dst} s TTL-om {ttl}, ali ih vatrozid na odredištu odbacuje bez odgovora. Redak {k}: {stars}.',
      capMax: 'Dosegnut je najveći broj skokova ({max}): trag staje bez odgovora odredišta, iako put radi.',
      capMaxRouter: 'Dosegnut je najveći broj skokova ({max}) prije odredišta: trag staje na {r}.',

      explain: '<p><em lang="en">Traceroute</em> ne pita samo je li odredište dostupno, nego kojim putem paket do njega ide. ' +
        'Svaki usmjernik smanjuje <em lang="en">time to live</em> (vrijeme života, TTL) paketa za 1; kad TTL padne na 0, ' +
        'odbacuje ga i izvoru šalje ICMP <em lang="en">Time Exceeded</em> (poruka o isteku vremena, 11/0) sa svoje adrese.</p>' +
        '<p>Zato A šalje <em lang="en">probe</em> (sonde, probne pakete) s TTL-om 1, 2, 3 …, tri po krugu. Sonda s TTL-om k ' +
        'umire točno na k-tom <em lang="en">hop</em>-u (skoku), pa izvor poruke o isteku imenuje taj skok. Put se ne saznaje ' +
        'odjednom, nego iz niza namjerno izazvanih pogrešaka. Trag staje kad odgovori odredište ili nakon najvećeg broja skokova.</p>' +
        '<p>Redak <code translate="no">* * *</code> znači samo da taj usmjernik o sebi ne javlja. Sonda je ondje odbačena kao i ' +
        'svaka druga, ali promet s većim TTL-om prolazi: dokaz su redci poslije zvjezdica. Ni zvjezdice na kraju ne znače da put ' +
        'ne radi: vatrozid na odredištu može sonde odbacivati bez odgovora.</p>' +
        '<p>ICMP sonde (<code translate="no">tracert</code>) su echo zahtjevi, a odredište vraća echo odgovor (0/0). UDP sonde ' +
        '(<code translate="no">traceroute</code>) idu na visoke portove na kojima ništa ne osluškuje, pa odredište vraća ' +
        '<em lang="en">port unreachable</em> (port nije dostupan, 3/3). Paketi su različiti, pravilo isto: TTL istječe na traženom skoku.</p>' +
        '<p>Vrijeme u retku je put tamo i natrag plus koliko odgovorni čvor treba da složi odgovor. Usmjernik poruke o pogrešci ' +
        'slaže sporije nego što prosljeđuje, pa sporiji skok može pokazati više od sljedećeg. Ispis ne pokazuje put natrag: ' +
        'pokazuje tko je odgovorio, a odgovor se vraća kako god ga mreža usmjeri.</p>'
    },
    en: {
      stage: 'The chain from host A over the routers to the destination S, this round\'s probes on the links, and the trace output',
      src: 'source',
      dest: 'destination',

      tool: 'Probes',
      toolEcho: 'ICMP echo (tracert)',
      toolUdp: 'UDP (traceroute)',
      routers: 'Routers on the path',
      silent: 'Silent router',
      silentNone: 'none',
      destFilter: 'Firewall at the destination drops the probes',
      maxHops: 'Maximum hops',

      presetBasic: 'A path through 5 routers',
      presetBasicHint: 'Six rounds: R1 … R5, then the destination\'s echo reply.',
      presetStars: 'Stars at hop 9',
      presetStarsHint: 'R9 is silent; lines 10–12 still come.',
      presetTools: 'UDP probes',
      presetToolsHint: 'The same path, other probes; the end says "port unreachable".',
      presetFiltered: 'Firewall at the destination',
      presetFilteredHint: 'At most 8 hops; from hop 6 only stars.',

      legProbe: 'probe, TTL on the link',
      legExceeded: 'Time Exceeded (11/0) back',
      legFinal: 'the destination\'s answer',
      legSilent: 'silent router',
      legDrop: 'probe discarded',
      legChanged: 'new in this step',

      chipTtl: 'TTL {ttl}',
      bSilent: 'silent',
      bTe: 'sends 11/0',
      bGot: 'line {k}',
      bGotNone: 'nothing',
      bEcho: 'sends 0/0',
      bPort: 'sends 3/3',
      bFiltered: 'drops',

      roundTitle: 'Round {k}: three probes with TTL = {k}',
      roundNone: 'Nothing sent yet. Step 1 sends the first probes, with TTL = 1.',
      phOut: 'out',
      phDie: 'die',
      phArrive: 'arrive',
      phReply: 'reply',
      phPrint: 'print',
      kEcho: 'ICMP echo request (8/0), sequence numbers {a}–{b}',
      kUdp: 'UDP, destination port {a}–{b}',
      dRouter: 'at {r}: TTL 1 → 0, discarded',
      dDest: 'reach {s} with TTL = {ttl}; a host does not decrement TTL',
      rTe: '{r} → A: ICMP 11/0 Time Exceeded, source {addr}',
      rSilent: '{r} is silent: nothing comes back',
      rEcho: 'S → A: ICMP 0/0 echo reply',
      rPort: 'S → A: ICMP 3/3 port unreachable',
      rFiltered: 'the firewall on S drops them: nothing comes back',
      pLine: 'line {k}: {addr} and three times',
      pStars: 'line {k}: * * *',

      outTitle: 'Output',
      outWait: 'trace running …',
      outReply: 'Trace complete: the destination answered.',
      outMax: 'Maximum hops ({max}) reached without an answer from the destination.',

      capStart: 'A looks for the way to {dst}: it sends probes with a time to live (TTL) of 1, 2, 3 …, three per round, until the destination answers or for at most {hops}.',
      hopsN: ['{n} hop', '{n} hops'],
      capSilentOff: '{r} is not on this path (only {n} routers), so nothing changes.',
      capTe: 'The probes with TTL {k} die at {r}: TTL drops to 0, {r} discards them and sends Time Exceeded for each, from {addr}. Line {k} of the output: {addr}.',
      capTeFirst: 'The probes with TTL 1 die at {r} already: TTL drops to 0, {r} discards them and sends Time Exceeded from {addr}. Line 1 of the output: the first hop.',
      capSilent: 'The probes with TTL {k} die at {r}, but {r} is silent: it sends no Time Exceeded. Line {k}: {stars}.',
      capSilentTail: 'That is no fault: probes with a larger TTL will pass {r}.',
      capPassed: 'The probes with TTL {k} passed {r} (TTL {a} → {b}) and got as far as {next}: the row of stars was no broken link.',
      capFaster: 'The times are lower than on line {p}: {r} builds its answer faster than {q}. A time is the way there and back plus how long the answering node takes, so it need not grow.',
      capEcho: 'The probes with TTL {k} reach the destination {dst} with TTL {ttl}. It does not forward them; it answers the ICMP echo request with an echo reply (0/0). Line {k}: {dst}. The trace is complete.',
      capPort: 'The UDP probes with TTL {k} reach the destination {dst} with TTL {ttl}, to ports {a}–{b}. Nothing listens there, so the destination returns ICMP port unreachable (3/3). Line {k}: {dst}. The trace is complete.',
      capFiltered: 'The probes with TTL {k} reach {dst} with TTL {ttl}, but the destination\'s firewall drops them without an answer. Line {k}: {stars}.',
      capMax: 'Maximum hops ({max}) reached: the trace stops without an answer from the destination, though the path works.',
      capMaxRouter: 'Maximum hops ({max}) reached before the destination: the trace stops at {r}.',

      explain: '<p>Traceroute asks not only whether the destination is reachable, but which way a packet takes to it. Every router ' +
        'takes 1 off a packet\'s time to live (TTL); when the TTL reaches 0 it discards the packet and sends the source an ICMP ' +
        'Time Exceeded (11/0) from its own address.</p>' +
        '<p>So A sends probes with TTL 1, 2, 3 …, three per round. The probe with TTL k dies exactly at hop k, so the source of ' +
        'the Time Exceeded names that hop. The path is not learnt at once but from a series of errors caused on purpose. The ' +
        'trace stops when the destination answers or after the maximum number of hops.</p>' +
        '<p>A line <code translate="no">* * *</code> only means that this router does not report itself. The probe was discarded ' +
        'there like any other, but traffic with a larger TTL passes: the lines after the stars prove it. Nor do stars at the end ' +
        'mean the path is down: a firewall at the destination can drop the probes without an answer.</p>' +
        '<p>ICMP probes (<code translate="no">tracert</code>) are echo requests, and the destination returns an echo reply (0/0). ' +
        'UDP probes (<code translate="no">traceroute</code>) go to high ports where nothing listens, so the destination returns ' +
        'port unreachable (3/3). Different packets, the same rule: the TTL runs out at the hop asked for.</p>' +
        '<p>The time on a line is the way there and back plus how long the answering node takes to build its answer. A router ' +
        'builds error messages more slowly than it forwards, so a slow hop can show more than the next one. The output does not ' +
        'show the way back: it shows who answered, and the answer returns however the network routes it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
