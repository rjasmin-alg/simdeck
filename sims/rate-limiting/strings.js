/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of rate-limiting, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Plural forms: hr 1 / 2–4 / 5+, en 1 / other. The title and subtitle come from sim.json.
   The terms (token bucket, leaky bucket, burst, policing, shaping) are not in kit/glossary.js yet: the pairs are
   written out here (NOTES.md, Term pairs). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Ista struja zahtjeva kroz kanticu sa žetonima i kroz kanticu koja curi',
      r: 'Brzina r',
      rHint: 'Ista za obje: žetoni pristižu, red se prazni.',
      b: 'Kantica sa žetonima: veličina b',
      q: 'Red čekanja: veličina q',
      pattern: 'Dolasci',
      patBurst: 'nalet od 10',
      patSteady: 'stalno 3/s',
      patIdle: 'nalet, tišina, nalet',
      perSec: '{n}/s',
      presetBurst: 'Nalet od 10 zahtjeva',
      presetBurstHint: 'Žetoni: 5 odmah, 5 odbijeno',
      presetSteady: 'Stalno preopterećenje 3/s',
      presetSteadyHint: 'Žetoni nestaju u 4,5 s',
      presetIdle: 'Tišina, pa novi nalet',
      presetIdleHint: 'Drugi nalet prolazi cijeli',
      presetNoBurst: 'Kantica od jednog žetona',
      presetNoBurstHint: 'b = 1: jedan svakih 0,5 s',
      legRequest: 'zahtjev',
      legToken: 'žeton',
      legPassed: 'prošao',
      legRejected: 'odbijen ili odbačen',
      legQueued: 'čeka u redu',
      legChanged: 'odlučeno u ovom koraku',
      rowArrivals: 'Dolasci',
      rowToken: 'Kantica sa žetonima',
      rowLeaky: 'Kantica koja curi',
      arrived: 'stiglo {n} od {total}',
      tokenLevel: '{v} od {b} žetona, +{r} u sekundi',
      leakRate: 'red {n} od {q}, izlazi 1 svakih {gap} s',
      leavesAt: 'izlazi u (s)',
      cntPassed: 'prošlo {n}',
      cntRejected: 'odbijeno {n}',
      cntDropped: 'odbačeno {n}',
      cntDelay: 'najdulje čekanje {v} s',
      axis: 't (s)',
      now: 'sada',
      request: 'zahtjev {id}',
      capStart: 'Prije t = 0: kantica sa žetonima je puna ({tokens}), red je prazan. {stream} Pritisni → za prvi korak.',
      tokensN: ['{n} žeton', '{n} žetona', '{n} žetona'],
      streamBurst: 'U t = 0 stiže 10 zahtjeva odjednom.',
      streamSteady: 'Stižu 3 zahtjeva u sekundi, 6 sekundi zaredom.',
      streamIdle: 'Nalet od 5, 3 s tišine, pa još jedan nalet od 5.',
      capClock: 't = {t} s:',
      capArrive: ['stiže {n} zahtjev.', 'stižu {n} zahtjeva.', 'stiže {n} zahtjeva.'],
      capNoArrive: 'nema novih zahtjeva.',
      tbFull: 'Kantica sa žetonima bila je puna:',
      tbHad: 'Kantica sa žetonima imala je {v} od {b} žetona:',
      tbPass: ['{n} zahtjev prolazi odmah', '{n} zahtjeva prolaze odmah', '{n} zahtjeva prolazi odmah'],
      tbRest: [', {n} je odbijen.', ', ostala {n} su odbijena.', ', ostalih {n} je odbijeno.'],
      tbAllRejected: ['{n} zahtjev je odbijen.', '{n} zahtjeva su odbijena.', '{n} zahtjeva je odbijeno.'],
      tbRefill: 'Kantica sa žetonima puni se: {v} od {b} žetona.',
      tbFullAgain: 'Kantica sa žetonima opet je puna.',
      tbDry: 'Žetoni su potrošeni: sada zahtjev prolazi tek kad pristigne novi žeton.',
      lbHead: 'Kantica koja curi:',
      lbQueued: ['{n} ulazi u red', '{n} ulaze u red', '{n} ulazi u red'],
      lbDropped: [', {n} je odbačen', ', {n} su odbačena', ', {n} je odbačeno'],
      lbAllDropped: ['red je pun, {n} je odbačen', 'red je pun, {n} su odbačena', 'red je pun, {n} je odbačeno'],
      lbOutNow: 'zahtjev {id} izlazi odmah',
      lbOutOne: 'izlazi zahtjev {id}, čekao je {w} s',
      lbOutMany: 'izlaze zahtjevi {ids}, najdulje je čekao {w} s',
      lbWaiting: ['u redu čeka {n}', 'u redu čekaju {n}', 'u redu čeka {n}'],
      lbEmpty: 'red je prazan',
      lbDrained: 'Kantica koja curi propustila je isti nalet, ali jedan po jedan svakih {gap} s: zadnji je zahtjev čekao {w} s.',
      lbFirstDrop: 'Red je pun: višak se odbacuje.',
      sep: '; ',
      dot: '.',
      capEnd: 'Kraj. Žetoni: prošlo {p}, odbijeno {x}, bez čekanja. Red: prošlo {lp}, odbačeno {d}, najdulje čekanje {w} s.',
      capEndQueued: ['U redu još čeka {n} zahtjev: izlazi u {out} s, nakon {w} s čekanja.',
        'U redu još čekaju {n} zahtjeva: zadnji izlazi u {out} s, nakon {w} s čekanja.',
        'U redu još čeka {n} zahtjeva: zadnji izlazi u {out} s, nakon {w} s čekanja.'],
      explain: '<p><i>Rate limiting</i> (ograničavanje brzine) propušta u prosjeku najviše r zahtjeva u sekundi. Obje ' +
        'kantice ovdje imaju istu brzinu r; razlikuju se u tome što rade s <i>burst</i> (nalet), mnogo zahtjeva odjednom.</p>' +
        '<p><b><i>Token bucket</i> (kantica sa žetonima).</b> Žetoni pristižu brzinom r, a u kanticu stane najviše b. ' +
        'Zahtjev koji nađe žeton prolazi odmah i uzima ga; inače je odbijen. To je <i>policing</i> (odbacivanje viška). ' +
        'Puna kantica propušta nalet do b zahtjeva odjednom, a dugoročno ne više od r u sekundi.</p>' +
        '<p><b><i>Leaky bucket</i> (kantica koja curi)</b>, ovdje kao red čekanja s q mjesta: zahtjev ulazi u red, a iz ' +
        'reda izlazi jedan svakih 1/r sekundi. Pun red odbacuje. Izlaz je ravnomjeran, a nalet postaje čekanje. To je ' +
        '<i>shaping</i> (oblikovanje prometa).</p>' +
        '<p>Kantica sa samo jednim žetonom (b = 1) ne propušta nalete: izlaz izgleda kao iz reda, ali višak se odbija ' +
        'umjesto da čeka.</p>' +
        '<p><b>Česte zablude.</b> „Ograničenje od 2/s znači da u jednoj sekundi nikad ne prođe više od 2": puna kantica ' +
        'sa žetonima propusti b odjednom. „Obje kantice su ista stvar": dugoročno propuštaju jednako, ali jedna nalet ' +
        'propušta, a druga ga razvlači. „Odbiti je uvijek gore nego zadržati": čekanje ima svoju cijenu, najsporiji ' +
        'zahtjevi kasne (<i>tail latency</i>, latencija repa).</p>'
    },
    en: {
      stage: 'The same stream of requests through a token bucket and a leaky bucket',
      r: 'Rate r',
      rHint: 'The same for both: tokens arrive, the queue drains.',
      b: 'Token bucket: size b',
      q: 'Queue: size q',
      pattern: 'Arrivals',
      patBurst: 'burst of 10',
      patSteady: 'steady 3/s',
      patIdle: 'burst, idle, burst',
      perSec: '{n}/s',
      presetBurst: 'A burst of 10 requests',
      presetBurstHint: 'Tokens: 5 at once, 5 rejected',
      presetSteady: 'Steady overload, 3/s',
      presetSteadyHint: 'Tokens run out at 4.5 s',
      presetIdle: 'Idle, then another burst',
      presetIdleHint: 'The second burst passes whole',
      presetNoBurst: 'A one-token bucket',
      presetNoBurstHint: 'b = 1: one every 0.5 s',
      legRequest: 'request',
      legToken: 'token',
      legPassed: 'passed',
      legRejected: 'rejected or dropped',
      legQueued: 'queued',
      legChanged: 'decided in this step',
      rowArrivals: 'Arrivals',
      rowToken: 'Token bucket',
      rowLeaky: 'Leaky bucket',
      arrived: '{n} of {total} arrived',
      tokenLevel: '{v} of {b} tokens, +{r} a second',
      leakRate: 'queue {n} of {q}, one leaves every {gap} s',
      leavesAt: 'leaves at (s)',
      cntPassed: 'passed {n}',
      cntRejected: 'rejected {n}',
      cntDropped: 'dropped {n}',
      cntDelay: 'max delay {v} s',
      axis: 't (s)',
      now: 'now',
      request: 'request {id}',
      capStart: 'Before t = 0: the token bucket is full ({tokens}), the queue is empty. {stream} Press → for the first step.',
      tokensN: ['{n} token', '{n} tokens'],
      streamBurst: '10 requests arrive at once at t = 0.',
      streamSteady: '3 requests a second arrive for 6 seconds.',
      streamIdle: 'A burst of 5, 3 s of silence, then another burst of 5.',
      capClock: 't = {t} s:',
      capArrive: ['{n} request arrives.', '{n} requests arrive.'],
      capNoArrive: 'no new requests.',
      tbFull: 'The token bucket was full:',
      tbHad: 'The token bucket held {v} of {b} tokens:',
      tbPass: ['{n} request passes at once', '{n} requests pass at once'],
      tbRest: [', the other {n} is rejected.', ', the other {n} are rejected.'],
      tbAllRejected: ['{n} request is rejected.', '{n} requests are rejected.'],
      tbRefill: 'The token bucket refills: {v} of {b} tokens.',
      tbFullAgain: 'The token bucket is full again.',
      tbDry: 'The tokens are used up: a request now passes only once a new token has arrived.',
      lbHead: 'Leaky bucket:',
      lbQueued: ['{n} joins the queue', '{n} join the queue'],
      lbDropped: [', {n} is dropped', ', {n} are dropped'],
      lbAllDropped: ['the queue is full, {n} is dropped', 'the queue is full, {n} are dropped'],
      lbOutNow: 'request {id} leaves at once',
      lbOutOne: 'request {id} leaves after waiting {w} s',
      lbOutMany: 'requests {ids} leave, the longest wait {w} s',
      lbWaiting: ['{n} waits in the queue', '{n} wait in the queue'],
      lbEmpty: 'the queue is empty',
      lbDrained: 'The leaky bucket let the same burst through, but one every {gap} s: the last request waited {w} s.',
      lbFirstDrop: 'The queue is full: the excess is dropped.',
      sep: '; ',
      dot: '.',
      capEnd: 'End. Token bucket: {p} passed, {x} rejected, no waiting. Leaky bucket: {lp} passed, {d} dropped, max delay {w} s.',
      capEndQueued: ['{n} request is still queued: it leaves at {out} s, after waiting {w} s.',
        '{n} requests are still queued: the last leaves at {out} s, after waiting {w} s.'],
      explain: '<p><i>Rate limiting</i> lets through at most r requests a second on average. Both buckets here have the ' +
        'same rate r; they differ in what they do with a <i>burst</i>, many requests at once.</p>' +
        '<p><b><i>Token bucket</i>.</b> Tokens arrive at rate r, and the bucket holds at most b. A request that finds a ' +
        'token passes at once and takes it; otherwise it is rejected. This is <i>policing</i>. A full bucket lets a burst ' +
        'of up to b requests through at once, and in the long run no more than r a second.</p>' +
        '<p><b><i>Leaky bucket</i></b>, here as a queue with q places: a request joins the queue, and one leaves every 1/r ' +
        'seconds. A full queue drops. The output is smooth, and a burst becomes delay. This is <i>shaping</i>.</p>' +
        '<p>A bucket with a single token (b = 1) lets no bursts through: its output looks like the queue\'s, but the ' +
        'excess is rejected instead of waiting.</p>' +
        '<p><b>Common misconceptions.</b> "A limit of 2/s means never more than 2 in any second": a full token bucket ' +
        'lets b through at once. "Both buckets are the same thing": in the long run they pass the same, but one lets a ' +
        'burst through and the other spreads it out. "Rejecting is always worse than delaying": waiting has its own cost, ' +
        'the slowest requests are late (<i>tail latency</i>).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
