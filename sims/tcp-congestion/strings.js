/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the TCP congestion control page, in both languages (docs/sim-ui.md §9). Same keys in hr and
   en; the page looks them up with t(key). The title and subtitle come from sim.json (title, concept).
   Terms follow the URM book (kontrola zagušenja, izbjegavanje zagušenja, vrijeme kruženja, kontrola toka); the rest
   are simdeck's pairs, written out on first mention because kit/glossary.js lacks them (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Prozor zagušenja kroz vrijeme',
      chartLabel: 'Graf: prozor zagušenja (cwnd) u MSS-ovima po rundama od jednog RTT-a',
      // params
      algo: 'Algoritam',
      algoBoth: 'oba',
      rtt: 'RTT',
      capacity: 'Kapacitet',
      lossMode: 'Gubici',
      lossCapacity: 'pun kapacitet',
      lossRandom: '+ nasumični',
      p: 'Gubitak',
      iw: 'Početni prozor',
      timeoutAt: 'Timeout',
      timeoutNone: 'bez',
      timeoutRound: 'runda {r}',
      friendly: 'CUBIC: Reno-friendly region',
      friendlyHint: 'Područje prijateljsko Renu: CUBIC ne raste sporije od Renove procjene (0,53 MSS po RTT-u).',
      reseed: 'Novi gubici',
      // presets
      presetSlow: 'Slow start',
      presetSlowHint: 'Kapacitet 100. Je li slow start spor? Koliko RTT-ova treba od 1 do 64?',
      presetSaw: 'Pila (AIMD)',
      presetSawHint: 'Kapacitet 40. Gdje se prozor prepolovi i koliko mu treba da se vrati?',
      presetTimeout: 'Timeout',
      presetTimeoutHint: 'Pila s timeoutom u rundi 30. Po čemu se razlikuje od tri duple potvrde?',
      presetVs: 'Reno ili CUBIC',
      presetVsHint: 'Oba, RTT 100 ms. Tko se brže vraća nakon gubitka?',
      presetLong: 'RTT 200 ms',
      presetLongHint: 'Isto uz RTT 200 ms. Koji se algoritam usporio, a koji nije?',
      presetRandom: 'Gubici 1 %',
      presetRandomHint: '1 % segmenata gubi se nasumično. Što se dogodi s prosječnim prozorom?',
      // legend
      legendReno: 'Reno',
      legendCubic: 'CUBIC',
      legendSsthresh: 'ssthresh',
      legendCapacity: 'kapacitet',
      legendDup: 'tri duple potvrde',
      legendTimeout: 'timeout (istek vremena)',
      legendSlow: 'slow start (spori početak)',
      legendChanged: 'promijenjeno',
      // chart
      axisRounds: 'runda (RTT)',
      axisSeconds: 'vrijeme (s)',
      axisCwnd: 'cwnd (MSS)',
      lineCapacity: 'kapacitet {v}',
      lineSsthresh: 'ssthresh',
      phaseSlow: 'slow start',
      phaseAvoid: 'congestion avoidance',
      // summary
      sumAlgo: 'algoritam',
      sumLosses: 'gubici',
      sumAvg: 'prosječni cwnd',
      sumLast: 'zadnji pad',
      sumBack: 'natrag na prijašnji cwnd',
      sumNone: 'nema',
      sumSlowAgain: 'opet slow start',
      sumRounds: '{n} RTT',
      // captions
      captionBoth: 'Uz RTT {rtt} Reno nakon pada {rfrom} → {rto} treba {rs} da se vrati, a CUBIC nakon pada {cfrom} → {cto} ' +
        'dođe do Wmax za oko {cs}: njegov rast mjeri se sekundama, a ne kružnim putovanjima.',
      captionTimeout: '{algo}: timeout u rundi {r} pri cwnd = {from}: ssthresh = {ss}, cwnd = 1 i opet slow start. ' +
        'Samo timeout vraća prozor na 1; tri duple potvrde ga samo smanje.',
      captionTimeoutBoth: 'Timeout u rundi {r}: Reno pri cwnd = {rfrom} dobije ssthresh = {rss}, CUBIC pri {cfrom} dobije ' +
        '{css} (β·cwnd); oba kreću od cwnd = 1, opet u slow startu. Tri duple potvrde prozor samo smanje.',
      captionRandom: 'Nasumični gubici (na grafu {n}, uz {c} na punom kapacitetu) prekidaju zupce prije kapaciteta: ' +
        'prosječni cwnd ({algo}) je {avg} MSS, a bez njih {base} MSS.',
      captionSlow: 'Slow start nije spor: cwnd se udvostručuje svaki RTT, od {from} do ssthresh = {ss} za {k} RTT. Dalje ' +
        'raste za jedan MSS po RTT-u (congestion avoidance).',
      captionRenoDup: 'Tri duple potvrde pri cwnd = {from}: Reno prepolovi prozor na {to} i opet raste za jedan MSS po RTT-u. ' +
        'Do {from} treba mu {k} RTT, {s}.',
      captionCubicDup: 'Tri duple potvrde pri cwnd = {from}: CUBIC zadrži 70 % prozora ({to}) i vrati se do Wmax = {from} ' +
        'za K = {s}, sve sporije što je bliže.',
      captionCubicFriendly: 'Tri duple potvrde pri cwnd = {from}: CUBIC zadrži 70 % prozora ({to}). Renova procjena ' +
        '(0,53 MSS po RTT-u) ovdje je iznad kubne funkcije, pa raste ravno i do {from} dođe za {k} RTT, {s}, prije K = {K}.',
      captionBothFriendly: 'Uz RTT {rtt} Reno nakon pada {rfrom} → {rto} treba {rs} da se vrati. CUBIC je u Reno-friendly ' +
        'regionu: raste po Renovoj procjeni, 0,53 MSS po RTT-u, i do Wmax mu treba {cs}.',
      captionNoLoss: 'Nema gubitaka: cwnd raste do kraja grafa i nikad ne prijeđe kapacitet od {cap} MSS.',
      explain: '<p><strong>Mreža, ne primatelj.</strong> <i lang="en">Flow control</i> (kontrola toka) štiti primatelja ' +
        'njegovim prozorom. <i lang="en">Congestion control</i> (kontrola zagušenja) štiti mrežu između njih: pošiljatelj ' +
        'drži vlastiti <i lang="en">congestion window</i> (prozor zagušenja, cwnd), broj segmenata (MSS) koje smije imati ' +
        'u letu tijekom jednog <i lang="en">round-trip time</i> (vrijeme kruženja, RTT).</p>' +
        '<p><strong><i lang="en">Slow start</i> (spori početak) nije spor.</strong> Svaka potvrda dodaje jedan MSS, pa se ' +
        'cwnd udvostruči svaki RTT: 1, 2, 4, … 64. Raste tako do praga <i lang="en">slow-start threshold</i> (prag sporog ' +
        'početka, ssthresh); dalje vrijedi <i lang="en">congestion avoidance</i> (izbjegavanje zagušenja): jedan MSS po ' +
        'RTT-u.</p>' +
        '<p><strong>Pila.</strong> Kad prozor prijeđe kapacitet uskog grla (umnožak propusnosti i kašnjenja plus ' +
        'međuspremnik), jedan se segment izgubi, a primatelj tri puta ponovi istu potvrdu: <i lang="en">duplicate ' +
        'ACK</i> (dupla potvrda). Na tri duple potvrde Reno prepolovi prozor i opet raste za jedan MSS: ' +
        '<i lang="en">additive increase, multiplicative decrease</i> (aditivno povećanje, multiplikativno smanjenje, ' +
        'AIMD). Tek <i lang="en">timeout</i> (istek vremena), kad potvrde uopće ne stižu, vraća cwnd na 1, pa ' +
        '<i lang="en">slow start</i> kreće ispočetka, do pola prijašnjeg prozora.</p>' +
        '<p><strong>CUBIC.</strong> Nakon gubitka zadrži 70 % prozora (β = 0,7), a dalje ga računa iz vremena od gubitka: ' +
        'W(t) = C·(t − K)³ + Wmax, C = 0,4. Raste brzo, uspori blizu Wmax (prozora pri gubitku), pa opet ubrza. Do Wmax ' +
        'dođe za K = ∛(0,3·Wmax / 0,4) sekundi, koliko god RTT bio, a Reno treba (Wmax − Wmax/2) RTT-ova: dvostruko dulji ' +
        'RTT, dvostruko dulji zub. Uz kratak RTT <i lang="en">Reno-friendly region</i> (područje prijateljsko Renu) ' +
        'pazi da CUBIC ne raste sporije od Renove procjene (0,53 MSS po RTT-u).</p>' +
        '<p><strong>Što je ovdje pojednostavljeno.</strong> Jedna točka po RTT-u; <i lang="en">fast recovery</i> (brzi ' +
        'oporavak) traje jednu rundu; gubitak nastaje kad prozor prijeđe kapacitet ili, uz nasumične gubitke, sa zadanom ' +
        'vjerojatnošću po segmentu; s manje od četiri segmenta u letu nema tri duple potvrde, pa je to timeout.</p>'
    },
    en: {
      stage: 'Congestion window over time',
      chartLabel: 'Chart: congestion window (cwnd) in MSS per round of one RTT',
      algo: 'Algorithm',
      algoBoth: 'both',
      rtt: 'RTT',
      capacity: 'Capacity',
      lossMode: 'Losses',
      lossCapacity: 'full capacity',
      lossRandom: '+ random',
      p: 'Loss',
      iw: 'Initial window',
      timeoutAt: 'Timeout',
      timeoutNone: 'none',
      timeoutRound: 'round {r}',
      friendly: 'CUBIC: Reno-friendly region',
      friendlyHint: 'CUBIC grows no slower than the Reno estimate (0.53 MSS per RTT).',
      reseed: 'New losses',
      presetSlow: 'Slow start',
      presetSlowHint: 'Capacity 100. Is slow start slow? How many RTTs from 1 to 64?',
      presetSaw: 'AIMD sawtooth',
      presetSawHint: 'Capacity 40. Where does the window halve, and how long does it take to climb back?',
      presetTimeout: 'Timeout',
      presetTimeoutHint: 'The sawtooth with a timeout in round 30. How is it different from three duplicate ACKs?',
      presetVs: 'Reno vs CUBIC',
      presetVsHint: 'Both, RTT 100 ms. Which one is back sooner after a loss?',
      presetLong: 'RTT 200 ms',
      presetLongHint: 'The same at RTT 200 ms. Which algorithm slowed down, and which did not?',
      presetRandom: 'Losses 1 %',
      presetRandomHint: '1 % of segments are lost at random. What happens to the average window?',
      legendReno: 'Reno',
      legendCubic: 'CUBIC',
      legendSsthresh: 'ssthresh',
      legendCapacity: 'capacity',
      legendDup: 'three duplicate ACKs',
      legendTimeout: 'timeout',
      legendSlow: 'slow start',
      legendChanged: 'changed',
      axisRounds: 'round (RTT)',
      axisSeconds: 'time (s)',
      axisCwnd: 'cwnd (MSS)',
      lineCapacity: 'capacity {v}',
      lineSsthresh: 'ssthresh',
      phaseSlow: 'slow start',
      phaseAvoid: 'congestion avoidance',
      sumAlgo: 'algorithm',
      sumLosses: 'losses',
      sumAvg: 'average cwnd',
      sumLast: 'last drop',
      sumBack: 'back to the earlier cwnd',
      sumNone: 'none',
      sumSlowAgain: 'slow start again',
      sumRounds: '{n} RTT',
      captionBoth: 'At RTT {rtt}, Reno takes {rs} to climb back after {rfrom} → {rto}, while CUBIC returns to Wmax after ' +
        'about {cs} ({cfrom} → {cto}): its growth is measured in seconds, not round trips.',
      captionTimeout: '{algo}: timeout in round {r} at cwnd = {from}: ssthresh = {ss}, cwnd = 1 and slow start again. ' +
        'Only a timeout drops the window to 1; three duplicate ACKs only cut it.',
      captionTimeoutBoth: 'Timeout in round {r}: Reno at cwnd = {rfrom} gets ssthresh = {rss}, CUBIC at {cfrom} gets {css} ' +
        '(β·cwnd); both restart from cwnd = 1 in slow start. Three duplicate ACKs only cut the window.',
      captionRandom: 'Random losses ({n} on the chart, besides {c} at full capacity) cut the teeth short before the ' +
        'capacity: the average cwnd ({algo}) is {avg} MSS, against {base} MSS without them.',
      captionSlow: 'Slow start is not slow: cwnd doubles every RTT, from {from} up to ssthresh = {ss} in {k} RTT. After ' +
        'that it grows by one MSS per RTT (congestion avoidance).',
      captionRenoDup: 'Three duplicate ACKs at cwnd = {from}: Reno halves the window to {to} and grows by one MSS per RTT ' +
        'again. It takes {k} RTT, {s}, to get back to {from}.',
      captionCubicDup: 'Three duplicate ACKs at cwnd = {from}: CUBIC keeps 70 % of the window ({to}) and is back at ' +
        'Wmax = {from} after K = {s}, slower the closer it gets.',
      captionCubicFriendly: 'Three duplicate ACKs at cwnd = {from}: CUBIC keeps 70 % of the window ({to}). The Reno ' +
        'estimate (0.53 MSS per RTT) is above the cubic here, so it grows in a straight line and is back at {from} after ' +
        '{k} RTT, {s}, before K = {K}.',
      captionBothFriendly: 'At RTT {rtt}, Reno takes {rs} to climb back after {rfrom} → {rto}. CUBIC is in the ' +
        'Reno-friendly region: it grows by the Reno estimate, 0.53 MSS per RTT, and needs {cs} to reach Wmax.',
      captionNoLoss: 'No losses: cwnd grows to the end of the chart and never passes the capacity of {cap} MSS.',
      explain: '<p><strong>The network, not the receiver.</strong> Flow control protects the receiver with its window. ' +
        'Congestion control protects the network in between: the sender keeps its own congestion window (cwnd), the ' +
        'number of segments (MSS) it may have in flight during one round-trip time (RTT).</p>' +
        '<p><strong>Slow start is not slow.</strong> In slow start every acknowledgment adds one MSS, so cwnd doubles ' +
        'every RTT: 1, 2, 4, … 64. It grows like that up to the slow-start threshold (ssthresh); after that comes ' +
        'congestion avoidance: one MSS per RTT.</p>' +
        '<p><strong>The sawtooth.</strong> When the window passes the bottleneck\'s capacity (the bandwidth-delay product ' +
        'plus the buffer), a segment is lost and the receiver repeats the same acknowledgment: a duplicate ACK. On ' +
        'three duplicate ACKs Reno halves the window and grows by one MSS again: additive increase, multiplicative decrease (AIMD). Only ' +
        'a timeout, when acknowledgments stop coming at all, drops cwnd to 1 and starts slow start again, up to half the ' +
        'earlier window.</p>' +
        '<p><strong>CUBIC.</strong> After a loss it keeps 70 % of the window (β = 0.7) and then computes it from the time ' +
        'since the loss: W(t) = C·(t − K)³ + Wmax, C = 0.4. It grows fast, slows down near Wmax (the window at the loss), ' +
        'then speeds up again. It is back at Wmax after K = ∛(0.3·Wmax / 0.4) seconds whatever the RTT, while Reno needs ' +
        '(Wmax − Wmax/2) RTTs: twice the RTT, twice as long a tooth. With a short RTT, the Reno-friendly region keeps ' +
        'CUBIC from growing slower than the Reno estimate (0.53 MSS per RTT).</p>' +
        '<p><strong>What is simplified here.</strong> One point per RTT; fast recovery takes one round; a loss happens ' +
        'when the window passes the capacity or, with random losses, with the given chance per segment; with fewer ' +
        'than four segments in flight there are no three duplicate ACKs, so that is a timeout.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
