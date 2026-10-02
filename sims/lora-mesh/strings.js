/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lora-mesh, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]]
   a glossary term. The Croatian is the original page's wording where it had one; English is new.
   Node numbers (7) and gateway names (GW1) are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Polje radijskih čvorova',
      mode: 'Način rada',
      mode_star: 'LoRaWAN',
      mode_flood: 'Poplava',
      mode_relay: 'Repetitori',
      mode_manet: 'MANET',
      nodes: 'Broj čvorova',
      range: 'Radio-domet',
      src: 'Izvor',
      dst: 'Odredište',
      duty: 'Najveći udio odašiljanja po čvoru',
      dutyOff: 'bez ograničenja',
      airtime: 'Trajanje jednog paketa u eteru',
      seed: 'Topologija',
      flip: 'Promijenjene uloge',
      newTopology: 'Nova topologija',
      percent: '{v} %',
      ms: '{v} ms',
      sec: '{v} s',

      server: 'mrežni poslužitelj (IP)',
      gwName: 'GW{n}',
      repName: 'R{n}',
      nodeBtn: 'Čvor {n}: uključi ili isključi ulogu repetitora',
      srcTag: 'izvor',
      dstTag: 'odredište',
      relayClick: 'Klikni čvor da mu promijeniš ulogu: obični čvor ili repetitor.',

      txN: 'radijskih odašiljanja',
      hopsN: 'skokova do cilja',
      heardN: 'čvorova koji su čuli',
      repN: 'tko prosljeđuje',
      everyone: 'svi',
      outcome: 'ishod',
      status_ready: 'spremno',
      status_running: 'u tijeku',
      status_delivered: 'dostavljeno',
      status_lost: 'nije stiglo',
      status_noroute: 'nema rute',
      status_duty: 'blokirano: duty cycle',
      airBusiest: 'Najopterećeniji čvor',
      airTotal: 'Zauzeće kanala',
      airDuty: 'Najopterećeniji čvor odašilje {used} u zamišljenih 60\u00a0s; dopušteno {legal} pri {pct} %.',
      airFree: 'Ograničenje isključeno: poruka je zauzela kanal {used} u zamišljenih 60 s.',

      note_star: 'Dodavanje krajnjih čvorova samo po sebi ne produžuje radijski put. Ako nema gatewaya u dometu, nema susjeda koji će pomoći.',
      note_flood: 'Ovo je prikaz broadcast prometa. Za neke izravne poruke mreža može koristiti naučeni sljedeći skok. Uključi i isključi ograničenje udjela odašiljanja da vidiš razliku između tehničke propagacije i stvarnog ograničenja vremena u eteru.',
      note_relay: 'Obični čvor sam po sebi ne produžuje mrežu. Ako izvor i odredište nemaju pristup povezanom lancu repetitora, ruta za više skokova ne postoji.',
      note_manet: 'MANET nije jedan konkretan protokol. Simulacija koristi najkraću trenutačno dostupnu rutu kao didaktičku aproksimaciju.',
      desc_star: 'Zvijezda zvijezda: krajnji uređaj šalje izravno gatewayu; drugi krajnji uređaji nisu routeri.',
      desc_flood: 'Upravljano preplavljivanje: poruka se širi preko susjeda, a suvišna ponovna odašiljanja se potiskuju.',
      desc_relay: 'Namjenski repetitori nose poruku odabranom putanjom prema odredištu.',
      desc_manet: 'Mobilni ad-hoc čvorovi sami čine infrastrukturu za usmjeravanje. Ruta se traži kroz trenutačni graf veza.',

      capSame: 'Izvor i odredište su isti čvor: odaberi drugo odredište.',
      capStart: 'Poruka od čvora {src} prema čvoru {dst}. {how}',
      capUplink: 'Uplink: čvor {src} odašilje jednom; čuju ga gatewayi u dometu: {gws}.',
      capIp: 'Gateway {gw} predaje poruku mrežnom poslužitelju preko IP-a; poslužitelj bira gateway najbliži odredištu, {gw2}. Ovo nije radijski skok.',
      capDownlink: 'Downlink: gateway {gw} šalje poruku čvoru {dst}.',
      capFlood: 'Krug {n}: {count} ponovno odašilje: {senders}.',
      nodesTx: ['{n} čvor', '{n} čvora', '{n} čvorova'],
      capFresh: 'Prvi put čuju: {fresh}.',
      capNoFresh: 'Nitko novi ne čuje poruku.',
      capHop: 'Skok {n}: čvor {a} → čvor {b}.',
      capDelivered: 'Dostavljeno: {hops}, {tx}, čulo {heard} čvorova.',
      hops: ['{n} skok', '{n} skoka', '{n} skokova'],
      transmissions: ['{n} odašiljanje', '{n} odašiljanja', '{n} odašiljanja'],
      rounds: ['{n} kruga', '{n} kruga', '{n} krugova'],
      capLost: 'Poplava je stala nakon {n}: odredište nije čulo poruku. Potiskivanje je utišalo čvorove koji su je mogli prenijeti, ili je dosegnuto ograničenje skokova.',
      capNoRoute_star: 'Nema rute: izvor ili odredište nema gateway u dometu, a krajnji čvorovi ne prosljeđuju tuđe pakete.',
      capNoRoute_flood: 'Nema rute: izvor nema nijednog susjeda u dometu.',
      capNoRoute_relay: 'Nema rute: između izvora i odredišta nema povezanog lanca repetitora, a obični čvorovi ne prosljeđuju.',
      capNoRoute_manet: 'Nema rute: graf veza je rastavljen, pa između izvora i odredišta nema puta.',
      capDuty: 'Odašiljanje blokirano: čvor {id} odašiljao bi {used}, a smije {legal} u zamišljenih 60 s pri {pct} %. Bez ograničenja vidi se bi li poruka tehnički prošla.',

      presetChain: 'Repetitori: dodan lanac',
      presetChainHint: 'Tri čvora na putu postaju repetitori i ruta postoji.',
      presetDuty: 'Dug paket, 1 %',
      presetDutyHint: 'Paket od 1000 ms ne stane u 0,6 s dopuštenih u 60 s.',

      legendSrc: 'izvor',
      legendDst: 'odredište',
      legendRelay: 'gateway (GW), repetitor (R)',
      legendHeard: 'čuo poruku',
      legendTx: 'odašilje sada',

      explain: '<p>Ista poruka u četiri modela: tko je prosljeđuje i koliko odašiljanja to košta. <b>LoRa ≠ LoRaWAN</b>: LoRa je modulacija, LoRaWAN jedna mrežna arhitektura iznad nje. <b>Preplavljivanje ≠ ruta</b>, a <b>[[mesh]] nije jedna tehnologija</b>. Ovo je simulacija, ne radijski emulator.</p>' +
        '<p><b>LoRaWAN</b>: krajnji uređaj ne prosljeđuje tuđe pakete. Radijski dio je u pravilu jedan skok do jednog ili više uređaja [[gateway]], a oni predaju promet središnjem mrežnom poslužitelju preko IP-a.</p>' +
        '<p><b>Preplavljivanje</b>: za broadcast promet poruka se širi valovima ([[flooding]]), uz potiskivanje duplikata i ograničenje skokova. Izravne poruke mogu koristiti naučeni sljedeći skok.</p>' +
        '<p><b>Repetitori</b>: obični čvorovi nisu tranzitna infrastruktura. Za više skokova treba dovoljno repetitora koji se međusobno čuju.</p>' +
        '<p><b>MANET</b>: opći koncept, ne jedan protokol. Mobilni čvorovi su istodobno hostovi i routeri; topologija se mijenja, pa usmjeravanje mora reagirati na nestanak i pojavu veza.</p>' +
        '<table><tr><th></th><th>LoRaWAN</th><th>Preplavljivanje</th><th>Repetitori</th><th>MANET</th></tr>' +
        '<tr><th>Topologija</th><td>zvijezda zvijezda</td><td>ravnopravni mesh</td><td>obični čvorovi i repetitori</td><td>dinamički graf s više skokova</td></tr>' +
        '<tr><th>Tko prosljeđuje?</th><td>gateway prema IP poslužitelju</td><td>svaki čvor, uz potiskivanje i ograničenje skokova</td><td>samo repetitori</td><td>svaki čvor, kao router</td></tr>' +
        '<tr><th>Više čvorova?</th><td>ne povećava domet drugih</td><td>veći doseg, ali i više vremena u eteru</td><td>pomažu samo repetitori na dobrim mjestima</td><td>više mogućih ruta, ali složenije usmjeravanje</td></tr>' +
        '<tr><th>Slika</th><td>senzori → bazne stanice → poslužitelj</td><td>„proširi vijest, ali utišaj suvišno”</td><td>„pošalji kroz poznate repetitore”</td><td>„routeri se kreću s korisnicima”</td></tr></table>' +
        '<p><b>Udio odašiljanja</b> (<i lang="en">duty cycle</i>): u EU868 čvor smije odašiljati samo mali dio vremena, npr. 1 %. Podpojasi imaju ograničenja od 0,1 %, 1 % ili 10 %. Ovdje je prozor zamišljenih 60 s, pa pri 1 % čvor smije 0,6 s u eteru: jedan paket od 350 ms. Pri preplavljivanju svaki čvor troši taj udio na tuđe poruke, pa se dopušteni promet dijeli s cijelom mrežom.</p>' +
        '<p>Pojednostavljeno: model ne računa faktor širenja, kodnu brzinu, kolizije, problem skrivenog čvora, odnos signala i šuma ni regionalne pojedinosti. Namjena je pokazati oblik širenja i cijenu ponovnih odašiljanja.</p>'
    },
    en: {
      stage: 'Field of radio nodes',
      mode: 'Network',
      mode_star: 'LoRaWAN',
      mode_flood: 'Flooding',
      mode_relay: 'Repeaters',
      mode_manet: 'MANET',
      nodes: 'Number of nodes',
      range: 'Radio range',
      src: 'Source',
      dst: 'Destination',
      duty: 'Duty-cycle limit per node',
      dutyOff: 'no limit',
      airtime: 'Airtime of one packet',
      seed: 'Topology',
      flip: 'Changed roles',
      newTopology: 'New topology',
      percent: '{v}%',
      ms: '{v} ms',
      sec: '{v} s',

      server: 'network server (IP)',
      gwName: 'GW{n}',
      repName: 'R{n}',
      nodeBtn: 'Node {n}: turn the repeater role on or off',
      srcTag: 'source',
      dstTag: 'destination',
      relayClick: 'Click a node to change its role: plain node or repeater.',

      txN: 'radio transmissions',
      hopsN: 'hops to the target',
      heardN: 'nodes that heard it',
      repN: 'who forwards',
      everyone: 'all',
      outcome: 'outcome',
      status_ready: 'ready',
      status_running: 'running',
      status_delivered: 'delivered',
      status_lost: 'did not arrive',
      status_noroute: 'no route',
      status_duty: 'blocked: duty cycle',
      airBusiest: 'Busiest node',
      airTotal: 'Channel use',
      airDuty: 'The busiest node transmits {used} in an imagined 60\u00a0s; {legal} is allowed at {pct}%.',
      airFree: 'Limit off: the message took {used} of the channel in an imagined 60 s.',

      note_star: 'Adding end nodes does not by itself extend the radio path. With no gateway in range, there is no neighbour to help.',
      note_flood: 'This shows broadcast traffic. For some direct messages the network can use a learned next hop. Turn the duty-cycle limit on and off to see the difference between technical propagation and the real limit on airtime.',
      note_relay: 'A plain node does not extend the network by itself. If the source and the destination cannot reach a connected chain of repeaters, a multi-hop route does not exist.',
      note_manet: 'MANET is not one specific protocol. The simulation uses the shortest route available right now as a teaching approximation.',
      desc_star: 'A star of stars: an end device sends straight to a gateway; other end devices are not routers.',
      desc_flood: 'Managed flooding: the message spreads through neighbours, and redundant rebroadcasts are suppressed.',
      desc_relay: 'Dedicated repeaters carry the message along a chosen path to the destination.',
      desc_manet: 'Mobile ad hoc nodes are the routing infrastructure themselves. The route is searched through the current graph of links.',

      capSame: 'Source and destination are the same node: pick another destination.',
      capStart: 'A message from node {src} to node {dst}. {how}',
      capUplink: 'Uplink: node {src} transmits once; the gateways in range hear it: {gws}.',
      capIp: 'Gateway {gw} hands the message to the network server over IP; the server picks the gateway nearest the destination, {gw2}. This is not a radio hop.',
      capDownlink: 'Downlink: gateway {gw} sends the message to node {dst}.',
      capFlood: 'Round {n}: {count} rebroadcast: {senders}.',
      nodesTx: ['{n} node', '{n} nodes'],
      capFresh: 'Hearing it for the first time: {fresh}.',
      capNoFresh: 'No new node hears the message.',
      capHop: 'Hop {n}: node {a} → node {b}.',
      capDelivered: 'Delivered: {hops}, {tx}, {heard} nodes heard it.',
      hops: ['{n} hop', '{n} hops'],
      transmissions: ['{n} transmission', '{n} transmissions'],
      rounds: ['{n} round', '{n} rounds'],
      capLost: 'The flood stopped after {n}: the destination did not hear the message. Suppression silenced the nodes that could have carried it, or the hop limit was reached.',
      capNoRoute_star: 'No route: the source or the destination has no gateway in range, and end nodes do not forward other nodes\' packets.',
      capNoRoute_flood: 'No route: the source has no neighbour in range.',
      capNoRoute_relay: 'No route: there is no connected chain of repeaters between the source and the destination, and plain nodes do not forward.',
      capNoRoute_manet: 'No route: the graph of links is split, so there is no path between the source and the destination.',
      capDuty: 'Transmission blocked: node {id} would transmit {used}, but may use {legal} in an imagined 60 s at {pct}%. With no limit you can see whether the message would technically get through.',

      presetChain: 'Repeaters: chain added',
      presetChainHint: 'Three nodes on the path become repeaters, and a route exists.',
      presetDuty: 'Long packet, 1%',
      presetDutyHint: 'A 1000 ms packet does not fit in the 0.6 s allowed per 60 s.',

      legendSrc: 'source',
      legendDst: 'destination',
      legendRelay: 'gateway (GW), repeater (R)',
      legendHeard: 'heard it',
      legendTx: 'transmits now',

      explain: '<p>The same message in four models: who forwards it, and how many transmissions that costs. <b>LoRa ≠ LoRaWAN</b>: LoRa is a modulation, LoRaWAN one network architecture on top of it. <b>Flooding ≠ a route</b>, and <b>[[mesh]] is not one technology</b>. This is a simulation, not a radio emulator.</p>' +
        '<p><b>LoRaWAN</b>: an end device does not forward other packets. The radio part is usually one hop to one or more [[gateway]] devices, which hand the traffic to a central network server over IP.</p>' +
        '<p><b>Flooding</b>: for broadcast traffic the message spreads in waves ([[flooding]]), with duplicate suppression and a hop limit. Direct messages can use a learned next hop.</p>' +
        '<p><b>Repeaters</b>: plain nodes are not transit infrastructure. Multi-hop needs enough repeaters that hear each other.</p>' +
        '<p><b>MANET</b>: a general concept, not one protocol. Mobile nodes are hosts and routers at once; the topology changes, so routing must react as links disappear and appear.</p>' +
        '<table><tr><th></th><th>LoRaWAN</th><th>Flooding</th><th>Repeaters</th><th>MANET</th></tr>' +
        '<tr><th>Topology</th><td>star of stars</td><td>peer mesh</td><td>plain nodes and repeaters</td><td>dynamic multi-hop graph</td></tr>' +
        '<tr><th>Who forwards?</th><td>a gateway, to an IP server</td><td>every node, with suppression and a hop limit</td><td>only repeaters</td><td>every node, as a router</td></tr>' +
        '<tr><th>More nodes?</th><td>do not extend the others\' range</td><td>more reach, but also more airtime</td><td>only repeaters in good places help</td><td>more possible routes, but harder routing</td></tr>' +
        '<tr><th>Picture</th><td>sensors → base stations → server</td><td>“spread the news, but hush the repeats”</td><td>“send it through known repeaters”</td><td>“the routers move with the users”</td></tr></table>' +
        '<p><b>Duty cycle</b>: in EU868 a node may transmit only a small share of the time, for example 1%. The sub-bands have limits of 0.1%, 1% or 10%. Here the window is an imagined 60 s, so at 1% a node may spend 0.6 s on air: one 350 ms packet. In a flood every node spends that share on other nodes\' messages, so the allowed traffic is shared by the whole network.</p>' +
        '<p>Simplified: the model does not compute the spreading factor, the coding rate, collisions, the hidden-node problem, the signal-to-noise ratio or regional details. It is meant to show the shape of the spread and the cost of retransmissions.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings; else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
