/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for disk-partitioning: MBR vs GPT on the same disk. Partition limits, the protective MBR, the backup header.
   An explorer (no steps): the state is a pure function of the params (SPEC.md). The same request (n partitions, each
   new one in the second half of the last, the last to "100%") is laid out twice, once with each table type.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The table primitives (createMbr, addPrimary,
   addExtended, addLogical, planMbr, gptLayout, protectiveEntry) hold no strings and no page code: promotable to
   models/ unchanged. The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MIB = 1048576;
  var MBR_SLOTS = 4;              // rule 1: sector 0 has room for four entries
  var MBR_FIELD = 4294967296;     // rule 3: 2^32, the count of values a 32-bit sector field holds
  var GPT_ENTRIES = 128;          // rule 4: default entry count
  var GPT_ENTRY_BYTES = 128;      // rule 7: 128 bytes per entry
  var FIRST_LOGICAL = 5;          // rule 2: Linux numbers logical partitions from 5

  /** The three disks. Byte counts of real drives (the IDEMA LBA count for 1 TB and 4 TB, SPEC.md "Numbers"); the
      book's disk is exactly 2 GiB. They divide evenly by both sector sizes. */
  var DISKS = {
    '2GiB': { bytes: 2147483648 },
    '1TB': { bytes: 1000204886016 },
    '4TB': { bytes: 4000787030016 }
  };
  var DEV = 'vdb';                // the book's second disk (ch11); partitions are vdb1, vdb2, … (lnx-mount-layers)
  /** GPT partition names: the book's two (vjezba, druga), then the same pattern. Data, not words: never translated. */
  var NAMES = ['vjezba', 'druga', 'treca', 'cetvrta', 'peta', 'sesta', 'sedma', 'osma'];
  var MAX_PARTS = 8;

  var defaults = { disk: '2GiB', parts: 2, sector: 512, oldTool: false, damageHeader: false };

  function clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(Number(v) || 0))); }
  function devName(num) { return DEV + num; }

  // ── the disk and the request ──

  function diskOf(p) {
    var key = DISKS[p.disk] ? p.disk : defaults.disk;
    var ss = Number(p.sector) === 4096 ? 4096 : 512;
    var bytes = DISKS[key].bytes;
    return { key: key, bytes: bytes, sectorSize: ss, sectors: bytes / ss, perMiB: MIB / ss };
  }

  /** The last sector of the last whole MiB that ends at or before sector x (1 MiB alignment of a partition's end). */
  function alignEnd(x, perMiB) { return Math.floor((x + 1) / perMiB) * perMiB - 1; }

  /** The request: n partitions, made one after another; each new one takes the second half of the last one, so the
      ones made before stay where they are. Boundary k (1 … n - 1) is at (1 - 2^-k) of the disk, in whole MiB; the
      first partition starts at 1 MiB (alignment), the last runs to "100%" (end: null, each table sets it). With two
      this is the book's vjezba 1MiB–1GiB and druga 1GiB–100%. In sectors. */
  function request(d, n) {
    var totalMiB = Math.floor(d.bytes / MIB);
    var at = [1];
    for (var k = 1; k < n; k++) at.push(Math.floor(totalMiB * (1 - Math.pow(2, -k))));
    var out = [];
    for (var j = 0; j < n; j++) {
      out.push({ req: j + 1, start: at[j] * d.perMiB, end: j < n - 1 ? at[j + 1] * d.perMiB - 1 : null });
    }
    return out;
  }

  // ── MBR: four slots in sector 0 (rules 1, 2, 8) ──

  function createMbr() { return { slots: [null, null, null, null], logical: [] }; }

  /** Rule 1: a primary goes into the first empty slot; with all four used it is refused. Mutates t. */
  function addPrimary(t, part) {
    var i = t.slots.indexOf(null);
    if (i < 0) return 'full';
    t.slots[i] = { type: 'primary', num: i + 1, start: part.start, end: part.end, req: part.req };
    return 'ok';
  }

  /** Rule 2: one slot becomes the extended partition, a container for logical ones. At most one. Mutates t. */
  function addExtended(t, start, end) {
    for (var j = 0; j < t.slots.length; j++) if (t.slots[j] && t.slots[j].type === 'extended') return 'exists';
    var i = t.slots.indexOf(null);
    if (i < 0) return 'full';
    t.slots[i] = { type: 'extended', num: i + 1, start: start, end: end };
    return 'ok';
  }

  /** Rule 2: a logical partition lives inside the extended one, behind its own EBR (one sector) and the 1 MiB
      alignment gap after it. Numbered from 5 in creation order, whatever slot the extended partition took. */
  function addLogical(t, region, perMiB) {
    var ext = null;
    for (var j = 0; j < t.slots.length; j++) if (t.slots[j] && t.slots[j].type === 'extended') ext = t.slots[j];
    if (!ext) return 'no-extended';
    t.logical.push({ type: 'logical', num: FIRST_LOGICAL + t.logical.length, ebr: region.start,
      start: region.start + perMiB, end: region.end, req: region.req });
    return 'ok';
  }

  /** Rules 2 and 8: which slots a request of n partitions takes. Up to four: all primary. Five or more: slot 4 becomes
      the extended partition before a fourth primary is made, so three primaries and n - 3 logicals. */
  function planMbr(n) {
    var plan = [];
    if (n <= MBR_SLOTS) { for (var i = 0; i < n; i++) plan.push('primary'); return plan; }
    for (var j = 0; j < MBR_SLOTS - 1; j++) plan.push('primary');
    plan.push('extended');
    return plan;
  }

  /** Rule 3: MBR's start and size are 32-bit sector numbers, so only sectors 0 … 2^32 - 1 can be described. */
  function mbrReach(d) { return Math.min(d.sectors, MBR_FIELD); }

  function mbrLayout(d, req, damaged) {
    var reach = mbrReach(d);
    var lastReach = reach - 1;
    var t = createMbr();
    var missing = [], clipped = [];
    // a part that starts beyond the reach cannot be described at all; one that ends beyond it ends at the reach
    function fit(part) {
      var end = part.end == null ? alignEnd(lastReach, d.perMiB) : part.end;
      if (part.start > lastReach) { missing.push(part.req); return null; }
      if (end > lastReach) { clipped.push(part.req); end = alignEnd(lastReach, d.perMiB); }
      return { req: part.req, start: part.start, end: end };
    }
    var plan = planMbr(req.length);
    var k;
    for (k = 0; k < Math.min(req.length, MBR_SLOTS - (plan[MBR_SLOTS - 1] === 'extended' ? 1 : 0)); k++) {
      var fp = fit(req[k]);
      if (fp) addPrimary(t, fp);
    }
    if (plan[MBR_SLOTS - 1] === 'extended') {
      var logReq = req.slice(MBR_SLOTS - 1);
      var regions = logReq.map(fit).filter(Boolean);
      if (regions.length) {
        addExtended(t, regions[0].start, regions[regions.length - 1].end);
        regions.forEach(function (r) { addLogical(t, r, d.perMiB); });
      }
    }
    var parts = [];
    t.slots.forEach(function (s) { if (s && s.type === 'primary') parts.push(s); });
    t.logical.forEach(function (l) { parts.push(l); });
    parts = parts.map(function (s) {
      var o = { name: devName(s.num), num: s.num, type: s.type, req: s.req, start: s.start, end: s.end };
      if (s.type === 'logical') o.ebr = s.ebr;
      return o;
    });
    return {
      label: 'msdos',
      slots: t.slots.map(function (s) {
        if (!s) return { type: 'empty' };
        return { type: s.type, num: s.num, name: devName(s.num), start: s.start, end: s.end };
      }),
      extended: (function () {   // the slot that holds it is the one source of its extent
        var e = t.slots.filter(function (x) { return x && x.type === 'extended'; })[0];
        return e ? { name: devName(e.num), num: e.num, start: e.start, end: e.end } : null;
      })(),
      logical: parts.filter(function (x) { return x.type === 'logical'; }),
      parts: parts,
      reach: reach,
      lastUsable: lastReach,
      unreachable: d.sectors > MBR_FIELD ? { start: MBR_FIELD, end: d.sectors - 1, bytes: (d.sectors - MBR_FIELD) * d.sectorSize } : null,
      missing: missing,
      clipped: clipped,
      damaged: !!damaged,      // sector 0 unreadable: there is no second copy, so nothing is described
      readable: !damaged
    };
  }

  // ── GPT (rules 4–7) ──

  /** Rule 7: where GPT keeps its structures on a disk of `sectors` sectors of `ss` bytes. */
  function gptLayout(sectors, ss) {
    var entrySectors = GPT_ENTRIES * GPT_ENTRY_BYTES / ss;
    var last = sectors - 1;
    return {
      protectiveAt: 0,
      headerAt: 1,
      entriesAt: 2,
      entrySectors: entrySectors,
      firstUsable: 2 + entrySectors,
      lastUsable: last - 1 - entrySectors,
      backupEntriesAt: last - entrySectors,
      backupAt: last
    };
  }

  /** Rule 6: the protective MBR in sector 0 holds one entry of type 0xEE from sector 1 over the whole disk, as far as
      a 32-bit size reaches. */
  function protectiveEntry(sectors) {
    var size = Math.min(sectors - 1, MBR_FIELD - 1);
    return { type: 'ee', start: 1, end: size, sectors: size };
  }

  function gptLayoutFor(d, req, damaged, oldTool) {
    var L = gptLayout(d.sectors, d.sectorSize);
    var entries = req.map(function (r, i) {
      var end = r.end == null ? alignEnd(L.lastUsable, d.perMiB) : r.end;   // rule 5: "100%" stops before the backup
      return { name: devName(i + 1), num: i + 1, label: NAMES[i], req: r.req, start: r.start, end: end };
    });
    var pe = protectiveEntry(d.sectors);
    return {
      label: 'gpt',
      entries: entries,
      entryCount: GPT_ENTRIES,
      entrySectors: L.entrySectors,
      headerAt: L.headerAt,
      firstUsable: L.firstUsable,
      lastUsable: L.lastUsable,
      backupEntriesAt: L.backupEntriesAt,
      backupAt: L.backupAt,
      protective: pe,
      protectiveEnd: pe.end,
      protectiveShort: d.sectors - 1 > pe.end,     // the 0xEE entry cannot cover a disk past 2^32 sectors
      primaryOk: !damaged,
      readFrom: damaged ? 'backup' : 'primary',     // rule 5: a damaged primary header is read from the backup
      restorable: !!damaged,
      oldTool: !!oldTool                            // rule 6: the page shows what an MBR-only tool sees
    };
  }

  // ── how sizes are printed (data, not words: units are never translated) ──

  /** A byte count as the partitioning tool's table prints it (SPEC.md "Numbers"): decimal units, the unit chosen so
      the number is at least 10 of it, then 2, 1 or 0 decimals by size. The book's 2147483648-byte disk is "2147MB". */
  function compact(b) {
    var u, n;
    if (b >= 1e13) { u = 1e12; n = 'TB'; } else if (b >= 1e10) { u = 1e9; n = 'GB'; }
    else if (b >= 1e7) { u = 1e6; n = 'MB'; } else if (b >= 1e4) { u = 1e3; n = 'kB'; } else return b + 'B';
    var d = b / u * (1 + Number.EPSILON);
    var w = d + (d < 10 ? 0.005 : d < 100 ? 0.05 : 0.5);
    return d.toFixed(w < 10 ? 2 : w < 100 ? 1 : 0) + n;
  }

  /** A byte count as the block-device list prints it: binary units, the whole part and one decimal rounded from three
      truncated ones, no decimal when it rounds to 0 (1023M, 2G, 3.6T; SPEC.md "Numbers"). */
  function human(b) {
    var units = ['B', 'K', 'M', 'G', 'T', 'P', 'E'], i = 0;
    while (i < units.length - 1 && b >= Math.pow(1024, i + 1)) i++;
    var p = Math.pow(1024, i);
    var whole = Math.floor(b / p);
    var frac = Math.floor((b - whole * p) * 1000 / p);
    frac = Math.floor((frac + 50) / 100);
    if (frac === 10) { whole++; frac = 0; }
    return whole + (frac ? '.' + frac : '') + units[i];
  }

  // ── the explorer ──

  function compute(p) {
    var d = diskOf(p);
    var n = clampInt(p.parts, 1, MAX_PARTS);
    var req = request(d, n);
    var mbr = mbrLayout(d, req, p.damageHeader);
    var gpt = gptLayoutFor(d, req, p.damageHeader, p.oldTool);
    var warnings = [];
    if (mbr.extended) warnings.push('mbr-extended');
    if (mbr.unreachable) warnings.push('mbr-unreachable');
    if (mbr.clipped.length) warnings.push('mbr-clipped');
    if (mbr.missing.length) warnings.push('mbr-missing');
    if (mbr.damaged) warnings.push('mbr-lost');
    if (gpt.readFrom === 'backup') warnings.push('gpt-from-backup');
    if (gpt.oldTool) warnings.push('old-tool-sees-ee');
    if (gpt.oldTool && gpt.protectiveShort) warnings.push('protective-short');
    return {
      disk: d.key,
      dev: DEV,
      bytes: d.bytes,
      sectorSize: d.sectorSize,
      sectors: d.sectors,
      perMiB: d.perMiB,
      n: n,
      mbrLimitBytes: MBR_FIELD * d.sectorSize,
      mbr: mbr,
      gpt: gpt,
      warnings: warnings
    };
  }

  function initial(p) { return compute(p); }

  // ── what the page draws: regions, and which of them changed ──

  /** Every drawn region of one strip, keyed, with its sectors: metadata, partitions, the extended container, EBRs,
      the unreachable area, and the view regions of the toggles (the old tool's 0xEE entry, a damaged header). */
  function regions(s, which) {
    var out = [];
    if (which === 'mbr') {
      var m = s.mbr;
      out.push({ key: 'mbr-0', kind: m.damaged ? 'damaged' : 'meta', start: 0, end: 0 });
      m.slots.forEach(function (x, i) { out.push({ key: 'slot-' + (i + 1), kind: m.readable ? x.type : 'lost', start: 0, end: 0, name: x.name }); });
      m.parts.forEach(function (x) {
        out.push({ key: 'part-' + x.req, kind: m.readable ? x.type : 'lost', start: x.start, end: x.end, name: x.name });
        if (x.type === 'logical') out.push({ key: 'ebr-' + x.num, kind: 'ebr', start: x.ebr, end: x.ebr });
      });
      if (m.extended) out.push({ key: 'ext', kind: 'extended', start: m.extended.start, end: m.extended.end, name: m.extended.name });
      if (m.unreachable) out.push({ key: 'unreach', kind: 'unreachable', start: m.unreachable.start, end: m.unreachable.end });
      return out;
    }
    var g = s.gpt;
    out.push({ key: 'pmbr', kind: 'meta', start: 0, end: 0 });
    out.push({ key: 'hdr', kind: g.primaryOk ? 'meta' : 'damaged', start: g.headerAt, end: g.headerAt });
    out.push({ key: 'ent', kind: 'meta', start: 2, end: g.firstUsable - 1, name: String(g.entries.length) });
    g.entries.forEach(function (x) { out.push({ key: 'part-' + x.req, kind: 'part', start: x.start, end: x.end, name: x.name }); });
    out.push({ key: 'bent', kind: 'meta', start: g.backupEntriesAt, end: g.backupAt - 1 });
    out.push({ key: 'bhdr', kind: g.readFrom === 'backup' ? 'read' : 'meta', start: g.backupAt, end: g.backupAt });
    if (g.oldTool) out.push({ key: 'ee', kind: 'protective', start: g.protective.start, end: g.protective.end });
    return out;
  }

  /** Keys of the regions that appeared, moved, were renamed or changed kind between two states (per strip). */
  function changedRegions(a, b) {
    var out = { mbr: [], gpt: [] };
    if (!a || !b) return out;
    ['mbr', 'gpt'].forEach(function (w) {
      var before = {};
      regions(a, w).forEach(function (r) { before[r.key] = r; });
      regions(b, w).forEach(function (r) {
        var o = before[r.key];
        if (!o || o.start !== r.start || o.end !== r.end || o.kind !== r.kind || o.name !== r.name) out[w].push(r.key);
      });
    });
    return out;
  }

  function lastEnd(list) { return list.reduce(function (m, x) { return Math.max(m, x.end); }, -1); }

  /** Which caption explains the state, and the notes after it (the page words them). With no damage, old tool, limit
      or extended partition: 'cEnds' when GPT's "100%" ends before MBR's (the backup shows), 'cEndsSame' when both end
      on the same last whole MiB (1 TB, or 4 TB with 4096-byte sectors: the backup fits in the alignment remainder). */
  function captionKey(s) {
    var key;
    if (s.mbr.damaged) key = 'cDamaged';
    else if (s.gpt.oldTool) key = s.gpt.protectiveShort ? 'cOldToolShort' : 'cOldTool';
    else if (s.mbr.unreachable) key = 'cUnreachable';
    else if (s.mbr.extended) key = 'cLogical';
    else if (s.n === MBR_SLOTS) key = 'cFour';
    else key = lastEnd(s.gpt.entries) === lastEnd(s.mbr.parts) ? 'cEndsSame' : 'cEnds';
    var notes = [];
    if (s.mbr.unreachable && key !== 'cUnreachable') notes.push({ key: 'nUnreachable' });
    if (key === 'cDamaged' && s.gpt.oldTool) notes.push({ key: 'nOldToo' });
    if (s.mbr.missing.length) notes.push({ key: 'nMissing', n: s.mbr.missing.length });
    if (s.sectorSize === 4096 && s.bytes > MBR_FIELD * 512 && !s.mbr.unreachable) notes.push({ key: 'n4k' });
    return { key: key, notes: notes };
  }

  var presets = [
    { id: 'book-vdb', params: { disk: '2GiB', parts: 2, sector: 512, oldTool: false, damageHeader: false } },
    { id: 'four-tb', params: { disk: '4TB', parts: 1, sector: 512, oldTool: false, damageHeader: false } },
    { id: 'five-parts', params: { disk: '2GiB', parts: 5, sector: 512, oldTool: false, damageHeader: false } },
    { id: 'old-tool', params: { disk: '2GiB', parts: 2, sector: 512, oldTool: true, damageHeader: false } },
    { id: 'damaged-header', params: { disk: '2GiB', parts: 2, sector: 512, oldTool: false, damageHeader: true } }
  ];

  var logic = {
    defaults: defaults,
    initial: initial,
    presets: presets,
    compute: compute,
    request: request,
    alignEnd: alignEnd,
    createMbr: createMbr,
    addPrimary: addPrimary,
    addExtended: addExtended,
    addLogical: addLogical,
    planMbr: planMbr,
    gptLayout: gptLayout,
    protectiveEntry: protectiveEntry,
    regions: regions,
    changedRegions: changedRegions,
    captionKey: captionKey,
    mbrLayout: mbrLayout,
    compact: compact,
    human: human,
    DISKS: DISKS,
    NAMES: NAMES,
    MIB: MIB,
    MBR_FIELD: MBR_FIELD,
    MAX_PARTS: MAX_PARTS
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
