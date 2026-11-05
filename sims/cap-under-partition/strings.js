/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cap-under-partition, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); the terms are
   not in kit/glossary.js yet, so they are written out this way, English term then the Croatian in parentheses at the
   first mention (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title, concept). Replica and client
   ids (A, B, C, K1, K2), values (x = 2), step numbers and W/R/N are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijenti K1 i K2, tri replike ključa x i zahtjevi na putu; ispod njih inačice ključa x na svakoj replici',

      // drawing
      nClient: 'klijent',
      nReplica: 'replika',
      sendsTo: 'šalje na {id}',
      stampStart: 'početna vrijednost',
      stampLine: 'upis {c}, korak {n}',
      bAlone: 'radi, ali sama',
      bDiverged: 'razišla se',
      bBehind: 'zaostaje',
      bCaught: 'sustigla',
      bResolved: 'razriješeno',
      bubbleTimeout: 'isteklo',
      bubbleWritten: 'zapisano',
      bubbleStale: 'zastarjelo',
      wallLabel: 'razdvojeno',

      // version strips
      gridTitle: 'Inačice ključa x na svakoj replici',
      gridMeta: 'stupac = jedan upis, ispod tko ga je poslao',
      colStart: 'početak',

      // captions
      and: 'i',
      capStartCp: 'Tri replike ključa x, svuda x = 1. Način CP: upis uspijeva tek kad ga potvrde W = 2 od 3 replike, ' +
        'čitanje pita R = 2 od 3: to je *quorum* (kvorum).',
      capStartAp: 'Tri replike ključa x, svuda x = 1. Način AP: svaka replika odgovara sama (W = 1, R = 1) i upis šalje ' +
        'dalje onima do kojih dopire.',
      capStartClients: 'K1 šalje zahtjeve repliki A, K2 repliki C.',
      capStartEmpty: 'Gumbi desno dodaju zahtjev, razdvajanje ili spajanje kao sljedeći korak.',
      capPartition: 'Mreža se razdvaja, *network partition* (razdvajanje mreže): A i B, uz klijenta K1, više ne čuju C, ' +
        'uz klijenta K2. Sve tri replike rade; svaka strana vidi samo sebe.',
      capPartitionCp: 'U načinu CP poslužuje samo strana s većinom, 2 od 3.',
      capPartitionAp: 'U načinu AP obje strane i dalje odgovaraju.',
      capWriteAll: '{c} piše {v} preko {s}: sve tri replike ga primaju i potvrđuju. ✓',
      capWriteAllAp: '{c} piše {v} preko {s}: upis je prihvaćen odmah i stiže do sve tri replike. ✓',
      capSame: 'Bez razdvajanja načini CP i AP rade isto.',
      capWriteMajority: '{c} piše {v} preko {s}: potvrđuju {list}, 2 od 3, što je dovoljno za *write quorum* (kvorum ' +
        'pisanja). ✓ Replika {other} ga ne dobiva i zaostaje.',
      capWriteRefused: 'CP: {c} piše {v} preko {s}, ali {s} je sama i skupi samo 1 od 2 potrebne potvrde. ✗ Isteklo: upis ' +
        'se ne primjenjuje nigdje. *Consistent* (dosljedan), ali za klijenta {c} nedostupan.',
      capWriteAp: 'AP: {c} piše {v} preko {s}. Upis je prihvaćen odmah (W = 1) i stiže do {list}. ✓ Do {other} ne stiže.',
      capDiverged: 'Sad obje strane imaju svoj upis: A i B drže {a}, C drži {b}. Replike su se razišle.',
      capReadQuorum: '{c} čita x preko {s}: pita {list} i dobiva najnoviju vrijednost, {v}. ✓ Kad R + W > N, svako ' +
        'čitanje dotakne barem jednu repliku s posljednjim uspjelim upisom.',
      capReadRefused: 'CP: replika {s} je ispravna, ali je sama — ne može skupiti 2 od 3 potvrde, pa odbija čitanje. ✗ ' +
        'Sustav je *consistent* (dosljedan), ali za klijenta {c} nedostupan.',
      capReadAp: '{c} čita x od {s}: odgovara samo {s}, odmah, s {v}. ✓',
      capReadStale: 'AP: {s} odmah odgovara s {v}. Replika je *available* (dostupna), a odgovor je zastario: najnovija ' +
        'vrijednost je {newest}. To je *stale read* (zastarjelo čitanje).',
      capHealNothing: 'Mreža je opet cijela. Tijekom razdvajanja nijedan upis nije uspio: sve tri replike već imaju {v}.',
      capHealCatchup: 'Mreža je opet cijela. Pisala je samo jedna strana, pa nema sukoba: najnovija vrijednost, {v}, ' +
        'stiže do {list}, i sve tri replike su opet jednake.',
      capHealConflict: 'Mreža je opet cijela, a x ima dvije vrijednosti: {a} na A i B (upis {ca}, korak {sa}) i {b} na C ' +
        '(upis {cb}, korak {sb}). Sukob!',
      capLww: 'Pravilo *last write wins* (posljednji upis pobjeđuje) zadržava kasniji, {w}.',
      capLwwTie: 'Oba su iz istog koraka, pa pobjeđuje veći id klijenta, {c}.',
      capLostOne: 'Upis {v} klijenta {c} izgubljen je, iako ga je sustav potvrdio.',
      capLostMany: 'Upisi {v} klijenta {c} izgubljeni su, iako ih je sustav potvrdio.',
      capNoopAlready: 'Mreža je već razdvojena: ovaj korak ništa ne mijenja.',
      capNoopWhole: 'Mreža nije razdvojena: nema se što spojiti.',
      capSumEmpty: 'Još nema zahtjeva: dodaj ih gumbima desno.',
      capSumHead: 'Sažetak, način {mode}.',
      capSumClient: '{c}: {n}, ✓ {ans} (od toga zastarjelo {stale}), ✗ {err}.',
      capSumClientFresh: '{c}: {n}, ✓ {ans}, ✗ {err}.',
      requestsN: ['{n} zahtjev', '{n} zahtjeva', '{n} zahtjeva'],
      capSumCpErr: 'Nijedan odgovor nije zastario, ali zahtjeve klijenta {list} sustav je odbio: ostao je *consistent* ' +
        '(dosljedan), a za tog klijenta nije bio *available* (dostupan).',
      capSumCpOk: 'Nijedan zahtjev nije odbijen i nijedan odgovor nije zastario.',
      capSumCpMyth: 'CP nije „nikad dostupan“: bez razdvajanja i na strani većine odgovara normalno.',
      capSumAp: 'Svaki zahtjev je dobio odgovor, a cijena je {stale} i {lost}.',
      staleN: ['{n} zastarjelo čitanje', '{n} zastarjela čitanja', '{n} zastarjelih čitanja'],
      lostN: ['{n} izgubljen potvrđen upis', '{n} izgubljena potvrđena upisa', '{n} izgubljenih potvrđenih upisa'],
      capSumApClean: 'Svaki zahtjev je dobio odgovor, ovaj put bez zastarjelih čitanja i bez gubitaka.',
      capSumApPending: 'Replike su još razišle: spajanje će zadržati samo jednu stranu, a upise druge izgubiti.',
      capSumApMyth: 'AP ne vraća „uvijek krive podatke“: zastari samo ono što se promijenilo na drugoj strani.',
      noteFull: 'Najviše 20 koraka: vrati se korak unatrag pa dodaj.',

      // legend
      lgReplica: 'replika',
      lgWall: 'razdvajanje',
      lgOk: 'zahtjev ✓',
      lgErr: 'isteklo ✗',
      lgStale: 'zastarjelo',
      lgConflict: 'sukob',
      lgLost: 'izgubljen upis',
      lgMissing: 'nije stigao',
      lgChanged: 'promijenjeno',

      // controls
      pMode: 'Način',
      pModeHint: 'CP: W = 2, R = 2 od 3. AP: W = 1, R = 1.',
      pOps: 'Tijek',
      btnW1: 'K1 piše',
      btnR1: 'K1 čita',
      btnW2: 'K2 piše',
      btnR2: 'K2 čita',
      btnPartition: 'Razdvoji mrežu',
      btnHeal: 'Spoji mrežu',

      // presets
      prNone: 'Bez razdvajanja',
      prNoneHint: 'K1 piše, K2 čita na C: isto u CP i AP',
      prCp: 'CP: većina',
      prCpHint: 'A i B poslužuju, C odbija; pri spajanju C sustiže',
      prAp: 'AP: obje strane',
      prApHint: 'C odgovara zastarjelo i prima upis; pri spajanju sukob',
      prView: 'CP: pogled K2',
      prViewHint: 'Za K2 sustav jednostavno ne radi, iako C radi',

      explain: '<p><b>CAP</b>: kad se mreža razdvoji (<em lang="en">network partition</em>, razdvajanje mreže), sustav s ' +
        'replikama mora izabrati: ili odbija zahtjeve koje ne može dosljedno poslužiti (<em lang="en">consistency</em>, ' +
        'dosljednost), ili odgovara na svaki zahtjev, makar i zastarjelo (<em lang="en">availability</em>, dostupnost).</p>' +
        '<p><b>CP</b> traži <em lang="en">quorum</em> (kvorum): upis potvrđuju W = 2 od 3 replike, čitanje pita R = 2 od 3. ' +
        'Jer je R + W &gt; N, svako čitanje vidi posljednji uspjeli upis. Strana s jednom replikom ne skupi kvorum i ' +
        'vraća grešku.</p>' +
        '<p><b>AP</b> pušta svaku repliku da odgovori sama. Manjinska strana i dalje radi, ali čita staro i prima vlastite ' +
        'upise. Pri spajanju dvije vrijednosti ključa x su sukob; ovdje ga rješava <em lang="en">last write wins</em> ' +
        '(posljednji upis pobjeđuje), pa se jedan potvrđeni upis gubi.</p>' +
        '<p><b>Zablude.</b> „Izaberi bilo koja dva od C, A i P“ (P je <em lang="en">partition tolerance</em>, otpornost na ' +
        'razdvajanje mreže): razdvajanje se ne bira, ono se dogodi; izbor je C ili A <i>za vrijeme</i> razdvajanja. ' +
        '„CP sustavi nikad nisu dostupni“: bez razdvajanja i na strani većine rade normalno. „AP sustavi vraćaju krive ' +
        'podatke“: zastari samo ono što se promijenilo na drugoj strani.</p>' +
        '<p>Gumbi dodaju zahtjev, razdvajanje ili spajanje kao sljedeći korak; koraci iza njega se brišu. Promjena ' +
        'načina zadržava korak, pa isti tijek možeš vidjeti u drugom načinu.</p>'
    },

    en: {
      stage: 'Clients K1 and K2, three replicas of key x and the requests on the wire; below them the versions of x on each replica',

      // drawing
      nClient: 'client',
      nReplica: 'replica',
      sendsTo: 'sends to {id}',
      stampStart: 'initial value',
      stampLine: '{c}\'s write, step {n}',
      bAlone: 'up, but alone',
      bDiverged: 'diverged',
      bBehind: 'behind',
      bCaught: 'caught up',
      bResolved: 'resolved',
      bubbleTimeout: 'timeout',
      bubbleWritten: 'written',
      bubbleStale: 'stale',
      wallLabel: 'partitioned',

      // version strips
      gridTitle: 'Versions of x on each replica',
      gridMeta: 'one column per write, its sender below',
      colStart: 'start',

      // captions
      and: 'and',
      capStartCp: 'Three replicas of key x, x = 1 everywhere. CP mode: a write succeeds only once W = 2 of 3 replicas ' +
        'acknowledge it, and a read asks R = 2 of 3 (a quorum).',
      capStartAp: 'Three replicas of key x, x = 1 everywhere. AP mode: every replica answers alone (W = 1, R = 1) and ' +
        'passes a write on to the replicas it can reach.',
      capStartClients: 'K1 sends its requests to replica A, K2 to replica C.',
      capStartEmpty: 'The buttons on the right add a request, a partition or a heal as the next step.',
      capPartition: 'The network splits (a network partition): A and B, beside client K1, can no longer hear C, beside ' +
        'client K2. All three replicas are up; each side sees only itself.',
      capPartitionCp: 'In CP mode only the side with a majority, 2 of 3, serves.',
      capPartitionAp: 'In AP mode both sides keep answering.',
      capWriteAll: '{c} writes {v} through {s}: all three replicas take it and acknowledge. ✓',
      capWriteAllAp: '{c} writes {v} through {s}: the write is accepted at once and reaches all three replicas. ✓',
      capSame: 'Without a partition CP and AP behave the same.',
      capWriteMajority: '{c} writes {v} through {s}: {list} acknowledge, 2 of 3, which is enough for the write quorum. ✓ ' +
        'Replica {other} does not get it and falls behind.',
      capWriteRefused: 'CP: {c} writes {v} through {s}, but {s} is alone and gathers only 1 of the 2 acknowledgements it ' +
        'needs. ✗ Timeout: the write is applied nowhere. Consistent, but unavailable to client {c}.',
      capWriteAp: 'AP: {c} writes {v} through {s}. The write is accepted at once (W = 1) and reaches {list}. ✓ It does not ' +
        'reach {other}.',
      capDiverged: 'Now both sides have their own write: A and B hold {a}, C holds {b}. The replicas have diverged.',
      capReadQuorum: '{c} reads x through {s}: it asks {list} and gets the newest value, {v}. ✓ With R + W > N every ' +
        'read touches at least one replica with the last successful write.',
      capReadRefused: 'CP: replica {s} is healthy but alone — it cannot gather 2 of 3 answers, so it refuses the read. ✗ ' +
        'The system is consistent, but unavailable to client {c}.',
      capReadAp: '{c} reads x from {s}: {s} alone answers, at once, with {v}. ✓',
      capReadStale: 'AP: {s} answers at once with {v}. It is available, and the answer is out of date: the newest value ' +
        'is {newest} (a stale read).',
      capHealNothing: 'The network is whole again. No write succeeded during the partition: all three replicas already ' +
        'hold {v}.',
      capHealCatchup: 'The network is whole again. Only one side wrote, so there is no conflict: the newest value, {v}, ' +
        'reaches {list}, and all three replicas agree again.',
      capHealConflict: 'The network is whole again, and x has two values: {a} on A and B ({ca}\'s write, step {sa}) and ' +
        '{b} on C ({cb}\'s write, step {sb}). A conflict!',
      capLww: 'Last write wins keeps the later one, {w}.',
      capLwwTie: 'Both are from the same step, so the larger client id wins, {c}.',
      capLostOne: '{c}\'s write {v} is lost, although the system acknowledged it.',
      capLostMany: '{c}\'s writes {v} are lost, although the system acknowledged them.',
      capNoopAlready: 'The network is already partitioned: this step changes nothing.',
      capNoopWhole: 'The network is not partitioned: there is nothing to heal.',
      capSumEmpty: 'No requests yet: add them with the buttons on the right.',
      capSumHead: 'Summary, {mode} mode.',
      capSumClient: '{c}: {n}, ✓ {ans} (of which stale {stale}), ✗ {err}.',
      capSumClientFresh: '{c}: {n}, ✓ {ans}, ✗ {err}.',
      requestsN: ['{n} request', '{n} requests'],
      capSumCpErr: 'No answer was stale, but the system refused {list}\'s requests: it stayed consistent, and was not ' +
        'available to that client.',
      capSumCpOk: 'No request was refused and no answer was stale.',
      capSumCpMyth: 'CP is not "never available": without a partition, and on the majority side, it answers normally.',
      capSumAp: 'Every request got an answer, at the cost of {stale} and {lost}.',
      staleN: ['{n} stale read', '{n} stale reads'],
      lostN: ['{n} lost acknowledged write', '{n} lost acknowledged writes'],
      capSumApClean: 'Every request got an answer, this time with no stale read and no loss.',
      capSumApPending: 'The replicas are still diverged: a heal will keep only one side and lose the other side\'s writes.',
      capSumApMyth: 'AP does not "always return wrong data": only what changed on the other side goes stale.',
      noteFull: 'At most 20 steps: step back, then add.',

      // legend
      lgReplica: 'replica',
      lgWall: 'partition',
      lgOk: 'request ✓',
      lgErr: 'timeout ✗',
      lgStale: 'stale',
      lgConflict: 'conflict',
      lgLost: 'lost write',
      lgMissing: 'not received',
      lgChanged: 'changed',

      // controls
      pMode: 'Mode',
      pModeHint: 'CP: W = 2, R = 2 of 3. AP: W = 1, R = 1.',
      pOps: 'Run',
      btnW1: 'K1 writes',
      btnR1: 'K1 reads',
      btnW2: 'K2 writes',
      btnR2: 'K2 reads',
      btnPartition: 'Partition',
      btnHeal: 'Heal',

      // presets
      prNone: 'No partition',
      prNoneHint: 'K1 writes, K2 reads at C: the same in CP and AP',
      prCp: 'CP: majority',
      prCpHint: 'A and B serve, C refuses; at the heal C catches up',
      prAp: 'AP: both sides',
      prApHint: 'C answers stale and takes a write; a conflict at the heal',
      prView: 'CP: K2\'s view',
      prViewHint: 'For K2 the system is simply down, although C is up',

      explain: '<p><b>CAP</b>: when the network splits (a network partition), a replicated system has to choose: refuse the ' +
        'requests it cannot serve consistently (consistency), or answer every request, even with old data ' +
        '(availability).</p>' +
        '<p><b>CP</b> needs a quorum: W = 2 of 3 replicas acknowledge a write, a read asks R = 2 of 3. Because R + W &gt; ' +
        'N, every read sees the last successful write. A side with one replica cannot gather a quorum and returns an ' +
        'error.</p>' +
        '<p><b>AP</b> lets every replica answer alone. The minority side keeps working, but reads old data and takes its ' +
        'own writes. At the heal the two values of x are a conflict; here last write wins resolves it, so one ' +
        'acknowledged write is lost.</p>' +
        '<p><b>Misconceptions.</b> "Pick any two of C, A and P" (P is partition tolerance): a partition is not chosen, it happens; the choice is C or ' +
        'A <i>during</i> a partition. "CP systems are never available": without a partition, and on the majority side, ' +
        'they work normally. "AP systems return wrong data": only what changed on the other side goes stale.</p>' +
        '<p>The buttons add a request, a partition or a heal as the next step; the steps after it are dropped. Changing ' +
        'the mode keeps the step, so the same run can be watched in the other mode.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
