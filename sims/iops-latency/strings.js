/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of iops-latency, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *word* in a caption is an English term in italics.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Red zahtjeva, uređaj i tri mjere u ovisnosti o dubini reda',
      dec: ',',
      thou: '.',
      ms: '{v} ms',
      mbs: '{v} MB/s',
      kib: '{n} KiB',
      mib: '{n} MiB',

      device: 'Uređaj',
      bs: 'Veličina bloka',
      qd: 'Dubina reda (QD)',
      qdHint: 'Koliko je zahtjeva istodobno poslano uređaju. Može i klikom ili povlačenjem po grafu.',
      'dev-hdd-random': 'HDD nasumično',
      'dev-hdd-seq': 'HDD slijedno',
      'dev-sata': 'SATA SSD',
      'dev-nvme': 'NVMe SSD',

      presetHddRandom: 'HDD nasumično, QD 32',
      presetHddRandomHint: '4 KiB: 125 IOPS kao i uz QD 1, ali 257 ms',
      presetHddSeq: 'HDD slijedno, 1 MiB',
      presetHddSeqHint: '200 MB/s bez traženja; isti disk nasumično: 79 MB/s',
      presetNvmeQd: 'NVMe, 4 KiB, QD 32',
      presetNvmeQdHint: 'Sve 32 trake rade: 393.288 IOPS uz 0,081 ms',
      presetNvmeBig: 'NVMe, 128 KiB, QD 32',
      presetNvmeBigHint: 'Na stropu od 3000 MB/s: 22.888 IOPS, 1,4 ms',
      presetSata: 'SATA SSD, 4 KiB, QD 32',
      presetSataHint: '8 traka: 74.455 IOPS, 0,43 ms; usporedi s NVMe',

      legendQueued: 'zahtjev u redu',
      legendLane: 'zahtjev u traci',
      legendSlot: 'slobodna traka',
      legendPoint: 'trenutačna točka',
      legendChanged: 'promijenjeno ograničenje',

      queueTitle: 'Red',
      queueNone: 'red je prazan',
      waiting: ['{n} čeka', '{n} čekaju', '{n} čeka'],
      queueMore: '+{n}',
      lanesBusy: 'u trakama: {busy} od {p}',
      svc: 'posluživanje {v} = {acc} pristup + {xfer} prijenos',
      laneShared: 'trake dijele propusnost: {v} po zahtjevu u traci',
      pipe: 'iskorišteno: {v} od {max}',
      limit: 'Ograničava:',
      'bound-bandwidth': 'propusnost uređaja',
      'bound-parallelism': 'sve trake zauzete',
      'bound-arm': 'jedna ruka diska',
      'bound-latency': 'vrijeme posluživanja (ima slobodnih traka)',

      gIops: 'IOPS',
      gMbps: 'Propusnost',
      gLat: 'Kašnjenje po zahtjevu',
      gIopsSub: '{busy} u trakama ÷ {svc}',
      gIopsCap: 'strop: {bw} ÷ {bs}',
      gMbpsSub: 'IOPS × {bs}',
      gLatSub: 'dubina {qd} ÷ IOPS',
      axisQd: 'dubina reda',
      lanesMark: 'P = {n}',
      ceilMark: 'strop',
      plotIops: 'IOPS u ovisnosti o dubini reda',
      plotMbps: 'Propusnost u ovisnosti o dubini reda',
      plotLat: 'Kašnjenje u ovisnosti o dubini reda',

      chQd: 'Dubina reda {a} → {b}: IOPS {i0} → {i1}, kašnjenje {l0} → {l1}.',
      chBs: 'Blok {a} → {b}: IOPS {i0} → {i1}, propusnost {m0} → {m1}.',
      chDevice: '{a} → {b}: IOPS {i0} → {i1}, propusnost {m0} → {m1}, kašnjenje {l0} → {l1}.',
      bArm1: 'Jedna ruka, jedan zahtjev: svaki traje {svc} ({acc} traženje i okretaj, {xfer} prijenos {bs}), pa disk radi {iops} IOPS = {mbps}.',
      bArmQueue: 'Na vrtećem disku veća dubina reda ne donosi više IOPS: ruka je jedna, pa zahtjevi samo dulje čekaju — {iops} IOPS uz {lat}.',
      bLatency: 'Zauzet je tek dio traka ({busy} od {p}): svaki zahtjev traje samo svoje posluživanje, {lat}. Dublji red dao bi više IOPS uz isto kašnjenje.',
      bLanesFull: 'Zauzete su sve trake ({p}), a nijedan zahtjev ne čeka: {iops} IOPS uz kašnjenje jednako posluživanju, {lat}. Svaki zahtjev više samo bi čekao.',
      bLanesQueue: 'Zauzete su sve trake ({p}): IOPS ostaje {iops}, a čekanje u redu ({w}) diže kašnjenje s {svc} na {lat}.',
      bBandwidth: 'S blokovima od {bs} uređaj uz dubinu reda {qd} udara u strop od {bw}: trake dijele propusnost, IOPS staje na {iops}, a svaki zahtjev više u redu samo dodaje kašnjenje ({lat}).',
      reqs: ['{n} zahtjev', '{n} zahtjeva', '{n} zahtjeva'],

      explain: '<p>Tri mjere istog uređaja: <em lang="en">IOPS</em> (U/I operacija u sekundi), [[throughput]] (MB/s) i ' +
        '[[latency]] jednog zahtjeva. Propusnost je IOPS × veličina bloka, pa isti disk ima mnogo IOPS s malim blokovima, ' +
        'a mnogo MB/s s velikima: to nisu isti broj u drugim jedinicama.</p>' +
        '<p><em lang="en">Queue depth</em> (dubina reda, QD) je broj zahtjeva poslanih, a još nedovršenih. Uređaj ima P ' +
        'unutarnjih traka: vrteći disk jednu (ruku), flash više. Dok je QD manji od P, dublji red puni slobodne trake i IOPS ' +
        'raste uz isto kašnjenje. Kad su sve trake zauzete, IOPS stoji, a kašnjenje raste po Littleovu zakonu: ' +
        'kašnjenje = QD ÷ IOPS. Veliki blokovi prije udare u propusnost uređaja; tada dublji red opet samo dodaje čekanje.</p>' +
        '<p>Bolji uređaj nema manje kašnjenje pri svakoj dubini: NVMe uz QD 128 (blok 4 KiB) ima kašnjenje ' +
        '0,33 ms, a SATA SSD uz QD 1 0,11 ms. Kod <em lang="en">sequential access</em> (slijedni pristup) nema traženja, pa ' +
        'disk daje punih 200 MB/s; <em lang="en">random access</em> (nasumični pristup) plaća 8 ms po zahtjevu.</p>' +
        '<p>Model je igračka (zatvorena petlja, konstante uređaja ilustrativne): bez priručne memorije, sustava datoteka i ' +
        'repa kašnjenja.</p>'
    },
    en: {
      stage: 'Request queue, device and three measures against queue depth',
      dec: '.',
      thou: ',',
      ms: '{v} ms',
      mbs: '{v} MB/s',
      kib: '{n} KiB',
      mib: '{n} MiB',

      device: 'Device',
      bs: 'Block size',
      qd: 'Queue depth (QD)',
      qdHint: 'How many requests are sent to the device at once. You can also click or drag on a chart.',
      'dev-hdd-random': 'HDD random',
      'dev-hdd-seq': 'HDD sequential',
      'dev-sata': 'SATA SSD',
      'dev-nvme': 'NVMe SSD',

      presetHddRandom: 'HDD random, QD 32',
      presetHddRandomHint: '4 KiB: 125 IOPS as at QD 1, but 257 ms',
      presetHddSeq: 'HDD sequential, 1 MiB',
      presetHddSeqHint: '200 MB/s with no seek; the same disk random: 79 MB/s',
      presetNvmeQd: 'NVMe, 4 KiB, QD 32',
      presetNvmeQdHint: 'All 32 lanes busy: 393,288 IOPS at 0.081 ms',
      presetNvmeBig: 'NVMe, 128 KiB, QD 32',
      presetNvmeBigHint: 'At the 3000 MB/s ceiling: 22,888 IOPS, 1.4 ms',
      presetSata: 'SATA SSD, 4 KiB, QD 32',
      presetSataHint: '8 lanes: 74,455 IOPS, 0.43 ms; compare with NVMe',

      legendQueued: 'request in the queue',
      legendLane: 'request in a lane',
      legendSlot: 'free lane',
      legendPoint: 'current point',
      legendChanged: 'limit changed',

      queueTitle: 'Queue',
      queueNone: 'the queue is empty',
      waiting: ['{n} waiting', '{n} waiting'],
      queueMore: '+{n}',
      lanesBusy: 'in lanes: {busy} of {p}',
      svc: 'service {v} = {acc} access + {xfer} transfer',
      laneShared: 'lanes share the bandwidth: {v} per request in a lane',
      pipe: 'used: {v} of {max}',
      limit: 'Limit:',
      'bound-bandwidth': 'device bandwidth',
      'bound-parallelism': 'all lanes busy',
      'bound-arm': 'the disk\'s one arm',
      'bound-latency': 'service time (lanes free)',

      gIops: 'IOPS',
      gMbps: 'Throughput',
      gLat: 'Latency per request',
      gIopsSub: '{busy} in lanes ÷ {svc}',
      gIopsCap: 'ceiling: {bw} ÷ {bs}',
      gMbpsSub: 'IOPS × {bs}',
      gLatSub: 'depth {qd} ÷ IOPS',
      axisQd: 'queue depth',
      lanesMark: 'P = {n}',
      ceilMark: 'ceiling',
      plotIops: 'IOPS against queue depth',
      plotMbps: 'Throughput against queue depth',
      plotLat: 'Latency against queue depth',

      chQd: 'Queue depth {a} → {b}: IOPS {i0} → {i1}, latency {l0} → {l1}.',
      chBs: 'Block {a} → {b}: IOPS {i0} → {i1}, throughput {m0} → {m1}.',
      chDevice: '{a} → {b}: IOPS {i0} → {i1}, throughput {m0} → {m1}, latency {l0} → {l1}.',
      bArm1: 'One arm, one request: each takes {svc} ({acc} seek and rotation, {xfer} to move {bs}), so the disk does {iops} IOPS = {mbps}.',
      bArmQueue: 'On a spinning disk a deeper queue brings no more IOPS: there is one arm, so requests only wait longer — {iops} IOPS at {lat}.',
      bLatency: 'Only part of the device is busy ({busy} of {p} lanes): each request takes just its service time, {lat}. A deeper queue would add IOPS at the same latency.',
      bLanesFull: 'All lanes are busy ({p}) and no request waits: {iops} IOPS at a latency equal to the service time, {lat}. Any extra request would only wait.',
      bLanesQueue: 'All lanes are busy ({p}): IOPS stay at {iops}, and waiting in the queue ({w}) lifts latency from {svc} to {lat}.',
      bBandwidth: 'With {bs} blocks the drive hits its {bw} ceiling at QD {qd}: the lanes share the bandwidth, IOPS stop at {iops}, and every extra request in the queue only adds latency ({lat}).',
      reqs: ['{n} request', '{n} requests'],

      explain: '<p>Three measures of one device: IOPS (I/O operations per second), [[throughput]] (MB/s) and the ' +
        '[[latency]] of one request. Throughput is IOPS × block size, so the same disk has many IOPS with small blocks ' +
        'and many MB/s with large ones: they are not the same number in different units.</p>' +
        '<p>Queue depth (QD) is the number of requests sent and not yet finished. The device has P internal lanes: a ' +
        'spinning disk one (its arm), flash several. While QD is below P, a deeper queue fills free lanes and IOPS rise at ' +
        'the same latency. Once every lane is busy, IOPS stand still and latency grows by Little\'s law: latency = QD ÷ ' +
        'IOPS. Large blocks hit the device\'s bandwidth sooner; then a deeper queue again only adds waiting.</p>' +
        '<p>A better device does not have lower latency at every depth: NVMe at QD 128 (4 KiB blocks) has a latency ' +
        'of 0.33 ms, a SATA SSD at QD 1 0.11 ms. Sequential access has no seek, so the disk gives its full 200 MB/s; random access pays 8 ms per ' +
        'request.</p>' +
        '<p>The model is a toy (a closed loop, device constants illustrative): no cache, no filesystem, no tail ' +
        'latency.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
