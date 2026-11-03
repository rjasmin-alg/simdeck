/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-netns-veth-bridge, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: interface names, addresses and commands are data), [[term]] a glossary
   term (first mention; [[=term]] later ones). In captions *word* is an English word in italics and `x` is code.
   network namespace, bridge, veth pair and masquerade are not in the glossary yet: their pairs are written out
   (NOTES.md, term pairs). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Domaćin s dva mrežna imenska prostora, veth kabelima i mostom; ispod naredba i rezultat pinga',
      // panel
      scene: 'Primjer',
      pByHand: 'Ručno: dva prostora na mostu',
      pByHandHint: 'Imenski prostori, veth parovi, adrese, up, most: ping od ns1 do ns2 tri puta.',
      pWorld: 'Ručno: van u svijet',
      pWorldHint: 'Nastavak: adresa mosta, zadana ruta, ip_forward i prevođenje adresa, sve do pristupnika.',
      pForgotUp: 'Zaboravljen up',
      pForgotUpHint: 'Sve je spojeno, ali veth2-br nije uključen: ping stane na njemu.',
      pForgotFwd: 'Zaboravljen ip_forward',
      pForgotFwdHint: 'Ruta i NAT postoje, ali domaćin ne prosljeđuje: paket stane na mostu.',
      pEngine: 'Sustav za kontejnere',
      pEngineHint: 'Ista slika kakvu sustav za kontejnere složi sam: most, veth par po kontejneru, /16 i NAT.',
      showArp: 'ARP i MAC tablice',
      showArpHint: 'Prikazuje ARP tablicu svakog imenskog prostora i MAC tablicu mosta.',
      // legend
      legNs: 'mrežni imenski prostor',
      legUp: 'sučelje uključeno',
      legDown: 'isključeno',
      legCable: 'veth par',
      legBridge: 'most',
      legRoute: 'ruta prema pristupniku',
      legPath: 'put paketa, ✗ gdje je stao',
      legChanged: 'promijenjeno',
      // the command strip
      sideHost: 'domaćin · root',
      sideEngine: 'sustav za kontejnere',
      before: '(prije prve naredbe)',
      noOutput: '(ništa nije ispisano)',
      engineStart: 'pokreće se',
      engineRun: 'pokreće kontejner {ns}',
      engineSame: 'isto kao ove naredbe:',
      // the scene
      hostTitle: 'Domaćin',
      hostKind: 'korijenski imenski prostor',
      nsKind: 'imenski prostor',
      nsMissing: 'još ne postoji',
      gwTitle: 'Pristupnik',
      gwNote: 'izvan domaćina; zna rutu samo do 192.168.122.0/24',
      bridgeKind: 'most',
      noBridge: '(još nema mosta)',
      fdbTitle: 'MAC tablica:',
      fdbEmpty: 'prazna',
      secRoutes: 'rute',
      secArp: 'ARP',
      noRoutes: 'nema ruta',
      arpEmpty: 'prazna',
      arpFailed: 'NEUSPJELO',
      natNone: 'NAT: nema',
      natOn: 'NAT: masquerade {src}',
      portTag: 'port mosta {br}',
      looseTag: 'nije u mostu',
      goneTo: 'premješten u {ns}',
      up: 'uključeno',
      down: 'isključeno',
      // the ping line
      pingNone: '(još nema pinga)',
      pingEarlier: 'zadnji ping',
      pingOk: 'stigao je odgovor',
      pingAt: 'kod {at}',
      atGateway: 'pristupnika',
      atNs: 'imenskog prostora {ns}',
      st_linkDown: 'sučelje isključeno',
      st_noRoute: 'nema rute',
      st_noArp: 'nema ARP odgovora',
      st_notForwarded: 'nije proslijeđen',
      st_noReturn: 'nema puta natrag',
      whereNs: 'u {ns}',
      whereHost: 'kod domaćina',
      // captions: the start
      capStart: 'Domaćin ima `lo` i `enp1s0` s adresom 192.168.122.57/24. Njegova [[default route]] vodi do 192.168.122.1: to je [[gateway]] izvan domaćina.',
      'capGoal_by-hand': 'Cilj: ručno spojiti dva *network namespace* (mrežni imenski prostor), ns1 i ns2, dok ping iz ns1 prema ns2 ne dobije odgovor.',
      'capGoal_to-the-world': 'ns1 i ns2 već su spojeni mostom br0 i ns1 dobiva odgovor od ns2. Sada pokušavamo doći do pristupnika izvan domaćina.',
      'capGoal_forgot-up': 'Sve je spojeno kao u prvom primjeru, osim jednog `up` koji je izostavljen.',
      'capGoal_forgot-forward': 'Most ima adresu, ns1 ima zadanu rutu, a pravilo za *masquerade* (prevođenje adresa) postoji. Ipak, ping prema van ne prolazi.',
      'capGoal_container-view': 'Sustav za kontejnere radi isto što smo radili ručno: imenski prostor, veth par, most, rutu, prosljeđivanje i NAT.',
      // captions: wiring
      capNetnsAdd: '{ns} je novi *network namespace* (mrežni imenski prostor). U njemu je samo `lo`, isključen i bez adrese, bez ruta i bez ičega od domaćina.',
      capNetnsAdd2: 'Isto za {ns}: vlastiti `lo`, isključen, i ništa drugo.',
      capVethAdd: 'Novi *veth pair* (veth par): {a} i {b} su dva kraja jednog kabela. Što uđe na jedan kraj izađe na drugom. Oba su kraja nastala kod domaćina, pa su oba ondje, isključena.',
      capVethAdd2: 'Drugi veth par, {a} i {b}, opet ima oba kraja kod domaćina.',
      capMove: '{dev} je premješten u {ns}: iz pogleda domaćina je nestao. Isto sučelje u jednom trenutku pripada samo jednom imenskom prostoru.',
      capMove2: '{dev} je premješten u {ns}. Kod domaćina je ostao samo drugi kraj, {peer}, a kabel sada vodi iz {ns} do domaćina.',
      capAddr: '{ns} je dobio adresu {addr} na sučelju {dev}. Sučelje je još isključeno, pa ruta do {net} još ne postoji.',
      capAddrBridge: 'Most br0 je dobio adresu {addr}. To je adresa domaćina na mreži 10.0.0.0/24 i bit će [[=gateway]] za ns1.',
      capUpNoPeer: '{dev} je uključen i {ns} sada ima rutu do {net}. Drugi kraj, {peer}, još je isključen, pa kabel ne nosi okvire (nema signala nositelja).',
      capUpBoth: '{dev} je uključen. Oba kraja kabela sada rade, ali {dev} nije spojen ni na što, pa je to labav kraj kod domaćina.',
      capUpBridge: 'br0 je uključen. Most sada prosljeđuje okvire između svojih portova.',
      capUpPortFix: '{dev} je uključen, pa ga most br0 sada koristi kao port.',
      capBridgeAdd: 'br0 je *bridge* (most), softverski preklopnik u domaćinu: okvire prosljeđuje između portova prema MAC adresama. Zasad u njega nije spojeno ništa.',
      capMaster: '{dev} je spojen u {br} i postao je port mosta. Port ne treba vlastitu adresu.',
      capMasterDown: '{dev} je spojen u {br}. Oba kraja kod domaćina sada su portovi mosta, ali br0 je još isključen i ne prosljeđuje ništa.',
      capRoute: 'ns1 ima zadanu rutu preko 10.0.0.1, adrese mosta. Sve što nije u njegovoj podmreži sada ide domaćinu.',
      capFwdOn: 'Domaćin sada obavlja [[forwarding]] između sučelja, od br0 do enp1s0. Zadana vrijednost za `ip_forward` je 0.',
      capFwdRead: '`ip_forward` je {v}: domaćin nije usmjerivač. Paket za nekog drugog koji stigne na br0 tu i ostaje.',
      capNat: '*Masquerade* (prevođenje adresa): paketima iz {src} koji izlaze kroz {oif} domaćin mijenja izvornu adresu u svoju, 192.168.122.57. Odgovor zato dolazi domaćinu, a domaćin ga vraća u ns1.',
      capNatEngine: 'Pravilo za prevođenje adresa vrijedi za sve što iz {src} izlazi kroz sučelje koje nije br0.',
      capShowLinks: '`ip -br link show master br0` ispisuje portove mosta: veth2-br je DOWN, pa most prema njemu ne prosljeđuje.',
      capShowRoutes: 'U c1 su iste dvije rute koje je na kraju imao i ns1: zadana preko adrese mosta i povezana ruta vlastite podmreže, koju je dodala jezgra.',
      capEngineStart: 'Pri pokretanju sustav za kontejnere jednom napravi ono što smo mi radili ručno: most s adresom pristupnika, `ip_forward=1` i prevođenje adresa za svoju privatnu mrežu /16.',
      capEngineRun: 'Novi kontejner {ns}: novi imenski prostor, veth par s jednim krajem unutra (`eth0`) i drugim spojenim u br0, adresa {addr} i zadana ruta preko mosta.',
      // captions: pings
      capPingLinkDownSelf: 'Ping stane već na {dev}: sučelje je isključeno, pa {ns} nema nijednu rutu. Ping javlja `Network is unreachable`.',
      capPingLinkDown: 'Ping stane na {dev} {where}: sučelje je isključeno. ARP upit ne prođe dalje, pa {from} javlja `Destination Host Unreachable`.',
      capPingNoArp: '{from} ARP-om pita tko ima {dst}. Upit izađe na {at} kod domaćina, a taj kraj nije spojen ni na što i nitko ne odgovara. Dva kraja kod domaćina su dva labava kabela.',
      capPingNoArpOther: 'Na ARP upit za {dst} nitko ne odgovara: na tom segmentu nitko nema tu adresu.',
      capPingNoRoute: '{ns} nema rutu do {dst}: jedina ruta mu je do njegove podmreže. Ping javlja `Network is unreachable`.',
      capWorldNote: 'To što ns1 dobiva odgovor od ns2 ne znači da internet radi: trebaju još ruta, prosljeđivanje i NAT.',
      capPingNotFwd: 'Paket stigne do br0 i tu stane: `ip_forward` je 0, pa ga domaćin ne prosljeđuje na enp1s0. Natrag ne dolazi nikakva poruka o pogrešci.',
      capPingNoReturn: 'Upit izlazi kroz enp1s0 s izvorom {src}. Pristupnik ne zna ništa o 10.0.0.0/24, pa se odgovor ne vrati. Ping ostaje bez odgovora.',
      capPingOkL2: '{from} dobiva odgovor od {to} preko mosta: ARP je našao MAC adresu cilja, a br0 je naučio po jednu MAC adresu na svakom portu i prosljeđivao okvire. Ništa nije usmjereno.',
      capPingOkOut: 'Odgovor od pristupnika: paket je stigao domaćinu na br0, domaćin ga je proslijedio kroz enp1s0 i promijenio izvor u 192.168.122.57, a odgovor je našao put natrag.',
      capPingOk: 'Stigao je odgovor.',
      capErr: 'Naredba nije uspjela i ništa se nije promijenilo.',
      explain: '<p>Kontejner dobiva mrežu iz četiri dijela, a ova ih stranica spaja ručno, jedan po jedan. Prvi je ' +
        '<em lang="en">network namespace</em> (mrežni imenski prostor). Svaki ima vlastita sučelja, adrese, rute, ARP tablicu ' +
        'i vatrozid. Novi sadrži samo [[loopback]] <code>lo</code>, isključen. Drugi je <em lang="en">veth pair</em> (veth par): ' +
        'dva povezana sučelja, kao dva kraja kabela. Oba nastaju kod domaćina, a <code>ip link set … netns</code> jedan kraj ' +
        'premješta u imenski prostor. [[network interface]] pripada samo jednom imenskom prostoru i iz pogleda domaćina tada nestaje.</p>' +
        '<p>Treći je <em lang="en">bridge</em> (most), softverski preklopnik u domaćinu. Krajevi kabela kod domaćina spajaju se u ' +
        'njega s <code>master br0</code>, a most okvire prosljeđuje prema naučenim MAC adresama. Sve to radi tek kad je svako sučelje ' +
        'na putu uključeno. Nakon toga ns1 dobiva odgovor od ns2, a mostu za to ne treba ni adresa.</p>' +
        '<p>Četvrti je put van. ns1 treba [[default route]] preko adrese mosta, domaćin mora prosljeđivati pakete ' +
        '(<code>net.ipv4.ip_forward=1</code>), a pristupnik ne zna za 10.0.0.0/24. Zato domaćin mora prevoditi izvornu adresu, ' +
        '<em lang="en">masquerade</em> (prevođenje adresa), da bi se odgovor vratio. Ping pokazuje prvi korak koji ne prolazi, ' +
        'ovim redom: sučelje isključeno, nema rute, nema ARP odgovora, nije proslijeđeno, nema puta natrag.</p>' +
        '<p>Česte zablude: novi imenski prostor sam od sebe ima mrežu (nema, ima samo isključen <code>lo</code>); most usmjerava ' +
        '(ne usmjerava, nego prosljeđuje okvire); ako ns1 dobiva odgovor od ns2, internet sigurno radi (trebaju još ruta, ' +
        'prosljeđivanje i NAT). Sustav za kontejnere sve to složi sam. Objava portova (DNAT), VLAN-ovi, IPv6 i paketni filtar ' +
        'u dubinu teme su drugih stranica.</p>'
    },
    en: {
      stage: 'A host with two network namespaces, veth cables and a bridge; below, the command and the ping result',
      // panel
      scene: 'Example',
      pByHand: 'By hand: two namespaces on a bridge',
      pByHandHint: 'Namespaces, veth pairs, addresses, up, a bridge: ping from ns1 to ns2 three times.',
      pWorld: 'By hand: out to the world',
      pWorldHint: 'Continued: the bridge\'s address, a default route, ip_forward and masquerade, to the gateway.',
      pForgotUp: 'Forgot up',
      pForgotUpHint: 'Everything is wired, but veth2-br is down: the ping stops there.',
      pForgotFwd: 'Forgot ip_forward',
      pForgotFwdHint: 'Route and NAT are there, but the host does not forward: the packet stops at the bridge.',
      pEngine: 'A container engine',
      pEngineHint: 'The same picture as a container engine wires it for you: a bridge, a veth pair per container, a /16 and NAT.',
      showArp: 'ARP and MAC tables',
      showArpHint: 'Shows every namespace\'s ARP table and the bridge\'s MAC table.',
      // legend
      legNs: 'network namespace',
      legUp: 'interface up',
      legDown: 'down',
      legCable: 'veth pair',
      legBridge: 'bridge',
      legRoute: 'route to its gateway',
      legPath: 'packet path, ✗ where it stopped',
      legChanged: 'changed',
      // the command strip
      sideHost: 'host · root',
      sideEngine: 'container engine',
      before: '(before the first command)',
      noOutput: '(nothing printed)',
      engineStart: 'starts',
      engineRun: 'starts container {ns}',
      engineSame: 'the same as these commands:',
      // the scene
      hostTitle: 'Host',
      hostKind: 'root namespace',
      nsKind: 'namespace',
      nsMissing: 'does not exist yet',
      gwTitle: 'Gateway',
      gwNote: 'outside the host; has a route only to 192.168.122.0/24',
      bridgeKind: 'bridge',
      noBridge: '(no bridge yet)',
      fdbTitle: 'MAC table:',
      fdbEmpty: 'empty',
      secRoutes: 'routes',
      secArp: 'ARP',
      noRoutes: 'no routes',
      arpEmpty: 'empty',
      arpFailed: 'FAILED',
      natNone: 'NAT: none',
      natOn: 'NAT: masquerade {src}',
      portTag: 'port of {br}',
      looseTag: 'not in a bridge',
      goneTo: 'moved to {ns}',
      up: 'up',
      down: 'down',
      // the ping line
      pingNone: '(no ping yet)',
      pingEarlier: 'last ping',
      pingOk: 'reply received',
      pingAt: 'at {at}',
      atGateway: 'the gateway',
      atNs: 'namespace {ns}',
      st_linkDown: 'link down',
      st_noRoute: 'no route',
      st_noArp: 'no ARP reply',
      st_notForwarded: 'not forwarded',
      st_noReturn: 'no return path',
      whereNs: 'in {ns}',
      whereHost: 'on the host',
      // captions: the start
      capStart: 'The host has `lo` and `enp1s0` with 192.168.122.57/24. Its [[default route]] leads to 192.168.122.1, the [[gateway]] outside the host.',
      'capGoal_by-hand': 'The goal: wire two network namespaces, ns1 and ns2, by hand until a ping from ns1 to ns2 gets a reply.',
      'capGoal_to-the-world': 'ns1 and ns2 are already joined by the bridge br0, and ns1 gets a reply from ns2. Now we try to reach the gateway outside the host.',
      'capGoal_forgot-up': 'Everything is wired as in the first example, except for one `up` that was left out.',
      'capGoal_forgot-forward': 'The bridge has its address, ns1 has a default route and a masquerade rule exists. Still the ping out does not get through.',
      'capGoal_container-view': 'A container engine does what we did by hand: a namespace, a veth pair, a bridge, a route, forwarding and NAT.',
      // captions: wiring
      capNetnsAdd: '{ns} is a new network namespace. It holds only `lo`, down and without an address: no routes, nothing of the host\'s.',
      capNetnsAdd2: 'The same for {ns}: its own `lo`, down, and nothing else.',
      capVethAdd: 'A new veth pair: {a} and {b} are the two ends of one cable. What goes into one end comes out of the other. Both ends were made on the host, so both are there, down.',
      capVethAdd2: 'A second veth pair, {a} and {b}, again with both ends on the host.',
      capMove: '{dev} was moved into {ns}: it disappeared from the host\'s view. An interface belongs to exactly one namespace at a time.',
      capMove2: '{dev} was moved into {ns}. Only the other end, {peer}, is left on the host, and the cable now runs from {ns} to the host.',
      capAddr: '{ns} has the address {addr} on {dev}. The interface is still down, so there is no route to {net} yet.',
      capAddrBridge: 'The bridge br0 has the address {addr}. That is the host\'s address on 10.0.0.0/24, and it will be the [[=gateway]] for ns1.',
      capUpNoPeer: '{dev} is up, and {ns} now has a route to {net}. The other end, {peer}, is still down, so the cable carries no frames (no carrier).',
      capUpBoth: '{dev} is up. Both ends of the cable work now, but {dev} is plugged into nothing: a loose end on the host.',
      capUpBridge: 'br0 is up. The bridge now forwards frames between its ports.',
      capUpPortFix: '{dev} is up, so the bridge br0 now uses it as a port.',
      capBridgeAdd: 'br0 is a bridge, a software switch in the host: it forwards frames between its ports by MAC address. Nothing is plugged into it yet.',
      capMaster: '{dev} is plugged into {br}: it is now a port of the bridge. A port needs no address of its own.',
      capMasterDown: '{dev} is plugged into {br}. Both host ends are now ports of the bridge, but br0 is still down and forwards nothing.',
      capRoute: 'ns1 has a default route via 10.0.0.1, the bridge\'s address: everything off its own subnet now goes to the host.',
      capFwdOn: 'The host now does [[forwarding]] between its interfaces, from br0 to enp1s0. `ip_forward` is 0 by default.',
      capFwdRead: '`ip_forward` is {v}: the host is not a router. A packet for someone else that reaches br0 stops there.',
      capNat: 'Masquerade: packets from {src} leaving through {oif} get the host\'s own address, 192.168.122.57, as their source. So the reply comes to the host, which hands it back to ns1.',
      capNatEngine: 'The masquerade rule covers everything from {src} that leaves by any interface other than br0.',
      capShowLinks: '`ip -br link show master br0` lists the bridge\'s ports: veth2-br is DOWN, so the bridge forwards nothing to it.',
      capShowRoutes: 'Inside c1 are the same two routes ns1 ended up with: the default via the bridge\'s address, and the connected route of its own subnet, which the kernel added.',
      capEngineStart: 'When it starts, the container engine does once what we did by hand: a bridge with the gateway address, `ip_forward=1`, and masquerade for its private /16.',
      capEngineRun: 'A new container {ns}: a new namespace, a veth pair with one end inside (`eth0`) and the other plugged into br0, the address {addr} and a default route via the bridge.',
      // captions: pings
      capPingLinkDownSelf: 'The ping stops at {dev} already: the interface is down, so {ns} has no route at all. Ping says `Network is unreachable`.',
      capPingLinkDown: 'The ping stops at {dev} {where}: the interface is down. The ARP request gets no further, so {from} reports `Destination Host Unreachable`.',
      capPingNoArp: '{from} asks by ARP who has {dst}. The request comes out at {at} on the host, which is plugged into nothing, and nobody answers. The two host ends are two loose cables.',
      capPingNoArpOther: 'Nobody answers the ARP request for {dst}: no one on that segment has the address.',
      capPingNoRoute: '{ns} has no route to {dst}: its only route is to its own subnet. Ping says `Network is unreachable`.',
      capWorldNote: 'ns1 getting a reply from ns2 does not mean the internet works: a route, forwarding and NAT are still missing.',
      capPingNotFwd: 'The packet reaches br0 and stops there: `ip_forward` is 0, so the host does not pass it on to enp1s0. No error comes back.',
      capPingNoReturn: 'The request leaves through enp1s0 with the source {src}. The gateway knows nothing about 10.0.0.0/24, so its reply never comes back. The ping gets no answer.',
      capPingOkL2: '{from} gets a reply from {to} through the bridge: ARP found the target\'s MAC address, and br0 learnt one MAC address on each port and forwarded the frames. Nothing was routed.',
      capPingOkOut: 'A reply from the gateway: the packet came in to the host at br0, the host forwarded it out of enp1s0 with the source changed to 192.168.122.57, and the reply found its way back.',
      capPingOk: 'A reply arrived.',
      capErr: 'The command failed and nothing changed.',
      explain: '<p>A container gets its network from four parts, and this page wires them by hand, one at a time. The first is ' +
        'the network namespace. Each has its own interfaces, addresses, routes, ARP table and firewall. A new one holds only ' +
        'the [[loopback]] <code>lo</code>, down. The second is the veth pair: two linked interfaces, like the two ends of a ' +
        'cable. Both are made on the host, and <code>ip link set … netns</code> moves one end into a namespace. A ' +
        '[[network interface]] belongs to one namespace only, and then disappears from the host\'s view.</p>' +
        '<p>The third is the bridge, a software switch in the host. The host ends of the cables are plugged into it with ' +
        '<code>master br0</code>, and it forwards frames by the MAC addresses it learns. All of this works only once every ' +
        'interface on the way is up. Then ns1 gets a reply from ns2, and the bridge needs no address for that.</p>' +
        '<p>The fourth is the way out. ns1 needs a [[default route]] via the bridge\'s address, the host must forward ' +
        '(<code>net.ipv4.ip_forward=1</code>), and the gateway knows nothing about 10.0.0.0/24, so the host must rewrite the ' +
        'source (masquerade) for the reply to come back. A ping shows the first step that fails, in this order: link down, no ' +
        'route, no ARP reply, not forwarded, no return path.</p>' +
        '<p>Common mistakes: a new namespace has a network by default (it has only a down <code>lo</code>); the bridge routes ' +
        '(it does not, it forwards frames); once ns1 gets a reply from ns2 the internet must work too (a route, forwarding and NAT ' +
        'are still needed). A container engine does all of this for you. Port publishing (DNAT), VLANs, IPv6 and the packet filter ' +
        'in depth are other pages.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
