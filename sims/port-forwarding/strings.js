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

      legendIn: 'računalo u LAN-u, kontejner',
      legendRouter: 'usmjernik, domaćin',
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

      // container host (preset task lnx-container-ports)
      hostMode: 'Domaćin kontejnera',
      cscene: 'Kontejner',
      cscenePublish: 'objavljen',
      csceneUnpub: 'nije objavljen',
      csceneLoop: 'samo 127.0.0.1',
      csceneTaken: 'port zauzet',
      cPresetPublish: 'Kontejner: objava porta',
      cPresetPublishHint: '-p 8080:80. Tko sluša na portu 8080 domaćina i koju adresu web vidi kao izvor?',
      cPresetUnpub: 'Kontejner bez objave',
      cPresetUnpubHint: 'Bez -p: što dobiva klijent izvana, a što sam domaćin?',
      cPresetLoop: 'Objava samo na 127.0.0.1',
      cPresetLoopHint: '-p 127.0.0.1:8080:80. Vrijedi li pravilo za paket izvana?',
      cPresetTaken: 'Port domaćina već zauzet',
      cPresetTakenHint: 'Drugi kontejner traži isti port 8080 domaćina.',
      cHost: 'Domaćin',
      cContainer: 'Kontejner',
      cOut: 'vani',
      cBridge: 'most',
      badgePublish: 'objavljuje',
      badgeRefuse: '✕ odbija',
      cmdTitle: 'Naredba sustavu za kontejnere',
      cmdNone: 'Bez -p nema pravila.',
      cmdAdded: 'Dodano pravilo {row}.',
      cmdRefused: '✕ Odbijeno: port {port} domaćina već je zauzet (pravilo {row}).',
      hdrRst: 'IP + {proto}, zastavica RST',
      cTableTr: 'Praćenje veza: prevedeni spojevi',
      cColInside: 'Kontejner',
      cColOutside: 'Adresa domaćina',
      cImpTrIn: '↓ objavljeni portovi',
      cTableFw: 'Objavljeni portovi: pravila DNAT na domaćinu',
      cColAddr: 'Adresa domaćina',
      cColPort: 'Port domaćina',
      cAny: 'sve',
      cImpFw: 'nema pravila',
      cImpFwAct: 'domaćin: RST',
      cOutRefused: 'odbijen',
      tagTaken: 'zauzet',
      cStart: 'Početak: domaćin host1 ima vanjsku adresu {out} i most kontejnera {bridge}. Objavljenih portova još nema.',
      cStartTaken: 'Početak: kontejner web već radi s {p}, pa tablica ima pravilo za port {port} domaćina.',
      cCmdPublish: '{p} nije ništa drugo nego pravilo DNAT (prevođenje odredišne adrese) na domaćinu: {from} postaje {to}.',
      cCmdBound: '{p} upisuje pravilo DNAT samo za adresu {addr}: {from} postaje {to}. Za vanjsku adresu domaćina pravila nema.',
      cCmdNone: '{cmd}: kontejner web radi na mostu, na {to}, ali bez -p domaćin ne dobiva nijedno pravilo.',
      cCmdRefused: 'Sustav za kontejnere odbija {cmd}: port {port} domaćina već je zauzet (pravilo {row}), a tablica ostaje ista. Kontejneri smiju dijeliti svoj port 80, jer svaki ima svoju adresu; port domaćina ima samo jedno pravilo.',
      cSend: '{who} šalje paket s {src} na {dst}, adresu domaćina; paket stiže do domaćina.',
      cAnswer: '{who} odgovara s {src} na {dst}; odgovor ide preko domaćina.',
      cAnswerLocal: '{who} odgovara s {src} na {dst}, domaćinu.',
      cLocal: 'Domaćin sam šalje zahtjev s {src} na {dst}: kontejner je na mostu, izravno dostupan s domaćina, bez ikakvog pravila.',
      cForward: 'Pravilo {f} pogađa: čim paket stigne (prerouting), domaćin mu mijenja odredište u {to}. Ta adresa nije domaćinova, pa paket ide dalje do kontejnera, a ne programu na samom domaćinu. Izvor ostaje {src}: {name} vidi pravu adresu klijenta.',
      cRowOut: 'Odgovor pripada vezi {row}: domaćin vraća izvor {from} u {to}, adresu koju je klijent pozvao.',
      cRefused: 'Za {dst} nema pravila, a na tom portu domaćina nitko ne sluša: domaćin odgovara resetom (RST) i klijent dobiva „spoj odbijen”. Kontejner sluša na svojoj adresi, ne na portu domaćina.',
      cRefusedAddr: 'Pravilo vrijedi samo za adresu {addr}, pa paket izvana ne pogađa ni jedan redak tablice. Na {dst} nitko ne sluša: domaćin odgovara resetom (RST), spoj je odbijen.',
      cGot: '{who} dobiva odgovor s adrese koju je pozvao: spoj radi.',

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
        'iz iste mreže izravno, s adrese koju ono nije pozvalo.</p>' +
        '<p><b>Domaćin kontejnera.</b> Objava <i>porta</i> (<i>port publishing</i>) <code>-p 8080:80</code> isto je ' +
        'prosljeđivanje: sustav za kontejnere upiše na domaćinu pravilo <i>DNAT</i> (prevođenje odredišne adrese), pa ' +
        'paket na port 8080 domaćina dobiva odredište 10.88.0.5:80 čim stigne (<i>prerouting</i>), prije odluke ide li ' +
        'domaćinu ili dalje. Kontejner sluša na svojoj adresi na mostu (10.88.0.0/16), ne na portu domaćina: bez ' +
        'pravila paket stiže samom domaćinu, gdje na tom portu nitko ne sluša, pa domaćin odgovara resetom (spoj ' +
        'odbijen). <code>-p 127.0.0.1:8080:80</code> veže pravilo za jednu adresu domaćina: zahtjev na 127.0.0.1:8080 ' +
        's domaćina stiže do kontejnera, paket izvana ne. Jedan port domaćina ima jedno pravilo; kontejneri smiju ' +
        'dijeliti svoj port 80, jer svaki ima svoju adresu.</p>' +
        '<p>Zablude. <b>Kontejner ne sluša na portu domaćina</b>: to je pravilo prevođenja na domaćinu. <b>Objavi ne ' +
        'treba prevođenje izvora</b>: kontejner vidi pravu adresu klijenta. <b>Ulazna pravila vatrozida domaćina ne ' +
        'štite objavljeni port</b>: nakon prevođenja paket ide dalje, prema kontejneru, a ne ulazom u domaćina, pa ga ' +
        'pravila samo za ulaz ne vide. Iznimka: kontejner pokrenut bez administratorskih ovlasti (<i>rootless</i>) ne ' +
        'dobiva pravilo <i>DNAT</i>; promet mu prosljeđuje program u korisničkom prostoru.</p>'
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

      legendIn: 'host on the LAN, container',
      legendRouter: 'router, container host',
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

      // container host (preset task lnx-container-ports)
      hostMode: 'Container host',
      cscene: 'Container',
      cscenePublish: 'published',
      csceneUnpub: 'not published',
      csceneLoop: '127.0.0.1 only',
      csceneTaken: 'port taken',
      cPresetPublish: 'Container: publishing a port',
      cPresetPublishHint: '-p 8080:80. Who listens on the host\'s port 8080, and which source address does web see?',
      cPresetUnpub: 'Container, not published',
      cPresetUnpubHint: 'No -p: what does the outside client get, and what does the host itself get?',
      cPresetLoop: 'Published on 127.0.0.1 only',
      cPresetLoopHint: '-p 127.0.0.1:8080:80. Does the rule apply to a packet from outside?',
      cPresetTaken: 'Host port already taken',
      cPresetTakenHint: 'A second container asks for the same host port 8080.',
      cHost: 'Host',
      cContainer: 'Container',
      cOut: 'out',
      cBridge: 'bridge',
      badgePublish: 'publishes',
      badgeRefuse: '✕ refuses',
      cmdTitle: 'Container engine command',
      cmdNone: 'Without -p there is no rule.',
      cmdAdded: 'Rule {row} added.',
      cmdRefused: '✕ Refused: host port {port} is already allocated (rule {row}).',
      hdrRst: 'IP + {proto}, RST flag',
      cTableTr: 'Connection tracking: translated connections',
      cColInside: 'Container',
      cColOutside: 'Host address',
      cImpTrIn: '↓ published ports',
      cTableFw: 'Published ports: DNAT rules on the host',
      cColAddr: 'Host address',
      cColPort: 'Host port',
      cAny: 'any',
      cImpFw: 'no rule',
      cImpFwAct: 'host: RST',
      cOutRefused: 'refused',
      tagTaken: 'taken',
      cStart: 'Start: host1 has the outside address {out} and the container bridge {bridge}. No port is published yet.',
      cStartTaken: 'Start: container web already runs with {p}, so the table has a rule for host port {port}.',
      cCmdPublish: '{p} is nothing more than a DNAT rule on the host: {from} becomes {to}.',
      cCmdBound: '{p} writes a DNAT rule for the address {addr} only: {from} becomes {to}. There is no rule for the host\'s outside address.',
      cCmdNone: '{cmd}: container web runs on the bridge at {to}, but without -p the host gets no rule.',
      cCmdRefused: 'The container engine refuses {cmd}: host port {port} is already allocated (rule {row}), and the table stays the same. Containers may share their port 80, each has its own address; a host port has one rule only.',
      cSend: '{who} sends a packet from {src} to {dst}, the host\'s address; it reaches the host.',
      cAnswer: '{who} answers from {src} to {dst}; the answer goes through the host.',
      cAnswerLocal: '{who} answers from {src} to {dst}, the host.',
      cLocal: 'The host itself sends a request from {src} to {dst}: the container is on the bridge, reachable from the host directly, with no rule.',
      cForward: 'Rule {f} matches: as soon as the packet arrives (prerouting), the host rewrites its destination to {to}. That address is not the host\'s own, so the packet goes on to the container, not to a program on the host itself. The source stays {src}: {name} sees the client\'s real address.',
      cRowOut: 'The answer belongs to connection {row}: the host rewrites the source {from} back to {to}, the address the client called.',
      cRefused: 'There is no rule for {dst}, and nothing on the host listens on that port: the host answers with a reset (RST) and the client gets "connection refused". The container listens on its own address, not on the host\'s port.',
      cRefusedAddr: 'The rule applies only to {addr}, so a packet from outside matches no row. Nothing listens on {dst}: the host answers with a reset (RST), the connection is refused.',
      cGot: '{who} gets the answer from the address it called: the connection works.',

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
        'call.</p>' +
        '<p><b>Container host.</b> Port publishing, <code>-p 8080:80</code>, is the same forward: the container engine ' +
        'writes a DNAT rule on the host, so a packet to the host\'s port 8080 gets the destination 10.88.0.5:80 as soon ' +
        'as it arrives (prerouting), before the host decides whether the packet is for itself or goes on. The container ' +
        'listens on its own address on the bridge (10.88.0.0/16), not on the host\'s port: without a rule the packet ' +
        'reaches the host itself, where nothing listens on that port, so the host answers with a reset (connection ' +
        'refused). <code>-p 127.0.0.1:8080:80</code> binds the rule to one host address: a request to 127.0.0.1:8080 ' +
        'from the host reaches the container, a packet from outside does not. One host port has one rule; containers ' +
        'may share their port 80, each has its own address.</p>' +
        '<p>Mistakes. <b>The container does not listen on the host\'s port</b>: that is a translation rule on the host. ' +
        '<b>Publishing does not need a source rewrite</b>: the container sees the client\'s real address. <b>The host ' +
        'firewall\'s input rules do not protect a published port</b>: after the rewrite the packet goes on towards the ' +
        'container, not into the host, so rules for input alone never see it. The exception: a container started ' +
        'without administrator rights (rootless) gets no DNAT rule; a user-space program forwards its traffic.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
