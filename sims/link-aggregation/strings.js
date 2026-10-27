/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of link-aggregation, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Terms missing from kit/glossary.js are written out in the explanation as <em lang="en"> (NOTES.md, "Term pairs").
   Policy names (layer2, layer2+3, layer3+4) are the names being taught and are the same in both tables.
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijenti šalju tokove preko preklopnika SW i članskih veza do poslužitelja S; svaki tok ide jednom vezom',
      gbit: '{v} Gbit/s',
      and: 'i',

      // params
      members: 'Članske veze',
      policy: 'Pravilo sažetka',
      policyHint: 'Pojednostavljene formule: vidi gornji redak pozornice.',
      pol_layer2: 'layer2',
      'pol_layer2+3': 'layer2+3',
      'pol_layer3+4': 'layer3+4',
      flows: 'Tokovi',
      fail: 'Ispala veza',
      fail_none: 'nijedna',
      fail_link1: 'veza 1',
      fail_link2: 'veza 2',
      fail_all: 'sve',
      sameClient: 'Svi tokovi od C1',
      sameClientHint: 'Isti par MAC i IP adresa, različiti izvorišni priključci.',
      demand: 'Zahtjev po toku',

      // presets
      'preset_one-flow': 'Jedan tok',
      'hint_one-flow': 'Sigurnosna kopija C1 → S preko 2 × 1 Gbit/s: dobiva 1 Gbit/s, ne 2.',
      'preset_same-pair': 'Isti par adresa',
      'hint_same-pair': '4 toka od C1 s pravilom layer2 idu istom vezom; probaj layer3+4.',
      'preset_many-clients': '8 klijenata',
      'hint_many-clients': 'Raspodjela po MAC adresi je neravnomjerna: jedna veza puna, druga ne.',
      preset_fail: 'Ispad veze 2',
      hint_fail: 'Svi tokovi prelaze na vezu 1; nitko nije odspojen.',
      'preset_four-links': '3 toka, 4 veze',
      'hint_four-links': 'Manje tokova nego veza: barem jedna veza miruje.',

      // legend
      legLane: 'članska veza, 1 Gbit/s',
      legFlow: 'tok (debljina = brzina)',
      legIdle: 'neiskorišteno',
      legFailed: 'veza u kvaru',
      legChanged: 'promijenio vezu',

      // stage
      simplified: 'pojednostavljeno',
      formula_layer2: 'sažetak = MAC izvora ⊕ MAC odredišta',
      'formula_layer2+3': 'sažetak = MAC izvora ⊕ MAC odredišta ⊕ IP izvora ⊕ IP odredišta',
      'formula_layer3+4': 'sažetak = priključak izvora ⊕ priključak odredišta ⊕ IP izvora ⊕ IP odredišta',
      lastByte: 'zadnji oktet adrese',
      pick: 'veza = sažetak mod {m} → {list}',
      pickNone: 'nijedna veza ne radi',
      thFlow: 'tok',
      thMac: 'MAC',
      thIp: 'IP',
      thPort: 'priključak',
      thHash: 'sažetak mod {m}',
      thLink: 'veza',
      sw: 'preklopnik',
      server: 'poslužitelj',
      laneName: 'veza {k}',
      laneFailed: 'u kvaru',
      laneIdle: 'miruje',
      sumOffered: 'ponuđeno {v}',
      sumDelivered: 'isporučeno {v}',
      sumFastest: 'najbrži tok {v}',
      sumCapacity: 'kapacitet {n} × 1 Gbit/s',

      // captions
      nFlows: ['{n} tok', '{n} toka', '{n} tokova'],
      onLinks: ['{n} vezi', '{n} veze', '{n} veza'],
      idleLinks: ['veza {list} miruje', 'veze {list} miruju', 'veze {list} miruju'],
      ontoLinks: ['vezu {list}', 'veze {list}', 'veze {list}'],
      inputs_layer2: 'parom MAC adresa',
      'inputs_layer2+3': 'parom MAC i IP adresa',
      'inputs_layer3+4': 'IP adresama i priključcima',
      capDown: 'Sve članske veze su u kvaru: bond je pao i ne isporučuje ništa ({flows} bez veze).',
      capFail: ['Veza {k} je u kvaru: tok je ponovno raspoređen na {onto} (sažetak mod {m}); {moved}, nijedan prijenos nije prekinut.',
        'Veza {k} je u kvaru: tokovi su ponovno raspoređeni na {onto} (sažetak mod {m}); {moved}, nijedan prijenos nije prekinut.',
        'Veza {k} je u kvaru: tokovi su ponovno raspoređeni na {onto} (sažetak mod {m}); {moved}, nijedan prijenos nije prekinut.'],
      capFailOne: 'Veza {k} je u kvaru: {all} ({share}); {moved}, nijedan prijenos nije prekinut.',
      allFlows: ['jedini tok ponovno je raspoređen na vezu {to}', 'sva {n} toka ponovno su raspoređena na vezu {to} i sada dijele njezin 1 Gbit/s', 'svih {n} tokova ponovno je raspoređeno na vezu {to} i sada dijeli njezin 1 Gbit/s'],
      moved: ['{n} tok je na drugoj vezi nego bez kvara', '{n} toka su na drugoj vezi nego bez kvara', '{n} tokova je na drugoj vezi nego bez kvara'],
      movedNone: 'svaki tok je na istoj vezi kao bez kvara',
      movedHealthy: ['{n} od njih s ispravne veze', '{n} od njih s ispravne veze', '{n} od njih s ispravne veze'],
      movedHealthyAll: ['s ispravne veze', 'svi s ispravnih veza', 'svi s ispravnih veza'],
      capMoved: ['{n} tok promijenio je vezu.', '{n} toka promijenila su vezu.', '{n} tokova promijenilo je vezu.'],
      capSame: 'Pravilo {policy} daje istu raspodjelu: ništa se nije pomaknulo.',
      capTotals: 'Isporučeno {d} od ponuđenih {o} Gbit/s.',
      sitOne: 'Jedan tok ide samo vezom {k}: {r} Gbit/s, a {idle}. Bond od {n} × 1 Gbit/s nije {n} Gbit/s za jedan prijenos.',
      sitSame: 'Veza {k} nosi {flows} po {r} Gbit/s, a {idle}: s pravilom {policy} svi tokovi s istim {inputs} idu istom vezom.',
      sitFewer: '{flows} na {links}: barem jedna veza miruje kakav god bio sažetak ({idle}).',
      sitIdle: '{idle}, a veza {k} nosi {flows}: sažetak ne gleda opterećenje.',
      sitUneven: 'Veza {k} je puna ({flows} po {r} Gbit/s), a veza {j} ima {spare} Gbit/s slobodno: sažetak ne gleda opterećenje.',
      sitEven: 'Isporučeno {d} od ponuđenih {o} Gbit/s; najbrži tok dobiva {f} Gbit/s, nikad više od jedne veze.',

      explain: '<p><em lang="en">Link aggregation</em> (udruživanje sučelja) spaja nekoliko fizičkih veza između dva uređaja u ' +
        'jedno logičko sučelje, <em lang="en">bond</em> (udruženo sučelje). Kapaciteti se zbrajaju, ali samo za mnogo tokova ' +
        'zajedno.</p>' +
        '<p>Svi okviri jednog toka (<em lang="en">flow</em>) moraju ići istom članskom vezom (<em lang="en">member link</em>), ' +
        'inače bi stizali izvan redoslijeda. Strana koja šalje bira vezu postupkom [[hashing]]: iz polja zaglavlja računa ' +
        'sažetak (<em lang="en">hash</em>), a veza = sažetak mod broj ispravnih veza. Zato jedan tok nikad ne premaši brzinu ' +
        'jedne veze: 2 × 1 Gbit/s nije 2 Gbit/s za jedan prijenos.</p>' +
        '<p>Pravila: <b>layer2</b> čita MAC adrese, <b>layer2+3</b> i IP adrese, <b>layer3+4</b> IP adrese i priključke. ' +
        'Formule su ovdje pojednostavljene (XOR zadnjih okteta); prava formula miješa više bitova, ali vrijedi isto: isti ' +
        'ulaz, ista veza. Promet koji dolazi preko usmjernika nosi MAC adresu usmjernika, pa ga layer2 sav šalje jednom vezom; ' +
        'layer3+4 razdvaja i tokove istog klijenta.</p>' +
        '<p>Sažetak ne gleda opterećenje (to nije <em lang="en">load balancing</em>, raspodjela opterećenja): jedna veza može ' +
        'biti puna dok druga miruje, a slobodni kapacitet ne posuđuje se tokovima s druge veze.</p>' +
        '<p>Kad veza ispadne, LACP (protokol za udruživanje veza, IEEE 802.1AX) ili nadzor veze to primijeti, veza se izbaci ' +
        'i svi se tokovi ponovno raspoređuju (mod N − 1). Pomaknuti se mogu i tokovi s ispravnih veza, ali nijedan prijenos ' +
        'se ne prekida: samo dobiju manje brzine.</p>' +
        '<p>Nije prikazano: razmjena LACP poruka i njihova vremena, načini s naizmjeničnim slanjem, udruživanje preko dva ' +
        'preklopnika, raspodjela u suprotnom smjeru i promjena redoslijeda okvira.</p>'
    },
    en: {
      stage: 'Clients send flows through switch SW and the member links to server S; each flow takes one link',
      gbit: '{v} Gbit/s',
      and: 'and',

      members: 'Member links',
      policy: 'Hash policy',
      policyHint: 'Simplified formulas: see the top line of the stage.',
      pol_layer2: 'layer2',
      'pol_layer2+3': 'layer2+3',
      'pol_layer3+4': 'layer3+4',
      flows: 'Flows',
      fail: 'Failed link',
      fail_none: 'none',
      fail_link1: 'link 1',
      fail_link2: 'link 2',
      fail_all: 'all',
      sameClient: 'All flows from C1',
      sameClientHint: 'The same MAC and IP pair, different source ports.',
      demand: 'Demand per flow',

      'preset_one-flow': 'One flow',
      'hint_one-flow': 'A backup C1 → S over 2 × 1 Gbit/s: it gets 1 Gbit/s, not 2.',
      'preset_same-pair': 'Same address pair',
      'hint_same-pair': '4 flows from C1 take one link under layer2; try layer3+4.',
      'preset_many-clients': '8 clients',
      'hint_many-clients': 'Splitting by MAC is uneven: one link full, the other not.',
      preset_fail: 'Link 2 fails',
      hint_fail: 'Every flow moves to link 1; nobody is disconnected.',
      'preset_four-links': '3 flows, 4 links',
      'hint_four-links': 'Fewer flows than links: at least one link is idle.',

      legLane: 'member link, 1 Gbit/s',
      legFlow: 'flow (thickness = rate)',
      legIdle: 'idle capacity',
      legFailed: 'failed link',
      legChanged: 'changed link',

      simplified: 'simplified',
      formula_layer2: 'hash = src MAC ⊕ dst MAC',
      'formula_layer2+3': 'hash = src MAC ⊕ dst MAC ⊕ src IP ⊕ dst IP',
      'formula_layer3+4': 'hash = src port ⊕ dst port ⊕ src IP ⊕ dst IP',
      lastByte: 'last byte of each address',
      pick: 'link = hash mod {m} → {list}',
      pickNone: 'no link is up',
      thFlow: 'flow',
      thMac: 'MAC',
      thIp: 'IP',
      thPort: 'port',
      thHash: 'hash mod {m}',
      thLink: 'link',
      sw: 'switch',
      server: 'server',
      laneName: 'link {k}',
      laneFailed: 'failed',
      laneIdle: 'idle',
      sumOffered: 'offered {v}',
      sumDelivered: 'delivered {v}',
      sumFastest: 'fastest flow {v}',
      sumCapacity: 'capacity {n} × 1 Gbit/s',

      nFlows: ['{n} flow', '{n} flows'],
      onLinks: ['{n} link', '{n} links'],
      idleLinks: ['link {list} is idle', 'links {list} are idle'],
      ontoLinks: ['link {list}', 'links {list}'],
      inputs_layer2: 'MAC pair',
      'inputs_layer2+3': 'MAC and IP pair',
      'inputs_layer3+4': 'IP addresses and ports',
      capDown: 'Every member link has failed: the bond is down and delivers nothing ({flows} without a link).',
      capFail: ['Link {k} failed: the flow was re-hashed onto {onto} (hash mod {m}); {moved}, no transfer was cut.',
        'Link {k} failed: the flows were re-hashed onto {onto} (hash mod {m}); {moved}, no transfer was cut.'],
      capFailOne: 'Link {k} failed: {all} ({share}); {moved}, no transfer was cut.',
      allFlows: ['the only flow was re-hashed onto link {to}', 'all {n} flows were re-hashed onto link {to} and now share its 1 Gbit/s'],
      moved: ['{n} flow is on another link than without the failure', '{n} flows are on another link than without the failure'],
      movedNone: 'every flow is on the same link as without the failure',
      movedHealthy: ['{n} of them from a working link', '{n} of them from a working link'],
      movedHealthyAll: ['from a working link', 'all from working links'],
      capMoved: ['{n} flow changed link.', '{n} flows changed link.'],
      capSame: 'Policy {policy} gives the same assignment: nothing moved.',
      capTotals: 'Delivered {d} of {o} Gbit/s offered.',
      sitOne: 'One flow uses only link {k}: {r} Gbit/s, while {idle}. A bond of {n} × 1 Gbit/s is not {n} Gbit/s for one transfer.',
      sitSame: 'Link {k} carries {flows} at {r} Gbit/s each, while {idle}: with {policy}, all flows with the same {inputs} take the same link.',
      sitFewer: '{flows} on {links}: at least one link stays idle whatever the hash ({idle}).',
      sitIdle: '{idle} while link {k} carries {flows}: the hash does not look at load.',
      sitUneven: 'Link {k} is full ({flows} at {r} Gbit/s each), while link {j} has {spare} Gbit/s spare: the hash does not look at load.',
      sitEven: 'Delivered {d} of {o} Gbit/s offered; the fastest flow gets {f} Gbit/s, never more than one link.',

      explain: '<p><b>Link aggregation</b> joins several physical links between two devices into one logical interface, the ' +
        '<b>bond</b>. The capacities add up, but only for many flows together.</p>' +
        '<p>All frames of one <b>flow</b> must take the same <b>member link</b>, or they would arrive out of order. The sending ' +
        'end picks the link by [[hashing]]: it computes a <b>hash</b> from header fields, and link = hash mod the number of ' +
        'working links. So one flow never exceeds one link\'s speed: 2 × 1 Gbit/s is not 2 Gbit/s for one transfer.</p>' +
        '<p>Policies: <b>layer2</b> reads the MAC addresses, <b>layer2+3</b> the IP addresses too, <b>layer3+4</b> the IP ' +
        'addresses and the ports. The formulas here are simplified (XOR of the last bytes); the real formula mixes more bits, ' +
        'but the rule holds: the same input, the same link. Traffic that arrives through a router carries the router\'s MAC ' +
        'address, so layer2 sends all of it over one link; layer3+4 splits even one client\'s flows.</p>' +
        '<p>The hash does not look at load (this is not <b>load balancing</b>): one link can be full while another is idle, ' +
        'and spare capacity is never lent to flows on another link.</p>' +
        '<p>When a link fails, LACP (the Link Aggregation Control Protocol, IEEE 802.1AX) or link monitoring notices, the link ' +
        'is removed and every flow is re-hashed (mod N − 1). Flows on working links can move too, but no transfer is cut: ' +
        'they just get less speed.</p>' +
        '<p>Not shown: the LACP message exchange and its timers, round-robin modes, aggregation across two switches, the ' +
        'opposite direction, and frame reordering.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
