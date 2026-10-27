/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of intervlan-routing, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json. Terms (URM ch07, ch12): router on a stick — usmjernik na štapu;
   subinterface — podsučelje; trunk port — trunk priključak; access port — pristupni priključak; tag — oznaka;
   VLAN identifier (VID) — VLAN identifikator; default gateway — zadani pristupnik; SVI — virtualno sučelje VLAN-a. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Okvir od VLAN-a 10 do VLAN-a 20',

      mode: 'Tko usmjerava',
      modeRoas: 'usmjernik na štapu',
      modeL3: 'L3 preklopnik',
      dst: 'Odredište',
      dstQ1: 'Q1 (VLAN 20)',
      dstP2: 'P2 (VLAN 10)',
      fault: 'Pogreška',
      faultHint: 'Samo kod usmjernika na štapu.',
      faultNone: 'nema',
      faultAccess: 'Gi0/1 pristupni',
      faultVid: 'dot1q 21',

      presetRoas: 'Usmjernik na štapu',
      presetL3: 'L3 preklopnik (SVI)',
      presetSame: 'Isti VLAN',
      presetAccess: 'Gi0/1 ostao pristupni',
      presetAccessHint: 'Primjer 6 iz 7. poglavlja: što ako je preklopnik krivo postavljen?',
      presetVid: 'Krivi VID na podsučelju',
      presetVidHint: 'Podsučelje Gi0/0.20, ali dot1q 21.',

      legV10: 'VLAN 10',
      legV20: 'VLAN 20',
      legUntagged: 'okvir bez oznake',
      legTagged: 'okvir s oznakom VID',
      legDrop: 'odbačen',
      legChanged: 'promijenjeno u ovom koraku',

      // field strip
      stripNone: 'Okvir još ne postoji: P1 ima paket za {dst}.',
      stripOnLink: 'Okvir na vezi {a} – {b}',
      stripInDev: 'Okvir u {d}',
      stripInVlan: 'Okvir u {d}, VLAN {v}',
      stripDropped: 'Okvir odbačen u {d}',
      fDstMac: 'odredišni MAC',
      fSrcMac: 'izvorišni MAC',
      fTag: '802.1Q oznaka',
      fSize: 'duljina',
      fSrcIp: 'IP izvor',
      fDstIp: 'IP odredište',
      fTtl: 'TTL',
      tagNone: 'nema',
      tagVid: 'VID {v}',
      bytes: '{n} B',

      // right column
      hostTitle: 'P1: maska odlučuje',
      hostIdle: 'P1 još nije odlučio.',
      hostAnd: '{dst} AND {mask} = {theirs}',
      hostRemote: 'P1 je u {own}: različito → zadani pristupnik {gw}',
      hostLocal: 'P1 je u {own}: isto → izravno na P2',
      macTitle: 'SW1: tablica MAC adresa',
      colVlan: 'VLAN',
      colMac: 'MAC',
      colPort: 'priključak',
      selfPort: 'SW1 sam ({p})',
      subifTitle: 'R1: podsučelja',
      colSubif: 'podsučelje',
      colVid: 'dot1q VID',
      colAddr: 'adresa',
      sviTitle: 'SW1: sučelja VLAN-ova (SVI)',
      colSvi: 'sučelje',
      noMatch: 'bez oznake → nijedno podsučelje ✕',
      noVlan: 'VID {v} → SW1 nema VLAN {v} ✕',
      routeHit: '{dst} → {net}',
      countTitle: 'Prijelazi po vezi',

      // topology
      nameP: 'Prodaja',
      nameQ: 'Proizvodnja',
      roleRouter: 'usmjernik',
      roleSwitch: 'preklopnik',
      roleL3: 'L3 preklopnik',
      portToR1Trunk: '{p} prema R1: trunk',
      portToR1Access: '{p} prema R1: pristupni, VLAN {v}',
      bSends: 'šalje',
      bTakes: 'prima',
      bVlan: 'VLAN {v}',
      bRoutes: 'usmjerava',
      bDrops: '✕ odbacuje',
      bGot: '✓ primio',
      chipUntagged: 'bez oznake',
      chipTag: 'VID {v}',

      // captions
      capStart: 'P1 (VLAN 10) šalje paket za {dst}. ARP je već razriješen: sve MAC adrese su poznate. Pritisni → za korak 1.',
      capSendRemote: 'Korak 1: P1 primjenjuje svoju masku: {dst} je u mreži {theirs}, a P1 u {own}. Zato šalje okvir zadanom pristupniku {gw}, na MAC {mac}, bez oznake.',
      capSendLocal: 'Korak 1: P1 primjenjuje svoju masku: {dst} je u istoj mreži {own}. Okvir ide izravno na MAC {mac} od P2, bez oznake; usmjernik ga neće vidjeti.',
      capSwInAccess: 'Korak {n}: SW1 prima okvir na pristupnom priključku {port}, koji ga stavlja u VLAN {v}. U tablici VLAN-a {v} MAC {mac} je na {out}.',
      capSwInTrunk: 'Korak {n}: SW1 prima okvir na trunk priključku {port} i čita oznaku: VID {v}, dakle VLAN {v}. U tablici VLAN-a {v} MAC {mac} je na {out}.',
      capSwInSelf: 'Korak {n}: SW1 prima okvir na {port} u VLAN-u {v}. MAC {mac} je SW1-ov vlastiti, sučelja VLAN-a {v}: okvir ide na usmjeravanje unutar preklopnika.',
      capSwOutTag: 'Korak {n}: SW1 šalje okvir na trunk priključak {port} i umeće 802.1Q oznaku VID {v} — okvir naraste s 1518 na 1522 okteta.',
      capSwOutUntag: 'Korak {n}: {port} je pristupni priključak: SW1 skida oznaku VID {v} (1522 → 1518 okteta) i šalje okvir prema {to}.',
      capSwOutPlain: 'Korak {n}: {port} je pristupni priključak u VLAN-u {v}: okvir izlazi bez oznake prema {to}.',
      capR1In: 'Korak {n}: R1 prima okvir na Gi0/0. Oznaka VID {v} odgovara podsučelju {subif} (dot1q {v}): okvir je njegov.',
      capR1Route: 'Korak {n}: R1 usmjerava paket kroz {subif}: nove MAC adrese, TTL {a} → {b}, oznaka VID {v} — natrag istim trunkom kojim je stigao.',
      capSviRoute: 'Korak {n}: SW1 usmjerava unutar sebe: {dst} je u {net} na sučelju VLAN-a {v}. Nove MAC adrese, TTL {a} → {b}; u tablici VLAN-a {v} MAC {mac} je na {out}. Oznaka se ne pojavljuje ni na jednoj žici.',
      capDeliverRoas: 'Korak {n}: {host} prima okvir: njegov MAC, bez oznake, njegova IP adresa. Stiglo s TTL {ttl}; trunk je prijeđen {k} puta, gore u VLAN-u 10 i dolje u VLAN-u 20.',
      capDeliverL3: 'Korak {n}: {host} prima okvir: njegov MAC, bez oznake, njegova IP adresa. Stiglo s TTL {ttl}, a nijedna žica nije nosila oznaku.',
      capDeliverLocal: 'Korak {n}: {host} prima okvir. Isti VLAN, ista mreža: TTL ostaje {ttl}, a usmjernik nije sudjelovao.',
      capDropUntagged: 'Korak {n}: okvir stiže na R1 bez oznake. Nijedno podsučelje ne prima okvire bez oznake, pa ga R1 odbacuje. Ni odgovor u drugom smjeru zato nikad ne krene.',
      capDropVid: 'Korak {n}: SW1 na trunku čita VID {v}, a VLAN {v} ne postoji na SW1: okvir se odbacuje. VLAN određuje broj iza dot1q, ne broj podsučelja.',
      capDrop: 'Korak {n}: okvir je odbačen u {d}.',

      explain: '<p>Svaki VLAN je zasebna mreža s vlastitom IP podmrežom; preklopnik prosljeđuje okvir samo unutar njegova ' +
        'VLAN-a. Da bi okvir iz VLAN-a 10 stigao u VLAN 20, mora ga usmjeriti uređaj trećeg sloja.</p>' +
        '<p><b>Usmjernik na štapu</b> (<i>router on a stick</i>): R1 ima jedno fizičko sučelje i na njemu po jedno ' +
        '<b>podsučelje</b> (<i>subinterface</i>) za svaki VLAN. Veza prema SW1 je <i>trunk</i>: okvir gore nosi oznaku ' +
        'VID 10, R1 je skida, smanji TTL, upiše nove MAC adrese i vrati okvir istom vezom s oznakom VID 20. Jedan kabel ' +
        'umjesto po jednog sučelja za svaki VLAN, ali svaki takav okvir prelazi <i>trunk</i> dvaput.</p>' +
        '<p><b>L3 preklopnik</b>: SW1 sam ima sučelje za svaki VLAN (<i>SVI</i>, virtualno sučelje VLAN-a) s adresom ' +
        'zadanog pristupnika. Okvir se usmjerava unutar preklopnika i nijedna žica ne nosi oznaku.</p>' +
        '<p>Česte zablude: VLAN-ovi ne razgovaraju sami od sebe kroz preklopnik; usmjernik oznaku ne propušta, nego ' +
        'skida VID 10 i stavlja VID 20; VLAN podsučelja određuje broj u naredbi <span translate="no">dot1q</span>, a ne ' +
        'broj iza točke. ARP je ovdje već razriješen.</p>'
    },
    en: {
      stage: 'A frame from VLAN 10 to VLAN 20',

      mode: 'Who routes',
      modeRoas: 'router on a stick',
      modeL3: 'L3 switch',
      dst: 'Destination',
      dstQ1: 'Q1 (VLAN 20)',
      dstP2: 'P2 (VLAN 10)',
      fault: 'Fault',
      faultHint: 'Router on a stick only.',
      faultNone: 'none',
      faultAccess: 'Gi0/1 access',
      faultVid: 'dot1q 21',

      presetRoas: 'Router on a stick',
      presetL3: 'L3 switch (SVIs)',
      presetSame: 'Same VLAN',
      presetAccess: 'Gi0/1 left as access',
      presetAccessHint: 'Chapter 7, Example 6: what if the switch is set up wrong?',
      presetVid: 'Wrong VID on a subinterface',
      presetVidHint: 'Subinterface Gi0/0.20, but dot1q 21.',

      legV10: 'VLAN 10',
      legV20: 'VLAN 20',
      legUntagged: 'untagged frame',
      legTagged: 'frame tagged VID',
      legDrop: 'dropped',
      legChanged: 'changed in this step',

      stripNone: 'No frame yet: P1 has a packet for {dst}.',
      stripOnLink: 'Frame on the link {a} – {b}',
      stripInDev: 'Frame in {d}',
      stripInVlan: 'Frame in {d}, VLAN {v}',
      stripDropped: 'Frame dropped in {d}',
      fDstMac: 'dst MAC',
      fSrcMac: 'src MAC',
      fTag: '802.1Q tag',
      fSize: 'size',
      fSrcIp: 'IP source',
      fDstIp: 'IP destination',
      fTtl: 'TTL',
      tagNone: 'none',
      tagVid: 'VID {v}',
      bytes: '{n} B',

      hostTitle: 'P1: the mask decides',
      hostIdle: 'P1 has not decided yet.',
      hostAnd: '{dst} AND {mask} = {theirs}',
      hostRemote: 'P1 is in {own}: different → default gateway {gw}',
      hostLocal: 'P1 is in {own}: same → straight to P2',
      macTitle: 'SW1: MAC address table',
      colVlan: 'VLAN',
      colMac: 'MAC',
      colPort: 'port',
      selfPort: 'SW1 itself ({p})',
      subifTitle: 'R1: subinterfaces',
      colSubif: 'subinterface',
      colVid: 'dot1q VID',
      colAddr: 'address',
      sviTitle: 'SW1: VLAN interfaces (SVIs)',
      colSvi: 'interface',
      noMatch: 'untagged → no subinterface ✕',
      noVlan: 'VID {v} → SW1 has no VLAN {v} ✕',
      routeHit: '{dst} → {net}',
      countTitle: 'Crossings per link',

      nameP: 'Sales',
      nameQ: 'Production',
      roleRouter: 'router',
      roleSwitch: 'switch',
      roleL3: 'L3 switch',
      portToR1Trunk: '{p} to R1: trunk',
      portToR1Access: '{p} to R1: access, VLAN {v}',
      bSends: 'sends',
      bTakes: 'takes in',
      bVlan: 'VLAN {v}',
      bRoutes: 'routes',
      bDrops: '✕ drops',
      bGot: '✓ received',
      chipUntagged: 'untagged',
      chipTag: 'VID {v}',

      capStart: 'P1 (VLAN 10) sends a packet to {dst}. ARP is already resolved: every MAC address is known. Press → for step 1.',
      capSendRemote: 'Step 1: P1 applies its own mask: {dst} is in network {theirs}, P1 in {own}. So it sends the frame to its default gateway {gw}, to MAC {mac}, untagged.',
      capSendLocal: 'Step 1: P1 applies its own mask: {dst} is in the same network {own}. The frame goes straight to P2\'s MAC {mac}, untagged; no router will see it.',
      capSwInAccess: 'Step {n}: SW1 takes the frame in on access port {port}, which puts it in VLAN {v}. In VLAN {v}\'s table, MAC {mac} is on {out}.',
      capSwInTrunk: 'Step {n}: SW1 takes the frame in on trunk port {port} and reads the tag: VID {v}, so VLAN {v}. In VLAN {v}\'s table, MAC {mac} is on {out}.',
      capSwInSelf: 'Step {n}: SW1 takes the frame in on {port} in VLAN {v}. MAC {mac} is SW1\'s own, VLAN {v}\'s interface: the frame goes to routing inside the switch.',
      capSwOutTag: 'Step {n}: SW1 sends the frame out of trunk port {port} and inserts the 802.1Q tag VID {v} — the frame grows from 1518 to 1522 bytes.',
      capSwOutUntag: 'Step {n}: {port} is an access port: SW1 removes the tag VID {v} (1522 → 1518 bytes) and sends the frame to {to}.',
      capSwOutPlain: 'Step {n}: {port} is an access port in VLAN {v}: the frame leaves untagged towards {to}.',
      capR1In: 'Step {n}: R1 takes the frame in on Gi0/0. The tag VID {v} matches subinterface {subif} (dot1q {v}): the frame is its own.',
      capR1Route: 'Step {n}: R1 routes the packet out of {subif}: new MAC addresses, TTL {a} → {b}, tag VID {v} — back over the same trunk it came in on.',
      capSviRoute: 'Step {n}: SW1 routes inside itself: {dst} is in {net} on VLAN {v}\'s interface. New MAC addresses, TTL {a} → {b}; in VLAN {v}\'s table, MAC {mac} is on {out}. No tag appears on any wire.',
      capDeliverRoas: 'Step {n}: {host} takes the frame: its MAC, untagged, its IP address. Arrived with TTL {ttl}; the trunk was crossed {k} times, up in VLAN 10 and down in VLAN 20.',
      capDeliverL3: 'Step {n}: {host} takes the frame: its MAC, untagged, its IP address. Arrived with TTL {ttl}, and no wire carried a tag.',
      capDeliverLocal: 'Step {n}: {host} takes the frame. Same VLAN, same network: the TTL stays {ttl}, and no router took part.',
      capDropUntagged: 'Step {n}: the frame reaches R1 untagged. No subinterface takes untagged frames, so R1 drops it. The reply in the other direction never starts either.',
      capDropVid: 'Step {n}: SW1 reads VID {v} on the trunk, and SW1 has no VLAN {v}: the frame is dropped. The number after dot1q decides the VLAN, not the subinterface number.',
      capDrop: 'Step {n}: the frame is dropped in {d}.',

      explain: '<p>Each VLAN is a network of its own with its own IP subnet; a switch forwards a frame only within its ' +
        'VLAN. For a frame from VLAN 10 to reach VLAN 20, a layer 3 device has to route it.</p>' +
        '<p><b>Router on a stick</b>: R1 has one physical interface and on it one <b>subinterface</b> per VLAN. The link ' +
        'to SW1 is a <i>trunk</i>: going up, the frame carries the tag VID 10; R1 removes it, decrements the TTL, writes ' +
        'new MAC addresses and sends the frame back over the same link tagged VID 20. One cable instead of an interface ' +
        'per VLAN, but every such frame crosses the trunk twice.</p>' +
        '<p><b>L3 switch</b>: SW1 itself has an interface per VLAN (<i>SVI</i>, switched virtual interface) holding the ' +
        'default gateway\'s address. The frame is routed inside the switch and no wire carries a tag.</p>' +
        '<p>Common mistakes: VLANs do not talk to each other through the switch by themselves; the router does not pass ' +
        'the tag through, it removes VID 10 and adds VID 20; a subinterface\'s VLAN is set by the number in the ' +
        '<span translate="no">dot1q</span> line, not by the number after the dot. ARP is already resolved here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
