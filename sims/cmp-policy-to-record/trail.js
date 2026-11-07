/* SPDX-License-Identifier: AGPL-3.0-or-later
   The evidence-trail model: a requirement's chain (policy, standard, procedure) and its records over an audit
   period, walked top to bottom the way an auditor walks it. The first failing layer breaks the trail; a break above
   the records is a design finding, a whole chain with uncovered periods an operating one. SPEC.md rules 1-5.
   Catalogue §5.24: cmp-policy-to-record is the hub of this model (cmp-audit-sampling draws from it,
   cmp-restore-evidence and cmp-log-evidence fill it), so it is pure functions over plain data, no words and no
   dependencies, ready for the coordinator to promote to models/trail.js unchanged (models/README.md). In a page it
   registers on globalThis.SimdeckModels.trail; under node it is module.exports. */
(function (root) {
  'use strict';

  /** Months per period (rule 1). */
  var FREQ = { monthly: 1, quarterly: 3, yearly: 12 };
  var LAYERS = ['policy', 'standard', 'procedure', 'records'];

  function monthsPer(freq) {
    if (!Object.prototype.hasOwnProperty.call(FREQ, freq)) throw new Error('trail: unknown frequency ' + freq);
    return FREQ[freq];
  }

  /** The periods of an audit period of `months` months (rule 1): [{ index, from, to }], months counted from 1. */
  function periods(freq, months) {
    var f = monthsPer(freq), out = [];
    for (var k = 0; k * f < months; k++) out.push({ index: k, from: k * f + 1, to: Math.min((k + 1) * f, months) });
    return out;
  }

  /** Which period a month falls in, or -1 outside 1…months (rule 2). */
  function periodOf(month, freq, months) {
    if (typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > months) return -1;
    return Math.floor((month - 1) / monthsPer(freq));
  }

  /** Coverage of the periods by records dated in months (rule 2): [{ index, from, to, count, ok }].
      Records outside the audit period are ignored; two records in one period count once towards `ok`. */
  function coverage(records, freq, months) {
    var out = periods(freq, months).map(function (p) { return { index: p.index, from: p.from, to: p.to, count: 0, ok: false }; });
    (records || []).forEach(function (m) {
      var k = periodOf(m, freq, months);
      if (k < 0) return;
      out[k].count += 1;
      out[k].ok = true;
    });
    return out;
  }

  /** Records inside the audit period, in date order. */
  function inPeriod(records, months) {
    return (records || []).filter(function (m) { return typeof m === 'number' && Number.isInteger(m) && m >= 1 && m <= months; })
      .slice().sort(function (a, b) { return a - b; });
  }

  /** Walk a chain (rules 3-5). chain = { policy: bool, standard: 'measurable'|'vague'|'missing', procedure: bool,
      freq, records: [months] }. Returns { checks: [{ layer, status, inTrail }], breakAt, finding }. */
  function walk(chain, months) {
    var recs = inPeriod(chain.records, months);
    var measurable = chain.standard === 'measurable';
    var cov = measurable ? coverage(recs, chain.freq, months) : null;
    var covered = cov ? cov.filter(function (p) { return p.ok; }).length : null;
    var status = {
      policy: chain.policy ? 'ok' : 'missing',
      standard: measurable ? 'ok' : chain.standard === 'vague' ? 'vague' : 'missing',
      procedure: chain.procedure ? 'ok' : 'missing',
      records: cov
        ? (covered === cov.length ? 'ok' : covered === 0 ? 'none' : 'gaps')
        : (recs.length ? 'found' : 'none')
    };
    var breakAt = null;
    var checks = LAYERS.map(function (layer) {
      var inTrail = breakAt === null;
      if (inTrail && layer !== 'records' && status[layer] !== 'ok') breakAt = layer;
      return { layer: layer, status: status[layer], inTrail: inTrail };
    });
    var finding = {
      kind: 'none',
      reason: null,
      expected: cov ? cov.length : null,
      found: cov ? covered : recs.length,
      missing: cov ? cov.filter(function (p) { return !p.ok; }).map(function (p) { return p.index; }) : [],
      last: recs.length ? recs[recs.length - 1] : null
    };
    if (breakAt === 'policy') { finding.kind = 'design'; finding.reason = 'no-policy'; }
    else if (breakAt === 'standard') { finding.kind = 'design'; finding.reason = status.standard === 'vague' ? 'vague-standard' : 'no-standard'; }
    else if (breakAt === 'procedure') { finding.kind = 'design'; finding.reason = 'no-procedure'; }
    else if (status.records === 'none') { finding.kind = 'operation'; finding.reason = 'not-operating'; }
    else if (status.records === 'gaps') { finding.kind = 'operation'; finding.reason = 'gaps'; }
    return { checks: checks, breakAt: breakAt, finding: finding, coverage: cov };
  }

  var model = {
    FREQ: FREQ, LAYERS: LAYERS, periods: periods, periodOf: periodOf, coverage: coverage, inPeriod: inPeriod, walk: walk
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).trail = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
