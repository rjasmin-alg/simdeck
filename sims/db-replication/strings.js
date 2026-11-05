/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of db-replication, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms missing
   from kit/glossary.js are written out this way, English term then the Croatian in parentheses at the first mention
   (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title, concept). Server ids (P, R1, R2), LSNs,
   times in ms and values (x = 5) are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijent, primarni poslužitelj i replike sa zapisima na putu; ispod njih dnevnik zapisa svakog poslužitelja',

      // drawing
      cMark: 'K',
      nClient: 'klijent',
      nPrimary: 'primarni',
      nNewPrimary: 'novi primarni',
      nReplica: 'replika',
      nOld: 'stari primarni',
      lagLine: 'kasni {ms} ms',
      bDown: 'pao',
      bPromoted: 'promaknut',
      bRefused: 'odbijen',
      bBack: 'vratio se',
      bRebuilt: 'obnovljen',
      bAttached: 'priključen',
      bFollows: 'prati {id}',
      bAck: 'potvrdio {k}',
      bAcked: '✓ {k} potvrđen',
      bHolds: 'drži čitanje do {k}',
      ownLine: 'moj zadnji upis: {k}',
      bubbleWait: 'čeka da {from} primijeni {k}…',
      bubbleFresh: 'svježe',
      bubbleStale: 'zastarjelo',
      bubbleFrom: 'od {from} u {at} ms',

      // log strips
      gridTitle: 'Dnevnik unaprijednog pisanja (WAL)',
      gridMeta: 'zapis k postavlja x = k',
      gridAxis: 'iznad stupca: vrijeme upisa u ms',
      asideDown: 'pao',
      asideRefused: 'odbijen',
      asideBack: 'vratio se',
      ackedN: ['potvrđen {n} zapis', 'potvrđena {n} zapisa', 'potvrđeno {n} zapisa'],
      asideNewPrimary: 'novi primarni',
      asideFollows: 'prati {id}',
      asideNoPrimary: 'nema primarnog',
      behindN: ['zaostaje {n} zapis', 'zaostaje {n} zapisa', 'zaostaje {n} zapisa'],
      level: 'ukorak s primarnim',
      brLost: 'izgubljeno',
      brExtra: 'nema ih u novoj povijesti',
      brDiscarded: 'odbačeno',
      and: 'i',

      // captions: the start
      repsN: ['{n} replika primjenjuje', '{n} replike primjenjuju', '{n} replika primjenjuje'],
      capStart: 'Klijent svakih 100 ms upisuje x na *primary* (primarni poslužitelj), koji upis odmah potvrđuje. {reps} iste ' +
        'zapise kasnije, za svoj *replication lag* (zaostatak replikacije): {lags}.',
      capStartRead: 'Nakon pet upisa klijent u {at} ms čita x s replike R1.',
      capStartReadWait: 'Nakon pet upisa klijent u {at} ms čita x s replike R1 i traži da replika pričeka njegov zadnji upis.',
      capStartReadP: 'Nakon pet upisa klijent u {at} ms čita x s primarnog.',
      capStartFail: 'U {at} ms primarni pada.',
      capStartFailBack: 'U {at} ms primarni pada, a nakon preuzimanja se vraća.',
      capStartPlain: 'Pritisni → i gledaj zaostatak.',

      // captions: a tick
      capWrite: '{t} ms: upis {k} stiže na primarni, koji ga odmah potvrđuje klijentu.',
      capClock: '{t} ms: klijent više ne piše.',
      repApplied: 'Replika {id} primjenjuje {list}, a nedostaje joj još {n}.',
      repAppliedLevel: 'Replika {id} primjenjuje {list} i ukorak je s primarnim.',
      repNothing: 'Replika {id} ne primjenjuje ništa novo; nedostaje joj {n}.',
      repNothingLevel: 'Replika {id} ima sve zapise.',
      repNothingYet: 'Replika {id} još nije primijenila nijedan zapis.',
      capPlainEnd: 'Zaostatak je stalan: replika je uvijek nekoliko zapisa iza primarnog, i to nije kvar.',

      // captions: the read
      capReadP: '{at} ms: klijent čita x s primarnog. Primarni ima svaki potvrđeni zapis, pa vraća {got}, tvoj upis {own}. ' +
        'Čitanje s primarnog uvijek vidi vlastite upise: *read-your-writes* (čitanje vlastitih upisa).',
      capReadStale: 'Čitanje s replike u {at} ms: primijenila je zapise do {lsn}, pa vrijednost koju si upisao u {ownAt} ms ' +
        'još nije ondje. Vraća {got}: *stale read* (zastarjelo čitanje).',
      capReadFresh: 'Čitanje s replike u {at} ms: primijenila je zapise do {lsn}, pa ima i tvoj upis {own}. Vraća {got}: uz ' +
        'mali zaostatak replika stigne na vrijeme.',
      capReadStaleNone: 'Čitanje s replike u {at} ms: još nije primijenila nijedan zapis, pa vrijednost koju si upisao u ' +
        '{ownAt} ms nije ondje. Vraća {got}: *stale read* (zastarjelo čitanje).',
      capReadHeldNone: 'Čitanje s replike u {at} ms, uz „pričekaj moj zapis {own}": replika još nije primijenila nijedan ' +
        'zapis, pa čitanje zadržava dok ne primijeni {own}.',
      capReadHeld: 'Čitanje s replike u {at} ms, uz „pričekaj moj zapis {own}": replika ima zapise samo do {has}, pa čitanje ' +
        'zadržava dok ne primijeni {own}.',
      capServed: 'Replika {from} primijenila je zapis {k} u {at} ms i tek tada odgovara: tvoj vlastiti upis, ' +
        '*read-your-writes* (čitanje vlastitih upisa). Čekanje je trajalo {waited} ms.',
      capStillHeld: 'Čitanje i dalje čeka zapis {k}.',
      capWasStale: 'Čitanje u {at} ms već je vratilo staru vrijednost {got}.',
      capTooLate: 'Sad replika ima tvoj upis {own}, ali prekasno: čitanje u {at} ms vratilo je {got}.',

      // captions: the failover
      capFail: '{t} ms: primarni pada. Klijentu je potvrdio zapise do {k}.',
      capFailRep: 'Replika {id} ima zapise do {k}; {list} do nje više nikad neće stići.',
      capFailRepAll: 'Replika {id} ima sve zapise, do {k}.',
      capFailRepNone: 'Replika {id} nema nijedan zapis; {list} do nje više nikad neće stići.',
      capPromote: '*Failover* (preuzimanje): replika {id} postaje novi primarni.',
      whyOnly: 'Jedina je replika.',
      whyHighest: 'Ima najviši primijenjeni LSN, {k}.',
      whyPrefer: 'Obje imaju LSN {k}; izjednačenje rješava zadana prednost.',
      whyLowerId: 'Obje imaju LSN {k}; izjednačenje rješava niža oznaka.',
      capLost: '*Primary* (primarni poslužitelj) potvrdio je zapise {list}, ali ih replika {id} još nije primijenila. Nakon ' +
        'preuzimanja ti su zapisi izgubljeni.',
      capLostOne: '*Primary* (primarni poslužitelj) potvrdio je zapis {list}, ali ga replika {id} još nije primijenila. Nakon ' +
        'preuzimanja taj je zapis izgubljen.',
      capLostSize: 'Klijent je za njih dobio „potvrđeno": {n}, otprilike zadnjih {ms} ms upisa.',
      recordsN: ['{n} zapis', '{n} zapisa', '{n} zapisa'],
      capNoLoss: 'Ništa nije izgubljeno: replika {id} primijenila je svaki potvrđeni zapis.',
      capFollow: 'Replika {id} sada prati novog primarnog {np} i prima zapise {list} koji su joj nedostajali. Sada ima zapise ' +
        'do {k}.',
      capFollowLevel: 'Replika {id} sada prati novog primarnog {np}; ima iste zapise, do {k}.',
      capReturn: 'Stari primarni vraća se sa zapisima do {k}. Zapisa {list} nema u novoj povijesti: {np} ima zapise do {nk}, ' +
        'a njegov sljedeći upis opet će dobiti LSN {next}. Zato je odbijen: ne smije primati upise ni vratiti se takav kakav je.',
      capReturnLevel: 'Stari primarni vraća se sa zapisima do {k}, kao i {np}: nema ničeg viška, pa smije pratiti {np} kao ' +
        'replika, nikad kao drugi primarni.',
      capRebuild: 'Stari primarni obnavlja se iz {np}: zapisi {list} se odbacuju i on prati {np} kao replika, sa zapisima do ' +
        '{k}. Potvrđeni upisi {list} nestali su zauvijek.',
      capAttach: 'Stari primarni priključuje se uz {np} kao replika, sa zapisima do {k}; ništa se ne odbacuje.',

      // controls
      pReplicas: 'Replike',
      pLag1: 'Zaostatak R1',
      pLag2: 'Zaostatak R2',
      pRead: 'Klijent čita svoj upis',
      pReadHint: 'Pet upisa, zatim čitanje x u 600 ms.',
      pReadFrom: 'Čita s',
      optPrimary: 'primarnog',
      optReplica: 'replike R1',
      pWait: 'Čekaj moj zapis',
      pWaitHint: 'Replika odgovara tek kad primijeni klijentov zadnji upis.',
      pFailAt: 'Primarni pada',
      optNever: 'nikad',
      pPrefer: 'Prednost pri izjednačenju',
      optEqual: 'nijedna',
      pOldBack: 'Stari primarni se vraća',

      // presets
      prSteady: 'Zaostatak',
      prRead: 'Svoj upis',
      prReadHint: 'Uključi „Čekaj moj zapis" i ponovi.',
      prTail: 'Gubi se rep',
      prTwo: 'Dvije replike',
      prOld: 'Povratak',

      // legend
      lgApplied: 'primijenjen',
      lgFlight: 'na putu',
      lgAck: 'potvrđeno',
      lgLost: 'izgubljeno',
      lgDiscarded: 'odbačeno',
      lgStale: 'zastarjelo čitanje',
      lgChanged: 'promijenjeno',

      // sync-async-replication (preset task): synchronous commit, R1 unreachable, block or degrade
      subtitleSync: 'Sinkrono: RPO 0 uz sporije upise; asinkrono: gubitak pri padu',
      syncLine: 'sinkrona · RTT {ms} ms',
      bUnreach: 'nedostupna',
      bDegraded: 'prešao na asinkrono',
      bWaits: '⌛ čeka {list}',
      bAckedSync: '✓ {k} potvrđen nakon {ms} ms',
      bBlocked: '⌛ {k} čeka',
      cellWaits: 'čeka',
      asideAckWait: 'potvrđeno {a}, čeka {w}',
      asideUnreach: 'nedostupna',
      capStartSync: 'Klijent svakih 100 ms upisuje x na primarni. Replika R1 je sinkrona, RTT {rtt} ms (1 ms: ista prostorija; 40 ms: druga lokacija preko WAN-a): ' +
        '*synchronous replication* (sinkrona replikacija). Primarni potvrđuje upis tek kad R1 javi da ga je spremila.',
      capStartDown: 'U {at} ms replika R1 postaje nedostupna.',
      capStartBlock: 'Bez sinkrone replike primarni čeka.',
      capStartDegrade: 'Bez sinkrone replike primarni prelazi na asinkrono.',
      capWriteSync: '{t} ms: *synchronous replication* (sinkrona replikacija): zapis {k} potvrđen je tek kad ga je replika ' +
        'R1 spremila, u {ack} ms. Pad primarnog sada ne gubi ništa — ali svaki upis čeka povratni put do replike, {rtt} ms.',
      capBlocked: '{t} ms: sinkrona replika nije dostupna, pa upisi {list} čekaju potvrdu. Ništa nije izgubljeno, ali se ' +
        'ništa ni ne potvrđuje.',
      capWriteDegraded: '{t} ms: primarni odmah potvrđuje upis {k}, iako ga replika nema: prešao je na asinkrono.',
      capRepUnreach: 'Replika {id} nije dostupna i ne prima ništa; zapisi {list} postoje samo na primarnom.',
      capRate: 'Svaka potvrda trajala je {rtt} ms dulje. Klijent koji čeka svaku potvrdu prije sljedećeg upisa stigne ' +
        'najviše {rate} potvrda u sekundi (1000 / {rtt}).',
      capDownBlock: '{t} ms: replika R1 postaje nedostupna (pala je ona ili veza do nje). Primarni je sinkron, a politika ' +
        'je „čekaj": od sada ne potvrđuje nijedan upis dok se R1 ne vrati.',
      capDownDegrade: '{t} ms: replika R1 postaje nedostupna (pala je ona ili veza do nje). Politika je „prijeđi na ' +
        'asinkrono": primarni nastavlja potvrđivati bez nje. Upisi teku, ali novi zapisi postoje samo na primarnom, i ' +
        'nitko za to ne zna.',
      capFailBlocked: 'Upisi {list} nikad nisu potvrđeni: klijent za njih nije dobio „potvrđeno".',
      capRpo0: 'To je *RPO* 0 (ciljna točka oporavka). Usporedi s primjerom „{tail}": isti pad, asinkrono.',
      capNoLossBlocked: 'Upisi {list} nikad nisu potvrđeni, pa nema izgubljenih potvrđenih podataka.',
      capLostDegraded: 'Klijent je za njih dobio „potvrđeno": {n}, svi upisi otkad je R1 postala nedostupna u {at} ms. I ' +
        'sinkrona replika može zaostajati: uz „prijeđi na asinkrono" zaostaje bez upozorenja.',
      pMode: 'Replika R1',
      optAsync: 'asinkrona',
      optSync: 'sinkrona',
      pRtt: 'RTT do R1',
      pDown: 'R1 nedostupna',
      pOnLost: 'Bez sinkrone replike',
      optBlock: 'čekaj',
      optDegrade: 'prijeđi na asinkrono',
      prSync: 'Sinkrono',
      prSyncHint: 'Usporedi s „Gubi se rep": isti pad, asinkrono.',
      prWan: 'Preko WAN-a',
      prDown: 'Bez replike',
      prDegrade: 'Tiho asinkrono',
      prDegradeHint: 'Isto kao „Bez replike", ali primarni prelazi na asinkrono, a zatim pada.',
      lgWait: 'čeka potvrdu',
      lgConfirm: 'potvrda replike',
      lgBlocked: 'blokirano',

      explain: '<p>Kod asinkrone replikacije [[primary server]] potvrđuje upis čim ga zapiše u svoj ' +
        '<em lang="en">write-ahead log</em> (dnevnik unaprijednog pisanja). Replike primaju iste zapise redom po LSN-u i ' +
        'primjenjuju ih kasnije, nakon <em lang="en">replication lag</em> (zaostatak replikacije). Replika je zato primarni ' +
        'kakav je bio prije nekoliko zapisa, a ne njegova živa kopija.</p>' +
        '<p>Čitanje s replike može vratiti staru vrijednost: <em lang="en">stale read</em> (zastarjelo čitanje). Klijent ' +
        'koji mora vidjeti svoj upis, <em lang="en">read-your-writes</em> (čitanje vlastitih upisa), čita s primarnog ili ' +
        'traži od replike da pričeka njegov LSN. Čekanje traje koliko i zaostatak.</p>' +
        '<p>Kad primarni padne, <em lang="en">failover</em> (preuzimanje) promiče repliku s najvišim primijenjenim LSN-om. ' +
        'Potvrđeni zapisi iznad njega su izgubljeni: klijent je dobio „potvrđeno", a podataka više nema. Gubi se otprilike ' +
        'zadnjih toliko milisekundi upisa koliki je zaostatak.</p>' +
        '<p>Stari primarni koji se vrati ne smije primati upise ni priključiti se takav kakav je: njegovi zapisi iznad ' +
        'novog primarnog sukobljavaju se s novom poviješću. Zato ga se ogradi, <em lang="en">fencing</em> (ograđivanje), ' +
        'pa obnovi iz novog primarnog.</p>' +
        '<p><em lang="en">Synchronous replication</em> (sinkrona replikacija): primarni potvrđuje upis tek kad sinkrona ' +
        'replika javi da ga je spremila. Svaki potvrđeni zapis tada postoji na dva poslužitelja, pa preuzimanje na tu ' +
        'repliku ne gubi ništa: <em lang="en">RPO</em> 0 (ciljna točka oporavka, vidi <a href="../rpo-rto/index.html">RPO ' +
        'i RTO</a>). Nije besplatno: svaki upis čeka <em lang="en">round-trip time</em> (vrijeme povratnog puta) do ' +
        'replike, pa raste [[latency]]. Uz 40 ms do druge lokacije klijent koji čeka svaku potvrdu stigne najviše 25 ' +
        'potvrda u sekundi.</p>' +
        '<p>Kad sinkrona replika nije dostupna, primarni čeka (upisi stoje, ništa se ne gubi) ili prelazi na asinkrono i ' +
        'nastavlja; tada se tiho vraća rizik gubitka, pa i sinkrona replika može zaostajati. A RPO 0 ne štiti od pogrešnog ' +
        'brisanja: replika odmah dobije i brisanje (vidi <a href="../restore-drill/index.html">Kopija koja laže</a>).</p>'
    },

    en: {
      stage: 'A client, the primary and the replicas with records on the wire; below them each server\'s log of records',

      // drawing
      cMark: 'C',
      nClient: 'client',
      nPrimary: 'primary',
      nNewPrimary: 'new primary',
      nReplica: 'replica',
      nOld: 'old primary',
      lagLine: 'lag {ms} ms',
      bDown: 'down',
      bPromoted: 'promoted',
      bRefused: 'refused',
      bBack: 'back',
      bRebuilt: 'rebuilt',
      bAttached: 'attached',
      bFollows: 'follows {id}',
      bAck: 'acknowledged {k}',
      bAcked: '✓ {k} committed',
      bHolds: 'holds the read until {k}',
      ownLine: 'my last write: {k}',
      bubbleWait: 'waiting for {from} to apply {k}…',
      bubbleFresh: 'fresh',
      bubbleStale: 'stale',
      bubbleFrom: 'from {from} at {at} ms',

      // log strips
      gridTitle: 'Write-ahead log (WAL)',
      gridMeta: 'record k sets x = k',
      gridAxis: 'above each column: time written in ms',
      asideDown: 'down',
      asideRefused: 'refused',
      asideBack: 'back',
      ackedN: ['{n} record acknowledged', '{n} records acknowledged'],
      asideNewPrimary: 'new primary',
      asideFollows: 'follows {id}',
      asideNoPrimary: 'no primary',
      behindN: ['{n} record behind', '{n} records behind'],
      level: 'level with the primary',
      brLost: 'lost',
      brExtra: 'not in the new history',
      brDiscarded: 'discarded',
      and: 'and',

      // captions: the start
      repsN: ['{n} replica applies', '{n} replicas apply'],
      capStart: 'Every 100 ms the client writes x to the *primary*, which acknowledges the write at once. {reps} the same ' +
        'records later, after a *replication lag*: {lags}.',
      capStartRead: 'After five writes the client reads x back from replica R1 at {at} ms.',
      capStartReadWait: 'After five writes the client reads x back from replica R1 at {at} ms, asking it to wait for the ' +
        'client\'s last write.',
      capStartReadP: 'After five writes the client reads x back from the primary at {at} ms.',
      capStartFail: 'At {at} ms the primary fails.',
      capStartFailBack: 'At {at} ms the primary fails, and after the failover it comes back.',
      capStartPlain: 'Press → and watch the lag.',

      // captions: a tick
      capWrite: '{t} ms: write {k} reaches the primary, which acknowledges it to the client at once.',
      capClock: '{t} ms: the client writes no more.',
      repApplied: 'Replica {id} applies {list}; it is still {n} behind.',
      repAppliedLevel: 'Replica {id} applies {list} and is level with the primary.',
      repNothing: 'Replica {id} applies nothing new; it is {n} behind.',
      repNothingLevel: 'Replica {id} has every record.',
      repNothingYet: 'Replica {id} has not applied any record yet.',
      capPlainEnd: 'The lag is steady: a replica is always a few records behind the primary, and nothing is broken.',

      // captions: the read
      capReadP: '{at} ms: the client reads x from the primary. The primary has every acknowledged record, so it returns ' +
        '{got}, your write {own}. Reading from the primary always sees your own writes: *read-your-writes*.',
      capReadStale: 'Read from the replica at {at} ms: it has applied up to record {lsn}, so the value you wrote at {ownAt} ms ' +
        'is not there yet. It returns {got}: a *stale read*.',
      capReadFresh: 'Read from the replica at {at} ms: it has applied up to record {lsn}, so your write {own} is there. It ' +
        'returns {got}: with a small lag the replica keeps up.',
      capReadStaleNone: 'Read from the replica at {at} ms: it has not applied any record yet, so the value you wrote at ' +
        '{ownAt} ms is not there. It returns {got}: a *stale read*.',
      capReadHeldNone: 'Read from the replica at {at} ms with "wait for my record {own}": it has not applied any record ' +
        'yet, so it holds the read until it applies {own}.',
      capReadHeld: 'Read from the replica at {at} ms with "wait for my record {own}": it has only applied up to {has}, so it ' +
        'holds the read until it applies {own}.',
      capServed: 'Replica {from} applied record {k} at {at} ms and only then answers: your own write, *read-your-writes*. ' +
        'The wait took {waited} ms.',
      capStillHeld: 'The read still waits for record {k}.',
      capWasStale: 'The read at {at} ms already returned the old {got}.',
      capTooLate: 'Now the replica has your write {own}, too late: the read at {at} ms returned {got}.',

      // captions: the failover
      capFail: '{t} ms: the primary fails. It had acknowledged records up to {k} to the client.',
      capFailRep: 'Replica {id} has records up to {k}; {list} will never reach it now.',
      capFailRepAll: 'Replica {id} has every record, up to {k}.',
      capFailRepNone: 'Replica {id} has no record at all; {list} will never reach it now.',
      capPromote: '*Failover*: replica {id} becomes the new primary.',
      whyOnly: 'It is the only replica.',
      whyHighest: 'It has the highest applied LSN, {k}.',
      whyPrefer: 'Both have LSN {k}; the configured priority breaks the tie.',
      whyLowerId: 'Both have LSN {k}; the lower id breaks the tie.',
      capLost: 'The *primary* acknowledged records {list}, but replica {id} had not applied them yet. After the failover ' +
        'they are lost.',
      capLostOne: 'The *primary* acknowledged record {list}, but replica {id} had not applied it yet. After the failover it ' +
        'is lost.',
      capLostSize: 'The client was told "committed" for them: {n}, about the last {ms} ms of writes.',
      recordsN: ['{n} record', '{n} records'],
      capNoLoss: 'Nothing is lost: replica {id} had applied every acknowledged record.',
      capFollow: 'Replica {id} now follows the new primary {np} and receives records {list} it lacked. It now has records ' +
        'up to {k}.',
      capFollowLevel: 'Replica {id} now follows the new primary {np}; it has the same records, up to {k}.',
      capReturn: 'The old primary comes back with records up to {k}. Records {list} are not in the new history: {np} has ' +
        'records up to {nk}, and its next write will get LSN {next} again. So it is refused: it may neither take writes ' +
        'nor rejoin as it is.',
      capReturnLevel: 'The old primary comes back with records up to {k}, the same as {np}: nothing extra, so it may follow ' +
        '{np} as a replica, never as a second primary.',
      capRebuild: 'The old primary is rebuilt from {np}: records {list} are discarded and it follows {np} as a replica, with ' +
        'records up to {k}. The acknowledged writes {list} are gone for good.',
      capAttach: 'The old primary attaches to {np} as a replica, with records up to {k}; nothing is discarded.',

      // controls
      pReplicas: 'Replicas',
      pLag1: 'Lag of R1',
      pLag2: 'Lag of R2',
      pRead: 'Client reads its write back',
      pReadHint: 'Five writes, then a read of x at 600 ms.',
      pReadFrom: 'Read from',
      optPrimary: 'primary',
      optReplica: 'replica R1',
      pWait: 'Wait for my record',
      pWaitHint: 'The replica answers only once it has applied the client\'s last write.',
      pFailAt: 'Primary fails',
      optNever: 'never',
      pPrefer: 'Priority on a tie',
      optEqual: 'none',
      pOldBack: 'Old primary comes back',

      // presets
      prSteady: 'Steady lag',
      prRead: 'Own write',
      prReadHint: 'Switch on "Wait for my record" and run it again.',
      prTail: 'Lost tail',
      prTwo: 'Two replicas',
      prOld: 'Old returns',

      // legend
      lgApplied: 'applied',
      lgFlight: 'in flight',
      lgAck: 'acknowledged',
      lgLost: 'lost',
      lgDiscarded: 'discarded',
      lgStale: 'stale read',
      lgChanged: 'changed',

      // sync-async-replication (preset task): synchronous commit, R1 unreachable, block or degrade
      subtitleSync: 'Sync: RPO 0 but slower commits; async: loss on failover',
      syncLine: 'synchronous · RTT {ms} ms',
      bUnreach: 'unreachable',
      bDegraded: 'switched to async',
      bWaits: '⌛ waiting {list}',
      bAckedSync: '✓ {k} committed after {ms} ms',
      bBlocked: '⌛ {k} waiting',
      cellWaits: 'waits',
      asideAckWait: '{a} acknowledged, {w} waiting',
      asideUnreach: 'unreachable',
      capStartSync: 'Every 100 ms the client writes x to the primary. Replica R1 is synchronous, RTT {rtt} ms (1 ms: same room; 40 ms: another site over a WAN): ' +
        '*synchronous replication*. The primary acknowledges a write only once R1 reports it has stored it.',
      capStartDown: 'At {at} ms replica R1 becomes unreachable.',
      capStartBlock: 'Without the synchronous replica the primary blocks.',
      capStartDegrade: 'Without the synchronous replica the primary degrades to asynchronous.',
      capWriteSync: '{t} ms: *synchronous replication*: record {k} is acknowledged only once replica R1 has stored it, at ' +
        '{ack} ms. A primary failure now loses nothing, but every write waits a round trip to the replica, {rtt} ms.',
      capBlocked: '{t} ms: the synchronous replica is unreachable, so commits {list} are waiting. Nothing is lost, and ' +
        'nothing is being committed.',
      capWriteDegraded: '{t} ms: the primary acknowledges write {k} at once, although the replica does not have it: it has ' +
        'switched to asynchronous.',
      capRepUnreach: 'Replica {id} is unreachable and receives nothing; records {list} exist only on the primary.',
      capRate: 'Every commit took {rtt} ms longer. A client that waits for each commit before its next write manages at ' +
        'most {rate} commits per second (1000 / {rtt}).',
      capDownBlock: '{t} ms: replica R1 becomes unreachable (it or the link to it failed). The primary is synchronous and ' +
        'the policy is "block": from now on it acknowledges no write until R1 is back.',
      capDownDegrade: '{t} ms: replica R1 becomes unreachable (it or the link to it failed). The policy is "degrade to ' +
        'async": the primary goes on acknowledging without it. Writes continue, but new records exist only on the ' +
        'primary, and nobody is told.',
      capFailBlocked: 'Writes {list} were never acknowledged: the client was never told "committed" for them.',
      capRpo0: 'That is an *RPO* of 0. Compare with the "{tail}" example: the same failure, asynchronous.',
      capNoLossBlocked: 'Writes {list} were never acknowledged, so no acknowledged data is lost.',
      capLostDegraded: 'The client was told "committed" for them: {n}, every write since R1 became unreachable at {at} ms. ' +
        'A synchronous replica can fall behind too: with "degrade to async" it does so without warning.',
      pMode: 'Replica R1',
      optAsync: 'asynchronous',
      optSync: 'synchronous',
      pRtt: 'RTT to R1',
      pDown: 'R1 unreachable',
      pOnLost: 'Without the sync replica',
      optBlock: 'block',
      optDegrade: 'degrade to async',
      prSync: 'Synchronous',
      prSyncHint: 'Compare with "Lost tail": the same failure, asynchronous.',
      prWan: 'Over a WAN',
      prDown: 'Replica gone',
      prDegrade: 'Silent degrade',
      prDegradeHint: 'As "Replica gone", but the primary degrades to async, then fails.',
      lgWait: 'awaits confirmation',
      lgConfirm: 'replica confirms',
      lgBlocked: 'blocked',

      explain: '<p>With asynchronous replication the [[primary server]] acknowledges a write as soon as it is in its own ' +
        '<em lang="en">write-ahead log</em>. The replicas receive the same records in LSN order and apply them later, after ' +
        'the <em lang="en">replication lag</em>. A replica is the primary as it was a few records ago, not a live copy of ' +
        'it.</p>' +
        '<p>A read from a replica can return an old value: a <em lang="en">stale read</em>. A client that must see its own ' +
        'write (<em lang="en">read-your-writes</em>) reads from the primary, or asks the replica to wait for its LSN. The ' +
        'wait lasts as long as the lag.</p>' +
        '<p>When the primary fails, <em lang="en">failover</em> promotes the replica with the highest applied LSN. ' +
        'Acknowledged records above it are lost: the client was told "committed", and the data is gone. About the last lag ' +
        'worth of writes is lost.</p>' +
        '<p>An old primary that comes back must not take writes or rejoin as it is: its records above the new primary ' +
        'conflict with the new history. It is fenced (<em lang="en">fencing</em>) and rebuilt from the new primary.</p>' +
        '<p>With <em lang="en">synchronous replication</em> the primary acknowledges a write only once the synchronous ' +
        'replica reports it has stored it. Every acknowledged record then exists on two servers, so a failover to that ' +
        'replica loses nothing: an <em lang="en">RPO</em> of 0 (see <a href="../rpo-rto/index.html">RPO and RTO</a>). It ' +
        'is not free: every write waits a <em lang="en">round-trip time</em> to the replica, which adds [[latency]]. With ' +
        '40 ms to another site, a client that waits for each commit manages at most 25 commits per second.</p>' +
        '<p>When the synchronous replica is unreachable, the primary either blocks (writes stop, nothing is lost) or ' +
        'degrades to asynchronous and carries on; that silently brings the risk of loss back, so a synchronous replica can ' +
        'fall behind too. And RPO 0 does not protect against a bad delete: the replica gets the delete at once (see ' +
        '<a href="../restore-drill/index.html">The backup that lies</a>).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
