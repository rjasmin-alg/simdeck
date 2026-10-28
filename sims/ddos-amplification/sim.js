/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ddos-amplification: spoofed small requests become large replies at the victim. An explorer — the state
   is derived from the params, no steps. The student picks a public UDP service (its amplification factor, BAF, from
   US-CERT/CISA Alert TA14-017A), the sent rate, the victim's access-link capacity, and the defences. Rules, the BAF
   figures with their source, and the presets: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /* Bandwidth amplification factor per service: reply UDP payload bytes / request UDP payload bytes.
     Figures from US-CERT/CISA Alert TA14-017A "UDP-Based Amplification Attacks" (last revised 2019-12-18). A range
     row is represented by the top of its range (the worst case); see SPEC.md. The keys are internal; the page shows
     the label beside each (data, language-neutral). */
  var SERVICES = [
    { id: 'dns', label: 'DNS (open resolver)', baf: 54 },    // alert: DNS 28 to 54
    { id: 'snmp', label: 'SNMPv2', baf: 6.3 },               // alert: SNMPv2 6.3
    { id: 'ssdp', label: 'SSDP', baf: 30.8 },                // alert: SSDP 30.8
    { id: 'ntp', label: 'NTP', baf: 556.9 }                  // alert: NTP 556.9
  ];
  function serviceOf(id) { for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) return SERVICES[i]; return SERVICES[0]; }

  function round1(x) { return Math.round(x * 10) / 10; }

  /**
   * The derived state for the params (SPEC.md "State"). Defence order is fixed and deterministic:
   * ingress filtering zeroes the sent rate at the source, so nothing reaches the reflectors; closing the services
   * zeroes the reflected rate; rate-limiting halves what is left; a victim-edge filter changes nothing numeric
   * (rule 6: the access link is already full upstream of it).
   */
  function stateOf(p) {
    var svc = serviceOf(p.service);
    var baf = svc.baf;
    var sentMbps = p.sentMbps;
    var victimCapacity = p.victimMbps;

    var ingress = !!p.ingressFiltering, closed = !!p.reflectorsClosed, limit = !!p.rateLimit, vfilter = !!p.victimFilter;

    var sentEffective = ingress ? 0 : sentMbps;          // rule 6a (BCP 38): forged requests never leave
    var base = sentEffective * baf;                       // rule 3: reflected = sent × BAF
    var afterClose = closed ? 0 : base;                  // rule 6b: no service answers
    var afterLimit = limit ? afterClose * 0.5 : afterClose; // rule 6b: illustrative half
    var reflectedMbps = round1(afterLimit);

    // rule 6c: a filter at the victim's edge drops the flood only after the access link, so load is unchanged.
    var load = victimCapacity > 0 ? reflectedMbps / victimCapacity : 0;   // not clamped: can read > 1
    var saturated = reflectedMbps >= victimCapacity;                      // rule 4, boundary inclusive
    var effectiveMbps = Math.max(0, round1(victimCapacity - reflectedMbps)); // headroom; clamped at 0

    return {
      service: svc.id, serviceLabel: svc.label, baf: baf,
      sentMbps: sentMbps, sentEffective: sentEffective,
      reflectedMbps: reflectedMbps,
      victimCapacity: victimCapacity,
      load: load, loadPct: Math.round(load * 100), times: round1(load),
      saturated: saturated,
      effectiveMbps: effectiveMbps,
      defences: { ingressFiltering: ingress, reflectorsClosed: closed, rateLimit: limit, victimFilter: vfilter },
      stopped: { atSource: ingress, atReflector: !ingress && closed }
    };
  }

  var logic = {
    SERVICES: SERVICES, serviceOf: serviceOf, round1: round1, stateOf: stateOf,

    defaults: {
      service: 'dns',
      sentMbps: 10,
      victimMbps: 1000,
      ingressFiltering: false,
      reflectorsClosed: false,
      rateLimit: false,
      victimFilter: false
    },

    /** SPEC.md "Presets": each sets the params from the defaults; the arithmetic follows rule 3. */
    presets: [
      { id: 'book-dns', params: {} },
      { id: 'saturation', params: { victimMbps: 100 } },
      { id: 'larger-factor', params: { service: 'ntp' } },
      { id: 'ingress-filtering', params: { victimMbps: 100, ingressFiltering: true } },
      { id: 'victim-side-filter', params: { victimMbps: 100, victimFilter: true } }
    ],

    /** Explorer: the derived state for the params. */
    initial: function (p) { return stateOf(p); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
