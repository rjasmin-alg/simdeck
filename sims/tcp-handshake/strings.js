/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tcp-handshake, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM
   book's fragment trostruko-rukovanje.html and chapter 13); English is written for simdeck. Croatian terms follow
   the book: trostruko rukovanje, redni broj, početni redni broj, broj potvrde, oktet, segment, zastavica, veza. The
   glossary has only "handshake" = rukovanje (from the UL book), not the URM book's three-way handshake terms, so the
   pairs are written out in both tables and listed in NOTES.md. Numbers, flags (SYN, ACK) and the side names A and B
   are data, not words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijent A i poslužitelj B razmjenjuju tri poruke trostrukog rukovanja; ispod je niz rednih brojeva svake strane',
      isn: 'Početni redni brojevi',
      isnOwn: 'Biram ih',
      isnReal: 'Kao u snimci veze',
      isnWrap: 'Kraj 32 bita',
      x: 'X (A-in početni redni broj)',
      y: 'Y (B-ov početni redni broj)',
      slidersOff: 'Brojeve sad daje odabir iznad; klizači vrijede za „Biram ih”.',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 13, Primjer 3: X = 4000, Y = 9500. Zašto B kao broj potvrde šalje 4001, a ne 4000?',
      presetSmall: 'X = 100, Y = 500',
      presetSmallHint: 'Koji broj potvrde B šalje u drugoj poruci, i koji A šalje u trećoj?',
      presetMerged: 'Tri poruke, četiri koraka',
      presetMergedHint: 'Zašto se ukupno pošalju tri poruke iako postupak ima četiri koncepcijska koraka?',
      presetOwn: 'Svaka strana svoj broj',
      presetOwnHint: 'Ovdje su oba početna broja 4000. Zašto B ipak mora poslati svoj redni broj, a ne samo potvrditi A-in?',
      presetReal: 'Pravi brojevi',
      presetRealHint: 'Početni redni brojevi iz snimke stvarne veze nisu okrugli. Vrijedi li i za njih isto pravilo potvrde?',
      presetWrap: 'Kraj 32 bita',
      presetWrapHint: 'A-in početni redni broj je najveći 32-bitni broj. Koji broj potvrde B tada šalje?',
      legendA: 'A, klijent',
      legendB: 'B, poslužitelj',
      legendNow: 'promijenjeno u ovom koraku',
      legendLater: 'još nije poslana',
      client: 'klijent',
      server: 'poslužitelj',
      iss: 'početni redni broj',
      sndNxt: 'sljedeći redni broj koji šalje',
      rcvNxt: 'očekuje od {other}',
      unknown: 'još ne zna',
      acked: '{other} je potvrdio njegov broj',
      notAcked: 'njegov broj još nije potvrđen',
      established: 'veza uspostavljena',
      step1: 'korak 1',
      step23: 'koraci 2 i 3',
      step4: 'korak 4',
      seqField: 'redni broj',
      ackField: 'potvrda',
      part2: 'korak 2: potvrda A-ina SYN-a',
      part3: 'korak 3: B-ov SYN',
      notYet: 'još nije poslano',
      lineA: 'Niz okteta koje A šalje',
      lineB: 'Niz okteta koje B šalje',
      cellSyn: 'zauzima SYN',
      cellFirst: 'prvi oktet podataka',
      cellNext: 'drugi oktet',
      expects: '{who} čeka',
      captionStart: 'Veza još nije započela. A je odabrao početni redni broj X = {x}, B će odabrati Y = {y}. ' +
        'Pritisni →.',
      caption1: 'A šalje SYN s rednim brojem {x}. Taj broj zauzima sam SYN, pa B sad čeka {x1}: na tom mjestu ' +
        'dolazi prvi oktet A-inih podataka.',
      caption2: 'B istovremeno potvrđuje A-in SYN (potvrda {x1}) i šalje vlastiti SYN (redni broj {y}), u jednoj ' +
        'poruci: SYN+ACK. Dva koncepcijska koraka, jedna poruka.',
      caption3: 'A potvrđuje B-ov SYN brojem potvrde {y1} (Y + 1). Veza je uspostavljena: svaka strana svoj je ' +
        'početni broj izgovorila i vidjela ga vraćenog s druge strane.',
      captionWrap: 'Redni broj ima 32 bita: iza {last} dolazi {zero}.',
      // ── teardown (task tcp-teardown) ──
      closer: 'Prvi zatvara',
      presetCloseClient: 'A zatvara',
      presetCloseClientHint: 'Klijent A nema više podataka. Koliko segmenata treba da se veza zatvori u oba smjera, i tko na kraju čeka?',
      presetCloseServer: 'B zatvara',
      presetCloseServerHint: 'Sad prvi zatvara poslužitelj B. Na kojoj strani je sada TIME-WAIT?',
      presetHalf: 'Poluzatvorena veza',
      presetHalfHint: 'A više nema što poslati i zatvara svoj smjer, a B mu još duguje odgovor. Može li ga B poslati, i može li ga A primiti?',
      presetFinack: 'FIN+ACK zajedno',
      presetFinackHint: 'B nema što dodati pa potvrdu i svoj FIN šalje u jednom segmentu. Kroz koja stanja tada prolazi A?',
      presetSimul: 'Istodobno',
      presetSimulHint: 'Obje strane šalju FIN u istom trenutku. Tko sad prolazi kroz TIME-WAIT?',
      legendAck: 'čisti ACK',
      stageClose: 'Klijent A i poslužitelj B zatvaraju vezu; iznad svake strane je njezino stanje, ispod segmenti redom kojim su poslani',
      sendsFrom: 'šalje od',
      expectsFrom: 'očekuje',
      maySend: 'šalje podatke',
      mayReceive: 'prima podatke',
      yes: 'da',
      no: 'ne',
      dataChip: 'podaci',
      timeWait: 'TIME-WAIT, 2×MSL',
      noteTimeout: '2×MSL prošlo',
      chartEmpty: 'Veza je uspostavljena; još nijedan segment zatvaranja.',
      earlier: ['↑ još {n} raniji red', '↑ još {n} ranija reda', '↑ još {n} ranijih redova'],
      capCloseStart: 'Veza je uspostavljena, kao na kraju rukovanja s X = {x} i Y = {y}: A šalje od {a1}, B od {b1}. ' +
        'Obje strane su u ESTABLISHED. Prvi zatvara {c}. Pritisni →.',
      capSimulStart: 'Veza je uspostavljena, kao na kraju rukovanja s X = {x} i Y = {y}: A šalje od {a1}, B od {b1}. ' +
        'Obje strane zatvaraju u istom trenutku. Pritisni →.',
      capFin1: 'Korak 1: {c} nema više podataka i šalje FIN seq={seq}. {c} je u FIN-WAIT-1; {o} prima FIN i prelazi u ' +
        'CLOSE-WAIT, ali još uvijek smije slati.',
      capClose2: 'Korak 2: {o} potvrđuje FIN brojem {ack}, jer je FIN zauzeo broj {fin}. {c} prelazi u FIN-WAIT-2 i čeka ' +
        'FIN od {o}. Veza je poluzatvorena: smjer {o} → {c} još radi.',
      capClose3: 'Korak 3: i {o} je gotov: šalje svoj FIN seq={seq} i prelazi u LAST-ACK. {c} ga prima u FIN-WAIT-2 i ' +
        'prelazi u TIME-WAIT.',
      capClose4: 'Korak 4: {c} potvrđuje FIN od {o} brojem {ack} i ostaje u TIME-WAIT; {o} je zatvoren. Četiri ' +
        'segmenta: zatvaranje nije otvaranje unatrag.',
      capTimeout: 'Korak {step}: prošlo je 2×MSL ({tw}) i tek je sad i {c} zatvoren. TIME-WAIT drži samo strana koja je prva ' +
        'zatvorila, i to nije greška: da se zadnji ACK izgubio, {o} bi ponovio FIN, a {c} bi ga još mogao potvrditi.',
      capHalf2: 'Korak 2: {o} potvrđuje FIN brojem {ack}. {c} je u FIN-WAIT-2: više ne šalje podatke, ali ih i dalje prima.',
      capHalf3: 'Korak 3: {o} je u CLOSE-WAIT i još šalje: odgovor od {len} okteta, seq={seq}. {c} ga prima iako je ' +
        'svoj smjer zatvorio.',
      capHalf4: 'Korak 4: {c} potvrđuje podatke brojem {ack} ({dseq} + {len}). Potvrđivati smije i nakon svojeg FIN-a.',
      capHalf5: 'Korak 5: {o} je poslao sve i šalje FIN seq={seq}, odmah iza zadnjeg okteta podataka. {o} prelazi u ' +
        'LAST-ACK, a {c} prima FIN u FIN-WAIT-2 i prelazi u TIME-WAIT.',
      capHalf6: 'Korak 6: {c} potvrđuje FIN brojem {ack} i ostaje u TIME-WAIT; {o} je zatvoren.',
      capFinack2: 'Korak 2: {o} nema što dodati: u jednom segmentu potvrđuje FIN (ack={ack}) i šalje svoj FIN seq={seq}. ' +
        '{c} prelazi iz FIN-WAIT-1 ravno u TIME-WAIT, bez FIN-WAIT-2.',
      capFinack3: 'Korak 3: {c} potvrđuje FIN brojem {ack}; {o} je zatvoren. Tri segmenta umjesto četiri.',
      capSimul1: 'Korak 1: obje strane zatvaraju istodobno: A šalje FIN seq={seqA}, B šalje FIN seq={seqB}, i FIN-ovi se ' +
        'mimoilaze. Svaka prima tuđi FIN dok je u FIN-WAIT-1, a vlastiti FIN još nije potvrđen: obje prelaze u CLOSING.',
      capSimul2: 'Korak 2: svaka strana potvrđuje tuđi FIN (A: ack={ackA}, B: ack={ackB}). Čim stigne potvrda ' +
        'vlastitog FIN-a, obje prelaze u TIME-WAIT.',
      capSimul3: 'Korak 3: prošlo je 2×MSL ({tw}); obje strane su zatvorene. Kod istodobnog zatvaranja kroz TIME-WAIT ' +
        'prolaze obje.',
      closeLineA: 'Brojevi koje A šalje',
      closeLineB: 'Brojevi koje B šalje',
      cellData: ['podaci, {n} oktet', 'podaci, {n} okteta', 'podaci, {n} okteta'],
      cellFin: 'zauzima FIN',
      cellFinNot: 'tu bi došao FIN',
      cellAfterFin: 'iza FIN-a: potvrda FIN-a',
      tw: '4 min',
      explainClose: '<p><strong>Zatvaranje nije otvaranje unatrag.</strong> Svaka strana zatvara svoj smjer zasebno: CLOSE ' +
        'znači „nemam više podataka za slanje” i šalje FIN. FIN, kao i SYN, zauzima jedan redni broj, pa je broj potvrde ' +
        'FIN-a njegov redni broj + 1. Zato zatvaranje treba četiri segmenta, FIN i ACK u svakom smjeru, osim kad druga ' +
        'strana potvrdu i svoj FIN pošalje zajedno (FIN+ACK, tri segmenta).</p>' +
        '<p><strong>Poluzatvorena veza.</strong> Nakon svojeg FIN-a strana više ne šalje podatke, ali ih i dalje prima ' +
        'i potvrđuje. Druga strana, u CLOSE-WAIT, smije slati koliko joj treba. Tako klijent pošalje cijelu datoteku, ' +
        'zatvori svoj smjer i još dobije odgovor poslužitelja.</p>' +
        '<p><strong>TIME-WAIT.</strong> Strana koja je prva zatvorila nakon zadnjeg ACK-a čeka još 2×MSL. MSL, najdulje ' +
        'vrijeme koje segment može lutati mrežom, prema normi iznosi 2 minute, pa TIME-WAIT traje 4 minute; mnogi ' +
        'sustavi čekaju kraće, npr. 60 s. Ako se zadnji ACK izgubi, druga strana ponovi FIN i dobije novu potvrdu, a ' +
        'zakašnjeli segmenti stare veze nestanu prije nego što ista kombinacija adresa i portova zatreba novoj vezi. ' +
        'TIME-WAIT nije greška i nije nužno na poslužitelju: drži ga strana koja je prva zatvorila, a kod istodobnog ' +
        'zatvaranja obje.</p>' +
        '<p><strong>Stanja.</strong> ESTABLISHED, FIN-WAIT-1, FIN-WAIT-2, CLOSE-WAIT, LAST-ACK, CLOSING, TIME-WAIT i ' +
        'CLOSED su imena iz norme TCP-a. Stanje se mijenja kad strana pošalje FIN i kad primi FIN ili potvrdu svojeg ' +
        'FIN-a.</p>',
      explain: '<p><strong>Zašto broj potvrde nije jednak rednom broju koji potvrđuje.</strong> Broj potvrde ne kaže ' +
        'što je zadnje stiglo, nego koji redni broj se očekuje sljedeći. A-in SYN zauzima redni broj X, pa prvi oktet ' +
        'A-inih stvarnih podataka dolazi na X+1, i upravo taj broj B čeka: otud potvrda X+1, a ne X.</p>' +
        '<p><strong>Četiri koraka, tri poruke.</strong> A šalje SYN sa svojim rednim brojem X (1); B potvrđuje X (2) i ' +
        'šalje vlastiti SYN s rednim brojem Y (3); A potvrđuje Y (4). B ne mora čekati zaseban krug da pošalje oboje, ' +
        'pa se koraci 2 i 3 spajaju u jednu poruku, SYN+ACK: otud trostruko, a ne četverostruko rukovanje.</p>' +
        '<p><strong>Zašto svaka strana svoj broj.</strong> TCP veza je dvosmjerna: B će i sam slati podatke A-u, pa mu ' +
        'treba vlastita polazna točka rednih brojeva, neovisna o A-inoj. Svaka strana svoj početni broj mora izgovoriti ' +
        'i vidjeti ga vraćenog s druge strane; to je jedini dokaz da druga strana govori upravo o ovoj vezi, a ne o ' +
        'nekoj staroj, zakašnjeloj poruci.</p>' +
        '<p><strong>32 bita.</strong> Redni broj i broj potvrde imaju po 32 bita i računaju se modulo 2³². Početni ' +
        'redni brojevi u stvarnoj vezi nisu okrugli, a iza najvećeg broja, 4294967295, dolazi 0.</p>'
    },
    en: {
      stage: 'Client A and server B exchange the three messages of the three-way handshake; below, each side\'s sequence numbers',
      isn: 'Initial sequence numbers',
      isnOwn: 'I choose them',
      isnReal: 'As in a captured connection',
      isnWrap: 'End of 32 bits',
      x: 'X (A\'s initial sequence number)',
      y: 'Y (B\'s initial sequence number)',
      slidersOff: 'The choice above sets the numbers now; the sliders apply to “I choose them”.',
      presetBook: 'Example from the book',
      presetBookHint: 'Chapter 13, Example 3: X = 4000, Y = 9500. Why does B send 4001 as its acknowledgment number, not 4000?',
      presetSmall: 'X = 100, Y = 500',
      presetSmallHint: 'Which acknowledgment number does B send in the second message, and which does A send in the third?',
      presetMerged: 'Three messages, four steps',
      presetMergedHint: 'Why are only three messages sent when the procedure has four conceptual steps?',
      presetOwn: 'Each side its own number',
      presetOwnHint: 'Here both initial numbers are 4000. Why must B still send its own sequence number, not just acknowledge A\'s?',
      presetReal: 'Real numbers',
      presetRealHint: 'The initial sequence numbers in a captured connection are not round. Does the same acknowledgment rule hold?',
      presetWrap: 'End of 32 bits',
      presetWrapHint: 'A\'s initial sequence number is the largest 32-bit number. Which acknowledgment number does B send?',
      legendA: 'A, the client',
      legendB: 'B, the server',
      legendNow: 'changed in this step',
      legendLater: 'not sent yet',
      client: 'client',
      server: 'server',
      iss: 'initial sequence number',
      sndNxt: 'next sequence number it sends',
      rcvNxt: 'expects from {other}',
      unknown: 'does not know yet',
      acked: '{other} has acknowledged its number',
      notAcked: 'its number is not acknowledged yet',
      established: 'connection established',
      step1: 'step 1',
      step23: 'steps 2 and 3',
      step4: 'step 4',
      seqField: 'seq',
      ackField: 'ack',
      part2: 'step 2: acknowledges A\'s SYN',
      part3: 'step 3: B\'s SYN',
      notYet: 'not sent yet',
      lineA: 'The octets A sends',
      lineB: 'The octets B sends',
      cellSyn: 'taken by the SYN',
      cellFirst: 'first data octet',
      cellNext: 'second octet',
      expects: '{who} waits for',
      captionStart: 'The connection has not started. A has chosen the initial sequence number X = {x}; B will choose ' +
        'Y = {y}. Press →.',
      caption1: 'A sends a SYN with sequence number {x}. The SYN itself takes that number, so B now waits for {x1}: ' +
        'A\'s first data octet will come there.',
      caption2: 'B acknowledges A\'s SYN (ack {x1}) and sends its own SYN (seq {y}) at the same time, in one message: ' +
        'SYN+ACK. Two conceptual steps, one message.',
      caption3: 'A acknowledges B\'s SYN with acknowledgment number {y1} (Y + 1). The connection is established: each ' +
        'side has stated its initial number and seen it come back from the other side.',
      captionWrap: 'A sequence number has 32 bits: after {last} comes {zero}.',
      // ── teardown (task tcp-teardown) ──
      closer: 'Closes first',
      presetCloseClient: 'A closes',
      presetCloseClientHint: 'Client A has no more data. How many segments close the connection in both directions, and who waits at the end?',
      presetCloseServer: 'B closes',
      presetCloseServerHint: 'Now server B closes first. On which side is TIME-WAIT now?',
      presetHalf: 'Half-closed',
      presetHalfHint: 'A has nothing more to send and closes its direction, but B still owes it a reply. Can B send it, and can A receive it?',
      presetFinack: 'FIN+ACK together',
      presetFinackHint: 'B has nothing to add, so it sends the acknowledgment and its own FIN in one segment. Which states does A pass through?',
      presetSimul: 'Simultaneous',
      presetSimulHint: 'Both ends send a FIN at the same moment. Who passes through TIME-WAIT now?',
      legendAck: 'a pure ACK',
      stageClose: 'Client A and server B close the connection; above each end its state, below the segments in the order they were sent',
      sendsFrom: 'sends from',
      expectsFrom: 'expects',
      maySend: 'sends data',
      mayReceive: 'receives data',
      yes: 'yes',
      no: 'no',
      dataChip: 'data',
      timeWait: 'TIME-WAIT, 2×MSL',
      noteTimeout: '2×MSL passed',
      chartEmpty: 'The connection is established; no closing segment yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      capCloseStart: 'The connection is established, as at the end of the handshake with X = {x} and Y = {y}: A sends from ' +
        '{a1}, B from {b1}. Both ends are ESTABLISHED. {c} closes first. Press →.',
      capSimulStart: 'The connection is established, as at the end of the handshake with X = {x} and Y = {y}: A sends from ' +
        '{a1}, B from {b1}. Both ends close at the same moment. Press →.',
      capFin1: 'Step 1: {c} has no more data and sends FIN seq={seq}. {c} is in FIN-WAIT-1; {o} receives the FIN and ' +
        'moves to CLOSE-WAIT, but may still send.',
      capClose2: 'Step 2: {o} acknowledges the FIN with {ack}, because the FIN took number {fin}. {c} moves to FIN-WAIT-2 ' +
        'and waits for {o}\'s FIN. The connection is half-closed: the direction {o} → {c} still works.',
      capClose3: 'Step 3: {o} is done too: it sends its own FIN seq={seq} and moves to LAST-ACK. {c} receives it in ' +
        'FIN-WAIT-2 and moves to TIME-WAIT.',
      capClose4: 'Step 4: {c} acknowledges {o}\'s FIN with {ack} and stays in TIME-WAIT; {o} is closed. Four segments: ' +
        'closing is not opening run backwards.',
      capTimeout: 'Step {step}: 2×MSL ({tw}) has passed, and only now is {c} closed too. Only the end that closed first holds ' +
        'TIME-WAIT, and it is not a fault: had the last ACK been lost, {o} would repeat its FIN and {c} could still ' +
        'acknowledge it.',
      capHalf2: 'Step 2: {o} acknowledges the FIN with {ack}. {c} is in FIN-WAIT-2: it sends no more data, but it still ' +
        'receives.',
      capHalf3: 'Step 3: {o} is in CLOSE-WAIT and still sends: a reply of {len} octets, seq={seq}. {c} receives it although ' +
        'it has closed its own direction.',
      capHalf4: 'Step 4: {c} acknowledges the data with {ack} ({dseq} + {len}). It may acknowledge after its own FIN.',
      capHalf5: 'Step 5: {o} has sent everything and sends FIN seq={seq}, right after the last data octet. {o} moves to ' +
        'LAST-ACK; {c} receives the FIN in FIN-WAIT-2 and moves to TIME-WAIT.',
      capHalf6: 'Step 6: {c} acknowledges the FIN with {ack} and stays in TIME-WAIT; {o} is closed.',
      capFinack2: 'Step 2: {o} has nothing to add: in one segment it acknowledges the FIN (ack={ack}) and sends its own FIN ' +
        'seq={seq}. {c} goes from FIN-WAIT-1 straight to TIME-WAIT, without FIN-WAIT-2.',
      capFinack3: 'Step 3: {c} acknowledges the FIN with {ack}; {o} is closed. Three segments instead of four.',
      capSimul1: 'Step 1: both ends close at once: A sends FIN seq={seqA}, B sends FIN seq={seqB}, and the FINs cross. Each ' +
        'receives the other\'s FIN in FIN-WAIT-1 before its own FIN is acknowledged: both move to CLOSING.',
      capSimul2: 'Step 2: each end acknowledges the other\'s FIN (A: ack={ackA}, B: ack={ackB}). As soon as the ' +
        'acknowledgment of its own FIN arrives, each moves to TIME-WAIT.',
      capSimul3: 'Step 3: 2×MSL ({tw}) has passed; both ends are closed. In a simultaneous close both pass through ' +
        'TIME-WAIT.',
      closeLineA: 'The numbers A sends',
      closeLineB: 'The numbers B sends',
      cellData: ['data, {n} octet', 'data, {n} octets'],
      cellFin: 'taken by the FIN',
      cellFinNot: 'a FIN would come here',
      cellAfterFin: 'after the FIN: its ack',
      tw: '4 min',
      explainClose: '<p><strong>Closing is not opening run backwards.</strong> Each end closes its own direction ' +
        'separately: CLOSE means “I have no more data to send” and sends a FIN. A FIN, like a SYN, takes one sequence ' +
        'number, so the acknowledgment number of a FIN is its sequence number + 1. That is why a close takes four ' +
        'segments, a FIN and an ACK in each direction, unless the other end sends its acknowledgment and its own FIN ' +
        'together (FIN+ACK, three segments).</p>' +
        '<p><strong>Half-closed connection.</strong> After its FIN an end sends no more data, but it still receives and ' +
        'acknowledges. The other end, in CLOSE-WAIT, may send as much as it needs. So a client sends a whole file, closes ' +
        'its direction and still gets the server\'s reply.</p>' +
        '<p><strong>TIME-WAIT.</strong> After the last ACK, the end that closed first waits another 2×MSL. MSL, the ' +
        'longest a segment can wander the network, is 2 minutes in the standard, so TIME-WAIT lasts 4 minutes; many ' +
        'systems wait less, for example 60 s. If the last ACK is lost, the other end repeats its FIN and gets a new ' +
        'acknowledgment, and late segments of the old connection die out before the same pair of addresses and ports is ' +
        'needed for a new one. TIME-WAIT is not a fault and not necessarily on the server: the end that closed first ' +
        'holds it, and in a simultaneous close both do.</p>' +
        '<p><strong>States.</strong> ESTABLISHED, FIN-WAIT-1, FIN-WAIT-2, CLOSE-WAIT, LAST-ACK, CLOSING, TIME-WAIT and ' +
        'CLOSED are the names from the TCP standard. A state changes when an end sends a FIN, and when it receives a FIN ' +
        'or the acknowledgment of its own FIN.</p>',
      explain: '<p><strong>Why the acknowledgment number is not the sequence number it acknowledges.</strong> The ' +
        'acknowledgment number does not say what arrived last; it says which sequence number is expected next. A\'s SYN ' +
        'takes sequence number X, so the first octet of A\'s real data comes at X+1, and that is the number B waits for: ' +
        'hence the acknowledgment X+1, not X.</p>' +
        '<p><strong>Four steps, three messages.</strong> A sends a SYN with its sequence number X (1); B acknowledges X ' +
        '(2) and sends its own SYN with sequence number Y (3); A acknowledges Y (4). B need not wait for a separate round ' +
        'to send both, so steps 2 and 3 combine into one message, the SYN+ACK: hence a three-way, not a four-way, ' +
        'handshake.</p>' +
        '<p><strong>Why each side has its own number.</strong> A TCP connection runs both ways: B will send data to A ' +
        'too, so it needs its own starting point for sequence numbers, independent of A\'s. Each side must state its ' +
        'initial number and see it come back from the other side; that is the only proof that the other side is talking ' +
        'about this connection, not an old, delayed message.</p>' +
        '<p><strong>32 bits.</strong> The sequence and acknowledgment numbers have 32 bits each and are counted modulo ' +
        '2³². Initial sequence numbers in a real connection are not round, and after the largest number, 4294967295, ' +
        'comes 0.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
