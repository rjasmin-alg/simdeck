/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of littles-law, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). *word* marks an English term in italics on the Croatian page (the page turns it
   into <em lang="en">); those terms are missing from kit/glossary.js and are written out this way, English term then
   the Croatian in parentheses at the first mention (NOTES.md, "Term pairs"). Numbers are formatted by the page with
   the decimal separator below. The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Jednadžba L = λ × W, sustav s ulazom i izlazom i vremenski niz broja u sustavu',
      scene: 'Sustav: točke ulaze stopom λ, svaka ostaje W, unutra ih je L',
      plot: 'Broj u sustavu kroz vrijeme, njegov tekući prosjek i vrijednost λ × W',
      dec: ',',

      system: 'Sustav',
      sysShop: 'trgovina',
      sysServer: 'poslužitelj',
      sysFarm: 'farma',
      solveFor: 'Računaj',
      solveL: 'L',
      solveW: 'W',
      solveLambda: 'λ',
      solveForOff: 'uz W iz reda čekanja računa se L',
      lambda: 'Stopa dolazaka λ',
      W: 'Vrijeme u sustavu W',
      L: 'Broj u sustavu L',
      places: 'Mjesta',
      fromQueue: 'W iz reda čekanja',
      fromQueueHint: 'jedan poslužitelj kapaciteta C (M/M/1)',
      capacity: 'Kapacitet C',

      presetShop: 'Trgovina',
      presetShopHint: '2 kupca u minuti × 5 min = 10 u trgovini',
      presetServer: 'Poslužitelj',
      presetServerHint: '200/s × 50 ms = 10 u obradi; s 8 radnih niti red raste',
      presetFarm: 'Farma za gradnju',
      presetFarmHint: '12/h × 25 min = 5 istodobno, a agenta su 4',
      presetMeasure: 'Izmjeri W',
      presetMeasureHint: '30 u obradi uz 600/s: W = 50 ms',
      presetQueue: 'W iz reda čekanja',
      presetQueueHint: 'C 10/s, λ 9/s: W 1 s, L 9',

      legendIn: 'ulazi',
      legendInside: 'unutra (broji se)',
      legendOut: 'izlazi',
      legendComputed: 'izračunato (=)',
      legendUnstable: 'nestabilno',

      // units: λ per its time, W in its unit, items counted
      perMin: '{v}/min',
      perS: '{v}/s',
      perH: '{v}/h',
      min: '{v} min',
      ms: '{v} ms',
      sec: '{v} s',
      shopItems: ['{v} kupac', '{v} kupca', '{v} kupaca'],
      serverItems: ['{v} zahtjev', '{v} zahtjeva', '{v} zahtjeva'],
      farmItems: ['{v} gradnja', '{v} gradnje', '{v} gradnji'],
      shopPlaces: ['{v} mjesto', '{v} mjesta', '{v} mjesta'],
      serverPlaces: ['{v} radna nit', '{v} radne niti', '{v} radnih niti'],
      farmPlaces: ['{v} agent', '{v} agenta', '{v} agenata'],
      timeShop: 'vrijeme (min)',
      timeServer: 'vrijeme (ms)',
      timeFarm: 'vrijeme (min)',
      timeS: 'vrijeme (s)',

      fL: 'broj u sustavu',
      fLambda: 'stopa dolazaka',
      fW: 'vrijeme u sustavu',
      computed: 'izračunato',
      times: '×',
      equals: '=',
      perWUnit: '= {v} u {u}',
      unitMin: 'minuti',
      wInS: '= {v} s',
      demand: 'λ × W = {v} ≥ {p}',
      unstable: 'nestabilno',
      noValue: '—',
      fromQueueSub: 'iz reda: ρ = {rho}',
      unbounded: 'raste bez granice',

      sShop: 'Trgovina',
      sServer: 'Poslužitelj',
      sFarm: 'Farma za gradnju',
      sPlaces: '{p}, zauzeto {rho}',
      sQueue: '1 poslužitelj, C = {c}, zauzet {rho}',
      sIn: 'ulaz',
      sOut: 'izlaz',
      sInside: 'unutra prosječno {v}',
      sDot: '1 točka = {k}',
      sWaiting: 'red raste',

      pL: 'L(t)',
      pMean: 'tekući prosjek',
      pSlow: 'blizu ρ = 1 prosjek se vrlo sporo smiruje',
      pTarget: 'λ × W = {v}',
      pPlaces: 'mjesta {v}',

      shopRate: ['{v} kupac u minuti', '{v} kupca u minuti', '{v} kupaca u minuti'],
      serverRate: ['{v} zahtjev u sekundi', '{v} zahtjeva u sekundi', '{v} zahtjeva u sekundi'],
      farmRate: ['{v} gradnja na sat', '{v} gradnje na sat', '{v} gradnji na sat'],
      whereShop: 'u trgovini',
      whereServer: 'u obradi',
      whereFarm: 'u izvođenju',
      eachShop: 'svaki',
      eachServer: 'svaki',
      eachFarm: 'svaka',
      pct: '{v} %',

      cSolveL: '{l} × {w} = {L}: u prosjeku {items} {where}.',
      cSolveLConv: '{l} × {w} = {lw} × {w} = {L}: u prosjeku {items} {where}.',
      cSolveLConvW: '{l} × {w} = {l} × {ws} = {L}: u prosjeku {items} {where}.',
      cSolveW: '{items} {where} uz {l}: {each} u sustavu provede {w}, a nijedno trajanje nismo mjerili.',
      cSolveLambda: 'U prosjeku {items} {where}, {each} ostaje {w}: moraju dolaziti stopom {l}.',
      cChangeW: 'Ista stopa {l}, W s {w0} na {w1}: L s {L0} na {L1} (×{k}). Više ih je unutra jer {each} dulje ostaje, a ne zato što brže prolaze.',
      cChangeWDown: 'Ista stopa {l}, W s {w0} na {w1}: L s {L0} na {L1} (×{k}). Manje ih je unutra jer {each} kraće ostaje.',
      cChangeLambda: 'Isto W {w}, λ s {l0} na {l1}: L s {L0} na {L1} (×{k}).',
      cUnstable: '{rate}, {each} {w}: u prosjeku bi ih istodobno trebalo {L}. Kapacitet je {places}, pa red samo raste.',
      cQueue: 'C = {c}, λ = {l}: ρ = {rho}, red daje W = {w}, a L = λW = {L} = ρ/(1 − ρ).',
      cQueueUnstable: 'λ = {l} ≥ C = {c}: poslužitelj je stalno zauzet, red raste i nema stacionarnog W ni L. Vidi simulator „Kašnjenje pri gotovo punoj iskorištenosti”.',

      explain: '<p><b><i lang="en">Little\'s law</i></b> (Littleov zakon): u <i lang="en">steady state</i> (stacionarnom stanju) ' +
        'srednji <i lang="en">number in system</i> (broj u sustavu) L jednak je umnošku <i lang="en">arrival rate</i> (stope dolazaka) λ ' +
        'i <i lang="en">mean time in system</i> (srednjeg vremena u sustavu) W: <b>L = λW</b>. ' +
        'Vrijedi za bilo koju raspodjelu dolazaka i trajanja i za bilo koji redoslijed posluživanja (J. D. C. Little, 1961).</p>' +
        '<p>Jedinice moraju odgovarati: λ po minuti s W u minutama. Bilo koje dvije veličine daju treću, pa se W može ' +
        'izračunati iz broja zahtjeva u obradi i [[throughput]], bez mjerenja ijednog zahtjeva.</p>' +
        '<p>Svaki zauzima jedno mjesto (radnu nit, agenta) cijelo svoje vrijeme, pa je kapacitet mjesta / W. ' +
        'Stacionarno stanje postoji samo kad je λ ispod kapaciteta. Iznad njega L raste bez granice, prosjeci ne postoje i zakon nema stacionarnu vrijednost koju bi dao.</p>' +
        '<p>Zablude: „vrijedi samo za jednostavne redove” (ne ovisi o raspodjelama); „više istodobnih znači brže” ' +
        '(uz isti λ više unutra znači da svaki ostaje dulje); „kratak nalet ga ruši” (govori o dugoročnim prosjecima).</p>'
    },
    en: {
      stage: 'The equation L = λ × W, a system with an entrance and an exit, and a time series of the number in it',
      scene: 'The system: dots enter at rate λ, each stays W, L are inside',
      plot: 'Number in the system over time, its running average and the value λ × W',
      dec: '.',

      system: 'System',
      sysShop: 'shop',
      sysServer: 'server',
      sysFarm: 'build farm',
      solveFor: 'Solve for',
      solveL: 'L',
      solveW: 'W',
      solveLambda: 'λ',
      solveForOff: 'with W from the queue, L is computed',
      lambda: 'Arrival rate λ',
      W: 'Time in system W',
      L: 'Number in system L',
      places: 'Places',
      fromQueue: 'W from the queue',
      fromQueueHint: 'one server with capacity C (M/M/1)',
      capacity: 'Capacity C',

      presetShop: 'Shop',
      presetShopHint: '2 customers a minute × 5 min = 10 in the shop',
      presetServer: 'Server',
      presetServerHint: '200/s × 50 ms = 10 in flight; with 8 worker threads the queue grows',
      presetFarm: 'Build farm',
      presetFarmHint: '12/h × 25 min = 5 at once, but there are 4 agents',
      presetMeasure: 'Measure W',
      presetMeasureHint: '30 in flight at 600/s: W = 50 ms',
      presetQueue: 'W from the queue',
      presetQueueHint: 'C 10/s, λ 9/s: W 1 s, L 9',

      legendIn: 'entering',
      legendInside: 'inside (counted)',
      legendOut: 'leaving',
      legendComputed: 'computed (=)',
      legendUnstable: 'not stable',

      perMin: '{v}/min',
      perS: '{v}/s',
      perH: '{v}/h',
      min: '{v} min',
      ms: '{v} ms',
      sec: '{v} s',
      shopItems: ['{v} customer', '{v} customers'],
      serverItems: ['{v} request', '{v} requests'],
      farmItems: ['{v} build', '{v} builds'],
      shopPlaces: ['{v} place', '{v} places'],
      serverPlaces: ['{v} worker thread', '{v} worker threads'],
      farmPlaces: ['{v} agent', '{v} agents'],
      timeShop: 'time (min)',
      timeServer: 'time (ms)',
      timeFarm: 'time (min)',
      timeS: 'time (s)',

      fL: 'number in system',
      fLambda: 'arrival rate',
      fW: 'time in system',
      computed: 'computed',
      times: '×',
      equals: '=',
      perWUnit: '= {v} per {u}',
      unitMin: 'minute',
      wInS: '= {v} s',
      demand: 'λ × W = {v} ≥ {p}',
      unstable: 'not stable',
      noValue: '—',
      fromQueueSub: 'from the queue: ρ = {rho}',
      unbounded: 'grows without bound',

      sShop: 'Shop',
      sServer: 'Server',
      sFarm: 'Build farm',
      sPlaces: '{p}, {rho} taken',
      sQueue: '1 server, C = {c}, busy {rho}',
      sIn: 'in',
      sOut: 'out',
      sInside: 'inside on average {v}',
      sDot: '1 dot = {k}',
      sWaiting: 'queue grows',

      pL: 'L(t)',
      pMean: 'running average',
      pSlow: 'near ρ = 1 the average takes very long to settle',
      pTarget: 'λ × W = {v}',
      pPlaces: 'places {v}',

      shopRate: ['{v} customer a minute', '{v} customers a minute'],
      serverRate: ['{v} request a second', '{v} requests a second'],
      farmRate: ['{v} build an hour', '{v} builds an hour'],
      whereShop: 'in the shop',
      whereServer: 'in flight',
      whereFarm: 'running',
      eachShop: 'each',
      eachServer: 'each',
      eachFarm: 'each',
      pct: '{v} %',

      cSolveL: '{l} × {w} = {L}: {items} {where} on average.',
      cSolveLConv: '{l} × {w} = {lw} × {w} = {L}: {items} {where} on average.',
      cSolveLConvW: '{l} × {w} = {l} × {ws} = {L}: {items} {where} on average.',
      cSolveW: '{items} {where} at {l}: {each} one spends {w} in the system, and we did not have to time a single one.',
      cSolveLambda: '{items} {where} on average, {each} staying {w}: they must arrive at {l}.',
      cChangeW: 'Same rate {l}, W from {w0} to {w1}: L from {L0} to {L1} (×{k}). More are inside because {each} one stays longer, not because they pass faster.',
      cChangeWDown: 'Same rate {l}, W from {w0} to {w1}: L from {L0} to {L1} (×{k}). Fewer are inside because {each} one stays a shorter time.',
      cChangeLambda: 'Same W {w}, λ from {l0} to {l1}: L from {L0} to {L1} (×{k}).',
      cUnstable: '{rate}, {w} {each}: on average {L} would have to run at once. With {places} the queue only grows.',
      cQueue: 'C = {c}, λ = {l}: ρ = {rho}, the queue gives W = {w}, and L = λW = {L} = ρ/(1 − ρ).',
      cQueueUnstable: 'λ = {l} ≥ C = {c}: the server is busy all the time, the queue grows, and there is no steady W or L. See the simulator "Latency near full utilisation".',

      explain: '<p><b>Little\'s law</b>: in steady state the mean number in the system L equals the arrival rate λ times ' +
        'the mean time in the system W: <b>L = λW</b>. It holds for any distribution of arrivals and stays and for any ' +
        'order of service (J. D. C. Little, 1961).</p>' +
        '<p>Units must match: λ per minute with W in minutes. Any two give the third, so W can be computed from the ' +
        'number in flight and the [[throughput]], without timing a single request.</p>' +
        '<p>Each one holds a place (a worker thread, an agent) for its whole time, so the capacity is places / W. ' +
        'A steady state exists only while λ is below capacity. Above it L grows without bound, the averages do not exist and the law has no steady value to give.</p>' +
        '<p>Misconceptions: "it only works for simple queues" (it does not depend on the distributions); "more concurrency ' +
        'means faster requests" (at the same λ, more inside means each stays longer); "a short burst breaks it" (it is ' +
        'about long-run averages).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
