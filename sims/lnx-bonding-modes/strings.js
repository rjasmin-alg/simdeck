/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-bonding-modes, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Terms missing from kit/glossary.js are written out (NOTES.md, "Term pairs"). Mode names (active-backup, balance-rr,
   balance-xor, 802.3ad), policy names (layer2, layer3+4) and member names (eth0…) are the names being taught and are
   the same in both tables. The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Poslužitelj S šalje tokove klijentima kroz bond0 i članske veze do preklopnika SW; način rada odlučuje kojom vezom',
      gbit: '{v} Gbit/s',
      and: 'i',

      // params
      mode: 'Način rada',
      'mode_active-backup': 'active-backup',
      'mode_balance-rr': 'balance-rr',
      'mode_balance-xor': 'balance-xor',
      'mode_802.3ad': '802.3ad',
      members: 'Članske veze',
      fail: 'Ispala veza',
      fail_none: 'nijedna',
      fail_eth0: 'eth0',
      fail_eth1: 'eth1',
      policy: 'Politika raspršivanja',
      pol_layer2: 'layer2',
      'pol_layer3+4': 'layer3+4',
      switchCfg: 'Preklopnik',
      sw_none: 'ništa',
      sw_static: 'statički',
      sw_lacp: 'LACP',
      flows: 'Tokovi',
      gateway: 'Klijenti iza usmjernika',

      // presets
      'preset_active-backup-fail': 'Preuzimanje',
      'hint_active-backup-fail': 'eth0 je pala: eth1 preuzima, i dalje 1 Gbit/s.',
      'preset_rr-one-flow': 'Jedan tok, rr',
      'hint_rr-one-flow': 'Jedan tok dobiva 1,6 Gbit/s, ali okviri stižu izmiješani.',
      'preset_lacp-layer2-gateway': 'LACP, layer2',
      'hint_lacp-layer2-gateway': 'Sve na MAC usmjernika: jedna veza. Probaj layer3+4.',
      'preset_lacp-no-partner': 'Bez para',
      'hint_lacp-no-partner': 'Preklopnik ne govori LACP: radi samo jedna veza.',
      'preset_xor-fail-rehash': 'xor, ispad eth1',
      'hint_xor-fail-rehash': 'mod 3 → mod 2: pomiču se i tokovi s ispravnih veza.',

      // legend
      legLane: 'nosi promet',
      legBackup: 'ispravna, miruje',
      legFailed: 'u kvaru',
      legActive: 'aktivna',
      legReorder: 'izmiješano',
      legChanged: 'promijenio vezu',

      // stage
      modeNo: 'mode {n}',
      primary: 'primarna: eth0',
      'rule_active-backup': 'sav promet → aktivna veza',
      'rule_balance-rr': 'okvir za okvirom: {list} redom',
      rule_hash: 'veza = sažetak mod {m}, brojeno od 0 u nizu {list}',
      rule_single: 'nema LACP para: samo jedna veza',
      simplified: 'pojednostavljeno',
      formula_layer2: 'sažetak = MAC izvora ⊕ MAC odredišta',
      'formula_layer3+4': 'sažetak = priključak izvora ⊕ priključak odredišta ⊕ IP izvora ⊕ IP odredišta',
      thFlow: 'tok',
      thMac: 'MAC',
      thIp: 'IP',
      thPort: 'priključak',
      thHash: 'sažetak mod {m}',
      thHashOff: 'sažetak',
      thLink: 'veza',
      cellAll: 'sve',
      server: 'poslužitelj S',
      sw: 'preklopnik',
      toClients: ['→ C1', '→ C1…C{n}', '→ C1…C{n}'],
      toGateway: '→ usmjernik',
      laneActive: 'aktivna',
      laneBackup: 'pričuva',
      laneIdle: 'miruje',
      laneFailed: 'u kvaru',
      badge_none: 'bez postavki',
      badge_static: 'statička skupina',
      badge_lacp: 'LACP',
      badgeOk: 'ispravno',
      badgeNotNeeded: 'ne treba',
      badgeNeeds_static: 'treba statička',
      badgeNeeds_lacp: 'treba LACP',
      warn_reorder: 'okviri stižu izvan redoslijeda',
      warn_macFlap: 'MAC adresa skače između priključaka',
      warn_noPartner: 'LACP bez para',
      warnNone: 'bez upozorenja',
      sumCapacity: 'kapacitet {n} × 1 Gbit/s',
      sumDelivered: 'isporučeno {v}',
      sumFastest: 'najbrži tok {v}',
      unreliable: 'nepouzdano',

      // captions
      nFlows: ['{n} tok', '{n} toka', '{n} tokova'],
      waits: ['{list} čeka', '{list} čekaju', '{list} čekaju'],
      capMoved: ['{n} tok promijenio je vezu.', '{n} toka promijenila su vezu.', '{n} tokova promijenilo je vezu.'],
      capAB: 'active-backup: promet ide samo kroz {active}; {waits}. Kad {active2} padne, {next} postaje aktivno sučelje i šalje besplatni ARP, a preklopnik ne treba nikakvu posebnu postavku.',
      capABFail: 'active-backup: {failed} je pala; nadzor veze to vidi za oko 100 ms, {active} postaje aktivno sučelje i šalje besplatni ARP da preklopnik nauči MAC adresu na novom priključku. I dalje {d} Gbit/s, bez ikakve promjene na preklopniku.',
      capABBackup: 'active-backup: pala je pričuvna veza {failed}; promet ostaje na {active} i ništa se nije pomaknulo.',
      capABSwitch: 'Za ovaj način skupina na preklopniku nije potrebna.',
      capRR: ['balance-rr: okviri idu redom vezama {list}, pa tok dobiva {r} Gbit/s, više od jedne veze, ali okviri stižu izvan redoslijeda (ovdje ostaje 80 %).',
        'balance-rr: okviri idu redom vezama {list}; {n} toka dijele {d} Gbit/s, ali okviri stižu izvan redoslijeda (ovdje ostaje 80 %).',
        'balance-rr: okviri idu redom vezama {list}; {n} tokova dijeli {d} Gbit/s, ali okviri stižu izvan redoslijeda (ovdje ostaje 80 %).'],
      capRROne: 'balance-rr s jednom preostalom vezom ({k}): nema miješanja okvira, {d} Gbit/s.',
      capRRFail: '{failed} je pala: balance-rr jednostavno koristi preostale veze.',
      capHash: '{lacp}Svaki tok ide jednom vezom (sažetak mod {m}); najbrži tok dobiva {f} Gbit/s, nikad više od jedne veze. Isporučeno {d} od {cap} Gbit/s.',
      capHashSame: '{lacp}Svi tokovi daju isti sažetak i idu vezom {k}, a ostale miruju: {policy} čita {inputs}, a ti su podaci za sve tokove isti.',
      capLacp: '802.3ad: LACP se dogovorio s preklopnikom i sve ispravne veze su u istoj skupini. ',
      capXor: 'balance-xor raspršuje bez dogovora s preklopnikom. ',
      inputs_layer2: 'samo MAC adrese',
      'inputs_layer3+4': 'IP adrese i priključke',
      capRehash: '{failed} je pala: tokovi su ponovno raspršeni na {list} (mod {m}); {moved}, nijedan prijenos nije prekinut.',
      moved: ['{n} tok je na drugoj vezi nego bez kvara', '{n} toka su na drugoj vezi nego bez kvara', '{n} tokova je na drugoj vezi nego bez kvara'],
      movedNone: 'svaki tok je na istoj vezi kao bez kvara',
      movedHealthy: ['{n} od njih s ispravne veze', '{n} od njih s ispravne veze', '{n} od njih s ispravne veze'],
      capFlap: 'Preklopnik ({cfg}) vidi MAC adresu poslužitelja S na više priključaka i stalno je ponovno uči (MAC adresa skače), pa je isporuka nepouzdana: ovaj način treba statičku skupinu.',
      capNoPartner: '802.3ad bez LACP-a na preklopniku: nitko ne odgovara, veze se ne udružuju u jednu skupinu i bond koristi samo {k}: ukupno {d} Gbit/s.',

      explain: '<p><em lang="en">Bonding</em> (udruživanje sučelja) spaja nekoliko članskih veza (<em lang="en">member link</em>, ' +
        'u dokumentaciji <em lang="en">slave</em>) u jedno sučelje, ovdje <b>bond0</b>. Način rada odlučuje što se dobiva, a ' +
        'što gubi:</p>' +
        '<ul><li><b>active-backup</b> (aktivno-pričuvni način, mode 1): radi jedna veza, ostale čekaju. Nema dodatne brzine, ali ' +
        'ne treba ništa od preklopnika. Kad aktivna veza padne, nadzor veze (<em lang="en">miimon</em>, npr. 100 ms) to vidi, ' +
        'iduća veza preuzima (<em lang="en">failover</em>, preuzimanje) i šalje besplatni ARP (<em lang="en">gratuitous ARP</em>) ' +
        'da preklopnik nauči MAC adresu na novom priključku. Ovdje je eth0 postavljena kao primarna, pa se promet vraća na nju ' +
        'kad proradi.</li>' +
        '<li><b>balance-rr</b> (mode 0): okvir za okvirom, redom po vezama. Jedini način u kojem jedan tok premašuje jednu vezu, ' +
        'ali okviri stižu izvan redoslijeda pa TCP gubi dio brzine (ovdje pojednostavljeno na 80 %).</li>' +
        '<li><b>balance-xor</b> (mode 2): svaki tok ide jednom vezom, prema sažetku zaglavlja ([[hashing]]); politika ' +
        'raspršivanja (<em lang="en">hash policy</em>) <b>layer2</b> čita MAC adrese, <b>layer3+4</b> IP adrese i priključke. ' +
        'Formule su ovdje pojednostavljene.</li>' +
        '<li><b>802.3ad</b> (mode 4, IEEE 802.1AX): raspršivanje kao balance-xor, ali veze se dogovaraju s preklopnikom ' +
        'protokolom LACP (poruke svakih 30 s ili 1 s). Bez LACP-a na preklopniku nema para i radi samo jedna veza.</li></ul>' +
        '<p>Načini balance-rr i balance-xor trebaju statičku skupinu na preklopniku; bez nje preklopnik vidi istu MAC ' +
        'adresu na više priključaka. Kad veza ispadne, tokovi se ponovno raspršuju (mod N − 1) i pomiču se i oni s ispravnih ' +
        'veza.</p>' +
        '<p>Česte zablude: bond od 2 × 1 Gbit/s ne daje jednom prijenosu 2 Gbit/s (samo balance-rr, uz cijenu); active-backup ' +
        'ne baca vezu uzalud (ne treba podršku preklopnika i preživljava ispad priključka); 802.3ad ne radi bez postavki na ' +
        'preklopniku.</p>' +
        '<p>Prikazan je samo smjer slanja s poslužitelja; što preklopnik šalje natrag odlučuje njegov vlastiti sažetak. Nisu ' +
        'prikazani načini balance-tlb, balance-alb i broadcast, nadzor pomoću ARP-a ni udruživanje preko dva preklopnika.</p>'
    },
    en: {
      stage: 'Server S sends flows to the clients through bond0 and its member links to switch SW; the mode decides which link',
      gbit: '{v} Gbit/s',
      and: 'and',

      mode: 'Mode',
      'mode_active-backup': 'active-backup',
      'mode_balance-rr': 'balance-rr',
      'mode_balance-xor': 'balance-xor',
      'mode_802.3ad': '802.3ad',
      members: 'Member links',
      fail: 'Failed link',
      fail_none: 'none',
      fail_eth0: 'eth0',
      fail_eth1: 'eth1',
      policy: 'Hash policy',
      pol_layer2: 'layer2',
      'pol_layer3+4': 'layer3+4',
      switchCfg: 'Switch',
      sw_none: 'none',
      sw_static: 'static',
      sw_lacp: 'LACP',
      flows: 'Flows',
      gateway: 'Clients behind the gateway',

      'preset_active-backup-fail': 'Failover',
      'hint_active-backup-fail': 'eth0 is down: eth1 takes over, still 1 Gbit/s.',
      'preset_rr-one-flow': 'One flow, rr',
      'hint_rr-one-flow': 'One flow gets 1.6 Gbit/s, but its frames arrive out of order.',
      'preset_lacp-layer2-gateway': 'LACP, layer2',
      'hint_lacp-layer2-gateway': 'All to the gateway\'s MAC: one link. Try layer3+4.',
      'preset_lacp-no-partner': 'No partner',
      'hint_lacp-no-partner': 'The switch does not speak LACP: one link only.',
      'preset_xor-fail-rehash': 'xor, eth1 fails',
      'hint_xor-fail-rehash': 'mod 3 → mod 2: flows on working links move too.',

      legLane: 'carries traffic',
      legBackup: 'up but idle',
      legFailed: 'failed',
      legActive: 'active',
      legReorder: 'reordered',
      legChanged: 'changed link',

      modeNo: 'mode {n}',
      primary: 'primary: eth0',
      'rule_active-backup': 'all traffic → the active link',
      'rule_balance-rr': 'frame by frame: {list} in turn',
      rule_hash: 'link = hash mod {m}, counted from 0 in {list}',
      rule_single: 'no LACP partner: one link only',
      simplified: 'simplified',
      formula_layer2: 'hash = src MAC ⊕ dst MAC',
      'formula_layer3+4': 'hash = src port ⊕ dst port ⊕ src IP ⊕ dst IP',
      thFlow: 'flow',
      thMac: 'MAC',
      thIp: 'IP',
      thPort: 'port',
      thHash: 'hash mod {m}',
      thHashOff: 'hash',
      thLink: 'link',
      cellAll: 'all',
      server: 'server S',
      sw: 'switch',
      toClients: ['→ C1', '→ C1…C{n}'],
      toGateway: '→ gateway',
      laneActive: 'active',
      laneBackup: 'backup',
      laneIdle: 'idle',
      laneFailed: 'failed',
      badge_none: 'no config',
      badge_static: 'static aggregate',
      badge_lacp: 'LACP',
      badgeOk: 'correct',
      badgeNotNeeded: 'not needed',
      badgeNeeds_static: 'needs static',
      badgeNeeds_lacp: 'needs LACP',
      warn_reorder: 'frames arrive out of order',
      warn_macFlap: 'MAC flapping between ports',
      warn_noPartner: 'LACP without a partner',
      warnNone: 'no warnings',
      sumCapacity: 'capacity {n} × 1 Gbit/s',
      sumDelivered: 'delivered {v}',
      sumFastest: 'fastest flow {v}',
      unreliable: 'unreliable',

      nFlows: ['{n} flow', '{n} flows'],
      waits: ['{list} waits', '{list} wait'],
      capMoved: ['{n} flow changed link.', '{n} flows changed link.'],
      capAB: 'active-backup: traffic uses only {active}; {waits}. When {active2} fails, {next} becomes active and sends a gratuitous ARP; the switch needs no special configuration.',
      capABFail: 'active-backup: {failed} failed; link monitoring notices within about 100 ms, {active} becomes active and sends a gratuitous ARP so the switch learns the MAC address on its new port. Still {d} Gbit/s, with no change on the switch.',
      capABBackup: 'active-backup: backup link {failed} failed; traffic stays on {active} and nothing moved.',
      capABSwitch: 'This mode does not need an aggregate on the switch.',
      capRR: ['balance-rr: frames go to {list} in turn, so the flow gets {r} Gbit/s, more than one link, but its frames arrive out of order (80 % kept here).',
        'balance-rr: frames go to {list} in turn; {n} flows share {d} Gbit/s, but frames arrive out of order (80 % kept here).'],
      capRROne: 'balance-rr with one link left ({k}): no reordering, {d} Gbit/s.',
      capRRFail: '{failed} failed: balance-rr just uses the remaining links.',
      capHash: '{lacp}Each flow takes one link (hash mod {m}); the fastest flow gets {f} Gbit/s, never more than one link. Delivered {d} of {cap} Gbit/s.',
      capHashSame: '{lacp}Every flow gives the same hash and takes link {k}, while the others are idle: {policy} reads {inputs}, and they are the same for every flow.',
      capLacp: '802.3ad: LACP agreed with the switch and every working link joined one aggregate. ',
      capXor: 'balance-xor hashes without negotiating with the switch. ',
      inputs_layer2: 'only the MAC addresses',
      'inputs_layer3+4': 'the IP addresses and ports',
      capRehash: '{failed} failed: the flows were re-hashed onto {list} (mod {m}); {moved}, no transfer was cut.',
      moved: ['{n} flow is on a different link than it would be without the failure', '{n} flows are on a different link than they would be without the failure'],
      movedNone: 'every flow is on the link it would have without the failure',
      movedHealthy: ['{n} of them from a working link', '{n} of them from a working link'],
      capFlap: 'The switch ({cfg}) sees server S\'s MAC address on several ports and keeps relearning it (MAC flapping), so delivery is unreliable: this mode needs a static aggregate.',
      capNoPartner: '802.3ad without LACP on the switch: no partner answers, the links do not join one aggregate, and the bond uses only {k}: {d} Gbit/s in total.',

      explain: '<p><b>Bonding</b> joins several <b>member links</b> (called <em>slaves</em> in the documentation) into one ' +
        'interface, here <b>bond0</b>. The mode decides what you gain and what you give up:</p>' +
        '<ul><li><b>active-backup</b> (mode 1): one link works, the others wait. No extra speed, but nothing is needed from ' +
        'the switch. When the active link fails, link monitoring (<em>miimon</em>, e.g. 100 ms) notices, the next link takes ' +
        'over (<b>failover</b>) and sends a <b>gratuitous ARP</b> so the switch learns the MAC address on its new port. Here ' +
        'eth0 is set as the primary, so traffic returns to it when it is back.</li>' +
        '<li><b>balance-rr</b> (mode 0): frame by frame, the links in turn. The only mode in which one flow exceeds one link, ' +
        'but frames arrive out of order and TCP loses some speed (simplified to 80 % here).</li>' +
        '<li><b>balance-xor</b> (mode 2): each flow takes one link, chosen by [[hashing]] its headers; the <b>hash policy</b> ' +
        '<b>layer2</b> reads the MAC addresses, <b>layer3+4</b> the IP addresses and ports. The formulas are simplified here.</li>' +
        '<li><b>802.3ad</b> (mode 4, IEEE 802.1AX): hashing as in balance-xor, but the links are negotiated with the switch ' +
        'by LACP (messages every 30 s or 1 s). Without LACP on the switch there is no partner and only one link works.</li></ul>' +
        '<p>balance-rr and balance-xor need a static aggregate on the switch; without it the switch sees the same MAC address ' +
        'on several ports. When a link fails, the flows are re-hashed (mod N − 1), and flows on working links can move too.</p>' +
        '<p>Common mistakes: a 2 × 1 Gbit/s bond does not give one transfer 2 Gbit/s (only balance-rr does, at a cost); ' +
        'active-backup does not waste a link for nothing (it needs no switch support and survives a switch port failure); ' +
        '802.3ad does not work without configuring the switch.</p>' +
        '<p>Only what the server sends is shown; what the switch sends back is decided by its own hash. Not shown: the ' +
        'balance-tlb, balance-alb and broadcast modes, ARP monitoring, and aggregation across two switches.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
