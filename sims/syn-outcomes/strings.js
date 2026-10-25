/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of syn-outcomes, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   *word* is an English term in italics on the Croatian page (the page turns it into <em lang="en">), as the URM book
   writes *host* and *port*. Addresses, ports, flags and numbers are data, passed in as placeholders.
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijent ispituje portove jednim SYN-om; tijek poruka i tablica rezultata',

      // lanes and cards
      laneC: 'Klijent',
      laneF: 'Vatrozid',
      laneS: 'Poslužitelj',
      scanConnect: 'spaja se do kraja (ACK)',
      scanHalf: 'poluotvoreno (RST umjesto ACK-a)',
      fwHidden: 'Ima li ga i što propušta, klijent ne vidi.',
      fwNone: 'Na ovom putu nema vatrozida.',
      fwOff: 'Isključen: sve prolazi.',
      hostHidden: 'Što radi iza adrese, klijent ne vidi.',
      hostNone: 'Na ovoj adresi nema uređaja.',
      ruleElse: 'inače',
      actAllow: 'propusti',
      actDrop: 'odbaci',
      actIcmp: 'odbij (ICMP)',
      actRst: 'odbij (RST)',
      portListen: 'osluškuje',
      portNothing: 'ništa',
      portBlocked: 'blokiran',

      // chart words (at a receiver)
      reDropped: 'odbačen',
      reRejected: 'odbijen',
      reNoHost: 'nema uređaja',
      reForged: 'u ime hosta',
      cRetx: '↻ {k}',
      icmpWhy: 'zabranjeno',
      chartEmpty: 'Još ništa nije poslano.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],

      // results
      results: 'Rezultati',
      colReply: 'Odgovor',
      colProves: 'Dokazuje',
      colReally: 'Zapravo',
      pending: 'čeka',
      running: 'u tijeku…',
      replySynack: 'SYN+ACK',
      replyRst: 'RST+ACK',
      replyIcmp: 'ICMP 3/13',
      replyNone: ['ništa, ni nakon {n} ponovnog SYN-a', 'ništa, ni nakon {n} ponovna SYN-a', 'ništa, ni nakon {n} ponovnih SYN-ova'],
      vOpen: 'otvoren',
      vClosed: 'zatvoren',
      vFiltered: 'filtriran',
      provesApp: 'aplikacija prihvaća veze',
      provesTcp: 'host i njegov TCP sloj rade',
      provesFilter: 'filtar na putu ga je odbio',
      provesNothing: 'ništa određeno',
      reallySynack: 'aplikacija osluškuje',
      reallyRst: 'host, ništa ne osluškuje',
      reallyFwDrop: 'vatrozid odbacio; iza njega: {behind}',
      reallyFwIcmp: 'vatrozid odbio; iza njega: {behind}',
      reallyFwRst: 'RST poslao vatrozid; iza njega: {behind}',
      reallyNoHost: 'nema uređaja',
      behindListen: 'osluškuje',
      behindNothing: 'ništa ne osluškuje',

      // params and presets
      firewall: 'Vatrozid na putu',
      fwNothing: 'U ovom primjeru vatrozid ništa ne mijenja.',
      fwAction: 'Blokirani port vatrozid',
      fwActionOff: 'Vatrozid je isključen.',
      fwActionNone: 'Ovaj primjer sam bira radnju za svaki pokušaj.',
      optDrop: 'odbacuje',
      optIcmp: 'odbija ICMP-om',
      optRst: 'odbija RST-om',
      scan: 'Na SYN+ACK klijent',
      scanOptConnect: 'šalje ACK',
      scanOptHalf: 'šalje RST',
      reveal: 'Pokaži što klijent ne vidi',
      presetThree: 'Tri ishoda (knjiga)',
      presetThreeHint: 'Prema primjeru 2 iz knjige: tri poslužitelja, port 8080',
      presetCapture: 'Prava snimka',
      presetCaptureHint: 'Snimka iz knjige: web-poslužitelj, usmjernik, adresa bez uređaja',
      presetBehind: 'Iza vatrozida',
      presetBehindHint: 'Portovi 22, 80 i 8080 jednog hosta iza vatrozida',
      presetDrop: 'Odbaci ili odbij',
      presetDropHint: 'Isti blokirani port 22 tri puta, svaki put drugom radnjom',
      presetNoHost: 'Nema hosta',
      presetNoHostHint: 'Adresa na kojoj nema uređaja: tišina kao kod vatrozida',

      // legend
      legSeg: 'TCP segment (zastavice na oznaci)',
      legIcmp: 'ICMP poruka',
      legLost: 'nije stigao / bez odgovora',
      legRetx: 'ponovljeni SYN ↻',
      legTimer: 'brojač ponovnog slanja',
      legOpen: 'otvoren',
      legClosed: 'zatvoren',
      legFiltered: 'filtriran',
      legChanged: 'novo u ovom koraku',

      // captions
      ms: '{n} ms',
      sec: '{n} s',
      rule: 'pravilu {n}',
      ruleDefault: 'zadanom pravilu, koje vrijedi za sve ostalo',
      probes: ['{n} pokušaj', '{n} pokušaja', '{n} pokušaja'],
      capStart: 'Klijent ima {count}: {list}. Svaki počinje jednim SYN-om, a klijent zna samo ono što mu se vrati.',
      capStartHidden: 'Što stoji iza adresa, otkriva prekidač „Pokaži što klijent ne vidi”.',
      capStep: 'Korak {n}: ',
      capSyn: 'klijent šalje SYN na {target} (seq {x}).',
      capSynPass: 'Vatrozid ga propušta po {rule} i SYN stiže do *hosta*.',
      capSynHost: 'SYN stiže do *hosta*.',
      capSynSilent: 'klijent šalje SYN na {target} (seq {x}) i pokreće brojač od {rto}. Odgovor ne stiže.',
      capSynSilentCaptured: 'klijent šalje SYN na {target} (seq {x}). Odgovor ne stiže.',
      capWhyDrop: 'Vatrozid ga je tiho odbacio po {rule}.',
      capWhyNoHost: 'Na toj adresi nema uređaja, pa SYN nitko ne prima.',
      capWhyReject: 'Vatrozid ga po {rule} ne propušta i odgovara umjesto *hosta*.',
      capRetx: 'ni nakon {wait} nema odgovora, pa klijent šalje isti SYN ponovno (seq {x}).',
      capRetxNext: 'Sada čeka {rto}.',
      capLast: 'ni treći SYN nema odgovora. Tišina ne dokazuje ništa određeno: uređaja nema, ili je paket usput odbačen. Klijent odustaje: {v}.',
      capSynack: 'stiže SYN+ACK sa seq {y} i potvrdom {x1}: na *portu* {port} netko osluškuje.',
      capAck: 'klijent šalje ACK s potvrdom {y1} i veza je uspostavljena: {v}. SYN+ACK dokazuje da aplikacija na *portu* {port} prihvaća veze.',
      capAbort: 'klijent umjesto ACK-a šalje RST i prekida vezu prije nego je uspostavljena. Za presudu je dovoljan SYN+ACK: {v}.',
      capRst: 'odmah stiže RST+ACK s potvrdom {x1}. Za klijenta to znači: *host* postoji i njegov TCP sloj radi, ali na *portu* {port} ništa ne osluškuje: {v}.',
      capRstForged: 'Taj RST nije poslao *host*: vatrozid ga je složio u ime *hosta*, s istom adresom i istim brojevima. Iza vatrozida na *portu* {port}: {behind}.',
      capIcmp: 'odmah stiže ICMP *Destination Unreachable*, tip 3, kod 13: komunikacija je administrativno zabranjena. Poslao ga je vatrozid sa svoje adrese, pa klijent zna da ga je zaustavio filtar na putu: {v}. O *hostu* ne govori ništa.',

      explain:
        '<p>Prvi segment svake TCP veze, SYN, završava na jedan od tri načina. <b>SYN+ACK</b>: na tom <em lang="en">portu</em> aplikacija ' +
        'osluškuje i prihvaća vezu, pa je <em lang="en">port</em> <b>otvoren</b>. <b>RST</b>: segment je stigao do <em lang="en">hosta</em>, njegov TCP sloj ' +
        'nije našao nikoga tko osluškuje i sam je odgovorio resetom (RFC 9293: u stanju CLOSED na svaki segment osim RST-a ' +
        'odgovara se RST-om), pa je <em lang="en">port</em> <b>zatvoren</b>. <b>Tišina</b>: ni jedno ni drugo, ni nakon ponovljenih SYN-ova; ' +
        '<em lang="en">port</em> je <b>filtriran</b>.</p>' +
        '<p>Tišina ne dokazuje ništa određeno: uređaja na adresi nema, ili je paket usput tiho odbacio [[firewall]]. ' +
        'Zato „filtriran” govori o putu, ne o <em lang="en">hostu</em>. Iza vatrozida koji odbacuje može osluškivati poslužitelj. ' +
        'Vatrozid može i odbiti: porukom ICMP tip 3, kod 13 (administrativno zabranjeno), sa svoje adrese, ili RST-om ' +
        'u ime <em lang="en">hosta</em>. Takav RST izgleda isto kao pravi, pa blokirani <em lang="en">port</em> izgleda zatvoren.</p>' +
        '<p>Kad odgovor ne stiže, klijent isti SYN šalje ponovno: prvi put nakon 1 s, pa svaki put nakon dvostruko ' +
        'duljeg čekanja (RFC 6298). Neki sustavi pokušaju šest puta, oko dvije minute (1 + 2 + … + 64 = 127 s), drugi ' +
        'odustanu ranije; stranica pokazuje dva ponovna SYN-a. U snimci iz knjige ponovni SYN-ovi stižu oko 1 s jedan za drugim: neki sustavi prve ' +
        'ponavljaju u jednakim razmacima.</p>' +
        '<p>Skeniranje <em lang="en">portova</em> nije ništa drugo nego ovo isto, ponovljeno za mnogo <em lang="en">portova</em>. Poluotvoreno ' +
        'ispitivanje na SYN+ACK odgovara RST-om, pa se veza nikad ne uspostavi; za presudu je SYN+ACK dovoljan.</p>'
    },
    en: {
      stage: 'A client probes ports with one SYN each; the message flow and the results table',

      laneC: 'Client',
      laneF: 'Firewall',
      laneS: 'Server',
      scanConnect: 'connects all the way (ACK)',
      scanHalf: 'half-open (RST instead of ACK)',
      fwHidden: 'Whether there is one, and what it lets through, the client cannot see.',
      fwNone: 'There is no firewall on this path.',
      fwOff: 'Switched off: everything passes.',
      hostHidden: 'What runs behind the address, the client cannot see.',
      hostNone: 'There is no device at this address.',
      ruleElse: 'else',
      actAllow: 'allow',
      actDrop: 'drop',
      actIcmp: 'reject (ICMP)',
      actRst: 'reject (RST)',
      portListen: 'listening',
      portNothing: 'nothing',
      portBlocked: 'blocked',

      reDropped: 'dropped',
      reRejected: 'rejected',
      reNoHost: 'no device',
      reForged: 'in the host\'s name',
      cRetx: '↻ {k}',
      icmpWhy: 'prohibited',
      chartEmpty: 'Nothing sent yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],

      results: 'Results',
      colReply: 'Reply',
      colProves: 'Proves',
      colReally: 'Really',
      pending: 'waiting',
      running: 'running…',
      replySynack: 'SYN+ACK',
      replyRst: 'RST+ACK',
      replyIcmp: 'ICMP 3/13',
      replyNone: ['nothing, even after {n} repeated SYN', 'nothing, even after {n} repeated SYNs'],
      vOpen: 'open',
      vClosed: 'closed',
      vFiltered: 'filtered',
      provesApp: 'an application accepts connections',
      provesTcp: 'the host and its TCP layer work',
      provesFilter: 'a filter on the way refused it',
      provesNothing: 'nothing definite',
      reallySynack: 'an application listens',
      reallyRst: 'a host, nothing listening',
      reallyFwDrop: 'the firewall dropped it; behind it: {behind}',
      reallyFwIcmp: 'the firewall rejected it; behind it: {behind}',
      reallyFwRst: 'the firewall sent the RST; behind it: {behind}',
      reallyNoHost: 'no device',
      behindListen: 'listening',
      behindNothing: 'nothing listening',

      firewall: 'Firewall on the path',
      fwNothing: 'In this example the firewall changes nothing.',
      fwAction: 'A blocked port, the firewall',
      fwActionOff: 'The firewall is switched off.',
      fwActionNone: 'This example picks the action for each probe itself.',
      optDrop: 'drops',
      optIcmp: 'rejects with ICMP',
      optRst: 'rejects with RST',
      scan: 'On a SYN+ACK the client',
      scanOptConnect: 'sends ACK',
      scanOptHalf: 'sends RST',
      reveal: 'Show what the client cannot see',
      presetThree: 'Three outcomes (book)',
      presetThreeHint: 'After the book\'s example 2: three servers, port 8080',
      presetCapture: 'A real capture',
      presetCaptureHint: 'The book\'s capture: a web server, a router, an address with no device',
      presetBehind: 'Behind a firewall',
      presetBehindHint: 'Ports 22, 80 and 8080 of one host behind a firewall',
      presetDrop: 'Drop or reject',
      presetDropHint: 'The same blocked port 22 three times, with a different action each time',
      presetNoHost: 'No host',
      presetNoHostHint: 'An address with no device: silence, as with a firewall',

      legSeg: 'TCP segment (flags on the tag)',
      legIcmp: 'ICMP message',
      legLost: 'did not arrive / no answer',
      legRetx: 'repeated SYN ↻',
      legTimer: 'retransmission timer',
      legOpen: 'open',
      legClosed: 'closed',
      legFiltered: 'filtered',
      legChanged: 'new in this step',

      ms: '{n} ms',
      sec: '{n} s',
      rule: 'rule {n}',
      ruleDefault: 'the default rule, for everything else',
      probes: ['{n} probe', '{n} probes'],
      capStart: 'The client has {count}: {list}. Each starts with one SYN, and the client knows only what comes back.',
      capStartHidden: 'What stands behind the addresses, the switch “Show what the client cannot see” reveals.',
      capStep: 'Step {n}: ',
      capSyn: 'the client sends a SYN to {target} (seq {x}).',
      capSynPass: 'The firewall lets it through by {rule} and the SYN reaches the host.',
      capSynHost: 'The SYN reaches the host.',
      capSynSilent: 'the client sends a SYN to {target} (seq {x}) and starts a timer of {rto}. No answer comes.',
      capSynSilentCaptured: 'the client sends a SYN to {target} (seq {x}). No answer comes.',
      capWhyDrop: 'The firewall dropped it silently by {rule}.',
      capWhyNoHost: 'There is no device at that address, so nobody receives the SYN.',
      capWhyReject: 'By {rule} the firewall does not let it through, and answers instead of the host.',
      capRetx: 'still no answer after {wait}, so the client sends the same SYN again (seq {x}).',
      capRetxNext: 'Now it waits {rto}.',
      capLast: 'the third SYN gets no answer either. Silence proves nothing definite: there is no device, or the packet was dropped on the way. The client gives up: {v}.',
      capSynack: 'a SYN+ACK arrives with seq {y}, acknowledging {x1}: something listens on port {port}.',
      capAck: 'the client sends an ACK acknowledging {y1} and the connection is established: {v}. The SYN+ACK proves that an application on port {port} accepts connections.',
      capAbort: 'instead of an ACK the client sends an RST and drops the connection before it is established. The SYN+ACK is enough for the verdict: {v}.',
      capRst: 'an RST+ACK comes back at once, acknowledging {x1}. To the client this means: the host exists and its TCP layer works, but nothing listens on port {port}: {v}.',
      capRstForged: 'The host did not send this RST: the firewall made it in the host\'s name, with the same address and the same numbers. Behind the firewall, on port {port}: {behind}.',
      capIcmp: 'an ICMP Destination Unreachable comes back at once, type 3, code 13: communication administratively prohibited. The firewall sent it from its own address, so the client knows a filter on the way stopped it: {v}. It says nothing about the host.',

      explain:
        '<p>The first segment of every TCP connection, the SYN, ends in one of three ways. <b>SYN+ACK</b>: an ' +
        'application listens on that port and accepts the connection, so the port is <b>open</b>. <b>RST</b>: the ' +
        'segment reached the host, its TCP layer found nobody listening and answered with a reset itself (RFC 9293: in ' +
        'the CLOSED state every segment except an RST is answered with an RST), so the port is <b>closed</b>. ' +
        '<b>Silence</b>: neither, even after repeated SYNs; the port is <b>filtered</b>.</p>' +
        '<p>Silence proves nothing definite: there is no device at the address, or a [[firewall]] dropped the packet on ' +
        'the way without a word. So “filtered” is about the path, not the host. A server may listen behind a firewall ' +
        'that drops. A firewall can also reject: with an ICMP type 3, code 13 message (administratively prohibited) from ' +
        'its own address, or with an RST in the host\'s name. Such an RST looks the same as the real one, so a blocked ' +
        'port looks closed.</p>' +
        '<p>When no answer comes, the client sends the same SYN again: first after 1 s, then each time after twice the ' +
        'wait (RFC 6298). Some systems try six times, about two minutes (1 + 2 + … + 64 = 127 s), others give up sooner; the page shows ' +
        'two repeated SYNs. ' +
        'In the book\'s capture the repeated SYNs come about 1 s apart: some systems repeat the first ones at equal ' +
        'intervals.</p>' +
        '<p>Port scanning is nothing more than this, repeated over many ports. A half-open probe answers the SYN+ACK ' +
        'with an RST, so the connection is never established; the SYN+ACK is enough for the verdict.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
