/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of radio-networks, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]]
   a glossary term. The Croatian is the original page's wording where it had one; English is new.
   Call ids (C1), radio ids (R1), node ids (A–H) and team codes (OPS) are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Radijska mreža',
      net: 'Mreža',
      netConv: 'Konvencionalna',
      netTrunk: 'Trunking',
      netMesh: 'Mesh',
      mode: 'Način rada',
      modeSimplex: 'Simplex',
      modeRepeater: 'Repetitor',
      modeFixed: 'Fiksni kanali',
      channels: 'Kanali',
      load: 'Ponuđeni promet',
      erl: '{v} Erl',
      seed: 'Uzorak poziva',
      newPattern: 'Novi uzorak poziva',
      range: 'Domet radija',
      src: 'Izvor',
      dst: 'Odredište',
      ttl: 'TTL (najviše skokova)',
      meshClick: 'Klikni čvor u crtežu da ga ugasiš ili vratiš.',
      down: 'Ugašeni čvorovi',

      team_ops: 'Operativa',
      team_sec: 'Sigurnost',
      team_med: 'Medicinski',
      team_log: 'Logistika',
      legendFill: 'poziv u tijeku',
      legendHollow: 'slobodno, čeka ili ugašeno',
      legendNew: 'novo u ovom koraku',

      towerRepeater: 'Repetitor',
      towerFixed: 'Lokacija s fiksnim kanalima',
      towerTrunk: 'Bazna stanica i kontroler',
      simplexNote: 'Simplex: radio uređaji istog tima govore izravno, bez infrastrukture.',
      chShort: 'K{n}',
      unitBlocked: '✗ blokiran',
      unitQueued: '⏳ čeka',

      poolConv: 'Fiksni kanali',
      poolTrunk: 'Prometni kanali',
      noTeam: 'bez tima',
      anyTeam: 'bilo koja grupa',
      free: 'slobodan',
      left: 'još {n}',
      control: 'Kontrolni kanal',
      controlIdle: 'signalizacija',
      controlGrants: 'dodjeljuje {list}',
      queueHead: 'Red čekanja',
      queueEmpty: 'prazan',
      waiting: 'čeka {n}',
      slotHead: 'Slot {n}',
      evNone: 'nema novih poziva',
      evGranted: '{id} → {ch}',
      evBusy: '{id} ✗ {ch} zauzet',
      evNoChan: '{id} ✗ {ch} ne postoji',
      evQueued: '{id} ⏳ u red',
      evFromQueue: '{id} iz reda → {ch}',
      evEnded: '{id} završava',
      totOffered: 'Ponuđeni pozivi',
      totServed: 'Posluženi',
      totBlocked: 'Blokirani',
      totWaited: 'Čekali u redu',
      totAvgWait: 'Prosječno čekanje',
      avgWait: '{v} slota',
      totUse: 'Iskorištenost kanala',
      percent: '{v} %',
      busyNow: 'Zauzeto',
      idleNow: 'Slobodno',
      queueNow: 'U redu',

      capLoadStart: 'Slot 0: nitko ne govori. Pozivi stižu nasumično (uzorak {seed}), prosječno {load}. Pritisni → za sljedeći slot.',
      capSlot: 'Slot {n}:',
      capNone: 'Nema novih poziva.',
      capEnded: 'Završava {ids}.',
      capGranted: '{id} ({team}) dobiva {ch}.',
      capBusy: '{id} ({team}) je blokiran: {ch} je zauzet',
      capNoChan: '{id} ({team}) je blokiran: tim nema svoj kanal ({ch} ne postoji)',
      capIdle: [', iako je {list} slobodan.', ', iako su {list} slobodni.', ', iako su {list} slobodni.'],
      capNoIdle: '.',
      capQueued: '{id} ({team}) čeka u redu: svi kanali su zauzeti.',
      capFromQueue: '{id} ({team}) iz reda dobiva {ch} nakon {wait}.',
      slots: ['{n} slota', '{n} slota', '{n} slotova'],
      capEndConv: 'Kraj: posluženo {served} od {offered} poziva, blokirano {blocked}.',
      capEndTrunk: 'Kraj: posluženo {served} od {offered} poziva, nijedan nije izgubljen; u redu još čeka {queue}.',

      routeHead: 'Put',
      routeHop: '{a} prosljeđuje prema {b}',
      routeArrive: '{a} je odredište',
      routeWait: 'još nije pronađen',
      routeNone: 'Mreža je podijeljena: izvor ne može dosegnuti odredište.',
      nodesUp: 'Aktivni čvorovi',
      linksN: 'Veze',
      hopsN: 'Skokovi do odredišta',
      sentN: 'Odašiljanja do sada',
      none: '—',
      nodeDown: 'ugašen',
      hopLabel: 'skok {n}',
      srcLabel: 'izvor',
      dstLabel: 'odredište',
      nodeBtn: 'Čvor {id}: ugasi ili vrati',
      nodeFixed: 'Čvor {id}: izvor ili odredište, ne gasi se',

      capMeshStart: 'Izvor {src} šalje paket za {dst} preplavljivanjem. Domet {range}, TTL {ttl}. Pritisni → za prvi skok.',
      capSame: 'Izvor i odredište su isti čvor: nema što slati.',
      capHop: 'Skok {n}. Odašilje: {senders}. Prvi put prima: {fresh}.',
      capFound: 'Odredište {dst} dosegnuto je u {hops}: put {route}.',
      hops: ['{n} skoku', '{n} skoka', '{n} skokova'],
      hopsAway: ['{n} skok', '{n} skoka', '{n} skokova'],
      capStalled: 'Skok {n}: nitko novi ne čuje paket, preplavljivanje je stalo.',
      capPartition: 'Mreža je podijeljena: od {src} do {dst} nema puta.',
      capTtl: 'TTL je istekao: {dst} je {hops} daleko.',

      presetConv: 'Konvencionalna, 3 kanala',
      presetConvHint: 'Blokirani pozivi dok su drugi kanali prazni',
      presetTrunk: 'Isti pozivi, trunking',
      presetTrunkHint: 'Isti uzorak: nitko nije izgubljen, neki čekaju',
      presetOverload: 'Trunking, preopterećen',
      presetOverloadHint: '5 Erl na 3 kanala: red raste',
      presetMeshHeal: 'Mesh: relej D ugašen',
      presetMeshHealHint: 'Mreža nalazi put oko kvara',
      presetMeshSplit: 'Mesh: podijeljena mreža',
      presetMeshSplitHint: 'D i E ugašeni: nema puta',
      presetMeshTtl: 'Mesh: premali TTL',
      presetMeshTtlHint: 'Paket umre prije odredišta',

      explain: '<p><b>Konvencionalna mreža.</b> Svaki tim ima svoj kanal, preko repetitora ili izravno (simplex). ' +
        'Jednostavna je i predvidljiva, ali korištenje spektra je statično: ako je kanal tvog tima zauzet, čekaš, čak i ' +
        'kad je neki drugi kanal prazan. Simplex ne treba infrastrukturu, ali ograničava domet; repetitor povećava domet, ' +
        'a kanali i dalje ostaju fiksni.</p>' +
        '<p><b><i lang="en">Trunking</i> (dinamička dodjela kanala), npr. TETRA.</b> Korisnici biraju govornu grupu, a ne ' +
        'frekvenciju. Kontrolni kanal koordinira pristup, a prometni kanal troši samo poziv koji je u tijeku. Kad su svi ' +
        'zauzeti, novi pozivi čekaju u redu. Mnogo grupa može postojati dok istodobno govori samo nekoliko njih.</p>' +
        '<p><b><i lang="en">Mesh</i>.</b> Mreža je [[mesh]]: svaki je čvor i krajnja točka i relej; pokrivenost nastaje iz mnogo kratkih veza, a ne iz ' +
        'jedne visoke lokacije. Put se traži [[flooding]]: svaki čvor jednom ponovi paket, dok ga TTL ne zaustavi. ' +
        'Kapacitet je dijeljen, pa previše ponovnog odašiljanja stvara zagušenje. Ugasi relej i pogledaj postoji li ' +
        'drugi put.</p>' +
        '<table><thead><tr><th>Mreža</th><th>Spektar</th><th>Pokrivanje</th><th>Prednost</th><th>Nedostatak</th></tr></thead><tbody>' +
        '<tr><td>Konvencionalna</td><td>statično, fiksni kanali</td><td>simplex ili repetitor</td><td>jednostavnost, predvidljivost</td><td>prazni kanali ostaju rezervirani</td></tr>' +
        '<tr><td><i lang="en">Trunking</i></td><td>dinamički, zajednički kanali</td><td>lokacija i kontroler</td><td>učinkovito korištenje spektra</td><td>složena infrastruktura</td></tr>' +
        '<tr><td><i lang="en">Mesh</i></td><td>dijeljene lokalne veze, više skokova</td><td>mnogo releja</td><td>samopopravljanje, malo infrastrukture</td><td>mala propusnost, promjenjiva latencija</td></tr>' +
        '</tbody></table>' +
        '<p>Jedan korak je jedan vremenski slot. Ponuđeni promet u erlangima (Erl) je prosječan broj istodobnih poziva; ' +
        'poziv traje 3 do 7 slotova. Isti uzorak poziva daje iste pozive u obje mreže, pa promjena mreže na istom koraku ' +
        'uspoređuje isto opterećenje. U mesh mreži jedan korak je jedan skok; veći domet daje više izravnih susjeda.</p>'
    },
    en: {
      stage: 'Radio network',
      net: 'Network',
      netConv: 'Conventional',
      netTrunk: 'Trunked',
      netMesh: 'Mesh',
      mode: 'Mode',
      modeSimplex: 'Simplex',
      modeRepeater: 'Repeater',
      modeFixed: 'Fixed channels',
      channels: 'Channels',
      load: 'Offered traffic',
      erl: '{v} Erl',
      seed: 'Call pattern',
      newPattern: 'New call pattern',
      range: 'Radio range',
      src: 'Source',
      dst: 'Destination',
      ttl: 'TTL (hop limit)',
      meshClick: 'Click a node in the drawing to switch it off or back on.',
      down: 'Nodes switched off',

      team_ops: 'Operations',
      team_sec: 'Security',
      team_med: 'Medical',
      team_log: 'Logistics',
      legendFill: 'call in progress',
      legendHollow: 'free, waiting or off',
      legendNew: 'new in this step',

      towerRepeater: 'Repeater',
      towerFixed: 'Site with fixed channels',
      towerTrunk: 'Base station and controller',
      simplexNote: 'Simplex: radios of the same team talk directly, without infrastructure.',
      chShort: 'Ch {n}',
      unitBlocked: '✗ blocked',
      unitQueued: '⏳ waiting',

      poolConv: 'Fixed channels',
      poolTrunk: 'Traffic channels',
      noTeam: 'no team',
      anyTeam: 'any group',
      free: 'free',
      left: '{n} to go',
      control: 'Control channel',
      controlIdle: 'signalling',
      controlGrants: 'assigns {list}',
      queueHead: 'Queue',
      queueEmpty: 'empty',
      waiting: 'waiting {n}',
      slotHead: 'Slot {n}',
      evNone: 'no new calls',
      evGranted: '{id} → {ch}',
      evBusy: '{id} ✗ {ch} busy',
      evNoChan: '{id} ✗ no {ch}',
      evQueued: '{id} ⏳ queued',
      evFromQueue: '{id} from queue → {ch}',
      evEnded: '{id} ends',
      totOffered: 'Calls offered',
      totServed: 'Served',
      totBlocked: 'Blocked',
      totWaited: 'Waited in queue',
      totAvgWait: 'Average wait',
      avgWait: '{v} slots',
      totUse: 'Channel use',
      percent: '{v} %',
      busyNow: 'Busy',
      idleNow: 'Free',
      queueNow: 'Queued',

      capLoadStart: 'Slot 0: nobody is talking. Calls arrive at random (pattern {seed}), {load} on average. Press → for the next slot.',
      capSlot: 'Slot {n}:',
      capNone: 'No new calls.',
      capEnded: '{ids} ends.',
      capGranted: '{id} ({team}) gets {ch}.',
      capBusy: '{id} ({team}) is blocked: {ch} is busy',
      capNoChan: '{id} ({team}) is blocked: the team has no channel of its own (there is no {ch})',
      capIdle: [', although {list} is free.', ', although {list} are free.'],
      capNoIdle: '.',
      capQueued: '{id} ({team}) waits in the queue: every channel is busy.',
      capFromQueue: '{id} ({team}) leaves the queue and gets {ch} after {wait}.',
      slots: ['{n} slot', '{n} slots'],
      capEndConv: 'End: {served} of {offered} calls served, {blocked} blocked.',
      capEndTrunk: 'End: {served} of {offered} calls served, none lost; {queue} still waiting in the queue.',

      routeHead: 'Route',
      routeHop: '{a} forwards to {b}',
      routeArrive: '{a} is the destination',
      routeWait: 'not found yet',
      routeNone: 'The network is split: the source cannot reach the destination.',
      nodesUp: 'Working nodes',
      linksN: 'Links',
      hopsN: 'Hops to destination',
      sentN: 'Transmissions so far',
      none: '—',
      nodeDown: 'off',
      hopLabel: 'hop {n}',
      srcLabel: 'source',
      dstLabel: 'destination',
      nodeBtn: 'Node {id}: switch off or back on',
      nodeFixed: 'Node {id}: source or destination, stays on',

      capMeshStart: 'Source {src} sends a packet to {dst} by flooding. Range {range}, TTL {ttl}. Press → for the first hop.',
      capSame: 'Source and destination are the same node: nothing to send.',
      capHop: 'Hop {n}. Sending: {senders}. Hearing it for the first time: {fresh}.',
      capFound: 'Destination {dst} reached in {hops}: route {route}.',
      hops: ['{n} hop', '{n} hops'],
      hopsAway: ['{n} hop', '{n} hops'],
      capStalled: 'Hop {n}: nobody new hears the packet, the flooding has stopped.',
      capPartition: 'The network is split: there is no route from {src} to {dst}.',
      capTtl: 'The TTL ran out: {dst} is {hops} away.',

      presetConv: 'Conventional, 3 channels',
      presetConvHint: 'Calls blocked while other channels are empty',
      presetTrunk: 'Same calls, trunked',
      presetTrunkHint: 'Same pattern: nobody lost, some wait',
      presetOverload: 'Trunked, overloaded',
      presetOverloadHint: '5 Erl on 3 channels: the queue grows',
      presetMeshHeal: 'Mesh: relay D off',
      presetMeshHealHint: 'The network finds a route around the fault',
      presetMeshSplit: 'Mesh: split network',
      presetMeshSplitHint: 'D and E off: no route',
      presetMeshTtl: 'Mesh: TTL too small',
      presetMeshTtlHint: 'The packet dies before the destination',

      explain: '<p><b>Conventional network.</b> Each team has its own channel, through a repeater or directly (simplex). ' +
        'It is simple and predictable, but its use of the spectrum is static: if your team\'s channel is busy, you wait, ' +
        'even when another channel is empty. Simplex needs no infrastructure but limits the range; a repeater extends ' +
        'the range, and the channels are still fixed.</p>' +
        '<p><b>Trunking, e.g. TETRA.</b> Users pick a talkgroup, not a frequency. A control channel coordinates access, ' +
        'and only a call in progress uses a traffic channel. When all are busy, new calls wait in a queue. Many groups ' +
        'can exist while only a few of them talk at the same time.</p>' +
        '<p><b>Mesh.</b> The network is a [[mesh]]: every node is both an end point and a relay; coverage comes from many short links, not from ' +
        'one high site. A route is found by [[flooding]]: every node repeats the packet once, until the TTL stops it. ' +
        'Capacity is shared, so too much retransmission causes congestion. Switch a relay off and see whether another ' +
        'route exists.</p>' +
        '<table><thead><tr><th>Network</th><th>Spectrum</th><th>Coverage</th><th>Strength</th><th>Weakness</th></tr></thead><tbody>' +
        '<tr><td>Conventional</td><td>static, fixed channels</td><td>simplex or repeater</td><td>simple, predictable</td><td>empty channels stay reserved</td></tr>' +
        '<tr><td>Trunked</td><td>dynamic, shared channels</td><td>site and controller</td><td>efficient use of spectrum</td><td>complex infrastructure</td></tr>' +
        '<tr><td>Mesh</td><td>shared local links, many hops</td><td>many relays</td><td>self-healing, little infrastructure</td><td>low throughput, variable latency</td></tr>' +
        '</tbody></table>' +
        '<p>One step is one time slot. Offered traffic in erlangs (Erl) is the average number of simultaneous calls; a call ' +
        'lasts 3 to 7 slots. The same call pattern gives the same calls in both networks, so switching the network at the ' +
        'same step compares the same load. In the mesh one step is one hop; a longer range gives more direct neighbours.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
