/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of fragmentation-pmtud, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Terms missing from kit/glossary.js are written out in the explanation as <em lang="en"> (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Put paketa od pošiljatelja preko R1 i R2 do primatelja, paket prije i poslije R2 i ishod',
      bytes: '{v} B',
      and: 'i',

      // params
      size: 'Veličina paketa',
      mtuB: 'MTU veze B',
      overhead: 'Enkapsulacija na vezi B',
      ovh_0: 'bez',
      ovh_4: '802.1Q +4',
      ovh_8: 'PPPoE +8',
      ovh_24: 'GRE +24',
      ovh_50: 'VXLAN +50',
      df: 'DF (ne fragmentiraj)',
      dfHint: 'Zastavica u IPv4 zaglavlju: usmjernik paket ne smije dijeliti.',
      dfV6: 'IPv6 nema zastavicu DF: usmjernici nikad ne fragmentiraju.',
      icmpBlocked: 'Vatrozid blokira ICMP',
      icmpBlockedHint: 'R1 odbacuje ICMP poruke na putu natrag prema pošiljatelju.',
      proto: 'Protokol',
      ipv4: 'IPv4',
      ipv6: 'IPv6',

      // presets
      'preset_primjer-3': 'Primjer 3: 1400 u 500',
      'hint_primjer-3': 'URM pogl. 8, Primjer 3: paket od 1400 okteta kroz mrežu koja prima najviše 500.',
      'preset_just-over': 'Malo prevelik: 1600 u 1500',
      'hint_just-over': 'Drugi fragment nosi samo 100 okteta podataka.',
      'preset_gre-tunnel': 'GRE tunel: 1500 u 1476',
      'hint_gre-tunnel': 'Tunel troši 24 okteta, pa paket od 1500 više ne stane.',
      preset_pmtud: 'Otkrivanje MTU-a puta',
      hint_pmtud: 'DF = 1, veza B 1400: ICMP javlja MTU, pošiljatelj smanjuje paket.',
      'preset_black-hole': 'Crna rupa',
      'hint_black-hole': 'Isto, ali vatrozid odbacuje ICMP: pošiljatelj ništa ne dozna.',

      // legend
      legHdr: 'IP zaglavlje',
      legData: 'podaci',
      legCut: 'granica fragmenta',
      legIcmp: 'ICMP poruka',
      legDrop: 'odbačeno',
      legTunnel: 'zaglavlje enkapsulacije',
      legChanged: 'promijenjeno',

      // path
      sender: 'pošiljatelj',
      receiver: 'primatelj',
      router: 'usmjernik',
      linkLbl: 'veza {k} · MTU {v}',
      linkLblEff: 'veza {k} · MTU {v} − {o} = {eff}',
      pipe: '{name} +{n} B',
      bFw: 'blokira ICMP',
      bSplits: 'dijeli',
      bDrops: 'odbacuje',
      bForwards: 'prosljeđuje',
      bReassembles: 'sastavlja',
      bGets: 'prima',
      bWaits: 'čeka',
      bPmtu: 'MTU puta {v}',
      chipPkt: '{v} B',
      chipPktDf: '{v} B · DF',
      chipFrags: ['{n} fragment', '{n} fragmenta', '{n} fragmenata'],
      chipIcmp: 'ICMP 3/4 · MTU {v}',
      chipIcmp6: 'ICMPv6 2/0 · MTU {v}',
      chipResend: '{v} B ponovno',

      // packet view
      fvSent: 'Pošiljatelj šalje',
      fvOnB: 'Iz R2 na vezu B',
      calcEff: 'Efektivni MTU veze B: {eff} B',
      calcEffOvh: 'Efektivni MTU veze B: {mtu} − {ovh} = {eff} B',
      calcPer: 'podataka po fragmentu: ⌊({eff} − {hdr}) / 8⌋ · 8 = {per} B',
      idLine: 'identifikacijski broj {id} u svakom fragmentu',
      idOne: 'identifikacijski broj {id}',
      blkOff: 'pomak {o} (= {b} B)',
      blkMf: 'MF {m}',
      gapMore: ['još {n} fragment', 'još {n} fragmenta', 'još {n} fragmenata'],
      resentTag: 'ponovno poslan',
      noteDropped: '✕ ništa: R2 je paket odbacio',
      noteBlack: '✕ ništa: R2 odbacuje svaki pokušaj',
      noteV6: 'IPv6 usmjernik nikad ne fragmentira: paket prolazi cijeli ili se odbacuje.',
      noteRefused: 'Veza s efektivnim MTU-om manjim od {min} B nije dopuštena.',

      // timeline
      tlTitle: 'Što se dogodilo',
      who_sender: 'pošiljatelj',
      who_r2: 'R2',
      who_fw: 'R1, vatrozid',
      who_receiver: 'primatelj',
      tl_handshake: 'TCP rukovanje: paketi do {n} B prolaze',
      tl_send: 'šalje paket od {size} B, DF = 0',
      tl_sendDf: 'šalje segment od {size} B, DF = 1',
      tl_sendV6: 'šalje IPv6 segment od {size} B',
      tl_forward: '{size} ≤ {eff}: prosljeđuje ga nepromijenjenog',
      tl_receive: 'prima {size} B',
      tl_fragment: 'dijeli ga na {frags} od najviše {eff} B, svaki sa svojim zaglavljem i istim identifikacijskim brojem',
      tl_reassemble: 'sastavlja {frags} u paket od {size} B; izgubi li se jedan, gubi se cijeli paket',
      tl_noIcmp: 'blokira ICMP, ali ovdje nema što blokirati',
      tl_dropIcmp: '{size} > {eff} i DF = 1: odbacuje paket i šalje ICMP 3/4 „potrebna fragmentacija”, MTU {eff}',
      tl_dropIcmp6: '{size} > {eff}: odbacuje paket i šalje ICMPv6 Packet Too Big, MTU {eff}',
      tl_icmpLost: 'odbacuje ICMP 3/4: pošiljatelj ne čuje ništa',
      tl_icmpLost6: 'odbacuje ICMPv6 Packet Too Big: pošiljatelj ne čuje ništa',
      tl_pmtu: 'prima ICMP: MTU puta {pmtu}, MSS {mss}; ponovno šalje {pmtu} B',
      tl_resend: '{size} ≤ {eff}: prosljeđuje ponovljeni paket, primatelj ga prima',
      tl_retry: 'ponavlja {size} B {times} puta bez odgovora: prijenos stoji, veza „visi nakon spajanja”',
      tl_refused: 'efektivni MTU {eff} < {min}: takva veza nije dopuštena',

      // captions
      capPass: 'Paket od {size} B stane u efektivni MTU od {eff}: prolazi vezu B nepromijenjen, bez fragmentacije.',
      capFragment: 'Paket od {size} okteta ne stane u MTU od {eff}: R2 ga dijeli na {frags} s pomakom {offs} (u jedinicama od 8 okteta); samo zadnji ima MF = 0.',
      capPmtud: 'DF je postavljen, a {size} B ne stane u {eff}: R2 odbacuje paket i javlja ICMP 3/4 s MTU-om {eff}. Pošiljatelj smanjuje MTU puta na {eff} (MSS {mss}) i šalje ponovno, i to prolazi.',
      capPmtud6: 'IPv6 usmjernik ne fragmentira: R2 odbacuje paket od {size} B i javlja ICMPv6 Packet Too Big s MTU-om {eff}. Pošiljatelj smanjuje MTU puta na {eff} (MSS {mss}) i šalje ponovno.',
      capBlack: 'DF je postavljen, a ICMP blokiran: usmjernik odbacuje segment od {size} B, a njegov ICMP nikad ne stigne, pa pošiljatelj uporno ponavlja istu veličinu. To je crna rupa otkrivanja MTU-a puta.',
      capBlack6: 'ICMPv6 je blokiran: usmjernik odbacuje segment od {size} B, a Packet Too Big nikad ne stigne, pa pošiljatelj uporno ponavlja istu veličinu. To je crna rupa otkrivanja MTU-a puta.',
      capRefused: 'Efektivni MTU od {eff} B manji je od {min} B, najmanje što svaka {ver} veza mora prenijeti: takva veza nije dopuštena.',
      capNoIcmp: ' Blokiranje ICMP-a ovdje ništa ne mijenja: nitko ga ne šalje.',

      explain: '<p>Svaka veza ima <b>MTU</b> (<em lang="en">maximum transmission unit</em>, najveća jedinica prijenosa): najveći ' +
        'IP paket koji stane u jedan njezin okvir. Tunel troši dio tog prostora na svoje [[header]], pa je ' +
        'efektivni MTU manji (GRE: 1500 − 24 = 1476; PPPoE 8, VXLAN 50). Oznaka VLAN-a (802.1Q, 4 okteta) MTU smanjuje ' +
        'samo na opremi koja ne prenosi za 4 okteta veći okvir. Paket koji stane prolazi nepromijenjen.</p>' +
        '<p>Ne stane li, IPv4 usmjernik ga može podijeliti: to je <em lang="en">fragmentation</em> (fragmentacija). Svaki ' +
        'fragment dobije svoje [[=header]] i isti <em lang="en">identification</em> (identifikacijski broj); ' +
        '<em lang="en">fragment offset</em> (pomak fragmenta) broji jedinice od 8 okteta, ne oktete, pa podaci svakog ' +
        'fragmenta osim zadnjeg moraju biti višekratnik od 8. Zastavica MF = 1 kaže „slijedi još”. Fragmente sastavlja tek ' +
        'odredište, nikad usmjernik, a izgubi li se jedan, gubi se cijeli paket.</p>' +
        '<p>Postavi li pošiljatelj zastavicu DF (<em lang="en">Don\'t Fragment</em>), usmjernik paket odbacuje i vraća ICMP ' +
        'tip 3, kôd 4, s MTU-om sljedeće veze. Na tome se temelji <em lang="en">path MTU discovery</em> (otkrivanje MTU-a ' +
        'puta): pošiljatelj smanji paket, a TCP šalje segmente od MSS = MTU puta − 40 okteta (IPv4 i TCP zaglavlje po 20; u IPv6 − 60). IPv6 usmjernici nikad ne ' +
        'fragmentiraju i uvijek rade ovako, s porukom ICMPv6 Packet Too Big.</p>' +
        '<p>Zato blokiranje svih ICMP poruka nije bezazleno. Odbaci li [[firewall]] taj ICMP, nastaje <em lang="en">black ' +
        'hole</em> (crna rupa): mali paketi za [[handshake]] prolaze, a svaki puni segment nestane, pa veza „visi nakon ' +
        'spajanja”. Popravak: propustiti ICMP tip 3, kôd 4, ili da usmjernik na tunelu smanji MSS u paketima rukovanja ' +
        '(<em lang="en">MSS clamping</em>). Postoji i otkrivanje MTU-a bez ICMP-a, iz samih izgubljenih paketa, ali ono ' +
        'ovdje nije prikazano.</p>'
    },
    en: {
      stage: 'A packet\'s path from the sender through R1 and R2 to the receiver, the packet before and after R2, and the outcome',
      bytes: '{v} B',
      and: 'and',

      size: 'Packet size',
      mtuB: 'Link B MTU',
      overhead: 'Encapsulation on link B',
      ovh_0: 'none',
      ovh_4: '802.1Q +4',
      ovh_8: 'PPPoE +8',
      ovh_24: 'GRE +24',
      ovh_50: 'VXLAN +50',
      df: 'DF (don\'t fragment)',
      dfHint: 'A flag in the IPv4 header: routers may not split the packet.',
      dfV6: 'IPv6 has no DF flag: routers never fragment.',
      icmpBlocked: 'Firewall blocks ICMP',
      icmpBlockedHint: 'R1 drops ICMP messages on their way back to the sender.',
      proto: 'Protocol',
      ipv4: 'IPv4',
      ipv6: 'IPv6',

      'preset_primjer-3': 'Example 3: 1400 into 500',
      'hint_primjer-3': 'URM ch. 8, Example 3: a 1400-byte packet through a network that takes at most 500.',
      'preset_just-over': 'Just over: 1600 into 1500',
      'hint_just-over': 'The second fragment carries only 100 bytes of data.',
      'preset_gre-tunnel': 'GRE tunnel: 1500 into 1476',
      'hint_gre-tunnel': 'The tunnel takes 24 bytes, so a 1500-byte packet no longer fits.',
      preset_pmtud: 'Path MTU discovery',
      hint_pmtud: 'DF = 1, link B 1400: ICMP reports the MTU, the sender sends smaller.',
      'preset_black-hole': 'Black hole',
      'hint_black-hole': 'The same, but the firewall drops the ICMP: the sender never learns.',

      legHdr: 'IP header',
      legData: 'data',
      legCut: 'fragment boundary',
      legIcmp: 'ICMP message',
      legDrop: 'dropped',
      legTunnel: 'encapsulation header',
      legChanged: 'changed',

      sender: 'sender',
      receiver: 'receiver',
      router: 'router',
      linkLbl: 'link {k} · MTU {v}',
      linkLblEff: 'link {k} · MTU {v} − {o} = {eff}',
      pipe: '{name} +{n} B',
      bFw: 'blocks ICMP',
      bSplits: 'splits',
      bDrops: 'drops',
      bForwards: 'forwards',
      bReassembles: 'reassembles',
      bGets: 'receives',
      bWaits: 'waits',
      bPmtu: 'path MTU {v}',
      chipPkt: '{v} B',
      chipPktDf: '{v} B · DF',
      chipFrags: ['{n} fragment', '{n} fragments'],
      chipIcmp: 'ICMP 3/4 · MTU {v}',
      chipIcmp6: 'ICMPv6 2/0 · MTU {v}',
      chipResend: '{v} B again',

      fvSent: 'The sender sends',
      fvOnB: 'From R2 onto link B',
      calcEff: 'Link B effective MTU: {eff} B',
      calcEffOvh: 'Link B effective MTU: {mtu} − {ovh} = {eff} B',
      calcPer: 'data per fragment: ⌊({eff} − {hdr}) / 8⌋ · 8 = {per} B',
      idLine: 'identification {id} in every fragment',
      idOne: 'identification {id}',
      blkOff: 'offset {o} (= {b} B)',
      blkMf: 'MF {m}',
      gapMore: ['{n} more fragment', '{n} more fragments'],
      resentTag: 'resent',
      noteDropped: '✕ nothing: R2 dropped the packet',
      noteBlack: '✕ nothing: R2 drops every attempt',
      noteV6: 'An IPv6 router never fragments: the packet passes whole or is dropped.',
      noteRefused: 'A link with an effective MTU under {min} B is not allowed.',

      tlTitle: 'What happened',
      who_sender: 'sender',
      who_r2: 'R2',
      who_fw: 'R1, firewall',
      who_receiver: 'receiver',
      tl_handshake: 'TCP handshake: packets of up to {n} B pass',
      tl_send: 'sends a {size}-byte packet, DF = 0',
      tl_sendDf: 'sends a {size}-byte segment, DF = 1',
      tl_sendV6: 'sends a {size}-byte IPv6 segment',
      tl_forward: '{size} ≤ {eff}: forwards it unchanged',
      tl_receive: 'receives {size} B',
      tl_fragment: 'splits it into {frags} of at most {eff} B, each with its own header and the same identification',
      tl_reassemble: 'reassembles {frags} into the {size}-byte packet; lose one and the whole packet is lost',
      tl_noIcmp: 'blocks ICMP, but there is nothing to block here',
      tl_dropIcmp: '{size} > {eff} and DF = 1: drops the packet, sends ICMP 3/4 "fragmentation needed", MTU {eff}',
      tl_dropIcmp6: '{size} > {eff}: drops the packet, sends ICMPv6 Packet Too Big, MTU {eff}',
      tl_icmpLost: 'drops the ICMP 3/4: the sender hears nothing',
      tl_icmpLost6: 'drops the ICMPv6 Packet Too Big: the sender hears nothing',
      tl_pmtu: 'gets the ICMP: path MTU {pmtu}, MSS {mss}; resends {pmtu} B',
      tl_resend: '{size} ≤ {eff}: forwards the resent packet, the receiver gets it',
      tl_retry: 'retransmits {size} B {times} times, no answer: the transfer stalls, the connection "hangs after connect"',
      tl_refused: 'effective MTU {eff} < {min}: such a link is not allowed',

      capPass: 'A {size}-byte packet fits the effective MTU of {eff}: it crosses link B unchanged, no fragmentation.',
      capFragment: 'A {size}-byte packet does not fit the MTU of {eff}: R2 splits it into {frags} with offsets {offs} (in 8-byte units); only the last has MF = 0.',
      capPmtud: 'DF is set and {size} B do not fit {eff}: R2 drops the packet and returns ICMP 3/4 with MTU {eff}. The sender lowers its path MTU to {eff} (MSS {mss}) and resends, which passes.',
      capPmtud6: 'An IPv6 router never fragments: R2 drops the {size}-byte packet and returns ICMPv6 Packet Too Big with MTU {eff}. The sender lowers its path MTU to {eff} (MSS {mss}) and resends.',
      capBlack: 'DF is set and ICMP is blocked: the router drops the {size}-byte segment and its ICMP never arrives, so the sender keeps retrying the same size. This is a PMTUD black hole.',
      capBlack6: 'ICMPv6 is blocked: the router drops the {size}-byte segment and its Packet Too Big never arrives, so the sender keeps retrying the same size. This is a PMTUD black hole.',
      capRefused: 'An effective MTU of {eff} B is under {min} B, the least every {ver} link must carry: such a link is not allowed.',
      capNoIcmp: ' Blocking ICMP changes nothing here: none is sent.',

      explain: '<p>Every link has an <b>MTU</b> (maximum transmission unit): the largest IP packet that fits in one of its ' +
        'frames. A tunnel spends part of that room on its own [[header]], so the effective MTU is smaller (GRE: 1500 − 24 = ' +
        '1476; PPPoE 8, VXLAN 50). A VLAN tag (802.1Q, 4 bytes) lowers the MTU only on equipment that cannot carry the ' +
        '4-byte larger frame. A packet that fits passes unchanged.</p>' +
        '<p>If it does not fit, an IPv4 router may split it: <b>fragmentation</b>. Every fragment gets its own header and the ' +
        'same <b>identification</b>; the <b>fragment offset</b> counts 8-byte units, not bytes, so every fragment\'s data but ' +
        'the last must be a multiple of 8. MF = 1 says "more follow". Only the destination reassembles the fragments, never ' +
        'a router, and if one is lost the whole packet is lost.</p>' +
        '<p>If the sender sets DF (Don\'t Fragment), the router drops the packet instead and returns ICMP type 3, code 4, ' +
        'with the next link\'s MTU. That is <b>path MTU discovery</b>: the sender sends smaller, and TCP sends segments of ' +
        'MSS = path MTU − 40 bytes (20 each for the IPv4 and TCP headers; − 60 in IPv6). IPv6 routers never fragment and always work this way, with ICMPv6 Packet Too Big.</p>' +
        '<p>So blocking all ICMP is not harmless. If a [[firewall]] drops that ICMP, you get a <b>black hole</b>: the small ' +
        '[[handshake]] packets pass, every full segment vanishes, and the connection "hangs after connect". Fixes: let ICMP ' +
        'type 3, code 4 through, or have the tunnel router lower the MSS in the handshake (MSS clamping). Path MTU ' +
        'discovery without ICMP, from the lost packets themselves, also exists but is not shown here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
