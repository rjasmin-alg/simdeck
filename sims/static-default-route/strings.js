/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of static-default-route, in both languages (docs/sim-ui.md §9). Croatian follows the URM
   book (ch. 11): usmjernik, tablica usmjeravanja, zapis, statički put, zadani put, izravno spojena mreža, sljedeći
   skok, najdulji podudarajući prefiks, petlja usmjeravanja. The glossary lacks these (or has "zadana ruta" from the UL
   book), so the Croatian first mentions are written out as *English* (Croatian); the page turns *…* into <em lang="en">.
   Pairs: NOTES.md. Addresses, prefixes, router names, interface names and ICMP type/code are data: the page puts them
   in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Lanac A — R1 — R2 — R3 — ISP s računalom B iza R2, tablice usmjeravanja triju usmjernika i paket na putu',
      // params
      r1Static: 'R1: S 192.168.2.0/24 → R2',
      r1Default: 'R1: S* 0.0.0.0/0 → R2',
      r2Static: 'R2: S 192.168.1.0/24 → R1',
      r2Default: 'R2: S* 0.0.0.0/0 → R3',
      r3Default: 'R3: S* 0.0.0.0/0 → ISP',
      r3Back: 'R3: S* 0.0.0.0/0 → R2',
      blocked: 'R3 već ima 0.0.0.0/0: isti prefiks ne ide dvaput.',
      dstB: 'B',
      dst: 'A pinga',
      ttl: 'Početni TTL (svaki pošiljatelj)',
      // presets
      presetBoth: 'Put u oba smjera',
      presetBothHint: 'Primjer 3a: R1 zna put do B-ove mreže, R2 do A-ove. Stiže li odgovor do A?',
      presetOne: 'Samo jedan smjer',
      presetOneHint: 'Primjer 3b: zapis na R2 je zaboravljen. Dokle stiže zahtjev, a dokle odgovor?',
      presetDefault: 'Zadani put na R1',
      presetDefaultHint: 'Primjer 3c: R1-ov statički put zamijenjen je zadanim. Kamo R1 šalje odgovor za svoju mrežu 192.168.1.0/24?',
      presetInternet: 'Prema internetu',
      presetInternetHint: 'Nijedan usmjernik nema zapis za 8.8.8.8. Kako paket ipak stiže do ISP-a?',
      presetLoop: 'Petlja',
      presetLoopHint: 'R3-ov zadani put vodi natrag na R2. Kruži li paket zauvijek?',
      // legend
      legReq: 'echo zahtjev',
      legReply: 'echo odgovor',
      legIcmp: 'ICMP poruka o grešci',
      legDrop: 'odbačen',
      legKinds: 'C izravno spojena · S statički · S* zadani put',
      legChanged: 'pogođeni zapis, TTL',
      // nodes
      host: 'računalo',
      router: 'usmjernik',
      isp: 'internet (ISP)',
      bSends: 'šalje',
      bForwards: 'prosljeđuje',
      bDrops: 'odbacuje',
      bGets: 'prima',
      bTakes: 'preuzima',
      bVisit: '{k}. put',
      chipEcho: 'echo · TTL {ttl}',
      chipReply: 'odgovor · TTL {ttl}',
      chipIcmp: 'ICMP {tc} · TTL {ttl}',
      // tables
      tabTitle: '{r}: tablica usmjeravanja',
      colKind: 'vrsta',
      colNet: 'odredišna mreža',
      colHop: 'sljedeći skok / sučelje',
      direct: 'izravno, {iface}',
      markWin: 'pobjeđuje',
      markOnly: 'jedini se podudara',
      markBeaten: 'podudara se, kraći',
      noMatch: 'nema zapisa ni zadanog puta',
      refused: 'odbijen: isti prefiks',
      // packet box
      pktTitle: 'Paket',
      pktNone: 'Na žici još nema ništa. A će poslati echo zahtjev.',
      fKind: 'vrsta',
      fSrcDst: 'izvor → odredište',
      fTtl: 'TTL',
      fFate: 'ishod',
      kEcho: 'echo zahtjev',
      kReply: 'echo odgovor',
      kIcmp: 'ICMP {tc}',
      i30: 'odredišna mreža nedostupna',
      i110: 'TTL istekao',
      oFlight: 'na putu prema {node}',
      oDelivered: 'isporučen: {node}',
      oNoRoute: 'odbačen na {node}: nema puta',
      oTtl: 'odbačen na {node}: TTL 0',
      oLeft: 'otišao u internet',
      oLost: 'izgubljen u internetu',
      pathTitle: 'Put ovog paketa (TTL na izlazu)',
      aTitle: 'Što A vidi',
      aWait: 'još ništa',
      aReply: 'echo odgovor: ping uspijeva',
      aIcmp: 'ICMP {tc} od {src}',
      aSilence: 'ništa: ni odgovor ni poruku o grešci',
      aLeft: 'zahtjev je otišao u internet',
      // captions
      capStart: 'A šalje *echo request* (echo zahtjev) za {dst}, TTL {ttl}. Ispod svakog usmjernika je njegova *routing table* (tablica usmjeravanja): zapis C usmjernik zna sam, S i S* je upisao administrator. Pritisni →.',
      capRefused: 'R3 već ima zadani put 0.0.0.0/0 → ISP, pa drugi zapis s istim prefiksom, 0.0.0.0/0 → R2, tablica ne prima.',
      capSendA: '{dst} nije u A-ovoj mreži {net}, pa A paket šalje svojem zadanom pristupniku {gw}, usmjerniku R1. TTL {ttl}.',
      capSendB: 'B odgovara: *echo reply* (echo odgovor) za {dst} novi je paket, sa svojim putem, i ide B-ovu zadanom pristupniku {gw}, usmjerniku R2.',
      capSendIcmp: '{r} šalje ICMP {tc} ({what}) izvoru odbačenog paketa, {dst}, sa svojeg sučelja {src}.',
      capSendIcmpB: '{r} šalje ICMP {tc} ({what}) B-u, izvoru odbačenog odgovora, sa svojeg sučelja {src}.',
      errViaC: 'Do {dst} vodi izravno spojena mreža {net}, sučelje {iface}.',
      errViaS: 'Do {dst} vodi statički put {net} → {via}.',
      errViaD: 'Do {dst} vodi samo zadani put 0.0.0.0/0 → {via}.',
      capFwdC: '{r} traži {dst}: *directly connected network* (izravno spojena mreža) {net}, pa paket šalje ravno na {iface}. TTL {a} → {b}.',
      capFwdS: '{r} traži {dst}: *static route* (statički put) {net} → {via}. TTL {a} → {b}.',
      capFwdD: '{r} traži {dst}: ništa specifičnije se ne podudara, pa paket hvata *default route* (zadani put) 0.0.0.0/0 → {via}. TTL {a} → {b}.',
      capBeat: 'Podudara se i {other}, ali {win} ima dulji prefiks i pobjeđuje: *longest prefix match* (najdulji podudarajući prefiks), ne redoslijed u tablici.',
      capLoop: '{r} ovaj isti paket vidi već {k}. put: *routing loop* (petlja usmjeravanja), svaki krug TTL pada za 2.',
      capArriveEcho: 'B prima echo zahtjev.',
      capArriveReply: 'A prima echo odgovor s TTL-om {ttl}: ping uspijeva.',
      capArriveIcmpA: 'A prima ICMP {tc} od {src}: {what}.',
      capArriveIcmpB: 'B prima ICMP {tc}; A ne vidi ništa, ni odgovor ni poruku o grešci.',
      capDropNoRoute: '{r} traži {dst}: nema zapisa ni *default route* (zadanog puta), pa {what} odbacuje.',
      capDropReplyTail: 'Zahtjev je do B stigao, ali A ne vidi ništa.',
      capDropTtl: '{r} ima put za {dst}, ali TTL pada s 1 na 0, pa {what} odbacuje.',
      capDropTtlLoop: 'Petlja nije vječna: TTL je paket zaustavio.',
      capNoErrIcmp: 'O odbačenoj poruci o grešci nova se ne šalje.',
      capNoErrRoute: '{r} nema puta ni do izvora {src}, pa poruku o grešci ne može ni poslati. A ne vidi ništa.',
      capOut: 'ISP preuzima paket za {dst} i nosi ga dalje u internet; ovdje scena završava. Odgovor bi trebao NAT na R3, a to je druga simulacija.',
      capOutLost: 'Paket za {dst} odlazi u internet, a ondje nijedan put ne vodi natrag do privatne mreže: izgubljen je. A ne vidi ništa.',
      wEcho: 'zahtjev',
      wReply: 'odgovor',
      wIcmp: 'poruku o grešci',
      explain: '<p>Usmjernik sam zna samo mreže na svojim sučeljima, <em lang="en">directly connected networks</em> ' +
        '(izravno spojene mreže, C). Za svaku drugu mrežu treba mu zapis. <em lang="en">Static route</em> (statički put, S) ' +
        'upiše administrator i mijenja se samo kad ga on promijeni.</p>' +
        '<p><em lang="en">Default route</em> (zadani put, S*) je <code translate="no">0.0.0.0/0</code>: prefiks duljine nula ' +
        'ne uspoređuje nijedan bit, pa se podudara sa svakom adresom. Zato nikad nije prvi izbor: od svih zapisa koji se ' +
        'podudaraju pobjeđuje <em lang="en">longest prefix match</em> (najdulji podudarajući prefiks), bez obzira na ' +
        'redoslijed. Zadani put dobiva paket tek kad se ništa specifičnije ne podudara. Bez ijednog zapisa i bez zadanog ' +
        'puta usmjernik paket odbacuje i izvoru šalje ICMP 3/0 (mreža nedostupna).</p>' +
        '<p><strong>Put mora postojati u oba smjera.</strong> Odgovor je novi paket koji usmjernici traže iznova; to što je ' +
        'zahtjev stigao ne znači ništa za put natrag. Ako odgovor umre, poruka o grešci ide B-u, a A vidi samo tišinu.</p>' +
        '<p><strong>Petlja.</strong> Kad R3-ov zadani put vodi natrag na R2, a R2-ov na R3, paket kruži. Ne zauvijek: svaki ' +
        'usmjernik smanjuje <em lang="en">TTL</em> (vrijeme života) za jedan, a onaj kojemu padne na nulu paket odbacuje i ' +
        'izvoru šalje ICMP 11/0. O odbačenoj poruci o grešci nova se ne šalje, pa ni greška ne kruži dovijeka.</p>' +
        '<p>Metrika, administrativna udaljenost i dinamičko usmjeravanje nisu dio ove simulacije: dva zapisa s istim ' +
        'prefiksom tablica ovdje ne prima.</p>'
    },
    en: {
      stage: 'The chain A — R1 — R2 — R3 — ISP with host B behind R2, the routing tables of the three routers and the packet on its way',
      r1Static: 'R1: S 192.168.2.0/24 → R2',
      r1Default: 'R1: S* 0.0.0.0/0 → R2',
      r2Static: 'R2: S 192.168.1.0/24 → R1',
      r2Default: 'R2: S* 0.0.0.0/0 → R3',
      r3Default: 'R3: S* 0.0.0.0/0 → ISP',
      r3Back: 'R3: S* 0.0.0.0/0 → R2',
      blocked: 'R3 already has 0.0.0.0/0: no second one.',
      dstB: 'B',
      dst: 'A pings',
      ttl: 'Initial TTL (every sender)',
      presetBoth: 'Routes both ways',
      presetBothHint: 'Example 3a: R1 knows the way to B\'s network, R2 the way to A\'s. Does the reply reach A?',
      presetOne: 'One way only',
      presetOneHint: 'Example 3b: the entry on R2 was forgotten. How far does the request get, and how far the reply?',
      presetDefault: 'Default route on R1',
      presetDefaultHint: 'Example 3c: R1\'s static route is replaced by a default route. Where does R1 send the reply for its own network 192.168.1.0/24?',
      presetInternet: 'To the internet',
      presetInternetHint: 'No router has an entry for 8.8.8.8. How does the packet still reach the ISP?',
      presetLoop: 'Loop',
      presetLoopHint: 'R3\'s default route points back to R2. Does the packet circle forever?',
      legReq: 'echo request',
      legReply: 'echo reply',
      legIcmp: 'ICMP error message',
      legDrop: 'dropped',
      legKinds: 'C directly connected · S static · S* default route',
      legChanged: 'matched entry, TTL',
      host: 'host',
      router: 'router',
      isp: 'internet (ISP)',
      bSends: 'sends',
      bForwards: 'forwards',
      bDrops: 'drops',
      bGets: 'receives',
      bTakes: 'takes it',
      bVisit: 'pass {k}',
      chipEcho: 'echo · TTL {ttl}',
      chipReply: 'reply · TTL {ttl}',
      chipIcmp: 'ICMP {tc} · TTL {ttl}',
      tabTitle: '{r}: routing table',
      colKind: 'kind',
      colNet: 'destination network',
      colHop: 'next hop / interface',
      direct: 'directly, {iface}',
      markWin: 'wins',
      markOnly: 'the only match',
      markBeaten: 'matches, shorter',
      noMatch: 'no entry and no default route',
      refused: 'refused: same prefix',
      pktTitle: 'Packet',
      pktNone: 'Nothing on the wire yet. A is about to send an echo request.',
      fKind: 'kind',
      fSrcDst: 'source → destination',
      fTtl: 'TTL',
      fFate: 'fate',
      kEcho: 'echo request',
      kReply: 'echo reply',
      kIcmp: 'ICMP {tc}',
      i30: 'destination network unreachable',
      i110: 'time exceeded',
      oFlight: 'on its way to {node}',
      oDelivered: 'delivered: {node}',
      oNoRoute: 'dropped at {node}: no route',
      oTtl: 'dropped at {node}: TTL 0',
      oLeft: 'gone into the internet',
      oLost: 'lost in the internet',
      pathTitle: 'This packet\'s path (TTL on leaving)',
      aTitle: 'What A sees',
      aWait: 'nothing yet',
      aReply: 'echo reply: the ping works',
      aIcmp: 'ICMP {tc} from {src}',
      aSilence: 'nothing: no reply and no error message',
      aLeft: 'the request went into the internet',
      capStart: 'A sends an echo request to {dst}, TTL {ttl}. Under each router is its routing table: a router knows the C entries by itself, the administrator typed in S and S*. Press →.',
      capRefused: 'R3 already has the default route 0.0.0.0/0 → ISP, so the table refuses a second entry with the same prefix, 0.0.0.0/0 → R2.',
      capSendA: '{dst} is not on A\'s network {net}, so A sends the packet to its default gateway {gw}, router R1. TTL {ttl}.',
      capSendB: 'B answers: the echo reply to {dst} is a new packet with a path of its own, and goes to B\'s default gateway {gw}, router R2.',
      capSendIcmp: '{r} sends ICMP {tc} ({what}) to the dropped packet\'s source, {dst}, from its interface {src}.',
      capSendIcmpB: '{r} sends ICMP {tc} ({what}) to B, the source of the dropped reply, from its interface {src}.',
      errViaC: 'The way to {dst} is the directly connected network {net}, interface {iface}.',
      errViaS: 'The way to {dst} is the static route {net} → {via}.',
      errViaD: 'Only the default route 0.0.0.0/0 → {via} leads to {dst}.',
      capFwdC: '{r} looks up {dst}: directly connected network {net}, so it sends the packet straight out of {iface}. TTL {a} → {b}.',
      capFwdS: '{r} looks up {dst}: static route {net} → {via}. TTL {a} → {b}.',
      capFwdD: '{r} looks up {dst}: nothing more specific matches, so the default route 0.0.0.0/0 → {via} catches it. TTL {a} → {b}.',
      capBeat: '{other} matches too, but {win} has the longer prefix and wins: longest prefix match, not the order in the table.',
      capLoop: '{r} sees this same packet again, pass {k}: a routing loop, and each round costs 2 of the TTL.',
      capArriveEcho: 'B receives the echo request.',
      capArriveReply: 'A receives the echo reply with TTL {ttl}: the ping works.',
      capArriveIcmpA: 'A receives ICMP {tc} from {src}: {what}.',
      capArriveIcmpB: 'B receives ICMP {tc}; A sees nothing, neither a reply nor an error message.',
      capDropNoRoute: '{r} looks up {dst}: no entry and no default route, so it drops the {what}.',
      capDropReplyTail: 'The request reached B, but A sees nothing.',
      capDropTtl: '{r} has a route for {dst}, but the TTL falls from 1 to 0, so it drops the {what}.',
      capDropTtlLoop: 'The loop is not forever: the TTL stopped the packet.',
      capNoErrIcmp: 'No error message is sent about a dropped error message.',
      capNoErrRoute: '{r} has no route to the source {src} either, so it cannot even send an error message. A sees nothing.',
      capOut: 'The ISP takes the packet for {dst} on into the internet; the scene ends here. The answer would need NAT at R3, which is another simulation.',
      capOutLost: 'The packet for {dst} goes into the internet, where no route leads back to a private network: it is lost. A sees nothing.',
      wEcho: 'request',
      wReply: 'reply',
      wIcmp: 'error message',
      explain: '<p>By itself a router knows only the networks on its own interfaces, its directly connected networks (C). ' +
        'For any other network it needs an entry. A static route (S) is typed in by the administrator and changes only ' +
        'when they change it.</p>' +
        '<p>The default route (S*) is <code translate="no">0.0.0.0/0</code>: a prefix of length zero compares no bit, so it ' +
        'matches every address. That is why it is never the first choice: of all the entries that match, the longest ' +
        'prefix wins, whatever the order. The default route gets the packet only when nothing more specific matches. With ' +
        'no entry and no default route the router drops the packet and sends ICMP 3/0 (network unreachable) to its source.</p>' +
        '<p><strong>A route is needed in both directions.</strong> The reply is a new packet that the routers look up ' +
        'afresh; that the request arrived says nothing about the way back. If the reply dies, the error message goes to B, ' +
        'and A sees only silence.</p>' +
        '<p><strong>The loop.</strong> When R3\'s default route points back to R2 and R2\'s points to R3, the packet circles. ' +
        'Not forever: each router lowers the TTL (time to live) by one, and the one that brings it to zero drops the packet ' +
        'and sends ICMP 11/0 to the source. No error message is sent about a dropped error message, so an error does not ' +
        'circle forever either.</p>' +
        '<p>Metrics, administrative distance and dynamic routing are not part of this simulation: here the table takes no ' +
        'two entries with the same prefix.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
