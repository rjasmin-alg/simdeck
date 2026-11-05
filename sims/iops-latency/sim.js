/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for iops-latency: a closed loop of QD outstanding requests of one block size on a device with P internal
   lanes, an access time and a bandwidth ceiling (rules in SPEC.md). IOPS, throughput and latency per request, and
   which limit binds. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a
   classic script (window.SimLogic); node tests require() it.
   An explorer: the state is a pure function of the params, initial(params) = compute(params), no steps.
   Not utilisation-latency's M/G/1 (an open system): here the number of requests in flight is fixed, so latency
   comes from Little's law, latency = QD / IOPS (rule 4). `metrics` is pure over plain data and takes a real-valued
   queue depth, so the page draws its curves with it and it can be promoted to models/ unchanged. */
(function (root) {
  'use strict';

  /**
   * Device constants (rules 1–3; illustrative, derived, *check* against data sheets): access time per request in
   * microseconds (integers, so rule 3's comparison is exact), bandwidth in MB/s (10^6 B/s) and internal lanes.
   * Lanes: 1 for a spinning disk (one arm); 8 and 32 for flash, the values the task's preset numbers imply.
   */
  var DEVICES = {
    'hdd-random': { accessUs: 8000, mbps: 200, lanes: 1 },
    'hdd-seq': { accessUs: 0, mbps: 200, lanes: 1 },
    'sata': { accessUs: 100, mbps: 550, lanes: 8 },
    'nvme': { accessUs: 80, mbps: 3000, lanes: 32 }
  };
  var DEVICE_IDS = ['hdd-random', 'hdd-seq', 'sata', 'nvme'];
  /** Block sizes in KiB (1024 B) and queue depths the page offers. */
  var BLOCKS = [4, 16, 128, 1024];
  var DEPTHS = [1, 2, 4, 8, 16, 32, 64, 128];

  var defaults = { device: 'nvme', bs: 4, qd: 1 };

  /** Params cleaned: unknown values fall back to the defaults (a hand-edited URL never breaks the page). */
  function norm(p) {
    p = p || {};
    var bs = Number(p.bs), qd = Number(p.qd);
    return {
      device: DEVICE_IDS.indexOf(p.device) >= 0 ? p.device : defaults.device,
      bs: BLOCKS.indexOf(bs) >= 0 ? bs : defaults.bs,
      qd: DEPTHS.indexOf(qd) >= 0 ? qd : defaults.qd
    };
  }

  /**
   * Rules 1–6 for one device, block size (KiB) and queue depth q (any real q ≥ 1; the page samples the curves with it).
   * Times in µs inside, ms out. bs / (MB/s) is µs exactly: bytes / (10^6 B/s) × 10^6 µs/s.
   */
  function metrics(dev, bsKiB, q) {
    var bytes = bsKiB * 1024;
    var xferUs = bytes / dev.mbps;                                 // rule 1: transfer of one block
    var svcUs = dev.accessUs + xferUs;                             // rule 1: service time of one request
    var busy = Math.min(q, dev.lanes);                             // rule 2: requests in a lane
    var ceilIops = dev.mbps * 1e6 / bytes;                         // rule 3: the bandwidth ceiling in IOPS
    // Rule 3, exact: busy / svc ≥ bw / bs  ⟺  busy·bs ≥ bw·svc = mbps·accessUs + bs. Equal counts as capped.
    var capped = (busy - 1) * bytes >= dev.mbps * dev.accessUs;
    var iops = capped ? ceilIops : busy * 1e6 / svcUs;             // rules 2 and 3
    var latMs = q / iops * 1000;                                   // rule 4: Little's law, closed loop
    var mbps = iops * bytes / 1e6;                                 // rule 5
    // Rule 6, tie-break: bandwidth if capped, else parallelism if every lane is busy (q ≥ P), else latency.
    var bound = capped ? 'bandwidth' : q >= dev.lanes ? 'parallelism' : 'latency';
    return {
      svcMs: svcUs / 1000, accessMs: dev.accessUs / 1000, xferMs: xferUs / 1000,
      lanes: dev.lanes, busy: busy, waiting: Math.max(0, q - dev.lanes),
      ceilIops: ceilIops, capped: capped,
      iops: iops, mbps: mbps, latMs: latMs, bound: bound,
      laneMs: busy / iops * 1000    // time a request spends in a lane: the service time, longer when the lanes share the cap
    };
  }

  function compute(params) {
    var p = norm(params);
    var dev = DEVICES[p.device];
    var m = metrics(dev, p.bs, p.qd);
    m.device = p.device;
    m.bs = p.bs;
    m.qd = p.qd;
    m.bwMBps = dev.mbps;
    return m;
  }

  /** The metrics of the current device and block size at queue depth q (the page's curves). */
  function curveAt(params, q) {
    var p = norm(params);
    return metrics(DEVICES[p.device], p.bs, q);
  }

  /** The gauge each bound belongs to: the ceiling pins MB/s, full lanes pin IOPS, idle lanes pin latency. */
  var GAUGE = { bandwidth: 'mbps', parallelism: 'iops', latency: 'lat' };

  /** "Changed" (legend): the gauge of the new bound, when the bound changed with the last parameter change. */
  function changed(s, prev) {
    if (!prev || prev.bound === s.bound) return [];
    return [GAUGE[s.bound]];
  }

  /**
   * What the caption says (the page picks the words): `change` names the one param that changed since `prevP`
   * (device, bs or qd; null when none or several changed), `key` the sentence for the bound now.
   */
  function captionKey(s, prevP) {
    var change = null;
    if (prevP) {
      var a = norm(prevP), diff = ['device', 'bs', 'qd'].filter(function (k) { return a[k] !== s[k]; });
      if (diff.length === 1) change = diff[0];
    }
    var key;
    if (s.bound === 'bandwidth') key = 'bBandwidth';
    else if (s.bound === 'latency') key = 'bLatency';
    else if (s.lanes === 1) key = s.qd === 1 ? 'bArm1' : 'bArmQueue';
    else key = s.qd === s.lanes ? 'bLanesFull' : 'bLanesQueue';
    return { change: change, key: key };
  }

  var presets = [
    { id: 'hdd-random', params: { device: 'hdd-random', bs: 4, qd: 32 } },
    { id: 'hdd-sequential', params: { device: 'hdd-seq', bs: 1024, qd: 1 } },
    { id: 'nvme-qd', params: { device: 'nvme', bs: 4, qd: 32 } },
    { id: 'nvme-big-blocks', params: { device: 'nvme', bs: 128, qd: 32 } },
    { id: 'sata-vs-nvme', params: { device: 'sata', bs: 4, qd: 32 } }
  ];

  var logic = {
    DEVICES: DEVICES, DEVICE_IDS: DEVICE_IDS, BLOCKS: BLOCKS, DEPTHS: DEPTHS, GAUGE: GAUGE,
    defaults: defaults,
    presets: presets,
    norm: norm,
    metrics: metrics,
    initial: compute,
    compute: compute,
    curveAt: curveAt,
    changed: changed,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
