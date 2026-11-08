/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the QoS queues page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms missing from kit/glossary.js are written out (NOTES.md, "Term pairs").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Redovi i raspoređivač',
      // params
      sched: 'Raspoređivač',
      schedFifo: 'FIFO',
      schedPq: 'Prioritet',
      schedWrr: 'Težinski',
      rVoice: 'Ponuda: glas',
      rVideo: 'Ponuda: video',
      rBulk: 'Ponuda: skupni',
      perTick: '{v} /takt',
      C: 'Kapacitet C',
      limit: 'Duljina reda',
      limitHint: 'Najviše paketa u jednom redu.',
      wVoice: 'Težina: glas',
      wVideo: 'Težina: video',
      wBulk: 'Težina: skupni',
      seed: 'Redoslijed dolazaka',
      seedHint: 'Sjeme slučajnog redoslijeda dolazaka unutar takta.',
      // presets
      presetFifo: 'FIFO pod zagušenjem',
      presetFifoHint: '2 + 5 + 8 = 15 paketa po taktu na vezu od 10',
      presetPq: 'Strogi prioritet',
      presetPqHint: 'Isti promet; glas pa video pa skupni prijenos',
      presetStarve: 'Izgladnjivanje',
      presetStarveHint: 'Prioritet, a glas sam traži 11 od 10',
      presetWrr: 'Težinski 2:3:5',
      presetWrrHint: 'Redovi naizmjence, svaki do svoje težine',
      presetBloat: 'Veći red (60)',
      presetBloatHint: 'FIFO s redom od 60 paketa',
      presetCalm: 'Bez zagušenja',
      presetCalmHint: '2 + 3 + 4 = 9 paketa po taktu, manje od 10',
      // legend
      legendVoice: 'glas',
      legendVideo: 'video',
      legendBulk: 'skupni prijenos',
      legendSent: 'poslan u ovom taktu',
      legendSlot: 'prazno mjesto u redu',
      legendDrop: 'odbačen',
      legendChanged: 'promijenjeno',
      // class names
      nameVoice: 'Glas',
      nameVideo: 'Video',
      nameBulk: 'Skupni prijenos',
      // scene
      sources: 'Izvori',
      classifier: 'Klasifikator',
      classifierBy: 'po oznaci',
      queues: 'Redovi',
      sharedQueue: 'zajednički red',
      prio: 'prioritet {n}',
      weight: 'težina {w}',
      scheduler: 'Raspoređivač',
      schedFifoName: 'FIFO',
      schedFifoHow: 'redom dolaska',
      schedPqName: 'strogi prioritet',
      schedPqHow: 'glas > video > skupni',
      schedWrrName: 'težinski',
      schedWrrHow: 'naizmjence {w}',
      link: 'Veza',
      linkCap: 'C = {c} /takt',
      lastTick: 'Takt {t}, zadnji: redovi nakon dolazaka.',
      dropped: 'odbačeno:',
      none: 'ništa',
      // chart
      chartLabel: 'Isporučeni i odbačeni paketi po razredu, prosjek po taktu u skupinama od 10 taktova',
      axisY: 'paketa po taktu',
      axisX: 'takt',
      up: 'isporučeno ↑',
      down: 'odbačeno ↓',
      warmup: 'redovi se pune',
      capLine: 'C = {c}',
      // table
      colClass: 'Promet',
      colOffered: 'Ponuđeno /takt',
      colDelivered: 'Isporučeno /takt',
      colDropped: 'Odbačeno /takt',
      colDelay: 'Čekanje u redu (taktova)',
      total: 'Ukupno',
      tableNote: 'Prosjek za taktove 100–299.',
      ticks: ['{n} takt', '{n} takta', '{n} taktova'],
      pct: '{p} %',
      // captions
      captionCalm: 'Bez zagušenja: ponuđeno {o} paketa po taktu, a veza nosi {c}. Nijedan red se ne puni, ništa se ' +
        'ne odbacuje i nitko ne čeka: {same}.',
      captionCalmSame: 'svi raspoređivači daju isti rezultat',
      captionFilling: 'Ponuda od {o} paketa po taktu veća je od kapaciteta veze {c}: redovi još rastu (čekanje je ' +
        'zasad do {d}), a kad se napune, počet će gubici.',
      captionBurstDrop: 'Ponuda od {o} paketa po taktu manja je od kapaciteta veze {c}, a ipak se paketi odbacuju: ' +
        'dolasci jednog takta ne stanu u red od {limit}.',
      captionBurst: 'Ništa nije odbačeno: redovi samo upijaju kratke nalete; najdulje prosječno čekanje je {d}.',
      captionFifo: 'FIFO: jedan zajednički red, pa svaki razred gubi približno isti udio, {pct}, i čeka jednako, ' +
        '{d}; glas također.',
      captionBloat: 'FIFO s većim redom ({limit}): gubici su isti, ali glas sada čeka {d} u redu.',
      captionBloatNoVoice: 'FIFO s većim redom ({limit}): gubici su isti, ali svaki paket sada čeka {d} u redu.',
      captionFifoNoVoice: 'FIFO: jedan zajednički red, pa svaki razred gubi približno isti udio, {pct}, i čeka ' +
        'jednako, {d}.',
      captionPq: 'Strogi prioritet: glas i video prolaze bez gubitaka i bez čekanja u redu; skupni prijenos dobiva ' +
        'ostatak, {d} od {o} paketa po taktu.',
      captionStarveVoice: 'Strogi prioritet: glas sam nudi {v} paketa po taktu, više od kapaciteta veze {c}. Video i ' +
        'skupni prijenos ne dobivaju {nothing}: prioritet bez ograničenja izgladnjuje sve ostale.',
      captionStarveBulk: 'Strogi prioritet: glas i video zajedno nude {o} paketa po taktu, više od kapaciteta veze ' +
        '{c}. Skupni prijenos ne dobiva {nothing}: gladuje.',
      nothing: 'ništa',
      captionWrr: 'Težinska podjela {w}: nijedan red ne gladuje. Isporučeno po taktu: glas {a} od {ao}, video {b} ' +
        'od {bo}, skupni prijenos {x} od {xo}.',
      captionPqOther: 'Strogi prioritet: glas {a} od {ao}, video {b} od {bo}, skupni prijenos {x} od {xo} paketa po ' +
        'taktu.',
      explain: '<p><strong>QoS ne stvara propusnost.</strong> <i lang="en">Quality of service</i> (kvaliteta usluge, ' +
        'QoS) samo bira tko gubi kad je veza preopterećena. Dok je ponuda manja od kapaciteta C, svi raspoređivači ' +
        'daju isto, dok dolasci jednog takta stanu u red (primjer 6); tek <i lang="en">congestion</i> (zagušenje) puni redove.</p>' +
        '<p><strong>Pun red odbacuje pridošlicu.</strong> Svaki red ima ograničenu duljinu. Paket koji stigne u pun ' +
        'red se odbacuje, a paketi koji već čekaju ostaju: <i lang="en">tail drop</i> (odbacivanje s kraja reda). ' +
        'Vrijeme koje paket provede u redu je <i lang="en">queuing delay</i> (kašnjenje čekanja u redu).</p>' +
        '<p><strong>FIFO:</strong> jedan zajednički red, prvi stigao, prvi otišao. Svi razredi gube približno isti ' +
        'udio i čekaju jednako, pa i glas, kojemu čekanje najviše smeta.</p>' +
        '<p><strong><i lang="en">Strict priority</i> (strogi prioritet):</strong> [[scheduler]] uvijek šalje iz ' +
        'najvišeg nepraznog reda (glas, pa video, pa skupni prijenos). Glas čeka samo ako sam ispuni vezu, a niži redovi mogu ostati ' +
        'bez ičega: [[starvation]] (primjer 3). Zato se prioritetni red u praksi ograničava.</p>' +
        '<p><strong><i lang="en">Weighted fair queuing</i> (težinsko pravedno raspoređivanje):</strong> redovi se ' +
        'poslužuju naizmjence, svaki do svoje težine w. Red koji ima posla dobiva barem w / Σw kapaciteta, a ono ' +
        'što jedan red ne iskoristi, dobivaju ostali. Nitko ne gladuje.</p>' +
        '<p><strong>Veći red nije besplatan.</strong> Kad je ponuda trajno veća od C, duži red ne smanjuje gubitke, ' +
        'samo produžuje čekanje (primjer 5).</p>' +
        '<p>Model: paketi jednake veličine, vrijeme u taktovima, statistika za taktove 100–299. Razred se čita iz ' +
        'oznake DSCP koju izvor postavi (EF, AF41, DF) i uzima se kao točan.</p>'
    },
    en: {
      stage: 'Queues and scheduler',
      sched: 'Scheduler',
      schedFifo: 'FIFO',
      schedPq: 'Priority',
      schedWrr: 'Weighted',
      rVoice: 'Offered: voice',
      rVideo: 'Offered: video',
      rBulk: 'Offered: bulk',
      perTick: '{v} /tick',
      C: 'Capacity C',
      limit: 'Queue limit',
      limitHint: 'The most packets one queue holds.',
      wVoice: 'Weight: voice',
      wVideo: 'Weight: video',
      wBulk: 'Weight: bulk',
      seed: 'Arrival order',
      seedHint: 'Seed of the random arrival order within a tick.',
      presetFifo: 'FIFO under congestion',
      presetFifoHint: '2 + 5 + 8 = 15 packets per tick onto a link of 10',
      presetPq: 'Strict priority',
      presetPqHint: 'The same traffic; voice, then video, then bulk',
      presetStarve: 'Starvation',
      presetStarveHint: 'Priority, and voice alone asks for 11 of 10',
      presetWrr: 'Weighted 2:3:5',
      presetWrrHint: 'Queues take turns, each up to its weight',
      presetBloat: 'A bigger queue (60)',
      presetBloatHint: 'FIFO with a queue of 60 packets',
      presetCalm: 'No congestion',
      presetCalmHint: '2 + 3 + 4 = 9 packets per tick, less than 10',
      legendVoice: 'voice',
      legendVideo: 'video',
      legendBulk: 'bulk transfer',
      legendSent: 'sent in this tick',
      legendSlot: 'empty queue slot',
      legendDrop: 'dropped',
      legendChanged: 'changed',
      nameVoice: 'Voice',
      nameVideo: 'Video',
      nameBulk: 'Bulk transfer',
      sources: 'Sources',
      classifier: 'Classifier',
      classifierBy: 'by marking',
      queues: 'Queues',
      sharedQueue: 'shared queue',
      prio: 'priority {n}',
      weight: 'weight {w}',
      scheduler: 'Scheduler',
      schedFifoName: 'FIFO',
      schedFifoHow: 'in arrival order',
      schedPqName: 'strict priority',
      schedPqHow: 'voice > video > bulk',
      schedWrrName: 'weighted',
      schedWrrHow: 'taking turns {w}',
      link: 'Link',
      linkCap: 'C = {c} /tick',
      lastTick: 'Tick {t}, the last: the queues after the arrivals.',
      dropped: 'dropped:',
      none: 'none',
      chartLabel: 'Delivered and dropped packets per class, mean per tick in bins of 10 ticks',
      axisY: 'packets per tick',
      axisX: 'tick',
      up: 'delivered ↑',
      down: 'dropped ↓',
      warmup: 'queues filling',
      capLine: 'C = {c}',
      colClass: 'Traffic',
      colOffered: 'Offered /tick',
      colDelivered: 'Delivered /tick',
      colDropped: 'Dropped /tick',
      colDelay: 'Queuing delay (ticks)',
      total: 'Total',
      tableNote: 'Mean over ticks 100–299.',
      ticks: ['{n} tick', '{n} ticks'],
      pct: '{p}%',
      captionCalm: 'No congestion: {o} packets per tick offered, and the link carries {c}. No queue fills, nothing is ' +
        'dropped and nobody waits: {same}.',
      captionCalmSame: 'every scheduler gives the same result',
      captionFilling: 'The offered {o} packets per tick exceed the link\'s {c}: the queues are still growing (waits ' +
        'up to {d} so far), and once they are full, packets will be dropped.',
      captionBurstDrop: 'The offered {o} packets per tick are below the link\'s {c}, yet packets are dropped: one ' +
        'tick\'s arrivals do not fit in a queue of {limit}.',
      captionBurst: 'Nothing dropped: the queues only absorb short bursts; the longest mean wait is {d}.',
      captionFifo: 'FIFO: one shared queue, so every class loses about the same share, {pct}, and waits the same, ' +
        '{d}; voice too.',
      captionBloat: 'FIFO with a bigger queue ({limit}): the losses are the same, but voice now waits {d} in the queue.',
      captionBloatNoVoice: 'FIFO with a bigger queue ({limit}): the losses are the same, but every packet now waits {d} in ' +
        'the queue.',
      captionFifoNoVoice: 'FIFO: one shared queue, so every class loses about the same share, {pct}, and waits the ' +
        'same, {d}.',
      captionPq: 'Strict priority: voice and video get through with no loss and no queuing delay; bulk gets what is ' +
        'left, {d} of {o} packets per tick.',
      captionStarveVoice: 'Strict priority: voice alone offers {v} packets per tick, more than the link\'s {c}. Video ' +
        'and bulk get {nothing}: priority without a limit starves everyone else.',
      captionStarveBulk: 'Strict priority: voice and video together offer {o} packets per tick, more than the link\'s ' +
        '{c}. Bulk gets {nothing}: it starves.',
      nothing: 'nothing',
      captionWrr: 'Weighted sharing {w}: no queue starves. Delivered per tick: voice {a} of {ao}, video {b} of {bo}, ' +
        'bulk {x} of {xo}.',
      captionPqOther: 'Strict priority: voice {a} of {ao}, video {b} of {bo}, bulk {x} of {xo} packets per tick.',
      explain: '<p><strong>QoS creates no bandwidth.</strong> Quality of service (QoS) only chooses who loses when the ' +
        'link is overloaded. While the offered load is below the capacity C, every scheduler gives the same result, ' +
        'as long as one tick\'s arrivals fit in the queue (preset 6); only congestion fills the queues.</p>' +
        '<p><strong>A full queue drops the newcomer.</strong> Every queue has a limit. A packet that arrives at a ' +
        'full queue is discarded and the packets already waiting stay: tail drop. The time a packet spends in the ' +
        'queue is its queuing delay.</p>' +
        '<p><strong>FIFO:</strong> one shared queue, first in, first out. Every class loses about the same share and ' +
        'waits the same, voice too, which minds the wait most.</p>' +
        '<p><strong>Strict priority:</strong> the [[scheduler]] always sends from the highest non-empty queue (voice, ' +
        'then video, then bulk). Voice waits only when voice alone fills the link, and the lower queues can get nothing at all: [[starvation]] ' +
        '(preset 3). That is why a priority queue is limited in practice.</p>' +
        '<p><strong>Weighted fair queuing:</strong> the queues take turns, each up to its weight w. A busy queue gets ' +
        'at least w / Σw of the capacity, and what one queue leaves unused goes to the others. Nobody starves.</p>' +
        '<p><strong>A bigger queue is not free.</strong> When the offered load stays above C, a longer queue does not ' +
        'cut the losses; it only adds waiting (preset 5).</p>' +
        '<p>Model: packets of equal size, time in ticks, statistics over ticks 100–299. The class is read from the ' +
        'DSCP marking the source sets (EF, AF41, DF) and taken as correct.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
