/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of retry-storm, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder (numbers are formatted by the
   page, with the decimal comma on the Croatian page). *word* marks an English term in italics on the Croatian page (the
   page turns it into <em lang="en">); the terms are missing from kit/glossary.js and written out this way, English term
   then the Croatian in parentheses at the first mention (NOTES.md, "Term pairs"). The title and subtitle come from
   sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijenti, API i baza; po taktu opterećenje baze (izvorni zahtjevi i ponovni pokušaji) prema kapacitetu i p99 baze prema isteku vremena',
      dec: ',',

      capacity: 'Kapacitet baze C',
      perSec: '{n}/s',
      cap1015: '10 → 15/s',
      retryFactor: 'Ponovni pokušaji',
      retry0: 'bez',
      retryHalf: '0,5 (odgoda)',
      retry3: '3 (odmah)',
      spikeAt: 'Nalet (14/s, jedan takt)',
      spikeNone: 'bez',
      spikeTick2: 'u taktu 2',
      shed: 'Kontrola prijema (odbija 80 %)',
      shedOff: 'bez',
      shedFrom5: 'od takta 5',
      shed56: 'taktovi 5–6',

      presetCollapse: 'Kolaps',
      presetCollapseHint: 'C 10: 9 → 36/s i ostaje',
      presetPrevented: 'Kapacitet 15',
      presetPreventedHint: 'C 15 od početka: p99 0,77 s',
      presetTooLate: 'Prekasno 15',
      presetTooLateHint: 'C 15 u taktu 5: i dalje zasićeno',
      presetShedForever: 'Odbijanje stalno',
      presetShedForeverHint: '80 % od takta 5: oporavak uz trajno odbijanje',
      presetMetastable: 'Metastabilno',
      presetMetastableHint: 'Nalet od jednog takta, kolaps ostaje',
      presetGentler: 'Blaže ponavljanje',
      presetGentlerHint: '0,5: 13,5/s, bez kolapsa',
      presetShedBrief: 'Odbijanje 2 takta',
      presetShedBriefHint: 'Taktovi 5–6: natrag na 9/s',

      legOriginal: 'izvorni zahtjevi',
      legRetries: 'ponovni pokušaji',
      legShed: 'odbijeno',
      legCapacity: 'kapacitet',
      legTimeout: 'istek vremena',
      legSaturated: 'zasićeno, p99 ∞',
      legEvent: 'zahvat',
      legChanged: 'upravo izračunat takt',

      clients: 'Klijenti',
      api: 'API',
      db: 'Baza',
      gate: 'Kontrola prijema',
      demand: 'šalju {d}/s',
      timeoutIs: 'istek {t} s',
      retries: 'ponavlja ×{m}',
      noRetries: 'bez ponavljanja',
      gateOff: 'propušta sve',
      gateOn: 'odbija {x}/s',
      dbCap: 'C {c}/s · ρ {rho}',
      dbP99: 'p99 {p} s',
      dbSat: 'zasićena: p99 ∞',
      dbIdle: 'C {c}/s',
      split: '{o} + {r}',
      axisLambda: 'Opterećenje baze λ (zahtjeva/s)',
      axisP99: 'p99 baze (s)',
      tick: 'takt',
      capLine: 'C {c}',
      timeoutLine: 'istek',
      evSpike: 'nalet',
      evCapacity: 'C {c}',
      evShedOn: 'odbija {pct}',
      evShedOff: 'kraj',

      capStart: 'Klijenti šalju {base} zahtjeva/s kroz API bazi kapaciteta {c}/s. API čeka odgovor najviše {t} s, *timeout* (istek vremena), a onda šalje zahtjev ponovno, *retry* (ponovni pokušaj). Pritisni → za takt 0.',
      capTick: 'Takt {k}:',
      cSpike: 'nalet, klijenti šalju {d}/s umjesto {base}.',
      cCapacity: 'kapacitet baze podignut je na {c}/s.',
      cShedOn: 'uključena je *admission control* (kontrola prijema): baza odbija {pct} ponuđenog opterećenja.',
      cShedOff: 'kontrola prijema je isključena.',
      cFirst: 'Nema prošlog takta, pa nema ni ponavljanja.',
      cNoRetry: 'p99 prošlog takta {p} s nije iznad isteka: bez ponavljanja.',
      cRetry: 'p99 prošlog takta {p} s iznad je isteka: API ponavlja, ×{m}.',
      cRetrySat: 'Baza je u prošlom taktu bila zasićena: API ponavlja, ×{m}.',
      cRetryOff: 'p99 prošlog takta iznad je isteka, ali API ne ponavlja.',
      cLoad: 'Baza dobiva {l}/s ({o} izvornih + {r} ponovljenih), ρ {rho}:',
      cLoadPlain: 'Baza dobiva {l}/s, ρ {rho}:',
      cSat: 'zasićena, p99 je neograničen.',
      cP99: 'p99 {p} s.',
      sStuck: 'Nalet je trajao jedan takt, ali ponovni pokušaji su ostali: baza sada dobiva {l} zahtjeva u sekundi umjesto {base} i ne može se sama oporaviti.',
      sStorm: 'Nalet nije ni potreban: već {base}/s daje p99 iznad isteka, a ponavljanja drže bazu u zasićenju.',
      sOverload: 'Sama potražnja veća je od kapaciteta: baza je zasićena i bez ponavljanja.',
      sTooLate: 'Kapacitet je podignut na {c}/s, ali ne pomaže: pojačana potražnja od {l}/s i dalje je veća od njega.',
      sShedding: 'Kontrola prijema spušta λ ispod kapaciteta: p99 pada, a s njim u sljedećem taktu i ponavljanja.',
      sShedHealthy: 'Baza je zdrava, ali kontrola prijema i dalje odbija {x}/s: klijentima prolazi samo {ok} od {base} zahtjeva/s.',
      sRecovered: 'Odbijanje {pct} zahtjeva tijekom dva takta ispraznilo je ponavljanja; potražnja je opet {base}/s i baza je ponovno zdrava.',
      sOverTimeout: 'Baza nije zasićena, ali p99 ostaje iznad isteka, pa ponavljanja ne prestaju.',
      sSlowNoRetry: 'p99 je iznad isteka, ali API ne ponavlja, pa opterećenje ostaje {l}/s.',
      sBreach: 'p99 je iznad isteka: u sljedećem taktu API ponavlja.',
      sHealthy: 'Sustav je stabilan.',

      explain:
        '<p>Klijenti šalju zahtjeve API-ju, a API za svaki zove bazu, usko grlo. API čeka odgovor najviše 1 s, ' +
        '<em lang="en">timeout</em> (istek vremena), a onda poziv šalje ponovno, <em lang="en">retry</em> (ponovni pokušaj). ' +
        'U ovom modelu API gleda p99 baze iz prošlog takta: ako je iznad isteka, šalje do 1 + <var>r</var> poziva po ' +
        'zahtjevu, gdje je <var>r</var> broj ponovnih pokušaja, razmjerno tome koliko je istek probijen.</p>' +
        '<p>Tako nastaje petlja: spora baza → istek → ponavljanja → veće opterećenje → još sporija baza. To je ' +
        '<em lang="en">retry storm</em> (oluja ponovnih pokušaja). Sustav ima dva stabilna stanja: uz 9/s zdrav, a uz ' +
        'ponavljanja 36/s i zasićen. Kratki nalet ga gurne u loše stanje i on ostaje ondje i kad nalet prođe: ' +
        '<em lang="en">metastable failure</em> (metastabilni kvar; Bronson i sur., 2021).</p>' +
        '<p>Tri zablude. „Ponovni pokušaji čine sustav pouzdanijim”: za rijetke, nepovezane greške da, ali pod ' +
        'preopterećenjem samo umnože opterećenje. „Kad nalet prođe, sustav se oporavi sam”: ne, ponavljanja ga drže dolje. ' +
        '„Dodaj kapacitet i problem nestaje”: 15/s sprječava kolaps na početku, ali nakon kolapsa baza dobiva 36/s.</p>' +
        '<p>Izlazi. <em lang="en">Backoff</em> (odgoda) i <em lang="en">jitter</em> (slučajni pomak) razmiču ponovne ' +
        'pokušaje, pa ih u istom trenutku stiže manje; ovdje je to manji broj ponovnih pokušaja (0,5 umjesto 3). ' +
        '<em lang="en">Admission control</em> (kontrola prijema) ili <em lang="en">load shedding</em> (odbacivanje ' +
        'opterećenja) odbija dio zahtjeva na ulazu, prije nego što zauzmu bazu: λ pada ispod kapaciteta, p99 ispod isteka, ' +
        'a ponavljanja nestaju. Uz kapacitet 15/s dovoljna su dva takta; uz 10/s već samih 9/s probija istek, pa se oluja ' +
        'vraća. Ostane li uključena, trajno odbija i zdrave zahtjeve.</p>' +
        '<p>Pojednostavljenja: svaki takt računa se iznova iz <var>λ</var> i <var>C</var>, bez reda koji se prenosi u ' +
        'sljedeći takt, a p99 je formula M/M/1 iz simulatora o iskorištenosti: p99 = ln 100 / (<var>C</var> − <var>λ</var>), ' +
        'neograničen za <var>ρ</var> ≥ 1.</p>'
    },
    en: {
      stage: 'Clients, API and database; per tick the database load (original requests and retries) against capacity, and the database p99 against the timeout',
      dec: '.',

      capacity: 'Database capacity C',
      perSec: '{n}/s',
      cap1015: '10 → 15/s',
      retryFactor: 'Retries',
      retry0: 'none',
      retryHalf: '0.5 (backoff)',
      retry3: '3 (at once)',
      spikeAt: 'Spike (14/s, one tick)',
      spikeNone: 'none',
      spikeTick2: 'at tick 2',
      shed: 'Admission control (turns away 80 %)',
      shedOff: 'off',
      shedFrom5: 'from tick 5',
      shed56: 'ticks 5–6',

      presetCollapse: 'Collapse',
      presetCollapseHint: 'C 10: 9 → 36/s and it stays',
      presetPrevented: 'Capacity 15',
      presetPreventedHint: 'C 15 from the start: p99 0.77 s',
      presetTooLate: '15, too late',
      presetTooLateHint: 'C 15 at tick 5: still saturated',
      presetShedForever: 'Shed for good',
      presetShedForeverHint: '80 % from tick 5: recovered, turning away for good',
      presetMetastable: 'Metastable',
      presetMetastableHint: 'A one-tick spike, the collapse stays',
      presetGentler: 'Gentler retries',
      presetGentlerHint: '0.5: 13.5/s, no collapse',
      presetShedBrief: 'Shed two ticks',
      presetShedBriefHint: 'Ticks 5–6: back to 9/s',

      legOriginal: 'original requests',
      legRetries: 'retries',
      legShed: 'turned away',
      legCapacity: 'capacity',
      legTimeout: 'timeout',
      legSaturated: 'saturated, p99 ∞',
      legEvent: 'intervention',
      legChanged: 'tick just computed',

      clients: 'Clients',
      api: 'API',
      db: 'Database',
      gate: 'Admission control',
      demand: 'send {d}/s',
      timeoutIs: 'timeout {t} s',
      retries: 'retries ×{m}',
      noRetries: 'no retries',
      gateOff: 'lets all in',
      gateOn: 'turns away {x}/s',
      dbCap: 'C {c}/s · ρ {rho}',
      dbP99: 'p99 {p} s',
      dbSat: 'saturated: p99 ∞',
      dbIdle: 'C {c}/s',
      split: '{o} + {r}',
      axisLambda: 'Database load λ (requests/s)',
      axisP99: 'Database p99 (s)',
      tick: 'tick',
      capLine: 'C {c}',
      timeoutLine: 'timeout',
      evSpike: 'spike',
      evCapacity: 'C {c}',
      evShedOn: 'shed {pct}',
      evShedOff: 'end',

      capStart: 'Clients send {base} requests/s through an API to a database with capacity {c}/s. The API waits at most {t} s for an answer, the timeout, then sends the request again: a retry. Press → for tick 0.',
      capTick: 'Tick {k}:',
      cSpike: 'a spike, clients send {d}/s instead of {base}.',
      cCapacity: 'database capacity raised to {c}/s.',
      cShedOn: 'admission control is on: the database turns away {pct} of what is offered.',
      cShedOff: 'admission control is off.',
      cFirst: 'There is no last tick, so no retries.',
      cNoRetry: 'Last tick\'s p99 {p} s is not over the timeout: no retries.',
      cRetry: 'Last tick\'s p99 {p} s is over the timeout: the API retries, ×{m}.',
      cRetrySat: 'The database was saturated last tick: the API retries, ×{m}.',
      cRetryOff: 'Last tick\'s p99 is over the timeout, but the API does not retry.',
      cLoad: 'The database gets {l}/s ({o} original + {r} retries), ρ {rho}:',
      cLoadPlain: 'The database gets {l}/s, ρ {rho}:',
      cSat: 'saturated, p99 is unbounded.',
      cP99: 'p99 {p} s.',
      sStuck: 'The spike lasted one tick, but the retries stayed: the database now gets {l} requests a second instead of {base} and cannot recover by itself.',
      sStorm: 'No spike needed: {base}/s alone puts p99 over the timeout, and the retries keep the database saturated.',
      sOverload: 'The demand alone is over capacity: the database is saturated even without retries.',
      sTooLate: 'Capacity was raised to {c}/s, but it does not help: the amplified demand of {l}/s is still above it.',
      sShedding: 'Admission control pushes λ under capacity: p99 falls, and the retries fall with it next tick.',
      sShedHealthy: 'The database is healthy, but admission control still turns away {x}/s: only {ok} of {base} requests/s get through.',
      sRecovered: 'Turning away {pct} of requests for two ticks drained the retries; demand is back to {base} and the database is healthy again.',
      sOverTimeout: 'The database is not saturated, but p99 stays over the timeout, so the retries do not stop.',
      sSlowNoRetry: 'p99 is over the timeout, but the API does not retry, so the load stays at {l}/s.',
      sBreach: 'p99 is over the timeout: the API retries next tick.',
      sHealthy: 'The system is stable.',

      explain:
        '<p>Clients send requests to an API, and the API calls the database, the bottleneck, for each one. The API waits ' +
        'at most 1 s for an answer, the timeout, then sends the call again: a retry. In this model the API looks at the ' +
        'database\'s p99 of the last tick: if it is over the timeout, it sends up to 1 + <var>r</var> calls per request, ' +
        'where <var>r</var> is the retries setting, in proportion to how far the timeout was broken.</p>' +
        '<p>That makes a loop: a slow database → timeouts → retries → more load → an even slower database. This is a retry ' +
        'storm. The system has two stable states: healthy at 9/s, and saturated at 36/s with retries. A short spike pushes ' +
        'it into the bad state, and it stays there after the spike is gone: a metastable failure (Bronson et al., ' +
        '2021).</p>' +
        '<p>Three misconceptions. “Retries make a system more reliable”: for rare, independent errors yes, but under ' +
        'overload they multiply the load. “Once the spike is gone, it recovers by itself”: no, the retries keep it down. ' +
        '“Add capacity and the problem goes away”: 15/s prevents the collapse at the start, but after the collapse the ' +
        'database gets 36/s.</p>' +
        '<p>Ways out. Backoff and jitter spread the retries out, so fewer arrive at the same moment; here that is a lower ' +
        'retries setting (0.5 instead of 3). Admission control, or load shedding, turns away part of the requests at the ' +
        'door, before they take up the database: λ falls under capacity, p99 under the timeout, and the retries go away. ' +
        'At capacity 15/s two ticks are enough; at 10/s, 9/s alone breaks the timeout and the storm comes back. Left on, it ' +
        'keeps turning away healthy requests too.</p>' +
        '<p>Simplifications: each tick is computed afresh from <var>λ</var> and <var>C</var>, with no queue carried into ' +
        'the next tick, and p99 is the M/M/1 formula from the utilisation simulator: p99 = ln 100 / (<var>C</var> − ' +
        '<var>λ</var>), unbounded for <var>ρ</var> ≥ 1.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
