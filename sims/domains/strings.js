/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of domains, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The domain and device terms are not in kit/glossary.js yet (NOTES.md "Term pairs"), so the Croatian strings write the
   first-mention form out: the English term in italics, the Croatian in parentheses. "broadcast" stays English and in
   italics inside the Croatian term "broadcast domena", as in the URM book. Captions are markup (t.html). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Mreža s uređajima, kolizijske domene kao numerirani obrubi i broadcast domene kao slovima označena područja',

      layout: 'Scena',
      layoutTwo: 'Dvije mreže',
      layoutOffice: 'Ured',
      net1Core: 'Uređaj u mreži 1',
      net2Edge: 'Uređaj s tri računala (mreža 2)',
      router: 'Uređaj između mreža',
      vlans: 'VLAN 10 i 20 u mreži 1',
      vlanHub: 'Koncentrator ne zna za VLAN-ove.',
      vlanNoRouter: 'Trunk treba usmjernik u sredini.',
      hub: 'koncentrator',
      switch: 'preklopnik',
      routerKind: 'usmjernik',
      swap: 'Zamijeni: {from} → {to}',

      'preset_primjer-3': 'Primjer 3 iz knjige',
      'hint_primjer-3': 'Preklopnik s četiri računala, usmjernik, pa koncentrator s tri računala na drugom preklopniku',
      'preset_primjer-3b': 'Primjer 3 (b)',
      'hint_primjer-3b': 'Druga mreža je spora: koncentrator zamijenjen preklopnikom',
      'preset_office-hub': 'Ured s koncentratorom',
      'hint_office-hub': 'Deset računala na jednom koncentratoru; zamijenite ga preklopnikom',
      'preset_no-router': 'Bez usmjernika',
      'hint_no-router': 'Primjer 3 s preklopnikom umjesto usmjernika',
      preset_vlans: 'VLAN-ovi u mreži 1',
      hint_vlans: 'Primjer 3 (b), a mreža 1 podijeljena na VLAN 10 i VLAN 20',

      legColl: 'kolizijska domena 1, 2…',
      legBc: 'broadcast domena A, B…',
      legHub: 'koncentrator',
      legSwitch: 'preklopnik',
      legRouter: 'usmjernik',
      legTrunk: 'trunk',
      legChanged: 'promijenjeno',

      collHead: '<i lang="en">collision domains</i> (kolizijske domene)',
      bcHead: '<i lang="en">broadcast</i> domene',
      perNet: 'mreža 1: {a} · mreža 2: {b}',
      was: 'prije: {n}',
      net1: 'Mreža 1',
      net2: 'Mreža 2',
      office: 'Mreža 1: ured s deset računala',
      trunk: '<i lang="en">trunk</i> (10, 20)',
      vlanTag: 'VLAN {v}',

      nColl: ['{n} <i lang="en">collision domain</i> (kolizijska domena)', '{n} <i lang="en">collision domain</i> (kolizijske domene)', '{n} <i lang="en">collision domain</i> (kolizijskih domena)'],
      nBc: ['{n} <i lang="en">broadcast</i> domena', '{n} <i lang="en">broadcast</i> domene', '{n} <i lang="en">broadcast</i> domena'],
      bcStill: ['broj <i lang="en">broadcast</i> domena i dalje je {n}', 'broj <i lang="en">broadcast</i> domena i dalje je {n}', 'broj <i lang="en">broadcast</i> domena i dalje je {n}'],
      collStill: 'broj kolizijskih domena i dalje je {n}',
      whereNet1: 'prva mreža',
      whereNet2: 'druga mreža',
      whereOffice: 'mreža',
      whereBoth: 'cijela slika',

      'what_net1Core-switch': 'Koncentrator u prvoj mreži zamijenjen preklopnikom',
      'what_net1Core-hub': 'Preklopnik u prvoj mreži zamijenjen koncentratorom',
      'what_net2Edge-switch': 'Koncentrator zamijenjen preklopnikom',
      'what_net2Edge-hub': 'Preklopnik s tri računala zamijenjen koncentratorom',
      'what_router-switch': 'Usmjernik zamijenjen preklopnikom',
      'what_router-router': 'Preklopnik u sredini zamijenjen usmjernikom',
      'what_office-switch': 'Koncentrator zamijenjen preklopnikom',
      'what_office-hub': 'Preklopnik zamijenjen koncentratorom',
      'what_vlans-on': 'VLAN-ovi uključeni',
      'what_vlans-off': 'VLAN-ovi isključeni',
      what_many: 'Promijenilo se više uređaja odjednom',

      capTwo: 'Ukupno {coll}: {n1} u mreži 1 i {n2} u mreži 2. {why}',
      whyRouter: 'Usmjernik ne propušta <i lang="en">broadcast</i>, pa je svaka mreža svoja: {bc}.',
      whyVlan: 'VLAN 10 i VLAN 20 dijele mrežu 1, a usmjernik odvaja mrežu 2: {bc}.',
      whyNone: 'Bez usmjernika <i lang="en">broadcast</i> ništa ne zaustavlja: {bc} preko obje mreže.',
      capOffice_hub: 'Deset računala na koncentratoru dijeli jedan te isti signal: {coll} i {bc}.',
      capOffice_switch: 'Deset računala na preklopniku: svaki priključak je zaseban, {coll}, a samo {bc}.',
      noteDuplex: 'U punom dupleksu na tim vezama kolizija ne može ni biti, a svaka se ipak broji kao kolizijska domena.',
      capColl: '{what}: {where} sada ima {coll} umjesto {was}, a {bcStill}.',
      capMerge: '{what}: {b0} <i lang="en">broadcast</i> domene spajaju se u jednu, a {collStill}.',
      capSplit: '{what}: jedna <i lang="en">broadcast</i> domena dijeli se na {b}, a {collStill}.',
      capBc: '{what}: broj <i lang="en">broadcast</i> domena {move} s {b0} na {b}, a {collStill}.',
      moveUp: 'raste',
      moveDown: 'pada',
      capBoth: '{what}: sada je {coll} umjesto {was} i {bc} umjesto {b0}.',
      capSame: '{what}: brojevi se ne mijenjaju, i dalje je {coll} i {bc}.',

      explain:
        '<p><i lang="en">Collision</i> (kolizija) nastaje kad dva uređaja na istom mediju pošalju u isti trenutak. ' +
        '<i lang="en">Collision domain</i> (kolizijska domena) skup je uređaja koji jedni drugima mogu proizvesti koliziju. ' +
        '<i lang="en">Broadcast</i> domena skup je uređaja koji prime isti okvir upućen svima.</p>' +
        '<p><i lang="en">Hub</i> (koncentrator) ponavlja signal na sve svoje priključke, pa je sve što je na njemu jedna ' +
        'kolizijska domena. <i lang="en">Switch</i> (preklopnik) izolira svaki svoj <i lang="en">port</i> (priključak): ' +
        'svaki je zasebna kolizijska domena, koja ipak obuhvaća sve što s druge strane te veze dijeli medij, primjerice ' +
        'cijeli koncentrator. I svako sučelje usmjernika zasebna je kolizijska domena.</p>' +
        '<p><i lang="en">Broadcast</i> propuštaju i koncentrator i preklopnik; zaustavlja ga samo <i lang="en">router</i> ' +
        '(usmjernik), pa svaka mreža iza nekog njegovog sučelja čini jednu <i lang="en">broadcast</i> domenu. ' +
        '<i lang="en">VLAN</i> (virtualna lokalna mreža) logički dijeli jedan preklopnik na više <i lang="en">broadcast</i> ' +
        'domena; okvir iz jednog VLAN-a u drugi mora proći kroz usmjernik. Veza koja nosi više VLAN-ova je ' +
        '<i lang="en">trunk</i>, a usmjernik na njoj ima po jedno podsučelje za svaki VLAN.</p>' +
        '<p>Brojevi su neovisni: zamjena koncentratora preklopnikom mijenja samo broj kolizijskih domena, a zamjena ' +
        'usmjernika preklopnikom samo broj <i lang="en">broadcast</i> domena. Priključak preklopnika u punom dupleksu ' +
        'broji se kao kolizijska domena iako na njemu kolizije ne može ni biti: CSMA/CD radi samo u poludupleksu.</p>' +
        '<p>Česte zablude: preklopnik ne dijeli <i lang="en">broadcast</i> domene; dva broja ne rastu i ne padaju zajedno; ' +
        'priključak preklopnika spojen na koncentrator ne odvaja računala na tom koncentratoru jedna od drugih.</p>'
    },

    en: {
      stage: 'A network of devices, collision domains as numbered outlines and broadcast domains as lettered regions',

      layout: 'Scene',
      layoutTwo: 'Two networks',
      layoutOffice: 'Office',
      net1Core: 'Device in network 1',
      net2Edge: 'Device with three computers (network 2)',
      router: 'Device between the networks',
      vlans: 'VLANs 10 and 20 in network 1',
      vlanHub: 'A hub knows nothing of VLANs.',
      vlanNoRouter: 'The trunk needs the router in the middle.',
      hub: 'hub',
      switch: 'switch',
      routerKind: 'router',
      swap: 'Swap: {from} → {to}',

      'preset_primjer-3': 'Example 3 from the book',
      'hint_primjer-3': 'A switch with four computers, a router, then a hub with three computers on a second switch',
      'preset_primjer-3b': 'Example 3 (b)',
      'hint_primjer-3b': 'Network 2 is slow: the hub replaced by a switch',
      'preset_office-hub': 'Office with a hub',
      'hint_office-hub': 'Ten computers on one hub; replace it with a switch',
      'preset_no-router': 'No router',
      'hint_no-router': 'Example 3 with a switch instead of the router',
      preset_vlans: 'VLANs in network 1',
      hint_vlans: 'Example 3 (b), with network 1 split into VLAN 10 and VLAN 20',

      legColl: 'collision domain 1, 2…',
      legBc: 'broadcast domain A, B…',
      legHub: 'hub',
      legSwitch: 'switch',
      legRouter: 'router',
      legTrunk: 'trunk',
      legChanged: 'changed',

      collHead: 'collision domains',
      bcHead: 'broadcast domains',
      perNet: 'network 1: {a} · network 2: {b}',
      was: 'before: {n}',
      net1: 'Network 1',
      net2: 'Network 2',
      office: 'Network 1: an office with ten computers',
      trunk: 'trunk (10, 20)',
      vlanTag: 'VLAN {v}',

      nColl: ['{n} collision domain', '{n} collision domains'],
      nBc: ['{n} broadcast domain', '{n} broadcast domains'],
      bcStill: ['there is still {n} broadcast domain', 'there are still {n} broadcast domains'],
      collStill: 'the collision count stays {n}',
      whereNet1: 'network 1',
      whereNet2: 'network 2',
      whereOffice: 'the network',
      whereBoth: 'the whole drawing',

      'what_net1Core-switch': 'The hub in network 1 replaced by a switch',
      'what_net1Core-hub': 'The switch in network 1 replaced by a hub',
      'what_net2Edge-switch': 'The hub replaced by a switch',
      'what_net2Edge-hub': 'The switch with three computers replaced by a hub',
      'what_router-switch': 'The router replaced by a switch',
      'what_router-router': 'The switch in the middle replaced by a router',
      'what_office-switch': 'The hub replaced by a switch',
      'what_office-hub': 'The switch replaced by a hub',
      'what_vlans-on': 'VLANs on',
      'what_vlans-off': 'VLANs off',
      what_many: 'Several devices changed at once',

      capTwo: 'In all {coll}: {n1} in network 1 and {n2} in network 2. {why}',
      whyRouter: 'The router does not pass broadcasts, so each network is its own: {bc}.',
      whyVlan: 'VLAN 10 and VLAN 20 split network 1, and the router cuts off network 2: {bc}.',
      whyNone: 'With no router nothing stops a broadcast: {bc} across both networks.',
      capOffice_hub: 'Ten computers on a hub share one and the same signal: {coll} and {bc}.',
      capOffice_switch: 'Ten computers on a switch: every port is separate, {coll}, but only {bc}.',
      noteDuplex: 'On these full-duplex links no collision can even happen, yet each still counts as a collision domain.',
      capColl: '{what}: {where} now has {coll} instead of {was}, and {bcStill}.',
      capMerge: '{what}: the {b0} broadcast domains merge into one; {collStill}.',
      capSplit: '{what}: the one broadcast domain splits into {b}; {collStill}.',
      capBc: '{what}: the number of broadcast domains {move} from {b0} to {b}; {collStill}.',
      moveUp: 'rises',
      moveDown: 'falls',
      capBoth: '{what}: now {coll} instead of {was}, and {bc} instead of {b0}.',
      capSame: '{what}: the counts do not change, still {coll} and {bc}.',

      explain:
        '<p>A <b>collision</b> happens when two devices on the same medium send at the same moment. A <b>collision ' +
        'domain</b> is the set of devices that can cause a collision with one another. A <b>broadcast domain</b> is the ' +
        'set of devices that all receive the same frame sent to everyone.</p>' +
        '<p>A <b>hub</b> repeats the signal to all its ports, so everything on it is one collision domain. A ' +
        '<b>switch</b> isolates each of its <b>ports</b>: each is a collision domain of its own, which still takes in ' +
        'whatever shares the medium on the far side of that link, a whole hub for instance. Each router interface is a ' +
        'collision domain of its own too.</p>' +
        '<p>Hubs and switches both pass a broadcast; only a <b>router</b> stops it, so each network behind one of its ' +
        'interfaces is one broadcast domain. A <b>VLAN</b> (virtual LAN) splits one switch logically into several ' +
        'broadcast domains; a frame from one VLAN to another has to pass a router. A link that carries several VLANs is a ' +
        '<b>trunk</b>, and the router has one subinterface on it per VLAN.</p>' +
        '<p>The counts are independent: replacing a hub with a switch changes only the number of collision domains, and ' +
        'replacing the router with a switch only the number of broadcast domains. A full-duplex switch port counts as a ' +
        'collision domain although no collision can happen on it: CSMA/CD runs only on half duplex.</p>' +
        '<p>Common mistakes: a switch does not split broadcast domains; the two counts do not rise and fall together; a ' +
        'switch port linked to a hub does not isolate the computers on that hub from one another.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
