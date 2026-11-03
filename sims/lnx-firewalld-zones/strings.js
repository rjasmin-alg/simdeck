/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-firewalld-zones, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, [[term]] a glossary term (first mention; [[=term]] later ones).
   Zone names, addresses, interfaces, ports, targets and command lines are data: the page puts them in
   translate="no" elements, never here. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Odabir zone vatrozida za dolazni paket',

      // the scene
      colPacket: 'Paket',
      colPick: 'Odabir zone',
      colZone: 'Zona',
      senders: 'Pošiljatelji',
      hostDemocli1: 'klijent',
      hostAdmin: 'laptop administratora',
      hostOutside: 'vanjsko računalo',
      server: 'Poslužitelj',
      ifZone: 'u zoni',
      ifDefault: 'bez zone → zadana',
      card: 'Dolazni paket',
      fSrc: 'izvor',
      fIif: 'sučelje',
      fDst: 'odredište',
      fWhat: 'što',
      icmpEcho: 'ICMP echo',
      noPacket: 'Još nije poslan. Pritisni →.',
      noPacketCmd: 'Sad se mijenja vatrozid; isti paket ide ponovno u koraku 5.',
      round2: 'ponovno, nakon naredbe',

      // the zone picker (K4)
      pickTitle: 'Vezivanja, redom kojim se čitaju',
      colValue: 'vezivanje',
      colZoneAct: 'zona',
      kindSource: 'izvor',
      kindIface: 'sučelje',
      implicitDefault: 'ništa → zadana zona',
      implicitDefaultNew: 'ništa → nova zadana zona',
      markWin: 'odlučuje',
      markSkip: 'ne čita se',
      tagNew: 'novo',
      cmdTitle: 'Naredba u koraku 4',
      cmdDone: 'Izvedena naredba',
      cmdNext: 'još nije izvedena',

      // the zone card
      zonesTitle: 'Zone',
      noZoneYet: 'Zona još nije odabrana: ona ovisi o tome odakle paket dolazi.',
      listAll: 'sadržaj zone',
      verdictTitle: 'Odluka',
      vAccept: 'prihvaćen',
      vReject: 'odbijen porukom',
      vDrop: 'odbačen, bez odgovora',
      clientSees: 'Klijent vidi',
      clientAnswer: 'veza uspostavljena, usluga odgovara',
      clientWaits: '(čeka… pa nakon isteka vremena)',
      clientNothing: '(nema odgovora)',

      // params and presets
      scenario: 'Postav i naredba',
      scBook: 'Knjiga: --add-port',
      scBySource: '--add-source',
      scDropBlock: 'drop → block',
      scDefault: '--set-default-zone',
      source: 'Pošiljatelj',
      dport: 'Odredišni port',
      dportHint: 'Promjena odmah ponovno šalje isti paket.',
      pBook: 'Knjiga: port 8991',
      pBySource: 'Izvor ispred sučelja',
      pDropBlock: 'drop ili block',
      pDefault: 'Zadana zona',

      // legend
      lgSource: 'vezivanje izvora',
      lgIface: 'vezivanje sučelja',
      lgDefault: 'zadana zona',
      lgAccept: 'prihvaćen',
      lgReject: 'odbijen porukom',
      lgDrop: 'odbačen',
      lgChanged: 'odlučilo / promijenjeno',

      // captions
      cIdle: 'Svaki paket upućen poslužitelju ulazi u točno jednu zonu, a tek zona odlučuje što s njim. Pritisni → i pošalji paket.',
      cArrived: '{who} šalje {what} s adrese {src}; paket ulazi kroz {iif}. U koju zonu?',
      cArrived2: 'Isti paket još jednom: {what} s {src} kroz {iif}. Je li naredba promijenila zonu?',
      cZonedSource: 'Adresa {src} je unutar {prefix}, a to je vezano uz zonu {zone}. Izvor se čita prije sučelja: zona je {zone2}.',
      cZonedSourceOver: 'Paket s {src} ušao je kroz {iif}, ali vezivanje izvorišne adrese ima prednost: zona je {zone}, ne {other}.',
      cZonedIface: 'Nijedno vezivanje izvora ne sadrži {src}; sučelje {iif} vezano je uz zonu {zone}.',
      cZonedIfaceOnly: 'Sučelje {iif} vezano je uz zonu {zone}, pa paket ulazi u {zone2}.',
      cZonedDefault: 'Za {src} nema vezivanja izvora, a {iif} nije ni u jednoj zoni: paket ide u zadanu zonu {zone}.',
      cService: 'Zona {zone} ima uslugu {svc}, a ona nosi {ports}: paket je prihvaćen.',
      cPort: 'Zona {zone} ima port {port}: paket je prihvaćen.',
      cTargetDefault: 'Ni usluge ni portovi zone {zone} ne sadrže {what}. Vrijedi {target}: sve osim ICMP-a odbija se porukom, pa klijent piše {msg}.',
      cTargetDefaultIcmp: 'ICMP ne traži ni uslugu ni port: {target} prihvaća ICMP, pa odgovor stiže.',
      cTargetReject: 'Zona {zone} nema popisanih usluga ni portova; {target} odbija porukom. Klijent odmah zna da ga je netko odbio.',
      cTargetDrop: 'Zona {zone} odbacuje bez ikakva odgovora ({target}). Klijent čeka dok ne istekne vrijeme: tišina ne znači da stroja nema.',
      cTargetAccept: 'Zona {zone} prihvaća sve ({target}): ona je stav prema svemu što je uz nju vezano, a ne popis pravila.',
      cAddPort: 'Port {port} dodan je u zonu {zone}; bez --zone naredba mijenja zadanu zonu. Sučelja i izvori ostaju isti.',
      cAddSource: 'Adresa {prefix} vezana je uz zonu {zone}. Sučelje {iif} i dalje je u zoni {other}.',
      cChangeIface: 'Sučelje {iface} prešlo je iz zone {from} u {zone}: sučelje je uvijek u točno jednoj zoni.',
      cChangeIfaceNew: 'Sučelje {iface} vezano je uz zonu {zone}.',
      cSetDefault: 'Zadana zona je sada {zone}, u radnoj i u trajnoj konfiguraciji odjednom. Ono što nije vezano ({ifaces}) prelazi u zonu {zone2}; sučelje {bound} vezano je izravno i ostaje u zoni {old}.',
      cRefused: 'Naredba je odbijena ({code}): ništa se nije promijenilo.',
      cSameAnswer: 'Ista odluka kao prije naredbe, ali sada je donosi zona {zone}: promjena zone {old} više ne bi djelovala na {iif}.',

      explain: '<p>Na poslužitelju [[firewall]] za svaki dolazni paket odlučuje: prihvatiti, odbiti porukom ili odbaciti ' +
        'bez odgovora. Pravila nisu vezana uz paket ni izravno uz sučelje, nego uz zonu: [[firewall zone]] je imenovana ' +
        'razina povjerenja. Paket ulazi u <b>jednu i samo jednu</b> zonu, a jedno sučelje ili jedna izvorišna adresa pripada ' +
        'točno jednoj zoni.</p>' +
        '<p><b>Odabir zone.</b> Prvo se čita svaki <i lang="en">source binding</i> (vezivanje izvorišne adrese): ako adresa paketa leži u prefiksu vezanom uz ' +
        'neku zonu, to je zona paketa, kroz koje god sučelje ušao. Inače odlučuje zona ulaznog sučelja, a sučelje bez ' +
        'zone koristi zadanu zonu. Zone se čitaju redom <i lang="en">ingress-priority</i> (manji broj prvi); kod iste ' +
        'vrijednosti izvori prije sučelja, a zatim po imenu zone, pa dva prefiksa koja se preklapaju ne rješava duljina ' +
        'prefiksa nego ime zone.</p>' +
        '<p><b>Odluka u zoni.</b> Paket prolazi ako mu protokol i port odgovaraju usluzi zone (ime usluge nosi portove: ' +
        '<code>ssh</code> → <code>22/tcp</code>) ili portu zone. Inače vrijedi <code>target</code>: <code>default</code> ' +
        'prihvaća ICMP, a ostalo odbija porukom; zona <code>block</code> odbija porukom, <code>drop</code> šuti, ' +
        '<code>trusted</code> prihvaća sve. Odbijenicu klijent vidi odmah (<code>No route to host</code>), a odbačen ' +
        'paket izgleda kao da stroja nema.</p>' +
        '<p>Naredbe ovdje mijenjaju samo jednu od dviju konfiguracija, [[runtime configuration]]. S ' +
        '<code>--permanent</code> mijenjala bi se [[permanent configuration]], koja djeluje tek nakon ponovnog učitavanja (<code>--reload</code>). <code>--set-default-zone</code> je iznimka: mijenja ' +
        'obje odjednom. Ispod zona je filtar paketa jezgre: zone žive u tablici <code>inet firewalld</code>, u lancu na kuki <code>input</code> ' +
        '(simulator <i>Paket kroz netfilter</i>).</p>'
    },
    en: {
      stage: 'Choosing the firewall zone for an incoming packet',

      colPacket: 'Packet',
      colPick: 'Zone choice',
      colZone: 'Zone',
      senders: 'Senders',
      hostDemocli1: 'client',
      hostAdmin: 'admin laptop',
      hostOutside: 'outside host',
      server: 'Server',
      ifZone: 'in zone',
      ifDefault: 'no zone → default',
      card: 'Incoming packet',
      fSrc: 'source',
      fIif: 'interface',
      fDst: 'destination',
      fWhat: 'what',
      icmpEcho: 'ICMP echo',
      noPacket: 'Not sent yet. Press →.',
      noPacketCmd: 'The firewall changes now; the same packet goes again at step 5.',
      round2: 'again, after the command',

      pickTitle: 'Bindings, in the order they are read',
      colValue: 'binding',
      colZoneAct: 'zone',
      kindSource: 'source',
      kindIface: 'interface',
      implicitDefault: 'nothing → default zone',
      implicitDefaultNew: 'nothing → new default zone',
      markWin: 'decides',
      markSkip: 'not read',
      tagNew: 'new',
      cmdTitle: 'Command at step 4',
      cmdDone: 'Command run',
      cmdNext: 'not run yet',

      zonesTitle: 'Zones',
      noZoneYet: 'No zone chosen yet: it depends on where the packet comes from.',
      listAll: 'zone contents',
      verdictTitle: 'Verdict',
      vAccept: 'accepted',
      vReject: 'rejected with a reply',
      vDrop: 'dropped, no reply',
      clientSees: 'The client sees',
      clientAnswer: 'connected, the service answers',
      clientWaits: '(waits… then, after the timeout)',
      clientNothing: '(no reply)',

      scenario: 'Setup and command',
      scBook: 'Book: --add-port',
      scBySource: '--add-source',
      scDropBlock: 'drop → block',
      scDefault: '--set-default-zone',
      source: 'Sender',
      dport: 'Destination port',
      dportHint: 'A change sends the same packet again at once.',
      pBook: 'Book: port 8991',
      pBySource: 'Source before interface',
      pDropBlock: 'drop or block',
      pDefault: 'Default zone',

      lgSource: 'source binding',
      lgIface: 'interface binding',
      lgDefault: 'default zone',
      lgAccept: 'accepted',
      lgReject: 'rejected with a reply',
      lgDrop: 'dropped',
      lgChanged: 'decided / changed',

      cIdle: 'Every packet addressed to the server enters exactly one zone, and only the zone decides what happens to it. Press → to send a packet.',
      cArrived: '{who} sends {what} from {src}; the packet comes in on {iif}. Which zone?',
      cArrived2: 'The same packet once more: {what} from {src} on {iif}. Did the command change its zone?',
      cZonedSource: 'Address {src} lies in {prefix}, which is bound to zone {zone}. Sources are read before interfaces: the zone is {zone2}.',
      cZonedSourceOver: 'The packet from {src} came in on {iif}, but the source binding takes precedence: the zone is {zone}, not {other}.',
      cZonedIface: 'No source binding contains {src}; interface {iif} is bound to zone {zone}.',
      cZonedIfaceOnly: 'Interface {iif} is bound to zone {zone}, so the packet enters {zone2}.',
      cZonedDefault: 'No source binding for {src}, and {iif} is in no zone: the packet goes to the default zone, {zone}.',
      cService: 'Zone {zone} has service {svc}, which carries {ports}: the packet is accepted.',
      cPort: 'Zone {zone} has port {port}: the packet is accepted.',
      cTargetDefault: 'Neither the services nor the ports of zone {zone} include {what}. {target} applies: everything but ICMP is rejected with a reply, so the client prints {msg}.',
      cTargetDefaultIcmp: 'ICMP needs no service or port: {target} accepts ICMP, so the reply comes back.',
      cTargetReject: 'Zone {zone} lists no services or ports; {target} rejects with a reply. The client knows at once that it was turned away.',
      cTargetDrop: 'Zone {zone} drops without any reply ({target}). The client waits until it times out: silence does not mean the host is down.',
      cTargetAccept: 'Zone {zone} accepts everything ({target}): a zone is a stance towards everything bound to it, not a list of rules.',
      cAddPort: 'Port {port} is added to zone {zone}; without --zone the command changes the default zone. Interfaces and sources stay the same.',
      cAddSource: 'Address {prefix} is bound to zone {zone}. Interface {iif} is still in zone {other}.',
      cChangeIface: 'Interface {iface} moved from zone {from} to {zone}: an interface is always in exactly one zone.',
      cChangeIfaceNew: 'Interface {iface} is bound to zone {zone}.',
      cSetDefault: 'The default zone is now {zone}, in the runtime and the permanent configuration at once. What is not bound ({ifaces}) moves to {zone2}; {bound} is bound explicitly and stays in {old}.',
      cRefused: 'The command is refused ({code}): nothing changed.',
      cSameAnswer: 'The same verdict as before the command, but now zone {zone} gives it: a change to zone {old} would no longer touch {iif}.',

      explain: '<p>A [[firewall]] on the server decides for every incoming packet: accept it, reject it with a reply, ' +
        'or drop it without one. Its rules are tied neither to the packet nor directly to an interface, but to a ' +
        '[[firewall zone]]: a named level of trust. A packet enters <b>one and only one</b> zone, and an interface or a ' +
        'source address belongs to exactly one zone.</p>' +
        '<p><b>Choosing the zone.</b> Source bindings are read first: if the packet\'s address lies in a prefix bound to a ' +
        'zone, that is its zone, whichever interface it came in on. Otherwise the incoming interface\'s zone decides, and ' +
        'an interface in no zone uses the default zone. Zones are read in <i lang="en">ingress-priority</i> order (lower ' +
        'first); at equal values sources before interfaces, then by zone name, so two overlapping prefixes are settled by ' +
        'the zone\'s name, not by prefix length.</p>' +
        '<p><b>The verdict in the zone.</b> The packet passes if its protocol and port match one of the zone\'s services ' +
        '(a service name carries its ports: <code>ssh</code> → <code>22/tcp</code>) or one of its ports. Otherwise the ' +
        '<code>target</code> applies: <code>default</code> accepts ICMP and rejects the rest with a reply; zone ' +
        '<code>block</code> rejects with a reply, <code>drop</code> stays silent, <code>trusted</code> accepts everything. ' +
        'The client sees a reject at once (<code>No route to host</code>); a dropped packet looks as if the host were not ' +
        'there.</p>' +
        '<p>The changes here go to the [[runtime configuration]]; with <code>--permanent</code> they would go to the ' +
        '[[permanent configuration]] and act only after a reload (<code>--reload</code>). <code>--set-default-zone</code> is the exception: it ' +
        'changes both at once. Under the zones is the kernel\'s packet filter: the zones live in the <code>inet firewalld</code> table, in a chain on the ' +
        '<code>input</code> hook (the <i>A packet through netfilter</i> simulator).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
