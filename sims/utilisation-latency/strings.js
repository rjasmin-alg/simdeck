/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of utilisation-latency, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* marks an English term in italics on the Croatian page (the
   page turns it into <em lang="en">); the terms are missing from kit/glossary.js and written out this way, English
   term then the Croatian in parentheses at the first mention (NOTES.md, "Term pairs"). Numbers are formatted by the
   page with the decimal separator below. The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Krivulja vremena u sustavu prema iskorištenosti, mjerači, red čekanja pred poslužiteljem i lanac poziva',
      plot: 'Srednje vrijeme W i p99 prema iskorištenosti ρ, s trenutnom točkom i koljenom',
      dec: ',',

      load: 'Opterećenje',
      capacity: 'Kapacitet C',
      cap10: '10 zah./s',
      cap100: '100 zah./s',
      cv2: 'Varijabilnost cv²',
      cv0: '0',
      cv1: '1',
      cv4: '4',
      cv9: '9',
      cv2Hint: '0 = svaki zahtjev jednako dug; 1 = eksponencijalno (M/M/1); 9 = rijetki vrlo dugi zahtjevi',
      chain: 'Lanac od tri sloja',

      presetHalf: 'Pola opterećenja',
      presetHalfHint: 'ρ 0,5: W 0,20 s, p99 0,92 s; samo posluživanje 0,1 s',
      presetKnee: 'Koljeno',
      presetKneeHint: 'ρ 0,9: W 1,00 s, p99 4,61 s',
      presetNear: 'Skoro puno',
      presetNearHint: 'ρ 0,99: W 10 s, p99 46 s',
      presetVar: 'Varijabilnost',
      presetVarHint: 'ρ 0,1, cv² 9: srednje ×1,4, p99 ×5',
      presetChain: 'Lanac od tri sloja',
      presetChainHint: 'API, predmemorija, baza i revizija uz 5 zah./s: p99 s kraja na kraj 0,99 s',

      legendW: 'srednje W',
      legendP99: 'p99',
      legendPoint: 'trenutno',
      legendKnee: 'koljeno',
      legendSat: 'neograničeno',
      legendChanged: 'prešao prag',

      axisX: 'iskorištenost ρ',
      axisY: 'vrijeme u sustavu',
      pct: '{v} %',
      sec: '{v} s',
      reqs: '{v} zah./s',
      knee: 'koljeno',
      serviceLine: 'samo posluživanje {v}',
      unbounded: 'neograničeno',
      curveW: 'W',
      curveP99: 'p99',
      pointW: 'W {v}',
      pointP99: 'p99 {v}',

      gRho: 'Iskorištenost ρ',
      gRhoSub: 'λ {l} od {c}',
      zoneBelow: 'ispod koljena',
      zoneKnee: 'u koljenu',
      zoneSaturated: 'zasićeno',
      gW: 'Srednje vrijeme W',
      gWSub: '{k} × posluživanje',
      gP99: '99. percentil',
      gP99Sub: '1 % zahtjeva traje dulje',
      gL: 'Zahtjeva u sustavu L',
      gLSub: 'L = λ × W',

      queueTitle: 'Red čekanja',
      queueIn: 'dolasci λ {v}',
      queueWaiting: 'u redu prosječno {v}',
      queueMore: '+{n}',
      queueGrows: 'raste bez granice',
      server: 'poslužitelj',
      serverBusy: 'zauzet {v}',

      chainTitle: 'Lanac poziva, na ulazu λ',
      nApi: 'API',
      nCache: 'predmemorija',
      nDb: 'baza',
      nAudit: 'revizija',
      nodeCap: 'C {v}',
      nodeRho: 'ρ {v}',
      nodeP99: 'p99 {v}',
      nodeWeight: '{w} ×',
      e2e: 'p99 s kraja na kraj',
      slo: 'cilj {v}',
      met: '✓ ispunjen',
      missed: '✗ promašen',

      cState: 'Opterećenje (*utilisation*) {load}: zahtjev u prosjeku provede {w} u sustavu, {k} puta dulje od samog posluživanja, a 1 % zahtjeva u sustavu provede više od {p99}.',
      cIdle: 'Opterećenje (*utilisation*) {load}: zahtjev gotovo ne čeka, u sustavu provede {w}, koliko i samo posluživanje; 1 % zahtjeva u sustavu provede više od {p99}.',
      cLoad: 'S opterećenjem od {from} na {to} srednje vrijeme u sustavu ide od {w0} na {w1} (×{k}), a p99 od {p0} na {p1}.',
      cCv2: 'Varijabilnost cv² {a} → {b} uz opterećenje {load}: srednje vrijeme {w0} → {w1} (×{kw}), a p99 {p0} → {p1} (×{kp}).',
      cCv2Tail: 'Varijabilnost cv² {a} → {b} uz opterećenje {load}: srednje vrijeme {w0} → {w1} (×{kw}), a p99 {p0} → {p1} (×{kp}). Rep raste brže od prosjeka.',
      cChain: 'Lanac uz λ {l}: p99 se zbraja po pozivima, {sum} = {e2e} s kraja na kraj, cilj {slo} {verdict}.',
      cChainSat: 'Lanac uz λ {l}: sloj „{node}” je zasićen (ρ {rho}), pa je p99 s kraja na kraj neograničen.',
      cSaturated: 'Opterećenje {load}: zahtjevi stižu brzinom kojom ih poslužitelj obrađuje. Red nema ustaljeno stanje i raste bez granice; srednje vrijeme i p99 su neograničeni.',

      explain:
        '<p>Poslužitelj obrađuje <var>C</var> zahtjeva u sekundi, pa samo posluživanje traje u prosjeku 1/<var>C</var>. ' +
        'Zahtjevi stižu, <em lang="en">arrival rate</em> (stopa dolazaka) <var>λ</var>. <em lang="en">Utilisation</em> ' +
        '(iskorištenost) <var>ρ</var> = <var>λ</var> / <var>C</var> je udio vremena u kojem je poslužitelj zauzet.</p>' +
        '<p>Zahtjev koji stigne dok je poslužitelj zauzet čeka u redu, <em lang="en">queue</em> (red čekanja). ' +
        'Prosječno čekanje daje formula Pollaczek–Hinčin: <var>W</var><sub>q</sub> = <var>ρ</var>/(1 − <var>ρ</var>) × ' +
        '(1 + cv²)/2 × 1/<var>C</var>, a vrijeme u sustavu je <var>W</var> = <var>W</var><sub>q</sub> + 1/<var>C</var>. ' +
        'Nazivnik 1 − <var>ρ</var> ide prema nuli: od 90 % do 99 % opterećenja <var>W</var> naraste deset puta. ' +
        'Zato 80 % zauzetosti nije 20 % rezerve, a poslužitelj nije „u redu sve do 100 %”.</p>' +
        '<p>cv² je kvadrat <em lang="en">coefficient of variation</em> (koeficijent varijacije) vremena posluživanja: ' +
        '0 kad svaki zahtjev traje jednako, 1 za eksponencijalno vrijeme. p99, 99. <em lang="en">percentile</em> ' +
        '(percentil), je vrijeme u sustavu koje 1 % zahtjeva premaši. Za cv² = 1 (M/M/1) p99 = ln 100 / (<var>C</var> − <var>λ</var>) ' +
        'točno; za ostale cv² krivulja p99 je ta ista krivulja pomnožena s (1 + cv²)/2, približno. Veća varijabilnost ' +
        'diže rep puno više nego prosjek, pa prosječno kašnjenje, <em lang="en">latency</em> (latencija), ne govori ' +
        'kako se korisnici osjećaju.</p>' +
        '<p>Na <var>ρ</var> ≥ 1 red nema ustaljeno stanje, <em lang="en">saturation</em> (zasićenje): brojke se računaju ' +
        's <var>ρ</var> = 0,999, a stranica piše „neograničeno”. Littleov zakon daje broj zahtjeva u sustavu: ' +
        '<var>L</var> = <var>λ</var> × <var>W</var>.</p>' +
        '<p>Lanac od tri sloja: API zove predmemoriju (koja zove bazu) i, za svaki peti zahtjev, reviziju. API dobiva ' +
        '<var>λ</var>, a svaki sloj prosljeđuje ono što obradi, najviše svoj kapacitet (reviziji 0,2 od toga). p99 s kraja ' +
        'na kraj zbroj je p99 slojeva po težinama poziva. Najsporiji sloj u odnosu na svoj kapacitet prvi ulazi u koljeno.</p>'
    },
    en: {
      stage: 'Curve of time in system against utilisation, gauges, the queue in front of the server and a call chain',
      plot: 'Mean time W and p99 against utilisation ρ, with the current point and the knee',
      dec: '.',

      load: 'Load',
      capacity: 'Capacity C',
      cap10: '10 req/s',
      cap100: '100 req/s',
      cv2: 'Variability cv²',
      cv0: '0',
      cv1: '1',
      cv4: '4',
      cv9: '9',
      cv2Hint: '0 = every request takes the same time; 1 = exponential (M/M/1); 9 = rare very long requests',
      chain: 'Three-tier chain',

      presetHalf: 'Half load',
      presetHalfHint: 'ρ 0.5: W 0.20 s, p99 0.92 s; service alone 0.1 s',
      presetKnee: 'The knee',
      presetKneeHint: 'ρ 0.9: W 1.00 s, p99 4.61 s',
      presetNear: 'Near full',
      presetNearHint: 'ρ 0.99: W 10 s, p99 46 s',
      presetVar: 'Variability',
      presetVarHint: 'ρ 0.1, cv² 9: mean ×1.4, p99 ×5',
      presetChain: 'Three-tier chain',
      presetChainHint: 'API, cache, database and audit at 5 req/s: end-to-end p99 0.99 s',

      legendW: 'mean W',
      legendP99: 'p99',
      legendPoint: 'current',
      legendKnee: 'knee',
      legendSat: 'unbounded',
      legendChanged: 'crossed a threshold',

      axisX: 'utilisation ρ',
      axisY: 'time in system',
      pct: '{v} %',
      sec: '{v} s',
      reqs: '{v} req/s',
      knee: 'knee',
      serviceLine: 'service alone {v}',
      unbounded: 'unbounded',
      curveW: 'W',
      curveP99: 'p99',
      pointW: 'W {v}',
      pointP99: 'p99 {v}',

      gRho: 'Utilisation ρ',
      gRhoSub: 'λ {l} of {c}',
      zoneBelow: 'below the knee',
      zoneKnee: 'in the knee',
      zoneSaturated: 'saturated',
      gW: 'Mean time W',
      gWSub: '{k} × service',
      gP99: '99th percentile',
      gP99Sub: '1 % of requests take longer',
      gL: 'Requests in system L',
      gLSub: 'L = λ × W',

      queueTitle: 'Queue',
      queueIn: 'arrivals λ {v}',
      queueWaiting: 'waiting on average {v}',
      queueMore: '+{n}',
      queueGrows: 'grows without bound',
      server: 'server',
      serverBusy: 'busy {v}',

      chainTitle: 'Call chain, λ at the entry',
      nApi: 'API',
      nCache: 'cache',
      nDb: 'database',
      nAudit: 'audit',
      nodeCap: 'C {v}',
      nodeRho: 'ρ {v}',
      nodeP99: 'p99 {v}',
      nodeWeight: '{w} ×',
      e2e: 'end-to-end p99',
      slo: 'target {v}',
      met: '✓ met',
      missed: '✗ missed',

      cState: 'Load {load}: a request spends {w} in the system on average, {k} times the service alone, and 1 % of requests spend more than {p99}.',
      cIdle: 'Load {load}: a request hardly waits, it spends {w} in the system, about the service alone; 1 % of requests spend more than {p99}.',
      cLoad: 'From {from} to {to} load, the mean time in the system goes from {w0} to {w1} (×{k}), and p99 from {p0} to {p1}.',
      cCv2: 'Variability cv² {a} → {b} at load {load}: mean time {w0} → {w1} (×{kw}), p99 {p0} → {p1} (×{kp}).',
      cCv2Tail: 'Variability cv² {a} → {b} at load {load}: mean time {w0} → {w1} (×{kw}), p99 {p0} → {p1} (×{kp}). The tail grows faster than the mean.',
      cChain: 'Chain at λ {l}: p99 adds up along the calls, {sum} = {e2e} end to end, target {slo} {verdict}.',
      cChainSat: 'Chain at λ {l}: the “{node}” tier is saturated (ρ {rho}), so the end-to-end p99 is unbounded.',
      cSaturated: 'Load {load}: requests arrive as fast as the server handles them. The queue has no steady state and grows without bound; the mean time and p99 are unbounded.',

      explain:
        '<p>The server handles <var>C</var> requests per second, so service alone takes 1/<var>C</var> on average. ' +
        'Requests arrive at an arrival rate <var>λ</var>. Utilisation <var>ρ</var> = <var>λ</var> / <var>C</var> is the ' +
        'share of time the server is busy.</p>' +
        '<p>A request that arrives while the server is busy waits in the queue. The Pollaczek–Khinchine formula gives the ' +
        'mean wait: <var>W</var><sub>q</sub> = <var>ρ</var>/(1 − <var>ρ</var>) × (1 + cv²)/2 × 1/<var>C</var>, and the ' +
        'time in the system is <var>W</var> = <var>W</var><sub>q</sub> + 1/<var>C</var>. The denominator 1 − <var>ρ</var> ' +
        'goes to zero: from 90 % to 99 % load, <var>W</var> grows tenfold. So 80 % busy is not 20 % headroom, and a server ' +
        'is not “fine until it hits 100 %”.</p>' +
        '<p>cv² is the squared coefficient of variation of the service time: 0 when every request takes the same time, ' +
        '1 for an exponential time. p99, the 99th percentile, is the time in the system 1 % of requests exceed. For cv² = 1 (M/M/1) ' +
        'p99 = ln 100 / (<var>C</var> − <var>λ</var>) exactly; for other cv² the p99 curve is that same curve times ' +
        '(1 + cv²)/2, an approximation. More variability lifts the tail far more than the mean, so the average latency ' +
        'does not tell you how users feel.</p>' +
        '<p>At <var>ρ</var> ≥ 1 the queue has no steady state (saturation): the numbers are computed at ' +
        '<var>ρ</var> = 0.999 and the page writes “unbounded”. Little’s law gives the number of requests in the system: ' +
        '<var>L</var> = <var>λ</var> × <var>W</var>.</p>' +
        '<p>The three-tier chain: the API calls the cache (which calls the database) and, for one request in five, the ' +
        'audit. The API gets <var>λ</var>, and every tier passes on what it handles, at most its capacity (0.2 of it to the ' +
        'audit). The end-to-end p99 is the sum of the tiers’ p99 by call weight. The tier slowest for its capacity enters the knee first.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
