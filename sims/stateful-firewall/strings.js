/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of stateful-firewall, in both languages (docs/sim-ui.md §9). Croatian is the original (the
   URM book's fragment vatrozid.html and chapter 18); English is written for simdeck. Croatian terms follow the book:
   vatrozid, filtriranje paketa, bez stanja / sa stanjem, tablica stanja, pravilo, odbij po zadanome, DMZ
   (demilitarizirana zona), zaštićena mreža, sučelje, izvorišni / odredišni port. kit/glossary.js has "firewall"
   (vatrozid) and "ACL" but none of the others, so the pairs are written out in both tables and listed in NOTES.md.
   Addresses, ports, protocol names and rule numbers are data, not words: the page puts them in translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Internet, vatrozid s tri sučelja, DMZ i zaštićena mreža; paket ovog koraka i odluka vatrozida; ' +
        'pravila vatrozida i tablica stanja',
      kind: 'Vrsta vatrozida',
      kindStateless: 'Bez stanja',
      kindStateful: 'Sa stanjem',
      returnRule: 'Zasebno pravilo za povratni smjer',
      returnRuleHint: 'Pravilo 4: dolazni promet s izvorišnog porta usluge propušta se prema zaštićenoj mreži',
      proto: 'Klijent pita',
      protoTcp: 'web, TCP 443',
      protoUdp: 'DNS, UDP 53',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 18, Primjer 5. Vatrozid je bez stanja. Prođe li poslužiteljev odgovor, iako je ' +
        'klijent sam zatražio vezu?',
      presetStateful: 'Sa stanjem',
      presetStatefulHint: 'Isti promet, vatrozid sa stanjem. Što se mijenja na drugom koraku, i po čemu vatrozid ' +
        'prepozna odgovor?',
      presetReturn: 'Pravilo za povratni smjer',
      presetReturnHint: 'Vatrozid bez stanja dobiva zasebno pravilo za odgovor. Odgovor sad prolazi; a paket u ' +
        'trećem koraku, koji nitko nije tražio?',
      presetUdp: 'DNS upit, UDP',
      presetUdpHint: 'Klijent šalje DNS upit UDP-om, a UDP nema vezu. Prepozna li vatrozid sa stanjem odgovor? ' +
        'A vatrozid bez stanja?',
      presetDmz: 'DMZ prema unutra',
      presetDmzHint: 'Poslužitelj u DMZ-u otvara vezu prema računalu u zaštićenoj mreži. Zaobilazi li pritom vatrozid?',
      legendAllow: 'propušten',
      legendDeny: 'odbačen',
      legendHit: 'odlučilo',
      legendNew: 'novi zapis',
      internet: 'internet',
      dmz: 'DMZ',
      protectedNet: 'zaštićena mreža',
      firewall: 'vatrozid',
      routing: 'usmjeravajući',
      iface: 'sučelje {n}',
      client: 'klijent',
      webServer: 'web poslužitelj',
      dnsServer: 'DNS poslužitelj',
      stranger: 'netko izvana',
      dmzWeb: 'javni web poslužitelj',
      roleSrc: 'šalje',
      roleDst: 'prima',
      packet: 'paket',
      noPacket: 'Još nema paketa.',
      ifaces: 'ulazi na sučelje {a}, izlazi na sučelje {b}',
      ifacesDrop: 'ulazi na sučelje {a}, za sučelje {b}',
      verdictRule: 'propušten: pravilo {n}',
      verdictState: 'propušten: tablica stanja, zapis {n}',
      verdictDeny: 'odbačen: nijedno pravilo ne odgovara',
      rulesTitle: 'Pravila vatrozida, redom: odlučuje prvo koje odgovara',
      ruleAllow: 'dopusti',
      ruleDport: 'odredišni port {p}',
      ruleSport: 'izvorišni port {p}',
      ruleDefault: 'inače: odbij (odbij po zadanome)',
      tagHit: 'odgovara, odlučuje',
      tagMiss: 'ne odgovara',
      tagSkipped: 'paket je u tablici stanja, pravila se ne čitaju',
      stateTitle: 'Tablica stanja',
      stateNone: 'Vatrozid bez stanja nema tablicu stanja: svaki paket procjenjuje izolirano, prema pravilima.',
      stateEmpty: 'Tablica stanja je prazna: još nijedna veza nije propuštena.',
      stateCols: 'zapis · protokol · tko je otvorio vezu → prema kome',
      tagNew: 'novi zapis',
      tagUsed: 'paket pripada ovoj vezi',
      captionStart: 'Klijent {client} u zaštićenoj mreži pitat će {svc} na {srv}. Vatrozid je {kind}. Pritisni →.',
      captionStartStateless: 'bez stanja: svaki paket procjenjuje izolirano, prema pravilima',
      captionStartStateful: 'sa stanjem: pamti veze koje je propustio',
      svcWeb: 'web poslužitelj',
      svcDns: 'DNS poslužitelj',
      captionRequest: 'Klijent šalje zahtjev na {srv}. Odlazni promet na taj port dopušta pravilo {n}, pa ga vatrozid ' +
        'propušta.',
      captionRequestState: 'Vatrozid sa stanjem pritom vezu upisuje u tablicu stanja.',
      captionReplyDeny: 'Poslužiteljev odgovor stiže s {src}. Vatrozid bez stanja ne pamti da je klijent uopće ' +
        'poslao zahtjev: dolazni paket ne odgovara nijednom pravilu, pa ga odbacuje. Treba mu zasebno pravilo za ' +
        'povratni smjer.',
      captionReplyRule: 'Poslužiteljev odgovor stiže s {src}. Vatrozid bez stanja ne zna da je to odgovor, ali ' +
        'zasebno pravilo {n} dopušta dolazni promet s izvorišnog porta {port}, pa ga propušta.',
      captionReplyState: 'Poslužiteljev odgovor stiže s {src}. Vatrozid sa stanjem prepoznaje ga kao dio veze iz ' +
        'tablice stanja i propušta ga automatski, bez posebnog pravila za taj smjer.',
      captionUnsolDeny: 'Netko izvana šalje paket s {src} na klijentov port {dst}, a klijent ga nije tražio. Nijedno ' +
        'pravilo ga ne dopušta, pa ga vatrozid odbacuje.',
      captionUnsolDenyState: 'Netko izvana šalje paket s {src} na klijentov port {dst}, a klijent ga nije tražio. ' +
        'U tablici stanja nema te veze, a nijedno pravilo ga ne dopušta: vatrozid ga odbacuje.',
      captionUnsolHole: 'Netko izvana šalje paket s {src} na klijentov port {dst}, a klijent ga nije tražio. Pravilo ' +
        '{n} gleda samo izvorišni port {port}, pa propušta i ovaj paket: to pravilo je rupa.',
      captionToDmz: 'Netko izvana otvara vezu prema javnom web poslužitelju {dst} u DMZ-u. Pravilo {n} to dopušta: ' +
        'zato javni poslužitelji stoje ondje, a ne u zaštićenoj mreži.',
      captionDmzOut: 'Javni web poslužitelj iz DMZ-a otvara vezu prema {dst} u zaštićenoj mreži. Paket ne zaobilazi ' +
        'vatrozid: prolazi kroz njega, sa sučelja {a} na sučelje {b}, i nijedno pravilo ga ne dopušta, pa ga ' +
        'vatrozid odbacuje.',
      explain: '<p><strong>Vatrozid bez stanja</strong> (<em lang="en">stateless</em>, filtriranje paketa, ' +
        '<em lang="en">packet filtering</em>) svaki paket procjenjuje izolirano: čita pravila redom, prvo koje ' +
        'odgovara odlučuje, a paket kojem nijedno ne odgovara odbacuje (odbij po zadanome, <em lang="en">deny by ' +
        'default</em>). Ne pamti da je klijent poslao zahtjev, pa mu za odgovor treba zasebno pravilo, a to pravilo ' +
        'propušta svaki paket s tog <em lang="en">porta</em>, ne samo odgovor.</p>' +
        '<p><strong>Vatrozid sa stanjem</strong> (<em lang="en">stateful inspection</em>) vodi tablicu stanja s ' +
        'adresama, <em lang="en">portovima</em> i stanjem svake veze koju je propustio. Dolazni paket koji pripada ' +
        'takvoj vezi propušta bez posebnog pravila za taj smjer; paket koji ne pripada nijednoj ide na pravila.</p>' +
        '<p><strong>DMZ nije rupa u vatrozidu.</strong> Demilitarizirana zona čest je naziv za sučelje na ' +
        'usmjeravajućem vatrozidu slično sučelju na zaštićenoj strani, s jednom razlikom: promet između DMZ-a i ' +
        'zaštićene strane <strong>i dalje prolazi kroz vatrozid</strong> i može imati primijenjene zaštitne politike, ' +
        'baš kao promet prema internetu. DMZ je treće sučelje na istom uređaju, ne zaobilaznica oko njega. Javno ' +
        'dostupni poslužitelji (web, e-mail) obično stoje ondje upravo zato da kompromitacija jednog od njih ne znači ' +
        'izravan pristup zaštićenoj strani.</p>' +
        '<p>Ovdje pravila odlučuju po prvom podudaranju. Neki sustavi pravila rade drukčije: zabrana uvijek ' +
        'pobjeđuje, ili odlučuje najspecifičnije pravilo, ili paket prolazi niz zasebnih točaka provjere.</p>'
    },
    en: {
      stage: 'The internet, a firewall with three interfaces, the DMZ and the protected network; this step\'s packet ' +
        'and the firewall\'s decision; the firewall rules and the state table',
      kind: 'Firewall kind',
      kindStateless: 'Stateless',
      kindStateful: 'Stateful',
      returnRule: 'A separate rule for the return direction',
      returnRuleHint: 'Rule 4: inbound traffic from the service\'s source port is allowed to the protected network',
      proto: 'The client asks',
      protoTcp: 'web, TCP 443',
      protoUdp: 'DNS, UDP 53',
      presetBook: 'Example from the book',
      presetBookHint: 'Chapter 18, Example 5. The firewall is stateless. Does the server\'s reply get through, ' +
        'although the client asked for the connection itself?',
      presetStateful: 'Stateful',
      presetStatefulHint: 'The same traffic, a stateful firewall. What changes at step 2, and how does the firewall ' +
        'recognise the reply?',
      presetReturn: 'Rule for the return direction',
      presetReturnHint: 'The stateless firewall gets a separate rule for the reply. The reply now passes; and the ' +
        'packet at step 3 that nobody asked for?',
      presetUdp: 'DNS query, UDP',
      presetUdpHint: 'The client sends a DNS query over UDP, and UDP has no connection. Does a stateful firewall ' +
        'recognise the reply? And a stateless one?',
      presetDmz: 'DMZ to the inside',
      presetDmzHint: 'A server in the DMZ opens a connection to a host in the protected network. Does it go around ' +
        'the firewall?',
      legendAllow: 'allowed',
      legendDeny: 'dropped',
      legendHit: 'decided',
      legendNew: 'new entry',
      internet: 'internet',
      dmz: 'DMZ',
      protectedNet: 'protected network',
      firewall: 'firewall',
      routing: 'routing',
      iface: 'interface {n}',
      client: 'client',
      webServer: 'web server',
      dnsServer: 'DNS server',
      stranger: 'someone outside',
      dmzWeb: 'public web server',
      roleSrc: 'sends',
      roleDst: 'receives',
      packet: 'packet',
      noPacket: 'No packet yet.',
      ifaces: 'in on interface {a}, out on interface {b}',
      ifacesDrop: 'in on interface {a}, for interface {b}',
      verdictRule: 'allowed: rule {n}',
      verdictState: 'allowed: state table, entry {n}',
      verdictDeny: 'dropped: no rule matches',
      rulesTitle: 'Firewall rules, in order: the first that matches decides',
      ruleAllow: 'allow',
      ruleDport: 'destination port {p}',
      ruleSport: 'source port {p}',
      ruleDefault: 'otherwise: deny (deny by default)',
      tagHit: 'matches, decides',
      tagMiss: 'does not match',
      tagSkipped: 'the packet is in the state table, the rules are not read',
      stateTitle: 'State table',
      stateNone: 'A stateless firewall has no state table: it judges every packet on its own, by the rules.',
      stateEmpty: 'The state table is empty: no connection has been allowed yet.',
      stateCols: 'entry · protocol · who opened the connection → to whom',
      tagNew: 'new entry',
      tagUsed: 'the packet belongs to this connection',
      captionStart: 'Client {client} in the protected network will ask the {svc} at {srv}. The firewall is {kind}. ' +
        'Press →.',
      captionStartStateless: 'stateless: it judges every packet on its own, by the rules',
      captionStartStateful: 'stateful: it remembers the connections it has let through',
      svcWeb: 'web server',
      svcDns: 'DNS server',
      captionRequest: 'The client sends a request to {srv}. Rule {n} allows outbound traffic to that port, so the ' +
        'firewall lets it through.',
      captionRequestState: 'The stateful firewall also writes the connection into its state table.',
      captionReplyDeny: 'The server\'s reply arrives from {src}. A stateless firewall does not remember that the ' +
        'client sent a request at all: the inbound packet matches no rule, so it is dropped. The firewall needs a ' +
        'separate rule for the return direction.',
      captionReplyRule: 'The server\'s reply arrives from {src}. The stateless firewall does not know it is a reply, ' +
        'but the separate rule {n} allows inbound traffic from source port {port}, so it lets it through.',
      captionReplyState: 'The server\'s reply arrives from {src}. The stateful firewall recognises it as part of a ' +
        'connection in its state table and lets it through by itself, with no rule for that direction.',
      captionUnsolDeny: 'Someone outside sends a packet from {src} to the client\'s port {dst}, and the client did ' +
        'not ask for it. No rule allows it, so the firewall drops it.',
      captionUnsolDenyState: 'Someone outside sends a packet from {src} to the client\'s port {dst}, and the client ' +
        'did not ask for it. The state table has no such connection, and no rule allows it: the firewall drops it.',
      captionUnsolHole: 'Someone outside sends a packet from {src} to the client\'s port {dst}, and the client did ' +
        'not ask for it. Rule {n} looks only at source port {port}, so it lets this packet through too: that rule is ' +
        'a hole.',
      captionToDmz: 'Someone outside opens a connection to the public web server {dst} in the DMZ. Rule {n} allows ' +
        'it: that is why public servers sit there, not in the protected network.',
      captionDmzOut: 'The public web server in the DMZ opens a connection to {dst} in the protected network. The ' +
        'packet does not go around the firewall: it goes through it, from interface {a} to interface {b}, and no ' +
        'rule allows it, so the firewall drops it.',
      explain: '<p>A <strong>stateless firewall</strong> (<em>packet filtering</em>) judges every packet on its own: ' +
        'it reads the rules in order, the first that matches decides, and a packet that matches none is dropped ' +
        '(<em>deny by default</em>). It does not remember that the client sent a request, so the reply needs a ' +
        'separate rule, and that rule lets through every packet from that <em>port</em>, not only the reply.</p>' +
        '<p>A <strong>stateful firewall</strong> (<em>stateful inspection</em>) keeps a state table with the ' +
        'addresses, <em>ports</em> and state of every connection it has let through. An inbound packet that belongs ' +
        'to such a connection passes with no rule for that direction; a packet that belongs to none goes to the ' +
        'rules.</p>' +
        '<p><strong>A DMZ is not a hole in the firewall.</strong> Demilitarised zone is a common name for an ' +
        'interface on a routing firewall that is like the interfaces on the protected side, with one difference: ' +
        'traffic between the DMZ and the protected side <strong>still goes through the firewall</strong> and can ' +
        'have protective policies applied, just like traffic to the internet. The DMZ is a third interface of the ' +
        'same device, not a way around it. Publicly reachable servers (web, e-mail) usually sit there precisely so ' +
        'that compromising one of them does not mean direct access to the protected side.</p>' +
        '<p>Here the rules decide by first match. Some rule systems work differently: a deny always wins, or the ' +
        'most specific rule decides, or a packet passes a series of separate checkpoints.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
