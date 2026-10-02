/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the web server Amdahl page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). English text adapted from
   single-page-labs/webserver-amdahl.html (made generic, numbers corrected: NOTES.md); Croatian written for simdeck.
   Terms missing from kit/glossary.js (speedup, bottleneck, bandwidth, serial fraction) are written out here:
   NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Amdahlov zakon na web zahtjevu: dijelovi, ubrzanje i graf',
      // the request's components
      network: 'Mrežni U/I',
      database: 'Baza podataka',
      cpu: 'Logika aplikacije',
      disk: 'Diskovni U/I',
      cache: 'Predmemorija aplikacije',
      // presets
      presetBaseline: 'Početno stanje',
      presetBaselineHint: 'Tipičan zahtjev web poslužitelju, ništa još nije ubrzano',
      presetNet10: 'Mreža 10×',
      presetNet10Hint: 'Najveći dio (45 %) deset puta brži',
      presetDb10: 'Baza 10×',
      presetDb10Hint: 'Upiti iz predmemorije: baza (25 %) deset puta brža',
      presetCpu10: 'Logika 10×',
      presetCpu10Hint: 'Prevedeni jezik: logika (15 %) deset puta brža',
      presetDisk50: 'Disk 50×',
      presetDisk50Hint: 'Flash umjesto rotirajućeg diska: disk (10 %) pedeset puta brži',
      presetCache100: 'Predmemorija 100×',
      presetCache100Hint: 'Predmemorija u procesu: najmanji dio (5 %) sto puta brži',
      presetNetDb10: 'Mreža i baza 10×',
      presetNetDb10Hint: 'Oba velika dijela deset puta brža',
      // controls
      sel: 'Dio zahtjeva',
      selHint: 'Ili klikni redak na pozornici.',
      frac: 'Udio vremena: {name}',
      speed: 'Ubrzanje: {name}',
      // legend
      legendBefore: 'vrijeme prije',
      legendAfter: 'vrijeme poslije, ubrzani dio',
      legendSerial: 'nepromijenjeni (serijski) dio',
      // stage
      meterSpeedup: 'Ukupno ubrzanje',
      meterSpeedupSub: 'zahtjev je {p} brži',
      meterSpeedupNone: 'ništa još nije ubrzano',
      meterSerial: 'Serijski udio',
      meterSerialSub: 'dijelovi koji nisu ubrzani',
      meterCeiling: 'Granica (n → ∞)',
      meterCeilingSub: 'prijeđeno {p} puta do granice',
      meterCeilingNone: 'nema serijskog dijela',
      timeTitle: 'Vrijeme zahtjeva po dijelovima (prije = 100 %)',
      total: 'Ukupno',
      bottleneck: 'usko grlo',
      partLabel: 'Dio {i}: {name}, udio {share}, ubrzanje {speed}',
      sumOk: 'Zbroj udjela: 100 %',
      sumScaled: 'Zbroj udjela: {sum}, preračunato na 100 %',
      chartTitle: 'Ubrzanje prema faktoru poboljšanja',
      axisN: 'faktor poboljšanja n (ili broj procesora)',
      lineAmdahl: 'Amdahl, s = {s}',
      lineIdeal: 'idealno, S = n',
      lineCeiling: 'granica {v}',
      point: 'sada: {v}',
      pct: '{v} %',
      infinity: '∞',
      noteLimit: 'Da {name} ne traje nimalo, a ostalo ostane kako je sada, zahtjev bi bio najviše {v} brži.',
      noteNoLimit: 'Da {name} ne traje nimalo, a ostalo ostane kako je sada, ubrzanje ne bi imalo granicu.',
      // the counter-intuitive effect of each component, shown under the stage for the selected one
      counterNetwork: 'Veća širina pojasa ne smanjuje latenciju: zahtjev dalekom klijentu i dalje čeka svaki povratni put. Ni više paralelnih veza nije uvijek brže: uspostava veza i spori početak prijenosa mogu pojesti dobitak.',
      counterDatabase: 'Više replika baze ne pomaže kad je posla za pisanje mnogo: svako pisanje mora stići do svake replike, pa repliciranje može pojesti dobitak od raspodijeljenog čitanja.',
      counterCpu: 'Više jezgri ne ubrzava zahtjev koji uglavnom čeka ulaz i izlaz: s logikom na 15 %, dvostruko brži procesor daje 1,08×, ne 2×.',
      counterDisk: 'Veća propusnost diska ne pomaže kad je usko grlo vrijeme pristupa: mnogo malih nasumičnih čitanja ovisi o broju operacija u sekundi, ne o MB/s.',
      counterCache: 'Više čvorova predmemorije ne ubrzava jedno traženje: svaki ključ i dalje živi na jednom čvoru, pa jako tražen ključ ostaje usko grlo.',
      // captions
      captionNone: 'Ništa nije ubrzano: {s}. Odaberi dio zahtjeva i povećaj mu ubrzanje.',
      captionSome: 'Ukupno {s}. Ubrzani dijelovi uzimali su {improved} vremena, ostalih {serial} ostaje isto, pa ubrzanje ne može prijeći {ceiling}.',
      captionAll: 'Ukupno {s}. Ubrzani su svi dijelovi, nema serijskog dijela, pa nema ni granice.',
      captionBottleneck: 'Usko grlo sada je {name}: {share} novog vremena.',
      explain:
        '<h3>Zakon na jednom zahtjevu</h3>' +
        '<p>Zahtjev web poslužitelju troši vrijeme u pet dijelova. Svaki ima svoj udio vremena <i>fᵢ</i> i svoje ubrzanje <i>sᵢ</i>: ' +
        '<code>S = 1 / Σ ( fᵢ / sᵢ )</code>. <em lang="en">Speedup</em> (ubrzanje) ograničava dio koji nije ubrzan: s <em lang="en">serial fraction</em> ' +
        '(serijski udio) <i>s</i> ni beskonačno ubrzanje ostalog ne daje više od <i>1/s</i>.</p>' +
        '<p>Web poslužitelj uglavnom čeka ulaz i izlaz (mreža, baza, disk), a malo računa. Zato velik dobitak daju samo veliki dijelovi, ' +
        'a dio koji uzima najviše novog vremena je <em lang="en">bottleneck</em> (usko grlo).</p>' +
        '<h3>Primjeri s početnim udjelima</h3>' +
        '<p>Mreža 10×: <code>1 / (0,045 + 0,55) = 1,68×</code>, granica 1,82×. Baza 10×: 1,29×, granica 1,33×. ' +
        'Logika 10×: <code>1 / (0,85 + 0,015) = 1,16×</code>, granica 1,18×. Disk 50×: 1,11×, granica 1,11×. ' +
        'Predmemorija 100×: 1,05×, granica 1,05×. Mreža i baza 10×: <code>1 / (0,045 + 0,025 + 0,30) = 2,70×</code>, granica 3,33×.</p>' +
        '<h3>1 · Mrežni U/I (45 %)</h3>' +
        '<p>Čitanje zahtjeva i pisanje odgovora: kopiranje podataka između jezgre i aplikacije, obrada TCP/IP-a, čekanje potvrda od klijenta ' +
        'i izmjena konteksta. Vrijeme raste s količinom podataka i s [[latency]] mreže.</p>' +
        '<p>Poboljšanja: slanje bez kopiranja (jezgra šalje datoteku ravno u vezu), više tokova kroz jednu vezu (HTTP/2), brža veza, ' +
        'sažimanje odgovora (procesor za mrežu), kopije sadržaja blizu klijenata. Dobitak je najveći jer je dio najveći. ' +
        'Cijena: širina pojasa i latencija su različite stvari, a brža mrežna kartica ne skraćuje put do dalekog klijenta.</p>' +
        '<h3>2 · Baza podataka (25 %)</h3>' +
        '<p>Vrijeme koje poslužitelj čeka bazu: slanje upita, izvođenje, prijenos rezultata. Često ga ne troše spori upiti, nego otvaranje veza, ' +
        'povratni put do baze, zaključavanje redaka i mnogo malih upita umjesto jednog.</p>' +
        '<p>Poboljšanja: zajednički skup otvorenih veza, rezultati upita spremljeni u memoriju kao [[cache]], replike za čitanje, indeksi ' +
        '(pretraga cijele tablice postaje traženje u stablu), jedan skupni upit umjesto N malih. ' +
        'Cijena: podaci u predmemoriji zastarijevaju, a znati kad ih poništiti teško je.</p>' +
        '<h3>3 · Logika aplikacije (15 %)</h3>' +
        '<p>Kod aplikacije: usmjeravanje zahtjeva, poslovna logika, predlošci, pretvorba u JSON, provjera korisnika i ulaza. Na tipičnom ' +
        'poslužitelju to je samo 15 % vremena.</p>' +
        '<p>Poboljšanja: prevedeni jezik umjesto interpretiranog, više jezgri za neovisne zahtjeve, pamćenje izračunatih rezultata, ' +
        'neblokirajući rad (više zahtjeva u sekundi, ista latencija), bolji algoritam. ' +
        'Cijena: prepisivanje u brži jezik traje mjesecima, a i beskonačno brža logika daje najviše 1,18×.</p>' +
        '<h3>4 · Diskovni U/I (10 %)</h3>' +
        '<p>Čitanje statičnih datoteka, pisanje dnevnika, čitanje konfiguracije. Rotirajući disk treba nekoliko milisekundi za nasumičan pristup, ' +
        'flash desetinku milisekunde ili manje; datoteke koje sustav drži u memoriji čitaju se gotovo trenutno.</p>' +
        '<p>Poboljšanja: brža pohrana, više memorije za priručnu memoriju datoteka, asinkrono čitanje, statični sadržaj s kopija blizu klijenata, ' +
        'skupno pisanje dnevnika. Cijena: veća propusnost ne pomaže ako je problem vrijeme pristupa.</p>' +
        '<h3>5 · Predmemorija aplikacije (5 %)</h3>' +
        '<p>Traženja u poslužitelju predmemorije: pretvorba ključeva, povratni put do njega, zaključavanje da ne krene mnogo istih promašaja odjednom. ' +
        'Pogodak je brz, a promašaj pada na bazu.</p>' +
        '<p>Poboljšanja: najtraženiji ključevi u memoriji samog procesa, više traženja u jednom povratnom putu, bolji ključevi i duže trajanje, ' +
        'predmemorija na istom računalu. Cijena: duže trajanje znači dulje zastarjele podatke. ' +
        'I sto puta brža, predmemorija s 5 % vremena daje samo 1,05×: mali dijelovi daju mali dobitak, koliko god ih ubrzali.</p>' +
        '<h3>Što je stvarno brže</h3>' +
        '<p>Ovdje se mjeri vrijeme jednog zahtjeva. Druga je mjera [[throughput]], broj zahtjeva u sekundi: neblokirajući rad i asinkroni ' +
        'ulaz i izlaz povećavaju propusnost, a jedan zahtjev time ne postaje brži.</p>'
    },
    en: {
      stage: 'Amdahl\'s law on a web request: parts, speedup and chart',
      network: 'Network I/O',
      database: 'Database',
      cpu: 'Application logic',
      disk: 'Disk I/O',
      cache: 'Application cache',
      presetBaseline: 'Baseline',
      presetBaselineHint: 'A typical web server request, nothing sped up yet',
      presetNet10: 'Network 10×',
      presetNet10Hint: 'The largest part (45%) ten times faster',
      presetDb10: 'Database 10×',
      presetDb10Hint: 'Cached queries: the database (25%) ten times faster',
      presetCpu10: 'Logic 10×',
      presetCpu10Hint: 'A compiled language: the logic (15%) ten times faster',
      presetDisk50: 'Disk 50×',
      presetDisk50Hint: 'Flash instead of a spinning disk: the disk (10%) fifty times faster',
      presetCache100: 'Cache 100×',
      presetCache100Hint: 'An in-process cache: the smallest part (5%) a hundred times faster',
      presetNetDb10: 'Network and database 10×',
      presetNetDb10Hint: 'Both large parts ten times faster',
      sel: 'Request part',
      selHint: 'Or click a row on the stage.',
      frac: 'Time fraction: {name}',
      speed: 'Speedup: {name}',
      legendBefore: 'time before',
      legendAfter: 'time after, sped-up part',
      legendSerial: 'unchanged (serial) part',
      meterSpeedup: 'Overall speedup',
      meterSpeedupSub: 'the request is {p} faster',
      meterSpeedupNone: 'nothing sped up yet',
      meterSerial: 'Serial fraction',
      meterSerialSub: 'parts not sped up',
      meterCeiling: 'Ceiling (n → ∞)',
      meterCeilingSub: '{p} of the way to the ceiling',
      meterCeilingNone: 'nothing is serial',
      timeTitle: 'Request time per part (before = 100%)',
      total: 'Total',
      bottleneck: 'bottleneck',
      partLabel: 'Part {i}: {name}, fraction {share}, speedup {speed}',
      sumOk: 'Sum of fractions: 100%',
      sumScaled: 'Sum of fractions: {sum}, scaled to 100%',
      chartTitle: 'Speedup vs. improvement factor',
      axisN: 'improvement factor n (or number of processors)',
      lineAmdahl: 'Amdahl, s = {s}',
      lineIdeal: 'ideal, S = n',
      lineCeiling: 'ceiling {v}',
      point: 'now: {v}',
      pct: '{v}%',
      infinity: '∞',
      noteLimit: 'If {name} took no time at all, and the rest stayed as it is now, the request would be at most {v} faster.',
      noteNoLimit: 'If {name} took no time at all, and the rest stayed as it is now, the speedup would have no ceiling.',
      counterNetwork: 'More bandwidth does not cut latency: a request to a far-away client still waits for every round trip. Nor are more parallel connections always faster: setting them up and the slow start of each can eat the gain.',
      counterDatabase: 'More database replicas do not help a write-heavy workload: every write must reach every replica, so replication can eat what the spread-out reads gain.',
      counterCpu: 'More cores do not speed up a request that mostly waits for I/O: with the logic at 15%, a CPU twice as fast gives 1.08×, not 2×.',
      counterDisk: 'More disk bandwidth does not help when access time is the bottleneck: many small random reads depend on operations per second, not on MB/s.',
      counterCache: 'More cache nodes do not speed up a single lookup: each key still lives on one node, so a heavily requested key stays a bottleneck.',
      captionNone: 'Nothing is sped up: {s}. Pick a request part and raise its speedup.',
      captionSome: 'Overall {s}. The sped-up parts took {improved} of the time; the other {serial} stays the same, so the speedup cannot pass {ceiling}.',
      captionAll: 'Overall {s}. Every part is sped up, nothing is serial, so there is no ceiling.',
      captionBottleneck: 'The bottleneck is now {name}: {share} of the new time.',
      explain:
        '<h3>The law on one request</h3>' +
        '<p>A request to a web server spends its time in five parts. Each has its own time fraction <i>fᵢ</i> and its own speedup <i>sᵢ</i>: ' +
        '<code>S = 1 / Σ ( fᵢ / sᵢ )</code>. The speedup is limited by the part that is not sped up: with a serial fraction <i>s</i>, ' +
        'even an infinite speedup of the rest gives no more than <i>1/s</i>.</p>' +
        '<p>A web server mostly waits for I/O (network, database, disk) and computes little. So only the large parts give a large gain, ' +
        'and the part that takes most of the new time is the bottleneck.</p>' +
        '<h3>Examples with the starting fractions</h3>' +
        '<p>Network 10×: <code>1 / (0.045 + 0.55) = 1.68×</code>, ceiling 1.82×. Database 10×: 1.29×, ceiling 1.33×. ' +
        'Logic 10×: <code>1 / (0.85 + 0.015) = 1.16×</code>, ceiling 1.18×. Disk 50×: 1.11×, ceiling 1.11×. ' +
        'Cache 100×: 1.05×, ceiling 1.05×. Network and database 10×: <code>1 / (0.045 + 0.025 + 0.30) = 2.70×</code>, ceiling 3.33×.</p>' +
        '<h3>1 · Network I/O (45%)</h3>' +
        '<p>Reading the request and writing the response: copying data between the kernel and the application, TCP/IP processing, waiting for ' +
        'the client\'s acknowledgements and context switches. The time grows with the amount of data and with the network\'s [[latency]].</p>' +
        '<p>Improvements: sending without a copy (the kernel sends a file straight to the connection), several streams over one connection (HTTP/2), ' +
        'a faster link, compressing the response (CPU traded for network), copies of the content close to the clients. The gain is the largest ' +
        'because the part is the largest. The cost: bandwidth and latency are different things, and a faster network card does not shorten the ' +
        'path to a far-away client.</p>' +
        '<h3>2 · Database (25%)</h3>' +
        '<p>The time the server waits for the database: sending the query, running it, transferring the results. Often it is not spent on slow ' +
        'queries but on opening connections, the round trip to the database, row locks and many small queries instead of one.</p>' +
        '<p>Improvements: a shared pool of open connections, query results in an in-memory [[cache]], read replicas, indexes (a full table scan ' +
        'becomes a tree lookup), one batched query instead of N small ones. The cost: cached data goes stale, and knowing when to invalidate it is hard.</p>' +
        '<h3>3 · Application logic (15%)</h3>' +
        '<p>The application\'s code: routing the request, business logic, templates, converting to JSON, checking the user and the input. On a ' +
        'typical server this is only 15% of the time.</p>' +
        '<p>Improvements: a compiled language instead of an interpreted one, more cores for independent requests, remembering computed results, ' +
        'non-blocking work (more requests per second, the same latency), a better algorithm. The cost: a rewrite in a faster language takes months, ' +
        'and even infinitely fast logic gives at most 1.18×.</p>' +
        '<h3>4 · Disk I/O (10%)</h3>' +
        '<p>Reading static files, writing logs, reading configuration. A spinning disk needs a few milliseconds for a random access, flash a tenth ' +
        'of a millisecond or less; files the system keeps in memory are read almost at once.</p>' +
        '<p>Improvements: faster storage, more memory for the file cache, asynchronous reads, static content from copies close to the clients, ' +
        'batched log writes. The cost: more bandwidth does not help when access time is the problem.</p>' +
        '<h3>5 · Application cache (5%)</h3>' +
        '<p>Lookups in the cache server: converting keys, the round trip to it, locking so that many identical misses do not start at once. ' +
        'A hit is fast, and a miss falls through to the database.</p>' +
        '<p>Improvements: the most requested keys in the process\'s own memory, several lookups in one round trip, better keys and longer lifetimes, ' +
        'a cache on the same machine. The cost: a longer lifetime means data stays stale longer. ' +
        'Even a hundred times faster, a cache with 5% of the time gives only 1.05×: small parts give small gains, however much they are sped up.</p>' +
        '<h3>What is really faster</h3>' +
        '<p>This page measures the time of one request. Another measure is [[throughput]], requests per second: non-blocking work and asynchronous ' +
        'I/O raise the throughput, and one request does not get faster from it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
