/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tcp-states, in both languages (docs/sim-ui.md §9). Croatian terms follow the URM book
   (ch. 13): stanje veze, trostruko rukovanje, redni broj, broj potvrde, zastavica, poluzatvorena veza, osluškivati.
   The glossary has none of them (NOTES.md, Term pairs), so the pairs are written out in the explanation. State names
   (ESTABLISHED, TIME-WAIT …), flags (SYN, FIN, ACK, RST), the user calls OPEN, SEND and CLOSE, numbers and the end
   names A and B are data: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dvije strane TCP veze, A i B: dijagram slijeda segmenata i dijagram stanja s trenutačnim stanjem svake strane',
      client: 'klijent',
      server: 'poslužitelj',
      sendsFrom: 'šalje od',
      expects: 'očekuje',
      diagramTitle: 'Stanja (RFC 9293, slika 5)',
      chartEmpty: 'Još nijedan segment.',
      earlier: ['↑ još {n} raniji red', '↑ još {n} ranija reda', '↑ još {n} ranijih redova'],
      dataChip: 'podaci',
      reFlight: 'u letu',
      reIgnored: 'odbačen',
      reHeld: 'ACK čeka',
      noteListen: 'OPEN pasivno',
      noteClose: 'CLOSE',
      noteRejected: '{call}: odbijeno',
      noteTimeout: '2×MSL prošlo',

      legendA: 'A, klijent',
      legendB: 'B, poslužitelj',
      legendSeg: 'segment',
      legendFlight: 'u letu',
      legendChanged: 'promijenjeno u ovom koraku',

      mode: 'Tijek',
      modeScript: 'scenarij',
      modeDrive: 'ti upravljaš',
      listen: 'B osluškuje (OPEN pasivno)',
      closer: 'Prvi zatvara',
      optA: 'A',
      optB: 'B',
      optBoth: 'obje',
      combine: 'ACK i FIN u jednom segmentu',
      combineHint: 'Druga strana potvrđuje FIN tek svojim FIN-om: segment i korak manje.',
      halfData: 'Podaci nakon FIN-a',
      halfDataFmt: '{n} × 100 B',
      bothNo: 'Kad obje strane zatvaraju odjednom, nitko ne šalje nakon FIN-a.',

      drive: 'Pozivi i mreža',
      dOpenPassive: 'OPEN pasivno',
      dOpenActive: 'OPEN aktivno',
      dSend: 'SEND 100 B',
      dClose: 'CLOSE',
      dDeliver: 'Dostavi najstariji',
      dLose: 'Izgubi najstariji',
      dTimeout: '2×MSL prođe',
      dNothing: 'Nijedan segment nije u letu.',
      dNoTw: 'Nijedna strana nije u TIME-WAIT.',
      dFull: 'Najviše {n} koraka: vrati se korak natrag ili kreni ispočetka.',

      presetBook: 'Otvori i zatvori',
      presetBookHint: 'Primjer 3 iz poglavlja 13 (X = 4000, Y = 9500). U kojim koracima A i B nisu u istom stanju?',
      presetServer: 'Poslužitelj zatvara',
      presetServerHint: 'Ovdje B prvi poziva CLOSE. Tko sada čeka u TIME-WAIT?',
      presetHalf: 'Poluzatvorena veza',
      presetHalfHint: 'A je gotov sa slanjem, B ima još 200 B. Smije li B slati nakon A-ova FIN-a, i prima li ih A?',
      presetSimul: 'Istodobno zatvaranje',
      presetSimulHint: 'Obje strane pozivaju CLOSE u istom koraku. Kroz koja stanja prolaze i tko čeka u TIME-WAIT?',
      presetClosed: 'Zatvoren port',
      presetClosedHint: 'Na B-u nitko ne osluškuje. Što B odgovara na SYN i što se događa s A?',
      presetDrive: 'Ti upravljaš',
      presetDriveHint: 'Pozivaj OPEN, SEND i CLOSE na objema stranama i dostavljaj segmente. Možeš li izvesti istodobno otvaranje?',

      capStart: 'Obje strane su u CLOSED: veze još nema. Stanje ima svaka strana za sebe, pa prati i A i B.',
      capStartClosed: 'Na B-ovu portu nitko ne osluškuje: B je u CLOSED. Što će A dobiti kad pošalje SYN?',
      capDriveStart: 'Ti upravljaš objema stranama: biraj poziv za A ili B, pa dostavi ili izgubi najstariji segment u letu. Nedopušten poziv se odbija.',
      capStep: 'Korak {n}:',
      evListen: '{e} poziva OPEN (pasivno) i ne šalje ništa.',
      evOpen: '{e} poziva OPEN (aktivno) i šalje {seg}.',
      evSend: '{e} poziva SEND i šalje {seg}.',
      evClose: '{e} poziva CLOSE i šalje {seg}.',
      evCloseQuiet: '{e} poziva CLOSE; veza još nije uspostavljena, pa ne šalje ništa.',
      evBoth: 'A i B pozivaju CLOSE u istom koraku: A šalje {segA}, B šalje {segB}, i FIN-ovi se mimoilaze.',
      evRejected: '{e} poziva {call} u stanju {state}: odbijeno, „{why}”. Ništa se ne mijenja i ništa se ne šalje.',
      whyNoConn: 'veza ne postoji',
      whyExists: 'veza već postoji',
      whyClosing: 'veza se zatvara',
      whyNotYet: 'veza još nije uspostavljena',
      evDeliver: '{e} prima {seg}.',
      evReply: 'Odgovara s {seg}.',
      evReset: '{e} nema tu vezu, pa odgovara s {seg}.',
      evHeld: 'Potvrdu ne šalje odmah: poslat će je sa svojim sljedećim segmentom.',
      evIgnored: 'Taj segment {e} ne očekuje, pa ga odbacuje bez odgovora.',
      evAcked: 'Potvrda je stigla; stanje se ne mijenja.',
      evLose: '{seg} od {from} izgubio se u mreži: {e} za njega ne zna, a {from} ostaje u {state}.',
      evTimeout: 'Prošlo je 2×MSL: po standardu 4 min (MSL = 2 min), na mnogim sustavima 60 s.',
      moved: '{e} prelazi u {state}:',
      movedBoth: 'A i B prelaze u {state}:',
      'm-both-close': 'nijedna strana više ne šalje, ali obje i dalje primaju.',
      'm-both-timeout': 'kod istodobnog zatvaranja kroz TIME-WAIT prolaze obje strane.',
      'm-open-passive': 'osluškuje i čeka nečiji SYN.',
      'm-open-active': 'čeka odgovor na svoj SYN.',
      'm-listen-close': 'više ne osluškuje.',
      'm-listen-syn': 'odgovorio je i čeka da {o} potvrdi njegov SYN.',
      'm-synsent-close': 'odustao je prije nego što je veza uspostavljena.',
      'm-synsent-syn': 'SYN-ovi su se mimoišli (istodobno otvaranje); čeka potvrdu svojeg SYN-a.',
      'm-synsent-synack': 'za {e} je veza uspostavljena, iako {o} to još ne zna.',
      'm-synsent-rst': 'veza je odbijena, jer na drugoj strani nitko ne osluškuje.',
      'm-synrcvd-ack': 'njegov SYN je potvrđen, pa je za {e} veza uspostavljena.',
      'm-synrcvd-close': 'više ne šalje, ali i dalje prima.',
      'm-synrcvd-rst': 'pokušaj je prekinut, pa se vraća osluškivanju.',
      'm-estab-close': 'više ne šalje, ali i dalje prima.',
      'm-estab-fin': '{o} više ne šalje, ali {e} smije slati dok ne pozove CLOSE.',
      'm-fw1-ack': 'njegov FIN je potvrđen; čeka FIN od {o}.',
      'm-fw1-fin': 'FIN-ovi su se mimoišli; čeka još potvrdu svojeg FIN-a.',
      'm-fw1-finack': 'FIN i potvrda njegova FIN-a stigli su u jednom segmentu, pa preskače FIN-WAIT-2 i čeka 2×MSL.',
      'm-fw2-fin': 'potvrdio je FIN od {o} i čeka 2×MSL da zakašnjeli segmenti nestanu iz mreže.',
      'm-closing-ack': 'njegov FIN je potvrđen; čeka 2×MSL da zakašnjeli segmenti nestanu iz mreže.',
      'm-cw-close': 'čeka potvrdu svojeg FIN-a.',
      'm-lastack-ack': 'njegov FIN je potvrđen i za {e} je veza gotova.',
      'm-tw-timeout': 'TIME-WAIT drži strana koja je poslala FIN prije nego što je primila tuđi, bio to klijent ili poslužitelj.',
      'm-rst': 'veza je prekinuta (RST).',
      viaEstab: 'Primljeni FIN potvrđuje i njegov SYN (ACK rukovanja izgubio se), pa {e} prolazi kroz ESTABLISHED u istom koraku.',

      explain:
        '<p><i>Connection state</i> (stanje veze) nije svojstvo veze nego <b>svake strane posebno</b>. RFC 9293 ih imenuje jedanaest ' +
        '(slika 5), a A i B su većinu vremena u različitima: A je u ESTABLISHED već kad primi SYN+ACK, B tek kad ' +
        'stigne A-ov ACK.</p>' +
        '<p><i>Three-way handshake</i> (trostruko rukovanje) vodi B iz LISTEN, a A iz SYN-SENT u ESTABLISHED. SYN i ' +
        'FIN zauzimaju po jedan <i>sequence number</i> (redni broj), pa je <i>acknowledgment number</i> (broj potvrde) ' +
        'za jedan veći: 4000 → 4001.</p>' +
        '<p>Zatvaranje nije rukovanje unatrag: to su dva neovisna FIN-a, po jedan u svakom smjeru. Nakon svojeg FIN-a ' +
        'strana više ne šalje, ali prima; druga smije slati dok ne pozove CLOSE. To je <i>half-closed connection</i> ' +
        '(poluzatvorena veza).</p>' +
        '<p>TIME-WAIT nije zaglavljen <i>socket</i>: drži ga strana koja je prva zatvorila, klijent ili poslužitelj, ' +
        '2×MSL (po standardu 4 min, na mnogim sustavima 60 s), da zakašnjeli segmenti stare veze nestanu iz mreže ' +
        'i da posljednji ACK može ponoviti ako se izgubi.</p>' +
        '<p>Strana bez veze (CLOSED) na svaki segment osim RST-a odgovara RST-om; zato A s pokušajem prema ' +
        'zatvorenom portu odmah završava u CLOSED. Ponovno slanje izgubljenih segmenata ovdje se ne prikazuje.</p>'
    },
    en: {
      stage: 'The two ends of a TCP connection, A and B: a sequence chart of the segments and a state diagram with each end\'s current state',
      client: 'client',
      server: 'server',
      sendsFrom: 'sends from',
      expects: 'expects',
      diagramTitle: 'States (RFC 9293, Figure 5)',
      chartEmpty: 'No segment yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      dataChip: 'data',
      reFlight: 'in flight',
      reIgnored: 'dropped',
      reHeld: 'ACK waits',
      noteListen: 'passive OPEN',
      noteClose: 'CLOSE',
      noteRejected: '{call}: rejected',
      noteTimeout: '2×MSL passed',

      legendA: 'A, client',
      legendB: 'B, server',
      legendSeg: 'segment',
      legendFlight: 'in flight',
      legendChanged: 'changed in this step',

      mode: 'Run',
      modeScript: 'scenario',
      modeDrive: 'you drive',
      listen: 'B listens (passive OPEN)',
      closer: 'Closes first',
      optA: 'A',
      optB: 'B',
      optBoth: 'both',
      combine: 'ACK and FIN in one segment',
      combineHint: 'The other end acknowledges the FIN only with its own FIN: one segment and one step fewer.',
      halfData: 'Data after the FIN',
      halfDataFmt: '{n} × 100 B',
      bothNo: 'When both ends close at once, nobody sends after the FIN.',

      drive: 'Calls and network',
      dOpenPassive: 'passive OPEN',
      dOpenActive: 'active OPEN',
      dSend: 'SEND 100 B',
      dClose: 'CLOSE',
      dDeliver: 'Deliver the oldest',
      dLose: 'Lose the oldest',
      dTimeout: '2×MSL passes',
      dNothing: 'No segment is in flight.',
      dNoTw: 'Neither end is in TIME-WAIT.',
      dFull: 'At most {n} steps: step back or start again.',

      presetBook: 'Open and close',
      presetBookHint: 'Example 3 of chapter 13 (X = 4000, Y = 9500). In which steps are A and B in different states?',
      presetServer: 'The server closes',
      presetServerHint: 'Here B calls CLOSE first. Who waits in TIME-WAIT now?',
      presetHalf: 'Half-closed connection',
      presetHalfHint: 'A has finished sending, B still has 200 B. May B send after A\'s FIN, and does A take it?',
      presetSimul: 'Simultaneous close',
      presetSimulHint: 'Both ends call CLOSE in the same step. Which states do they pass through, and who waits in TIME-WAIT?',
      presetClosed: 'Closed port',
      presetClosedHint: 'Nothing listens on B. What does B answer to the SYN, and what happens to A?',
      presetDrive: 'You drive',
      presetDriveHint: 'Call OPEN, SEND and CLOSE at both ends and deliver segments. Can you make a simultaneous open?',

      capStart: 'Both ends are CLOSED: there is no connection yet. Each end has a state of its own, so watch both A and B.',
      capStartClosed: 'Nothing listens on B\'s port: B is CLOSED. What will A get when it sends a SYN?',
      capDriveStart: 'You drive both ends: pick a call for A or B, then deliver or lose the oldest segment in flight. An illegal call is rejected.',
      capStep: 'Step {n}:',
      evListen: '{e} calls a passive OPEN and sends nothing.',
      evOpen: '{e} calls an active OPEN and sends {seg}.',
      evSend: '{e} calls SEND and sends {seg}.',
      evClose: '{e} calls CLOSE and sends {seg}.',
      evCloseQuiet: '{e} calls CLOSE; the connection is not established yet, so it sends nothing.',
      evBoth: 'A and B call CLOSE in the same step: A sends {segA}, B sends {segB}, and the FINs cross.',
      evRejected: '{e} calls {call} in {state}: rejected, "{why}". Nothing changes and nothing is sent.',
      whyNoConn: 'connection does not exist',
      whyExists: 'connection already exists',
      whyClosing: 'connection closing',
      whyNotYet: 'connection not yet established',
      evDeliver: '{e} receives {seg}.',
      evReply: 'It answers with {seg}.',
      evReset: '{e} has no such connection, so it answers with {seg}.',
      evHeld: 'It does not acknowledge at once: the ACK will ride on its next segment.',
      evIgnored: '{e} does not expect this segment, so it drops it without an answer.',
      evAcked: 'The acknowledgment has arrived; the state does not change.',
      evLose: '{seg} from {from} is lost in the network: {e} never learns of it, and {from} stays in {state}.',
      evTimeout: '2×MSL has passed: 4 min by the standard (MSL = 2 min), 60 s on many systems.',
      moved: '{e} moves to {state}:',
      movedBoth: 'A and B move to {state}:',
      'm-both-close': 'neither end sends any more, but both still receive.',
      'm-both-timeout': 'in a simultaneous close both ends pass through TIME-WAIT.',
      'm-open-passive': 'it listens and waits for someone\'s SYN.',
      'm-open-active': 'it waits for an answer to its SYN.',
      'm-listen-close': 'it no longer listens.',
      'm-listen-syn': 'it has answered and waits for {o} to acknowledge its SYN.',
      'm-synsent-close': 'it gave up before the connection was established.',
      'm-synsent-syn': 'the SYNs crossed (simultaneous open); it waits for its SYN to be acknowledged.',
      'm-synsent-synack': 'for {e} the connection is established, although {o} does not know it yet.',
      'm-synsent-rst': 'the connection is refused, because nothing listens at the other end.',
      'm-synrcvd-ack': 'its SYN is acknowledged, so for {e} the connection is established.',
      'm-synrcvd-close': 'it sends no more, but still receives.',
      'm-synrcvd-rst': 'the attempt was reset, so it goes back to listening.',
      'm-estab-close': 'it sends no more, but still receives.',
      'm-estab-fin': '{o} sends no more, but {e} may send until it calls CLOSE.',
      'm-fw1-ack': 'its FIN is acknowledged; it waits for {o}\'s FIN.',
      'm-fw1-fin': 'the FINs crossed; it still waits for its own FIN to be acknowledged.',
      'm-fw1-finack': 'the FIN and the ACK of its own FIN came in one segment, so it skips FIN-WAIT-2 and waits 2×MSL.',
      'm-fw2-fin': 'it acknowledged {o}\'s FIN and waits 2×MSL for late segments to die out.',
      'm-closing-ack': 'its FIN is acknowledged; it waits 2×MSL for late segments to die out.',
      'm-cw-close': 'it waits for its FIN to be acknowledged.',
      'm-lastack-ack': 'its FIN is acknowledged and the connection is over for {e}.',
      'm-tw-timeout': 'TIME-WAIT is held by the end that sent its FIN before receiving the other\'s, client or server.',
      'm-rst': 'the connection is reset (RST).',
      viaEstab: 'The FIN also acknowledges its SYN (the handshake\'s ACK was lost), so {e} passes through ESTABLISHED in the same step.',

      explain:
        '<p>The <i>connection state</i> is not a property of the connection but of <b>each end</b>. RFC 9293 names eleven ' +
        '(Figure 5), and most of the time A and B are in different ones: A is ESTABLISHED as soon as it receives the ' +
        'SYN+ACK, B only when A\'s ACK arrives.</p>' +
        '<p>The <i>three-way handshake</i> takes B from LISTEN and A from SYN-SENT to ESTABLISHED. SYN and FIN take one ' +
        '<i>sequence number</i> each, so the <i>acknowledgment number</i> is one higher: 4000 → 4001.</p>' +
        '<p>Closing is not the handshake in reverse: it is two independent FINs, one in each direction. After its FIN ' +
        'an end sends no more but still receives; the other may send until it calls CLOSE. That is a <i>half-closed ' +
        'connection</i>.</p>' +
        '<p>TIME-WAIT is not a stuck <i>socket</i>: the end that closed first holds it, client or server, for 2×MSL (4 ' +
        'min by the standard, 60 s on many systems), so that late segments of the old connection die out and the last ' +
        'ACK can be repeated if it is lost.</p>' +
        '<p>An end without a connection (CLOSED) answers every segment but an RST with an RST; that is why A\'s attempt ' +
        'at a closed port ends in CLOSED at once. Retransmission of lost segments is not shown here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
