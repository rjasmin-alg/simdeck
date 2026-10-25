/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dhcp-relay, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms
   missing from kit/glossary.js are written out this way (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). Message names (DHCPDISCOVER …), field names (giaddr,
   hops, yiaddr), device names (R1, R2, SW2), addresses and times are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Put DHCP poruka od klijenta preko posrednika do poslužitelja: uređaji na putu, poruke po segmentima i polja trenutne poruke',

      // params
      client: 'Gdje je novo računalo',
      plBranch: 'Podružnica',
      plSales: 'Prodaja',
      plAdmin: 'Uprava',
      relay: 'Usmjernik kao posrednik',
      relayNA: 'U Upravi nema usmjernika na putu: poslužitelj je u istoj podmreži.',
      server: 'Poslužitelj radi',

      // presets
      presetBranch: 'Podružnica',
      presetBranchHint: 'Primjer 2: R2 upisuje giaddr 192.168.1.113, klijent dobiva 192.168.1.116.',
      presetSales: 'Prodaja',
      presetSalesHint: 'Pitanje 11: posrednik je R1 na VLAN-u 10, giaddr 192.168.1.1.',
      presetSame: 'Ista podmreža',
      presetSameHint: 'Klijent u Upravi, uz poslužitelj: bez posrednika, giaddr ostaje 0.0.0.0.',
      presetNoRelay: 'Bez posrednika',
      presetNoRelayHint: 'Broadcast staje na R2: klijent ponavlja i na kraju uzima 169.254.x.x.',
      presetDown: 'Poslužitelj ne radi',
      presetDownHint: 'R2 prosljeđuje, ali odgovora nema: jedan poslužitelj je jedna točka kvara.',

      // legend
      legUnicast: 'unicast (jednom primatelju)',
      legBroadcast: 'broadcast (svima na segmentu)',
      legRelay: 'posrednik prepisuje',
      legLost: '✕ nije preuzeto',
      legBoundary: 'granica podmreže',
      legChanged: 'promijenjeno u ovom koraku',

      // lanes
      clientName: 'Novo računalo',
      serverName: 'DHCP poslužitelj',
      fIp: 'adresa',
      fMask: 'maska',
      fGw: 'pristupnik',
      fDns: 'DNS',
      none: '—',
      phINIT: 'bez adrese',
      phSELECTING: 'čeka ponudu',
      phREQUESTING: 'traži ponuđenu adresu',
      phBOUND: 'konfigurirano',
      phLINKLOCAL: 'lokalna adresa',
      relayBadge: 'posrednik',
      relayOffBadge: 'bez posrednika',
      relayTo: 'prosljeđuje na',
      relayOff: 'posredovanje isključeno',
      routes: 'usmjerava',
      transit: 'samo usmjerava',
      up: '▲ radi',
      down: '▼ ne radi',
      scopes: 'Blokovi adresa',

      // network strip
      netLabel: 'Mreža',
      segBranch: 'Podružnica',
      segSales: 'Prodaja',
      segAdmin: 'Uprava',
      segLink: 'veza',

      // chart
      chartEmpty: 'Još nije poslana nijedna poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      reRelay: 'preuzima',
      reNoFwd: 'ne prosljeđuje',
      reDown: 'ne radi',
      reScope: 'blok {scope}',
      reRecord: 'zapisuje',
      reAsks: 'traži je',
      reDone: 'konfigurirano',
      causeRetry: '{n}. put',
      noteLL: 'uzima 169.254.28.7',

      // field strip
      msgTitle: 'Na žici:',
      msgNone: 'Još nema poruke na žici.',
      msgLL: 'Nema poruke: klijent je odustao i sam si je dao adresu.',
      msgLost: '✕ nije preuzeta',
      fSrc: 'izvor',
      fDst: 'odredište',
      fCast: 'vrsta',
      castB: '*broadcast*',
      castU: '*unicast*',
      fO50: 'opcija 50 (tražena)',
      fO1: 'opcija 1 (maska)',
      fO3: 'opcija 3 (pristupnik)',
      fO6: 'opcija 6 (DNS)',

      // captions
      capStartBranch: 'Novo računalo na SW2 u Podružnici nema adresu. Poslužitelj 192.168.1.99 stoji u Upravi, iza R2 i R1. Pritisni →.',
      capStartSales: 'Novo računalo u Prodaji (VLAN 10) nema adresu. Poslužitelj 192.168.1.99 stoji u Upravi, iza R1. Pritisni →.',
      capStartAdmin: 'Novo računalo u Upravi nema adresu. Poslužitelj 192.168.1.99 stoji u istoj podmreži. Pritisni →.',
      capDiscover: 'Klijent još nema adresu, pa šalje {type} kao *broadcast*: od {src} na {dst}.',
      capRetry: 'Odgovora nema: klijent šalje {type} ponovno ({n}. put, u {t}).',
      capRequest: 'Klijent traži ponuđenu adresu {addr} od poslužitelja 192.168.1.99, opet kao *broadcast*: još je nema.',
      capTakes: 'Usmjernik ne prosljeđuje *broadcast*, ali {relay} na sučelju {ip} radi kao *relay agent* (posrednik) i preuzima poruku.',
      capNoRelay: '{relay} nema uključeno posredovanje: kao usmjernik ne prosljeđuje *broadcast*, pa poruka završava na sučelju {ip}. Poslužitelj ne zna za klijenta.',
      capRelayed: '{relay} kao *relay agent* (posrednik) upisuje svoju adresu {ip} u {giaddr}, povećava {hops} na 1 i šalje {type} kao *unicast* poslužitelju 192.168.1.99.',
      capRelayedAgain: '{relay} opet upisuje {ip} u {giaddr} i prosljeđuje poruku kao *unicast*.',
      capVia: 'R1 ga usmjerava kao svaki drugi *unicast*.',
      capScope: 'Poslužitelj vidi giaddr {ip} i nudi adresu iz bloka {scope} {net}, ne iz svoje podmreže.',
      capBind: 'Poslužitelj zapisuje {addr} za ovog klijenta i odgovara potvrdom.',
      capServerDown: 'Poslužitelj ne radi: poruka se gubi i odgovora nema.',
      capLocal: 'Poslužitelj je u istoj podmreži i čuje *broadcast* izravno. giaddr je 0.0.0.0, pa bira blok svog sučelja, {net}, i nudi {addr}.',
      capBindLocal: 'Poslužitelj zapisuje {addr} za ovog klijenta i odgovara potvrdom, opet bez posrednika.',
      capServerDownLocal: 'Poslužitelj ne radi: nitko ne odgovara.',
      capToRelay: 'Poslužitelj šalje {type} s yiaddr {addr} natrag na giaddr {ip}, port 67, kao *unicast*, ne kao *broadcast*.',
      capAckOpts: 'Uz adresu nosi opcije 1, 3 i 6: masku, pristupnik i DNS.',
      capDeliver: '{relay} predaje {type} na segment klijenta: na {dst} kao *broadcast*, jer je klijent postavio zastavicu BROADCAST.',
      capOfferLocal: 'Poslužitelj šalje DHCPOFFER s ponudom {addr} kao *broadcast* na {dst}.',
      capOfferTaken: 'Klijent uzima ponudu {addr}.',
      capDeliverAck: '{relay} predaje DHCPACK klijentu.',
      capConfigured: 'Klijent je konfiguriran: {addr}, maska {mask}, pristupnik {gw}, DNS {dns}.',
      capDnsElsewhere: 'DNS je u drugoj podmreži, u Upravi: do njega ide preko pristupnika.',
      capLinkLocal: 'Četiri pokušaja (0, 4, 12 i 28 s) bez odgovora: na {t} klijent sam sebi daje {ip} iz 169.254.0.0/16. S njom doseže samo svoj segment, bez pristupnika i DNS-a.',

      tS: '{v} s',

      explain:
        '<p>Klijent bez adrese šalje DHCPDISCOVER i DHCPREQUEST kao <em lang="en">broadcast</em>, s izvorom 0.0.0.0. ' +
        'Usmjernik <em lang="en">broadcast</em> ne prosljeđuje, pa bez pomoći poruka ne izlazi iz podmreže. Zato poslužitelj ' +
        'ne mora stajati u svakoj podmreži: usmjernik na granici radi kao <em lang="en">relay agent</em> (posrednik).</p>' +
        '<p>Posrednik preuzme <em lang="en">broadcast</em> na svom sučelju, u polje <code translate="no">giaddr</code> upiše adresu ' +
        'tog sučelja (samo ako je polje 0), poveća <code translate="no">hops</code> i pošalje poruku poslužitelju kao ' +
        '<em lang="en">unicast</em> na port 67. Poslužitelj po <code translate="no">giaddr</code> bira blok adresa: ' +
        '192.168.1.113 je u 192.168.1.112/28, pa nudi adresu Podružnice, ne svoje Uprave. Odgovor šalje natrag na ' +
        '<code translate="no">giaddr</code>, a posrednik ga preda na segment klijenta, na port 68.</p>' +
        '<p>Odgovor ide kao <em lang="en">broadcast</em> jer je klijent postavio zastavicu BROADCAST, kao na slici u knjizi; bez nje ' +
        'bi ga posrednik poslao izravno na ponuđenu adresu. DHCPACK nosi i [[option]] 1 (maska), 3 (pristupnik) i 6 (DNS); DNS ' +
        'smije biti u drugoj podmreži.</p>' +
        '<p>Česte zablude: da poslužitelj mora biti u svakoj podmreži; da dijeli adrese iz svoje podmreže; da je posrednik ' +
        'poseban uređaj. Posrednik je usmjernik koji ionako stoji na granici, s jednom postavkom više: adresom poslužitelja.</p>' +
        '<p>Cijena jednog poslužitelja: kad on ne radi, nijedna podmreža iza posrednika ne dobiva nove adrese. Klijent ponavlja ' +
        'DHCPDISCOVER nakon 4, 8 i 16 s (pravi klijent još doda do ±1 s), a ovdje nakon trećeg ponavljanja sam sebi uzme ' +
        'adresu iz 169.254.0.0/16, s kojom doseže samo vlastiti segment. Kada točno odustaje, ovisi o sustavu.</p>' +
        '<p>Pojednostavljeno: put od posrednika do poslužitelja je jedan korak, iako u Podružnici prolazi i kroz R1; poruke ' +
        'ne troše vrijeme; izvorna adresa proslijeđene poruke je adresa sučelja posrednika (sustavi se tu razlikuju).</p>' +
        '<p>Izvori: Uvod u računalne mreže, pogl. 14 (Primjer 2, pitanje 11) i pogl. 12; RFC 2131, RFC 1542, RFC 2132, RFC 3927.</p>'
    },

    en: {
      stage: 'DHCP messages from the client through the relay to the server: devices on the path, messages per segment and the fields of the current message',

      // params
      client: 'Where the new computer is',
      plBranch: 'Branch',
      plSales: 'Sales',
      plAdmin: 'Management',
      relay: 'Router acts as relay',
      relayNA: 'In Management there is no router on the path: the server is on the same subnet.',
      server: 'Server is up',

      // presets
      presetBranch: 'Branch',
      presetBranchHint: 'Example 2: R2 writes giaddr 192.168.1.113, the client gets 192.168.1.116.',
      presetSales: 'Sales',
      presetSalesHint: 'Question 11: the relay is R1 on VLAN 10, giaddr 192.168.1.1.',
      presetSame: 'Same subnet',
      presetSameHint: 'Client in Management, next to the server: no relay, giaddr stays 0.0.0.0.',
      presetNoRelay: 'No relay',
      presetNoRelayHint: 'The broadcast stops at R2: the client retries and ends with 169.254.x.x.',
      presetDown: 'Server down',
      presetDownHint: 'R2 forwards, but nothing comes back: one server is one point of failure.',

      // legend
      legUnicast: 'unicast',
      legBroadcast: 'broadcast',
      legRelay: 'relay rewrites',
      legLost: '✕ not taken',
      legBoundary: 'subnet boundary',
      legChanged: 'changed in this step',

      // lanes
      clientName: 'New computer',
      serverName: 'DHCP server',
      fIp: 'address',
      fMask: 'mask',
      fGw: 'gateway',
      fDns: 'DNS',
      none: '—',
      phINIT: 'no address',
      phSELECTING: 'waiting for an offer',
      phREQUESTING: 'asking for the offer',
      phBOUND: 'configured',
      phLINKLOCAL: 'link-local only',
      relayBadge: 'relay',
      relayOffBadge: 'no relay',
      relayTo: 'forwards to',
      relayOff: 'relay switched off',
      routes: 'routes',
      transit: 'routes only',
      up: '▲ up',
      down: '▼ down',
      scopes: 'Address blocks',

      // network strip
      netLabel: 'Network',
      segBranch: 'Branch',
      segSales: 'Sales',
      segAdmin: 'Management',
      segLink: 'link',

      // chart
      chartEmpty: 'No message sent yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      reRelay: 'takes it',
      reNoFwd: 'does not forward',
      reDown: 'down',
      reScope: 'block {scope}',
      reRecord: 'records it',
      reAsks: 'asks for it',
      reDone: 'configured',
      causeRetry: 'try {n}',
      noteLL: 'takes 169.254.28.7',

      // field strip
      msgTitle: 'On the wire:',
      msgNone: 'Nothing on the wire yet.',
      msgLL: 'No message: the client gave up and gave itself an address.',
      msgLost: '✕ not taken',
      fSrc: 'source',
      fDst: 'destination',
      fCast: 'kind',
      castB: 'broadcast',
      castU: 'unicast',
      fO50: 'option 50 (requested)',
      fO1: 'option 1 (mask)',
      fO3: 'option 3 (router)',
      fO6: 'option 6 (DNS)',

      // captions
      capStartBranch: 'A new computer on SW2 in the branch has no address. The server 192.168.1.99 is in Management, behind R2 and R1. Press →.',
      capStartSales: 'A new computer in Sales (VLAN 10) has no address. The server 192.168.1.99 is in Management, behind R1. Press →.',
      capStartAdmin: 'A new computer in Management has no address. The server 192.168.1.99 is on the same subnet. Press →.',
      capDiscover: 'The client has no address yet, so it sends {type} as broadcast: from {src} to {dst}.',
      capRetry: 'No answer: the client sends {type} again (try {n}, at {t}).',
      capRequest: 'The client asks the server 192.168.1.99 for the offered address {addr}, again as broadcast: it does not have it yet.',
      capTakes: 'A router does not forward broadcasts, but {relay} on its interface {ip} acts as relay agent and takes the message.',
      capNoRelay: '{relay} has no relay configured: as a router it does not forward broadcasts, so the message ends at its interface {ip}. The server never hears of the client.',
      capRelayed: '{relay}, the relay agent, writes its address {ip} into {giaddr}, sets {hops} to 1 and sends {type} as unicast to the server 192.168.1.99.',
      capRelayedAgain: '{relay} again writes {ip} into {giaddr} and forwards the message as unicast.',
      capVia: 'R1 routes it like any other unicast.',
      capScope: 'The server sees giaddr {ip} and offers an address from the {scope} block {net}, not from its own subnet.',
      capBind: 'The server records {addr} for this client and answers with an acknowledgement.',
      capServerDown: 'The server is down: the message is lost and nothing comes back.',
      capLocal: 'The server is on the same subnet and hears the broadcast directly. giaddr is 0.0.0.0, so it picks the block of its own interface, {net}, and offers {addr}.',
      capBindLocal: 'The server records {addr} for this client and answers with an acknowledgement, again without a relay.',
      capServerDownLocal: 'The server is down: nobody answers.',
      capToRelay: 'The server sends {type} with yiaddr {addr} back to giaddr {ip}, port 67, as unicast, not as broadcast.',
      capAckOpts: 'Besides the address it carries options 1, 3 and 6: mask, gateway and DNS.',
      capDeliver: '{relay} delivers {type} on the client\'s segment: to {dst} as broadcast, because the client set the BROADCAST flag.',
      capOfferLocal: 'The server sends DHCPOFFER with the offer {addr} as broadcast to {dst}.',
      capOfferTaken: 'The client takes the offer {addr}.',
      capDeliverAck: '{relay} delivers the DHCPACK to the client.',
      capConfigured: 'The client is configured: {addr}, mask {mask}, gateway {gw}, DNS {dns}.',
      capDnsElsewhere: 'DNS is on another subnet, in Management: reached through the gateway.',
      capLinkLocal: 'Four tries (0, 4, 12 and 28 s) without an answer: at {t} the client gives itself {ip} from 169.254.0.0/16. It reaches only its own segment, with no gateway and no DNS.',

      tS: '{v} s',

      explain:
        '<p>A client without an address sends DHCPDISCOVER and DHCPREQUEST as broadcast, from 0.0.0.0. A router does not ' +
        'forward broadcasts, so on its own the message never leaves the subnet. That is why the server need not sit on every ' +
        'subnet: the router at the boundary acts as a relay agent.</p>' +
        '<p>The relay takes the broadcast on its interface, writes that interface\'s address into <code translate="no">giaddr</code> ' +
        '(only if the field is 0), increments <code translate="no">hops</code> and sends the message to the server as unicast, ' +
        'port 67. The server picks the address block by <code translate="no">giaddr</code>: 192.168.1.113 is in 192.168.1.112/28, ' +
        'so it offers a branch address, not one from its own Management subnet. It sends the answer back to ' +
        '<code translate="no">giaddr</code>, and the relay delivers it on the client\'s segment, to port 68.</p>' +
        '<p>The answer is a broadcast because the client set the BROADCAST flag, as the book draws it; without the flag the ' +
        'relay would send it straight to the offered address. DHCPACK also carries [[option]] 1 (mask), 3 (router) and 6 ' +
        '(DNS); the DNS server may be on another subnet.</p>' +
        '<p>Common mistakes: that the server must sit on every subnet; that it hands out addresses from its own subnet; that ' +
        'the relay is a special box. The relay is the router already at the boundary, with one more setting: the server\'s ' +
        'address.</p>' +
        '<p>The price of one server: while it is down, no subnet behind a relay gets new addresses. The client repeats ' +
        'DHCPDISCOVER after 4, 8 and 16 s (a real client adds up to ±1 s), and here after the third retry it gives itself an ' +
        'address from 169.254.0.0/16, which reaches only its own segment. When exactly a client gives up depends on the ' +
        'system.</p>' +
        '<p>Simplified: the way from the relay to the server is one step, though in the branch it also passes R1; messages ' +
        'take no time; the source address of the relayed message is the relay\'s interface (systems differ here).</p>' +
        '<p>Sources: <span translate="no">Uvod u računalne mreže</span>, ch. 14 (Example 2, question 11) and ch. 12; RFC 2131, RFC 1542, RFC 2132, RFC 3927.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
