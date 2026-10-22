/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ntp-sync, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Numbers, host names and timestamps are data: the page writes them (decimal comma in Croatian) with translate="no".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'NTP razmjena između klijenta i poslužitelja vremena',

      unitMs: '{v} ms',

      // lanes and cards
      laneClient: 'Klijent',
      laneServer: 'Poslužitelj',
      markClient: 'K',
      markServer: 'P',
      refClock: 'vlastiti referentni sat (GPS)',
      unsync: 'nije usklađen',
      cardStep: 'skok',
      cardSlew: 'postupno',
      cardSlewFor: 'postupno, {took}',
      msgRequest: 'zahtjev',
      msgReply: 'odgovor',
      msgRequests: 'zahtjev svakom',
      reFlight: 'na putu',
      noteStep: 'skok',
      noteSlew: 'postupno',
      noteDropped: 'stratum 16: izbačen',
      noteAllOk: 'svi usklađeni',
      noteSelected: 'izabran',
      noteNone: 'nijedan izvor',
      chartEmpty: 'Još nema poruka. Pritisni →.',
      earlier: ['↑ još {n} raniji redak', '↑ još {n} ranija retka', '↑ još {n} ranijih redaka'],

      // to scale
      scaleTitle: 'Na mjerilu',
      scaleNext: 'Sljedeća razmjena, 64 s kasnije',
      scaleClient: 'klijent',
      scaleServer: 'poslužitelj',
      scaleTime: 'stvarno vrijeme',
      scaleHint: 'Pad strelice je kašnjenje u tom smjeru.',

      // calculation
      calcTitle: 'Izračun',
      stampT1: 'klijent šalje',
      stampT2: 'poslužitelj prima',
      stampT3: 'poslužitelj šalje',
      stampT4: 'klijent prima',
      byClient: 'sat klijenta',
      byServer: 'sat poslužitelja',
      offsetName: 'pomak θ',
      delayName: 'kašnjenje povratnog puta δ',
      trueName: 'stvarni pomak',
      trueHint: '(zna ga samo simulacija)',
      errorName: 'greška procjene',
      boundName: 'najviše δ / 2',
      boundOk: 'unutar granice',
      calcWait: 'Pomak i kašnjenje računaju se kad stignu sve četiri oznake.',

      // correction
      corrTitle: 'Ispravak sata',
      corrRule: 'Skok ako je |θ| veći od 1 s i ovo je jedno od prva 3 ažuriranja; inače postupno.',
      corrUpdate: 'ažuriranje {n}',
      corrWait: 'Čeka izračun.',
      corrTook: 'traje {took}',
      corrNow: 'odmah',
      corrBack: 'sat ide unatrag!',
      plotY: 'sat klijenta − pravo vrijeme',
      plotNext: 'sljedeća razmjena',

      // chain mode
      srcTitle: 'Izvori klijenta',
      colSource: 'izvor',
      colBound: '±',
      srcDropped: 'izbačen',
      chainTitle: 'Lanac stratuma',
      chainRef: 'referentni sat (GPS)',
      chainVia: 'njegov izvor',
      chainClient: 'klijent',
      chainUnknown: 'još nepoznat',
      chainBroken: 'nema izabranog izvora',
      trackLine: 'Sat klijenta kasni za izvorom {off} s.',

      // params
      pTrueOffset: 'Stvarni pomak',
      pOut: 'Kašnjenje prema poslužitelju',
      pBack: 'Kašnjenje natrag',
      pProc: 'Obrada',
      pUpdate: 'Ažuriranje',
      pNext: 'Sljedeća razmjena',
      pDown: 'Izvori sa stratumom 16',
      downNone: 'nijedan',
      downBoth: 'oba stratum 1',
      downAll: 'svi',

      // presets
      presetSym: 'Jednako u oba smjera',
      presetSymHint: 'Pomak +100 ms, 10 ms u svakom smjeru: θ je točan.',
      presetAsym: 'Nejednako',
      presetAsymHint: '30 ms tamo, 10 ms natrag: θ griješi za 10 ms.',
      presetBoot: 'Skok pri podizanju',
      presetBootHint: 'Sat kasni 5 s, prvo ažuriranje: sat skače.',
      presetLate: 'Kasno: postupno',
      presetLateHint: 'Isto, deseto ažuriranje: usklađivanje traje satima.',
      presetChain: 'Lanac stratuma',
      presetChainHint: 'Popis izvora iz knjige: tko je izabran i koji je stratum klijenta.',

      // legend
      legArrow: 'poruka; pad = kašnjenje',
      legStampC: 'oznaka klijenta',
      legStampS: 'oznaka poslužitelja',
      legJump: 'skok / postupno',
      legChanged: 'novo u ovom koraku',

      // captions
      capStart: 'Klijent ne zna koliko mu sat odstupa. Poslat će zahtjev i skupiti četiri vremenske oznake: dvije sa svog sata, dvije s poslužiteljeva.',
      capStartLate: 'Ovo je {n}. ažuriranje: klijent je odavno usklađen, a sat mu ipak sad odstupa. Razmjena teče kao i svaka.',
      capT1: 'Klijent šalje zahtjev i bilježi T1 = {v} s po svom satu. T1 putuje u zahtjevu.',
      capT2: 'Zahtjev stiže nakon {d} ms. Poslužitelj bilježi T2 = {v} s po svom satu, koji ne pokazuje isto što i klijentov.',
      capT3: 'Nakon {p} ms obrade poslužitelj odgovara i bilježi T3 = {v} s. Odgovor nosi T1, T2 i T3.',
      capT4: 'Odgovor stiže nakon {d} ms. Klijent bilježi T4 = {v} s po svom satu. Sad ima četiri oznake s dva sata.',
      capComputeSym: 'Pomak θ = ((T2 − T1) + (T3 − T4)) / 2 = {calc} = {theta} s, upravo stvarni pomak: oba smjera trajala su po {d} ms. Kašnjenje δ = {delay} s, bez {p} ms obrade.',
      capComputeOut: 'Pomak θ = ((T2 − T1) + (T3 − T4)) / 2 = {calc} = {theta} s. Stvarni pomak je {true} s: put prema poslužitelju trajao je {diff} ms dulje, pa je procjena kriva za pola te razlike.',
      capComputeBack: 'Pomak θ = ((T2 − T1) + (T3 − T4)) / 2 = {calc} = {theta} s. Stvarni pomak je {true} s: put natrag trajao je {diff} ms dulje, pa je procjena kriva za pola te razlike.',
      capStep: '|θ| = {abs} s veći je od 1 s, a ovo je {n}. ažuriranje, jedno od prva 3: sat skače za {theta} s i odmah je točan.',
      capStepErr: '|θ| = {abs} s veći je od 1 s, a ovo je {n}. ažuriranje, jedno od prva 3: sat skače za {theta} s. Ostaje odstupanje od {err} s, greška zbog nejednakih puteva.',
      capStepBack: '|θ| = {abs} s veći je od 1 s, a ovo je {n}. ažuriranje, jedno od prva 3: sat skače unatrag za {abs} s. Zapis nakon skoka dobiva raniju oznaku od zapisa prije njega.',
      capSlewSmall: '|θ| = {abs} s nije veći od 1 s: sat se usklađuje postupno, malo brže ili sporije tijekom {took}, i nikad ne ide unatrag.',
      capSlewExact: '|θ| = 1 s točno nije „veći od” 1 s: i to se usklađuje postupno, tijekom {took}.',
      capSlewLate: '|θ| = {abs} s veći je od 1 s, ali ovo je {n}. ažuriranje, nakon prva 3: sat se usklađuje postupno. Trebat će {took}; sve to vrijeme sat nije točan, ali ne ide unatrag.',
      capJoined: 'Klijent sad ima izvor: stratum 1 + 1 = 2.',
      capNextStep: '64 s kasnije, {n}. ažuriranje: θ = {theta} s. Skok je sat ispravio odjednom.',
      capNextHidden: '64 s kasnije, {n}. ažuriranje: θ = {theta} s, a sat ipak odstupa {err} s. Isti nejednaki putevi tu grešku skrivaju.',
      capNextSlew: '64 s kasnije, {n}. ažuriranje: θ = {theta} s. Postupno usklađivanje dosad je ispravilo tek {done} s.',
      capNextSlewDone: '64 s kasnije, {n}. ažuriranje: θ = {theta} s. Postupno usklađivanje već je završilo: ispravilo je {done} s.',

      capChainStart: 'Klijent ima četiri izvora; adrese je dobio iz imena skupine poslužitelja u svojoj konfiguraciji. Koga će slijediti?',
      capReplies: 'Izvori odgovaraju. Svaki odgovor nosi stratum izvora; iz odgovora klijent procjenjuje i koliko tom izvoru smije vjerovati (±).',
      capUsableNone: 'Svi su izvori usklađeni (stratum manji od 16): nijedan ne otpada.',
      capUsableSome: ['Otpada {n} izvor sa stratumom 16: ni sam nije usklađen, pa njegov odgovor samo izgleda kao vrijeme.',
        'Otpadaju {n} izvora sa stratumom 16: ni sami nisu usklađeni, pa njihovi odgovori samo izgledaju kao vrijeme.',
        'Otpada {n} izvora sa stratumom 16: ni sami nisu usklađeni, pa njihovi odgovori samo izgledaju kao vrijeme.'],
      capSelect: 'Izabran je (*) {name}: najniži stratum ({s}), a među jednakima najmanji ± ({b} µs).',
      capSelectGu: '{gu} sa stratumom 3 nije izabran: postoje bolji izvori.',
      capSelectNone: 'Nijedan izvor nije upotrebljiv. Popis bez * znači da usluga radi, a ne postiže ništa.',
      capStratum: 'Klijent je korak dalje od izabranog izvora: stratum {s} + 1 = {c}.',
      capStratumOne: 'Stratum 1 ne znači najtočnije vrijeme: znači jedan korak od referentnog sata.',
      capBookOffset: 'Sat mu kasni {off} s za izvorom, daleko manje od 1 s, pa se usklađuje postupno.',
      capStratumNone: 'Bez izabranog izvora klijent ostaje stratum 16: nije usklađen.',

      explain: '<p>Klijent ne može izravno pročitati poslužiteljev sat. Umjesto toga razmjenjuju dvije poruke i skupe četiri ' +
        'vremenske oznake (<i>timestamp</i>): T1 kad klijent šalje i T4 kad prima odgovor, obje s klijentova sata; T2 kad ' +
        'poslužitelj prima i T3 kad odgovara, obje s poslužiteljeva. Odgovor nosi T1, T2 i T3.</p>' +
        '<p>Iz njih slijede [[offset]] θ = ((T2 − T1) + (T3 − T4)) / 2 i kašnjenje povratnog puta (<i>round-trip delay</i>) ' +
        'δ = (T4 − T1) − (T3 − T2). Obrada na poslužitelju (T3 − T2) oduzima se od δ i ne utječe na θ. NTP kašnjenje ne ' +
        'mjeri pa dodaje: formula pretpostavlja jednako vrijeme puta u oba smjera, i tada se ono poništi. Kad putevi nisu ' +
        'jednaki, θ je kriv za polovicu razlike, a nikad više od δ / 2. Tu grešku nijedna sljedeća razmjena ne otkriva.</p>' +
        '<p>Sat se ispravlja na dva načina. [[step]] sat odmah postavlja i smije ga vratiti unatrag; [[slew]] ga ubrzava ' +
        'ili usporava, pa ne ide unatrag, ali dugo nije točan. Ovdje vrijedi pravilo iz knjige: skok ako je |θ| veći od ' +
        '1 s, i to samo u prva 3 ažuriranja, dok se stroj podiže; poslije uvijek postupno.</p>' +
        '<p><i>stratum</i> kaže koliko je koraka izvor udaljen od sata koji vrijeme doista mjeri: ' +
        '[[time server]] s vlastitim referentnim satom je stratum 1, stroj usklađen s izvorom stratuma n postaje n + 1, a 16 ' +
        'znači nije usklađen. Stratum 1 ne znači najtočnije vrijeme, nego jedan korak do referentnog sata.</p>'
    },
    en: {
      stage: 'An NTP exchange between a client and a time server',

      unitMs: '{v} ms',

      laneClient: 'Client',
      laneServer: 'Server',
      markClient: 'C',
      markServer: 'S',
      refClock: 'its own reference clock (GPS)',
      unsync: 'unsynchronised',
      cardStep: 'step',
      cardSlew: 'slew',
      cardSlewFor: 'slewing, {took}',
      msgRequest: 'request',
      msgReply: 'reply',
      msgRequests: 'a request to each',
      reFlight: 'on its way',
      noteStep: 'step',
      noteSlew: 'slew',
      noteDropped: 'stratum 16: dropped',
      noteAllOk: 'all synchronised',
      noteSelected: 'selected',
      noteNone: 'no source',
      chartEmpty: 'No messages yet. Press →.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],

      scaleTitle: 'To scale',
      scaleNext: 'The next exchange, 64 s later',
      scaleClient: 'client',
      scaleServer: 'server',
      scaleTime: 'true time',
      scaleHint: 'The drop of an arrow is the delay that way.',

      calcTitle: 'Calculation',
      stampT1: 'client sends',
      stampT2: 'server receives',
      stampT3: 'server sends',
      stampT4: 'client receives',
      byClient: 'client clock',
      byServer: 'server clock',
      offsetName: 'offset θ',
      delayName: 'round-trip delay δ',
      trueName: 'true offset',
      trueHint: '(only the simulation knows it)',
      errorName: 'error of the estimate',
      boundName: 'at most δ / 2',
      boundOk: 'within the bound',
      calcWait: 'Offset and delay are computed once all four timestamps are in.',

      corrTitle: 'Correcting the clock',
      corrRule: 'Step if |θ| is larger than 1 s and this is one of the first 3 updates; otherwise slew.',
      corrUpdate: 'update {n}',
      corrWait: 'Waits for the calculation.',
      corrTook: 'takes {took}',
      corrNow: 'at once',
      corrBack: 'the clock goes backwards!',
      plotY: 'client clock − true time',
      plotNext: 'next exchange',

      srcTitle: 'The client\'s sources',
      colSource: 'source',
      colBound: '±',
      srcDropped: 'dropped',
      chainTitle: 'Stratum chain',
      chainRef: 'reference clock (GPS)',
      chainVia: 'its source',
      chainClient: 'client',
      chainUnknown: 'not known yet',
      chainBroken: 'no selected source',
      trackLine: 'The client\'s clock is {off} s slow of the source.',

      pTrueOffset: 'True offset',
      pOut: 'Delay to the server',
      pBack: 'Delay back',
      pProc: 'Processing',
      pUpdate: 'Update',
      pNext: 'Next exchange',
      pDown: 'Sources at stratum 16',
      downNone: 'none',
      downBoth: 'both stratum 1',
      downAll: 'all',

      presetSym: 'Same both ways',
      presetSymHint: 'Offset +100 ms, 10 ms each way: θ is right.',
      presetAsym: 'Asymmetric',
      presetAsymHint: '30 ms out, 10 ms back: θ is 10 ms wrong.',
      presetBoot: 'Step at boot',
      presetBootHint: 'The clock is 5 s behind, update 1: the clock steps.',
      presetLate: 'Late: slew',
      presetLateHint: 'The same at update 10: the correction takes hours.',
      presetChain: 'Stratum chain',
      presetChainHint: 'The book\'s source list: which one is selected, and the client\'s stratum.',

      legArrow: 'message; drop = delay',
      legStampC: 'client timestamp',
      legStampS: 'server timestamp',
      legJump: 'step / slew',
      legChanged: 'new in this step',

      capStart: 'The client does not know how far off its clock is. It will send a request and collect four timestamps: two from its own clock, two from the server\'s.',
      capStartLate: 'This is update {n}: the client has been synchronised for a long time, yet its clock is off now. The exchange runs like any other.',
      capT1: 'The client sends the request and notes T1 = {v} s by its own clock. T1 travels in the request.',
      capT2: 'The request arrives after {d} ms. The server notes T2 = {v} s by its own clock, which does not read the same as the client\'s.',
      capT3: 'After {p} ms of processing the server replies and notes T3 = {v} s. The reply carries T1, T2 and T3.',
      capT4: 'The reply arrives after {d} ms. The client notes T4 = {v} s by its own clock. It now has four timestamps from two clocks.',
      capComputeSym: 'Offset θ = ((T2 − T1) + (T3 − T4)) / 2 = {calc} = {theta} s, exactly the true offset: both ways took {d} ms. Delay δ = {delay} s, without the {p} ms of processing.',
      capComputeOut: 'Offset θ = ((T2 − T1) + (T3 − T4)) / 2 = {calc} = {theta} s. The true offset is {true} s: the path to the server took {diff} ms longer, so the estimate is off by half that difference.',
      capComputeBack: 'Offset θ = ((T2 − T1) + (T3 − T4)) / 2 = {calc} = {theta} s. The true offset is {true} s: the path back took {diff} ms longer, so the estimate is off by half that difference.',
      capStep: '|θ| = {abs} s is larger than 1 s, and this is update {n}, one of the first 3: the clock steps by {theta} s and is right at once.',
      capStepErr: '|θ| = {abs} s is larger than 1 s, and this is update {n}, one of the first 3: the clock steps by {theta} s. It is still {err} s off, the error from the unequal paths.',
      capStepBack: '|θ| = {abs} s is larger than 1 s, and this is update {n}, one of the first 3: the clock steps back by {abs} s. An entry logged after the step gets an earlier timestamp than the one before it.',
      capSlewSmall: '|θ| = {abs} s is not larger than 1 s: the clock is slewed, run a little faster or slower for {took}, and never goes backwards.',
      capSlewExact: '|θ| = exactly 1 s is not "larger than" 1 s: this too is slewed, for {took}.',
      capSlewLate: '|θ| = {abs} s is larger than 1 s, but this is update {n}, past the first 3: the clock is slewed. It will take {took}; all that time the clock is wrong, but it never goes backwards.',
      capJoined: 'The client now has a source: stratum 1 + 1 = 2.',
      capNextStep: '64 s later, update {n}: θ = {theta} s. The step fixed the clock at once.',
      capNextHidden: '64 s later, update {n}: θ = {theta} s, yet the clock is still {err} s off. The same unequal paths hide that error.',
      capNextSlew: '64 s later, update {n}: θ = {theta} s. Slewing has corrected only {done} s so far.',
      capNextSlewDone: '64 s later, update {n}: θ = {theta} s. The slew has already finished: it corrected {done} s.',

      capChainStart: 'The client has four sources; it got their addresses from a pool name in its configuration. Which one will it follow?',
      capReplies: 'The sources answer. Each reply carries the source\'s stratum; from the reply the client also estimates how far it can trust that source (±).',
      capUsableNone: 'Every source is synchronised (stratum below 16): none is dropped.',
      capUsableSome: ['{n} source at stratum 16 is dropped: it is not synchronised itself, so its answer only looks like a time.',
        '{n} sources at stratum 16 are dropped: they are not synchronised themselves, so their answers only look like a time.'],
      capSelect: 'Selected (*): {name}, the lowest stratum ({s}) and, among equals, the smallest ± ({b} µs).',
      capSelectGu: '{gu} at stratum 3 is not chosen: there are better sources.',
      capSelectNone: 'No source is usable. A list without * means the service runs and achieves nothing.',
      capStratum: 'The client is one hop further than its selected source: stratum {s} + 1 = {c}.',
      capStratumOne: 'Stratum 1 does not mean the most accurate time: it means one hop from a reference clock.',
      capBookOffset: 'Its clock is {off} s slow of the source, far less than 1 s, so it is slewed.',
      capStratumNone: 'Without a selected source the client stays at stratum 16: unsynchronised.',

      explain: '<p>The client cannot read the server\'s clock directly. Instead they exchange two messages and collect four ' +
        'timestamps: T1 when the client sends and T4 when it receives the reply, both on the client\'s clock; T2 when the ' +
        'server receives and T3 when it replies, both on the server\'s. The reply carries T1, T2 and T3.</p>' +
        '<p>From them follow the [[offset]] θ = ((T2 − T1) + (T3 − T4)) / 2 and the round-trip delay ' +
        'δ = (T4 − T1) − (T3 − T2). Processing at the server (T3 − T2) is taken out of δ and does not affect θ. NTP does ' +
        'not measure the delay and add it: the formula assumes the same travel time both ways, and then it cancels. When ' +
        'the paths differ, θ is wrong by half the difference, and never by more than δ / 2. No later exchange reveals that ' +
        'error.</p>' +
        '<p>The clock is corrected in one of two ways. A [[step]] sets it at once and may move it backwards; a [[slew]] runs ' +
        'it faster or slower, so it never goes backwards, but it is wrong for a long time. The rule here is the book\'s: ' +
        'step if |θ| is larger than 1 s, and only in the first 3 updates, while the machine boots; after that always slew.</p>' +
        '<p>The <i>stratum</i> says how many hops a source is from a clock that really measures time: a [[time server]] with ' +
        'its own reference clock is stratum 1, a machine synchronised to a stratum-n source becomes n + 1, and 16 means ' +
        'unsynchronised. Stratum 1 does not mean the most accurate time, only one hop from a reference clock.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
