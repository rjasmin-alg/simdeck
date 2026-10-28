/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of port-forwarding, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder. The title and subtitle come from sim.json.
   Terms not in kit/glossary.js yet are written out (NOTES.md, "Term pairs"): on the Croatian page the English term
   in italics with the Croatian in parentheses at first mention, as the URM book writes *port*. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Usmjernik R s tablicom prijevoda i prosljeđivanjem portova',

      scene: 'Tko šalje',
      sceneBook: 'A, B, K',
      sceneMixed: 'W, K',
      sceneOutside: 'K',
      sceneInside: 'A',
      forward: 'Prosljeđivanje 8080 → S:80',
      proto: 'Protokol paketa na vanjsku adresu',
      extPort: 'Vanjski port na koji ide',
      hairpin: 'Petlja kroz usmjernik',

      presetBook: 'Primjer iz knjige: bez prosljeđivanja',
      presetBookHint: 'Primjer 4: koje vanjske portove dobivaju A i B, i što bude s paketom na 61050?',
      presetAdd: 'Dodaj prosljeđivanje',
      presetAddHint: 'TCP 8080 → 192.168.1.20:80. Koju adresu poslužitelj vidi kao izvor?',
      presetMixed: 'Odgovor i prosljeđivanje',
      presetMixedHint: 'Dva dolazna paketa: zašto R propušta svaki od njih?',
      presetProto: 'Krivi protokol',
      presetProtoHint: 'Isti port 8080, ali UDP.',
      presetHairpin: 'Iznutra na vanjsku adresu',
      presetHairpinHint: 'Radi izvana; radi li i iznutra? Probaj zatim s uključenom petljom.',

      legendIn: 'računalo u LAN-u',
      legendRouter: 'usmjernik',
      legendOut: 'računalo na internetu',
      legendChanged: 'promijenjeno u ovom koraku',
      legendDrop: 'odbačen paket',
      legendPat: 'zapis iz odlaznog paketa',
      legendFwd: 'zapis iz prosljeđivanja',

      host: 'Računalo',
      server: 'Poslužitelj',
      router: 'Usmjernik',
      client: 'Klijent',
      web: 'Web poslužitelj',
      rIn: 'unutra',
      rOut: 'vani',
      rNext: 'sljedeći slobodni port',
      badgeSend: 'šalje',
      badgeRecv: 'prima',
      badgeDrop: '✕ odbacuje',
      badgeTranslate: 'prevodi',

      hdrTitle: 'Paket na žici',
      hdrLayer: 'IP + {proto}',
      hdrNone: 'Još nijedan paket.',
      hdrDropped: '✕ odbačen',
      fSrc: 'Izvor',
      fDst: 'Odredište',
      was: 'bilo',
      nextHop: 'Sljedeći korak: {from} → {to}',
      lastHop: 'Kraj primjera.',

      tableTr: 'Tablica prijevoda',
      tableFw: 'Prosljeđivanje portova',
      colProto: 'Protokol',
      colInside: 'Unutarnja adresa',
      colOutside: 'Vanjska adresa',
      colRemote: 'Druga strana',
      colMark: 'Ovaj paket',
      colExt: 'Vanjski port',
      colTo: 'Prosljeđuje na',
      impTr: 'nijedan zapis ne odgovara',
      impTrIn: '↓ prosljeđivanja',
      impTrOut: 'novi zapis',
      impFw: 'nema ni zapisa ni prosljeđivanja',
      impFwAct: 'odbaci',
      markSkip: 'nije čitan',
      tagNew: 'novi',
      asNote: 'kao {as}',
      outRow: 'prevodi',
      outNew: 'dodan',
      outFwd: 'prosljeđen',
      outNext: 'dalje ↓',
      outDrop: 'odbačen',

      stepN: 'Korak {n}: ',
      captionStartBook: 'Početak: tablica prijevoda je prazna. A i B spojit će se na {web}, oba s porta {port}; zatim K izvana šalje paket na {probe}.',
      captionStartMixed: 'Početak: A i B već su spojeni na {web}, pa tablica ima zapise za {p1} i {p2}. Najprije stiže odgovor za A, zatim K izvana šalje paket na {probe}.',
      captionStartOutside: 'Početak: tablica prijevoda je prazna. K izvana otvara spoj na {probe}, vanjsku adresu usmjernika R.',
      captionStartInside: 'Početak: A, unutar mreže, otvara spoj na {probe}, vanjsku adresu vlastitog usmjernika R.',
      captionFwdNone: 'Prosljeđivanja nema.',
      captionFwdOne: 'Upisano je prosljeđivanje {f}.',
      captionSend: '{who} šalje paket s {src} na {dst}; paket stiže do usmjernika R.',
      captionAnswer: '{who} odgovara s {src} na {dst}; odgovor ide preko usmjernika R.',
      captionNew: 'R nema zapisa za ovaj spoj, pa dodaje novi: izvor {from} postaje {to}, prvi slobodan vanjski port.',
      captionSamePort: 'A i B imaju isti izvorišni port {port}, a izvana ih razlikuju vanjski portovi.',
      captionRowIn: 'Paket na {dst} pripada zapisu {row}, spoju računala {inside} s {remote}: R vraća odredište na {to}.',
      captionRowOut: 'Odgovor pripada zapisu {row}: R mijenja izvor {from} u {to}. Odredište {dst} ostaje isto.',
      captionRowBoth: 'Odgovor pripada zapisu {row}: R mijenja oba polja, izvor u {src} i odredište u {dst}.',
      captionForward: 'R nalazi zapis prosljeđivanja {f} i mijenja odredište. Izvor ostaje {src} — poslužitelj vidi pravu adresu klijenta.',
      captionForwardLan: 'R nalazi prosljeđivanje {f} i mijenja odredište. Izvor ostaje {src}, adresa iz iste mreže u kojoj je i S.',
      captionForwardLoop: 'R nalazi prosljeđivanje {f} i mijenja odredište, a budući da je petlja uključena, mijenja i izvor: {from} postaje {to}. S će odgovor poslati preko R.',
      captionDrop: 'Na {dst} nema ni zapisa u tablici ni prosljeđivanja, pa R paket odbacuje.',
      captionDropProto: 'Prosljeđivanje {f} vrijedi samo za svoj protokol. Za {proto} na {dst} nema ni zapisa ni prosljeđivanja, pa R paket odbacuje.',
      captionDropRemote: 'Zapis {row} drži {dst}, ali za spoj s {remote}, a ovaj paket dolazi s {src}. Ni prosljeđivanja za {dst} nema, pa R paket odbacuje.',
      captionUnexpected: 'S odgovara izravno računalu A, jer je {dst} u istoj mreži: odgovor ne prolazi kroz R. A je pozvao {called}, a odgovor stiže s {src}, pa ga A ne prepoznaje i odbacuje.',
      captionGot: '{who} dobiva odgovor s adrese koju je pozvao: spoj radi.',
      captionReached: 'Paket stiže do {who}.',

      explain: '<p><i>Port forwarding</i> (prosljeđivanje <i>portova</i>) je stalan zapis koji administrator unaprijed upiše ' +
        'u usmjernik: svaki dolazni paket na zadani vanjski <i>port</i> i protokol ide točno određenom unutarnjem računalu i ' +
        '<i>portu</i>. Bez njega R odbacuje paket izvana koji ne pripada nijednom spoju iz tablice prijevoda, jer ne zna ' +
        'kome ga predati.</p>' +
        '<p>R odlučuje uvijek istim redom: (1) zapis postojećeg spoja; (2) za paket na vanjsku adresu, prosljeđivanje; ' +
        '(3) inače odbacuje. Odlazni paket novog spoja dobiva novi zapis s prvim slobodnim vanjskim <i>portom</i> od 61000, ' +
        'a taj izbor preskače <i>portove</i> koji imaju prosljeđivanje. Prosljeđivanje mijenja samo odredište; R zapamti ' +
        'spoj, pa odgovoru poslužitelja vraća izvor na vanjsku adresu koju je klijent pozvao.</p>' +
        '<p>Dva prosljeđivanja s istim protokolom na istom vanjskom <i>portu</i> R ne prihvaća: jedan vanjski <i>port</i> ' +
        'vodi do jednog unutarnjeg odredišta. Isti poslužitelj smije imati više prosljeđivanja.</p>' +
        '<p>Česte zablude. <b>NAT nije vatrozid</b>: paket izvana ne prolazi jer nema zapisa, a ne zato što ga nešto ' +
        'štiti (RFC 4864). <b>Prosljeđivanje ne mijenja izvor</b>: poslužitelj vidi pravu adresu klijenta. <b>Što radi ' +
        'izvana ne mora raditi iznutra</b>: bez petlje kroz usmjernik (<i>hairpinning</i>) poslužitelj odgovara računalu ' +
        'iz iste mreže izravno, s adrese koju ono nije pozvalo.</p>'
    },
    en: {
      stage: 'Router R with its translation table and port forwards',

      scene: 'Who sends',
      sceneBook: 'A, B, K',
      sceneMixed: 'W, K',
      sceneOutside: 'K',
      sceneInside: 'A',
      forward: 'Forward 8080 → S:80',
      proto: 'Protocol of the packet to the outside address',
      extPort: 'Outside port it goes to',
      hairpin: 'Hairpinning through the router',

      presetBook: 'The book\'s example: no forward',
      presetBookHint: 'Example 4: which outside ports do A and B get, and what happens to the packet to 61050?',
      presetAdd: 'Add a forward',
      presetAddHint: 'TCP 8080 → 192.168.1.20:80. Which source address does the server see?',
      presetMixed: 'A reply and a forward',
      presetMixedHint: 'Two inbound packets: why does R let each of them in?',
      presetProto: 'Wrong protocol',
      presetProtoHint: 'The same port 8080, but UDP.',
      presetHairpin: 'From inside to the outside address',
      presetHairpinHint: 'It works from outside; does it work from inside? Then try with hairpinning on.',

      legendIn: 'host on the LAN',
      legendRouter: 'router',
      legendOut: 'host on the internet',
      legendChanged: 'changed in this step',
      legendDrop: 'dropped packet',
      legendPat: 'row made by an outbound packet',
      legendFwd: 'row from a forward',

      host: 'Host',
      server: 'Server',
      router: 'Router',
      client: 'Client',
      web: 'Web server',
      rIn: 'in',
      rOut: 'out',
      rNext: 'next free port',
      badgeSend: 'sends',
      badgeRecv: 'receives',
      badgeDrop: '✕ drops',
      badgeTranslate: 'translates',

      hdrTitle: 'Packet on the wire',
      hdrLayer: 'IP + {proto}',
      hdrNone: 'No packet yet.',
      hdrDropped: '✕ dropped',
      fSrc: 'Source',
      fDst: 'Destination',
      was: 'was',
      nextHop: 'Next step: {from} → {to}',
      lastHop: 'End of the example.',

      tableTr: 'Translation table',
      tableFw: 'Port forwards',
      colProto: 'Protocol',
      colInside: 'Inside address',
      colOutside: 'Outside address',
      colRemote: 'Remote end',
      colMark: 'This packet',
      colExt: 'Outside port',
      colTo: 'Forwards to',
      impTr: 'no row matches',
      impTrIn: '↓ forwards',
      impTrOut: 'new row',
      impFw: 'neither a row nor a forward',
      impFwAct: 'drop',
      markSkip: 'not read',
      tagNew: 'new',
      asNote: 'as {as}',
      outRow: 'translate',
      outNew: 'added',
      outFwd: 'forwarded',
      outNext: 'next ↓',
      outDrop: 'dropped',

      stepN: 'Step {n}: ',
      captionStartBook: 'Start: the translation table is empty. A and B will connect to {web}, both from port {port}; then K, outside, sends a packet to {probe}.',
      captionStartMixed: 'Start: A and B are already connected to {web}, so the table has rows for {p1} and {p2}. First a reply for A arrives, then K, outside, sends a packet to {probe}.',
      captionStartOutside: 'Start: the translation table is empty. K, outside, opens a connection to {probe}, router R\'s outside address.',
      captionStartInside: 'Start: A, inside the network, opens a connection to {probe}, the outside address of its own router R.',
      captionFwdNone: 'There is no forward.',
      captionFwdOne: 'One forward is set: {f}.',
      captionSend: '{who} sends a packet from {src} to {dst}; it reaches router R.',
      captionAnswer: '{who} answers from {src} to {dst}; the answer goes through router R.',
      captionNew: 'R has no row for this connection, so it adds one: source {from} becomes {to}, the first free outside port.',
      captionSamePort: 'A and B use the same source port {port}; from outside, their outside ports tell them apart.',
      captionRowIn: 'The packet to {dst} belongs to row {row}, the connection of {inside} with {remote}: R rewrites the destination back to {to}.',
      captionRowOut: 'The answer belongs to row {row}: R rewrites the source {from} to {to}. The destination {dst} stays the same.',
      captionRowBoth: 'The answer belongs to row {row}: R rewrites both fields, the source to {src} and the destination to {dst}.',
      captionForward: 'R finds the forward {f} and rewrites the destination. The source stays {src}: the server sees the client\'s real address.',
      captionForwardLan: 'R finds the forward {f} and rewrites the destination. The source stays {src}, an address on the same network as S.',
      captionForwardLoop: 'R finds the forward {f} and rewrites the destination; with hairpinning on it rewrites the source too: {from} becomes {to}. S will send its answer through R.',
      captionDrop: 'There is neither a table row nor a forward for {dst}, so R drops the packet.',
      captionDropProto: 'The forward {f} is for its own protocol only. For {proto} to {dst} there is neither a row nor a forward, so R drops the packet.',
      captionDropRemote: 'Row {row} holds {dst}, but for the connection with {remote}; this packet comes from {src}. No forward covers {dst} either, so R drops it.',
      captionUnexpected: 'S answers A directly, since {dst} is on its own network: the answer does not pass through R. A called {called}, but the answer comes from {src}, so A does not recognise it and drops it.',
      captionGot: '{who} gets the answer from the address it called: the connection works.',
      captionReached: 'The packet reaches {who}.',

      explain: '<p><i>Port forwarding</i> is a permanent row the administrator writes into the router in advance: every ' +
        'inbound packet to a given outside port and protocol goes to one inside host and port. Without it, R drops a ' +
        'packet from outside that belongs to no connection in the translation table, because it does not know whom to ' +
        'hand it to.</p>' +
        '<p>R always decides in the same order: (1) the row of an existing connection; (2) for a packet to the outside ' +
        'address, a forward; (3) otherwise it drops the packet. An outbound packet of a new connection gets a new row with ' +
        'the first free outside port from 61000, and that choice skips the ports that have a forward. A forward rewrites ' +
        'the destination only; R remembers the connection, so the server\'s answer gets its source set back to the ' +
        'outside address the client called.</p>' +
        '<p>R refuses two forwards with the same protocol on one outside port: one outside port leads to one inside ' +
        'destination. The same server may have several forwards.</p>' +
        '<p>Common mistakes. <b>NAT is not a firewall</b>: a packet from outside does not get in because there is no ' +
        'row, not because something protects the network (RFC 4864). <b>A forward does not change the source</b>: the ' +
        'server sees the client\'s real address. <b>What works from outside need not work from inside</b>: without ' +
        '<i>hairpinning</i> the server answers a host on its own network directly, from an address that host did not ' +
        'call.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
