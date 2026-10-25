/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of delay-components, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   The four delay names are not in kit/glossary.js yet (NOTES.md "Term pairs"), so they are written out here: the
   term* keys are markup for the first mention on Croatian pages (English term in italics, Croatian in parentheses);
   no caption names a term twice. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Jedan skok: izvor, veza 1, usmjernik, veza 2, odredište, i vremenski slijed kašnjenja',
      dec: ',',

      size: 'Veličina paketa',
      rate: 'Brzina veze',
      distance: 'Udaljenost (po vezi)',
      medium: 'Medij',
      load: 'Opterećenje usmjernika',
      proc: 'Obrada na usmjerniku',
      fibre: 'vlakno',
      copper: 'bakar',
      radio: 'radio',
      bytes: '{v} B',
      mbps: '{v} Mb/s',
      gbps: '{v} Gb/s',
      km: '{v} km',
      metres: '{v} m',
      percent: '{v} %',
      ms: '{v} ms',

      'preset_slow-fast-link': 'Spora i brza veza',
      'hint_slow-fast-link': '10 Mb/s → 1 Gb/s, 100 km vlakna, 1500 B',
      'preset_near-far': 'Blizu i daleko',
      'hint_near-far': '100 m → 7000 km vlakna, 1 Gb/s',
      preset_satellite: 'Preko satelita',
      hint_satellite: 'Geostacionarni satelit: 2 × 35 786 km, 50 Mb/s',
      'preset_busy-router': 'Zauzet usmjernik',
      'hint_busy-router': 'Opterećenje 0 → 90 %, 100 Mb/s',
      'preset_small-packet': 'Mali paket',
      'hint_small-packet': '1500 B → 64 B, 10 Mb/s',

      legTrans: 'prijenos (1, 5)',
      legProp: 'širenje (2, 6)',
      legProc: 'obrada (3)',
      legQueue: 'čekanje u redu (4)',
      legChanged: 'promijenjeno',

      src: 'Računalo (izvor)',
      dst: 'Računalo (odredište)',
      router: 'Usmjernik',
      satellite: 'Satelit',
      link: 'veza {n}',
      ahead: 'u redu ispred, prosječno: {n}',
      aheadMore: '+{n}',

      segTrans: 'Prijenos',
      segProp: 'Širenje',
      segProc: 'Obrada',
      segQueue: 'Čekanje u redu',
      fTrans: 'L / R = {bits} b ÷ {rate}',
      fProp: 'd / s = {d} ÷ {s} km/s',
      fProc: 'stalno, po usmjerniku',
      fQueue: '{n} × {t} ms (U = {u} %)',
      fQueueCap: 'raste prema ∞ kad U → 100 %',
      was: 'prije: {v} ms',
      timeline: 'vremenski slijed',
      now: 'sada',
      before: 'prije',
      sent: 'trenutak slanja',
      received: 'trenutak primitka',
      total: 'ukupno kašnjenje',
      notToScale: 'kraća traka nije u mjerilu',

      termTr: '<i lang="en">transmission delay</i> (kašnjenje prijenosa)',
      termPr: '<i lang="en">propagation delay</i> (kašnjenje širenja)',
      termPc: '<i lang="en">processing delay</i> (kašnjenje obrade)',
      termQu: '<i lang="en">queuing delay</i> (kašnjenje čekanja u redu)',

      capTotal: 'Ukupno kašnjenje {total} ms zbroj je šest dijelova: {tr} 2 × {a} ms, {pr} 2 × {b} ms, {pc} {c} ms i {qu} {d} ms.',
      capFaster: 'Brža veza skratila je {tr} s {a} ms na {b} ms; {pr} ostao je {p} ms.',
      capSlower: 'Sporija veza produljila je {tr} s {a} ms na {b} ms; {pr} ostao je {p} ms.',
      capSmaller: 'Manji paket skratio je {tr} s {a} ms na {b} ms; {pr} ostao je {p} ms.',
      capBigger: 'Veći paket produljio je {tr} s {a} ms na {b} ms; {pr} ostao je {p} ms.',
      capQueueToo: 'Red na usmjerniku mijenja se s njim, s {a} ms na {b} ms: čeka pakete te duljine.',
      capFarther: 'Dulji put produljio je {pr} s {a} ms na {b} ms po vezi; {tr} ostao je {t} ms.',
      capNearer: 'Kraći put skratio je {pr} s {a} ms na {b} ms po vezi; {tr} ostao je {t} ms.',
      capMedium: 'Drugi medij promijenio je {pr} s {a} ms na {b} ms po vezi, jer signal sad putuje {s} km/s; {tr} ostao je {t} ms.',
      capPath: 'Drugi put i medij promijenili su {pr} s {a} ms na {b} ms po vezi, {ow} ms u jednom smjeru; {tr} ostao je {t} ms.',
      capLoad: 'Pri opterećenju od {u} % red na usmjerniku dodaje {q} ms; veza i udaljenost nisu se promijenile.',
      capLoadCap: 'Pri opterećenju od {u} % red na usmjerniku dodaje {q} ms i raste prema beskonačnosti kako se opterećenje približava 100 %.',
      capLoadZero: 'Bez drugog prometa red je prazan: {qu} je 0 ms.',
      capProc: 'Na usmjerniku se {pc} promijenio s {a} ms na {b} ms; ništa drugo se nije promijenilo.',
      capMany: 'Promijenilo se više postavki odjednom: ukupno kašnjenje s {a} ms na {b} ms.',

      explain:
        '<p>Ukupno kašnjenje, [[latency]], vrijeme je od slanja do primitka paketa. Nije jedna veličina nego ' +
        'zbroj četiriju sastavnica, na svakom čvoru i svakoj vezi puta. Na jednom skoku preko usmjernika ima ih šest, ' +
        'kao na traci: prijenos i širenje na obje veze, obrada i čekanje samo na usmjerniku.</p>' +
        '<p><i lang="en">Transmission delay</i> (kašnjenje prijenosa) vrijeme je da se svi bitovi paketa „gurnu” na vezu: ' +
        '<b>L / R</b>, veličina paketa kroz brzinu veze. Ne ovisi o udaljenosti. <i lang="en">Propagation delay</i> ' +
        '(kašnjenje širenja) vrijeme je da signal fizički prijeđe put: <b>d / s</b>. Ne ovisi o veličini paketa ni o brzini ' +
        'veze. Signal je sporiji od svjetlosti u vakuumu: u vlaknu s = c / N, gdje je N grupni indeks vlakna (oko 1,47, ' +
        'pa oko 4,9 µs po km), u bakru oko 0,66 c, kroz zrak i svemir c.</p>' +
        '<p><i lang="en">Processing delay</i> (kašnjenje obrade) vrijeme je da usmjernik pregleda zaglavlje i odluči kamo ' +
        'paket ide. <i lang="en">Queuing delay</i> (kašnjenje čekanja u redu) vrijeme je koje paket čeka dok izlaz ne bude ' +
        'slobodan. Ono ovisi o prometu: vrijeme na usmjerniku raste kao <b>D = D0 / (1 − U)</b>, gdje je U opterećenje. ' +
        'Pri 50 % udvostruči se, a kako U ide prema 100 %, raste prema beskonačnosti. To je ' +
        '<i lang="en">congestion</i> (zagušenje).</p>' +
        '<p>Česte zablude: brža veza ne ubrzava signal, samo brže stavlja bitove na vezu. Udaljenost ne mijenja ' +
        'prijenos. Latencija nije jedan broj veze nego zbroj po svakom skoku. Kako kašnjenje varira od paketa do paketa, ' +
        '<i lang="en">jitter</i> (varijacija kašnjenja), ovdje se ne prikazuje.</p>'
    },

    en: {
      stage: 'One hop: source, link 1, router, link 2, destination, and the delays on a time line',
      dec: '.',

      size: 'Packet size',
      rate: 'Link rate',
      distance: 'Distance (per link)',
      medium: 'Medium',
      load: 'Router load',
      proc: 'Processing at the router',
      fibre: 'fibre',
      copper: 'copper',
      radio: 'radio',
      bytes: '{v} B',
      mbps: '{v} Mb/s',
      gbps: '{v} Gb/s',
      km: '{v} km',
      metres: '{v} m',
      percent: '{v} %',
      ms: '{v} ms',

      'preset_slow-fast-link': 'Slow and fast link',
      'hint_slow-fast-link': '10 Mb/s → 1 Gb/s, 100 km of fibre, 1500 B',
      'preset_near-far': 'Near and far',
      'hint_near-far': '100 m → 7000 km of fibre, 1 Gb/s',
      preset_satellite: 'Via a satellite',
      hint_satellite: 'Geostationary satellite: 2 × 35 786 km, 50 Mb/s',
      'preset_busy-router': 'Busy router',
      'hint_busy-router': 'Load 0 → 90 %, 100 Mb/s',
      'preset_small-packet': 'Small packet',
      'hint_small-packet': '1500 B → 64 B, 10 Mb/s',

      legTrans: 'transmission (1, 5)',
      legProp: 'propagation (2, 6)',
      legProc: 'processing (3)',
      legQueue: 'queuing (4)',
      legChanged: 'changed',

      src: 'Computer (source)',
      dst: 'Computer (destination)',
      router: 'Router',
      satellite: 'Satellite',
      link: 'link {n}',
      ahead: 'queued ahead, on average: {n}',
      aheadMore: '+{n}',

      segTrans: 'Transmission',
      segProp: 'Propagation',
      segProc: 'Processing',
      segQueue: 'Queuing',
      fTrans: 'L / R = {bits} b ÷ {rate}',
      fProp: 'd / s = {d} ÷ {s} km/s',
      fProc: 'constant, per router',
      fQueue: '{n} × {t} ms (U = {u} %)',
      fQueueCap: 'grows towards ∞ as U → 100 %',
      was: 'before: {v} ms',
      timeline: 'time line',
      now: 'now',
      before: 'before',
      sent: 'sent',
      received: 'received',
      total: 'total delay',
      notToScale: 'the shorter bar is not to scale',

      termTr: 'transmission delay',
      termPr: 'propagation delay',
      termPc: 'processing delay',
      termQu: 'queuing delay',

      capTotal: 'The total delay of {total} ms is the sum of six parts: {tr} 2 × {a} ms, {pr} 2 × {b} ms, {pc} {c} ms and {qu} {d} ms.',
      capFaster: 'A faster link cut {tr} from {a} ms to {b} ms; {pr} stayed {p} ms.',
      capSlower: 'A slower link stretched {tr} from {a} ms to {b} ms; {pr} stayed {p} ms.',
      capSmaller: 'A smaller packet cut {tr} from {a} ms to {b} ms; {pr} stayed {p} ms.',
      capBigger: 'A bigger packet stretched {tr} from {a} ms to {b} ms; {pr} stayed {p} ms.',
      capQueueToo: 'The router\'s queue changes with it, from {a} ms to {b} ms: it waits for packets of this length.',
      capFarther: 'A longer path stretched {pr} from {a} ms to {b} ms per link; {tr} stayed {t} ms.',
      capNearer: 'A shorter path cut {pr} from {a} ms to {b} ms per link; {tr} stayed {t} ms.',
      capMedium: 'Another medium changed {pr} from {a} ms to {b} ms per link, as the signal now travels {s} km/s; {tr} stayed {t} ms.',
      capPath: 'Another path and medium changed {pr} from {a} ms to {b} ms per link, {ow} ms one way; {tr} stayed {t} ms.',
      capLoad: 'At {u} % load the router\'s queue adds {q} ms; the link and the distance did not change.',
      capLoadCap: 'At {u} % load the router\'s queue adds {q} ms, and it grows without bound as the load nears 100 %.',
      capLoadZero: 'With no other traffic the queue is empty: {qu} is 0 ms.',
      capProc: 'At the router, {pc} went from {a} ms to {b} ms; nothing else changed.',
      capMany: 'Several settings changed at once: the total delay went from {a} ms to {b} ms.',

      explain:
        '<p>The total delay, [[latency]], is the time from sending a packet to receiving it. It is not one quantity but the sum of four ' +
        'components, at every node and on every link of the path. One hop over a router has six of them, as on the bar: ' +
        'transmission and propagation on both links, processing and queuing only at the router.</p>' +
        '<p><b>Transmission delay</b> is the time to push all the bits of the packet onto the link: <b>L / R</b>, packet ' +
        'size over link rate. It does not depend on distance. <b>Propagation delay</b> is the time the signal needs to ' +
        'cross the path: <b>d / s</b>. It depends on neither packet size nor link rate. The signal is slower than light ' +
        'in a vacuum: in fibre s = c / N, where N is the fibre\'s group index (about 1.47, so about 4.9 µs per km), in ' +
        'copper about 0.66 c, through air and space c.</p>' +
        '<p><b>Processing delay</b> is the time the router needs to read the header and decide where the packet goes. ' +
        '<b>Queuing delay</b> is the time the packet waits until the way out is free. It depends on traffic: the time at ' +
        'the router grows as <b>D = D0 / (1 − U)</b>, where U is the load. At 50 % it doubles, and as U nears 100 % it ' +
        'grows without bound. That is <b>congestion</b>.</p>' +
        '<p>Common mistakes: a faster link does not make the signal travel faster, it only puts the bits on sooner. ' +
        'Distance does not change transmission. Latency is not one number of a link but a sum over every hop. How the ' +
        'delay varies from packet to packet, <b>jitter</b>, is not shown here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
