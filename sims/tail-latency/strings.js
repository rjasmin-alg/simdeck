/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of tail-latency, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). *word* marks an English term in italics on the Croatian page (the page turns it
   into <em lang="en">); the terms are missing from kit/glossary.js and written out this way (NOTES.md, "Term pairs").
   Numbers are formatted by the page with the decimal separator below. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Lijevo jedan poslužitelj: 100 zahtjeva poredanih po trajanju, prosjek i p99. Desno grananje: jedan korisnički zahtjev zove N poslužitelja i čeka najsporiji.',
      plotSketch: '100 zahtjeva poredanih po vremenu u sustavu, s prosjekom i 99. percentilom',
      plotFan: 'Korisnički zahtjev šalje paralelne pozive poslužiteljima; najsporiji poziv označen je debelom strelicom',
      dec: ',',

      cv2: 'Varijabilnost cv²',
      cv2Hint: '0 = svako posluživanje jednako dugo; 1 = eksponencijalno; 16 = rijetki vrlo dugi zahtjevi',
      rho: 'Iskorištenost ρ',
      rhoHint: 'Udio vremena u kojem je poslužitelj zauzet',
      fanout: 'Grananje N',
      fanoutHint: 'Koliko paralelnih poziva šalje jedan korisnički zahtjev',
      slowP: 'Spor poziv je iznad',
      slowP99: 'p99',
      slowP999: 'p99,9',

      presetTail: 'Rep se odvaja',
      presetTailHint: 'cv² 9 uz ρ 0,1: prosjek ×1,4, p99 ×5',
      presetFan10: 'Grananje na 10',
      presetFan10Hint: '10 poziva: 9,6 % korisničkih zahtjeva je sporo',
      presetFan100: 'Grananje na 100',
      presetFan100Hint: '100 poziva: 63,4 % korisničkih zahtjeva je sporo',
      presetP999: 'Cilj na p99,9',
      presetP999Hint: '100 poziva, spor = iznad p99,9: 9,5 %',

      legendMean: 'prosjek',
      legendP99: 'p99',
      legendCall: 'poziv',
      legendSlowest: 'najsporiji',
      legendShare: 'spori zahtjevi',
      legendChanged: 'pomaknulo se najviše',

      leftTitle: 'Jedan poslužitelj',
      leftSub: 'C {c}, λ {l}',
      reqs: '{v} zah./s',
      sec: '{v} s',
      pct: '{v} %',
      axisT: 'vrijeme u sustavu',
      slowest: 'najsporiji',
      fastest: 'najbrži',
      hundred: '100 zahtjeva',
      meanAt: 'prosjek {v}',
      p99At: 'p99 {v}',
      p999At: 'p99,9 {v}',
      tail99: 'najsporiji 1 %',
      gMean: 'Prosjek W',
      gP99: '99. percentil',
      gRatio: '×{k} prema cv² 1',
      gP999: 'p99,9 {v}',

      rightTitle: 'Grananje poziva',
      user: 'korisnički zahtjev',
      calls: ['{n} poziv', '{n} poziva', '{n} poziva'],
      waits: 'odgovara kad stigne najsporiji',
      barTitle: 'Spori korisnički zahtjevi',
      formula: '1 − {b}{n} = {v}',
      oneCall: 'jedan poziv: {v}',
      perRequest: 'prosječno sporih poziva po zahtjevu: {v}',
      independent: 'Uz pretpostavku neovisnih poziva. Zajednički uzrok (spori disk, stanka na jednom računalu) mijenja udio, i to više nije 1 − (1 − q)ᴺ.',

      oneIn100: '1 na 100',
      oneIn1000: '1 na 1000',
      servers: ['{n} poslužitelj', '{n} poslužitelja', '{n} poslužitelja'],

      cTail: 'Varijabilnost cv² s 1 na {b}: prosjek raste {kw} puta, a 99. percentil {kp} puta. Prosjek izgleda dobro; rep (*tail*) ne.',
      cCv2Up: 'Varijabilnost cv² s 1 na {b}: prosjek raste {kw} puta, a 99. percentil {kp} puta.',
      cCv2Load: 'Varijabilnost cv² s 1 na {b} uz ρ {rho}: prosjek raste {kw} puta, a 99. percentil {kp} puta. Pod opterećenjem i čekanje u redu raste s cv², pa se i prosjek diže.',
      cCv2Ref: 'cv² 1, eksponencijalno vrijeme (polazište): prosjek {w}, 99. percentil {p}, {k} puta prosjek.',
      cCv2Down: 'cv² 0, svako posluživanje jednako dugo: prosjek ×{kw}, 99. percentil ×{kp} prema cv² 1. Manje varijabilnosti, kraći rep.',
      cFanOne: 'Jedan poziv po korisničkom zahtjevu: zahtjev je spor kad je spor taj poziv, {p} zahtjeva, koliko i na poslužitelju.',
      cFanout: 'Jedan korisnički zahtjev zove {servers} i čeka najsporiji: {p} korisničkih zahtjeva sad naleti na rijedak spori slučaj poslužitelja ({one}).',

      explain:
        '<p>Lijevo je jedan poslužitelj (<var>C</var> = 10 zahtjeva u sekundi, posluživanje 0,1 s) uz iskorištenost ' +
        '<var>ρ</var>. <em lang="en">Mean</em> (prosjek) <var>W</var> i 99. <em lang="en">percentile</em> ' +
        '(percentil) p99 dolaze iz istih formula kao u simulatoru kašnjenja pri gotovo punoj iskorištenosti: ' +
        '<var>W</var> = <var>ρ</var>/(1 − <var>ρ</var>) × (1 + cv²)/2 × 1/<var>C</var> + 1/<var>C</var> i ' +
        'p99 = ln 100 × (1 + cv²)/2 / (<var>C</var>(1 − <var>ρ</var>)).</p>' +
        '<p><em lang="en">Variability</em> (varijabilnost) cv² opisuje koliko se vremena posluživanja razlikuju. Uz malo ' +
        'opterećenje prosjek je uglavnom samo posluživanje 1/<var>C</var>, koje ne ovisi o cv², a p99 raste s (1 + cv²)/2: ' +
        'cv² s 1 na 9 diže prosjek 1,4 puta, a p99 5 puta. To je <em lang="en">tail latency</em> (kašnjenje u repu, ' +
        'repna latencija). Prosjek ne kaže kako je najsporijima. Skaliranje p99 s cv² je pojednostavljenje modela, točno ' +
        'samo za cv² = 1; p99,9 se računa istim oblikom repa, s ln 1000.</p>' +
        '<p>Stupci su skica, ne mjerenje: 100 zahtjeva iz glatke razdiobe (gama) koja ima baš prosjek i p99 modela; uz cv² 0 ' +
        'nijedan nije kraći od posluživanja 1/<var>C</var>. ' +
        'Najdulji stupac je uvijek iza crte p99: jedan od sto.</p>' +
        '<p>Desno je <em lang="en">fan-out</em> (grananje poziva): korisnički zahtjev šalje <var>N</var> poziva ' +
        'paralelno i odgovara tek kad stigne najsporiji. Ako je svaki poziv spor s vjerojatnošću 1 % i pozivi su neovisni, ' +
        'korisnički zahtjev je spor s vjerojatnošću 1 − 0,99<sup><var>N</var></sup>: uz 100 poziva 63 %. Rijedak rep ' +
        'jednog poslužitelja postaje uobičajen slučaj korisnika, pa „p99 je najsporijih 1 % korisnika” ne vrijedi. Zato veliki ' +
        'sustavi postavljaju ciljeve na p99,9: 1 − 0,999<sup>100</sup> = 9,5 %.</p>' +
        '<p>Neovisnost je pretpostavka. Zajednički uzrok (jedan spori disk, stanke na jednom računalu) povezuje pozive i ' +
        'mijenja udio. Jedan lijek je <em lang="en">hedged request</em> (zaštitni, dvostruki zahtjev): nakon p95 pošalji ' +
        'drugu kopiju i uzmi prvi odgovor (J. Dean i L. A. Barroso, „The Tail at Scale”, 2013). Model ga ne računa. ' +
        'Rep nije šum koji se smije zanemariti.</p>'
    },
    en: {
      stage: 'Left, one server: 100 requests sorted by time, the mean and p99. Right, fan-out: one user request calls N servers and waits for the slowest.',
      plotSketch: '100 requests sorted by time in the system, with the mean and the 99th percentile',
      plotFan: 'A user request sends parallel calls to servers; the slowest call is the thick arrow',
      dec: '.',

      cv2: 'Variability cv²',
      cv2Hint: '0 = every service takes the same time; 1 = exponential; 16 = rare very long requests',
      rho: 'Utilisation ρ',
      rhoHint: 'Share of time the server is busy',
      fanout: 'Fan-out N',
      fanoutHint: 'How many parallel calls one user request sends',
      slowP: 'A slow call is above',
      slowP99: 'p99',
      slowP999: 'p99.9',

      presetTail: 'The tail decouples',
      presetTailHint: 'cv² 9 at ρ 0.1: mean ×1.4, p99 ×5',
      presetFan10: 'Fan-out to 10',
      presetFan10Hint: '10 calls: 9.6 % of user requests are slow',
      presetFan100: 'Fan-out to 100',
      presetFan100Hint: '100 calls: 63.4 % of user requests are slow',
      presetP999: 'Target on p99.9',
      presetP999Hint: '100 calls, slow = above p99.9: 9.5 %',

      legendMean: 'mean',
      legendP99: 'p99',
      legendCall: 'call',
      legendSlowest: 'slowest',
      legendShare: 'slow requests',
      legendChanged: 'moved most',

      leftTitle: 'One server',
      leftSub: 'C {c}, λ {l}',
      reqs: '{v} req/s',
      sec: '{v} s',
      pct: '{v} %',
      axisT: 'time in system',
      slowest: 'slowest',
      fastest: 'fastest',
      hundred: '100 requests',
      meanAt: 'mean {v}',
      p99At: 'p99 {v}',
      p999At: 'p99.9 {v}',
      tail99: 'slowest 1 %',
      gMean: 'Mean W',
      gP99: '99th percentile',
      gRatio: '×{k} against cv² 1',
      gP999: 'p99.9 {v}',

      rightTitle: 'Fan-out',
      user: 'user request',
      calls: ['{n} call', '{n} calls'],
      waits: 'answers when the slowest arrives',
      barTitle: 'Slow user requests',
      formula: '1 − {b}{n} = {v}',
      oneCall: 'one call: {v}',
      perRequest: 'slow calls per request on average: {v}',
      independent: 'Assuming independent calls. A shared cause (a slow disk, a pause on one host) changes the share, and it is no longer 1 − (1 − q)ᴺ.',

      oneIn100: '1-in-100',
      oneIn1000: '1-in-1000',
      servers: ['{n} server', '{n} servers'],

      cTail: 'Variability cv² from 1 to {b}: the mean grows {kw} times, the 99th percentile {kp} times. The mean looks fine; the tail does not.',
      cCv2Up: 'Variability cv² from 1 to {b}: the mean grows {kw} times, the 99th percentile {kp} times.',
      cCv2Load: 'Variability cv² from 1 to {b} at ρ {rho}: the mean grows {kw} times, the 99th percentile {kp} times. Under load the wait in the queue grows with cv² too, so the mean rises as well.',
      cCv2Ref: 'cv² 1, an exponential time (the reference): mean {w}, 99th percentile {p}, {k} times the mean.',
      cCv2Down: 'cv² 0, every service takes the same time: mean ×{kw}, 99th percentile ×{kp} against cv² 1. Less variability, a shorter tail.',
      cFanOne: 'One call per user request: the request is slow when that call is, {p} of requests, the backend\'s own share.',
      cFanout: 'One user request calls {servers} and waits for the slowest: {p} of user requests now see a backend\'s {one} slow case.',

      explain:
        '<p>On the left is one server (<var>C</var> = 10 requests per second, service 0.1 s) at utilisation ' +
        '<var>ρ</var>. The mean <var>W</var> and the 99th percentile p99 come from the same formulas as in the latency ' +
        'near full utilisation simulator: <var>W</var> = <var>ρ</var>/(1 − <var>ρ</var>) × (1 + cv²)/2 × 1/<var>C</var> ' +
        '+ 1/<var>C</var> and p99 = ln 100 × (1 + cv²)/2 / (<var>C</var>(1 − <var>ρ</var>)).</p>' +
        '<p>The variability cv² says how much service times differ. At low load the mean is mostly the service 1/<var>C</var>, ' +
        'which does not depend on cv², while p99 grows with (1 + cv²)/2: cv² from 1 to 9 lifts the mean 1.4 times and ' +
        'p99 5 times. That is tail latency. The mean does not tell you how the slowest requests fare. Scaling p99 with ' +
        'cv² is the model\'s simplification, exact only for cv² = 1; p99.9 uses the same tail form, with ln 1000.</p>' +
        '<p>The bars are a sketch, not a measurement: 100 requests from a smooth (gamma) distribution with exactly the ' +
        'model\'s mean and p99; at cv² 0 none is shorter than the service 1/<var>C</var>. The longest bar is always past the ' +
        'p99 line: one in a hundred.</p>' +
        '<p>On the right is fan-out: a user request sends <var>N</var> calls in parallel and answers only when the slowest ' +
        'arrives. If each call is slow with probability 1 % and the calls are independent, the user request is slow with ' +
        'probability 1 − 0.99<sup><var>N</var></sup>: with 100 calls, 63 %. One server\'s rare tail becomes the user\'s ' +
        'normal case, so “p99 is the slowest 1 % of users” does not hold. That is why large services set targets on ' +
        'p99.9: 1 − 0.999<sup>100</sup> = 9.5 %.</p>' +
        '<p>Independence is an assumption. A shared cause (one slow disk, pauses on one host) ties the calls together and ' +
        'changes the share. One remedy is the hedged request: after the p95, send a second copy and take the first answer ' +
        '(J. Dean and L. A. Barroso, “The Tail at Scale”, 2013). The model does not compute it. The tail is not noise to ' +
        'ignore.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
