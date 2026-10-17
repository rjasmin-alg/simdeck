/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of port-multiplexing, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node in captions: addresses, ports and protocols are shown as code). The title and
   subtitle come from sim.json. None of this page's terms (port, socket, multiplexing) is in kit/glossary.js yet, so the
   Croatian explanation writes the term rule out by hand and the page sets *port* and *socket* in italics in Croatian
   captions (NOTES.md, "Term pairs"). Addresses, ports, protocol names and flags are data, not words.
   nm* are program names inside a sentence (English needs the article), pg* the same names as labels. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijenti, poslužitelji, segment na putu i tablica socketa koja ga prima',
      // panel
      client: 'Otvori s računala',
      open: 'Otvori vezu',
      openFull: 'Tablica je puna ({n} veza): vrati postavke ili odaberi primjer.',
      forcePort: 'Izvorni port nove veze',
      fpAuto: 'OS bira',
      fpReuse: 'uvijek 51000',
      view: 'Tablica',
      viewServer: 'poslužitelja',
      viewClient: 'klijenta',
      pThree: 'Tri programa',
      pTabs: 'Dvije kartice',
      pMany: 'Više klijenata',
      pClash: 'Isti port dvaput',
      pQuic: 'TCP i UDP na 443',
      // legend
      lgListen: 'socket koji osluškuje',
      lgConn: 'veza (redak)',
      lgProg: 'program',
      lgSeg: 'segment',
      lgChanged: 'promijenjeno u ovom koraku',
      lgReject: 'odbijeno',
      // stage: hosts and programs
      clients: 'Klijenti',
      servers: 'Poslužitelji',
      server: 'Poslužitelj',
      pgBrowser: 'preglednik',
      pgTab: 'kartica {n}',
      pgSsh: 'SSH klijent',
      pgGame: 'igra',
      srvWeb: 'web-poslužitelj',
      srvSsh: 'SSH poslužitelj',
      srvGame: 'poslužitelj igre',
      nmBrowser: 'preglednik',
      nmTab: 'kartica {n}',
      nmSsh: 'SSH klijent',
      nmGame: 'igra',
      nmWeb: 'web-poslužitelj',
      nmSshd: 'SSH poslužitelj',
      nmGameSrv: 'poslužitelj igre',
      noConn: 'još bez veze',
      rejected: 'odbijeno',
      bound: 'vezan',
      // stage: the segment
      segTcp: 'TCP segment',
      segUdp: 'UDP datagram',
      segNone: 'Još nijedan segment na putu.',
      segIdle: 'U ovom koraku ništa ne putuje.',
      fProto: 'protokol',
      fSip: 'izvorni IP',
      fSport: 'izvorni port',
      fDip: 'odredišni IP',
      fDport: 'odredišni port',
      fFlag: 'zastavica',
      fData: 'podaci',
      noFlag: 'nema',
      // stage: the table (K4)
      tblServer: 'Tablica socketa poslužitelja {ip}',
      tblClient: 'Tablica socketa računala {ip}',
      colProto: 'protokol',
      colLip: 'lokalni IP',
      colLport: 'lokalni port',
      colRip: 'udaljeni IP',
      colRport: 'udaljeni port',
      colTakes: 'prima',
      colOwner: 'program',
      colBytes: 'bajtovi',
      colMark: 'ovaj segment',
      takesAny: 'sve',
      listenAct: 'nova veza',
      implicitText: 'nema socketa: TCP odgovara s RST, UDP s ICMP „port nedostupan”',
      markWin: 'odgovara',
      markSkip: 'nije čitano',
      outDeliver: 'predano',
      outNew: 'nova veza',
      outSame: 'isti par, ista veza',
      outRst: 'RST',
      outIcmp: 'ICMP',
      tagNew: '+ novi redak',
      noteNewSyn: 'stvorio ga je ovaj SYN',
      noteNewUdp: 'stvorio ga je ovaj datagram',
      tblEmpty: 'Još nema veza.',
      elsewhere: 'Ovaj segment stiže na {ip}; tamo se traži redak. Prebaci tablicu na „{side}”.',
      // captions
      c0Three: 'Računalo {host} ima tri programa: preglednik, SSH klijent i igru. Svaki će otvoriti svoju vezu, a sve tri dijele jednu IP adresu.',
      c0Tabs: 'Dvije kartice preglednika na {host} otvorit će svaka svoju vezu prema poslužitelju {dst}.',
      c0Many: 'Četiri klijenta otvorit će pet veza prema {dst}. Poslužitelj ima jedan socket koji osluškuje.',
      c0Clash: 'Kartica 1 na {host} otvorit će vezu s porta 51000. Što ako OS i kartici 2 dâ isti broj?',
      c0Quic: 'Preglednik na {host} otvorit će TCP vezu i UDP tok prema {dst}, oba s porta 51002.',
      cOpen: '{prog} na {host} otvara vezu: OS bira slobodan izvorni port {port} iz dinamičkog raspona i šalje SYN na {dst}.',
      cOpenForced: '{prog} na {host} otvara vezu: OS opet daje izvorni port {port} i šalje SYN na {dst}.',
      cOpenUdp: '{prog} na {host} šalje prvi UDP datagram s porta {port} na {dst}; UDP nema SYN.',
      rNewFirst: 'Tablica nema nijedne veze; socket koji osluškuje {lis} prima SYN, pa poslužitelj dodaje redak {n}.',
      rNew: 'Nijedna veza ne odgovara; socket koji osluškuje {lis} prima SYN, pa poslužitelj dodaje redak {n}.',
      rNewUdp: 'Nijedan redak ne odgovara; vezani socket {lis} prima datagram, a poslužiteljski program od sada vodi redak {n} za taj par.',
      dOwn: 'Svaka veza ima svoje redne brojeve i svoj prozor.',
      dPortAny: 'Obje veze idu na {dst}, ali s različitih portova ({a} i {b}). Par socketa se razlikuje u jednoj vrijednosti, pa su to dvije veze.',
      dPort: 'Obje kartice idu na {dst}, ali s različitih portova ({a} i {b}). Par socketa se razlikuje u jednoj vrijednosti, pa su to dvije veze.',
      dIp: 'Isti izvorni port {port}, ali s drugog računala ({a} i {b}): par socketa se razlikuje u udaljenoj adresi, pa su to dvije veze.',
      dProto: 'Isti brojevi kao redak {r}, ali drugi protokol ({a} i {b}): protokol je dio ključa, pa su to dva retka.',
      rSame: 'SYN odgovara retku {r} u svih pet vrijednosti. Isti par socketa je ista veza, a ne nova: poslužitelj ne dodaje redak, a {prog} ostaje bez veze.',
      rReject: 'Ništa ne odgovara, pa poslužitelj odgovara s {answer}.',
      answerIcmp: 'ICMP porukom „port nedostupan”',
      cSend: '{prog} šalje {bytes} B s {src} na {dst}.',
      rDeliver: 'Poslužitelj traži redak: redak {r} odgovara u svih pet vrijednosti, pa podatke dobiva {owner}.',
      rOnly: 'Redak {r} razlikuje se samo u {field}.',
      cReply: '{owner} odgovara: {src} → {dst}. Portovi su zamijenjeni: izvorni je sada {sport}.',
      rReplyNot: 'Odgovor stiže na {ip} s odredišnim portom {port}, pa ga OS predaje dalje: dobiva ga {prog}, a ne {other} na {oport}.',
      rReply: 'Odgovor stiže na {ip} s odredišnim portom {port}; redak {r} odgovara, pa ga dobiva {prog}.',
      cNoneSend: '{prog}: nema veze (njezin SYN nije otvorio novu vezu), pa nema što poslati.',
      cNoneReply: '{prog}: poslužitelj nema retka za tu vezu, pa nema čemu odgovoriti.',
      fieldProto: 'protokolu',
      fieldLip: 'lokalnoj adresi',
      fieldLport: 'lokalnom portu',
      fieldRip: 'udaljenoj adresi',
      fieldRport: 'udaljenom portu',
      explain: '<p>Paket koji stigne na računalo nosi odredišnu IP adresu, a ona kaže samo <b>na koje računalo</b> ide. ' +
        'Kojem programu pripada, kaže <i lang="en">port</i>: 16-bitni broj u zaglavlju transportnog sloja (TCP ili UDP). ' +
        '<i>Port</i> nije priključak u koji se utakne kabel; to je samo broj u zaglavlju. Razdvajanje prometa jedne adrese ' +
        'na više razgovora po <i>portu</i> je <b>multipleksiranje</b> (na strani primatelja demultipleksiranje).</p>' +
        '<p>Par (IP adresa, <i>port</i>) na jednoj strani je <i lang="en">socket</i>, a <b>veza</b> je par <i>socketa</i>, ' +
        'jedan na svakoj strani. S protokolom to je pet vrijednosti: protokol, lokalni IP i <i>port</i>, udaljeni IP i ' +
        '<i>port</i>. Kad segment stigne, OS ga traži u svojoj tablici: prvo veza kojoj odgovaraju svih pet vrijednosti; ' +
        'tek ako je nema, <i>socket</i> koji osluškuje (<code translate="no">LISTEN</code>), a on uzima samo SYN, početak nove veze; ' +
        'ako nema ni njega, TCP odgovara s RST, a UDP s ICMP porukom „<i>port</i> nedostupan”.</p>' +
        '<p>Zato poslužitelj može na jednom <i>portu</i> 443 voditi tisuće veza: sve imaju isti lokalni <i>socket</i>, a razlikuju se ' +
        'po udaljenom. Klijentov OS za svaku novu vezu bira slobodan <i>port</i> iz dinamičkog raspona 49152–65535 ' +
        '(sistemski su 0–1023, korisnički 1024–49151), pa se dvije kartice istog preglednika razlikuju po izvornom <i>portu</i>, ' +
        'a dva računala smiju koristiti isti broj jer im se razlikuje adresa. TCP 443 i UDP 443 su različiti <i>socketi</i>: ' +
        'protokol je dio ključa. Kad bi dva para bila potpuno ista, to bi bila jedna veza, a ne dvije.</p>' +
        '<p>Zablude: „poslužitelj na jednom <i>portu</i> poslužuje samo jednog klijenta”; „IP adresa sama kaže kojem programu idu ' +
        'podaci”; „<i>port</i> je utičnica na uređaju”.</p>'
    },
    en: {
      stage: 'Clients, servers, the segment on its way and the socket table that receives it',
      // panel
      client: 'Open from host',
      open: 'Open a connection',
      openFull: 'The table is full ({n} connections): reset the settings or pick a preset.',
      forcePort: 'Source port of a new connection',
      fpAuto: 'OS picks',
      fpReuse: 'always 51000',
      view: 'Table',
      viewServer: 'server',
      viewClient: 'client',
      pThree: 'Three programs',
      pTabs: 'Two tabs',
      pMany: 'Many clients',
      pClash: 'Same port twice',
      pQuic: 'TCP and UDP on 443',
      // legend
      lgListen: 'listening socket',
      lgConn: 'connection (row)',
      lgProg: 'program',
      lgSeg: 'segment',
      lgChanged: 'changed in this step',
      lgReject: 'rejected',
      // stage: hosts and programs
      clients: 'Clients',
      servers: 'Servers',
      server: 'Server',
      pgBrowser: 'browser',
      pgTab: 'tab {n}',
      pgSsh: 'SSH client',
      pgGame: 'game',
      srvWeb: 'web server',
      srvSsh: 'SSH server',
      srvGame: 'game server',
      nmBrowser: 'the browser',
      nmTab: 'tab {n}',
      nmSsh: 'the SSH client',
      nmGame: 'the game',
      nmWeb: 'the web server',
      nmSshd: 'the SSH server',
      nmGameSrv: 'the game server',
      noConn: 'no connection yet',
      rejected: 'rejected',
      bound: 'bound',
      // stage: the segment
      segTcp: 'TCP segment',
      segUdp: 'UDP datagram',
      segNone: 'No segment on its way yet.',
      segIdle: 'Nothing travels in this step.',
      fProto: 'protocol',
      fSip: 'source IP',
      fSport: 'source port',
      fDip: 'destination IP',
      fDport: 'destination port',
      fFlag: 'flag',
      fData: 'data',
      noFlag: 'none',
      // stage: the table (K4)
      tblServer: 'Socket table of server {ip}',
      tblClient: 'Socket table of host {ip}',
      colProto: 'protocol',
      colLip: 'local IP',
      colLport: 'local port',
      colRip: 'remote IP',
      colRport: 'remote port',
      colTakes: 'takes',
      colOwner: 'program',
      colBytes: 'bytes',
      colMark: 'this segment',
      takesAny: 'any',
      listenAct: 'new connection',
      implicitText: 'no socket: TCP answers with RST, UDP with ICMP port unreachable',
      markWin: 'matches',
      markSkip: 'not read',
      outDeliver: 'delivered',
      outNew: 'new connection',
      outSame: 'same pair, same connection',
      outRst: 'RST',
      outIcmp: 'ICMP',
      tagNew: '+ new row',
      noteNewSyn: 'made by this SYN',
      noteNewUdp: 'made by this datagram',
      tblEmpty: 'No connections yet.',
      elsewhere: 'This segment arrives at {ip}; the lookup happens there. Switch the table to "{side}".',
      // captions
      c0Three: 'Host {host} runs three programs: a browser, an SSH client and a game. Each will open its own connection, and all three share one IP address.',
      c0Tabs: 'Two browser tabs on {host} will each open a connection to the server {dst}.',
      c0Many: 'Four clients will open five connections to {dst}. The server has one listening socket.',
      c0Clash: 'Tab 1 on {host} will open a connection from port 51000. What if the OS gives tab 2 the same number?',
      c0Quic: 'The browser on {host} will open a TCP connection and a UDP flow to {dst}, both from port 51002.',
      cOpen: '{prog} on {host} opens a connection: the OS picks a free source port {port} from the dynamic range and sends a SYN to {dst}.',
      cOpenForced: '{prog} on {host} opens a connection: the OS hands out source port {port} again and sends a SYN to {dst}.',
      cOpenUdp: '{prog} on {host} sends the first UDP datagram from port {port} to {dst}; UDP has no SYN.',
      rNewFirst: 'The table has no connection yet; the listening socket {lis} takes the SYN, so the server adds row {n}.',
      rNew: 'No connection matches; the listening socket {lis} takes the SYN, so the server adds row {n}.',
      rNewUdp: 'No row matches; the bound socket {lis} takes the datagram, and from now on the server program keeps row {n} for this pair.',
      dOwn: 'Each connection keeps its own sequence numbers and its own window.',
      dPortAny: 'Both connections go to {dst}, but from different ports ({a} and {b}). The pair of sockets differs in one value, so these are two connections.',
      dPort: 'Both tabs go to {dst}, but from different ports ({a} and {b}). The pair of sockets differs in one value, so these are two connections.',
      dIp: 'The same source port {port}, but from another host ({a} and {b}): the pair of sockets differs in the remote address, so these are two connections.',
      dProto: 'The same numbers as row {r}, but another protocol ({a} and {b}): the protocol is part of the key, so these are two rows.',
      rSame: 'The SYN matches row {r} in all five values. The same pair of sockets is the same connection, not a new one: the server adds no row, and {prog} is left without a connection.',
      rReject: 'Nothing matches, so the server answers with {answer}.',
      answerIcmp: 'an ICMP port unreachable message',
      cSend: '{prog} sends {bytes} B from {src} to {dst}.',
      rDeliver: 'The server looks for the row: row {r} matches in all five values, so {owner} gets the data.',
      rOnly: 'Row {r} differs only in the {field}.',
      cReply: '{owner} replies: {src} → {dst}. The ports are swapped: the source is now {sport}.',
      rReplyNot: 'The reply arrives at {ip} with destination port {port}, so the OS hands it to {prog}, not to {other} on {oport}.',
      rReply: 'The reply arrives at {ip} with destination port {port}; row {r} matches, so the OS hands it to {prog}.',
      cNoneSend: '{prog}: no connection (its SYN did not open a new one), so there is nothing to send.',
      cNoneReply: '{prog}: the server has no row for that connection, so there is nothing to reply to.',
      fieldProto: 'protocol',
      fieldLip: 'local address',
      fieldLport: 'local port',
      fieldRip: 'remote address',
      fieldRport: 'remote port',
      explain: '<p>A packet that reaches a host carries a destination IP address, and that only says <b>which host</b> it is for. ' +
        'Which program it belongs to is said by the <i>port</i>: a 16-bit number in the transport header (TCP or UDP). ' +
        'A port is not a connector you plug a cable into; it is only a number in the header. Splitting the traffic of one ' +
        'address into many conversations by port is <b>multiplexing</b> (demultiplexing on the receiving side).</p>' +
        '<p>The pair (IP address, port) on one side is a <i>socket</i>, and a <b>connection</b> is a pair of sockets, one on ' +
        'each side. With the protocol that is five values: protocol, local IP and port, remote IP and port. When a segment ' +
        'arrives, the OS looks it up in its table: first a connection that matches in all five values; only if there is ' +
        'none, a listening socket (<code translate="no">LISTEN</code>), which takes only a SYN, the start of a new connection; if ' +
        'there is none of those either, TCP answers with RST and UDP with an ICMP port unreachable message.</p>' +
        '<p>That is why a server can run thousands of connections on one port 443: they all share the same local socket ' +
        'and differ in the remote one. The client OS gives every new connection a free port from the dynamic range ' +
        '49152–65535 (system ports are 0–1023, user ports 1024–49151), so two tabs of one browser differ in their source ' +
        'port, and two hosts may use the same number because their addresses differ. TCP 443 and UDP 443 are different ' +
        'sockets: the protocol is part of the key. If two pairs were exactly the same, they would be one connection, not two.</p>' +
        '<p>Misconceptions: "a server can serve only one client per port"; "the IP address alone tells which program gets ' +
        'the data"; "a port is a physical connector on the device".</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
