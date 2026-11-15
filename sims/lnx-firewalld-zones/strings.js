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

      // the Windows flow (preset task win-firewall-profiles)
      scWin: 'Windows: profili vatrozida',
      wifi: 'Laptop je na Wi-Fi mreži',
      wifiOffice: 'ured',
      wifiHome: 'kuća',
      wifiCafe: 'kafić',
      vpn: 'VPN do ureda',
      vpnOff: 'U uredu nema VPN-a: kontroler domene dostupan je izravno.',
      wport: 'Pošiljatelj šalje',
      wportHint: 'Promjena odmah ponovno šalje isti paket.',
      pWinOffice: 'Ured: Domain',
      pWinHome: 'Kuća: Private',
      pWinCafe: 'Kafić: Public',
      pWinVpn: 'Kafić i VPN',
      wStage: 'Odabir profila vatrozida za mrežu na koju je laptop spojen',
      wColLeft: 'Mreže i paket',
      wColPick: 'Odabir profila',
      wColProfile: 'Profil',
      wHostPc12: 'kolega u uredu',
      wHostHomepc: 'kućno računalo',
      wHostGuest: 'gost u kafiću',
      wLaptop: 'Laptop',
      wMember: 'član domene',
      wNetOffice: 'uredska mreža',
      wNetHome: 'kućna mreža',
      wNetCafe: 'Wi-Fi u kafiću',
      wNetVpn: 'VPN do ureda',
      wNetOfficeTo: 'uredsku mrežu',
      wNetHomeTo: 'kućnu mrežu',
      wNetCafeTo: 'Wi-Fi u kafiću',
      wNetVpnTo: 'VPN do ureda',
      wDcYes: 'kontroler domene: dostupan',
      wDcNo: 'kontroler domene: nije dostupan',
      wCat: 'lokacija:',
      wCatNone: 'nije zadana (nova mreža)',
      wNotConnected: 'još nije spojen',
      wProfile: 'profil',
      wNoPacket: 'Prvo se laptop spaja na mrežu; paket dolazi poslije.',
      wNoPacketVpn: 'Laptop se spaja; paketi dolaze poslije.',
      wPickTitle: 'Profil za sučelje',
      wColCond: 'uvjet',
      wColProfileAct: 'profil',
      wRowDc: 'kroz sučelje je dostupan i provjeren kontroler domene',
      wRowPrivate: 'mreži je zadana lokacija Private',
      wRowPublic: 'mreži je zadana lokacija Public',
      wImplicit: 'nova, neprepoznata mreža',
      wMovesTitle: 'Spajanja',
      wMoveNext: 'slijedi',
      wMoveDone: 'spojen',
      wProfilesTitle: 'Profili',
      wActiveOn: 'aktivan na',
      wNoProfileYet: 'Profil još nije odabran: bira se kad se laptop spoji na mrežu.',
      wInbound: 'ulazno, bez pravila:',
      wOutbound: 'izlazno, bez pravila:',
      wBlock: 'blokiraj',
      wAllow: 'dopusti',
      wRulesTitle: 'Ulazna pravila',
      wNotHere: 'nije uključeno za ovaj profil',
      wRuleSmb: 'Dijeljenje datoteka i pisača (SMB-In)',
      wRuleEcho: 'Dijeljenje datoteka i pisača (Echo Request – ICMPv4-In)',
      wRuleRdp: 'Udaljena radna površina (TCP-In)',
      wSenderSees: 'Pošiljatelj vidi',
      wSmbOk: 'otvara se dijeljena mapa',
      wSmbFail: 'Mrežni put nije pronađen.',
      wRdpOk: 'otvara se prijava na udaljenu radnu površinu',
      wRdpFail: 'Nije moguće spojiti se s udaljenim računalom.',
      lgWDomain: 'Domain: mreža domene',
      lgWPrivate: 'Private: privatna mreža',
      lgWPublic: 'Public: javna mreža',
      wcIdle: 'Laptop {host} član je domene {domain}. Vatrozid ima tri profila, a profil ne ide uz računalo nego uz mrežu na koju se spoji. Pritisni → i spoji ga.',
      wcConnectDomain: '{adapter} se spaja na {net}. Kroz to sučelje dostupan je i provjeren kontroler domene {domain}: profil je {profile}.',
      wcConnectVpn: 'Kroz {adapter} je dostupan kontroler domene: to sučelje dobiva profil {profile}, {other} ostaje {otherProfile}.',
      wcConnectCategory: '{adapter} se spaja na {net}. Kontroler domene nije dostupan, a mreži je zadana lokacija {category}: profil je {profile}.',
      wcConnectNew: '{adapter} se spaja na novu, nepoznatu mrežu, {net}: kontroler domene nije dostupan, a lokacija još nije zadana. Windows je stavlja u profil {profile}.',
      wcArrived: '{who} šalje {what} na {dst}. Paket dolazi kroz {adapter}, a to sučelje ima profil {profile}: taj profil sudi paketu.',
      wcArrived2: 'Drugi paket, dok je Wi-Fi i dalje spojen: {who} šalje {what} na {dst} kroz {adapter}, koji ima profil {profile}.',
      wcRule: 'Pravilo {rule} ({spec}) uključeno je za profil {profile}: paket smije proći.',
      wcRuleOff: 'Pravilo {rule} postoji, ali je uključeno samo za {profiles}, ne za {profile}. Nijedno drugo pravilo ne odgovara: vrijedi zadana ulazna akcija, blokiraj.',
      wcRuleOffNew: 'Nova, nepoznata mreža: Windows je stavlja u profil {profile}, a pravilo {rule} ondje nije uključeno. Vrijedi zadana ulazna akcija, blokiraj.',
      wcNoRule: 'Nijedno pravilo ne odgovara: vrijedi zadana ulazna akcija profila {profile}, blokiraj.',
      wcAccept: 'Paket je propušten i pošiljatelj dobiva odgovor.',
      wcDrop: 'Blokiran paket Windows odbacuje bez odgovora: pošiljatelj čeka dok ne istekne vrijeme.',
      wcDropPublic: 'Blokiran paket Windows odbacuje bez odgovora: pošiljatelj čeka dok ne istekne vrijeme. Public je najstroži profil, a ne „otvorena” mreža.',
      wcTwoProfiles: 'Isti laptop u isto vrijeme ima dva profila: {a} je {pa}, {b} je {pb}.',

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
        '(simulator <i>Paket kroz netfilter</i>).</p>' +
        '<p><b>Windows: profili umjesto zona</b> (scenarij „Windows”). Vatrozid u Windowsima ima tri ' +
        '<i lang="en">firewall profile</i> (profil vatrozida): Domain, Private i Public, svaki sa svojim ulaznim pravilima i ' +
        'zadanom akcijom (ulazno blokiraj, izlazno dopusti). Profil se ne bira za paket nego za mrežnu vezu, kad se računalo ' +
        'spoji: ako je kroz to sučelje dostupan i provjeren <i lang="en">domain controller</i> (kontroler domene) domene ' +
        'kojoj računalo pripada, profil je Domain; inače vrijedi lokacija koju je mreža dobila (Private ili Public), a nova, ' +
        'neprepoznata mreža dobiva Public. Svako sučelje ima svoj profil, pa laptop u kafiću s VPN-om ima dva odjednom; ' +
        'paketu sudi profil sučelja kroz koje je ušao. Ulazno pravilo nabraja profile za koje je uključeno; paket koji ne ' +
        'propušta nijedno uključeno pravilo odbacuje se bez odgovora. Public nije „otvoreniji” profil nego najstroži. Ista ' +
        'ideja kao zona: skup pravila bira se prema tome odakle paket dolazi.</p>'
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

      scWin: 'Windows: firewall profiles',
      wifi: 'The laptop is on the Wi-Fi of',
      wifiOffice: 'office',
      wifiHome: 'home',
      wifiCafe: 'café',
      vpn: 'VPN to the office',
      vpnOff: 'No VPN in the office: the domain controller is reachable directly.',
      wport: 'The sender sends',
      wportHint: 'A change sends the same packet again at once.',
      pWinOffice: 'Office: Domain',
      pWinHome: 'Home: Private',
      pWinCafe: 'Café: Public',
      pWinVpn: 'Café and VPN',
      wStage: 'Choosing the firewall profile for the network the laptop is on',
      wColLeft: 'Networks and packet',
      wColPick: 'Profile choice',
      wColProfile: 'Profile',
      wHostPc12: 'colleague in the office',
      wHostHomepc: 'home PC',
      wHostGuest: 'guest in the café',
      wLaptop: 'Laptop',
      wMember: 'domain member',
      wNetOffice: 'office network',
      wNetHome: 'home network',
      wNetCafe: 'café Wi-Fi',
      wNetVpn: 'VPN to the office',
      wNetOfficeTo: 'the office network',
      wNetHomeTo: 'the home network',
      wNetCafeTo: 'the café Wi-Fi',
      wNetVpnTo: 'the VPN to the office',
      wDcYes: 'domain controller: reachable',
      wDcNo: 'domain controller: not reachable',
      wCat: 'location:',
      wCatNone: 'not set (new network)',
      wNotConnected: 'not connected yet',
      wProfile: 'profile',
      wNoPacket: 'The laptop joins the network first; the packet comes after.',
      wNoPacketVpn: 'The laptop is connecting; the packets come after.',
      wPickTitle: 'Profile for adapter',
      wColCond: 'condition',
      wColProfileAct: 'profile',
      wRowDc: 'a domain controller is reachable and authenticated through the adapter',
      wRowPrivate: 'the network was given the location Private',
      wRowPublic: 'the network was given the location Public',
      wImplicit: 'a new, unidentified network',
      wMovesTitle: 'Connections',
      wMoveNext: 'next',
      wMoveDone: 'connected',
      wProfilesTitle: 'Profiles',
      wActiveOn: 'active on',
      wNoProfileYet: 'No profile chosen yet: it is chosen when the laptop joins a network.',
      wInbound: 'inbound, no rule:',
      wOutbound: 'outbound, no rule:',
      wBlock: 'block',
      wAllow: 'allow',
      wRulesTitle: 'Inbound rules',
      wNotHere: 'not enabled for this profile',
      wRuleSmb: 'File and Printer Sharing (SMB-In)',
      wRuleEcho: 'File and Printer Sharing (Echo Request – ICMPv4-In)',
      wRuleRdp: 'Remote Desktop (TCP-In)',
      wSenderSees: 'The sender sees',
      wSmbOk: 'the shared folder opens',
      wSmbFail: 'The network path was not found.',
      wRdpOk: 'the remote desktop sign-in opens',
      wRdpFail: 'Cannot connect to the remote computer.',
      lgWDomain: 'Domain: domain network',
      lgWPrivate: 'Private: private network',
      lgWPublic: 'Public: public network',
      wcIdle: 'Laptop {host} is a member of domain {domain}. The firewall has three profiles, and a profile goes with the network it joins, not with the computer. Press → to connect it.',
      wcConnectDomain: 'The {adapter} adapter joins {net}. A domain controller of {domain} is reachable and authenticated through it: the profile is {profile}.',
      wcConnectVpn: 'The domain controller is reachable through the {adapter}: that adapter gets the {profile} profile, the {other} stays {otherProfile}.',
      wcConnectCategory: 'The {adapter} adapter joins {net}. No domain controller is reachable, and the network was given the location {category}: the profile is {profile}.',
      wcConnectNew: 'The {adapter} adapter joins a new, unknown network, {net}: no domain controller is reachable and no location is set yet. Windows puts it in the {profile} profile.',
      wcArrived: '{who} sends {what} to {dst}. The packet comes in on the {adapter} adapter, which has the {profile} profile: that profile judges the packet.',
      wcArrived2: 'A second packet, with the Wi-Fi still connected: {who} sends {what} to {dst} through the {adapter} adapter, which has the {profile} profile.',
      wcRule: 'Rule {rule} ({spec}) is enabled for the {profile} profile: the packet may pass.',
      wcRuleOff: 'Rule {rule} exists, but it is enabled only for {profiles}, not for {profile}. No other rule matches: the default inbound action applies, block.',
      wcRuleOffNew: 'A new, unknown network: Windows puts it in the {profile} profile, where rule {rule} is not enabled. The default inbound action applies, block.',
      wcNoRule: 'No rule matches: the default inbound action of the {profile} profile applies, block.',
      wcAccept: 'The packet is let in and the sender gets an answer.',
      wcDrop: 'Windows drops a blocked packet without a reply: the sender waits until it times out.',
      wcDropPublic: 'Windows drops a blocked packet without a reply: the sender waits until it times out. Public is the strictest profile, not an "open" network.',
      wcTwoProfiles: 'One laptop has two profiles at the same time: {a} is {pa}, {b} is {pb}.',

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
        '<code>input</code> hook (the <i>A packet through netfilter</i> simulator).</p>' +
        '<p><b>Windows: profiles instead of zones</b> (the "Windows" scenario). The Windows firewall has three firewall ' +
        'profiles, Domain, Private and Public, each with its own inbound rules and default actions (inbound block, outbound ' +
        'allow). A profile is chosen not per packet but per network connection, when the computer joins: if a domain ' +
        'controller of the domain the computer belongs to is reachable and authenticated through that adapter, the profile ' +
        'is Domain; otherwise the location the network was given applies (Private or Public), and a new, unidentified ' +
        'network gets Public. Each adapter has its own profile, so a laptop in a café with a VPN has two at once; a packet is ' +
        'judged by the profile of the adapter it came in on. An inbound rule lists the profiles it is enabled for; a packet ' +
        'that no enabled rule lets in is dropped without a reply. Public is not the "more open" profile but the strictest. ' +
        'The same idea as a zone: the rule set is picked by where the packet comes from.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
